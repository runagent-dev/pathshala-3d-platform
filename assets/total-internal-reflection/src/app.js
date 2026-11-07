// Total internal reflection (book pages 248–251, topic 9.2), student view. The school's optical disc stands on a plain
// table in a calm blue setting: a white disc printed in degrees, a semicircular glass block at its centre with its flat
// face up (glass below, the light medium above, as চিত্র ৯.০৬), and a ray box clamped to the rim, aimed at the centre O
// of the flat face, so the light enters the curved face along a radius and bends only at O. Steps, one tap each, slow:
// ① the light on at θ₂ = 30°: the refracted ray bends away from the normal (θ₁ = 48.6°), a faint reflected ray;
// ② the source turns to θc = 41.8°: θ₁ reaches 90°, the ray grazes the surface; ③ on to 60°: nothing leaves, all of
// it comes back: পূর্ণ অভ্যন্তরীণ প্রতিফলন; ④ the book's question: water on top, at 45° the light now leaves (θc = 62.5°);
// ⑤ চিত্র ৯.০৭: a right-angle prism turns the light by 90°. From ① on the student turns the source (a handle on the
// rim, or the arrow keys) and a live graph in the panel follows: θ₁ against θ₂ up to θc, and the reflected part
// jumping to 100 %. A calm card on the first screen; one lead-in line, the result and the rule per step; a test of five.
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
import { backdrop, createApparatus, TABLE_Y } from './apparatus.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  ANGLE,
  BLOCK,
  caseOf,
  DISC,
  lightAt,
  N as INDEX,
  PRISM,
  prismPath,
  round,
  SOURCE,
  shuffle,
  STEPS,
  snapAngle,
  stepAngle,
  thetaC,
  Z_RAY,
} from './reading.js';

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
const MARGIN = { top: 48, bottom: 12, side: 10 };
// how long things take (s): slow enough to follow (the owner's pace: rays ~1 s a segment, moves 1.5–2.5 s)
const T = {
  normal: 0.8,
  ray: 1.1,
  arcs: 0.8,
  turnCrit: 2.6,
  turnMore: 2.2,
  turnTo: 1.6,
  off: 0.5,
  cell: 1.6,
  fill: 2.2,
  swap: 1.7,
  back: 1.6,
  fly: 1.6,
};
const CRIT_AIR = thetaC('air');
/** Where each step ends: the source's angle θ₂, the light drawn (0–2), the normal and angles, the cell, the water, the block, the prism. */
const TARGET = {
  intro: { theta: 30, light: 0, normal: 0, arcs: 0, cell: 0, water: 0, block: 1, prism: 0 },
  less: { theta: 30, light: 2, normal: 1, arcs: 1, cell: 0, water: 0, block: 1, prism: 0 },
  critical: { theta: CRIT_AIR, light: 2, normal: 1, arcs: 1, cell: 0, water: 0, block: 1, prism: 0 },
  more: { theta: 60, light: 2, normal: 1, arcs: 1, cell: 0, water: 0, block: 1, prism: 0 },
  water: { theta: 45, light: 2, normal: 1, arcs: 1, cell: 1, water: 1, block: 1, prism: 0 },
  prism: { theta: 0, light: 2, normal: 1, arcs: 1, cell: 0, water: 0, block: 0, prism: 1 },
};
const KEYS = Object.keys(TARGET.intro);
const RAD = Math.PI / 180;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** A number as the panel says it: no trailing zeros, at most one decimal. */
  const num1 = (x) => N(round(x, 1));

  root.classList.add('pvc', 'tir');
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
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the line before the action (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'tir-lead';
  $('.pvc-act-row').before(lead);
  // the formula of the step, then the graph, under the rule
  const formula = document.createElement('p');
  formula.className = 'pvc-formula tir-formula';
  $('.pvc-rule').after(formula);
  const graphBox = document.createElement('div');
  graphBox.className = 'tir-graph';
  formula.after(graphBox);
  const graph = createGraph(graphBox, { t, N });
  // in the prism step, beside the 3D: what happens at the long face, in three rows (the graph is the block's)
  const table = document.createElement('table');
  table.className = 'tir-table';
  table.setAttribute('aria-label', t('tbl_label'));
  const pr = prismPath();
  table.innerHTML = [
    ['tbl_inc', `${N(pr.incidence)}°`],
    ['tbl_crit', `${num1(CRIT_AIR)}°`],
    ['tbl_refl', `<b>${N(100)}%</b>`],
  ]
    .map(([k, v]) => `<tr><th scope="row">${t(k)}</th><td>${v}</td></tr>`)
    .join('');
  graphBox.after(table);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 1, far: 600, environment: 'studio-light' });
  const { camera, controls, scene, renderer } = stage;
  controls.enablePan = false;
  renderer.localClippingEnabled = true;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.1);
  sun.position.set(30, 60, 45);
  sun.target.position.set(0, TABLE_Y + 6, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55);
  fill.position.set(-40, 20, 40);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.05;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -14, near: 40, far: 120 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const app3 = createApparatus({ renderer, num: N });
  scene.add(app3.root);
  const rays = createRays({ stage, host: ui.canvasHost });
  // the rays' canvas sits over the 3D and under the labels
  ui.annoLayer.before(rays.canvas);

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
    v: { ...TARGET.intro },
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    dragging: false,
    quizKind: '',
    /** the test hides what the question asks about */
    hideOut: false,
    hideLabels: false,
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  /** The medium above the flat face: water only once the cell sits on it, full. */
  const outside = () => (s.v.cell > 0.99 && s.v.water > 0.99 ? 'water' : 'air');
  const prismOn = () => s.v.prism > 0.5;

  // ── the scene from the state ────────────────────────────────────────────────
  function syncScene() {
    const v = s.v;
    app3.setTheta(v.theta);
    app3.setCell(v.cell);
    app3.setWater(v.water);
    app3.setPieces(v.block, v.prism);
    const rv = rays.view;
    rv.theta = v.theta;
    rv.outside = outside();
    rv.prism = prismOn();
    rv.light = s.hideOut ? Math.min(1, v.light) : v.light;
    rv.normal = v.normal;
    rv.arcs = s.hideLabels ? 0 : v.arcs;
    // while the water rises or the pieces change, the lamp is off (a part-filled cell would bend the light twice)
    rv.dim = 1;
    // the normal belongs to the piece on the disc: none while the block and the prism change places
    rv.piece = rv.prism ? v.prism : v.block;
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  /** @type {any} */
  let handle = null;
  const boxOf = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  };
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => rays.boxes(), () => action?.box(), () => action?.ringBox(), () => boxOf(rotateEl), () => handle?.box()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const LEFT = [spot(-18, 0), spot(-18, -20), spot(-18, 20), spot(-30, -36), spot(-30, 36)];
  const RIGHT = [spot(18, 0), spot(18, -20), spot(18, 20), spot(30, -36), spot(30, 36)];
  const ABOVE = [spot(0, -22), spot(-24, -24), spot(24, -24), spot(0, -40)];
  const BELOW = [spot(0, 22), spot(-24, 24), spot(24, 24), spot(0, 40)];
  const P = new THREE.Vector3();
  const light = () => lightAt(s.v.theta, outside());
  const lit = () => s.v.light > 1.9 && !s.busy;
  const glassText = () => (s.step === 'intro' ? t('lbl_glass0') : t('lbl_glass', { n: INDEX.glass.toFixed(2) }));
  const outText = () => {
    if (s.step === 'intro') return t('lbl_air0');
    return outside() === 'water' ? t('lbl_water', { n: INDEX.water.toFixed(2) }) : t('lbl_air', { n: INDEX.air.toFixed(2) });
  };
  const LABELS = {
    t2: {
      text: () => {
        const L = light();
        return L.kase === 'critical' ? t('lbl_t2c', { a: num1(L.theta2) }) : t('lbl_t2', { a: num1(L.theta2) });
      },
      point: () => {
        const h = (s.v.theta / 2) * RAD;
        return P.set(-2.7 * Math.sin(h), -2.7 * Math.cos(h), Z_RAY);
      },
      color: '#1971c2',
      // beside its arc first, then above the incoming ray (clear of the source's handle on the rim)
      spots: [spot(-22, 20), spot(-30, 6), spot(-10, -26), spot(-34, -22), spot(-14, 32), ...LEFT, ...ABOVE, ...BELOW],
      show: () => s.v.arcs > 0.99 && s.v.light >= 1 && !prismOn() && !s.hideLabels && (!s.busy || s.dragging),
    },
    t1: {
      text: () => t('lbl_t1', { a: num1(light().theta1 ?? 0) }),
      point: () => {
        const h = ((light().theta1 ?? 0) / 2) * RAD;
        return P.set(3.2 * Math.sin(h), 3.2 * Math.cos(h), Z_RAY);
      },
      color: '#2b8a3e',
      spots: [spot(22, -18), spot(30, -4), spot(14, -32), ...RIGHT, ...ABOVE],
      show: () => s.v.arcs > 0.99 && s.v.light > 1.9 && !prismOn() && light().theta1 != null && !s.hideLabels && !s.hideOut,
    },
    glass: {
      text: glassText,
      point: () => P.set(-BLOCK.r * 0.62, -BLOCK.r * 0.62, Z_RAY + 1.3),
      spots: [...LEFT, ...BELOW],
      optional: true,
      show: () => s.v.block > 0.99 && !s.busy,
    },
    outside: {
      text: outText,
      point: () => P.set(-BLOCK.r * 0.75, s.v.cell > 0.5 ? 4.2 : 3.2, Z_RAY),
      spots: [...LEFT, ...ABOVE],
      optional: true,
      show: () => s.v.block > 0.99 && !s.busy && (s.v.cell < 0.01 || s.v.cell > 0.99),
    },
    source: {
      text: () => t('lbl_source'),
      point: () => P.set(-SOURCE.r * Math.sin(s.v.theta * RAD), -SOURCE.r * Math.cos(s.v.theta * RAD), Z_RAY + 1.2),
      spots: [...LEFT, ...BELOW],
      show: () => s.step === 'intro' && !s.busy,
    },
    normal: {
      text: () => t('lbl_normal'),
      point: () => P.set(0, prismOn() ? -1 : 7.6, Z_RAY),
      spots: [...LEFT, ...RIGHT, ...ABOVE],
      optional: true,
      show: () => s.v.normal > 0.99 && !prismOn() && !s.busy && !s.hideLabels,
    },
    none: {
      text: () => t('lbl_none'),
      point: () => P.set(4.6, 3.2, Z_RAY),
      color: '#495057',
      spots: [...ABOVE, ...RIGHT],
      show: () => lit() && !prismOn() && light().theta1 == null && !s.hideLabels && !s.hideOut,
    },
    prism: {
      text: () => t('lbl_prism'),
      point: () => P.set(PRISM.leg / 2, -PRISM.leg / 2, Z_RAY + 1.2),
      spots: [...RIGHT, ...BELOW],
      show: () => s.v.prism > 0.99 && !s.busy,
    },
    p45: {
      text: () => t('lbl_45', { a: N(45) }),
      point: () => P.set(-0.85, -1.6, Z_RAY),
      color: '#1971c2',
      spots: [spot(-22, 10), ...LEFT],
      show: () => s.v.prism > 0.99 && s.v.light >= 1 && !s.hideLabels && !s.busy,
    },
    turn: {
      text: () => t('lbl_turn', { a: N(90) }),
      point: () => P.set(7.5, 0, Z_RAY),
      spots: [...ABOVE, ...BELOW],
      show: () => s.v.prism > 0.99 && lit() && !s.hideOut && !s.hideLabels,
    },
  };
  const textOf = new Map();
  function syncLabels() {
    let required = false;
    for (const [id, L] of Object.entries(LABELS)) {
      const want = s.mode === 'quiz' && !['glass', 'outside', 'prism', 'normal'].includes(id) ? false : L.show();
      if (want && !anno.has(id)) {
        const text = L.text();
        anno.add(id, { text, point: L.point, kind: 'chip', color: L.color, spots: L.spots, optional: Boolean(L.optional) });
        textOf.set(id, text);
        if (!L.optional) required = true;
      } else if (!want && anno.has(id)) anno.remove(id);
      else if (want) {
        const text = L.text();
        if (textOf.get(id) !== text) {
          anno.setText(id, text);
          textOf.set(id, text);
        }
      }
    }
    // a label that matters came in: the optional ones (the media, the normal) find their places again after it, or hide
    if (required)
      for (const [id, L] of Object.entries(LABELS))
        if (L.optional && anno.has(id)) {
          anno.remove(id);
          anno.add(id, { text: textOf.get(id), point: L.point, kind: 'chip', color: L.color, spots: L.spots, optional: true });
        }
  }

  // ── camera: a gentle three-quarter view; closer on the prism's light ─────────
  const discBox = new THREE.Box3(new THREE.Vector3(-DISC.r - 0.8, -DISC.r - 1.6, -1), new THREE.Vector3(DISC.r + 0.8, DISC.r + 0.4, 3));
  // a phone held upright: the 3D is short, so the frame keeps the working part of the disc (the flat face, both rays, the
  // source's arc) and lets the disc's top and the foot fall outside; only the corners need room for the buttons
  const workBox = new THREE.Box3(new THREE.Vector3(-DISC.r - 0.4, -DISC.r - 0.9, -1), new THREE.Vector3(DISC.r + 0.4, 8.6, 3));
  const PORTRAIT_MARGIN = { top: 14, bottom: 8, side: 6 };
  const prismBox = new THREE.Box3(new THREE.Vector3(-5.5, -DISC.r - 1, -1), new THREE.Vector3(DISC.r + 0.6, 5.2, 3));
  const DIR = new THREE.Vector3(Math.sin(22 * RAD) * Math.cos(13 * RAD), Math.sin(13 * RAD), Math.cos(22 * RAD) * Math.cos(13 * RAD));
  const poses = { disc: null, prism: null };
  function fitPoses() {
    const d = DIR.clone();
    if (s.view === '3d' && !s.userMovedCamera) d.add(new THREE.Vector3(0.7, 0.35, 0)).normalize();
    const upright = root.clientHeight > root.clientWidth;
    const args = { dir: d, camera, width: stage.width, height: stage.height, margin: upright ? PORTRAIT_MARGIN : MARGIN };
    const a = fitPose({ box: upright ? workBox : discBox, ...args });
    const b = fitPose({ box: prismBox, ...args });
    poses.disc = { target: a.target, dist: a.position.distanceTo(a.target), dir: d };
    poses.prism = { target: b.target, dist: b.position.distanceTo(b.target), dir: d };
  }
  const guided = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  function guidedPose() {
    const f = s.v.prism;
    const { disc: a, prism: b } = poses;
    guided.target.lerpVectors(a.target, b.target, f);
    const dist = a.dist + (b.dist - a.dist) * f;
    guided.position.copy(guided.target).addScaledVector(a.dir, dist);
    return guided;
  }
  let camK = 1;
  let camFrom = null;
  function applyCamera() {
    if (s.userMovedCamera) return;
    const g = guidedPose();
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
  /** The guided camera takes the view back, flying from wherever the student left it. */
  function takeView(duration = T.fly) {
    const was = s.userMovedCamera;
    if (was) {
      s.userMovedCamera = false;
      rotate.home();
    }
    if (s.view !== 'front') {
      s.view = 'front';
      fitPoses();
      syncUI();
      emit('view', { view: s.view });
    }
    if (!was && camK >= 1) return Promise.resolve(true);
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    if (!duration) {
      camK = 1;
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
    zoom: [0.5, 1.8],
    when: () => s.mode !== 'quiz',
    onTurn: beginOrbit,
  });
  rotateEl = rotate.el;
  function setView(view, { animate = true } = {}) {
    if (view === '3d') {
      s.view = '3d';
      s.userMovedCamera = false;
      rotate.home();
      fitPoses();
      camFrom = { position: camera.position.clone(), target: controls.target.clone() };
      camK = animate ? 0 : 1;
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      if (!animate) return Promise.resolve(true);
      return tweener.animate({ key: 'camera', duration: T.fly, onUpdate: (k) => (camK = k), onComplete: () => (camK = 1) }).finished;
    }
    const p = takeView(animate ? T.fly : 0);
    emitChange();
    return p;
  }
  /** Seen from behind the disc, the light drawn on its face is hidden (the drawing, its labels and the handle). */
  let behind = false;
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    const facing = (camera.position.z - Z_RAY) / Math.max(1e-6, camera.position.distanceTo(controls.target));
    if (behind !== facing < 0.06) {
      behind = facing < 0.06;
      ui.annoLayer.style.opacity = behind ? '0' : ''; // (each label sets its own visibility)
      if (behind) action?.hide('behind');
      else action?.show('behind');
    }
    syncScene();
    rays.view.show = !behind;
  });
  stage.onResize(() => {
    fitPoses();
    syncScene();
    refresh();
  });
  // the sheet's height depends on the panel's width, not the 3D's: measured again when the window changes
  let steadyTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(steadyTimer);
    steadyTimer = setTimeout(() => steadySheet(), 60);
  });

  // ── the steps ───────────────────────────────────────────────────────────────
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
          refresh();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  /** The plan from one step to the next: a list of [values, seconds], played one after the other. */
  function planFor(from, to) {
    const goal = TARGET[to];
    if (from === 'intro' && to === 'less')
      return [
        [{ normal: 1 }, T.normal],
        [{ light: 1 }, T.ray],
        [{ light: 2 }, T.ray],
        [{ arcs: 1 }, T.arcs],
      ];
    if (from === 'less' && to === 'critical') return [[{ theta: goal.theta }, T.turnCrit]];
    if (from === 'critical' && to === 'more') return [[{ theta: goal.theta }, T.turnMore]];
    if (from === 'more' && to === 'water')
      return [
        [{ theta: goal.theta }, T.turnTo],
        [{ light: 1 }, T.off],
        [{ cell: 1 }, T.cell],
        [{ water: 1 }, T.fill],
        [{ light: 2 }, T.ray],
      ];
    if (from === 'water' && to === 'prism')
      return [
        [{ light: 0 }, T.off],
        [{ cell: 0 }, T.cell],
        [{ water: 0, block: 0, theta: 0 }, T.swap],
        [{ prism: 1 }, T.swap],
        [{ light: 1 }, T.ray],
        [{ light: 2 }, T.ray],
      ];
    // a jump (a step word, back, or several at once): the light off, everything moved, the light on again
    const plan = [];
    const changesPieces = goal.cell !== s.v.cell || goal.water !== s.v.water || goal.block !== s.v.block || goal.prism !== s.v.prism;
    if (changesPieces && s.v.light > 0) plan.push([{ light: 0 }, T.off]);
    const rest = {};
    for (const k of KEYS) if (k !== 'light') rest[k] = goal[k];
    plan.push([rest, T.back]);
    if (goal.light > 0) plan.push([{ light: goal.light }, changesPieces ? T.ray * 1.4 : T.off]);
    return plan;
  }
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    s.busy = false;
  }
  async function go(step, { animate = true, replay = false } = {}) {
    if (!(step in TARGET)) return;
    let from = s.step;
    stopAll();
    const my = s.run;
    hintOff();
    takeView(animate ? T.fly : 0);
    if (replay && animate) {
      // play the step again from the end of the one before it
      const order = ['intro', ...STEPS];
      from = order[Math.max(0, order.indexOf(step) - 1)];
      Object.assign(s.v, TARGET[from]);
    }
    s.step = step;
    if (!animate || (from === step && !replay)) {
      Object.assign(s.v, TARGET[step]);
      s.busy = false;
      done();
      return;
    }
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    for (const [to, sec] of planFor(from, step)) {
      if (!(await tweenTo(to, sec, my))) return;
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

  // ── turning the source: the handle on the rim, the ray box itself, the arrow keys ──
  const canTurn = () => s.mode === 'explore' && !s.locked && !s.busy && ['less', 'critical', 'more', 'water'].includes(s.step);
  const RIM = DISC.r + 1.7;
  const rimAt = (a, out = new THREE.Vector3()) => out.set(-RIM * Math.sin(a * RAD), -RIM * Math.cos(a * RAD), Z_RAY);
  const hp = new THREE.Vector3();
  const hd = new THREE.Vector3();
  const tr = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  handle = createDragHandle(stage, {
    point: () => rimAt(s.v.theta, hp),
    axis: 'turn',
    direction: () => hd.set(-Math.cos(s.v.theta * RAD), Math.sin(s.v.theta * RAD), 0),
    track: { from: () => rimAt(ANGLE.min, tr[0]), via: () => rimAt((ANGLE.min + ANGLE.max) / 2, tr[1]), to: () => rimAt(ANGLE.max, tr[2]) },
    label: o.coach ? t('drag_me') : '',
    labelAt: 'left',
    aria: t('aria_drag'),
    pulse: Boolean(o.coach),
    when: () => canTurn() && !behind,
  });
  /**
   * After the student turns the source in air, the step is the case the light is in now (the book's three cases), so
   * the step words, the action and the lead-in agree with the result and the rule: turned past θc in the first step,
   * the action offers the water next, not "turn more".
   */
  function followLight() {
    if (s.busy || outside() !== 'air' || !['less', 'critical', 'more'].includes(s.step)) return;
    const kase = caseOf(s.v.theta, 'air');
    if (kase === s.step) return;
    s.step = kase;
    emitChange();
  }
  // the handle is placed after each frame, after the labels: when the source has moved, the labels are placed again
  // against the handle's new place
  let labelsAt = null;
  stage.onAfterRender(() => {
    if (labelsAt === s.v.theta) return;
    labelsAt = s.v.theta;
    handle.update();
    anno.update();
  });
  function setTheta(a) {
    const x = snapAngle(a, outside());
    if (x === s.v.theta) return;
    s.v.theta = x;
    followLight();
    audio.tick?.();
    refresh();
    stage.invalidate();
    emitChange();
  }
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_RAY);
  const hitPt = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function rayFrom(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  /** The angle of the source for a point on the view: where the finger meets the disc's plane, seen from O. */
  function angleAt(p) {
    rayFrom(p);
    if (!raycaster.ray.intersectPlane(plane, hitPt)) return null;
    // the source lives on the lower half: θ from the downward normal toward the left
    const a = Math.atan2(-hitPt.x, -hitPt.y) / RAD;
    return Math.min(ANGLE.max, Math.max(ANGLE.min, a));
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const p = canvasPoint(e);
      const onHandle = handle.hit(p.x, p.y);
      rayFrom(p);
      const onBox = !onHandle && raycaster.intersectObject(app3.hit, false).length > 0;
      if (!onHandle && !onBox) return;
      if (!canTurn()) {
        if (s.locked) lockedNudge();
        else if (onBox && !s.busy) {
          // a tap on the ray box before turning is allowed: the step's action
          e.stopPropagation();
          e.preventDefault();
          doAction();
        }
        return;
      }
      drag = { id: e.pointerId };
      s.dragging = true;
      controls.enabled = false; // a drag of the source is not a turn of the view
      handle.markUsed();
      capturePointer(ui.canvasHost, e.pointerId);
      e.stopPropagation();
      e.preventDefault();
      emit('dragstart', { theta: s.v.theta });
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      const a = angleAt(canvasPoint(e));
      if (a != null) setTheta(a);
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      rayFrom(p);
      const over = handle.hit(p.x, p.y) || raycaster.intersectObject(app3.hit, false).length > 0;
      ui.canvasHost.style.cursor = over ? (canTurn() ? 'grab' : s.locked ? 'not-allowed' : '') : '';
    });
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    releasePointer(ui.canvasHost, drag.id);
    drag = null;
    controls.enabled = true;
    s.dragging = false;
    refresh();
    emitChange();
    emit('dragend', { theta: s.v.theta });
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_light', 1, ICONS.hand],
    less: ['act_turn', 2, ICONS.hand],
    critical: ['act_more', 3, ICONS.hand],
    more: ['act_water', 4, ICONS.hand],
    water: ['act_prism', 5, ICONS.hand],
    prism: ['act_quiz', '', ICONS.chevR],
  };
  const NEXT = { intro: 'less', less: 'critical', critical: 'more', more: 'water', water: 'prism' };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const replayBtn = /** @type {HTMLButtonElement} */ ($('[data-act="replay"]'));
  const steady = { lead: '', act: '', formula: null };
  /** The result line: from the light (where the source is, what is above the glass). */
  function outcomeHtml(theta = s.v.theta, out = outside(), prism = prismOn()) {
    if (prism) {
      const p = prismPath();
      return t('out_prism', { a: N(p.incidence), b: N(p.turned), c: num1(CRIT_AIR) });
    }
    const L = lightAt(theta, out);
    if (L.kase === 'critical') return t('out_critical', { a: num1(L.theta2), b: N(90) });
    if (L.kase === 'more') {
      // the book's reasoning, with the student's numbers: sin θ₁ would have to be more than 1
      const n1 = out === 'water' ? INDEX.water : INDEX.air;
      const f = `${N(INDEX.glass.toFixed(2))} × sin ${num1(L.theta2)}°${out === 'water' ? ` ÷ ${N(n1.toFixed(2))}` : ''}`;
      const sin1 = (INDEX.glass * Math.sin((L.theta2 * Math.PI) / 180)) / n1;
      return t('out_more', { a: num1(L.theta2), f, s: N(sin1.toFixed(2)) });
    }
    const r = Math.max(1, Math.round(L.R * 100));
    if (L.theta2 < 0.5) return t('out_zero', { r });
    return t('out_less', { a: num1(L.theta2), b: num1(L.theta1), r });
  }
  /** The rule: by the case the light is in, so it never says something false after a drag. */
  function ruleHtml(theta = s.v.theta, out = outside(), prism = prismOn()) {
    if (prism) return t('rule_prism');
    const L = lightAt(theta, out);
    if (L.theta2 < 0.5) return t('rule_zero');
    if (out === 'water') {
      const vars = { a: num1(L.theta2), c: num1(L.thetaC), air: num1(CRIT_AIR) };
      return t(`rule_water_${L.kase}`, vars);
    }
    return t(`rule_${L.kase}`);
  }
  /** The lead-in line of a step: the long words, and the short ones for small frames. */
  function leadOf(step) {
    if (step === 'intro') return `<span class="tir-long">${t('intro')}</span><span class="tir-short">${t('intro_short')}</span>`;
    const short = t(`lead_short_${step}`);
    const long = t(`lead_${step}`);
    return short.startsWith('lead_short') ? long : `<span class="tir-long">${long}</span><span class="tir-short">${short}</span>`;
  }
  /**
   * Steady layout: the 3D keeps one size in every state. Below the 3D (a phone held upright) the শেখো sheet is made as
   * tall as its tallest state: each step's lead-in, result and rule (at the angles a student meets) and the calm card
   * are written in turn, measured, and put back, all before the next paint.
   */
  const outcomeEl = $('.pvc-outcome');
  const ruleEl = $('.pvc-rule');
  function steadySheet() {
    ui.learn.style.minHeight = '';
    const side = root.clientWidth >= 600 && root.clientWidth >= root.clientHeight;
    root.classList.toggle('tir-side', side);
    if (side) return; // the panel is beside the 3D: its height does not change the 3D's
    const keep = [
      lead.innerHTML,
      outcomeEl.innerHTML,
      ruleEl.innerHTML,
      ui.learn.classList.contains('tir-calm'),
      lead.classList.contains('pvc-note'),
    ];
    let tallest = 0;
    const tryState = (calm, l, out, rule) => {
      ui.learn.classList.toggle('tir-calm', calm);
      lead.classList.toggle('pvc-note', calm);
      lead.innerHTML = l;
      outcomeEl.innerHTML = out;
      ruleEl.innerHTML = rule;
      tallest = Math.max(tallest, ui.learn.offsetHeight);
    };
    tryState(true, leadOf('intro'), '', '');
    const angles = { air: [0, 30, 40, CRIT_AIR, 60, 80], water: [45, 62.5, 70] };
    for (const step of STEPS)
      for (const out of step === 'water' ? ['water'] : ['air'])
        for (const a of step === 'prism' ? [0] : angles[out])
          tryState(false, leadOf(step), outcomeHtml(a, out, step === 'prism'), ruleHtml(a, out, step === 'prism'));
    [lead.innerHTML, outcomeEl.innerHTML, ruleEl.innerHTML] = keep;
    ui.learn.classList.toggle('tir-calm', keep[3]);
    lead.classList.toggle('pvc-note', keep[4]);
    ui.learn.style.minHeight = `${tallest}px`;
  }
  /** The formula line: Snell's law at first, then the critical angle (air or water). */
  function formulaHtml() {
    if (s.step === 'less' || s.step === 'intro') return t('f_snell');
    const water = s.step === 'water' && outside() === 'water';
    const n1 = water ? INDEX.water : INDEX.air;
    return t('f_crit_air', {
      n1: n1.toFixed(2),
      n2: INDEX.glass.toFixed(2),
      s: round(n1 / INDEX.glass, 2).toFixed(2),
      c: num1(thetaC(water ? 'water' : 'air')),
    });
  }
  function refresh() {
    syncLabels();
    stage.invalidate();
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = s.busy && !calm ? steady.lead : leadOf(s.step);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('tir-calm', calm);
    }
    // the result and the rule follow the light as the student turns it (they never lag behind a drag); while a step
    // plays they wait for its end (the 3D labels and the graph's dot follow the light meanwhile)
    const shown = !calm && s.v.light > 1.9 && !s.busy;
    sheet.outcome(shown ? outcomeHtml() : '');
    sheet.rule(shown ? ruleHtml() : '');
    const f = shown && !prismOn() ? formulaHtml() : '';
    if (steady.formula !== f) {
      steady.formula = f;
      formula.innerHTML = f || '&nbsp;';
      formula.classList.toggle('tir-off', !f);
    }
    graph.draw({ theta: s.v.theta, outside: outside(), show: !calm && !prismOn() && s.v.light > 1, compare: outside() === 'water' });
    graphBox.classList.toggle('tir-off', calm);
    graphBox.classList.toggle('tir-none', prismOn());
    table.classList.toggle('tir-none', !prismOn() || s.v.light < 1.9);
    sheet.choose(calm ? null : s.step);
    sheet.next(NEXT[s.step] ?? null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      if (step !== '' && enabled && s.mode === 'explore' && o.coach && s.step === 'intro') action.show('scene');
      else action.hide('scene');
    }
    homeBtn.hidden = calm;
    homeBtn.disabled = s.busy;
    replayBtn.hidden = calm;
    replayBtn.disabled = s.busy;
  }

  // ── the action: the big button, the ring on the ray box, a tap on the box ────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return;
    if (NEXT[s.step]) return go(NEXT[s.step]);
    return quiz.start();
  }
  const ringAt = new THREE.Vector3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_light',
    icon: ICONS.hand,
    target: () => ringAt.set(-SOURCE.r * Math.sin(s.v.theta * RAD), -SOURCE.r * Math.cos(s.v.theta * RAD), Z_RAY),
    radius: 26,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── how to use, in the panel ────────────────────────────────────────────────
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'drag', axis: 'turn', text: t('howto_turn'), handle, when: () => s.step !== 'intro' && s.step !== 'prism' },
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
    const L = light();
    return {
      step: s.step,
      theta2: round(s.v.theta, 1),
      theta1: L.theta1 == null || s.v.prism > 0.5 ? null : round(L.theta1, 1),
      thetaC: L.thetaC,
      outside: outside(),
      case: s.v.prism > 0.5 ? 'prism' : L.kase,
      reflected: round(s.v.prism > 0.5 ? 1 : L.R, 3),
      light: s.v.light > 1.9,
      busy: s.busy,
      next: NEXT[s.step] ?? 'quiz',
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.theta2, snap.outside]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the test ────────────────────────────────────────────────────────────────
  /** Five questions, each with its own scene; the picture never shows the answer (the light stops at O). */
  const KINDS = ['away', 'crit', 'tir', 'water', 'prism'];
  const SCENES = {
    away: { step: 'less', theta: 30, hideOut: true },
    crit: { step: 'critical', theta: CRIT_AIR, hideOut: false, hideLabels: true },
    tir: { step: 'more', theta: 70, hideOut: true },
    water: { step: 'water', theta: 50, hideOut: true },
    prism: { step: 'prism', theta: 0, hideOut: true },
  };
  const CHOICES = {
    away: ['c_away_right', 'c_away_toward', 'c_away_straight', 'c_away_back'],
    crit: ['c_crit_right', 'c_crit_ninety', 'c_crit_surface', 'c_crit_name'],
    tir: ['c_tir_right', 'c_tir_out', 'c_tir_graze', 'c_tir_half'],
    water: ['c_water_right', 'c_water_tir', 'c_water_graze', 'c_water_wa'],
    prism: ['c_prism_right', 'c_prism_out', 'c_prism_straight', 'c_prism_half'],
  };
  let learnSaved = null;
  let question = null;
  let picked = -1;
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
        learnSaved = s.step === 'intro' ? 'intro' : s.step;
        if (drag) endDrag();
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizKind = '';
        s.hideOut = false;
        s.hideLabels = false;
        syncUI();
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        const sc = SCENES[kind];
        s.quizKind = kind;
        s.hideOut = Boolean(sc.hideOut);
        s.hideLabels = Boolean(sc.hideLabels);
        await go(sc.step, { animate: false });
        s.v.theta = sc.theta;
        syncScene();
        refresh();
        await takeView(0);
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        const list = shuffle(CHOICES[kind]);
        question = { kind, list };
        return {
          text: t(`q_${kind}`),
          choices: [0, 1, 2, 3],
          expected: list.indexOf(CHOICES[kind][0]),
          tolerance: 0.5,
          label: (j) => `<span class="tir-opt">${t(list[j])}</span>`,
          meta: { kind, answer: CHOICES[kind][0] },
        };
      },
      reveal(_q, correct) {
        const k = question.kind;
        // the light now goes on past O, so the picture shows what happens
        s.hideOut = false;
        s.hideLabels = false;
        syncScene();
        refresh();
        const wrong = correct ? null : question.list[picked];
        const mis = wrong ? t(wrong.replace(/^c_/, 'mis_')) : '';
        return t(`why_${k}`) + (mis && !mis.startsWith('mis_') ? ` ${mis}` : '');
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
  const goHome = () => go('intro', { animate: false });
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && s.mode === 'explore') {
      if (s.busy && b.dataset.example === s.step) return;
      go(b.dataset.example);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'home') goHome();
    else if (b.dataset.act === 'replay' && !s.busy && s.step !== 'intro') go(s.step, { replay: true });
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
    const onButton = Boolean(tgt.closest('button')) && !tgt.closest('.pvc-dh');
    const arrows = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'];
    const sceneKey = ['r', 'R', 'Home', ...arrows].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (arrows.includes(k) && !onButton) {
      if (!canTurn()) return;
      // → and ↑ turn the source further from the normal (θ₂ grows), ← and ↓ back
      const dir = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : -1;
      handle.markUsed();
      const x = stepAngle(s.v.theta, dir, outside());
      if (x !== s.v.theta) {
        s.v.theta = x;
        followLight();
        audio.tick?.();
        refresh();
        emitChange();
      }
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
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
  steadySheet();
  // the parts of later steps (the cell, the water, the prism) compile now, not on their first tap
  stage.warmUp?.({ show: app3.later });
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
     * Change any of: step ('intro' | 'less' | 'critical' | 'more' | 'water' | 'prism'), theta (θ₂ in degrees, 0–80,
     * in the steps where the source turns), view ('front' | '3d'). animate: false lands at once.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step) await go(p.step, { animate });
      if (p.theta != null && ['less', 'critical', 'more', 'water'].includes(s.step)) {
        s.v.theta = snapAngle(+p.theta, outside());
        followLight();
        syncScene();
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await setView('front', { animate: false });
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The disc on its stand, the block, the ray box (at its angle now) and the cell or the prism, in cm (→ metres). */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'TotalInternalReflection';
      const copy = app3.root.clone(true);
      // only what is on the disc now (a lifted cell or a prism off to the side are left out)
      const away = [];
      copy.traverse((ob) => {
        if (!ob.visible) away.push(ob);
      });
      for (const ob of away) ob.removeFromParent();
      g.add(copy);
      return g;
    },
  };
}
