// Periscope and binoculars (book page 254, topic 9.3.3), student view. On a plain table in a calm blue: a low brick wall,
// a flower in a pot behind it, a periscope on this side (a demonstration model: aluminium frame, clear sides, two
// 45° glass prisms, the head slides up) with an eye at its bottom window, and a pair of prism binoculars with one
// barrel cut away. Four steps, one tap each, slow: ① the flower's light, going straight to the eye, is stopped by the
// wall; ② the periscope's head rises over the wall (or the student drags it) and the flower's light runs in, turns
// down in the top prism, turns again in the bottom one and reaches the eye; ③ close to the top prism: the normal and
// the angle of incidence, 45° > the critical angle 41.8°, total internal reflection, a 90° turn; ④ inside the
// binoculars: four total internal reflections fold the light back and forth, a long path in a short body. A calm card
// on the first screen, then a lead-in line, the result and the rule per step; the kit's how-to row; a 5-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { BINO_AT, binoWorld, createBinocular } from './binocular.js';
import { fitPose } from './camera.js';
import { C, createDrawing } from './draw.js';
import { createI18n } from './i18n.js';
import { createPeriscope, HEAD_TOP } from './periscope.js';
import { BINO, binocularPath, blockedLight, criticalAngle, headK, headY, PERI, periscopePath, round, SCENE, STEPS } from './reading.js';
import { backdrop, createSetting } from './setting.js';

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

