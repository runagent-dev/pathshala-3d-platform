// Refraction of light (book pages 243–248, topics 9.1, 9.1.1, 9.1.2), student view. A thick glass block on a plain
// table, and a torch that rides a graduated arc round the point of incidence O, so it always shines at O and the
// student turns it (drag, or the arrow keys) to set θ₁. Five steps, one tap each, slow: ① the light goes in, bends and
// slows (wavefronts march, closer together in the glass; the panel shows v = c/n for the book's table); ② the normal
// and the two angles: into a denser medium it bends toward the normal (a θ₂–θ₁ graph); ③ the first law in true 3D: the
// upright plane through the ray and the normal, and the camera swings round to look along it, where all three lines
// fall on one; ④ the second law: Measure (মাপো) at three angles leaves dots on a sin θ₁–sin θ₂ graph, a straight line whose
// steepness is n₂ (the media can be changed: water, glass, diamond); ⑤ water poured over a glass slab: the relative
// refractive index 1.14. Rays come from trace() in reading.js; the drawing is vector, on a canvas over the view.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  APERTURE,
  ARC_R,
  CHOOSABLE,
  clampAngle,
  MAX_ANGLE,
  MEDIA,
  MIN_ANGLE,
  measure,
  nextPreset,
  O,
  PRESETS,
  refractAngle,
  round,
  SLAB,
  START_ANGLE,
  shuffle,
  speedMantissa,
  TABLE,
  TOP,
  trace,
} from './reading.js';
import { backdrop, createSetting, SHEET } from './scene.js';

