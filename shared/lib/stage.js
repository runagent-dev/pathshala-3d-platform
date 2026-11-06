/**
 * Shared renderer + scene + camera + orbit controls with render-on-demand.
 *
 * Every Pathshala asset uses this so they behave the same inside the book: frames are only drawn
 * when something changes (battery-friendly on tablets), pixel ratio is capped, lighting is the
 * same neutral studio environment.
 *
 * Kept smooth on phones (kit 1.4.0), with nothing taken out of the picture:
 * - shadows are drawn again only when the scene changes (invalidate(), a ticker that returns true, a resize, or a
 *   direct render()), never for a frame where only the camera moved: turning the view costs one pass, not three
 *   (soft VSM shadows draw the casters and blur twice);
 * - nothing runs while the figure is off screen or the page is hidden (a book page holds many figures);
 * - if frames keep coming slower than about 40 a second while something moves, the pixel ratio steps down by a
 *   quarter at a time, never below 1 (a phone that cannot keep up gets a slightly softer picture, not a stutter).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Product-photography style environment: dark floor, soft grey walls and a few long softboxes.
 * Metals read much better against this than against a uniformly bright room.
 */
export function createStudioEnvironment({ key = 1, front = 1, light = false } = {}) {
  const scene = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(100, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        // light: a white room (for figures on a white page); otherwise a dark photo studio
        top: { value: light ? new THREE.Color(0.78, 0.8, 0.83) : new THREE.Color(0.32, 0.34, 0.37) },
        horizon: { value: light ? new THREE.Color(0.52, 0.54, 0.57) : new THREE.Color(0.16, 0.17, 0.19) },
        bottom: { value: light ? new THREE.Color(0.2, 0.21, 0.23) : new THREE.Color(0.025, 0.027, 0.03) },
      },
      vertexShader:
        'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vDir;
        void main(){ float y = vDir.y; vec3 c = y > 0.0 ? mix(horizon, top, smoothstep(0.0, 0.8, y)) : mix(horizon, bottom, smoothstep(0.0, 0.35, -y));
        gl_FragColor = vec4(c, 1.0); }`,
    }),
  );
  scene.add(sky);
  const panel = (w, h, pos, intensity) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.fromArray(pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel(70, 34, [0, 14, 60], 1.15 * front); // large soft front light (what flat faces facing the viewer reflect)
  panel(90, 7, [0, 55, 25], 4.5 * key); // long overhead strip: highlights along top edges
  panel(8, 60, [-62, 10, 18], 2.6 * key); // left strip
  panel(8, 60, [62, 10, -12], 2.0 * key); // right-back strip
  panel(60, 5, [0, -20, 55], 0.9 * front); // low front kicker so bottom edges aren't black
  return scene;
}

/**
 * Runs fn with the given objects shown (each one, everything inside it and everything above it), then puts every
 * `visible` back as it was. Nothing is drawn in between, so no one ever sees them: it is for preparing hidden parts
 * (compiling their shaders, measuring them, exporting them) without a flash.
 * @template T
 * @param {THREE.Object3D | null | undefined | Array<THREE.Object3D | null | undefined>} objects
 * @param {() => T} fn
 * @returns {T}
 */
export function withShown(objects, fn) {
  /** @type {Array<[THREE.Object3D, boolean]>} */
  const saved = [];
  const seen = new Set();
  /** @param {THREE.Object3D} o */
  const show = (o) => {
    if (seen.has(o)) return;
    seen.add(o);
    saved.push([o, o.visible]);
    o.visible = true;
  };
  for (const root of [objects].flat()) {
    if (!root) continue;
    root.traverse(show);
    for (let p = root.parent; p; p = p.parent) show(p);
  }
  try {
    return fn();
  } finally {
    for (let i = saved.length - 1; i >= 0; i--) saved[i][0].visible = saved[i][1];
  }
}

/**
 * @typedef {object} WarmUpTarget a render target the figure draws into (a mirror, a small picture) and what it draws there
 * @property {THREE.WebGLRenderTarget} target
 * @property {THREE.Object3D} [scene] what is drawn into it (default the stage's scene)
 * @property {THREE.Camera} [camera] the camera it is drawn with (default the stage's camera)
 */
/**
 * @typedef {object} WarmUpOptions
 * @property {THREE.Object3D | Array<THREE.Object3D | null | undefined>} [show] hidden parts to show for the compile (and
 *   put back at once), so that lights or parts that only appear in a later step are compiled as they will be drawn
 * @property {THREE.Object3D[]} [objects] parts not (yet) in the scene, compiled as if they were in it
 * @property {WarmUpTarget[]} [targets] render targets the figure draws into, compiled with their own output (linear
 *   colour, no tone mapping) as three.js does for a render target
 * @property {boolean} [shadows] also draw the shadow maps once with the shown parts in them, so the shadow pass has its
 *   shaders too (default: when a shown part casts a shadow and shadows are on). Only the maps are drawn, never the
 *   canvas, and they are drawn again as they really are before the next frame.
 */

export function createStage(container, options = {}) {
  const {
    fov = 30,
    near = 1,
    far = 5000,
    maxPixelRatio = 2,
    toneMapping = THREE.NeutralToneMapping,
    exposure = 1,
    environment = 'studio', // 'studio' | 'studio-light' | 'room' | false
    environmentIntensity = 1,
    shadows = 'on-change', // 'on-change': shadow maps follow the scene, not the camera; 'always': every frame
    adaptive = true, // lower the pixel ratio (not below 1) when frames keep coming slowly
    warmUp: autoWarm = true, // compile every material in the scene in the background once the first frame is drawn
  } = options;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  let ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  renderer.setPixelRatio(ratio);
  // shadow maps are drawn when the scene changed (see sceneDirty), so a frame where only the camera moved skips them
  if (shadows !== 'always') renderer.shadowMap.autoUpdate = false;
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = toneMapping;
  renderer.toneMappingExposure = exposure;

  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;outline:none;';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  if (environment) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = environment === 'room' ? new RoomEnvironment() : createStudioEnvironment({ light: environment === 'studio-light' });
    scene.environment = pmrem.fromScene(envScene, 0.035).texture;
    scene.environmentIntensity = environmentIntensity;
    pmrem.dispose();
  }

  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;

  const tickers = new Set();
  const before = new Set();
  const after = new Set();
  const resizers = new Set();
  let width = 1;
  let height = 1;
  let dirty = true;
  let sceneDirty = true; // something in the scene (not only the camera) changed since the last frame
  let running = true;
  let onScreen = true; // the container is in view (IntersectionObserver); the page's own visibility is checked too

  function resize() {
    const r = container.getBoundingClientRect();
    width = Math.max(1, Math.round(r.width));
    height = Math.max(1, Math.round(r.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    for (const fn of resizers) fn(width, height);
    dirty = true;
    sceneDirty = true;
  }
  // setSize clears the canvas, so draw again at once: waiting for the next frame shows one blank frame (a white
  // flash on a phone when it turns, or when the panel under the view changes height)
  const ro = new ResizeObserver(() => {
    resize();
    if (!running) return;
    dirty = false;
    render();
  });
  ro.observe(container);
  resize();
  const io =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((entries) => {
          const was = onScreen;
          onScreen = entries[entries.length - 1].isIntersecting;
          if (onScreen && !was) dirty = true;
        })
      : null;
  io?.observe(container);
  const onVisibility = () => {
    if (!document.hidden) dirty = true;
  };
  document.addEventListener('visibilitychange', onVisibility);

  controls.addEventListener('change', () => (dirty = true));

  function render() {
    for (const fn of before) fn();
    if (sceneDirty) {
      renderer.shadowMap.needsUpdate = true;
      // a directional light's shadow box (left/right/top/bottom/near/far) only takes effect after
      // updateProjectionMatrix(), which three.js never calls for it: apply what the figure set
      if (renderer.shadowMap.enabled) scene.traverseVisible(applyShadowBox);
    }
    sceneDirty = false;
    renderer.render(scene, camera);
    for (const fn of after) fn();
    if (!drawnOnce) {
      // the figure has built its scene and the first frame is up (three settles some of its state, such as the shadow
      // type, in that frame): warm-ups start now, the whole scene first unless the figure turned it off
      drawnOnce = true;
      firstFrame();
      if (autoWarm && !asked) warmUp();
    }
  }

  // ── compiling ahead: three.js compiles a material's shader the first time it is drawn, which on a slow phone is a
  // freeze of a few hundred milliseconds the first time a step shows new parts. warmUp() does it ahead, in the background:
  // - renderer.compileAsync for the scene, the figure's render targets and parts not yet in the scene (with the
  //   KHR_parallel_shader_compile extension the browser compiles them off the main thread);
  // - materials with their own clipping planes are drawn once instead, as copies into a hidden 1×1 target, one at a
  //   time: three's compile() keys them by the clipping state the last frame left behind, not by their own planes;
  // - the shadow maps once, when a hidden part that casts a shadow was shown for it;
  // - each program's first use (its uniform locations), one at a time.
  // Nothing is drawn to the canvas, and every `visible` the figure set is back before the next frame.
  const idle = () => new Promise((r) => setTimeout(r, 0));
  let drawnOnce = false;
  let asked = false; // the figure asked for a warm-up before the first frame: that one covers the whole scene
  /** @type {() => void} */
  let firstFrame = () => {};
  /** @type {Promise<unknown>} every warm-up waits for the first frame, then for the one before it */
  let warming = new Promise((r) => (firstFrame = () => r(undefined))).then(idle);
  /** @param {THREE.Material | THREE.Material[] | null | undefined} m */
  const clipped = (m) => renderer.localClippingEnabled && [m].flat().some((x) => (x?.clippingPlanes?.length ?? 0) > 0);
  /** @param {THREE.Object3D} o */
  const drawable = (o) => {
    const m = /** @type {THREE.Mesh} */ (o);
    return (
      Boolean(m.material) && Boolean(m.isMesh || /** @type {any} */ (o).isLine || /** @type {any} */ (o).isPoints || /** @type {any} */ (o).isSprite)
    );
  };
  /**
   * The parts under root: those compiled ahead, and those with their own clipping planes, which are drawn instead.
   * @param {THREE.Object3D} root
   */
  function split(root) {
    /** @type {THREE.Mesh[]} */
    const parts = [];
    /** @type {THREE.Mesh[]} */
    const clips = [];
    root.traverse((o) => {
      if (!drawable(o)) return;
      const m = /** @type {THREE.Mesh} */ (o);
      (clipped(m.material) ? clips : parts).push(m);
    });
    return { parts, clips };
  }
  /**
   * renderer.compileAsync for each of these parts under root, one part per call (the others' materials are taken off
   * for the call), with a pause after each one that made a new program: compiling a whole scene in one go is itself a
   * long task on a slow phone. `into` is the scene that lights them (default root), `rt` the target they are drawn into.
   * @param {THREE.Object3D} root @param {THREE.Mesh[]} parts @param {THREE.Camera} cam
   * @param {THREE.WebGLRenderTarget | null} rt @param {THREE.Object3D | null} into @param {THREE.Object3D[]} shown
   * @param {Promise<unknown>[]} jobs
   */
  async function compileParts(root, parts, cam, rt, into, shown, jobs) {
    /** @type {THREE.Mesh[]} */
    const all = [];
    root.traverse((o) => {
      if (drawable(o)) all.push(/** @type {THREE.Mesh} */ (o));
    });
    const mats = all.map((m) => m.material);
    let since = 0;
    for (const part of parts) {
      if (!running) return;
      const count = renderer.info.programs?.length ?? 0;
      withShown(shown, () => {
        // compile() skips an object without a material: the others' are taken off for this call only
        for (const m of all) if (m !== part) m.material = /** @type {any} */ (null);
        const before = renderer.getRenderTarget();
        try {
          if (rt) renderer.setRenderTarget(rt);
          const target = /** @type {THREE.Scene | null} */ (into);
          if (typeof renderer.compileAsync === 'function') jobs.push(renderer.compileAsync(root, cam, target));
          else renderer.compile(root, cam, target);
        } finally {
          if (rt) renderer.setRenderTarget(before);
          all.forEach((m, i) => (m.material = mats[i]));
        }
      });
      // a pause after a new program, and every few parts anyway (a part already compiled still costs a little)
      if ((renderer.info.programs?.length ?? 0) > count || ++since >= 8) {
        since = 0;
        await idle();
      }
    }
  }
  /**
   * A small scene of copies (sharing geometry and material) of the clipped parts and of the lights shining now, to be
   * drawn into a 1×1 target. `canvas`: drawn as on the canvas (sRGB, tone mapped) rather than as into a render target.
   * @param {THREE.Mesh[]} meshes @param {THREE.Object3D} from @param {THREE.Camera} cam @param {boolean} canvas
   */
  function copies(meshes, from, cam, canvas) {
    if (!meshes.length) return null;
    const s = new THREE.Scene();
    const src = /** @type {THREE.Scene} */ (from);
    s.environment = src.environment ?? null;
    s.environmentIntensity = src.environmentIntensity ?? 1;
    s.fog = src.fog ?? null;
    from.traverseVisible((o) => {
      if (/** @type {THREE.Light} */ (o).isLight) s.add(o.clone(false));
    });
    /** @type {THREE.Object3D[]} */
    const parts = [];
    for (const m of new Set(meshes)) {
      try {
        const c = m.clone(false);
        c.visible = true;
        c.frustumCulled = false;
        c.matrixAutoUpdate = false;
        c.matrix.copy(m.matrixWorld);
        c.matrixWorld.copy(m.matrixWorld);
        parts.push(c);
      } catch {
        // a part that cannot be copied is compiled the first time it is drawn, as before
      }
    }
    const target = new THREE.WebGLRenderTarget(1, 1);
    if (canvas) {
      // three gives a render target marked like this the canvas's colour space and tone mapping: the canvas's shaders
      /** @type {any} */ (target).isXRRenderTarget = true;
      target.texture.colorSpace = renderer.outputColorSpace;
    }
    return { scene: s, parts, cam, target };
  }
  /** Draws each copy alone into its 1×1 target, one per task. @param {ReturnType<typeof copies>} job */
  async function draw(job) {
    if (!job) return;
    const { scene: s, parts, cam, target } = job;
    const before = renderer.getRenderTarget();
    const autoClear = renderer.autoClear;
    try {
      for (const c of parts) {
        if (!running) return;
        s.add(c);
        renderer.setRenderTarget(target);
        renderer.autoClear = true;
        renderer.render(s, cam);
        renderer.autoClear = autoClear;
        renderer.setRenderTarget(before);
        s.remove(c);
        await idle();
      }
    } finally {
      renderer.autoClear = autoClear;
      renderer.setRenderTarget(before);
      target.dispose();
      s.traverse((o) => /** @type {THREE.Light} */ (o).dispose?.());
    }
  }
  function shadowPass() {
    /** @type {THREE.Light[]} */
    const lights = [];
    scene.traverseVisible((o) => {
      const light = /** @type {THREE.Light} */ (o);
      if (light.isLight && light.castShadow && light.layers.test(camera.layers)) lights.push(light);
    });
    if (!lights.length) return;
    // shadow maps only, never the canvas; the next frame draws them again as they really are
    scene.updateMatrixWorld();
    renderer.shadowMap.needsUpdate = true;
    renderer.shadowMap.render(lights, scene, camera);
    renderer.shadowMap.needsUpdate = false;
    sceneDirty = true;
  }
  /** @type {WeakSet<object>} */
  const used = new WeakSet();
  /**
   * A program's first use (its uniform and attribute locations) waits for the browser to finish it. With the
   * KHR_parallel_shader_compile extension compileAsync has already waited off the main thread and this is quick; without
   * it the browser compiles only when asked, so ask now, one program per task, while the student is still reading.
   */
  async function firstUse() {
    for (const p of /** @type {any[]} */ (renderer.info.programs ?? [])) {
      if (!running) return;
      if (used.has(p)) continue;
      used.add(p);
      p.getUniforms?.();
      await idle();
    }
  }
  /** @param {WarmUpOptions} opts */
  async function warmOnce(opts) {
    if (!running) return;
    const shown = [opts.show].flat().filter((o) => o != null);
    /** @type {Promise<unknown>[]} */
    const jobs = [];
    /** @type {Array<ReturnType<typeof copies>>} */
    const drawn = [];
    let casts = false;
    withShown(shown, () => {
      scene.updateMatrixWorld();
      for (const o of opts.objects ?? []) o.updateMatrixWorld();
      for (const { scene: sc } of opts.targets ?? []) sc?.updateMatrixWorld();
      for (const o of shown) o.traverse((n) => (casts ||= /** @type {THREE.Mesh} */ (n).isMesh && n.castShadow));
    });
    const main = split(scene);
    const extra = (opts.objects ?? []).map((o) => ({ root: o, ...split(o) }));
    const targets = (opts.targets ?? []).map(({ target, scene: s = scene, camera: c = camera }) => ({ target, s, c, ...split(s) }));
    await compileParts(scene, main.parts, camera, null, null, shown, jobs);
    for (const x of extra) await compileParts(x.root, x.parts, camera, null, scene, shown, jobs);
    for (const t of targets) await compileParts(t.s, t.parts, t.c, t.target, null, shown, jobs);
    withShown(shown, () => {
      drawn.push(copies([...main.clips, ...extra.flatMap((x) => x.clips)], scene, camera, true));
      for (const t of targets) drawn.push(copies(t.clips, t.s, t.c, false));
    });
    await Promise.all(jobs);
    for (const job of drawn) await draw(job);
    if (!running) return;
    if ((opts.shadows ?? casts) && renderer.shadowMap.enabled) withShown(shown, shadowPass);
    await firstUse();
  }
  /**
   * Compiles the scene's materials ahead, so the first time a part is drawn costs nothing.
   * @param {WarmUpOptions} [opts]
   * @returns {Promise<void>}
   */
  function warmUp(opts = {}) {
    if (!drawnOnce) asked = true;
    const next = warming.then(() => warmOnce(opts)).catch((e) => console.warn('stage.warmUp', e));
    warming = next;
    return next;
  }
  /** @param {THREE.Object3D} o */
  function applyShadowBox(o) {
    const light = /** @type {THREE.DirectionalLight} */ (o);
    if (light.isDirectionalLight && light.castShadow) light.shadow.camera.updateProjectionMatrix();
  }
  /** A redraw asked for from outside (capture, a figure's own call): the scene may have changed, so shadows too. */
  function renderAll() {
    sceneDirty = true;
    render();
  }

  // adaptive resolution: the time between frames drawn back to back while something moves
  const SLOW_MS = 25;
  const WINDOW = 30;
  let drewLast = false;
  let lastDraw = 0;
  let slowSum = 0;
  let slowCount = 0;
  function measure(now) {
    if (drewLast) {
      slowSum += now - lastDraw;
      if (++slowCount >= WINDOW) {
        if (slowSum / slowCount > SLOW_MS && ratio > 1) {
          ratio = Math.max(1, ratio - 0.25);
          renderer.setPixelRatio(ratio);
          resize();
        }
        slowSum = 0;
        slowCount = 0;
      }
    }
    lastDraw = now;
  }

  let last = performance.now();
  let raf = 0;
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!onScreen || document.hidden) {
      drewLast = false;
      return; // paused: tickers and drawing wait until the figure is seen again
    }
    let moved = false;
    for (const fn of tickers) {
      const r = fn(dt, now);
      if (r === true) moved = true;
      else if (r === 'camera') dirty = true; // only the camera moved (a glide): draw, but keep the shadow maps
    }
    if (moved) dirty = sceneDirty = true;
    controls.update(dt);
    if (!dirty) {
      drewLast = false;
      return;
    }
    dirty = false;
    if (adaptive) measure(now);
    render();
    drewLast = true;
  }
  raf = requestAnimationFrame(frame);

  return {
    renderer,
    scene,
    camera,
    controls,
    canvas,
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    /** Ask for a redraw on the next frame (the scene changed: shadows are drawn again too). */
    invalidate() {
      dirty = true;
      sceneDirty = true;
    },
    /** The pixel ratio in use (it may step down from the device's while frames come slowly). */
    get pixelRatio() {
      return ratio;
    },
    /** fn(dt, now) runs every frame; return true to keep drawing (e.g. while animating), or 'camera' when only the
     * camera moved (a glide), so the frame is drawn without redrawing the shadow maps. */
    addTicker(fn) {
      tickers.add(fn);
      return () => tickers.delete(fn);
    },
    onBeforeRender(fn) {
      before.add(fn);
      return () => before.delete(fn);
    },
    onAfterRender(fn) {
      after.add(fn);
      return () => after.delete(fn);
    },
    onResize(fn) {
      resizers.add(fn);
      return () => resizers.delete(fn);
    },
    /** Draw now (shadows included). */
    render: renderAll,
    /**
     * Compile shaders ahead, in the background (the stage already does this once for the whole scene after the first
     * frame): `show` hidden parts of later steps, `targets` a figure's own render targets ({ target, scene, camera }),
     * `objects` parts not yet in the scene. Draws nothing; resolves when the shaders are ready.
     */
    warmUp,
    /** Runs fn with the given hidden objects shown, then hides them again; nothing is drawn in between. */
    withShown,
    /** PNG data URL of the current view, cover-fitted to w×h, on white (background: null keeps it transparent). */
    capture({ width: w = 800, height: h = 500, background = '#ffffff' } = {}) {
      renderAll();
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ctx = out.getContext('2d');
      if (background) {
        // the page is white but the 3D canvas is transparent: fill, or other viewers show black
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
      }
      const s = Math.max(w / canvas.width, h / canvas.height);
      const dw = canvas.width * s;
      const dh = canvas.height * s;
      ctx.drawImage(canvas, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return out.toDataURL('image/png');
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      controls.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
