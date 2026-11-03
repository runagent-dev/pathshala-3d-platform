// Relation between temperature scales (ভিন্ন স্কেলের মাঝে সম্পর্ক), book p165–166, topic 6.2.1.
// Three thermometers on one board, the same liquid at the same height in all of them: Celsius, Kelvin, Fahrenheit.
// The student drags the top of the liquid (or taps the numbered button for the next of the book's four examples)
// and the three readings move together, with the book's two relations worked out with the student's numbers.
// On the shared student kit (@shared/student/…): the clean শেখো sheet, the numbered action, the test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { COLORS, SCALE_IDS, X, cOfY, createThermometers, yOf } from './thermometers.js';
import { EXAMPLES, K0, QUESTION_KINDS, clampC, convert, exampleOf, fmt, makeQuestion, nextExample, sameNumber } from './reading.js';

export const DEFAULTS = {
  value: 30, // the starting temperature (° C): an ordinary warm day
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first (false: it stays still)
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' | 'transparent'
  shadow: true,
  sound: true,
};

const FRONT_DIR = new THREE.Vector3(0.25, 0.18, 1).normalize(); // a mild three-quarter view: depth shows, the scales stay easy to read
const VIEW_DIRS = { front: FRONT_DIR, '3d': new THREE.Vector3(0.62, 0.3, 1).normalize() };
const GRIP_Z = 10; // the glass tube's front, where the liquid is seen

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const unit = (id, v) => `${N(fmt(v))}${t(`unit_${id}`)}`;
  const chipText = (id, v) => `${N(fmt(v))}<span class="ts-u">${t(`unit_${id}`)}</span>`;

  root.classList.add('pvc', 'ts');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: EXAMPLES.map((e) => ({ id: e.id, label: `ex_${e.id}` })) },
      lines: { action: 1, outcome: 2, rule: 2 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);

  // the three readings, then the book's relations with the student's numbers (between the action and the result)
  const mid = document.createElement('div');
  mid.className = 'ts-mid';
  mid.innerHTML = `
    <div class="ts-read" role="group">${SCALE_IDS.map(
      (id) =>
        `<div class="ts-row k-${id}"><span class="ts-name">${t(`sc_${id}`)} <i>T<sub>${id}</sub></i></span><b class="ts-val" data-val="${id}"></b></div>`,
    ).join('')}</div>
    <div class="ts-eq"><div class="ts-law">${law()}</div><div class="ts-law ts-nums" data-nums></div><div class="ts-sum" data-sum="k"></div><div class="ts-sum" data-sum="f"></div></div>`;
  ui.$('.pvc-act-row').after(mid);
  const valEls = Object.fromEntries(SCALE_IDS.map((id) => [id, ui.$(`[data-val="${id}"]`)]));
  const sumK = ui.$('[data-sum="k"]');
  const sumF = ui.$('[data-sum="f"]');
  const numsEl = ui.$('[data-nums]');
  const readEl = ui.$('.ts-read');

  /** The book's relation as printed: T_C / 100 = (T_K − 273.15) / 100 = (T_F − 32) / 180. */
  function law() {
    const f = (n, d) => `<span class="ts-f"><span>${n}</span><span>${d}</span></span>`;
    const c = 'T<sub>C</sub>';
    return `${f(c, N(100))}<i>=</i>${f(`T<sub>K</sub> − ${N('273.15')}`, N(100))}<i>=</i>${f(`T<sub>F</sub> − ${N(32)}`, N(180))}`;
  }

  /** The same relation with the student's numbers: (T_C − 0)/100 = (T_K − 273.15)/100 = (T_F − 32)/180. */
  function lawNums(r) {
    const f = (n, d) => `<span class="ts-f"><span>${n}</span><span>${d}</span></span>`;
    return `${f(N(fmt(r.c)), N(100))}<i>=</i>${f(N(fmt(r.k - K0)), N(100))}<i>=</i>${f(N(fmt(r.f - 32)), N(180))}`;
  }

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 20, far: 6000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false; // the front view auto-frames the board; a pinch would break that
  controls.minDistance = 200;
  controls.maxDistance = 4000;
  controls.minAzimuthAngle = -1.1;
  controls.maxAzimuthAngle = 1.1;
  controls.minPolarAngle = 0.95;
  controls.maxPolarAngle = 1.75;
  const M = createMaterials(stage.renderer);
  const therm = createThermometers({ materials: M, digits: N, names: { C: t('sc_C'), K: t('sc_K'), F: t('sc_F') } });
  scene.add(therm.root, therm.setting);
  if (o.bg !== 'transparent') scene.background = new THREE.Color('#2f5560');
  scene.add(new THREE.HemisphereLight('#e4f1f4', '#7d5a3a', 0.8));
  const sun = new THREE.DirectionalLight('#fff4de', 1.5);
  sun.position.set(-320, 620, 700);
  sun.target.position.set(0, 180, 0);
  scene.add(sun, sun.target);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -340, right: 340, top: 340, bottom: -340, near: 300, far: 1600 });
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.6;
  }
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    c: 30, // the level, °C
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    example: null, // the chosen example, or null for the free level
    settled: false, // the example's level reached (so a "same number" mark is true)
    dragging: false,
    locked: false,
    userMovedCamera: false,
    question: null, // the test's question while it is asked
    revealed: false,
  };
  let runToken = 0;
  const snapshot = () => {
    const r = convert(s.c);
    return { value: +s.c.toFixed(4), c: +r.c.toFixed(4), k: +r.k.toFixed(4), f: +r.f.toFixed(4), example: s.example, mode: s.mode, locked: s.locked };
  };

  // ── labels on the 3D: one number chip above each plate ──
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint] });
  for (const id of SCALE_IDS) {
    anno.add(`read-${id}`, { text: chip(id, ''), point: () => therm.top(id), dx: 0, dy: -24, kind: 'reading', color: COLORS[id] });
  }
  function chip(id, text, match = false) {
    return `<span class="ts-chip k-${id}"${match ? ' data-match' : ''}>${text}</span>`;
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const last = { chips: '', vals: '', sums: '', outcome: '', rule: '', aria: '' };
  function outcomeHtml(r) {
    switch (s.example) {
      case 'cf':
        return t('out_cf', { v: fmt(r.c) });
      case 'kf':
        return t('out_kf', { k: fmt(r.k) });
      case 'body':
        return t('out_body', { f: fmt(r.f, 1), c: fmt(r.c), r: Math.round(r.c) });
      case 'ck':
        return t('out_ck', { d: fmt(K0) });
      default:
        return t('out_free');
    }
  }
  function refresh() {
    const r = convert(s.c);
    const q = s.question;
    // the number chips: in the test only what the question gives (the rest wait as "?")
    const known = !q ? SCALE_IDS : SCALE_IDS.filter((id) => s.revealed || id in q.given);
    therm.hideLiquid(q && q.kind !== 'eqCF' && !s.revealed ? SCALE_IDS.filter((id) => !known.includes(id)) : []);
    const match = !q && s.settled ? sameNumber(s.c) : null;
    for (const id of SCALE_IDS) {
      const txt = known.includes(id) ? chipText(id, r[id.toLowerCase()]) : '?';
      const html = chip(id, txt, (match === 'cf' && id !== 'K') || (match === 'kf' && id !== 'C'));
      if (last.chips !== undefined && last[`chip${id}`] !== html) {
        last[`chip${id}`] = html;
        anno.setText(`read-${id}`, html);
      }
    }
    const vals = SCALE_IDS.map((id) => unit(id, r[id.toLowerCase()])).join('|');
    if (vals !== last.vals) {
      last.vals = vals;
      for (const id of SCALE_IDS) valEls[id].textContent = unit(id, r[id.toLowerCase()]);
      const sk = `<span class="nw">${t('eq_c_k', { d: fmt(K0) })}</span> <span class="nw">= ${N(fmt(r.k))} − ${N(fmt(K0))} = <b>${N(fmt(r.c))}°</b></span>`;
      const sf = `<span class="nw">${t('eq_c_f')}</span> <span class="nw">= ${t('frac59')} (${N(fmt(r.f))} − ${N(32)}) = <b>${N(fmt(r.c))}°</b></span>`;
      numsEl.innerHTML = lawNums(r);
      sumK.innerHTML = sk;
      sumF.innerHTML = sf;
      const aria = t('thermometer_aria', { c: fmt(r.c), k: fmt(r.k), f: fmt(r.f) });
      readEl.setAttribute('aria-label', aria);
      ui.canvasHost.setAttribute('aria-label', aria);
    }
    for (const id of SCALE_IDS) {
      const row = readEl.querySelector(`.k-${id}`);
      const on = match != null && match.includes(id.toLowerCase());
      if (row.classList.contains('same') !== on) row.classList.toggle('same', on);
    }
    sheet.outcome(outcomeHtml(r));
    sheet.rule(s.example && !q ? t(`ask_${s.example}`, { f: 98.4 }) : t('rule_intro'));
    therm.grip(s.c, grip);
    stage.invalidate();
  }
  const grip = new THREE.Vector3();

  // ── the level ───────────────────────────────────────────────────────────────
  let lastEmitted = NaN;
  function setC(c) {
    s.c = clampC(c);
    therm.setLevel(s.c);
    refresh();
    if (s.c !== lastEmitted) {
      lastEmitted = s.c;
      emit('change', snapshot());
    }
  }
  function animateC(target, duration = 0.8) {
    const c0 = s.c;
    return tweener.animate({ key: 'level', duration, ease: ease.inOutCubic, onUpdate: (k) => setC(c0 + (target - c0) * k) }).finished;
  }
  function choose(id) {
    s.example = id;
    sheet.choose(id);
    sheet.next(nextExample(id));
  }
  /** Go to one of the book's examples. */
  async function selectExample(id, { animate = true } = {}) {
    const ex = exampleOf(id);
    if (!ex || s.locked || s.mode === 'quiz') return;
    const my = ++runToken;
    choose(id);
    s.settled = false;
    refresh();
    if (animate) await animateC(ex.c, 0.9);
    else setC(ex.c);
    if (my !== runToken) return;
    s.settled = true;
    refresh();
    emit('example', { id });
  }
  function leaveExample() {
    runToken++;
    s.settled = false;
    if (s.example) choose(null);
    sheet.next(EXAMPLES[0].id);
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewPose(view) {
    return fitPose({
      box: therm.frame(),
      dir: VIEW_DIRS[view],
      camera,
      width: stage.width,
      height: stage.height,
      margin: { top: 58, bottom: 10, side: 8 },
    });
  }
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
  // the view starts from the front; dragging it turns it, and then the "front" button appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(viewPose(s.view), 0));

  // ── dragging the top of the liquid (a strip round each tube takes the touch) ─
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -GRIP_Z);
  const hitPoint = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function aim(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  const pick = (p) => (aim(p), raycaster.intersectObjects(therm.pickable, false).length > 0);
  /** The level (° C) under a point of the screen, on the plane of the tubes' fronts. */
  function levelAt(p) {
    aim(p);
    return raycaster.ray.intersectPlane(plane, hitPoint) ? cOfY(hitPoint.y) : null;
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (drag || !pick(canvasPoint(e))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked || s.mode === 'quiz') return lockedNudge();
      drag = { id: e.pointerId };
      tweener.cancel('level');
      leaveExample();
      s.dragging = true;
      capturePointer(ui.canvasHost, e.pointerId);
      moveTo(canvasPoint(e));
      emit('dragstart', snapshot());
    },
    true,
  );
  function moveTo(p) {
    const c = levelAt(p);
    if (c == null) return;
    const v = Math.round(clampC(c));
    if (v !== Math.round(s.c)) audio.tick();
    setC(v);
  }
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) moveTo(canvasPoint(e));
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    releasePointer(ui.canvasHost, drag.id);
    drag = null;
    s.dragging = false;
    emit('dragend', snapshot());
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── the action: one big button, and the same numbered badge on the Celsius liquid's top ────────────────────
  /** The numbers of the Celsius and Kelvin plates on the screen: the action's badge keeps off them (it sits beside the bulb). */
  const corner = new THREE.Vector3();
  const numberBoxes = [
    { left: 0, top: 0, right: 0, bottom: 0 },
    { left: 0, top: 0, right: 0, bottom: 0 },
  ];
  function scaleBoxes() {
    ['C', 'K'].forEach((id, i) => {
      let [left, top, right, bottom] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const [x, y] of [
        [X[id] + (id === 'C' ? -40 : -12), -45],
        [X[id] + (id === 'C' ? 26 : 66), -45],
        [X[id] + (id === 'C' ? -40 : -12), yOf(130)],
        [X[id] + (id === 'C' ? 26 : 66), yOf(130)],
      ]) {
        corner.set(x, y, 4).project(camera);
        const px = (corner.x * 0.5 + 0.5) * stage.width;
        const py = (-corner.y * 0.5 + 0.5) * stage.height;
        left = Math.min(left, px);
        right = Math.max(right, px);
        top = Math.min(top, py);
        bottom = Math.max(bottom, py);
      }
      Object.assign(numberBoxes[i], { left, top, right, bottom });
    });
    return numberBoxes;
  }
  const action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_next',
    icon: ICONS.chevR,
    target: () => therm.bulbPoint,
    radius: 20,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), scaleBoxes],
    pulse: Boolean(o.coach),
    onAct: () => {
      if (s.locked || s.mode === 'quiz') return lockedNudge();
      selectExample(s.example ? nextExample(s.example) : EXAMPLES[0].id);
    },
  });

  // ── the test ────────────────────────────────────────────────────────────────
  let qn = null;
  const label = (q) => (v) => (q.unit === 'deg' ? `${N(fmt(v))}°` : unit(q.unit, v));
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: QUESTION_KINDS.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        s.mode = 'quiz';
        runToken++;
        tweener.cancel('level');
        choose(null);
        s.settled = false;
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.question = null;
        s.revealed = false;
        qn = null;
        syncUI();
        animateC(DEFAULTS.value, 0.5);
        refresh();
      },
      async prepare(i, alive, say) {
        qn = makeQuestion(QUESTION_KINDS[i]);
        s.locked = false;
        s.question = null;
        s.revealed = false;
        const g = qn.given;
        say(t(`q_${qn.kind}`, { c: fmt(g.C ?? 0), f: fmt(g.F ?? 0, 1) }));
        refresh();
        await animateC(qn.c, 0.7);
        if (!alive()) return null;
        s.locked = true;
        s.question = qn;
        refresh();
        return {
          choices: qn.choices.map((x) => x.v),
          expected: qn.expected,
          tolerance: 0.006,
          label: label(qn),
          meta: { kind: qn.kind },
        };
      },
      reveal(_q, _correct, { index }) {
        s.revealed = true;
        refresh();
        const r = convert(qn.c);
        const g = qn.given;
        const common = { c: fmt(g.C ?? 0), f: fmt(g.F ?? 0, 1), ans: fmt(qn.expected), k0: fmt(K0), r: Math.round(r.c) };
        const d = fmt(r.f - 32);
        let work = t(`sol_${qn.kind}`, { ...common, d });
        const wrong = qn.choices[index]?.note;
        if (wrong) work += ` ${t(`n_${qn.kind}_${wrong}`, { k0: fmt(K0), k1: fmt(373.15), a: 32, b: 40, c: 104 })}`;
        return work;
      },
      done() {
        s.locked = false;
        s.question = null;
        s.revealed = false;
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
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) selectExample(b.dataset.example);
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
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    if (s.locked || s.mode === 'quiz') return lockedNudge();
    tweener.cancel('level');
    leaveExample();
    setC(Math.round(s.c) + step * (e.shiftKey ? 10 : 1));
  });

  // ── start ───────────────────────────────────────────────────────────────────
  setC(Number.isFinite(Number(o.value)) ? Number(o.value) : DEFAULTS.value);
  choose(null);
  sheet.next(EXAMPLES[0].id);
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
    getState: () => ({ ...snapshot(), view: s.view }),
    /** Change any of: value (the level, ° C), example ('cf' | 'kf' | 'body' | 'ck'), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.example) await selectExample(p.example, { animate });
      else if (p.value != null) {
        leaveExample();
        if (animate) await animateC(clampC(Number(p.value)), 0.6);
        else setC(Number(p.value));
      }
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      leaveExample();
      await Promise.all([setView('front'), animateC(DEFAULTS.value, 0.6)]);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => therm.root,
  };
}
