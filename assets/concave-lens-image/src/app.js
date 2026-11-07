// Image in a concave lens (book pp 257–259, topic 9.4.1): the student view. The owner's rule: the whole idea from the 3D alone, and one
// thing per tap. First, from the far side, the pencil seen small and upright through the glass (the lens's own image, exact). Then the
// book's figures one at a time: parallel rays spread as if from F (চিত্র ৯.১৮) and the focal length; rays aimed at F′ leave parallel
// (চিত্র ৯.১৯). Then the pencil XY and the book's three rays, each named on itself (চিত্র ৯.২০): XP then PS as if from F, XO straight
// to T, the ray toward F′ leaving parallel; their lines meet at X′, where the virtual image grows up from Y′. From the eye's side the
// glass shows exactly that X′Y′. Then the pencil goes through the row's distances (10, 15, 30, 60 cm), a live graph of where the image
// goes and how tall it is, and a table: wherever the pencil is, the image stays between O and F, virtual, upright and smaller.
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
import { createSetting, FRAMES, RAIL } from './bench.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { createLoupe } from '@shared/student/loupe.js';
import { createRays } from './rays.js';
import {
  candidates,
  clamp,
  convergeBundle,
  F0,
  fraction,
  imageOf,
  LENS,
  miss,
  PENCIL,
  round,
  shuffle,
  spreadBundle,
  threeRays,
  U,
} from './reading.js';

