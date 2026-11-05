// Mirror at a hill-road bend (পাহাড়ি রাস্তার অদৃশ্য বাঁক), book p236, topic 8.8.4: the student view. A car and a bus come to a
// right-angle bend with a hill between them. The bus's light stops on the rock; a mirror set at 45° at the bend turns it
// exactly 90°, along the other road, into the driver's eye, and a small window shows what that eye sees in the mirror.
// The angles are measured close up (θi = θr = 45°), the same path is run backwards (the bus driver sees the car, the book's
// "both sides"), and the plane mirror is swapped for a convex one: a wider strip of road, a much smaller upright image.
// One action, one result, one rule on the kit's clean sheet; the student drags the bus. A 5-question test.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
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
  BUS,
  busEye,
  CAR,
  carEye,
  FOCAL_CONVEX,
  fieldAngle,
  fieldOfView,
  fieldWidthAt,
  imageDistance,
  LANE,
  MIRROR,
  magnification,
  NORMAL,
  path,
  reflect,
  shuffle,
  TANGENT,
  turned,
} from './reading.js';
import { createMirror } from './roadmirror.js';
import { createSetting, terrainHeight } from './setting.js';
import { createVehicles } from './vehicles.js';

export const DEFAULTS = {
  part: 0, // how far the story is built: see PART
  mirror: 'plane', // 'plane' | 'convex'
  bus: 17, // where the bus's nose is along the east road, m
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  sound: true,
};

