// Simple harmonic motion (book page 37, topic 2.2), student view: a swing (দোলনা, as in চিত্র ২.০২) or a mass on a
// spring oscillates about its equilibrium point (সাম্যবিন্দু). An arrow shows the speed (দ্রুতি): zero at the ends
// (প্রান্ত), growing toward the equilibrium point, greatest there, then falling to zero at the other end. Dots on
// the path mark where it is at equal time steps (close together near the ends, far apart in the middle), and the
// panel shows the speed over one period (পর্যায়কাল). Pull the seat or the mass to one side and let go: that is
// where it oscillates from. Then a short test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { PIVOT, createSwing } from './swing.js';
import { EQUILIBRIUM, createSpringStand } from './spring.js';
import {
  EXAMPLES,
  STROBE,
  SWING,
  amplitudeRange,
  arcOf,
  clamp,
  degOf,
  motionAt,
  omega,
  period,
  periodChoices,
  placeOf,
  roundTo,
  startAmplitude,
  strobe,
  strobeStep,
} from './motion.js';

export const DEFAULTS = {
  example: 'swing', // 'swing' | 'spring'
  slow: false, // time 4× slower
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const SLOW = 4; // "ধীরে" shows the motion this many times slower
const VIEW_DIRS = {
  front: new THREE.Vector3(0.06, 0.05, 1).normalize(), // from the side of the swing, as in the book's picture
  '3d': new THREE.Vector3(0.78, 0.38, 0.62).normalize(),
};
const COLOR = { path: 0x1c6fd9, speed: 0xe8590c, mark: 0x6741d9 }; // the test's marked part: purple, far from the speed's orange
// where the helpers go: the swing's path just under the seat, its speed arrow under the girl's feet; the spring's
// path on the right of the mass, its arrow on the left, and the equilibrium level across
const R_PATH = SWING.R + 0.05;
const R_ARROW = SWING.R + 0.28;
const SPRING_PATH_X = 0.09;
const SPRING_ARROW_X = -0.088;
const SPRING_MID = -0.047; // the middle of the slotted masses, below the hook
const LEVEL_FROM = -0.15; // the spring's equilibrium level runs from here (its label) to the path
const ARROW_PER_SPEED = { swing: 0.3, spring: 0.3 }; // m of arrow per m/s
const ARROW_R = { swing: 0.022, spring: 0.0055 };
const DOT_R = { swing: 0.032, spring: 0.0085 };
const KINDS = ['speed', 'trend', 'journey', 'time', 'example'];
const FAST = amplitudeRange('swing')[1] * omega('swing'); // m/s: the seat's top speed at 25°
const fmt = (v) => String(roundTo(v, 0.01)); // 3, 1.5, 0.75

/** An arrow along its +y axis from its origin, `length` long. */
function createArrow(color) {
  const mat = new THREE.MeshStandardMaterial({ name: 'SpeedArrow', color, roughness: 0.45, emissive: color, emissiveIntensity: 0.18 });
  const group = new THREE.Group();
  group.userData.noExport = true;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14).translate(0, 0.5, 0), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 18).translate(0, 0.5, 0), mat);
  group.add(shaft, head);
  return {
    group,
    set(length, r) {
      group.visible = length > r * 1.5;
      if (!group.visible) return;
      const h = Math.min(r * 5, length * 0.55);
      shaft.scale.set(r, length - h, r);
      head.position.y = length - h;
      head.scale.set(r * 2.5, h, r * 2.5);
    },
  };
}

