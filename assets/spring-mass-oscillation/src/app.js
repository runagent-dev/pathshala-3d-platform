// A mass on a spring (book pages 188–190, topic 7.1, চিত্র ৭.০১), student view. A closed-coil steel spring hangs from
// a retort stand with a hanger of slotted brass masses on it and a metre rule behind. The student pulls the mass down
// (a drag on it, the arrow keys, or the big action button) and lets go: it oscillates about its সাম্যাবস্থা between −a
// and +a, the coils opening and bunching, a blue velocity arrow beside it (zero at both ends, the green ±a lines say
// so). The panel shows the live x–t graph (or v, or the acceleration: a row of words), the kinetic and potential
// energy trading in two bars, one result line (T and f) and a rule that grows with what the student finds: T =
// 2π√(m/k), the same T for another a, a longer T for more mass and a shorter one for a stiffer spring. Time runs four
// times slower than real (said on the picture). Then a five-question test. Built on the shared kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { boldArrow } from './arrows.js';
import { createGraph } from './graph.js';
import { ARM_Y, DISC, HANGER, RULE, SPRING, YAW, backdropTexture, createApparatus, hangerY } from './apparatus.js';
import {
  A_MAX,
  DEFAULT_A,
  DEFAULT_K,
  DEFAULT_M,
  MASSES,
  SLOW,
  SPRINGS,
  energies,
  fixed,
  fmt,
  frequency,
  maxAmplitude,
  motion,
  omega,
  period,
  staticStretch,
} from './reading.js';

