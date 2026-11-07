// Coin in a cup (পানিতে পয়সা): book page 246, topic 9.1.1, the নিজে করো with চিত্র ৯.০৩, student view. A wide glazed tea
// cup on a plain table in a calm blue setting, a coin on its bottom, and an eye (drawn as in the book) placed so the
// rim just hides the coin. Four steps, one tap each, slow: ① the cup is cut open: the eye's line of sight passes the
// rim and lands beyond the coin, and the coin's light toward the eye is stopped by the wall; ② a steel jug pours
// water: the traced ray from the coin bends at the surface and, once there is enough water, clears the rim and reaches
// the eye; ③ the normal at that point and the angles θ₁ (in water) and θ₂ (in air), with n₁ sin θ₁ = n₂ sin θ₂ in
// numbers; ④ the eye looks straight back along the bent light: the coin seems raised (a translucent ghost on the
// dashed line). From step ② the water level can be dragged (or moved with ↑ ↓). A calm card on the first screen, then
// per step a lead-in line, the result and the rule in the book's words; the kit's how-to row; a four-question test.
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
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  angleChoices,
  COIN,
  COIN_TOP,
  CUP,
  depthOf,
  EYE,
  LEVEL,
  levelForTheta1,
  N_WATER,
  rad,
  sightLine,
  tenth,
  trace,
  whole,
  ZP,
} from './reading.js';
import { backdrop, createScene } from './scene.js';

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

