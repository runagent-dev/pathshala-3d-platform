// The power of a lens (book pages 264–266, topic 9.4.3), student view. An optical bench on a calm blue setting: a ray box on the left,
// a lens in an open cradle at 0, a printed cm scale. A calm card first, then one tap a step, slow: ① the light is switched on and
// five parallel beams meet at F, 40 cm away (the book's glasses of power 2.5); ② a pencil inside the focal length, seen through the
// lens: an upright virtual image 1.4 times as big (চিত্র ৯.২৭, the first lens); ③ a more curved lens, f = 20 cm, at the same
// distance: 2.5 times (চিত্র ৯.২৭, the second); ④ the power is measured: the beams meet at 20 cm, P = 1/f = +5 ডায়াপটার, a dot on
// the P–f graph in the panel; then f = 10 cm, +10; ⑤ a concave lens spreads the light as if from F: −2.5, then −5. Lenses lift out
// of the cradle and drop in; the camera flies between three-quarter views; the test (five questions, the book's example and its
// নিজে করো among them) is offered after the last step.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { BOX, createSetting, RAIL } from './bench.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { BAR_Y, createRays } from './rays.js';
import {
  beamsOf,
  focusX,
  imageOf,
  LENS,
  LENSES,
  lensOf,
  metres,
  PENCIL,
  PENCIL_U,
  pencilRays,
  powerChoices,
  powerOf,
  REACH,
  round,
  shuffle,
  signed,
} from './reading.js';

export const DEFAULTS = {
  scene: 'intro',
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

/** The scenes, in the order the action walks them; the step (the word in the panel) each belongs to. */
export const SEQ = ['intro', 'focus', 'pencil', 'compare', 'power', 'power10', 'concave', 'concave20'];
export const STEPS = ['focus', 'pencil', 'compare', 'power', 'concave'];
const STEP_OF = {
  intro: null,
  focus: 'focus',
  pencil: 'pencil',
  compare: 'compare',
  power: 'power',
  power10: 'power',
  concave: 'concave',
  concave20: 'concave',
};
/**
 * What each scene shows: the lens in the cradle, the light (the ray box: where it stands, its lamp) or the pencil (at u), the focus
 * of the lens before (a faint ring, to compare), whether the power is known (the P label, the formula, the graph's dots).
 */
const SCENES = {
  intro: { lens: 'plus40', source: 'box', box: 'near', lamp: 0, P: false },
  focus: { lens: 'plus40', source: 'box', box: 'near', lamp: 1, P: false },
  pencil: { lens: 'plus40', source: 'pencil', box: 'far', P: false },
  compare: { lens: 'plus20', source: 'pencil', box: 'far', old: 'plus40', P: false },
  power: { lens: 'plus20', source: 'box', box: 'near', lamp: 1, old: 'plus40', P: true },
  power10: { lens: 'plus10', source: 'box', box: 'near', lamp: 1, old: 'plus20', P: true },
  concave: { lens: 'minus40', source: 'box', box: 'far', lamp: 1, P: true },
  concave20: { lens: 'minus20', source: 'box', box: 'far', lamp: 1, old: 'minus40', P: true },
};
/** The lenses whose power the student knows in each scene: the dots of the graph. */
const DOTS = {
  power: ['plus40', 'plus20'],
  power10: ['plus40', 'plus20', 'plus10'],
  concave: ['plus40', 'plus20', 'plus10', 'minus40'],
  concave20: ['plus40', 'plus20', 'plus10', 'minus40', 'minus20'],
};
/** The action in each scene: its words, the student's step number, what it does next. */
const ACTIONS = {
  intro: ['act_light', 1],
  focus: ['act_pencil', 2],
  pencil: ['act_compare', 3],
  compare: ['act_power', 4],
  power: ['act_power10', 5],
  power10: ['act_concave', 6],
  concave: ['act_concave20', 7],
  concave20: ['act_quiz', ''],
};
/** Colours of the meanings: the focus (violet, as chapter 8), the power (crimson), the ink of plain labels. */
const COLORS = { focus: '#5a37d0', power: '#c2255c', ink: '#2b3a4a' };
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 58, bottom: 12, side: 34 };
// how long things take (s): slow enough to follow
const T = {
  hide: 0.45,
  fly: 1.7,
  liftOut: 0.85,
  liftIn: 1,
  move: 1.6,
  lamp: 0.45,
  in: 1,
  out: 1.1,
  ext: 0.9,
  F: 0.55,
  bar: 0.8,
  img: 0.9,
  P: 0.4,
  hold: 0.3,
};
/** The values that move, and where they rest at the start. */
const ZERO = {
  lift: 0,
  boxX: BOX.near,
  lamp: 0,
  pen: 0,
  bIn: 0,
  bOut: 0,
  bExt: 0,
  pIn: 0,
  pOut: 0,
  pExt: 0,
  img: 0,
  eye: 0,
  F: 0,
  F2: 0,
  bar: 0,
  old: 0,
  O: 0,
  P: 0,
};
const RAYS_KEYS = ['bIn', 'bOut', 'bExt', 'pIn', 'pOut', 'pExt', 'img', 'eye', 'F', 'F2', 'bar', 'old', 'O', 'P'];
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const AX = RAIL.axis;

