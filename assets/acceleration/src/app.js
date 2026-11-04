// Acceleration (book pages 43–44, topic 2.6), student view: a CNG auto-rickshaw on a Bangladeshi road.
//  - সোজা রাস্তা: the student drives it with two pedals in the panel (press and hold: গতি বাড়াও, ব্রেক; nothing
//    pressed = the same speed). Over the CNG the বেগ arrow grows and shrinks, the ত্বরণ arrow points forwards
//    (ধনাত্মক ত্বরণ), backwards (মন্দন) or is gone (ত্বরণ নেই); the speedometer reads m/s. The panel draws the
//    বেগ–সময় graph as it goes, each piece lettered (A, B, C…) and coloured by its kind, so the student makes the
//    book's চিত্র ২.০৬ themselves, and works out a = (v − u) ÷ t for the piece it is on (or one they touch).
// Then a short test. Built on the shared
// student kit (@shared/student/…); the physics is in drive.js.
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
  VMAX,
  accel,
  fixed,
  fmt,
  graphTrip,
  lettersOf,
  newTrip,
  runTrip,
  signed,
  stretchValues,
  tickTrip,
  tripAt,
} from './drive.js';
import { createGraph, createSpeedometer } from './gauges.js';
import { createI18n } from './i18n.js';
import { ROAD, createStreet } from './street.js';

export const DEFAULTS = {
  view: 'front', // 'front' (from the side) | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  trip: '', // '' (start standing) | 'book' (the book's graph already driven, braking now: for the poster)
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per meaning: বেগ blue; ধনাত্মক ত্বরণ purple, মন্দন orange, ত্বরণ নেই grey (style.css has the same).
// Arrows, lines and bands use the colours; words use the darker shades of the same (readable on white).
const COLORS = {
  velocity: '#1c6fd9',
  ghost: '#8db4ea', // the initial velocity u of a test question: a paler বেগ arrow
  ghostInk: '#3f6fb3',
  up: '#7048e8',
  down: '#e8590c',
  none: '#868e96',
  ink: '#1d2733',
};
const TEXT = { velocity: '#1c63c4', up: '#6741d9', down: '#bf4508', none: '#5c6670' };
const V_SCALE = 0.14; // m of arrow per m/s on the road (15 m/s: 2.1 m)
const A_SCALE = 0.45; // m of arrow per ms⁻² (2 ms⁻²: 0.9 m)
const V_Y = 2.05; // heights of the arrows above the road (the roof is at 1.71 m)
const A_Y = 2.8;
const SHOW_Y = { u: 2.05, gap: 0.7 }; // a test question's arrows: u, then v and the ত্বরণ (with the answer) above it
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
};
const SIDES = { left: 'brake', right: 'gas' };