export const DEFAULTS = {
  m: DEFAULT_M,
  k: DEFAULT_K,
  graph: 'x', // 'x' | 'v' | 'acc'
  start: 'rest', // 'rest' | 'run' (for pictures)
  a: '', // the amplitude for start=run (cm)
  at: '', // seconds (real) since the release, for start=run
  hold: false, // start=run: frozen at that moment
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { v: '#1c6fd9', vText: '#1864ab', a: '#2b8a3e', aText: '#237a35', eq: '#1d2733' };
// a three-quarter view from the front right, 22° above; the stand and the rule are turned 25° toward it (YAW), the
// bench is not, so its edge runs across the picture and the rule still faces the camera
const DIR = new THREE.Vector3(Math.sin(0.66) * Math.cos(0.384), Math.sin(0.384), Math.cos(0.66) * Math.cos(0.384));
const MARGIN = { top: 16, bottom: 6, side: 10 }; // the follow window: only the spring runs under the corner buttons
const DOUBLE_TAP = 400; // ms
const LINE_Z = RULE.z + 0.0029; // the level lines lie on the rule's face plane, behind the mass
const LINE_X0 = RULE.x - RULE.w / 2;
const LINE_X1 = 0.052;
const ARROW_OUT = DISC.R + 0.014; // the velocity arrow's distance from the axis, toward the camera's right
const Y_AXIS = new THREE.Vector3(0, 1, 0);
/** A point given in the turned frame of the stand and the rule, in the world. */
const W = (x, y, z) => new THREE.Vector3(x, y, z).applyAxisAngle(Y_AXIS, YAW);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const discsFor = (m) => Math.max(1, Math.round(m / DISC.kg));
const nearest = (list, x) => list.reduce((b, v) => (Math.abs(v - x) < Math.abs(b - x) ? v : b), list[0]);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'sm');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learnAlign: 'start',
    learn: cleanSheet(t, {
      examples: { label: 'row_m', items: MASSES.map((m) => ({ id: String(m), label: `m${m}` })) },
      quiet: [{ act: 'stop', label: 'act_stop', icon: ICONS.pause }],
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
  });
  const $ = ui.$;
  // the example words carry numbers: write them here (cleanSheet looks labels up as keys)
  const word = (n, unit) => `<span class="sm-n">${N(n)}</span><span class="sm-u">&nbsp;${unit}</span>`;
  for (const b of $$(ui.learn, '[data-example]')) b.querySelector('.pvc-ex-word').innerHTML = word(fmt(Number(b.dataset.example)), 'kg');
  const sheet = bindCleanSheet(ui.learn);
  const mRow = $('.pvc-examples');
  mRow.classList.add('sm-row');
  mRow.insertAdjacentHTML('afterbegin', `<span class="sm-sym" aria-hidden="true" title="${t('row_m')}">${t('sym_m')}</span>`);
  mRow.insertAdjacentHTML(
    'afterend',
    `<div class="pvc-examples sm-row sm-krow" role="radiogroup" aria-label="${t('row_k')}"><span class="sm-sym" aria-hidden="true" title="${t('row_k')}">${t('sym_k')}</span>${SPRINGS.map(
      (k, i) =>
        `<button type="button" role="radio" aria-checked="false" tabindex="${i ? -1 : 0}" data-spring="${k}"><span class="pvc-ex-word">${word(k, 'N/m')}</span></button>`,
    ).join('')}<span class="sm-unit" aria-hidden="true">N/m</span></div>`,
  );
  mRow.insertAdjacentHTML('beforeend', '<span class="sm-unit" aria-hidden="true">kg</span>');
  // the two rows in one box: one above the other, or side by side on a phone held upright
  const rows = document.createElement('div');
  rows.className = 'sm-rows';
  mRow.before(rows);
  rows.append(mRow, $('.sm-krow'));
  const kRow = $('.sm-krow');
  const kWords = /** @type {HTMLElement[]} */ ([...kRow.querySelectorAll('[data-spring]')]);
  $('.pvc-act-row').insertAdjacentHTML(
    'afterend',
    `<div class="sm-graph">
      <div class="sm-gwords" role="radiogroup" aria-label="${t('g_words')}">${['x', 'v', 'acc']
        .map((q) => `<button type="button" role="radio" aria-checked="false" data-graph="${q}" class="c-${q}">${t(`g_${q}`)}</button>`)
        .join('')}</div>
      <canvas class="sm-canvas" role="img"></canvas>
      <p class="sm-legend">${t('g_legend')}</p>
    </div>`,
  );
  const gWords = /** @type {HTMLElement[]} */ ([...$$(ui.learn, '[data-graph]')]);
  const canvas = /** @type {HTMLCanvasElement} */ ($('.sm-canvas'));
  const gWordsAll = { time: t('g_time'), num: N, K: t('g_K'), U: t('g_U'), total: t('g_total') };
  const graph = createGraph(canvas, gWordsAll);
  // the test's graph: drawn on the picture, top left, only for the questions read off a graph
  const qBox = document.createElement('div');
  qBox.className = 'sm-qgraph';
  qBox.hidden = true;
  qBox.innerHTML = `<p class="sm-qgraph-title">${t('q_graph_title')}</p><canvas role="img" aria-label="${t('q_graph_title')}"></canvas>`;
  ui.stage.appendChild(qBox);
  const qGraph = createGraph(/** @type {HTMLCanvasElement} */ (qBox.querySelector('canvas')), gWordsAll, { bars: false });
  // the honest note: time runs slower than real (top left of the picture)
  const slowNote = document.createElement('div');
  slowNote.className = 'sm-slow';
  slowNote.textContent = t('note_slow', { n: SLOW });
  ui.stage.appendChild(slowNote);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 0.02, far: 30, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.9;
  controls.maxPolarAngle = Math.PI * 0.6;
  controls.minAzimuthAngle = -1.2;
  controls.maxAzimuthAngle = 1.4;
  if (o.bg !== 'transparent') scene.background = backdropTexture();
  scene.add(new THREE.HemisphereLight('#e8eeff', '#6b4a32', 0.9));
  const sun = new THREE.DirectionalLight('#fff3e0', 2.2);
  sun.position.set(0.9, ARM_Y + 1.2, 1.3);
  sun.target.position.set(-0.03, ARM_Y - 0.25, -0.03);
  const fill = new THREE.DirectionalLight('#cfdcff', 0.7);
  fill.position.set(-1.2, ARM_Y + 0.4, 1.0);
  scene.add(sun, sun.target, fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.002;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -0.35, right: 0.35, top: 0.4, bottom: -0.4, near: 0.5, far: 4 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();

  const M = createMaterials(stage.renderer);
  const app = createApparatus(M, N);
  scene.add(app.root);

  // the level lines on the rule's plane: সাম্যাবস্থা (dark, dashed), +a and −a (green)
  const lineMat = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const lineGeo = new THREE.BoxGeometry(1, 0.0016, 0.0008);
  const DASHES = 14;
  const eqLine = new THREE.InstancedMesh(lineGeo, lineMat(COLORS.eq), DASHES);
  eqLine.name = 'EquilibriumLine';
  const topLine = new THREE.Mesh(lineGeo, lineMat(COLORS.a));
  const botLine = new THREE.Mesh(lineGeo, lineMat(COLORS.a));
  for (const l of [eqLine, topLine, botLine]) l.userData.noExport = true;
  {
    const m4 = new THREE.Matrix4();
    const len = LINE_X1 - LINE_X0;
    const d = len / DASHES;
    for (let i = 0; i < DASHES; i++) eqLine.setMatrixAt(i, m4.compose(V(LINE_X0 + d * (i + 0.3), 0, 0), new THREE.Quaternion(), V(d * 0.6, 1, 1)));
    for (const l of [topLine, botLine]) {
      l.scale.x = len;
      l.position.x = (LINE_X0 + LINE_X1) / 2;
    }
  }
  // the amplitude: a green bar from the সাম্যাবস্থা down to −a, just left of the rule
  const aBar = new THREE.Mesh(new THREE.BoxGeometry(0.0018, 1, 0.0008), lineMat(COLORS.a));
  aBar.position.set(LINE_X0 - 0.003, 0, 0);
  aBar.userData.noExport = true;
  eqLine.position.z = LINE_Z;
  topLine.position.z = LINE_Z;
  botLine.position.z = LINE_Z;
  aBar.position.z = LINE_Z;
  const levels = new THREE.Group();
  levels.name = 'Levels';
  levels.rotation.y = YAW;
  levels.userData.noExport = true;
  levels.add(eqLine, topLine, botLine, aBar);
  scene.add(levels);
  const vArrow = boldArrow('Velocity', COLORS.v, 0.0016);
  scene.add(vArrow.root);

  const tweener = createTweener();
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    m: nearest(MASSES, Number(o.m) || DEFAULT_M),
    k: nearest(SPRINGS, Number(o.k) || DEFAULT_K),
    graph: ['x', 'v', 'acc'].includes(o.graph) ? o.graph : 'x',
    state: 'rest', // 'rest' | 'held' | 'run'
    x: 0, // displacement from equilibrium (m, up positive), while held
    a: 0, // the run's amplitude (m)
    phase0: 0, // the run's phase at the release (0: let go below, π: let go above)
    tau: 0, // seconds (real) since the release
    frozen: false, // a run stopped at one instant (test, pictures)
    x0: 0, // the static stretch the picture shows now (eases when m or k change)
    discs: 1,
    run: 0, // token for cancellable sequences
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    runs: /** @type {{ m: number, k: number, a: number }[]} */ ([]),
    found: { amp: false, mk: false },
    show: { arrow: true, ends: true, labels: true },
    qgraph: /** @type {object | null} */ (null), // the test's graph on the picture
  };
  s.x0 = staticStretch(s.m, s.k);
  s.discs = discsFor(s.m);
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  const w = () => omega(s.m, s.k);
  const amax = () => maxAmplitude(s.m, s.k);
  /** The motion now: displacement, velocity, acceleration. */
  const out = { x: 0, v: 0, acc: 0 };
  function current() {
    if (s.state === 'run') {
      const ww = w();
      const p = motion(s.a, ww, s.tau + s.phase0 / ww);
      out.x = p.x;
      out.v = p.v;
      out.acc = p.acc;
    } else {
      out.x = s.state === 'held' ? s.x : 0;
      out.v = 0;
      out.acc = s.state === 'held' ? -w() * w() * s.x : 0;
    }
    return out;
  }
  /** The pointer's height at equilibrium (world y), for the picture's current stretch. */
  const eqY = () => hangerY(SPRING.L0 + s.x0) + HANGER.plateTop - HANGER.plateH / 2;
  /** The middle of the discs (world), from the hanger's height (never from a matrix that may be a frame old). */
  const massCentre = (outV) => outV.set(0, app.hanger.root.position.y + HANGER.plateTop + (s.discs * (DISC.h + DISC.gap)) / 2, 0);
  const amplitudeShown = () => (s.state === 'run' ? s.a : s.state === 'held' ? Math.abs(s.x) : 0);

  // ── the scene from the state ────────────────────────────────────────────────
  const tmpV = new THREE.Vector3();
  const camRight = new THREE.Vector3();
  let framed = '';
  let cameraFlying = false;
  const UP = V(0, 1, 0);
  const DOWN = V(0, -1, 0);
  function syncScene() {
    const p = current();
    const Lb = Math.max(SPRING.solid + 0.002, SPRING.L0 + s.x0 - p.x);
    app.set({ Lb, discs: s.discs });
    const y0 = eqY();
    eqLine.position.y = y0;
    const a = amplitudeShown();
    const ends = s.show.ends && a > 0.0015;
    topLine.visible = ends && s.state === 'run';
    botLine.visible = ends;
    topLine.position.y = y0 + a;
    botLine.position.y = y0 - a;
    if (s.state === 'held' && s.x > 0) botLine.position.y = y0 + a; // pushed up: the line where it is
    aBar.visible = ends && s.state === 'run';
    aBar.scale.y = Math.max(0.001, a);
    aBar.position.y = y0 - a / 2;
    if (!s.userMovedCamera && !cameraFlying && framed !== `${s.x0}|${stage.width}|${stage.height}`) frameNow();
    // the velocity arrow beside the mass (on the camera's right), its length in proportion to v within a run: at the
    // fastest it is 4 cm + 0.35 a long on the picture (about 45–65 px on a phone), so a bigger pull shows a longer one
    const len = s.a > 0 ? (Math.abs(p.v) / (w() * s.a)) * (0.04 + 0.35 * s.a) : 0;
    const show = s.show.arrow && s.state === 'run' && len > 0.005;
    if (show) {
      massCentre(tmpV);
      camRight.setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
      tmpV.addScaledVector(camRight, ARROW_OUT);
      tmpV.y -= (Math.sign(p.v) * len) / 2;
      vArrow.set(tmpV, p.v > 0 ? UP : DOWN, len);
    } else vArrow.hide();
    // the velocity label shows only with its arrow (near the ends there is nothing to name)
    if (vArrow.visible !== labelState.has('v')) syncLabels();
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  function plan() {
    if (s.state === 'held') return { label: 'act_let', step: '' };
    if (!s.runs.length) return { label: 'act_release', step: 1 };
    if (!s.found.amp) {
      const last = s.runs[s.runs.length - 1].a;
      return { label: last > 0.035 ? 'act_less' : 'act_more', step: 2 };
    }
    if (!s.found.mk) return { label: 'act_mass', step: 3 };
    return { label: 'act_again', step: '' };
  }
  const nextMass = () => MASSES[(MASSES.indexOf(s.m) + 1) % MASSES.length];
  function refresh() {
    const T = period(s.m, s.k);
    if (s.state === 'run') sheet.outcome(t('out_run', { T: fixed(T), f: fixed(frequency(s.m, s.k)) }));
    else if (s.state === 'held') sheet.outcome(t('out_held', { a: fmt(Math.abs(s.x) * 100, 1), dir: t(s.x < 0 ? 'dir_down' : 'dir_up') }));
    else sheet.outcome(t('out_rest', { x0: fmt(staticStretch(s.m, s.k) * 100, 2) }));
    const f = s.found;
    let rule = 'rule_start';
    if (f.amp && f.mk) rule = 'rule_all';
    else if (f.amp) rule = 'rule_amp';
    else if (f.mk) rule = 'rule_mk_only';
    else if (s.runs.length) rule = 'rule_energy';
    sheet.rule(t(rule, { T: fixed(T) }));
    sheet.choose(String(s.m));
    const p = plan();
    sheet.next(p.label === 'act_mass' && s.state !== 'held' ? String(nextMass()) : null);
    for (const b of kWords) {
      const on = Number(b.dataset.spring) === s.k;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    for (const b of gWords) {
      const on = b.dataset.graph === s.graph;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    canvas.setAttribute('aria-label', t('g_aria', { q: t(`g_${s.graph}`) }));
    $('[data-act="stop"]').toggleAttribute('disabled', s.state === 'rest');
    if (action) {
      action.set({ step: p.step, label: p.label, enabled: true });
      if (s.mode === 'explore' && s.state !== 'run' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    syncLabels();
    drawGraph();
  }
  function drawGraph() {
    if (s.mode !== 'explore') return;
    const p = current();
    const e = s.state === 'run' ? energies(s.m, s.k, p.x, p.v) : energies(s.m, s.k, p.x, 0);
    graph.draw({
      show: s.graph,
      run: s.state === 'run',
      tau: s.tau,
      a: s.a,
      w: w(),
      phase0: s.phase0,
      x: p.x,
      aScale: A_MAX,
      K: e.K,
      U: e.U,
      E: e.E,
      Emax: 0.5 * s.k * amax() ** 2,
    });
  }
  /** The test's graph on the picture (questions that are read off a graph). */
  function drawQGraph() {
    const q = s.qgraph;
    qBox.hidden = !q;
    slowNote.hidden = Boolean(q);
    if (!q) return;
    qGraph.draw({ show: 'x', run: true, tau: s.tau, a: s.a, w: w(), phase0: 0, x: 0, aScale: A_MAX, K: 0, U: 0, E: 0, Emax: 1, ...q });
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const A0 = { x: 0, y: 0 };
  const A1 = { x: 0, y: 0 };
  const tmp = new THREE.Vector3();
  function toScreen(p, o2) {
    tmp.copy(p).project(camera);
    o2.x = (tmp.x * 0.5 + 0.5) * stage.width;
    o2.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return o2;
  }
  const bodyBox = new THREE.Box3();
  const rim = new THREE.Vector3();
  /** The discs' outline on the screen (their rims at the top and the bottom), and the plate. */
  function massBox() {
    bodyBox.copy(app.hanger.body());
    let l = Number.POSITIVE_INFINITY;
    let r = Number.NEGATIVE_INFINITY;
    let tp = Number.POSITIVE_INFINITY;
    let b = Number.NEGATIVE_INFINITY;
    for (const y of [bodyBox.min.y - HANGER.plateH, bodyBox.max.y])
      for (let i = 0; i < 8; i++) {
        const th = (i / 8) * Math.PI * 2;
        toScreen(rim.set(DISC.R * Math.cos(th), y, DISC.R * Math.sin(th)), A0);
        l = Math.min(l, A0.x);
        r = Math.max(r, A0.x);
        tp = Math.min(tp, A0.y);
        b = Math.max(b, A0.y);
      }
    return { left: l - 3, right: r + 3, top: tp - 3, bottom: b + 3 };
  }
  function arrowBox() {
    if (!vArrow.visible) return null;
    toScreen(vArrow.root.position, A0);
    toScreen(vArrow.tip, A1);
    return { left: Math.min(A0.x, A1.x) - 9, top: Math.min(A0.y, A1.y) - 6, right: Math.max(A0.x, A1.x) + 9, bottom: Math.max(A0.y, A1.y) + 6 };
  }
  function springBox() {
    toScreen(V(-SPRING.R, hangerY(SPRING.L0 + s.x0) + A_MAX + 0.04, 0), A0);
    toScreen(V(SPRING.R, app.hanger.root.position.y, 0), A1);
    return { left: Math.min(A0.x, A1.x) - 4, right: Math.max(A0.x, A1.x) + 4, top: Math.min(A0.y, A1.y), bottom: Math.max(A0.y, A1.y) };
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, slowNote, qBox, massBox, arrowBox, springBox, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const LEFT = [spot(-14, 0), spot(-14, -14), spot(-14, 14), spot(-26, -22), spot(-26, 22)];
  const LEFT_UP = [spot(-14, -4), spot(-14, -16), spot(-22, -28), spot(-30, -40), spot(-14, 8)];
  const LEFT_DOWN = [spot(-14, 4), spot(-14, 16), spot(-22, 28), spot(-30, 40), spot(-14, -8)];
  const labelState = new Map();
  function wantLabels() {
    const want = new Map();
    if (!s.show.labels) return want;
    const y0 = () => eqY();
    want.set('eq', { text: t('lbl_eq'), point: () => W(LINE_X0, y0(), LINE_Z), spots: LEFT, color: COLORS.eq });
    const a = amplitudeShown();
    if (s.show.ends && a > 0.0015) {
      if (s.state === 'run') {
        // v = 0 at both ends (as চিত্র ৭.০১); not in the test, where it would give answers away
        if (s.mode !== 'quiz') {
          want.set('top', { text: t('lbl_v0'), point: () => W(LINE_X0, y0() + s.a, LINE_Z), spots: LEFT_UP, color: COLORS.aText, optional: true });
          want.set('bot', { text: t('lbl_v0'), point: () => W(LINE_X0, y0() - s.a, LINE_Z), spots: LEFT_DOWN, color: COLORS.aText, optional: true });
        }
        want.set('amp', {
          text: t('lbl_amp'),
          point: () => W(LINE_X0 - 0.003, y0() - s.a / 2, LINE_Z),
          spots: [spot(-14, 0), spot(-14, 10), spot(-14, -10)],
          color: COLORS.aText,
          optional: true,
        });
      } else if (s.state === 'held') {
        want.set('pull', {
          text: t('lbl_a', { a: fmt(Math.abs(s.x) * 100, 1) }),
          point: () => W(LINE_X0, y0() + s.x, LINE_Z),
          spots: s.x < 0 ? LEFT_DOWN : LEFT_UP,
          color: COLORS.aText,
        });
      }
    }
    if (vArrow.visible)
      want.set('v', {
        text: t('lbl_v'),
        point: () => vArrow.tip,
        spots: [spot(12, 0), spot(12, -16), spot(12, 16), spot(24, -28), spot(24, 28)],
        color: COLORS.vText,
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
    for (const [id, lw] of want) {
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: lw.text, point: lw.point, kind: 'tag', color: lw.color, spots: lw.spots, optional: lw.optional });
        labelState.set(id, lw.text);
      } else if (labelState.get(id) !== lw.text) {
        anno.update(id, { text: lw.text, point: lw.point, spots: lw.spots });
        labelState.set(id, lw.text);
      }
    }
  }
  // ── camera ──────────────────────────────────────────────────────────────────
  const bbox = new THREE.Box3();
  /**
   * The follow camera's fixed window, round the equilibrium for the spring's stretch now: the mass at both ends of its
   * largest travel, the lower part of the spring, the rule's labels on the left and the arrow on the right. The arm
   * and the top of the spring may leave the frame.
   */
  const corner = new THREE.Vector3();
  function lookBox() {
    const yH = hangerY(SPRING.L0 + s.x0);
    const low = yH + HANGER.plateTop - HANGER.plateH - A_MAX - 0.006;
    const high = yH + A_MAX + 0.012;
    bbox.makeEmpty();
    for (const x of [LINE_X0, DISC.R + 0.02])
      for (const y of [low, high]) for (const z of [-0.015, 0.02]) bbox.expandByPoint(corner.copy(W(x, y, z)));
    return bbox;
  }
  /** Puts the camera on the window at once (the follow camera: called whenever the stretch or the size changes). */
  function frameNow() {
    framed = `${s.x0}|${stage.width}|${stage.height}`;
    place(viewPose());
  }
  const viewPose = () => fitPose({ box: lookBox(), dir: DIR, camera, width: stage.width, height: stage.height, margin: MARGIN });
  function place(pose) {
    camera.position.copy(pose.position);
    controls.target.copy(pose.target);
    controls.update();
  }
  function flyTo({ position, target: aim }, duration = 0.7) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      place({ position, target: aim });
      framed = `${s.x0}|${stage.width}|${stage.height}`;
      return Promise.resolve(true);
    }
    cameraFlying = true;
    return tweener
      .animate({
        key: 'camera',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          camera.position.lerpVectors(p0, position, k);
          controls.target.lerpVectors(t0, aim, k);
          controls.update();
        },
      })
      .finished.then((ok) => {
        cameraFlying = false;
        if (ok) framed = `${s.x0}|${stage.width}|${stage.height}`;
        return ok;
      });
  }
  function homeView(animate = true) {
    s.userMovedCamera = false;
    syncUI();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    cameraFlying = false;
    syncUI();
  });
  stage.onResize(() => {
    if (!s.userMovedCamera && !cameraFlying) frameNow();
    syncScene();
    drawQGraph();
    refresh();
  });

  // ── the motion ──────────────────────────────────────────────────────────────
  stage.addTicker((dt) => {
    const busy = tweener.tick(dt);
    if (s.state === 'run' && !s.frozen) {
      s.tau += dt / SLOW;
      syncScene();
      drawGraph();
      return true;
    }
    if (busy) {
      syncScene();
      return true;
    }
    return false;
  });
  function emitChange() {
    emit('change', snapshot());
  }
  /** Lets go from the held displacement (or from x = −a): the run starts at rest there. */
  function release(x = s.x) {
    const a = Math.abs(x);
    if (a < 0.002) return toRest();
    s.a = a;
    s.phase0 = x < 0 ? 0 : Math.PI;
    s.tau = 0;
    s.frozen = false;
    s.state = 'run';
    s.x = 0;
    s.runs.push({ m: s.m, k: s.k, a });
    findings();
    audio.pop?.();
    syncScene();
    refresh();
    emitChange();
    return true;
  }
  function findings() {
    const r = s.runs;
    const last = r[r.length - 1];
    if (r.some((q) => q.m === last.m && q.k === last.k && Math.abs(q.a - last.a) >= 0.009)) s.found.amp = true;
    if (r.some((q) => q.m !== last.m || q.k !== last.k)) s.found.mk = true;
  }
  function hold(x) {
    s.state = 'held';
    s.frozen = false;
    s.x = clamp(x, -amax(), amax());
    syncScene();
    refresh();
  }
  function toRest() {
    s.state = 'rest';
    s.x = 0;
    s.a = 0;
    s.tau = 0;
    s.frozen = false;
    syncScene();
    refresh();
    emitChange();
    return false;
  }
  /** Stops everything that is playing (a pull, a glide) and the run's token. */
  function cancelRuns() {
    s.run++;
    tweener.cancel('pull');
    tweener.cancel('x0');
  }
  /** Glides the held mass to x (seconds on screen). */
  function glideTo(x, sec, token) {
    const from = s.state === 'held' ? s.x : current().x;
    s.state = 'held';
    s.frozen = false;
    return tweener
      .animate({
        key: 'pull',
        duration: sec,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (token !== s.run) return;
          s.x = from + (x - from) * k;
          syncScene();
          refresh();
        },
      })
      .finished.then((ok) => ok && token === s.run);
  }
  const wait = (sec, token) => tweener.animate({ key: 'wait', duration: sec, onUpdate: () => {} }).finished.then((ok) => ok && token === s.run);
  /** The action's pull: glide down to −a, hold a moment, let go. */
  async function pullAndRelease(a) {
    const token = ++s.run;
    const ok = (await glideTo(-clamp(a, 0.004, amax()), 0.8, token)) && (await wait(0.3, token));
    if (!ok) return false;
    return release(s.x);
  }
  /** Stop: the mass glides back to rest. */
  async function stop() {
    cancelRuns();
    const token = s.run;
    if (s.state === 'rest') return;
    const ok = await glideTo(0, 0.5, token);
    if (ok) toRest();
  }
  /** New m and/or k: the spring eases to its new stretch at rest, the camera reframes. */
  function setSpring(m, k, { animate = true } = {}) {
    cancelRuns();
    const token = s.run;
    const from = s.x0;
    s.m = m;
    s.k = k;
    s.discs = discsFor(m);
    s.state = 'rest';
    s.x = 0;
    s.a = 0;
    s.tau = 0;
    const to = staticStretch(m, k);
    const done = animate
      ? tweener
          .animate({
            key: 'x0',
            duration: 0.6,
            ease: ease.inOutCubic,
            onUpdate: (q) => {
              if (token !== s.run) return;
              s.x0 = from + (to - from) * q;
              syncScene();
            },
          })
          .finished.then((ok) => {
            if (token === s.run || ok) s.x0 = to;
            return ok && token === s.run;
          })
      : Promise.resolve(true);
    if (!animate) s.x0 = to;
    syncScene();
    refresh();
    emitChange();
    return done;
  }

  // ── the action ──────────────────────────────────────────────────────────────
  async function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    audio.unlock();
    const p = plan();
    if (p.label === 'act_let') {
      cancelRuns();
      return release(s.x);
    }
    const last = s.runs.length ? s.runs[s.runs.length - 1].a : DEFAULT_A;
    if (p.label === 'act_less') return pullAndRelease(Math.min(0.025, amax() / 2));
    if (p.label === 'act_more') return pullAndRelease(amax());
    if (p.label === 'act_mass') {
      const ok = await setSpring(nextMass(), s.k);
      if (!ok) return false;
      return pullAndRelease(Math.min(last, maxAmplitude(s.m, s.k)));
    }
    return pullAndRelease(Math.min(DEFAULT_A, amax()));
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_release',
    target: () => app.hanger.body(),
    pad: 8,
    avoid: [ui.corner, ui.hint, slowNote, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => doAction(),
  });

  // ── dragging the mass ───────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag = null;
  /** Pixels per metre, vertically, at the mass. */
  function pxPerMetre() {
    const c = massCentre(new THREE.Vector3());
    toScreen(c, A0);
    toScreen(c.add(V(0, 0.05, 0)), A1);
    return Math.max(1, Math.abs(A1.y - A0.y) / 0.05);
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const r = stage.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / stage.width) * 2 - 1, -((e.clientY - r.top) / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.intersectObject(app.hanger.hit, false).length || drag) return;
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      cancelRuns();
      const x = current().x;
      drag = { id: e.pointerId, y: e.clientY, x, ppm: pxPerMetre() };
      hold(x);
      action?.hide('drag-mass');
      capturePointer(ui.canvasHost, e.pointerId);
      emit('dragstart', snapshot());
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const x = clamp(drag.x - (e.clientY - drag.y) / drag.ppm, -amax(), amax());
    if (Math.round(x * 200) !== Math.round(s.x * 200)) audio.tick?.();
    hold(x);
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    releasePointer(ui.canvasHost, e.pointerId);
    action?.show('drag-mass');
    release(s.x);
    emit('dragend', snapshot());
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 2600 } = {}) {
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
    showHint(t('q_locked'));
    audio.error();
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const p = current();
    return {
      m: s.m,
      k: s.k,
      T: Number(fixed(period(s.m, s.k), 4)),
      f: Number(fixed(frequency(s.m, s.k), 4)),
      stretch: Number(fixed(staticStretch(s.m, s.k), 4)), // the static stretch mg/k (m)
      state: s.state,
      a: Number(fixed(amplitudeShown(), 4)),
      x: Number(fixed(p.x, 4)),
      v: Number(fixed(p.v, 4)),
      t: Number(fixed(s.tau, 3)),
      graph: s.graph,
      found: { ...s.found },
      runs: s.runs.length,
      next: plan().label.replace('act_', ''),
      mode: s.mode,
    };
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  let question = null;
  let picked = -1;
  let learnSaved = null;
  /** The five questions: two on the picture, two read off a graph, one on the rule. */
  const KINDS = ['energy', 'slope', 'phase', 'freq', 'amp'];
  const CHOICES = {
    energy: ['c_en_U', 'c_en_K', 'c_en_half', 'c_en_none'],
    slope: ['c_sl_C', 'c_sl_A', 'c_sl_B', 'c_sl_D'],
    phase: ['c_ph_T', 'c_ph_half', 'c_ph_quarter', 'c_ph_2T'],
    freq: ['c_f_right', 'c_f_T', 'c_f_half', 'c_f_2T'],
    amp: ['c_a_same', 'c_a_2', 'c_a_half', 'c_a_sqrt'],
  };
  const MISTAKES = {
    c_en_K: 'mis_en_K',
    c_en_half: 'mis_en_half',
    c_en_none: 'mis_en_none',
    c_sl_A: 'mis_sl_A',
    c_sl_B: 'mis_sl_B',
    c_sl_D: 'mis_sl_D',
    c_ph_half: 'mis_ph_half',
    c_ph_quarter: 'mis_ph_quarter',
    c_ph_2T: 'mis_ph_2T',
    c_f_T: 'mis_f_T',
    c_f_half: 'mis_f_half',
    c_f_2T: 'mis_f_2T',
    c_a_2: 'mis_a_2',
    c_a_half: 'mis_a_half',
    c_a_sqrt: 'mis_a_sqrt',
  };
  /** A test scene: m, k, a run of amplitude a from `at` seconds after the release, frozen or not. */
  function scene_({ m = DEFAULT_M, k = DEFAULT_K, a = DEFAULT_A, at = 0, frozen = false, arrow = true, qgraph = null }) {
    cancelRuns();
    s.qgraph = qgraph;
    s.m = m;
    s.k = k;
    s.discs = discsFor(m);
    s.x0 = staticStretch(m, k);
    s.a = Math.min(a, amax());
    s.phase0 = 0;
    s.tau = at;
    s.state = 'run';
    s.frozen = frozen;
    s.show = { arrow, ends: true, labels: true };
    s.userMovedCamera = false;
    syncUI();
    syncScene();
    refresh();
    drawQGraph();
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        learnSaved = { m: s.m, k: s.k };
        s.mode = 'quiz';
        s.locked = true;
        drag = null;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        cancelRuns();
        s.show = { arrow: true, ends: true, labels: true };
        s.qgraph = null;
        drawQGraph();
        s.m = learnSaved?.m ?? s.m;
        s.k = learnSaved?.k ?? s.k;
        s.discs = discsFor(s.m);
        s.x0 = staticStretch(s.m, s.k);
        s.state = 'rest';
        s.x = 0;
        s.a = 0;
        s.tau = 0;
        s.frozen = false;
        s.userMovedCamera = false;
        syncUI();
        place(viewPose());
        syncScene();
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        const T = period(DEFAULT_M, DEFAULT_K);
        let text = '';
        if (kind === 'energy') {
          scene_({ at: 2 * T, frozen: true, arrow: false });
          text = t('q_energy');
        } else if (kind === 'slope') {
          // lettered points on the x–t graph: A at the top, B on the way down, C at the equilibrium going down, D at the bottom
          const points = [
            { t: 0.5 * T, label: 'A' },
            { t: 0.625 * T, label: 'B' },
            { t: 0.75 * T, label: 'C' },
            { t: T, label: 'D' },
          ];
          scene_({ at: 1.5 * T, frozen: true, arrow: false, qgraph: { window: 1.5 * T, periods: false, points } });
          text = t('q_slope');
        } else if (kind === 'phase') {
          scene_({ at: 1.25 * T, frozen: true });
          text = t('q_phase');
        } else if (kind === 'freq') {
          // 1 kg on 100 N/m: T ≈ 0.63 s, read off a graph with a 0.2 s grid and no T marks
          scene_({ m: 1, k: 100, at: 1.6, frozen: true, arrow: false, qgraph: { window: 1.6, periods: false } });
          text = t('q_freq');
        } else {
          scene_({ a: 0.02 });
          text = t('q_amp', { a1: fmt(2), a2: fmt(4) });
        }
        await flyTo(viewPose(), 0.6);
        if (!alive()) return null;
        const items = CHOICES[kind];
        const list = shuffle([...items]);
        question = { kind, list };
        return {
          text,
          list,
          choices: [0, 1, 2, 3],
          expected: list.indexOf(items[0]),
          tolerance: 0.5,
          label: (j) =>
            `<span class="sm-opt">${t(list[j], { f1: fmt(1 / period(1, 100), 1), f0: fmt(period(1, 100), 1), f2: fmt(2 / period(1, 100), 1), f3: fmt(0.5 / period(1, 100), 1) })}</span>`,
          meta: { kind, answer: items[0] },
        };
      },
      reveal(_q, correct) {
        const { kind, list } = question;
        const wrong = correct ? null : list[picked];
        const note = wrong && MISTAKES[wrong] ? ` ${t(MISTAKES[wrong])}` : '';
        if (kind === 'freq') {
          const Tq = period(1, 100);
          s.qgraph = { ...s.qgraph, periods: true }; // the answer: the period marked on the graph
          drawQGraph();
          return t('why_freq', { T: fixed(Tq), f: fmt(1 / Tq, 1) }) + note;
        }
        if (kind === 'slope') return t('why_slope') + note;
        if (kind === 'amp') {
          scene_({ a: 0.04 });
          return t('why_amp', { T: fixed(period(DEFAULT_M, DEFAULT_K)) }) + note;
        }
        if (kind === 'phase' || kind === 'energy') {
          s.frozen = false; // let it go on, so the student sees it come back
          s.show.arrow = true;
          refresh();
        }
        return t(`why_${kind}`) + note;
      },
      done() {
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = $('[data-view="front"]');
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
  function chooseSpring(m, k) {
    if (s.locked) return lockedNudge();
    if (m === s.m && k === s.k) return;
    audio.tick?.();
    setSpring(m, k);
  }
  function setGraph(q) {
    s.graph = q;
    refresh();
    emitChange();
  }
  // the k row and the graph's words: one Tab stop each, arrows move along (like the kit's row of examples)
  for (const [row, words, pick] of [
    [kRow, kWords, (b) => chooseSpring(s.m, Number(b.dataset.spring))],
    [$('.sm-gwords'), gWords, (b) => setGraph(b.dataset.graph)],
  ]) {
    row.addEventListener('keydown', (e) => {
      const ev = /** @type {KeyboardEvent} */ (e);
      const at = words.indexOf(/** @type {HTMLElement} */ (ev.target));
      if (at < 0) return;
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
      if (!step) return;
      ev.preventDefault();
      ev.stopPropagation();
      const to = words[(at + step + words.length) % words.length];
      to.focus();
      pick(to);
    });
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    // a tap or a click on a word or the action hands the keys back to the picture (the arrow keys pull the mass);
    // from the keyboard (detail 0) the focus stays, so the arrows still move along the row of words
    if (e.detail > 0 && (b.dataset.example || b.dataset.spring || b.dataset.graph || b.classList.contains('pvc-act') || b.dataset.act === 'stop'))
      root.focus({ preventScroll: true });
    if (b.dataset.view === 'front') homeView();
    if (b.dataset.example) chooseSpring(Number(b.dataset.example), s.k);
    if (b.dataset.spring) chooseSpring(s.m, Number(b.dataset.spring));
    if (b.dataset.graph) setGraph(b.dataset.graph);
    if (b.dataset.act === 'stop') {
      if (s.locked) return lockedNudge();
      stop();
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'q-next') quiz.next();
    else if (b.dataset.act === 'q-again') quiz.start();
    else if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['ArrowDown', 'ArrowUp', 'r', 'R', 'Home'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (!sceneKey && k !== 'Escape') return;
    e.preventDefault();
    if (s.mode === 'quiz') {
      if (sceneKey && quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      cancelRuns();
      const x = s.state === 'held' ? s.x : current().x;
      hold(x + (k === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 0.01 : 0.005));
    } else if (k === ' ' || k === 'Enter') doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') stop();
    else if (k === 'Escape') hintOff();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  place(viewPose());
  syncScene();
  refresh();
  if (o.start === 'run') {
    const a = o.a !== '' && o.a != null ? Number(o.a) / 100 : DEFAULT_A;
    startRun(a, Number(o.at) || 0, Boolean(o.hold));
  }
  function startRun(a, at, frozen) {
    cancelRuns();
    s.x0 = staticStretch(s.m, s.k);
    release(-clamp(a, 0.004, amax()));
    s.tau = at;
    s.frozen = frozen;
    syncScene();
    refresh();
  }
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
  })();

  /** Waits for a pull, a glide or an easing to finish. */
  async function settle() {
    for (let i = 0; i < 400 && (tweener.busy || s.state === 'held'); i++)
      await tweener.animate({ key: 'settle', duration: 0.05, onUpdate: () => {} }).finished;
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
     * m (kg), k (N/m): the mass and the spring (snapped to the choices), the mass at rest; graph: 'x' | 'v' | 'acc';
     * pull: a (m): pull it down by a and let go (animated, like the action); run: a (m) starts a run at once,
     * `at` seconds (real) after the release, frozen with hold: true; hold: false lets a frozen run go on;
     * state: 'rest' stops it. animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (s.mode === 'quiz' && (p.m != null || p.k != null || p.pull != null || p.run != null || p.state)) quiz.stop();
      if (p.graph && ['x', 'v', 'acc'].includes(p.graph)) s.graph = p.graph;
      if (p.m != null || p.k != null) {
        const m = p.m != null ? nearest(MASSES, Number(p.m)) : s.m;
        const k = p.k != null ? nearest(SPRINGS, Number(p.k)) : s.k;
        if (m !== s.m || k !== s.k) {
          const done = setSpring(m, k, { animate });
          if (animate) await done;
        }
      }
      if (p.state === 'rest') {
        cancelRuns();
        toRest();
      }
      if (p.run != null) startRun(Number(p.run), Number(p.at) || 0, Boolean(p.hold));
      else if (p.pull != null) {
        if (animate) {
          lastAct = Number.NEGATIVE_INFINITY;
          await pullAndRelease(Number(p.pull));
        } else startRun(Number(p.pull), 0, false);
      } else if (p.hold != null && s.state === 'run') s.frozen = Boolean(p.hold);
      await settle();
      syncScene();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      cancelRuns();
      s.runs = [];
      s.found = { amp: false, mk: false };
      s.graph = 'x';
      s.show = { arrow: true, ends: true, labels: true };
      setSpring(DEFAULT_M, DEFAULT_K, { animate: false });
      toRest();
      homeView(false);
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The stand, the rule, the spring as it is stretched now and the hanger with its masses, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'SpringMass';
      for (const part of [app.stand, app.rule]) g.add(part.clone(true));
      const moving = app.root.getObjectByName('SpringAndMass');
      if (moving) g.add(moving.clone(true));
      return g;
    },
  };
}

/** querySelectorAll as an array. */
function $$(el, sel) {
  return /** @type {HTMLElement[]} */ ([...el.querySelectorAll(sel)]);
}
