// Pressure and boiling point (book page 182, topic 6.7), student view. One pot of water on a stove, three places the
// book names: an open pot (the usual air pressure), high on a mountain (low pressure: climbers' food takes longer) and a
// pressure cooker (steam shut in raises the pressure: cooking is quicker). One big button lights the fire; the water
// heats until it boils and the thermometer's red thread stops at that case's boiling point, the usual 100° C marked.
// Red arrows press down on the water: short on the mountain, longer in the cooker. The panel gives the pressure, the
// boiling point and the cooking time, and the rule in the book's words; a five-question test follows. Built on the
// shared student kit. The book gives no temperatures: 90 and 120 are round figures marked "about".
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
import { createArrowSet } from './arrows.js';
import { POT, THERM, createWorld, wallTexture } from './scene.js';
import {
  BOIL_S,
  CASES,
  DATA,
  HEAT_S,
  QUIZ_KINDS,
  SCENES,
  T_REF,
  bubbleIntensity,
  fixCase,
  mercuryLevel,
  nextCase,
  nextOf,
  phaseOf,
  tempAt,
} from './reading.js';

export const DEFAULTS = {
  case: 'plain', // 'plain' | 'mountain' | 'cooker'
  boil: false, // start with the water already boiling
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { press: '#e03131', ref: '#c92a2a', read: '#0b7285' };
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 12, side: 8 };
const FOCUS = new THREE.Box3(new THREE.Vector3(-0.17, 0, -0.14), new THREE.Vector3(0.17, 0.31, 0.14));
const VIEW_DIRS = { front: new THREE.Vector3(0.28, 0.4, 1), '3d': new THREE.Vector3(0.9, 0.45, 0.7) };
const DOWN = new THREE.Vector3(0, -1, 0);
const ARROW_AT = [
  [-0.07, -0.01],
  [-0.025, -0.01],
  [0.02, -0.01],
];
const SURFACE_Y = POT.y + 0.018 + POT.water + 0.006; // world: just above the water

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'pb');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side', // the panel beside the 3D on landscape frames
    learn: cleanSheet(t, {
      examples: { label: 'cases', results: false, items: CASES.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the readings under the action: the pressure on the pot, the boiling point, how long cooking takes
  const read = document.createElement('div');
  read.className = 'pb-read';
  read.innerHTML = ['p', 'bp', 'cook']
    .map((id) => `<div class="pb-row k-${id}" data-row="${id}"><span class="pb-dot"></span><span class="pb-k"></span><b class="pb-v"></b></div>`)
    .join('');
  $('.pvc-act-row').after(read);
  const note = document.createElement('p');
  note.className = 'pb-note';
  ui.learn.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 28, near: 0.02, far: 40, environment: 'room', environmentIntensity: 0.6 });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.4;
  controls.maxPolarAngle = Math.PI * 0.5;
  scene.background = o.bg !== 'transparent' ? wallTexture() : null;
  scene.add(new THREE.HemisphereLight('#d8e6ff', '#b88a6a', 0.9));
  const sun = new THREE.DirectionalLight('#fff0dc', 2.2);
  sun.position.set(0.5, 1.1, 0.8);
  sun.target.position.set(0, 0.1, 0);
  scene.add(sun, sun.target);
  const fillLight = new THREE.DirectionalLight('#cfe2ff', 0.45);
  fillLight.position.set(-1, 0.6, 1.2);
  scene.add(fillLight);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.004;
    Object.assign(sun.shadow.camera, { left: -0.4, right: 0.4, top: 0.4, bottom: -0.4, near: 0.3, far: 3 });
    sun.shadow.camera.updateProjectionMatrix();
  }

  const world = createWorld();
  const { pot, stove } = world;
  scene.add(world.root);
  // the arrows: three red arrows pressing down on the water, outlined
  const arrows = createArrowSet({
    count: 3,
    color: COLORS.press,
    outline: '#ffffff',
    radius: 0.0052,
    head: 0.026,
    headRadius: 0.0145,
    pad: 0.0028,
    name: 'Pressure',
  });
  scene.add(arrows.root);

  const tweener = createTweener();
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    c: fixCase(o.case),
    k: 0, // 0 cold … 1 boiling
    bt: 0, // s: how long it has been bubbling (the bubbles rest after BOIL_S)
    busy: '', // '' | 'heat'
    tried: { plain: false, mountain: false, cooker: false }, // cases that have been boiled
    show: { arrows: true, reading: true, labels: true }, // the test hides what would give an answer away
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    run: 0, // a token: every heating, case change or reset bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the picture, from the state ─────────────────────────────────────────────
  const from = new THREE.Vector3();
  const temp = () => tempAt(s.c, s.k);
  function apply() {
    const d = DATA[s.c];
    pot.lid.visible = s.c === 'cooker';
    const lit = s.k > 0;
    stove.flame.visible = lit;
    /** @type {THREE.MeshStandardMaterial} */ (stove.ring.material).emissive.set(lit ? '#ff5a00' : '#000000');
    pot.therm.setLevel(mercuryLevel(temp()));
    pot.setBubbles(s.bt, bubbleIntensity(s.c, s.k));
    if (s.show.arrows) ARROW_AT.forEach(([x, z], i) => arrows.set(i, from.set(x, SURFACE_Y + d.arrow, z), DOWN, d.arrow));
    else arrows.hideAll();
    stage.invalidate();
  }
  /** Bubbles rise while the water heats and for a few seconds of boiling, then the picture rests (nothing draws when idle). */
  stage.addTicker((dt) => {
    const busy = tweener.tick(dt);
    const running = s.k > 0 && bubbleIntensity(s.c, s.k) > 0 && (s.busy === 'heat' || s.bt < BOIL_S);
    if (running) {
      s.bt += dt;
      pot.setBubbles(s.bt, bubbleIntensity(s.c, s.k));
    }
    return running || busy;
  });

  // ── the panel ───────────────────────────────────────────────────────────────
  const phase = () => phaseOf({ k: s.k, heating: s.busy === 'heat' });
  const rowEls = {
    p: /** @type {HTMLElement} */ (read.querySelector('[data-row="p"]')),
    bp: /** @type {HTMLElement} */ (read.querySelector('[data-row="bp"]')),
    cook: /** @type {HTMLElement} */ (read.querySelector('[data-row="cook"]')),
  };
  const rowKey = new Map();
  function setRow(id, key, label, value) {
    const el = rowEls[id];
    const k = `${key}|${label}|${value}`;
    if (rowKey.get(id) === k) return;
    rowKey.set(id, k);
    el.classList.toggle('on', key !== 'off');
    /** @type {HTMLElement} */ (el.querySelector('.pb-k')).textContent = label;
    /** @type {HTMLElement} */ (el.querySelector('.pb-v')).textContent = value;
  }
  const bpText = () => (s.c === 'plain' ? t('val_bp_plain', { tb: DATA.plain.tb }) : t('val_bp_other', { tb: DATA[s.c].tb }));
  const cookText = () => t({ slow: 'val_slow', normal: 'val_normal_cook', fast: 'val_fast' }[DATA[s.c].cooking]);
  let lastNote = '';
  function refresh() {
    const ph = phase();
    const d = DATA[s.c];
    const vars = { tb: d.tb };
    sheet.choose(s.c);
    sheet.next(ph === 'boiling' && !s.locked ? nextCase(s.c) : null);
    sheet.outcome(t(ph === 'idle' ? `out_idle_${s.c}` : ph === 'heating' ? 'out_heating' : `out_boil_${s.c}`, vars));
    sheet.rule(t(`rule_${s.c}`, { tb: T_REF }));
    setRow('p', 'on', t('cell_p'), t(`val_${d.pressure === 'normal' ? 'normal' : d.pressure}`));
    const shown = ph === 'boiling';
    setRow('bp', shown ? 'on' : 'off', t('cell_bp'), shown ? bpText() : t('none'));
    setRow('cook', shown ? 'on' : 'off', t('cell_cook'), shown ? cookText() : t('none'));
    const nk = ph === 'heating' ? t('note_time') : s.tried.cooker && s.mode !== 'quiz' ? t('note_gas') : '';
    if (nk !== lastNote) {
      lastNote = nk;
      note.textContent = nk;
    }
    if (action) {
      const next = nextOf(s.k, false);
      action.set(s.busy ? { label: 'act_heating', step: '' } : { label: next === 'heat' ? 'act_heat' : 'act_next', step: next === 'heat' ? 1 : 2 });
      if (s.busy) action.hide('busy');
      else action.show('busy');
    }
    syncLabels();
    apply();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT = [spot(22, 0), spot(22, -22), spot(22, 22), spot(44, -30), spot(44, 30), spot(66, 0)];
  const LEFT = [spot(-22, 0), spot(-22, -22), spot(-22, 22), spot(-44, -30), spot(-44, 30), spot(-66, 0)];
  const ABOVE = [spot(0, -26), spot(28, -26), spot(-28, -26), spot(0, -46), spot(46, -38), spot(-46, -38)];
  const tmp = new THREE.Vector3();
  const P0 = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };
  const toScreen = (p, out) => {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  };
  /** Each shown arrow as three small boxes along it (the labels keep clear of it). */
  function arrowBoxes() {
    const list = [];
    for (let i = 0; i < arrows.count; i++) {
      if (!arrows.shown[i]) continue;
      toScreen(arrows.tails[i], P0);
      toScreen(arrows.tips[i], P1);
      for (let k = 0; k < 3; k++) {
        const x0 = P0.x + ((P1.x - P0.x) * k) / 3;
        const y0 = P0.y + ((P1.y - P0.y) * k) / 3;
        const x1 = P0.x + ((P1.x - P0.x) * (k + 1)) / 3;
        const y1 = P0.y + ((P1.y - P0.y) * (k + 1)) / 3;
        list.push({ left: Math.min(x0, x1) - 7, top: Math.min(y0, y1) - 7, right: Math.max(x0, x1) + 7, bottom: Math.max(y0, y1) + 7 });
      }
    }
    return list;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const pts = {};
  const pt = (id) => (pts[id] ||= new THREE.Vector3());
  const labelKey = new Map();
  const want = new Map();
  function syncLabels() {
    want.clear();
    const d = DATA[s.c];
    const L = s.show.labels;
    const quiz = s.mode === 'quiz';
    if (L) {
      if (s.show.arrows)
        want.set('press', {
          text: t(`lbl_p_${d.pressure}`),
          point: () => pt('press').copy(arrows.tails[0]),
          spots: [...LEFT, ...ABOVE],
          color: COLORS.press,
        });
      want.set('ref', {
        text: t('lbl_ref', { tb: T_REF }),
        point: () => pt('ref').set(THERM.x - 0.0175, POT.y + pot.therm.refY, THERM.z - 0.0045),
        spots: [...RIGHT, ...ABOVE],
        color: COLORS.ref,
      });
      if (phase() === 'boiling' && s.show.reading && !quiz)
        want.set('read', {
          text: t(s.c === 'plain' ? 'val_bp_plain' : 'val_bp_other', { tb: d.tb }),
          point: () => pt('read').set(THERM.x, POT.y + pot.therm.top(mercuryLevel(d.tb)), THERM.z),
          spots: [...RIGHT, ...ABOVE],
          color: COLORS.read,
        });
    }
    for (const id of [...labelKey.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelKey.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.spots.length}`;
      if (!labelKey.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots });
        labelKey.set(id, key);
      } else if (labelKey.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelKey.set(id, key);
      }
    }
  }

  // ── the story: pick a case, light the fire, the water boils ─────────────────
  function cancelRuns() {
    s.run++;
    tweener.cancel('heat');
    s.busy = '';
  }
  function setCase(c, { k = 0 } = {}) {
    cancelRuns();
    s.c = fixCase(c);
    s.k = Math.min(1, Math.max(0, k));
    s.bt = s.k >= 1 ? BOIL_S : 0; // a jump to boiling shows the bubbles at rest
    if (s.k >= 1) s.tried[s.c] = true;
    refresh();
    emitChange();
  }
  async function runHeat() {
    cancelRuns();
    const token = s.run;
    s.busy = 'heat';
    s.bt = 0;
    refresh();
    emitChange();
    const k0 = s.k;
    const job = tweener.animate({
      key: 'heat',
      duration: HEAT_S * (1 - k0),
      ease: ease.linear,
      onUpdate: (k) => {
        s.k = k0 + (1 - k0) * k;
        refresh();
      },
    });
    const done = await job.finished;
    if (!done || token !== s.run) return false;
    s.k = 1;
    s.busy = '';
    s.tried[s.c] = true;
    s.bt = 0; // the bubbles go on for BOIL_S, then rest
    audio.success();
    refresh();
    emitChange();
    return true;
  }
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 1500 });
    if (nextOf(s.k, false) === 'heat') return runHeat();
    return setCase(nextCase(s.c));
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewPose(view = s.view) {
    return fitPose({
      box: FOCUS,
      dir: VIEW_DIRS[view],
      camera,
      width: stage.width,
      height: stage.height,
      margin: stage.height < 260 ? { top: 38, bottom: 8, side: 6 } : MARGIN,
    });
  }
  function flyTo({ position, target }, duration = 0.7) {
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  // the view starts from the front; a drag turns it, and then the "front" icon appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    syncLabels();
  });

  // ── the action: the big button, and the ring round the pot ──────────────────
  const targetBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_heat',
    target: () => targetBox.setFromObject(pot.water).expandByPoint(from.set(0, POT.y + POT.h, 0)),
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
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
  const lidBody = pot.lid.children[0];
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const list = s.c === 'cooker' ? [pot.water, pot.surface, lidBody] : [pot.water, pot.surface];
    return raycaster.intersectObjects(list, false).length > 0;
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

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 3000 } = {}) {
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
    const d = DATA[s.c];
    return {
      case: s.c,
      pressure: d.pressure, // 'low' | 'normal' | 'high'
      phase: phase(),
      progress: +s.k.toFixed(3), // 0 cold … 1 boiling
      temperature: +temp().toFixed(1), // °C of the water now
      boilingPoint: d.tb, // °C in this case (90 and 120 are round figures, not from the book)
      boiling: s.k >= 1,
      cooking: d.cooking, // 'slow' | 'normal' | 'fast'
      tried: { ...s.tried },
      busy: s.busy,
      next: nextOf(s.k, s.busy),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.case, snap.phase, snap.busy, snap.mode, snap.view, snap.tried]);
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
  const SHOWN = {
    mtn_bp: { arrows: true },
    mtn_cook: { arrows: true },
    cooker_p: { arrows: false },
    cooker_fast: { arrows: true },
    gas: { arrows: false },
  };
  /** A question's scene: this case at this point of the heating, with what would give the answer away left out. */
  function scene_(kind) {
    cancelRuns();
    const sc = SCENES[kind];
    s.c = sc.c;
    s.k = sc.k;
    s.bt = BOIL_S; // bubbles at rest
    s.show = { ...SHOWN[kind], reading: false, labels: true };
    s.userMovedCamera = false;
    refresh();
    return flyTo(viewPose(), 0.5);
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
    lines: { text: 2, feedback: 4 },
    action,
    hooks: {
      enter() {
        cancelRuns();
        learnSaved = { c: s.c, k: s.k, tried: { ...s.tried } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { arrows: true, reading: true, labels: true };
        syncUI();
        s.tried = { ...(learnSaved?.tried || s.tried) };
        setCase(learnSaved?.c ?? 'plain', { k: learnSaved?.k ?? 0 });
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = QUIZ_KINDS[i % QUIZ_KINDS.length];
        await scene_(kind);
        if (!alive()) return null;
        const list = shuffle([0, 1, 2, 3]);
        question = { kind, list };
        return {
          text: t(`q_${kind}`),
          choices: [0, 1, 2, 3],
          expected: list.indexOf(0),
          tolerance: 0.5,
          label: (j) => `<span class="pb-opt">${t(`q_${kind}_${list[j]}`)}</span>`,
          meta: { kind },
        };
      },
      reveal(_q, correct) {
        const { kind, list } = question;
        s.show = { arrows: kind !== 'gas', reading: true, labels: true };
        refresh();
        const wrong = correct ? '' : list[picked];
        return t(`why_${kind}`) + (wrong ? ` ${t(`mis_${kind}_${wrong}`)}` : '');
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
      else if (b.dataset.example !== s.c || s.k > 0) setCase(b.dataset.example);
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
        else {
          s.tried = { plain: false, mountain: false, cooker: false };
          setCase('plain');
        }
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
    const sceneKey = ['1', '2', '3', 'r', 'R', 'Home'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) setCase(CASES[Number(k) - 1]);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') setCase('plain');
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  flyTo(viewPose(), 0);
  setCase(s.c, { k: o.boil ? 1 : 0 });
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
    /**
     * Change any of: case ('plain' | 'mountain' | 'cooker'), boil (true: the water is boiling; with animate the fire is
     * lit and it heats up; false: cold), view ('front' | '3d').
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.case && (fixCase(p.case) !== s.c || p.boil != null)) setCase(p.case, { k: p.boil && !animate ? 1 : 0 });
      if (p.boil != null && s.mode !== 'quiz') {
        if (p.boil && animate) await runHeat();
        else if (p.boil) setCase(s.c, { k: 1 });
        else if (!p.case) setCase(s.c, { k: 0 });
      }
      if (!s.userMovedCamera) flyTo(viewPose(), 0);
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.show = { arrows: true, reading: true, labels: true };
      s.tried = { plain: false, mountain: false, cooker: false };
      setCase('plain');
      await setView('front', { animate: false });
      flyTo(viewPose(), 0);
      emitChange(true);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The stove and the pot as it is now (with the lid in the cooker case), in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'PressureBoilingPoint';
      g.add(stove.root.clone(), pot.root.clone());
      return g;
    },
  };
}
