// Newton's first law (book page 64, topic 3.1), student view: a physics textbook waits on a launcher. One tap gives
// it the same push every time (a spring squeezed to the same notch; it leaves at 3 m/s) onto the floor chosen in the
// panel: a jute mat, a wooden floor, ice, or an imagined floor with no friction. With friction it slows evenly and
// stops, farther on smoother floors; then the camera pulls back to look down the lane from behind the launcher, so
// every floor's stop (a dashed line, "মাদুর ১.৩১ মি") is seen at once. With no friction its velocity never changes:
// the speed stays 3.00 m/s, the marks it leaves every 0.05 s stay evenly spaced, the camera follows it, and once it
// is past the ice's stop the view pulls back and watches it go on for ever. Arrows show the velocity (blue),
// friction against it (crimson) and the push (orange, only while the paddle touches the book). Then a short test.
// The panel is the kit's clean sheet (one action, one result, one rule): the floors as one row of words (the stop
// distance under each once found), one big numbered action whose same numbered badge rings the book (tap either),
// one result line, and one rule that grows with what the student has found, up to the book's first law.
// Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createSlider } from './slider.js';
import { createLauncher } from './launcher.js';
import { createFloor, createMarks, createStopMark, createSurfaces, createTape, FLOOR, SURFACE_COLORS } from './floor.js';
import { COLORS, createArrow, createDottedPath } from './arrows.js';
import { createLabels } from './labels.js';
import { fitPose } from './camera.js';
import {
  BOOK,
  CURVE,
  G,
  PUSH,
  STEP,
  SURFACE_IDS,
  SURFACES,
  V0,
  brakeAt,
  candidatePaths,
  curveAt,
  curveEnd,
  round,
  runAt,
  stopDistance,
  stopTime,
} from './motion.js';

