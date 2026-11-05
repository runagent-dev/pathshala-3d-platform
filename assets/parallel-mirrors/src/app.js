// Images in two mirrors (দুটি আয়নায় প্রতিবিম্ব), book p215–216, the উদাহরণ under 8.2.1, চিত্র ৮.০৪: the student view. A lit candle
// stands between two parallel silvered-glass mirrors on a table. Three steps in the book's order, one thing at a time:
// (1) the image x′ in each mirror, with d₁ and d₂ before and behind it, and the student drags the candle; (2) each x′ is an
// object for the other mirror: the image of the image x″, then x‴, with d₃ and d₄, the row of চিত্র ৮.০৪; (3) it goes on: the
// row runs off both ways, and then the camera looks into M₁, where the same images are seen as a real pair of mirrors shows
// them. Any named image can be tapped to trace its light. The panel is the kit's clean sheet. A 5-question test.
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
import { brightness, CANDLE, chainOf, COUNT, distances, EYE, GLASS, imageAt, M, NAMED, path, row, shuffle, snapCandle } from './reading.js';
import { createSetting } from './setting.js';

export const DEFAULTS = {
  step: 'first', // 'first' | 'second' | 'many'
  x: CANDLE.start, // the candle on the row, cm from the middle of the gap
  stage: 0, // how far the step is built
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  sound: true,
  shadow: true,
};

