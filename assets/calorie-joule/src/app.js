// Heat units (book page 161, topic 6.1), student view. The page ends with the units of heat: "যেহেতু এটা শক্তি তাই স্বাভাবিকভাবে
// অন্য শক্তির মতোই তার একক হচ্ছে জুল (J)। তাপের আরো একটি একক আছে, তার নাম ক্যালরি (cal)। 1 gm পানির তাপমাত্রা 1°C বাড়াতে হলে
// যে পরিমাণ তাপের দরকার সেটা হচ্ছে 1 ক্যালরি। 1 ক্যালরি হচ্ছে 4.2 J এর সমান", then the food calorie (k cal = 1000 ক্যালরি).
// So the figure shows exactly that: one gram of water in a small beaker over a burner, and a thermometer whose scale counts the
// °C the water has risen. One button gives one calorie of heat at a time (up to five): the flames flare, the red column rises
// one degree, and the panel keeps the sum, n cal = n × 4.2 J. The rule grows in the book's words (the calorie, the joule, the
// food calorie). Then a five-question test. Built on the shared student kit.
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
  CAL_J,
  FOOD_CAL,
  MAX_STEPS,
  QUIZ_RISES,
  WATER_G,
  calChoices,
  calToJChoices,
  fmt,
  foodChoices,
  jouleChoices,
  joules,
  nextCount,
  rise,
  waterChoices,
} from './reading.js';
import { createScene } from './scene.js';

