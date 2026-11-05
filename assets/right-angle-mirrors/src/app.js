// Two mirrors at a right angle (সমকোণে দুটি আয়না), book p234, topic 8.8.1, চিত্র ৮.২৬, and the উদাহরণ on p223, চিত্র ৮.১৫: the student
// view. A boy with a card reading "বাম" in his left hand stands before two mirrors hinged on a vertical line. Three steps, one
// thing at a time: (1) one flat mirror: he raises his left hand, the image's right hand rises and the writing is reversed;
// (2) the student folds the mirrors to 90°: three images; in the corner one, reflected twice, left stays left and the writing
// reads true; the two at the sides, reflected once, stay swapped; (3) the book's plan: the left fist in AOB, then its image in
// A′OB, in AOB′ and in A′OB′, with one ray traced into the eye. The panel is the kit's clean sheet. A 5-question test.
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
import { C, createDiagram } from './diagram.js';
import { createI18n } from './i18n.js';
import {
  ANGLE,
  ANGLE_CHOICES,
  doubleRay,
  FIST_AT,
  handIn,
  handleAt,
  IMAGES,
  imageOf,
  mirrors,
  PLACE_AT,
  PLAN,
  PLAN_EYE,
  PLAN_Y,
  placeChoices,
  planPoint,
  quarterOf,
  shuffle,
  snapAngle,
  trace,
} from './reading.js';
import { createSetting } from './setting.js';

export const DEFAULTS = {
  step: 'one', // 'one' | 'two' | 'top'
  stage: 0, // how far the step is built
  alpha: null, // the angle between the mirrors, degrees (only in the step 'two')
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  sound: true,
  shadow: true,
};

