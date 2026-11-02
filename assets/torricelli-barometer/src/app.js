// Torricelli's experiment (book pages 145–146, topic 5.4.1), student view: one guided sequence in one view. One big
// button steps through it: fill the tube with mercury → close the end and turn it over into the dish → take the thumb
// away: the mercury falls and stops at 76 cm → the empty space at the top is a vacuum, and the air pressing on the dish
// holds the column up. The scene shows only the tube, the dish, the mercury, a scale with 76 cm marked and one
// outlined air-pressure arrow on the dish. The panel: one short line per step, the column's height, the rule at the
// end. Then a three-question test. Built on the shared student kit. (The straw, the tilted tube, the mountain, the
// water column and the tank are labs of their own.)
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
import { SURFACE_Y, MOUTH_Y, TUBE_R, barometerMaterials, createBarometer } from './barometer.js';
import { H_HG, H_WATER, RATIO, RHO, TUBE, columnPressure, round, toCm, waterChoices } from './reading.js';

const PHASES = ['ready', 'full', 'dipped', 'settled'];

export const DEFAULTS = {
  phase: 'ready', // 'ready' | 'full' | 'dipped' | 'settled'
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
const H = H_HG; // the column's height when it stands (m)
const FILL_X = -0.19; // where the tube stands to be filled
const UP_Y = L - TUBE_R.inner + TUBE_R.outer + 0.0008; // the mouth's height when the tube stands on its closed end
const AIR_LEN = 0.085; // the air arrow on the dish (m)
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 12, side: 6 };
const DOWN = new THREE.Vector3(0, -1, 0);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const box3 = (x0, y0, x1, y1, z = 0.08) => [V(x0, y0, -z), V(x1, y1, z)];

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

  // the reading under the action: the column's height
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

  const mats = barometerMaterials();
  const lab = createLab();
  const bar = createBarometer(mats, { num: N });
  scene.add(lab.root, bar.root);
  bar.tube.traverse((m) => {
    if (/** @type {THREE.Mesh} */ (m).isMesh) m.castShadow = true;
  });

  // a small beaker that pours mercury into the tube while it is filled
  const beaker = new THREE.Group();
  {
    const cup = new THREE.Mesh(
      new THREE.LatheGeometry(
        [V(0.0001, 0), V(0.026, 0), V(0.027, 0.06), V(0.029, 0.062), V(0.025, 0.062), V(0.024, 0.003), V(0.0001, 0.003)].map(
          (v) => new THREE.Vector2(v.x, v.y),
        ),
        32,
      ),
      mats.glass,
    );
    cup.renderOrder = 8;
    const hg = new THREE.Mesh(new THREE.CylinderGeometry(0.0235, 0.0235, 0.022, 28), mats.mercury);
    hg.position.y = 0.014;
    beaker.add(hg, cup);
  }
  beaker.visible = false;
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0022, 1, 10).translate(0, -0.5, 0), mats.mercury);
  stream.visible = false;
  scene.add(beaker, stream);

  // ── the one arrow and the height ────────────────────────────────────────────
  const airArrow = boldArrow('AirOnDish', COLORS.air, 0.0034);
  scene.add(airArrow.root);
  const dimH = dimensionLine('HeightOfColumn', COLORS.h, 0.0016, { dashed: true });
  scene.add(dimH.root);

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
    busy: false, // an animation the student started is running
    run: 0, // a token: every new action, reset or question bumps it
    wide: false, // the camera steps back while the tube turns over
    userMovedCamera: false,
    phase: 'ready', // 'ready' | 'filling' | 'full' | 'turning' | 'dipped' | 'falling' | 'settled'
    fill: 0, // 0…1 of the tube filled (upright, mouth up)
    pose: { x: FILL_X, y: UP_Y, a: Math.PI },
    thumb: { on: false, x: 0, y: 0 }, // the thumb's offset from the mouth (tube's local frame)
    col: L, // the mercury's top along the tube (m from the mouth) once it stands in the dish
    found: false, // the student has seen it settle once
    show: { labels: true, vacuum: true, h: true }, // the test hides some until the answer
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const inDish = () => ['dipped', 'falling', 'settled'].includes(s.phase);

  // ── the scene from the state ────────────────────────────────────────────────
  function syncScene() {
    if (!inDish()) {
      bar.setPose(s.pose.x, s.pose.y, s.pose.a);
      if (s.phase === 'ready' || s.phase === 'filling' || s.phase === 'full') {
        const f = Math.max(0, Math.min(1, s.fill));
        if (f > 0.001) bar.setColumn(L * (1 - f), L, { top: 'dome', low: true });
        else bar.setColumn(0, 0);
      } else bar.setColumn(0, L, { top: 'dome' }); // sealed: turning
    } else {
      bar.setPose(0, MOUTH_Y, 0);
      s.pose = { x: 0, y: MOUTH_Y, a: 0 };
      const full = s.col >= L - TUBE_R.inner - 1e-4;
      bar.setColumn(0, Math.min(s.col, L - TUBE_R.inner), { top: full ? 'dome' : 'meniscus' });
    }
    bar.thumb.visible = s.thumb.on;
    bar.thumb.position.set(s.thumb.x, -0.0115 + s.thumb.y, 0);
    layoutArrows();
    stage.invalidate();
  }

  // the arrow a few pixels thick however far the camera is
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  function layoutArrows() {
    airArrow.hide();
    dimH.hide();
    if (inDish()) {
      airArrow.set(V(-0.058, SURFACE_Y + AIR_LEN, 0.03), DOWN, AIR_LEN);
      airArrow.scale(Math.min(3, Math.max(1, (2.6 * perPixel()) / 0.0034)));
    }
    if (s.phase === 'settled' && s.show.h) dimH.set(-0.122, SURFACE_Y, SURFACE_Y + H, 0.02);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  function plan() {
    const fresh = !s.found;
    if (s.phase === 'ready' || s.phase === 'filling') return { label: 'act_fill', step: fresh ? 1 : '' };
    if (s.phase === 'full' || s.phase === 'turning') return { label: 'act_turn', step: fresh ? 2 : '' };
    if (s.phase === 'dipped' || s.phase === 'falling') return { label: 'act_release', step: fresh ? 3 : '' };
    return { label: 'act_again', step: '' };
  }

  function refresh() {
    sheet.outcome(t(`out_t_${s.phase}`, { h: N(toCm(H)) }));
    sheet.rule(s.phase === 'settled' ? t('rule_t_settled', { h: N(toCm(H)) }) : '');
    reading.innerHTML = t('read_col', { h: s.phase === 'settled' ? `<b>${N(toCm(H))}&nbsp;${t('u_cm')}</b>` : '—' });
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label, enabled: true });
      // the ring only while there is a numbered step to take and nothing moves
      if (p.step !== '' && !s.busy && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture: air's pressure, 76 cm, vacuum ────────────────────
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
  /** The tube on the screen (labels keep off it), as a few boxes along it. */
  function tubeBoxes() {
    const out = [];
    const a = s.pose.a;
    const dir = V(-Math.sin(a), Math.cos(a), 0);
    for (let i = 0; i < 6; i++) {
      const p0 = V(s.pose.x, s.pose.y, 0).addScaledVector(dir, (i / 6) * L);
      const p1 = V(s.pose.x, s.pose.y, 0).addScaledVector(dir, ((i + 1) / 6) * L);
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
    const settled = s.phase === 'settled';
    if (s.show.labels) {
      if (airArrow.visible)
        want.set('air', {
          text: t('lbl_air'),
          point: () => V(-0.058, SURFACE_Y + AIR_LEN * 0.75, 0.03),
          spots: [...LEFT_OF, ...ABOVE],
          color: COLORS.air,
        });
      if (settled && s.show.h)
        want.set('h', {
          text: t('lbl_h', { h: N(toCm(H)) }),
          point: () => V(-0.122, SURFACE_Y + H * 0.5, 0.02),
          spots: [...LEFT_OF, ...RIGHT_OF],
          color: COLORS.h,
        });
      if (settled && s.show.vacuum)
        want.set('vac', {
          text: t('lbl_vacuum'),
          point: () => V(-0.012, SURFACE_Y + H + (L - MD - H) * 0.55, 0.02),
          spots: [...LEFT_OF, ...ABOVE, ...RIGHT_OF],
          color: COLORS.ink,
        });
    }
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
  const bbox = new THREE.Box3();
  const DIR = V(0.12, 0.16, 1);
  function lookBox() {
    if (s.wide) return box3(-0.66, -0.01, 0.48, 1.16);
    if (!inDish()) return box3(-0.26, -0.01, 0.11, 1.16, 0.1);
    return box3(-0.16, -0.01, 0.11, 1.15, 0.1);
  }
  function viewPose() {
    const b = lookBox();
    bbox.min.copy(b[0]);
    bbox.max.copy(b[1]);
    const d = DIR.clone();
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
      layoutArrows();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: 'camera',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          camera.position.lerpVectors(p0, position, k);
          controls.target.lerpVectors(t0, aim, k);
          controls.update();
          layoutArrows();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (done) refresh();
        return done;
      });
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
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── animation helpers ───────────────────────────────────────────────────────
  const wait = (sec, key = 'wait') => tweener.animate({ key, duration: sec, onUpdate: () => {} }).finished;
  function anim(key, duration, onUpdate, e = ease.inOutCubic) {
    return tweener.animate({ key, duration, ease: e, onUpdate }).finished;
  }
  /** Stop everything that moves (a new action, question or reset). */
  function stopAll() {
    s.run++;
    for (const k of ['wait', 'tube', 'thumb', 'col']) tweener.cancel(k);
    s.busy = false;
    s.wide = false;
    beaker.visible = false;
    stream.visible = false;
  }

  // ── Torricelli's tube ───────────────────────────────────────────────────────
  function tubeReady() {
    s.phase = 'ready';
    s.fill = 0;
    s.pose = { x: FILL_X, y: UP_Y, a: Math.PI };
    s.thumb = { on: false, x: 0, y: 0 };
    s.col = L;
  }
  function tubeFull() {
    tubeReady();
    s.phase = 'full';
    s.fill = 1;
  }
  function tubeDipped() {
    s.phase = 'dipped';
    s.fill = 1;
    s.pose = { x: 0, y: MOUTH_Y, a: 0 };
    s.thumb = { on: true, x: 0, y: 0 };
    s.col = L;
  }
  function tubeSettled() {
    s.phase = 'settled';
    s.fill = 1;
    s.pose = { x: 0, y: MOUTH_Y, a: 0 };
    s.thumb = { on: false, x: 0, y: 0 };
    s.col = Math.min(L - TUBE_R.inner, MD + H);
  }

  async function fillTube(token) {
    s.phase = 'filling';
    s.busy = true;
    beaker.visible = true;
    stream.visible = true;
    beaker.position.set(FILL_X + 0.045, UP_Y + 0.07, 0);
    beaker.rotation.z = 1.9;
    refresh();
    const ok = await anim(
      'tube',
      1.7,
      (k) => {
        s.fill = k;
        // the stream from the beaker's lip down to the mercury's surface in the tube
        const lip = V(FILL_X + 0.006, UP_Y + 0.06, 0);
        stream.position.copy(lip);
        stream.scale.y = Math.max(0.01, lip.y - (UP_Y - L * k));
        beaker.rotation.z = 1.9 + 0.25 * k;
        syncScene();
      },
      ease.linear,
    );
    beaker.visible = false;
    stream.visible = false;
    if (!ok || token !== s.run) return;
    s.phase = 'full';
    s.busy = false;
    audio.pop();
    syncScene();
    refresh();
    emitChange();
  }

  async function turnTube(token) {
    s.phase = 'turning';
    s.busy = true;
    refresh();
    // the thumb comes down on the mouth
    s.thumb = { on: true, x: 0, y: -0.04 };
    let ok = await anim('thumb', 0.45, (k) => {
      s.thumb.y = -0.04 * (1 - k);
      syncScene();
    });
    if (!ok || token !== s.run) return;
    audio.contact();
    // turn it over through the air (the camera steps back to see the whole swing), then dip the mouth
    s.wide = true;
    frame(0.6);
    const c0 = V(FILL_X, UP_Y - L / 2, 0);
    const dipY = MOUTH_Y + 0.07;
    const c1 = V(0, dipY + L / 2, 0);
    ok = await anim('tube', 1.6, (k) => {
      const a = Math.PI * (1 - k);
      const c = c0.clone().lerp(c1, k);
      c.y += 0.12 * Math.sin(Math.PI * k);
      s.pose = { x: c.x + Math.sin(a) * (L / 2), y: c.y - Math.cos(a) * (L / 2), a };
      syncScene();
    });
    if (!ok || token !== s.run) return;
    s.wide = false;
    s.phase = 'dipped'; // (for the camera's box: the tube is over the dish now)
    frame(0.6);
    s.phase = 'turning';
    ok = await anim('tube', 0.6, (k) => {
      s.pose = { x: 0, y: dipY + (MOUTH_Y - dipY) * k, a: 0 };
      syncScene();
    });
    if (!ok || token !== s.run) return;
    tubeDipped();
    s.busy = false;
    audio.contact();
    syncScene();
    refresh();
    emitChange();
  }

  async function releaseTube(token) {
    s.phase = 'falling';
    s.busy = true;
    refresh();
    // the thumb comes out of the mercury and away
    let ok = await anim('thumb', 0.5, (k) => {
      s.thumb.x = -0.07 * k;
      s.thumb.y = -0.07 * k * k;
      syncScene();
    });
    s.thumb.on = false;
    if (!ok || token !== s.run) return;
    // the mercury falls and bobs to rest at 76 cm
    const target = MD + H;
    const A = L - target;
    ok = await anim(
      'col',
      2.0,
      (k) => {
        const tt = k * 2.0;
        const x = k < 1 ? Math.exp(-2.6 * tt) * Math.cos(5.2 * tt) * (1 - k * k) : 0;
        s.col = target + A * x;
        syncScene();
      },
      ease.linear,
    );
    if (!ok || token !== s.run) return;
    tubeSettled();
    s.busy = false;
    s.found = true;
    audio.success();
    syncScene();
    refresh();
    emit('settle', snapshot());
    emitChange();
  }

  // ── the action: the big button, the badge on the part, a tap on the part ─────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not do two steps at once
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const token = ++s.run;
    if (s.phase === 'ready') return fillTube(token);
    if (s.phase === 'full') return turnTube(token);
    if (s.phase === 'dipped') return releaseTube(token);
    return goHome();
  }

  const tgtBox = new THREE.Box3();
  function actionTarget() {
    if (s.phase === 'ready' || s.phase === 'full') {
      tgtBox.min.set(FILL_X - 0.02, 0, -0.02);
      tgtBox.max.set(FILL_X + 0.02, UP_Y + 0.01, 0.02);
      return tgtBox;
    }
    if (s.phase === 'dipped') return V(0, SURFACE_Y + 0.01, 0.05);
    return null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_fill',
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
      phase: s.phase,
      H: toCm(H), // the column's height when it stands (cm)
      column: inDish() ? toCm(round(Math.max(0, s.col - MD), 4)) : 0, // its height now (cm)
      vacuum: inDish() ? toCm(Math.max(0, L - TUBE_R.inner - s.col)) : 0,
      P: columnPressure(round(H, 2), RHO.mercury), // Pa, P = hρg
      busy: s.busy,
      found: s.found,
      next: plan().label.replace('act_', ''),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.phase, snap.found, snap.mode, snap.view]);
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
  const STABLE = { filling: 'ready', turning: 'full', falling: 'dipped' };
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const mText = (v) => (v < 1 ? `${N(toCm(v))}&nbsp;cm` : `${N(v)}&nbsp;m`);
  const words = (keys) => keys.map((key) => ({ key }));
  /** The three questions: what is above the mercury, what holds it up, water instead. */
  const KINDS = ['vacuum', 'hold', 'water'];

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
        s.show = { labels: true, vacuum: true, h: true };
        syncUI();
        stopAll();
        // back to the step the student was on (a moving step goes back to its start)
        jumpPhase(learnSaved?.phase || 'ready');
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
        s.show = { labels: true, vacuum: kind !== 'vacuum', h: true };
        s.userMovedCamera = false;
        tubeSettled();
        syncScene();
        refresh();
        await flyTo(viewPose(), 0.6);
        if (!alive()) return null;
        question = { kind };
        if (kind === 'vacuum')
          return { text: t('q_vacuum'), ...choicesOf(words(['c_vac_right', 'c_vac_pull', 'c_vac_air', 'c_vac_press']), kind, (x) => t(x.key)) };
        if (kind === 'hold')
          return {
            text: t('q_hold', { h: N(76) }),
            ...choicesOf(words(['c_hold_right', 'c_hold_vac', 'c_hold_glass', 'c_hold_light']), kind, (x) => t(x.key)),
          };
        return { text: t('q_water'), ...choicesOf(waterChoices(), kind, (x) => mText(x.v)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const vars = { k: N(RATIO), hHg: N(76), h: N(H_WATER) };
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], vars)}` : '');
        s.show = { labels: true, vacuum: true, h: true };
        syncScene();
        refresh();
        if (k === 'vacuum') return t('why_vacuum') + note({ c_vac_pull: 'mis_vac_pull', c_vac_air: 'mis_vac_air', c_vac_press: 'mis_vac_press' });
        if (k === 'hold') return t('why_hold') + note({ c_hold_vac: 'mis_vac_pull', c_hold_glass: 'mis_hold_glass', c_hold_light: 'mis_hold_light' });
        return t('why_water', vars) + note({ same: 'mis_water_same', divide: 'mis_water_divide', tenth: 'mis_water_tenth' });
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
    tubeReady();
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
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
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
  /** Jump to a phase at once (the book's set command and the URL parameter). */
  function jumpPhase(ph) {
    if (ph === 'full') tubeFull();
    else if (ph === 'dipped') tubeDipped();
    else if (ph === 'settled') tubeSettled();
    else tubeReady();
    if (ph === 'settled') s.found = true;
  }
  syncUI();
  jumpPhase(PHASES.includes(o.phase) ? o.phase : 'ready');
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
    /** Change any of: phase ('ready' | 'full' | 'dipped' | 'settled'), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.phase && PHASES.includes(p.phase)) {
        stopAll();
        if (animate) {
          // step by step from where it is
          if (PHASES.indexOf(p.phase) < PHASES.indexOf(s.phase) || !PHASES.includes(s.phase)) tubeReady();
          while (PHASES.indexOf(s.phase) < PHASES.indexOf(p.phase)) {
            lastAct = Number.NEGATIVE_INFINITY;
            doAction();
            await settle();
          }
        } else {
          jumpPhase(p.phase);
          syncScene();
          flyTo(viewPose(), 0);
        }
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = false;
      s.show = { labels: true, vacuum: true, h: true };
      await setView('front', { animate: false });
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The barometer as it stands now (dish, mercury, tube, scale and stand), in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'TorricelliBarometer';
      g.add(bar.root.clone(true));
      return g;
    },
  };
}
