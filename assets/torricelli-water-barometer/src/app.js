// Water instead of mercury (book page 145, topic 5.4.1), student view: one object, one button, one idea. In the
// schoolyard a tall glass pipe stands in a tub of water against a three-storey school, beside a small 76 cm mercury
// barometer and a measuring staff. One button fills the pipe the Torricelli way: the water rises to 10.3 m, nearly to
// the roof (the camera follows it up), and stops with a vacuum above. Water is 13.6 times lighter than mercury, so the
// same air's pressure holds up a column 13.6 times as tall. One outlined air-pressure arrow on the tub. The panel: one
// short line, the water's and the mercury's columns, the rule. Then a three-question test. Built on the shared kit.
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
import { boldArrow, dimensionLine } from './arrows.js';
import { SURFACE_Y, MOUTH_Y, barometerMaterials } from './barometer.js';
import { MINI_X, PIPE, TUB, createYard } from './yard.js';
import { H_HG, H_WATER, RATIO, round, toCm, waterChoices } from './reading.js';

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

const COLORS = { air: '#1c7ed6', h: '#e8590c', ink: '#1d2733' };
const AIR_LEN = 0.75; // the air arrow on the tub (m)
const TOP = TUB.water + H_WATER; // the water's top when it stops
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 12, side: 6 };
const DOWN = new THREE.Vector3(0, -1, 0);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const box3 = (x0, y0, x1, y1, z = 0.3) => [V(x0, y0, -z), V(x1, y1, z)];

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

  // the reading under the action: the water's column and the mercury's
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

  // the sky: a blue gradient
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4;
  skyCanvas.height = 256;
  {
    const ctx = /** @type {CanvasRenderingContext2D} */ (skyCanvas.getContext('2d'));
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#1d5fd1');
    g.addColorStop(0.45, '#3d8ae8');
    g.addColorStop(0.8, '#9cc8f3');
    g.addColorStop(1, '#d6eafb');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  }
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  if (o.bg !== 'transparent') {
    scene.background = skyTex;
    scene.fog = new THREE.Fog('#cfe3f7', 30, 120);
  }

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
  sun.position.set(6, 14, 9);
  sun.target.position.set(0, 4, 0);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.updateMatrixWorld();

  const yard = createYard(barometerMaterials(), { num: N });
  scene.add(yard.root);
  yard.mini.setPose(0, MOUTH_Y, 0); // the small barometer, settled at 76 cm
  yard.mini.setColumn(0, SURFACE_Y - MOUTH_Y + H_HG);

  // ── the arrow and the water's height ────────────────────────────────────────
  const airArrow = boldArrow('AirOnTub', COLORS.air, 0.028);
  const dimW = dimensionLine('WaterColumn', COLORS.h, 0.014, { dashed: true, ticks: 0.2 });
  scene.add(airArrow.root, dimW.root);

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
    phase: 'ready', // 'ready' | 'rising' | 'done'
    top: TUB.water, // the water's top in the pipe (world y)
    look: 'all', // 'all' | 'low' (the tub) | 'follow' (the water going up)
    found: false,
    show: { h: true, vacuum: true }, // the test hides some until the answer
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the scene from the state ────────────────────────────────────────────────
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  function syncScene() {
    yard.setWater(s.top);
    airArrow.set(V(0.29, TUB.water + AIR_LEN + 0.02, 0.1), DOWN, AIR_LEN);
    airArrow.scale(Math.min(3, Math.max(1, (2.6 * perPixel()) / 0.028)));
    dimW.hide();
    if (s.phase === 'done' && s.show.h) dimW.set(-PIPE.r - 0.16, TUB.water, s.top, 0.1);
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const plan = () => (s.phase === 'done' ? { label: 'act_replay', step: '' } : { label: 'act_water', step: s.found ? '' : 1 });
  function refresh() {
    if (s.phase === 'rising') sheet.outcome(t('out_w_rising'));
    else if (s.phase === 'done') sheet.outcome(t('out_w_done', { h: N(H_WATER) }));
    else sheet.outcome(t('out_w_ready', { L: N(Math.round(PIPE.top)) }));
    sheet.rule(s.phase === 'done' ? t('rule_water', { k: N(RATIO), hHg: N(76), h: N(H_WATER) }) : '');
    const w = s.phase === 'ready' ? '—' : `<b>${N(round(Math.max(0, s.top - TUB.water), 1))}&nbsp;${t('u_m')}</b>`;
    reading.innerHTML = t('read_water', { w, hg: N(toCm(H_HG)) });
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
    toScreen(airArrow.root.position, A0);
    toScreen(airArrow.tip, A1);
    return [{ left: Math.min(A0.x, A1.x) - 7, top: Math.min(A0.y, A1.y) - 7, right: Math.max(A0.x, A1.x) + 7, bottom: Math.max(A0.y, A1.y) + 7 }];
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
  const labelState = new Map();
  function syncLabels() {
    const want = new Map();
    if (s.look !== 'follow') {
      want.set('mini', {
        text: t('lbl_mini', { h: N(76) }),
        point: () => V(MINI_X, SURFACE_Y + H_HG * 0.6, 0.15),
        spots: [...LEFT_OF, ...ABOVE],
        color: COLORS.ink,
      });
      want.set('air', {
        text: t('lbl_air'),
        point: () => V(0.29, TUB.water + AIR_LEN * 0.8, 0.1),
        spots: [...RIGHT_OF, ...ABOVE],
        color: COLORS.air,
      });
    }
    if (s.phase === 'done' && s.show.h)
      want.set('water', {
        text: t('lbl_water', { h: N(H_WATER) }),
        point: () => V(-PIPE.r - 0.16, TUB.water + H_WATER * 0.55, 0.1),
        spots: [...LEFT_OF, ...RIGHT_OF],
        color: COLORS.h,
      });
    if (s.phase === 'done' && s.show.vacuum)
      want.set('vac', { text: t('lbl_vacuum'), point: () => V(0, (s.top + PIPE.top) / 2, 0), spots: [...RIGHT_OF, ...LEFT_OF], color: COLORS.ink });
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots });
        labelState.set(id, w.text);
      } else if (labelState.get(id) !== w.text) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, w.text);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const bbox = new THREE.Box3();
  function lookBox() {
    if (s.look === 'low') return box3(-1.25, -0.02, 0.75, 2.2);
    if (s.look === 'follow') {
      const y = Math.max(1.6, s.top);
      return box3(-1.0, y - 1.7, 0.75, y + 1.0);
    }
    return box3(-1.3, -0.05, 0.9, PIPE.top + 0.5);
  }
  function viewPose() {
    const b = lookBox();
    bbox.min.copy(b[0]);
    bbox.max.copy(b[1]);
    const d = V(0.18, 0.06, 1);
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
  const frame = (duration = 0.8) => (s.userMovedCamera ? Promise.resolve(true) : flyTo(viewPose(), duration));
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

  // ── the water rises ─────────────────────────────────────────────────────────
  const wait = (sec, key = 'wait') => tweener.animate({ key, duration: sec, onUpdate: () => {} }).finished;
  function stopAll() {
    s.run++;
    for (const k of ['water', 'camera']) tweener.cancel(k);
    s.busy = false;
    s.look = 'all';
  }
  function setDone() {
    s.top = TOP;
    s.phase = 'done';
    s.found = true;
  }
  function setReady() {
    s.top = TUB.water;
    s.phase = 'ready';
  }
  async function raiseWater(token) {
    s.phase = 'rising';
    s.busy = true;
    s.top = TUB.water;
    s.look = 'low';
    syncScene();
    refresh();
    await frame(0.8);
    if (token !== s.run) return;
    s.look = 'follow';
    refresh();
    const ok = await tweener.animate({
      key: 'water',
      duration: 3.4,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.top = TUB.water + H_WATER * k;
        if (!s.userMovedCamera) {
          const pose = viewPose();
          camera.position.copy(pose.position);
          controls.target.copy(pose.target);
          controls.update();
        }
        syncScene();
        refresh();
      },
    }).finished;
    if (!ok || token !== s.run) return;
    setDone();
    s.busy = false;
    s.look = 'all';
    audio.success();
    syncScene();
    refresh();
    emitChange();
    await frame(1.2);
  }

  // ── the action: the big button, the badge on the part ───────────────────────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    return raiseWater(++s.run);
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_water',
    target: () => V(0, TUB.water + 0.6, 0.1),
    radius: 26,
    pad: 8,
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
      phase: s.phase,
      height: round(Math.max(0, s.top - TUB.water), 2), // the water's column (m)
      mercury: toCm(H_HG), // the small barometer's column (cm)
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
    const key = JSON.stringify([snap.phase, snap.found, snap.mode, snap.view]);
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
  /** The three questions: how high the water stands, why so high, what is above it. */
  const KINDS = ['water', 'why', 'vacuum'];

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
        learnSaved = { done: s.phase === 'done' || s.phase === 'rising', found: s.found };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { h: true, vacuum: true };
        syncUI();
        stopAll();
        if (learnSaved?.done) setDone();
        else setReady();
        s.found = learnSaved?.found ?? s.found;
        s.userMovedCamera = false;
        syncScene();
        refresh();
        emitChange();
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        stopAll();
        if (kind === 'water') setReady();
        else setDone();
        s.show = { h: kind !== 'water', vacuum: kind !== 'vacuum' };
        s.userMovedCamera = false;
        syncScene();
        refresh();
        await flyTo(viewPose(), 0.6);
        if (!alive()) return null;
        question = { kind };
        if (kind === 'water') return { text: t('q_water'), ...choicesOf(waterChoices(), kind, (x) => mText(x.v)) };
        if (kind === 'why')
          return { text: t('q_w_why'), ...choicesOf(words(['c_ww_right', 'c_ww_wide', 'c_ww_more', 'c_ww_pull']), kind, (x) => t(x.key)) };
        return { text: t('q_w_vac'), ...choicesOf(words(['c_vac_right', 'c_vac_pull', 'c_vac_air', 'c_vac_press']), kind, (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const vars = { k: N(RATIO), hHg: N(76), h: N(H_WATER) };
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], vars)}` : '');
        if (k === 'water') {
          setDone();
          s.found = learnSaved?.found ?? s.found;
        }
        s.show = { h: true, vacuum: true };
        syncScene();
        refresh();
        if (k === 'water') return t('why_water', vars) + note({ same: 'mis_water_same', divide: 'mis_water_divide', tenth: 'mis_water_tenth' });
        if (k === 'why') return t('why_ww', vars) + note({ c_ww_wide: 'mis_ww_wide', c_ww_more: 'mis_ww_more', c_ww_pull: 'mis_ww_pull' });
        return t('why_w_vac') + note({ c_vac_pull: 'mis_ww_pull', c_vac_air: 'mis_w_air', c_vac_press: 'mis_w_press' });
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
    setReady();
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

  /** Waits for whatever the student (or set) started to finish. */
  async function settle() {
    for (let i = 0; i < 400 && s.busy; i++) await wait(0.05, 'settle');
  }

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /** Change any of: water ('ready' | 'done'), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.water === 'done') {
        stopAll();
        if (animate) {
          lastAct = Number.NEGATIVE_INFINITY;
          doAction();
          await settle();
        } else {
          setDone();
          syncScene();
          flyTo(viewPose(), 0);
        }
      } else if (p.water === 'ready') {
        stopAll();
        setReady();
        syncScene();
        flyTo(viewPose(), 0);
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = false;
      s.show = { h: true, vacuum: true };
      await setView('front', { animate: false });
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The pipe in its tub, the small barometer and the staff (the yard as it stands), in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'WaterBarometer';
      g.add(yard.root.clone(true));
      return g;
    },
  };
}
