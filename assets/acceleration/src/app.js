// Acceleration (book pages 43–44, topic 2.6), student view: a CNG auto-rickshaw on a Bangladeshi road.
//  - সোজা রাস্তা: the student drives it with two pedals on the picture (press and hold: গতি বাড়াও, ব্রেক; nothing
//    pressed = the same speed). Over the CNG the বেগ arrow grows and shrinks, the ত্বরণ arrow points forwards
//    (ধনাত্মক ত্বরণ), backwards (মন্দন) or is gone (ত্বরণ নেই); the speedometer reads m/s. The panel draws the
//    বেগ–সময় graph as it goes, each piece lettered (A, B, C…) and coloured by its kind, so the student makes the
//    book's চিত্র ২.০৬ themselves, and works out a = (v − u) ÷ t for the piece it is on (or one they touch).
//  - বাঁক: the same CNG at a steady 4 m/s on an open field; holding বাঁয়ে or ডানে turns it. The speedometer stays
//    put, but the বেগ arrow turns, so ত্বরণ আছে (towards the middle of the turn) while it turns, and only then.
// Then a short test. Built on the shared student kit (@shared/student/…); the physics is in drive.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener } from '@shared/tween.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createCoach } from '@shared/student/coach.js';
import { ICONS, svg } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createArrow } from './arrow.js';
import { blobTexture, createCNG } from './cng.js';
import {
  BRAKE,
  GAS,
  GRAPHS,
  TICK,
  TICKS,
  TRIP,
  TURN,
  TURN_ACCEL,
  VMAX,
  accel,
  dirOf,
  fixed,
  fmt,
  graphTrip,
  lettersOf,
  newTrip,
  newTurn,
  runTrip,
  signed,
  stretchValues,
  tickTrip,
  tickTurn,
  tripAt,
  turnStep,
} from './drive.js';
import { createCompass, createGraph, createSpeedometer } from './gauges.js';
import { createI18n } from './i18n.js';
import { ROAD, createField, createStreet } from './street.js';