export const DEFAULTS = {
  view: 'front',
  mode: 'explore',
  step: 'intro',
  medium: 'glass',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

export const STEPS = ['slow', 'bend', 'plane', 'law', 'relative'];
const ORDER = ['intro', ...STEPS];
const COLORS = { ray: '#e08e00', t1: '#1971c2', t2: '#2b8a3e', law: '#7048e8', ink: '#1d2733', normal: '#495057' };
const N_WATER = MEDIA.water.n;
const N_GLASS = MEDIA.glass.n;
const DOUBLE_TAP = 420; // ms
const MARCH_S = 9; // s the wavefronts march, then they rest where they are
const MARGIN = { top: 58, bottom: 30, side: 14 }; // room for the corner buttons on top and the labels at the foot
// how long things take (s): slow enough to follow
const T = {
  ray: 1.1,
  inside: 1.1,
  refl: 0.6,
  normal: 1.2,
  arcs: 1.0,
  sheet: 1.6,
  edge: 2.2,
  hold: 1.4,
  back: 2.0,
  fly: 1.6,
  fill: 2.6,
  turn: 1.5,
  jump: 0.9,
};
/** What shows at the end of each step (0 … 1 each). */
const TARGET = {
  intro: { inK: 0, outK: 0, refl: 0, march: 0, normal: 0, arcs: 0, sheet: 0, right: 0, fill: 0, normal0: 0 },
  slow: { inK: 1, outK: 1, refl: 1, march: 1, normal: 0, arcs: 0, sheet: 0, right: 0, fill: 0, normal0: 0 },
  bend: { inK: 1, outK: 1, refl: 1, march: 0, normal: 1, arcs: 1, sheet: 0, right: 0, fill: 0, normal0: 0 },
  plane: { inK: 1, outK: 1, refl: 1, march: 0, normal: 1, arcs: 1, sheet: 1, right: 1, fill: 0, normal0: 0 },
  law: { inK: 1, outK: 1, refl: 1, march: 0, normal: 1, arcs: 1, sheet: 0, right: 0, fill: 0, normal0: 0 },
  relative: { inK: 1, outK: 1, refl: 1, march: 0, normal: 1, arcs: 1, sheet: 0, right: 0, fill: 1, normal0: 1 },
};
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const box = (a, b, c, d, e, f) => new THREE.Box3(V(a, b, c), V(d, e, f));
/**
 * What the camera shows: a box to fill (the whole glass, the ray's end on the floor, the normal), the angle to see it
 * from (azimuth from the front toward +x, elevation), and the torch's angles whose body must be in view too (poseOf
 * adds them: the torch where it is now, and for the steps where it travels, both ends of its travel).
 */
const FRAMES = {
  intro: { box: box(-10, -0.3, -4.5, 10, 8, 4.5), az: 26, el: 17, torch: [] },
  slow: { box: box(-10, -0.3, -4.5, 10, 8, 4.5), az: 22, el: 13, torch: [] },
  bend: { box: box(-10, -0.3, -4.5, 10, 13.2, 4.5), az: 22, el: 12, torch: [] },
  plane: { box: box(-12.5, -0.3, -4.5, 11.5, 19.5, 4.5), az: 42, el: 16, torch: [] },
  edge: { box: box(-10, -0.6, -4.5, 10, 19.5, 4.5), az: 90, el: 14, torch: [] },
  law: { box: box(-10, -0.3, -4.5, 10, 13.2, 4.5), az: 22, el: 12, torch: [30, 70] },
  relative: { box: box(-10.5, -0.3, -5, 10.5, 13.2, 5), az: 22, el: 13, torch: [30, 70] },
};
const FRAME_OF = { intro: 'intro', slow: 'slow', bend: 'bend', plane: 'plane', law: 'law', relative: 'relative' };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const fx = (x, d = 2) => N(Number(x).toFixed(d));
  const deg1 = (x) => N(round(x, 1));
  /** A refractive index as the book prints it: 1.33, 1.52, 1.6. */
  const nx = (n) => N(round(n, 2));
  /** A speed as the book writes it: 2.26 × 10⁸ m/s. */
  const sci = (m) => `${fx(m)}&nbsp;×&nbsp;${N(10)}<sup>${N(8)}</sup>&nbsp;m/s`;

  root.classList.add('pvc', 'rl');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'replay', label: 'act_replay', icon: ICONS.play },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      tight: true,
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the line before the action: what the next tap will show (on the first screen, a few calm words)
  const lead = document.createElement('p');
  lead.className = 'rl-lead';
  $('.pvc-act-row').before(lead);
  // the box under the rule: the medium to choose and the graph
  const boxEl = document.createElement('div');
  boxEl.className = 'rl-box';
  boxEl.innerHTML = `<div class="rl-media" role="radiogroup" aria-label="${t('medium')}"><span class="rl-media-name">${t('medium')}:</span>${CHOOSABLE.map(
    (id) => `<button type="button" role="radio" aria-checked="false" data-medium="${id}">${t(`m_${id}`)}</button>`,
  ).join(
    '',
  )}</div><button type="button" class="rl-rev" data-act="rev" aria-pressed="false" aria-label="${t('aria_rev')}" hidden>${t('act_rev')}</button><div class="rl-graph"></div>`;
  // the calm first card and the step's words (result, box, rule) share one place, so the panel keeps its height
  const card = document.createElement('p');
  card.className = 'rl-card pvc-note';
  card.innerHTML = `<span class="rl-long">${t('intro')}</span><span class="rl-short">${t('intro_short')}</span>`;
  const stack = document.createElement('div');
  stack.className = 'rl-stack';
  const outcomeEl = /** @type {HTMLElement} */ ($('.pvc-outcome'));
  const ruleEl = /** @type {HTMLElement} */ ($('.pvc-rule'));
  outcomeEl.before(stack);
  stack.append(card, outcomeEl, boxEl, ruleEl);
  /** The card takes exactly the room of the result and the rule it stands for (measured with them shown). */
  function fitCard() {
    const calm = ui.learn.classList.contains('rl-calm');
    if (calm) ui.learn.classList.remove('rl-calm');
    const gap = Number.parseFloat(getComputedStyle(stack).rowGap) || 0;
    const h = outcomeEl.offsetHeight + ruleEl.offsetHeight + gap;
    if (calm) ui.learn.classList.add('rl-calm');
    if (h > 0) card.style.minHeight = `${h}px`;
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => fitCard()).observe(ui.learn);
  // the step words that carry a number (the first and second law) get it through t.num
  for (const [id, n] of [
    ['plane', 1],
    ['law', 2],
  ]) {
    const w = $(`[data-example="${id}"] .pvc-ex-word`);
    if (w) w.innerHTML = t(`ex_${id}`, { n });
  }
  // the panel beside the 3D (landscape) or under it (portrait)
  const panelEl = root.querySelector('.pvc-panel');
  const markSide = () => {
    if (panelEl) root.classList.toggle('rl-side', panelEl.getBoundingClientRect().left > root.getBoundingClientRect().left + 20);
  };
  markSide();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(markSide).observe(root);
  const mediaRow = /** @type {HTMLElement} */ (boxEl.querySelector('.rl-media'));
  const revBtn = /** @type {HTMLButtonElement} */ (boxEl.querySelector('.rl-rev'));
  const graph = createGraph(/** @type {HTMLElement} */ (boxEl.querySelector('.rl-graph')), { t, N, colors: COLORS });
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'rl-note';
  note.textContent = t('note_slow');
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.5, far: 600, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  const shadow = Boolean(o.shadow) && o.bg !== 'transparent';
  scene.background = o.bg === 'transparent' ? null : backdrop();
  const setting = createSetting({ stage, shadow, num: N });
  const rays = createRays({ stage, host: ui.canvasHost });

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    step: 'intro',
    v: { ...TARGET.intro },
    angle: START_ANGLE,
    medium: MEDIA[o.medium] && CHOOSABLE.includes(o.medium) ? o.medium : 'glass',
    measured: [],
    past: [],
    relMeasured: [],
    dragged: false, // the torch was moved by hand since the last measurement
    view: 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    dragging: false,
    quizKind: '',
    march: 0, // s the wavefronts have marched
    rev: false, // the bending step's other way: the light from inside the glass out into the air
    qRevealed: false, // the test's answer is shown (the picture may then show it too)
    shine: 0,
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the physics of the scene now ────────────────────────────────────────────
  const n2 = () => MEDIA[s.medium].n;
  const look = () => (s.step === 'relative' || s.v.fill > 0 ? 'relative' : MEDIA[s.medium].look);
  const level = () => 0.4 + (TOP - 0.4) * s.v.fill;
  function layers() {
    if (look() === 'relative') {
      const l = level();
      return l > SLAB + 0.02
        ? [
            { top: l, n: N_WATER },
            { top: SLAB, n: N_GLASS },
          ]
        : [{ top: SLAB, n: N_GLASS }];
    }
    return [{ top: TOP, n: n2() }];
  }
  const floor = () => (look() === 'glass' || look() === 'diamond' || look() === 'other' ? 0.03 : 0.41);
  let geo = trace(s.angle, layers(), floor());
  /** The boundary the angles are measured at, and the two media there. */
  function focus() {
    const two = geo.points.length > 3;
    const i = two ? 2 : 1;
    return { i, t1: geo.angles[i - 1], t2: geo.angles[i], n1: geo.ns[i - 1], n2: geo.ns[i] };
  }
  /** The ray now: traced again whenever something reads it, so the panel and get() never lag a frame behind. */
  function retrace() {
    geo = trace(s.angle, layers(), floor());
  }
  function syncScene() {
    retrace();
    setting.show(look(), level());
    setting.place(s.angle);
    setting.lamp(s.v.inK > 0 && !s.rev);
    setting.sheetOpacity(s.v.sheet);
    const end = geo.points[geo.points.length - 1];
    setting.landing(end, s.v.outK >= 0.98 ? 1 : 0);
    const rv = rays.view;
    rv.geo = geo;
    rv.inK = s.v.inK;
    rv.outK = s.v.outK;
    rv.reflK = s.v.refl;
    rv.normal = s.v.normal;
    rv.normal0 = s.v.normal0;
    rv.arcs = s.v.arcs;
    rv.focus = focus().i;
    rv.right = s.v.right;
    rv.march = s.v.march;
    rv.phase = s.march;
    rv.shine = s.shine;
    rv.rightAt = { x: SHEET.x1 - 3.6, y: TOP };
    rv.reverse = s.rev;
    rv.boundary = look() === 'relative' && s.v.fill > 0.9 ? SLAB : null;
  }

  // ── camera: a gentle three-quarter view per step; flights between them ──────
  const cam = { az: 0, el: 0, dist: 1, target: V(0, 0, 0) };
  const dirOf = (az, el) => {
    const a = THREE.MathUtils.degToRad(az);
    const e = THREE.MathUtils.degToRad(el);
    return V(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
  };
  /** The torch's body at angle a (from its window to its tail, with its radius), added to a box. */
  const torchPt = V(0, 0, 0);
  function addTorch(b, a) {
    const sa = Math.sin(rad(a));
    const ca = Math.cos(rad(a));
    for (const r of [APERTURE - 0.4, ARC_R, ARC_R + 3.9]) for (const z of [-2.2, 1.3]) b.expandByPoint(torchPt.set(O.x - r * sa, O.y + r * ca, z));
    b.max.y = Math.max(b.max.y, O.y + (ARC_R + 3.9) * ca + 0.9);
    return b;
  }
  function poseOf(id) {
    const f = FRAMES[id];
    const dir = dirOf(f.az, f.el);
    const fit = f.box.clone();
    for (const a of [s.angle, ...f.torch]) addTorch(fit, a);
    const p = fitPose({ box: fit, dir, camera, width: stage.width, height: stage.height, margin: MARGIN });
    return { az: f.az, el: f.el, dist: p.position.distanceTo(p.target), target: p.target };
  }
  let frameId = 'intro';
  function applyPose(p) {
    cam.az = p.az;
    cam.el = p.el;
    cam.dist = p.dist;
    cam.target.copy(p.target);
    controls.target.copy(p.target);
    camera.position.copy(p.target).addScaledVector(dirOf(p.az, p.el), p.dist);
    controls.update();
  }
  function currentPose() {
    const off = camera.position.clone().sub(controls.target);
    const dist = off.length();
    off.normalize();
    return {
      az: THREE.MathUtils.radToDeg(Math.atan2(off.x, off.z)),
      el: THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(off.y, -1, 1))),
      dist,
      target: controls.target.clone(),
    };
  }
  /** Flies the camera to a frame (the guided camera takes the view back from the student). */
  function flyTo(id, duration = T.fly) {
    frameId = id;
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      rotate.home();
      s.view = 'front';
      syncUI();
      emit('view', { view: s.view });
    }
    const to = poseOf(id);
    if (!duration) {
      tweener.cancel('camera');
      applyPose(to);
      stage.invalidate();
      return Promise.resolve(true);
    }
    const from = currentPose();
    let daz = to.az - from.az;
    if (daz > 180) daz -= 360;
    if (daz < -180) daz += 360;
    const tmp = { az: 0, el: 0, dist: 0, target: V(0, 0, 0) };
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        tmp.az = from.az + daz * k;
        tmp.el = from.el + (to.el - from.el) * k;
        tmp.dist = Math.exp(Math.log(from.dist) + (Math.log(to.dist) - Math.log(from.dist)) * k);
        tmp.target.lerpVectors(from.target, to.target, k);
        applyPose(tmp);
        stage.invalidate();
      },
    }).finished;
  }
  function turnedByHand() {
    if (s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    s.view = '3d';
    syncUI();
    emit('view', { view: s.view });
    emitChange();
  }
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${N(360)}°`,
    label: t('rotate_me'),
    pulse: Boolean(o.coach),
    zoom: [0.5, 2],
    when: () => s.mode !== 'quiz',
    onTurn: turnedByHand,
  });
  function setView(view, { animate = true } = {}) {
    s.view = 'front';
    const p = flyTo(frameId, animate ? T.fly : 0);
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    if (view === '3d') s.view = '3d';
    return p;
  }
  stage.onResize(() => {
    if (!s.userMovedCamera && !tweener.busy) applyPose(poseOf(frameId));
    syncScene();
    refresh();
  });
  stage.onBeforeRender(() => {
    syncScene();
  });
  // the wavefronts march for a while in the first step, then rest
  stage.addTicker((dt) => {
    if (s.step !== 'slow' || s.v.march <= 0 || s.march >= MARCH_S || s.mode === 'quiz') return false;
    s.march = Math.min(MARCH_S, s.march + dt);
    note.classList.toggle('show', s.march < MARCH_S);
    return true;
  });

  // ── the torch: drag it along the arc, or the arrow keys ──────────────────────
  const arcPoint = (a) => () => V(O.x - (ARC_R + 0.6) * Math.sin((a * Math.PI) / 180), O.y + (ARC_R + 0.6) * Math.cos((a * Math.PI) / 180), 1.3);
  const handleAt = V(0, 0, 0);
  const canDrag = () => s.mode === 'explore' && !s.busy && s.step !== 'intro';
  const handle = createDragHandle(stage, {
    point: () =>
      handleAt.set(O.x - (ARC_R + 0.6) * Math.sin((s.angle * Math.PI) / 180), O.y + (ARC_R + 0.6) * Math.cos((s.angle * Math.PI) / 180), 1.3),
    axis: 'turn',
    track: { from: arcPoint(MIN_ANGLE), to: arcPoint(MAX_ANGLE), via: arcPoint((MIN_ANGLE + MAX_ANGLE) / 2) },
    label: o.coach ? t('drag_torch') : '',
    aria: t('aria_torch'),
    pulse: Boolean(o.coach),
    when: canDrag,
  });
  function setAngle(a, { byHand = false } = {}) {
    const next = clampAngle(Math.round(a));
    if (byHand && next !== s.angle) s.dragged = true;
    s.angle = next;
    stage.invalidate();
    refresh();
    emitChange();
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  const tmp = V(0, 0, 0);
  const A0 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  function boxOf(el) {
    if (!el || el.hidden || !el.offsetParent) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const torchBox = () => {
    const tp = setting.rig.torch.root.position;
    toScreen(tp, A0);
    return { left: A0.x - 16, top: A0.y - 16, right: A0.x + 16, bottom: A0.y + 16 };
  };
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      () => rays.boxes(),
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotate.el),
      () => handle.box(),
      torchBox,
    ],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const LEFT = [spot(-18, 0), spot(-18, -18), spot(-18, 18), spot(-26, -34)];
  const RIGHT = [spot(18, 0), spot(18, -18), spot(18, 18), spot(26, 34)];
  const UP = [spot(0, -22), spot(-22, -22), spot(22, -22), spot(0, -40)];
  const DOWN = [spot(0, 22), spot(22, 22), spot(-22, 22), spot(0, 40)];
  const rad = (d) => (d * Math.PI) / 180;
  const at = (k, a, b) => V(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 0);
  const inQuiz = (k) => s.mode === 'quiz' && s.quizKind === k;
  const mName = () => t(`m_${s.medium}`);
  /** The book's names of the angles on the labels where they are first met (the bending step). */
  const fullNames = () => s.step === 'bend' && s.mode === 'explore';
  const LABELS = {
    torch: {
      text: () => t('lbl_torch'),
      // at the torch's tail, away from the action's ring round its window
      point: () => V(O.x - (ARC_R + 3.4) * Math.sin(rad(s.angle)), O.y + (ARC_R + 3.4) * Math.cos(rad(s.angle)), 0.6),
      color: COLORS.ink,
      spots: [spot(0, -40), spot(-30, -34), spot(-40, 0), ...LEFT],
      show: () => s.step === 'intro' && s.mode === 'explore',
    },
    air: {
      text: () => (s.step === 'intro' || s.step === 'slow' ? t('lbl_air_1') : t('lbl_air_n', { n: 1 })),
      point: () => V(-8.6, TOP + 0.3, -4.2),
      color: COLORS.ink,
      spots: [...LEFT, spot(-18, 26), ...UP],
      optional: true,
      show: () => look() !== 'relative' && !inQuiz('plane'),
    },
    medium: {
      text: () => {
        if (inQuiz('ex_b')) return s.qRevealed ? t('lbl_n2_ans', { m: mName(), n: fx(n2()) }) : t('lbl_med_q', { m: mName() });
        if (s.mode !== 'quiz' && (s.step === 'intro' || s.step === 'slow')) return t('lbl_med_2', { m: mName() });
        return t('lbl_med_n', { m: mName(), n: nx(n2()) });
      },
      point: () => V(8.8, 1.2, 4.5),
      color: COLORS.ink,
      spots: [...DOWN, ...RIGHT],
      optional: true, // on the smallest view it gives way to θ₂
      show: () => look() !== 'relative' && !inQuiz('plane') && !(s.step === 'law' && s.mode === 'explore'),
    },
    water: {
      text: () => t('lbl_water_n1', { n: nx(N_WATER) }),
      point: () => V(-9.4, (SLAB + TOP) / 2 + 0.6, 4.6),
      color: COLORS.ink,
      spots: [...LEFT, ...UP],
      show: () => look() === 'relative' && s.v.fill > 0.95,
    },
    glass: {
      text: () => t('lbl_glass_n2', { n: nx(N_GLASS) }),
      point: () => V(9, 1.4, 4.2),
      color: COLORS.ink,
      spots: [...DOWN, ...RIGHT],
      show: () => look() === 'relative' && s.v.fill > 0.95,
    },
    incident: {
      text: () => t('lbl_incident'),
      point: () => at(0.42, geo.points[0], geo.points[1]),
      color: COLORS.ray,
      spots: [...UP, ...LEFT],
      show: () => s.step === 'slow' && s.v.inK > 0.99 && s.mode === 'explore',
    },
    refracted: {
      text: () => t('lbl_refracted'),
      point: () => at(0.62, geo.points[1], geo.points[2]),
      color: COLORS.ray,
      spots: [...RIGHT, ...DOWN],
      show: () => s.step === 'slow' && s.v.outK > 0.99 && s.mode === 'explore',
    },
    reflected: {
      text: () => t('lbl_reflected'),
      point: () => at(0.75, geo.points[1], geo.reflected),
      color: COLORS.ray,
      spots: [...RIGHT, ...UP],
      optional: true,
      show: () => s.step === 'slow' && s.v.refl > 0.99 && s.mode === 'explore',
    },
    normal: {
      text: () => t(s.step === 'bend' ? 'lbl_normal_at' : 'lbl_normal'),
      point: () => {
        const p = geo.points[focus().i];
        return V(p.x, p.y + rays.NORMAL_UP * 0.96, 0);
      },
      color: COLORS.normal,
      spots: [...UP, ...RIGHT],
      show: () => s.v.normal > 0.98 && (s.step === 'bend' || s.step === 'plane') && s.mode === 'explore',
    },
    t1: {
      text: () => t(fullNames() ? 'lbl_t1_full' : 'lbl_t1', { a: focus().i === 2 ? deg1(focus().t1) : N(Math.round(focus().t1)) }),
      point: () => {
        const f = focus();
        const p = geo.points[f.i];
        const h = rad(f.t1 / 2);
        return V(p.x - (rays.ARC + 0.2) * Math.sin(h), p.y + (rays.ARC + 0.2) * Math.cos(h), 0);
      },
      color: COLORS.t1,
      spots: [spot(-20, -20), ...LEFT, ...UP],
      show: () => s.v.arcs > 0.9 && s.step !== 'plane' && !inQuiz('plane') && !inQuiz('speed'),
    },
    t2: {
      text: () => (inQuiz('ex_a') && !s.qRevealed ? t('lbl_t2q') : t(fullNames() ? 'lbl_t2_full' : 'lbl_t2', { a: deg1(focus().t2) })),
      point: () => {
        const f = focus();
        const p = geo.points[f.i];
        const h = rad(f.t2 / 2);
        return V(p.x + (rays.ARC + 0.2) * Math.sin(h), p.y - (rays.ARC + 0.2) * Math.cos(h), 0);
      },
      color: COLORS.t2,
      spots: [spot(20, 20), ...RIGHT, ...DOWN],
      show: () => s.v.arcs > 0.9 && s.step !== 'plane' && !inQuiz('plane') && !inQuiz('speed'),
    },
    plane: {
      text: () => t('lbl_plane'),
      point: () => V(SHEET.x1 - 1.2, SHEET.y1 - 1.5, 0),
      color: COLORS.ink,
      spots: [...RIGHT, ...UP],
      show: () => s.v.sheet > 0.9 && frameId !== 'edge' && !(s.step === 'plane' && s.busy),
    },
    right: {
      text: () => t('lbl_right', { a: 90 }),
      point: () => V(SHEET.x1 - 3.6, TOP + 0.9, 0.9),
      color: COLORS.ink,
      spots: [...RIGHT, ...UP],
      show: () => s.v.right > 0.9 && s.mode === 'explore',
    },
  };
  const texts = new Map();
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      if (want && !anno.has(id)) {
        const text = L.text();
        anno.add(id, { text, point: L.point, kind: 'part', color: L.color, spots: L.spots, optional: L.optional });
        texts.set(id, text);
      } else if (!want && anno.has(id)) anno.remove(id);
      else if (want) {
        const text = L.text();
        if (texts.get(id) !== text) {
          anno.setText(id, text);
          texts.set(id, text);
        }
      }
    }
  }

  // ── the steps ───────────────────────────────────────────────────────────────
  /** Moves some of the values to where they go, together, over `duration` seconds. */
  function tweenTo(to, duration, my, easing = ease.inOutCubic) {
    const from = { ...s.v };
    return tweener
      .animate({
        key: 'step',
        duration,
        ease: easing,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const key of Object.keys(to)) s.v[key] = from[key] + (to[key] - from[key]) * k;
          syncLabels();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  const wait = (sec, my) => tweener.animate({ key: 'wait', duration: sec }).finished.then((ok) => ok && my === s.run);
  function shineFor(my) {
    s.shine = 1;
    return tweener
      .animate({
        key: 'shine',
        duration: 1.1,
        onUpdate: (k) => {
          if (my === s.run) s.shine = 1 - k;
          stage.invalidate();
        },
      })
      .finished.then(() => {
        s.shine = 0;
      });
  }
  /** Turns the torch to angle a over `sec` (a step's own motion; not a drag). */
  function turnTo(a, sec, my) {
    const from = s.angle;
    const to = clampAngle(a);
    if (Math.abs(to - from) < 0.01) return Promise.resolve(my === s.run);
    return tweener
      .animate({
        key: 'turn',
        duration: sec,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== s.run) return;
          s.angle = from + (to - from) * k;
          refresh();
          stage.invalidate();
        },
      })
      .finished.then((ok) => {
        if (my === s.run) s.angle = to;
        return ok && my === s.run;
      });
  }
  function stopAll() {
    s.run++;
    for (const k of ['step', 'wait', 'turn', 'shine']) tweener.cancel(k);
    s.busy = false;
    s.shine = 0;
  }
  /** The plan of one step from the one before it. */
  async function play(step, my) {
    if (step === 'slow') {
      if (!(await tweenTo({ inK: 1 }, T.ray, my, ease.linear))) return false;
      shineFor(my);
      if (!(await tweenTo({ outK: 1, refl: 1 }, T.inside, my, ease.linear))) return false;
      s.march = 0;
      return tweenTo({ march: 1 }, 0.5, my);
    }
    if (step === 'bend') {
      if (!(await tweenTo({ march: 0 }, 0.4, my))) return false;
      if (!(await tweenTo({ normal: 1 }, T.normal, my))) return false;
      return tweenTo({ arcs: 1 }, T.arcs, my);
    }
    if (step === 'plane') {
      if (!(await tweenTo({ sheet: 1, right: 1 }, T.sheet, my))) return false;
      if (!(await wait(0.5, my))) return false;
      await flyTo('edge', T.edge);
      if (my !== s.run) return false;
      if (!(await wait(T.hold, my))) return false;
      await flyTo('plane', T.back);
      return my === s.run;
    }
    if (step === 'relative') {
      if (!(await tweenTo({ normal: 0, arcs: 0 }, 0.4, my))) return false;
      s.v.fill = 0.0001; // the tank and the slab now
      s.relMeasured = [];
      if (!(await turnTo(START_ANGLE, 0.8, my))) return false;
      if (!(await tweenTo({ fill: 1 }, T.fill, my))) return false;
      if (!(await tweenTo({ normal: 1, normal0: 1 }, T.normal, my))) return false;
      if (!(await tweenTo({ arcs: 1 }, T.arcs, my))) return false;
      for (const a of PRESETS) {
        if (!(await turnTo(a, T.turn, my))) return false;
        recordRel();
        if (!(await wait(0.5, my))) return false;
      }
      return true;
    }
    return tweenTo({ ...TARGET[step] }, T.jump, my);
  }
  async function go(step, { animate = true } = {}) {
    if (!(step in TARGET)) return;
    const from = s.step;
    stopAll();
    const my = s.run;
    hintOff();
    const prevIndex = ORDER.indexOf(from);
    const index = ORDER.indexOf(step);
    s.step = step;
    if (step !== 'bend') s.rev = false;
    if (step !== 'law') s.dragged = false;
    if (step === 'relative' && from !== 'relative') s.relMeasured = [];
    if (step !== 'relative' && s.v.fill > 0) s.v.fill = 0;
    if (!animate || index !== prevIndex + 1) {
      // a jump: everything at once (the next step plays only when it is the next one)
      Object.assign(s.v, TARGET[step]);
      if (step === 'slow') s.march = MARCH_S;
      if (step === 'relative') fillRel();
      flyTo(FRAME_OF[step], animate ? T.fly : 0);
      s.busy = false;
      done();
      return;
    }
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    const fly = flyTo(FRAME_OF[step], T.fly);
    if (step !== 'plane') await fly;
    if (my !== s.run) return;
    const ok = await play(step, my);
    if (!ok || my !== s.run) return;
    s.busy = false;
    audio.success?.();
    done();
  }
  /** The last step's dots, all at once (a jump into it). */
  function fillRel() {
    s.relMeasured = PRESETS.map((a) => {
      const g = trace(
        a,
        [
          { top: TOP, n: N_WATER },
          { top: SLAB, n: N_GLASS },
        ],
        0.41,
      );
      return measure(g.angles[1], N_WATER, N_GLASS);
    });
  }
  function recordRel() {
    const f = focus();
    s.relMeasured.push(measure(f.t1, f.n1, f.n2));
    audio.pop?.();
    refresh();
  }
  function done() {
    syncScene();
    syncLabels();
    refresh();
    emitChange();
    stage.invalidate();
  }
  // Measure: the angle the student set by hand, else the next of the three angles.
  async function measureNow() {
    const my = ++s.run;
    const here = () => s.measured.some((m) => Math.abs(m.t1 - s.angle) < 0.5);
    if (!(s.dragged && !here())) {
      const p = nextPreset(s.measured);
      if (p != null) {
        s.busy = true;
        refresh();
        if (!(await turnTo(p, T.turn, my))) return;
        s.busy = false;
      }
    }
    if (my !== s.run) return;
    s.dragged = false;
    if (!here()) {
      s.measured.push(measure(s.angle, 1, n2()));
      if (s.measured.length > 5) s.measured.shift();
      audio.pop?.();
    } else audio.error?.();
    refresh();
    emitChange();
  }
  function chooseMedium(id) {
    if (!CHOOSABLE.includes(id) || id === s.medium) return;
    if (s.measured.length) {
      s.past = s.past.filter((p) => p.id !== s.medium);
      s.past.push({ id: s.medium, slope: round(n2(), 2) });
      if (s.past.length > 2) s.past.shift();
    }
    s.measured = [];
    s.medium = id;
    s.dragged = false;
    syncScene();
    refresh();
    emitChange();
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const replayBtn = /** @type {HTMLButtonElement} */ ($('[data-act="replay"]'));
  const steady = { lead: '', act: '' };
  const lawDone = () => s.measured.length >= 3;
  function actionOf() {
    if (s.busy) return ['act_wait', '', ICONS.hand];
    const n = ORDER.indexOf(s.step) + 1;
    if (s.step === 'intro') return ['act_on', 1, ICONS.hand];
    if (s.step === 'slow') return ['act_normal', n, ICONS.hand];
    if (s.step === 'bend') return ['act_plane', n, ICONS.hand];
    if (s.step === 'plane') return ['act_measure', n, ICONS.hand];
    if (s.step === 'law') return lawDone() ? ['act_water', n, ICONS.hand] : ['act_measure', n - 1, ICONS.hand];
    return ['act_quiz', '', ICONS.chevR];
  }
  function leadHtml() {
    if (s.step === 'law') return t(lawDone() ? 'lead_law_done' : 'lead_law');
    return t(`lead_${s.step}`);
  }
  function outcomeHtml() {
    const f = focus();
    if (s.step === 'intro') return '';
    if (s.step === 'slow') return t('out_slow', { m: t(`in_${s.medium}`), v: sci(speedMantissa(n2())) });
    if (s.step === 'bend' || s.step === 'plane') {
      if (s.step === 'plane' && s.v.sheet > 0.9 && !s.busy) return t('out_plane');
      if (f.t1 < 0.5) return t('out_bend0', { t1: N(0) });
      return t(s.rev ? 'out_rev' : 'out_bend', { t1: N(Math.round(f.t1)), t2: deg1(f.t2) });
    }
    if (s.step === 'law') {
      if (lawDone()) return t('out_law_done', { k: s.measured.length, r: fx(n2()) });
      const m = measure(s.angle, 1, n2());
      if (s.angle < 0.5) return t('out_bend0', { t1: N(0) });
      return t('out_law', { t1: N(Math.round(m.t1)), s1: N(m.s1), s2: N(m.s2), r: fx(m.ratio) });
    }
    if (f.t1 < 0.5) return t('out_bend0', { t1: N(0) });
    return t('out_rel', { r: fx(N_GLASS / N_WATER) });
  }
  function ruleHtml() {
    if (s.step === 'intro') return '';
    if (s.step === 'slow') return t('rule_slow', { m: t(`in_${s.medium}`), n: nx(n2()) });
    if (s.step === 'bend') return t(s.rev ? 'rule_rev' : 'rule_bend');
    if (s.step === 'plane') return s.v.sheet > 0.9 ? t('rule_plane', { right: 90 }) : t('rule_bend');
    if (s.step === 'law') return lawDone() ? t('rule_law_done', { one: 1 }) : t('rule_law');
    return t('rule_rel', { n2: nx(N_GLASS), n1: nx(N_WATER), r: fx(N_GLASS / N_WATER), inv: fx(N_WATER / N_GLASS), one: 1 });
  }
  function drawGraph() {
    if (s.step === 'intro' || s.step === 'slow') {
      graph.draw({
        kind: 'speed',
        chosen: s.medium,
        rows: TABLE.map((r) => ({ id: r.id, n: r.n, v: speedMantissa(r.n) })),
        aria: t('aria_speed'),
      });
      return;
    }
    if (s.step === 'bend' || s.step === 'plane') {
      graph.draw({ kind: 'theta', curve: graph.curveFor(1, n2()), now: [round(s.angle, 2), round(focus().t2, 2)], n: n2(), aria: t('aria_theta') });
      return;
    }
    if (s.step === 'law') {
      const m = measure(s.angle, 1, n2());
      graph.draw({
        kind: 'sine',
        dots: s.measured,
        live: s.busy ? null : { s1: m.s1, s2: m.s2 },
        slope: lawDone() ? round(n2(), 2) : null,
        past: s.past.filter((p) => p.id !== s.medium),
        n: n2(),
        aria: t('aria_sine'),
      });
      return;
    }
    const f = focus();
    const live = s.v.fill > 0.99 ? measure(f.t1, f.n1, f.n2) : null;
    graph.draw({
      kind: 'sine',
      dots: s.relMeasured,
      chips: false,
      live: s.busy || !live ? null : { s1: live.s1, s2: live.s2 },
      slope: s.relMeasured.length >= 3 ? round(N_GLASS / N_WATER, 2) : null,
      past: [],
      n: N_GLASS / N_WATER,
      aria: t('aria_sine'),
    });
  }
  function refresh() {
    retrace();
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const html = calm ? '' : leadHtml();
    if (steady.lead !== html) {
      steady.lead = html;
      lead.innerHTML = html;
    }
    if (ui.learn.classList.contains('rl-calm') !== calm) {
      ui.learn.classList.toggle('rl-calm', calm);
      fitCard();
    }
    sheet.outcome(calm || (s.busy && s.step !== 'law') ? '' : outcomeHtml());
    sheet.rule(calm || (s.busy && s.step !== 'law') ? '' : ruleHtml());
    sheet.choose(calm ? null : s.step);
    sheet.next(ORDER[ORDER.indexOf(s.step) + 1] ?? null);
    const [word, step, icon] = actionOf();
    const enabled = !s.busy;
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      if (enabled && s.mode === 'explore' && s.step === 'intro') action.show('scene');
      else action.hide('scene');
    }
    homeBtn.hidden = s.step === 'intro';
    homeBtn.disabled = s.busy;
    replayBtn.hidden = !['slow', 'bend', 'plane', 'relative'].includes(s.step);
    replayBtn.disabled = s.busy;
    const mediaOn = s.step !== 'relative';
    mediaRow.classList.toggle('off', !mediaOn);
    for (const b of mediaRow.querySelectorAll('button')) {
      const on = /** @type {HTMLElement} */ (b).dataset.medium === s.medium;
      b.setAttribute('aria-checked', String(on));
      b.classList.toggle('on', on);
      /** @type {HTMLButtonElement} */ (b).disabled = !mediaOn || s.busy;
      /** @type {HTMLButtonElement} */ (b).tabIndex = on ? 0 : -1;
    }
    note.classList.toggle('show', s.step === 'slow' && s.march < MARCH_S && s.v.march > 0 && s.mode === 'explore');
    revBtn.hidden = s.step !== 'bend';
    revBtn.disabled = s.busy;
    revBtn.setAttribute('aria-pressed', String(s.rev));
    drawGraph();
    syncLabels();
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the torch, a tap on the torch ────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    if (s.step === 'plane') return go('law');
    if (s.step === 'law') return lawDone() ? go('relative') : measureNow();
    if (s.step === 'relative') return quiz.start();
    return go(ORDER[ORDER.indexOf(s.step) + 1]);
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_on',
    icon: ICONS.hand,
    target: () => setting.rig.torch.root.position,
    radius: 26,
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), () => boxOf(rotate.el)],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // a finger on the torch (or its handle) turns it along the arc; a tap on it in the first screen switches it on
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pa = V(0, 0, 0);
  const plane = new THREE.Plane(V(0, 0, 1), 0);
  let drag = null;
  const canvasXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  };
  function aim(e) {
    const p = canvasXY(e);
    ndc.set((p.x / p.w) * 2 - 1, 1 - (p.y / p.h) * 2);
    ray.setFromCamera(ndc, camera);
  }
  /** The angle under a finger: the point in the plane of the rays, seen from O. */
  function angleAt(e) {
    aim(e);
    if (!ray.ray.intersectPlane(plane, pa)) return null;
    const a = (Math.atan2(O.x - pa.x, pa.y - O.y) * 180) / Math.PI;
    return clampAngle(a);
  }
  function onTorch(e) {
    const p = canvasXY(e);
    if (handle.hit(p.x, p.y)) return true;
    aim(e);
    return ray.intersectObject(setting.hit, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!onTorch(e)) return;
      e.stopPropagation();
      e.preventDefault();
      if (s.step === 'intro' && s.mode === 'explore') {
        doAction();
        return;
      }
      if (s.mode === 'quiz') return lockedNudge();
      if (!canDrag()) return showHint(t('hint_wait'), { duration: 1600 });
      drag = { id: e.pointerId };
      s.dragging = true;
      controls.enabled = false; // a drag on the torch is not a turn of the view
      handle.markUsed();
      capturePointer(ui.canvasHost, e.pointerId);
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      const a = angleAt(e);
      if (a != null) setAngle(a, { byHand: true });
      return;
    }
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const over = onTorch(e);
    ui.canvasHost.style.cursor = over ? (s.locked ? 'not-allowed' : 'grab') : '';
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    releasePointer(ui.canvasHost, drag.id);
    drag = null;
    controls.enabled = true;
    s.dragging = false;
    refresh();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── how to use, in the panel ────────────────────────────────────────────────
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'drag', axis: 'turn', text: t('howto_torch'), handle, when: () => s.step !== 'intro' },
    ],
    { stage },
  );

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = window.setTimeout(hintOff, duration);
  }
  function hintOff() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 2400 });
    audio.error();
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    retrace();
    const f = focus();
    return {
      step: s.step,
      angle: round(s.angle, 2),
      medium: s.medium,
      n1: round(f.n1, 4),
      n2: round(f.n2, 4),
      theta1: round(f.t1, 2),
      theta2: f.t2 == null ? null : round(f.t2, 2),
      ratio: f.t1 > 0.5 ? round(Math.sin(rad(f.t1)) / Math.sin(rad(f.t2)), 4) : null,
      speed: speedMantissa(n2()),
      reflect: round(geo.reflect, 4),
      inPlane: geo.points.every((p) => Math.abs(p.z) < 1e-9),
      measured: s.measured.map((m) => ({ ...m })),
      relative: s.relMeasured.map((m) => ({ ...m })),
      level: round(level(), 3),
      look: look(),
      reverse: s.rev,
      busy: s.busy,
      view: s.view,
      mode: s.mode,
      locked: s.locked,
      question: s.mode === 'quiz' && question ? { ...question } : null,
      frame: frameId,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.medium, Math.round(snap.angle), snap.measured.length]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the test ────────────────────────────────────────────────────────────────
  let question = null;
  let picked = -1;
  let learnSaved = null;
  const KINDS = ['speed', 'plane', 'ex_a', 'ex_b', 'rel'];
  /** Each question's scene: medium, angle, step, camera. */
  const SCENES = {
    speed: { medium: 'water', angle: 45, step: 'slow', frame: 'slow' },
    plane: { medium: 'glass', angle: 55, step: 'bend', frame: 'plane' },
    ex_a: { medium: 'n16', angle: 45, step: 'bend', frame: 'bend' },
    ex_b: { medium: 'nq', angle: 60, step: 'bend', frame: 'bend' },
    rel: { medium: 'glass', angle: 50, step: 'relative', frame: 'relative' },
  };
  function quizScene(kind) {
    const q = SCENES[kind];
    stopAll();
    s.medium = q.medium;
    s.angle = q.angle;
    s.step = q.step;
    s.rev = false;
    s.qRevealed = false;
    Object.assign(s.v, TARGET[q.step]);
    s.march = MARCH_S;
    s.v.march = 0;
    if (q.step === 'relative') fillRel();
    flyTo(q.frame, 0);
    syncScene();
    syncLabels();
    stage.invalidate();
  }
  /** Four choices: the right one first in `items`, shuffled; each its own note when picked wrongly. */
  function choicesOf(items, kind) {
    const list = shuffle(items);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="rl-opt">${list[j].label}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const deg = (x) => `${N(x)}°`;
  /** A question: its scene first, then the words and the four choices. */
  async function ask(i, alive) {
    picked = -1;
    const kind = KINDS[i % KINDS.length];
    s.quizKind = kind;
    quizScene(kind);
    await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
    if (!alive()) return null;
    if (kind === 'speed') {
      const n = N_WATER;
      const items = [
        { key: 'right', v: speedMantissa(n) },
        { key: 'mult', v: round(3 * n, 2) },
        { key: 'same', v: 3 },
        { key: 'n', v: n },
      ].map((x) => ({ ...x, label: sci(x.v) }));
      return { text: t('q_speed'), ...choicesOf(items, kind) };
    }
    if (kind === 'plane') {
      const items = ['right', 'surface', 'normal', 'cross'].map((k) => ({ key: k, label: t(`c_pl_${k}`) }));
      return { text: t('q_plane'), ...choicesOf(items, kind) };
    }
    if (kind === 'ex_a') {
      const n = MEDIA.n16.n;
      const items = [
        { key: 'right', v: Math.round(refractAngle(45, 1, n)) },
        { key: 'div', v: Math.round(45 / n) },
        { key: 'same', v: 45 },
        { key: 'away', v: 55 },
      ].map((x) => ({ ...x, label: deg(x.v) }));
      return { text: t('q_ex_a', { n: nx(n), a: 45 }), ...choicesOf(items, kind) };
    }
    if (kind === 'ex_b') {
      const items = [
        { key: 'right', v: round(Math.sin(rad(60)) / Math.sin(rad(45)), 2) },
        { key: 'deg', v: round(60 / 45, 2) },
        { key: 'flip', v: round(Math.sin(rad(45)) / Math.sin(rad(60)), 2) },
        { key: 'one', v: round(1 / Math.sin(rad(45)), 2) },
      ].map((x) => ({ ...x, label: fx(x.v) }));
      return { text: t('q_ex_b'), ...choicesOf(items, kind) };
    }
    const items = [
      { key: 'right', v: round(N_GLASS / N_WATER, 2) },
      { key: 'flip', v: round(N_WATER / N_GLASS, 2) },
      { key: 'prod', v: round(N_GLASS * N_WATER, 2) },
      { key: 'own', v: N_GLASS },
    ].map((x) => ({ ...x, label: fx(x.v) }));
    return { text: t('q_rel'), ...choicesOf(items, kind) };
  }
  /** The worked answer, leading with the answer, and a note on the mistake picked. */
  function why(q, correct) {
    const k = question?.kind;
    // the picture shows the answer now: θ₂ of উদাহরণ (a), n₂ of (b), the plane of the first law
    s.qRevealed = true;
    if (k === 'plane') s.v.sheet = 0.75;
    syncScene();
    syncLabels();
    stage.invalidate();
    const wrong = correct ? null : q.list?.[picked]?.key;
    const note = (map) => (wrong && map[wrong] ? ` ${map[wrong]}` : '');
    if (k === 'speed') {
      const n = nx(N_WATER);
      const c = `${N(3)}&nbsp;×&nbsp;${N(10)}<sup>${N(8)}</sup>&nbsp;m/s`;
      return (
        t('why_speed', { v: sci(speedMantissa(N_WATER)), c, n }) +
        note({ mult: t('mis_speed_mult'), same: t('mis_speed_same'), n: t('mis_speed_n', { n }) })
      );
    }
    if (k === 'plane')
      return t('why_plane') + note({ surface: t('mis_pl_surface'), normal: t('mis_pl_normal', { zero: 0 }), cross: t('mis_pl_cross') });
    if (k === 'ex_a') {
      const n = MEDIA.n16.n;
      const vars = { r: Math.round(refractAngle(45, 1, n)), one: 1, n: nx(n), s: fx(Math.sin(rad(45))), s2: fx(Math.sin(rad(45)) / n) };
      return t('why_ex_a', vars) + note({ div: t('mis_ex_a_div'), same: t('mis_ex_a_same'), away: t('mis_ex_a_away') });
    }
    if (k === 'ex_b') {
      const vars = { r: fx(Math.sin(rad(60)) / Math.sin(rad(45))), one: 1, a: 60, b: 45, sa: fx(Math.sin(rad(60)), 3), sb: fx(Math.sin(rad(45)), 3) };
      return t('why_ex_b', vars) + note({ deg: t('mis_ex_b_deg'), flip: t('mis_ex_b_flip', vars), one: t('mis_ex_b_one', vars) });
    }
    return (
      t('why_rel', { r: fx(N_GLASS / N_WATER), n2: nx(N_GLASS), n1: nx(N_WATER) }) +
      note({ flip: t('mis_rel_flip'), prod: t('mis_rel_prod'), own: t('mis_rel_own', { n: nx(N_GLASS) }) })
    );
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        learnSaved = { step: s.step, medium: s.medium, angle: s.angle, measured: s.measured, past: s.past };
        s.mode = 'quiz';
        s.locked = true;
        if (drag) endDrag();
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizKind = '';
        question = null;
        syncUI();
        const back = learnSaved || { step: 'intro', medium: 'glass', angle: START_ANGLE, measured: [], past: [] };
        s.medium = CHOOSABLE.includes(back.medium) ? back.medium : 'glass';
        s.angle = back.angle;
        s.measured = back.measured;
        s.past = back.past;
        go(back.step, { animate: false });
      },
      async prepare(i, alive) {
        const q = await ask(i, alive);
        question = q ? { kind: q.meta.kind, right: q.expected } : null;
        return q;
      },
      reveal: why,
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = !s.userMovedCamera;
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  function goHome() {
    s.measured = [];
    s.past = [];
    s.angle = START_ANGLE;
    s.dragged = false;
    handle.rearm?.();
    return go('intro', { animate: false });
  }
  function replay() {
    const i = ORDER.indexOf(s.step);
    if (i < 1 || s.busy) return;
    const step = s.step;
    const before = ORDER[i - 1];
    stopAll();
    s.step = before;
    Object.assign(s.v, TARGET[before]);
    if (step === 'relative') s.relMeasured = [];
    syncScene();
    go(step);
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) {
      s.userMovedCamera = false;
      flyTo(frameId, T.fly);
      s.view = 'front';
      syncUI();
      emit('view', { view: s.view });
      emitChange();
    }
    if (b.dataset.example && s.mode === 'explore') {
      if (s.busy && b.dataset.example === s.step) return;
      go(b.dataset.example);
    }
    if (b.dataset.medium && s.mode === 'explore' && !s.busy) chooseMedium(b.dataset.medium);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'home') goHome();
    else if (b.dataset.act === 'replay') replay();
    else if (b.dataset.act === 'rev' && s.step === 'bend' && !s.busy && s.mode === 'explore') {
      s.rev = !s.rev;
      refresh();
      emitChange();
    } else if (b.dataset.act === 'q-next') quiz.next();
    else if (b.dataset.act === 'q-again') quiz.start();
    else if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  // the medium row: one Tab stop, arrows move along it
  mediaRow.addEventListener('keydown', (e) => {
    const list = /** @type {HTMLButtonElement[]} */ ([...mediaRow.querySelectorAll('button')]);
    const i = list.indexOf(/** @type {HTMLButtonElement} */ (e.target));
    if (i < 0) return;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    e.stopPropagation();
    const j = (i + step + list.length) % list.length;
    list[j].focus();
    list[j].click();
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const arrow = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(k);
    const sceneKey = ['r', 'R', 'Home'].includes(k) || arrow || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (arrow && !onButton) {
      if (!canDrag()) return;
      const d = (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1) * (e.shiftKey ? 5 : 1);
      handle.markUsed();
      setAngle(s.angle + d, { byHand: true });
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') {
      s.userMovedCamera = false;
      flyTo(frameId);
      syncUI();
    } else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  applyPose(poseOf('intro'));
  syncScene();
  refresh();
  stage.warmUp?.({ show: setting.later });
  const ready = (async () => {
    if (o.step && o.step !== 'intro' && o.step in TARGET) await go(o.step, { animate: false });
    if (o.view === '3d') setView('3d', { animate: false });
    if (o.mode === 'quiz') quiz.start();
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
     * Change any of: medium ('water' | 'glass' | 'diamond'), angle (θ₁ in air, 0–80°), step ('intro' | 'slow' | 'bend' |
     * 'plane' | 'law' | 'relative'), measure (a list of angles to record in the law step), view ('front' | '3d').
     * animate: false lands at once.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (s.mode === 'quiz') quiz.stop();
      if (p.medium && CHOOSABLE.includes(p.medium)) chooseMedium(p.medium);
      if (p.step) await go(p.step, { animate });
      if (p.angle != null) {
        if (animate && s.step !== 'intro') await turnTo(p.angle, T.turn, s.run);
        else s.angle = clampAngle(p.angle);
      }
      if (Array.isArray(p.measure)) {
        for (const a of p.measure) {
          s.angle = clampAngle(a);
          s.dragged = true;
          await measureNow();
        }
      }
      if (p.view) await setView(p.view, { animate });
      syncScene();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.medium = 'glass';
      await goHome();
      flyTo('intro', 0);
      s.view = 'front';
      syncUI();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** The view with its drawing on it, cover-fitted to the size asked for (background: null keeps it transparent). */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      stage.render();
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const ctx = out.getContext('2d');
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }
      const gl = stage.canvas;
      const k = Math.max(width / gl.width, height / gl.height);
      const x = (width - gl.width * k) / 2;
      const y = (height - gl.height * k) / 2;
      ctx.drawImage(gl, x, y, gl.width * k, gl.height * k);
      ctx.drawImage(rays.canvas, x, y, gl.width * k, gl.height * k);
      return out.toDataURL('image/png');
    },
    exportRoot: () => setting.apparatus,
  };
}
