// Kaleidoscope (ক্যালাইডোস্কোপ), book p220–222, the নিজে করো with চিত্র ৮.১১ and the উদাহরণ with চিত্র ৮.১৩: the student view. Four steps,
// each one tap at a time. (1) নকশা: the real tube, cut open; the camera flies to the eye and the exact pattern fills the view; the
// student turns it and the pieces roll. (2) প্রতিফলন: the light of one red stone, traced in 3D, one, two, three reflections, each
// with its image hanging beyond the glass; then the cells numbered, in the eye's view. (3) ঘেঁষে দেখা: one strip of glass, and the
// student moves the eye: the image brightens as the eye grazes the glass. (4) দুই আয়না: the book's two mirrors at 60°.
// The panel is the kit's clean sheet. A 5-question test.
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
  aboveA,
  atB,
  brightness,
  cellAt,
  CORNERS,
  path,
  percent,
  reflect,
  shuffle,
  sixtyChoices,
  snapWedge,
  STRIP,
  stripAngle,
  stripView,
  traceWedge,
  TUBE,
  WEDGE,
  wedgeAngle,
} from './reading.js';
import { createSetting, SITES, stripWorld, wedgeWorld } from './setting.js';
import { AXIS_Y, createTube } from './tube.js';

export const DEFAULTS = {
  step: 'pattern', // 'pattern' | 'why' | 'graze' | 'two'
  stage: 0, // how far the step is built
  theta: 18, // the eye at the strip of glass, degrees
  angle: WEDGE.start, // the ray on mirror A, degrees
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  sound: true,
  shadow: true,
};

