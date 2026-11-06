// Coulomb's law (book pages 279–281, topic 10.4), student view. Two polished metal spheres on insulating (acrylic)
// stands stand over a metre rule on a plain bench in a calm blue setting. A charge is the sphere's colour and always
// its sign. Five steps, one tap each, slow: ① charge them (+1 C and −1 C, 10 cm apart, the book's চিত্র ১০.১০ a): two
// equal, opposite teal arrows pull them together (আকর্ষণ); ② the right one turns positive: the arrows turn round
// (বিকর্ষণ); ③ twice the distance: the right sphere slides to 20 cm and the arrows shrink to a quarter, a ghost of
// the old arrow stays, and the panel's F–r graph shows the 1/r² curve with both points; ④ the law: back to the book's
// example (F = −9 × 10¹¹ N, worked out live), the charges can be changed and the sphere dragged; ⑤ the book's
// example (b): +9 C and +16 C 1 m apart, a third charge +q between them that the student drags until the two pushes
// on it balance, at x = 0.43 m (the graph of the net force crosses zero there). A calm first card; per step a lead-in
// line, the result and the rule; the kit's how-to row and drag handles; a five-question test.
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
import { CHARGE_COLORS, createApparatus, H, R_BIG, R_SMALL } from './apparatus.js';
import { boldArrow } from './arrows.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import {
  balanceX,
  choicesFor,
  clamp,
  coulomb,
  EX_A,
  EX_B,
  forcesOnQ,
  kindOf,
  Q_RANGE,
  R_RANGE,
  round,
  STEPS,
  sci,
  shuffle,
  X_RANGE,
} from './reading.js';
import { backdrop, createSetting, RULE } from './setting.js';

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

