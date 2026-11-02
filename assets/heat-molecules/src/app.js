// Heat and temperature (book page 161, topic 6.1), student view. The page has no picture, only the story of the
// molecules: heat is energy, "তাপশক্তি বলতে আমরা যেটা বোঝাই সেটা আসলে পদার্থের অণুগুলোর সম্মিলিত গতিশক্তি ছাড়া কিছু নয়".
// So the figure shows the molecules the page asks the student to imagine: 60 of them in a glass container over a
// burner, with a thermometer beside it. One button, "তাপ দাও", gives heat one step at a time (six steps): a solid's
// molecules shake about their places, shake more when heated, break free of the forces between them into a liquid
// (darting about among each other, faster when hotter), then free of the molecular bonds altogether as a gas, faster
// still. The three words কঠিন / তরল / গ্যাস jump to a state. The panel says the book's sentence for each step and the
// rule. Then a five-question test. Built on the shared student kit.
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
  FIRST_STEP,
  LAST_STEP,
  LEVELS,
  MORE_KEYS,
  NAME_KEYS,
  STATES,
  STEPS_OF,
  doingChoices,
  energyOf,
  nextStep,
  speedOf,
  stateOf,
  stepOf,
} from './reading.js';
import { FLOOR_Y, JAR, JAR_TOP, createScene } from './scene.js';

