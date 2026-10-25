// Equations of motion (book pages 45–46, topic 2.7), student view. A commuter train on a straight double-track
// railway; the student sets its আদি বেগ u, ত্বরণ a and the time t with three steppers and runs it (in real time).
// The camera follows the train on a 40 m stretch of track, so the train stays big and the posts stream past
// faster and faster. Under it a trip bar (০ to the whole distance) fills in 1-second segments, and the বেগ–সময়
// গ্রাফ draws the straight line v = u + at while the area under it fills in the same 1-second strips: the area is
// the distance, and equal seconds give unequal distances. On the other track an imagined see-through train runs
// the whole time at the average velocity V = (u + v)/2 and arrives at the same place at the same moment; at the
// end the triangle above V folds into the gap below it, so the area is V × t: s = Vt = ut + ½at². The panel writes
// the equations with the student's numbers. Touching or dragging the graph or the bar shows any moment. A braking
// train (negative a) stops, it never goes backwards. Then a short test. Built on the shared student kit
// (@shared/student/…); the maths is in motion.js, the graph in graph.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createCoach } from '@shared/student/coach.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { FONT, drawGraph, placeFirst, placeLabel, swapTriangles } from './graph.js';
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
  a: 1, // ms⁻²
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
  moved: '#f2c6d6', // the triangle that folds into the gap: the same area, in the colour of V
  time: '#6741d9',
  ink: '#1d2733',
  ink2: '#4b5766',
  ink3: '#7a8594',
  grid: '#e6eaef',
  track: '#eef1f4',
};
// where the camera looks from (towards the camera from the railway): from the front a little above, so the car's
// side shows and both tracks; "rotate" starts from the front left
const elev = THREE.MathUtils.degToRad(28);
const VIEW_DIRS = {
  front: new THREE.Vector3(0, Math.sin(elev), Math.cos(elev)),
  '3d': new THREE.Vector3(-0.42, 0.45, 0.79).normalize(),
};
// m of track the picture shows: the 16 m train and the widest gap to the V-train (|a|t²/8 ≤ 18.75 m) always fit
const WINDOW = 40;
const QUIZ_BAR = 80; // m: the trip bar's scale in the test, the same for every question, so it hints nothing
const HOLD = 1; // s after arriving before the triangle folds
const SWAP = 2; // s for its two flips
const DOUBLE_TAP = 400; // ms: a second tap this soon does not undo the first
const NOTE_MS = 4200; // how long a stepper's note stays in the panel
const snap = (tau) => Math.round(tau * 10) / 10; // a moment chosen by hand: to 0.1 s

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
            <p class="eom-head">${t('headline')}</p>
            ${['v', 'V', 's', 's2', 'v2']
              .map(
                (k) =>
                  `<div class="eom-eq" data-eq="${k}"><span class="f"></span><span class="n"></span><span class="r"></span><span class="nm"></span></div>`,
              )
              .join('')}
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
  controls.maxDistance = 400;
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
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 16, bottom: -16, near: 10, far: 120 });
    const page = new THREE.Mesh(new THREE.PlaneGeometry(600, 40), new THREE.ShadowMaterial({ opacity: 0.14 }));
    page.rotation.x = -Math.PI / 2;
    page.position.set(130, GROUND + 0.005, 0);
    page.receiveShadow = true;
    page.userData.noExport = true;
    scene.add(sun, sun.target, page);
    // the sun follows the camera, so the shadows are sharp wherever the train is
    stage.onBeforeRender(() => {
      const cx = controls.target.x;
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
    barEnd: true,
  };
  const s = {
    plan: fixPlan(o),
    tau: 0, // s into the run
    playing: false,
    since: 0, // performance.now() when the run (re)started, from tau0
    tau0: 0,
    swapFrom: 0, // performance.now() when the triangle starts folding; 0 = it does not
    swapStage: 0, // 0 not folding, 1 folding, 2 folded (the panel says what it shows)
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    lastToggle: -1e9,
    note: null, // { key, vars, until }: a stepper's note in the panel
    // what the picture shows (the test hides what a question asks)
    show: { ...ALL },
    graphTau: null, // the graph drawn this far (the test can draw it all while the train waits at the start)
    axisT: null, // the test can make the time axis longer than t (so it does not give t away)
    tMark: null, // the test marks a time on the axis: { at, text }
    vAxisRoom: 1.1, // room above the line (the test leaves more, so the axis top does not give v away)
    barScale: null, // the trip bar's whole length (m): the plan's distance, or in the test a fixed one
  };
  let r = solve(s.plan); // v, V, s, … of the plan

  const canSwap = () => s.show.V && s.show.area && Math.abs(s.plan.a) > 1e-9;
  const swapProgress = () => {
    if (!s.swapFrom || s.playing || !canSwap()) return 0;
    return Math.min(1, Math.max(0, (now() - s.swapFrom) / 1000 / SWAP));
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
    const snap0 = snapshot();
    const key = `${snap0.u}|${snap0.a}|${snap0.t}|${snap0.phase}|${s.mode}|${Math.round(snap0.time * 4)}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap0);
  }

  // ── the trains, and the camera that follows them ────────────────────────────
  function placeTrains() {
    const { u, a } = s.plan;
    train.root.position.x = distanceAt(u, a, s.tau);
    ghost.root.position.x = r.V * s.tau;
    ghost.root.visible = s.show.ghost;
    stage.invalidate();
  }
  /** The middle of the two trains (tail of the last to nose of the first): the camera keeps it in the middle. */
  function followX() {
    const xt = train.root.position.x;
    const xg = s.show.ghost ? ghost.root.position.x : xt;
    return (Math.min(xt, xg) + Math.max(xt, xg)) / 2 - TRAIN_LENGTH / 2;
  }
  // just before each picture (after the run has moved the trains): the camera keeps its angle, only slides along
  stage.onBeforeRender(() => {
    const dx = followX() - controls.target.x;
    if (Math.abs(dx) < 1e-9) return;
    controls.target.x += dx;
    camera.position.x += dx;
    camera.updateMatrixWorld();
  });

  /** Run from where it is (from the start if it had arrived). */
  function play() {
    if (phase() === 'done') s.tau = 0;
    s.tau0 = s.tau;
    s.since = now();
    s.playing = true;
    s.swapFrom = 0;
    s.swapStage = 0;
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
    s.swapFrom = 0;
    s.swapStage = 0;
    s.tau = Math.min(s.plan.t, Math.max(0, tau));
    placeTrains();
    refresh();
    emitChange();
  }
  /** The triangle folds into the gap (again). */
  function replaySwap() {
    if (phase() !== 'done' || !canSwap()) return;
    s.swapFrom = now();
    s.swapStage = 0;
    stage.invalidate();
  }

  function tick() {
    let moving = false;
    if (s.playing) {
      const tau = s.tau0 + (now() - s.since) / 1000;
      if (tau >= s.plan.t) {
        s.tau = s.plan.t;
        s.playing = false;
        s.swapFrom = canSwap() ? now() + HOLD * 1000 : 0;
        s.swapStage = 0;
        if (s.mode !== 'quiz') audio.success();
        emit('arrive', { t: s.plan.t, s: r.s, v: r.v });
        refresh();
        emitChange();
      } else s.tau = tau;
      placeTrains();
      moving = true;
    }
    if (s.swapFrom && !s.playing) {
      const k = (now() - s.swapFrom) / 1000 / SWAP;
      const stage2 = k < 0 ? 0 : k < 1 ? 1 : 2;
      if (stage2 !== s.swapStage) {
        s.swapStage = stage2;
        refresh();
      }
      if (k < 1.05) moving = true;
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
  // the book's names after the results
  el.eq.v.querySelector('.nm').textContent = t('nm_v');
  el.eq.V.querySelector('.nm').textContent = t('nm_V');
  el.eq.s.querySelector('.nm').textContent = t('nm_s');
  el.eq.s.title = t('replay');
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
    if (ph === 'paused') return t('say_paused', { tau: fmt(s.tau, 2), v: fmt(velocityAt(u, a, s.tau), 2), s: fmt(distanceAt(u, a, s.tau), 2) });
    if (rest) return t('say_done_rest');
    if (a === 0) return t('say_done_zero', { u: fmt(u), t: fmt(tt), s: fmt(r.s) });
    const key = s.swapFrom && s.swapStage === 1 ? 'say_swapping' : s.swapFrom && s.swapStage === 2 ? 'say_swapped' : 'say_arrived';
    return t(key, { V: fmt(r.V), t: fmt(tt), s: fmt(r.s) });
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
    row('v', `= ${n(u)} + ${p(a)} × ${n(tt)}`, `= ${q('v', `<b>${n(r.v)}</b>`)}&nbsp;${ms}`);
    row('V', `= (${n(u)} + ${n(r.v)}) ÷ ${N(2)}`, `= ${q('V', `<b>${n(r.V)}</b>`)}&nbsp;${ms}`);
    row('s', `= ${n(r.V)} × ${n(tt)}`, `= ${q('s', `<b>${n(r.s)}</b>`)}&nbsp;${m}`);
    row('s2', `= ${n(r.ut)} + ${p(r.half)}`, `= ${q('s', `<b>${n(r.s)}</b>`)}&nbsp;${m}`);
    row('v2', `${n(r.v * r.v)} = ${n(u * u)} + ${p(2 * a * r.s)}`, `<span class="ok">${ICONS.check}</span>`);
    el.eq.s.classList.toggle('hot', s.swapFrom > 0 && s.swapStage === 1); // the sum the folding triangle shows
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
    if (res.note) {
      // a braking train: say honestly when it stops (to 0.1 s) and what time the figure takes
      const stop = stopTime(res.u, res.a);
      const about = Math.abs(stop - Math.round(stop)) > 1e-9;
      const keyOf = { cut: about ? 'say_cut_about' : 'say_cut', stops: about ? 'say_stops_about' : 'say_stops' };
      s.note = { key: keyOf[res.note] ?? `say_${res.note}`, vars: { stop: fmt(stop, 1), ts: fmt(res.t) }, until: now() + NOTE_MS };
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
  /** A new plan. During a run it goes back to the start; at the end it shows the new end; else the same moment. */
  function setPlan(plan) {
    const ph = phase();
    s.plan = fixPlan(plan);
    r = solve(s.plan);
    s.playing = false;
    s.swapFrom = 0;
    s.swapStage = 0;
    s.tau = ph === 'running' ? 0 : ph === 'done' ? s.plan.t : Math.min(s.tau, s.plan.t);
    placeTrains();
    refresh();
    emit('plan', { ...s.plan });
    emitChange();
  }

  // ── layout: the railway on top (or right), the trip bar under it, the graph under that (or left) ──
  const L = {
    rail: { x: 0, y: 0, w: 1, h: 1 },
    bar: { x: 0, y: 0, w: 1, h: 1 },
    graph: { x: 0, y: 0, w: 1, h: 1 },
    side: false,
    corner: null,
    M: { top: 19, bottom: 21, left: 4, right: 4 },
  };
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  /** Where an element of the stage is, on the canvas (px), a little bigger; null when it is not shown. */
  function boxOf(node, pad = 4) {
    if (!node || getComputedStyle(node).visibility === 'hidden') return null;
    const c = stage.canvas.getBoundingClientRect();
    const b = node.getBoundingClientRect();
    if (!b.width) return null;
    return { left: b.left - c.left - pad, right: b.right - c.left + pad, top: b.top - c.top - pad, bottom: b.bottom - c.top + pad };
  }
  /** The stretch of railway the picture shows, round the camera's x (which follows the trains). */
  const railBox = () => ({ x0: -WINDOW / 2, x1: WINDOW / 2, y0: GROUND, y1: 4.3, z0: TRACKS.far - 1.3, z1: POST_Z + 0.2 });
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
   * Splits the stage: on wide frames the graph left and the railway right; otherwise the railway on top (as tall as
   * its 40 m of track need, at most a little under half), the trip bar, and the graph under them. The split does
   * not depend on the run, so nothing changes size while the student uses the figure.
   */
  function layout() {
    const W = stage.width;
    const H = stage.height;
    L.corner = boxOf(ui.corner, 2);
    const seg = ui.corner.querySelector('.pvc-seg');
    const toggleShown = seg && getComputedStyle(seg).display !== 'none';
    const short = H < 330;
    L.M = { top: short ? 16 : 19, bottom: short ? 18 : 21, left: 4, right: 4 };
    const barH = short ? 32 : 36;
    const need = (w) => fit(railBox(), 'front', w - L.M.left - L.M.right, 1e5).bb;
    L.side = W / H >= 1.9;
    if (L.side) {
      const gw = Math.round(Math.min(W * 0.44, H * 1.35));
      L.graph = { x: 4, y: 6, w: gw, h: H - 10 };
      const x = gw + 12;
      const w = W - gw - 16;
      const top = (L.corner ? L.corner.bottom : 48) + 2;
      const bb = need(w);
      const railH = Math.round(Math.min(bb.y1 - bb.y0 + L.M.top + L.M.bottom, H - top - barH - 8));
      const y0 = top + Math.max(0, (H - top - 6 - railH - barH) / 2);
      L.rail = { x, y: y0, w, h: railH };
      L.bar = { x, y: y0 + railH, w, h: barH };
      return;
    }
    const top = toggleShown && L.corner ? L.corner.bottom : 0;
    const bb = need(W - 8);
    // the tightest phones keep a readable graph (its plot ≥ 85 px): the railway gives a little there
    const railH = Math.round(Math.min(bb.y1 - bb.y0 + L.M.top + L.M.bottom, (H - top) * (short ? 0.38 : 0.46)));
    L.rail = { x: 4, y: top, w: W - 8, h: railH };
    L.bar = { x: 4, y: top + railH, w: W - 8, h: barH };
    L.graph = { x: 4, y: top + railH + barH + 2, w: W - 8, h: H - top - railH - barH - 6 };
  }

  // ── camera: the railway fitted into its part of the picture ───────────────────
  /**
   * A camera pose (relative to the followed point) that shows the 40 m stretch as big as it fits in L.rail. The
   * picture is moved into that part of the canvas by an off-centre projection (camera.setViewOffset), so the
   * perspective stays true.
   */
  function viewPose(view = s.view) {
    layout();
    const rw = Math.max(40, L.rail.w - L.M.left - L.M.right);
    const rh = Math.max(24, L.rail.h - L.M.top - L.M.bottom);
    const { d, bb, target, back } = fit(railBox(), view, rw, rh);
    const cx = L.rail.x + L.M.left + rw / 2;
    const cy = L.rail.y + L.M.top + rh / 2;
    const shift = { x: cx - (stage.width / 2 + (bb.x0 + bb.x1) / 2), y: cy - (Math.max(stage.height, 100) / 2 + (bb.y0 + bb.y1) / 2) };
    return { rel: back.multiplyScalar(d), ty: target.y, tz: target.z, shift };
  }
  let viewShift = { x: 0, y: 0 };
  function applyShift(shift) {
    viewShift = shift;
    camera.setViewOffset(stage.width, stage.height, -shift.x, -shift.y, stage.width, stage.height);
  }
  /** Moves the camera to a pose; the x of what it looks at is always the trains' (followX). */
  function flyTo(pose, duration = 0.8) {
    const rel0 = camera.position.clone().sub(controls.target);
    const ty0 = controls.target.y;
    const tz0 = controls.target.z;
    const s0 = { ...viewShift };
    const apply = (k) => {
      controls.target.set(followX(), ty0 + (pose.ty - ty0) * k, tz0 + (pose.tz - tz0) * k);
      camera.position.copy(controls.target).add(rel0.clone().lerp(pose.rel, k));
      applyShift({ x: s0.x + (pose.shift.x - s0.x) * k, y: s0.y + (pose.shift.y - s0.y) * k });
      controls.update();
      stage.invalidate();
    };
    if (!duration) {
      tweener.cancel('camera');
      apply(1);
      return Promise.resolve(true);
    }
    return tweener.animate({ key: 'camera', duration, onUpdate: apply }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    controls.enableZoom = s.view === '3d'; // in the front view a pinch never moves the picture
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
      layout();
      applyShift(viewShift);
    } else flyTo(viewPose(), 0);
  });

  // ── the overlay: the railway's numbers, the trip bar, the graph ────────────────
  const v3 = new THREE.Vector3();
  const toScreen = (x, y, z, out = { x: 0, y: 0 }) => {
    v3.set(x, y, z).project(camera);
    out.x = (v3.x * 0.5 + 0.5) * stage.width;
    out.y = (-v3.y * 0.5 + 0.5) * stage.height;
    out.ok = v3.z < 1;
    return out;
  };
  const sp = [{}, {}, {}, {}];

  /** The posts' numbers (they stream past as the camera follows) and the V-train's name. */
  function drawRail(ctx, taken) {
    const clip = { left: L.rail.x, right: L.rail.x + L.rail.w, top: L.rail.y - 4, bottom: L.rail.y + L.rail.h + 4 };
    const P = (x, out) => toScreen(x, GROUND, POST_Z, out);
    const f0 = P(0, sp[0]);
    const f1 = P(10, sp[1]);
    const per10 = Math.hypot(f1.x - f0.x, f1.y - f0.y) || 1;
    const dir = { x: (f1.x - f0.x) / per10, y: (f1.y - f0.y) / per10 };
    // the side of the line of posts away from the tracks: the numbers go there
    const tc = toScreen(0, 0, TRACKS.near, sp[2]);
    let nx = -dir.y;
    let ny = dir.x;
    if ((tc.x - f0.x) * nx + (tc.y - f0.y) * ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const every = [10, 20, 50, 100].find((k) => (k / 10) * per10 >= 30) ?? 100;
    const fs = per10 > 60 ? 13 : 12;
    const cx = controls.target.x;
    const nums = [];
    for (let x = Math.max(0, Math.floor((cx - WINDOW) / every) * every); x <= Math.min(330, cx + WINDOW); x += every) {
      const f = P(x, sp[2]);
      if (!f.ok || f.x < clip.left + 8 || f.x > clip.right - 8) continue;
      nums.push({ x, at: { x: f.x + nx * (6 + fs * 0.62), y: f.y + ny * (6 + fs * 0.62) } });
    }
    for (const [i, k] of nums.entries()) {
      const text = i === nums.length - 1 ? `${N(k.x)} ${t('u_m')}` : N(k.x);
      placeLabel(ctx, taken, text, k.at.x, k.at.y, { align: 'center', color: COLORS.ink2, size: fs, weight: 600 });
    }
    // the V-train's name, above it (at the start too)
    if (s.show.ghost && ghost.root.visible) {
      const top = toScreen(ghost.root.position.x - TRAIN_LENGTH / 2, 4.3, TRACKS.far, sp[0]);
      const nose = toScreen(ghost.root.position.x, 4.3, TRACKS.far, sp[1]);
      placeFirst(
        ctx,
        taken,
        t('lbl_ghost'),
        [
          [top.x, top.y - 9, { align: 'center' }],
          [nose.x, top.y - 9, { align: 'right' }],
          [nose.x - (nose.x - top.x) * 2, top.y - 9, { align: 'left' }],
        ],
        { color: COLORS.avg, size: L.side || stage.height >= 330 ? 12.5 : 11.5, weight: 700, bounds: clip },
      );
    }
  }

  /** The trip bar's ends on the canvas and its scale. */
  function barGeometry() {
    const B = L.bar;
    const short = B.h < 34;
    return { x0: B.x + 10, x1: B.x + B.w - 10, y: B.y + 2, h: short ? 12 : 14, S: s.barScale ?? Math.max(r.s, 0.001), short };
  }
  /** The trip: from ০ to the whole distance, a segment per second (each second's distance written on it). */
  function drawBar(ctx, taken) {
    const { u, a } = s.plan;
    const G = barGeometry();
    const X = (m) => G.x0 + (Math.min(m, G.S) / G.S) * (G.x1 - G.x0);
    const fsz = G.short ? 10.5 : 11.5;
    ctx.fillStyle = COLORS.track;
    ctx.fillRect(G.x0, G.y, G.x1 - G.x0, G.h);
    ctx.strokeStyle = '#c3cad3';
    ctx.lineWidth = 1;
    ctx.strokeRect(G.x0 + 0.5, G.y + 0.5, G.x1 - G.x0 - 1, G.h - 1);
    const x = distanceAt(u, a, s.tau);
    const secs = Math.ceil(s.tau - 1e-9);
    for (let k = 0; k < secs; k++) {
      const xa = X(distanceAt(u, a, k));
      const xb = X(distanceAt(u, a, Math.min(k + 1, s.tau)));
      ctx.fillStyle = COLORS.strips[k % 2];
      ctx.fillRect(xa, G.y, xb - xa, G.h);
      if (k + 1 <= s.tau + 1e-9) {
        // a whole second: its distance on it, when there is room
        const text = N(fmt(distanceAt(u, a, k + 1) - distanceAt(u, a, k), 2));
        ctx.font = `700 ${fsz}px ${FONT}`;
        if (ctx.measureText(text).width + 6 < xb - xa) {
          ctx.fillStyle = COLORS.distDark;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, (xa + xb) / 2, G.y + G.h / 2 + 0.5);
        }
      }
    }
    if (s.tau > 0) {
      ctx.strokeStyle = COLORS.dist;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(G.x0 + 0.5, G.y + 0.5, X(x) - G.x0 - 1, G.h - 1);
      ctx.beginPath();
      for (let k = 1; k < secs; k++) {
        const xk = Math.round(X(distanceAt(u, a, k))) + 0.5;
        ctx.moveTo(xk, G.y);
        ctx.lineTo(xk, G.y + G.h);
      }
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
    // the nose: a mark across the bar, and how far it has gone under it
    const xn = X(x);
    ctx.fillStyle = COLORS.distDark;
    ctx.fillRect(xn - 1.25, G.y - 2, 2.5, G.h + 4);
    taken.push({ left: G.x0 - 2, right: G.x1 + 2, top: G.y - 2, bottom: G.y + G.h - 1 });
    const ly = G.y + G.h + (G.short ? 9 : 10);
    const lsz = G.short ? 11 : 12;
    if (s.tau > 0 && s.show.sLabel) {
      const text = t('lbl_s', { s: s.playing ? fixed(x, 1) : fmt(x, 2) });
      placeFirst(
        ctx,
        taken,
        text,
        [
          [xn, ly, { align: 'center' }],
          [xn - 8, ly, { align: 'right' }],
          [xn + 8, ly, { align: 'left' }],
        ],
        {
          color: COLORS.distDark,
          size: lsz,
          weight: 700,
          bounds: { left: L.bar.x, right: L.bar.x + L.bar.w, top: L.bar.y, bottom: L.bar.y + L.bar.h + 2 },
        },
      );
    }
    placeLabel(ctx, taken, N(0), G.x0, ly, { align: 'center', color: COLORS.ink3, size: lsz - 0.5, weight: 600 });
    if (s.show.barEnd)
      placeLabel(ctx, taken, t('lbl_m', { s: fmt(G.S, 2) }), G.x1, ly, { align: 'right', color: COLORS.ink3, size: lsz - 0.5, weight: 600 });
  }

  let frame = null; // the graph's plot on the canvas (for touches)
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
    const taken = L.corner ? [L.corner] : [];
    drawRail(ctx, taken);
    // the trip bar and the graph sit on white
    ctx.fillStyle = '#fff';
    if (L.side) ctx.fillRect(L.bar.x - 4, L.bar.y, L.bar.w + 8, L.bar.h);
    else ctx.fillRect(0, L.bar.y, W, H - L.bar.y);
    drawBar(ctx, taken);
    const { u, a, t: tt } = s.plan;
    const gt = s.graphTau ?? s.tau;
    const shownMoment = s.show.cursor && (s.playing || phase() === 'paused');
    const vTop = Math.max(u, r.v) * s.vAxisRoom + (s.vAxisRoom > 1.15 ? 1 : 0);
    const swap = swapProgress();
    frame = drawGraph(ctx, L.graph, {
      card: L.side ? { x: 0, y: 0, w: L.graph.x + L.graph.w + 4, h: H } : { x: 0, y: L.graph.y - 2, w: W, h: H - L.graph.y + 2 },
      u,
      a,
      t: tt,
      v: r.v,
      V: r.V,
      tau: gt,
      axisT: s.axisT ?? tt,
      axisV: niceAxis(vTop),
      show: { ...s.show, plan: s.show.plan && gt <= 1e-9, cursor: shownMoment, tMark: Boolean(s.tMark) },
      swap,
      // live numbers with fixed decimals while it runs (steady readouts); stopped, no trailing zeros
      sText: t('lbl_s', { s: s.playing ? fixed(distanceAt(u, a, gt), 1) : fmt(distanceAt(u, a, gt), 2) }),
      cursorText: {
        t: t('lbl_cursor_t', { t: s.playing ? fixed(gt, 1) : fmt(gt, 2) }),
        v: t('lbl_cursor_v', { v: s.playing ? fixed(velocityAt(u, a, gt), 1) : fmt(velocityAt(u, a, gt), 2) }),
      },
      text: {
        axisV: t('axis_v'),
        axisT: t('axis_t'),
        area: t('area'),
        u: t('lbl_u', { u: fmt(u) }),
        v: t('lbl_v', { v: fmt(r.v) }),
        V: t('lbl_V', { V: fmt(r.V) }),
        formulaV: swap > 0 || s.mode === 'quiz' ? '' : t('lbl_formula_V'),
        tMark: s.tMark?.text ?? '',
      },
      tMarkAt: s.tMark?.at,
      N,
      colors: COLORS,
      taken,
    });
  }
  stage.onAfterRender(drawOverlay);

  // ── touches: the train runs or stops; the graph and the trip bar choose a moment ──
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
  /** What a finger at this canvas point takes: 'bar', 'graph', 'train' or null (the camera's, in the turned view). */
  function target(pt) {
    const B = L.bar;
    if (pt.x >= B.x && pt.x <= B.x + B.w && pt.y >= B.y - 4 && pt.y <= B.y + B.h) return 'bar';
    if (frame && pt.x >= frame.X0 - 12 && pt.x <= frame.X1 + 12 && pt.y >= frame.Y1 - 14 && pt.y <= frame.Y0 + 22) return 'graph';
    return pick(pt);
  }
  /** The moment (s, to 0.1 s) under a finger on the graph or the bar. */
  function momentAt(kind, pt) {
    const { u, a, t: tt } = s.plan;
    if (kind === 'graph') return snap(Math.min(tt, Math.max(0, ((pt.x - frame.X0) / (frame.X1 - frame.X0)) * frame.T)));
    const G = barGeometry();
    const m = Math.min(1, Math.max(0, (pt.x - G.x0) / (G.x1 - G.x0))) * G.S;
    return snap(timeAt(u, a, m, tt));
  }
  /** Is this point of the graph in the triangle that folds, or in the gap it folds into? */
  function onTriangle(pt) {
    if (!frame || phase() !== 'done' || !canSwap()) return false;
    const tt = ((pt.x - frame.X0) / (frame.X1 - frame.X0)) * frame.T;
    const vv = ((frame.Y0 - pt.y) / (frame.Y0 - frame.Y1)) * frame.VM;
    const inside = (tri) => {
      const [[x1, y1], [x2, y2], [x3, y3]] = tri;
      const d = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
      const l1 = ((x2 - tt) * (y3 - vv) - (x3 - tt) * (y2 - vv)) / d;
      const l2 = ((x3 - tt) * (y1 - vv) - (x1 - tt) * (y3 - vv)) / d;
      return l1 >= -0.05 && l2 >= -0.05 && 1 - l1 - l2 >= -0.05;
    };
    const { piece, gap } = swapTriangles({ ...s.plan, v: r.v, V: r.V });
    return inside(piece) || inside(gap);
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const pt = canvasPoint(e);
      const kind = target(pt);
      if (!kind) return; // the camera controls take it (in the turned view)
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      drag = { id: e.pointerId, kind, x: pt.x, y: pt.y, moved: false, replay: kind === 'graph' && onTriangle(pt) };
      try {
        ui.canvasHost.setPointerCapture(e.pointerId);
      } catch {}
      if (kind === 'bar' || (kind === 'graph' && !drag.replay)) {
        coach?.objectUsed();
        showAt(momentAt(kind, pt));
      }
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const pt = canvasPoint(e);
    if (drag && e.pointerId === drag.id) {
      if (!drag.moved && Math.hypot(pt.x - drag.x, pt.y - drag.y) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        drag.replay = false;
        if (drag.kind !== 'train') emit('dragstart', { on: drag.kind });
      }
      e.preventDefault();
      if (drag.kind !== 'train') showAt(momentAt(drag.kind, pt));
    } else if (e.pointerType === 'mouse' && !drag) {
      const k = target(pt);
      ui.canvasHost.style.cursor = k ? (s.locked ? 'not-allowed' : k === 'train' ? 'pointer' : 'ew-resize') : '';
    }
  });
  const endDrag = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    try {
      ui.canvasHost.releasePointerCapture(e.pointerId);
    } catch {}
    if (cancelled) return;
    if (d.moved && d.kind !== 'train') emit('dragend', { time: roundTo(s.tau, 3) });
    else if (!d.moved && d.kind === 'train') toggleRun();
    else if (!d.moved && d.replay) replaySwap();
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
    strip: { same: 'oops_same', v1: 'oops_v1', total: 'oops_total', double: 'oops_double' },
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
  function setScene(plan, { show = {}, graphTau = null, axisT = null, tMark = null, tau = 0, barScale = QUIZ_BAR } = {}) {
    s.plan = { ...plan };
    r = solve(s.plan);
    s.playing = false;
    s.swapFrom = 0;
    s.swapStage = 0;
    s.tau = tau;
    s.show = { ...ALL, plan: false, V: false, mid: false, vLabel: false, sLabel: false, ghost: false, barEnd: false, cursor: false, ...show };
    s.graphTau = graphTau;
    s.axisT = axisT;
    s.tMark = tMark;
    s.vAxisRoom = 1.25;
    s.barScale = barScale;
    placeTrains();
    refresh();
  }
  /** After an answer: show everything about this run and run it. */
  function revealRun(extra = {}) {
    s.show = { ...s.show, line: true, area: true, vLabel: true, sLabel: true, cursor: true, ...extra };
    s.graphTau = null;
    s.tMark = null;
    s.tau = 0;
    s.tau0 = 0;
    s.since = now();
    s.playing = true;
    s.swapFrom = 0;
    s.swapStage = 0;
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
        // five different kinds of question, in a random order: one by a formula, the area under the graph, the
        // average velocity read off the graph, equal seconds with unequal distances, and no acceleration or braking
        kinds = shuffle([pickOne(['v', 's']), 'area', pickOne(['avg', 'mid']), 'strip', pickOne(['zero-s', 'brake-s', 'brake-t'])]);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { ...ALL };
        s.graphTau = null;
        s.axisT = null;
        s.tMark = null;
        s.vAxisRoom = 1.1;
        s.barScale = null;
        s.plan = saved ? saved.plan : s.plan;
        r = solve(s.plan);
        showAt(0);
        syncUI();
      },
      async prepare(i, _alive, say) {
        s.locked = true;
        const kind = kinds[i % kinds.length];
        const set = { area: 's', mid: 'avg', 'zero-s': 'zero', 'brake-s': 'brake', 'brake-t': 'brake' }[kind] ?? kind;
        const base = pickOne(QUIZ[set]);
        const plan = { ...base, t: base.t ?? stopTime(base.u, base.a) };
        const first = distanceAt(plan.u, plan.a, 1);
        const P = { u: fmt(plan.u), a: fmt(plan.a), t: fmt(plan.t), h: fmt(plan.t / 2), s1: fmt(first) };
        if (kind === 'area' || kind === 'avg' || kind === 'mid') {
          // the whole line is drawn (u, v and t are on the graph); the train waits at the start
          setScene(plan, {
            graphTau: plan.t,
            show: { vLabel: true },
            tMark: kind === 'mid' ? { at: plan.t / 2, text: t('lbl_cursor_t', { t: P.h }) } : null,
          });
        } else if (kind === 'strip') {
          // the first second has gone: its strip on the graph, its segment on the bar
          setScene(plan, { tau: 1, barScale: distanceAt(plan.u, plan.a, plan.t) });
        } else if (set === 'brake') {
          // only the starting velocity: the time axis is long, so it does not tell when the train stops
          setScene(plan, { axisT: 10 });
        } else {
          setScene(plan, { tMark: { at: plan.t, text: t('lbl_tmark', { t: P.t }) } });
        }
        say(t(`q_${kind.replace('-', '_')}`, P));
        const c = choicesFor(kind, plan);
        const unit = kind === 'brake-t' ? 'u_s' : ['s', 'area', 'strip', 'zero-s', 'brake-s'].includes(kind) ? 'u_m' : 'u_ms';
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
        const { kind, plan, why } = question;
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
          one: 1,
          u2: fmt(u * u),
          b: fmt(-a),
          b2: fmt(-2 * a),
          ts: fmt(tt),
          s1: fmt(distanceAt(u, a, 1)),
          s2: fmt(distanceAt(u, a, 2) - distanceAt(u, a, 1)),
        };
        let html = t(`why_${kind.replace('-', '_')}`, vars);
        const picked = lastPick >= 0 ? qq.choices[lastPick] : null;
        if (!correct && picked != null) {
          const mistake = why[fmt(picked)];
          const oops = mistake && OOPS[kind]?.[mistake];
          if (oops) html += t(oops, { ...vars, x: fmt(picked) });
        }
        // and the run itself: the line, the area, the bar and the train (with V, its train and the fold only when the
        // question is about the average velocity)
        revealRun(kind === 'avg' || kind === 'mid' ? { V: true, mid: true, ghost: true } : {});
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
    const target0 = /** @type {Element} */ (e.target);
    if (target0.closest('[data-eq="s"]') && s.mode !== 'quiz') replaySwap(); // the s = Vt row shows the fold again
    const b = /** @type {HTMLElement} */ (target0.closest('button'));
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
    const target0 = /** @type {Element} */ (e.target);
    if (target0.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const learning = s.mode !== 'quiz'; // in the test the picture belongs to the question
    if ((k === ' ' || k === 'enter') && !target0.closest('button')) {
      if (learning) toggleRun();
      else lockedNudge();
    } else if ((k === 'arrowright' || k === 'arrowleft') && learning) showAt(snap(Math.round((s.tau + (k === 'arrowright' ? 0.5 : -0.5)) * 2) / 2));
    else if ((k === 'arrowup' || k === 'arrowdown') && learning) step('a', k === 'arrowup' ? 1 : -1);
    else if (k === 'r' && learning) replaySwap();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  s.tau = Math.min(s.plan.t, Math.max(0, Number(o.time) || 0));
  placeTrains();
  controls.target.x = followX();
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
     * Change any of: u (m/s), a (ms⁻²), t (s): the plan (made allowed: on the steps, never going backwards);
     * time (s into the run, shown stopped; 'end' or ≥ t: the end); playing (true runs from where it is, from the
     * start if it had arrived; false stops); view; animate: false jumps the camera.
     */
    async set(p0 = {}) {
      const animate = p0.animate !== false;
      if (p0.view) await setView(p0.view, { animate });
      if (p0.u != null || p0.a != null || p0.t != null) {
        s.note = null;
        setPlan({ ...s.plan, ...Object.fromEntries(['u', 'a', 't'].filter((k) => p0[k] != null).map((k) => [k, Number(p0[k])])) });
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
    /** For the GLB: a short stretch of the railway (−25 to 60 m) with the two trains where they are now. */
    exportRoot: () => {
      const g = new THREE.Group();
      g.name = 'EquationsOfMotion';
      g.add(createRailway({ from: -25, to: 60 }).root);
      for (const tr of [train, ghost]) if (tr.root.visible) g.add(tr.root.clone());
      return g;
    },
  };
}
