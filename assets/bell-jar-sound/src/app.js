// Sound needs a medium (book page 199, topic 7.3, চিত্র ৭.১১), student view. An electric calling bell rings inside a
// glass bell jar on a pump plate: the hammer strikes the gong eight times a second, sound rings (teal compressions)
// leave the gong and cross the glass into the room, and the jar is full of air particles. One button runs the vacuum
// pump: the particles thin out, the gauge's needle falls, the rings and the bell's real sound fade; with no air left
// the hammer still strikes but nothing is heard. The same button then opens the valve: the air rushes back in and the
// sound returns. Two meters (air in the jar, sound outside), one result line, one rule growing to the book's
// sentences; a small graph on wide panels. A five-question test. Built on the shared kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { ICONS } from '@shared/student/icons.js';
import { createMaterials } from '@shared/student/materials.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import {
  BALL_W,
  BELL,
  BELL_BOX_W,
  GAUGE,
  HAMMER_SWING,
  JAR,
  JAR_TOP,
  PLATE_Y,
  PUMP,
  VALVE_X,
  apparatusMaterials,
  bellToWorld,
  createApparatus,
} from './apparatus.js';
import { backdropTexture, createSetting } from './setting.js';
import { createAir, createRings, createStrikeCue } from './waves.js';
import { createBellSound } from './bellsound.js';
import { STRIKES, airOf, hammerSwing, letIn, loudWord, loudness, needleAngle, kPaShown, percent, pressure, pumpOut, strikesBy } from './reading.js';