const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 14, side: 10 };
/** How long things take (s): slow enough to follow. */
const T = { block: 1.8, raise: 2.2, light: 3.2, fly: 2, normal: 0.9, arcs: 1.1, bino: 4.2, marks: 0.9, back: 1.4 };
/** Where each step ends: what is drawn, the head's place (0 down … 1 up) and the camera's pose. */
const TARGET = {
  intro: { v: { block: 0, light: 0, normal: 0, arcs: 0, bino: 0, marks: 0, head: 0 }, pose: 'scene' },
  wall: { v: { block: 1, light: 0, normal: 0, arcs: 0, bino: 0, marks: 0, head: 0 }, pose: 'scene' },
  peri: { v: { block: 1, light: 1, normal: 0, arcs: 0, bino: 0, marks: 0, head: 1 }, pose: 'scene' },
  prism: { v: { block: 0, light: 1, normal: 1, arcs: 1, bino: 0, marks: 0, head: 1 }, pose: 'prism' },
  bino: { v: { block: 0, light: 0, normal: 0, arcs: 0, bino: 1, marks: 1, head: 1 }, pose: 'bino' },
};
const ORDER = ['intro', ...STEPS];
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const CRIT = round(criticalAngle(), 1); // 41.8°
const SQ = Math.SQRT1_2;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'pp');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'replay', label: 'act_replay', icon: ICONS.play },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      tight: true,
      lines: { action: 1, outcome: 1, rule: 1 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // The words round the action keep one height in every state, so the 3D view never changes size: the line before
  // the action and the result-and-rule block are each a stack of layers in one grid cell (the live one, and hidden
  // copies of every other step's words), as tall as the longest. On the first screen the calm card takes the place of
  // the result and the rule.
  const leadBox = document.createElement('div');
  leadBox.className = 'pp-leadbox';
  const lead = document.createElement('p');
  lead.className = 'pp-lead';
  leadBox.append(lead);
  $('.pvc-act-row').before(leadBox);
  const body = document.createElement('div');
  body.className = 'pp-body';
  const live = document.createElement('div');
  live.className = 'pp-live';
  const outEl = $('.pvc-outcome');
  outEl.before(body);
  live.append(outEl, $('.pvc-rule'));
  const card = document.createElement('p');
  card.className = 'pp-lead pvc-note pp-card';
  card.innerHTML = `<span class="pp-long">${t('intro')}</span><span class="pp-short">${t('intro_short')}</span>`;
  body.append(live, card);
  function ghost(host, html, cls = '') {
    const g = document.createElement('div');
    g.className = `pp-ghost ${cls}`;
    g.setAttribute('aria-hidden', 'true');
    g.innerHTML = html;
    host.append(g);
  }
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 32, near: 1, far: 900, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.3);
  sun.position.set(30, 90, 55);
  sun.target.position.set(0, 8, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.7);
  fill.position.set(-70, 40, 80);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.05;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -46, right: 46, top: 34, bottom: -34, near: 40, far: 170 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const setting = createSetting();
  const peri = createPeriscope();
  const bino = createBinocular();
  scene.add(setting.root, peri.root, bino.root);
  const drawing = createDrawing({ stage, host: ui.canvasHost });

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
    step: 'intro',
    v: { ...TARGET.intro.v },
    pose: 'scene',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    quiz: '', // the question's kind while the test runs
    drag: null,
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const yw = () => headY(s.v.head);
  const BPATH = binocularPath();
  const PATH_CM = round(BPATH.length);
  const BODY_CM = round(BPATH.body);

  // ── the scene from the state ────────────────────────────────────────────────
  function syncScene() {
    peri.setHead(yw());
    // the binoculars come onto the table for their own step only (they would crowd the periscope's picture)
    bino.root.visible = s.pose === 'bino';
    // and the periscope's corner of the table leaves once the camera is most of the way there
    const away = s.pose === 'bino' && camK >= 0.6;
    peri.root.visible = !away;
    setting.wall.visible = !away;
    setting.flower.visible = !away;
  }

  // ── the drawing over the view: light, the blocked light, the normal, the angle, the eyes ──
  const EYE = V(SCENE.eyeX, PERI.low, 0);
  const BINO_EYE = binoWorld({ x: BINO.back + 1.9, y: BINO.s, z: BINO.wb - BINO.s });
  const LOOK = V(-1, 0, 0);
  const W = (p, z = 0) => ({ x: p.x, y: p.y, z });
  const bPts = [binoWorld({ x: -7, y: -BINO.s, z: BINO.wb + BINO.s }), ...BPATH.points.map((p) => binoWorld(p)), BINO_EYE.clone()];
  const bMarks = BPATH.at.map((i) => bPts[i + 1]);
  const HIT_UP = { x: 0, y: 0, z: 0 };
  const HIT_LOW = { x: 0, y: PERI.low, z: 0 };
  const N_UP = { x: SQ, y: SQ, z: 0 }; // the upper hypotenuse's normal
  const IN_UP = { x: -1, y: 0, z: 0 }; // back along the incoming light
  const INTO_UP = { x: -SQ, y: -SQ, z: 0 }; // the normal into the glass
  const IN_LOW = { x: 0, y: 1, z: 0 };
  const INTO_LOW = { x: SQ, y: SQ, z: 0 };
  let pathNow = periscopePath(yw());
  function paint() {
    drawing.begin();
    const v = s.v;
    pathNow = periscopePath(yw());
    // ① the flower's light toward the eye, stopped by the wall
    if (v.block > 0) {
      const b = blockedLight();
      drawing.lightPath([W(b.from), W(b.at)], v.block, { minChevron: 30 });
      if (v.block >= 1) drawing.sight(W(b.at), W(b.at), 1);
    }
    // ② the light through the periscope
    if (v.light > 0)
      drawing.lightPath(
        pathNow.points.map((p) => W(p)),
        v.light,
      );
    // ③ the normal and the angle of incidence at both prisms' long faces
    if (v.normal > 0 || v.arcs > 0) {
      HIT_UP.y = yw();
      drawing.normal(HIT_UP, N_UP, 3.3, v.normal, 2.3);
      drawing.normal(HIT_LOW, N_UP, 2.3, v.normal, 3.3);
      drawing.angle(HIT_UP, IN_UP, INTO_UP, 2.1, v.arcs, C.ti);
      drawing.angle(HIT_LOW, IN_LOW, INTO_LOW, 2.1, v.arcs, C.ti);
    }
    // ④ the binoculars' light, and its four reflections numbered
    if (v.bino > 0) drawing.lightPath(bPts, v.bino, { fadeFirst: true, minChevron: 28, width: 3.6 });
    if (v.marks > 0) bMarks.forEach((p, i) => drawing.marker(p, N(i + 1), v.marks));
    // the eyes, looking into the eyepieces
    if (s.pose !== 'bino') drawing.eye(EYE, LOOK, Math.min(48, Math.max(22, drawing.pxPerUnit(EYE) * 3.4)));
    if (v.bino > 0 || s.pose === 'bino') drawing.eye(BINO_EYE, LOOK, Math.min(44, Math.max(20, drawing.pxPerUnit(BINO_EYE) * 2.6)));
  }

  // ── labels on the picture: short, few ───────────────────────────────────────
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  /** @type {ReturnType<typeof createDragHandle> | null} */
  let headHandle = null;
  const eyeBox = () => {
    const p = drawing.screen(EYE.x, EYE.y, EYE.z);
    const r = Math.min(26, Math.max(12, drawing.pxPerUnit(EYE) * 1.8));
    return { left: p.x - r, top: p.y - r * 0.6, right: p.x + r, bottom: p.y + r * 0.6 };
  };
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      eyeBox,
      () => drawing.boxes(),
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotateEl),
      () => headHandle?.box(),
      () => boxOf($('.pvc-panel-toggle')),
    ],
  });
  function boxOf(el) {
    if (!el || el.hidden) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(18, 0), spot(18, -18), spot(18, 18), spot(26, -34), spot(40, 30), spot(52, 0)];
  const LEFT_OF = [spot(-18, 0), spot(-18, -18), spot(-18, 18), spot(-26, -34), spot(-40, 30), spot(-52, 0)];
  const ABOVE = [spot(0, -22), spot(20, -22), spot(-20, -22), spot(0, -38), spot(36, -44), spot(-36, -44)];
  const BELOW = [spot(0, 26), spot(-22, 24), spot(22, 24), spot(0, 42), spot(40, 44), spot(-40, 44)];
  const pt = (x, y, z) => {
    const p = V(x, y, z);
    return () => p;
  };
  const upPrismPt = V(0, 0, 0);
  const LABELS = {
    flower: {
      text: 'lbl_flower',
      point: pt(SCENE.flower.x, SCENE.flower.y + SCENE.flower.r, 0),
      spots: ABOVE,
      show: (st) => st === 'intro' || st === 'wall',
    },
    wall: {
      text: 'lbl_wall',
      point: pt(SCENE.wall.x1, 9, SCENE.wall.z),
      spots: [...BELOW, ...RIGHT_OF],
      show: (st) => st === 'intro' || st === 'wall',
    },
    peri: { text: 'lbl_peri', point: pt(PERI.outer, 15, PERI.outer), spots: [...RIGHT_OF, ...ABOVE], show: (st) => st === 'intro' },
    eye: { text: 'lbl_eye', point: () => EYE, spots: [...BELOW, ...RIGHT_OF], show: (st) => st === 'wall' || st === 'peri' },
    prismUp: {
      text: 'lbl_prism',
      point: () => upPrismPt.set(1.4, yw() - 1.7, PERI.depth / 2),
      spots: [...RIGHT_OF, ...ABOVE],
      // in the periscope's step the action's ring is round this prism already; the lower one carries the word
      show: (st) => st === 'prism',
    },
    prismLow: { text: 'lbl_prism', point: pt(-1.4, PERI.low + 1.7, PERI.depth / 2), spots: [...LEFT_OF, ...ABOVE], show: (st) => st === 'peri' },
    normal: {
      text: 'lbl_normal',
      point: () => upPrismPt.set(3.3 * SQ, yw() + 3.3 * SQ, 0),
      spots: [...RIGHT_OF, ...ABOVE],
      show: (st) => st === 'prism' && s.v.normal > 0.9,
      color: C.normal,
    },
    angle: {
      text: () => t('lbl_angle', { a: 45 }),
      point: () => V(-1.5, yw() - 1.3, 0),
      spots: [spot(-34, 24), spot(-52, 8), spot(-20, 40), spot(-60, 40), ...BELOW, ...LEFT_OF],
      show: (st) => st === 'prism' && s.v.arcs > 0.9 && s.quiz !== 'angle',
      color: C.ti,
    },
    bino: { text: 'lbl_bino', point: pt(BINO_AT.x + 5, BINO_AT.y + 2.4, BINO_AT.z - BINO.wb - 2), spots: ABOVE, show: (st) => st === 'bino' },
    prismA: {
      text: 'lbl_prism',
      point: () => binoWorld({ x: BINO.a + BINO.h * 0.6, y: BINO.h * 0.9, z: BINO.wb + BINO.s }),
      spots: [...ABOVE, ...RIGHT_OF],
      show: (st) => st === 'bino' && s.v.bino > 0.99,
    },
    prismB: {
      text: 'lbl_prism',
      point: () => binoWorld({ x: BINO.b - BINO.h * 0.6, y: BINO.s, z: BINO.wb + BINO.h }),
      spots: [...BELOW, ...LEFT_OF],
      show: (st) => st === 'bino' && s.v.bino > 0.99,
    },
  };
  function syncLabels() {
    const st = s.mode === 'quiz' ? '' : s.step;
    for (const [id, L] of Object.entries(LABELS)) {
      const want = !s.busy || id === 'eye' ? L.show(st) : false;
      if (want && !anno.has(id)) {
        anno.add(id, { text: typeof L.text === 'function' ? L.text() : t(L.text), point: L.point, kind: 'part', color: L.color, spots: L.spots });
      } else if (!want && anno.has(id)) anno.remove(id);
    }
  }

  // ── camera: a gentle three-quarter view per pose; flights between them ─────
  const DIRS = { scene: V(0.36, 0.3, 1), prism: V(0.24, 0.13, 1), bino: V(0.28, 0.6, 1) };
  const BOXES = {
    scene: new THREE.Box3(V(-35, 0, -5), V(13.5, 34, 5)),
    prism: new THREE.Box3(V(-4.4, PERI.ywMax - 3.9, -2.6), V(4.4, PERI.ywMax + 4.4, 2.6)),
    bino: new THREE.Box3(V(BINO_AT.x - 4.5, 0.4, BINO_AT.z + 0.6), V(BINO_AT.x + 15.6, 6, BINO_AT.z + 7.2)),
  };
  const poses = {};
  function fitPoses() {
    for (const k of Object.keys(BOXES)) {
      const d = DIRS[k].clone().normalize();
      const f = fitPose({ box: BOXES[k], dir: d, camera, width: stage.width, height: stage.height, margin: MARGIN });
      poses[k] = f;
    }
  }
  let camK = 1;
  let camFrom = null;
  function applyCamera() {
    if (s.userMovedCamera) return;
    const g = poses[s.pose];
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, g.position, k);
      controls.target.lerpVectors(camFrom.target, g.target, k);
    } else {
      camera.position.copy(g.position);
      controls.target.copy(g.target);
    }
    controls.update();
  }
  /** The guided camera flies to a pose (taking the view back from the student). */
  function flyTo(pose, duration = T.fly) {
    const was = s.userMovedCamera;
    if (was) {
      s.userMovedCamera = false;
      rotate.home();
    }
    if (s.view !== 'front') {
      s.view = 'front';
      syncUI();
      emit('view', { view: s.view });
    }
    const same = pose === s.pose && !was && camK >= 1;
    s.pose = pose;
    if (same) return Promise.resolve(true);
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    if (!duration) {
      camK = 1;
      tweener.cancel('camera');
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camK = k;
        stage.invalidate();
      },
      onComplete: () => {
        camK = 1;
      },
    }).finished;
  }
  function beginOrbit() {
    if (s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
      emitChange();
    }
  }
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${t.num(360)}°`,
    label: t('view_rotate'),
    pulse: Boolean(o.coach),
    zoom: [0.45, 2.2],
    when: () => s.mode !== 'quiz',
    onTurn: beginOrbit,
  });
  rotateEl = rotate.el;
  /** The step's pose turned round its target by `deg` degrees (the student's view, as if dragged round). */
  function turnView(deg) {
    s.view = '3d';
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    const g = poses[s.pose];
    const off = g.position
      .clone()
      .sub(g.target)
      .applyAxisAngle(V(0, 1, 0), THREE.MathUtils.degToRad(deg));
    camera.position.copy(g.target).add(off);
    controls.target.copy(g.target);
    controls.update();
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    stage.invalidate();
  }
  function setView(view, { animate = true } = {}) {
    if (view === '3d') {
      turnView(40);
      return Promise.resolve(true);
    }
    const p = flyTo(s.pose, animate ? 1.2 : 0);
    emitChange();
    return p;
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
  });
  stage.onAfterRender(() => {
    paint();
    syncLabels();
  });
  stage.onResize(() => {
    fitPoses();
    drawing.size();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  const KEYS = Object.keys(TARGET.intro.v);
  /** Moves some of the values to where they go, together, over `duration` seconds. */
  function tweenTo(to, duration, my) {
    const from = { ...s.v };
    return tweener
      .animate({
        key: 'step',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const key of Object.keys(to)) s.v[key] = from[key] + (to[key] - from[key]) * k;
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  /** The plan from one step to another: a list of [values, seconds, pose?], played one after the other. */
  function planFor(from, to) {
    const goal = TARGET[to].v;
    if (from === 'intro' && to === 'wall') return [[{ block: 1 }, T.block]];
    if (from === 'wall' && to === 'peri') {
      const plan = [];
      if (s.v.head < 1) plan.push([{ head: 1 }, T.raise * (1 - s.v.head) + 0.4]);
      plan.push([{ light: 1 }, T.light]);
      return plan;
    }
    if (from === 'peri' && to === 'prism') {
      const plan = [];
      if (s.v.head < 1) plan.push([{ head: 1 }, 1.2]);
      plan.push([{ block: 0 }, T.fly, 'prism'], [{ normal: 1 }, T.normal], [{ arcs: 1 }, T.arcs]);
      return plan;
    }
    if (from === 'prism' && to === 'bino')
      return [
        [{ normal: 0, arcs: 0, light: 0 }, 2.4, 'bino'],
        [{ bino: 1 }, T.bino],
        [{ marks: 1 }, T.marks],
      ];
    // a jump (a step word, back, several at once): everything together while the camera flies there
    const all = {};
    for (const k of KEYS) all[k] = goal[k];
    return [[all, T.back + 0.6, TARGET[to].pose]];
  }
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    s.busy = false;
  }
  async function go(step, { animate = true, from: fromStep = null } = {}) {
    if (!(step in TARGET)) return;
    const from = fromStep ?? s.step;
    stopAll();
    endDrag();
    const my = s.run;
    s.step = step;
    hintOff();
    if (!animate || from === step) {
      Object.assign(s.v, TARGET[step].v);
      flyTo(TARGET[step].pose, animate ? T.back : 0);
      s.busy = false;
      done();
      return;
    }
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    const plan = planFor(from, step);
    // the camera stays where it is until a part of the plan names a pose (a flight back to it, if the student turned it)
    if (!plan.some((p) => p[2]) && (s.userMovedCamera || s.pose !== TARGET[step].pose)) flyTo(TARGET[step].pose, T.back);
    for (const [to, sec, pose] of plan) {
      const flight = pose ? flyTo(pose, Math.max(T.fly, sec)) : null;
      const ok = await tweenTo(to, sec, my);
      if (flight) await flight;
      if (!ok || my !== s.run) return;
    }
    s.busy = false;
    audio.success?.();
    done();
  }
  function done() {
    syncScene();
    refresh();
    emitChange();
  }
  /** The step just shown, again, from the step before it. */
  function replay() {
    if (s.locked) return lockedNudge();
    if (s.busy || s.step === 'intro') return;
    const i = ORDER.indexOf(s.step);
    const prev = ORDER[i - 1];
    stopAll();
    Object.assign(s.v, TARGET[prev].v);
    if (s.pose !== TARGET[prev].pose || s.userMovedCamera) flyTo(TARGET[prev].pose, 0);
    go(s.step, { from: prev });
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_look', 1, ICONS.hand],
    wall: ['act_raise', 2, ICONS.drag],
    peri: ['act_prism', 3, ICONS.hand],
    prism: ['act_bino', 4, ICONS.hand],
    bino: ['act_quiz', '', ICONS.chevR],
  };
  const replayBtn = /** @type {HTMLButtonElement} */ ($('[data-act="replay"]'));
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const steady = { lead: '', act: '' };
  function outcome() {
    if (s.step === 'wall') return t('out_wall');
    if (s.step === 'peri') return pathNow.seen === 'flower' ? t('out_peri') : t('out_peri_low');
    if (s.step === 'prism') return t('out_prism', { i: round(pathNow.angles[0]), c: CRIT, turn: round(pathNow.turns[0]) });
    if (s.step === 'bino') return t('out_bino', { n: BPATH.at.length, path: PATH_CM, body: BODY_CM });
    return '';
  }
  // the hidden copies that hold the room: every lead-in line, every result with its rule
  for (const k of ['intro_lead', ...STEPS.map((x) => `lead_${x}`)]) ghost(leadBox, t(k), 'pp-lead');
  for (const [o1, r1] of [
    [t('out_wall'), 'rule_wall'],
    [t('out_peri'), 'rule_peri'],
    [t('out_peri_low'), 'rule_peri'],
    [t('out_prism', { i: 45, c: CRIT, turn: 90 }), 'rule_prism'],
    [t('out_bino', { n: BPATH.at.length, path: PATH_CM, body: BODY_CM }), 'rule_bino'],
  ])
    ghost(body, `<p class="pvc-outcome">${o1}</p><p class="pvc-rule">${t(r1)}</p>`);
  function refresh() {
    if (s.mode === 'quiz') return;
    pathNow = periscopePath(yw());
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm ? t('intro_lead') : s.busy ? steady.lead : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      ui.learn.classList.toggle('pp-calm', calm);
    }
    sheet.outcome(calm || s.busy ? '' : outcome());
    sheet.rule(calm || s.busy ? '' : t(`rule_${s.step}`));
    sheet.choose(calm ? null : s.step);
    sheet.next({ intro: 'wall', wall: 'peri', peri: 'prism', prism: 'bino' }[s.step] ?? null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      if (step !== '' && enabled && s.mode === 'explore' && !s.drag) action.show('scene');
      else action.hide('scene');
    }
    replayBtn.hidden = calm;
    replayBtn.disabled = s.busy;
    homeBtn.hidden = calm;
    homeBtn.disabled = s.busy;
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the part, a tap on the part ──────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const i = ORDER.indexOf(s.step);
    if (i < ORDER.length - 1) return go(ORDER[i + 1]);
    return quiz.start();
  }
  // the head's part that shows above the fixed tube (the ring round the whole head would hide the periscope)
  const headBox = new THREE.Box3();
  const targets = {
    intro: () => EYE,
    wall: () => headBox.set(headBox.min.set(-PERI.inner, yw() - 1.2, -PERI.inner), headBox.max.set(PERI.inner, yw() + HEAD_TOP, PERI.inner)),
    peri: () => peri.upPrism.body,
    prism: () => bino.body,
    bino: () => null,
  };
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_look',
    icon: ICONS.hand,
    target: () => (s.busy ? null : targets[s.step]()),
    radius: 26,
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), () => boxOf(rotateEl), () => drawing.boxes(), () => headHandle?.box()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── dragging the periscope's head (↕); a tap on the marked part is the action ──
  const canDrag = () => s.mode === 'explore' && !s.locked && !s.busy && (s.step === 'wall' || s.step === 'peri') && s.pose === 'scene' && camK >= 1;
  const handleAt = V(0, 0, 0);
  // beside the head on the eye's side, a little below its top window: clear of the light (which runs on the
  // flower's side and down the middle) and of the action's badge (above the ring)
  const HANDLE_UP = -2.6;
  const HANDLE_X = PERI.inner + 1.6;
  headHandle = createDragHandle(stage, {
    point: () => handleAt.set(HANDLE_X, yw() + HANDLE_UP, PERI.inner),
    axis: 'y',
    track: { from: V(HANDLE_X, PERI.ywMin + HANDLE_UP, PERI.inner), to: V(HANDLE_X, PERI.ywMax + HANDLE_UP, PERI.inner) },
    label: t('drag_me'),
    labelAt: 'right',
    aria: t('aria_drag_head'),
    pulse: Boolean(o.coach),
    when: canDrag,
  });
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function onHead(p) {
    if (headHandle.hit(p.x, p.y)) return true;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(peri.hit, false).length > 0;
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = hostXY(e);
      down = { x: p.x, y: p.y, at: now() };
      if (!canDrag() || !onHead(p)) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      s.drag = { id: e.pointerId, x: p.x, y: p.y, yw: yw(), moved: false };
      headHandle.markUsed();
      action.hide('drag');
      emit('dragstart', { part: 'head' });
      e.preventDefault();
    },
    { capture: true },
  );
  const A = { x: 0, y: 0 };
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    const a = drawing.screen(0, g.yw, 0);
    const b = drawing.screen(0, g.yw + 1, 0);
    A.x = b.x - a.x;
    A.y = b.y - a.y;
    const cm = ((p.x - g.x) * A.x + (p.y - g.y) * A.y) / Math.max(0.01, A.x * A.x + A.y * A.y);
    const next = Math.min(1, Math.max(0, headK(g.yw + cm)));
    if (Math.abs(p.y - g.y) + Math.abs(p.x - g.x) > 6) g.moved = true;
    if (next !== s.v.head) {
      const wasSeen = pathNow.seen;
      s.v.head = next;
      pathNow = periscopePath(yw());
      if (pathNow.seen !== wasSeen) audio.tick?.();
      refresh();
      emitChange();
    }
  });
  /** Ends a drag; a head raised over the wall in the first step goes on to the periscope's step. */
  function endDrag(e) {
    const g = s.drag;
    if (!g || (e && e.pointerId !== g.id)) return false;
    if (e) releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked;
    action.show('drag');
    emit('dragend', { part: 'head' });
    refresh();
    emitChange();
    return g.moved;
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const dragged = endDrag(e);
    if (dragged && s.step === 'wall' && pathNow.seen === 'flower') {
      go('peri');
      down = null;
      return;
    }
    if (!down) return;
    const p = hostXY(e);
    const moved = Math.hypot(p.x - down.x, p.y - down.y);
    const quick = now() - down.at < 600;
    down = null;
    if (moved > 8 || !quick || s.mode !== 'explore') return;
    const r = action.ringBox();
    if (r && p.x > r.left - 8 && p.x < r.right + 8 && p.y > r.top - 8 && p.y < r.bottom + 8) doAction();
  });
  ui.canvasHost.addEventListener('pointercancel', (e) => endDrag(e));
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || s.drag) return;
    const p = hostXY(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = canDrag() && onHead(p) ? 'grab' : '';
    });
  });

  // ── how to use, in the panel: the rotate pill, the সামনে button, the head's handle ──
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      {
        kind: 'drag',
        axis: 'y',
        text: t('howto_head'),
        aria: t('aria_howto_head'),
        handle: headHandle,
        when: () => s.step === 'wall' || s.step === 'peri',
      },
    ],
    { stage },
  );

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
    const p = periscopePath(yw());
    return {
      step: s.step,
      head: round(s.v.head, 2),
      window: round(yw(), 1), // the top window's height (cm)
      wallTop: SCENE.wall.top,
      seen: p.seen,
      light: s.v.light >= 1 && p.seen === 'flower' ? 'flower' : s.v.light >= 1 ? 'wall' : 'none',
      angle: round(p.angles[0], 1),
      critical: CRIT,
      total: p.total[0] && p.total[1],
      turn: round(p.turns[0]),
      reflections: s.v.bino >= 1 ? BPATH.at.length : 0,
      path: PATH_CM,
      body: BODY_CM,
      busy: s.busy,
      pose: s.pose,
      next: { intro: 'look', wall: 'raise', peri: 'prism', prism: 'bino', bino: 'quiz' }[s.step],
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.seen, snap.head]);
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
      label: (j) => `<span class="pp-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  let learnSaved = 'intro';
  let picked = -1;
  let question = null;
  const words = (keys) => keys.map((key) => ({ key }));
  /** The five questions: what the eye sees with the head low, the angle, why it reflects, how many times, why prisms. */
  const KINDS = ['see', 'angle', 'why', 'times', 'bino'];
  /** Each question's scene, set by hand so nothing from before shows through. */
  const SCENES = {
    see: { v: { block: 0, light: 0, normal: 0, arcs: 0, bino: 0, marks: 0, head: 0 }, pose: 'scene' },
    angle: { v: { block: 0, light: 1, normal: 1, arcs: 0, bino: 0, marks: 0, head: 1 }, pose: 'prism' },
    why: { v: { block: 0, light: 1, normal: 1, arcs: 1, bino: 0, marks: 0, head: 1 }, pose: 'prism' },
    times: { v: { block: 0, light: 0, normal: 0, arcs: 0, bino: 1, marks: 0, head: 1 }, pose: 'bino' },
    bino: { v: { block: 0, light: 0, normal: 0, arcs: 0, bino: 1, marks: 0, head: 1 }, pose: 'bino' },
  };
  const VARS = { i: 45, c: CRIT, turn: 90, zero: 0, n: 4 };
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        learnSaved = s.step;
        stopAll();
        endDrag();
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quiz = '';
        syncUI();
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        s.quiz = kind;
        stopAll();
        Object.assign(s.v, SCENES[kind].v);
        if (kind === 'see' || kind === 'angle' || kind === 'why') s.step = kind === 'see' ? 'peri' : 'prism';
        else s.step = 'bino';
        await flyTo(SCENES[kind].pose, 0.9);
        if (!alive()) return null;
        question = { kind };
        stage.invalidate();
        if (kind === 'see')
          return { text: t('q_see'), ...choicesOf(words(['c_see_right', 'c_see_flower', 'c_see_table', 'c_see_dark']), kind, (x) => t(x.key)) };
        if (kind === 'angle') {
          const items = [
            { key: 'a45', v: 45 },
            { key: 'a90', v: 90 },
            { key: 'a0', v: 0 },
            { key: 'ac', v: CRIT },
          ];
          return { text: t('q_angle'), ...choicesOf(items, kind, (x) => `${N(x.v)}°`) };
        }
        if (kind === 'why')
          return { text: t('q_why', VARS), ...choicesOf(words(['c_why_right', 'c_why_small', 'c_why_silver', 'c_why_into']), kind, (x) => t(x.key)) };
        if (kind === 'times') {
          const items = [
            { key: 'n4', v: 4 },
            { key: 'n2', v: 2 },
            { key: 'n1', v: 1 },
            { key: 'n8', v: 8 },
          ];
          return { text: t('q_times'), ...choicesOf(items, kind, (x) => t('c_times', { n: x.v })) };
        }
        return { text: t('q_bino'), ...choicesOf(words(['c_b_right', 'c_b_big', 'c_b_colour', 'c_b_more']), kind, (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrong = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrong && map[wrong] ? ` ${t(map[wrong], VARS)}` : '');
        if (k === 'see') return t('why_see') + note({ c_see_flower: 'mis_see_flower', c_see_table: 'mis_see_table', c_see_dark: 'mis_see_dark' });
        if (k === 'angle') return t('why_angle', VARS) + note({ a90: 'mis_angle_90', a0: 'mis_angle_0', ac: 'mis_angle_c' });
        if (k === 'why')
          return t('why_why', VARS) + note({ c_why_small: 'mis_why_small', c_why_silver: 'mis_why_silver', c_why_into: 'mis_why_into' });
        if (k === 'times') {
          const extra = wrong === 'n8' ? ` ${t('mis_times_8', { n: 8 })}` : note({ n2: 'mis_times_2', n1: 'mis_times_1' });
          return t('why_times', VARS) + extra;
        }
        return t('why_b') + note({ c_b_big: 'mis_b_big', c_b_colour: 'mis_b_colour', c_b_more: 'mis_b_more' });
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
    stage.invalidate();
  }
  function goHome() {
    return go('intro', { animate: false });
  }
  /** Moves the head a little (the arrow keys). */
  function nudge(dir) {
    if (!canDrag()) return false;
    const was = pathNow.seen;
    s.v.head = Math.min(1, Math.max(0, s.v.head + dir * 0.1));
    headHandle.markUsed();
    pathNow = periscopePath(yw());
    refresh();
    emitChange();
    if (s.step === 'wall' && was !== 'flower' && pathNow.seen === 'flower' && s.v.head >= 1) go('peri');
    return true;
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && s.mode === 'explore') {
      if (s.busy && b.dataset.example === s.step) return;
      if (b.dataset.example === s.step) replay();
      else go(b.dataset.example);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'home') goHome();
    else if (b.dataset.act === 'replay') replay();
    else if (b.dataset.act === 'q-next') quiz.next();
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
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowUp' || k === 'ArrowDown') {
      if (onButton && tgt.closest('[role="radiogroup"]')) return;
      if (!nudge(k === 'ArrowUp' ? 1 : -1)) return;
    } else if (k === 'ArrowRight' && !onButton) {
      if (s.step !== 'bino') doAction();
    } else if (k === 'ArrowLeft' && !onButton) go(ORDER[Math.max(1, ORDER.indexOf(s.step) - 1)]);
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  fitPoses();
  syncUI();
  applyCamera();
  syncScene();
  refresh();
  // the parts of later steps are in the scene from the start (nothing new to compile on a tap)
  stage.warmUp({ show: [bino.root] });
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    if (s.view === '3d') setView('3d');
  })();

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /** Change any of: step ('intro' | 'wall' | 'peri' | 'prism' | 'bino'), head (0 down … 1 up, in the first two steps),
     * view ('front' | '3d'), azimuth (degrees: the view turned round the scene). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.step) await go(p.step, { animate });
      if (p.head != null && s.mode === 'explore') {
        s.v.head = Math.min(1, Math.max(0, Number(p.head) || 0));
        if (s.step === 'prism' || s.step === 'bino') s.v.head = 1;
        refresh();
      }
      if (p.view) await setView(p.view, { animate });
      if (p.azimuth != null) turnView(Number(p.azimuth) || 0);
      refresh();
      emitChange();
      stage.invalidate();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await goHome();
      await flyTo('scene', 0);
      headHandle.rearm?.();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** The view with its drawing on it, cover-fitted to the size asked for (background: null keeps it transparent). */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      stage.render();
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const ctx = out.getContext('2d');
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }
      const gl = stage.canvas;
      const k = Math.max(width / gl.width, height / gl.height);
      const x = (width - gl.width * k) / 2;
      const y = (height - gl.height * k) / 2;
      ctx.drawImage(gl, x, y, gl.width * k, gl.height * k);
      ctx.drawImage(drawing.canvas, x, y, gl.width * k, gl.height * k);
      return out.toDataURL('image/png');
    },
    /** The wall, the flower, the periscope (head up) and the binoculars, in centimetres (exported in metres). */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'PrismPeriscope';
      for (const part of [setting.wall, setting.flower, peri.root, bino.root]) {
        const copy = part.clone(true);
        copy.traverse((ob) => {
          ob.visible = !ob.userData.noExport && ob.name !== 'HeadHit';
        });
        g.add(copy);
      }
      return g;
    },
  };
}