/** The camera's frame for a scene (or a question): x from, x to (cm on the bench), the height above the axis it takes in. */
function frameFor(key, aspect) {
  const tall = aspect < 1.25;
  // [x from, x to, height above the axis]; a tall view gives up the far ends (the box's back, the rays past F′)
  const F = {
    intro: [-37, 13, 9],
    beams: tall ? [-31, 45, 9] : [-37, 48, 9],
    pencil: tall ? [-34, 24, 16] : [-36, 46, 16],
    concave: tall ? [-58, 14, 9] : [-62, 30, 9],
    read: tall ? [-31, 31, 9] : [-37, 34, 9],
    readNeg: tall ? [-58, 12, 9] : [-62, 28, 9],
    glasses: [-37, 13, 9],
    diy_a: tall ? [-34, 30, 12] : [-36, 46, 12],
    diy_b: [-47, 44, 9],
    diy_c: [-29, 27, 9],
  }[key];
  const [x0, x1, top] = F;
  const below = key === 'diy_b' ? 9 : AX - 1;
  return {
    box: new THREE.Box3(V(x0, AX - below, -3), V(x1, AX + top, 3)),
    az: tall ? -30 : -22, // from the light's side, as the sister lens figures
    el: 11,
  };
}
const FRAME_OF = {
  intro: 'intro',
  focus: 'beams',
  pencil: 'pencil',
  compare: 'pencil',
  power: 'beams',
  power10: 'beams',
  concave: 'concave',
  concave20: 'concave',
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const sgn = (p) => signed(p, N);

  root.classList.add('pvc', 'lp');
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
  // the line before the action: what the next tap will show (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'lp-lead';
  $('.pvc-act-row').before(lead);
  // the P–f graph, under the rule: it fills the panel's free height beside the 3D
  const graphBox = document.createElement('div');
  graphBox.className = 'lp-graph';
  ui.learn.append(graphBox);
  const graph = createGraph(graphBox, { t, N, signed: sgn });
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 2, far: 2000, environment: 'studio-light' });
  const { camera, controls } = stage;
  controls.enablePan = false;
  const transparent = o.bg === 'transparent';
  if (transparent) root.dataset.theme = 'transparent';
  const setting = createSetting({ stage, shadow: o.shadow && !transparent, t, transparent });
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
    scene: 'intro',
    lens: 'plus40', // in the cradle
    u: PENCIL_U, // where the pencil stands, cm in front of the lens
    old: null, // the lens whose F shows as a faint ring
    showP: false,
    dots: /** @type {string[]} */ ([]),
    v: { ...ZERO },
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    /** @type {null | { kind: string, variant?: string, labels: Record<string, boolean> }} */
    quiz: null,
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the scene from the state ────────────────────────────────────────────────
  const cache = { beams: null, beamsKey: '', pencil: null, pencilKey: '' };
  function source() {
    if (s.quiz) return s.quiz.source;
    return SCENES[s.scene].source;
  }
  /** The image of the pencil now (in the cradle's lens), or null when there is no pencil. */
  function image() {
    if (source() !== 'pencil') return null;
    return imageOf(s.lens, s.u);
  }
  function syncScene() {
    const v = s.v;
    setting.placeLens(s.lens, v.lift);
    setting.placeBox(v.boxX, v.lamp);
    setting.placePencil(s.u, ease.outCubic(Math.min(1, v.pen)));
    const R = rays.view;
    const seat = 1 - Math.min(1, v.lift * 4);
    R.lens.id = s.lens;
    R.lens.k = s.scene === 'intro' && !s.quiz ? 0 : seat * 0.95;
    R.middle = source() === 'pencil';
    // the ray box's beams, traced from its plate
    const to = LENSES[s.lens].kind === 'convex' ? Math.min(REACH.right, LENSES[s.lens].f + 10) : 30;
    const bk = `${s.lens}|${v.boxX.toFixed(2)}|${to}`;
    if (bk !== cache.beamsKey) {
      cache.beamsKey = bk;
      cache.beams = beamsOf(s.lens, v.boxX, to);
    }
    R.beams = v.bIn > 0 ? cache.beams : [];
    R.beamK.in = v.bIn;
    R.beamK.out = v.bOut;
    R.beamK.ext = v.bExt;
    // the pencil's two rays
    const pk = `${s.lens}|${s.u}`;
    if (pk !== cache.pencilKey) {
      cache.pencilKey = pk;
      cache.pencil = pencilRays(s.lens, s.u);
    }
    R.pencil = v.pIn > 0 ? cache.pencil : [];
    R.pencilK.in = v.pIn;
    R.pencilK.out = v.pOut;
    R.pencilK.ext = v.pExt;
    const fx = focusX(s.lens);
    R.F.x = fx;
    R.F.k = v.F;
    R.F2.x = -fx;
    R.F2.k = v.F2;
    R.bar.x = fx;
    R.bar.k = v.bar;
    R.oldF.x = s.old ? focusX(s.old) : 0;
    R.oldF.k = s.old ? v.old : 0;
    R.O = v.O;
    R.eye = v.eye;
    const img = image();
    if (img && img.kind !== 'none') {
      R.image.x = img.x;
      R.image.y = img.tip;
      R.image.k = v.img;
      setting.placeImage(img.kind, img.x, img.m, v.img);
    } else {
      R.image.k = 0;
      setting.placeImage('none', 0, 1, 0);
    }
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      () => rays.boxes(),
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotateEl),
      () => boxOf(root.querySelector('.pvc-panel-toggle')),
    ],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const ABOVE = [spot(0, -24), spot(22, -26), spot(-22, -26), spot(0, -42), spot(34, -12), spot(-34, -12)];
  const BELOW = [spot(0, 22), spot(22, 24), spot(-22, 24), spot(0, 38), spot(34, 12), spot(-34, 12)];
  // the letters on the axis: just under it, or (where the beams run past them) clear of the beam band
  const AXIS_DOWN = [
    spot(0, 22),
    spot(16, 24),
    spot(-16, 24),
    spot(0, -22),
    spot(0, 36),
    spot(0, -36),
    spot(-24, 40),
    spot(24, 40),
    spot(0, 52),
    spot(0, -52),
  ];
  // above the axis first, clear of the beam band: where the beams of a concave lens, or a real image, fill the space under it
  const AXIS_UP = [spot(0, -38), spot(-26, -42), spot(26, -42), spot(0, -52), spot(0, 38), spot(0, 52)];
  const IMG_ABOVE = [...ABOVE, spot(0, -58), spot(-52, -30), spot(52, -30), spot(-60, 0)];
  const IMG_BELOW = [...BELOW, spot(0, 56), spot(-52, 30), spot(52, 30)];
  const OLD_SPOTS = [spot(44, -26), spot(50, -10), spot(0, -40), spot(-44, -26)];
  const axisSpots = () => (LENSES[s.lens].kind === 'concave' || image()?.kind === 'real' ? AXIS_UP : AXIS_DOWN);
  const AT_BAR = [spot(0, 18), spot(26, 20), spot(-26, 20), spot(0, -18)];
  const big = (letter) => `<span class="lab-letter">${letter}</span>`;
  /** The chapter's letters (convex-lens-image, lens-types): F on the light's side of the lens, F′ on the far side. */
  const letterAt = (x) => big(x > 0 ? 'F′' : 'F');
  const quizHides = (id) => s.quiz && !s.quiz.labels[id];
  const seated = () => s.v.lift < 0.04;
  const firstF = () => !s.quiz && (s.scene === 'focus' || s.scene === 'concave');
  const LABELS = {
    box: {
      text: () => t('lbl_box'),
      point: () => V(s.v.boxX - 3.5, AX + BOX.height / 2 + 0.5, 0),
      color: COLORS.ink,
      spots: ABOVE,
      show: () => !s.quiz && (s.scene === 'intro' || s.scene === 'focus'),
    },
    lens: {
      text: () =>
        s.showP && s.v.P > 0.5 ? t('lbl_P', { p: sgn(powerOf(s.lens)) }) : t(LENSES[s.lens].kind === 'convex' ? 'lbl_convex' : 'lbl_concave'),
      point: () => V(0, AX + lensOf(s.lens).h + 1.4, 0),
      color: () => (s.showP && s.v.P > 0.5 ? COLORS.power : COLORS.ink),
      spots: ABOVE,
      show: () => seated() && !quizHides('lens') && !s.busy,
    },
    F: {
      text: () => (firstF() && stage.height >= 260 ? `${t('lbl_focus')} ${letterAt(focusX(s.lens))}` : letterAt(focusX(s.lens))),
      point: () => V(focusX(s.lens), AX, 0),
      color: COLORS.focus,
      spots: () => axisSpots(),
      show: () => s.v.F > 0.6 && !s.busy && !(s.quiz && s.v.img > 0.5),
    },
    F2: {
      text: () => letterAt(-focusX(s.lens)),
      point: () => V(-focusX(s.lens), AX, 0),
      color: COLORS.focus,
      spots: () => axisSpots(),
      show: () => s.v.F2 > 0.6 && !s.busy && !(s.quiz && s.v.img > 0.5),
    },
    O: {
      text: () => (s.scene === 'pencil' && !s.quiz ? `${t('lbl_o')} ${big('O')}` : big('O')),
      point: () => V(0, AX, 0),
      color: COLORS.ink,
      spots: [spot(-30, 44), spot(30, 44), spot(0, 52), spot(-34, -44)],
      optional: true,
      show: () => s.v.O > 0.6 && !s.busy && stage.height >= 260 && ((!s.quiz && s.scene === 'pencil') || s.quiz?.kind === 'diy'),
    },
    f: {
      text: () => t(s.scene === 'focus' && !s.quiz && stage.width >= 480 ? 'lbl_fbar' : 'lbl_f', { f: LENSES[s.lens].f }),
      point: () => V(focusX(s.lens) / 2, AX + BAR_Y, 0),
      color: COLORS.focus,
      spots: AT_BAR,
      show: () => s.v.bar > 0.95 && !quizHides('f') && !s.busy,
    },
    old: {
      text: () => `${t('lbl_old')} ${letterAt(s.old ? focusX(s.old) : 1)}`,
      point: () => V(s.old ? focusX(s.old) : 0, AX, 0),
      color: COLORS.focus,
      spots: () => (s.old && LENSES[s.old].kind === 'concave' ? AXIS_UP : OLD_SPOTS),
      optional: true,
      show: () => Boolean(s.old) && s.v.old > 0.6 && !s.busy && stage.width >= 500 && SCENES[s.scene].source === 'box' && !s.quiz,
    },
    image: {
      text: () => t(image()?.kind === 'real' ? 'lbl_real' : 'lbl_virtual'),
      point: () => {
        const img = image();
        return img ? V(img.x, AX + (img.kind === 'real' ? img.tip - 0.3 : img.tip + 0.3), 0) : V(0, AX, 0);
      },
      color: COLORS.ink,
      spots: () => (image()?.kind === 'real' ? IMG_BELOW : IMG_ABOVE),
      show: () => s.v.img > 0.9 && Boolean(image()) && !s.busy,
    },
    pencil: {
      text: () => t('lbl_pencil'),
      point: () => V(-s.u, AX + PENCIL + 0.2, 0),
      color: COLORS.ink,
      spots: ABOVE,
      optional: true,
      show: () => s.v.pen > 0.99 && (s.scene === 'pencil' || s.quiz?.kind === 'diy') && !s.busy && s.v.img < 0.5,
    },
  };
  const placed = new Map(); // which list of places each label was put with
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      const spots = typeof L.spots === 'function' ? L.spots() : L.spots;
      const color = typeof L.color === 'function' ? L.color() : L.color;
      const text = L.text();
      const key = `${color}`;
      if (want && anno.has(id) && (placed.get(id)?.spots !== spots || placed.get(id)?.key !== key)) anno.remove(id);
      if (want && !anno.has(id)) {
        anno.add(id, { text, point: L.point, kind: 'part', color, spots, optional: L.optional });
        placed.set(id, { spots, key, text });
      } else if (want && placed.get(id)?.text !== text) {
        anno.setText(id, text);
        placed.get(id).text = text;
      } else if (!want && anno.has(id)) anno.remove(id);
    }
  }

  // ── camera: a gentle three-quarter view for each scene ───────────────────────
  function frameKey() {
    if (s.quiz) return s.quiz.frame;
    return FRAME_OF[s.scene];
  }
  function poseFor(key) {
    const aspect = stage.width / Math.max(1, stage.height);
    const fr = frameFor(key, aspect);
    const az = THREE.MathUtils.degToRad(fr.az);
    const el = THREE.MathUtils.degToRad(fr.el);
    const dir = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    return fitPose({ box: fr.box, dir, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  const cam = { from: null, to: null, k: 1 };
  function applyCamera() {
    if (s.userMovedCamera) return;
    const to = cam.to || (cam.to = poseFor(frameKey()));
    if (cam.k < 1 && cam.from) {
      const k = ease.inOutCubic(cam.k);
      camera.position.lerpVectors(cam.from.position, to.position, k);
      controls.target.lerpVectors(cam.from.target, to.target, k);
    } else {
      camera.position.copy(to.position);
      controls.target.copy(to.target);
    }
    controls.update();
  }
  /** The guided camera flies to the frame of the scene now (from wherever it is, the student's view too). */
  function flyCamera(duration = T.fly) {
    const was = s.userMovedCamera;
    if (was) {
      s.userMovedCamera = false;
      rotate.home();
    }
    if (s.view !== 'front') {
      s.view = 'front';
      syncUI();
      emit('view', { view: s.view });
    }
    cam.from = { position: camera.position.clone(), target: controls.target.clone() };
    cam.to = poseFor(frameKey());
    if (!duration || cam.from.position.distanceTo(cam.to.position) < 0.05) {
      cam.k = 1;
      stage.invalidate();
      return Promise.resolve(true);
    }
    cam.k = 0;
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        cam.k = k;
        stage.invalidate();
      },
      onComplete: () => {
        cam.k = 1;
      },
    }).finished;
  }
  function beginOrbit() {
    if (s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    cam.k = 1;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
      emitChange();
    }
  }
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${t.num(360)}°`,
    label: t('view_rotate'),
    pulse: Boolean(o.coach),
    zoom: [0.45, 2.2],
    when: () => s.mode !== 'quiz',
    onTurn: beginOrbit,
  });
  rotateEl = rotate.el;
  function setView(view, { animate = true } = {}) {
    if (view === '3d') {
      // a turn of the guided view, a little more from the side, kept until the student turns it themselves
      s.view = '3d';
      s.userMovedCamera = false;
      rotate.home();
      cam.from = { position: camera.position.clone(), target: controls.target.clone() };
      const to = poseFor(frameKey());
      const off = to.position
        .clone()
        .sub(to.target)
        .applyAxisAngle(V(0, 1, 0), THREE.MathUtils.degToRad(30));
      off.y += off.length() * 0.18;
      cam.to = { target: to.target, position: to.target.clone().add(off) };
      cam.k = animate ? 0 : 1;
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      if (!animate) return Promise.resolve(true);
      return tweener.animate({ key: 'camera', duration: T.fly, onUpdate: (k) => (cam.k = k), onComplete: () => (cam.k = 1) }).finished;
    }
    const p = flyCamera(animate ? T.fly : 0);
    emitChange();
    return p;
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
  });
  const side = () => root.clientWidth >= 600 && root.clientWidth >= root.clientHeight;
  stage.onResize(() => {
    root.classList.toggle('lp-side', side());
    if (!s.userMovedCamera && s.view === 'front') {
      cam.to = poseFor(frameKey());
      cam.k = 1;
    }
    syncScene();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  /** Moves some of the values to where they go, together, over `duration` seconds (null when the run was stopped). */
  function tweenTo(to, duration, my, key = 'step', how = ease.inOutCubic) {
    const from = { ...s.v };
    const keys = Object.keys(to).filter((k) => Math.abs(to[k] - from[k]) > 1e-6);
    if (!keys.length) return Promise.resolve(my === s.run);
    return tweener
      .animate({
        key,
        duration,
        ease: how,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const name of keys) s.v[name] = from[name] + (to[name] - from[name]) * k;
          syncLabels();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  const wait = (sec, my) => tweener.animate({ key: 'wait', duration: sec }).finished.then((ok) => ok && my === s.run);
  /** Lifts the lens out of the cradle and drops `id` in. */
  async function swapLens(id, my) {
    if (s.lens === id && s.v.lift < 1e-3) return true;
    if (s.lens !== id) {
      if (!(await tweenTo({ lift: 1 }, T.liftOut, my, 'lens', ease.inCubic))) return false;
      s.lens = id;
    }
    audio.contact?.();
    return tweenTo({ lift: 0 }, T.liftIn, my, 'lens', ease.outCubic);
  }
  /** Where every value ends in a scene (or a question's plan). */
  function targetOf(sc) {
    const box = sc.source === 'box';
    const concave = LENSES[sc.lens].kind === 'concave';
    return {
      lift: 0,
      boxX: sc.box === 'far' ? BOX.far : BOX.near,
      lamp: box ? (sc.lamp ?? 0) : 0,
      pen: box ? 0 : 1,
      bIn: box && sc.lamp ? 1 : 0,
      bOut: box && sc.lamp ? 1 : 0,
      bExt: box && sc.lamp && concave ? 1 : 0,
      pIn: !box && sc.rays !== false ? 1 : 0,
      pOut: !box && sc.rays !== false ? 1 : 0,
      pExt: !box && sc.rays !== false && imageOf(sc.lens, sc.u ?? PENCIL_U).kind === 'virtual' ? 1 : 0,
      img: !box && sc.rays !== false ? 1 : 0,
      eye: !box && sc.rays !== false && imageOf(sc.lens, sc.u ?? PENCIL_U).kind === 'virtual' ? 1 : 0,
      F: (box && sc.lamp) || !box ? 1 : 0,
      F2: !box && !concave ? 1 : 0,
      bar: box && sc.lamp && sc.bar !== false ? 1 : 0,
      old: sc.old ? 1 : 0,
      O: (box && sc.lamp) || !box ? 1 : 0,
      P: sc.P ? 1 : 0,
    };
  }
  /** Lands at once on a scene (or a question's plan). */
  function land(sc) {
    s.lens = sc.lens;
    s.u = sc.u ?? PENCIL_U;
    s.old = sc.old ?? null;
    s.showP = Boolean(sc.P);
    Object.assign(s.v, targetOf(sc));
  }
  /**
   * The walk to a scene, in one order: what must go goes (the rays, the image), then the camera, the lens, the box and the pencil
   * move together, then the light comes: the lamp, the beams to the lens and out of it (back to F for a concave lens), F and the
   * focal length; or the pencil's two rays, their backward lines and the image. Then the power.
   */
  async function play(sc, my) {
    const goal = targetOf(sc);
    const clear = {};
    for (const k of RAYS_KEYS) if (s.v[k] > 0 && !(k === 'P' && goal.P && s.lens === sc.lens)) clear[k] = 0;
    if (sc.lens !== s.lens || goal.boxX !== s.v.boxX || goal.pen !== s.v.pen) clear.lamp = 0;
    if (Object.keys(clear).length && !(await tweenTo(clear, T.hide, my))) return false;
    s.old = sc.old ?? null;
    s.showP = Boolean(sc.P);
    if (sc.u != null && s.v.pen < 0.01) s.u = sc.u;
    const moves = [flyCamera(T.fly), swapLens(sc.lens, my)];
    if (goal.boxX !== s.v.boxX) moves.push(tweenTo({ boxX: goal.boxX }, T.move, my, 'move'));
    if (goal.pen !== s.v.pen) {
      if (goal.pen > 0 && sc.u != null) s.u = sc.u;
      moves.push(tweenTo({ pen: goal.pen }, T.move * 0.8, my, 'pencil', goal.pen > 0 ? ease.outCubic : ease.inCubic));
    }
    const res = await Promise.all(moves);
    if (my !== s.run || res.some((r) => r === false)) return false;
    if (goal.lamp > 0) {
      if (!(await tweenTo({ lamp: 1 }, T.lamp, my))) return false;
      if (!(await tweenTo({ O: 1 }, 0.2, my))) return false;
      if (!(await tweenTo({ bIn: 1 }, T.in, my, 'step', ease.linear))) return false;
      if (!(await tweenTo({ bOut: 1 }, T.out, my, 'step', ease.linear))) return false;
      if (goal.bExt && !(await tweenTo({ bExt: 1 }, T.ext, my, 'step', ease.linear))) return false;
      if (!(await tweenTo({ F: 1, old: goal.old }, T.F, my))) return false;
      if (goal.bar && !(await tweenTo({ bar: 1 }, T.bar, my))) return false;
    } else if (goal.pen > 0) {
      if (!(await tweenTo({ F: 1, F2: goal.F2, O: 1, old: goal.old }, T.F, my))) return false;
      if (goal.pIn) {
        if (!(await tweenTo({ pIn: 1 }, T.in, my, 'step', ease.linear))) return false;
        if (!(await tweenTo({ pOut: 1 }, T.out, my, 'step', ease.linear))) return false;
        if (goal.pExt && !(await tweenTo({ pExt: 1 }, T.ext, my, 'step', ease.linear))) return false;
        if (!(await tweenTo({ img: 1, eye: goal.eye }, T.img, my))) return false;
      }
    }
    if (goal.P && !(await tweenTo({ P: 1 }, T.P, my))) return false;
    return wait(T.hold, my);
  }
  function stopAll() {
    s.run++;
    for (const k of ['step', 'lens', 'move', 'pencil', 'wait']) tweener.cancel(k);
    s.busy = false;
  }
  /** Goes to a scene: played (the default) or landed at once. */
  async function go(scene, { animate = true } = {}) {
    if (!(scene in SCENES)) return;
    stopAll();
    const my = s.run;
    s.scene = scene;
    // the graph gets the new lens's dot only once its power has been shown
    const known = DOTS[scene] ?? [];
    s.dots = s.dots.filter((id) => known.includes(id));
    hintOff();
    if (!animate) {
      s.dots = known;
      land(SCENES[scene]);
      flyCamera(0);
      done();
      return;
    }
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    const ok = await play(SCENES[scene], my);
    if (!ok || my !== s.run) return;
    s.busy = false;
    s.dots = known;
    audio.success?.();
    done();
  }
  /** Plays the scene again from the one before it (a lens comes in again, the light comes on again). */
  function replay() {
    const i = SEQ.indexOf(s.scene);
    if (i <= 0) return;
    stopAll();
    land(SCENES[SEQ[i - 1]]);
    if (STEP_OF[SEQ[i - 1]] !== STEP_OF[s.scene] || SCENES[SEQ[i - 1]].source !== SCENES[s.scene].source) {
      // from another step: only the light again, with the scene's own lens in place
      land(SCENES[s.scene]);
      for (const k of RAYS_KEYS) s.v[k] = 0;
      s.v.lamp = 0;
      if (SCENES[s.scene].source === 'pencil') s.v.pen = 1;
    }
    go(s.scene);
  }
  function done() {
    syncScene();
    syncLabels();
    refresh();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const replayBtn = /** @type {HTMLButtonElement} */ ($('[data-act="replay"]'));
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const steady = { lead: '', act: '' };
  function varsOf(scene) {
    const lens = SCENES[scene].lens;
    const p = powerOf(lens);
    return {
      f: LENSES[lens].f,
      fm: metres(LENSES[lens].f),
      p: sgn(p),
      m: round(imageOf(lens, PENCIL_U).m, 1),
      mm: round(imageOf(lens, PENCIL_U).m, 2),
      u: PENCIL_U,
      v: round(Math.abs(imageOf(lens, PENCIL_U).x), 1),
      m0: round(imageOf('plus40', PENCIL_U).m, 1),
    };
  }
  function outcomeOf(scene) {
    const v = varsOf(scene);
    if (scene === 'focus') return t('out_focus', v);
    if (scene === 'pencil') return t('out_pencil', v);
    if (scene === 'compare') return t('out_compare', v);
    if (scene === 'power' || scene === 'power10') return t('out_power', v);
    if (scene === 'concave' || scene === 'concave20') return t('out_concave', v);
    return '';
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.scene === 'intro';
    const leadHtml = calm
      ? `<span class="lp-long">${t('intro')}</span><span class="lp-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : t(`lead_${s.scene}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('lp-calm', calm);
    }
    sheet.outcome(calm || s.busy ? '' : outcomeOf(s.scene));
    sheet.rule(calm || s.busy ? '' : t(`rule_${s.scene}`, varsOf(s.scene)));
    sheet.choose(STEP_OF[s.scene]);
    const i = SEQ.indexOf(s.scene);
    const nextStep = STEP_OF[SEQ[i + 1]] ?? null;
    sheet.next(nextStep && nextStep !== STEP_OF[s.scene] ? nextStep : null);
    const [word, step] = s.busy ? ['act_wait', ''] : ACTIONS[s.scene];
    const enabled = !s.busy;
    const icon = s.scene === 'concave20' && !s.busy ? ICONS.chevR : ICONS.hand;
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      if (step !== '' && enabled && s.mode === 'explore') action.show('scene');
      else action.hide('scene');
    }
    homeBtn.hidden = calm;
    homeBtn.disabled = s.busy;
    replayBtn.hidden = calm;
    replayBtn.disabled = s.busy;
    graphBox.classList.toggle('off', calm);
    drawGraph();
    syncLabels();
    stage.invalidate();
  }
  function drawGraph() {
    const known = s.quiz ? [] : s.dots;
    const dots = known.map((id) => ({ f: LENSES[id].f / 100, p: powerOf(id), now: id === s.lens && !s.busy }));
    const cur = dots.find((d) => d.now);
    graph.draw({
      dots,
      showCurve: known.length > 0,
      aria: cur ? t('graph_aria', { f: N(cur.f), p: sgn(cur.p) }) : t('graph_aria_none'),
    });
  }

  // ── the action: the big button, the ring on the lens (or the box), a tap on either ──
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const i = SEQ.indexOf(s.scene);
    if (i < SEQ.length - 1) return go(SEQ[i + 1]);
    return quiz.start();
  }
  const lensBox = new THREE.Box3(V(-3, AX - LENS.half - 1.2, -LENS.half - 1.2), V(3, AX + LENS.half + 1.2, LENS.half + 1.2));
  const rayBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_light',
    icon: ICONS.hand,
    target: () => {
      if (s.scene === 'concave20') return null;
      if (s.scene === 'intro') {
        const x = s.v.boxX;
        return rayBox.set(V(x - 6.8, AX - BOX.height / 2, -5.5), V(x + 0.3, AX + BOX.height / 2, 5.5));
      }
      return lensBox;
    },
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), () => boxOf(rotateEl), () => rays.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    if (s.mode === 'quiz') return false;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const targets = s.scene === 'intro' ? [setting.boxHit, setting.lensHit] : [setting.lensHit];
    return raycaster.intersectObjects(targets, false).length > 0;
  }
  // a tap (the finger comes up within 8 px) on the lens or the box does the action; a drag turns the view
  let down = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    audio.unlock();
    down = { x: e.clientX, y: e.clientY, at: now(), hit: pick(canvasPoint(e)) };
  });
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const d = down;
    down = null;
    if (!d?.hit || s.scene === 'concave20') return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || now() - d.at > 600) return;
    doAction();
  });
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = pick(p) && s.scene !== 'concave20' ? 'pointer' : '';
    });
  });

  // ── how to use, in the panel: the rotate pill, the সামনে button, a tap on the lens ──
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'tap', text: t('howto_tap'), when: () => s.scene !== 'concave20', onTap: () => action?.flash() },
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
    if (duration) hintTimer = setTimeout(hintOff, duration);
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
    const L = LENSES[s.lens];
    const img = image();
    return {
      scene: s.scene,
      step: STEP_OF[s.scene],
      lens: s.lens,
      kind: L.kind,
      f: L.f, // cm, a distance
      power: s.showP || s.quiz ? round(powerOf(s.lens), 3) : null, // ডায়াপটার, once the figure has shown it
      image: img && s.v.img > 0.5 ? { kind: img.kind, m: round(img.m, 2), x: round(img.x, 2) } : null,
      dots: [...s.dots],
      question: s.mode === 'quiz' && question ? { ...question } : null,
      busy: s.busy,
      next: SEQ[SEQ.indexOf(s.scene) + 1] ?? 'quiz',
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.scene, snap.busy, snap.mode, snap.view, snap.lens]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the test ────────────────────────────────────────────────────────────────
  /** The five questions: read P off the scale (convex), the book's নিজে করো, the comparison of চিত্র ৯.২৭, read P (concave), the
   * book's glasses. */
  const KINDS = ['read', 'diy', 'compare', 'readNeg', 'glasses'];
  const DIY = {
    a: { lens: 'plus40', u: PENCIL_U, frame: 'diy_a' },
    b: { lens: 'plus20', u: 45, frame: 'diy_b' },
    c: { lens: 'minus20', u: 25, frame: 'diy_c' },
  };
  const IMG_WORDS = ['c_im_up_big', 'c_im_down_big', 'c_im_up_small', 'c_im_down_small'];
  const RIGHT_WORD = { a: 'c_im_up_big', b: 'c_im_down_small', c: 'c_im_up_small' };
  let learnSaved = 'intro';
  let diyVariant = 'a';
  let question = null;
  let picked = -1;
  function choicesOf(items, label, kind) {
    const list = shuffle(items);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="lp-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  /** The scene of a question, landed at once: { source, lens, box, lamp, u, rays, labels, frame }. */
  function setQuestion(q) {
    stopAll();
    s.quiz = q;
    s.dots = [];
    land({ ...q, P: q.labels.lens && q.P });
    flyCamera(0);
    syncScene();
    syncLabels();
    stage.invalidate();
  }
  /** A question's scene and words (the quiz's prepare hook). */
  async function prepareQuestion(i, alive) {
    picked = -1;
    const kind = KINDS[i % KINDS.length];
    const lbl = (...ids) => Object.fromEntries(ids.map((id) => [id, true]));
    if (kind === 'read') setQuestion({ kind, source: 'box', lens: 'plus25', box: 'near', lamp: 1, bar: false, labels: lbl(), frame: 'read' });
    else if (kind === 'readNeg')
      setQuestion({ kind, source: 'box', lens: 'minus25', box: 'far', lamp: 1, bar: false, labels: lbl(), frame: 'readNeg' });
    else if (kind === 'compare')
      setQuestion({ kind, source: 'pencil', lens: 'plus20', box: 'far', u: PENCIL_U, P: true, labels: lbl('lens'), frame: 'pencil' });
    else if (kind === 'glasses')
      setQuestion({ kind, source: 'box', lens: 'plus40', box: 'near', lamp: 0, P: true, labels: lbl('lens'), frame: 'glasses' });
    else {
      const d = DIY[diyVariant];
      setQuestion({ kind, variant: diyVariant, source: 'pencil', lens: d.lens, box: 'far', u: d.u, rays: false, labels: lbl(), frame: d.frame });
      // F (and F′ for a convex lens) marked, as the book's exercise draws them; no rays yet
      s.v.F = 1;
      s.v.F2 = LENSES[d.lens].kind === 'convex' ? 1 : 0;
      s.v.O = 1;
    }
    await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
    if (!alive()) return null;
    question = { kind };
    if (kind === 'read' || kind === 'readNeg') {
      const id = kind === 'read' ? 'plus25' : 'minus25';
      return { text: t(kind === 'read' ? 'q_read' : 'q_read_neg'), ...choicesOf(powerChoices(id), (x) => t('c_power', { p: sgn(x.p) }), kind) };
    }
    if (kind === 'compare')
      return {
        text: t('q_compare'),
        ...choicesOf(
          ['c_cmp_small', 'c_cmp_big', 'c_cmp_same', 'c_cmp_flip'].map((key) => ({ key })),
          (x) => t(x.key),
          kind,
        ),
      };
    if (kind === 'glasses')
      return {
        text: t('q_glasses'),
        ...choicesOf(
          ['c_gl_right', 'c_gl_p', 'c_gl_cm', 'c_gl_ten'].map((key) => ({ key })),
          (x) => t(x.key),
          kind,
        ),
      };
    const right = RIGHT_WORD[diyVariant];
    const words = [right, ...IMG_WORDS.filter((w) => w !== right)].map((key) => ({ key }));
    return { text: t(`q_diy_${diyVariant}`), ...choicesOf(words, (x) => t(x.key), kind) };
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 3, feedback: 3 },
    action,
    hooks: {
      enter() {
        learnSaved = s.scene;
        s.mode = 'quiz';
        s.locked = true;
        diyVariant = shuffle(['a', 'b', 'c'])[0];
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        syncUI();
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        const q = await prepareQuestion(i, alive);
        if (q && question) question.right = q.expected;
        return q;
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${map[wrongKey]}` : '');
        if (k === 'read' || k === 'readNeg') {
          const id = k === 'read' ? 'plus25' : 'minus25';
          const vars = { p: sgn(powerOf(id)), f: LENSES[id].f, fm: metres(LENSES[id].f) };
          const sign = k === 'read' ? 'mis_sign_pos' : 'mis_sign_neg';
          return t(k === 'read' ? 'why_read' : 'why_read_neg', vars) + note({ cm: t('mis_cm'), f: t('mis_f'), sign: t(sign) });
        }
        if (k === 'compare') {
          showAnswerScene();
          return (
            t('why_compare', { m0: round(imageOf('plus40', PENCIL_U).m, 1) }) +
            note({ c_cmp_big: t('mis_cmp_big'), c_cmp_same: t('mis_cmp_same'), c_cmp_flip: t('mis_cmp_flip') })
          );
        }
        if (k === 'glasses') return t('why_glasses') + note({ c_gl_p: t('mis_gl_p'), c_gl_cm: t('mis_gl_cm'), c_gl_ten: t('mis_gl_ten') });
        showAnswerScene();
        const d = DIY[diyVariant];
        const img = imageOf(d.lens, d.u);
        const real = img.kind === 'real';
        const big = img.m > 1;
        let mis = '';
        if (wrongKey) {
          const wrongReal = wrongKey.includes('down');
          const wrongBig = wrongKey.includes('big');
          if (wrongReal !== real) mis = t(real ? 'mis_im_virtual' : 'mis_im_real');
          else if (wrongBig !== big) mis = t('mis_im_size', { which: t(big ? 'w_big' : 'w_small') });
        }
        return t(`why_diy_${diyVariant}`, { m: round(img.m, 2) }) + (mis ? ` ${mis}` : '');
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });
  /** After an answer the picture shows it: the rays and the image of the নিজে করো; the weaker lens of the comparison. */
  function showAnswerScene() {
    if (!s.quiz) return;
    const q = s.quiz;
    stopAll();
    const my = s.run;
    if (q.kind === 'compare') {
      play({ source: 'pencil', lens: 'plus40', box: 'far', u: PENCIL_U, P: true }, my);
      return;
    }
    q.rays = true;
    const goal = targetOf({ ...q, rays: true });
    (async () => {
      if (!(await tweenTo({ pIn: 1 }, T.in, my, 'step', ease.linear))) return;
      if (!(await tweenTo({ pOut: 1 }, T.out, my, 'step', ease.linear))) return;
      if (goal.pExt && !(await tweenTo({ pExt: 1 }, T.ext, my, 'step', ease.linear))) return;
      await tweenTo({ img: 1 }, T.img, my);
    })();
  }

  // ── buttons, keys ───────────────────────────────────────────────────────────
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
  function goHome() {
    return go('intro', { animate: false });
  }
  /** A step word: its first scene (the second of a step only by the action). */
  function goStep(step) {
    if (STEP_OF[s.scene] === step && !s.busy) return replay();
    if (s.busy && STEP_OF[s.scene] === step) return;
    go(SEQ.find((sc) => STEP_OF[sc] === step));
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && s.mode === 'explore') goStep(b.dataset.example);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'home') goHome();
    else if (b.dataset.act === 'replay') replay();
    else if (b.dataset.act === 'q-next') quiz.next();
    else if (b.dataset.act === 'q-again') quiz.start();
    else if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowRight' && !onButton) {
      if (s.scene !== 'concave20') doAction();
    } else if (k === 'ArrowLeft' && !onButton) go(SEQ[Math.max(1, SEQ.indexOf(s.scene) - 1)]);
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  root.classList.toggle('lp-side', side());
  const start = SEQ.includes(o.scene) ? o.scene : 'intro';
  s.scene = start;
  s.dots = DOTS[start] ?? [];
  land(SCENES[start]);
  syncUI();
  applyCamera();
  syncScene();
  refresh();
  if (s.view === '3d') setView('3d', { animate: false });
  // the parts of later steps (hidden now) get their shaders ready while the student reads the first card
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
    getState: snapshot,
    /** Change any of: scene (one of SEQ), step (one of STEPS: its first scene), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      const scene = p.scene ?? (p.step ? SEQ.find((sc) => STEP_OF[sc] === p.step) : null);
      if (scene && SEQ.includes(scene) && s.mode !== 'quiz') await go(scene, { animate });
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await setView('front', { animate: false });
      await goHome();
      refresh();
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
      if (!ctx) return '';
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
    /** The bench with the lens in the cradle now, the ray box and the pencil's stand, in cm (exported in metres). */
    exportRoot: () => setting.exportParts(s.lens),
    /** For the figure's own tests: the boxes (canvas px) along the rays drawn now, which no label may cover. */
    rayBoxes: () => rays.boxes().map((b) => ({ ...b })),
  };
}
