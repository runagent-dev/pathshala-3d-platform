// Types of friction: a detailed human pushes the same crate on the floor or a loaded wheeled trolley.
// The original physics and comparison numbers are preserved; the arrows and live panel read that same state.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createVector } from './arrow.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { BLOCK, createBlock } from './block.js';
import { createTrolley, TROLLEY } from './trolley.js';
import { createPusher } from './person.js';
import { createFloor } from './floor.js';
import { createSetting, skyTexture } from './setting.js';
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

const COLORS = { push: '#ffb431', friction: '#ff4777', velocity: '#59ccff' };
const ARROW = 0.085; // m of arrow per newton (9.8 N = 14.7 cm; the block is 20 cm long)
const FOLLOW_AT = 0.1; // m: the view follows the block once it is this far along
const T_CRUISE = { floor: 8, wheels: 8 }; // s: the person keeps pushing at a steady pace until the student lets go (or this long)
const T_STEADY = 3.2; // s of steady pace a scene that starts part way (pictures, the test) is run on to
const LIFT = 0.32; // m: the block is lifted this high to slip the trolley under it
const TROLLEY_FROM = 2.3; // m: where the trolley comes from (out of sight on the left)
const DOUBLE_TAP = 350; // ms
const VIEW_3D = new THREE.Vector3(-0.35, 0.55, 0.8).normalize();
const ELEVATION = 8; // degrees above the floor for the side view
const CHIPS = ['static', 'kinetic', 'rolling'];
/** Everything that casts a shadow (the person, the crate with its weights, the trolley), relative to the crate's x: the
 * shadow camera is fitted round it once and follows the crate with the sun. */
const CASTERS = new THREE.Box3(new THREE.Vector3(-1.5, -0.02, -0.42), new THREE.Vector3(0.66, 1.9, 0.42));
const SUN_OFFSET = new THREE.Vector3(-0.9, 3.2, 1.7); // morning sun from the front left: shadows fall back and right

