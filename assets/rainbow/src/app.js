// The rainbow (book page 251, topic 9.2.1, চিত্র ৯.০৯), student view. The sky after rain on a calm deep-blue backdrop:
// the observer's eye on a slim stand on a patch of light sand, the sun low behind it, a light curtain of drops in front.
// Four steps, one tap each, slow: ① the camera flies into one drop (drawn big, cut open): a white ray goes in, is
// refracted and splits into colours (violet bends most); ② it is reflected at the back and the colours come out again,
// further apart; ③ the camera pulls back to the sky: parallel sunlight reaches two drops of the bow, the drop about 42°
// from the point opposite the sun sends red to the eye, the one at about 41° violet, and the band of colours appears,
// red outside; ④ the sun rises (the student can drag it): the bow sinks, and above about 42° it is below the horizon,
// which is why there is no rainbow at midday. The rays are traced exactly (reading.js) and drawn over the view
// (rays.js). A calm card first, then a lead-in line, the result and the rule per step; the how-to row; a five-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { fitPose } from './camera.js';
import { createDrop, dropModel } from './drop.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import { ANGLE, bowVisible, clampSun, heightChoices, SUN, THETA_RED, THETA_VIOLET, topDeg, wholeDeg } from './reading.js';
import {
  ARC,
  ARC_R,
  along,
  backdrop,
  bowPoint,
  createBand,
  createEye,
  createGround,
  createRain,
  createSun,
  EYE,
  keyDrop,
  sunPoint,
  upOf,
} from './sky.js';

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

