// Safe journey: velocity and force (নিরাপদ ভ্রমণ: বেগ ও বল, book pages 74–75, topic 3.5.2), student view. On a two-lane
// highway a heavy truck loaded with stones (m₁) and a small red car (m₂) wait in the same lane, facing each other.
// The speed is chosen in a row of words (২০, ৪০, ৬০ km/h); both go at it, the truck to the right (u), the car to the
// left (−u). Over the car, amber cubes in a square show its kinetic energy (½mv²): one cube is its energy at 20 km/h,
// so twice the speed makes a square twice as wide, four cubes; three times, nine. Velocity arrows lie on the road in
// front of each vehicle (blue, 0.04 m per km/h). The action plays the head-on crash with time slowed (the contact
// slowed much more): the car's front is squashed in proportion to its energy, its velocity goes from −u through zero
// to 3u (the book's sums with m₂ ≈ 0), and it is flung back the other way while the truck goes on at u. The panel is
// the kit's clean sheet (one action, one result, one rule): the speeds as one row of words (the cubes under each once
// seen), one big numbered action whose same badge rings the car (a tap on either vehicle does it too), one result
// line, and one rule in the book's words that grows from ½mv² through the crash's 4u to "keep the speed low". Then a
// short test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { ROAD, SKY, blobShadow, createRoad, skyTexture } from './road.js';
import { createBoldArrow } from './arrow.js';
import { TRUCK, createTruck } from './truck.js';
import { CAR, createCar } from './car.js';
import { ENERGY, createEnergy } from './energy.js';
import { fitPose } from './camera.js';
import { ARROW, BASE, CAR_LENGTH, KMH, SLOW, SPEEDS, clean, cubes, normalizeSpeed, plan as makePlan, stateAt } from './crash.js';

