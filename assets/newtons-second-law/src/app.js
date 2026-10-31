// Textbook 3.6: a live cart/passenger system, one or two external pushers, constant-mass F = ma,
// optional 20 N resistance, and a 3D free-body diagram driven by the same motion state.
// The shared clean sheet keeps one main action, measured comparisons, and a separate derivation.
import * as THREE from 'three';
import { createVector } from './arrow.js';
import { createForceDiagram } from './force-diagram.js';
import { createGraph } from './graph.js';
import { createPresentation } from './presentation.js';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createMaterials } from '@shared/student/materials.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { fitPose } from './camera.js';
import { CART, createCartMaterials } from './cart.js';
import { playbackOf, playTime, SLOW } from './clock.js';
import { createI18n } from './i18n.js';
import {
  BUFFER_X,
  CALC_CASES,
  CART_MASS,
  CART_OWN_MASS,
  RIDER_MASS,
  forceBalance,
  calcChoices,
  doubleChoices,
  EXAMPLE_IDS,
  EXAMPLES,
  GIVE,
  markTimes,
  measured,
  measuredSeg,
  momentum,
  PAIR_CASES,
  PERSON_FORCE,
  PUSH_TIME,
  pairRatio,
  planOf,
  plain,
  RATIO_KEYS,
  round,
  runAt,
  SACK_MASS,
  START_X,
  stampTimes,
} from './physics.js';
import { createFloor, createMarks, createRig, FLOOR } from './scene.js';

