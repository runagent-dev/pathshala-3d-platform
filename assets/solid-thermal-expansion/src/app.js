// Expansion of solids (book pp167–171, চিত্র ৬.০৪): a copper rod, plate and cube, each shown cold (T₁) above and heated
// (T₂) below, over a flame. The student heats them (the button, a pull on a flame, or the arrow keys) and reads the
// book's numbers: L₂ = L₁ + αL₁(T₂ − T₁) with the rod of the worked example (10 m, 20° C → 120° C: 10.0167 m,
// α = 16.7 × 10⁻⁶ °C⁻¹), A₂ = A₁ + βA₁(T₂ − T₁) with β = 2α, V₂ = V₁ + γV₁(T₂ − T₁) with γ = 3α. Built on the shared
// student kit (@shared/student/…): the clean শেখো sheet and a short test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer } from '@shared/student/pointer.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { createRoom } from './scenery.js';
import { COLUMN_X, createBodies } from './bodies.js';
import { COPPER, EXAGGERATION, QUANTITIES, T1, T2_MAX, alphaFrom, coefficient, densityAfter, fixed, percentGrowth, sizeAt } from './reading.js';

export const DEFAULTS = {
  quantity: 'length', // 'length' | 'area' | 'volume'
  T2: T1, // the temperature of the lower row (°C)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  motion: true, // false: the flames keep one still shape (a poster, a slow phone)
  coach: true, // the numbered ring on the flame pulses at first (false: it stays still)
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' | 'transparent'
  sound: true,
};

