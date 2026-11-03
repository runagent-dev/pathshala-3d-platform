// Torricelli's tube tilted (book pages 145–146, topic 5.4.1), student view: one object, one button, one idea. The
// barometer stands in its dish at 76 cm with a vacuum above; one button tilts the tube 10° at a time to 40° (then
// stands it upright again). The mercury fills more of the tube, but its top stays level with 76 on the scale: the
// pressure depends on the vertical height, not on the length. One outlined air-pressure arrow on the dish, the
// vertical height in orange. The panel: one short line, the vertical height and the length along the tube, the rule.
// Then a three-question test. Built on the shared student kit.
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
import { SCALE, SURFACE_Y, MOUTH_Y, TUBE_R, barometerMaterials, createBarometer } from './barometer.js';
import { H_HG, TILTS, TUBE, tiltChoices, tiltLength, toCm, vacuumLength } from './reading.js';

export const DEFAULTS = {
  tilt: 0, // degrees: 0, 10, 20, 30 or 40
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
const H = H_HG; // the column's vertical height (m)
const AIR_LEN = 0.085; // the air arrow on the dish (m)
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 12, side: 6 };
const DOWN = new THREE.Vector3(0, -1, 0);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const cm = (m) => N(toCm(m));

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

  // the reading under the action: the vertical height and the length along the tube
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

  // ── the arrow, the vertical height and its reading line ─────────────────────
  const airArrow = boldArrow('AirOnDish', COLORS.air, 0.0034);
  const dimV = dimensionLine('VerticalHeight', COLORS.h, 0.0016, { dashed: true });
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
  /** A dashed line from the mercury's top across to the scale. */
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
    tilt: 0, // degrees, as drawn
    at: 0, // index in TILTS the student chose
    found: false, // the student has tilted it once
    show: { vert: true }, // the test hides the vertical height until the answer
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const colLen = () => Math.min(L - TUBE_R.inner, tiltLength(MD + H, s.tilt)); // the mercury along the tube (m from the mouth)
  function columnTop(out) {
    const a = THREE.MathUtils.degToRad(s.tilt);
    return out.set(-Math.sin(a) * colLen(), MOUTH_Y + Math.cos(a) * colLen(), 0);
  }
  function tubeTop(out) {
    const a = THREE.MathUtils.degToRad(s.tilt);
    const len = L - TUBE_R.inner;
    return out.set(-Math.sin(a) * len, MOUTH_Y + Math.cos(a) * len, 0);
  }

  // ── the scene from the state ────────────────────────────────────────────────
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  function syncScene() {
    bar.setPose(0, MOUTH_Y, THREE.MathUtils.degToRad(s.tilt));
    bar.setColumn(0, colLen(), { top: 'meniscus' });
    airArrow.set(V(-0.058, SURFACE_Y + AIR_LEN, 0.03), DOWN, AIR_LEN);
    airArrow.scale(Math.min(3, Math.max(1, (2.6 * perPixel()) / 0.0034)));
    const top = columnTop(V(0, 0, 0));
    dimV.hide();
    if (s.show.vert) dimV.set(top.x, SURFACE_Y, top.y, 0.02);
    setReadLine(Math.min(top.x, -TUBE_R.outer), SCALE.x + 0.004, top.y);
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const plan = () => (s.at < TILTS.length - 1 ? { label: 'act_tilt', step: s.found ? '' : 1 } : { label: 'act_upright', step: '' });
  function refresh() {
    if (s.busy) sheet.outcome(t('out_tilting'));
    else sheet.outcome(TILTS[s.at] ? t('out_tilt', { deg: N(TILTS[s.at]), h: cm(H) }) : t('out_tilt0', { h: cm(H) }));
    sheet.rule(s.found ? t('rule_tilt', { h: cm(H) }) : '');
    reading.innerHTML = t('read_tilt', { h: cm(H), L: N(toCm(tiltLength(H, TILTS[s.at]))) });
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label, enabled: true });
      if (p.step !== '' && !s.busy && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture: air's pressure, the vertical height, vacuum ──────
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
    const out = [];
    const a = THREE.MathUtils.degToRad(s.tilt);
    const dir = V(-Math.sin(a), Math.cos(a), 0);
    for (let i = 0; i < 6; i++) {
      const p0 = V(0, MOUTH_Y, 0).addScaledVector(dir, (i / 6) * L);
      const p1 = V(0, MOUTH_Y, 0).addScaledVector(dir, ((i + 1) / 6) * L);
      tubeBox3.makeEmpty().expandByPoint(p0).expandByPoint(p1).expandByScalar(TUBE_R.outer);
      out.push(screenBox(tubeBox3));
    }
    return out;
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
      point: () => V(-0.058, SURFACE_Y + AIR_LEN * 0.75, 0.03),
      spots: [...LEFT_OF, ...ABOVE],
      color: COLORS.air,
    });
    if (s.show.vert && !s.busy)
      want.set('vert', {
        text: t('lbl_vert', { h: cm(H) }),
        point: () => columnTop(V(0, 0, 0)).setY(SURFACE_Y + H * 0.45),
        spots: [...LEFT_OF, ...RIGHT_OF],
        color: COLORS.h,
      });
    if (!s.busy && vacuumLength(H, s.tilt) > 0.02)
      want.set('vac', {
        text: t('lbl_vacuum'),
        point: () => tubeTop(V(0, 0, 0)).lerp(columnTop(V(0, 0, 0)), 0.45),
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
  const bbox = new THREE.Box3(V(-0.7, -0.01, -0.1), V(0.11, 1.14, 0.1));
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

  // ── tilting ─────────────────────────────────────────────────────────────────
  const wait = (sec, key = 'wait') => tweener.animate({ key, duration: sec, onUpdate: () => {} }).finished;
  function stopAll() {
    s.run++;
    tweener.cancel('tilt');
    s.busy = false;
  }
  async function tiltTo(i, token, { animate = true } = {}) {
    s.at = i;
    const from = s.tilt;
    const to = TILTS[i];
    s.busy = animate;
    refresh();
    if (animate) {
      const ok = await tweener.animate({
        key: 'tilt',
        duration: 0.9,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          s.tilt = from + (to - from) * k;
          syncScene();
        },
      }).finished;
      if (!ok || token !== s.run) return;
    }
    s.tilt = to;
    s.busy = false;
    if (to > 0) s.found = true;
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
    return tiltTo(s.at < TILTS.length - 1 ? s.at + 1 : 0, ++s.run);
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_tilt',
    target: () => tubeTop(V(0, 0, 0)),
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
    const a = THREE.MathUtils.degToRad(s.tilt);
    return {
      tilt: TILTS[s.at],
      column: toCm(Math.max(0, colLen() * Math.cos(a) - MD)), // the vertical height (cm)
      along: toCm(Math.max(0, colLen() - MD / Math.cos(a))), // the mercury along the tube above the dish (cm)
      vacuum: toCm(Math.max(0, L - TUBE_R.inner - colLen())),
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
    const key = JSON.stringify([snap.tilt, snap.found, snap.mode, snap.view]);
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
  let degs = [20, 40];
  const cmText = (v) => `${N(v)}&nbsp;cm`;
  /** The three questions: the vertical height at two tilts, then why the tube holds more mercury. */
  const KINDS = ['tilt', 'tilt', 'why'];

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
        degs = shuffle([20, 30, 40]).slice(0, 2);
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
        tiltTo(learnSaved?.at ?? 0, s.run, { animate: false });
        s.found = learnSaved?.found ?? s.found;
        refresh();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        const deg = kind === 'tilt' ? degs[i] : 30;
        stopAll();
        s.show = { vert: kind !== 'tilt' };
        await tiltTo(TILTS.indexOf(deg), s.run, { animate: false });
        await wait(0.3);
        if (!alive()) return null;
        question = { kind, deg };
        if (kind === 'tilt') return { text: t('q_tilt', { deg: N(deg) }), ...choicesOf(tiltChoices(deg), kind, (x) => cmText(x.v)) };
        return {
          text: t('q_tilt_why'),
          ...choicesOf(
            ['c_tw_right', 'c_tw_air', 'c_tw_light', 'c_tw_vac'].map((key) => ({ key })),
            kind,
            (x) => t(x.key),
          ),
        };
      },
      reveal(q, correct) {
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map, vars) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], vars)}` : '');
        s.show = { vert: true };
        syncScene();
        refresh();
        if (question.kind === 'tilt') {
          const Lc = N(toCm(tiltLength(H, question.deg)));
          return t('why_tilt', { h: N(76), L: Lc }) + note({ along: 'mis_tilt_along', cos: 'mis_tilt_cos', less: 'mis_tilt_less' }, { h: N(76) });
        }
        return t('why_tw') + note({ c_tw_air: 'mis_tilt_cos', c_tw_light: 'mis_tw_light', c_tw_vac: 'mis_tw_vac' });
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
    tiltTo(0, s.run, { animate: false });
    return flyTo(viewPose(), 0.6);
  }
  function step(dir) {
    if (s.locked) return lockedNudge();
    if (s.busy) return;
    tiltTo(Math.min(TILTS.length - 1, Math.max(0, s.at + dir)), ++s.run);
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
    const i = TILTS.indexOf(Number(o.tilt));
    s.at = i > 0 ? i : 0;
    s.tilt = TILTS[s.at];
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
    /** Change any of: tilt (0, 10, 20, 30, 40°), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.tilt != null) {
        const i = TILTS.indexOf(Number(p.tilt));
        if (i >= 0) {
          stopAll();
          await tiltTo(i, s.run, { animate });
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
      g.name = 'TiltedBarometer';
      g.add(bar.root.clone(true));
      return g;
    },
  };
}
