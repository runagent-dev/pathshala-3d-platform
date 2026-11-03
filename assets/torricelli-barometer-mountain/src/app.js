// The barometer up a mountain (book page 146, topic 5.4.1), student view: one object, one button, one idea. Torricelli's
// barometer stands in its dish on a lab bench; one button takes it 1000 m higher at a time to 3000 m (then back to the
// sea). The window's view changes from plains to snowy peaks, the outlined air-pressure arrow on the dish shortens and
// the mercury falls to about 67, 60 and 53 cm: higher up there is less air overhead. The panel: one short line, the
// height and the column, the rule. Then a three-question test. Built on the shared student kit.
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
import { createLab, WINDOW } from './lab.js';
import { SURFACE_Y, MOUTH_Y, TUBE_R, barometerMaterials, createBarometer } from './barometer.js';
import { ALTITUDES, H_HG, RHO, TUBE, columnAt, columnPressure, groupBD, groupIntl, readChoices, round, toCm, vacuumLength } from './reading.js';

export const DEFAULTS = {
  alt: 0, // m above the sea: 0, 1000, 2000 or 3000
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
const L = TUBE.length;
const MD = TUBE.mouthDepth;
const AIR_LEN = 0.085; // the air arrow on the dish at the sea (m)
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 12, side: 6 };
const DOWN = new THREE.Vector3(0, -1, 0);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const cm = (m) => N(toCm(m));
  const G3 = (x) => N(t.lang === 'bn' ? groupBD(x) : groupIntl(x)); // ১,০০০ in Bangla

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

  // the reading under the action: the height above the sea and the column
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
  const bar = createBarometer(barometerMaterials(), { num: N });
  scene.add(lab.root, bar.root);
  bar.tube.traverse((m) => {
    if (/** @type {THREE.Mesh} */ (m).isMesh) m.castShadow = true;
  });

  // ── the arrow, the column's height and its reading line ─────────────────────
  const airArrow = boldArrow('AirOnDish', COLORS.air, 0.0034);
  const dimV = dimensionLine('HeightOfColumn', COLORS.h, 0.0016, { dashed: true });
  scene.add(airArrow.root, dimV.root);
  const readMat = new THREE.MeshBasicMaterial({ color: COLORS.h, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
  const readLine = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), readMat, 60);
  readLine.renderOrder = 27;
  readLine.userData.noExport = true;
  scene.add(readLine);
  const RM = new THREE.Matrix4();
  const RQ = new THREE.Quaternion();
  const RS = new THREE.Vector3();
  const RP = new THREE.Vector3();
  /** A dashed line from the mercury's top across to the height line on the left. */
  function setReadLine(x0, x1, y, z = 0.012) {
    const len = Math.abs(x1 - x0);
    const n = Math.min(60, Math.max(1, Math.floor(len / 0.008)));
    for (let i = 0; i < n; i++) {
      RP.set(Math.min(x0, x1) + (i + 0.25) * (len / n), y, z);
      RS.set((len / n) * 0.55, 0.0016, 0.0016);
      RM.compose(RP, RQ, RS);
      readLine.setMatrixAt(i, RM);
    }
    readLine.count = n;
    readLine.instanceMatrix.needsUpdate = true;
    readLine.visible = len > 0.004;
  }

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
    H: H_HG, // the column's height, as drawn (m)
    at: 0, // index in ALTITUDES
    found: false, // the student has gone up once
    show: { vert: true }, // the test hides the column's height until the answer
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const air = () => columnPressure(s.H, RHO.mercury) / columnPressure(H_HG, RHO.mercury); // the air's pressure / the sea's
  const tubeTopY = MOUTH_Y + L - TUBE_R.inner;

  // ── the scene from the state ────────────────────────────────────────────────
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  function syncScene() {
    lab.setHeight(ALTITUDES[s.at]);
    bar.setPose(0, MOUTH_Y, 0);
    bar.setColumn(0, MD + s.H, { top: 'meniscus' });
    const len = AIR_LEN * air();
    airArrow.set(V(-0.058, SURFACE_Y + len, 0.03), DOWN, len);
    airArrow.scale(Math.min(3, Math.max(1, (2.6 * perPixel()) / 0.0034)));
    dimV.hide();
    readLine.visible = false;
    if (s.show.vert && !s.busy) {
      dimV.set(-0.122, SURFACE_Y, SURFACE_Y + s.H, 0.02);
      setReadLine(-0.122, -TUBE_R.outer - 0.002, SURFACE_Y + s.H);
    }
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const plan = () => (s.at < ALTITUDES.length - 1 ? { label: 'act_up', step: s.found ? '' : 1 } : { label: 'act_down', step: '' });
  function refresh() {
    const z = ALTITUDES[s.at];
    if (s.busy) sheet.outcome(t('out_mt_moving'));
    else sheet.outcome(z ? t('out_mt', { z: G3(z), h: cm(s.H) }) : t('out_mt0', { h: cm(s.H) }));
    sheet.rule(s.found ? t('rule_mt') : '');
    reading.innerHTML = t('read_mt', { z: G3(z), h: s.busy ? '…' : cm(s.H) });
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label, enabled: true });
      if (p.step !== '' && !s.busy && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture: air's pressure, the column's height, vacuum ──────
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
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  function screenBox(b3) {
    let i = 0;
    for (const x of [b3.min.x, b3.max.x])
      for (const y of [b3.min.y, b3.max.y]) for (const z of [b3.min.z, b3.max.z]) corners[i++].set(x, y, z).project(camera);
    const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
    const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }
  const tubeBox3 = new THREE.Box3();
  function tubeBoxes() {
    tubeBox3.min.set(-TUBE_R.outer, MOUTH_Y, -TUBE_R.outer);
    tubeBox3.max.set(TUBE_R.outer, MOUTH_Y + L, TUBE_R.outer);
    return [screenBox(tubeBox3)];
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
    want.set('air', {
      text: t('lbl_air'),
      point: () => V(-0.058, SURFACE_Y + AIR_LEN * air() * 0.75, 0.03),
      spots: [...LEFT_OF, ...ABOVE],
      color: COLORS.air,
    });
    if (s.show.vert && !s.busy)
      want.set('h', {
        text: t('lbl_h', { h: cm(s.H) }),
        point: () => V(-0.122, SURFACE_Y + s.H * 0.5, 0.02),
        spots: [...LEFT_OF, ...RIGHT_OF],
        color: COLORS.h,
      });
    if (!s.busy && vacuumLength(s.H, 0) > 0.02)
      want.set('vac', {
        text: t('lbl_vacuum'),
        point: () => V(-0.012, (SURFACE_Y + s.H + tubeTopY) / 2, 0.02),
        spots: [...LEFT_OF, ...ABOVE, ...RIGHT_OF],
        color: COLORS.ink,
      });
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, avoid: [tubeBoxes] });
        labelState.set(id, w.text);
      } else if (labelState.get(id) !== w.text) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, w.text);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const bbox = new THREE.Box3(V(-0.16, -0.01, -0.1), V(WINDOW.x0 + 0.36, 1.16, 0.1));
  function viewPose() {
    const d = V(0.3, 0.22, 1);
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

  // ── going up ────────────────────────────────────────────────────────────────
  const wait = (sec, key = 'wait') => tweener.animate({ key, duration: sec, onUpdate: () => {} }).finished;
  function stopAll() {
    s.run++;
    tweener.cancel('alt');
    s.busy = false;
  }
  async function climbTo(i, token, { animate = true } = {}) {
    s.at = i;
    const from = s.H;
    const to = columnAt(ALTITUDES[i]);
    s.busy = animate;
    syncScene(); // the window's view changes at once
    refresh();
    if (animate) {
      const ok = await tweener.animate({
        key: 'alt',
        duration: 1.3,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          s.H = from + (to - from) * k;
          syncScene();
        },
      }).finished;
      if (!ok || token !== s.run) return;
    }
    s.H = to;
    s.busy = false;
    if (i > 0) s.found = true;
    syncScene();
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
    return climbTo(s.at < ALTITUDES.length - 1 ? s.at + 1 : 0, ++s.run);
  }
  const tgtBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_up',
    target: () => {
      tgtBox.min.set(WINDOW.x0, WINDOW.y0, -0.42);
      tgtBox.max.set(WINDOW.x1, WINDOW.y1, -0.4);
      return tgtBox;
    },
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
    return raycaster.intersectObjects(bar.hitMeshes, false).length > 0;
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
      alt: ALTITUDES[s.at],
      H: toCm(s.H), // the column's height (cm)
      column: toCm(s.H),
      P: columnPressure(round(s.H, 2), RHO.mercury), // the air's pressure, P = hρg (Pa)
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
    const key = JSON.stringify([snap.alt, snap.found, snap.mode, snap.view]);
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
  const cmText = (v) => `${N(v)}&nbsp;cm`;
  const words = (keys) => keys.map((key) => ({ key }));
  /** The three questions: what happens higher up, the column read off the scale, why. */
  const KINDS = ['col', 'read', 'why'];

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
        learnSaved = { at: s.at, found: s.found };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { vert: true };
        syncUI();
        stopAll();
        climbTo(learnSaved?.at ?? 0, s.run, { animate: false });
        s.found = learnSaved?.found ?? s.found;
        refresh();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        const at = kind === 'read' ? 1 + Math.floor(Math.random() * 3) : kind === 'col' ? 0 : 2;
        stopAll();
        s.show = { vert: kind !== 'read' };
        await climbTo(at, s.run, { animate: false });
        await wait(0.3);
        if (!alive()) return null;
        question = { kind, cm: toCm(s.H) };
        if (kind === 'read') return { text: t('q_mt_read'), ...choicesOf(readChoices(question.cm), kind, (x) => cmText(x.v)) };
        if (kind === 'col')
          return { text: t('q_mt_col'), ...choicesOf(words(['c_mc_right', 'c_mc_up', 'c_mc_same', 'c_mc_zero']), kind, (x) => t(x.key)) };
        return { text: t('q_mt_why'), ...choicesOf(words(['c_mw_right', 'c_mw_cold', 'c_mw_g', 'c_mw_vac']), kind, (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map, vars) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], vars)}` : '');
        s.show = { vert: true };
        syncScene();
        refresh();
        if (question.kind === 'read')
          return t('why_mt_read', { h: N(question.cm) }) + note({ sea: 'mis_mr_sea', up: 'mis_mr_up', off: 'mis_mr_off' }, { h: N(76) });
        if (question.kind === 'col') return t('why_mc') + note({ c_mc_up: 'mis_mc_up', c_mc_same: 'mis_mc_up', c_mc_zero: 'mis_mc_zero' });
        return t('why_mw') + note({ c_mw_cold: 'mis_mw_cold', c_mw_g: 'mis_mw_g', c_mw_vac: 'mis_mw_vac' });
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
    s.userMovedCamera = false;
    climbTo(0, s.run, { animate: false });
    return flyTo(viewPose(), 0.6);
  }
  function step(dir) {
    if (s.locked) return lockedNudge();
    if (s.busy) return;
    climbTo(Math.min(ALTITUDES.length - 1, Math.max(0, s.at + dir)), ++s.run);
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
    const sceneKey =
      ['r', 'R', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (k === 'ArrowUp' || k === 'ArrowLeft' || k === '+') step(1);
    else if (k === 'ArrowDown' || k === 'ArrowRight' || k === '-') step(-1);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  {
    const i = ALTITUDES.indexOf(Number(o.alt));
    s.at = i > 0 ? i : 0;
    s.H = columnAt(ALTITUDES[s.at]);
    if (s.at > 0) s.found = true;
  }
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
    /** Change any of: alt (0, 1000, 2000, 3000 m), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.alt != null) {
        const i = ALTITUDES.indexOf(Number(p.alt));
        if (i >= 0) {
          stopAll();
          await climbTo(i, s.run, { animate });
        }
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.show = { vert: true };
      await setView('front', { animate: false });
      await goHome();
      s.found = false;
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The barometer as it stands now (dish, mercury, tube, scale and stand), in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Barometer';
      g.add(bar.root.clone(true));
      return g;
    },
  };
}
