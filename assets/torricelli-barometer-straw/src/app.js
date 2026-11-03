// The straw (book page 145, topic 5.4.1), student view: one object, one button, one idea. A bottle of cold drink with
// a clear straw bending into a child's mouth (a head from the side, the inside of the mouth shown through a cut). One
// outlined blue arrow shows the outside air's pressure on the drink, one the air's pressure in the mouth. Without
// sucking they are equal and the drink in the straw stays at the bottle's level; a tap on চুমুক দাও shortens the
// mouth's arrow and the outside air pushes the drink up to the mouth. The panel: one short line, the mouth's pressure
// against the outside air's, the rule. Then a three-question test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { boldArrow } from './arrows.js';
import { createLab } from './lab.js';
import { sceneMaterials } from './materials.js';
import { createStraw, DRINK_Y, MOUTH, STRAW } from './straw.js';
import { H_WATER, toCm, waterChoices } from './reading.js';

export const DEFAULTS = {
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { air: '#1c7ed6', ink: '#1d2733' };
const AIR_LEN = 0.046; // the air arrows at the outside air's pressure (m)
const STRAW_X = 0.09; // where the bottle stands
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 12, side: 6 };
const DOWN = new THREE.Vector3(0, -1, 0);
const RIGHT = new THREE.Vector3(1, 0, 0);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'tb');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, { lines: { action: 1, outcome: 2, rule: 3 } }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the reading under the action: the mouth's pressure against the outside air's
  const reading = document.createElement('div');
  reading.className = 'tb-read';
  $('.pvc-act-row').after(reading);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 220, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI * 0.53;

  scene.add(new THREE.HemisphereLight('#e3eeff', '#8a5a34', 0.95));
  const sun = new THREE.DirectionalLight('#fff0d8', 2.1);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#d2e2ff', 0.55);
  fill.position.set(-2, 1.4, 2.6);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.01;
  }
  sun.position.set(1.3, 2.4, 1.8);
  sun.target.position.set(0, 0.4, 0);
  Object.assign(sun.shadow.camera, { left: -0.9, right: 0.9, top: 1, bottom: -0.9, near: 0.5, far: 6 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : new THREE.Color('#5b7a8c'); // the lab's painted wall colour

  const lab = createLab();
  const straw = createStraw(sceneMaterials());
  straw.root.position.x = STRAW_X;
  scene.add(lab.root, straw.root);

  // ── the two arrows: the outside air on the drink, the air in the mouth ───────
  const outside = boldArrow('AirOnDrink', COLORS.air, 0.0022);
  const mouth = boldArrow('AirInMouth', COLORS.air, 0.0022, { order: 36 });
  scene.add(outside.root, mouth.root);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    suck: false,
    drink: DRINK_Y, // the drink's top in the straw (world y)
    mouthP: 1, // the mouth's pressure, as a fraction of the outside air's
    found: false, // the student has sucked once
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the scene from the state ────────────────────────────────────────────────
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  const thick = () => Math.min(3, Math.max(1, (2.4 * perPixel()) / 0.0022));
  function syncScene() {
    straw.setLevel(s.drink);
    outside.set(V(STRAW_X + 0.0135, DRINK_Y + AIR_LEN + 0.002, 0.02), DOWN, AIR_LEN);
    outside.scale(thick());
    // the mouth's pressure: in the pocket of air, pointing at the straw's end
    const ml = AIR_LEN * s.mouthP;
    const tipX = STRAW_X + MOUTH.x - 0.02;
    mouth.set(V(tipX - ml, MOUTH.y, straw.zFace + 0.012), RIGHT, ml);
    mouth.scale(thick());
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const plan = () => (s.suck ? { label: 'act_stop', step: '' } : { label: 'act_suck', step: s.found ? '' : 1 });
  function refresh() {
    sheet.outcome(!s.suck ? t('out_straw_rest') : s.drink >= STRAW.top - 1e-4 ? t('out_straw_up') : t('out_straw_suck'));
    sheet.rule(s.found ? t('rule_straw1', { h: N(H_WATER) }) : t('rule_straw0'));
    reading.innerHTML = t('read_mouth', { p: t(s.mouthP < 0.99 ? 'read_less' : 'read_same') });
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label, enabled: true });
      if (p.step !== '' && !s.busy && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const A0 = { x: 0, y: 0 };
  const A1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  function arrowBoxes() {
    return [outside, mouth].map((a) => {
      toScreen(a.root.position, A0);
      toScreen(a.tip, A1);
      return { left: Math.min(A0.x, A1.x) - 7, top: Math.min(A0.y, A1.y) - 7, right: Math.max(A0.x, A1.x) + 7, bottom: Math.max(A0.y, A1.y) + 7 };
    });
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(14, 0), spot(14, -16), spot(14, 16), spot(20, -30)];
  const LEFT_OF = [spot(-14, 0), spot(-14, -16), spot(-14, 16), spot(-20, -30)];
  const ABOVE = [spot(0, -18), spot(16, -18), spot(-16, -18), spot(0, -34)];
  function syncLabels() {
    if (!anno.has('outside'))
      anno.add('outside', {
        text: t('lbl_outside'),
        point: () => V(STRAW_X + 0.0135, DRINK_Y + AIR_LEN * 0.7, 0.02),
        kind: 'force',
        color: COLORS.air,
        spots: [...RIGHT_OF, ...ABOVE],
      });
    if (!anno.has('mouth'))
      anno.add('mouth', {
        text: t('lbl_mouth'),
        point: () => V(STRAW_X + MOUTH.x - 0.035, MOUTH.y + 0.006, straw.zFace),
        kind: 'force',
        color: COLORS.air,
        spots: [...ABOVE, ...LEFT_OF],
      });
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const bbox = new THREE.Box3(V(-0.17, 0.05, -0.08), V(0.15, 0.56, 0.08));
  function viewPose() {
    const d = V(0.35, 0.26, 1);
    if (s.view === '3d') d.add(V(0.7, 0.25, 0));
    return fitPose({ box: bbox, dir: d.normalize(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      syncScene();
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
        syncScene();
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
  controls.addEventListener('start', () => {
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  controls.addEventListener('change', () => syncScene());
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── sucking ─────────────────────────────────────────────────────────────────
  const wait = (sec, key = 'wait') => tweener.animate({ key, duration: sec, onUpdate: () => {} }).finished;
  function stopAll() {
    s.run++;
    tweener.cancel('straw');
    s.busy = false;
  }
  function rest() {
    s.suck = false;
    s.drink = DRINK_Y;
    s.mouthP = 1;
  }
  async function suck(on, token, { animate = true } = {}) {
    s.suck = on;
    const from = s.drink;
    const to = on ? STRAW.top + 0.001 : DRINK_Y;
    const p0 = s.mouthP;
    const p1 = on ? 0.62 : 1;
    s.busy = animate;
    refresh();
    const set = (k) => {
      s.mouthP = p0 + (p1 - p0) * Math.min(1, k * 3);
      s.drink = from + (to - from) * k;
      syncScene();
    };
    if (animate) {
      if (on) audio.pop();
      const ok = await tweener.animate({ key: 'straw', duration: on ? 1.4 : 0.9, ease: ease.inOutCubic, onUpdate: set }).finished;
      if (!ok || token !== s.run) return;
    }
    set(1);
    s.busy = false;
    if (on) s.found = true;
    refresh();
    emitChange();
  }

  // ── the action: the big button, the badge on the part, a tap on the part ─────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    return suck(!s.suck, ++s.run);
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_suck',
    target: () => V(STRAW_X, DRINK_Y + 0.11, 0.02),
    radius: 26,
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
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(straw.hitMeshes, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return;
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'pointer') : '';
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
    return {
      suck: s.suck,
      rise: toCm(Math.max(0, s.drink - DRINK_Y)), // the drink in the straw above the bottle's level (cm)
      mouth: Math.round(s.mouthP * 100) / 100, // the mouth's pressure / the outside air's
      busy: s.busy,
      found: s.found,
      next: plan().label.replace('act_', ''),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.suck, snap.found, snap.mode, snap.view]);
    if (key === lastEmitted) return;
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
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="tb-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const mText = (v) => (v < 1 ? `${N(toCm(v))}&nbsp;cm` : `${N(v)}&nbsp;m`);
  const words = (keys) => keys.map((key) => ({ key }));
  /** The three questions: no sucking, sucking, how high at most. */
  const KINDS = ['rest', 'suck', 'max'];

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
        learnSaved = { suck: s.suck, found: s.found };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        syncUI();
        stopAll();
        rest();
        if (learnSaved?.suck) suck(true, s.run, { animate: false });
        s.found = learnSaved?.found ?? s.found;
        syncScene();
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        stopAll();
        rest();
        if (kind === 'suck') await suck(true, s.run, { animate: false });
        syncScene();
        refresh();
        await wait(0.3);
        if (!alive()) return null;
        question = { kind };
        if (kind === 'rest')
          return { text: t('q_straw'), ...choicesOf(words(['c_st_right', 'c_st_noair', 'c_st_narrow', 'c_st_down']), kind, (x) => t(x.key)) };
        if (kind === 'suck')
          return { text: t('q_st_suck'), ...choicesOf(words(['c_su_right', 'c_su_pull', 'c_su_straw', 'c_su_light']), kind, (x) => t(x.key)) };
        return { text: t('q_st_max'), ...choicesOf(waterChoices(), kind, (x) => mText(x.v)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        if (k === 'rest') return t('why_straw') + note({ c_st_noair: 'mis_st_noair', c_st_narrow: 'mis_st_narrow', c_st_down: 'mis_st_down' });
        if (k === 'suck') return t('why_su') + note({ c_su_pull: 'mis_su_pull', c_su_straw: 'mis_su_straw', c_su_light: 'mis_su_light' });
        return t('why_st_max', { h: N(H_WATER) }) + note({ same: 'mis_st_same', divide: 'mis_st_small', tenth: 'mis_st_small' });
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
  function goHome() {
    stopAll();
    rest();
    s.userMovedCamera = false;
    syncScene();
    refresh();
    emitChange();
    return flyTo(viewPose(), 0.6);
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
    const sceneKey = ['r', 'R', 'Home'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  flyTo(viewPose(), 0);
  syncScene();
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
    /** Change any of: suck (true | false), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.suck != null) {
        stopAll();
        await suck(Boolean(p.suck), s.run, { animate });
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = false;
      await setView('front', { animate: false });
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The bottle, the straw and the head, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Straw';
      g.add(straw.root.clone(true));
      return g;
    },
  };
}
