// Types of friction (book pages 89–90, topic 3.9.1), student view: ONE scene for all three frictions. A 2 kg wooden
// block (the same as in the sister figure friction-force) is pushed by a person through a force gauge (বলমাপক). Tap by
// tap the push grows (3, 6, 9 N) and the block does not move: the friction under it (crimson arrow) grows to match the
// push exactly, that is the static friction (স্থিতি ঘর্ষণ). At 9.8 N it gives way; the person eases off to keep a steady
// pace and the gauge falls to 7.8 N: the kinetic friction (গতি ঘর্ষণ) is smaller than the maximum static friction (a
// faint arrow shows the old 9.8 N). Then the block is lifted onto a small trolley with wheels and pushed again: it
// rolls on 1 N, the rolling friction (আবর্ত ঘর্ষণ), the smallest of the three. Only at the end come the book's formulas
// f_s = μ_s N and f_k = μ_k N with N explained. The numbers (2 kg, μ_s = 0.5, μ_k = 0.4, rolling 0.05) are examples:
// the book gives none (a note on the view says so). The panel is the kit's clean sheet (one action, one result, one
// rule): the three terms as one row of words (the friction found under each), one numbered action whose same badge
// rings the block (tap either), one result line, one rule that grows with what the student has found. Then a short
// test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createArrow } from '@shared/arrow.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { BLOCK, createBlock } from './block.js';
import { createTrolley, TROLLEY } from './trolley.js';
import { createGauge } from './gauge.js';
import { createFloor } from './floor.js';
import { fitPose } from './camera.js';
import { MASS, MU, NOTCHES, RATE, RATE_WHEELS_UP, V_STEADY, cruiseGoal, fmtForce, letGo, limits, round, step, weight } from './physics.js';

export const STAGES = ['rest', 'pull', 'slide', 'slid', 'wheels', 'roll', 'rolled'];