/** The circle the swing's seat moves on, as a curve from −max to +max degrees. */
class Arc extends THREE.Curve {
  constructor(r, maxDeg) {
    super();
    this.r = r;
    this.max = THREE.MathUtils.degToRad(maxDeg);
  }
  getPoint(u, out = new THREE.Vector3()) {
    const a = (2 * u - 1) * this.max;
    return out.set(PIVOT.x + this.r * Math.sin(a), PIVOT.y - this.r * Math.cos(a), 0);
  }
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'shm');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // the speed over one period: two humps, zero at the ends, greatest at the equilibrium point
  const curvePts = [];
  for (let x = 0; x <= 400; x += 4) curvePts.push(`${x},${(96 - 88 * Math.abs(Math.sin((Math.PI * 2 * x) / 400))).toFixed(1)}`);
  const stops = ['stop_end', 'stop_mid', 'stop_end', 'stop_mid', 'stop_end'].map((k, i) => `<span style="left:${i * 25}%">${t(k)}</span>`).join('');
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="pvc-learn-main shm-main">
            <div class="pvc-result shm-speed"><span class="k"><i class="shm-arrow-ic"></i>${t('speed')}</span><span class="v">0</span><span class="u">${t('unit_speed')}</span></div>
          </div>
          <div class="shm-trip" role="img" aria-label="${t('graph_label')}">
            <div class="shm-graph">
              <svg viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
                <path class="shm-grid" d="M100 0V100M200 0V100M300 0V100" vector-effect="non-scaling-stroke"/>
                <path class="shm-curve" d="M${curvePts.join('L')}" vector-effect="non-scaling-stroke"/>
              </svg>
              <span class="shm-graph-k">${t('speed')}</span>
              <span class="shm-graph-t">${t('graph_time')}</span>
              <b class="shm-dot"></b>
            </div>
            <div class="shm-stops" aria-hidden="true">${stops}</div>
            <div class="shm-span"><i></i><span class="tx"></span><i></i></div>
          </div>
          <p class="pvc-learn-extra shm-extra"></p>
          <div class="pvc-learn-foot">
            <div class="shm-acts">
              <button class="pvc-btn primary" data-act="play"><span class="ic"></span><span class="tx"></span></button>
              <button class="pvc-btn" data-act="slow" aria-pressed="false">${t('act_slow')}</button>
            </div>
            <div class="pvc-seg shm-ex" role="group" aria-label="${t('examples')}">
              ${EXAMPLES.map((ex) => `<button data-ex="${ex}">${t(`ex_${ex}`)}</button>`).join('')}
            </div>
          </div>`,
  });
  const badge = document.createElement('div');
  badge.className = 'shm-badge';
  badge.hidden = true;
  badge.textContent = t('slow_badge', { k: SLOW });
  ui.stage.append(badge);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 0.05, far: 80, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.6;
  controls.maxDistance = 25;
  const M = createMaterials(stage.renderer);
  const models = { swing: createSwing({ materials: M }), spring: createSpringStand({ materials: M }) };
  for (const m of Object.values(models)) scene.add(m.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.position.set(1.5, 7, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 3, far: 14 });
    sun.shadow.radius = 8;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.13 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(sun, sun.target, ground);
    for (const m of Object.values(models))
      m.root.traverse((mesh) => {
        if (mesh instanceof THREE.Mesh && mesh.material?.visible !== false) mesh.castShadow = true;
      });
  }

  // ── the helpers: path, dots at equal time steps, speed arrow (not exported) ──
  const helpers = new THREE.Group();
  helpers.name = 'Helpers';
  helpers.userData.noExport = true;
  scene.add(helpers);
  const pathMat = new THREE.MeshStandardMaterial({ name: 'Path', color: COLOR.path, roughness: 0.5, transparent: true, opacity: 0.55 });
  const dotMat = new THREE.MeshStandardMaterial({ name: 'Dot', color: COLOR.path, roughness: 0.4, emissive: COLOR.path, emissiveIntensity: 0.15 });
  const markMat = new THREE.MeshStandardMaterial({ name: 'Mark', color: COLOR.mark, roughness: 0.5, emissive: COLOR.mark, emissiveIntensity: 0.2 });
  const ARC_SEGS = 200;
  const arc = new Arc(R_PATH, SWING.maxDeg);
  const swingPath = new THREE.Mesh(new THREE.TubeGeometry(arc, ARC_SEGS, 0.009, 6, false), pathMat);
  const springPath = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 1, 8), pathMat);
  const springLevel = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 1, 6), pathMat); // the equilibrium level
  springLevel.rotation.z = Math.PI / 2;
  // the test's marked part of the path: purple dashes, and an arrowhead for the way it goes
  const marks = new THREE.Group();
  const dashGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
  const markHead = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 16).translate(0, 0.5, 0), markMat);
  helpers.add(swingPath, springPath, springLevel, marks, markHead);
  const FRACTIONS = strobe(); // 1 … −1: where the dots are, as fractions of the amplitude
  const dotGeo = new THREE.SphereGeometry(1, 16, 12);
  const dots = FRACTIONS.map(() => {
    const d = new THREE.Mesh(dotGeo, dotMat);
    helpers.add(d);
    return d;
  });
  const arrows = { swing: createArrow(COLOR.speed), spring: createArrow(COLOR.speed) };
  models.swing.arm.add(arrows.swing.group); // it swings with the seat, so it always points along the path
  arrows.swing.group.position.set(0, -R_ARROW, 0);
  helpers.add(arrows.spring.group);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    example: EXAMPLES.includes(o.example) ? o.example : 'swing',
    amp: 0, // m along the path (for the swing: the arc the seat travels from the bottom to an end)
    side: 1, // the end it was let go from: +1 (+x for the swing, up for the spring) or −1
    time: 0, // s of motion since it was let go
    playing: true,
    slow: Boolean(o.slow),
    held: null, // m from the equilibrium point while a finger holds it
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    helpers: true, // labels, arrow and dots (hidden while a test question is open)
    lastPlace: '',
    userMovedCamera: false,
  };
  let drag = null; // a finger pulling the seat or the mass: { id, x0, a0, y0 }
  const model = () => models[s.example];
  const rate = () => (s.slow ? 1 / SLOW : 1);

  /** The motion now: displacement x (m), velocity v, speed, maxSpeed, phase, period. */
  function now() {
    if (s.held != null) {
      const T = period(s.example);
      return { x: s.held, v: 0, speed: 0, maxSpeed: 0, phase: 0, period: T };
    }
    return motionAt(s.example, s.side * s.amp, s.time);
  }

  function snapshot() {
    const m = now();
    const held = s.held != null;
    const { place, going } = held ? { place: 'end', going: 'in' } : placeOf(m.phase);
    const r3 = (v) => roundTo(v, 0.001);
    const amp = held ? Math.abs(s.held) : s.amp; // while held: where it would be let go from
    return {
      example: s.example,
      amplitude: r3(amp),
      angle: s.example === 'swing' ? roundTo(degOf(amp), 0.1) : null,
      side: held ? (s.held < 0 ? -1 : 1) : s.side,
      time: r3(s.time),
      phase: r3(m.phase),
      x: r3(m.x),
      speed: r3(m.speed),
      maxSpeed: r3(amp * (m.period ? (2 * Math.PI) / m.period : 0)),
      period: r3(m.period),
      place,
      going,
      playing: s.playing,
      slow: s.slow,
      dragging: s.held != null,
      view: s.view,
      mode: s.mode,
    };
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    speed: $('.shm-speed .v'),
    span: $('.shm-span .tx'),
    dot: $('.shm-dot'),
    extra: $('.shm-extra'),
    playIc: $('[data-act="play"] .ic'),
    playTx: $('[data-act="play"] .tx'),
    slow: $('[data-act="slow"]'),
  };
  const shown = { speed: '', extra: '' };
  function panel(m) {
    const speed = N(m.speed.toFixed(2));
    if (speed !== shown.speed) el.speed.textContent = shown.speed = speed;
    const k = m.maxSpeed > 0 ? m.speed / m.maxSpeed : 0;
    el.dot.style.left = `${(m.phase * 100).toFixed(2)}%`;
    el.dot.style.top = `${(96 - 88 * k).toFixed(2)}%`;
    const extra = s.held != null ? t('idea_drag') : t('idea', { dt: strobeStep(s.example).toFixed(2), who: t(`who_${s.example}`) });
    if (extra !== shown.extra) el.extra.innerHTML = shown.extra = extra;
  }
  function syncButtons() {
    el.playIc.innerHTML = s.playing ? ICONS.pause : ICONS.play;
    el.playTx.textContent = t(s.playing ? 'act_pause' : 'act_play');
    el.slow.classList.toggle('on', s.slow);
    el.slow.setAttribute('aria-pressed', String(s.slow));
    for (const b of ui.$$('[data-ex]')) b.classList.toggle('on', b.dataset.ex === s.example);
    el.span.innerHTML = t('period_span', { T: period(s.example).toFixed(2) });
    badge.hidden = !s.slow;
  }

  // ── the path, the dots, the labels ──────────────────────────────────────────
  /** Show the path from end to end for amplitude a (m), with the dots at equal time steps along it. */
  function setPath(a) {
    const swing = s.example === 'swing';
    swingPath.visible = swing;
    springPath.visible = springLevel.visible = !swing;
    const r = DOT_R[s.example];
    const sign = s.held != null ? Math.sign(s.held) || 1 : s.side;
    if (swing) {
      const half = ARC_SEGS / 2;
      const n = Math.min(half, Math.ceil((half * degOf(a)) / SWING.maxDeg));
      swingPath.geometry.setDrawRange((half - n) * 6 * 6, 2 * n * 6 * 6);
      FRACTIONS.forEach((f, i) => models.swing.pointAt((sign * f * a) / SWING.R, R_PATH, dots[i].position));
    } else {
      springPath.position.set(SPRING_PATH_X, EQUILIBRIUM + SPRING_MID, 0);
      springPath.scale.y = 2 * a;
      springLevel.position.set((LEVEL_FROM + SPRING_PATH_X) / 2, EQUILIBRIUM + SPRING_MID, 0); // from its label to the path
      springLevel.scale.y = SPRING_PATH_X - LEVEL_FROM;
      FRACTIONS.forEach((f, i) => models.spring.pointAt(sign * f * a, SPRING_PATH_X, dots[i].position));
    }
    for (const d of dots) {
      d.scale.setScalar(r);
      d.visible = s.helpers;
    }
    stage.invalidate();
  }

  // the dot it is passing lights up, like a flash photo taken every T/16
  let lit = -1;
  function flash(m) {
    let k = -1;
    let boost = 0;
    if (s.held == null && s.playing && s.helpers) {
      const q = m.phase * STROBE;
      const n = Math.round(q);
      const off = Math.abs(q - n);
      if (off < 0.2) {
        k = n <= STROBE / 2 ? n : (STROBE - n) % STROBE;
        boost = 1 - off / 0.2;
      }
    }
    if (lit >= 0 && lit !== k) dots[lit].scale.setScalar(DOT_R[s.example]);
    if (k >= 0) dots[k].scale.setScalar(DOT_R[s.example] * (1 + 0.7 * boost));
    lit = k;
  }

  /**
   * Where a label points at an end of the path (it follows the end while the student pulls): just beyond and below
   * the last dot, so the label's own dot does not hide how the dots crowd together there.
   */
  const endPoint = (sign) => {
    const out = new THREE.Vector3();
    return () => {
      const a = s.held != null ? Math.max(Math.abs(s.held), amplitudeRange(s.example)[0]) : s.amp;
      return s.example === 'swing'
        ? models.swing.pointAt(sign * (a / SWING.R + 0.03), R_PATH + 0.05, out)
        : models.spring.pointAt(sign * a, SPRING_PATH_X + 0.022, out);
    };
  };
  const swingMid = models.swing.pointAt(0, R_PATH);
  const springMid = new THREE.Vector3(LEVEL_FROM, EQUILIBRIUM + SPRING_MID, 0); // the end of the equilibrium level
  const label = (place, speed) => `<span class="shm-l-place">${t(place)}</span><span class="shm-l-speed">${t(speed)}</span>`;
  function showLabels() {
    annotations.clear('part');
    if (!s.helpers) return;
    if (s.example === 'swing') {
      // below and outside the ends (the girl's feet reach out beside the far end), the middle one under the arrow
      annotations.add('end-a', { text: label('stop_end', 'speed_zero'), point: endPoint(-1), dx: -10, dy: 30 });
      annotations.add('end-b', { text: label('stop_end', 'speed_zero'), point: endPoint(1), dx: 10, dy: 30 });
      annotations.add('mid', { text: label('stop_mid', 'speed_max'), point: () => swingMid, dy: 58 });
    } else {
      // the two ends are close on a small screen: the labels lean away from each other
      annotations.add('end-a', { text: label('stop_end', 'speed_zero'), point: endPoint(1), dx: 18, dy: -14 });
      annotations.add('end-b', { text: label('stop_end', 'speed_zero'), point: endPoint(-1), dx: 18, dy: 14 });
      annotations.add('mid', { text: label('stop_mid', 'speed_max'), point: () => springMid, dx: -8, dy: 0 });
    }
  }

  /** Hide or show the helpers (the test hides them until the answer is shown). */
  function setHelpers(on) {
    s.helpers = on;
    showLabels();
    setPath(s.amp);
    pose();
  }

  // ── the motion ──────────────────────────────────────────────────────────────
  function pose() {
    const m = now();
    if (s.example === 'swing') {
      models.swing.setAngle(m.x / SWING.R);
      // her plait trails behind as she goes forward (and falls back against her when she goes backward)
      models.swing.setPlait(clamp((0.45 * m.v) / FAST, -0.05, 0.45));
    } else models.spring.setOffset(m.x);
    const len = m.speed * ARROW_PER_SPEED[s.example];
    const arrow = arrows[s.example];
    arrow.set(s.helpers ? len : 0, ARROW_R[s.example]);
    if (s.example === 'swing') arrow.group.rotation.z = m.v >= 0 ? -Math.PI / 2 : Math.PI / 2;
    else {
      arrow.group.position.set(SPRING_ARROW_X, EQUILIBRIUM + m.x + SPRING_MID, 0);
      arrow.group.rotation.z = m.v >= 0 ? 0 : Math.PI;
    }
    arrows[s.example === 'swing' ? 'spring' : 'swing'].group.visible = false;
    flash(m);
    panel(m);
    const place = s.held != null ? 'held' : placeOf(m.phase).place;
    if (place !== s.lastPlace) {
      s.lastPlace = place;
      emitChange();
    }
    stage.invalidate();
  }
  function emitChange() {
    emit('change', snapshot());
  }

  stage.addTicker((dt) => {
    if (!s.playing || s.held != null) return false;
    s.time += dt * rate();
    pose();
    return true;
  });

  /** Let it go from rest at x (m from the equilibrium point; the sign says which end). */
  function release(x) {
    const [lo, hi] = amplitudeRange(s.example);
    s.held = null;
    s.amp = clamp(Math.abs(x), lo, hi);
    s.side = x < 0 ? -1 : 1;
    s.time = 0;
    setPath(s.amp);
    pose();
  }
  function setPlaying(on) {
    s.playing = Boolean(on);
    syncButtons();
    pose();
    emitChange();
  }
  function setSlow(on) {
    s.slow = Boolean(on);
    syncButtons();
    emitChange();
  }
  /** One time step of the dots (T/16) forward or back; it pauses first. */
  function step(dir) {
    if (s.playing) setPlaying(false);
    const dt = strobeStep(s.example);
    s.time = Math.max(0, roundTo(Math.round(s.time / dt + dir) * dt, 1e-6));
    pose();
    audio.tick();
  }
  function setExample(ex, { animate = true } = {}) {
    if (!EXAMPLES.includes(ex)) return;
    const changed = ex !== s.example;
    s.example = ex;
    for (const [k, m] of Object.entries(models)) m.root.visible = k === ex;
    drag = null; // a finger still on the old example lets go of it
    tweener.cancel('let-go');
    s.held = null;
    s.time = 0;
    s.side = 1;
    s.amp = startAmplitude(ex);
    s.lastPlace = '';
    setMark(null);
    setPath(s.amp);
    showLabels();
    syncButtons();
    pose();
    if (changed || !animate) {
      s.userMovedCamera = false;
      flyTo(viewPose(s.view), animate ? 0.8 : 0);
    }
    if (changed) emit('example', { example: ex });
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const UP = new THREE.Vector3(0, 1, 0);
  const rel = new THREE.Vector3();
  /** The camera that fits the model's key points (with their depth, so the near poles are not cut off). */
  function viewPose(view) {
    const dir = VIEW_DIRS[view];
    const pts = model().fit;
    const target = new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
    const right = new THREE.Vector3().crossVectors(UP, dir).normalize();
    const up = new THREE.Vector3().crossVectors(dir, right);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * camera.aspect;
    const band = 64 / Math.max(stage.height, 200); // the buttons on top take this part of the height
    const tanUse = tanV * Math.max(0.5, 1 - band);
    let d = 0;
    for (const p of pts) {
      rel.subVectors(p, target);
      const z = rel.dot(dir);
      d = Math.max(d, z + Math.abs(rel.dot(right)) / tanH, z + Math.abs(rel.dot(up)) / tanUse);
    }
    d *= 1.04;
    target.addScaledVector(up, band * d * tanV * 0.5); // the picture sits a little lower, clear of the buttons
    return { target, position: target.clone().addScaledVector(dir, d) };
  }
  function flyTo({ position, target }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => !s.userMovedCamera && flyTo(viewPose(s.view), 0));

  // ── pulling it to one side ──────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // the plane it moves in
  const hitPoint = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function aim(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  function pick(p) {
    aim(p);
    return raycaster.intersectObjects(model().hits, false).length > 0;
  }
  // fingers are wide: a touch just off the seat (or the mass) still takes it
  function nearby(p) {
    for (const r of [10, 20]) {
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        if (pick({ x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a) })) return true;
      }
    }
    return false;
  }
  /** Where the pointer is in the plane of the motion. */
  function onPlane(p) {
    aim(p);
    return raycaster.ray.intersectPlane(plane, hitPoint) ? hitPoint : null;
  }
  const angleAt = (q) => Math.atan2(q.x - PIVOT.x, PIVOT.y - q.y);

  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      root.focus({ preventScroll: true });
      coach?.interrupt();
      if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const p = canvasPoint(e);
      if (!pick(p) && (e.pointerType === 'mouse' || !nearby(p))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const q = onPlane(p);
      if (!q) return;
      const x = now().x;
      drag = { id: e.pointerId, x0: x, a0: angleAt(q), y0: q.y };
      tweener.cancel('let-go');
      s.held = x;
      ui.canvasHost.setPointerCapture(e.pointerId);
      coach?.objectUsed();
      setPath(Math.abs(x));
      showLabels();
      pose();
      emit('dragstart', snapshot());
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id || s.locked) return;
    const q = onPlane(canvasPoint(e));
    if (!q) return;
    const [, hi] = amplitudeRange(s.example);
    if (s.example === 'swing') s.held = clamp(drag.x0 + (angleAt(q) - drag.a0) * SWING.R, -hi, hi);
    else s.held = clamp(drag.x0 + (q.y - drag.y0), -hi, hi);
    setPath(Math.max(Math.abs(s.held), amplitudeRange(s.example)[0]));
    pose();
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    const [lo] = amplitudeRange(s.example);
    const x = s.held;
    const go = (from) => {
      release(from);
      s.playing = true;
      syncButtons();
      audio.pop();
      emit('dragend', snapshot());
      emitChange();
      coach?.objectReleased();
    };
    if (Math.abs(x) >= lo) return go(x);
    // let go too near the middle: it is first carried out to the smallest swing the figure shows
    const to = (x < 0 ? -1 : 1) * lo;
    tweener.animate({
      key: 'let-go',
      duration: 0.25,
      ease: ease.outCubic,
      onUpdate: (k) => {
        s.held = x + (to - x) * k;
        pose();
      },
      onComplete: () => go(to),
    });
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued || drag) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'grab') : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 3000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(() => ui.hint.classList.remove('show'), duration);
  }
  function lockedNudge() {
    showHint(t('q_locked'));
    audio.error();
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

  /** Mark part of the path (from → to, m from the equilibrium point) with an arrowhead at `to`. */
  function setMark(mark) {
    marks.clear();
    markHead.visible = false;
    if (!mark) return stage.invalidate();
    const swing = s.example === 'swing';
    /** The point of the marked part at fraction u (0: from, 1: to). */
    const at = (u, out) => {
      const x = mark.from + (mark.to - mark.from) * u;
      return swing ? models.swing.pointAt(x / SWING.R, R_PATH, out) : models.spring.pointAt(x, SPRING_PATH_X, out);
    };
    const r = swing ? 0.016 : 0.0055;
    const n = swing ? 9 : 6;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      at(i / n, a);
      at((i + 0.55) / n, b);
      const dash = new THREE.Mesh(dashGeo, markMat);
      dash.position.addVectors(a, b).multiplyScalar(0.5);
      dash.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
      dash.scale.set(r, a.distanceTo(b), r);
      marks.add(dash);
    }
    at(0.93, a);
    at(1, b);
    const size = swing ? 0.12 : 0.032;
    markHead.visible = true;
    markHead.position.copy(a);
    markHead.scale.set(size * 0.55, size, size * 0.55);
    markHead.quaternion.setFromUnitVectors(UP, b.sub(a).normalize());
    stage.invalidate();
  }

  /** Letters (ক, খ, গ) just under points of the swing's path, at fractions of the amplitude, from left to right. */
  function setLetters(fractions) {
    annotations.clear('callout');
    const ordered = [...fractions].sort((a, b) => a - b);
    ordered.forEach((f, i) => {
      const at = models.swing.pointAt((f * s.amp) / SWING.R, R_PATH);
      annotations.add(`q${i}`, { text: t.letters[i], point: () => at, dy: 24, kind: 'callout', color: '#1c6fd9' });
    });
    return ordered;
  }

  let kinds = [];
  let question = null;
  let picked = -1; // the choice the student tapped
  let before = null; // what the student had before the test
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        before = { example: s.example, slow: s.slow };
        s.mode = 'quiz';
        kinds = shuffle([...KINDS]);
        ui.hint.classList.remove('show');
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        annotations.clear('callout');
        setMark(null);
        if (before) {
          setExample(before.example);
          setSlow(before.slow);
        }
        s.playing = true;
        setHelpers(true);
        syncButtons();
        syncUI();
      },
      prepare(i) {
        const kind = kinds[i % kinds.length];
        s.locked = true;
        annotations.clear('callout');
        // letters need room between them: those questions use the swing's long path
        const lettered = kind === 'speed' || kind === 'journey';
        const ex = lettered ? 'swing' : kind === 'example' ? s.example : pickOne(EXAMPLES);
        setExample(ex);
        setHelpers(false);
        // it oscillates slowly while the student looks (the badge says time is slowed), with a good big swing
        const [lo, hi] = amplitudeRange(ex);
        release((Math.random() < 0.5 ? -1 : 1) * roundTo(lo + (0.7 + 0.3 * Math.random()) * (hi - lo), 0.001));
        s.playing = true;
        s.slow = true;
        syncButtons();
        const opts = (list) => (j) => `<span class="shm-opt">${list[j]}</span>`;
        if (kind === 'speed') {
          const fastest = Math.random() < 0.5;
          const e = Math.random() < 0.5 ? -1 : 1;
          const fr = setLetters([e, Math.random() < 0.5 ? e * 0.55 : -e * 0.55, 0]);
          const answer = fr.indexOf(fastest ? 0 : e);
          const list = [...t.letters, t('opt_same')];
          question = { kind, fastest, letter: t.letters[answer] };
          return {
            text: t(fastest ? 'q_fastest' : 'q_zero'),
            choices: [0, 1, 2, 3],
            expected: answer,
            tolerance: 0.5,
            label: opts(list),
            meta: { kind, example: ex, ask: fastest ? 'fastest' : 'zero' },
          };
        }
        if (kind === 'trend') {
          const inward = Math.random() < 0.5;
          const e = (Math.random() < 0.5 ? -1 : 1) * s.amp;
          setMark(inward ? { from: e, to: 0 } : { from: 0, to: e });
          const keys = shuffle(['opt_up', 'opt_down', 'opt_same_speed', 'opt_up_down']);
          question = { kind, inward };
          // the question does not say which way: the student finds the সাম্যবিন্দু on the marked path
          return {
            text: t('q_trend', { who: t(`who_${ex}`) }),
            choices: [0, 1, 2, 3],
            expected: keys.indexOf(inward ? 'opt_up' : 'opt_down'),
            tolerance: 0.5,
            label: opts(keys.map((k) => t(k))),
            meta: { kind, example: ex, going: inward ? 'in' : 'out' },
          };
        }
        if (kind === 'journey') {
          setLetters([-1, 0, 1]);
          const [a, b, c] = t.letters;
          const list = shuffle([`${a} → ${c} → ${a}`, `${a} → ${c}`, `${a} → ${b}`, `${b} → ${c} → ${b}`]);
          question = { kind };
          return {
            text: t('q_journey'),
            choices: [0, 1, 2, 3],
            expected: list.indexOf(`${a} → ${c} → ${a}`),
            tolerance: 0.5,
            label: opts(list),
            meta: { kind, example: ex },
          };
        }
        if (kind === 'time') {
          // real swings take 1–2 s from end to end, a mass on a spring 0.4–1 s
          const h = ex === 'swing' ? roundTo(1 + Math.floor(Math.random() * 11) * 0.1, 0.1) : roundTo(0.4 + Math.floor(Math.random() * 7) * 0.1, 0.1);
          const { right, wrong } = periodChoices(h);
          question = { kind, h, T: right };
          return {
            text: t(ex === 'swing' ? 'q_time_swing' : 'q_time_spring', { h: fmt(h) }),
            choices: shuffle([right, ...wrong]),
            expected: right,
            tolerance: 0.005,
            label: (v) => `${N(fmt(v))}<small>${t('unit_s')}</small>`,
            meta: { kind, example: ex, half: h },
          };
        }
        // everyday examples: which one oscillates about a point? (never the one on the screen)
        const right = pickOne(['opt_pendulum', ex === 'swing' ? 'opt_spring_mass' : 'opt_swing_child']);
        const keys = shuffle([right, 'opt_clock_hand', 'opt_fan', 'opt_falling']);
        question = { kind, right, keys };
        return {
          text: t('q_example'),
          choices: [0, 1, 2, 3],
          expected: keys.indexOf(right),
          tolerance: 0.5,
          label: opts(keys.map((k) => t(k))),
          meta: { kind, answer: right },
        };
      },
      reveal() {
        setHelpers(true);
        const q = question;
        if (q.kind === 'speed') return t(q.fastest ? 'why_fastest' : 'why_zero', { p: q.letter });
        if (q.kind === 'trend') return t(q.inward ? 'why_in' : 'why_out');
        if (q.kind === 'journey') return t('why_journey');
        if (q.kind === 'time') return t('why_time', { h: fmt(q.h), T: fmt(q.T) });
        // the worked answer says why the wrong choice that was tapped is wrong
        const tapped = q.keys[picked];
        const why = tapped === q.right ? 'why_example' : tapped === 'opt_falling' ? 'why_example_falls' : 'why_example_turns';
        return t(why, { right: t(q.right), pick: t(tapped) });
      },
      done() {
        s.locked = false;
        annotations.clear('callout');
        setMark(null);
        setSlow(before?.slow ?? false);
      },
    },
  });

  // ── first-use pointer: on the seat (or the mass) ────────────────────────────
  let coach = null;
  if (o.coach) {
    const v = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, badge],
      object: {
        label: 'coach_drag',
        candidates: () => {
          model().grip(v).project(camera);
          return [{ x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height }];
        },
        grabbable: (p) => pick(p),
      },
    });
  }

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.ex) {
      setExample(b.dataset.ex);
      s.playing = true;
      syncButtons();
      emitChange();
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'play':
        setPlaying(!s.playing);
        break;
      case 'slow':
        setSlow(!s.slow);
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const moves = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (moves.includes(k) && s.locked) {
      e.preventDefault();
      return lockedNudge();
    }
    if (k === ' ' && !target.closest('button')) setPlaying(!s.playing);
    else if (k === 'ArrowRight' || k === 'ArrowLeft') step(k === 'ArrowRight' ? 1 : -1);
    else if (k === 'ArrowUp' || k === 'ArrowDown') {
      // a bigger or smaller swing, let go from the same end
      const [lo, hi] = amplitudeRange(s.example);
      const d = s.example === 'swing' ? arcOf(1) : 0.005;
      release(s.side * clamp(s.amp + (k === 'ArrowUp' ? d : -d), lo, hi));
      emitChange();
    } else if (k === 's' || k === 'S') setSlow(!s.slow);
    else if (k === '1' || k === '2') {
      if (s.mode === 'quiz') return;
      setExample(EXAMPLES[Number(k) - 1]);
      emitChange();
    } else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  setExample(s.example, { animate: false });
  setView(s.view, { animate: false });
  syncButtons();
  syncUI();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start();
  })();

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /**
     * Change any of: example ('swing' | 'spring'), angle (degrees, the swing; the sign says which end it is let go
     * from) or amplitude (m along the path, with side ±1), then phase (0…1 of the period) or time (s since it was
     * let go), playing, slow, view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.example) setExample(p.example, { animate });
      if (p.view) await setView(p.view, { animate });
      if (p.slow != null) setSlow(p.slow);
      if (p.angle != null && s.example === 'swing') release(arcOf(Number(p.angle) || 0));
      if (p.amplitude != null) release((Number(p.side) < 0 ? -1 : 1) * Math.abs(Number(p.amplitude) || 0));
      if (p.phase != null) s.time = Math.max(0, Number(p.phase) || 0) * period(s.example);
      if (p.time != null) s.time = Math.max(0, Number(p.time) || 0);
      if (p.playing != null) s.playing = Boolean(p.playing);
      syncButtons();
      pose();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      setExample('swing');
      setSlow(false);
      s.playing = true;
      syncButtons();
      pose();
      emitChange();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => model().root, // the swing (or the spring and its stand), without the helpers
  };
}