export const DEFAULTS = {
  step: 0, // 0 … 5: the step of the heat button (0 = a cold solid)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  motion: true, // false: the molecules are drawn settled and still (the poster, a low-power embed)
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const DOUBLE_TAP = 400; // ms
const LOOK = {
  box: [new THREE.Vector3(-10.4, 0.3, -3.2), new THREE.Vector3(11.8, JAR_TOP + 1.8, 3.2)],
  dir: new THREE.Vector3(0.12, 0.26, 1),
};
const MARGIN = { top: 48, bottom: 30, side: 6 };
const SHADOW_BOX = new THREE.Box3(new THREE.Vector3(-8, 0, -4), new THREE.Vector3(12, 16, 4));

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

  root.classList.add('pvc', 'hm');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', results: true, items: STATES.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 3, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the speed of the molecules as a bar (more heat, faster molecules), under the result line
  const meter = document.createElement('div');
  meter.className = 'hm-meter';
  meter.setAttribute('role', 'meter');
  meter.setAttribute('aria-label', t('meter_label'));
  meter.setAttribute('aria-valuemin', '0');
  meter.setAttribute('aria-valuemax', '100');
  meter.innerHTML = `<span class="hm-m-l">${t('meter_label')}</span><span class="hm-bar"><i></i></span><span class="hm-m-r"><small>${t('meter_low')}</small><small>${t('meter_high')}</small></span>`;
  ui.learn.querySelector('.pvc-outcome').after(meter);
  const meterFill = meter.querySelector('i');
  let lastMeter = -1;

  // the formula under the result: the book's definition of heat energy
  const eq = document.createElement('p');
  eq.className = 'hm-eq';
  eq.setAttribute('role', 'img');
  eq.setAttribute('aria-label', t('eq_label'));
  eq.innerHTML = t('eq_law');
  meter.after(eq);
  const note = document.createElement('p');
  note.className = 'hm-note';
  note.textContent = t('unit_note');
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
  sun.target.position.set(2, 0, 0);
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
  const world = createScene({ background: bgOn });
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
    step: Math.min(LAST_STEP, Math.max(0, Math.round(Number(o.step) || 0))), // where the heat is going
    h: 0, // the heat level now (it moves there smoothly)
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    seen: { solid: false, liquid: false, gas: false },
    userMovedCamera: false,
    heatRun: 0, // a token: every new heat step, reset or question bumps it
  };
  s.h = LEVELS[s.step];
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // the molecules and the flames move all the time (a solid's shake is slow but never stops); with motion off they are
  // settled by a short run-up and drawn still, and move only while the heat changes
  const motion = !(o.motion === false || o.motion === 0 || o.motion === '0');
  function settle() {
    if (motion) return;
    for (let i = 0; i < 90; i++) world.update(1 / 30, s.h);
    world.flicker(0);
    stage.invalidate();
  }
  stage.addTicker((dt, time) => {
    if (!motion && !tweener.busy) return false;
    world.update(dt, s.h);
    world.flicker(time / 1000);
    return true;
  });

  // ── the heat ────────────────────────────────────────────────────────────────
  function applyHeat(h) {
    s.h = h;
    world.setHeat(h);
    const st = stateOf(h);
    if (s.mode !== 'quiz') s.seen[st] = true;
    refresh();
  }
  function heatTo(step, { jump = false, quiet = false } = {}) {
    const my = ++s.heatRun;
    s.step = Math.min(LAST_STEP, Math.max(0, step));
    const h0 = s.h;
    const h1 = LEVELS[s.step];
    if (!quiet) emit('heat', snapshot());
    if (jump || h0 === h1) {
      tweener.cancel('heat');
      applyHeat(h1);
      settle();
      emitChange();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: 'heat',
        duration: 0.9 + Math.abs(h1 - h0) * 1.6,
        ease: ease.inOutCubic,
        onUpdate: (k) => my === s.heatRun && applyHeat(h0 + (h1 - h0) * k),
      })
      .finished.then((done) => {
        if (done && my === s.heatRun) {
          applyHeat(h1);
          settle();
          emitChange();
        }
        return done;
      });
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  let lastState = '';
  let lastAgain = null;
  function refresh() {
    const st = stateOf(s.h);
    const step = stepOf(s.h);
    sheet.choose(st);
    const seenAll = STATES.every((k) => s.seen[k]);
    for (const k of STATES) sheet.result(k, s.seen[k] ? t(`res_${k}`) : '');
    sheet.next(st === 'gas' ? null : STATES[STATES.indexOf(st) + 1]);
    sheet.outcome(t(`out_${step}`));
    const pct = Math.round((speedOf(s.h) / speedOf(1)) * 50) * 2; // in steps of 2 %: the DOM changes only when it shows
    if (pct !== lastMeter) {
      lastMeter = pct;
      meterFill.style.setProperty('--p', `${pct}%`);
      meter.setAttribute('aria-valuenow', String(pct));
    }
    sheet.rule(t(seenAll ? 'rule_b' : 'rule_a'));
    const again = s.step >= LAST_STEP;
    if (again !== lastAgain) {
      lastAgain = again;
      action?.set({ label: again ? 'act_again' : 'act_heat', icon: again ? ICONS.reset : ICONS.hand });
    }
    if (st !== lastState) {
      lastState = st;
      syncLabels();
    }
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const pt = {
    jar: new THREE.Vector3(-JAR.w / 2, FLOOR_Y + 7.5, 0),
    thermo: new THREE.Vector3(),
  };
  function syncLabels() {
    const learn = s.mode !== 'quiz';
    const show = (id, def) => {
      if (!learn) return anno.has(id) && anno.remove(id);
      if (!anno.has(id)) anno.add(id, def);
    };
    show('state', {
      text: t(`lbl_${stateOf(s.h)}`),
      point: () => pt.jar,
      kind: 'state',
      spots: [spot(-14, 0), spot(-14, -22), spot(-14, 22), spot(0, -26)],
    });
    if (anno.has('state') && learn) anno.setText('state', t(`lbl_${stateOf(s.h)}`));
    show('temp', {
      text: t('lbl_temp'),
      point: () => pt.thermo.copy(world.point.thermoTop()),
      kind: 'temp',
      spots: [spot(0, -18), spot(-30, -18), spot(-60, -18)],
    });
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
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not give two steps of heat
    lastAct = now();
    hintOff();
    audio.pop?.();
    heatTo(nextStep(s.step));
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_heat',
    target: () => (s.step >= LAST_STEP ? null : world.flameBox),
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
    showHint(t('q_locked'), { duration: 2400 });
    audio.error();
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    return {
      step: s.step,
      heat: +s.h.toFixed(3),
      state: stateOf(s.h),
      speed: +speedOf(s.h).toFixed(2),
      energy: +energyOf(s.h).toFixed(2),
      seen: { ...s.seen },
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.state, snap.mode, snap.view]);
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
  function choicesOf(keys, kind) {
    const list = shuffle(keys.map((k) => k));
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(keys[0]),
      tolerance: 0.5,
      label: (j) => `<span class="hm-opt">${t(`c_${list[j]}`)}</span>`,
      meta: { kind, answer: keys[0] },
    };
  }
  let learnSaved = null;
  let question = null;
  let order = [];
  const sceneStep = async (step, alive) => {
    labelsOff();
    s.heatRun++;
    tweener.cancel('heat');
    s.step = step;
    applyHeat(LEVELS[step]);
    settle();
    await flyTo(viewPose(), 0);
    return alive();
  };
  const labelsOff = () => {
    for (const id of ['state', 'temp']) anno.has(id) && anno.remove(id);
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
        learnSaved = { step: s.step, seen: { ...s.seen } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        labelsOff();
        world.setGauges(false);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        world.setGauges(true);
        syncUI();
        const saved = learnSaved || { step: 0, seen: s.seen };
        s.seen = { ...saved.seen };
        s.userMovedCamera = false;
        heatTo(saved.step, { jump: true });
        syncLabels();
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        if (i === 0) order = shuffle([...STATES]);
        if (i < 3) {
          const state = order[i];
          const step = pickOne(STEPS_OF[state]);
          if (!(await sceneStep(step, alive))) return null;
          question = { kind: 'state', state, step };
          return { text: t('q_state'), ...choicesOf(doingChoices(state), 'state') };
        }
        if (i === 3) {
          const step = pickOne([1, 3, 4]);
          if (!(await sceneStep(step, alive))) return null;
          question = { kind: 'more', step };
          return { text: t('q_more'), ...choicesOf(MORE_KEYS, 'more') };
        }
        const step = pickOne([1, 3, 5]);
        if (!(await sceneStep(step, alive))) return null;
        question = { kind: 'name', step };
        return { text: t('q_name'), ...choicesOf(NAME_KEYS, 'name') };
      },
      reveal(q, correct, picked) {
        const wrong = correct ? null : q.list?.[picked.index];
        const note = wrong ? ` ${t(`mis_${wrong}`)}` : '';
        if (question.kind === 'state') return t(`why_${question.state}`) + note;
        if (question.kind === 'more') return t('why_more') + note;
        return t('why_name') + note;
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
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else heatTo(FIRST_STEP[b.dataset.example]);
    }
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
    if (tgt.closest('.pvc-examples') && e.key.startsWith('Arrow')) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey =
      ['1', '2', '3', 'r', 'R', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-'].includes(k) ||
      ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) heatTo(FIRST_STEP[STATES[Number(k) - 1]]);
    else if (k === 'ArrowUp' || k === 'ArrowRight' || k === '+') heatTo(Math.min(LAST_STEP, s.step + 1));
    else if (k === 'ArrowDown' || k === 'ArrowLeft' || k === '-') heatTo(Math.max(0, s.step - 1));
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
  applyHeat(s.h);
  settle();
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
    /** Change any of: step (0 … 5), state ('solid' | 'liquid' | 'gas': its first step), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.state && p.step == null && FIRST_STEP[p.state] != null) await heatTo(FIRST_STEP[p.state], { jump: !animate });
      if (p.step != null) await heatTo(Number(p.step), { jump: !animate });
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.seen = { solid: false, liquid: false, gas: false };
      await heatTo(0, { jump: true });
      await setView('front', { animate: false });
      emitChange(true);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The container with its molecules, the burner, the stand and the thermometer, in centimetres. */
    exportRoot: () => world.root,
  };
}
