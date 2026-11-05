// Image in a plane mirror (সমতল আয়নায় প্রতিবিম্ব), book p219–221, topic 8.3.1: the student view. A boy of 1.5 m stands before a
// mirror on a plain floor under a sky-to-blush backdrop; his faded image stands as far behind it. Three steps in the book's
// order: (1) drag him, XP = X′P, and measure the two: equal distance, upright, equal length; (2) the ray from his head and
// the ray from his feet reach his eye with θi = θr, and extended back they meet the image: virtual; (3) চিত্র ৮.১২: drag the
// mirror's edges, watching what he really sees, until head and feet both show: half his height, at 1 m or at 10 m.
// The panel is the kit's clean sheet (one action, one result, one rule). A 5-question test.
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
import { BOY, DIST, EDGE, FULL, imageOf, needed, neededCm, points, rays, round, SHORT, sees, shuffle, snapDistance, snapEdge } from './reading.js';
import { createSetting, VIEW } from './setting.js';

export const DEFAULTS = {
  step: 'distance', // 'distance' | 'rays' | 'length'
  d: DIST.start, // XP, m
  stage: 0, // how far step 1 is built, 0 … 4
  ray: 0, // how far step 2 is built: 0 none, 1 the head's ray, 2 the feet's, 3 normals and angles, 4 extended
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  sound: true,
  shadow: true,
};

