// The electric field (book pages 283–286, topic 10.5), student view. A polished metal sphere on an insulating stand on a
// plain bench in a calm blue space, a small test charge q₀ on its own stand beside it. Six steps, one tap each, slow:
// ① the sphere is charged + and its field lines grow out in every direction (light gold, outlined, arrowheads), q₀ is
// pushed outward (an outlined teal arrow F); ② q₀ is brought to half the distance: E four times (the E–r graph in the
// panel, 1/r²); ③ the charge made −: the lines draw in from all round, F reversed; ④ a second sphere, −q: the lines of +q
// end on −q (চিত্র ১০.১২ a); ⑤ both +: the lines bend apart and q₀ in the middle feels nothing, E = 0 (চিত্র ১০.১২ b);
// ⑥ −2q and +q: twice the lines on −2q (চিত্র ১০.১৩). The lines are traced from the real field (E = kq/r², added as
// vectors) in 3D; "সমতলে দেখো" shows the book's flat cut (the lines in one plane only). q₀ can be dragged where it means
// something (one charge; between the like pair, to find E = 0). A calm card on the first screen, then per step one
// lead-in line, the result and the rule in the book's words; a five-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS, svg } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { backdrop, CHARGE_COLORS, createApparatus, createMark, createSetting, createSheet } from './apparatus.js';
import { boldArrow } from './arrows.js';
import { fitPose } from './camera.js';
import { CONFIGS, fieldOfOne, fieldOnAxis, forceMicro, GAP, groupDigits, H, R, RANGE, roundField, XA, XB } from './field.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { createFieldLines, headMaterial } from './lines.js';

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

export const STEPS = ['pos', 'near', 'neg', 'unlike', 'like', 'double'];
const COLORS = { force: '#0ca678', forceText: '#087f5b', ink: '#1d2733', zero: '#7048e8', curve: '#b08900', ghost: '#c92a2a' };
const ARROW_R = 0.0011; // m: the force arrow's shaft, thickened to a few pixels by thick()
const PER_E = 0.0035 / 1000; // m of arrow per N/C: the largest in a pair (11,250 N/C) still clears −q
const DOUBLE_TAP = 420; // ms
const SNAP = 0.005; // m: q₀ stops every half centimetre
const MARGIN = { top: 52, bottom: 12, side: 30 }; // the side room keeps the lines' ends clear of the panel's tab
const B_AWAY = 0.36; // where the second sphere comes in from (x, m)
/** How long things take (s): slow enough to follow. */
const T = { charge: 0.5, grow: 2.4, retract: 0.8, move: 2.2, slide: 2.6, force: 0.7, fly: 1.6, flat: 1.4 };
/**
 * Each step: the configuration of lines, the charges on A and B (in q), whether B stands in, where q₀ is (x, m) and
 * whether it shows, the camera's framing (0: one charge, 1: the pair), and the lines grown (1) or not.
 */
