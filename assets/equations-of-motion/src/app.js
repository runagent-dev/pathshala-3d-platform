// Equations of motion (book pages 45–46, topic 2.7, গতির সমীকরণ), student view, in the one frame the owner chose (the
// layout of the reference "Uniform Acceleration in One Dimension", reference/owner-uniform-acceleration.png) with the
// book's content, on a deep blue background: the formula s = ut + ½at² at the top; on the left the buttons চালাও,
// থামাও, আবার শুরু and the two time steps; in the middle three long sliders u (blue), a (green), t (grey), each value
// written over its knob; on the right the s–t graph (a parabola) and the v–t graph (a straight line), each with its
// live equation under it; and along the bottom, across the whole width, the 3D strip: an orange car seen from the side on
// a road whose front is the number line from −7 m to 10 m, the car starting at 0, a dot at s, and under the axis the
// two parts ut, ½at² drawn tip to tail. The owner asked for this one-frame layout for this figure instead of the kit's
// side panel (NOTES.md, 2026-11-04); the kit's shell still gives the test, the hint and the turn-sideways card. The
// maths is in motion.js, the car in car.js, the road and its arrows in track.js, the graphs in graphs.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { fitPose } from './camera.js';
import { createCar } from './car.js';
import { createGraph } from './graphs.js';
import { createI18n } from './i18n.js';
import { AXIS, LIMITS, QUIZ, START, answers, distance, fixValue, fixed, fmt, roundTo, runEnd, stateAt, stepTime, turnTime } from './motion.js';
import { ROAD, SLOPE, createTrack } from './track.js';