export const DEFAULTS = {
  speed: 20, // km/h: 20 | 40 | 60
  at: '', // s into the run: start with the crash already that far on (for pictures; a large number shows the end)
  tried: '', // speeds whose crash was already seen, e.g. '20,40' (their cubes show under the words)
  masses: 'book', // 'book' (m₂ ≈ 0, as the book) | 'real' (a 20,000 kg truck and a 1,000 kg car)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the car pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { velocity: '#1c6fd9', energy: '#9c5a00' }; // both read at 4.5:1 or more on the labels' white chips
const LANE = ROAD.lane; // z of the lane where they meet
const ROW_Z = ROAD.half - 0.55; // the velocity arrows lie on the road in front of the vehicles, inside the edge line
const ROW_Y = 0.2;
const KE_Y = CAR.height + 1.5; // the energy square stands on this height over the car's roof, clear of the ring round the car (and room for the badge)
const GHOST = 0.2; // after the crash the cubes stay as a faint ghost over the car: the energy that crushed it
const TRUCK_SHOWN = 3.8; // m of the truck (its cab and the front of its load) always in the picture
const DOUBLE_TAP = 450; // ms: a second tap this soon after one is ignored
const GROW = 0.7; // s for the energy square to grow or shrink to a new speed
const VIEW_3D = new THREE.Vector3(0.55, 0.62, 1).normalize();
const SUN = { x: 6, y: 30, z: 18 }; // the sun's place from the point the camera looks at (it glides with the camera)

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** A velocity in km/h for a sentence: whole numbers, the minus sign as "−" (prefix: '' or "প্রায়"). */
  const kmh = (v) => (Math.round(v) < 0 ? '−' : '') + N(Math.abs(Math.round(v)));
  const two = (x) => String(+x.toFixed(2));

  root.classList.add('pvc', 'sj');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'speeds', results: true, items: SPEEDS.map((v) => ({ id: String(v), label: 'speed' })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 2, outcome: 2, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  for (const b of sheet.words) {
    const word = b.querySelector('.pvc-ex-word');
    if (word) word.textContent = t('speed', { v: Number(b.dataset.example) });
  }

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 22, near: 1, far: 600, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.minDistance = 10;
  controls.maxDistance = 200;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(84); // the turned view stays above the road
  const world = new THREE.Group();
  world.name = 'SafeJourney';
  scene.add(world);
  // the sky (seen when the view is turned) and a haze over the far river, the colour of the sky low down
  if (o.bg !== 'transparent') {
    scene.background = skyTexture();
    scene.fog = new THREE.Fog(SKY.haze, 80, 260);
  }
  /** The haze starts a little behind the road and thickens toward the far bank, for a camera `d` m from the road. */
  function fitFog(d) {
    if (!scene.fog) return;
    scene.fog.near = d + 12;
    scene.fog.far = d + 190;
  }

  const road = createRoad();
  const truck = createTruck();
  const car = createCar();
  const energy = createEnergy();
  truck.root.position.z = LANE;
  car.root.position.z = LANE;
  energy.root.position.set(0, KE_Y, LANE);
  const truckShadow = blobShadow(TRUCK.length + 0.6, TRUCK.width + 0.9, 0.5);
  truckShadow.position.set(-TRUCK.length / 2, 0.012, 0);
  truck.root.add(truckShadow);
  const carShadow = blobShadow(CAR.length + 0.5, CAR.width + 0.7, 0.46);
  carShadow.position.set(CAR.length / 2, 0.012, 0);
  car.root.add(carShadow);
  world.add(road.root, truck.root, car.root, energy.root);

  // bold, inside a white rim, so they stand out on the asphalt at every size
  const arrows = {
    truck: createBoldArrow({ color: COLORS.velocity, radius: 0.11, head: 0.56, headRadius: 0.27, rim: 0.045, name: 'TruckVelocity' }),
    car: createBoldArrow({ color: COLORS.velocity, radius: 0.11, head: 0.56, headRadius: 0.27, rim: 0.045, name: 'CarVelocity' }),
  };
  for (const a of Object.values(arrows)) world.add(a.root);

  // the flash where the fronts meet: a pale star that grows and fades (not exported)
  const flash = (() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const r = i % 2 ? 0.42 : 1;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      i ? shape.lineTo(x, y) : shape.moveTo(x, y);
    }
    const m = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color: '#ffd43b', transparent: true, opacity: 0, depthWrite: false }),
    );
    m.name = 'Flash';
    m.userData.noExport = true;
    m.renderOrder = 3;
    m.visible = false;
    world.add(m);
    return m;
  })();

  // bits of the car left on the road where they met (paint, plastic, glass): more energy, more bits (not exported)
  const DEBRIS_MAX = 36;
  const debris = (() => {
    const m = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 0.35, 0.7),
      new THREE.MeshStandardMaterial({ name: 'Debris', color: '#ffffff', roughness: 0.6 }),
      DEBRIS_MAX,
    );
    m.name = 'Debris';
    m.userData.noExport = true;
    m.count = 0;
    m.frustumCulled = false;
    const colours = ['#c8423a', '#c8423a', '#41464d', '#d9e2ea', '#9aa3ad'].map((c) => new THREE.Color(c));
    let seed = 5;
    const r = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const bits = Array.from({ length: DEBRIS_MAX }, (_, i) => {
      m.setColorAt(i, colours[i % colours.length]);
      return { dx: (r() - 0.35) * 2.2, dz: 0.2 + r() * 1.25, size: 0.07 + r() * 0.13, turn: r() * Math.PI };
    });
    world.add(m);
    return { mesh: m, bits };
  })();
  const dm = new THREE.Matrix4();
  const dq = new THREE.Quaternion();
  const dp = new THREE.Vector3();
  const ds = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  /** The bits for a run (n of them), spread from the meeting point by k (0…1). */
  function placeDebris(x, n, k) {
    debris.mesh.count = n;
    for (let i = 0; i < n; i++) {
      const b = debris.bits[i];
      dp.set(x + b.dx * k, 0.03, LANE + b.dz * (0.3 + 0.7 * k));
      dq.setFromAxisAngle(UP, b.turn);
      ds.setScalar(b.size);
      debris.mesh.setMatrixAt(i, dm.compose(dp, dq, ds));
    }
    debris.mesh.instanceMatrix.needsUpdate = true;
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
    // a tight box round the road in view (fitShadow), so 1024 texels look as sharp as 2048 did on a loose one
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0004;
    sun.position.set(SUN.x, SUN.y, SUN.z);
    sun.target.position.set(0, 0, 0);
    scene.add(sun, sun.target);
    // the road and its verges take the shadows (the far scenery lies outside the shadow box)
    for (const m of road.root.children) if (m instanceof THREE.Mesh) m.receiveShadow = true;
    // only the parts whose shadows are seen cast them: not lamps, glass, hubs or bolts
    for (const obj of [truck.root, car.root])
      obj.traverse((m) => {
        if (m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false && !m.userData.smallPart)
          m.castShadow = true;
      });
    truckShadow.visible = carShadow.visible = false; // real shadows instead
  }

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── where a run is drawn: the camera keeps one width of road in view (the same scale at every speed) and
  // looks at the start (the same picture for every speed, the run's meeting point placed for it), then glides on
  // during the crash to look at the end: the truck going on and the car with its long arrow. ─────────────────
  /** The stretch of road (m, meeting point at 0) to show at the start and at the end of a run. */
  function spansOf(p) {
    const st0 = stateAt(p, 0);
    const end = stateAt(p, p.duration);
    const keHalf = energy.extent(p.speed / BASE) / 2;
    const start = { lo: st0.x1 - TRUCK_SHOWN, hi: Math.max(st0.rear + 0.4, st0.rear - CAR_LENGTH / 2 + keHalf + 2.2) };
    const mid = (end.front + end.rear) / 2;
    const finish = { lo: end.x1 - TRUCK_SHOWN, hi: Math.max(end.rear + 0.4, mid + (end.v2 / KMH) * ARROW + 0.9) };
    return { start, finish };
  }
  /** Where a run is drawn: its meeting point xc (the start centred on x = 0) and the end's centre c1 (cached). */
  const frames = new Map();
  function frameOf(p) {
    const key = `${p.speed}/${p.masses}`;
    if (!frames.has(key)) {
      const { start, finish } = spansOf(p);
      const xc = -(start.lo + start.hi) / 2;
      frames.set(key, { xc, c1: xc + (finish.lo + finish.hi) / 2 });
    }
    return frames.get(key);
  }
  const VIEW_WIDTH = Math.max(
    ...SPEEDS.flatMap((v) => {
      const { start, finish } = spansOf(makePlan(v));
      return [start.hi - start.lo, finish.hi - finish.lo];
    }),
  );
  /**
   * The shadow box: fitted round the road in view (its shoulders, the vehicles' height) as the sun sees it. The sun
   * glides with the camera, so the box is the same at every glide and is fitted once.
   */
  function fitShadow() {
    if (!sun) return;
    const look = new THREE.Matrix4().lookAt(new THREE.Vector3(SUN.x, SUN.y, SUN.z), new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
    const toLight = look.invert().multiply(new THREE.Matrix4().makeTranslation(-SUN.x, -SUN.y, -SUN.z));
    const half = VIEW_WIDTH / 2 + 4;
    const lo = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    const hi = new THREE.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    const p = new THREE.Vector3();
    for (const x of [-half, half])
      for (const y of [0, TRUCK.height + 0.2])
        for (const z of [-(ROAD.half + ROAD.shoulder), ROAD.half + ROAD.shoulder]) {
          p.set(x, y, z).applyMatrix4(toLight);
          lo.min(p);
          hi.max(p);
        }
    // the light looks down −z of its own frame: near and far from the depths
    Object.assign(sun.shadow.camera, {
      left: lo.x - 0.5,
      right: hi.x + 0.5,
      bottom: lo.y - 0.5,
      top: hi.y + 0.5,
      near: Math.max(0.5, -hi.z - 2),
      far: -lo.z + 2,
    });
    sun.shadow.camera.updateProjectionMatrix();
  }
  fitShadow();
  /** The camera's glide along the road at time tau of a run: 0 at the start, the end's centre once it has ended. */
  function panAt(run, tau) {
    const { p } = run;
    const { c1 } = frameOf(p);
    const k = THREE.MathUtils.smoothstep(tau, p.approach + 0.15 * p.contact, p.duration);
    return c1 * k;
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const masses = o.masses === 'real' ? 'real' : 'book';
  const s = {
    speed: normalizeSpeed(o.speed),
    masses,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    /** The scene: a run's plan, where it is drawn, and its clock (t0: running since; else held at tau). */
    run: null,
    tried: new Set(), // speeds whose crash was seen to the end (in learn mode)
    order: [], // the same, in the order they ended
    numbers: false, // the arrows' labels carry km/h (a test question)
    labels: true,
    ke: 1, // the energy square's side (cubes), animated toward the scene's speed
    keHidden: false,
    userMovedCamera: false,
    follow: 0, // m the camera has glided along the road from the start picture
    followHeld: false, // a glide back to the start is animating (the run does not move the camera meanwhile)
  };
  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let token = 0; // bumped by anything that calls off what is pending
  let lastTap = Number.NEGATIVE_INFINITY;

  /** A scene held at time tau (s) of the run at `speed` (0: waiting at the start). */
  function heldRun(speed, tau = 0) {
    const p = makePlan(speed, s.masses);
    return { p, xc: frameOf(p).xc, t0: null, tau, resolve: null, done: null, quiet: false, lastPhase: tau <= 0 ? 'ready' : stateAt(p, tau).phase };
  }
  const tauOf = (run) => (run.t0 == null ? run.tau : Math.min(run.p.duration + 1e-6, (now() - run.t0) / 1000));
  const current = () => stateAt(s.run.p, tauOf(s.run));
  const phaseNow = () => current().phase;

  // ── placing everything for a state of the run ───────────────────────────────
  const tmp = new THREE.Vector3();
  const XP = new THREE.Vector3(1, 0, 0);
  const XN = new THREE.Vector3(-1, 0, 0);
  const pts = {
    truckMid: new THREE.Vector3(),
    carMid: new THREE.Vector3(),
    keCorner: new THREE.Vector3(),
    truckTop: new THREE.Vector3(),
    carTop: new THREE.Vector3(),
  };
  function place() {
    const { p, xc } = s.run;
    const st = current();
    const start = stateAt(p, 0);
    truck.root.position.x = xc + st.x1;
    truck.roll(st.x1 - start.x1);
    car.root.position.x = xc + st.rear - CAR_LENGTH;
    car.crumple(st.crumple);
    car.roll(start.rear - st.rear);
    // the energy square rides over the car until the crash, then fades
    const fade = st.phase === 'contact' ? GHOST + (1 - GHOST) * Math.max(0, 1 - st.k / 0.3) : st.phase === 'after' || st.phase === 'end' ? GHOST : 1;
    const carMidX = xc + (st.front + st.rear) / 2;
    // over the car, a little toward its back (room for the numbered badge in front of it)
    energy.root.position.x = xc + st.rear - CAR_LENGTH / 2 + 0.4;
    energy.setSide(s.ke);
    energy.setOpacity(s.keHidden ? 0 : fade);
    // velocity arrows on the road: from the middle of each vehicle, 0.04 m per km/h
    const v1 = st.v1 / KMH;
    const v2 = st.v2 / KMH;
    const truckMidX = xc + st.x1 - TRUCK.length / 2;
    arrows.truck.set(tmp.set(truckMidX, ROW_Y, ROW_Z), v1 >= 0 ? XP : XN, Math.abs(v1) * ARROW);
    if (Math.abs(v2) * ARROW > 0.12) arrows.car.set(tmp.set(carMidX, ROW_Y, ROW_Z), v2 >= 0 ? XP : XN, Math.abs(v2) * ARROW);
    else arrows.car.hide();
    // the labels' dots sit on the road just in front of each arrow's middle, never on the arrow
    pts.truckMid.set(truckMidX + (v1 * ARROW) / 2, 0, ROW_Z + 0.42);
    pts.carMid.set(carMidX + (v2 * ARROW) / 2, 0, ROW_Z + 0.42);
    const half = energy.size / 2;
    pts.keCorner.set(energy.root.position.x + half, KE_Y + energy.size, LANE - ENERGY.depth / 2); // its top right corner
    pts.truckTop.set(xc + st.x1 - 1.1, TRUCK.height + 0.05, LANE);
    // the car's back end, half way up (the energy square is over its middle)
    pts.carTop.set(xc + st.rear - 0.1, CAR.height * 0.6, LANE);
    // bits on the road from the moment they meet (4 per cube of energy)
    if (st.phase === 'contact' || st.phase === 'after' || st.phase === 'end') {
      const n = Math.min(DEBRIS_MAX, Math.round(4 * cubes(p.speed)));
      placeDebris(xc, n, st.phase === 'contact' ? THREE.MathUtils.smoothstep(st.k, 0, 0.6) : 1);
    } else debris.mesh.count = 0;
    // the flash as the fronts meet
    if (st.phase === 'contact' && st.k < 0.35) {
      const k = st.k / 0.35;
      flash.visible = true;
      flash.position.set(xc + st.x1 + 0.1, 1.2, LANE + TRUCK.width / 2 + 0.2);
      flash.quaternion.copy(camera.quaternion);
      flash.scale.setScalar(0.6 + 1.5 * k);
      flash.material.opacity = 0.9 * (1 - k);
    } else flash.visible = false;
    // the camera glides along with the run (not while it glides back to the start by itself)
    if (!s.followHeld) setFollow(panAt(s.run, tauOf(s.run)));
    labelsFor(st);
    stage.invalidate();
    return st;
  }

  /** The camera has glided f m along the road from the start picture (its view and the sun move with it). */
  function setFollow(f) {
    const d = f - s.follow;
    if (Math.abs(d) < 1e-9) return;
    camera.position.x += d;
    controls.target.x += d;
    controls.update();
    s.follow = f;
    if (sun) {
      sun.position.set(f + SUN.x, SUN.y, SUN.z);
      sun.target.position.set(f, 0, 0);
    }
    stage.invalidate();
  }
  /** Glide the camera back to the start picture (after a run, before the next one). */
  function glideHome(animate = true) {
    tweener.cancel('follow');
    if (!animate || Math.abs(s.follow) < 0.01) {
      s.followHeld = false;
      setFollow(0);
      return Promise.resolve(true);
    }
    const from = s.follow;
    s.followHeld = true;
    return tweener
      .animate({
        key: 'follow',
        duration: Math.min(0.9, 0.4 + Math.abs(from) * 0.05),
        ease: ease.inOutCubic,
        onUpdate: (k) => setFollow(from * (1 - k)),
      })
      .finished.then((done) => {
        s.followHeld = false;
        return done;
      });
  }

  /** The truck's cab on the screen (canvas pixels): the numbered badge keeps off it. */
  const cabBox = new THREE.Box3();
  function truckBox() {
    const x = truck.root.position.x;
    cabBox.min.set(x - 2.2, 0.2, LANE - TRUCK.width / 2);
    cabBox.max.set(x + 0.1, TRUCK.height, LANE + TRUCK.width / 2);
    return screenBox(cabBox);
  }
  const corner8 = new THREE.Vector3();
  /** A box in the world on the screen (canvas pixels). */
  function screenBox(b) {
    const box = { left: Number.POSITIVE_INFINITY, top: Number.POSITIVE_INFINITY, right: Number.NEGATIVE_INFINITY, bottom: Number.NEGATIVE_INFINITY };
    for (const x of [b.min.x, b.max.x])
      for (const y of [b.min.y, b.max.y])
        for (const z of [b.min.z, b.max.z]) {
          corner8.set(x, y, z).project(camera);
          const px = (corner8.x * 0.5 + 0.5) * stage.width;
          const py = (-corner8.y * 0.5 + 0.5) * stage.height;
          box.left = Math.min(box.left, px);
          box.right = Math.max(box.right, px);
          box.top = Math.min(box.top, py);
          box.bottom = Math.max(box.bottom, py);
        }
    return box;
  }
  /** The energy square's box on the screen (canvas pixels), or null while it does not show: no label or badge on it. */
  const keBounds = new THREE.Box3();
  function keBox() {
    if (!energy.root.visible || energy.material.opacity < 0.3 || !energy.size) return null;
    const half = energy.size / 2;
    const x0 = energy.root.position.x;
    keBounds.min.set(x0 - half, KE_Y, LANE - ENERGY.depth / 2);
    keBounds.max.set(x0 + half, KE_Y + energy.size, LANE + ENERGY.depth / 2);
    return screenBox(keBounds);
  }

  // ── labels on the scene ─────────────────────────────────────────────────────
  /** @type {ReturnType<typeof createAnnotations>} */
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => action?.ringBox() ?? null, () => action?.box() ?? null, () => keBox()],
  });
  const below = [
    { dx: 0, dy: 18 },
    { dx: -26, dy: 18 },
    { dx: 26, dy: 18 },
    { dx: 0, dy: 36 },
    { dx: -46, dy: 28 },
    { dx: 46, dy: 28 },
  ];
  const shown = new Map(); // id → text now shown
  let vcYields = false;
  function label(id, text, opts) {
    if (!text) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!shown.has(id)) {
      anno.add(id, { text, ...opts });
      shown.set(id, text);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
    }
  }
  function labelsFor(st) {
    if (!s.labels) {
      for (const id of [...shown.keys()]) label(id, '');
      return;
    }
    const p = s.run.p;
    const after = st.phase === 'after' || st.phase === 'end';
    const real = p.masses === 'real';
    const v1 = st.v1 / KMH;
    const v2 = st.v2 / KMH;
    // the truck's velocity
    let tt;
    if (s.numbers) tt = after ? t('l_v1_num', { v: kmh(v1) }) : t('l_u_num', { v: kmh(v1) });
    else if (after) tt = real ? t('l_v1_real', { a: two(p.v1 / p.u) }) : t('l_v1');
    else tt = real && st.phase === 'contact' ? t('l_v1_live') : t('l_u');
    label('vt', tt, { point: () => pts.truckMid, kind: 'callout', color: COLORS.velocity, spots: below });
    // the car's velocity (no label while its arrow is too short to see)
    let ct = '';
    if (arrows.car.root.visible) {
      if (s.numbers) ct = after ? t('l_v2_num', { v: kmh(v2) }) : t('l_mu_num', { v: kmh(v2) });
      else if (after) ct = real ? t('l_v2_real', { b: two(p.v2 / p.u) }) : t('l_v2');
      else ct = st.phase === 'contact' ? t('l_v2_live') : t('l_mu');
    }
    // while they touch the two arrows meet: the car's (changing) label gives way when there is no room
    const yields = st.phase === 'contact';
    const had = shown.has('vc');
    label('vc', ct, { point: () => pts.carMid, kind: 'callout', color: COLORS.velocity, spots: below, optional: yields });
    if (had && shown.has('vc') && yields !== vcYields) anno.update('vc', { optional: yields });
    vcYields = yields;
    // the energy square, while it shows
    const keOn = energy.root.visible && energy.material.opacity > 0.5;
    label('ke', keOn ? t('l_ke') : '', {
      point: () => pts.keCorner,
      kind: 'callout',
      color: COLORS.energy,
      spots: [
        { dx: 12, dy: 0 },
        { dx: 0, dy: -18 },
        { dx: -14, dy: -16 },
        { dx: 12, dy: 18 },
        { dx: 0, dy: -40 },
        { dx: -30, dy: -40 },
      ],
    });
    // the two vehicles' names (only their symbols on a narrow stage), where there is room
    const short = stage.width < 520;
    label('truck', t(short ? 'l_m1' : 'l_truck'), {
      point: () => pts.truckTop,
      kind: 'part',
      optional: true,
      spots: [
        { dx: 0, dy: -18 },
        { dx: -30, dy: -18 },
        { dx: 30, dy: -18 },
        { dx: 0, dy: -34 },
      ],
    });
    label('car', t(short ? 'l_m2' : 'l_car'), {
      point: () => pts.carTop,
      kind: 'part',
      optional: true,
      spots: [
        { dx: 22, dy: -4 },
        { dx: 22, dy: -20 },
        { dx: 36, dy: -4 },
        { dx: 36, dy: 14 },
        { dx: 34, dy: -30 },
        { dx: -22, dy: -30 },
      ],
    });
  }

  // ── the run ─────────────────────────────────────────────────────────────────
  /** The scene waits at the start of a run at `speed`; the energy square grows or shrinks to it. */
  function setReady(speed, { animate = true } = {}) {
    if (s.run?.resolve) s.run.resolve(false);
    s.run = heldRun(speed, 0);
    glideHome(animate);
    growEnergy(speed / BASE, animate);
    place();
    refresh();
  }
  function growEnergy(side, animate = true) {
    tweener.cancel('energy');
    if (!animate || Math.abs(side - s.ke) < 1e-6) {
      s.ke = side;
      if (s.run) place();
      return Promise.resolve(true);
    }
    const from = s.ke;
    return tweener.animate({
      key: 'energy',
      duration: GROW,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.ke = from + (side - from) * k;
        if (s.run) place();
      },
    }).finished;
  }

  /** Play the run from tau (s): it ends held at the end. Resolves true when it reaches the end undisturbed. */
  function startRun({ quiet = false, at = 0, count = false } = {}) {
    const run = heldRun(s.run?.p.speed ?? s.speed, at);
    run.quiet = quiet;
    run.t0 = now() - at * 1000;
    // a jump into the run (a picture) does not count as a crash seen; a played one, even jumped to its end, does
    run.lastPhase = at > 0 && !count ? stateAt(run.p, at).phase : 'approach';
    run.done = new Promise((r) => (run.resolve = r));
    if (s.run?.resolve) s.run.resolve(false);
    s.run = run;
    s.ke = run.p.speed / BASE;
    if (!quiet) audio.pop();
    emit('play', { speed: run.p.speed });
    tick();
    return run.done;
  }

  /** Each frame while a run plays: everything where the run says, the phase changes, the end. */
  function tick() {
    const run = s.run;
    if (!run || run.t0 == null) return false;
    const st = place();
    if (st.phase !== run.lastPhase) {
      const was = run.lastPhase;
      run.lastPhase = st.phase;
      if (st.phase === 'contact' && was === 'approach') {
        if (!run.quiet) audio.contact();
        emit('crash', { speed: run.p.speed });
      }
      if (st.phase === 'end') {
        run.tau = run.p.duration;
        run.t0 = null;
        if (s.mode === 'explore') {
          const v = run.p.speed;
          if (s.tried.has(v)) s.order.splice(s.order.indexOf(v), 1);
          s.tried.add(v);
          s.order.push(v);
        }
        emit('end', snapshot());
        run.resolve?.(true);
        run.resolve = null;
      }
      emitChange();
    }
    refresh();
    return run.t0 != null;
  }
  stage.addTicker(() => tick());
  // a few more frames after each change, so the labels and the numbered badge settle round each other
  let settle = 0;
  stage.addTicker(() => settle-- > 0);

  // ── the panel: one action, one result, one rule ─────────────────────────────
  const outcomeEl = ui.$('.pvc-outcome');
  /**
   * What the big button (and a tap on a vehicle) does now: play the crash at this speed; once a crash has ended, play
   * it at the next speed not tried yet, in the row's order (that word is marked in the row). The badge's number is the
   * student's own step: the speeds tried so far + 1; "আবার চালাও" has none.
   */
  function plan() {
    const step = s.tried.size + 1;
    const ph = s.run ? phaseNow() : 'ready';
    if (ph === 'ready') return { speed: s.speed, label: 'act_go', step };
    if (ph !== 'end') return { speed: s.speed, label: 'act_again', step: '' };
    const next = SPEEDS.find((v) => !s.tried.has(v) && v !== s.speed);
    return next ? { speed: next, label: 'act_at', step } : { speed: s.speed, label: 'act_again', step: '' };
  }

  function outcomeHtml(st) {
    const p = s.run.p;
    if (st.phase === 'ready') return [t('out_ready', { v: p.speed, n: two(cubes(p.speed)) }), 'energy'];
    if (st.phase === 'approach' || st.phase === 'contact') {
      // the honest note about time, in small after the velocities
      const slow = st.phase === 'contact' ? t('note_contact') : t('note_slow', { n: SLOW });
      return [t('out_run', { v: kmh(st.v2 / KMH), w: kmh(st.v1 / KMH), slow }), 'velocity'];
    }
    const vars = { a: kmh(-p.speed), b: kmh(p.kmh.v2), c: kmh(p.kmh.change), k: two((p.v2 + p.u) / p.u) };
    return [t(p.masses === 'real' ? 'out_end_real' : 'out_end', vars), 'velocity'];
  }

  function ruleHtml(st) {
    const p = s.run.p;
    const v = p.speed;
    if (st.phase === 'ready') {
      if (SPEEDS.every((x) => s.tried.has(x))) return t('rule_final');
      if (v <= BASE) return t('rule_ke_1', { v: BASE });
      if (v === 2 * BASE) return t('rule_ke_2', { a: BASE, v, n0: 1, n: two(cubes(v)) });
      return t('rule_ke_3', { a: BASE, v, n: two(cubes(v)) });
    }
    if (st.phase === 'approach') return t('rule_approach');
    if (st.phase === 'contact') return t('rule_contact');
    if (p.masses === 'real') {
      return t('rule_end_real', { a: two(p.v1 / p.u), b: two(p.v2 / p.u), c: two((p.v2 + p.u) / p.u), d: two((p.u - p.v1) / p.u) });
    }
    if (s.mode === 'explore' && st.phase === 'end' && SPEEDS.every((x) => s.tried.has(x)) && s.order.length >= 3) return t('rule_final');
    const before = [...s.order].reverse().find((x) => x !== v);
    if (s.mode !== 'explore' || before == null) return t('rule_end', { z: 0 });
    const vars = { a: before, b: v, m: two(cubes(before)), n: two(cubes(v)) };
    return t(v > before ? 'rule_more' : 'rule_less', vars);
  }

  let lastKind = '';
  let chosen = '';
  function refresh() {
    if (!s.run) return;
    const st = current();
    if (chosen !== String(s.speed)) sheet.choose((chosen = String(s.speed))); // the row is written only when it changes
    for (const v of SPEEDS) sheet.result(String(v), s.tried.has(v) ? t('res_cubes', { n: two(cubes(v)) }) : '');
    const [html, kind] = outcomeHtml(st);
    sheet.outcome(html);
    if (kind !== lastKind) outcomeEl.dataset.k = lastKind = kind;
    sheet.rule(ruleHtml(st));
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: () => t(p.label, { v: p.speed }) });
      sheet.next(p.speed !== s.speed ? String(p.speed) : null);
      // the ring shows on the car while it waits (at the start or at the end), never while it moves
      if (st.phase === 'ready' || st.phase === 'end') action.show('run');
      else action.hide('run');
    }
    settle = 4;
    stage.invalidate();
  }

  function snapshot() {
    const run = s.run;
    const st = current();
    const p = run.p;
    const after = st.phase === 'after' || st.phase === 'end';
    const nx = plan();
    return {
      speed: p.speed, // km/h
      masses: p.masses,
      phase: st.phase, // 'ready' | 'approach' | 'contact' | 'after' | 'end'
      time: clean(tauOf(run), 3), // s into the run (screen time)
      truck: clean(st.v1 / KMH, 3), // km/h, to the right positive
      car: clean(st.v2 / KMH, 3),
      change: after ? clean(p.kmh.change, 3) : null, // km/h: the car's velocity change (4u with m₂ ≈ 0)
      cubes: cubes(p.speed), // the car's kinetic energy in cubes (its energy at 20 km/h)
      crumple: clean(st.crumple, 3), // m
      tried: SPEEDS.filter((v) => s.tried.has(v)),
      view: s.view,
      mode: s.mode,
      next: { speed: nx.speed, step: nx.step },
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.speed, snap.phase, snap.tried, snap.mode, snap.masses]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  /** A new speed: whatever plays is called off and both wait at the start. */
  function chooseSpeed(v, { animate = true, quiet = false } = {}) {
    if (s.locked && !quiet) return lockedNudge();
    const speed = normalizeSpeed(v);
    ++token;
    const changed = speed !== s.speed;
    s.speed = speed;
    setReady(speed, { animate });
    if (changed) emit('speed', { speed });
    emitChange();
  }

  function goHome({ animate = true } = {}) {
    ++token;
    setReady(s.speed, { animate });
    emitChange();
  }

  /** The action: the big button, its badge, a tap on a vehicle, Space/Enter/→. */
  async function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastTap < DOUBLE_TAP) return; // a double tap must not undo the first
    lastTap = now();
    hintOff();
    const p = plan();
    const my = ++token;
    if (p.speed !== s.speed || phaseNow() !== 'ready') {
      const grow = p.speed !== s.speed;
      s.speed = p.speed;
      setReady(p.speed);
      if (grow) {
        emit('speed', { speed: p.speed });
        await wait(GROW * 1000 + 250); // the cubes grow to the new speed first
      } else await wait(150);
      if (my !== token || s.locked) return;
    }
    startRun();
    emitChange();
  }

  /** The ring's box round the car: its body above the wheels, thin across, so the ring stays clear of its arrow. */
  const ringBox = new THREE.Box3();
  function carRing() {
    const st = current();
    const x0 = s.run.xc + st.front - 0.2;
    const x1 = s.run.xc + st.rear + 0.05;
    ringBox.min.set(x0, 0.3, LANE - 0.05);
    ringBox.max.set(x1, CAR.height - 0.08, LANE + 0.05);
    return ringBox;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_go',
    target: () => (s.run ? carRing() : null),
    pad: 3,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), () => keBox(), () => truckBox()],
    pulse: Boolean(o.coach),
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── camera ──────────────────────────────────────────────────────────────────
  /** 0 for a portrait or square stage … 1 for a wide one (2:1 and wider). */
  const wideness = () => Math.min(1, Math.max(0, (stage.width / Math.max(1, stage.height) - 1.05) / 1.0));
  const viewBox = new THREE.Box3();
  function viewPose(view = s.view) {
    const top = KE_Y + energy.extent(SPEEDS[SPEEDS.length - 1] / BASE) + 0.4;
    viewBox.min.set(-VIEW_WIDTH / 2, 0, LANE - TRUCK.width / 2 - 0.3);
    viewBox.max.set(VIEW_WIDTH / 2, top, ROW_Z + 0.5);
    const e = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(40, 15, wideness()));
    const dir = view === '3d' ? VIEW_3D : new THREE.Vector3(0, Math.sin(e), Math.cos(e));
    const fit = (top) => fitPose({ box: viewBox, dir, camera, width: stage.width, height: stage.height, margin: { top, bottom: 34, side: 6 } });
    let pose = fit(50);
    if (view !== '3d') {
      // when the road's width sets the scale (a tall stage), the room left over goes above it (the trees), not below
      const d0 = pose.position.distanceTo(pose.target);
      for (let extra = 12; extra < stage.height * 0.5; extra += 12) {
        const next = fit(50 + extra);
        if (next.position.distanceTo(next.target) > d0 * 1.002) break;
        pose = next;
      }
    }
    pose.position.x += s.follow;
    pose.target.x += s.follow;
    fitFog(pose.position.distanceTo(pose.target));
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
    if (s.locked && view !== 'front') return lockedNudge();
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = !s.locked; // the test keeps the view still
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
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
    refresh();
  });

  // ── touching the scene: a tap on the truck or the car plays ─────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects([truck.hit, car.hit], false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const ph = phaseNow();
      if (ph !== 'ready' && ph !== 'end') {
        if (now() - lastTap > DOUBLE_TAP) showHint(t('hint_wait'), { duration: 2400 });
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
  /** Four tap choices (the right one first): shuffled, with the index of the right one. */
  function textChoices(items, kind, extra = {}) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="sj-opt">${list[j].text}</span>`,
      meta: { kind, answer: items[0].key, ...extra },
    };
  }
  const item = (key, vars, text) => ({ key, text: text ?? t(key, vars) });
  /** The five kinds in a random order: the crash's velocity before the two pictures after it; ×4 before "which lowers". */
  function questionOrder() {
    const kinds = ['ke', 'safe', 'v2', 'change', 'truck'];
    for (let i = 0; i < 200; i++) {
      shuffle(kinds);
      const at = (k) => kinds.indexOf(k);
      if (at('v2') < at('change') && at('v2') < at('truck') && at('ke') < at('safe')) break;
    }
    return kinds;
  }

  let learnSaved = null;
  let kinds = [];
  let question = null;
  const qText = ui.$('.pvc-q-text');
  /** The question's words (HTML: m₂ has a subscript); the quiz itself would write them as plain text. */
  function ask(html, rest) {
    qText.innerHTML = html;
    return rest;
  }

  /** A clean scene for a question: nothing playing, the front view, labels as the question wants. */
  function questionScene(speed, tau = 0, { numbers = false } = {}) {
    ++token;
    tweener.cancel('energy');
    tweener.cancel('follow');
    s.followHeld = false;
    s.numbers = numbers;
    s.keHidden = false;
    if (s.run?.resolve) s.run.resolve(false);
    s.run = heldRun(speed, tau);
    s.ke = speed / BASE;
    if (s.view !== 'front') setView('front', { animate: false });
    place();
    refresh();
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
        learnSaved = { speed: s.speed, tried: new Set(s.tried), order: [...s.order], masses: s.masses };
        s.mode = 'quiz';
        s.masses = 'book'; // the test asks about the book's sums (m₂ ≈ 0)
        s.locked = true;
        hintOff();
        kinds = questionOrder();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.numbers = false;
        s.keHidden = false;
        ++token;
        const saved = learnSaved || { speed: SPEEDS[0], tried: new Set(), order: [], masses };
        s.masses = saved.masses;
        s.tried = new Set(saved.tried);
        s.order = [...saved.order];
        s.speed = saved.speed;
        setReady(s.speed, { animate: false });
        syncUI();
        setView(s.view, { animate: false });
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        const kind = kinds[i % kinds.length];
        if (kind === 'ke') {
          const k = pickOne([2, 3]);
          const a = BASE;
          const b = a * k;
          questionScene(a);
          const n = k * k;
          const wrong = k === 2 ? [2, 8, 1] : [3, 27, 6];
          const items = [n, ...wrong].map((x) => item(`n${x}`, null, t('c_cubes', { n: x })));
          question = { kind, k, a, b, n, wrong };
          return ask(t('q_ke', { a, b, k, one: 1 }), textChoices(items, kind, { n }));
        }
        if (kind === 'safe') {
          const v = 60;
          questionScene(v);
          const h = v / 2;
          // a third of the mass is a bigger cut than half the speed, but the speed is squared
          const items = [item('s_half_v', { h }), item('s_third_m'), item('s_half_m'), item('s_minus20', null, t('s_minus', { d: 20 }))];
          question = { kind, v };
          return ask(t('q_safe', { v }), textChoices(items, kind));
        }
        if (kind === 'v2') {
          const v = pickOne(SPEEDS);
          const p = makePlan(v, s.masses);
          questionScene(v, Math.max(0.01, p.approach - 0.6), { numbers: true });
          const kv = (key, x) => item(key, null, t('c_kmh', { v: kmh(x) }));
          const items = [kv('v_3u', 3 * v), kv('v_4u', 4 * v), kv('v_u', v), kv('v_m3u', -3 * v)];
          question = { kind, v };
          return ask(t('q_v2', { z: 0 }), textChoices(items, kind));
        }
        if (kind === 'change') {
          const v = pickOne(SPEEDS.filter((x) => x !== question?.v));
          const p = makePlan(v, 'book');
          questionScene(v, p.duration, { numbers: true });
          const c = p.kmh.change;
          const b = p.kmh.v2;
          const items = [
            item('ch_ok', null, t('c_kmh', { v: kmh(c) })),
            item('ch_drop', null, t('c_kmh', { v: kmh(b - v) })),
            item('ch_final', null, t('c_kmh', { v: kmh(b) })),
            item('ch_order', null, t('c_kmh', { v: kmh(-c) })),
          ];
          question = { kind, v, b, c };
          return ask(t('q_change', { a: kmh(-v) }), textChoices(items, kind));
        }
        // why the truck's velocity hardly changes: the end of a crash
        const v = pickOne(SPEEDS.filter((x) => x !== question?.v));
        questionScene(v, makePlan(v, 'book').duration);
        if (!alive()) return null;
        const items = [item('t_mass'), item('t_faster'), item('t_noforce'), item('t_less')];
        question = { kind: 'truck', v };
        return ask(t('q_truck'), textChoices(items, 'truck'));
      },
      reveal(q, correct, picked) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked?.index]?.key;
        const note1 = (map) => (wrongKey && map[wrongKey] ? map[wrongKey]() : '');
        if (k === 'ke') {
          const { k: f, b, n } = question;
          // the square grows to the new speed, the arrows lengthen
          s.run = heldRun(b, 0);
          growEnergy(f);
          place();
          const vars = { k: f, n, p: 2, two: 2 };
          const lin = () => t('n_ke_lin');
          return (
            t('why_ke', vars) +
            note1({
              n2: lin,
              n3: lin,
              n8: () => t('n_ke_cube', vars),
              n27: () => t('n_ke_cube', vars),
              n1: () => t('n_ke_same'),
              n6: () => t('n_ke_twice', vars),
            })
          );
        }
        if (k === 'safe') {
          const h = question.v / 2;
          s.run = heldRun(h, 0);
          growEnergy(h / BASE);
          place();
          const n = cubes(question.v);
          return (
            t('why_safe', { n: two(n), y: two(cubes(h)), p: 2 }) +
            note1({
              s_third_m: () => t('n_third_m', { x: two(n / 3) }),
              s_half_m: () => t('n_half_m', { x: two(n / 2) }),
              s_minus20: () => t('n_minus', { w: question.v - 20, x: two(cubes(question.v - 20)) }),
            })
          );
        }
        if (k === 'v2') {
          startRun({ quiet: true, at: s.run.tau });
          const v = question.v;
          return (
            t('why_v2', { b: kmh(3 * v) }) +
            note1({ v_4u: () => t('n_v2_4u', { c: t('c_kmh', { v: kmh(4 * v) }) }), v_u: () => t('n_v2_u'), v_m3u: () => t('n_v2_m3u') })
          );
        }
        if (k === 'change') {
          const { v, b, c } = question;
          const vars = { a: kmh(-v), b: kmh(b), c: kmh(c), u: kmh(v) };
          return (
            t('why_change', vars) + note1({ ch_drop: () => t('n_ch_drop', vars), ch_final: () => t('n_ch_final'), ch_order: () => t('n_ch_order') })
          );
        }
        return t('why_truck', { z: 0 }) + note1({ t_faster: () => t('n_t_faster'), t_noforce: () => t('n_t_noforce'), t_less: () => t('n_t_less') });
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
    if (!s.locked) controls.enableRotate = true; // the test keeps the view still; afterwards a drag turns it again
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
    if (b.dataset.example) chooseSpeed(Number(b.dataset.example));
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
    const sceneKey =
      ['1', '2', '3', 'r', 'R', 'Home', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    const at = SPEEDS.indexOf(s.speed);
    if (['1', '2', '3'].includes(k)) chooseSpeed(SPEEDS[Number(k) - 1]);
    else if (k === 'ArrowUp') chooseSpeed(SPEEDS[Math.min(SPEEDS.length - 1, at + 1)]);
    else if (k === 'ArrowDown') chooseSpeed(SPEEDS[Math.max(0, at - 1)]);
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  function markTried(list) {
    for (const v of list.map((x) => Number(String(x).trim())).filter((x) => SPEEDS.includes(x))) {
      if (!s.tried.has(v)) s.order.push(v);
      s.tried.add(v);
    }
  }
  markTried(String(o.tried || '').split(','));
  setReady(s.speed, { animate: false });
  setView(s.view, { animate: false });
  syncUI();
  const at = o.at === '' || o.at == null ? null : Number(o.at);
  if (at != null && Number.isFinite(at)) {
    startRun({ quiet: true, at: Math.max(0, at) });
    tick();
  }
  refresh();
  emitChange();
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
     * Change any of: speed (20 | 40 | 60 km/h; both wait at the start), masses ('book' | 'real'), tried (speeds already
     * crashed, e.g. [20, 40]), home (true: back to the start), play (true: the crash, as the button), at (s into the
     * run: jump there; a large number shows the end), view; animate: false jumps (play lands at the end).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.masses === 'book' || p.masses === 'real') {
        s.masses = p.masses;
        setReady(s.speed, { animate: false });
      }
      if (p.tried) {
        markTried(Array.isArray(p.tried) ? p.tried : String(p.tried).split(','));
        refresh();
      }
      if (p.speed != null) chooseSpeed(p.speed, { animate, quiet: true });
      if (p.home) goHome({ animate });
      if (p.at != null) {
        ++token;
        startRun({ quiet: true, at: Math.max(0, Number(p.at) || 0) });
        tick();
      } else if (p.play) {
        ++token;
        const done = startRun({ quiet: true, at: animate ? 0 : 1e6, count: true });
        tick();
        if (!animate) await done;
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      ++token;
      s.tried.clear();
      s.order.length = 0;
      s.masses = masses;
      s.speed = DEFAULTS.speed;
      setReady(s.speed, { animate: false });
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The truck, the car (as it is now) and 40 m of road under them (no scenery), in metres. */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'SafeJourney';
      const stretch = createRoad({ length: 40, scenery: false }).root;
      stretch.position.x = (truck.root.position.x + car.root.position.x) / 2;
      copy.add(stretch, truck.root.clone(true), car.root.clone(true));
      return copy;
    },
  };
}
