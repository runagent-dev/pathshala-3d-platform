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