const TARGET = {
  intro: { cfg: 'single', rev: false, aQ: 0, bQ: 0, bOn: 0, testX: XA + RANGE.start, testOn: 1, cam: 0, lines: 0, force: 0 },
  pos: { cfg: 'single', rev: false, aQ: 1, bQ: 0, bOn: 0, testX: XA + RANGE.start, testOn: 1, cam: 0, lines: 1, force: 1 },
  near: { cfg: 'single', rev: false, aQ: 1, bQ: 0, bOn: 0, testX: XA + RANGE.near, testOn: 1, cam: 0, lines: 1, force: 1 },
  neg: { cfg: 'single', rev: true, aQ: -1, bQ: 0, bOn: 0, testX: XA + RANGE.neg, testOn: 1, cam: 0, lines: 1, force: 1 },
  unlike: { cfg: 'unlike', rev: false, aQ: 1, bQ: -1, bOn: 1, testX: 0, testOn: 1, cam: 1, lines: 1, force: 1 },
  like: { cfg: 'like', rev: false, aQ: 1, bQ: 1, bOn: 1, testX: 0, testOn: 1, cam: 1, lines: 1, force: 1 },
  double: { cfg: 'double', rev: false, aQ: -2, bQ: 1, bOn: 1, testX: 0, testOn: 0, cam: 1, lines: 1, force: 0 },
};
const ORDER = ['intro', ...STEPS];
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const FLAT_ICON = svg('<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M8 12h8M12 8v8"/>');
const ROUND_ICON = svg('<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c-3 2.5-3 13.5 0 16M12 4c3 2.5 3 13.5 0 16"/>');

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const G = (n) => N(groupDigits(n, t.lang)); // a field value with commas, in the page's digits

  root.classList.add('pvc', 'efl');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'flat', label: 'act_flat', icon: FLAT_ICON },
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
  lead.className = 'efl-lead';
  $('.pvc-act-row').before(lead);
  // the reading and the graph, between the result and the rule (as coulombs-law); the book's worked example only in a tall panel
  const box = document.createElement('div');
  box.className = 'efl-box';
  box.innerHTML = '<p class="efl-read"><span class="efl-val"></span><span class="efl-f"></span></p><div class="efl-graph"></div>';
  $('.pvc-outcome').after(box);
  const bookEl = document.createElement('p');
  bookEl.className = 'efl-book';
  bookEl.innerHTML = t('book_example', { q: 5, r: 10, e: '4.5 × 10', p: 8 });
  ui.learn.append(bookEl);
  const readEl = /** @type {HTMLElement} */ (box.querySelector('.efl-val'));
  const forceEl = /** @type {HTMLElement} */ (box.querySelector('.efl-f'));
  const graph = createGraph(/** @type {HTMLElement} */ (box.querySelector('.efl-graph')), {
    t,
    N,
    colors: { curve: COLORS.curve, dot: COLORS.force, ghost: COLORS.ghost, zero: COLORS.zero },
  });
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 20, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.1);
  sun.position.set(0.5, 1.6, 0.9);
  sun.target.position.set(0, 0.05, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55);
  fill.position.set(-1.4, 0.7, 1.2);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.003;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -0.42, right: 0.42, top: 0.3, bottom: -0.3, near: 1.2, far: 2.6 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const setting = createSetting();
  const app = createApparatus();
  const sheetPlane = createSheet();
  scene.add(setting.root, app.a.root, app.b.root, app.test.root, sheetPlane.root);
  app.a.root.position.x = XA;
  app.b.root.position.x = B_AWAY;
  app.b.root.visible = false;
  // the faint mark of a question ("moved here"), a ring of the test charge's size
  const ghost = createMark();
  scene.add(ghost);

  // the field lines of every configuration, made at load (hidden), so no step builds or compiles anything new
  const heads = headMaterial();
  /** @type {Record<string, { full: ReturnType<typeof createFieldLines>, flat: ReturnType<typeof createFieldLines> }>} */
  const LINES = {};
  for (const name of Object.keys(CONFIGS)) {
    LINES[name] = { full: createFieldLines(name, { headMaterial: heads }), flat: createFieldLines(name, { flat: true, headMaterial: heads }) };
    for (const l of [LINES[name].full, LINES[name].flat]) scene.add(l.mesh, l.heads);
  }

  // the force on q₀: one outlined teal arrow (F = Eq, along E for a positive q₀)
  const force = boldArrow('ForceOnTestCharge', COLORS.force, ARROW_R, { order: 40 });
  scene.add(force.root);

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
    /** what is drawn now: the lines' set, and the charges */
    cfg: 'single',
    rev: false,
    aQ: 0,
    bQ: 0,
    /** values that glide: lines grown (0…1 of the set's longest line), B in place, q₀'s x and size, the camera's framing, the force arrow, the flat sheet */
    v: { grow: 0, bOn: 0, testX: XA + RANGE.start, testOn: 1, cam: 0, force: 0, flat: 0 },
    flat: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    dragging: false,
    moved: false,
    /** set by a question: hide what it asks about */
    quiz: { hideA: false, hideLabels: false, ghostX: null, ghostText: '', q0Text: '' },
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the physics of what is drawn ─────────────────────────────────────────────
  /** The charges standing now (x, q in units of q). */
  function charges() {
    const list = [];
    if (s.aQ) list.push({ x: XA, q: s.aQ });
    if (s.bQ && s.v.bOn > 0.999) list.push({ x: XB, q: s.bQ });
    return list;
  }
  /** E on the axis at q₀ (N/C, + to the right), as the panel shows it (rounded to 3 figures). */
  const fieldAtTest = () => roundField(fieldOnAxis(charges(), s.v.testX));
  const testR = () => s.v.testX - XA; // m, from the left sphere's centre
  const single = () => s.cfg === 'single';

  // ── the scene from the state ────────────────────────────────────────────────
  /** A 3D view under 260 px tall: fewer words on it, and the tight framing. */
  const low = () => stage.height < 260;
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  const thick = () => Math.min(3.4, Math.max(1, (2.6 * perPixel()) / ARROW_R));
  const P0 = V(0, 0, 0);
  const DIR = V(1, 0, 0);
  function syncScene() {
    const v = s.v;
    // the spheres
    app.a.setCharge(s.aQ, { hidden: s.quiz.hideA });
    app.b.setCharge(s.bQ);
    app.b.root.visible = v.bOn > 0.001;
    app.b.root.position.x = B_AWAY + (XB - B_AWAY) * v.bOn;
    // q₀
    app.test.root.visible = v.testOn > 0.01;
    app.test.root.position.x = v.testX;
    app.test.root.scale.setScalar(Math.max(0.01, v.testOn));
    for (const st of [app.a, app.b, app.test]) st.faceCamera(camera);
    // the lines: only the set in use
    for (const [name, set] of Object.entries(LINES)) {
      for (const [kind, l] of Object.entries(set)) {
        const on = name === s.cfg && (kind === 'flat') === s.flat;
        l.set(on ? v.grow * l.maxLength : 0, s.rev);
      }
    }
    sheetPlane.setOpacity(v.flat);
    // the force on q₀
    const e = fieldOnAxis(charges(), v.testX);
    const len = Math.abs(e) * PER_E * v.force;
    force.root.visible = v.testOn > 0.99 && len > 0.002;
    if (force.root.visible) {
      DIR.set(Math.sign(e), 0, 0);
      P0.set(v.testX + Math.sign(e) * (app.test.r + 0.002), H, 0);
      force.set(P0, DIR, len);
      force.scale(thick());
    }
    ghost.visible = s.quiz.ghostX != null;
    if (ghost.visible) {
      ghost.position.set(s.quiz.ghostX, H, 0);
      ghost.quaternion.copy(camera.quaternion);
      ghost.scale.setScalar(app.test.r * 1.3);
    }
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const A0 = { x: 0, y: 0 };
  const A1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  const arrowBox = () => {
    if (!force.root.visible) return null;
    toScreen(force.root.position, A0);
    toScreen(force.tip, A1);
    return { left: Math.min(A0.x, A1.x) - 6, top: Math.min(A0.y, A1.y) - 6, right: Math.max(A0.x, A1.x) + 6, bottom: Math.max(A0.y, A1.y) + 6 };
  };
  const ballBox = (st) => () => {
    if (!st.root.visible) return null;
    st.ball.getWorldPosition(tmp);
    toScreen(tmp, A0);
    const r = st.r / perPixel();
    return { left: A0.x - r, top: A0.y - r, right: A0.x + r, bottom: A0.y + r };
  };
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  /** @type {ReturnType<typeof createDragHandle> | null} */
  let handle = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      arrowBox,
      ballBox(app.a),
      ballBox(app.b),
      ballBox(app.test),
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotateEl),
      () => boxOf($('.pvc-panel-toggle')),
      () => handle?.box(),
    ],
  });
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const spot = (dx, dy) => ({ dx, dy });
  const ABOVE = [spot(0, -30), spot(-26, -30), spot(26, -30), spot(0, -44), spot(-46, -34), spot(46, -34), spot(0, -60), spot(-52, 6), spot(52, 6)];
  const ABOVE_LEFT = [spot(-30, -26), spot(-34, -8), spot(0, -34), spot(-30, -44), spot(-58, -26), spot(-54, 12), spot(0, -62), spot(30, -46)];
  const ABOVE_RIGHT = [spot(30, -26), spot(34, -8), spot(0, -34), spot(30, -44), spot(-30, -44), spot(58, -26), spot(0, -62), spot(50, 24)];
  const BELOW = [spot(0, 24), spot(-20, 26), spot(20, 26)];
  const chargeText = (q) => (q === -2 ? t('lbl_neg2') : q > 0 ? t('lbl_pos') : t('lbl_neg'));
  const top = (st) => {
    const p = V(0, 0, 0);
    return () => st.ball.getWorldPosition(p).setY(H + st.r * 0.75 * st.root.scale.y);
  };
  const LABELS = {
    a: {
      text: () => (s.quiz.hideA ? t('lbl_hidden') : chargeText(s.aQ)),
      point: top(app.a),
      color: () => (s.quiz.hideA ? COLORS.ink : s.aQ > 0 ? CHARGE_COLORS.pos : CHARGE_COLORS.neg),
      spots: ABOVE_LEFT,
      show: () => (s.aQ !== 0 || s.quiz.hideA) && !s.quiz.hideLabels && !s.quiz.q0Text, // the long label of the 1/r² question needs the room
    },
    b: {
      text: () => chargeText(s.bQ),
      point: top(app.b),
      color: () => (s.bQ > 0 ? CHARGE_COLORS.pos : CHARGE_COLORS.neg),
      spots: ABOVE_RIGHT,
      show: () => s.bQ !== 0 && s.v.bOn > 0.99 && !s.quiz.hideLabels,
    },
    q0: {
      text: () => s.quiz.q0Text || t('lbl_q0'),
      point: top(app.test),
      color: () => CHARGE_COLORS.pos,
      spots: [spot(-28, -36), ...ABOVE, ...BELOW], // up and to the left first: the ring's badge likes the right
      show: () => s.v.testOn > 0.99 && !(zeroHere() && s.v.force > 0.5),
    },
    F: {
      text: () => t(s.step === 'pos' && !low() ? 'lbl_F_eq' : 'lbl_F'),
      point: () => forceMid.lerpVectors(force.root.position, force.tip, 0.5),
      color: () => COLORS.forceText,
      spots: [spot(0, 24), spot(16, 26), spot(-16, 26), spot(0, -24), spot(-16, -26), spot(16, -26)],
      show: () => force.root.visible && s.v.force > 0.9,
    },
    ghost: {
      text: () => s.quiz.ghostText,
      point: () => forceMid.set(s.quiz.ghostX ?? 0, H + app.test.r * 1.3, 0),
      color: () => COLORS.ink,
      spots: [...BELOW, ...ABOVE],
      show: () => s.quiz.ghostX != null && Boolean(s.quiz.ghostText),
    },
    zero: {
      text: () => t('lbl_zero', { z: 0 }),
      point: top(app.test),
      color: () => COLORS.zero,
      spots: [...ABOVE, ...BELOW],
      show: () => s.v.testOn > 0.99 && s.v.force > 0.5 && zeroHere(),
    },
  };
  function zeroHere() {
    return !single() && s.v.bOn > 0.999 && fieldAtTest() === 0;
  }
  const shownText = new Map();
  const forceMid = V(0, 0, 0);
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      if (!want) {
        if (anno.has(id)) anno.remove(id);
        shownText.delete(id);
        continue;
      }
      const text = L.text();
      const color = L.color();
      if (!anno.has(id)) {
        anno.add(id, { text, point: L.point, kind: 'force', color, spots: L.spots });
        shownText.set(id, `${text}|${color}`);
      } else if (shownText.get(id) !== `${text}|${color}`) {
        anno.update(id, { text, color });
        shownText.set(id, `${text}|${color}`);
      }
    }
  }

  // ── camera: a gentle three-quarter view; it widens for the pair ──────────────
  const boxes = {
    // a short phone embed: only the working region, or q₀ is a speck
    low: {
      single: new THREE.Box3(V(XA - 0.05, 0.1, -0.02), V(XA + 0.165, H + 0.07, 0.02)),
      pair: new THREE.Box3(V(-0.115, 0.1, -0.02), V(0.115, H + 0.07, 0.02)),
    },
    wide: {
      single: new THREE.Box3(V(XA - 0.135, 0.035, -0.05), V(XA + 0.165, H + 0.115, 0.05)),
      pair: new THREE.Box3(V(-0.21, 0.035, -0.05), V(0.21, H + 0.11, 0.05)),
    },
    // a phone held upright: the spheres and q₀ as big as they go; the lines may run off the edges
    tall: {
      single: new THREE.Box3(V(XA - 0.07, 0.03, -0.03), V(XA + 0.165, H + 0.09, 0.03)),
      pair: new THREE.Box3(V(-0.125, 0.03, -0.03), V(0.125, H + 0.09, 0.03)),
    },
  };
  const DIRS = { round: V(0.42, 0.34, 1).normalize(), flat: V(0.2, 0.14, 1).normalize() };
  const poses = { single: null, pair: null };
  function fitPoses() {
    const d = (s.flat ? DIRS.flat : DIRS.round).clone();
    if (s.view === '3d' && !s.userMovedCamera) d.add(V(0.6, 0.15, 0)).normalize();
    const tall = root.classList.contains('efl-stack');
    app.test.setSize(tall ? 1.3 : 1); // upright, q₀ is drawn larger: a speck can't carry the idea
    const margin = tall ? { ...MARGIN, side: 8 } : MARGIN;
    const args = { dir: d, camera, width: stage.width, height: stage.height, margin };
    for (const k of ['single', 'pair']) {
      const p = fitPose({ box: boxes[tall ? (low() ? 'low' : 'tall') : 'wide'][k], ...args });
      poses[k] = { target: p.target, dist: p.position.distanceTo(p.target), dir: d };
    }
  }
  const guided = { position: V(0, 0, 0), target: V(0, 0, 0) };
  function guidedPose() {
    const f = s.v.cam;
    const { single: a, pair: b } = poses;
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
  /** The guided camera takes the view back, flying from wherever it is. */
  function fly(duration = T.fly) {
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    if (!duration) {
      camK = 1;
      stage.invalidate();
      return Promise.resolve(true);
    }
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
      },
    }).finished;
  }
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
    return fly(duration);
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
    zoom: [0.5, 2.0],
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
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      return fly(animate ? T.fly : 0);
    }
    const p = takeView(animate ? T.fly : 0);
    emitChange();
    return p;
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
  });
  // the panel under the 3D (a phone held upright) or beside it: the figure's portrait rules apply only under it
  const panelEl = /** @type {HTMLElement} */ ($('.pvc-panel'));
  function syncLayout() {
    const stack = panelEl.getBoundingClientRect().top > root.getBoundingClientRect().top + 20;
    root.classList.toggle('efl-stack', stack);
    root.classList.toggle('efl-low', low());
  }
  stage.onResize(() => {
    syncLayout();
    fitPoses();
    syncScene();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  /** Glides some of the values to where they go, together, over `duration` seconds. */
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
          refreshReading();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    s.busy = false;
  }
  /** The charges and the set of lines of a step, at once. */
  function setDiscrete(goal) {
    s.cfg = goal.cfg;
    s.rev = goal.rev;
    s.aQ = goal.aQ;
    s.bQ = goal.bQ;
  }
  async function go(step, { animate = true } = {}) {
    if (!(step in TARGET)) return;
    const goal = TARGET[step];
    stopAll();
    const my = s.run;
    s.step = step;
    clearQuizMarks();
    hintOff();
    if (s.mode !== 'quiz') takeView(animate ? T.fly : 0);
    if (!animate) {
      setDiscrete(goal);
      Object.assign(s.v, {
        grow: goal.lines,
        bOn: goal.bOn,
        testX: goal.testX,
        testOn: goal.testOn,
        cam: goal.cam,
        force: goal.force,
      });
      s.moved = false;
      done();
      return;
    }
    s.busy = true;
    s.moved = false;
    refresh();
    emitChange();
    audio.tick?.();
    const changes = goal.cfg !== s.cfg || goal.rev !== s.rev || goal.aQ !== s.aQ || goal.bQ !== s.bQ;
    // 1. the old lines draw back (and the force arrow goes)
    if (changes && s.v.grow > 0) {
      if (!(await tweenTo({ grow: 0, force: 0 }, T.retract, my))) return;
    } else if (changes && s.v.force > 0) {
      if (!(await tweenTo({ force: 0 }, T.force * 0.6, my))) return;
    }
    // 2. the new charges (their colour and sign)
    if (changes) {
      setDiscrete(goal);
      syncScene();
      syncLabels();
      stage.invalidate();
      if (!(await tweenTo({}, T.charge, my))) return;
    }
    // 3. things move: q₀, the second sphere, the camera
    const move = {};
    for (const k of ['bOn', 'testX', 'testOn', 'cam']) if (Math.abs(goal[k] - s.v[k]) > 1e-6) move[k] = goal[k];
    if (Object.keys(move).length) {
      const long = 'testX' in move && single() && !changes;
      if (!(await tweenTo(move, long ? T.slide : T.move, my))) return;
    }
    // 4. the lines grow along the field
    if (goal.lines && s.v.grow < 1) {
      if (!(await tweenTo({ grow: 1 }, T.grow, my))) return;
    }
    // 5. the force on q₀
    if (goal.force !== s.v.force) {
      if (!(await tweenTo({ force: goal.force }, T.force, my))) return;
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
  }

  // ── the flat (book) view and back ────────────────────────────────────────────
  async function setFlat(flat, { animate = true } = {}) {
    if (flat === s.flat) return;
    const my = ++s.run; // a step that was playing stops where it is
    tweener.cancel('step');
    const grown = TARGET[s.step].lines > 0 && s.v.grow > 0;
    if (!animate) {
      s.flat = flat;
      s.v.flat = flat ? 1 : 0;
      fitPoses();
      camK = 1;
      done();
      return;
    }
    s.busy = true;
    refresh();
    if (grown && !(await tweenTo({ grow: 0 }, T.retract * 0.7, my))) return;
    s.flat = flat;
    fitPoses();
    if (!s.userMovedCamera) fly(T.fly);
    if (!(await tweenTo({ flat: flat ? 1 : 0 }, 0.6, my))) return;
    if (grown && !(await tweenTo({ grow: 1 }, T.flat, my))) return;
    s.busy = false;
    done();
  }

  // ── q₀ moved by hand ─────────────────────────────────────────────────────────
  /** Where q₀ may go now, or null (it stays put). */
  function testRange() {
    if (s.mode === 'quiz' || s.busy || s.v.testOn < 0.99) return null;
    if (s.step === 'neg') return { min: XA + RANGE.minNeg, max: XA + RANGE.max }; // the pull's arrow stays clear of the sphere
    if (s.step === 'pos' || s.step === 'near') return { min: XA + RANGE.min, max: XA + RANGE.max };
    if (s.step === 'like') return GAP;
    return null;
  }
  function setTestX(x) {
    const r = testRange();
    if (!r) return;
    // half-centimetre steps: the r and the E on the panel are of the same place, and E = 0 can really be reached
    const on = Math.round((x - XA) / SNAP) * SNAP + XA;
    const nx = Math.min(r.max, Math.max(r.min, on));
    if (Math.abs(nx - s.v.testX) < 1e-6) return;
    s.v.testX = nx;
    s.moved = true;
    syncScene();
    syncLabels();
    refresh();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_pos', 1, ICONS.hand],
    pos: ['act_near', 2, ICONS.hand],
    near: ['act_neg', 3, ICONS.hand],
    neg: ['act_unlike', 4, ICONS.hand],
    unlike: ['act_like', 5, ICONS.hand],
    like: ['act_double', 6, ICONS.hand],
    double: ['act_quiz', '', ICONS.chevR],
  };
  const NEXT = { intro: 'pos', pos: 'near', near: 'neg', neg: 'unlike', unlike: 'like', like: 'double' };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const flatBtn = /** @type {HTMLButtonElement} */ ($('[data-act="flat"]'));
  const steady = { lead: '', act: '', flat: null, read: '', force: '' };
  let flatUsed = false;
  function nearVars() {
    const r1 = RANGE.start * 100;
    const r2 = RANGE.near * 100;
    return { r1, r2, e1: G(fieldOfOne(RANGE.start)), e2: G(fieldOfOne(RANGE.near)), k: 4 };
  }
  function refreshReading() {
    if (s.mode === 'quiz') return;
    let html;
    if (!charges().length) html = t('read_none', { z: 0 });
    else if (single()) {
      html = t('read_single', { r: Math.round(testR() * 1000) / 10, e: G(Math.abs(fieldAtTest())) });
    } else if (s.v.testOn > 0.99) {
      const e = fieldAtTest();
      html = t('read_pair', { e: G(Math.abs(e)) });
    } else html = t('read_pair_none');
    if (steady.read !== html) {
      steady.read = html;
      readEl.innerHTML = html;
    }
    // F = q₀E, from the E just shown
    const f = charges().length && s.v.testOn > 0.99 ? forceMicro(fieldAtTest()) : null;
    const fHtml = f == null ? '' : f ? t('read_f', { f, ten: 10, p: 6 }) : t('read_f0', { z: 0 });
    if (steady.force !== fHtml) {
      steady.force = fHtml;
      forceEl.innerHTML = fHtml;
    }
    drawGraph();
  }
  const noteText = t('graph_note', { q: 4, q0: 1, ten: 10, p: 9 });
  function drawGraph() {
    const busy = s.busy;
    const testOn = s.v.testOn > 0.99;
    if (single()) {
      const ghost = s.step === 'near' && !busy && !s.moved ? { x: RANGE.start * 100, label: G(fieldOfOne(RANGE.start)) } : null;
      const charged = s.aQ !== 0;
      graph.draw({
        id: charged ? 'single' : 'none',
        note: charged ? noteText : '',
        curve: charged,
        f: (x) => fieldOfOne(x / 100),
        x0: 0,
        x1: 16,
        from: R * 100,
        to: 16,
        xTicks: [0, 4, 8, 12, 16],
        yTicks: [0, 4, 8, 12, 16],
        yMax: 16,
        xName: t('graph_r'),
        yName: t('graph_e'),
        wallName: t('graph_sphere'),
        walls: [{ from: 0, to: R * 100 }],
        dot: testOn && charged ? Math.round(testR() * 1000) / 10 : null,
        dotLabel: testOn && charged ? G(Math.abs(fieldAtTest())) : '',
        ghost,
        zero: null,
        aria: t('graph_aria'),
      });
      return;
    }
    const goal = TARGET[s.step];
    const ch = CONFIGS[s.cfg].charges;
    const yMax = { unlike: 24, like: 16, double: 40 }[s.cfg];
    const yTicks = { unlike: [0, 8, 16, 24], like: [0, 4, 8, 12, 16], double: [0, 10, 20, 30, 40] }[s.cfg];
    const span = (XB - XA) * 100;
    graph.draw({
      id: s.cfg,
      note: noteText,
      curve: true,
      tag: 'above',
      f: (x) => Math.abs(fieldOnAxis(ch, XA + x / 100)),
      x0: 0,
      x1: span,
      from: R * 100,
      to: span - R * 100,
      xTicks: [0, 4, 8, 12, 16],
      yTicks,
      yMax,
      xName: t('graph_x'),
      yName: t('graph_e'),
      wallName: t('graph_sphere'),
      walls: [
        { from: 0, to: R * 100 },
        { from: span - R * 100, to: span },
      ],
      dot: testOn && goal.testOn ? Math.round((s.v.testX - XA) * 1000) / 10 : null,
      dotLabel: testOn && goal.testOn ? G(Math.abs(fieldAtTest())) : '',
      ghost: null,
      zero: s.cfg === 'like' ? span / 2 : null,
      aria: t('graph_aria'),
    });
  }
  /** The result, always true of where q₀ stands now. */
  function outcomeText(vars) {
    if (s.step === 'near' && s.moved) return t('out_near_moved', { r: Math.round(testR() * 1000) / 10, e: G(Math.abs(fieldAtTest())) });
    if (s.step === 'like' && fieldAtTest() !== 0) return t('out_like_off', { e: G(Math.abs(fieldAtTest())), z: 0 });
    return t(`out_${s.step}`, vars);
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm
      ? `<span class="efl-long">${t('intro')}</span><span class="efl-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('efl-calm', calm);
    }
    const vars = { ...nearVars(), z: 0 };
    sheet.outcome(calm || s.busy ? '' : outcomeText(vars));
    sheet.rule(calm || s.busy ? '' : t(`rule_${s.step}`, vars));
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
      if (step !== '' && enabled && s.mode === 'explore' && o.coach && !s.dragging) action.show('scene');
      else action.hide('scene');
    }
    homeBtn.hidden = calm;
    homeBtn.disabled = s.busy;
    if (steady.flat !== s.flat) {
      steady.flat = s.flat;
      const label = t(s.flat ? 'act_round' : 'act_flat');
      flatBtn.innerHTML = `${s.flat ? ROUND_ICON : FLAT_ICON}<span>${t(s.flat ? 'act_round_short' : 'act_flat_short')}</span>`;
      flatBtn.setAttribute('aria-label', label);
      flatBtn.title = label;
      flatBtn.setAttribute('aria-pressed', String(s.flat));
    }
    flatBtn.disabled = s.busy || calm;
    flatBtn.classList.toggle('efl-hey', Boolean(o.coach) && !flatUsed && !s.busy && !calm);
    syncLabels();
    refreshReading();
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the part, a tap on the part ───────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    if (NEXT[s.step]) return go(NEXT[s.step]);
    return quiz.start();
  }
  const aim = V(0, 0, 0);
  /** What the next tap acts on: the sphere to charge, q₀ to bring closer, where the second sphere will stand. */
  function actTarget() {
    if (s.busy || s.dragging || s.mode === 'quiz') return null;
    if (s.step === 'pos') return aim.set(s.v.testX, H, 0);
    if (s.step === 'neg') return aim.set(XB, H, 0);
    if (s.step === 'unlike') return aim.set(XB, H, 0);
    if (s.step === 'double') return null;
    return aim.set(XA, H, 0);
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_pos',
    icon: ICONS.hand,
    target: () => actTarget(),
    radius: 26,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), () => boxOf(rotateEl), arrowBox, ballBox(app.test)],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // q₀'s handle: a white disc on its stand, along the line through the charges
  const handleY = () => (low() ? 0.118 : 0.085);
  const handlePoint = V(0, 0, 0);
  handle = createDragHandle(stage, {
    point: () => handlePoint.set(s.v.testX, handleY(), 0.01),
    axis: 'x',
    direction: V(1, 0, 0),
    track: {
      from: () => V((testRange() ?? { min: s.v.testX }).min, handleY(), 0.01),
      to: () => V((testRange() ?? { max: s.v.testX }).max, handleY(), 0.01),
    },
    label: o.coach ? t('drag_me') : '',
    aria: t('aria_drag'),
    pulse: Boolean(o.coach),
    when: () => testRange() != null,
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitPoint = V(0, 0, 0);
  const dragPlane = new THREE.Plane();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function rayAt(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  /** The x on the line of the charges under a finger: in a plane through that line, facing the camera. */
  function axisX(p) {
    rayAt(p);
    tmp.copy(camera.position).sub(V(camera.position.x, H, 0));
    if (tmp.lengthSq() < 1e-8) tmp.set(0, 0, 1);
    dragPlane.setFromNormalAndCoplanarPoint(tmp.normalize(), V(0, H, 0));
    return raycaster.ray.intersectPlane(dragPlane, hitPoint) ? hitPoint.x : null;
  }
  function pick(p) {
    if (handle?.hit(p.x, p.y)) return 'test';
    rayAt(p);
    if (app.test.root.visible && raycaster.intersectObject(app.test.hit, false).length) return 'test';
    if (raycaster.intersectObject(app.a.hit, false).length) return 'sphere';
    if (app.b.root.visible && raycaster.intersectObject(app.b.hit, false).length) return 'sphere';
    return null;
  }
  function inRing(p) {
    const b = action?.ringBox();
    return Boolean(b) && p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom;
  }
  let down = null;
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const p = canvasPoint(e);
      const what = pick(p);
      down = { x: e.clientX, y: e.clientY, at: now(), what };
      if (!what) return;
      if (what === 'test' && testRange()) {
        const x = axisX(p);
        drag = { id: e.pointerId, grab: s.v.testX - (x ?? s.v.testX) };
        s.dragging = true;
        handle?.markUsed();
        capturePointer(ui.canvasHost, e.pointerId);
        emit('dragstart', { what: 'test' });
        refresh();
      }
      e.stopPropagation();
      e.preventDefault();
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      const x = axisX(canvasPoint(e));
      if (x != null) setTestX(x + drag.grab);
      return;
    }
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const p = canvasPoint(e);
    const what = pick(p);
    ui.canvasHost.style.cursor = what === 'test' && testRange() ? 'grab' : what === 'sphere' && actTarget() ? 'pointer' : '';
  });
  function endDrag(e) {
    const tap = down && e && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && now() - down.at < 600;
    const what = down?.what;
    down = null;
    if (drag && (!e || e.pointerId === drag.id)) {
      releasePointer(ui.canvasHost, drag.id);
      drag = null;
      s.dragging = false;
      emit('dragend', { what: 'test' });
      refresh();
      emitChange();
    }
    // a tap on a sphere, or anywhere in the ring (q₀, or the empty place where the second sphere will stand), is the action
    if (tap && e?.type === 'pointerup' && actTarget() && (what === 'sphere' || inRing(canvasPoint(e)))) doAction();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── how to use, in the panel: the rotate pill, the সামনে button, q₀'s handle ──
  createHowTo(
    ui,
    t,
    [{ kind: 'orbit', cue: rotate }, { kind: 'front' }, { kind: 'drag', axis: 'x', text: t('howto_drag'), handle, when: () => testRange() != null }],
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
    const e = s.v.testOn > 0.99 && charges().length ? fieldAtTest() : null;
    return {
      step: s.step,
      config: s.cfg,
      charges: charges().map((c) => c.q),
      lines: Math.round(s.v.grow * 100) / 100,
      lineCount: LINES[s.cfg][s.flat ? 'flat' : 'full'].count,
      flat: s.flat,
      testX: Math.round(s.v.testX * 1000) / 10, // cm, from the middle of the bench
      r: single() ? Math.round(testR() * 1000) / 10 : null, // cm, from the charge's centre
      E: e, // N/C at q₀, + to the right
      busy: s.busy,
      next: NEXT[s.step] ?? 'quiz',
      view: s.view,
      mode: s.mode,
      question: s.mode === 'quiz' && question ? { kind: question.kind, right: question.right } : null,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.flat, snap.testX]);
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
  /** Four answers (the right one first in `items`), shuffled; the quiz scores by index. */
  function choicesOf(items, label) {
    const list = shuffle([...items]);
    question.right = list.indexOf(items[0]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="efl-opt">${label(list[j])}</span>`,
    };
  }
  function clearQuizMarks() {
    s.quiz.hideA = false;
    s.quiz.hideLabels = false;
    s.quiz.ghostX = null;
    s.quiz.ghostText = '';
    s.quiz.q0Text = '';
  }
  let learnSaved = null;
  let flatSaved = false;
  let question = null;
  let picked = -1;
  /** The five questions: the hidden sign, 1/r², the zero between like charges, more lines, lines never cross. */
  const KINDS = ['sign', 'ratio', 'zero', 'more', 'cross'];
  const RATIO = { r1: 0.06, r2: 0.12 };
  const words = (keys) => keys.map((key) => ({ key }));

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
        learnSaved = s.step;
        flatSaved = s.flat;
        stopAll();
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        if (drag) endDrag(null);
        syncUI();
        takeView(T.fly);
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        clearQuizMarks();
        syncUI();
        setFlat(flatSaved, { animate: false });
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        // the whole test on the flat cut: lines that can be read, and counted
        await setFlat(true, { animate: false });
        const scene = { sign: 'neg', ratio: 'pos', zero: 'like', more: 'double', cross: 'unlike' }[kind];
        await go(scene, { animate: false });
        clearQuizMarks();
        if (kind === 'sign') {
          // the field's direction only through the force: no lines, the sphere's charge hidden
          s.quiz.hideA = true;
          s.v.grow = 0;
          s.v.testX = XA + 0.08;
        } else if (kind === 'ratio') {
          s.v.testX = XA + RATIO.r1;
          s.quiz.ghostX = XA + RATIO.r2;
          s.quiz.ghostText = t('lbl_at', { r: RATIO.r2 * 100 });
          s.quiz.q0Text = t('lbl_at_e', { r: RATIO.r1 * 100, e: G(fieldOfOne(RATIO.r1)) });
          s.v.force = 0; // the arrow would run over the mark
        } else if (kind === 'zero') {
          s.v.testOn = 0;
          s.v.force = 0;
        } else if (kind === 'more') {
          s.quiz.hideLabels = true;
        }
        syncScene();
        syncLabels();
        stage.invalidate();
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        question = { kind };
        if (kind === 'sign')
          return { text: t('q_sign'), ...choicesOf(words(['c_sign_neg', 'c_sign_pos', 'c_sign_none', 'c_sign_any']), (x) => t(x.key)) };
        if (kind === 'ratio') {
          const e1 = fieldOfOne(RATIO.r1);
          const vals = [e1 / 4, e1 / 2, e1, e1 * 2].map((v) => ({ key: String(v), v }));
          vals[1].key = 'half';
          vals[2].key = 'same';
          vals[3].key = 'more';
          question.vars = { e1: G(e1), e2: G(e1 / 4), k: 4 };
          return { text: t('q_ratio'), ...choicesOf(vals, (x) => `${G(x.v)}&nbsp;N/C`) };
        }
        if (kind === 'zero')
          return { text: t('q_zero'), ...choicesOf(words(['c_zero_mid', 'c_zero_ball', 'c_zero_quarter', 'c_zero_none']), (x) => t(x.key)) };
        if (kind === 'more')
          return { text: t('q_more'), ...choicesOf(words(['c_more_left', 'c_more_right', 'c_more_same', 'c_more_cant']), (x) => t(x.key)) };
        return { text: t('q_cross'), ...choicesOf(words(['c_cross_no', 'c_cross_mid', 'c_cross_near', 'c_cross_loop']), (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map, vars) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], vars)}` : '');
        if (k === 'sign') {
          // show what was hidden
          s.quiz.hideA = false;
          s.v.grow = 1;
          syncScene();
          syncLabels();
          stage.invalidate();
          return t('why_sign') + note({ c_sign_pos: 'mis_sign_pos', c_sign_none: 'mis_sign_none', c_sign_any: 'mis_sign_any' });
        }
        if (k === 'ratio') return t('why_ratio', question.vars) + note({ half: 'mis_ratio_half', same: 'mis_ratio_same', more: 'mis_ratio_more' });
        if (k === 'zero') {
          s.v.testOn = 1;
          s.v.force = 1;
          s.v.testX = 0;
          syncScene();
          syncLabels();
          stage.invalidate();
          return (
            t('why_zero', { z: 0 }) +
            note({ c_zero_ball: 'mis_zero_ball', c_zero_quarter: 'mis_zero_quarter', c_zero_none: 'mis_zero_none' }, { z: 0, fig: '10.12' })
          );
        }
        if (k === 'more') {
          s.quiz.hideLabels = false;
          syncLabels();
          stage.invalidate();
          return t('why_more') + note({ c_more_right: 'mis_more_right', c_more_same: 'mis_more_same', c_more_cant: 'mis_more_cant' });
        }
        return t('why_cross') + note({ c_cross_mid: 'mis_cross_mid', c_cross_near: 'mis_cross_near', c_cross_loop: 'mis_cross_loop' });
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
  async function goHome() {
    if (s.flat) await setFlat(false, { animate: false });
    handle?.rearm();
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
    else if (b.dataset.act === 'flat') {
      if (s.busy || s.step === 'intro') return;
      const flat = !s.flat;
      flatUsed = true;
      setFlat(flat);
      showHint(t(flat ? 'hint_flat' : 'hint_round'), { duration: 3200 });
    } else if (b.dataset.act === 'q-next') quiz.next();
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
    const arrows = k === 'ArrowRight' || k === 'ArrowLeft';
    const sceneKey = ['r', 'R', 'Home', 'p', 'P'].includes(k) || arrows || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (arrows && !onButton) {
      const dir = k === 'ArrowRight' ? 1 : -1;
      if (testRange()) {
        handle?.markUsed();
        setTestX(s.v.testX + dir * SNAP);
      } else if (dir > 0 && NEXT[s.step]) doAction();
      else if (dir < 0) go(ORDER[Math.max(1, ORDER.indexOf(s.step) - 1)]);
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'p' || k === 'P') {
      if (!s.busy && s.step !== 'intro') {
        flatUsed = true;
        setFlat(!s.flat);
      }
    } else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncLayout();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(syncLayout).observe(root);
  fitPoses();
  syncUI();
  applyCamera();
  syncScene();
  refresh();
  // the arrowheads and force arrow of later steps: compiled ahead (one shader for every set of lines)
  stage.warmUp?.({ show: [LINES.double.full.mesh, LINES.double.full.heads, force.root, app.b.root, ghost, sheetPlane.root] });
  const ready = (async () => {
    if (o.view === '3d') setView('3d', { animate: false });
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
     * Change any of: step ('intro' | 'pos' | 'near' | 'neg' | 'unlike' | 'like' | 'double'), flat (true: the book's plane),
     * r (cm from the charge, one charge) or x (cm from the middle, the like pair): where q₀ is; view ('front' | '3d').
     * animate: false lands at once.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step) await go(p.step, { animate });
      if (p.flat != null) await setFlat(Boolean(p.flat), { animate });
      if (p.r != null && single()) setTestX(XA + p.r / 100);
      if (p.x != null) setTestX(p.x / 100);
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
    /** The spheres on their stands, q₀ and the field lines of the step shown, fully grown, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'ElectricField';
      for (const st of [app.a, app.b, app.test]) {
        if (!st.root.visible) continue;
        const c = st.root.clone(true);
        c.scale.setScalar(1);
        g.add(c);
      }
      if (!charges().length) return g; // the first screen: no charge, so no lines
      const set = LINES[s.cfg][s.flat ? 'flat' : 'full'];
      const geo = new THREE.BufferGeometry();
      for (const k of ['position', 'normal', 'color']) geo.setAttribute(k, set.mesh.geometry.getAttribute(k));
      geo.setIndex(set.mesh.geometry.getIndex());
      const lines = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'FieldLine', vertexColors: true, roughness: 0.45 }));
      lines.name = 'FieldLines';
      g.add(lines);
      return g;
    },
  };
}