export const DEFAULTS = {
  cal: 0, // 0 … 5: the calories of heat given so far
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const DOUBLE_TAP = 600; // ms
const LOOK = {
  box: [new THREE.Vector3(-9, 0, -3.8), new THREE.Vector3(9, 14.9, 3.8)],
  dir: new THREE.Vector3(0.1, 0.24, 1),
};
const MARGIN = { top: 48, bottom: 30, side: 6 };
const SHADOW_BOX = new THREE.Box3(new THREE.Vector3(-8, 0, -4), new THREE.Vector3(8, 16, 4));

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
  // the numbers every sentence may use (so no digit is ever written into a string)
  const V = { one: 1, k: fmt(CAL_J), g: WATER_G, d: 1, th: FOOD_CAL, ten: 42, hundred: 100, inv: fmt(+(1 / CAL_J).toFixed(2)) };
  const T = (key, vars) => t(key, { ...V, ...vars });

  root.classList.add('pvc', 'cj');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the formula under the result: the book's 1 cal = 4.2 J
  const eq = document.createElement('p');
  eq.className = 'cj-eq';
  eq.setAttribute('role', 'img');
  eq.setAttribute('aria-label', T('eq_label'));
  eq.innerHTML = T('eq_law');
  ui.learn.querySelector('.pvc-outcome').after(eq);
  const note = document.createElement('p');
  note.className = 'cj-note';
  note.textContent = T('unit_note');
  ui.learn.append(note);

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
  controls.minAzimuthAngle = -1.1;
  controls.maxAzimuthAngle = 1.1;
  const bgOn = o.bg !== 'transparent';
  if (bgOn) scene.background = new THREE.Color('#dcc7a8'); // the wall's own colour, if a turn ever looks past it
  scene.add(new THREE.HemisphereLight('#fff4e6', '#4a5f80', 0.85));
  const sun = new THREE.DirectionalLight('#fff3e0', 1.6);
  sun.position.set(-30, 70, 45);
  sun.target.position.set(1, 0, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#dfeaff', 0.5);
  fill.position.set(40, 25, 60);
  scene.add(fill);
  if (o.shadow && bgOn) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    fitShadow(sun, SHADOW_BOX);
  }
  const world = createScene({ background: bgOn, digits: (d) => N(d) });
  scene.add(world.root);

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
    n: Math.min(MAX_STEPS, Math.max(0, Math.round(Number(o.cal) || 0))), // the calories given (where it is going)
    rise: 0, // the thermometer's reading now (it moves there smoothly)
    shown: 0, // the whole calories the panel shows now
    maxSeen: 0, // the most calories reached (the rule grows with it)
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    heating: false,
    userMovedCamera: false,
    run: 0, // a token: every new step, reset or question bumps it
  };
  s.rise = rise(s.n);
  s.shown = s.n;
  s.maxSeen = s.n;
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // the flames flicker only while they burn: the ticker asks for frames only then
  stage.addTicker((_dt, time) => {
    if (world.flame <= 0.01) return false;
    world.flicker(time / 1000);
    return true;
  });

  // ── the heat ────────────────────────────────────────────────────────────────
  function applyRise(d) {
    s.rise = d;
    world.setRise(d);
    const whole = Math.round(d);
    if (whole !== s.shown) {
      s.shown = whole;
      s.maxSeen = Math.max(s.maxSeen, whole);
      refresh();
      syncLabels();
    }
    stage.invalidate();
  }
  /** Gives heat to go to n calories: the flames flare (one step) and the red column rises to n °C. */
  function heatTo(n, { jump = false, quiet = false } = {}) {
    const my = ++s.run;
    s.n = Math.min(MAX_STEPS, Math.max(0, n));
    const d0 = s.rise;
    const d1 = rise(s.n);
    if (!quiet) emit('heat', snapshot());
    if (jump || d0 === d1) {
      tweener.cancel('rise');
      tweener.cancel('flame');
      world.setFlames(0);
      s.heating = false;
      applyRise(d1);
      s.maxSeen = Math.max(s.maxSeen, s.n);
      refresh();
      emitChange();
      return Promise.resolve(true);
    }
    const heating = d1 > d0;
    s.heating = heating;
    if (heating) {
      tweener.animate({
        key: 'flame',
        duration: 1.3,
        onUpdate: (k) => my === s.run && world.setFlames(Math.min(1, Math.sin(Math.PI * k) * 1.25)),
        onComplete: () => world.setFlames(0),
      });
      if (!anno.has('heat'))
        anno.add('heat', {
          text: T('lbl_heat', { n: Math.round(d1 - d0) }),
          point: () => world.point.flame(),
          kind: 'heat',
          spots: [spot(-34, -6), spot(-34, 16), spot(34, -6)],
          optional: true,
        });
      else anno.update('heat', { text: T('lbl_heat', { n: Math.round(d1 - d0) }) });
    }
    return tweener
      .animate({
        key: 'rise',
        duration: 0.5 + Math.abs(d1 - d0) * 0.5,
        delay: heating ? 0.35 : 0,
        ease: ease.inOutCubic,
        onUpdate: (k) => my === s.run && applyRise(d0 + (d1 - d0) * k),
      })
      .finished.then((done) => {
        if (done && my === s.run) {
          applyRise(d1);
          s.heating = false;
          anno.has('heat') && anno.remove('heat');
          refresh();
          emitChange();
        }
        return done;
      });
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  let lastAgain = null;
  function refresh() {
    const n = s.shown;
    sheet.outcome(n === 0 ? T('out_0') : T('out_n', { cal: n, j: fmt(joules(n)), d: rise(n) }));
    sheet.rule(T(s.maxSeen >= MAX_STEPS ? 'rule_c' : s.maxSeen >= 3 ? 'rule_b' : 'rule_a'));
    const again = s.n >= MAX_STEPS;
    if (again !== lastAgain) {
      lastAgain = again;
      action?.set({ label: () => (again ? t('act_again') : T('act_heat', { n: 1 })), icon: again ? ICONS.reset : ICONS.hand });
    }
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const pt = { water: new THREE.Vector3(), scale: new THREE.Vector3(), tip: new THREE.Vector3() };
  function syncLabels() {
    const learn = s.mode !== 'quiz';
    const show = (id, def) => {
      if (!learn) return anno.has(id) && anno.remove(id);
      if (!anno.has(id)) anno.add(id, def);
      else anno.setText(id, def.text);
    };
    show('water', {
      text: T('lbl_water'),
      point: () => pt.water.copy(world.point.rim()),
      kind: 'water',
      spots: [spot(0, -22), spot(0, -38), spot(-30, -22)],
    });
    show('scale', {
      text: T('lbl_scale'),
      point: () => pt.scale.copy(world.point.thermoTop()),
      kind: 'scale',
      spots: [spot(0, -18), spot(-40, -18)],
    });
    if (s.shown > 0)
      show('rise', {
        text: T('lbl_rise', { d: s.shown }),
        point: () => pt.tip.copy(world.point.column(s.rise)),
        kind: 'rise',
        spots: [spot(-40, 0), spot(-40, 16), spot(-40, -16)],
      });
    else anno.has('rise') && anno.remove('rise');
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const fitBox = new THREE.Box3();
  function viewPose() {
    fitBox.min.copy(LOOK.box[0]);
    fitBox.max.copy(LOOK.box[1]);
    const aspect = stage.width / Math.max(1, stage.height);
    const dir = LOOK.dir.clone();
    if (aspect > 1.2) dir.y = Math.max(0.16, dir.y - (aspect - 1.2) * 0.1); // wide, short frames: a lower camera
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
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
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

  // ── the action: the big button, the ring round the flames ──────────────────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not give two calories
    lastAct = now();
    hintOff();
    heatTo(nextCount(s.n));
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: () => T('act_heat', { n: 1 }),
    target: () => (s.n >= MAX_STEPS ? null : world.flameBox),
    pad: 4,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
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
    showHint(T('q_locked'), { duration: 2400 });
    audio.error();
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    return {
      cal: s.n,
      joules: fmt(joules(s.n)) * 1,
      rise: rise(s.n),
      grams: WATER_G,
      maxSeen: s.maxSeen,
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.cal, snap.mode, snap.view]);
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
  /** The four choices, shuffled; the right one (key 'right') is the expected answer. */
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.findIndex((x) => x.key === 'right'),
      tolerance: 0.5,
      label: (j) => `<span class="cj-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const unit = (v, u) => `${N(String(v))}&nbsp;${u}`;
  let learnSaved = null;
  let question = null;
  let rises = [];
  const sceneAt = async (n, alive) => {
    for (const id of ['water', 'scale', 'rise', 'heat']) anno.has(id) && anno.remove(id);
    s.run++;
    tweener.cancel('rise');
    tweener.cancel('flame');
    world.setFlames(0);
    s.n = n;
    s.heating = false;
    applyRise(rise(n));
    await flyTo(viewPose(), 0);
    return alive();
  };
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
        learnSaved = { n: s.n, maxSeen: s.maxSeen };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        for (const id of ['water', 'scale', 'rise', 'heat']) anno.has(id) && anno.remove(id);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        syncUI();
        const saved = learnSaved || { n: 0, maxSeen: 0 };
        s.maxSeen = saved.maxSeen;
        s.userMovedCamera = false;
        heatTo(saved.n, { jump: true });
        syncLabels();
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        if (i === 0) rises = shuffle([...QUIZ_RISES]);
        const kind = ['calj', 'cal', 'water', 'joule', 'food'][i % 5];
        if (kind === 'calj') {
          if (!(await sceneAt(1, alive))) return null;
          question = { kind };
          return { text: T('q_calj'), ...choicesOf(calToJChoices(), kind, (x) => unit(fmt(x.v), 'J')) };
        }
        if (kind === 'cal') {
          const n = rises[0];
          if (!(await sceneAt(n, alive))) return null;
          question = { kind, n };
          return { text: T('q_cal'), ...choicesOf(calChoices(n), kind, (x) => unit(x.v, 'cal')) };
        }
        if (kind === 'water') {
          if (!(await sceneAt(0, alive))) return null;
          question = { kind };
          return { text: T('q_water'), ...choicesOf(waterChoices(), kind, (x) => unit(fmt(x.v), x.unit)) };
        }
        if (kind === 'joule') {
          const n = rises[1];
          if (!(await sceneAt(n, alive))) return null;
          question = { kind, n };
          return { text: T('q_joule'), ...choicesOf(jouleChoices(n), kind, (x) => unit(x.v, 'J')) };
        }
        if (!(await sceneAt(2, alive))) return null;
        question = { kind: 'food' };
        return { text: T('q_food'), ...choicesOf(foodChoices(), kind, (x) => unit(fmt(x.v), 'cal')) };
      },
      reveal(q, correct, picked) {
        const wrong = correct ? null : q.list?.[picked.index];
        const n = question.n ?? 1;
        const vars = { n, j: fmt(joules(n)), x: wrong ? fmt(wrong.v) : '' };
        const note = wrong ? ` ${T(`mis_${question.kind}_${wrong.key}`, vars)}` : '';
        return T(`why_${question.kind}`, vars) + note;
      },
      done() {
        s.locked = false;
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
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'home':
        if (s.locked) lockedNudge();
        else heatTo(0);
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
    const sceneKey =
      ['r', 'R', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (k === 'ArrowUp' || k === 'ArrowRight' || k === '+') heatTo(Math.min(MAX_STEPS, s.n + 1));
    else if (k === 'ArrowDown' || k === 'ArrowLeft' || k === '-') heatTo(Math.max(0, s.n - 1));
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') heatTo(0);
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  world.setRise(s.rise);
  refresh();
  syncLabels();
  flyTo(viewPose(), 0);
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
    /** Change any of: cal (0 … 5: calories given; each is 1 °C for 1 gm of water), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.cal != null) await heatTo(Number(p.cal), { jump: !animate });
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.maxSeen = 0;
      await heatTo(0, { jump: true });
      await setView('front', { animate: false });
      emitChange(true);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The beaker, the stand, the burner and the thermometer, in centimetres. */
    exportRoot: () => world.root,
  };
}
