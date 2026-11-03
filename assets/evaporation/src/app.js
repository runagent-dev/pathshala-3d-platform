// Evaporation (বাষ্পায়ন), book topic 6.4, pages 177–178.
// The page defines বাষ্পায়ন (a liquid's molecules leaving its surface at any temperature: drying up) and lists what it
// depends on: বাতাসের প্রবাহ, তরলের উপরিভাগের ক্ষেত্রফল, তরলের প্রকৃতি, বাতাসের চাপ, উষ্ণতা, বায়ুর শুষ্কতা. Here are two
// vessels with the same amount of liquid, one thing different about the second (the student picks which of the six
// in a row of words); one big button lets time pass and the liquid goes down faster in one of them, vapour rising
// from each in proportion. The maths is in reading.js, the apparatus in lab.js; this file is the layout, the panel,
// the test and the bridge.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { createLab } from './lab.js';
import { CASES, FACTORS, T_END, dryAt, percentLeft } from './reading.js';

export const DEFAULTS = {
  factor: 'wind', // which of the six things differs
  time: 0, // where the run is (0 to 10)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the ring on the vessel pulses at first (false: it stays still)
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' | 'transparent'
  shadow: true,
  sound: true,
};

const SECONDS = 7.5; // the whole run
const FRONT = new THREE.Vector3(0.3, 0.36, 1).normalize();
const SIDE_VIEW = new THREE.Vector3(0.5, 0.45, 1).normalize();