const STEPS = ['pattern', 'why', 'graze', 'two'];
const TOP = { pattern: 2, why: 4, graze: 1, two: 2 };
const { L, s: SIDE, e: EYE, r: R } = TUBE;
const X0 = -L / 2; // the open end in the world
const INK = C.ink;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const seg = (g, a, b) => clamp((g - a) / (b - a), 0, 1);
const STONE = 0; // the piece the light is traced from
/** Places for a label round its point, the ones toward a direction first (degrees on the screen, 0 right, 90 down). */
function toward(deg) {
  const out = [];
  for (const [r, step] of [
    [34, 30],
    [58, 30],
    [84, 30],
  ])
    for (let a = 0; a < 360; a += step) out.push({ a, r });
  const off = (a) => {
    const d = Math.abs(((a - deg + 540) % 360) - 180);
    return d;
  };
  return out
    .sort((p, q) => off(p.a) + p.r * 0.9 - (off(q.a) + q.r * 0.9))
    .map(({ a, r }) => ({ dx: Math.round(r * 1.25 * Math.cos((a * Math.PI) / 180)), dy: Math.round(r * 0.8 * Math.sin((a * Math.PI) / 180)) }));
}
const AT = {
  up: toward(-90),
  right: toward(-10),
  left: toward(190),
  downLeft: toward(130),
  upRight: toward(-40),
  upLeft: toward(215),
  down: toward(90),
};
const THIRD = (2 * Math.PI) / 3;
const TURN_START = 0.7; // where the turning handle starts on its ring, radians clockwise from the top
const rad = (d) => (d * Math.PI) / 180;
const TILT = { az: -44, el: 20 };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'kld');
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
  note.className = 'kld-note';
  note.hidden = true;
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const FOV = 22;
  const stage = createStage(ui.canvasHost, { fov: FOV, near: 0.4, far: 1600, environment: 'studio-light', environmentIntensity: 0.35 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  function freeTurn(free) {
    controls.minAzimuthAngle = free ? Number.NEGATIVE_INFINITY : THREE.MathUtils.degToRad(-72);
    controls.maxAzimuthAngle = free ? Number.POSITIVE_INFINITY : THREE.MathUtils.degToRad(30);
    controls.minPolarAngle = free ? 0 : THREE.MathUtils.degToRad(35);
    controls.maxPolarAngle = free ? Math.PI : THREE.MathUtils.degToRad(87);
  }
  freeTurn(false);
  const tube = createTube({ shadow: Boolean(o.shadow) });
  const setting = createSetting({ stage, shadow: Boolean(o.shadow), tube });
  const font = "'Noto Sans Bengali', sans-serif";
  const dia = createDiagram({ stage, host: ui.canvasHost, tube, font });
  const cells = tube.cells;

  // the three pictures of cells that hang beside the tube, one more reflection each: out toward the viewer, then up
  const CHAIN = [
    [SIDE / 2, R],
    [SIDE, 0],
    [1.5 * SIDE, R],
  ].map((q) => cellAt(cells, q));
  tube.setGhosts(CHAIN);

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    step: STEPS.includes(o.step) ? o.step : 'pattern',
    stage: 0,
    phi: 0, // the tube turned about its axis, radians, clockwise as the eye sees it
    turned: 0, // how far the student has turned it, degrees
    theta: clamp(Math.round(Number(o.theta) || DEFAULTS.theta), STRIP.min, STRIP.max),
    angle: snapWedge(Number(o.angle) || WEDGE.start),
    newest: 0, // the reflection growing in
    grow: 1,
    flash: 0,
    picked: null, // the cell tapped in the eye's view
    busy: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    drag: null,
    dragged: { turn: false, eye: false, lamp: false }, // a handle calms down once it has been used
  };
  s.stage = clamp(Math.round(Number(o.stage) || 0), 0, TOP[s.step]);

  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  // the pieces roll only while there is something to roll: at rest this costs nothing
  stage.addTicker((dt) => {
    if (!tube.beads.run(dt)) return false;
    tube.syncBeads();
    if (s.drag?.kind !== 'turn' && tube.beads.settled) syncNote();
    return true;
  });
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const inEye = () => (s.quiz ? s.quiz.eye : (s.step === 'pattern' && s.stage >= 1) || (s.step === 'why' && s.stage === 4));
  const phase = () => (s.busy || s.grow < 1 ? 'busy' : `${s.step[0]}${s.stage}`);
  const canTurn = () => !s.locked && !s.busy && s.step === 'pattern' && s.stage >= 1;
  const canEye = () => !s.locked && !s.busy && s.step === 'graze';
  const canLamp = () => !s.locked && !s.busy && s.step === 'two' && s.stage === 2;

  // ── the pull on the pieces, and turning ─────────────────────────────────────────────────────────────────
  function setPhi(phi) {
    s.phi = phi;
    tube.setPhi(phi);
    // the Earth's pull, seen from the turning tube
    tube.beads.pull(Math.sin(phi), -Math.cos(phi));
  }
  /** On leaving the eye: the tube looks the same after a third of a turn, so it goes to the nearest and starts afresh. */
  function squareUp(animate = true) {
    const near = Math.round(s.phi / THIRD) * THIRD;
    const settle = () => {
      tube.beads.spin(near);
      s.phi = 0;
      tube.setPhi(0);
      tube.beads.pull(0, -1);
      tube.syncBeads();
    };
    if (!animate || Math.abs(near - s.phi) < 1e-6) {
      s.phi = near;
      settle();
      return Promise.resolve(true);
    }
    const from = s.phi;
    return tweener
      .animate({
        key: 'turn',
        duration: 0.45,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          setPhi(from + (near - from) * k);
          stage.invalidate();
        },
      })
      .finished.then((ok) => {
        if (ok) {
          s.phi = near;
          settle();
        }
        return ok;
      });
  }

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  const bead = () => [tube.beads.px[STONE], tube.beads.py[STONE]];
  const toWorld = (x, u, v) => [X0 + x, AXIS_Y + v, u]; // the tube unturned
  const pt3 = (q) => toWorld(q[0], q[1], q[2]);
  const unit = (a, b) => {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l = Math.hypot(...d) || 1;
    return [d[0] / l, d[1] / l, d[2] / l];
  };
  const realCell = { verts: CORNERS, color: '#ffffff', width: 2.2, halo: 'rgba(15,20,28,0.65)' };
  /** Rays through the tube for the images built so far. */
  function drawPaths() {
    const v = dia.view;
    const n = s.stage;
    const p = bead();
    v.dots.push([...toWorld(L, p[0], p[1]), 3.4, C.ray]);
    for (let k = 1; k <= n; k++) {
      const c = CHAIN[k - 1];
      const r = path(p, c.word);
      const lit = k === s.newest ? s.flash : 0;
      const g = k === s.newest ? s.grow : 1;
      const last = r.points.length - 1;
      // the newest path whole, the older ones thin
      if (k === n) {
        v.rays.push({ points: r.points.map(pt3), k: seg(g, 0.1, 0.72), lit, width: 2.4 });
        const first = r.fromEye[0];
        const back = toWorld(first.x, first.p[0], first.p[1]);
        v.backs.push([back, toWorld(L, r.image[0], r.image[1]), seg(g, 0.74, 0.96)]);
        if (g >= 0.72) for (const h of r.hits) v.dots.push([...toWorld(h.x, h.p[0], h.p[1]), 2.6, C.ray]);
        v.eyes.push({ at: pt3(r.points[last]), look: toWorld(L / 2, 0, 0) });
      }
      if (g >= 0.74) {
        const color = C.order[k];
        v.cells.push({ verts: c.verts, color, width: 2, halo: 'rgba(255,255,255,0.8)' });
        v.rings.push({ at: r.image, r: 11, color });
      }
    }
  }
  function drawGraze() {
    const v = dia.view;
    const q = stripView(s.theta);
    const lit = 0;
    const toW = (a) => stripWorld(a[0], a[1]);
    const hit = toW(q.hit);
    const eye = toW(q.eye);
    const up = unit(hit, stripWorld(q.hit[0], 9));
    const norm = [hit, stripWorld(q.hit[0], 8.5)];
    v.normals.push(norm);
    const from = unit(hit, toW(q.bead));
    const to = unit(hit, eye);
    v.arcs.push({ at: hit, from: up, to: from, r: 2.9, color: C.thetaI }, { at: hit, from: up, to, r: 3.6, color: C.thetaR });
    // the light into the glass and on through it, thinner as more is reflected
    const through = 1 - q.reflected;
    v.rays.push({ points: [toW(q.bead), hit], width: 5, lit });
    v.rays.push({ points: [hit, eye], width: Math.max(0.9, 5 * q.reflected), lit });
    v.rays.push({ points: [hit, toW(q.back), toW(q.away)], width: Math.max(0.9, 5 * through), lit });
    v.backs.push([hit, toW(q.image), 1]);
    v.dots.push([...hit, 2.8, C.ray]);
    v.eyes.push({ at: eye, look: hit });
    if (!s.quiz && canEye()) v.grip = lineGrip(gripOnStrip, s.theta, STRIP.min, STRIP.max, s.dragged.eye);
  }
  /** The ray between the mirrors, as far as `upto` hits; arcs and normals at A and at B. */
  function drawWedge(theta, stageN, g) {
    const v = dia.view;
    const r = traceWedge(theta);
    const pts = r.points.map((q) => wedgeWorld(q[0], q[1]));
    const a = r.hits[0];
    const A = pts[1];
    // the corner of the two mirrors
    const V = wedgeWorld(0, 0);
    v.arcs.push({ at: V, from: unit(V, wedgeWorld(-5, 0)), to: unit(V, wedgeWorld(-2.5, 4.33)), r: 2.2, color: INK });
    if (stageN < 1) return;
    v.normals.push([A, wedgeWorld(a.point[0], 7)]);
    const up = unit(A, wedgeWorld(a.point[0], a.point[1] + 5));
    const inward = unit(A, pts[0]);
    const out = unit(A, pts[2]);
    v.arcs.push({ at: A, from: up, to: inward, r: 2.5, color: C.thetaI }, { at: A, from: up, to: out, r: 3, color: C.thetaR });
    v.arcs.push({ at: A, from: out, to: unit(A, V), r: 1.9, color: INK });
    v.rays.push({ points: stageN >= 2 ? pts : pts.slice(0, 3), k: g, lit: s.flash, width: 2.5 });
    const b = r.hits[1];
    if (b?.mirror === 'B' && g >= 1) {
      const B = pts[2];
      const n = [-Math.sqrt(3) / 2, -0.5];
      v.normals.push([B, wedgeWorld(b.point[0] + n[0] * 5, b.point[1] + n[1] * 5)]);
      v.dots.push([...B, 2.8, C.ray]);
    }
    v.dots.push([...A, 2.8, C.ray]);
  }
  function applyWorld() {
    dia.clear();
    const v = dia.view;
    setting.setImage(s.quiz?.kind === 'graze' ? 0.3 : stripView(s.theta).reflected);
    setting.setLamp(s.quiz?.kind === 'sixty' ? s.quiz.theta : s.angle);
    tube.showGhosts(!s.quiz && s.step === 'why' && s.stage <= 3 ? (s.newest && s.grow < 0.74 ? s.stage - 1 : s.stage) : 0);
    if (s.quiz) return applyQuiz(s.quiz);
    if (s.step === 'pattern' && s.stage >= 1) {
      v.cells.push(realCell);
      if (canTurn()) v.grip = { turn: true, angle: TURN_START + s.phi, small: s.dragged.turn };
    }
    if (s.step === 'why') {
      if (s.stage <= 3) drawPaths();
      else {
        v.cells.push(realCell);
        for (const c of numbered) v.cells.push(c.line);
        for (const c of numbered) if (c.chip) v.chips.push(c.chip);
        if (s.picked) v.cells.push({ verts: s.picked.verts, color: C.glow, width: 3, halo: 'rgba(15,20,28,0.7)' });
      }
    }
    if (s.step === 'graze') drawGraze();
    if (s.step === 'two') {
      drawWedge(s.angle, s.stage, s.stage === 1 && s.grow < 1 ? s.grow : 1);
      if (canLamp()) v.grip = lineGrip(gripOnWedge, s.angle, WEDGE.min, WEDGE.max, s.dragged.lamp);
    }
  }
  // what the student drags, at each whole degree it can reach (made once)
  const gripOnStrip = (th) => {
    const q = stripView(th);
    return stripWorld(q.eye[0] + 1.9 * Math.sin(rad(th)), q.eye[1] + 1.9 * Math.cos(rad(th)));
  };
  const gripOnWedge = (th) => wedgeWorld(...sourceHandle(th));
  const tracks = new Map();
  /** A handle moving along a path of world points: the dashed track of its whole range, and where it is. */
  function lineGrip(fn, value, min, max, used) {
    if (!tracks.has(fn)) {
      const path = [];
      for (let a = min; a <= max; a += 4) path.push(fn(a));
      path.push(fn(max));
      tracks.set(fn, path);
    }
    return { path: tracks.get(fn), at: fn(value), prev: fn(Math.max(min, value - 2)), next: fn(Math.min(max, value + 2)), small: used };
  }
  /** The handle on the ray box, a little behind it. */
  function sourceHandle(theta) {
    const a = rad(theta);
    const d = WEDGE.source + 3.5;
    return [-WEDGE.hit - d * Math.sin(a), d * Math.cos(a)];
  }
  // the cells up to three reflections, with their numbers (made once)
  const numbered = cells
    .filter((c) => c.n >= 1 && c.n <= 4)
    .map((c) => ({
      cell: c,
      line: { verts: c.verts, color: 'rgba(255,255,255,0.75)', width: 1.1 },
      chip: c.n <= 3 ? { tube: true, at: c.centre, text: t.num(c.n), color: C.order[c.n], r: 11 } : null,
    }));

  // ── camera: each step frames what it is about, and flies there smoothly ────────────────────────────────
  const FRAMES = {
    pattern: { box: [X0 - 2, 0, -3, -X0 + 1, 4.8, 3.2], az: -42, el: 17 },
    why0: { box: [X0 - 2.6, 0, -3, -X0 + 0.6, 5, 3.4], ...TILT },
    why1: { box: [X0 - 2.6, 0, -3, -X0 + 0.6, 5.2, 4.8], ...TILT },
    why2: { box: [X0 - 2.6, 0, -3, -X0 + 0.6, 5.2, 6.6], ...TILT },
    why3: { box: [X0 - 2.6, 0, -3, -X0 + 0.6, 5.6, 8.8], ...TILT },
    graze: { box: [SITES.strip - 9.2, 0, -1.8, SITES.strip + 12.8, 5.2, 10.2], az: -12, el: 52 },
    two: { box: wedgeBox(), az: 4, el: 70 },
  };
  /** All that the two-mirror view must show: the mirrors and the ray box anywhere on its arc. */
  function wedgeBox() {
    const b = [1e9, 0, 1e9, -1e9, 6.2, -1e9];
    const take = (a, q) => {
      const w = wedgeWorld(a, q);
      b[0] = Math.min(b[0], w[0]);
      b[2] = Math.min(b[2], w[2]);
      b[3] = Math.max(b[3], w[0]);
      b[5] = Math.max(b[5], w[2]);
    };
    take(0, 0);
    take(-WEDGE.arm, 0);
    take(-WEDGE.arm / 2, (WEDGE.arm * Math.sqrt(3)) / 2);
    for (const th of [WEDGE.min, 40, WEDGE.start, WEDGE.max]) take(...sourceHandle(th));
    return b;
  }
  function frameKey() {
    if (s.quiz) return s.quiz.eye ? 'eye' : s.quiz.kind === 'graze' ? 'graze' : 'two';
    if (inEye()) return 'eye';
    if (s.step === 'why') return `why${Math.max(0, s.stage)}`;
    return s.step;
  }
  let camFrom = null;
  let camK = 1;
  let shownFrame = '';
  let eyeFrom = 0;
  const FRAME = new THREE.Box3();
  const margin = { top: 34, bottom: 26, left: 8, right: 8 };
  const camDir = new THREE.Vector3();
  const eyePose = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 40 };
  const panelBeside = () => root.clientWidth >= root.clientHeight && root.clientWidth >= 600;
  /** How large a cell is on the screen, px of its side: big enough to read, and the window always fills the view. */
  const cellPx = () => Math.max(Math.min(stage.width, stage.height) / 3.2, Math.max(stage.width, stage.height) / 5);
  function eyeFov() {
    const distance = L + EYE;
    return 2 * THREE.MathUtils.radToDeg(Math.atan(((stage.height / 2 / cellPx()) * SIDE) / distance));
  }
  function poseNow() {
    const key = frameKey();
    if (key === 'eye') {
      eyePose.position.set(X0 - EYE, AXIS_Y, 0);
      eyePose.target.set(-X0, AXIS_Y, 0);
      eyePose.fov = eyeFov();
      FRAME.min.set(X0, 0, -4);
      FRAME.max.set(-X0, 0, 4);
      return eyePose;
    }
    const f = FRAMES[key];
    const a = THREE.MathUtils.degToRad(f.az);
    const e = THREE.MathUtils.degToRad(f.el);
    camDir.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
    FRAME.min.set(f.box[0], f.box[1], f.box[2]);
    FRAME.max.set(f.box[3], f.box[4], f.box[5]);
    margin.top = 38;
    margin.right = panelBeside() ? 34 : 8;
    margin.left = 8;
    margin.bottom = 28;
    const pose = fitPose({ box: FRAME, dir: camDir, camera: { fov: FOV }, width: stage.width, height: stage.height, margin });
    pose.fov = FOV;
    return pose;
  }
  function setFov(fov) {
    if (Math.abs(camera.fov - fov) < 1e-3) return;
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  function applyCamera() {
    const eyeNow = frameKey() === 'eye' ? 1 : 0;
    if (s.userMovedCamera && !eyeNow) {
      freeTurn(false);
      tube.setPeek(0);
      return;
    }
    const pz = poseNow();
    const flying = camK < 1 && camFrom;
    freeTurn(flying || eyeNow === 1);
    if (flying) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, pz.position, k);
      controls.target.lerpVectors(camFrom.target, pz.target, k);
      setFov(camFrom.fov + (pz.fov - camFrom.fov) * k);
      tube.setPeek(eyeFrom + (eyeNow - eyeFrom) * k);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
      setFov(pz.fov);
      tube.setPeek(eyeNow);
    }
    controls.update();
  }
  function flyCamera(duration = 0.9) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      s.view = 'front';
      syncUI();
    }
    eyeFrom = tube.peek;
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
    const key = frameKey();
    if (key === shownFrame) return;
    const first = !shownFrame;
    const toOrFromEye = key === 'eye' || shownFrame === 'eye';
    shownFrame = key;
    setting.setSite(
      s.quiz
        ? s.quiz.kind === 'graze'
          ? SITES.strip
          : s.quiz.kind === 'sixty'
            ? SITES.two
            : SITES.tube
        : ({ graze: SITES.strip, two: SITES.two }[s.step] ?? SITES.tube),
    );
    if (first || instant) {
      tweener.cancel('camera');
      camK = 1;
    } else flyCamera(toOrFromEye ? 1.5 : duration);
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
    setting.setFloorFade(camera, FRAME);
    tube.renderCell(stage.renderer, rtSize());
    dia.view.hide = camK < 1;
    labels();
  });
  /** The small picture: a power of two, about as sharp as a cell on this screen, at most 1024. */
  function rtSize() {
    return cellPx() * stage.pixelRatio > 300 ? 1024 : 512;
  }

  // ── moving on ─────────────────────────────────────────────────────────────────────────────────────────
  function stopMotion() {
    ++token;
    for (const k of ['turn', 'reveal', 'flash', 'angle']) tweener.cancel(k);
    s.busy = false;
    s.grow = 1;
    s.flash = 0;
    s.newest = 0;
  }
  function go(step, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (!STEPS.includes(step)) return;
    const wasEye = inEye();
    stopMotion();
    s.picked = null;
    const change = () => {
      s.step = step;
      s.stage = 0;
      clearLabels();
      draw({ instant: !animate });
      emitChange();
    };
    if (wasEye && animate) {
      const my = token;
      s.busy = true;
      draw();
      squareUp(true).then(() => {
        if (my !== token) return;
        s.busy = false;
        change();
      });
      return;
    }
    squareUp(false);
    change();
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
  /** The next thing grows in, highlighted, while the camera makes room for it. */
  function reveal(n, duration = 2.1) {
    const my = ++token;
    tweener.cancel('flash');
    s.newest = n;
    s.flash = 1;
    s.grow = 0;
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
        audio.success();
        draw();
        emitChange();
        fadeLit();
      });
  }
  /** A demonstration of a turn or a slide, then the next stage. */
  function turnDemo() {
    const my = ++token;
    s.busy = true;
    const from = s.phi;
    const to = from + THIRD;
    draw();
    tweener
      .animate({
        key: 'turn',
        duration: 2.4,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          setPhi(from + (to - from) * k);
          s.turned = Math.round(120 * k);
          stage.invalidate();
        },
      })
      .finished.then((ok) => {
        if (!ok || my !== token) return;
        s.busy = false;
        s.stage = 2;
        audio.success();
        draw();
        emitChange();
      });
  }
  function grazeDemo() {
    const my = ++token;
    s.busy = true;
    const from = s.theta;
    const to = 83;
    draw();
    tweener
      .animate({
        key: 'turn',
        duration: 2.6,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          s.theta = Math.round(from + (to - from) * k);
          draw();
        },
      })
      .finished.then((ok) => {
        if (!ok || my !== token) return;
        s.busy = false;
        s.stage = 1;
        audio.success();
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
    if (ph === 'p0') {
      s.stage = 1;
      s.turned = 0;
      draw({ duration: 1.5 });
      return emitChange();
    }
    if (ph === 'p1') return turnDemo();
    if (ph === 'p2') return go('why');
    if (ph === 'w0' || ph === 'w1' || ph === 'w2') {
      s.stage += 1;
      return reveal(s.stage);
    }
    if (ph === 'w3') {
      s.stage = 4;
      s.newest = 0;
      draw({ duration: 1.5 });
      return emitChange();
    }
    if (ph === 'w4') return go('graze');
    if (ph === 'g0') return grazeDemo();
    if (ph === 'g1') return go('two');
    if (ph === 't0') {
      const my = ++token;
      s.angle = WEDGE.start;
      s.stage = 1;
      s.grow = 0;
      s.flash = 1;
      audio.tick();
      draw();
      tweener
        .animate({
          key: 'reveal',
          duration: 1.5,
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
          audio.success();
          draw();
          emitChange();
          fadeLit();
        });
      return;
    }
    if (ph === 't1') {
      s.stage = 2;
      audio.tick();
      draw();
      emitChange();
      return fadeLit();
    }
    if (ph === 't2') quiz.start();
  }

  // ── labels on the picture: pinned to what they name ────────────────────────────────────────────────────
  let action = null;
  const panelTab = ui.$('.pvc-panel-toggle');
  // the part of the handle that moves by itself: a gentle ring and the first-time word, in the page, so that a figure at rest
  // draws nothing (the disc itself is on the drawing, so that it is in every picture)
  const gripEl = document.createElement('div');
  gripEl.className = 'kld-grip';
  gripEl.hidden = true;
  gripEl.innerHTML = '<i class="kld-grip-pulse"></i><span class="kld-grip-tag"></span>';
  ui.stage.appendChild(gripEl);
  const gripTag = gripEl.querySelector('.kld-grip-tag');
  const gripWas = { x: 0, y: 0, on: false, word: '', low: false };
  const gripWord = () => {
    if (s.step === 'pattern' && !s.dragged.turn) return t('l_turn');
    if (s.step === 'graze' && !s.dragged.eye) return t('l_drag');
    if (s.step === 'two' && !s.dragged.lamp) return t('l_drag');
    return '';
  };
  function syncGrip() {
    const p = dia.handles.knob;
    const on = Boolean(p) && camK >= 1;
    if (on !== gripWas.on) {
      gripWas.on = on;
      gripEl.hidden = !on;
      stage.invalidate(); // the labels were placed before the handle was known: once more, keeping off it
    }
    if (!on) return;
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    if (x !== gripWas.x || y !== gripWas.y) {
      gripWas.x = x;
      gripWas.y = y;
      gripEl.style.transform = `translate(${x}px, ${y}px)`;
    }
    const low = y < stage.height - 56; // the word goes under the disc, clear of what it moves, unless the view ends there
    const word = s.drag ? '' : gripWord();
    if (word !== gripWas.word || low !== gripWas.low) {
      gripWas.word = word;
      gripWas.low = low;
      gripTag.textContent = word;
      gripEl.classList.toggle('fresh', Boolean(word) && Boolean(o.coach));
      gripEl.classList.toggle('low', low);
      gripTag.hidden = !word;
    }
  }
  stage.onAfterRender(syncGrip);
  const knobBox = () => {
    const p = dia.handles.knob;
    if (!p) return [];
    const out = [{ left: p.x - 22, top: p.y - 22, right: p.x + 22, bottom: p.y + 22 }];
    if (gripWas.word)
      out.push({ left: p.x - 42, top: gripWas.low ? p.y + 18 : p.y - 46, right: p.x + 42, bottom: gripWas.low ? p.y + 46 : p.y - 18 });
    return out;
  };
  const trackBoxes = () => dia.handles.track;
  const onScreen = new THREE.Vector3();
  /** Small boxes along the rays drawn now, in canvas pixels: labels keep off them. */
  function rayBoxes() {
    const out = [];
    for (const r of dia.view.rays) {
      const p = r.points;
      for (let i = 1; i < p.length; i++)
        for (let q = 0; q <= 8; q++) {
          const k = q / 8;
          onScreen
            .set(p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k, p[i - 1][2] + (p[i][2] - p[i - 1][2]) * k)
            .project(camera);
          const x = ((onScreen.x + 1) / 2) * stage.width;
          const y = ((1 - onScreen.y) / 2) * stage.height;
          out.push({ left: x - 5, top: y - 5, right: x + 5, bottom: y + 5 });
        }
    }
    return out;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, panelTab, knobBox, trackBoxes, rayBoxes, () => action?.ringBox()],
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
  const v3 = new THREE.Vector3();
  const at = (x, y, z) => v3.set(x, y, z);
  const atTube = (x, u, v) => v3.set(x, v, u).applyMatrix4(tube.root.matrixWorld);
  const ABOVE = [
    { dx: 0, dy: -28 },
    { dx: 30, dy: -28 },
    { dx: -30, dy: -28 },
    { dx: 0, dy: -46 },
  ];
  const BELOW = [
    { dx: 0, dy: 28 },
    { dx: 30, dy: 26 },
    { dx: -30, dy: 26 },
    { dx: 0, dy: 44 },
  ];
  const AROUND = [
    { dx: 0, dy: -26 },
    { dx: 44, dy: -14 },
    { dx: -44, dy: -14 },
    { dx: 44, dy: 14 },
    { dx: -44, dy: 14 },
    { dx: 0, dy: 28 },
  ];
  const FAR_UP = [
    { dx: -24, dy: -40 },
    { dx: 24, dy: -40 },
    { dx: 0, dy: -62 },
    { dx: -46, dy: -24 },
  ];
  function labels() {
    touched.clear();
    const settled = camK >= 1;
    if (settled) {
      if (s.quiz) quizLabels(s.quiz);
      else if (s.step === 'pattern' && s.stage === 0) {
        label('glass', t('l_glass'), atTube(L * 0.62, SIDE * 0.25, R * 0.5), INK, ABOVE);
        label('pieces', t('l_pieces'), atTube(L, 0, R * 1.3), INK, FAR_UP);
        label('paper', t('l_paper'), atTube(L, SIDE / 2, -R), INK, BELOW);
        label('wrap', t('l_wrap'), atTube(L * 0.14, -SIDE * 0.25, R * 0.55), INK, ABOVE);
      } else if (inEye() && s.step === 'pattern') {
        label('real', t('l_real'), atTube(L, 0, R * 2), INK, AT.up); // from its top corner: the name stays off the cell it names
        label('image', t('l_image'), atTube(L, -SIDE, R * 2.4), INK, AROUND);
      } else if (s.step === 'why' && s.stage <= 3) {
        const p = bead();
        label('stone', t('l_stone'), atTube(L, p[0], p[1]), INK, BELOW);
        if (s.stage >= 1 && !(s.newest && s.grow < 0.72)) {
          const r = path(p, CHAIN[s.stage - 1].word);
          label('eye', t('l_eye'), atTube(-EYE, 0, 0), INK, BELOW);
          if (!(s.newest && s.grow < 0.96)) {
            const lit = s.newest && s.flash > 0;
            const text = t('l_times', { n: s.stage });
            label('times', lit ? `<span class="kld-new">${text}</span>` : text, atTube(L, r.image[0], r.image[1]), C.order[s.stage], AROUND);
          }
        }
      } else if (s.step === 'graze') {
        const q = stripView(s.theta);
        const w = (a, b, y) => at(...stripWorld(a, b, y));
        label('strip', t('l_glass'), w(STRIP.half * 0.6, 0, 5.4), INK, AT.up);
        label('bead', t('l_bead'), w(q.bead[0], q.bead[1], STRIP.ray + 0.5), INK, AT.downLeft);
        label('image', t('l_image'), w(q.image[0], q.image[1], STRIP.ray + 0.5), INK, AT.upLeft);
        label('normal', t('l_normal'), w(q.hit[0], 8.3), '#343a40', AT.down);
        label('ti', `θ<sub>i</sub> = ${N(s.theta)}°`, w(q.hit[0], 3), C.thetaI, AT.right);
        label('eye', t('l_eye'), w(q.eye[0], q.eye[1]), INK, AT.upRight, [], true); // the eye is drawn: its name may step aside
      } else if (s.step === 'two') wedgeLabels(s.angle, s.stage);
    }
    for (const id of [...shown.keys()])
      if (!touched.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
  }
  function wedgeLabels(theta, st) {
    const w = (a, b, y = WEDGE.ray) => at(...wedgeWorld(a, b, y));
    const r = traceWedge(theta);
    label('ma', t('l_mirror_a'), w(-WEDGE.arm * 0.9, 0, 5.6), INK, AT.right);
    label('mb', t('l_mirror_b'), w(-WEDGE.arm * 0.45, WEDGE.arm * 0.78, 5.6), INK, AT.left);
    label('tw', `${N(60)}°`, w(-1.7, 1.3), INK, AT.up);
    if (st >= 1) {
      const a = r.hits[0].point;
      label('ti', `θ<sub>i</sub> = ${N(theta)}°`, w(a[0] - 2.2, 3.4), C.thetaI, AT.downLeft);
      label('tr', `θ<sub>r</sub> = ${N(theta)}°`, w(a[0] + 2.2, 3.4), C.thetaR, AT.left);
      label('up', `${N(aboveA(theta))}°`, w(a[0] + 4, 0.9), INK, AT.upRight);
      if (r.hits[1]?.mirror === 'B') {
        const b = r.hits[1].point;
        label('tb', atB(theta) === 0 ? `${N(90)}°` : `${N(atB(theta))}°`, w(b[0] - 0.8, b[1] - 1.5), atB(theta) === 0 ? INK : C.thetaI, AT.upLeft);
      }
    }
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  const counts = [0, 1, 2, 3].map((n) => cells.filter((c) => c.n === n).length);
  function outcome() {
    if (s.step === 'pattern') {
      if (s.stage === 0) return t('out_p0');
      if (s.stage === 1 && s.turned === 0) return t('out_p1', { a: tube.beads.count });
      return t('out_p2', { a: Math.abs(Math.round(s.turned)) });
    }
    if (s.step === 'why') {
      if (s.stage === 0) return t('out_w0');
      if (s.stage <= 3) return t('out_times', { n: s.stage });
      if (s.picked) {
        if (s.picked.n === 0) return t('out_real');
        return t('out_cell', { n: s.picked.n });
      }
      return t('out_w4', { a: counts[1], b: counts[2], c: counts[3] });
    }
    if (s.step === 'graze') return t('out_g', { a: s.theta, b: percent(s.theta) });
    if (s.stage === 0) return t('out_t0', { a: 60 });
    if (s.stage === 1) return t('out_t1', { a: s.angle });
    return t(atB(s.angle) === 0 ? 'out_t2' : 'out_t3', { a: atB(s.angle) });
  }
  const tubeAngle = () => Math.round((Math.acos((2 * R) / Math.hypot(L + EYE, 2 * R)) * 180) / Math.PI);
  function rule() {
    if (s.step === 'pattern') return t(`rule_p${s.stage === 1 && s.turned ? 2 : s.stage}`);
    if (s.step === 'why') return t(`rule_w${s.stage}`);
    if (s.step === 'graze') return t(`rule_g${s.stage}`, { a: tubeAngle() });
    if (s.stage === 0) return t('rule_t0', { a: s.angle });
    if (s.stage === 1) return t('rule_t1', { b: aboveA(s.angle), c: 60, d: 90 });
    return t(atB(s.angle) === 0 ? 'rule_t2' : 'rule_t3', { a: 60 });
  }
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    p0: ['act_look', 1, ICONS.hand],
    p1: ['act_turn', 2, ICONS.drag],
    p2: ['act_to_why', '', ICONS.chevR],
    w0: ['act_w1', 1, ICONS.hand],
    w1: ['act_w2', 2, ICONS.hand],
    w2: ['act_w3', 3, ICONS.hand],
    w3: ['act_w4', 4, ICONS.hand],
    w4: ['act_to_graze', '', ICONS.chevR],
    g0: ['act_graze', 1, ICONS.drag],
    g1: ['act_to_two', '', ICONS.chevR],
    t0: ['act_shine', 1, ICONS.hand],
    t1: ['act_back', 2, ICONS.hand],
    t2: ['act_quiz', '', ICONS.chevR],
  };
  function syncNote() {
    const slow = s.step === 'pattern' && s.stage >= 1;
    const rays = s.step === 'why' && s.stage >= 1 && s.stage <= 3;
    note.hidden = !(slow || rays) || Boolean(s.quiz);
    note.textContent = rays ? t('note_rays') : t('note_slow');
  }
  function panel() {
    if (s.quiz) return;
    const ph = phase();
    sheet.outcome(outcome());
    sheet.rule(rule());
    sheet.choose(s.step);
    sheet.next({ p2: 'why', w4: 'graze', g1: 'two' }[ph] ?? null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    syncNote();
  }
  function draw({ instant = false, duration = 0.9 } = {}) {
    applyWorld();
    panel();
    followFrame(instant, duration);
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  const ringPoint = new THREE.Vector3();
  function actionSpot() {
    if (s.locked || camK < 1) return null;
    const ph = phase();
    if (ph === 'p0') return ringPoint.set(X0, AXIS_Y, 0);
    if (ph === 't0') return ringPoint.set(...wedgeWorld(...sourceHandle(s.angle)));
    if (ph === 'w0') return ringPoint.copy(atTube(L, bead()[0], bead()[1]));
    return null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_look',
    target: actionSpot,
    radius: 22,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── touching the 3D ─────────────────────────────────────────────────────────────────────────────────────
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const ndc = new THREE.Vector3();
  const rayDir = new THREE.Vector3();
  /** Where a finger's line of sight meets a level plane, in the world. */
  function onPlane(x, y, height) {
    ndc.set((x / stage.width) * 2 - 1, 1 - (y / stage.height) * 2, 0.5).unproject(camera);
    rayDir.copy(ndc).sub(camera.position);
    const k = (height - camera.position.y) / rayDir.y;
    return [camera.position.x + rayDir.x * k, camera.position.z + rayDir.z * k];
  }
  /** The cell under a finger, in the eye's view. */
  function cellUnder(x, y) {
    ndc.set((x / stage.width) * 2 - 1, 1 - (y / stage.height) * 2, 0.5).unproject(camera);
    rayDir.copy(ndc).sub(camera.position);
    const f = (L + EYE) / rayDir.x;
    return cellAt(cells, [rayDir.z * f, rayDir.y * f]);
  }
  const screenAngle = (p) => Math.atan2(p.y - stage.height / 2, p.x - stage.width / 2);
  function startDrag(kind, e, p) {
    controls.enabled = false;
    capturePointer(ui.canvasHost, e.pointerId);
    s.drag = { kind, id: e.pointerId, a: screenAngle(p), moved: 0, x: p.x, y: p.y };
    action.hide('drag');
    audio.unlock();
    emit('dragstart', { part: kind });
    e.preventDefault();
  }
  let tap = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      const p = hostXY(e);
      tap = { x: p.x, y: p.y, id: e.pointerId, at: performance.now() };
      const k = dia.handles.knob;
      const reach = e.pointerType === 'touch' ? 36 : 26;
      if (canEye() && k && Math.hypot(k.x - p.x, k.y - p.y) <= reach) return startDrag('eye', e, p);
      if (canLamp() && k && Math.hypot(k.x - p.x, k.y - p.y) <= reach) return startDrag('lamp', e, p);
      if (canTurn()) startDrag('turn', e, p);
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    g.moved = Math.max(g.moved, Math.hypot(p.x - g.x, p.y - g.y));
    if (g.kind === 'turn') {
      const a = screenAngle(p);
      let d = a - g.a;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      g.a = a;
      setPhi(s.phi + d);
      s.turned += THREE.MathUtils.radToDeg(d);
      if (Math.abs(s.turned) > 720) s.turned = 720 * Math.sign(s.turned);
      draw();
      return;
    }
    if (g.kind === 'eye') {
      const w = onPlane(p.x, p.y, STRIP.ray);
      const next = stripAngle(w[0] - SITES.strip, w[1]);
      if (next !== s.theta) {
        s.theta = next;
        if (s.stage === 0 && next >= 70) s.stage = 1;
        draw();
        emitChange();
      }
      return;
    }
    const w = onPlane(p.x, p.y, WEDGE.ray);
    const q = planeOf(w[0], w[1]);
    const next = wedgeAngle(q[0], q[1]);
    if (next !== s.angle) {
      s.angle = next;
      draw();
      emitChange();
    }
  });
  /** World x, z to the wedge's plane. */
  function planeOf(x, z) {
    const o0 = wedgeWorld(0, 0);
    const a1 = wedgeWorld(1, 0);
    const b1 = wedgeWorld(0, 1);
    const ax = [a1[0] - o0[0], a1[2] - o0[2]];
    const bx = [b1[0] - o0[0], b1[2] - o0[2]];
    const d = [x - o0[0], z - o0[2]];
    return [d[0] * ax[0] + d[1] * ax[1], d[0] * bx[0] + d[1] * bx[1]];
  }
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked && !inEye();
    action.show('drag');
    emit('dragend', { part: g.kind });
    if (g.moved >= 8) s.dragged[g.kind] = true;
    if (g.kind === 'turn' && Math.abs(s.turned) >= 20) s.stage = 2;
    draw();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const wasDrag = s.drag && s.drag.moved >= 8;
    endDrag(e);
    const p = hostXY(e);
    const q = tap;
    tap = null;
    if (wasDrag || !q || q.id !== e.pointerId) return;
    if (Math.hypot(p.x - q.x, p.y - q.y) > 8 || performance.now() - q.at > 500) return;
    if (s.locked || s.busy || s.grow < 1) return;
    const ring = actionSpot();
    if (ring) {
      ptr.copy(ring).project(camera);
      const cx = ((ptr.x + 1) / 2) * stage.width;
      const cy = ((1 - ptr.y) / 2) * stage.height;
      if (Math.hypot(cx - p.x, cy - p.y) <= 32) return act();
    }
    if (s.step === 'why' && s.stage === 4) {
      const c = cellUnder(p.x, p.y);
      if (c) {
        audio.tick();
        s.picked = s.picked === c ? null : c;
        draw();
        emitChange();
      }
    }
  });
  const ptr = new THREE.Vector3();
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  function applyQuiz(q) {
    const v = dia.view;
    if (q.eye) {
      v.cells.push(realCell);
      for (const c of q.lines ?? []) v.cells.push(c);
      for (const c of q.chips ?? []) v.chips.push(c);
      for (const c of q.rings ?? []) v.rings.push(c);
      return;
    }
    if (q.kind === 'graze') {
      for (const m of q.eyes) {
        const e = stripView(m.theta);
        v.eyes.push({ at: stripWorld(e.eye[0], e.eye[1]), look: stripWorld(e.hit[0], 0) });
      }
      return;
    }
    if (q.kind === 'sixty') {
      drawWedge(q.theta, 1, 1);
      v.rays[0].points = v.rays[0].points.slice(0, 3);
    }
  }
  function quizLabels(q) {
    if (q.kind === 'graze') {
      for (const m of q.eyes) {
        const e = stripView(m.theta);
        label(m.id, `<b>${m.letter}</b>`, at(...stripWorld(e.eye[0], e.eye[1])), INK, AROUND);
      }
      const b = stripView(30);
      label('bead', t('l_bead'), at(...stripWorld(b.bead[0], b.bead[1], STRIP.ray + 0.5)), INK, BELOW);
      label('image', t('l_image'), at(...stripWorld(b.image[0], b.image[1], STRIP.ray + 0.5)), INK, ABOVE);
    }
    if (q.kind === 'sixty') {
      const r = traceWedge(q.theta);
      const a = r.hits[0].point;
      const w = (x, y, h = WEDGE.ray) => at(...wedgeWorld(x, y, h));
      label('ma', t('l_mirror_a'), w(-WEDGE.arm * 0.9, 0, 5.6), INK, ABOVE);
      label('mb', t('l_mirror_b'), w(-WEDGE.arm * 0.45, WEDGE.arm * 0.78, 5.6), INK, ABOVE);
      label('tw', `${N(60)}°`, w(-1.7, 1.3), INK, AROUND);
      label('ti', `θ<sub>i</sub> = ${N(q.theta)}°`, w(a[0] - 2.2, 3.4), C.thetaI, AROUND);
      const b = r.hits[1].point;
      label('tb', '?', w(b[0] - 0.8, b[1] - 1.5), C.thetaI, AROUND);
    }
  }
  function quizScene(q) {
    stopMotion();
    squareUp(false);
    s.quiz = q;
    s.picked = null;
    clearLabels();
    applyWorld();
    syncNote();
    shownFrame = frameKey();
    setting.setSite(q.kind === 'graze' ? SITES.strip : q.kind === 'sixty' ? SITES.two : SITES.tube);
    stage.invalidate();
  }
  // the kit's quiz compares numbers: every choice here is a number, and a choice's note is found by that number
  const notesOf = (pairs) => new Map(pairs.map(([v, html]) => [String(v), html]));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const letters = t('letters').split(',');
  let order = [];
  let qCurrent = null;
  const thin = (list) => list.map((c) => ({ verts: c.verts, color: 'rgba(255,255,255,0.8)', width: 1.2 }));
  function prepare(i) {
    const kind = order[i];
    if (kind === 'count') {
      const n = pick([2, 3, 4]);
      const c = pick(cells.filter((x) => x.n === n && Math.hypot(...x.centre) < 8));
      quizScene({
        kind,
        eye: true,
        lines: [...thin(cells.filter((x) => x.n >= 1 && x.n <= 5)), { verts: c.verts, color: C.glow, width: 3, halo: 'rgba(15,20,28,0.7)' }],
        chips: [{ tube: true, at: c.centre, text: t('l_q'), color: INK, r: 12 }],
        cell: c,
      });
      const wrong = [n - 1, n + 1, n + 2];
      return {
        text: t('q_cells'),
        answer: n,
        wrong,
        label: (a) => t('c_times', { a }),
        notes: notesOf(wrong.map((a) => [a, t(a < n ? 'n_count_less' : 'n_count_more')])),
        reveal: t('a_count', { a: n }),
      };
    }
    if (kind === 'spot') {
      // the piece and the strip that leave the marks clearly apart: far from that strip, and well off its middle
      const WALL = [
        [0, -1],
        [Math.sqrt(3) / 2, 0.5],
        [-Math.sqrt(3) / 2, 0.5],
      ];
      let best = { score: -1 };
      for (let i = 0; i < tube.beads.count; i++) {
        const p = [tube.beads.px[i], tube.beads.py[i]];
        for (let j = 0; j < 3; j++) {
          const n = WALL[j];
          const d = R - (p[0] * n[0] + p[1] * n[1]);
          const off = Math.abs(p[0] * -n[1] + p[1] * n[0]);
          const score = Math.min(d, 1.4) * Math.min(off, 0.9) + Math.random() * 0.05;
          if (score > best.score) best = { score, p, j, n, d };
        }
      }
      const { p, j, n, d } = best;
      const image = reflect(p, j);
      const wallAt = [p[0] + n[0] * d, p[1] + n[1] * d];
      const along = [wallAt[0] * 2 - R * n[0] * 2, wallAt[1] * 2 - R * n[1] * 2]; // from the piece's foot to its far side of the edge's middle
      const marks = shuffle([
        { at: image, v: 'right' },
        { at: [image[0] - along[0], image[1] - along[1]], v: 'turn' },
        { at: [wallAt[0] + n[0] * d * 0.3, wallAt[1] + n[1] * d * 0.3], v: 'near' },
        { at: [wallAt[0] + n[0] * Math.min(d * 1.9, 2.8), wallAt[1] + n[1] * Math.min(d * 1.9, 2.8)], v: 'far' },
      ]);
      quizScene({
        kind,
        eye: true,
        rings: [{ at: p, r: 17, color: C.glow }],
        lines: thin(cells.filter((x) => x.n === 1)),
        chips: marks.map((m, q) => ({ tube: true, at: m.at, text: letters[q], color: INK, r: 11 })),
      });
      const answer = marks.findIndex((m) => m.v === 'right');
      const wrong = [0, 1, 2, 3].filter((q) => q !== answer);
      return {
        text: t('q_spot'),
        answer,
        wrong,
        label: (q) => t('c_mark', { x: letters[q] }),
        notes: notesOf(wrong.map((q) => [q, t(`n_spot_${marks[q].v}`)])),
        reveal: t('a_spot', { x: letters[answer] }),
      };
    }
    if (kind === 'corner') {
      const c = pick(CORNERS);
      quizScene({
        kind,
        eye: true,
        lines: thin(cells.filter((x) => x.n <= 3)),
        rings: [{ at: c, r: 20, color: C.glow }],
      });
      const notes = [
        [3, t('n_corner_3')],
        [4, t('n_corner_4')],
        [12, t('n_corner_12')],
      ];
      return {
        text: t('q_corner'),
        answer: 6,
        wrong: [3, 4, 12],
        label: (a) => t('c_cells', { a }),
        notes: notesOf(notes),
        reveal: t('a_corner', { a: 6 }),
      };
    }
    if (kind === 'graze') {
      const bright = Math.random() < 0.5;
      const angles = shuffle([12, 38, 62, 84]);
      const list = angles.map((theta, q) => ({ id: `e${q}`, theta, letter: letters[q] }));
      quizScene({ kind, eyes: list });
      const best = bright ? Math.max(...angles) : Math.min(...angles);
      const answer = angles.indexOf(best);
      const wrong = [0, 1, 2, 3].filter((q) => q !== answer);
      return {
        text: t(bright ? 'q_graze_bright' : 'q_graze_faint'),
        answer,
        wrong,
        label: (q) => t('c_eye', { x: letters[q] }),
        notes: notesOf(wrong.map((q) => [q, t('n_graze', { a: angles[q], b: percent(angles[q]) })])),
        reveal: t(bright ? 'a_graze_bright' : 'a_graze_faint', { x: letters[answer], a: best, b: percent(best) }),
      };
    }
    const theta = pick([20, 40, 50, 70]);
    const c = sixtyChoices(theta);
    quizScene({ kind: 'sixty', theta });
    const wrong = [c.copied, c.above, c.corner];
    return {
      text: t('q_sixty'),
      answer: c.answer,
      wrong,
      label: (a) => t('c_deg', { a }),
      notes: notesOf([
        [c.copied, t('n_sixty_copied')],
        [c.above, t('n_sixty_above')],
        [c.corner, t('n_sixty_corner')],
      ]),
      reveal: t('a_sixty', { a: c.answer, b: c.above, c: 180 - 60 - c.above }),
    };
  }
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
        order = ['count', 'spot', 'corner', 'graze', 'sixty'];
        if (s.drag) {
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
        shownFrame = frameKey();
        setting.setSite({ graze: SITES.strip, two: SITES.two }[s.step] ?? SITES.tube);
        flyCamera(0.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = prepare(i);
        qCurrent = q;
        say(' ');
        ui.$('.pvc-q-text').innerHTML = q.text;
        const done = await flyCamera(0.6);
        if (!alive()) return null;
        if (!done) camK = 1;
        const out = [q.answer];
        for (const w of q.wrong) if (out.length < 4 && !out.includes(w)) out.push(w);
        return { choices: shuffle(out), expected: q.answer, tolerance: 1e-6, label: q.label, meta: { kind: order[i] } };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        const why = !correct && picked ? q.notes.get(String(picked.value)) : '';
        return `${q.reveal}${why ? ` <span class="kld-why">${t('n_pick', { x: q.label(picked.value) })} ${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    controls.enableRotate = !s.locked;
    controls.enabled = !s.locked && !inEye();
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
  function restartStep() {
    s.stage = 0;
    s.turned = 0;
    s.picked = null;
    if (s.step === 'graze') s.theta = DEFAULTS.theta;
    if (s.step === 'two') s.angle = WEDGE.start;
  }
  function home() {
    if (s.locked) return lockedNudge();
    stopMotion();
    squareUp(false);
    restartStep();
    clearLabels();
    if (s.view === '3d') setView('front');
    draw();
    syncUI();
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
    if (b.dataset.example && b.dataset.example !== s.step) go(b.dataset.example);
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
      if (canTurn()) {
        const from = s.phi;
        const to = from + walk * rad(20);
        tweener.animate({
          key: 'turn',
          duration: 0.3,
          ease: ease.inOutCubic,
          onUpdate: (k) => {
            setPhi(from + (to - from) * k);
            stage.invalidate();
          },
        });
        s.turned += walk * 20;
        s.stage = 2;
        s.dragged.turn = true;
        draw();
        emitChange();
      } else if (canEye()) {
        s.theta = clamp(s.theta + walk * 2, STRIP.min, STRIP.max);
        s.dragged.eye = true;
        if (s.theta >= 70) s.stage = 1;
        draw();
        emitChange();
      } else if (canLamp()) {
        s.angle = snapWedge(s.angle + walk);
        s.dragged.lamp = true;
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
  function snapshot() {
    const p = bead();
    const six = (a) => +a.toFixed(6);
    const traced =
      s.step === 'why' && s.stage >= 1 && s.stage <= 3
        ? (() => {
            const c = CHAIN[s.stage - 1];
            const r = path(p, c.word);
            return { reflections: c.n, hits: r.hits.map((h) => ({ wall: h.wall, theta: six(h.theta) })), image: r.image.map(six) };
          })()
        : null;
    const w = traceWedge(s.angle);
    return {
      step: s.step,
      stage: s.stage,
      phase: phase(),
      phi: six(s.phi),
      turned: Math.round(s.turned),
      eye: Boolean(inEye()),
      peek: tube.peek,
      cells: { total: cells.length, one: counts[1], two: counts[2], three: counts[3] },
      theta: s.theta,
      reflected: percent(s.theta),
      angle: s.angle,
      atB: atB(s.angle),
      back: w.back,
      beads: { settled: tube.beads.settled, stone: p.map(six) },
      trace: traced,
      picked: s.picked ? { n: s.picked.n, light: +brightness(s.picked.centre, s.picked.crossings).toFixed(3) } : null,
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
    const k = JSON.stringify([snap.step, snap.phase, snap.theta, snap.angle, snap.turned]);
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
      if (p.step && STEPS.includes(p.step) && p.step !== s.step) go(p.step, { animate: false });
      if (p.stage != null) {
        stopMotion();
        s.stage = clamp(Math.round(p.stage), 0, TOP[s.step]);
        if (s.stage === 0) restartStep();
      }
      if (p.theta != null) s.theta = clamp(Math.round(p.theta), STRIP.min, STRIP.max);
      if (p.angle != null) s.angle = snapWedge(p.angle);
      if (p.turn != null) {
        const a = rad(p.turn);
        if (animate) {
          const from = s.phi;
          await tweener.animate({
            key: 'turn',
            duration: 1.2,
            ease: ease.inOutCubic,
            onUpdate: (k) => {
              setPhi(from + a * k);
              stage.invalidate();
            },
          }).finished;
        } else setPhi(s.phi + a);
        s.turned += p.turn;
        if (s.step === 'pattern' && s.stage === 1 && Math.abs(s.turned) >= 20) s.stage = 2;
      }
      if (!animate) camK = 1;
      draw({ instant: !animate });
      syncUI();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      stopMotion();
      s.step = 'pattern';
      squareUp(false);
      restartStep();
      tube.beads.restart();
      tube.syncBeads();
      clearLabels();
      setView('front', { animate: false });
      camK = 1;
      draw({ instant: true });
      syncUI();
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
    exportRoot: () => tube.exportModel(),
  };
}