export const STEPS = ['in', 'back', 'bow', 'noon'];
const THETA_MID = (THETA_RED + THETA_VIOLET) / 2;
const BIG = 1.55; // the drop's radius in the close view (sky units)
const SMALL = 0.16; // and as one drop of the sky
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 14, side: 12 };
// how long things take (s): slow enough to follow
const T = { fly: 2.4, inK: 2.2, outK: 2.6, out: 2.6, axis: 1.2, lines: 2.4, arcs: 1.1, fade: 1, sun: 3, back: 1.6, cam: 1.2 };
/** Where each step ends. zoom: 1 the sky, 0 the big drop. */
// bow: the band (GHOST: faint, on the first screen, to show what we will explain); beam: the parallel sunlight
const GHOST = 0.32;
const TARGET = {
  intro: { zoom: 1, inK: 0, outK: 0, beam: 1, axis: 0, lines: 0, arcs: 0, bow: GHOST, sunArc: 0, sun: SUN.start },
  in: { zoom: 0, inK: 1, outK: 0, beam: 0, axis: 0, lines: 0, arcs: 0, bow: GHOST, sunArc: 0, sun: SUN.start },
  back: { zoom: 0, inK: 1, outK: 1, beam: 0, axis: 0, lines: 0, arcs: 0, bow: GHOST, sunArc: 0, sun: SUN.start },
  bow: { zoom: 1, inK: 1, outK: 1, beam: 1, axis: 1, lines: 1, arcs: 1, bow: 1, sunArc: 0, sun: SUN.start },
  noon: { zoom: 1, inK: 1, outK: 1, beam: 1, axis: 1, lines: 0, arcs: 0, bow: 1, sunArc: 1, sun: SUN.noon },
};
const KEYS = Object.keys(TARGET.intro);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const RED_DEG = wholeDeg(THETA_RED);
const VIOLET_DEG = wholeDeg(THETA_VIOLET);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'rb');
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
  const lead = document.createElement('p');
  lead.className = 'rb-lead';
  $('.pvc-act-row').before(lead);
  // the result and the rule share one place with the first screen's calm card: the sheet keeps one height in every step
  const body = document.createElement('div');
  body.className = 'rb-body';
  const text = document.createElement('div');
  text.className = 'rb-text';
  const card = document.createElement('p');
  card.className = 'rb-card pvc-note';
  card.innerHTML = `<span class="rb-long">${t('intro')}</span><span class="rb-short">${t('intro_short')}</span>`;
  const outcomeEl = $('.pvc-outcome');
  outcomeEl.before(body);
  text.append(outcomeEl, $('.pvc-rule'));
  body.append(text, card);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'rb-note';
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 32, near: 0.05, far: 200, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#dbe8ff', '#6d5a44', 1.05));
  const sunLight = new THREE.DirectionalLight('#fff1d6', 2.2);
  sunLight.target.position.copy(EYE);
  scene.add(sunLight, sunLight.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.5);
  fill.position.set(-6, 5, 8);
  scene.add(fill);
  const shadows = o.shadow && o.bg !== 'transparent';
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(512, 512);
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.01;
    sunLight.shadow.radius = 3;
    Object.assign(sunLight.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 1, far: 40 });
    sunLight.shadow.camera.updateProjectionMatrix();
  }
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const ground = createGround();
  const eye = createEye();
  const sun = createSun();
  const rain = createRain();
  const band = createBand(ANGLE);
  const drop = createDrop();
  scene.add(ground.root, eye.root, sun.root, rain.mesh, band.mesh, drop.root);
  const rays = createRays({ stage, host: ui.canvasHost, drop });

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
    quiz: '', // the kind of the question on show
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the scene from the state ────────────────────────────────────────────────
  const A = V();
  const U = V();
  const X = V();
  const M = new THREE.Matrix4();
  const P0 = V();
  const smooth = (x) => x * x * (3 - 2 * x);
  /** The drop's size: big in the close view, one drop of the sky far away (between them in proportion). */
  const dropScale = (zoom) => Math.exp(Math.log(BIG) + (Math.log(SMALL) - Math.log(BIG)) * zoom);
  function syncScene() {
    const v = s.v;
    along(v.sun, A);
    upOf(v.sun, U);
    X.crossVectors(A, U);
    // the drop: at the top of the bow, its cut face in the plane of the sun and the eye, turned toward the viewer
    M.makeBasis(A, U, X);
    drop.root.quaternion.setFromRotationMatrix(M);
    bowPoint(v.sun, THETA_MID, 0, ARC, drop.root.position);
    drop.root.scale.setScalar(dropScale(v.zoom));
    drop.root.visible = v.zoom < 0.995 || s.step === 'intro';
    drop.root.updateMatrixWorld();
    // the sun and its light
    sunPoint(v.sun, sun.root.position);
    sunLight.position.copy(EYE).addScaledVector(A, -20);
    sunLight.target.updateMatrixWorld();
    // the sky's drops fade as the camera goes into one; the bow
    const sky = smooth(Math.min(1, Math.max(0, (v.zoom - 0.35) / 0.65)));
    rain.mesh.visible = sky > 0.02;
    rain.mesh.material.opacity = 0.4 * sky;
    // close to the drop the view looks up into the blue: the patch of sand and the eye are not wanted there
    ground.root.visible = v.zoom > 0.25;
    eye.root.visible = v.zoom > 0.25;
    eye.lookAt(bowPoint(v.sun, THETA_MID, 0, ARC, P0));
    band.setSun(v.sun);
    band.mesh.visible = v.bow > 0.01 && bowVisible(v.sun) && sky > 0.02;
    band.mesh.material.opacity = 0.92 * v.bow * sky;
    // the light, drawn over the view
    const rv = rays.view;
    rv.drop = 1 - smooth(Math.min(1, v.zoom / 0.4));
    rv.inK = v.inK;
    rv.outK = v.outK;
    rv.sun = v.sun;
    rv.beam = v.beam * sky;
    rv.axis = v.axis * sky;
    rv.lines = v.lines * sky;
    rv.arcs = v.arcs * sky;
    rv.sunArc = v.sunArc * sky;
    rv.plain = s.quiz === 'outer';
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  /** @type {ReturnType<typeof createDragHandle> | null} */
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
    avoid: [ui.corner, ui.hint, note, () => rays.boxes(), () => action?.box(), () => action?.ringBox(), () => boxOf(rotateEl), () => handle?.box()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(18, 0), spot(18, -20), spot(18, 20), spot(26, -36)];
  const LEFT_OF = [spot(-18, 0), spot(-18, -20), spot(-18, 20), spot(-26, -36)];
  const ABOVE = [spot(0, -22), spot(20, -22), spot(-20, -22), spot(0, -38)];
  const BELOW = [spot(0, 24), spot(-22, 24), spot(22, 24)];
  const local = V();
  const inDrop = (which) => () => {
    const p = rays.dropPoint(which);
    return drop.root.localToWorld(local.set(p.x, p.y, 0)).clone();
  };
  const near = () => s.v.zoom < 0.05;
  const far = () => s.v.zoom > 0.95;
  const COL = { ink: '#1d2733', red: '#c92a2a', violet: '#6a2fd0', sun: '#b35c00' };
  const wTmp = V();
  /** A point on the angle drawn at the eye for the red or the violet drop (k: how far round, r: the radius). */
  const onArc = (which, k = 0.62) => {
    const a = along(s.v.sun, local);
    const d = keyDrop(which, s.v.sun, wTmp).sub(EYE);
    d.addScaledVector(a, -d.dot(a)).normalize();
    const th = ((which === 'red' ? THETA_RED : THETA_VIOLET) * Math.PI * k) / 180;
    const r = which === 'red' ? ARC_R.red + 0.35 : ARC_R.violet - 0.45;
    return EYE.clone()
      .addScaledVector(a, r * Math.cos(th))
      .addScaledVector(d, r * Math.sin(th));
  };
  const scr = V();
  /** Is the red drop to the left of the violet one on the screen now? (Their labels go on their outer sides.) */
  const redLeft = () => {
    const xr = keyDrop('red', s.v.sun, scr).project(camera).x;
    const xv = keyDrop('violet', s.v.sun, scr).project(camera).x;
    return xr < xv;
  };
  const OUTER_L = [spot(-28, -12), spot(-20, -26), spot(-34, 4)];
  const OUTER_R = [spot(28, -12), spot(20, -26), spot(34, 4)];
  const centre = () => EYE.clone().addScaledVector(along(s.v.sun, local), ARC * Math.cos((THETA_MID * Math.PI) / 180));
  const LABELS = {
    sun: {
      text: () => t('lbl_sun'),
      point: () => sun.root.position.clone().add(V(0, 0.7, 0)),
      spots: [spot(0, -30), spot(30, -26), spot(-30, -26), spot(0, -46)],
      optional: true,
      show: () => far(),
    },
    beam: {
      text: () => t('lbl_beam'),
      point: () => sun.root.position.clone().addScaledVector(upOf(s.v.sun, local), 4.6).addScaledVector(along(s.v.sun, wTmp), 4),
      spots: [...ABOVE, ...RIGHT_OF, ...LEFT_OF],
      optional: true,
      show: () => far() && s.v.beam > 0.9 && (s.step === 'intro' || s.step === 'bow') && s.mode !== 'quiz',
    },
    eye: {
      text: () => t('lbl_eye'),
      point: () => EYE.clone().add(V(0, -0.5, 0)),
      spots: [spot(0, 30), spot(-40, 30), spot(40, 30), spot(-50, 0)],
      optional: true,
      show: () => far(),
    },
    rain: {
      text: () => t('lbl_rain'),
      point: () => drop.root.position.clone(),
      spots: [...ABOVE, ...RIGHT_OF],
      optional: true,
      show: () => far() && s.step === 'intro' && !s.busy && s.mode !== 'quiz',
    },
    white: { text: () => t('lbl_white'), point: inDrop('in'), spots: [...ABOVE, ...BELOW], show: () => near() && s.v.inK > 0.4 },
    normal: {
      text: () => t('lbl_normal'),
      point: inDrop('normal'),
      color: '#495057',
      spots: [...LEFT_OF, ...ABOVE],
      optional: true,
      show: () => near() && s.v.inK > 0.6 && s.v.outK < 0.05,
    },
    refract: {
      text: () => t('lbl_refract'),
      point: inDrop('enter'),
      spots: [spot(24, -20), spot(30, -34), ...ABOVE],
      optional: true,
      show: () => near() && s.v.inK > 0.95 && s.v.outK < 0.05 && s.mode !== 'quiz',
    },
    redIn: {
      text: () => t('lbl_red'),
      point: inDrop('redIn'),
      color: COL.red,
      spots: [spot(34, -16), spot(40, -30), ...ABOVE],
      show: () => near() && s.v.inK > 0.95 && s.v.outK < 0.05,
    },
    violetIn: {
      text: () => t('lbl_violet'),
      point: inDrop('violetIn'),
      color: COL.violet,
      spots: [spot(36, 18), spot(40, 32), ...BELOW],
      show: () => near() && s.v.inK > 0.95 && s.v.outK < 0.05,
    },
    reflect: { text: () => t('lbl_reflect'), point: inDrop('back'), spots: [...RIGHT_OF, ...ABOVE], show: () => near() && s.v.outK > 0.5 },
    through: {
      text: () => t('lbl_through'),
      point: inDrop('through'),
      spots: [spot(16, 26), spot(24, 34), ...BELOW, ...RIGHT_OF],
      optional: true,
      show: () => near() && s.v.outK > 0.95,
    },
    red: { text: () => t('lbl_red'), point: inDrop('red'), color: COL.red, spots: [...LEFT_OF, ...BELOW], show: () => near() && s.v.outK > 0.95 },
    violet: {
      text: () => t('lbl_violet'),
      point: inDrop('violet'),
      color: COL.violet,
      spots: [...BELOW, ...RIGHT_OF],
      show: () => near() && s.v.outK > 0.95,
    },
    anti: {
      text: () => t('lbl_anti'),
      point: centre,
      spots: [...BELOW, ...RIGHT_OF, ...LEFT_OF],
      optional: true,
      show: () => far() && s.v.axis > 0.9 && s.quiz !== 'height',
    },
    redDeg: {
      text: () => t(s.quiz ? 'lbl_deg' : 'lbl_red_deg', { d: RED_DEG }),
      point: () => onArc('red'),
      spots: () => (redLeft() ? OUTER_L : OUTER_R),
      get color() {
        return s.quiz ? COL.ink : COL.red;
      },
      show: () => far() && s.v.arcs > 0.95,
    },
    violetDeg: {
      text: () => t(s.quiz ? 'lbl_deg' : 'lbl_violet_deg', { d: VIOLET_DEG }),
      point: () => onArc('violet'),
      spots: () => (redLeft() ? OUTER_R : OUTER_L),
      get color() {
        return s.quiz ? COL.ink : COL.violet;
      },
      show: () => far() && s.v.arcs > 0.95,
    },
    k: {
      text: () => t('lbl_k'),
      point: () => keyDrop('red', s.v.sun, local).clone(),
      spots: () => (redLeft() ? OUTER_L : OUTER_R),
      show: () => s.quiz === 'outer',
    },
    kh: {
      text: () => t('lbl_kh'),
      point: () => keyDrop('violet', s.v.sun, local).clone(),
      spots: () => (redLeft() ? OUTER_R : OUTER_L),
      show: () => s.quiz === 'outer',
    },
    sunDeg: {
      text: () => t('lbl_sun_deg', { d: Math.round(s.v.sun) }),
      point: () => {
        const h = (s.v.sun * Math.PI) / 360;
        return EYE.clone().add(V(0, Math.sin(h) * 3.5, -Math.cos(h) * 3.5));
      },
      color: COL.sun,
      spots: [spot(-26, 0), spot(-30, 16), spot(-30, -16), ...BELOW],
      show: () => far() && s.v.sunArc > 0.9,
    },
  };
  const placed = new Set();
  let sunDegText = '';
  /** Every label put again from scratch (a question of the test sets up its own picture). */
  function clearLabels() {
    for (const id of placed) anno.remove(id);
    placed.clear();
  }
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      if (want && !placed.has(id)) {
        anno.add(id, {
          text: L.text(),
          point: L.point,
          kind: 'chip',
          color: L.color || COL.ink,
          spots: typeof L.spots === 'function' ? L.spots() : L.spots,
          optional: Boolean(L.optional),
        });
        placed.add(id);
      } else if (!want && placed.has(id)) {
        anno.remove(id);
        placed.delete(id);
      } else if (want && id === 'sunDeg') {
        const text = L.text();
        if (text !== sunDegText) {
          sunDegText = text;
          anno.setText(id, text);
        }
      }
    }
  }

  // ── camera: a gentle three-quarter view of the sky; it flies into the drop and back ──
  const DIR_SKY = V(-0.74, 0.26, -0.7).normalize(); // about 47° round from behind the eye
  const DIR_DROP = V(-1, -0.16, 0.36).normalize(); // a little from below: the drop against the blue sky
  const skyBox = new THREE.Box3(V(-3.4, 0.4, -6.4), V(3.6, 6.9, 9.8));
  const dropBox = new THREE.Box3();
  const corners = [V(-1.35, -1.6, -0.2), V(1.12, 1.12, 0.2)];
  function fitDropBox() {
    dropBox.makeEmpty();
    const sc = BIG;
    const pos = bowPoint(SUN.start, THETA_MID, 0, ARC, V());
    along(SUN.start, A);
    upOf(SUN.start, U);
    X.crossVectors(A, U);
    for (const x of [corners[0].x, corners[1].x])
      for (const y of [corners[0].y, corners[1].y])
        for (const z of [corners[0].z, corners[1].z]) {
          P0.copy(pos)
            .addScaledVector(A, x * sc)
            .addScaledVector(U, y * sc)
            .addScaledVector(X, z * sc);
          dropBox.expandByPoint(P0);
        }
  }
  fitDropBox();
  const poses = { sky: null, drop: null };
  function fitPoses() {
    const args = { camera, width: stage.width, height: stage.height, margin: MARGIN };
    const a = fitPose({ box: skyBox, dir: DIR_SKY, ...args });
    const b = fitPose({ box: dropBox, dir: DIR_DROP, ...args });
    poses.sky = { target: a.target, dist: a.position.distanceTo(a.target), dir: DIR_SKY };
    poses.drop = { target: b.target, dist: b.position.distanceTo(b.target), dir: DIR_DROP };
  }
  const guided = { position: V(), target: V() };
  const dirTmp = V();
  function guidedPose() {
    const f = s.v.zoom;
    const { sky: a, drop: b } = poses;
    guided.target.lerpVectors(b.target, a.target, f);
    const dist = Math.exp(Math.log(b.dist) + (Math.log(a.dist) - Math.log(b.dist)) * f);
    dirTmp.lerpVectors(b.dir, a.dir, f).normalize();
    guided.position.copy(guided.target).addScaledVector(dirTmp, dist);
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
  function takeView(duration = T.cam) {
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
    zoom: [0.45, 2.2],
    when: () => s.mode !== 'quiz',
    onTurn: beginOrbit,
  });
  rotateEl = rotate.el;
  function setView(view, { animate = true } = {}) {
    if (view === '3d') {
      // a turned view of what is shown: a quarter turn round, from a little higher
      fitPoses();
      s.userMovedCamera = true;
      const g = guidedPose();
      const off = camera.position.clone().copy(g.position).sub(g.target);
      off.applyAxisAngle(V(0, 1, 0), 0.9);
      off.y *= 1.15;
      const to = { position: g.target.clone().add(off), target: g.target.clone() };
      const from = { position: camera.position.clone(), target: controls.target.clone() };
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      if (!animate) {
        camera.position.copy(to.position);
        controls.target.copy(to.target);
        controls.update();
        stage.invalidate();
        return Promise.resolve(true);
      }
      return tweener.animate({
        key: 'camera',
        duration: T.cam,
        onUpdate: (k) => {
          const e = ease.inOutCubic(k);
          camera.position.lerpVectors(from.position, to.position, e);
          controls.target.lerpVectors(from.target, to.target, e);
          controls.update();
          stage.invalidate();
        },
      }).finished;
    }
    const p = takeView(animate ? T.cam : 0);
    emitChange();
    return p;
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
  });
  stage.onAfterRender(() => {
    syncLabels();
    anno.update();
  });
  stage.onResize(() => {
    note.hidden = stage.height < 230; // a very short view keeps its few pixels for the picture
    fitPoses();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
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
  /** The plan from one step to another: a list of [values, seconds], played one after the other. */
  function planFor(from, to) {
    const goal = TARGET[to];
    if (from === 'intro' && to === 'in')
      return [
        [{ zoom: 0 }, T.fly],
        [{ inK: 1 }, T.inK],
      ];
    if (from === 'in' && to === 'back') return [[{ outK: 1 }, T.outK]];
    if (from === 'back' && to === 'bow')
      return [
        [{ zoom: 1 }, T.fly],
        [{ axis: 1 }, T.axis],
        [{ lines: 1, bow: 1 }, T.lines],
        [{ arcs: 1 }, T.arcs],
      ];
    if (from === 'bow' && to === 'noon')
      return [
        [{ lines: 0, arcs: 0, sunArc: 1 }, T.fade],
        [{ sun: SUN.noon }, T.sun],
      ];
    // a jump (a step word, back, or several at once): the camera and everything with it; light drawn after
    const first = { zoom: goal.zoom, sun: goal.sun, axis: 0, lines: 0, arcs: 0, sunArc: 0, bow: 0 };
    if (goal.inK < s.v.inK) first.inK = goal.inK;
    if (goal.outK < s.v.outK) first.outK = goal.outK;
    const plan = [[first, Math.abs(goal.zoom - s.v.zoom) > 0.5 ? T.fly : T.back]];
    const rest = {};
    for (const k of KEYS) if (!(k in first) || first[k] !== goal[k]) rest[k] = goal[k];
    plan.push([rest, T.back]);
    return plan;
  }
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    s.busy = false;
  }
  async function go(step, { animate = true, sun = null } = {}) {
    if (!(step in TARGET)) return;
    const from = s.step;
    stopAll();
    const my = s.run;
    s.step = step;
    hintOff();
    takeView(animate ? T.cam : 0);
    if (!animate || from === step) {
      Object.assign(s.v, TARGET[step]);
      if (sun != null) s.v.sun = clampSun(sun);
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
    refresh();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_in', 1, ICONS.hand],
    in: ['act_back', 2, ICONS.hand],
    back: ['act_bow', 3, ICONS.hand],
    bow: ['act_noon', 4, ICONS.hand],
    noon: ['act_quiz', '', ICONS.chevR],
  };
  const NEXT = { intro: 'in', in: 'back', back: 'bow', bow: 'noon' };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const steady = { lead: '', act: '', note: '' };
  const vars = () => ({ r: RED_DEG, v: VIOLET_DEG, a: Math.round(s.v.sun), b: Math.max(0, Math.round(topDeg(s.v.sun))) });
  function noonOutcome() {
    return t(bowVisible(s.v.sun) ? 'out_noon_up' : 'out_noon_gone', vars());
  }
  function refresh() {
    const noteText = s.v.zoom < 0.5 ? t('note_drop') : t('note_sky');
    if (steady.note !== noteText) {
      steady.note = noteText;
      note.textContent = noteText;
    }
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm ? t('lead_intro') : s.busy ? steady.lead : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
    }
    ui.learn.classList.toggle('rb-calm', calm);
    const noonish = s.step === 'noon' && (!s.busy || s.dragging);
    sheet.outcome(calm || (s.busy && !noonish) ? '' : s.step === 'noon' ? noonOutcome() : t(`out_${s.step}`, vars()));
    sheet.rule(calm || (s.busy && !noonish) ? '' : t(`rule_${s.step}`, vars()));
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
    homeBtn.hidden = s.step === 'intro';
    homeBtn.disabled = s.busy;
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the drop, a tap on the drop ──────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    if (NEXT[s.step]) return go(NEXT[s.step]);
    return quiz.start();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_in',
    icon: ICONS.hand,
    target: () => (s.step === 'intro' && far() ? drop.root.position : null),
    radius: 20,
    pad: 8,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
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
    if (!drop.root.visible || s.step === 'noon' || s.step === 'bow' || s.mode === 'quiz') return false;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    // a small drop far away gets a bigger target: at least 26 px round its centre
    if (far()) {
      const c = drop.root.position.clone().project(camera);
      const cx = ((c.x + 1) / 2) * stage.width;
      const cy = ((1 - c.y) / 2) * stage.height;
      return Math.hypot(cx - p.x, cy - p.y) < 26;
    }
    return raycaster.intersectObject(drop.hit, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = canvasPoint(e);
      if (handle?.visible && handle.hit(p.x, p.y)) return;
      if (!pick(p)) return;
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );

  // ── the sun: dragged up and down its arc (from the bow on) ───────────────────
  const plane = new THREE.Plane(V(1, 0, 0), -EYE.x);
  const hitP = V();
  const sunTmp = V();
  const tFrom = V();
  const tTo = V();
  const tVia = V();
  let dragFrom = 0;
  function sunFromPointer(p, drag) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const ray = raycaster.ray;
    // the plane of the sun's path, unless it is seen almost edge-on: then by how far the finger moved
    if (Math.abs(ray.direction.x) > 0.25 && ray.intersectPlane(plane, hitP)) {
      const deg = (Math.atan2(hitP.y - EYE.y, -(hitP.z - EYE.z)) * 180) / Math.PI;
      if (deg > -30 && deg < 120) return deg;
    }
    return dragFrom + (drag?.along ?? 0) * 0.25;
  }
  function setSun(deg, { fromDrag = false } = {}) {
    const d = Math.round(clampSun(deg) * 2) / 2;
    if (s.step !== 'noon') {
      // moving the sun is the last step: go there without the step's own show
      stopAll();
      s.step = 'noon';
      Object.assign(s.v, { ...TARGET.noon, sun: s.v.sun });
    }
    s.v.sun = d;
    if (fromDrag) s.dragging = true;
    refresh();
    emitChange();
    stage.invalidate();
  }
  handle = createDragHandle(stage, {
    point: () => sun.root.position,
    axis: 'turn',
    track: {
      from: () => sunPoint(SUN.min, tFrom),
      to: () => sunPoint(SUN.max, tTo),
      via: () => sunPoint((SUN.min + SUN.max) / 2, tVia),
    },
    label: t('drag_me'),
    aria: t('drag_aria'),
    labelAt: 'below',
    pulse: Boolean(o.coach),
    when: () => (s.step === 'bow' || s.step === 'noon') && !s.busy && !s.locked && far() && !s.userMovedCamera,
    onStart: () => {
      dragFrom = s.v.sun;
      emit('dragstart', { part: 'sun' });
    },
    onMove: (drag) => setSun(sunFromPointer(drag, drag), { fromDrag: true }),
    onEnd: () => {
      s.dragging = false;
      emit('dragend', { part: 'sun', sun: s.v.sun });
      refresh();
    },
    onKey: (dir) => setSun(s.v.sun + dir * 2),
  });
  sunPoint(SUN.start, sunTmp);

  // ── how to use, in the panel ───────────────────────────────────────────────
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'drag', axis: 'turn', text: t('howto_sun'), handle, when: () => s.step === 'bow' || s.step === 'noon' },
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
    const v = s.v;
    const sunDeg = Math.round(v.sun * 10) / 10;
    return {
      step: s.step,
      sun: sunDeg,
      bow: bowVisible(v.sun),
      top: bowVisible(v.sun) ? Math.round(topDeg(v.sun) * 10) / 10 : null,
      red: Math.round(THETA_RED * 10) / 10,
      violet: Math.round(THETA_VIOLET * 10) / 10,
      scene: v.zoom < 0.5 ? 'drop' : 'sky',
      busy: s.busy,
      next: { intro: 'in', in: 'back', back: 'bow', bow: 'noon', noon: 'quiz' }[s.step],
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.sun]);
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
      label: (j) => `<span class="rb-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const words = (keys) => keys.map((key) => ({ key }));
  /** The five questions: where to look, which colour bends most, which colour from the outer drop, midday, how high. */
  const KINDS = ['where', 'bend', 'outer', 'noon', 'height'];
  const SCENES = {
    where: ['intro', SUN.start],
    bend: ['in', SUN.start],
    outer: ['bow', SUN.start],
    noon: ['noon', 65],
    height: ['noon', 20],
  };
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const qVars = (sunDeg) => ({ r: RED_DEG, v: VIOLET_DEG, a: sunDeg, b: Math.round(topDeg(sunDeg)) });

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
        learnSaved = { step: s.step, sun: s.v.sun };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quiz = '';
        clearLabels();
        syncUI();
        go(learnSaved?.step || 'intro', { animate: false, sun: learnSaved?.step === 'noon' ? learnSaved.sun : null });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        const [scene, sunDeg] = SCENES[kind];
        s.quiz = kind;
        clearLabels();
        await go(scene, { animate: false, sun: sunDeg });
        if (kind === 'height') Object.assign(s.v, { bow: 0 });
        if (kind === 'outer') Object.assign(s.v, { bow: 0 });
        if (kind === 'where') Object.assign(s.v, { axis: 0 });
        stage.invalidate();
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        question = { kind, sun: sunDeg };
        const qv = qVars(sunDeg);
        if (kind === 'where')
          return { text: t('q_where'), ...choicesOf(words(['c_wh_right', 'c_wh_sun', 'c_wh_top', 'c_wh_any']), kind, (x) => t(x.key)) };
        if (kind === 'bend')
          return { text: t('q_bend'), ...choicesOf(words(['c_be_right', 'c_be_red', 'c_be_green', 'c_be_same']), kind, (x) => t(x.key)) };
        if (kind === 'outer')
          return { text: t('q_outer', qv), ...choicesOf(words(['c_ou_right', 'c_ou_violet', 'c_ou_green', 'c_ou_white']), kind, (x) => t(x.key)) };
        if (kind === 'noon')
          return { text: t('q_noon', qv), ...choicesOf(words(['c_no_right', 'c_no_bright', 'c_no_enter', 'c_no_heat']), kind, (x) => t(x.key)) };
        return { text: t('q_height', qv), ...choicesOf(heightChoices(sunDeg), kind, (x) => `${N(x.v)}°`) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const qv = qVars(question.sun);
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note2 = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], qv)}` : '');
        if (k === 'where') return t('why_where', qv) + note2({ c_wh_sun: 'mis_wh_sun', c_wh_top: 'mis_wh_top', c_wh_any: 'mis_wh_any' });
        if (k === 'bend') return t('why_bend', qv) + note2({ c_be_red: 'mis_be_red', c_be_green: 'mis_be_green', c_be_same: 'mis_be_same' });
        if (k === 'outer')
          return t('why_outer', qv) + note2({ c_ou_violet: 'mis_ou_violet', c_ou_green: 'mis_ou_green', c_ou_white: 'mis_ou_white' });
        if (k === 'noon') return t('why_noon', qv) + note2({ c_no_bright: 'mis_no_bright', c_no_enter: 'mis_no_enter', c_no_heat: 'mis_no_heat' });
        return t('why_height', qv) + note2({ theta: 'mis_he_theta', sum: 'mis_he_sum', sun: 'mis_he_sun' });
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
    return go('intro', { animate: false });
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
      go(b.dataset.example);
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
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    const order = ['intro', ...STEPS];
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowRight' && !onButton) {
      if (s.step !== 'noon') doAction();
    } else if (k === 'ArrowLeft' && !onButton) go(order[Math.max(1, order.indexOf(s.step) - 1)]);
    else if ((k === 'ArrowUp' || k === 'ArrowDown') && !onButton) {
      if (s.busy || !(s.step === 'bow' || s.step === 'noon')) return;
      setSun(s.v.sun + (k === 'ArrowUp' ? 2 : -2));
      handle.markUsed();
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
  // the parts of later steps are in the scene from the start; the band and the drop's close view are compiled ahead
  stage.warmUp?.({ show: [band.mesh, drop.root] });
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
    /** Change any of: step ('intro' | 'in' | 'back' | 'bow' | 'noon'), sun (degrees, 5 … 60: goes to the last step),
     * view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.step) await go(p.step, { animate, sun: p.sun ?? null });
      else if (p.sun != null) {
        if (s.step !== 'noon') await go('noon', { animate: false, sun: p.sun });
        else setSun(p.sun);
      }
      if (p.view) await setView(p.view, { animate });
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await setView('front', { animate: false });
      await goHome();
      rotate.rearm();
      handle.rearm();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** The view with its drawn light on it, cover-fitted to the size asked for. */
    capture({ width = 800, height = 500, background = '#0b2a5b' } = {}) {
      stage.render();
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      const ctx = c.getContext('2d');
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }
      const gl = stage.canvas;
      const k = Math.max(width / gl.width, height / gl.height);
      const x = (width - gl.width * k) / 2;
      const y = (height - gl.height * k) / 2;
      ctx.drawImage(gl, x, y, gl.width * k, gl.height * k);
      ctx.drawImage(rays.canvas, x, y, gl.width * k, gl.height * k);
      return c.toDataURL('image/png');
    },
    /** The raindrop cut open, with each colour's path through it (radius 1 mm). */
    exportRoot: () => dropModel(),
  };
}
