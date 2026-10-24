// {{title}}: an animation as a pure function of time (shared/lib/timeline.js). Template: a ball rolls at constant
// speed along a track, leaving a mark every second. render(t) draws the state at t whatever came before, so the
// steps can be jumped to, the book can seek, and the video export renders exact frames. Replace the scene and
// STEPS (in i18n.js) with your animation; keep render(t) free of state that builds up over time.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTimeline, markAt, segment } from '@shared/timeline.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n, STEPS } from './i18n.js';

export const DEFAULTS = { autoplay: true, loop: true, lang: 'bn', numerals: null, bg: 'light' };

const DURATION = 12; // seconds
const START = 2; // the ball starts moving
const SECONDS = 7; // and moves for this long, one track unit per second
const UNIT = 0.5; // metres per second

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'anim');
  root.dataset.theme = o.bg;
  root.lang = t.lang;
  root.innerHTML = `
    <div class="pvc-stage"><div class="pvc-canvas"></div></div>
    <div class="anim-panel">
      <p class="anim-caption" aria-live="polite"></p>
      <div class="anim-controls">
        <button class="pvc-btn anim-play" data-act="play"></button>
        <div class="anim-steps">${STEPS.map((s, i) => `<button data-step="${i}">${t(`${s.key}_short`)}</button>`).join('')}</div>
        <span class="anim-time"></span>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);

  // ── scene (metres) ──────────────────────────────────────────────────────────
  const stage = createStage($('.pvc-canvas'), { fov: 28, near: 0.05, far: 100, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enableRotate = false;
  const model = new THREE.Group();
  model.name = 'UniformMotion';
  scene.add(model);
  const track = new THREE.Mesh(
    new THREE.BoxGeometry(UNIT * SECONDS + 0.6, 0.04, 0.3),
    new THREE.MeshStandardMaterial({ name: 'Track', color: 0xd9dee5, roughness: 0.8 }),
  );
  track.name = 'Track';
  track.position.set((UNIT * SECONDS) / 2, -0.02, 0);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 32, 20),
    new THREE.MeshPhysicalMaterial({ name: 'Ball', color: 0x1f5fae, roughness: 0.3, clearcoat: 0.6 }),
  );
  ball.name = 'Ball';
  const markMaterial = new THREE.MeshStandardMaterial({ name: 'Mark', color: 0xd9480f });
  const marks = Array.from({ length: SECONDS + 1 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.005, 0.3), markMaterial);
    m.name = `Mark ${i}`;
    m.position.set(i * UNIT, 0.003, 0);
    return m;
  });
  model.add(track, ball, ...marks);
  // Fit the track (and the ball's height) in the frame, whatever its shape.
  const VIEW_DIR = new THREE.Vector3(0, 0.3, 1).normalize();
  function fit() {
    const target = new THREE.Vector3((UNIT * SECONDS) / 2, 0.1, 0);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const d = Math.max(0.6 / Math.tan(vfov / 2), (UNIT * SECONDS + 1) / 2 / Math.tan(hfov / 2));
    camera.position.copy(target).addScaledVector(VIEW_DIR, d);
    controls.target.copy(target);
    controls.update();
  }
  stage.onResize(fit);
  fit();

  // ── the animation: everything from t ────────────────────────────────────────
  const listeners = new Map();
  const emit = (type, payload) => {
    for (const fn of listeners.get(type) || []) fn(payload);
  };
  let step = -1;
  function render(time) {
    const moved = segment(time, START, START + SECONDS) * SECONDS; // seconds of motion so far
    ball.position.set(moved * UNIT, 0.1, 0);
    ball.rotation.z = (-moved * UNIT) / 0.1; // rolling without slipping
    marks.forEach((m, i) => (m.visible = time >= START && i <= Math.floor(moved + 1e-6)));
    const now = Math.max(0, markAt(STEPS, time));
    if (now !== step) {
      step = now;
      $('.anim-caption').textContent = t(STEPS[step].key);
      for (const b of root.querySelectorAll('[data-step]')) b.classList.toggle('on', Number(b.dataset.step) === step);
      emit('step', { step, key: STEPS[step].key, t: time });
    }
    $('.anim-time').textContent = t('seconds', { t: Math.max(0, Math.min(SECONDS, Math.floor(moved))) });
    stage.invalidate();
  }
  const timeline = createTimeline({ duration: DURATION, render, loop: o.loop, onEnd: () => syncPlay() });
  stage.addTicker((dt) => timeline.tick(dt));

  function syncPlay() {
    const b = $('[data-act="play"]');
    b.innerHTML = timeline.playing ? ICONS.pause : ICONS.play;
    b.title = b.ariaLabel = t(timeline.playing ? 'pause' : 'play');
  }
  function play() {
    timeline.play();
    syncPlay();
    emit('play', { t: timeline.time });
  }
  function pause() {
    timeline.pause();
    syncPlay();
    emit('pause', { t: timeline.time });
  }
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    if (b.dataset.act === 'play') timeline.playing ? pause() : play();
    if (b.dataset.step != null) timeline.seek(STEPS[Number(b.dataset.step)].at + 0.01);
  });

  timeline.seek(0);
  if (o.autoplay) timeline.play();
  syncPlay();

  return {
    ready: Promise.resolve(),
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: () => ({ t: +timeline.time.toFixed(3), duration: DURATION, playing: timeline.playing, step }),
    /** { step } jumps to a part, { t } to a time (seconds), { playing } plays or pauses. */
    set(p = {}) {
      if (p.step != null) timeline.seek(STEPS[Number(p.step)]?.at ?? 0);
      if (p.t != null) timeline.seek(Number(p.t));
      if (p.playing === true) play();
      if (p.playing === false) pause();
      return { t: timeline.time, step };
    },
    play,
    pause,
    seek: (time) => timeline.seek(time),
    duration: DURATION,
    capture: (opts) => stage.capture(opts),
    exportRoot: () => model,
  };
}
