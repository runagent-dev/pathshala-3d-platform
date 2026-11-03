// The tank with a hole (the owner's third picture, beside book page 146, topic 5.4.1), student view: one object, one
// button, one idea. A glass tank of water with a screw lid and a corked hole near the bottom. One button steps through
// it: pull the cork (lid on): a few drops come and stop, the outside air's pressure holds the water in at the hole, as
// in Torricelli's tube; take off the lid: the air presses on the water too, the column h above the hole pushes a jet
// out, and as the tank drains (shown faster) h falls and the jet weakens; then refill. One outlined air-pressure arrow
// where the air presses, the depth h in orange. The panel: one short line, h, the rule. Then a three-question test.
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
import { createLab } from './lab.js';
import { sceneMaterials } from './materials.js';
import { BOX, HOLE, createTank } from './tank.js';
import { TANK, holeDepth, jetReach, round } from './reading.js';

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
const AIR_LEN = 0.05; // the air arrow (m)
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 12, side: 6 };
const DOWN = new THREE.Vector3(0, -1, 0);
const LEFT = new THREE.Vector3(-1, 0, 0);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const fix = (x, d) => N(round(x, d).toFixed(d)); // fixed decimals (০.২২)

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

  // the reading under the action: the water above the hole
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
  const tank = createTank(sceneMaterials());
  scene.add(lab.root, tank.root);

  // ── the arrow and the depth ─────────────────────────────────────────────────
  const airArrow = boldArrow('AirPressure', COLORS.air, 0.0028);
  const dimH = dimensionLine('HoleDepth', COLORS.h, 0.0014);
  scene.add(airArrow.root, dimH.root);

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
    phase: 'corked', // 'corked' | 'corking' | 'stopped' | 'opening' | 'open'
    level: TANK.water,
    reach: 0,
    jetR: 0.0055,
    lid: 0, // 0 on … 1 off
    cork: 0, // 0 in … 1 out
    found: false, // the student has opened the lid once
    show: { h: true },
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the scene from the state ────────────────────────────────────────────────
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  function syncScene() {
    tank.setWater(s.level);
    tank.setJet(s.reach, s.jetR);
    tank.lid.position.set(-s.lid * 0.03, BOX.h + 0.006 + s.lid * 0.045, 0);
    tank.lid.rotation.z = s.lid * 0.32;
    tank.cork.position.set(HOLE.x + 0.004 + s.cork * 0.05, HOLE.y - s.cork * s.cork * (HOLE.y - 0.007), 0);
    tank.cork.rotation.z = -Math.PI / 2 + s.cork * 1.2;
    const pud = s.phase === 'open' || s.phase === 'stopped' ? 1 : 0;
    tank.puddle.position.x = tank.landing(Math.max(s.reach, s.phase === 'stopped' ? 0.004 : 0));
    tank.puddle.scale.set(pud * (s.phase === 'open' ? 0.03 : 0.012), pud * (s.phase === 'open' ? 0.018 : 0.008), 1);
    tank.puddle.visible = pud > 0;
    // the one arrow: on the water once the lid is off, else on the hole once the cork is out
    airArrow.hide();
    const yS = TANK.floor + s.level;
    if (s.lid > 0.6) airArrow.set(V(-0.045, yS + AIR_LEN + 0.002, 0.02), DOWN, AIR_LEN);
    else if (s.cork > 0.6 && s.phase === 'stopped') airArrow.set(V(HOLE.x + 0.008 + AIR_LEN, HOLE.y, 0.02), LEFT, AIR_LEN);
    if (airArrow.visible) airArrow.scale(Math.min(3, Math.max(1, (2.6 * perPixel()) / 0.0028)));
    dimH.hide();
    if (s.show.h && s.cork > 0.6) dimH.set(HOLE.x + (s.reach > 0.01 ? -0.03 : 0.026), HOLE.y, yS, 0.075);
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  function plan() {
    if (s.phase === 'corked' || s.phase === 'corking') return { label: 'act_cork', step: s.found ? '' : 1 };
    if (s.phase === 'stopped' || s.phase === 'opening') return { label: 'act_lid', step: s.found ? '' : 2 };
    return { label: 'act_refill', step: '' };
  }
  function refresh() {
    if (s.phase === 'open') sheet.outcome(holeDepth(s.level) < holeDepth(TANK.water) - 0.03 ? t('out_k_drain') : t('out_k_open'));
    else sheet.outcome(t({ corked: 'out_k_ready', corking: 'out_k_corking', stopped: 'out_k_stopped', opening: 'out_k_opening' }[s.phase]));
    sheet.rule(s.phase === 'open' || s.phase === 'opening' ? t('rule_tank2') : s.phase === 'stopped' ? t('rule_tank1') : '');
    reading.innerHTML = t('read_depth', { h: fix(holeDepth(s.level), 2) });
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
    if (!airArrow.visible) return [];
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
  const BELOW = [spot(0, 18), spot(16, 18), spot(-16, 18), spot(0, 34)];
  const labelState = new Map();
  function syncLabels() {
    const want = new Map();
    if (s.cork > 0.6 && s.show.h)
      want.set('depth', {
        text: t('lbl_depth', { h: fix(holeDepth(s.level), 2) }),
        point: () => V(HOLE.x + (s.reach > 0.01 ? -0.03 : 0.026), HOLE.y + holeDepth(s.level) * 0.55, 0.075),
        spots: s.reach > 0.01 ? [...LEFT_OF, ...ABOVE] : [...RIGHT_OF, ...ABOVE],
        color: COLORS.h,
      });
    if (airArrow.visible)
      want.set(
        'air',
        s.lid > 0.6
          ? {
              text: t('lbl_air'),
              point: () => V(-0.045, TANK.floor + s.level + AIR_LEN * 0.8, 0.02),
              spots: [...LEFT_OF, ...ABOVE],
              color: COLORS.air,
            }
          : { text: t('lbl_air'), point: () => V(HOLE.x + 0.04, HOLE.y, 0.02), spots: [...BELOW, ...ABOVE], color: COLORS.air },
      );
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.spots[0].dy}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const bbox = new THREE.Box3(V(-0.115, -0.005, -0.07), V(0.36, 0.38, 0.07));
  function viewPose() {
    const d = V(0.3, 0.24, 1);
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

  // ── the tank ────────────────────────────────────────────────────────────────
  const wait = (sec, key = 'wait') => tweener.animate({ key, duration: sec, onUpdate: () => {} }).finished;
  function anim(key, duration, onUpdate, e = ease.inOutCubic) {
    return tweener.animate({ key, duration, ease: e, onUpdate }).finished;
  }
  function stopAll() {
    s.run++;
    for (const k of ['tank', 'jet', 'lid', 'cork']) tweener.cancel(k);
    s.busy = false;
  }
  function tankReady() {
    s.phase = 'corked';
    s.level = TANK.water;
    s.reach = 0;
    s.jetR = 0.0055;
    s.lid = 0;
    s.cork = 0;
  }
  function tankStopped() {
    tankReady();
    s.phase = 'stopped';
    s.cork = 1;
  }
  function tankOpen(level = TANK.water) {
    tankStopped();
    s.phase = 'open';
    s.lid = 1;
    s.level = level;
    s.reach = jetReach(holeDepth(level));
  }

  async function pullCork(token) {
    s.phase = 'corking';
    s.busy = true;
    refresh();
    let ok = await anim('cork', 0.6, (k) => {
      s.cork = k;
      // a little water follows the cork out, then stops
      s.reach = jetReach(holeDepth(s.level)) * 0.55 * Math.sin(Math.PI * Math.min(1, k * 1.3));
      s.jetR = 0.0036 * (1 - k * 0.5);
      syncScene();
    });
    if (!ok || token !== s.run) return;
    ok = await anim('jet', 0.5, (k) => {
      s.reach = jetReach(holeDepth(s.level)) * 0.2 * (1 - k);
      s.jetR = 0.002 * (1 - k);
      syncScene();
    });
    if (!ok || token !== s.run) return;
    tankStopped();
    s.busy = false;
    syncScene();
    refresh();
    emitChange();
  }

  async function openLid(token) {
    s.phase = 'opening';
    s.busy = true;
    refresh();
    let ok = await anim('lid', 0.7, (k) => {
      s.lid = k;
      syncScene();
    });
    if (!ok || token !== s.run) return;
    s.phase = 'open';
    s.found = true;
    audio.pop();
    // the jet springs out, then the tank drains slowly (shown faster) and the jet weakens as h shrinks
    ok = await anim('jet', 0.35, (k) => {
      s.reach = jetReach(holeDepth(s.level)) * k;
      s.jetR = 0.0055;
      syncScene();
    });
    if (!ok || token !== s.run) return;
    s.busy = false;
    refresh();
    emitChange();
    const from = s.level;
    ok = await anim(
      'tank',
      9,
      (k) => {
        s.level = from + (TANK.low - from) * k;
        s.reach = jetReach(holeDepth(s.level));
        syncScene();
        refresh();
      },
      ease.linear,
    );
    if (!ok || token !== s.run) return;
    emitChange();
  }

  // ── the action: the big button, the badge on the part, a tap on the part ─────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const token = ++s.run;
    if (s.phase === 'corked') return pullCork(token);
    if (s.phase === 'stopped') return openLid(token);
    stopAll();
    tankReady();
    syncScene();
    refresh();
    emitChange();
  }
  const tgtBox = new THREE.Box3();
  function actionTarget() {
    if (s.phase === 'corked') return V(HOLE.x + 0.01, HOLE.y, 0.02);
    if (s.phase === 'stopped') {
      tgtBox.min.set(-BOX.w / 2 - 0.01, BOX.h, -0.07);
      tgtBox.max.set(BOX.w / 2 + 0.01, BOX.h + 0.03, 0.07);
      return tgtBox;
    }
    return null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_cork',
    target: actionTarget,
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
    return raycaster.intersectObjects(tank.hitMeshes, false).length > 0;
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
      phase: s.phase,
      depth: holeDepth(s.level), // the water above the hole (m)
      jet: s.reach > 0.004,
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
  const STABLE = { corking: 'corked', opening: 'stopped' };
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const words = (keys) => keys.map((key) => ({ key }));
  /** The three questions: lid on, lid off, the tank draining. */
  const KINDS = ['lid', 'open', 'drain'];
  function jump(phase) {
    if (phase === 'stopped') tankStopped();
    else if (phase === 'open') tankOpen();
    else tankReady();
  }

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
        learnSaved = { phase: STABLE[s.phase] || s.phase, found: s.found };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { h: true };
        syncUI();
        stopAll();
        jump(learnSaved?.phase || 'corked');
        s.found = learnSaved?.found ?? s.found;
        syncScene();
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        stopAll();
        if (kind === 'lid') tankStopped();
        else if (kind === 'open') tankOpen();
        else tankOpen(TANK.low + 0.04);
        syncScene();
        refresh();
        await wait(0.3);
        if (!alive()) return null;
        question = { kind };
        if (kind === 'lid')
          return { text: t('q_tank'), ...choicesOf(words(['c_tk_right', 'c_tk_small', 'c_tk_shallow', 'c_tk_lid']), kind, (x) => t(x.key)) };
        if (kind === 'open')
          return { text: t('q_tk_open'), ...choicesOf(words(['c_to_right', 'c_to_hole', 'c_to_warm', 'c_to_lid']), kind, (x) => t(x.key)) };
        return { text: t('q_tk_drain'), ...choicesOf(words(['c_td_right', 'c_td_more', 'c_td_same', 'c_td_stop']), kind, (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], { h: fix(holeDepth(TANK.water), 2) })}` : '');
        if (k === 'lid') return t('why_tank') + note({ c_tk_small: 'mis_tk_small', c_tk_shallow: 'mis_tk_shallow', c_tk_lid: 'mis_tk_lid' });
        if (k === 'open') return t('why_to') + note({ c_to_hole: 'mis_to_hole', c_to_warm: 'mis_to_warm', c_to_lid: 'mis_tk_lid' });
        return t('why_td') + note({ c_td_more: 'mis_td_more', c_td_same: 'mis_td_more', c_td_stop: 'mis_td_stop' });
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
    tankReady();
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
    /** Change any of: tank ('corked' | 'stopped' | 'open'), view ('front' | '3d'). Lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.tank) {
        stopAll();
        jump(p.tank);
        if (p.tank === 'open') s.found = true;
        syncScene();
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = false;
      s.show = { h: true };
      await setView('front', { animate: false });
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The tank, its water, lid and cork as they stand now, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Tank';
      g.add(tank.root.clone(true));
      return g;
    },
  };
}