/** Fit a directional light's shadow camera tightly round a box (in the light's own view), with a small margin. */
function fitShadow(light, box) {
  const cam = light.shadow.camera;
  light.updateMatrixWorld();
  light.target.updateMatrixWorld();
  cam.position.copy(light.position);
  cam.lookAt(light.target.position);
  cam.updateMatrixWorld();
  const inv = cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  const p = new THREE.Vector3();
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
  const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (let i = 0; i < 8; i++) {
    p.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(inv);
    lo.min(p);
    hi.max(p);
  }
  const m = 0.06;
  Object.assign(cam, { left: lo.x - m, right: hi.x + m, bottom: lo.y - m, top: hi.y + m, near: Math.max(0.05, -hi.z - 0.3), far: -lo.z + 0.6 });
  cam.updateProjectionMatrix();
}

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
      quiet: [
        { act: 'pause', label: 'act_pause', icon: ICONS.pause },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const live = document.createElement('section');
  live.className = 'tf-live';
  // the live forces: the push and the friction side by side, how the box moves, the resultant and a note (the numbers
  // are examples; on wheels the arrows are drawn longer) that used to sit on the 3D view
  live.innerHTML = `<div class="tf-live-head"><b>${t('live_title')}</b><button type="button" data-act="explain">${t('explain_link')}</button></div><div class="tf-values"><div class="tf-force-row push"><span aria-hidden="true">→</span><span>${t('human_push')}</span><b></b></div><div class="tf-force-row friction"><span aria-hidden="true">←</span><span>${t('contact_friction')}</span><b></b></div><div class="tf-balance"></div><div class="tf-net"><small></small><span class="tf-note"></span></div></div>`;
  ui.$('.pvc-outcome').after(live);
  const liveEl = {
    push: /** @type {HTMLElement} */ (live.querySelector('.push b')),
    friction: /** @type {HTMLElement} */ (live.querySelector('.friction b')),
    balance: /** @type {HTMLElement} */ (live.querySelector('.tf-balance')),
    net: /** @type {HTMLElement} */ (live.querySelector('.tf-net small')),
    note: /** @type {HTMLElement} */ (live.querySelector('.tf-note')),
    pause: /** @type {HTMLButtonElement} */ (ui.$('[data-act="pause"]')),
    explain: /** @type {HTMLButtonElement} */ (live.querySelector('[data-act="explain"]')),
  };
  const written = new Map();
  /** el.innerHTML = html, only when it changed (the panel is refreshed on every frame of a run). */
  const write = (el, html) => {
    if (written.get(el) === html) return;
    written.set(el, html);
    el.innerHTML = html;
  };
  const explanation = document.createElement('dialog');
  explanation.className = 'tf-dialog';
  explanation.setAttribute('aria-label', t('explain_title'));
  root.append(explanation);

  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 32, near: 0.03, far: 80, environment: 'studio-light', environmentIntensity: 0.6 });
  const { camera, controls, scene } = stage;
  const background = skyTexture();
  scene.background = o.bg === 'transparent' ? null : background;
  scene.add(new THREE.HemisphereLight(0xe6f0ff, 0x8a7a66, 0.75));
  const shadows = o.shadow && o.bg !== 'transparent';
  // with shadows the sun (below) carries most of the direct light, so the shadows of the person and the crate show
  const keyLight = new THREE.DirectionalLight(0xfff0dc, shadows ? 0.35 : 1.25);
  keyLight.position.set(-2, 4, 3);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xbfdcff, 0.45);
  rimLight.position.set(2, 2, -3);
  scene.add(rimLight);

  controls.minDistance = 0.3;
  controls.maxDistance = 25;
  controls.enablePan = false;
  controls.enableRotate = false;
  const world = new THREE.Group();
  world.name = 'TypesOfFriction';
  scene.add(world);

  const anisotropy = Math.min(8, stage.renderer.capabilities.getMaxAnisotropy());
  const floor = createFloor({ anisotropy });
  const setting = createSetting({ anisotropy });
  setting.root.visible = o.bg !== 'transparent';
  const block = createBlock({ t });
  const trolley = createTrolley();
  const person = createPusher();
  world.add(setting.root, floor.root, trolley.root, block.root, person.root);
  trolley.root.visible = false;
  floor.setStart(0, BLOCK.L, BLOCK.D);

  const arrows = {
    push: createVector(COLORS.push, 'HumanAppliedForce'),
    friction: createVector(COLORS.friction, 'ContactFriction'),
    velocity: createVector(COLORS.velocity, 'MotionDirection'),
  };
  for (const a of Object.values(arrows)) {
    a.root.userData.noExport = true;
    world.add(a.root);
  }

  // a dashed leader from the palms to the push arrow's tail (two points and their dash distances, updated in place)
  const leaderGeometry = new THREE.BufferGeometry();
  leaderGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  leaderGeometry.setAttribute('lineDistance', new THREE.BufferAttribute(new Float32Array(2), 1));
  const contactLeader = new THREE.Line(
    leaderGeometry,
    new THREE.LineDashedMaterial({ color: 0x7a3300, dashSize: 0.035, gapSize: 0.025, depthTest: false, transparent: true }),
  );
  contactLeader.renderOrder = 6;
  contactLeader.frustumCulled = false;
  contactLeader.name = 'PushContactGuide';
  contactLeader.userData.noExport = true;
  world.add(contactLeader);
  const contactMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 16, 10),
    new THREE.MeshBasicMaterial({ color: 0xffb431, depthTest: false, transparent: true, toneMapped: false }),
  );
  contactMarker.renderOrder = 6;
  contactMarker.name = 'PushContactPoint';
  contactMarker.userData.noExport = true;
  world.add(contactMarker);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // soft PCF on a shadow camera fitted round the person, the crate and the trolley: 1024 px is as sharp as 2048 on the
  // old loose box, and only those are drawn into it (only the platform receives)
  let sun = null;
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun = new THREE.DirectionalLight(0xfff4e2, 1.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.015;
    scene.add(sun, sun.target);
    sun.position.copy(SUN_OFFSET);
    fitShadow(sun, CASTERS);
    for (const obj of [block.root, trolley.root, person.root])
      obj.traverse((m) => {
        m.castShadow = m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false;
      });
  } else for (const obj of [block.root, trolley.root, person.root]) obj.traverse((m) => (m.castShadow = false));
  /** The sun and its fitted shadow box move with the crate (the box is fitted relative to the crate). */
  function placeSun(x) {
    if (!sun) return;
    sun.position.set(x + SUN_OFFSET.x, SUN_OFFSET.y, SUN_OFFSET.z);
    sun.target.position.set(x, 0, 0);
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state: one place every line, label and arrow is drawn from ────────
  const s = {
    stage: 'rest', // 'rest' | 'pull' | 'slide' | 'slid' | 'wheels' | 'roll' | 'rolled'
    // `pull` is the push on the block (the applied force); `friction` the friction under it
    sim: { on: 'floor', mass: MASS, pull: 0, v: 0, x: 0, moving: false, friction: 0, broke: false },
    mode: 'idle', // the person's push: 'idle' | 'ramp' (to goal) | 'cruise' (steady pace) | 'release'
    goal: 0,
    up: RATE.up, // N/s the push rises at
    cruiseT: 0,
    paused: false,
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

  // ── what the person sees: box, trolley, person, arrows ────────────────────
  const tmpA = new THREE.Vector3();
  const pushMid = new THREE.Vector3();
  const pushTail = new THREE.Vector3();
  const handsAt = [new THREE.Vector3(), new THREE.Vector3()];
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
    const faceX = x - L / 2;
    const handle = s.trolley && !s.busy;
    const contactX = handle ? x - 0.6 : faceX - 0.025;
    const contactY = handle ? 0.95 : s.blockY + H * 0.93;
    person.root.position.set(contactX - 0.43, 0, 0);
    const effort = Math.min(1, st.pull / Math.max(limits('floor', st.mass).max, 1));
    const resting = s.stage === 'slid' || s.stage === 'rolled';
    person.pose({
      lean: 0.07 + 0.31 * effort,
      distance: x,
      walking: st.moving,
      grip: handle,
      hands: resting ? null : [handsAt[0].set(0.43, contactY, 0.18), handsAt[1].set(0.43, contactY, -0.18)],
    });
    // The rolling arrows share a labelled 3× magnification; numbers always stay in newtons.
    const scale = ARROW * (s.trolley ? 3 : 1),
      pushLen = st.pull * scale,
      fricLen = st.friction * scale;
    const arrowY = s.blockY + H + 0.15,
      z = D / 2 + 0.14;
    if (st.pull > 0.01 && !s.busy) arrows.push.set(tmpA.set(faceX, arrowY, z), XP, pushLen);
    else arrows.push.hide();
    pushMid.set(faceX + pushLen / 2, arrowY, z);
    contactMarker.position.set(contactX, contactY, 0.18);
    contactMarker.visible = contactLeader.visible = arrows.push.root.visible;
    if (contactLeader.visible) {
      pushTail.set(faceX, arrowY, z);
      const pos = leaderGeometry.attributes.position;
      pos.setXYZ(0, contactX, contactY, 0.18);
      pos.setXYZ(1, pushTail.x, pushTail.y, pushTail.z);
      pos.needsUpdate = true;
      leaderGeometry.attributes.lineDistance.setX(1, contactMarker.position.distanceTo(pushTail));
      leaderGeometry.attributes.lineDistance.needsUpdate = true;
    }
    const fricX = x + (s.trolley ? TROLLEY.wheelX : L * 0.35);
    if (st.friction > 0.01 && !s.busy) arrows.friction.set(tmpA.set(fricX, 0.045, z), XN, fricLen);
    else arrows.friction.hide();
    if (st.moving && !s.busy) arrows.velocity.set(tmpA.set(x + L / 2 + 0.14, s.blockY + H * 0.5, z), XP, 0.5);
    else arrows.velocity.hide();
    floor.showStart(!s.locked && st.x > 0.03 && !s.trolley);
    placeSun(x);
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const sideBox = new THREE.Box3();
  const followX = () => Math.max(0, s.sim.x - FOLLOW_AT);
  const fit = (box, dir) =>
    fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: { top: Math.min(56, stage.height * 0.28), bottom: 42, side: 8 } });
  function viewPose(view = s.view) {
    sideBox.min.set(-1.65, -0.12, -0.42);
    sideBox.max.set(1.55, Math.max(1.78, block.top() + TROLLEY.top + 0.15), 0.8);
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
    if (s.mode_ui === 'quiz') return Promise.resolve(false);
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = controls.enableZoom = !s.locked; // the test keeps the view still
    s.userMovedCamera = false;
    syncUI();
    return flyTo(viewPose(), animate ? 0.8 : 0);
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
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    place();
    refresh();
  });

  // ── labels on the scene ─────────────────────────────────────────────────────
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const tmpBox = new THREE.Box3();
  const boxOut = [0, 1, 2, 3, 4, 5].map(() => ({ left: 0, top: 0, right: 0, bottom: 0 }));
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
      () => action?.ringBox(),
      () => action?.box(),
      () =>
        [
          screenBox(block.box(), boxOut[0]),
          s.trolley ? screenBox(tmpBox.setFromObject(trolley.root), boxOut[1]) : null,
          screenBox(tmpBox.setFromObject(person.root), boxOut[4]),
          arrows.velocity.root.visible ? screenBox(tmpBox.setFromObject(arrows.velocity.root), boxOut[5]) : null,
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
    push: grid([-28, -48, -68, -88], [0, 20, 40, 70, -20, -40, -70, -110, 110]),
    friction: [...grid([28, 48, 62], [0, -12, 12, -24, -40]), ...grid([10, 4, -4], [-70, -100, -140, -170]), ...grid([10, 4], [150, 190])],
  };
  function labelsFor() {
    const st = s.sim;
    if (st.pull >= 0.2 && !s.busy)
      keepLabel('push', {
        text: t('l_push', { f: forceNow(st.pull) }),
        point: () => pushMid,
        color: '#a04a06',
        kind: 'callout',
        spots: SPOTS.push,
        optional: s.mode_ui !== 'quiz',
      });
    else anno.remove('push');
    if (st.friction >= 0.2 && !s.busy && s.hideFric !== 'hide')
      keepLabel('fric', {
        text: s.hideFric === 'ask' ? t('l_fric_q') : t('l_fric', { f: forceNow(st.friction) }),
        point: () => arrows.friction.tip,
        color: '#b32150',
        kind: 'callout',
        spots: SPOTS.friction,
        optional: s.mode_ui !== 'quiz',
      });
    else anno.remove('fric');
    if (arrows.velocity.root.visible)
      keepLabel('velocity', {
        text: t(['steady', 'near_steady'].includes(motionPhase()) ? `l_velocity_${motionPhase()}` : 'l_velocity', { v: round(st.v, 2) }),
        point: () => arrows.velocity.tip,
        color: '#1763a7',
        kind: 'callout',
        spots: grid([-28, -48, 28, 48], [0, -40, 40, -80, 80]),
        optional: true,
      });
    else anno.remove('velocity');
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
        return motionRule();
      case 'slid':
        return t('rule_slid');
      case 'wheels':
        return t('rule_wheels');
      case 'roll':
        return motionRule();
      default:
        return t('rule_complete');
    }
  }

  // A moving body can have zero resultant: forces change velocity, not velocity's existence.
  function motionPhase() {
    const st = s.sim,
      net = st.pull - st.friction;
    if (!st.moving) return 'still';
    if (Math.abs(net) < 1e-8) return 'steady';
    if (Math.abs(net) < 0.05) return 'near_steady';
    return net > 0 ? 'speeding' : 'slowing';
  }
  function forceNow(value) {
    const st = s.sim;
    // Avoid two identical rounded arrows while a visible resultant changes the speed.
    if (st.moving && Math.abs(st.pull - st.friction) >= 0.05 && fmt(st.pull) === fmt(st.friction)) return String(round(value, 2));
    return fmt(value);
  }
  function motionRule() {
    return t(`rule_${motionPhase()}`);
  }
  function updateLive() {
    const st = s.sim,
      net = st.pull - st.friction;
    write(liveEl.push, t('res_n', { f: forceNow(st.pull) }));
    write(liveEl.friction, s.hideFric ? '?' : t('res_n', { f: forceNow(st.friction) }));
    write(liveEl.balance, t(`${motionPhase()}_state`, { v: round(st.v, 2) }));
    write(liveEl.net, t(Math.abs(net) > 1e-8 && Math.abs(net) < 0.05 ? 'net_force_small' : 'net_force', { f: String(round(net, 2)) }));
    write(liveEl.note, t(s.trolley ? 'note_rolling_scale' : 'note_examples', { k: 3 }));
    const pause = liveEl.pause;
    const off = s.busy || (s.mode === 'idle' && !st.moving) || s.mode_ui === 'quiz';
    if (pause.disabled !== off) pause.disabled = off;
    write(pause, s.paused ? ICONS.play : ICONS.pause);
    const label = t(s.paused ? 'act_resume' : 'act_pause');
    if (pause.getAttribute('aria-label') !== label) pause.setAttribute('aria-label', label);
    if (liveEl.explain.disabled !== s.busy) liveEl.explain.disabled = s.busy;
  }
  let resumeExplanation = false;
  let explanationShown = false;
  /** Shut the explanation and resume what it paused: once, however it was closed (button, Escape, reset, the test). */
  function closeExplanation() {
    if (explanation.open) explanation.close();
    if (!explanationShown) return;
    explanationShown = false;
    if (resumeExplanation && s.mode_ui !== 'quiz') s.paused = false;
    resumeExplanation = false;
    refresh();
  }
  let explanationPage = 'forces';
  function renderExplanation() {
    const st = s.sim,
      N = fmt(weight(st.mass)),
      l = limits('floor', st.mass);
    const content =
      explanationPage === 'forces'
        ? `<div class="tf-vector-diagram" aria-label="${t('diagram_label')}"><div class="tf-normal">↑ ${t('support_force', { n: N })}</div><div class="tf-horizontal"><span class="tf-friction">← ${t('res_n', { f: forceNow(st.friction) })}</span><b>${t(s.trolley ? 'box_with_trolley' : 'box_system')}</b><span class="tf-push">${t('res_n', { f: forceNow(st.pull) })} →</span></div><div class="tf-weight">↓ ${t('weight_force', { n: N })}</div></div><p>${t('force_explanation')}</p>`
        : `<p>${t('static_formula', { mu: MU.s, n: N, max: fmt(l.max) })}</p><p>${t('kinetic_formula', { mu: MU.k, n: N, value: fmt(l.move) })}</p><small>${t('rolling_explanation')}</small>`;
    explanation.innerHTML = `<h2>${t('explain_title')}</h2><nav>${['forces', 'formulas'].map((page) => `<button type="button" data-explainpage="${page}" aria-pressed="${page === explanationPage}">${t(`explain_${page}`)}</button>`).join('')}</nav>${content}<button type="button" class="pvc-btn primary" data-act="explain-close">${t('explain_close')}</button>`;
  }
  function openExplanation() {
    if (s.mode_ui === 'quiz' || s.busy) return;
    resumeExplanation = !s.paused;
    s.paused = true;
    explanationPage = 'forces';
    renderExplanation();
    explanation.showModal();
    explanationShown = true;
    refresh();
  }
  explanation.addEventListener('close', closeExplanation);
  explanation.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeExplanation();
  });
  const outcomeEl = ui.$('.pvc-outcome');
  let lastRing = null;
  let lastChip = '';
  let lastNext = '';
  function refresh() {
    updateLive();
    if (chipOf() !== lastChip) sheet.choose((lastChip = chipOf()));
    const next = s.stage === 'slid' ? 'rolling' : '';
    if (next !== lastNext) sheet.next((lastNext = next) || null);
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
      const wantRing = !s.busy && s.mode === 'idle' && s.sim.pull < 0.01 && !s.sim.moving && !s.locked;
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
      push: round(st.pull, 2), // N, the person's applied force
      friction: round(st.friction, 2), // N, the friction under the block now
      speed: round(st.v, 3), // m/s
      distance: round(st.x, 3), // m from the start
      mass: st.mass, // kg
      found: Object.fromEntries(CHIPS.map((id) => [id, s.found[id] == null ? null : round(s.found[id], 2)])),
      next: { label: p.label, step: p.step },
      view: s.view,
      mode: s.mode_ui,
      locked: s.locked,
      paused: s.paused,
      netForce: round(st.pull - st.friction, 2),
      acceleration: round((st.pull - st.friction) / st.mass, 3),
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
    const moving = s.paused ? false : advance(dt);
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
    s.paused = false;
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
    s.paused = false;
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
    s.paused = false;
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
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
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
        if (explanation.open) {
          resumeExplanation = false;
          closeExplanation();
        }
        s.paused = false;
        s.view = 'front';
        controls.enableRotate = false;
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
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    if (!s.locked) controls.enableRotate = controls.enableZoom = true; // the test keeps the view still
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
    if (b.dataset.explainpage) {
      explanationPage = b.dataset.explainpage;
      renderExplanation();
    }
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) showType(b.dataset.example);
    if (b.dataset.mode === 'quiz' && s.mode_ui !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    switch (b.dataset.act) {
      case 'pause':
        if (s.mode_ui !== 'quiz') {
          s.paused = !s.paused;
          refresh();
          emitChange();
        }
        break;
      case 'explain':
        openExplanation();
        break;
      case 'explain-close':
        closeExplanation();
        break;
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
    if (explanation.open) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeExplanation();
      }
      return;
    }
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
      if (explanation.open && (p.stage || p.home || p.chip)) {
        resumeExplanation = false;
        closeExplanation();
      }
      if (p.view && s.mode_ui !== 'quiz') await setView(p.view, { animate: p.animate !== false });
      if (p.stage && s.mode_ui !== 'quiz') jumpTo(p.stage, { pull: p.pull });
      if (p.home && s.mode_ui !== 'quiz') await goHome({ animate: p.animate !== false });
      if (p.chip) await showType(p.chip);
      if (p.paused != null && s.mode_ui !== 'quiz') s.paused = Boolean(p.paused);
      if (p.tap) {
        lastTap = Number.NEGATIVE_INFINITY;
        doAction();
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      if (explanation.open) {
        resumeExplanation = false;
        closeExplanation();
      }
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
    capture(opts = {}) {
      const before = scene.background;
      const platform = setting.root.visible;
      if (opts.background !== undefined) {
        scene.background = null;
        setting.root.visible = false;
      }
      try {
        return stage.capture(opts);
      } finally {
        scene.background = before;
        setting.root.visible = platform;
        stage.invalidate();
      }
    },
    /** Current human, crate, trolley and force vectors; the long floor and HTML labels stay out. */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'TypesOfFriction';
      copy.add(person.root.clone(true), block.root.clone(true));
      if (s.trolley) copy.add(trolley.root.clone(true));
      for (const a of Object.values(arrows))
        if (a.root.visible) {
          const c = a.root.clone(true);
          delete c.userData.noExport;
          copy.add(c);
        }
      return copy;
    },
  };
}
