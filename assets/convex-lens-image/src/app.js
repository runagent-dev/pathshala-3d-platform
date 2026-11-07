// Images in a convex lens (book pp 259–264, topic 9.4.2): the student view. A glass biconvex lens stands in its ring on the chapter's
// optical bench; the book's pencil XY on its left, at twice the focal length, has an upside-down picture hanging in the air on the far
// side. One new thing a tap: parallel light gathers at the focus F′ (চিত্র ৯.২১); light from a point at F leaves parallel (চিত্র ৯.২২);
// the book's three rays from the pencil's tip X, one at a time, all meet at X′; a paper screen slid to X′ catches the picture sharp, so
// the image is real. Then the book's cases in its order, the pencil carried along the rail: inside F (the rays spread, their dashed
// extensions meet behind: virtual, upright, bigger, seen by an eye through the lens), between F and 2F, at 2F, beyond 2F. Then the
// book's উদাহরণ (object and image change places), a live graph of v against u, and a summary table. Then a short test.
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
import { createSetting, FRAMES, RAIL, SEE_BEHIND, SEE_V, TRACKS } from './bench.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  CARD,
  CASES,
  clamp,
  F0,
  formulaError,
  imageOf,
  LENS,
  missOf,
  NATURE,
  onScreen,
  PENCIL,
  PROPS,
  parallelBundle,
  pointBundle,
  round,
  SCREEN,
  shuffle,
  threeRays,
  U,
  zoneOf,
} from './reading.js';

