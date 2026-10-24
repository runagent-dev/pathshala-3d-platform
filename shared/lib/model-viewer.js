// A static 3D model (GLB) for students: white page, turn it with a finger or the mouse, zoom, a reset button and
// full screen, Bangla hints. Used by "model" figures (templates/model/), including models uploaded in the studio.
//
//   const viewer = createModelViewer(document.getElementById('app'), { t, src: './model.glb' });
//   await viewer.ready;
//
// Strings from the figure's i18n: loading, load_error, hint_rotate, reset_view, fullscreen.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createStage } from './stage.js';
import { createTweener, ease } from './tween.js';
import { ICONS } from './student/icons.js';

const VIEW_DIR = new THREE.Vector3(0.6, 0.45, 1).normalize();

/**
 * @param {HTMLElement} root
 * @param {{ t: any, src?: string, theme?: string, fov?: number }} options  t: the figure's i18n function (with t.lang)
 */
export function createModelViewer(root, { t, src = './model.glb', theme = 'light', fov = 35 }) {
  root.classList.add('pvc', 'pvc-model');
  root.dataset.theme = theme;
  root.lang = t.lang;
  root.innerHTML = `
    <div class="pvc-stage">
      <div class="pvc-canvas"></div>
      <p class="pvc-model-msg" role="status">${t('loading')}</p>
      <div class="pvc-hint" role="status" aria-live="polite"><span class="pvc-hint-text"></span></div>
      <div class="pvc-corner">
        <button class="pvc-tool icon-only" data-act="reset" title="${t('reset_view')}" aria-label="${t('reset_view')}">${ICONS.reset}</button>
        <button class="pvc-tool icon-only" data-act="fullscreen" title="${t('fullscreen')}" aria-label="${t('fullscreen')}">${ICONS.expand}</button>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const stage = createStage($('.pvc-canvas'), { fov, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const listeners = new Map();
  const emit = (type, payload) => {
    for (const fn of listeners.get(type) || []) fn(payload);
  };

  let model = null;
  let home = null;
  const box = new THREE.Box3();
  const size = new THREE.Vector3();

  function frame() {
    box.setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    box.getSize(size);
    const radius = size.length() / 2 || 1;
    // fit the bounding sphere in the narrower of the two fields of view (phones in portrait are narrow)
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const dist = (radius / Math.sin(Math.min(vfov, hfov) / 2)) * 1.08;
    camera.near = dist / 100;
    camera.far = dist * 100;
    camera.updateProjectionMatrix();
    controls.minDistance = dist * 0.2;
    controls.maxDistance = dist * 4;
    return { target: center, position: center.clone().addScaledVector(VIEW_DIR, dist) };
  }

  function flyTo(pose, duration = 0.7) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      camera.position.copy(pose.position);
      controls.target.copy(pose.target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, pose.position, k);
        controls.target.lerpVectors(t0, pose.target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }

  let hintTimer = 0;
  function hint(text, ms = 4000) {
    $('.pvc-hint-text').textContent = text;
    $('.pvc-hint').classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => $('.pvc-hint').classList.remove('show'), ms);
  }
  controls.addEventListener('start', () => {
    tweener.cancel('camera');
    $('.pvc-hint').classList.remove('show');
  });

  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    if (b.dataset.act === 'reset' && home) flyTo(home);
    if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  if (!document.fullscreenEnabled) $('[data-act="fullscreen"]').hidden = true;

  let mixer = null;
  const ready = new GLTFLoader()
    .loadAsync(src)
    .then((gltf) => {
      model = gltf.scene;
      scene.add(model);
      home = frame();
      flyTo(home, 0);
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        for (const clip of gltf.animations) mixer.clipAction(clip).play();
        stage.addTicker((dt) => (mixer.update(dt), true));
      }
      $('.pvc-model-msg').remove();
      hint(t('hint_rotate'));
      stage.invalidate();
    })
    .catch((err) => {
      $('.pvc-model-msg').textContent = t('load_error');
      throw err;
    });
  stage.onResize(() => home && !tweener.busy && (home = frame()));

  return {
    ready,
    stage,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: () => ({
      src,
      size: model ? { x: +size.x.toFixed(4), y: +size.y.toFixed(4), z: +size.z.toFixed(4) } : null,
      camera: camera.position.toArray().map((v) => +v.toFixed(4)),
      target: controls.target.toArray().map((v) => +v.toFixed(4)),
    }),
    /** { view: 'home' } or { camera: [x, y, z], target: [x, y, z] }; animate: false jumps. */
    async set(p = {}) {
      const duration = p.animate === false ? 0 : 0.7;
      if (p.view === 'home' && home) await flyTo(home, duration);
      if (p.camera)
        await flyTo(
          { position: new THREE.Vector3().fromArray(p.camera), target: p.target ? new THREE.Vector3().fromArray(p.target) : controls.target.clone() },
          duration,
        );
      emit('view', { camera: camera.position.toArray() });
      return true;
    },
    async reset() {
      if (home) await flyTo(home, 0.7);
    },
    capture: (opts) => stage.capture(opts),
    /** The model file itself: a model figure exports its GLB unchanged. */
    async exportFile() {
      return (await fetch(src)).arrayBuffer();
    },
  };
}
