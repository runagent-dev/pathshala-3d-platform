// Laws of reflection (প্রতিফলনের সূত্র), book p215, topic 8.2.1, চিত্র ৮.০৩: the student view. It opens on a calm mountain
// lake, then flies close to the point O and looks down at the water from a three-quarter view, as the book draws it. The
// laws build one part at a time, each with a moment's glow: the ray XO, the point O, the perpendicular, the upright plane,
// the reflected ray OX′, θi and θr; then the plane is swung round the normal (the first law) and X is dragged (the second
// law). The last step is 8.2.2, back on the whole lake: the mountain's image is crisp on still water and breaks up on
// waves, and one magnifier shows why, with three rays traced on a cross-section of the surface.
// The panel is the kit's clean sheet (one action, one result, one rule). A 5-question test.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { fitPose } from './camera.js';
import { ARC, C, createDiagram, L, SHEET } from './diagram.js';
import { createI18n } from './i18n.js';
import { createLake } from './lake.js';
import { angleToNormal, deg, offPlane, rad, reflected, sheetNormal, shuffle, toLight } from './reading.js';

export const DEFAULTS = {
  step: 'laws', // 'laws' | 'surface'
  law: 0, // how far the laws are built: see LAW
  theta: 50, // θi, degrees
  phi: 0, // the swing of the plane, degrees
  waves: false, // the water is wavy
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  sound: true,
};

