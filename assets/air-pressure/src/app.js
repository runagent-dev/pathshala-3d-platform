// Air pressure (book page 142, topic 5.4), student view. A thin tin box (a cube 10 cm on a side, like the book's
// চিত্র ৫.০৭) stands on a plain table, nothing else round it. One outlined red arrow presses on each open face from
// outside (the air's 10⁵ N/m², the same length everywhere); one blue arrow on the left face pushes back from inside
// just as hard. Each tap pumps one stroke: the inside pressure drops, the blue arrow shrinks, the red ones stay, and the box crumples in from every side while the camera leans in; the panel
// works out the force left over on one face, F = (P outside − P inside) × A. Then the book's contrast: "what if air
// pushed only from the top?" shows the wrong flattening (b) as a ghost, and "what really happens" replays the
// all-sided crush (c). Two short steps: the air column over 1 m² (চিত্র ৫.০৬) whose weight, 10⁵ N, matches an
// elephant's; and a student with equal arrows outside and inside (why we don't feel it; in space only the inside ones
// are left). Then a five-question test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { createArrowSet } from './arrows.js';
import { FACES, createCan } from './can.js';
import { COLUMN_AT, ELEPHANT_AT, GROUND, PERSON_AT, createWorld, skyTexture, spaceTexture } from './scene.js';
import {
  FACE_CM2,
  PARTS,
  P_AIR,
  P_EXP,
  QUIZ_STROKES,
  SIDE_CM,
  STROKES,
  STROKE_PA,
  arrowLength,
  columnWeight,
  crumpleFor,
  faceForce,
  fixStrokes,
  forceChoices,
  groupBD,
  groupIntl,
  insidePressure,
  pressureDifference,
  toM2,
} from './reading.js';