export const DEFAULTS = {
  scene: 'line', // 'line' (the straight road) | 'turn' (the bend)
  view: 'front', // 'front' (from the side / from above) | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  trip: '', // '' (start standing) | 'book' (the book's graph already driven, braking now: for the poster)
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per meaning: বেগ blue; ধনাত্মক ত্বরণ purple, মন্দন orange, ত্বরণ নেই grey (style.css has the same)
const COLORS = {
  velocity: '#1c6fd9',
  ghost: '#8db4ea', // the initial velocity u of a test question: a paler বেগ arrow
  ghostInk: '#4a78b8',
  up: '#7048e8',
  down: '#e8590c',
  none: '#868e96',
  turn: '#7048e8',
  track: '#a9b1ba',
  ink: '#1d2733',
};
const V_SCALE = 0.14; // m of arrow per m/s on the road (15 m/s: 2.1 m)
const V_SCALE_TURN = 0.6; // on the bend (4 m/s: 2.4 m)
const A_SCALE = 0.45; // m of arrow per ms⁻² (2 ms⁻²: 0.9 m)
const V_Y = 2.05; // heights of the arrows above the road (the roof is at 1.71 m)
const A_Y = 2.8;
const SHOW_Y = { u: 2.05, v: 2.75, a: 3.45 }; // a test question's arrows: u, v, and the ত্বরণ shown with the answer
const BEND_Y = { v: 1.95, a: 2.05 }; // on the bend (seen from above) both arrows lie just over the roof
const BOOK_TRIP = [
  ['gas', 5],
  ['none', 4],
  ['gas', 2.5],
  ['brake', 2],
]; // the book's চিত্র ২.০৬ (A up, B flat, C up, D down), braking still
const FLASH = 3200; // ms a passing message stays in the panel

const PEDAL_ICONS = {
  gas: svg('<path d="M5 6l6 6-6 6M12 6l6 6-6 6"/>'),
  brake: svg('<rect x="6.5" y="3.5" width="11" height="17" rx="3"/><path d="M9.5 8.5h5M9.5 12h5M9.5 15.5h5"/>'),
  left: svg('<path d="M17 20v-6a5 5 0 0 0-5-5H6"/><path d="M10 5L6 9l4 4"/>'),
  right: svg('<path d="M7 20v-6a5 5 0 0 1 5-5h6"/><path d="M14 5l4 4-4 4"/>'),
};
const SIDES = { line: { left: 'brake', right: 'gas' }, turn: { left: 'left', right: 'right' } };

// where the camera looks from (from the target towards the camera): az turns from the south towards the east
const look = (azDeg, elDeg) => {
  const az = THREE.MathUtils.degToRad(azDeg);
  const el = THREE.MathUtils.degToRad(elDeg);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
};
const VIEWS = {
  line: { front: look(0, 12), '3d': look(38, 22) },
  turn: { front: look(0, 52), '3d': look(-30, 34) },
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const U = (key) => `<span class="ac-u">${t(key)}</span>`;

  root.classList.add('pvc', 'ac');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="ac-top">
            <div class="pvc-seg ac-scenes" role="group" aria-label="${t('scenes')}">
              <button data-scene="line">${t('scene_line')}</button>
              <button data-scene="turn">${t('scene_turn')}</button>
            </div>
            <button class="pvc-btn ac-restart" data-act="restart">${ICONS.reset}<span>${t('act_restart')}</span></button>
          </div>
          <div class="ac-big">
            <div class="ac-graph" data-show="line" title="${t('graph_pick')}"></div>
            <div class="ac-dial" data-show="turn">
              <div class="ac-compass"></div>
              <div class="ac-reads">
                <div class="ac-read"><span><span class="k">${t('speed_name')}</span> <b data-v="speed"></b></span><small>${t('speed_same')}</small></div>
                <div class="ac-read"><span><span class="k">${t('dir_name')}</span> <b data-v="dir"></b></span><small data-v="dir-c"></small></div>
              </div>
            </div>
          </div>
          <div class="ac-mid">
            <div class="ac-sum" data-show="line">
              <span class="ac-badge" data-v="letter"></span>
              <span class="ac-k"><b>${t('acc_name')}</b><small>${t('acc_formula')}</small></span>
              <i>=</i>
              <span class="ac-frac"><span class="ac-num" data-v="num"></span><span class="ac-den" data-v="den"></span></span>
              <i data-v="eq">=</i>
              <span class="ac-res"><b data-v="a"></b><small data-v="kind"></small></span>
            </div>
            <div class="ac-acc" data-show="turn">
              <span class="ac-k"><b>${t('lbl_acc')}</b></span>
              <span class="ac-res"><b data-v="acc"></b><small data-v="acc-c"></small></span>
            </div>
          </div>
          <p class="ac-say"></p>`,
  });
  // on the picture: the speedometer (top left), the two pedals (bottom corners), the graph card of a test question
  const speedoEl = document.createElement('div');
  speedoEl.className = 'ac-speedo';
  const pedalsEl = document.createElement('div');
  pedalsEl.className = 'ac-pedals';
  pedalsEl.setAttribute('role', 'group');
  pedalsEl.setAttribute('aria-label', t('pedals'));
  pedalsEl.innerHTML = `<button class="ac-pedal" data-side="left"></button><button class="ac-pedal" data-side="right"></button>`;
  const card = document.createElement('div');
  card.className = 'ac-card';
  card.hidden = true;
  card.innerHTML = '<div class="ac-card-graph"></div>';
  ui.stage.append(speedoEl, pedalsEl, card);
  const pedalBtn = { left: pedalsEl.querySelector('[data-side="left"]'), right: pedalsEl.querySelector('[data-side="right"]') };

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.1, far: 400, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 4;
  controls.maxDistance = 60;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * 0.48; // never under the road
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });
  scene.fog = new THREE.Fog(0xffffff, 30, 80);

  const street = createStreet();
  const field = createField({ colors: COLORS });
  const cng = createCNG();
  const twin = createCNG({ name: 'CNG2' }); // the second CNG of a test question
  twin.root.visible = false;
  twin.root.userData.noExport = true;
  scene.add(street.root, field.root, cng.root, twin.root);

  const blobMat = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.9), blobMat);
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.012;
  blob.userData.noExport = true;
  cng.root.add(blob);
  const twinBlob = blob.clone();
  twin.root.add(twinBlob);

  const vArrow = createArrow({ color: COLORS.velocity, name: 'Velocity' });
  const aArrow = createArrow({ color: COLORS.up, name: 'Acceleration' });
  const uArrow = createArrow({ color: COLORS.ghost, radius: 0.035, name: 'InitialVelocity' }); // a test question's u
  scene.add(vArrow.root, aArrow.root, uArrow.root);
  uArrow.root.visible = false;

  const shadows = o.shadow && o.bg !== 'transparent';
  let sun = null;
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun = new THREE.DirectionalLight(0xffffff, 0.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 30 });
    sun.shadow.radius = 5;
    scene.add(sun, sun.target);
    blob.visible = twinBlob.visible = false;
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    scene: o.scene === 'turn' ? 'turn' : 'line',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    holds: new Map(), // who holds which pedal: 'pointer:<id>' | 'key:<key>' | 'api' | 'quiz' → 'left' | 'right'
    line: { trip: newTrip(), clock: 0, done: false, selected: -1, shownTick: -1 },
    turn: { st: newTurn(), prev: { e: 0, north: 0, h: 0 }, prevSteer: 0, clock: 0, ticks: 0 },
    flash: null, // a passing message: { key, vars, until }
    show: null, // a test question's still picture on the road: { x, v, u, twin, acc }
    plainTrack: false, // the test: the track is not coloured by turning
    labelsBeside: false, // short, wide pictures: the ত্বরণ label beside its arrow, not above it
  };
  const anchor = new THREE.Vector3(); // what the camera follows
  const smooth = new THREE.Vector3(); // on the bend it follows a little behind
  const rel = { position: new THREE.Vector3(0, 3, 14), target: new THREE.Vector3(0, 1.4, 0) }; // camera, from the anchor

  // ── pedals: press and hold (several fingers or keys may hold at once) ─────────
  const held = (side) => [...s.holds.values()].includes(side);
  const pedal = () => (held('left') ? 'brake' : held('right') ? 'gas' : 'none');
  const steer = () => (held('left') === held('right') ? 'none' : held('left') ? 'left' : 'right');

  function press(source, side) {
    if (s.holds.get(source) === side) return;
    if (s.locked && source !== 'quiz') return lockedNudge();
    s.holds.set(source, side);
    if (source !== 'quiz' && source !== 'api') {
      audio.unlock();
      audio.pop();
      coach?.objectUsed();
    }
    const L = s.line;
    if (s.scene === 'line') {
      L.selected = -1;
      if (L.done) flash('say_full');
      else if (!L.trip.started && side === 'left') flash('say_brake_first');
      else s.flash = null;
    }
    syncPedals();
    refresh();
    emit('pedal', { pedal: s.scene === 'line' ? pedal() : steer() });
  }
  function release(source) {
    if (!s.holds.delete(source)) return;
    syncPedals();
    refresh();
    emit('pedal', { pedal: s.scene === 'line' ? pedal() : steer() });
  }
  function releaseAll() {
    s.holds.clear();
    syncPedals();
  }
  function syncPedals() {
    for (const side of ['left', 'right']) {
      const b = pedalBtn[side];
      const on = held(side);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
  }
  function labelPedals() {
    for (const side of ['left', 'right']) {
      const kind = SIDES[s.scene][side];
      const b = pedalBtn[side];
      b.dataset.pedal = kind;
      b.innerHTML = `${PEDAL_ICONS[kind]}<span>${t(`pedal_${kind}`)}</span>`;
    }
  }
  function flash(key, vars) {
    s.flash = { key, vars, until: performance.now() + FLASH };
    setTimeout(refresh, FLASH + 20);
  }

  // ── the straight road ───────────────────────────────────────────────────────
  /** A new trip: standing at the start of the road. */
  function newDrive() {
    s.line = { trip: newTrip(), clock: 0, done: false, selected: -1, shownTick: -1 };
    s.flash = null;
  }
  /** Drive a script at once (the book's trip for the poster, the bridge's `drive`). */
  function driveNow(script, { keep = false } = {}) {
    if (!keep) newDrive();
    const L = s.line;
    runTrip(script, L.trip);
    L.clock = L.trip.n * TICK;
    L.done = L.trip.n >= TICKS;
    L.shownTick = -1;
  }
  /** The tick shown now (its numbers are exact), the stretch it is in, and that stretch's index. */
  function lineNow() {
    const L = s.line;
    const trip = L.trip;
    const k = trip.started ? Math.min(trip.n, Math.floor(L.clock / TICK + 1e-9)) : 0;
    const sts = trip.stretches;
    let i = sts.findIndex((st) => st.t0 <= k && k < st.t1); // the piece being driven now
    if (i < 0) i = sts.length - 1;
    return { k, i, st: sts[i] || null };
  }
  /** The piece the panel works out: the one touched on the graph, or the one driven last (at least 0.1 s of it). */
  function sumStretch() {
    const L = s.line;
    const trip = L.trip;
    const sts = trip.stretches;
    if (!trip.started || !sts.length) return null;
    const { k } = lineNow();
    let i = L.selected >= 0 && L.selected < sts.length ? L.selected : sts.findIndex((st) => st.t0 <= k - 1 && k - 1 < st.t1);
    if (i < 0) i = sts.length - 1;
    const st = sts[i];
    const end = Math.min(st.t1, Math.max(k, st.t0 + 1));
    return { i, st: { ...st, t1: end, v: trip.vs[end] }, live: L.selected < 0 && i === sts.length - 1 && !L.done };
  }

  function tickLine(dt) {
    const L = s.line;
    if (s.show) {
      placeShow();
      return false;
    }
    const running = s.mode !== 'quiz' && !L.done;
    if (running && !L.trip.started && pedal() === 'gas') {
      tickTrip(L.trip, 'gas'); // the clock starts with the first press of the gas
      L.clock = 0;
      emit('start', {});
    }
    if (running && L.trip.started) {
      L.clock = Math.min(TRIP, L.clock + dt);
      while (L.trip.n < TICKS && L.trip.n * TICK <= L.clock + 1e-9) tickTrip(L.trip, pedal());
      if (L.trip.n >= TICKS && L.clock >= TRIP - 1e-9) {
        L.done = true;
        releaseAll();
        audio.success();
        emit('done', snapshot().line);
      }
    }
    const p = tripAt(L.trip, L.clock);
    const { k, st } = lineNow();
    placeLine(p.x, p.v, L.trip.started ? (st?.kind ?? 'none') : 'none', L.trip.vs[k] / 10);
    if (k !== L.shownTick) {
      L.shownTick = k;
      refresh();
      emitChange();
    }
    return running && L.trip.started && (p.v > 0 || pedal() !== 'none');
  }

  let shownKind = '';
  /** The CNG at distance x (m) along the road at speed v (m/s, smooth), its acceleration of this kind. */
  function placeLine(x, v, kind, vShown) {
    cng.root.position.set(x, 0, ROAD.lane);
    cng.root.rotation.set(0, 0, 0);
    cng.roll(x);
    cng.steer(0);
    street.follow(x);
    anchor.set(x, 0, ROAD.lane);
    vArrow.root.scale.set(1, 1, 1);
    aArrow.root.scale.set(1, 1, 1);
    vArrow.set(tmpA.set(x, V_Y, ROAD.lane), EAST, v * V_SCALE);
    const a = kind === 'up' ? GAS : kind === 'down' ? BRAKE : 0;
    aArrow.set(tmpA.set(x, A_Y, ROAD.lane), a < 0 ? WEST : EAST, Math.abs(a) * A_SCALE);
    aArrow.setColor(COLORS[kind]);
    const moving = v > 0.04;
    const key = `${kind}|${s.labelsBeside}|${moving}`;
    if (key !== shownKind) {
      shownKind = key;
      lineLabels(kind, moving);
    }
    speedo.set(v, `${N(fixed(vShown, 1))}`);
    moveSun();
  }
  /**
   * The labels of the two arrows, never on them: বেগ before the start of its arrow (none while standing: there is
   * no arrow); ত্বরণ / মন্দন above the middle of its arrow, or beside its tip in short, wide pictures.
   */
  function lineLabels(kind, moving) {
    const showV = s.scene === 'line' && s.mode !== 'quiz' && moving;
    label('v', showV ? 'line' : '', () =>
      annotations.add('v', {
        text: t('lbl_velocity'),
        point: () => labelPoint.set(anchor.x - 0.06, V_Y, anchor.z),
        dx: -8,
        dy: 0,
        kind: 'callout',
        color: COLORS.velocity,
      }),
    );
    const showA = s.scene === 'line' && (s.mode !== 'quiz' || s.show?.acc);
    const y = s.show?.u != null ? SHOW_Y.a : A_Y;
    const beside = s.labelsBeside && s.show?.u == null;
    label('a', showA ? `line|${kind}|${beside}|${y}` : '', () => {
      if (kind === 'none')
        return annotations.add('a', {
          text: t('lbl_no_acc'),
          point: () => labelPoint2.set(anchor.x, A_Y, anchor.z),
          dx: 0,
          dy: 0,
          kind: 'callout',
          color: COLORS.none,
        });
      const a = (kind === 'up' ? GAS : BRAKE) * A_SCALE;
      const sign = Math.sign(a);
      annotations.add('a', {
        text: t(kind === 'up' ? 'lbl_acc' : 'lbl_dec'),
        point: beside ? () => labelPoint2.set(anchor.x + a + 0.1 * sign, y, anchor.z) : () => labelPoint2.set(anchor.x + a / 2, y + 0.13, anchor.z),
        dx: beside ? 8 * sign : 0,
        dy: beside ? 0 : -20,
        kind: 'callout',
        color: COLORS[kind],
      });
    });
  }
  // each arrow label is made again only when what it says or where it sits changes (so it does not flicker)
  const labelKeys = { v: '', a: '' };
  function label(id, key, make) {
    if (labelKeys[id] === key) return;
    labelKeys[id] = key;
    annotations.remove(id);
    if (key) make();
  }
  /** Forget the arrow labels: they are made again on the next frame (after a change of scene, mode or question). */
  function relabel() {
    shownKind = '';
    labelKeys.v = labelKeys.a = '';
    annotations.remove('v');
    annotations.remove('a');
  }
  const EAST = new THREE.Vector3(1, 0, 0);
  const WEST = new THREE.Vector3(-1, 0, 0);
  const tmpA = new THREE.Vector3();
  const labelPoint = new THREE.Vector3();
  const labelPoint2 = new THREE.Vector3();

  // ── the bend ────────────────────────────────────────────────────────────────
  function newBend() {
    s.turn = { st: newTurn(), prev: { e: 0, north: 0, h: 0 }, prevSteer: 0, clock: 0, ticks: 0 };
    field.clearTrack();
    smooth.set(0, 0, 0);
  }
  const turnSign = (name) => (name === 'left' ? 1 : name === 'right' ? -1 : 0);
  function tickBend(dt) {
    const T = s.turn;
    const running = s.mode !== 'quiz' || question?.kind === 'bend';
    if (running) {
      T.clock += dt;
      while (T.ticks * TICK <= T.clock + 1e-9) {
        T.prev = { e: T.st.e, north: T.st.north, h: T.st.h };
        const name = steer();
        T.prevSteer = turnSign(name);
        field.addPoint(T.prev.e, T.prev.north, T.prev.h, T.prevSteer !== 0 && !s.plainTrack);
        tickTurn(T.st, name);
        T.ticks++;
      }
    }
    const f = Math.min(1, Math.max(0, T.clock / TICK - (T.ticks - 1)));
    const p = turnStep(T.prev.e, T.prev.north, T.prev.h, T.prevSteer, f * TICK);
    placeBend(p.e, p.north, p.h, T.prevSteer, dt);
    const key = `${T.prevSteer}|${dirOf(p.h)}`;
    if (key !== tickBend.key) {
      tickBend.key = key;
      refresh();
      emitChange();
    }
    compass.set(p.h, T.prevSteer);
    return running;
  }
  function placeBend(e, north, h, sgn, dt) {
    cng.root.position.set(e, 0, -north);
    cng.root.rotation.set(0, h, 0);
    cng.roll(TURN.v * (s.turn.ticks * TICK));
    cng.steer(sgn * 0.38);
    field.follow(e, -north);
    // the camera follows a little behind, so the CNG is seen moving and turning
    tmpA.set(e, 0, -north);
    if (dt === null || smooth.distanceTo(tmpA) > 12) smooth.copy(tmpA);
    else smooth.lerp(tmpA, 1 - Math.exp(-(dt || 0) / 0.3));
    anchor.copy(smooth);
    // seen from above the arrows sit just over the roof, both from its middle: বেগ along the way it goes, ত্বরণ
    // towards the middle of the turn
    bendDir.v.set(Math.cos(h), 0, -Math.sin(h));
    vArrow.root.scale.set(1.9, 1, 1.9); // thicker: seen from above, from farther away
    aArrow.root.scale.set(1.9, 1, 1.9);
    vArrow.set(tmpA.set(e, BEND_Y.v, -north), bendDir.v, TURN.v * V_SCALE_TURN);
    const toward = h + sgn * (Math.PI / 2);
    bendDir.a.set(Math.cos(toward), 0, -Math.sin(toward));
    aArrow.set(tmpA.set(e, BEND_Y.a, -north), bendDir.a, sgn ? TURN_ACCEL * A_SCALE : 0);
    aArrow.setColor(COLORS.turn);
    const showAcc = s.mode !== 'quiz' || quiz.revealed;
    if (!showAcc) aArrow.root.visible = false;
    const kind = `${sgn ? 'turn' : 'straight'}|${showAcc}`;
    if (kind !== shownKind) {
      shownKind = kind;
      bendLabels(sgn, showAcc);
    }
    speedo.set(TURN.v, N(fixed(TURN.v, 1)));
    moveSun();
  }
  /** On the bend each label sits just past the tip of its arrow, in line with it, so it turns with it. */
  function bendLabels(sgn, showAcc) {
    label('v', 'bend', () =>
      annotations.add('v', {
        text: t('lbl_velocity'),
        point: () => labelPoint.copy(vArrow.tip).addScaledVector(bendDir.v, 0.95),
        dx: 0,
        dy: 0,
        kind: 'callout',
        color: COLORS.velocity,
      }),
    );
    label('a', showAcc ? `bend|${sgn ? 'turn' : 'straight'}` : '', () =>
      sgn
        ? annotations.add('a', {
            text: t('lbl_acc'),
            point: () => labelPoint2.copy(aArrow.tip).addScaledVector(bendDir.a, 1.0),
            dx: 0,
            dy: 0,
            kind: 'callout',
            color: COLORS.turn,
          })
        : // going straight: beside the CNG, on its right
          annotations.add('a', {
            text: t('lbl_no_acc'),
            point: () =>
              labelPoint2
                .copy(cng.root.position)
                .addScaledVector(tmpC.set(-bendDir.v.z, 0, bendDir.v.x), 2.3)
                .setY(0.6),
            dx: 0,
            dy: 0,
            kind: 'callout',
            color: COLORS.none,
          }),
    );
  }
  const bendDir = { v: new THREE.Vector3(1, 0, 0), a: new THREE.Vector3(0, 0, -1) };
  const tmpC = new THREE.Vector3();

  function moveSun() {
    if (!sun) return;
    const p = cng.root.position;
    sun.position.set(p.x + 3, 12, p.z + 5);
    sun.target.position.copy(p);
  }

  // the motion runs on real time (performance.now), not the stage's capped frame time, so a slow phone still shows
  // 1 s as 1 s; a long pause (a hidden tab) counts as at most a quarter of a second
  let lastNow = performance.now();
  stage.addTicker(() => {
    const now = performance.now();
    const dt = Math.min(0.25, Math.max(0, (now - lastNow) / 1000));
    lastNow = now;
    const moving = s.scene === 'line' ? tickLine(dt) : tickBend(dt);
    followCamera();
    return moving;
  });

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const cells = {};
  for (const node of root.querySelectorAll('.pvc-learn [data-v]')) cells[node.dataset.v] = { node, html: null };
  function put(k, html) {
    const c = cells[k];
    if (c && c.html !== html) {
      c.html = html;
      c.node.innerHTML = html;
    }
  }
  const sayEl = $('.ac-say');
  let sayShown = '';
  const say = (html) => {
    if (html !== sayShown) {
      sayShown = html;
      sayEl.innerHTML = html;
    }
  };
  const graph = createGraph($('.ac-graph'), { t, N, colors: COLORS });
  const cardGraph = createGraph(card.querySelector('.ac-card-graph'), { t, N, colors: COLORS });
  const compass = createCompass($('.ac-compass'), { t, colors: COLORS });
  const speedo = createSpeedometer(speedoEl, { t, N, colors: COLORS });

  function refresh() {
    if (s.flash && performance.now() > s.flash.until) s.flash = null;
    if (s.scene === 'line') refreshLine();
    else refreshBend();
    stage.invalidate();
  }
  function refreshLine() {
    const L = s.line;
    const trip = L.trip;
    const { k } = lineNow();
    graph.draw({ trip, upto: k, selected: L.selected, hint: t('graph_hint') });
    const sum = sumStretch();
    if (!sum) {
      // nothing driven yet: the formula itself, the numbers come with the first press
      put('letter', '–');
      put('num', '(<b class="c-v">v</b> − <b class="c-v">u</b>)');
      put('den', '<b>t</b>');
      put('eq', '=');
      put('a', '–');
      put('kind', '&nbsp;');
      cells.a.node.parentElement.dataset.kind = 'none';
      cells.letter.node.dataset.kind = 'none';
    } else {
      const v = stretchValues(sum.st);
      const letters = lettersOf(trip.stretches);
      const prior = letters.slice(0, sum.i).filter(Boolean).length;
      const letter = letters[sum.i] || (sum.live ? String.fromCharCode(65 + prior) : '–');
      const ticks = sum.st.t1 - sum.st.t0;
      const exact = ((sum.st.v - sum.st.u) * 10) % ticks === 0;
      put('letter', letter);
      put('num', `(<b class="c-v">${N(fixed(v.v, 1))}</b> − <b class="c-v">${N(fixed(v.u, 1))}</b>) ${U('u_ms')}`);
      put('den', `<b>${N(fixed(v.t, 1))}</b> ${U('u_s')}`);
      put('eq', exact ? '=' : '≈');
      put('a', `${N(signed(v.a, 1))} ${U('u_acc')}`);
      put('kind', t(`kind_${v.kind}`));
      cells.a.node.parentElement.dataset.kind = v.kind;
      cells.letter.node.dataset.kind = v.kind;
    }
    // the sentence: what is happening, or the piece touched, or a passing message
    if (s.flash) return say(t(s.flash.key, s.flash.vars));
    if (L.selected >= 0 && sum) {
      const v = stretchValues(sum.st);
      return say(t(`picked_${v.kind}`, { l: lettersOf(trip.stretches)[sum.i] || '–', t: fmt(v.t, 1), u: fmt(v.u, 1), v: fmt(v.v, 1) }));
    }
    if (!trip.started) return say(t('say_wait'));
    if (L.done) return say(t('say_done', { s: TRIP }));
    const { st } = lineNow();
    const vNow = trip.vs[k] / 10;
    if (st?.kind === 'up') return say(t('say_up', { a: GAS }));
    if (st?.kind === 'down') return say(t('say_down', { a: -BRAKE }));
    if (vNow === 0) return say(t('say_none_rest'));
    if (vNow >= VMAX && pedal() === 'gas') return say(t('say_none_top', { v: VMAX }));
    say(t('say_none_move'));
  }
  function refreshBend() {
    const T = s.turn;
    const sgn = T.prevSteer;
    put('speed', `${N(fixed(TURN.v, 1))} ${U('u_ms')}`);
    put('dir', t(`dir_${dirOf(T.st.h)}`));
    put('dir-c', t(sgn ? 'dir_changing' : 'dir_same'));
    cells['dir-c'].node.dataset.on = String(Boolean(sgn));
    put('acc', t(sgn ? 'acc_yes' : 'acc_no'));
    put('acc-c', t(sgn ? 'acc_center' : 'acc_none_why'));
    cells.acc.node.parentElement.dataset.kind = sgn ? 'up' : 'none';
    if (s.flash) return say(t(s.flash.key, s.flash.vars));
    say(t(sgn ? 'say_turn' : 'say_straight'));
  }

  function snapshot() {
    const L = s.line;
    const trip = L.trip;
    const { k, st } = lineNow();
    const letters = lettersOf(trip.stretches);
    const T = s.turn;
    return {
      scene: s.scene,
      view: s.view,
      mode: s.mode,
      pedal: s.scene === 'line' ? pedal() : steer(),
      line: {
        started: trip.started,
        done: L.done,
        time: +(k * TICK).toFixed(1),
        speed: trip.vs[k] / 10,
        distance: +trip.xs[k].toFixed(2),
        kind: trip.started ? (st?.kind ?? 'none') : 'none',
        acceleration: trip.started && st ? stretchValues(st).a : 0,
        stretches: trip.stretches.map((x, i) => {
          const v = stretchValues(x);
          return { letter: letters[i], kind: v.kind, from: v.t0, to: +v.t1.toFixed(1), u: v.u, v: v.v, t: v.t, a: +v.a.toFixed(3) };
        }),
      },
      turn: {
        speed: TURN.v,
        heading: +((((T.st.h * 180) / Math.PI) % 360) + 360).toFixed(1) % 360,
        direction: dirOf(T.st.h),
        turning: T.prevSteer === 1 ? 'left' : T.prevSteer === -1 ? 'right' : 'none',
        acceleration: T.prevSteer ? +TURN_ACCEL.toFixed(3) : 0,
      },
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.scene}|${snap.mode}|${snap.pedal}|${snap.line.kind}|${Math.round(snap.line.time)}|${snap.turn.turning}|${snap.turn.direction}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── camera: framed to the CNG and its arrows, clear of the buttons; it follows the CNG ──
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  /** What must be in the picture, from the anchor: points, some with a label box on the screen [l, t, r, b] px. */
  function contentOf(name) {
    const P = (x, y, z, box = null) => ({ p: new THREE.Vector3(x, y, z), box });
    const pts = [];
    if (name === 'line') {
      for (const x of [-1.42, 1.42]) for (const y of [0, 1.72]) for (const z of [-0.66, 0.66]) pts.push(P(x, y, z));
      const front = s.labelsBeside ? 1 : 2.6;
      pts.push(P(-1.6, 0, front), P(1.6, 0, front)); // a strip of road in front of the wheels (the pedals sit beside it)
      const sh = s.show;
      if (sh?.twin) {
        // a test question: the second CNG, ahead in the same lane, and the labels over both (in two rows, so
        // they never overlap)
        const dx = sh.twin.dx;
        for (const x of [dx - 1.42, dx + 1.42]) for (const y of [0, 1.72]) for (const z of [-0.66, 0.66]) pts.push(P(x, y, z));
        pts.push(P(0, 1.75, 0, [-80, -78, 80, -46]), P(dx, 1.75, 0, [-80, -42, 80, -10]));
        return pts;
      }
      if (sh?.u != null) {
        // a test question: u and v with their labels before their arrows, the ত্বরণ arrow on top (after the answer)
        const lbl = [-205, -14, 0, 14];
        pts.push(P(-0.06, SHOW_Y.u, 0, lbl), P(-0.06, SHOW_Y.v, 0, lbl), P(VMAX * V_SCALE, SHOW_Y.v, 0));
        pts.push(P(BRAKE * A_SCALE, SHOW_Y.a, 0), P(BRAKE * A_SCALE * 0.5, SHOW_Y.a + 0.13, 0, [-40, -46, 40, 0]));
        pts.push(P(GAS * A_SCALE * 0.5, SHOW_Y.a + 0.13, 0, [-40, -46, 40, 0]));
        return pts;
      }
      const side = s.labelsBeside ? 4.2 : 3.3;
      pts.push(P(-side, 0, 0), P(side, 0, 0)); // and some road on both sides, so a wide picture shows the street too
      // the arrows at their longest, and their labels: বেগ before its arrow, ত্বরণ / মন্দন above, ত্বরণ নেই
      pts.push(P(VMAX * V_SCALE + 0.05, V_Y, 0), P(-0.06, V_Y, 0, [-60, -14, 0, 14]));
      if (s.labelsBeside) pts.push(P(GAS * A_SCALE + 0.1, A_Y, 0, [0, -14, 72, 14]), P(BRAKE * A_SCALE - 0.1, A_Y, 0, [-72, -14, 0, 14]));
      else pts.push(P(GAS * A_SCALE * 0.5, A_Y + 0.13, 0, [-34, -46, 34, 0]), P(BRAKE * A_SCALE * 0.5, A_Y + 0.13, 0, [-34, -46, 34, 0]));
      pts.push(P(BRAKE * A_SCALE, A_Y, 0), P(0, A_Y, 0, [-48, -14, 48, 14]));
      return pts;
    }
    // the bend: a ring round the CNG (it runs a little ahead of the anchor) with its arrows and their labels
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      pts.push(P(3.6 * Math.cos(a), 0, 3.6 * Math.sin(a)), P(3.6 * Math.cos(a), 2, 3.6 * Math.sin(a), [-28, -14, 28, 14]));
    }
    return pts;
  }
  /** A box on the stage, on the canvas (px), a little bigger; null when it is not shown. */
  function boxOf(el, pad = 6) {
    if (!el || el.hidden || getComputedStyle(el).visibility === 'hidden' || getComputedStyle(el).display === 'none') return null;
    const c = stage.canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left - c.left - pad, right: r.right - c.left + pad, top: r.top - c.top - pad, bottom: r.bottom - c.top + pad };
  }
  /** A camera pose (from the anchor) showing everything as big as it can, clear of the buttons and the speedometer. */
  function poseFor(name, view) {
    s.labelsBeside = stage.width > stage.height * 1.45; // short, wide pictures: labels beside the arrows
    const pts = contentOf(name);
    const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
    const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const { p } of pts) {
      lo.min(p);
      hi.max(p);
    }
    const target = lo.clone().add(hi).multiplyScalar(0.5);
    if (name === 'turn') target.y = 0.9;
    const back = VIEWS[name][view].clone();
    const right = new THREE.Vector3().crossVectors(WORLD_UP, back).normalize();
    const up = new THREE.Vector3().crossVectors(back, right);
    const local = pts.map(({ p, box }) => {
      const q = p.clone().sub(target);
      return { x: q.dot(right), y: q.dot(up), z: q.dot(back), box };
    });
    const W = stage.width;
    const H = Math.max(stage.height, 120);
    const boxes = [boxOf(ui.corner), boxOf(speedoEl), boxOf(pedalBtn.left, 4), boxOf(pedalBtn.right, 4)].filter(Boolean);
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const th = tv * camera.aspect;
    const M = 8;
    const clear = (px, py) => {
      if (px < M || px > W - M || py < M || py > H - M) return false;
      return !boxes.some((r) => px > r.left && px < r.right && py > r.top && py < r.bottom);
    };
    const fits = (d, sx, sy) =>
      local.every(({ x, y, z, box }) => {
        const depth = d - z;
        if (depth < 0.3) return false;
        const px = W / 2 + (x / (depth * th)) * (W / 2) + sx;
        const py = H / 2 - (y / (depth * tv)) * (H / 2) + sy;
        if (!box) return clear(px, py);
        return (
          clear(px + box[0], py + box[1]) && clear(px + box[2], py + box[1]) && clear(px + box[0], py + box[3]) && clear(px + box[2], py + box[3])
        );
      });
    let best = null;
    for (let sy = -40; sy <= 60; sy += 5)
      for (let sx = -30; sx <= 30; sx += 10) {
        let a = 1;
        let b = 160;
        if (!fits(b, sx, sy)) continue;
        for (let i = 0; i < 26; i++) {
          const mid = (a + b) / 2;
          if (fits(mid, sx, sy)) b = mid;
          else a = mid;
        }
        if (!best || b < best.d - 1e-3) best = { d: b, sx, sy };
      }
    const d = (best?.d ?? 30) * 1.02;
    // the shift moves the picture: the camera moves the other way by as much, at the distance of the scene
    const t2 = target.addScaledVector(up, ((best?.sy ?? 0) / (H / 2)) * d * tv).addScaledVector(right, (-(best?.sx ?? 0) / (W / 2)) * d * th);
    return { target: t2, position: t2.clone().addScaledVector(back, d), distance: d };
  }
  function applyFog(d) {
    scene.fog.near = d + (s.scene === 'line' ? 4 : 10);
    scene.fog.far = d + (s.scene === 'line' ? 30 : 46);
  }
  function flyTo(pose, duration = 0.8) {
    applyFog(pose.distance ?? 20);
    const p0 = rel.position.clone();
    const t0 = rel.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      rel.position.copy(pose.position);
      rel.target.copy(pose.target);
      followCamera();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        rel.position.lerpVectors(p0, pose.position, k);
        rel.target.lerpVectors(t0, pose.target, k);
        followCamera();
        stage.invalidate();
      },
    }).finished;
  }
  let following = false;
  /** Keep the camera where it is relative to what it follows (the student may have turned it). */
  function followCamera() {
    following = true;
    camera.position.copy(anchor).add(rel.position);
    controls.target.copy(anchor).add(rel.target);
    controls.update();
    following = false;
  }
  controls.addEventListener('change', () => {
    if (following) return;
    rel.position.copy(camera.position).sub(anchor);
    rel.target.copy(controls.target).sub(anchor);
  });
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(poseFor(s.scene, s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(poseFor(s.scene, s.view), 0);
  });

  // ── the two examples ────────────────────────────────────────────────────────
  function setScene(name, { animate = true } = {}) {
    const next = name === 'turn' ? 'turn' : 'line';
    releaseAll();
    s.scene = next;
    street.root.visible = s.scene === 'line';
    field.root.visible = s.scene === 'turn';
    relabel();
    annotations.clear();
    tickBend.key = '';
    s.line.shownTick = -1;
    s.flash = null;
    if (s.scene === 'turn') {
      newBend();
      placeBend(0, 0, 0, 0, null);
    } else {
      const p = tripAt(s.line.trip, s.line.clock);
      anchor.set(p.x, 0, ROAD.lane);
    }
    labelPedals();
    s.userMovedCamera = false;
    for (const b of ui.$$('[data-view="front"]')) b.textContent = t(s.scene === 'line' ? 'view_front_short' : 'view_top_short');
    syncUI();
    flyTo(poseFor(s.scene, s.view), animate ? 0.7 : 0);
    refresh();
    emit('scene', { scene: s.scene });
    emitChange();
  }
  function restart() {
    if (s.locked) return lockedNudge();
    releaseAll();
    if (s.scene === 'line') {
      newDrive();
      relabel();
    } else newBend();
    refresh();
    emitChange();
  }

  // ── pointer and keys on the pedals; touching the graph picks a piece ────────
  pedalsEl.addEventListener('pointerdown', (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest('.ac-pedal');
    if (!b || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    coach?.interrupt();
    try {
      b.setPointerCapture(e.pointerId); // the finger may slide off the pedal and still hold it
    } catch {}
    press(`pointer:${e.pointerId}`, b.dataset.side);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pedalsEl.addEventListener(type, (e) => release(`pointer:${e.pointerId}`));
  pedalsEl.addEventListener('contextmenu', (e) => e.preventDefault());
  $('.ac-graph').addEventListener('pointerdown', (e) => {
    if (s.mode === 'quiz' || !s.line.trip.started) return;
    const i = graph.pick(e.clientX, s.line.trip);
    if (i < 0 || (!s.line.done && i === s.line.trip.stretches.length - 1 && pedal() !== 'none')) return;
    s.line.selected = s.line.selected === i ? -1 : i;
    s.flash = null;
    refresh();
  });

  // ── hint line (the test only: in learning the panel says everything) ────────
  let hintTimer = 0;
  function showHint(msg, { duration = 3000 } = {}) {
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
  function lockedNudge() {
    showHint(t('q_locked'));
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
  const letters4 = ['A', 'B', 'C', 'D'];
  const accHtml = (a, unit = 'u_acc') => `${N(fmt(a, 2).replace('-', '−'))}<small>${t(unit)}</small>`;
  // book-style numbers: speeding up (u, v, t) and braking (u, v, t), all with real CNG speeds
  const SPEED_UPS = [
    [6, 14, 4],
    [4, 13, 3],
    [2, 11, 6],
    [5, 15, 4],
    [3, 15, 6],
  ];
  const BRAKINGS = [
    [12, 3, 3],
    [15, 5, 4],
    [10, 4, 3],
    [14, 2, 4],
    [9, 3, 2],
  ];
  const PAIRS = [
    [5, 10, 8, 12],
    [4, 8, 10, 15],
    [3, 9, 6, 12],
    [2, 6, 5, 10],
  ]; // (t, v) of the quicker CNG, then of the one that ends faster but gains speed more slowly

  let kinds = [];
  let question = null;
  let lastPick = -1;
  function clearQuizMarks() {
    card.hidden = true;
    speedoEl.hidden = false;
    twin.root.visible = false;
    uArrow.root.visible = false;
    s.show = null;
    s.plainTrack = false;
    for (const id of ['qu', 'qv', 'c1', 'c2']) annotations.remove(id);
    relabel();
    releaseAll();
  }
  /** A still picture on the road: the CNG at speed v, a faint arrow for u, perhaps a second CNG. */
  function showOnRoad(show) {
    if (s.scene !== 'line') setScene('line', { animate: false });
    s.show = { x: s.line.trip.xs[s.line.trip.n] || 0, ...show };
    relabel();
    placeShow();
    if (!s.userMovedCamera) flyTo(poseFor('line', s.view), 0.6);
  }
  function placeShow() {
    const sh = s.show;
    const kind = sh.acc ? (sh.v > sh.u ? 'up' : 'down') : 'none';
    placeLine(sh.x, sh.v, kind, sh.v);
    if (!sh.acc) aArrow.root.visible = false;
    if (sh.u != null) {
      // u (faint) just over the roof, v above it, and the ত্বরণ arrow on top once the answer is given
      uArrow.set(tmpA.set(sh.x, SHOW_Y.u, ROAD.lane), EAST, sh.u * V_SCALE);
      uArrow.root.visible = sh.u > 0;
      vArrow.set(tmpA.set(sh.x, SHOW_Y.v, ROAD.lane), EAST, sh.v * V_SCALE);
      const a = (sh.v - sh.u) / Math.abs(sh.v - sh.u || 1);
      aArrow.set(tmpA.set(sh.x, SHOW_Y.a, ROAD.lane), a < 0 ? WEST : EAST, (a < 0 ? -BRAKE : GAS) * A_SCALE);
      if (!sh.acc) aArrow.root.visible = false;
    }
    if (sh.twin) {
      twin.root.visible = true;
      twin.root.position.set(sh.x + sh.twin.dx, 0, ROAD.lane);
      twin.roll(sh.x * 1.7);
      vArrow.root.visible = false;
      aArrow.root.visible = false;
    }
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.locked = true;
        hideHint();
        releaseAll();
        kinds = shuffle(['graph', 'calc', 'brake', 'compare', 'bend']);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        clearQuizMarks();
        newDrive();
        setScene('line');
        syncUI();
      },
      prepare(i, _alive, sayQ) {
        clearQuizMarks();
        const kind = kinds[i % kinds.length];
        lastPick = -1;
        if (kind === 'graph') {
          // a graph like the book's চিত্র ২.০৬, in one ink colour (colour must not give the answer)
          const g = graphTrip(Math.floor(Math.random() * GRAPHS.length));
          const target = pickOne(g.unique);
          const expected = g.kinds.indexOf(target);
          if (s.scene !== 'line') setScene('line', { animate: false });
          card.hidden = false;
          speedoEl.hidden = true;
          cardGraph.draw({ trip: g.trip, plain: true, tmax: 20 });
          sayQ(t(`q_graph_${target}`));
          question = { kind, g, target, expected };
          return { choices: [0, 1, 2, 3], expected, tolerance: 0.5, label: (j) => letters4[j], meta: { kind, target, stretches: g.kinds } };
        }
        if (kind === 'calc' || kind === 'brake') {
          const [u, v, tt] = pickOne(kind === 'calc' ? SPEED_UPS : BRAKINGS);
          const a = accel(u, v, tt);
          showOnRoad({ u, v });
          // the labels before the arrows (like বেগ while learning), so long numbers never run off the picture
          const pu = new THREE.Vector3();
          const pv = new THREE.Vector3();
          annotations.add('qu', {
            text: t('lbl_u', { u }),
            point: () => pu.set(anchor.x - 0.06, SHOW_Y.u, anchor.z),
            dx: -8,
            dy: 0,
            kind: 'callout',
            color: COLORS.ghostInk,
          });
          annotations.add('qv', {
            text: t('lbl_v', { v }),
            point: () => pv.set(anchor.x - 0.06, SHOW_Y.v, anchor.z),
            dx: -8,
            dy: 0,
            kind: 'callout',
            color: COLORS.velocity,
          });
          sayQ(t(kind === 'calc' ? 'q_calc' : 'q_brake', { u, v, t: tt }));
          // the usual slips: calc — the unit of velocity, v ÷ t (u left out), (v − u) × t; brake — the sign lost,
          // the whole of u ÷ t (as if it stopped), v ÷ t
          const opts =
            kind === 'calc'
              ? [
                  { a, unit: 'u_acc', why: '' },
                  { a, unit: 'u_ms', why: 'mis_unit' },
                  { a: v / tt, unit: 'u_acc', why: 'mis_no_u' },
                  { a: (v - u) * tt, unit: 'u_m', why: 'mis_times' },
                ]
              : [
                  { a, unit: 'u_acc', why: '' },
                  { a: -a, unit: 'u_acc', why: 'mis_sign' },
                  { a: -u / tt, unit: 'u_acc', why: 'mis_u_only' },
                  { a: v / tt, unit: 'u_acc', why: 'mis_v_only' },
                ];
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, u, v, t: tt, a, opts: order.map((j) => opts[j]) };
          return {
            choices: [0, 1, 2, 3],
            expected: order.indexOf(0),
            tolerance: 0.5,
            label: (j) => accHtml(question.opts[j].a, question.opts[j].unit),
            meta: { kind, u, v, t: tt, acceleration: a },
          };
        }
        if (kind === 'compare') {
          const [t1, v1, t2, v2] = pickOne(PAIRS);
          const quickFirst = Math.random() < 0.5; // which number the quicker CNG gets
          const one = quickFirst ? { t: t1, v: v1 } : { t: t2, v: v2 };
          const two = quickFirst ? { t: t2, v: v2 } : { t: t1, v: v1 };
          // one behind the other in the same lane; the labels in two rows (the first one's higher)
          speedoEl.hidden = true; // two CNGs: one speedometer would belong to neither
          showOnRoad({ v: one.v, twin: { dx: 4.6, v: two.v } });
          const p1 = new THREE.Vector3();
          const p2 = new THREE.Vector3();
          annotations.add('c1', {
            text: t('lbl_cng', { n: 1, t: one.t, v: one.v, z: 0 }),
            point: () => p1.set(cng.root.position.x, 1.75, ROAD.lane),
            dx: 0,
            dy: -62,
            kind: 'part',
          });
          annotations.add('c2', {
            text: t('lbl_cng', { n: 2, t: two.t, v: two.v, z: 0 }),
            point: () => p2.set(twin.root.position.x, 1.75, ROAD.lane),
            dx: 0,
            dy: -26,
            kind: 'part',
          });
          sayQ(t('q_compare'));
          const winner = quickFirst ? 1 : 2;
          const keys = shuffle(['one', 'two', 'equal', 'cant']);
          question = { kind, one, two, winner, keys };
          const label = (j) => {
            const k = keys[j];
            const text = k === 'one' ? t('opt_cng', { n: 1 }) : k === 'two' ? t('opt_cng', { n: 2 }) : t(k === 'equal' ? 'opt_equal' : 'opt_cant');
            return `<span class="ac-opt">${text}</span>`;
          };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf(winner === 1 ? 'one' : 'two'), tolerance: 0.5, label, meta: { kind, one, two } };
        }
        // the bend: going round at the same speed (the speedometer stays put); the ত্বরণ arrow is hidden until the answer
        setScene('turn', { animate: false });
        s.plainTrack = true;
        s.holds.set('quiz', 'left');
        relabel();
        const keys = shuffle(['opt_bend_yes_dir', 'opt_bend_no_speed', 'opt_bend_no_vel', 'opt_bend_yes_speed']);
        sayQ(t('q_bend'));
        question = { kind, keys };
        return {
          choices: [0, 1, 2, 3],
          expected: keys.indexOf('opt_bend_yes_dir'),
          tolerance: 0.5,
          label: (j) => `<span class="ac-opt">${t(keys[j])}</span>`,
          meta: { kind },
        };
      },
      reveal(_q, correct) {
        const Q = question;
        const picked = lastPick;
        if (Q.kind === 'graph') {
          cardGraph.draw({ trip: Q.g.trip, tmax: 20 }); // now in colour: each kind its own
          const st = stretchValues(Q.g.trip.stretches[Q.expected]);
          let why = t(`why_graph_${Q.target}`, { l: letters4[Q.expected], u: fmt(st.u, 1), v: fmt(st.v, 1) });
          if (!correct && picked >= 0 && Q.target !== 'none' && Q.g.kinds[picked] === 'none' && Q.g.trip.stretches[picked].u >= 100)
            why += t('why_graph_high');
          return why;
        }
        if (Q.kind === 'calc' || Q.kind === 'brake') {
          s.show.acc = true; // the ত্বরণ (or মন্দন) arrow appears with the answer
          relabel();
          placeShow();
          let why = t(Q.kind === 'calc' ? 'why_calc' : 'why_brake', { u: Q.u, v: Q.v, t: Q.t, a: fmt(Q.a, 2).replace('-', '−') });
          const mis = !correct && picked >= 0 ? Q.opts[picked].why : '';
          if (mis) why += t(mis, { d: Q.u - Q.v, u: Q.u });
          return why;
        }
        if (Q.kind === 'compare') {
          const { one, two, winner } = Q;
          let why = t('why_compare', {
            w: winner,
            n1: 1,
            n2: 2,
            v1: one.v,
            t1: one.t,
            a1: fmt(one.v / one.t, 2),
            v2: two.v,
            t2: two.t,
            a2: fmt(two.v / two.t, 2),
          });
          const k = picked >= 0 ? Q.keys[picked] : '';
          if (!correct && (k === 'one' || k === 'two')) why += t('mis_final');
          if (!correct && k === 'cant') why += t('mis_cant');
          return why;
        }
        relabel(); // the ত্বরণ arrow shows now
        let why = t('why_bend', { v: fmt(TURN.v) });
        const k = picked >= 0 ? Q.keys[picked] : '';
        if (!correct && (k === 'opt_bend_no_speed' || k === 'opt_bend_no_vel')) why += t('mis_bend_speed');
        if (!correct && k === 'opt_bend_yes_speed') why += t('mis_bend_up');
        return why;
      },
      done() {
        s.locked = false;
        clearQuizMarks();
        newDrive();
        setScene('line');
      },
    },
  });

  // ── first-use pointer: on the গতি বাড়াও pedal ──────────────────────────────
  let coach = null;
  if (o.coach) {
    const spot = () => {
      const r = boxOf(pedalBtn.right, 0);
      return r ? { x: (r.left + r.right) / 2, y: r.top + 14 } : null;
    };
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, speedoEl],
      object: {
        label: 'coach_gas',
        candidates: () => (s.scene === 'line' && s.mode !== 'quiz' && !s.line.trip.started ? [spot()] : []),
        grabbable: (p) => {
          const r = boxOf(pedalBtn.right, 0);
          return Boolean(r) && p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom;
        },
        demo: null,
        cancel: () => {},
      },
    });
  }

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
    for (const b of ui.$$('[data-scene]')) {
      const on = b.dataset.scene === s.scene;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    root.dataset.scene = s.scene;
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
    pedalsEl.inert = s.mode === 'quiz';
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.scene && b.dataset.scene !== s.scene && s.mode !== 'quiz') setScene(b.dataset.scene);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      lastPick = Number(b.dataset.q);
      quiz.choose(lastPick);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'restart':
        restart();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // keys: hold ↑/→ for গতি বাড়াও and ↓/← for ব্রেক on the road; ← and → turn on the bend
  const keySide = (k) => {
    if (s.scene === 'line') return k === 'arrowup' || k === 'arrowright' ? 'right' : k === 'arrowdown' || k === 'arrowleft' ? 'left' : null;
    return k === 'arrowleft' ? 'left' : k === 'arrowright' ? 'right' : null;
  };
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const side = keySide(k);
    const learning = s.mode !== 'quiz';
    if (side) {
      if (!e.repeat) press(`key:${k}`, side);
    } else if (k === '1' && learning) setScene('line');
    else if (k === '2' && learning) setScene('turn');
    else if (k === 'r' && learning) restart();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });
  root.addEventListener('keyup', (e) => release(`key:${e.key.toLowerCase()}`));
  window.addEventListener('blur', () => {
    for (const k of [...s.holds.keys()]) if (k.startsWith('key:') || k.startsWith('pointer:')) s.holds.delete(k);
    syncPedals();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  if (o.trip === 'book') driveNow(BOOK_TRIP);
  labelPedals();
  setView(s.view, { animate: false });
  setScene(s.scene, { animate: false });
  if (o.trip === 'book') s.holds.set('api', 'left'); // braking now, as at the end of the book's graph
  syncPedals();
  syncUI();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start(1400);
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
     * Change any of: scene ('line' | 'turn'); pedal (held until changed: 'gas' | 'brake' | 'none' on the road,
     * 'left' | 'right' | 'none' on the bend); drive ([[pedal, seconds], …] driven at once from a new trip; add
     * keep: true to drive on from where it is); trip ('book': the book's চিত্র ২.০৬, braking now; 'new'); restart;
     * view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.scene && p.scene !== s.scene) setScene(p.scene, { animate });
      if (p.restart || p.trip === 'new') restart();
      if (p.trip === 'book' || p.drive) {
        if (s.scene !== 'line') setScene('line', { animate });
        releaseAll();
        driveNow(p.trip === 'book' ? BOOK_TRIP : p.drive, { keep: Boolean(p.keep) && p.trip !== 'book' });
        if (p.trip === 'book') s.holds.set('api', 'left');
        relabel();
        syncPedals();
      }
      if (p.pedal != null) {
        const side = p.pedal === 'gas' || p.pedal === 'right' ? 'right' : p.pedal === 'brake' || p.pedal === 'left' ? 'left' : null;
        if (side) press('api', side);
        else release('api');
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      clearQuizMarks();
      newDrive();
      setScene('line', { animate: false });
      await setView('front');
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The CNG itself, at the origin, in metres (arrows, road and labels are drawings, left out). */
    exportRoot: () => {
      const g = new THREE.Group();
      g.name = 'CNGAutoRickshaw';
      const c = cng.root.clone(true);
      c.position.set(0, 0, 0);
      c.rotation.set(0, 0, 0);
      g.add(c);
      return g;
    },
  };
}