export const DEFAULTS = {
  surface: 'mat', // 'mat' | 'wood' | 'ice' | 'none'
  at: '', // s after the release: start with the book already pushed (for pictures)
  tried: '', // floors already tried, e.g. 'mat,wood' (their stop lines and distances show)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the book pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const FRICTION_IDS = ['mat', 'wood', 'ice'];
const VEL_SCALE = 0.08; // m of arrow per m/s
const FORCE_SCALE = 0.7 / G; // m of arrow per m/s² of the force it gives the book (the mat's friction: 0.245 m)
const PUSH_ARROW = 0.34; // m: the push (15 m/s²) is the biggest force, so the longest arrow (not to the same scale)
const BRAKE_ACC = 4; // m/s²: the steady force that stops the book in one test question
const PASS_ICE = stopDistance(SURFACES.ice.mu) + 0.4; // m: past the ice's stop, the view pulls back
const DOUBLE_TAP = 450; // ms: a second push request this soon after one is ignored
const LANE_LEFT = -PUSH.stroke - BOOK.length - 0.12; // the side view starts here (room for the ring left of the paddle)
const FOLLOW_SHARE = 0.66; // once followed, the book's front stays this far across the view (room for both arrows)
const ELEVATION = [58, 18]; // degrees: the side view looks down as steeply as the frame allows, within these
const VIEW_3D = new THREE.Vector3(-0.62, 0.62, 0.82).normalize();
// down the lane from behind the launcher (portrait frames), more from the side on wide ones (the lane fills the width)
const OVERVIEW_DIRS = [new THREE.Vector3(-1, 0.95, 0.5).normalize(), new THREE.Vector3(-0.42, 0.8, 1).normalize()];
const ENDLESS_LOOK = 1.6; // s the view down the lane lasts with no friction, before it goes back beside the book
// the curved-wall question, seen from above: the whole wall with the run-in, and the four paths (below the note)
const CURVE_BOX = new THREE.Box3(new THREE.Vector3(-0.46, 0, -0.6), new THREE.Vector3(1.4, 0.05, 0.98));

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const two = (x) => N(x.toFixed(2)); // live readouts: fixed decimals
  const plain = (x) => String(+x.toFixed(2)); // numbers in sentences: no trailing zeros
  const about = (x) => String(+x.toFixed(1)); // "প্রায়" numbers: one decimal

  root.classList.add('pvc', 'nf');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'surfaces', results: true, items: SURFACE_IDS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 2, outcome: 1, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const badge = document.createElement('div');
  badge.className = 'nf-badge';
  badge.hidden = true;
  ui.stage.append(badge);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 0.02, far: 150, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  // The owner requested a vivid scene; the white learning panel keeps the text readable.
  const backdropCanvas = document.createElement('canvas');
  backdropCanvas.width = 8;
  backdropCanvas.height = 256;
  const backdropContext = backdropCanvas.getContext('2d');
  const backdropGradient = backdropContext.createLinearGradient(0, 0, 0, 256);
  backdropGradient.addColorStop(0, '#241546');
  backdropGradient.addColorStop(1, '#6c2858');
  backdropContext.fillStyle = backdropGradient;
  backdropContext.fillRect(0, 0, 8, 256);
  const backdrop = new THREE.CanvasTexture(backdropCanvas);
  backdrop.colorSpace = THREE.SRGBColorSpace;
  scene.background = o.bg === 'transparent' ? null : backdrop;
  controls.minDistance = 0.4;
  controls.maxDistance = 80; // the view down the lane stands far back
  controls.enablePan = false;
  controls.enableRotate = false;
  const M = createMaterials(stage.renderer);
  const world = new THREE.Group();
  world.name = 'NewtonsFirstLaw';
  scene.add(world);

  const surfaces = createSurfaces(M.aniso);
  const floor = createFloor(surfaces);
  const tape = createTape({ t });
  const launcher = createLauncher({ materials: M });
  const book = createSlider();
  const marks = createMarks();
  const stops = Object.fromEntries(FRICTION_IDS.map((id) => [id, createStopMark(SURFACE_COLORS[id])]));
  world.add(floor.mesh, tape.group, launcher.root, book.root, marks.mesh);
  for (const m of Object.values(stops)) world.add(m.group);
  marks.mesh.userData.noExport = true;

  // the book's hit box: bigger than the book, so a finger finds it
  const bookHit = new THREE.Mesh(new THREE.BoxGeometry(BOOK.length + 0.17, 0.12, BOOK.width + 0.1), new THREE.MeshBasicMaterial({ visible: false }));
  bookHit.position.set(-BOOK.length / 2, 0.05, 0);
  bookHit.userData.noExport = true;
  book.root.add(bookHit);

  const arrows = {
    velocity: createArrow({ color: COLORS.velocity, name: 'VelocityArrow' }),
    friction: createArrow({ color: COLORS.friction, name: 'FrictionArrow' }),
    push: createArrow({ color: COLORS.push, name: 'PushArrow', radius: 0.008, head: 0.04, headRadius: 0.019 }),
  };
  for (const a of Object.values(arrows)) world.add(a.root);

  // the test's curved-wall scene: a wide imagined floor, a quarter-circle wall, four candidate paths, a trail
  const curve = new THREE.Group();
  curve.name = 'CurveScene';
  curve.visible = false;
  curve.userData.noExport = true;
  const gridMat = surfaces.none.top.clone();
  gridMat.map = surfaces.none.top.map.clone();
  gridMat.map.repeat.set(8 / 0.5, 8 / 0.5);
  gridMat.map.needsUpdate = true;
  const gridFloor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), gridMat);
  gridFloor.rotation.x = -Math.PI / 2;
  gridFloor.position.set(0.5, -0.0005, 0.3);
  curve.add(gridFloor);
  const wall = (() => {
    const inner = CURVE.r + BOOK.width / 2 + 0.004;
    const outer = inner + 0.022;
    const sh = new THREE.Shape();
    const n = 40;
    const a0 = -0.08;
    const a1 = Math.PI / 2;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      const p = [outer * Math.sin(a), -outer * Math.cos(a)];
      i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]);
    }
    for (let i = n; i >= 0; i--) {
      const a = a0 + ((a1 - a0) * i) / n;
      sh.lineTo(inner * Math.sin(a), -inner * Math.cos(a));
    }
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(Math.PI / 2);
    g.translate(0, 0.05, 0);
    const mesh = new THREE.Mesh(g, M.wood);
    mesh.name = 'CurvedWall';
    return mesh;
  })();
  curve.add(wall);
  const wallMid = new THREE.Vector3((CURVE.r + 0.12) * Math.sin(Math.PI / 3), 0.05, -(CURVE.r + 0.12) * Math.cos(Math.PI / 3));
  const options4 = Array.from({ length: 4 }, () => createDottedPath());
  const trail = createDottedPath({ color: '#98a3b3', max: 120, radius: 0.0048 });
  for (const p of [...options4, trail]) curve.add(p.mesh);
  world.add(curve);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  // labels keep clear of the corner buttons, the note on the stage and the hint line (when they show)
  const shown = (e) => !e.hidden && (e !== ui.hint || ui.hint.classList.contains('show'));
  const labels = createLabels({
    stage,
    layer: ui.annoLayer,
    avoid: () => [ui.corner, badge, ui.hint].filter(shown).map((e) => e.getBoundingClientRect()),
    blockers: () => sceneBlockers(),
  });

  let sun = null;
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun = new THREE.DirectionalLight(0xffffff, 0.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 1, far: 8 });
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);
    floor.mesh.receiveShadow = true;
    gridFloor.receiveShadow = true;
    for (const obj of [book.root, launcher.root, wall])
      obj.traverse((m) => {
        if (m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false) m.castShadow = true;
      });
  }
  function placeSun(x) {
    if (!sun) return;
    sun.position.set(x + 0.4, 3.2, 1.8);
    sun.target.position.set(x, 0, 0);
  }

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null; // the big button and its ring on the book (made with the panel, below)
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    surface: SURFACE_IDS.includes(o.surface) ? o.surface : 'mat',
    view: o.view === '3d' ? '3d' : 'front',
    cam: 'side', // 'side' (beside the book, following it) | 'overview' (down the lane, every stop in view)
    mode: 'explore',
    locked: false,
    scene: 'lane', // 'lane' | 'curve' (a test question)
    run: null, // { surface, mu, t0, state, brake: { since, x } | null, stopped: Promise, quiet }
    restAt: null, // where the book waits when it is not on the launcher (a test question), else null
    results: { mat: null, wood: null, ice: null, none: null }, // stop distance (m), or Infinity (never stops)
    follow: 0, // m the side view has moved along with the book
    forces: true, // the force arrows show (the test hides them until the answer; the velocity always shows)
    userMovedCamera: false,
  };
  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ── the run ─────────────────────────────────────────────────────────────────
  const restX = -PUSH.stroke; // the book's front edge while it waits on the plate
  let token = 0; // bumped by anything that calls off what is pending (new push, floor, test, reset)
  let lastPush = Number.NEGATIVE_INFINITY;

  /** The run at t s after the paddle started: the push, the slide, a test's steady stopping force, the stop. */
  function runState(run, t) {
    const st = runAt(t, run.mu);
    if (!run.brake || st.since < run.brake.since) return st;
    const b = brakeAt(st.since - run.brake.since, V0, BRAKE_ACC);
    return { phase: b.moving ? 'brake' : 'stopped', x: run.brake.x + b.dx, v: b.v, since: st.since };
  }
  /** s after the release when the run comes to rest (Infinity: never). */
  const endSince = (run) => (run.brake ? run.brake.since + V0 / BRAKE_ACC : stopTime(run.mu));
  function state() {
    const run = s.run;
    if (!run) return { phase: 'rest', x: s.restAt ?? restX, v: 0, since: null };
    return runState(run, Math.max(0, (now() - run.t0) / 1000));
  }

  const tmpA = new THREE.Vector3();
  const XP = new THREE.Vector3(1, 0, 0);
  const XN = new THREE.Vector3(-1, 0, 0);
  function placeLane(st) {
    book.root.position.set(st.x, 0, 0);
    book.root.rotation.set(0, 0, 0);
    launcher.setPaddle(st.phase === 'push' ? st.x - BOOK.length : paddleBack ? launcher.restBack : launcher.stopBack);
    const lane = s.scene === 'lane';
    const forces = s.forces && lane;
    // velocity: from the front edge, at half the book's height
    if (lane && st.v > 0.005) arrows.velocity.set(tmpA.set(st.x + 0.004, BOOK.thick * 0.55, 0), XP, st.v * VEL_SCALE);
    else arrows.velocity.hide();
    // friction: at the floor, from the back edge, backward, while it slides on a floor with friction
    const mu = SURFACES[s.run?.surface ?? s.surface].mu;
    if (forces && st.phase === 'slide' && mu > 0) arrows.friction.set(tmpA.set(st.x - BOOK.length - 0.004, 0.012, 0.045), XN, mu * G * FORCE_SCALE);
    else arrows.friction.hide();
    // the push: from the paddle forward over the book, only while the paddle touches it; the test's stopping force:
    // over the book, backward
    if (forces && st.phase === 'push') arrows.push.set(tmpA.set(st.x - BOOK.length - 0.06, BOOK.thick + 0.045, 0), XP, PUSH_ARROW);
    else if (forces && st.phase === 'brake') arrows.push.set(tmpA.set(st.x + 0.03, BOOK.thick + 0.045, 0), XN, BRAKE_ACC * FORCE_SCALE);
    else arrows.push.hide();
    syncMarks(st);
    // the side view follows the book once it is well across (and stays when it stops)
    if (s.run && s.cam === 'side') setFollow(Math.max(s.follow, st.x - followAt()));
    else if (s.cam === 'overview') setFollow(s.follow);
  }

  /** The marks the book leaves every STEP s, added as it gets there (none before the release). */
  function syncMarks(st) {
    const run = s.run;
    if (!run || st.since == null || st.since < 0) {
      if (marks.added) marks.clear();
      return;
    }
    const end = Math.min(st.since, endSince(run));
    while (marks.added * STEP <= end + 1e-9) marks.add(runState(run, marks.added * STEP + PUSH.time).x - BOOK.length / 2);
  }

  // the paddle's place when the book is not being pushed: at its stops after a push, else in its notch
  let paddleBack = true;

  /** The side view has moved f m along the lane; the floor and the tape run on ahead of what the camera sees. */
  function setFollow(f) {
    const d = f - s.follow;
    if (Math.abs(d) > 1e-9 && s.cam === 'side') {
      camera.position.x += d;
      controls.target.x += d;
      controls.update();
    }
    s.follow = f;
    if (s.cam === 'overview') {
      const x = state().x;
      floor.setExtent(FLOOR.start, Math.max(14, x + 30));
      tape.show(0, Math.min(30, Math.max(13, x + 3)));
      placeSun(x);
    } else {
      floor.setExtent(FLOOR.start, Math.max(4, f + 6));
      tape.show(Math.max(0, f - 1.6), f + 4.5);
      placeSun(f);
    }
    stage.invalidate();
  }

  function startRun({ quiet = false, at = null } = {}) {
    const mu = SURFACES[s.surface].mu;
    const t0 = at == null ? now() : now() - (PUSH.time + at) * 1000;
    let stopped;
    s.run = {
      surface: s.surface,
      mu,
      t0,
      state: 'push',
      brake: null,
      stopped: new Promise((r) => (stopped = r)),
      resolve: () => stopped(true),
      quiet,
    };
    paddleBack = false;
    launcher.setLatch(false);
    marks.clear();
    if (!quiet) audio.pop();
    emit('push', { surface: s.surface });
    tick(true);
  }

  /**
   * Back to the start: the book waits on the plate again, the paddle in its notch, the camera flies back beside it.
   * Resolves true if nothing else came first. own: false when push() calls it (push keeps its own token).
   */
  async function goHome({ animate = true, own = true } = {}) {
    const my = own ? ++token : token;
    if (s.run) s.run.resolve();
    s.run = null;
    s.restAt = null;
    marks.clear();
    paddleBack = true;
    launcher.setLatch(true);
    tweener.cancel('overview');
    const wasOverview = s.cam === 'overview';
    const from = s.follow;
    s.cam = 'side';
    placeLane(state());
    refresh();
    emitChange();
    if (wasOverview) {
      s.follow = 0;
      setFollow(0);
      controls.enableRotate = s.scene === 'lane';
      const done = await flyTo(viewPose(), animate ? 0.9 : 0);
      return done !== false && my === token;
    }
    if (!animate || from < 0.01) {
      tweener.cancel('follow');
      setFollow(0);
      return true;
    }
    const done = await tweener.animate({
      key: 'follow',
      duration: Math.min(0.75, 0.35 + from * 0.05),
      ease: ease.inOutCubic,
      onUpdate: (k) => setFollow(from * (1 - k)),
    }).finished;
    if (done && my === token) setFollow(0);
    return my === token;
  }

  /**
   * The push: the book goes back to the start if it is not there, then the paddle pushes it (the same push every
   * time). quiet: the test does it, not the student. at: jump to that many seconds after the release.
   */
  async function push({ quiet = false, animate = true, at = null } = {}) {
    if (s.locked && !quiet) return lockedNudge();
    if (!quiet && now() - lastPush < DOUBLE_TAP) return; // a double tap must not undo the first push
    lastPush = now();
    if (!quiet) hintOff();
    const my = ++token;
    const glide = animate && at == null;
    if (s.run || s.follow > 0.001 || s.cam !== 'side' || s.restAt != null) {
      if (!(await goHome({ animate: glide, own: false }))) return;
      if (glide) await wait(120);
      if (my !== token) return; // overtaken while going back
    }
    if (s.locked && !quiet) return;
    startRun({ quiet, at: at ?? (animate ? null : endTime()) });
  }
  /** Where a push without animation lands: friction floors at their stop, the floor with no friction 3 s on. */
  const endTime = () => (SURFACES[s.surface].mu > 0 ? stopTime(SURFACES[s.surface].mu) + 0.01 : 3);

  /** Each frame while a run is on: the book where the physics says, the run's phase, the stop. */
  function tick(force = false) {
    const run = s.run;
    if (!run || s.scene !== 'lane') return false;
    if (run.state === 'stopped' && !force) return false;
    const st = state();
    placeLane(st);
    if (st.phase !== run.state) {
      run.state = st.phase;
      if (st.phase === 'stopped') {
        if (!run.brake) {
          const d = round(stopDistance(run.mu), 2);
          s.results[run.surface] = d;
          stops[run.surface]?.place(d);
          if (s.mode === 'explore') {
            if (seen.includes(run.surface)) seen.splice(seen.indexOf(run.surface), 1);
            seen.push(run.surface);
          }
          emit('stop', { surface: run.surface, distance: d });
          if (s.mode === 'explore') pullBackSoon(run);
        }
        if (!run.quiet) audio.contact();
        run.resolve();
      }
      emitChange();
    }
    if (run.mu === 0 && !run.brake && st.x > PASS_ICE) {
      if (s.results.none == null) {
        s.results.none = Number.POSITIVE_INFINITY; // past the ice's stop and still at 3 m/s: it never stops
        emitChange();
      }
      if (!run.pulledBack && s.mode === 'explore' && s.cam === 'side') {
        // a look down the lane: it has passed every floor's stop and is still at 3 m/s; then back beside it
        run.pulledBack = true;
        const my = token;
        showOverview({ duration: 1 }).then((done) => {
          if (!done) return;
          setTimeout(() => {
            if (my === token && s.run === run && s.cam === 'overview') setView(s.view, { duration: 1 });
          }, ENDLESS_LOOK * 1000);
        });
      }
    }
    refresh();
    return st.phase !== 'stopped';
  }
  stage.addTicker(() => tick());

  /** A moment after a stop the view pulls back down the lane (unless the student has done something else). */
  function pullBackSoon(run) {
    const my = token;
    setTimeout(() => {
      if (my === token && s.run === run && s.mode === 'explore' && s.cam === 'side' && !s.userMovedCamera) showOverview();
    }, 900);
  }

  // ── labels on the scene ─────────────────────────────────────────────────────
  const pinPoint = Object.fromEntries(FRICTION_IDS.map((id) => [id, () => stops[id].top]));
  // each arrow's label beside its middle or its tip (whichever has room), never on the arrow
  const velPoints = [() => arrows.velocity.mid, () => arrows.velocity.end];
  const fricPoints = [() => arrows.friction.end, () => arrows.friction.mid];
  const pushPoints = [() => arrows.push.mid];
  const trailPoint = new THREE.Vector3();
  // the dots' caption: on the floor behind the book, nearer the viewer than the arrows (clear of the book)
  const marksPoints = [() => trailPoint.set(book.root.position.x - BOOK.length - 0.08, 0, 0.17)];
  const bookPoint = new THREE.Vector3();
  const bookPoints = [() => bookPoint.set(book.root.position.x - BOOK.length / 2, BOOK.thick, 0)];
  function labelsFor() {
    if (s.scene !== 'lane') return;
    const side = s.cam === 'side';
    if (arrows.velocity.visible && side)
      labels.set('vel', {
        text: t('l_velocity'),
        point: velPoints,
        spots: [
          [0, -12],
          [0, -30],
          [8, 0, 1],
          [0, 12],
        ],
        priority: 4,
        color: COLORS.velocity,
        leader: false,
      });
    else labels.hide('vel');
    if (arrows.friction.visible && side)
      labels.set('fric', {
        text: t('l_friction'),
        point: fricPoints,
        spots: [
          [-8, 0],
          [0, 12, 1],
          [0, -12, 1],
          [0, 12],
          [0, -14],
        ],
        priority: 4,
        color: COLORS.friction,
        leader: false,
      });
    else labels.hide('fric');
    if (arrows.push.visible && side)
      labels.set('push', {
        text: t(state().phase === 'brake' ? 'l_force' : 'l_push'),
        point: pushPoints,
        spots: [
          [0, -10],
          [0, -26],
          [0, 12],
        ],
        priority: 5,
        color: COLORS.push,
        leader: false,
      });
    else labels.hide('push');
    // what the dots are, under the trail behind the book, while it leaves them
    if (side && marks.added >= 4 && s.run && s.mode === 'explore')
      labels.set('marks', {
        text: t('l_marks', { s: STEP }),
        point: marksPoints,
        spots: [
          [0, 0],
          [-6, 0],
          [6, 0],
          [-50, 0],
          [-90, 0],
          [0, 22],
        ],
        priority: 0,
        color: '#4b5766',
        kind: 'part',
        leader: false,
      });
    else labels.hide('marks');
    // seen from far behind, the gliding book is small: say where it is (a stopped one sits on its labelled line)
    if (!side && s.run?.mu === 0)
      labels.set('book', {
        text: t('l_book'),
        point: bookPoints,
        spots: [
          [10, -10],
          [-10, -10],
          [10, 10],
          [-10, 10],
        ],
        priority: 7,
        color: '#2f7a43',
        leader: true,
      });
    else labels.hide('book');
    for (const id of FRICTION_IDS) {
      if (s.results[id] == null || !stops[id].group.visible) {
        labels.hide(`pin-${id}`);
        continue;
      }
      // the floor just tried is placed first and never hidden: the book sits on its line, inside the ring, so its
      // label gets spots that clear the ring
      const newest = id === newestPin();
      labels.set(`pin-${id}`, {
        text: t('pin', { name: t(`chip_${id}`), d: plain(s.results[id]) }),
        point: pinPoint[id],
        // above its line first; beside or below it when the corner buttons or the book are in the way (the far end
        // of the view down the lane is up by the buttons)
        spots: [
          [0, -8],
          [0, -24],
          [0, -30],
          [0, -46],
          [-40, -20],
          [40, -20],
          [6, -6],
          [-6, -6],
          [0, 8],
          [-12, 0],
          [12, 0],
          [-10, 14],
          [10, 14],
          [0, 28],
          [0, 44],
        ],
        priority: newest ? 9 : side ? 1 : 6,
        keep: newest,
        color: SURFACE_COLORS[id],
        leader: true,
      });
    }
  }

  /** The floor whose stop line the book is on (the run on screen), else the one tried last. */
  function newestPin() {
    if (s.run && FRICTION_IDS.includes(s.run.surface)) return s.run.surface;
    return seen[seen.length - 1] ?? null;
  }

  /** The book and its arrows: boxes on the screen that no label may cover (read after the frame is drawn). */
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const tmpBox = new THREE.Box3();
  const blockersList = [];
  function screenBox(obj, out) {
    tmpBox.setFromObject(obj);
    if (tmpBox.isEmpty()) return null;
    let i = 0;
    for (const x of [tmpBox.min.x, tmpBox.max.x])
      for (const y of [tmpBox.min.y, tmpBox.max.y]) for (const z of [tmpBox.min.z, tmpBox.max.z]) corners[i++].set(x, y, z).project(camera);
    out.l = Number.POSITIVE_INFINITY;
    out.t = Number.POSITIVE_INFINITY;
    out.r = Number.NEGATIVE_INFINITY;
    out.b = Number.NEGATIVE_INFINITY;
    for (const c of corners) {
      const x = (c.x * 0.5 + 0.5) * stage.width;
      const y = (-c.y * 0.5 + 0.5) * stage.height;
      out.l = Math.min(out.l, x);
      out.r = Math.max(out.r, x);
      out.t = Math.min(out.t, y);
      out.b = Math.max(out.b, y);
    }
    return out;
  }
  const bookShape = book.root.children[0];
  const boxes = Array.from({ length: 4 }, () => ({ l: 0, t: 0, r: 0, b: 0 }));
  function sceneBlockers() {
    blockersList.length = 0;
    const b = screenBox(bookShape, boxes[0]);
    if (b) blockersList.push(b);
    let i = 1;
    for (const a of Object.values(arrows)) if (a.visible && screenBox(a.root, boxes[i])) blockersList.push(boxes[i++]);
    // the numbered badge and the ring round the book: no label sits on them (the badge keeps clear of the labels too)
    for (const box of [action?.box(), action?.ringBox()]) if (box) blockersList.push({ l: box.left, t: box.top, r: box.right, b: box.bottom });
    return blockersList.slice();
  }

  // ── the panel: one action, one result, one rule ─────────────────────────────
  const outcomeEl = ui.$('.pvc-outcome');
  /** Floors in the order their stops were seen (for the comparison in the rule). */
  const seen = [];
  const moving = (st) => st.phase === 'push' || st.phase === 'slide' || st.phase === 'brake';

  /**
   * What the big button (and a tap on the book) does now: push on this floor; or, once the book has stopped (or,
   * with no friction, has passed every floor's stop), push on the next floor not tried yet, in the row's order (that
   * word is marked in the row). The badge's number is the student's own step: the floors tried so far + 1; "আবার
   * ধাক্কা দাও" has none.
   */
  function plan(st = state()) {
    const run = s.run;
    const step = SURFACE_IDS.filter((id) => s.results[id] != null).length + 1;
    if (!run) return { surface: s.surface, label: 'act_push', step };
    const over = st.phase === 'stopped' || (run.mu === 0 && s.results.none != null);
    const next = over ? SURFACE_IDS.find((id) => s.results[id] == null && id !== run.surface) : null;
    return next ? { surface: next, label: `act_on_${next}`, step } : { surface: s.surface, label: 'act_again', step: '' };
  }

  /** The result line: [key, vars, kind] (kind colours the number: the velocity's blue or the floor's colour). */
  function outcomeKey(st) {
    const run = s.run;
    if (!run) return ['out_rest', { v: 0 }, 'rest'];
    if (st.phase === 'stopped' && !run.brake) return ['out_stop', { at: t(`at_${run.surface}`), d: plain(stopDistance(run.mu)) }, run.surface];
    const vars = { v: two(st.v), d: two(Math.max(0, st.x)) };
    return [run.mu === 0 && s.results.none != null ? 'out_none' : 'out_move', vars, 'speed'];
  }

  /** The rule: the book's words, growing with what the student has found (before, a floor, a comparison, the law). */
  function ruleHtml(st) {
    const law = s.results.none != null;
    const run = s.run;
    if (!run) return law ? t('rule_law') : t(s.surface === 'none' ? 'rule_rest_none' : 'rule_rest', { v: V0 });
    // during the 0.2 s push the paddle's force speeds the book up: never "the velocity does not change" yet
    if (st.phase === 'push') return t('rule_push', { v: V0 });
    if (run.mu === 0) return t(law ? 'rule_law' : 'rule_slide_none');
    if (st.phase !== 'stopped') return t('rule_slide');
    if (law) return t('rule_book_stop');
    const here = run.surface;
    // compare with the floor tried just before (else with the known floor whose friction is nearest)
    const near = (a, b) => Math.abs(SURFACES[a].mu - SURFACES[here].mu) - Math.abs(SURFACES[b].mu - SURFACES[here].mu);
    const other =
      [...seen].reverse().find((id) => id !== here && s.results[id] != null) ??
      FRICTION_IDS.filter((id) => id !== here && s.results[id] != null).sort(near)[0];
    if (!other) return t(`rule_stop_${here}`);
    const less = SURFACES[here].mu < SURFACES[other].mu;
    const vars = { here: t(`at_${here}`), there: t(`of_${other}`) };
    return `${t(less ? 'rule_less' : 'rule_more', vars)}${less ? ` ${t('rule_what_if')}` : ''}`;
  }

  let lastNote = '';
  let lastKind = '';
  function refresh() {
    const st = state();
    sheet.choose(s.surface);
    for (const id of SURFACE_IDS) {
      const r = s.results[id];
      sheet.result(id, r == null ? '' : Number.isFinite(r) ? t('res_m', { d: plain(r) }) : t('res_none'));
    }
    const [key, vars, kind] = outcomeKey(st);
    sheet.outcome(t(key, vars));
    if (kind !== lastKind) outcomeEl.dataset.k = lastKind = kind;
    sheet.rule(ruleHtml(st));
    if (action) {
      const p = plan(st);
      action.set({ step: p.step, label: p.label });
      sheet.next(p.surface !== s.surface ? p.surface : null); // the word the action will choose next
      // the ring shows on the book while it waits (at the start or at its stop), never while it moves
      if (s.scene === 'lane' && !moving(st) && !(s.run?.mu === 0 && st.phase !== 'stopped')) action.show('run');
      else action.hide('run');
    }
    labelsFor();
    const none = (s.scene === 'lane' && s.surface === 'none') || s.scene === 'curve';
    badge.hidden = !none;
    // the honest note, in two pieces that wrap between them on a narrow stage
    const note = `<b>${t('badge_head')}</b> <span>${t(stage.width < 470 ? 'badge_none_short' : 'badge_none')}</span>`;
    if (none && note !== lastNote) {
      badge.innerHTML = note;
      lastNote = note;
    }
    stage.invalidate();
  }

  function snapshot() {
    const st = state();
    const p = plan(st);
    const res = Object.fromEntries(
      SURFACE_IDS.map((id) => [id, s.results[id] == null ? null : Number.isFinite(s.results[id]) ? s.results[id] : 'never']),
    );
    return {
      surface: s.surface,
      phase: st.phase, // 'rest' | 'push' | 'slide' | 'brake' (a test question) | 'stopped'
      speed: round(st.v, 2), // m/s
      distance: round(Math.max(0, st.x), 2), // m from the release point (the book's front edge)
      time: st.since == null ? null : round(Math.max(0, st.since), 2), // s since the release
      friction: SURFACES[s.run?.surface ?? s.surface].mu, // μ of the floor it is on
      results: res, // where it stopped on each floor tried (m), 'never' for the floor with no friction
      camera: s.cam, // 'side' | 'overview'
      view: s.view,
      mode: s.mode,
      next: { surface: p.surface, step: p.step }, // what the big button does now: push on that floor (step '' = again)
    };
  }

  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.surface, snap.phase, snap.results, snap.mode, snap.camera]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  /** The floor under the book from now on (its look, the row of words, the event). */
  function chooseSurface(id) {
    const changed = id !== s.surface;
    s.surface = id;
    floor.setSurface(id);
    refresh();
    if (changed) emit('surface', { surface: id });
  }

  /** A new floor: anything moving is called off and the book waits at the start. */
  async function setSurface(id, { animate = true, quiet = false } = {}) {
    if (!SURFACE_IDS.includes(id)) return;
    if (s.locked && !quiet) return lockedNudge();
    chooseSurface(id);
    await goHome({ animate });
    refresh();
    emitChange();
  }

  /** The action: the big button, its badge on the view, a tap on the book or the launcher, Space/Enter/→. */
  function doAction() {
    if (s.locked) return lockedNudge();
    const p = plan();
    if (p.surface !== s.surface) {
      if (now() - lastPush < DOUBLE_TAP) return; // a double tap must not skip a floor
      chooseSurface(p.surface); // the push takes the book back to the start first
    }
    push();
  }

  // the big button in the panel and the numbered ring on the book (taps on the ring go through to the book)
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_push',
    target: () => (s.scene === 'lane' ? book.touchTarget : null),
    pad: 8,
    avoid: [ui.corner, ui.hint, badge, () => [...ui.annoLayer.querySelectorAll('.nf-label.in')]],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── camera ──────────────────────────────────────────────────────────────────
  /** 0 for a portrait stage … 1 for a wide one. */
  const wideness = () => Math.min(1, Math.max(0, (stage.width / Math.max(1, stage.height) - 0.95) / 0.85));
  /** How much floor the side view shows: the book and both its arrows, a little more on wide frames. */
  const laneWidth = () => 0.81 + 0.39 * wideness();
  /** Where the book's front stays once the side view follows it (x before following). */
  const followAt = () => LANE_LEFT + FOLLOW_SHARE * laneWidth();
  /** The side view from `deg` degrees above the floor. */
  function sideDir(deg) {
    const e = THREE.MathUtils.degToRad(deg);
    return new THREE.Vector3(0, Math.sin(e), Math.cos(e));
  }
  const probe = new THREE.PerspectiveCamera();
  // the side view lets the far edge of the floor run under the corner buttons (nothing there to read); the view from
  // above keeps clear of them (the paths' letters)
  const SIDE_MARGIN = { top: 22, bottom: 8, side: 6 };
  const TOP_MARGIN = { top: 54, bottom: 10, side: 8 };
  const fit = (box, dir, margin = SIDE_MARGIN) => fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin });
  const sideBox = new THREE.Box3();
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  /** Metres of the book's line (z = 0) seen across the whole view from a pose. */
  function widthAtBook(pose) {
    probe.copy(camera);
    probe.position.copy(pose.position);
    probe.lookAt(pose.target);
    probe.updateMatrixWorld();
    pA.set(pose.target.x, 0, 0).project(probe);
    pB.set(pose.target.x + 1, 0, 0).project(probe);
    return 2 / Math.max(1e-6, pB.x - pA.x);
  }
  /**
   * The side view at the start of the lane: laneWidth() of floor across the view at the book's line (the nearer tape
   * looks wider and runs off the sides), looking down as steeply as the frame's height allows.
   */
  function sidePose() {
    const want = laneWidth();
    const c = LANE_LEFT + want / 2;
    let pose = null;
    for (let e = ELEVATION[0]; e >= ELEVATION[1]; e -= 2) {
      let w = want;
      for (let i = 0; i < 4; i++) {
        sideBox.min.set(c - w / 2, 0, -FLOOR.width / 2 - 0.01);
        sideBox.max.set(c + w / 2, 0.06, FLOOR.width / 2 + 0.11);
        pose = fit(sideBox, sideDir(e));
        w *= want / widthAtBook(pose);
      }
      if (widthAtBook(pose) <= want * 1.03) break;
    }
    return pose;
  }
  const overviewBox = new THREE.Box3();
  /**
   * Down the lane from behind the launcher: the start, every stop line and the book. With no friction the frame
   * reaches far enough (18 m) to keep the gliding book in sight while the view lasts.
   */
  function overviewPose() {
    let far = s.run?.mu === 0 ? 18 : 3;
    for (const id of FRICTION_IDS) if (s.results[id] != null) far = Math.max(far, s.results[id]);
    far = Math.max(far, state().x);
    overviewBox.min.set(-0.7, 0, -FLOOR.width / 2);
    overviewBox.max.set(far + 0.8, 0.1, FLOOR.width / 2 + 0.11);
    const dir = new THREE.Vector3().lerpVectors(OVERVIEW_DIRS[0], OVERVIEW_DIRS[1], wideness()).normalize();
    return fit(overviewBox, dir, TOP_MARGIN);
  }
  function viewPose(view = s.view) {
    if (s.scene === 'curve') return fit(CURVE_BOX, new THREE.Vector3(0, 1, 0.02).normalize(), TOP_MARGIN);
    if (s.cam === 'overview') return overviewPose();
    const pose = view === '3d' ? fit(sideBoxFor3d(), VIEW_3D) : sidePose();
    pose.position.x += s.follow;
    pose.target.x += s.follow;
    return pose;
  }
  function sideBoxFor3d() {
    sideBox.min.set(LANE_LEFT, 0, -FLOOR.width / 2);
    sideBox.max.set(LANE_LEFT + laneWidth(), 0.06, FLOOR.width / 2 + 0.11);
    return sideBox;
  }
  function flyTo({ position, target }, duration = 0.8, key = 'camera') {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel(key);
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    // the follow may move the camera meanwhile: fly relative to it
    const f0 = s.follow;
    return tweener.animate({
      key,
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        const df = s.cam === 'side' ? s.follow - f0 : 0;
        camera.position.lerpVectors(p0, position, k).x += df;
        controls.target.lerpVectors(t0, target, k).x += df;
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  /** Pull back to look down the lane: every stop seen at once (not in the test). */
  function showOverview({ animate = true, duration = 1.4 } = {}) {
    if (s.scene !== 'lane') return Promise.resolve(false);
    s.cam = 'overview';
    controls.enableRotate = false;
    setFollow(s.follow);
    refresh();
    emitChange();
    emit('view', { view: s.view, camera: 'overview' });
    return flyTo(overviewPose(), animate ? duration : 0, 'overview');
  }
  function setView(view, { animate = true, duration = 0.8 } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    if (s.cam === 'overview') {
      // back beside the book, wherever it is now
      s.cam = 'side';
      tweener.cancel('overview');
      s.follow = Math.max(0, state().x - followAt());
      setFollow(s.follow);
    }
    controls.enableRotate = s.scene === 'lane';
    s.userMovedCamera = false;
    syncUI();
    refresh();
    emitChange();
    emit('view', { view: s.view, camera: 'side' });
    return flyTo(viewPose(), animate ? duration : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    turning = true;
  });
  // the view starts from the front; a drag turns it (the camera really moves: a tap never does), and then the "front"
  // button appears to come back
  let turning = false;
  controls.addEventListener('end', () => {
    turning = false;
  });
  controls.addEventListener('change', () => {
    if (!turning || s.view === '3d') return;
    s.view = '3d';
    syncUI();
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0, s.cam === 'overview' ? 'overview' : 'camera');
    refresh();
  });

  // ── touching the scene: the book or the launcher pushes ─────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** 'book' | 'launcher' | null under a canvas point. */
  function pick(p) {
    if (s.scene !== 'lane') return null;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.intersectObject(bookHit, false).length) return 'book';
    if (launcher.root.visible && raycaster.intersectObject(launcher.hit, false).length) return 'launcher';
    return null;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const what = pick(canvasPoint(e));
      if (!what) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const phase = state().phase;
      if (phase === 'push' || phase === 'slide') {
        if (now() - lastPush > DOUBLE_TAP) showHint(t('hint_wait'), { duration: 2600 });
        return;
      }
      doAction(); // it acts as the finger goes down: the same as the big button
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
    // in the test the hint sits at the top of the view (style.css), clear of the paths and their letters
    showHint(t('q_locked'), { duration: 2400 });
    audio.error();
  }

  // ── the curved-wall scene (a test question) ─────────────────────────────────
  function setScene(next) {
    s.scene = next;
    const lane = next === 'lane';
    for (const obj of [floor.mesh, tape.group, launcher.root, marks.mesh]) obj.visible = lane;
    for (const id of FRICTION_IDS) stops[id].group.visible = lane && s.results[id] != null;
    curve.visible = !lane;
    if (!lane) {
      for (const a of Object.values(arrows)) a.hide();
      for (const id of ['vel', 'fric', 'push', 'marks', 'clock', 'book']) labels.remove(id);
      labels.clear('pin-');
    } else {
      labels.clear('opt');
      labels.remove('wall');
    }
    controls.enableRotate = lane;
    s.userMovedCamera = false;
    flyTo(viewPose(), 0);
    refresh();
  }
  const trailPoints = [];
  /**
   * The book on the curved-wall run, dist m along it (its centre on the path, its length along the heading; past the
   * wall's end the run goes straight on), with a faint trail of where its middle has been.
   */
  function placeCurve(dist) {
    const { x, z, heading } = curveAt(dist);
    book.root.rotation.set(0, -heading, 0);
    book.root.position.set(x + (Math.cos(heading) * BOOK.length) / 2, 0, z + (Math.sin(heading) * BOOK.length) / 2);
    trailPoints.length = 0;
    for (let d = 0; d <= dist - BOOK.length / 2; d += 0.02) trailPoints.push(curveAt(d));
    trail.set(trailPoints, 0.002, 0.028);
    stage.invalidate();
  }
  /** Moves the book along the run from a to b metres at the curve's speed (resolves false if called off). */
  function rideCurve(a, b) {
    return tweener.animate({
      key: 'curve',
      duration: Math.abs(b - a) / CURVE.speed,
      ease: ease.linear,
      onUpdate: (k) => placeCurve(a + (b - a) * k),
    }).finished;
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
  const letters = [...t('letters')];
  /** Four tap choices from string keys (the right one first): shuffled, with the index of the right one. */
  function textChoices(items, kind, extra = {}) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="nf-opt">${list[j].text}</span>`,
      meta: { kind, answer: items[0].key, ...extra },
    };
  }
  const item = (key, vars) => ({ key, text: t(key, vars) });
  /** The five kinds in a random order, the two on the floor without friction never one after the other. */
  function questionOrder() {
    const kinds = ['predict', 'whystop', 'farther', 'curve', pickOne(['stopit', 'rest'])];
    for (let i = 0; i < 50; i++) {
      shuffle(kinds);
      const a = kinds.indexOf('predict');
      const b = kinds.findIndex((k) => k === 'stopit' || k === 'rest');
      if (Math.abs(a - b) > 1) break;
    }
    return kinds;
  }

  let learnSaved = null;
  let kinds = [];
  let question = null;
  let picked = -1;

  /** A clean scene for a question: nothing moving, no marks, no labels left from before, the side view. */
  async function cleanScene(surface = 'none') {
    ++token;
    tweener.cancel('curve');
    tweener.cancel('clock');
    if (s.run) s.run.resolve();
    s.run = null;
    for (const id of SURFACE_IDS) s.results[id] = null;
    for (const m of Object.values(stops)) m.group.visible = false;
    for (const p of options4) {
      p.clear();
      p.material.opacity = 1;
    }
    trail.clear();
    labels.clear('opt');
    labels.clear('pin-');
    labels.remove('wall');
    labels.remove('clock');
    launcher.root.visible = true;
    s.forces = false;
    if (s.scene !== 'lane') setScene('lane');
    s.surface = surface;
    floor.setSurface(surface);
    await goHome({ animate: false });
    if (s.view !== 'front') setView('front', { animate: false });
    refresh();
  }

  /** The book alone in the middle of the floor with no friction (the launcher out of sight). */
  function restScene() {
    s.restAt = 1.6;
    launcher.root.visible = false;
    s.follow = s.restAt - BOOK.length / 2 - (LANE_LEFT + laneWidth() / 2);
    flyTo(viewPose(), 0);
    setFollow(s.follow);
    placeLane(state());
    refresh();
  }
  const clockPoint = [() => tmpClock.set(book.root.position.x - BOOK.length / 2, BOOK.thick, 0)];
  const tmpClock = new THREE.Vector3();
  /** Time visibly passes: "১ সেকেন্ড পরেও এখানেই" … up to 5 s, and the book does not move. */
  function runClock() {
    let shownS = -1;
    return tweener.animate({
      key: 'clock',
      duration: 5,
      ease: ease.linear,
      onUpdate: (k) => {
        const sec = Math.min(5, Math.floor(k * 5 + 1e-6) + 1);
        if (sec === shownS) return;
        shownS = sec;
        labels.set('clock', {
          text: t('l_clock', { s: sec }),
          point: clockPoint,
          spots: [
            [0, -22],
            [0, -40],
            [0, 26],
          ],
          priority: 6,
          color: COLORS.velocity,
          leader: true,
        });
      },
    }).finished;
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    action,
    hooks: {
      enter() {
        learnSaved = { surface: s.surface, results: { ...s.results } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        kinds = questionOrder();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        ++token;
        tweener.cancel('curve');
        tweener.cancel('clock');
        labels.remove('clock');
        if (s.scene !== 'lane') setScene('lane');
        s.forces = true;
        launcher.root.visible = true;
        if (s.run) s.run.resolve();
        s.run = null;
        const saved = learnSaved || { surface: 'mat', results: { mat: null, wood: null, ice: null, none: null } };
        s.results = { ...saved.results };
        for (const id of FRICTION_IDS) {
          stops[id].group.visible = false;
          if (s.results[id] != null) stops[id].place(s.results[id]);
        }
        s.surface = saved.surface;
        floor.setSurface(s.surface);
        goHome({ animate: false });
        syncUI();
        setView(s.view, { animate: false });
        refresh();
        emitChange();
      },
      async prepare(i, alive, say) {
        const kind = kinds[i % kinds.length];
        picked = -1;
        if (kind === 'predict') {
          await cleanScene('none');
          question = { kind };
          return { text: t('q_predict'), ...textChoices([item('c_keep'), item('c_slow'), item('c_stop_push'), item('c_faster')], kind) };
        }
        if (kind === 'rest') {
          await cleanScene('none');
          restScene();
          question = { kind };
          return { text: t('q_rest'), ...textChoices([item('r_stay'), item('r_slide'), item('r_start'), item('r_steady')], kind) };
        }
        if (kind === 'stopit') {
          await cleanScene('none');
          if (!alive()) return null;
          // it is already gliding along at 3 m/s when the question comes
          await push({ quiet: true, animate: false, at: 0.6 });
          question = { kind };
          return { text: t('q_stopit'), ...textChoices([item('s_back'), item('s_nothing'), item('s_along'), item('s_remove')], kind) };
        }
        if (kind === 'whystop') {
          const surface = pickOne(['mat', 'wood']);
          await cleanScene(surface);
          if (!alive()) return null;
          say(t('q_look'));
          await wait(400);
          if (!alive()) return null;
          await push({ quiet: true });
          await s.run?.stopped;
          if (!alive()) return null;
          await wait(300);
          if (!alive()) return null;
          question = { kind, surface };
          return {
            text: t('q_whystop', { at: t(`at_${surface}`) }),
            ...textChoices([item('w_back'), item('w_fading'), item('w_none'), item('w_both')], kind, { surface }),
          };
        }
        if (kind === 'farther') {
          const target = pickOne(['ice', 'mat']);
          await cleanScene(target);
          const d = (id) => round(stopDistance(SURFACES[id].mu), 2);
          const known = target === 'ice' ? ['mat', 'wood'] : ['wood', 'ice'];
          for (const id of known) {
            s.results[id] = d(id);
            stops[id].place(d(id));
          }
          const v = { a: plain(d('mat')), b: plain(d('wood')), c: plain(d('ice')) };
          const items =
            target === 'ice'
              ? [item('f_more', v), item('f_never'), item('f_same', v), item('f_less_a', v)]
              : [item('f_less', v), item('f_same', v), item('f_more_c', v), item('f_still')];
          question = { kind, target, v: { ...v, d: about(d(target)) } };
          refresh();
          return { text: t(target === 'ice' ? 'q_ice' : 'q_mat', v), ...textChoices(items, kind, { surface: target }) };
        }
        // the curved wall, seen from above
        await cleanScene('none');
        setScene('curve');
        placeCurve(0);
        labels.set('wall', {
          text: t('l_wall'),
          point: () => wallMid,
          spots: [
            [10, -6],
            [12, 0],
            [0, -14],
          ],
          priority: 2,
          color: '#7a4a1f',
          kind: 'part',
          leader: false,
        });
        if (!alive()) return null;
        say(t('q_look'));
        await wait(300);
        if (!alive()) return null;
        if (!(await rideCurve(0, curveEnd())) || !alive()) return null;
        // the four paths from where the wall ends, lettered in a random order
        const paths = candidatePaths();
        const order = shuffle(['straight', 'circle', 'spiral', 'outward']);
        order.forEach((name, j) => {
          options4[j].set(paths[name]);
          const pts = paths[name];
          const end = pts[pts.length - 1];
          const before = pts[pts.length - 6];
          const dir = new THREE.Vector3(end.x - before.x, 0, end.z - before.z).normalize();
          const at = new THREE.Vector3(end.x, 0.004, end.z).addScaledVector(dir, 0.035);
          labels.set(`opt${j}`, {
            text: letters[j],
            point: () => at,
            spots: [
              [0, 0],
              [0, 14],
              [12, 0],
              [-12, 0],
              [0, -14],
            ],
            priority: 6,
            color: COLORS.option,
            leader: false,
          });
        });
        question = { kind: 'curve', order, expected: order.indexOf('straight') };
        return {
          text: t('q_curve'),
          choices: [0, 1, 2, 3],
          expected: question.expected,
          tolerance: 0.5,
          label: (j) => `<span class="nf-opt">${t('opt_path', { k: letters[j] })}</span>`,
          meta: { kind: 'curve', answer: letters[question.expected] },
        };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list ? q.list[picked]?.key : k === 'curve' ? question.order[picked] : null;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        if (k === 'predict') {
          s.forces = true;
          push({ quiet: true });
          return t('why_predict') + note({ c_slow: 'not_slow', c_stop_push: 'not_stop_push', c_faster: 'not_faster' });
        }
        if (k === 'rest') {
          runClock();
          return t('why_rest') + note({ r_slide: 'not_move', r_start: 'not_move', r_steady: 'not_steady' });
        }
        if (k === 'stopit') {
          // a steady force against the velocity, from now on: the book slows to rest
          const st = state();
          if (s.run && st.phase === 'slide') s.run.brake = { since: st.since, x: st.x };
          s.forces = true;
          return t('why_stopit') + note({ s_nothing: 'not_nothing', s_along: 'not_along', s_remove: 'not_remove' });
        }
        if (k === 'whystop') {
          s.forces = true;
          push({ quiet: true }); // again, now with the forces drawn
          return t('why_whystop') + note({ w_fading: 'not_fading', w_none: 'not_none', w_both: 'not_both' });
        }
        if (k === 'farther') {
          s.forces = true;
          push({ quiet: true });
          const v = question.v;
          return question.target === 'ice'
            ? t('why_ice', v) + note({ f_never: 'not_never', f_same: 'not_same', f_less_a: 'not_less_a' })
            : t('why_mat', v) + note({ f_same: 'not_same', f_more_c: 'not_more_c', f_still: 'not_still' });
        }
        // the curved wall: the wrong paths fade, the book slides on along the right one
        options4.forEach((p, j) => {
          p.material.opacity = j === question.expected ? 1 : 0.18;
        });
        for (let j = 0; j < 4; j++) if (j !== question.expected) labels.remove(`opt${j}`);
        rideCurve(curveEnd(), curveEnd() + 0.6); // straight on, and still in the picture at the end
        return t('why_curve', { k: letters[question.expected] }) + note({ circle: 'not_circle', spiral: 'not_spiral', outward: 'not_outward' });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
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
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) setSurface(b.dataset.example);
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
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey = ['1', '2', '3', '4', 'r', 'R', 'Home', 'ArrowRight'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3', '4'].includes(k)) setSurface(SURFACE_IDS[Number(k) - 1]);
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  floor.setSurface(s.surface);
  setFollow(0);
  function markTried(list) {
    for (const id of list.map((x) => String(x).trim()).filter((x) => SURFACE_IDS.includes(x))) {
      s.results[id] = id === 'none' ? Number.POSITIVE_INFINITY : round(stopDistance(SURFACES[id].mu), 2);
      if (id !== 'none') stops[id].place(s.results[id]);
    }
  }
  markTried(String(o.tried || '').split(','));
  placeLane(state());
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const at = o.at === '' || o.at == null ? null : Number(o.at);
  if (at != null && Number.isFinite(at)) {
    startRun({ quiet: true, at: Math.max(0, at) });
    // a picture of a run already past the ice's stop, or stopped: the view down the lane at once
    const st = state();
    if ((s.run.mu === 0 && st.x > PASS_ICE) || st.phase === 'stopped') {
      s.run.pulledBack = true;
      showOverview({ animate: false });
    }
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
     * Change any of: surface ('mat' | 'wood' | 'ice' | 'none'), tried (floors whose stops show, e.g. ['mat',
     * 'wood']), home (true: the book back at the start), push (true: the same push as the button), at (s after the
     * release: jump the run there), overview (true: look down the lane), view; animate: false jumps (a push lands at
     * its stop, or 3 s on with no friction).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.surface) await setSurface(p.surface, { animate, quiet: true });
      if (p.tried) {
        markTried(Array.isArray(p.tried) ? p.tried : String(p.tried).split(','));
        refresh();
      }
      if (p.home) await goHome({ animate });
      if (p.at != null) await push({ quiet: true, animate: false, at: Math.max(0, Number(p.at) || 0) });
      else if (p.push) await push({ quiet: true, animate });
      if (p.overview) await showOverview({ animate });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      ++token;
      s.results = { mat: null, wood: null, ice: null, none: null };
      for (const m of Object.values(stops)) m.group.visible = false;
      labels.clear('pin-');
      s.view = 'front';
      controls.enableRotate = false;
      syncUI();
      await setSurface('mat', { animate: false, quiet: true });
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture(opts = {}) {
      const background = scene.background;
      if (opts.background !== undefined) scene.background = null;
      try {
        return stage.capture(opts);
      } finally {
        scene.background = background;
        stage.invalidate();
      }
    },
    /** The launcher, the book where it is, the floor (4 m past the release point) and the tape, in metres. */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'NewtonsFirstLaw';
      const f = floor.mesh.clone();
      f.material = [...f.material];
      // its own texture placement: the floor from the launcher to 4 m past the release point
      const len = 4 - FLOOR.start;
      const top = f.material[2].clone();
      const tile = surfaces[floor.surface].tile;
      top.map = top.map.clone();
      top.map.repeat.set(len / tile[0], FLOOR.width / tile[1]);
      top.map.offset.set(FLOOR.start / tile[0], 0);
      top.map.needsUpdate = true;
      f.material[2] = top;
      f.scale.x = len;
      f.position.x = FLOOR.start + len / 2;
      copy.add(f, launcher.root.clone(true), book.root.clone(true), tape.group.clone(true));
      return copy;
    },
  };
}
