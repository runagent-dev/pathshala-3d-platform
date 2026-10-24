/**
 * Shared renderer + scene + camera + orbit controls with render-on-demand.
 *
 * Every Pathshala asset uses this so they behave the same inside the book: frames are only drawn
 * when something changes (battery-friendly on tablets), pixel ratio is capped, lighting is the
 * same neutral studio environment.
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
  } = options;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
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
  let running = true;

  function resize() {
    const r = container.getBoundingClientRect();
    width = Math.max(1, Math.round(r.width));
    height = Math.max(1, Math.round(r.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    for (const fn of resizers) fn(width, height);
    dirty = true;
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

  controls.addEventListener('change', () => (dirty = true));

  function render() {
    for (const fn of before) fn();
    renderer.render(scene, camera);
    for (const fn of after) fn();
  }

  let last = performance.now();
  let raf = 0;
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const fn of tickers) if (fn(dt, now) === true) dirty = true;
    controls.update(dt);
    if (!dirty) return;
    dirty = false;
    render();
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
    /** Ask for a redraw on the next frame. */
    invalidate() {
      dirty = true;
    },
    /** fn(dt, now) runs every frame; return true to keep drawing (e.g. while animating). */
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
    render,
    /** PNG data URL of the current view, cover-fitted to w×h, on white (background: null keeps it transparent). */
    capture({ width: w = 800, height: h = 500, background = '#ffffff' } = {}) {
      render();
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
      controls.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
