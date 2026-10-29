// Translational motion (book page 36, topic 2.2: চলন গতি), student view: a car on a road with four painted points.
// Drag the car (or press চালাও) and every point leaves a trail: straight ahead, all four trails are the same length
// and point the same way (চলন গতি). Two contrasts from the book's own sentence: a point on the rotating wheel
// (ঘূর্ণায়মান চাকা) goes up and down along a longer path, and a car taking a bend is not in translational motion
// (each point goes its own distance, in its own direction). Then a short test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { ICONS, svg } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createCar, DOT_R, WHEEL_DOT_R } from './car.js';
import { createRoad, createRuler, createTrail, RULER } from './scene.js';
import {
  CAR,
  clampD,
  D_MAX,
  DOT_KEYS,
  DOT_NORMALS,
  DOTS,
  dotDistance,
  fmtM,
  lengthAt,
  PATHS,
  pointAt,
  pose,
  roundTo,
  sampleTrail,
  steer,
  WHEEL_DOT,
  wheelDotAt,
  wheelTurn,
} from './motion.js';

export const DEFAULTS = {
  path: 'straight', // 'straight' | 'turn'
  distance: 0, // m the car has already gone at the start
  wheel: false, // show the point on the wheel (straight road only)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// One colour per painted point (the same in the 3D view, its trail, its label and the panel), and the car's paint.
const COLORS = { body: '#f4f3ef', front: '#1c6fd9', window: '#2b8a3e', roof: '#e8590c', back: '#7048e8', wheel: '#d6336c' };
const KEYS = [...DOT_KEYS, 'wheel'];
const LIFT = 0.06; // m: trails run just off the paint, so the body never hides them
const TRAIL_R = 0.05; // m: thick enough to see on a phone
const STEP = { body: 0.02, wheel: 0.01 }; // m of the car's travel between trail samples
const ARROW = { len: 0.32, r: 0.115 }; // the arrowhead stops just short of its point
const SPEED = { straight: 1.6, turn: 2.2 }; // m/s at the most (a car creeping off), with a gentle start and stop
const MOVED = 0.5; // m: from here the panel draws its conclusion (round the bend the numbers differ by then)
const LABELS_UNTIL = 0.4; // m: the points' names show at the start, and go once the car has moved
const FRONT_AXLE = CAR.rearAxle + CAR.wheelbase;
const HUBS = {
  rl: [CAR.rearAxle, CAR.wheelR, -CAR.track / 2],
  rr: [CAR.rearAxle, CAR.wheelR, CAR.track / 2],
  fl: [FRONT_AXLE, CAR.wheelR, -CAR.track / 2],
  fr: [FRONT_AXLE, CAR.wheelR, CAR.track / 2],
};
// where each point's name sits, from the point (px): clear of each other and of the metre numbers below the car
const LABEL_AT = { front: [30, 44], window: [44, -14], roof: [36, -52], back: [0, -62] };
const BEND_ICON = svg('<path d="M6 20v-6a6 6 0 0 1 6-6h7"/><path d="M15 4l4 4-4 4"/>');

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const M1 = (v) => N(fmtM(v)); // metres, one decimal, in the language's digits

  root.classList.add('pvc', 'tm');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  for (const k of KEYS) root.style.setProperty(`--c-${k}`, COLORS[k]);
  const term = (k) => `<span class="pvc-t ${k}"><b>0</b><small>${t(`dot_${k}`)}</small></span>`;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="pvc-learn-main tm-main">
            <div class="tm-head"><span class="tm-cap">${t('dist_head')}</span><span class="tm-verdict"><span class="tm-yes">${ICONS.check}<span></span></span><span class="tm-no">${ICONS.close}${t('verdict_no')}</span></span></div>
            <div class="pvc-sum tm-sum">${DOT_KEYS.map((k, i) => `${i ? '<i class="tm-op">=</i>' : ''}${term(k)}`).join('')}<span class="tm-wheel-part"><i class="tm-op">≠</i>${term('wheel')}</span></div>
          </div>
          <p class="tm-extra"></p>
          <div class="pvc-learn-foot tm-foot">
            <button class="pvc-btn primary" data-act="drive"><i class="tm-ic"></i><span></span></button>
            <button class="pvc-btn tm-toggle tm-wheel-btn" data-act="wheel" aria-pressed="false"><i class="tm-swatch"></i>${t('act_wheel')}</button>
            <button class="pvc-btn tm-toggle tm-bend-btn" data-act="bend" aria-pressed="false">${BEND_ICON}${t('act_bend')}</button>
          </div>`,
  });

  // ── 3D ──────────────────────────────────────────────────────────────────────
  // A narrow lens from far away, nearly a parallel projection: equal trails look equal wherever they are.
  const stage = createStage(ui.canvasHost, { fov: 10, near: 4, far: 900, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  const backgroundCanvas = document.createElement('canvas');
  backgroundCanvas.width = 8;
  backgroundCanvas.height = 256;
  const backgroundContext = backgroundCanvas.getContext('2d');
  const backgroundGradient = backgroundContext.createLinearGradient(0, 0, 0, 256);
  backgroundGradient.addColorStop(0, '#092968');
  backgroundGradient.addColorStop(1, '#126fb5');
  backgroundContext.fillStyle = backgroundGradient;
  backgroundContext.fillRect(0, 0, 8, 256);
  const background = new THREE.CanvasTexture(backgroundCanvas);
  background.colorSpace = THREE.SRGBColorSpace;
  scene.background = o.bg === 'transparent' ? null : background;
  controls.minDistance = 20;
  controls.maxDistance = 220;
  controls.enablePan = false;
  const M = createMaterials(stage.renderer);
  const world = new THREE.Group();
  world.name = 'TranslationalMotionScene';
  scene.add(world);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });

  const roads = Object.fromEntries(PATHS.map((p) => [p, createRoad(p)]));
  for (const r of Object.values(roads)) {
    r.userData.noExport = true;
    world.add(r);
  }
  const ruler = createRuler({ digits: N, unit: t('unit_m') });
  ruler.group.userData.noExport = true;
  world.add(ruler.group);

  const car = createCar({ materials: M, colors: COLORS });
  world.add(car.root);
  const ghostMat = new THREE.MeshBasicMaterial({ name: 'StartOutline', color: 0xd8e5ef, transparent: true, opacity: 0, depthWrite: false });
  const ghost = createCar({ materials: M, colors: COLORS, ghost: ghostMat });
  ghost.root.userData.noExport = true;
  world.add(ghost.root);
  // a big invisible box round the car: a finger anywhere near it takes the car
  const hitBox = new THREE.Mesh(new THREE.BoxGeometry(CAR.length + 0.6, CAR.height + 0.45, CAR.width + 0.5), new THREE.MeshBasicMaterial());
  hitBox.position.set(CAR.length / 2, (CAR.height + 0.45) / 2, 0);
  hitBox.visible = false;
  hitBox.userData.noExport = true;
  car.model.add(hitBox);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.position.set(3, 22, 9);
    sun.target.position.set(4, 0, -2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 5, far: 45 });
    sun.shadow.radius = 8;
    sun.shadow.bias = -0.0005;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.002;
    ground.receiveShadow = true;
    ground.userData.noExport = true;
    scene.add(sun, sun.target, ground);
    car.root.traverse((m) => {
      if (m instanceof THREE.Mesh && m.visible && m.material.depthTest && !m.material.transparent && m.name !== 'DoorSeam') m.castShadow = true;
    });
  }

  // ── trails: for each path and each point, a tube along its path, an arrowhead and a ring where it began ──
  const lifted = (k) => {
    const [x, y, z] = DOTS[k];
    const n = DOT_NORMALS[k];
    return [x + n[0] * LIFT, y + n[1] * LIFT, z + n[2] * LIFT];
  };
  // the tyre point's trail is drawn last and over everything: it weaves between the others and touches the road
  const trailColors = { front: '#57caff', window: '#6ee59b', roof: '#ffb341', back: '#c8afff', wheel: '#ff79ad' };
  const trailMats = Object.fromEntries(
    KEYS.map((k) => [k, new THREE.MeshBasicMaterial({ name: `Trail_${k}`, color: trailColors[k], toneMapped: false, depthTest: k !== 'wheel' })]),
  );
  // while the tyre point is shown, the body's trails step back a little (lighter), so its path stands out
  const shades = Object.fromEntries(
    DOT_KEYS.map((k) => [k, [new THREE.Color(trailColors[k]), new THREE.Color(trailColors[k]).lerp(new THREE.Color('#ffffff'), 0.5)]]),
  );
  const trails = {}; // path → key → { samples, tube }
  const wheelExact = {}; // path → samples of the tyre point itself (its distance has no simple formula)
  for (const path of PATHS) {
    trails[path] = {};
    for (const k of KEYS) {
      const fn = k === 'wheel' ? (d) => wheelDotAt(path, d, { out: WHEEL_DOT.out + LIFT }) : (d) => pointAt(path, lifted(k), d);
      const samples = sampleTrail(fn, D_MAX[path], k === 'wheel' ? STEP.wheel : STEP.body);
      const tube = createTrail(samples.points, { radius: TRAIL_R, radial: k === 'wheel' ? 6 : 8, material: trailMats[k] });
      tube.mesh.name = `Trail_${path}_${k}`;
      if (k === 'wheel') tube.mesh.renderOrder = 5;
      world.add(tube.mesh);
      trails[path][k] = { samples, tube };
    }
    wheelExact[path] = sampleTrail((d) => wheelDotAt(path, d), D_MAX[path], 0.005);
  }
  const coneGeo = new THREE.ConeGeometry(ARROW.r, ARROW.len, 18);
  coneGeo.translate(0, -ARROW.len / 2, 0); // tip at the origin, pointing +y
  const arrows = {};
  const rings = {};
  for (const k of KEYS) {
    const small = k === 'wheel' ? 0.8 : 1;
    const a = new THREE.Mesh(coneGeo, trailMats[k]);
    a.scale.setScalar(small);
    a.name = `Arrow_${k}`;
    a.userData.noExport = true;
    world.add(a);
    arrows[k] = a;
    const r0 = (k === 'wheel' ? WHEEL_DOT_R : DOT_R) * 0.75;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r0, r0 + 0.05 * small, 32),
      new THREE.MeshBasicMaterial({ color: trailColors[k], toneMapped: false, side: THREE.DoubleSide, depthTest: k !== 'wheel' }),
    );
    if (k === 'wheel') a.renderOrder = ring.renderOrder = 5;
    ring.name = `Start_${k}`;
    ring.userData.noExport = true;
    world.add(ring);
    rings[k] = ring;
  }
  // where the tyre point starts, on the road (its wheel is steered on the bend), for its ring
  const wheelStart = Object.fromEntries(PATHS.map((p) => [p, wheelDotAt(p, 0, { out: WHEEL_DOT.out + 0.01 })]));
  // the rings sit where each point was at the start (the car starts at the same place on both paths)
  for (const k of DOT_KEYS) {
    const n = DOT_NORMALS[k];
    const [x, y, z] = pointAt('straight', lifted(k), 0);
    rings[k].position.set(x, y, z);
    if (n[1]) rings[k].rotation.x = -Math.PI / 2;
  }
  // things that turn to face the student before each frame: the metre numbers, the tyre point and its ring
  stage.onBeforeRender(() => {
    ruler.face(camera);
    car.faceCamera(camera);
    rings.wheel.quaternion.copy(camera.quaternion);
  });

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    path: PATHS.includes(o.path) ? o.path : 'straight',
    d: 0,
    wheel: Boolean(o.wheel) && o.path !== 'turn', // the tyre point belongs to the straight road
    playing: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
  };
  // Every request from the student (a button, a drag, a key) gets a number. Something that waits (a camera move
  // before a drive) acts only if no newer request came meanwhile, whether or not its camera move was cut short.
  let request = 0;

  const distances = () => {
    const out = {};
    for (const k of DOT_KEYS) out[k] = dotDistance(s.path, k, s.d);
    out.wheel = lengthAt(wheelExact[s.path], s.d);
    return out;
  };
  const atEnd = () => s.d >= D_MAX[s.path] - 0.01;

  function snapshot() {
    const ds = distances();
    const r2 = (v) => roundTo(v, 0.01);
    return {
      path: s.path,
      distance: r2(s.d),
      distances: Object.fromEntries(KEYS.map((k) => [k, r2(ds[k])])),
      translational: s.path === 'straight', // the body does not turn: every point moves alike, all the way
      wheel: s.wheel,
      playing: s.playing,
      view: s.view,
      mode: s.mode,
    };
  }

  // ── the car on its path ─────────────────────────────────────────────────────
  const tv = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  /** The sample index along a trail where its length reaches L. */
  function atLength(samples, L) {
    const { lengths, n } = samples;
    let lo = 0;
    let hi = n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (lengths[mid] <= L) lo = mid;
      else hi = mid;
    }
    return lo;
  }
  /** Puts the arrowhead just short of its point, pointing the way it was moving; returns how much tube to show. */
  function placeArrow(k, samples, L) {
    const a = arrows[k];
    const gap = (k === 'wheel' ? WHEEL_DOT_R : DOT_R) * 1.28 + 0.03;
    const tipL = L - gap;
    const len = ARROW.len * a.scale.y;
    if (tipL < len * 1.2) {
      a.visible = false;
      return Math.max(0, atLength(samples, tipL - len));
    }
    const i = atLength(samples, tipL);
    const P = samples.points;
    const j = atLength(samples, tipL - 0.06);
    tv.set(P[i * 3] - P[j * 3], P[i * 3 + 1] - P[j * 3 + 1], P[i * 3 + 2] - P[j * 3 + 2]);
    if (tv.lengthSq() < 1e-10) tv.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(up, tv.normalize());
    a.position.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
    a.visible = true;
    return atLength(samples, tipL - len * 0.8);
  }

  function applyPose() {
    const p = pose(s.path, s.d);
    car.root.position.set(p.x, 0, p.z);
    car.root.rotation.y = p.heading;
    const turns = {};
    for (const [k, hub] of Object.entries(HUBS)) turns[k] = wheelTurn(s.path, hub, s.d);
    car.setWheels(turns, steer(s.path));
    const p0 = pose(s.path, 0);
    ghost.root.position.set(p0.x, 0, p0.z);
    ghost.root.rotation.y = p0.heading;
    ghost.setWheels({ rl: 0, rr: 0, fl: 0, fr: 0 }, steer(s.path));
    ghostMat.opacity = 0.2 * THREE.MathUtils.smoothstep(s.d, 0.25, 1.4);
    ghost.root.visible = ghostMat.opacity > 0.002;

    for (const path of PATHS) {
      for (const k of KEYS) {
        const tr = trails[path][k];
        const on = path === s.path && (k !== 'wheel' || s.wheel);
        tr.tube.mesh.visible = on;
        if (!on) continue;
        tr.tube.show(placeArrow(k, tr.samples, lengthAt(tr.samples, s.d)));
      }
    }
    for (const k of KEYS) {
      const on = k !== 'wheel' || s.wheel;
      if (!on) arrows[k].visible = false;
      rings[k].visible = on && s.d > 0.18;
    }
    car.dots.wheel.visible = s.wheel;
    for (const k of DOT_KEYS) trailMats[k].color.copy(shades[k][s.wheel ? 1 : 0]);
    rings.wheel.position.fromArray(wheelStart[s.path]);
    roads.straight.visible = s.path === 'straight';
    roads.turn.visible = s.path === 'turn';
    ruler.group.visible = s.path === 'straight';
    startLabels();
    stage.invalidate();
  }

  // ── names on the points (colour is not the only way to tell them apart) ───────
  const labelPoints = Object.fromEntries(KEYS.map((k) => [k, new THREE.Vector3()]));
  /** Pins the names of these points next to them (any others go). text(k) gives a label's text. */
  function showLabels(keys, text = (k) => t(`dot_${k}`)) {
    annotations.clear();
    for (const k of keys) {
      const [dx, dy] = LABEL_AT[k] || [-36, 44];
      annotations.add(k, {
        text: text(k),
        point: () => car.dots[k].getWorldPosition(labelPoints[k]),
        dx,
        dy,
        kind: 'callout',
        color: COLORS[k],
      });
    }
  }
  let startNames = false;
  /** In শেখো the four names show while the car stands at the start, and go once it moves. */
  function startLabels() {
    if (s.mode !== 'explore') return;
    const want = s.d < LABELS_UNTIL;
    if (want === startNames) return;
    startNames = want;
    if (want) showLabels(DOT_KEYS);
    else annotations.clear();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    values: Object.fromEntries(KEYS.map((k) => [k, $(`.pvc-t.${k} b`)])),
    ops: ui.$$('.tm-op'),
    verdict: $('.tm-verdict'),
    verdictYes: $('.tm-yes > span'),
    extra: $('.tm-extra'),
    drive: $('[data-act="drive"]'),
    driveIc: $('[data-act="drive"] .tm-ic'),
    driveLabel: $('[data-act="drive"] span'),
    wheelBtn: $('[data-act="wheel"]'),
    bendBtn: $('[data-act="bend"]'),
    wheelPart: $('.tm-wheel-part'),
  };

  // the panel is written every frame while the car moves: only what changed is touched
  const shown = new Map();
  const put = (node, key, value, write) => {
    if (shown.get(key) === value) return;
    shown.set(key, value);
    write(node, value);
  };
  const text = (node, v) => {
    node.textContent = v;
  };
  const DRIVE_ICONS = { act_pause: ICONS.pause, act_again: ICONS.reset, act_drive: ICONS.play };

  /** The panel's line: the idea at first, then what the student sees (the tyre point's, once it is ahead). */
  function extraKey(ds) {
    if (s.path === 'turn') return s.d >= MOVED ? 'see_turn' : 'idea_turn';
    if (s.wheel) return ds.wheel > ds.front + 0.05 ? 'see_wheel' : 'idea_wheel'; // it starts behind, then overtakes
    return s.d >= MOVED ? 'see_straight' : 'idea';
  }

  function refresh() {
    const ds = distances();
    for (const k of KEYS) put(el.values[k], k, M1(ds[k]), text);
    // = or ≠ between neighbours, as the numbers read
    el.ops.forEach((op, i) => put(op, `op${i}`, fmtM(ds[KEYS[i]]) === fmtM(ds[KEYS[i + 1]]) ? '=' : '≠', text));
    el.wheelPart.hidden = !s.wheel;
    // the verdict, once the car has gone far enough to tell (the first-use hand never moves it that far)
    el.verdict.dataset.state = s.d >= MOVED ? (s.path === 'straight' ? 'yes' : 'no') : '';
    put(el.verdictYes, 'yes', t(s.wheel ? 'verdict_yes_wheel' : 'verdict_yes'), text);
    put(el.extra, 'extra', t(extraKey(ds)), text);
    const act = s.playing ? 'act_pause' : atEnd() ? 'act_again' : 'act_drive';
    put(el.driveLabel, 'drive', t(act), text);
    put(el.driveIc, 'driveIcon', act, (node, v) => {
      node.innerHTML = DRIVE_ICONS[v];
    });
    for (const [b, on] of [
      [el.wheelBtn, s.wheel],
      [el.bendBtn, s.path === 'turn'],
    ]) {
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    stage.invalidate();
  }

  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.path}|${fmtM(snap.distance)}|${snap.wheel}|${snap.playing}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  function setD(d) {
    const v = clampD(s.path, d);
    if (v === s.d) return;
    s.d = v;
    applyPose();
    refresh();
    emitChange();
  }

  // ── driving ─────────────────────────────────────────────────────────────────
  /** Drives from where the car is to `to` with a gentle start and stop (the virtual clock moves it in tests). */
  function drive(to = D_MAX[s.path], { from = s.d } = {}) {
    stopDrive();
    const target = clampD(s.path, to);
    if (from !== s.d) setD(from);
    const span = target - s.d;
    if (Math.abs(span) < 1e-6) return Promise.resolve(true);
    const start = s.d;
    s.playing = true;
    refresh();
    emitChange();
    emit('drive', { path: s.path, from: start, to: target });
    // with a sine speed profile the top speed is π/2 × the average
    const duration = 0.4 + ((Math.PI / 2) * Math.abs(span)) / SPEED[s.path];
    return tweener.animate({
      key: 'drive',
      duration,
      ease: ease.inOutSine,
      onUpdate: (k) => setD(start + span * k),
      onComplete: () => {
        s.playing = false;
        refresh();
        emitChange();
      },
    }).finished;
  }
  function stopDrive() {
    tweener.cancel('drive');
    if (!s.playing) return;
    s.playing = false;
    refresh();
    emitChange();
  }
  /** The চালাও button: drive on, stop, or start again from the beginning. */
  function toggleDrive() {
    if (s.locked) return lockedNudge();
    request++;
    coach?.objectUsed();
    if (s.playing) return stopDrive();
    audio.pop();
    if (atEnd()) return drive(D_MAX[s.path], { from: 0 });
    return drive();
  }

  /** Straight road or the bend (the tyre point belongs to the straight road). autoplay: then drive it. */
  async function setPath(path, { animate = true, autoplay = false } = {}) {
    const my = ++request;
    const p = PATHS.includes(path) ? path : 'straight';
    stopDrive();
    const changed = p !== s.path;
    s.path = p;
    if (p === 'turn') s.wheel = false;
    s.d = 0;
    applyPose();
    refresh();
    emitChange();
    if (changed) emit('path', { path: p });
    if (!s.userMovedCamera) await flyTo(viewPose(s.view), animate ? 0.8 : 0);
    if (autoplay && my === request && !s.locked) await drive();
  }

  /** Shows or hides the tyre point (on the straight road; the camera turns more to the side). autoplay: drive. */
  async function setWheel(on, { animate = true, autoplay = false } = {}) {
    const my = ++request;
    stopDrive();
    s.wheel = Boolean(on);
    if (s.wheel && s.path !== 'straight') {
      s.path = 'straight';
      s.d = 0;
      emit('path', { path: 'straight' });
    }
    if (s.wheel && autoplay) s.d = 0;
    applyPose();
    refresh();
    emitChange();
    if (!s.userMovedCamera) await flyTo(viewPose(s.view), animate ? 0.7 : 0);
    if (autoplay && s.wheel && my === request && !s.locked) await drive();
  }

  function lockedNudge() {
    showHint(t('hint_locked'), { duration: 3000 });
    audio.error();
  }

  // ── camera: fit what matters to the frame, whatever its shape ─────────────────
  const corners = [];
  for (const x of [-0.1, CAR.length + 0.1])
    for (const y of [0, CAR.height + 0.05]) for (const z of [-CAR.width / 2, CAR.width / 2]) corners.push([x, y, z]);
  /** The car's corners all along its path (the bend's real shape, not a box round it). */
  const pathPoints = Object.fromEntries(
    PATHS.map((path) => {
      const pts = [];
      for (let i = 0; i <= 16; i++) for (const c of corners) pts.push(new THREE.Vector3(...pointAt(path, c, (i / 16) * D_MAX[path])));
      return [path, pts];
    }),
  );
  // with the tyre point on a tall frame: the front wheel's path (its arches start at 2.86 m) and the car at the end,
  // seen almost from the side, so each 2 m arch is as big as the phone allows
  const wheelPoints = [];
  for (const x of [2.75, CAR.length + D_MAX.straight + 0.1])
    for (const y of [0, CAR.height + 0.05]) for (const z of [-CAR.width / 2, CAR.width / 2]) wheelPoints.push(new THREE.Vector3(x, y, z));
  const tallWheel = () => s.path === 'straight' && s.wheel && camera.aspect < 1.1;
  const deg = THREE.MathUtils.degToRad;
  /** Where the camera looks from: straight, more from the side on wide frames and more from the front corner on
   *  tall ones (the drive then fills a phone held upright); the bend, from higher up so its arcs show. */
  function viewDir(view) {
    const k = THREE.MathUtils.clamp((camera.aspect - 0.75) / (1.9 - 0.75), 0, 1);
    const lerp = (a, b) => THREE.MathUtils.lerp(a, b, k);
    // with the wheel point, more from the side: its arches stand in the plane of the car's side
    const side = s.path === 'straight' && s.wheel;
    let az = s.path === 'turn' ? 26 : tallWheel() ? 12 : side ? lerp(30, 8) : lerp(54, 16);
    let el = s.path === 'turn' ? lerp(58, 50) : tallWheel() ? 18 : side ? lerp(26, 14) : lerp(40, 20);
    if (view === '3d') {
      // free turning starts from behind the car's right side, a little higher: the side, the roof and the back
      az = s.path === 'turn' ? -24 : -32;
      el += 8;
    }
    return new THREE.Vector3(Math.sin(deg(az)) * Math.cos(deg(el)), Math.sin(deg(el)), Math.cos(deg(az)) * Math.cos(deg(el)));
  }
  const fit = { right: new THREE.Vector3(), upv: new THREE.Vector3(), fwd: new THREE.Vector3() };
  function viewPose(view) {
    const dir = viewDir(view);
    const { right, upv, fwd } = fit;
    fwd.copy(dir).negate();
    right.crossVectors(fwd, up).normalize();
    upv.crossVectors(right, fwd);
    const tall = tallWheel();
    const pts = tall ? wheelPoints : pathPoints[s.path];
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    const take = (p) => {
      const a = [p.dot(right), p.dot(upv), p.dot(fwd)];
      for (let i = 0; i < 3; i++) {
        lo[i] = Math.min(lo[i], a[i]);
        hi[i] = Math.max(hi[i], a[i]);
      }
    };
    for (const p of pts) take(p);
    if (s.path === 'straight') {
      // the metre numbers sit just under their pegs on the screen, the unit under the last one (see createRuler)
      for (let i = tall ? 3 : 0; i <= RULER.max; i++) {
        const c = tv.set(i, 0, RULER.z).addScaledVector(upv, -RULER.below);
        for (const [dr, du] of [
          [-0.2, -RULER.digit * 0.6],
          [0.2, RULER.digit * 0.6],
        ])
          take(c.clone().addScaledVector(right, dr).addScaledVector(upv, du));
      }
      const u = tv.set(RULER.max, 0, RULER.z).addScaledVector(upv, -(RULER.below + RULER.unitBelow + RULER.unit * 0.6));
      take(u.clone().addScaledVector(right, 0.45));
      take(u.clone().addScaledVector(right, -0.45));
    }
    const centre = new THREE.Vector3()
      .addScaledVector(right, (lo[0] + hi[0]) / 2)
      .addScaledVector(upv, (lo[1] + hi[1]) / 2)
      .addScaledVector(fwd, (lo[2] + hi[2]) / 2);
    const hw = (hi[0] - lo[0]) / 2;
    const hh = (hi[1] - lo[1]) / 2;
    const hd = (hi[2] - lo[2]) / 2;
    const H = Math.max(stage.height, 200);
    const top = 50; // px kept clear for the buttons in the corner
    const bottom = 6;
    const usable = 1 - (top + bottom) / H;
    const tanV = Math.tan(deg(camera.fov) / 2);
    const tanH = tanV * camera.aspect;
    const dist = Math.max(hh / (tanV * usable), hw / (tanH * 0.97)) * 1.03 + hd;
    // shift the picture down so it is centred in the free part of the frame
    const shift = ((top - bottom) / 2 / H) * 2 * tanV * dist;
    const target = centre.addScaledVector(upv, shift);
    return { target, position: target.clone().addScaledVector(dir, dist) };
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
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera && !tweener.busy) flyTo(viewPose(s.view), 0);
    else if (!s.userMovedCamera) flyTo(viewPose(s.view), 0.3);
  });

  // ── dragging the car ────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(hitBox, false).length > 0;
  }
  /** On-screen direction of the car's path where it is now, and how many pixels one metre is there. */
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  function pathOnScreen() {
    const mid = [CAR.length / 2, 0.6, 0];
    const d0 = Math.min(s.d, D_MAX[s.path] - 0.1);
    pa.fromArray(pointAt(s.path, mid, d0)).project(camera);
    pb.fromArray(pointAt(s.path, mid, d0 + 0.1)).project(camera);
    const dx = ((pb.x - pa.x) / 2) * stage.width;
    const dy = (-(pb.y - pa.y) / 2) * stage.height;
    const len = Math.hypot(dx, dy) || 1;
    return { ux: dx / len, uy: dy / len, pxPerM: len / 0.1 };
  }

  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      root.focus({ preventScroll: true });
      coach?.interrupt();
      if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (!pick(canvasPoint(e))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      request++;
      stopDrive();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false };
      try {
        ui.canvasHost.setPointerCapture(e.pointerId); // the finger keeps the car even off the canvas
      } catch {
        // a pointer the browser no longer tracks: the drag still works while it stays on the canvas
      }
      ui.canvasHost.style.cursor = 'grabbing';
      hideHint();
      coach?.objectUsed();
      emit('dragstart', snapshot());
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { ux, uy, pxPerM } = pathOnScreen();
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true;
    setD(s.d + (dx * ux + dy * uy) / pxPerM);
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const tap = !drag.moved && performance.now() - drag.t0 < 500;
    drag = null;
    ui.canvasHost.style.cursor = '';
    emit('dragend', snapshot());
    if (tap && e.type === 'pointerup') toggleDrive(); // a tap on the car drives it
    coach?.objectReleased();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag || e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'grab') : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(msg, { duration = 4000 } = {}) {
    ui.hintText.textContent = msg;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
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
  /** The right number and three wrong ones from the usual mistakes (positive, all different), shuffled. */
  function numberChoices(right, mistakes) {
    const seen = new Set([right]);
    const wrong = [];
    for (const m of shuffle(mistakes.map((v) => roundTo(v, 0.1)))) {
      if (!(m > 0) || seen.has(m)) continue;
      seen.add(m);
      wrong.push(m);
      if (wrong.length === 3) break;
    }
    for (let k = 1; wrong.length < 3; k++) if (!seen.has(right + k)) seen.add(right + k) && wrong.push(right + k);
    return shuffle([right, ...wrong]);
  }
  const metres = (v) => `${N(String(v))}<small>${t('unit_m')}</small>`;
  const words = (keys) => (i) => `<span class="tm-opt">${t(keys[i])}</span>`;
  const of = (k) => t(`of_${k}`);
  const mark = (x) => roundTo(x, 0.1); // a point's place on the metre marks

  // the look-alike pairs for "which is চলন গতি": the student must use the idea, not spot a word
  const YES = ['ex_drawer', 'ex_box', 'ex_lift'];
  const NO = ['ex_door', 'ex_ball', 'ex_turn', 'ex_cycle'];
  const PAIR = { ex_drawer: 'ex_door', ex_door: 'ex_drawer', ex_box: 'ex_ball', ex_ball: 'ex_box' };

  let kinds = [];
  let question = null;
  let picked = -1; // the choice the student tapped (its worked answer names that mistake)
  let saved = null; // the student's own state, given back after the test
  /** Puts the car somewhere for a question, without the student's camera moves in the way. */
  async function stageFor({ path = 'straight', wheel = false, to = 0, labels = [] }) {
    request++;
    stopDrive();
    s.wheel = wheel;
    s.path = path;
    s.d = 0;
    applyPose();
    refresh();
    if (labels.length) showLabels(labels);
    else annotations.clear();
    if (s.userMovedCamera || s.view !== 'front') {
      s.view = 'front';
      controls.enableRotate = false;
      s.userMovedCamera = false;
      syncUI();
    }
    await flyTo(viewPose('front'), 0.6);
    if (to > 0) drive(to);
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        saved = { path: s.path, d: s.d, wheel: s.wheel };
        s.mode = 'quiz';
        s.locked = true;
        startNames = false;
        annotations.clear();
        stopDrive();
        hideHint();
        kinds = ['dist', ...shuffle(['which', 'wheel', 'turn', 'same'])];
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        annotations.clear();
        syncUI();
        if (saved) {
          request++;
          stopDrive();
          s.path = saved.path;
          s.wheel = saved.wheel;
          s.d = saved.d;
          flyTo(viewPose(s.view), 0.6);
        }
        applyPose();
        refresh();
        emitChange();
      },
      async prepare(i, alive, say) {
        const kind = kinds[i % kinds.length];
        picked = -1;
        if (kind === 'dist') {
          // read two marks and subtract: a distance is how far it went, not where it is
          const d = pickOne([2, 2.5, 3, 3.5]);
          const given = pickOne(['front', 'window', 'back']);
          const asked = pickOne(DOT_KEYS.filter((k) => k !== given));
          const start = mark(DOTS[given][0]);
          const end = mark(start + d);
          const askedEnd = mark(DOTS[asked][0] + d);
          say(t('q_dist', { given: of(given), start, end, asked: of(asked) }));
          await stageFor({ path: 'straight', to: d, labels: [given, asked] });
          if (!alive()) return null;
          question = { kind, d, given, asked, start, end, askedEnd };
          return {
            choices: numberChoices(d, [end, start, askedEnd]),
            expected: d,
            tolerance: 0.05,
            label: metres,
            meta: { kind, given, asked, from: start, to: end, distance: d },
          };
        }
        if (kind === 'which') {
          const not = Math.random() < 0.5;
          const right = pickOne(not ? NO : YES);
          let wrong = not ? [...YES] : shuffle(NO.filter((k) => k !== PAIR[right])).slice(0, PAIR[right] ? 2 : 3);
          if (!not && PAIR[right]) wrong = [PAIR[right], ...wrong]; // the look-alike is always there
          const keys = shuffle([right, ...wrong]);
          say(t(not ? 'q_which_not' : 'q_which'));
          await stageFor({ path: 'straight' });
          if (!alive()) return null;
          question = { kind, not, right, keys };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf(right), tolerance: 0.5, label: words(keys), meta: { kind, not, answer: right } };
        }
        if (kind === 'wheel') {
          const keys = shuffle(['wheel_wave', 'wheel_straight', 'wheel_circle', 'wheel_loop']);
          say(t('q_wheel'));
          await stageFor({ path: 'straight', wheel: true });
          if (!alive()) return null;
          showLabels(['wheel'], () => t('this_point'));
          question = { kind, keys };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf('wheel_wave'), tolerance: 0.5, label: words(keys), meta: { kind } };
        }
        if (kind === 'turn') {
          const keys = shuffle(['turn_no_dist', 'turn_yes_together', 'turn_yes_forward', 'turn_no_wheel']);
          say(t('q_turn'));
          await stageFor({ path: 'turn', to: D_MAX.turn });
          if (!alive()) return null;
          question = { kind, keys };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf('turn_no_dist'), tolerance: 0.5, label: words(keys), meta: { kind } };
        }
        // the whole definition: the same time, the same direction, the same distance
        const d = 3;
        const keys = shuffle(['same_all', 'same_roof', 'same_first', 'same_dir']);
        say(t('q_same'));
        await stageFor({ path: 'straight', to: d, labels: ['roof', 'front'] });
        if (!alive()) return null;
        question = { kind, keys, d };
        return { choices: [0, 1, 2, 3], expected: keys.indexOf('same_all'), tolerance: 0.5, label: words(keys), meta: { kind } };
      },
      reveal(q, correct) {
        const Q = question;
        const choice = q.choices[picked];
        if (Q.kind === 'dist') {
          const vars = { ...Q, given: of(Q.given), asked: of(Q.asked) };
          if (correct || choice == null) return t('dist_why', vars);
          if (choice === Q.end) return t('dist_end', vars);
          if (choice === Q.start) return t('dist_start', vars);
          if (choice === Q.askedEnd) return t('dist_asked_end', vars);
          return t('dist_why', vars);
        }
        if (Q.kind === 'which') {
          // why the tapped one is (or is not) চলন গতি; the right one is marked green
          const item = correct || choice == null ? Q.right : Q.keys[choice];
          return `<b>${t(item)}</b>: ${t(`why_${item}`)}`;
        }
        if (Q.kind === 'wheel') {
          // now watch it: the car drives and the point draws its path
          annotations.clear();
          drive(D_MAX.straight, { from: 0 });
          const item = choice == null ? 'wheel_wave' : Q.keys[choice];
          return t(`why_${item}`);
        }
        if (Q.kind === 'turn') {
          // finish the bend if the student answered while it was still going, so the numbers are the end's
          if (!atEnd()) {
            stopDrive();
            setD(D_MAX.turn);
          }
          showLabels(['front', 'roof']);
          const vars = { a: fmtM(dotDistance('turn', 'front', D_MAX.turn)), b: fmtM(dotDistance('turn', 'roof', D_MAX.turn)) };
          return t(`why_${choice == null ? 'turn_no_dist' : Q.keys[choice]}`, vars);
        }
        return t(`why_${choice == null ? 'same_all' : Q.keys[choice]}`, { d: Q.d });
      },
      done() {
        annotations.clear();
      },
    },
  });

  // ── first-use pointer: on the car ───────────────────────────────────────────
  let coach = null;
  if (o.coach) {
    const v = new THREE.Vector3();
    const spots = [
      [2.3, 0.62, CAR.width / 2],
      [1.8, CAR.height, 0],
      [3.4, 0.75, CAR.width / 2],
    ];
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_drag',
        candidates: () =>
          spots.map((c) => {
            v.fromArray(pointAt(s.path, c, s.d)).project(camera);
            return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height };
          }),
        grabbable: (p) => pick(p),
        // the car rolls forward a little and back, as if dragged: not so far that the panel draws its conclusion
        async demo(alive) {
          const from = s.d;
          const to = Math.min(D_MAX[s.path], from + Math.min(0.35, LABELS_UNTIL - 0.05));
          for (let i = 0; i < 2 && alive() && !s.playing; i++) {
            await tweener.animate({ key: 'coach-car', duration: 0.6, ease: ease.inOutCubic, onUpdate: (k) => setD(from + (to - from) * k) }).finished;
            if (!alive()) break;
            await tweener.animate({ key: 'coach-car', duration: 0.6, ease: ease.inOutCubic, onUpdate: (k) => setD(to + (from - to) * k) }).finished;
          }
        },
        cancel: () => tweener.cancel('coach-car'),
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
  const toggleBend = () => {
    if (s.locked) return;
    coach?.objectUsed();
    setPath(s.path === 'turn' ? 'straight' : 'turn', { autoplay: true });
  };
  const toggleWheel = () => {
    if (s.locked) return;
    coach?.objectUsed();
    setWheel(!s.wheel, { autoplay: true });
  };
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
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
      case 'drive':
        toggleDrive();
        break;
      case 'wheel':
        toggleWheel();
        break;
      case 'bend':
        toggleBend();
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
    const step = e.shiftKey ? 1 : 0.25;
    const nudge = (dd) => {
      if (s.locked) return lockedNudge();
      request++;
      stopDrive();
      coach?.objectUsed();
      setD(s.d + dd);
    };
    if (k === 'ArrowRight' || k === 'ArrowUp') nudge(step);
    else if (k === 'ArrowLeft' || k === 'ArrowDown') nudge(-step);
    else if (k === 'Home') nudge(-s.d);
    else if (k === 'End') nudge(D_MAX[s.path] - s.d);
    else if ((k === ' ' || k === 'Enter') && !target.closest('button')) toggleDrive();
    else if (k === 'w' || k === 'W') toggleWheel();
    else if (k === 'b' || k === 'B') toggleBend();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'Escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  // the drive button keeps the width of its longest label, so nothing beside it moves when it changes
  {
    let widest = 0;
    for (const [act, icon] of Object.entries(DRIVE_ICONS)) {
      el.driveIc.innerHTML = icon;
      el.driveLabel.textContent = t(act);
      widest = Math.max(widest, el.drive.offsetWidth);
    }
    if (widest) el.drive.style.minWidth = `${Math.ceil(widest)}px`;
  }
  s.d = clampD(s.path, o.distance);
  applyPose();
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
     * Change any of: path ('straight' | 'turn': the car goes back to the start; the bend hides the tyre point),
     * wheel (show the tyre point: the straight road), distance (m the car has gone; animate: false jumps there,
     * otherwise it drives there), playing (true drives on to the end, false stops), view.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.path) await setPath(p.path, { animate });
      if (p.wheel != null) setWheel(p.wheel, { animate });
      if (p.distance != null) {
        if (animate) drive(Number(p.distance));
        else {
          stopDrive();
          setD(Number(p.distance));
        }
      }
      if (p.playing === true && !s.playing) drive(D_MAX[s.path], atEnd() ? { from: 0 } : {});
      if (p.playing === false) stopDrive();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      request++;
      stopDrive();
      s.wheel = false;
      s.path = 'straight';
      s.d = 0;
      applyPose();
      refresh();
      emitChange();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture(opts = {}) {
      const before = scene.background;
      if (opts.background !== undefined) scene.background = null;
      try {
        return stage.capture(opts);
      } finally {
        scene.background = before;
        stage.invalidate();
      }
    },
    exportRoot: () => car.root, // the car with its painted points, as it stands now
  };
}