// where the camera looks from (from the target towards the camera): az turns from the south towards the east
const look = (azDeg, elDeg) => {
  const az = THREE.MathUtils.degToRad(azDeg);
  const el = THREE.MathUtils.degToRad(elDeg);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
};
const VIEWS = { front: look(24, 17), '3d': look(48, 26) };

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
    layout: 'side', // the panel beside the 3D on landscape frames (kit 1.5.0)
    learn: `
          <div class="ac-top">
            <button class="pvc-btn ac-restart" data-act="restart">${ICONS.reset}<span>${t('act_restart')}</span></button>
          </div>
          <div class="ac-big">
            <div class="ac-graph" title="${t('graph_pick')}"></div>
          </div>
          <div class="ac-mid">
            <div class="ac-sum">
              <div class="ac-sum-row">
                <span class="ac-badge" data-v="letter"></span>
                <span class="ac-k"><b>${t('acc_name')}</b></span>
                <i>=</i>
                <span class="ac-frac"><span class="ac-num" data-v="num"></span><span class="ac-den" data-v="den"></span></span>
                <i data-v="eq">=</i>
                <span class="ac-res"><b data-v="a"></b><small data-v="kind"></small></span>
              </div>
              <small class="ac-def">${t('acc_def')}</small>
            </div>
          </div>
          <p class="ac-say"></p>`,
  });
  // in the panel, under the choices: the two pedals and the speed (nothing floats on the 3D view); on the picture
  // only the graph card of a test question
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
  const acts = document.createElement('div');
  acts.className = 'ac-acts';
  acts.append(pedalsEl, speedoEl);
  ui.$('.ac-top').after(acts);
  ui.stage.append(card);
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
  // a soft, slightly muted sky (never white), the far ground fading into its haze
  if (o.bg !== 'transparent') {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#9fbad3');
    grad.addColorStop(0.6, '#cfdbe5');
    grad.addColorStop(1, '#e4ded2');
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
    const sky = new THREE.CanvasTexture(c);
    sky.colorSpace = THREE.SRGBColorSpace;
    scene.background = sky;
  }
  scene.fog = new THREE.Fog(0xe4ded2, 30, 80);

  const street = createStreet();
  const cng = createCNG();
  const twin = createCNG({ name: 'CNG2' }); // the second CNG of a test question
  twin.root.visible = false;
  twin.root.userData.noExport = true;
  scene.add(street.root, cng.root, twin.root);

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
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    // who holds which pedal: 'pointer:<id>' | 'key:<key>' | 'api' (the bridge) | 'book' (the book's trip, braking
    // until it stops) | 'quiz' → 'left' | 'right'
    holds: new Map(),
    line: { trip: newTrip(), clock: 0, done: false, after: 0, selected: -1, shownTick: -1 },
    flash: null, // a passing message: { key, vars, until }
    show: null, // a test question's still picture on the road: { x, v, u, twin, acc }
    labelsBeside: false, // short, wide pictures: the ত্বরণ label beside its arrow, not above it
    showGap: SHOW_Y.gap, // m between a test question's arrows (more when the picture is small)
  };
  const anchor = new THREE.Vector3(); // what the camera follows
  const rel = { position: new THREE.Vector3(0, 3, 14), target: new THREE.Vector3(0, 1.4, 0) }; // camera, from the anchor

  // ── pedals: press and hold (several fingers or keys may hold at once) ─────────
  const held = (side) => [...s.holds.values()].includes(side);
  const pedal = () => (held('left') ? 'brake' : held('right') ? 'gas' : 'none');

  const byStudent = (source) => source.startsWith('pointer:') || source.startsWith('key:');
  function press(source, side) {
    if (s.holds.get(source) === side) return;
    if (s.locked && source !== 'quiz') return lockedNudge();
    if (byStudent(source)) {
      // the student's own finger or key takes over from anything the bridge or the book's trip was holding
      s.holds.delete('api');
      s.holds.delete('book');
      audio.unlock();
      audio.pop();
      coach?.objectUsed();
    }
    s.holds.set(source, side);
    const L = s.line;
    L.selected = -1;
    if (L.done) flash('say_full');
    else if (!L.trip.started && side === 'left') flash('say_brake_first');
    else s.flash = null;
    syncPedals();
    refresh();
    emit('pedal', { pedal: pedal() });
  }
  function release(source) {
    if (!s.holds.delete(source)) return;
    syncPedals();
    refresh();
    emit('pedal', { pedal: pedal() });
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
      const kind = SIDES[side];
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
    s.line = { trip: newTrip(), clock: 0, done: false, after: 0, selected: -1, shownTick: -1 };
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
    return { i, st: { ...st, t1: end, v: trip.vs[end] } };
  }

  function tickLine(dt) {
    const L = s.line;
    if (s.show) {
      if (s.show.move) s.show.x += s.show.v * dt; // a test question's CNG cruising at a steady speed
      placeShow();
      return Boolean(s.show.move);
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
      // the book's trip brakes only until the CNG stands
      if (s.holds.has('book') && L.trip.vs[L.trip.n] === 0) {
        s.holds.delete('book');
        syncPedals();
      }
      if (L.trip.n >= TICKS && L.clock >= TRIP - 1e-9) {
        L.done = true;
        L.after = 0;
        releaseAll();
        audio.success();
        emit('done', snapshot().line);
      }
    }
    if (L.done) {
      // the graph is full: the driver lets the pedals be and the CNG rolls on at its last speed
      const vEnd = L.trip.vs[L.trip.n] / 10;
      if (s.mode !== 'quiz') L.after += dt;
      placeLine(L.trip.xs[L.trip.n] + vEnd * L.after, vEnd, 'none', vEnd);
      return vEnd > 0 && s.mode !== 'quiz';
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
  /** Heights of a test question's arrows (u, v, the ত্বরণ): far enough apart that their labels never touch. */
  const showY = (which) => SHOW_Y.u + (which === 'u' ? 0 : which === 'v' ? 1 : 2) * s.showGap;
  /**
   * The labels of the two arrows, never on them: বেগ before the start of its arrow (none while standing: there is
   * no arrow); ত্বরণ / মন্দন above the middle of its arrow, or beside its tip in short, wide pictures.
   */
  function lineLabels(kind, moving) {
    const showV = s.mode !== 'quiz' && moving;
    label('v', showV ? 'line' : '', () =>
      annotations.add('v', {
        text: t('lbl_velocity'),
        point: () => labelPoint.set(anchor.x - 0.06, V_Y, anchor.z),
        dx: -8,
        dy: 0,
        kind: 'callout',
        color: TEXT.velocity,
      }),
    );
    const showA = s.mode !== 'quiz' || s.show?.acc;
    const y = s.show?.u != null ? showY('a') : A_Y;
    const beside = s.labelsBeside && s.show?.u == null;
    label('a', showA ? `line|${kind}|${beside}|${y}` : '', () => {
      if (kind === 'none')
        return annotations.add('a', {
          text: t('lbl_no_acc'),
          point: () => labelPoint2.set(anchor.x, y, anchor.z),
          dx: 0,
          dy: 0,
          kind: 'tag', // a label on its own, without a leader (there is no arrow to point at)
          color: TEXT.none,
        });
      const a = s.show?.a != null ? s.show.a * A_SCALE : (kind === 'up' ? GAS : BRAKE) * A_SCALE;
      const sign = Math.sign(a);
      annotations.add('a', {
        text: t(kind === 'up' ? 'lbl_acc' : 'lbl_dec'),
        point: beside ? () => labelPoint2.set(anchor.x + a + 0.1 * sign, y, anchor.z) : () => labelPoint2.set(anchor.x + a / 2, y + 0.13, anchor.z),
        dx: beside ? 8 * sign : 0,
        dy: beside ? 0 : -20,
        kind: 'callout',
        color: TEXT[kind],
      });
    });
  }
  // each arrow label is made again only when what it says or where it sits changes (so it does not flicker)
  const labelKeys = { v: '', a: '' };
  const labelEls = {};
  function label(id, key, make) {
    if (labelKeys[id] === key) return;
    labelKeys[id] = key;
    annotations.remove(id);
    labelEls[id] = null;
    if (key) {
      make();
      labelEls[id] = ui.annoLayer.lastElementChild; // the label just made (the kit adds it last)
    }
  }
  /** Forget the arrow labels: they are made again on the next frame (after a change of mode or question). */
  function relabel() {
    shownKind = '';
    for (const id of Object.keys(labelKeys)) {
      labelKeys[id] = '';
      labelEls[id] = null;
      annotations.remove(id);
    }
  }
  const EAST = new THREE.Vector3(1, 0, 0);
  const WEST = new THREE.Vector3(-1, 0, 0);
  const tmpA = new THREE.Vector3();
  const labelPoint = new THREE.Vector3();
  const labelPoint2 = new THREE.Vector3();

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
    const moving = tickLine(dt);
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
  const graph = createGraph($('.ac-graph'), { t, N, colors: COLORS, text: TEXT });
  const cardGraph = createGraph(card.querySelector('.ac-card-graph'), { t, N, colors: COLORS, text: TEXT });
  const speedo = createSpeedometer(speedoEl, { t, N, colors: COLORS });

  function refresh() {
    if (s.flash && performance.now() > s.flash.until) s.flash = null;
    refreshLine();
    stage.invalidate();
  }
  function refreshLine() {
    const L = s.line;
    const trip = L.trip;
    const { k } = lineNow();
    // the time axis grows with the trip (0–10, 0–20, then 0–30 s), so short pieces are not crammed together
    const time = L.done ? TRIP : k * TICK;
    graph.draw({ trip, upto: k, selected: L.selected, hint: t('graph_hint'), tmax: time <= 10 ? 10 : time <= 20 ? 20 : TRIP });
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
      // a piece gets its letter once it has lasted 1 s (as on the graph), and keeps it
      const letter = lettersOf(trip.stretches)[sum.i] || '–';
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
  function snapshot() {
    const L = s.line;
    const trip = L.trip;
    const { k, st } = lineNow();
    const letters = lettersOf(trip.stretches);
    return {
      view: s.view,
      mode: s.mode,
      pedal: pedal(),
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
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.mode}|${snap.pedal}|${snap.line.kind}|${Math.round(snap.line.time)}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── camera: framed to the CNG and its arrows, clear of the buttons; it follows the CNG ──
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  /** What must be in the picture, from the anchor: points, some with a label box on the screen [l, t, r, b] px. */
  function contentOf() {
    const P = (x, y, z, box = null) => ({ p: new THREE.Vector3(x, y, z), box });
    const pts = [];
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
      const lbl = [-120, -14, 0, 14];
      const a = (sh.a ?? 0) * A_SCALE;
      pts.push(P(-0.06, showY('u'), 0, lbl), P(-0.06, showY('v'), 0, lbl), P(Math.max(sh.u, sh.v) * V_SCALE, showY('v'), 0));
      pts.push(P(a, showY('a'), 0), P(a * 0.5, showY('a') + 0.13, 0, [-40, -46, 40, 0]));
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
  /** A box on the stage, on the canvas (px), a little bigger; null when it is not shown. */
  function boxOf(el, pad = 6) {
    if (!el || el.hidden || getComputedStyle(el).visibility === 'hidden' || getComputedStyle(el).display === 'none') return null;
    const c = stage.canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left - c.left - pad, right: r.right - c.left + pad, top: r.top - c.top - pad, bottom: r.bottom - c.top + pad };
  }
  /** A camera pose (from the anchor) showing everything as big as it can, clear of the buttons and the speedometer. */
  function poseFor(view) {
    if (s.show?.u == null) return fitPose(view);
    // a test question with u and v: their arrows sit far enough apart that the labels keep at least 34 px between
    // their middles, however small the picture (fit, measure the scale, fit again)
    s.showGap = SHOW_Y.gap;
    let pose = fitPose(view);
    for (let i = 0; i < 2; i++) {
      const pxPerM = Math.max(stage.height, 120) / 2 / (pose.distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      const gap = Math.max(SHOW_Y.gap, 34 / pxPerM);
      if (Math.abs(gap - s.showGap) < 0.02) break;
      s.showGap = gap;
      pose = fitPose(view);
    }
    return pose;
  }
  function fitPose(view) {
    s.labelsBeside = stage.width > stage.height * 1.45; // short, wide pictures: labels beside the arrows
    const pts = contentOf();
    const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
    const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const { p } of pts) {
      lo.min(p);
      hi.max(p);
    }
    const target = lo.clone().add(hi).multiplyScalar(0.5);
    const back = VIEWS[view].clone();
    const right = new THREE.Vector3().crossVectors(WORLD_UP, back).normalize();
    const up = new THREE.Vector3().crossVectors(back, right);
    const local = pts.map(({ p, box }) => {
      const q = p.clone().sub(target);
      return { x: q.dot(right), y: q.dot(up), z: q.dot(back), box };
    });
    const W = stage.width;
    const H = Math.max(stage.height, 120);
    const boxes = [boxOf(ui.corner)].filter(Boolean);
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
    scene.fog.near = d + 4;
    scene.fog.far = d + 30;
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
    return flyTo(poseFor(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(poseFor(s.view), 0);
  });

  /** Back to the road as the student left it: labels, pedals and the camera as at the start. */
  function toRoad({ animate = true } = {}) {
    releaseAll();
    relabel();
    annotations.clear();
    s.line.shownTick = -1;
    s.flash = null;
    const p = tripAt(s.line.trip, s.line.clock);
    anchor.set(p.x, 0, ROAD.lane);
    labelPedals();
    s.userMovedCamera = false;
    syncUI();
    flyTo(poseFor(s.view), animate ? 0.7 : 0);
    refresh();
    emitChange();
  }
  function restart() {
    if (s.locked) return lockedNudge();
    releaseAll();
    newDrive();
    relabel();
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
  const minus = (x) => fmt(x, 2).replace('-', '−'); // a number for a sentence, with a real minus sign
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
  // two CNGs from rest, (t, v) each: the quicker one ends slower but gains speed faster; the quicker one gains speed
  // more slowly; or both the same (so neither "the faster one" nor "the quicker one" always wins)
  const PAIRS = [
    { kind: 'quick', a: [5, 10], b: [8, 12] },
    { kind: 'quick', a: [4, 8], b: [10, 15] },
    { kind: 'quick', a: [3, 9], b: [6, 12] },
    { kind: 'slow', a: [2, 3], b: [5, 10] },
    { kind: 'slow', a: [3, 4.5], b: [6, 12] },
    { kind: 'slow', a: [2, 4], b: [4, 12] },
    { kind: 'equal', a: [3, 6], b: [6, 12] },
    { kind: 'equal', a: [2, 5], b: [4, 10] },
    { kind: 'equal', a: [4, 6], b: [6, 9] },
  ];
  const STEADY = [
    [12, 5],
    [10, 4],
    [8, 6],
    [15, 5],
  ]; // a CNG keeping v m/s for t s

  let kinds = [];
  let question = null;
  let lastPick = -1;
  function clearQuizMarks() {
    card.hidden = true;
    speedoEl.hidden = false;
    twin.root.visible = false;
    uArrow.root.visible = false;
    s.show = null;
    s.showGap = SHOW_Y.gap;
    for (const id of ['qu', 'qv', 'c1', 'c2']) annotations.remove(id);
    relabel();
    releaseAll();
  }
  /** A picture on the road for a question: the CNG at speed v, a faint arrow for u, perhaps a second CNG. */
  function showOnRoad(show) {
    s.show = { x: s.line.trip.xs[s.line.trip.n] || 0, ...show };
    relabel();
    if (!s.userMovedCamera) flyTo(poseFor(s.view), 0.6);
    placeShow();
  }
  function placeShow() {
    const sh = s.show;
    const kind = sh.acc && sh.a ? (sh.a > 0 ? 'up' : 'down') : 'none';
    placeLine(sh.x, sh.v, kind, sh.v);
    if (!sh.acc || !sh.a) aArrow.root.visible = false;
    if (sh.u != null) {
      // u (faint) just over the roof, v above it, and the ত্বরণ arrow (its real length) on top once answered
      uArrow.set(tmpA.set(sh.x, showY('u'), ROAD.lane), EAST, sh.u * V_SCALE);
      uArrow.root.visible = sh.u > 0;
      vArrow.set(tmpA.set(sh.x, showY('v'), ROAD.lane), EAST, sh.v * V_SCALE);
      aArrow.set(tmpA.set(sh.x, showY('a'), ROAD.lane), sh.a < 0 ? WEST : EAST, Math.abs(sh.a) * A_SCALE);
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
  /** A label before the start of an arrow (as বেগ is while learning). */
  function rowLabel(id, text, y, color) {
    const p = new THREE.Vector3();
    annotations.add(id, { text, point: () => p.set(anchor.x - 0.06, y(), anchor.z), dx: -8, dy: 0, kind: 'callout', color });
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 4,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.locked = true;
        hideHint();
        releaseAll();
        kinds = shuffle(['graph', 'change', 'steady', 'compare']);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        clearQuizMarks();
        newDrive();
        toRoad();
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
          card.hidden = false;
          speedoEl.hidden = true;
          cardGraph.draw({ trip: g.trip, plain: true, tmax: 20, test: true });
          sayQ(t(`q_graph_${target}`));
          question = { kind, g, target, expected };
          return { choices: [0, 1, 2, 3], expected, tolerance: 0.5, label: (j) => letters4[j], meta: { kind, target, stretches: g.kinds } };
        }
        if (kind === 'change') {
          // speeding up or braking (half the time each), from book-style numbers
          const up = Math.random() < 0.5;
          const [u, v, tt] = pickOne(up ? SPEED_UPS : BRAKINGS);
          const a = accel(u, v, tt);
          showOnRoad({ u, v, a });
          rowLabel('qu', t('lbl_u', { u }), () => showY('u'), COLORS.ghostInk);
          rowLabel('qv', t('lbl_v', { v }), () => showY('v'), TEXT.velocity);
          sayQ(t(up ? 'q_calc' : 'q_brake', { u, v, t: tt }));
          // the usual slips: speeding up — the unit of velocity, v ÷ t (u left out), (v − u) × t; braking — the sign
          // lost, the whole of u ÷ t (as if it stopped), v ÷ t
          const opts = up
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
          question = { kind, up, u, v, t: tt, a, opts: order.map((j) => opts[j]) };
          return {
            choices: [0, 1, 2, 3],
            expected: order.indexOf(0),
            tolerance: 0.5,
            label: (j) => accHtml(question.opts[j].a, question.opts[j].unit),
            meta: { kind: up ? 'speed-up' : 'braking', u, v, t: tt, acceleration: a },
          };
        }
        if (kind === 'steady') {
          // cruising: the speedometer stays put, the velocity does not change, so a = 0 however fast it goes
          const [v, tt] = pickOne(STEADY);
          showOnRoad({ v, a: 0, move: true });
          rowLabel('qv', t('lbl_steady', { v }), () => V_Y, TEXT.velocity);
          sayQ(t('q_steady', { v, t: tt }));
          const opts = [
            { a: 0, unit: 'u_acc', why: '' },
            { a: v, unit: 'u_acc', why: 'mis_steady_v' },
            { a: v / tt, unit: 'u_acc', why: 'mis_steady_vt' },
            { a: v * tt, unit: 'u_m', why: 'mis_times' },
          ];
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, v, t: tt, opts: order.map((j) => opts[j]) };
          return {
            choices: [0, 1, 2, 3],
            expected: order.indexOf(0),
            tolerance: 0.5,
            label: (j) => accHtml(question.opts[j].a, question.opts[j].unit),
            meta: { kind, v, t: tt, acceleration: 0 },
          };
        }
        if (kind === 'compare') {
          const pair = pickOne(PAIRS);
          const aFirst = Math.random() < 0.5; // which of the two is CNG 1
          const [one, two] = (aFirst ? [pair.a, pair.b] : [pair.b, pair.a]).map(([tt, v]) => ({ t: tt, v, a: v / tt }));
          // one behind the other in the same lane; the labels in two rows (the first one's higher)
          speedoEl.hidden = true; // two CNGs: one speedometer would belong to neither
          showOnRoad({ v: one.v, twin: { dx: 4.6, v: two.v } });
          const p1 = new THREE.Vector3();
          const p2 = new THREE.Vector3();
          annotations.add('c1', {
            text: t('lbl_cng', { n: 1, t: one.t, v: one.v }),
            point: () => p1.set(cng.root.position.x, 1.75, ROAD.lane),
            dx: 0,
            dy: -62,
            kind: 'part',
          });
          annotations.add('c2', {
            text: t('lbl_cng', { n: 2, t: two.t, v: two.v }),
            point: () => p2.set(twin.root.position.x, 1.75, ROAD.lane),
            dx: 0,
            dy: -26,
            kind: 'part',
          });
          sayQ(t('q_compare'));
          const right = Math.abs(one.a - two.a) < 1e-9 ? 'equal' : one.a > two.a ? 'one' : 'two';
          const keys = shuffle(['one', 'two', 'equal', 'cant']);
          question = { kind, one, two, right, keys };
          const label = (j) => {
            const k = keys[j];
            const text = k === 'one' ? t('opt_cng', { n: 1 }) : k === 'two' ? t('opt_cng', { n: 2 }) : t(k === 'equal' ? 'opt_equal' : 'opt_cant');
            return `<span class="ac-opt">${text}</span>`;
          };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf(right), tolerance: 0.5, label, meta: { kind, one, two, pair: pair.kind } };
        }
      },
      reveal(_q, correct) {
        const Q = question;
        const picked = lastPick;
        if (Q.kind === 'graph') {
          cardGraph.draw({ trip: Q.g.trip, tmax: 20, test: true }); // now in colour: each kind its own
          const st = stretchValues(Q.g.trip.stretches[Q.expected]);
          let why = t(`why_graph_${Q.target}`, { l: letters4[Q.expected], u: fmt(st.u, 1), v: fmt(st.v, 1) });
          if (!correct && picked >= 0 && Q.target !== 'none' && Q.g.kinds[picked] === 'none' && Q.g.trip.stretches[picked].u >= 100)
            why += t('why_graph_high');
          return why;
        }
        if (Q.kind === 'change' || Q.kind === 'steady') {
          s.show.acc = true; // the ত্বরণ (or মন্দন) arrow, or the word ত্বরণ নেই, appears with the answer
          relabel();
          placeShow();
          const vars = Q.kind === 'change' ? { u: Q.u, v: Q.v, t: Q.t, d: minus(Q.v - Q.u), a: minus(Q.a) } : { u: Q.v, v: Q.v, t: Q.t, d: 0, a: 0 };
          let why = t(Q.kind === 'steady' ? 'why_steady' : Q.up ? 'why_calc' : 'why_brake', vars);
          const mis = !correct && picked >= 0 ? Q.opts[picked].why : '';
          if (mis) why += t(mis, { d: Q.u - Q.v, u: Q.u });
          return why;
        }
        if (Q.kind === 'compare') {
          const { one, two, right } = Q;
          let why = t('why_compare', {
            w: right === 'equal' ? t('opt_equal') : t('opt_cng', { n: right === 'one' ? 1 : 2 }),
            n1: 1,
            n2: 2,
            z: 0,
            v1: one.v,
            t1: one.t,
            a1: fmt(one.a, 2),
            v2: two.v,
            t2: two.t,
            a2: fmt(two.a, 2),
          });
          const k = picked >= 0 ? Q.keys[picked] : '';
          const pickedCng = k === 'one' ? one : k === 'two' ? two : null;
          const other = k === 'one' ? two : one;
          if (!correct && pickedCng) {
            if (pickedCng.v > other.v) why += t('mis_final');
            else if (pickedCng.t < other.t) why += t('mis_quick');
            else why += t('mis_final');
          }
          if (!correct && k === 'equal') why += t('mis_equal');
          if (!correct && k === 'cant') why += t('mis_cant');
          return why;
        }
      },
      done() {
        s.locked = false;
        clearQuizMarks();
        newDrive();
        toRoad();
      },
    },
  });

  // ── first-use pointer: on the গতি বাড়াও pedal ──────────────────────────────
  let coach = null;
  if (o.coach) {
    // spots on the upper part of the pedal, best first (the kit keeps a hand clear of the bottom 48 px)
    const spots = () => {
      const r = boxOf(pedalBtn.right, 0);
      if (!r) return [];
      const x = (r.left + r.right) / 2;
      return [r.top + 14, r.top + 0.25 * (r.bottom - r.top), r.top + 6, r.top + 3].map((y) => ({ x, y }));
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
        candidates: () => (s.mode !== 'quiz' && !s.line.trip.started ? spots() : []),
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
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
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
  // keys: hold ↑/→ for গতি বাড়াও and ↓/← for ব্রেক
  const keySide = (k) => (k === 'arrowup' || k === 'arrowright' ? 'right' : k === 'arrowdown' || k === 'arrowleft' ? 'left' : null);
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const side = keySide(k);
    const learning = s.mode !== 'quiz';
    if (side) {
      if (!e.repeat) press(`key:${k}`, side);
    } else if (k === 'r' && learning) restart();
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
  toRoad({ animate: false });
  if (o.trip === 'book') s.holds.set('book', 'left'); // braking now, as at the end of the book's graph (until it stops)
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
     * Change any of: pedal (held until changed: 'gas' | 'brake' | 'none'); drive ([[pedal, seconds], …] driven at once from a new trip; add
     * keep: true to drive on from where it is); trip ('book': the book's চিত্র ২.০৬, braking now; 'new'); restart;
     * view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.restart || p.trip === 'new') restart();
      if (p.trip === 'book' || p.drive) {
        releaseAll();
        driveNow(p.trip === 'book' ? BOOK_TRIP : p.drive, { keep: Boolean(p.keep) && p.trip !== 'book' });
        if (p.trip === 'book') s.holds.set('book', 'left');
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
      toRoad({ animate: false });
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
