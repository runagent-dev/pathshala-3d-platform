// Speed and velocity (book pages 40–41, topic 2.5), student view: the book's own example, one guided ride. A cycle
// goes from A to B along the winding road of চিত্র ২.০৪ (4 km of road, a সরণ of 2 km) in 20 minutes:
//   ১ the cyclist waits at A; "সাইকেল চালাও" rides the road (shown faster than real): the road behind fills blue
//     (দূরত্ব), the panel counts the distance and the time, and an outlined arrow on the cycle shows the direction of
//     its বেগ, turning with the road while the speed stays the same;
//   ২ at B, "সরণ দেখাও" draws the straight সরণ arrow A→B (orange), with its length and direction;
//   ৩ "তুলনা করো": গড় দ্রুতি = মোট অতিক্রান্ত দূরত্ব ÷ মোট সময় = 12 km/h (no direction) beside গড় বেগ = সরণ ÷ সময় =
//     6 km/h towards the north-east, and the point: a winding path has a velocity too;
// then "আবার দেখো". The chip "সোজা পথ" does the same ride on a straight road from A to the same B: দূরত্ব = সরণ, so
// গড় দ্রুতি = গড় বেগের মান. Then a short test (tap answers). The ride's maths is in ride.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener } from '@shared/tween.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { ICONS } from '@shared/student/icons.js';
import { createArrow } from './arrow.js';
import { createCyclist } from './cyclist.js';
import { createI18n } from './i18n.js';
import { B, DISPLACEMENT, MINUTES, PATHS, averages, fixed, headingOn, lengthOf, pointOn, rideAt, short } from './ride.js';
import { KM, ROAD_Y, createScene, toScene } from './scene.js';

