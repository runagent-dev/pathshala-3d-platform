// Newton's second law (book pages 75–76, topic 3.6), student view: a wooden handcart (ঠেলাগাড়ি) waits on a smooth
// floor with a person behind it. One tap and he pushes it for 2 s with 100 N: while the force acts the velocity grows
// by the same amount every second (an orange F arrow at the crossbar, a teal acceleration arrow over the cart, a blue
// velocity arrow growing in front, a mark on the floor every second); then he lets go and the cart rolls on at the
// velocity it has until a pile of sacks at the end of the floor stops it. The panel works out a = (v − u) ÷ t and the
// rule grows with what the student finds, one example at a time, chosen in a row of words: the empty cart (1 ms⁻²),
// double the force (two people, 2 ms⁻²), double the mass (two 50 kg sacks of rice, 0.5 ms⁻²), and the force backward
// (a second person in front pushes against the moving cart: the velocity falls from 2 m/s to 0, a = −1 ms⁻², the
// momentum changes in the direction of the force) — up to the book's law and F = ma. Then a short test.
// The panel is the kit's clean sheet (one action, one result, one rule): the examples as one row of words (the
// acceleration found under each), one big numbered action whose same numbered badge rings the cart (tap either), one
// result line, one rule line. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
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
import { createI18n } from './i18n.js';
import {
  BUFFER_X,
  CALC_CASES,
  CART_MASS,
  calcChoices,
  doubleChoices,
  EXAMPLE_IDS,
  EXAMPLES,
  GIVE,
  MARK_STEP,
  measured,
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
} from './physics.js';
import { createFloor, createMarks, createRig, FLOOR } from './scene.js';

