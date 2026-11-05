// Images in a concave mirror (book pp 229–234, topics 8.6.1 and 8.7): the student view. The book's pencil XY stands far before a concave
// mirror on the chapter's optical bench. Two rays by the book's rules meet at X′: there the light really gathers, a real image hangs
// upside down, and a paper screen slid to the right place catches it sharp. Then the pencil comes nearer, case by case: at O the image
// is in the same place and the same size, between O and F it runs away and grows, at F there is no image at all, and inside F the
// rays only seem to meet behind the mirror: a virtual image, upright and big, that no screen can catch. Last the formula and the
// book's table, both live while the student drags the pencil.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { createSetting, FRAMES, RAIL, SEE_BEHIND, SEE_V, TRACKS } from './bench.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  CARD,
  CASES,
  clamp,
  F0,
  formulaError,
  imageOf,
  lawError,
  MIRROR,
  NATURE,
  onScreen,
  PENCIL,
  PROPS,
  R0,
  round,
  SCREEN,
  sag,
  secondRay,
  shuffle,
  twoRays,
  U,
  zoneOf,
} from './reading.js';

export const DEFAULTS = {
  stage: 'start', // one of STAGES
  u: U.start, // where the pencil stands, cm from the mirror
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring and the words on the handles
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

/** The story, in order: one new thing a tap. */
export const STAGES = ['start', 'points', 'ray1', 'ray2', 'screen', 'cases', 'formula', 'table'];

const REST = {
  axis: 0,
  showF: 0,
  showO: 0,
  r1in: 0,
  r1out: 0,
  r1ext: 0,
  r2in: 0,
  r2out: 0,
  r2ext: 0,
  beam: 0,
  image: 1,
  star: 0,
  screen: 0,
  bars: 0,
};
const MARKS = { axis: 1, showF: 1, showO: 1 };
const R1 = { r1in: 1, r1out: 1, r1ext: 1 };
const R2 = { r2in: 1, r2out: 1, r2ext: 1 };
const ALL = { ...REST, ...MARKS, ...R1, ...R2, beam: 1, screen: 1 };
const WORKED = { ...ALL, bars: 1 };
/** What each stage shows: first only the pencil, the mirror and the image, then the rest of the picture, a piece at a time. */
const POSE = {
  start: REST,
  points: { ...REST, ...MARKS },
  ray1: { ...REST, ...MARKS, ...R1 },
  ray2: { ...REST, ...MARKS, ...R1, ...R2, star: 1 },
  screen: { ...REST, ...MARKS, ...R1, ...R2, beam: 1, image: 0, screen: 1 },
  cases: ALL,
  formula: WORKED,
  table: ALL,
};
const FRAME_OF = {
  start: 'story',
  points: 'story',
  ray1: 'story',
  ray2: 'story',
  screen: 'screen',
  cases: 'cases',
  formula: 'cases',
  table: 'cases',
};
/** The ray each step adds, for the step-back of the other. */
const NOW = { ray1: 0, ray2: 1 };
/** The order things come in. */
const UPS = ['axis', 'showO', 'showF', 'r1in', 'r1out', 'r1ext', 'r2in', 'r2out', 'r2ext', 'star', 'beam', 'image', 'screen', 'bars'];
/** How long each takes to come, s: slow enough to follow. */
const TIME = {
  axis: 0.7,
  showO: 0.6,
  showF: 0.6,
  r1in: 1.2,
  r1out: 1.2,
  r1ext: 1.2,
  r2in: 1.2,
  r2out: 1.2,
  r2ext: 1.2,
  star: 0.6,
  beam: 1,
  image: 1.6,
  screen: 1.6,
  bars: 0.5,
};
/** The time for the pencil to come to a new place, s. */
const PENCIL_TIME = 2.5;
/** After a step the picture holds still this long, s, before anything may change it: the owner's rule, a lab must not outrun the student. */
const HOLD = 1;
/** How fast the camera closes on its frame: a flight takes about 1.5–2 s. */
const CAMERA_RATE = 2.4;
/** From here on the student moves the pencil. */
const FREE = new Set(['cases', 'formula', 'table']);
/** The cases in the order the action takes them, with their words. */
const NEXT_CASE = ['c30', 'c22', 'c15', 'c10'];

/** The steps where rays are being drawn. */
const RAY_STEPS = new Set(['points', 'ray1', 'ray2']);
const MARGINS = { top: 12, bottom: 10, side: 8 };
const INK = { dark: '#2b3a4a', ray: '#8a4f00', focus: '#5a37d0' };
const AX = RAIL.axis;
const SQ_HIDE = { r1in: 0, r1out: 0, r1ext: 0, r2in: 0, r2out: 0, r2ext: 0, beam: 0, image: 0, star: 0, screen: 0, bars: 0 };

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
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  // the distances are numbers: they go through t.num like any other
  CASES.forEach((u, i) => {
    const word = ui.$(`[data-example="c${i}"] .pvc-ex-word`);
    if (word) word.textContent = t.num(u);
  });
  const caption = document.createElement('p');
  caption.className = 'lab-cap';
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'lab-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);
  // the drag handles: always there while the part can be moved, so that nobody has to guess (the owner's rule). A finger on one is
  // found by distance in the pointerdown below; the element itself lets every touch through
  const ARROWS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18M3 12l5-5M3 12l5 5M21 12l-5-5M21 12l-5 5"/></svg>';
  function makeGrip(words) {
    const el = document.createElement('div');
    el.className = 'lab-handle';
    el.hidden = true;
    el.innerHTML = `<i class="lab-hd">${ARROWS}</i><span class="lab-hl">${t(words)}</span>`;
    ui.stage.appendChild(el);
    return { el, on: false, x: 0, y: 0, used: null, up: null, wordsWide: words === 'coach_drag' ? 62 : 54 };
  }
  const grips = { pencil: makeGrip('coach_drag'), screen: makeGrip('coach_screen') };

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 22, near: 10, far: 1600, environmentIntensity: 0.8 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(30);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(91);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(6); // the silver faces the pencil: never from behind the mirror
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(91);
  const setting = createSetting({ stage, shadow: Boolean(o.shadow), t });
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
    movedPencil: false, // the handles calm down once used
    movedScreen: false,
    next: 0, // the case the action goes to next, in NEXT_CASE
    busy: false,
    hold: false, // the result stands for a moment: no new step yet
    cameFrom: null, // where the pencil came from, for a replay
    dragging: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    frame: FRAME_OF[start],
  };
  // what is drawn now; the numbers move, the state above does not
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
  /** At F and inside it the paper has nothing to catch: outside the screen step it goes, and leaves the picture clear. */
  const wantsPaper = () => !FREE.has(s.stage) || V.u > F0;
  function screenGoal() {
    const img = imageOf(V.u);
    if (img.kind !== 'real') return SCREEN.rest;
    return clamp(img.v, SCREEN.min, SCREEN.max);
  }

  // ── what the 3D shows, from V ──────────────────────────────────────────────────────────────────────────
  let tracedU = -1;
  function apply() {
    const rv = rays.view;
    const img = imageOf(V.u);
    if (V.u !== tracedU) {
      tracedU = V.u;
      rv.rays = twoRays(V.u);
    }
    rv.keys[0].in = V.r1in;
    rv.keys[0].out = V.r1out;
    rv.keys[0].ext = V.r1ext;
    rv.keys[1].in = V.r2in;
    rv.keys[1].out = V.r2out;
    rv.keys[1].ext = V.r2ext;
    rv.now = NOW[s.stage] ?? -1;
    rv.axis = V.axis;
    rv.showF = V.showF;
    rv.showO = V.showO;
    rv.u = V.u;
    rv.kind = img.kind;
    rv.iv = img.v;
    // the wash of light belongs to an image the light really makes: it fades as the pencil comes to F, and never lies behind the pencil
    rv.beam = V.beam * clamp((V.u - F0) / 2, 0, 1);
    rv.bars = V.bars;
    const paperOn = V.screen * V.paper;
    rv.screenAt = paperOn >= 1 ? V.s : null;
    const near = img.kind === 'real' ? img.v <= 80 : img.kind === 'virtual' && img.behind <= 66;
    rv.imageAt = near ? { x: img.v, y: img.tip } : null;
    rv.imageK = near && V.r2out >= 1 && V.r1out >= 1 && (V.image >= 1 || s.found || V.star > 0) ? 1 : 0;
    note.hidden = V.r1in <= 0 || s.stage === 'ray2';
    setting.placePencil(V.u);
    setting.placeImage(img.kind, img.v, img.m, near ? V.image : 0);
    setting.placeScreen(paperOn, V.s, onScreen(V.s, V.u));
    setting.placeStar(img.v, img.tip, img.kind === 'real' && near ? V.star * 0.75 : 0, 6);
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

  /** One step of the story, and any jump between steps: what must go goes first, then the camera and the pencil, then the light. */
  async function run(name) {
    stopRun();
    const my = token;
    const alive = () => my === token;
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
      await wait(0.8);
      if (!alive()) return false;
    }

    const ups = UPS.filter((k) => goal[k] > V[k]);
    if (ups.filter((k) => k.startsWith('r')).length > 3) {
      // a jump over several rays: they come together
      if (!(await move(alive, ups, goal, 1.6))) return false;
    } else {
      for (const k of ups) {
        // only a virtual image has lines behind the mirror to draw
        if (k.endsWith('ext') && imageOf(V.u).kind !== 'virtual') {
          V[k] = goal[k];
          apply();
          continue;
        }
        // the pause after the ray reaches the mirror, and after it comes back: one thing at a time
        if (!(await move(alive, [k], goal, TIME[k], k.startsWith('r') ? ease.linear : ease.inOutSine))) return false;
        if (k.endsWith('in') || k.endsWith('out')) {
          await wait(0.3);
          if (!alive()) return false;
        }
      }
    }
    s.busy = false;
    holdResult();
    audio.tick();
    draw();
    emitChange();
    return true;
  }

  // ── camera: it glides by itself toward what the stage should fill, while the pencil moves too ─────────────────
  const goal = { box: new THREE.Box3(), az: 30, el: 9 };
  const now = { box: new THREE.Box3(), az: 30, el: 9, ready: false };
  const camDir = new THREE.Vector3();
  const FALLBACK_V = 30;
  function frameGoal() {
    const img = imageOf(V.u);
    // at F and inside it the frame comes close, whatever the step
    const name = s.frame === 'cases' && V.u <= F0 ? 'close' : s.frame;
    const f = FRAMES[name]({
      u: V.u,
      s: V.screen >= 1 ? V.s : s.sx,
      v: img.kind === 'real' ? Math.min(img.v, SEE_V) : FALLBACK_V,
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
    // the paper keeps to the image
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
    let camera_ = false;
    if (camMoving()) {
      const k = 1 - Math.exp(-dt * CAMERA_RATE);
      now.box.min.lerp(goal.box.min, k);
      now.box.max.lerp(goal.box.max, k);
      now.az += (goal.az - now.az) * k;
      now.el += (goal.el - now.el) * k;
      camera_ = true;
    } else if (!now.box.equals(goal.box)) {
      camSnap();
      camera_ = true;
    }
    if (changed) return true;
    return camera_ ? 'camera' : false;
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
  /** The camera goes back to the story if the student had turned it. */
  function leaveTurnedView() {
    if (!s.userMovedCamera) return;
    s.userMovedCamera = false;
    s.view = 'front';
    syncUI();
  }
  function setView(view) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    stage.invalidate();
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  });
  stage.onResize(() => {
    s.userMovedCamera = false;
    if (s.view === '3d') {
      s.view = 'front';
      syncUI();
    }
    camSnap();
    draw();
  });
  stage.onBeforeRender(() => {
    if (!now.ready) camSnap();
    applyCamera();
    camera.updateMatrixWorld();
  });

  // ── labels on the picture: few and short, each pinned to what it names ───────────────────────────────────
  let action = null;
  const gripBoxesLater = () => gripBoxes();
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, ui.$('.pvc-panel-toggle'), gripBoxesLater, () => rays.boxes(), () => action?.ringBox()],
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
      { dx: -24, dy: -8 },
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
    mirror: [
      { dx: -8, dy: -34 },
      { dx: 18, dy: -32 },
      { dx: -34, dy: -24 },
      { dx: 34, dy: -24 },
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
    rule: [
      { dx: 0, dy: 44 },
      { dx: 60, dy: 50 },
      { dx: 100, dy: 44 },
      { dx: 20, dy: 76 },
    ],
    over: [
      { dx: -10, dy: -44 },
      { dx: 40, dy: -50 },
      { dx: -50, dy: -36 },
      { dx: 60, dy: -30 },
    ],
    paper: [
      { dx: -44, dy: 2 },
      { dx: -44, dy: 26 },
      { dx: 0, dy: 26 },
    ],
    // beside the image: from its tip for a small one, to the side of a long one
    image: [
      { dx: 34, dy: 64 },
      { dx: -74, dy: 58 },
      { dx: 96, dy: 34 },
      { dx: -96, dy: 30 },
      { dx: 96, dy: -20 },
      { dx: -130, dy: 62 },
    ],
    imageLong: [
      { dx: -92, dy: 6 },
      { dx: 92, dy: 6 },
      { dx: -92, dy: 44 },
      { dx: 92, dy: 44 },
      { dx: 0, dy: 80 },
    ],
    leftWide: [
      { dx: -8, dy: -30 },
      { dx: -8, dy: 26 },
      { dx: 40, dy: 24 },
    ],
    tab: [
      { dx: -40, dy: 0 },
      { dx: -40, dy: 24 },
      { dx: 40, dy: 0 },
    ],
    // with u and v on the rail: over the axis, clear of them
    imageWorked: [
      { dx: 0, dy: -74 },
      { dx: -30, dy: -76 },
      { dx: 40, dy: -44 },
      { dx: -70, dy: -40 },
    ],
    behindWorked: [
      { dx: 100, dy: -60 },
      { dx: 100, dy: -30 },
      { dx: 40, dy: 104 },
    ],
    imageBehind: [
      { dx: 40, dy: 104 },
      { dx: 40, dy: 84 },
      { dx: 96, dy: 56 },
      { dx: 96, dy: 0 },
    ],
    barLow: [
      { dx: 0, dy: 13 },
      { dx: -30, dy: 13 },
      { dx: 30, dy: 13 },
    ],
    barHigh: [
      { dx: 0, dy: -13 },
      { dx: 34, dy: -13 },
      { dx: -34, dy: -13 },
      { dx: -70, dy: -13 },
      { dx: -70, dy: 14 },
      { dx: 70, dy: 14 },
    ],
    near: [
      { dx: 0, dy: 0 },
      { dx: 0, dy: -16 },
      { dx: 0, dy: 16 },
    ],
  };
  const big = (letter) => `<span class="lab-letter">${letter}</span>`;
  const gripPoint = new THREE.Vector3();
  /** A handle at the world point (x, y, z), while it can be used: inside the view, with its track behind it. */
  function placeGrip(g, on, x, y, z, used) {
    let shown = on;
    if (on) {
      gripPoint.set(x, y, z).project(camera);
      g.x = ((gripPoint.x + 1) / 2) * stage.width;
      g.y = ((1 - gripPoint.y) / 2) * stage.height;
      // a part out of the view has no handle: the toggle at the edge stays clear too
      shown = g.x > 20 && g.x < stage.width - 40 && g.y > 20 && g.y < stage.height - 16;
    }
    if (shown !== g.on) {
      g.on = shown;
      g.el.hidden = !shown;
    }
    if (!shown) return false;
    g.el.style.transform = `translate(${g.x}px, ${g.y}px)`;
    const up = g.y > stage.height - 60;
    if (up !== g.up) {
      g.up = up;
      g.el.classList.toggle('up', up);
    }
    const calm = used || !o.coach;
    if (calm !== g.used) {
      g.used = calm;
      g.el.classList.toggle('used', calm);
    }
    return true;
  }
  const penTrack = { from: U.min, to: U.max, ...TRACKS.pencil };
  const paperTrack = { from: SCREEN.min, to: SCREEN.max, ...TRACKS.screen };
  const trackList = [];
  function placeGrips() {
    const open = !s.busy && !s.quiz && !s.dragging;
    const seesPen = placeGrip(grips.pencil, open && movable(), V.u, TRACKS.pencil.y, TRACKS.pencil.z, s.movedPencil);
    const paperFree = open && screenMovable();
    const seesPaper = placeGrip(grips.screen, paperFree, V.s, TRACKS.screen.y, TRACKS.screen.z, s.movedScreen || (s.found && s.stage !== 'screen'));
    trackList.length = 0;
    if (seesPen) trackList.push(penTrack);
    if (seesPaper) trackList.push(paperTrack);
    rays.view.tracks = trackList;
  }
  function gripBoxes() {
    const out = [];
    for (const g of [grips.pencil, grips.screen]) {
      if (!g.on) continue;
      const r = g.used ? 16 : 22;
      out.push({ left: g.x - r, right: g.x + r, top: g.y - r, bottom: g.y + r });
      if (!g.used) {
        const y = g.up ? g.y - 44 : g.y + 22;
        out.push({ left: g.x - g.wordsWide, right: g.x + g.wordsWide, top: y, bottom: y + 22 });
      }
    }
    return out;
  }
  function labels() {
    placeGrips();
    const q = s.quiz;
    const calm = !s.busy;
    const st = s.stage;
    const named = !q || q.named;
    const img = imageOf(V.u);
    const zone = zoneOf(V.u);
    const free = FREE.has(st);
    const worked = st === 'formula' || st === 'table';
    // at F and inside it the picture keeps only what the idea needs: X, X′, one chip, F
    const sparse = free && V.u <= F0;
    const R = rays.view.rays;

    // the opening: the pencil, the mirror, the image; only their names
    const rim = sag(R0, MIRROR.half);
    label('mirror', calm && !q && st === 'start', t('l_mirror'), rim, AX + MIRROR.half + 1.2, 0, INK.dark, SPOTS.mirror);
    label('object', calm && !q && st === 'start', t('l_object', { l: PENCIL }), V.u, AX + PENCIL + 0.2, 0, INK.dark, SPOTS.up);
    label(
      'x',
      calm && st !== 'start' && st !== 'points' && !(worked && !sparse),
      t('l_x'),
      V.u,
      AX + PENCIL,
      0,
      INK.dark,
      V.u < R0 ? SPOTS.tipUp : SPOTS.right,
    );
    // F, O, P: big letters on the axis, and their whole names on the step that brings them
    const whole = !q && st === 'points';
    const name = (key, letter) => (whole ? `${t(key)} ${big(letter)}` : big(letter));
    label('o', calm && V.showO >= 1 && named && !sparse, name('l_o', 'O'), R0, AX, 0, INK.dark, SPOTS.up);
    label('f', calm && V.showF >= 1 && named, name('l_f', 'F'), F0, AX, 0, INK.focus, SPOTS.up);
    label('p', calm && V.axis >= 1 && named && !sparse, name('l_p', 'P'), 0, AX, 0, INK.dark, whole ? SPOTS.leftWide : SPOTS.down);
    // this step's ray: its rule, on the ray
    const low = R[1]?.name;
    label('r0', calm && !q && st === 'ray1', t('l_r_parallel'), (R[0].start.x + R[0].hit.x) * 0.5, AX + R[0].start.y, 0, INK.ray, SPOTS.up);
    label('r1', calm && !q && st === 'ray2', t('l_r_focus'), R[1].hit.x + 9, AX + R[1].hit.y, 0, INK.ray, SPOTS.rule, true);
    // a ray the book does not use for this case says what it is, once, where there is room
    const second = calm && !q && st === 'cases' && !sparse && low === 'pole';
    label('r2', second, t('l_r_pole'), R[1].start.x * 0.5, AX + PENCIL * 0.5, 0, INK.ray, SPOTS.over, true);
    // the image: where it is, and what it is, right beside it
    const near = rays.view.imageAt != null;
    const onIt = onScreen(V.s, V.u);
    const caught = st === 'screen' && onIt.sharp;
    const imageOn = calm && near && (V.image >= 1 || caught) && (!q || named);
    label(
      'xi',
      imageOn && V.r2out >= 1 && !(worked && !sparse),
      t('l_xi'),
      img.v,
      AX + img.tip,
      0,
      INK.dark,
      img.kind === 'real' ? SPOTS.tip : SPOTS.left,
    );
    // the words beside the image, in its own steps; while the rays are drawn they step aside
    const tiny = stage.height < 260;
    const chip = imageOn && !RAY_STEPS.has(st) && !(tiny && V.bars >= 1);
    const props = t(st === 'start' ? 'p_start' : PROPS[zone]);
    const words = chip ? (tiny ? props : `${props}<br>${t('l_length', { l: round(img.length, 1) })}`) : '';
    const small = img.kind === 'real' && img.length <= 8;
    const inFormula = st === 'formula';
    let beside = small ? SPOTS.image : img.kind === 'real' ? SPOTS.imageLong : SPOTS.imageBehind;
    if (inFormula) beside = img.kind === 'real' ? SPOTS.imageWorked : SPOTS.behindWorked;
    // pinned to the tip of a small image, to the foot of one in the formula's step, otherwise to its middle
    const pin = inFormula && img.kind === 'real' ? 0 : small ? img.tip : img.tip * 0.5;
    label('image', chip, words, img.v, AX + pin, 0, INK.dark, beside);
    // at F there is no image: the one chip says so, on the rays
    const noneOn = calm && !q && img.kind === 'none' && free;
    label('none', noneOn, `${t('p_focus')}<br>${t('l_none')}`, 11, AX - (11 * 2) / 5, 0, INK.ray, SPOTS.down);
    // the screen
    label('screen', calm && !q && st === 'screen', t('l_screen'), V.s, CARD.bottom + 1.5, CARD.half, INK.dark, SPOTS.paper);
    // the distances: only in the formula's step
    const barsOn = calm && V.bars >= 1 && st === 'formula';
    label('u', barsOn, t('l_u', { u: round(V.u, 1) }), V.u * 0.25, RAIL.top + 1.5, 0, INK.dark, SPOTS.barLow);
    const vOn = barsOn && Number.isFinite(img.v);
    const vText = img.kind === 'virtual' ? t('l_v_behind', { v: round(img.behind, 1) }) : t('l_v', { v: round(img.v, 1) });
    label('v', vOn && Math.abs(img.v) <= SEE_V, vText, clamp(img.v, -66, 80) * 0.4, RAIL.top + 3, 0, INK.focus, SPOTS.barHigh);
    // the image, if the frame has left it out: a few words, the number is in the panel
    const offBench = img.kind === 'real' ? img.v > SEE_V : img.kind === 'virtual' && img.behind > SEE_BEHIND;
    const tabAt = img.kind === 'real' ? now.box.max.x - 8 : now.box.min.x + 8;
    label(
      'tab',
      calm && !q && free && offBench,
      t(img.kind === 'real' ? 'l_tab_real' : 'l_tab_virtual'),
      tabAt,
      AX + (img.kind === 'real' ? -6 : 6),
      0,
      INK.dark,
      SPOTS.tab,
    );
    // the test's letters on the axis
    for (let i = 0; i < 3; i++) {
      const on = calm && !!q?.points && !q.named;
      label(`pt${i}`, on, on ? t(`tag_${i}`) : '', q?.points?.[i] ?? 0, AX, 0, INK.dark, i % 2 ? SPOTS.up : SPOTS.down);
    }
    anno.update(); // places them now, on this frame's drawing (it asks for no new frame)
  }
  stage.onAfterRender(labels);

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function phase() {
    if (s.busy || s.hold) return 'busy';
    const st = s.stage;
    if (st === 'screen') return s.found ? NEXT_CASE[0] : 'find';
    if (st === 'cases') return NEXT_CASE[s.next] ?? 'formula';
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
    if (i >= 0) return goCase(CASES[i + 1], i + 1);
    return run(ph);
  }
  /** The pencil to the book's case; `next` is the case the action takes after it. */
  function goCase(u, next) {
    s.next = next;
    // only a finished scene may just move its pencil: a step still running is walked to its end, or it would stay half drawn
    if (FREE.has(s.stage) && !s.busy) return pencilTo(u);
    s.cameFrom = s.u;
    s.u = u;
    return run(FREE.has(s.stage) ? s.stage : 'cases');
  }
  function pick(word) {
    if (s.locked) return lockedNudge();
    audio.unlock();
    if (s.busy || s.hold) return; // a step that plays is not cut short, and no second jump is queued
    if (word === 'table') {
      if (s.stage !== 'table') run('table');
      return;
    }
    const i = Number(word.slice(1));
    if (FREE.has(s.stage) && s.u === CASES[i]) return replay();
    goCase(CASES[i], i);
  }
  /** The step just seen, once more, at the same pace. */
  const replayable = () => s.stage !== 'start' && s.stage !== 'formula' && s.stage !== 'table';
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
    // the picture of the step before, at once; then this step plays
    const st = s.stage;
    stopRun();
    settle(STAGES[STAGES.indexOf(st) - 1]);
    run(st);
  }
  const movable = () => !s.locked && !s.busy && FREE.has(s.stage);
  /** The paper moves in its own step, and afterwards while it follows a real image. */
  const screenMovable = () => !s.locked && !s.busy && (s.stage === 'screen' || (FREE.has(s.stage) && V.paper >= 1 && V.screen >= 1));
  /** The pencil stands here; everything follows it at once. */
  function setPencil(x) {
    s.u = pickU(x);
    s.held = false;
    V.u = s.u;
    apply();
    draw();
  }
  function setScreen(x) {
    // close to the place, the paper settles on it: a finger cannot do better than half a centimetre, and a screen that is off is a blur
    const { v } = imageOf(V.u);
    s.sx = Math.abs(x - v) <= SCREEN.sharp ? v : pickS(x);
    if (FREE.has(s.stage)) s.held = true; // it stays where the student put it, until the pencil moves
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
  const steady = { act: '', cap: '' };
  const ACTIONS = {
    busy: ['act_wait', ''],
    points: ['act_points', 1],
    ray1: ['act_ray1', 2],
    ray2: ['act_ray2', 3],
    screen: ['act_screen', 4],
    find: ['act_find', 5],
    c30: ['act_c30', 6],
    c22: ['act_c22', 7],
    c15: ['act_c15', 8],
    c10: ['act_c10', 9],
    formula: ['act_formula', 10],
    table: ['act_table', 11],
    test: ['act_test', ''],
  };
  const cm = (x) => round(x, 1);
  const mText = (m) => round(m, 2);
  function caseOutcome(u) {
    const img = imageOf(u);
    const nature = t(NATURE[zoneOf(u)]);
    const numbers = s.stage !== 'cases';
    const v = img.kind === 'real' ? cm(img.v) : cm(img.behind);
    if (img.kind === 'none') return t(numbers ? 'out_none' : 'out_none_plain', { u: cm(u) }).replace('{nature}', nature);
    const key = `${img.kind === 'real' ? 'out_real' : 'out_virtual'}${numbers ? '' : '_plain'}`;
    return t(key, { u: cm(u), v, m: mText(img.m) }).replace('{nature}', nature);
  }
  function outcomeNow() {
    const st = s.stage;
    if (st === 'points') return t('out_points', { f: F0, r: R0 });
    if (st === 'screen') {
      const on = onScreen(V.s, V.u);
      return t(on.sharp ? 'out_screen_sharp' : 'out_screen');
    }
    if (FREE.has(st)) return caseOutcome(s.u);
    return t(`out_${st}`, { nature: '' });
  }
  const frac = (a, b) => `<span class="pvc-frac"><span>${a}</span><span>${b}</span></span>`;
  const one = () => t.num(1);
  function formulaHtml(u) {
    const img = imageOf(u);
    const minus = img.kind === 'virtual' ? t('rule_formula') : '';
    if (img.kind === 'none')
      return `<span class="pvc-formula">${frac(one(), '<i>u</i>')} + ${frac(one(), '<i>v</i>')} = ${frac(one(), '<i>f</i>')}</span>${t('rule_formula_none')}`;
    const v = img.kind === 'real' ? t.num(cm(img.v)) : `−${t.num(cm(img.behind))}`;
    const line = `<span class="pvc-formula">${frac(one(), '<i>u</i>')} + ${frac(one(), '<i>v</i>')} = ${frac(one(), '<i>f</i>')} : ${frac(one(), t.num(cm(u)))} + ${frac(one(), v)} = ${frac(one(), t.num(F0))}</span>`;
    const m = `<span class="pvc-formula">${t('formula_m', { lp: cm(img.length), l: PENCIL, m: mText(img.m) })}</span>`;
    return `${line}${m}${minus}`;
  }
  const ROW_OF = { far: 1, o: 2, between: 3, focus: 4, inside: 5 };
  function tableHtml(u) {
    const on = ROW_OF[zoneOf(u)];
    const rows = [0, 1, 2, 3, 4, 5, 6]
      .map(
        (i) =>
          `<tr class="${i === on ? 'on' : i === 0 || i === 6 ? 'lim' : ''}"><td>${t(`tb_${i}a`)}</td><td>${t(`tb_${i}b`)}</td><td>${t(`tb_${i}c`)}</td></tr>`,
      )
      .join('');
    return `<table class="lab-table"><thead><tr><th>${t('th_object')}</th><th>${t('th_image')}</th><th>${t('th_kind')}</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  function ruleNow() {
    const st = s.stage;
    if (st === 'formula') return formulaHtml(s.u);
    if (st === 'table') return tableHtml(s.u);
    if (st === 'screen') return t(onScreen(V.s, V.u).sharp ? 'rule_screen_sharp' : 'rule_screen');
    if (st === 'cases') {
      const z = zoneOf(s.u);
      const img = imageOf(s.u);
      if (z === 'between' && img.v > SEE_V) return t('rule_between_far');
      const pole = z === 'between' && secondRay(s.u) === 'pole' ? `<br>${t('rule_pole')}` : '';
      return `${t(`rule_${z}`)}${pole}`;
    }
    return t(`rule_${st}`);
  }
  function wordNow() {
    if (s.stage === 'table') return 'table';
    if (!FREE.has(s.stage) && s.stage !== 'screen') return null;
    const i = CASES.indexOf(s.u);
    return i >= 0 ? `c${i}` : null;
  }
  function panel() {
    if (s.quiz) return;
    sheet.choose(wordNow());
    ui.learn.classList.toggle('lab-tabled', s.stage === 'table');
    ui.learn.classList.toggle('lab-worked', s.stage === 'formula');
    // the words wait for what they describe: while a step runs, the last ones stay
    if (!s.busy) {
      sheet.outcome(outcomeNow());
      sheet.rule(ruleNow());
    }
    const cap = FREE.has(s.stage) ? zoneOf(s.u) : 'far';
    if (steady.cap !== cap) {
      steady.cap = cap;
      caption.innerHTML = t(`cap_${cap}`);
    }
    const ph = phase();
    const nextI = NEXT_CASE.indexOf(ph);
    sheet.next(nextI >= 0 ? `c${nextI + 1}` : ph === 'table' ? 'table' : null);
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
    if (ph === 'ray1' || ph === 'ray2' || NEXT_CASE.includes(ph)) aim.set(V.u, AX + PENCIL + 3, 0);
    else if (ph === 'points') aim.set(F0, AX, 0);
    else if (ph === 'screen') aim.set(imageOf(V.u).v + 6, AX - 8, 0);
    else if (ph === 'find') aim.set(V.s, 13, 0);
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
    label: 'act_points',
    target: () => (o.coach ? target() : null), // a poster or a book page can do without the ring
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
  /** What a finger takes: a handle first (a 52 px target), then the part itself. */
  function pickPart(e) {
    const box = ui.canvasHost.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const near = (g) => (g.on ? Math.hypot(x - g.x, y - g.y) : Infinity);
    const a = near(grips.pencil);
    const b = near(grips.screen);
    if (Math.min(a, b) <= 26) return b < a ? 'screen' : 'pencil';
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
      drag = { id: e.pointerId, what, grab: (what === 'screen' ? V.s : s.u) - (x ?? 0) };
      s.dragging = true;
      capturePointer(ui.canvasHost, e.pointerId);
      e.stopPropagation();
      e.preventDefault();
      draw();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' && !drag) {
      const box = ui.canvasHost.getBoundingClientRect();
      const over = [grips.pencil, grips.screen].some((g) => g.on && Math.hypot(e.clientX - box.left - g.x, e.clientY - box.top - g.y) <= 26);
      ui.canvasHost.style.cursor = over ? 'grab' : '';
    }
    if (!drag || e.pointerId !== drag.id) return;
    const x = railX(e);
    if (x == null) return;
    if (drag.what === 'screen') {
      setScreen(x + drag.grab);
      s.movedScreen = true;
    } else {
      setPencil(x + drag.grab);
      s.movedPencil = true;
    }
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    releasePointer(ui.canvasHost, drag.id);
    if (e && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down = null; // a tap on the pencil stays a tap
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
  const ORDER = ['rule', 'kind', 'number', 'screen', 'swap'];
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
      const points = shuffle([F0, R0, F0 / 2]);
      quizScene({ kind: 'rule', points }, { u: shuffle([40, 45, 50])[0], change: { r1in: 1, showF: 0, showO: 0 } });
      const tag = (x) => t(`tag_${points.indexOf(x)}`);
      return {
        text: t('q_rule'),
        answer: F0,
        wrong: [R0, F0 / 2, 'back'],
        label: (x) => (x === 'back' ? t('c_rule_back') : t('c_point', { x: tag(x) })),
        notes: notesOf([
          [R0, t('n_rule_o')],
          [F0 / 2, t('n_rule_mid')],
          ['back', t('n_rule_back')],
        ]),
        reveal: t('a_rule', { x: tag(F0) }),
        after: { r1out: 1, showF: 1, showO: 1 },
      };
    },
    kind() {
      const u = shuffle([50, 40, 25, 20, 10, 8])[0];
      quizScene({ kind: 'kind' }, { u, frame: 'wide' });
      const z = zoneOf(u);
      const answer = { far: 0, between: 1, inside: 2 }[z];
      const wrong = [0, 1, 2, 3].filter((i) => i !== answer);
      return {
        text: t('q_kind'),
        answer,
        wrong,
        label: (i) => t(`c_kind_${i}`),
        notes: notesOf(wrong.map((i) => [i, t(i === 3 ? 'n_kind_o' : 'n_kind_side')])),
        reveal: t('a_kind', { why: t(`why_${z}`) }).replace('{nature}', t(NATURE[z])),
        after: { ...R1, ...R2, beam: 1, image: 1 },
        frame: 'cases',
      };
    },
    number() {
      const [u, v] = shuffle([
        [60, 20],
        [45, 22.5],
        [20, 60],
      ])[0];
      quizScene({ kind: 'number' }, { u, frame: 'wide' });
      const sum = round((u * F0) / (u + F0), 1);
      const wrong = [u, F0, sum];
      return {
        text: t('q_number', { f: F0 }),
        answer: v,
        wrong,
        label: (x) => t('c_cm', { x }),
        notes: notesOf([
          [u, t('n_number_u')],
          [F0, t('n_number_f')],
          [sum, t('n_number_sign', { one: 1 })],
        ]),
        reveal: t('a_number', { u, f: F0, v, one: 1 }),
        after: { ...R1, ...R2, beam: 1, image: 1, screen: 1, bars: 1 },
        frame: 'cases',
      };
    },
    screen() {
      const u = 10;
      const { behind } = imageOf(u);
      quizScene({ kind: 'screen' }, { u, frame: 'close', change: { r1in: 1, r1out: 1, r2in: 1, r2out: 1 } });
      return {
        text: t('q_screen'),
        answer: 'none',
        wrong: ['v', 'f', 'o'],
        label: (k) => t(`c_screen_${k}`, { v: behind }),
        notes: notesOf([
          ['v', t('n_screen_v', { v: behind })],
          ['f', t('n_screen_spot')],
          ['o', t('n_screen_spot')],
        ]),
        reveal: t('a_screen'),
        after: { r1ext: 1, r2ext: 1, image: 1 },
      };
    },
    swap() {
      // not the pairs of the number question: its answer must not give this one away
      const [a, b] = shuffle([
        [40, 24],
        [37.5, 25],
      ])[0];
      quizScene({ kind: 'swap' }, { u: a, frame: 'cases', change: { ...R1, ...R2, image: 1, beam: 1 } });
      s.quiz.named = false;
      const x = (PENCIL * a) / b;
      const old = (PENCIL * b) / a;
      const wrong = [old, PENCIL, x * 2];
      return {
        text: t('q_swap', { b, l: PENCIL }),
        answer: x,
        wrong,
        label: (k) => t('c_cm', { x: k }),
        notes: notesOf([
          [old, t('n_swap_old')],
          [PENCIL, t('n_swap_same')],
          [x * 2, t('n_swap_big', { l: PENCIL })],
        ]),
        reveal: t('a_swap', { x, a, b }),
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
        // a step cut short by the test goes back to where it was ready to end
        const wasBusy = s.busy;
        stopRun();
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
          if (q.slideTo != null) {
            pencilTo(q.slideTo);
          }
        }
        stage.invalidate();
        const chosen = picked ? q.list[picked.value] : null;
        const why = !correct && picked ? q.notes.get(String(chosen)) : '';
        // the note names what the student chose: alone it could be read as being about the right answer
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
  function home() {
    if (s.locked) return lockedNudge();
    s.u = U.start;
    s.sx = SCREEN.enter;
    s.found = false;
    s.held = false;
    s.movedPencil = false;
    s.movedScreen = false;
    s.cameFrom = null;
    s.next = 0;
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
    const act_ = b.dataset.act;
    if (act_ === 'q-next') quiz.next();
    if (act_ === 'q-again') quiz.start();
    if (act_ === 'home') home();
    if (act_ === 'replay') replay();
    if (act_ === 'fullscreen') {
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
      // the keys move the paper in its own step, the pencil from then on
      if (s.stage === 'screen' && screenMovable()) {
        setScreen(V.s + step);
        s.movedScreen = true;
        emitChange();
        return;
      }
      if (!movable()) return;
      setPencil(s.u + step);
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
    return {
      stage: s.stage,
      u: s.u,
      f: F0,
      r: R0,
      kind: img.kind,
      zone: zoneOf(s.u),
      v: finite ? round(img.v, 3) : null,
      m: finite ? round(img.m, 4) : null,
      imageLength: finite ? round(img.length, 3) : null,
      inverted: img.kind === 'real',
      formulaError: finite ? round(formulaError(s.u, img.v), 9) : null,
      second: secondRay(s.u),
      lawError: round(Math.max(...twoRays(s.u).map((r) => lawError(r))), 2),
      rays: rays.view.keys.filter((k) => k.in >= 1).length,
      image: V.image >= 1,
      screen: V.screen >= 1 && V.paper >= 1 ? { x: round(tracks() ? screenGoal() : V.s, 2), sharp: on.sharp } : null,
      grips: { pencil: grips.pencil.on, screen: grips.screen.on },
      found: s.found,
      busy: s.busy || s.hold,
      frame: s.frame,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
      question: s.quiz ? { kind: s.quiz.kind, right: s.quiz.right ?? null } : null, // the place of the right choice
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
  /** After a jump from outside, the action goes on from the case the pencil is at. */
  function fixNext() {
    const i = CASES.indexOf(s.u);
    if (i >= 0) s.next = i;
  }
  /** At once: what the book or a test asks to see. */
  function jump(name) {
    stopRun();
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
      if (p.screen != null && s.stage === 'screen' && !s.busy) {
        if (animate) glideScreen(Number(p.screen));
        else setScreen(Number(p.screen));
      }
      if (STAGES.includes(p.stage)) {
        if (p.u != null) s.u = pickU(p.u);
        if (p.screen != null) s.sx = pickS(Number(p.screen));
        fixNext();
        if (animate)
          run(p.stage); // the story takes its time: the answer does not wait for it
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
      s.u = U.start;
      s.sx = SCREEN.enter;
      s.found = false;
      s.held = false;
      s.movedPencil = false;
      s.movedScreen = false;
      s.cameFrom = null;
      s.next = 0;
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
