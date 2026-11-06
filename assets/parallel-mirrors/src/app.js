// Images in two mirrors (দুটি আয়নায় প্রতিবিম্ব), book p215–216, the উদাহরণ under 8.2.1, চিত্র ৮.০৪: the student view. A lit candle
// stands on a table, and the idea is built up one tap at a time, each tap slow enough to follow and each waiting for the next:
// (1) one mirror and one image, as in a plane mirror; (2) a second mirror comes in, with its own image; (3) the first image is an
// object for the second mirror: the image of the image x″, then one ray traced to it; (4) the same on the other side, x″ and
// x‴; (5) it goes on, and the camera looks into M₁, where the same images stand as a real pair of mirrors shows them. Only then
// comes the book's whole picture with all its distances. Any named image can be tapped to trace its light. The panel is the
// kit's clean sheet. A 5-question test is offered at the end.
import * as THREE from 'three';
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
  barRows,
  barsAt,
  beatOf,
  brightness,
  CANDLE,
  chainOf,
  COUNT,
  distances,
  EYE,
  GLASS,
  imageAt,
  imagesAt,
  isCurrentBar,
  LAST_BEAT,
  M,
  NAMED,
  OBJECT_AT,
  openSteps,
  PAIR_X,
  pairChoices,
  path,
  REFLECTANCE,
  ROW_ADDS,
  ROW_FADE,
  ROW_GAP,
  row,
  shuffle,
  snapCandle,
  spotChoices,
  STEPS,
  stepOfBeat,
  sumChoices,
  timesChoices,
} from './reading.js';
import { createSetting } from './setting.js';

