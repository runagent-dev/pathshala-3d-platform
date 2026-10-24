// Speed and velocity (book pages 40–41, topic 2.5), student view. Two examples, switched by two chips:
//  - পাথর: a student whirls a stone on a rope. Its দ্রুতি stays 4 m/s, but its বেগ (the arrow, along the circle)
//    keeps turning, so the বেগ keeps changing. Let go of the rope (tap the hand or the button) and the stone flies
//    straight on along the বেগ it had at that moment, along the tangent: land it in the pond.
//  - সাইকেল: the book's example on the road of চিত্র ২.০৪: A to B in 20 minutes, 4 km along the road but 2 km in a
//    straight line, so গড় দ্রুতি = 12 km/h and গড় বেগ = 6 km/h towards B, worked out live as the cycle goes.
// Then a short test. Built on the shared student kit (@shared/student/…); the physics is in motion.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener } from '@shared/tween.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createI18n } from './i18n.js';
import {
  AIR_TIME,
  HEIGHT,
  OMEGA,
  PERIOD,
  POND_CENTRE,
  RIDE,
  STONE,
  dirOf,
  fixed,
  flightEnd,
  fmt,
  kmh,
  pondRadius,
  rideAt,
  roadAt,
  stoneAt,
  throwFrom,
  wrap,
} from './motion.js';
import { createRoad } from './road.js';
import { ROAD } from './road-data.js';
import { COMPASS, createSling } from './sling.js';

