// Distance and displacement (book page 39, topic 2.4), student view. A cyclist rides the winding road of চিত্র ২.০৪
// from A. The blue trail behind it is the distance travelled (দূরত্ব: how far along the path, just a size, a scalar);
// the straight orange arrow from A to the cyclist is the displacement (সরণ: how far and which way from A, a vector).
// The panel is the kit's clean sheet: a key that names the blue path and the orange arrow, ONE action (the story's
// next leg: ১ B পর্যন্ত, ২ C পর্যন্ত, ৩ back to A; the same numbered badge rings the stop on the map), ONE result line
// comparing the two at each stop, and ONE rule in the book's words that grows (src/story.js). The cyclist can also
// be dragged along the road, or sent anywhere by a tap on the road. Then a short test. Built on the shared student
// kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createCountryside, FRAME, KM, ROAD_W, ROAD_Y } from './countryside.js';
import { createCyclist, SCALE } from './cyclist.js';
import { createI18n } from './i18n.js';
import { COLORS, createArrow, createTrail } from './marks.js';
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
import { advance, legsToShow, mergeLegs, nextStop, outcomeKind, ruleLevel } from './story.js';
import { createValueTags } from './values.js';

export const DEFAULTS = {
  km: 0, // where the cyclist starts, km along the road from A (as if it had ridden there from A)
  view: 'front', // 'front' (from above, north up, like the book's picture) | '3d' (lower, turn it round)
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the action's marker pulses (still with coach=0)
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
const DOUBLE_TAP = 450; // ms: a second action this soon after one is ignored
// The kit's badge geometry (shared/lib/student/action.js, kit 1.3.0), copied because the kit does not expose it yet
// (kit gap: badge spots / constants, and a ringBox() valid in the frame the marker comes back): a ring round a point
// is at least 44 px across, and the badge (46 px) sits 0.38 of its size outside the dashed line. The measure script
// asserts the badge really sits there, so a kit change shows up.
const KIT = { minRing: 44, badge: 46, out: 0.38 * 46 };
const ringHalf = (radius) => Math.max(KIT.minRing / 2, radius); // the ring's radius on the screen, px
// the bike is about this many px long on the screen (scaled up to 1.8 times on small maps; never below its size)
const CYCLIST_PX = 40;

// the key's two little pictures: a piece of winding blue path, a straight orange arrow (the same as on the map)
const SWATCH_PATH = '<svg class="dd-sw" viewBox="0 0 30 16" aria-hidden="true"><path d="M2 12c5-9 9-9 13-4s8 5 13-4"/></svg>';
const SWATCH_ARROW =
  '<svg class="dd-sw" viewBox="0 0 30 16" aria-hidden="true"><path d="M3 13 21.5 5.2"/><path class="head" d="m28 2.5-10.4.2 3.9 9.2z"/></svg>';

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const U = t('u_km');
  const live = (km) => fmtKm(km); // km with two decimals (readings that change while it rides)
  const plain = (km) => fmtShort(km); // km as in a sentence: 4, 1.31, 12

  root.classList.add('pvc', 'dd');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="dd-key" role="group" aria-label="${t('key')}">
            <p class="dd-key-item d">${SWATCH_PATH}<span><b>${t('key_dist')}</b><small>${t('key_dist_sub')}</small></span></p>
            <p class="dd-key-item s">${SWATCH_ARROW}<span><b>${t('key_disp')}</b><small>${t('key_disp_sub')}</small></span></p>
          </div>
          ${cleanSheet(t, { quiet: [{ act: 'new', label: 'act_new', icon: ICONS.reset }], lines: { outcome: 2, rule: 3 } })}`,
  });
  const sheet = bindCleanSheet(ui.learn);
  // the honest note: the road is to scale, the cycle and the village are not (top left; the buttons are top right)
  const note = document.createElement('div');
  note.className = 'dd-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 40, far: 40000, environment: 'studio-light', exposure: 1.05 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 1500;
  controls.maxDistance = 14000;
  controls.maxPolarAngle = 1.35; // never under the tile
  controls.enablePan = false;
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
    far: 0, // the farthest km along the road reached this trip (the blue path covers 0 … far)
    step: 0, // the story's stops reached this trip (0 … 3: B, C, back at A)
    level: 0, // how far the rule line has grown this trip (src/story.js)
    rolled: 0, // metres the wheels have turned (for the pedals)
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
  const legs = () => mergeLegs(s.legs);
  /** "৬ + ৬ = ১২" for a trip of more than one leg, else "১২". */
  function tripSum() {
    const list = legs();
    if (list.length < 2) return plain(s.trip);
    return `${legsToShow(list)
      .map((v) => (v == null ? '…' : plain(v)))
      .join(' + ')} = ${plain(s.trip)}`;
  }
  const moving = () => s.riding || s.dragging;

  /** What the big action does now: ride to the story's next stop (after the story, a new trip to B). */
  function plan() {
    const next = nextStop(s.step);
    if (!next) return { stop: 'B', step: '', label: 'act_again', fresh: true }; // the story is done: no step number
    // the story starts at A with nothing ridden: a trip that wandered off and came back to A starts afresh
    const fresh = s.step === 0 && s.trip >= 0.005 && stopAt(s.km) === 'A';
    return { stop: next, step: s.step + 1, label: `act_${next.toLowerCase()}`, fresh };
  }

  function snapshot() {
    const d = displacement(s.km);
    const p = plan();
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
      story: s.step, // stops of the story reached this trip: 0 … 3 (B, C, back at A)
      next: { stop: p.stop, step: p.step }, // what the big button does now: ride to that stop
      rule: s.level, // how far the rule line has grown (0 … 3)
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.km}|${snap.trip}|${snap.story}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the panel: the result line, the rule, the action ───────────────────────────
  const outcomeEl = ui.$('.pvc-outcome');
  function outcomeHtml(d) {
    const at = stopAt(s.km);
    const kind = outcomeKind({ trip: s.trip, at, moving: moving() });
    const dir = d.bearing == null ? '' : t(`dir_${compass8(d.bearing)}`);
    if (kind === 'move') return [kind, t('out_move', { dist: live(s.trip), disp: live(size(d)), u: U })];
    if (kind === 'start') return [kind, t('out_start', { z: 0 })];
    if (kind === 'back') return [kind, t('out_back', { z: 0, sum: tripSum(), u: U })];
    const vars = { at, dist: plain(s.trip), disp: plain(size(d)), dir, u: U, z: 0 };
    if (kind === 'here' && size(d) < 0.005) return [kind, t('out_here0', vars)]; // a nudge off A and back: no direction
    return [kind, t(kind === 'stop' ? 'out_stop' : 'out_here', vars)];
  }

  let lastKind = '';
  function refresh() {
    const d = displacement(s.km);
    const at = stopAt(s.km);
    s.level = ruleLevel(s.level, { step: s.step, at, trip: s.trip, moving: moving() });
    const [kind, html] = outcomeHtml(d);
    sheet.outcome(html);
    if (kind !== lastKind) outcomeEl.dataset.k = lastKind = kind;
    sheet.rule(t(`rule_${s.level}`, { b: PLACES.B, u: U }));
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label });
      // the ring shows on the next stop while the cyclist waits, never while it rides
      if (s.riding) action.hide('ride');
      else action.show('ride');
    }
    texts.dist = s.values && s.trip > 0.005 ? t('pill_dist', { v: plain(s.trip) }) : null;
    texts.disp = !s.values
      ? null
      : d.km > 0.005
        ? t('pill_disp', { v: plain(size(d)) })
        : s.trip > 0.05 && !moving()
          ? t('pill_zero', { z: 0 })
          : null;
    stage.invalidate();
  }

  // ── what is where on the screen: the labels, the cyclist, the arrow, the values ──
  const values = createValueTags(ui.annoLayer, COLORS);
  const texts = { dist: null, disp: null };
  const cyclistBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const arrowOnScreen = { a: { x: 0, y: 0 }, b: { x: 0, y: 0 } };
  const origin = { x: 0, y: 0 };
  const badgeBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const noteBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const ROAD_EVERY = 4; // samples between the road's points on the screen (0.1 km), for the values to keep off it
  const roadPx = new Float32Array((Math.floor(LAST / ROAD_EVERY) + 1) * 2);
  const ringBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const ringRoom = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const view = {
    width: 1,
    height: 1,
    top: 0,
    cornerX: 0,
    cyclist: cyclistBox,
    arrow: null,
    origin,
    plates: [],
    keep: [],
    soft: [],
    road: roadPx,
    roadPad: 4,
  };
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
    const nr = note.getBoundingClientRect();
    Object.assign(noteBox, { x0: nr.left - sr.left - 3, y0: nr.top - sr.top - 3, x1: nr.right - sr.left + 3, y1: nr.bottom - sr.top + 3 });
  }
  let ringRadius = 30;
  const camRight = new THREE.Vector3();
  const pxA = { x: 0, y: 0 };
  const pxB = { x: 0, y: 0 };
  stage.onBeforeRender(() => {
    camera.updateMatrixWorld();
    // the cyclist big enough to see on a phone: px per metre across the view where it is, the bike's length from it
    camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    toPx(cyclist.root.position, pxA);
    toPx(corner.copy(cyclist.root.position).addScaledVector(camRight, 100), pxB);
    const bikePx = (Math.hypot(pxB.x - pxA.x, pxB.y - pxA.y) / 100) * 1.9 * SCALE;
    const grow = THREE.MathUtils.clamp(CYCLIST_PX / Math.max(1, bikePx), 1, 1.8);
    if (Math.abs(grow - cyclist.root.scale.x) > 0.005) cyclist.root.scale.setScalar(grow);
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
    // the action's ring round the next stop's label (its letter and its post's number)
    const r = country.stops[plan().stop].label.userData.rect;
    const radius = Math.round(Math.max(r.x1 - r.x0, r.y1 - r.y0) / 2 + 7);
    if (radius !== ringRadius) {
      ringRadius = radius;
      action?.set({ radius });
    }
    // the arrow from A to the cyclist's place on the road
    view.arrow = null;
    toPx(corner.set(0, ROAD_Y + 9, 0), origin);
    if (displacement(s.km).km > 0.005) {
      arrowOnScreen.a.x = origin.x;
      arrowOnScreen.a.y = origin.y;
      pointAt(s.km, at);
      toPx(corner.set(at.x * KM, ROAD_Y + 9, -at.y * KM), arrowOnScreen.b);
      view.arrow = arrowOnScreen;
    }
    view.width = stage.width;
    view.height = stage.height;
    for (let i = 0, j = 0; i <= LAST; i += ROAD_EVERY, j += 2) {
      toPx(corner.set(FRAME.cx[i], ROAD_Y, FRAME.cz[i]), px);
      roadPx[j] = px.x;
      roadPx[j + 1] = px.y;
    }
    view.ridden = s.trip > 0 ? Math.min(roadPx.length, 2 * (Math.floor(s.far / (STEP * ROAD_EVERY)) + 2)) : 0;
    // the road's half width on the screen (it is 90 m wide), so the values stay off the blue path
    toPx(corner.set(0, ROAD_Y, 0), px);
    const ax = px.x;
    toPx(corner.set(ROAD_W / 2, ROAD_Y, 0), px);
    view.roadPad = Math.max(3, Math.abs(px.x - ax));
    // the values keep clear of the action's ring and badge and the honest note; if they can, of the room round the
    // ring where the badge may go too (a value there would push the badge somewhere worse: on a small map, under the
    // corner buttons). ringBox() is null in the frame where the marker comes back after a ride, so the ring is also
    // worked out here whenever it is about to show (round the next stop's label, as the kit draws a ring round a point)
    view.keep.length = 0;
    view.soft.length = 0;
    const b = action?.box();
    if (b) view.keep.push(Object.assign(badgeBox, { x0: b.left - 2, y0: b.top - 2, x1: b.right + 2, y1: b.bottom + 2 }));
    let rb = action?.ringBox();
    if (!rb && action && !s.riding && s.mode !== 'quiz') {
      toPx(ringTarget(), px);
      const half = ringHalf(ringRadius) + 3;
      rb = { left: px.x - half, top: px.y - half, right: px.x + half, bottom: px.y + half };
    }
    if (rb) {
      view.keep.push(Object.assign(ringBox, { x0: rb.left, y0: rb.top, x1: rb.right, y1: rb.bottom }));
      const room = KIT.out + KIT.badge / 2;
      view.soft.push(Object.assign(ringRoom, { x0: rb.left - room, y0: rb.top - room, x1: rb.right + room, y1: rb.bottom + room }));
    }
    if (!note.hidden) view.keep.push(noteBox);
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

  /** Ride the cyclist to km, adding to the distance and the trail; the arrow and the readings follow. */
  function moveTo(km, { snap = false } = {}) {
    const k = THREE.MathUtils.clamp(km, 0, END);
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
      s.far = Math.max(s.far, k);
    }
    placeCyclist(k, snap);
    arrow.set(at.x * KM, -at.y * KM);
    refresh();
  }
  /** The cyclist has come to rest: the story moves on if this is its next stop. */
  function settle() {
    s.step = advance(s.step, stopAt(s.km), s.trip);
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

  /** A new trip: the cyclist at A, the distance zero, no trail, the story from the start. */
  function newTrip() {
    rideToken++;
    tweener.cancel('ride');
    s.riding = false;
    s.km = 0;
    s.trip = 0;
    s.legs = [];
    s.far = 0;
    s.step = 0;
    s.level = 0;
    s.dir = 1;
    trail.clear();
    moveTo(0, { snap: true });
  }

  let rideToken = 0;
  /** Ride along the road through the stops (km), adding to the distance; resolves false if interrupted. */
  async function ride(stops, { speed = RIDE_SPEED, animate = true } = {}) {
    const my = ++rideToken;
    tweener.cancel('ride');
    if (!animate) {
      for (const k of stops) {
        moveTo(k, { snap: true });
        settle();
      }
      s.riding = false;
      refresh();
      emitChange();
      return true;
    }
    s.riding = true;
    refresh();
    for (const [i, target] of stops.entries()) {
      const from = s.km;
      const to = THREE.MathUtils.clamp(target, 0, END);
      if (i > 0 && !(await tweener.animate({ key: 'ride', duration: 0.35 }).finished)) return false; // a breath at the turn
      if (my !== rideToken) return false;
      if (Math.abs(to - from) < 1e-6) continue;
      const done = await tweener.animate({
        key: 'ride',
        duration: Math.min(4.5, Math.max(0.4, Math.abs(to - from) / speed)),
        ease: ease.inOutSine,
        onUpdate: (k) => moveTo(from + (to - from) * k),
      }).finished;
      if (!done || my !== rideToken) return false;
      settle(); // a stop on the way counts for the story too
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
      settle();
      emitChange();
    }
  }
  /** The student asked to ride somewhere (a tap on the road or a post, a key). */
  function rideTo(km) {
    if (s.locked) return lockedNudge();
    return ride([km]);
  }

  // ── the one action: the story's next leg ─────────────────────────────────────
  let lastAct = -Infinity;
  /** The big button, its badge on the map, a tap inside its ring, Enter/Space: ride to the story's next stop. */
  function doAction() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < DOUBLE_TAP) return; // a double tap must not ride on to the stop after
    lastAct = now;
    const p = plan();
    if (p.fresh) {
      newTrip();
      emitChange();
    }
    return ride([PLACES[p.stop]]);
  }
  const ringAt = new THREE.Vector3();
  /** Where the ring goes: the next stop's label (its letter disc over its post's number). */
  function ringTarget() {
    if (s.mode === 'quiz') return null;
    return ringAt.copy(country.stops[plan().stop].label.position);
  }
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_b',
    target: ringTarget,
    radius: ringRadius,
    // the badge keeps clear of the buttons, the hint, the note, the two values, the cyclist, the other plates, the
    // arrow and the road (the blue path)
    avoid: [ui.corner, ui.hint, note, () => [...ui.annoLayer.querySelectorAll('.dd-tag.in')], sceneBoxes],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });
  /**
   * Boxes (canvas px) of what the badge must not cover on the map: the plates, the cyclist, the arrow and, when the
   * badge still has a free place round the ring, the blue path ridden so far (on a small map after a long ride the
   * path runs all round the next stop; then the badge may sit on the path rather than under the corner buttons).
   */
  const sceneHard = [];
  const scenePath = [];
  function sceneBoxes() {
    sceneHard.length = 0;
    scenePath.length = 0;
    const own = country.stops[plan().stop].label.userData.rect;
    for (const r of view.plates) if (r !== own) sceneHard.push({ left: r.x0, top: r.y0, right: r.x1, bottom: r.y1 });
    sceneHard.push({ left: cyclistBox.x0, top: cyclistBox.y0, right: cyclistBox.x1, bottom: cyclistBox.y1 });
    const dot = (list, x, y, r) => list.push({ left: x - r, top: y - r, right: x + r, bottom: y + r });
    if (view.arrow) {
      const { a, b } = view.arrow;
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 10);
      for (let i = 0; i <= n; i++) dot(sceneHard, a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n, 5);
    }
    const ridden = s.trip > 0 ? Math.min(roadPx.length, 2 * (Math.floor(s.far / (STEP * ROAD_EVERY)) + 1)) : 0;
    for (let j = 0; j + 1 < ridden; j += 2) dot(scenePath, roadPx[j], roadPx[j + 1], view.roadPad);
    return badgeRoom([...sceneHard, ...scenePath]) ? [...sceneHard, ...scenePath] : sceneHard;
  }
  /** Is there a place on the ring (roughly where the kit puts its badge) clear of these and of the panels' boxes? */
  function badgeRoom(boxes) {
    const tg = ringTarget();
    if (!tg) return true;
    toPx(tg, ringPx);
    const origin = stage.canvas.getBoundingClientRect();
    const others = [ui.corner, note, ...ui.annoLayer.querySelectorAll('.dd-tag.in')].map((e) => {
      const r = e.getBoundingClientRect();
      return { left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top };
    });
    // the badge's middle just outside the ring, as the kit puts it (KIT, above)
    const R = ringHalf(ringRadius) + KIT.out;
    const half = KIT.badge / 2;
    const free = (deg) => {
      const x = ringPx.x + R * Math.cos((deg * Math.PI) / 180);
      const y = ringPx.y + R * Math.sin((deg * Math.PI) / 180);
      const b = { left: x - half, top: y - half, right: x + half, bottom: y + half };
      if (b.left < 8 || b.top < 8 || b.right > stage.width - 8 || b.bottom > stage.height - 8) return false;
      const hit = (r) => b.left < r.right + 4 && b.right > r.left - 4 && b.top < r.bottom + 4 && b.bottom > r.top - 4;
      return !boxes.some(hit) && !others.some(hit);
    };
    return [-45, -135, 0, 180, -90, 45, 135, 90].some(free);
  }
  const ringPx = { x: 0, y: 0 };
  /** Is this canvas point inside the action's ring on the map (a tap there does the action)? */
  function inRing(p) {
    if (!action?.visible) return false;
    const tg = ringTarget();
    if (!tg) return false;
    toPx(tg, ringPx);
    return Math.hypot(p.x - ringPx.x, p.y - ringPx.y) <= ringHalf(ringRadius) + 4;
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
  function viewPose(which) {
    const w = Math.max(stage.width, 100);
    const h = Math.max(stage.height, 100);
    const dir = viewDir(which, w / h);
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
  function setView(which, { animate = true } = {}) {
    s.view = which === '3d' ? '3d' : 'front';
    // the view from above is the book's picture: no turning, no zoom (a pinch would end the fitting for good)
    controls.enableRotate = s.view === '3d';
    controls.enableZoom = s.view === '3d';
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
    writeNote();
    measureCorner();
    if (s.userMovedCamera) return;
    tweener.cancel('camera');
    flyTo(viewPose(s.view), 0);
  });
  let noteText = '';
  function writeNote() {
    const text = t(stage.width < 470 ? 'note_scale_short' : 'note_scale');
    if (text !== noteText) note.textContent = noteText = text;
  }

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
    for (let ob = hit.object; ob; ob = ob.parent) {
      if (ob.userData.km != null) return Math.min(END, ob.userData.km);
      if (ob === country.labels.group) return null; // the compass's উ and the scale's label name no place
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
  function followFinger(fx, fy) {
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
        const f = Math.min(1, Math.max(0, ((fx - ax) * bx + (fy - ay) * by) / (bx * bx + by * by || 1)));
        const d = Math.hypot(ax + bx * f - fx, ay + by * f - fy);
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
      capturePointer(ui.canvasHost, e.pointerId); // keep the drag even when the finger leaves the view
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
      const p = canvasPoint(e);
      if (inRing(p)) {
        audio.unlock();
        doAction();
        return;
      }
      const km = placeAt(p);
      if (km != null) rideTo(km);
      return;
    }
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    s.dragging = false;
    settle();
    emitChange();
    emit('dragend', snapshot());
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
      ui.canvasHost.style.cursor = onCyclist(p) ? (s.locked ? 'not-allowed' : 'grab') : inRing(p) || placeAt(p) != null ? 'pointer' : '';
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
  const kmLabel = (x) => `${N(String(x))}<small>${U}</small>`;
  /**
   * Choices in words: items [{ text, note }], the right one first (note: what that mistake is). Returns the quiz's
   * choice fields; the choices are the items' places in `list` (shuffled).
   */
  function wordChoices(items) {
    const list = shuffle(items.map((it, i) => ({ ...it, right: i === 0 })));
    return {
      choices: [0, 1, 2, 3],
      expected: list.findIndex((it) => it.right),
      tolerance: 0.5,
      label: (j) => `<span class="dd-opt">${list[j].text}</span>`,
      list,
    };
  }
  /** Number choices (km): the right one and three wrong ones (each with its note), all different. */
  function kmChoices(right, wrong) {
    const seen = new Set([String(right)]);
    const list = [{ value: right, note: '' }];
    for (const w of wrong) {
      if (list.length === 4 || w.value < 0 || seen.has(String(w.value))) continue;
      seen.add(String(w.value));
      list.push(w);
    }
    for (let k = 1; list.length < 4; k++) {
      if (seen.has(String(right + k))) continue; // a fallback, rarely needed
      seen.add(String(right + k));
      list.push({ value: right + k, note: '' });
    }
    shuffle(list);
    return { choices: list.map((it) => it.value), expected: right, tolerance: 0.001, label: kmLabel, list };
  }

  let kinds = [];
  let question = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        s.mode = 'quiz';
        stopRide();
        hideHint();
        kinds = shuffle(['vec', 'dir', 'trip', 'zero', 'rule']);
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
        question = null;
        newTrip();
        const go = async (route, text) => {
          say(text);
          const ok = await ride(route); // at the usual pace: the student has to see where it goes
          return ok && alive();
        };
        if (kind === 'vec') {
          // the book's example: B, 4 km of road, 2 km north-east
          const km = PLACES.B;
          if (!(await go([km], t('q_vec')))) return null;
          const d = displacement(km);
          const mag = plain(d.km);
          const dir = dirName(compass8(d.bearing));
          const vars = { d: mag, dir, dist: km, u: U };
          question = { kind, vars };
          const c = wordChoices([
            { text: t('opt_vec', vars) },
            { text: t('opt_only', vars), note: 'miss_vec_only' },
            { text: t('opt_vec', { ...vars, d: km }), note: 'miss_vec_dist' },
            { text: t('opt_only', { ...vars, d: km }), note: 'miss_vec_dist_only' },
          ]);
          question.list = c.list;
          return { ...c, meta: { kind, stop: 'B' } };
        }
        if (kind === 'dir') {
          // a short ride where the cycle is not heading the way of the arrow (km 1: south-east, riding east;
          // km 2: east, riding north-east)
          const km = pickOne([1, 2]);
          if (!(await go([km], t('q_dir')))) return null;
          const right = compass8(displacement(km).bearing);
          const h = headingAt(km);
          const heading = compass8((Math.atan2(h.x, h.y) * 180) / Math.PI);
          // the usual mistakes: the way the cycle rides, the arrow read backwards, east and west swapped
          const mirror = COMPASS[(8 - COMPASS.indexOf(right)) % 8];
          const wrong = [
            { dir: heading, note: 'miss_dir_heading' },
            { dir: turn(right, 4), note: 'miss_dir_back' },
            { dir: mirror, note: 'miss_dir_mirror' },
            { dir: turn(right, 2), note: 'miss_dir_other' },
            { dir: turn(right, -2), note: 'miss_dir_other' },
          ].filter((w, j, all) => w.dir !== right && all.findIndex((x) => x.dir === w.dir) === j);
          question = { kind, vars: { dir: dirName(right), heading: dirName(heading) } };
          const c = wordChoices([{ text: dirName(right) }, ...wrong.slice(0, 3).map((w) => ({ text: dirName(w.dir), note: w.note }))]);
          question.list = c.list;
          return { ...c, meta: { kind, km, dir: right } };
        }
        if (kind === 'trip') {
          const k1 = pickOne([4, 5, 6, 7]);
          // back to a post short of the far one, never half way (adding the two post numbers would then be right)
          const k2 = pickOne(Array.from({ length: k1 - 2 }, (_, j) => j + 1).filter((k) => 2 * k !== k1));
          if (!(await go([k1, k2], t('q_trip', { k1, k2 })))) return null;
          const total = travelled([0, k1, k2]);
          const dk2 = roundTo(displacement(k2).km, 0.01);
          const vars = { k1, k2, back: k1 - k2, total, d: dk2, u: U };
          question = { kind, vars };
          const c = kmChoices(total, [
            { value: k2, note: 'miss_trip_at' },
            { value: k1, note: 'miss_trip_far' },
            { value: k1 + k2, note: 'miss_trip_sum' },
            { value: dk2, note: 'miss_trip_disp' },
          ]);
          question.list = c.list;
          return { ...c, meta: { kind, route: [0, k1, k2] } };
        }
        if (kind === 'zero') {
          const k = pickOne([3, 4, 5, 6]);
          if (!(await go([k, 0], t('q_zero')))) return null;
          const dk = roundTo(displacement(k).km, 0.01);
          const vars = { k, total: 2 * k, d: dk, z: 0, u: U };
          question = { kind, vars };
          const c = kmChoices(0, [
            { value: 2 * k, note: 'miss_zero_dist' },
            { value: k, note: 'miss_zero_half' },
            { value: dk, note: 'miss_zero_far' },
          ]);
          question.list = c.list;
          return { ...c, meta: { kind, route: [0, k, 0] } };
        }
        // rule: read the displacement off the map with the 1 km bar; it is never more than the distance
        const k = pickOne([5, 6]); // about 1.4 or 1.3 km: far enough from the book's 2 km to tell apart by eye
        if (!(await go([k], t('q_rule', { k, one: 1, u: U })))) return null;
        const d = roundTo(displacement(k).km, 0.1);
        const vars = { k, d, book: 2, one: 1, u: U };
        question = { kind, vars };
        const c = kmChoices(d, [
          { value: k, note: 'miss_rule_dist' },
          { value: 2, note: 'miss_rule_book' },
          { value: k + 1, note: 'miss_rule_more' },
        ]);
        question.list = c.list;
        return { ...c, meta: { kind, km: k } };
      },
      reveal(_q, correct, picked) {
        s.values = true;
        refresh();
        const { kind, vars, list } = question;
        const why = t(`why_${kind}`, vars);
        const miss = correct ? '' : list[picked.index]?.note;
        return miss ? `${why} ${t(miss, vars)}` : why;
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
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
    stage.invalidate();
  }
  function startAgain() {
    if (s.locked) return lockedNudge();
    newTrip();
    emitChange();
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
      case 'new':
        startAgain();
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
    if (target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return; // the button does it
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    const k = e.key.toLowerCase();
    if (step) {
      if (s.locked) lockedNudge();
      else {
        stopRide();
        moveTo(roundTo(s.km + step * (e.shiftKey ? 1 : 0.1), 0.1));
        settle();
        emitChange();
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (s.mode === 'quiz') return;
      audio.unlock();
      doAction();
    } else if (k === 'b' || k === 'c') rideTo(PLACES[k.toUpperCase()]);
    else if (k === 'a') rideTo(PLACES.A);
    else if (k === 'n') startAgain();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  newTrip();
  if (o.km) ride([Number(o.km)], { animate: false });
  writeNote();
  measureCorner();
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
     * Change any of: km (a new trip from A straight to km), route (a new trip from A through these km, e.g.
     * [6, 0]), ride ('A' | 'B' | 'C' or km: ride on from here, adding to the distance), act (true: what the big
     * button does, the story's next leg), newTrip (true: back to A, distance zero), view; animate: false jumps (the
     * distance still counts every leg).
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
      if (p.act) {
        const plan0 = plan();
        if (plan0.fresh) newTrip();
        lastAct = -Infinity;
        await ride([PLACES[plan0.stop]], { animate });
      }
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