const STEPS = ['one', 'two', 'top'];
const LAST = { one: 2, two: 3, top: 3 };
const INK = C.ink;
const KEPT = '#1864ab'; // left stays left
const SWAP = '#b02a37'; // left became right
const SLATE = '#33506b';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mix = (a, b, k) => a + (b - a) * k;
const seg = (g, a, b) => clamp((g - a) / (b - a), 0, 1);
const smooth = (k) => k * k * (3 - 2 * k);
const shortAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const lookFrom = (az, el, out) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};
// the book's plan: three quarters of the floor, seen from the side of A′OB′ so that the book's picture is the right way up
const PLAN_VIEW = { az: 135, el: 66 };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'ra');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell ───────────────────────────────────────────────────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'ra-note';
  note.textContent = t('note_ray');
  note.hidden = true;
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const FOV = 24;
  const stage = createStage(ui.canvasHost, { fov: FOV, near: 0.5, far: 400, environment: 'studio-light', environmentIntensity: 0.3 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  const setting = createSetting({ stage, shadow: Boolean(o.shadow), word: t('card') });
  const dia = createDiagram({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    step: STEPS.includes(o.step) ? o.step : 'one',
    stage: 0,
    alpha: ANGLE.flat,
    arm: 0, // his left arm: 0 down, 1 raised
    plan: 0, // the mirrors: 0 tall, 1 as low as the book's plan
    newest: '', // what is growing in
    grow: 1,
    flash: 0,
    busy: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    drag: null,
    dragged: false, // the student has folded the mirrors by hand: the handle calms down and its label goes
  };
  /** The state a step's stage stands for. */
  function buildTo(step, n) {
    s.step = step;
    s.stage = clamp(Math.round(Number(n) || 0), 0, LAST[step]);
    s.arm = step === 'one' && s.stage === 0 ? 0 : 1;
    s.alpha = step === 'top' || (step === 'two' && s.stage >= 1) ? ANGLE.right : ANGLE.flat;
    s.plan = step === 'top' ? 1 : 0;
  }
  buildTo(s.step, o.stage);
  if (s.step === 'two' && o.alpha != null) {
    s.alpha = snapAngle(Number(o.alpha));
    if (s.alpha === ANGLE.right && s.stage === 0) s.stage = 1;
  }

  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  const inFist = () => (s.quiz ? s.quiz.world === 'fist' : s.step === 'top');
  /** What the panel's action does now. */
  function phase() {
    if (s.busy || s.grow < 1) return 'busy';
    return `${s.step}${s.stage}`;
  }
  const canFold = () => !s.locked && !s.busy && !s.quiz && s.step === 'two' && s.stage !== 2 && s.grow >= 1;

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  const shape = () => (s.quiz ? (s.quiz.alpha ?? ANGLE.right) : s.alpha);
  /** The hand and the plan's eye on the plan's height. */
  const planAt = (p, q, y = PLAN_Y) => ({ ...planPoint(p, q), y });
  function planRay(chain, at = FIST_AT) {
    const src = planAt(at.p, at.q);
    const eye = planAt(PLAN_EYE.p, PLAN_EYE.q);
    return chain.length > 1 ? doubleRay(src, eye, PLAN.w, PLAN.y1) : trace(src, eye, chain, ANGLE.right, PLAN.w, PLAN.y1);
  }
  /** How far each plan ghost has come. */
  function ghostK(id) {
    if (s.quiz) return s.quiz.ghosts?.includes(id) ? 1 : 0;
    const need = { b: 1, a: 2, ab: 3 }[id];
    if (s.stage < need) return 0;
    return s.newest === id ? seg(s.grow, 0, 0.7) : 1;
  }
  function drawRay(r, k, lit, id) {
    const v = dia.view;
    v.ray = { points: r.points, k, lit };
    const g = lit ? seg(s.grow, 0.72, 1) : 1;
    r.via.forEach((q, i) => {
      v.backs.push({ a: q.from, b: q, k: g, lit, id });
      if (i < r.via.length - 1) v.points.push([q, 3, C.ray]);
    });
    if (k >= 1) for (const h of r.hits) v.points.push([h, 2.8, C.ray]);
    v.points.push([r.points[0], 3, C.ray]);
    const last = r.hits[r.hits.length - 1];
    v.eye = { ...r.eye, tx: last.x, ty: last.y, tz: last.z };
  }
  const O_Y = { x: 0, y: 0.015, z: 0 };
  function applyWorld() {
    setting.setWorld(inFist() ? 'fist' : 'boy');
    setting.setPlan(s.quiz ? (s.quiz.world === 'fist' ? 1 : 0) : s.plan);
    setting.setAngle(shape());
    setting.setArm(s.quiz ? 1 : s.arm);
    setting.setFist(s.quiz?.at ?? FIST_AT);
    for (const q of IMAGES) setting.setGhost(q.id, inFist() ? ghostK(q.id) : 0);
    dia.clear();
    const v = dia.view;
    v.flash = s.flash;
    const m = mirrors(shape());
    if (inFist()) {
      const reach = PLAN.w;
      const k0 = s.quiz ? 1 : s.stage >= 1 ? (s.newest === 'b' ? seg(s.grow, 0, 0.5) : 1) : 0;
      const k1 = s.quiz ? 1 : s.stage >= 2 ? (s.newest === 'a' ? seg(s.grow, 0, 0.5) : 1) : 0;
      if (k0 > 0) v.axes.push({ a: O_Y, b: { x: -m.a.dir.x * reach, y: 0.015, z: -m.a.dir.z * reach }, k: k0 });
      if (k1 > 0) v.axes.push({ a: O_Y, b: { x: -m.b.dir.x * reach, y: 0.015, z: -m.b.dir.z * reach }, k: k1 });
      v.corner = { a: m.a.dir, b: m.b.dir, r: 0.2, right: true };
      if (s.quiz) {
        applyQuiz(s.quiz);
        return;
      }
      if (s.stage >= 3) {
        const k = s.newest === 'ab' ? seg(s.grow, 0.1, 0.72) : 1;
        if (k > 0) drawRay(planRay(['b', 'a']), k, s.newest === 'ab', 'ab');
      }
      return;
    }
    if (s.quiz) return applyQuiz(s.quiz);
    if (s.step === 'two') {
      if (s.alpha < ANGLE.flat - 0.5 || s.drag) v.corner = { a: m.a.dir, b: m.b.dir, r: 0.36, right: s.alpha === ANGLE.right };
      if (canFold()) {
        v.fold = { at: handleAt, from: ANGLE.flat, to: ANGLE.right, alpha: s.alpha, calm: s.dragged, pulse: Boolean(o.coach) && !s.dragged };
      }
    }
  }

  // ── camera: each step frames what it is about, and flies there smoothly ────────────────────────────────
  const FRAME = new THREE.Box3();
  const margin = { top: 36, bottom: 28, left: 8, right: 8 };
  const camDir = new THREE.Vector3();
  const panelBeside = () => root.clientWidth >= root.clientHeight && root.clientWidth >= 600;
  const FRAMES = {
    // one mirror: the boy in front, his image beyond him, the mirror's plane in depth
    one: { az: 31, el: 11, min: [-1.2, -0.02, -1.5], max: [0.72, 1.86, 1.42] },
    // the cards side by side: the real one and the one in the mirror
    cards: { az: 31, el: 8, min: [-1.2, 0.98, -1.4], max: [0.16, 1.82, 1.2] },
    // the two mirrors, open toward the viewer
    open: { az: 6, el: 10, min: [-1.5, -0.02, 0], max: [1.5, 2.0, 1.4] },
    // the real card and the corner image
    close: { az: 6, el: 7, min: [-1.05, 0.82, -0.2], max: [1.02, 1.84, 1.1] },
    plan: { az: PLAN_VIEW.az, el: PLAN_VIEW.el, min: [-1.3, 0, -1.3], max: [1.3, 0.4, 1.3] },
  };
  function frameKey() {
    if (s.quiz) return s.quiz.frame;
    if (s.step === 'one') return s.stage === 2 ? 'cards' : 'one';
    if (s.step === 'two') return s.stage === 2 ? 'close' : 'fold';
    return 'plan';
  }
  const frameId = () => frameKey();
  /** The pose for a frame; 'fold' follows the mirrors' angle between the flat view and the open one. */
  function poseOf(key) {
    let f = FRAMES[key];
    let az;
    let el;
    const min = [0, 0, 0];
    const max = [0, 0, 0];
    if (key === 'fold') {
      // under a finger the view holds still, so that the handle stays with the finger; it comes round on release
      const k = smooth(clamp(((s.drag ? s.drag.from : s.alpha) - ANGLE.right) / (ANGLE.flat - ANGLE.right), 0, 1));
      az = mix(FRAMES.open.az, FRAMES.one.az, k);
      el = mix(FRAMES.open.el, FRAMES.one.el, k);
      for (let i = 0; i < 3; i++) {
        min[i] = mix(FRAMES.open.min[i], FRAMES.one.min[i], k);
        max[i] = mix(FRAMES.open.max[i], FRAMES.one.max[i], k);
      }
    } else {
      f = f ?? FRAMES.open;
      az = f.az;
      el = f.el;
      for (let i = 0; i < 3; i++) {
        min[i] = f.min[i];
        max[i] = f.max[i];
      }
    }
    lookFrom(az, el, camDir);
    FRAME.min.set(min[0], min[1], min[2]);
    FRAME.max.set(max[0], max[1], max[2]);
    const close = key === 'cards' || key === 'close';
    margin.top = close ? 44 : 36;
    margin.right = panelBeside() ? 34 : 8;
    margin.left = 8;
    margin.bottom = close ? 8 : 34;
    return fitPose({ box: FRAME, dir: camDir, camera, width: stage.width, height: stage.height, margin });
  }
  /** Where the student may turn the view: the camera stays in front of both mirrors. */
  function limits() {
    const fly = camK < 1;
    if (fly) {
      controls.minAzimuthAngle = Number.NEGATIVE_INFINITY;
      controls.maxAzimuthAngle = Number.POSITIVE_INFINITY;
      controls.minPolarAngle = 0.01;
      controls.maxPolarAngle = Math.PI / 2;
      return;
    }
    const plan = inFist();
    const wide = clamp(90 - (s.drag ? s.drag.from : shape()) / 2, 0, 45); // how far each mirror has swung in
    const R = THREE.MathUtils.degToRad;
    if (plan) {
      // past ±180° the angle wraps: seen from there the limits are one side only
      controls.minAzimuthAngle = R(PLAN_VIEW.az - 26);
      controls.maxAzimuthAngle = R(PLAN_VIEW.az + 26);
      controls.minPolarAngle = R(8);
      controls.maxPolarAngle = R(52);
    } else {
      controls.minAzimuthAngle = R(-(80 - wide - 8));
      controls.maxAzimuthAngle = R(80 - wide - 8);
      controls.minPolarAngle = R(62);
      controls.maxPolarAngle = R(88);
    }
  }
  let camFrom = null;
  let camK = 1;
  let shownFrame = '';
  const to = { az: 0, el: 0, r: 1 };
  const from = { az: 0, el: 0, r: 1 };
  const sph = (pos, tgt, out) => {
    const dx = pos.x - tgt.x;
    const dy = pos.y - tgt.y;
    const dz = pos.z - tgt.z;
    out.r = Math.hypot(dx, dy, dz);
    out.az = Math.atan2(dx, dz);
    out.el = Math.asin(clamp(dy / out.r, -1, 1));
    return out;
  };
  const tgtNow = new THREE.Vector3();
  function applyCamera() {
    if (s.userMovedCamera) return;
    const pz = poseOf(frameKey());
    limits();
    if (camK < 1 && camFrom) {
      // through the sphere round the target, never through the mirrors
      const k = ease.inOutCubic(camK);
      sph(camFrom.position, camFrom.target, from);
      sph(pz.position, pz.target, to);
      tgtNow.lerpVectors(camFrom.target, pz.target, k);
      const az = from.az + shortAngle(to.az - from.az) * k;
      const el = mix(from.el, to.el, k);
      const r = mix(from.r, to.r, k);
      camera.position.set(tgtNow.x + r * Math.sin(az) * Math.cos(el), tgtNow.y + r * Math.sin(el), tgtNow.z + r * Math.cos(az) * Math.cos(el));
      controls.target.copy(tgtNow);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
    }
    controls.update();
  }
  function flyCamera(duration = 0.9) {
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
  /** After any change: when the state wants another frame, go there. */
  function followFrame(instant, duration = 0.9) {
    const key = frameId();
    if (key === shownFrame) return;
    const first = !shownFrame;
    const bigTurn = (key === 'plan') !== (shownFrame === 'plan');
    shownFrame = key;
    if (first || instant) {
      tweener.cancel('camera');
      camK = 1;
    } else flyCamera(bigTurn ? 1.5 : duration);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    if (animate) flyCamera(0.7);
    else camK = 1;
    stage.invalidate();
  }
  /** The student has really turned the view: a tap on it, with no move, leaves the frame alone. */
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
    setting.setFloorFade(camera, inFist() ? 8 : 2.2);
    setting.updateClip(camera);
    labels();
  });

  // ── moving on ─────────────────────────────────────────────────────────────────────────────────────────
  /** Eases numbers of the state to new values. */
  function moveTo(target, duration = 0.9) {
    const a = {};
    for (const k of Object.keys(target)) a[k] = s[k];
    return tweener.animate({
      key: 'pose',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        for (const n of Object.keys(target)) s[n] = a[n] + (target[n] - a[n]) * k;
        draw();
      },
      onComplete: () => Object.assign(s, target),
    }).finished;
  }
  /** What a move under way will leave behind: a stop lands on it, never half way. */
  let landing = null;
  function stopMotion() {
    ++token;
    for (const k of ['pose', 'reveal', 'flash']) tweener.cancel(k);
    landing?.();
    landing = null;
    s.busy = false;
    s.grow = 1;
    s.flash = 0;
    s.newest = '';
  }
  /** Runs an eased move as the action's demonstration, then what follows it. */
  function demo(target, duration, then) {
    const my = ++token;
    s.busy = true;
    landing = () => {
      Object.assign(s, target);
      then?.();
    };
    draw();
    moveTo(target, duration).then((ok) => {
      if (my !== token) return;
      s.busy = false;
      landing = null;
      if (ok) {
        then?.();
        audio.success();
        s.flash = 1;
        fadeLit();
      }
      draw();
      emitChange();
    });
  }
  function fadeLit() {
    tweener.animate({
      key: 'flash',
      duration: 1.8,
      onUpdate: (k) => {
        s.flash = 1 - k;
        draw();
      },
      onComplete: () => {
        s.flash = 0;
        draw();
      },
    });
  }
  /** The next thing grows in, highlighted. */
  function reveal(id, duration = 1.6) {
    const my = ++token;
    tweener.cancel('flash');
    s.newest = id;
    s.flash = 1;
    s.grow = 0;
    landing = () => {
      s.newest = '';
      s.grow = 1;
    };
    audio.tick();
    draw();
    tweener
      .animate({
        key: 'reveal',
        duration,
        ease: ease.linear,
        onUpdate: (k) => {
          if (my !== token) return;
          s.grow = Math.min(0.999, k);
          draw();
        },
      })
      .finished.then((ok) => {
        if (!ok || my !== token) return;
        s.grow = 1;
        s.newest = '';
        landing = null;
        audio.success();
        draw();
        emitChange();
        fadeLit();
      });
  }
  function go(step, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (!STEPS.includes(step)) return;
    const before = { alpha: s.alpha, arm: s.arm, plan: s.plan };
    stopMotion();
    clearLabels();
    buildTo(step, 0);
    if (animate && (before.alpha !== s.alpha || before.plan !== s.plan)) {
      // the mirrors open or close on the way
      const target = { alpha: s.alpha, plan: s.plan, arm: s.arm };
      Object.assign(s, before, { arm: target.arm });
      demo(target, 1);
      return;
    }
    draw({ instant: !animate });
    emitChange();
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    const ph = phase();
    if (ph === 'one0') {
      s.stage = 1;
      return demo({ arm: 1 }, 1.2);
    }
    if (ph === 'one1') {
      s.stage = 2;
      draw();
      emitChange();
      return;
    }
    if (ph === 'one2') return go('two');
    if (ph === 'two0') return demo({ alpha: ANGLE.right }, 2, () => (s.stage = 1));
    if (ph === 'two1' || ph === 'two2') {
      s.stage += 1;
      s.flash = 1;
      fadeLit();
      draw();
      emitChange();
      return;
    }
    if (ph === 'two3') return go('top');
    if (ph === 'top0' || ph === 'top1' || ph === 'top2') {
      s.stage += 1;
      return reveal(['b', 'a', 'ab'][s.stage - 1], s.stage === 3 ? 2.4 : 1.6);
    }
    if (ph === 'top3') return quiz.start();
  }

  // ── labels on the picture: pinned to what they name ────────────────────────────────────────────────────
  let action = null;
  const handleBoxes = () => {
    const p = dia.handles.fold;
    return p ? [{ left: p.x - 22, top: p.y - 22, right: p.x + 22, bottom: p.y + 22 }] : [];
  };
  /** Small boxes along the handle's range, in canvas pixels: labels keep off it. */
  function trackBoxes() {
    const out = [];
    const f = dia.view.fold;
    if (!f) return out;
    for (let i = 0; i <= 10; i++) {
      const p = f.at(mix(f.from, f.to, i / 10));
      const a = toScreen(p.x, p.y, p.z);
      out.push({ left: a.x - 5, top: a.y - 5, right: a.x + 5, bottom: a.y + 5 });
    }
    return out;
  }
  const panelTab = ui.$('.pvc-panel-toggle');
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, panelTab, handleBoxes, trackBoxes, () => action?.ringBox()],
  });
  const shown = new Map();
  const used = new Map();
  const pts = new Map();
  const touched = new Set();
  function label(id, text, point, color, spots, avoid = [], optional = false) {
    touched.add(id);
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).copy(point);
    if (!shown.has(id)) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', avoid, optional });
      shown.set(id, text);
      used.set(id, spots);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
      anno.update(id, { color });
    }
    if (used.get(id) !== spots) {
      used.set(id, spots);
      anno.update(id, { spots, avoid });
    }
  }
  function clearLabels() {
    for (const id of [...shown.keys()]) anno.remove(id);
    shown.clear();
  }
  const ptr = new THREE.Vector3();
  const onScreen = { x: 0, y: 0 };
  function toScreen(x, y, z) {
    ptr.set(x, y, z).project(camera);
    onScreen.x = ((ptr.x + 1) / 2) * stage.width;
    onScreen.y = ((1 - ptr.y) / 2) * stage.height;
    return onScreen;
  }
  /** Small boxes along the ray, in canvas pixels: labels keep off them. */
  function lineBoxes() {
    const out = [];
    const v = dia.view;
    if (!v.ray) return out;
    const p = v.ray.points;
    for (let i = 1; i < p.length; i++)
      for (let q = 0; q <= 8; q++) {
        const k = q / 8;
        const a = toScreen(mix(p[i - 1].x, p[i].x, k), mix(p[i - 1].y, p[i].y, k), mix(p[i - 1].z, p[i].z, k));
        out.push({ left: a.x - 5, top: a.y - 5, right: a.x + 5, bottom: a.y + 5 });
      }
    return out;
  }
  const lineAvoid = [lineBoxes];
  const v3 = new THREE.Vector3();
  const at = (x, y, z) => v3.set(x, y, z);
  const ABOVE = [
    { dx: 0, dy: -26 },
    { dx: -30, dy: -24 },
    { dx: 30, dy: -24 },
    { dx: 0, dy: -44 },
  ];
  const ABOVE_R = [
    { dx: 24, dy: -24 },
    { dx: 34, dy: -6 },
    { dx: 0, dy: -30 },
    { dx: -24, dy: -24 },
  ];
  const ABOVE_L = [
    { dx: -24, dy: -24 },
    { dx: -34, dy: -6 },
    { dx: 0, dy: -30 },
    { dx: 24, dy: -24 },
  ];
  const UNDER = [
    { dx: 0, dy: 26 },
    { dx: 24, dy: 22 },
    { dx: -24, dy: 22 },
    { dx: 0, dy: 42 },
  ];
  // four labels along the top of a narrow view: each has a second row to step to
  const STACK_L = [
    { dx: -16, dy: -26 },
    { dx: -16, dy: -48 },
    { dx: -36, dy: 22 },
    { dx: -44, dy: -8 },
  ];
  const STACK_R = [
    { dx: 16, dy: -26 },
    { dx: 16, dy: -48 },
    { dx: 30, dy: 26 },
    { dx: 44, dy: -8 },
    { dx: 0, dy: 40 },
    { dx: -30, dy: 56 },
  ];
  const DRAG_SPOTS = [
    { dx: 0, dy: 40 },
    { dx: -44, dy: 34 },
    { dx: 44, dy: 34 },
    { dx: 0, dy: -44 },
  ];
  const ON_SPOT = [{ dx: 0, dy: 0 }];
  const O_SPOT = [{ dx: 18, dy: -14 }];
  const TAB_L = [{ dx: -24, dy: 0 }];
  const TAB_R = [{ dx: 24, dy: 0 }];
  const BESIDE = [
    { dx: -30, dy: 0 },
    { dx: 30, dy: 0 },
  ];
  const FLOOR_SPOTS = [
    { dx: 30, dy: 16 },
    { dx: -30, dy: 16 },
    { dx: 0, dy: 26 },
    { dx: 34, dy: -6 },
  ];
  const END_SPOTS = [
    { dx: 0, dy: -14 },
    { dx: 14, dy: 0 },
    { dx: -14, dy: 0 },
    { dx: 0, dy: 14 },
  ];
  const highlight = (id, text) => (s.flash > 0 && s.newest === id ? `<span class="ra-new">${text}</span>` : text);
  const handWord = (hand) => t(hand === 'left' ? 'l_left' : 'l_right');
  /** The labels of the boy's images at 90°, for the ones this state names. */
  function labels() {
    touched.clear();
    const settled = camK >= 1 && !s.busy && s.grow >= 1;
    const q = s.quiz;
    if (inFist()) planLabels(settled);
    else if (!q && settled) boyLabels();
    if (q && settled) for (const m of q.tags ?? []) label(m.id, m.text, at(m.x, m.y, m.z), m.color ?? INK, m.spots ?? ABOVE);
    for (const id of [...shown.keys()])
      if (!touched.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
  }
  const pa = new THREE.Vector3();
  function boyLabels() {
    const hand = setting.cardTop;
    // the first time, the handle says what it is for
    if (dia.view.fold && !s.dragged && s.stage === 0) {
      const h = handleAt(s.alpha);
      label('drag', t('l_drag'), at(h.x, h.y, h.z), INK, DRAG_SPOTS);
    }
    if (s.step === 'one') {
      if (s.stage === 0) label('mirror', t('l_mirror'), at(0.62, 0.42, 0), INK, ON_SPOT);
      if (s.stage >= 1) {
        const real = s.stage === 2 ? t('l_right_text') : t('l_left');
        const seen = s.stage === 2 ? t('l_wrong_text') : t('l_right');
        label(`real${s.stage}`, real, hand(null, pa), KEPT, ABOVE_L);
        label(`i-a${s.stage}`, seen, hand('a', pa), SWAP, ABOVE_R);
      }
      return;
    }
    if (s.alpha !== ANGLE.right) {
      // while the mirrors fold, only the angle has a name
      if (s.step === 'two' && s.alpha < ANGLE.flat - 0.5) label('deg', t('l_deg', { a: Math.round(s.alpha) }), at(0, 0.02, 0.5), INK, UNDER);
      else label('hinge', t('l_hinge'), at(0, 0.92, 0), INK, BESIDE);
      return;
    }
    label('deg', t('l_deg', { a: 90 }), at(0, 0.02, 0.5), INK, UNDER);
    if (s.stage !== 2) label('real', t('l_left'), hand(null, pa), KEPT, STACK_R);
    if (s.stage === 1) {
      for (const key of ['a', 'b', 'ab']) label(`im-${key}`, t('l_image'), setting.boyPoint(0, 1.56, 0, key, pa), INK, ABOVE);
      return;
    }
    if (s.stage === 2) {
      label('text-ab', t('l_right_text'), hand('ab', pa), KEPT, ABOVE_R);
      label('real-text', t('l_right_text'), hand(null, pa), KEPT, ABOVE_L);
      return;
    }
    label('i-ab', t('l_hand_n', { h: t('l_left'), n: 2 }), hand('ab', pa), KEPT, STACK_L);
    label('i-a', t('l_hand_n', { h: t('l_right'), n: 1 }), hand('a', pa), SWAP, STACK_R);
    label('i-b', t('l_hand_n', { h: t('l_right'), n: 1 }), hand('b', pa), SWAP, STACK_L);
  }
  function planLabels(settled) {
    if (camK < 0.97) return;
    const w = PLAN.w + 0.1;
    const m = mirrors(ANGLE.right);
    const end = (id, text, d, k = 1) => label(id, text, at(d.x * w * k, 0.05, d.z * w * k), INK, END_SPOTS);
    end('A', 'A', m.a.dir);
    end('B', 'B', m.b.dir);
    // on the floor, up and to the side of the corner: the ray's hit on BO stays clear
    label('O', 'O', at(0, 0.02, 0), INK, O_SPOT);
    const q = s.quiz;
    const all = Boolean(q);
    if (all || s.stage >= 1) end('A1', 'A′', m.a.dir, -1);
    if (all || s.stage >= 2) end('B1', 'B′', m.b.dir, -1);
    // each quarter has one tab, in its outer corner: its book name and, in the learn view, the hand there and its reflections
    const far = 1.3;
    const beyond = 1.56; // past the thumbs: a tab never hides what it names
    const tab = (id, p0, q0, text, color) => {
      const c = planPoint(p0, q0);
      label(id, text, at(c.x, 0.02, c.z), color, p0 > 0 ? TAB_L : TAB_R);
    };
    tab('q0', far, beyond, all ? 'AOB' : t('l_q_real', { q: 'AOB' }), all ? SLATE : KEPT);
    for (const im of IMAGES) {
      const need = { b: 1, a: 2, ab: 3 }[im.id];
      const pos = { b: [-far, beyond], a: [far, -beyond], ab: [-far, -beyond] }[im.id];
      if (all) {
        tab(`q-${im.id}`, pos[0], pos[1], im.quarter, SLATE);
        continue;
      }
      if (s.stage < need || (s.newest === im.id && s.grow < 0.7)) continue;
      const h = handIn(im.chain);
      const text = t('l_q', { q: im.quarter, h: handWord(h), n: im.chain.length });
      tab(`q-${im.id}`, pos[0], pos[1], highlight(im.id, text), h === 'left' ? KEPT : SWAP);
    }
    if (q) return;
    if (dia.view.eye && settled) {
      const e = dia.view.eye;
      label('eye', t('l_eye'), at(e.x, e.y, e.z), SLATE, FLOOR_SPOTS, lineAvoid, true);
    }
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  function outcome() {
    const a = Math.round(s.alpha);
    if (s.step === 'one') {
      if (s.stage === 0 || s.arm < 1) return t('out_one0');
      return t(s.stage === 1 ? 'out_hands' : 'out_text');
    }
    if (s.step === 'two') {
      if (s.stage === 0) return t('out_angle', { a });
      if (s.stage === 1) return t('out_three', { a, n: 3 });
      return t(s.stage === 2 ? 'out_corner' : 'out_sides');
    }
    return t(`out_t${s.stage}`);
  }
  function rule() {
    if (s.step === 'one') return t(`rule_one${s.stage}`);
    if (s.step === 'two') {
      if (s.stage === 0) return s.alpha < ANGLE.flat ? t('rule_fold', { a: 90 }) : t('rule_two0');
      return t(`rule_two${s.stage}`, { a: 90 });
    }
    return t(`rule_t${s.stage}`);
  }
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    one0: ['act_raise', 1, ICONS.hand],
    one1: ['act_cards', 2, ICONS.hand],
    one2: ['act_to_two', '', ICONS.chevR],
    two0: ['act_fold', 1, ICONS.drag],
    two1: ['act_corner', 2, ICONS.hand],
    two2: ['act_sides', 3, ICONS.hand],
    two3: ['act_to_top', '', ICONS.chevR],
    top0: ['act_q1', 1, ICONS.hand],
    top1: ['act_q2', 2, ICONS.hand],
    top2: ['act_q3', 3, ICONS.hand],
    top3: ['act_test', '', ICONS.chevR],
  };
  function panel() {
    if (s.quiz) return;
    const ph = phase();
    sheet.outcome(outcome());
    sheet.rule(rule());
    sheet.choose(s.step);
    sheet.next(ph === 'one2' ? 'two' : ph === 'two3' ? 'top' : null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    note.hidden = !(s.step === 'top' && s.stage >= 3);
  }
  function draw({ instant = false, duration = 0.9 } = {}) {
    applyWorld();
    panel();
    if (s.quiz) note.hidden = true;
    followFrame(instant, duration);
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  const ringPoint = new THREE.Vector3();
  function actionSpot() {
    if (s.locked || camK < 1) return null;
    const ph = phase();
    if (ph === 'one0') return setting.handAt(null, ringPoint);
    if (ph === 'one1') return setting.cardAt('a', ringPoint);
    if (ph === 'two0') {
      const h = handleAt(s.alpha);
      return ringPoint.set(h.x, h.y, h.z);
    }
    if (ph === 'two1') return setting.boyPoint(0, 1.2, 0, 'ab', ringPoint);
    if (ph === 'two2') return setting.boyPoint(0, 1.2, 0, 'a', ringPoint);
    if (ph === 'top0' || ph === 'top1' || ph === 'top2') {
      const c = planPoint(ph === 'top1' ? FIST_AT.p : -FIST_AT.p, ph === 'top0' ? FIST_AT.q : ph === 'top1' ? -FIST_AT.q : -FIST_AT.q);
      return ringPoint.set(c.x, 0.2, c.z);
    }
    return null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_raise',
    target: actionSpot,
    radius: 22,
    avoid: [ui.corner, ui.hint, note, handleBoxes, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── folding the mirrors by the knob ─────────────────────────────────────────────────────────────────────
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function setAlpha(a) {
    const next = snapAngle(a);
    if (next === s.alpha) return false;
    s.alpha = next;
    if (next === ANGLE.right && s.stage === 0) {
      s.stage = 1;
      s.flash = 1;
      fadeLit();
      audio.success();
    } else if (next !== ANGLE.right && s.stage >= 1) s.stage = 0;
    return true;
  }
  let tap = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      const p = hostXY(e);
      tap = { x: p.x, y: p.y, id: e.pointerId, at: performance.now() };
      const h = dia.handles.fold;
      if (!canFold() || !h || Math.hypot(h.x - p.x, h.y - p.y) > (e.pointerType === 'touch' ? 34 : 24)) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      s.drag = { id: e.pointerId, from: s.alpha, moved: 0, dx: h.x - p.x, dy: h.y - p.y, x0: p.x, y0: p.y };
      action.hide('drag');
      audio.unlock();
      emit('dragstart', { part: 'mirror' });
      e.preventDefault();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g && tap && e.pointerId === tap.id && !s.userMovedCamera && !s.locked) {
      const p = hostXY(e);
      if (Math.hypot(p.x - tap.x, p.y - tap.y) > 8) turnedByHand();
    }
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    g.moved = Math.max(g.moved, Math.hypot(p.x - g.x0, p.y - g.y0));
    // the handle follows the finger along its arc: the angle whose handle stands nearest the finger
    const fx = p.x + g.dx;
    const fy = p.y + g.dy;
    let best = s.alpha;
    let far = Number.POSITIVE_INFINITY;
    for (let a = ANGLE.right; a <= ANGLE.flat; a += ANGLE.step) {
      const h = handleAt(a);
      const c = toScreen(h.x, h.y, h.z);
      const d = Math.hypot(c.x - fx, c.y - fy);
      if (d < far) {
        far = d;
        best = a;
      }
    }
    if (setAlpha(best)) {
      draw({ instant: true });
      emitChange();
    }
  });
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    if (g.moved >= 6) s.dragged = true;
    controls.enabled = !s.locked;
    action.show('drag');
    emit('dragend', { part: 'mirror' });
    if (s.alpha !== g.from) flyCamera(0.7);
    draw();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const wasDrag = s.drag && s.drag.moved >= 6;
    endDrag(e);
    const p = hostXY(e);
    const q = tap;
    tap = null;
    if (wasDrag || !q || q.id !== e.pointerId) return;
    if (Math.hypot(p.x - q.x, p.y - q.y) > 8 || performance.now() - q.at > 500) return;
    if (s.locked || s.busy || s.grow < 1) return;
    const ring = actionSpot();
    if (ring) {
      const c = toScreen(ring.x, ring.y, ring.z);
      if (Math.hypot(c.x - p.x, c.y - p.y) <= 34) act();
    }
  });
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  function applyQuiz(q) {
    const v = dia.view;
    for (const m of q.spots ?? []) v.spots.push(m);
    if (q.ray) drawRay(q.ray, 1, false, 'q');
    if (q.ray) v.backs.length = 0; // the test asks where it seems to come from
    if (q.ray) v.points.length = 0;
  }
  function quizScene(q) {
    stopMotion();
    s.quiz = q;
    clearLabels();
    applyWorld();
    shownFrame = frameId();
    stage.invalidate();
  }
  // the kit's quiz compares numbers: every choice here is a number, and a choice's note is found by that number
  const notesOf = (pairs) => new Map(pairs.map(([v, html]) => [String(v), html]));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const letters = t('letters').split(',');
  let qCurrent = null;
  const HANDS = ['c_lk', 'c_lu', 'c_rk', 'c_ru'];
  /** A mark on the boy's image, at his head. */
  const tagOn = (key, text) => {
    const p = setting.boyPoint(0, 1.7, 0, key, new THREE.Vector3());
    return { id: 'qt', text: `<b>${text}</b>`, x: p.x, y: p.y, z: p.z, spots: ABOVE };
  };
  function prepare(kind) {
    const mark = letters[0];
    if (kind === 'fold') {
      quizScene({ kind, world: 'boy', alpha: ANGLE.flat, frame: 'one' });
      const wrong = ANGLE_CHOICES.filter((a) => a !== 90);
      return {
        text: t('q_fold'),
        answer: 90,
        wrong,
        label: (a) => t('c_deg', { a }),
        notes: notesOf(wrong.map((a) => [a, t(`n_fold_${a}`)])),
        reveal: t('a_fold', { a: 90 }),
      };
    }
    if (kind === 'times') {
      setting.setAngle(ANGLE.right);
      const key = pick(['a', 'b', 'ab']);
      const n = key.length;
      quizScene({ kind, world: 'boy', alpha: ANGLE.right, frame: 'open', tags: [tagOn(key, mark)] });
      const wrong = [0, 1, 2, 3].filter((a) => a !== n);
      return {
        text: t('q_times', { x: mark }),
        answer: n,
        wrong,
        label: (a) => t('c_times', { a }),
        notes: notesOf(wrong.map((a) => [a, t(a === 0 ? 'n_times_0' : a === 3 ? 'n_times_three' : n === 2 ? 'n_times_less' : 'n_times_more')])),
        reveal: t('a_times', { a: n, why: t(n === 2 ? 'a_times_corner' : 'a_times_side') }),
      };
    }
    if (kind === 'hand') {
      setting.setAngle(ANGLE.right);
      const key = pick(['a', 'b', 'ab', 'ab']);
      const n = key.length;
      quizScene({ kind, world: 'boy', alpha: ANGLE.right, frame: 'open', tags: [tagOn(key, mark)] });
      const answer = n === 2 ? 0 : 3;
      const wrong = [0, 1, 2, 3].filter((a) => a !== answer);
      const why = t(n === 2 ? 'n_hand_corner' : 'n_hand_side');
      return {
        text: t('q_hand', { x: mark }),
        answer,
        wrong,
        label: (a) => t(HANDS[a]),
        notes: notesOf(wrong.map((a) => [a, a === 1 || a === 2 ? t('n_hand_half') : why])),
        reveal: t('a_hand', { a: t(HANDS[answer]), why }),
      };
    }
    if (kind === 'place') {
      const where = pick(PLACE_AT);
      const places = shuffle(placeChoices(where));
      const tags = places.map((c, j) => {
        const p = planPoint(c.p, c.q);
        return { id: `qs${j}`, text: `<b>${letters[j]}</b>`, x: p.x, y: 0.02, z: p.z, spots: ON_SPOT };
      });
      quizScene({
        kind,
        world: 'fist',
        at: where,
        frame: 'plan',
        spots: places.map((c) => ({ ...planPoint(c.p, c.q) })),
        tags,
      });
      const answer = places.findIndex((c) => c.v === 'true');
      const wrong = [0, 1, 2, 3].filter((j) => j !== answer);
      return {
        text: t('q_place'),
        answer,
        wrong,
        label: (j) => t('c_mark', { x: letters[j] }),
        notes: notesOf(wrong.map((j) => [j, t(`n_place_${places[j].v}`)])),
        reveal: t('a_place', { x: letters[answer] }),
      };
    }
    // a ray drawn on the plan: which quarter does it seem to come from?
    const chain = pick([['a'], ['b'], ['b', 'a']]);
    const r = planRay(chain);
    const quarter = quarterOf(r.image);
    const names = ['AOB', 'A′OB', 'AOB′', 'A′OB′'];
    const answer = names.indexOf(quarter);
    quizScene({ kind, world: 'fist', frame: 'plan', ray: r });
    const wrong = [0, 1, 2, 3].filter((j) => j !== answer);
    return {
      text: t('q_ray'),
      answer,
      wrong,
      label: (j) => names[j],
      notes: notesOf(wrong.map((j) => [j, t(j === 0 ? 'n_ray_real' : chain.length === 1 && names[j] === 'A′OB′' ? 'n_ray_two' : 'n_ray_one')])),
      reveal: t('a_ray', { a: quarter }),
    };
  }
  const ORDER = ['fold', 'times', 'hand', 'place', 'ray'];
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
        s.mode = 'quiz';
        s.locked = true;
        stopMotion();
        if (s.drag) {
          controls.enabled = true;
          s.drag = null;
          action.show('drag');
        }
        clearLabels();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        clearLabels();
        syncUI();
        shownFrame = frameId();
        flyCamera(0.6);
        draw();
      },
      async prepare(i, alive, say) {
        const q = prepare(ORDER[i]);
        qCurrent = q;
        say(' ');
        ui.$('.pvc-q-text').innerHTML = q.text;
        const done = await flyCamera(
          i === 0 || s.quiz.world !== (i ? (ORDER[i - 1] === 'place' || ORDER[i - 1] === 'ray' ? 'fist' : 'boy') : 'boy') ? 1.2 : 0.5,
        );
        if (!alive()) return null;
        if (!done) camK = 1;
        const out = [q.answer];
        for (const w of q.wrong) if (out.length < 4 && !out.includes(w)) out.push(w);
        return { choices: shuffle(out), expected: q.answer, tolerance: 1e-6, label: q.label, meta: { kind: ORDER[i] } };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        const why = !correct && picked ? q.notes.get(String(picked.value)) : '';
        return `${q.reveal}${why ? ` <span class="ra-why">${t('n_pick', { x: q.label(picked.value) })} ${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    controls.enableRotate = !s.locked;
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
    stopMotion();
    buildTo(s.step, 0);
    clearLabels();
    if (s.view === '3d') setView('front');
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
    if (b.dataset.example) go(b.dataset.example);
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
    const walk = { ArrowRight: 5, ArrowLeft: -5 }[e.key];
    if (walk) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (!canFold()) return;
      if (setAlpha(s.alpha + walk)) {
        s.dragged = true;
        draw({ instant: true });
        emitChange();
      }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      act();
    }
  });

  // ── state for the book ──────────────────────────────────────────────────────────────────────────────────
  function imagesNow() {
    if (inFist()) {
      const real = planPoint(FIST_AT.p, FIST_AT.q);
      return IMAGES.filter((q) => ghostK(q.id) > 0).map((q) => {
        const c = imageOf(real, q.chain, ANGLE.right);
        return { id: q.id, quarter: quarterOf(c), x: +c.x.toFixed(4), z: +c.z.toFixed(4), hand: handIn(q.chain), reflections: q.chain.length };
      });
    }
    if (s.alpha !== ANGLE.right) return [];
    return IMAGES.map((q) => {
      const c = setting.boyPoint(0, 0, 0, q.id, new THREE.Vector3());
      return { id: q.id, x: +c.x.toFixed(4), z: +c.z.toFixed(4), hand: handIn(q.chain), reflections: q.chain.length };
    });
  }
  function rayNow() {
    if (!inFist() || s.quiz || s.stage < 3) return null;
    const r = planRay(['b', 'a']);
    const six = (a) => +a.toFixed(6);
    return {
      chain: r.hits.map((h) => h.mirror),
      miss: six(r.miss),
      backMiss: six(r.backMiss),
      onGlass: r.onGlass,
      quarter: quarterOf(r.image),
      angles: r.hits.map((h) => ({ thetaI: six(h.thetaI), thetaR: six(h.thetaR) })),
    };
  }
  function snapshot() {
    return {
      step: s.step,
      stage: s.stage,
      phase: phase(),
      alpha: +s.alpha.toFixed(3),
      arm: +s.arm.toFixed(3),
      world: inFist() ? 'fist' : 'boy',
      images: imagesNow(),
      handle: { shown: canFold(), used: s.dragged },
      ray: rayNow(),
      frame: shownFrame,
      question: s.quiz && qCurrent ? { kind: s.quiz.kind, answer: qCurrent.label(qCurrent.answer) } : null,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.step, snap.phase, snap.alpha]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
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
      if (p.step && STEPS.includes(p.step) && p.step !== s.step) {
        stopMotion();
        clearLabels();
        buildTo(p.step, 0);
      }
      if (p.stage != null) {
        stopMotion();
        clearLabels();
        buildTo(s.step, p.stage);
      }
      if (p.alpha != null && s.step === 'two') {
        stopMotion();
        const a = snapAngle(Number(p.alpha));
        if (animate) await moveTo({ alpha: a }, 1);
        s.alpha = a;
        if (a === ANGLE.right && s.stage === 0) s.stage = 1;
        if (a !== ANGLE.right && s.stage > 0) s.stage = 0;
      }
      if (!animate) camK = 1;
      draw({ instant: !animate });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      stopMotion();
      buildTo('one', 0);
      s.dragged = false;
      clearLabels();
      setView('front', { animate: false });
      camK = 1;
      draw({ instant: true });
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
    exportRoot: () => setting.exportModel(),
  };
}