export const DEFAULTS = {
  stage: 'rest', // start already in one of STAGES (for pictures); 'pull' also takes `pull`
  pull: '', // N: the push for stage 'pull' (below the maximum)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the block pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { push: '#e8590c', friction: '#c2255c' };
const ARROW = 0.015; // m of arrow per newton (9.8 N = 14.7 cm; the block is 20 cm long)
const FOLLOW_AT = 0.1; // m: the view follows the block once it is this far along
const T_CRUISE = { floor: 8, wheels: 8 }; // s: the person keeps pushing at a steady pace until the student lets go (or this long)
const T_STEADY = 3.2; // s of steady pace a scene that starts part way (pictures, the test) is run on to
const LIFT = 0.075; // m: the block is lifted this high to slip the trolley under it
const TROLLEY_FROM = -0.9; // m: where the trolley comes from (out of sight on the left)
const DOUBLE_TAP = 350; // ms
const VIEW_3D = new THREE.Vector3(-0.35, 0.55, 0.8).normalize();
const ELEVATION = 26; // degrees above the floor for the side view
const CHIPS = ['static', 'kinetic', 'rolling'];

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const fmt = fmtForce; // forces on the screen: 9.8, 7.8, 1

  root.classList.add('pvc', 'tf');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'types', results: true, items: CHIPS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // the honest note on the view: the book gives no numbers
  const note = document.createElement('div');
  note.className = 'tf-note';
  note.textContent = t('note_examples');
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 0.03, far: 80, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.3;
  controls.maxDistance = 6;
  controls.enablePan = false;
  controls.enableRotate = false;
  const world = new THREE.Group();
  world.name = 'TypesOfFriction';
  scene.add(world);

  const floor = createFloor();
  const block = createBlock({ t });
  const trolley = createTrolley();
  const gauge = createGauge({ colors: { pointer: COLORS.push } });
  world.add(floor.root, trolley.root, block.root, gauge.root);
  trolley.root.visible = false;
  floor.setStart(0, BLOCK.L, BLOCK.D);

  const arrowOf = (color, name, radius = 0.004) => createArrow({ color, name, radius, head: radius * 6.5, headRadius: radius * 2.9 });
  const arrows = { push: arrowOf(COLORS.push, 'PushArrow'), friction: arrowOf(COLORS.friction, 'FrictionArrow') };
  // the old maximum, faint round the live arrow: it shows how much smaller the friction became
  const ghostOf = (color, name) => createArrow({ color, name, radius: 0.0066, head: 0.034, headRadius: 0.0165, opacity: 0.3 });
  const ghosts = { push: ghostOf(COLORS.push, 'OldPush'), friction: ghostOf(COLORS.friction, 'OldFriction') };
  for (const a of [...Object.values(arrows), ...Object.values(ghosts)]) {
    a.root.userData.noExport = true;
    world.add(a.root);
  }

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  let sun = null;
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -0.8, right: 0.8, top: 0.7, bottom: -0.7, near: 0.2, far: 5 });
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.0003;
    scene.add(sun, sun.target);
    for (const obj of [block.root, trolley.root, gauge.root])
      obj.traverse((m) => {
        if (m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false) m.castShadow = true;
      });
  }
  function placeSun(x) {
    if (!sun) return;
    sun.position.set(x + 0.25, 1.7, 0.9);
    sun.target.position.set(x, 0, 0);
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state: one place every line, label and arrow is drawn from ────────
  const s = {
    stage: 'rest', // 'rest' | 'pull' | 'slide' | 'slid' | 'wheels' | 'roll' | 'rolled'
    // `pull` is the push on the block (the number the gauge shows); `friction` the friction under it
    sim: { on: 'floor', mass: MASS, pull: 0, v: 0, x: 0, moving: false, friction: 0, broke: false },
    mode: 'idle', // the person's push: 'idle' | 'ramp' (to goal) | 'cruise' (steady pace) | 'release'
    goal: 0,
    up: RATE.up, // N/s the push rises at
    cruiseT: 0,
    hold: false, // the test: the steady pace goes on until the answer
    notch: 0, // how many taps so far on the floor (the 4th passes the maximum)
    found: { static: null, kinetic: null, rolling: null }, // N, once seen
    blockY: 0, // m, the block's bottom (0 on the floor, TROLLEY.top on the trolley)
    trolley: false, // the trolley is in the picture
    trolleyDX: TROLLEY_FROM, // m, the trolley's place relative to the block
    busy: false, // the block is being put on / taken off the trolley
    hideFric: false, // the test hides the friction's number until the answer
    view: o.view === '3d' ? '3d' : 'front',
    mode_ui: 'explore',
    locked: false,
    follow: 0,
    userMovedCamera: false,
  };
  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let token = 0; // bumped by anything that calls off what is pending (home, a chip, the test)
  let lastTap = Number.NEGATIVE_INFINITY;

  // ── the physics, a few small steps every frame ─────────────────────────────
  /** The person's push is heading for the goal; the block gives way, moves, and stops when the push lets go. */
  function advance(dt) {
    if (s.mode === 'idle' && !s.sim.moving) return false;
    const n = Math.max(1, Math.ceil(dt * 120));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      if (s.mode === 'idle' && !s.sim.moving) break;
      let goal = s.goal;
      if (s.mode === 'cruise') {
        s.cruiseT += h;
        if (!s.hold && s.cruiseT >= T_CRUISE[s.sim.on]) s.mode = 'release';
        else goal = cruiseGoal(s.sim.on, s.sim.mass, s.sim.v);
      }
      if (s.mode === 'release') {
        goal = 0;
        s.sim = letGo(s.sim); // the hand lets go at once: the push is 0, the friction alone stops the block
      }
      s.sim = step(s.sim, h, goal, { ...RATE, up: s.up });
      if (s.hold && s.sim.x > 8) s.sim = { ...s.sim, x: s.sim.x - 6 }; // the floor repeats every 0.1 m: seamless
      if (s.sim.broke) onBreak();
      if (s.mode === 'ramp' && !s.sim.moving && Math.abs(s.sim.pull - s.goal) < 1e-6) s.mode = 'idle';
      if (s.mode === 'release' && !s.sim.moving) {
        s.mode = 'idle';
        s.goal = 0;
        s.sim = { ...s.sim, pull: 0, friction: 0 };
        onStop();
      }
    }
    return s.mode !== 'idle' || s.sim.moving;
  }

  function onBreak() {
    const { max, move } = limits(s.sim.on, s.sim.mass);
    if (s.sim.on === 'floor') {
      s.found.static = max;
      s.found.kinetic = move;
      s.stage = 'slide';
    } else {
      s.found.rolling = move;
      s.stage = 'roll';
    }
    s.mode = 'cruise';
    s.cruiseT = 0;
    if (!s.locked) audio.contact();
    emit('break', { support: s.sim.on, max: round(max, 2), friction: round(move, 2) });
  }

  function onStop() {
    s.stage = s.sim.on === 'floor' ? 'slid' : 'rolled';
    if (!s.locked) audio.contact();
    emit('stop', { support: s.sim.on, distance: round(s.sim.x, 2) });
    emitChange();
  }

  /** Runs the same physics without drawing, for scenes that start part way (pictures, the test). */
  function fastForward(until, maxSeconds = 20) {
    for (let i = 0; i < maxSeconds * 60 && !until(); i++) advance(1 / 60);
  }

  /** Where the push heads on a tap on the floor or on wheels: past the maximum, so the block gives way. */
  function startBreak(up = s.sim.on === 'wheels' ? RATE_WHEELS_UP : RATE.up) {
    s.goal = 1.4 * limits(s.sim.on, s.sim.mass).max;
    s.up = up;
    s.mode = 'ramp';
  }

  // ── what the person sees: block, trolley, gauge, arrows ────────────────────
  const tmpA = new THREE.Vector3();
  const pushMid = new THREE.Vector3();
  const XP = new THREE.Vector3(1, 0, 0);
  const XN = new THREE.Vector3(-1, 0, 0);
  function place() {
    const st = s.sim;
    const { L, H, D } = block.size();
    const x = st.x;
    block.root.position.set(x, s.blockY, 0);
    trolley.root.visible = s.trolley;
    trolley.root.position.set(x + s.trolleyDX, 0, 0);
    trolley.roll(x + s.trolleyDX);
    const faceX = x - L / 2; // the left face, where the gauge pushes
    const midY = s.blockY + H / 2;
    gauge.place(faceX, midY, st.pull);
    const pushLen = st.pull * ARROW;
    const arrowY = midY + 0.034;
    arrows.push.set(tmpA.set(faceX - pushLen, arrowY, 0), XP, pushLen);
    pushMid.set(faceX - pushLen / 2, arrowY, 0);
    const fricX = x + (s.trolley ? TROLLEY.L / 2 : L / 2);
    const fricZ = s.trolley ? TROLLEY.wheelZ + 0.032 : D / 2 + 0.026;
    arrows.friction.set(tmpA.set(fricX, 0.006, fricZ), XN, s.busy ? 0 : st.friction * ARROW);
    const shown = !s.busy && !s.locked;
    const oldMax = shown && s.stage === 'slide' ? s.found.static : null; // the old maximum, while it slides
    const oldSlide = shown && s.stage === 'roll' ? limits('floor', st.mass).move : null; // what sliding would give
    if (oldMax != null) {
      const oldLen = oldMax * ARROW;
      ghosts.push.set(tmpA.set(faceX - oldLen, arrowY, -0.001), XP, oldLen);
      ghosts.friction.set(tmpA.set(fricX, 0.006, fricZ - 0.001), XN, oldLen);
    } else {
      ghosts.push.hide();
      if (oldSlide != null) ghosts.friction.set(tmpA.set(fricX, 0.006, fricZ - 0.001), XN, oldSlide * ARROW);
      else ghosts.friction.hide();
    }
    floor.showStart(!s.locked && st.x > 0.03 && !s.trolley);
    placeSun(x);
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const sideBox = new THREE.Box3();
  const followX = () => Math.max(0, s.sim.x - FOLLOW_AT);
  const fit = (box, dir) => fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: { top: 40, bottom: 8, side: 8 } });
  function viewPose(view = s.view) {
    sideBox.min.set(-BLOCK.L / 2 - 0.27, 0, -0.12);
    sideBox.max.set(BLOCK.L / 2 + 0.18, Math.max(block.top(), BLOCK.H) + TROLLEY.top + 0.04, 0.16);
    const e = THREE.MathUtils.degToRad(ELEVATION);
    const pose = fit(sideBox, view === '3d' ? VIEW_3D : new THREE.Vector3(0, Math.sin(e), Math.cos(e)));
    pose.position.x += s.follow;
    pose.target.x += s.follow;
    return pose;
  }
  function flyTo({ position, target }, duration = 0.8, key = 'camera') {
    if (!duration) {
      tweener.cancel(key);
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const f0 = s.follow;
    return tweener.animate({
      key,
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        const df = s.follow - f0;
        camera.position.lerpVectors(p0, position, k).x += df;
        controls.target.lerpVectors(t0, target, k).x += df;
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  /** The view follows the block once it is well across (and comes back when it goes home). */
  function applyFollow() {
    const f = followX();
    const d = f - s.follow;
    if (Math.abs(d) < 1e-7) return;
    s.follow = f;
    camera.position.x += d;
    controls.target.x += d;
    controls.update();
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
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

  // ── labels on the scene ─────────────────────────────────────────────────────
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const tmpBox = new THREE.Box3();
  const boxOut = [0, 1, 2, 3].map(() => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  /** A box of the world on the screen (canvas pixels), for labels to keep clear of. */
  function screenBox(box3, out) {
    if (box3.isEmpty()) return null;
    let i = 0;
    for (const x of [box3.min.x, box3.max.x])
      for (const y of [box3.min.y, box3.max.y]) for (const z of [box3.min.z, box3.max.z]) corners[i++].set(x, y, z).project(camera);
    out.left = Number.POSITIVE_INFINITY;
    out.top = Number.POSITIVE_INFINITY;
    out.right = Number.NEGATIVE_INFINITY;
    out.bottom = Number.NEGATIVE_INFINITY;
    for (const c of corners) {
      const px = (c.x * 0.5 + 0.5) * stage.width;
      const py = (-c.y * 0.5 + 0.5) * stage.height;
      out.left = Math.min(out.left, px);
      out.right = Math.max(out.right, px);
      out.top = Math.min(out.top, py);
      out.bottom = Math.max(out.bottom, py);
    }
    return out;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      () => action?.ringBox(),
      () => action?.box(),
      () =>
        [
          screenBox(block.box(), boxOut[0]),
          s.trolley ? screenBox(tmpBox.setFromObject(trolley.root), boxOut[1]) : null,
          arrows.push.root.visible ? screenBox(tmpBox.setFromObject(arrows.push.root), boxOut[2]) : null,
          arrows.friction.root.visible ? screenBox(tmpBox.setFromObject(arrows.friction.root), boxOut[3]) : null,
        ].filter(Boolean),
    ],
  });
  const keepLabel = (id, opts) => {
    if (anno.has(id)) {
      anno.setText(id, opts.text);
      anno.update(id, { color: opts.color });
    } else anno.add(id, opts);
  };
  // where a label may sit (best first): the first offset that is inside the view and clear of the ring, the block, the
  // arrows and the other labels
  const grid = (dys, dxs) => dys.flatMap((dy) => dxs.map((dx) => ({ dx, dy })));
  const SPOTS = {
    push: grid([-28, -48], [0, -10, -20, -30, -45, -60, -80, -110, 10, 20]),
    friction: [
      ...grid([28], [0, -12, 12, -24, -40]),
      ...grid([10, 4, -4], [-70, -100, -140, -170, -220, -280, -340, -400]),
      ...grid([10, 4], [150, 190]),
      ...grid([48, 62], [0, -12, 12, -40, -70]),
    ],
    gauge: [...grid([28, 48], [0, -20, -40, -70, 20]), ...grid([10, -6], [-60, -90, -120])],
  };
  function labelsFor() {
    const st = s.sim;
    // the force gauge's name, while nothing is being pushed (the push and friction labels have the room after that)
    if (st.pull < 0.2 && !s.busy)
      keepLabel('gauge', { text: t('l_gauge'), point: () => gauge.centre(), color: '#4b5563', kind: 'part', spots: SPOTS.gauge, optional: true });
    else anno.remove('gauge');
    if (st.pull >= 0.2 && !s.busy)
      keepLabel('push', { text: t('l_push', { f: fmt(st.pull) }), point: () => pushMid, color: COLORS.push, kind: 'callout', spots: SPOTS.push });
    else anno.remove('push');
    if (st.friction >= 0.2 && !s.busy && s.hideFric !== 'hide')
      keepLabel('fric', {
        text: s.hideFric === 'ask' ? t('l_fric_q') : t('l_fric', { f: fmt(st.friction) }),
        point: () => arrows.friction.tip,
        color: COLORS.friction,
        kind: 'callout',
        spots: SPOTS.friction,
      });
    else anno.remove('fric');
    // the faint old arrows: the old maximum while it slides, what sliding would give while it rolls
    if (ghosts.push.root.visible)
      keepLabel('oldpush', {
        text: t('l_max', { f: fmt(s.found.static ?? 0) }),
        point: () => ghosts.push.root.position,
        color: COLORS.push,
        kind: 'part',
        spots: SPOTS.push,
        optional: true,
      });
    else anno.remove('oldpush');
    if (ghosts.friction.root.visible && s.stage === 'roll')
      keepLabel('oldfric', {
        text: t('l_old_slide', { f: fmt(limits('floor', st.mass).move) }),
        point: () => ghosts.friction.tip,
        color: COLORS.friction,
        kind: 'part',
        spots: SPOTS.friction,
        optional: true,
      });
    else anno.remove('oldfric');
  }

  // ── the panel: one action, one result, one rule ─────────────────────────────
  const chipOf = () => (s.stage === 'rest' || s.stage === 'pull' ? 'static' : s.stage === 'slide' || s.stage === 'slid' ? 'kinetic' : 'rolling');

  /** What the big button (and a tap on the block) does now. The badge's number is the student's own step. */
  function plan() {
    switch (s.stage) {
      case 'rest':
        return { label: 'act_push1', step: 1, kind: 'push' };
      case 'pull':
        return { label: 'act_push', step: 1, kind: 'push' };
      case 'slide':
      case 'roll':
        return { label: 'act_let_go', step: '', kind: 'letgo' };
      case 'slid':
        return { label: 'act_wheels', step: 2, kind: 'wheels' };
      case 'wheels':
        return { label: 'act_roll', step: 3, kind: 'roll' };
      default:
        return { label: 'act_again', step: '', kind: 'home' };
    }
  }

  function outcomeHtml() {
    const f = s.found;
    const ramping = s.mode === 'ramp' && !s.sim.moving;
    switch (s.stage) {
      case 'rest':
        return t('out_rest');
      case 'pull':
        return ramping ? t('out_ramp') : t('out_push', { p: fmt(s.sim.pull) });
      case 'slide':
        return t('out_slide', { k: fmt(f.kinetic ?? 0), m: fmt(f.static ?? 0) });
      case 'slid':
        return t('out_slid', { k: fmt(f.kinetic ?? 0) });
      case 'wheels':
        return ramping ? t('out_ramp') : t('out_wheels');
      case 'roll':
        return t('out_roll', { r: fmt(f.rolling ?? 0), k: fmt(f.kinetic ?? limits('floor').move) });
      default:
        return t('out_all', { r: fmt(f.rolling ?? 0) });
    }
  }
  function ruleHtml() {
    switch (s.stage) {
      case 'rest':
        return t('rule_rest');
      case 'pull':
        return s.notch >= NOTCHES.length ? t('rule_push3') : t('rule_push');
      case 'slide':
        return t('rule_slide');
      case 'slid':
        return t('rule_slid');
      case 'wheels':
        return t('rule_wheels');
      case 'roll':
        return t('rule_roll');
      default:
        return t('rule_all', { w: fmt(weight(MASS)), ms: MU.s, mk: MU.k, fs: fmt(limits('floor').max), fk: fmt(limits('floor').move) });
    }
  }

  const outcomeEl = ui.$('.pvc-outcome');
  let lastRing = null;
  function refresh() {
    sheet.choose(chipOf());
    sheet.next(s.stage === 'slid' ? 'rolling' : null);
    for (const id of CHIPS) {
      const v = s.found[id];
      sheet.result(id, v == null ? '' : t(id === 'static' ? 'res_max' : 'res_n', { f: fmt(v) }));
    }
    sheet.outcome(outcomeHtml());
    outcomeEl.dataset.k = chipOf();
    sheet.rule(ruleHtml());
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label });
      // the ring shows on the block while it waits (never while it moves, is pushed, or is being lifted)
      const wantRing = !s.busy && s.mode === 'idle' && !s.sim.moving && !s.locked;
      if (wantRing) action.show('run');
      else action.hide('run');
      // the ring takes a frame to show or hide: draw once more after it, so the labels move off it
      if (wantRing !== lastRing) {
        lastRing = wantRing;
        requestAnimationFrame(() => stage.invalidate());
      }
    }
    labelsFor();
    stage.invalidate();
  }

  function snapshot() {
    const st = s.sim;
    const p = plan();
    return {
      stage: s.stage, // 'rest' | 'pull' | 'slide' | 'slid' | 'wheels' | 'roll' | 'rolled'
      support: st.on, // 'floor' | 'wheels'
      push: round(st.pull, 2), // N, what the force gauge shows
      friction: round(st.friction, 2), // N, the friction under the block now
      speed: round(st.v, 3), // m/s
      distance: round(st.x, 3), // m from the start
      mass: st.mass, // kg
      found: Object.fromEntries(CHIPS.map((id) => [id, s.found[id] == null ? null : round(s.found[id], 2)])),
      next: { label: p.label, step: p.step },
      view: s.view,
      mode: s.mode_ui,
      locked: s.locked,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.stage, snap.support, snap.found, snap.mass, snap.mode, Math.round(snap.push)]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── every frame ─────────────────────────────────────────────────────────────
  let lastStage = '';
  let wasActive = false;
  stage.addTicker((dt) => {
    const moving = advance(dt);
    const active = moving || tweener.busy;
    if (active || wasActive) {
      applyFollow();
      place();
      refresh();
    }
    wasActive = active;
    if (s.stage !== lastStage) {
      lastStage = s.stage;
      emitChange();
    }
    return active;
  });

  // ── the person's moves ──────────────────────────────────────────────────────
  /** A tap on "push": the push rises to the next notch; the 4th tap goes past the maximum and the block gives way. */
  function push() {
    if (s.mode !== 'idle' || s.sim.moving || s.busy) return;
    s.notch++;
    s.stage = 'pull';
    if (s.notch <= NOTCHES.length) {
      s.goal = NOTCHES[s.notch - 1];
      s.up = RATE.up;
      s.mode = 'ramp';
      audio.tick();
    } else startBreak();
    refresh();
    emitChange();
  }

  /** The trolley and the block, set at once (no animation) for a support; nothing pushing. */
  function resetSupport(on, mass = s.sim.mass) {
    for (const key of ['lift', 'trolley', 'x']) tweener.cancel(key);
    block.setMass(mass);
    const wheels = on === 'wheels';
    s.trolley = wheels;
    s.trolleyDX = wheels ? 0 : TROLLEY_FROM;
    s.blockY = wheels ? TROLLEY.top : 0;
    s.busy = false;
    s.mode = 'idle';
    s.hold = false;
    s.goal = 0;
    s.notch = 0;
    s.hideFric = false;
    s.sim = { on, mass, pull: 0, v: 0, x: 0, moving: false, friction: 0, broke: false };
    s.stage = wheels ? 'wheels' : 'rest';
  }

  /** Lift the block, roll the trolley in, set the block down on it (or the other way round); false if called off. */
  async function setSupport(on, { animate = true, own = true } = {}) {
    const wheeled = s.trolley && s.sim.on === 'wheels';
    if ((on === 'wheels') === wheeled) return true;
    const my = own ? ++token : token;
    const tw = async (key, from, to, duration, apply, e = ease.inOutCubic) => {
      if (!animate) {
        apply(to);
        return my === token;
      }
      const done = await tweener.animate({ key, duration, ease: e, onUpdate: (k) => apply(from + (to - from) * k) }).finished;
      return done && my === token;
    };
    s.busy = true;
    s.mode = 'idle';
    s.goal = 0;
    s.sim = { ...s.sim, pull: 0, v: 0, moving: false, friction: 0, on: 'floor' };
    refresh();
    if (on === 'wheels') {
      s.trolley = true;
      s.trolleyDX = TROLLEY_FROM;
      if (!(await tw('lift', s.blockY, LIFT, 0.45, (v) => (s.blockY = v)))) return false;
      if (!(await tw('trolley', TROLLEY_FROM, 0, 0.9, (v) => (s.trolleyDX = v), ease.outCubic))) return false;
      if (!(await tw('lift', LIFT, TROLLEY.top, 0.4, (v) => (s.blockY = v)))) return false;
      s.sim = { ...s.sim, on: 'wheels' };
      s.stage = 'wheels';
      s.notch = 0;
    } else {
      if (!(await tw('lift', s.blockY, LIFT, 0.4, (v) => (s.blockY = v)))) return false;
      if (!(await tw('trolley', 0, TROLLEY_FROM, 0.8, (v) => (s.trolleyDX = v), ease.inCubic))) return false;
      if (!(await tw('lift', LIFT, 0, 0.4, (v) => (s.blockY = v)))) return false;
      s.trolley = false;
      s.sim = { ...s.sim, on: 'floor' };
    }
    s.busy = false;
    refresh();
    emitChange();
    return true;
  }

  /** Back to the start: the block on the floor where it began, nothing pushing. What was found stays on the words. */
  async function goHome({ animate = true } = {}) {
    const my = ++token;
    for (const key of ['lift', 'trolley', 'x']) tweener.cancel(key);
    const wasBusy = s.busy;
    s.mode = 'idle';
    s.goal = 0;
    s.hold = false;
    s.notch = 0;
    s.hideFric = false;
    s.busy = false;
    s.sim = { ...s.sim, pull: 0, v: 0, moving: false, friction: 0 };
    if (wasBusy) {
      // called off half way through putting the block on or taking it off: no tidy way back, so set it down at once
      resetSupport('floor', s.sim.mass);
      refresh();
      emitChange();
      return true;
    }
    if (s.sim.x > 0.001) {
      if (animate) {
        const x0 = s.sim.x;
        const done = await tweener.animate({
          key: 'x',
          duration: Math.min(0.7, 0.3 + x0 * 0.8),
          ease: ease.inOutCubic,
          onUpdate: (k) => (s.sim = { ...s.sim, x: x0 * (1 - k) }),
        }).finished;
        if (!done || my !== token) return false;
      }
      s.sim = { ...s.sim, x: 0 };
    }
    if (s.trolley) {
      s.stage = 'wheels';
      refresh();
      if (!(await setSupport('floor', { animate, own: false })) || my !== token) return false;
    }
    resetSupport('floor', s.sim.mass);
    refresh();
    emitChange();
    return my === token;
  }

  /** What a tap on the big button, the ring or the block does now. */
  function doAction() {
    if (s.locked) return lockedNudge();
    if (s.busy || now() - lastTap < DOUBLE_TAP) return; // a double tap must not do two steps
    lastTap = now();
    hintOff();
    const p = plan();
    if (p.kind === 'push') push();
    else if (p.kind === 'letgo') {
      if (s.mode === 'cruise') s.mode = 'release';
    } else if (p.kind === 'wheels') setSupport('wheels');
    else if (p.kind === 'roll') {
      if (s.mode === 'idle') {
        startBreak();
        refresh();
      }
    } else goHome();
  }

  /** A word of the row: go there. Static: back to the start. Kinetic: push until it gives way. Rolling: on wheels. */
  async function showType(id) {
    if (s.locked) return lockedNudge();
    if (!(await goHome())) return;
    if (id === 'static') return;
    if (id === 'kinetic') {
      const my = token;
      await wait(200);
      if (my !== token || s.mode !== 'idle') return;
      s.notch = NOTCHES.length + 1;
      s.stage = 'pull';
      startBreak(7);
      refresh();
      return;
    }
    if (!(await setSupport('wheels'))) return;
    const my = token;
    await wait(150);
    if (my !== token || s.mode !== 'idle' || s.busy || s.stage !== 'wheels') return;
    startBreak();
    refresh();
  }

  // the big button in the panel and the numbered ring on the block (taps on the ring go through to the block)
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_push1',
    target: () => block.box(),
    pad: 4,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── touching the scene: the block pushes like the big button ────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(block.hit, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      doAction();
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
  function showHint(text, { duration = 3000 } = {}) {
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
    showHint(t('q_locked'), { duration: 2600 });
    audio.error();
  }

  // ── scenes that start part way: pictures, the bridge and the test ──────────
  /** Cancel anything pending and set the support at once. */
  function setNow(on, mass = MASS) {
    ++token;
    resetSupport(on, mass);
  }
  /** Held by a push below the maximum (the block does not move). */
  function setPushed(p, mass = MASS) {
    setNow('floor', mass);
    const { max } = limits('floor', mass);
    const pushN = Math.min(max - 0.1, Math.max(0, p));
    s.sim = { ...s.sim, pull: pushN, friction: pushN };
    s.notch = NOTCHES.filter((n) => n <= pushN + 0.01).length;
    s.stage = pushN > 0 ? 'pull' : 'rest';
  }
  /** The block already moving at its steady pace (the test: it goes on until the answer). */
  function setCruising(on, mass = MASS, { hold = true, seconds = T_STEADY } = {}) {
    setNow(on, mass);
    startBreak(on === 'wheels' ? 20 : 40);
    s.hold = true; // the steady pace must not end while we run on to it
    fastForward(() => s.mode === 'cruise' && s.cruiseT >= seconds);
    s.hold = hold;
    if (hold) {
      const { move } = limits(on, mass);
      s.sim = { ...s.sim, pull: move, v: V_STEADY, friction: move };
    }
  }
  /** Run on to the end: released, stopped, nothing pushing. */
  function setStopped(on) {
    setNow(on);
    startBreak(on === 'wheels' ? 20 : 40);
    fastForward(() => s.mode === 'idle' && s.stage !== 'rest' && s.stage !== 'wheels' && !s.sim.moving);
  }
  /** Jump to a stage of the story at once. */
  function jumpTo(name, { pull: p } = {}) {
    const stageName = STAGES.includes(name) ? name : 'rest';
    const floorFound = () => {
      const l = limits('floor', MASS);
      s.found.static = l.max;
      s.found.kinetic = l.move;
    };
    if (stageName === 'rest') setNow('floor');
    else if (stageName === 'pull') setPushed(Number(p) > 0 ? Number(p) : 6);
    else if (stageName === 'slide') setCruising('floor');
    else if (stageName === 'slid') setStopped('floor');
    else if (stageName === 'wheels') {
      setNow('wheels');
      floorFound();
    } else if (stageName === 'roll') {
      setCruising('wheels');
      floorFound();
    } else {
      setStopped('wheels');
      floorFound();
    }
    applyFollow();
    flyTo(viewPose(), 0);
    place();
    refresh();
    emitChange();
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
  /** An answer: a key (to tell which was tapped) and its words. */
  const ans = (key, f) => ({ key, text: t('a_n', { f: fmt(f) }) });
  const word = (key) => ({ key, text: t(key) });
  /** Four tap choices (the right one first in `items`): shuffled, with the index of the right one. */
  function textChoices(items, kind) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="tf-opt">${list[j].text}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const maxOf = (m) => limits('floor', m).max;
  const moveOf = (m) => limits('floor', m).move;
  const KINDS = ['static', 'slide', 'which', 'load', 'wheels'];

  let learnSaved = null;
  let kinds = [];
  let question = null;
  /** The scene is set: show it (the view fits the block and what it carries). */
  function show(alive) {
    if (!alive()) return;
    applyFollow();
    flyTo(viewPose(), 0);
    place();
    refresh();
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    action,
    lines: { text: 3, feedback: 3 },
    hooks: {
      enter() {
        learnSaved = { found: { ...s.found } };
        s.mode_ui = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode_ui = 'explore';
        s.locked = false;
        s.hold = false;
        s.found = { ...(learnSaved?.found || { static: null, kinetic: null, rolling: null }) };
        setNow('floor');
        s.follow = 0;
        flyTo(viewPose(), 0);
        syncUI();
        place();
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        if (i === 0) kinds = shuffle([...KINDS]); // a new round, a new order
        const kind = kinds[i % kinds.length];
        question = { kind };
        if (kind === 'static') {
          const p = pickOne([3, 5, 7, 8]);
          setPushed(p);
          s.hideFric = 'ask';
          question.p = p;
          show(alive);
          return {
            text: t('q_static'),
            ...textChoices([ans('s_eq', p), ans('s_zero', 0), ans('s_max', maxOf(MASS)), ans('s_weight', weight(MASS))], kind),
          };
        }
        if (kind === 'slide') {
          const m = pickOne([2, 3]);
          setCruising('floor', m);
          s.hideFric = 'ask';
          question.m = m;
          show(alive);
          return {
            text: t('q_slide'),
            ...textChoices([ans('k_eq', moveOf(m)), ans('k_zero', 0), ans('k_max', maxOf(m)), ans('k_weight', weight(m))], kind),
          };
        }
        if (kind === 'which') {
          const what = pickOne(['static', 'kinetic', 'rolling']);
          if (what === 'static') setPushed(pickOne([3, 5, 7, 8]));
          else setCruising(what === 'kinetic' ? 'floor' : 'wheels');
          s.hideFric = 'hide';
          question.what = what;
          show(alive);
          const others = ['w_static', 'w_kinetic', 'w_rolling', 'w_none'].filter((k) => k !== `w_${what}`);
          return { text: t('q_which'), ...textChoices([word(`w_${what}`), ...others.map(word)], kind) };
        }
        if (kind === 'load') {
          const m = pickOne([3, 4]);
          setNow('floor', m);
          question.m = m;
          show(alive);
          return {
            text: t('q_load', { m0: MASS, f0: fmt(maxOf(MASS)) }),
            ...textChoices(
              [ans('l_eq', maxOf(m)), ans('l_same', maxOf(MASS)), ans('l_add', maxOf(MASS) + (m - MASS)), ans('l_whole', weight(m))],
              kind,
            ),
          };
        }
        setCruising('wheels');
        s.hideFric = 'hide';
        show(alive);
        return { text: t('q_wheels'), ...textChoices([word('y_roll'), word('y_light'), word('y_none'), word('y_floor')], kind) };
      },
      reveal(q, correct, picked) {
        const k = question.kind;
        s.hideFric = false;
        refresh();
        const key = correct ? null : q.list?.[picked.index]?.key;
        const r = fmt(limits('wheels').move);
        const note = (map) => (key && map[key] ? ` ${t(map[key], { r, k: question.m ? question.m / MASS : 1 })}` : '');
        if (k === 'static') return t('why_static', { p: fmt(question.p) }) + note({ s_zero: 'not_zero', s_max: 'not_max', s_weight: 'not_weight' });
        if (k === 'slide')
          return (
            t('why_slide', { k: fmt(moveOf(question.m)), m: fmt(maxOf(question.m)) }) +
            note({ k_zero: 'not_moving_zero', k_max: 'not_moving_max', k_weight: 'not_weight' })
          );
        if (k === 'which') return t(`why_which_${question.what}`) + note({ w_none: 'not_none' });
        if (k === 'load')
          return (
            t('why_load', { f: fmt(maxOf(question.m)), f0: fmt(maxOf(MASS)), k: question.m / MASS }) +
            note({ l_same: 'not_same', l_add: 'not_add', l_whole: 'not_whole' })
          );
        return t('why_wheels', { r, k: fmt(moveOf(MASS)) }) + note({ y_light: 'not_light', y_none: 'not_wheel_none', y_floor: 'not_floor' });
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
    root.dataset.mode = s.mode_ui === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode_ui === 'quiz';
    ui.quiz.inert = s.mode_ui !== 'quiz';
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) showType(b.dataset.example);
    if (b.dataset.mode === 'quiz' && s.mode_ui !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
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
    const sceneKey = ['1', '2', '3', 'r', 'R', 'Home', 'ArrowRight'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode_ui === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) showType(CHIPS[Number(k) - 1]);
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  jumpTo(STAGES.includes(o.stage) ? o.stage : 'rest', { pull: o.pull });
  setView(s.view, { animate: false });
  syncUI();
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
     * Change any of: stage (jump to 'rest' | 'pull' | 'slide' | 'slid' | 'wheels' | 'roll' | 'rolled'; 'pull' takes
     * `pull` in N), tap (true: the same as the big button), chip ('static' | 'kinetic' | 'rolling'), home (true), view.
     */
    async set(p = {}) {
      if (p.view) await setView(p.view, { animate: p.animate !== false });
      if (p.stage) jumpTo(p.stage, { pull: p.pull });
      if (p.home) await goHome({ animate: p.animate !== false });
      if (p.chip) await showType(p.chip);
      if (p.tap) {
        lastTap = Number.NEGATIVE_INFINITY;
        doAction();
      }
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = { static: null, kinetic: null, rolling: null };
      s.view = 'front';
      controls.enableRotate = false;
      jumpTo('rest');
      await setView('front', { animate: false });
      syncUI();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The block on the trolley with the force gauge at its left face, in metres (the floor and the arrows stay out). */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'TypesOfFriction';
      const mass = s.sim.mass;
      block.setMass(MASS);
      block.root.position.set(0, TROLLEY.top, 0);
      trolley.root.position.set(0, 0, 0);
      trolley.roll(0);
      gauge.place(-BLOCK.L / 2, TROLLEY.top + BLOCK.H / 2, 0, 0.25);
      const trolleyCopy = trolley.root.clone(true);
      trolleyCopy.visible = true;
      copy.add(trolleyCopy, block.root.clone(true), gauge.root.clone(true));
      block.setMass(mass);
      place();
      return copy;
    },
  };
}
