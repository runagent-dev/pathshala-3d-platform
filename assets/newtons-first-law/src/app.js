// Newton's first law (book page 64, topic 3.1), student view: a physics textbook waits on a launcher. One tap gives
// it the same push every time (it leaves the launcher at 3 m/s) onto the floor chosen in the panel: a jute mat, a
// wooden floor, ice, or an imagined floor with no friction. With friction it slows evenly and stops, farther on
// smoother floors (a dashed line marks each stop, the chips keep the distances); with no friction its velocity never
// changes: the speed stays 3.00 m/s, the marks it leaves every 0.1 s stay evenly spaced, and the camera follows it
// for ever. Arrows show the velocity (blue), friction against it (crimson) and the push (orange, only while the
// paddle touches the book). Then a short test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS, svg } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createBook } from './book.js';
import { createLauncher } from './launcher.js';
import { createFloor, createMarks, createStopMark, createSurfaces, createTape, FLOOR, SURFACE_COLORS } from './floor.js';
import { COLORS, createArrow, createDottedPath } from './arrows.js';
import { createLabels } from './labels.js';
import { fitPose } from './camera.js';
import {
  BOOK,
  CURVE,
  PUSH,
  SURFACE_IDS,
  SURFACES,
  candidatePaths,
  curveAt,
  curveEnd,
  markTimes,
  round,
  runAt,
  stopDistance,
  stopTime,
} from './motion.js';

