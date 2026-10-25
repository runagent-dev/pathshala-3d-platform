// Conservation of momentum and energy (book pages 72–73, topic 3.5.1), student view: two balls, m₁ behind m₂, on a
// smooth straight track (চিত্র ৩.০৪). The student picks an example (heavy behind, equal masses, light behind,
// head-on) or drags a ball's blue velocity arrow to choose u₁ and u₂, then plays the collision in slow motion (or
// scrubs it): the balls approach, touch (the flash; that moment slowed much more), and move apart with v₁ and v₂.
// Under the picture a momentum strip shows m₁'s and m₂'s momenta tip to tail, before and now: while they touch, the
// parts trade but the row always ends on the dashed total. The panel writes the book's two equations with the
// student's numbers (m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂ and ½m₁u₁² + ½m₂u₂² = ½m₁v₁² + ½m₂v₂²), the after side as "?" until
// the balls have collided. Then a short test. Built on the shared student kit (@shared/student/…); the physics is
// in collision.js.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createCoach } from '@shared/student/coach.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { fitPose } from './camera.js';
import {
  ARROW,
  PRESET_IDS,
  PRESETS,
  SLOW,
  U_MAX,
  U_MIN,
  WINDOW,
  clean,
  elastic,
  fmt,
  kinetic,
  momentAt,
  momentum,
  normalize,
  plan,
  presetMatching,
  radiusOf,
  stateAt,
  stripRange,
} from './collision.js';
import { createI18n } from './i18n.js';
import { drawFlash, drawStrip, stripHeight } from './ledger.js';
import { BALL_TINTS, createBall, createTrack } from './scene.js';

