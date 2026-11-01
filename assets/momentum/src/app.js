// Momentum (ভরবেগ, book page 71, topic 3.4), student view. The book's thought experiment, run by the student: a
// loaded truck (10 000 kg) and a bicycle with its rider (80 kg) go at the same velocity, each toward a parked small
// car. Over each one a blue arrow shows its velocity v⃗ (the same length: the same velocity) and a green arrow its
// momentum p⃗ = m v⃗, both p arrows on one scale: the bicycle's is short, the truck's 125 times as long, so it runs
// off the screen (a label at the edge says so). The panel writes p⃗ = m v⃗ with the numbers for both. A tap on the
// truck (or চালাও) plays the run: the truck crumples its car and shoves it metres along, the bicycle barely moves
// its car. The student changes the velocity (both factors matter) and the direction (a vector: to the left is
// negative). Then a short test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createCoach } from '@shared/student/coach.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { createBoldArrow } from './arrow.js';
import { frontFit, frontPose, screenU, spherePose } from './camera.js';
import { CAR, createCar } from './car.js';
import { createI18n } from './i18n.js';
import { BIKE, createCyclist, createRunner } from './people.js';
import {
  about,
  CRASH,
  calcChoices,
  compare,
  crashPlan,
  doubleChoices,
  fmt,
  GAP,
  group,
  MASS,
  momentum,
  plain,
  runAt,
  SCALE,
  SPEED,
  signChoices,
} from './physics.js';
import { blobShadow, createStreet, LANES, skyTexture } from './street.js';
import { createTruck, TRUCK } from './truck.js';