const STEPS = ['laws', 'surface'];
// how far the laws are built, one part at a time
const LAW = { SETTING: 0, RAY: 1, POINT: 2, NORMAL: 3, PLANE: 4, OUT: 5, ANGLES: 6, SWUNG: 7, BOTH: 8 };
const THETA = [20, 75];
const PHI = [-78, 22]; // the plane turns this far round the normal (it faces the view at −40°): never edge-on
const PHI_GAP = 151; // the middle of the angles the handle can't reach: past it, a finger counts from the other end
const WIDE = { az: 24, el: 6.5, distance: 860, aim: new THREE.Vector3(-300, 16, -700) }; // the whole lake: mountain and image
const LAKE_AIM = new THREE.Vector3(-300, -100, -700); // the same, tipped down: the mountain's image above the magnifier
const CLOSE = { az: 40, el: 25 }; // near O, a three-quarter view down at the water, as চিত্র ৮.০৩
const WAVE_IDLE = 20; // after this long untouched the waves rest, and the phone with them
const MARGINS = { top: 34, bottom: 10, side: 10 };
const CHIP_W = 96; // an angle's label on the view, px
const CHIP_H = 92; // and how high it sits, in the scene's units: well above O
const FLY_IN = 1.5; // seconds, from the lake to O
const FLY = 1.5; // seconds, from one close framing to the next
const GROW = 1.2; // seconds a new part takes to arrive
const GLOW_TIME = 1; // seconds it then shines before the button comes back: the hold on the result
const INK = C.ink;
const RING_SMALL = 40; // the circle on the water before the plane opens it
const RING_FAR = 860; // how near the camera is before the circle on the water starts to show
const AMBER_TEXT = '#9a5300';
const WATER_TEXT = '#0b4f6c';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'rl');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: the sheet of one action, one result, one rule ────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'replay', label: 'act_replay', icon: ICONS.play },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      tight: true,
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'rl-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 27, near: 10, far: 14000, environment: false });
  const { camera, controls } = stage;
  controls.enablePan = false;
  const lake = createLake({ stage });
  const dia = createDiagram({
    scene: stage.scene,
    stage,
    host: ui.canvasHost,
    words: {
      smooth: t('l_smooth'),
      rough: t('l_rough'),
      parallel: t('l_parallel'),
      spread: t('l_spread'),
      normal: t('l_normal'),
      note: t('note_waves'),
      ti: 'i',
      tr: 'r',
    },
  });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    step: STEPS.includes(o.step) ? o.step : 'laws',
    law: clamp(Math.round(Number(o.law) || 0), LAW.SETTING, LAW.BOTH),
    theta: clamp(Math.round(Number(o.theta) || 50), THETA[0], THETA[1]),
    phi: clamp(Math.round(Number(o.phi) || 0), PHI[0], PHI[1]),
    wavesOn: Boolean(o.waves),
    wind: o.waves ? 1 : 0, // the waves' strength now, 0 … 1
    time: 2.4, // the waves' clock
    spread: 0,
    idle: 0, // seconds the waves have run with nobody touching anything
    reveal: 1, // the newest part of the laws, 0 … 1 (it grows in)
    glow: 0, // and how much it shines now, 1 … 0
    busy: false, // a part is arriving: the button waits
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    drag: null,
  };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  let again = null; // what the last step did, to do it once more
  let calmed = false; // the waves have come and gone: the last step is over
  /** What the panel's action does now. */
  function phase() {
    if (s.step === 'laws') return s.busy || s.reveal < 1 ? 'busy' : `l${s.law}`;
    if (s.wavesOn) return 's1';
    return calmed ? 'test' : 's0';
  }
  /** X and the handle can be moved once the whole picture is built. */
  const grabbable = () => s.step === 'laws' && s.law >= LAW.ANGLES && !s.busy;

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  function applyWorld() {
    lake.setWaves(s.wind, s.time);
    dia.clear();
    dia.pose(s.theta, s.phi);
    if (s.quiz) return applyQuiz(s.quiz);
    if (s.step === 'surface') {
      s.spread = dia.setLoupe(s.wind, s.time);
      return;
    }
    const k = s.reveal;
    const part = (n) => (s.law > n ? 1 : s.law === n ? k : 0);
    const v = dia.view;
    v.x = s.law > LAW.RAY || (s.law === LAW.RAY && k > 0);
    v.incident = part(LAW.RAY);
    v.o = part(LAW.POINT);
    v.normal = part(LAW.NORMAL);
    v.rightAngle = s.law === LAW.NORMAL && k >= 1;
    const p = part(LAW.PLANE);
    if (p > 0) dia.sheet(Math.min(1, p * 2), ease.outCubic(p));
    v.ringR = RING_SMALL + (SHEET.half - RING_SMALL) * ease.outCubic(p);
    v.dihedral = (s.law === LAW.PLANE && k >= 1) || s.law === LAW.OUT;
    v.reflected = part(LAW.OUT);
    const a = part(LAW.ANGLES);
    if (a > 0) {
      const th = s.theta * a;
      v.arcs.push({ a0: -th, a1: 0, r: ARC, color: C.ti, ends: 'arrows' }, { a0: 0, a1: th, r: ARC, color: C.tr, ends: 'arrows' });
    }
    v.swing = s.law >= LAW.ANGLES && k >= 1;
    v.glow.part = GLOWS[s.law] ?? '';
    v.glow.a = s.glow;
  }
  const GLOWS = { [LAW.RAY]: 'ray', [LAW.POINT]: 'o', [LAW.NORMAL]: 'normal', [LAW.PLANE]: 'plane', [LAW.OUT]: 'out', [LAW.ANGLES]: 'angles' };

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  // what each framing must show. The ring is the whole circle the plane can turn in, so the plane stays in view as it swings
  const ringPoints = (lo, hi, r = SHEET.half + 2) => {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      for (const y of [lo, hi]) out.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    return out;
  };
  const FRAMES = {
    // the ray alone, near: the point where it lands and where it comes from
    ray: [-96, 30].flatMap((x) => [-12, SHEET.up + 2].flatMap((y) => [-30, 30].map((z) => new THREE.Vector3(x, y, z)))),
    plane: ringPoints(-8, SHEET.up + 2),
  };
  function poseKey() {
    if (s.quiz) return s.quiz.kind === 'rough' ? 'lake' : 'plane';
    if (s.step === 'surface') return 'lake';
    if (s.law === LAW.SETTING) return 'wide';
    return s.law < LAW.PLANE ? 'ray' : 'plane';
  }
  const widePose = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  function poseNow() {
    const key = poseKey();
    if (key === 'wide' || key === 'lake') {
      // a fixed view: at any shape of frame the mountain and its image sit in the same part of the height
      dirFrom(WIDE.az, WIDE.el, widePose.position).multiplyScalar(WIDE.distance);
      widePose.target.copy(key === 'wide' ? WIDE.aim : LAKE_AIM);
      return widePose;
    }
    dirFrom(CLOSE.az, CLOSE.el, camDir);
    return fitPose({ points: FRAMES[key], dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGINS });
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
  function flyCamera(duration = 1.5) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      rotate.home();
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
    rotate.home();
    syncUI();
    if (animate) flyCamera(FLY);
    else camK = 1;
    stage.invalidate();
  }
  /** The student has really turned the view (the cue tells a turn from a bare tap). */
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
    onTurn: turnedByHand,
  });
  // the stage also calls this when it lowers its resolution mid-turn: a view the student has turned stays theirs
  stage.onResize(() => {
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    lake.update(camera);
    // the circle on the water belongs to the close view: it comes in as the camera does
    dia.view.ring = s.quiz?.kind === 'rough' || s.step === 'surface' ? 0 : clamp((RING_FAR - camera.position.length()) / 300, 0, 1);
    if (dia.view.loupe) dia.view.loupe.alpha = camK >= 1 ? 1 : camK * camK;
    labels();
  });

  // ── the waves run ──────────────────────────────────────────────────────────────────────────────────────
  stage.addTicker((dt) => {
    const want = s.wavesOn ? 1 : 0;
    if (s.wind === want && want === 0) return false;
    if (s.wind !== want) s.wind = want > s.wind ? Math.min(1, s.wind + dt / 1.4) : Math.max(0, s.wind - dt / 1.1);
    else if (s.idle > WAVE_IDLE) return false;
    s.idle += dt;
    s.time += dt;
    lake.setWaves(s.wind, s.time);
    if (s.step === 'surface' && !s.quiz) {
      s.spread = dia.setLoupe(s.wind, s.time);
      panel();
    }
    return true;
  });
  const wake = () => {
    s.idle = 0;
  };
  root.addEventListener('pointerdown', wake, { capture: true });
  root.addEventListener('keydown', wake, { capture: true });

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function poseTween(theta, phi, duration = 1.5) {
    const t0 = s.theta;
    const p0 = s.phi;
    return tweener.animate({
      key: 'pose',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.theta = Math.round(t0 + (theta - t0) * k);
        s.phi = Math.round(p0 + (phi - p0) * k);
        draw();
      },
    }).finished;
  }
  /** Any part still arriving stops where it is. */
  function settle() {
    ++token;
    for (const k of ['reveal', 'glow']) tweener.cancel(k);
    s.reveal = 1;
    s.glow = 0;
    s.busy = false;
  }
  function go(step, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (!STEPS.includes(step)) return;
    const from = poseKey();
    settle();
    s.step = step;
    s.wavesOn = false;
    again = null;
    calmed = false;
    if (animate) {
      clearLabels();
      poseTween(step === 'surface' ? 50 : s.theta, step === 'surface' ? 0 : s.phi);
      if (poseKey() !== from) flyCamera(FLY_IN);
    } else {
      s.wind = 0;
      if (step === 'surface') {
        s.theta = 50;
        s.phi = 0;
      }
    }
    draw();
    emitChange();
  }
  /** The next part of the laws: the camera goes where it is best seen, it arrives, shines a moment, and the button is back. */
  async function buildLaw(next) {
    const my = ++token;
    const from = poseKey();
    again = () => buildLaw(next);
    s.law = next;
    s.reveal = 0;
    s.busy = true;
    audio.tick();
    draw();
    if (poseKey() !== from) await flyCamera(from === 'wide' || from === 'lake' ? FLY_IN : FLY);
    if (my !== token) return;
    const grown = await tweener.animate({
      key: 'reveal',
      duration: GROW,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        if (my !== token) return;
        s.reveal = Math.min(0.999, k);
        draw();
      },
    }).finished;
    if (!grown || my !== token) return;
    s.reveal = 1;
    s.glow = 1;
    audio.success();
    draw();
    const shone = await tweener.animate({
      key: 'glow',
      duration: GLOW_TIME,
      ease: ease.linear,
      onUpdate: (k) => {
        if (my !== token) return;
        s.glow = 1 - k;
        draw();
      },
    }).finished;
    if (!shone || my !== token) return;
    s.glow = 0;
    s.busy = false;
    draw();
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
    if (/^l[0-5]$/.test(ph)) return buildLaw(s.law + 1);
    // a tap on a drag's button shows the move, and the student can go on by hand
    if (ph === 'l6') {
      return moveDemo(s.theta, s.phi < -14 ? 12 : -46, LAW.SWUNG);
    }
    if (ph === 'l7') {
      return moveDemo(s.theta > 42 ? 30 : 62, s.phi, LAW.BOTH);
    }
    if (ph === 'l8') return go('surface');
    if (ph === 's0' || ph === 's1') return setWaves(!s.wavesOn);
    if (ph === 'test') return quiz.start();
  }
  /** The move a drag's button shows; it can be seen again from where it began. */
  function moveDemo(theta, phi, law) {
    const from = { theta: s.theta, phi: s.phi };
    const my = ++token;
    again = () => {
      Object.assign(s, from);
      draw();
      return moveDemo(theta, phi, law);
    };
    return poseTween(theta, phi, 1.8).then((ok) => {
      if (ok && my === token) passLaw(law);
    });
  }
  /** The step that has just ended, once more. */
  function replay() {
    if (s.locked) return lockedNudge();
    if (s.busy || !again) return;
    audio.unlock();
    return again();
  }
  function setWaves(on) {
    s.wavesOn = on;
    calmed = !on;
    again = () => setWaves(true);
    s.idle = 0;
    audio.tick();
    draw();
    emitChange();
  }
  function passLaw(n) {
    if (s.law >= n) return;
    s.law = n;
    audio.success();
    draw();
    emitChange();
  }

  // ── labels on the picture: few, each with a thin line to what it names ─────────────────────────────────
  let action = null;
  // the plane's handle turns on the ring on the water, which is its track; X moves on an arc in the plane
  const swingWay = new THREE.Vector3();
  const swingHandle = createDragHandle(stage, {
    point: dia.pS,
    axis: 'turn',
    direction: () => swingWay.set(-dia.pS.z, 0, dia.pS.x),
    label: t('drag_turn'),
    aria: t('aria_drag_swing'),
    pulse: Boolean(o.coach),
    when: () => !s.locked && grabbable(),
  });
  const onArc = new THREE.Vector3();
  const arcAt = (theta) => {
    const l = toLight(theta, s.phi);
    return onArc.set(l.x, l.y, l.z).multiplyScalar(L);
  };
  const xWay = new THREE.Vector3();
  const xHandle = createDragHandle(stage, {
    point: dia.pX,
    axis: 'x',
    direction: () => xWay.copy(arcAt(s.theta + 1)).sub(arcAt(s.theta)),
    track: { from: () => arcAt(THETA[0]), via: () => arcAt((THETA[0] + THETA[1]) / 2), to: () => arcAt(THETA[1]) },
    label: t('drag_me'),
    labelAt: 'left',
    aria: t('aria_drag_x'),
    pulse: Boolean(o.coach),
    when: () => !s.locked && grabbable(),
  });
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, rotate.el, note, () => action?.ringBox(), () => swingHandle.box(), () => xHandle.box()],
  });
  const shown = new Map();
  const pts = new Map();
  function label(id, on, text, point, color, spots, optional = false, avoid = []) {
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
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', optional, avoid });
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
  const probe = new THREE.Vector3();
  const onScreen = { x: 0, y: 0 };
  /** Canvas pixels of a point. The object is reused: copy what you keep. */
  function toScreen(p) {
    ptr.copy(p).project(camera);
    onScreen.x = ((ptr.x + 1) / 2) * stage.width;
    onScreen.y = ((1 - ptr.y) / 2) * stage.height;
    return onScreen;
  }
  /** Keep labels off the rays and the normal: small boxes along the lines, in canvas pixels. */
  function lineBoxes() {
    const out = [];
    const add = (x, y, z) => {
      const a = toScreen(probe.set(x, y, z));
      out.push({ left: a.x - 4, top: a.y - 4, right: a.x + 4, bottom: a.y + 4 });
    };
    const d = dia.dirs;
    for (let i = 1; i <= 12; i++) {
      const k = (i * L) / 12;
      add(d.light.x * k, d.light.y * k, d.light.z * k);
      if (s.law >= LAW.OUT) add(d.out.x * k, d.out.y * k, d.out.z * k);
      if (s.law >= LAW.NORMAL) add(0, k, 0);
    }
    return out;
  }
  /** The angles' labels are placed by the geometry: every other label steps round them. */
  function chipBoxes() {
    const out = [];
    for (const id of ['ti', 'tr']) if (shown.has(id)) out.push(anno.box(id));
    return out.filter(Boolean);
  }
  const lineAvoid = [lineBoxes, chipBoxes];
  const chipAvoid = [chipBoxes];
  /** The media's names matter least: they give way to the letters. */
  const mediumAvoid = [
    lineBoxes,
    chipBoxes,
    () => ['xp', 'op', 'o'].map((id) => (shown.has(id) ? anno.box(id) : null)),
    () => {
      if (!dia.view.swing) return null;
      const a = toScreen(dia.pS);
      return { left: a.x - 20, top: a.y - 20, right: a.x + 20, bottom: a.y + 20 };
    },
  ];
  const LEFT = [
    { dx: -44, dy: -10 },
    { dx: -44, dy: 16 },
    { dx: -44, dy: -30 },
  ];
  const RIGHT = [
    { dx: 44, dy: -10 },
    { dx: 44, dy: 16 },
    { dx: 44, dy: -30 },
  ];
  const ABOVE = [
    { dx: 0, dy: -22 },
    { dx: 24, dy: -14 },
    { dx: -24, dy: -14 },
    { dx: 28, dy: 10 },
    { dx: -28, dy: 10 },
  ];
  // X wears the action's ring when it is the part to drag: its letter sits beyond the ring
  const XSPOTS = [
    { dx: -22, dy: -14 },
    { dx: -26, dy: 8 },
    { dx: -44, dy: -6 },
    { dx: -44, dy: 22 },
    { dx: -40, dy: -32 },
  ];
  const XPSPOTS = [
    { dx: 22, dy: -14 },
    { dx: 26, dy: 8 },
    { dx: 44, dy: -6 },
    { dx: 44, dy: 22 },
    { dx: 40, dy: -32 },
  ];
  const BELOW = [
    { dx: 0, dy: 22 },
    { dx: -26, dy: 20 },
    { dx: 26, dy: 20 },
  ];
  const AT = [{ dx: 0, dy: 0 }];
  const RIGHT90 = [
    { dx: 26, dy: -12 },
    { dx: 26, dy: 12 },
  ];
  const leadI = { from: new THREE.Vector3(), to: new THREE.Vector3(), color: C.ti };
  const leadR = { from: new THREE.Vector3(), to: new THREE.Vector3(), color: C.tr };
  const NORMAL_SPOTS = [
    { dx: 8, dy: 0 },
    { dx: -8, dy: 0 },
    { dx: 0, dy: -16 },
  ];
  const tmp = new THREE.Vector3();
  const O = new THREE.Vector3();
  const along = (dir, k) => tmp.set(dir.x * k, dir.y * k, dir.z * k);
  function arcMid(side) {
    const u = dia.dirs.u;
    const a = rad(s.theta / 2);
    return tmp.set(side * u.x * Math.sin(a) * ARC, Math.cos(a) * ARC, side * u.z * Math.sin(a) * ARC);
  }
  /**
   * Where an angle's label goes: side by side over the normal, above where the rays end, so whatever the angle they
   * touch neither ray nor each other, and stay where the eye expects them.
   */
  function chipPoint(id, side) {
    const u = dia.dirs.u;
    const box = shown.has(id) ? anno.box(id) : null;
    const width = box ? box.right - box.left : CHIP_W;
    const a = toScreen(O);
    const ax = a.x;
    const ay = a.y;
    const b = toScreen(probe.set(u.x * 20, 0, u.z * 20));
    const pxU = Math.max(0.2, Math.hypot(b.x - ax, b.y - ay) / 20);
    const d = (width / 2 + 6) / pxU;
    return tmp.set(side * u.x * d, Math.max(CHIP_H, L * Math.cos(rad(s.theta)) + 15), side * u.z * d);
  }
  function labels() {
    const d = dia.dirs;
    const q = s.quiz;
    const law = !q && s.step === 'laws';
    const settled = camK >= 1;
    const done = s.reveal >= 1;
    const u = d.u;
    const at = (n) => law && s.law === n && done;

    // the book's two media, at the right of the picture as in চিত্র ৮.০৩
    const media = law && settled && s.law >= LAW.RAY;
    label('m1', media, t('l_m1'), tmp.set(58, 98, -8), INK, AT, true, mediumAvoid);
    label('m2', media, t('l_m2'), tmp.set(-4, 0, 96), WATER_TEXT, AT, true, mediumAvoid);
    label('x', law && settled && s.law >= LAW.RAY, t('l_x'), dia.pX, AMBER_TEXT, XSPOTS, false, chipAvoid);
    label('o', law && settled && s.law > LAW.POINT, t('l_o'), O, INK, BELOW, true);
    label('op', at(LAW.POINT), t('l_op'), O, INK, BELOW);
    label('ray', at(LAW.RAY) && settled, t('l_ray'), along(d.light, 62), AMBER_TEXT, LEFT, true, lineAvoid);
    label(
      'lamba',
      law && s.law >= LAW.NORMAL && settled && done,
      s.law === LAW.NORMAL ? t('l_lamba') : t('l_normal'),
      tmp.set(0, SHEET.up - 4, 0),
      C.normal,
      NORMAL_SPOTS,
      true,
      chipAvoid,
    );
    // each name shows while the book introduces it, then leaves the picture to the law
    label('plane', at(LAW.PLANE), t('l_plane'), tmp.set(-u.x * 74, 100, -u.z * 74), C.sheet, AT, true);
    label(
      'r90s',
      (at(LAW.PLANE) || at(LAW.OUT)) && settled,
      t('l_right', { a: 90 }),
      tmp.set(u.x * 70 - u.z * 34, 0, u.z * 70 + u.x * 34),
      INK,
      BELOW,
      true,
    );
    label('inc', at(LAW.OUT), t('l_inc'), along(d.light, 62), AMBER_TEXT, LEFT, true, lineAvoid);
    label('ref', at(LAW.OUT), t('l_ref'), along(d.out, 62), AMBER_TEXT, RIGHT, true, lineAvoid);
    label('xp', law && s.law >= LAW.OUT && done, t('l_xp'), dia.pXr, AMBER_TEXT, XPSPOTS, false, chipAvoid);
    const angles = law && s.law >= LAW.ANGLES && done && settled;
    label('ti', angles, t('l_ti', { a: s.theta }), chipPoint('ti', -1), C.ti, AT);
    label('tr', angles, t('l_tr', { a: thetaR() }), chipPoint('tr', 1), C.tr, AT);
    dia.view.leaders.length = 0;
    if (angles) {
      leadI.from.copy(arcMid(-1));
      leadI.to.copy(pts.get('ti'));
      leadR.from.copy(arcMid(1));
      leadR.to.copy(pts.get('tr'));
      dia.view.leaders.push(leadI, leadR);
    }
    label('r90', at(LAW.NORMAL), t('l_right', { a: 90 }), tmp.set(u.x * 11, 11, u.z * 11), INK, RIGHT90, true);

    // the test
    const qk = q?.kind;
    const drawn = qk === 'angle' || qk === 'plane' || qk === 'names' || qk === 'total';
    label('qx', drawn, t('l_x'), dia.pX, AMBER_TEXT, ABOVE);
    label('qxp', qk === 'names' || qk === 'total', t('l_xp'), dia.pXr, AMBER_TEXT, ABOVE);
    label('qo', drawn, t('l_o'), O, INK, BELOW, true);
    for (let i = 0; i < 4; i++) label(`qa${i}`, qk === 'names', q?.names?.[i] ?? '', q?.spots ? q.spots[i] : O, INK, AT);
    const b = rad((90 + s.theta) / 2);
    label(
      'qs',
      qk === 'angle',
      q ? t('l_surface_angle', { a: q.alpha }) : '',
      tmp.set(-u.x * Math.sin(b) * ARC, Math.cos(b) * ARC, -u.z * Math.sin(b) * ARC),
      INK,
      LEFT,
      false,
      [lineBoxes],
    );
    label('qr', qk === 'angle', t('l_tr_q'), arcMid(1), C.tr, [{ dx: 8, dy: -30 }], false, [lineBoxes]);
    label('qt', qk === 'total', q ? t('l_deg', { a: q.whole }) : '', tmp.set(0, ARC, 0), INK, [{ dx: 0, dy: -26 }]);
    for (let i = 0; i < 4; i++) {
      const on = qk === 'plane' && i < (q?.letters?.length ?? 0);
      label(`qc${i}`, on, on ? q.letters[i] : '', on ? q.tips[i] : O, INK, ABOVE);
    }
  }
  const thetaR = () => Math.round(angleToNormal(reflected(s.theta, s.phi), { x: 0, y: 1, z: 0 }));

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  function outcome() {
    if (s.step === 'laws') {
      if (s.law < LAW.ANGLES) return t(`out_l${s.law}`);
      return t('out_angles', { a: s.theta, b: thetaR() });
    }
    return s.wind > 0.5 ? t('out_wavy') : t('out_smooth');
  }
  function rule() {
    if (s.step === 'laws') return t(`rule_l${s.law}`);
    return s.wind > 0.5 ? t('rule_s1') : t('rule_s0');
  }
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    l0: ['act_ray', 1, ICONS.hand],
    l1: ['act_point', 2, ICONS.hand],
    l2: ['act_normal', 3, ICONS.hand],
    l3: ['act_plane', 4, ICONS.hand],
    l4: ['act_reflect', 5, ICONS.hand],
    l5: ['act_angles', 6, ICONS.hand],
    l6: ['act_swing', 7, ICONS.drag],
    l7: ['act_tilt', 8, ICONS.drag],
    l8: ['act_next', '', ICONS.chevR],
    s0: ['act_waves', 1, ICONS.hand],
    s1: ['act_calm', '', ICONS.hand],
    test: ['act_test', '', ICONS.hand],
  };
  const replayBtn = ui.$('[data-act="replay"]');
  const homeBtn = ui.$('[data-act="home"]'); // it gives way to the test's offer, which needs the room
  function panel() {
    if (s.quiz) return;
    replayBtn.hidden = !again;
    replayBtn.disabled = s.busy;
    homeBtn.hidden = phase() === 'test';
    sheet.outcome(outcome());
    sheet.rule(rule());
    sheet.choose(s.step);
    const ph = phase();
    sheet.next(ph === 'l8' ? 'surface' : null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    note.hidden = s.step === 'surface' || s.law === LAW.SETTING; // the magnifier says it itself, and the lake has no rays
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
  }
  function draw() {
    applyWorld();
    panel();
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
    label: 'act_normal',
    target: () => {
      if (s.locked || camK < 1) return null;
      const ph = phase();
      if (ph === 'l6') return ringPoint.copy(dia.pS);
      if (ph === 'l7') return ringPoint.copy(dia.pX);
      if (ph === 's0') return dia.spotOn() ? ringPoint.copy(dia.spot) : null;
      // near O the button in the panel is enough: a ring there would cover the very part that has just arrived
      if (ph === 'l0') return ringPoint.set(0, 0, 0);
      return null;
    },
    radius: 22,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── dragging X and the handle; a tap on O ──────────────────────────────────────────────────────────────
  function grabAt(x, y, touch) {
    if (s.locked || !grabbable()) return null;
    const reach = touch ? 40 : 28;
    const near = (p) => {
      const a = toScreen(p);
      return Math.hypot(a.x - x, a.y - y) <= reach;
    };
    if (swingHandle.hit(x, y) || near(dia.pS)) return 'phi';
    if (xHandle.hit(x, y) || near(dia.pX)) return 'theta';
    return null;
  }
  let down = null;
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      const p = hostXY(e);
      down = { x: p.x, y: p.y, at: performance.now() };
      const what = grabAt(p.x, p.y, e.pointerType === 'touch');
      if (!what) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      ++token;
      tweener.cancel('pose');
      s.drag = { what, id: e.pointerId, x: p.x, y: p.y, theta: s.theta, phi: s.phi, moved: 0 };
      (what === 'phi' ? swingHandle : xHandle).markUsed();
      action.hide('drag');
      audio.unlock();
      emit('dragstart', { part: what });
      e.preventDefault();
    },
    { capture: true },
  );
  const hit = new THREE.Vector3();
  /** The point of the water under a pixel, into hit. False above the horizon. */
  function onWater(x, y) {
    hit
      .set((x / stage.width) * 2 - 1, 1 - (y / stage.height) * 2, 0.5)
      .unproject(camera)
      .sub(camera.position);
    if (hit.y >= -1e-6) return false;
    hit.multiplyScalar(-camera.position.y / hit.y).add(camera.position);
    return true;
  }
  const dirV = new THREE.Vector3();
  function dirPoint(theta) {
    const l = toLight(theta, s.phi);
    return dirV.set(l.x, l.y, l.z).multiplyScalar(L);
  }
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    g.moved = Math.max(g.moved, Math.hypot(dx, dy));
    if (g.what === 'phi') {
      // the handle stays under the finger, on its circle on the water
      if (!onWater(p.x, p.y)) return;
      let a = deg(Math.atan2(hit.z, hit.x));
      if (a > PHI_GAP) a -= 360;
      const next = clamp(Math.round(a), PHI[0], PHI[1]);
      if (next !== s.phi) {
        s.phi = next;
        draw();
        emitChange();
      }
      return;
    }
    // along the way X moves on the screen
    const a = toScreen(dirPoint(g.theta));
    const ax = a.x;
    const ay = a.y;
    const b = toScreen(dirPoint(g.theta + 1));
    const tx = b.x - ax;
    const ty = b.y - ay;
    const next = clamp(Math.round(g.theta + (dx * tx + dy * ty) / Math.max(0.01, tx * tx + ty * ty)), THETA[0], THETA[1]);
    if (next !== s.theta) {
      s.theta = next;
      draw();
      emitChange();
    }
  });
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked;
    action.show('drag');
    emit('dragend', { part: g.what });
    if (g.moved > 6) {
      if (g.what === 'phi' && s.law === LAW.ANGLES && Math.abs(s.phi - g.phi) >= 6) passLaw(LAW.SWUNG);
      if (g.what === 'theta' && s.law === LAW.SWUNG && Math.abs(s.theta - g.theta) >= 3) passLaw(LAW.BOTH);
    }
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const wasDrag = Boolean(s.drag);
    endDrag(e);
    if (wasDrag || !down) return;
    const p = hostXY(e);
    const moved = Math.hypot(p.x - down.x, p.y - down.y);
    const quick = performance.now() - down.at < 500;
    down = null;
    if (moved > 8 || !quick || s.mode === 'quiz') return;
    // a tap on the marked spot does what the button says, while the button is a tap
    const a = toScreen(s.step === 'surface' ? dia.spot : O);
    if (Math.hypot(a.x - p.x, a.y - p.y) < 44 && /^(l[0-5]|s[01])$/.test(phase())) act();
  });
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  const LETTERS = t('letters').split(',');
  function applyQuiz(q) {
    const v = dia.view;
    v.ringR = SHEET.half;
    if (q.kind === 'rough') {
      dia.setLoupe(s.wind, 0, q.picks); // it holds still while the student reads the rays
      return;
    }
    v.o = 1;
    v.incident = 1;
    v.x = true;
    v.normal = 1;
    dia.sheet(q.kind === 'plane' ? 1 : 0.8);
    if (q.kind === 'plane') {
      for (const dir of q.rays) v.cands.push({ dir, drop: true });
      return;
    }
    v.reflected = 1;
    const th = s.theta;
    const arc = (a0, a1, r) => v.arcs.push({ a0, a1, r, color: C.ink, ends: 'ticks' });
    if (q.kind === 'names') {
      arc(-th, 0, ARC);
      arc(-90, -th, ARC * 1.32);
      arc(0, th, ARC);
      arc(th, 90, ARC * 1.32);
    } else if (q.kind === 'angle') {
      arc(-90, -th, ARC);
      arc(0, th, ARC);
    } else if (q.kind === 'total') {
      arc(-th, th, ARC);
    }
  }
  function quizScene(q, { theta = 50, phi = 0, waves = false } = {}) {
    settle();
    tweener.cancel('pose');
    s.theta = theta;
    s.phi = phi;
    s.wavesOn = waves;
    s.wind = waves ? 1 : 0;
    s.idle = 0;
    s.quiz = q;
    clearLabels();
    applyWorld();
    stage.invalidate();
  }
  const notesOf = (pairs) => new Map(pairs.map(([v, html]) => [String(v), html]));
  let order = [];
  let qCurrent = null;
  function prepare(i) {
    const kind = order[i];
    if (kind === 'names') {
      // four arcs carry the letters ক, খ, গ, ঘ in a shuffled order; the book's name of one is asked
      const theta = 46;
      const arcs = ['i', 'surfaceX', 'r', 'surfaceR'];
      const letters = shuffle([0, 1, 2, 3]);
      const asked = Math.random() < 0.5 ? 'i' : 'r';
      const point = (a, r) => new THREE.Vector3(Math.sin(rad(a)) * r, Math.cos(rad(a)) * r, 0);
      const spots = [
        point(-theta / 2, ARC * 1.28),
        point(-(theta + 90) / 2, ARC * 1.62),
        point(theta / 2, ARC * 1.28),
        point((theta + 90) / 2, ARC * 1.62),
      ];
      quizScene({ kind, names: letters.map((k) => `<b>${LETTERS[k]}</b>`), spots }, { theta });
      const answer = letters[arcs.indexOf(asked)];
      const others = arcs.filter((a) => a !== asked);
      return {
        text: t(`q_names_${asked}`),
        answer,
        wrong: others.map((a) => letters[arcs.indexOf(a)]),
        label: (k) => t('c_arc', { x: LETTERS[k] }),
        notes: notesOf(others.map((a) => [letters[arcs.indexOf(a)], t(`n_names_${a.replace(/[XR]$/, '')}`)])),
        reveal: t(`a_names_${asked}`, { x: LETTERS[answer] }),
      };
    }
    if (kind === 'angle') {
      const alpha = [30, 35, 40, 25][Math.floor(Math.random() * 4)];
      const theta = 90 - alpha;
      quizScene({ kind, alpha }, { theta });
      const wrong = [alpha, 2 * theta, 90];
      return {
        text: t('q_angle'),
        answer: theta,
        wrong,
        label: (x) => `${N(x)}°`,
        notes: notesOf([
          [wrong[0], t('n_angle_surface')],
          [wrong[1], t('n_angle_double')],
          [wrong[2], t('n_angle_right')],
        ]),
        reveal: t('a_angle', { a: alpha, b: theta, r: 90 }),
      };
    }
    if (kind === 'plane') {
      // four rays leave O: the real one, one out of the plane, one at a wrong angle, one back on X's side
      const theta = 48;
      const phi = 8;
      const ray = {
        real: reflected(theta, phi),
        off: reflected(theta, phi + 42),
        angle: reflected(theta - 26, phi),
        back: toLight(theta - 22, phi),
      };
      const kinds = shuffle(['real', 'off', 'angle', 'back']);
      const rays = kinds.map((k) => ray[k]);
      const tips = rays.map((r) => new THREE.Vector3(r.x, r.y, r.z).multiplyScalar(L));
      quizScene({ kind, rays, tips, letters: kinds.map((_, k) => `<b>${LETTERS[k]}</b>`) }, { theta, phi });
      const answer = kinds.indexOf('real');
      const wrong = [0, 1, 2, 3].filter((k) => k !== answer);
      return {
        text: t('q_plane'),
        answer,
        wrong,
        label: (k) => t('c_ray', { x: LETTERS[k] }),
        notes: notesOf(wrong.map((k) => [k, t(`n_plane_${kinds[k]}`)])),
        reveal: t('a_plane', { x: LETTERS[answer] }),
      };
    }
    if (kind === 'total') {
      // the picture gives the whole angle between the rays: the normal halves it
      const theta = [40, 35, 25][Math.floor(Math.random() * 3)];
      quizScene({ kind, whole: 2 * theta }, { theta });
      const wrong = [2 * theta, 90 - theta, 90 - 2 * theta];
      return {
        text: t('q_total'),
        answer: theta,
        wrong,
        label: (x) => `${N(x)}°`,
        notes: notesOf([
          [wrong[0], t('n_total_whole')],
          [wrong[1], t('n_total_surface')],
          [wrong[2], t('n_total_rest')],
        ]),
        reveal: t('a_total', { a: 2 * theta, b: theta, two: 2 }),
      };
    }
    // one slope in the magnifier, with its own normal: four rays leave it, one by the law at that slope
    const kinds = shuffle(['real', 'flat', 'wrong', 'back']);
    quizScene({ kind, picks: kinds.map((k, i) => ({ kind: k, letter: LETTERS[i] })) }, { theta: 50, phi: 0, waves: true });
    const answer = kinds.indexOf('real');
    const wrong = [0, 1, 2, 3].filter((k) => k !== answer);
    return {
      text: t('q_rough'),
      answer,
      wrong,
      label: (k) => t('c_ray', { x: LETTERS[k] }),
      notes: notesOf(wrong.map((k) => [k, t(`n_rough_${kinds[k]}`)])),
      reveal: t('a_rough', { x: LETTERS[answer] }),
    };
  }
  const saved = { theta: 50, phi: 0 };
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
        Object.assign(saved, { theta: s.theta, phi: s.phi });
        // the book's order: no scene shows the answer to a later question
        order = ['names', 'angle', 'plane', 'total', 'rough'];
        settle();
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
        s.wavesOn = false;
        s.wind = 0;
        s.theta = saved.theta;
        s.phi = saved.phi;
        syncUI();
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
        // the note names what the student chose: alone it could be read as being about the right answer
        return `${q.reveal}${why ? ` <span class="rl-why">${t('n_pick', { x: q.label(picked.value) })} ${why}</span>` : ''}`;
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
    settle();
    tweener.cancel('pose');
    if (s.step === 'laws') s.law = LAW.SETTING;
    s.wavesOn = false;
    again = null;
    calmed = false;
    s.theta = 50;
    s.phi = 0;
    clearLabels();
    if (s.view === '3d') setView('front');
    else flyCamera(FLY);
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
    if (a === 'replay') replay();
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const dTheta = { ArrowRight: 2, ArrowLeft: -2 }[e.key];
    const dPhi = { ArrowUp: 3, ArrowDown: -3 }[e.key];
    if (dTheta || dPhi) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (!grabbable()) return;
      if (dTheta) {
        const was = s.theta;
        s.theta = clamp(s.theta + dTheta, THETA[0], THETA[1]);
        if (s.law === LAW.SWUNG && s.theta !== was) passLaw(LAW.BOTH);
      }
      if (dPhi) {
        s.phi = clamp(s.phi + dPhi, PHI[0], PHI[1]);
        if (s.law === LAW.ANGLES) passLaw(LAW.SWUNG);
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
    const r = reflected(s.theta, s.phi);
    return {
      step: s.step,
      law: s.law,
      theta: s.theta,
      thetaR: +angleToNormal(r, { x: 0, y: 1, z: 0 }).toFixed(6), // read back from the reflected ray itself
      phi: s.phi,
      inPlane: offPlane(r, sheetNormal(s.phi)) < 1e-9,
      waves: s.wavesOn,
      wind: +s.wind.toFixed(2),
      spread: +s.spread.toFixed(1),
      resting: s.wavesOn && s.idle > WAVE_IDLE, // the waves have stopped drawing until someone touches the figure
      framing: poseKey(), // where the camera goes: 'wide', 'ray', 'plane' or 'lake'
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.step, snap.law, snap.theta, snap.phi, snap.waves]);
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
      if (p.step) go(p.step, { animate });
      if (p.law != null) {
        const from = poseKey();
        settle();
        s.step = 'laws';
        s.law = clamp(Number(p.law), LAW.SETTING, LAW.BOTH);
        if (animate && poseKey() !== from) flyCamera(from === 'wide' || from === 'lake' ? FLY_IN : FLY);
      }
      if (p.theta != null && s.step === 'laws') {
        tweener.cancel('pose');
        s.theta = clamp(Math.round(Number(p.theta)), THETA[0], THETA[1]);
      }
      if (p.phi != null) {
        tweener.cancel('pose');
        s.phi = clamp(Math.round(Number(p.phi)), PHI[0], PHI[1]);
      }
      if (p.glideTo) {
        // the plane or X moves there over the seconds given, as a student's hand would (the video uses it)
        const { theta = s.theta, phi = s.phi, seconds = 1.2 } = p.glideTo;
        poseTween(clamp(Number(theta), THETA[0], THETA[1]), clamp(Number(phi), PHI[0], PHI[1]), Number(seconds));
      }
      if (p.waves != null) {
        if (s.step !== 'surface') go('surface', { animate: false });
        s.wavesOn = Boolean(p.waves);
        if (!animate) s.wind = s.wavesOn ? 1 : 0;
      }
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      settle();
      tweener.cancel('pose');
      Object.assign(s, { step: 'laws', law: LAW.SETTING, theta: 50, phi: 0, wavesOn: false, wind: 0, spread: 0 });
      clearLabels();
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
    exportRoot() {
      // the mountain lake, with the book's picture on it: XO, the normal, OX′
      const g = new THREE.Group();
      g.name = 'reflection-laws';
      g.add(lake.exportModel());
      const l = toLight(s.theta, s.phi);
      const r = reflected(s.theta, s.phi);
      const ray = (name, color, from, dir, length) => {
        const a = createArrow({ color, radius: 0.8, head: 7, headRadius: 2.6, name });
        a.set(from, dir, length);
        g.add(a.root);
      };
      ray('incident-ray-XO', C.ray, new THREE.Vector3(l.x, l.y, l.z).multiplyScalar(L), new THREE.Vector3(-l.x, -l.y, -l.z), L);
      ray('reflected-ray-OX', C.ray, new THREE.Vector3(), new THREE.Vector3(r.x, r.y, r.z), L);
      ray('normal', C.normal, new THREE.Vector3(0, -SHEET.down, 0), new THREE.Vector3(0, 1, 0), SHEET.up + SHEET.down);
      return g;
    },
  };
}
