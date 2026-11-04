// Equations of motion (book pages 45–46, topic 2.7, গতির সমীকরণ), student view, as the owner's reference
// "Uniform Acceleration in One Dimension" (reference/owner-uniform-acceleration.png): a blue car on a straight road
// whose front edge is the number line from −7 m to 10 m, its position x marked by a dot on the axis. Four sliders set
// x₀ (red), u (blue), a (green) and t (grey); চালাও runs the time, থামাও pauses it, the quiet buttons go back to
// the start or one step (0.1 s) back or forward. Under the axis the three parts of x = x₀ + ut + ½at² are drawn tip
// to tail as outlined arrows (x₀ red, ut blue, ½at² green), so x is their sum. In the panel the formula, two small
// live graphs (x against t, a parabola; v against t, a straight line) growing as t runs, and under them the live
// equations with the numbers filled in: x = (½a)t² + (u)t + (x₀) and v = (a)t + (u). When the car reaches an end of
// the axis it stops, and the panel says so. Then a short tap test. Built on the shared student kit; the maths is in
// motion.js, the car in car.js, the road and its arrows in track.js, the graphs in graphs.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { fitPose } from './camera.js';
import { createCar } from './car.js';
import { createGraph } from './graphs.js';
import { createI18n } from './i18n.js';
import { AXIS, LIMITS, QUIZ, START, answers, fixValue, fixed, fmt, roundTo, runEnd, stateAt, stepTime, turnTime } from './motion.js';
import { DECK, FACE_Z, LANES, TICK_LABEL_Y, createTrack } from './track.js';