export const DEFAULTS = {
  preset: 'heavy', // 'heavy' | 'equal' | 'light' | 'headon'
  u1: null, // m/s: instead of the example's (whole numbers, −3…3, u₁ > u₂)
  u2: null,
  at: '', // '' (the start) | 'touch' | 'contact' | 'after' | 'end' | seconds of the run
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { velocity: '#1c6fd9', momentum: '#2f9e44', energy: '#f59f00' };
const fromFront = (deg) => new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(deg)), Math.cos(THREE.MathUtils.degToRad(deg)));
const VIEW_DIRS = {
  front: fromFront(13),
  '3d': new THREE.Vector3(0.5, 0.5, 0.72).normalize(),
};
// the front view looks down a little more where the frame has height to spare (the track's top, the সমতল, shows),
// as long as the balls keep their size
const FRONT_TILTS = [13, 18, 23, 28].map(fromFront);
const LANE_GAP = [0.125, 0.035]; // m above the taller ball: m₁'s arrow higher, m₂'s lower (they never cross)
const LANE_TOP = 2 * radiusOf(3) + LANE_GAP[0]; // the framing keeps room for this (the examples' biggest ball)
const TRACK_FRONT = 0.2; // m: the framing shows the track this far towards the camera
const DRAG_START = 7; // px a finger moves before a touch on a ball becomes a drag (less: a tap plays or pauses)
const DOUBLE_TAP = 400; // ms: a second tap this soon does not undo the first
// the parts' names on the momentum strip (drawn with real subscripts): before, while touching, after
const SYM_U = [
  ['m', { sub: '1' }, 'u', { sub: '1' }],
  ['m', { sub: '2' }, 'u', { sub: '2' }],
];
const SYM_M = [
  ['m', { sub: '1' }],
  ['m', { sub: '2' }],
];
const SYM_V = [
  ['m', { sub: '1' }, 'v', { sub: '1' }],
  ['m', { sub: '2' }, 'v', { sub: '2' }],
];

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** A number for a sum or a sentence (no trailing zeros), in the language's digits. */
  const F = (x, d = 2) => N(fmt(x, d));
  /** A live readout while the balls touch: one decimal. */
  const F1 = (x) => N(fmt(x, 1, 1));
  /** The second term of a sum: in brackets when negative, "৬ + (−২)". */
  const FB = (x, d = 2) => (x < 0 ? `(${F(x, d)})` : F(x, d));

  root.classList.add('pvc', 'cm');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  const term = (key) => `<span class="cm-term"><b data-v="${key}">0</b><small>${t(`sym_${key}`)}</small></span>`;
  const row = (kind) =>
    `<div class="cm-row ${kind}" role="row"><span class="cm-name"><b>${t(`row_${kind}`)}</b><small>${t(kind === 'p' ? 'u_p' : 'u_j')}</small></span>` +
    `${term(`${kind}_u1`)}<i>+</i>${term(`${kind}_u2`)}<i class="eq">=</i>${term(`${kind}_v1`)}<i>+</i>${term(`${kind}_v2`)}</div>`;
  const ui = buildStudentShell(root, t, {
    learnAlign: 'start',
    learn: `
          <div class="cm-presets" role="radiogroup" aria-label="${t('presets')}">${PRESET_IDS.map(
            (id) =>
              `<button role="radio" data-preset="${id}" aria-label="${presetAria(id)}">${pictogram(PRESETS[id])}<span>${t(`preset_${id}`)}</span></button>`,
          ).join('')}</div>
          <div class="cm-eqs" role="table">
            <div class="cm-head" role="row"><span class="b">${t('col_before')}</span><span class="a">${t('col_after')}</span></div>
            ${row('p')}
            ${row('k')}
          </div>
          <p class="cm-assume">${t('say_assume')}</p>
          <p class="cm-say" aria-live="polite"></p>
          <div class="cm-foot">
            <button class="pvc-btn primary cm-play" data-act="play"><span class="ic"></span><span class="lb"></span></button>
            <div class="cm-scrub"><input type="range" min="0" max="1000" step="1" value="0" aria-label="${t('scrub')}" /></div>
          </div>`,
  });
  const note = document.createElement('div');
  note.className = 'cm-note';
  ui.stage.append(note);

  function presetAria(id) {
    const q = PRESETS[id];
    return t('preset_aria', { name: t(`preset_${id}`), m1: q.m1, m2: q.m2, u1: fmt(q.u1), u2: fmt(q.u2) });
  }
  /** A small picture of an example: the two balls to scale and their velocity arrows. */
  function pictogram({ m1, m2, u1, u2 }) {
    const R = (m) => 2.6 + 3.6 * Math.cbrt(m / 3);
    const base = 22;
    const ball = (cx, m, i) => `<circle cx="${cx}" cy="${base - R(m)}" r="${R(m)}" fill="${BALL_TINTS[i]}" stroke="#46515d" stroke-width="0.9"/>`;
    const arrow = (cx, y, u) => {
      if (!u) return '';
      const d = Math.sign(u);
      const x2 = cx + d * (3.2 * Math.abs(u) + 3);
      return `<path d="M${cx} ${y}H${x2}M${x2 - d * 3.2} ${y - 2.8}L${x2} ${y}L${x2 - d * 3.2} ${y + 2.8}" fill="none" stroke="${COLORS.velocity}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
    };
    const top = base - 2 * Math.max(R(m1), R(m2)) - 4;
    return `<svg class="cm-pic" viewBox="0 0 64 24" aria-hidden="true"><path d="M1 ${base + 0.6}H63" stroke="#aab3bd" stroke-width="1.1"/>${ball(17, m1, 1)}${ball(45, m2, 2)}${arrow(17, top, u1)}${arrow(45, top, u2)}</svg>`;
  }

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 0.05, far: 60, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.8;
  controls.maxDistance = 12;
  controls.enablePan = false;
  const world = new THREE.Group();
  world.name = 'Collision';
  scene.add(world);
  const track = createTrack();
  const balls = { 1: createBall(1, 3), 2: createBall(2, 1) };
  const arrows = {
    1: createArrow({ color: COLORS.velocity, radius: 0.0065, head: 0.036, headRadius: 0.017, name: 'Velocity1' }),
    2: createArrow({ color: COLORS.velocity, radius: 0.0065, head: 0.036, headRadius: 0.017, name: 'Velocity2' }),
  };
  world.add(track.root, balls[1].root, balls[2].root, arrows[1].root, arrows[2].root);
  const stalkMat = new THREE.LineDashedMaterial({ color: 0x8fa9c9, dashSize: 0.012, gapSize: 0.008 });
  const stalks = {};
  for (const i of [1, 2]) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]);
    stalks[i] = new THREE.Line(g, stalkMat);
    stalks[i].name = `Stalk${i}`;
    stalks[i].userData.noExport = true;
    world.add(stalks[i]);
  }

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.position.set(-0.6, 3, 1.4);
    sun.target.position.set(0, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 1024);
    Object.assign(sun.shadow.camera, { left: -1.2, right: 1.2, top: 0.6, bottom: -0.6, near: 1, far: 6 });
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);
  }

  const overlay = document.createElement('canvas');
  overlay.className = 'cm-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  ui.canvasHost.after(overlay);
  const octx = overlay.getContext('2d');

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    setup: { ...PRESETS.heavy },
    preset: 'heavy',
    plan: plan(PRESETS.heavy),
    tau: 0, // s of the run on screen
    playing: false,
    revealed: false, // the balls have collided (in this setup): the after side of the equations shows
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    drag: null, // { i, id, x0, y0, u0, moved, at: [x1, x2] }
    slide: null, // { from: [x1, x2], k }: the balls glide to the new start after the setup changed
    demo: null, // { i, u }: the coach shows an arrow a little longer
    hide: { rows: [false, false], total: false, vel: [false, false], strip: false },
    userMovedCamera: false,
    lastTap: { ball: 0, button: 0 }, // ms: a second tap on the same thing this soon is ignored
  };
  let runToken = 0; // a new setup, a test question or a reset cancels a pending run

  /** What the picture shows now: the run at τ, or the start while a ball's arrow is dragged. */
  function view() {
    const st = stateAt(s.plan, s.tau);
    if (s.drag || s.demo) {
      const { u1, u2 } = s.setup;
      const w = { ...st, phase: 'before', v1: u1, v2: u2, p1: momentum(s.setup.m1, u1), p2: momentum(s.setup.m2, u2) };
      if (s.drag) [w.x1, w.x2] = s.drag.at;
      if (s.demo) w[`v${s.demo.i}`] = s.demo.u;
      return w;
    }
    if (s.slide) {
      st.x1 = s.slide.from[0] + (st.x1 - s.slide.from[0]) * s.slide.k;
      st.x2 = s.slide.from[1] + (st.x2 - s.slide.from[1]) * s.slide.k;
    }
    return st;
  }
  const lanes = () => {
    const top = 2 * Math.max(balls[1].r, balls[2].r);
    return [top + LANE_GAP[0], top + LANE_GAP[1]];
  };

  // ── the picture: balls, arrows, labels ──────────────────────────────────────
  const tip = { 1: new THREE.Vector3(), 2: new THREE.Vector3() };
  const tail = { 1: new THREE.Vector3(), 2: new THREE.Vector3() };
  const RIGHT = new THREE.Vector3(1, 0, 0);
  const LEFT = new THREE.Vector3(-1, 0, 0);
  function place(w = view()) {
    const lane = lanes();
    for (const i of [1, 2]) {
      const x = i === 1 ? w.x1 : w.x2;
      const v = i === 1 ? w.v1 : w.v2;
      balls[i].root.position.x = x;
      tail[i].set(x, lane[i - 1], 0);
      const pos = stalks[i].geometry.attributes.position;
      pos.setXYZ(0, x, 2 * balls[i].r + 0.008, 0);
      pos.setXYZ(1, x, lane[i - 1] - 0.014, 0);
      pos.needsUpdate = true;
      stalks[i].computeLineDistances();
      const hidden = s.hide.vel[i - 1] && w.phase === 'after';
      if (hidden || Math.abs(v) < 1e-6) {
        arrows[i].hide();
        tip[i].copy(tail[i]);
      } else {
        arrows[i].set(tail[i], v > 0 ? RIGHT : LEFT, Math.abs(v) * ARROW);
        tip[i].copy(arrows[i].tip);
      }
    }
  }

  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, note] });
  const v3 = new THREE.Vector3();
  function toScreen(p, out = { x: 0, y: 0 }) {
    v3.copy(p).project(camera);
    out.x = (v3.x * 0.5 + 0.5) * stage.width;
    out.y = (-v3.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  const sa = { x: 0, y: 0 };
  const sb = { x: 0, y: 0 };
  /** The screen box of an arrow (or of its lane point), a little padded. */
  function arrowBox(i) {
    toScreen(tail[i], sa);
    toScreen(tip[i], sb);
    return { left: Math.min(sa.x, sb.x) - 6, right: Math.max(sa.x, sb.x) + 6, top: Math.min(sa.y, sb.y) - 7, bottom: Math.max(sa.y, sb.y) + 7 };
  }
  const centre = new THREE.Vector3();
  /** The screen box of a ball. */
  function ballBox(i) {
    const b = balls[i];
    centre.set(b.root.position.x, b.r, 0);
    toScreen(centre, sa);
    const px = pxPerMetre(centre) * b.r;
    return { left: sa.x - px, right: sa.x + px, top: sa.y - px, bottom: sa.y + px };
  }
  const probe = new THREE.Vector3();
  /** Screen pixels per metre near a point (along x). */
  function pxPerMetre(p) {
    toScreen(p, sa);
    probe.copy(p).x += 0.1;
    toScreen(probe, sb);
    return Math.hypot(sb.x - sa.x, sb.y - sa.y) / 0.1;
  }
  const stripBox = () => (s.hide.strip ? null : L.strip);
  const sceneAvoid = [() => [arrowBox(1), arrowBox(2), ballBox(1), ballBox(2)], stripBox];

  // Mass labels under their ball (their dot where it stands on the track: they never jump about as the balls move),
  // velocity labels above the middle of their arrow (or beside it). Both keep clear of the arrows, the balls, the
  // strip, the corner buttons and the note.
  const massPoint = { 1: new THREE.Vector3(), 2: new THREE.Vector3() };
  const midPoint = { 1: new THREE.Vector3(), 2: new THREE.Vector3() };
  const outer = (i) => (i === 1 ? -1 : 1); // the side of a ball away from the other one
  function addLabels() {
    for (const i of [1, 2]) {
      anno.add(`m${i}`, {
        text: '',
        point: () => massPoint[i].set(balls[i].root.position.x, 0, balls[i].r * 0.75),
        kind: 'part',
        spots: massSpots(i),
        avoid: sceneAvoid,
      });
      anno.add(`v${i}`, {
        text: '',
        point: () => midPoint[i].addVectors(tail[i], tip[i]).multiplyScalar(0.5),
        kind: 'callout',
        color: COLORS.velocity,
        spots: velSpots(i, 1, 0),
        avoid: sceneAvoid,
      });
    }
  }
  /** Under the ball; when the other ball's label is there, a little to the outer side. */
  function massSpots(i) {
    const o = outer(i);
    return [
      { dx: 0, dy: 24 },
      { dx: 34 * o, dy: 24 },
      { dx: 62 * o, dy: 24 },
    ];
  }
  /** Above the middle of the arrow; else in front of its head or behind its tail. half: half its length (px). */
  function velSpots(i, dir, half) {
    const d = dir || 1;
    const list = [
      { dx: 0, dy: -23 },
      { dx: d * (half + 12), dy: 0 },
      { dx: -d * (half + 12), dy: 0 },
      { dx: 46, dy: -23 },
      { dx: -46, dy: -23 },
      { dx: 86, dy: -23 },
    ];
    if (i === 1) list.push({ dx: 0, dy: 23 });
    return list;
  }
  const labelState = { m1: '', m2: '', v1: '', v2: '', d1: 0, d2: 0, h1: -1, h2: -1, r1: -1, r2: -1 };
  function labels(w) {
    for (const i of [1, 2]) {
      const m = s.setup[`m${i}`];
      const text = t(`lbl_mass${i}`, { m: fmt(m) });
      if (labelState[`m${i}`] !== text) {
        labelState[`m${i}`] = text;
        anno.setText(`m${i}`, text);
      }
      const v = i === 1 ? w.v1 : w.v2;
      let vt;
      if (w.phase === 'before') vt = t(`lbl_u${i}`, { v: fmt(v) });
      else if (w.phase === 'contact') vt = t('lbl_now', { v: fmt(v, 1, 1) });
      else vt = s.hide.vel[i - 1] ? t(`lbl_v${i}_q`) : t(`lbl_v${i}`, { v: fmt(v) });
      if (labelState[`v${i}`] !== vt) {
        labelState[`v${i}`] = vt;
        anno.setText(`v${i}`, vt);
      }
      const dir = Math.sign(v);
      toScreen(tail[i], sa);
      toScreen(tip[i], sb);
      const half = Math.round(Math.hypot(sb.x - sa.x, sb.y - sa.y) / 2 / 6) * 6;
      if (labelState[`d${i}`] !== dir || labelState[`h${i}`] !== half) {
        labelState[`d${i}`] = dir;
        labelState[`h${i}`] = half;
        anno.update(`v${i}`, { spots: velSpots(i, dir, half) });
      }
    }
  }

  // ── layout: the 3D picture above, the momentum strip below it ───────────────
  const L = { strip: { left: 0, top: 0, right: 0, bottom: 0 }, stripH: 86 };
  function layout() {
    const W = stage.width;
    const H = stage.height;
    L.stripH = stripHeight(W, H);
    const w = Math.min(W - 16, 640);
    const x = (W - w) / 2;
    const y = H - L.stripH - 8;
    L.box = { x, y, w, h: L.stripH };
    L.strip = { left: x, top: y, right: x + w, bottom: y + L.stripH };
  }

  function viewPose(v = s.view) {
    layout();
    const box = new THREE.Box3(new THREE.Vector3(WINDOW.left, -0.03, -0.1), new THREE.Vector3(WINDOW.right, LANE_TOP + 0.02, TRACK_FRONT));
    const corner = ui.corner.getBoundingClientRect();
    // under the buttons (a label above m₁'s arrow goes beside them there); on short stages a little more, so the labels
    // over the arrows clear the note about time
    const top = Math.max(corner.height + 14, 44) + (stage.height < 300 ? 14 : 4);
    const fit = (dir) => fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: { top, bottom: L.stripH + 8 + 36, side: 8 } });
    if (v !== 'front') return fit(VIEW_DIRS[v]);
    const first = fit(FRONT_TILTS[0]);
    const d0 = first.position.distanceTo(first.target);
    let best = first;
    for (const dir of FRONT_TILTS.slice(1)) {
      const pose = fit(dir);
      if (pose.position.distanceTo(pose.target) <= d0 * 1.03) best = pose;
      else break;
    }
    return best;
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
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(v, { animate = true } = {}) {
    s.view = v === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    controls.enableZoom = s.view === '3d'; // in the front view a pinch never moves the picture
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    layout();
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
  });

  // ── the overlay: the momentum strip and the flash ───────────────────────────
  function stripData(w) {
    const p = s.plan;
    const { m1, m2, u1, u2 } = s.setup;
    const P = clean(m1 * u1 + m2 * u2);
    const before = [momentum(m1, u1), momentum(m2, u2)];
    const sum = (a, b, live) => (live ? `${F1(a)} + ${b < 0 ? `(${F1(b)})` : F1(b)} = ${F(P)}` : `${F(a)} + ${FB(b)} = ${F(P)}`);
    let now;
    let nowText;
    if (w.phase === 'contact') {
      const a = clean(Math.round(w.p1 * 10) / 10);
      now = [w.p1, P - w.p1];
      nowText = sum(a, clean(P - a), true);
    } else {
      now = [w.p1, w.p2];
      nowText = sum(w.p1, w.p2, false);
    }
    const label = w.phase === 'after' ? t('strip_after') : t('strip_now');
    const range = s.drag ? stripRange({ ...s.setup, ...elastic(m1, m2, u1, u2), P }) : stripRange(p);
    const lo = range.lo - (range.hi - range.lo) * 0.04;
    const hi = range.hi + (range.hi - range.lo) * 0.04;
    return {
      title: t('strip_title'),
      phase: t(`phase_${w.phase}`),
      range: { lo, hi },
      total: P,
      totalName: t('strip_total'),
      totalValue: F(P),
      zeroText: N('0'),
      rows: [
        { label: t('strip_before'), parts: before, sum: sum(before[0], before[1], false), hide: s.hide.rows[0], sym: SYM_U },
        { label, parts: now, sum: nowText, hide: s.hide.rows[1], sym: w.phase === 'before' ? SYM_U : w.phase === 'after' ? SYM_V : SYM_M },
      ],
      sumSamples: [sum(before[0], before[1], false), nowText, `${N('−00.0')} + (${N('−00.0')}) = ${F(P)}`],
      hideTotal: s.hide.total,
    };
  }

  const flashAt = new THREE.Vector3();
  function drawOverlay() {
    const W = stage.width;
    const H = stage.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (overlay.width !== Math.round(W * dpr) || overlay.height !== Math.round(H * dpr)) {
      overlay.width = Math.round(W * dpr);
      overlay.height = Math.round(H * dpr);
      overlay.style.width = `${W}px`;
      overlay.style.height = `${H}px`;
    }
    const ctx = octx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const w = view();
    if (w.phase === 'contact') {
      flashAt.set(s.plan.contact, Math.min(balls[1].r, balls[2].r), 0.02);
      toScreen(flashAt, sa);
      const size = Math.max(9, Math.min(18, pxPerMetre(flashAt) * 0.05));
      drawFlash(ctx, sa.x, sa.y, size, w.k);
    }
    if (!s.hide.strip) drawStrip(ctx, L.box, stripData(w));
  }
  stage.onAfterRender(drawOverlay);

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    terms: Object.fromEntries(ui.$$('.cm-term b').map((b) => [b.dataset.v, b])),
    say: $('.cm-say'),
    play: $('[data-act="play"]'),
    playIcon: $('[data-act="play"] .ic'),
    playLabel: $('[data-act="play"] .lb'),
    scrub: /** @type {HTMLInputElement} */ ($('.cm-scrub input')),
    eqs: $('.cm-eqs'),
  };
  let panelKey = '';
  function refreshPanel(w) {
    const { m1, m2, u1, u2 } = s.setup;
    const after = s.revealed && !s.drag;
    const { v1, v2 } = elastic(m1, m2, u1, u2);
    const play = s.playing ? 'pause' : s.tau >= s.plan.T - 1e-6 ? 'replay' : 'play';
    const say = w.phase === 'contact' ? 'contact' : after ? 'after' : 'before';
    const key = [m1, m2, u1, u2, after, play, say, s.preset, s.locked].join('|');
    if (key !== panelKey) {
      panelKey = key;
      const vals = {
        p_u1: F(momentum(m1, u1)),
        p_u2: FB(momentum(m2, u2)),
        p_v1: after ? F(momentum(m1, v1)) : '?',
        p_v2: after ? FB(momentum(m2, v2)) : '?',
        k_u1: F(kinetic(m1, u1), 3),
        k_u2: F(kinetic(m2, u2), 3),
        k_v1: after ? F(kinetic(m1, v1), 3) : '?',
        k_v2: after ? F(kinetic(m2, v2), 3) : '?',
      };
      for (const [k, v] of Object.entries(vals)) el.terms[k].textContent = v;
      el.eqs.classList.toggle('done', after);
      el.say.innerHTML = t(`say_${say}`);
      el.playIcon.innerHTML = play === 'pause' ? ICONS.pause : play === 'replay' ? ICONS.reset : ICONS.play;
      el.playLabel.textContent = t(`act_${play}`);
      for (const b of ui.$$('[data-preset]')) {
        const on = b.dataset.preset === s.preset;
        b.classList.toggle('on', on);
        b.setAttribute('aria-checked', String(on));
      }
    }
    const pos = String(Math.round((s.tau / s.plan.T) * 1000));
    if (el.scrub.value !== pos) el.scrub.value = pos;
    const p = s.plan;
    el.scrub.style.setProperty('--a', `${((p.Tb / p.T) * 100).toFixed(2)}%`);
    el.scrub.style.setProperty('--b', `${(((p.Tb + p.Tc) / p.T) * 100).toFixed(2)}%`);
    el.scrub.style.setProperty('--p', `${((s.tau / p.T) * 100).toFixed(2)}%`);
  }

  let noteKey = '';
  function refreshNote(w) {
    const key = w.phase === 'contact' ? 'contact' : 'slow';
    if (key === noteKey) return;
    noteKey = key;
    note.textContent = key === 'contact' ? t('note_contact') : t('note_slow', { n: SLOW });
    note.classList.toggle('hot', key === 'contact');
  }

  let lastPhase = 'before';
  function update() {
    const w = view();
    place(w);
    labels(w);
    refreshPanel(w);
    refreshNote(w);
    if (w.phase !== lastPhase) {
      lastPhase = w.phase;
      emitChange();
    }
    stage.invalidate();
  }

  // ── the run ─────────────────────────────────────────────────────────────────
  function seek(tau, { reveal = true } = {}) {
    const p = s.plan;
    s.tau = Math.min(p.T, Math.max(0, tau));
    if (reveal && s.tau >= p.Tb + p.Tc - 1e-9) s.revealed = true;
    update();
  }
  function play() {
    if (s.locked && s.mode === 'quiz') return lockedNudge();
    if (s.tau >= s.plan.T - 1e-6) seek(0, { reveal: false });
    s.playing = true;
    coach?.interrupt();
    emit('play', { t: s.tau });
    update();
  }
  function pause() {
    if (!s.playing) return;
    s.playing = false;
    emit('pause', { t: s.tau });
    update();
    emitChange();
  }
  function toggle() {
    if (s.locked && s.mode === 'quiz') return lockedNudge(); // the test plays its own scenes
    if (s.playing) pause();
    else play();
  }
  /** Plays the run from the start (used by the test's reveal); resolves true when it ends, false if cancelled. */
  function runOnce() {
    const my = ++runToken;
    seek(0, { reveal: false });
    s.playing = true;
    update();
    return new Promise((resolve) => {
      const check = () => {
        if (my !== runToken) return resolve(false);
        if (!s.playing) return resolve(s.tau >= s.plan.T - 1e-6);
        setTimeout(check, 100);
      };
      check();
    });
  }
  stage.addTicker((dt) => {
    if (!s.playing) return false;
    const p = s.plan;
    const before = s.tau;
    s.tau = Math.min(p.T, s.tau + dt);
    if (before <= p.Tb && s.tau > p.Tb) {
      audio.contact();
      emit('collide', { t: s.tau });
    }
    if (s.tau >= p.Tb + p.Tc) s.revealed = true;
    if (s.tau >= p.T) {
      s.playing = false;
      emit('end', snapshot());
      emitChange();
    }
    update();
    return true;
  });

  // ── the setup ───────────────────────────────────────────────────────────────
  /** A new setup (masses and velocities): the balls glide to their new start, the run goes back to the start. */
  function setSetup(next, { keep = 'u1', animate = true, from = null } = {}) {
    const n = normalize(next, keep);
    runToken++;
    const old = view();
    s.setup = n;
    s.preset = presetMatching(n);
    s.plan = plan(n);
    s.playing = false;
    s.revealed = false;
    s.tau = 0;
    balls[1].setMass(n.m1);
    balls[2].setMass(n.m2);
    const start = from || [old.x1, old.x2];
    tweener.cancel('slide');
    s.slide = null;
    if (animate) {
      s.slide = { from: start, k: 0 };
      tweener.animate({
        key: 'slide',
        duration: 0.4,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (s.slide) s.slide.k = k;
          update();
        },
        onComplete: () => {
          s.slide = null;
          update();
        },
      });
    }
    update();
    emit('setup', { ...s.setup, preset: s.preset });
    emitChange();
  }
  function choosePreset(id) {
    if (!PRESETS[id]) return;
    if (s.locked) return lockedNudge();
    audio.tick();
    setSetup(PRESETS[id]);
  }
  function nudge(i, du) {
    if (s.locked) return lockedNudge();
    const key = `u${i}`;
    const next = { ...s.setup, [key]: s.setup[key] + du };
    if (next[key] > U_MAX || next[key] < U_MIN) return audio.error();
    if (next.u1 <= next.u2) {
      showHint(t('hint_meet'));
      return audio.error();
    }
    audio.tick();
    coach?.objectUsed();
    setSetup(next, { keep: key });
  }

  // ── touching the balls: a tap plays or pauses, a drag sideways sets the velocity ─
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitPoint = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** Distance from p to the segment ab (px). */
  function segDist(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const k = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
    return Math.hypot(p.x - a.x - k * dx, p.y - a.y - k * dy);
  }
  /** Which ball a finger at p takes (its body or its arrow, generously), or 0. */
  function pick(p) {
    let best = 0;
    let bestD = Number.POSITIVE_INFINITY;
    const touch = matchMedia('(pointer: coarse)').matches ? 1.4 : 1;
    for (const i of [1, 2]) {
      const b = ballBox(i);
      const cx = (b.left + b.right) / 2;
      const cy = (b.top + b.bottom) / 2;
      const r = (b.right - b.left) / 2;
      const dBall = Math.max(0, Math.hypot(p.x - cx, p.y - cy) - r);
      toScreen(tail[i], sa);
      toScreen(tip[i], sb);
      const dArrow = segDist(p, sa, sb);
      const d = Math.min(dBall * 1.2, dArrow);
      if (d < 18 * touch && d < bestD) {
        best = i;
        bestD = d;
      }
    }
    return best;
  }
  /** The x on the track (m) under a canvas point. */
  function trackX(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, hitPoint) ? hitPoint.x : null;
  }

  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      if (e.button > 0) return;
      const p = canvasPoint(e);
      const i = pick(p);
      if (!i) return; // the camera controls take it (in the turned view)
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      capturePointer(ui.canvasHost, e.pointerId);
      s.drag = null;
      down = { i, id: e.pointerId, x0: p.x, y0: p.y, u0: s.setup[`u${i}`], moved: false };
    },
    true,
  );
  let down = null;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return hover(e);
    const p = canvasPoint(e);
    if (!down.moved && Math.hypot(p.x - down.x0, p.y - down.y0) < DRAG_START) return;
    if (!down.moved) {
      down.moved = true;
      // the drag starts from the start of the run: the balls stand where they start, the arrows show u₁ and u₂
      runToken++;
      s.playing = false;
      if (s.tau > 0 || s.slide) seek(0, { reveal: false });
      tweener.cancel('slide');
      s.slide = null;
      const w = stateAt(s.plan, 0);
      s.drag = { i: down.i, at: [w.x1, w.x2], start: { ...s.setup } };
      coach?.objectUsed();
      emit('dragstart', { ball: down.i });
    }
    const X = trackX(p);
    if (X == null) return;
    const i = down.i;
    const tailX = s.drag.at[i - 1];
    let u = Math.round((X - tailX) / ARROW);
    u = Math.min(U_MAX, Math.max(U_MIN, u));
    const other = s.setup[`u${3 - i}`];
    // they must meet: m₁ faster to the right than m₂
    if (i === 1 && u <= other) {
      u = other + 1;
      meetHint();
    }
    if (i === 2 && u >= other) {
      u = other - 1;
      meetHint();
    }
    if (u < U_MIN || u > U_MAX) return;
    if (u !== s.setup[`u${i}`]) {
      s.setup = { ...s.setup, [`u${i}`]: u };
      s.preset = presetMatching(s.setup);
      s.revealed = false;
      audio.tick();
      update();
    }
  });
  let meetShown = 0;
  function meetHint() {
    const now = performance.now();
    if (now - meetShown < 2500) return;
    meetShown = now;
    showHint(t('hint_meet'), { duration: 3200 });
  }
  function endPointer(e) {
    if (!down || e.pointerId !== down.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    const d = down;
    down = null;
    if (d.moved && s.drag) {
      const from = s.drag.at;
      const changed = s.drag.start.u1 !== s.setup.u1 || s.drag.start.u2 !== s.setup.u2;
      s.drag = null;
      emit('dragend', { ball: d.i, u: s.setup[`u${d.i}`] });
      if (changed) setSetup(s.setup, { keep: `u${d.i}`, from });
      else update();
      return;
    }
    if (e.type === 'pointercancel') return;
    // a tap: play or pause (a second tap at once does not undo the first)
    const now = performance.now();
    if (now - s.lastTap.ball < DOUBLE_TAP) return;
    s.lastTap.ball = now;
    toggle();
  }
  ui.canvasHost.addEventListener('pointerup', endPointer);
  ui.canvasHost.addEventListener('pointercancel', endPointer);
  let hoverQueued = false;
  function hover(e) {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'ew-resize') : '';
    });
  }

  // ── the scrubber ────────────────────────────────────────────────────────────
  el.scrub.addEventListener('input', () => {
    if (s.locked) {
      refreshPanel(view());
      return lockedNudge();
    }
    runToken++;
    s.playing = false;
    seek((Number(el.scrub.value) / 1000) * s.plan.T);
    coach?.interrupt();
  });
  el.scrub.addEventListener('change', () => emitChange());

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(html, { duration = 3600 } = {}) {
    ui.hintText.innerHTML = html;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
  }

  // ── events ──────────────────────────────────────────────────────────────────
  function snapshot() {
    const { m1, m2, u1, u2 } = s.setup;
    const p = s.plan;
    const w = stateAt(p, s.tau);
    return {
      preset: s.preset || null,
      m1,
      m2,
      u1,
      u2,
      v1: p.v1,
      v2: p.v2,
      t: clean(s.tau, 3),
      duration: clean(p.T, 3),
      phase: w.phase,
      playing: s.playing,
      revealed: s.revealed,
      momentum: {
        before: [momentum(m1, u1), momentum(m2, u2)],
        after: [momentum(m1, p.v1), momentum(m2, p.v2)],
        now: [w.p1, w.p2],
        total: p.P,
      },
      energy: {
        before: [kinetic(m1, u1), kinetic(m2, u2)],
        after: [kinetic(m1, p.v1), kinetic(m2, p.v2)],
        total: p.K,
      },
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.m1, snap.m2, snap.u1, snap.u2, snap.phase, snap.playing, snap.revealed, s.playing ? 0 : snap.t]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
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
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  /** A random clean setup: masses that add up to 4 kg, whole-number velocities. */
  function randomSetup({
    masses = [
      [3, 1],
      [1, 3],
      [2, 2],
    ],
    headon = Math.random() < 0.5,
    nonZero = true,
  } = {}) {
    for (let k = 0; k < 60; k++) {
      const [m1, m2] = pickOne(masses);
      const u1 = randInt(1, 3);
      const u2 = headon ? -randInt(1, 3) : randInt(0, u1 - 1);
      const P = m1 * u1 + m2 * u2;
      if (nonZero && P === 0) continue;
      return { m1, m2, u1, u2 };
    }
    return { ...PRESETS.heavy };
  }
  /**
   * Three wrong values from the usual mistakes (each with its note), all different from the right one. Only values
   * that come out exactly (halves and quarters; eighths for energies, d = 3), so no choice shows false precision.
   */
  function numberChoices(right, mistakes, d = 2) {
    const key = (v) => fmt(v, d);
    const exact = (v) => Math.abs(v * (d > 2 ? 8 : 4) - Math.round(v * (d > 2 ? 8 : 4))) < 1e-9;
    const seen = new Set([key(right)]);
    const wrong = [];
    for (const m of shuffle(mistakes.filter((x) => Number.isFinite(x.v) && exact(x.v)))) {
      const v = clean(m.v, 6);
      if (seen.has(key(v))) continue;
      seen.add(key(v));
      wrong.push({ ...m, v });
      if (wrong.length === 3) break;
    }
    for (let k = 1; wrong.length < 3; k++) {
      for (const v of [right + k, right - k, right + 2 * k]) {
        if (wrong.length < 3 && !seen.has(key(v))) {
          seen.add(key(v));
          wrong.push({ v, why: '' });
        }
      }
    }
    return { choices: shuffle([right, ...wrong.map((m) => m.v)]), mistakes: wrong };
  }
  const numLabel = (unit) => (v) => `${F(v, 3)}<small>${unit}</small>`;
  /** Puts a question with symbols on the sheet (the kit's say() writes plain text). */
  function ask(html) {
    $('.pvc-q-text').innerHTML = html;
  }
  /** A test scene: the setup at a moment, with what is hidden. */
  function setScene(setup, { at = 0, hide = {} } = {}) {
    runToken++;
    s.drag = null;
    down = null;
    setSetup(setup, { animate: false });
    s.hide = { rows: [false, false], total: false, vel: [false, false], strip: false, ...hide };
    seek(momentAt(s.plan, at), { reveal: false });
    s.revealed = at === 'end';
    labelState.v1 = labelState.v2 = '';
    update();
  }

  let kinds = [];
  let question = null;
  let saved = null; // the student's setup before the test
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 2, feedback: 3 },
    hooks: {
      enter() {
        saved = { setup: { ...s.setup } };
        s.mode = 'quiz';
        runToken++;
        s.playing = false;
        s.drag = null;
        down = null;
        s.locked = true;
        hideHint();
        kinds = shuffle(['total', 'v2', 'ke', pickOne(['equal', 'light']), pickOne(['same', 'two'])]);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.hide = { rows: [false, false], total: false, vel: [false, false], strip: false };
        hideHint();
        syncUI();
        setSetup(saved?.setup || PRESETS.heavy, { animate: false });
      },
      prepare(i) {
        const kind = kinds[i % kinds.length];
        s.locked = true;
        const p = (q) => plan(q);
        if (kind === 'total') {
          const q = randomSetup();
          setScene(q, { hide: { rows: [true, true], total: true } });
          const P = clean(q.m1 * q.u1 + q.m2 * q.u2);
          const mistakes = [
            { v: q.m1 * q.u1 + q.m2 * Math.abs(q.u2), why: q.u2 < 0 ? 'mis_sign' : '' },
            { v: q.m1 * q.u1, why: 'mis_one' },
            { v: q.m1 * q.u2 + q.m2 * q.u1, why: 'mis_swap' },
            { v: q.u1 + q.u2, why: 'mis_noMass' },
            { v: (q.m1 + q.m2) * (q.u1 + q.u2), why: 'mis_lump' },
            { v: q.m1 * q.u1 - q.m2 * q.u2, why: q.u2 ? 'mis_sign' : '' },
          ];
          const { choices, mistakes: used } = numberChoices(P, mistakes);
          ask(t('q_total'));
          question = { kind, q, P, used };
          return { choices, expected: P, tolerance: 1e-6, label: numLabel(t('u_p')), meta: { kind, ...q } };
        }
        if (kind === 'v2') {
          const q = randomSetup({
            masses: [
              [1, 3],
              [2, 2],
              [1, 3],
              [3, 1],
            ],
          });
          const pl = p(q);
          setScene(q, { at: 'end', hide: { rows: [false, true], vel: [false, true] } });
          const P = pl.P;
          const p1 = momentum(q.m1, pl.v1);
          const mistakes = [
            { v: P - p1, why: q.m2 !== 1 ? 'mis_noDiv' : '' },
            { v: P / q.m2, why: p1 ? 'mis_noSub' : '' },
            { v: (P + p1) / q.m2, why: p1 ? 'mis_addSub' : '' },
            { v: q.u1, why: 'mis_carry' },
            { v: -pl.v2, why: pl.v2 ? 'mis_flip' : '' },
          ];
          const { choices, mistakes: used } = numberChoices(pl.v2, mistakes);
          ask(t('q_v2', { v1: fmt(pl.v1) }));
          question = { kind, q, pl, p1, used };
          return { choices, expected: pl.v2, tolerance: 1e-6, label: numLabel(t('u_ms')), meta: { kind, ...q, v1: pl.v1 } };
        }
        if (kind === 'ke') {
          const q = randomSetup();
          setScene(q);
          const k1 = kinetic(q.m1, q.u1);
          const k2 = kinetic(q.m2, q.u2);
          const K = clean(k1 + k2);
          const mistakes = [
            { v: 2 * K, why: 'mis_half' },
            { v: 0.5 * (q.m1 * Math.abs(q.u1) + q.m2 * Math.abs(q.u2)), why: 'mis_square' },
            { v: Math.abs(k1 - k2), why: q.u2 < 0 ? 'mis_minus' : '' },
            { v: Math.abs(q.m1 * q.u1 + q.m2 * q.u2), why: 'mis_isP' },
          ];
          const { choices, mistakes: used } = numberChoices(K, mistakes, 3);
          ask(t('q_ke'));
          question = { kind, q, k1, k2, K, used };
          return { choices, expected: K, tolerance: 1e-6, label: numLabel(t('u_j')), meta: { kind, ...q } };
        }
        if (kind === 'equal') {
          const u1 = randInt(2, 3);
          const u2 = pickOne([u1 - 1, u1 - 2, -1, -2].filter((x) => x < u1 && x >= U_MIN));
          const q = { m1: 2, m2: 2, u1, u2 };
          setScene(q);
          const mistakes = [
            { v: u1, why: 'mis_keep' },
            { v: 0, why: u2 ? 'mis_stop' : '' },
            { v: (u1 + u2) / 2, why: 'mis_share' },
            { v: -u1, why: 'mis_back' },
          ];
          const { choices, mistakes: used } = numberChoices(u2, mistakes);
          ask(t('q_equal'));
          question = { kind, q, used };
          return { choices, expected: u2, tolerance: 1e-6, label: numLabel(t('u_ms')), meta: { kind, ...q } };
        }
        if (kind === 'light') {
          const q = { m1: 1, m2: 3, u1: randInt(2, 3), u2: 0 };
          setScene(q);
          const order = shuffle(['back', 'stop', 'slow', 'together']);
          ask(t('q_light'));
          question = { kind, q, order };
          return {
            choices: [0, 1, 2, 3],
            expected: order.indexOf('back'),
            tolerance: 0.5,
            label: (j) => `<span class="cm-opt">${t(`ans_${order[j]}`)}</span>`,
            meta: { kind, ...q },
          };
        }
        if (kind === 'same') {
          const q = randomSetup({
            masses: [
              [3, 1],
              [1, 3],
            ],
            headon: false,
          });
          setScene(q, { hide: { strip: true } });
          runOnce();
          const order = shuffle(['totalP', 'totalV', 'v1', 'p2']);
          ask(t('q_same'));
          question = { kind, q, order };
          return {
            choices: [0, 1, 2, 3],
            expected: order.indexOf('totalP'),
            tolerance: 0.5,
            label: (j) => `<span class="cm-opt">${t(`ans_${order[j]}`)}</span>`,
            meta: { kind, ...q },
          };
        }
        // why the momentum equation alone is not enough
        const q = randomSetup();
        setScene(q);
        const order = shuffle(['unknowns', 'changes', 'mass', 'force']);
        ask(t('q_two'));
        question = { kind, q, order };
        return {
          choices: [0, 1, 2, 3],
          expected: order.indexOf('unknowns'),
          tolerance: 0.5,
          label: (j) => `<span class="cm-opt">${t(`ans_${order[j]}`)}</span>`,
          meta: { kind, ...q },
        };
      },
      reveal(_q, correct, picked) {
        const Q = question;
        const why = (key) => (!correct && key ? t(key, mistakeVars(Q)) : '');
        const noteFor = () => (Q.used || []).find((m) => Math.abs(m.v - picked.value) < 1e-6)?.why;
        s.hide = { rows: [false, false], total: false, vel: [false, false], strip: false };
        if (Q.kind === 'total') {
          update();
          const { m1, m2, u1, u2 } = Q.q;
          return (
            t('why_total', {
              P: fmt(Q.P),
              m1,
              m2,
              u1: fmt(u1),
              u2: u2 < 0 ? `(${fmt(u2)})` : fmt(u2),
              p1: fmt(m1 * u1),
              p2: u2 < 0 ? `(${fmt(m2 * u2)})` : fmt(m2 * u2),
            }) + why(noteFor())
          );
        }
        if (Q.kind === 'v2') {
          labelState.v2 = '';
          update();
          const { m1, m2 } = Q.q;
          const br = (x) => (x < 0 ? `(${fmt(x)})` : fmt(x)); // "১ − (−০.৫)", never "১ − −০.৫"
          return t('why_v2', { v2: fmt(Q.pl.v2), P: fmt(Q.pl.P), m1, m2, v1: br(Q.pl.v1), p1: br(Q.p1) }) + why(noteFor());
        }
        if (Q.kind === 'ke') {
          update();
          return t('why_ke', { K: fmt(Q.K, 3), k1: fmt(Q.k1, 3), k2: fmt(Q.k2, 3) }) + why(noteFor());
        }
        const pl = plan(Q.q);
        if (Q.kind === 'equal') {
          runOnce();
          return t('why_equal', { v1: fmt(pl.v1), v2: fmt(pl.v2), P: fmt(pl.P) }) + why(noteFor());
        }
        if (Q.kind === 'light') {
          runOnce();
          const { m1, m2, u1 } = Q.q;
          const p1 = momentum(m1, pl.v1);
          const p2 = momentum(m2, pl.v2);
          return (
            t('why_light', { m1, m2, u1: fmt(u1), v1: fmt(pl.v1), v2: fmt(pl.v2), P: fmt(pl.P), p1: fmt(p1), p2: fmt(p2) }) +
            why({ stop: 'mis_l_stop', slow: 'mis_l_slow', together: 'mis_l_together' }[Q.order[picked.value]])
          );
        }
        if (Q.kind === 'same') {
          update();
          const { m2, u1, u2 } = Q.q;
          return (
            t('why_same', {
              P: fmt(pl.P),
              u1: fmt(u1),
              v1: fmt(pl.v1),
              su: fmt(u1 + u2),
              sv: fmt(pl.v1 + pl.v2),
              p2u: fmt(momentum(m2, u2)),
              p2v: fmt(momentum(m2, pl.v2)),
            }) + why({ totalV: 'mis_s_v', v1: 'mis_s_v1', p2: 'mis_s_p2' }[Q.order[picked.value]])
          );
        }
        update();
        return t('why_two') + why({ changes: 'mis_t_changes', mass: 'mis_t_mass', force: 'mis_t_force' }[Q.order[picked.value]]);
      },
      done() {
        s.locked = false;
        s.hide = { rows: [false, false], total: false, vel: [false, false], strip: false };
        update();
      },
    },
  });
  function mistakeVars(Q) {
    return { p1: Q.p1 != null ? fmt(Q.p1) : '' };
  }

  // ── first-use pointer: on m₁'s arrow ─────────────────────────────────────────
  let coach = null;
  if (o.coach) {
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, note],
      object: {
        label: 'coach_drag',
        candidates: () => {
          if (s.playing || s.tau > 0 || s.mode !== 'explore') return [];
          const a = toScreen(tip[1], { x: 0, y: 0 });
          const b = toScreen(tail[1], { x: 0, y: 0 });
          return [
            { x: a.x - 6, y: a.y },
            { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          ];
        },
        grabbable: (p) => pick(p) === 1,
        labelAt: coachWords,
        inset: { bottom: L.stripH + 20 },
        // the arrow grows by 1 m/s and back, as if dragged
        async demo(alive) {
          const u = s.setup.u1;
          for (let k = 0; k < 2 && alive(); k++) {
            if (u + 1 > U_MAX) break;
            s.demo = { i: 1, u: u + 1 };
            update();
            await new Promise((r) => setTimeout(r, 450));
            s.demo = null;
            update();
            await new Promise((r) => setTimeout(r, 650));
          }
          s.demo = null;
          update();
        },
        cancel: () => {
          s.demo = null;
          update();
        },
      },
    });
  }

  /**
   * Where the coach's words go (top-left, canvas px): the first of a few places round the hand that covers no label,
   * arrow, ball, the strip, the note or the corner buttons; else the one that covers least, where covering a ball,
   * an arrow or a label counts most and the note about time least (the words go once the student drags).
   */
  function coachWords(p, { w, h }) {
    const W = stage.width;
    const H = stage.height;
    const origin = stage.canvas.getBoundingClientRect();
    const rect = (e) => {
      const r = e.getBoundingClientRect();
      return { left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top };
    };
    const keep = [
      [arrowBox(1), 3],
      [arrowBox(2), 3],
      [ballBox(1), 3],
      [ballBox(2), 3],
      [L.strip, 1],
      [rect(note), 0.4],
      [rect(ui.corner), 2],
      [{ left: p.x - 24, top: p.y - 24, right: p.x + 30, bottom: p.y + 40 }, 3], // the hand itself
    ];
    for (const id of ['v1', 'v2', 'm1', 'm2']) {
      const b = anno.box(id);
      if (b) keep.push([b, 2]);
    }
    const fitX = (x) => Math.min(Math.max(x, 6), W - w - 6);
    const places = [
      { x: p.x + 30, y: p.y + 15 - h / 2 }, // right of the hand
      { x: p.x - 12, y: p.y - 22 - h }, // above it
      { x: fitX(p.x - w / 2), y: L.strip.top - h - 6 }, // just over the strip, under the balls' labels
      { x: p.x + 30, y: p.y + 44 },
      { x: fitX(p.x - w / 2), y: 8 },
      { x: 8, y: 8 },
      { x: p.x - 26 - w, y: p.y + 15 - h / 2 },
    ];
    let best = places[0];
    let bestArea = Number.POSITIVE_INFINITY;
    for (const q of places) {
      if (q.x < 4 || q.y < 4 || q.x + w > W - 4 || q.y + h > H - 4) continue;
      let area = 0;
      for (const [r, weight] of keep) {
        const ox = Math.min(q.x + w, r.right + 3) - Math.max(q.x, r.left - 3);
        const oy = Math.min(q.y + h, r.bottom + 3) - Math.max(q.y, r.top - 3);
        if (ox > 0 && oy > 0) area += ox * oy * weight;
      }
      if (area < bestArea) {
        best = q;
        bestArea = area;
        if (!area) break;
      }
    }
    return best;
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
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.preset) choosePreset(b.dataset.preset);
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'play':
        if (e.detail === 0) toggle(); // the keyboard; a finger or the mouse acted on pointerdown
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // the play button acts as it goes down (a second press at once does not undo it)
  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !(/** @type {Element} */ (e.target).closest('[data-act="play"]'))) return;
    audio.unlock();
    const now = performance.now();
    if (now - s.lastTap.button < DOUBLE_TAP) return;
    s.lastTap.button = now;
    toggle();
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === ' ' && !target.closest('button')) toggle();
    else if (k === 'p' || k === 'P') toggle();
    else if (k === 'ArrowRight' || k === 'ArrowLeft') {
      if (s.locked) lockedNudge();
      else {
        runToken++;
        s.playing = false;
        seek(s.tau + (k === 'ArrowRight' ? 0.25 : -0.25));
        emitChange();
      }
    } else if (k === 'ArrowUp' || k === 'ArrowDown') nudge(e.shiftKey ? 2 : 1, k === 'ArrowUp' ? 1 : -1);
    else if (k >= '1' && k <= '4') choosePreset(PRESET_IDS[Number(k) - 1]);
    else if (k === 'r' || k === 'R') {
      if (!s.locked) {
        runToken++;
        s.playing = false;
        seek(0, { reveal: false });
        emitChange();
      }
    } else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  addLabels();
  {
    const base = PRESETS[o.preset] ? { ...PRESETS[o.preset] } : { ...PRESETS.heavy };
    const u1 = Number.isFinite(Number(o.u1)) && o.u1 !== null && o.u1 !== '' ? Number(o.u1) : base.u1;
    const u2 = Number.isFinite(Number(o.u2)) && o.u2 !== null && o.u2 !== '' ? Number(o.u2) : base.u2;
    setSetup({ ...base, u1, u2 }, { animate: false, keep: o.u2 != null && o.u1 == null ? 'u2' : 'u1' });
    const at = /^-?\d+(\.\d+)?$/.test(String(o.at)) ? Number(o.at) : o.at;
    if (at !== '' && at != null) seek(momentAt(s.plan, at));
  }
  setView(s.view, { animate: false });
  syncUI();
  update();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start(1200);
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
     * Change any of: preset ('heavy' | 'equal' | 'light' | 'headon'), m1, m2 (kg), u1, u2 (m/s, whole numbers,
     * u1 > u2), at (a moment: 'start' | 'touch' | 'contact' | 'after' | 'end' | seconds of the run), play (true
     * plays from there, false pauses), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false && !p.play;
      if (p.view) await setView(p.view, { animate });
      if (p.preset || p.m1 != null || p.m2 != null || p.u1 != null || p.u2 != null) {
        const base = p.preset && PRESETS[p.preset] ? PRESETS[p.preset] : s.setup;
        const next = { ...base };
        for (const k of ['m1', 'm2', 'u1', 'u2']) if (p[k] != null) next[k] = Number(p[k]);
        setSetup(next, { animate, keep: p.u2 != null && p.u1 == null ? 'u2' : 'u1' });
      }
      if (p.at != null && p.at !== '') {
        runToken++;
        s.playing = false;
        seek(momentAt(s.plan, p.at));
        emitChange();
      }
      if (p.play === true) play();
      if (p.play === false) pause();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      runToken++;
      s.hide = { rows: [false, false], total: false, vel: [false, false], strip: false };
      setSetup(PRESETS.heavy, { animate: false });
      hideHint();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    /** The picture with the momentum strip (the 3D canvas and the overlay), cover-fitted to w×h. */
    capture({ width: w = 800, height: h = 500, background = '#ffffff' } = {}) {
      stage.render();
      drawOverlay();
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ctx = out.getContext('2d');
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
      }
      const c = stage.canvas;
      const k = Math.max(w / c.width, h / c.height);
      const dw = c.width * k;
      const dh = c.height * k;
      ctx.drawImage(c, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.drawImage(overlay, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return out.toDataURL('image/png');
    },
    exportRoot: () => world,
  };
}