export const DEFAULTS = {
  path: 'winding', // 'winding' (the book's road) | 'straight' (the same A and B, a straight road)
  step: 'start', // 'start' | 'displacement' (at B, the সরণ arrow drawn) | 'compare' (the two sums)
  time: 0, // minutes of the ride shown when the figure opens (0–20; 20 is at B)
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per quantity, as in distance-displacement: দূরত্ব blue, সরণ orange; the বেগ arrow violet
const COLORS = { distance: '#1c6fd9', displacement: '#e8590c', velocity: '#7048e8', ink: '#3a3f47' };
const RIDE_SCREEN = 8; // s on screen for the 20 minutes
const FAST = (MINUTES * 60) / RIDE_SCREEN; // how many times faster than real (150)
const CYCLE = 300; // the cycle is drawn this many times bigger than real (see NOTES)
const VEL_LEN = 460; // m: the বেগ arrow (the same length all the ride: the speed does not change)
const STEPS = ['start', 'ride', 'end', 'displacement', 'compare'];
// the starting view: a gentle three-quarter view from the south-south-west, looking down at about 34°
const VIEW = (() => {
  const az = THREE.MathUtils.degToRad(-22);
  const el = THREE.MathUtils.degToRad(34);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
})();

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'sv');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learnAlign: 'start',
    learn: cleanSheet(t, {
      examples: {
        label: 'path',
        items: [
          { id: 'winding', label: 'path_winding' },
          { id: 'straight', label: 'path_straight' },
        ],
      },
      quiet: [{ act: 'reset', label: 'reset', icon: ICONS.reset }],
      lines: { action: 1 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 50, far: 40000, environment: 'studio-light', exposure: 1.05 });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false; // the framing is worked out for every size; a pinch would break it
  controls.maxPolarAngle = 1.25;
  controls.minPolarAngle = 0.15;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const solid = o.bg !== 'transparent';

  const world = new THREE.Group(); // what a GLB export holds
  world.name = 'SpeedVelocity';
  scene.add(world);
  const setting = createScene({ renderer: stage.renderer, colors: COLORS, background: solid });
  world.add(setting.root);
  if (setting.sky) {
    scene.background = setting.sky;
    scene.fog = new THREE.Fog('#e9dcc2', 9000, 22000);
  }
  const cyclist = createCyclist({ scale: CYCLE });
  world.add(cyclist.root);
  const velArrow = createArrow({ color: COLORS.velocity, radius: 22, head: 150, headRadius: 62, name: 'Velocity' });
  // where the বেগ arrow pointed, left behind every kilometre while riding (fainter), so the turning stays in sight
  const MARKS = [0.5, 1.5, 2.5, 3.5];
  const marks = MARKS.map((_k, i) =>
    createArrow({ color: COLORS.velocity, radius: 16, head: 115, headRadius: 46, opacity: 0.72, name: `VelocityEarlier${i + 1}` }),
  );
  for (const m of marks) {
    m.root.visible = false;
    world.add(m.root);
  }
  const dispArrow = createArrow({ color: COLORS.displacement, radius: 17, head: 150, headRadius: 50, name: 'Displacement' });
  world.add(velArrow.root, dispArrow.root);
  // the বেগ arrow is drawn over the rider (when the cycle rides away from us, the rider would hide it): its outline
  // first, then the arrow
  velArrow.root.traverse((m) => {
    if (!(m instanceof THREE.Mesh)) return;
    m.material.depthTest = false;
    m.renderOrder = m.name.includes('Outline') ? 10 : 11;
  });

  // one sun; the cycle and the two posts cast shadows onto the ground
  const sun = new THREE.DirectionalLight('#ffffff', 1.5);
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#ffffff', '#8a7a5a', 0.85));
  if (o.shadow && solid) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 1.5;
  } else world.traverse((m) => (m.castShadow = false));
  {
    // the shadow box round the ride (A to B, both roads, up to the rider's head)
    const mid = toScene(0.95, 0.45);
    sun.target.position.copy(mid);
    sun.position.copy(mid).add(new THREE.Vector3(-1500, 4000, 1800));
    Object.assign(sun.shadow.camera, { left: -1700, right: 1700, top: 1700, bottom: -1700, near: 1000, far: 8000 });
    sun.shadow.camera.updateProjectionMatrix();
  }

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null; // the kit's action (made below, once the scene and the panel exist)
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const clampTime = (m) => Math.min(Math.max(Number(m) || 0, 0), MINUTES);
  const s = {
    path: PATHS.includes(o.path) ? o.path : 'winding',
    time: clampTime(o.time),
    running: false,
    shown: 0, // at B: 0 nothing more, 1 the সরণ arrow, 2 the two sums
    grow: 0, // how much of the সরণ arrow is drawn (0…1)
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    labels: true, // the 3D labels for the distance and the displacement (off in some test questions)
  };
  if (o.step === 'displacement' || o.step === 'compare') {
    s.time = MINUTES;
    s.shown = o.step === 'compare' ? 2 : 1;
    s.grow = 1;
  }
  const atB = () => s.time >= MINUTES - 1e-9;
  /** start (at A) | ride (on the way, or paused) | end (at B) | displacement | compare */
  function phase() {
    if (s.running || (s.time > 0 && !atB())) return 'ride';
    if (s.time <= 0) return 'start';
    return STEPS[2 + s.shown];
  }
  const snapshot = () => {
    const r = rideAt(s.path, s.time);
    const end = atB();
    const avg = averages(s.path);
    return {
      path: s.path,
      step: phase(),
      time: r.time,
      running: s.running,
      distance: r.km,
      displacement: Math.hypot(r.x, r.y),
      direction: r.dir, // of the velocity at this moment (null when standing)
      speed: end ? avg.speed : null, // গড় দ্রুতি, km/h, once at B
      velocity: end ? avg.velocity : null, // গড় বেগের মান, km/h
      velocityDirection: end ? avg.dir : null,
      mode: s.mode,
    };
  };

  // ── the cyclist, the arrows, the trail ──────────────────────────────────────
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const head = { x: 0, y: 1 };
  const A0 = new THREE.Vector3(0, ROAD_Y + 30, 0);
  const B0 = toScene(B.x, B.y, ROAD_Y + 30);
  const dispDir = B0.clone().sub(A0).normalize();
  function place() {
    const r = rideAt(s.path, s.time);
    headingOn(s.path, r.km, head);
    toScene(r.x, r.y, ROAD_Y, cyclist.root.position);
    fwd.set(head.x, 0, -head.y);
    cyclist.root.rotation.y = Math.atan2(fwd.x, fwd.z);
    cyclist.roll(r.km * KM);
    for (const p of PATHS) setting.trails[p].show(p === s.path ? r.km : 0);
    setting.straight.visible = s.path === 'straight';
    setting.winding.visible = s.path !== 'straight'; // one road at a time: the same A and B
    // the বেগ arrow: only while the cycle moves (standing at A or at B it has no velocity)
    const moving = r.time > 0 && !atB();
    if (moving) {
      tmp
        .copy(cyclist.root.position)
        .addScaledVector(fwd, 190)
        .setY(ROAD_Y + 70);
      velArrow.set(tmp, fwd, VEL_LEN);
    } else velArrow.root.visible = false;
    // the earlier directions, on the winding road only (on the straight road they would all be the same arrow)
    const len0 = lengthOf(s.path);
    marks.forEach((m, i) => {
      const km = (MARKS[i] / 4) * len0;
      const show = moving && s.path === 'winding' && r.km > km + 0.45;
      if (!show) {
        m.root.visible = false;
        return;
      }
      const p = pointOn(s.path, km);
      const h = headingOn(s.path, km);
      tmp2.set(h.x, 0, -h.y);
      toScene(p.x, p.y, ROAD_Y + 90, tmp).addScaledVector(tmp2, -170);
      m.set(tmp, tmp2, 340);
    });
    // the সরণ arrow, drawn from A to B
    const len = B0.distanceTo(A0) * s.grow;
    if (s.shown > 0 && len > 1) dispArrow.set(A0, dispDir, len);
    else dispArrow.root.visible = false;
    stage.renderer.shadowMap.needsUpdate = true;
    stage.invalidate();
  }

  const riderAt = new THREE.Vector3();
  const riderPoint = () => riderAt.copy(cyclist.root.position).setY(ROAD_Y + 260);

  // ── labels: short, on the view; sentences go in the panel ───────────────────
  const annotations = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox?.()] });
  const P = {
    A: () => setting.points.A,
    B: () => setting.points.B,
    north: () => setting.points.north,
    vel: () => velArrow.root.position.clone().addScaledVector(fwd, VEL_LEN),
    disp: () => A0.clone().lerp(B0, 0.55),
    dist: () => {
      const p = pointOn(s.path, lengthOf(s.path) * (s.path === 'straight' ? 0.3 : 0.62));
      return toScene(p.x, p.y, ROAD_Y + 10);
    },
  };
  const AROUND = [
    { dx: 18, dy: -18 },
    { dx: -18, dy: -18 },
    { dx: 18, dy: 20 },
    { dx: -18, dy: 20 },
    { dx: 30, dy: 0 },
    { dx: -30, dy: 0 },
    { dx: 0, dy: -30 },
    { dx: 0, dy: 30 },
  ];
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  // the cycle and its rider on the screen: no label sits on them
  const pc = new THREE.Vector3();
  function riderBox() {
    pa.copy(cyclist.root.position).project(camera);
    pc.copy(cyclist.root.position)
      .setY(ROAD_Y + 560)
      .project(camera);
    const X = (v) => (v.x * 0.5 + 0.5) * stage.width;
    const Y = (v) => (-v.y * 0.5 + 0.5) * stage.height;
    const w = Math.abs(Y(pa) - Y(pc)) * 0.75; // a cycle seen from the side is about as long as the rider is tall
    return { left: X(pa) - w, right: X(pa) + w, top: Math.min(Y(pa), Y(pc)) - 4, bottom: Math.max(Y(pa), Y(pc)) + 8 };
  }
  // the বেগ arrow on the screen (its label goes beside it, never on it)
  function velBox() {
    if (!velArrow.root.visible) return null;
    pa.copy(velArrow.root.position).project(camera);
    pb.copy(velArrow.root.position).addScaledVector(fwd, VEL_LEN).project(camera);
    const X = (v) => (v.x * 0.5 + 0.5) * stage.width;
    const Y = (v) => (-v.y * 0.5 + 0.5) * stage.height;
    return {
      left: Math.min(X(pa), X(pb)) - 8,
      right: Math.max(X(pa), X(pb)) + 8,
      top: Math.min(Y(pa), Y(pb)) - 8,
      bottom: Math.max(Y(pa), Y(pb)) + 8,
    };
  }
  annotations.add('A', {
    text: t('lbl_A'),
    point: P.A,
    spots: [
      { dx: -16, dy: -10 },
      { dx: -16, dy: 14 },
      { dx: 0, dy: -18 },
    ],
    avoid: [riderBox],
    kind: 'part',
  });
  annotations.add('B', {
    text: t('lbl_B'),
    point: P.B,
    spots: [
      { dx: -18, dy: -6 },
      { dx: -18, dy: 14 },
      { dx: 0, dy: -18 },
      { dx: 18, dy: 16 },
    ],
    avoid: [riderBox],
    kind: 'part',
  });
  annotations.add('north', {
    text: t('lbl_north'),
    point: P.north,
    spots: [
      { dx: 0, dy: -14 },
      { dx: -18, dy: -10 },
      { dx: 18, dy: -10 },
    ],
    avoid: [riderBox],
    kind: 'callout',
    color: COLORS.ink,
  });
  const labelsShown = {};
  function label(id, want, make) {
    if (!want) {
      if (labelsShown[id]) annotations.remove(id);
      labelsShown[id] = '';
      return;
    }
    const spec = make();
    if (labelsShown[id] === spec.text) return;
    if (labelsShown[id]) annotations.setText(id, spec.text);
    else annotations.add(id, spec);
    labelsShown[id] = spec.text;
  }
  function labels() {
    const r = rideAt(s.path, s.time);
    const moving = r.time > 0 && !atB();
    label('vel', moving, () => ({
      text: t('lbl_velocity'),
      point: P.vel,
      spots: AROUND,
      avoid: [velBox, riderBox],
      kind: 'callout',
      color: COLORS.velocity,
    }));
    label('disp', s.shown > 0 && s.grow >= 1 && s.labels, () => ({
      text: t('lbl_disp', { d: short(DISPLACEMENT.km) }),
      point: P.disp,
      spots: [
        { dx: -18, dy: -18 },
        { dx: 18, dy: 20 },
        { dx: -18, dy: 20 },
        { dx: 18, dy: -18 },
      ],
      avoid: [riderBox],
      kind: 'callout',
      color: COLORS.displacement,
    }));
    label('dist', atB() && s.labels, () => ({
      text: t('lbl_dist', { d: short(lengthOf(s.path)) }),
      point: P.dist,
      spots:
        s.path === 'straight'
          ? [
              { dx: 18, dy: 22 },
              { dx: -18, dy: 22 },
            ]
          : [
              { dx: 20, dy: -12 },
              { dx: 20, dy: 16 },
              { dx: -20, dy: -14 },
            ],
      avoid: [riderBox],
      kind: 'callout',
      color: COLORS.distance,
    }));
  }

  // ── the panel: one action, one result, one rule ─────────────────────────────
  const outcomeEl = ui.$('.pvc-outcome');
  function refresh() {
    const r = rideAt(s.path, s.time);
    const avg = averages(s.path);
    const ph = phase();
    const dirWord = (d) => (d ? t(`dir_${d}`) : '–');
    sheet.choose(s.path);
    outcomeEl.classList.toggle('sv-cmp', ph === 'compare');
    if (ph === 'start') {
      sheet.outcome(t('out_start', { m: MINUTES }));
      sheet.rule(t('rule_start'));
    } else if (ph === 'ride') {
      sheet.outcome(
        `<span class="sv-line">${t('out_ride', { d: fixed(r.km, 1), m: fixed(r.time, 0) })}</span><span class="sv-line">${t('out_dir', { dir: dirWord(r.dir) })}</span>`,
      );
      sheet.rule(`${t(s.path === 'straight' ? 'rule_ride_straight' : 'rule_ride')} <small class="sv-note">${t('note_fast', { k: FAST })}</small>`);
    } else if (ph === 'end') {
      sheet.outcome(t('out_end', { d: short(avg.distance), m: MINUTES }));
      sheet.rule(t('rule_end'));
    } else if (ph === 'displacement') {
      sheet.outcome(t('out_disp', { d: short(avg.displacement), dir: dirWord(avg.dir) }));
      sheet.rule(t('rule_disp'));
    } else {
      sheet.outcome(
        `<span class="sv-row"><span class="sv-def">${t('cmp_speed')}</span><span class="sv-sum pvc-formula">${t('cmp_speed_sum', { d: short(avg.distance), m: MINUTES, v: short(avg.speed) })}</span></span>` +
          `<span class="sv-row"><span class="sv-def">${t('cmp_vel')}</span><span class="sv-sum pvc-formula">${t('cmp_vel_sum', { d: short(avg.displacement), m: MINUTES, v: short(avg.velocity), dir: dirWord(avg.dir) })}</span></span>` +
          `<small class="sv-note">${t('cmp_hour', { m: MINUTES, a: 1, b: 60 / MINUTES })}</small>`,
      );
      sheet.rule(t(s.path === 'straight' ? 'rule_compare_straight' : 'rule_compare'));
    }
    // the one action
    const next = {
      start: { step: 1, label: 'act_ride', enabled: true, target: riderPoint },
      ride: s.running
        ? { step: 1, label: 'act_riding', enabled: false, target: () => null }
        : { step: 1, label: 'act_go_on', enabled: true, target: () => null },
      end: { step: 2, label: 'act_disp', enabled: true, target: () => B0 },
      displacement: { step: 3, label: 'act_compare', enabled: true, target: () => null },
      compare: { step: '', label: 'act_again', enabled: true, target: () => null },
    }[ph];
    if (shownAction !== `${ph}|${s.running}`) {
      shownAction = `${ph}|${s.running}`;
      action?.set({ ...next, icon: ph === 'compare' ? ICONS.reset : ph === 'start' || ph === 'ride' ? ICONS.play : ICONS.hand });
    }
  }
  let shownAction = '';
  function update() {
    place();
    labels();
    refresh();
  }

  // ── the steps ───────────────────────────────────────────────────────────────
  let token = 0; // bumped by anything that changes the plan: a pending step checks it after every wait
  function stopAll() {
    token++;
    tweener.cancel('ride');
    tweener.cancel('grow');
    s.running = false;
  }
  function ride() {
    if (s.locked) return lockedNudge();
    if (atB()) {
      s.time = 0;
      s.shown = 0;
      s.grow = 0;
    }
    stopAll();
    const my = token;
    s.running = true;
    audio.tick?.();
    const t0 = s.time;
    tweener
      .animate({
        key: 'ride',
        duration: ((MINUTES - t0) / MINUTES) * RIDE_SCREEN,
        ease: (x) => x,
        onUpdate: (k) => {
          s.time = t0 + (MINUTES - t0) * k;
          update();
        },
      })
      .finished.then((done) => {
        if (my !== token) return;
        s.running = false;
        if (done) s.time = MINUTES;
        update();
        if (done) {
          audio.success?.();
          emit('arrive', snapshot());
        }
      });
    update();
  }
  function showDisplacement(animate = true) {
    if (s.locked) return lockedNudge();
    stopAll();
    s.time = MINUTES;
    s.shown = 1;
    if (!animate) {
      s.grow = 1;
      update();
      return;
    }
    s.grow = 0;
    audio.tick?.();
    const my = token;
    tweener
      .animate({
        key: 'grow',
        duration: 1.1,
        onUpdate: (k) => {
          s.grow = k;
          update();
        },
      })
      .finished.then(() => {
        if (my !== token) return;
        s.grow = 1;
        update();
      });
    update();
  }
  function compare() {
    if (s.locked) return lockedNudge();
    stopAll();
    s.time = MINUTES;
    s.shown = 2;
    s.grow = 1;
    audio.success?.();
    update();
  }
  function act() {
    const ph = phase();
    if (ph === 'start' || ph === 'ride' || ph === 'compare') ride();
    else if (ph === 'end') showDisplacement();
    else if (ph === 'displacement') compare();
    emit('change', snapshot());
  }
  function toStart() {
    stopAll();
    s.time = 0;
    s.shown = 0;
    s.grow = 0;
    update();
  }
  function setPath(path) {
    if (!PATHS.includes(path)) return;
    if (s.locked) return lockedNudge();
    s.path = path;
    toStart(); // a new road: back to A (never the end of the new plan)
    emit('change', snapshot());
  }
  /** Move the paused cycle along the ride (the arrow keys): one minute a press. */
  function nudge(minutes) {
    if (s.locked) return lockedNudge();
    stopAll();
    const next = clampTime(Math.round(s.time + minutes));
    s.time = next;
    if (!atB()) {
      s.shown = 0;
      s.grow = 0;
    }
    update();
    emit('change', snapshot());
  }

  // ── camera: the whole ride A→B in frame, in a gentle three-quarter view ──────
  const box = (() => {
    const b = new THREE.Box3();
    for (const p of PATHS)
      for (let k = 0; k <= 40; k++) {
        const q = pointOn(p, (lengthOf(p) * k) / 40);
        b.expandByPoint(toScene(q.x, q.y, 0));
        b.expandByPoint(toScene(q.x, q.y, 420)); // the rider's head and the labels over him
      }
    return b.expandByVector(new THREE.Vector3(170, 0, 170));
  })();
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  function viewPose() {
    const target = box.getCenter(new THREE.Vector3()).setY(0);
    const cam = camera.clone();
    let d = 8000;
    const topRoom = Math.min(0.22, 52 / Math.max(stage.height, 200)); // the corner buttons
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    for (let i = 0; i < 10; i++) {
      cam.position.copy(target).addScaledVector(VIEW, d);
      cam.lookAt(target);
      cam.updateMatrixWorld();
      let x0 = 1e9;
      let x1 = -1e9;
      let y0 = 1e9;
      let y1 = -1e9;
      let j = 0;
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) {
            const c = corners[j++].set(x, y, z).project(cam);
            x0 = Math.min(x0, c.x);
            x1 = Math.max(x1, c.x);
            y0 = Math.min(y0, c.y);
            y1 = Math.max(y1, c.y);
          }
      // fit the box into x −0.97…0.97 and y −0.97…(1 − room for the buttons), then centre it there
      const top = 1 - topRoom * 2;
      const k = Math.max((x1 - x0) / 1.94, (y1 - y0) / (top + 0.97));
      right.setFromMatrixColumn(cam.matrixWorld, 0);
      up.setFromMatrixColumn(cam.matrixWorld, 1);
      const hh = d * tanV;
      const hw = hh * cam.aspect;
      target.addScaledVector(right, ((x0 + x1) / 2) * hw).addScaledVector(up, ((y0 + y1) / 2 - (top - 0.97) / 2) * hh);
      d *= 0.3 + 0.7 * k;
    }
    return { target, position: target.clone().addScaledVector(VIEW, d) };
  }
  function flyTo({ position, target }, duration = 0.6) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
      },
    }).finished;
  }
  function frontView(animate = true) {
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: 'front' });
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    tweener.cancel('camera');
    if (!s.userMovedCamera) {
      s.userMovedCamera = true;
      syncUI();
      emit('view', { view: '3d' });
    }
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) {
      tweener.cancel('camera');
      flyTo(viewPose(), 0);
    }
  });

  let hintTimer = 0;
  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error?.();
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
  const kmhLabel = (v) => `${N(short(v))}<small>${t('u_kmh')}</small>`;
  /** Four different numbers (to the hundredth): the right one and the first three different wrong ones, shuffled. */
  function numericChoices(right, wrong) {
    const seen = new Set([short(right)]);
    const list = [right];
    for (const w of wrong) {
      if (list.length === 4) break;
      if (!(w >= 0) || seen.has(short(w))) continue;
      seen.add(short(w));
      list.push(w);
    }
    return shuffle(list);
  }
  /** A question of words: keys (the first is right), shuffled; returns the quiz's fields and the order. */
  function wordChoices(keys) {
    const order = shuffle(keys.map((_k, i) => i));
    return {
      order,
      q: {
        choices: [0, 1, 2, 3],
        expected: order.indexOf(0),
        tolerance: 0.5,
        label: (j) => `<span class="sv-opt">${t(keys[order[j]])}</span>`,
      },
    };
  }
  /** Set up the picture of a question at once (no animation). */
  function sceneFor({ path = 'winding', time = 0, shown = 0, labels = true }) {
    stopAll();
    s.path = path;
    s.time = time;
    s.shown = shown;
    s.grow = shown ? 1 : 0;
    s.labels = labels;
    update();
  }
  let kinds = [];
  let question = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 3, feedback: 3 },
    action: { hide: (r) => action?.hide(r), show: (r) => action?.show(r) },
    hooks: {
      enter() {
        s.mode = 'quiz';
        stopAll();
        // the zig-zag question first (its picture shows no সরণ, so it gives nothing away), the rest shuffled
        kinds = ['zigzag', ...shuffle(['calc', 'turn', 'straight', 'round'])];
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.labels = true;
        toStart();
        syncUI();
      },
      async prepare(i, _alive, say) {
        s.locked = false;
        const kind = kinds[i % kinds.length];
        if (kind === 'zigzag') {
          sceneFor({ time: MINUTES, labels: false });
          const { order, q } = wordChoices(['z_yes', 'z_no', 'z_straight', 'z_nodir']);
          question = { kind, order, notes: [null, 'note_z_no', 'note_z_straight', 'note_z_nodir'] };
          say(t('q_zigzag'));
          s.locked = true;
          return { ...q, meta: { kind } };
        }
        if (kind === 'calc') {
          // the picture shows the distance (4 km) and the সরণ (2 km); the question gives a new time
          sceneFor({ time: MINUTES, shown: 1 });
          const m = pickOne([10, 15, 30, 40, 60]);
          const speed = Math.random() < 0.5;
          const D = lengthOf('winding');
          const d = DISPLACEMENT.km;
          const right = ((speed ? D : d) * 60) / m;
          const other = ((speed ? d : D) * 60) / m;
          const perMin = (speed ? D : d) / m;
          const times = ((speed ? D : d) * m) / 60;
          question = { kind, speed, m, right, other, perMin, times };
          say(t(speed ? 'q_calc_speed' : 'q_calc_vel', { m }));
          s.locked = true;
          return {
            choices: numericChoices(right, [other, perMin, times, right * 2]),
            expected: right,
            tolerance: 0.004,
            label: kmhLabel,
            meta: { kind, m, speed },
          };
        }
        if (kind === 'turn') {
          // on the big bend (km 2.6–3.4 of the road), the arrow showing the velocity
          sceneFor({ time: (3.1 / lengthOf('winding')) * MINUTES, labels: false });
          const { order, q } = wordChoices(['t_change', 't_same', 't_zero', 't_more']);
          question = { kind, order, notes: [null, 'note_t_same', 'note_t_zero', 'note_t_more'] };
          say(t('q_turn'));
          s.locked = true;
          return { ...q, meta: { kind } };
        }
        if (kind === 'straight') {
          sceneFor({ path: 'straight', time: MINUTES, labels: false });
          const { order, q } = wordChoices(['st_equal', 'st_speed', 'st_vel', 'st_zero']);
          question = { kind, order, notes: [null, 'note_st_speed', 'note_st_vel', 'note_st_zero'] };
          say(t('q_straight'));
          s.locked = true;
          return { ...q, meta: { kind } };
        }
        // round: there and back again, the cycle back at A
        sceneFor({ time: 0, labels: false });
        setting.trails.winding.show(lengthOf('winding'));
        stage.invalidate();
        const m = pickOne([30, 40, 60]);
        const D = 2 * lengthOf('winding');
        question = { kind, m, D };
        say(t('q_round', { m }));
        s.locked = true;
        const speed = (D * 60) / m;
        const half = (DISPLACEMENT.km * 60) / (m / 2);
        return {
          choices: numericChoices(0, [speed, half, half / 2, speed / 2]),
          expected: 0,
          tolerance: 0.001,
          label: kmhLabel,
          meta: { kind, m },
        };
      },
      reveal(_q, correct, picked) {
        const q = question;
        const note = (key, vars) => (correct || !key ? '' : ` ${t(key, vars)}`);
        if (q.kind === 'calc') {
          const D = q.speed ? lengthOf('winding') : DISPLACEMENT.km;
          const v = picked?.value;
          const near = (x) => v != null && Math.abs(v - x) < 0.004;
          const key = near(q.other)
            ? q.speed
              ? 'note_calc_other_speed'
              : 'note_calc_other_vel'
            : near(q.perMin)
              ? 'note_calc_min'
              : near(q.times)
                ? 'note_calc_mul'
                : null;
          return t(q.speed ? 'why_calc_speed' : 'why_calc_vel', { v: short(q.right), d: short(D), m: q.m, s: 60 }) + note(key, { s: 60 });
        }
        if (q.kind === 'round') {
          const v = picked?.value ?? 0;
          const speed = (q.D * 60) / q.m;
          const key = Math.abs(v - speed) < 0.004 ? 'note_round_speed' : v > 0 ? 'note_round_half' : null;
          return t('why_round', { z: 0, d: short(q.D), m: q.m, v: short(speed) }) + note(key, { d: short(q.D), z: 0 });
        }
        const why = { zigzag: 'why_zigzag', turn: 'why_turn', straight: 'why_straight' }[q.kind];
        const chosen = picked ? q.order[picked.index] : 0;
        return t(why) + note(q.notes[chosen]);
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = !s.userMovedCamera;
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
    if (b instanceof HTMLElement && b.dataset.example) setPath(b.dataset.example);
    if (b instanceof HTMLElement && b.dataset.view === 'front') frontView();
    if (b instanceof HTMLElement && b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b instanceof HTMLElement && b.dataset.mode === 'explore') quiz.stop();
    if (b instanceof HTMLElement && b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    switch (b instanceof HTMLElement ? b.dataset.act : null) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'reset':
        if (s.locked) lockedNudge();
        else {
          toStart();
          emit('change', snapshot());
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
    if (s.mode === 'quiz') return;
    const k = e.key.toLowerCase();
    if ((k === ' ' || k === 'enter') && !target.closest('button')) {
      if (!s.running) act();
    } else if (k === 'arrowright' || k === 'arrowup') nudge(1);
    else if (k === 'arrowleft' || k === 'arrowdown') nudge(-1);
    else if (k === 'f') frontView();
    else return;
    e.preventDefault();
  });

  // ── the action: the kit's button in the panel, its badge on the cycle (or on B) ─────────────
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_ride',
    icon: ICONS.play,
    target: riderPoint,
    radius: 34,
    avoid: [ui.corner, ui.hint],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── start ───────────────────────────────────────────────────────────────────
  update();
  frontView(false);
  syncUI();
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
     * Change any of: path ('winding' | 'straight': back to A); time (minutes of the ride, 0–20, stopped there);
     * playing (true: ride on from where the cycle is, or from A); step ('start' | 'displacement' | 'compare'; the last
     * two at B); view ('front': the starting view); animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view === 'front') await frontView(animate);
      if (p.path != null) setPath(String(p.path));
      if (p.time != null) {
        stopAll();
        s.time = clampTime(p.time);
        if (!atB()) {
          s.shown = 0;
          s.grow = 0;
        }
        update();
      }
      if (p.step === 'start') toStart();
      if (p.step === 'displacement') showDisplacement(animate);
      if (p.step === 'compare') compare();
      if (p.playing === true && !s.running) ride();
      if (p.playing === false && s.running) {
        stopAll();
        update();
      }
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.path = 'winding';
      s.labels = true;
      toStart();
      await frontView();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world,
  };
}