export const DEFAULTS = {
  step: 'one', // 'one' | 'two' | 'image' | 'again' | 'many' | 'book'
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

// the owner's pace: seconds, and a step always ends by waiting for the student's tap
const PACE = { camera: 1.8, reveal: 3, withObject: 4.2, slide: 2.5, hold: 0.5, raySegment: 1.2, mirror: 2.4, fade: 0.9, bars: 1.2 };
const QUIZ_FLIGHT = 0.9; // s: the test is not a demonstration, a question should not keep the student waiting
const FAINT = 0.3; // an older pair of distances
const FLOOR_Z = 13; // cm: the candle's handle and track, on the table in front of it
const GRIP_CLEAR = 30; // px: at least this far under the candle's foot on the screen
// the ray the book's step shows at a beat
const RAY_AT = { 4: 'l2' };
const REVEALS = { 1: 'r1', 2: 'l1', 3: 'l2', 5: 'r2', 6: 'r3' };
const FAINT_LABELS_UNTIL = 5; // from this beat on an older pair of distances keeps its line, not its name: a phone has no room
const EDGE_ON = 26; // px: looking along the row, a distance shorter than its own name goes without the name
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
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.play }],
      tight: true,
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
  /**
   * All the way round. The one exception is the view into M₁: the camera stands between the mirrors and looks through M₁, so
   * there it stays on M₂'s side; beyond that glass this view has nothing to show.
   */
  function turnLimits(intoMirror) {
    controls.minAzimuthAngle = intoMirror ? THREE.MathUtils.degToRad(-115) : Number.NEGATIVE_INFINITY;
    controls.maxAzimuthAngle = intoMirror ? THREE.MathUtils.degToRad(-58) : Number.POSITIVE_INFINITY;
    controls.enableZoom = !intoMirror;
  }
  turnLimits(false);
  const setting = createSetting({ stage, shadow: Boolean(o.shadow) });
  const dia = createDiagram({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    step: STEPS.includes(o.step) ? o.step : 'one',
    x: snapCandle(Number.isFinite(Number(o.x)) ? Number(o.x) : CANDLE.start),
    beat: 0, // how many taps the build has had (reading.js lists them)
    reached: 0, // the furthest beat so far: the words open up to the next step, no further
    m2: 0, // M₂ coming in, 0 … 1
    inside: 0, // the flight into M₁, 0 … 1
    newest: '', // what is growing in
    grow: 1,
    flash: 0,
    trace: '', // the image whose ray is drawn
    rayK: Number.POSITIVE_INFINITY, // how many straight stretches of it are drawn
    rayA: 1, // an old ray fades before anything new comes
    barA: 1, // all the distances together, into the row and back
    dragged: false, // the student has moved the candle: the handle calms down
    turned: false, // the student has turned the view: the corner's cue calms down
    busy: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    drag: null,
  };
  /** The picture of a beat, at once, nothing moving. */
  function buildTo(step, stageN) {
    s.step = step;
    s.beat = beatOf(step, stageN);
    s.reached = Math.max(s.reached, s.beat);
    s.m2 = s.beat >= 2 ? 1 : 0;
    s.inside = s.beat === 8 ? 1 : 0;
    s.trace = RAY_AT[s.beat] ?? '';
    s.rayK = Number.POSITIVE_INFINITY;
    s.rayA = 1;
    s.barA = 1;
  }
  buildTo(s.step, o.stage);

  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  // the flames: a gentle flicker, about 16 times a second is enough for it, and it rests a few seconds after the last touch,
  // so that a figure left open draws nothing; any touch, key or change wakes it
  const FLICKER = 8; // s
  let clock = 0;
  let since = 1;
  let idle = 0;
  const wakeFlames = () => {
    idle = 0;
  };
  stage.addTicker((dt) => {
    idle += dt;
    if (idle > FLICKER) return false;
    clock += dt;
    since += dt;
    if (since < 0.06) return false;
    since = 0;
    setting.tickFlames(clock);
    return 'camera';
  });
  root.addEventListener('pointerdown', wakeFlames, { capture: true });
  root.addEventListener('keydown', wakeFlames, { capture: true });
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  /** What the panel's action does now. */
  function phase() {
    if (s.busy || s.grow < 1) return 'busy';
    return `b${s.beat}`;
  }
  /** The images built so far: the book's row first. */
  const builtIds = () => (s.quiz ? s.quiz.show : imagesAt(s.beat));
  const inRow = () => !s.quiz && (s.beat === 7 || s.beat === 8);
  let pickedTrace = false; // the student chose this ray by tapping its image
  const canDrag = () => !s.locked && !s.busy && s.grow >= 1 && s.inside === 0 && s.beat >= 1 && !inRow();

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  /** The heights of the book's three rows of distances, cm: further apart where the view is narrow and there is height. */
  const rowAt = (i) => (stage.width / stage.height < 1.25 ? 48 + i * 15 : 44 + i * 11);
  /** How strong a pair of distances is now: only the newest at full strength, and the one before it fades as the new one comes. */
  function barAlpha(name) {
    if (isCurrentBar(name, s.beat)) return s.barA;
    const was = isCurrentBar(name, s.beat - 1) && s.newest;
    return s.barA * (was ? 1 - (1 - FAINT) * seg(s.grow, 0, 0.3) : FAINT);
  }
  function dimsNow() {
    const g = s.grow;
    const out = [];
    const x = s.x;
    const pair = (name, from, m, to, y, text) => {
      const a = barAlpha(name);
      if (a <= 0) return;
      const lit = isCurrentBar(name, s.beat) && s.beat === barBeat(name) && s.newest !== '';
      const late = OBJECT_AT[s.beat] ? 0.25 : 0; // an object glows on its own first
      const k0 = lit ? seg(g, late, late + 0.3) : 1;
      const k1 = lit ? seg(g, late + 0.3, late + 0.6) : 1;
      const faint = a < 0.99 && s.barA >= 1;
      if (k0 > 0) out.push({ id: `${name}a`, x0: from, x1: m, y, k: k0, lit, a, faint, drop0: TIP, drop1: TOP, text, spots: ON_DIM });
      if (k1 > 0)
        out.push({
          id: `${name}b`,
          x0: m,
          x1: to,
          y,
          k: k1,
          lit,
          a,
          faint,
          drop0: TOP,
          drop1: TIP,
          text,
          spots: name === 'd1' ? DIM_R : name === 'd2' ? DIM_L : ON_DIM,
        });
    };
    const r1 = imageAt(x, 'r', 1);
    const l1 = imageAt(x, 'l', 1);
    const l2 = imageAt(x, 'l', 2);
    // on the way into the row the book's distances fade out
    const names = s.beat === 7 && s.busy && s.grow === 0 ? barsAt(6) : barsAt(s.beat);
    if (names.includes('d1')) pair('d1', x, M.m1, r1, rowAt(0), t('l_d1'));
    if (names.includes('d2')) pair('d2', x, M.m2, l1, rowAt(0), t('l_d2'));
    // the book's d₃ and d₄ are measured from M₁; round M₂ the book has no name, so the number stands there
    if (names.includes('e')) pair('e', r1, M.m2, l2, rowAt(1), t('l_cm', { a: N(num(r1 - M.m2)) }));
    if (names.includes('d3')) pair('d3', l1, M.m1, imageAt(x, 'r', 2), rowAt(1), t('l_d3'));
    if (names.includes('d4')) pair('d4', l2, M.m1, imageAt(x, 'r', 3), rowAt(2), t('l_d4'));
    return out;
  }
  const barBeat = (name) => ({ d1: 1, d2: 2, e: 3, d3: 5, d4: 6 })[name];
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
    const stretches = r.points.length - 1;
    v.ray = { points: r.points, k, lit, a: s.rayA };
    r.via.forEach((q, i) => {
      // each dashed line follows the stretch that left that mirror; the last one comes after the ray has reached the eye
      const from = i === r.via.length - 1 ? stretches : i + 1;
      v.backs.push({ x0: q.from.x, y0: q.from.y, x1: q.x, y1: q.y, k: seg(k, from, from + 1), lit });
    });
    r.hits.forEach((h, i) => {
      if (k >= i + 1) v.points.push([h.x, h.y, 2.6, C.ray]);
    });
    v.points.push([s.x, CANDLE.flame, 2.8, C.ray]);
    v.eye = { x: r.eye.x, y: r.eye.y, tx: r.hits[r.hits.length - 1].x, ty: r.hits[r.hits.length - 1].y };
    if (!lit && k >= stretches) v.aim = { x: r.image, y: CANDLE.flame };
  }
  function applyWorld() {
    setting.setCandle(s.x);
    setting.setM2(s.quiz ? 1 : s.m2);
    // far along the row the plain candle does; x‴ keeps its detail where it is large, in the book's row and in the mirror
    setting.setDetail(inRow() && s.inside === 0 ? 3 : NAMED + 1);
    const ids = builtIds();
    const late = OBJECT_AT[s.beat] ? 0.25 : 0;
    const clockRow = s.grow * (ROW_ADDS.length * ROW_GAP + ROW_FADE);
    for (const q of row(0)) {
      let a = ids.includes(q.id) ? 1 : 0;
      if (a && s.newest === q.id) a = seg(s.grow, late + 0.05, 1);
      if (a && s.newest === 'row') {
        const i = ROW_ADDS.indexOf(q.id);
        if (i >= 0) a = seg(clockRow, i * ROW_GAP, i * ROW_GAP + ROW_FADE);
      }
      setting.setImage(q.id, a);
    }
    setting.setInside(s.inside);
    dia.clear();
    const v = dia.view;
    v.flash = s.flash;
    if (s.quiz) return applyQuiz(s.quiz);
    dimsShown = dimsNow();
    v.dims.push(...dimsShown);
    const object = OBJECT_AT[s.beat];
    const glowRest = s.beat < FAINT_LABELS_UNTIL ? 0.55 : 0; // while its label stands, the object keeps a soft glow
    if (object && (s.newest || s.flash > 0 || glowRest > 0)) {
      const glow = s.newest ? 1 : Math.max(s.flash, glowRest);
      v.halo = { x: imageAt(s.x, object[0], Number(object[1])), y: CANDLE.tip / 2, r: CANDLE.tip * 0.8, k: glow };
    }
    if (s.trace && !inRow() && s.rayA > 0) drawRay(s.trace, s.rayK, s.rayK < Number.POSITIVE_INFINITY);
  }

  // ── camera: each step frames what it is about, and flies there smoothly ────────────────────────────────
  const FRAMES = {
    start: { az: -25, el: 13, fov: FOV },
    one: { az: -24, el: 13, fov: FOV },
    book: { az: -20, el: 13, fov: FOV },
    two: { az: -12, el: 13, fov: FOV }, // the right x′ stands clear of M₁ and the candle for its step
    ray: { az: -12, el: 13, fov: FOV },
    row: { az: -26, el: 9, fov: FOV },
    inside: { pose: true, fov: 44 },
    'q-dim': { pose: true, fov: 44 },
  };
  const BEAT_FRAMES = ['start', 'one', 'both', 'two', 'ray', 'three', 'four', 'row', 'inside', 'book'];
  const frameKey = () => (s.quiz ? `q-${s.quiz.kind}` : BEAT_FRAMES[s.beat]);
  /** The frame with what a chosen ray adds to it: the eye. */
  const frameId = () => (pickedTrace && s.trace && !s.quiz ? `${frameKey()}:${s.trace[0]}` : frameKey());
  let camFrom = null;
  let camK = 1;
  let shownFrame = '';
  let flight = null; // the camera's move under way
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
    let x0 = s.quiz || s.beat >= 2 ? -24 : -13; // before M₂ comes the view holds only the candle and M₁
    let x1 = 24;
    let top = GLASS.top + 4;
    if (key === 'row') {
      x0 = -106;
      x1 = 136;
    } else {
      // early on the frame takes in all of an image's way, so the view stands still while the candle is dragged; from step 4
      // on the images need every pixel of a phone, so it takes in where they stand now
      const tight = s.quiz || s.beat >= FAINT_LABELS_UNTIL;
      for (const id of builtIds()) {
        const k = Number(id[1]);
        const a0 = imageAt(tight ? s.x : CANDLE.min, id[0], k);
        const a1 = imageAt(tight ? s.x : CANDLE.max, id[0], k);
        x0 = Math.min(x0, Math.min(a0, a1) - (tight ? 6 : 8));
        x1 = Math.max(x1, Math.max(a0, a1) + (tight ? 6 : 8));
      }
      if (s.quiz?.range) {
        x0 = Math.min(x0, s.quiz.range[0]);
        x1 = Math.max(x1, s.quiz.range[1]);
      }
      if (s.trace && (pickedTrace || RAY_AT[s.beat]) && !s.quiz) {
        const ex = s.trace[0] === 'r' ? -EYE.x - 6 : EYE.x + 6;
        x0 = Math.min(x0, ex);
        x1 = Math.max(x1, ex);
        top = Math.max(top, EYE.y + 3);
      }
      const rows = s.quiz ? (s.quiz.rows ?? 1) : barRows(s.beat);
      if (rows) top = Math.max(top, rowAt(rows - 1) + 7);
    }
    FRAME.min.set(x0, -2, -6);
    FRAME.max.set(x1, top, s.quiz ? 8 : FLOOR_Z + 2);
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
  const sphFrom = new THREE.Spherical();
  const sphTo = new THREE.Spherical();
  const arcV = new THREE.Vector3();
  function applyCamera() {
    if (s.userMovedCamera) return;
    const pz = poseNow();
    turnLimits(s.inside >= 1 && camK >= 1);
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      controls.target.lerpVectors(camFrom.target, pz.target, k);
      if (camFrom.arc) {
        // back from wherever the student turned the view: round the scene, never through it
        sphFrom.setFromVector3(arcV.subVectors(camFrom.position, camFrom.target));
        sphTo.setFromVector3(arcV.subVectors(pz.position, pz.target));
        let dTheta = (sphTo.theta - sphFrom.theta) % (2 * Math.PI);
        if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
        if (dTheta < -Math.PI) dTheta += 2 * Math.PI;
        arcV.setFromSphericalCoords(
          sphFrom.radius + (sphTo.radius - sphFrom.radius) * k,
          sphFrom.phi + (sphTo.phi - sphFrom.phi) * k,
          sphFrom.theta + dTheta * k,
        );
        camera.position.copy(controls.target).add(arcV);
      } else camera.position.lerpVectors(camFrom.position, pz.position, k);
      setFov(camFrom.fov + (pz.fov - camFrom.fov) * k);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
      setFov(pz.fov);
    }
    controls.update();
  }
  function flyCamera(duration = PACE.camera) {
    const arc = s.userMovedCamera;
    if (arc) {
      s.userMovedCamera = false;
      s.view = 'front';
      rotate.home();
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone(), fov: camera.fov, arc };
    camK = 0;
    flight = tweener.animate({
      key: 'camera',
      duration,
      ease: ease.linear,
      onUpdate: (k) => {
        camK = k;
        stage.invalidate();
      },
      onComplete: () => {
        camK = 1;
        flight = null;
        stage.invalidate();
      },
    }).finished;
    return flight;
  }
  /** After any change: when the state wants another frame, go there. */
  function followFrame(instant, duration = PACE.camera) {
    const key = frameId();
    if (key === shownFrame) return;
    const first = !shownFrame;
    shownFrame = key;
    if (first || instant) {
      tweener.cancel('camera');
      flight = null;
      camK = 1;
      s.userMovedCamera = false;
      rotate.home();
      if (s.view === '3d' && !first) s.view = 'front';
    } else flyCamera(duration);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    syncUI();
    if (animate) flyCamera();
    else {
      s.userMovedCamera = false;
      rotate.home();
      camK = 1;
    }
    stage.invalidate();
  }
  /** The student has taken the view: it stays where they leave it until the next step or the সামনে button. */
  function takeView() {
    if (s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    flight = null;
    camK = 1;
    s.turned = true;
    rotate.markUsed();
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  }
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${t.num(360)}°`,
    label: t('view_rotate'),
    pulse: Boolean(o.coach),
    at: 'bottom-right',
    zoom: [0.45, 1.6],
    when: () => s.inside < 1 || Boolean(s.quiz), // looking into M₁ the camera keeps to M₂'s side: no promise of 360°
    onTurn: takeView,
  });
  // the stage also says "resize" when it only lowers its pixel ratio, in the middle of a student's turn: that changes nothing here
  let viewW = stage.width;
  let viewH = stage.height;
  stage.onResize((w, h) => {
    if (w === viewW && h === viewH) return;
    viewW = w;
    viewH = h;
    s.userMovedCamera = false;
    rotate.home();
    if (s.view === '3d') {
      s.view = 'front';
      syncUI();
    }
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    placeHandle();
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
    for (const k of ['pose', 'reveal', 'flash', 'inside', 'm2', 'ray', 'bars', 'hold']) tweener.cancel(k);
    landing?.();
    landing = null;
    s.busy = false;
    s.grow = 1;
    s.flash = 0;
    s.newest = '';
    s.rayA = 1;
    s.barA = 1;
  }
  const run = (key, duration, fn, how = ease.linear) =>
    tweener.animate({
      key,
      duration,
      ease: how,
      onUpdate: (k) => {
        fn?.(k);
        draw();
      },
    }).finished;
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
  /**
   * One tap's worth, to the end, and then it waits: first the old ray fades and the camera goes to its frame, then the new thing
   * comes in slowly. Taps do nothing while it plays. A stop (the test, a set) lands on what the beat ends in.
   */
  async function play(next) {
    const my = ++token;
    const alive = () => my === token;
    tweener.cancel('flash');
    const ray = RAY_AT[next];
    const wasRay = Boolean(s.trace) && !ray;
    pickedTrace = false;
    s.busy = true;
    s.beat = next;
    s.reached = Math.max(s.reached, next);
    s.step = stepOfBeat(next);
    s.flash = 1;
    const id = REVEALS[next] ?? (next === 7 ? 'row' : '');
    s.newest = id;
    s.grow = id ? 0 : 1;
    if (ray) {
      s.trace = ray; // the eye is in the frame from the start
      s.rayK = 0;
      s.rayA = 1;
    }
    landing = () => {
      s.busy = false;
      s.m2 = next >= 2 ? 1 : 0;
      s.inside = next === 8 ? 1 : 0;
      s.trace = ray ?? '';
      s.rayK = Number.POSITIVE_INFINITY;
      s.barA = 1;
    };
    audio.tick();
    clearLabelsOf(next);
    if (s.userMovedCamera && frameId() === shownFrame) flyCamera();
    if (next === 2) {
      s.m2 = 0;
      draw({ duration: PACE.slide });
      await run('m2', PACE.slide, (k) => (s.m2 = k), ease.inOutCubic);
    } else if (next === 8) {
      draw({ duration: PACE.mirror });
      await run('inside', PACE.mirror, (k) => (s.inside = k));
    } else if (next === 9) {
      s.barA = 0;
      draw({ duration: PACE.mirror });
      await run('inside', s.inside > 0 ? PACE.mirror : PACE.camera, (k) => {
        s.inside = Math.min(s.inside, 1 - k);
        s.barA = k;
      });
    } else {
      draw();
      if (next === 7) {
        const bars = run('bars', PACE.bars, (k) => (s.barA = 1 - k));
        await bars;
      } else if (wasRay) await run('ray', PACE.fade, (k) => (s.rayA = 1 - k));
      if (alive() && flight) await flight;
    }
    if (!alive()) return;
    if (wasRay) {
      s.trace = '';
      s.rayA = 1;
      s.rayK = Number.POSITIVE_INFINITY;
    }
    if (next === 2) await run('hold', PACE.hold);
    if (!alive()) return;
    if (id) {
      const row = next === 7;
      const seconds = row ? ROW_ADDS.length * ROW_GAP + ROW_FADE : OBJECT_AT[next] ? PACE.withObject : PACE.reveal;
      await run('reveal', seconds, (k) => (s.grow = Math.min(0.999, k)));
    }
    if (!alive()) return;
    if (ray) {
      // straight stretch by straight stretch, then the dashed line back to where the light seems to come from
      const stretches = path(s.x, ray[0], Number(ray[1])).points.length - 1;
      await run('ray', (stretches + 1) * PACE.raySegment, (k) => (s.rayK = k * (stretches + 1)));
    }
    if (!alive()) return;
    s.grow = 1;
    s.newest = '';
    landing();
    landing = null;
    audio.success();
    draw();
    emitChange();
    fadeLit();
  }
  /** A step's word, or the panel's "again": back to where that step starts, and slowly through it. */
  function replay(step) {
    if (s.locked) return lockedNudge();
    if (!STEPS.includes(step) || phase() === 'busy') return;
    // no skipping ahead: the crowded picture is earned. The action is what comes next, so it says so
    if (!openSteps(s.reached).includes(step)) return action.flash();
    pickedTrace = false;
    clearLabels();
    if (step === 'book') return play(LAST_BEAT);
    tweener.cancel('flash');
    s.flash = 0;
    buildTo(step, 0);
    play(s.beat + 1);
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    if (phase() === 'busy') return;
    if (s.beat === LAST_BEAT) {
      quiz.start();
      return;
    }
    play(s.beat + 1);
  }

  // ── labels on the picture: pinned to what they name ────────────────────────────────────────────────────
  let action = null;
  const grip = { drop: 0, free: null, ux: 1, uy: 0, perCm: 1 };
  const gripPoint = new THREE.Vector3();
  /** On the table in front of the candle at x, stepped down the screen with the handle. */
  function onTrack(out, x) {
    out.set(x, 0.05, FLOOR_Z).project(camera);
    out.y -= (2 * grip.drop) / stage.height;
    return out.unproject(camera);
  }
  const gripAt = new THREE.Vector3();
  const trackMin = new THREE.Vector3();
  const trackMax = new THREE.Vector3();
  const candleHandle = createDragHandle(stage, {
    point: () => onTrack(gripAt, s.x),
    axis: 'x',
    direction: new THREE.Vector3(1, 0, 0),
    track: { from: () => onTrack(trackMin, CANDLE.min), to: () => onTrack(trackMax, CANDLE.max) },
    label: o.coach ? t('l_drag') : '',
    labelAt: 'left', // clear of the names on the table and of the corner's cue, whichever way the view has been turned
    aria: t('aria_candle'),
    pulse: Boolean(o.coach),
    when: () => s.beat >= 1 && !inRow() && s.inside === 0 && !s.quiz,
  });
  function placeHandle() {
    // it stays through a step, dimmed, so that it does not come and go: it can be used again when the step has played
    const free = canDrag() && camK >= 1;
    if (free !== grip.free) {
      grip.free = free;
      ui.canvasHost.classList.toggle('pm2-wait', !free);
    }
    if (s.beat < 1 || inRow() || s.inside !== 0 || s.quiz) return;
    // in a wide view the table is thin on the screen: the handle and its track step down, clear of the candle's foot
    gripPoint.set(s.x, 0, 0).project(camera);
    const foot = ((1 - gripPoint.y) / 2) * stage.height;
    gripPoint.set(s.x, 0.05, FLOOR_Z).project(camera);
    const px = ((gripPoint.x + 1) / 2) * stage.width;
    const py = ((1 - gripPoint.y) / 2) * stage.height;
    grip.drop = Math.max(0, foot + GRIP_CLEAR - py);
    // the candle's way on the screen, from any side: the drag goes along it
    gripPoint.set(s.x + 1, 0.05, FLOOR_Z).project(camera);
    const dx = ((gripPoint.x + 1) / 2) * stage.width - px;
    const dy = ((1 - gripPoint.y) / 2) * stage.height - py;
    const l = Math.hypot(dx, dy) || 1;
    grip.ux = dx / l;
    grip.uy = dy / l;
    grip.perCm = l;
  }
  const panelTab = ui.$('.pvc-panel-toggle');
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, rotate.el, panelTab, () => candleHandle.box(), () => action?.ringBox()],
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
  /** The flights into and out of the mirror cross everything: the picture's labels wait for the end. */
  function clearLabelsOf(beat) {
    if (beat === 8 || (beat === 9 && s.inside > 0)) clearLabels();
  }
  const ptr = new THREE.Vector3();
  const viewDir = new THREE.Vector3();
  const onScreen = { x: 0, y: 0 };
  /** Canvas pixels of a scene point. The object is reused: copy what you keep. */
  function toScreen(x, y, z = 0) {
    ptr.set(x, y, z).project(camera);
    onScreen.x = ((ptr.x + 1) / 2) * stage.width;
    onScreen.y = ((1 - ptr.y) / 2) * stage.height;
    return onScreen;
  }
  /** The ring where a dashed ray ends, in canvas pixels: the action's badge keeps off it. */
  function aimBoxes() {
    const a = dia.view.aim;
    if (!a) return [];
    const p = toScreen(a.x, a.y);
    return [{ left: p.x - 20, top: p.y - 20, right: p.x + 20, bottom: p.y + 20 }];
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
    { dx: 0, dy: 50 },
    { dx: -16, dy: 28 },
    { dx: 16, dy: 28 },
    { dx: 32, dy: 22 },
    { dx: -32, dy: 22 },
    { dx: -48, dy: 12 },
    { dx: 48, dy: 12 },
    { dx: -56, dy: -6 },
    { dx: 56, dy: -6 },
  ];
  // the candle's name keeps to the side away from M₁ and from x′, the handle being on the other side
  const CANDLE_SPOTS = [
    { dx: 0, dy: 26 },
    { dx: -36, dy: 22 },
    { dx: -48, dy: 12 },
    { dx: -56, dy: -6 },
    { dx: 36, dy: 22 },
    { dx: 48, dy: 12 },
  ];
  // along the row the images stand in close pairs: their names take turns, by reflections
  const ROW_UNDER = [{ dx: 0, dy: 26 }];
  const ROW_LOW = [{ dx: 0, dy: 50 }];
  const ABOVE = [
    { dx: 0, dy: -18 },
    { dx: 0, dy: -36 },
    { dx: 34, dy: -18 },
    { dx: -34, dy: -18 },
  ];
  const TOP_SPOTS = [
    { dx: 0, dy: -15 },
    { dx: 26, dy: -15 },
    { dx: -26, dy: -15 },
    { dx: 26, dy: 12 },
    { dx: -26, dy: 12 },
    { dx: 0, dy: -30 },
  ];
  const LONG_R = [
    { dx: 40, dy: 26 },
    { dx: 40, dy: 48 },
    { dx: 14, dy: 50 },
    { dx: 0, dy: 26 },
  ];
  const REAL_SPOTS = [
    { dx: 0, dy: -30 },
    { dx: -44, dy: -24 },
    { dx: 44, dy: -24 },
    { dx: -48, dy: 6 },
    { dx: 48, dy: 6 },
    { dx: 0, dy: 40 },
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
    { dx: 26, dy: -34 },
    { dx: -26, dy: -52 },
    { dx: 26, dy: -56 },
    { dx: 0, dy: -72 },
    { dx: 44, dy: -30 },
    { dx: -30, dy: -30 },
    { dx: 48, dy: -6 },
  ];
  const IN_FAR = [
    { dx: 30, dy: -52 },
    { dx: 44, dy: -30 },
    { dx: 58, dy: -8 },
    { dx: 0, dy: -72 },
  ];
  const M_IN_SPOTS = [
    { dx: 24, dy: 0 },
    { dx: -24, dy: 0 },
    { dx: 24, dy: 26 },
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
    const m2Here = q || s.m2 >= 1;
    const alongRow = Math.abs(camera.getWorldDirection(viewDir).x) > 0.94; // the student has turned the view end-on
    if (!flying && !inRow() && !inMirror) {
      const wide = stage.width >= 480 && !(s.beat >= 3 || q);
      label('m1', wide ? t('l_m1') : t('l_m1s'), at(M.m1, GLASS.top), INK, TOP_SPOTS, lineAvoid);
      if (m2Here) label('m2', wide ? t('l_m2') : t('l_m2s'), at(M.m2, GLASS.top), INK, TOP_SPOTS, lineAvoid);
    }
    if (!inRow() && !flying && !inMirror) label('x', s.beat === 0 && !q ? t('l_candle') : t('l_x'), at(s.x, 0, 4), INK, CANDLE_SPOTS);
    if (inMirror && settled) label('x', t('l_candle'), at(s.x, CANDLE.tip + 0.4), INK, REAL_SPOTS);
    if (inMirror && !q) {
      label('m1', t('l_m1s'), at(M.m1, 24, GLASS.halfW), INK, M_IN_SPOTS);
      for (const k of [1, 2, 3]) {
        // the view can be turned a little: an image that has left it takes its name along
        const inView = toScreen(imageAt(s.x, 'r', k), CANDLE.tip + 0.4).x;
        if (inView > 0 && inView < stage.width)
          label(`in${k}`, t(primes(k)), at(imageAt(s.x, 'r', k), CANDLE.tip + 0.4), INK, k === 3 ? IN_FAR : IN_SPOTS);
      }
    }
    if (!inRow() && !inMirror && !flying) {
      for (const id of ids) {
        // in the test the picture must not name what it asks, and the answer's own mark keeps its letter
        if (Number(id[1]) > NAMED || q?.kind === 'times' || (q?.kind === 'spot' && id === 'r2')) continue;
        if (s.newest === id && s.grow < 0.45) continue; // its name comes as it does
        const im = imageAt(s.x, id[0], Number(id[1]));
        // the first image says what it is, stepping outward, clear of the candle's own name
        const long = s.beat === 1 && !q && id === 'r1';
        const named = long ? t('l_image', { n: nameOf(id) }) : nameOf(id);
        const traced = s.trace === id && pickedTrace;
        const spots = long ? LONG_R : UNDER;
        label(`i${id}`, traced ? `<span class="pm2-new">${named}</span>` : highlight(id, named), at(im, 0, 4), INK, spots, lineAvoid);
      }
      for (const d of q ? (q.dims ?? []) : dimsShown) {
        const whole = d.k == null || d.k >= 1;
        if (!whole || (d.a ?? 1) < 0.2) continue;
        if (d.faint && s.beat >= FAINT_LABELS_UNTIL) continue;
        if (alongRow) {
          const ax = toScreen(d.x0, d.y).x;
          const ay = onScreen.y;
          toScreen(d.x1, d.y);
          if (Math.hypot(onScreen.x - ax, onScreen.y - ay) < EDGE_ON) continue;
        }
        const text = s.newest && d.lit ? `<span class="pm2-new">${d.text}</span>` : d.faint ? `<span class="pm2-faint">${d.text}</span>` : d.text;
        label(d.id, text, at((d.x0 + d.x1) / 2, d.y), INK, d.spots ?? ON_DIM);
      }
      if (s.trace && !q && dia.view.eye) {
        const e = dia.view.eye;
        label('eye', t('l_eye'), at(e.x, e.y), SLATE, EYE_SPOTS, lineAvoid, true); // the eye is drawn: its name may step aside
      }
      const object = !q && OBJECT_AT[s.beat];
      if (object && (s.beat < FAINT_LABELS_UNTIL || s.newest || s.flash > 0)) {
        const name = object[1] === '2' ? 'l_object2' : 'l_object';
        label('obj', t(name), at(imageAt(s.x, object[0], Number(object[1])), CANDLE.tip + 0.4), '#9a5300', ABOVE);
      }
    }
    if (inRow() && settled && !s.busy && s.inside === 0) {
      const small = stage.width < 460;
      label('more', small ? '…' : t('l_more'), at(126, CANDLE.tip + 6), INK, MORE_SPOTS);
      label('more2', small ? '…' : t('l_more0'), at(-96, CANDLE.tip + 6), INK, MORE_SPOTS);
      label('m1', t('l_m1s'), at(M.m1, GLASS.top), INK, TOP_SPOTS);
      label('m2', t('l_m2s'), at(M.m2, GLASS.top), INK, TOP_SPOTS);
      label('x', t('l_x'), at(s.x, 0, 4), INK, ROW_LOW);
      for (const id of ['r1', 'r2', 'r3', 'l1', 'l2', 'l3'])
        label(`i${id}`, nameOf(id), at(imageAt(s.x, id[0], Number(id[1])), 0, 4), INK, id[1] === '2' ? ROW_LOW : ROW_UNDER);
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
  const steady = { act: '', open: 0 };
  function outcome() {
    const d = distances(s.x);
    const a = N(num(d.d1));
    const b = N(num(d.d2));
    if (s.trace && !s.newest && pickedTrace) {
      const k = Number(s.trace[1]);
      return t('out_pick', { n: nameOf(s.trace), k }).replace('{chain}', chainWords(s.trace[0], k));
    }
    switch (s.beat) {
      case 0:
        return t('out_b0');
      case 1:
        return t('out_d1', { a });
      case 2:
        return t('out_d12', { a, b });
      case 3:
        return t('out_l2', { a: N(num(imageAt(s.x, 'r', 1) - M.m2)) });
      case 4:
        return t('out_ray', { k: 2 });
      case 5:
        return t('out_d3', { a: N(num(d.d3)) });
      case 6:
        return t('out_d4', { a: N(num(d.d4)) });
      case 7:
        return t('out_row');
      case 8:
        return t('out_light', { a: brightness(1), b: brightness(2), c: brightness(3) });
      default:
        return t('out_d34', { a: N(num(d.d3)), b: N(num(d.d4)) });
    }
  }
  function rule() {
    if (s.trace && !s.newest && pickedTrace) return t('rule_pick');
    return t(`rule_b${s.beat}`, { a: 100 - Math.round(REFLECTANCE * 100) });
  }
  // what the action says at each beat, and its number within its step
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    b0: ['act_b0', 1, ICONS.hand],
    b1: ['act_b1', '', ICONS.chevR],
    b2: ['act_b2', 1, ICONS.hand],
    b3: ['act_b3', 2, ICONS.hand],
    b4: ['act_b4', 1, ICONS.hand],
    b5: ['act_b5', 2, ICONS.hand],
    b6: ['act_b6', 1, ICONS.hand],
    b7: ['act_b7', 2, ICONS.hand],
    b8: ['act_b8', '', ICONS.chevR],
    b9: ['act_b9', '', ICONS.chevR],
  };
  function panel() {
    if (s.quiz) return;
    const ph = phase();
    sheet.outcome(outcome());
    sheet.rule(rule());
    sheet.choose(s.step);
    const open = openSteps(s.reached).length;
    if (open !== steady.open) {
      steady.open = open;
      sheet.words.forEach((b, i) => {
        b.classList.toggle('pm2-shut', i >= open);
        b.setAttribute('aria-disabled', String(i >= open));
      });
    }
    sheet.next(ph === 'busy' || s.beat >= LAST_BEAT ? null : stepOfBeat(s.beat + 1) === s.step ? null : stepOfBeat(s.beat + 1));
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    note.hidden = !s.trace || inRow();
  }
  function draw({ instant = false, duration = PACE.camera } = {}) {
    wakeFlames();
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
    if (phase() === 'busy') return null;
    if (s.beat === 0) return ringPoint.set(M.m1, 16, 0);
    if (s.beat === 3) return ringPoint.set(s.x, 12, 0);
    if (s.beat === 7) return ringPoint.set(M.m1, 25, 0);
    const next = OBJECT_AT[s.beat + 1];
    return next ? ringPoint.set(imageAt(s.x, next[0], Number(next[1])), 9, 0) : null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_b0',
    target: actionSpot,
    radius: 20,
    avoid: [ui.corner, ui.hint, note, rotate.el, () => anno.boxes(), aimBoxes, lineBoxes],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── dragging the candle, and tapping an image ──────────────────────────────────────────────────────────
  function onCandle(x, y, touch) {
    if (!canDrag()) return false;
    if (candleHandle.hit(x, y)) return true;
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
      s.drag = { id: e.pointerId, x: p.x, y: p.y, from: s.x, moved: 0, ux: grip.ux, uy: grip.uy, perCm: Math.max(0.5, grip.perCm) };
      action.hide('drag');
      audio.unlock();
      emit('dragstart', { part: 'candle' });
      e.preventDefault();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const p = hostXY(e);
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const along = (p.x - g.x) * g.ux + (p.y - g.y) * g.uy;
    g.moved = Math.max(g.moved, Math.abs(along));
    const next = snapCandle(g.from + along / g.perCm);
    if (next !== s.x) {
      s.x = next;
      s.dragged = true;
      candleHandle.markUsed();
      if (pickedTrace) {
        pickedTrace = false;
        s.trace = RAY_AT[s.beat] ?? '';
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
    controls.enabled = !s.locked;
    action.show('drag');
    emit('dragend', { part: 'candle' });
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
      s.trace = pickedTrace ? id : (RAY_AT[s.beat] ?? '');
      s.rayK = Number.POSITIVE_INFINITY;
      if (pickedTrace) {
        // its chain, stretch by stretch
        const stretches = path(s.x, id[0], Number(id[1])).points.length - 1;
        s.rayK = 0;
        const my = token;
        run('ray', (stretches + 1) * PACE.raySegment, (k) => (s.rayK = k * (stretches + 1))).then((ok) => {
          if (!ok || my !== token) return;
          s.rayK = Number.POSITIVE_INFINITY;
          draw();
        });
      } else tweener.cancel('ray');
      draw();
      emitChange();
    }
  });
  ui.canvasHost.addEventListener('pointercancel', (e) => {
    tap = null;
    endDrag(e);
  });

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
    s.inside = q.inside ? 1 : 0;
    clearLabels();
    applyWorld();
    shownFrame = frameId();
    stage.invalidate();
  }
  // the kit's quiz compares numbers: every choice here is a number, and a choice's note is found by that number
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
      const x = pick(PAIR_X);
      const d = distances(x);
      const c = pairChoices(x);
      quizScene({ kind, show: ['r1'], rows: 1, dims: [dim('qd', x, M.m1, rowAt(0), t('l_cm', { a: N(num(d.d1)) }))] }, x);
      const wrong = [c.same, c.gap, c.other];
      return {
        text: t('q_pair'),
        answer: c.answer,
        wrong,
        label: cm,
        notes: notesOf([
          [c.same, t('n_pair_same')],
          [c.gap, t('n_pair_gap')],
          [c.other, t('n_pair_other')],
        ]),
        reveal: t('a_pair', { d: num(d.d1), g: num(c.answer) }),
      };
    }
    if (kind === 'times') {
      const side = pick(['r', 'l']);
      const k = pick([1, 2, 3, 4]);
      const x = pick([-4, 4, 6]);
      const im = imageAt(x, side, k);
      // the row behind the one mirror, big enough to count, and the first image behind the other
      const other = side === 'r' ? 'l' : 'r';
      const show = [1, 2, 3, 4].map((n) => `${side}${n}`).concat(`${other}1`);
      quizScene({ kind, show, rows: 0, tags: [{ id: 'qt', text: t('l_q'), x: im, y: 0, z: 4 }] }, x);
      const others = timesChoices(k).filter((n) => n !== k);
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
      const places = shuffle(spotChoices(x));
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
      const c = sumChoices(x, Math.random() < 0.5);
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
      const wrong = [c.d3, c.two, c.last];
      return {
        text: t('q_sum', { g: M.gap }),
        answer: c.answer,
        wrong,
        label: cm,
        notes: notesOf([
          [c.d3, t('n_sum_d3')],
          [c.two, t('n_sum_two')],
          [c.last, t(`n_sum_${c.lastNote}`)],
        ]),
        reveal: t('a_sum', { a: num(c.answer), g: M.gap, b: num(d.d1), c: num(M.gap + d.d1) }),
      };
    }
    // in the mirror itself: which of the four marked images has the least light?
    const x = pick([-4, 3, 5]);
    const marks = shuffle([1, 2, 3, 4]);
    const tags = marks.map((k, j) => ({
      id: `qm${j}`,
      text: `<b>${letters[j]}</b>`,
      x: imageAt(x, 'r', k),
      y: CANDLE.tip + 0.4,
      spots: IN_SPOTS,
    }));
    quizScene({ kind, show: [], inside: true, tags }, x);
    const answer = marks.indexOf(4);
    const wrong = [0, 1, 2, 3].filter((j) => j !== answer);
    return {
      text: t('q_dim'),
      answer,
      wrong,
      label: (j) => t('c_image', { x: letters[j] }),
      notes: notesOf(wrong.map((j) => [j, t('n_dim', { k: marks[j] })])),
      reveal: t('a_dim', { x: letters[answer], k: 4, a: brightness(4) }),
    };
  }
  const saved = { x: CANDLE.start, inside: 0, trace: '', picked: false };
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
        // on "take it again" the learn state is already saved, and this is the last question's scene
        if (!s.quiz) Object.assign(saved, { x: s.x, inside: s.inside, trace: s.trace, picked: pickedTrace });
        s.inside = 0;
        pickedTrace = false;
        order = ['pair', 'times', 'spot', 'sum', 'dim'];
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
        pickedTrace = saved.picked;
        s.rayK = Number.POSITIVE_INFINITY;
        clearLabels();
        syncUI();
        shownFrame = frameId();
        flyCamera(QUIZ_FLIGHT);
        draw();
      },
      async prepare(i, alive, say) {
        const q = prepare(i);
        qCurrent = q;
        say(' ');
        ui.$('.pvc-q-text').innerHTML = q.text;
        const done = await flyCamera(QUIZ_FLIGHT);
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
        return `${q.reveal}${why ? ` <span class="pm2-why">${t('n_pick', { x: q.label(picked.value) })} ${why}</span>` : ''}`;
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
    if (phase() === 'busy') return;
    s.x = CANDLE.start;
    if (s.view === '3d') s.view = 'front';
    replay(s.step);
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
    if (b.dataset.example) replay(b.dataset.example);
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
        s.dragged = true;
        candleHandle.markUsed();
        if (pickedTrace) {
          pickedTrace = false;
          s.trace = RAY_AT[s.beat] ?? '';
        }
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
      beat: s.beat,
      reached: s.reached,
      open: openSteps(s.reached),
      m2: s.m2,
      inside: s.inside >= 1,
      images: builtIds().map((id) => ({ id, x: +imageAt(s.x, id[0], Number(id[1])).toFixed(4) })),
      trace: s.trace ? traced(s.trace) : null,
      frame: shownFrame,
      handle: { shown: candleHandle.visible, used: s.dragged },
      turned: s.turned,
      azimuth: +THREE.MathUtils.radToDeg(controls.getAzimuthalAngle()).toFixed(1),
      pixelRatio: stage.pixelRatio,
      question: s.quiz && qCurrent ? { kind: s.quiz.kind, answer: qCurrent.label(qCurrent.answer) } : null,
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
      if ((p.step && STEPS.includes(p.step)) || p.stage != null) {
        stopMotion();
        buildTo(p.step && STEPS.includes(p.step) ? p.step : s.step, p.stage ?? 0);
        pickedTrace = false;
        clearLabels();
      }
      if (p.trace !== undefined) {
        stopMotion();
        pickedTrace = Boolean(p.trace && SIDES[p.trace[0]] && Number(p.trace[1]) <= COUNT);
        s.trace = pickedTrace ? p.trace : (RAY_AT[s.beat] ?? '');
        s.rayK = Number.POSITIVE_INFINITY;
      }
      if (p.x != null) {
        stopMotion();
        const x = snapCandle(Number(p.x));
        if (animate) await moveTo(x, 0.8);
        else s.x = x;
      }
      if (!animate) camK = 1;
      draw({ instant: !animate });
      if (p.azimuth != null || p.polar != null) {
        // the view turned from outside, as a finger would turn it (the pictures and the measurements use this)
        stage.render();
        takeView();
        const offset = camera.position.clone().sub(controls.target);
        const q = new THREE.Spherical().setFromVector3(offset);
        if (p.azimuth != null) q.theta = THREE.MathUtils.degToRad(Number(p.azimuth));
        if (p.polar != null) q.phi = THREE.MathUtils.degToRad(Number(p.polar));
        camera.position.copy(controls.target).add(offset.setFromSpherical(q));
        controls.update();
        stage.invalidate();
      }
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      stopMotion();
      s.x = CANDLE.start;
      pickedTrace = false;
      s.reached = 0;
      buildTo('one', 0);
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