const STEPS = ['first', 'second', 'many'];
// where a distance's name sits: over its arrow, or, where two arrows meet at a mirror, a little to the outside of each
const ON_DIM = [
  { dx: 0, dy: -13 },
  { dx: -13, dy: -13 },
  { dx: 13, dy: -13 },
  { dx: 0, dy: 13 },
  { dx: 0, dy: -27 },
];
const DIM_L = [
  { dx: -12, dy: -13 },
  { dx: -12, dy: 13 },
];
const DIM_R = [
  { dx: 12, dy: -13 },
  { dx: 12, dy: 13 },
];
const FAR_L = [{ dx: -32, dy: -13 }];
const FAR_R = [{ dx: 32, dy: -13 }];
const INK = C.ink;
const SLATE = '#33506b';
const TIP = CANDLE.tip + 0.8; // where a distance's dotted line ends above a flame
const TOP = GLASS.top + 0.6; // … and above a mirror
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const seg = (g, a, b) => clamp((g - a) / (b - a), 0, 1);
const num = (x) => String(Math.round(x * 10) / 10);
const primes = (k) => ['', 'l_x1', 'l_x2', 'l_x3'][k] || '';
const SIDES = { r: 'r', l: 'l' };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'pm2');
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
  note.className = 'pm2-note';
  note.textContent = t('note_rays');
  note.hidden = true;
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const FOV = 20;
  const stage = createStage(ui.canvasHost, { fov: FOV, near: 2, far: 6000, environment: 'studio-light', environmentIntensity: 0.3 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(50);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(87);
  /** The student turns the view within these; a flight into the mirror goes beyond them. */
  function freeTurn(free) {
    controls.minAzimuthAngle = free ? Number.NEGATIVE_INFINITY : THREE.MathUtils.degToRad(-58);
    controls.maxAzimuthAngle = free ? Number.POSITIVE_INFINITY : THREE.MathUtils.degToRad(40);
  }
  freeTurn(false);
  const setting = createSetting({ stage, shadow: Boolean(o.shadow) });
  const dia = createDiagram({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    step: STEPS.includes(o.step) ? o.step : 'first',
    x: snapCandle(Number.isFinite(Number(o.x)) ? Number(o.x) : CANDLE.start),
    first: 0, // 0 nothing yet, 1 x′ in M₁, 2 x′ in M₂, 3 the candle has moved
    second: 0, // 0 nothing yet, 1 x″ in M₁, 2 x″ in M₂, 3 x‴ in M₁
    many: 0, // 0 the book's row, 1 it runs on, 2 looking into M₁
    inside: 0, // the flight into M₁, 0 … 1
    newest: '', // what is growing in
    grow: 1,
    flash: 0,
    trace: '', // the image whose ray is drawn
    busy: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    drag: null,
  };
  function buildTo(step, stageN) {
    const n = Math.round(Number(stageN) || 0);
    s.first = step === 'first' ? clamp(n, 0, 3) : 3;
    s.second = step === 'second' ? clamp(n, 0, 3) : step === 'many' ? 3 : 0;
    s.many = step === 'many' ? clamp(n, 0, 2) : 0;
    s.inside = s.many === 2 ? 1 : 0;
  }
  buildTo(s.step, o.stage);

  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  // the flames: a gentle flicker, about 16 times a second is enough for it
  let clock = 0;
  let since = 1;
  stage.addTicker((dt) => {
    clock += dt;
    since += dt;
    if (since < 0.06) return false;
    since = 0;
    setting.tickFlames(clock);
    return 'camera';
  });
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  /** What the panel's action does now. */
  function phase() {
    if (s.busy || s.grow < 1) return 'busy';
    if (s.step === 'first') return `f${s.first}`;
    if (s.step === 'second') return `s${s.second}`;
    return `m${s.many}`;
  }
  /** The images built so far: book's row first. */
  function builtIds() {
    if (s.quiz) return s.quiz.show;
    const ids = [];
    if (s.first >= 1) ids.push('r1');
    if (s.first >= 2) ids.push('l1');
    if (s.second >= 1) ids.push('r2');
    if (s.second >= 2) ids.push('l2');
    if (s.second >= 3) ids.push('r3');
    if (s.many >= 1) for (const q of row(0)) if (!ids.includes(q.id)) ids.push(q.id);
    return ids;
  }
  const inRow = () => !s.quiz && s.step === 'many' && s.many >= 1;
  const canDrag = () => !s.locked && !s.busy && s.grow >= 1 && s.many < 1 && !(s.step === 'first' && s.first < 2);

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  /** The heights of the book's three rows of distances, cm: further apart where the view is narrow and there is height. */
  const rowAt = (i) => (stage.width / stage.height < 1.25 ? 48 + i * 15 : 44 + i * 11);
  function dimsNow() {
    const g = s.grow;
    const out = [];
    const x = s.x;
    const pair = (name, from, m, to, y, newest, drop, text) => {
      const k0 = s.newest === newest ? seg(g, 0, 0.34) : 1;
      const k1 = s.newest === newest ? seg(g, 0.68, 1) : 1;
      const lit = s.newest === newest;
      if (k0 > 0) out.push({ id: `${name}a`, x0: from, x1: m, y, k: k0, lit, drop0: drop, drop1: TOP, text, spots: ON_DIM });
      if (k1 > 0)
        out.push({
          id: `${name}b`,
          x0: m,
          x1: to,
          y,
          k: k1,
          lit,
          drop0: TOP,
          drop1: TIP,
          text,
          spots: name === 'd1' ? DIM_R : name === 'd2' ? DIM_L : ON_DIM,
        });
    };
    if (inRow()) return out;
    const r1 = imageAt(x, 'r', 1);
    const l1 = imageAt(x, 'l', 1);
    if (s.first >= 1) pair('d1', x, M.m1, r1, rowAt(0), 'r1', TIP, t('l_d1'));
    if (s.first >= 2) pair('d2', x, M.m2, l1, rowAt(0), 'l1', TIP, t('l_d2'));
    if (s.second === 2) pair('e', r1, M.m2, imageAt(x, 'l', 2), rowAt(1), 'l2', TIP, t('l_cm', { a: N(num(r1 - M.m2)) }));
    else if (s.second >= 1) pair('d3', l1, M.m1, imageAt(x, 'r', 2), rowAt(1), 'r2', TIP, t('l_d3'));
    if (s.second >= 3) pair('d4', imageAt(x, 'l', 2), M.m1, imageAt(x, 'r', 3), rowAt(2), 'r3', TIP, t('l_d4'));
    return out;
  }
  let dimsShown = [];
  /** A chain of mirrors in words. */
  const chainWords = (side, k) =>
    chainOf(side, k)
      .map((m) => (m === 'm1' ? t('l_m1s') : t('l_m2s')))
      .join(t('chain_sep'));
  function drawRay(id, k, lit) {
    const v = dia.view;
    const side = id[0];
    const n = Number(id[1]);
    const r = path(s.x, side, n);
    v.ray = { points: r.points, k, lit };
    const g = lit ? seg(k, 0.5, 1) : 1;
    r.via.forEach((q, i) => {
      const last = i === r.via.length - 1;
      v.backs.push({ x0: q.from.x, y0: q.from.y, x1: q.x, y1: q.y, k: last ? seg(s.newest ? s.grow : 1, 0.72, 0.95) : g, lit });
    });
    for (const h of r.hits) if (k >= 1) v.points.push([h.x, h.y, 2.6, C.ray]);
    v.points.push([s.x, CANDLE.flame, 2.8, C.ray]);
    v.eye = { x: r.eye.x, y: r.eye.y, tx: r.hits[r.hits.length - 1].x, ty: r.hits[r.hits.length - 1].y };
  }
  function applyWorld() {
    setting.setCandle(s.x);
    const ids = builtIds();
    for (const q of row(0)) {
      let a = ids.includes(q.id) ? 1 : 0;
      if (a && s.newest === q.id) a = seg(s.grow, 0.62, 1);
      if (a && s.newest === 'row' && q.k >= 3 && !(q.id === 'r3')) a = seg(s.grow, 0.05 + (q.k - 2) * 0.13, 0.25 + (q.k - 2) * 0.13);
      setting.setImage(q.id, a);
    }
    setting.setInside(s.inside);
    dia.clear();
    const v = dia.view;
    v.flash = s.flash;
    if (s.quiz) return applyQuiz(s.quiz);
    dimsShown = dimsNow();
    v.dims.push(...dimsShown);
    if (s.trace && !inRow()) {
      const k = s.newest === s.trace ? seg(s.grow, 0.12, 0.72) : 1;
      if (k > 0) drawRay(s.trace, k, s.newest === s.trace);
    }
    if (canDrag()) v.drag.candle = { x: s.x };
  }

  // ── camera: each step frames what it is about, and flies there smoothly ────────────────────────────────
  const FRAMES = {
    gap: { az: -25, el: 12, fov: FOV },
    one: { az: -24, el: 12, fov: FOV },
    book: { az: -22, el: 13, fov: FOV },
    row: { az: -26, el: 9, fov: FOV },
    inside: { pose: true, fov: 44 },
  };
  function frameKey() {
    if (s.quiz) return `q-${s.quiz.kind}`;
    if (s.step === 'first') return s.first === 0 ? 'gap' : s.first === 1 ? 'one' : 'both';
    if (s.step === 'second') return ['both', 'two', 'twol', 'three'][s.second];
    return ['three', 'row', 'inside'][s.many];
  }
  /** The frame with what a ray adds to it: the eye. */
  const frameId = () => (s.trace && !s.quiz ? `${frameKey()}:${s.trace[0]}` : frameKey());
  let camFrom = null;
  let camK = 1;
  let shownFrame = '';
  const FRAME = new THREE.Box3();
  const margin = { top: 36, bottom: 28, left: 8, right: 8 };
  const camDir = new THREE.Vector3();
  const inPose = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  /** Beside the panel its tab stands on the view's right edge. */
  const panelBeside = () => root.clientWidth >= root.clientHeight && root.clientWidth >= 600;
  function poseNow() {
    const key = frameKey();
    const f = FRAMES[key] || FRAMES.book;
    if (f.pose) {
      inPose.position.set(-14, 22, 12.6);
      inPose.target.set(15, 17.5, 2.8);
      inPose.fov = f.fov;
      return inPose;
    }
    const a = THREE.MathUtils.degToRad(f.az);
    const e = THREE.MathUtils.degToRad(f.el);
    camDir.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
    let x0 = -24;
    let x1 = 24;
    let top = GLASS.top + 4;
    if (key === 'row') {
      x0 = -106;
      x1 = 136;
    } else {
      for (const id of builtIds()) {
        const at = imageAt(s.x, id[0], Number(id[1]));
        x0 = Math.min(x0, at - 8);
        x1 = Math.max(x1, at + 8);
      }
      if (s.quiz?.range) {
        x0 = Math.min(x0, s.quiz.range[0]);
        x1 = Math.max(x1, s.quiz.range[1]);
      }
      if (s.trace) {
        const ex = s.trace[0] === 'r' ? -EYE.x - 6 : EYE.x + 6;
        x0 = Math.min(x0, ex);
        x1 = Math.max(x1, ex);
        top = Math.max(top, EYE.y + 3);
      }
      const rows = s.quiz ? (s.quiz.rows ?? 1) : s.second >= 3 ? 3 : s.second >= 1 ? 2 : s.first >= 1 ? 1 : 0;
      if (rows) top = Math.max(top, rowAt(rows - 1) + 7);
    }
    FRAME.min.set(x0, -2, -6);
    FRAME.max.set(x1, top, 8);
    margin.top = 40;
    margin.right = panelBeside() ? 34 : 8;
    margin.left = 8;
    margin.bottom = 40;
    const pose = fitPose({ box: FRAME, dir: camDir, camera: { fov: f.fov }, width: stage.width, height: stage.height, margin });
    pose.fov = f.fov;
    return pose;
  }
  function setFov(fov) {
    if (Math.abs(camera.fov - fov) < 1e-3) return;
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  function applyCamera() {
    if (s.userMovedCamera) return;
    const pz = poseNow();
    freeTurn(s.inside > 0 || camK < 1);
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, pz.position, k);
      controls.target.lerpVectors(camFrom.target, pz.target, k);
      setFov(camFrom.fov + (pz.fov - camFrom.fov) * k);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
      setFov(pz.fov);
    }
    controls.update();
  }
  function flyCamera(duration = 0.9) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      s.view = 'front';
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone(), fov: camera.fov };
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
    shownFrame = key;
    if (first || instant) {
      tweener.cancel('camera');
      camK = 1;
    } else flyCamera(duration);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    if (animate) flyCamera(0.7);
    else camK = 1;
    stage.invalidate();
  }
  controls.addEventListener('start', () => {
    if (s.drag) return;
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
    setting.setFloorFade(camera, FRAME.min.x, FRAME.max.x);
    setting.updateClip(camera);
    labels();
  });

  // ── moving on ─────────────────────────────────────────────────────────────────────────────────────────
  function moveTo(x, duration = 0.9) {
    const a = s.x;
    return tweener.animate({
      key: 'pose',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.x = a + (x - a) * k;
        draw();
      },
      onComplete: () => {
        s.x = x;
      },
    }).finished;
  }
  /** What a move under way will leave behind: a stop lands on it, never half way. */
  let landing = null;
  function stopMotion() {
    ++token;
    for (const k of ['pose', 'reveal', 'flash', 'inside']) tweener.cancel(k);
    landing?.();
    landing = null;
    s.busy = false;
    s.grow = 1;
    s.flash = 0;
    s.newest = '';
  }
  function go(step, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (!STEPS.includes(step)) return;
    stopMotion();
    const wasInside = s.inside > 0;
    s.step = step;
    s.trace = '';
    if (step !== 'first') s.first = 3;
    if (step === 'many') s.second = 3;
    if (step !== 'many') {
      s.many = 0;
      s.inside = 0;
    }
    clearLabels();
    if (wasInside && animate && step !== 'many') {
      s.inside = 1;
      leaveMirror();
      return;
    }
    draw({ instant: !animate });
    emitChange();
  }
  /** Runs an eased move as the action's demonstration, then what follows it. */
  function demo(x, duration, then) {
    const my = ++token;
    s.busy = true;
    landing = () => {
      s.x = x;
      then?.();
    };
    draw();
    moveTo(x, duration).then((ok) => {
      if (my !== token) return;
      s.busy = false;
      landing = null;
      if (ok) {
        then?.();
        audio.success();
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
  /** The next thing grows in, highlighted, with the ray that makes it. */
  function reveal(id, duration = 2) {
    const my = ++token;
    tweener.cancel('flash');
    s.newest = id;
    s.flash = 1;
    s.grow = 0;
    if (id !== 'row') s.trace = id;
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
  function enterMirror() {
    const my = ++token;
    s.many = 2;
    s.trace = '';
    s.busy = true;
    landing = () => {
      s.inside = 1;
    };
    clearLabels();
    draw({ duration: 2.2 });
    tweener
      .animate({
        key: 'inside',
        duration: 2.2,
        ease: ease.linear,
        onUpdate: (k) => {
          s.inside = k;
          draw();
        },
      })
      .finished.then((ok) => {
        if (!ok || my !== token) return;
        s.inside = 1;
        s.busy = false;
        landing = null;
        audio.success();
        draw();
        emitChange();
      });
  }
  function leaveMirror() {
    const my = ++token;
    s.busy = true;
    if (s.many === 2) s.many = 1;
    landing = () => {
      s.inside = 0;
    };
    clearLabels();
    draw({ duration: 1.6 });
    tweener
      .animate({
        key: 'inside',
        duration: 1.6,
        ease: ease.linear,
        onUpdate: (k) => {
          s.inside = 1 - k;
          draw();
        },
      })
      .finished.then((ok) => {
        if (!ok || my !== token) return;
        s.inside = 0;
        s.busy = false;
        landing = null;
        draw();
        emitChange();
      });
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    const ph = phase();
    if (ph === 'f0') {
      s.first = 1;
      return reveal('r1');
    }
    if (ph === 'f1') {
      s.first = 2;
      return reveal('l1');
    }
    if (ph === 'f2') {
      s.trace = '';
      return demo(s.x >= 3 ? -3 : 5, 1.5, () => {
        s.first = 3;
      });
    }
    if (ph === 'f3') return go('second');
    if (ph === 's0') {
      s.second = 1;
      return reveal('r2', 2.6);
    }
    if (ph === 's1') {
      s.second = 2;
      return reveal('l2', 2.6);
    }
    if (ph === 's2') {
      s.second = 3;
      return reveal('r3', 2.6);
    }
    if (ph === 's3') return go('many');
    if (ph === 'm0') {
      s.many = 1;
      s.trace = '';
      return reveal('row', 2.2);
    }
    if (ph === 'm1') return enterMirror();
    if (ph === 'm2') return leaveMirror();
  }

  // ── labels on the picture: pinned to what they name ────────────────────────────────────────────────────
  let action = null;
  const handleBoxes = () => {
    const p = dia.handles.candle;
    return p ? [{ left: p.x - 18, top: p.y - 18, right: p.x + 18, bottom: p.y + 18 }] : [];
  };
  const panelTab = ui.$('.pvc-panel-toggle');
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, note, panelTab, handleBoxes, () => action?.ringBox()] });
  const shown = new Map();
  const used = new Map();
  const pts = new Map();
  const touched = new Set();
  function label(id, text, point, color, spots, avoid = []) {
    touched.add(id);
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).copy(point);
    if (!shown.has(id)) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', avoid });
      shown.set(id, text);
      used.set(id, spots);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
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
  /** Canvas pixels of a scene point. The object is reused: copy what you keep. */
  function toScreen(x, y, z = 0) {
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
        const a = toScreen(p[i - 1].x + ((p[i].x - p[i - 1].x) * q) / 8, p[i - 1].y + ((p[i].y - p[i - 1].y) * q) / 8);
        out.push({ left: a.x - 5, top: a.y - 5, right: a.x + 5, bottom: a.y + 5 });
      }
    return out;
  }
  const lineAvoid = [lineBoxes];
  const v3 = new THREE.Vector3();
  const at = (x, y, z = 0) => v3.set(x, y, z);
  const UNDER = [
    { dx: 0, dy: 26 },
    { dx: -16, dy: 28 },
    { dx: 16, dy: 28 },
    { dx: 0, dy: 40 },
  ];
  // far along the row x″ and x‴ stand close: their names take turns
  const ROW_UNDER = [{ dx: 0, dy: 26 }];
  const ROW_LOW = [{ dx: 0, dy: 50 }];
  const ABOVE = [
    { dx: 0, dy: -14 },
    { dx: 0, dy: -24 },
  ];
  const TOP_SPOTS = [
    { dx: 0, dy: -15 },
    { dx: 26, dy: -15 },
    { dx: -26, dy: -15 },
    { dx: 0, dy: -30 },
  ];
  const EYE_SPOTS = [
    { dx: 0, dy: -24 },
    { dx: -30, dy: 0 },
    { dx: 30, dy: 0 },
    { dx: 0, dy: 26 },
  ];
  const IN_SPOTS = [
    { dx: 0, dy: -32 },
    { dx: 0, dy: -52 },
    { dx: 16, dy: -34 },
    { dx: -16, dy: -52 },
    { dx: 18, dy: -54 },
    { dx: 0, dy: -72 },
  ];
  const MORE_SPOTS = [
    { dx: 0, dy: -26 },
    { dx: 0, dy: -52 },
    { dx: -20, dy: -34 },
    { dx: 20, dy: -34 },
  ];
  const nameOf = (id) => t(primes(Number(id[1])));
  const highlight = (id, text) => (s.newest === id && s.flash > 0 ? `<span class="pm2-new">${text}</span>` : text);
  function labels() {
    touched.clear();
    const settled = camK >= 1;
    const q = s.quiz;
    const inMirror = s.inside >= 1;
    const flying = s.inside > 0 && s.inside < 1;
    const ids = builtIds();
    if (!flying && !inRow() && !inMirror) {
      const wide = stage.width >= 480 && !(s.second >= 1 || q);
      label('m1', wide ? t('l_m1') : t('l_m1s'), at(M.m1, GLASS.top), INK, TOP_SPOTS);
      label('m2', wide ? t('l_m2') : t('l_m2s'), at(M.m2, GLASS.top), INK, TOP_SPOTS);
    }
    if (!inRow() && !flying) label('x', s.first === 0 && !q ? t('l_candle') : t('l_x'), at(s.x, 0, 4), INK, UNDER);
    if (inMirror && !q) {
      label('m1', t('l_m1s'), at(M.m1, GLASS.y1, -8), INK, [{ dx: 0, dy: -18 }]);
      for (const k of [1, 2, 3]) label(`in${k}`, t(primes(k)), at(imageAt(s.x, 'r', k), CANDLE.tip + 0.4), INK, IN_SPOTS);
    }
    if (settled && !inRow() && !inMirror && !flying) {
      for (const id of ids) {
        // in the test the picture must not name what it asks, and the answer's own mark keeps its letter
        if (Number(id[1]) > NAMED || q?.kind === 'times' || (q?.kind === 'spot' && id === 'r2')) continue;
        const im = imageAt(s.x, id[0], Number(id[1]));
        const named = s.step === 'first' && !q ? t('l_image', { n: nameOf(id) }) : nameOf(id);
        label(`i${id}`, highlight(id, named), at(im, 0, 4), INK, UNDER, lineAvoid);
      }
      for (const d of q ? (q.dims ?? []) : dimsShown) {
        const whole = d.k == null || d.k >= 1;
        if (!whole) continue;
        const text = s.newest && d.lit ? `<span class="pm2-new">${d.text}</span>` : d.text;
        label(d.id, text, at((d.x0 + d.x1) / 2, d.y), INK, d.spots ?? ON_DIM);
      }
      if (s.trace && !q) {
        const e = dia.view.eye;
        if (e) label('eye', t('l_eye'), at(e.x, e.y), SLATE, EYE_SPOTS, lineAvoid);
      }
      if (s.newest === 'r2' && s.grow < 0.68) label('obj', t('l_object'), at(imageAt(s.x, 'l', 1), CANDLE.tip + 0.4), '#9a5300', ABOVE);
      if (s.newest === 'l2' && s.grow < 0.68) label('obj', t('l_object'), at(imageAt(s.x, 'r', 1), CANDLE.tip + 0.4), '#9a5300', ABOVE);
      if (s.newest === 'r3' && s.grow < 0.68) label('obj', t('l_object2'), at(imageAt(s.x, 'l', 2), CANDLE.tip + 0.4), '#9a5300', ABOVE);
    }
    if (inRow() && settled && !s.busy && s.inside === 0) {
      const small = stage.width < 460;
      label('more', small ? '…' : t('l_more'), at(126, CANDLE.tip + 6), INK, MORE_SPOTS);
      label('more2', small ? '…' : t('l_more0'), at(-96, CANDLE.tip + 6), INK, MORE_SPOTS);
      label('m1', t('l_m1s'), at(M.m1, GLASS.top), INK, TOP_SPOTS);
      label('m2', t('l_m2s'), at(M.m2, GLASS.top), INK, TOP_SPOTS);
      label('x', t('l_x'), at(s.x, 0, 4), INK, UNDER);
      for (const id of ['r1', 'r2', 'r3', 'l1', 'l2', 'l3'])
        label(`i${id}`, nameOf(id), at(imageAt(s.x, id[0], Number(id[1])), 0, 4), INK, id[1] === '3' ? ROW_LOW : ROW_UNDER);
    }
    if (q) {
      for (const m of q.tags ?? []) label(m.id, m.text, at(m.x, m.y, m.z ?? 0), INK, m.spots ?? UNDER);
    }
    for (const id of [...shown.keys()])
      if (!touched.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  function outcome() {
    const d = distances(s.x);
    const a = N(num(d.d1));
    const b = N(num(d.d2));
    if (s.trace && !s.newest && pickedTrace) {
      const k = Number(s.trace[1]);
      return t('out_pick', { n: nameOf(s.trace), k }).replace('{chain}', chainWords(s.trace[0], k));
    }
    if (s.step === 'first') {
      if (s.first === 0) return t('out_f0');
      if (s.first === 1) return t('out_d1', { a });
      return t('out_d12', { a, b });
    }
    if (s.step === 'second') {
      if (s.second === 0) return t('out_d12', { a, b });
      if (s.second === 1) return t('out_d3', { a: N(num(d.d3)) });
      if (s.second === 2) return t('out_l2', { a: N(num(imageAt(s.x, 'r', 1) - M.m2)) });
      return t('out_d34', { a: N(num(d.d3)), b: N(num(d.d4)) });
    }
    if (s.many === 2) return t('out_light', { a: brightness(1), b: brightness(2), c: brightness(3) });
    if (s.many === 1) return t('out_row');
    return t('out_d34', { a: N(num(d.d3)), b: N(num(d.d4)) });
  }
  function rule() {
    if (s.trace && !s.newest && pickedTrace) return t('rule_pick');
    if (s.step === 'first') return t(`rule_f${s.first}`);
    if (s.step === 'second') return t(`rule_s${s.second}`);
    return t(`rule_m${s.many}`);
  }
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    f0: ['act_r1', 1, ICONS.hand],
    f1: ['act_l1', 2, ICONS.hand],
    f2: ['act_drag', 3, ICONS.drag],
    f3: ['act_to_second', '', ICONS.chevR],
    s0: ['act_r2', 1, ICONS.hand],
    s1: ['act_l2', 2, ICONS.hand],
    s2: ['act_r3', 3, ICONS.hand],
    s3: ['act_to_many', '', ICONS.chevR],
    m0: ['act_row', 1, ICONS.hand],
    m1: ['act_inside', 2, ICONS.hand],
    m2: ['act_out', '', ICONS.chevR],
  };
  let pickedTrace = false;
  function panel() {
    if (s.quiz) return;
    const ph = phase();
    sheet.outcome(outcome());
    sheet.rule(rule());
    sheet.choose(s.step);
    sheet.next(ph === 'f3' ? 'second' : ph === 's3' ? 'many' : null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    note.hidden = !s.trace || inRow();
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
  /** The point the action's ring stands on now, or null. */
  function actionSpot() {
    if (s.locked || camK < 1) return null;
    const ph = phase();
    if (ph === 'f0') return ringPoint.set(M.m1, 16, 0);
    if (ph === 'f1') return ringPoint.set(M.m2, 16, 0);
    if (ph === 'f2') return ringPoint.set(s.x, 8, 0);
    if (ph === 's0') return ringPoint.set(imageAt(s.x, 'l', 1), 9, 0);
    if (ph === 's1') return ringPoint.set(imageAt(s.x, 'r', 1), 9, 0);
    if (ph === 's2') return ringPoint.set(imageAt(s.x, 'l', 2), 9, 0);
    if (ph === 'm1') return ringPoint.set(M.m1, 25, 0);
    return null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_r1',
    target: actionSpot,
    radius: 20,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── dragging the candle, and tapping an image ──────────────────────────────────────────────────────────
  function onCandle(x, y, touch) {
    if (!canDrag()) return false;
    const p = dia.handles.candle;
    if (p && Math.hypot(p.x - x, p.y - y) <= (touch ? 34 : 24)) return true;
    const a = { ...toScreen(s.x, 0) };
    const b = toScreen(s.x, CANDLE.tip);
    return Math.abs(x - a.x) < (touch ? 30 : 22) && y > b.y - 6 && y < a.y + 10;
  }
  /** The named image under a tap. */
  function imageUnder(x, y) {
    let best = '';
    let far = 1e9;
    for (const id of builtIds()) {
      if (Number(id[1]) > NAMED) continue;
      const im = imageAt(s.x, id[0], Number(id[1]));
      const a = { ...toScreen(im, 0) };
      const b = toScreen(im, CANDLE.tip);
      const d = Math.abs(x - a.x);
      if (d < 26 && d < far && y > b.y - 8 && y < a.y + 30) {
        best = id;
        far = d;
      }
    }
    return best;
  }
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let tap = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      const p = hostXY(e);
      tap = { x: p.x, y: p.y, id: e.pointerId, at: performance.now() };
      if (!onCandle(p.x, p.y, e.pointerType === 'touch')) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      tweener.cancel('pose');
      s.drag = { id: e.pointerId, x: p.x, from: s.x, moved: 0 };
      action.hide('drag');
      audio.unlock();
      emit('dragstart', { part: 'candle' });
      e.preventDefault();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    const dx = p.x - g.x;
    g.moved = Math.max(g.moved, Math.abs(dx));
    const a = { ...toScreen(g.from, 8) };
    const b = toScreen(g.from + 1, 8);
    const next = snapCandle(g.from + dx / Math.max(0.5, b.x - a.x));
    if (next !== s.x) {
      s.x = next;
      if (pickedTrace || s.first === 2) {
        pickedTrace = false;
        s.trace = '';
      }
      draw();
      emitChange();
    }
  });
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked && s.inside === 0;
    action.show('drag');
    emit('dragend', { part: 'candle' });
    if (s.step === 'first' && s.first === 2 && Math.abs(s.x - g.from) >= 1) s.first = 3;
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
      if (Math.hypot(c.x - p.x, c.y - p.y) <= 30) return act();
    }
    if (s.inside > 0) return;
    const id = imageUnder(p.x, p.y);
    if (id) {
      audio.tick();
      pickedTrace = !(s.trace === id && pickedTrace);
      s.trace = pickedTrace ? id : '';
      draw();
      emitChange();
    }
  });
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  function applyQuiz(q) {
    const v = dia.view;
    v.dims.push(...(q.dims ?? []));
    for (const m of q.spots ?? []) v.spots.push(m);
  }
  function quizScene(q, x) {
    stopMotion();
    s.x = x;
    s.quiz = q;
    s.trace = '';
    clearLabels();
    applyWorld();
    shownFrame = frameId();
    stage.invalidate();
  }
  const notesOf = (pairs) => new Map(pairs.map(([v, html]) => [String(v), html]));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const letters = t('letters').split(',');
  const cm = (a) => t('c_cm', { a: num(a) });
  let order = [];
  let qCurrent = null;
  const isCm = (name, a) => `${t(name)} = ${t('l_cm', { a: N(num(a)) })}`;
  const dim = (id, x0, x1, y, text, spots) => ({ id, x0, x1, y, text, spots, drop0: TIP, drop1: TOP });
  function prepare(i) {
    const kind = order[i];
    if (kind === 'pair') {
      const x = pick([-5, 3, 5, 7]);
      const d = distances(x);
      quizScene({ kind, show: ['r1'], rows: 1, dims: [dim('qd', x, M.m1, rowAt(0), t('l_cm', { a: N(num(d.d1)) }))] }, x);
      const answer = 2 * d.d1;
      const wrong = [d.d1, M.gap, 2 * d.d2];
      return {
        text: t('q_pair'),
        answer,
        wrong,
        label: cm,
        notes: notesOf([
          [wrong[0], t('n_pair_same')],
          [wrong[1], t('n_pair_gap')],
          [wrong[2], t('n_pair_other')],
        ]),
        reveal: t('a_pair', { d: num(d.d1), g: num(answer) }),
      };
    }
    if (kind === 'times') {
      const side = pick(['r', 'l']);
      const k = pick([2, 3]);
      const x = pick([-4, 4, 6]);
      const im = imageAt(x, side, k);
      const show = ['r1', 'r2', 'r3', 'l1', 'l2', 'l3'];
      quizScene({ kind, show, rows: 0, tags: [{ id: 'qt', text: t('l_q'), x: im, y: 0, z: 4 }] }, x);
      const others = [1, 2, 3, 4].filter((n) => n !== k);
      return {
        text: t('q_times'),
        answer: k,
        wrong: others,
        label: (n) => t('c_times', { a: n }),
        notes: notesOf(others.map((n) => [n, t(n < k ? 'n_times_less' : 'n_times_more')])),
        reveal: t('a_times', { k }),
      };
    }
    if (kind === 'spot') {
      const x = pick([-6, -4, 4, 6]);
      const d = distances(x);
      const places = shuffle([
        { v: 'd3', at: d.d3 },
        { v: 'd2', at: d.d2 },
        { v: 'gap', at: M.gap },
        { v: 'more', at: d.d3 + M.gap },
      ]);
      const l1 = imageAt(x, 'l', 1);
      const byPlace = [...places].sort((a, b) => a.at - b.at);
      const tags = places.map((p, j) => ({
        id: `qs${j}`,
        text: `<b>${letters[j]}</b>`,
        x: M.m1 + p.at,
        y: 0,
        z: 6,
        spots: byPlace.indexOf(p) % 2 ? [{ dx: 0, dy: 49 }] : [{ dx: 0, dy: 22 }],
      }));
      quizScene(
        {
          kind,
          show: ['l1'],
          rows: 2,
          spots: places.map((p) => [M.m1 + p.at, 6]),
          range: [-40, M.m1 + d.d3 + M.gap + 10],
          tags,
          dims: [dim('qd', l1, M.m1, rowAt(1), isCm('l_d3', d.d3))],
        },
        x,
      );
      const answer = places.findIndex((p) => p.v === 'd3');
      const wrong = [0, 1, 2, 3].filter((j) => j !== answer);
      return {
        text: t('q_spot'),
        answer,
        wrong,
        label: (j) => t('c_spot', { x: letters[j] }),
        notes: notesOf(wrong.map((j) => [j, t(`n_spot_${places[j].v}`)])),
        reveal: t('a_spot', { x: letters[answer], a: num(d.d3) }),
      };
    }
    if (kind === 'sum') {
      const x = pick([-3, 3, 5, 7]);
      const d = distances(x);
      quizScene(
        {
          kind,
          show: ['l1', 'l2', 'r1', 'r2'],
          rows: 2,
          range: [-70, 112],
          dims: [
            dim('qd1', x, M.m1, rowAt(0), isCm('l_d1', d.d1), FAR_R),
            dim('qd2', x, M.m2, rowAt(0), isCm('l_d2', d.d2), FAR_L),
            dim('qd4', imageAt(x, 'l', 2), M.m1, rowAt(1), `${t('l_d4')} = ?`),
          ],
        },
        x,
      );
      const answer = d.d4;
      const wrong = [d.d3, M.gap + d.d1, 2 * M.gap];
      return {
        text: t('q_sum', { g: M.gap }),
        answer,
        wrong,
        label: cm,
        notes: notesOf([
          [wrong[0], t('n_sum_d3')],
          [wrong[1], t('n_sum_one')],
          [wrong[2], t('n_sum_two')],
        ]),
        reveal: t('a_sum', { a: num(answer), g: M.gap, b: num(d.d1), c: num(M.gap + d.d1) }),
      };
    }
    // the candle moves on the picture after the answer; nothing moves before it
    const a = pick([3, 4, 5]);
    const x = pick([-3, -1, 1]);
    const d = distances(x);
    quizScene(
      {
        kind,
        show: ['l1', 'r1'],
        rows: 1,
        dims: [dim('qd1', x, M.m1, rowAt(0), isCm('l_d1', d.d1), FAR_R), dim('qd2', x, M.m2, rowAt(0), isCm('l_d2', d.d2), FAR_L)],
        to: x + a,
      },
      x,
    );
    const answer = 'away';
    const wrong = ['toward', 'double', 'stay'];
    return {
      text: t('q_move', { a }),
      answer,
      wrong,
      label: (c) => (c === 'stay' ? t('c_stay') : c === 'double' ? t('c_away', { a: 2 * a }) : t(`c_${c}`, { a })),
      notes: notesOf([
        ['toward', t('n_move_toward')],
        ['double', t('n_move_double', { a })],
        ['stay', t('n_move_stay')],
      ]),
      reveal: t('a_move', { a, b: num(d.d2 + a) }),
    };
  }
  const saved = { x: CANDLE.start, inside: 0, trace: '' };
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
        Object.assign(saved, { x: s.x, inside: s.inside, trace: s.trace });
        s.inside = 0;
        pickedTrace = false;
        order = ['pair', 'times', 'spot', 'sum', 'move'];
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
        s.x = saved.x;
        s.inside = saved.inside;
        s.trace = saved.trace;
        clearLabels();
        syncUI();
        shownFrame = frameId();
        flyCamera(0.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = prepare(i);
        qCurrent = q;
        say(' ');
        ui.$('.pvc-q-text').innerHTML = q.text;
        const done = await flyCamera(0.5);
        if (!alive()) return null;
        if (!done) camK = 1;
        const out = [q.answer];
        for (const w of q.wrong) if (out.length < 4 && !out.includes(w)) out.push(w);
        return { choices: shuffle(out), expected: q.answer, tolerance: 1e-6, label: q.label, meta: { kind: order[i] } };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        const why = !correct && picked ? q.notes.get(String(picked.value)) : '';
        // the answer stands in the picture
        if (s.quiz?.kind === 'spot') {
          s.quiz.show = ['l1', 'r2'];
          draw();
        }
        if (s.quiz?.to != null) {
          const to = s.quiz.to;
          const keep = s.quiz;
          moveTo(to, 1.1).then(() => {
            if (s.quiz === keep) draw();
          });
        }
        return `${q.reveal}${why ? ` <span class="pm2-why">${t('n_pick', { x: q.label(picked.value) })} ${why}</span>` : ''}`;
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
    s.x = CANDLE.start;
    s.trace = '';
    pickedTrace = false;
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
    if (b.dataset.example) {
      pickedTrace = false;
      go(b.dataset.example);
    }
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
    const walk = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (walk) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (!canDrag()) return;
      const from = s.x;
      s.x = snapCandle(s.x + walk * CANDLE.step);
      if (s.x !== from) {
        if (pickedTrace || s.first === 2) {
          pickedTrace = false;
          s.trace = '';
        }
        if (s.step === 'first' && s.first === 2) s.first = 3;
        draw();
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
  function traced(id) {
    const r = path(s.x, id[0], Number(id[1]));
    const six = (a) => +a.toFixed(6);
    return {
      id,
      miss: six(r.miss),
      backMiss: six(r.backMiss),
      onGlass: r.onGlass,
      clearsNear: r.clearsNear,
      angles: r.hits.map((h) => ({ thetaI: six(h.thetaI), thetaR: six(h.thetaR) })),
      chain: chainOf(id[0], Number(id[1])),
    };
  }
  function snapshot() {
    const d = distances(s.x);
    return {
      step: s.step,
      phase: phase(),
      x: +s.x.toFixed(4),
      d1: +d.d1.toFixed(4),
      d2: +d.d2.toFixed(4),
      d3: +d.d3.toFixed(4),
      d4: +d.d4.toFixed(4),
      first: s.first,
      second: s.second,
      many: s.many,
      inside: s.inside >= 1,
      images: builtIds().map((id) => ({ id, x: +imageAt(s.x, id[0], Number(id[1])).toFixed(4) })),
      trace: s.trace ? traced(s.trace) : null,
      frame: shownFrame,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.step, snap.phase, snap.x, snap.trace?.id ?? '']);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  syncUI();
  setView(s.view, { animate: false });
  setting.tickFlames(0.4);
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
      if (p.step && STEPS.includes(p.step) && p.step !== s.step) go(p.step, { animate: false });
      if (p.stage != null) {
        stopMotion();
        buildTo(s.step, p.stage);
        s.trace = '';
        pickedTrace = false;
      }
      if (p.trace !== undefined) {
        stopMotion();
        s.trace = p.trace && SIDES[p.trace[0]] && Number(p.trace[1]) <= COUNT ? p.trace : '';
        pickedTrace = Boolean(s.trace);
      }
      if (p.x != null) {
        stopMotion();
        const x = snapCandle(Number(p.x));
        if (animate) await moveTo(x, 0.8);
        else s.x = x;
      }
      if (!animate) camK = 1;
      draw({ instant: !animate });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      stopMotion();
      s.step = 'first';
      s.x = CANDLE.start;
      s.trace = '';
      pickedTrace = false;
      buildTo('first', 0);
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
