// Equations of motion (book pages 45–46, topic 2.7), student view. A commuter train on a straight double-track
// railway; the student sets its আদি বেগ u, ত্বরণ a and the time t with three steppers and runs it (in real
// time). As it goes, the বেগ–সময় graph draws the straight line v = u + at, and the area under it fills in
// 1-second strips (the same colours as the distance bar under the train): the area is the distance, so the
// train is always where the area says. On the other track a see-through train runs the whole time at the
// average velocity V = (u + v)/2 and arrives at the same place at the same moment; at the end the triangle above
// V turns half round into the gap below it, so the area is V × t: s = Vt = ut + ½at². The panel writes the four
// equations with the student's numbers. A braking train (negative a) stops, it never goes backwards. Then a short
// test. Built on the shared student kit (@shared/student/…); the maths is in motion.js, the graph in graph.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createCoach } from '@shared/student/coach.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { drawGraph, placeFirst, placeLabel } from './graph.js';
import { createI18n } from './i18n.js';
import {
  QUIZ,
  TRAIN_LENGTH,
  answers,
  distanceAt,
  fixPlan,
  fixed,
  fmt,
  niceAxis,
  roundTo,
  solve,
  stepPlan,
  stopTime,
  timeAt,
  velocityAt,
} from './motion.js';
import { GROUND, POST_Z, TRACKS, createGround, createRailway } from './railway.js';
import { createTrain } from './train.js';