export const DEFAULTS = {
  x0: START.x0, // m
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

// one colour per quantity, as the reference: x₀ red, u blue, a green, t grey (text colours ≥ 4.5 : 1 on white)
const COLORS = { x0: '#e03131', u: '#1c6fd9', a: '#2f9e44', t: '#5c6670', x: '#1d2530', v: '#1c6fd9' };
const TEXT = { x0: '#c92a2a', u: '#1a5fbf', a: '#2b7a3a', t: '#495057' };
const CAR_SCALE = 0.78; // the 4.3 m sedan drawn 3.35 m long, so it sits on the axis like the reference's car
// the opening pose: a gentle three-quarter view (lessons 42), from the right a little, from above a little
const AZIM = 20;
const ELEV = 13;
const viewDir = (az, el) => {
  const A = THREE.MathUtils.degToRad(az);
  const E = THREE.MathUtils.degToRad(el);
  return new THREE.Vector3(Math.sin(A) * Math.cos(E), Math.sin(E), Math.cos(A) * Math.cos(E));
};
// what the camera keeps in frame: the whole axis with the car at either end, the car's roof and label, the lanes
const FRAME = new THREE.Box3(new THREE.Vector3(-9.1, DECK.bottom + 0.15, -DECK.z), new THREE.Vector3(11.7, 1.75, DECK.z + 0.1));
const SVG_STEP_BACK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 5v14"/><path d="M18 6l-8 6 8 6z" fill="currentColor"/></svg>';
const SVG_STEP_FWD =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 5v14"/><path d="M6 6l8 6-8 6z" fill="currentColor"/></svg>';
const FONT = '"Noto Sans Bengali", "Segoe UI", Roboto, Arial, sans-serif';

// the light-blue setting: a seamless floor, lightest round the road and a little deeper blue far away, whose edge
// colour is the sky's lower colour, so floor and sky meet without a line
const SKY_TOP = '#6fa8dd';
const SKY_LOW = '#a7caea';

/** A canvas texture of a radial gradient (stops: [offset, colour]), for the floor and the soft shadow under the road. */
function radialTexture(stops, n = 512) {
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  for (const [k, col] of stops) r.addColorStop(k, col);
  g.fillStyle = r;
  g.fillRect(0, 0, n, n);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

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

  const SYM = { x0: '<i>x</i><sub>0</sub>', u: '<i>u</i>', a: '<i>a</i>', t: '<i>t</i>' };
  const UNIT = { x0: 'u_m', u: 'u_ms', a: 'u_ms2', t: 'u_s' };
  const slider = (k) => {
    const L = LIMITS[k];
    return `<label class="eom-sl k-${k}"><span class="eom-sv"><b>${SYM[k]} = <span class="eom-num" data-num="${k}"></span>&nbsp;${t(UNIT[k])}</b><small>${t(`name_${k}`)}</small></span><input type="range" data-sl="${k}" min="${L.min}" max="${L.max}" step="${L.step}" aria-label="${t(`aria_${k}`)}" /></label>`;
  };
  const quiet = (act, label, icon) =>
    `<button type="button" class="pvc-quiet eom-q" data-act="${act}" aria-label="${t(label)}" title="${t(label)}">${icon}</button>`;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learnAlign: 'start',
    learn: `
          <div class="eom-sliders">${['x0', 'u', 'a', 't'].map(slider).join('')}</div>
          <div class="pvc-act-row eom-acts"><div class="pvc-act-slot"></div>${quiet('reset', 'act_reset', ICONS.reset)}${quiet('back', 'act_back', SVG_STEP_BACK)}${quiet('fwd', 'act_fwd', SVG_STEP_FWD)}</div>
          <p class="pvc-formula eom-formula">${t('formula')}</p>
          <div class="eom-graphs">
            <figure class="eom-g"><figcaption data-gh="x"></figcaption><svg class="pvc-graph" data-graph="x" role="img" aria-label="${t('graph_x')}"></svg></figure>
            <figure class="eom-g"><figcaption data-gh="v"></figcaption><svg class="pvc-graph" data-graph="v" role="img" aria-label="${t('graph_v')}"></svg></figure>
          </div>
          <div class="eom-eqs"><p class="eom-eq" data-eq="x"></p><p class="eom-eq" data-eq="v"></p></div>
          <p class="pvc-note eom-rule" aria-live="polite"></p>`,
  });
  const overlay = document.createElement('canvas');
  overlay.className = 'eom-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  ui.canvasHost.after(overlay);
  const octx = overlay.getContext('2d');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 22, near: 0.5, far: 700, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 8;
  controls.maxDistance = 90;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.enablePan = false;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // a soft light-blue sky: deeper at the top of the picture, the floor's far colour lower down
  if (o.bg !== 'transparent') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, SKY_TOP);
    grad.addColorStop(0.32, SKY_LOW);
    grad.addColorStop(1, SKY_LOW);
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 256);
    // a few soft, faint clouds high up (drawn once, never moving)
    for (const [x, y, w] of [
      [70, 22, 70],
      [210, 40, 95],
      [380, 18, 80],
      [470, 52, 60],
    ])
      for (let i = 0; i < 5; i++) {
        const cx = x + (i - 2) * w * 0.32;
        const cy = y + Math.abs(i - 2) * 3;
        const r = w * (0.42 - Math.abs(i - 2) * 0.08);
        const puff = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        puff.addColorStop(0, 'rgba(255,255,255,0.32)');
        puff.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = puff;
        g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      }
    const sky = new THREE.CanvasTexture(c);
    sky.colorSpace = THREE.SRGBColorSpace;
    scene.background = sky;
  }
  const world = new THREE.Group();
  world.name = 'UniformAcceleration';
  scene.add(world);
  // the floor (unlit, so its edge is exactly the sky's lower colour), the sun's soft shadows on it, and a soft
  // darker patch under the road so it stands on the floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    new THREE.MeshBasicMaterial({
      name: 'Floor',
      map: radialTexture([
        [0, '#e9f2fa'],
        [0.18, '#dbe9f6'],
        [0.5, '#bed8ef'],
        [1, SKY_LOW],
      ]),
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(1.2, DECK.bottom - 0.01, 0);
  const shade = new THREE.Mesh(
    new THREE.PlaneGeometry(DECK.x1 - DECK.x0 + 5, DECK.z * 2 + 4),
    new THREE.MeshBasicMaterial({
      map: radialTexture([
        [0, 'rgba(40,70,100,0.34)'],
        [0.6, 'rgba(40,70,100,0.16)'],
        [1, 'rgba(40,70,100,0)'],
      ]),
      transparent: true,
      depthWrite: false,
    }),
  );
  shade.rotation.x = -Math.PI / 2;
  shade.position.set((DECK.x0 + DECK.x1) / 2, DECK.bottom + 0.005, 0.4);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.ShadowMaterial({ opacity: 0.16 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.set(1.2, DECK.bottom + 0.01, 0);
  catcher.receiveShadow = true;
  for (const m of [floor, shade, catcher]) m.userData.noExport = true;
  if (o.bg !== 'transparent') scene.add(floor, shade, catcher);
  scene.add(new THREE.HemisphereLight(0xdcecff, 0xb7c6d4, 0.55));

  const track = createTrack({ colors: COLORS });
  const car = createCar({ color: '#3f72ad' });
  car.root.scale.setScalar(CAR_SCALE);
  const carBody = car.root.getObjectByName('Body');
  world.add(track.root, car.root);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 1024);
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.0004;
    sun.position.set(-6, 18, 12);
    sun.target.position.set(1, 0, 0);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 7, bottom: -7, near: 5, far: 45 });
    scene.add(sun, sun.target);
    car.root.traverse((m) => {
      if (m.isMesh && m.name !== 'Shadow') m.castShadow = true;
    });
  } else {
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(-6, 18, 12);
    scene.add(sun);
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    p: { x0: fixValue('x0', o.x0), u: fixValue('u', o.u), a: fixValue('a', o.a) },
    t: 0,
    playing: false,
    mode: 'explore',
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    locked: false,
    hide: {}, // labels hidden in a test question: { car, half }
    preview: true,
  };
  let st = stateAt(s.p, 0);
  const phase = () => (s.playing ? 'running' : s.t <= 1e-9 ? 'ready' : s.t >= st.tEnd - 1e-9 ? 'done' : 'paused');
  const snapshot = () => ({
    x0: s.p.x0,
    u: s.p.u,
    a: s.p.a,
    t: roundTo(st.t, 3),
    x: roundTo(st.x, 3),
    v: roundTo(st.v, 3),
    parts: { x0: roundTo(st.x0, 3), ut: roundTo(st.ut, 3), half: roundTo(st.half, 3) },
    tEnd: roundTo(st.tEnd, 3),
    end: st.end,
    playing: s.playing,
    phase: phase(),
    mode: s.mode,
    view: s.view,
  });

  // ── the panel ───────────────────────────────────────────────────────────────
  const sliders = Object.fromEntries(['x0', 'u', 'a', 't'].map((k) => [k, /** @type {HTMLInputElement} */ (ui.$(`[data-sl="${k}"]`))]));
  const nums = Object.fromEntries(['x0', 'u', 'a', 't'].map((k) => [k, ui.$(`[data-num="${k}"]`)]));
  const graphX = createGraph(ui.$('[data-graph="x"]'), { kind: 'x', num: N, color: COLORS.x, label: 'x' });
  const graphV = createGraph(ui.$('[data-graph="v"]'), { kind: 'v', num: N, color: COLORS.v, label: 'v' });
  const ghX = ui.$('[data-gh="x"]');
  const ghV = ui.$('[data-gh="v"]');
  const eqX = ui.$('[data-eq="x"]');
  const eqV = ui.$('[data-eq="v"]');
  const rule = ui.$('.eom-rule');
  const written = new Map();
  const write = (el, html) => {
    if (written.get(el) === html) return;
    written.set(el, html);
    el.innerHTML = html;
  };
  const c = (k, html) => `<span class="q-${k}">${html}</span>`;

  /** The time as the t slider shows it: one decimal on the 0.1 s steps, two when the car stopped in between. */
  const tText = (x) => (Math.abs(x * 10 - Math.round(x * 10)) < 1e-6 ? fixed(x, 1) : fixed(x, 2));
  function writePanel() {
    for (const k of ['x0', 'u', 'a']) {
      write(nums[k], N(fixed(s.p[k], 1)));
      if (document.activeElement !== sliders[k] || sliders[k].value !== String(s.p[k])) sliders[k].value = String(s.p[k]);
    }
    write(nums.t, N(tText(st.t)));
    sliders.t.value = String(roundTo(st.t, 2));
    // a slider's track filled in its colour up to the thumb
    for (const k of ['x0', 'u', 'a', 't']) {
      const L = LIMITS[k];
      const v = k === 't' ? st.t : s.p[k];
      sliders[k].style.setProperty('--fill', `${(((v - L.min) / (L.max - L.min)) * 100).toFixed(2)}%`);
    }
    write(ghX, t('g_x', { x: fixed(st.x, 2) }));
    write(ghV, t('g_v', { v: fixed(st.v, 2) }));
    const { x0, u, a } = s.p;
    write(eqX, `<i>x</i> = ${c('a', B(a / 2))}<i>t</i><sup>2</sup> + ${c('u', B(u))}<i>t</i> + ${c('x0', B(x0))}`);
    write(eqV, `<i>v</i> = ${c('a', B(a))}<i>t</i> + ${c('u', B(u))}`);
    const tt = turnTime(u, a);
    let html;
    if (st.end) html = t(st.end === 'right' ? 'rule_end_right' : 'rule_end_left', { x: AXIS[st.end === 'right' ? 'max' : 'min'] });
    else if (tt != null && tt < st.tEnd) html = t('rule_turn', { tt: fmt(tt, 2) });
    else html = t('rule_sum');
    write(rule, html);
    rule.classList.toggle('end', Boolean(st.end));
    const preview = s.mode !== 'quiz' || s.preview;
    graphX(s.p, st.t, st.tEnd, { preview, x: st.x });
    graphV(s.p, st.t, st.tEnd, { preview });
  }

  // ── the picture ─────────────────────────────────────────────────────────────
  let lastEmit = 0;
  let lastKey = '';
  function refresh() {
    st = stateAt(s.p, s.t);
    s.t = st.t;
    car.root.position.set(st.x, 0, 0);
    car.spin(st.x / CAR_SCALE, s.playing ? Math.abs(st.v) / (2 * Math.PI * 0.32 * CAR_SCALE) : 0);
    track.setDot(st.x);
    track.setParts(st);
    writePanel();
    syncAction();
    const key = `${s.p.x0}|${s.p.u}|${s.p.a}|${roundTo(st.t, 3)}|${s.playing}`;
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
      emit('end', { t: roundTo(st.t, 3), x: roundTo(st.x, 3), end: st.end });
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
  /** A new x₀, u or a: while running it goes back to the start of the new run; paused, it shows the same moment. */
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
    s.t = stepTime(s.t, dir, runEnd(s.p.x0, s.p.u, s.p.a).t);
    audio.tick();
    refresh();
  }
  function resetRun() {
    s.playing = false;
    s.t = 0;
    refresh();
  }

  // ── the action: one big button (চালাও / থামাও), its numbered badge on the car ──────────────────────────────
  const carBox = new THREE.Box3();
  let actKey = '';
  const action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_run',
    icon: ICONS.play,
    target: () => carBox.setFromObject(carBody),
    pad: 6,
    avoid: [ui.corner, ui.hint],
    pulse: Boolean(o.coach),
    onAct: () => toggle(),
  });
  function syncAction() {
    const ph = phase();
    const key = `${ph}|${s.mode}`;
    if (key === actKey) return;
    actKey = key;
    const label = { ready: 'act_run', running: 'act_pause', paused: 'act_continue', done: 'act_again' }[ph];
    action.set({ label, icon: ph === 'running' ? ICONS.pause : ICONS.play, step: ph === 'ready' ? 1 : '' });
    if (ph === 'running' || ph === 'done') action.hide('run');
    else action.show('run');
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewPose(view) {
    const w = Math.max(stage.width, 50);
    const h = Math.max(stage.height, 50);
    const fit = (dir) => fitPose({ box: FRAME, dir, camera, width: w, height: h, margin: { top: 50, bottom: 6, side: 26 } });
    if (view === '3d') return fit(viewDir(38, 26));
    // the front view looks down a little more where the frame has height to spare, as long as the axis keeps its size
    const base = fit(viewDir(AZIM, ELEV));
    const d0 = base.position.distanceTo(base.target);
    let best = base;
    for (const el of [16, 19, 22]) {
      const p = fit(viewDir(AZIM, el));
      if (p.position.distanceTo(p.target) > d0 * 1.04) break;
      best = p;
    }
    return best;
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
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  stage.onResize(() => {
    sizeOverlay();
    if (!s.userMovedCamera) flyTo(viewPose(s.view), 0);
  });

  // ── the 2D overlay: the axis numbers, the arrows' labels, the car's x, the line down from the dot ─────────────
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
  function chip(ctx, pieces, size, box, { fg, border, bg = 'rgba(255,255,255,0.94)' }) {
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
  const cornerBox = () => {
    const r = ui.corner?.getBoundingClientRect();
    const c0 = stage.canvas.getBoundingClientRect();
    return r?.width ? { left: r.left - c0.left - 4, top: r.top - c0.top - 4, right: r.right - c0.left + 4, bottom: r.bottom - c0.top + 4 } : null;
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
    const corner = cornerBox();
    if (corner) taken.push(corner);
    // pixels per metre along the axis, at the axis' middle
    const a0 = toScreen(1, TICK_LABEL_Y, FACE_Z);
    const a1 = toScreen(2, TICK_LABEL_Y, FACE_Z);
    const ppm = Math.hypot(a1.x - a0.x, a1.y - a0.y);
    // the numbers under the ticks, on the white band
    const fs = Math.max(10.5, Math.min(15, ppm * 0.5));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${fs}px ${FONT}`;
    ctx.fillStyle = '#1d2530';
    const every = ppm < 22 ? 2 : 1;
    for (let i = AXIS.min; i <= AXIS.max; i++) {
      if (every === 2 && i % 2 !== 0) continue;
      const p = toScreen(i, TICK_LABEL_Y, FACE_Z);
      if (p.behind) continue;
      ctx.fillText(N(fmt(i)), p.x, p.y);
    }
    // the axis' name past the arrowhead, if it fits
    const pn = toScreen(AXIS.max + 1.45, -0.05, FACE_Z);
    if (pn.x < W - 12) {
      ctx.textAlign = 'left';
      rich(
        ctx,
        [
          ['x', 'i'],
          [' (m)', ''],
        ],
        fs,
        pn.x - 2,
        pn.y + fs * 0.35,
        true,
      );
    }
    // the dashed line from the dot down through the three lanes to where ½at² ends (= x)
    const top = toScreen(st.x, -0.16, FACE_Z + 0.06);
    const bot = toScreen(st.x, LANES.half - 0.3, FACE_Z + 0.06);
    ctx.save();
    ctx.strokeStyle = 'rgba(20,40,110,0.75)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(bot.x, bot.y);
    ctx.stroke();
    ctx.restore();
    // the car's position over its roof
    if (!s.hide.car) {
      const p = toScreen(st.x, 1.32, 0);
      const pieces = [
        ['x', 'i'],
        [` = ${N(fixed(st.x, 1))} m${st.end ? ` · ${t('lbl_end')}` : ''}`, ''],
      ];
      const size = Math.max(11.5, Math.min(14.5, ppm * 0.48));
      const w = rich(ctx, pieces, size, 0, 0, false) + size * 0.9;
      const h = size * 1.55;
      const ring = action.ringBox();
      const y = ring ? Math.min(p.y, ring.top) : p.y;
      let box = { left: p.x - w / 2, top: y - h - 3, right: p.x + w / 2, bottom: y - 3 };
      const dx = Math.max(4 - box.left, Math.min(0, W - 30 - box.right)); // clear of the panel's tab on the right
      box = { ...box, left: box.left + dx, right: box.right + dx };
      if (!(corner && overlaps(box, corner))) {
        chip(ctx, pieces, size, box, { fg: '#16306e', border: '#3557c8' });
        taken.push(box);
      }
    }
    // the three parts' labels, each in its lane: beyond the arrow's tip, else beyond its tail, else above it
    const size = Math.max(10.5, Math.min(14, ppm * 0.42));
    const lanes = [
      {
        y: LANES.x0,
        from: 0,
        to: st.x0,
        sym: [
          ['x', 'i'],
          ['0', 'sub'],
        ],
        v: st.x0,
        fg: TEXT.x0,
        border: COLORS.x0,
      },
      { y: LANES.ut, from: st.x0, to: st.x0 + st.ut, sym: [['ut', 'i']], v: st.ut, fg: TEXT.u, border: COLORS.u },
      {
        y: LANES.half,
        from: st.x0 + st.ut,
        to: st.x0 + st.ut + st.half,
        sym: [
          ['½', ''],
          ['at', 'i'],
          ['2', 'sup'],
        ],
        v: st.half,
        fg: TEXT.a,
        border: COLORS.a,
        hidden: s.hide.half,
      },
    ];
    for (const L of lanes) {
      const value = L.hidden ? ' = ?' : ` = ${N(fixed(L.v, 1))} m`;
      const pieces = [...L.sym, [value, '']];
      const w = rich(ctx, pieces, size, 0, 0, false) + size * 0.9;
      const h = size * 1.5;
      const pa = toScreen(L.from, L.y, FACE_Z + 0.06);
      const pb = toScreen(L.to, L.y, FACE_Z + 0.06);
      const dir = Math.sign(pb.x - pa.x) || 1;
      const gap = 7;
      const at = (x, right) => (right ? { left: x, right: x + w } : { left: x - w, right: x });
      const spots = [
        { ...at(pb.x + dir * (gap + 4), dir > 0), top: pb.y - h / 2, bottom: pb.y + h / 2 },
        { ...at(pa.x - dir * gap, dir < 0), top: pa.y - h / 2, bottom: pa.y + h / 2 },
        { left: (pa.x + pb.x) / 2 - w / 2, right: (pa.x + pb.x) / 2 + w / 2, top: pa.y - h - 6, bottom: pa.y - 6 },
      ];
      const fits = (b) => b.left >= 2 && b.right <= W - 2 && b.top >= 2 && b.bottom <= H - 2 && !taken.some((q) => overlaps(b, q));
      const box = spots.find(fits);
      if (!box) continue;
      chip(ctx, pieces, size, box, { fg: L.fg, border: L.border });
      taken.push(box);
    }
  }
  stage.onAfterRender(drawOverlay);

  // ── the test ────────────────────────────────────────────────────────────────
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
    s.p = { x0: q.x0, u: q.u, a: q.a };
    s.t = time;
    s.hide = hide;
    s.preview = preview;
    refresh();
  }
  const UNITS = { x: 'u_m', v: 'u_ms', coef: 'u_ms2', turn: 'u_s', part: 'u_m' };
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
        saved = { p: { ...s.p }, t: s.t };
        s.mode = 'quiz';
        s.playing = false;
        kinds = shuffle(['x', 'v', 'coef', 'turn', 'part']);
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
        else setScene(q, { time: 0, hide: { car: kind === 'x' } });
        const P = { u: fmt(q.u), a: fmt(q.a), t: fmt(q.t), h: fmt(q.a / 2), x0: fmt(q.x0) };
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
        const br = (x) => `(${fmt(x)})`;
        const x = q.x0 + q.u * q.t + 0.5 * q.a * q.t * q.t;
        const vars = {
          r: fmt(ans.right),
          x0: br(q.x0),
          u: br(q.u),
          a: br(q.a),
          t: fmt(q.t),
          h: fmt(q.a / 2),
          x: fmt(x),
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
        if (kind === 'x' || kind === 'v') runTo(q.t);
        else if (kind === 'turn') runTo(-q.u / q.a);
        else if (kind === 'coef') runTo(Math.min(2, runEnd(q.x0, q.u, q.a).t));
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

  // ── controls, buttons, keys ─────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  for (const k of ['x0', 'u', 'a']) sliders[k].addEventListener('input', () => setParam(k, sliders[k].value));
  sliders.t.addEventListener('input', () => setTime(sliders.t.value));
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    const act = b.getAttribute('data-act');
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (act === 'q-next') quiz.next();
    if (act === 'q-again') quiz.start();
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
     * Change any of: x0 (m), u (m/s), a (ms⁻²): kept in range on 0.1 steps; t (s, kept inside the run; 'end' for
     * the end); playing (true runs, false pauses); step (1 or −1: one 0.1 s step); view; animate: false jumps.
     */
    async set(p = {}) {
      if (s.mode === 'quiz' && (p.x0 != null || p.u != null || p.a != null || p.t != null || p.playing || p.step)) return snapshot();
      const animate = p.animate !== false;
      for (const k of ['x0', 'u', 'a']) if (p[k] != null) setParam(k, p[k]);
      if (p.t != null) setTime(p.t === 'end' ? Number.POSITIVE_INFINITY : p.t);
      if (p.step) step(Math.sign(Number(p.step)) || 1);
      if (p.playing === true && !s.playing) play();
      if (p.playing === false) pause();
      if (p.view) await setView(p.view, { animate });
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.p = { x0: START.x0, u: START.u, a: START.a };
      s.t = 0;
      s.playing = false;
      refresh();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    /** The picture with its labels (the 3D canvas and the overlay), cover-fitted to w×h. */
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
      const cv = stage.canvas;
      const k = Math.max(w / cv.width, h / cv.height);
      const dw = cv.width * k;
      const dh = cv.height * k;
      ctx.drawImage(cv, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.drawImage(overlay, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return out.toDataURL('image/png');
    },
    /** For the GLB: the road with its number line and arrows, and the car where it is now. */
    exportRoot: () => world,
  };
}
