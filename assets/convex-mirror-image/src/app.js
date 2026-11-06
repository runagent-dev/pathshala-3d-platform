// Image in a convex mirror (book pp 225–227 and 235, topics 8.5.1 and 8.8.2): the student view. The owner's rule: the whole idea from
// the 3D alone, and one thing per tap. First the pencil and, on the silver beside it, its small upright picture, traced for every
// pixel. Then the book's rays, one at a time, each named on itself, traced on the exact sphere; they meet behind the mirror at X′, where
// the virtual image grows up from Y′ with what it is written beside it. The student moves the pencil with the camera close on the
// image; then the book's formula. Last the rear-view mirror: from one eye, the same mirror plane and then convex.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { CAP, createSetting, EYE, FRAMES, RAIL } from './bench.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  AWAY_X,
  clamp,
  EYE_X,
  F0,
  FLAT_R,
  fieldOf,
  fraction,
  imageOf,
  MIRROR,
  miss,
  PENCIL,
  POST,
  postsSeen,
  R0,
  ROW_X,
  ROW_Z,
  round,
  sag,
  seenAt,
  shuffle,
  threeRays,
  U,
} from './reading.js';

export const DEFAULTS = {
  stage: 'see', // one of STAGES
  u: U.start, // where the pencil stands, cm from the mirror
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring and the hand
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

/** The story, in order: one new thing per tap. */
export const STAGES = ['see', 'par', 'ext', 'cen', 'foc', 'image', 'move', 'formula', 'plane', 'eye', 'wide'];
/** The words in the panel, and the stage each one starts at. */
const WORDS = { see: 'see', rays: 'par', move: 'move', rear: 'plane' };
const WORD_OF = {
  see: 'see',
  par: 'rays',
  ext: 'rays',
  cen: 'rays',
  foc: 'rays',
  image: 'rays',
  move: 'move',
  formula: 'move',
  plane: 'rear',
  eye: 'rear',
  wide: 'rear',
};

const REST = {
  r1in: 0,
  r1out: 0,
  r1ext: 0,
  r2in: 0,
  r2out: 0,
  r2ext: 0,
  r3in: 0,
  r3out: 0,
  r3ext: 0,
  showO: 0,
  showF: 1,
  axis: 1,
  ghost: 0,
  size: 0,
  bars: 0,
  row: 0,
  curve: 1, // 1 convex, 0 plane
  cone: 0,
  flat: 0,
  eye: 0,
  tie: 0,
};
const R2 = { r2in: 1, r2out: 1 };
const R2E = { ...R2, r2ext: 1 };
const R1 = { r1in: 1, r1out: 1, r1ext: 1, showO: 1 };
const R3 = { r3in: 1, r3out: 1, r3ext: 1 };
const REAR_POSE = { ...REST, axis: 0, showF: 0, row: 1 };
/** What each stage shows. */
const POSE = {
  see: { ...REST, tie: 1 },
  par: { ...REST, ...R2 },
  ext: { ...REST, ...R2E },
  cen: { ...REST, ...R2E, ...R1 },
  foc: { ...REST, ...R2E, ...R1, ...R3 },
  image: { ...REST, ...R2E, ...R1, ...R3, ghost: 1 },
  move: { ...REST, ...R2E, ...R1, ghost: 1, size: 1 },
  formula: { ...REST, ...R2E, ...R1, ghost: 1, size: 1 },
  plane: { ...REAR_POSE, curve: 0 },
  eye: { ...REAR_POSE },
  wide: { ...REAR_POSE, cone: 1, flat: 1, eye: 1 },
};
const REAR = new Set(['plane', 'eye', 'wide']);
const ZOOMED = new Set(['move', 'formula']);
const FRAME_OF = {
  see: 'see',
  par: 'near',
  ext: 'near',
  cen: 'rays',
  foc: 'rays',
  image: 'near',
  move: 'zoom',
  formula: 'zoom',
  plane: 'eye',
  eye: 'eye',
  wide: 'wide',
};
/** The ray each step is about, for the step-back of the others. */
const NOW = { par: 1, ext: 1, cen: 0, foc: 2 };
/** The order things come in, and how long each takes, s: slow enough to follow. */
const UPS = [
  ['r2in', 1.6],
  ['r2out', 1.6],
  ['r2ext', 1.8],
  ['showO', 0.5],
  ['r1in', 1.6],
  ['r1out', 1.5],
  ['r1ext', 1.6],
  ['r3in', 1.6],
  ['r3out', 1.5],
  ['r3ext', 1.6],
  ['ghost', 2],
  ['size', 0.6],
  ['bars', 0.6],
  ['flat', 1],
  ['cone', 1.2],
  ['eye', 0.5],
  ['tie', 0.6],
];
const ALL_UPS = UPS.map(([k]) => k);
/** The hold on each result, s, and what each step starts from when it is played again. */
const HOLD = 1;
const PREV = {
  par: 'see',
  ext: 'par',
  cen: 'ext',
  foc: 'cen',
  image: 'foc',
  move: 'image',
  formula: 'move',
  plane: 'formula',
  eye: 'plane',
  wide: 'eye',
};

const MARGINS = { top: 12, bottom: 10, side: 8 };
const INK = { dark: '#2b3a4a', ray: '#8a4f00', focus: '#5a37d0' };
const AX = RAIL.axis;
/** The bars of u and v lie this high above the rail's top. */
const BAR_Y = RAIL.top + 1.6;
/** The pencil's handle and its dashed track run this far below the axis, cm. */
const TRACK_Y = -2;
/** The stage's own title: the book's term for what is being shown. */
const TITLE_OF = {
  see: 'see',
  par: 'r2',
  ext: 'r2',
  cen: 'r1',
  foc: 'r3',
  image: 'image',
  move: 'move',
  formula: 'formula',
  plane: 'rear',
  eye: 'rear',
  wide: 'rear',
};

const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};
const radiusOf = (curve) => 1 / (curve / R0 + (1 - curve) / FLAT_R);

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
      examples: { label: 'ex_label', items: Object.keys(WORDS).map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'replay', label: 'act_replay', icon: ICONS.play }],
      tight: true,
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  // the line before the action: what the next tap will show (on the first screen, a few calm words that set the scene)
  const lead = document.createElement('p');
  lead.className = 'lab-lead';
  ui.$('.pvc-act-row').before(lead);
  const caption = document.createElement('p');
  caption.className = 'lab-cap';
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'lab-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);
  const title = document.createElement('div');
  title.className = 'lab-title';
  ui.stage.appendChild(title);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 22, near: 10, far: 1600, environmentIntensity: 0.8 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  const setting = createSetting({ stage, shadow: Boolean(o.shadow), t });
  const rays = createRays({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const pickU = (u) => clamp(Number.isFinite(Number(u)) ? Number(u) : U.start, U.min, U.max);
  const start = STAGES.includes(o.stage) ? o.stage : 'see';
  const s = {
    stage: start,
    u: pickU(o.u), // where the student put the pencil
    sawFar: false,
    sawNear: false,
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
  const uGoal = (name) => (REAR.has(name) ? AWAY_X : s.u);

  // ── what the 3D shows, from V ──────────────────────────────────────────────────────────────────────────
  let tracedU = -1;
  function apply() {
    const rv = rays.view;
    const r = radiusOf(V.curve);
    if (V.u !== tracedU) {
      tracedU = V.u;
      rv.rays = threeRays(V.u);
    }
    const img = imageOf(V.u);
    rv.r = r;
    rv.keys[0].in = V.r1in;
    rv.keys[0].out = V.r1out;
    rv.keys[0].ext = V.r1ext;
    rv.keys[1].in = V.r2in;
    rv.keys[1].out = V.r2out;
    rv.keys[1].ext = V.r2ext;
    rv.keys[2].in = V.r3in;
    rv.keys[2].out = V.r3out;
    rv.keys[2].ext = V.r3ext;
    rv.now = NOW[s.stage] ?? -1;
    rv.axis = V.axis;
    rv.showF = V.showF;
    rv.showO = V.showO;
    rv.imageAt = { x: img.v, y: img.height, m: img.m };
    rv.imageK = V.ghost >= 1 ? 1 : 0;
    rv.ghostK = V.ghost;
    rv.size = V.size;
    rv.bars = V.bars;
    rv.u = V.u;
    rv.cone = V.cone;
    rv.coneFlat = V.flat;
    rv.eye = V.eye;
    note.hidden = V.r1in + V.r2in + V.r3in <= 0;
    setting.placeMirror(r);
    // once X′Y′ is drawn it is the one image on the view: from the side the silver would show it a second time, at its rim
    setting.placePencil(V.u, V.ghost <= 0 && V.row <= 0, V.row <= 0.01);
    setting.placeRow(V.row);
    setting.placeImage(img.v, img.m, V.ghost);
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
    V.u = uGoal(name);
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

  /** One step of the story, and any jump between steps: what must go goes first, then the mirror and the pencils, then the light. */
  async function run(name) {
    stopRun();
    const my = token;
    const alive = () => my === token;
    const goal = { ...POSE[name], u: uGoal(name) };
    s.busy = true;
    s.stage = name;
    clearLabels();
    draw();
    const frame = FRAME_OF[name];

    const down = {};
    for (const k of [...ALL_UPS, 'axis']) if (V[k] > goal[k]) down[k] = goal[k];
    const downKeys = Object.keys(down);
    if (downKeys.length && !(await move(alive, downKeys, { ...V, ...down }, 0.6))) return false;

    const rearing = V.u !== goal.u || V.row !== goal.row || V.curve !== goal.curve;
    if (s.frame !== frame) {
      const flown = fly(frame, rearing ? 1.8 : 1.5);
      if (!rearing) {
        await flown;
        if (!alive()) return false;
      }
    }
    if (rearing) {
      const bench = ['u', 'row'].filter((k) => V[k] !== goal[k]);
      if (bench.length && !(await move(alive, bench, goal, 1.6, ease.inOutCubic))) return false;
      if (V.curve !== goal.curve && !(await move(alive, ['curve'], goal, 1.8, ease.inOutCubic))) return false;
    }
    if (goal.axis > V.axis && !(await move(alive, ['axis'], goal, 0.3))) return false;

    const ups = UPS.filter(([k]) => goal[k] > V[k]);
    const rayUps = ups.filter(([k]) => k.startsWith('r'));
    if (rayUps.length > 3) {
      // a jump over several rays: they come together
      if (
        !(await move(
          alive,
          ups.map(([k]) => k),
          goal,
          1,
        ))
      )
        return false;
    } else {
      for (const [k, time] of ups) {
        if (!(await move(alive, [k], goal, time, k.startsWith('r') ? ease.linear : ease.inOutSine))) return false;
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
    if (s.frame === 'eye') return EYE;
    const f = FRAMES[s.frame](V.u, stage.width / stage.height);
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
    controls.enabled = s.frame !== 'eye' && s.frame !== 'zoom' && !s.dragging; // the eye's view does not turn; in the zoom a finger moves the pencil
    controls.update();
  }
  /** The camera goes to a frame. Its promise settles when it arrives (or a finger takes over). */
  function fly(frame, duration = 1.5) {
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
    when: () => s.frame !== 'eye' && s.frame !== 'zoom',
    onTurn: turnedByHand,
  });
  // the stage also calls this when it lowers its resolution mid-turn: a view the student has turned stays theirs
  stage.onResize(() => {
    draw();
  });
  /** Where the eye of this view sees the pencil on the silver. */
  const seen = { x: 0, y: 0, z: 0 };
  function findSeen() {
    const rv = rays.view;
    const on = V.tie > 0 && !s.quiz && s.stage === 'see' && V.u <= CAP.see;
    rv.tie = on && camK >= 1 && !s.busy ? V.tie : 0;
    if (!on) return;
    const eye = camera.position;
    const point = { x: V.u, y: PENCIL * 0.72, z: 0 };
    Object.assign(seen, seenAt({ x: eye.x, y: eye.y - AX, z: eye.z }, point));
    rv.tieFrom = point;
    rv.tieTo = seen;
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    findSeen();
  });

  // ── labels on the picture: few and short, each pinned to what it names ───────────────────────────────────
  let action = null;
  // the pencil's drag handle: on its rod, always there while it can be moved, and its range along the rail
  const onRod = new THREE.Vector3();
  const pencilHandle = createDragHandle(stage, {
    point: () => onRod.set(V.u, RAIL.axis + TRACK_Y, 0),
    axis: 'x',
    direction: new THREE.Vector3(1, 0, 0),
    track: { from: new THREE.Vector3(U.min, RAIL.axis + TRACK_Y, 0), to: new THREE.Vector3(U.max, RAIL.axis + TRACK_Y, 0) },
    label: o.coach ? t('l_drag') : '',
    aria: t('aria_drag_pencil'),
    pulse: Boolean(o.coach),
    when: () => movable() && V.row <= 0 && V.axis >= 1 && camK >= 1 && !s.quiz,
  });
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, rotate.el, note, title, () => pencilHandle.box(), ui.$('.pvc-panel-toggle'), () => rays.boxes(), () => action?.ringBox()],
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
    x: [
      { dx: 0, dy: -24 },
      { dx: -18, dy: -24 },
      { dx: 18, dy: -20 },
      { dx: -26, dy: 10 },
      { dx: 22, dy: 8 },
      { dx: 14, dy: 22 },
    ],
    mirror: [
      { dx: -8, dy: -34 },
      { dx: 18, dy: -32 },
      { dx: -34, dy: -24 },
      { dx: 34, dy: -24 },
    ],
    // the words of a ray, beside it: above the fan for (ii), below it for (i) and (iii)
    above: [
      { dx: -40, dy: -40 },
      { dx: -40, dy: -60 },
      { dx: 4, dy: -40 },
      { dx: 30, dy: -46 },
      { dx: -30, dy: -46 },
      { dx: 50, dy: -60 },
      { dx: -50, dy: -60 },
      { dx: 4, dy: -74 },
      { dx: -80, dy: -30 },
      { dx: -80, dy: -60 },
    ],
    below: [
      { dx: -16, dy: 92 },
      { dx: 6, dy: 92 },
      { dx: -16, dy: 112 },
      { dx: 6, dy: 112 },
      { dx: 6, dy: 72 },
      { dx: -120, dy: 130 },
      { dx: 60, dy: 136 },
    ],
    // what the image is, beside it
    props: [
      { dx: 6, dy: 58 },
      { dx: 6, dy: 78 },
      { dx: -6, dy: 58 },
      { dx: -40, dy: -56 },
      { dx: -60, dy: 42 },
    ],
    size: [
      { dx: 6, dy: 58 },
      { dx: 6, dy: 78 },
      { dx: -6, dy: 58 },
      { dx: -40, dy: -44 },
    ],
    badgeUp: [
      { dx: 0, dy: -16 },
      { dx: -14, dy: -16 },
    ],
    badgeDown: [
      { dx: 0, dy: 16 },
      { dx: 14, dy: 16 },
    ],
    badgeMid: [{ dx: 16, dy: -13 }],
    tab: [
      { dx: -6, dy: 0 },
      { dx: -6, dy: 22 },
      { dx: -6, dy: -22 },
      { dx: -6, dy: 44 },
    ],
    tabL: [
      { dx: 8, dy: 0 },
      { dx: 8, dy: 22 },
      { dx: 8, dy: -22 },
    ],
    near: [
      { dx: 0, dy: 0 },
      { dx: 0, dy: -16 },
      { dx: 0, dy: 16 },
    ],
    far: [
      { dx: -30, dy: -60 },
      { dx: -44, dy: -44 },
      { dx: 0, dy: 40 },
      { dx: -34, dy: 40 },
      { dx: 34, dy: 40 },
      { dx: -44, dy: -40 },
    ],
    edge: [
      { dx: 0, dy: -14 },
      { dx: 0, dy: 14 },
      { dx: -30, dy: -14 },
      { dx: 30, dy: 14 },
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
  const big = (x) => `<span class="lab-big">${x}</span>`;
  const camPoint = new THREE.Vector3();
  /** The x on the rail's plane (z = 0) seen at a pixel of the view, at a height in the view's own terms. */
  function edgeAt(px, ndcY) {
    camPoint.set((px / stage.width) * 2 - 1, ndcY, 0.5).unproject(camera);
    const k = -camera.position.z / (camPoint.z - camera.position.z);
    return camera.position.x + (camPoint.x - camera.position.x) * k;
  }
  /** The size the image has on the view, px. */
  const pa2 = new THREE.Vector3();
  const pb2 = new THREE.Vector3();
  function imagePx() {
    const img = imageOf(V.u);
    pa2.set(img.v, AX, 0).project(camera);
    pb2.set(img.v, AX + img.height, 0).project(camera);
    return (Math.abs(pb2.y - pa2.y) / 2) * stage.height;
  }
  function labels() {
    const q = s.quiz;
    const calm = !s.busy && camK >= 1 && !s.userMovedCamera;
    const st = s.stage;
    const named = !q || q.named;
    const r = radiusOf(V.curve);
    const rim = -sag(r, MIRROR.half);
    const img = imageOf(V.u);
    const rv = rays.view;
    const onRays = V.axis >= 1 && !REAR.has(st);
    // past this the frame lets the pencil go, and the tab says where it is
    const cap = CAP[s.frame] ?? Number.POSITIVE_INFINITY;
    const inFrame = V.u <= cap;

    // the first picture: two labels, and an arrow from the pencil to its picture on the silver
    const first = calm && !q && st === 'see';
    label('object', first && inFrame, t('l_object'), V.u, AX + PENCIL + 0.2, 0, INK.dark, SPOTS.up);
    label('seen', first && V.tie > 0 && V.u <= CAP.see, t('l_seen'), seen.x, AX + seen.y, seen.z, INK.dark, SPOTS.far);
    label('mirror', calm && !q && st === 'wide', t('l_mirror_any'), rim, AX + MIRROR.half + 1.2, 0, INK.dark, SPOTS.mirror);
    // the pencil's letters
    const letters = calm && V.axis >= 1 && st !== 'see' && !REAR.has(st) && inFrame;
    label('x', letters, big(t('l_x')), V.u, AX + PENCIL, 0, INK.dark, SPOTS.x);
    label('y', letters, big(t('l_y')), V.u, AX, 0, INK.dark, SPOTS.down, true);
    // O, F and P, always, in big letters; O from an edge tab when the view is too close for it
    const onAxis = calm && V.axis >= 1 && onRays;
    const oIn = s.frame === 'rays' || s.frame === 'bench';
    label('o', onAxis && V.showO >= 1 && named && oIn, big(t('l_o_short')), -r, AX, 0, INK.dark, SPOTS.down);
    label('f', onAxis && V.showF >= 1 && (named || q?.showF), big(t('l_f_short')), -r / 2, AX, 0, INK.focus, SPOTS.down);
    label('p', onAxis && (named || q?.showP), big(t('l_p_short')), 0, AX, 0, INK.dark, SPOTS.down);
    label('oTab', onAxis && V.showO >= 1 && named && !oIn && !q, t('l_o_tab'), edgeAt(14, 0.1), AX + 4.6, 0, INK.dark, SPOTS.tabL, true);
    // the step's ray, named on itself in the book's words; the others keep a small badge
    const R = rv.rays;
    for (let i = 0; i < 3; i++) {
      const ray = R[i];
      const key = `r${i + 1}`;
      const here = calm && !q && NOW[st] === i && V[`${key}out`] >= 1 && st !== 'ext';
      const px = i === 1 ? ray.hit.x + (ray.end.x - ray.hit.x) * 0.5 : ray.hit.x + (ray.start.x - ray.hit.x) * 0.4;
      const py = i === 1 ? ray.hit.y + (ray.end.y - ray.hit.y) * 0.5 : ray.hit.y + (ray.start.y - ray.hit.y) * 0.4;
      label(`r${i}`, here, t(`l_${key}`), px, AX + py, 0, INK.ray, i === 1 ? SPOTS.above : SPOTS.below);
      const tag = calm && !q && !here && V[`${key}out`] >= 1 && !ZOOMED.has(st);
      // near the mirror, where the three have parted
      const reach = Math.hypot(ray.start.x - ray.hit.x, ray.start.y - ray.hit.y);
      const along = (i === 0 ? Math.min(4.5, reach * 0.32) : i === 1 ? 6.5 : 3.5) * (V.u > 30 ? 0.4 : 1);
      const bx = ray.hit.x + ray.out.x * along;
      const by = ray.hit.y + ray.out.y * along;
      label(
        `b${i}`,
        tag,
        t(`l_b${i + 1}`),
        bx,
        AX + by,
        0,
        INK.ray,
        i === 0 ? SPOTS.badgeMid : i === 1 ? SPOTS.badgeUp : SPOTS.badgeDown,
        V.u < 7 || V.u > 30,
      );
    }
    label('ext', calm && !q && st === 'ext', t('l_ext'), -8, AX + 3.4, 0, INK.ray, SPOTS.above);
    // the image: where, and what it is, beside it
    const imageOn = calm && V.ghost >= 1;
    label('xi', imageOn, big(t('l_xi')), img.v, AX + img.height, 0, INK.dark, SPOTS.left);
    label('yi', imageOn && !ZOOMED.has(st) && F0 - img.behind > 3, big(t('l_yi')), img.v, AX, 0, INK.dark, SPOTS.down, true);
    label('props', imageOn && !q && st === 'image', t('l_props'), img.v, AX, 0, INK.dark, SPOTS.props);
    label('size', imageOn && ZOOMED.has(st), t('l_size', { m: mText(img.m) }), img.v, AX, 0, INK.dark, SPOTS.size);
    // the distances, on the rail
    const barsOn = calm && V.bars >= 1;
    label('u', barsOn, t('l_u', { u: round(V.u, 1) }), V.u * 0.55, BAR_Y, 0, INK.dark, SPOTS.near);
    // the pencil, if the frame has left it out
    label(
      'tab',
      calm && !q && !inFrame,
      t('l_tab', { u: round(V.u, 1) }),
      inFrame ? 0 : edgeAt(stage.width - 44, 0),
      AX + 1.6,
      0,
      INK.dark,
      SPOTS.tab,
    );
    // over the bench: each count at the edge of its own view
    const top = calm && V.cone + V.flat > 0;
    label('eye', calm && V.eye >= 1, t('l_eye'), EYE_X, AX, 0, INK.dark, SPOTS.up);
    const fFlat = fieldOf(FLAT_R);
    const fConv = fieldOf(R0);
    label(
      'coneFlat',
      top && V.flat >= 1,
      t('l_cone_flat', { n: postsSeen(FLAT_R).length }),
      fFlat.rim.x + fFlat.out.x * 34,
      AX,
      fFlat.rim.y + fFlat.out.y * 34,
      '#1864ab',
      SPOTS.edge,
    );
    label(
      'cone',
      top && V.cone >= 1,
      t('l_cone', { n: postsSeen(R0).length }),
      fConv.rim.x + fConv.out.x * 36,
      AX,
      fConv.rim.y + fConv.out.y * 36,
      INK.ray,
      SPOTS.edge,
    );
    // the test's letters
    for (let i = 0; i < 4; i++) {
      const on = calm && !!q?.points && !q.named;
      const pt = q?.points?.[i];
      label(`pt${i}`, on, on ? big(t(`tag_${i}`)) : '', pt?.x ?? 0, pt?.y ?? AX, pt?.z ?? 0, INK.dark, i % 2 ? SPOTS.up : SPOTS.down);
    }
    anno.update(); // places them now, on this frame's drawing (it asks for no new frame)
  }
  stage.onAfterRender(() => {
    placeHandle();
    labels();
  });

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function phase() {
    if (s.busy) return 'busy';
    if (s.stage === 'move') {
      if (!s.sawFar) return 'far';
      if (!s.sawNear) return 'near';
      return 'formula';
    }
    if (s.stage === 'wide') return 'test';
    return STAGES[STAGES.indexOf(s.stage) + 1];
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
    if (ph === 'far') return pencilTo(60);
    if (ph === 'near') return pencilTo(6);
    return run(ph);
  }
  function pick(word) {
    if (s.locked) return lockedNudge();
    if (!(word in WORDS) || s.busy) return; // a tap while a step plays is ignored: nothing queues up
    audio.unlock();
    if (WORD_OF[s.stage] === word) return replay(); // its own word plays the step again
    if (word === 'see') return home();
    run(WORDS[word]);
  }
  /** The step that has just ended, slowly, from where it began. */
  function replay() {
    if (s.locked) return lockedNudge();
    if (s.busy) return;
    audio.unlock();
    const name = s.stage;
    stopRun();
    clearLabels();
    if (name === 'move') {
      s.sawFar = false;
      s.sawNear = false;
    }
    if (PREV[name]) {
      s.stage = PREV[name];
      settle(PREV[name]);
    } else {
      V.tie = 0;
      apply();
    }
    return run(name);
  }
  const movable = () => !s.locked && !s.busy && !REAR.has(s.stage);
  /** The pencil stands here; everything follows it at once. */
  function setPencil(x) {
    s.u = clamp(Math.round(x), U.min, U.max); // whole centimetres: the numbers stay short
    V.u = s.u;
    if (ZOOMED.has(s.stage)) {
      if (s.u >= 40) s.sawFar = true;
      if (s.sawFar && s.u <= 12) s.sawNear = true;
    }
    apply();
    draw();
  }
  async function pencilTo(x) {
    const my = token;
    const from = V.u;
    s.busy = true;
    draw();
    await tweener.animate({
      key: 'pencil',
      duration: 2.5,
      ease: ease.inOutSine,
      onUpdate: (k) => {
        if (my !== token) return;
        V.u = from + (x - from) * k;
        apply();
        stage.invalidate();
      },
    }).finished;
    if (my !== token) return;
    setPencil(x);
    await tweener.animate({ key: 'pencil', duration: HOLD }).finished;
    if (my !== token) return;
    s.busy = false;
    draw();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '', cap: '', title: '', lead: '' };
  const ACTIONS = {
    busy: ['act_wait', ''],
    par: ['act_par', 1],
    ext: ['act_ext', 2],
    cen: ['act_cen', 3],
    foc: ['act_foc', 4],
    image: ['act_image', 5],
    move: ['act_move', 6],
    far: ['act_far', ''],
    near: ['act_near', ''],
    formula: ['act_formula', 7],
    plane: ['act_plane', 8],
    eye: ['act_eye', ''],
    wide: ['act_wide', ''],
    test: ['act_test', ''],
  };
  function mText(m) {
    const f = fraction(m);
    return f ? `${f.n}/${f.d}` : round(m, 2);
  }
  const frac = (a, b) => `<span class="pvc-frac"><span>${a}</span><span>${b}</span></span>`;
  function outcomeNow() {
    const st = s.stage;
    const img = imageOf(s.u);
    if (ZOOMED.has(st)) return t('out_move', { u: round(s.u, 1), v: round(img.behind, 1), m: mText(img.m) });
    if (st === 'plane') return t('out_plane', { n: postsSeen(FLAT_R).length });
    if (st === 'eye') return t('out_eye', { n: postsSeen(R0).length });
    if (st === 'wide') return t('out_wide', { a: postsSeen(FLAT_R).length, b: postsSeen(R0).length });
    if (st === 'see') return ''; // the first screen: only the calm words above the action
    return t(`out_${st}`);
  }
  function ruleNow() {
    const st = s.stage;
    if (st === 'see') return '';
    if (st === 'move') return t(s.sawNear ? 'rule_move_both' : s.sawFar ? 'rule_move_far' : 'rule_move');
    if (st === 'formula') {
      const img = imageOf(s.u);
      const one = t.num(1);
      const v = round(img.behind, 1);
      const line = `${frac(one, 'u')}<span class="op">+</span>${frac(one, 'v')}<span class="op">=</span>${frac(one, 'f')}`;
      const nums = `${frac(one, t.num(s.u))}<span class="op">+</span>${frac(one, `−${t.num(v)}`)}<span class="op">=</span>${frac(one, `−${t.num(F0)}`)}`;
      return `<span class="pvc-formula lab-formula">${line}<span class="lab-then">→</span>${nums}</span>${t('rule_formula')}`;
    }
    return t(`rule_${st}`);
  }
  function panel() {
    if (s.quiz) {
      title.hidden = true;
      steady.title = '';
      return;
    }
    sheet.choose(WORD_OF[s.stage]);
    // the words wait for what they describe: while a step runs, the last ones stay
    if (!s.busy) {
      sheet.outcome(outcomeNow());
      sheet.rule(ruleNow());
      const calm = s.stage === 'see';
      const ph = phase();
      const html = calm
        ? `<span class="lab-long">${t('intro')}</span><span class="lab-short">${t('intro_short')}</span>`
        : t(`lead_${ACTIONS[ph] ? ph : 'test'}`);
      if (steady.lead !== html) {
        steady.lead = html;
        lead.innerHTML = html;
        lead.classList.toggle('pvc-note', calm);
        ui.learn.classList.toggle('lab-calm', calm);
      }
      ui.learn.dataset.stage = s.stage; // the formula's step gets a taller rule on a phone
    }
    // the book's four properties, only where the tall panel has room and they say something new
    const cap = ZOOMED.has(s.stage) ? 'move' : '';
    if (steady.cap !== cap) {
      steady.cap = cap;
      caption.innerHTML = cap ? t(`cap_${cap}`) : '';
      caption.hidden = !cap;
    }
    const head = s.quiz ? '' : t(`title_${TITLE_OF[s.stage]}`, { one: 1 });
    if (steady.title !== head) {
      steady.title = head;
      title.textContent = head;
      title.hidden = !head;
    }
    const ph = phase();
    const nextWord = STAGES.includes(ph) ? WORD_OF[ph] : null;
    sheet.next(nextWord !== WORD_OF[s.stage] ? nextWord : null);
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
    if (ph === 'par' || ph === 'cen' || ph === 'foc') {
      if (V.u > (CAP[s.frame] ?? 99)) return null;
      aim.set(V.u, AX + PENCIL + 2.4, 0);
    } else if (ph === 'ext') aim.set(-3, AX + 6.2, 0);
    else if (ph === 'image') aim.set(img.v, AX + img.height + 3.4, 0);
    else if (ph === 'plane' || ph === 'eye' || ph === 'wide') aim.set(0, AX + MIRROR.half - 2.5, 0);
    else return null; // moving the pencil is a drag: the hand shows it; the rest is the button's
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
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
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
      // close on the image the pencil may be out of the view: there a finger anywhere moves it, a width of the view for most of the rail
      const anywhere = ZOOMED.has(s.stage);
      const box = ui.canvasHost.getBoundingClientRect();
      const onGrip = pencilHandle.hit(e.clientX - box.left, e.clientY - box.top);
      if (!anywhere && !onGrip && !ray.intersectObject(setting.hit, false).length) return;
      // the rail on the screen: how many pixels to a centimetre, and which way
      pa.set(0, AX, 0).project(camera);
      pb.set(10, AX, 0).project(camera);
      const dx = ((pb.x - pa.x) / 2) * stage.width;
      const dy = ((pa.y - pb.y) / 2) * stage.height;
      const l = Math.hypot(dx, dy) || 1;
      const perCm = anywhere ? stage.width / 60 : l / 10;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: s.u, ux: dx / l, uy: dy / l, perCm };
      s.dragging = true;
      capturePointer(ui.canvasHost, e.pointerId);
      e.stopPropagation();
      e.preventDefault();
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
  const ORDER = ['rule', 'number', 'far', 'dash', 'rear'];
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  /** The scene of a question: a stage set at once, with what it may show. */
  function quizScene(q, name, { u = U.start, frame = FRAME_OF[name], change = {} } = {}) {
    stopRun();
    s.u = u;
    s.stage = name;
    settle(name);
    Object.assign(V, change);
    apply();
    s.frame = frame;
    s.quiz = { ...q, named: false };
    clearLabels();
    stage.invalidate();
  }
  const NO_RAYS = { r1in: 0, r1out: 0, r1ext: 0, r2in: 0, r2out: 0, r2ext: 0, r3in: 0, r3out: 0, r3ext: 0, showO: 0, showF: 0 };
  const onAxisAt = (x) => ({ x, y: AX, z: 0 });
  const Q = {
    rule() {
      const spots = shuffle([-F0, -R0, 0, -F0 / 2]);
      const u = shuffle([10, 15, 22])[0];
      quizScene({ kind: 'rule', points: spots.map(onAxisAt) }, 'par', { u, frame: 'rays', change: { showF: 0 } });
      const tag = (x) => t(`tag_${spots.indexOf(x)}`);
      const wrong = [-R0, 0, -F0 / 2];
      return {
        text: t('q_rule'),
        answer: -F0,
        wrong,
        label: (x) => t('c_point', { x: tag(x) }),
        notes: notesOf([
          [-R0, t('n_rule_o')],
          [0, t('n_rule_p')],
          [-F0 / 2, t('n_rule_mid')],
        ]),
        reveal: t('a_rule', { x: tag(-F0) }),
        after: { r2ext: 1, showF: 1 },
      };
    },
    number() {
      const [u, v] = shuffle([
        [60, 12],
        [10, 6],
        [5, 3.75],
      ])[0];
      quizScene({ kind: 'number', showF: true }, 'move', { u, frame: 'bench', change: { ...NO_RAYS, ghost: 0, size: 0, showF: 1, bars: 1 } });
      const sign = (u * F0) / Math.abs(u - F0); // 1/v = 1/f − 1/u: the sign of u or of f lost
      const wrong = [u, F0, sign];
      return {
        text: t('q_number', { f: F0 }),
        answer: v,
        wrong,
        label: (x) => t('c_cm', { x }),
        notes: notesOf([
          [u, t('n_number_u')],
          [F0, t('n_number_f')],
          [sign, t('n_number_sign')],
        ]),
        reveal: t('a_number', { u, f: F0, v, one: 1 }),
        after: { ghost: 1 },
      };
    },
    far() {
      quizScene({ kind: 'far' }, 'move', { u: U.start });
      const wrong = ['mirror', 'big', 'same'];
      return {
        text: t('q_far'),
        answer: 'right',
        wrong,
        label: (k) => t(`c_far_${k}`),
        notes: notesOf([
          ['mirror', t('n_far_mirror')],
          ['big', t('n_far_big')],
          ['same', t('n_far_same')],
        ]),
        reveal: t('a_far'),
        slideTo: 60,
      };
    },
    dash() {
      const u = U.start;
      const [, para, toF] = threeRays(u);
      const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: AX + (a.y + b.y) / 2, z: 0 });
      const parts = {
        behind: mid(para.hit, para.back),
        in: mid(para.start, para.hit),
        out: { x: para.hit.x + para.out.x * 2.6, y: AX + para.hit.y + para.out.y * 2.6, z: 0 },
        back: mid(toF.hit, toF.end),
      };
      const order = shuffle(Object.keys(parts));
      quizScene({ kind: 'dash', points: order.map((k) => parts[k]) }, 'foc', {
        u,
        frame: 'near',
        change: { r1in: 0, r1out: 0, r1ext: 0, showO: 0, r3ext: 0 },
      });
      const tag = (k) => t(`tag_${order.indexOf(k)}`);
      const wrong = ['in', 'out', 'back'];
      return {
        text: t('q_dash'),
        answer: 'behind',
        wrong,
        label: (k) => t('c_part', { x: tag(k) }),
        notes: notesOf([
          ['in', t('n_dash_in')],
          ['out', t('n_dash_out')],
          ['back', t('n_dash_out')],
        ]),
        reveal: t('a_dash', { x: tag('behind') }),
      };
    },
    rear() {
      const only = shuffle(ROW_Z.filter((z) => !postsSeen(FLAT_R).includes(z)))[0];
      const list = shuffle([only, ...postsSeen(FLAT_R)]);
      quizScene({ kind: 'rear', points: list.map((z) => ({ x: ROW_X, y: POST.top + 1, z })) }, 'wide');
      const tag = (z) => t(`tag_${list.indexOf(z)}`);
      const wrong = postsSeen(FLAT_R);
      return {
        text: t('q_rear'),
        answer: only,
        wrong,
        label: (z) => t('c_post', { x: tag(z) }),
        notes: notesOf(wrong.map((z) => [z, t('n_rear_both')])),
        reveal: t('a_rear', { x: tag(only), a: postsSeen(FLAT_R).length, b: postsSeen(R0).length }),
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
    s.sawFar = false;
    s.sawNear = false;
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
      r: R0,
      v: round(img.v, 3),
      m: round(img.m, 4),
      imageHeight: round(img.height, 3),
      miss: round(miss(s.u), 3),
      rays: rays.view.keys.filter((k) => k.in >= 1).length,
      extended: rays.view.keys.filter((k) => k.ext >= 1).length,
      ghost: V.ghost >= 1,
      curve: V.curve,
      row: V.row >= 1,
      seen: postsSeen(radiusOf(V.curve)).length,
      handle: { shown: pencilHandle.visible, used: s.dragged },
      imagePx: Math.round(imagePx()),
      sawFar: s.sawFar,
      sawNear: s.sawNear,
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
      s.sawFar = false;
      s.sawNear = false;
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
