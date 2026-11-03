// Specific heat (book pages 178–179, topic 6.5 আপেক্ষিক তাপ), student view. The book's own example, shown for real:
// 10 kg of gold (s = 230 J kg⁻¹K⁻¹) against 10 kg of water (s = 4200) on one stove. One tap gives both the same heat
// (42,000 J, the amount that warms 10 kg of water by exactly 1 K); the two thermometers, on the same scale, show the
// gold rising about 18 K while the water rises 1 K. The panel works the book's formula for the chosen one,
// s = Q / m(T₂ − T₁), from the readings (m, Q, T₁, T₂), then C = ms (the book's 2300 and 42,000 J K⁻¹). The rule grows in
// the book's words. Then a five-question test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import {
  IDS,
  MASS,
  MAX_STEPS,
  Q1_STEPS,
  Q3,
  S,
  T1,
  capacity,
  capacityChoices,
  dec1,
  finalT,
  groupBD,
  groupIntl,
  heatAfter,
  rise,
  round,
  specificChoices,
} from './reading.js';
import { PLATE_X, createScene } from './scene.js';

export const DEFAULTS = {
  steps: 0, // how many times the stove has been turned on already (0 … 4): for pictures
  show: 'water', // 'water' | 'gold': the one the panel works out
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const DOUBLE_TAP = 450; // ms
const HEAT_SECONDS = 2.4;
const VIEW_DIRS = {
  front: new THREE.Vector3(0.38, 0.46, 1).normalize(),
  '3d': new THREE.Vector3(0.62, 0.52, 0.85).normalize(),
};
const LOOK_BOX = [new THREE.Vector3(-40, 0, -8), new THREE.Vector3(40, 47, 22)];
const MARGIN = { top: 62, bottom: 14, side: 6 };
const SHADOW_BOX = new THREE.Box3(new THREE.Vector3(-44, 0, -22), new THREE.Vector3(44, 48, 23));
const COLORS = { water: '#1864ab', gold: '#8a5a00' }; // chip text on white: at least 4.5 : 1

/** Fits the sun's shadow camera tightly round a world box (and updates its projection: three.js does not). */
function fitShadow(light, box) {
  light.updateMatrixWorld();
  light.target.updateMatrixWorld();
  const view = new THREE.Matrix4().lookAt(light.position, light.target.position, new THREE.Vector3(0, 1, 0));
  view.setPosition(light.position);
  const inv = view.clone().invert();
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
  const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const p = new THREE.Vector3();
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        p.set(x, y, z).applyMatrix4(inv);
        lo.min(p);
        hi.max(p);
      }
  const cam = light.shadow.camera;
  const pad = 1;
  Object.assign(cam, { left: lo.x - pad, right: hi.x + pad, bottom: lo.y - pad, top: hi.y + pad, near: Math.max(0.5, -hi.z - 4), far: -lo.z + 40 });
  cam.updateProjectionMatrix();
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const G = (x) => N(t.lang === 'bn' ? groupBD(x) : groupIntl(x)); // Bangladeshi commas in Bangla (৪২,০০০)

  root.classList.add('pvc', 'sh');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'examples', results: true, items: IDS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  ui.canvasHost.setAttribute('aria-label', t('aria_stage', { m: MASS }));

  // the readings of the one chosen (its name, m, Q, T₁, T₂, T₂ − T₁) and the formula with its numbers
  const cell = (k, label) => `<div class="sh-cell" data-k="${k}"><small>${t(label)}</small><span></span></div>`;
  const rd = document.createElement('div');
  rd.className = 'sh-rd';
  rd.setAttribute('role', 'group');
  rd.innerHTML = `
    <div class="sh-cell sh-name"><i class="sh-dot"></i><b></b></div>
    ${cell('m', 'rd_m')}${cell('Q', 'rd_Q')}${cell('T1', 'rd_T1')}${cell('T2', 'rd_T2')}${cell('dT', 'rd_dT')}`;
  const eq = document.createElement('div');
  eq.className = 'sh-eq';
  eq.innerHTML = `
    <div class="sh-law" role="img" aria-label="${t('law_label')}">
      <span class="sh-sym">s</span><span class="sh-op">=</span>
      <span class="sh-frac"><span class="sh-sym">Q</span><span class="sh-sym">m(T<sub>2</sub> − T<sub>1</sub>)</span></span>
    </div>
    <div class="sh-sum" aria-live="polite"><span class="sh-l1"></span><span class="sh-l2"></span></div>`;
  $('.pvc-act-row').after(rd);
  rd.after(eq);
  const cells = Object.fromEntries([...rd.querySelectorAll('[data-k]')].map((c) => [c.dataset.k, c.querySelector('span')]));
  const nameCell = /** @type {HTMLElement} */ (rd.querySelector('.sh-name'));
  const sumL1 = /** @type {HTMLElement} */ (eq.querySelector('.sh-l1'));
  const sumL2 = /** @type {HTMLElement} */ (eq.querySelector('.sh-l2'));
  const setHTML = (el, html) => {
    if (el.dataset.html !== html) el.innerHTML = el.dataset.html = html;
  };

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 1, far: 900, environment: 'studio-light', exposure: 1.05 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 20;
  controls.maxDistance = 400;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI * 0.49;
  const bgOn = o.bg !== 'transparent';
  if (bgOn) scene.background = new THREE.Color('#a9bdd1'); // the wall's own colour, if a turn ever looks past it
  scene.add(new THREE.HemisphereLight('#fff4e6', '#5a6f8a', 0.9));
  const sun = new THREE.DirectionalLight('#fff3e0', 1.8);
  sun.position.set(-30, 80, 55);
  sun.target.position.set(0, 10, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#dfeaff', 0.55);
  fill.position.set(45, 30, 60);
  scene.add(fill);
  const world = createScene({ background: bgOn });
  scene.add(world.root);
  if (o.shadow && bgOn) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    fitShadow(sun, SHADOW_BOX);
    // the pot and the gold cast; the stove, the plates and the bench receive
    world.root.traverse((m) => {
      if (m.isMesh) m.receiveShadow = true;
    });
    for (const m of [world.pot, world.gold, world.knob.parent?.children[0]]) if (m) m.castShadow = true;
  }

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    n: 0, // how many times the stove was turned on (the heat is n × 42,000 J each)
    Q: 0, // heat given to each, in J, as now shown (it runs up smoothly)
    glow: 0, // the plates' glow, 0 … 1
    phase: 'idle', // 'idle' | 'heating'
    chosen: IDS.includes(o.show) ? o.show : 'water',
    found: { water: false, gold: false },
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    quiz: null, // the question's scene: { kind, Qw, Qg }
    userMovedCamera: false,
    run: 0, // a token: every heating, reset or question bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  /** The heat each one has had, as now drawn (the test sets its own). */
  const heatOf = () => (s.quiz ? { water: s.quiz.Qw, gold: s.quiz.Qg } : { water: s.Q, gold: s.Q });
  const dataOf = (id) => {
    const Q = heatOf()[id];
    const dT = rise(Q, MASS, S[id]);
    return { Q, dT, T2: T1 + dT, s: S[id], C: capacity(MASS, S[id]) };
  };

  // ── the panel ───────────────────────────────────────────────────────────────
  /** What the big button does next. */
  function plan() {
    if (s.n === 0) return { kind: 'heat', label: 'act_heat1', step: 1 };
    if (s.n < MAX_STEPS) return { kind: 'heat', label: 'act_heat', step: '' };
    return { kind: 'again', label: 'act_again', step: '' };
  }
  const sameHeat = () => s.n > 0 && s.phase === 'idle' && !s.quiz;

  /** The heat as written while it runs up: to the nearest 100 J (it is exact when the stove stops). */
  const shownQ = (Q) => (s.phase === 'heating' ? Math.round(Q / 100) * 100 : Q);

  function outcomeHtml() {
    if (s.phase === 'heating') return t('out_heating');
    if (s.n === 0) return t('out_ready', { m: MASS, T: T1 });
    const w = dataOf('water');
    const g = dataOf('gold');
    return t(s.n >= MAX_STEPS ? 'out_max' : 'out_heated', { Q: G(shownQ(w.Q)), dg: N(dec1(g.dT)), dw: N(dec1(w.dT)) });
  }
  function ruleHtml() {
    const one = { one: 1 };
    if (s.found.water && s.found.gold) return t('rule_both', { m: MASS, Cw: G(capacity(MASS, S.water)), Cg: G(capacity(MASS, S.gold)), x: 20 });
    if (s.found.water || s.found.gold) return t('rule_one');
    return t('rule_start', one);
  }
  function readingsHtml() {
    const d = dataOf(s.chosen);
    nameCell.querySelector('b').textContent = t(`name_${s.chosen}`);
    nameCell.style.setProperty('--c', COLORS[s.chosen]);
    setHTML(cells.m, N(MASS));
    setHTML(cells.Q, G(shownQ(d.Q)));
    setHTML(cells.T1, N(T1));
    setHTML(cells.T2, N(dec1(d.T2)));
    setHTML(cells.dT, N(dec1(d.dT)));
    if (s.phase === 'heating') {
      setHTML(sumL1, t('sum_heating'));
      setHTML(sumL2, '');
    } else if (d.Q > 0 && d.dT > 0) {
      const dT2 = round(d.dT, 2);
      const exact = Math.abs(dT2 - d.dT) < 1e-9;
      setHTML(sumL1, t('sum_s', { Q: G(d.Q), m: MASS, dT: N(dT2), sign: exact ? '=' : '≈', s: G(d.s) }));
      setHTML(sumL2, t('sum_C', { m: MASS, s: G(d.s), C: G(d.C) }));
    } else {
      setHTML(sumL1, t('sum_wait'));
      setHTML(sumL2, '');
    }
  }

  function refresh() {
    sheet.choose(s.chosen);
    for (const id of IDS) sheet.result(id, s.found[id] ? G(S[id]) : '');
    sheet.next(null);
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    readingsHtml();
    const p = plan();
    if (action) {
      action.set({ step: p.step, label: p.label });
      if (s.n > 0 || s.phase === 'heating') action.hide('scene');
      else action.show('scene');
    }
    place();
  }

  /** The 3D at the state: the red columns, the gold's warmth, the plates' glow, the labels. */
  function place() {
    const w = dataOf('water');
    const g = dataOf('gold');
    world.setTemps(w.T2, g.T2);
    world.setGlow(w.Q > 0 ? s.glow : 0, g.Q > 0 ? s.glow : 0);
    syncLabels(w, g);
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const BELOW = {
    water: [spot(0, 26), spot(-38, 28), spot(0, 42), spot(-38, 44)],
    gold: [spot(0, 26), spot(38, 28), spot(0, 42), spot(38, 44)],
  };
  const TEMP_SPOTS = { water: [spot(-34, -16), spot(-44, -30), spot(-26, -40)], gold: [spot(34, -16), spot(44, -30), spot(26, -40)] };
  const pts = new Map();
  const ptOf = (key) => {
    if (!pts.has(key)) pts.set(key, new THREE.Vector3());
    return pts.get(key);
  };
  const labelText = new Map();
  function nameHtml(id, d) {
    if (s.quiz?.kind === 'cap') return t('lbl_quiz', { name: t(`name_${id}`), m: MASS, s: G(S[id]) });
    const base = t('lbl_name', { name: t(`name_${id}`), m: MASS });
    return d.Q > 0 ? `${base}<br><span class="sh-q">${t('lbl_Q', { Q: G(shownQ(d.Q)) })}</span>` : base;
  }
  function syncLabels(w, g) {
    const data = { water: w, gold: g };
    for (const id of IDS) {
      const d = data[id];
      const nameId = `n-${id}`;
      const text = nameHtml(id, d);
      const frontPoint = () => ptOf(nameId).set(PLATE_X[id], 3, 20.6);
      if (!anno.has(nameId)) anno.add(nameId, { text, point: frontPoint, kind: 'tag', spots: BELOW[id] });
      else if (labelText.get(nameId) !== text) anno.setText(nameId, text);
      labelText.set(nameId, text);
      const tempId = `t-${id}`;
      const ttext = t('lbl_temp', { T: dec1(d.T2) });
      if (!anno.has(tempId))
        anno.add(tempId, { text: ttext, point: () => world.points.thermoTop(id), kind: 'callout', color: COLORS[id], spots: TEMP_SPOTS[id] });
      else if (labelText.get(tempId) !== ttext) anno.setText(tempId, ttext);
      labelText.set(tempId, ttext);
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const fitBox = new THREE.Box3();
  function viewPose(view = s.view) {
    fitBox.min.copy(LOOK_BOX[0]);
    fitBox.max.copy(LOOK_BOX[1]);
    const aspect = stage.width / Math.max(1, stage.height);
    const dir = VIEW_DIRS[view].clone();
    if (view === 'front' && aspect > 1.2) dir.y = Math.max(0.24, dir.y - (aspect - 1.2) * 0.1); // wide frames: lower, bigger
    return fitPose({ box: fitBox, dir: dir.normalize(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
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
        controls.target.lerpVectors(t0, aim, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  // the view starts from the front; a drag turns it, and then the kit's front icon shows to come back
  controls.addEventListener('start', () => {
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── the stove ───────────────────────────────────────────────────────────────
  /** Chooses the one the panel works out. */
  function choose(id, { quiet = false } = {}) {
    if (!IDS.includes(id)) return;
    s.chosen = id;
    if (sameHeat()) s.found[id] = true;
    refresh();
    if (!quiet) {
      emit('choose', { show: id });
      emitChange();
    }
  }
  /** One more press: both get the same 42,000 J, and the plates glow while it runs. */
  function heat({ jump = false } = {}) {
    if (s.n >= MAX_STEPS) return Promise.resolve(false);
    const run = ++s.run;
    const from = heatAfter(s.n);
    s.n++;
    const to = heatAfter(s.n);
    tweener.cancel('heat');
    tweener.cancel('glow');
    const finish = () => {
      s.Q = to;
      s.phase = 'idle';
      s.found[s.chosen] = true;
      refresh();
      emit('heat', { n: s.n, Q: s.Q });
      emitChange();
      fadeGlow();
    };
    if (jump) {
      s.glow = 0;
      finish();
      return Promise.resolve(true);
    }
    s.phase = 'heating';
    audio.pop();
    refresh();
    return tweener
      .animate({
        key: 'heat',
        duration: HEAT_SECONDS,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          s.Q = from + (to - from) * k;
          s.glow = Math.min(1, k * 7);
          refresh();
        },
      })
      .finished.then((done) => {
        if (run !== s.run) return false; // a reset or the test took over
        finish();
        if (done) audio.success();
        return true;
      });
  }
  function fadeGlow() {
    const g0 = s.glow;
    if (g0 <= 0) return;
    tweener
      .animate({
        key: 'glow',
        duration: 0.9,
        ease: ease.linear,
        onUpdate: (k) => {
          s.glow = g0 * (1 - k);
          place();
        },
      })
      .finished.then(() => {
        s.glow = 0;
        place();
      });
  }
  function goHome({ quiet = false } = {}) {
    s.run++;
    tweener.cancel('heat');
    tweener.cancel('glow');
    s.n = 0;
    s.Q = 0;
    s.glow = 0;
    s.phase = 'idle';
    s.found = { water: false, gold: false };
    s.chosen = 'water';
    refresh();
    if (!quiet) emitChange();
  }
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not heat twice
    lastAct = now();
    hintOff();
    if (s.phase === 'heating') return showHint(t('hint_wait'), { duration: 2200 });
    if (s.n >= MAX_STEPS) return goHome();
    return heat();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_heat1',
    target: () => world.knob,
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** What a tap at p hits: the knob, the pot of water, the gold bar, or nothing. */
  function pick(p) {
    if (s.mode === 'quiz') return null;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(world.pickable, false)[0];
    if (!hit) return null;
    if (hit.object === world.knob) return 'knob';
    if (hit.object === world.gold) return 'gold';
    return 'water';
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const what = pick(canvasPoint(e));
      if (!what) return;
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (what === 'knob') return doAction();
      choose(what);
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = pick(p) ? 'pointer' : '';
    });
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
  function snapshot() {
    const out = {};
    for (const id of IDS) {
      const d = dataOf(id);
      out[id] = { s: d.s, C: d.C, T2: round(d.T2, 2), rise: round(d.dT, 2) };
    }
    return {
      show: s.chosen,
      steps: s.n,
      Q: s.quiz ? null : round(s.Q, 2),
      m: MASS,
      T1,
      ...out,
      found: { ...s.found },
      phase: s.phase,
      next: plan().kind,
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.show, snap.steps, snap.found, snap.mode, snap.view, snap.phase]);
    if (key === lastEmitted && !force) return;
    lastEmitted = key;
    emit('change', snap);
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
  /** Four choices from items (the right one first), shuffled. */
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="sh-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const unitS = '<small>J kg<sup>−1</sup>K<sup>−1</sup></small>';
  const unitC = '<small>J K<sup>−1</sup></small>';
  /** Sets up a question's own scene (the stove is off, the heat already given is drawn). */
  function quizScene(q) {
    s.run++;
    tweener.cancel('heat');
    tweener.cancel('glow');
    s.glow = 0;
    s.phase = 'idle';
    s.quiz = q;
    s.locked = true;
    refresh();
  }

  let learnSaved = null;
  let question = null;
  let picked = -1;
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
        learnSaved = { n: s.n, Q: s.Q, chosen: s.chosen, found: { ...s.found } };
        s.run++;
        tweener.cancel('heat');
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        const saved = learnSaved || { n: 0, Q: 0, chosen: 'water', found: { water: false, gold: false } };
        Object.assign(s, { n: saved.n, Q: saved.Q, chosen: saved.chosen, found: { ...saved.found }, phase: 'idle', glow: 0 });
        syncUI();
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['hot', 'def', 's', 'cap', 'unit'][i % 5];
        if (kind === 'hot') {
          quizScene({ kind, Qw: heatAfter(Q1_STEPS), Qg: heatAfter(Q1_STEPS) });
          if (!alive()) return null;
          question = { kind };
          const items = [
            { key: 'gold', k: 'c_gold' },
            { key: 'water', k: 'c_water' },
            { key: 'equal', k: 'c_equal' },
            { key: 'unknown', k: 'c_unknown' },
          ];
          return { text: t('q_hot'), ...choicesOf(items, kind, (x) => t(x.k)) };
        }
        if (kind === 'def') {
          quizScene({ kind, Qw: 0, Qg: 0 });
          if (!alive()) return null;
          question = { kind };
          const items = [
            { key: 'specific', k: 'c_specific' },
            { key: 'capacity', k: 'c_capacity' },
            { key: 'temp', k: 'c_temp' },
            { key: 'latent', k: 'c_latent' },
          ];
          return { text: t('q_def', { one: 1 }), ...choicesOf(items, kind, (x) => t(x.k)) };
        }
        if (kind === 's') {
          quizScene({ kind, Qw: 0, Qg: Q3.Q });
          if (!alive()) return null;
          question = { kind, ...Q3 };
          return { text: t('q_s'), ...choicesOf(specificChoices(Q3), kind, (x) => `${G(x.v)} ${unitS}`) };
        }
        if (kind === 'cap') {
          const id = pickOne(IDS);
          quizScene({ kind, Qw: 0, Qg: 0 });
          if (!alive()) return null;
          question = { kind, id };
          return { text: t('q_cap', { name: t(`of_${id}`) }), ...choicesOf(capacityChoices(id), kind, (x) => `${G(x.v)} ${unitC}`) };
        }
        quizScene({ kind: 'unit', Qw: 0, Qg: 0 });
        if (!alive()) return null;
        question = { kind: 'unit' };
        const items = [
          { key: 'right', html: 'J kg<sup>−1</sup>K<sup>−1</sup>' },
          { key: 'cap', html: 'J K<sup>−1</sup>' },
          { key: 'prod', html: 'J kg K' },
          { key: 'inv', html: 'kg J<sup>−1</sup>K<sup>−1</sup>' },
        ];
        return { text: t('q_unit'), ...choicesOf(items, kind, (x) => x.html) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrong = correct ? null : q.list?.[picked];
        const add = (map) => (wrong && map[wrong.key] ? ` ${map[wrong.key]}` : '');
        if (k === 'hot') {
          const tw = dec1(finalT(heatAfter(Q1_STEPS), MASS, S.water));
          const tg = dec1(finalT(heatAfter(Q1_STEPS), MASS, S.gold));
          return t('why_hot', { T1, tg, tw }) + add({ water: t('mis_hot_water'), equal: t('mis_hot_equal'), unknown: t('mis_hot_unknown') });
        }
        if (k === 'def')
          return (
            t('why_def', { one: 1 }) + add({ capacity: t('mis_def_capacity', { one: 1 }), temp: t('mis_def_temp'), latent: t('mis_def_latent') })
          );
        if (k === 's') {
          const dT = rise(Q3.Q, Q3.m, Q3.s);
          return (
            t('why_s', { s: G(Q3.s), Q: G(Q3.Q), m: Q3.m, dT: N(dec1(dT)) }) +
            add({
              nom: t('mis_s_nom', { v: G(round(Q3.Q / dT)) }),
              prod: t('mis_s_prod'),
              msq: t('mis_s_msq'),
            })
          );
        }
        if (k === 'cap')
          return (
            t('why_cap', { C: G(capacity(MASS, S[question.id])), m: MASS, s: G(S[question.id]) }) +
            add({ sOnly: t('mis_cap_sonly', { one: 1, m: MASS }), div: t('mis_cap_div'), zero: t('mis_cap_zero', { m: MASS, m2: MASS * 10 }) })
          );
        return t('why_unit') + add({ cap: t('mis_unit_cap'), prod: t('mis_unit_prod'), inv: t('mis_unit_inv') });
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
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else choose(b.dataset.example);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'home':
        if (s.locked) lockedNudge();
        else goHome();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['1', '2', 'r', 'R', 'Home', 'ArrowUp', 'ArrowRight', '+'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (k === '1') choose('water');
    else if (k === '2') choose('gold');
    else if (k === 'ArrowUp' || k === 'ArrowRight' || k === '+' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  const steps = Math.max(0, Math.min(MAX_STEPS, Math.round(Number(o.steps) || 0)));
  if (steps > 0) {
    s.n = steps;
    s.Q = heatAfter(steps);
    s.found[s.chosen] = true;
  }
  flyTo(viewPose(), 0);
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
    /** Change any of: show ('water' | 'gold'), steps (0 … 4: the stove turned on that many times), view ('front' | '3d'). */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.steps != null) {
        const n = Math.max(0, Math.min(MAX_STEPS, Math.round(Number(p.steps))));
        if (n < s.n || n === 0) goHome({ quiet: true });
        while (s.n < n) await heat({ jump: !animate });
      }
      if (p.show) choose(p.show);
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      goHome();
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The stove with the pot of water, the gold bar and the two thermometers, in centimetres. */
    exportRoot: () => world.root,
  };
}