export const DEFAULTS = {
  stage: 'start', // one of STAGES
  u: U.start, // where the pencil stands, cm from the lens
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring and the words on the handles
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

/** The story, in order: one new thing a tap. */
export const STAGES = ['start', 'parallel', 'point', 'ray1', 'ray2', 'ray3', 'screen', 'cases', 'swap', 'graph', 'table'];

const REST = {
  axis: 0,
  showO: 0,
  showF: 0,
  fBar: 0,
  showF2: 0,
  source: 0,
  bundleP: 0,
  bundleS: 0,
  show2F: 0,
  r1in: 0,
  r1out: 0,
  r1ext: 0,
  r2in: 0,
  r2out: 0,
  r2ext: 0,
  r3in: 0,
  r3out: 0,
  r3ext: 0,
  star: 0,
  beam: 0,
  image: 1,
  screen: 0,
  eye: 0,
};
const MARKS = { axis: 1, showO: 1, showF: 1, showF2: 1 };
const R1 = { r1in: 1, r1out: 1, r1ext: 1 };
const R2 = { r2in: 1, r2out: 1, r2ext: 1 };
const R3 = { r3in: 1, r3out: 1, r3ext: 1 };
const ALL = { ...REST, ...MARKS, show2F: 1, ...R1, ...R2, beam: 1, screen: 1, eye: 1 };
/** What each stage shows: first only the pencil, the lens and the image, then the rest of the picture, a piece at a time. */
const POSE = {
  start: REST,
  parallel: { ...REST, axis: 1, showO: 1, showF: 1, fBar: 1, bundleP: 1, image: 0 },
  point: { ...REST, ...MARKS, source: 1, bundleS: 1, image: 0 },
  ray1: { ...REST, ...MARKS, ...R1 },
  ray2: { ...REST, ...MARKS, ...R1, ...R2, star: 1 },
  ray3: { ...REST, ...MARKS, ...R1, ...R2, ...R3, star: 1 },
  screen: { ...REST, ...MARKS, ...R1, ...R2, beam: 1, image: 0, screen: 1 },
  cases: ALL,
  swap: ALL,
  graph: ALL,
  table: ALL,
};
const FRAME_OF = {
  start: 'story',
  parallel: 'lens',
  point: 'lens',
  ray1: 'story',
  ray2: 'story',
  ray3: 'story',
  screen: 'screen',
  cases: 'cases',
  swap: 'cases',
  graph: 'cases',
  table: 'cases',
};
/** The ray each step adds: the others step back. */
const NOW = { ray1: 0, ray2: 1, ray3: 2 };
/** The order things come in. */
const UPS = [
  'axis',
  'showO',
  'showF',
  'fBar',
  'showF2',
  'source',
  'bundleP',
  'bundleS',
  'show2F',
  'r1in',
  'r1out',
  'r1ext',
  'r2in',
  'r2out',
  'r2ext',
  'r3in',
  'r3out',
  'r3ext',
  'star',
  'beam',
  'image',
  'screen',
  'eye',
];
/** How long each takes to come, s: slow enough to follow (rays about 1 s a leg). */
const TIME = {
  axis: 0.7,
  showO: 0.5,
  showF: 0.6,
  fBar: 0.6,
  showF2: 0.6,
  source: 0.7,
  bundleP: 2.4,
  bundleS: 2.4,
  show2F: 0.6,
  r1in: 1.2,
  r1out: 1.2,
  r1ext: 1.2,
  r2in: 1.2,
  r2out: 1.2,
  r2ext: 1.2,
  r3in: 1.2,
  r3out: 1.2,
  r3ext: 1.2,
  star: 0.6,
  beam: 1,
  image: 1.6,
  screen: 1.6,
  eye: 0.6,
};
/** The time for the pencil to come to a new place, s. */
const PENCIL_TIME = 2.5;
/** After a step the picture holds still this long, s: a lab must not outrun the student. */
const HOLD = 1;
/** How fast the camera closes on its frame: a flight takes about 1.5–2 s. */
const CAMERA_RATE = 2.4;
/** From here on the student moves the pencil. */
const FREE = new Set(['cases', 'swap', 'graph', 'table']);
/** The cases in the order the action takes them (the book's order). */
const NEXT_CASE = ['c0', 'c1', 'c2', 'c3'];
/** The steps where rays are being drawn one at a time. */
const RAY_STEPS = new Set(['ray1', 'ray2', 'ray3']);
const MARGINS = { top: 12, bottom: 10, side: 8 };
const INK = { dark: '#2b3a4a', ray: '#8a4f00', focus: '#5a37d0' };
const AX = RAIL.axis;
const SQ_HIDE = {
  r1in: 0,
  r1out: 0,
  r1ext: 0,
  r2in: 0,
  r2out: 0,
  r2ext: 0,
  r3in: 0,
  r3out: 0,
  r3ext: 0,
  beam: 0,
  image: 0,
  star: 0,
  screen: 0,
  eye: 0,
};
const BUNDLES = { parallel: parallelBundle(), point: pointBundle() };

const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'lab');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: the sheet of one action, one result, one rule ────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: {
        label: 'ex_label',
        items: [...CASES.map((_u, i) => ({ id: `c${i}`, label: `c${i}` })), { id: 'table', label: 'ex_table' }],
      },
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
  CASES.forEach((u, i) => {
    const word = ui.$(`[data-example="c${i}"] .pvc-ex-word`);
    if (word) word.textContent = t.num(u);
  });
  // the line before the action: what the next tap will show (on the first screen, a few calm words that set the scene)
  const lead = document.createElement('p');
  lead.className = 'lab-lead';
  ui.$('.pvc-act-row').before(lead);
  // the graph of v against u, live with the bench
  const graphBox = document.createElement('div');
  graphBox.className = 'lab-graph';
  ui.learn.appendChild(graphBox);
  const graph = createGraph(graphBox, { t });
  const caption = document.createElement('p');
  caption.className = 'lab-cap';
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'lab-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 22, near: 10, far: 1600, environmentIntensity: 0.8 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  const setting = createSetting({ stage, shadow: Boolean(o.shadow), t, transparent: o.bg === 'transparent' });
  const rays = createRays({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const pickU = (u) => {
    const x = Number.isFinite(Number(u)) ? Number(u) : U.start;
    return clamp(Math.round(x / U.step) * U.step, U.min, U.max);
  };
  const pickS = (x) => clamp(Math.round(x * 2) / 2, SCREEN.min, SCREEN.max);
  const start = STAGES.includes(o.stage) ? o.stage : 'start';
  const s = {
    stage: start,
    u: pickU(o.u), // where the student put the pencil
    sx: SCREEN.enter, // where the student put the screen
    found: false, // the screen has been sharp
    held: false, // the student has put the paper somewhere else: it stays until the pencil moves
    movedPencil: false,
    movedScreen: false,
    next: 0, // the case the action goes to next, in NEXT_CASE
    swap: null, // { a, b }: the উদাহরণ, the pencil from a to b
    busy: false,
    hold: false,
    cameFrom: null,
    dragging: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    frame: FRAME_OF[start],
  };
  const V = { ...POSE.start, u: s.u, s: SCREEN.enter, paper: 1 };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  /** The paper follows the image once the student has found it; it waits where it is when there is nothing to catch. */
  const tracks = () => FREE.has(s.stage) && !s.held;
  /** With no real image the paper goes (outside the screen step): there is nothing to catch, and the picture needs the room. */
  const wantsPaper = () => !FREE.has(s.stage) || imageOf(V.u).kind === 'real';
  function screenGoal() {
    const img = imageOf(V.u);
    if (img.kind !== 'real') return SCREEN.rest;
    return clamp(img.v, SCREEN.min, SCREEN.max);
  }

  /** A real image farther than this is not drawn (its rays end at the rail's end). */
  const X_SEE = 78;

  // ── what the 3D shows, from V ──────────────────────────────────────────────────────────────────────────
  let tracedU = -1;
  function apply() {
    const rv = rays.view;
    const img = imageOf(V.u);
    if (V.u !== tracedU) {
      tracedU = V.u;
      rv.rays = threeRays(V.u);
    }
    for (const [i, n] of ['r1', 'r2', 'r3'].entries()) {
      rv.keys[i].in = V[`${n}in`];
      rv.keys[i].out = V[`${n}out`];
      rv.keys[i].ext = V[`${n}ext`];
    }
    rv.now = NOW[s.stage] ?? -1;
    rv.axis = V.axis;
    rv.showF = V.showF;
    rv.showF2 = V.showF2;
    rv.show2F = V.show2F;
    rv.showO = V.showO;
    rv.fBar = V.fBar;
    rv.bundle = V.bundleP > 0 ? { rays: BUNDLES.parallel, k: V.bundleP } : V.bundleS > 0 ? { rays: BUNDLES.point, k: V.bundleS } : null;
    rv.u = V.u;
    rv.kind = img.kind;
    rv.iv = img.v;
    // the wash of light belongs to an image the light really makes: it fades as the pencil comes to F
    rv.beam = V.beam * clamp(Math.abs(V.u - F0) / 2, 0, 1);
    rv.eye = img.kind === 'virtual' ? V.eye : 0;
    const paperOn = V.screen * V.paper;
    rv.screenAt = paperOn >= 1 ? V.s : null;
    const near = img.kind === 'real' ? img.v <= X_SEE : img.kind === 'virtual' && -img.v <= 64;
    rv.imageAt = near ? { x: img.v, y: img.tip } : null;
    rv.imageK = near && V.r2out >= 1 && V.r1out >= 1 && (V.image >= 1 || s.found || V.star > 0) ? 1 : 0;
    note.hidden = !(V.r1in > 0 || V.bundleP > 0 || V.bundleS > 0);
    setting.placePencil(V.u);
    setting.placeImage(img.kind, img.v, img.m, near ? V.image : 0);
    setting.placeScreen(paperOn, V.s, onScreen(V.s, V.u));
    setting.placeStar(img.v, img.tip, img.kind === 'real' && near ? V.star * 0.75 : 0, 6);
    setting.placeSource(-F0, V.source);
  }
  const wait = (seconds) => tweener.animate({ key: 'wait', duration: seconds }).finished;
  const RUNS = ['step', 'wait', 'pencil', 'glide'];
  function stopRun() {
    ++token;
    for (const k of RUNS) tweener.cancel(k);
    s.busy = false;
    s.hold = false;
  }
  /** A step has ended: its result stands a moment, labels and words in place, and only then does the action wake up. */
  function holdResult() {
    const my = token;
    s.hold = true;
    wait(HOLD).then(() => {
      if (my !== token) return;
      s.hold = false;
      draw();
    });
  }
  /** Everything in its final place at once. */
  function settle(name) {
    Object.assign(V, POSE[name]);
    V.u = s.u;
    s.frame = FRAME_OF[name];
    V.s = FREE.has(name) ? screenGoal() : s.sx;
    V.paper = wantsPaper() ? 1 : 0;
    apply();
  }

  /** Numbers of V move to the goal together; its promise says whether the run is still alive. */
  function move(alive, keys, goal, duration, e = ease.inOutSine) {
    const list = keys.filter((k) => Math.abs(V[k] - goal[k]) > 1e-6);
    if (!list.length) return Promise.resolve(true);
    const from = list.map((k) => V[k]);
    return tweener
      .animate({
        key: 'step',
        duration,
        ease: e,
        onUpdate: (k) => {
          if (!alive()) return;
          list.forEach((n, i) => {
            V[n] = from[i] + (goal[n] - from[i]) * k;
          });
          apply();
          stage.invalidate();
        },
      })
      .finished.then(() => {
        if (!alive()) return false;
        for (const n of list) V[n] = goal[n];
        apply();
        return true;
      });
  }

  /** The book's উদাহরণ: where the pencil goes (b) from where it stands (a), and so where its image goes. */
  function swapPlan() {
    const img = imageOf(s.u);
    if (img.kind === 'real' && img.v >= U.min && img.v <= U.max) return { a: s.u, b: round(img.v, 1) };
    return { a: 45, b: 22.5 };
  }

  /** One step of the story, and any jump between steps: what must go goes first, then the camera and the pencil, then the light. */
  async function run(name) {
    stopRun();
    const my = token;
    const alive = () => my === token;
    if (name === 'swap') {
      s.swap = swapPlan();
      s.u = s.swap.a;
    }
    const goal = { ...POSE[name], u: s.u };
    s.busy = true;
    s.stage = name;
    clearLabels();
    draw();
    const frame = FRAME_OF[name];

    const down = {};
    for (const k of UPS) if (V[k] > goal[k]) down[k] = goal[k];
    const downKeys = Object.keys(down);
    if (downKeys.length && !(await move(alive, downKeys, { ...V, ...down }, 0.3))) return false;

    s.held = false;
    if (name === 'screen' && V.screen <= 0) {
      s.sx = SCREEN.enter;
      s.found = false;
      V.s = s.sx;
    }
    const flying = s.frame !== frame;
    if (flying) {
      s.frame = frame;
      leaveTurnedView();
    }
    if (V.u !== goal.u) {
      if (!(await move(alive, ['u'], goal, PENCIL_TIME, ease.inOutCubic))) return false;
    } else if (flying) {
      await wait(0.9);
      if (!alive()) return false;
    }

    const ups = UPS.filter((k) => goal[k] > V[k]);
    if (ups.filter((k) => k.startsWith('r')).length > 4) {
      // a jump over several rays: they come together
      if (!(await move(alive, ups, goal, 1.6))) return false;
    } else {
      for (const k of ups) {
        // only a virtual image has lines back to draw
        if (k.endsWith('ext') && imageOf(V.u).kind !== 'virtual') {
          V[k] = goal[k];
          apply();
          continue;
        }
        if (!(await move(alive, [k], goal, TIME[k], k.startsWith('r') || k.startsWith('bundle') ? ease.linear : ease.inOutSine))) return false;
        if (k.endsWith('in') || k.endsWith('out')) {
          await wait(0.3);
          if (!alive()) return false;
        }
      }
    }
    if (name === 'swap') {
      // the picture holds, then the pencil goes to where its image was, and the image comes to where the pencil stood
      await wait(0.8);
      if (!alive()) return false;
      s.u = s.swap.b;
      draw();
      if (!(await move(alive, ['u'], { u: s.u }, PENCIL_TIME, ease.inOutCubic))) return false;
    }
    s.busy = false;
    holdResult();
    audio.tick();
    draw();
    emitChange();
    return true;
  }

  // ── camera: it glides by itself toward what the stage should fill, while the pencil moves too ─────────────────
  const goal = { box: new THREE.Box3(), az: -24, el: 10 };
  const now = { box: new THREE.Box3(), az: -24, el: 10, ready: false };
  const camDir = new THREE.Vector3();
  function frameGoal() {
    const img = imageOf(V.u);
    const f = FRAMES[s.frame]({
      u: V.u,
      s: V.screen >= 1 ? V.s : s.sx,
      v: img.kind === 'real' ? Math.min(img.v, SEE_V) : 30,
      img,
      aspect: stage.width / Math.max(1, stage.height),
    });
    goal.box.copy(f.box);
    goal.az = f.az;
    goal.el = f.el;
  }
  function camSnap() {
    frameGoal();
    now.box.copy(goal.box);
    now.az = goal.az;
    now.el = goal.el;
    now.ready = true;
  }
  function camMoving() {
    return (
      now.box.min.distanceTo(goal.box.min) + now.box.max.distanceTo(goal.box.max) + Math.abs(now.az - goal.az) + Math.abs(now.el - goal.el) > 0.08
    );
  }
  stage.addTicker((dt) => {
    let changed = false;
    if (tracks() && !s.dragging) {
      const to = screenGoal();
      if (Math.abs(V.s - to) > 0.01) {
        V.s += (to - V.s) * (1 - Math.exp(-dt * 11));
        if (Math.abs(V.s - to) <= 0.03) V.s = to;
        apply();
        changed = true;
      }
    }
    const paperGoal = wantsPaper() ? 1 : 0;
    if (V.paper !== paperGoal) {
      V.paper = clamp(V.paper + Math.sign(paperGoal - V.paper) * dt * 2.5, 0, 1);
      apply();
      changed = true;
    }
    frameGoal();
    if (!now.ready) camSnap();
    let moved = false;
    if (camMoving()) {
      const k = 1 - Math.exp(-dt * CAMERA_RATE);
      now.box.min.lerp(goal.box.min, k);
      now.box.max.lerp(goal.box.max, k);
      now.az += (goal.az - now.az) * k;
      now.el += (goal.el - now.el) * k;
      moved = true;
    } else if (!now.box.equals(goal.box)) {
      camSnap();
      moved = true;
    }
    if (changed) return true;
    return moved && !s.userMovedCamera ? 'camera' : false;
  });
  function applyCamera() {
    if (s.userMovedCamera) return;
    dirFrom(now.az, now.el, camDir);
    const pz = fitPose({ box: now.box, dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGINS });
    camera.position.copy(pz.position);
    controls.target.copy(pz.target);
    controls.enabled = !s.dragging;
    controls.update();
  }
  function leaveTurnedView() {
    if (!s.userMovedCamera) return;
    s.userMovedCamera = false;
    rotate.home();
    s.view = 'front';
    syncUI();
  }
  function setView(view) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    rotate.home();
    syncUI();
    stage.invalidate();
  }
  function turnedByHand() {
    s.userMovedCamera = true;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  }
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${t.num(360)}°`,
    label: t('rotate_me'),
    pulse: Boolean(o.coach),
    at: 'bottom-right',
    onTurn: turnedByHand,
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) camSnap();
    draw();
  });
  stage.onBeforeRender(() => {
    if (!now.ready) camSnap();
    applyCamera();
    camera.updateMatrixWorld();
  });

  // ── handles and labels: few and short, each pinned to what it names ──────────────────────────────────────
  let action = null;
  const penAt = new THREE.Vector3();
  const paperAt = new THREE.Vector3();
  const penRail = (x) => new THREE.Vector3(x, TRACKS.pencil.y, TRACKS.pencil.z);
  const paperRail = (x) => new THREE.Vector3(x, TRACKS.screen.y, TRACKS.screen.z);
  const pencilHandle = createDragHandle(stage, {
    point: () => penAt.set(-V.u, TRACKS.pencil.y, TRACKS.pencil.z),
    axis: 'x',
    track: { from: penRail(-U.max), to: penRail(-U.min) },
    label: o.coach ? t('coach_drag') : '',
    aria: t('coach_drag'),
    pulse: Boolean(o.coach),
    when: () => !s.busy && !s.quiz && movable(),
  });
  const screenHandle = createDragHandle(stage, {
    point: () => paperAt.set(V.s, TRACKS.screen.y, TRACKS.screen.z),
    axis: 'x',
    track: { from: paperRail(SCREEN.min), to: paperRail(SCREEN.max) },
    label: o.coach ? t('coach_screen') : '',
    aria: t('coach_screen'),
    pulse: Boolean(o.coach),
    when: () => !s.busy && !s.quiz && screenMovable(),
  });
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      {
        kind: 'drag',
        axis: 'x',
        text: t('howto_screen'),
        handle: screenHandle,
        when: () => !s.locked && (s.stage === 'screen' || (FREE.has(s.stage) && V.paper >= 1 && V.screen >= 1)),
      },
      { kind: 'drag', axis: 'x', text: t('howto_pencil'), handle: pencilHandle, when: () => !s.locked && FREE.has(s.stage) },
    ],
    { stage },
  );
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      rotate.el,
      note,
      ui.$('.pvc-panel-toggle'),
      () => pencilHandle.box(),
      () => screenHandle.box(),
      () => rays.boxes(),
      () => action?.ringBox(),
    ],
  });
  const shown = new Map();
  const pts = new Map();
  /** A label pinned to a world point. `spots` are the places it may take, best first; key labels have no `optional`. */
  function label(id, on, text, x, y, z, color, spots, optional = false) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).set(x, y, z);
    const was = shown.get(id);
    if (!was) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', optional });
      shown.set(id, { text });
      return;
    }
    if (was.text !== text) {
      anno.setText(id, text);
      was.text = text;
    }
  }
  function clearLabels() {
    for (const id of [...shown.keys()]) anno.remove(id);
    shown.clear();
  }
  const SPOTS = {
    up: [
      { dx: 0, dy: -24 },
      { dx: 22, dy: -26 },
      { dx: -22, dy: -26 },
      { dx: 34, dy: -12 },
      { dx: -34, dy: -12 },
    ],
    down: [
      { dx: 0, dy: 22 },
      { dx: 22, dy: 24 },
      { dx: -22, dy: 24 },
      { dx: 34, dy: 12 },
      { dx: -34, dy: 12 },
    ],
    left: [
      { dx: -26, dy: -8 },
      { dx: -26, dy: 12 },
      { dx: -14, dy: -24 },
      { dx: -14, dy: 24 },
    ],
    right: [
      { dx: 22, dy: -6 },
      { dx: 24, dy: 12 },
      { dx: 12, dy: -24 },
      { dx: 12, dy: 24 },
    ],
    lens: [
      { dx: 0, dy: -30 },
      { dx: 30, dy: -30 },
      { dx: -30, dy: -30 },
      { dx: 50, dy: -12 },
    ],
    axisName: [
      { dx: 0, dy: 18 },
      { dx: 0, dy: -18 },
      { dx: 30, dy: 18 },
    ],
    rule: [
      { dx: 0, dy: -30 },
      { dx: 20, dy: -40 },
      { dx: -30, dy: -36 },
      { dx: 0, dy: 34 },
    ],
    ruleLow: [
      { dx: 0, dy: 30 },
      { dx: 30, dy: 34 },
      { dx: -30, dy: 34 },
      { dx: 0, dy: -30 },
    ],
    tip: [
      { dx: 24, dy: 16 },
      { dx: 0, dy: 26 },
      { dx: -24, dy: 14 },
    ],
    tipUp: [
      { dx: 0, dy: -24 },
      { dx: -24, dy: -16 },
      { dx: 24, dy: -16 },
    ],
    paper: [
      { dx: 44, dy: 0 },
      { dx: 44, dy: 26 },
      { dx: 0, dy: 26 },
    ],
    image: [
      { dx: 0, dy: 52 },
      { dx: -64, dy: 50 },
      { dx: 0, dy: -66 },
      { dx: -44, dy: -72 },
      { dx: 56, dy: 50 },
      { dx: -96, dy: 22 },
      { dx: -110, dy: 64 },
      { dx: -40, dy: 92 },
      { dx: 0, dy: 84 },
      { dx: 60, dy: -44 },
    ],
    imageLong: [
      { dx: -44, dy: 66 },
      { dx: -92, dy: 10 },
      { dx: -92, dy: 44 },
      { dx: 92, dy: 6 },
      { dx: 92, dy: 40 },
      { dx: 0, dy: 80 },
    ],
    o: [
      { dx: -30, dy: 26 },
      { dx: -36, dy: 46 },
      { dx: 0, dy: 50 },
      { dx: 30, dy: -28 },
    ],
    imageVirtual: [
      { dx: -60, dy: -40 },
      { dx: -80, dy: 0 },
      { dx: 60, dy: -50 },
      { dx: -60, dy: 40 },
    ],
    eye: [
      { dx: 0, dy: 28 },
      { dx: 0, dy: -28 },
      { dx: 34, dy: 0 },
    ],
    tab: [
      { dx: -40, dy: 0 },
      { dx: -40, dy: 24 },
      { dx: 40, dy: 0 },
    ],
    old: [
      { dx: 0, dy: -40 },
      { dx: -30, dy: -46 },
      { dx: 30, dy: -46 },
    ],
  };
  const big = (letter) => `<span class="lab-letter">${letter}</span>`;
  const calmed = { pencil: false, screen: false };
  function calm(k, handle, used) {
    if (used === calmed[k]) return;
    calmed[k] = used;
    if (used) handle.markUsed();
    else handle.rearm();
  }
  function labels() {
    calm('pencil', pencilHandle, s.movedPencil);
    calm('screen', screenHandle, s.movedScreen || (s.found && s.stage !== 'screen'));
    const q = s.quiz;
    const still = !s.busy;
    const st = s.stage;
    const named = !q || q.named;
    const img = imageOf(V.u);
    const zone = zoneOf(V.u);
    const free = FREE.has(st);
    const R = rays.view.rays;
    const tiny = stage.height < 260;

    // the opening: the pencil and the lens; only their names
    label('lens', still && !q && st === 'start', t('l_lens'), 0, AX + LENS.half + 1.4, 0, INK.dark, SPOTS.lens);
    label('object', still && !q && st === 'start', t('l_object'), -V.u, AX + PENCIL + 0.2, 0, INK.dark, SPOTS.up);
    label('x', still && RAY_STEPS.has(st), t('l_x'), -V.u, AX + PENCIL, 0, INK.dark, SPOTS.left);
    // the axis and its points: their whole names on the step that brings them, then the big letters
    label('axisName', still && !q && st === 'parallel', t('l_axis'), -22, AX, 0, INK.dark, SPOTS.axisName);
    const fName = !q && st === 'parallel';
    const f2Name = !q && st === 'point';
    const oName = !q && st === 'ray2';
    // on the smallest views the free steps keep only F′, O and the image's words
    const sparse = free && tiny;
    label('f', still && V.showF >= 1 && named, fName ? `${t('l_f')} ${big('F′')}` : big('F′'), F0, AX, 0, INK.focus, SPOTS.down);
    label('f2', still && V.showF2 >= 1 && named && !sparse, f2Name ? `${t('l_source')} ${big('F')}` : big('F'), -F0, AX, 0, INK.focus, SPOTS.down);
    label('o', still && V.showO >= 1 && named && (oName || !free), oName ? `${t('l_o')} ${big('O')}` : big('O'), 0, AX, 0, INK.dark, SPOTS.o);
    const twoOn = still && V.show2F >= 1 && named && !sparse;
    label('2f', twoOn, big('2F′'), 2 * F0, AX, 0, INK.dark, SPOTS.down, true);
    label('2f2', twoOn, big('2F'), -2 * F0, AX, 0, INK.dark, SPOTS.down, true);
    label('fbar', still && !q && st === 'parallel', t('l_fbar', { f: F0 }), F0 / 2, AX - LENS.half - 2.2, 0, INK.focus, SPOTS.down);
    // this step's ray: its rule, on the ray
    label('r0', still && !q && st === 'ray1' && R[0], t('l_r_parallel'), -V.u / 2, AX + PENCIL, 0, INK.ray, SPOTS.rule);
    label('r1', still && !q && st === 'ray2' && R[1], t('l_r_centre'), -V.u / 2, AX + PENCIL / 2, 0, INK.ray, SPOTS.ruleLow, true);
    const r2 = R[2];
    label('r2', still && !q && st === 'ray3' && r2, t('l_r_focal'), F0, AX + (r2 ? r2.hit.y : 0), 0, INK.ray, SPOTS.ruleLow, true);
    // the image: where it is, and what it is, right beside it
    const near = rays.view.imageAt != null;
    const onIt = onScreen(V.s, V.u);
    const caught = st === 'screen' && onIt.sharp;
    const imageOn = still && near && (V.image >= 1 || caught) && (!q || named);
    label('xi', imageOn && V.r2out >= 1 && !free, t('l_xi'), img.v, AX + img.tip, 0, INK.dark, img.kind === 'real' ? SPOTS.tip : SPOTS.tipUp);
    const chip = imageOn && !RAY_STEPS.has(st) && st !== 'table';
    const props = t(st === 'start' ? 'p_start' : PROPS[zone]);
    const lengthOn = !tiny && img.kind === 'real' && free;
    const words = chip ? (lengthOn ? `${props}<br>${t('l_length', { l: round(img.length, 1) })}` : props) : '';
    const small = img.kind === 'real' && img.length <= 8;
    const beside = img.kind === 'virtual' ? SPOTS.imageVirtual : small ? SPOTS.image : SPOTS.imageLong;
    const pin = img.kind === 'virtual' ? img.tip * 0.6 : small ? img.tip : img.tip * 0.5;
    label('image', chip, words, img.v, AX + pin, 0, INK.dark, beside);
    // at F there is no image: the one chip says so, on the rays
    const noneOn = still && !q && img.kind === 'none' && free;
    label('none', noneOn, `${t('p_focus')}<br>${t('l_none')}`, 20, AX - (20 * PENCIL) / V.u, 0, INK.ray, SPOTS.down);
    // the eye that looks through the lens at a virtual image
    label('eye', still && !q && free && img.kind === 'virtual' && V.eye >= 1, t('l_eye'), 33, AX + 1.5, 0, INK.dark, SPOTS.eye, true);
    // the screen and the point of light
    label('screen', still && !q && st === 'screen', t('l_screen'), V.s, CARD.top - 1, 0, INK.dark, SPOTS.paper);
    // the উদাহরণ: where the pencil was
    const sw = s.swap;
    label('old', still && !q && st === 'swap' && sw, t('l_old'), -(sw?.a ?? 0), AX, 0, INK.dark, SPOTS.old, true);
    // the image, if the frame has left it out: a few words, the number is in the panel
    const offBench = img.kind === 'real' ? img.v > SEE_V : img.kind === 'virtual' && -img.v > SEE_BEHIND;
    const tabAt = img.kind === 'real' ? now.box.max.x - 8 : now.box.min.x + 8;
    label(
      'tab',
      still && !q && free && offBench,
      t(img.kind === 'real' ? 'l_tab_real' : 'l_tab_virtual'),
      tabAt,
      AX + (img.kind === 'real' ? -6 : 6),
      0,
      INK.dark,
      SPOTS.tab,
    );
    // the test's letters on the axis
    for (let i = 0; i < 4; i++) {
      const on = still && !!q?.points && q.points[i] != null && !q.named;
      label(`pt${i}`, on, on ? t(`tag_${i}`) : '', q?.points?.[i] ?? 0, AX, 0, INK.dark, i % 2 ? SPOTS.up : SPOTS.down);
    }
    anno.update();
  }
  stage.onAfterRender(labels);
  // the graph follows the bench (it draws only when its size or the pencil changed)
  stage.onAfterRender(() => {
    if (!s.quiz && FREE.has(s.stage)) graphNow();
  });

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function phase() {
    if (s.busy || s.hold) return 'busy';
    const st = s.stage;
    if (st === 'screen') return s.found ? NEXT_CASE[0] : 'find';
    if (st === 'cases') return NEXT_CASE[s.next] ?? 'swap';
    if (st === 'table') return 'test';
    return STAGES[STAGES.indexOf(st) + 1];
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const clock = performance.now();
    if (clock - lastAct < 400) return;
    lastAct = clock;
    audio.unlock();
    const ph = phase();
    if (ph === 'busy') return;
    if (ph === 'test') return quiz.start();
    if (ph === 'find') return glideScreen();
    const i = NEXT_CASE.indexOf(ph);
    if (i >= 0) return goCase(CASES[i], i + 1);
    return run(ph);
  }
  /** The pencil to the book's case; `next` is the case the action takes after it. */
  function goCase(u, next) {
    s.next = next;
    if (s.stage === 'cases' && !s.busy) return pencilTo(u);
    s.cameFrom = s.u;
    s.u = u;
    return run('cases');
  }
  function pick(word) {
    if (s.locked) return lockedNudge();
    audio.unlock();
    if (s.busy || s.hold) return;
    if (word === 'table') {
      if (s.stage !== 'table') run('table');
      return;
    }
    const i = Number(word.slice(1));
    if (FREE.has(s.stage) && s.u === CASES[i]) return replay();
    if (FREE.has(s.stage) && s.stage !== 'cases') {
      // in the later steps a word only moves the pencil
      s.next = Math.max(s.next, i + 1);
      return pencilTo(CASES[i]);
    }
    goCase(CASES[i], i + 1);
  }
  const replayable = () => s.stage !== 'start' && s.stage !== 'graph' && s.stage !== 'table';
  async function replay() {
    if (s.locked) return lockedNudge();
    if (s.busy || s.hold || !replayable()) return;
    audio.unlock();
    if (s.stage === 'cases') {
      const to = s.u;
      const from = s.cameFrom ?? U.start;
      if (from === to) return;
      const done = await pencilTo(from);
      if (done) await pencilTo(to);
      return;
    }
    const st = s.stage;
    stopRun();
    if (st === 'swap' && s.swap) {
      // the swap again, from the same place
      s.u = s.swap.a;
      s.stage = 'cases';
      settle('cases');
    } else settle(STAGES[STAGES.indexOf(st) - 1]);
    run(st);
  }
  const movable = () => !s.locked && !s.busy && FREE.has(s.stage);
  const screenMovable = () => !s.locked && !s.busy && (s.stage === 'screen' || (FREE.has(s.stage) && V.paper >= 1 && V.screen >= 1));
  function setPencil(u) {
    s.u = pickU(u);
    s.held = false;
    V.u = s.u;
    apply();
    draw();
  }
  function setScreen(x) {
    const { v } = imageOf(V.u);
    s.sx = Math.abs(x - v) <= SCREEN.sharp ? v : pickS(x);
    if (FREE.has(s.stage)) s.held = true;
    V.s = s.sx;
    if (onScreen(V.s, V.u).sharp && !s.found) {
      s.found = true;
      audio.tick();
    }
    apply();
    draw();
  }
  function pencilTo(x) {
    stopRun();
    const my = token;
    const from = V.u;
    s.busy = true;
    s.held = false;
    if (x !== s.u) s.cameFrom = s.u;
    s.u = x;
    clearLabels();
    draw();
    const seconds = Math.max(1.6, Math.min(PENCIL_TIME, Math.abs(x - from) * 0.2));
    return tweener.animate({
      key: 'pencil',
      duration: seconds,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        if (my !== token) return;
        V.u = from + (x - from) * k;
        apply();
        stage.invalidate();
      },
      onComplete: () => {
        if (my !== token) return;
        s.busy = false;
        setPencil(x);
        holdResult();
        audio.tick();
        draw();
        emitChange();
      },
    }).finished;
  }
  /** The action moves the paper to the place for the student. */
  function glideScreen(goalX = imageOf(V.u).v) {
    const my = token;
    const from = V.s;
    const to = pickS(goalX);
    s.busy = true;
    draw();
    return tweener.animate({
      key: 'glide',
      duration: 2,
      ease: ease.inOutSine,
      onUpdate: (k) => {
        if (my !== token) return;
        V.s = from + (to - from) * k;
        apply();
        stage.invalidate();
      },
      onComplete: () => {
        if (my !== token) return;
        s.busy = false;
        setScreen(to);
        holdResult();
        draw();
        emitChange();
      },
    }).finished;
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '', cap: '', lead: '' };
  const ACTIONS = {
    busy: ['act_wait', ''],
    parallel: ['act_parallel', 1],
    point: ['act_point', 2],
    ray1: ['act_ray1', 3],
    ray2: ['act_ray2', 4],
    ray3: ['act_ray3', 5],
    screen: ['act_screen', 6],
    find: ['act_find', 7],
    c0: ['act_c0', 8],
    c1: ['act_c1', 9],
    c2: ['act_c2', 10],
    c3: ['act_c3', 11],
    swap: ['act_swap', 12],
    graph: ['act_graph', 13],
    table: ['act_table', 14],
    test: ['act_test', ''],
  };
  const cm = (x) => round(x, 1);
  const mText = (m) => round(m, 2);
  function caseOutcome(u) {
    const img = imageOf(u);
    const nature = t(NATURE[zoneOf(u)]);
    const numbers = s.stage !== 'cases';
    if (img.kind === 'none') return t(numbers ? 'out_none' : 'out_none_plain', { u: cm(u) }).replace('{nature}', nature);
    const key = `${img.kind === 'real' ? 'out_real' : 'out_virtual'}${numbers ? '' : '_plain'}`;
    return t(key, { u: cm(u), v: cm(Math.abs(img.v)), m: mText(img.m) }).replace('{nature}', nature);
  }
  function outcomeNow() {
    const st = s.stage;
    if (st === 'parallel') return t('out_parallel', { f: F0 });
    if (st === 'screen') return t(onScreen(V.s, V.u).sharp ? 'out_screen_sharp' : 'out_screen');
    if (st === 'swap' && s.swap && s.u === s.swap.b) return t('out_swap', { a: cm(s.swap.a), b: cm(s.swap.b) });
    if (FREE.has(st)) return caseOutcome(s.u);
    if (st === 'start') return '';
    return t(`out_${st}`);
  }
  function tableHtml(u) {
    const z = zoneOf(u);
    const on = { inside: 0, focus: 1, between: 2, two: 3, far: 4 }[z];
    const rows = [0, 1, 2, 3, 4, 5]
      .map(
        (i) =>
          `<tr class="${i === on ? 'on' : i === 1 || i === 5 ? 'lim' : ''}"><td>${t(`tb_${i}a`)}</td><td>${t(`tb_${i}b`)}</td><td>${t(`tb_${i}c`)}</td></tr>`,
      )
      .join('');
    return `<table class="lab-table"><thead><tr><th>${t('th_object')}</th><th>${t('th_image')}</th><th>${t('th_kind')}</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  function ruleNow() {
    const st = s.stage;
    if (st === 'table') return tableHtml(s.u);
    if (st === 'start') return '';
    if (st === 'screen') return t(onScreen(V.s, V.u).sharp ? 'rule_screen_sharp' : 'rule_screen');
    if (st === 'swap' && s.swap && s.u === s.swap.b) return t('rule_swap');
    if (st === 'graph') return t('rule_graph');
    if (FREE.has(st)) {
      const z = zoneOf(s.u);
      const img = imageOf(s.u);
      if (z === 'between' && img.v > SEE_V) return t('rule_between_far');
      return t(`rule_${z}`);
    }
    return t(`rule_${st}`);
  }
  function captionNow() {
    const st = s.stage;
    if (st === 'parallel' || st === 'point') return `cap_${st}`;
    if (st === 'swap') return 'cap_swap';
    if (st === 'graph' || st === 'table') return 'cap_nijekoro';
    if (FREE.has(st)) return `cap_${zoneOf(s.u)}`;
    return 'cap_two';
  }
  function wordNow() {
    if (s.stage === 'table') return 'table';
    if (!FREE.has(s.stage)) return null;
    const i = CASES.indexOf(s.u);
    return i >= 0 ? `c${i}` : null;
  }
  function graphNow() {
    const img = imageOf(V.u);
    graph.draw({ u: V.u, kind: img.kind, v: img.v });
  }
  function panel() {
    if (s.quiz) return;
    sheet.choose(wordNow());
    ui.learn.classList.toggle('lab-tabled', s.stage === 'table');
    ui.learn.classList.toggle('lab-graphed', s.stage === 'graph');
    ui.learn.classList.toggle('lab-free', FREE.has(s.stage));
    if (!s.busy) {
      sheet.outcome(outcomeNow());
      sheet.rule(ruleNow());
      const calm = s.stage === 'start';
      const next = phase();
      const html = calm
        ? `<span class="lab-long">${t('intro')}</span><span class="lab-short">${t('intro_short')}</span>`
        : next === 'busy'
          ? steady.lead
          : t(`lead_${next}`);
      if (steady.lead !== html) {
        steady.lead = html;
        lead.innerHTML = html;
        lead.classList.toggle('pvc-note', calm);
        ui.learn.classList.toggle('lab-calm', calm);
      }
    }
    const cap = captionNow();
    if (steady.cap !== cap) {
      steady.cap = cap;
      caption.innerHTML = t(cap);
    }
    if (FREE.has(s.stage)) graphNow();
    const ph = phase();
    const nextI = NEXT_CASE.indexOf(ph);
    sheet.next(nextI >= 0 ? `c${nextI}` : ph === 'table' ? 'table' : null);
    const [word, step] = ACTIONS[ph];
    replayBtn.hidden = !replayable();
    replayBtn.disabled = s.busy || s.hold;
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled });
    }
  }
  const replayBtn = ui.$('[data-act="replay"]');
  function draw() {
    panel();
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  const aim = new THREE.Vector3();
  function target() {
    if (s.locked || s.busy || camMoving() || s.dragging) return null;
    const ph = phase();
    if (ph === 'ray1' || ph === 'ray2' || ph === 'ray3' || NEXT_CASE.includes(ph) || ph === 'swap') aim.set(-V.u, AX + PENCIL + 3, 0);
    else if (ph === 'parallel') aim.set(0, AX + LENS.half + 2, 0);
    else if (ph === 'point') aim.set(-F0, AX, 0);
    else if (ph === 'screen') aim.set(imageOf(V.u).v + 6, AX - 8, 0);
    else if (ph === 'find') aim.set(V.s, CARD.top + 1, 0);
    else return null;
    setting.tapTarget.position.copy(aim);
    return aim;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_parallel',
    target: () => (o.coach ? target() : null),
    radius: 20,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // a tap on the part is the same action; a finger on the pencil or the paper moves it along the rail
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pa = new THREE.Vector3();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  let down = null;
  let drag = null;
  const toNdc = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
  };
  /** The x on the rail under a finger: in the plane of the rays, so it holds however the camera glides meanwhile. */
  function railX(e) {
    toNdc(e);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, pa) ? pa.x : null;
  }
  function pickPart(e) {
    const box = ui.canvasHost.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    if (pencilHandle.hit(x, y)) return 'pencil';
    if (screenHandle.hit(x, y)) return 'screen';
    if (screenMovable() && ray.intersectObject(setting.screenHit, false).length) return 'screen';
    if (movable() && ray.intersectObject(setting.hit, false).length) return 'pencil';
    return null;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      down = { x: e.clientX, y: e.clientY, at: performance.now() };
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      toNdc(e);
      ray.setFromCamera(ndc, camera);
      const what = pickPart(e);
      if (!what) return;
      const x = railX(e);
      drag = { id: e.pointerId, what, grab: (what === 'screen' ? V.s : -s.u) - (x ?? 0) };
      s.dragging = true;
      capturePointer(ui.canvasHost, e.pointerId);
      e.stopPropagation();
      e.preventDefault();
      emit('dragstart', { part: what });
      draw();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const x = railX(e);
    if (x == null) return;
    if (drag.what === 'screen') {
      setScreen(x + drag.grab);
      s.movedScreen = true;
    } else {
      setPencil(-(x + drag.grab));
      s.movedPencil = true;
    }
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    releasePointer(ui.canvasHost, drag.id);
    if (e && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down = null;
    emit('dragend', { part: drag.what });
    drag = null;
    s.dragging = false;
    draw();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.at < 600;
    down = null;
    if (moved > 8 || !quick || !target()) return;
    toNdc(e);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(setting.tapTarget, false).length) act();
  });

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  const ORDER = ['rule', 'kind', 'meet', 'screen', 'swap'];
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  /** The scene of a question: everything set at once, showing only what the question allows. */
  function quizScene(q, { u = U.start, frame = 'story', change = {} } = {}) {
    stopRun();
    s.u = u;
    s.stage = 'cases';
    settle('cases');
    Object.assign(V, SQ_HIDE, change);
    s.frame = frame;
    s.quiz = { ...q, named: false };
    V.s = screenGoal();
    apply();
    clearLabels();
    stage.invalidate();
  }
  const Q = {
    rule() {
      const points = shuffle([F0, 2 * F0, F0 / 2]);
      quizScene({ kind: 'rule', points }, { u: shuffle([30, 40, 45])[0], change: { r1in: 1, showF: 0, show2F: 0 } });
      const tag = (x) => t(`tag_${points.indexOf(x)}`);
      return {
        text: t('q_rule'),
        answer: F0,
        wrong: [2 * F0, F0 / 2, 'straight'],
        label: (x) => (x === 'straight' ? t('c_rule_straight') : t('c_point', { x: tag(x) })),
        notes: notesOf([
          [2 * F0, t('n_rule_two')],
          [F0 / 2, t('n_rule_mid')],
          ['straight', t('n_rule_straight')],
        ]),
        reveal: t('a_rule', { x: tag(F0) }),
        after: { r1out: 1, showF: 1 },
      };
    },
    kind() {
      const u = shuffle([50, 40, 22.5, 20, 10, 8])[0];
      quizScene({ kind: 'kind' }, { u, frame: 'wide', change: { show2F: 1 } });
      const z = zoneOf(u);
      const answer = { far: 0, between: 1, inside: 2 }[z];
      const wrong = [0, 1, 2, 3].filter((i) => i !== answer);
      return {
        text: t('q_kind'),
        answer,
        wrong,
        label: (i) => t(`c_kind_${i}`),
        notes: notesOf(wrong.map((i) => [i, t(i === 3 ? 'n_kind_two' : 'n_kind_side')])),
        reveal: t('a_kind', { why: t(`why_${z}`) }).replace('{nature}', t(NATURE[z])),
        after: { ...R1, ...R2, beam: 1, image: 1, eye: 1 },
        frame: 'cases',
      };
    },
    meet() {
      const [u, v] = shuffle([
        [22.5, 45],
        [45, 22.5],
      ])[0];
      const points = shuffle([F0, 22.5, 2 * F0, 45]);
      quizScene({ kind: 'meet', points }, { u, frame: 'cases', change: { r1in: 1, r1out: 1, r2in: 1, r2out: 1, show2F: 0 } });
      const tag = (x) => t(`tag_${points.indexOf(x)}`);
      const wrong = points.filter((x) => x !== v);
      const note = (x) => (x === F0 ? t('n_meet_f') : x === 2 * F0 ? t('n_meet_two') : t('n_meet_u'));
      return {
        text: t('q_meet'),
        answer: v,
        wrong,
        label: (x) => t('c_point', { x: tag(x) }),
        notes: notesOf(wrong.map((x) => [x, note(x)])),
        reveal: t('a_meet', { x: tag(v), v }),
        after: { image: 1, beam: 1, screen: 1, show2F: 1 },
      };
    },
    screen() {
      const u = 10;
      const v = Math.abs(imageOf(u).v);
      quizScene({ kind: 'screen' }, { u, frame: 'cases', change: { r1in: 1, r1out: 1, r2in: 1, r2out: 1 } });
      return {
        text: t('q_screen'),
        answer: 'none',
        wrong: ['v', 'f', 'two'],
        label: (k) => t(`c_screen_${k}`, { v }),
        notes: notesOf([
          ['v', t('n_screen_v', { v })],
          ['f', t('n_screen_spot')],
          ['two', t('n_screen_spot')],
        ]),
        reveal: t('a_screen'),
        after: { r1ext: 1, r2ext: 1, image: 1, eye: 1 },
      };
    },
    swap() {
      const [a, b] = shuffle([
        [40, 24],
        [60, 20],
      ])[0];
      quizScene({ kind: 'swap' }, { u: a, frame: 'cases', change: { ...R1, ...R2, image: 1, beam: 1, show2F: 1 } });
      const wrong = [b, F0, 2 * F0];
      return {
        text: t('q_swap', { a, b }),
        answer: a,
        wrong,
        label: (k) => t('c_cm', { x: k }),
        notes: notesOf([
          [b, t('n_swap_same')],
          [F0, t('n_swap_f')],
          [2 * F0, t('n_swap_two')],
        ]),
        reveal: t('a_swap', { a }),
        slideTo: b,
      };
    },
  };
  const saved = { stage: 'start', u: U.start, sx: SCREEN.enter };
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 3, feedback: 3 },
    action,
    hooks: {
      enter() {
        const wasBusy = s.busy;
        stopRun();
        if (drag) endDrag();
        s.mode = 'quiz';
        s.locked = true;
        saved.stage = s.stage;
        saved.u = s.u;
        saved.sx = s.sx;
        if (wasBusy) settle(s.stage);
        clearLabels();
        syncUI();
      },
      leave() {
        stopRun();
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        s.stage = saved.stage;
        s.u = saved.u;
        s.sx = saved.sx;
        clearLabels();
        settle(s.stage);
        syncUI();
        draw();
      },
      async prepare(i, alive, say) {
        const q = Q[ORDER[i]]();
        qCurrent = q;
        say(q.text);
        await tweener.animate({ key: 'quiz-wait', duration: 0.5 }).finished;
        if (!alive()) return null;
        // the kit scores numbers: the choices are places in this list, never its words
        const list = shuffle([q.answer, ...q.wrong]);
        q.list = list;
        s.quiz.right = list.indexOf(q.answer);
        return {
          choices: [0, 1, 2, 3],
          expected: list.indexOf(q.answer),
          tolerance: 0.5,
          label: (n) => q.label(list[n]),
          meta: { kind: ORDER[i] },
        };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        if (s.quiz) {
          s.quiz.named = true;
          if (q.after) {
            Object.assign(V, q.after);
            apply();
          }
          if (q.frame) s.frame = q.frame;
          if (q.slideTo != null) pencilTo(q.slideTo);
        }
        stage.invalidate();
        const chosen = picked ? q.list[picked.value] : null;
        const why = !correct && picked ? q.notes.get(String(chosen)) : '';
        return `${q.reveal}${why ? ` <span class="lab-why">${t('n_pick', { x: q.label(chosen) })} ${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  let hintTimer = 0;
  function hint(text) {
    ui.hintText.innerHTML = text;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => ui.hint.classList.remove('show'), 3200);
  }
  function lockedNudge() {
    hint(t('q_locked'));
    audio.error();
  }
  function restart() {
    s.u = U.start;
    s.sx = SCREEN.enter;
    s.found = false;
    s.held = false;
    s.movedPencil = false;
    s.movedScreen = false;
    s.cameFrom = null;
    s.next = 0;
    s.swap = null;
  }
  function home() {
    if (s.locked) return lockedNudge();
    restart();
    return run('start');
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  let lastTap = { what: '', at: 0 };
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    const what = b.dataset.act || b.dataset.example || '';
    const clock = performance.now();
    if (what && what === lastTap.what && clock - lastTap.at < 120) return;
    lastTap = { what, at: clock };
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) pick(b.dataset.example);
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'home') home();
    if (a === 'replay') replay();
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      // the keys move the paper in its own step, the pencil from then on (→ moves it right, toward the lens)
      if (s.stage === 'screen' && screenMovable()) {
        setScreen(V.s + step);
        s.movedScreen = true;
        emitChange();
        return;
      }
      if (!movable()) return;
      setPencil(s.u - step);
      s.movedPencil = true;
      emitChange();
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      act();
    }
  });

  // ── state for the book ──────────────────────────────────────────────────────────────────────────────────
  function snapshot() {
    const img = imageOf(s.u);
    const on = onScreen(tracks() ? screenGoal() : V.s, s.u);
    const finite = Number.isFinite(img.v);
    const drawn = threeRays(s.u).filter(Boolean);
    return {
      stage: s.stage,
      u: s.u,
      f: F0,
      kind: img.kind,
      zone: zoneOf(s.u),
      v: finite ? round(img.v, 3) : null,
      m: finite ? round(img.m, 4) : null,
      imageLength: finite ? round(img.length, 3) : null,
      inverted: img.kind === 'real',
      formulaError: finite ? round(formulaError(s.u, img.v), 9) : null,
      rayMiss: round(Math.max(0, ...drawn.map((r) => missOf(r, s.u))), 9),
      rays: rays.view.keys.filter((k, i) => k.in >= 1 && rays.view.rays[i]).length,
      bundle: V.bundleP >= 1 ? 'parallel' : V.bundleS >= 1 ? 'point' : null,
      image: V.image >= 1,
      eye: rays.view.eye >= 1,
      screen: V.screen >= 1 && V.paper >= 1 ? { x: round(tracks() ? screenGoal() : V.s, 2), sharp: on.sharp } : null,
      swap: s.swap,
      grips: { pencil: pencilHandle.visible, screen: screenHandle.visible },
      found: s.found,
      busy: s.busy || s.hold,
      frame: s.frame,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
      question: s.quiz ? { kind: s.quiz.kind, right: s.quiz.right ?? null } : null,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.stage, snap.u]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }
  function fixNext() {
    const i = CASES.indexOf(s.u);
    if (i >= 0) s.next = i + 1;
  }
  /** At once: what the book or a test asks to see. */
  function jump(name) {
    stopRun();
    if (name === 'swap') {
      s.swap = swapPlan();
      s.u = s.swap.b;
    }
    s.stage = name;
    if (name === 'screen') s.found = onScreen(s.sx, s.u).sharp;
    clearLabels();
    settle(name);
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  jump(start);
  syncUI();
  setView(s.view);
  draw();
  // the parts of later steps are hidden now: their shaders are compiled ahead, so the first tap does not stall
  stage.warmUp?.({ show: setting.later });
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
  })();

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: () => snapshot(),
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) setView(p.view);
      if (p.screen != null && s.stage === 'screen' && !s.busy && !STAGES.includes(p.stage)) {
        if (animate) glideScreen(Number(p.screen));
        else setScreen(Number(p.screen));
      }
      if (STAGES.includes(p.stage)) {
        if (p.u != null) s.u = pickU(p.u);
        if (p.screen != null) s.sx = pickS(Number(p.screen));
        fixNext();
        if (animate) run(p.stage);
        else jump(p.stage);
      } else if (p.u != null && movable()) {
        if (animate) pencilTo(pickU(p.u));
        else setPencil(pickU(p.u));
        fixNext();
      }
      if (!animate) camSnap();
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      restart();
      jump('start');
      setView('front');
      camSnap();
      draw();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** The view with its drawing on it, cover-fitted to the size asked for (background: null keeps it transparent). */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      stage.render();
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      const ctx = c.getContext('2d');
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
      return c.toDataURL('image/png');
    },
    exportRoot: () => setting.apparatus,
  };
}