export const DEFAULTS = {
  u: START.u, // m/s
  a: START.a, // ms⁻²
  t: START.t, // s (kept inside the run)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per quantity: u blue, a green, t grey, s violet, bright for the deep blue (text ≥ 4.5 : 1 on the background)
const COLORS = { u: '#6cb6ff', a: '#5fd38a', t: '#d5dbe7', s: '#b79cff' };
/** The two arrows' fills: fuller than the text colours, so they stay vivid under the light of the 3D. */
const ARROWS = { u: '#2a86ff', a: '#1fb45c' };
/** What the labels on the 3D are written in (near-white) and what their chips are filled with. */
const INK = '#f1f5ff';
const CHIP = '#0c2450';
const CAR_SCALE = 0.95; // the 4.3 m sedan drawn 4.1 m long
const CAR_Z = 0.95; // it drives in the front lane, near the number line
// the opening pose: from the side, as the reference, a little from above so the car and the road read as 3D
const AZIM = 0;
const ELEV = 9;
const viewDir = (az, el) => {
  const A = THREE.MathUtils.degToRad(az);
  const E = THREE.MathUtils.degToRad(el);
  return new THREE.Vector3(Math.sin(A) * Math.cos(E), Math.sin(E), Math.cos(A) * Math.cos(E));
};
// what the camera keeps in frame (x from, x to): the whole axis with the car at either end and the axis' name
const FRAME_X = [-9.15, 12.2];
const SVG_STEP_BACK =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14" stroke-width="2.4"/><path d="M18 6l-8 6 8 6z" class="fill"/></svg>';
const SVG_STEP_FWD =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14" stroke-width="2.4"/><path d="M6 6l8 6-8 6z" class="fill"/></svg>';
const SVG_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5l12 7.5-12 7.5z" class="fill"/></svg>';
const SVG_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke-width="3.2"/></svg>';
const FONT = '"Noto Sans Bengali", "Segoe UI", Roboto, Arial, sans-serif';
// the deep blue background (also painted under a capture)
const BG = ['#0b2a5b', '#123d7a'];

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** A number for a label or a sentence (no trailing zeros) in the language's digits. */
  const F = (x, d = 2) => N(fmt(x, d));
  /** A number in brackets for the live equations: (−০.৮). */
  const B = (x, d = 2) => `(${F(x, d)})`;

  root.classList.add('pvc', 'eom');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the frame: the kit's shell (the test, the hint, the turn-sideways card), laid out as the reference ─────────
  const ui = buildStudentShell(root, t, { layout: 'side', learnAlign: 'start', learn: '' });
  const SYM = { u: '<i>u</i>', a: '<i>a</i>', t: '<i>t</i>' };
  const UNIT = { u: 'u_ms', a: 'u_ms2', t: 'u_s' };
  const slider = (k) => {
    const L = LIMITS[k];
    return `<div class="eom-sl k-${k}"><div class="eom-track"><output class="eom-val" data-val="${k}">${SYM[k]} = <span data-num="${k}"></span>&nbsp;<small>${t(UNIT[k])}</small></output><input type="range" data-sl="${k}" min="${L.min}" max="${L.max}" step="${L.step}" aria-label="${t(`aria_${k}`)}" /></div><span class="eom-name">${t(`name_${k}`)}</span></div>`;
  };
  const button = (act, icon, label) => `<button type="button" class="eom-b" data-act="${act}">${icon}<span>${t(label)}</span></button>`;
  const stepButton = (act, icon, label, aria) =>
    `<button type="button" class="eom-step" data-act="${act}" aria-label="${t(aria)}" title="${t(aria)}">${icon}<small>${t(label)}</small></button>`;
  const frame = document.createElement('div');
  frame.className = 'eom-frame';
  frame.innerHTML = `
    <div class="eom-top"></div>
    <div class="eom-head"><p class="eom-formula">${t('formula')}</p><p class="eom-rule" aria-live="polite"></p></div>
    <div class="eom-btns">
      ${button('run', SVG_PLAY, 'act_run')}${button('pause', SVG_PAUSE, 'act_pause')}${button('reset', ICONS.reset, 'act_reset')}
      <div class="eom-steps">${stepButton('back', SVG_STEP_BACK, 'step_back', 'act_back')}${stepButton('fwd', SVG_STEP_FWD, 'step_fwd', 'act_fwd')}</div>
    </div>
    <div class="eom-sliders">${['u', 'a', 't'].map(slider).join('')}</div>
    <div class="eom-quizbox"></div>
    <div class="eom-graphs">
      <figure class="eom-g"><svg class="pvc-graph" data-graph="s" role="img" aria-label="${t('graph_s')}"></svg><figcaption class="eom-eq" data-eq="s"></figcaption></figure>
      <figure class="eom-g"><svg class="pvc-graph" data-graph="v" role="img" aria-label="${t('graph_v')}"></svg><figcaption class="eom-eq" data-eq="v"></figcaption></figure>
      <p class="eom-check" data-eq="check"></p>
    </div>
    <div class="eom-strip"></div>`;
  const shell = ui.$('.pvc-shell');
  shell.prepend(frame);
  frame.querySelector('.eom-top').append(ui.$('.pvc-tabs'), ui.corner);
  frame.querySelector('.eom-strip').append(ui.stage);
  frame.querySelector('.eom-quizbox').append(ui.quiz);

  const overlay = document.createElement('canvas');
  overlay.className = 'eom-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  ui.canvasHost.after(overlay);
  const octx = overlay.getContext('2d');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 9, near: 1, far: 900, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enabled = false; // the strip is a fixed picture, as the reference; the controls around it are the HTML
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  const world = new THREE.Group();
  world.name = 'UniformAcceleration';
  scene.add(world);
  scene.add(new THREE.HemisphereLight(0xe3f0ff, 0xb4c6d2, 0.75));

  const track = createTrack({ colors: COLORS, arrows: ARROWS });
  const car = createCar({ env: scene.environment });
  car.root.scale.setScalar(CAR_SCALE);
  world.add(track.root, car.root);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xfffaf0, 1.1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 512);
    sun.shadow.radius = 5;
    sun.shadow.blurSamples = 10;
    sun.shadow.bias = -0.0004;
    sun.position.set(-4, 14, 9);
    sun.target.position.set(1.2, 0, 0);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 5, bottom: -5, near: 4, far: 36 });
    scene.add(sun, sun.target);
    car.root.traverse((m) => {
      if (m.isMesh && !m.userData.noShadow) m.castShadow = true;
    });
  } else {
    const sun = new THREE.DirectionalLight(0xfffaf0, 0.95);
    sun.position.set(-4, 14, 9);
    scene.add(sun);
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    p: { u: fixValue('u', o.u), a: fixValue('a', o.a) },
    t: 0,
    playing: false,
    mode: 'explore',
    view: o.view === '3d' ? '3d' : 'front',
    locked: false,
    hide: {}, // labels hidden in a test question: { car, half }
    preview: true,
  };
  let st = stateAt(s.p, 0);
  const phase = () => (s.playing ? 'running' : s.t <= 1e-9 ? 'ready' : s.t >= st.tEnd - 1e-9 ? 'done' : 'paused');
  const snapshot = () => ({
    u: s.p.u,
    a: s.p.a,
    t: roundTo(st.t, 3),
    s: roundTo(st.s, 3),
    v: roundTo(st.v, 3),
    parts: { ut: roundTo(st.ut, 3), half: roundTo(st.half, 3) },
    tEnd: roundTo(st.tEnd, 3),
    end: st.end,
    playing: s.playing,
    phase: phase(),
    mode: s.mode,
    view: s.view,
  });

  // ── the controls and the graphs ─────────────────────────────────────────────
  const $ = (sel) => /** @type {HTMLElement} */ (root.querySelector(sel));
  const PARAMS = ['u', 'a'];
  const KEYS = [...PARAMS, 't'];
  const sliders = Object.fromEntries(KEYS.map((k) => [k, /** @type {HTMLInputElement} */ ($(`[data-sl="${k}"]`))]));
  const nums = Object.fromEntries(KEYS.map((k) => [k, $(`[data-num="${k}"]`)]));
  const vals = Object.fromEntries(KEYS.map((k) => [k, $(`[data-val="${k}"]`)]));
  const graphS = createGraph($('[data-graph="s"]'), { kind: 's', num: N, colors: [COLORS.s, COLORS.s], label: 's' });
  const graphV = createGraph($('[data-graph="v"]'), { kind: 'v', num: N, colors: [COLORS.u, COLORS.a], label: 'v' });
  const eqS = $('[data-eq="s"]');
  const eqV = $('[data-eq="v"]');
  const eqCheck = $('[data-eq="check"]');
  const rule = $('.eom-rule');
  const runBtn = /** @type {HTMLButtonElement} */ ($('[data-act="run"]'));
  const pauseBtn = /** @type {HTMLButtonElement} */ ($('[data-act="pause"]'));
  const written = new Map();
  const write = (el, html) => {
    if (written.get(el) === html) return;
    written.set(el, html);
    el.innerHTML = html;
  };
  const c = (k, html) => `<span class="q-${k}">${html}</span>`;

  /** The value over a slider's knob: centred on it, kept inside the slider's track. */
  const placed = new Map();
  const fills = new Map();
  function placeValue(k, frac) {
    const el = vals[k];
    const track = /** @type {HTMLElement} */ (el.parentElement);
    const tw = track.clientWidth;
    const lw = el.offsetWidth;
    const thumb = 26; // px, as in style.css
    const cx = thumb / 2 + (tw - thumb) * frac;
    const left = Math.round(Math.max(0, Math.min(tw - lw, cx - lw / 2)));
    if (placed.get(k) === left) return;
    placed.set(k, left);
    el.style.transform = `translateX(${left}px)`;
  }

  /** The time as the t slider shows it: one decimal on the 0.1 s steps, two when the car stopped in between. */
  const tText = (x) => (Math.abs(x * 10 - Math.round(x * 10)) < 1e-6 ? fixed(x, 1) : fixed(x, 2));
  let lastGraphs = 0;
  function writePanel(force = false) {
    for (const k of PARAMS) {
      write(nums[k], N(fixed(s.p[k], 1)));
      if (document.activeElement !== sliders[k] || sliders[k].value !== String(s.p[k])) sliders[k].value = String(s.p[k]);
    }
    write(nums.t, N(tText(st.t)));
    sliders.t.value = String(roundTo(st.t, 2));
    for (const k of KEYS) {
      const L = LIMITS[k];
      const v = k === 't' ? st.t : s.p[k];
      const frac = (v - L.min) / (L.max - L.min);
      placeValue(k, frac);
      const f = String(roundTo(frac, 3)); // the bright part of the track ends at the knob
      if (fills.get(k) !== f) sliders[k].style.setProperty('--f', fills.set(k, f).get(k));
    }
    // in a test question the live equations hide their numbers (they would give the answer away) until the reveal
    const numbers = s.mode !== 'quiz' || s.preview;
    const q = (k, x) => c(k, numbers ? B(x) : '(?)');
    const { u, a } = s.p;
    write(eqS, `<i>s</i> = ${q('a', a / 2)}<i>t</i><sup>2</sup> + ${q('u', u)}<i>t</i>`);
    write(eqV, `<i>v</i> = ${q('a', a)}<i>t</i> + ${q('u', u)}`);
    write(eqCheck, t('check_v2', { n: numbers ? fixed(u * u + 2 * a * st.s, 2) : '?' }));
    const tt = turnTime(u, a);
    let html;
    if (st.end) html = t(st.end === 'right' ? 'rule_end_right' : 'rule_end_left', { s: AXIS[st.end === 'right' ? 'max' : 'min'] });
    else if (tt != null && tt < st.tEnd) html = t('rule_turn', { tt: fmt(tt, 2) });
    else if (st.s < -1e-9) html = t('rule_neg');
    else html = t('rule_sum');
    write(rule, html);
    rule.classList.toggle('end', Boolean(st.end));
    const now = performance.now();
    if (force || !s.playing || now - lastGraphs > 40) {
      lastGraphs = now; // while running, the graphs are redrawn at most 25 times a second
      const preview = s.mode !== 'quiz' || s.preview;
      graphS(s.p, st.t, st.tEnd, { preview, y: st.s });
      graphV(s.p, st.t, st.tEnd, { preview });
    }
    const ph = phase();
    runBtn.disabled = ph === 'running';
    pauseBtn.disabled = ph !== 'running';
    runBtn.classList.toggle('on', ph === 'running');
  }

  // ── the picture ─────────────────────────────────────────────────────────────
  let lastEmit = 0;
  let lastKey = '';
  function refresh() {
    st = stateAt(s.p, s.t);
    s.t = st.t;
    car.root.position.set(st.s, 0, CAR_Z);
    car.spin(st.s / CAR_SCALE, s.playing ? Math.abs(st.v) / (2 * Math.PI * 0.32 * CAR_SCALE) : 0);
    track.setDot(st.s);
    track.setParts(st);
    writePanel();
    const key = `${s.p.u}|${s.p.a}|${roundTo(st.t, 3)}|${s.playing}`;
    const now = performance.now();
    if (key !== lastKey && (!s.playing || now - lastEmit > 200)) {
      lastKey = key;
      lastEmit = now;
      emit('change', snapshot());
    }
    stage.invalidate();
  }

  // running: real time; the run ends at 6 s or when the car reaches an end of the axis
  stage.addTicker((dt) => {
    if (!s.playing) return false;
    s.t = Math.min(st.tEnd, s.t + dt);
    if (s.t >= st.tEnd - 1e-9) {
      s.t = st.tEnd;
      s.playing = false;
      refresh();
      audio.contact();
      emit('end', { t: roundTo(st.t, 3), s: roundTo(st.s, 3), end: st.end });
      return true;
    }
    refresh();
    return true;
  });

  function play() {
    if (s.locked || s.mode === 'quiz') return;
    if (phase() === 'done') s.t = 0;
    s.playing = true;
    refresh();
    emit('run', { from: roundTo(s.t, 3) });
  }
  function pause() {
    if (!s.playing) return;
    s.playing = false;
    refresh();
    emit('pause', { t: roundTo(s.t, 3) });
  }
  function toggle() {
    if (s.playing) pause();
    else play();
  }
  /** A new u or a: while running it goes back to the start of the new run; paused, it shows the same moment. */
  function setParam(k, v) {
    const next = fixValue(k, v);
    if (next === s.p[k]) return;
    s.p[k] = next;
    if (s.playing) {
      s.playing = false;
      s.t = 0;
    }
    refresh();
  }
  function setTime(v) {
    s.playing = false;
    s.t = Math.max(0, Number(v) || 0);
    refresh();
  }
  function step(dir) {
    if (s.locked) return lockedNudge();
    s.playing = false;
    s.t = stepTime(s.t, dir, runEnd(s.p.u, s.p.a).t);
    audio.tick();
    refresh();
  }
  function resetRun() {
    s.playing = false;
    s.t = 0;
    refresh();
  }

  // ── camera: the strip shows the whole axis with the car at either end, the road and the two rows ───────────────
  function viewPose(view) {
    const w = Math.max(stage.width, 50);
    const h = Math.max(stage.height, 50);
    const pts = [];
    for (const x of FRAME_X) {
      pts.push(new THREE.Vector3(x, 0.12, ROAD.back - 0.2), new THREE.Vector3(x, 1.95, CAR_Z));
      pts.push(track.onSlope(x, SLOPE.rows.half - 0.42, 0));
    }
    const margin = { top: 2, bottom: 4, left: 4, right: 4 };
    if (view === '3d') return fitPose({ points: pts, dir: viewDir(28, 20), camera, width: w, height: h, margin });
    return fitPose({ points: pts, dir: viewDir(AZIM, ELEV), camera, width: w, height: h, margin });
  }
  function flyTo({ position, target }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      camera.position.copy(position);
      controls.target.copy(target);
      camera.lookAt(target);
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
        camera.lookAt(controls.target);
        controls.update();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  stage.onResize(() => {
    sizeOverlay();
    flyTo(viewPose(s.view), 0);
    placed.clear();
    writePanel(true);
  });
  // the graphs and the values over the knobs follow their boxes' sizes (the strip's own resize is the stage's)
  const top = $('.eom-top');
  const boxes = new ResizeObserver(() => {
    frame.style.setProperty('--top-w', `${Math.ceil(top.offsetWidth) + 12}px`); // the test's head starts after the tabs
    placed.clear();
    writePanel(true);
  });
  for (const el of [$('.eom-graphs'), $('.eom-sliders'), top]) boxes.observe(el);

  // ── the 2D overlay: the axis numbers, the arrows' labels, the car's s, the line down from the dot ─────────────
  const v3 = new THREE.Vector3();
  function toScreen(x, y, z) {
    v3.set(x, y, z).project(camera);
    return { x: ((v3.x + 1) / 2) * stage.width, y: ((1 - v3.y) / 2) * stage.height, behind: v3.z > 1 };
  }
  function sizeOverlay() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(stage.width * dpr);
    const h = Math.round(stage.height * dpr);
    if (overlay.width !== w || overlay.height !== h) {
      overlay.width = w;
      overlay.height = h;
    }
    return dpr;
  }
  /** Rich text: [text, kind] pieces, kind '' | 'i' (italic) | 'sub' | 'sup'. Measures or draws at (x, y) baseline. */
  function rich(ctx, pieces, size, x, y, draw) {
    let w = 0;
    for (const [text, kind] of pieces) {
      const small = kind === 'sub' || kind === 'sup';
      ctx.font = `${kind === 'i' ? 'italic ' : ''}600 ${small ? size * 0.72 : size}px ${FONT}`;
      const dy = kind === 'sub' ? size * 0.28 : kind === 'sup' ? -size * 0.38 : 0;
      if (draw) ctx.fillText(text, x + w, y + dy);
      w += ctx.measureText(text).width;
    }
    return w;
  }
  const overlaps = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
  function chip(ctx, pieces, size, box, { fg, border, bg = CHIP }) {
    ctx.fillStyle = bg;
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(box.left + 0.5, box.top + 0.5, box.right - box.left - 1, box.bottom - box.top - 1, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    rich(ctx, pieces, size, box.left + size * 0.45, box.bottom - (box.bottom - box.top - size * 0.72) / 2 - size * 0.06, true);
  }
  const sv = new THREE.Vector3();
  const stripBox = $('.eom-strip');
  let lastHorizon = '';
  /** A point on the slope (x on the axis, y down from its top edge) on the screen. */
  const slopeScreen = (x, y) => {
    track.onSlope(x, y, 0.08, sv);
    return toScreen(sv.x, sv.y, sv.z);
  };
  function drawOverlay() {
    const dpr = sizeOverlay();
    const ctx = octx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = stage.width;
    const H = stage.height;
    const taken = [];
    // the glow of the horizon behind the road (style.css) follows the road's far edge
    const horizon = `${Math.round(toScreen(0, 0, ROAD.back).y)}px`;
    if (horizon !== lastHorizon) stripBox.style.setProperty('--horizon', (lastHorizon = horizon));
    // pixels per metre along the axis, at the axis' middle
    const a0 = slopeScreen(1, SLOPE.numbers);
    const a1 = slopeScreen(2, SLOPE.numbers);
    const ppm = Math.hypot(a1.x - a0.x, a1.y - a0.y);
    // the numbers under the ticks: bold, 0 a little bigger; every other one where a metre is very short
    const fs = Math.max(11, Math.min(17, ppm * 0.42));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = INK;
    const every = ppm < 22 ? 2 : 1;
    for (let i = AXIS.min; i <= AXIS.max; i++) {
      if (every === 2 && i % 2 !== 0) continue;
      const p = slopeScreen(i, SLOPE.numbers);
      if (p.behind) continue;
      ctx.font = `700 ${i === 0 ? fs * 1.1 : fs}px ${FONT}`;
      ctx.fillText(N(fmt(i)), p.x, p.y);
    }
    // the axis' name past the arrowhead
    const pn = slopeScreen(AXIS.max + 0.95, SLOPE.numbers);
    ctx.textAlign = 'left';
    const name = [
      ['s', 'i'],
      [' (m)', ''],
    ];
    const nameW = rich(ctx, name, fs, 0, 0, false);
    ctx.fillStyle = INK;
    rich(ctx, name, fs, Math.min(pn.x, W - nameW - 3), pn.y + fs * 0.35, true);
    // the drop line: from under the car, through its dot on the axis, down past the two rows to where ½at² ends (= s)
    const pc = toScreen(st.s, 0.02, CAR_Z + 0.5);
    const pd = slopeScreen(st.s, SLOPE.axis);
    const pb = slopeScreen(st.s, SLOPE.rows.half - 0.36);
    ctx.save();
    ctx.strokeStyle = COLORS.s;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(pc.x, pc.y);
    ctx.lineTo(pd.x, pd.y);
    ctx.moveTo(pd.x, pd.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
    ctx.restore();
    // how far it has gone, over its roof
    const size = Math.max(11.5, Math.min(15, ppm * 0.36));
    if (!s.hide.car) {
      const p = toScreen(st.s, 1.32, CAR_Z);
      const pieces = [
        ['s', 'i'],
        [` = ${N(fixed(st.s, 1))} m${st.end ? ` · ${t('lbl_end')}` : ''}`, ''],
      ];
      const w = rich(ctx, pieces, size, 0, 0, false) + size * 0.9;
      const h = size * 1.55;
      let box = { left: p.x - w / 2, top: p.y - h - 2, right: p.x + w / 2, bottom: p.y - 2 };
      const dx = Math.max(3 - box.left, Math.min(0, W - 3 - box.right));
      box = { ...box, left: box.left + dx, right: box.right + dx };
      chip(ctx, pieces, size, box, { fg: COLORS.s, border: COLORS.s });
      taken.push(box);
    }
    // the two parts' labels, each in its row: beyond the arrow's tip, else beyond its tail, else above it
    const lanes = [
      { y: SLOPE.rows.ut, from: 0, to: st.ut, sym: [['ut', 'i']], v: st.ut, fg: COLORS.u, border: COLORS.u },
      {
        y: SLOPE.rows.half,
        from: st.ut,
        to: st.ut + st.half,
        sym: [
          ['½', ''],
          ['at', 'i'],
          ['2', 'sup'],
        ],
        v: st.half,
        fg: COLORS.a,
        border: COLORS.a,
        hidden: s.hide.half,
      },
    ];
    // a chip may not cover the other part's arrow (on a phone the two rows are close together)
    const bar = Math.max(4, ppm * 0.3);
    for (const L of lanes) {
      const pa = slopeScreen(L.from, L.y);
      const pb2 = slopeScreen(L.to, L.y);
      taken.push({ left: Math.min(pa.x, pb2.x), right: Math.max(pa.x, pb2.x), top: pa.y - bar, bottom: pa.y + bar });
    }
    for (const L of lanes) {
      const value = L.hidden ? ' = ?' : ` = ${N(fixed(L.v, 1))} m`;
      const pieces = [...L.sym, [value, '']];
      const w = rich(ctx, pieces, size, 0, 0, false) + size * 0.9;
      const h = size * 1.45;
      const pa = slopeScreen(L.from, L.y);
      const pb2 = slopeScreen(L.to, L.y);
      const dir = Math.sign(pb2.x - pa.x) || 1;
      const gap = 7;
      const at = (x, right) => (right ? { left: x, right: x + w } : { left: x - w, right: x });
      const spots = [
        { ...at(pb2.x + dir * (gap + 5), dir > 0), top: pb2.y - h / 2, bottom: pb2.y + h / 2 },
        { ...at(pa.x - dir * gap, dir < 0), top: pa.y - h / 2, bottom: pa.y + h / 2 },
      ];
      const inside = (b) => b.left >= 2 && b.right <= W - 2 && b.top >= 0 && b.bottom <= H;
      const free = (b) => !taken.some((q) => overlaps(b, q));
      const box = spots.find((b) => inside(b) && free(b)) ?? spots.find(inside);
      if (!box) continue;
      chip(ctx, pieces, size, box, { fg: L.fg, border: L.border });
      taken.push(box);
    }
  }
  stage.onAfterRender(drawOverlay);

  // ── the test (it takes the place of the sliders while it is open) ───────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  let saved = null;
  let kinds = [];
  let question = null;
  let lastPick = -1;
  let runToken = 0;
  /** Plays the car from its moment to `to` (s) in real time, then stops; cancelled by a newer one. */
  function runTo(to) {
    const token = ++runToken;
    const from = s.t;
    return tweener.animate({
      key: 'quiz-run',
      duration: Math.max(0.3, to - from),
      ease: ease.linear,
      onUpdate: (k) => {
        if (token !== runToken) return;
        s.t = from + (to - from) * k;
        refresh();
      },
    }).finished;
  }
  function setScene(q, { time = 0, hide = {}, preview = false } = {}) {
    runToken++;
    tweener.cancel('quiz-run');
    s.playing = false;
    s.p = { u: q.u, a: q.a };
    s.t = time;
    s.hide = hide;
    s.preview = preview;
    refresh();
  }
  const UNITS = { s: 'u_m', v: 'u_ms', coef: 'u_ms2', turn: 'u_s', part: 'u_m' };
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 2, feedback: 2 },
    hooks: {
      enter() {
        saved = { p: { ...s.p }, t: s.t };
        s.mode = 'quiz';
        s.playing = false;
        kinds = shuffle(['s', 'v', 'coef', 'turn', 'part']);
        syncUI();
      },
      leave() {
        runToken++;
        tweener.cancel('quiz-run');
        s.mode = 'explore';
        s.locked = false;
        s.hide = {};
        s.preview = true;
        if (saved) {
          s.p = saved.p;
          s.t = saved.t;
        }
        syncUI();
        refresh();
      },
      async prepare(i, _alive, say) {
        const kind = kinds[i % kinds.length];
        const q = pickOne(QUIZ[kind]);
        s.locked = true;
        if (kind === 'part') setScene(q, { time: q.t, hide: { half: true, car: true } });
        else setScene(q, { time: 0, hide: { car: kind === 's' } });
        const P = { u: fmt(q.u), a: fmt(q.a), t: fmt(q.t), h: fmt(q.a / 2) };
        // the question has subscripts and powers: written as HTML (the kit's say() writes plain text)
        say(' ');
        ui.$('.pvc-q-text').innerHTML = t(`q_${kind}`, P);
        const ans = answers(kind, q);
        question = { kind, q, ans };
        lastPick = -1;
        return {
          choices: ans.choices.map((ch) => ch.v),
          expected: ans.right,
          tolerance: 1e-6,
          label: (v) => `${N(fmt(v))}<small>${t(UNITS[kind])}</small>`,
          meta: { kind, ...q },
        };
      },
      reveal(qq, correct, picked) {
        const { kind, q, ans } = question;
        const br = (x) => fmt(x); // the strings put the brackets round these
        const vars = {
          r: fmt(ans.right),
          u: br(q.u),
          a: br(q.a),
          t: fmt(q.t),
          h: fmt(q.a / 2),
          s: fmt(distance(q.u, q.a, q.t)),
          ut: br(q.u * q.t),
          two: 2,
          z: 0,
          one: 1,
        };
        let html = t(`why_${kind}`, vars);
        const pick = picked?.index ?? lastPick;
        const wrong = !correct && pick >= 0 ? ans.choices.find((ch) => Math.abs(ch.v - qq.choices[pick]) < 1e-6) : null;
        if (wrong?.why) html += t(`oops_${wrong.why}`, { ...vars, p: fmt(wrong.v) });
        // show it: the car runs to the moment asked about (or the label shows its value)
        s.hide = {};
        s.preview = true;
        if (kind === 's' || kind === 'v') runTo(q.t);
        else if (kind === 'turn') runTo(-q.u / q.a);
        else if (kind === 'coef') runTo(Math.min(2, runEnd(q.u, q.a).t));
        else refresh();
        return html;
      },
      done() {
        s.locked = false;
      },
    },
  });
  ui.quiz.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('[data-q]');
    if (b) lastPick = Number(b.getAttribute('data-q'));
  });

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── buttons, sliders, keys ──────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    const quizOn = s.mode === 'quiz';
    for (const el of [$('.eom-btns'), $('.eom-sliders')]) el.inert = quizOn;
    ui.quiz.inert = !quizOn;
    writePanel(true);
  }
  for (const k of PARAMS) sliders[k].addEventListener('input', () => setParam(k, sliders[k].value));
  sliders.t.addEventListener('input', () => setTime(sliders.t.value));
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    const act = b.getAttribute('data-act');
    if (b instanceof HTMLElement && b.dataset.view) setView(b.dataset.view);
    if (b instanceof HTMLElement && b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b instanceof HTMLElement && b.dataset.mode === 'explore') quiz.stop();
    if (b instanceof HTMLElement && b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (act === 'q-next') quiz.next();
    if (act === 'q-again') quiz.start();
    if (act === 'run') play();
    if (act === 'pause') pause();
    if (act === 'reset') resetRun();
    if (act === 'back') step(-1);
    if (act === 'fwd') step(1);
    if (act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  // Space runs or pauses; the arrow keys step the time (a focused slider moves itself instead)
  root.addEventListener('keydown', (e) => {
    const el = /** @type {HTMLElement} */ (e.target);
    if (el.matches?.('input, textarea, select')) return;
    if (s.mode === 'quiz') return;
    if (e.key === ' ' && !el.matches?.('button')) {
      e.preventDefault();
      toggle();
      return;
    }
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!dir || el.closest?.('.pvc-tabs, .pvc-quiz')) return;
    e.preventDefault();
    step(dir);
  });

  // ── start ───────────────────────────────────────────────────────────────────
  s.t = Math.max(0, Number(o.t) || 0);
  sizeOverlay();
  refresh();
  setView(s.view, { animate: false });
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
     * Change any of: u (m/s), a (ms⁻²): kept in range on 0.1 steps; t (s, kept inside the run; 'end' for the end);
     * playing (true runs, false pauses); step (1 or −1: one 0.1 s step); view; animate: false jumps. x0 is gone since
     * 3.0.0: a host that still sends it is ignored (the car always starts at 0).
     */
    async set(p = {}) {
      if (s.mode === 'quiz' && (p.u != null || p.a != null || p.t != null || p.playing || p.step)) return snapshot();
      const animate = p.animate !== false;
      for (const k of PARAMS) if (p[k] != null) setParam(k, p[k]);
      if (p.t != null) setTime(p.t === 'end' ? Number.POSITIVE_INFINITY : p.t);
      if (p.step) step(Math.sign(Number(p.step)) || 1);
      if (p.playing === true && !s.playing) play();
      if (p.playing === false) pause();
      if (p.view) await setView(p.view, { animate });
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.p = { u: START.u, a: START.a };
      s.t = 0;
      s.playing = false;
      refresh();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    /**
     * The 3D strip with its labels (the car on the number line and the two parts), cover-fitted to w×h, on the
     * figure's deep blue background (or on `background`, a CSS colour; null keeps it transparent).
     */
    capture({ width: w = 800, height: h = 500, background = 'theme' } = {}) {
      stage.render();
      drawOverlay();
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ctx = out.getContext('2d');
      const theme = background === 'theme' || background === '#ffffff';
      if (theme) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        BG.forEach((col, i) => g.addColorStop(i / (BG.length - 1), col));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      } else if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
      }
      const cv = stage.canvas;
      const k = Math.min(w / cv.width, h / cv.height);
      const dw = cv.width * k;
      const dh = cv.height * k;
      if (theme) {
        // the glow of the horizon behind the road, as on the page
        const y = (h - dh) / 2 + (toScreen(0, 0, ROAD.back).y / stage.height) * dh;
        const g = ctx.createLinearGradient(0, y - dh * 0.3, 0, y + 1);
        g.addColorStop(0, 'rgba(116, 176, 250, 0)');
        g.addColorStop(1, 'rgba(150, 202, 255, 0.46)');
        ctx.fillStyle = g;
        ctx.fillRect(0, y - dh * 0.3, w, dh * 0.3 + 1);
      }
      ctx.drawImage(cv, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.drawImage(overlay, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return out.toDataURL('image/png');
    },
    /** For the GLB: the road with its number line and arrows, and the car where it is now. */
    exportRoot: () => world,
  };
}
