// Calorimetry (ক্যালোরিমিতির মূলনীতি, book pp179-181, topic 6.6): the book's three worked examples on one bench.
// A beaker of water with a thermometer in it; the student adds the book's ice (100 gm, 0 °C), cold water (1 L at 20 °C
// to 2 L at 75 °C) or hot iron (10 gm, 120 °C) with one button, watches the temperature settle, and reads the book's
// own sum with the student's numbers. The panel is the kit's clean sheet in the lab's order: tabs, the example's
// words, the action, the readings (the book's givens), the sum, the rule. 3D in scene.js and choreo.js, maths in
// reading.js, strings in i18n.js.
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
import { BEAKER, MUG, STATION_X, backdropTexture, createBench } from './scene.js';
import { createChoreo, surfaceAt } from './choreo.js';
import { EXAMPLES, EXAMPLE_IDS, ICE_L, mixMistakes, round3, solve, tempText } from './reading.js';

export const DEFAULTS = {
  example: 'ice', // 'ice' | 'water' | 'iron'
  k: 0, // how far the mixing has gone, 0 (before) … 1 (mixed), for pictures
  view: 'front',
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the thing to add pulses at first
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const DURATION = { ice: 7, water: 8.5, iron: 6 }; // seconds of the run
const COLORS = { hot: '#c2410c', cold: '#1864ab', T: '#5f3dc4' };
const VIEW_DIR = new THREE.Vector3(0, 0.44, 1).normalize();
const FRAME = new THREE.Box3(new THREE.Vector3(-26, 0, -10), new THREE.Vector3(12, 29.5, 10));

// where the added thing's label may go (best first): above its ring, then beside it, then below
const ITEM_SPOTS = [
  { dx: 0, dy: -62 },
  { dx: 0, dy: -96 },
  { dx: 80, dy: -58 },
  { dx: -50, dy: -62 },
  { dx: 0, dy: -130 },
  { dx: 0, dy: 70 },
  { dx: 0, dy: 110 },
];

const shuffle = (list) => {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'cal');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'examples', results: true, items: EXAMPLE_IDS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 5, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  // the readings: the book's givens for the chosen example, between the action and the sum
  const list = document.createElement('ul');
  list.className = 'cal-list';
  list.setAttribute('aria-label', t('reading'));
  ui.learn.querySelector('.pvc-outcome')?.before(list);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 1, far: 600, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minAzimuthAngle = -1.2;
  controls.maxAzimuthAngle = 1.2;
  if (o.bg !== 'transparent') scene.background = backdropTexture();
  scene.add(new THREE.HemisphereLight('#fff1dc', '#6d7f94', 0.8));
  const sun = new THREE.DirectionalLight('#fff0d8', 2.4);
  sun.position.set(-30, 60, 50);
  sun.target.position.set(-6, 6, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#dbe8ff', 0.55);
  fill.position.set(40, 20, 40);
  scene.add(fill);

  const bench = createBench({ N, unitL: 'L' });
  scene.add(bench.root);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -32, right: 18, top: 36, bottom: -6, near: 20, far: 160 });
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0008;
    for (const m of bench.casters) m.castShadow = true;
  }
  const choreo = createChoreo(bench, N);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    ex: EXAMPLE_IDS.includes(o.example) ? o.example : 'ice',
    k: 0,
    running: false,
    mode: 'explore',
    view: o.view === '3d' ? '3d' : 'front',
    locked: false,
    userMovedCamera: false,
    seen: /** @type {Record<string, string>} */ ({}), // example → its result, once run
  };
  const exOf = () => EXAMPLES[s.ex];

  // ── labels on the 3D (short): what and how much, the added thing, the mixture, the temperature ──
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
  const tmp = new THREE.Vector3();
  const shown = {};
  function label(id, text, spec) {
    if (shown[id] === text) return;
    shown[id] = text;
    if (text == null) anno.remove(id);
    else if (anno.has(id)) anno.setText(id, text);
    else anno.add(id, { text, kind: 'name', optional: true, ...spec });
  }
  const itemPoint = () => {
    const { ice, iron, mugGroup } = bench;
    if (s.ex === 'ice') return tmp.copy(ice.position);
    if (s.ex === 'iron') return tmp.copy(iron.position);
    return tmp.set(-MUG.R * 1.5, -5.5, 0).applyMatrix4(mugGroup.matrixWorld);
  };
  const waterPoint = () => tmp.set(0, Math.max(2.6, surfaceAt(choreo.state.litres) * 0.5), BEAKER.R * 0.7);
  const screenPoint = () => bench.screenPoint(tmp);
  function labelsFor(st) {
    const ex = exOf();
    const piece = s.ex === 'iron' ? ex.hot : ex.cold; // what is added
    const holder = s.ex === 'iron' ? ex.cold : ex.hot;
    const m = (x) => String(x);
    const waiting = s.k <= 0;
    label('item', waiting ? t('lab_item', { what: t(`n_${piece.what}`), m: m(piece.m), T: piece.T0 }) : null, {
      point: itemPoint,
      color: s.ex === 'iron' ? COLORS.hot : COLORS.cold,
      spots: ITEM_SPOTS,
    });
    label(
      'water',
      waiting
        ? t('lab_item', { what: t('n_water'), m: m(holder.m), T: holder.T0 })
        : st.done
          ? t('lab_mix', { what: t('n_mix'), m: m(Math.round((ex.hot.m + ex.cold.m) * 100) / 100) })
          : null,
      {
        point: waterPoint,
        color: s.ex === 'iron' ? COLORS.cold : COLORS.hot,
        spots: [
          { dx: 0, dy: 0 },
          { dx: 0, dy: 34 },
          { dx: 0, dy: -34 },
        ],
      },
    );
    label('T', st.done ? t('lab_T', { T: tempText(st.T) }) : null, {
      point: screenPoint,
      color: COLORS.T,
      spots: [
        { dx: -64, dy: -4 },
        { dx: -64, dy: -34 },
        { dx: -30, dy: -52 },
      ],
    });
    if (s.ex === 'water') anno.update('item', { color: COLORS.cold });
  }

  // ── the panel: the readings, the sum, the rule ──────────────────────────────
  const sub = (x) => `<sub>${x}</sub>`;
  const m1 = `m${sub(1)}`;
  const m2 = `m${sub(2)}`;
  const frac = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
  const C = (v) => `${N(v)}°C`;
  const tenPow = `${N(10)}<sup>${N(3)}</sup>`;
  const row = (kind, name, value) =>
    `<li class="${kind}"><i aria-hidden="true"></i><span class="nm">${name}</span><span class="vl">${value}</span></li>`;
  const kgT = (x) => t('r_kg_T', { m: String(x.m), T: x.T0 });
  const sRow = (name, x) => row('s', t(name), t('r_s_v', { v: String(x.s / 1000), ten: 10, e: 3 }));
  function readings() {
    const { hot, cold } = exOf();
    if (s.ex === 'ice') {
      return [
        row('cold', t('r_ice_m'), t('r_ice_v', { g: 100, m: '0.1', T: 0 })),
        row('hot', t('r_water_m', { l: 1, i: 2 }), kgT(hot)),
        sRow('r_s_water', hot),
        row('s', t('r_L'), t('r_L_v', { v: ICE_L / 1000 })),
      ].join('');
    }
    if (s.ex === 'water') {
      return [
        row('hot', t('r_water_m', { l: 2, i: 1 }), kgT(hot)),
        row('cold', t('r_water_m', { l: 1, i: 2 }), kgT(cold)),
        sRow('r_s_water', hot),
      ].join('');
    }
    return [row('hot', t('r_iron_m'), kgT(hot)), row('cold', t('r_water_m_plain'), kgT(cold)), sRow('r_s_iron', hot), sRow('r_s_water2', cold)].join(
      '',
    );
  }
  /** The book's equation, T in symbols, T with the numbers (once the student has run it). */
  function sums() {
    const T = tempText(solve(exOf()).T);
    if (s.ex === 'ice') {
      return {
        eq: `${m1}L + ${m1}sT = ${m2}s(${C(30)} − T)`,
        sym: frac(`${C(30)} × ${m2}s − ${m1}L`, `(${m1} + ${m2})s`),
        num: frac(
          `${N(30)} × ${N(1)} × ${N('4.2')} × ${tenPow} − ${N('0.1')} × ${N(334)} × ${tenPow}`,
          `(${N(1)} + ${N('0.1')}) ${N('4.2')} × ${tenPow}`,
        ),
        short: frac(`${N(group(126000))} − ${N(group(33400))}`, N(group(4620))),
        unit: '',
        T,
      };
    }
    if (s.ex === 'water') {
      return {
        eq: `${m1}s(${C(75)} − T) = ${m2}s(T − ${C(20)})`,
        sym: `${frac(`(${N(75)}${m1} + ${N(20)}${m2})s`, `(${m1} + ${m2})s`)}°C`,
        num: `${frac(`${N(75)} × ${N(2)} + ${N(20)}`, `${N(2)} + ${N(1)}`)}°C`,
        short: null,
        unit: '',
        T,
      };
    }
    const s1 = `s${sub(1)}`;
    const s2 = `s${sub(2)}`;
    return {
      eq: `${m1}${s1}(${C(120)} − T) = ${m2}${s2}(T − ${C(30)})`,
      sym: `${frac(`${N(120)}${m1}${s1} + ${N(30)}${m2}${s2}`, `${m1}${s1} + ${m2}${s2}`)}°C`,
      num: `${frac(`${N(120)} × ${N('0.01')} × ${N('0.45')} × ${tenPow} + ${N(30)} × ${N(1)} × ${N('4.2')} × ${tenPow}`, `${N('0.01')} × ${N('0.45')} × ${tenPow} + ${N(1)} × ${N('4.2')} × ${tenPow}`)}°C`,
      short: `${frac(`${N(540)} + ${N(group(126000))}`, `${N('4.5')} + ${N(group(4200))}`)}°C`,
      unit: '',
      T,
    };
  }
  let lastList = '';
  function panel(st) {
    const h = readings();
    if (h !== lastList) {
      list.innerHTML = h;
      lastList = h;
    }
    const f = sums();
    const done = s.k >= 1;
    let html = `<span class="cal-line cal-say">${t('f_balance')}</span><span class="cal-line cal-eq">${f.eq}</span>`;
    html += `<span class="cal-line cal-T cal-sym">T = ${f.sym}${done ? '' : ` = ${t('f_T_unknown')}`}</span>`;
    if (done) {
      const q = round3(solve(exOf()).given);
      const numbers = f.short ? `<span class="cal-long">${f.num}</span><span class="cal-short">${f.short}</span>` : f.num;
      html += `<span class="cal-line cal-T">= ${numbers} = <b>${C(f.T)}</b></span>`;
      html += `<span class="cal-line cal-heat">${t('out_heat', { Q: groupDigits(q) })}</span>`;
    }
    sheet.outcome(html);
    sheet.rule(
      done
        ? `<span class="cal-r1">${t('rule_i')}</span> <span class="cal-r2">${t('rule_ii')}</span> <small>${t('rule_note')}</small>`
        : `<span class="cal-r1">${t('rule_i')}</span>`,
    );
    root.dataset.done = done ? '1' : '0';
    sheet.choose(s.ex);
    const nextId = EXAMPLE_IDS.find((id) => !s.seen[id]);
    sheet.next(nextId && nextId !== s.ex ? nextId : null);
    for (const id of EXAMPLE_IDS) sheet.result(id, s.seen[id] ? `${N(s.seen[id])}°C` : '');
    if (st && !s.running) syncAction();
  }
  const group = (n) => groupDigits(n);
  /** Bangladeshi digit grouping for the heats (41,800 · 1,54,000). */
  function groupDigits(n) {
    const x = String(Math.round(n));
    if (x.length <= 3) return x;
    const last3 = x.slice(-3);
    const rest = x.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${rest},${last3}`;
  }

  // ── drawing the state ───────────────────────────────────────────────────────
  let lastEmit = '';
  function render() {
    const st = choreo.apply(s.ex, s.k);
    labelsFor(st);
    panel(st);
    const key = `${s.ex}|${s.k >= 1 ? 'done' : s.k > 0 ? 'run' : 'start'}`;
    if (key !== lastEmit) {
      lastEmit = key;
      emit('change', snapshot());
    }
    stage.invalidate();
  }
  const snapshot = () => ({
    example: s.ex,
    k: s.k,
    T: Math.round(choreo.state.T * 100) / 100,
    final: Math.round(solve(exOf()).T * 100) / 100,
    litres: Math.round(choreo.state.litres * 100) / 100,
    running: s.running,
    done: s.k >= 1,
    mode: s.mode,
    locked: s.locked,
    next: { action: 'run', enabled: !s.running && !s.locked },
  });

  // ── the action: one button, and the same numbered badge on the thing to add ─────────────────────────────
  const actLabel = () => (s.k >= 1 ? t('act_again') : s.running ? t('act_busy') : t(`act_${s.ex}`));
  const actTarget = () => (s.k > 0 || s.mode === 'quiz' ? null : s.ex === 'ice' ? bench.ice : s.ex === 'iron' ? bench.iron : bench.mugGroup);
  const action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: actLabel,
    target: actTarget,
    radius: 26,
    pad: 4,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => run(),
  });
  function syncAction() {
    action.set({ label: actLabel, target: actTarget, enabled: !s.running && !s.locked });
  }

  function setK(k) {
    s.k = Math.min(1, Math.max(0, k));
    render();
  }
  function stopRun() {
    tweener.cancel('run');
    s.running = false;
  }
  /** Adds the thing and lets everything mix (a replay if it has already been done). */
  async function run() {
    if (s.locked) return lockedNudge();
    if (s.running) return false;
    if (s.k > 0) setK(0);
    s.running = true;
    syncAction();
    emit('action', { example: s.ex });
    const ex = s.ex;
    const done = await tweener.animate({ key: 'run', duration: DURATION[ex], ease: ease.linear, onUpdate: (k) => setK(k) }).finished;
    if (!done || ex !== s.ex) return false;
    s.running = false;
    s.seen[ex] = tempText(solve(EXAMPLES[ex]).T);
    setK(1);
    syncAction();
    emit('done', snapshot());
    return true;
  }
  function chooseExample(id, { animate = true } = {}) {
    if (!EXAMPLE_IDS.includes(id)) return;
    stopRun();
    s.ex = id;
    s.k = 0;
    render();
    syncAction();
    emit('example', { example: id });
    if (animate) audio.unlock();
  }
  function home() {
    stopRun();
    s.k = 0;
    render();
    syncAction();
    setView('front');
  }
  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const target = new THREE.Vector3();
  function viewPose(view) {
    const dir = view === '3d' ? new THREE.Vector3(0.5, 0.6, 1).normalize() : VIEW_DIR;
    return fitPose({ box: FRAME, dir, camera, width: stage.width, height: stage.height, margin: { top: 54, bottom: 14, side: 10 } });
  }
  function flyTo({ position, target: tg }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      camera.position.copy(position);
      controls.target.copy(tg);
      controls.update();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, tg, k);
        controls.update();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
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
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(viewPose(s.view), 0));
  void target;

  // ── the test: five tap questions, each on its own scene ─────────────────────
  const kg = (x) => String(x);
  function questionSet() {
    const water = EXAMPLES.water;
    const mm = mixMistakes(water);
    const iron = EXAMPLES.iron;
    const sIron = solve(iron);
    const heatIron = groupDigits(round3(sIron.given));
    const T = tempText(mm.right);
    return [
      {
        ex: 'iron',
        k: 0,
        text: t('q1_text'),
        ok: t('q1_ok', { hot: iron.hot.T0, cold: iron.cold.T0 }),
        options: [
          { html: t('q1_a'), ok: true },
          { html: t('q1_b'), why: t('q1_b_why') },
          { html: t('q1_c'), why: t('q1_c_why') },
          { html: t('q1_d'), why: t('q1_d_why') },
        ],
      },
      {
        ex: 'water',
        k: 0,
        text: t('q2_text'),
        ok: t('q2_ok', { T, a: 75, b: 20, m1: 2, m2: 1 }),
        options: [
          { html: C(T), ok: true },
          { html: C(tempText(mm.average)), why: t('q2_average') },
          { html: C(tempText(mm.swapped)), why: t('q2_swapped', { a: 75, m1: 2 }) },
          { html: C(tempText(mm.difference)), why: t('q2_difference') },
        ],
      },
      {
        ex: 'ice',
        k: 0,
        text: t('q3_text', { g: 100, L: 334 }),
        ok: t('q3_ok', { Q: '33.4', m: '0.1', L: 334 }),
        options: [
          { html: `${N('33.4')} kJ`, ok: true },
          { html: `${N(334)} kJ`, why: t('q3_nomass', { m: '0.1' }) },
          { html: `${N('3.34')} kJ`, why: t('q3_gm', { g: 100, m: '0.1', g2: '0.01' }) },
          { html: `${N('33,400')} kJ`, why: t('q3_big', { g: 100 }) },
        ],
      },
      {
        ex: 'iron',
        k: 1,
        text: t('q4_text', { h: 120, d: '0.1' }),
        ok: t('q4_ok', { Q: heatIron, w: 1 }),
        options: [
          { html: t('q4_a'), ok: true },
          { html: t('q4_b'), why: t('q4_b_why', { Q: heatIron }) },
          { html: t('q4_c'), why: t('q4_c_why', { s: '4.2 × 10<sup>3</sup>' }) },
          { html: t('q4_d'), why: t('q4_d_why') },
        ],
      },
      {
        ex: 'ice',
        k: 1,
        text: t('q5_text'),
        ok: t('q5_ok', { z: 0 }),
        options: [
          { html: `${m1}L + ${m1}sT`, ok: true },
          { html: `${m1}L`, why: t('q5_onlyL', { z: 0, T: '20' }) },
          { html: `${m1}sT`, why: t('q5_onlyS') },
          { html: `${m1}L − ${m1}sT`, why: t('q5_minus') },
        ],
      },
    ];
  }
  let questions = [];
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 3, feedback: 5 },
    action,
    hooks: {
      enter() {
        stopRun();
        s.mode = 'quiz';
        questions = questionSet();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        stopRun();
        s.k = 0;
        syncUI();
        render();
        syncAction();
      },
      async prepare(i, _alive, say) {
        if (i === 0) questions = questionSet();
        const q = questions[i];
        s.locked = true;
        say(q.text);
        s.ex = q.ex;
        s.k = q.k;
        render();
        syncAction();
        const order = shuffle([0, 1, 2, 3]);
        return {
          choices: order,
          expected: 0,
          tolerance: 0.5,
          text: q.text,
          label: (v) => `<span class="cal-opt">${q.options[v].html}</span>`,
          meta: { question: i + 1, example: q.ex },
          q,
        };
      },
      reveal(qq, correct, picked) {
        const q = qq.q;
        if (correct) return q.ok;
        const why = q.options[picked.value].why;
        return `${q.ok}${why ? ` <span class="cal-why">${why}</span>` : ''}`;
      },
      done() {
        s.locked = false;
      },
    },
  });
  void kg;

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
  // the panel is below the 3D (stacked) unless the frame is landscape and at least 600 px wide (the kit's rule)
  const syncStacked = () => {
    root.dataset.stacked = root.clientWidth >= 600 && root.clientWidth >= root.clientHeight ? '0' : '1';
  };
  new ResizeObserver(syncStacked).observe(root);
  syncStacked();
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.example) {
      if (s.locked) return lockedNudge();
      chooseExample(b.dataset.example);
    }
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.act === 'home') home();
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.act === 'q-next') quiz.next();
    if (b.dataset.act === 'q-again') quiz.start();
    if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === root && s.mode !== 'quiz') {
      e.preventDefault();
      run();
    }
  });

  // ── start ───────────────────────────────────────────────────────────────────
  s.k = Math.min(1, Math.max(0, Number(o.k) || 0));
  if (s.k >= 1) s.seen[s.ex] = tempText(solve(exOf()).T);
  render();
  setView(s.view, { animate: false });
  syncUI();
  syncAction();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
  })();
  void STATION_X;

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: () => ({ ...snapshot(), view: s.view }),
    /** Change any of: example, k (0…1, jumps), run (true: add the thing now), view; animate: false jumps. */
    async set(p = {}) {
      if (p.example && p.example !== s.ex) chooseExample(p.example, { animate: false });
      if (p.view) await setView(p.view, { animate: p.animate !== false });
      if (p.k != null) {
        stopRun();
        setK(Number(p.k));
        if (s.k >= 1) s.seen[s.ex] = tempText(solve(exOf()).T);
        syncAction();
      }
      if (p.run) await run();
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      home();
      chooseExample('ice', { animate: false });
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => bench.root,
  };
}