export const DEFAULTS = {
  part: 'can', // 'can' | 'column' | 'body'
  strokes: 0, // pump strokes done (0 … 5)
  whatIf: false, // the box: show the wrong flattening from the top only
  space: false, // the body: in space (no air outside)
  weigh: false, // the column: its weight and the elephant's shown
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { out: '#e03131', in: '#1971c2', W: '#7048e8', A: '#0c8599' };
const GAP = 0.0015; // the arrows' tips stop this far off the tin
const STROKE_S = 1.5; // s: one stroke of the pump
const SHAPE_S = 1.6; // s: the flattening (b), the replayed crush (c)
const DOUBLE_TAP = 420; // ms
const NBSP = ' ';
const MARGIN = { top: 52, bottom: 14, side: 6 };
const DOWN = new THREE.Vector3(0, -1, 0);
// where the camera looks for each part (world boxes) and from where
const LOOKS = {
  can: { box: [new THREE.Vector3(-0.17, -0.004, -0.08), new THREE.Vector3(0.1, 0.19, 0.1)], dir: new THREE.Vector3(-0.5, 0.3, 1) },
  close: { box: [new THREE.Vector3(-0.09, -0.004, -0.09), new THREE.Vector3(0.09, 0.13, 0.09)], dir: new THREE.Vector3(-0.42, 0.3, 1) },
  column: {
    box: [new THREE.Vector3(ELEPHANT_AT.x - 1.4, GROUND, ELEPHANT_AT.z - 0.9), new THREE.Vector3(COLUMN_AT.x + 0.7, GROUND + 3.6, COLUMN_AT.z + 0.6)],
    dir: new THREE.Vector3(0.32, 0.16, 1),
  },
  body: {
    box: [new THREE.Vector3(PERSON_AT.x - 0.55, GROUND, PERSON_AT.z - 0.2), new THREE.Vector3(PERSON_AT.x + 0.55, GROUND + 1.78, PERSON_AT.z + 0.3)],
    dir: new THREE.Vector3(-0.18, 0.1, 1),
  },
};
// the student's body: points on it where the arrows press (person coordinates) and the way out of the body there
const BODY_POINTS = [
  [0, 1.585, 0, 0, 1, 0],
  [-0.36, 0.9, 0.02, -1, 0.08, 0],
  [0.36, 0.9, 0.02, 1, 0.08, 0],
].map(([x, y, z, nx, ny, nz]) => ({ p: new THREE.Vector3(x, y, z).add(PERSON_AT), n: new THREE.Vector3(nx, ny, nz).normalize() }));
const BODY_LEN = 0.16; // m: the same outside and inside

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const G = (x) => N(t.lang === 'bn' ? groupBD(x) : groupIntl(x)); // Bangladeshi commas in Bangla (১,০০,০০০)
  const BASE = { p5: t.pow(10, P_EXP), p1: t.pow(10, 1), p3: t.pow(10, 3), one: 1, zero: 0 };
  const T = (key, vars = {}) => t(key, { ...BASE, ...vars });

  root.classList.add('pvc', 'ap');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'parts', results: false, items: PARTS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the readings: two pressures (or the column's weight and area) as a small list, then the formula
  const arrowIn =
    '<svg viewBox="0 0 24 12" aria-hidden="true"><path d="M2 6h13M11 1.5 17 6l-6 4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 1v10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const arrowOut =
    '<svg viewBox="0 0 24 12" aria-hidden="true"><path d="M4 1v10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8 6h13M17 1.5 23 6l-6 4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const read = document.createElement('div');
  read.className = 'ap-read';
  read.innerHTML = `
    <div class="ap-cells">
      <div class="ap-cell" data-cell="a"><span class="ap-ico" data-ico="a"></span><span class="ap-k" data-k="a"></span><b class="ap-v" data-v="a"></b></div>
      <div class="ap-cell" data-cell="b"><span class="ap-ico" data-ico="b"></span><span class="ap-k" data-k="b"></span><b class="ap-v" data-v="b"></b></div>
    </div>
    <div class="ap-sum" data-sum aria-live="polite"></div>`;
  $('.pvc-act-row').after(read);

  // a small note in the panel, under the rule: what is made simple, or that a picture is imagined (off the 3D view)
  const note = document.createElement('p');
  note.className = 'ap-note';
  ui.learn.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 90, environment: 'room', environmentIntensity: 0.55 });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI * 0.52;
  const sky = o.bg !== 'transparent' ? skyTexture() : null;
  let stars = null;
  scene.background = sky;
  if (sky) scene.fog = new THREE.Fog('#f7d9b2', 6, 60);
  function haze() {
    if (!(scene.fog instanceof THREE.Fog)) return;
    const d = camera.position.distanceTo(controls.target);
    scene.fog.near = d + 4;
    scene.fog.far = d + 40;
  }
  controls.addEventListener('change', haze);
  // golden hour: a low warm sun from the front right, a blue sky and warm bricks bouncing light
  const hemi = new THREE.HemisphereLight('#a9d0ff', '#c9784a', 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffd49a', 2.5);
  const SUN_DIR = new THREE.Vector3(1.5, 1.35, 1.25).normalize();
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe2ff', 0.55);
  fill.position.set(-3, 2, 4);
  scene.add(fill);
  const shadows = o.shadow && o.bg !== 'transparent';
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.01;
  }
  /** The sun's shadow box goes where the camera looks (small and sharp for the box, big for the column). */
  function aimSun(part) {
    const c = new THREE.Vector3();
    let size = 0.42;
    if (part === 'column') {
      c.copy(COLUMN_AT).lerp(ELEPHANT_AT, 0.5);
      size = 4.2;
    } else if (part === 'body') {
      c.copy(PERSON_AT).add({ x: 0, y: 0.8, z: 0 });
      size = 1.4;
    } else c.set(-0.06, 0.05, -0.03);
    sun.target.position.copy(c);
    sun.position.copy(c).addScaledVector(SUN_DIR, size * 5);
    Object.assign(sun.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: size * 1.5, far: size * 10 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.target.updateMatrixWorld();
  }

  const world = createWorld();
  scene.add(world.root);
  const can = createCan();
  scene.add(can.root);

  // the arrows, few and outlined: one red arrow pressing in on each open face (the air outside, every side alike), and
  // on the face toward the camera one blue arrow beside it pushing out (the air inside), which shrinks as it is pumped
  // out; the column's and the elephant's weight, the body's
  const openFaces = FACES.filter((f) => f.id !== 'ny');
  const outSpots = openFaces.map((face) => ({ face, u: face.id === 'nx' ? -0.55 : 0, v: 0, top: face.id === 'py' }));
  const inSpots = [{ face: FACES.find((f) => f.id === 'nx'), u: 0.55, v: 0 }];
  const outArrows = createArrowSet({ count: outSpots.length, color: COLORS.out, radius: 0.0048, name: 'OutsidePressure' });
  const inArrows = createArrowSet({
    count: inSpots.length,
    color: COLORS.in,
    outline: '#ffffff',
    radius: 0.0048,
    head: 0.014,
    headRadius: 0.011,
    name: 'InsidePressure',
  });
  const wArrows = createArrowSet({ count: 2, color: COLORS.W, radius: 0.04, pad: 0.018, name: 'Weights' });
  const bodyOut = createArrowSet({ count: BODY_POINTS.length, color: COLORS.out, radius: 0.0095, name: 'BodyOutside' });
  const bodyIn = createArrowSet({ count: BODY_POINTS.length, color: COLORS.in, outline: '#ffffff', radius: 0.0095, xray: true, name: 'BodyInside' });
  scene.add(outArrows.root, inArrows.root, wArrows.root, bodyOut.root, bodyIn.root);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    part: PARTS.includes(o.part) ? o.part : 'can',
    n: 0, // strokes done
    pIn: P_AIR, // the inside pressure as drawn (it moves during a stroke)
    c: 0, // how crumpled the box is drawn (0 … 1)
    f: 0, // how flat the ghost is drawn (0 … 1)
    ghost: false, // the box drawn as the ghost of (b)
    whatIf: false,
    busy: '', // '' | 'pump' | 'flat' | 'real'
    weighed: false,
    space: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    zoom: 0, // 0 … 1: how far the camera has leaned in to the box
    found: { pump: false, vacuum: false, whatIf: false, real: false, weigh: false, body: false, space: false },
    show: { arrows: true, inside: true, values: true, topOnly: false, labels: true }, // the test hides some
    userMovedCamera: false,
    run: 0, // a token: every new stroke, flattening, part or reset bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the box and its arrows ──────────────────────────────────────────────────
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const negN = new THREE.Vector3();
  let weights = [0, 0, 0];
  function syncCan() {
    weights = can.setShape(s.c, s.f, { ghost: s.ghost });
    layoutArrows();
    stage.invalidate();
  }
  function layoutArrows() {
    const onCan = s.part === 'can' && s.show.arrows;
    const topOnly = s.ghost || s.show.topOnly;
    const L = arrowLength(P_AIR);
    outSpots.forEach((sp, i) => {
      if (!onCan || (topOnly && !sp.top)) return outArrows.hide(i);
      can.pointAt(sp.face, sp.u, sp.v, weights, tmpA).addScaledVector(sp.face.n, GAP);
      tmpB.copy(tmpA).addScaledVector(sp.face.n, L);
      negN.copy(sp.face.n).negate();
      outArrows.set(i, tmpB, negN, L);
    });
    const Li = arrowLength(s.pIn);
    inSpots.forEach((sp, i) => {
      if (!onCan || !s.show.inside || s.ghost || Li < 1e-4) return inArrows.hide(i);
      can.pointAt(sp.face, sp.u, sp.v, weights, tmpA).addScaledVector(sp.face.n, GAP);
      inArrows.set(i, tmpA, sp.face.n, Li);
    });
    // the weights: down through the column, and down in front of the elephant
    const wOn = s.part === 'column' && s.weighed;
    if (wOn) {
      wArrows.set(0, tmpA.copy(COLUMN_AT).add({ x: 0, y: 1.9, z: 0 }), DOWN, 1.8);
      wArrows.set(1, tmpA.copy(ELEPHANT_AT).add({ x: 0.3, y: 1.15, z: 1.3 }), DOWN, 1.1);
    } else wArrows.hideAll();
    // the body: the same length outside and inside (in space, none outside)
    const bOn = s.part === 'body' && s.show.arrows;
    BODY_POINTS.forEach((bp, i) => {
      if (!bOn || s.space) bodyOut.hide(i);
      else {
        tmpA.copy(bp.p).addScaledVector(bp.n, 0.006 + BODY_LEN);
        bodyOut.set(i, tmpA, negN.copy(bp.n).negate(), BODY_LEN);
      }
      if (!bOn || !s.show.inside) bodyIn.hide(i);
      else {
        tmpA.copy(bp.p).addScaledVector(bp.n, -0.008 - BODY_LEN);
        bodyIn.set(i, tmpA, bp.n, BODY_LEN);
      }
    });
  }

  /** One stroke of the pump: the handle goes up and back, some air goes out, the box gives. */
  function pumpStroke({ jump = false } = {}) {
    if (s.n >= STROKES) return Promise.resolve(false);
    const token = ++s.run;
    tweener.cancel('shape');
    s.whatIf = false;
    s.ghost = false;
    s.f = 0;
    const from = { pIn: s.pIn, c: s.c };
    s.n += 1;
    const to = { pIn: insidePressure(s.n), c: crumpleFor(pressureDifference(s.n)) };
    if (s.mode === 'explore') s.found.pump = true;
    if (jump) {
      s.pIn = to.pIn;
      s.c = to.c;
      return Promise.resolve(arrivePump(token));
    }
    s.busy = 'pump';
    audio.tick();
    refresh();
    let crunched = false;
    const last = s.n === STROKES;
    return tweener
      .animate({
        key: 'shape',
        duration: STROKE_S,
        ease: ease.linear,
        onUpdate: (k) => {
          // the handle up (0 … 0.42) and back down (… 0.78)
          const kp = ease.inOutCubic(Math.min(1, Math.max(0, (k - 0.05) / 0.45)));
          s.pIn = from.pIn + (to.pIn - from.pIn) * kp;
          // the tin holds, then gives with a little spring (a buckle)
          const kc = Math.min(1, Math.max(0, (k - 0.32) / 0.5));
          s.c = from.c + (to.c - from.c) * ease.outBack(kc);
          if (!crunched && kc > 0.05) {
            crunched = true;
            audio.contact();
          }
          s.zoom = last
            ? 0.75 * (k < 0.5 ? Math.sin(Math.PI * k) : 1 - 0.4 * ease.inOutCubic((k - 0.5) / 0.5))
            : 0.45 * Math.sin(Math.PI * Math.min(1, k * 1.15));
          if (!s.userMovedCamera) jumpTo(viewPose());
          syncCan();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.run) return false;
        s.pIn = to.pIn;
        s.c = to.c;
        s.zoom = 0;
        return arrivePump(token);
      });
  }
  function arrivePump(token) {
    if (token !== s.run) return false;
    s.busy = '';
    if (s.n >= STROKES && s.mode === 'explore') s.found.vacuum = true;
    if (!s.userMovedCamera) jumpTo(viewPose());
    syncCan();
    refresh();
    emit('pump', { strokes: s.n, pIn: insidePressure(s.n) });
    emitChange();
    return true;
  }

  /** The book's (b): the box as a ghost, pressed only from the top, flattening. */
  function showWhatIf({ jump = false } = {}) {
    const token = ++s.run;
    tweener.cancel('shape');
    s.whatIf = true;
    s.ghost = true;
    if (s.mode === 'explore') s.found.whatIf = true;
    if (jump) {
      s.f = 1;
      s.busy = '';
      syncCan();
      refresh();
      emitChange();
      return Promise.resolve(true);
    }
    s.f = 0;
    s.busy = 'flat';
    refresh();
    return tweener
      .animate({
        key: 'shape',
        duration: SHAPE_S,
        ease: ease.linear,
        onUpdate: (k) => {
          s.f = ease.outBack(Math.min(1, Math.max(0, (k - 0.15) / 0.75)));
          s.zoom = k < 0.5 ? 0.75 * Math.sin(Math.PI * k) : 0.75 - 0.3 * ease.inOutCubic((k - 0.5) / 0.5);
          if (!s.userMovedCamera) jumpTo(viewPose());
          syncCan();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.run) return false;
        s.f = 1;
        s.busy = '';
        s.zoom = 0;
        syncCan();
        refresh();
        emit('whatif', { whatIf: true });
        emitChange();
        return true;
      });
  }
  /** Back to the real box: the crush from every side, replayed from new (the book's (c)). */
  function showReal({ jump = false } = {}) {
    const token = ++s.run;
    tweener.cancel('shape');
    s.whatIf = false;
    s.ghost = false;
    s.f = 0;
    const to = crumpleFor(pressureDifference(s.n));
    if (s.mode === 'explore' && s.found.whatIf) s.found.real = true;
    if (jump || to === 0) {
      s.c = to;
      s.busy = '';
      syncCan();
      refresh();
      emitChange();
      return Promise.resolve(true);
    }
    s.c = 0;
    s.busy = 'real';
    refresh();
    let crunched = false;
    return tweener
      .animate({
        key: 'shape',
        duration: SHAPE_S,
        ease: ease.linear,
        onUpdate: (k) => {
          const kc = Math.min(1, Math.max(0, (k - 0.12) / 0.7));
          s.c = to * ease.outBack(kc);
          if (!crunched && kc > 0.05) {
            crunched = true;
            audio.contact();
          }
          s.zoom = k < 0.5 ? 0.75 * Math.sin(Math.PI * k) : 0.75 - 0.3 * ease.inOutCubic((k - 0.5) / 0.5);
          if (!s.userMovedCamera) jumpTo(viewPose());
          syncCan();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.run) return false;
        s.c = to;
        s.busy = '';
        s.zoom = 0;
        syncCan();
        refresh();
        emit('whatif', { whatIf: false });
        emitChange();
        return true;
      });
  }
  /** A new box: full of air, not dented. */
  function newCan() {
    s.run++;
    tweener.cancel('shape');
    s.n = 0;
    s.pIn = P_AIR;
    s.c = 0;
    s.f = 0;
    s.ghost = false;
    s.whatIf = false;
    s.busy = '';
    s.zoom = 0;
    syncCan();
    refresh();
    emitChange();
  }
  /** Jump the box to a state (the test, set, the start). */
  function canTo(n, { whatIf = false } = {}) {
    s.run++;
    tweener.cancel('shape');
    s.n = fixStrokes(n);
    s.pIn = insidePressure(s.n);
    s.c = crumpleFor(pressureDifference(s.n));
    s.whatIf = whatIf;
    s.ghost = whatIf;
    s.f = whatIf ? 1 : 0;
    s.busy = '';
    s.zoom = 0;
    syncCan();
  }

  // ── the parts: the box, the column, the body ──────────────────────────────
  function syncParts() {
    const inSpace = s.part === 'body' && s.space;
    world.outdoors.visible = !inSpace;
    world.column.visible = !inSpace;
    world.elephant.visible = !inSpace;
    can.root.visible = !inSpace;
    if (sky) {
      if (inSpace && !stars) stars = spaceTexture();
      scene.background = inSpace ? stars : sky;
      if (scene.fog instanceof THREE.Fog) scene.fog.color.set(inSpace ? '#0d1b4a' : '#f7d9b2');
    }
    hemi.intensity = inSpace ? 0.55 : 0.85;
    aimSun(s.part);
    layoutArrows();
    stage.invalidate();
  }
  function setPart(part, { animate = true } = {}) {
    if (!PARTS.includes(part)) return Promise.resolve(false);
    s.run++;
    tweener.cancel('shape');
    if (s.busy === 'pump' || s.busy === 'real') {
      // a stroke cut short ends where it was going
      s.pIn = insidePressure(s.n);
      s.c = crumpleFor(pressureDifference(s.n));
    }
    if (s.busy === 'flat') s.f = 1;
    s.busy = '';
    s.zoom = 0;
    s.part = part;
    if (part !== 'body') s.space = false;
    if (s.mode === 'explore') {
      if (part === 'body') s.found.body = true;
    }
    s.userMovedCamera = false;
    syncCan();
    syncParts();
    refresh();
    emit('part', { part });
    emitChange();
    return flyTo(viewPose(), animate ? 1.3 : 0);
  }
  function weigh() {
    s.weighed = true;
    if (s.mode === 'explore') s.found.weigh = true;
    audio.pop();
    layoutArrows();
    refresh();
    emitChange();
  }
  function setSpace(on) {
    s.space = Boolean(on);
    if (s.space && s.mode === 'explore') s.found.space = true;
    audio.pop();
    syncParts();
    refresh();
    emit('space', { space: s.space });
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  function plan() {
    if (s.part === 'column') return s.weighed ? { label: 'act_weigh_again', step: '' } : { label: 'act_weigh', step: 1 };
    if (s.part === 'body') return s.space ? { label: 'act_earth', step: '' } : { label: 'act_space', step: s.found.space ? '' : 1 };
    if (s.busy === 'flat' || (s.whatIf && !s.busy)) return { label: 'act_real', step: s.found.real ? '' : 3 };
    if (s.n < STROKES || s.busy === 'pump') return { label: s.n === 0 ? 'act_pump' : 'act_pump_more', step: s.found.vacuum ? '' : 1 };
    if (!s.found.real) return { label: 'act_whatif', step: 2 };
    return { label: 'act_new', step: '' };
  }

  function outcomeHtml() {
    if (s.part === 'column') return s.weighed ? T('out_weighed') : T('out_column');
    if (s.part === 'body') return s.space ? T('out_space') : T('out_body');
    if (s.busy === 'pump') return T('out_pumping');
    if (s.whatIf) return T('out_whatif');
    if (s.found.real && s.n >= STROKES && s.busy !== 'flat') return T('out_real');
    const F = faceForce(pressureDifference(s.n));
    if (s.n === 0) return T('out_can_start');
    if (s.n >= STROKES) return T('out_vacuum', { F: G(F) });
    return T('out_can', { n: N(s.n), F: G(F) });
  }

  function ruleHtml() {
    if (s.part === 'column') return s.weighed ? T('rule_weighed') : T('rule_column');
    if (s.part === 'body') return s.space ? T('rule_space') : T('rule_body');
    if (s.whatIf || s.busy === 'flat') return T('rule_whatif');
    if (s.found.real && s.n >= STROKES) return T('rule_real');
    if (s.n >= STROKES) return T('rule_vacuum');
    if (s.n > 0 || s.busy === 'pump') return T('rule_pump');
    return T('rule_can_start');
  }

  function readout() {
    if (s.part === 'column')
      return {
        a: { k: T('cell_W'), v: T('val_W'), cls: 'k-W', ico: '' },
        b: { k: T('cell_A'), v: T('val_A', { v: N(1) }), cls: 'k-A', ico: '' },
        sum: T('sum_column'),
      };
    const pOut = s.part === 'body' && s.space ? 0 : P_AIR;
    const pIn = s.part === 'body' ? P_AIR : insidePressure(s.n);
    const a = { k: T('cell_out'), v: T('val_Pa', { v: G(pOut) }), cls: 'k-out', ico: arrowIn };
    const b = { k: T('cell_in'), v: T('val_Pa', { v: G(pIn) }), cls: 'k-in', ico: arrowOut };
    if (s.part === 'body') return { a, b, sum: T(s.space ? 'sum_space' : 'sum_body', { dP: G(Math.abs(pOut - pIn)) }) };
    const dP = pressureDifference(s.n);
    const narrow = read.clientWidth < 420;
    return {
      a,
      b,
      sum: T(narrow ? 'sum_can_short' : 'sum_can', { dP: G(dP), A: N(toM2(FACE_CM2)), F: G(faceForce(dP)) }),
    };
  }

  let lastRead = '';
  let lastNote = '';
  function refresh() {
    sheet.choose(s.part);
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    const r = readout();
    const key = JSON.stringify(r);
    if (key !== lastRead) {
      lastRead = key;
      for (const id of ['a', 'b']) {
        const cell = /** @type {HTMLElement} */ (read.querySelector(`[data-cell="${id}"]`));
        cell.className = `ap-cell ${r[id].cls}`;
        /** @type {HTMLElement} */ (read.querySelector(`[data-k="${id}"]`)).textContent = r[id].k;
        /** @type {HTMLElement} */ (read.querySelector(`[data-v="${id}"]`)).innerHTML = r[id].v;
        /** @type {HTMLElement} */ (read.querySelector(`[data-ico="${id}"]`)).innerHTML = r[id].ico;
      }
      /** @type {HTMLElement} */ (read.querySelector('[data-sum]')).innerHTML = r.sum;
    }
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label });
      if (s.busy) action.hide('busy');
      else action.show('busy');
    }
    // the note under the rule
    let n = '';
    let warn = false;
    if (s.part === 'can') {
      if (s.whatIf || s.busy === 'flat') {
        n = T('note_whatif');
        warn = true;
      } else if (s.n > 0 || s.busy) n = T('note_steps', { v: G(STROKE_PA) });
    } else if (s.part === 'column') n = T('note_column');
    else n = s.space ? T('note_space') : T('note_body');
    const nk = `${n}|${warn}`;
    if (nk !== lastNote) {
      lastNote = nk;
      note.innerHTML = n ? `${warn ? ICONS.close : ''}<span>${n}</span>` : '';
      note.classList.toggle('warn', warn);
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const P0 = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  /** Each shown arrow as three small boxes along it (one box round a slanting arrow would cover far too much). */
  function setBoxes(set, list, pad = 5) {
    for (let i = 0; i < set.count; i++) {
      if (!set.shown[i]) continue;
      toScreen(set.tails[i], P0);
      toScreen(set.tips[i], P1);
      for (let k = 0; k < 3; k++) {
        const x0 = P0.x + ((P1.x - P0.x) * k) / 3;
        const y0 = P0.y + ((P1.y - P0.y) * k) / 3;
        const x1 = P0.x + ((P1.x - P0.x) * (k + 1)) / 3;
        const y1 = P0.y + ((P1.y - P0.y) * (k + 1)) / 3;
        list.push({ left: Math.min(x0, x1) - pad, top: Math.min(y0, y1) - pad, right: Math.max(x0, x1) + pad, bottom: Math.max(y0, y1) + pad });
      }
    }
  }
  function arrowBoxes() {
    const list = [];
    if (s.part === 'can') {
      setBoxes(outArrows, list);
      setBoxes(inArrows, list);
    } else if (s.part === 'column') setBoxes(wArrows, list, 8);
    else {
      setBoxes(bodyOut, list);
      setBoxes(bodyIn, list);
    }
    return list;
  }
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const bbox = new THREE.Box3();
  function screenBox(b3) {
    if (b3.isEmpty()) return null;
    let i = 0;
    for (const x of [b3.min.x, b3.max.x])
      for (const y of [b3.min.y, b3.max.y]) for (const z of [b3.min.z, b3.max.z]) corners[i++].set(x, y, z).project(camera);
    const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
    const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }
  /** The thing the labels keep off: the box (or the ghost), the pump; the column; the student. */
  function subjectBoxes() {
    const out = [];
    if (s.part === 'can') {
      // the new box's corners (the crushed box is inside them; the ghost is lower and wider)
      const k = s.ghost ? 1.2 : 1;
      bbox.min.set(-can.H * k, 0, -can.H * k);
      bbox.max.set(can.H * k, can.H * (s.ghost ? 0.75 : 2), can.H * k);
      out.push(screenBox(bbox));
    } else if (s.part === 'body') {
      bbox.setFromObject(world.person.root);
      out.push(screenBox(bbox));
    }
    return out.filter(Boolean);
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const ABOVE = [spot(0, -22), spot(24, -22), spot(-24, -22), spot(0, -40), spot(40, -34), spot(-40, -34), spot(0, -58)];
  const RIGHT = [spot(18, 0), spot(18, -18), spot(18, 18), spot(34, -32), spot(34, 32), spot(50, 0), spot(50, -48), spot(50, 48)];
  const LEFT = [spot(-18, 0), spot(-18, -18), spot(-18, 18), spot(-34, -32), spot(-34, 32), spot(-50, 0), spot(-50, -48), spot(-50, 48)];
  const BELOW = [spot(0, 22), spot(24, 22), spot(-24, 22), spot(0, 40), spot(36, 46), spot(-36, 46), spot(0, 60)];
  // farther off, with a leader line: over the table below the box, or the yard above it
  const FAR_DOWN = [spot(0, 84), spot(50, 80), spot(-50, 80), spot(0, 110), spot(70, 104), spot(-70, 104)];
  const FAR_UP = [spot(0, -84), spot(50, -80), spot(-50, -80), spot(0, -110), spot(70, -104)];
  const pts = {};
  const pt = (id) => (pts[id] ||= new THREE.Vector3());
  const labelState = new Map();
  const want = new Map();
  /** The outside arrow labelled: the top row's middle on the face toward the camera's right (the +z face). */
  const outIdx = outSpots.findIndex((sp) => sp.face.id === 'nx');
  const topIdx = outSpots.findIndex((sp) => sp.face.id === 'py');
  const inIdx = 0;
  function syncLabels() {
    want.clear();
    const compact = stage.height < 260 || stage.width < 340;
    const own = [subjectBoxes];
    const quiz = s.mode === 'quiz';
    if (s.show.labels && s.part === 'can' && s.show.arrows && !s.busy) {
      if (s.ghost || s.show.topOnly) {
        want.set('top', {
          text: T('lbl_top_only'),
          point: () => pt('top').copy(outArrows.tails[topIdx]),
          spots: [...ABOVE, ...RIGHT, ...LEFT],
          color: COLORS.out,
          own,
        });
        if (s.ghost)
          want.set('ghost', {
            text: T('lbl_ghost'),
            point: () => can.pointAt(FACES[4], 0.6, -0.4, [0, 0, s.f], pt('ghost')),
            spots: [...RIGHT, ...BELOW],
            color: '#1f5fae',
            own,
            optional: true,
          });
      } else {
        const values = s.show.values && (!compact || quiz);
        want.set('out', {
          text: values ? T('lbl_out_v', { v: G(P_AIR) }) : T('lbl_out'),
          point: () => pt('out').copy(outArrows.tails[outIdx]),
          spots: [...RIGHT, ...ABOVE, ...FAR_UP, ...FAR_DOWN],
          color: COLORS.out,
          own,
          optional: !quiz,
        });
        if (s.show.inside && inArrows.shown[inIdx])
          want.set('in', {
            text: values ? T('lbl_in_v', { v: G(insidePressure(s.n)) }) : T('lbl_in'),
            point: () => pt('in').copy(inArrows.tails[inIdx]).lerp(inArrows.tips[inIdx], 0.5),
            spots: [...BELOW, ...FAR_DOWN, ...RIGHT, ...LEFT],
            color: COLORS.in,
            own,
            optional: !quiz,
          });
      }
    }
    if (s.show.labels && s.part === 'column') {
      want.set('col', {
        text: T('lbl_column'),
        point: () => pt('col').copy(COLUMN_AT).add({ x: 0.5, y: 2.6, z: 0.5 }),
        spots: [...RIGHT, ...ABOVE],
        color: '#1c6fd9',
        own,
      });
      want.set('m1', {
        text: T('lbl_1m'),
        point: () => pt('m1').copy(COLUMN_AT).add({ x: 0, y: 0, z: 0.52 }),
        spots: [...BELOW],
        color: COLORS.A,
        own,
        optional: true,
      });
      want.set('m2', {
        text: T('lbl_1m'),
        point: () => pt('m2').copy(COLUMN_AT).add({ x: 0.52, y: 0, z: 0 }),
        spots: [spot(22, 10), ...RIGHT, ...BELOW],
        color: COLORS.A,
        own,
        optional: true,
      });
      if (s.weighed) {
        want.set('W', {
          text: T('lbl_W'),
          point: () => pt('W').copy(wArrows.tails[0]).lerp(wArrows.tips[0], 0.45),
          spots: [...RIGHT, ...LEFT],
          color: COLORS.W,
          own,
        });
        want.set('E', {
          text: T('lbl_elephant'),
          point: () => pt('E').copy(wArrows.tips[1]),
          spots: [...BELOW, ...RIGHT, ...LEFT],
          color: COLORS.W,
          own,
        });
      }
    }
    if (s.show.labels && s.part === 'body' && s.show.arrows) {
      if (!s.space)
        want.set('bout', {
          text: T('lbl_out'),
          point: () => pt('bout').copy(bodyOut.tails[0]),
          spots: [...RIGHT, ...ABOVE, ...LEFT],
          color: COLORS.out,
          own,
        });
      if (s.show.inside)
        want.set('bin', {
          text: T('lbl_body_in'),
          point: () => pt('bin').copy(bodyIn.tips[2]),
          spots: [...RIGHT, ...BELOW],
          color: COLORS.in,
          own,
          optional: compact,
        });
    }
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.spots.map((p) => `${p.dx},${p.dy}`).join(';')}|${w.optional}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, avoid: w.own, optional: w.optional });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots, optional: w.optional });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  const poseA = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  function poseOf(look) {
    const L = LOOKS[look];
    box.min.copy(L.box[0]);
    box.max.copy(L.box[1]);
    return fitPose({ box, dir: L.dir.clone().normalize(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  /** How close the camera is to the box: leaning in during a stroke, and staying a little closer once it is crushed. */
  const lean = () => Math.max(s.zoom, s.part === 'can' && !s.busy && (s.n >= STROKES || s.whatIf) ? 0.8 : 0);
  function viewPose() {
    const p = poseOf(s.part);
    const z = lean();
    if (s.part !== 'can' || z <= 0) return p;
    const c = poseOf('close');
    poseA.position.lerpVectors(p.position, c.position, z);
    poseA.target.lerpVectors(p.target, c.target, z);
    return { position: poseA.position.clone(), target: poseA.target.clone() };
  }
  function jumpTo({ position, target: aim }) {
    if (tweener.busy && flying) return; // a flight between parts goes on
    camera.position.copy(position);
    controls.target.copy(aim);
    controls.update();
    haze();
  }
  let flying = false;
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      flying = false;
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      haze();
      stage.invalidate();
      return Promise.resolve(true);
    }
    flying = true;
    // between parts the camera rises a little on the way, so it never passes through the table
    const lift = p0.distanceTo(position) > 1 ? Math.min(1.5, p0.distanceTo(position) * 0.18) : 0;
    return tweener
      .animate({
        key: 'camera',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          camera.position.lerpVectors(p0, position, k);
          camera.position.y += Math.sin(Math.PI * k) * lift;
          controls.target.lerpVectors(t0, aim, k);
          controls.update();
          haze();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        flying = false;
        if (done) refresh();
        return done;
      });
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    flying = false;
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    lastRead = '';
    refresh();
  });

  // ── the action: the big button, the ring round the pump (or the box, the column, the student) ──
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.part === 'column') return weigh();
    if (s.part === 'body') return setSpace(!s.space);
    if (s.busy === 'pump' || s.busy === 'real') return showHint(T('hint_wait'), { duration: 1800 });
    if (s.busy === 'flat' || s.whatIf) return showReal();
    if (s.n < STROKES) return pumpStroke();
    if (!s.found.real) return showWhatIf();
    return newCan();
  }
  const targetBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_pump',
    target: () => {
      if (s.part === 'column')
        return targetBox
          .setFromObject(world.column.children[0])
          .intersect(new THREE.Box3(new THREE.Vector3(-99, GROUND, -99), new THREE.Vector3(99, GROUND + 2.6, 99)));
      if (s.part === 'body') return s.space ? null : targetBox.setFromObject(world.person.root);
      return targetBox.setFromObject(s.ghost ? can.ghost.children[0] : can.mesh);
    },
    pad: 6,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitCan = [can.mesh];
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const list = s.part === 'can' ? hitCan : s.part === 'body' ? world.person.parts : [world.column.children[0]];
    return raycaster.intersectObjects(list, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return;
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    });
  });

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
    const dP = pressureDifference(s.n);
    const p = plan();
    return {
      part: s.part,
      strokes: s.n,
      pOut: P_AIR, // Pa
      pIn: insidePressure(s.n), // Pa
      dP, // Pa
      area: toM2(FACE_CM2), // m² of one face
      F: faceForce(dP), // N on one face
      crumple: crumpleFor(dP),
      whatIf: s.whatIf,
      weighed: s.weighed,
      columnWeight: columnWeight(), // N over 1 m²
      space: s.space,
      busy: s.busy,
      found: { ...s.found },
      next: p.label.replace('act_', ''),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.part, snap.strokes, snap.whatIf, snap.weighed, snap.space, snap.found, snap.mode, snap.view]);
    if (key === lastEmitted && !force) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ap-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  /** A question's scene: this part and state, these arrows and labels; nothing moving. */
  async function scene_(part, { n = 0, whatIf = false, show = {}, weighed = false, space = false } = {}) {
    s.run++;
    tweener.cancel('shape');
    s.show = { arrows: true, inside: true, values: true, topOnly: false, labels: true, ...show };
    s.part = part;
    s.space = space;
    s.weighed = weighed;
    canTo(n, { whatIf });
    s.userMovedCamera = false;
    syncParts();
    refresh();
    return flyTo(viewPose(), 0.6);
  }
  function revealAll() {
    s.show = { ...s.show, arrows: true, inside: true, values: true, labels: true };
    if (question?.kind === 'column') s.weighed = true;
    layoutArrows();
    refresh();
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const nText = (v) => `${G(v)}${NBSP}N`;

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
        learnSaved = { part: s.part, n: s.n, whatIf: s.whatIf, weighed: s.weighed, space: s.space, found: { ...s.found } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        const saved = learnSaved;
        s.show = { arrows: true, inside: true, values: true, topOnly: false, labels: true };
        s.found = { ...(saved?.found || s.found) };
        s.part = saved?.part ?? 'can';
        s.weighed = saved?.weighed ?? false;
        s.space = saved?.space ?? false;
        canTo(saved?.n ?? 0, { whatIf: saved?.whatIf ?? false });
        syncUI();
        syncParts();
        refresh();
        emitChange();
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['force', 'top', 'all', 'column', 'body'][i % 5];
        if (kind === 'force') {
          const n = pickOne(QUIZ_STROKES);
          await scene_('can', { n });
          if (!alive()) return null;
          question = { kind, n };
          return { text: T('q_force', { s: N(SIDE_CM) }), ...choicesOf(forceChoices(n), kind, (x) => nText(x.v)) };
        }
        if (kind === 'top') {
          await scene_('can', { n: 0, show: { topOnly: true, inside: false } });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_flat', 'c_inward', 'c_nothing', 'c_swell'].map((key) => ({ key }));
          return { text: T('q_top'), ...choicesOf(items, kind, (x) => T(x.key)) };
        }
        if (kind === 'all') {
          await scene_('can', { n: STROKES, show: { arrows: false } });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_nodir', 'c_pump', 'c_weight', 'c_piles'].map((key) => ({ key }));
          return { text: T('q_all'), ...choicesOf(items, kind, (x) => T(x.key)) };
        }
        if (kind === 'column') {
          await scene_('column');
          if (!alive()) return null;
          question = { kind };
          const items = ['c_w5', 'c_p5', 'c_w1', 'c_w3'].map((key) => ({ key }));
          return { text: T('q_column'), ...choicesOf(items, kind, (x) => T(x.key)) };
        }
        await scene_('body', { show: { inside: false } });
        if (!alive()) return null;
        question = { kind: 'body' };
        const items = ['c_inside', 'c_noweight', 'c_toponly', 'c_tiny'].map((key) => ({ key }));
        return { text: T('q_body'), ...choicesOf(items, 'body', (x) => T(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const A = toM2(FACE_CM2);
        const note_ = (map) => (wrongKey && map[wrongKey] ? ` ${T(map[wrongKey], { c: N(FACE_CM2), A: N(A), P: G(P_AIR) })}` : '');
        if (k === 'top') {
          // the answer: now the ghost flattens, as the book's (b)
          s.show.topOnly = false;
          showWhatIf({ jump: true });
        }
        revealAll();
        if (k === 'force') {
          const n = question.n;
          const dP = pressureDifference(n);
          return (
            T('why_force', { F: G(faceForce(dP)), Po: G(P_AIR), Pi: G(insidePressure(n)), dP: G(dP), c: N(FACE_CM2), A: N(A) }) +
            note_({ outside: 'mis_outside', inside: 'mis_inside', cm2: 'mis_cm2' })
          );
        }
        if (k === 'top') return T('why_top') + note_({ c_inward: 'mis_inward', c_nothing: 'mis_nothing', c_swell: 'mis_swell' });
        if (k === 'all') return T('why_all') + note_({ c_pump: 'mis_pump', c_weight: 'mis_weight', c_piles: 'mis_piles' });
        if (k === 'column') return T('why_column') + note_({ c_p5: 'mis_p5', c_w1: 'mis_w1', c_w3: 'mis_w3' });
        return T('why_body') + note_({ c_noweight: 'mis_noweight', c_toponly: 'mis_toponly', c_tiny: 'mis_tiny' });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
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
    s.found = { pump: false, vacuum: false, whatIf: false, real: false, weigh: false, body: false, space: false };
    s.weighed = false;
    s.space = false;
    newCan();
    setPart('can');
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else if (b.dataset.example !== s.part) setPart(b.dataset.example);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'home':
        if (s.locked) lockedNudge();
        else goHome();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['1', '2', '3', 'r', 'R', 'Home', 'ArrowUp', 'ArrowRight', '+'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) setPart(PARTS[Number(k) - 1]);
    else if ((k === 'ArrowUp' || k === 'ArrowRight' || k === '+') && s.part === 'can' && s.n < STROKES && !s.busy && !s.whatIf) pumpStroke();
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  controls.enableRotate = s.view === '3d';
  {
    const n = fixStrokes(o.strokes);
    const whatIf = Boolean(o.whatIf) && n >= STROKES;
    canTo(n, { whatIf });
    if (n > 0) s.found.pump = true;
    if (n >= STROKES) s.found.vacuum = true;
    if (whatIf) s.found.whatIf = true;
    s.weighed = Boolean(o.weigh);
    s.found.weigh = s.weighed;
    s.space = s.part === 'body' && Boolean(o.space);
    s.found.space = s.space;
    s.found.body = s.part === 'body';
  }
  syncParts();
  flyTo(viewPose(), 0);
  syncCan();
  refresh();
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
    /**
     * Change any of: part ('can' | 'column' | 'body'), strokes (0 … 5: the box jumps there, or with animate it pumps
     * the strokes still to do one by one), whatIf (the box: the wrong flattening from the top only, after 5 strokes),
     * weigh (the column: show the weights), space (the body: no air outside), view ('front' | '3d'), found.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.found) Object.assign(s.found, p.found);
      if (p.part && p.part !== s.part) await setPart(p.part, { animate });
      if (p.strokes != null) {
        const n = fixStrokes(p.strokes);
        if (animate && n > s.n && !s.whatIf) {
          while (s.n < n) if (!(await pumpStroke())) break;
        } else {
          canTo(n);
          if (n > 0) s.found.pump = true;
          if (n >= STROKES) s.found.vacuum = true;
          refresh();
        }
      }
      if (p.whatIf != null && s.part === 'can') {
        if (p.whatIf && s.n < STROKES) canTo(STROKES);
        if (p.whatIf) await showWhatIf({ jump: !animate });
        else if (s.whatIf) await showReal({ jump: !animate });
      }
      if (p.weigh != null && s.part === 'column') {
        if (p.weigh) weigh();
        else {
          s.weighed = false;
          layoutArrows();
        }
      }
      if (p.space != null && s.part === 'body') setSpace(p.space);
      if (!s.userMovedCamera) flyTo(viewPose(), 0);
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.show = { arrows: true, inside: true, values: true, topOnly: false, labels: true };
      goHome();
      await setView('front', { animate: false });
      flyTo(viewPose(), 0);
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The tin box as it is now (crumpled or not), in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'AirPressure';
      g.add(can.bake());
      return g;
    },
  };
}