export const DEFAULTS = {
  u: 4, // m/s
  a: 1, // m/s²
  t: 6, // s
  time: 0, // s into the run shown at the start (t: the end)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per quantity (style.css has the same): বেগ orange, গড় বেগ raspberry, দূরত্ব blue, সময় purple, ত্বরণ green
const COLORS = {
  vel: '#d9480f',
  velFaint: '#f0a27a',
  avg: '#c2255c',
  dist: '#1c6fd9',
  distDark: '#14529f',
  strips: ['#9fc4f2', '#d3e4fa'],
  moved: '#84b1ec', // the triangle that turns into the gap: the same blue, a shade darker
  time: '#6741d9',
  ink: '#1d2733',
  ink2: '#4b5766',
  ink3: '#7a8594',
  grid: '#e6eaef',
};
// where the camera looks from (towards the camera from the railway): from the front a little above, so both
// tracks show; "rotate" starts from the front left
const VIEW_DIRS = {
  front: new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(38)), Math.cos(THREE.MathUtils.degToRad(38))),
  '3d': new THREE.Vector3(-0.32, 0.5, 0.8).normalize(),
};
const MIN_END = 36; // m: the picture shows at least this much track ahead of the start
const QUIZ_END = 80; // m: in the test the picture always shows the same stretch, so it hints nothing
const HOLD = 0.5; // s after arriving before the triangle turns
const SWAP = 1.1; // s for the triangle to turn
const DOUBLE_TAP = 400; // ms: a second tap this soon does not undo the first
const NOTE_MS = 4200; // how long a stepper's note stays in the panel

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const n = (x, d = 2) => N(fmt(x, d)); // a number in a sentence or sum
  const p = (x) => (x < 0 ? `(${n(x)})` : n(x)); // in a sum, a negative number goes in brackets

  root.classList.add('pvc', 'eom');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const units = { u: 'u_ms', a: 'u_ms2', t: 'u_s' };
  const stepper = (k) => `
            <div class="eom-step k-${k}">
              <span class="eom-name"><b>${k}</b> ${t(`name_${k}`)} <small>(${t(units[k])})</small></span>
              <div class="eom-ctl">
                <button class="eom-pm" data-step="${k}" data-dir="-1" aria-label="${t(`less_${k}`)}">${ICONS.minus}</button>
                <output class="eom-val" data-val="${k}"></output>
                <button class="eom-pm" data-step="${k}" data-dir="1" aria-label="${t(`more_${k}`)}">${ICONS.plus}</button>
              </div>
            </div>`;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="eom-steps">${stepper('u')}${stepper('a')}${stepper('t')}</div>
          <div class="eom-eqs" role="group" aria-label="${t('eqs')}">
            ${['v', 'V', 's', 's2', 'v2'].map((k) => `<div class="eom-eq" data-eq="${k}"><span class="f"></span><span class="n"></span><span class="r"></span></div>`).join('')}
          </div>
          <div class="pvc-learn-foot eom-foot">
            <p class="eom-say" aria-live="polite"></p>
            <button class="pvc-btn primary eom-run" data-act="run"><span class="ic"></span><span class="lb"></span></button>
          </div>`,
  });
  const overlay = document.createElement('canvas');
  overlay.className = 'eom-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  ui.canvasHost.after(overlay);
  const octx = overlay.getContext('2d');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 0.5, far: 3000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 8;
  controls.maxDistance = 900;
  controls.maxPolarAngle = Math.PI * 0.48; // never under the ground
  controls.enablePan = false;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  const world = new THREE.Group();
  world.name = 'EquationsOfMotion';
  scene.add(world, createGround());
  const railway = createRailway();
  const train = createTrain();
  const ghost = createTrain({ ghost: true, color: COLORS.avg });
  train.root.position.z = TRACKS.near;
  ghost.root.position.z = TRACKS.far;
  world.add(railway.root, train.root, ghost.root);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 6;
    Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 20, bottom: -20, near: 10, far: 120 });
    const page = new THREE.Mesh(new THREE.PlaneGeometry(600, 40), new THREE.ShadowMaterial({ opacity: 0.14 }));
    page.rotation.x = -Math.PI / 2;
    page.position.set(130, GROUND + 0.005, 0);
    page.receiveShadow = true;
    page.userData.noExport = true;
    scene.add(sun, sun.target, page);
    // the sun follows the middle of the picture, so the shadows are sharp wherever the train is
    stage.onBeforeRender(() => {
      const cx = THREE.MathUtils.clamp(controls.target.x, -20, 300);
      sun.target.position.set(cx, 0, 0);
      sun.position.set(cx - 18, 46, 30);
    });
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const now = () => performance.now();
  const ALL = {
    plan: true,
    line: true,
    area: true,
    strips: true,
    V: true,
    mid: true,
    uLabel: true,
    vLabel: true,
    sLabel: true,
    cursor: true,
    ghost: true,
    bar: true,
  };
  const s = {
    plan: fixPlan(o),
    tau: 0, // s into the run
    playing: false,
    since: 0, // performance.now() when the run (re)started, from tau0
    tau0: 0,
    endAt: 0, // performance.now() when the run arrived (the triangle turns after it); 0 = no turn
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    lastToggle: -1e9,
    swapSaid: false, // the panel has said what the turned triangle shows
    note: null, // { key, vars, until }: a stepper's note in the panel
    // what the picture shows (the test hides what a question asks)
    show: { ...ALL },
    graphTau: null, // the graph drawn this far (the test can draw it all while the train waits at the start)
    axisT: null, // the test can make the time axis longer than t (so it does not give t away)
    tMark: null, // the test marks a time on the axis: { at, text }
    vAxisRoom: 1, // the test leaves room above the line, so the axis top does not give v away
    farEnd: null, // the test shows a fixed stretch of track
  };
  let r = solve(s.plan); // v, V, s, … of the plan

  const swapProgress = () => {
    if (!s.endAt || s.playing || Math.abs(s.plan.a) < 1e-9) return 0;
    const k = ((now() - s.endAt) / 1000 - HOLD) / SWAP;
    const x = Math.min(1, Math.max(0, k));
    return x * x * (3 - 2 * x);
  };
  const phase = () => (s.playing ? 'running' : s.tau <= 1e-9 ? 'ready' : s.tau >= s.plan.t - 1e-9 ? 'done' : 'paused');

  function snapshot() {
    const { u, a, t: tt } = s.plan;
    return {
      u,
      a,
      t: tt,
      v: r.v,
      V: r.V,
      s: r.s,
      time: roundTo(s.tau, 3),
      velocity: roundTo(velocityAt(u, a, s.tau), 3),
      distance: roundTo(distanceAt(u, a, s.tau), 3),
      ghost: roundTo(r.V * s.tau, 3),
      phase: phase(),
      playing: s.playing,
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.u}|${snap.a}|${snap.t}|${snap.phase}|${s.mode}|${Math.round(snap.time * 4)}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the trains ──────────────────────────────────────────────────────────────
  function placeTrains() {
    const { u, a } = s.plan;
    train.root.position.x = distanceAt(u, a, s.tau);
    ghost.root.position.x = r.V * s.tau;
    ghost.root.visible = s.show.ghost;
    stage.invalidate();
  }

  /** Run from where it is (from the start if it had arrived). */
  function play() {
    if (s.locked && s.mode !== 'quiz') return lockedNudge();
    if (phase() === 'done') s.tau = 0;
    s.tau0 = s.tau;
    s.since = now();
    s.playing = true;
    s.endAt = 0;
    s.swapSaid = false;
    s.note = null;
    coach?.objectUsed();
    emit('run', { from: roundTo(s.tau, 3) });
    refresh();
    emitChange();
  }
  function pause() {
    if (!s.playing) return;
    tick();
    s.playing = false;
    refresh();
    emitChange();
  }
  function toggleRun() {
    if (s.locked) return lockedNudge();
    if (now() - s.lastToggle < DOUBLE_TAP) return;
    s.lastToggle = now();
    audio.unlock();
    if (s.playing) pause();
    else {
      play();
      audio.tick();
    }
  }
  /** Shows the moment tau (s), stopped. */
  function showAt(tau) {
    s.playing = false;
    s.endAt = 0;
    s.tau = Math.min(s.plan.t, Math.max(0, tau));
    placeTrains();
    refresh();
    emitChange();
  }

  function tick() {
    let moving = false;
    if (s.playing) {
      const tau = s.tau0 + (now() - s.since) / 1000;
      if (tau >= s.plan.t) {
        s.tau = s.plan.t;
        s.playing = false;
        s.endAt = now();
        s.swapSaid = false;
        if (s.mode !== 'quiz') audio.success();
        emit('arrive', { t: s.plan.t, s: r.s, v: r.v });
        refresh();
        emitChange();
      } else s.tau = tau;
      placeTrains();
      moving = true;
    }
    if (s.endAt && !s.playing) {
      const k = (now() - s.endAt) / 1000;
      if (k < HOLD + SWAP + 0.1) moving = true;
      if (k > HOLD + SWAP && !s.swapSaid) {
        s.swapSaid = true;
        refresh();
      }
    }
    if (moving) {
      if (s.playing) refreshLive();
      stage.invalidate();
    }
    return moving;
  }
  stage.addTicker(tick);

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    vals: { u: $('[data-val="u"]'), a: $('[data-val="a"]'), t: $('[data-val="t"]') },
    eq: Object.fromEntries(['v', 'V', 's', 's2', 'v2'].map((k) => [k, $(`[data-eq="${k}"]`)])),
    say: $('.eom-say'),
    runIcon: $('.eom-run .ic'),
    runLabel: $('.eom-run .lb'),
  };
  const q = (cls, x) => `<i class="q-${cls}">${x}</i>`;
  const FORMULAS = {
    v: `${q('v', 'v')} = ${q('v', 'u')} + ${q('a', 'a')}${q('t', 't')}`,
    V: `${q('V', 'V')} = (${q('v', 'u')} + ${q('v', 'v')})/2`,
    s: `${q('s', 's')} = ${q('V', 'V')}${q('t', 't')}`,
    s2: `${q('s', 's')} = ${q('v', 'u')}${q('t', 't')} + ½${q('a', 'a')}${q('t', 't')}²`,
    v2: `${q('v', 'v')}² = ${q('v', 'u')}² + 2${q('a', 'a')}${q('s', 's')}`,
  };
  for (const [k, f] of Object.entries(FORMULAS)) el.eq[k].querySelector('.f').innerHTML = f;
  const shown = new Map();
  const put = (node, html) => {
    if (shown.get(node) === html) return;
    shown.set(node, html);
    node.innerHTML = html;
  };

  function sayLine() {
    const { u, a, t: tt } = s.plan;
    if (s.note && now() < s.note.until) return t(s.note.key, s.note.vars);
    const ph = phase();
    const rest = u === 0 && a === 0;
    if (ph === 'ready')
      return t(rest ? 'say_ready_rest' : a > 0 ? 'say_ready_up' : a < 0 ? 'say_ready_down' : 'say_ready_zero', { a: fmt(a), b: fmt(-a) });
    if (ph === 'running') return t(rest ? 'say_ready_rest' : a > 0 ? 'say_run_up' : a < 0 ? 'say_run_down' : 'say_run_zero');
    if (ph === 'paused') return t('say_paused', { tau: fmt(s.tau, 1), v: fmt(velocityAt(u, a, s.tau), 1), s: fmt(distanceAt(u, a, s.tau), 1) });
    if (rest) return t('say_done_rest');
    if (a === 0) return t('say_done_zero', { u: fmt(u), t: fmt(tt), s: fmt(r.s) });
    return t(s.endAt && s.swapSaid ? 'say_swapped' : 'say_arrived', { V: fmt(r.V), t: fmt(tt), s: fmt(r.s) });
  }

  function refresh() {
    const { u, a, t: tt } = s.plan;
    put(el.vals.u, n(u));
    put(el.vals.a, n(a));
    put(el.vals.t, n(tt));
    // dim a button that cannot step (it still says why when pressed)
    for (const b of ui.$$('[data-step]')) {
      const res = stepPlan(s.plan, b.dataset.step, Number(b.dataset.dir));
      const off = res.note === 'min' || res.note === 'max' || res.note === 'stops' || res.note === 'backwards';
      b.classList.toggle('off', off);
      b.setAttribute('aria-disabled', String(off));
    }
    const ms = `<small>${t('u_ms')}</small>`;
    const m = `<small>${t('u_m')}</small>`;
    const row = (k, nums, res) => {
      put(el.eq[k].querySelector('.n'), nums);
      put(el.eq[k].querySelector('.r'), res);
    };
    row('v', `= ${n(u)} + ${p(a)} × ${n(tt)}`, `= ${q('v', `<b>${n(r.v)}</b>`)} ${ms}`);
    row('V', `= (${n(u)} + ${n(r.v)}) ÷ ${N(2)}`, `= ${q('V', `<b>${n(r.V)}</b>`)} ${ms}`);
    row('s', `= ${n(r.V)} × ${n(tt)}`, `= ${q('s', `<b>${n(r.s)}</b>`)} ${m}`);
    row('s2', `= ${n(r.ut)} + ${p(r.half)}`, `= ${q('s', `<b>${n(r.s)}</b>`)} ${m}`);
    row('v2', `${n(r.v * r.v)} = ${n(u * u)} + ${p(2 * a * r.s)}`, `<span class="ok">${ICONS.check}</span>`);
    put(el.say, sayLine());
    const ph = phase();
    put(el.runIcon, s.playing ? ICONS.pause : ph === 'done' ? ICONS.reset : ICONS.play);
    put(el.runLabel, t(s.playing ? 'act_pause' : ph === 'done' ? 'act_again' : ph === 'paused' ? 'act_on' : 'act_run'));
    stage.invalidate();
  }
  /** While running only the say line can change (the sums are those of the plan). */
  function refreshLive() {
    put(el.say, sayLine());
  }

  /** One tap on a stepper (key 'u' | 'a' | 't', dir ±1). */
  function step(key, dir) {
    if (s.locked) return lockedNudge();
    const res = stepPlan(s.plan, key, dir);
    const ts = Math.floor(stopTime(res.u, res.a) + 1e-9);
    if (res.note) {
      s.note = { key: `say_${res.note}`, vars: { ts }, until: now() + NOTE_MS };
      setTimeout(() => refresh(), NOTE_MS + 50);
    } else s.note = null;
    if (res.note && res.note !== 'cut') {
      audio.error();
      refresh();
      return;
    }
    audio.tick();
    setPlan(res);
    coach?.objectUsed();
  }
  /** A new plan: the moment shown stays the same kind (the start, or the end). */
  function setPlan(plan, { animate = true } = {}) {
    const wasDone = phase() === 'done' || s.playing;
    s.plan = fixPlan(plan);
    r = solve(s.plan);
    s.playing = false;
    s.endAt = 0;
    s.tau = wasDone ? s.plan.t : Math.min(s.tau, s.plan.t);
    placeTrains();
    refresh();
    if (!s.userMovedCamera) flyTo(viewPose(), animate ? 0.45 : 0);
    emit('plan', { ...s.plan });
    emitChange();
  }

  // ── layout: the railway on top (or right), the graph under it (or left) ──────
  const L = { rail: { x: 0, y: 0, w: 1, h: 1 }, graph: { x: 0, y: 0, w: 1, h: 1 }, side: false };
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  const MARGIN = { top: 20, bottom: 42, left: 6, right: 8 }; // px for the labels round the railway
  /** Where an element of the stage is, on the canvas (px), a little bigger; null when it is not shown. */
  function boxOf(node, pad = 4) {
    if (!node || getComputedStyle(node).visibility === 'hidden') return null;
    const c = stage.canvas.getBoundingClientRect();
    const b = node.getBoundingClientRect();
    if (!b.width) return null;
    return { left: b.left - c.left - pad, right: b.right - c.left + pad, top: b.top - c.top - pad, bottom: b.bottom - c.top + pad };
  }
  /** The stretch of railway the picture shows (end: how far along the track). */
  const railBox = (end) => ({ x0: -TRAIN_LENGTH - 1.5, x1: end, y0: GROUND, y1: 4.3, z0: TRACKS.far - 1.5, z1: POST_Z + 0.2 });
  /**
   * The camera distance at which the box fits rw × rh px for this view, and where it then lands on the canvas
   * (px from the projection centre).
   */
  function fit(b, view, rw, rh) {
    const target = new THREE.Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2);
    const back = VIEW_DIRS[view].clone();
    const right = new THREE.Vector3().crossVectors(WORLD_UP, back).normalize();
    const up = new THREE.Vector3().crossVectors(back, right);
    const local = [];
    for (const x of [b.x0, b.x1])
      for (const y of [b.y0, b.y1])
        for (const z of [b.z0, b.z1]) {
          const q0 = new THREE.Vector3(x, y, z).sub(target);
          local.push({ x: q0.dot(right), y: q0.dot(up), z: q0.dot(back) });
        }
    const f = Math.max(stage.height, 100) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const bbox = (d) => {
      const bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
      for (const c of local) {
        const depth = d - c.z;
        bb.x0 = Math.min(bb.x0, (f * c.x) / depth);
        bb.x1 = Math.max(bb.x1, (f * c.x) / depth);
        bb.y0 = Math.min(bb.y0, (-f * c.y) / depth);
        bb.y1 = Math.max(bb.y1, (-f * c.y) / depth);
      }
      return bb;
    };
    let lo = 5;
    let hi = 4000;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const bb = bbox(mid);
      if (bb.x1 - bb.x0 <= rw && bb.y1 - bb.y0 <= rh) hi = mid;
      else lo = mid;
    }
    return { d: hi, bb: bbox(hi), target, back };
  }
  /**
   * Splits the stage: on wide frames the graph left and the railway right; otherwise the railway on top (as tall
   * as the shortest run needs, at most half) and the graph under it. The split does not depend on the run, so the
   * graph keeps its size while the student changes u, a and t.
   */
  function layout() {
    const W = stage.width;
    const H = stage.height;
    const corner = boxOf(ui.corner, 2);
    const cb = corner ? corner.bottom : 48;
    L.side = W / H >= 1.9;
    if (L.side) {
      const gw = Math.round(Math.min(W * 0.4, H * 1.3));
      L.graph = { x: 4, y: 6, w: gw, h: H - 10 };
      L.rail = { x: gw + 10, y: cb + 2, w: W - gw - 14, h: H - cb - 8 };
      return;
    }
    const rw = W - 8 - MARGIN.left - MARGIN.right;
    const ref = fit(railBox(MIN_END + 6), 'front', rw, 1e5);
    const need = ref.bb.y1 - ref.bb.y0 + MARGIN.top + MARGIN.bottom;
    const railH = Math.round(Math.max(70, Math.min(need, (H - cb) * 0.5)));
    L.rail = { x: 4, y: cb, w: W - 8, h: railH };
    L.graph = { x: 4, y: cb + railH + 2, w: W - 8, h: H - cb - railH - 6 };
  }

  // ── camera: the railway fitted into its part of the picture ───────────────────
  /**
   * A camera pose that shows the railway as big as it fits in L.rail, for this frame's shape. The picture is moved
   * into that part of the canvas by an off-centre projection (camera.setViewOffset), so the perspective stays true.
   */
  function viewPose(view = s.view) {
    layout();
    const rw = Math.max(40, L.rail.w - MARGIN.left - MARGIN.right);
    const rh = Math.max(24, L.rail.h - MARGIN.top - MARGIN.bottom);
    const { d, bb, target, back } = fit(railBox(s.farEnd ?? Math.max(r.s, MIN_END) + 6), view, rw, rh);
    // move the picture so the box's middle lands in the middle of the railway's part of the canvas
    const cx = L.rail.x + MARGIN.left + rw / 2;
    const cy = L.rail.y + MARGIN.top + rh / 2;
    const shift = { x: cx - (stage.width / 2 + (bb.x0 + bb.x1) / 2), y: cy - (Math.max(stage.height, 100) / 2 + (bb.y0 + bb.y1) / 2) };
    return { target, position: target.clone().addScaledVector(back, d), shift };
  }
  let viewShift = { x: 0, y: 0 };
  function applyShift(shift) {
    viewShift = shift;
    camera.setViewOffset(stage.width, stage.height, -shift.x, -shift.y, stage.width, stage.height);
  }
  function flyTo(pose, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const s0 = { ...viewShift };
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(pose.position);
      controls.target.copy(pose.target);
      applyShift(pose.shift);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, pose.position, k);
        controls.target.lerpVectors(t0, pose.target, k);
        applyShift({ x: s0.x + (pose.shift.x - s0.x) * k, y: s0.y + (pose.shift.y - s0.y) * k });
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
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (s.userMovedCamera) {
      // keep the student's angle, but keep the picture in its part of the canvas
      layout();
      applyShift(viewShift);
    } else flyTo(viewPose(), 0);
  });

  // ── the overlay: the graph, and the railway's numbers and distance bar ────────
  const v3 = new THREE.Vector3();
  const toScreen = (x, y, z, out = { x: 0, y: 0 }) => {
    v3.set(x, y, z).project(camera);
    out.x = (v3.x * 0.5 + 0.5) * stage.width;
    out.y = (-v3.y * 0.5 + 0.5) * stage.height;
    out.ok = v3.z < 1;
    return out;
  };
  const sp = [{}, {}, {}, {}];
  const FONT = '"Noto Sans Bengali", "Segoe UI", Roboto, Arial, sans-serif';

  /** The posts' numbers, the distance bar (one segment per second) and the ghost's label. */
  function drawRail(ctx, taken) {
    const { u, a } = s.plan;
    const clip = { left: L.rail.x, right: L.rail.x + L.rail.w, top: L.rail.y - 4, bottom: L.rail.y + L.rail.h + 4 };
    // the line of posts on the screen, and the side of it away from the tracks: numbers and bar go there, a
    // fixed number of pixels out (so they stay readable at any size, and follow the line in the turned view)
    const P = (x, out) => toScreen(x, GROUND, POST_Z, out);
    const f0 = P(0, sp[0]);
    const f1 = P(10, sp[1]);
    const per10 = Math.hypot(f1.x - f0.x, f1.y - f0.y) || 1;
    const dir = { x: (f1.x - f0.x) / per10, y: (f1.y - f0.y) / per10 };
    const tc = toScreen(0, 0, TRACKS.near, sp[2]);
    let nx = -dir.y;
    let ny = dir.x;
    if ((tc.x - f0.x) * nx + (tc.y - f0.y) * ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const out = (pt, d) => ({ x: pt.x + nx * d, y: pt.y + ny * d });
    const every = [10, 20, 50, 100].find((k) => (k / 10) * per10 >= 30) ?? 100;
    const fs = per10 > 60 ? 13 : 12;
    const nums = [];
    for (let x = 0; x <= 320; x += every) {
      const f = P(x, sp[2]);
      if (!f.ok || f.x < clip.left + 8 || f.x > clip.right - 8) continue;
      nums.push({ x, at: out(f, 6 + fs * 0.62) });
    }
    const drawNumbers = () => {
      for (const [i, k] of nums.entries()) {
        const text = i === nums.length - 1 ? `${N(k.x)} ${t('u_m')}` : N(k.x);
        placeLabel(ctx, taken, text, k.at.x, k.at.y, { align: 'center', color: COLORS.ink2, size: fs, weight: 600 });
      }
    };

    // the distance bar beyond the numbers: from the start post to the train's nose, one segment per second
    if (!s.show.bar) return drawNumbers();
    const x = distanceAt(u, a, s.tau);
    const D = 8 + fs * 1.25 + 8; // px from the post line to the bar's middle
    const H = 9;
    const at = (xm, d = D) => out(P(xm, sp[3]), d);
    const quad = (xa, xb, h) => {
      const A = at(xa);
      const B = at(xb);
      ctx.beginPath();
      ctx.moveTo(A.x - (nx * h) / 2, A.y - (ny * h) / 2);
      ctx.lineTo(B.x - (nx * h) / 2, B.y - (ny * h) / 2);
      ctx.lineTo(B.x + (nx * h) / 2, B.y + (ny * h) / 2);
      ctx.lineTo(A.x + (nx * h) / 2, A.y + (ny * h) / 2);
      ctx.closePath();
    };
    // extension lines: from the start post and from the nose out to the bar
    const s0 = at(0, D + H / 2 + 2);
    const nose = toScreen(x, 0.35, TRACKS.near + 1.5, sp[1]);
    const sN = at(x, D + H / 2 + 2);
    ctx.strokeStyle = COLORS.dist;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(f0.x, f0.y + 1);
    ctx.lineTo(s0.x, s0.y);
    if (s.tau > 0) {
      ctx.moveTo(nose.x, nose.y);
      ctx.lineTo(sN.x, sN.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    drawNumbers(); // over the extension lines: their white halo breaks the line
    if (s.tau <= 0) return;
    const secs = Math.ceil(s.tau - 1e-9);
    for (let k = 0; k < secs; k++) {
      quad(distanceAt(u, a, k), distanceAt(u, a, Math.min(k + 1, s.tau)), H);
      ctx.fillStyle = COLORS.strips[k % 2];
      ctx.fill();
    }
    ctx.strokeStyle = COLORS.dist;
    ctx.lineWidth = 1.2;
    quad(0, x, H);
    ctx.stroke();
    ctx.beginPath();
    for (let k = 1; k < secs; k++) {
      const c = at(distanceAt(u, a, k));
      ctx.moveTo(c.x - (nx * H) / 2, c.y - (ny * H) / 2);
      ctx.lineTo(c.x + (nx * H) / 2, c.y + (ny * H) / 2);
    }
    ctx.stroke();
    const A = at(0);
    const B = at(x);
    taken.push({ left: Math.min(A.x, B.x) - 6, right: Math.max(A.x, B.x) + 6, top: Math.min(A.y, B.y) - 6, bottom: Math.max(A.y, B.y) + 6 });
    // its length: on the bar when there is room, else beyond its end
    if (s.show.sLabel) {
      // fixed decimals only while it runs (a steady readout); stopped, no trailing zeros
      const text = t('lbl_s', { s: s.playing ? fixed(x, 1) : fmt(x, phase() === 'paused' ? 1 : 2) });
      ctx.font = `700 13px ${FONT}`;
      const w = ctx.measureText(text).width;
      if (Math.hypot(B.x - A.x, B.y - A.y) > w + 26) {
        const c = at(x / 2);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.roundRect(c.x - w / 2 - 5, c.y - 9, w + 10, 18, 4);
        ctx.fill();
        ctx.strokeStyle = COLORS.dist;
        ctx.stroke();
        placeLabel(ctx, taken, text, c.x, c.y, { align: 'center', color: COLORS.distDark, size: 13, weight: 700, force: true });
      } else placeLabel(ctx, taken, text, B.x + 7 * dir.x + 4, B.y + 7 * dir.y, { color: COLORS.distDark, size: 13, weight: 700, force: true });
    }
    // the ghost's name, above it
    if (s.show.ghost && ghost.root.visible) {
      const top = toScreen(ghost.root.position.x - TRAIN_LENGTH / 2, 4.3, TRACKS.far, sp[0]);
      const nose2 = toScreen(ghost.root.position.x, 4.3, TRACKS.far, sp[1]);
      placeFirst(
        ctx,
        taken,
        t('lbl_ghost'),
        [
          [top.x, top.y - 10, { align: 'center' }],
          [nose2.x, top.y - 10, { align: 'right' }],
          [nose2.x - (nose2.x - top.x) * 2, top.y - 10, { align: 'left' }],
        ],
        { color: COLORS.avg, size: 12.5, weight: 700, bounds: clip },
      );
    }
  }

  function drawOverlay() {
    const W = stage.width;
    const H = stage.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (overlay.width !== Math.round(W * dpr) || overlay.height !== Math.round(H * dpr)) {
      overlay.width = Math.round(W * dpr);
      overlay.height = Math.round(H * dpr);
      overlay.style.width = `${W}px`;
      overlay.style.height = `${H}px`;
    }
    const ctx = octx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const taken = [boxOf(ui.corner, 2)].filter(Boolean);
    drawRail(ctx, taken);
    const { u, a, t: tt } = s.plan;
    const gt = s.graphTau ?? s.tau;
    const shownMoment = s.show.cursor && (s.playing || phase() === 'paused');
    const vTop = Math.max(u, r.v) * s.vAxisRoom + (s.vAxisRoom > 1 ? 1 : 0);
    drawGraph(ctx, L.graph, {
      card: L.side ? { x: 0, y: 0, w: L.graph.x + L.graph.w + 4, h: H } : { x: 0, y: L.graph.y - 2, w: W, h: H - L.graph.y + 2 },
      u,
      a,
      t: tt,
      v: r.v,
      V: r.V,
      tau: gt,
      axisT: s.axisT ?? tt,
      axisV: niceAxis(vTop),
      show: {
        ...s.show,
        plan: s.show.plan && gt <= 1e-9,
        cursor: shownMoment,
        tMark: Boolean(s.tMark),
      },
      swap: s.show.area ? swapProgress() : 0,
      // live numbers with fixed decimals while it runs (steady readouts); stopped, no trailing zeros
      sText: t('lbl_s', { s: s.playing ? fixed(distanceAt(u, a, gt), 1) : fmt(distanceAt(u, a, gt), shownMoment ? 1 : 2) }),
      cursorText: {
        t: t('lbl_cursor_t', { t: s.playing ? fixed(gt, 1) : fmt(gt, 1) }),
        v: t('lbl_cursor_v', { v: s.playing ? fixed(velocityAt(u, a, gt), 1) : fmt(velocityAt(u, a, gt), 1) }),
      },
      text: {
        axisV: t('axis_v'),
        axisT: t('axis_t'),
        area: t('area'),
        u: t('lbl_u', { u: fmt(u) }),
        v: t('lbl_v', { v: fmt(r.v) }),
        V: t('lbl_V', { V: fmt(r.V) }),
        formulaV: swapProgress() > 0 || s.mode === 'quiz' ? '' : t('lbl_formula_V'),
        tMark: s.tMark?.text ?? '',
      },
      tMarkAt: s.tMark?.at,
      N,
      colors: COLORS,
      taken,
    });
  }
  stage.onAfterRender(drawOverlay);

  // ── touching the train: a tap runs or stops it, a drag moves it along the track ──
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const b = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };
  function pick(pt) {
    ndc.set((pt.x / stage.width) * 2 - 1, -(pt.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(train.hit, false).length ? 'train' : null;
  }
  /** The track position (m) under a canvas point, along the near track at mid-height of the train. */
  function trackX(pt) {
    const a0 = toScreen(0, 1.8, TRACKS.near, sp[0]);
    const a1 = toScreen(100, 1.8, TRACKS.near, sp[1]);
    const dx = a1.x - a0.x;
    const dy = a1.y - a0.y;
    return (((pt.x - a0.x) * dx + (pt.y - a0.y) * dy) / (dx * dx + dy * dy)) * 100;
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const pt = canvasPoint(e);
      if (pick(pt) !== 'train') return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      drag = { id: e.pointerId, x: pt.x, y: pt.y, moved: false, offset: trackX(pt) - train.root.position.x };
      try {
        ui.canvasHost.setPointerCapture(e.pointerId);
      } catch {}
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const pt = canvasPoint(e);
    if (drag && e.pointerId === drag.id) {
      if (!drag.moved && Math.hypot(pt.x - drag.x, pt.y - drag.y) < 8) return;
      if (!drag.moved) {
        drag.moved = true;
        coach?.objectUsed();
        emit('dragstart', {});
      }
      e.preventDefault();
      const { u, a, t: tt } = s.plan;
      showAt(timeAt(u, a, trackX(pt) - drag.offset, tt));
    } else if (e.pointerType === 'mouse' && !drag) {
      ui.canvasHost.style.cursor = pick(pt) ? (s.locked ? 'not-allowed' : 'grab') : '';
    }
  });
  const endDrag = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    try {
      ui.canvasHost.releasePointerCapture(e.pointerId);
    } catch {}
    if (d.moved) emit('dragend', { time: roundTo(s.tau, 3) });
    else if (!cancelled) toggleRun();
  };
  ui.canvasHost.addEventListener('pointerup', (e) => endDrag(e, false));
  ui.canvasHost.addEventListener('pointercancel', (e) => endDrag(e, true));

  // ── hint line (only for short nudges: sentences go in the panel) ─────────────
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
  // the wrong answer's mistake → its note (some mistakes read differently in different questions)
  const OOPS = {
    v: { no_u: 'oops_no_u', half: 'oops_half', times: 'oops_times', add: 'oops_add' },
    s: { no_half: 'oops_no_half', no_ut: 'oops_no_ut', no_sq: 'oops_no_sq', no_a: 'oops_no_a' },
    area: { final: 'oops_final', no_a: 'oops_area_no_a', triangle: 'oops_triangle', sum: 'oops_sum' },
    avg: { sum: 'oops_avg_sum', diff_half: 'oops_diff_half', diff: 'oops_diff', end_half: 'oops_end_half' },
    'zero-v': { rest: 'oops_rest', times: 'oops_zero_times', add: 'oops_add' },
    'zero-s': { rest: 'oops_rest', half: 'oops_zero_half', add: 'oops_zero_add', just_u: 'oops_just_u' },
    'brake-s': { no_2: 'oops_no_2', sign: 'oops_sign', no_a: 'oops_brake_no_a', time: 'oops_time', times: 'oops_brake_times' },
    'brake-t': { times: 'oops_t_times', minus: 'oops_minus', twice: 'oops_twice', half: 'oops_t_half' },
  };
  OOPS.mid = OOPS.avg;

  /** The right answer and three wrong ones from the usual mistakes (all different, none negative), shuffled. */
  function choicesFor(kind, plan) {
    const { right, wrong } = answers(kind, plan);
    const seen = new Set([fmt(right)]);
    const list = [right];
    const why = {};
    for (const key of shuffle(Object.keys(wrong))) {
      const w = wrong[key];
      if (list.length === 4 || !(w >= 0) || seen.has(fmt(w))) continue;
      seen.add(fmt(w));
      list.push(w);
      why[fmt(w)] = key;
    }
    return { right, choices: shuffle(list), why };
  }

  let kinds = [];
  let question = null;
  let lastPick = -1;
  let saved = null;
  function setScene(plan, { show = {}, graphTau = null, axisT = null, tMark = null } = {}) {
    s.plan = { ...plan };
    r = solve(s.plan);
    s.playing = false;
    s.endAt = 0;
    s.swapSaid = false;
    s.tau = 0;
    s.show = {
      ...ALL,
      plan: false,
      V: false,
      mid: false,
      vLabel: false,
      sLabel: false,
      ghost: false,
      ...show,
    };
    s.graphTau = graphTau;
    s.axisT = axisT;
    s.tMark = tMark;
    s.vAxisRoom = 1.25;
    s.farEnd = QUIZ_END;
    placeTrains();
    refresh();
    if (!s.userMovedCamera) flyTo(viewPose(), 0.6);
  }
  /** After an answer: show everything about this run and run it. */
  function revealRun(extra = {}) {
    s.show = { ...s.show, line: true, area: true, vLabel: true, sLabel: true, bar: true, cursor: true, ...extra };
    s.graphTau = null;
    s.tMark = null;
    s.tau = 0;
    s.tau0 = 0;
    s.since = now();
    s.playing = true;
    s.endAt = 0;
    refresh();
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        saved = { plan: { ...s.plan }, view: s.view };
        s.mode = 'quiz';
        s.playing = false;
        s.note = null;
        drag = null;
        hideHint();
        // five different kinds of question, in a random order
        kinds = shuffle(['v', pickOne(['s', 'area']), pickOne(['avg', 'mid']), pickOne(['zero-v', 'zero-s']), pickOne(['brake-s', 'brake-t'])]);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { ...ALL };
        s.graphTau = null;
        s.axisT = null;
        s.tMark = null;
        s.vAxisRoom = 1;
        s.farEnd = null;
        s.plan = saved ? saved.plan : s.plan;
        r = solve(s.plan);
        showAt(0);
        syncUI();
        if (!s.userMovedCamera) flyTo(viewPose(), 0.6);
      },
      async prepare(i, _alive, say) {
        s.locked = true;
        const kind = kinds[i % kinds.length];
        const set = kind === 'area' ? 's' : kind === 'mid' ? 'avg' : kind.startsWith('zero') ? 'zero' : kind.startsWith('brake') ? 'brake' : kind;
        const base = pickOne(QUIZ[set]);
        const plan = { ...base, t: base.t ?? stopTime(base.u, base.a) };
        const P = { u: fmt(plan.u), a: fmt(plan.a), t: fmt(plan.t), v: fmt(plan.u + plan.a * plan.t), h: fmt(plan.t / 2) };
        if (kind === 'area' || kind === 'avg' || kind === 'mid') {
          // the whole line is drawn (u, v and t can be read); the train waits at the start
          setScene(plan, {
            graphTau: plan.t,
            show: { vLabel: true, sLabel: false, cursor: false },
            tMark: kind === 'mid' ? { at: plan.t / 2, text: t('lbl_cursor_t', { t: P.h }) } : null,
          });
        } else if (set === 'brake') {
          // only the starting velocity: the time axis is long, so it does not tell when the train stops
          setScene(plan, { axisT: 10, show: { cursor: false } });
        } else {
          setScene(plan, { show: { cursor: false }, tMark: { at: plan.t, text: t('lbl_tmark', { t: P.t }) } });
        }
        say(t(`q_${kind.replace('-', '_')}`, P));
        const c = choicesFor(kind, plan);
        const unit = kind === 'brake-t' ? 'u_s' : ['s', 'area', 'zero-s', 'brake-s'].includes(kind) ? 'u_m' : 'u_ms';
        question = { kind, plan, ...c };
        lastPick = -1;
        return {
          choices: c.choices,
          expected: c.right,
          tolerance: 1e-6,
          label: (x) => `${n(x)}<small>${t(unit)}</small>`,
          meta: { kind, u: plan.u, a: plan.a, t: plan.t },
        };
      },
      reveal(qq, correct) {
        const { kind, plan, right, why } = question;
        const { u, a, t: tt } = plan;
        const sol = solve(plan);
        const vars = {
          u: fmt(u),
          a: fmt(a),
          t: fmt(tt),
          v: fmt(sol.v),
          V: fmt(sol.V),
          s: fmt(sol.s),
          ut: fmt(sol.ut),
          half: fmt(sol.half),
          two: 2,
          z: 0,
          u2: fmt(u * u),
          b: fmt(-a),
          b2: fmt(-2 * a),
          ts: fmt(tt),
        };
        const key = { v: 'why_v', s: 'why_s', area: 'why_area', avg: 'why_avg', mid: 'why_mid' }[kind] ?? `why_${kind.replace('-', '_')}`;
        let html = t(key, vars);
        const picked = lastPick >= 0 ? qq.choices[lastPick] : null;
        if (!correct && picked != null) {
          const mistake = why[fmt(picked)];
          const oops = mistake && OOPS[kind]?.[mistake];
          if (oops) html += t(oops, { x: fmt(picked) });
        }
        // and the run itself: the line, the area and the train (with the average-velocity train when it is about V)
        revealRun(kind === 'avg' || kind === 'mid' ? { V: true, mid: true, ghost: true } : {});
        void right;
        return html;
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on the train ─────────────────────────────────────────
  let coach = null;
  if (o.coach) {
    const pts = [{}, {}, {}];
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
          const x = train.root.position.x;
          return [
            toScreen(x - TRAIN_LENGTH * 0.45, 2.4, TRACKS.near + 1.45, pts[0]),
            toScreen(x - TRAIN_LENGTH * 0.25, 2.4, TRACKS.near + 1.45, pts[1]),
            toScreen(x - TRAIN_LENGTH * 0.7, 2.4, TRACKS.near + 1.45, pts[2]),
          ];
        },
        grabbable: (pt) => pick(pt) === 'train',
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
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      lastPick = Number(b.dataset.q);
      quiz.choose(lastPick);
    }
    if (b.dataset.step && s.mode !== 'quiz') step(b.dataset.step, Number(b.dataset.dir));
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'run':
        toggleRun();
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
    const k = e.key.toLowerCase();
    const learning = s.mode !== 'quiz'; // in the test the picture belongs to the question
    if ((k === ' ' || k === 'enter') && !target.closest('button')) {
      if (learning) toggleRun();
      else lockedNudge();
    } else if ((k === 'arrowright' || k === 'arrowleft') && learning) showAt(Math.round((s.tau + (k === 'arrowright' ? 0.5 : -0.5)) * 2) / 2);
    else if ((k === 'arrowup' || k === 'arrowdown') && learning) step('a', k === 'arrowup' ? 1 : -1);
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  s.tau = Math.min(s.plan.t, Math.max(0, Number(o.time) || 0));
  placeTrains();
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
     * Change any of: u (m/s), a (m/s²), t (s): the plan (made allowed: on the steps, never going backwards);
     * time (s into the run, shown stopped; 'end' or ≥ t: the end); playing (true runs from where it is, from the
     * start if it had arrived; false stops); view; animate: false jumps the camera.
     */
    async set(p0 = {}) {
      const animate = p0.animate !== false;
      if (p0.view) await setView(p0.view, { animate });
      if (p0.u != null || p0.a != null || p0.t != null) {
        s.note = null;
        setPlan({ ...s.plan, ...Object.fromEntries(['u', 'a', 't'].filter((k) => p0[k] != null).map((k) => [k, Number(p0[k])])) }, { animate });
      }
      if (p0.time != null) showAt(p0.time === 'end' ? s.plan.t : Number(p0.time) || 0);
      if (p0.playing === true && !s.playing) play();
      if (p0.playing === false) pause();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.note = null;
      s.plan = fixPlan({});
      r = solve(s.plan);
      showAt(0);
      await setView('front');
    },
    startPractice: () => quiz.start(),
    /** The picture with the graph and the labels (the 3D canvas and the overlay), cover-fitted to w×h. */
    capture({ width: w = 800, height: h = 500, background = '#ffffff' } = {}) {
      stage.render();
      drawOverlay();
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ctx = out.getContext('2d');
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
      }
      const c = stage.canvas;
      const k = Math.max(w / c.width, h / c.height);
      const dw = c.width * k;
      const dh = c.height * k;
      ctx.drawImage(c, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.drawImage(overlay, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return out.toDataURL('image/png');
    },
    exportRoot: () => world, // the railway and the two trains (the ground, the shadow catcher and the touch boxes stay out)
  };
}