export const DEFAULTS = {
  friction: 0,
  diagram: false,
  example: 'base', // 'base' | 'force' | 'mass' | 'back'
  at: '', // s after the push began: start with the run already going (for pictures)
  speed: SLOW, // run s per real s: 0.5 (slow, the arrows grow in and the clock holds at each whole second) or 1
  tried: '', // examples already tried, e.g. 'base,force' (their accelerations show)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the cart pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per quantity, as in the chapter's other figures (docs/book-notes.md)
export const COLORS = {
  force: '#e8590c',
  acc: '#0c8599',
  vel: '#1c6fd9',
  mom: '#2f9e44',
  momText: '#237a35',
  accText: '#087d72',
  mass: '#495057',
  net: '#203345',
};
const F_SCALE = 0.0077; // m of arrow per newton (100 N: 0.77 m)
const A_SCALE = 0.7; // m of arrow per ms⁻² (2 ms⁻²: 1.4 m)
const A_GAP = 0.78; // m between the force's arrow and the acceleration's over it (room for the force's label between them)
const A_GAP_WIDE = 0.42; // the same on a wide, low view (the force's label is then beside its tip)
const A_GAP_SHORT = 0.62; // the same on a short stage (each label behind its arrow's tail, one over the other)
const DP_LEN = 0.7; // m: the change of momentum's arrow (its direction is what it shows)
const V_SCALE = 0.25; // m of arrow per m/s (4 m/s: 1 m)
const Z_NEAR = 0.6; // the velocity arrow on the cart's near side
const V_Y = 0.12; // the velocity arrow: in front of the cart, low, on its near side (below the feet of anyone there)
const DIR_WINDOW = 4.5; // m of the lane in view for the question about the direction (the person in front is in it)
const STOP_SHOW = 1.6; // s the words for the sacks stopping the cart stay
const COAST_MIN = 0.6; // s: a coast shorter than this is too quick to need words
const DOUBLE_TAP = 450; // ms: a second request this soon after one is ignored
const PAIR_B = 4.3; // m: where the second cart's front waits in the two-cart question
const XP = new THREE.Vector3(1, 0, 0);
const XN = new THREE.Vector3(-1, 0, 0);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const NB = ' ';
  /** A number for a sentence: no trailing zeros, a real minus sign (t() turns its digits Bangla). */
  const sgn = (x, d = 2) => plain(x, d).replace('-', '−');
  const fix = (x, d) => round(x, d).toFixed(d).replace('-', '−');
  const MS2 = 'ms<sup>−2</sup>';

  root.classList.add('pvc', 'ns');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'examples', results: true, items: EXAMPLE_IDS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'home', label: 'act_home', icon: ICONS.reset },
        { act: 'pause', label: 'act_pause', icon: ICONS.pause },
      ],
      lines: { action: 2, outcome: 1, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const extras = document.createElement('div');
  extras.className = 'ns-extras';
  extras.innerHTML = `<button type="button" data-act="diagram" aria-pressed="false"></button><button type="button" data-act="friction" aria-pressed="false"></button><button type="button" data-act="speed" aria-pressed="false"></button>`;
  ui.$('.pvc-examples').after(extras);
  const liveFormula = document.createElement('div');
  liveFormula.className = 'ns-formula';
  // the বেগ–সময় গ্রাফ (its steepness is a) beside the force, the mass and the acceleration now, each with a bar
  liveFormula.innerHTML = `<div class="ns-formula-head"><small>${t('graph_name')}</small><button type="button" data-act="maths" aria-label="${t('formula_title')}"><b>${t('formula_main')}</b> <span>${t('formula_open')}</span></button></div><div class="ns-formula-body"><div class="ns-graph"></div><div class="ns-formula-values"></div></div>`;
  const formulaValues = liveFormula.querySelector('.ns-formula-values');
  const graph = createGraph(liveFormula.querySelector('.ns-graph'), { t, N, colors: { acc: COLORS.acc, accText: COLORS.accText, vel: COLORS.vel } });
  ui.$('.pvc-rule').before(liveFormula);
  const mathDialog = document.createElement('dialog');
  mathDialog.className = 'ns-math-dialog';
  mathDialog.setAttribute('aria-label', t('formula_title'));
  root.append(mathDialog);
  let mathResume = false;
  const outcomeEl = ui.$('.pvc-outcome');
  const note = document.createElement('div');
  note.className = 'ns-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 0.05, far: 120, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 1.5;
  controls.maxDistance = 40;
  controls.enablePan = false;
  controls.enableRotate = false;
  const presentation = createPresentation(stage, o.bg === 'transparent');
  const M = createMaterials(stage.renderer);
  const CM = createCartMaterials(M.wood);
  const world = new THREE.Group();
  world.name = 'NewtonsSecondLaw';
  scene.add(world);
  const floor = createFloor(CM);
  const rig = createRig({ M: CM, name: 'Handcart' });
  const rigB = createRig({ M: CM, name: 'HandcartB' });
  rigB.root.visible = false;
  rigB.root.userData.noExport = true;
  const marks = createMarks();
  marks.mesh.userData.noExport = true;
  world.add(floor.group, rig.root, rigB.root, marks.mesh);

  const arrow = (color, name) => createVector(color, name, name.startsWith('ForceArrow') ? '#fff2c4' : '#142b46');
  const arrows = {
    F: arrow(COLORS.net, 'ForceArrow'),
    a: arrow(COLORS.acc, 'AccelerationArrow'),
    v: arrow(COLORS.vel, 'VelocityArrow'),
    dp: arrow(COLORS.mom, 'MomentumChangeArrow'),
    FB: arrow(COLORS.net, 'ForceArrowB'),
    aB: arrow(COLORS.acc, 'AccelerationArrowB'),
  };
  for (const a of Object.values(arrows)) {
    a.root.userData.noExport = true;
    world.add(a.root);
  }
  // the velocity stamped on the floor at each whole second of the measured push (faint copies of the blue arrow)
  const ghosts = [0, 1, 2].map((i) => createVector(COLORS.vel, `VelocityStamp${i}`, '#142b46', 0.55));
  for (const g of ghosts) {
    g.root.userData.noExport = true;
    world.add(g.root);
  }

  const diagram = createForceDiagram();
  world.add(diagram.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.position.set(1.4, 7, 3.2);
    sun.target.position.set(1.4, 0, 0);
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 2.5, bottom: -2.5, near: 2, far: 14 });
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0005;
    scene.add(sun, sun.target);
    floor.floor.receiveShadow = true;
    for (const obj of [rig.root, rigB.root, floor.pile])
      obj.traverse((m) => {
        if (m instanceof THREE.Mesh && m.material && m.material.visible !== false) m.castShadow = true;
      });
  }

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    example: EXAMPLE_IDS.includes(o.example) ? o.example : 'base',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    friction: Number(o.friction) === 20 ? 20 : 0,
    diagram: Boolean(o.diagram),
    speed: Number(o.speed) === 1 ? 1 : SLOW,
    /** @type {any} */
    run: null, // { plan, pb, from, anchor, pausedAt, holdAt, quiet, known, done, hit, marks, stamps, knownP, doneP }
    results: { base: null, force: null, mass: null, back: null }, // the acceleration found (ms⁻²)
    seen: [], // examples in the order their results came
    scene: 'lane', // 'lane' | 'rig' (close on the cart, a test question) | 'pair' (two carts, a test question)
    show: { F: true, a: true, v: true, dp: 'auto' }, // the arrows (the test hides some until the answer); dp: 'auto' = while the person in front pushes back
    follow: 0, // m the side view has moved along the lane with the cart
    userMovedCamera: false,
  };
  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let token = 0; // bumped by anything that calls off what is pending
  let lastPush = Number.NEGATIVE_INFINITY;

  // ── the run ─────────────────────────────────────────────────────────────────
  /**
   * The run's clock now: t (s after the push began, the physics' time), grow (0…1: the force and acceleration
   * arrows growing in before the cart moves) and held (the whole second the clock holds at, or null).
   */
  const clock = () => {
    const run = s.run;
    if (!run) return { t: 0, grow: 1, held: null };
    if (run.pausedAt != null) return { t: run.pausedAt, grow: 1, held: null };
    const c = playTime(Math.max(0, (now() - run.anchor) / 1000), { ...run.pb, from: run.from });
    if (run.holdAt != null && c.t >= run.holdAt) {
      run.pausedAt = run.holdAt; // a test question (or a picture) holds the scene here
      return { t: run.holdAt, grow: 1, held: null };
    }
    return c;
  };
  const runTime = () => clock().t;
  /**
   * Where the slow clock holds: at each stamp, a hair inside the measured push (its end just before the push stops,
   * its start just after the push back begins), so the force and acceleration arrows are still on the picture.
   */
  const holdsOf = (plan, stamps) => {
    const seg = measuredSeg(plan);
    return stamps.map((x) => (x <= seg.t0 + 1e-9 ? x + 1e-8 : x - 1e-8));
  };
  /** The clock goes on from where it is now (after a pause, or at another speed), with no lead-in. */
  function reanchor(run, t) {
    run.from = t;
    run.anchor = now();
    run.pb.lead = 0;
  }
  function state() {
    if (!s.run) return { phase: 'rest', x: START_X, v: 0, a: 0, F: 0, applied: 0, drag: 0, contact: 0, t: 0, seg: null };
    const c = clock();
    // from the tap on the push has begun (the force acts, its arrows grow in during the lead-in), the clock at 0
    return runAt(s.run.plan, Math.max(c.t, 1e-9));
  }
  /**
   * What the panel and the labels show now, from one place (so they always agree): the time to 0.1 s in the piece
   * being measured, and the velocity worked out from that shown time.
   */
  function shown(r = state()) {
    const run = s.run;
    if (!run || !r.seg) return { t: 0, v: round(r.v, 2) };
    if (r.phase === 'push' || r.phase === 'brake') {
      const ts = Math.min(r.seg.dur, Math.floor((r.t - r.seg.t0) * 10 + 1e-6) / 10);
      return { t: ts, v: round(r.seg.v0 + r.seg.a * ts, 2) };
    }
    return { t: 0, v: round(r.v, 2) };
  }

  function setupRig(target, cfg, { animate = false } = {}) {
    const before = target.cart.load;
    target.setup(cfg);
    if (animate && cfg.sacks > before) {
      tweener.animate({
        key: `load-${target.root.name}`,
        duration: 0.45,
        ease: ease.outCubic,
        onUpdate: (k) => {
          target.cart.setLoad(cfg.sacks, 1 - k);
          stage.invalidate();
        },
      });
    }
    target.place(null);
  }

  /** Back to the start: nothing moving, no marks, the people ready, the sacks of the pile back in place. */
  function goHome({ animate = true, follow = true } = {}) {
    if (s.run) {
      s.run.resolveKnown(false);
      s.run.resolveDone(false);
    }
    s.run = null;
    marks.clear();
    floor.squash(0);
    rig.place(null);
    placeArrows(state());
    syncStamps();
    if (s.scene === 'lane' && follow) followHome(animate);
    refresh();
    emitChange();
  }

  /** The push starts (at: jump that many seconds into the run). */
  function startRun({ quiet = false, at = null, cfg = null } = {}) {
    const source = cfg ?? s.example;
    const plan = planOf(typeof source === 'string' && s.mode === 'explore' && s.friction ? { ...EXAMPLES[source], friction: s.friction } : source);
    if (typeof source === 'string') plan.id = source;
    let resolveKnown;
    let resolveDone;
    const stamps = stampTimes(plan);
    // the test plays at the chosen speed but without the lead-in and the holds (the scene is what to read there)
    const pb = playbackOf(s.speed, holdsOf(plan, stamps));
    if (s.mode === 'quiz' || at != null) pb.lead = 0;
    if (s.mode === 'quiz') pb.stops = [];
    s.run = {
      plan,
      pb,
      from: at ?? 0,
      anchor: now(),
      stamps,
      pausedAt: null,
      quiet,
      known: false,
      done: false,
      hit: false,
      marks: markTimes(plan), // when the cart's front leaves its marks (s after the push began)
      knownP: new Promise((r) => (resolveKnown = r)),
      doneP: new Promise((r) => (resolveDone = r)),
    };
    s.run.resolveKnown = resolveKnown;
    s.run.resolveDone = resolveDone;
    marks.clear();
    floor.squash(0);
    if (!quiet) audio.pop();
    emit('push', { example: s.example });
    tick(true);
    stage.invalidate();
  }

  function resumeRun() {
    const run = s.run;
    if (!run || run.pausedAt == null) return;
    reanchor(run, run.pausedAt);
    run.pausedAt = null;
    stage.invalidate();
  }
  /** Slow (½×: the arrows grow in, the clock holds at each whole second) or real time; a run on goes on from here. */
  function setSpeed(value) {
    const speed = Number(value) === 1 ? 1 : SLOW;
    if (speed === s.speed) return;
    s.speed = speed;
    const run = s.run;
    if (run && !run.done) {
      const c = clock();
      const pb = playbackOf(speed, holdsOf(run.plan, run.stamps));
      if (s.mode === 'quiz') pb.stops = [];
      run.pb = pb;
      if (run.pausedAt == null) reanchor(run, c.t);
      else run.pb.lead = 0;
    }
    refresh();
    emitChange();
  }

  /** Each frame while a run is on: the cart and the people where the run says, the arrows, the marks, the events. */
  function tick(force = false) {
    const run = s.run;
    if (!run) return false;
    if ((run.done || run.pausedAt != null) && !force) return false;
    const c = clock();
    const time = c.t;
    if (c.held != null && run.lastHeld !== c.held) {
      run.lastHeld = c.held; // a soft tick as the clock holds at a whole second
      if (!run.quiet) audio.tick();
    }
    const r = rig.place(run.plan, Math.max(time, 1e-9)); // from the push button on, the hands are on the cart
    if (s.scene === 'lane') setFollow(Math.max(s.follow, followFor(r)));
    placeArrows(state());
    syncMarks(time);
    syncStamps(time);
    const m = measured(run.plan);
    if (!run.known && time >= m.at - 1e-9) {
      run.known = true;
      if (run.plan.id && s.mode === 'explore') {
        s.results[run.plan.id] = m.a;
        s.seen = s.seen.filter((id) => id !== run.plan.id).concat(run.plan.id);
        emit('result', { example: run.plan.id, acceleration: m.a });
      }
      run.resolveKnown(true);
      emitChange();
    }
    if (!run.plan.back && run.plan.endReason !== 'friction') {
      if (r.phase === 'stop' || r.phase === 'stopped') {
        if (!run.hit) {
          run.hit = true;
          if (!run.quiet) audio.contact();
        }
        const stop = run.plan.segs.find((x) => x.kind === 'stop');
        floor.squash(r.phase === 'stopped' || !stop ? GIVE : Math.max(0, r.x - stop.x0));
      } else floor.squash(0);
    }
    if (!run.done && r.phase === 'stopped') {
      run.done = true;
      // nothing moves now, so nothing draws again by itself: look again when the words for the stop are due to go
      if (!run.plan.back)
        setTimeout(
          () => {
            if (s.run === run) refresh();
          },
          STOP_SHOW * 1000 + 60,
        );
      run.resolveDone(true);
      emitChange();
    }
    refresh();
    return run.pausedAt == null && r.phase !== 'stopped';
  }
  stage.addTicker(() => tick());

  /** The marks the cart's front leaves on the floor every second, added as it gets there. */
  function syncMarks(time) {
    const run = s.run;
    if (!run) return;
    const base = rig.baseX;
    while (marks.count < run.marks.length && run.marks[marks.count] <= time + 1e-9) marks.add(base + runAt(run.plan, run.marks[marks.count]).x);
  }

  /** The velocity stamped at each whole second of the measured push, once the run has got there. */
  function syncStamps(time = runTime()) {
    const run = s.run;
    for (const [i, g] of ghosts.entries()) {
      const at = run?.stamps[i];
      if (at == null || at > time + 1e-6 || s.scene !== 'lane' || diagram.root.visible) {
        g.hide();
        continue;
      }
      const v = round(runAt(run.plan, at).v, 2);
      if (v > 0.004) g.set(tmpG.set(rig.baseX + runAt(run.plan, at).x + 0.03, V_Y, Z_NEAR), XP, v * V_SCALE);
      else g.hide();
    }
    stage.invalidate();
  }
  /** The stamps shown now: { i, at (s), v (m/s), x (m, where the cart's front was) }. */
  const stampsShown = () => {
    const run = s.run;
    if (!run || s.scene !== 'lane' || diagram.root.visible) return [];
    const time = runTime();
    return run.stamps
      .slice(0, ghosts.length)
      .map((at, i) => ({ i, at, v: round(runAt(run.plan, at).v, 2), x: rig.baseX + runAt(run.plan, at).x }))
      .filter((st) => st.at <= time + 1e-6);
  };

  /**
   * The velocity at the start of the measured push and at each whole second of it so far, in a row on the view
   * ("০ → ১ → ২ m/s"): equal steps while the force acts, and the step each second is the acceleration.
   */
  function ladder() {
    const run = s.run;
    if (!run || s.mode !== 'explore' || diagram.root.visible) return '';
    const seg = measuredSeg(run.plan);
    const time = runTime();
    if (time < seg.t0 - 1e-6) return '';
    const values = [seg.v0, ...run.stamps.filter((at) => at > seg.t0 + 1e-6 && at <= time + 1e-6).map((at) => runAt(run.plan, at).v)];
    return `<span class="ns-ladder">${t('ladder', { list: values.map((v) => N(sgn(v))).join(' → ') })}</span>`;
  }

  const tmpA = new THREE.Vector3();
  const tmpG = new THREE.Vector3();
  /**
   * The force (orange, where it acts), the acceleration (teal, over the load, while the push lasts) and the velocity
   * (blue, in front). While the person in front pushes back, the change of momentum (green, in the same place as the
   * acceleration's arrow and the same way as the force) takes the acceleration's place: the panel works out that a.
   */
  function placeArrows(r) {
    const front = rig.front();
    // the lead-in: the force's arrow grows in first, then the acceleration's (the same way), before the cart moves
    const grow = s.run ? clock().grow : 1;
    const kF = ease.outCubic(Math.min(1, grow * 1.7));
    const kA = ease.outCubic(Math.min(1, Math.max(0, (grow - 0.45) / 0.55)));
    const balance = forceBalance(r, s.run?.plan.m ?? CART_MASS + rig.cfg.sacks * SACK_MASS, s.run?.plan.pushers ?? rig.cfg.pushers);
    diagram.root.visible = s.diagram && s.mode === 'explore' && s.scene === 'lane';
    diagram.set(front, balance, stage.height < 280);
    const [yF, yA] = arrowHeights(rig);
    // from the cart's middle; pushed back from the front, from the front rail where the person in front pushes
    const cx = r.F < 0 || r.a < 0 ? front + CART.rail.x : front - CART.length / 2;
    const way = r.F < 0 || r.a < 0 ? XN : XP;
    // the force on the cart and its acceleration, one over the other from the cart's middle: they always point the
    // same way, and their lengths compare (the force doubled: both double; the mass doubled: the same force, half a)
    if (s.show.F && Math.abs(r.F) > 1e-6)
      arrows.F.set(tmpA.set(cx, yF, 0), r.F > 0 ? XP : XN, kF * (r.phase === 'stop' ? 0.9 : Math.abs(r.F) * F_SCALE));
    else arrows.F.hide();
    const pushing = r.phase === 'push' || r.phase === 'brake';
    const dp = pushing && (s.show.dp === true || (s.show.dp === 'auto' && r.phase === 'brake'));
    if (dp && kA > 0) arrows.dp.set(tmpA.set(cx, yA, 0), way, kA * DP_LEN);
    else arrows.dp.hide();
    if (s.show.a && pushing && !dp && kA > 0 && Math.abs(r.a) > 1e-6) arrows.a.set(tmpA.set(cx, yA, 0), way, kA * Math.abs(r.a) * A_SCALE);
    else arrows.a.hide();
    const v = shown(r).v;
    if (s.show.v && v > 0.004) arrows.v.set(tmpA.set(front + 0.03, V_Y, Z_NEAR), XP, v * V_SCALE);
    else arrows.v.hide();
    if (diagram.root.visible) {
      arrows.F.hide();
      arrows.a.hide();
      arrows.dp.hide();
    }
    stage.invalidate();
  }

  /** A wide, low view (a phone on its side, a tablet): the arrows' labels go beside their tips, the arrows close together. */
  const roomy = () => wideness() >= 0.5;
  /** A short stage (a phone on its side, a small frame): little room over the arrows. */
  const shortStage = () => stage.height < 260;
  /** The heights of the force and the acceleration arrows over a cart: just over its load, and over that. */
  function arrowHeights(target, gap = shortStage() ? A_GAP_SHORT : roomy() ? A_GAP_WIDE : A_GAP) {
    const yF = Math.max(1.6, CART.rail.y, target.cart.top()) + 0.17;
    return [yF, yF + gap];
  }

  // ── labels on the scene ─────────────────────────────────────────────────────
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const tmpBox = new THREE.Box3();
  /** An object's box on the screen, in canvas pixels ({ left, top, right, bottom }), or null. */
  function screenBox(obj) {
    if (!obj.visible) return null;
    tmpBox.setFromObject(obj);
    if (tmpBox.isEmpty()) return null;
    return projectBox(tmpBox);
  }
  function projectBox(box) {
    let i = 0;
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners[i++].set(x, y, z).project(camera);
    const out = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (const c of corners) {
      const x = (c.x * 0.5 + 0.5) * stage.width;
      const y = (-c.y * 0.5 + 0.5) * stage.height;
      out.left = Math.min(out.left, x);
      out.right = Math.max(out.right, x);
      out.top = Math.min(out.top, y);
      out.bottom = Math.max(out.bottom, y);
    }
    return out;
  }
  const cartBoxes = [new THREE.Box3(), new THREE.Box3()];
  /** The visible cart (bed, wheels, load, the front rail), not its handles nor its hit box. */
  function cartBox(target = rig, i = 0) {
    const f = target.front();
    return cartBoxes[i].set(
      tmpA.set(f - CART.length - 0.02, 0, -CART.wheelZ - 0.04),
      new THREE.Vector3(f + 0.02, Math.max(CART.rail.y, target.cart.top()), CART.wheelZ + 0.04),
    );
  }
  /** What no label may cover: the arrows, the cart, the people. */
  function sceneBlockers() {
    const out = [];
    for (const a of [...Object.values(arrows), ...ghosts, ...(diagram.root.visible ? Object.values(diagram.arrows) : [])]) {
      const b = a.root.visible ? screenBox(a.root) : null;
      if (b) out.push(b);
    }
    out.push(projectBox(cartBox(rig, 0)));
    if (rigB.root.visible) out.push(projectBox(cartBox(rigB, 1)));
    for (const p of [...rig.people, ...(rigB.root.visible ? rigB.people : [])]) {
      const b = screenBox(p.root);
      if (b) out.push(b);
    }
    return out;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, note, () => action?.ringBox(), () => action?.box(), () => sceneBlockers()],
  });
  const spotsKey = new Map(); // id → the spots last given (a label whose spots change is placed again)
  const label = (id, opts) => {
    const key = opts.dynamicSpots ? JSON.stringify(opts.spots) : '';
    const { dynamicSpots, ...rest } = opts;
    if (anno.has(id)) {
      const change = { text: opts.text, color: opts.color, optional: opts.optional !== false };
      if (dynamicSpots && spotsKey.get(id) !== key) change.spots = opts.spots;
      anno.update(id, change);
    } else anno.add(id, { kind: 'callout', ...rest });
    spotsKey.set(id, key);
  };
  const tmpS = new THREE.Vector3();
  /**
   * Spots all round an arrow for a label at its middle: past its tip, over and under its middle, behind its tail,
   * in the order this frame's shape wants (they depend on how long the arrow is on the screen).
   */
  function aroundArrow(arrow, way, order) {
    tmpS.copy(arrow.root.position).project(camera);
    const tail = tmpS.x;
    tmpS.copy(arrow.tip).project(camera);
    const half = Math.round((Math.abs(tmpS.x - tail) * stage.width) / 4 / 8) * 8; // px, in steps of 8
    const groups = {
      tip: [0, 12, -12].map((dy) => ({ dx: way * (half + 10), dy })),
      over: SPOTS.over.slice(0, 6),
      tail: [0, -8, 8, -16].map((dy) => ({ dx: -way * (half + 10), dy })),
      under: [{ dx: 0, dy: 26 }],
    };
    return order.flatMap((g) => groups[g]);
  }
  const pts = {
    F: new THREE.Vector3(),
    a: new THREE.Vector3(),
    v: new THREE.Vector3(),
    m: new THREE.Vector3(),
    mk: new THREE.Vector3(),
    sack: new THREE.Vector3(),
    dp: new THREE.Vector3(),
    c: new THREE.Vector3(),
    stop: new THREE.Vector3(),
    st: ghosts.map(() => new THREE.Vector3()),
  };
  const mid = (a, out) => out.copy(a.root.position).add(a.tip).multiplyScalar(0.5);
  const SPOTS = {
    // a little higher than `above`: the force's label clears its own arrow's head and the acceleration's arrow
    over: [
      { dx: 0, dy: -28 },
      { dx: -32, dy: -28 },
      { dx: 32, dy: -28 },
      { dx: -32, dy: -40 },
      { dx: 32, dy: -40 },
      { dx: 0, dy: -40 },
      { dx: 0, dy: 26 },
    ],
    // the two carts' accelerations (the test): close over their arrows, the stage being low there
    pair: [
      { dx: 0, dy: -20 },
      { dx: 0, dy: -32 },
      { dx: 0, dy: 22 },
      { dx: 0, dy: 34 },
    ],
    above: [
      { dx: 0, dy: -28 },
      { dx: -32, dy: -28 },
      { dx: 32, dy: -28 },
      { dx: 0, dy: -42 },
      { dx: 0, dy: 26 },
      { dx: 0, dy: 40 },
    ],
    right: [
      { dx: 12, dy: 0 },
      { dx: 8, dy: -20 },
      { dx: 0, dy: 20 },
      { dx: -10, dy: 20 },
      { dx: 10, dy: 16 },
      { dx: 0, dy: 34 },
      { dx: -28, dy: 36 },
      { dx: -64, dy: 36 },
    ],
    below: [
      { dx: 0, dy: 20 },
      { dx: 0, dy: 34 },
      { dx: -30, dy: 26 },
      { dx: 30, dy: 26 },
    ],
  };

  /** The sacks have just stopped the cart (a short while: the words, then the ring on the cart takes over). */
  const stopWords = (r) =>
    s.mode === 'explore' &&
    s.run &&
    !s.run.plan.back &&
    s.run.plan.endReason !== 'friction' &&
    (r.phase === 'stop' || (r.phase === 'stopped' && r.t < s.run.plan.end + STOP_SHOW));
  let labelsWide = '';
  const tipSpots = (way) => [
    { dx: 10 * way, dy: 0 },
    { dx: 10 * way, dy: 12 },
    { dx: 10 * way, dy: -12 },
    { dx: 10 * way, dy: 26 },
    { dx: 10 * way, dy: -28 },
    { dx: 0, dy: 22 },
  ];
  /** Beside an arrow, past its tip (from its middle), on the side it points to. */
  const sideSpots = (way) => [
    { dx: 30 * way, dy: 0 },
    { dx: 30 * way, dy: 14 },
    { dx: 30 * way, dy: -14 },
  ];
  let mAfterV = false;
  let diagramLabelSet = '';
  function labelsFor() {
    const compactDiagram = stage.height < 430 || stage.width < 500;
    const activeDiagramLabels = `${compactDiagram}:${Object.entries(diagram.arrows)
      .filter(([, a]) => diagram.root.visible && a.root.visible)
      .map(([key]) => key)
      .join(',')}`;
    if (activeDiagramLabels !== diagramLabelSet) {
      for (const key of Object.keys(diagram.arrows)) anno.remove(`diagram-${key}`);
      diagramLabelSet = activeDiagramLabels;
    }
    for (const [key, arr] of Object.entries(diagram.arrows)) {
      const id = `diagram-${key}`;
      if (!diagram.root.visible || !arr.root.visible) {
        anno.remove(id);
        continue;
      }
      const fallbackSpots = [24, -24, 48, -48, 80, -80, 112, -112].flatMap((dx) => [0, 24, -24, 48, -48, 72, -72].map((dy) => ({ dx, dy })));
      const preferredSpots =
        key === 'normal'
          ? [
              { dx: 16, dy: -10 },
              { dx: -16, dy: -10 },
              { dx: 40, dy: -10 },
              { dx: -40, dy: -10 },
            ]
          : key === 'weight'
            ? [
                { dx: 18, dy: 0 },
                { dx: -18, dy: 0 },
                { dx: 48, dy: 0 },
                { dx: -48, dy: 0 },
              ]
            : [
                { dx: 18 * Math.sign(diagram.values[key]), dy: 0 },
                { dx: 0, dy: 24 },
                { dx: 0, dy: -24 },
              ];
      label(id, {
        text: t(`${compactDiagram ? 'd_short_' : 'd_'}${key}`, {
          v: sgn(['F1', 'F2', 'contact'].includes(key) ? diagram.values[key] : Math.abs(diagram.values[key])),
        }),
        point: () => diagram.point(key),
        color: key === 'weight' ? '#6741b5' : key === 'friction' ? '#b62249' : '#224866',
        spots: [...preferredSpots, ...fallbackSpots],
        optional: true,
      });
    }
    const lane = s.scene !== 'pair';
    const r = state();
    // The arrows' labels. On a tall view (a phone held upright) each over the middle of its arrow (a tip may be at the
    // edge of the view; a label never covers its arrow); on a wide, low one the force's beside its tip.
    const wide = roomy();
    // a short stage (a phone on its side, a small frame): the corner buttons are over the arrows, so the force's label
    // goes behind its tail and the acceleration's past its tip (the clock is then in the top corner, out of their way)
    const short = shortStage();
    // a phone held upright: the acceleration's and the velocity's labels on two lines (name over value) so they fit
    // past their tips; the force's label then goes behind its tail
    const narrow = !short && stage.width < 470;
    const layout = `${wide}:${short}:${narrow}`;
    if (layout !== labelsWide) {
      labelsWide = layout;
      for (const id of ['F', 'a', 'dp', 'v']) anno.remove(id);
    }
    const way = r.F < 0 || r.a < 0 ? -1 : 1;
    if (lane && arrows.F.root.visible)
      label('F', {
        text: t('l_force', { F: sgn(r.F || s.run?.plan?.F || 0) }),
        point: () => mid(arrows.F, pts.F),
        color: COLORS.net,
        spots: aroundArrow(
          arrows.F,
          way,
          short
            ? ['tail', 'over', 'tip', 'under']
            : narrow
              ? ['tail', 'under', 'over', 'tip']
              : wide
                ? ['tip', 'over', 'tail', 'under']
                : ['over', 'tip', 'tail', 'under'],
        ),
        dynamicSpots: true,
      });
    else anno.remove('F');
    if (lane && arrows.a.root.visible)
      label('a', {
        text: t(narrow ? 'l_acc_2' : 'l_acc', { a: sgn(r.a) }),
        point: () => (wide && !short ? mid(arrows.a, pts.a) : pts.a.copy(arrows.a.tip)),
        color: COLORS.acc,
        // on a tall or short view beside its tip first (over it are the corner buttons and the clock, under it or
        // behind it the force's label)
        spots: wide && !short ? SPOTS.above : [...tipSpots(way), ...SPOTS.above],
      });
    else anno.remove('a');
    if (lane && arrows.dp.root.visible)
      label('dp', {
        text: t('l_dp'),
        point: () => mid(arrows.dp, pts.dp),
        color: COLORS.momText,
        spots: wide ? [...SPOTS.above, ...sideSpots(way)] : SPOTS.above,
      });
    else anno.remove('dp');
    const moving = lane && arrows.v.root.visible;
    if (moving) {
      // to 0.1 m/s on the picture (short enough to sit beside the tip on a phone); the panel has it to 0.01; lit while
      // the clock holds at a whole second (the number to read then)
      const words = t(narrow ? 'l_vel_2' : 'l_vel', { v: fix(shown(r).v, 1) });
      label('v', {
        text: s.run && clock().held != null ? `<span class="ns-hot">${words}</span>` : words,
        point: () => pts.v.copy(arrows.v.tip),
        color: COLORS.vel,
        spots: SPOTS.right,
      });
      // the velocity's label is placed before the mass's (which gives way on a small stage: the panel has the mass)
      if (!mAfterV) {
        anno.remove('m');
        mAfterV = true;
      }
    } else {
      anno.remove('v');
      mAfterV = false;
    }
    if (s.scene === 'lane' && s.mode === 'explore') {
      const m = s.run?.plan?.m ?? EXAMPLES[s.example].sacks * SACK_MASS + CART_MASS;
      label('m', {
        text: t('l_mass', { m }),
        point: () => pts.m.set(rig.front() - CART.length / 2, 0.08, CART.wheelZ),
        color: COLORS.mass,
        spots: SPOTS.below,
        optional: moving,
      });
    } else anno.remove('m');
    // the push is over (a coast long enough to read): no force, so the velocity stays (the first law)
    const seg = r.seg;
    if (s.scene === 'lane' && s.mode === 'explore' && s.run && r.phase === 'coast' && !s.friction && seg && seg.dur >= COAST_MIN)
      label('coast', {
        text: t('l_coast'),
        point: () => pts.c.set(rig.front() - CART.length / 2, arrowHeights(rig)[1] + 0.2, 0),
        color: '#4b5766',
        spots: [
          { dx: 0, dy: -12 },
          { dx: 0, dy: -34 },
          { dx: 0, dy: 26 },
          { dx: 0, dy: 44 },
          { dx: 40, dy: 44 },
          { dx: 60, dy: 62 },
        ],
      });
    else anno.remove('coast');
    // the sacks at the end of the floor stop the cart (a force too, though no arrow is drawn for it)
    if (s.scene === 'lane' && stopWords(r))
      label('stop', {
        text: t('l_stop'),
        point: () => pts.stop.set(BUFFER_X + 0.45, 0.62, 0),
        color: '#4b5766',
        spots: [
          { dx: 0, dy: -38 },
          { dx: 0, dy: -54 },
          { dx: -24, dy: -38 },
        ],
      });
    else anno.remove('stop');
    // the velocity stamped at each whole second: equal steps while the force acts (that step each second is a)
    const stamped = s.mode === 'explore' ? stampsShown() : [];
    for (const [i] of ghosts.entries()) {
      const st = stamped.find((x) => x.i === i);
      if (!st) {
        anno.remove(`stamp${i}`);
        continue;
      }
      label(`stamp${i}`, {
        text: t('l_stamp', { t: sgn(st.at, 1), v: sgn(st.v) }),
        point: () => pts.st[i].set(st.x + Math.max(0.05, (st.v * V_SCALE) / 2), V_Y, Z_NEAR),
        color: COLORS.vel,
        spots: [
          { dx: 0, dy: 22 },
          { dx: 0, dy: 36 },
          { dx: -18, dy: 26 },
          { dx: 18, dy: 26 },
          { dx: 0, dy: 50 },
        ],
        optional: true,
      });
    }
    // what the marks are (not on a short stage, where the view is full already; the stamps say it once they come)
    if (s.scene === 'lane' && s.mode === 'explore' && s.run && marks.count >= 2 && !stamped.length && !s.run.done && stage.height >= 300)
      label('marks', {
        text: t('l_marks'),
        point: () => pts.mk.set(marks.xs[1] ?? 0, 0, FLOOR.lane),
        color: '#4b5766',
        spots: [
          { dx: 0, dy: 18 },
          { dx: -20, dy: 22 },
          { dx: 20, dy: 22 },
        ],
        optional: true,
      });
    else anno.remove('marks');
  }

  // ── the panel: one action, one result, one rule ─────────────────────────────
  const allFound = () => EXAMPLE_IDS.every((id) => s.results[id] != null);
  /**
   * What the big button (and a tap on the cart) does now: push in this example (the same words and number while the
   * push is on, until its result is known); once the result is in, the next example not tried yet (that word is
   * marked in the row). The badge's number is the student's own step.
   */
  function plan() {
    const run = s.run;
    const step = EXAMPLE_IDS.filter((id) => s.results[id] != null).length + 1;
    if (!run) return { example: s.example, label: `act_${s.example}`, step };
    if (!run.known) return { example: s.example, label: `act_${s.example}`, step }; // the run is on: the action stays
    const next = EXAMPLE_IDS.find((id) => s.results[id] == null && id !== run.plan.id);
    return next ? { example: next, label: `act_on_${next}`, step } : { example: s.example, label: 'act_again', step: '' };
  }

  /** The velocity's zero is not made bold: a bold Bangla zero is a ring, like a radio button. */
  const unboldZero = (html) => html.replace(/<b>([0\u09e6](?:[.,][0\u09e6]+)?)<\/b>/g, '$1');
  function outcome(r) {
    const run = s.run;
    if (!run) return ['out_rest', { v: 0 }, 'vel'];
    const m = measured(run.plan);
    if (run.known && s.friction) return ['rough_result', { F: sgn(m.F), m: m.m, a: sgn(m.a) }, 'acc'];
    if (run.known) return ['out_result', { v: sgn(m.v), u: sgn(m.u), t: m.t, a: sgn(m.a) }, 'acc'];
    const sh = shown(r);
    // v = u + at with the numbers on the picture: the velocity grows by a each second
    const vars = r.seg && { t: sh.t.toFixed(1), u: sgn(r.seg.v0), a: sgn(r.seg.a), v: fix(sh.v, 2) };
    if (r.phase === 'push') return ['out_push', vars, 'vel'];
    if (r.phase === 'brake') return ['out_brake', vars, 'vel'];
    return ['out_coast', { v: sgn(r.v) }, 'vel'];
  }

  function startRule(id) {
    const ex = EXAMPLES[id];
    if (ex.back) return t('rule_start_back', { t: PUSH_TIME, F: PERSON_FORCE });
    return t('rule_start', {
      who: t(`who_${ex.pushers}`),
      what: t(ex.sacks ? 'what_n' : 'what_0'),
      F: PERSON_FORCE * ex.pushers,
      m: CART_MASS + SACK_MASS * ex.sacks,
      t: PUSH_TIME,
    });
  }
  function resultRule(id) {
    const a = s.results[id];
    const plan0 = planOf(id);
    if (id === 'back') {
      const m = measured(plan0);
      return t('rule_back', { p0: momentum(plan0.m, m.u), p1: momentum(plan0.m, m.v), t: m.t, F: sgn(m.F) });
    }
    const base = s.results.base;
    if (id === 'force' && base != null) return t('rule_force', { a0: sgn(base), a1: sgn(a) });
    if (id === 'mass' && base != null) return t('rule_mass', { a0: sgn(base), a1: sgn(a) });
    return t('short_result', { F: plan0.F });
  }
  function ruleHtml(r) {
    const run = s.run;
    if (s.friction) {
      if (!run) return t('rough_rest', { p: PERSON_FORCE * EXAMPLES[s.example].pushers, f: s.friction });
      if (run.plan.endReason === 'friction' && r.phase === 'stopped') return t('rough_stopped');
      return t(r.phase === 'coast' ? 'rough_coast' : 'rough_push');
    }
    if (allFound() && (!run || run.known)) return t('short_law');
    if (!run) return s.results[s.example] != null ? resultRule(s.example) : startRule(s.example);
    if (!run.known) {
      if (r.phase === 'push') return t('rule_push', { a: sgn(r.seg.a) });
      if (r.phase === 'brake') return t('rule_brake');
      return t('rule_coast');
    }
    const id = run.plan.id;
    if (!id) return t('rule_coast');
    return resultRule(id);
  }

  const resultEls = Object.fromEntries(EXAMPLE_IDS.map((id) => [id, ui.$(`[data-example="${id}"] .pvc-ex-res`)]));
  const resultText = {};
  function writeResults() {
    for (const id of EXAMPLE_IDS) {
      const a = s.results[id];
      const html = a == null ? '' : t('res_a', { a: sgn(a) });
      if (resultText[id] !== html) {
        resultEls[id].innerHTML = html;
        resultText[id] = html;
      }
    }
  }

  let lastFormula = '';
  let lastKind = '';
  let lastNote = '';
  function refresh() {
    const r = state();
    sheet.choose(s.example);
    writeResults();
    const [key, vars, kind] = outcome(r);
    sheet.outcome(unboldZero(t(key, vars)));
    if (kind !== lastKind) outcomeEl.dataset.k = lastKind = kind;
    sheet.rule(ruleHtml(r));
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: () => t(p.label, { t: PUSH_TIME }) });
      sheet.next(p.example !== s.example ? p.example : null);
      // the ring shows on the cart while it waits (at the start, or stopped), never while it moves
      const moving = s.run && !s.run.done;
      if (s.scene === 'lane' && !moving && !stopWords(r)) action.show('run');
      else action.hide('run');
    }
    updateFormula(r);
    const pauseButton = ui.$('[data-act="pause"]');
    pauseButton.disabled = !s.run || s.run.done || s.mode === 'quiz';
    const pauseLabel = t(s.run?.pausedAt != null ? 'act_resume' : 'act_pause');
    pauseButton.setAttribute('aria-label', pauseLabel);
    pauseButton.title = pauseLabel;
    pauseButton.innerHTML = s.run?.pausedAt != null ? ICONS.play : ICONS.pause;
    labelsFor();
    const speedButton = extras.querySelector('[data-act="speed"]');
    if (speedButton.dataset.speed !== String(s.speed)) {
      speedButton.dataset.speed = String(s.speed);
      const speedLabel = t(s.speed < 1 ? 'speed_slow' : 'speed_real');
      speedButton.setAttribute('aria-label', speedLabel);
      speedButton.title = speedLabel;
      speedButton.setAttribute('aria-pressed', String(s.speed < 1));
      speedButton.textContent = t(s.speed < 1 ? 'speed_word_slow' : 'speed_word_real');
    }
    const c = clock();
    // the clock of the run (the physics' seconds): held at each whole second when slow, and the time said honestly
    const clockLine =
      s.scene === 'lane'
        ? `<span class="ns-clock"><b>t = ${N((Math.floor(c.t * 10 + 1e-6) / 10).toFixed(1))}${NB}s</b> ${t(c.held != null ? 'clock_held' : s.speed < 1 ? 'clock_slow' : 'clock_real')}</span>${ladder()}`
        : '';
    const html =
      (diagram.root.visible
        ? t('note_diagram')
        : r.phase === 'stop'
          ? t('note_buffer')
          : s.friction
            ? t('note_rough', { f: s.friction })
            : clockLine && (shortStage() || (stage.width < 470 && s.run))
              ? '' // a short stage, or a phone upright while the cart moves: the friction button says it; the arrows' labels need the room
              : `<b>${t('note_head')}</b> <span>${t(stage.width < 470 ? 'note_short' : 'note')}</span>`) + clockLine;
    note.classList.toggle('ns-note-top', shortStage());
    if (html !== lastNote) {
      note.innerHTML = html;
      lastNote = html;
    }
    stage.invalidate();
  }

  /** A bar for a row: filled to `k` (0…1) of its track, with marks between the pieces it is made of. */
  const bar = (k, { cuts = [], cut = null } = {}) => {
    const pc = (x) => `${(Math.min(1, Math.max(0, x)) * 100).toFixed(1)}%`;
    let html = `<i class="ns-fill" style="width:${pc(k)}"></i>`;
    if (cut) html += `<i class="ns-cut" style="left:${pc(cut[0])};width:${pc(cut[1])}"></i>`;
    for (const x of cuts) if (x > 0.01 && x < k - 0.01) html += `<i class="ns-mark" style="left:${pc(x)}"></i>`;
    return `<span class="ns-bar" aria-hidden="true">${html}</span>`;
  };
  const row = (kind, name, value, sub, track) =>
    `<div class="ns-row ns-row-${kind}"><span class="ns-row-name">${name}</span><span class="ns-row-val">${value}</span>${track}<small>${sub}</small></div>`;
  const F_FULL = 200; // N, kg and ms⁻² at a full bar: the biggest force, mass and acceleration of the examples
  const M_FULL = 200;
  const A_FULL = 2;

  /**
   * The force now (the pushes added, less the friction: two people, two pieces of the bar; the friction, the piece
   * cut off), the mass (the cart with its child, and a piece for each sack) and the acceleration, F ÷ m; and the
   * বেগ–সময় গ্রাফ of the push so far over the lines of the examples already tried.
   */
  function updateFormula(r) {
    const mass = s.run?.plan.m ?? CART_MASS + rig.cfg.sacks * SACK_MASS;
    const pushers = s.run?.plan.pushers ?? rig.cfg.pushers;
    const balance = forceBalance(r, mass, pushers);
    const two = pushers > 1 && Math.abs(balance.F2) > 1e-6;
    const stopped = Boolean(r.contact);
    const f = Math.abs(balance.friction);
    const vars = {
      p: sgn(stopped ? balance.contact : balance.F1),
      q: sgn(balance.F2),
      f: sgn(f),
      F: sgn(balance.net),
      m: mass,
      a: sgn(r.a, 3),
    };
    const pushed = Math.abs(balance.F1) + Math.abs(balance.F2);
    // the force worked out when it is made of pieces: two people, or a push less the friction, or the sacks at the end
    const sumKey = stopped ? 'sum_stop' : two ? (f > 1e-6 ? 'sum_two' : 'sum_two_0') : f > 1e-6 && pushed > 1e-6 ? 'sum_one' : '';
    const sacks = s.run?.plan.sacks ?? rig.cfg.sacks;
    const html =
      row(
        'F',
        t('row_F'),
        t('row_F_val', vars),
        sumKey ? t(sumKey, vars) : '',
        bar(Math.abs(balance.net) / F_FULL, {
          cuts: two ? [Math.abs(balance.F1) / F_FULL] : [],
          cut: f > 1e-6 && pushed > f ? [Math.abs(balance.net) / F_FULL, f / F_FULL] : null,
        }),
      ) +
      row(
        'm',
        t('row_m'),
        t('row_m_val', vars),
        '',
        bar(mass / M_FULL, { cuts: Array.from({ length: sacks }, (_, i) => (CART_MASS + i * SACK_MASS) / M_FULL) }),
      ) +
      row('a', t('row_a'), t('row_a_val', vars), t(liveFormula.clientWidth < 330 ? 'sum_div_short' : 'sum_div', vars), bar(Math.abs(r.a) / A_FULL));
    if (html !== lastFormula) {
      formulaValues.innerHTML = html;
      lastFormula = html;
    }
    drawGraph();
    const d = extras.querySelector('[data-act="diagram"]');
    d.textContent = t(s.diagram ? 'motion' : 'diagram');
    d.setAttribute('aria-pressed', String(s.diagram));
    const fb = extras.querySelector('[data-act="friction"]');
    fb.textContent = t(s.friction ? 'friction_on' : 'friction_off', { f: s.friction });
    fb.setAttribute('aria-pressed', String(Boolean(s.friction)));
  }
  /** The graph: the lines of the examples tried, faint, and the push of the run on now as it goes. */
  function drawGraph() {
    if (s.mode !== 'explore') return;
    const run = s.run;
    const lineOf = (plan0) => {
      const seg = measuredSeg(plan0);
      return { v0: round(seg.v0, 3), a: round(seg.a, 3), dur: seg.dur, t0: seg.t0 };
    };
    const past = EXAMPLE_IDS.filter((id) => s.results[id] != null && id !== run?.plan.id).map((id) => {
      const l = lineOf(planOf({ ...EXAMPLES[id], friction: s.friction }));
      return { v0: l.v0, a: l.a, dur: Math.min(l.dur, 2), tag: t('graph_tag', { a: sgn(s.results[id]) }) };
    });
    let cur = null;
    let aria = t('graph_aria_rest');
    if (run && s.scene === 'lane') {
      const l = lineOf(run.plan);
      const c = clock();
      const upto = c.t - l.t0;
      if (upto >= -1e-9) {
        cur = { v0: l.v0, a: l.a, upto: round(Math.min(l.dur, upto), 3), held: c.held != null };
        const m = measured(run.plan);
        aria = t('graph_aria', { t: m.t, u: sgn(m.u), v: sgn(m.v), a: sgn(Math.abs(m.a)) });
      }
    }
    graph.draw({ past, cur, aria });
  }
  function setDiagram(value) {
    s.diagram = value;
    tweener.cancel('follow');
    s.follow = 0;
    if (s.run && s.scene === 'lane') s.follow = followFor(state());
    anno.clear();
    placeArrows(state());
    syncStamps();
    flyTo(viewPose(), 0);
    refresh();
  }
  async function setFriction(value) {
    if (value === s.friction) return;
    s.friction = value;
    s.results = { base: null, force: null, mass: null, back: null };
    s.seen = [];
    await chooseExample(s.example, { animate: false, quiet: true });
  }
  function openMaths() {
    if (s.mode === 'quiz') return;
    mathResume = Boolean(s.run && s.run.pausedAt == null);
    if (mathResume) s.run.pausedAt = runTime();
    const plan0 = s.run?.plan ?? planOf({ ...EXAMPLES[s.example], friction: s.friction });
    const m = measured(plan0);
    mathDialog.innerHTML = `<h2>${t('formula_title')}</h2><p>${t('rule_law')}</p><small>${t('derive_system', { cart: CART_OWN_MASS, child: RIDER_MASS, load: plan0.sacks * SACK_MASS, m: plan0.m })}</small><div>${t('derive_dp')}</div><div>${t('derive_rate')}</div><div>${t('derive_a')}</div><strong>${t('derive_force')}</strong><small>${t('derive_const', { k: 1 })} ${t('derive_unit', { one: 1 })}</small><p>${t('derive_example', { F: sgn(m.F), m: plan0.m, a: sgn(m.a) })}</p><small>${t('balance_y', { w: sgn(forceBalance(state(), plan0.m).weight) })}</small><button type="button" class="pvc-btn primary" data-act="maths-close">${t('formula_close')}</button>`;
    mathDialog.showModal();
  }
  function finishMathPause() {
    const resume = mathResume && s.mode === 'explore';
    mathResume = false;
    if (resume) resumeRun();
  }
  mathDialog.addEventListener('cancel', finishMathPause);
  mathDialog.addEventListener('close', finishMathPause);

  function snapshot() {
    const r = state();
    const run = s.run;
    const p = plan();
    const m = run?.known ? measured(run.plan) : null;
    return {
      example: s.example,
      phase: r.phase, // 'rest' | 'push' | 'coast' | 'brake' | 'stop' | 'stopped'
      time: round(r.t, 2), // s since the push began
      speed: round(r.v, 2), // m/s
      distance: round(r.x - START_X, 2), // m the cart's front has moved
      force: round(r.F, 2), // N on the cart now (+ to the right)
      friction: s.friction,
      diagram: s.diagram,
      forces: forceBalance(r, run ? run.plan.m : CART_MASS + rig.cfg.sacks * SACK_MASS, run?.plan.pushers ?? rig.cfg.pushers),
      mass: run ? run.plan.m : CART_MASS + SACK_MASS * EXAMPLES[s.example].sacks, // kg
      acceleration: round(r.a, 3), // ms⁻² now
      measured: m ? { u: m.u, v: m.v, t: m.t, a: m.a } : null,
      results: { ...s.results },
      paused: run?.pausedAt != null,
      playback: s.speed, // run s per real s (0.5: slow)
      held: run ? clock().held : null, // the whole second the slow clock is holding at (s), or null
      scene: s.scene,
      view: s.view,
      mode: s.mode,
      next: { example: p.example, step: p.step },
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.example, snap.phase, snap.results, snap.mode, snap.scene]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  /** A new example: the run is called off, the cart waits at the start with its load and its people. */
  async function chooseExample(id, { push: andPush = false, animate = true, quiet = false } = {}) {
    if (!EXAMPLE_IDS.includes(id)) return;
    if (mathDialog.open) {
      mathResume = false;
      mathDialog.close();
    }
    if (s.locked && !quiet) return lockedNudge();
    const my = ++token;
    const changed = id !== s.example;
    s.example = id;
    // the view glides back to the start of the lane (wider when someone stands in front of the cart)
    const refit = s.scene === 'lane' && !s.userMovedCamera;
    if (refit) {
      tweener.cancel('follow');
      s.follow = 0;
    }
    goHome({ animate, follow: !refit });
    setupRig(rig, EXAMPLES[id], { animate });
    if (refit) flyTo(viewPose(), animate ? 0.7 : 0);
    refresh();
    emitChange();
    if (changed) emit('example', { example: id });
    if (!andPush) return;
    lastPush = now();
    if (animate) await wait(changed ? 600 : 300);
    if (my !== token || (s.locked && !quiet)) return;
    startRun({ quiet });
  }

  /** The push: back to the start first if the cart has moved, then the same push as always. */
  async function push({ quiet = false, at = null } = {}) {
    if (s.locked && !quiet) return lockedNudge();
    if (!quiet) {
      if (now() - lastPush < DOUBLE_TAP) return; // a double tap must not undo the first push
      lastPush = now();
      hintOff();
    }
    const my = ++token;
    if (s.run) {
      goHome();
      if (at == null) {
        await wait(300);
        if (my !== token) return;
      }
    }
    startRun({ quiet, at });
  }

  /** The action: the big button, its badge on the view, a tap on the cart, Space/Enter/→. */
  function doAction() {
    if (s.locked) return lockedNudge();
    const p = plan();
    if (p.example !== s.example) {
      if (now() - lastPush < DOUBLE_TAP) return; // a double tap must not skip an example
      hintOff();
      chooseExample(p.example, { push: true });
      return;
    }
    push();
  }

  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: () => t(`act_${s.example}`, { t: PUSH_TIME }),
    target: () => (s.scene === 'lane' ? cartBox(rig, 0) : null),
    pad: 6,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── camera ──────────────────────────────────────────────────────────────────
  /** 0 for a portrait stage … 1 for a wide one. */
  const wideness = () => Math.min(1, Math.max(0, (stage.width / Math.max(1, stage.height) - 0.95) / 0.85));
  const LANE = { left: -2.62, right: BUFFER_X + 1.15 };
  /**
   * How much of the lane the side view shows: on a phone held upright about 4.4 m (the cart and its people big),
   * the view following the cart once it is well across; on wide frames the whole lane. With a person in front
   * ("back") he is in view from the start.
   */
  function windowWidth() {
    const full = LANE.right - LANE.left;
    if (s.diagram && stage.height < 280) return 6.1;
    const narrow = root.clientWidth < 560 && root.clientHeight > root.clientWidth;
    const w = narrow ? 4.3 : 4.3 + (full - 4.3) * wideness();
    if (!rig.cfg.back || s.scene !== 'lane') return Math.min(full, w);
    // the question about the direction: close on the cart and the person in front, so the force's arrow reads
    return Math.min(full, s.mode === 'quiz' ? Math.min(w, DIR_WINDOW) : Math.max(w, 6.1));
  }
  /**
   * How far the side view must have moved along the lane to keep the cart's front and its velocity arrow in view
   * (room ahead for the arrow); while the people push, never so far that they leave the view.
   */
  function followFor(r) {
    const w = windowWidth();
    const front = rig.front();
    // room ahead of the cart for its velocity arrow and the arrow's label
    // (the question about the direction shows a little more of what is ahead, so the person left behind is out of view)
    const ahead = s.mode === 'quiz' && rig.cfg.back ? 0.5 : 0;
    let f = front + (s.diagram && stage.height < 280 ? 3.0 : Math.max(1.2, V_SCALE * r.v + 1.6)) + ahead - (LANE.left + w);
    // the people pushing stay in view; once they let go the view may run on ahead of them, smoothly
    const pushEnd = s.run ? s.run.plan.segs[0].dur : 0;
    f = Math.min(f, front - START_X + 1.5 * Math.max(0, r.t - pushEnd));
    return Math.min(Math.max(0, f), LANE.right - LANE.left - w + (s.diagram && stage.height < 280 ? 3 : 0));
  }
  const BOXES = {
    rig: new THREE.Box3(new THREE.Vector3(-2.5, 0, -0.6), new THREE.Vector3(0.45, 1.72, 0.6)),
    pair: new THREE.Box3(new THREE.Vector3(-2.5, 0, -0.6), new THREE.Vector3(PAIR_B + 0.45, 1.72, 0.6)),
  };
  const laneBox = new THREE.Box3();
  const VIEW_3D = new THREE.Vector3(-0.5, 0.55, 0.9).normalize();
  function viewPose(view = s.view) {
    const lane = s.scene === 'lane';
    if (lane)
      laneBox.set(
        new THREE.Vector3(LANE.left, 0, -0.62),
        new THREE.Vector3(LANE.left + windowWidth(), s.diagram ? (stage.height < 280 ? 2.1 : 3.65) : 2.65, s.diagram ? 0.66 : 1.0),
      );
    const box = lane ? laneBox : BOXES[s.scene];
    const e = THREE.MathUtils.degToRad(38 - 20 * wideness());
    const dir = view === '3d' && lane ? VIEW_3D : new THREE.Vector3(0, Math.sin(e), Math.cos(e));
    const pose = fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: { top: 44, bottom: 8, side: 4 } });
    if (lane) {
      pose.position.x += s.follow;
      pose.target.x += s.follow;
    }
    return pose;
  }
  /** The side view moves f m along the lane (with the cart). */
  function setFollow(f) {
    const d = f - s.follow;
    if (Math.abs(d) < 1e-9) return;
    camera.position.x += d;
    controls.target.x += d;
    controls.update();
    s.follow = f;
    stage.invalidate();
  }
  /** Back to the start of the lane, gliding. */
  function followHome(animate = true) {
    const from = s.follow;
    tweener.cancel('follow');
    if (!animate || from < 0.01) return setFollow(0);
    tweener.animate({
      key: 'follow',
      duration: Math.min(0.8, 0.35 + from * 0.1),
      ease: ease.inOutCubic,
      onUpdate: (k) => setFollow(from * (1 - k)),
    });
  }
  function flyTo({ position, target }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d' && s.scene === 'lane';
    controls.enableZoom = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  function setScene(next, { animate = false } = {}) {
    s.scene = next;
    tweener.cancel('follow');
    s.follow = 0;
    controls.enableRotate = s.view === '3d' && next === 'lane';
    s.userMovedCamera = false;
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    placeArrows(state());
    if (!s.userMovedCamera) {
      // a new shape of the view (a phone turned): how far along the lane it must be is worked out again, also when
      // the run is held or over (nothing ticks then), so the cart is never cut off at the edge
      const lane = s.scene === 'lane';
      if (lane) {
        tweener.cancel('follow');
        s.follow = 0;
      }
      flyTo(viewPose(), 0);
      if (lane && s.run) setFollow(followFor(state()));
    }
    refresh();
  });

  // ── touching the scene: the cart pushes ─────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    if (s.scene !== 'lane') return false;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(rig.cart.hit, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (s.run && !s.run.known) {
        if (now() - lastPush > DOUBLE_TAP) showHint(t('hint_wait'), { duration: 2600 });
        return;
      }
      doAction(); // as the finger goes down: the same as the big button
    },
    true,
  );
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
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

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  /** Four tap choices (the right one first, each { key, text }): shuffled, with the index of the right one. */
  function choicesOf(items, meta) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ns-opt">${list[j].text}</span>`,
      meta: { answer: items[0].key, ...meta },
    };
  }
  const accItem = (key, a) => ({ key, text: t('opt_a', { a: sgn(a) }) });

  let learnSaved = null;
  let kinds = [];
  let question = null;
  let picked = -1;

  /** A clean scene for a question: nothing moving, no marks, no labels left, the lane seen from the side. */
  async function cleanScene() {
    ++token;
    goHome();
    anno.clear();
    rigB.root.visible = false;
    rig.baseX = 0;
    arrows.dp.hide();
    arrows.FB.hide();
    arrows.aB.hide();
    s.show = { F: true, a: true, v: true, dp: 'auto' };
    if (s.view !== 'front') setView('front', { animate: false });
    await setScene('lane');
    refresh();
  }
  /** A run of the test's scene up to `until` s, then held there (resolves false if called off). */
  async function runTo(cfg, until, alive) {
    startRun({ quiet: true, cfg });
    s.run.holdAt = until;
    const my = token;
    while (s.run?.pausedAt == null) {
      await wait(50);
      if (my !== token || !alive() || !s.run) return false;
    }
    tick(true);
    return true;
  }

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
        if (mathDialog.open) {
          mathResume = false;
          mathDialog.close();
        }
        learnSaved = { example: s.example, results: { ...s.results }, seen: [...s.seen], friction: s.friction, diagram: s.diagram };
        s.friction = 0;
        s.diagram = false;
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        kinds = shuffle(['calc', 'double', 'dir', 'pair', 'law']);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        ++token;
        const saved = learnSaved || { example: 'base', results: { base: null, force: null, mass: null, back: null }, seen: [] };
        s.friction = saved.friction || 0;
        s.diagram = Boolean(saved.diagram);
        s.results = { ...saved.results };
        s.seen = [...saved.seen];
        s.example = saved.example;
        rigB.root.visible = false;
        rig.baseX = 0;
        arrows.FB.hide();
        arrows.aB.hide();
        anno.clear();
        s.show = { F: true, a: true, v: true, dp: 'auto' };
        s.scene = 'lane';
        setupRig(rig, EXAMPLES[s.example]);
        tweener.cancel('follow');
        s.follow = 0;
        goHome({ follow: false });
        syncUI();
        setView(s.view, { animate: false });
        refresh();
        emitChange();
      },
      async prepare(i, alive, say) {
        const kind = kinds[i % kinds.length];
        picked = -1;
        await cleanScene();
        if (!alive()) return null;

        if (kind === 'calc') {
          const c = pickOne(CALC_CASES);
          const pushers = c.F > 150 ? 2 : 1;
          setupRig(rig, { pushers, sacks: c.sacks });
          await setScene('rig');
          const ch = calcChoices(c.F, c.sacks);
          anno.add('cart', {
            kind: 'callout',
            text: t('l_cart', { m: CART_MASS }),
            point: () => pts.m.set(rig.front() - CART.length / 2, 0.1, CART.wheelZ),
            color: COLORS.mass,
            spots: SPOTS.below,
          });
          const top = rig.cart.sacks[c.sacks >= 3 ? 2 : 0];
          anno.add('sack', {
            kind: 'callout',
            text: t('l_sack', { m: SACK_MASS }),
            point: () =>
              pts.sack
                .copy(top.position)
                .add(rig.cart.root.position)
                .setY(top.position.y + 0.1),
            color: COLORS.mass,
            spots: [
              { dx: 0, dy: -34 },
              { dx: 30, dy: -30 },
              { dx: -30, dy: -30 },
              { dx: 0, dy: -50 },
            ],
          });
          question = { kind, c, pushers, ...ch };
          const items = [accItem('right', ch.right), ...ch.wrong.map((w) => accItem(w.kind, w.value))];
          return { text: t('q_calc', { who: t(`who_${pushers}`), F: c.F }), ...choicesOf(items, { kind }) };
        }

        if (kind === 'double') {
          const v = pickOne([
            { from: 'base', what: 'force' },
            { from: 'base', what: 'mass' },
            { from: 'mass', what: 'force' },
          ]);
          setupRig(rig, EXAMPLES[v.from]);
          await setScene('lane'); // the view fitted again (the last question may have had the person in front)
          say(t('q_look'));
          await wait(300);
          if (!alive()) return null;
          s.show = { F: true, a: false, v: true, dp: 'auto' };
          if (!(await runTo(v.from, PUSH_TIME + 0.45, alive))) return null;
          const m = measured(s.run.plan);
          const ch = doubleChoices(m.a, v.what);
          question = { kind, ...v, m, ...ch };
          const items = [accItem('right', ch.right), ...ch.wrong.map((w) => accItem(w.kind, w.value))];
          const text = t(v.what === 'force' ? 'q_double_force' : 'q_double_mass', { t: PUSH_TIME });
          return { text, ...choicesOf(items, { kind, what: v.what }) };
        }

        if (kind === 'dir') {
          setupRig(rig, EXAMPLES.back);
          await setScene('lane'); // wider: the person in front is in view
          say(t('q_look'));
          await wait(300);
          if (!alive()) return null;
          s.show = { F: true, a: false, v: true, dp: false }; // the force's arrow is what to read; the answer comes after
          const brake = planOf('back').segs.find((x) => x.kind === 'brake');
          if (!(await runTo('back', brake.t0 + 0.3, alive))) return null;
          rig.people[0].root.visible = false; // the one who pushed first is behind the view: he is no part of the question
          question = { kind };
          const items = [
            { key: 'd_left', text: t('d_left') },
            { key: 'd_right', text: t('d_right') },
            { key: 'd_none', text: t('d_none') },
            { key: 'd_later', text: t('d_later') },
          ];
          return { text: t('q_dir'), ...choicesOf(items, { kind }) };
        }

        if (kind === 'pair') {
          const c = pickOne(PAIR_CASES);
          setupRig(rig, c.a);
          rigB.root.visible = true;
          rigB.baseX = PAIR_B;
          setupRig(rigB, c.b);
          await setScene('pair');
          const ratio = pairRatio(c);
          const pool = [ratio.ratio, ratio.byForce, ratio.byMass, ratio.flip, 1, 2, 0.5, 4, 0.25];
          const values = [];
          for (const x of pool) if (RATIO_KEYS[x] && !values.includes(x)) values.push(x);
          const wrongKind = (x) => (x === ratio.byForce ? 'byforce' : x === ratio.byMass ? 'bymass' : x === ratio.flip ? 'flip' : 'other');
          const items = values.slice(0, 4).map((x, j) => ({ key: j ? wrongKind(x) : 'right', text: t(RATIO_KEYS[x]), value: x }));
          const letter = (target, key) =>
            anno.add(`pair-${key}`, {
              kind: 'callout',
              text: `<b>${t(key)}</b>`,
              point: () => new THREE.Vector3(target.front() - CART.length / 2, target.cart.top() + 0.12, 0),
              color: '#212529',
              spots: [
                { dx: 0, dy: -26 },
                { dx: 0, dy: -40 },
                { dx: 24, dy: -24 },
              ],
            });
          letter(rig, 'l_A');
          letter(rigB, 'l_B');
          question = { kind, c, ratio };
          return { text: t('q_pair', { F: PERSON_FORCE, mc: CART_MASS, ms: SACK_MASS }), ...choicesOf(items, { kind }) };
        }

        // the law: a force at work on the cart, with the change of momentum it makes (the run held half way through
        // the push); the force and the momentum's change on the picture, the question asks how they go together
        setupRig(rig, EXAMPLES.force);
        await setScene('lane');
        say(t('q_look'));
        await wait(300);
        if (!alive()) return null;
        s.show = { F: true, a: false, v: true, dp: true };
        if (!(await runTo('force', 1.2, alive))) return null;
        question = { kind: 'law' };
        const items = [
          { key: 'w_rate', text: t('w_rate') },
          { key: 'w_time', text: t('w_time') },
          { key: 'w_p', text: t('w_p') },
          { key: 'w_v', text: t('w_v') },
        ];
        return { text: t('q_law'), ...choicesOf(items, { kind: 'law' }) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note1 = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        if (k === 'calc') {
          const { c, pushers, M: mass, right } = question;
          const my = token;
          anno.remove('cart');
          anno.remove('sack');
          setScene('lane', { animate: true }).then((done) => {
            if (done && my === token) startRun({ quiet: true, cfg: { pushers, sacks: c.sacks, F: c.F } });
          });
          return (
            t('why_calc', { a: sgn(right), mc: CART_MASS, n: c.sacks, ms: SACK_MASS, M: mass, F: c.F }) +
            note1({ cart: 'not_cart', sacks: 'not_sacks', one_less: 'not_one_less', inverse: 'not_inverse' })
          );
        }
        if (k === 'double') {
          const { what, from, m, right } = question;
          const cfg = { ...EXAMPLES[from] };
          if (what === 'force') cfg.pushers *= 2;
          else cfg.sacks += 2;
          const my = token;
          setupRig(rig, cfg, { animate: true });
          s.show = { F: true, a: true, v: true, dp: 'auto' };
          goHome();
          setTimeout(() => {
            if (my === token) startRun({ quiet: true, cfg });
          }, 500);
          const vars = { a: sgn(right), v: sgn(m.v), u: sgn(m.u), t: m.t, a0: sgn(m.a) };
          return what === 'force'
            ? t('why_double_force', vars) + note1({ same: 'not_same', flip: 'not_flip_force', square: 'not_square_force' })
            : t('why_double_mass', vars) + note1({ same: 'not_same', flip: 'not_flip_mass', square: 'not_square_mass' });
        }
        if (k === 'dir') {
          s.show = { F: true, a: false, v: true, dp: true }; // the change of momentum shows in the acceleration's place
          resumeRun();
          return t('why_dir') + note1({ d_right: 'not_right', d_none: 'not_none', d_later: 'not_later' });
        }
        if (k === 'pair') {
          const { c, ratio } = question;
          // each cart's acceleration, drawn to the same scale over it
          for (const [target, a, key] of [
            [rig, ratio.aA, 'aA'],
            [rigB, ratio.aB, 'aB'],
          ]) {
            const arr = key === 'aA' ? arrows.a : arrows.aB;
            arr.set(tmpA.set(target.front() - CART.length / 2, arrowHeights(target, 0.34)[1], 0), XP, a * A_SCALE);
            anno.add(`acc-${key}`, {
              kind: 'callout',
              text: `a = ${N(sgn(a))}${NB}${MS2}`,
              point: () => mid(arr, new THREE.Vector3()),
              color: COLORS.acc,
              spots: SPOTS.pair,
            });
          }
          anno.remove('pair-l_A');
          anno.remove('pair-l_B');
          stage.invalidate();
          const Fa = PERSON_FORCE * c.a.pushers;
          const Fb = PERSON_FORCE * c.b.pushers;
          const ma = CART_MASS + SACK_MASS * c.a.sacks;
          const mb = CART_MASS + SACK_MASS * c.b.sacks;
          return (
            t('why_pair', { r: t(RATIO_KEYS[ratio.ratio]), Fa, ma, aa: sgn(ratio.aA), Fb, mb, ab: sgn(ratio.aB) }) +
            note1({ byforce: 'not_byforce', bymass: 'not_bymass', flip: 'not_flip', other: 'not_other' })
          );
        }
        // the law: the push goes on
        resumeRun();
        return t('why_law', { F: PERSON_FORCE * 2 }) + note1({ w_time: 'not_time', w_p: 'not_p', w_v: 'not_v' });
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
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) {
      if (s.locked) lockedNudge();
      else setView(b.dataset.view);
    }
    if (b.dataset.example) chooseExample(b.dataset.example);
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
      case 'pause':
        if (s.locked) lockedNudge();
        else if (s.run && !s.run.done) {
          if (s.run.pausedAt != null) resumeRun();
          else s.run.pausedAt = runTime();
          refresh();
          emitChange();
        }
        break;
      case 'speed':
        if (s.locked) lockedNudge();
        else setSpeed(s.speed < 1 ? 1 : SLOW);
        break;
      case 'diagram':
        if (s.locked) lockedNudge();
        else setDiagram(!s.diagram);
        break;
      case 'friction':
        if (s.locked) lockedNudge();
        else setFriction(s.friction ? 0 : 20);
        break;
      case 'maths':
        openMaths();
        break;
      case 'maths-close':
        finishMathPause();
        mathDialog.close();
        break;
      case 'home':
        if (s.locked) lockedNudge();
        else {
          ++token;
          goHome();
        }
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    if (mathDialog.open) {
      if (e.key === 'Escape') {
        finishMathPause();
        mathDialog.close();
        e.preventDefault();
      }
      return;
    }
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey =
      ['1', '2', '3', '4', 'r', 'R', 'Home', 'ArrowRight', 'f', 'F', 'v', 'V', 's', 'S', 'p', 'P'].includes(k) ||
      ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3', '4'].includes(k)) chooseExample(EXAMPLE_IDS[Number(k) - 1]);
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') {
      ++token;
      goHome();
    } else if (k === 's' || k === 'S') setSpeed(s.speed < 1 ? 1 : SLOW);
    else if (k === 'p' || k === 'P') ui.$('[data-act="pause"]').click();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  function markTried(list) {
    for (const id of list.map((x) => String(x).trim()).filter((x) => EXAMPLE_IDS.includes(x))) {
      s.results[id] = measured(planOf(id)).a;
      s.seen = s.seen.filter((e) => e !== id).concat(id);
    }
  }
  markTried(String(o.tried || '').split(','));
  setupRig(rig, EXAMPLES[s.example]);
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const at = o.at === '' || o.at == null ? null : Number(o.at);
  if (at != null && Number.isFinite(at)) {
    // a picture: the run held at that moment (a tap on the cart or the button starts a new push)
    startRun({ quiet: true, at: Math.max(0, at) });
    s.run.holdAt = Math.max(0, at);
    tick(true);
  }
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
     * Change any of: example ('base' | 'force' | 'mass' | 'back'), tried (examples whose results show, e.g.
     * ['base', 'force']), home (true: back to the start), push (true: the same push as the button), at (s after the
     * push began: jump the run there), speed (0.5 or 1), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.speed != null) setSpeed(p.speed);
      if (p.friction != null && s.mode !== 'quiz') await setFriction(Number(p.friction) === 20 ? 20 : 0);
      if (p.diagram != null && s.mode !== 'quiz') setDiagram(Boolean(p.diagram));
      if (p.view) await setView(p.view, { animate });
      if (p.tried) markTried(Array.isArray(p.tried) ? p.tried : String(p.tried).split(','));
      if (p.example) {
        const changed = p.example !== s.example;
        await chooseExample(p.example, { animate, quiet: true });
        if (changed && p.push && animate) await wait(550); // the sacks are loaded, the people step up
      }
      if (p.home) {
        ++token;
        goHome();
      }
      if (p.at != null) await push({ quiet: true, at: Math.max(0, Number(p.at) || 0) });
      else if (p.push) {
        if (animate) await push({ quiet: true });
        else await push({ quiet: true, at: planOf(s.example).end + 0.01 });
      }
      if (p.paused === true && s.run) s.run.pausedAt = runTime();
      else if (p.paused === false) resumeRun();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      if (mathDialog.open) {
        mathResume = false;
        mathDialog.close();
      }
      quiz.stop();
      ++token;
      s.results = { base: null, force: null, mass: null, back: null };
      s.friction = 0;
      s.diagram = false;
      s.seen = [];
      s.view = 'front';
      s.speed = Number(o.speed) === 1 ? 1 : SLOW;
      controls.enableRotate = false;
      syncUI();
      await chooseExample('base', { animate: false, quiet: true });
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => presentation.capture(opts),
    /** The handcart with its load and its people where they are, the floor and the pile of sacks, in metres. */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'NewtonsSecondLaw';
      copy.add(floor.group.clone(true), rig.root.clone(true));
      if (diagram.root.visible) copy.add(diagram.root.clone(true));
      const hidden = [];
      copy.traverse((obj) => {
        if (!obj.visible) hidden.push(obj);
      });
      for (const obj of hidden) obj.removeFromParent();
      return copy;
    },
  };
}
