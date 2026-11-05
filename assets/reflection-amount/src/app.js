// How much light is reflected (book p216, topic 8.2.1, চিত্র ৮.০৫): the student view. The book's picture in 3D: a boy, a red
// flower at the height of his eye, and a slab of clear glass between them. The glass lifts on a jack toward the line from
// the flower to his eye: the light meets it at a larger and larger angle of incidence. The rays split into what is reflected
// and what goes in, each as thick as the light it carries, a small picture shows what he really sees (the pattern under the glass
// fading and the flower coming up in it, by Fresnel's equations for each pixel) and a graph in the panel follows. The panel is
// the kit's clean sheet: one action, one result, one rule.
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
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  angleFor,
  clampAngle,
  exactAngle,
  EYE_Y,
  GLASS,
  MAX_ANGLE,
  MIN_ANGLE,
  nextStop,
  percent,
  percentIn,
  planeFor,
  points,
  shuffle,
  START_ANGLE,
  STOPS,
} from './reading.js';
import { createSetting } from './scene.js';

export const DEFAULTS = {
  angle: START_ANGLE, // the angle of incidence, degrees
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

const BOOK = { low: 4, high: 5, a: 80, b: 90 }; // the book's numbers
const MARGINS = { top: 10, bottom: 8, side: 8 };
const INK = { ray: '#8a4f00', ti: '#1971c2', tr: '#2b8a3e', dark: '#2b3a4a' };
const VIEW = { az: 20, elLow: 15, elHigh: 10 }; // lower as the glass comes up, so that its top keeps reading as a mirror
const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};
// the frame follows the glass: from its underside to above the boy's head, so that the view closes in as the glass comes up
const FRAME = new THREE.Box3(new THREE.Vector3(-37, 0, -4), new THREE.Vector3(30, EYE_Y + 15, 4));

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'lab');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: the sheet of one action, one result, one rule ────────────────────────────────────────────
  const stopId = (a) => `a${a}`;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', results: true, items: STOPS.map((a) => ({ id: stopId(a), label: `${t.num(a)}°` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const graph = createGraph(t);
  ui.learn.querySelector('.pvc-rule').before(graph.el);
  const caption = document.createElement('p');
  caption.className = 'lab-cap';
  caption.innerHTML = t('cap_book');
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'lab-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);

  // the small picture of what he sees
  const eyeBox = document.createElement('figure');
  eyeBox.className = 'ra-eye';
  eyeBox.innerHTML = `<canvas></canvas><figcaption>${ICONS.eye}<span>${t('l_eye')}</span></figcaption>`;
  ui.stage.appendChild(eyeBox);
  const eyeCanvas = eyeBox.querySelector('canvas');
  const eyeCtx = eyeCanvas.getContext('2d');

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 18, near: 10, far: 1200, environmentIntensity: 0.7 });
  const { camera, controls } = stage;
  camera.layers.enable(1); // the boy: not in the view from his own eye
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(55);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(84);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-35);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(55);
  const setting = createSetting({ stage, shadow: Boolean(o.shadow) });
  const rays = createRays({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    angle: clampAngle(o.angle), // while it moves it is not a whole number; what is shown is
    seen: new Set(), // the stops the student has reached
    busy: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    dragging: null,
  };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  const shown = () => Math.round(s.angle);
  let eyeDirty = true;
  const markPoint = new THREE.Vector3();
  function setAngle(angle) {
    s.angle = clampAngle(angle);
    const g = setting.place(s.angle);
    rays.view.geo = g;
    rays.view.r = percent(shown()) / 100;
    markPoint.set(0, g.plane - GLASS.thick - 0.6, 11);
    eyeDirty = true;
    for (const a of STOPS) if (Math.abs(s.angle - a) < 0.26 && !s.quiz) s.seen.add(a);
  }

  const stopRun = () => {
    ++token;
    tweener.cancel('lift');
    s.busy = false;
  };

  /** The glass goes to an angle, at a steady speed up the jack. */
  async function lift(to, { duration = 1.3 } = {}) {
    stopRun();
    const my = token;
    s.busy = true;
    clearAll();
    draw();
    const from = planeFor(s.angle);
    const end = planeFor(to);
    const done = await tweener.animate({
      key: 'lift',
      duration,
      ease: ease.inOutSine,
      onUpdate: (k) => {
        if (my !== token) return;
        setAngle(exactAngle(from + (end - from) * k));
        draw();
      },
    }).finished;
    if (my !== token) return false;
    setAngle(to);
    s.busy = false;
    audio.tick();
    if (done && !s.quiz && !nextStop(s.angle)) audio.success();
    draw();
    emitChange();
    return true;
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function poseNow() {
    const k = (s.angle - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE);
    dirFrom(VIEW.az, VIEW.elLow + (VIEW.elHigh - VIEW.elLow) * k, camDir);
    FRAME.min.y = planeFor(s.angle) - 13;
    return fitPose({ box: FRAME, dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGINS });
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
  function fly(duration = 0.8) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      s.view = 'front';
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
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
    syncUI();
    if (animate) fly(0.8);
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
    sizeEye();
    draw();
  });

  // ── the picture from his eye: drawn into a corner of the canvas before the main pass, copied, and drawn over ──
  let eyeW = 1;
  let eyeH = 1;
  function sizeEye() {
    const c = eyeCanvas.getBoundingClientRect();
    eyeW = Math.max(1, Math.round(c.width));
    eyeH = Math.max(1, Math.round(c.height));
    const r = stage.pixelRatio;
    eyeCanvas.width = Math.round(eyeW * r);
    eyeCanvas.height = Math.round(eyeH * r);
    eyeDirty = true;
  }
  sizeEye();
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    if (!eyeDirty) return;
    eyeDirty = false;
    setting.renderEye(s.angle, eyeW, eyeH);
    const gl = stage.canvas;
    eyeCtx.drawImage(gl, 0, gl.height - eyeCanvas.height, eyeCanvas.width, eyeCanvas.height, 0, 0, eyeCanvas.width, eyeCanvas.height);
  });

  // ── labels on the picture: few and short, each pinned to what it names ───────────────────────────────────
  let action = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, eyeBox, ui.$('.pvc-panel-toggle'), () => rays.boxes(), () => action?.ringBox()],
  });
  const on = new Map();
  const pts = new Map();
  function label(id, show, text, point, color, spots, optional = false) {
    if (!show) {
      if (on.has(id)) {
        anno.remove(id);
        on.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).copy(point);
    const was = on.get(id);
    if (!was) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', optional });
      on.set(id, { text });
      return;
    }
    if (was.text !== text) {
      anno.setText(id, text);
      was.text = text;
    }
  }
  function clearAll() {
    for (const id of [...on.keys()]) anno.remove(id);
    on.clear();
  }
  const SPOTS = {
    ti: [
      { dx: 26, dy: -28 },
      { dx: 26, dy: -18 },
      { dx: 44, dy: -8 },
      { dx: 30, dy: -40 },
      { dx: 50, dy: -30 },
      { dx: 40, dy: -62 },
      { dx: 26, dy: -84 },
      { dx: 62, dy: -74 },
      { dx: 64, dy: -104 },
      { dx: 26, dy: -112 },
      { dx: 30, dy: -134 },
    ],
    tr: [
      { dx: -26, dy: -18 },
      { dx: -44, dy: -8 },
      { dx: -30, dy: -40 },
      { dx: -50, dy: -30 },
      { dx: -40, dy: -62 },
      { dx: -26, dy: -84 },
      { dx: -26, dy: -112 },
    ],
    normal: [
      { dx: 0, dy: -14 },
      { dx: 34, dy: -2 },
      { dx: -34, dy: -2 },
    ],
    out: [
      { dx: 4, dy: 22 },
      { dx: -8, dy: -20 },
      { dx: -24, dy: 26 },
      { dx: 24, dy: -28 },
      { dx: -46, dy: 16 },
      { dx: -56, dy: -6 },
      { dx: 44, dy: -18 },
    ],
    in: [
      { dx: 10, dy: -20 },
      { dx: -14, dy: -22 },
      { dx: 34, dy: -16 },
      { dx: -30, dy: -34 },
      { dx: 6, dy: 22 },
      { dx: -56, dy: -14 },
      { dx: 44, dy: 20 },
      { dx: -30, dy: 24 },
    ],
    ref: [
      { dx: 62, dy: 24 },
      { dx: -62, dy: 18 },
      { dx: 74, dy: 8 },
      { dx: -74, dy: 4 },
      { dx: -56, dy: 36 },
      { dx: 56, dy: 40 },
    ],
    glass: [
      { dx: -26, dy: 14 },
      { dx: -34, dy: -8 },
      { dx: 24, dy: 20 },
      { dx: -22, dy: 36 },
      { dx: 44, dy: 36 },
      { dx: -48, dy: 30 },
      { dx: -62, dy: 0 },
      { dx: -8, dy: 46 },
    ],
  };
  const P = new THREE.Vector3();
  const mid = (a, b, f) => P.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 0);
  function labels() {
    const q = s.quiz;
    const g = rays.view.geo;
    const a = shown();
    const moving = s.busy || camK < 1;
    const plain = q && !q.named;
    const rayOn = rays.view.show;
    const half = (a * Math.PI) / 360;
    label('normal', rayOn && !moving && !q, t('l_normal'), P.set(g.top.x, g.top.y, 0), INK.dark, SPOTS.normal);
    label('in', rayOn && !moving && !q, t('l_in'), mid(g.flower, g.hit, 0.3), INK.ray, SPOTS.in);
    label('out', rayOn && !moving && !plain, q ? t('l_out_q') : t('l_out', { p: percent(a) }), mid(g.eye, g.hit, 0.3), INK.ray, SPOTS.out);
    // the angles are read at the arcs
    label(
      'ti',
      rayOn && !moving && !q?.hideAngle,
      t('l_ti', { a }),
      P.set(g.hit.x + 9 * Math.sin(half), g.hit.y + 9 * Math.cos(half), 0),
      INK.ti,
      SPOTS.ti,
    );
    label(
      'tr',
      rayOn && !moving && !q?.hideAngle,
      t('l_tr', { a }),
      P.set(g.hit.x - 9 * Math.sin(half), g.hit.y + 9 * Math.cos(half), 0),
      INK.tr,
      SPOTS.tr,
    );
    label(
      'ref',
      rayOn && !moving && !plain,
      q ? t('l_ref_q') : t('l_ref', { p: percentIn(a) }),
      P.set(g.inside.x, g.inside.y, 0),
      INK.ray,
      SPOTS.ref,
    );
    label('glass', !moving && !q, t('l_glass'), P.set(-GLASS.halfX + 1.5, g.plane - GLASS.thick / 2, GLASS.halfZ), INK.dark, SPOTS.glass, true);
    anno.update();
  }
  stage.onAfterRender(labels);

  // ── moving on ──────────────────────────────────────────────────────────────────────────────────────────
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    if (s.busy) return;
    const next = nextStop(s.angle);
    return lift(next ?? STOPS[0]);
  }
  function pick(a) {
    if (s.locked) return lockedNudge();
    audio.unlock();
    if (a !== shown() || s.busy) lift(a);
  }
  function nudge(by) {
    if (s.locked) return lockedNudge();
    stopRun();
    clearAll();
    setAngle(Math.round(s.angle) + by);
    draw();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  function ruleText() {
    const a = shown();
    if (a < 45) return t('rule_small', { a: BOOK.low, b: BOOK.high });
    if (a < 75) return t('rule_mid');
    if (STOPS.every((x) => s.seen.has(x))) return t('rule_end');
    return t('rule_big', { a: BOOK.a, b: BOOK.b });
  }
  function panel() {
    const a = shown();
    graph.set(a);
    if (s.quiz) return;
    sheet.outcome(t('out_now', { a, p: percent(a) }));
    sheet.rule(ruleText());
    const stop = STOPS.includes(a) ? stopId(a) : null;
    sheet.choose(stop);
    const next = nextStop(s.angle);
    sheet.next(next ? stopId(next) : null);
    for (const x of STOPS) sheet.result(stopId(x), s.seen.has(x) ? `${t.num(percent(x))}%` : '');
    const step = next ? STOPS.indexOf(next) : '';
    const word = s.busy ? 'act_wait' : next ? 'act_lift' : 'act_down';
    const enabled = !s.busy;
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
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_lift',
    target: () => (s.locked || s.busy || camK < 1 || s.dragging ? null : markPoint),
    radius: 26,
    avoid: [ui.corner, ui.hint, note, eyeBox, () => anno.boxes(), () => rays.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // a tap on the glass or the jack is the same action; a drag lifts it by hand
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function onGlass(e) {
    const r = ui.canvasHost.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(setting.hit, false).length > 0;
  }
  const pxPerCm = () => {
    const a = rays.screen({ x: 0, y: planeFor(s.angle), z: 0 });
    const b = rays.screen({ x: 0, y: planeFor(s.angle) + 10, z: 0 });
    return Math.max(0.5, (a.y - b.y) / 10);
  };
  const host = ui.canvasHost;
  host.addEventListener(
    'pointerdown',
    (e) => {
      if (s.locked || !onGlass(e)) return;
      controls.enabled = false;
      s.dragging = { id: e.pointerId, y: e.clientY, x: e.clientX, plane: planeFor(s.angle), scale: pxPerCm(), moved: false, at: performance.now() };
      capturePointer(host, e.pointerId);
      stage.invalidate();
    },
    { capture: true },
  );
  host.addEventListener('pointermove', (e) => {
    const d = s.dragging;
    if (!d || d.id !== e.pointerId || s.locked) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 7) return;
    if (!d.moved) {
      d.moved = true;
      stopRun();
      clearAll();
      audio.unlock();
    }
    setAngle(angleFor(d.plane + (d.y - e.clientY) / d.scale));
    draw();
  });
  const endDrag = (e) => {
    const d = s.dragging;
    if (!d || d.id !== e.pointerId) return;
    s.dragging = null;
    controls.enabled = true;
    releasePointer(host, e.pointerId);
    if (d.moved) {
      emitChange();
      draw();
    } else if (e.type === 'pointerup' && performance.now() - d.at < 600) act();
  };
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', endDrag);

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  let order = [];
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  function quizScene(q, angle) {
    stopRun();
    setAngle(angle);
    s.quiz = { ...q, named: false };
    clearAll();
    draw();
  }
  const Q = {
    small() {
      quizScene({ kind: 'small' }, 30);
      const wrong = ['half', 'most', 'all'];
      const value = { low: { a: BOOK.low, b: BOOK.high }, half: { a: 50 }, most: { a: 95 }, all: { a: 100 } };
      return {
        text: t('q_small'),
        answer: 'low',
        wrong,
        label: (k) => t(`c_small_${k}`, value[k]),
        notes: notesOf(wrong.map((k) => [k, t(`n_small_${k}`)])),
        reveal: t('a_small', { a: BOOK.low, b: BOOK.high }),
      };
    },
    lift() {
      quizScene({ kind: 'lift', named: false, hideAngle: true }, 50);
      s.quiz.grow = 76;
      const wrong = ['lessR', 'lessA', 'none'];
      return {
        text: t('q_lift'),
        answer: 'both',
        wrong,
        label: (k) => t(`c_lift_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_lift_${k}`)])),
        reveal: t('a_lift'),
      };
    },
    eye() {
      quizScene({ kind: 'eye', hideAngle: true }, 85);
      rays.view.show = false;
      const wrong = [30, 45, 60];
      return {
        text: t('q_eye'),
        answer: 85,
        wrong,
        label: (k) => t('c_deg', { a: k }),
        notes: notesOf(wrong.map((k) => [k, t('n_eye')])),
        reveal: t('a_eye', { a: 85, b: BOOK.b }),
      };
    },
    rest() {
      quizScene({ kind: 'rest' }, 80);
      const wrong = ['back', 'eye', 'gone'];
      return {
        text: t('q_rest', { p: percent(80) }),
        answer: 'in',
        wrong,
        label: (k) => t(`c_rest_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_rest_${k}`)])),
        reveal: t('a_rest'),
      };
    },
    window() {
      quizScene({ kind: 'window' }, 60);
      const wrong = ['front', 'near', 'same'];
      return {
        text: t('q_window'),
        answer: 'side',
        wrong,
        label: (k) => t(`c_window_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_window_${k}`, { a: BOOK.low, b: BOOK.high })])),
        reveal: t('a_window', { a: BOOK.b }),
      };
    },
  };
  const saved = { angle: START_ANGLE, seen: [] };
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
        stopRun();
        s.dragging = null;
        controls.enabled = true;
        s.mode = 'quiz';
        s.locked = true;
        saved.angle = shown();
        saved.seen = [...s.seen];
        order = ['small', 'lift', 'eye', 'rest', 'window'];
        clearAll();
        syncUI();
      },
      leave() {
        stopRun();
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        rays.view.show = true;
        s.seen = new Set(saved.seen);
        setAngle(saved.angle);
        clearAll();
        syncUI();
        fly(0.5);
        draw();
      },
      async prepare(i, alive, say) {
        rays.view.show = true;
        const q = Q[order[i]]();
        qCurrent = q;
        say(q.text);
        const done = await fly(0.4);
        if (!alive()) return null;
        if (!done) camK = 1;
        if (s.quiz.grow) {
          await lift(s.quiz.grow, { duration: 1.1 });
          if (!alive()) return null;
        }
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
        if (s.quiz) {
          s.quiz.named = true;
          s.quiz.hideAngle = false;
          rays.view.show = true;
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
      const active = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', active);
      b.setAttribute('aria-selected', String(active));
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
    s.seen.clear();
    clearAll();
    setAngle(START_ANGLE);
    fly(0.5);
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
    if (b.dataset.example) pick(Number(b.dataset.example.slice(1)));
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'home') home();
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      nudge(step * (e.shiftKey ? 5 : 1));
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
    const a = shown();
    const g = points(a);
    return {
      angle: a,
      reflected: percent(a),
      refractedShare: percentIn(a),
      refractedAngle: g.refracted,
      plane: Number(g.plane.toFixed(3)),
      seen: STOPS.filter((x) => s.seen.has(x)),
      busy: s.busy,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
      question: s.quiz ? { kind: s.quiz.kind, right: s.quiz.right ?? null } : null,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.angle, snap.seen]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  setAngle(s.angle);
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
      if (p.angle != null) {
        const to = Math.round(clampAngle(p.angle));
        if (animate) lift(to);
        else {
          stopRun();
          clearAll();
          setAngle(to);
        }
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
    /** The view with its drawing and the picture from his eye, cover-fitted to the size asked for. */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      eyeDirty = true;
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
      const r = ui.canvasHost.getBoundingClientRect();
      const c = eyeCanvas.getBoundingClientRect();
      const ratio = gl.width / r.width;
      ctx.drawImage(eyeCanvas, x + (c.left - r.left) * ratio * k, y + (c.top - r.top) * ratio * k, c.width * ratio * k, c.height * ratio * k);
      return out.toDataURL('image/png');
    },
    exportRoot: () => setting.apparatus,
  };
}