const shuffle = (list) => {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'ev');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'factors', items: FACTORS.map((id) => ({ id, label: `f_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);

  // the liquid left in each vessel, and the time (a bar the finger can slide): after the result line
  const extra = document.createElement('div');
  extra.className = 'ev-read';
  const row = (k) =>
    `<div class="ev-row" data-row="${k}"><span class="ev-name"></span><span class="ev-bar"><i></i></span><b class="ev-pct"></b></div>`;
  extra.innerHTML = `${row('left')}${row('right')}
    <div class="ev-time" role="slider" tabindex="0" aria-label="${t('time_label')}" aria-valuemin="0" aria-valuemax="${T_END}" aria-valuenow="0"><i></i></div>`;
  ui.learn.querySelector('.pvc-rule').before(extra);
  const rows = {
    left: extra.querySelector('[data-row="left"]'),
    right: extra.querySelector('[data-row="right"]'),
  };
  const timeBar = extra.querySelector('.ev-time');

  // ── 3D ────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 10, far: 1500, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  scene.background = new THREE.Color(0x86a8bf);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(35);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(86);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-60);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(60);
  const lab = createLab();
  scene.add(lab.root);
  const tweener = createTweener();
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xfff3e0, 1.1);
    sun.position.set(30, 60, 70);
    sun.target.position.set(0, 4, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 18, bottom: -12, near: 30, far: 200 });
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);
  } else {
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a99a8, 0.5));
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state ─────────────────────────────────────────────────────────────────
  const s = {
    t: 0, // time (0–T_END)
    factor: FACTORS.includes(o.factor) ? o.factor : 'wind',
    swap: false, // the changed vessel on the left (the test mixes them up)
    mode: 'explore',
    run: null, // { to, rate, resolve }
    scrub: false,
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quizNames: true,
  };
  const cases = () => CASES[s.factor];
  const changedSide = () => (s.swap ? 'left' : 'right');
  const snapshot = () => ({
    time: s.t,
    factor: s.factor,
    swap: s.swap,
    left: percentLeft(s.swap ? cases().changed : cases().plain, s.t),
    right: percentLeft(s.swap ? cases().plain : cases().changed, s.t),
    mode: s.mode,
    playing: Boolean(s.run),
  });

  // ── labels on the 3D view: what differs ───────────────────────────────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
  const NAME = { kind: 'name', dx: 0, dy: 0, optional: true };
  const lastSpots = {};
  function label(id, text, point, spots) {
    if (!text) anno.remove(id);
    else if (anno.has(id)) {
      anno.setText(id, text);
      if (lastSpots[id] !== spots) anno.update(id, { spots }); // the names move with the apparatus of the chosen factor
    } else anno.add(id, { ...NAME, point, spots, text });
    lastSpots[id] = spots;
  }

  // ── what the student sees now ─────────────────────────────────────────────────
  let shown = '';
  function apply() {
    lab.update(s.t);
    const c = cases();
    const left = s.swap ? c.changed : c.plain;
    const right = s.swap ? c.plain : c.changed;
    const pl = percentLeft(left, s.t);
    const pr = percentLeft(right, s.t);
    const names = s.mode !== 'quiz' || s.quizNames;
    const side = s.swap ? ['changed', 'plain'] : ['plain', 'changed'];
    label(
      'left',
      names ? t(`n_${s.factor}_${side[0]}`) : '',
      () => (s.swap ? lab.anchors.changed : lab.anchors.plain),
      s.swap ? lab.spots.changed : lab.spots.plain,
    );
    label(
      'right',
      names ? t(`n_${s.factor}_${side[1]}`) : '',
      () => (s.swap ? lab.anchors.plain : lab.anchors.changed),
      s.swap ? lab.spots.plain : lab.spots.changed,
    );
    for (const [k, p] of [
      ['left', pl],
      ['right', pr],
    ]) {
      const r = rows[k];
      r.querySelector('i').style.width = `${p}%`;
      r.querySelector('.ev-pct').textContent = p > 0 ? `${N(p)}%` : t('left_dry');
      r.classList.toggle('is-dry', p <= 0);
    }
    timeBar.firstElementChild.style.width = `${(s.t / T_END) * 100}%`;
    timeBar.setAttribute('aria-valuenow', String(Math.round(s.t * 10) / 10));
    const key = `${s.factor}|${s.swap}|${s.mode}|${pl}|${pr}|${s.t === 0}`;
    if (key !== shown) {
      shown = key;
      panel();
      emit('change', snapshot());
    }
    stage.invalidate();
  }
  function panel() {
    sheet.choose(s.factor);
    sheet.rule(t(`rule_${s.factor}`));
    const ch = changedSide();
    const sideIn = t(`side_${ch}_in`);
    const dry = dryAt(cases().changed);
    let out = t('out_start');
    if (s.t > 0) out = dry != null && s.t >= dry ? t('out_dry', { side: sideIn }) : t('out_run', { side: sideIn });
    sheet.outcome(out);
    rows.left.querySelector('.ev-name').textContent = t('side_left').replace(/ .*$/, '');
    rows.right.querySelector('.ev-name').textContent = t('side_right').replace(/ .*$/, '');
    syncAction();
  }

  // ── running time ──────────────────────────────────────────────────────────────
  function runTo(to, seconds) {
    cancelRun();
    return new Promise((resolve) => {
      if (Math.abs(to - s.t) < 1e-6) return resolve(true);
      s.run = { to, rate: (to - s.t) / Math.max(seconds, 0.05), resolve };
      syncAction();
      stage.invalidate();
    });
  }
  function cancelRun() {
    const r = s.run;
    s.run = null;
    if (r) r.resolve(false);
  }
  function setT(x, { silent = false } = {}) {
    s.t = Math.min(T_END, Math.max(0, x));
    if (!silent) apply();
  }
  stage.addTicker((dt) => {
    tweener.tick(dt);
    const moving = Boolean(s.run) || s.scrub;
    if (s.run) {
      const r = s.run;
      const next = s.t + r.rate * dt;
      const done = r.rate > 0 ? next >= r.to : next <= r.to;
      setT(done ? r.to : next);
      if (done) {
        s.run = null;
        syncAction();
        r.resolve(true);
      }
    }
    if (moving || tweener.busy) lab.tick(dt);
    return moving || tweener.busy;
  });

  // ── camera: the vessels and the apparatus of this factor ──────────────────────
  function viewPose(view) {
    return fitPose({
      box: lab.frame,
      dir: view === '3d' ? SIDE_VIEW : FRONT,
      camera,
      width: stage.width,
      height: stage.height,
      margin: { top: 50, bottom: 10, side: 10 },
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
    stage.invalidate(); // the tween moves on the stage's ticks
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

  // ── touches: a tap on a vessel is the action; the time bar slides ─────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let tap = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = canvasPoint(e);
      ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.intersectObjects(lab.pickable, false).length) tap = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() };
    },
    true,
  );
  function endTap(e) {
    if (!tap || e.pointerId !== tap.id) return;
    const quick = performance.now() - tap.at < 500 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 8;
    tap = null;
    if (quick && e.type === 'pointerup') act();
  }
  ui.canvasHost.addEventListener('pointerup', endTap);
  ui.canvasHost.addEventListener('pointercancel', endTap);

  let sliding = null;
  const slideTo = (e) => {
    const r = timeBar.getBoundingClientRect();
    cancelRun();
    setT(((e.clientX - r.left) / Math.max(r.width, 1)) * T_END);
  };
  timeBar.addEventListener('pointerdown', (e) => {
    if (s.locked) return lockedNudge();
    sliding = e.pointerId;
    s.scrub = true;
    capturePointer(timeBar, e.pointerId);
    slideTo(e);
    syncAction();
  });
  timeBar.addEventListener('pointermove', (e) => {
    if (sliding === e.pointerId) slideTo(e);
  });
  const endSlide = (e) => {
    if (sliding !== e.pointerId) return;
    sliding = null;
    s.scrub = false;
    releasePointer(timeBar, e.pointerId);
    stage.invalidate();
    syncAction();
  };
  timeBar.addEventListener('pointerup', endSlide);
  timeBar.addEventListener('pointercancel', endSlide);

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── the action ────────────────────────────────────────────────────────────────
  const done = () => s.t >= T_END - 1e-6;
  const labelOf = () => t(done() ? 'act_again' : 'act_run');
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: labelOf,
    icon: ICONS.play,
    target: () => lab.boxes.changed,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pad: 3,
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });
  function syncAction() {
    action.set({ label: labelOf, icon: done() ? ICONS.reset : ICONS.play, step: done() ? '' : 1, enabled: !s.run && !s.scrub && !s.locked });
  }
  function act() {
    if (s.locked) return lockedNudge();
    if (s.run || s.scrub) return;
    if (done()) return home();
    audio.tick();
    runTo(T_END, ((T_END - s.t) / T_END) * SECONDS);
  }
  function setFactor(factor, swap = false, { fly = true } = {}) {
    s.factor = FACTORS.includes(factor) ? factor : 'wind';
    s.swap = swap;
    lab.setCase(s.factor, s.swap);
    if (fly && !s.userMovedCamera) flyTo(viewPose(s.view), 0.6);
  }
  function home(factor = s.factor) {
    cancelRun();
    setFactor(factor);
    setT(0);
    syncUI();
  }

  // ── the test ──────────────────────────────────────────────────────────────────
  let learnSaved = null;
  let question = null;
  let lastFactor = '';
  function sceneFor(factor, swap) {
    cancelRun();
    setFactor(factor, swap, { fly: false });
    setT(0);
    syncUI();
    flyTo(viewPose(s.view), 0.5); // not awaited: the question shows at once, the camera arrives as it is read
  }
  function choicesOf(items, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ev-opt">${label(list[j])}</span>`,
      meta: {},
    };
  }
  const KINDS = ['first', 'factor', 'cloth', 'vol', 'factor'];
  // the book's examples: the first answer of each is the right one
  const SETS = {
    cloth: { factor: 'dry', q: 'q_cloth', prefix: 'c_cloth_', keys: ['humid', 'press', 'area', 'vol'] },
    vol: { factor: 'liquid', q: 'q_vol', prefix: 'c_vol_', keys: ['right', 'water', 'high', 'cold'] },
  };
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
        learnSaved = { t: s.t, factor: s.factor };
        cancelRun();
        s.mode = 'quiz';
        s.locked = true;
        lastFactor = '';
        syncUI();
        apply();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizNames = true;
        question = null;
        if (learnSaved) {
          setFactor(learnSaved.factor, false, { fly: false });
          setT(learnSaved.t);
          flyTo(viewPose(s.view), 0.4);
        }
        syncUI();
        apply();
      },
      async prepare(i, alive) {
        const kind = KINDS[i % KINDS.length];
        s.locked = true;
        s.quizNames = false;
        const swap = Math.random() < 0.5;
        if (kind === 'first' || kind === 'factor') {
          const factor = pickOne(FACTORS.filter((f) => f !== lastFactor));
          lastFactor = factor;
          sceneFor(factor, swap);
          if (!alive()) return null;
          question = { kind, factor, swap };
          if (kind === 'first') {
            const right = swap ? 'left' : 'right';
            const items = [right, right === 'left' ? 'right' : 'left', 'same', 'unknown'].map((key) => ({ key }));
            return { ...choicesOf(items, (x) => t(`c_${x.key}`)), text: t('q_first') };
          }
          const items = [factor, ...shuffle(FACTORS.filter((f) => f !== factor)).slice(0, 3)].map((key) => ({ key }));
          return { ...choicesOf(items, (x) => t(`fn_${x.key}`)), text: t('q_factor') };
        }
        const set = SETS[kind];
        sceneFor(set.factor, swap);
        if (!alive()) return null;
        question = { kind, factor: set.factor, swap };
        const items = set.keys.map((key) => ({ key, text: `${set.prefix}${key}` }));
        return { ...choicesOf(items, (x) => t(x.text)), text: t(set.q) };
      },
      reveal(q, correct, picked) {
        const wrong = correct ? null : q.list?.[picked?.index]?.key;
        const note = (key) => (wrong ? ` ${t(key)}` : '');
        s.quizNames = true;
        syncUI();
        apply();
        runTo(T_END, 3);
        if (question.kind === 'first') {
          const side = t(`side_${changedSide()}`);
          const mis = wrong === 'same' ? 'mis_same' : wrong === 'unknown' ? 'mis_unknown' : 'mis_side';
          return t('why_first', { side }) + note(mis);
        }
        if (question.kind === 'factor') return t('why_factor', { name: t(`fn_${question.factor}`) }) + note('mis_factor');
        if (question.kind === 'cloth') return t('why_cloth') + note('mis_cloth');
        return t('why_vol') + note('mis_vol');
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── buttons, keys ─────────────────────────────────────────────────────────────
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
    if (b.dataset.example && s.mode !== 'quiz') home(b.dataset.example);
    if (b.dataset.act === 'home' && s.mode !== 'quiz') home();
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
    const stepKey = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!stepKey || /** @type {Element} */ (e.target).closest?.('[role="radiogroup"]')) return;
    e.preventDefault();
    if (s.locked) return lockedNudge();
    cancelRun();
    setT(Math.round(s.t * 2) / 2 + stepKey * (e.shiftKey ? 2 : 0.5));
    syncAction();
  });

  // ── start ─────────────────────────────────────────────────────────────────────
  setFactor(s.factor, false, { fly: false });
  setT(Number(o.time) || 0, { silent: true });
  setView(s.view, { animate: false });
  syncUI();
  apply();
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
    /** Change any of: factor, time (0–10), view; animate: true plays to the new time. */
    async set(p = {}) {
      if (p.view) await setView(p.view, { animate: p.animate !== false });
      if (p.factor && p.factor !== s.factor) home(p.factor);
      if (p.time != null) {
        const to = Math.min(T_END, Math.max(0, Number(p.time)));
        if (p.animate === true) await runTo(to, (Math.abs(to - s.t) / T_END) * SECONDS);
        else {
          cancelRun();
          setT(to);
        }
      }
      syncAction();
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      home('wind');
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => lab.set,
  };
}
