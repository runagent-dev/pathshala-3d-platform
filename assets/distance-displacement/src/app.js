// Distance and displacement (book page 39, topic 2.4), student view. A cyclist rides the winding road of চিত্র ২.০৪
// from A. The blue trail behind it is the distance travelled (দূরত্ব: how far along the path, just a size, a scalar);
// the straight orange arrow from A to the cyclist is the displacement (সরণ: how far and which way from A, a vector).
// Drag the cyclist, tap the road, or ride to B (4 km of road, but only 2 km from A), to C (6 km, 1.31 km) and back
// to A (the distance keeps growing, the displacement becomes zero). Then a short test. Built on the shared student
// kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { createCountryside, FRAME, KM, ROAD_Y } from './countryside.js';
import { createCyclist, SCALE } from './cyclist.js';
import { COLORS, createArrow, createTrail } from './marks.js';
import { createValueTags } from './values.js';
import {
  COMPASS,
  COUNT,
  END,
  STEP,
  STOPS,
  compass8,
  displacement,
  fmtKm,
  fmtShort,
  headingAt,
  nearestKm,
  pointAt,
  roundTo,
  stopAt,
  travelled,
  turn,
} from './road.js';

export const DEFAULTS = {
  km: 0, // where the cyclist starts, km along the road from A (as if it had ridden there from A)
  view: 'front', // 'front' (from above, north up, like the book's picture) | '3d' (lower, turn it round)
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

/**
 * Where the camera looks from. 'front': from the south, north up as in the book's picture, higher in a tall view
 * (a phone held upright) and lower in a wide one, so the tile fills either. '3d': lower, from the south-west.
 */
function viewDir(view, aspect, out = new THREE.Vector3()) {
  if (view === '3d') return out.set(-0.62, 0.66, 0.86).normalize();
  const up = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(64 - ((aspect - 0.95) / 1.5) * 22, 42, 64));
  return out.set(0, Math.sin(up), Math.cos(up));
}
const RIDE_SPEED = 2.4; // km of road per second of animation (not to time: speed is the next figure's topic)
const LAST = Math.round(END / STEP); // the last sample the cyclist reaches
const PLACES = { A: STOPS.A, B: STOPS.B, C: STOPS.C };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const K = (km) => N(fmtKm(km)); // km with two decimals (the live readings), in the language's digits
  const S = (km) => N(fmtShort(km)); // km as in a sentence: 4, 1.31, 12

  root.classList.add('pvc', 'dd');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="dd-read">
            <div class="dd-card dist">
              <span class="k">${t('distance')} <small>${t('scalar')}</small></span>
              <span class="v"><b>0</b> <span class="u">${t('unit_km')}</span></span>
              <span class="s">${t('dist_note')}</span>
            </div>
            <div class="dd-card disp">
              <span class="k">${t('displacement')} <small>${t('vector')}</small></span>
              <span class="v"><b>0</b> <span class="u">${t('unit_km')}</span></span>
              <span class="s"><svg class="dd-needle" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0 -8.5 5.5 6 0 2.6 -5.5 6Z"/></svg><span class="dd-dir"></span></span>
            </div>
          </div>
          <p class="pvc-learn-extra dd-extra"></p>
          <div class="pvc-learn-foot dd-foot">
            <button class="pvc-btn" data-act="ride" data-to="B">${t('act_b')}</button>
            <button class="pvc-btn" data-act="ride" data-to="C">${t('act_c')}</button>
            <button class="pvc-btn" data-act="ride" data-to="A">${t('act_a')}</button>
            <button class="pvc-btn dd-new" data-act="new" title="${t('act_new_long')}">${t('act_new')}</button>
          </div>`,
  });

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 40, far: 40000, environment: 'studio-light', exposure: 1.05 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 1500;
  controls.maxDistance = 14000;
  controls.maxPolarAngle = 1.35; // never under the tile
  const world = new THREE.Group();
  world.name = 'DistanceDisplacementScene';
  scene.add(world);
  const country = createCountryside({ renderer: stage.renderer, t, N });
  world.add(country.root);
  const trail = createTrail();
  const arrow = createArrow();
  const cyclist = createCyclist();
  world.add(trail.group, arrow.group, cyclist.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  scene.add(new THREE.HemisphereLight('#ffffff', '#8a7a5a', 0.9));
  const sun = new THREE.DirectionalLight('#ffffff', 1.5);
  sun.position.set(1800, 4200, 2600);
  sun.target.position.set(600, 0, -1000);
  scene.add(sun, sun.target);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -2600, right: 2600, top: 2600, bottom: -2600, near: 1000, far: 9000 });
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0004;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.ShadowMaterial({ opacity: 0.12 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -71;
    floor.receiveShadow = true;
    floor.userData.noExport = true;
    scene.add(floor);
  }
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    km: 0, // the cyclist's place, km along the road from A
    trip: 0, // the distance travelled since the trip began at A, km
    legs: [], // the trip's legs, km: + going out, − coming back (a turn-round makes a new leg)
    rolled: 0, // metres the wheels have turned (for the pedals; the coach's little demo turns them too)
    dir: 1, // the way the cyclist faces: 1 the way km grows, −1 back towards A
    yaw: 0,
    yawTarget: 0,
    riding: false,
    dragging: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    values: true, // the values on the map (hidden in the test until the answer)
    userMovedCamera: false,
  };

  /** The displacement's size (the road data's metre of tracing error never shows it bigger than the distance). */
  const size = (d) => (d.km > s.trip && d.km - s.trip < 0.002 ? s.trip : d.km);

  /** The legs to show: a turn-round of less than 50 m is a wobble, counted in the leg before it (the sum stays). */
  function legs() {
    const out = [];
    for (const leg of s.legs) {
      const last = out.length - 1;
      if (last >= 0 && (Math.abs(leg) < 0.05 || Math.sign(leg) === Math.sign(out[last]))) out[last] += Math.sign(out[last]) * Math.abs(leg);
      else out.push(leg);
    }
    return out.map(Math.abs);
  }
  /** "৬ + ৬ + ৬ + ৬" (at most four parts shown; more become "৬ + … + ৬"). */
  const legSum = (list) => (list.length > 4 ? [list[0], list[1], null, list.at(-1)] : list).map((v) => (v == null ? '…' : S(v))).join(' + ');

  function snapshot() {
    const d = displacement(s.km);
    return {
      km: roundTo(s.km, 0.001),
      trip: roundTo(s.trip, 0.001),
      legs: legs().map((v) => roundTo(v, 0.001)),
      displacement: {
        km: roundTo(size(d), 0.001),
        east: roundTo(d.east, 0.001),
        north: roundTo(d.north, 0.001),
        bearing: d.bearing == null ? null : roundTo(d.bearing, 0.1),
        dir: compass8(d.bearing),
      },
      at: stopAt(s.km),
      riding: s.riding,
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.km}|${snap.trip}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    dist: $('.dd-card.dist b'),
    legs: $('.dd-card.dist .s'),
    disp: $('.dd-card.disp b'),
    dir: $('.dd-dir'),
    needle: $('.dd-needle'),
    extra: $('.dd-extra'),
    toB: $('[data-act="ride"][data-to="B"]'),
  };

  function extraLine(d) {
    const at = stopAt(s.km);
    const parts = legs();
    const vars = {
      dist: S(s.trip),
      disp: S(size(d)),
      dir: d.bearing == null ? '' : t(`dir_${compass8(d.bearing)}`),
      sum: legSum(parts),
      out: S(parts[0] ?? 0),
      back: S(parts[1] ?? 0),
      stop: stopAt(parts[0] ?? 0) ?? '',
    };
    if (s.trip < 0.005) return t('idea');
    if (s.riding || s.dragging) return t('line_moving');
    if (at === 'A') {
      if (parts.length === 2) return t(vars.stop ? 'line_back_stop' : 'line_back_km', vars); // there and back
      return t(parts.length > 2 ? 'line_back_sum' : 'line_back', vars);
    }
    if (at === 'B' && parts.length === 1) return t('line_b', vars);
    if (at === 'C' && parts.length === 1) return t('line_c', vars);
    return t(parts.length > 1 ? 'line_any_legs' : 'line_any', vars);
  }

  function refresh() {
    const d = displacement(s.km);
    el.dist.textContent = K(s.trip);
    // the distance's parts: out and back, so a round trip's 12 km reads 6 + 6
    const parts = legs();
    el.legs.textContent =
      parts.length === 2 ? t('dist_legs2', { a: S(parts[0]), b: S(parts[1]) }) : parts.length > 2 ? legSum(parts) : t('dist_note');
    el.disp.textContent = K(size(d));
    const none = d.km < 0.005;
    el.dir.textContent = none ? t('dir_none') : t('dir_line', { dir: t(`dir_${compass8(d.bearing)}`) });
    el.needle.style.display = none ? 'none' : '';
    el.needle.style.transform = `rotate(${d.bearing ?? 0}deg)`;
    el.extra.textContent = extraLine(d);
    el.toB.classList.toggle('primary', s.trip < 0.005); // the book's own example, first
    texts.dist = s.values && s.trip > 0.005 ? t('pill_dist', { v: S(s.trip) }) : null;
    texts.disp = s.values && d.km > 0.005 ? t('pill_disp', { v: S(size(d)) }) : null;
    stage.invalidate();
  }

  // ── what is where on the screen: the labels, the cyclist, the arrow, the values ──
  const values = createValueTags(ui.annoLayer, COLORS);
  const texts = { dist: null, disp: null };
  const cyclistBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const arrowOnScreen = { a: { x: 0, y: 0 }, b: { x: 0, y: 0 } };
  const view = { width: 1, height: 1, top: 0, cornerX: 0, cyclist: cyclistBox, arrow: null, plates: [] };
  const corner = new THREE.Vector3();
  const toPx = (p, out) => {
    corner.copy(p).project(camera);
    out.x = ((corner.x + 1) / 2) * stage.width;
    out.y = ((1 - corner.y) / 2) * stage.height;
    return out;
  };
  const px = { x: 0, y: 0 };
  function measureCorner() {
    const sr = ui.stage.getBoundingClientRect();
    const cr = ui.corner.getBoundingClientRect();
    view.top = cr.bottom - sr.top + 4;
    view.cornerX = cr.left - sr.left - 4;
  }
  stage.onBeforeRender(() => {
    camera.updateMatrixWorld();
    cyclist.root.updateMatrixWorld();
    Object.assign(cyclistBox, { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
    for (const [y, z] of [
      [0, 0.95],
      [0, -0.95],
      [1.9, 0.45],
      [1.9, -0.45],
    ]) {
      toPx(cyclist.root.localToWorld(corner.set(0, y * SCALE, z * SCALE)), px);
      cyclistBox.x0 = Math.min(cyclistBox.x0, px.x - 6);
      cyclistBox.x1 = Math.max(cyclistBox.x1, px.x + 6);
      cyclistBox.y0 = Math.min(cyclistBox.y0, px.y - 4);
      cyclistBox.y1 = Math.max(cyclistBox.y1, px.y + 4);
    }
    // the labels on the map: smaller on small screens, and never over the cyclist
    const labelSize = THREE.MathUtils.clamp(Math.min(stage.width, stage.height * 1.25) / 440, 0.62, 1.05);
    view.plates = country.labels.update(camera, stage.width, stage.height, labelSize, cyclistBox);
    // the arrow from A to the cyclist's place on the road
    view.arrow = null;
    if (displacement(s.km).km > 0.005) {
      toPx(corner.set(0, ROAD_Y + 9, 0), arrowOnScreen.a);
      pointAt(s.km, at);
      toPx(corner.set(at.x * KM, ROAD_Y + 9, -at.y * KM), arrowOnScreen.b);
      view.arrow = arrowOnScreen;
    }
    view.width = stage.width;
    view.height = stage.height;
    values.update(view, texts);
  });

  // ── the cyclist on the road ─────────────────────────────────────────────────
  const at = { x: 0, y: 0 };
  const hd = { x: 0, y: 1 };
  /** The cyclist's model at km: a little to the rider's left of the road's middle (keep left), facing its way. */
  function placeCyclist(k, snap) {
    pointAt(k, at);
    headingAt(k, hd);
    const i = Math.round(k / STEP);
    cyclist.root.position.set(at.x * KM - FRAME.rx[i] * s.dir * 18, ROAD_Y, -at.y * KM - FRAME.rz[i] * s.dir * 18);
    s.yawTarget = Math.atan2(hd.x * s.dir, -hd.y * s.dir);
    if (snap) s.yaw = s.yawTarget;
    cyclist.root.rotation.y = s.yaw;
    cyclist.roll(s.rolled);
  }

  let shownAt = null; // where the model is shown while the pointer's little show runs
  /**
   * Ride the cyclist to km, adding to the distance and the trail; the arrow and the readings follow. count: false
   * only shows the model there (the pointer's little show): nothing is measured, so nothing else moves.
   */
  function moveTo(km, { count = true, snap = false } = {}) {
    const k = THREE.MathUtils.clamp(km, 0, END);
    if (!count) {
      s.rolled += Math.abs(k - (shownAt ?? s.km)) * KM;
      shownAt = k;
      placeCyclist(k, snap);
      stage.invalidate();
      return;
    }
    shownAt = null;
    const d = k - s.km;
    if (Math.abs(d) > 1e-9) {
      s.trip += Math.abs(d);
      // the legs: a new one at each turn-round
      const last = s.legs.length - 1;
      if (last >= 0 && Math.sign(s.legs[last]) === Math.sign(d)) s.legs[last] += d;
      else s.legs.push(d);
      trail.mark(s.km, k);
      if (Math.floor(k + 1e-6) !== Math.floor(s.km + 1e-6)) audio.tick(); // passing a kilometre post
      if (Math.abs(d) > 0.002) s.dir = d > 0 ? 1 : -1; // a finger's tremble does not turn the cyclist round
      s.rolled += Math.abs(d) * KM;
      s.km = k;
    }
    placeCyclist(k, snap);
    arrow.set(at.x * KM, -at.y * KM);
    refresh();
  }
  // turning round (riding back) takes a moment; on the road it follows the bends at once
  stage.addTicker((dt) => {
    let diff = s.yawTarget - s.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) < 1e-3) {
      if (s.yaw !== s.yawTarget) {
        s.yaw = s.yawTarget;
        cyclist.root.rotation.y = s.yaw;
        return true;
      }
      return false;
    }
    s.yaw += Math.abs(diff) < 0.6 ? diff : diff * Math.min(1, dt * 9);
    cyclist.root.rotation.y = s.yaw;
    return true;
  });

  /** A new trip: the cyclist at A, the distance zero, no trail. */
  function newTrip() {
    coach?.interrupt();
    tweener.cancel('ride');
    s.riding = false;
    s.km = 0;
    s.trip = 0;
    s.legs = [];
    s.dir = 1;
    trail.clear();
    moveTo(0, { snap: true });
  }

  let rideToken = 0;
  /** Ride along the road through the stops (km), adding to the distance; resolves false if interrupted. */
  async function ride(stops, { speed = RIDE_SPEED, animate = true } = {}) {
    const my = ++rideToken;
    coach?.interrupt(); // the pointer's little show stops
    tweener.cancel('ride');
    if (!animate) {
      for (const k of stops) moveTo(k, { snap: true });
      s.riding = false;
      refresh();
      emitChange();
      return true;
    }
    s.riding = true;
    for (const [i, target] of stops.entries()) {
      const from = s.km;
      const to = THREE.MathUtils.clamp(target, 0, END);
      if (i > 0 && !(await tweener.animate({ key: 'ride', duration: 0.35 }).finished)) return false; // a breath at the turn
      if (Math.abs(to - from) < 1e-6) continue;
      const done = await tweener.animate({
        key: 'ride',
        duration: Math.min(4.5, Math.max(0.4, Math.abs(to - from) / speed)),
        ease: ease.inOutSine,
        onUpdate: (k) => moveTo(from + (to - from) * k),
      }).finished;
      if (!done || my !== rideToken) return false;
    }
    s.riding = false;
    refresh();
    emitChange();
    emit('arrive', snapshot());
    if (stopAt(s.km)) audio.pop();
    return true;
  }
  function stopRide() {
    rideToken++;
    tweener.cancel('ride');
    if (s.riding) {
      s.riding = false;
      refresh();
      emitChange();
    }
  }
  /** The student asked to ride somewhere (a button, a tap on the road, a key). */
  function rideTo(km) {
    if (s.locked) return lockedNudge();
    coach?.objectUsed();
    return ride([km]);
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const corners = (() => {
    const b = country.box;
    const list = [];
    for (const x of [b.min.x, b.max.x])
      for (const y of [b.min.y, b.max.y + 150]) for (const z of [b.min.z, b.max.z]) list.push(new THREE.Vector3(x, y, z));
    return list;
  })();
  const fitCam = new THREE.PerspectiveCamera();
  const v = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  /** A camera pose that fits the whole tile in the view, below the buttons in the corner. */
  function viewPose(view) {
    const w = Math.max(stage.width, 100);
    const h = Math.max(stage.height, 100);
    const dir = viewDir(view, w / h);
    const target = country.box.getCenter(new THREE.Vector3()).setY(0);
    fitCam.copy(camera);
    const top = 1 - (2 * 50) / h; // the view and full-screen buttons
    const bottom = -1 + (2 * 12) / h; // the labels of the posts on the south side
    const left = -1 + (2 * 6) / w;
    const rightEdge = 1 - (2 * 6) / w;
    let dist = 9000;
    const tanV = Math.tan(THREE.MathUtils.degToRad(fitCam.fov) / 2);
    for (let i = 0; i < 6; i++) {
      fitCam.position.copy(target).addScaledVector(dir, dist);
      fitCam.lookAt(target);
      fitCam.updateMatrixWorld();
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const c of corners) {
        v.copy(c).project(fitCam);
        x0 = Math.min(x0, v.x);
        x1 = Math.max(x1, v.x);
        y0 = Math.min(y0, v.y);
        y1 = Math.max(y1, v.y);
      }
      // move the middle of the tile to the middle of the free area, then grow or shrink to fill it
      const halfH = dist * tanV;
      const halfW = halfH * fitCam.aspect;
      right.set(1, 0, 0).applyQuaternion(fitCam.quaternion);
      up.set(0, 1, 0).applyQuaternion(fitCam.quaternion);
      target.addScaledVector(right, ((x0 + x1) / 2 - (left + rightEdge) / 2) * halfW);
      target.addScaledVector(up, ((y0 + y1) / 2 - (top + bottom) / 2) * halfH);
      dist *= Math.max((x1 - x0) / (rightEdge - left), (y1 - y0) / (top - bottom)) * 1.02;
    }
    return { target, position: target.clone().addScaledVector(dir, dist) };
  }
  function flyTo({ position, target }, duration = 0.8) {
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
    measureCorner();
    if (s.userMovedCamera) return;
    tweener.cancel('camera');
    flyTo(viewPose(s.view), 0);
  });

  // ── touching the cyclist and the road ───────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function rayFrom(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  /** Is the cyclist under this canvas point? */
  function onCyclist(p) {
    rayFrom(p);
    return raycaster.intersectObject(cyclist.hit, false).length > 0;
  }
  /** The km of the road, post or label under this canvas point, or null. */
  function placeAt(p) {
    rayFrom(p);
    const hit = raycaster.intersectObjects(country.pickables, true)[0];
    if (!hit) return null;
    for (let o = hit.object; o; o = o.parent) {
      if (o.userData.km != null) return Math.min(END, o.userData.km);
      if (o === country.labels.group) return null; // the compass's উ and the scale's label name no place
    }
    return nearestKm(hit.point.x / KM, -hit.point.z / KM, 0, END);
  }
  /** A finger a little off the cyclist still takes it. */
  function nearby(p) {
    for (const r of [12, 24]) {
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        if (onCyclist({ x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a) })) return true;
      }
    }
    return false;
  }
  // while dragging, the cyclist follows the finger along the road: the road's samples on screen, searched near
  // where the cyclist is (the road never comes back within half a kilometre of itself, so it cannot jump across)
  const screen = new Float32Array(COUNT * 2);
  function projectRoad() {
    for (let i = 0; i <= LAST; i++) {
      v.set(FRAME.cx[i], ROAD_Y, FRAME.cz[i]).project(camera);
      screen[2 * i] = ((v.x + 1) / 2) * stage.width;
      screen[2 * i + 1] = ((1 - v.y) / 2) * stage.height;
    }
  }
  function followFinger(px, py) {
    let center = s.km / STEP;
    let best = center;
    for (let iter = 0; iter < 12; iter++) {
      const lo = Math.max(0, Math.floor(center) - 20);
      const hi = Math.min(LAST - 1, Math.ceil(center) + 20);
      let bestD = Infinity;
      for (let j = lo; j <= hi; j++) {
        const ax = screen[2 * j];
        const ay = screen[2 * j + 1];
        const bx = screen[2 * j + 2] - ax;
        const by = screen[2 * j + 3] - ay;
        const f = Math.min(1, Math.max(0, ((px - ax) * bx + (py - ay) * by) / (bx * bx + by * by || 1)));
        const d = Math.hypot(ax + bx * f - px, ay + by * f - py);
        if (d < bestD) {
          bestD = d;
          best = j + f;
        }
      }
      if (Math.abs(best - center) < 1) break;
      center = best;
    }
    return Math.min(END, best * STEP);
  }

  let drag = null;
  let tap = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const p = canvasPoint(e);
      const grab = onCyclist(p) || (e.pointerType !== 'mouse' && nearby(p));
      tap = grab ? null : { id: e.pointerId, x: e.clientX, y: e.clientY };
      if (!grab || drag) return; // the camera controls take it
      e.stopPropagation(); // a drag on the cyclist is not a camera move
      e.preventDefault();
      if (s.locked) return lockedNudge();
      stopRide();
      projectRoad();
      // the finger keeps its place on the cyclist (it took the rider, above the road): no jump at the start
      const i = Math.min(LAST, Math.round(s.km / STEP));
      drag = { id: e.pointerId, dx: p.x - screen[2 * i], dy: p.y - screen[2 * i + 1] };
      s.dragging = true;
      try {
        ui.canvasHost.setPointerCapture(e.pointerId); // keep the drag even when the finger leaves the view
      } catch {
        // the pointer is already gone
      }
      coach?.objectUsed();
      emit('dragstart', snapshot());
      refresh();
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (tap && e.pointerId === tap.id && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 8) tap = null;
    if (!drag || e.pointerId !== drag.id) return;
    const p = canvasPoint(e);
    moveTo(followFinger(p.x - drag.dx, p.y - drag.dy));
  });
  function endDrag(e) {
    if (tap && e.pointerId === tap.id && e.type === 'pointerup') {
      tap = null;
      const km = placeAt(canvasPoint(e));
      if (km != null) rideTo(km);
      return;
    }
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    s.dragging = false;
    refresh();
    emitChange();
    emit('dragend', snapshot());
    coach?.objectReleased();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued || drag) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = onCyclist(p) ? (s.locked ? 'not-allowed' : 'grab') : placeAt(p) != null ? 'pointer' : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 3500 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
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
  const dirName = (dir) => t(`dir_${dir}`);
  const kmLabel = (v) => `${N(String(v))}<small>${t('unit_km')}</small>`;
  const textLabel = (list) => (j) => `<span class="dd-opt">${list[j]}</span>`;
  /** Text choices: the right one first in `texts`; returns the quiz's choice fields. */
  function textChoices(texts) {
    const order = shuffle([0, 1, 2, 3]);
    const list = order.map((i) => texts[i]);
    return { choices: [0, 1, 2, 3], expected: order.indexOf(0), tolerance: 0.5, label: textLabel(list), list };
  }
  /** Number choices (km): the right one and three wrong ones, all different. */
  function kmChoices(right, wrong) {
    const seen = new Set([String(right)]);
    const list = [right];
    for (const w of wrong) {
      if (list.length === 4 || w < 0 || seen.has(String(w))) continue;
      seen.add(String(w));
      list.push(w);
    }
    for (let k = 1; list.length < 4; k++) {
      if (seen.has(String(right + k))) continue; // a fallback, rarely needed
      seen.add(String(right + k));
      list.push(right + k);
    }
    return { choices: shuffle(list), expected: right, tolerance: 0.001, label: kmLabel };
  }

  let kinds = [];
  let question = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        s.mode = 'quiz';
        stopRide();
        hideHint();
        kinds = shuffle(['say', 'dir', 'trip', 'zero', 'rule']);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.values = true;
        stopRide();
        newTrip(); // the test's last ride (maybe half-finished) does not stay in the learn panel
        syncUI();
        emitChange();
      },
      async prepare(i, alive, say) {
        const kind = kinds[i % kinds.length];
        s.locked = true;
        s.values = false;
        newTrip();
        const go = async (route, text) => {
          say(text);
          const ok = await ride(route); // at the usual pace: the student has to see where it goes
          return ok && alive();
        };
        if (kind === 'say') {
          const stop = pickOne(['B', 'C']);
          const km = PLACES[stop];
          if (!(await go([km], t('q_say', { stop })))) return null;
          const d = displacement(km);
          const mag = roundTo(d.km, 0.01); // 2 at B (the book's 2 km), 1.31 at C, as on the map
          const dir = dirName(compass8(d.bearing));
          question = { kind, d: mag, dir, dist: km };
          const c = textChoices([t('opt_vec', { d: mag, dir }), t('opt_only', { d: mag }), t('opt_vec', { d: km, dir }), t('opt_only', { d: km })]);
          return { ...c, meta: { kind, stop } };
        }
        if (kind === 'dir') {
          const km = pickOne([4, 5]);
          if (!(await go([km], t('q_dir')))) return null;
          const right = compass8(displacement(km).bearing);
          const h = headingAt(km);
          const heading = compass8((Math.atan2(h.x, h.y) * 180) / Math.PI);
          // the usual mistakes: the way the cycle rides, the arrow read backwards, east and west swapped
          const mirror = COMPASS[(8 - COMPASS.indexOf(right)) % 8];
          const wrong = [heading, turn(right, 4), mirror, turn(right, 2), turn(right, -2)].filter((w, j, all) => w !== right && all.indexOf(w) === j);
          question = { kind, dir: dirName(right), heading: dirName(heading) };
          const c = textChoices([right, ...wrong.slice(0, 3)].map(dirName));
          return { ...c, meta: { kind, km, dir: right } };
        }
        if (kind === 'trip') {
          const k1 = pickOne([4, 5, 6, 7]);
          const k2 = 1 + Math.floor(Math.random() * (k1 - 2));
          if (!(await go([k1, k2], t('q_trip', { k1, k2 })))) return null;
          const total = travelled([0, k1, k2]);
          question = { kind, k1, back: k1 - k2, total };
          return { ...kmChoices(total, [k2, k1, roundTo(displacement(k2).km, 0.01), k1 + k2]), meta: { kind, route: [0, k1, k2] } };
        }
        if (kind === 'zero') {
          const k = pickOne([3, 4, 5, 6]);
          if (!(await go([k, 0], t('q_zero', { k })))) return null;
          question = { kind, k, total: 2 * k };
          return { ...kmChoices(0, [2 * k, k, roundTo(displacement(k).km, 0.01)]), meta: { kind, route: [0, k, 0] } };
        }
        // rule: displacement never more than distance (shown on the ride to C)
        if (!(await go([PLACES.C], t('q_rule')))) return null;
        question = { kind, dist: fmtShort(s.trip), disp: fmtShort(size(displacement(s.km))) };
        const c = textChoices([t('opt_rule_ok'), t('opt_rule_eq'), t('opt_rule_more'), t('opt_rule_back')]);
        return { ...c, meta: { kind } };
      },
      reveal() {
        s.values = true;
        refresh();
        const q = question;
        if (q.kind === 'say') return t('why_say', q);
        if (q.kind === 'dir') return t('why_dir', q);
        if (q.kind === 'trip') return t('why_trip', q);
        if (q.kind === 'zero') return t('why_zero', q);
        return t('why_rule', q);
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on the cyclist ───────────────────────────────────────
  let coach = null;
  if (o.coach) {
    const p = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_drag',
        candidates: () => {
          p.copy(cyclist.root.position)
            .setY(ROAD_Y + 0.7 * SCALE)
            .project(camera);
          return [{ x: (p.x * 0.5 + 0.5) * stage.width, y: (-p.y * 0.5 + 0.5) * stage.height }];
        },
        grabbable: (q) => onCyclist(q),
        // the cyclist rolls a little way along the road and back: only a show, so nothing is measured (the arrow
        // and the readings stay where they are)
        async demo(alive) {
          const k0 = s.km;
          const k1 = k0 < END - 0.4 ? k0 + 0.3 : k0 - 0.3;
          for (const [from, to] of [
            [k0, k1],
            [k1, k0],
          ]) {
            if (!alive()) break;
            const ok = await tweener.animate({
              key: 'coach',
              duration: 0.9,
              ease: ease.inOutSine,
              onUpdate: (k) => moveTo(from + (to - from) * k, { count: false }),
            }).finished;
            if (!ok) break;
          }
          if (shownAt != null) moveTo(s.km, { count: false });
          shownAt = null;
        },
        // the student took the cyclist during the show: it really rode there, so that bit counts from now on
        cancel: () => {
          tweener.cancel('coach');
          if (shownAt == null) return;
          const here = shownAt;
          shownAt = null;
          moveTo(here);
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
      case 'ride':
        rideTo(PLACES[b.dataset.to]);
        break;
      case 'new':
        if (s.locked) lockedNudge();
        else {
          newTrip();
          emitChange();
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
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    const k = e.key.toLowerCase();
    if (step) {
      if (s.locked) lockedNudge();
      else {
        stopRide();
        coach?.interrupt();
        coach?.objectUsed();
        moveTo(roundTo(s.km + step * (e.shiftKey ? 1 : 0.1), 0.1));
        emitChange();
      }
    } else if (k === 'b' || k === 'c') rideTo(PLACES[k.toUpperCase()]);
    else if (k === 'a') rideTo(PLACES.A);
    else if (k === 'n' && !s.locked) {
      newTrip();
      emitChange();
    } else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  newTrip();
  if (o.km) ride([Number(o.km)], { animate: false });
  measureCorner();
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start();
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
     * Change any of: km (a new trip from A straight to km), route (a new trip from A through these km, e.g.
     * [6, 0]), ride ('A' | 'B' | 'C' or km: ride on from here, adding to the distance), newTrip (true: back to A,
     * distance zero), view; animate: false jumps (the distance still counts every leg).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.newTrip) {
        newTrip();
        emitChange();
      }
      if (p.km != null) {
        newTrip();
        await ride([Number(p.km)], { animate: false });
      }
      if (Array.isArray(p.route)) {
        newTrip();
        await ride(p.route.map(Number), { animate });
      }
      if (p.ride != null) await ride([PLACES[p.ride] ?? Number(p.ride)], { animate });
      return snapshot();
    },
    async reset() {
      quiz.stop();
      newTrip();
      emitChange();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world, // the tile, the cyclist, the trail and the arrow (labels and tap targets are left out)
  };
}