export const STEPS = ['hidden', 'pour', 'angles', 'image'];
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 14, side: 10 };
const MARGIN_TIGHT = { top: 40, bottom: 4, side: 6 };
// how long things take (s): slow enough to follow
const T = {
  cut: 1.8,
  sight: 1.4,
  ray: 1.6,
  jugIn: 1,
  tilt: 0.9,
  flow: 0.4,
  fill: 3.6,
  jugOut: 1.2,
  normal: 1.2,
  arcs: 1.2,
  back: 1.6,
  ghost: 1.2,
  jump: 1.4,
  fly: 1.4,
};
/** Where each step ends. level: null keeps the student's level (from the pour on). */
const TARGET = {
  intro: { cut: 0, sight: 0, ray: 0, level: LEVEL.empty, normal: 0, arcs: 0, back: 0, ghost: 0 },
  hidden: { cut: 1, sight: 1, ray: 1, level: LEVEL.empty, normal: 0, arcs: 0, back: 0, ghost: 0 },
  pour: { cut: 1, sight: 0, ray: 1, level: LEVEL.full, normal: 0, arcs: 0, back: 0, ghost: 0 },
  angles: { cut: 1, sight: 0, ray: 1, level: null, normal: 1, arcs: 1, back: 0, ghost: 0 },
  image: { cut: 1, sight: 0, ray: 1, level: null, normal: 0.0, arcs: 0, back: 1, ghost: 1 },
};
const ORDER = ['intro', ...STEPS];
const COLORS = {
  ink: '#1d2733',
  stop: '#c92a2a',
  seen: '#9c5700',
  water: '#1864ab',
  normal: '#343a40',
  t1: '#1971c2',
  t2: '#2b8a3e',
  image: '#9c5700',
};
const V = (x, y, z = ZP) => new THREE.Vector3(x, y, z);
const dirOf = (az, el) => V(Math.sin(rad(az)) * Math.cos(rad(el)), Math.sin(rad(el)), Math.cos(rad(az)) * Math.cos(rad(el))).normalize();
const DRAG_X = 4.4; // where the level's handle sits on the water's cut face

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'cc');
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
  // the line before the action: what the next tap will show (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'cc-lead';
  $('.pvc-act-row').before(lead);
  const probe = document.createElement('p');
  probe.className = 'cc-lead cc-probe';
  probe.setAttribute('aria-hidden', 'true');
  probe.textContent = '.';
  ui.learn.appendChild(probe);
  const outcomeEl = /** @type {HTMLElement} */ ($('.pvc-outcome'));
  const ruleEl = /** @type {HTMLElement} */ ($('.pvc-rule'));
  /** The calm card takes the room the steps' lead-in, result and rule take, so nothing moves at the first tap. */
  function fitCalm() {
    if (!ui.learn.classList.contains('cc-calm')) {
      if (lead.style.minHeight) lead.style.minHeight = '';
      return;
    }
    const gap = parseFloat(getComputedStyle(ui.learn).rowGap) || 0;
    const leadH = probe.offsetHeight;
    const h = leadH + outcomeEl.offsetHeight + ruleEl.offsetHeight + gap * (leadH > 0 ? 2 : 1);
    const want = `${Math.round(h)}px`;
    if (lead.style.minHeight !== want) lead.style.minHeight = want;
  }
  new ResizeObserver(() => fitCalm()).observe(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // the live graph under the rule (last step, on tall panels beside the 3D)
  const graph = createGraph({ t });
  $('.pvc-rule').after(graph.el);
  // an honest note on the picture: the cup is cut open to show the inside
  const note = document.createElement('div');
  note.className = 'cc-note';
  note.innerHTML = `<span class="cc-long">${t('note_cut')}</span><span class="cc-short">${t('note_cut_short')}</span>`;
  note.hidden = true;
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 1, far: 600, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.2);
  sun.position.set(14, 40, 26);
  sun.target.position.set(0, 3, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55);
  fill.position.set(-30, 16, 22);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 4;
    Object.assign(sun.shadow.camera, { left: -12, right: 16, top: 14, bottom: -10, near: 20, far: 80 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const parts = createScene();
  const { cup, coin, ghost, water, jug } = parts;
  scene.add(parts.table, cup.root, coin.root, ghost.root, water.root, jug.root, jug.stream);

  const rays = createRays({ stage, host: ui.canvasHost });
  const rv = rays.view;
  rv.sightLine = sightLine();

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
    v: { ...TARGET.intro, jug: 0, tilt: 0, flow: 0 },
    level: LEVEL.full, // the student's level, from the pour on
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    quizKind: '',
    revealed: false,
    drag: null,
    geo: trace(LEVEL.empty),
    seen: false,
    edgeSeen: false,
    edgeGeo: null,
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the scene from the state ────────────────────────────────────────────────
  function syncScene() {
    const v = s.v;
    // the front half of the cup fades away; the cut face shows once it is gone
    cup.front.visible = v.cut < 0.995;
    cup.frontMat.opacity = 1 - v.cut;
    cup.frontMat.depthWrite = v.cut < 0.05;
    cup.cut.visible = v.cut > 0.02;
    cup.edge.visible = v.cut > 0.02;
    note.hidden = v.cut < 0.6 || s.mode === 'quiz';
    water.set(v.level);
    jug.set({ show: v.jug, tilt: v.tilt, flow: v.flow }, v.level);
    const geo = trace(v.level);
    const edgeGeo = trace(v.level, { x0: COIN.r });
    const wasSeen = s.seen;
    const wasEdge = s.edgeSeen;
    s.geo = geo;
    s.edgeGeo = edgeGeo;
    s.seen = geo.visible && v.ray >= 0.999;
    // only the coin's far edge (ধার) reaches the eye: its light is drawn too, thin
    s.edgeSeen = !geo.visible && edgeGeo.visible && v.ray >= 0.999;
    if (s.busy && ((s.seen && !wasSeen) || (s.edgeSeen && !wasEdge && !wasSeen))) arrive();
    rv.geo = geo;
    rv.sight = v.sight;
    rv.ray = v.ray;
    rv.normal = geo.surface ? v.normal : 0;
    rv.arcs = geo.surface ? v.arcs : 0;
    rv.showT2 = !(s.quizKind === 'angle' && !s.revealed);
    rv.back = geo.visible ? v.back : 0;
    rv.lit = s.seen || s.edgeSeen ? 1 : 0;
    rv.edgeGeo = edgeGeo;
    rv.edge = s.edgeSeen ? 1 : 0;
    ghost.set(geo.visible && geo.image ? v.ghost : 0, geo.image ? geo.image.y : 0);
  }
  /** The light has just reached the eye: a moment's glow. */
  function arrive() {
    audio.success?.();
    tweener.animate({
      key: 'shine',
      duration: 1.4,
      onUpdate: (k) => {
        rv.shine = 1 - k;
        stage.invalidate();
      },
    });
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  /** @type {ReturnType<typeof createDragHandle> | null} */
  let levelHandle = null;
  /** @type {HTMLElement | null} */
  let levelWord = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      () => rays.boxes(),
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotateEl),
      handleDisc, // the handle's disc only: its faint dashed track may pass behind a label
      () => boxOf(levelWord), // and its first-use word
    ],
  });
  const discBox = { left: 0, top: 0, right: 0, bottom: 0 };
  function handleDisc() {
    if (!levelHandle?.visible) return null;
    const p = rays.toScreen({ x: DRAG_X, y: s.v.level, z: 0.05 });
    discBox.left = p.x - 26;
    discBox.right = p.x + 26;
    discBox.top = p.y - 26;
    discBox.bottom = p.y + 26;
    return discBox;
  }
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(18, 0), spot(18, -18), spot(18, 18), spot(26, -34)];
  const LEFT_OF = [spot(-18, 0), spot(-18, -18), spot(-18, 18), spot(-26, -34)];
  const ABOVE = [spot(0, -24), spot(18, -24), spot(-18, -24), spot(0, -40)];
  const BELOW = [spot(0, 24), spot(-20, 24), spot(20, 24)];
  const inQuiz = () => s.mode === 'quiz';
  const tight = () => stage.height < 260;
  const LABELS = {
    eye: {
      text: () => t('lbl_eye'),
      point: () => V(EYE.x, EYE.y),
      color: COLORS.ink,
      // beside the eye, never on it (the eye's reach is in the drawing's boxes, which every label avoids)
      spots: [spot(0, -42), spot(0, -50), spot(-38, -34), spot(40, -40), spot(-46, 0)],
      // in the smallest frame the glowing eye with its "দেখা যায়" needs no name
      show: () => !(tight() && (s.seen || s.edgeSeen) && s.v.ray >= 0.999 && s.v.cut > 0.9 && !inQuiz() && !s.busy),
    },
    see: {
      text: () => (s.seen ? t('lbl_seen') : s.edgeSeen ? t('lbl_edge_seen') : t('lbl_q')),
      point: () => V(EYE.x, EYE.y),
      color: () => (s.seen || s.edgeSeen ? COLORS.seen : COLORS.stop),
      // beside the eye, away from the light that comes in from the lower right
      // left of the eye; near the view's left edge, to its right, above the light that leaves it down to the right
      spots: [spot(-40, 4), spot(-40, -16), spot(-38, 24), spot(40, -8), spot(40, -22), spot(38, -36)],
      show: () => s.v.ray >= 0.999 && s.v.cut > 0.9 && !inQuiz() && !s.busy,
    },
    coin: {
      text: () => (s.v.ghost > 0.5 && s.geo.visible ? t('lbl_coin_real') : t('lbl_coin')),
      point: () => V(COIN.r, COIN_TOP.y),
      color: COLORS.ink,
      spots: [...RIGHT_OF, ...BELOW, ...LEFT_OF],
      optional: true,
      // in the smallest frames the raised coin's label needs the room
      show: () => s.v.cut > 0.9 && s.v.arcs < 0.5 && !(s.v.ghost > 0.5 && stage.height < 260) && !behind(),
    },
    blocked: {
      text: () => t('lbl_blocked'),
      point: () => {
        const p = s.geo.points.at(-1);
        return V(p.x, p.y);
      },
      color: COLORS.stop,
      spots: [...LEFT_OF, ...ABOVE],
      show: () => s.v.ray >= 0.999 && !s.geo.visible && !inQuiz() && !s.busy && !behind(),
    },
    water: {
      text: () => t('lbl_water'),
      point: () => V(CUP.ri - 1.4, (CUP.base + s.v.level) / 2, 0),
      color: COLORS.water,
      // clear of the level's handle, its word and its track (the handle sits on the right of the water)
      spots: [...LEFT_OF, ...BELOW, spot(-30, -20)],
      avoid: [() => levelHandle?.box() ?? []],
      optional: true,
      show: () => depthOf(s.v.level) > 1.6 && s.v.cut > 0.9 && s.v.normal < 0.5 && s.v.back < 0.5 && !behind() && stage.height >= 260,
    },
    t1: {
      text: () => t('lbl_t1', { a: whole(s.geo.theta1) }),
      // on the normal below the surface, to its left: the light in the water runs off to the right
      point: () => {
        const S = s.geo.surface;
        return V(S.x, S.y - rays.ARC * 0.85);
      },
      color: COLORS.t1,
      spots: [spot(-24, 0), spot(-24, 14), spot(-24, -12), spot(-20, 30)],
      show: () => Boolean(s.geo.surface) && s.v.arcs > 0.9 && !behind(),
    },
    t2: {
      text: () => t('lbl_t2', { a: whole(s.geo.theta2) }),
      // on the normal above the surface, to its right: the light in the air runs off to the left
      point: () => {
        const S = s.geo.surface;
        return V(S.x, S.y + rays.ARC * 0.85);
      },
      color: COLORS.t2,
      spots: [spot(24, 0), spot(24, -14), spot(24, 12), spot(20, -30), spot(16, -46)],
      show: () => Boolean(s.geo.surface) && s.v.arcs > 0.9 && rv.showT2 && !behind(),
    },
    normal: {
      text: () => t('lbl_normal'),
      point: () => {
        const S = s.geo.surface;
        return V(S.x, S.y + rays.NORMAL_UP * 0.8);
      },
      color: COLORS.normal,
      // to the right of the normal, a little below its top: the eye's labels have the top of the view
      spots: [spot(16, 0), spot(16, -14), spot(16, 14), ...ABOVE, ...LEFT_OF],
      // placed after θ₁ and θ₂; where there is no clear spot (the smallest frames) the dashed line and the panel name it
      optional: true,
      show: () => Boolean(s.geo.surface) && s.v.normal > 0.9 && !behind(),
    },
    image: {
      text: () => t('lbl_image'),
      point: () => V(-COIN.r * 0.2, s.geo.image.y),
      color: COLORS.image,
      spots: [spot(22, 20), spot(30, 34), ...RIGHT_OF, ...BELOW],
      show: () => Boolean(s.geo.image) && s.geo.visible && s.v.ghost > 0.9 && !inQuiz() && !behind(),
    },
  };
  const shownText = new Map();
  function syncLabels() {
    // the kit places labels in the order they were added: keep that the order of LABELS (θ₁ and θ₂ before লম্ব), so a
    // label added now puts the later ones in again after it
    let added = false;
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      if (want) {
        const text = L.text();
        const color = typeof L.color === 'function' ? L.color() : L.color;
        const key = `${text}|${color}`;
        if (!anno.has(id) || added) {
          added = true;
          if (anno.has(id)) anno.remove(id);
          anno.add(id, { text, point: L.point, kind: 'force', color, spots: L.spots, optional: Boolean(L.optional), avoid: L.avoid ?? [] });
          shownText.set(id, key);
        } else if (shownText.get(id) !== key) {
          // a new value (θ while the water moves): in place, no fade
          anno.update(id, { text, color });
          shownText.set(id, key);
        }
      } else if (anno.has(id)) {
        anno.remove(id);
        shownText.delete(id);
      }
    }
  }

  // ── camera: whole cup, the cut-away section, and the section with the jug pouring ─────
  const POSES = {
    whole: { box: new THREE.Box3(V(EYE.x - 1.4, 0, -6), V(6.2, EYE.y + 2, 6)), dir: dirOf(24, 26) },
    section: { box: new THREE.Box3(V(EYE.x - 1.4, 0.3, -1.2), V(6.1, EYE.y + 2, 0.4)), dir: dirOf(22, 14) },
    pour: { box: new THREE.Box3(V(EYE.x - 1.6, 0, -2.5), V(12.6, Math.max(EYE.y + 1.2, 15.4), 0.6)), dir: dirOf(22, 14) },
  };
  const fitted = {};
  function fitPoses() {
    for (const [k, p] of Object.entries(POSES)) {
      // the tightest frames (a 390 × 520 phone): slimmer margins, so the cup is as big as the height allows
      const margin = stage.height < 260 ? MARGIN_TIGHT : MARGIN;
      const f = fitPose({ box: p.box, dir: p.dir, camera, width: stage.width, height: stage.height, margin });
      fitted[k] = { target: f.target, dist: f.position.distanceTo(f.target), dir: p.dir };
    }
  }
  const guided = { position: V(0, 0, 0), target: V(0, 0, 0), dir: V(0, 0, 1) };
  function blend(a, b, k, out) {
    out.target.lerpVectors(a.target, b.target, k);
    out.dir.lerpVectors(a.dir, b.dir, k).normalize();
    out.dist = Math.exp(Math.log(a.dist) + (Math.log(b.dist) - Math.log(a.dist)) * k);
    return out;
  }
  const mid = { target: V(0, 0, 0), dir: V(0, 0, 1), dist: 1 };
  const fin = { target: V(0, 0, 0), dir: V(0, 0, 1), dist: 1 };
  function guidedPose() {
    blend(fitted.whole, fitted.section, ease.inOutCubic(s.v.cut), mid);
    blend(mid, fitted.pour, s.v.jug, fin);
    guided.target.copy(fin.target);
    guided.position.copy(fin.target).addScaledVector(fin.dir, fin.dist);
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
      // a turned view: the guided pose, swung a little round
      s.view = '3d';
      s.userMovedCamera = true;
      tweener.cancel('camera');
      const g = guidedPose();
      const off = g.position
        .clone()
        .sub(g.target)
        .applyAxisAngle(V(0, 1, 0), rad(-40));
      camera.position.copy(g.target).add(off);
      controls.target.copy(g.target);
      controls.update();
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p = takeView(animate ? T.fly : 0);
    emitChange();
    return p;
  }
  // seen from behind the cup or from the side the light is inside it: the drawing goes faint, the level's handle and
  // the labels of what is hidden go
  function behind() {
    return camera.position.z < 1.5;
  }
  let faint = false;
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
    if (behind() !== faint) {
      faint = !faint;
      rays.canvas.style.opacity = faint ? '0.4' : '';
      syncLabels();
    }
  });
  stage.onResize(() => {
    // in the tightest frames the handle's first-use word would sit on the labels: the how-to row says it instead
    if (stage.height < 260) levelHandle?.markUsed();
    fitPoses();
    syncScene();
    refresh();
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
          syncScene();
          syncLabels();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  /** Where a step ends, with the student's level from the pour on. */
  function goal(step) {
    const g = { ...TARGET[step], jug: 0, tilt: 0, flow: 0 };
    if (g.level == null) g.level = s.level;
    return g;
  }
  /** The plan from one step to another: a list of [values, seconds], played one after the other. */
  function planFor(from, to) {
    if (from === 'intro' && to === 'hidden')
      return [
        [{ cut: 1 }, T.cut],
        [{ sight: 1 }, T.sight],
        [{ ray: 1 }, T.ray],
      ];
    if (from === 'hidden' && to === 'pour') {
      s.level = LEVEL.full;
      return [
        [{ jug: 1, sight: 0 }, T.jugIn],
        [{ tilt: 1 }, T.tilt],
        [{ flow: 1 }, T.flow],
        [{ level: LEVEL.full }, T.fill],
        [{ flow: 0 }, T.flow],
        [{ tilt: 0 }, T.tilt],
        [{ jug: 0 }, T.jugOut],
      ];
    }
    if (from === 'pour' && to === 'angles')
      return [
        [{ normal: 1 }, T.normal],
        [{ arcs: 1 }, T.arcs],
      ];
    if (from === 'angles' && to === 'image')
      return [
        [{ normal: 0, arcs: 0 }, 0.6],
        [{ back: 1 }, T.back],
        [{ ghost: 1 }, T.ghost],
      ];
    // a jump (a step word, back, or several at once): everything together
    if (to === 'pour' || (ORDER.indexOf(from) < ORDER.indexOf('pour') && ORDER.indexOf(to) > ORDER.indexOf('pour'))) s.level = LEVEL.full;
    return [[goal(to), T.jump]];
  }
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    s.busy = false;
  }
  async function go(step, { animate = true } = {}) {
    if (!(step in TARGET)) return;
    const from = s.step;
    stopAll();
    endDrag();
    const my = s.run;
    hintOff();
    takeView(animate ? T.fly : 0);
    if (!animate || from === step) {
      if (step === 'pour' && from !== 'pour') s.level = LEVEL.full;
      if (ORDER.indexOf(step) < ORDER.indexOf('pour')) s.level = LEVEL.full;
      s.step = step;
      Object.assign(s.v, goal(step));
      s.busy = false;
      done();
      return;
    }
    const plan = planFor(from, step);
    s.step = step;
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    for (const [to, sec] of plan) {
      if (!(await tweenTo(to, sec, my))) return;
    }
    Object.assign(s.v, goal(step));
    s.busy = false;
    done();
  }
  function done() {
    syncScene();
    syncLabels();
    refresh();
    emitChange();
  }
  /** The student's level (from the pour on): drag, keys, or set(). */
  function setLevel(y) {
    const l = Math.min(LEVEL.full, Math.max(LEVEL.empty, y));
    if (Math.abs(l - s.v.level) < 1e-6) return;
    s.level = l;
    s.v.level = l;
    syncScene();
    syncLabels();
    refresh();
    stage.invalidate();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_look', 1, ICONS.hand],
    hidden: ['act_pour', 2, ICONS.hand],
    pour: ['act_normal', 3, ICONS.hand],
    angles: ['act_image', 4, ICONS.hand],
    image: ['act_quiz', '', ICONS.chevR],
  };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const replayBtn = /** @type {HTMLButtonElement} */ ($('[data-act="replay"]'));
  const steady = { lead: '', act: '' };
  /** The result line, from the live state (it follows the student's level). */
  function outcome() {
    const g = s.geo;
    const step = s.step;
    const d = tenth(depthOf(s.v.level));
    if (step === 'hidden') return t('out_hidden');
    if (step === 'pour') {
      if (d <= 0) return t('out_empty');
      if (g.visible) return t('out_seen', { d });
      if (s.edgeGeo?.visible) return t('out_edge', { d });
      return t('out_none', { d });
    }
    if (step === 'angles') {
      if (!g.surface) return t('out_dry');
      const a = whole(g.theta1);
      const b = whole(g.theta2);
      const k = (N_WATER * Math.sin(rad(g.theta1))).toFixed(2);
      return `${t('out_angles', { a, b })}<span class="cc-law">${N(N_WATER)} × sin ${N(a)}° = ${N(1)} × sin ${N(b)}° = ${N(k)}</span>`;
    }
    if (step === 'image') {
      if (!g.visible || !g.image) return t(s.edgeSeen ? 'out_image_edge' : 'out_image_none');
      return t('out_image', { d: tenth(g.depth), a: tenth(g.apparent) });
    }
    return '';
  }
  function rule() {
    return t(`rule_${s.step}`);
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm
      ? `<span class="cc-long">${t('intro')}</span><span class="cc-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('cc-calm', calm);
    }
    fitCalm();
    sheet.outcome(calm || s.busy ? '' : outcome());
    sheet.rule(calm || s.busy ? '' : rule());
    graph.el.classList.toggle('cc-off', s.step !== 'image' || s.busy);
    if (s.step === 'image') graph.update(s.v.level);
    sheet.choose(calm ? null : s.step);
    sheet.next({ intro: 'hidden', hidden: 'pour', pour: 'angles', angles: 'image' }[s.step] ?? null);
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
    replayBtn.hidden = s.step === 'intro';
    replayBtn.disabled = s.busy;
    syncLabels();
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the cup, a tap on the cup ────────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const next = { intro: 'hidden', hidden: 'pour', pour: 'angles', angles: 'image' }[s.step];
    if (next) return go(next);
    return quiz.start();
  }
  const cupMid = V(0, 3.4, 0);
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_look',
    icon: ICONS.hand,
    // a ring round the cup itself (its middle, its radius), clear of the eye
    target: () => cupMid,
    worldRadius: 6.4,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const cupMeshes = [cup.back, cup.front, cup.cut];
  function onCup(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(cupMeshes, false).some((h) => h.object.visible);
  }

  // ── dragging the water level (from the pour on) ─────────────────────────────
  const canDrag = () => !s.locked && !s.busy && s.mode === 'explore' && ORDER.indexOf(s.step) >= ORDER.indexOf('pour') && camK >= 1 && !behind();
  const handleAt = new THREE.Vector3();
  levelHandle = createDragHandle(stage, {
    point: () => handleAt.set(DRAG_X, s.v.level, 0.05),
    axis: 'y',
    track: { from: new THREE.Vector3(DRAG_X, LEVEL.empty, 0.05), to: new THREE.Vector3(DRAG_X, LEVEL.full, 0.05) },
    label: t('drag_me'),
    labelAt: 'below',
    aria: t('aria_drag_level'),
    pulse: Boolean(o.coach),
    when: canDrag,
  });
  if (stage.height < 260) levelHandle.markUsed();
  levelWord = /** @type {HTMLElement | null} */ (levelHandle.el.querySelector('.pvc-dh-word'));
  // the handle shows and hides on its own between frames: draw once more then, so the labels make room for it
  let handleShown = false;
  stage.addTicker(() => {
    const v = Boolean(levelHandle?.visible);
    if (v === handleShown) return false;
    handleShown = v;
    return true;
  });

  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      // last: before the water can be dragged it keeps its place unseen, so the panel keeps its height
      { kind: 'drag', axis: 'y', text: t('howto_level'), handle: levelHandle, when: () => ORDER.indexOf(s.step) >= ORDER.indexOf('pour') },
    ],
    { stage },
  );
  const scr = (x, y, z) => rays.toScreen({ x, y, z });
  function grabLevel(p, touch) {
    if (!canDrag()) return false;
    if (levelHandle.hit(p.x, p.y)) return true;
    // the water's line on the cut face, with some slack
    const a = scr(-CUP.ri + 0.3, s.v.level, 0);
    const b = scr(CUP.ri - 0.3, s.v.level, 0);
    const slack = touch ? 18 : 10;
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const len2 = Math.max(1, tx * tx + ty * ty);
    const k = ((p.x - a.x) * tx + (p.y - a.y) * ty) / len2;
    if (k < 0.15 || k > 1) return false; // not on the eye's side, where the rays are
    const dx = a.x + tx * k - p.x;
    const dy = a.y + ty * k - p.y;
    return Math.hypot(dx, dy) < slack;
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = hostXY(e);
      down = { x: p.x, y: p.y, at: now() };
      if (!grabLevel(p, e.pointerType === 'touch')) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      s.drag = { id: e.pointerId, y: p.y, x: p.x, level: s.v.level };
      levelHandle.markUsed();
      action?.hide('drag');
      emit('dragstart', { part: 'water' });
      e.preventDefault();
      e.stopPropagation();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    const a = scr(DRAG_X, g.level, 0.05);
    const b = scr(DRAG_X, g.level + 1, 0.05);
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const cm = ((p.x - g.x) * tx + (p.y - g.y) * ty) / Math.max(0.01, tx * tx + ty * ty);
    const before = tenth(depthOf(s.v.level));
    setLevel(g.level + cm);
    if (tenth(depthOf(s.v.level)) !== before && Math.round(depthOf(s.v.level) * 10) % 5 === 0) audio.tick?.();
  });
  function endDrag(e) {
    const g = s.drag;
    if (!g || (e && e.pointerId !== g.id)) return;
    if (e) releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked;
    action?.show('drag');
    emit('dragend', { part: 'water' });
    refresh();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const was = Boolean(s.drag);
    endDrag(e);
    if (!down || was) {
      down = null;
      return;
    }
    const p = hostXY(e);
    const moved = Math.hypot(p.x - down.x, p.y - down.y);
    const quick = now() - down.at < 600;
    down = null;
    if (moved > 8 || !quick || s.userMovedCamera) return;
    if (s.step !== 'image' && onCup(p)) doAction();
  });
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || s.drag) return;
    const p = hostXY(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = grabLevel(p, false) ? 'ns-resize' : s.step !== 'image' && onCup(p) ? (s.locked ? 'not-allowed' : 'pointer') : '';
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
    const g = s.geo;
    return {
      step: s.step,
      busy: s.busy,
      water: tenth(depthOf(s.v.level)), // cm of water in the cup
      seen: g.visible, // the light from the coin's middle reaches the eye
      edge: s.edgeGeo?.visible ?? false, // the far edge (ধার) of the coin reaches the eye
      theta1: g.surface ? whole(g.theta1) : null, // degrees, in water
      theta2: g.surface ? whole(g.theta2) : null, // degrees, in air
      depth: g.water ? tenth(g.depth) : 0, // cm, the coin under the surface
      apparent: g.visible && g.image ? tenth(g.apparent) : null, // cm, how deep it looks
      cut: s.v.cut > 0.5,
      next: { intro: 'look', hidden: 'pour', pour: 'normal', angles: 'image', image: 'quiz' }[s.step],
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.water, snap.seen]);
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
      label: (j) => `<span class="cc-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const words = (keys) => keys.map((key) => ({ key }));
  /** The four questions, in this order (no scene shows a later answer): why hidden, which way it bends, θ₂, where it looks. */
  const KINDS = ['hidden', 'bend', 'angle', 'image'];
  const QUIZ_THETA = 35;
  const QUIZ_LEVEL = levelForTheta1(QUIZ_THETA) ?? LEVEL.full;
  /** The scene of a question: everything set by hand, so no earlier scene or step shows through. */
  function quizScene(kind) {
    stopAll();
    endDrag();
    s.revealed = false;
    const base = { cut: 1, sight: 0, ray: 1, level: LEVEL.full, normal: 0, arcs: 0, back: 0, ghost: 0, jug: 0, tilt: 0, flow: 0 };
    if (kind === 'hidden') Object.assign(base, { sight: 1, level: LEVEL.empty });
    if (kind === 'bend') Object.assign(base, { normal: 1 });
    if (kind === 'angle') Object.assign(base, { normal: 1, arcs: 1, level: QUIZ_LEVEL });
    s.step = kind === 'hidden' ? 'hidden' : 'pour';
    s.level = base.level;
    Object.assign(s.v, base);
    takeView(0);
    syncScene();
    syncLabels();
    stage.invalidate();
  }

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
        learnSaved = { step: s.step, level: s.level };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        endDrag();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizKind = '';
        s.revealed = false;
        syncUI();
        const back = learnSaved || { step: 'intro', level: LEVEL.full };
        s.level = back.level;
        s.step = 'intro'; // land on the saved step without a flight
        go(back.step, { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        s.quizKind = kind;
        quizScene(kind);
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        question = { kind };
        if (kind === 'hidden')
          return { text: t('q_hidden'), ...choicesOf(words(['c_hd_right', 'c_hd_dark', 'c_hd_bend', 'c_hd_eye']), kind, (x) => t(x.key)) };
        if (kind === 'bend')
          return { text: t('q_bend'), ...choicesOf(words(['c_bd_right', 'c_bd_toward', 'c_bd_none', 'c_bd_back']), kind, (x) => t(x.key)) };
        if (kind === 'angle') {
          const items = angleChoices(QUIZ_THETA);
          question.items = items;
          return {
            text: t('q_angle', { n: N_WATER, one: 1 }),
            ...choicesOf(items, kind, (x) => `${N(x.v)}°`),
          };
        }
        return { text: t('q_image'), ...choicesOf(words(['c_im_right', 'c_im_same', 'c_im_lower', 'c_im_air']), kind, (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        s.revealed = true;
        syncScene();
        syncLabels();
        stage.invalidate();
        if (k === 'hidden') return t('why_hidden') + note({ c_hd_dark: 'mis_hd_dark', c_hd_bend: 'mis_hd_bend', c_hd_eye: 'mis_hd_eye' });
        if (k === 'bend') return t('why_bend') + note({ c_bd_toward: 'mis_bd_toward', c_bd_none: 'mis_bd_none', c_bd_back: 'mis_bd_back' });
        if (k === 'angle') {
          const r = question.items[0].v;
          const sv = (N_WATER * Math.sin(rad(QUIZ_THETA))).toFixed(2);
          return (
            t('why_angle', { r, n: N_WATER, a: QUIZ_THETA, one: 1, s: sv }) +
            note({ divided: 'mis_an_divided', same: 'mis_an_same', surface: 'mis_an_surface' })
          );
        }
        // the answer: the line back and the raised coin appear
        s.v.back = 1;
        s.v.ghost = 1;
        syncScene();
        stage.invalidate();
        return t('why_image') + note({ c_im_same: 'mis_im_same', c_im_lower: 'mis_im_lower', c_im_air: 'mis_im_air' });
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
    note.hidden = s.v.cut < 0.6 || s.mode === 'quiz';
  }
  /** The step just finished, once more: from the step before it, played as the first time. */
  function replay() {
    if (s.busy || s.step === 'intro' || s.mode !== 'explore') return;
    const step = s.step;
    go(ORDER[ORDER.indexOf(step) - 1], { animate: false });
    go(step);
  }
  function goHome() {
    s.level = LEVEL.full;
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
    else if (k === 'ArrowRight' && !onButton) {
      if (s.step !== 'image') doAction();
    } else if (k === 'ArrowLeft' && !onButton) go(ORDER[Math.max(1, ORDER.indexOf(s.step) - 1)]);
    else if ((k === 'ArrowUp' || k === 'ArrowDown') && !onButton) {
      if (!canDrag()) return;
      levelHandle.markUsed();
      setLevel(s.v.level + (k === 'ArrowUp' ? 0.2 : -0.2));
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
  // the parts of later steps are hidden at first: compile their shaders ahead, so the first tap freezes nothing
  stage.warmUp({ show: [jug.root, jug.stream, ghost.root, water.root] });
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
    /** Change any of: step ('intro' | 'hidden' | 'pour' | 'angles' | 'image'), water (cm of water, 0 … 5.4, from the pour
     * on), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step) await go(p.step, { animate });
      if (p.water != null && ORDER.indexOf(s.step) >= ORDER.indexOf('pour') && !s.busy) setLevel(CUP.base + Number(p.water));
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
    /** The view with its drawing on it, cover-fitted to the size asked for (background: null keeps it transparent). */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      stage.render();
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const ctx = /** @type {CanvasRenderingContext2D} */ (out.getContext('2d'));
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
      return out.toDataURL('image/png');
    },
    /** The cup (both halves, whole), the coin and, if poured, the water, in centimetres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'CoinInCup';
      const c = cup.root.clone(true);
      c.traverse((ob) => {
        ob.visible = true;
        if (ob.name === 'CupCutFace' || ob.name === 'CupCutEdge') ob.userData.noExport = true;
      });
      g.add(c, coin.root.clone(true));
      if (s.v.level > CUP.base + 0.05) g.add(water.root.clone(true));
      return g;
    },
  };
}