const VIEW_DIRS = {
  front: new THREE.Vector3(0.24, 0.2, 1).normalize(), // from the front, a touch from the side and above: the cube shows three faces
  '3d': new THREE.Vector3(0.9, 0.5, 0.7).normalize(),
};
const UNIT_KEY = { length: 'u_m', area: 'u_m2', volume: 'u_m3' };
const DECIMALS = { length: 4, area: 3, volume: 2 };
const PREFIX = { length: 'len', area: 'area', volume: 'vol' };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const clampT = (v) => Math.min(T2_MAX, Math.max(T1, Number(v) || T1));

  root.classList.add('pvc');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple'; // the student layout of student.css
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learnAlign: 'start',
    learn: cleanSheet(t, {
      examples: { label: 'examples', items: QUANTITIES.map((q) => ({ id: q, label: `chip_${q}` })) },
      lines: { action: 1, outcome: 4.4, rule: 6 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 1, far: 400, environment: 'studio-light', environmentIntensity: 0.9 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 10;
  controls.maxDistance = 90;
  controls.enablePan = false;
  const model = new THREE.Group();
  model.name = 'SolidThermalExpansion';
  scene.add(model);
  const room = createRoom();
  if (o.bg !== 'transparent') {
    scene.add(room.root);
    scene.background = room.background;
  }
  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x9a7650, 1.0));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(12, 30, 20);
  scene.add(sun);
  const bodies = createBodies();
  model.add(bodies.root);

  const tweener = createTweener();
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    q: QUANTITIES.includes(o.quantity) ? o.quantity : 'length',
    T2: T1,
    time: 0,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
  };
  const clock = () => (o.motion ? s.time : 0.8); // without motion every frame is the same
  const sizes = () => Object.fromEntries(QUANTITIES.map((q) => [q, sizeAt(q, s.T2)]));
  const snapshot = () => ({
    quantity: s.q,
    T2: s.T2,
    dT: s.T2 - T1,
    L2: sizeAt('length', s.T2),
    A2: sizeAt('area', s.T2),
    V2: sizeAt('volume', s.T2),
    locked: s.locked,
    mode: s.mode,
  });

  // ── the picture ─────────────────────────────────────────────────────────────
  stage.addTicker((dt) => {
    const moving = tweener.tick(dt);
    s.time += dt;
    if (s.T2 > T1 + 0.01 && (o.motion || moving)) {
      bodies.update(s.T2, clock(), s.q);
      return true; // a flame flickers, or the temperature is changing
    }
    return moving;
  });
  function draw() {
    bodies.update(s.T2, clock(), s.q);
    stage.invalidate();
  }

  // ── labels: the two temperatures, and L₁/L₂ (A, V) of the chosen body ───────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
  const pt = { t1: new THREE.Vector3(), t2: new THREE.Vector3(), b1: new THREE.Vector3(), b2: new THREE.Vector3() };
  anno.add('t1', {
    text: t('lbl_t1', { t: T1 }),
    point: () => bodies.topPoint('cold', pt.t1),
    spots: [
      { dx: 0, dy: -34 },
      { dx: -50, dy: -34 },
    ],
    kind: 'part',
    color: '#2b5f8e',
  });
  anno.add('t2', {
    text: t('lbl_t2', { t: s.T2 }),
    point: () => bodies.topPoint('hot', pt.t2),
    spots: [
      { dx: 0, dy: -34 },
      { dx: -50, dy: -34 },
    ],
    kind: 'part',
    color: '#b3260e',
  });
  const symbol = () => PREFIX[s.q];
  anno.add('b1', {
    text: t(`lbl_${symbol()}1`),
    point: () => bodies.sidePoint(s.q, 'cold', pt.b1),
    spots: [
      { dx: 38, dy: -4 },
      { dx: 38, dy: -30 },
      { dx: 0, dy: 34 },
    ],
    kind: 'part',
    color: '#2b5f8e',
  });
  anno.add('b2', {
    text: t(`lbl_${symbol()}2`),
    point: () => bodies.sidePoint(s.q, 'hot', pt.b2),
    spots: [
      { dx: 38, dy: -4 },
      { dx: 38, dy: 30 },
      { dx: 0, dy: 34 },
    ],
    kind: 'part',
    color: '#b3260e',
  });
  let lastT2Label = '';
  function syncLabels() {
    anno.update('b1', { text: t(`lbl_${symbol()}1`) });
    anno.update('b2', { text: t(`lbl_${symbol()}2`) });
    const txt = t('lbl_t2', { t: Math.round(s.T2) });
    if (txt !== lastT2Label) {
      lastT2Label = txt;
      anno.setText('t2', txt);
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const BOX = new THREE.Box3(new THREE.Vector3(-7.2, 1.0, -1.2), new THREE.Vector3(7.8, 9.4, 1.2));
  const viewPose = (view) =>
    fitPose({ box: BOX, dir: VIEW_DIRS[view], camera, width: stage.width, height: stage.height, margin: { top: 56, bottom: 12, side: 12 } });
  function flyTo({ position, target }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
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
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  // the view starts from the front; dragging turns it, and then the "front" button appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(viewPose(s.view), 0));

  // ── the panel: three readings, the formula, the rule ────────────────────────
  const cls = { length: 'c-len', area: 'c-area', volume: 'c-vol' };
  const KEY = { length: 'L', area: 'A', volume: 'V' };
  const trimmed = (x, d) => N(fixed(x, d, true));
  function outcomeHTML() {
    const rows = QUANTITIES.map((q) => {
      const before = COPPER.side ** (q === 'area' ? 2 : q === 'volume' ? 3 : 1);
      const after = sizeAt(q, s.T2);
      const pct = percentGrowth(q, s.T2);
      return `<span class="rd ${cls[q]}${q === s.q ? ' on' : ''}"><i>${KEY[q]}</i><span>${trimmed(before, 0)} → <b>${trimmed(after, DECIMALS[q])}</b> ${t(UNIT_KEY[q])}</span><small>+${trimmed(pct, 3)} %</small></span>`;
    });
    const coef = t(`coef_${s.q}`, { v: fixed(coefficient(s.q) * 1e6, 1) });
    return `${rows.join('')}<span class="fx ${cls[s.q]}">${t(`formula_${s.q}`)}</span><span class="cf">${coef}</span>`;
  }
  function refresh() {
    sheet.outcome(outcomeHTML());
    sheet.rule(`${t(`rule_${s.q}`, { n: COPPER.side })} <small>${t('note_scale', { n: EXAGGERATION })}</small>`);
    syncLabels();
    stage.invalidate();
  }
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
    sheet.choose(s.q);
    sheet.next(null);
    const hot = s.T2 >= T2_MAX - 0.01;
    action?.set({ label: hot ? 'act_cool' : 'act_heat', step: hot ? '' : 1 });
    refresh();
  }

  // ── the temperature ─────────────────────────────────────────────────────────
  let lastEmit = null;
  function setT2(v, { emitChange = true } = {}) {
    s.T2 = clampT(v);
    draw();
    refresh();
    const hot = s.T2 >= T2_MAX - 0.01;
    action?.set({ label: hot ? 'act_cool' : 'act_heat', step: hot ? '' : 1 });
    if (emitChange && lastEmit !== Math.round(s.T2 * 10)) {
      lastEmit = Math.round(s.T2 * 10);
      emit('change', snapshot());
    }
  }
  function animateT2(to, seconds = 2.6) {
    const from = s.T2;
    const target = clampT(to);
    if (from === target) return Promise.resolve(true);
    return tweener.animate({
      key: 'T2',
      duration: seconds * (Math.abs(target - from) / (T2_MAX - T1)) + 0.2,
      ease: ease.inOutCubic,
      onUpdate: (k) => setT2(from + (target - from) * k),
    }).finished;
  }
  function setQuantity(q) {
    if (!QUANTITIES.includes(q) || q === s.q) return;
    s.q = q;
    syncUI();
    draw();
    emit('change', snapshot());
  }
  /** The action: heat to 120° C, or (already there) cool again. */
  function step() {
    if (s.locked) return lockedNudge();
    audio.unlock();
    animateT2(s.T2 >= T2_MAX - 0.01 ? T1 : T2_MAX);
  }

  // ── the action: one big button, and the same numbered badge on the middle flame ─
  const flameAt = new THREE.Vector3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_heat',
    icon: ICONS.hand,
    target: () => {
      bodies.groups.area.burner.flamePoint(flameAt);
      return flameAt.add(bodies.groups.area.burner.root.position);
    },
    radius: 26,
    avoid: [ui.corner, ui.hint],
    pulse: Boolean(o.coach),
    onAct: step,
  });

  // a tap on a flame does the same; pulling it up or down sets the temperature
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hits = QUANTITIES.map((q) => bodies.groups[q].burner.hit);
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const r = stage.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / stage.width) * 2 - 1, -((e.clientY - r.top) / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.intersectObjects(hits).length || drag) return;
      e.stopPropagation(); // not the camera
      if (s.locked) return lockedNudge();
      tweener.cancel('T2');
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, T2: s.T2, moved: false, at: performance.now() };
      capturePointer(ui.canvasHost, e.pointerId);
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = drag.y - e.clientY;
    if (Math.abs(dy) > 6) drag.moved = true;
    if (drag.moved) setT2(drag.T2 + (dy * (T2_MAX - T1)) / (0.35 * Math.max(200, stage.height)));
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const wasTap = !drag.moved && performance.now() - drag.at < 600 && e.type === 'pointerup';
    drag = null;
    if (wasTap) step();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── the test: five questions in the book's own examples ─────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const sci = (m, e) => `<span class="nw">${N(m)}\u00a0×\u00a0${N(10)}<sup>−${N(e)}</sup></span>`;
  const pct = (x) => `<span class="nw">${N(x)}\u00a0%</span>`;
  const dT = T2_MAX - T1;
  const L2 = fixed(sizeAt('length', T2_MAX), 4, true);
  const aCu = fixed(alphaFrom(COPPER.side, Number(L2), T1, T2_MAX) * 1e6, 1);
  const gold = { rho: 19.3, alpha: 14e-6, dT: 100 };
  const goldAfter = densityAfter(gold.rho, gold.alpha, gold.dT);
  const goldWrongA = gold.rho / (1 + gold.alpha * gold.dT); // α instead of 3α
  const gcc = (x) => `<span class="nw">${N(fixed(x, 2))}\u00a0${t('u_gcc')}</span>`;
  const pLen = fixed(percentGrowth('length', T2_MAX), 3, true);
  const pArea = fixed(percentGrowth('area', T2_MAX), 3, true);
  const pVol = fixed(percentGrowth('volume', T2_MAX), 3, true);
  /** Each question: its scene, its words, and [right, wrong, wrong, wrong] as { label, note }. */
  const QUESTIONS = [
    {
      q: 'length',
      text: () => t('q1_text', { t1: T1, l1: COPPER.side, t2: T2_MAX, l2: L2 }),
      work: () => t('q1_w', { t1: T1, l1: COPPER.side, t2: T2_MAX, l2: L2 }),
      choices: () => [
        { label: `${sci(aCu, 6)}\u00a0${t('u_ci')}` },
        { label: `${sci('167', 6)}\u00a0${t('u_ci')}`, note: t('q1_n1') },
        { label: `${sci('13.9', 6)}\u00a0${t('u_ci')}`, note: t('q1_n2', { dt: dT }) },
        { label: `${sci('1.67', 3)}\u00a0${t('u_ci')}`, note: t('q1_n3') },
      ],
    },
    {
      q: 'area',
      text: () => t('q2_text', { p: pLen }),
      work: () => t('q2_w', { p: pLen }),
      choices: () => [
        { label: pct(pArea) },
        { label: pct(pLen), note: t('q2_n1') },
        { label: pct(pVol), note: t('q2_n2') },
        { label: pct(fixed(Number(pLen) / 2, 3, true)), note: t('q2_n3') },
      ],
    },
    {
      q: 'volume',
      text: () => t('q3_text', { p: '0.1' }),
      work: () => t('q3_w', { p: '0.1' }),
      choices: () => [
        { label: pct('0.3') },
        { label: pct('0.1'), note: t('q3_n1') },
        { label: pct('0.2'), note: t('q3_n2') },
        { label: pct('0.001'), note: t('q3_n3') },
      ],
    },
    {
      q: 'volume',
      text: () => t('q4_text', { rho: fixed(gold.rho, 2), a: 14, ten: 10, dt: gold.dT }),
      work: () => t('q4_w', { dt: gold.dT, x: '4.2', f: '0.9958', rho: fixed(gold.rho, 2) }),
      choices: () => [
        { label: gcc(goldAfter) },
        { label: gcc(gold.rho), note: t('q4_n1') },
        { label: gcc(gold.rho * (1 + 3 * gold.alpha * gold.dT)), note: t('q4_n2') },
        { label: gcc(goldWrongA), note: t('q4_n3') },
      ],
    },
    {
      q: 'area',
      long: true,
      text: () => t('q5_text'),
      work: () => t('q5_w'),
      choices: () => [0, 1, 2, 3].map((i) => ({ label: t(`q5_c${i}`), note: i ? t(`q5_n${i}`) : '' })),
    },
  ];
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: QUESTIONS.length,
    lines: { text: 3, feedback: 4 },
    action, // its ring and badge hide during the test
    hooks: {
      enter() {
        s.mode = 'quiz';
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        tweener.cancel('T2');
        setT2(T1, { emitChange: false });
        syncUI();
      },
      async prepare(i, alive, say) {
        const Q = QUESTIONS[i];
        say(Q.text());
        s.locked = false;
        tweener.cancel('T2');
        s.q = Q.q;
        setT2(T2_MAX, { emitChange: false });
        syncUI();
        if (!alive()) return null;
        s.locked = true;
        const choices = Q.choices();
        root.dataset.opts = Q.long ? 'long' : 'short';
        return {
          choices: shuffle([0, 1, 2, 3]), // 0 is the right answer
          expected: 0,
          tolerance: 0.5,
          label: (v) => choices[v].label,
          meta: { question: i + 1, answers: choices.map((c) => c.label) },
        };
      },
      reveal(q, correct, picked) {
        const Q = QUESTIONS[q.meta.question - 1];
        const choices = Q.choices();
        const lead = `${Q.work()}<b>${choices[0].label}</b>`;
        return correct ? lead : `${lead}. ${choices[picked.value].note}`;
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) return lockedNudge();
      setQuantity(b.dataset.example);
    }
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
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!dir || e.target.closest?.('.pvc-examples')) return; // the chips use the arrows themselves
    e.preventDefault();
    if (s.locked) return lockedNudge();
    tweener.cancel('T2');
    setT2(Math.round(s.T2 / 10) * 10 + dir * 10);
  });

  // ── start ───────────────────────────────────────────────────────────────────
  setView(s.view, { animate: false });
  setT2(clampT(o.T2), { emitChange: false });
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
    getState: () => ({ ...snapshot(), sizes: sizes(), view: s.view }),
    /** Change any of: quantity ('length' | 'area' | 'volume'), T2 (°C, 20…120), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.quantity) setQuantity(p.quantity);
      if (p.T2 != null) {
        if (animate) await animateT2(p.T2);
        else {
          tweener.cancel('T2');
          setT2(p.T2);
        }
      }
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      setQuantity('length');
      await Promise.all([setView('front'), animateT2(T1)]);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => bodies.root,
  };
}
