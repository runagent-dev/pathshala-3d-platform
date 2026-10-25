// Conservation of momentum and energy (book pages 72–73, topic 3.5.1), student view: two balls, m₁ behind m₂, on a
// smooth straight track (চিত্র ৩.০৪). The student picks an example (heavy behind, equal masses, light behind,
// head-on) or drags a ball's blue velocity arrow to choose u₁ and u₂, then plays the collision in slow motion (or
// scrubs it): the balls approach, touch (the flash; that moment slowed much more), and move apart with v₁ and v₂.
// Each ball carries one tag on its outer side (m₁'s to the left, m₂'s to the right), hung on a dashed stalk above
// its arrow: its mass over its velocity. Under the picture a momentum strip shows m₁'s and m₂'s momenta tip to
// tail, before and now: while they touch, the parts trade but the row always ends on the dashed total. The panel
// writes the book's two equations with the student's numbers under the names of the two laws, the after side as
// "?" until the balls have collided. Then a short test. Built on the shared student kit (@shared/student/…); the
// physics is in collision.js.
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
  D_MAX,
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
  reachableSetups,
  stateAt,
  stripRange,
} from './collision.js';
import { createI18n } from './i18n.js';
import { drawFlash, drawStrip, stripHeight } from './ledger.js';
import { BALL_TINTS, createBall, createTrack } from './scene.js';

