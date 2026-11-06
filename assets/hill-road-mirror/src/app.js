// Mirror at a hill-road bend (পাহাড়ি রাস্তার অদৃশ্য বাঁক), book p236, topic 8.8.4: the student view. A car and a bus come to a
// right-angle bend with a hill between them. The bus's light stops on the rock; a mirror set at 45° at the bend turns it
// exactly 90°, along the other road, into the driver's eye, and a small window shows what that eye sees in the mirror.
// The angles are measured close up (θi = θr = 45°), the same path is run backwards (the bus driver sees the car, the book's
// "both sides"), and the last step sets the plane and convex mirrors side by side for the same bus: the strip of road
// each shows, and the size of the image. One idea to a tap: every step plays slowly, waits, and can be seen again.
// One action, one result, one rule on the kit's clean sheet; the student drags the bus. A 5-question test, offered at the end.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
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
  bus: 13.5, // where the bus's nose is along the east road, m
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  sound: true,
};

const PART = { SCENE: 0, BLOCKED: 1, MIRROR: 2, RAY: 3, ANGLES: 4, BOTH: 5, COMPARE: 6 };
const WORDS = ['bend', 'plane', 'convex'];
const START = { car: 25, bus: 27 }; // where they are at first
const STOP = { car: 13, bus: 13.5 }; // where they wait at the bend
const BUS_RANGE = [12.5, 20];
const CNG = { x: 13.7, z: -LANE, length: 2.75, width: 1.34 };
const HANDLE = { ahead: 1.6, z: 3.42 }; // the bus's handle: on the verge beside the bus, just behind its nose
const WIDE = { az: 13, el: 37, elBand: 43 };
const CLOSE = { az: 20, el: 39 };
const MARGINS = { top: 36, bottom: 12, side: 12 };
const FLY = 1.6; // seconds, from one framing to the next
const GROW = 1.5; // seconds a new part takes to arrive
const DRIVE = 2.5; // seconds the vehicles take to reach the bend
const RAY_TIME = 2.2; // seconds the light takes: about one for each leg
const SWING = 1.6; // seconds the window takes to swing to the mirror
const HOLD = 0.5; // seconds the result stays, after its glow, before the button comes back
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
      quiet: [
        { act: 'replay', label: 'act_replay', icon: ICONS.play },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      tight: true,
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // the corner: the kit's cue that the view turns (it goes in here below, once there is a stage), and the note beside it
  const corner = document.createElement('div');
  corner.className = 'hrm-corner';
  ui.stage.appendChild(corner);
  const note = document.createElement('div');
  note.className = 'hrm-note';
  note.textContent = t('note_rays');
  corner.appendChild(note);
  // the small windows: one driver's own eye. Their pictures are drawn in the 3D canvas, under these frames
  const makePane = () => {
    const el = document.createElement('div');
    el.className = 'hrm-pip';
    el.innerHTML = '<span></span><em></em>';
    ui.stage.appendChild(el);
    return { el, title: el.children[0], note: el.children[1], x: 0, y: 0, w: 1, h: 1, kind: 'plane' };
  };
  const panes = [makePane(), makePane()];
  // the test is offered, gently, once the last step is done: never forced
  const offer = document.createElement('button');
  offer.type = 'button';
  offer.className = 'hrm-offer';
  offer.dataset.offer = '1';
  offer.textContent = t('offer_test');
  offer.hidden = true;
  ui.learn.appendChild(offer);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 27, near: 1, far: 9000, environment: 'studio-light', environmentIntensity: 0.75 });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
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
    orbited: false, // the student has turned the view
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
    const q = s.quiz;
    mirror.setYaw(q?.yaw ?? 0);
    const E = carEye(s.carZ);
    const H = busEye(s.busX);
    const eye = s.who === 'car' ? E : H;
    const other = s.who === 'car' ? H : E;
    const isCar = s.who === 'car';
    mirror.aim(eye, isCar ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 }, other);
    const field = s.part === PART.COMPARE && !q && isCar ? fieldOfView(E, s.kind === 'convex') : null;
    const fanOn = field ? (s.part === PART.COMPARE && phaseReveal === 'field' ? s.reveal : 1) : 0;
    setting.setField(field, fanOn);
    dia.clear();
    dia.setNormal(NORMAL.x, NORMAL.z);
    if (q) return applyQuiz(q, E, H);
    const v = dia.view;
    if (s.rise > 0 && poseKey() === 'wide') v.halo = HALO;
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
      if (s.part === PART.ANGLES) nearArrows(v.path);
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
  const HALO = { p: { x: MIRROR.x, y: MIRROR.y, z: MIRROR.z }, r: 17 };
  /** Close up, a ray's arrowhead sits near the mirror, inside the frame, whatever the ray's length. */
  function nearArrows(pa, l = 3.3) {
    pa.tin = 1 - l / Math.hypot(pa.from.x - pa.p.x, pa.from.z - pa.p.z);
    pa.tout = l / Math.hypot(pa.to.x - pa.p.x, pa.to.z - pa.p.z);
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
  // the wide framing follows the bus's tail, so the bus stays whole wherever it is dragged
  const BUS_LOW = V(0, 0, 3.7);
  const BUS_HIGH = V(0, 3.3, 0);
  const FRAMES = {
    // both on their way, and the bend
    far: [V(-3, 0, START.car + 5), V(-2, 1, START.car + 5), V(-2, 3, -1), V(START.bus + 10, 0, 3.4), V(START.bus + 10, 3.2, 0.2), V(10, 0, 0)],
    // at the bend: the mirror, the car and the bus, nothing else
    wide: [V(-3, 0, STOP.car + 5), V(-2.6, 3.1, -0.4), V(-0.4, 0, -1.6), BUS_LOW, BUS_HIGH],
    // the mirror and where the rays meet it
    close: [
      V(MIRROR.x - 1, 0, MIRROR.z - 0.7),
      V(MIRROR.x - 1, 3.2, MIRROR.z - 0.7),
      V(MIRROR.x + 4.6, 1.4, MIRROR.z),
      V(MIRROR.x, 1.4, MIRROR.z + 4.6),
      V(MIRROR.x + 2.8, 0, MIRROR.z + 2.8),
    ],
    // the turned mirror and its four rays: filled in by the question
    tilt: [R0],
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
    const band = windowsBelow();
    dirFrom(c.az, band ? (c.elBand ?? c.el) : c.el, camDir);
    BUS_LOW.x = BUS_HIGH.x = Math.min(s.busX, BUS_RANGE[1]) + BUS.length + 0.8;
    const margin = key === 'wide' && band && pipOn() ? { ...MARGINS, bottom: panes[1].h + 14 } : MARGINS;
    return fitPose({ points: FRAMES[key], dir: camDir, camera, width: stage.width, height: stage.height, margin });
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
  /** The student has really turned or zoomed the view: from here the camera is theirs, until the guided view is asked for. */
  function turnedByHand() {
    if (s.userMovedCamera || s.locked || s.drag) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    s.orbited = true;
    rotate.markUsed();
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  }
  // the whole way round, always above the ground (the hill is kept off by keepAboveGround)
  const rotate = createRotateCue(stage, {
    layer: corner,
    short: `${t.num(360)}°`,
    label: t('orbit_cue'),
    pulse: Boolean(o.coach),
    onTurn: turnedByHand,
  });
  /** Never inside the hill or under the ground. */
  const ABOVE = 2.5;
  function keepAboveGround() {
    const floor = terrainHeight(camera.position.x, camera.position.z) + ABOVE;
    if (camera.position.y < floor) camera.position.y = floor;
  }

  // ── the small window: one driver's own eye ─────────────────────────────────────────────────────────────
  /** Narrow frames carry the windows in a band under the scene, wide ones in the corner beside the car. */
  const windowsBelow = () => stage.width / Math.max(1, stage.height) < 1.25;
  function layoutPip() {
    const W = stage.width;
    const H = stage.height;
    const below = windowsBelow();
    const w = below ? Math.min(300, Math.floor((W - 24) / 2)) : Math.round(clamp(Math.min(W * 0.29, H * 0.42), 118, 300));
    const h = Math.round(below ? Math.min(w * 0.8, H * 0.37) : w * 0.82);
    panes.forEach((p, i) => {
      p.w = w;
      p.h = h;
      p.x = W - (2 - i) * (w + 8);
      p.y = H - h - 8;
      p.el.style.cssText = `left:${p.x}px;top:${p.y}px;width:${w}px;height:${h}px`;
    });
  }
  const eyeCam = new THREE.PerspectiveCamera(30, 1, 0.25, 8000);
  const look = new THREE.Vector3();
  const lookHill = new THREE.Vector3();
  const pipOn = () => {
    if (s.quiz) return s.quiz.pip === true;
    // close up, the whole view belongs to the mirror and its angles
    return s.part >= PART.BLOCKED && s.part !== PART.MIRROR && s.part !== PART.ANGLES;
  };
  const two = () => s.part === PART.COMPARE && !s.quiz;
  /** One view through one driver's eye, in the window p, with that kind of mirror. */
  function drawPane(p, kind, zoom) {
    const R = stage.renderer;
    const H0 = stage.height;
    mirror.show(kind, true);
    eyeCam.aspect = p.w / p.h;
    eyeCam.fov = zoom;
    eyeCam.updateProjectionMatrix();
    R.setViewport(p.x, H0 - p.y - p.h, p.w, p.h);
    R.setScissor(p.x, H0 - p.y - p.h, p.w, p.h);
    R.setScissorTest(true);
    R.render(scene, eyeCam);
    R.setScissorTest(false);
    R.setViewport(0, 0, stage.width, H0);
  }
  function drawPip() {
    if (!pipOn()) return;
    const e = eyeOf(s.who);
    const other = eyeOf(s.who === 'car' ? 'bus' : 'car');
    const hit = hillHit(e, other);
    if (hit) lookHill.set(hit.x, hit.y + 0.6, hit.z);
    else lookHill.set(other.x, other.y, other.z);
    const dist = Math.hypot(e.x - R0.x, e.z - R0.z);
    const k = ease.inOutCubic(s.pip);
    look.lerpVectors(lookHill, R0, k);
    eyeCam.position.set(e.x, e.y, e.z);
    eyeCam.lookAt(look);
    eyeCam.updateMatrixWorld(true);
    const zoom = THREE.MathUtils.lerp(36, 2 * THREE.MathUtils.radToDeg(Math.atan((MIRROR.radius * 1.1) / dist)), k * k);
    setting.setViewer(eyeCam);
    setting.fieldOff(true);
    const own = s.who === 'car' ? car : bus;
    const was = own.visible;
    own.visible = false;
    if (two()) {
      drawPane(panes[0], 'plane', zoom);
      drawPane(panes[1], 'convex', zoom);
    } else drawPane(panes[1], s.kind, zoom);
    own.visible = was;
    setting.fieldOff(false);
  }
  // the stage also calls this when it lowers its resolution mid-turn: a view the student has turned stays theirs, and an
  // unturned one is fitted again on the next frame
  stage.onResize(() => {
    layoutPip();
    draw();
  });
  const hideForMirror = [null];
  const BOTH_KINDS = ['plane', 'convex'];
  const ONE_KIND = ['plane'];
  stage.onBeforeRender(() => {
    applyCamera();
    if (s.userMovedCamera) keepAboveGround();
    camera.updateMatrixWorld();
    hideForMirror[0] = s.who === 'car' ? car : bus;
    setting.fieldOff(true);
    mirror.update(two() ? BOTH_KINDS : ((ONE_KIND[0] = s.kind), ONE_KIND), hideForMirror, setting.setViewer);
    setting.fieldOff(false);
    setting.setViewer(camera);
    mirror.show(s.kind);
    labels();
  });
  stage.onAfterRender(drawPip);

  // ── moving on through the story ────────────────────────────────────────────────────────────────────────
  let driving = false; // the vehicles are on their way to the bend
  /** Where the bus stands from now on: at the bend, unless the student has moved it. */
  const busHere = () => (s.part === PART.SCENE || driving ? STOP.bus : s.busX);
  function settle() {
    ++token;
    for (const k of ['reveal', 'glow', 'hold', 'drive', 'pip', 'glide', 'rise']) tweener.cancel(k);
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
    draw();
    // the result holds a moment before anything else changes
    const held = await tweener.animate({ key: 'hold', duration: HOLD, ease: ease.linear }).finished;
    return held && my === token;
  }
  async function build(next, shownFrom = poseKey()) {
    const my = ++token;
    const from = shownFrom;
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
    const flight = poseKey() !== from || s.userMovedCamera ? flyCamera(FLY) : null;
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
        const up = await tweenValue('rise', 1.8, (k) => {
          if (my !== token) return;
          s.rise = k;
          draw();
        });
        if (!up || my !== token) return;
        if (!(await grow('lay', my))) return;
      } else if (next === PART.RAY) {
        if (!(await grow('path', my, RAY_TIME))) return;
        const turned2 = await tweenValue('pip', SWING, (k) => {
          if (my !== token) return;
          s.pip = k;
          stage.invalidate();
        });
        if (!turned2 || my !== token) return;
        const seen = await tweener.animate({ key: 'hold', duration: HOLD, ease: ease.linear }).finished;
        if (!seen || my !== token) return;
      } else if (next === PART.ANGLES) {
        if (!(await grow('angles', my, 1.8))) return;
      } else if (next === PART.BOTH) {
        if (!(await grow('path', my, RAY_TIME))) return;
      } else if (next === PART.COMPARE) {
        if (!(await grow('field', my, 1.8))) return;
      }
    }
    s.busy = false;
    draw();
    emitChange();
  }
  /** The step just finished, once more, slowly: from the picture before it. */
  function replay() {
    if (s.locked) return lockedNudge();
    if (s.busy || s.part === PART.SCENE) return;
    audio.unlock();
    const from = poseKey();
    const part = s.part;
    const busX = s.busX;
    settle();
    clearLabels();
    place(part - 1, busX);
    build(part, from);
  }
  function glideBus(to, seconds = 2) {
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
    if (!WORDS.includes(word) || s.busy) return; // a step that is playing plays to its end
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
    return glideBus(s.busX > 16 ? 13.5 : 18.5);
  }

  // ── the handle ─────────────────────────────────────────────────────────────────────────────────────────
  const busAt = new THREE.Vector3();
  const busHandle = createDragHandle(stage, {
    point: () => handlePoint(busAt),
    axis: 'x',
    track: { from: new THREE.Vector3().copy(TRACK.from), to: new THREE.Vector3().copy(TRACK.to) },
    label: t('l_drag'),
    aria: t('aria_bus'),
    pulse: Boolean(o.coach),
    when: () => handleOn() && camK >= 1,
  });

  // ── labels on the picture ──────────────────────────────────────────────────────────────────────────────
  let action = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, rotate.el, note, panes[0].el, panes[1].el, () => busHandle.box(), () => action?.ringBox()],
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
  const ALONG = [
    { dx: 0, dy: -30 },
    { dx: 30, dy: -30 },
    { dx: -30, dy: 30 },
    { dx: 0, dy: 30 },
    { dx: 40, dy: 22 },
  ];
  const ALONG2 = [
    { dx: -44, dy: -8 },
    { dx: -44, dy: 16 },
    { dx: 44, dy: 8 },
    { dx: 44, dy: -14 },
    { dx: 0, dy: 34 },
    { dx: -30, dy: -34 },
  ];
  const tmp = new THREE.Vector3();
  const carTop = () => tmp.set(-LANE, 1.4, s.carZ + 2.4);
  const busTop = () => tmp.set(s.busX + 3.5, 3.1, LANE);
  const HILL_POINT = V(15, terrainHeight(15, 13) + 1, 13);
  const VALLEY_FLOOR = -74;
  const mirrorTop = () => tmp.set(MIRROR.x, MIRROR.y + 0.95, MIRROR.z);
  function labels() {
    const q = s.quiz;
    const settled = camK >= 1;
    const free = !q && settled;
    const p = s.part;
    const whole = free && s.reveal >= 1;
    label('car', free && p === PART.SCENE, t('l_car'), carTop(), C.ink, UP, true, lineAvoid);
    label('bus', free && (p === PART.SCENE || p === PART.COMPARE), t('l_bus'), busTop(), C.ink, UP, true, lineAvoid);
    // the valley floor at a fixed place in the frame, so the word always lies on what it names
    const seesValley = free && p === PART.SCENE && onLevel(stage.width * 0.24, stage.height * 0.22, VALLEY_FLOOR);
    label('valley', seesValley, t('l_valley'), hit, C.ink, AT, true);
    label('hill', free && p === PART.BLOCKED, t('l_hill'), HILL_POINT, C.ink, AT, true, lineAvoid);
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
    const nameMirror = free && (p === PART.MIRROR || p === PART.COMPARE || p === PART.RAY) && s.rise > 0;
    const mirrorWord =
      p === PART.MIRROR ? t('l_mirror_a', { a: RAY_ANGLE }) : p === PART.COMPARE ? t(s.kind === 'convex' ? 'l_convex' : 'l_plane') : t('l_mirror');
    label('mirror', nameMirror, mirrorWord, mirrorTop(), C.ink, UP, false, lineAvoid);
    // the rays' names: the book's terms, on the rays themselves, once the light has run them
    const rayNames = !q && settled && (p === PART.RAY || p === PART.ANGLES) && s.reveal >= 1;
    const pr = dia.view.path;
    if (rayNames && pr) {
      const f = p === PART.ANGLES ? 3.3 : 0.5;
      const k1 = p === PART.ANGLES ? f / Math.hypot(pr.from.x - pr.p.x, pr.from.z - pr.p.z) : f;
      const k2 = p === PART.ANGLES ? f / Math.hypot(pr.to.x - pr.p.x, pr.to.z - pr.p.z) : f;
      tmp.set(pr.p.x + (pr.from.x - pr.p.x) * k1, pr.p.y + (pr.from.y - pr.p.y) * k1, pr.p.z + (pr.from.z - pr.p.z) * k1);
      label('inc', true, t('l_inc'), tmp, AMBER_TEXT, ALONG, false, lineAvoid);
      tmp.set(pr.p.x + (pr.to.x - pr.p.x) * k2, pr.p.y + (pr.to.y - pr.p.y) * k2, pr.p.z + (pr.to.z - pr.p.z) * k2);
      label('ref', true, t('l_ref'), tmp, AMBER_TEXT, ALONG2, false, lineAvoid);
    } else {
      label('inc', false);
      label('ref', false);
    }
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
    label('car2', free && p === PART.BOTH && whole, t('l_car'), carTop(), C.ink, UP.concat(LEFT), true, lineAvoid);
    label('cng', free && p === PART.COMPARE, t('l_cng'), tmp.set(CNG.x - 1.2, 1.9, CNG.z), C.ink, UP, true, lineAvoid);

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
      label(
        'normal',
        true,
        t('l_normal'),
        tmp,
        C.normal,
        DOWN.concat(RIGHT, [
          { dx: 60, dy: 34 },
          { dx: -70, dy: 40 },
        ]),
        false,
        lineAvoid,
      );
    } else {
      for (const id of ['ti', 'tr', 'normal']) label(id, false);
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
      label(`qc${i}`, Boolean(c), c ? q.letters[i] : '', c ? q.tips[i] : R0, c ? q.colors[i] : C.ink, AT, false);
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
  const wide = (w) => N(w >= 10 ? Math.round(w) : Number(w.toFixed(1)));
  /** "About 6 times smaller": to the half at most, a number that can be read off, not a measurement. */
  const timesSmaller = (m) => Math.round(2 / m) / 2;
  const measures = (kind = s.kind) => {
    const E = carEye(s.carZ);
    const convex = kind === 'convex';
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
    return t('out_compare', { p: wide(measures('plane').width), c: wide(measures('convex').width) });
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
    const on = pipOn();
    const both = two();
    panes[0].el.hidden = !both;
    panes[1].el.hidden = !on;
    if (both) {
      panes[0].title.textContent = t('l_plane');
      panes[1].title.textContent = t('l_convex');
      panes[0].note.textContent = t('win_same');
      panes[1].note.textContent = t('win_small', { k: N(timesSmaller(measures('convex').m)) });
      panes[0].el.classList.toggle('on', s.kind === 'plane');
      panes[1].el.classList.toggle('on', s.kind === 'convex');
    } else {
      panes[1].title.textContent = t(s.who === 'car' ? 'pip_car' : 'pip_bus');
      panes[1].note.textContent = s.pip >= 1 ? t('win_zoom') : '';
      panes[1].el.classList.remove('on');
    }
    panes[1].note.hidden = !panes[1].note.textContent;
    offer.hidden = !(s.part === PART.COMPARE && !s.busy && !s.quiz);
    root.dataset.offer = offer.hidden ? '0' : '1';
    const canReplay = s.part > PART.SCENE && !s.busy && !s.quiz;
    for (const b of ui.$$('[data-act="replay"]')) b.disabled = !canReplay;
    note.hidden = !(s.part === PART.BLOCKED || s.part >= PART.RAY) || Boolean(s.quiz);
    note.textContent = t(s.part === PART.COMPARE ? 'note_zoom' : 'note_rays');
    if (s.quiz) return;
    sheet.outcome(outcome());
    sheet.rule(rule());
    sheet.choose(word());
    const ph = phase();
    sheet.next(ph === 'p1' ? 'plane' : ph === 'p5' ? 'convex' : null);
    const [key, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const k2 = `${key}|${step}|${enabled}`;
    if (action && steady.act !== k2) {
      steady.act = k2;
      action.set({ label: key, step, enabled, icon });
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
      if (ph === 'p6') return busHandle.visible ? handlePoint(ringPoint) : null;
      return null;
    },
    radius: 22,
    avoid: [ui.corner, ui.hint, rotate.el, note, panes[0].el, panes[1].el, () => busHandle.box(), () => anno.boxes()],
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
    if (busHandle.hit(x, y)) return true;
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
      const level = busHandle.hit(p.x, p.y) ? 0 : 1.5;
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
      busHandle.markUsed();
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
    if (wasDrag) down = null;
    if (!down) return;
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
  const QUIZ_RAYS = ['#c2255c', '#1971c2', '#2b8a3e', '#862e9c'];
  function applyQuiz(q, E, H) {
    const v = dia.view;
    if (q.kind === 'right') {
      const p = path(E, H);
      dia.at.set(p.P.x, p.P.y, p.P.z);
      v.path = { from: H, p: p.P, to: E, k: 1, glow: 0 };
      nearArrows(v.path);
      v.normal = 1;
      v.normalLength = 2.6;
      v.arcs.push({ a0: 0, a1: q.side * 45, r: 1.95, color: C.ti, ends: 'arrows' });
      v.corner = 1;
      return;
    }
    if (q.kind === 'tilt') {
      dia.at.set(MIRROR.x, MIRROR.y, MIRROR.z);
      dia.setNormal(q.n.x, q.n.z);
      v.path = { from: V(MIRROR.x + 6.5, MIRROR.y, MIRROR.z), p: R0, to: R0, k: 0.5 };
      v.normal = 1;
      v.normalLength = 2.4;
      q.tips.forEach((tip, i) => v.rays.push({ from: R0, to: tip, color: q.colors[i], edge: '#ffffff' }));
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
      // the rays stand in order round the mirror, each its own colour with its letter at the tip
      const delta = 20;
      const sign = Math.random() < 0.5 ? 1 : -1;
      const n = turned(NORMAL, sign * delta);
      const south = { x: 0, y: 0, z: 1 };
      const inc = { x: 1, y: 0, z: 0 };
      const mid = { x: n.x + inc.x, y: 0, z: n.z + inc.z };
      const l = Math.hypot(mid.x, mid.z);
      const dir = {
        real: reflect({ x: -1, y: 0, z: 0 }, n),
        same: south,
        once: turned(south, sign * delta),
        back: { x: mid.x / l, y: 0, z: mid.z / l },
      };
      const kinds = ['real', 'same', 'once', 'back'].sort((a, b) => Math.atan2(dir[a].x, dir[a].z) - Math.atan2(dir[b].x, dir[b].z));
      const tips = kinds.map((k) => V(MIRROR.x + dir[k].x * 5.2, MIRROR.y, MIRROR.z + dir[k].z * 5.2));
      FRAMES.tilt = [...tips, V(MIRROR.x + 6.5, MIRROR.y, MIRROR.z), V(MIRROR.x - 1, 3.1, MIRROR.z - 0.8), V(MIRROR.x - 1, 0, MIRROR.z - 0.8)];
      quizScene({ kind, yaw: sign * delta, delta, n, tips, colors: QUIZ_RAYS, letters: kinds.map((_, k) => `<b>${LETTERS[k]}</b>`) });
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
      const list = ['yes', 'convex', 'one', 'high'];
      return {
        text: t('q_reverse'),
        answer: 0,
        wrong: [1, 2, 3],
        label: (k) => t(`c_rev_${list[k]}`),
        notes: notesOf([
          [1, t('n_rev_convex')],
          [2, t('n_rev_one')],
          [3, t('n_rev_high')],
        ]),
        reveal: t('a_rev'),
      };
    }
    if (kind === 'which') {
      const kindNow = Math.random() < 0.5 ? 'convex' : 'plane';
      const list = ['plane', 'convex', 'concave', 'two'];
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
    const u = [14, 18, 22][Math.floor(Math.random() * 3)];
    const fv = Math.abs(FOCAL_CONVEX);
    const v = imageDistance(u, FOCAL_CONVEX);
    const vs = N(Math.abs(v).toFixed(1));
    const sign = N(imageDistance(u, fv).toFixed(1)); // f taken as positive: the mistake
    quizScene({ kind, u }, { kind: 'convex', busX: u + MIRROR.x - BUS.eyeBack });
    const list = ['behind', 'front', 'same', 'focus'];
    return {
      text: t('q_formula', { f: fv, one: 1 }),
      answer: 0,
      wrong: [1, 2, 3],
      label: (k) => t(`c_v_${list[k]}`, { v: vs, u, f: fv, s: sign }),
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
        settle(); // a step that was playing ends first: what is kept is where it was going
        Object.assign(saved, { part: s.part, kind: s.kind, busX: s.busX });
        s.locked = true;
        order = ['right', 'tilt', 'reverse', 'which', 'formula'];
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
        flyCamera(FLY);
        draw();
      },
      async prepare(i, alive, say) {
        const from = poseKey();
        const q = prepare(i);
        qCurrent = q;
        say(q.text);
        if (poseKey() !== from || i === 0) {
          const done = await flyCamera(FLY);
          if (!alive()) return null;
          if (!done) camK = 1;
        }
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
    controls.enabled = !s.locked && !s.drag;
    controls.enableRotate = !s.locked;
    controls.enableZoom = !s.locked;
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
    if (b.dataset.offer) quiz.start();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) choose(b.dataset.example);
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
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (!grabbable()) return;
      ++token;
      tweener.cancel('glide');
      s.busX = clamp(s.busX + d, ...BUS_RANGE);
      s.moved = true;
      busHandle.markUsed();
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
      orbited: s.orbited,
      aboveGround: +(camera.position.y - terrainHeight(camera.position.x, camera.position.z)).toFixed(2),
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
      if (p.orbit) {
        // the view from a side, as a finger would turn it: az, el in degrees, from the target
        turnedByHand();
        const d = camera.position.distanceTo(controls.target);
        dirFrom(Number(p.orbit.az) || 0, clamp(Number(p.orbit.el) || 0, 2, 85), camera.position)
          .multiplyScalar(d)
          .add(controls.target);
        keepAboveGround();
        controls.update();
      }
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