export const DEFAULTS = {
  example: 'base', // 'base' | 'force' | 'mass' | 'back'
  at: '', // s after the push began: start with the run already going (for pictures)
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
export const COLORS = { force: '#e8590c', acc: '#0c8599', vel: '#1c6fd9', mom: '#2f9e44', momText: '#237a35', mass: '#495057' };
const F_SCALE = 0.0055; // m of arrow per newton (100 N: 0.55 m)
const A_SCALE = 0.5; // m of arrow per ms⁻² (2 ms⁻²: 1 m)
const V_SCALE = 0.25; // m of arrow per m/s (4 m/s: 1 m)
const Z_NEAR = 0.6; // the velocity arrow on the cart's near side
const V_Y = 0.12; // the velocity arrow: in front of the cart, low, on its near side (below the feet of anyone there)
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
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 2, outcome: 1, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
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

  const arrow = (color, name) => createArrow({ color, radius: 0.019, head: 0.11, headRadius: 0.048, name });
  const arrows = {
    F: arrow(COLORS.force, 'ForceArrow'),
    a: arrow(COLORS.acc, 'AccelerationArrow'),
    v: arrow(COLORS.vel, 'VelocityArrow'),
    dp: arrow(COLORS.mom, 'MomentumChangeArrow'),
    FB: arrow(COLORS.force, 'ForceArrowB'),
    aB: arrow(COLORS.acc, 'AccelerationArrowB'),
  };
  for (const a of Object.values(arrows)) {
    a.root.userData.noExport = true;
    world.add(a.root);
  }

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
    /** @type {any} */
    run: null, // { plan, t0, pausedAt, quiet, known, done, hit, knownP, doneP }
    results: { base: null, force: null, mass: null, back: null }, // the acceleration found (ms⁻²)
    seen: [], // examples in the order their results came
    scene: 'lane', // 'lane' | 'rig' (close on the cart, a test question) | 'pair' (two carts, a test question)
    show: { F: true, a: true, v: true }, // the arrows (the test hides some until the answer)
    follow: 0, // m the side view has moved along the lane with the cart
    userMovedCamera: false,
  };
  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let token = 0; // bumped by anything that calls off what is pending
  let lastPush = Number.NEGATIVE_INFINITY;

  // ── the run ─────────────────────────────────────────────────────────────────
  const runTime = () => {
    const run = s.run;
    if (!run) return 0;
    if (run.pausedAt != null) return run.pausedAt;
    const time = Math.max(0, (now() - run.t0) / 1000);
    if (run.holdAt != null && time >= run.holdAt) {
      run.pausedAt = run.holdAt; // a test question holds the scene here
      return run.holdAt;
    }
    return time;
  };
  function state() {
    if (!s.run) return { phase: 'rest', x: START_X, v: 0, a: 0, F: 0, t: 0, seg: null };
    return runAt(s.run.plan, runTime());
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
    if (s.scene === 'lane' && follow) followHome(animate);
    refresh();
    emitChange();
  }

  /** The push starts (at: jump that many seconds into the run). */
  function startRun({ quiet = false, at = null, cfg = null } = {}) {
    const plan = planOf(cfg ?? s.example);
    let resolveKnown;
    let resolveDone;
    s.run = {
      plan,
      t0: now() - (at ?? 0) * 1000,
      pausedAt: null,
      quiet,
      known: false,
      done: false,
      hit: false,
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
    run.t0 = now() - run.pausedAt * 1000;
    run.pausedAt = null;
    stage.invalidate();
  }

  /** Each frame while a run is on: the cart and the people where the run says, the arrows, the marks, the events. */
  function tick(force = false) {
    const run = s.run;
    if (!run) return false;
    if ((run.done || run.pausedAt != null) && !force) return false;
    const time = runTime();
    const r = rig.place(run.plan, time);
    if (s.scene === 'lane') setFollow(Math.max(s.follow, followFor(r)));
    placeArrows(r);
    syncMarks(time);
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
    if (!run.plan.back) {
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
    while (marks.count * MARK_STEP <= Math.min(time, run.plan.end) + 1e-9 && marks.count < 12)
      marks.add(base + runAt(run.plan, marks.count * MARK_STEP).x);
  }

  const tmpA = new THREE.Vector3();
  /** The force (orange, where it acts), the acceleration (teal, over the load) and the velocity (blue, in front). */
  function placeArrows(r) {
    const front = rig.front();
    const [yF, yA] = arrowHeights(rig);
    // from the cart's middle; pushed back from the front, from the front rail where the person in front pushes
    const cx = r.F < 0 || r.a < 0 ? front + CART.rail.x : front - CART.length / 2;
    // the force on the cart and its acceleration, one over the other from the cart's middle: they always point the
    // same way, and their lengths compare (the force doubled: both double; the mass doubled: the same force, half a)
    if (s.show.F && Math.abs(r.F) > 1e-6) arrows.F.set(tmpA.set(cx, yF, 0), r.F > 0 ? XP : XN, Math.abs(r.F) * F_SCALE);
    else arrows.F.hide();
    const pushing = r.phase === 'push' || r.phase === 'brake';
    if (s.show.a && pushing && Math.abs(r.a) > 1e-6) arrows.a.set(tmpA.set(cx, yA, 0), r.a > 0 ? XP : XN, Math.abs(r.a) * A_SCALE);
    else arrows.a.hide();
    const v = shown(r).v;
    if (s.show.v && v > 0.004) arrows.v.set(tmpA.set(front + 0.03, V_Y, Z_NEAR), XP, v * V_SCALE);
    else arrows.v.hide();
    stage.invalidate();
  }

  /** The heights of the force and the acceleration arrows over a cart: just over its load, and over that. */
  function arrowHeights(target) {
    const yF = Math.max(CART.rail.y, target.cart.top()) + 0.17;
    return [yF, yF + 0.34];
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
    for (const a of Object.values(arrows)) {
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
  const label = (id, opts) => {
    if (anno.has(id)) anno.update(id, { text: opts.text, color: opts.color, optional: Boolean(opts.optional) });
    else anno.add(id, { kind: 'callout', ...opts });
  };
  const pts = {
    F: new THREE.Vector3(),
    a: new THREE.Vector3(),
    v: new THREE.Vector3(),
    m: new THREE.Vector3(),
    mk: new THREE.Vector3(),
    sack: new THREE.Vector3(),
    dp: new THREE.Vector3(),
  };
  const mid = (a, out) => out.copy(a.root.position).add(a.tip).multiplyScalar(0.5);
  const SPOTS = {
    above: [
      { dx: 0, dy: -16 },
      { dx: 0, dy: -30 },
      { dx: 0, dy: 18 },
      { dx: 0, dy: 32 },
    ],
    right: [
      { dx: 12, dy: 0 },
      { dx: 0, dy: 20 },
      { dx: -10, dy: 20 },
      { dx: 10, dy: 16 },
      { dx: 0, dy: 34 },
    ],
    below: [
      { dx: 0, dy: 20 },
      { dx: 0, dy: 34 },
      { dx: -30, dy: 26 },
      { dx: 30, dy: 26 },
    ],
  };

  const tipCache = { 1: null, '-1': null };
  /** Spots beside an arrow's tip, on the side it points to. */
  function tipSpots(way) {
    if (!tipCache[way])
      tipCache[way] = [
        { dx: 10 * way, dy: 0 },
        { dx: 10 * way, dy: 12 },
        { dx: 10 * way, dy: -12 },
        { dx: 0, dy: 22 },
      ];
    return tipCache[way];
  }

  let mAfterV = false;
  function labelsFor() {
    const lane = s.scene !== 'pair';
    const r = state();
    // the force's label beside its tip (left of it when it points left), the acceleration's over its arrow
    const way = r.F < 0 ? -1 : 1;
    if (lane && arrows.F.root.visible)
      label('F', {
        text: t('l_force', { F: sgn(r.F || s.run?.plan?.F || 0) }),
        point: () => pts.F.copy(arrows.F.tip),
        color: COLORS.force,
        spots: tipSpots(way),
      });
    else anno.remove('F');
    if (lane && arrows.a.root.visible) label('a', { text: t('l_acc'), point: () => mid(arrows.a, pts.a), color: COLORS.acc, spots: SPOTS.above });
    else anno.remove('a');
    const moving = lane && arrows.v.root.visible;
    if (moving) {
      label('v', { text: t('l_vel', { v: fix(shown(r).v, 2) }), point: () => pts.v.copy(arrows.v.tip), color: COLORS.vel, spots: SPOTS.right });
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
    // what the marks are (not on a short stage, where the view is full already)
    if (s.scene === 'lane' && s.mode === 'explore' && s.run && marks.count >= 2 && !s.run.done && stage.height >= 300)
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
   * What the big button (and a tap on the cart) does now: push in this example; once the result is in, the next
   * example not tried yet (that word is marked in the row). The badge's number is the student's own step.
   */
  function plan() {
    const run = s.run;
    const step = EXAMPLE_IDS.filter((id) => s.results[id] != null).length + 1;
    if (!run) return { example: s.example, label: `act_${s.example}`, step };
    if (!run.known) return { example: s.example, label: 'act_again', step: '' };
    const next = EXAMPLE_IDS.find((id) => s.results[id] == null && id !== run.plan.id);
    return next ? { example: next, label: `act_on_${next}`, step } : { example: s.example, label: 'act_again', step: '' };
  }

  function outcome(r) {
    const run = s.run;
    if (!run) return ['out_rest', { v: 0 }, 'vel'];
    const m = measured(run.plan);
    if (run.known) return ['out_result', { v: sgn(m.v), u: sgn(m.u), t: m.t, a: sgn(m.a) }, 'acc'];
    const sh = shown(r);
    if (r.phase === 'push') return ['out_push', { t: sh.t.toFixed(1), v: fix(sh.v, 2) }, 'vel'];
    if (r.phase === 'brake') return ['out_brake', { t: sh.t.toFixed(1), v: fix(sh.v, 2) }, 'vel'];
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
      return t('rule_back', { p0: momentum(plan0.m, m.u), p1: momentum(plan0.m, m.v) });
    }
    const base = s.results.base;
    if (id === 'force' && base != null) return t('rule_force', { a0: sgn(base), a1: sgn(a) });
    if (id === 'mass' && base != null) return t('rule_mass', { a0: sgn(base), a1: sgn(a) });
    return t('rule_fma', { k: 1, F: plan0.F, m: plan0.m, a: sgn(a) });
  }
  function ruleHtml(r) {
    const run = s.run;
    if (allFound() && (!run || run.known)) return t('rule_law');
    if (!run) return s.results[s.example] != null ? resultRule(s.example) : startRule(s.example);
    if (!run.known) {
      if (r.phase === 'push') return t('rule_push');
      if (r.phase === 'brake') return t('rule_brake');
      return t('rule_coast');
    }
    const id = run.plan.id;
    if (!id) return t('rule_coast');
    const next = EXAMPLE_IDS.find((e) => s.results[e] == null);
    return `${resultRule(id)}${next ? ` ${t(`rule_ask_${next}`)}` : ''}`;
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

  let lastKind = '';
  let lastNote = '';
  function refresh() {
    const r = state();
    sheet.choose(s.example);
    writeResults();
    const [key, vars, kind] = outcome(r);
    sheet.outcome(t(key, vars));
    if (kind !== lastKind) outcomeEl.dataset.k = lastKind = kind;
    sheet.rule(ruleHtml(r));
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: () => t(p.label, { t: PUSH_TIME }) });
      sheet.next(p.example !== s.example ? p.example : null);
      // the ring shows on the cart while it waits (at the start, or stopped), never while it moves
      const moving = s.run && !s.run.done;
      if (s.scene === 'lane' && !moving) action.show('run');
      else action.hide('run');
    }
    labelsFor();
    const html = `<b>${t('note_head')}</b> <span>${t(stage.width < 470 ? 'note_short' : 'note')}</span>`;
    if (html !== lastNote) {
      note.innerHTML = html;
      lastNote = html;
    }
    stage.invalidate();
  }

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
      mass: run ? run.plan.m : CART_MASS + SACK_MASS * EXAMPLES[s.example].sacks, // kg
      acceleration: round(r.a, 3), // ms⁻² now
      measured: m ? { u: m.u, v: m.v, t: m.t, a: m.a } : null,
      results: { ...s.results },
      paused: run?.pausedAt != null,
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
    const w = 4.3 + (full - 4.3) * wideness();
    return Math.min(full, rig.cfg.back && s.scene === 'lane' ? Math.max(w, 6.1) : w);
  }
  /**
   * How far the side view must have moved along the lane to keep the cart's front and its velocity arrow in view
   * (room ahead for the arrow); while the people push, never so far that they leave the view.
   */
  function followFor(r) {
    const w = windowWidth();
    const front = rig.front();
    // room ahead of the cart for its velocity arrow and the arrow's label
    let f = front + Math.max(1.2, V_SCALE * r.v + 1.35) - (LANE.left + w);
    // the people pushing stay in view; once they let go the view may run on ahead of them, smoothly
    const pushEnd = s.run ? s.run.plan.segs[0].dur : 0;
    f = Math.min(f, front - START_X + 1.5 * Math.max(0, r.t - pushEnd));
    return Math.min(Math.max(0, f), LANE.right - LANE.left - w);
  }
  const BOXES = {
    rig: new THREE.Box3(new THREE.Vector3(-2.5, 0, -0.6), new THREE.Vector3(0.45, 1.72, 0.6)),
    pair: new THREE.Box3(new THREE.Vector3(-2.5, 0, -0.6), new THREE.Vector3(PAIR_B + 0.45, 1.72, 0.6)),
  };
  const laneBox = new THREE.Box3();
  const VIEW_3D = new THREE.Vector3(-0.5, 0.55, 0.9).normalize();
  function viewPose(view = s.view) {
    const lane = s.scene === 'lane';
    if (lane) laneBox.set(new THREE.Vector3(LANE.left, 0, -0.62), new THREE.Vector3(LANE.left + windowWidth(), 1.72, 0.66));
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
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
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
    showDp(false);
    goHome();
    anno.clear();
    rigB.root.visible = false;
    rig.baseX = 0;
    arrows.dp.hide();
    arrows.FB.hide();
    arrows.aB.hide();
    s.show = { F: true, a: true, v: true };
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
        learnSaved = { example: s.example, results: { ...s.results }, seen: [...s.seen] };
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
        s.results = { ...saved.results };
        s.seen = [...saved.seen];
        s.example = saved.example;
        rigB.root.visible = false;
        rig.baseX = 0;
        showDp(false);
        arrows.FB.hide();
        arrows.aB.hide();
        anno.clear();
        s.show = { F: true, a: true, v: true };
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
          say(t('q_look'));
          await wait(300);
          if (!alive()) return null;
          s.show = { F: true, a: false, v: true };
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
          s.show = { F: true, a: false, v: true };
          const brake = planOf('back').segs.find((x) => x.kind === 'brake');
          if (!(await runTo('back', brake.t0 + 0.3, alive))) return null;
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

        // the law, with the two people pushing the empty cart (the run held half way through the push)
        setupRig(rig, EXAMPLES.force);
        say(t('q_look'));
        await wait(300);
        if (!alive()) return null;
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
          s.show = { F: true, a: true, v: true };
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
          s.show = { F: true, a: false, v: true }; // the change of momentum shows in the acceleration's place
          showDp(true);
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
            arr.set(tmpA.set(target.front() - CART.length / 2, arrowHeights(target)[1], 0), XP, a * A_SCALE);
            anno.add(`acc-${key}`, {
              kind: 'callout',
              text: `a = ${N(sgn(a))}${NB}${MS2}`,
              point: () => mid(arr, new THREE.Vector3()),
              color: COLORS.acc,
              spots: SPOTS.above,
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

  /** The change of momentum during the push back: a green arrow over the cart, to the left, while it slows. */
  let dpOn = false;
  function showDp(on) {
    dpOn = on;
    if (!on) {
      arrows.dp.hide();
      anno.remove('dp');
    }
    stage.invalidate();
  }
  stage.onBeforeRender(() => {
    if (!dpOn) return;
    const r = state();
    if (r.phase === 'brake' || r.phase === 'stopped') {
      arrows.dp.set(tmpA.set(rig.front() + CART.rail.x, arrowHeights(rig)[1], 0), XN, 0.6);
      if (!anno.has('dp'))
        anno.add('dp', { kind: 'callout', text: t('l_dp'), point: () => mid(arrows.dp, pts.dp), color: COLORS.momText, spots: SPOTS.above });
    }
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
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey =
      ['1', '2', '3', '4', 'r', 'R', 'Home', 'ArrowRight', 'f', 'F', 'v', 'V'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3', '4'].includes(k)) chooseExample(EXAMPLE_IDS[Number(k) - 1]);
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') {
      ++token;
      goHome();
    } else if (k === 'f' || k === 'F') setView('front');
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
     * push began: jump the run there), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
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
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      ++token;
      s.results = { base: null, force: null, mass: null, back: null };
      s.seen = [];
      s.view = 'front';
      controls.enableRotate = false;
      syncUI();
      await chooseExample('base', { animate: false, quiet: true });
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The handcart with its load and its people where they are, the floor and the pile of sacks, in metres. */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'NewtonsSecondLaw';
      copy.add(floor.group.clone(true), rig.root.clone(true));
      const hidden = [];
      copy.traverse((obj) => {
        if (!obj.visible) hidden.push(obj);
      });
      for (const obj of hidden) obj.removeFromParent();
      return copy;
    },
  };
}