export const DEFAULTS = {
  preset: 'heavy', // 'heavy' | 'equal' | 'light' | 'headon'
  u1: null, // m/s: instead of the example's (whole numbers, −3…3, u₁ > u₂, u₁ − u₂ ≤ 4)
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
// the arrows' heights above the taller ball: m₂'s just above it, m₁'s a little higher, so they never overlap
const LANE_GAP = [0.075, 0.03];
const LANE_TOP = 2 * radiusOf(3) + LANE_GAP[0]; // the framing keeps room for this (the examples' biggest ball)
const TRACK_FRONT = 0.13; // m: the framing shows the track this far towards the camera (its front edge may go)
const TAG_GAP = 6; // px between the tags' lower edge and m₁'s arrow
const DRAG_START = 7; // px a finger moves before a touch on a ball becomes a drag (less: a tap plays or pauses)
const DOUBLE_TAP = 400; // ms: a second tap this soon does not undo the first
const SAY_HINT = 3800; // ms a hint stays in the panel's sentence line
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
// the "which pair also keeps the kinetic energy" question: for each example, four (v₁, v₂) pairs that all keep the
// momentum; the first is the right one, 'low' is the pair of two stuck together
const PAIRS = {
  heavy: [
    [1, 3],
    [1.5, 1.5, 'low'],
    [0.5, 4.5],
    [0, 6],
  ],
  equal: [
    [1, 3],
    [2, 2, 'low'],
    [0, 4],
    [-1, 5],
  ],
  light: [
    [-1, 1],
    [0.5, 0.5, 'low'],
    [-2.5, 1.5],
    [-4, 2],
  ],
};

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
  /** A value for a worked answer, in brackets when negative ("১ − (−০.৫)", never "১ − −০.৫"). */
  const br = (x, d = 2) => (x < 0 ? `(${fmt(x, d)})` : fmt(x, d));

  root.classList.add('pvc', 'cm');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  const term = (key) => `<span class="cm-term"><b data-v="${key}">0</b><small>${t(`sym_${key}`)}</small></span>`;
  const row = (kind) =>
    `<p class="cm-cap ${kind}">${t(kind === 'p' ? 'eq_p_name' : 'eq_k_name')}</p>` +
    `<div class="cm-row ${kind}" role="row"><span class="cm-name"><b>${t(`row_${kind}`)}</b><small>${t(kind === 'p' ? 'u_p' : 'u_j_long')}</small></span>` +
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
  note.hidden = true; // until the run first moves
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
  // a short arrow keeps a short, small head, so ½ m/s still reads as an arrow
  const arrowStyle = { color: COLORS.velocity, radius: 0.0055, head: 0.03, headRadius: 0.0135 };
  const arrows = { 1: createArrow({ ...arrowStyle, name: 'Velocity1' }), 2: createArrow({ ...arrowStyle, name: 'Velocity2' }) };
  world.add(track.root, balls[1].root, balls[2].root, arrows[1].root, arrows[2].root);
  // a thin dashed stalk from each ball up past its arrow's tail to its tag: the arrow and the tag belong to that ball
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
  const NO_HIDE = () => ({ rows: [false, false], total: false, vel: [false, false], strip: false });
  const s = {
    setup: { ...PRESETS.heavy },
    preset: 'heavy',
    plan: plan(PRESETS.heavy),
    tau: 0, // s of the run on screen
    playing: false,
    played: false, // the run has moved (played or scrubbed): from then on the note about time shows
    revealed: false, // the balls have collided (in this setup): the after side of the equations shows
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    drag: null, // { i, at: [x1, x2], start }
    slide: null, // { from: [x1, x2], k }: the balls glide to the new start after the setup changed
    demo: null, // { i, u }: the coach shows an arrow a little longer
    hide: NO_HIDE(),
    sayHint: null, // { key, vars }: a hint in the panel's sentence line for a moment
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

  // ── the picture: balls, arrows, tags ────────────────────────────────────────
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

  const anno = createAnnotations({ stage, layer: ui.annoLayer });
  const v3 = new THREE.Vector3();
  function toScreen(p, out = { x: 0, y: 0 }) {
    v3.copy(p).project(camera);
    out.x = (v3.x * 0.5 + 0.5) * stage.width;
    out.y = (-v3.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  const sa = { x: 0, y: 0 };
  const sb = { x: 0, y: 0 };
  /** The screen box of an arrow (or of its tail point), a little padded. */
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
    const a = toScreen(p, { x: 0, y: 0 });
    probe.copy(p).x += 0.1;
    const b = toScreen(probe, { x: 0, y: 0 });
    return Math.hypot(b.x - a.x, b.y - a.y) / 0.1;
  }

  // One tag per ball, always on its outer side (m₁'s to the left of its stalk, m₂'s to the right: never towards the
  // other ball), level with the other's, just above m₁'s arrow: the ball's mass over its velocity. Its dot sits on
  // the top of the ball's stalk, never on an arrow. Both tags keep their height, so they never meet each other, an
  // arrow or a ball; the framing keeps them under the corner buttons and the note.
  const tagPoint = { 1: new THREE.Vector3(), 2: new THREE.Vector3() };
  const outer = (i) => (i === 1 ? -1 : 1);
  let tagH = 36; // px, measured once drawn
  function addTags() {
    for (const i of [1, 2]) anno.add(`b${i}`, { text: '', point: () => tagPoint[i], kind: 'part', dx: 7 * outer(i), dy: 0 });
  }
  /** Before each frame: the tags' points and the stalks, a fixed number of pixels above m₁'s arrow. */
  function placeTags() {
    camera.updateMatrixWorld();
    const lane = lanes();
    const lift = (tagH / 2 + TAG_GAP) / Math.max(1, pxPerMetre(tail[1]));
    for (const i of [1, 2]) {
      const x = balls[i].root.position.x;
      tagPoint[i].set(x, lane[0] + lift, 0);
      const pos = stalks[i].geometry.attributes.position;
      pos.setXYZ(0, x, 2 * balls[i].r + 0.008, 0);
      pos.setXYZ(1, x, lane[0] + lift, 0);
      pos.needsUpdate = true;
      stalks[i].computeLineDistances();
    }
  }
  stage.onBeforeRender(placeTags);
  stage.onAfterRender(() => {
    const b = anno.box('b1');
    if (b && Math.abs(b.bottom - b.top - tagH) > 0.5) {
      tagH = b.bottom - b.top;
      if (!s.userMovedCamera) flyTo(viewPose(), 0);
    }
  });
  const tagState = { b1: '', b2: '' };
  /** The tags' words: mass, then u before, the velocity now while touching, v after (or "?" when a test asks). */
  function tags(w) {
    for (const i of [1, 2]) {
      const mass = t(`lbl_mass${i}`, { m: fmt(s.setup[`m${i}`]) });
      const v = i === 1 ? w.v1 : w.v2;
      let vt;
      if (w.phase === 'before') vt = t(`lbl_u${i}`, { v: fmt(v) });
      else if (w.phase === 'contact') vt = t('lbl_now', { v: fmt(v, 1, 1) });
      else vt = s.hide.vel[i - 1] ? t(`lbl_v${i}_q`) : t(`lbl_v${i}`, { v: fmt(v) });
      const html = `<span class="tm">${mass}</span><span class="tv">${vt}</span>`;
      if (tagState[`b${i}`] !== html) {
        tagState[`b${i}`] = html;
        anno.setText(`b${i}`, html);
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
    const box = new THREE.Box3(new THREE.Vector3(WINDOW.left, -0.01, -0.1), new THREE.Vector3(WINDOW.right, LANE_TOP, TRACK_FRONT));
    const sr = ui.stage.getBoundingClientRect();
    const corner = ui.corner.getBoundingClientRect();
    // the tags hang tagH + TAG_GAP above m₁'s arrow and stay under the corner buttons and the note about time
    const below = Math.max(corner.bottom - sr.top, 38) + 4;
    const top = below + tagH + TAG_GAP;
    const fit = (dir) => fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: { top, bottom: L.stripH + 18, side: 8 } });
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
    // one sentence for the moment: a hint first; the sign convention when a velocity points left
    const say = s.sayHint
      ? t(s.sayHint.key, s.sayHint.vars)
      : w.phase === 'contact'
        ? t('say_contact')
        : after
          ? t('say_after')
          : t(u1 < 0 || u2 < 0 ? 'say_before_sign' : 'say_before');
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
      el.say.innerHTML = say;
      el.say.classList.toggle('hint', Boolean(s.sayHint));
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
  let hintTimer = 0;
  /** A hint in the panel's sentence line (never over the picture), for a moment. */
  function sayHint(key, vars) {
    s.sayHint = { key, vars };
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      s.sayHint = null;
      update();
    }, SAY_HINT);
    update();
  }

  let noteKey = '';
  function refreshNote(w) {
    note.hidden = !s.played;
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
    tags(w);
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
    if (s.tau > 0) s.played = true;
    if (reveal && s.tau >= p.Tb + p.Tc - 1e-9) s.revealed = true;
    update();
  }
  function play() {
    if (s.locked && s.mode === 'quiz') return lockedNudge();
    if (s.tau >= s.plan.T - 1e-6) seek(0, { reveal: false });
    s.playing = true;
    s.played = true;
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
  /** Plays the run from the start (used by the test's scenes); resolves true when it ends, false if cancelled. */
  function runOnce() {
    const my = ++runToken;
    seek(0, { reveal: false });
    s.playing = true;
    s.played = true;
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
      sayHint('hint_meet');
      return audio.error();
    }
    if (next.u1 - next.u2 > D_MAX) {
      sayHint('hint_gap', { d: D_MAX });
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

  let down = null;
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
      down = { i, id: e.pointerId, x0: p.x, y0: p.y, moved: false };
    },
    true,
  );
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
    let u = Math.min(U_MAX, Math.max(U_MIN, Math.round((X - tailX) / ARROW)));
    const other = s.setup[`u${3 - i}`];
    // they must meet (m₁ faster to the right than m₂), and the run must fit the picture (u₁ − u₂ ≤ D_MAX)
    if (i === 1 && u <= other) {
      u = other + 1;
      sayOnce('hint_meet');
    } else if (i === 2 && u >= other) {
      u = other - 1;
      sayOnce('hint_meet');
    } else if (Math.abs(u - other) > D_MAX) {
      u = other + (i === 1 ? D_MAX : -D_MAX);
      sayOnce('hint_gap', { d: D_MAX });
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
  let hintShown = 0;
  function sayOnce(key, vars) {
    const now = performance.now();
    if (now - hintShown < 1500 && s.sayHint?.key === key) return;
    hintShown = now;
    sayHint(key, vars);
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

  /** In the test the scene stays put: the reason goes in the test's own line (until the student answers). */
  function lockedNudge() {
    audio.error();
    if (s.mode !== 'quiz' || quiz.revealed) return;
    const fb = $('.pvc-q-feedback');
    fb.textContent = t('q_locked');
    fb.dataset.tone = '';
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
  const SETUPS = reachableSetups();
  /** A random setup the student could make, among those that pass `ok`. */
  const randomSetup = (ok) => ({ ...pickOne(SETUPS.filter(ok)) });
  /**
   * The right value and three wrong ones, each a real mistake with its note (a mistake without a note is not
   * offered), all different, and exact (halves and quarters; eighths for energies, d = 3), so no choice shows false
   * precision. null when the setup gives fewer than three.
   */
  function numberChoices(right, mistakes, d = 2) {
    const key = (v) => fmt(v, d);
    const q = d > 2 ? 8 : 4;
    const exact = (v) => Number.isFinite(v) && Math.abs(v * q - Math.round(v * q)) < 1e-9;
    const seen = new Set([key(right)]);
    const wrong = [];
    for (const m of shuffle(mistakes.filter((x) => x.why && exact(x.v)))) {
      const v = clean(m.v, 6);
      if (seen.has(key(v))) continue;
      seen.add(key(v));
      wrong.push({ ...m, v });
      if (wrong.length === 3) break;
    }
    return wrong.length < 3 ? null : { choices: shuffle([right, ...wrong.map((m) => m.v)]), used: wrong };
  }
  /** A numeric question: random setups until one gives three real mistakes. */
  function numeric(pickSetup, build, d = 2) {
    for (let k = 0; k < 100; k++) {
      const q = pickSetup();
      const b = build(q);
      const c = numberChoices(b.right, b.mistakes, d);
      if (c) return { q, ...b, ...c };
    }
    return null;
  }
  const numLabel = (unit) => (v) => `${F(v, 3)}<small>${unit}</small>`;
  const wordLabel = (keys) => (j) => `<span class="cm-opt">${t(`ans_${keys[j]}`)}</span>`;
  /** Puts a question with symbols on the sheet (the kit's say() writes plain text). */
  function ask(html) {
    $('.pvc-q-text').innerHTML = html;
  }
  /** A test scene: the setup at a moment, with what is hidden. */
  function setScene(setup, { at = 0, hide = {} } = {}) {
    runToken++;
    s.drag = null;
    down = null;
    s.sayHint = null;
    setSetup(setup, { animate: false });
    s.hide = { ...NO_HIDE(), ...hide };
    seek(momentAt(s.plan, at), { reveal: false });
    s.revealed = at === 'end';
    tagState.b1 = tagState.b2 = '';
    update();
  }

  /** Each kind of question: set up its scene, return the quiz's question. */
  const ASK = {
    // the total momentum before (strip hidden); half the time head-on, so the sign matters; never with m₂ at rest
    total() {
      const headon = Math.random() < 0.5;
      const Q = numeric(
        () => randomSetup((q) => q.u1 > 0 && (headon ? q.u2 < 0 : q.u2 > 0) && q.m1 * q.u1 + q.m2 * q.u2 !== 0),
        ({ m1, m2, u1, u2 }) => ({
          right: clean(m1 * u1 + m2 * u2),
          mistakes: [
            { v: m1 * u1 + m2 * Math.abs(u2), why: u2 < 0 ? 'mis_sign' : '' },
            { v: m1 * u1 - m2 * u2, why: u2 > 0 ? 'mis_subtract' : '' },
            { v: m1 * u1, why: 'mis_one' },
            { v: m2 * u2, why: 'mis_one' },
            { v: m1 * u2 + m2 * u1, why: 'mis_swap' },
            { v: u1 + u2, why: 'mis_noMass' },
            { v: (m1 + m2) * (u1 + u2), why: 'mis_lump' },
          ],
        }),
      );
      setScene(Q.q, { hide: { rows: [true, true], total: true } });
      ask(t(Q.q.u2 < 0 ? 'q_total_sign' : 'q_total'));
      return { Q, label: numLabel(t('u_p')) };
    },
    // v₂ from the momentum equation, at the end of the run (v₂ and the strip's after row hidden)
    v2() {
      const Q = numeric(
        () => randomSetup(() => true),
        (q) => {
          const { v1, v2, P } = plan(q);
          const p1 = momentum(q.m1, v1);
          return {
            right: v2,
            v1,
            P,
            p1,
            mistakes: [
              { v: P - p1, why: q.m2 !== 1 ? 'mis_noDiv' : '' },
              { v: P / q.m2, why: p1 ? 'mis_noSub' : '' },
              { v: (P + p1) / q.m2, why: p1 ? 'mis_addSub' : '' },
              { v: (P - v1) / q.m2, why: q.m1 !== 1 && v1 ? 'mis_vNotP' : '' },
              { v: P / (q.m1 + q.m2), why: 'mis_together' },
              { v: -v2, why: v2 ? 'mis_flip' : '' },
            ],
            vars: { p1: fmt(p1) },
          };
        },
      );
      setScene(Q.q, { at: 'end', hide: { rows: [false, true], vel: [false, true] } });
      ask(t('q_v2', { v1: fmt(Q.v1) }));
      return { Q, label: numLabel(t('u_ms')) };
    },
    // the kinetic energy after, with the book's assumption
    ke() {
      const Q = numeric(
        () => randomSetup((q) => q.u1 > 0 && q.u2 !== 0),
        ({ m1, m2, u1, u2 }) => {
          const k1 = kinetic(m1, u1);
          const k2 = kinetic(m2, u2);
          const K = clean(k1 + k2);
          return {
            right: K,
            k1,
            k2,
            mistakes: [
              { v: 2 * K, why: 'mis_half' },
              { v: 0.5 * (m1 * Math.abs(u1) + m2 * Math.abs(u2)), why: 'mis_square' },
              { v: Math.abs(k1 - k2), why: u2 < 0 ? 'mis_minus' : '' },
              { v: Math.abs(m1 * u1 + m2 * u2), why: 'mis_isP' },
              { v: 0.5 * (m1 + m2) * (u1 + u2) ** 2, why: 'mis_kLump' },
            ],
          };
        },
        3,
      );
      setScene(Q.q);
      ask(t('q_ke'));
      return { Q, label: numLabel(t('u_j')) };
    },
    // equal masses: predict v₁ (the run plays after the answer)
    equal() {
      const Q = numeric(
        () => randomSetup((q) => q.m1 === 2 && q.u1 >= 2),
        ({ u1, u2 }) => ({
          right: u2,
          mistakes: [
            { v: u1, why: 'mis_keep' },
            { v: 0, why: u2 ? 'mis_stop' : '' },
            { v: (u1 + u2) / 2, why: 'mis_share' },
            { v: -u1, why: 'mis_back' },
          ],
        }),
      );
      setScene(Q.q);
      ask(t('q_equal'));
      return { Q, label: numLabel(t('u_ms')) };
    },
    // a light ball into a heavy one at rest: what it does (the run plays after the answer)
    light() {
      const q = { m1: 1, m2: 3, u1: randInt(2, 3), u2: 0 };
      setScene(q);
      const order = shuffle(['back', 'stop', 'slow', 'together']);
      ask(t('q_light'));
      return { Q: { q, order, choices: [0, 1, 2, 3], right: order.indexOf('back') }, label: wordLabel(order) };
    },
    // the run plays (strip hidden): which of four things is the same before and after
    same() {
      let q;
      for (let k = 0; k < 50; k++) {
        q = randomSetup((x) => x.m1 !== x.m2 && x.u2 >= 0);
        const p = plan(q);
        if (Math.abs(q.u1 + q.u2 - p.v1 - p.v2) > 0.4 && p.v1 !== q.u1 && p.v2 !== q.u2) break;
      }
      setScene(q, { hide: { strip: true } });
      runOnce();
      const order = shuffle(['totalP', 'totalV', 'v1', 'p2']);
      ask(t('q_same'));
      return { Q: { q, order, choices: [0, 1, 2, 3], right: order.indexOf('totalP') }, label: wordLabel(order) };
    },
    // four (v₁, v₂) pairs that all keep the momentum: which also keeps the kinetic energy (the run plays after)
    pairs() {
      const id = pickOne(['heavy', 'equal', 'light']);
      const q = { ...PRESETS[id] };
      setScene(q);
      const pairs = shuffle(PAIRS[id].map((p, k) => ({ v1: p[0], v2: p[1], low: p[2] === 'low', right: k === 0 })));
      ask(t('q_pairs'));
      return {
        Q: { q, pairs, choices: [0, 1, 2, 3], right: pairs.findIndex((p) => p.right) },
        label: (j) => `<span class="cm-pair">(${F(pairs[j].v1)}, ${F(pairs[j].v2)})</span>`,
      };
    },
  };

  /** The worked answer for each kind: the answer first, the sum with units, and the note on the mistake picked. */
  const WHY = {
    total(Q) {
      const { m1, m2, u1, u2 } = Q.q;
      return t('why_total', { P: fmt(Q.right), m1, m2, u1: br(u1), u2: br(u2), p1: br(m1 * u1), p2: br(m2 * u2) });
    },
    v2(Q) {
      const { m1, m2 } = Q.q;
      return t('why_v2', { v2: fmt(Q.right), P: fmt(Q.P), m1, m2, v1: br(Q.v1), p1: br(Q.p1) });
    },
    ke: (Q) => t('why_ke', { K: fmt(Q.right, 3), k1: fmt(Q.k1, 3), k2: fmt(Q.k2, 3) }),
    equal(Q) {
      const pl = plan(Q.q);
      return t('why_equal', { v1: fmt(pl.v1), v2: fmt(pl.v2), P: fmt(pl.P) });
    },
    light(Q, picked) {
      const pl = plan(Q.q);
      const { m1, m2, u1 } = Q.q;
      const note = { stop: 'mis_l_stop', slow: 'mis_l_slow', together: 'mis_l_together' }[Q.order[picked.value]];
      return (
        t('why_light', {
          m1,
          m2,
          u1: fmt(u1),
          v1: fmt(pl.v1),
          v2: fmt(pl.v2),
          P: fmt(pl.P),
          p1: fmt(momentum(m1, pl.v1)),
          p2: fmt(momentum(m2, pl.v2)),
        }) + (picked.wrong && note ? t(note) : '')
      );
    },
    same(Q, picked) {
      const pl = plan(Q.q);
      const { m2, u1, u2 } = Q.q;
      const note = { totalV: 'mis_s_v', v1: 'mis_s_v1', p2: 'mis_s_p2' }[Q.order[picked.value]];
      return (
        t('why_same', {
          P: fmt(pl.P),
          u1: fmt(u1),
          v1: fmt(pl.v1),
          su: fmt(u1 + u2),
          sv: fmt(pl.v1 + pl.v2),
          p2u: fmt(momentum(m2, u2)),
          p2v: fmt(momentum(m2, pl.v2)),
        }) + (picked.wrong && note ? t(note) : '')
      );
    },
    pairs(Q, picked) {
      const { m1, m2 } = Q.q;
      const K = plan(Q.q).K;
      const r = Q.pairs[Q.right];
      let note = '';
      if (picked.wrong) {
        const p = Q.pairs[picked.value];
        const k = clean(kinetic(m1, p.v1) + kinetic(m2, p.v2));
        note = t(p.low ? 'mis_pairLow' : k < K ? 'mis_pairLess' : 'mis_pairHigh', { a: fmt(p.v1), b: fmt(p.v2), k: fmt(k, 3) });
      }
      return t('why_pairs', { v1: fmt(r.v1), v2: fmt(r.v2), K: fmt(K, 3), m1, m2, v1s: `${br(r.v1)}²`, v2s: `${br(r.v2)}²` }) + note;
    },
  };

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
        s.sayHint = null;
        kinds = shuffle(['total', 'v2', 'pairs', pickOne(['equal', 'light']), pickOne(['same', 'ke'])]);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.hide = NO_HIDE();
        syncUI();
        setSetup(saved?.setup || PRESETS.heavy, { animate: false });
      },
      prepare(i) {
        const kind = kinds[i % kinds.length];
        s.locked = true;
        const { Q, label } = ASK[kind]();
        question = { kind, ...Q };
        const words = typeof Q.right === 'number' && Q.choices.length === 4 && !Q.used;
        return {
          choices: Q.choices,
          expected: Q.right,
          tolerance: words ? 0.5 : 1e-6,
          label,
          meta: { kind, ...Q.q },
        };
      },
      reveal(_q, correct, picked) {
        const Q = question;
        s.hide = NO_HIDE();
        tagState.b1 = tagState.b2 = '';
        // the prediction questions play the run, so the answer is seen as well as told
        if (Q.kind === 'equal' || Q.kind === 'light' || Q.kind === 'pairs') runOnce();
        else update();
        const pick = { value: picked.value, wrong: !correct };
        let work = WHY[Q.kind](Q, pick);
        if (!correct && Q.used) {
          const m = Q.used.find((x) => Math.abs(x.v - picked.value) < 1e-6);
          if (m?.why) work += t(m.why, Q.vars || {});
        }
        return work;
      },
      done() {
        s.locked = false;
        s.hide = NO_HIDE();
        update();
      },
    },
  });

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
            if (u + 1 > U_MAX || u + 1 - s.setup.u2 > D_MAX) break;
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
   * Where the coach's words go (top-left, canvas px): the first of a few places round the hand that covers no tag,
   * arrow, ball, the strip or the corner buttons; else the one that covers least (a ball, an arrow or a tag counts
   * most).
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
      [rect(ui.corner), 2],
      [{ left: p.x - 24, top: p.y - 24, right: p.x + 30, bottom: p.y + 40 }, 3], // the hand itself
    ];
    if (!note.hidden) keep.push([rect(note), 1]);
    for (const id of ['b1', 'b2']) {
      const b = anno.box(id);
      if (b) keep.push([b, 3]);
    }
    const fitX = (x) => Math.min(Math.max(x, 6), W - w - 6);
    const places = [
      { x: p.x + 30, y: p.y + 15 - h / 2 }, // right of the hand
      { x: fitX(p.x - w / 2), y: L.strip.top - h - 6 }, // just over the strip, under the balls
      { x: p.x + 30, y: p.y + 44 },
      { x: p.x - 12, y: p.y - 22 - h }, // above it
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
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  addTags();
  {
    const base = PRESETS[o.preset] ? { ...PRESETS[o.preset] } : { ...PRESETS.heavy };
    const given = (x) => x !== null && x !== undefined && x !== '' && Number.isFinite(Number(x));
    const u1 = given(o.u1) ? Number(o.u1) : base.u1;
    const u2 = given(o.u2) ? Number(o.u2) : base.u2;
    setSetup({ ...base, u1, u2 }, { animate: false, keep: given(o.u2) && !given(o.u1) ? 'u2' : 'u1' });
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
     * u1 > u2, u1 − u2 ≤ 4), at (a moment: 'start' | 'touch' | 'contact' | 'after' | 'end' | seconds of the run),
     * play (true plays from there, false pauses), view; animate: false jumps.
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
      s.hide = NO_HIDE();
      s.sayHint = null;
      setSetup(PRESETS.heavy, { animate: false });
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