export const DEFAULTS = {
  speed: SPEED.start, // m/s, the same for the truck and the bicycle
  dir: 'right', // 'right' | 'left': the way they go (to the right is positive)
  at: null, // s after the start of the run, shown paused (empty: the start)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const ELEV = THREE.MathUtils.degToRad(33); // the front view looks down on the road from 33° above
const FOV = { front: 8, '3d': 26 };
// arrows in the chapter's colours; the p⃗ words in a darker green that reads well as small text (as the sister figure)
const COLOR = { v: '#1c6fd9', p: '#2f9e44', pText: '#237a35' };
const W_MIN = 14; // m of road the front view always shows across: the vehicles and the parked cars, on a phone
const DOUBLE_TAP = 400; // ms: a second tap this soon does not undo the first
const LANE_IDS = ['far', 'near'];
const BODY = {
  truck: { len: TRUCK.length, top: TRUCK.height, half: TRUCK.width / 2, tag: 'tag_truck', who: 'who_truck', name: 'name_truck' },
  bike: { len: BIKE.length, top: BIKE.head, half: 0.3, tag: 'tag_bike', who: 'who_bike', name: 'name_bike' },
  car: { len: CAR.length, top: CAR.height, half: CAR.width / 2, tag: 'tag_car', who: 'who_car', name: 'name_car' },
  runner: { len: 0.9, top: 1.68, half: 0.25, tag: 'tag_runner', who: 'who_runner', name: 'name_runner' },
};
// arrows ride above a body, high enough to clear its roof as seen from 30° above: p⃗ first, v⃗ over it, far enough
// apart that each keeps its own label at its own height
for (const b of Object.values(BODY)) {
  b.py = Math.max(b.top + 0.6, b.top + b.half * Math.tan(ELEV) + 0.22);
  b.vy = b.py + 0.65;
}
// the small bodies of the near lane carry theirs higher, in the middle of the empty band between the lanes on the
// screen, where their labels have room above and below
BODY.bike.py = 2.9;
BODY.bike.vy = 3.55;
BODY.runner.py = 2.7;
BODY.runner.vy = 3.35;
const FLIP_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h15M15 4l4 4-4 4"/><path d="M20 16H5M9 12l-4 4 4 4"/></svg>`;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const F = (x) => N(fmt(x)); // a number for the student: commas from 1,000 up, the language's numerals
  const now = () => performance.now();

  root.classList.add('pvc', 'mo');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const row = (id, name) =>
    `<tr data-row="${id}"><th scope="row">${t(name)}</th><td class="c-p"><b data-v="p"></b></td><td class="op">=</td><td class="c-m"><b data-v="m"></b></td><td class="op">×</td><td class="c-v"><b data-v="v"></b></td></tr>`;
  const ui = buildStudentShell(root, t, {
    learnAlign: 'start',
    learn: `
          <div class="mo-top">
            <p class="mo-idea"><span>${t('idea')}</span><span class="mo-formula">${t('formula')}</span></p>
            <div class="mo-step" role="group" aria-label="${t('speed')}">
              <button class="pvc-btn" data-act="slower" aria-label="${t('speed_down')}">${ICONS.minus}</button>
              <b class="mo-step-v" aria-live="polite"></b>
              <button class="pvc-btn" data-act="faster" aria-label="${t('speed_up')}">${ICONS.plus}</button>
            </div>
          </div>
          <table class="mo-tab">
            <thead><tr><td class="mo-cap"><span>${t('at_hit')}</span></td><th class="c-p">${t('col_p')}<small>${t('u_p')}</small></th><td class="op">=</td><th class="c-m">${t('col_m')}<small>${t('u_m')}</small></th><td class="op">×</td><th class="c-v">${t('col_v')}<small>${t('u_v')}</small></th></tr></thead>
            <tbody>${row('far', 'name_truck')}${row('near', 'name_bike')}</tbody>
          </table>
          <p class="mo-say"></p>
          <div class="mo-foot">
            <div class="mo-acts">
              <button class="pvc-btn" data-act="flip">${FLIP_ICON}<span>${t('act_flip')}</span></button>
              <button class="pvc-btn primary" data-act="play">${ICONS.play}<span></span></button>
            </div>
            <p class="mo-box"><span>${t('box_unit')}</span><span class="mo-dot" aria-hidden="true">·</span><span>${t('box_dim')}</span></p>
          </div>`,
  });
  const $ = ui.$;
  const el = {
    speed: $('.mo-step-v'),
    slower: $('[data-act="slower"]'),
    faster: $('[data-act="faster"]'),
    say: $('.mo-say'),
    cap: $('.mo-cap'),
    play: $('[data-act="play"]'),
    playLabel: $('[data-act="play"] span'),
    rows: Object.fromEntries(
      LANE_IDS.map((id) => [id, Object.fromEntries(['p', 'm', 'v'].map((k) => [k, $(`[data-row="${id}"] [data-v="${k}"]`)]))]),
    ),
  };

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: FOV.front, near: 2, far: 900, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minDistance = 8;
  controls.maxDistance = 2000; // the front view's long lens stands far back (about 100 m); the 3D view sets its own limit
  controls.maxPolarAngle = THREE.MathUtils.degToRad(84);
  const world = new THREE.Group();
  world.name = 'Momentum';
  scene.add(world);
  const street = createStreet();
  street.root.userData.noExport = true;
  world.add(street.root);
  // the sky shows only when the view is turned (the front view looks down on the street): made then, drawn then
  let sky = null;
  function showSky(on) {
    if (o.bg === 'transparent') return;
    if (on && !sky) sky = skyTexture();
    scene.background = on ? sky : null;
  }
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  const sun = new THREE.DirectionalLight(0xffffff, 0.75);
  scene.add(sun, sun.target);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun.castShadow = true;
    // a tight box round the street in view (fitShadow), so 1024 texels look as sharp as 2048 did on a loose one
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 8, bottom: -8, near: 16, far: 46 });
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0005;
  }
  /** The shadow box: the road across the view (`span` m), both lanes and the bodies' height. */
  function fitShadow(span) {
    if (!sun.castShadow) return;
    const half = THREE.MathUtils.clamp(span / 2 + 3, 10, 22);
    const cam = sun.shadow.camera;
    if (Math.abs(cam.right - half) < 0.5) return;
    Object.assign(cam, { left: -half, right: half });
    cam.updateProjectionMatrix();
    stage.invalidate();
  }
  function placeSun(x) {
    sun.position.set(x - 8, 26, 14);
    sun.target.position.set(x, 0, 0);
  }

  // the arrows' size (m); thickness() makes them thicker on a small view
  const ARROW = { r: 0.075 };
  const boldArrow = (color, name) => createBoldArrow({ color, name, radius: ARROW.r, head: 0.45, headRadius: 0.2 });

  // the two lanes: the far one for the truck, the near one for the bicycle; each with its parked small car, its
  // two arrows and any body a test question needs (made when first needed)
  function makeLane(id) {
    const z = LANES[id];
    const group = new THREE.Group();
    group.name = id === 'far' ? 'FarLane' : 'NearLane';
    world.add(group);
    const parked = createCar({ name: 'ParkedSmallCar' });
    parked.root.position.z = z;
    parked.root.add(blobShadow(CAR.length + 0.6, CAR.width + 0.5).translateX(CAR.length / 2));
    group.add(parked.root);
    const arrows = { v: boldArrow(COLOR.v, 'VelocityArrow'), p: boldArrow(COLOR.p, 'MomentumArrow') };
    for (const a of Object.values(arrows)) {
      a.root.userData.noExport = true;
      group.add(a.root);
    }
    // persp: in the front view this lane's arrows are drawn longer or shorter by its depth, so that equal vectors
    // in the two lanes are equally long on the screen (1 in the 3D view)
    return { id, z, group, parked, arrows, bodies: {}, cur: null, show: null, edge: false, persp: 1 };
  }
  const lanes = { far: makeLane('far'), near: makeLane('near') };

  /** Only the parts whose shadows are seen cast them (not lamps, ropes, plates or the chain). */
  function castShadows(obj) {
    obj.traverse((m) => {
      if (m instanceof THREE.Mesh && m.material?.visible !== false && !m.material?.transparent && !m.userData.smallPart) m.castShadow = true;
    });
  }
  /** The body of `kind` in a lane: a wrapper whose origin is the body's front, facing +x. */
  function bodyOf(lane, kind) {
    if (lane.bodies[kind]) return lane.bodies[kind];
    let model;
    const wrap = new THREE.Group();
    if (kind === 'truck') model = createTruck();
    else if (kind === 'bike') model = createCyclist();
    else if (kind === 'runner') model = createRunner();
    else model = createCar({ name: 'Car', color: '#d9dde2' });
    if (kind === 'car') model.root.position.x = -CAR.length;
    if (kind === 'runner') model.root.position.x = -0.4;
    wrap.name = model.root.name;
    wrap.add(model.root);
    const info = BODY[kind];
    wrap.add(blobShadow(info.len + 0.5, info.half * 2 + 0.5, kind === 'bike' || kind === 'runner' ? 0.3 : 0.42).translateX(-info.len / 2));
    wrap.position.z = lane.z;
    wrap.visible = false;
    lane.group.add(wrap);
    if (stage.renderer.shadowMap.enabled) castShadows(model.root);
    const box = new THREE.Box3(new THREE.Vector3(-info.len, 0, -info.half), new THREE.Vector3(0, info.top, info.half));
    const b = { wrap, model, info, box, kind };
    lane.bodies[kind] = b;
    return b;
  }
  if (stage.renderer.shadowMap.enabled) for (const lane of Object.values(lanes)) castShadows(lane.parked.root);

  /**
   * Put a lane's body where `cur` says: { kind, m, v (m/s along x, signed), x (world x of its front), facing (±1),
   * roll (m covered), jolt (0…1), pitch (rad), fade (arrows 0…1) }; its arrows from its middle, along v.
   */
  const tmpA = new THREE.Vector3();
  const tmpD = new THREE.Vector3();
  function applyLane(lane) {
    const c = lane.cur;
    for (const b of Object.values(lane.bodies)) b.wrap.visible = Boolean(c) && b.kind === c.kind;
    if (!c) {
      lane.arrows.v.hide();
      lane.arrows.p.hide();
      return;
    }
    const b = bodyOf(lane, c.kind);
    b.wrap.visible = true;
    b.wrap.position.set(c.x, 0, lane.z);
    b.wrap.rotation.y = c.facing > 0 ? 0 : Math.PI;
    b.model.roll?.(c.roll ?? 0);
    if (c.kind === 'bike') b.model.jolt(c.jolt ?? 0);
    if (c.kind === 'truck') b.model.setPitch(c.pitch ?? 0);
    const mid = c.x - (c.facing * b.info.len) / 2;
    const fade = c.fade ?? 1;
    const show = lane.show || {};
    const dir = tmpD.set(Math.sign(c.v) || c.facing, 0, 0);
    for (const k of ['v', 'p']) {
      const a = lane.arrows[k];
      const len = (k === 'v' ? Math.abs(c.v) * SCALE.v : Math.abs(momentum(c.m, c.v)) * SCALE.p) * lane.persp;
      if (!show[k] || fade <= 0.01 || len < 1e-6) {
        a.hide();
        continue;
      }
      a.set(tmpA.set(mid, k === 'v' ? b.info.vy : b.info.py, lane.z), dir, len);
      a.setOpacity(fade);
    }
  }

  function placeParked(lane, p) {
    lane.parked.root.visible = Boolean(p);
    if (!p) return;
    lane.parked.root.position.set(p.x, 0, lane.z);
    lane.parked.root.rotation.y = p.facing > 0 ? 0 : Math.PI;
    lane.parked.crumple(p.crush ?? 0);
  }

  // the dimension line in the middle lane: how far the truck's car was shoved
  const moveMark = (() => {
    const g = new THREE.Group();
    g.name = 'MovedMark';
    g.userData.noExport = true;
    const m = new THREE.MeshBasicMaterial({ color: '#4a4f55' });
    const line = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 0.05), m);
    const ticks = [0, 1].map(() => new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.5), m));
    g.add(line, ...ticks);
    g.visible = false;
    world.add(g);
    return {
      group: g,
      mid: new THREE.Vector3(),
      ends: [new THREE.Vector3(), new THREE.Vector3()],
      set(x0, x1, z) {
        g.visible = Math.abs(x1 - x0) > 0.03;
        line.scale.x = Math.abs(x1 - x0);
        line.position.set((x0 + x1) / 2, 0.02, z);
        ticks[0].position.set(x0, 0.02, z);
        ticks[1].position.set(x1, 0.02, z);
        this.mid.set((x0 + x1) / 2, 0.02, z);
        this.ends[0].set(x0, 0.02, z);
        this.ends[1].set(x1, 0.02, z);
      },
      hide() {
        g.visible = false;
      },
    };
  })();

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const clampSpeed = (v) => Math.round(THREE.MathUtils.clamp(Number(v) || SPEED.start, SPEED.min, SPEED.max));
  const s = {
    speed: clampSpeed(o.speed),
    dir: o.dir === 'left' ? -1 : 1,
    t: 0, // s into the run while paused
    t0: 0, // performance.now() at the run's t = 0 while playing
    playing: false,
    plans: null,
    tEnd: 0,
    scene: 'run', // 'run' (the truck and the bicycle) | 'still' (a test question's picture)
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    phase: 'start', // 'start' | 'moving' | 'crash' | 'done' (run time 0, before the impact, after it, at rest)
    userMovedCamera: false,
    fit: null,
    frame: null, // the test question's framing { lanes, x0, x1 }
    learn: null, // the student's speed and direction while the test borrows the run
  };
  let lastPlay = Number.NEGATIVE_INFINITY;

  function makePlans() {
    s.plans = { far: crashPlan('truck', s.speed), near: crashPlan('bike', s.speed) };
    s.tEnd = Math.max(s.plans.far.tEnd, s.plans.near.tEnd);
  }
  const runTime = () => (s.playing ? Math.min(s.tEnd, (now() - s.t0) / 1000) : s.t);
  /** A place along the lane (0 = the parked car's end that is hit, the vehicles come from below 0) → world x. */
  const sx = (v) => (s.dir > 0 ? v : CAR.length - v);
  const phaseAt = (time) => {
    if (time <= 1e-6) return 'start';
    if (time >= s.tEnd - 1e-6) return 'done';
    return time < s.plans.far.tHit ? 'moving' : 'crash';
  };

  /** Everything in the run at `time`: the bodies, their arrows, the parked cars, the camera. */
  function placeRun(time) {
    for (const id of LANE_IDS) {
      const lane = lanes[id];
      const plan = s.plans[id];
      const st = runAt(plan, time);
      const kind = id === 'far' ? 'truck' : 'bike';
      const since = st.since ?? -1;
      lane.cur = {
        kind,
        m: MASS[kind],
        v: s.dir * s.speed, // the arrows show the velocity it hits with; they fade at the impact
        x: sx(st.front),
        facing: s.dir,
        roll: st.front + GAP,
        jolt: since >= 0 && since < 0.5 ? Math.sin((Math.PI * since) / 0.5) : 0,
        pitch:
          kind === 'truck' && since >= 0
            ? 0.014 *
              THREE.MathUtils.smoothstep(since, 0, 0.12) *
              (1 - THREE.MathUtils.smoothstep(since, plan.tSplit - plan.tHit + plan.t1, plan.tSplit - plan.tHit + plan.t1 + 0.35))
            : 0,
        // the arrows fade out at the impact, and are gone by the time everything is at rest (at 1 m/s that is soon)
        fade: since < 0 ? 1 : Math.max(0, 1 - since / Math.min(0.25, plan.tEnd - plan.tHit - 0.02)),
      };
      applyLane(lane);
      // the truck's driver brakes from the impact on, and keeps the brake on once it has stopped
      if (kind === 'truck') bodyOf(lane, 'truck').model.setBrake(since >= 0);
      placeParked(lane, { x: sx(st.car), facing: s.dir, crush: st.crush });
      if (id === 'far') {
        const done = time >= plan.tEnd - 1e-6;
        if (done)
          moveMark.set(sx(0), sx(st.car), -0.9); // in the middle of the empty band between the lanes
        else moveMark.hide();
      }
    }
    if (s.view === 'front' && !s.userMovedCamera && !tweener.busy) placeFront();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ratio = MASS.truck / MASS.bike;
  /** A distance as the student reads it: "প্রায় ২ m", "৩২ cm", or "১ cm-এর কম" (never rounded up). */
  function distance(x) {
    const a = about(x);
    return t(a.less ? 'd_less' : a.unit === 'm' ? 'd_m' : 'd_cm', { d: a.value });
  }
  function sayLine() {
    if (s.phase === 'done') {
      const far = s.plans.far;
      const near = s.plans.near;
      const car = t(far.crush > CRASH.crumpled ? 'crash_crumpled' : 'crash_dented', { a: distance(far.s2) });
      const bike = t(about(near.s2).less ? 'crash_bike_less' : 'crash_bike', { b: distance(near.s2) });
      return `${car} ${bike}`;
    }
    return t(s.dir < 0 ? 'say_left' : 'say_same', { r: ratio });
  }
  function refresh() {
    el.speed.textContent = t('speed_value', { v: s.speed });
    el.slower.disabled = s.speed <= SPEED.min;
    el.faster.disabled = s.speed >= SPEED.max;
    const v = s.dir * s.speed;
    for (const id of LANE_IDS) {
      const m = id === 'far' ? MASS.truck : MASS.bike;
      el.rows[id].p.textContent = F(momentum(m, v));
      el.rows[id].m.textContent = F(m);
      el.rows[id].v.textContent = N(plain(v));
    }
    el.say.innerHTML = sayLine();
    // from the impact on the vehicles slow down and stop: the table is the momentum they hit with
    el.cap.classList.toggle('on', s.scene === 'run' && (s.phase === 'crash' || s.phase === 'done'));
    el.playLabel.textContent = t(s.phase === 'done' ? 'act_again' : s.playing ? 'act_moving' : 'act_play');
    el.play.classList.toggle('is-busy', s.playing);
    stage.invalidate();
  }

  function snapshot() {
    const v = s.dir * s.speed;
    const time = runTime();
    const done = s.phase === 'done';
    return {
      speed: s.speed,
      dir: s.dir > 0 ? 'right' : 'left',
      v,
      phase: s.phase,
      t: +time.toFixed(3),
      playing: s.playing,
      truck: { m: MASS.truck, v, p: momentum(MASS.truck, v) },
      bike: { m: MASS.bike, v, p: momentum(MASS.bike, v) },
      ratio,
      moved: done ? { truck: +s.plans.far.s2.toFixed(3), bike: +s.plans.near.s2.toFixed(3) } : null,
      dent: done ? { truck: +s.plans.far.crush.toFixed(3), bike: +s.plans.near.crush.toFixed(3) } : null,
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.speed}|${snap.dir}|${snap.phase}|${snap.playing}|${snap.mode}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── labels on the scene ─────────────────────────────────────────────────────
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint] });
  const P3 = new THREE.Vector3();
  function toScreen(p) {
    P3.copy(p).project(camera);
    return { x: (P3.x * 0.5 + 0.5) * stage.width, y: (-P3.y * 0.5 + 0.5) * stage.height };
  }
  /** Screen boxes of every shown arrow and body (labels keep off them), worked out once per frame. */
  let boxFrame = -1;
  let boxCache = [];
  let frameNo = 0;
  stage.onBeforeRender(() => frameNo++);
  const corner = new THREE.Vector3();
  const PARKED_BOX = new THREE.Box3(new THREE.Vector3(0, 0, -CAR.width / 2), new THREE.Vector3(CAR.length, CAR.height, CAR.width / 2));
  function sceneBoxes() {
    if (boxFrame === frameNo) return boxCache;
    boxFrame = frameNo;
    boxCache = [];
    for (const lane of Object.values(lanes)) {
      for (const a of Object.values(lane.arrows)) {
        if (!a.root.visible) continue;
        const p0 = toScreen(a.root.position);
        const p1 = toScreen(a.tip);
        boxCache.push({
          left: Math.min(p0.x, p1.x) - 4,
          right: Math.max(p0.x, p1.x) + 4,
          top: Math.min(p0.y, p1.y) - 6,
          bottom: Math.max(p0.y, p1.y) + 6,
        });
      }
      const bodies = Object.values(lane.bodies)
        .filter((b) => b.wrap.visible)
        .map((b) => [b.wrap, b.box]);
      if (lane.parked.root.visible) bodies.push([lane.parked.root, PARKED_BOX]);
      for (const [obj, box] of bodies) {
        obj.updateMatrixWorld();
        const r = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
        for (let i = 0; i < 8; i++) {
          corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(obj.matrixWorld);
          const q = toScreen(corner);
          r.left = Math.min(r.left, q.x);
          r.right = Math.max(r.right, q.x);
          r.top = Math.min(r.top, q.y);
          r.bottom = Math.max(r.bottom, q.y);
        }
        boxCache.push(r);
      }
    }
    return boxCache;
  }
  /** The dimension line's box (labels keep off it, except its own). */
  function markBox() {
    if (!moveMark.group.visible) return null;
    const a = toScreen(moveMark.ends[0]);
    const b = toScreen(moveMark.ends[1]);
    return { left: Math.min(a.x, b.x) - 4, right: Math.max(a.x, b.x) + 4, top: Math.min(a.y, b.y) - 9, bottom: Math.max(a.y, b.y) + 9 };
  }
  const avoidScene = [() => sceneBoxes(), () => markBox()];

  /** Where the p arrow leaves the screen (its tip is off it): the point on the shaft 12 px in from the edge. */
  const edgePoint = new THREE.Vector3();
  function arrowAtEdge(a) {
    const from = a.root.position;
    const right = a.tip.x > from.x;
    const goal = right ? stage.width - 12 : 12;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 26; i++) {
      const mid = (lo + hi) / 2;
      edgePoint.lerpVectors(from, a.tip, mid);
      const x = toScreen(edgePoint).x;
      if (right ? x < goal : x > goal) lo = mid;
      else hi = mid;
    }
    return edgePoint.lerpVectors(from, a.tip, lo);
  }
  const offScreen = (p) => {
    const q = toScreen(p);
    return q.x < 6 || q.x > stage.width - 6;
  };
  /** Screen pixels per metre along the road at a lane (for spots beside a body). */
  const pxA = new THREE.Vector3();
  const pxB = new THREE.Vector3();
  function pxPerM(lane) {
    pxA.set(controls.target.x, 0, lane.z);
    pxB.set(controls.target.x + 1, 0, lane.z);
    return Math.abs(toScreen(pxB).x - toScreen(pxA).x) || 20;
  }

  // v⃗'s label sits at the arrow's tail (behind it), p⃗'s at its head (ahead of it): each at its own arrow's
  // height, so the two never stack; over the empty middle lane, never on a body or a parked car
  const SPOTS = {
    vR: [
      { dx: -8, dy: 0 },
      { dx: 0, dy: -20 },
      { dx: -8, dy: -20 },
      { dx: 40, dy: -20 },
    ],
    vL: [
      { dx: 8, dy: 0 },
      { dx: 0, dy: -20 },
      { dx: 8, dy: -20 },
      { dx: -40, dy: -20 },
      { dx: -90, dy: -20 },
    ],
    pR: [
      { dx: 8, dy: 0 },
      { dx: 8, dy: -6 },
      { dx: 8, dy: 16 },
      { dx: 8, dy: -16 },
    ],
    pL: [
      { dx: -8, dy: 0 },
      { dx: -8, dy: -6 },
      { dx: -8, dy: 16 },
      { dx: -8, dy: -16 },
    ],
    dim: [
      { dx: 0, dy: 16 },
      { dx: 0, dy: -16 },
      { dx: 0, dy: 0 }, // on the line itself, as on a drawing
    ],
  };
  /**
   * A small view (under 17 px per metre) has no room round the arrows for labels with their numbers: there they
   * carry just the symbols v⃗ and p⃗ (the numbers are in the panel's table, next to the view). The test always
   * shows the numbers, which its questions need.
   */
  const compact = () => s.mode !== 'quiz' && s.scene === 'run' && pxPerM(lanes.near) < 17;
  /** The edge label's spots: above the arrow at the screen's edge (one line), or two lines in a wide view. */
  const edgeSpots = (right) => {
    const dy = 17;
    const k = right ? -1 : 1;
    // at the edge, over or under the arrow; else further along it, clear of the corner buttons
    return [
      { dx: 4 * k, dy: -dy },
      { dx: 4 * k, dy },
      { dx: 120 * k, dy: -dy },
      { dx: 220 * k, dy: -dy },
      { dx: 120 * k, dy },
    ];
  };
  const pSpots = (lane, right) => (lane.edge ? edgeSpots(right) : right ? SPOTS.pR : SPOTS.pL);
  /** Under a body; else beside it at half its height, or over its roof, when there is no room under it. */
  function besideSpots(lane, len, top) {
    const k = pxPerM(lane);
    const side = (len / 2) * k + 10;
    const up = -(top * Math.cos(ELEV) * k) / 2;
    const roof = -(top * Math.cos(ELEV) * k) - 22;
    return [
      { dx: 0, dy: 25 },
      { dx: -side / 2, dy: 25 },
      { dx: side / 2, dy: 25 },
      { dx: side, dy: up },
      { dx: -side, dy: up },
      { dx: side, dy: 26 },
      { dx: -side, dy: 26 },
      { dx: 0, dy: roof },
      { dx: 0, dy: 50 },
    ];
  }

  /**
   * The words of a lane's p label: normal, or at the screen's edge when the arrow runs off it (with an arrowhead
   * saying it goes on). How much longer it is than the bicycle's is said in the panel, not on the view.
   */
  function pText(lane) {
    const c = lane.cur;
    if (compact() && !lane.edge) return t('lab_p_sym');
    const main = compact() ? t('lab_p_sym') : t('lab_p', { p: group(momentum(c.m, c.v)) });
    if (!lane.edge) return main;
    const arrow = `<span class="mo-ar${c.v < 0 ? ' left' : ''}">${ICONS.arrowR}</span>`;
    return `<span class="mo-edge">${c.v < 0 ? `${arrow}${main}` : `${main}${arrow}`}</span>`;
  }

  const tmpTag = { far: new THREE.Vector3(), near: new THREE.Vector3() };
  /**
   * Labels for what each lane shows now (called when the scene changes, not every frame): the arrows' labels
   * first, then the mass tags. In the run the tags give way (hide) when there is no room; in the test they always
   * show, because the questions need the masses.
   */
  function syncLabels() {
    let added = false;
    const before = (lane) => Boolean(lane.cur) && (s.scene !== 'run' || runTime() < s.plans[lane.id].tHit);
    for (const lane of Object.values(lanes)) {
      const c = lane.cur;
      const show = lane.show;
      const id = lane.id;
      const right = c && (Math.sign(c.v) || c.facing) > 0;
      // v⃗ behind its arrow's tail when p⃗'s label is ahead of it; ahead of its own head when p⃗ is hidden (a test)
      if (show?.v && before(lane)) {
        const text = show.speedOnly ? t('lab_speed', { v: plain(Math.abs(c.v)) }) : compact() ? t('lab_v_sym') : t('lab_v', { v: plain(c.v) });
        const tail = Boolean(show.p);
        const point = () => (tail ? lane.arrows.v.root.position : lane.arrows.v.tip);
        const spots = tail ? (right ? SPOTS.vR : SPOTS.vL) : right ? SPOTS.pR : SPOTS.pL;
        if (!anno.has(`v-${id}`)) {
          anno.add(`v-${id}`, { text, point, kind: 'callout', color: COLOR.v, spots, avoid: avoidScene });
          added = true;
        } else anno.update(`v-${id}`, { text, point, spots });
      } else anno.remove(`v-${id}`);
      // p⃗ ahead of its arrow's head, or over the arrow at the screen's edge
      if (show?.p && before(lane)) {
        const point = () => (lane.edge ? arrowAtEdge(lane.arrows.p) : lane.arrows.p.tip);
        const spots = pSpots(lane, right);
        if (!anno.has(`p-${id}`)) {
          anno.add(`p-${id}`, { text: pText(lane), point, kind: 'callout', color: COLOR.pText, spots, avoid: avoidScene });
          added = true;
        } else anno.update(`p-${id}`, { text: pText(lane), point, spots });
      } else anno.remove(`p-${id}`);
    }
    for (const lane of Object.values(lanes)) {
      const id = `tag-${lane.id}`;
      const on = Boolean(lane.show?.tag && before(lane));
      if (added || !on) anno.remove(id);
      if (!on) continue;
      const b = bodyOf(lane, lane.cur.kind);
      const text = t(b.info.tag, { m: group(lane.cur.m) });
      // the middle of the body's near side, on the road, whichever way it faces
      const point = () => tmpTag[lane.id].set(lane.cur.x - (lane.cur.facing * b.info.len) / 2, 0, lane.z + b.info.half);
      const spots = besideSpots(lane, b.info.len, b.info.top);
      const optional = s.mode !== 'quiz';
      if (!anno.has(id)) anno.add(id, { text, point, kind: 'part', spots, avoid: avoidScene, optional });
      else anno.update(id, { text, point, spots, optional });
    }
    syncMoved();
    stage.invalidate();
  }

  /**
   * After the crash: the truck's car carries its shove on the dimension line ("প্রায় ২ m"); the bicycle's car says
   * how little it moved, beside itself.
   */
  const tmpMoved = { far: new THREE.Vector3(), near: new THREE.Vector3() };
  function syncMoved() {
    const done = s.scene === 'run' && s.phase === 'done';
    const line = done && moveMark.group.visible;
    if (line) {
      const text = t('lab_dim', { d: distance(s.plans.far.s2) });
      if (!anno.has('dim')) anno.add('dim', { text, point: () => moveMark.mid, kind: 'part', spots: SPOTS.dim, avoid: [() => sceneBoxes()] });
      else anno.update('dim', { text });
    } else anno.remove('dim');
    for (const lane of Object.values(lanes)) {
      const id = `moved-${lane.id}`;
      if (!done || (lane.id === 'far' && line)) {
        anno.remove(id);
        continue;
      }
      const d = s.plans[lane.id].s2;
      const text = t(about(d).less ? 'lab_moved_less' : 'lab_moved', { d: distance(d) });
      const point = () => lane.parked.root.localToWorld(tmpMoved[lane.id].set(CAR.length * 0.5, 0, s.dir * (CAR.width / 2)));
      const spots = besideSpots(lane, CAR.length, CAR.height);
      if (!anno.has(id)) anno.add(id, { text, point, kind: 'part', spots, avoid: avoidScene });
      else anno.update(id, { text, point, spots });
    }
  }

  // the p label switches to its edge form while the arrow's tip is off the screen
  stage.onBeforeRender(() => {
    for (const lane of Object.values(lanes)) {
      const a = lane.arrows.p;
      const edge = a.root.visible && offScreen(a.tip);
      if (edge === lane.edge) continue;
      lane.edge = edge;
      if (anno.has(`p-${lane.id}`)) {
        const right = (Math.sign(lane.cur?.v) || 1) > 0;
        anno.update(`p-${lane.id}`, { text: pText(lane), spots: pSpots(lane, right) });
      }
    }
  });

  // ── the run ─────────────────────────────────────────────────────────────────
  function setPhase(phase) {
    if (phase === s.phase) return;
    const was = s.phase;
    s.phase = phase;
    if (s.scene === 'run' && (phase === 'crash' || (phase === 'done' && was !== 'crash'))) {
      if (was === 'moving' || was === 'start') {
        if (s.playing) audio.contact();
        emit('crash', { speed: s.speed, dir: s.dir > 0 ? 'right' : 'left' });
      }
    }
    syncLabels();
    refresh();
    emitChange();
  }

  stage.addTicker(() => {
    if (s.scene !== 'run' || !s.plans) return false;
    if (!s.playing) return false;
    const time = runTime();
    placeRun(time);
    if (time >= s.tEnd) {
      s.playing = false;
      s.t = s.tEnd;
      setPhase('done');
      emit('rest', snapshot());
      return true;
    }
    setPhase(phaseAt(time));
    return true;
  });

  /** Show the run at `time` s, paused. */
  function showRunAt(time) {
    s.playing = false;
    s.t = THREE.MathUtils.clamp(time, 0, s.tEnd);
    placeRun(s.t);
    setPhase(phaseAt(s.t));
    syncLabels();
    refresh();
  }

  /** Play from where it is (from the start again if it is over). */
  function play({ quiet = false } = {}) {
    if (s.locked && !quiet) return lockedNudge();
    if (!quiet && now() - lastPlay < DOUBLE_TAP) return;
    lastPlay = now();
    if (s.playing) return;
    if (s.phase === 'done') showRunAt(0);
    s.t0 = now() - s.t * 1000;
    s.playing = true;
    audio.unlock();
    if (!quiet) {
      coach?.objectUsed();
    }
    emit('play', { speed: s.speed, dir: s.dir > 0 ? 'right' : 'left' });
    refresh();
    emitChange();
    stage.invalidate();
  }

  /** A new velocity or direction: back to the start of the new run (paused). */
  function setRun({ speed = s.speed, dir = s.dir } = {}) {
    s.speed = clampSpeed(speed);
    s.dir = dir < 0 ? -1 : 1;
    makePlans();
    s.userMovedCamera = s.view === '3d' ? s.userMovedCamera : false;
    showRunAt(0);
    if (s.view === '3d' && !s.userMovedCamera) flyTo(viewPose('3d'), 0.6, FOV['3d']);
    emitChange();
  }

  function changeSpeed(delta) {
    if (s.locked) return lockedNudge();
    const next = clampSpeed(s.speed + delta);
    if (next === s.speed) return;
    audio.tick();
    setRun({ speed: next });
  }
  function flip() {
    if (s.locked) return lockedNudge();
    audio.tick();
    setRun({ dir: -s.dir });
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  /** The kinds of body a lane shows in the front view's framing. */
  const kindsIn = (id) => (s.scene === 'run' ? [id === 'far' ? 'truck' : 'bike'] : [lanes[id].cur?.kind].filter(Boolean));
  /**
   * The strip of screen heights the front view must show for these lanes: up to the label over the highest arrow
   * (the top margin), down to room under the lowest body for its mass tag or result.
   */
  function uRange(ids) {
    let uMin = Infinity;
    let uMax = -Infinity;
    for (const id of ids) {
      const z = LANES[id];
      for (const k of kindsIn(id)) {
        const b = BODY[k];
        const half = s.scene === 'run' ? Math.max(b.half, CAR.width / 2) : b.half;
        uMax = Math.max(uMax, screenU(b.vy + 0.25, z, ELEV));
        uMin = Math.min(uMin, screenU(0, z + half + 0.2, ELEV));
      }
    }
    return { uMin, uMax };
  }
  function thickness(k) {
    for (const lane of Object.values(lanes)) for (const a of Object.values(lane.arrows)) a.thicken(k);
  }
  function computeFit() {
    const ids = s.scene === 'run' ? LANE_IDS : s.frame?.lanes || LANE_IDS;
    const { uMin, uMax } = uRange(ids);
    const minSpan = s.scene === 'run' ? W_MIN : Math.max(7, (s.frame?.x1 ?? 4) - (s.frame?.x0 ?? -4));
    // room for the corner buttons and the labels over the top arrow (always), and for the labels under the lowest
    // body (less in a short view, so the scene is not too small: there they go beside it)
    const h = stage.height;
    const margin = { top: 64, bottom: Math.min(38, 0.14 * h), side: 8 };
    s.fit = frontFit({ camera, width: stage.width, height: h, uMin, uMax, minSpan, margin });
    fitShadow(s.fit.span);
    // the arrows keep at least about 4 px of thickness on a small view (thicker, never longer)
    const pxm = h / (2 * s.fit.d * Math.tan(THREE.MathUtils.degToRad(FOV.front) / 2));
    thickness(s.view === 'front' ? THREE.MathUtils.clamp(4.4 / (pxm * 2 * ARROW.r), 1, 2.2) : 1);
    // the long lens is not quite flat: a lane further back looks a little smaller, so its arrows are drawn longer by
    // as much (and the near lane's shorter), and equal vectors are equally long on the screen
    const n = { y: Math.sin(ELEV), z: Math.cos(ELEV) };
    const T = { y: s.fit.uc * Math.cos(ELEV), z: -s.fit.uc * Math.sin(ELEV) };
    for (const id of LANE_IDS) {
      const k = kindsIn(id)[0];
      const y = k ? (BODY[k].py + BODY[k].vy) / 2 : 2;
      const along = (y - T.y) * n.y + (LANES[id] - T.z) * n.z;
      lanes[id].persp = s.view === 'front' ? (s.fit.d - along) / s.fit.d : 1;
      if (lanes[id].cur) applyLane(lanes[id]);
    }
    return s.fit;
  }
  /**
   * The x the front view centres on. In the run the camera stands still until the impact, with the parked cars in
   * view (and the truck's back, if it fits): the student sees both vehicles drive up to the cars. After the impact it
   * moves along just far enough to keep the shoved car in view.
   */
  function frontX(time = runTime()) {
    if (s.scene !== 'run') return ((s.frame?.x0 ?? -4) + (s.frame?.x1 ?? 4)) / 2;
    const W = s.fit.span;
    const pf = s.plans.far;
    const left = -GAP - TRUCK.length - 0.6; // the truck's back at the start
    const right = CAR.length + 0.7; // the parked cars' far end
    const end = pf.s2 + CAR.length + 0.9; // the shoved car's front, at rest
    if (W >= end - left) return sx((left + end) / 2); // all of it fits: the camera never moves
    const start = W >= right - left ? left + W / 2 : right - W / 2;
    const stop = Math.max(start, Math.min(end - W / 2, W / 2 - 1)); // keeps the bicycle's car in view too
    const k = THREE.MathUtils.smoothstep(time - pf.tHit, 0, Math.max(0.6, pf.tSplit - pf.tHit + pf.t2 + 0.2));
    return sx(start + (stop - start) * k);
  }
  function frontView() {
    if (!s.fit) computeFit();
    return frontPose(s.fit, frontX(), ELEV);
  }
  function placeFront() {
    const { position, target } = frontView();
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
    placeSun(target.x);
    stage.invalidate();
  }
  function viewPose(view) {
    if (view === 'front') return frontView();
    const centre = new THREE.Vector3(sx(-3), 1.2, 0);
    return spherePose({
      camera: { fov: FOV['3d'] },
      width: stage.width,
      height: stage.height,
      centre,
      radius: 8.5, // the whole run, from the vehicles at the start to the shoved car
      dir: new THREE.Vector3(s.dir * 0.55, 0.42, 0.72),
    });
  }
  function flyTo({ position, target }, duration = 0.8, fov = FOV[s.view]) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const f0 = camera.fov;
    const apply = (k) => {
      camera.position.lerpVectors(p0, position, k);
      controls.target.lerpVectors(t0, target, k);
      // the field of view changes in step with the distance, so the scene keeps its size on the way
      camera.fov = f0 + (fov - f0) * k;
      camera.updateProjectionMatrix();
      controls.update();
      placeSun(controls.target.x);
      stage.invalidate();
    };
    if (!duration) {
      apply(1);
      return Promise.resolve(true);
    }
    return tweener.animate({ key: 'camera', duration, ease: ease.inOutCubic, onUpdate: apply }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    controls.enableZoom = s.view === '3d';
    controls.maxDistance = 2000; // the 3D view's own limit comes once the camera is there
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    if (s.view === 'front') {
      camera.fov = FOV.front;
      camera.updateProjectionMatrix();
      computeFit();
    } else
      for (const lane of Object.values(lanes)) {
        lane.persp = 1; // turning round, the arrows are drawn at their true lengths
        if (lane.cur) applyLane(lane);
      }
    if (s.view === '3d') thickness(1);
    showSky(s.view === '3d');
    const pose = viewPose(s.view);
    return flyTo(pose, animate ? 0.8 : 0, FOV[s.view]).then((done) => {
      if (s.view === '3d') controls.maxDistance = 70;
      return done;
    });
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (s.view === 'front') {
      computeFit();
      if (!tweener.busy) placeFront();
    } else if (!s.userMovedCamera && !tweener.busy) flyTo(viewPose('3d'), 0, FOV['3d']);
    // then the labels: spots beside a body depend on its size on the screen, the edge label's lines and the short
    // labels on the view's size
    for (const lane of Object.values(lanes)) lane.edge = false;
    syncLabels();
  });

  // ── touching the scene: a tap on the truck or the bicycle plays the run ────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** The lane whose body is under a canvas point, or null. */
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = [];
    for (const lane of Object.values(lanes)) for (const b of Object.values(lane.bodies)) if (b.wrap.visible) hits.push(b.model.hit);
    const hit = raycaster.intersectObjects(hits, false)[0];
    if (!hit) return null;
    for (const lane of Object.values(lanes)) for (const b of Object.values(lane.bodies)) if (b.model.hit === hit.object) return lane.id;
    return null;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const lane = pick(canvasPoint(e));
      if (!lane) return; // the camera controls take it (rotating in the 3D view)
      e.stopPropagation();
      e.preventDefault();
      if (s.mode === 'quiz') return lockedNudge();
      play();
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
      ui.canvasHost.style.cursor = pick(p) ? (s.mode === 'quiz' ? 'not-allowed' : 'pointer') : '';
    });
  });

  /**
   * A tap or key that would change the test's picture: a buzz, and while the question is open its line under the
   * choices says why (as conservation-of-momentum does). Nothing is written over the scene and its labels; once
   * answered, that line keeps the worked answer.
   */
  function lockedNudge() {
    audio.error();
    if (s.mode !== 'quiz' || quiz.revealed) return;
    const fb = $('.pvc-q-feedback');
    fb.textContent = t('q_locked');
    fb.dataset.tone = '';
  }

  // ── a test question's picture ───────────────────────────────────────────────
  /**
   * A still picture: each lane { kind, v (signed), x (front), p (show the momentum), speedOnly } or null; the
   * camera frames x0…x1 of those lanes.
   */
  function still(cfg, frame) {
    s.scene = 'still';
    s.playing = false;
    moveMark.hide();
    for (const lane of Object.values(lanes)) {
      const q = cfg[lane.id];
      placeParked(lane, null);
      if (!q) {
        lane.cur = null;
        lane.show = null;
      } else {
        lane.cur = { kind: q.kind, m: MASS[q.kind], v: q.v, x: q.x, facing: Math.sign(q.v), roll: q.x * Math.sign(q.v) };
        lane.show = { v: true, p: Boolean(q.p), tag: true, speedOnly: Boolean(q.speedOnly) };
      }
      applyLane(lane);
    }
    s.frame = frame;
    syncLabels();
  }
  /** Frame the picture (the test's or the run's) in the front view; resolves when the camera is there. */
  function frameNow({ animate = true } = {}) {
    s.view = 'front';
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.maxDistance = 2000;
    s.userMovedCamera = false;
    syncUI();
    camera.fov = FOV.front;
    camera.updateProjectionMatrix();
    computeFit();
    showSky(false);
    return flyTo(frontView(), animate ? 0.6 : 0, FOV.front);
  }
  /** The x-range a still body and its arrows (at speed v, or `vMax` after an answer) need. */
  function spanOf(q, vMax = q.v) {
    const b = BODY[q.kind];
    const f = Math.sign(q.v);
    const mid = q.x - (f * b.len) / 2;
    // a p arrow longer than this runs off the screen anyway (its label then sits at the edge)
    const p = Math.abs(momentum(MASS[q.kind], vMax)) * SCALE.p;
    const reach = Math.max(Math.abs(vMax) * SCALE.v, p <= 5 ? p : 0);
    const ends = [q.x - f * b.len, q.x, mid + f * (reach + 2.4)];
    return [Math.min(...ends) - 0.6, Math.max(...ends) + 0.6];
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
  const numLabel = (c) => `${F(c.value)}<small>${t('u_p')}</small>`;
  const wordLabel = (text) => `<span class="mo-opt">${text}</span>`;

  // each kind's numbers are its own, so no question's picture or answer gives away another's
  const VARIANTS = {
    damage: [3, 6],
    calc: [
      { kind: 'truck', v: 2 },
      { kind: 'car', v: 5 },
      { kind: 'runner', v: 5 },
      { kind: 'bike', v: 7 },
    ],
    double: [
      { kind: 'bike', v: 2 },
      { kind: 'bike', v: 4 },
    ],
    sign: [
      { kind: 'car', v: 4 },
      { kind: 'truck', v: 4 },
      { kind: 'runner', v: 6 },
    ],
    compare: [
      [
        { kind: 'car', v: 1 },
        { kind: 'runner', v: 4 },
      ],
      [
        { kind: 'runner', v: 4.5 },
        { kind: 'bike', v: 3 },
      ],
      [
        { kind: 'car', v: 0.4 },
        { kind: 'bike', v: 5 },
      ],
    ],
  };
  let kinds = [];
  let question = null;
  let qToken = 0;

  async function prepare(i, alive) {
    const kind = kinds[i % kinds.length];
    const my = ++qToken;
    s.locked = true;
    const ok = () => alive() && my === qToken;
    if (kind === 'damage') {
      const u = pickOne(VARIANTS.damage);
      s.scene = 'run';
      s.speed = u;
      s.dir = 1;
      makePlans();
      lanes.far.show = { v: true, p: false, tag: true };
      lanes.near.show = { v: true, p: false, tag: true };
      showRunAt(0);
      await frameNow();
      if (!ok()) return null;
      const list = shuffle([
        { text: t('ch_damage_right'), mistake: null },
        { text: t('ch_damage_same'), mistake: 'mis_damage_same' },
        { text: t('ch_damage_heavy'), mistake: 'mis_damage_heavy' },
        { text: t('ch_damage_only'), mistake: 'mis_damage_only' },
      ]);
      question = { kind, u, list };
      return {
        text: t('q_damage'),
        choices: [0, 1, 2, 3],
        expected: list.findIndex((c) => !c.mistake),
        tolerance: 0.5,
        label: (j) => wordLabel(list[j].text),
        meta: { kind, speed: u },
      };
    }
    if (kind === 'calc' || kind === 'double' || kind === 'sign') {
      const q = pickOne(VARIANTS[kind]);
      const v = kind === 'sign' ? -q.v : q.v;
      const x = kind === 'sign' ? -1.2 : 1.6;
      const body = { kind: q.kind, v, x, p: kind === 'double', speedOnly: kind === 'sign' };
      const [x0, x1] = spanOf(body, kind === 'double' ? 2 * v : v);
      still({ far: body, near: null }, { lanes: ['far'], x0, x1 });
      await frameNow();
      if (!ok()) return null;
      const m = MASS[q.kind];
      const raw = kind === 'calc' ? calcChoices(m, v) : kind === 'double' ? doubleChoices(m * v) : signChoices(m, q.v);
      const list = shuffle(raw.slice());
      question = { kind, body, m, v, list };
      const text = kind === 'double' ? t('q_double') : t(`q_${kind}_${q.kind}`);
      return {
        text,
        choices: [0, 1, 2, 3],
        expected: list.findIndex((c) => !c.mistake),
        tolerance: 0.5,
        label: (j) => numLabel(list[j]),
        meta: { kind, body: q.kind, v, m },
      };
    }
    // compare: two bodies, the momentum hidden
    const [a, b] = pickOne(VARIANTS.compare);
    const qa = { kind: a.kind, v: a.v, x: 2.2, p: false };
    const qb = { kind: b.kind, v: b.v, x: 2.2, p: false };
    const sa = spanOf(qa);
    const sb = spanOf(qb);
    still({ far: qa, near: qb }, { lanes: LANE_IDS, x0: Math.min(sa[0], sb[0]), x1: Math.max(sa[1], sb[1]) });
    await frameNow();
    if (!ok()) return null;
    const res = compare({ m: MASS[a.kind], v: a.v }, { m: MASS[b.kind], v: b.v });
    const faster = a.v > b.v ? 'a' : 'b';
    const heavier = MASS[a.kind] > MASS[b.kind] ? 'a' : 'b';
    const note = (w) => (w === faster ? 'mis_faster' : w === heavier ? 'mis_heavier' : 'mis_not_equal');
    const list = shuffle([
      { text: t(BODY[a.kind].who), id: 'a', mistake: res === 'a' ? null : note('a') },
      { text: t(BODY[b.kind].who), id: 'b', mistake: res === 'b' ? null : note('b') },
      { text: t('ch_equal'), id: 'equal', mistake: res === 'equal' ? null : 'mis_not_equal' },
      { text: t('ch_cannot'), id: 'cannot', mistake: 'mis_cannot' },
    ]);
    question = { kind: 'compare', a, b, res, list };
    return {
      text: t('q_compare'),
      choices: [0, 1, 2, 3],
      expected: list.findIndex((c) => !c.mistake),
      tolerance: 0.5,
      label: (j) => wordLabel(list[j].text),
      meta: { kind: 'compare', a, b },
    };
  }

  function reveal(_q, correct, picked) {
    const q = question;
    const my = qToken;
    const mistake = correct ? null : q.list[picked.index]?.mistake;
    const key = !mistake
      ? ''
      : mistake.startsWith('mis_')
        ? mistake
        : q.kind === 'calc' && mistake === 'square'
          ? 'mis_calc_square'
          : `mis_${mistake}`;
    const wrong = key ? t(key, { pb: q.u ? group(MASS.bike * q.u) : '', r: ratio, one: 1 }) : '';
    if (q.kind === 'damage') {
      // the answer plays the crash, with the momentum shown
      lanes.far.show.p = true;
      lanes.near.show.p = true;
      showRunAt(0);
      play({ quiet: true });
      return t('why_damage', { v: q.u, r: ratio, pt: group(MASS.truck * q.u), pb: group(MASS.bike * q.u) }) + wrong;
    }
    if (q.kind === 'compare') {
      for (const lane of Object.values(lanes)) lane.show.p = true;
      for (const lane of Object.values(lanes)) applyLane(lane);
      syncLabels();
      const w = q.list.find((c) => !c.mistake).text;
      return (
        t('why_compare', {
          w,
          na: t(BODY[q.a.kind].name),
          ma: group(MASS[q.a.kind]),
          va: plain(q.a.v),
          pa: fmt(MASS[q.a.kind] * q.a.v),
          nb: t(BODY[q.b.kind].name),
          mb: group(MASS[q.b.kind]),
          vb: plain(q.b.v),
          pb: fmt(MASS[q.b.kind] * q.b.v),
        }) + wrong
      );
    }
    const lane = lanes.far;
    if (q.kind === 'double') {
      // the bicycle speeds up to twice the velocity: both arrows grow to twice their length
      const v0 = q.v;
      tweener.animate({
        key: 'double',
        duration: 1.1,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== qToken || !lane.cur) return;
          lane.cur.v = v0 * (1 + k);
          applyLane(lane);
          anno.setText('v-far', t('lab_v', { v: plain(Math.round(lane.cur.v * 10) / 10) }));
          if (!lane.edge) anno.setText('p-far', pText(lane));
          stage.invalidate();
        },
      });
      return t('why_double', { p2: fmt(2 * q.m * q.v), m: group(q.m), v2: plain(2 * q.v) }) + wrong;
    }
    lane.show.p = true;
    applyLane(lane);
    syncLabels();
    if (q.kind === 'calc') return t('why_calc', { p: fmt(q.m * q.v), m: group(q.m), v: plain(q.v) }) + wrong;
    return t('why_sign', { p: fmt(q.m * q.v), m: group(q.m), v: plain(q.v) }) + wrong;
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 2, feedback: 3 },
    hooks: {
      enter() {
        s.learn = { speed: s.speed, dir: s.dir };
        s.mode = 'quiz';
        // a run still going stops where it is (and says so) until the first question sets its own picture
        if (s.playing) {
          s.t = runTime();
          s.playing = false;
        }
        // the five kinds in a new order each time
        kinds = shuffle(['damage', 'calc', 'compare', 'double', 'sign']);
        syncUI();
      },
      leave() {
        qToken++;
        tweener.cancel('double');
        s.mode = 'explore';
        s.locked = false;
        const back = s.learn || { speed: s.speed, dir: s.dir };
        s.learn = null;
        s.scene = 'run';
        s.speed = back.speed;
        s.dir = back.dir;
        lanes.far.show = { v: true, p: true, tag: true };
        lanes.near.show = { v: true, p: true, tag: true };
        makePlans();
        showRunAt(0);
        syncUI();
        frameNow();
        emitChange();
      },
      prepare,
      reveal,
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on the truck ─────────────────────────────────────────
  let coach = null;
  if (o.coach) {
    const v = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_tap',
        candidates: () => {
          const b = lanes.far.bodies.truck;
          if (!b?.wrap.visible) return [];
          const out = [];
          // the cargo body first: its words then fall in the empty middle lane, clear of the bicycle's labels
          for (const [x, y] of [
            [-4.6, 1.5],
            [-3.2, 1.5],
            [-1.0, 1.7],
          ]) {
            v.set(x, y, TRUCK.width / 2).applyMatrix4(b.wrap.matrixWorld);
            out.push(toScreen(v));
          }
          return out;
        },
        grabbable: (p) => pick(p) === 'far',
        demo: async () => {},
        cancel: () => {},
        labelAt: ['below', 'above', 'left', 'right'],
        labelAvoid: () => ['p-far', 'v-far', 'p-near', 'v-near', 'tag-far', 'tag-near'].map((id) => anno.box(id)).filter(Boolean),
        inset: { bottom: 16 },
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
    if (b.dataset.view) {
      if (s.locked && b.dataset.view !== s.view) return lockedNudge();
      setView(b.dataset.view);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'play':
        if (e.detail === 0) play(); // the keyboard; a finger or the mouse acted on pointerdown
        break;
      case 'slower':
        changeSpeed(-1);
        break;
      case 'faster':
        changeSpeed(1);
        break;
      case 'flip':
        flip();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // the panel's play button acts as it goes down
  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !(/** @type {Element} */ (e.target).closest('[data-act="play"]'))) return;
    audio.unlock();
    play();
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (
      s.mode === 'quiz' &&
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', ' ', 'Enter', 'r', 'R'].includes(k) &&
      !target.closest('button')
    ) {
      lockedNudge();
      e.preventDefault();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !target.closest('button')) play();
    else if (k === 'ArrowUp' || k === '+' || k === '=') changeSpeed(1);
    else if (k === 'ArrowDown' || k === '-') changeSpeed(-1);
    else if (k === 'ArrowLeft' && s.dir > 0) flip();
    else if (k === 'ArrowRight' && s.dir < 0) flip();
    else if (k === 'r' || k === 'R') setRun();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  lanes.far.show = { v: true, p: true, tag: true };
  lanes.near.show = { v: true, p: true, tag: true };
  makePlans();
  computeFit();
  showRunAt(o.at != null && o.at !== '' && Number.isFinite(Number(o.at)) ? Number(o.at) : 0);
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start(1200);
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
     * Change any of: speed (m/s, 1…8, the same for both), dir ('right' | 'left'), at (s into the run, shown
     * paused; past the end shows the result), play (true plays from where it is), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (s.mode === 'quiz') quiz.stop();
      if (p.speed != null || p.dir != null)
        setRun({ speed: p.speed ?? s.speed, dir: p.dir == null ? s.dir : p.dir === 'left' || p.dir === -1 ? -1 : 1 });
      if (p.at != null) showRunAt(Number(p.at) || 0);
      if (p.view) await setView(p.view, { animate });
      if (p.play) play({ quiet: true });
      return snapshot();
    },
    async reset() {
      quiz.stop();
      setRun({ speed: SPEED.start, dir: 1 });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world, // the truck, the bicycle and rider, the two small cars (no street, no arrows)
  };
}
