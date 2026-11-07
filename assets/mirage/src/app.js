// Mirage (book pages 251–252, topic 9.2.2, চিত্র ৯.১০), student view. A strip of desert sand floating in a calm blue
// setting, a coconut palm on the right, an eye on a thin stand on the left. Five steps, one tap each, slow:
// ① the eye sees the tree directly (a straight ray); ② the sun heats the sand: the book's three layers of air appear,
// n highest above and lowest by the sand; ③ a second ray from the tree's top heads down: the camera flies in, the ray
// is refracted at the first boundary (normal, i and r: r grows) and totally reflected at the second; ④ it climbs to
// the eye, the eye's line is carried on dashed below the ground, and an upside-down see-through tree appears there
// (প্রতিবিম্ব) over a pale sheet of "water", and a small inset shows what the eye sees from where it stands; ⑤ the eye walks up to the tree: the ray must come down steeply,
// the angle of incidence falls below the critical angle, the ray ends in the sand and the mirage is gone. After that
// the student drags the eye near and far and watches the mirage come and go. A calm card first, then one lead-in
// line, the result and the rule per step; the kit's how-to row; a five-question test. Rays: optics.js (exact Snell's
// law per boundary), drawn by rays.js.
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
import { fitPose } from './camera.js';
import { createEye, EYE_R } from './eye.js';
import { createI18n } from './i18n.js';
import { createInset, MAIN_ONLY } from './inset.js';
import { deg, direct, EYE, LAYER, TREE, trace } from './optics.js';
import { createPalm } from './palm.js';
import { createRays } from './rays.js';
import { backdrop, createSetting, SAND } from './setting.js';

