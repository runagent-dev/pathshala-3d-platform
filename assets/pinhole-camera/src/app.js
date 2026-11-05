// The pinhole camera (book p222, topic 8.3.1, চিত্র ৮.১৪): the student view. A burning candle, a board and a sheet of white
// paper on a rail in a dark room. The board stops the light, so the paper is dark; the student pricks a hole and a real,
// upside-down flame lands on the paper. Then the ray from the flame's tip and the ray from its base, crossing at the hole;
// the paper dragged back and forth; a bigger hole; and the tiny hole again, sharp at every distance. The camera goes close at
// each step. The image is the flame's own picture read through the straight lines of reading.js, so it flickers with it.
// The panel is the kit's clean sheet: one action, one result, one rule.
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
import { fitPose } from './camera.js';
import { createDiagram } from './diagram.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import {
  blurDiameter,
  brightness,
  clampU,
  clampV,
  FLAME,
  HOLE_Y,
  HOLES,
  imageLength,
  imageSide,
  magnification,
  PAPER,
  points,
  RAIL_BAR,
  round,
  shuffle,
  STEP_DRAG,
  U,
  V,
} from './reading.js';
import { createSetting, frameOf } from './setting.js';

export const DEFAULTS = {
  stage: 0, // how far the story has come, 0 … 6
  u: U.start, // the candle's distance from the board, cm
  v: V.start, // the paper's distance from the board, cm
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

const LAST = 6;
const STEPS = ['hole', 'x', 'y', 'drag', 'big', 'tiny', 'again'];
const WORDS = ['real', 'inverted', 'bigger', 'sharp'];
const FRAME_AT = ['start', 'both', 'rays', 'drag', 'drag', 'big', 'drag'];
const NEXT_WORD = ['real', 'inverted', 'inverted', 'bigger', 'sharp', 'sharp', null];
const WORD_AT = [null, 'real', 'inverted', 'inverted', 'bigger', null, 'sharp']; // a blurred image is not স্পষ্ট
const IDLE_AFTER = 20; // s: the flame holds still after this long with nothing touched
const SHOWN_V = 24; // where the action's own slide of the paper ends, cm: twice the candle's distance
const BOARD_THIN = 0.42;
const MARGINS = { top: 12, bottom: 12, side: 10 };
const INK = '#212529';
const dirFrom = (az, el, out) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'ph');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: the sheet of one action, one result, one rule ────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: WORDS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const graph = createGraph(t);
  ui.learn.appendChild(graph.el);
  const caption = document.createElement('p');
  caption.className = 'ph-cap';
  caption.innerHTML = t('cap_book');
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'ph-note';
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 4, far: 900, environmentIntensity: 0.32 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(55);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-72);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(-6);
  const setting = createSetting({ stage, shadow: Boolean(o.shadow), num: N });
  const dia = createDiagram({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    stage: Math.max(0, Math.min(LAST, Math.round(Number(o.stage)) || 0)),
    u: clampU(Number(o.u) || U.start),
    v: clampV(Number(o.v) || V.start),
    d: HOLES.none,
    image: 0, // how far the image has come, 0 … 1
    thin: 1, // the board's opacity
    seen: new Set(),
    from: { u: U.start, v: V.start }, // where the drag step began
    busy: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    frame: 'start',
    drag: null,
    bigLabel: false,
  };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // the flame breathes, 24 times a second at most and 12 in the test: only the picture changes, so no shadow map is redrawn.
  // After 20 s with nothing touched it holds still, so a page left open costs nothing; any touch or key wakes it.
  let flameTime = 0;
  let flameWait = 0;
  let idle = 0;
  const wake = () => {
    idle = 0;
  };
  const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  setting.flick(0);
  if (!still) {
    root.addEventListener('pointerdown', wake, { capture: true });
    root.addEventListener('pointermove', wake, { capture: true, passive: true });
    root.addEventListener('keydown', wake, { capture: true });
    stage.addTicker((dt) => {
      idle += dt;
      if (idle > IDLE_AFTER) return false;
      flameTime += dt;
      flameWait += dt;
      if (flameWait < 1 / (s.mode === 'quiz' ? 12 : 24)) return false;
      flameWait = 0;
      setting.flick(flameTime);
      return 'camera';
    });
  }

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  /** The state's numbers go to the model and the drawing. */
  function apply() {
    const v = dia.view;
    v.u = s.u;
    v.v = s.v;
    v.d = s.d;
    setting.place(s.u, s.v);
    setting.hole(s.d);
    setting.image(s.image);
    setting.boardAlpha(s.thin);
    note.textContent = t(s.thin < 1 ? 'note_board' : 'note_drawn');
    stage.invalidate();
  }
  /** Everything as it stands when step `stage` is finished, at once. */
  function settle() {
    const v = dia.view;
    const n = s.stage;
    s.d = n === 0 ? HOLES.none : n === 5 ? HOLES.big : HOLES.tiny;
    s.image = n >= 1 ? 1 : 0;
    s.thin = n >= 2 ? BOARD_THIN : 1;
    v.x.k = n >= 2 ? 1 : 0;
    v.y.k = n >= 3 ? 1 : 0;
    v.x.half = false;
    v.x.shine = 0;
    v.y.shine = 0;
    v.fan = n >= 3 && n !== 5 ? 1 : 0;
    v.spread = n === 5 ? 1 : 0;
    v.pulse = -1;
    v.bars = n >= 3 ? 1 : 0;
    v.lengths = n >= 3 ? 1 : 0;
    v.imageLength = true;
    v.point = n >= 2 ? 1 : 0;
    v.marks = [];
    s.frame = FRAME_AT[n];
    apply();
  }

  const RUNS = ['hole', 'pulse', 'image', 'thin', 'grow', 'fan', 'shine', 'camera', 'paper', 'bars'];
  function stopRun() {
    ++token;
    for (const k of RUNS) tweener.cancel(k);
    s.busy = false;
  }
  /** A run of one step: its token, and tweens that stop when the token changes. */
  function begin() {
    stopRun();
    const my = token;
    const alive = () => my === token;
    s.busy = true;
    clearLabels();
    draw();
    const tween = (key, duration, onUpdate, e = ease.inOutSine, delay = 0) =>
      tweener.animate({
        key,
        duration,
        ease: e,
        delay,
        onUpdate: (k) => {
          if (alive()) {
            onUpdate(k);
            apply();
          }
        },
      }).finished;
    return { alive, tween };
  }
  function finish(stageNow, word) {
    s.stage = stageNow;
    if (word) s.seen.add(word);
    s.busy = false;
    audio.tick();
    draw();
    emitChange();
  }
  const moveTo = async (tween, alive, key, to, duration) => {
    const a = s.v;
    await tween(key, duration, (k) => {
      s.v = clampV(a + (to - a) * k);
    });
    return alive();
  };
  const moveCandle = async (tween, alive, to, duration) => {
    const a = s.u;
    await tween('paper', duration, (k) => {
      s.u = clampU(a + (to - a) * k);
    });
    return alive();
  };

  /** The steps, each told by the camera: it goes to the place first, and only then the new thing happens. */
  const RUN = {
    async hole() {
      const { alive, tween } = begin();
      const v = dia.view;
      await fly('hole', 0.9);
      if (!alive()) return;
      s.d = HOLES.tiny;
      v.point = 0;
      audio.pop();
      apply();
      await tween('hole', 0.3, () => {});
      if (!alive()) return;
      // back to see the candle and the paper together, and only then the first light goes through
      await fly('both', 1);
      if (!alive()) return;
      const going = tween('pulse', 1.5, (k) => (v.pulse = 1.55 * k), ease.linear);
      const showing = tween(
        'image',
        0.7,
        (k) => {
          s.image = Math.max(k, 0.01);
          draw();
        },
        ease.inOutSine,
        0.92,
      );
      await Promise.all([going, showing]);
      if (!alive()) return;
      v.pulse = -1;
      finish(1, 'real');
    },
    async x() {
      const { alive, tween } = begin();
      const v = dia.view;
      const flying = fly('rays', 1);
      const thin = s.thin;
      await Promise.all([flying, tween('thin', 0.8, (k) => (s.thin = thin + (BOARD_THIN - thin) * k))]);
      if (!alive()) return;
      v.x.shine = 1;
      await tween('grow', 1.3, (k) => (v.x.k = k), ease.inOutCubic);
      if (!alive()) return;
      v.point = 1;
      finish(2);
      await tween('shine', 1, (k) => (v.x.shine = 1 - k));
    },
    async y() {
      const { alive, tween } = begin();
      const v = dia.view;
      v.y.shine = 1;
      await tween('grow', 1.3, (k) => (v.y.k = k), ease.inOutCubic);
      if (!alive()) return;
      v.point = 1;
      await tween('fan', 0.5, (k) => (v.fan = k));
      if (!alive()) return;
      s.from = { u: s.u, v: s.v };
      finish(3, 'inverted');
      const my = token;
      await tween('shine', 1, (k) => (v.y.shine = 1 - k));
      if (my !== token) return;
      // room for the drag, with the lengths and distances coming in; the student has had time to see the crossing
      const coming = tween(
        'bars',
        0.8,
        (k) => {
          v.bars = k;
          v.lengths = k;
        },
        ease.inOutSine,
        0.7,
      );
      await Promise.all([coming, fly('drag', 0.9, 0.7)]);
      if (my === token) draw();
    },
    async drag() {
      const { alive, tween } = begin();
      const v = dia.view;
      if (s.frame !== 'drag' || camK < 1) await fly('drag', 0.8);
      if (!alive()) return;
      v.bars = 1;
      v.lengths = 1;
      if (!(await moveTo(tween, alive, 'paper', s.v === SHOWN_V ? V.start : SHOWN_V, 1.3))) return;
      finish(4, 'bigger');
    },
    async big() {
      const { alive, tween } = begin();
      const v = dia.view;
      await fly('big', 1);
      if (!alive()) return;
      s.bigLabel = true;
      const d = s.d;
      await tween('hole', 1.3, (k) => {
        s.d = d + (HOLES.big - d) * k;
        v.spread = k;
        v.fan = 1 - k;
      });
      if (!alive()) return;
      finish(5);
    },
    async tiny() {
      const { alive, tween } = begin();
      const v = dia.view;
      if (s.frame !== 'big' || camK < 1) await fly('big', 0.8);
      if (!alive()) return;
      const d = s.d;
      await tween('hole', 0.9, (k) => {
        s.d = d + (HOLES.tiny - d) * k;
        v.spread = 1 - k;
        v.fan = k;
      });
      if (!alive()) return;
      s.bigLabel = false;
      await fly('drag', 0.9);
      if (!alive()) return;
      // near and far: sharp all the way
      if (!(await moveTo(tween, alive, 'paper', V.min, 1.3))) return;
      if (!(await moveTo(tween, alive, 'paper', V.max, 1.9))) return;
      if (!(await moveTo(tween, alive, 'paper', V.start, 1))) return;
      finish(6, 'sharp');
      audio.success();
    },
  };

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function poseNow() {
    const f = frameOf(s.frame, s.u, s.v);
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
    controls.update();
  }
  /** The camera goes to a frame. Its promise settles when it arrives (or a finger takes over). */
  function fly(frame, duration = 0.8, delay = 0) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      s.view = 'front';
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    s.frame = frame;
    camK = 0;
    return tweener.animate({
      key: 'camera',
      duration,
      delay,
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
    syncUI();
    if (animate) fly(s.frame, 0.8);
    else camK = 1;
    stage.invalidate();
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
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
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    setting.face(camera);
  });

  // ── labels on the picture: few and short, each pinned to what it names ───────────────────────────────────
  let action = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, ui.$('.pvc-panel-toggle'), () => dia.boxes(), () => dia.flameBox(), () => action?.ringBox()],
  });
  const shown = new Map();
  const pts = new Map();
  /** A label pinned to a world point. `spots` are the places it may take, best first. */
  function label(id, on, text, x, y, z, spots) {
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
      anno.add(id, { text, point: () => pts.get(id), color: INK, spots, kind: 'part' });
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
    candle: [
      { dx: -20, dy: 34 },
      { dx: 20, dy: 34 },
      { dx: -30, dy: 10 },
    ],
    board: [
      { dx: 0, dy: -16 },
      { dx: 0, dy: 16 },
    ],
    paper: [
      { dx: 0, dy: -16 },
      { dx: 0, dy: 18 },
      { dx: 20, dy: 20 },
    ],
    hole: [
      { dx: -22, dy: -40 },
      { dx: 22, dy: -40 },
      { dx: -22, dy: 40 },
      { dx: 22, dy: 40 },
    ],
    image: [
      { dx: 0, dy: 44 },
      { dx: 0, dy: -44 },
      { dx: 44, dy: 0 },
    ],
    x: [
      { dx: -16, dy: -12 },
      { dx: -12, dy: -22 },
      { dx: 16, dy: -16 },
    ],
    y: [
      { dx: -34, dy: 6 },
      { dx: -34, dy: 24 },
      { dx: -22, dy: 14 },
      { dx: 34, dy: 8 },
    ],
    l: [
      { dx: -14, dy: 0 },
      { dx: -14, dy: -24 },
      { dx: -14, dy: 24 },
      { dx: 34, dy: -44 },
      { dx: 36, dy: 40 },
    ],
    below: [
      { dx: 14, dy: 16 },
      { dx: -14, dy: 16 },
      { dx: 18, dy: 0 },
    ],
    above: [
      { dx: 14, dy: -16 },
      { dx: -14, dy: -16 },
      { dx: 18, dy: 0 },
    ],
    bar: [
      { dx: 0, dy: 16 },
      { dx: 0, dy: -16 },
    ],
    flame: [
      { dx: -22, dy: -22 },
      { dx: 22, dy: -22 },
      { dx: -30, dy: 2 },
      { dx: -34, dy: 34 },
      { dx: 36, dy: 34 },
    ],
    mark: [
      { dx: 18, dy: 0 },
      { dx: -18, dy: 0 },
    ],
    length: [
      { dx: 18, dy: 0 },
      { dx: 18, dy: -18 },
      { dx: 18, dy: 18 },
      { dx: 54, dy: 0 },
      { dx: -44, dy: -46 },
      { dx: -44, dy: 46 },
    ],
  };
  function labels() {
    const q = s.quiz;
    const f = s.frame;
    const calm = !s.busy && camK >= 1;
    const g = points(s.u, s.v);
    const wide = !q && f === 'drag';
    const close = !q && f === 'rays';
    const both = !q && f === 'both';
    const big = !q && f === 'big';
    const P = PAPER.height / 2;
    label('candle', calm && !q && f === 'start', t('l_candle'), -s.u, 8, 1.2, SPOTS.candle);
    label('board', calm && !q && (f === 'start' || both), t('l_board'), 0, HOLE_Y + 7, 0, SPOTS.board);
    label('paper', calm && !q && f === 'start', t('l_paper'), s.v, HOLE_Y + P - 2.5, 0, SPOTS.paper);
    label('flame', calm && !q && (f === 'start' || both), t('l_flame'), -s.u, FLAME.tip - 1, 0, SPOTS.flame);
    const holeShown = calm && (s.d > 0 || q?.hole) && (close || big || f === 'hole' || q?.hole);
    label('hole', holeShown, t(s.d > 0.3 ? 'l_hole_big' : 'l_hole'), 0, HOLE_Y, 0, SPOTS.hole);
    const imageOn = calm && (both || big || q?.imageNamed) && s.image >= 1;
    label('image', imageOn, t(s.d > 0.3 ? 'l_image_blur' : 'l_image'), s.v, g.X1.y + 0.3, 0, SPOTS.image);

    const letters = calm && (close || wide || q?.letters);
    const landed = calm && (close || wide || big);
    label('x', letters, t('l_x'), g.X.x, g.X.y, 0, SPOTS.x);
    label('y', letters && !q, t('l_y'), g.Y.x, g.Y.y, 0, SPOTS.y);
    label('x1', (landed && dia.view.x.k >= 1) || (calm && q?.landed), t('l_x1'), g.X1.x, g.X1.y, 0, SPOTS.below);
    label('y1', landed && dia.view.y.k >= 1, t('l_y1'), g.Y1.x, g.Y1.y, 0, SPOTS.above);

    const measures = calm && (wide || q?.measures) && dia.view.bars >= 1;
    label('u', measures, t('l_u', { x: s.u }), -s.u / 2, 0.04, RAIL_BAR, SPOTS.bar);
    label('v', measures, t('l_v', { x: s.v }), s.v / 2, 0.04, RAIL_BAR, SPOTS.bar);
    label('l', measures, t('l_l', { x: FLAME.length }), -s.u, HOLE_Y, -2.2, SPOTS.l);
    label(
      'l1',
      measures && dia.view.imageLength,
      t('l_l1', { x: round(imageLength(s.u, s.v), 1) }),
      s.v - 0.1,
      HOLE_Y,
      imageSide(s.u, s.v),
      SPOTS.length,
    );
    for (let i = 0; i < 4; i++) {
      const m = dia.view.marks[i];
      label(`m${i}`, calm && m, m ? m.tag : '', s.v, m ? m.y : 0, 0, SPOTS.mark);
    }
    anno.update();
  }
  stage.onAfterRender(labels);

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    if (s.busy) return;
    const step = STEPS[s.stage];
    if (step === 'again') return home();
    return RUN[step]();
  }
  /** The words: the place in the story where each one is found. */
  function pick(word) {
    if (s.locked) return lockedNudge();
    if (!WORDS.includes(word)) return;
    audio.unlock();
    stopRun();
    clearLabels();
    if (word === 'real') {
      goTo(1);
    } else if (word === 'inverted') {
      goTo(3, 'rays');
    } else if (word === 'bigger') {
      goTo(3);
      RUN.drag();
    } else {
      // from the blurred image back to the sharp one: স্পষ্ট is what the tiny hole gives
      const was = s.frame;
      s.stage = 5;
      s.bigLabel = true;
      s.from = { u: s.u, v: s.v };
      settle();
      s.frame = was;
      RUN.tiny();
    }
  }
  function goTo(n, frame) {
    const was = s.frame;
    s.stage = n;
    s.from = { u: s.u, v: s.v };
    settle();
    s.frame = was;
    fly(frame || FRAME_AT[n], 0.9);
    draw();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  /** The step the words describe: while the hole opens the image is already coming, and the sweep shows the tiny hole again. */
  const told = () => (s.stage === 0 && s.image > 0 ? 1 : s.stage);
  function outcome() {
    const n = told();
    const moved = s.u !== s.from.u || s.v !== s.from.v;
    if (n === 3 && !moved && !s.busy) return t('out_3');
    if (n === 3 || n === 4 || (n === 5 && s.busy && !s.bigLabel)) {
      const lp = imageLength(s.u, s.v);
      const exact = Math.abs(lp - round(lp, 1)) < 1e-6;
      return t('out_size', { l: FLAME.length, u: s.u, v: s.v, lp: round(lp, 1), eq: exact ? '=' : '≈' });
    }
    if (n === 5) return t('out_5', { b: N(round(blurDiameter(s.d, s.u, s.v), 1)) });
    return t(`out_${n}`);
  }
  const ACTIONS = {
    hole: ['act_hole', 1, ICONS.hand],
    x: ['act_x', 2, ICONS.hand],
    y: ['act_y', 3, ICONS.hand],
    drag: ['act_drag', 4, ICONS.drag],
    big: ['act_big', 5, ICONS.hand],
    tiny: ['act_tiny', 6, ICONS.hand],
    again: ['act_again', '', ICONS.reset],
  };
  function panel() {
    if (s.quiz) return;
    sheet.outcome(outcome());
    sheet.rule(t(`rule_${s.stage === 5 && !s.bigLabel ? 6 : told()}`));
    sheet.choose(WORD_AT[s.stage]);
    sheet.next(NEXT_WORD[s.stage]);
    graph.show(s.stage >= 3 && s.stage !== 5, s.u, s.v);
    const [word, step, icon] = s.busy ? ['act_wait', '', ICONS.hand] : ACTIONS[STEPS[s.stage]];
    const enabled = !s.busy;
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
  }
  function draw() {
    wake();
    panel();
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  const holeAt = new THREE.Vector3(0, HOLE_Y, 0);
  const aim = new THREE.Vector3();
  function targetNow() {
    if (s.locked || s.busy || camK < 1) return null;
    const step = STEPS[s.stage];
    if (step === 'hole' || step === 'big' || step === 'tiny') return holeAt;
    if (step === 'x') return aim.set(-s.u, FLAME.tip, 0);
    if (step === 'y') return aim.set(-s.u, FLAME.base, 0);
    if (step === 'drag') return aim.set(s.v, HOLE_Y - PAPER.height / 2 + 2.6, -5);
    return null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_hole',
    target: targetNow,
    radius: 24,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes(), () => dia.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── dragging the paper and the candle; a tap on the marked part is the action ───────────────────────────
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function grabAt(x, y, touch) {
    if (s.locked || s.busy || s.stage < 3 || s.frame !== 'drag' || camK < 1) return null;
    const slack = touch ? 22 : 10;
    const bottom = HOLE_Y - PAPER.height / 2;
    const top = HOLE_Y + PAPER.height / 2;
    const c = [
      dia.screen(s.v, bottom, -PAPER.width / 2),
      dia.screen(s.v, bottom, PAPER.width / 2),
      dia.screen(s.v, top, -PAPER.width / 2),
      dia.screen(s.v, top, PAPER.width / 2),
    ];
    const xs = c.map((p) => p.x);
    const ys = c.map((p) => p.y);
    if (x > Math.min(...xs) - slack && x < Math.max(...xs) + slack && y > Math.min(...ys) - slack && y < Math.max(...ys) + slack) return 'paper';
    const a = dia.screen(-s.u, 1, 0);
    const b = dia.screen(-s.u, FLAME.tip + 1, 0);
    if (Math.abs(x - (a.x + b.x) / 2) < (touch ? 40 : 28) && y > b.y - slack && y < a.y + slack) return 'candle';
    return null;
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      const p = hostXY(e);
      down = { x: p.x, y: p.y, at: performance.now() };
      const what = grabAt(p.x, p.y, e.pointerType === 'touch');
      if (!what) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      s.drag = { what, id: e.pointerId, x: p.x, y: p.y, u: s.u, v: s.v };
      action.hide('drag');
      audio.unlock();
      emit('dragstart', { part: what });
      e.preventDefault();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    const at = g.what === 'paper' ? g.v : -g.u;
    const a = dia.screen(at, HOLE_Y, 0);
    const b = dia.screen(at + 1, HOLE_Y, 0);
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const cm = ((p.x - g.x) * tx + (p.y - g.y) * ty) / Math.max(0.01, tx * tx + ty * ty);
    const was = [s.u, s.v];
    if (g.what === 'paper') s.v = clampV(g.v + cm);
    else s.u = clampU(g.u - cm);
    if (was[0] !== s.u || was[1] !== s.v) {
      if ((s.u + s.v) % 3 === 0) audio.tick();
      apply();
      draw();
      emitChange();
    }
  });
  /** Enough of a move has shown the change. */
  function movedEnough() {
    if (s.stage === 3 && (Math.abs(s.v - s.from.v) >= STEP_DRAG || Math.abs(s.u - s.from.u) >= STEP_DRAG)) finish(4, 'bigger');
  }
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked;
    action.show('drag');
    emit('dragend', { part: g.what });
    movedEnough();
    draw();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    endDrag(e);
    if (!down) return;
    const p = hostXY(e);
    const moved = Math.hypot(p.x - down.x, p.y - down.y);
    const quick = performance.now() - down.at < 600;
    down = null;
    if (moved > 8 || !quick) return;
    const target = targetNow();
    if (!target || STEPS[s.stage] === 'drag') return;
    const a = dia.screen(target.x, target.y, target.z);
    if (Math.hypot(a.x - p.x, a.y - p.y) < 44) act();
  });
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  let order = [];
  let rounds = 0; // the candle's question and the paper's take turns
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  /** The scene of a question: everything set by hand, so that no earlier scene or step shows through. */
  function quizScene(q, scene) {
    stopRun();
    const v = dia.view;
    s.u = scene.u;
    s.v = scene.v;
    s.d = scene.d ?? HOLES.tiny;
    s.image = scene.image ? 1 : 0;
    s.thin = scene.thin ? BOARD_THIN : 1;
    v.x.k = scene.rays ? 1 : 0;
    v.y.k = scene.rays ? 1 : 0;
    v.x.half = false;
    v.x.shine = 0;
    v.y.shine = 0;
    v.fan = scene.rays ? 1 : 0;
    v.spread = 0;
    v.pulse = -1;
    v.bars = scene.measures ? 1 : 0;
    v.lengths = scene.measures ? 1 : 0;
    v.imageLength = Boolean(scene.imageLength);
    v.point = scene.hole || scene.rays ? 1 : 0;
    v.marks = [];
    s.frame = scene.frame;
    s.quiz = { ...q, measures: Boolean(scene.measures), hole: Boolean(scene.hole), letters: Boolean(scene.letters), landed: false };
    clearLabels();
    apply();
  }
  const Q = {
    flip() {
      const u = 10;
      const v = 25;
      quizScene({ kind: 'flip' }, { u, v, hole: true, thin: true, letters: true, frame: 'rays' });
      dia.view.x.k = 1;
      dia.view.x.half = true;
      // three heights below the hole test the line's slope; the one above is the old mistake that light bends back.
      // The letters are dealt afresh each time
      const place = [
        ['up', HOLE_Y + 4],
        ['shallow', HOLE_Y - 2],
        ['right', HOLE_Y - 5],
        ['steep', HOLE_Y - 8],
      ];
      const tags = shuffle([0, 1, 2, 3]).map((i) => t(`tag_${i}`));
      dia.view.marks = place.map(([, y], i) => ({ y, tag: tags[i] }));
      const tagOf = Object.fromEntries(place.map(([k], i) => [k, tags[i]]));
      const wrong = ['shallow', 'steep', 'up'];
      return {
        text: t('q_flip'),
        answer: 'right',
        wrong,
        label: (k) => t('c_mark', { x: tagOf[k] }),
        notes: notesOf(wrong.map((k) => [k, t(`n_flip_${k}`)])),
        reveal: t('a_flip', { x: tagOf.right }),
        after() {
          dia.view.x.half = false;
          s.image = 1;
          s.quiz.landed = true;
          dia.view.marks = [];
        },
      };
    },
    size() {
      const [u, v] = shuffle([
        [10, 25],
        [12, 27],
        [9, 27],
      ])[0];
      quizScene({ kind: 'size' }, { u, v, measures: true, frame: 'drag' });
      const l = FLAME.length;
      const lp = round(imageLength(u, v), 1);
      const inverse = round((l * u) / v, 1);
      const gap = v - u;
      const wrong = [l, inverse, gap];
      const names = { [l]: 'same', [inverse]: 'inverse', [gap]: 'gap' };
      return {
        text: t('q_size'),
        answer: lp,
        wrong,
        label: (k) => t('c_cm', { x: k }),
        notes: notesOf(wrong.map((k) => [k, t(`n_size_${names[k]}`)])),
        reveal: t('a_size', { l, u, v, lp }),
        after() {
          s.image = 1;
          dia.view.imageLength = true;
        },
      };
    },
    far() {
      quizScene({ kind: 'far' }, { u: 12, v: 12, image: true, measures: true, imageLength: true, frame: 'drag' });
      const wrong = ['bright', 'same', 'small'];
      return {
        text: t('q_far'),
        answer: 'right',
        wrong,
        label: (k) => t(`c_far_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_far_${k}`)])),
        reveal: t('a_far'),
        after() {
          const { alive, tween } = begin();
          s.busy = false;
          moveTo(tween, alive, 'paper', 24, 1.2);
        },
      };
    },
    near() {
      const from = 18;
      const to = 9;
      quizScene({ kind: 'near' }, { u: from, v: 18, image: true, measures: true, imageLength: true, frame: 'drag' });
      const wrong = ['small', 'same', 'upright'];
      return {
        text: t('q_near', { a: from, b: to }),
        answer: 'right',
        wrong,
        label: (k) => t(`c_near_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_near_${k}`)])),
        reveal: t('a_near', { a: round(imageLength(from, 18), 1), b: round(imageLength(to, 18), 1) }),
        after() {
          const { alive, tween } = begin();
          s.busy = false;
          moveCandle(tween, alive, to, 1.2);
        },
      };
    },
    blur() {
      quizScene({ kind: 'blur' }, { u: U.start, v: V.start, d: HOLES.big, image: true, thin: true, frame: 'both' });
      const wrong = ['far', 'near', 'flicker'];
      return {
        text: t('q_blur'),
        answer: 'right',
        wrong,
        label: (k) => t(`c_blur_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_blur_${k}`)])),
        reveal: t('a_blur'),
        after() {
          s.quiz.hole = true;
          s.quiz.imageNamed = true;
        },
      };
    },
    real() {
      quizScene({ kind: 'real' }, { u: U.start, v: V.start, image: true, thin: true, rays: true, frame: 'both' });
      const wrong = ['inverted', 'seems', 'white'];
      return {
        text: t('q_real'),
        answer: 'right',
        wrong,
        label: (k) => t(`c_real_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_real_${k}`)])),
        reveal: t('a_real'),
      };
    },
  };
  const saved = { stage: 0, u: U.start, v: V.start, seen: [] };
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
        stopRun(); // a step cut short by the test does not count
        s.mode = 'quiz';
        s.locked = true;
        if (s.drag) {
          s.drag = null;
          controls.enabled = true;
          action.show('drag');
        }
        saved.stage = s.stage;
        saved.u = s.u;
        saved.v = s.v;
        saved.seen = [...s.seen];
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
        s.v = saved.v;
        s.seen = new Set(saved.seen);
        s.from = { u: s.u, v: s.v };
        s.bigLabel = s.stage === 5;
        clearLabels();
        const was = s.frame;
        settle();
        const frame = s.frame;
        s.frame = was;
        syncUI();
        fly(frame, 0.5);
        draw();
      },
      async prepare(i, alive, say) {
        // each round, also "again"; in this order no scene gives away a later answer
        if (i === 0) order = ['flip', 'size', rounds++ % 2 ? 'far' : 'near', 'blur', 'real'];
        const q = Q[order[i]]();
        qCurrent = q;
        say(q.text);
        const frame = s.frame;
        const done = await fly(frame, 0.5);
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
          label: (k) => q.label(list[k]),
          meta: { kind: order[i], answer: q.answer },
        };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        if (s.quiz) q.after?.();
        apply();
        const chosen = picked ? q.list[picked.value] : null;
        const why = !correct && picked ? q.notes.get(String(chosen)) : '';
        // the note names what the student chose: alone it could be read as being about the right answer
        return `${q.reveal}${why ? ` <span class="ph-why">${t('n_pick', { x: q.label(chosen) })} ${why}</span>` : ''}`;
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
    stopRun();
    s.stage = 0;
    s.seen.clear();
    s.u = U.start;
    s.v = V.start;
    s.from = { u: s.u, v: s.v };
    s.bigLabel = false;
    clearLabels();
    const was = s.frame;
    settle();
    s.frame = was;
    fly('start', 0.8);
    draw();
    emitChange();
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  let lastTap = { what: '', at: 0 };
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
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
    if (act_ === 'home') home();
    if (act_ === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const paper = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    const candle = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (paper || candle) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (s.busy || s.stage < 3 || s.frame !== 'drag') return;
      s.v = clampV(s.v + (paper || 0));
      s.u = clampU(s.u + (candle || 0));
      apply();
      movedEnough();
      draw();
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
    const v = dia.view;
    return {
      stage: s.stage,
      step: STEPS[s.stage],
      u: s.u,
      v: s.v,
      hole: s.d === 0 ? 'none' : s.d <= HOLES.tiny ? 'tiny' : 'big',
      d: s.d,
      m: round(magnification(s.u, s.v), 3),
      length: FLAME.length,
      imageLength: round(imageLength(s.u, s.v), 3),
      blur: round(blurDiameter(s.d, s.u, s.v), 3),
      brightness: round(brightness(s.d, s.v), 3),
      image: s.image >= 1,
      rays: [v.x.k >= 1 && !v.x.half ? 'x' : null, v.y.k >= 1 ? 'y' : null].filter(Boolean),
      seen: WORDS.filter((w) => s.seen.has(w)),
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
    const k = JSON.stringify([snap.stage, snap.u, snap.v, snap.hole, snap.seen]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }
  /** At once: what the book or a test asks to see. */
  function jump(n) {
    stopRun();
    s.stage = n;
    s.from = { u: s.u, v: s.v };
    s.seen = new Set(WORDS.filter((_, i) => n >= [1, 3, 4, 6][i]));
    s.bigLabel = n === 5;
    clearLabels();
    settle();
    camK = 1;
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  jump(s.stage);
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
      if (p.u != null || p.v != null) {
        if (p.u != null) s.u = clampU(Number(p.u));
        if (p.v != null) s.v = clampV(Number(p.v));
        s.from = { u: s.u, v: s.v };
        apply();
      }
      if (p.stage != null) {
        const n = Math.max(0, Math.min(LAST, Math.round(Number(p.stage))));
        if (animate && n === s.stage + 1) RUN[STEPS[s.stage]]();
        else jump(n);
      }
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      home();
      setView('front', { animate: false });
      camK = 1;
      draw();
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
      ctx.drawImage(dia.canvas, x, y, gl.width * k, gl.height * k);
      return out.toDataURL('image/png');
    },
    exportRoot: () => setting.apparatus,
  };
}