export const DEFAULTS = {
  stage: 'see', // one of STAGES
  u: U.start, // where the pencil stands, cm from the lens
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring and the words on the handle
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

/** The story, in order: one new thing per tap. */
export const STAGES = ['see', 'par', 'focus', 'conv', 'r2', 'r1', 'r3', 'image', 'eye', 'cases', 'graph', 'table'];
/** The row of words: the pencil's distances (cm, with v = 6, 7.5, 10, 12 and m = 3/5, 1/2, 1/3, 1/5) and the table. */
export const CASES = [10, 15, 30, 60];
const NEXT_CASE = ['c0', 'c1', 'c2', 'c3'];
/** From here on the student moves the pencil freely. */
const FREE = new Set(['cases', 'graph', 'table']);

const REST = {
  on: 0, // the drawing over the view (none from the eye's side)
  axis: 0,
  lens: 0,
  showO: 0,
  showF: 0,
  showF2: 0,
  fBar: 0,
  bin: 0, // চিত্র ৯.১৮: in, out, extended back to F
  bout: 0,
  bext: 0,
  gin: 0, // চিত্র ৯.১৯: in, aimed at F′, out parallel
  gext: 0,
  gout: 0,
  pin: 0, // (ii) XP, PS, back to F
  pout: 0,
  pext: 0,
  cin: 0, // (i) XO, on to T
  cout: 0,
  xdot: 0,
  qin: 0, // (iii) toward F′, parallel, back to X′
  qout: 0,
  qext: 0,
  ghost: 0,
  perp: 0,
  eye: 0,
  size: 0,
  drop: 0,
};
const DRAW = { on: 1, axis: 1, lens: 1, showO: 1 };
const RII = { ...DRAW, showF: 1, pin: 1, pout: 1, pext: 1 };
const RI = { ...RII, cin: 1, cout: 1, xdot: 1 };
/** What each stage shows. */
const POSE = {
  see: { ...REST },
  par: { ...REST, ...DRAW, bin: 1, bout: 1 },
  focus: { ...REST, ...DRAW, bin: 1, bout: 1, bext: 1, showF: 1, fBar: 1 },
  conv: { ...REST, ...DRAW, showF: 1, showF2: 1, gin: 1, gext: 1, gout: 1 },
  r2: { ...REST, ...RII },
  r1: { ...REST, ...RI },
  r3: { ...REST, ...RI, showF2: 1, qin: 1, qout: 1, qext: 1 },
  image: { ...REST, ...RI, showF2: 1, qin: 1, qout: 1, qext: 1, ghost: 1, perp: 1, eye: 1 },
  eye: { ...REST },
  cases: { ...REST, ...RI, ghost: 1, perp: 1 },
  graph: { ...REST, ...RI, ghost: 1, perp: 1 },
  table: { ...REST, ...RI, ghost: 1, perp: 1 },
};
const FRAME_OF = {
  see: 'eye',
  par: 'lens',
  focus: 'lens',
  conv: 'lens',
  r2: 'rays',
  r1: 'rays',
  r3: 'rays',
  image: 'rays',
  eye: 'eye',
  cases: 'cases',
  graph: 'cases',
  table: 'cases',
};
/** The ray each step is about (0 the parallel ray, 1 the one to the centre, 2 the one toward F′), for the step-back of the others. */
const NOW = { r2: 0, r1: 1, r3: 2 };
/** The order things come in, and how long each takes, s: slow enough to follow (about a second per segment). */
const UPS = [
  ['on', 0.05],
  ['axis', 0.3],
  ['lens', 0.4],
  ['showO', 0.4],
  ['bin', 1.4],
  ['bout', 1.4],
  ['bext', 1.6],
  ['showF', 0.5],
  ['fBar', 0.8],
  ['showF2', 0.5],
  ['gin', 1.4],
  ['gext', 1],
  ['gout', 1.4],
  ['pin', 1.4],
  ['pout', 1.3],
  ['pext', 1.6],
  ['cin', 1.4],
  ['cout', 1.2],
  ['xdot', 0.5],
  ['qin', 1.4],
  ['qout', 1.2],
  ['qext', 1.4],
  ['ghost', 2],
  ['perp', 0.6],
  ['eye', 0.5],
  ['size', 0.6],
  ['drop', 0.5],
];
const ALL_UPS = UPS.map(([k]) => k);
const RAY_KEYS = new Set(['bin', 'bout', 'bext', 'gin', 'gext', 'gout', 'pin', 'pout', 'pext', 'cin', 'cout', 'qin', 'qout', 'qext']);
/** The hold on each result, s, and what each step starts from when it is played again. */
const HOLD = 1;
const PREV = { par: 'see', focus: 'par', conv: 'focus', r2: 'conv', r1: 'r2', r3: 'r1', image: 'r3', eye: 'image' };
/** Steps with the pencil and its rays: there it can be moved. */
const PENCIL_STAGES = new Set(['r2', 'r1', 'r3', 'image', 'cases', 'graph', 'table']);

const MARGINS = { top: 12, bottom: 10, side: 8 };
const INK = { dark: '#2b3a4a', ray: '#8a4f00', focus: '#5a37d0' };
const AX = RAIL.axis;
/** The pencil's handle and its dashed track run this far below the axis, cm. */
const TRACK_Y = -2;
/** Where the textbook's eye sits on the far side, cm from the lens. */
const EYE_X = 12;
const EYE_Y = 4.5;
const BUNDLES = { spread: spreadBundle(), converge: convergeBundle() };
/** The ray question's tags, each on its own side of its ray's end so that close ends do not crowd. */
const TAG_SPOTS = {
  spread: [
    { dx: 0, dy: -20 },
    { dx: -16, dy: -18 },
  ],
  straight: [
    { dx: 20, dy: 0 },
    { dx: 18, dy: -14 },
  ],
  gather: [
    { dx: 0, dy: 20 },
    { dx: 16, dy: 18 },
  ],
  back: [
    { dx: -18, dy: -12 },
    { dx: 0, dy: -20 },
  ],
};

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
  // what the numbers of the row are: a small caption before them (the sister figure's)
  const exCap = document.createElement('span');
  exCap.className = 'lab-ex-cap';
  exCap.textContent = t('ex_cap');
  ui.$('.pvc-examples').prepend(exCap);
  CASES.forEach((u, i) => {
    const word = ui.$(`[data-example="c${i}"] .pvc-ex-word`);
    if (word) word.textContent = t.num(u);
  });
  const replayBtn = ui.$('[data-act="replay"]');
  // the line before the action: what the next tap will show (on the first screen, a few calm words that set the scene)
  const lead = document.createElement('p');
  lead.className = 'lab-lead';
  ui.$('.pvc-act-row').before(lead);
  // the graph of the image's distance and height against the pencil's distance
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
  // a small image (under 40 px on the view, the pencil far off on a phone) gets the kit's magnifier over it
  const loupe = createLoupe({ stage, layer: ui.lensLayer, clearColor: 0x123d7a, formatZoom: (z) => `${t.num(z)}×` });
  const loupeAt = new THREE.Vector3();
  loupe.setTarget(() => {
    const img = imageOf(V.u);
    return loupeAt.set(img.x, AX + img.height / 2, 0);
  });
  const LOUPE_PX = 40;
  function placeLoupe() {
    const px = imagePx();
    // in the image step only on a phone-width view: there the rays' crossing at X′ is the point, and it shows wider
    const want =
      !s.quiz &&
      (FREE.has(s.stage) || (s.stage === 'image' && stage.width < 500)) &&
      V.ghost >= 1 &&
      camK >= 1 &&
      px > 0 &&
      px < LOUPE_PX &&
      !s.userMovedCamera;
    if (want !== loupe.visible) loupe.setVisible(want);
    if (want) {
      const z = Math.round(clamp(90 / px, 2, 4) * 2) / 2;
      if (Math.abs(loupe.zoom - z) > 0.01) loupe.setZoom(z);
    }
    rays.view.hole = loupe.visible ? { x: loupe.center.x, y: loupe.center.y, r: loupe.diameter / 2 - 2 } : null;
  }

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const pickU = (u) => clamp(Number.isFinite(Number(u)) ? Math.round(Number(u)) : U.start, U.min, U.max);
  const start = STAGES.includes(o.stage) ? o.stage : 'see';
  const s = {
    stage: start,
    u: pickU(o.u), // where the student put the pencil
    next: 0, // the case the action takes next
    cameFrom: U.start, // where the pencil stood before this case
    dragged: false, // the student has moved the pencil: the handle calms down
    busy: false,
    dragging: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    frame: FRAME_OF[start],
  };
  // what is drawn now; the numbers move, the state above does not
  const V = { ...POSE.see, u: s.u };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── what the 3D shows, from V ──────────────────────────────────────────────────────────────────────────
  let tracedU = -1;
  function apply() {
    const rv = rays.view;
    if (V.u !== tracedU) {
      tracedU = V.u;
      rv.rays = threeRays(V.u);
    }
    const img = imageOf(V.u);
    rv.on = V.on;
    rv.axis = V.axis;
    rv.lens = V.lens;
    rv.showO = V.showO;
    rv.showF = V.showF;
    rv.showF2 = V.showF2;
    rv.fBar = V.fBar;
    const conv = V.gin > 0;
    rv.bundle =
      conv || V.bin > 0
        ? { rays: conv ? BUNDLES.converge : BUNDLES.spread, in: conv ? V.gin : V.bin, out: conv ? V.gout : V.bout, ext: conv ? V.gext : V.bext }
        : null;
    const k = rv.keys;
    k[0].in = V.pin;
    k[0].out = V.pout;
    k[0].ext = V.pext;
    k[1].in = V.cin;
    k[1].out = V.cout;
    k[1].ext = 0;
    k[2].in = V.qin;
    k[2].out = V.qout;
    k[2].ext = V.qext;
    rv.now = NOW[s.stage] ?? -1;
    rv.imageAt = { x: img.x, y: img.height };
    rv.imageK = Math.max(V.xdot, V.ghost >= 1 ? 1 : 0);
    rv.perp = V.perp;
    rv.drop = V.drop;
    rv.eye = V.eye;
    rv.eyeX = EYE_X;
    rv.eyeY = EYE_Y;
    note.hidden = V.on <= 0 || V.pin + V.cin + V.qin + V.bin + V.gin <= 0 || stage.height < 300; // the smallest phone keeps its corner for labels
    setting.placePencil(V.u);
    setting.placeImage(img.x, img.m, V.ghost);
  }

  const RUNS = ['step', 'camera', 'pencil'];
  function stopRun() {
    ++token;
    for (const k of RUNS) tweener.cancel(k);
    camK = 1;
    s.busy = false;
  }
  /** Everything in its final place at once. */
  function settle(name) {
    Object.assign(V, POSE[name]);
    V.u = s.u;
    s.frame = FRAME_OF[name];
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
    for (const k of ALL_UPS) if (V[k] > goal[k]) down[k] = goal[k];
    const downKeys = Object.keys(down);
    if (downKeys.length && !(await move(alive, downKeys, { ...V, ...down }, 0.6))) return false;

    if (s.frame !== frame || V.u !== goal.u) {
      const flown = fly(frame, frame === 'eye' || s.frame === 'eye' ? 2 : 1.6);
      if (V.u !== goal.u && !(await move(alive, ['u'], goal, 1.6, ease.inOutCubic))) return false;
      await flown;
      if (!alive()) return false;
    }

    const ups = UPS.filter(([k]) => goal[k] > V[k]);
    const rayUps = ups.filter(([k]) => RAY_KEYS.has(k));
    if (rayUps.length > 4) {
      // a jump over several rays: they come together
      if (
        !(await move(
          alive,
          ups.map(([k]) => k),
          goal,
          1.2,
        ))
      )
        return false;
    } else {
      for (const [k, time] of ups) {
        if (!(await move(alive, [k], goal, time, RAY_KEYS.has(k) ? ease.linear : ease.inOutSine))) return false;
      }
    }
    // a hold on the result: nothing is offered until it has been looked at
    await tweener.animate({ key: 'step', duration: HOLD }).finished;
    if (!alive()) return false;
    s.busy = false;
    audio.tick();
    draw();
    emitChange();
    return true;
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function poseNow() {
    const f = FRAMES[s.frame]({ u: V.u, aspect: stage.width / stage.height, high: s.stage === 'conv' && !s.quiz });
    dirFrom(f.az, f.el, camDir);
    return fitPose({ box: f.box, dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGINS });
  }
  function applyCamera() {
    if (s.userMovedCamera) return;
    const pz = poseNow();
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, pz.position, k);
      controls.target.lerpVectors(camFrom.target, pz.target, k);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
    }
    controls.enabled = !s.dragging;
    controls.update();
  }
  /** The camera goes to a frame. Its promise settles when it arrives (or a finger takes over). */
  function fly(frame, duration = 1.6) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      rotate.home();
      s.view = 'front';
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    s.frame = frame;
    camK = 0;
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camK = k;
        stage.invalidate();
      },
      onComplete: () => {
        camK = 1;
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    rotate.home();
    syncUI();
    if (animate) fly(s.frame, 1.5);
    else camK = 1;
    stage.invalidate();
  }
  /** The student has really turned the view. */
  function turnedByHand() {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
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
  // the stage also calls this when it lowers its resolution mid-turn: a view the student has turned stays theirs
  stage.onResize(() => {
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    // what the glass shows: the lens's own image of what stands behind it, whenever the eye is on its far side
    setting.lookThrough(camera);
    // the image is drawn over the glass from the pencil's side; from the far side the glass itself shows it
    setting.placeImage(imageOf(V.u).x, imageOf(V.u).m, camera.position.x > 0.5 ? 0 : V.ghost);
  });

  // ── labels on the picture: few and short, each pinned to what it names ───────────────────────────────────
  let action = null;
  const movable = () => !s.locked && !s.busy && PENCIL_STAGES.has(s.stage) && s.frame !== 'eye';
  // the pencil's drag handle: on its rod, always there while it can be moved, and its range along the rail
  const onRod = new THREE.Vector3();
  const pencilHandle = createDragHandle(stage, {
    point: () => onRod.set(-V.u, AX + TRACK_Y, 0),
    axis: 'x',
    direction: new THREE.Vector3(-1, 0, 0),
    track: { from: new THREE.Vector3(-U.min, AX + TRACK_Y, 0), to: new THREE.Vector3(-U.max, AX + TRACK_Y, 0) },
    label: o.coach ? t('l_drag') : '',
    aria: t('aria_drag_pencil'),
    pulse: Boolean(o.coach),
    when: () => movable() && camK >= 1 && !s.quiz && pencilInView(),
  });
  // how to use, in the panel: the rotate pill, the সামনে button and the pencil's disc, drawn as on the view; the pencil's item keeps its
  // place unseen in the steps without it, so the panel does not jump
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'drag', axis: 'x', text: t('howto_pencil'), handle: pencilHandle, when: () => !s.locked && PENCIL_STAGES.has(s.stage) },
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
      () => rays.boxes(),
      () => action?.ringBox(),
      () => (loupe.visible ? loupeBox() : OFF),
    ],
  });
  const OFF = { left: -20, top: -20, right: -10, bottom: -10 };
  const lb = { left: 0, top: 0, right: 0, bottom: 0 };
  function underLoupe(x, y) {
    const p = rays.toScreen(x, y - AX);
    const c = loupe.center;
    return Math.hypot(p.x - c.x, p.y - c.y) < loupe.diameter / 2 + 10;
  }
  function loupeBox() {
    const c = loupe.center;
    const r = loupe.diameter / 2 + 4;
    lb.left = c.x - r;
    lb.right = c.x + r;
    lb.top = c.y - r;
    lb.bottom = c.y + r + 14;
    return lb;
  }
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
      { dx: 0, dy: 24 },
      { dx: 22, dy: 26 },
      { dx: -22, dy: 26 },
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
      { dx: 24, dy: -8 },
      { dx: 26, dy: 12 },
      { dx: 14, dy: -24 },
      { dx: 14, dy: 24 },
    ],
    x: [
      { dx: 0, dy: -24 },
      { dx: -18, dy: -24 },
      { dx: -26, dy: 6 },
      { dx: 18, dy: -24 },
      { dx: 22, dy: 8 },
    ],
    // the words of a ray, beside it
    above: [
      { dx: 0, dy: -36 },
      { dx: 30, dy: -40 },
      { dx: -30, dy: -40 },
      { dx: 50, dy: -56 },
      { dx: -50, dy: -56 },
      { dx: 0, dy: -64 },
      { dx: 70, dy: -24 },
      { dx: -70, dy: -24 },
    ],
    below: [
      { dx: 0, dy: 40 },
      { dx: 30, dy: 44 },
      { dx: -30, dy: 44 },
      { dx: 50, dy: 60 },
      { dx: -50, dy: 60 },
      { dx: 0, dy: 70 },
      { dx: 70, dy: 26 },
    ],
    r3: [
      { dx: 0, dy: -28 },
      { dx: -30, dy: -30 },
      { dx: 0, dy: 26 },
      { dx: -60, dy: 26 },
      { dx: -30, dy: -48 },
    ],
    // what the image is, beside it
    props: [
      { dx: 0, dy: 64 },
      { dx: -20, dy: 74 },
      { dx: 20, dy: 74 },
      { dx: -60, dy: -50 },
      { dx: -70, dy: 40 },
    ],
    // X′: straight up first (the wedge between the line from F and the ray through O), then below
    xi: [
      { dx: 0, dy: -22 },
      { dx: -6, dy: -26 },
      { dx: 0, dy: 24 },
      { dx: -26, dy: 6 },
      { dx: 26, dy: -4 },
      { dx: -30, dy: -18 },
      { dx: 30, dy: 18 },
      { dx: -22, dy: 30 },
    ],
    axis: [
      { dx: 0, dy: 22 },
      { dx: -50, dy: 22 },
      { dx: -100, dy: 22 },
      { dx: -150, dy: 14 },
    ],
    xiLow: [
      { dx: 0, dy: 24 },
      { dx: -8, dy: 28 },
      { dx: 0, dy: -22 },
    ],
    pq: [
      { dx: -16, dy: 20 },
      { dx: -26, dy: 14 },
    ],
    p: [
      { dx: -14, dy: -20 },
      { dx: 20, dy: 14 },
      { dx: 24, dy: -8 },
    ],
    fname: [
      { dx: -40, dy: -84 },
      { dx: -40, dy: 84 },
      { dx: -40, dy: -130 },
      { dx: -40, dy: 130 },
      { dx: -62, dy: 13 },
      { dx: -40, dy: -170 },
    ],
    eye: [
      { dx: 0, dy: -24 },
      { dx: 0, dy: -30 },
    ],
    imageFar: [
      { dx: 0, dy: 96 },
      { dx: -70, dy: 96 },
      { dx: 70, dy: 96 },
      { dx: 0, dy: -96 },
      { dx: -120, dy: 40 },
      { dx: 110, dy: 60 },
      { dx: -110, dy: -70 },
      { dx: 110, dy: -70 },
    ],
    badge: [
      { dx: 0, dy: -16 },
      { dx: 0, dy: 16 },
      { dx: 14, dy: -14 },
    ],
    tab: [
      { dx: 8, dy: 0 },
      { dx: 8, dy: 22 },
      { dx: 8, dy: -22 },
    ],
    near: [
      { dx: 0, dy: 0 },
      { dx: 0, dy: -16 },
      { dx: 0, dy: 16 },
    ],
  };
  /** The handle calms down once the pencil has been moved by hand. */
  let handleUsed = false;
  function placeHandle() {
    if (s.dragged === handleUsed) return;
    handleUsed = s.dragged;
    if (handleUsed) pencilHandle.markUsed();
    else pencilHandle.rearm();
  }
  const big = (x) => `<span class="lab-letter">${x}</span>`;
  /** Is the pencil inside the view now? */
  function pencilInView() {
    const p = rays.toScreen(-V.u, PENCIL / 2);
    return !p.behind && p.x > 12 && p.x < stage.width - 12;
  }
  /** The size the image has on the view, px. */
  function imagePx() {
    const img = imageOf(V.u);
    const a = rays.toScreen(img.x, 0);
    const ay = a.y;
    const b = rays.toScreen(img.x, img.height);
    return Math.abs(b.y - ay);
  }
  function labels() {
    const q = s.quiz;
    const calm = !s.busy && camK >= 1 && !s.userMovedCamera;
    const st = s.stage;
    const named = !q || q.named;
    const img = imageOf(V.u);
    const rv = rays.view;
    const drawn = V.on >= 1;
    const pencilSeen = pencilInView();
    const eyeView = s.frame === 'eye';
    const open = (x, y) => !loupe.visible || !underLoupe(x, y);

    // from the eye's side: the lens and what is seen in it
    const fromEye = calm && !q && eyeView;
    label('lens', fromEye, t('l_lens'), 0, AX + LENS.half + 0.8, 0, INK.dark, SPOTS.up);
    label('object', fromEye && st === 'see', t('l_object'), -V.u, AX + PENCIL + 0.2, 0, INK.dark, SPOTS.up, true);
    label('seen', fromEye, st === 'eye' ? `${t('l_xi')}${t('l_yi')}` : t('l_seen'), img.x, AX + img.height * 0.5, 0, INK.dark, SPOTS.left);

    // the bundles: the axis, O, F, what the light does
    const lensStep = calm && !q && (st === 'par' || st === 'focus' || st === 'conv');
    label('axis', lensStep && st === 'par', t('l_axis'), 14, AX, 0, INK.dark, SPOTS.axis, true);
    label('spread', lensStep && st === 'par' && V.bout >= 1, t('l_spread'), 18, AX + 5.6 + (18 * 5.6) / F0, 0, INK.ray, SPOTS.up, true);
    label('fbar', calm && !q && st === 'focus', t('l_fbar', { f: F0 }), -F0 / 2, AX - LENS.half - 2.2, 0, INK.focus, SPOTS.down);
    label('parallel', lensStep && st === 'conv' && V.gout >= 1, t('l_parallel'), 22, AX + 5.6, 0, INK.ray, SPOTS.up, true);

    // the pencil's letters, and P, S, T where the book writes them
    const onRays = calm && drawn && PENCIL_STAGES.has(st) && pencilSeen;
    label('x', onRays, big(t('l_x')), -V.u, AX + PENCIL, 0, INK.dark, SPOTS.x);
    label('y', onRays && !FREE.has(st), big(t('l_y')), -V.u, AX, 0, INK.dark, SPOTS.down, true);
    const R = rv.rays;
    const tell = calm && !q && drawn;
    const steps = tell && !FREE.has(st);
    label(
      'p',
      ((steps && !FREE.has(st)) || (calm && !!q?.showP)) && V.pin >= 1 && R[0],
      big(t('l_p')),
      0,
      AX + (R[0]?.hit.y ?? 0),
      0,
      INK.dark,
      q && !q.named ? SPOTS.pq : SPOTS.p,
      true,
    );
    label('s', steps && V.pout >= 1 && R[0] && st === 'r2', big(t('l_s')), R[0]?.end.x ?? 0, AX + (R[0]?.end.y ?? 0), 0, INK.ray, SPOTS.up, true);
    label('t', steps && V.cout >= 1 && R[1] && st === 'r1', big(t('l_t')), R[1]?.end.x ?? 0, AX + (R[1]?.end.y ?? 0), 0, INK.ray, SPOTS.down, true);
    // O, F and F′: named where they are new, then big letters
    const axisOn = calm && drawn && V.axis >= 1;
    const oName = !q && st === 'r1';
    label('o', axisOn && V.showO >= 1 && named && PENCIL_STAGES.has(st), oName ? t('l_o_name') : big(t('l_o')), 0, AX, 0, INK.dark, SPOTS.down);
    const fName = !q && st === 'focus';
    label(
      'f',
      axisOn && V.showF >= 1 && (named || q?.showF) && open(-F0, AX),
      fName ? t('l_f_name') : big(t('l_f')),
      -F0,
      AX,
      0,
      INK.focus,
      fName ? SPOTS.fname : SPOTS.down,
    );
    label('f2', axisOn && V.showF2 >= 1 && named, big(t('l_f2')), F0, AX, 0, INK.focus, st === 'conv' ? SPOTS.below : SPOTS.down);
    // the step's ray, named on itself in the book's words
    const RAY_KEY = ['pout', 'cout', 'qout'];
    const NAME = ['l_r_parallel', 'l_r_centre', 'l_r_focal'];
    for (let i = 0; i < 3; i++) {
      const ray = R[i];
      const here = tell && ray && V[RAY_KEY[i]] >= 1 && NOW[st] === i;
      // (ii) on its level incoming leg XP, (i) under its outgoing leg, (iii) over its parallel outgoing leg, where the others are far
      const from = i === 0 ? ray?.start : ray?.hit;
      const to = i === 0 ? ray?.hit : ray?.end;
      const k = i === 0 ? 0.45 : i === 1 ? 0.55 : 0.5;
      const mx = ray ? from.x + (to.x - from.x) * k : 0;
      const my = ray ? from.y + (to.y - from.y) * k : 0;
      label(`r${i}`, here, t(NAME[i]), mx, AX + my, 0, INK.ray, i === 1 ? SPOTS.below : i === 2 ? SPOTS.r3 : SPOTS.above, true);
    }
    // the image: where, and what it is, beside it
    const imageOn = calm && drawn && (V.xdot >= 1 || V.ghost >= 1);
    label(
      'xi',
      imageOn && (named || !!q?.showXi) && open(img.x, AX + img.height),
      big(t('l_xi')),
      img.x,
      AX + img.height,
      0,
      INK.dark,
      st === 'r3' ? SPOTS.xiLow : SPOTS.xi,
    );
    label('yi', imageOn && named && V.perp >= 1 && !FREE.has(st) && open(img.x, AX), big(t('l_yi')), img.x, AX, 0, INK.dark, SPOTS.down, true);
    const chip = imageOn && !q && V.ghost >= 1 && (st === 'image' || FREE.has(st));
    label('image', chip, t('p_image'), img.x, AX, 0, INK.dark, loupe.visible ? SPOTS.imageFar : SPOTS.props);
    label('eye', calm && !q && V.eye >= 1, t('l_eye'), EYE_X, AX + EYE_Y, 0, INK.dark, SPOTS.eye, true);
    // the test's letters
    for (let i = 0; i < 4; i++) {
      const on = calm && !!q?.points && !q.named;
      const pt = q?.points?.[i];
      label(`pt${i}`, on, on ? big(t(`tag_${i}`)) : '', pt?.x ?? 0, pt?.y ?? AX, pt?.z ?? 0, INK.dark, pt?.spots ?? (i % 2 ? SPOTS.up : SPOTS.down));
    }
    anno.update(); // places them now, on this frame's drawing (it asks for no new frame)
  }
  stage.onAfterRender(() => {
    placeHandle();
    placeLoupe();
    labels();
  });

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function phase() {
    if (s.busy) return 'busy';
    const st = s.stage;
    if (st === 'eye') return NEXT_CASE[0];
    if (st === 'cases') return NEXT_CASE[s.next] ?? 'graph';
    if (st === 'table') return 'test';
    return STAGES[STAGES.indexOf(st) + 1];
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    const ph = phase();
    if (ph === 'busy') return;
    if (ph === 'test') return quiz.start();
    const i = NEXT_CASE.indexOf(ph);
    if (i >= 0) return goCase(CASES[i], i + 1);
    return run(ph);
  }
  /** The pencil to a distance of the row; `next` is the case the action takes after it. */
  function goCase(u, next) {
    s.next = Math.max(s.next, next);
    if (s.stage === 'cases' && !s.busy) return pencilTo(u);
    s.cameFrom = s.u;
    s.u = u;
    return run('cases');
  }
  function pick(word) {
    if (s.locked) return lockedNudge();
    audio.unlock();
    if (s.busy) return; // a tap while a step plays is ignored: nothing queues up
    if (word === 'table') {
      if (s.stage !== 'table') run('table');
      return;
    }
    const i = Number(word.slice(1));
    if (!(i >= 0 && i < CASES.length)) return;
    if (FREE.has(s.stage) && s.u === CASES[i]) return replay();
    if (FREE.has(s.stage) && s.stage !== 'cases') {
      // in the graph and the table a word only moves the pencil
      s.next = Math.max(s.next, i + 1);
      return pencilTo(CASES[i]);
    }
    goCase(CASES[i], i + 1);
  }
  const replayable = () => s.stage !== 'see' && s.stage !== 'graph' && s.stage !== 'table';
  /** The step that has just ended, slowly, from where it began. */
  async function replay() {
    if (s.locked) return lockedNudge();
    if (s.busy || !replayable()) return;
    audio.unlock();
    if (s.stage === 'cases') {
      // the pencil's last move again
      const to = s.u;
      const from = s.cameFrom ?? U.start;
      if (from === to) return;
      const done = await pencilTo(from, false);
      if (done) await pencilTo(to);
      return;
    }
    const name = s.stage;
    stopRun();
    clearLabels();
    s.stage = PREV[name];
    settle(PREV[name]);
    return run(name);
  }
  /** The pencil stands here; everything follows it at once. */
  function setPencil(x) {
    s.u = clamp(Math.round(x), U.min, U.max); // whole centimetres: the numbers stay short
    V.u = s.u;
    apply();
    draw();
  }
  /** The pencil glides to x; its promise says whether it got there. */
  async function pencilTo(x, remember = true) {
    stopRun();
    const my = token;
    const from = V.u;
    if (remember) s.cameFrom = s.u;
    s.busy = true;
    draw();
    await tweener.animate({
      key: 'pencil',
      duration: Math.max(1.6, Math.min(2.5, Math.abs(x - from) / 16)),
      ease: ease.inOutSine,
      onUpdate: (k) => {
        if (my !== token) return;
        V.u = from + (x - from) * k;
        apply();
        if (s.stage === 'graph') graph.draw(round(V.u, 1));
        stage.invalidate();
      },
    }).finished;
    if (my !== token) return false;
    setPencil(x);
    await tweener.animate({ key: 'pencil', duration: HOLD }).finished;
    if (my !== token) return false;
    s.busy = false;
    audio.tick();
    draw();
    emitChange();
    return true;
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '', cap: '', lead: '' };
  const ACTIONS = {
    busy: ['act_wait', ''],
    par: ['act_par', 1],
    focus: ['act_focus', 2],
    conv: ['act_conv', 3],
    r2: ['act_r2', 4],
    r1: ['act_r1', 5],
    r3: ['act_r3', 6],
    image: ['act_image', 7],
    eye: ['act_eye', 8],
    c0: ['act_c0', 9],
    c1: ['act_c1', 10],
    c2: ['act_c2', 11],
    c3: ['act_c3', 12],
    graph: ['act_graph', 13],
    table: ['act_table', 14],
    test: ['act_test', ''],
  };
  function mText(m) {
    const f = fraction(m);
    return f ? `${t.num(f.n)}/${t.num(f.d)}` : t.num(round(m, 2));
  }
  function tableHtml(u) {
    const row = (a, b, c, on) => `<tr class="${on ? 'on' : ''}"><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
    const rows = CASES.map((x) => {
      const img = imageOf(x);
      return row(`${t.num(x)} cm${x === F0 ? ` (${t('tb_at_f')})` : ''}`, `${t.num(round(img.behind, 1))} cm`, mText(img.m), x === u);
    }).join('');
    const far = row(t('tb_far'), `${t.num(F0)} cm (F)`, t.num(0), false);
    return `<table class="lab-table"><thead><tr><th>${t('th_u')}</th><th>${t('th_v')}</th><th>${t('th_m')}</th></tr></thead><tbody>${rows}${far}</tbody></table>`;
  }
  function outcomeNow() {
    const st = s.stage;
    const img = imageOf(s.u);
    if (FREE.has(st)) return t('out_case', { nature: t('n_image'), u: s.u, v: round(img.behind, 1), m: mText(img.m) });
    if (st === 'see') return ''; // the first screen: only the calm words above the action
    return t(`out_${st}`);
  }
  function ruleNow() {
    const st = s.stage;
    if (st === 'see') return '';
    if (st === 'table') return tableHtml(s.u);
    if (st === 'graph') return t('rule_graph');
    if (st === 'cases') {
      const i = CASES.indexOf(s.u);
      return t(i >= 0 ? `rule_c${i}` : 'rule_case');
    }
    return t(`rule_${st}`, { f: F0 });
  }
  function wordNow() {
    if (s.stage === 'table') return 'table';
    if (!FREE.has(s.stage)) return null;
    const i = CASES.indexOf(s.u);
    return i >= 0 ? `c${i}` : null;
  }
  function panel() {
    if (s.quiz) return;
    sheet.choose(wordNow());
    ui.learn.classList.toggle('lab-tabled', s.stage === 'table');
    ui.learn.classList.toggle('lab-graphed', s.stage === 'graph');
    ui.learn.classList.toggle('lab-free', FREE.has(s.stage));
    // the words wait for what they describe: while a step runs, the last ones stay
    if (!s.busy) {
      sheet.outcome(outcomeNow());
      sheet.rule(ruleNow());
      const calm = s.stage === 'see';
      const ph = phase();
      const html = calm
        ? `<span class="lab-long">${t('intro')}</span><span class="lab-short">${t('intro_short')}</span>`
        : s.stage === 'table'
          ? t('tb_all')
          : t(`lead_${ACTIONS[ph] ? ph : 'test'}`);
      if (steady.lead !== html) {
        steady.lead = html;
        lead.innerHTML = html;
        lead.classList.toggle('pvc-note', calm);
        ui.learn.classList.toggle('lab-calm', calm);
      }
      ui.learn.dataset.stage = s.stage;
    }
    if (FREE.has(s.stage)) graph.draw(round(V.u, 1));
    // the book's four properties, where a tall panel has room for them
    const cap = FREE.has(s.stage) ? 'move' : '';
    if (steady.cap !== cap) {
      steady.cap = cap;
      caption.innerHTML = cap ? t(`cap_${cap}`) : '';
      caption.hidden = !cap;
    }
    const ph = phase();
    const nextI = NEXT_CASE.indexOf(ph);
    sheet.next(nextI >= 0 ? `c${nextI}` : ph === 'table' ? 'table' : null);
    if (replayBtn) replayBtn.hidden = !replayable();
    const [word, step] = ACTIONS[ph] ?? ACTIONS.test;
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled });
    }
  }
  function draw() {
    panel();
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  const aim = new THREE.Vector3();
  function target() {
    if (s.locked || s.busy || camK < 1 || s.dragging) return null;
    const ph = phase();
    const img = imageOf(V.u);
    if (ph === 'par') aim.set(0, AX + LENS.half - 2.5, 0);
    else if (ph === 'focus') aim.set(-8, AX + 3, 0);
    else if (ph === 'conv') aim.set(-12, AX + 7, 0);
    else if (ph === 'r2' || ph === 'r1' || ph === 'r3') {
      if (!pencilInView()) return null;
      aim.set(-V.u, AX + PENCIL + 2.4, 0);
    } else if (ph === 'image') aim.set(img.x, AX + img.height + 3.4, 0);
    else if (ph === 'eye') aim.set(4, AX + LENS.half - 2.5, 0);
    else if (NEXT_CASE.includes(ph)) {
      if (!pencilInView()) return null;
      aim.set(-V.u, AX + PENCIL + 2.4, 0);
    } else return null; // moving the pencil is a drag: its handle shows it; the rest is the button's
    setting.tapTarget.position.copy(aim);
    return aim;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_par',
    target: () => (o.coach ? target() : null), // a poster or a book page can do without the ring
    radius: 20,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // a tap on the part is the same action; a finger on the pencil moves it along the rail
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  let drag = null;
  const toNdc = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
  };
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      down = { x: e.clientX, y: e.clientY, at: performance.now() };
      if (!movable() || (e.pointerType === 'mouse' && e.button !== 0)) return;
      toNdc(e);
      ray.setFromCamera(ndc, camera);
      const box = ui.canvasHost.getBoundingClientRect();
      const onGrip = pencilHandle.hit(e.clientX - box.left, e.clientY - box.top);
      if (!onGrip && !ray.intersectObject(setting.hit, false).length) return;
      // the rail on the screen: how many pixels to a centimetre, and which way (the pencil's u grows to the left)
      const a = rays.toScreen(0, 0);
      const ax = a.x;
      const ay = a.y;
      const b = rays.toScreen(-10, 0);
      const dx = b.x - ax;
      const dy = b.y - ay;
      const l = Math.hypot(dx, dy) || 1;
      const perCm = l / 10;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: s.u, ux: dx / l, uy: dy / l, perCm };
      s.dragging = true;
      capturePointer(ui.canvasHost, e.pointerId);
      e.stopPropagation();
      e.preventDefault();
      emit('dragstart', { u: s.u });
      draw();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const along = (e.clientX - drag.x) * drag.ux + (e.clientY - drag.y) * drag.uy;
    setPencil(drag.from + along / drag.perCm);
    s.dragged = true;
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    releasePointer(ui.canvasHost, drag.id);
    if (e && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down = null; // a tap on the pencil stays a tap
    drag = null;
    s.dragging = false;
    emit('dragend', { u: s.u });
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
  const ORDER = ['ray', 'kind', 'where', 'far', 'read'];
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  /** The scene of a question: a stage set at once, with what it may show. */
  function quizScene(q, name, { u = U.start, frame = FRAME_OF[name], change = {} } = {}) {
    stopRun();
    s.u = u;
    s.stage = name;
    settle(name);
    Object.assign(V, change);
    rays.view.picks = null;
    apply();
    s.frame = frame;
    s.quiz = { ...q, named: false };
    clearLabels();
    stage.invalidate();
  }
  const NO_RAYS = { pin: 0, pout: 0, pext: 0, cin: 0, cout: 0, xdot: 0, qin: 0, qout: 0, qext: 0, ghost: 0, perp: 0 };
  const Q = {
    ray() {
      const u = shuffle([20, 30, 45])[0];
      const dirs = candidates(PENCIL);
      const order = shuffle(Object.keys(dirs));
      quizScene({ kind: 'ray', showF: true, showP: true }, 'r2', { u, change: { pout: 0, pext: 0, showF: 1 } });
      const from = { x: 0, y: PENCIL };
      rays.view.picks = order.map((k) => ({ from, dir: dirs[k], length: k === 'back' ? 9 : 13 }));
      s.quiz.points = order.map((k) => ({
        x: dirs[k].x * (k === 'back' ? 9 : 13),
        y: AX + PENCIL + dirs[k].y * (k === 'back' ? 9 : 13),
        z: 0,
        spots: TAG_SPOTS[k],
      }));
      const tag = (k) => t(`tag_${order.indexOf(k)}`);
      return {
        text: t('q_ray'),
        answer: 'spread',
        wrong: ['gather', 'straight', 'back'],
        label: (k) => t('c_ray', { x: tag(k) }),
        notes: notesOf([
          ['gather', t('n_ray_gather')],
          ['straight', t('n_ray_straight')],
          ['back', t('n_ray_back')],
        ]),
        reveal: t('a_ray', { x: tag('spread') }),
        after: { pext: 1 },
        clearPicks: (k) => order.filter((x) => x !== 'spread' && x !== k),
      };
    },
    kind() {
      const u = shuffle([30, 40])[0]; // the real pencil stands beside the glass, to compare with
      quizScene({ kind: 'kind' }, 'eye', { u });
      return {
        text: t('q_kind'),
        answer: 'right',
        wrong: ['flip', 'big', 'flipbig'],
        label: (k) => t(`c_kind_${k}`),
        notes: notesOf([
          ['flip', t('n_kind_flip')],
          ['big', t('n_kind_big')],
          ['flipbig', t('n_kind_big')],
        ]),
        reveal: t('a_kind'),
      };
    },
    where() {
      const u = shuffle([10, 20, 45])[0];
      const img = imageOf(u);
      const beyond = -(F0 + Math.max(4, Math.min(8, (u - F0) / 2)));
      const spots = { right: img.x, f: -F0, other: img.behind, beyond: u > F0 + 8 ? beyond : -(u + F0) / 2 - 2 };
      if (u <= F0 + 8) spots.beyond = -Math.max(F0 + 4, u + 4);
      const order = shuffle(Object.keys(spots));
      quizScene({ kind: 'where', points: order.map((k) => ({ x: spots[k], y: AX, z: 0 })) }, 'r2', {
        u,
        frame: 'rays',
        change: { ...NO_RAYS, showF: 1 },
      });
      const tag = (k) => t(`tag_${order.indexOf(k)}`);
      return {
        text: t('q_where'),
        answer: 'right',
        wrong: ['f', 'other', 'beyond'],
        label: (k) => t('c_point', { x: tag(k) }),
        notes: notesOf([
          ['f', t('n_where_f')],
          ['other', t('n_where_other')],
          ['beyond', t('n_where_beyond')],
        ]),
        reveal: t('a_where', { x: tag('right') }),
        after: { pin: 1, pout: 1, pext: 1, cin: 1, cout: 1, xdot: 1, ghost: 1, perp: 1, showF: 1 },
      };
    },
    far() {
      quizScene({ kind: 'far' }, 'cases', { u: 15 });
      return {
        text: t('q_far'),
        answer: 'right',
        wrong: ['lens', 'big', 'real'],
        label: (k) => t(`c_far_${k}`),
        notes: notesOf([
          ['lens', t('n_far_lens')],
          ['big', t('n_far_big')],
          ['real', t('n_far_real')],
        ]),
        reveal: t('a_far'),
        slideTo: U.max,
      };
    },
    read() {
      const u = shuffle([10, 30, 60])[0];
      const v = round(imageOf(u).behind, 1);
      quizScene({ kind: 'read', showF: true, showXi: true }, 'cases', {
        u,
        frame: 'read',
        change: { ...NO_RAYS, ghost: 1, perp: 1, drop: 1, size: 0, showF: 1 },
      });
      const wrong = [F0, u, round(u - v, 1)];
      return {
        text: t('q_read'),
        answer: v,
        wrong,
        label: (x) => t('c_cm', { x }),
        notes: notesOf([
          [F0, t('n_read_f')],
          [u, t('n_read_u')],
          [round(u - v, 1), t('n_read_gap')],
        ]),
        reveal: t('a_read', { v }),
      };
    },
  };
  const saved = { stage: 'see', u: U.start };
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        // a step cut short by the test goes back to where it was ready to end
        const wasBusy = s.busy;
        if (drag) endDrag();
        stopRun();
        s.mode = 'quiz';
        s.locked = true;
        saved.stage = s.stage;
        saved.u = s.u;
        if (wasBusy) settle(s.stage);
        clearLabels();
        syncUI();
      },
      leave() {
        stopRun();
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        rays.view.picks = null;
        s.stage = saved.stage;
        s.u = saved.u;
        clearLabels();
        const was = s.frame;
        settle(s.stage);
        const frame = s.frame;
        s.frame = was;
        syncUI();
        fly(frame, 1.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = Q[ORDER[i]]();
        qCurrent = q;
        say(q.text);
        const done = await fly(s.frame, 1.5);
        if (!alive()) return null;
        if (!done) camK = 1;
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
          if (q.kind === undefined && rays.view.picks && q.answer === 'spread') {
            // the ray question: only the right path stays, drawn as the book draws it
            rays.view.picks = null;
            Object.assign(V, { pout: 1, pext: 1 });
            apply();
          }
          if (q.slideTo != null) pencilTo(q.slideTo);
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
    s.next = 0;
    return run('see');
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  let lastTap = { what: '', at: 0 };
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    const what = b.dataset.act || b.dataset.example || '';
    const now = performance.now();
    if (what && what === lastTap.what && now - lastTap.at < 120) return;
    lastTap = { what, at: now };
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) pick(b.dataset.example);
    const act_ = b.dataset.act;
    if (act_ === 'q-next') quiz.next();
    if (act_ === 'q-again') quiz.start();
    if (act_ === 'replay') replay();
    if (act_ === 'home') home();
    if (act_ === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    // → moves the pencil to the right, toward the lens (u smaller); ← away
    const step = { ArrowRight: -1, ArrowLeft: 1 }[e.key];
    if (step) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (!movable()) return;
      setPencil(s.u + step);
      s.dragged = true;
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
    return {
      stage: s.stage,
      u: s.u,
      f: -F0,
      v: round(img.v, 3),
      m: round(img.m, 4),
      imageHeight: round(img.height, 3),
      miss: round(miss(s.u), 6),
      rays: [V.pin, V.cin, V.qin].filter((k) => k >= 1).length,
      extended: [V.pext, V.qext].filter((k) => k >= 1).length,
      bundle: V.gin >= 1 ? 'converge' : V.bin >= 1 ? 'spread' : null,
      ghost: V.ghost >= 1,
      throughLens: camera.position.x > 0.5,
      camera: camera.position.toArray().map((x) => round(x, 1)),
      handle: { shown: pencilHandle.visible, used: s.dragged },
      imagePx: Math.round(imagePx()),
      next: s.next,
      magnifier: loupe.visible,
      busy: s.busy,
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
  /** At once: what the book or a test asks to see. */
  function jump(name) {
    stopRun();
    s.stage = name;
    clearLabels();
    settle(name);
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  jump(start);
  syncUI();
  setView(s.view, { animate: false });
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
      if (p.view) setView(p.view, { animate });
      if (STAGES.includes(p.stage)) {
        if (p.u != null) s.u = pickU(p.u);
        if (FREE.has(p.stage)) s.next = Math.max(s.next, CASES.indexOf(s.u) + 1);
        if (animate)
          run(p.stage); // the story takes its time: the answer does not wait for it
        else jump(p.stage);
      } else if (p.u != null && movable()) {
        setPencil(pickU(p.u));
      }
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.u = U.start;
      s.next = 0;
      s.dragged = false;
      jump('see');
      setView('front', { animate: false });
      camK = 1;
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