/** One colour per meaning: the force (teal, outlined), its words in the panel (a darker teal), ink. */
const COLORS = { force: '#0ca678', forceText: '#087f5b', ink: '#1d2733', ghost: '#0ca678' };
const ARROW_R = 0.002; // the arrows' shaft (m), thickened to a few pixels by thick()
const PAIR_Y = H + R_BIG + 0.032; // the pair's arrows run over the spheres, as in the book's চিত্র ১০.১০ (a)
const THIRD_Y = H + R_SMALL + 0.03;
const GHOST_UP = 0.014; // the ghost of step ③ runs a little over the arrow now, so both show
/** Arrow length (m) per newton: the pair's (9 × 10¹¹ N is 10 cm) and the third charge's (its balance, 4.4 × 10¹¹ N, is 12 cm). */
const SCALE = { pair: 0.1 / 9e11, third: 0.12 / forcesOnQ(balanceX()).f1 };
const MAX_LEN = { pair: 0.3, third: 0.3 };
const X0 = balanceX(); // 0.4286 m: the book's x = 0.43
const SNAP = 0.012; // m: the third charge lands on the balance when this close
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 14, side: 10 };
// how long things take (s): slow enough to follow
const T = { grow: 1.5, shrink: 0.8, slide: 2.2, fly: 1.6, back: 1.6, third: 1.2, find: 2.4, jump: 1.2 };
/** What each step shows: the charges (C), the distance (m), the third charge (shown, where), the camera's frame. */
const TARGET = {
  intro: { q1: 0, q2: 0, r: 0.1, third: 0, xq: 0.2, frame: 'pair' },
  attract: { q1: 1, q2: -1, r: 0.1, third: 0, xq: 0.2, frame: 'pair' },
  repel: { q1: 1, q2: 1, r: 0.1, third: 0, xq: 0.2, frame: 'pair' },
  distance: { q1: 1, q2: 1, r: 0.2, third: 0, xq: 0.2, frame: 'distance' },
  law: { q1: EX_A.q1, q2: EX_A.q2, r: EX_A.r, third: 0, xq: 0.2, frame: 'law' },
  balance: { q1: EX_B.qa, q2: EX_B.qb, r: EX_B.d, third: 1, xq: 0.2, frame: 'balance' },
};
const ORDER = ['intro', ...STEPS];
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const RIGHT = V(1, 0, 0);
const LEFT = V(-1, 0, 0);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'cl');
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
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the line before the action: what the next tap will show (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'cl-lead';
  $('.pvc-act-row').before(lead);
  // the graph box, between the result and the rule: the values (and, in the law's step, the charges' steppers) over the graph
  const box = document.createElement('div');
  box.className = 'cl-graphbox';
  const sub = (s, i) => `${s}<sub>${N(i)}</sub>`;
  const stepper = (i) =>
    `<span class="cl-q" data-q-of="${i}"><span class="cl-q-name">${sub('q', i)}</span><button type="button" class="cl-step" data-qstep="${i}:-1" aria-label="${t('q_minus', { q: `q${i}` })}">${ICONS.minus || '−'}</button><b class="cl-q-val"></b><button type="button" class="cl-step" data-qstep="${i}:1" aria-label="${t('q_plus', { q: `q${i}` })}">${ICONS.plus || '+'}</button></span>`;
  // the charges' steppers: a row over the graph in the law's step (the graph gives up that height then)
  box.innerHTML = `<div class="cl-steppers" role="group" aria-label="${t('vals_q')}" hidden>${stepper(1)}${stepper(2)}</div><div class="cl-graph"></div>`;
  $('.pvc-outcome').after(box);
  const steppers = /** @type {HTMLElement} */ (box.querySelector('.cl-steppers'));
  const graph = createGraph(/** @type {HTMLElement} */ (box.querySelector('.cl-graph')), {
    t,
    N,
    colors: { force: COLORS.force, text: COLORS.forceText },
  });
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // a short note on the view: the arrows are drawn to scale
  const note = document.createElement('div');
  note.className = 'cl-note';
  note.hidden = true;
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 30, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.1);
  sun.position.set(0.6, 1.5, 0.9);
  sun.target.position.set(0.5, 0, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55);
  fill.position.set(-1.2, 0.7, 1.4);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.003;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -0.7, right: 0.7, top: 0.3, bottom: -0.3, near: 0.8, far: 2.6 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const setting = createSetting(stage.renderer, N);
  const app3 = createApparatus();
  const { one, two, third } = app3;
  third.setCharge(1);
  scene.add(setting.root, one.root, two.root, third.root);

  // ── the arrows: the force on each sphere of the pair, a ghost of the first one, the two forces on the third charge ──
  const arrow1 = boldArrow('ForceOnOne', COLORS.force, ARROW_R);
  const arrow2 = boldArrow('ForceOnTwo', COLORS.force, ARROW_R);
  const ghost = boldArrow('ForceBefore', COLORS.ghost, ARROW_R, { order: 20 });
  ghost.setOpacity(0.32);
  const arrowF1 = boldArrow('ForceFromNine', COLORS.force, ARROW_R);
  const arrowF2 = boldArrow('ForceFromSixteen', COLORS.force, ARROW_R);
  for (const a of [arrow1, arrow2, ghost, arrowF1, arrowF2]) scene.add(a.root);

  // ── the dimension lines in front of the rule: r for the pair; x and 1 − x for the third charge ──
  const dimMat = new THREE.MeshBasicMaterial({ name: 'DimensionInk', color: COLORS.ink });
  const dimZ = RULE.z + RULE.width / 2 + 0.014;
  function makeDim(name) {
    const g = new THREE.Group();
    g.name = name;
    g.userData.noExport = true;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.0012, 0.0022), dimMat);
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.0012, 0.016), dimMat);
    const b = a.clone();
    g.add(bar, a, b);
    g.visible = false;
    scene.add(g);
    return {
      g,
      set(x0, x1) {
        const len = Math.max(1e-4, x1 - x0);
        bar.scale.x = len;
        bar.position.set((x0 + x1) / 2, 0.0006, dimZ);
        a.position.set(x0, 0.0006, dimZ);
        b.position.set(x1, 0.0006, dimZ);
      },
    };
  }
  const dimR = makeDim('DimR');
  const dimX = makeDim('DimX');
  const dimRest = makeDim('DimRest');

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
    q1: 0,
    q2: 0,
    r: 0.1,
    xq: 0.2,
    third: 0, // 0 … 1: the third charge coming in
    arrowK: 0, // 0 … 1: the arrows growing in
    ghostK: 0, // the ghost of the first arrow (step ③)
    frame: 'pair',
    found: false, // the third charge has been put where it feels no force
    moved: false, // the student dragged or changed something in this step
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    dragging: false,
    run: 0,
    userMovedCamera: false,
    quizKind: '',
    quizValues: false, // the test shows the force's value on the arrows
    from: /** @type {string | null} */ (null), // the step before, while the next one plays
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the scene from the state ────────────────────────────────────────────────
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  const thick = () => Math.min(3, Math.max(1, (2.4 * perPixel()) / ARROW_R));
  const pairF = () => coulomb(s.q1, s.q2, s.r);
  const lenOf = (F, kind) => Math.min(MAX_LEN[kind], Math.abs(F) * SCALE[kind]);
  const clamped = { on: false };
  const P0 = V(0, 0, 0);
  function syncScene() {
    const k = thick();
    one.setX(0);
    two.setX(s.r);
    third.setX(s.xq);
    one.setCharge(s.q1);
    two.setCharge(s.q2);
    third.root.visible = s.third > 0.01;
    third.root.scale.setScalar(Math.max(0.01, s.third));
    for (const st of [one, two, third]) st.faceCamera(camera);
    clamped.on = false;
    // the pair: equal and opposite, over the spheres; pulling in, the head ends over the sphere (the book's picture);
    // pushing apart, the tail starts over it
    const F = pairF();
    const pairOn = s.third < 0.5 && s.arrowK > 0.001 && F !== 0;
    const L = lenOf(F, 'pair') * s.arrowK;
    if (pairOn && Math.abs(F) * SCALE.pair > MAX_LEN.pair) clamped.on = true;
    for (const [a, x, sign] of [
      [arrow1, 0, 1],
      [arrow2, s.r, -1],
    ]) {
      a.root.visible = pairOn && L > 1e-4;
      if (!a.root.visible) continue;
      // the force on this sphere points toward the other (attraction) or away from it (repulsion)
      const dir = (F < 0 ? sign : -sign) > 0 ? RIGHT : LEFT;
      if (F < 0) P0.set(x - dir.x * L, PAIR_Y, 0);
      else P0.set(x, PAIR_Y, 0);
      a.set(P0, dir, L);
      a.scale(k);
    }
    // the ghost: the first sphere's arrow as it was at 10 cm, faint, just over the arrow now
    const Lg = lenOf(coulomb(1, 1, 0.1), 'pair') * s.ghostK;
    ghost.root.visible = pairOn && s.ghostK > 0.01 && Lg > 1e-4;
    if (ghost.root.visible) {
      const dirG = F < 0 ? RIGHT : LEFT;
      if (F < 0) P0.set(-Lg, PAIR_Y + GHOST_UP, 0);
      else P0.set(0, PAIR_Y + GHOST_UP, 0);
      ghost.set(P0, dirG, Lg);
      ghost.scale(k);
    }
    // the third charge: pushed right by +9 C (F₁) and left by +16 C (F₂), both from its top
    const f = forcesOnQ(s.xq);
    const thirdOn = s.third > 0.5 && s.arrowK > 0.001;
    for (const [a, F3, dir] of [
      [arrowF1, f.f1, RIGHT],
      [arrowF2, f.f2, LEFT],
    ]) {
      const len = lenOf(F3, 'third') * s.arrowK * s.third;
      if (thirdOn && Math.abs(F3) * SCALE.third > MAX_LEN.third) clamped.on = true;
      a.root.visible = thirdOn && len > 1e-4;
      if (!a.root.visible) continue;
      P0.set(s.xq, THIRD_Y, 0);
      a.set(P0, dir, len);
      a.scale(k);
    }
    // the dimensions
    const showR = s.third < 0.5 && s.step !== 'intro' && (s.step !== 'attract' && s.step !== 'repel' ? true : s.mode === 'quiz');
    dimR.g.visible = showR;
    if (showR) dimR.set(0, s.r);
    dimX.g.visible = s.third > 0.5;
    dimRest.g.visible = s.third > 0.5;
    if (s.third > 0.5) {
      dimX.set(0, s.xq);
      dimRest.set(s.xq, s.r);
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
  const arrowBox = (a) => {
    toScreen(a.root.position, A0);
    toScreen(a.tip, A1);
    return { left: Math.min(A0.x, A1.x) - 8, top: Math.min(A0.y, A1.y) - 8, right: Math.max(A0.x, A1.x) + 8, bottom: Math.max(A0.y, A1.y) + 8 };
  };
  const arrowBoxes = () => [arrow1, arrow2, arrowF1, arrowF2].filter((a) => a.root.visible).map(arrowBox);
  const sphereBox = (st) => {
    if (!st.root.visible) return null;
    st.sphere.getWorldPosition(tmp);
    toScreen(tmp, A0);
    const rp = (st.R * st.root.scale.x) / perPixel();
    return { left: A0.x - rp - 2, top: A0.y - rp - 2, right: A0.x + rp + 2, bottom: A0.y + rp + 2 };
  };
  const sphereBoxes = () => [one, two, third].map(sphereBox).filter(Boolean);
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  let twoHandle = null;
  let thirdHandle = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      ui.$('.pvc-panel-toggle'),
      arrowBoxes,
      sphereBoxes,
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotateEl),
      () => twoHandle?.box(),
      () => thirdHandle?.box(),
    ],
  });
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const spot = (dx, dy) => ({ dx, dy });
  const BELOW = [spot(0, 26), spot(-24, 26), spot(24, 26), spot(0, 44)];
  const ABOVE = [spot(0, -18), spot(14, -24), spot(-14, -24), spot(0, -34)];
  const SIDE_L = [spot(-30, 6), spot(-34, 22), spot(-30, -12)];
  const SIDE_R = [spot(30, 6), spot(34, 22), spot(30, -12)];
  const LOW_L = [spot(-36, 30), spot(-40, 48)];
  const LOW_R = [spot(36, 30), spot(40, 48)];
  const qText = (q) => `${q > 0 ? '+' : q < 0 ? '−' : ''}${N(Math.abs(q))}&nbsp;C`;
  /** "a × 10ⁿ N" in the book's form (the power raised), with Bangla digits on a Bangla page. */
  function force(F, { unit = true, digits = 3 } = {}) {
    if (!F) return `${N(0)}${unit ? '&nbsp;N' : ''}`;
    const { m, e } = sci(F, digits);
    const mm = `${m < 0 ? '−' : ''}${N(Math.abs(m))}`;
    return `<span class="cl-sci">${mm}&nbsp;×&nbsp;${N(10)}<sup>${N(e)}</sup>${unit ? '&nbsp;N' : ''}</span>`;
  }
  const arrowMid = (a) => tmp.copy(a.root.position).add(a.tip).multiplyScalar(0.5).clone();
  /** Near an arrow's head (a little back from it), where its label goes: the label then names the arrow it points with. */
  const arrowHead = (a) => tmp.copy(a.root.position).lerp(a.tip, 0.8).clone();
  const LABELS = {
    q1: {
      text: () => (s.third > 0.5 ? qText(s.q1) : `${sub('q', 1)} = ${qText(s.q1)}`),
      point: () => V(0, H - R_BIG * 0.6, 0),
      color: () => (s.q1 > 0 ? CHARGE_COLORS.pos : CHARGE_COLORS.neg),
      spots: [...SIDE_L, ...LOW_L, ...BELOW],
      show: () => s.q1 !== 0 && !s.busyFlip,
    },
    q2: {
      text: () => (s.third > 0.5 ? qText(s.q2) : `${sub('q', 2)} = ${qText(s.q2)}`),
      point: () => V(s.r, H - R_BIG * 0.6, 0),
      color: () => (s.q2 > 0 ? CHARGE_COLORS.pos : CHARGE_COLORS.neg),
      spots: [...SIDE_R, ...LOW_R, ...LOW_L, ...BELOW],
      show: () => s.q2 !== 0 && !s.busyFlip,
    },
    q3: {
      text: () => t('lbl_q3'),
      point: () => V(s.xq, H - R_SMALL * 0.6, 0),
      color: () => CHARGE_COLORS.pos,
      spots: [...SIDE_R, ...SIDE_L, ...BELOW],
      show: () => s.third > 0.95,
    },
    F1: {
      text: () => (s.quizValues ? `F = ${force(Math.abs(pairF()), { digits: 3 })}` : t('lbl_F')),
      point: () => arrowMid(arrow1),
      color: () => COLORS.forceText,
      spots: ABOVE,
      show: () => arrow1.root.visible && s.arrowK > 0.9 && (!s.busy || s.dragging),
    },
    F2: {
      text: () => t('lbl_F'),
      point: () => arrowMid(arrow2),
      color: () => COLORS.forceText,
      spots: ABOVE,
      show: () => arrow2.root.visible && s.arrowK > 0.9 && (!s.busy || s.dragging) && !s.quizValues,
    },
    Fa: {
      text: () => sub('F', 1),
      point: () => arrowHead(arrowF1),
      color: () => COLORS.forceText,
      spots: [spot(0, -20), spot(16, -22), spot(26, -6), spot(0, 22)],
      show: () => arrowF1.root.visible && s.arrowK > 0.9 && s.third > 0.95,
    },
    Fb: {
      text: () => sub('F', 2),
      point: () => arrowHead(arrowF2),
      color: () => COLORS.forceText,
      spots: [spot(0, -20), spot(-16, -22), spot(-26, -6), spot(0, 22)],
      show: () => arrowF2.root.visible && s.arrowK > 0.9 && s.third > 0.95,
    },
    r: {
      text: () => t('lbl_r', { r: round(s.r * 100, 0) }),
      point: () => V(s.r / 2, 0, dimZ + 0.006),
      color: () => COLORS.ink,
      spots: BELOW,
      show: () => dimR.g.visible,
    },
    x: {
      text: () => t('lbl_x', { x: s.xq.toFixed(2) }),
      point: () => V(s.xq / 2, 0, dimZ + 0.006),
      color: () => COLORS.ink,
      spots: BELOW,
      show: () => dimX.g.visible && s.third > 0.95,
    },
    rest: {
      text: () => t('lbl_rest'),
      point: () => V((s.xq + s.r) / 2, 0, dimZ + 0.006),
      color: () => COLORS.ink,
      spots: BELOW,
      optional: true,
      show: () => dimRest.g.visible && s.third > 0.95,
    },
  };
  const shownText = new Map();
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
        anno.add(id, { text, point: L.point, kind: 'force', color, spots: L.spots, optional: L.optional });
        shownText.set(id, `${text}|${color}`);
      } else if (shownText.get(id) !== `${text}|${color}`) {
        anno.update(id, { text, color });
        shownText.set(id, `${text}|${color}`);
      }
    }
  }

  // ── camera: a gentle three-quarter view, framed per step ─────────────────────
  const FRAMES = {
    pair: new THREE.Box3(V(-0.13, 0, -0.04), V(0.23, PAIR_Y + 0.03, 0.1)),
    distance: new THREE.Box3(V(-0.13, 0, -0.04), V(0.33, PAIR_Y + 0.03, 0.1)),
    law: new THREE.Box3(V(-0.14, 0, -0.04), V(0.52, PAIR_Y + 0.02, 0.1)),
    balance: new THREE.Box3(V(-0.05, 0, -0.04), V(1.05, THIRD_Y + 0.03, 0.1)),
  };
  const DIR = V(0.36, 0.38, 0.85).normalize();
  // the metre-long example (b) is seen more from the front, so its far end is not much smaller than its near one
  const DIR_LONG = V(0.16, 0.36, 0.92).normalize();
  const poses = {};
  function fitPoses() {
    for (const [id, b] of Object.entries(FRAMES)) {
      const p = fitPose({ box: b, dir: id === 'balance' ? DIR_LONG : DIR, camera, width: stage.width, height: stage.height, margin: MARGIN });
      poses[id] = p;
    }
  }
  let camK = 1;
  let camFrom = null;
  function applyCamera() {
    if (s.userMovedCamera) return;
    const g = poses[s.frame];
    if (!g) return;
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
  /** The guided camera flies to the frame `frame` (and takes the view back from the student). */
  function flyTo(frame, duration = T.fly) {
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
    const same = frame === s.frame && !was && camK >= 1;
    s.frame = frame;
    if (same) return Promise.resolve(true);
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
      // a little more from the side, so the depth shows
      s.view = '3d';
      s.userMovedCamera = true;
      tweener.cancel('camera');
      const g = poses[s.frame];
      const off = camera.position
        .clone()
        .sub(controls.target)
        .applyAxisAngle(V(0, 1, 0), 0.6);
      camera.position.copy(g.target).add(off);
      controls.target.copy(g.target);
      controls.update();
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p = flyTo(s.frame, animate ? T.fly : 0);
    emitChange();
    return p;
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
    syncNote();
    graphSync();
  });
  stage.onResize(() => {
    fitPoses();
    syncScene();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  /** Moves some of the numbers to where they go, together, over `duration` seconds; resolves true if it ran to the end. */
  function tweenTo(to, duration, my, easing = ease.inOutCubic) {
    const from = {};
    for (const k of Object.keys(to)) from[k] = s[k];
    return tweener
      .animate({
        key: 'step',
        duration,
        ease: easing,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const key of Object.keys(to)) s[key] = from[key] + (to[key] - from[key]) * k;
          syncLabels();
          refresh();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  const wait = (sec, my) => tweener.animate({ key: 'wait', duration: sec }).finished.then((ok) => ok && my === s.run);
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    tweener.cancel('wait');
    s.busy = false;
    s.busyFlip = false;
  }
  function setCharges(q1, q2) {
    s.q1 = q1;
    s.q2 = q2;
  }
  /** The plan from one step to the next, as a list of async moves; a jump is a generic one. */
  async function play(from, to, my) {
    const g = TARGET[to];
    if (from === 'intro' && to === 'attract') {
      setCharges(g.q1, g.q2);
      audio.pop?.();
      if (!(await wait(0.5, my))) return false;
      return tweenTo({ arrowK: 1 }, T.grow, my);
    }
    if (from === 'attract' && to === 'repel') {
      s.busyFlip = true;
      if (!(await tweenTo({ arrowK: 0 }, T.shrink, my))) return false;
      setCharges(g.q1, g.q2);
      audio.pop?.();
      s.busyFlip = false;
      if (!(await wait(0.4, my))) return false;
      return tweenTo({ arrowK: 1 }, T.grow, my);
    }
    if (from === 'repel' && to === 'distance') {
      const fly = flyTo(g.frame, T.fly);
      if (!(await tweenTo({ ghostK: 1 }, 0.6, my))) return false;
      await fly;
      if (my !== s.run) return false;
      return tweenTo({ r: g.r }, T.slide, my);
    }
    if (from === 'distance' && to === 'law') {
      const fly = flyTo(g.frame, T.fly);
      if (!(await tweenTo({ arrowK: 0, ghostK: 0 }, T.shrink, my))) return false;
      setCharges(g.q1, g.q2);
      audio.pop?.();
      if (!(await tweenTo({ r: g.r }, T.back, my))) return false;
      await fly;
      if (my !== s.run) return false;
      return tweenTo({ arrowK: 1 }, T.grow, my);
    }
    if (from === 'law' && to === 'balance') {
      if (!(await tweenTo({ arrowK: 0 }, T.shrink, my))) return false;
      setCharges(g.q1, g.q2);
      const fly = flyTo(g.frame, T.slide);
      if (!(await tweenTo({ r: g.r }, T.slide, my))) return false;
      await fly;
      if (my !== s.run) return false;
      s.xq = g.xq;
      if (!(await tweenTo({ third: 1 }, T.third, my, ease.outCubic))) return false;
      return tweenTo({ arrowK: 1 }, T.grow, my);
    }
    // a jump (a step word, back, several at once): the arrows out, everything to its place, the arrows in
    const fly = flyTo(g.frame, T.jump);
    if (s.arrowK > 0 && !(await tweenTo({ arrowK: 0 }, 0.4, my))) return false;
    setCharges(g.q1, g.q2);
    s.xq = g.xq;
    if (!(await tweenTo({ r: g.r, third: g.third, ghostK: to === 'distance' ? 1 : 0 }, T.jump, my))) return false;
    await fly;
    if (my !== s.run) return false;
    if (to === 'intro') return true;
    return tweenTo({ arrowK: 1 }, 0.8, my);
  }
  function landAt(step) {
    const g = TARGET[step];
    setCharges(g.q1, g.q2);
    s.r = g.r;
    s.xq = g.xq;
    s.third = g.third;
    s.arrowK = step === 'intro' ? 0 : 1;
    s.ghostK = step === 'distance' ? 1 : 0;
  }
  async function go(step, { animate = true } = {}) {
    if (!(step in TARGET)) return;
    const from = s.step;
    stopAll();
    const my = s.run;
    s.from = ORDER.indexOf(step) === ORDER.indexOf(from) + 1 ? from : null;
    s.step = step;
    s.found = false;
    s.moved = false;
    hintOff();
    cancelDrag();
    if (!animate || from === step) {
      flyTo(TARGET[step].frame, animate ? T.fly : 0);
      landAt(step);
      done();
      return;
    }
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    const ok = await play(from, step, my);
    if (!ok || my !== s.run) return;
    landAt(step);
    s.busy = false;
    audio.success?.();
    done();
  }
  function done() {
    syncScene();
    syncLabels();
    refresh();
    emitChange();
    stage.invalidate();
  }
  /** The third charge to where the forces balance (the action's demo in step ⑤). */
  async function showBalance() {
    stopAll();
    const my = s.run;
    s.busy = true;
    s.from = 'balance';
    refresh();
    const ok = await tweenTo({ xq: X0 }, T.find, my);
    if (!ok) return;
    s.busy = false;
    s.xq = X0;
    s.found = true;
    audio.success?.();
    done();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_charge', 1, ICONS.hand],
    attract: ['act_flip', 2, ICONS.hand],
    repel: ['act_far', 3, ICONS.hand],
    distance: ['act_law', 4, ICONS.hand],
    law: ['act_third', 5, ICONS.hand],
    balance: ['act_find', 6, ICONS.drag],
    found: ['act_quiz', '', ICONS.chevR],
  };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const steady = { lead: '', act: '', steppers: '', note: '' };
  /** The panel's numbers for the pair: F = k q₁q₂ / r² worked with the student's numbers. */
  function lawFormula() {
    const F = pairF();
    const k = `${N(9)}×${N(10)}<sup>${N(9)}</sup>`;
    const qv = (q) => (q < 0 ? `(−${N(-q)})` : `(${q > 0 ? '+' : ''}${N(q)})`);
    const top = `${k} × ${qv(s.q1)} × ${qv(s.q2)}`;
    const bot = `(${N(s.r.toFixed(2))})<sup>${N(2)}</sup>`;
    return `F = <span class="pvc-frac"><span>${top}</span><span>${bot}</span></span> N = <b>${force(F)}</b>`;
  }
  function outcomeHtml() {
    const st = s.step;
    // while a step plays, its question stays in view: what the student is watching for
    if (s.busy) return s.from && s.from !== 'intro' ? `<span class="cl-ask">${t(`lead_${s.from}`)}</span>` : '';
    if (st === 'intro') return '';
    if (st === 'attract') return t('out_attract', { q1: qText(s.q1), q2: qText(s.q2) });
    if (st === 'repel') return t('out_repel', { q: qText(s.q2) });
    if (st === 'distance') {
      if (!s.moved && Math.abs(s.r - 0.2) < 1e-6) return t('out_quarter', { r0: 10, r1: 20 });
      return t('out_live', { r: round(s.r * 100, 0), F: force(Math.abs(pairF())) });
    }
    if (st === 'law') return pairF() === 0 ? t('out_zero') : lawFormula();
    // the third charge
    if (s.found) return t('out_found', { x: X0.toFixed(2) });
    const net = forcesOnQ(s.xq).net;
    return t('out_far', { x: s.xq.toFixed(2), side: t(net > 0 ? 'out_side_r' : 'out_side_l') });
  }
  function ruleHtml() {
    const st = s.step;
    if (st === 'intro' || s.busy) return '';
    if (st === 'balance') return t(s.found ? 'rule_found' : 'rule_balance');
    if (st === 'law')
      return t('rule_law', {
        q1q2: `${sub('q', 1)}${sub('q', 2)}`,
        k: `${N(9)}&nbsp;×&nbsp;${N(10)}<sup>${N(9)}</sup>&nbsp;Nm<sup>${N(2)}</sup>/C<sup>${N(2)}</sup>`,
      });
    return t(`rule_${st}`);
  }
  /** The note on the view: the arrows are to scale (and say so when one is drawn shorter); in the law's step a wide view
   *  adds that the book's charges are far bigger than real ones. Run after syncScene, which knows whether one was cut. */
  function syncNote() {
    const arrows = s.arrowK > 0.01;
    const noteKey = s.step === 'intro' || s.step === 'attract' || s.step === 'repel' || !arrows ? '' : clamped.on ? 'note_clamp' : 'note_arrow';
    const noteHtml = noteKey ? `${t(noteKey)}${s.step === 'law' ? `<span class="cl-long"> · ${t('note_book')}</span>` : ''}` : '';
    if (steady.note !== noteHtml) {
      steady.note = noteHtml;
      note.innerHTML = noteHtml;
      note.hidden = !noteHtml;
    }
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step === 'balance' && s.found ? 'found' : s.step;
    const leadHtml = calm
      ? `<span class="cl-long">${t('intro')}</span><span class="cl-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : t(s.step === 'balance' && s.found ? 'lead_found' : `lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('cl-calm', calm);
    }
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    sheet.choose(calm ? null : s.step);
    const i = ORDER.indexOf(s.step);
    sheet.next(i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      const ringed = enabled && s.mode === 'explore' && ['intro', 'attract', 'repel', 'balance'].includes(ph);
      if (ringed) action.show('scene');
      else action.hide('scene');
    }
    homeBtn.hidden = calm;
    homeBtn.disabled = s.busy;
    const stepKey = `${s.step === 'law' && !s.busy}|${s.q1}|${s.q2}`;
    if (steady.steppers !== stepKey) {
      steady.steppers = stepKey;
      const on = s.step === 'law' && !s.busy;
      steppers.hidden = !on;
      for (const [q, el] of [
        [s.q1, box.querySelector('[data-q-of="1"] .cl-q-val')],
        [s.q2, box.querySelector('[data-q-of="2"] .cl-q-val')],
      ])
        el.innerHTML = qText(q);
      for (const b of box.querySelectorAll('[data-qstep]')) {
        const [which, d] = b.dataset.qstep.split(':').map(Number);
        const q = which === 1 ? s.q1 : s.q2;
        b.disabled = !on || q + d < Q_RANGE[0] || q + d > Q_RANGE[1];
      }
    }
    syncNote();
    syncLabels();
    stage.invalidate();
  }
  // the graph: empty until the distance changes; F against r for the pair; the net force on the third charge against x
  function graphArgs() {
    if (s.third > 0.5) return { kind: 'x', x: round(s.xq, 4), x0: X0, found: s.found, aria: t('g_aria_x', { x: s.xq.toFixed(2) }) };
    const shows = ['distance', 'law'].includes(s.step) || (s.mode === 'quiz' && s.quizKind === 'far');
    if (!shows) return { kind: 'empty', aria: t('g_aria_empty') };
    const prod = Math.abs(s.q1 * s.q2);
    const was = s.step === 'distance' && s.ghostK > 0.5 ? { r: 0.1, F: coulomb(1, 1, 0.1) } : null;
    return {
      kind: 'r',
      prod,
      r: round(s.r, 4),
      was,
      quarter: Boolean(was) && Math.abs(s.r - 0.2) < 1e-3,
      aria: t('g_aria_r', { r: round(s.r * 100, 0), F: Math.abs(pairF()).toExponential(2) }),
    };
  }
  function graphSync() {
    if (s.mode === 'quiz' && s.quizKind !== 'point') {
      // in the test the graph would give answers away: it shows only the empty axes
      graph.draw({ kind: 'empty', aria: t('g_aria_empty') });
      return;
    }
    graph.draw(graphArgs());
  }

  // ── the action: the big button, the ring on the spheres, a tap on them ───────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const i = ORDER.indexOf(s.step);
    if (s.step === 'balance') {
      if (s.found) return quiz.start();
      return showBalance();
    }
    return go(ORDER[i + 1]);
  }
  const pairBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_charge',
    icon: ICONS.hand,
    target: () => {
      if (s.step === 'intro') {
        pairBox.setFromObject(one.sphere).union(new THREE.Box3().setFromObject(two.sphere));
        return pairBox;
      }
      if (s.step === 'balance') return third.sphere;
      return two.sphere;
    },
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), note, arrowBoxes, () => boxOf(rotateEl)],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── dragging: the right sphere (steps ③ and ④), the third charge (step ⑤) ──
  const railPoint = (x) => V(x, 0.075, 0);
  twoHandle = createDragHandle(stage, {
    point: () => railPoint(s.r),
    axis: 'x',
    track: { from: () => railPoint(R_RANGE[0]), to: () => railPoint(R_RANGE[1]) },
    label: o.coach ? t('drag_two') : '',
    aria: t('aria_two'),
    pulse: Boolean(o.coach),
    when: () => !s.busy && s.mode === 'explore' && movable() === 'two',
  });
  thirdHandle = createDragHandle(stage, {
    point: () => railPoint(s.xq),
    axis: 'x',
    track: { from: () => railPoint(X_RANGE[0]), to: () => railPoint(X_RANGE[1]) },
    label: o.coach ? t('drag_third') : '',
    aria: t('aria_third'),
    pulse: Boolean(o.coach),
    when: () => !s.busy && s.mode === 'explore' && movable() === 'third',
  });
  /** What can be dragged now: 'two' | 'third' | null. */
  function movable() {
    if (s.locked || s.mode === 'quiz') return null;
    if (s.step === 'distance' || s.step === 'law') return 'two';
    if (s.step === 'balance' && s.third > 0.95) return 'third';
    return null;
  }
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane();
  const hitPoint = V(0, 0, 0);
  const camDir = V(0, 0, 0);
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function setRay(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  /** Where the pointer is along the line of the charges (m), on a plane through that line turned to the camera. */
  function alongX(p) {
    setRay(p);
    camera.getWorldDirection(camDir);
    camDir.x = 0;
    if (camDir.lengthSq() < 1e-6) camDir.set(0, 0, -1);
    camDir.normalize();
    plane.setFromNormalAndCoplanarPoint(camDir, V(0, H * 0.5, 0));
    return raycaster.ray.intersectPlane(plane, hitPoint) ? hitPoint.x : null;
  }
  function pickPart(p) {
    const m = movable();
    if (!m) return null;
    if (m === 'two' && twoHandle.hit(p.x, p.y)) return 'two';
    if (m === 'third' && thirdHandle.hit(p.x, p.y)) return 'third';
    setRay(p);
    const st = m === 'two' ? two : third;
    return raycaster.intersectObject(st.hit, false).length ? m : null;
  }
  function pickTap(p) {
    if (!['intro', 'attract', 'repel'].includes(s.step) && !(s.step === 'balance' && !s.found)) return false;
    setRay(p);
    const list = s.step === 'balance' ? [third.hit] : [one.hit, two.hit];
    return raycaster.intersectObjects(list, false).length > 0;
  }
  let drag = null;
  function moveTo(what, x) {
    if (what === 'two') {
      s.r = round(clamp(x, R_RANGE[0], R_RANGE[1]), 2);
    } else {
      let v = clamp(x, X_RANGE[0], X_RANGE[1]);
      if (Math.abs(v - X0) < SNAP) v = X0;
      else v = round(v, 2);
      s.xq = v;
      const was = s.found;
      s.found = Math.abs(v - X0) < 1e-9;
      if (s.found && !was) audio.success?.();
    }
    s.moved = true;
    refresh();
    syncLabels();
    emitChange();
    stage.invalidate();
  }
  function cancelDrag() {
    if (!drag) return;
    releasePointer(ui.canvasHost, drag.id);
    drag = null;
    s.dragging = false;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const p = canvasPoint(e);
      const what = s.busy ? null : pickPart(p);
      if (what) {
        const x = alongX(p);
        drag = { id: e.pointerId, what, grab: (what === 'two' ? s.r : s.xq) - (x ?? 0) };
        s.dragging = true;
        (what === 'two' ? twoHandle : thirdHandle).markUsed();
        action?.hide('drag');
        capturePointer(ui.canvasHost, e.pointerId);
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      if (pickTap(p)) {
        e.stopPropagation();
        e.preventDefault();
        doAction();
      }
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      const x = alongX(canvasPoint(e));
      if (x != null) moveTo(drag.what, x + drag.grab);
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = pickPart(p) ? 'ew-resize' : pickTap(p) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    });
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    releasePointer(ui.canvasHost, drag.id);
    drag = null;
    s.dragging = false;
    action?.show('drag');
    refresh();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── how to use, in the panel: the rotate pill, the সামনে button, the two drags ──
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'drag', axis: 'x', text: t('howto_two'), handle: twoHandle, when: () => movable() === 'two' },
      { kind: 'drag', axis: 'x', text: t('howto_third'), handle: thirdHandle, when: () => movable() === 'third' },
    ],
    // a drag that does not apply now is taken out (only one shows at a time, so the row keeps one line)
    { stage, collapse: true },
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
    const F = pairF();
    const f = forcesOnQ(s.xq);
    return {
      step: s.step,
      q1: s.q1,
      q2: s.q2,
      r: round(s.r, 4),
      F: s.third > 0.5 ? null : F,
      kind: s.third > 0.5 ? null : kindOf(s.q1, s.q2),
      x: s.third > 0.5 ? round(s.xq, 4) : null,
      net: s.third > 0.5 ? f.net : null,
      found: s.found,
      busy: s.busy,
      next: { intro: 'charge', attract: 'flip', repel: 'far', distance: 'law', law: 'third', balance: s.found ? 'quiz' : 'find' }[s.step],
      view: s.view,
      mode: s.mode,
      question: s.mode === 'quiz' && question ? { kind: question.kind, right: question.right ?? null } : null, // the place of the right choice
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.q1, snap.q2, snap.r, snap.x, snap.found]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the test ────────────────────────────────────────────────────────────────
  /** Five questions, each with its own scene: like charges, twice as far, three times the charge, F's sign, a balance point. */
  const KINDS = ['dir', 'far', 'charge', 'sign', 'point'];
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const words = (keys) => keys.map((key) => ({ key }));
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    if (question) question.right = list.indexOf(items[0]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="cl-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  /** A question's scene: everything set at once; the force's value on the arrow where the question reads it. */
  function quizScene({ q1, q2, r, arrows = true, values = false, third = 0, xq = 0.2, frame = 'law' }) {
    stopAll();
    cancelDrag();
    s.step = third ? 'balance' : 'law';
    setCharges(q1, q2);
    s.r = r;
    s.third = third;
    s.xq = xq;
    s.arrowK = arrows ? 1 : 0;
    s.ghostK = 0;
    s.found = false;
    s.quizValues = values;
    flyTo(frame, 0);
    done();
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
        learnSaved = s.step;
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        question = null;
        s.mode = 'explore';
        s.locked = false;
        s.quizKind = '';
        s.quizValues = false;
        syncUI();
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        s.quizKind = kind;
        question = { kind };
        if (kind === 'dir') quizScene({ q1: -1, q2: -1, r: 0.15, arrows: false });
        else if (kind === 'far') quizScene({ q1: 2, q2: 1, r: 0.15, values: true });
        else if (kind === 'charge') quizScene({ q1: 1, q2: -1, r: 0.2, values: true });
        else if (kind === 'sign') quizScene({ q1: 2, q2: -1, r: 0.2, arrows: false });
        else quizScene({ q1: 4, q2: 1, r: 0.9, arrows: false, frame: 'balance' });
        await tweener.animate({ key: 'qwait', duration: 0.3 }).finished;
        if (!alive()) return null;
        if (kind === 'dir')
          return { text: t('q_dir'), ...choicesOf(words(['c_dir_right', 'c_dir_attract', 'c_dir_none', 'c_dir_one']), kind, (x) => t(x.key)) };
        if (kind === 'sign') {
          const F = pairF();
          question.F = F;
          return {
            text: t('q_sign', { F: plain(F) }),
            ...choicesOf(words(['c_sign_right', 'c_sign_repel', 'c_sign_weak', 'c_sign_one']), kind, (x) => t(x.key)),
          };
        }
        if (kind === 'far' || kind === 'charge') {
          const F = Math.abs(pairF());
          return { text: t(`q_${kind}`), ...choicesOf(choicesFor(kind, F), kind, (x) => force(x.v)) };
        }
        return { text: t('q_point'), ...choicesOf(choicesFor('point'), kind, (x) => `${N(x.v.toFixed(2))}&nbsp;m`) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note2 = (prefix, vars) => (wrongKey && wrongKey !== 'right' ? ` ${t(`mis_${prefix}_${wrongKey.replace(/^c_\w+?_/, '')}`, vars)}` : '');
        const right = q.list?.find((x) => x.key === 'right' || /_right$/.test(x.key));
        if (k === 'dir') return t('why_dir') + note2('dir');
        if (k === 'sign') return t('why_sign') + note2('sign', { m: plain(Math.abs(question.F)) });
        if (k === 'far' || k === 'charge') return t(`why_${k}`, { v: force(right.v) }) + note2(k);
        return t('why_point', { v: `${N(right.v.toFixed(2))}&nbsp;m` }) + note2('point');
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });
  /** A force as plain text (the question is text, not HTML): "−4.5 × 10^11 N" written "−৪.৫ × ১০¹¹ N". */
  function plain(F) {
    const { m, e } = sci(F, 3);
    const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    const ee = String(e)
      .split('')
      .map((d) => (d === '-' ? '⁻' : SUP[Number(d)]))
      .join('');
    return `${m < 0 ? '−' : ''}${N(Math.abs(m))} × ${N(10)}${ee} N`;
  }

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
  function stepCharge(which, d) {
    if (s.step !== 'law' || s.busy || s.locked) return;
    const q = which === 1 ? s.q1 : s.q2;
    const v = clamp(q + d, Q_RANGE[0], Q_RANGE[1]);
    if (v === q) return;
    if (which === 1) s.q1 = v;
    else s.q2 = v;
    s.moved = true;
    audio.tick?.();
    refresh();
    emitChange();
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
    if (b.dataset.qstep) {
      const [which, d] = b.dataset.qstep.split(':').map(Number);
      stepCharge(which, d);
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
    const m = movable();
    if ((k === 'ArrowRight' || k === 'ArrowLeft') && m && !s.busy) {
      const d = k === 'ArrowRight' ? 1 : -1;
      if (m === 'two') {
        twoHandle.markUsed();
        moveTo('two', s.r + d * 0.01);
      } else {
        thirdHandle.markUsed();
        // the arrow keys step 1 cm; stepping across the balance stops on it
        const next = round(s.xq + d * 0.01, 2);
        const across = (s.xq - X0) * (next - X0) < 0;
        moveTo('third', across ? X0 : s.xq === X0 ? round(X0 + d * 0.01, 2) : next);
      }
    } else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowRight' && !onButton) {
      if (s.step !== 'balance') doAction();
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
  landAt('intro');
  applyCamera();
  syncScene();
  refresh();
  // the parts of later steps are compiled now (hidden), so the first tap draws without a freeze
  stage.warmUp({ show: [third.root, arrow1.root, arrow2.root, ghost.root, arrowF1.root, arrowF2.root, dimR.g, dimX.g, dimRest.g, two.sphere] });
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
    /** Change any of: step ('intro' | 'attract' | 'repel' | 'distance' | 'law' | 'balance'); then, in the law's step,
     *  q1, q2 (C, −2 … 2) and r (m, 0.1 … 0.4); in the last step x (m from +9 C, 0.15 … 0.85) or find: true (the third
     *  charge slides to where it feels no force); view ('front' | '3d').
     *  animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step) await go(p.step, { animate });
      if (s.step === 'law' || s.step === 'distance') {
        if (s.step === 'law' && p.q1 != null) s.q1 = clamp(Math.round(p.q1), Q_RANGE[0], Q_RANGE[1]);
        if (s.step === 'law' && p.q2 != null) s.q2 = clamp(Math.round(p.q2), Q_RANGE[0], Q_RANGE[1]);
        if (p.r != null) moveTo('two', p.r);
      }
      if (s.step === 'balance' && p.x != null) moveTo('third', p.x);
      if (p.find && s.step === 'balance' && !s.busy) {
        if (animate) await showBalance();
        else moveTo('third', X0);
      }
      refresh();
      emitChange();
      stage.invalidate();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await setView('front', { animate: false });
      await goHome();
      twoHandle.rearm();
      thirdHandle.rearm();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The two spheres on their stands and the metre rule, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'CoulombsLaw';
      for (const ob of [setting.rule, one.root, two.root]) {
        const c = ob.clone(true);
        c.traverse((x) => {
          x.visible = !x.userData.noExport;
        });
        g.add(c);
      }
      return g;
    },
  };
}