const PART = { SCENE: 0, BLOCKED: 1, MIRROR: 2, RAY: 3, ANGLES: 4, BOTH: 5, COMPARE: 6 };
const WORDS = ['bend', 'plane', 'convex'];
const START = { car: 29, bus: 31 }; // where they are at first
const STOP = { car: 15, bus: 17 }; // where they wait at the bend
const BUS_RANGE = [14, 25]; // the handle stays in the view at every size
const CNG = { x: 15, z: -LANE, length: 2.7, width: 1.34 };
const HANDLE = { ahead: 1.6, z: 3.42 }; // the bus's handle: on the verge beside the bus, just behind its nose
const WIDE = { az: 13, el: 37 };
const CLOSE = { az: 20, el: 39 };
const MARGINS = { top: 36, bottom: 12, side: 12 };
const FLY = 1.3; // seconds, from one framing to the next
const GROW = 1.2; // seconds a new part takes to arrive
const DRIVE = 2.2; // seconds the vehicles take to reach the bend
const GLOW_TIME = 0.75;
const RAY_ANGLE = 45; // the book's angle
const AMBER_TEXT = '#9a5300';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'hrm');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell ───────────────────────────────────────────────────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: WORDS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'hrm-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);
  const pipEl = document.createElement('div');
  pipEl.className = 'hrm-pip';
  pipEl.innerHTML = '<span></span>';
  ui.stage.appendChild(pipEl);
  const pipTitle = pipEl.firstChild;
  // the bus's handle, always on show when it can be dragged. It is an element, so its pulse needs no 3D frames; the touch
  // goes through it to the view, where the grab is measured (a 44 px circle at least)
  const handle = document.createElement('div');
  handle.className = 'hrm-handle';
  handle.setAttribute('aria-hidden', 'true');
  handle.innerHTML = '<svg viewBox="-15 -15 30 30"><path d="M-3.5 0H3.5M-3.2 -3.6L-7.4 0L-3.2 3.6M3.2 -3.6L7.4 0L3.2 3.6"/></svg>';
  handle.classList.toggle('still', !o.coach);
  ui.annoLayer.appendChild(handle);
  const handleArrows = handle.firstChild;

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 27, near: 1, far: 9000, environment: 'studio-light', environmentIntensity: 0.75 });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(38);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(74);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-20);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(60);
  const sun = new THREE.DirectionalLight('#fff1da', 2.2);
  sun.position.set(-0.62, 0.6, 0.3);
  scene.add(sun, new THREE.HemisphereLight('#cfe3f4', '#6d5a4a', 0.7));
  const setting = createSetting({ stage });
  const { bus, car, cng } = createVehicles();
  scene.add(bus, car, cng);
  car.rotation.y = Math.PI / 2;
  bus.rotation.y = Math.PI;
  cng.position.set(CNG.x, 0, CNG.z);
  setting.setShadow(2, CNG.x - CNG.length / 2, CNG.z, CNG.length, CNG.width, 0);
  const mirror = createMirror({ stage });
  const dia = createDiagram({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const firstPart = clamp(Math.round(Number(o.part) || 0), PART.SCENE, PART.COMPARE);
  const s = {
    part: firstPart,
    kind: o.mirror === 'convex' ? 'convex' : 'plane',
    who: 'car', // whose eye the small window is
    carZ: START.car,
    busX: START.bus,
    rise: 0, // how far the mirror has risen, 0 … 1
    pip: 0, // the window looks at the hill (0) … at the mirror (1)
    reveal: 1,
    glow: 0,
    busy: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    drag: null,
    moved: false, // the student has dragged the bus
  };
  /** The picture for a part with nothing moving. */
  function place(part, busX = clamp(Number(o.bus) || STOP.bus, ...BUS_RANGE)) {
    s.part = part;
    s.carZ = part === PART.SCENE ? START.car : STOP.car;
    s.busX = part === PART.SCENE ? START.bus : busX;
    s.rise = part >= PART.MIRROR ? 1 : 0;
    s.pip = part >= PART.RAY ? 1 : 0;
    s.who = part === PART.BOTH ? 'bus' : 'car';
    if (part < PART.COMPARE) s.kind = 'plane';
    s.reveal = 1;
    s.glow = 0;
    s.busy = false;
  }
  place(firstPart);
  if (o.mirror === 'convex' && firstPart === PART.COMPARE) s.kind = 'convex';

  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  /** What the panel's action does now. */
  function phase() {
    return s.busy || s.reveal < 1 ? 'busy' : `p${s.part}`;
  }
  const grabbable = () => s.part >= PART.BLOCKED && !s.busy && !s.locked;
  const eyeOf = (who) => (who === 'car' ? carEye(s.carZ) : busEye(s.busX));

  // ── the geometry of the moment ──────────────────────────────────────────────────────────────────────────
  /** Where a straight line from a to b first enters the hill, or null. */
  function hillHit(a, b) {
    const n = 120;
    for (let i = 1; i < n; i++) {
      const k = i / n;
      const x = a.x + (b.x - a.x) * k;
      const y = a.y + (b.y - a.y) * k;
      const z = a.z + (b.z - a.z) * k;
      if (terrainHeight(x, z) > y) return { x, y, z };
    }
    return null;
  }

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  function applyWorld() {
    car.position.set(-LANE, 0, s.carZ);
    bus.position.set(s.busX, 0, LANE);
    setting.setShadow(0, -LANE, s.carZ + CAR.length / 2, CAR.length, CAR.width, Math.PI / 2);
    setting.setShadow(1, s.busX + BUS.length / 2, LANE, BUS.length, BUS.width, 0);
    mirror.setRise(s.rise);
    mirror.setConvex(s.kind === 'convex');
    const q = s.quiz;
    mirror.setYaw(q?.yaw ?? 0);
    const E = carEye(s.carZ);
    const H = busEye(s.busX);
    const eye = s.who === 'car' ? E : H;
    const other = s.who === 'car' ? H : E;
    const isCar = s.who === 'car';
    mirror.aim(eye, isCar ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 }, other, s.kind === 'convex');
    const field = s.part === PART.COMPARE && !q && isCar ? fieldOfView(E, s.kind === 'convex') : null;
    const fanOn = field ? (s.part === PART.COMPARE && phaseReveal === 'field' ? s.reveal : 1) : 0;
    setting.setField(field, fanOn);
    dia.clear();
    dia.setNormal(NORMAL.x, NORMAL.z);
    if (q) return applyQuiz(q, E, H);
    const v = dia.view;
    v.track = handleOn() ? TRACK : null;
    const from = other;
    const to = eye;
    const k = s.reveal;
    if (s.part === PART.BLOCKED) {
      const hit = hillHit(H, E);
      if (hit) v.blocked = { from: H, hit, to: E, k: phaseReveal === 'blocked' ? k : 1, glow: 0 };
      v.eye = E;
    }
    if (s.part === PART.MIRROR) {
      // the plan of the bend at the mirror: its face, the two roads' directions, and the 45° between them
      const a = phaseReveal === 'lay' ? k : s.rise >= 1 ? 1 : 0;
      if (a > 0) {
        const c = { x: MIRROR.x, y: MIRROR.y, z: MIRROR.z };
        dia.at.set(c.x, c.y, c.z);
        const along = (x, z, l) => ({ x: c.x + x * l * a, y: c.y, z: c.z + z * l * a });
        v.lines.push({ from: along(TANGENT.x, TANGENT.z, -1.75), to: along(TANGENT.x, TANGENT.z, 1.75), color: C.ink, width: 2.4 });
        v.lines.push({ from: c, to: along(1, 0, 4), color: C.road, dash: true });
        v.lines.push({ from: c, to: along(0, 1, 4), color: C.road, dash: true });
        v.arcs.push(
          { a0: 45, a1: 45 + 45 * a, r: 2.05, color: C.ink, ends: 'arrows' },
          { a0: -45, a1: -45 - 45 * a, r: 2.05, color: C.ink, ends: 'arrows' },
        );
      }
    }
    if (s.part >= PART.RAY) {
      const p = path(to, from);
      dia.at.set(p.P.x, p.P.y, p.P.z);
      v.path = { from, p: p.P, to, k: phaseReveal === 'path' ? k : 1, glow: phaseReveal === 'path' ? s.glow : 0 };
      if (s.part !== PART.COMPARE) v.eye = eye;
      if (s.part === PART.ANGLES) {
        const a = phaseReveal === 'angles' ? k : 1;
        const gl = phaseReveal === 'angles' ? s.glow : 0;
        v.normal = a;
        v.normalLength = 3.1;
        v.normalGlow = gl;
        if (a > 0) {
          const th = p.thetaI * a;
          v.arcs.push(
            { a0: 0, a1: th, r: 1.95, color: C.ti, ends: 'arrows', glow: gl },
            { a0: 0, a1: -th, r: 1.95, color: C.tr, ends: 'arrows', glow: gl },
          );
          v.corner = a >= 1 ? 1 : 0;
          v.cornerGlow = gl;
        }
      }
    }
  }
  /** Which part is growing now, so the rest of the picture stays whole. */
  let phaseReveal = '';
  /** The bus can be dragged, and is in the view. */
  const handleOn = () => grabbable() && !s.quiz && s.reveal >= 1 && poseKey() === 'wide';
  const TRACK = {
    from: { x: BUS_RANGE[0] + HANDLE.ahead, y: 0.02, z: HANDLE.z },
    to: { x: BUS_RANGE[1] + HANDLE.ahead, y: 0.02, z: HANDLE.z },
  };
  const handlePoint = (out) => out.set(s.busX + HANDLE.ahead, 0.02, HANDLE.z);

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  const R0 = V(MIRROR.x, MIRROR.y, MIRROR.z);
  const FRAMES = {
    // both on their way, and the bend
    far: [V(-3, 0, START.car + 5), V(-2, 1, START.car + 5), V(-2, 3, -1), V(START.bus + 10, 0, 3.4), V(START.bus + 10, 3.2, 0.2), V(10, 0, 0)],
    // at the bend: the car, the mirror, the bus
    wide: [V(-3, 0, 20.5), V(-2.4, 2.9, -0.2), V(-0.4, 0, -2), V(27, 0, 3.2), V(27, 3.3, 0), V(14, 0, 18)],
    // the mirror and where the rays meet it
    close: [
      V(MIRROR.x - 1, 0, MIRROR.z - 0.7),
      V(MIRROR.x - 1, 3.2, MIRROR.z - 0.7),
      V(MIRROR.x + 4.6, 1.4, MIRROR.z),
      V(MIRROR.x, 1.4, MIRROR.z + 4.6),
      V(MIRROR.x + 2.8, 0, MIRROR.z + 2.8),
    ],
    // the same, wider: the rays of the turned mirror
    tilt: [
      V(MIRROR.x - 8, 0, MIRROR.z - 2),
      V(MIRROR.x - 1, 3.2, MIRROR.z - 1),
      V(MIRROR.x + 9, 1.4, MIRROR.z),
      V(MIRROR.x, 1.4, MIRROR.z + 10),
      V(MIRROR.x + 8, 0, MIRROR.z + 9),
    ],
    // the mirror and the bus, along the east road
    road: [V(-3, 0, -2), V(-2.4, 3, 0), V(33.5, 0, 3.4), V(33.5, 3.3, 0), V(14, 0, 9)],
  };
  function poseKey() {
    if (s.quiz) return { right: 'close', tilt: 'tilt', reverse: 'wide', which: 'wide', formula: 'road' }[s.quiz.kind];
    if (s.part === PART.SCENE) return 'far';
    return s.part === PART.MIRROR || s.part === PART.ANGLES ? 'close' : 'wide';
  }
  function poseNow() {
    const key = poseKey();
    const c = key === 'close' || key === 'tilt' ? CLOSE : WIDE;
    dirFrom(c.az, c.el, camDir);
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
  function flyCamera(duration = FLY) {
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
    if (animate) flyCamera(0.8);
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

  // ── the small window: one driver's own eye ─────────────────────────────────────────────────────────────
  const pip = { x: 0, y: 0, w: 1, h: 1 };
  function layoutPip() {
    const w = Math.round(clamp(Math.min(stage.width * 0.36, stage.height * 0.44), 118, 300));
    const h = Math.round(w * 0.82);
    pip.w = w;
    pip.h = h;
    pip.x = stage.width - w - 8;
    pip.y = stage.height - h - 8;
    pipEl.style.cssText = `left:${pip.x}px;top:${pip.y}px;width:${w}px;height:${h}px`;
  }
  const eyeCam = new THREE.PerspectiveCamera(30, 1, 0.25, 8000);
  const look = new THREE.Vector3();
  const lookHill = new THREE.Vector3();
  const pipOn = () => {
    if (s.quiz) return s.quiz.pip === true;
    // close up, the whole view belongs to the mirror and its angles
    return s.part >= PART.BLOCKED && s.part !== PART.MIRROR && s.part !== PART.ANGLES;
  };
  function drawPip() {
    if (!pipOn()) return;
    const R = stage.renderer;
    const e = eyeOf(s.who);
    const other = eyeOf(s.who === 'car' ? 'bus' : 'car');
    const hit = hillHit(e, other);
    if (hit) lookHill.set(hit.x, hit.y + 0.6, hit.z);
    else lookHill.set(other.x, other.y, other.z);
    const dist = Math.hypot(e.x - R0.x, e.z - R0.z);
    const k = ease.inOutCubic(s.pip);
    look.lerpVectors(lookHill, R0, k);
    eyeCam.position.set(e.x, e.y, e.z);
    eyeCam.fov = THREE.MathUtils.lerp(36, 2 * THREE.MathUtils.radToDeg(Math.atan(1.12 / dist)), k * k);
    eyeCam.aspect = pip.w / pip.h;
    eyeCam.updateProjectionMatrix();
    eyeCam.lookAt(look);
    eyeCam.updateMatrixWorld(true);
    setting.setViewer(eyeCam);
    const own = s.who === 'car' ? car : bus;
    const was = own.visible;
    own.visible = false;
    const W0 = stage.width;
    const H0 = stage.height;
    R.setViewport(pip.x, H0 - pip.y - pip.h, pip.w, pip.h);
    R.setScissor(pip.x, H0 - pip.y - pip.h, pip.w, pip.h);
    R.setScissorTest(true);
    R.render(scene, eyeCam);
    R.setScissorTest(false);
    R.setViewport(0, 0, W0, H0);
    own.visible = was;
  }
  stage.onResize(() => {
    layoutPip();
    s.userMovedCamera = false;
    if (s.view === '3d') {
      s.view = 'front';
      syncUI();
    }
    draw();
  });
  const hideForMirror = [null];
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    hideForMirror[0] = s.who === 'car' ? car : bus;
    mirror.update(hideForMirror, setting.setViewer);
    setting.setViewer(camera);
    placeHandle();
    labels();
  });
  stage.onAfterRender(drawPip);

  // ── moving on through the story ────────────────────────────────────────────────────────────────────────
  let driving = false; // the vehicles are on their way to the bend
  /** Where the bus stands from now on: at the bend, unless the student has moved it. */
  const busHere = () => (s.part === PART.SCENE || driving ? STOP.bus : s.busX);
  function settle() {
    ++token;
    for (const k of ['reveal', 'glow', 'drive', 'pip', 'glide', 'rise']) tweener.cancel(k);
    place(s.part, busHere());
    driving = false;
    phaseReveal = '';
  }
  function tweenValue(key, duration, onK) {
    return tweener.animate({ key, duration, ease: ease.inOutCubic, onUpdate: onK }).finished;
  }
  /** Grow part `what` from 0 to 1, then let it shine a moment. */
  async function grow(what, my, seconds = GROW) {
    phaseReveal = what;
    s.reveal = 0;
    draw();
    const done = await tweenValue('reveal', seconds, (k) => {
      if (my !== token) return;
      s.reveal = Math.min(0.999, k);
      draw();
    });
    if (!done || my !== token) return false;
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
    if (!shone || my !== token) return false;
    s.glow = 0;
    phaseReveal = '';
    return true;
  }
  async function build(next) {
    const my = ++token;
    const from = poseKey();
    s.part = next;
    s.busy = true;
    audio.tick();
    if (next === PART.BOTH) s.who = 'bus';
    if (next === PART.COMPARE) {
      s.who = 'car';
      s.kind = 'convex';
    }
    if (next === PART.RAY || next === PART.ANGLES || next === PART.BOTH || next === PART.COMPARE) {
      phaseReveal = next === PART.ANGLES ? 'angles' : next === PART.COMPARE ? 'field' : 'path';
      s.reveal = 0;
    }
    if (next === PART.MIRROR) {
      phaseReveal = 'lay';
      s.reveal = 0;
    }
    if (next === PART.BOTH) s.pip = 1;
    draw();
    clearLabels();
    const flight = poseKey() !== from ? flyCamera(FLY) : null;
    if (next === PART.BLOCKED) {
      const carFrom = s.carZ;
      const busFrom = s.busX;
      driving = true;
      const done = await tweenValue('drive', DRIVE, (k) => {
        if (my !== token) return;
        s.carZ = carFrom + (STOP.car - carFrom) * k;
        s.busX = busFrom + (STOP.bus - busFrom) * k;
        draw();
      });
      if (!done || my !== token) return;
      driving = false;
      if (!(await grow('blocked', my))) return;
    } else {
      if (flight) await flight;
      if (my !== token) return;
      if (next === PART.MIRROR) {
        const up = await tweenValue('rise', GROW, (k) => {
          if (my !== token) return;
          s.rise = k;
          draw();
        });
        if (!up || my !== token) return;
        if (!(await grow('lay', my))) return;
      } else if (next === PART.RAY) {
        if (!(await grow('path', my, 1.6))) return;
        const turned2 = await tweenValue('pip', 1.1, (k) => {
          if (my !== token) return;
          s.pip = k;
          stage.invalidate();
        });
        if (!turned2 || my !== token) return;
      } else if (next === PART.ANGLES) {
        if (!(await grow('angles', my, 1.4))) return;
      } else if (next === PART.BOTH) {
        if (!(await grow('path', my, 1.6))) return;
      } else if (next === PART.COMPARE) {
        if (!(await grow('field', my, 1.2))) return;
      }
    }
    s.busy = false;
    draw();
    emitChange();
  }
  function glideBus(to, seconds = 1.6) {
    const my = ++token;
    const from = s.busX;
    return tweener
      .animate({
        key: 'glide',
        duration: seconds,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== token) return;
          s.busX = from + (to - from) * k;
          draw();
        },
      })
      .finished.then(() => emitChange());
  }
  /** A word of the row: no mirror, the plane mirror, the convex mirror. */
  function choose(word) {
    if (s.locked) return lockedNudge();
    if (!WORDS.includes(word)) return;
    const from = poseKey();
    settle();
    clearLabels();
    const busX = busHere();
    if (word === 'bend') place(PART.BLOCKED, busX);
    if (word === 'plane') {
      if (s.part < PART.RAY) place(PART.RAY, busX);
      else if (s.part >= PART.COMPARE) s.kind = 'plane';
    }
    if (word === 'convex') {
      place(PART.COMPARE, busX);
      s.kind = 'convex';
    }
    if (s.part === PART.BOTH && word === 'plane') s.who = 'bus';
    if (poseKey() !== from) flyCamera(FLY);
    audio.tick();
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
    if (ph === 'busy') return;
    if (s.part < PART.COMPARE) return build(s.part + 1);
    // a tap on a drag's button shows the move, and the student can go on by hand
    return glideBus(s.busX > 19 ? 15 : 24);
  }

  // ── the handle ─────────────────────────────────────────────────────────────────────────────────────────
  const hp = { x: 0, y: 0, on: false };
  function placeHandle() {
    const on = handleOn() && camK >= 1;
    if (on) {
      const a = toScreen(handlePoint(tmp2));
      hp.x = a.x;
      hp.y = a.y;
      const c = toScreen(tmp2.set(TRACK.from.x, 0.02, HANDLE.z));
      const cx = c.x;
      const cy = c.y;
      const d = toScreen(tmp2.set(TRACK.to.x, 0.02, HANDLE.z));
      handle.style.transform = `translate(${hp.x}px, ${hp.y}px)`;
      handleArrows.style.transform = `rotate(${Math.atan2(d.y - cy, d.x - cx)}rad)`;
    }
    if (on !== hp.on) {
      hp.on = on;
      handle.classList.toggle('in', on);
    }
    handle.classList.toggle('calm', s.moved);
  }
  const HANDLE_BOX = 22; // half its box for the labels: the disc and a little air
  const handleBox = () => (hp.on ? { left: hp.x - HANDLE_BOX, top: hp.y - HANDLE_BOX, right: hp.x + HANDLE_BOX, bottom: hp.y + HANDLE_BOX } : null);
  function trackBoxes() {
    if (!hp.on) return null;
    const out = [];
    for (let i = 0; i <= 12; i++) {
      const q = toScreen(tmp2.set(TRACK.from.x + ((TRACK.to.x - TRACK.from.x) * i) / 12, 0.02, HANDLE.z));
      out.push({ left: q.x - 6, top: q.y - 6, right: q.x + 6, bottom: q.y + 6 });
    }
    return out;
  }

  // ── labels on the picture ──────────────────────────────────────────────────────────────────────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, note, pipEl, handleBox, trackBoxes, () => action?.ringBox()] });
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
  const onScreen = { x: 0, y: 0 };
  function toScreen(p) {
    ptr.copy(p).project(camera);
    onScreen.x = ((ptr.x + 1) / 2) * stage.width;
    onScreen.y = ((1 - ptr.y) / 2) * stage.height;
    return onScreen;
  }
  /** The lines already on the view, as small boxes along them: labels keep off them. */
  function lineBoxes() {
    const out = [];
    const v = dia.view;
    const seg = (a, b) => {
      for (let i = 0; i <= 10; i++) {
        const q = toScreen(tmp2.set(a.x + ((b.x - a.x) * i) / 10, a.y + ((b.y - a.y) * i) / 10, a.z + ((b.z - a.z) * i) / 10));
        out.push({ left: q.x - 4, top: q.y - 4, right: q.x + 4, bottom: q.y + 4 });
      }
    };
    if (v.path) {
      seg(v.path.from, v.path.p);
      seg(v.path.p, v.path.to);
    }
    if (v.blocked) seg(v.blocked.from, v.blocked.to);
    return out;
  }
  const tmp2 = new THREE.Vector3();
  const lineAvoid = [lineBoxes];
  const SEE_HANDLE = [
    { dx: 0, dy: 40 },
    { dx: -46, dy: 34 },
    { dx: 46, dy: 34 },
    { dx: -64, dy: 8 },
    { dx: -64, dy: 30 },
    { dx: 0, dy: -44 },
  ];
  const UP = [
    { dx: 0, dy: -34 },
    { dx: 30, dy: -28 },
    { dx: -30, dy: -28 },
    { dx: 44, dy: -6 },
    { dx: -44, dy: -6 },
  ];
  const DOWN = [
    { dx: 0, dy: 30 },
    { dx: -30, dy: 26 },
    { dx: 30, dy: 26 },
    { dx: -44, dy: 6 },
    { dx: 44, dy: 6 },
  ];
  const LEFT = [
    { dx: -40, dy: -10 },
    { dx: -40, dy: 14 },
    { dx: -36, dy: -30 },
  ];
  const RIGHT = [
    { dx: 40, dy: -10 },
    { dx: 40, dy: 14 },
    { dx: 36, dy: -30 },
  ];
  const AT = [{ dx: 0, dy: 0 }];
  const tmp = new THREE.Vector3();
  const carTop = () => tmp.set(-LANE, 1.4, s.carZ + 2.4);
  const busTop = () => tmp.set(s.busX + 3.5, 3.1, LANE);
  const HILL_POINT = V(19, 9, 19);
  const VALLEY_POINT = V(-13, -6, -12);
  const mirrorTop = () => tmp.set(MIRROR.x, MIRROR.y + 0.95, MIRROR.z);
  function labels() {
    const q = s.quiz;
    const settled = camK >= 1;
    const free = !q && settled;
    const p = s.part;
    const whole = free && s.reveal >= 1;
    label('car', free && p <= PART.BLOCKED, t('l_car'), carTop(), C.ink, UP, true, lineAvoid);
    label('bus', free && (p <= PART.RAY || p === PART.COMPARE) && p !== PART.MIRROR, t('l_bus'), busTop(), C.ink, UP, true, lineAvoid);
    label('hill', free && p <= PART.BLOCKED, t('l_hill'), HILL_POINT, C.ink, AT, true, lineAvoid);
    label('valley', free && p === PART.SCENE, t('l_valley'), VALLEY_POINT, C.ink, AT, true);
    label(
      'driver',
      free && (p === PART.BLOCKED || p === PART.RAY) && whole,
      t('l_driver'),
      tmp.copy(carEye(s.carZ)),
      '#1864ab',
      RIGHT,
      true,
      lineAvoid,
    );
    const nameMirror = free && (p === PART.MIRROR || p === PART.RAY || p === PART.COMPARE) && s.rise > 0;
    const mirrorWord =
      p === PART.MIRROR ? t('l_mirror_a', { a: RAY_ANGLE }) : p === PART.COMPARE ? t(s.kind === 'convex' ? 'l_convex' : 'l_plane') : t('l_mirror');
    label('mirror', nameMirror, mirrorWord, mirrorTop(), C.ink, UP, false, lineAvoid);
    const laid = free && p === PART.MIRROR && whole && s.rise >= 1;
    label(
      'a1',
      laid,
      t('l_deg', { a: RAY_ANGLE }),
      dia.onArc(67.5, 2.05, tmp),
      C.ink,
      [
        { dx: 22, dy: -12 },
        { dx: 26, dy: 10 },
      ],
      false,
    );
    label(
      'a2',
      laid,
      t('l_deg', { a: RAY_ANGLE }),
      dia.onArc(-67.5, 2.05, tmp),
      C.ink,
      [
        { dx: -22, dy: 12 },
        { dx: -26, dy: -10 },
      ],
      false,
    );
    label('r1', laid, t('l_road'), tmp.set(MIRROR.x + 4, MIRROR.y, MIRROR.z), C.ink, UP.concat(DOWN), true);
    label('r2', laid, t('l_road'), tmp.set(MIRROR.x, MIRROR.y, MIRROR.z + 4), C.ink, LEFT.concat(DOWN), true);
    label('busdrv', free && p === PART.BOTH && whole, t('l_bus_driver'), tmp.copy(busEye(s.busX)), '#1864ab', UP, true, lineAvoid);
    label('car2', free && p === PART.BOTH && whole, t('l_car'), carTop(), C.ink, UP, true, lineAvoid);
    label('cng', free && p === PART.COMPARE, t('l_cng'), tmp.set(CNG.x - 1.2, 1.9, CNG.z), C.ink, UP, true, lineAvoid);

    label('drag', hp.on && !s.moved, t('l_drag'), handlePoint(tmp), C.ink, SEE_HANDLE, true, lineAvoid);

    // the angles, close up
    const angles = free && p === PART.ANGLES && whole;
    const pa = dia.view.path;
    if (angles && pa) {
      const th = path(pa.to, pa.from);
      dia.onArc(th.thetaI / 2, 2.0, tmp);
      label(
        'ti',
        true,
        t('l_ti', { a: Math.round(th.thetaI) }),
        tmp,
        C.ti,
        [
          { dx: 40, dy: 6 },
          { dx: 44, dy: -14 },
          { dx: 30, dy: 26 },
        ],
        false,
        lineAvoid,
      );
      dia.onArc(-th.thetaR / 2, 2.0, tmp);
      label(
        'tr',
        true,
        t('l_tr', { a: Math.round(th.thetaR) }),
        tmp,
        C.tr,
        [
          { dx: -40, dy: 6 },
          { dx: -44, dy: -14 },
          { dx: -30, dy: 26 },
        ],
        false,
        lineAvoid,
      );
      dia.onArc(0, 3.1, tmp);
      label('normal', true, t('l_normal'), tmp, C.normal, DOWN, true, lineAvoid);
      tmp.set(MIRROR.x + 3.7, pa.p.y, MIRROR.z);
      label('inc', true, t('l_inc'), tmp, AMBER_TEXT, UP, true, lineAvoid);
      tmp.set(MIRROR.x, pa.p.y, MIRROR.z + 3.8);
      label('ref', true, t('l_ref'), tmp, AMBER_TEXT, LEFT, true, lineAvoid);
    } else {
      for (const id of ['ti', 'tr', 'normal', 'inc', 'ref']) label(id, false);
    }

    // the test
    const qk = q?.kind;
    const on = settled && q;
    label('qmirror', Boolean(on && qk === 'tilt'), q ? t('l_off', { a: q.delta }) : '', mirrorTop(), C.ink, UP);
    if (on && qk === 'right' && pa) {
      dia.onArc(q.side * 22, 2.0, tmp);
      label(
        'qti',
        true,
        t('l_ti_q'),
        tmp,
        C.ti,
        [
          { dx: 44, dy: 8 },
          { dx: 40, dy: 28 },
        ],
        false,
        lineAvoid,
      );
      dia.onArc(0, 1.0, tmp);
      label('q90', true, t('l_deg', { a: 90 }), tmp, C.ink, RIGHT.concat(LEFT), false, lineAvoid);
      tmp.copy(R0);
    } else {
      label('qti', false);
      label('q90', false);
    }
    for (let i = 0; i < 4; i++) {
      const c = on && qk === 'tilt';
      label(`qc${i}`, Boolean(c), c ? q.letters[i] : '', c ? q.tips[i] : R0, C.ink, UP.concat(DOWN), false);
    }
    label(
      'qu',
      Boolean(on && qk === 'formula'),
      q ? t('l_u', { a: q.u }) : '',
      tmp.set(MIRROR.x + (q?.u ?? 0) / 2, 1.5, MIRROR.z),
      C.ink,
      UP.concat(DOWN),
      false,
    );
    label('qbus', Boolean(on && (qk === 'formula' || qk === 'reverse')), t('l_bus'), busTop(), C.ink, UP, true);
    label('qcar', Boolean(on && qk === 'reverse'), t('l_car'), carTop(), C.ink, UP, true);
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  const measures = () => {
    const E = carEye(s.carZ);
    const convex = s.kind === 'convex';
    const u = Math.abs(busEye(s.busX).x - MIRROR.x);
    const width = fieldWidthAt(fieldOfView(E, convex), s.busX);
    return { u, width, m: convex ? magnification(u, FOCAL_CONVEX) : 1, angle: fieldAngle(E, convex) };
  };
  function outcome() {
    const p = s.part;
    if (p === PART.SCENE) return t('out_0');
    if (p === PART.BLOCKED) return t('out_1');
    if (p === PART.MIRROR) return t('out_2', { a: RAY_ANGLE });
    if (p === PART.RAY) return t('out_3');
    if (p === PART.ANGLES) {
      const th = path(carEye(s.carZ), busEye(s.busX));
      return `<span class="hrm-a hrm-ti">${t('out_a_i', { a: Math.round(th.thetaI) })}</span><span class="hrm-a hrm-tr">${t('out_a_r', { a: Math.round(th.thetaR) })}</span>`;
    }
    if (p === PART.BOTH) return t('out_5');
    const { width, m } = measures();
    const w = N(width >= 10 ? Math.round(width) : Number(width.toFixed(1)));
    return s.kind === 'convex' ? t('out_convex', { w, k: Math.round(1 / m) }) : t('out_plane', { w });
  }
  function rule() {
    const p = s.part;
    if (p === PART.COMPARE) return t(s.kind === 'convex' ? 'rule_convex' : 'rule_plane');
    return t(`rule_${p}`, { a: RAY_ANGLE, r: 90 });
  }
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    p0: ['act_go', 1, ICONS.hand],
    p1: ['act_mirror', 2, ICONS.hand],
    p2: ['act_ray', 3, ICONS.hand],
    p3: ['act_angles', 4, ICONS.hand],
    p4: ['act_both', 5, ICONS.hand],
    p5: ['act_convex', 6, ICONS.hand],
    p6: ['act_drag', 7, ICONS.drag],
  };
  function word() {
    if (s.rise <= 0 && s.part < PART.MIRROR) return 'bend';
    return s.kind;
  }
  function panel() {
    pipEl.hidden = !pipOn();
    pipTitle.textContent = t(s.who === 'car' ? 'pip_car' : 'pip_bus');
    note.hidden = !(s.part === PART.BLOCKED || s.part >= PART.RAY) || Boolean(s.quiz);
    if (s.quiz) return;
    sheet.outcome(outcome());
    sheet.rule(rule());
    sheet.choose(word());
    const ph = phase();
    sheet.next(ph === 'p1' ? 'plane' : ph === 'p5' ? 'convex' : null);
    const [key, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const label2 = key === 'act_mirror' ? () => t(key, { a: RAY_ANGLE }) : key;
    const k2 = `${key}|${step}|${enabled}`;
    if (action && steady.act !== k2) {
      steady.act = k2;
      action.set({ label: label2, step, enabled, icon });
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
    label: 'act_go',
    target: () => {
      if (s.locked || camK < 1) return null;
      const ph = phase();
      if (ph === 'p0') return ringPoint.set(-LANE, 0.8, s.carZ + 2);
      if (ph === 'p1') return ringPoint.set(MIRROR.x, 0.6, MIRROR.z);
      if (ph === 'p6') return hp.on ? handlePoint(ringPoint) : null;
      return null;
    },
    radius: 22,
    avoid: [ui.corner, ui.hint, note, pipEl, handleBox, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── dragging the bus; a tap on the marked spot ─────────────────────────────────────────────────────────
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const hit = new THREE.Vector3();
  /** The point of the level y under a pixel, into hit. */
  function onLevel(x, y, level) {
    hit
      .set((x / stage.width) * 2 - 1, 1 - (y / stage.height) * 2, 0.5)
      .unproject(camera)
      .sub(camera.position);
    if (hit.y >= -1e-6) return false;
    hit.multiplyScalar((level - camera.position.y) / hit.y).add(camera.position);
    return true;
  }
  function overBus(x, y, touch) {
    if (hp.on && Math.hypot(x - hp.x, y - hp.y) <= (touch ? 30 : 24)) return true;
    const a = { ...toScreen(tmp2.set(s.busX, 1.5, LANE)) };
    const b = { ...toScreen(tmp2.set(s.busX + BUS.length, 1.5, LANE)) };
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const k = clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(x - (a.x + dx * k), y - (a.y + dy * k)) <= (touch ? 34 : 24);
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      const p = hostXY(e);
      down = { x: p.x, y: p.y, at: performance.now() };
      if (!grabbable() || !overBus(p.x, p.y, e.pointerType === 'touch')) return;
      const onHandle = hp.on && Math.hypot(p.x - hp.x, p.y - hp.y) <= 30;
      const level = onHandle ? 0 : 1.5;
      if (!onLevel(p.x, p.y, level)) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      ++token;
      tweener.cancel('glide');
      s.drag = { id: e.pointerId, x0: hit.x, bus0: s.busX, moved: 0, px: p.x, py: p.y, level };
      action.hide('drag');
      audio.unlock();
      emit('dragstart', { part: 'bus' });
      e.preventDefault();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    g.moved = Math.max(g.moved, Math.hypot(p.x - g.px, p.y - g.py));
    if (!onLevel(p.x, p.y, g.level)) return;
    const next = clamp(Math.round((g.bus0 + hit.x - g.x0) * 10) / 10, ...BUS_RANGE);
    if (next !== s.busX) {
      s.busX = next;
      s.moved = true;
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
    emit('dragend', { part: 'bus' });
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
    const ph = phase();
    if (ph !== 'p0' && ph !== 'p1') return;
    const a = toScreen(ph === 'p0' ? tmp2.set(-LANE, 0.8, s.carZ + 2) : tmp2.set(MIRROR.x, 0.6, MIRROR.z));
    if (Math.hypot(a.x - p.x, a.y - p.y) < 44) act();
  });
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  const LETTERS = t('letters').split(',');
  function applyQuiz(q, E, H) {
    const v = dia.view;
    if (q.kind === 'right') {
      const p = path(E, H);
      dia.at.set(p.P.x, p.P.y, p.P.z);
      v.path = { from: H, p: p.P, to: E, k: 1, glow: 0 };
      v.normal = 1;
      v.normalLength = 2.6;
      v.arcs.push({ a0: 0, a1: q.side * 45, r: 1.95, color: C.ti, ends: 'arrows' });
      v.corner = 1;
      return;
    }
    if (q.kind === 'tilt') {
      dia.at.set(MIRROR.x, MIRROR.y, MIRROR.z);
      dia.setNormal(q.n.x, q.n.z);
      v.path = { from: V(MIRROR.x + 11, MIRROR.y, MIRROR.z), p: R0, to: R0, k: 0.5 };
      v.normal = 1;
      v.normalLength = 3.4;
      for (const tip of q.tips) v.rays.push({ from: R0, to: tip });
      return;
    }
    if (q.kind === 'reverse') {
      const p = path(E, H);
      v.path = { from: H, p: p.P, to: E, k: 1 };
      v.eye = E;
      return;
    }
    if (q.kind === 'formula') {
      v.leaders.push({ from: { x: MIRROR.x, y: 1.5, z: MIRROR.z }, to: { x: H.x, y: 1.5, z: H.z }, color: C.ink });
    }
  }
  function quizScene(q, { kind = 'plane', busX = STOP.bus } = {}) {
    settle();
    place(PART.COMPARE, busX);
    s.kind = kind;
    s.who = 'car';
    s.pip = 1;
    s.rise = 1;
    s.quiz = q;
    clearLabels();
    applyWorld();
    panel();
    stage.invalidate();
  }
  const notesOf = (pairs) => new Map(pairs.map(([k, html]) => [String(k), html]));
  let order = [];
  let qCurrent = null;
  function prepare(i) {
    const kind = order[i];
    if (kind === 'right') {
      quizScene({ kind, side: 1 });
      const wrong = [90, 22.5, 135];
      return {
        text: t('q_right_a'),
        answer: 45,
        wrong,
        label: (x) => `${N(x)}°`,
        notes: notesOf([
          [90, t('n_right_whole')],
          [22.5, t('n_right_half')],
          [135, t('n_right_out')],
        ]),
        reveal: t('a_right', { a: 45, r: 90, two: 2 }),
      };
    }
    if (kind === 'tilt') {
      const delta = 15;
      const sign = Math.random() < 0.5 ? 1 : -1;
      const n = turned(NORMAL, sign * delta);
      const d = { x: -1, y: 0, z: 0 };
      const dir = {
        real: reflect(d, n),
        same: { x: 0, y: 0, z: 1 },
        once: turned({ x: 0, y: 0, z: 1 }, sign * delta),
        back: turned({ x: 1, y: 0, z: 0 }, -sign * 18 + 0),
      };
      const kinds = shuffle(['real', 'same', 'once', 'back']);
      const tips = kinds.map((k) => V(MIRROR.x + dir[k].x * 9, MIRROR.y, MIRROR.z + dir[k].z * 9));
      quizScene({ kind, yaw: sign * delta, delta, n, tips, letters: kinds.map((_, k) => `<b>${LETTERS[k]}</b>`) });
      const answer = kinds.indexOf('real');
      const wrong = [0, 1, 2, 3].filter((k) => k !== answer);
      return {
        text: t('q_tilt', { a: RAY_ANGLE, d: delta }),
        answer,
        wrong,
        label: (k) => t('c_ray', { x: LETTERS[k] }),
        notes: notesOf(wrong.map((k) => [k, t(`n_tilt_${kinds[k]}`, { d: delta })])),
        reveal: t('a_tilt', { x: LETTERS[answer], d: delta, e: delta * 2, a: RAY_ANGLE }),
      };
    }
    if (kind === 'reverse') {
      quizScene({ kind, pip: true });
      const list = ['yes', 'one', 'high', 'convex'];
      return {
        text: t('q_reverse'),
        answer: 0,
        wrong: [1, 2, 3],
        label: (k) => t(`c_rev_${list[k]}`),
        notes: notesOf([
          [1, t('n_rev_one')],
          [2, t('n_rev_high')],
          [3, t('n_rev_convex')],
        ]),
        reveal: t('a_rev'),
      };
    }
    if (kind === 'which') {
      const kindNow = Math.random() < 0.5 ? 'convex' : 'plane';
      const list = ['plane', 'convex', 'concave', 'glass'];
      quizScene({ kind, pip: true }, { kind: kindNow });
      const answer = list.indexOf(kindNow);
      const wrong = [0, 1, 2, 3].filter((k) => k !== answer);
      return {
        text: t('q_which'),
        answer,
        wrong,
        label: (k) => t(`c_m_${list[k]}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_which_${list[k]}`)])),
        reveal: t(`a_which_${kindNow}`),
      };
    }
    // the mirror formula, with u read off the picture
    const u = [16, 20, 24][Math.floor(Math.random() * 3)];
    const fv = Math.abs(FOCAL_CONVEX);
    const v = imageDistance(u, FOCAL_CONVEX);
    const vs = N(Math.abs(v).toFixed(1));
    quizScene({ kind, u }, { kind: 'convex', busX: u + MIRROR.x - BUS.eyeBack });
    const list = ['behind', 'front', 'same', 'focus'];
    return {
      text: t('q_formula', { f: fv, one: 1 }),
      answer: 0,
      wrong: [1, 2, 3],
      label: (k) => t(`c_v_${list[k]}`, { v: vs, u, f: fv }),
      notes: notesOf([
        [1, t('n_v_front')],
        [2, t('n_v_same')],
        [3, t('n_v_focus')],
      ]),
      reveal: t('a_formula', { v: vs, f: fv, u, one: 1 }),
    };
  }
  const saved = { part: 0, kind: 'plane', busX: STOP.bus };
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
        s.mode = 'quiz';
        Object.assign(saved, { part: s.part, kind: s.kind, busX: s.busX });
        s.locked = true;
        order = ['right', 'tilt', 'reverse', 'which', 'formula'];
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
        place(saved.part, saved.busX);
        s.kind = saved.part >= PART.COMPARE ? saved.kind : 'plane';
        syncUI();
        flyCamera(0.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = prepare(i);
        qCurrent = q;
        say(q.text);
        const done = await flyCamera(0.6);
        if (!alive()) return null;
        if (!done) camK = 1;
        const out = [q.answer];
        for (const w of q.wrong) if (out.length < 4 && !out.includes(w)) out.push(w);
        const choices = shuffle(out);
        q.rightIndex = choices.indexOf(q.answer);
        return { choices, expected: q.answer, tolerance: 1e-6, label: q.label, meta: { kind: order[i] } };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        const why = !correct && picked ? q.notes.get(String(picked.value)) : '';
        return `${q.reveal}${why ? ` <span class="hrm-why">${t('n_pick', { x: q.label(picked.value) })} ${why}</span>` : ''}`;
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
    place(PART.SCENE);
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
    if (b.dataset.example) choose(b.dataset.example);
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
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (!grabbable()) return;
      ++token;
      tweener.cancel('glide');
      s.busX = clamp(s.busX + d, ...BUS_RANGE);
      s.moved = true;
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
    const E = carEye(s.carZ);
    const H = busEye(s.busX);
    const p = path(E, H);
    const m = measures();
    return {
      part: s.part,
      mirror: s.rise > 0 ? s.kind : 'none',
      who: s.who,
      busX: +s.busX.toFixed(2),
      carZ: +s.carZ.toFixed(2),
      thetaI: +p.thetaI.toFixed(3),
      thetaR: +p.thetaR.toFixed(3),
      turn: +p.turn.toFixed(3),
      blocked: Boolean(hillHit(H, E)),
      fieldWidth: +m.width.toFixed(2),
      fieldAngle: +m.angle.toFixed(2),
      magnification: +m.m.toFixed(4),
      framing: poseKey(),
      pip: pipOn(),
      handle: handleOn(),
      dragged: s.moved,
      question: s.quiz ? { kind: s.quiz.kind, right: qCurrent?.rightIndex ?? -1 } : null,
      busy: s.busy,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.part, snap.mirror, snap.who, snap.busX]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  layoutPip();
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
      if (p.part != null) {
        const next = clamp(Math.round(Number(p.part)), PART.SCENE, PART.COMPARE);
        const from = poseKey();
        if (animate && next === s.part + 1 && !s.busy) {
          build(next);
        } else {
          settle();
          clearLabels();
          place(next, busHere());
          if (animate && poseKey() !== from) flyCamera(FLY);
        }
      }
      if (p.mirror) {
        const k = p.mirror === 'convex' ? 'convex' : 'plane';
        if (k !== s.kind) {
          if (s.part < PART.COMPARE) place(PART.COMPARE, busHere());
          s.kind = k;
          clearLabels();
        }
      }
      if (p.bus != null) {
        ++token;
        tweener.cancel('glide');
        s.busX = clamp(Number(p.bus), ...BUS_RANGE);
      }
      if (p.glideBus) glideBus(clamp(Number(p.glideBus.to), ...BUS_RANGE), Number(p.glideBus.seconds) || 1.6);
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      settle();
      place(PART.SCENE);
      s.kind = 'plane';
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
      // the bend, the vehicles, the mirror, and the ray that turns 90°
      const g = new THREE.Group();
      g.name = 'hill-road-mirror';
      g.add(setting.exportModel(), mirror.exportModel());
      for (const v of [car, bus, cng]) g.add(v.clone());
      const E = carEye(STOP.car);
      const H = busEye(s.busX);
      const p = path(E, H).P;
      const ray = (name, a, b) => {
        const d = new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
        const arrow = createArrow({ color: C.ray, radius: 0.05, head: 0.5, headRadius: 0.18, name });
        arrow.set(new THREE.Vector3(a.x, a.y, a.z), d.clone().normalize(), d.length());
        g.add(arrow.root);
      };
      ray('incident-ray', H, p);
      ray('reflected-ray', p, E);
      return g;
    },
  };
}