export const DEFAULTS = {
  view: 'front',
  mode: 'explore',
  step: 'intro',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

export const STEPS = ['direct', 'layers', 'bend', 'image', 'near'];
const ORDER = ['intro', ...STEPS];
const INK = '#1d2733';
const COLORS = { normal: '#495057', image: '#1864ab', water: '#1864ab', hot: '#c2410c', cool: '#1864ab' };
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 14, side: 10 };
// how long things take (s): slow enough to follow
const T = { direct: 1.5, heat: 2.2, piece: 1.1, fly: 1.7, normals: 0.8, arcs: 0.9, ext: 1.3, image: 1.8, walk: 2.8, back: 1.3 };
/** Where each step ends. */
const TARGET = {
  intro: { direct: 0, heat: 0, pieces: 0, normals: 0, arcs: 0, ext: 0, image: 0 },
  direct: { direct: 1, heat: 0, pieces: 0, normals: 0, arcs: 0, ext: 0, image: 0 },
  layers: { direct: 1, heat: 1, pieces: 0, normals: 0, arcs: 0, ext: 0, image: 0 },
  bend: { direct: 1, heat: 1, pieces: 3, normals: 1, arcs: 1, ext: 0, image: 0 },
  image: { direct: 1, heat: 1, pieces: 4, normals: 0, arcs: 0, ext: 1, image: 1 },
  near: { direct: 1, heat: 1, pieces: 4, normals: 0, arcs: 0, ext: 1, image: 1 },
};
/** The camera's frame in each step (bend: close on the bends; full: down to the image under the ground). */
const FRAME = { intro: 'scene', direct: 'scene', layers: 'scene', bend: 'bend', image: 'full', near: 'full' };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const D2R = Math.PI / 180;
const dirOf = (az, el, out = new THREE.Vector3()) =>
  out.set(Math.sin(az * D2R) * Math.cos(el * D2R), Math.sin(el * D2R), Math.cos(az * D2R) * Math.cos(el * D2R));

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'mg');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      tight: true,
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the line before the action: what the next tap will show (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'mg-lead';
  $('.pvc-act-row').before(lead);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // the book's own sentences round the idea, only where a tall panel beside the 3D has room for them
  const cap = document.createElement('p');
  cap.className = 'mg-cap pvc-note';
  $('.pvc-rule').after(cap);
  // the honest note in a corner: the layers and the angles are drawn much bigger than in real air
  const note = document.createElement('div');
  note.className = 'mg-note';
  note.textContent = t('note');
  note.hidden = true;
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.05, far: 60, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e8f0ff', '#8a6a44', 0.95));
  const sun = new THREE.DirectionalLight('#fff1d8', 2.5);
  sun.position.set(2.2, 4.2, 3.0);
  sun.target.position.set(-0.3, 0, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55);
  fill.position.set(-3, 1.6, 2.4);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.01;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -3.4, right: 3.4, top: 1.9, bottom: -1.9, near: 2, far: 10 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const setting = createSetting();
  const palm = createPalm();
  const eye = createEye();
  scene.add(setting.root, palm.tree, palm.ghost, eye.root);
  const rays = createRays({ stage, host: ui.canvasHost });
  // the ray drawing sits above the canvas, under the labels
  ui.canvasHost.insertBefore(rays.canvas, ui.annoLayer.parentElement === ui.canvasHost ? ui.annoLayer : null);
  // what the eye sees, in a corner: the eye itself and the layers' pane (edge-on from the eye) only in the main view
  const inset = createInset({
    stage,
    host: ui.canvasHost,
    caption: t('inset_cap'),
    before: () => palm.look('reflect'),
    after: () => palm.look('pale'),
  });
  for (const part of [eye.root, setting.layers]) part.traverse((ob) => ob.layers.set(MAIN_ONLY));
  camera.layers.enable(MAIN_ONLY);

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
    eyeX: EYE.far,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    frame: 'scene',
    userMovedCamera: false,
    quizKind: '',
    drag: null,
    ghost: 1, // how much the image shows while the eye moves (it fades as the mirage comes and goes)
    wobble: 1,
    lastWater: trace(EYE.far).water, // where the "water" was last seen (for "পানি নেই")
  };
  let tr = trace(s.eyeX);
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const stepIndex = () => ORDER.indexOf(s.step);

  // ── the scene from the state ────────────────────────────────────────────────
  function syncScene() {
    const v = s.v;
    tr = trace(s.eyeX);
    eye.setX(s.eyeX);
    setting.setHeat(v.heat);
    const mirage = tr.kind === 'tir';
    if (mirage) s.lastWater = tr.water;
    const hideImage = s.quizKind === 'img';
    const a = hideImage ? 0 : v.image * s.ghost;
    palm.setImage(a, mirage ? tr.scale : 1, s.wobble);
    setting.setWater(s.lastWater, TREE.x, a);
    inset.set(insetWanted() && v.image > 0.3, s.eyeX, mirage ? tr.image.y : null);
    const rv = rays.v;
    rv.direct = direct(s.eyeX);
    rv.directK = v.direct;
    // the straight ray steps back once the bent one is told, and leaves the close view of the bends
    rv.directA = (v.pieces > 0 ? 0.7 : 1) * (s.frame === 'bend' && !s.userMovedCamera ? 1 - camK : 1);
    rv.path = tr.path;
    rv.pieces = mirage ? v.pieces : Math.min(v.pieces, 3);
    rv.sandEnd = !mirage;
    rv.ext = mirage && s.quizKind !== 'img' ? v.ext : 0;
    rv.image = mirage ? tr.image : null;
    // the "water's" surface: a pale line on the ground, from where the eye's line meets it to past the tree's foot
    rv.mirror = mirage && s.quizKind !== 'img' ? v.ext * v.image : 0;
    rv.mirrorFrom = s.lastWater;
    rv.mirrorTo = TREE.x + 0.45;
    // too near: where the eye would look for the water, it sees only hot sand
    rv.sight = !mirage && stepIndex() >= 4 && s.mode !== 'quiz' ? v.image : 0;
    rv.sightTo = sightX();
    rv.hole = inset.box();
    rv.normals = v.normals;
    rv.arcs = v.arcs;
    note.hidden = !(v.heat > 0.5) || s.mode === 'quiz';
  }
  /** The inset is part of the image and the walk (not the test: it would show answers). */
  function insetWanted() {
    return stepIndex() >= 4 && s.mode !== 'quiz';
  }
  /** Where the eye, too near for a mirage, looks for the "water" (down the steep ray's angle): only sand there. */
  function sightX() {
    const t2 = trace(s.eyeX);
    return s.eyeX + EYE.y / Math.tan((t2.g * Math.PI) / 180);
  }
  /** The image fades in and out as the mirage comes and goes under the student's drag. */
  stage.addTicker((dt) => {
    const want = trace(s.eyeX).kind === 'tir' ? 1 : 0;
    if (s.ghost === want) return false;
    s.ghost = want > s.ghost ? Math.min(1, s.ghost + dt * 2.5) : Math.max(0, s.ghost - dt * 2.5);
    syncLabels();
    return true;
  });

  // ── labels on the picture: short ─────────────────────────────────────────────
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  /** @type {any} */
  let eyeHandle = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      ui.$('.pvc-panel-toggle'),
      () => rays.boxes(),
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotateEl),
      () => eyeHandle?.box(),
      () => inset.box(),
    ],
  });
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const spot = (dx, dy) => ({ dx, dy });
  const SP = {
    right: [spot(18, 0), spot(18, -20), spot(18, 20), spot(-18, 0)],
    above: [spot(0, -26), spot(20, -26), spot(-20, -26), spot(0, 26)],
    below: [spot(0, 34), spot(-24, 34), spot(24, 34), spot(0, 54), spot(-50, 22), spot(50, 22)],
    left: [spot(-18, 0), spot(-18, -20), spot(-18, 20), spot(0, -26)],
    tree: [spot(-24, 0), spot(-24, -22), spot(-24, 22), spot(24, 0), spot(24, 26)],
    eye: [spot(0, -30), spot(-22, -24), spot(-26, 6), spot(24, -26), spot(30, 0), spot(26, 22), spot(-44, -36), spot(-52, 0), spot(0, -50)],
    layerTop: [spot(-10, -34), spot(10, -40), spot(-30, -30), spot(30, -30), spot(46, -14), spot(54, 12), spot(-50, 10)],
    layerMid: [spot(40, 34), spot(56, 20), spot(30, 50), spot(-20, -36)],
    layerLow: [spot(-30, 40), spot(-46, 30), spot(-10, 54), spot(-60, 16), spot(40, 44), spot(60, 30), spot(30, 60)],
    normal: [spot(-14, -18), spot(14, -18), spot(-26, 0), spot(26, 0), spot(-14, 24)],
    tir: [spot(0, 40), spot(-30, 38), spot(30, 38), spot(40, 20), spot(0, -36)],
    image: [spot(34, 0), spot(36, 18), spot(-34, 0), spot(36, -18), spot(-36, 20), spot(-36, -20), spot(40, 36)],
    water: [spot(0, 30), spot(-30, 30), spot(30, 30), spot(0, 48), spot(-56, 40), spot(56, 40), spot(0, 66)],
  };
  const pts = new Map();
  const shown = new Map();
  /** A label pinned to a world point; `spots` are the places it may take, best first. */
  function label(id, on, text, x, y, z, spots, color = INK, optional = false) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).set(x, y, z);
    const was = shown.get(id);
    if (!was) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', optional });
      shown.set(id, { text });
      return;
    }
    if (was.text !== text) {
      anno.setText(id, text);
      was.text = text;
    }
  }
  const FRONT_Z = SAND.depth / 2;
  function syncLabels() {
    const v = s.v;
    const f = s.frame;
    const quiz = s.mode === 'quiz';
    const wide = f !== 'bend';
    const qk = s.quizKind;
    // in a small view the names of the tree, the eye and the sand give way first (optional)
    const small = stage.height < 300;
    // in a small view showing the layers, their names come first
    const crowded = small && v.heat > 0.7 && f === 'scene';
    label('tree', wide && !s.busy && !crowded, t('lbl_tree'), TREE.x - 0.05, 0.62, 0, SP.tree, INK, small);
    // in step ④ the action's ring already marks the eye, among the rays: its name gives way there
    const ringOnEye = s.step === 'image' && o.coach && !quiz;
    label('eye', wide && !s.busy && !ringOnEye && !crowded, t('lbl_eye'), s.eyeX, EYE.y + EYE_R, 0, SP.eye, INK, small);
    label(
      'sand',
      wide && stepIndex() <= 2 && !s.busy && !quiz && !(small && v.heat > 0.5),
      t(v.heat > 0.5 ? 'lbl_sand_hot' : 'lbl_sand'),
      0.9,
      -0.05,
      FRONT_Z,
      SP.below,
      COLORS.hot,
      true,
    );
    const layersOn = v.heat > 0.7 && f === 'scene' && !s.busy;
    label('top', layersOn, t('lbl_top'), -0.7, LAYER.a + 0.16, 0, SP.layerTop, COLORS.cool);
    label('mid', layersOn, t('lbl_mid'), 0.4, (LAYER.a + LAYER.b) / 2, 0, SP.layerMid, '#9a5b00', true);
    label('low', layersOn, t('lbl_low'), -0.4, LAYER.b / 2, 0, SP.layerLow, COLORS.hot, small);
    const p = tr.path;
    label('normal', f === 'bend' && v.normals > 0.6 && !s.busy, t('lbl_normal'), p[1].x, p[1].y + 0.19, 0, SP.normal, COLORS.normal);
    label('tir', f === 'bend' && tr.kind === 'tir' && v.pieces > 2.4 && !s.busy && !quiz, t('lbl_tir'), p[2].x, p[2].y, 0, SP.tir, '#9a5b00');
    const imgA = v.image * s.ghost;
    label('image', f === 'full' && imgA > 0.6 && qk !== 'img', t('lbl_image'), TREE.topX + 0.25, -0.75 * tr.scale, 0, SP.image, COLORS.image, small);
    const sandNow = tr.kind === 'sand' && stepIndex() >= 4;
    label(
      'water',
      f === 'full' && !quiz && v.image > 0.6 && !s.busy && (imgA > 0.6 || sandNow),
      t(sandNow ? 'lbl_nowater' : 'lbl_water'),
      sandNow ? sightX() : (s.lastWater + TREE.x) / 2,
      0,
      FRONT_Z * 0.45,
      SP.water,
      COLORS.water,
      small,
    );
  }

  // ── camera: a gentle three-quarter view; close on the bends; down to the image ─
  const frames = {
    // the whole strip of sand, a finite table in the blue
    scene: { box: new THREE.Box3(V(SAND.left, -SAND.thick, -SAND.depth / 2), V(SAND.right, 1.6, SAND.depth / 2)), az: 20, el: 12 },
    // the eye's range, the tree and its image: the dashed line and the image's top, not the whole strip
    full: { box: new THREE.Box3(V(EYE.min - 0.2, -1.5, -0.2), V(TREE.x + 0.7, 1.58, 0.2)), az: 20, el: 11 },
    bend: { box: new THREE.Box3(), az: 12, el: 7 },
  };
  const camDir = new THREE.Vector3();
  function poseOf(frame) {
    const f = frames[frame];
    if (frame === 'bend') {
      // round the first three points the ray bends at, with room for the normal's top and the label under the turn
      const p = trace(s.eyeX).path;
      f.box.min.set(Math.min(p[2].x, p[3]?.x ?? p[2].x) - 0.28, -0.03, -0.05);
      f.box.max.set(p[1].x + 0.42, LAYER.a + 0.26, 0.05);
    }
    dirOf(f.az + (s.view === '3d' && !s.userMovedCamera ? 25 : 0), f.el, camDir);
    return fitPose({ box: f.box, dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  let camK = 1;
  let camFrom = null;
  function applyCamera() {
    if (s.userMovedCamera) return;
    const pz = poseOf(s.frame);
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, pz.position, k);
      controls.target.lerpVectors(camFrom.target, pz.target, k);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
    }
    controls.update();
  }
  /** The camera goes to a frame, from wherever it is (a view the student turned is taken back). */
  function fly(frame, duration = T.fly) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      rotate.home();
    }
    if (s.view !== 'front') {
      s.view = 'front';
      syncUI();
      emit('view', { view: s.view });
    }
    const same = frame === s.frame && camK >= 1;
    s.frame = frame;
    if (!duration || same) {
      camK = 1;
      stage.invalidate();
      return Promise.resolve(true);
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camK = k;
        stage.invalidate();
      },
      onComplete: () => {
        camK = 1;
        stage.invalidate();
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
  function setView(view, { animate = true } = {}) {
    s.userMovedCamera = false;
    rotate.home();
    s.view = view === '3d' ? '3d' : 'front';
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = animate ? 0 : 1;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    if (!animate) {
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({ key: 'camera', duration: T.fly, onUpdate: (k) => ((camK = k), stage.invalidate()), onComplete: () => (camK = 1) })
      .finished;
  }
  // the rays live in one vertical plane: seen edge-on they would be a meaningless line, so they fade there
  const viewDir = new THREE.Vector3();
  let raysAlpha = '1';
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
    viewDir.copy(camera.position).sub(controls.target).normalize();
    const k = THREE.MathUtils.clamp((Math.abs(viewDir.z) - 0.12) / 0.22, 0, 1);
    const a = String(Math.round(k * 20) / 20);
    if (a !== raysAlpha) {
      raysAlpha = a;
      rays.canvas.style.opacity = a;
    }
  });
  stage.onAfterRender(() => {
    rays.draw();
    inset.draw();
  });
  /** The panel is under the 3D on portrait frames (the kit's rule: beside it from 600 px wide and landscape). */
  function syncLayout() {
    const below = !(root.clientWidth >= 600 && root.clientWidth >= root.clientHeight);
    if (root.classList.contains('mg-below') !== below) root.classList.toggle('mg-below', below);
  }
  syncLayout();
  stage.onResize(() => {
    syncLayout();
    rays.size();
    syncScene();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  /** Moves some of the values to where they go, together, over `duration` seconds. */
  function tweenTo(to, duration, my, key = 'step') {
    const from = { ...s.v };
    return tweener
      .animate({
        key,
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const name of Object.keys(to)) s.v[name] = from[name] + (to[name] - from[name]) * k;
          syncLabels();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  /** Rays are drawn at an even pace: each piece of the bent ray for its share of the time. */
  function drawPieces(upto, my) {
    return tweenTo({ pieces: upto }, T.piece * Math.max(0.6, upto - s.v.pieces), my);
  }
  function walkTo(x, duration, my) {
    const from = s.eyeX;
    return tweener
      .animate({
        key: 'eye',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== s.run) return;
          s.eyeX = from + (x - from) * k;
          syncLabels();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  const wait = (sec, my) => tweener.animate({ key: 'wait', duration: sec }).finished.then((ok) => ok && my === s.run);
  /** The plan from one step to the next, as a list of things to play one after the other. */
  function planFor(from, to, my) {
    if (from === 'intro' && to === 'direct') return [() => tweenTo({ direct: 1 }, T.direct, my)];
    if (from === 'direct' && to === 'layers') return [() => tweenTo({ heat: 1 }, T.heat, my)];
    if (from === 'layers' && to === 'bend')
      return [
        () => drawPieces(1, my),
        () => drawPieces(2, my),
        () => fly('bend').then((ok) => ok && my === s.run),
        () => tweenTo({ normals: 1 }, T.normals, my),
        () => tweenTo({ arcs: 1 }, T.arcs, my),
        () => drawPieces(3, my),
      ];
    if (from === 'bend' && to === 'image')
      return [
        () => Promise.all([fly('full'), tweenTo({ normals: 0, arcs: 0 }, 0.6, my)]).then(([a, b]) => a && b),
        () => drawPieces(4, my),
        () => tweenTo({ ext: 1 }, T.ext, my),
        () => {
          s.wobble = 0;
          return tweener
            .animate({
              key: 'step',
              duration: T.image,
              ease: ease.outCubic,
              onUpdate: (k) => {
                if (my !== s.run) return;
                s.v.image = Math.min(1, k * 1.6);
                s.wobble = k;
                syncLabels();
                stage.invalidate();
              },
            })
            .finished.then((ok) => ok && my === s.run);
        },
      ];
    if (from === 'image' && to === 'near') return [() => wait(0.3, my), () => walkTo(EYE.near, T.walk, my)];
    // a jump (a step word, back, or several at once): everything together, the camera to the step's frame
    return [
      () => {
        const goal = TARGET[to];
        const ps = [fly(FRAME[to], T.back), tweenTo(goal, T.back, my), walkTo(to === 'near' ? EYE.near : EYE.far, T.back, my)];
        return Promise.all(ps).then((r) => r[1] && r[2]);
      },
    ];
  }
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    tweener.cancel('eye');
    tweener.cancel('wait');
    s.busy = false;
    s.wobble = 1;
  }
  async function go(step, { animate = true, replay = false } = {}) {
    if (!(step in TARGET)) return;
    let from = s.step;
    stopAll();
    const my = s.run;
    hintOff();
    if (replay && from === step && step !== 'intro') {
      // play the step again from the one before it
      from = ORDER[ORDER.indexOf(step) - 1];
      Object.assign(s.v, TARGET[from]);
      s.eyeX = EYE.far;
      s.ghost = trace(s.eyeX).kind === 'tir' ? 1 : 0;
      s.frame = FRAME[from];
      fly(FRAME[from], 0);
    }
    s.step = step;
    if (!animate || from === step) {
      Object.assign(s.v, TARGET[step]);
      s.eyeX = step === 'near' ? EYE.near : from === step && stepIndex() >= 4 ? s.eyeX : EYE.far;
      s.ghost = trace(s.eyeX).kind === 'tir' ? 1 : 0;
      fly(FRAME[step], 0);
      done();
      return;
    }
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    for (const part of planFor(from, step, my)) {
      if (!(await part())) return;
    }
    s.busy = false;
    audio.success?.();
    done();
  }
  function done() {
    syncScene();
    syncLabels();
    refresh();
    emitChange();
    settle();
  }
  /** A few more frames, so the labels, the badge and the drag disc (each placed after a frame) settle round each other. */
  let redraws = 0;
  function settle() {
    redraws = 3;
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_direct', 1, ICONS.hand],
    direct: ['act_layers', 2, ICONS.hand],
    layers: ['act_bend', 3, ICONS.hand],
    bend: ['act_image', 4, ICONS.hand],
    image: ['act_near', 5, ICONS.hand],
    near: ['act_quiz', '', ICONS.chevR],
  };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const steady = { lead: '', act: '' };
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm
      ? `<span class="mg-long">${t('intro')}</span><span class="mg-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('mg-calm', calm);
    }
    const x = trace(s.eyeX);
    const vars = { i: deg(x.i1), r: deg(x.r1), iB: deg(x.iB), c: deg(x.crit) };
    let out = '';
    let rule = '';
    if (!calm && !s.busy) {
      const k = stepIndex();
      if (k >= 4) {
        // the image and the walk: what the student sees now, from where the eye stands now
        const far = x.kind === 'tir';
        out = s.step === 'image' && far ? t('out_image') : t(far ? 'out_far' : 'out_close', { i: deg(x.iB), c: deg(x.crit) });
        rule = s.step === 'image' && far ? t('rule_image') : t(far ? 'rule_far_again' : 'rule_near');
      } else {
        out = t(`out_${s.step}`, vars);
        rule = t(`rule_${s.step}`, vars);
      }
    }
    sheet.outcome(out);
    sheet.rule(rule);
    const capHtml = calm ? '' : t(stepIndex() >= 4 ? 'cap_road' : 'cap_desert');
    if (cap.innerHTML !== capHtml) cap.innerHTML = capHtml;
    sheet.choose(calm ? null : s.step);
    sheet.next({ intro: 'direct', direct: 'layers', layers: 'bend', bend: 'image', image: 'near' }[s.step] ?? null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      if (step !== '' && enabled && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    homeBtn.hidden = s.step === 'intro';
    homeBtn.disabled = s.busy;
    syncLabels();
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the 3D part, a tap on that part ──
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const next = { intro: 'direct', direct: 'layers', layers: 'bend', bend: 'image', image: 'near' }[s.step];
    if (next) return go(next);
    return quiz.start();
  }
  /** What the action's ring is round in each step: the eye (look, follow, walk), the sand (heat), the tree's top. */
  const ringAt = V(0, 0, 0);
  function actionTarget() {
    if (s.busy || s.mode === 'quiz') return null;
    if (s.step === 'direct') return ringAt.set(-0.2, 0.02, 0.35);
    if (s.step === 'layers') return ringAt.set(TREE.topX, TREE.topY - 0.05, 0);
    if (s.step === 'near') return null;
    return ringAt.set(s.eyeX, EYE.y, 0);
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_direct',
    icon: ICONS.hand,
    target: actionTarget,
    radius: 24,
    pad: 8,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes(), () => boxOf(rotateEl), () => rays.boxes(), () => inset.box()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── dragging the eye (from the image on); a tap on the ringed part is the action ──
  const canDrag = () => !s.locked && !s.busy && stepIndex() >= 4 && camK >= 1 && s.mode === 'explore';
  const footAt = V(0, 0, 0);
  eyeHandle = createDragHandle(stage, {
    point: () => footAt.set(s.eyeX, 0.02, 0.22),
    axis: 'x',
    track: { from: V(EYE.min, 0.02, 0.22), to: V(EYE.max, 0.02, 0.22) },
    label: t('drag_me'),
    labelAt: 'below',
    aria: t('aria_drag_eye'),
    pulse: Boolean(o.coach),
    when: canDrag,
  });
  // when the disc comes, goes or moves, draw two more frames so the labels see where it is (it is placed after them)
  let couldDrag = false;
  let discAt = s.eyeX;
  stage.addTicker(() => {
    const c = canDrag();
    if (c !== couldDrag || discAt !== s.eyeX) {
      couldDrag = c;
      discAt = s.eyeX;
      redraws = 2;
    }
    if (redraws <= 0) return false;
    redraws--;
    action?.update();
    return true;
  });
  const raycaster = new THREE.Raycaster();
  raycaster.layers.enable(MAIN_ONLY);
  const ndc = new THREE.Vector2();
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function hits(p, objects) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(objects, true).length > 0;
  }
  /** The 3D part a tap acts on, in this step. */
  function tapTargets() {
    if (s.step === 'direct') return [setting.slab];
    if (s.step === 'layers') return [palm.crown, palm.trunk];
    if (s.step === 'near') return [];
    return eye.hits;
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = hostXY(e);
      down = { x: p.x, y: p.y, at: now() };
      if (!canDrag()) return;
      if (!(eyeHandle.hit(p.x, p.y) || hits(p, eye.hits))) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      s.drag = { id: e.pointerId, x: p.x, y: p.y, from: s.eyeX, moved: false };
      eyeHandle.markUsed();
      action?.hide('drag');
      emit('dragstart', { part: 'eye' });
      e.preventDefault();
      e.stopPropagation();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) {
      if (e.pointerType === 'mouse' && !s.drag) {
        const p = hostXY(e);
        requestAnimationFrame(() => {
          const over = (canDrag() && (eyeHandle.hit(p.x, p.y) || hits(p, eye.hits))) || (actionTarget() && hits(p, tapTargets()));
          ui.canvasHost.style.cursor = over ? (canDrag() ? 'grab' : 'pointer') : '';
        });
      }
      return;
    }
    const p = hostXY(e);
    const a = rays.screen(g.from, 0);
    const b = rays.screen(g.from + 1, 0);
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const du = ((p.x - g.x) * tx + (p.y - g.y) * ty) / Math.max(0.01, tx * tx + ty * ty);
    if (Math.hypot(p.x - g.x, p.y - g.y) > 4) g.moved = true;
    moveEye(g.from + du);
  });
  function moveEye(x) {
    const was = s.eyeX;
    s.eyeX = Math.min(EYE.max, Math.max(EYE.min, x));
    if (Math.abs(was - s.eyeX) < 1e-6) return;
    const before = trace(was).kind;
    const after = trace(s.eyeX).kind;
    if (before !== after) audio.tick?.();
    // the student found the last step by hand: walking up to the tree ends the mirage, as the action would have shown
    if (s.step === 'image' && after === 'sand' && !s.busy) s.step = 'near';
    refresh();
    stage.invalidate();
    emitChange(true);
  }
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return false;
    releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked;
    action?.show('drag');
    emit('dragend', { part: 'eye' });
    refresh();
    emitChange();
    return g.moved;
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const dragged = endDrag(e);
    if (!down) return;
    const p = hostXY(e);
    const moved = Math.hypot(p.x - down.x, p.y - down.y);
    const quick = now() - down.at < 600;
    down = null;
    if (dragged || moved > 8 || !quick || s.mode === 'quiz') return;
    if (actionTarget() && hits(p, tapTargets())) doAction();
  });
  ui.canvasHost.addEventListener('pointercancel', (e) => {
    endDrag(e);
    down = null;
  });

  // ── how to use, in the panel: the rotate pill, the সামনে button, the eye's disc ──
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'drag', axis: 'x', text: t('howto_eye'), aria: t('aria_howto_eye'), handle: eyeHandle, when: () => stepIndex() >= 4 },
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
  const r2 = (x) => Math.round(x * 100) / 100;
  function snapshot() {
    const x = trace(s.eyeX);
    return {
      step: s.step,
      busy: s.busy,
      eye: r2(s.eyeX),
      distance: r2(x.D),
      mirage: x.kind === 'tir',
      kind: x.kind,
      i: deg(x.i1),
      r: deg(x.r1),
      iB: deg(x.iB),
      critical: deg(x.crit),
      image: x.image ? r2(x.image.y) : null,
      shown: { direct: s.v.direct > 0.5, layers: s.v.heat > 0.5, bent: s.v.pieces > 0.5, image: s.v.image > 0.5 && x.kind === 'tir' },
      next: { intro: 'direct', direct: 'layers', layers: 'bend', bend: 'image', image: 'near', near: 'quiz' }[s.step],
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(eyeMoved = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.kind, eyeMoved ? snap.eye : '']);
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
  function choicesOf(keys, kind) {
    const list = shuffle([...keys]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(keys[0]),
      tolerance: 0.5,
      label: (j) => `<span class="mg-opt">${t(list[j])}</span>`,
      meta: { kind, answer: keys[0] },
    };
  }
  /** The five questions: what the eye sees up close, r against i, why it turns back, the image, the hot road. */
  const KINDS = ['walk', 'r', 'tir', 'img', 'road'];
  const SCENE_OF = { r: 'bend', tir: 'bend', img: 'image', walk: 'near', road: 'near' };
  const CHOICES = {
    walk: ['c_walk_right', 'c_walk_both', 'c_walk_water', 'c_walk_none'],
    r: ['c_r_right', 'c_r_small', 'c_r_same', 'c_r_zero'],
    tir: ['c_tir_right', 'c_tir_less', 'c_tir_sand', 'c_tir_push'],
    img: ['c_img_right', 'c_img_upright', 'c_img_above', 'c_img_none'],
    road: ['c_road_right', 'c_road_more', 'c_road_crit', 'c_road_dry'],
  };
  const MISTAKES = {
    c_walk_both: 'mis_walk_both',
    c_walk_water: 'mis_walk_water',
    c_walk_none: 'mis_walk_none',
    c_r_small: 'mis_r_small',
    c_r_same: 'mis_r_same',
    c_r_zero: 'mis_r_zero',
    c_tir_less: 'mis_tir_less',
    c_tir_sand: 'mis_tir_sand',
    c_tir_push: 'mis_tir_push',
    c_img_upright: 'mis_img_upright',
    c_img_above: 'mis_img_above',
    c_img_none: 'mis_img_none',
    c_road_more: 'mis_road_more',
    c_road_crit: 'mis_road_crit',
    c_road_dry: 'mis_road_dry',
  };
  let learnSaved = null;
  let current = null;
  let picked = -1;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 3, feedback: 4 },
    action,
    hooks: {
      enter() {
        learnSaved = { step: s.step, eyeX: s.eyeX };
        if (s.drag) {
          s.drag = null;
          controls.enabled = true;
        }
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizKind = '';
        syncUI();
        const back = learnSaved || { step: 'intro', eyeX: EYE.far };
        go(back.step, { animate: false }).then(() => {
          if (ORDER.indexOf(back.step) >= 4) {
            s.eyeX = back.eyeX;
            s.ghost = trace(s.eyeX).kind === 'tir' ? 1 : 0;
          }
          done();
        });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        s.quizKind = kind;
        await go(SCENE_OF[kind], { animate: false });
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        syncScene();
        syncLabels();
        stage.invalidate();
        current = { kind };
        return { text: t(`q_${kind}`), ...choicesOf(CHOICES[kind], kind) };
      },
      reveal(q, correct) {
        const kind = current.kind;
        const wrongKey = correct ? null : q.list?.[picked];
        const extra = wrongKey && MISTAKES[wrongKey] ? ` ${t(MISTAKES[wrongKey])}` : '';
        return t(`why_${kind}`) + extra;
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
    note.hidden = !(s.v.heat > 0.5) || s.mode === 'quiz';
  }
  function goHome() {
    return go('intro', { animate: false });
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) {
      if (b.dataset.view === 'front') fly(s.frame, T.fly);
      else setView(b.dataset.view);
    }
    if (b.dataset.example && s.mode === 'explore') {
      const id = b.dataset.example;
      if (s.busy && id === s.step) return;
      if (id === s.step) go(id, { replay: true });
      else if (ORDER.indexOf(id) === stepIndex() + 1) go(id);
      else go(id);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'home') goHome();
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
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if ((k === 'ArrowRight' || k === 'ArrowLeft') && !tgt.closest('.pvc-examples')) {
      if (!canDrag()) {
        if (stepIndex() < 4) showHint(t('hint_wait'), { duration: 1500 });
        return;
      }
      eyeHandle.markUsed();
      moveEye(s.eyeX + (k === 'ArrowRight' ? 0.1 : -0.1));
      emitChange();
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') fly(s.frame, T.fly);
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  if (o.step && o.step !== 'intro' && o.step in TARGET) {
    s.step = o.step;
    Object.assign(s.v, TARGET[o.step]);
    s.eyeX = o.step === 'near' ? EYE.near : EYE.far;
    s.ghost = trace(s.eyeX).kind === 'tir' ? 1 : 0;
    s.frame = FRAME[o.step];
  }
  applyCamera();
  syncScene();
  refresh();
  // the parts of later steps (the layers, the image, the water) are hidden now: compile their shaders ahead
  stage.warmUp?.({ show: [setting.layers, palm.ghost, setting.water] });
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
    /** Change any of: step ('intro' | 'direct' | 'layers' | 'bend' | 'image' | 'near'), eye (its x, from −2.75 far to
     * −0.35 near; the tree's top is at x = 1.8), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step) await go(p.step, { animate });
      if (typeof p.eye === 'number' && Number.isFinite(p.eye)) {
        if (stepIndex() < 4 && p.step == null) await go('image', { animate: false });
        moveEye(p.eye);
        s.ghost = trace(s.eyeX).kind === 'tir' ? 1 : 0;
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
      eyeHandle.rearm?.();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The sand with its pebbles, the palm and the eye on its stand, in the scene's units (metres of a model). */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Mirage';
      // the sand as a plain colour in the model (its grain and ripple maps would be most of the file)
      const sand = new THREE.MeshStandardMaterial({ name: 'Sand', color: '#dcb782', roughness: 0.95 });
      for (const part of [setting.root, palm.tree, eye.root]) {
        const copy = part.clone(true);
        copy.traverse((ob) => {
          if (!ob.isMesh) return;
          if (Array.isArray(ob.material)) ob.material = ob.material.map((m) => (m.name === 'Sand' ? sand : m));
        });
        g.add(copy);
      }
      return g;
    },
  };
}