export const DEFAULTS = {
  scene: 'stone', // 'stone' | 'road'
  view: 'front', // 'front' (from above) | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per quantity: দূরত্ব and দ্রুতি blue, সরণ and বেগ orange, সময় purple (style.css has the same)
const COLORS = {
  distance: '#1c6fd9',
  displacement: '#e8590c',
  velocity: '#e8590c',
  ghost: '#f3a06b',
  choice: '#5b6672',
  path: '#a3adb8',
  label: '#66717d',
};
const RIDE_SCREEN = 8; // s on screen for the 20 minutes from A to B
const DEG_PER_MS = (OMEGA * 180) / Math.PI / STONE.slow / 1000; // how fast the stone goes round on screen
const CIRCUMFERENCE = 2 * Math.PI * STONE.r;
const HOURS = { 10: '1/6', 20: '1/3', 40: '2/3' }; // minutes as a fraction of an hour, for the worked sums

// where the camera looks from (towards the camera from the middle of the scene): north stays at the top
const VIEWS = {
  stone: { front: new THREE.Vector3(0, 1, 0.2).normalize(), '3d': new THREE.Vector3(0.5, 0.6, 1).normalize() },
  road: { front: new THREE.Vector3(0, 1, 0.45).normalize(), '3d': new THREE.Vector3(0.55, 0.75, 1).normalize() },
};
const ROAD_SHOWN = 5.2; // km of road the picture shows in full (A to B, and on a little)
const at = (e, n, h = 0) => new THREE.Vector3(e, h, -n);
const DIR_ICON = '<svg class="sv-dir" viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-8 0H7M2 -5.5L8 0L2 5.5"/></svg>';

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const U = (key) => `<span class="sv-u">${t(key)}</span>`;
  const dirWord = (heading) => t(`dir_${dirOf(heading)}`);

  root.classList.add('pvc', 'sv');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="sv-rows">
            <div class="pvc-sum sv-row" data-row="sp"></div>
            <div class="pvc-sum sv-row" data-row="ve"></div>
          </div>
          <p class="pvc-learn-extra sv-extra"></p>
          <div class="pvc-learn-foot sv-foot">
            <div class="pvc-seg sv-scenes" role="group" aria-label="${t('scenes')}">
              <button data-scene="stone">${t('scene_stone')}</button>
              <button data-scene="road">${t('scene_road')}</button>
            </div>
            <button class="pvc-btn primary sv-act" data-act="main"><span></span></button>
          </div>`,
  });
  const note = document.createElement('div');
  note.className = 'sv-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.1, far: 200, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 2;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI * 0.47; // never under the ground
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });

  // the field: pale grass fading into the page
  {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(232, 240, 220, 1)');
    g.addColorStop(0.55, 'rgba(236, 243, 226, 1)');
    g.addColorStop(1, 'rgba(240, 245, 233, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(7, 64),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }),
    );
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = -1;
    m.userData.noExport = true;
    scene.add(m);
  }

  const sling = createSling({ t, colors: COLORS });
  const road = createRoad({ N, colors: COLORS });
  scene.add(sling.root, road.root);

  const shadows = o.shadow && o.bg !== 'transparent';
  sling.useBlobs(!shadows);
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.position.set(2.5, 12, 3.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 4, far: 20 });
    sun.shadow.radius = 6;
    const page = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.16 }));
    page.rotation.x = -Math.PI / 2;
    page.position.y = 0.002;
    page.receiveShadow = true;
    page.userData.noExport = true;
    scene.add(sun, sun.target, page);
    for (const part of [sling.root, road.cyclist])
      part.traverse((m) => {
        if (m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false && !m.userData.noExport)
          m.castShadow = true;
      });
    for (const m of [...sling.chevrons, sling.ring]) m.castShadow = false;
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const now = () => performance.now();
  const s = {
    scene: o.scene === 'road' ? 'road' : 'stone',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    // the stone: 'whirl' (going round), 'still' (held at one angle, for the test), 'flying', 'done' (landed)
    stone: { phase: 'whirl', base: 0, since: 0, turned0: 0, angle: 0, turned: 0, arrow: true, traces: true, rel: null },
    // the cycle: km from A, and while it rides: from km0 at time `since`
    road: { km: 0, playing: false, km0: 0, since: 0, labels: true },
  };

  // ── the stone ───────────────────────────────────────────────────────────────
  function whirlFrom(deg, { turned = deg } = {}) {
    const st = s.stone;
    Object.assign(st, { phase: 'whirl', base: wrap(deg), since: now(), turned0: turned, rel: null, arrow: true, traces: true });
    tickStone();
  }
  function holdAt(deg, { arrow = true, traces = false } = {}) {
    const st = s.stone;
    Object.assign(st, { phase: 'still', base: wrap(deg), angle: wrap(deg), since: now(), turned0: 0, turned: 0, rel: null, arrow, traces });
    tickStone();
  }
  /** Let go of the rope now (or at angle `deg`). instant: jump to where it lands. */
  function release({ deg = null, instant = false } = {}) {
    const st = s.stone;
    if (st.phase !== 'whirl' && st.phase !== 'still' && deg == null) return;
    const angle = deg == null ? st.angle : wrap(deg);
    const thr = throwFrom(angle);
    st.rel = { angle, thr, at: instant ? now() - flightEnd(thr) * 1000 * STONE.slow : now(), landed: false };
    st.phase = 'flying';
    st.angle = angle;
    if (s.mode !== 'quiz') {
      audio.pop?.();
      hideHint();
    }
    coach?.objectUsed();
    emit('release', { angle: +angle.toFixed(1), heading: +thr.heading.toFixed(1), direction: dirOf(thr.heading) });
    if (!s.userMovedCamera) flyTo(poseFor('stone', s.view), 0.9);
    tickStone();
    refresh();
    emitChange();
  }
  function whirlAgain() {
    whirlFrom(s.stone.angle);
    if (s.mode !== 'quiz') velLabel(true);
    hideHint();
    if (!s.userMovedCamera) flyTo(poseFor('stone', s.view), 0.9);
    refresh();
    emitChange();
  }

  let lastDir = '';
  /** Moves the stone to where it is now; returns true while something moves. */
  function tickStone() {
    const st = s.stone;
    if (st.phase === 'whirl' || st.phase === 'still') {
      if (st.phase === 'whirl') {
        const d = DEG_PER_MS * (now() - st.since);
        st.angle = wrap(st.base + d);
        st.turned = st.turned0 + d;
      }
      sling.setWhirl(st.angle, { turned: st.turned, arrow: st.arrow, traces: st.traces });
      sling.setRipples(-1);
      const dir = dirOf(st.angle + 90);
      if (dir !== lastDir) {
        lastDir = dir;
        emitChange();
      }
      if (st.phase === 'whirl') refreshDirection();
      return st.phase === 'whirl';
    }
    const r = st.rel;
    if (!r) return false;
    const tau = (now() - r.at) / 1000 / STONE.slow;
    sling.setFlight(r.angle, tau, r.thr);
    sling.setRipples(r.thr.wet ? tau - AIR_TIME : -1, r.thr.land.e, r.thr.land.n);
    if (!r.landed && tau >= flightEnd(r.thr)) {
      r.landed = true;
      st.phase = 'done';
      if (s.mode !== 'quiz') {
        showHint(t(r.thr.wet ? 'hint_wet' : 'hint_dry'), { duration: 5200 });
        if (r.thr.wet) audio.success();
        else audio.error();
      }
      emit('land', { inPond: r.thr.wet, east: +r.thr.rest.e.toFixed(2), north: +r.thr.rest.n.toFixed(2) });
      refresh();
      emitChange();
    }
    return tau < AIR_TIME + 2.2;
  }

  // ── the cycle on the road ───────────────────────────────────────────────────
  function rideTo(km, { play = false } = {}) {
    const rd = s.road;
    rd.km = Math.min(Math.max(km, 0), RIDE.km);
    rd.playing = play && rd.km < RIDE.km;
    rd.km0 = rd.km;
    rd.since = now();
    tickRoad();
    roadLabels();
    refresh();
    emitChange();
  }
  function tickRoad() {
    const rd = s.road;
    if (rd.playing) {
      rd.km = Math.min(RIDE.km, rd.km0 + (RIDE.km * (now() - rd.since)) / (RIDE_SCREEN * 1000));
      if (rd.km >= RIDE.km) {
        rd.playing = false;
        roadLabels();
        if (s.mode !== 'quiz') audio.success();
        emit('arrive', { minutes: RIDE.minutes });
        emitChange();
      }
      refresh();
    }
    road.setRide(rd.km);
    return rd.playing;
  }
  function roadLabels() {
    if (s.scene !== 'road' || !s.road.labels) {
      for (const id of ['A', 'B', 'dist', 'disp']) annotations.remove(id);
      return;
    }
    const atB = s.road.km >= RIDE.km - 1e-6;
    const key = `${atB}|${s.road.labels}`;
    if (annotations.has('A') && roadLabels.key === key) return;
    roadLabels.key = key;
    annotations.add('A', { text: 'A', point: road.points.A, dx: -32, dy: 16, kind: 'part' });
    annotations.add('B', { text: 'B', point: road.points.B, dx: 0, dy: -34, kind: 'part' });
    const d = atB ? t('lbl_distance_v', { d: fmt(RIDE.km) }) : t('lbl_distance');
    const sv = atB ? t('lbl_displacement_v', { s: fmt(ROAD.B.straight) }) : t('lbl_displacement');
    annotations.add('dist', {
      text: d,
      point: () => road.points.trailMid(Math.max(0.4, s.road.km)),
      dx: 46,
      dy: 14,
      kind: 'callout',
      color: COLORS.distance,
    });
    annotations.add('disp', { text: sv, point: road.points.arrowMid, dx: -30, dy: -30, kind: 'callout', color: COLORS.displacement });
  }

  stage.addTicker(() => (s.scene === 'stone' ? tickStone() : tickRoad()));

  // ── the two examples ────────────────────────────────────────────────────────
  function velLabel(on) {
    if (on && s.scene === 'stone')
      annotations.add('vel', { text: t('lbl_velocity'), point: sling.points.arrowTip, dx: 0, dy: 0, kind: 'callout', color: COLORS.velocity });
    else annotations.remove('vel');
  }
  function setScene(name, { animate = true, start = true } = {}) {
    s.scene = name === 'road' ? 'road' : 'stone';
    sling.root.visible = s.scene === 'stone';
    road.root.visible = s.scene === 'road';
    annotations.clear();
    roadLabels.key = '';
    hideHint();
    if (s.scene === 'stone') {
      if (start) {
        // as if it had been going round for a while: the faint copies of the last turn are there from the start
        const from = s.stone.phase === 'whirl' ? s.stone.angle : 0;
        whirlFrom(from, { turned: from + 360 });
      }
      velLabel(s.mode !== 'quiz');
      annotations.add('pond', { text: t('lbl_pond'), point: sling.points.pond, dx: 0, dy: 0, kind: 'part' });
    } else if (start) rideTo(0, { play: true });
    s.userMovedCamera = false;
    note.textContent = s.scene === 'stone' ? t('note_slow', { k: STONE.slow }) : t('note_fast', { m: RIDE.minutes, s: RIDE_SCREEN });
    flyTo(poseFor(s.scene, s.view), animate ? 0.8 : 0);
    roadLabels();
    syncUI();
    refresh();
    emit('scene', { scene: s.scene });
    emitChange();
  }

  function mainAction() {
    if (s.locked) return lockedNudge();
    if (s.scene === 'stone') {
      if (s.stone.phase === 'whirl') release();
      else whirlAgain();
      return;
    }
    const rd = s.road;
    if (rd.playing) rideTo(rd.km);
    else rideTo(rd.km >= RIDE.km ? 0 : rd.km, { play: true });
    coach?.objectUsed();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    sp: $('[data-row="sp"]'),
    ve: $('[data-row="ve"]'),
    extra: $('.sv-extra'),
    act: $('[data-act="main"] span'),
  };
  const term = (k, cls, label) => `<span class="pvc-t ${cls}" data-t="${k}"><b></b><small>${label ? t(label) : ''}</small></span>`;
  let rowsScene = '';
  const cells = {};
  function buildRows() {
    if (rowsScene === s.scene) return;
    rowsScene = s.scene;
    if (s.scene === 'stone') {
      el.sp.innerHTML = `<span class="sv-k c-dist">${t('speed')}</span><i>=</i>${term('d', 'dist', 'turn_distance')}<i>÷</i>${term('t', 'time', 'turn_time')}<i>=</i>${term('sp', 'dist res', '')}`;
      el.ve.innerHTML = `<span class="sv-k c-disp">${t('velocity')}</span><i>=</i>${term('vm', 'disp res', 'magnitude')}${term('vd', 'disp sv-dirt', 'direction')}`;
    } else {
      el.sp.innerHTML = `<span class="sv-k c-dist">${t('avg_speed')}</span><i>=</i>${term('d', 'dist', 'total_distance')}<i>÷</i>${term('t', 'time', 'total_time')}<i>=</i>${term('sp', 'dist res', '')}`;
      el.ve.innerHTML = `<span class="sv-k c-disp">${t('avg_velocity')}</span><i>=</i>${term('s', 'disp', 'displacement')}<i>÷</i>${term('t2', 'time', 'time')}<i>=</i>${term('vm', 'disp res', '')}`;
    }
    for (const k of Object.keys(cells)) delete cells[k];
    for (const b of root.querySelectorAll('.sv-row [data-t]')) cells[b.dataset.t] = { b: b.querySelector('b'), html: null };
    for (const k of Object.keys(shown)) delete shown[k];
  }
  function put(k, html) {
    const c = cells[k];
    if (c && c.html !== html) {
      c.html = html;
      c.b.innerHTML = html;
    }
  }
  const shown = {};
  function text(key, node, value) {
    if (shown[key] === value) return;
    shown[key] = value;
    node.innerHTML = value;
  }

  /** The direction of the stone's বেগ in the panel: the arrow turns with it, the word changes every 45°. */
  function refreshDirection() {
    if (s.scene !== 'stone') return;
    const st = s.stone;
    const heading = st.rel ? st.rel.thr.heading : st.angle + 90;
    put('vd', `${DIR_ICON}<span>${dirWord(heading)}</span>`);
    const icon = cells.vd?.b.querySelector('.sv-dir');
    if (icon) icon.style.transform = `rotate(${-heading}deg)`;
  }

  function refresh() {
    buildRows();
    const st = s.stone;
    if (s.scene === 'stone') {
      put('d', `${N(fmt(CIRCUMFERENCE, 2))}${U('u_m')}`);
      put('t', `${N(fmt(PERIOD, 2))}${U('u_s')}`);
      put('sp', `${N(fmt(STONE.v))}${U('u_ms')}`);
      put('vm', `${N(fmt(STONE.v))}${U('u_ms')}`);
      refreshDirection();
      text('extra', el.extra, st.rel ? t('flew_stone') : t('idea_stone', { v: fmt(STONE.v) }));
      text('act', el.act, t(st.phase === 'whirl' || st.phase === 'still' ? 'act_release' : 'act_whirl'));
    } else {
      const r = rideAt(s.road.km);
      const end = r.km >= RIDE.km - 1e-6;
      const km = (x) => `${N(end ? fmt(x, 2) : fixed(x, 2))}${U('u_km')}`;
      const min = `${N(end ? fmt(r.minutes, 1) : fixed(r.minutes, 1))}${U('u_min')}`;
      const speed = (x) => (x == null ? '–' : `${N(end ? fmt(x, 1) : fixed(x, 1))}${U('u_kmh')}`);
      put('d', km(r.distance));
      put('t', min);
      put('t2', min);
      put('s', km(end ? ROAD.B.straight : r.displacement));
      put('sp', speed(r.avgSpeed));
      put('vm', speed(end ? kmh(ROAD.B.straight, RIDE.minutes) : r.avgVelocity));
      text(
        'extra',
        el.extra,
        end ? t('done_road', { d: fmt(RIDE.km), s: fmt(ROAD.B.straight), m: RIDE.minutes, h: HOURS[RIDE.minutes] }) : t('idea_road'),
      );
      text('act', el.act, t(s.road.playing ? 'act_pause' : end ? 'act_replay' : 'act_play'));
    }
    stage.invalidate();
  }

  function snapshot() {
    const st = s.stone;
    const r = rideAt(s.road.km);
    const heading = st.rel ? st.rel.thr.heading : wrap(st.angle + 90);
    return {
      scene: s.scene,
      view: s.view,
      mode: s.mode,
      stone: {
        phase: st.phase,
        angle: +st.angle.toFixed(1),
        speed: STONE.v,
        radius: STONE.r,
        period: +PERIOD.toFixed(3),
        heading: +heading.toFixed(1),
        direction: dirOf(heading),
        released: st.rel
          ? { angle: +st.rel.angle.toFixed(1), heading: +st.rel.thr.heading.toFixed(1), direction: dirOf(st.rel.thr.heading), inPond: st.rel.thr.wet }
          : null,
        landed: st.phase === 'done' ? { east: +st.rel.thr.rest.e.toFixed(2), north: +st.rel.thr.rest.n.toFixed(2), inPond: st.rel.thr.wet } : null,
      },
      road: {
        km: +r.km.toFixed(3),
        minutes: +r.minutes.toFixed(2),
        distance: +r.distance.toFixed(3),
        displacement: +r.displacement.toFixed(3),
        avgSpeed: r.avgSpeed == null ? null : +r.avgSpeed.toFixed(2),
        avgVelocity: r.avgVelocity == null ? null : +r.avgVelocity.toFixed(2),
        playing: s.road.playing,
      },
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.scene}|${snap.mode}|${snap.stone.phase}|${snap.stone.direction}|${s.road.playing}|${Math.round(snap.road.km * 20)}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  /** Points that must be in the picture (three.js coordinates). */
  function contentOf(name) {
    const pts = [];
    if (name === 'road') {
      // the road from A to a little past B, with room for the km numbers and the labels beside it
      for (let km = 0; km <= ROAD_SHOWN; km += 0.1) {
        const p = roadAt(km);
        for (const [de, dn] of [
          [-0.2, 0],
          [0.2, 0],
          [0, 0.2],
          [0, -0.17],
        ])
          pts.push(at(p.e + de, p.n + dn, 0), at(p.e + de, p.n + dn, 0.15));
      }
      pts.push(at(ROAD.B.at[0], ROAD.B.at[1] + 0.4, 0)); // the label B above it
      return pts;
    }
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      pts.push(at(1.42 * Math.cos(a), 1.42 * Math.sin(a), HEIGHT)); // the circle with the arrow and its label
      const r = pondRadius((k / 24) * 360) * 1.16;
      pts.push(at(POND_CENTRE.e + r * Math.cos(a), POND_CENTRE.n + r * Math.sin(a), 0)); // the pond and its bank
    }
    pts.push(at(0, 0, STONE.hand + 0.1));
    for (const [de, dn] of [
      [-0.95, 0],
      [0.78, 0],
      [0, 0.62],
      [0, -0.5],
    ])
      pts.push(at(COMPASS.e + de, COMPASS.n + dn, 0));
    const rel = s.stone.rel;
    if (rel) {
      // after letting go: where the stone ends up must show too
      for (const [de, dn] of [
        [-0.35, -0.35],
        [0.35, 0.35],
        [-0.35, 0.35],
        [0.35, -0.35],
      ])
        pts.push(at(rel.thr.rest.e + de, rel.thr.rest.n + dn, 0));
    }
    return pts;
  }
  /** Where a box on the stage is, on the canvas (px), a little bigger; null when it is not shown. */
  function boxOf(el, pad = 6) {
    if (!el || getComputedStyle(el).visibility === 'hidden') return null;
    const c = stage.canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left - c.left - pad, right: r.right - c.left + pad, top: r.top - c.top - pad, bottom: r.bottom - c.top + pad };
  }
  /**
   * A camera pose that shows the whole scene as big as it can, for this frame's shape: nothing under the buttons
   * at the top right or the note at the top left (the picture may move down a little to make room).
   */
  function poseFor(name, view) {
    const pts = contentOf(name);
    const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
    const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const p of pts) {
      lo.min(p);
      hi.max(p);
    }
    const target = lo.clone().add(hi).multiplyScalar(0.5);
    target.y = name === 'stone' ? 0.6 : 0;
    const back = VIEWS[name][view].clone();
    const right = new THREE.Vector3().crossVectors(WORLD_UP, back).normalize();
    const up = new THREE.Vector3().crossVectors(back, right);
    const local = pts.map((p) => {
      const q = p.clone().sub(target);
      return { x: q.dot(right), y: q.dot(up), z: q.dot(back) };
    });
    const W = stage.width;
    const H = Math.max(stage.height, 120);
    const boxes = [boxOf(ui.corner), boxOf(note)].filter(Boolean);
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const th = tv * camera.aspect;
    const M = 10; // px from the edges
    const bottom = name === 'stone' && s.stone.rel ? Math.min(64, H * 0.16) : M; // after letting go: room for the hint
    const fits = (d, shift) =>
      local.every(({ x, y, z }) => {
        const depth = d - z;
        if (depth < 0.2) return false;
        const px = W / 2 + (x / (depth * th)) * (W / 2);
        const py = H / 2 - (y / (depth * tv)) * (H / 2) + shift;
        if (px < M || px > W - M || py < M || py > H - bottom) return false;
        return !boxes.some((r) => px > r.left && px < r.right && py > r.top && py < r.bottom);
      });
    let best = null;
    for (let shift = 0; shift <= 64; shift += 4) {
      let a = 0.5;
      let b = 120;
      if (!fits(b, shift)) continue;
      for (let i = 0; i < 28; i++) {
        const mid = (a + b) / 2;
        if (fits(mid, shift)) b = mid;
        else a = mid;
      }
      if (!best || b < best.d - 1e-4) best = { d: b, shift };
    }
    const d = (best?.d ?? 20) * 1.02;
    // the shift moves the picture down: the camera goes up by as much, at the distance of the scene
    const t2 = target.addScaledVector(up, ((best?.shift ?? 0) / (H / 2)) * d * tv);
    return { target: t2, position: t2.clone().addScaledVector(back, d) };
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
    return flyTo(poseFor(s.scene, s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(poseFor(s.scene, s.view), 0));

  // ── touching the 3D: the hand or the stone lets go of the rope; the cycle can be dragged ──
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const toScreen = (v, out = { x: 0, y: 0 }) => {
    const p = v.clone().project(camera);
    out.x = (p.x * 0.5 + 0.5) * stage.width;
    out.y = (-p.y * 0.5 + 0.5) * stage.height;
    return out;
  };
  /** What a finger at this canvas point takes: 'hand', 'stone', 'cyclist' or null. */
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = s.scene === 'stone' ? sling.hits : road.hits;
    const hit = raycaster.intersectObjects(hits, false)[0];
    if (hit) return hit.object.userData.part;
    if (s.scene === 'road') {
      // a touch a little off the small cycle still takes it
      const c = toScreen(road.points.cyclist());
      if (Math.hypot(c.x - p.x, c.y - p.y) < 40) return 'cyclist';
    }
    return null;
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const part = pick(canvasPoint(e));
      if (!part) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (part === 'cyclist') {
        drag = { id: e.pointerId };
        try {
          ui.canvasHost.setPointerCapture(e.pointerId); // keep the drag when the finger leaves the cycle
        } catch {}
        s.road.playing = false;
        coach?.objectUsed();
        showHint(t('hint_drag'), { duration: 2200 });
        dragTo(e);
        return;
      }
      // like letting go of a real rope, it happens as the finger goes down
      if (s.stone.phase === 'whirl') release();
      else if (s.stone.phase === 'done') whirlAgain();
    },
    true,
  );
  const sp = { x: 0, y: 0 };
  const toB = Math.round(RIDE.km / ROAD.stepKm);
  function dragTo(e) {
    const p = canvasPoint(e);
    let best = Infinity;
    let bestKm = s.road.km;
    for (let i = 0; i <= toB; i++) {
      const q = roadAt(i * ROAD.stepKm);
      toScreen(at(q.e, q.n, 0.01), sp);
      const d = (sp.x - p.x) ** 2 + (sp.y - p.y) ** 2;
      if (d < best) {
        best = d;
        bestKm = i * ROAD.stepKm;
      }
    }
    rideTo(bestKm);
  }
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      e.preventDefault();
      dragTo(e);
    } else if (e.pointerType === 'mouse' && !drag) {
      ui.canvasHost.style.cursor = pick(canvasPoint(e)) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    }
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    try {
      ui.canvasHost.releasePointerCapture(e.pointerId);
    } catch {}
  };
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

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
  const letters = t('letters').split(',');
  const value = (unit) => (v) => `${N(fmt(v, 2))}<small>${t(unit)}</small>`;
  // book-style numbers: a path D m long, a displacement d m, in t s
  const WALKS = [
    [100, 50, 20],
    [120, 60, 30],
    [150, 90, 30],
    [160, 120, 40],
    [90, 60, 15],
    [200, 140, 40],
    [180, 120, 30],
  ];

  function clearQuizMarks() {
    sling.choiceArrows.forEach((a) => {
      a.root.visible = false;
      a.material.color.set(COLORS.choice);
      a.material.emissive.set(0x000000);
    });
    sling.twin.group.visible = false;
    sling.ring.material.color.set(COLORS.path);
    for (const id of ['c0', 'c1', 'c2', 'c3', 'p1', 'p2', 'se']) annotations.remove(id);
    s.road.labels = true;
  }
  function stoneQuestion(deg, { arrow }) {
    if (s.scene !== 'stone') setScene('stone', { start: false });
    holdAt(deg, { arrow, traces: false });
    annotations.remove('vel');
    if (!s.userMovedCamera) flyTo(poseFor('stone', s.view), 0.8);
  }
  function roadQuestion({ labels }) {
    if (s.scene !== 'road') setScene('road', { start: false });
    s.road.labels = labels !== false;
    roadLabels.key = '';
    rideTo(RIDE.km);
    if (labels === 'plain') {
      // the words only: the numbers of the question are not those of the road
      annotations.add('dist', {
        text: `${t('lbl_distance')}: ${t('lbl_path')}`,
        point: () => road.points.trailMid(RIDE.km),
        dx: 46,
        dy: 14,
        kind: 'callout',
        color: COLORS.distance,
      });
      annotations.add('disp', {
        text: `${t('lbl_displacement')}: ${t('lbl_straight')}`,
        point: road.points.arrowMid,
        dx: -30,
        dy: -30,
        kind: 'callout',
        color: COLORS.displacement,
      });
    }
  }
  /** The right answer and three wrong ones (all different), shuffled. */
  function numericChoices(right, wrong) {
    const seen = new Set([fmt(right, 2)]);
    const list = [right];
    for (const w of wrong) {
      if (list.length === 4) break;
      if (!(w >= 0) || seen.has(fmt(w, 2))) continue;
      seen.add(fmt(w, 2));
      list.push(w);
    }
    return shuffle(list);
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
        hideHint();
        kinds = shuffle(['fly', 'same', 'calc', 'road', 'turn']);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        clearQuizMarks();
        setScene('stone');
        syncUI();
      },
      async prepare(i, _alive, say) {
        clearQuizMarks();
        s.locked = true;
        const kind = kinds[i % kinds.length];
        if (kind === 'fly') {
          // the stone held somewhere on the circle; four arrows: along the tangent (both ways), outwards, inwards
          const deg = pickOne([20, 65, 110, 155, 200, 245, 290, 335]);
          stoneQuestion(deg, { arrow: false });
          const from = sling.points.stone();
          const heads = [deg + 90, deg, deg + 180, deg - 90]; // the first is right
          const order = shuffle([0, 1, 2, 3]); // letter j shows heads[order[j]]
          order.forEach((h, j) => {
            const dir = at(Math.cos((heads[h] * Math.PI) / 180), Math.sin((heads[h] * Math.PI) / 180));
            const a = sling.choiceArrows[j];
            a.set(from, dir, h === 2 ? 0.5 : 0.78);
            a.root.visible = true;
            const tip = from.clone().addScaledVector(dir, h === 2 ? 0.62 : 0.95);
            annotations.add(`c${j}`, { text: letters[j], point: () => tip, dx: 0, dy: 0, kind: 'callout', color: COLORS.choice });
          });
          const expected = order.indexOf(0);
          say(t('q_fly'));
          question = { kind, deg, expected };
          return { choices: [0, 1, 2, 3], expected, tolerance: 0.5, label: (j) => letters[j], meta: { kind, angle: deg } };
        }
        if (kind === 'same') {
          const a = pickOne([0, 45, 90, 135, 180, 225, 270, 315]) + 20;
          const b = a + pickOne([90, 135, 180]);
          stoneQuestion(b, { arrow: true });
          const p = stoneAt(a);
          const pos = at(p.e, p.n, HEIGHT);
          sling.twin.ball.position.copy(pos);
          sling.twin.arrow.set(pos, at(p.ve, p.vn), 0.9);
          sling.twin.group.visible = true;
          annotations.add('p1', { text: N(1), point: () => pos, dx: 0, dy: 26, kind: 'part' });
          annotations.add('p2', { text: N(2), point: sling.points.stone, dx: 0, dy: 26, kind: 'part' });
          say(t('q_same', { a: 1, b: 2 }));
          const keys = shuffle(['opt_same', 'opt_both_same', 'opt_vel_same', 'opt_both_diff']);
          question = { kind, a, b };
          return {
            choices: [0, 1, 2, 3],
            expected: keys.indexOf('opt_same'),
            tolerance: 0.5,
            label: (j) => `<span class="sv-opt">${t(keys[j])}</span>`,
            meta: { kind, from: wrap(a), to: wrap(b) },
          };
        }
        if (kind === 'calc') {
          const [D, d, tt] = pickOne(WALKS);
          const speed = Math.random() < 0.5;
          roadQuestion({ labels: 'plain' });
          say(t(speed ? 'q_calc_speed' : 'q_calc_vel', { t: tt, D, d }));
          const right = (speed ? D : d) / tt;
          const wrong = speed ? [d / tt, tt / D, D * tt] : [D / tt, tt / d, d * tt];
          question = { kind, D, d, t: tt, speed, right };
          return {
            choices: numericChoices(right, wrong),
            expected: right,
            tolerance: 0.004,
            label: value('u_ms'),
            meta: { kind, quantity: speed ? 'speed' : 'velocity', D, d, t: tt },
          };
        }
        if (kind === 'road') {
          const m = pickOne([10, 20, 40]);
          const speed = Math.random() < 0.5;
          roadQuestion({ labels: true });
          say(t(speed ? 'q_road_speed' : 'q_road_vel', { m }));
          const [x, y] = speed ? [RIDE.km, ROAD.B.straight] : [ROAD.B.straight, RIDE.km];
          // the usual slips: the other quantity, 20 minutes taken as 0.2 hour, minutes not turned into hours
          const right = kmh(x, m);
          question = { kind, m, speed, right };
          return {
            choices: numericChoices(right, [kmh(y, m), x / (m / 100), x / m]),
            expected: right,
            tolerance: 0.004,
            label: value('u_kmh'),
            meta: { kind, quantity: speed ? 'average speed' : 'average velocity', minutes: m },
          };
        }
        // a whole turn: back where it started, so the displacement and the average velocity are zero
        const deg = pickOne([0, 90, 180, 270]) + 30;
        stoneQuestion(deg, { arrow: false });
        sling.ring.material.color.set(COLORS.distance);
        annotations.add('se', { text: t('lbl_start_end'), point: sling.points.stone, dx: 0, dy: 30, kind: 'part' });
        say(t('q_turn', { v: fmt(STONE.v) }));
        question = { kind };
        return {
          choices: shuffle([0, STONE.v, (2 * STONE.r) / PERIOD, STONE.r / PERIOD]),
          expected: 0,
          tolerance: 0.004,
          label: value('u_ms'),
          meta: { kind },
        };
      },
      reveal() {
        const q = question;
        if (q.kind === 'fly') {
          const a = sling.choiceArrows[q.expected];
          a.material.color.set(COLORS.velocity);
          release({ deg: q.deg });
          return t('why_fly', { l: letters[q.expected] });
        }
        if (q.kind === 'same') return t('why_same', { v: fmt(STONE.v), a: dirWord(q.a + 90), b: dirWord(q.b + 90) });
        if (q.kind === 'calc') return t(q.speed ? 'why_calc_speed' : 'why_calc_vel', { D: q.D, d: q.d, t: q.t, r: fmt(q.right, 2) });
        if (q.kind === 'road')
          return t(q.speed ? 'why_road_speed' : 'why_road_vel', {
            m: q.m,
            h: HOURS[q.m],
            D: fmt(RIDE.km),
            d: fmt(ROAD.B.straight),
            r: fmt(q.right, 2),
          });
        return t('why_turn', { c: fmt(CIRCUMFERENCE, 2), p: fmt(PERIOD, 2), v: fmt(STONE.v), z: 0 });
      },
      done() {
        s.locked = false;
        clearQuizMarks();
        setScene('stone');
      },
    },
  });

  // ── first-use pointer: on the hand that holds the rope ──────────────────────
  let coach = null;
  if (o.coach) {
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, note],
      object: {
        label: 'coach_release',
        candidates: () => (s.scene === 'stone' && s.stone.phase === 'whirl' ? [toScreen(sling.points.hand())] : []),
        grabbable: (p) => pick(p) === 'hand',
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
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.scene && b.dataset.scene !== s.scene) setScene(b.dataset.scene);
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
      case 'main':
        if (e.detail === 0) mainAction(); // the keyboard; a finger or the mouse acted on pointerdown
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // letting go of the rope must happen as the finger goes down (a click comes only when it lifts)
  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !(/** @type {Element} */ (e.target).closest('[data-act="main"]'))) return;
    audio.unlock();
    mainAction();
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if ((k === ' ' || k === 'enter') && !target.closest('button')) mainAction();
    else if (k === '1') setScene('stone');
    else if (k === '2') setScene('road');
    else if ((k === 'arrowright' || k === 'arrowleft') && s.scene === 'road' && !s.locked)
      rideTo(Math.round((s.road.km + (k === 'arrowright' ? 0.1 : -0.1)) * 1000) / 1000);
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  setView(s.view, { animate: false });
  setScene(s.scene, { animate: false });
  syncUI();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else {
      coach?.start(1400);
      if (s.scene === 'stone' && o.coach)
        setTimeout(() => s.mode === 'explore' && s.stone.phase === 'whirl' && showHint(t('hint_aim'), { duration: 4500 }), 5200);
    }
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
     * Change any of: scene ('stone' | 'road'); angle (deg from east, anticlockwise: the stone goes round from there,
     * with its faint copies); whirl (true: go round again, false: hold it still); release (true: let go now, or an
     * angle to let go at); km (0–4, the cycle on the road, stopped) or minutes (0–20); playing (the cycle rides on);
     * view; animate: false jumps (a release lands at once).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.scene && p.scene !== s.scene) setScene(p.scene, { animate, start: p.km == null && p.minutes == null });
      if (p.angle != null) {
        if (s.scene !== 'stone') setScene('stone', { animate });
        whirlFrom(Number(p.angle), { turned: Number(p.angle) + 360 });
        velLabel(s.mode !== 'quiz');
        if (!s.userMovedCamera) flyTo(poseFor('stone', s.view), animate ? 0.6 : 0);
      }
      if (p.whirl === true && s.scene === 'stone') whirlAgain();
      if (p.whirl === false && s.stone.phase === 'whirl') {
        s.stone.phase = 'still';
        tickStone();
      }
      if (p.release != null && p.release !== false) {
        if (s.scene !== 'stone') setScene('stone', { animate });
        release({ deg: typeof p.release === 'number' ? p.release : s.stone.angle, instant: !animate });
      }
      if (p.km != null || p.minutes != null) {
        if (s.scene !== 'road') setScene('road', { animate, start: false });
        rideTo(p.km != null ? Number(p.km) : (Number(p.minutes) / RIDE.minutes) * RIDE.km, { play: p.playing === true });
      } else if (p.playing != null && s.scene === 'road' && Boolean(p.playing) !== s.road.playing) mainAction();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      clearQuizMarks();
      s.stone.rel = null;
      s.stone.phase = 'whirl';
      s.stone.angle = 0;
      setScene('stone', { animate: false });
      whirlFrom(0);
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => (s.scene === 'stone' ? sling.root : road.root), // the scene shown: helpers are left out
  };
}