export const DEFAULTS = {
  surface: 'mat', // 'mat' | 'wood' | 'ice' | 'none'
  at: '', // s after the release: start with the book already pushed (for pictures)
  tried: '', // floors already tried, e.g. 'mat,wood' (their stop marks and distances show)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const VEL_SCALE = 0.08; // m of arrow per m/s
const FRICTION_SCALE = 0.7; // m of arrow per unit of μ (friction = μ × weight)
const FOLLOW_AT = -0.04; // the camera starts following once the book's front passes this x (room behind for the mat's friction arrow)
const DOUBLE_TAP = 450; // ms: a second push request this soon after one is ignored
// the side view: portrait frames look down more (the floor fills more of the height), wide frames look lower
const ELEVATION = [52, 26]; // degrees, portrait … wide
const YAW = 0; // degrees: straight from the side, so the floor runs level across the view
const VIEW_3D = new THREE.Vector3(-0.62, 0.62, 0.82).normalize();
// what the side view must show at the start: the paddle, the book, the floor's start and the tape
const HOME_BOX = new THREE.Box3(new THREE.Vector3(-0.54, 0, -0.36), new THREE.Vector3(0.3, 0.06, 0.46));
const CURVE_BOX = new THREE.Box3(new THREE.Vector3(-0.85, 0, -0.62), new THREE.Vector3(0.98, 0.05, 0.7));
const PUSH_ICON = svg('<rect x="13.5" y="6.5" width="7" height="11" rx="1.2"/><path d="M3 12h7.5M7.5 8.8 10.7 12l-3.2 3.2"/>');

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const two = (x) => N(x.toFixed(2)); // live readouts: fixed decimals
  const plain = (x) => String(+x.toFixed(2)); // numbers in sentences: no trailing zeros

  root.classList.add('pvc', 'nf');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="nf-chips" role="radiogroup" aria-label="${t('surfaces')}">${SURFACE_IDS.map(
            (id) =>
              `<button role="radio" data-surface="${id}"><span class="nf-chip-top"><i class="nf-sw ${id}" aria-hidden="true"></i><span>${t(`chip_${id}`)}</span></span><small class="nf-res"></small></button>`,
          ).join('')}</div>
          <div class="nf-read" aria-live="off">
            <span class="nf-q vel"><small>${t('r_speed')}</small><b data-v="speed">0</b><small>${t('u_ms')}</small></span>
            <span class="nf-q dist"><small>${t('r_dist')}</small><b data-v="dist">0</b><small>${t('u_m')}</small></span>
          </div>
          <p class="nf-say"></p>
          <div class="pvc-learn-foot nf-acts">
            <button class="pvc-btn primary" data-act="push">${PUSH_ICON}<span></span></button>
            <button class="pvc-btn" data-act="home">${ICONS.reset}<span>${t('act_home')}</span></button>
          </div>`,
  });
  const badge = document.createElement('div');
  badge.className = 'nf-badge';
  badge.hidden = true;
  ui.stage.append(badge);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 80, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.4;
  controls.maxDistance = 6;
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
  const book = createBook({ t });
  const marks = createMarks();
  const stops = Object.fromEntries(['mat', 'wood', 'ice'].map((id) => [id, createStopMark(SURFACE_COLORS[id])]));
  world.add(floor.mesh, tape.group, launcher.root, book.root, marks.mesh);
  for (const m of Object.values(stops)) world.add(m.group);
  marks.mesh.userData.noExport = true;

  // the book's hit box: bigger than the book, so a finger finds it
  const bookHit = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.36), new THREE.MeshBasicMaterial({ visible: false }));
  bookHit.position.set(-BOOK.length / 2, 0.05, 0);
  bookHit.userData.noExport = true;
  book.root.add(bookHit);

  const arrows = {
    velocity: createArrow({ color: COLORS.velocity, name: 'VelocityArrow' }),
    friction: createArrow({ color: COLORS.friction, name: 'FrictionArrow' }),
    push: createArrow({ color: COLORS.push, name: 'PushArrow', radius: 0.008, head: 0.04, headRadius: 0.019 }),
  };
  for (const a of Object.values(arrows)) world.add(a.root);

  // the test's curved-wall scene: a wide imagined floor, a quarter-circle wall, four candidate paths
  const curve = new THREE.Group();
  curve.name = 'CurveScene';
  curve.visible = false;
  curve.userData.noExport = true;
  const gridMat = surfaces.none.top.clone();
  gridMat.map = surfaces.none.top.map.clone();
  gridMat.map.repeat.set(2.4 / 0.5, 2.4 / 0.5);
  gridMat.map.needsUpdate = true;
  const gridFloor = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), gridMat);
  gridFloor.rotation.x = -Math.PI / 2;
  gridFloor.position.set(0.05, -0.0005, 0.05);
  curve.add(gridFloor);
  const wall = (() => {
    const inner = CURVE.r + BOOK.width / 2 + 0.004;
    const outer = inner + 0.022;
    const s = new THREE.Shape();
    const n = 40;
    const a0 = -0.08;
    const a1 = Math.PI / 2;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      const p = [outer * Math.sin(a), -outer * Math.cos(a)];
      i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]);
    }
    for (let i = n; i >= 0; i--) {
      const a = a0 + ((a1 - a0) * i) / n;
      s.lineTo(inner * Math.sin(a), -inner * Math.cos(a));
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(Math.PI / 2);
    g.translate(0, 0.05, 0);
    const mesh = new THREE.Mesh(g, M.wood);
    mesh.name = 'CurvedWall';
    return mesh;
  })();
  curve.add(wall);
  const wallMid = new THREE.Vector3((CURVE.r + 0.12) * Math.sin(Math.PI / 4), 0.05, -(CURVE.r + 0.12) * Math.cos(Math.PI / 4));
  const options4 = Array.from({ length: 4 }, () => createDottedPath());
  for (const p of options4) curve.add(p.mesh);
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

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    surface: SURFACE_IDS.includes(o.surface) ? o.surface : 'mat',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    scene: 'lane', // 'lane' | 'curve' (a test question)
    run: null, // { surface, mu, t0, state: 'push' | 'slide' | 'stopped', stopped: Promise }
    results: { mat: null, wood: null, ice: null, none: null }, // stop distance (m), or Infinity (never stops)
    follow: 0, // m the camera has moved along with the book
    forces: true, // the arrows show (the test hides them until the answer)
    userMovedCamera: false,
  };
  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ── the run ─────────────────────────────────────────────────────────────────
  const restX = -PUSH.stroke; // the book's front edge while it waits on the plate
  let token = 0; // bumped by anything that calls off what is pending (new push, floor, test, reset)
  let lastPush = Number.NEGATIVE_INFINITY;

  /** The book, the paddle and the arrows at the run's time (s since the paddle started), or at rest. */
  function state() {
    const run = s.run;
    if (!run) return { phase: 'rest', x: restX, v: 0, since: null };
    return runAt(Math.max(0, (now() - run.t0) / 1000), run.mu);
  }

  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const XP = new THREE.Vector3(1, 0, 0);
  const XN = new THREE.Vector3(-1, 0, 0);
  function placeLane(st) {
    book.root.position.set(st.x, 0, 0);
    book.root.rotation.set(0, 0, 0);
    launcher.setPaddle(st.phase === 'push' ? st.x - BOOK.length : paddleX());
    const show = s.forces && s.scene === 'lane';
    // velocity: from the front edge, at half the book's height
    if (show && st.v > 0.005) arrows.velocity.set(tmpA.set(st.x + 0.004, BOOK.thick * 0.55, 0), XP, st.v * VEL_SCALE);
    else arrows.velocity.hide();
    // friction: at the floor, from the back edge, backward, while it slides on a floor with friction
    const mu = SURFACES[s.run?.surface ?? s.surface].mu;
    if (show && st.phase === 'slide' && mu > 0) arrows.friction.set(tmpB.set(st.x - BOOK.length - 0.004, 0.009, 0), XN, mu * FRICTION_SCALE);
    else arrows.friction.hide();
    // the push: above the paddle, onto the book's back, only while the paddle touches it
    if (show && st.phase === 'push') arrows.push.set(tmpA.set(st.x - BOOK.length - 0.13, BOOK.thick + 0.03, 0), XP, 0.16);
    else arrows.push.hide();
    // the marks every 0.1 s, under the middle of the book (the last few hundred: older ones are far behind)
    if (st.since != null && st.since >= 0) {
      const mu2 = s.run.mu;
      marks.set(markTimes(st.since, mu2, undefined, marks.max).map((tt) => runAt(tt + PUSH.time, mu2).x - BOOK.length / 2));
    } else marks.clear();
    // the camera follows the book once it is well on its way (and stays when it stops)
    if (s.run) setFollow(Math.max(s.follow, st.x - FOLLOW_AT));
  }

  // the paddle's place when the book is not being pushed: at its stops after a push, else in its notch
  let paddleBack = true;
  const paddleX = () => (paddleBack ? launcher.restBack : launcher.stopBack);

  function setFollow(f) {
    const d = f - s.follow;
    if (Math.abs(d) > 1e-9) {
      camera.position.x += d;
      controls.target.x += d;
      controls.update();
      s.follow = f;
    }
    floor.setExtent(FLOOR.start, Math.max(4, f + 6));
    tape.show(Math.max(0, f - 1.6), f + 4.5);
    placeSun(f);
    stage.invalidate();
  }

  function startRun({ quiet = false, at = null } = {}) {
    const mu = SURFACES[s.surface].mu;
    const t0 = at == null ? now() : now() - (PUSH.time + at) * 1000;
    let stopped;
    s.run = { surface: s.surface, mu, t0, state: 'push', stopped: new Promise((r) => (stopped = r)), resolve: () => stopped(true), quiet };
    paddleBack = false;
    if (!quiet) audio.pop();
    emit('push', { surface: s.surface });
    tick(true);
  }

  /**
   * Back to the start: the book waits on the plate again, the paddle in its notch, the camera flies back. Resolves
   * true if nothing else came first. own: false when push() calls it (push keeps its own token).
   */
  async function goHome({ animate = true, own = true } = {}) {
    const my = own ? ++token : token;
    if (s.run) s.run.resolve();
    s.run = null;
    marks.clear();
    const from = s.follow;
    paddleBack = true;
    placeLane(state());
    refresh();
    emitChange();
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
    if (!quiet) {
      coach?.objectUsed();
      hintOff();
    }
    const my = ++token;
    const glide = animate && at == null;
    if (s.run || s.follow > 0.001) {
      if (!(await goHome({ animate: glide, own: false }))) return;
      if (glide) await wait(120);
      if (my !== token) return; // overtaken while going back
    }
    if (s.locked && !quiet) return;
    startRun({ quiet, at: at ?? (animate ? null : endTime()) });
    if (!quiet) coach?.objectReleased();
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
        const d = round(stopDistance(run.mu), 2);
        s.results[run.surface] = d;
        stops[run.surface]?.place(d);
        if (!run.quiet) audio.contact();
        run.resolve();
        emit('stop', { surface: run.surface, distance: d });
      }
      emitChange();
    }
    if (run.mu === 0 && st.since > 2 && s.results.none == null) {
      s.results.none = Number.POSITIVE_INFINITY; // it has outrun every floor with friction: it never stops
      emitChange();
    }
    refresh();
    return st.phase !== 'stopped';
  }
  stage.addTicker(() => tick());

  // ── labels on the scene ─────────────────────────────────────────────────────
  const pinPoint = Object.fromEntries(['mat', 'wood', 'ice'].map((id) => [id, () => stops[id].top]));
  // each arrow's label beside its middle or its tip (whichever has room), never on the arrow
  const velPoints = [() => arrows.velocity.mid, () => arrows.velocity.end];
  const fricPoints = [() => arrows.friction.end, () => arrows.friction.mid];
  const pushPoints = [() => arrows.push.mid];
  function labelsFor() {
    if (s.scene !== 'lane') return;
    if (arrows.velocity.visible)
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
    if (arrows.friction.visible)
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
    if (arrows.push.visible)
      labels.set('push', {
        text: t('l_push'),
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
    for (const id of ['mat', 'wood', 'ice']) {
      if (s.results[id] == null || !stops[id].group.visible) {
        labels.hide(`pin-${id}`);
        continue;
      }
      labels.set(`pin-${id}`, {
        text: t(`chip_${id}`),
        point: pinPoint[id],
        spots: [
          [0, -8],
          [0, -24],
          [6, -6],
          [-6, -6],
        ],
        priority: 1,
        color: SURFACE_COLORS[id],
        leader: true,
      });
    }
  }

  /** The book and its arrows: boxes on the screen that no label may cover (read after the frame is drawn). */
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const tmpBox = new THREE.Box3();
  function screenBox(obj) {
    tmpBox.setFromObject(obj);
    if (tmpBox.isEmpty()) return null;
    let i = 0;
    for (const x of [tmpBox.min.x, tmpBox.max.x])
      for (const y of [tmpBox.min.y, tmpBox.max.y]) for (const z of [tmpBox.min.z, tmpBox.max.z]) corners[i++].set(x, y, z).project(camera);
    const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
    const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
    return { l: Math.min(...xs), t: Math.min(...ys), r: Math.max(...xs), b: Math.max(...ys) };
  }
  const bookShape = book.root.children[0];
  function sceneBlockers() {
    const list = [screenBox(bookShape)];
    for (const a of Object.values(arrows)) if (a.visible) list.push(screenBox(a.root));
    return list.filter(Boolean);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    chips: ui.$$('[data-surface]'),
    speed: $('[data-v="speed"]'),
    dist: $('[data-v="dist"]'),
    say: $('.nf-say'),
    pushLabel: $('[data-act="push"] span'),
  };

  function sayKey(st) {
    if (!s.run) return s.surface === 'none' ? ['x_rest_none'] : ['x_rest'];
    // one line for the whole motion (the push lasts 0.2 s: a line of its own would only flash)
    if (st.phase === 'push' || st.phase === 'slide') return [s.run.mu > 0 ? 'x_slide' : 'x_none'];
    return [s.run.surface === 'ice' ? 'x_stop_ice' : 'x_stop', { d: plain(stopDistance(s.run.mu)) }];
  }
  let lastSay = '';
  function refresh() {
    const st = state();
    el.speed.textContent = two(st.v);
    el.dist.textContent = two(Math.max(0, st.x));
    const [key, vars] = sayKey(st);
    const html = t(key, vars);
    if (html !== lastSay) {
      el.say.innerHTML = html;
      lastSay = html;
    }
    const home = !s.run;
    el.pushLabel.textContent = t(home ? 'act_push' : 'act_again');
    for (const c of el.chips) {
      const id = c.dataset.surface;
      const on = id === s.surface;
      c.classList.toggle('on', on);
      c.setAttribute('aria-checked', String(on));
      const r = s.results[id];
      const res = r == null ? '–' : Number.isFinite(r) ? t('res_m', { d: plain(r) }) : t('res_none');
      const small = c.querySelector('.nf-res');
      if (small.textContent !== res) small.textContent = res;
    }
    labelsFor();
    const none = (s.scene === 'lane' && s.surface === 'none') || s.scene === 'curve';
    badge.hidden = !none;
    // the honest note, in two pieces that wrap between them on a narrow stage
    const note = `<b>${t('badge_head')}</b> <span>${t(stage.width < 470 ? 'badge_none_short' : 'badge_none')}</span>`;
    if (none && badge.innerHTML !== note) badge.innerHTML = note;
    stage.invalidate();
  }

  function snapshot() {
    const st = state();
    const res = Object.fromEntries(
      SURFACE_IDS.map((id) => [id, s.results[id] == null ? null : Number.isFinite(s.results[id]) ? s.results[id] : 'never']),
    );
    return {
      surface: s.surface,
      phase: st.phase, // 'rest' | 'push' | 'slide' | 'stopped'
      speed: round(st.v, 2), // m/s
      distance: round(Math.max(0, st.x), 2), // m from the release point (the book's front edge)
      time: st.since == null ? null : round(Math.max(0, st.since), 2), // s since the release
      friction: SURFACES[s.run?.surface ?? s.surface].mu, // μ of the floor it is on
      results: res, // where it stopped on each floor tried (m), 'never' for the floor with no friction
      view: s.view,
      mode: s.mode,
    };
  }

  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.surface, snap.phase, snap.results, snap.mode]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  /** A new floor: anything moving is called off and the book waits at the start. */
  async function setSurface(id, { animate = true, quiet = false } = {}) {
    if (!SURFACE_IDS.includes(id)) return;
    if (s.locked && !quiet) return lockedNudge();
    const changed = id !== s.surface;
    s.surface = id;
    floor.setSurface(id);
    refresh();
    if (changed) emit('surface', { surface: id });
    await goHome({ animate });
    refresh();
    emitChange();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  /** 0 for a portrait stage … 1 for a wide one. */
  const wideness = () => Math.min(1, Math.max(0, (stage.width / Math.max(1, stage.height) - 0.95) / 0.85));
  /** The side view from `deg` degrees above the floor. */
  function sideDir(deg) {
    const e = THREE.MathUtils.degToRad(deg);
    const y = THREE.MathUtils.degToRad(YAW);
    return new THREE.Vector3(Math.sin(y) * Math.cos(e), Math.sin(e), Math.cos(y) * Math.cos(e));
  }
  const probe = new THREE.PerspectiveCamera();
  const probePoint = new THREE.Vector3();
  /** How much of the stage's height the box takes, seen from a pose (0…1). */
  function heightShare(pose, box) {
    probe.copy(camera);
    probe.position.copy(pose.position);
    probe.lookAt(pose.target);
    probe.updateMatrixWorld();
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z]) {
          probePoint.set(x, y, z).project(probe);
          lo = Math.min(lo, probePoint.y);
          hi = Math.max(hi, probePoint.y);
        }
    return (hi - lo) / 2;
  }
  const homeBox = new THREE.Box3();
  function viewPose(view = s.view) {
    // a wide stage (wide in pixels too) shows more of the floor ahead; the book stays as big, the height limits it
    homeBox.copy(HOME_BOX);
    homeBox.max.x += 0.5 * wideness() * Math.min(1, Math.max(0, (stage.width - 480) / 420));
    const box = s.scene === 'curve' ? CURVE_BOX : homeBox;
    const fit = (dir) => fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: { top: 54, bottom: 10, side: 8 } });
    let pose;
    if (s.scene === 'curve') pose = fit(new THREE.Vector3(0, 1, 0.02).normalize());
    else if (view === '3d') pose = fit(VIEW_3D);
    else {
      // portrait frames look down more, wide ones lower; but a wide frame with height to spare looks down more
      // again until the floor fills half of it (a low view would leave the floor a thin strip there)
      for (let e = ELEVATION[0] + (ELEVATION[1] - ELEVATION[0]) * wideness(); ; e += 4) {
        pose = fit(sideDir(e));
        if (e >= ELEVATION[0] || heightShare(pose, box) >= 0.5) break;
      }
    }
    if (s.scene === 'lane') {
      pose.position.x += s.follow;
      pose.target.x += s.follow;
    }
    return pose;
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
    // the follow may move the camera meanwhile: fly relative to it
    const f0 = s.follow;
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        const df = s.follow - f0;
        camera.position.lerpVectors(p0, position, k).x += df;
        controls.target.lerpVectors(t0, target, k).x += df;
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d' && s.scene === 'lane';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
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
    if (raycaster.intersectObject(launcher.hit, false).length) return 'launcher';
    return null;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
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
      push(); // it acts as the finger goes down
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
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
  }

  // ── the curved-wall scene (a test question) ─────────────────────────────────
  function setScene(next) {
    s.scene = next;
    const lane = next === 'lane';
    for (const obj of [floor.mesh, tape.group, launcher.root, marks.mesh]) obj.visible = lane;
    for (const id of ['mat', 'wood', 'ice']) stops[id].group.visible = lane && s.results[id] != null;
    curve.visible = !lane;
    if (!lane) {
      for (const a of Object.values(arrows)) a.hide();
      labels.clear('vel');
      labels.clear('fric');
      labels.clear('push');
      labels.clear('pin-');
    } else {
      labels.clear('opt');
      labels.remove('wall');
    }
    controls.enableRotate = s.view === '3d' && lane;
    s.userMovedCamera = false;
    flyTo(viewPose(), 0);
    refresh();
  }
  /** The book on the curved-wall run, dist m along it (its centre on the path, its length along the heading). */
  function placeCurve(dist, path = curveAt) {
    const { x, z, heading } = path(dist);
    book.root.rotation.set(0, -heading, 0);
    book.root.position.set(x + (Math.cos(heading) * BOOK.length) / 2, 0, z + (Math.sin(heading) * BOOK.length) / 2);
    stage.invalidate();
  }
  /** Moves the book along the run from a to b metres at the curve's speed (resolves false if called off). */
  function rideCurve(a, b, path = curveAt) {
    return tweener.animate({
      key: 'curve',
      duration: Math.abs(b - a) / CURVE.speed,
      ease: ease.linear,
      onUpdate: (k) => placeCurve(a + (b - a) * k, path),
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

  let learnSaved = null;
  let kinds = [];
  let question = null;
  let picked = -1;

  /** A clean scene for a question: nothing moving, no marks, no labels left from before. */
  async function cleanScene(surface = 'none') {
    ++token;
    tweener.cancel('curve');
    if (s.run) s.run.resolve();
    s.run = null;
    for (const id of SURFACE_IDS) s.results[id] = null;
    for (const m of Object.values(stops)) m.group.visible = false;
    for (const p of options4) {
      p.clear();
      p.material.opacity = 1;
    }
    labels.clear('opt');
    labels.clear('pin-');
    labels.remove('wall');
    s.forces = false;
    if (s.scene !== 'lane') setScene('lane');
    s.surface = surface;
    floor.setSurface(surface);
    await goHome({ animate: false });
    if (s.view !== 'front') setView('front', { animate: false });
    refresh();
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        learnSaved = { surface: s.surface, results: { ...s.results } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        kinds = shuffle(['predict', 'whystop', 'farther', 'curve', pickOne(['space', 'rest'])]);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        ++token;
        tweener.cancel('curve');
        if (s.scene !== 'lane') setScene('lane');
        s.forces = true;
        if (s.run) s.run.resolve();
        s.run = null;
        const saved = learnSaved || { surface: 'mat', results: { mat: null, wood: null, ice: null, none: null } };
        s.results = { ...saved.results };
        for (const id of ['mat', 'wood', 'ice']) {
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
            ...textChoices([item('w_friction'), item('w_used'), item('w_natural'), item('w_heavy')], kind, { surface }),
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
          question = { kind, target, v: { ...v, d: plain(d(target)) } };
          refresh();
          return { text: t(target === 'ice' ? 'q_ice' : 'q_mat', v), ...textChoices(items, kind, { surface: target }) };
        }
        if (kind === 'curve') {
          await cleanScene('none');
          setScene('curve');
          placeCurve(0);
          labels.set('wall', {
            text: t('l_wall'),
            point: () => wallMid,
            spots: [
              [10, -10],
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
            const at = new THREE.Vector3(end.x, 0.004, end.z).addScaledVector(dir, 0.03);
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
          question = { kind, order, expected: order.indexOf('straight') };
          return {
            text: t('q_curve'),
            choices: [0, 1, 2, 3],
            expected: question.expected,
            tolerance: 0.5,
            label: (j) => `<span class="nf-opt">${t('opt_path', { k: letters[j] })}</span>`,
            meta: { kind, answer: letters[question.expected] },
          };
        }
        if (kind === 'space') {
          await cleanScene('none');
          question = { kind };
          return { text: t('q_space'), ...textChoices([item('p_keep'), item('p_slow'), item('p_stop'), item('p_turn')], kind) };
        }
        await cleanScene('none');
        question = { kind: 'rest' };
        return { text: t('q_rest'), ...textChoices([item('r_stay'), item('r_slide'), item('r_start'), item('r_steady')], 'rest') };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = !correct && q.list ? q.list[picked]?.key : null;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        if (k === 'predict') {
          s.forces = true;
          push({ quiet: true });
          return t('why_predict') + note({ c_slow: 'not_slow', c_stop_push: 'not_stop_push', c_faster: 'not_faster' });
        }
        if (k === 'whystop') {
          s.forces = true;
          push({ quiet: true }); // again, now with the forces drawn
          return t('why_whystop') + note({ w_used: 'not_used', w_natural: 'not_natural', w_heavy: 'not_heavy' });
        }
        if (k === 'farther') {
          s.forces = true;
          push({ quiet: true });
          const v = question.v;
          return question.target === 'ice'
            ? t('why_ice', v) + note({ f_never: 'not_never', f_same: 'not_same' })
            : t('why_mat', v) + note({ f_same: 'not_same' });
        }
        if (k === 'curve') {
          options4.forEach((p, j) => {
            p.material.opacity = j === question.expected ? 1 : 0.18;
          });
          for (let j = 0; j < 4; j++) if (j !== question.expected) labels.remove(`opt${j}`);
          const straight = (d) => ({ x: CURVE.r, z: d - curveEnd(), heading: Math.PI / 2 });
          rideCurve(curveEnd(), curveEnd() + 1.6, straight);
          return t('why_curve', { k: letters[question.expected] });
        }
        if (k === 'space') return t('why_space');
        return t('why_rest') + note({ r_slide: 'not_move', r_start: 'not_move', r_steady: 'not_move' });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on the book ──────────────────────────────────────────
  let coach = null;
  if (o.coach) {
    const v = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, badge],
      object: {
        label: 'coach_push',
        candidates: () => {
          const out = [];
          for (const dx of [-BOOK.length / 2, -BOOK.length * 0.3, -BOOK.length * 0.7]) {
            v.set(book.root.position.x + dx, BOOK.thick, 0.02).project(camera);
            out.push({ x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height });
          }
          return out;
        },
        grabbable: (p) => pick(p) != null && !s.run,
        // the paddle draws back a little and returns, twice (no push: that is the student's)
        async demo(alive) {
          for (let i = 0; i < 2 && alive() && !s.run; i++) {
            const done = await tweener.animate({
              key: 'coach-paddle',
              duration: 0.7,
              ease: ease.inOutSine,
              onUpdate: (k) => {
                if (!alive() || s.run) return;
                launcher.setPaddle(launcher.restBack - 0.018 * Math.sin(Math.PI * k));
                stage.invalidate();
              },
            }).finished;
            if (!done || !alive()) break;
            await wait(450);
          }
          if (!s.run) launcher.setPaddle(launcher.restBack);
        },
        cancel: () => {
          tweener.cancel('coach-paddle');
          if (!s.run) launcher.setPaddle(launcher.restBack);
          stage.invalidate();
        },
      },
    });
  }

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
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.surface) setSurface(b.dataset.surface);
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
      case 'push':
        push();
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
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) push();
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
  for (const id of String(o.tried || '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => SURFACE_IDS.includes(x))) {
    s.results[id] = id === 'none' ? Number.POSITIVE_INFINITY : round(stopDistance(SURFACES[id].mu), 2);
    if (id !== 'none') stops[id].place(s.results[id]);
  }
  placeLane(state());
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const at = o.at === '' || o.at == null ? null : Number(o.at);
  if (at != null && Number.isFinite(at)) startRun({ quiet: true, at: Math.max(0, at) });
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else if (at == null) coach?.start();
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
     * release: jump the run there), view; animate: false jumps (a push lands at its stop, or 3 s on with no
     * friction).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.surface) await setSurface(p.surface, { animate, quiet: true });
      if (p.tried) {
        const list = Array.isArray(p.tried) ? p.tried : String(p.tried).split(',');
        for (const id of list.map((x) => String(x).trim()).filter((x) => SURFACE_IDS.includes(x))) {
          s.results[id] = id === 'none' ? Number.POSITIVE_INFINITY : round(stopDistance(SURFACES[id].mu), 2);
          if (id !== 'none') stops[id].place(s.results[id]);
        }
        refresh();
      }
      if (p.home) await goHome({ animate });
      if (p.at != null) await push({ quiet: true, animate: false, at: Math.max(0, Number(p.at) || 0) });
      else if (p.push) await push({ quiet: true, animate });
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
    capture: (opts) => stage.capture(opts),
    /** The launcher, the book where it is, the floor (4 m of it) and the tape: the real objects, in metres. */
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