const STEPS = ['distance', 'rays', 'length'];
const INK = C.ink;
const AMBER_TEXT = '#9a5300';
const SLATE = '#33506b';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const f2 = (x) => x.toFixed(2);
const short = (x) => String(round(x)); // numbers in sentences have no trailing zeros
const IMAGE_COLOUR = '#7a5a4a';

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'pm');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: the sheet of one action, one result, one rule ────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // the book's four properties, found one by one
  const props = document.createElement('ul');
  props.className = 'pm-props';
  props.setAttribute('aria-label', t('props'));
  props.innerHTML = ['a', 'b', 'c', 'd'].map((k) => `<li data-p="${k}">${t(`prop_${k}`)}</li>`).join('');
  ui.$('.pvc-rule').after(props);
  const note = document.createElement('div');
  note.className = 'pm-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);
  const cap = document.createElement('div');
  cap.className = 'pm-cap';
  cap.textContent = t('cap_view');
  cap.hidden = true;
  ui.stage.appendChild(cap);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 20, near: 0.5, far: 400, environment: 'studio-light', environmentIntensity: 0.32 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(55);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-55);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(25);
  const setting = createSetting({ stage, shadow: Boolean(o.shadow) });
  const dia = createDiagram({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    step: STEPS.includes(o.step) ? o.step : 'distance',
    d: snapDistance(Number(o.d) || DIST.start),
    H: BOY.H,
    stage: 0, // step 1, one thing at a time: 0 boy and mirror, 1 the image, 2 the distances, 3 he has moved, 4 measured
    ray: clamp(Math.round(Number(o.ray) || 0), 0, 4), // step 2: 0 none, 1 the head's ray, 2 the feet's, 3 the normals and angles, 4 extended
    grow: 1, // how far the newest thing has grown in
    imageK: 0,
    barK: 0,
    flash: 0, // the highlight on the newest thing, 1 … 0
    lit: '',
    top: FULL.top,
    bottom: FULL.bottom,
    edge: 'bottom', // what the up and down keys move
    far: false,
    busy: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    drag: null,
  };
  function allFound() {
    s.stage = 4;
    s.imageK = 1;
    s.barK = 1;
  }
  if (s.step !== 'distance') allFound();
  if (s.step === 'length') {
    s.top = SHORT.top;
    s.bottom = SHORT.bottom;
    s.ray = 4;
  }
  if (s.step === 'distance') {
    s.stage = clamp(Math.round(Number(o.stage) || 0), 0, 4);
    s.ray = 0;
    s.imageK = s.stage >= 1 ? 1 : 0;
    s.barK = s.stage >= 2 ? 1 : 0;
  }
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  const inLength = () => !s.quiz && s.step === 'length';
  const showsCard = () => inLength() || s.quiz?.kind === 'fix';
  const allSeen = () => {
    const see = sees(s.d, s.top, s.bottom);
    return see.head && see.feet;
  };

  /** What the panel's action does now. */
  function phase() {
    if (s.busy || s.grow < 1) return 'busy';
    if (s.step === 'distance') return `d${s.stage}`;
    if (s.step === 'rays') return `r${s.ray}`;
    if (s.far) return 'l4';
    const see = sees(s.d, s.top, s.bottom);
    if (see.head && see.feet) return 'l3';
    return see.feet ? 'l2' : 'l1';
  }

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  let trace = rays(s.d, s.top, s.bottom);
  /** The small picture, canvas px: beside the scene on a wide view, over it on a tall one. */
  const card = { x: 0, y: 0, w: 0, h: 0, wide: true };
  function placeCard() {
    const W = stage.width;
    const H = stage.height;
    card.wide = W / H >= 1.2;
    const ratio = (2 * VIEW.z) / (VIEW.y1 - VIEW.y0);
    if (card.wide) {
      card.h = Math.round(clamp(H - 124, 96, 300));
      card.w = Math.round(card.h * ratio);
      // beside the panel its tab stands on the view's right edge
      const beside = root.clientWidth >= root.clientHeight && root.clientWidth >= 600;
      card.x = W - card.w - (beside ? 36 : 12);
      card.y = Math.round(Math.max(76, (H - card.h) / 2 + 16));
    } else {
      card.h = Math.round(clamp(H * 0.3, 96, 200));
      card.w = Math.round(card.h * ratio);
      card.x = 11;
      card.y = 28;
    }
    cap.style.left = `${card.x - 3}px`;
    cap.style.top = `${card.y - 20}px`;
    cap.style.width = `${card.w + 6}px`;
  }
  const BAR = { z: 0.38, half: 0.05 };
  function applyWorld() {
    setting.setBoy(s.d, s.H);
    setting.setMirror(s.top, s.bottom);
    setting.setImage(s.imageK);
    trace = rays(s.d, s.top, s.bottom, s.H);
    const see = sees(s.d, s.top, s.bottom, s.H);
    setting.setCuts(trace.eye, s.top, s.bottom, see.head, see.feet);
    dia.clear();
    const v = dia.view;
    v.flash = s.flash;
    v.lit = s.lit;
    const nearby = s.d <= 2;
    v.normalLen = clamp((s.d - BOY.g) * 0.74, 0.3, 0.7);
    if (s.quiz) return applyQuiz(s.quiz);
    const x = trace.x;
    const y = trace.y;
    const dots = (...list) => {
      for (const p of list) v.points.push([p.x, p.y, 3.6, C.ray]);
    };
    if (s.step === 'distance') {
      dots(x);
      if (s.imageK >= 1) dots(imageOf(x));
      if (s.barK > 0) v.bars = { d: -x.x, k: s.barK, ...BAR };
      if (s.stage === 4) {
        const k = s.lit === 'heights' ? s.grow : 1;
        v.marks.push({ x: x.x - 0.27, y0: 0, y1: s.H * k, z: 0, color: INK }, { x: -x.x + 0.27, y0: 0, y1: s.H * k, z: 0, color: INK });
        dots(y, imageOf(y));
      }
      if (s.stage === 2 && s.grow >= 1 && !s.busy) v.drag.boy = { x: x.x + 0.02 };
      if (s.stage > 2 && !s.busy) v.drag.boy = { x: x.x + 0.02 };
      return;
    }
    v.rays = trace;
    const k = s.grow;
    const full = s.step === 'length' && see.head && see.feet;
    if (s.step === 'rays') {
      v.head = s.ray === 1 ? k : s.ray > 1 ? 1 : 0;
      v.feet = s.ray === 2 ? k : s.ray > 2 ? 1 : 0;
      v.normals = s.ray === 3 ? k : s.ray > 3 ? 1 : 0;
      v.ext = s.ray === 4 ? k : 0;
    } else {
      v.head = v.feet = 1;
      v.normals = full && nearby ? 1 : 0;
      v.ext = full && nearby ? 1 : 0;
    }
    const arcs = (q, r, sweep) => {
      const tiSign = q.src.y > q.m ? 1 : -1;
      v.arcs.push(
        { m: q.m, r, a0: 0, a1: tiSign * q.thetaI * sweep, color: C.ti },
        { m: q.m, r, a0: 0, a1: -tiSign * q.thetaR * sweep, color: C.tr },
      );
    };
    if (v.normals > 0 && nearby) {
      const sweep = s.step === 'rays' && s.ray === 3 ? k : 1;
      if (s.step === 'rays') arcs(trace.head, v.normalLen * 0.9, sweep);
      arcs(trace.feet, clamp(v.normalLen * 0.6, 0.2, 0.36), sweep);
    }
    dots(...(v.head > 0 ? [trace.head.src] : []), ...(v.feet > 0 ? [trace.feet.src] : []));
    if (v.ext >= 1) dots(trace.head.image, trace.feet.image);
    if (nearby) v.points.push([trace.eye.x, trace.eye.y, 2.6, '#ffffff']);
    if (s.step === 'rays' && s.ray >= 4 && !s.busy && s.grow >= 1) v.drag.boy = { x: x.x + 0.02 };
    if (s.step === 'length') {
      v.card = { rect: card, top: s.top, bottom: s.bottom };
      if (!s.busy && !s.far) {
        v.drag.top = { y: s.top };
        v.drag.bottom = { y: s.bottom };
      }
      if (s.d > 1.6) v.bars = { d: s.d, k: 0.5, ...BAR };
      if (full) {
        v.marks.push({ x: x.x - 0.27, y0: 0, y1: s.H, z: 0, color: INK }, { x: 0, y0: s.bottom, y1: s.top, z: 0.36, color: C.bar });
      }
    }
  }

  // ── camera: each step frames what it is about, and flies there smoothly ────────────────────────────────
  const FRAMES = {
    whole: { az: -27, el: 15, bars: true },
    pair: { az: -20, el: 11 },
    all: { az: -23, el: 12 },
    edges: { az: -22, el: 10 },
    half: { az: -24, el: 12 },
    far: { az: -13, el: 7, bars: true },
  };
  /** The frame the state wants. */
  function frameKey() {
    const q = s.quiz?.kind;
    if (q) return { gap: 'whole', real: 'all', fix: 'edges', edge: 'pair', length: 'pair' }[q];
    if (s.step === 'distance') return 'whole';
    if (s.step === 'rays') return s.ray >= 4 ? 'all' : 'pair';
    if (s.d > 1.6) return 'far';
    return allSeen() ? 'half' : 'edges';
  }
  let camFrom = null;
  let camK = 1;
  let shownFrame = '';
  const FRAME = new THREE.Box3();
  const margin = { top: 36, bottom: 28, left: 8, right: 8 };
  const camDir = new THREE.Vector3();
  function poseNow() {
    const key = frameKey();
    const f = FRAMES[key];
    const a = THREE.MathUtils.degToRad(f.az);
    const e = THREE.MathUtils.degToRad(f.el);
    camDir.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
    const reach = key === 'half' ? Math.max(1, s.d) : Math.max(DIST.max, s.d);
    const tight = key === 'pair' || key === 'edges' || key === 'far';
    const left = tight ? s.d : reach;
    const right = tight ? 0 : reach;
    const pad = key === 'whole' ? 0.46 : key === 'half' ? 0.5 : 0.34;
    FRAME.min.set(-left - pad, -0.02, -0.2);
    FRAME.max.set(right + (key === 'half' ? 0.34 : pad), Math.max(1.62, s.H + 0.12), f.bars ? 0.5 : 0.3);
    margin.top = 36;
    margin.right = 8;
    margin.left = key === 'half' || s.quiz?.kind === 'length' ? 56 : 8; // the height's label stands beside his measure
    margin.bottom = f.bars ? 40 : key === 'pair' || key === 'edges' ? 28 : 36;
    if (showsCard()) {
      if (card.wide) margin.right = stage.width - card.x + 12;
      else margin.top = card.y + card.h + 10;
    }
    return fitPose({ box: FRAME, dir: camDir, camera, width: stage.width, height: stage.height, margin });
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
  function followFrame(instant) {
    const key = frameKey();
    if (key === shownFrame) return;
    const first = !shownFrame;
    shownFrame = key;
    if (first || instant) {
      tweener.cancel('camera');
      camK = 1;
    } else flyCamera(0.9);
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
    placeCard();
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    labels();
  });
  stage.onAfterRender(() => {
    if (showsCard()) setting.renderEyeView(card, trace.eye, s.top, s.bottom);
  });

  // ── moving on ─────────────────────────────────────────────────────────────────────────────────────────
  /** Eases the distance and the mirror's edges to new values. */
  function moveTo({ d = s.d, top = s.top, bottom = s.bottom }, duration = 0.9) {
    const a = { d: s.d, top: s.top, bottom: s.bottom };
    return tweener.animate({
      key: 'pose',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.d = a.d + (d - a.d) * k;
        s.top = a.top + (top - a.top) * k;
        s.bottom = a.bottom + (bottom - a.bottom) * k;
        draw();
      },
      onComplete: () => {
        s.d = d;
        s.top = top;
        s.bottom = bottom;
      },
    }).finished;
  }
  function stopMotion() {
    ++token;
    for (const k of ['pose', 'reveal', 'flash']) tweener.cancel(k);
    s.busy = false;
    s.grow = 1;
    s.flash = 0;
    s.lit = '';
  }
  function go(step, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (!STEPS.includes(step)) return;
    const was = s.step;
    stopMotion();
    s.step = step;
    s.far = false;
    clearLabels();
    if (step !== 'distance') allFound();
    const edges = step === 'length' ? SHORT : FULL;
    const d = step === 'length' ? DIST.start : snapDistance(s.d);
    if (step === 'length') s.ray = 4;
    if (step === 'rays' && was !== 'rays') s.ray = 0;
    if (animate) {
      const my = ++token;
      s.busy = true;
      moveTo({ d, top: edges.top, bottom: edges.bottom }, 0.8).then((ok) => {
        if (my !== token) return;
        s.busy = false;
        if (ok) Object.assign(s, { d, top: edges.top, bottom: edges.bottom });
        draw();
        emitChange();
      });
    } else Object.assign(s, { d, top: edges.top, bottom: edges.bottom });
    draw({ instant: !animate });
    emitChange();
  }
  /** Runs an eased move as the action's demonstration, then what follows it. */
  function demo(target, duration, then) {
    const my = ++token;
    s.busy = true;
    draw();
    moveTo(target, duration).then((ok) => {
      if (my !== token) return;
      s.busy = false;
      if (ok) then?.();
      draw();
      emitChange();
    });
  }
  /** The highlight fades. */
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
        s.lit = '';
        draw();
      },
    });
  }
  /** The next thing grows in, highlighted; `set` is told how far. */
  function reveal(lit, set = () => {}) {
    const my = ++token;
    tweener.cancel('flash');
    s.lit = lit;
    s.flash = 1;
    s.grow = 0;
    set(0);
    audio.tick();
    draw();
    tweener
      .animate({
        key: 'reveal',
        duration: 1.1,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== token) return;
          s.grow = Math.min(0.999, k);
          set(s.grow);
          draw();
        },
      })
      .finished.then((ok) => {
        if (!ok || my !== token) return;
        s.grow = 1;
        set(1);
        audio.success();
        draw();
        emitChange();
        fadeLit();
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
    if (ph === 'd0') {
      s.stage = 1;
      return reveal('image', (k) => {
        s.imageK = k;
      });
    }
    if (ph === 'd1') {
      s.stage = 2;
      return reveal('bars', (k) => {
        s.barK = k;
      });
    }
    if (ph === 'd2') {
      return demo({ d: s.d >= 1.1 ? 0.7 : DIST.max }, 1.3, () => {
        s.stage = 3;
        audio.success();
      });
    }
    if (ph === 'd3') {
      s.stage = 4;
      return reveal('heights');
    }
    if (ph === 'd4') return go('rays');
    if (ph === 'r0' || ph === 'r1' || ph === 'r2' || ph === 'r3') {
      s.ray = Number(ph[1]) + 1;
      return reveal(['head', 'feet', 'normal', 'ext'][s.ray - 1]);
    }
    if (ph === 'r4') return go('length');
    const n = neededCm(s.d);
    if (ph === 'l1') {
      s.edge = 'top';
      return demo({ bottom: n.bottom }, 1, () => audio.success());
    }
    if (ph === 'l2') return demo({ top: n.top }, 1, () => audio.success());
    if (ph === 'l3') {
      return demo({ d: DIST.far, top: n.top, bottom: n.bottom }, 1.8, () => {
        s.far = true;
        audio.success();
      });
    }
    if (ph === 'l4') {
      s.far = false;
      return demo({ d: DIST.start }, 1.4, () => audio.tick());
    }
  }

  // ── labels on the picture: pinned to what they name, each with a thin line ─────────────────────────────
  let action = null;
  const cardBox = () => (showsCard() ? { left: card.x - 8, top: card.y - 26, right: card.x + card.w + 8, bottom: card.y + card.h + 8 } : null);
  const handleBoxes = () => {
    const out = [];
    for (const k of ['boy', 'top', 'bottom']) {
      const p = dia.spot[k];
      if (p) out.push({ left: p.x - 18, top: p.y - 18, right: p.x + 18, bottom: p.y + 18 });
    }
    return out;
  };
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, note, cardBox, handleBoxes, () => action?.ringBox()] });
  const shown = new Map();
  const pts = new Map();
  function label(id, on, text, point, color, spots, avoid = []) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).copy(point);
    if (!shown.has(id)) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', avoid });
      shown.set(id, text);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
    }
  }
  function clearLabels() {
    for (const id of [...shown.keys()]) anno.remove(id);
    shown.clear();
  }
  const ptr = new THREE.Vector3();
  const onScreen = { x: 0, y: 0 };
  /** Canvas pixels of a point in the plane of the rays. The object is reused: copy what you keep. */
  function toScreen(x, y, z = 0) {
    ptr.set(x, y, z).project(camera);
    onScreen.x = ((ptr.x + 1) / 2) * stage.width;
    onScreen.y = ((1 - ptr.y) / 2) * stage.height;
    return onScreen;
  }
  /** Small boxes along the lines drawn, in canvas pixels: labels keep off them. */
  function lineBoxes() {
    const out = [];
    const along = (ax, ay, bx, by) => {
      for (let i = 0; i <= 10; i++) {
        const k = i / 10;
        const a = toScreen(ax + (bx - ax) * k, ay + (by - ay) * k);
        out.push({ left: a.x - 4, top: a.y - 4, right: a.x + 4, bottom: a.y + 4 });
      }
    };
    const v = dia.view;
    if (!v.rays) return out;
    const r = v.rays;
    for (const [q, on] of [
      [r.head, v.head > 0],
      [r.feet, v.feet > 0],
    ]) {
      if (!on) continue;
      along(q.src.x, q.src.y, 0, q.m);
      along(0, q.m, r.eye.x, r.eye.y);
      if (v.ext > 0) along(0, q.m, q.image.x, q.image.y);
    }
    return out;
  }
  const lineAvoid = [lineBoxes];
  // the angles sit by the geometry: the mirror's name steps round them
  const mirrorAvoid = [lineBoxes, () => ['ti', 'tr', 'ti0', 'tr0'].map((id) => (shown.has(id) ? anno.box(id) : null))];
  const v3 = new THREE.Vector3();
  const tiAt = new THREE.Vector3();
  const trAt = new THREE.Vector3();
  const at = (x, y, z = 0) => v3.set(x, y, z);
  const LEFT = [
    { dx: -20, dy: -14 },
    { dx: -30, dy: 6 },
    { dx: -16, dy: -26 },
  ];
  const RIGHT = [
    { dx: 20, dy: -14 },
    { dx: 30, dy: 6 },
    { dx: 16, dy: -26 },
  ];
  const ABOVE = [
    { dx: 0, dy: -16 },
    { dx: 0, dy: -30 },
  ];
  const UNDER_L = [
    { dx: -18, dy: 16 },
    { dx: -30, dy: 4 },
  ];
  const UNDER_R = [
    { dx: 18, dy: 16 },
    { dx: 30, dy: 4 },
  ];
  const MIRROR_SPOTS = [
    { dx: 30, dy: 20 },
    { dx: -30, dy: 20 },
    { dx: 30, dy: 40 },
    { dx: -30, dy: 40 },
  ];
  const IMAGE_SPOTS = [
    { dx: -36, dy: -4 },
    { dx: 36, dy: -4 },
    { dx: -36, dy: 24 },
    { dx: -36, dy: -30 },
  ];
  const MID_SPOTS = [
    { dx: 40, dy: 0 },
    { dx: -40, dy: 0 },
  ];
  const IMAGE_FEET = [
    { dx: -12, dy: 26 },
    { dx: -30, dy: 26 },
    { dx: -50, dy: 8 },
    { dx: 0, dy: 40 },
  ];
  const EYE_SPOTS = [
    { dx: -44, dy: 10 },
    { dx: -44, dy: 28 },
    { dx: -44, dy: -10 },
  ];
  const BAR_SPOTS = [
    { dx: -10, dy: 20 },
    { dx: -10, dy: 36 },
  ];
  const BAR_SPOTS_R = [
    { dx: 30, dy: 16 },
    { dx: 44, dy: 26 },
    { dx: 36, dy: -18 },
  ];
  const ON_LINE = [
    { dx: -26, dy: 22 },
    { dx: 26, dy: 24 },
    { dx: -40, dy: 4 },
  ];
  const OVER_LINE = [
    { dx: -26, dy: -22 },
    { dx: 26, dy: -24 },
    { dx: -40, dy: -4 },
  ];
  const TI_SPOTS = [
    { dx: -24, dy: 24 },
    { dx: -40, dy: 14 },
    { dx: 6, dy: 34 },
  ];
  const TR_SPOTS = [
    { dx: -24, dy: -24 },
    { dx: -40, dy: -14 },
    { dx: 6, dy: -34 },
  ];
  const TI_NEAR = [
    { dx: -18, dy: 14 },
    { dx: -26, dy: 6 },
    { dx: -18, dy: 26 },
  ];
  const TR_NEAR = [
    { dx: -18, dy: -14 },
    { dx: -26, dy: -6 },
    { dx: -18, dy: -26 },
  ];
  const REF_SPOTS = [
    { dx: 28, dy: -22 },
    { dx: -26, dy: -22 },
    { dx: 44, dy: -6 },
    { dx: 40, dy: 12 },
  ];
  const lit = (id, text) => (s.lit === id && s.flash > 0 ? `<span class="pm-new">${text}</span>` : text);
  function labels() {
    const q = s.quiz;
    const qk = q?.kind;
    const settled = camK >= 1;
    const dist = s.step === 'distance' && !q;
    const r = s.step === 'rays' && !q;
    const l = s.step === 'length' && !q;
    const x = trace.x;
    const y = trace.y;
    const nearby = s.d <= 2.2;
    const v = dia.view;
    const full = l && allSeen();
    const imageOn = s.imageK >= 1;
    const wide = r && s.ray >= 4 && s.grow >= 1;
    // the book's letters
    label(
      'x',
      settled && nearby && (dist || ((r || l) && v.head > 0 && trace.head.full) || qk === 'gap' || qk === 'real'),
      t('l_x'),
      at(x.x, x.y),
      AMBER_TEXT,
      LEFT,
    );
    label('xp', settled && nearby && ((dist && imageOn) || wide || full || qk === 'gap'), t('l_xp'), at(-x.x, x.y), AMBER_TEXT, RIGHT);
    label(
      'y',
      settled && nearby && ((dist && s.stage === 4) || ((r || l) && v.feet > 0 && trace.feet.full)),
      t('l_y'),
      at(y.x, 0),
      AMBER_TEXT,
      UNDER_L,
    );
    label('yp', settled && nearby && ((dist && s.stage === 4) || wide || full), t('l_yp'), at(-y.x, 0), AMBER_TEXT, UNDER_R);
    label('p', settled && dist && s.barK >= 1, t('l_p'), at(0, 0, BAR.z), INK, ABOVE);
    const bar = dist && s.barK > 0;
    label('xpd', settled && (bar || qk === 'gap'), t('l_xpd', { a: f2(s.d) }), at(x.x / 2, 0, BAR.z), INK, BAR_SPOTS);
    label('xppd', settled && bar && s.barK >= 1, t('l_xppd', { a: f2(s.d) }), at(-x.x / 2, 0, BAR.z), INK, BAR_SPOTS_R);
    const hText = t('l_dist', { a: short(s.H) });
    const measured = (dist && s.stage === 4 && s.grow >= 1) || qk === 'length' || (full && nearby);
    label('h0', settled && measured, hText, at(x.x - 0.27, s.H * 0.5), INK, [
      { dx: -26, dy: 0 },
      { dx: 26, dy: 0 },
    ]);
    label('h1', settled && dist && measured, hText, at(-x.x + 0.27, s.H * 0.5), INK, [
      { dx: 26, dy: 0 },
      { dx: 26, dy: 30 },
      { dx: 26, dy: -30 },
    ]);
    label(
      'half',
      settled && full,
      t('l_half', { a: f2(s.top - s.bottom) }),
      at(0, (s.top + s.bottom) / 2, 0.36),
      C.bar,
      [
        { dx: 34, dy: 0 },
        { dx: -34, dy: 30 },
      ],
      lineAvoid,
    );
    label('eye', settled && nearby && (r || l) && v.head > 0, t('l_eye'), at(trace.eye.x, trace.eye.y), SLATE, EYE_SPOTS);
    const midGlass = l && !full;
    label(
      'mirror',
      settled && !qk && nearby,
      lit('mirror', t('l_mirror')),
      at(0, midGlass ? (s.top + s.bottom) / 2 : s.bottom + 0.02),
      SLATE,
      midGlass ? MID_SPOTS : MIRROR_SPOTS,
      mirrorAvoid,
    );
    label('fard', settled && l && s.d > 1.6, t('l_dist', { a: short(s.d) }), at(-s.d / 2, 0, BAR.z), INK, BAR_SPOTS);
    label(
      'image',
      settled && !qk && nearby && imageOn && (dist || wide || full),
      lit(s.lit === 'ext' ? 'ext' : 'image', t(dist ? 'l_image_0' : 'l_image')),
      at(-y.x, dist ? s.H * 0.72 : 0),
      IMAGE_COLOUR,
      dist ? IMAGE_SPOTS : IMAGE_FEET,
      lineAvoid,
    );
    // each term shows while the book introduces it
    const mids = (q0, k) => at(q0.src.x * (1 - k), q0.src.y + (q0.m - q0.src.y) * k);
    const ft = trace.feet;
    const hd = trace.head;
    label('ray', r && s.ray === 1 && settled, lit('head', t('l_ray')), mids(hd, 0.5), AMBER_TEXT, OVER_LINE, lineAvoid);
    label('inc', r && s.ray === 2 && settled, lit('feet', t('l_inc')), mids(ft, 0.5), AMBER_TEXT, ON_LINE, lineAvoid);
    label(
      'ref',
      r && s.ray === 2 && settled,
      lit('feet', t('l_ref')),
      at(trace.eye.x * 0.5, (ft.m + trace.eye.y) / 2),
      AMBER_TEXT,
      REF_SPOTS,
      lineAvoid,
    );
    label(
      'normal',
      r && s.ray === 3 && settled,
      lit('normal', t('l_normal')),
      at(-v.normalLen * v.normals, ft.m),
      C.normal,
      [
        { dx: -34, dy: 0 },
        { dx: -34, dy: 16 },
      ],
      lineAvoid,
    );
    // the angles, pinned at their arcs
    const R = v.arcs.length > 2 ? v.arcs[2].r : (v.arcs[0]?.r ?? 0.3);
    const mid = (m, a, rad) => {
      const u = (a * Math.PI) / 180;
      return at(-Math.cos(u) * rad, m + Math.sin(u) * rad);
    };
    const arcsOn = v.arcs.length > 0 && settled && !q && (!r || s.grow >= 1 || s.ray > 3);
    // up close they carry the numbers; from further back just θ, as in the owner's picture: the panel has the numbers
    const close = frameKey() === 'pair';
    tiAt.copy(mid(ft.m, -ft.thetaI * 0.6, R));
    trAt.copy(mid(ft.m, ft.thetaR * 0.6, R));
    label('ti', arcsOn && close, t('l_ti', { a: Math.round(ft.thetaI) }), tiAt, C.ti, TI_SPOTS, lineAvoid);
    label('tr', arcsOn && close, t('l_tr', { a: Math.round(ft.thetaR) }), trAt, C.tr, TR_SPOTS, lineAvoid);
    label('ti0', arcsOn && !close, t('l_ti0'), tiAt, C.ti, TI_NEAR, lineAvoid);
    label('tr0', arcsOn && !close, t('l_tr0'), trAt, C.tr, TR_NEAR, lineAvoid);
    label(
      'both',
      arcsOn && r,
      t('l_both', { a: Math.round(hd.thetaI) }),
      at(-v.normalLen * 0.9, hd.m),
      INK,
      [
        { dx: 10, dy: -24 },
        { dx: -10, dy: 24 },
      ],
      lineAvoid,
    );
    // the edges of the mirror, once found
    const se = sees(s.d, s.top, s.bottom);
    label('ebot', settled && l && !full && se.feet, t('l_ebot'), at(0, s.bottom, 0.25), C.bar, [
      { dx: 30, dy: 22 },
      { dx: 30, dy: 44 },
    ]);
    label('etop', settled && l && !full && se.head, t('l_etop'), at(0, s.top, 0.25), C.bar, [
      { dx: 30, dy: -22 },
      { dx: 30, dy: -44 },
    ]);

    // the test
    for (let i = 0; i < 4; i++) {
      const on = qk === 'real';
      label(`qc${i}`, on, on ? q.letters[i] : '', on ? q.tips[i] : at(0, 0), INK, on && q.lines[i] === 'out' ? UNDER_R : ABOVE.concat(UNDER_R));
    }
    label('qe', qk === 'edge', q ? t('l_eye_h', { a: short(q.eye) }) : '', at(trace.eye.x, trace.eye.y), SLATE, [
      { dx: 0, dy: -44 },
      { dx: 40, dy: -40 },
    ]);
    label(
      'qm',
      qk === 'edge',
      t('l_q'),
      at(0, ft.m),
      INK,
      [
        { dx: 44, dy: 8 },
        { dx: 44, dy: -14 },
      ],
      lineAvoid,
    );
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  function outcome() {
    const x = points(s.d, s.H).x;
    if (s.step === 'distance') {
      if (s.stage === 4) return t('out_size', { a: short(s.H) });
      if (s.stage < 2) return t(`out_d${s.stage}`);
      return t('out_dist', { a: f2(-x.x), b: f2(imageOf(x).x) });
    }
    if (s.step === 'rays') {
      if (s.ray < 3) return t(`out_r${s.ray}`);
      const q = trace.feet;
      return t('out_angles', { a: Math.round(q.thetaI), b: Math.round(q.thetaR) });
    }
    const see = sees(s.d, s.top, s.bottom);
    const word = see.head && see.feet ? 'see_all' : see.feet ? 'see_nohead' : see.head ? 'see_nofeet' : 'see_none';
    return t('out_len', { a: f2(s.top - s.bottom), s: t(word) });
  }
  function rule(ph) {
    if (s.step === 'distance') return t(`rule_d${s.stage}`);
    if (s.step === 'rays') return t(`rule_r${s.ray}`);
    if (ph === 'l4' || s.d > DIST.max) return t('rule_l3', { a: 1, b: DIST.far });
    const n = neededCm(s.d);
    const see = sees(s.d, s.top, s.bottom);
    if (see.head && see.feet) {
      if (s.top - s.bottom > n.length + 0.005) return t('rule_l2_more', { a: short(n.length) });
      return t('rule_l2', { a: f2(s.top - s.bottom) });
    }
    if (see.feet) return t('rule_l1_feet', { a: f2(s.bottom) });
    if (see.head) return t('rule_l1_head');
    return t('rule_l0');
  }
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    d0: ['act_image', 1, ICONS.hand],
    d1: ['act_bars', 2, ICONS.hand],
    d2: ['act_drag', 3, ICONS.drag],
    d3: ['act_measure', 4, ICONS.hand],
    d4: ['act_to_rays', '', ICONS.chevR],
    r0: ['act_head', 1, ICONS.hand],
    r1: ['act_feet', 2, ICONS.hand],
    r2: ['act_normal', 3, ICONS.hand],
    r3: ['act_extend', 4, ICONS.hand],
    r4: ['act_to_length', '', ICONS.chevR],
    l1: ['act_bottom', 1, ICONS.drag],
    l2: ['act_top', 2, ICONS.drag],
    l3: ['act_far', 3, ICONS.hand],
    l4: ['act_near', '', ICONS.hand],
  };
  function found() {
    return { a: s.stage >= 3, b: s.step === 'length' || (s.step === 'rays' && s.ray >= 4), c: s.stage >= 4, d: s.stage >= 4 };
  }
  function panel() {
    if (s.quiz) return;
    const ph = phase();
    sheet.outcome(outcome());
    sheet.rule(rule(ph));
    sheet.choose(s.step);
    sheet.next(ph === 'd4' ? 'rays' : ph === 'r4' ? 'length' : null);
    const f = found();
    for (const li of props.children) li.classList.toggle('on', Boolean(f[/** @type {HTMLElement} */ (li).dataset.p]));
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const vars = ph === 'l3' ? { a: DIST.far } : ph === 'l4' ? { a: 1 } : null;
    const key = `${word}|${step}|${enabled}|${vars?.a ?? ''}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: vars ? () => t(word, vars) : word, step, enabled, icon });
    }
    note.hidden = s.step === 'distance' || (s.step === 'rays' && s.ray === 0);
    cap.hidden = !showsCard();
  }
  function draw({ instant = false } = {}) {
    applyWorld();
    panel();
    if (s.quiz) cap.hidden = !showsCard();
    followFrame(instant);
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  const ringPoint = new THREE.Vector3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_drag',
    target: () => {
      if (s.locked || camK < 1) return null;
      const ph = phase();
      if (ph === 'd0') return ringPoint.set(0, 1.1, 0);
      if (ph === 'd1') return ringPoint.set(0, 0, BAR.z);
      if (ph === 'd2') return ringPoint.set(trace.x.x + 0.02, 0, 0.2);
      if (ph === 'd3') return ringPoint.set(trace.x.x, 0.8, 0);
      if (ph === 'r0') return ringPoint.set(trace.x.x, trace.x.y, 0);
      if (ph === 'r1') return ringPoint.set(trace.y.x, 0.06, 0);
      if (ph === 'r2' || ph === 'r3') return ringPoint.set(0, trace.feet.m, 0);
      if (ph === 'l1') return ringPoint.set(0, s.bottom, 0.25);
      if (ph === 'l2') return ringPoint.set(0, s.top, 0.25);
      return null;
    },
    radius: 24,
    avoid: [ui.corner, ui.hint, note, cardBox, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── dragging the boy and the mirror's edges ────────────────────────────────────────────────────────────
  function grabAt(x, y, touch) {
    if (s.locked || s.busy || s.grow < 1) return null;
    const reach = touch ? 34 : 24;
    const near = (p) => p && Math.hypot(p.x - x, p.y - y) <= reach;
    if (near(dia.spot.top)) return 'top';
    if (near(dia.spot.bottom)) return 'bottom';
    if (near(dia.spot.boy)) return 'boy';
    if (dia.view.drag.boy) {
      // on his body
      const a = { ...toScreen(trace.x.x, 0) };
      const b = toScreen(trace.x.x, s.H);
      if (Math.abs(x - a.x) < (touch ? 42 : 32) && y > b.y - 6 && y < a.y + 10) return 'boy';
    }
    return null;
  }
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      const p = hostXY(e);
      const what = grabAt(p.x, p.y, e.pointerType === 'touch');
      if (!what) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      tweener.cancel('pose');
      s.drag = { what, id: e.pointerId, x: p.x, y: p.y, d: s.d, top: s.top, bottom: s.bottom, moved: 0 };
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
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    g.moved = Math.max(g.moved, Math.hypot(dx, dy));
    if (g.what === 'boy') {
      // along the floor, on the screen
      const a = { ...toScreen(-g.d, 0.8) };
      const b = toScreen(-g.d + 0.1, 0.8);
      const tx = b.x - a.x;
      const ty = b.y - a.y;
      const next = snapDistance(g.d - ((dx * tx + dy * ty) / Math.max(0.01, tx * tx + ty * ty)) * 0.1);
      if (next !== s.d) {
        s.d = next;
        draw();
        emitChange();
      }
      return;
    }
    const a = { ...toScreen(0, 1, 0.25) };
    const b = toScreen(0, 1.1, 0.25);
    const py = (a.y - b.y) / 0.1; // pixels to the metre, up
    if (g.what === 'top') {
      const next = snapEdge('top', g.top - dy / py, s.bottom, s.d);
      if (next !== s.top) s.top = next;
    } else {
      const next = snapEdge('bottom', g.bottom - dy / py, s.top, s.d);
      if (next !== s.bottom) s.bottom = next;
    }
    s.edge = g.what;
    draw();
    emitChange();
  });
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked;
    action.show('drag');
    emit('dragend', { part: g.what });
    if (g.what === 'boy' && s.step === 'distance' && s.stage === 2 && Math.abs(s.d - g.d) >= 0.1) s.stage = 3;
    draw();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  function applyQuiz(q) {
    const v = dia.view;
    const x = trace.x;
    if (q.kind === 'gap') {
      v.bars = { d: -x.x, k: 0.5, ...BAR };
      v.points.push([x.x, x.y, 3.6, C.ray], [-x.x, x.y, 3.6, C.ray]);
    }
    if (q.kind === 'real') {
      const h = trace.head;
      const f = trace.feet;
      v.segs.push([h.src.x, h.src.y, 0, h.m], [0, h.m, trace.eye.x, trace.eye.y], [0, h.m, h.image.x, h.image.y], [f.src.x, f.src.y, 0, f.m]);
    }
    if (q.kind === 'length') v.marks.push({ x: x.x - 0.27, y0: 0, y1: s.H, z: 0, color: INK });
    if (q.kind === 'fix') v.card = { rect: card, top: s.top, bottom: s.bottom };
    if (q.kind === 'edge') {
      v.rays = trace;
      v.feet = 1;
      v.points.push([trace.y.x, 0, 3.6, C.ray], [0, trace.feet.m, 3.2, INK]);
    }
  }
  function quizScene(q, { d = DIST.start, H = BOY.H, top = FULL.top, bottom = FULL.bottom } = {}) {
    stopMotion();
    s.far = false;
    s.d = d;
    s.H = H;
    s.top = top;
    s.bottom = bottom;
    s.quiz = q;
    clearLabels();
    applyWorld();
    cap.hidden = !showsCard();
    shownFrame = frameKey();
    stage.invalidate();
  }
  const notesOf = (pairs) => new Map(pairs.map(([v, html]) => [String(v), html]));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const letters = t('letters').split(',');
  const metres = (x) => `${N(short(x))} m`;
  let order = [];
  let qCurrent = null;
  function prepare(i) {
    const kind = order[i];
    if (kind === 'gap') {
      const d = pick([0.8, 1.2, 1.3, 1.4]);
      quizScene({ kind }, { d });
      const answer = round(2 * d);
      const wrong = [d, round(d / 2), round(3 * d)];
      return {
        text: t('q_gap'),
        answer,
        wrong,
        label: metres,
        notes: notesOf([
          [wrong[0], t('n_gap_same')],
          [wrong[1], t('n_gap_half')],
          [wrong[2], t('n_gap_more')],
        ]),
        reveal: t('a_gap', { d: short(d), g: short(answer) }),
      };
    }
    if (kind === 'real') {
      // the picture draws all four alike, so the student reasons from where the mirror stands
      const lines = shuffle(['in', 'out', 'back', 'feet']);
      const ta = rays(1, FULL.top, FULL.bottom);
      const end = {
        in: [ta.head.src.x * 0.72, ta.head.m + (ta.head.src.y - ta.head.m) * 0.72],
        out: [ta.eye.x * 0.3, ta.head.m + (ta.eye.y - ta.head.m) * 0.3],
        back: [ta.head.image.x * 0.6, ta.head.m + (ta.head.image.y - ta.head.m) * 0.6],
        feet: [(ta.feet.src.x + 0) / 2, ta.feet.m / 2],
      };
      const tips = lines.map((k) => new THREE.Vector3(end[k][0], end[k][1], 0));
      quizScene({ kind, tips, lines, letters: lines.map((_, k) => `<b>${letters[k]}</b>`) });
      const answer = lines.indexOf('back');
      const wrong = [0, 1, 2, 3].filter((k) => k !== answer);
      return {
        text: t('q_real'),
        answer,
        wrong,
        label: (k) => t('c_line', { x: letters[k] }),
        notes: notesOf(wrong.map((k) => [k, t(`n_real_${lines[k]}`)])),
        reveal: t('a_real', { x: letters[answer] }),
      };
    }
    if (kind === 'length') {
      const H = pick([1.4, 1.6, 1.7]);
      quizScene({ kind }, { H, top: EDGE.high, bottom: EDGE.low });
      const answer = round(H / 2);
      const wrong = [H, round(H * 0.25), round(H * 0.75)];
      return {
        text: t('q_length'),
        answer,
        wrong,
        label: metres,
        notes: notesOf([
          [wrong[0], t('n_length_full')],
          [wrong[1], t('n_length_small')],
          [wrong[2], t('n_length_more')],
        ]),
        reveal: t('a_length', { a: short(answer), h: short(H), two: 2 }),
      };
    }
    if (kind === 'fix') {
      const feet = Math.random() < 0.5;
      const edges = feet ? { top: 1.52, bottom: 0.98 } : { top: 1.22, bottom: 0.62 };
      quizScene({ kind }, edges);
      const choices = ['lower', 'raise', 'back', 'front'];
      const answer = feet ? 'lower' : 'raise';
      const other = feet ? 'raise' : 'lower';
      return {
        text: t('q_fix'),
        answer,
        wrong: choices.filter((c) => c !== answer),
        label: (c) => t(`c_${c}`),
        notes: notesOf([
          [other, t(`n_fix_${other}`)],
          ['back', t('n_fix_move')],
          ['front', t('n_fix_move')],
        ]),
        reveal: t(feet ? 'a_fix_feet' : 'a_fix_head'),
      };
    }
    // the eye's height decides where the ray from the feet lands
    const H = pick([1.2, 1.5, 1.8]);
    const eye = round((H * BOY.eye) / BOY.H);
    quizScene({ kind, eye }, { H, top: Math.min(EDGE.high, H + 0.05), bottom: 0.3 });
    const answer = round(eye / 2);
    const wrong = [eye, round(eye / 4), round((eye * 3) / 4)];
    return {
      text: t('q_edge'),
      answer,
      wrong,
      label: metres,
      notes: notesOf([
        [wrong[0], t('n_edge_eye')],
        [wrong[1], t('n_edge_small')],
        [wrong[2], t('n_edge_big')],
      ]),
      reveal: t('a_edge', { b: short(answer), e: short(eye), two: 2 }),
    };
  }
  const saved = { d: DIST.start, top: FULL.top, bottom: FULL.bottom, far: false, imageK: 1 };
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
        Object.assign(saved, { d: s.d, top: s.top, bottom: s.bottom, far: s.far, imageK: s.imageK });
        s.imageK = 1;
        // the book's order: no scene shows the answer to a later question
        order = ['gap', 'real', 'fix', 'edge', 'length'];
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
        s.H = BOY.H;
        s.d = saved.d;
        s.top = saved.top;
        s.bottom = saved.bottom;
        s.far = saved.far;
        s.imageK = saved.imageK;
        clearLabels();
        syncUI();
        shownFrame = frameKey();
        flyCamera(0.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = prepare(i);
        qCurrent = q;
        say(q.text);
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
        return `${q.reveal}${why ? ` <span class="pm-why">${t('n_pick', { x: q.label(picked.value) })} ${why}</span>` : ''}`;
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
    s.d = DIST.start;
    s.far = false;
    if (s.step === 'distance') {
      s.stage = 0;
      s.imageK = 0;
      s.barK = 0;
    }
    if (s.step === 'rays') s.ray = 0;
    const edges = s.step === 'length' ? SHORT : FULL;
    s.top = edges.top;
    s.bottom = edges.bottom;
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
    const walk = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    const lift = { ArrowUp: 1, ArrowDown: -1 }[e.key];
    if (walk || lift) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (s.busy || s.grow < 1) return;
      if (walk && dia.view.drag.boy) {
        s.d = snapDistance(s.d - walk * DIST.step);
        if (s.step === 'distance' && s.stage === 2 && Math.abs(s.d - DIST.start) >= 0.2) s.stage = 3;
      }
      if (lift && s.step === 'length' && !s.far) {
        const see = sees(s.d, s.top, s.bottom);
        if (see.feet && !see.head) s.edge = 'top';
        if (see.head && !see.feet) s.edge = 'bottom';
        if (s.edge === 'top') s.top = snapEdge('top', s.top + lift * EDGE.step, s.bottom, s.d);
        else s.bottom = snapEdge('bottom', s.bottom + lift * EDGE.step, s.top, s.d);
      }
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
    const x = points(s.d, s.H).x;
    const n = needed(s.d, s.H);
    const see = sees(s.d, s.top, s.bottom, s.H);
    const r = rays(s.d, s.top, s.bottom, s.H);
    const six = (a) => +a.toFixed(6);
    return {
      step: s.step,
      phase: phase(),
      d: +s.d.toFixed(4),
      xp: +(-x.x).toFixed(4),
      xpImage: +imageOf(x).x.toFixed(4),
      height: s.H,
      stage: s.stage,
      moved: s.stage >= 3,
      measured: s.stage >= 4,
      ray: s.ray,
      frame: shownFrame,
      // read back from the rays themselves
      head: { thetaI: six(r.head.thetaI), thetaR: six(r.head.thetaR), miss: six(r.head.miss), y: six(r.head.back) },
      feet: { thetaI: six(r.feet.thetaI), thetaR: six(r.feet.thetaR), miss: six(r.feet.miss), y: six(r.feet.back) },
      top: +s.top.toFixed(4),
      bottom: +s.bottom.toFixed(4),
      length: +(s.top - s.bottom).toFixed(4),
      needed: +n.length.toFixed(4),
      seesHead: see.head,
      seesFeet: see.feet,
      far: s.far,
      eyeView: showsCard(),
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.step, snap.phase, snap.d, snap.ray, snap.top, snap.bottom]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  syncUI();
  placeCard();
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
      if (p.step && STEPS.includes(p.step) && p.step !== s.step) go(p.step, { animate: false });
      if (p.ray != null) {
        stopMotion();
        s.ray = clamp(Number(p.ray), 0, 4);
      }
      if (p.stage != null) {
        stopMotion();
        s.stage = clamp(Number(p.stage), 0, 4);
        s.imageK = s.stage >= 1 ? 1 : 0;
        s.barK = s.stage >= 2 ? 1 : 0;
      }
      const target = {};
      if (p.d != null) target.d = clamp(Number(p.d), DIST.min, DIST.far);
      if (p.top != null) target.top = clamp(Number(p.top), EDGE.low + EDGE.gap, EDGE.high);
      if (p.bottom != null) target.bottom = clamp(Number(p.bottom), EDGE.low, EDGE.high - EDGE.gap);
      if (Object.keys(target).length) {
        stopMotion();
        if (animate) await moveTo(target, 0.8);
        else Object.assign(s, target);
        s.far = s.d > DIST.max;
      }
      if (!animate) camK = 1;
      draw({ instant: !animate });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      stopMotion();
      Object.assign(s, {
        step: 'distance',
        d: DIST.start,
        stage: 0,
        imageK: 0,
        barK: 0,
        ray: 0,
        far: false,
        H: BOY.H,
        top: FULL.top,
        bottom: FULL.bottom,
      });
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