export const DEFAULTS = {
  air: 1,
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { ink: '#1d2733', hammer: '#a34a00', gauge: '#a61e4d' };
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 44, bottom: 10, side: 8 };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
/** A gentle three-quarter view from the front right, a little above (lessons.md 42). */
const DIR = V(0.5, 0.36, 1).normalize();
/** The box the camera frames: the jar on its plate, the gauge and valve; the pump and the battery run off the edges. */
const BOX = { min: V(-0.115, 0.075, -0.03), max: V(0.255, JAR_TOP + 0.012, 0.08) };
/** The valve question's view: a little wider, so the valve's red lever shows whole. */
const BOX_VALVE = { min: V(-0.115, 0.03, -0.03), max: V(0.33, JAR_TOP + 0.012, 0.08) };
const CLOSED = -Math.PI / 2; // the valve lever across the pipe (to the front): closed; along it: open
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'bj');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      quiet: [{ act: 'reset', label: 'act_reset', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the two meters under the button, the small note and the graph at the end
  const meters = document.createElement('div');
  meters.className = 'bj-meters';
  meters.innerHTML = `
    <div class="bj-m bj-m-air"><span class="bj-m-k">${t('m_air')}</span><span class="bj-bar"><i></i></span><span class="bj-m-v"></span></div>
    <div class="bj-m bj-m-sound"><span class="bj-m-k">${t('m_sound')}</span><span class="bj-bar"><i></i></span><span class="bj-m-v"></span></div>`;
  $('.pvc-act-row').after(meters);
  const airBar = /** @type {HTMLElement} */ (meters.querySelector('.bj-m-air i'));
  const airVal = /** @type {HTMLElement} */ (meters.querySelector('.bj-m-air .bj-m-v'));
  const soundBar = /** @type {HTMLElement} */ (meters.querySelector('.bj-m-sound i'));
  const soundVal = /** @type {HTMLElement} */ (meters.querySelector('.bj-m-sound .bj-m-v'));
  const note = document.createElement('p');
  note.className = 'bj-note';
  note.innerHTML = `<span class="bj-note-long">${t('note', { c: 330 })}</span><span class="bj-note-short">${t('note_short')}</span>`;
  const graphBox = document.createElement('figure');
  graphBox.className = 'bj-graph';
  graphBox.innerHTML = `<figcaption>${t('g_title')}</figcaption><canvas role="img" aria-label="${t('g_aria')}"></canvas>`;
  $('.pvc-rule').after(graphBox);
  graphBox.after(note);
  const graph = /** @type {HTMLCanvasElement} */ (graphBox.querySelector('canvas'));
  if (typeof ResizeObserver === 'function')
    new ResizeObserver(() => {
      lastMeters = '';
    }).observe(graph);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 30, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minAzimuthAngle = -1.1;
  controls.maxAzimuthAngle = 1.3;

  if (o.bg !== 'transparent') scene.background = backdropTexture();
  scene.add(new THREE.HemisphereLight('#e9ecff', '#5a3a28', 0.9));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.2);
  sun.position.set(0.9, 1.6, 1.1);
  sun.target.position.set(0.05, 0.1, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#d4defa', 0.7);
  fill.position.set(-1.2, 0.8, 1.4);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.004;
    sun.shadow.radius = 3;
  }
  Object.assign(sun.shadow.camera, { left: -0.45, right: 0.55, top: 0.5, bottom: -0.4, near: 0.5, far: 3.5 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.updateMatrixWorld();

  const setting = createSetting();
  scene.add(setting.root);
  const kit = createMaterials(stage.renderer);
  const mats = apparatusMaterials(kit);
  const app = createApparatus(mats, { num: N, unit: t('u_kpa'), dir: DIR });
  scene.add(app.root);
  const air = createAir();
  scene.add(air.mesh);
  const rings = createRings();
  scene.add(rings.root);
  const cue = createStrikeCue();
  scene.add(cue.root);
  // the test's jar of water (instead of air)
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(JAR.r - 0.006, JAR.r - 0.006, 0.215, 48),
    new THREE.MeshStandardMaterial({
      name: 'Water',
      color: '#2f86d6',
      emissive: '#0b4f8a',
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.5,
      roughness: 0.15,
      depthWrite: false,
    }),
  );
  const waterTop = new THREE.Mesh(
    new THREE.CircleGeometry(JAR.r - 0.006, 48),
    new THREE.MeshStandardMaterial({ name: 'WaterSurface', color: '#a5d8ff', transparent: true, opacity: 0.7, roughness: 0.1, depthWrite: false }),
  );
  waterTop.rotation.x = -Math.PI / 2;
  waterTop.position.y = 0.215 / 2 + 0.0005;
  water.add(waterTop);
  water.position.y = PLATE_Y + 0.003 + 0.215 / 2;
  water.renderOrder = 3;
  water.visible = false;
  water.userData.noExport = true;
  scene.add(water);

  // big invisible hit boxes: the gauge and valve, the pump
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitGauge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.1), hitMat);
  hitGauge.position.set((GAUGE.x + VALVE_X) / 2, 0.09, 0.03);
  const hitPump = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.2), hitMat);
  hitPump.position.set(PUMP.x, 0.11, PUMP.z);
  hitPump.rotation.y = -0.5;
  for (const h of [hitGauge, hitPump]) {
    h.userData.noExport = true;
    scene.add(h);
  }

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const bell = createBellSound(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    mode: 'explore',
    locked: false,
    f: clamp01(airOf(o.air)), // the air left in the jar
    dir: 0, // −1 pumping out, +1 letting in, 0 still
    lastDir: 0,
    stopAt: null, // set({ air, animate }) stops the pump here
    time: 0, // the bell's clock (s)
    strikes: 0,
    lever: CLOSED,
    found: { pumped: false, vacuum: false, back: false },
    userMovedCamera: false,
    show: { gauge: true, rings: true },
    water: false, // the test's water question: the jar full of water
    valveOpenShown: false, // the test's valve question: the lever drawn open
    wideView: false, // ... and its wider view
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  /** What the graph has seen: the sound's loudness at each whole percentage of air. */
  const seen = new Float32Array(101).fill(-1);

  // ── the scene from the state ────────────────────────────────────────────────
  const lightOn = new THREE.Color('#40c057');
  const lightOff = new THREE.Color('#000000');
  function syncScene() {
    app.hammer.rotation.z = HAMMER_SWING * hammerSwing(s.time);
    app.needle.rotation.z = -needleAngle(pressure(s.f));
    app.lever.rotation.y = s.valveOpenShown ? 0 : s.lever;
    mats.light.emissive.copy(s.dir < 0 ? lightOn : lightOff);
    air.update(s.water ? 0 : s.f, s.time);
    rings.update(s.time, s.water ? 1 : s.f, camera);
    cue.update(s.time, s.strikes / STRIKES, camera);
    water.visible = s.water;
    bell.setLevel(s.water ? (s.show.rings ? 1 : 0) : loudness(s.f));
  }
  /** Rings as if the bell had been ringing a while (after a jump, at the start). */
  function prefill() {
    rings.clear();
    const n = strikesBy(s.time);
    for (let k = n - (n % 2) - 16; k <= n; k += 2) rings.strike(k / STRIKES, s.water ? 1 : s.f);
  }

  stage.addTicker((dt) => {
    s.time += dt;
    if (s.dir < 0) {
      const next = pumpOut(s.f, dt);
      if (s.stopAt != null && next <= s.stopAt) {
        s.f = s.stopAt;
        stopPump();
      } else s.f = next;
      if (s.f < 0.75) s.found.pumped = true;
      if (s.f <= 0) {
        s.f = 0;
        s.found.vacuum = true;
        stopPump();
      }
    } else if (s.dir > 0) {
      const next = letIn(s.f, dt);
      if (s.stopAt != null && next >= s.stopAt) {
        s.f = s.stopAt;
        stopPump();
      } else s.f = next;
      if (s.f >= 1) {
        s.f = 1;
        if (s.found.vacuum) s.found.back = true;
        stopPump();
      }
    }
    // the valve's lever turns open while air comes in
    const want = s.dir > 0 ? 0 : CLOSED;
    s.lever += (want - s.lever) * Math.min(1, dt * 10);
    const n = strikesBy(s.time);
    if (n !== s.strikes) {
      s.strikes = n;
      if (n % 2 === 0) rings.strike(s.time, s.water ? 1 : s.f); // a ring for every other strike, so they stay apart
      bell.strike();
    }
    seen[percent(s.f)] = loudness(s.f);
    syncScene();
    refresh();
    return true;
  });

  // ── the panel ───────────────────────────────────────────────────────────────
  function plan() {
    if (s.dir < 0) return { label: 'act_stop', step: '' };
    if (s.dir > 0) return { label: 'act_close', step: '' };
    if (s.f <= 0.001) return { label: 'act_in', step: s.found.back ? '' : 2 };
    if (s.f >= 0.999) return { label: s.found.vacuum ? 'act_again' : 'act_out', step: s.found.vacuum ? '' : 1 };
    if (s.lastDir > 0) return { label: 'act_in', step: s.found.back ? '' : 2 };
    return { label: 'act_more', step: s.found.vacuum ? '' : 1 };
  }
  let lastMeters = '';
  let lastPlan = '';
  function refresh() {
    const p = percent(s.f);
    const w = loudWord(s.f);
    const v = { p, w: t(`w_${w}`) };
    if (s.dir < 0) sheet.outcome(t('out_pumping', v));
    else if (s.dir > 0) sheet.outcome(t('out_filling', v));
    else if (s.f <= 0.001) sheet.outcome(t('out_vacuum'));
    else if (s.f >= 0.999) sheet.outcome(t(s.found.back ? 'out_back' : 'out_full'));
    else sheet.outcome(t('out_paused', v));
    if (s.found.back) sheet.rule(t('rule_law'));
    else if (s.found.vacuum) sheet.rule(t('rule_vacuum'));
    else if (s.found.pumped || s.dir < 0) sheet.rule(t('rule_fading'));
    else sheet.rule(t('rule_start'));
    const key = `${p}|${w}`;
    if (key !== lastMeters) {
      lastMeters = key;
      airBar.style.width = `${p}%`;
      airVal.innerHTML = `<b>${N(p)}%</b>`;
      soundBar.style.width = `${Math.round(100 * loudness(s.f))}%`;
      soundVal.innerHTML = `<b>${t(`w_${w}`)}</b>`;
      meters.dataset.sound = w;
      drawGraph();
    }
    if (action) {
      const pl = plan();
      const pk = `${pl.label}|${pl.step}|${s.mode}`;
      if (pk !== lastPlan) {
        lastPlan = pk;
        action.set({ step: pl.step, label: pl.label, enabled: true });
        if (s.mode === 'explore' && o.coach && pl.step !== '') action.show('scene');
        else action.hide('scene');
        emitChange();
      }
    }
    syncLabels();
  }

  // ── the graph (wide panels): what the student has heard at each amount of air ──
  function drawGraph() {
    if (!graph.isConnected || graphBox.offsetParent === null) return;
    const W = graph.clientWidth;
    const H = graph.clientHeight;
    if (W < 40 || H < 40) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (graph.width !== Math.round(W * dpr)) graph.width = Math.round(W * dpr);
    if (graph.height !== Math.round(H * dpr)) graph.height = Math.round(H * dpr);
    const g = /** @type {CanvasRenderingContext2D} */ (graph.getContext('2d'));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const L = 40;
    const R = 10;
    const T = 8;
    const B = 30;
    const x = (pc) => L + ((100 - pc) / 100) * (W - L - R); // 100 % on the left, 0 on the right: as the pump goes
    const y = (v) => T + (1 - v) * (H - T - B);
    g.strokeStyle = '#ced4da';
    g.lineWidth = 1;
    g.font = '12px "Noto Sans Bengali", sans-serif';
    g.fillStyle = '#495057';
    g.textAlign = 'center';
    g.textBaseline = 'top';
    for (const pc of [100, 50, 0]) {
      g.beginPath();
      g.moveTo(x(pc), T);
      g.lineTo(x(pc), H - B);
      g.stroke();
      g.fillText(N(pc), x(pc), H - B + 3);
    }
    g.fillText(t('g_x'), (L + W - R) / 2, H - 14);
    g.strokeStyle = '#495057';
    g.beginPath();
    g.moveTo(L, T);
    g.lineTo(L, H - B);
    g.lineTo(W - R, H - B);
    g.stroke();
    // the y scale: 0 (not heard) to 1 (as loud as with a full jar)
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    for (const v of [0, 0.5, 1]) {
      g.strokeStyle = v ? '#e9ecef' : '#495057';
      g.beginPath();
      g.moveTo(L - 4, y(v));
      g.lineTo(v ? W - R : L, y(v));
      g.stroke();
      if (v !== 0.5) g.fillText(N(v), L - 6, y(v));
    }
    g.textAlign = 'center';
    g.strokeStyle = '#495057';
    if (H >= 130) {
      g.save();
      g.translate(10, (T + H - B) / 2);
      g.rotate(-Math.PI / 2);
      g.textBaseline = 'middle';
      g.fillText(t('g_y'), 0, 0);
      g.restore();
    }
    // what has been heard: teal dots
    g.fillStyle = 'rgba(12,133,153,0.75)';
    for (let pc = 0; pc <= 100; pc++)
      if (seen[pc] >= 0) {
        g.beginPath();
        g.arc(x(pc), y(seen[pc]), 2.6, 0, Math.PI * 2);
        g.fill();
      }
    // now
    const pc = percent(s.f);
    g.fillStyle = '#0b7285';
    g.strokeStyle = '#fff';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x(pc), y(loudness(s.f)), 5.5, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  const A = { x: 0, y: 0 };
  /** The screen box round a set of world points (padded). */
  function boxOf(points, pad = 4) {
    let l = Number.POSITIVE_INFINITY;
    let tp = Number.POSITIVE_INFINITY;
    let r = Number.NEGATIVE_INFINITY;
    let b = Number.NEGATIVE_INFINITY;
    for (const p of points) {
      toScreen(p, A);
      l = Math.min(l, A.x);
      r = Math.max(r, A.x);
      tp = Math.min(tp, A.y);
      b = Math.max(b, A.y);
    }
    return { left: l - pad, top: tp - pad, right: r + pad, bottom: b + pad };
  }
  const BELL_PTS = BELL_BOX_W;
  const HAMMER_LBL = BALL_W.clone().add(V(0.004, -0.016, 0));
  const BELL_LBL = bellToWorld(-BELL.w / 2, BELL.y1 - 0.012, -0.012);
  const PUMP_LBL = V(PUMP.x - 0.08, 0.2, PUMP.z + 0.03);
  /** Is a point well inside the view (px from the edges)? */
  const inView = (p, m) => {
    toScreen(p, A);
    return A.x > m && A.x < stage.width - m && A.y > m && A.y < stage.height - m;
  };
  const GAUGE_PTS = [V(GAUGE.x - GAUGE.r, GAUGE.y - GAUGE.r, GAUGE.z), V(GAUGE.x + GAUGE.r, GAUGE.y + GAUGE.r, GAUGE.z)];
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, $('.pvc-panel-toggle'), () => boxOf(BELL_PTS), () => boxOf(GAUGE_PTS), () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const LEFT = [spot(-18, 0), spot(-18, -20), spot(-18, 20), spot(-30, -36)];
  const RIGHT = [spot(18, 0), spot(18, -20), spot(18, 20), spot(26, -36)];
  const ABOVE = [spot(0, -22), spot(20, -24), spot(-20, -24), spot(0, -40)];
  const labelState = new Map();
  function wantLabels() {
    const want = new Map();
    if (s.water) return want; // the test's jar of water: the picture alone
    want.set('jar', {
      text: t('lbl_jar'),
      point: () => V(-JAR.r * 0.98, PLATE_Y + 0.12, 0.01),
      spots: [...LEFT, spot(-18, 34), spot(-18, -34)],
      color: COLORS.ink,
    });
    want.set('bell', {
      text: t('lbl_bell'),
      point: () => BELL_LBL,
      spots: [spot(-30, -16), spot(-34, 0), spot(-30, -34), ...ABOVE],
      color: COLORS.ink,
    });
    if (s.show.gauge && s.mode === 'explore')
      want.set('gauge', {
        text: t('lbl_gauge', { p: kPaShown(s.f) }),
        point: () => V(GAUGE.x + GAUGE.r * 0.7, GAUGE.y + GAUGE.r * 0.7, GAUGE.z),
        spots: [spot(16, -18), ...ABOVE, ...RIGHT, spot(10, 46)],
        color: COLORS.gauge,
      });
    // the pump: named only where enough of it shows to read
    if (inView(PUMP_LBL, 70))
      want.set('pump', { text: t('lbl_pump'), point: () => PUMP_LBL, spots: [...ABOVE, ...LEFT], color: COLORS.ink, optional: true });
    if (s.f <= 0.03 && s.mode === 'explore')
      want.set('hammer', {
        text: t('lbl_hammer'),
        point: () => HAMMER_LBL,
        spots: [spot(56, 18), spot(56, -4), spot(56, 36), spot(-80, 46), spot(30, 58)],
        color: COLORS.hammer,
      });
    if ((s.dir > 0 || plan().label === 'act_in') && s.mode === 'explore')
      want.set('valve', {
        text: t('lbl_valve'),
        point: () => V(VALVE_X + 0.03, 0.03, 0.03),
        spots: [spot(16, 12), spot(16, 28), ...RIGHT],
        color: COLORS.ink,
        optional: true,
      });
    return want;
  }
  function syncLabels() {
    const want = wantLabels();
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, optional: w.optional });
        labelState.set(id, w.text);
      } else if (labelState.get(id) !== w.text) {
        anno.setText(id, w.text);
        labelState.set(id, w.text);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const bbox = new THREE.Box3(BOX.min, BOX.max);
  const bboxValve = new THREE.Box3(BOX_VALVE.min, BOX_VALVE.max);
  const viewPose = () => fitPose({ box: s.wideView ? bboxValve : bbox, dir: DIR, camera, width: stage.width, height: stage.height, margin: MARGIN });
  function place(pose) {
    camera.position.copy(pose.position);
    controls.target.copy(pose.target);
    controls.update();
  }
  function homeView(animate = true) {
    s.userMovedCamera = false;
    syncUI();
    const pose = viewPose();
    if (!animate) {
      tweener.cancel('camera');
      place(pose);
      return Promise.resolve(true);
    }
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    return tweener.animate({
      key: 'camera',
      duration: 0.7,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, pose.position, k);
        controls.target.lerpVectors(t0, pose.target, k);
        controls.update();
      },
    }).finished;
  }
  // a drag that really turns the view (not a tap) counts as moving the camera
  let turning = false;
  controls.addEventListener('start', () => {
    turning = true;
  });
  controls.addEventListener('end', () => {
    turning = false;
  });
  controls.addEventListener('change', () => {
    if (!turning || s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    syncUI();
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) place(viewPose());
    lastMeters = '';
    refresh();
  });

  // ── the pump and the valve ──────────────────────────────────────────────────
  function stopPump() {
    if (s.dir !== 0) s.lastDir = s.dir;
    s.dir = 0;
    s.stopAt = null;
    emitChange();
  }
  function startPump(dir, stopAt = null) {
    s.dir = dir;
    s.lastDir = dir;
    s.stopAt = stopAt;
    if (dir < 0) s.found.pumped = s.found.pumped || s.f < 0.75;
    emitChange();
  }
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    bell.unlock();
    if (s.dir !== 0) return stopPump();
    const pl = plan().label;
    if (pl === 'act_in') return startPump(1);
    return startPump(-1);
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_out',
    target: () => (plan().label === 'act_in' || s.dir > 0 ? V(VALVE_X + 0.012, 0.045, 0.02) : V(GAUGE.x, GAUGE.y, GAUGE.z)),
    radius: 30,
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // taps on the gauge, the valve or the pump do the same
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  stage.canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: now() };
  });
  stage.canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = now() - down.t < 600;
    down = null;
    if (moved > 8 || !quick) return;
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObjects([hitGauge, hitPump], false).length) {
      audio.unlock();
      doAction();
    }
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

  // ── state for the book ──────────────────────────────────────────────────────
  const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
  function snapshot() {
    return {
      air: round(s.f, 3),
      airPercent: percent(s.f),
      pressure: round(pressure(s.f), 1), // kPa in the jar
      loudness: round(loudness(s.f), 2), // 0–1, outside
      sound: loudWord(s.f),
      pump: s.dir < 0 ? 'out' : s.dir > 0 ? 'in' : 'off',
      valve: s.dir > 0 ? 'open' : 'closed',
      strikesPerSecond: STRIKES,
      hammer: 'striking', // always: the bell rings throughout
      swing: round(hammerSwing(s.time), 2), // 0 on the gong, 1 fully back
      rings: rings.visibleCount(),
      particles: air.mesh.count,
      found: { ...s.found },
      next: plan().label.replace('act_', ''),
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.pump, snap.sound, snap.found, snap.mode, snap.next, snap.air <= 0, snap.air >= 1]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }
  /** Sets the air at once (no pump), the rings as if the bell had been ringing. */
  function jumpAir(f) {
    s.dir = 0;
    s.stopAt = null;
    s.f = clamp01(f);
    s.lever = CLOSED;
    if (s.f < 0.75) s.found.pumped = true;
    if (s.f <= 0) s.found.vacuum = true;
    prefill();
    syncScene();
    refresh();
    emitChange();
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="bj-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const words = (keys) => keys.map((key) => ({ key }));
  /**
   * The five questions, each read off its own scene: how the bell sounds with few air particles left; why softer at
   * half the air; the hammer with no air; the jar full of water (no rings until the answer); the valve opened.
   */
  const KINDS = ['dots', 'fade', 'hammer', 'water', 'valve'];
  const CHOICES = {
    dots: ['c_d_right', 'c_d_none', 'c_d_same', 'c_d_louder'],
    fade: ['c_fade_right', 'c_fade_weak', 'c_fade_pump', 'c_fade_cell'],
    hammer: ['c_ham_right', 'c_ham_stop', 'c_ham_glass', 'c_ham_power'],
    water: ['c_w_right', 'c_w_slow', 'c_w_air', 'c_w_vib'],
    valve: ['c_v_right', 'c_v_stop', 'c_v_faint', 'c_v_hiss'],
  };
  const NOTES = {
    dots: { c_d_none: 'mis_d_none', c_d_same: 'mis_d_same', c_d_louder: 'mis_d_louder' },
    fade: { c_fade_weak: 'mis_fade_weak', c_fade_pump: 'mis_fade_pump', c_fade_cell: 'mis_fade_cell' },
    hammer: { c_ham_stop: 'mis_ham_stop', c_ham_glass: 'mis_ham_glass', c_ham_power: 'mis_ham_power' },
    water: { c_w_slow: 'mis_w_slow', c_w_air: 'mis_w_air', c_w_vib: 'mis_w_vib' },
    valve: { c_v_stop: 'mis_v_stop', c_v_faint: 'mis_v_faint', c_v_hiss: 'mis_v_hiss' },
  };
  let learnSaved = null;
  let question = null;
  let picked = -1;
  /** A test scene: the air (or water) in the jar, the valve drawn open or not, the rings shown or not. */
  function testScene({ f, water = false, valve = false, rings: ringsOn = true }) {
    s.water = water;
    s.valveOpenShown = valve;
    s.show = { gauge: false, rings: ringsOn };
    rings.setHidden(!ringsOn);
    jumpAir(f);
  }
  function clearTestScene() {
    s.water = false;
    s.wideView = false;
    s.valveOpenShown = false;
    s.show = { gauge: true, rings: true };
    rings.setHidden(false);
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 3, feedback: 3 },
    action,
    hooks: {
      enter() {
        learnSaved = { f: s.f, found: { ...s.found } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        clearTestScene();
        s.dir = 0;
        if (learnSaved) {
          s.found = learnSaved.found;
          jumpAir(learnSaved.f);
        }
        s.userMovedCamera = false;
        place(viewPose());
        syncUI();
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        question = { kind };
        if (kind === 'dots') testScene({ f: 0.12 });
        else if (kind === 'fade') testScene({ f: 0.5 });
        else if (kind === 'hammer') testScene({ f: 0 });
        else if (kind === 'water') testScene({ f: 0, water: true, rings: false });
        else testScene({ f: 0.03, valve: true });
        const wide = kind === 'valve';
        const fly = s.userMovedCamera || wide !== s.wideView;
        s.wideView = wide;
        if (fly) await homeView(true);
        if (!alive()) return null;
        anno.update();
        return { text: t(`q_${kind}`), ...choicesOf(words(CHOICES[kind]), kind, (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const v = { cw: 1493 };
        const note = wrongKey && NOTES[k][wrongKey] ? ` ${t(NOTES[k][wrongKey], v)}` : '';
        // the answer on the picture
        if (k === 'water') {
          s.show.rings = true;
          rings.setHidden(false);
          prefill();
        } else if (k === 'valve') {
          s.valveOpenShown = false;
          s.dir = 1; // the air comes in, the sound returns
        }
        return t(`why_${k}`, v) + note;
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
    if (front) front.hidden = !s.userMovedCamera;
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  function resetAll() {
    s.found = { pumped: false, vacuum: false, back: false };
    s.lastDir = 0;
    seen.fill(-1);
    jumpAir(1);
    s.found = { pumped: false, vacuum: false, back: false };
    lastMeters = '';
    refresh();
    emitChange();
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    bell.unlock();
    if (b.dataset.view === 'front') homeView();
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'q-next') quiz.next();
    else if (b.dataset.act === 'q-again') quiz.start();
    else if (b.dataset.act === 'reset') {
      if (s.locked) lockedNudge();
      else resetAll();
    } else if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (((k === ' ' || k === 'Enter') && !onButton) || k === 'ArrowRight') doAction();
    else if (k === 'ArrowDown') jumpAir(Math.round((s.f - 0.1) * 10) / 10);
    else if (k === 'ArrowUp') {
      jumpAir(Math.round((s.f + 0.1) * 10) / 10);
      if (s.f >= 1 && s.found.vacuum) s.found.back = true;
    } else if (k === 'r' || k === 'R' || k === 'Home') resetAll();
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  place(viewPose());
  jumpAir(s.f);
  if (s.f < 1) s.found = { pumped: s.f < 0.75, vacuum: s.f <= 0, back: false };
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
  })();
  const wait = (sec) => tweener.animate({ key: 'settle', duration: sec, onUpdate: () => {} }).finished;
  async function settle() {
    for (let i = 0; i < 400 && s.dir !== 0; i++) await wait(0.05);
  }

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /**
     * air: 0–1 (or a percentage, or 'full' | 'half' | 'vacuum'); with animate the pump (or the valve) runs to it and
     * the call resolves when it gets there, else it is set at once. pump: 'out' | 'in' | 'off' starts or stops it.
     */
    async set(p = {}) {
      if (s.mode === 'quiz' && (p.air != null || p.pump != null)) quiz.stop();
      if (p.air != null) {
        const to = airOf(p.air);
        if (p.animate && Math.abs(to - s.f) > 0.001) {
          startPump(to < s.f ? -1 : 1, to);
          await settle();
        } else jumpAir(to);
        if (s.f >= 1 && s.found.vacuum) s.found.back = true;
      }
      if (p.pump === 'out' && s.f > 0) startPump(-1);
      else if (p.pump === 'in' && s.f < 1) startPump(1);
      else if (p.pump === 'off') stopPump();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      resetAll();
      s.userMovedCamera = false;
      place(viewPose());
      syncUI();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The apparatus (plate, bell jar, calling bell, gauge and valve, hose, pump, battery), in metres. */
    exportRoot() {
      return app.root;
    },
  };
}
