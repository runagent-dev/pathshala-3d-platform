// Balanced and unbalanced forces (book pages 69–70, topic 3.3), student view. Two of the page's pictures, in 3D:
//   চিত্র ৩.০২: a 1 kg steel ball hangs on a 30 cm cord from the hook of a lab stand. The pull of the cord T (orange)
//     and the weight W (violet) are equal and opposite: the resultant is zero (সাম্যাবস্থা). The student pulls the ball
//     aside: a hand holds it and pulls too (light orange, at right angles to the cord), the three forces cancel. Let
//     go: the hand's pull is gone, T and W no longer cancel, their resultant (black) acts and the ball swings (real
//     time, the real swing for 30 cm; the forces stay correct throughout: T = mg cos θ + mLω²). Or, while it hangs
//     still, the student cuts the cord: T is gone, only W is left (the অসাম্য বল) and the ball falls with g onto the
//     bench (5 times slower, a mark every 0.04 s: the gaps grow; the view follows it down), where the bench's push
//     balances W again.
//   চিত্র ৩.০৩: a heavy book hangs from the middle of a rope whose ends two hands pull. T₁, T₂ and W add up to zero
//     at every angle; dragging the hands apart makes the pulls grow (T = W / 2 sin α) while the resultant stays zero.
// Every change takes one force away or adds one: the rest no longer cancel. The panel shows the state in the book's
// words and the forces added tip to tail (the chain closes when the resultant is zero). Then a short test. Built on the
// shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { ICONS, svg } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { COLORS, createBookRig, createHand, createPendulum } from './models.js';
import { drawSum } from './sum.js';
import {
  ALPHA,
  BALL_R,
  DROP,
  G,
  LENGTH,
  MASS,
  MAX_DEG,
  SLOW,
  amplitude,
  bookForces,
  deg,
  fallDistance,
  heldForces,
  pendulumForces,
  period,
  rad,
  releaseDirections,
  round,
  swingAdvance,
  weight,
} from './physics.js';

export const DEFAULTS = {
  scene: 'pendulum', // 'pendulum' (চিত্র ৩.০২) | 'book' (চিত্র ৩.০৩)
  hold: 0, // deg: start with the ball held aside this far (pictures)
  alpha: ALPHA.start, // deg: the rope's angle above the horizontal
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const K = 0.014; // m of arrow per N (the weight of 1 kg, 9.8 N, is 13.7 cm long)
const ARROW = { radius: 0.0052, head: 0.03, headRadius: 0.0135 };
const MARK_DT = 0.04; // s of the real fall between the marks it leaves
const CUT_AT = 0.5; // the panel's button cuts the cord half way down
const MIN_HOLD = 1.5; // deg: let go closer to the middle than this, it just hangs again
const DOUBLE_TAP = 400; // ms
const CHOICE = 0.12; // m: the test's four arrows
const BADGE = 0.028; // m past a choice's head: where its letter sits
const VIEW_DIRS = {
  front: new THREE.Vector3(0, 0.1, 1).normalize(),
  '3d': new THREE.Vector3(0.58, 0.32, 0.75).normalize(),
};
// what the front view must show (world m): the hook, the ball's whole swing with its arrows and the bench; while it
// falls the same height lower down (its weight arrow stays whole down to the bench); the book, its weight arrow and
// the hands' whole path
const FRAMES = {
  pendulum: { x0: -0.24, x1: 0.24, y0: -0.195, y1: 0.325 },
  fall: { x0: -0.24, x1: 0.24, y0: -0.36, y1: 0.16 },
  book: { x0: -0.31, x1: 0.31, y0: -0.43, y1: 0.31 },
};
const SCISSORS = svg('<circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M8.2 7.4 20 16.5M8.2 16.6 20 7.5"/>');
const APART = svg('<path d="M9 12H3M5.5 9.5 3 12l2.5 2.5M15 12h6M18.5 9.5 21 12l-2.5 2.5"/><path d="M12 6v12" stroke-dasharray="2 2"/>');
const CLOSER = svg('<path d="M3 12h6M6.5 9.5 9 12l-2.5 2.5M21 12h-6M17.5 9.5 15 12l2.5 2.5"/><path d="M12 6v12" stroke-dasharray="2 2"/>');

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const f1 = (x) => N(round(x, 1).toFixed(1)); // a force in a live readout: one decimal
  const plain = (x) => String(round(x, 1)); // in a sentence: no trailing zero

  root.classList.add('pvc', 'bf');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const chip = (id, fig) => `<button role="radio" data-scene="${id}"><b>${t(`chip_${id}`)}</b><small>${t('chip_fig', { n: fig })}</small></button>`;
  const ui = buildStudentShell(root, t, {
    learnAlign: 'start',
    learn: `
          <div class="bf-chips" role="radiogroup" aria-label="${t('scenes')}">${chip('pendulum', '3.02')}${chip('book', '3.03')}</div>
          <div class="bf-read">
            <svg class="bf-sum" role="img" aria-label="${t('sum_aria')}"></svg>
            <div class="bf-state"><b class="bf-word" aria-live="polite"></b><span class="bf-res"></span></div>
            <small class="bf-cap">${t('sum_caption')}</small>
          </div>
          <p class="bf-say"></p>
          <div class="pvc-learn-foot bf-acts">
            <button class="pvc-btn" data-act="a1"><i class="ic"></i><span></span></button>
            <button class="pvc-btn" data-act="a2"><i class="ic"></i><span></span></button>
          </div>`,
  });
  const note = document.createElement('div');
  note.className = 'bf-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 0.02, far: 40, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.4;
  controls.maxDistance = 6;
  controls.enablePan = false;
  const M = createMaterials(stage.renderer);
  const world = new THREE.Group();
  world.name = 'BalancedForces';
  scene.add(world);

  const pend = createPendulum({ materials: M });
  const rig = createBookRig({ materials: M });
  world.add(pend.root, rig.root);
  const holder = createHand({ materials: M, grip: 'ball' });
  const holderMount = new THREE.Group();
  holderMount.name = 'HoldingHand';
  holderMount.add(holder.root);
  holderMount.visible = false;
  pend.root.add(holderMount);

  // force arrows are drawn over everything (like a diagram on the picture): from the body's surface outwards, so they
  // never cover it, and over the bench while the ball falls
  const arrowMaterial = (color) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0,
      emissive: color,
      emissiveIntensity: 0.2,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
  const arrowOf = (color, name, size = ARROW) => {
    const a = createArrow({ color, name, material: arrowMaterial(color), ...size });
    a.root.traverse((m) => (m.renderOrder = 5));
    return a;
  };
  const arrows = {
    T: arrowOf(COLORS.pull, 'PullArrow'),
    T2: arrowOf(COLORS.pull, 'PullArrow2'),
    W: arrowOf(COLORS.weight, 'WeightArrow'),
    R: arrowOf(COLORS.resultant, 'ResultantArrow'),
    H: arrowOf(COLORS.hand, 'HandArrow'),
    P: arrowOf(COLORS.pull, 'BenchPushArrow'),
  };
  for (const a of Object.values(arrows)) world.add(a.root);
  // the test's four directions to choose from
  const cands = Array.from({ length: 4 }, (_, i) =>
    createArrow({ color: '#8a939e', name: `Choice${i}`, radius: 0.0042, head: 0.026, headRadius: 0.0115 }),
  );
  for (const a of cands) {
    a.root.userData.noExport = true;
    world.add(a.root);
  }
  // the marks a falling ball leaves every 0.04 s
  const markGeo = new THREE.SphereGeometry(0.0055, 12, 8);
  const markMat = new THREE.MeshBasicMaterial({ color: '#868e96' });
  const marks = new THREE.Group();
  marks.name = 'Marks';
  marks.userData.noExport = true;
  pend.root.add(marks);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.position.set(0.5, 2.2, 1.6);
    sun.target.position.set(0, -0.2, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -0.9, right: 0.9, top: 0.9, bottom: -0.9, near: 0.5, far: 5 });
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0005;
    scene.add(sun, sun.target);
    pend.table.receiveShadow = true;
    const casts = (obj) =>
      obj.traverse((m) => {
        if (m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false && m !== pend.table) m.castShadow = true;
      });
    casts(pend.root);
    // the book scene has no bench: a faint shadow of the book (not of the arms) on an invisible wall behind it
    for (const obj of rig.shadowCasters) casts(obj);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.08 }));
    wall.position.set(0, 0, -0.35);
    wall.receiveShadow = true;
    wall.userData.noExport = true;
    rig.root.add(wall);
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    scene: o.scene === 'book' ? 'book' : 'pendulum',
    // the ball: 'rest' | 'held' (a hand holds it aside) | 'swing' | 'fall' | 'landed'
    phase: 'rest',
    theta: 0, // rad
    omega: 0,
    carry: 0,
    mass: MASS, // kg (a test question may hang another ball or another book)
    cut: null, // { at: m below the hook, t: s of the real fall so far, y: m the ball has dropped, lying: 0…1, marks: n }
    alpha: clampAlpha(o.alpha),
    bookMoved: false, // the student has changed the rope's angle
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    // what the test shows: null in learn mode, else { forces: 'all' | 'none' | 'W', numbers, ask, cands, zero, pair }
    show: null,
    frozen: false, // the swing or the fall held still (a picture, a test question)
    userMovedCamera: false,
  };
  let token = 0; // bumped by anything that calls off what is pending (scene, test, reset)
  function clampAlpha(a) {
    const v = Number(a);
    return THREE.MathUtils.clamp(Number.isFinite(v) ? v : ALPHA.start, ALPHA.min, ALPHA.max);
  }
  const ballR = () => BALL_R * Math.cbrt(s.mass / MASS);

  // ── the forces now ──────────────────────────────────────────────────────────
  /** The forces acting now, in N ({ x, y }), and what they mean. */
  function forcesNow() {
    if (s.scene === 'book') {
      const f = bookForces(s.alpha, s.mass);
      return { kind: 'book', T1: f.T1, T2: f.T2, W: f.W, R: f.R, tension: f.tension, weight: f.weight, resultant: 0, balanced: true };
    }
    const w = weight(s.mass);
    if (s.phase === 'fall') return { kind: 'fall', W: { x: 0, y: -w }, R: { x: 0, y: -w }, weight: w, resultant: w, balanced: false };
    if (s.phase === 'landed') return { kind: 'landed', W: { x: 0, y: -w }, push: { x: 0, y: w }, weight: w, resultant: 0, balanced: true };
    if (s.phase === 'held') {
      const h = heldForces(s.theta, { m: s.mass });
      return { kind: 'held', T: h.T, W: h.W, H: h.H, tension: h.tension, weight: w, hand: h.hand, resultant: 0, balanced: true };
    }
    const f = pendulumForces(s.theta, s.phase === 'swing' ? s.omega : 0, { m: s.mass });
    const still = s.phase === 'rest';
    return {
      kind: s.phase,
      T: f.T,
      W: f.W,
      R: still ? { x: 0, y: 0 } : f.R,
      tension: f.tension,
      weight: w,
      resultant: still ? 0 : f.resultant,
      balanced: still,
    };
  }
  const stateOf = (f) => (f.balanced ? 'balanced' : 'unbalanced');

  // ── the pose of the 3D objects ──────────────────────────────────────────────
  const c = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const from = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  function ballCenter() {
    if (s.phase === 'fall' || s.phase === 'landed') return c.set(0, -s.cut.y, 0);
    return c.set(LENGTH * Math.sin(s.theta), LENGTH * (1 - Math.cos(s.theta)), 0);
  }
  function poseModels(f) {
    pend.root.visible = s.scene === 'pendulum';
    rig.root.visible = s.scene === 'book';
    if (s.scene === 'book') {
      rig.pose(s.alpha);
      return;
    }
    const r = ballR();
    pend.ball.scale.setScalar(r / BALL_R);
    const p = ballCenter();
    pend.pose({ x: p.x, y: p.y, r, cut: s.cut ? { at: s.cut.at, lying: s.cut.lying } : null });
    // the hand that holds the ball aside pinches it on the side it pulls to (at right angles to the cord)
    holderMount.visible = f.kind === 'held';
    if (holderMount.visible) {
      dir.set(f.H.x, f.H.y, 0).normalize();
      holderMount.position.copy(p).addScaledVector(dir, r);
      holderMount.quaternion.setFromUnitVectors(tmp.set(1, 0, 0), dir);
    }
  }

  /** Arrows for the forces now; hides those that do not act (or that a test question hides). */
  function poseArrows(f) {
    for (const a of [...Object.values(arrows), ...cands]) a.hide();
    const show = s.show;
    const want = (sym) => !show || show.forces === 'all' || show.forces.includes(sym);
    if (f.kind === 'book') {
      const k = rig.knot;
      if (want('T')) {
        arrows.T.set(k, v3.set(f.T1.x, f.T1.y, 0), f.tension * K);
        arrows.T2.set(k, v3.set(f.T2.x, f.T2.y, 0), f.tension * K);
      }
      if (want('W')) arrows.W.set(rig.bottom, v3.set(0, -1, 0), f.weight * K);
      // the test's answer: the two pulls together, straight up from the knot
      if (show?.pair) arrows.R.set(k, v3.set(0, 1, 0), f.weight * K);
      return;
    }
    const p = ballCenter();
    const r = ballR();
    /** From the ball's surface, along the force. */
    const out = (v, size, arrow) => {
      dir.set(v.x, v.y, 0).normalize();
      arrow.set(from.copy(p).addScaledVector(dir, r), dir, size * K);
    };
    if (want('W')) out(f.W, f.weight, arrows.W);
    if (f.kind === 'landed') {
      // the bench pushes up where the ball touches it; drawn, like every force here, from the ball's surface outwards
      if (want('P')) out(f.push, f.weight, arrows.P);
      return;
    }
    if (f.T && want('T')) out(f.T, f.tension, arrows.T);
    if (f.H && want('H')) out(f.H, f.hand, arrows.H);
    // the falling ball's resultant is its weight: that arrow says so, no second one on top of it
    if (want('R') && f.resultant > 1e-3 && f.kind === 'swing') out(f.R, f.resultant, arrows.R);
    // the test's choices belong to the moment of letting go: they are not carried along by a swing
    if (show?.cands && s.frozen) {
      show.cands.forEach((d, i) => {
        dir.set(d.x, d.y, 0);
        cands[i].set(from.copy(p).addScaledVector(dir, r), dir, CHOICE);
        cands[i].setOpacity(show.revealed && i !== show.right ? 0.18 : 1);
      });
    }
  }

  // ── labels on the 3D (kit annotations, clear of each other, the arrows, the ball and the buttons) ─────────
  const toScreen = (p) => {
    v3.copy(p).project(camera);
    return { x: (v3.x * 0.5 + 0.5) * stage.width, y: (-v3.y * 0.5 + 0.5) * stage.height };
  };
  const boxes = [];
  /** Boxes (canvas px) along every arrow shown, the cord or rope and round the ball, the book or the fists. */
  function sceneBoxes() {
    boxes.length = 0;
    const push = (q, r) => boxes.push({ left: q.x - r, top: q.y - r, right: q.x + r, bottom: q.y + r });
    const line = (a, b, n, r) => {
      for (let i = 0; i <= n; i++) push(toScreen(tmp.lerpVectors(a, b, i / n)), r);
    };
    for (const a of [...Object.values(arrows), ...cands]) if (a.root.visible) line(a.root.position, a.tip, 6, 6);
    if (s.scene === 'pendulum') {
      tmp2.copy(ballCenter());
      if (!s.cut) line(pend.hook, tmp2, 8, 4);
      const q = toScreen(tmp2);
      const e = toScreen(tmp.copy(tmp2).setX(tmp2.x + ballR()));
      push(q, Math.abs(e.x - q.x) + 3);
    } else {
      line(rig.knot, rig.grip('left'), 8, 4);
      line(rig.knot, rig.grip('right'), 8, 4);
      for (const side of ['left', 'right']) {
        const q = toScreen(rig.grip(side));
        const e = toScreen(tmp.copy(rig.grip(side)).setX(rig.grip(side).x + 0.05));
        push(q, Math.abs(e.x - q.x));
      }
      const a = toScreen(tmp.set(-rig.size.W / 2, rig.center.y + rig.size.H / 2, 0));
      const b = toScreen(tmp.set(rig.size.W / 2, rig.center.y - rig.size.H / 2, 0));
      boxes.push({ left: a.x, top: a.y, right: b.x, bottom: b.y });
    }
    return boxes;
  }
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, note, sceneBoxes] });
  /** Places to try round an arrow's tip, best first: beyond it, then beside it (canvas px offsets). */
  function spotsFor(a) {
    const p0 = toScreen(a.root.position);
    const p1 = toScreen(a.tip);
    const l = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
    const dx = (p1.x - p0.x) / l;
    const dy = (p1.y - p0.y) / l;
    const beyond = { dx: dx * 16, dy: dy * 16 + (Math.abs(dy) > 0.7 ? Math.sign(dy) * 8 : 0) };
    const side =
      Math.abs(dx) < 0.5
        ? [
            { dx: 12, dy: 0 },
            { dx: -12, dy: 0 },
          ]
        : [
            { dx: 0, dy: -20 },
            { dx: 0, dy: 20 },
          ];
    const back = [
      { dx: 12, dy: -dy * 34 },
      { dx: -12, dy: -dy * 34 },
      { dx: -dx * 40, dy: -22 },
      { dx: -dx * 40, dy: 22 },
    ];
    return Math.abs(dy) > 0.7 ? [...side, beyond, ...back] : [beyond, ...side, ...back];
  }
  const spotKey = new Map();
  /** Shows (or updates) the label of an arrow; new spots only when the arrow turns into another direction. */
  function labelArrow(id, a, text, color, at = null) {
    if (!a.root.visible) {
      spotKey.delete(id);
      return anno.remove(id);
    }
    let key = at?.key || 'at';
    if (!at?.spots) {
      const p0 = toScreen(a.root.position);
      const p1 = toScreen(a.tip);
      key = `${Math.round(Math.atan2(p1.y - p0.y, p1.x - p0.x) / (Math.PI / 4))}`;
    }
    const point = at?.point || (() => a.tip);
    const spots = () => (at?.spots ? at.spots() : spotsFor(a));
    // while the ball swings a label that finds no clear place hides for a moment (the panel still names the forces)
    const optional = s.phase === 'swing' && !s.frozen;
    if (!anno.has(id)) {
      anno.add(id, { text, point, kind: at?.kind || 'force', color, spots: spots(), optional });
      spotKey.set(id, key);
      return;
    }
    const patch = { text, point, optional };
    if (spotKey.get(id) !== key) {
      spotKey.set(id, key);
      patch.spots = spots();
    }
    anno.update(id, patch);
  }
  /** The ball's radius on screen (px). */
  function ballPx() {
    const q = toScreen(tmp2.copy(ballCenter()));
    const e = toScreen(tmp.copy(tmp2).setX(tmp2.x + ballR()));
    return Math.abs(e.x - q.x);
  }
  function labelZero(show, point) {
    if (!show) return anno.remove('zero');
    if (anno.has('zero')) return anno.update('zero', { point });
    anno.add('zero', {
      text: t('lbl_zero'),
      point,
      kind: 'callout',
      color: COLORS.resultant,
      spots: [
        { dx: -46, dy: 0 },
        { dx: 46, dy: 0 },
        { dx: -46, dy: 30 },
        { dx: 46, dy: 30 },
        { dx: -46, dy: -30 },
        { dx: 46, dy: -30 },
      ],
      // the panel says it too: on a small view it gives way to the forces' labels
      optional: true,
    });
  }
  const rim = new THREE.Vector3();
  const pairPoint = new THREE.Vector3();
  function poseLabels(f) {
    const q = s.show;
    const moving = s.phase === 'swing' && !s.frozen;
    const nums = !q || q.numbers;
    const val = (x) => f1(x);
    if (f.kind === 'book') {
      for (const id of ['W', 'H', 'P', 'ask', 'c0', 'c1', 'c2', 'c3']) anno.remove(id);
      // the pulls' labels: under each rope, on its outer side (the V between the ropes is too narrow for two)
      const pullSpots = (side) => () => [
        { dx: side * 12, dy: 17 },
        { dx: side * 14, dy: 0 },
        { dx: side * 12, dy: 34 },
        { dx: side * 12, dy: -18 },
      ];
      labelArrow('T', arrows.T, nums ? t('lbl_T1', { v: val(f.tension) }) : t('sym_T'), COLORS.pull, { spots: pullSpots(-1), key: 'pull' });
      labelArrow('T2', arrows.T2, nums ? t('lbl_T2', { v: val(f.tension) }) : t('sym_T'), COLORS.pull, { spots: pullSpots(1), key: 'pull' });
      labelArrow('Wb', arrows.W, nums ? t('lbl_Wb', { v: val(f.weight) }) : t('sym_W'), COLORS.weight);
      if (q?.pair)
        labelArrow('R', arrows.R, t('lbl_pair', { v: val(f.weight) }), COLORS.resultant, {
          point: () => pairPoint.copy(arrows.R.tip),
          spots: () => [
            { dx: 0, dy: -22 },
            { dx: 14, dy: -6 },
            { dx: -14, dy: -6 },
          ],
          key: 'pair',
        });
      else anno.remove('R');
      labelZero(!q || q.zero, () => rig.leftEdge());
      return;
    }
    anno.remove('T2');
    anno.remove('Wb');
    // the hand's pull, first (its place is the hardest to find): its words go out along the arm, past the hand, or
    // just under or over it; the labels of T and W then find room round them
    if (f.H) {
      if (!anno.has('H')) {
        for (const id of ['T', 'W', 'zero']) {
          anno.remove(id);
          spotKey.delete(id);
        }
      }
      const side = s.theta >= 0 ? 1 : -1;
      labelArrow('H', arrows.H, t('lbl_H', { v: val(f.hand) }), COLORS.handText, {
        kind: 'hand',
        key: `hand${side}`,
        spots: () => {
          const p0 = toScreen(arrows.H.root.position);
          const p1 = toScreen(arrows.H.tip);
          const l = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
          const uy = (p1.y - p0.y) / l;
          return [
            { dx: side * 14, dy: uy * 14 },
            { dx: side * 10, dy: 22 },
            { dx: side * 10, dy: -24 },
            { dx: -side * 12, dy: -26 },
            { dx: -side * 12, dy: 26 },
          ];
        },
      });
    } else anno.remove('H');
    const tText = q?.ask ? t('lbl_T_ask') : moving ? t('sym_T') : nums ? t('lbl_T', { v: val(f.tension) }) : t('lbl_T_q');
    if (f.T) labelArrow('T', arrows.T, tText, COLORS.pull);
    else anno.remove('T');
    if (f.kind === 'fall')
      labelArrow('W', arrows.W, t('lbl_W_fall'), COLORS.weight, {
        point: () => ballCenter(),
        spots: () => [
          { dx: ballPx() + 10, dy: 0 },
          { dx: -ballPx() - 10, dy: 0 },
        ],
      });
    else labelArrow('W', arrows.W, moving ? t('sym_W') : nums ? t('lbl_W', { v: val(f.weight) }) : t('lbl_W_q'), COLORS.weight);
    if (f.push) labelArrow('P', arrows.P, t('lbl_push', { v: val(f.weight) }), COLORS.pull);
    else anno.remove('P');
    // a resultant that is not zero only ever on a body that is moving (no "লব্ধি বল = …" on a body at rest)
    labelArrow('R', arrows.R, moving ? t('sym_R') : t('lbl_R', { v: val(f.resultant) }), COLORS.resultant);
    // the "T = ?" of a test question: a callout on the cord
    if (q?.ask && !arrows.T.root.visible) {
      if (!anno.has('ask'))
        anno.add('ask', {
          text: t('lbl_T_ask'),
          point: () => rim.set(0, 0.11, 0),
          kind: 'callout',
          color: COLORS.pull,
          spots: [
            { dx: 30, dy: 0 },
            { dx: -30, dy: 0 },
          ],
        });
    } else anno.remove('ask');
    labelZero(f.balanced && (!q || q.zero), () =>
      rim.copy(ballCenter()).add(tmp.set(f.kind === 'held' ? (s.theta > 0 ? -1 : 1) * ballR() : -ballR(), 0, 0)),
    );
    // the test's letters, each a little way past its arrow's head (in its own direction, so they never meet)
    for (let i = 0; i < 4; i++) {
      const a = cands[i];
      // once answered only the right letter stays (the others' arrows fade)
      if (!a.root.visible || (q.revealed && i !== q.right)) {
        anno.remove(`c${i}`);
        continue;
      }
      const letter = t('letters')[i] || String(i + 1);
      const at = () => {
        const d = q.cands[i];
        return rim.set(a.tip.x + d.x * BADGE, a.tip.y + d.y * BADGE, 0);
      };
      if (!anno.has(`c${i}`)) anno.add(`c${i}`, { text: letter, point: at, kind: 'letter', dx: 0, dy: 0 });
    }
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    sum: /** @type {SVGSVGElement} */ ($('.bf-sum')),
    word: $('.bf-word'),
    res: $('.bf-res'),
    say: $('.bf-say'),
    a1: $('[data-act="a1"]'),
    a2: $('[data-act="a2"]'),
  };
  function sayKey(f) {
    if (f.kind === 'book') return s.bookMoved ? 'say_book_moved' : 'say_book';
    return { rest: 'say_rest', held: 'say_held', swing: 'say_swing', fall: 'say_fall', landed: 'say_landed' }[f.kind];
  }
  function resText(f) {
    if (f.kind === 'swing') return t('res_swing');
    if (f.kind === 'fall') return t('res_fall');
    if (f.kind === 'landed') return t('res_landed');
    return t('res_zero');
  }
  function sumSpec(f) {
    const P = { color: COLORS.pull };
    const Wt = { v: f.W, color: COLORS.weight, label: t('sym_W') };
    if (f.kind === 'book') return [Wt, { v: f.T2, ...P, label: t('sym_T2') }, { v: f.T1, ...P, label: t('sym_T1') }];
    if (f.kind === 'fall') return [Wt];
    if (f.kind === 'landed') return [Wt, { v: f.push, ...P, label: t('sym_push') }];
    if (f.kind === 'held') return [Wt, { v: f.T, ...P, label: t('sym_T') }, { v: f.H, color: COLORS.hand, label: t('sym_hand') }];
    return [Wt, { v: f.T, ...P, label: t('sym_T') }];
  }
  let lastWord = '';
  let sumKey = '';
  function refreshPanel(f) {
    const st = stateOf(f);
    if (st !== lastWord) {
      el.word.textContent = t(`st_${st}`);
      el.word.dataset.state = st;
      lastWord = st;
    }
    const res = resText(f);
    if (el.res.textContent !== res) el.res.textContent = res;
    const say = t(sayKey(f));
    if (el.say.innerHTML !== say) el.say.innerHTML = say;
    // the drawing changes only when a force changes by more than 0.05 N (or the box its size)
    const spec = sumSpec(f);
    const key = `${el.sum.clientWidth}x${el.sum.clientHeight}|${spec.map((x) => `${x.label}:${Math.round(x.v.x * 20)},${Math.round(x.v.y * 20)}`).join(';')}`;
    if (key !== sumKey) {
      sumKey = key;
      drawSum(el.sum, { forces: spec, resultant: { color: COLORS.resultant, label: t('sym_R') } });
    }
    // the two buttons: the cord (cut, hang again) or the hands (apart, closer)
    const acts =
      s.scene === 'book'
        ? [
            ['apart', APART, s.alpha <= ALPHA.min + 0.01],
            ['closer', CLOSER, s.alpha >= ALPHA.max - 0.01],
          ]
        : [
            // the cord is cut only while the ball hangs still
            ['cut', SCISSORS, Boolean(s.cut) || s.phase !== 'rest'],
            ['rehang', ICONS.reset, s.phase === 'rest' && !s.cut],
          ];
    acts.forEach(([act, icon, off], i) => {
      const b = i ? el.a2 : el.a1;
      if (b.dataset.does !== act) {
        b.dataset.does = act;
        b.querySelector('.ic').innerHTML = icon;
        b.querySelector('span').textContent = t(`act_${act}`);
      }
      b.disabled = off || s.locked;
    });
    // the note in the corner: the scale of the arrows, and the slowed-down fall
    const slow = s.scene === 'pendulum' && (s.phase === 'fall' || s.phase === 'landed');
    const text = slow ? t('note_slow', { k: SLOW, dt: MARK_DT }) : t('note_scale');
    if (note.textContent !== text) note.textContent = text;
    note.dataset.at = s.scene === 'book' ? 'bottom' : 'top'; // the book's hands are at the top
  }

  // ── one refresh for everything that shows the state ─────────────────────────
  let lastKey = '';
  function refresh() {
    const f = forcesNow();
    poseModels(f);
    poseArrows(f);
    poseLabels(f);
    refreshPanel(f);
    stage.invalidate();
    const key = `${s.scene}|${s.phase}|${round(deg(s.theta), 0)}|${round(s.alpha, 0)}|${s.cut ? 1 : 0}`;
    if (key !== lastKey && s.phase !== 'swing' && s.phase !== 'fall') {
      lastKey = key;
      emit('change', snapshot());
    }
  }

  function snapshot() {
    const f = forcesNow();
    const r1 = (v) => (v ? { x: round(v.x, 2), y: round(v.y, 2) } : null);
    return {
      scene: s.scene,
      phase: s.scene === 'book' ? 'rest' : s.phase,
      state: stateOf(f),
      angle: round(deg(s.theta), 1),
      alpha: round(s.alpha, 1),
      mass: s.mass,
      forces:
        f.kind === 'book'
          ? { T1: r1(f.T1), T2: r1(f.T2), W: r1(f.W), tension: round(f.tension, 2), weight: round(f.weight, 2) }
          : {
              T: r1(f.T),
              W: r1(f.W),
              hand: r1(f.H),
              push: r1(f.push),
              tension: f.T ? round(f.tension, 2) : 0,
              weight: round(f.weight, 2),
            },
      resultant: { ...r1(f.R && !f.balanced ? f.R : { x: 0, y: 0 }), size: round(f.resultant, 2) },
      balanced: f.balanced,
      dropped: s.cut ? round(s.cut.y, 3) : 0,
      frozen: s.frozen,
      view: s.view,
      mode: s.mode,
    };
  }

  // ── the ball: hold, let go, swing, cut, fall ────────────────────────────────
  function setHeld(theta) {
    s.phase = 'held';
    s.frozen = false;
    s.theta = THREE.MathUtils.clamp(theta, -rad(MAX_DEG), rad(MAX_DEG));
    s.omega = 0;
    s.carry = 0;
  }
  function letGo({ quiet = false } = {}) {
    if (s.phase !== 'held') return;
    if (Math.abs(deg(s.theta)) < MIN_HOLD) {
      s.phase = 'rest';
      s.theta = 0;
    } else {
      s.phase = 'swing';
      s.omega = 0;
      s.carry = 0;
      if (!quiet) audio.pop?.();
      emit('release', { angle: round(deg(s.theta), 1) });
    }
    refresh();
  }
  /** The frame the front view shows: the ball and its hook, the fall (lower down), or the book. */
  const frameKey = () => (s.scene === 'book' ? 'book' : s.cut ? 'fall' : 'pendulum');
  let shownFrame = '';
  function followFrame(duration = 0.5) {
    if (frameKey() === shownFrame) return;
    shownFrame = frameKey();
    if (!s.userMovedCamera) flyTo(viewPose(s.view), duration);
  }
  function hangStill({ animate = true } = {}) {
    ++token;
    tweener.cancel('lying');
    tweener.cancel('hold');
    s.phase = 'rest';
    s.theta = 0;
    s.omega = 0;
    s.carry = 0;
    s.cut = null;
    s.frozen = false;
    marks.clear();
    nudge(false);
    refresh();
    followFrame(animate ? 0.5 : 0);
  }
  /** Cut the cord `at` (0…1 of the way down from the hook); the ball falls and the view goes down with it. */
  function cutCord(at = CUT_AT, { animate = true } = {}) {
    if (s.cut) return false;
    if (s.phase !== 'rest') {
      // only a ball that hangs still is cut (a swinging one would fly off)
      showHint(t('hint_cut_still'), { duration: 2600 });
      audio.error?.();
      return false;
    }
    const eye = BALL_R + 0.01;
    s.cut = { at: THREE.MathUtils.clamp(at, 0.12, 0.85) * (LENGTH - eye), t: 0, y: 0, lying: 0, marks: 0 };
    s.phase = 'fall';
    addMark(0);
    audio.tick?.();
    emit('cut', {});
    refresh();
    followFrame(animate ? 0.45 : 0);
    return true;
  }
  function addMark(y) {
    const m = new THREE.Mesh(markGeo, markMat);
    m.position.set(0, -y, 0.04);
    marks.add(m);
  }
  /** The fall, `dt` s of screen time later. */
  function stepFall(dt) {
    const k = s.cut;
    k.t += dt / SLOW;
    k.y = Math.min(DROP, fallDistance(k.t));
    while (fallDistance((k.marks + 1) * MARK_DT) < DROP && (k.marks + 1) * MARK_DT <= k.t) {
      k.marks++;
      addMark(fallDistance(k.marks * MARK_DT));
    }
    if (k.y >= DROP) land();
  }
  function land({ animate = true } = {}) {
    s.phase = 'landed';
    s.cut.y = DROP;
    audio.contact?.();
    emit('landed', {});
    if (!animate) {
      s.cut.lying = 1;
      return refresh();
    }
    tweener.animate({
      key: 'lying',
      duration: 0.45,
      delay: 0.15,
      ease: ease.inOutCubic,
      onUpdate: (e) => {
        if (!s.cut) return;
        s.cut.lying = e;
        refresh();
      },
    });
    refresh();
  }
  /** Let the swing or the fall run `seconds` of screen time at once (pictures, the bridge, a test's answer). */
  function runFor(seconds) {
    let left = seconds;
    while (left > 1e-9) {
      const dt = Math.min(0.02, left);
      left -= dt;
      if (s.phase === 'swing') stepSwing(dt);
      else if (s.phase === 'fall') stepFall(dt);
      else break;
    }
    if (s.phase === 'landed' && s.cut) s.cut.lying = 1;
  }
  function stepSwing(dt) {
    const st = swingAdvance({ theta: s.theta, omega: s.omega, carry: s.carry }, dt);
    s.theta = st.theta;
    s.omega = st.omega;
    s.carry = st.carry;
    if (amplitude(st) < rad(0.3)) {
      s.phase = 'rest';
      s.theta = 0;
      s.omega = 0;
    }
  }
  stage.addTicker((dt) => {
    if (s.scene !== 'pendulum' || s.frozen) return false;
    if (s.phase === 'swing') {
      stepSwing(dt);
      refresh();
      return true;
    }
    if (s.phase === 'fall') {
      stepFall(dt);
      refresh();
      return true;
    }
    return false;
  });
  /** The "hang again" button pulses for a moment (instead of a hint over the ball it is about). */
  function nudge(on = true) {
    el.a2.classList.remove('bf-nudge');
    if (!on) return;
    void el.a2.offsetWidth; // restart the animation
    el.a2.classList.add('bf-nudge');
  }

  // ── the book: the rope's angle ──────────────────────────────────────────────
  function setAlpha(a, { animate = false, moved = true } = {}) {
    const target = clampAlpha(a);
    if (moved && Math.abs(target - s.alpha) > 0.05) s.bookMoved = true;
    if (!animate) {
      tweener.cancel('alpha');
      s.alpha = target;
      refresh();
      return Promise.resolve(true);
    }
    const start = s.alpha;
    return tweener.animate({
      key: 'alpha',
      duration: 0.25 + Math.abs(target - start) / 60,
      ease: ease.inOutSine,
      onUpdate: (e) => {
        s.alpha = start + (target - start) * e;
        refresh();
      },
    }).finished;
  }

  // ── scenes ──────────────────────────────────────────────────────────────────
  function setScene(next, { animate = true } = {}) {
    const scene2 = next === 'book' ? 'book' : 'pendulum';
    ++token;
    tweener.cancel('alpha');
    if (scene2 !== s.scene) {
      anno.clear();
      spotKey.clear();
      // a ball held aside is let go as the student leaves it (it swings on, out of sight, then hangs still)
      if (s.phase === 'held') letGo({ quiet: true });
      s.scene = scene2;
      emit('scene', { scene: s.scene });
    }
    syncUI();
    refresh();
    shownFrame = frameKey();
    if (!s.userMovedCamera || s.view === 'front') flyTo(viewPose(s.view), animate ? 0.7 : 0);
    coaches.pendulum?.setMode(s.mode === 'explore' && s.scene === 'pendulum' ? 'explore' : 'off');
    coaches.book?.setMode(s.mode === 'explore' && s.scene === 'book' ? 'explore' : 'off');
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewPose(view) {
    const box = FRAMES[frameKey()];
    const vfov = rad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const top = 48; // px kept clear for the buttons at the top
    const bottom = 6;
    const usable = Math.max(0.4, (stage.height - top - bottom) / Math.max(stage.height, 1));
    const halfW = (box.x1 - box.x0) / 2;
    const halfH = (box.y1 - box.y0) / 2;
    let d = Math.max(halfH / Math.tan(vfov / 2) / usable, halfW / Math.tan(hfov / 2)) * 1.02;
    if (view === '3d') d *= 1.12;
    const perPx = (2 * d * Math.tan(vfov / 2)) / Math.max(stage.height, 1);
    const target = new THREE.Vector3((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2 + ((top - bottom) / 2) * perPx, 0);
    return { target, position: target.clone().addScaledVector(VIEW_DIRS[view], d) };
  }
  function flyTo({ position, target }, duration = 0.7) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' && s.mode !== 'quiz' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    controls.enableZoom = s.view === '3d';
    s.userMovedCamera = false;
    shownFrame = frameKey();
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(s.view), 0);
    spotKey.clear();
    sumKey = '';
  });

  // ── touch and mouse on the 3D ───────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitPoint = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function rayAt(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster;
  }
  /** What a finger at p takes: 'ball' | 'cord' | 'hand' | 'landed' | null. A touch a little off still counts. */
  function pick(p) {
    if (s.scene === 'book') {
      const hit = rayAt(p).intersectObjects([rig.hits.left, rig.hits.right], false)[0];
      return hit ? 'hand' : null;
    }
    const ray = rayAt(p);
    if (s.phase === 'landed') return ray.intersectObject(pend.hits.ball, false).length ? 'landed' : null;
    if (s.phase === 'fall') return null;
    if (ray.intersectObject(pend.hits.ball, false).length) return 'ball';
    if (pend.hits.cord.visible && ray.intersectObject(pend.hits.cord, false).length) return 'cord';
    return null;
  }
  /** The point in the picture's plane under p (world m). */
  function planePoint(p) {
    return rayAt(p).ray.intersectPlane(plane, hitPoint) ? hitPoint.clone() : null;
  }
  // the hook is LENGTH above the ball's resting centre (the origin of the pendulum, which sits at the world origin)
  const thetaOf = (q) => Math.atan2(q.x, LENGTH - q.y);
  const alphaOf = (q) => deg(Math.atan2(q.y - rig.knot.y, Math.max(0.02, Math.abs(q.x - rig.knot.x))));

  let drag = null; // { kind, id, start, grab, from, moved }
  let lastTapAt = 0;
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error?.();
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coaches.pendulum?.interrupt();
      coaches.book?.interrupt();
      if (drag) return;
      const p = canvasPoint(e);
      const what = pick(p);
      if (!what) return; // the camera controls take it (3D view)
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const q = planePoint(p);
      if (!q) return;
      if (what === 'landed') return nudge();
      // the pointer is ours until it lifts, wherever it goes (a press on the cord too)
      capturePointer(ui.canvasHost, e.pointerId);
      if (what === 'cord') {
        drag = { kind: 'cord', id: e.pointerId, start: p, at: performance.now(), q: q.clone() };
        return;
      }
      ++token;
      if (what === 'ball') {
        drag = { kind: 'ball', id: e.pointerId, start: p, grab: thetaOf(q), from: s.theta, moved: false };
        setHeld(s.theta);
        coaches.pendulum?.objectUsed();
      } else {
        drag = { kind: 'hand', id: e.pointerId, start: p, grab: alphaOf(q), from: s.alpha, moved: false };
        tweener.cancel('alpha');
        coaches.book?.objectUsed();
      }
      ui.canvasHost.style.cursor = 'grabbing';
      emit('dragstart', { scene: s.scene });
      refresh();
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) {
      if (e.pointerType === 'mouse' && !drag) hover(canvasPoint(e));
      return;
    }
    const p = canvasPoint(e);
    if (Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 4) drag.moved = true;
    if (drag.kind === 'cord') return;
    const q = planePoint(p);
    if (!q) return;
    if (drag.kind === 'ball') {
      const want = drag.from + (thetaOf(q) - drag.grab);
      setHeld(want);
      if (Math.abs(deg(want)) > MAX_DEG + 6) showHint(t('hint_limit'), { duration: 1500 });
    } else {
      setAlpha(drag.from + (alphaOf(q) - drag.grab));
    }
    refresh();
  });
  function endDrag(e, cancelled = false) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag;
    drag = null;
    releasePointer(ui.canvasHost, d.id);
    ui.canvasHost.style.cursor = '';
    if (d.kind === 'cord') {
      // a tap on the cord (not a drag across it) cuts it there, if the ball hangs still
      const p = e ? canvasPoint(e) : d.start;
      const quick = performance.now() - d.at < 700 && Math.hypot(p.x - d.start.x, p.y - d.start.y) < 12;
      if (!cancelled && quick && performance.now() - lastTapAt > DOUBLE_TAP && !s.locked) {
        lastTapAt = performance.now();
        cutCord(THREE.MathUtils.clamp((pend.hook.y - d.q.y) / LENGTH, 0, 1));
      }
      return;
    }
    if (d.kind === 'ball') letGo();
    emit('dragend', { scene: s.scene });
    refresh();
  }
  ui.canvasHost.addEventListener('pointerup', (e) => endDrag(e));
  ui.canvasHost.addEventListener('pointercancel', (e) => endDrag(e, true));
  // a pointer lifted anywhere else (outside the 3D view, over the panel) ends the press too: none is ever left over
  window.addEventListener('pointerup', (e) => endDrag(e), true);
  window.addEventListener('pointercancel', (e) => endDrag(e, true), true);
  let hoverQueued = false;
  function hover(p) {
    if (hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      const what = pick(p);
      ui.canvasHost.style.cursor = !what
        ? ''
        : s.locked
          ? 'not-allowed'
          : what === 'cord'
            ? s.phase === 'rest'
              ? 'crosshair'
              : 'not-allowed'
            : 'grab';
    });
  }

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  /** The five kinds in a random order: the tension before the cut (its scene shows T = W), the book before the pull. */
  function questionOrder() {
    const kinds = shuffle(['tension', 'cut', 'release', 'book', 'pull']);
    const swapIfAfter = (a, b) => {
      const i = kinds.indexOf(a);
      const j = kinds.indexOf(b);
      if (i > j) [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
    };
    swapIfAfter('tension', 'cut');
    swapIfAfter('book', 'pull');
    return kinds;
  }
  const item = (key, text, note) => ({ key, text, note });
  function textChoices(items, kind, extra = {}) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="bf-opt">${list[j].text}</span>`,
      meta: { kind, answer: items[0].key, ...extra },
    };
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  let kinds = [];
  let question = null;
  let learnSaved = null;

  /** A clean scene for a question: nothing moving, nothing left from before, the front view. */
  async function cleanScene(scene2, show, { mass = MASS } = {}) {
    ++token;
    hideHint();
    tweener.cancel('alpha');
    tweener.cancel('lying');
    s.cut = null;
    s.frozen = false;
    s.mass = mass;
    s.phase = 'rest';
    s.theta = 0;
    s.omega = 0;
    marks.clear();
    anno.clear();
    spotKey.clear();
    s.show = show;
    s.scene = scene2;
    s.alpha = ALPHA.start;
    refresh();
    const my = token;
    shownFrame = frameKey();
    await flyTo(viewPose('front'), s.view === 'front' && !s.userMovedCamera ? 0 : 0.6);
    s.view = 'front';
    controls.enableRotate = false;
    controls.enableZoom = false;
    syncUI();
    return my === token;
  }
  /** The moment just after letting go at θ, held still: T, W and their resultant (a picture, a test's answer). */
  function releasePose(theta) {
    s.phase = 'swing';
    s.theta = theta;
    s.omega = 0;
    s.carry = 0;
    s.frozen = true;
  }
  const valN = (x) => t('val_N', { v: plain(x) });

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 2, feedback: 3 },
    hooks: {
      enter() {
        learnSaved = { scene: s.scene, alpha: s.alpha, bookMoved: s.bookMoved };
        endDrag(null, true);
        s.mode = 'quiz';
        s.locked = true;
        hideHint();
        nudge(false);
        kinds = questionOrder();
        syncUI();
        refresh();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = null;
        ++token;
        const saved = learnSaved || { scene: 'pendulum', alpha: ALPHA.start, bookMoved: false };
        s.mass = MASS;
        s.cut = null;
        s.frozen = false;
        s.phase = 'rest';
        s.theta = 0;
        s.omega = 0;
        marks.clear();
        anno.clear();
        spotKey.clear();
        s.alpha = saved.alpha;
        s.bookMoved = saved.bookMoved;
        hideHint();
        setScene(saved.scene, { animate: false });
        setView('front', { animate: false });
      },
      async prepare(i, alive) {
        const kind = kinds[i % kinds.length];
        if (kind === 'tension') {
          // the size only (the cord shows the direction); the weight is read off the picture
          const m = pickOne([0.6, 0.7, 0.8, 0.9]);
          if (!(await cleanScene('pendulum', { forces: 'W', numbers: true, ask: true, zero: false }, { mass: m })) || !alive()) return null;
          const w = weight(m);
          question = { kind, m, w };
          return {
            text: t('q_tension'),
            ...textChoices(
              [
                item('w', valN(w)),
                item('zero', valN(0), 'miss_t_zero'),
                item('double', valN(2 * w), 'miss_t_double'),
                item('g', valN(G), 'miss_t_g'),
              ],
              kind,
              { mass: m },
            ),
          };
        }
        if (kind === 'cut') {
          if (!(await cleanScene('pendulum', { forces: 'TW', numbers: false, zero: false })) || !alive()) return null;
          question = { kind };
          return {
            text: t('q_cut'),
            ...textChoices(
              [
                item('w', t('c_cut_w')),
                item('t', t('c_cut_t'), 'miss_cut_t'),
                item('none', t('c_cut_none'), 'miss_cut_none'),
                item('both', t('c_cut_both'), 'miss_cut_both'),
              ],
              kind,
            ),
          };
        }
        if (kind === 'release') {
          // pulled to the right (the four choices then point away from the buttons at the top right), far enough
          // that the arrows along the path and level are well apart
          const a = rad(pickOne([32, 33, 35]));
          const dirs = releaseDirections(a);
          const order = shuffle(['along', 'down', 'string', 'level']);
          if (!(await cleanScene('pendulum', { forces: 'none', numbers: false, zero: false })) || !alive()) return null;
          releasePose(a);
          // only the four choices: the cord shows which way T pulls, W is straight down (the answer draws both)
          s.show = { forces: 'none', numbers: false, zero: false, cands: order.map((k) => dirs[k]), right: order.indexOf('along'), revealed: false };
          refresh();
          question = { kind, order, angle: a };
          const letters = t('letters');
          return {
            text: t('q_release'),
            choices: [0, 1, 2, 3],
            expected: order.indexOf('along'),
            tolerance: 0.5,
            label: (j) => `<span class="bf-opt bf-letter">${letters[j]}</span>`,
            meta: { kind, angle: round(deg(a), 0) },
          };
        }
        if (kind === 'book') {
          // what the two pulls add up to: the weight, upward (read off the picture: the book's mass varies)
          const m = pickOne([0.6, 0.8, 1.2]);
          const alpha = pickOne([25, 35, 45]);
          if (!(await cleanScene('book', { forces: 'all', numbers: true, zero: false }, { mass: m })) || !alive()) return null;
          s.alpha = alpha;
          refresh();
          const f = bookForces(alpha, m);
          question = { kind, alpha, m, T: round(f.tension, 1), W: round(f.weight, 1) };
          return {
            text: t('q_book'),
            ...textChoices(
              [
                item('w', t('val_N_up', { v: plain(f.weight) })),
                item('sum', t('val_N_up', { v: plain(2 * round(f.tension, 1)) }), 'miss_b_sum'),
                item('zero', valN(0), 'miss_b_zero'),
                item('one', t('val_N_up', { v: plain(f.tension) }), 'miss_b_one'),
              ],
              kind,
              { alpha, mass: m },
            ),
          };
        }
        // pull: a full 2 × 2 (the pulls grow or shrink, the resultant stays zero or does not)
        const alpha = pickOne([45, 50, 55]);
        if (!(await cleanScene('book', { forces: 'all', numbers: true, zero: false })) || !alive()) return null;
        s.alpha = alpha;
        refresh();
        question = { kind, alpha, T: round(bookForces(alpha).tension, 1) };
        return {
          text: t('q_pull'),
          ...textChoices(
            [
              item('more_zero', t('c_p_more_zero')),
              item('less_zero', t('c_p_less_zero'), 'miss_p_less_zero'),
              item('more_up', t('c_p_more_up'), 'miss_p_more_up'),
              item('less_down', t('c_p_less_down'), 'miss_p_less_down'),
            ],
            kind,
            { alpha },
          ),
        };
      },
      reveal(q, correct, picked) {
        const k = question.kind;
        const wrong = correct ? null : q.list ? q.list[picked.index] : null;
        // right: the worked answer; wrong: the answer, then what the picked choice got wrong (and why the answer holds)
        const answer = (why, head, missKey = wrong?.note) => (correct || !missKey ? why : `<b>${head}</b>: ${t(missKey, { g: plain(G), one: 1 })}`);
        const my = ++token;
        const alive = () => my === token && quiz.active;
        if (k === 'tension') {
          s.show = { forces: 'all', numbers: true, zero: true };
          refresh();
          return answer(t('why_tension', { w: plain(question.w) }), valN(question.w));
        }
        if (k === 'cut') {
          // the fall plays; then the picture goes back to just after the cut, held: only W, the unbalanced force
          s.show = { forces: 'all', numbers: false, zero: false };
          cutCord(0.45);
          (async () => {
            await wait(1000 * (SLOW * Math.sqrt((2 * DROP) / G) + 1.4));
            if (!alive()) return;
            s.cut = null;
            marks.clear();
            s.phase = 'rest';
            cutCord(0.45, { animate: false });
            runFor(SLOW * 0.11);
            s.frozen = true;
            refresh();
          })();
          return answer(t('why_cut'), t('c_cut_w'));
        }
        if (k === 'release') {
          // the answer: T, W and their resultant along the right choice; it swings once and comes back to that moment
          s.show = { ...s.show, forces: 'all', revealed: true };
          refresh();
          (async () => {
            await wait(1300);
            if (!alive()) return;
            s.frozen = false;
            refresh();
            await wait(period() * 1000);
            if (!alive()) return;
            releasePose(question.angle);
            refresh();
          })();
          const right = t('letters')[question.order.indexOf('along')];
          const miss = { down: 'miss_rel_down', string: 'miss_rel_string', level: 'miss_rel_level' }[question.order[picked.index]];
          return answer(t('why_release', { k: right }), right, miss);
        }
        if (k === 'book') {
          s.show = { forces: 'all', numbers: true, zero: false, pair: true };
          refresh();
          return answer(t('why_book', { w: plain(question.W) }), t('val_N_up', { v: plain(question.W) }));
        }
        // pull: the hands go apart, the pulls grow, the book stays
        s.show = { forces: 'all', numbers: true, zero: true };
        const to = 22;
        setAlpha(to, { animate: true, moved: false });
        return answer(t('why_pull', { a: plain(question.T), b: plain(bookForces(to).tension) }), t('head_pull'));
      },
      done() {
        s.locked = true;
        refresh();
      },
    },
  });

  // ── first-use pointers: the ball, the hands ─────────────────────────────────
  const coaches = { pendulum: null, book: null };
  if (o.coach) {
    const labelsShown = () => [...ui.annoLayer.querySelectorAll('.pvc-anno')];
    coaches.pendulum = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_pull',
        // beside the ball, never over the labels of the forces
        labelAt: ['right', 'left', 'below', 'above'],
        labelAvoid: labelsShown,
        candidates: () => {
          const q = toScreen(ballCenter());
          return [q, { x: q.x + 6, y: q.y + 6 }];
        },
        grabbable: (p) => s.scene === 'pendulum' && pick(p) === 'ball',
        inset: { bottom: 16 },
      },
    });
    coaches.book = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_hands',
        // beside the right hand, towards the middle (the pulls' labels are under the ropes)
        labelAt: ['left', 'below', 'above', 'right'],
        candidates: () => [toScreen(rig.grip('right')), toScreen(rig.grip('left'))],
        grabbable: (p) => s.scene === 'book' && pick(p) === 'hand',
        labelAvoid: labelsShown,
      },
    });
  }

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    root.dataset.scene = s.scene;
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    for (const b of ui.$$('[data-scene]')) {
      const on = b.dataset.scene === s.scene;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  function act(name) {
    if (s.locked) return lockedNudge();
    if (name === 'cut') cutCord(CUT_AT);
    else if (name === 'rehang') hangStill();
    else if (name === 'apart') setAlpha(Math.round((s.alpha - 10) / 5) * 5, { animate: true });
    else if (name === 'closer') setAlpha(Math.round((s.alpha + 10) / 5) * 5, { animate: true });
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.scene) {
      if (s.locked) lockedNudge();
      else if (b.dataset.scene !== s.scene) setScene(b.dataset.scene);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'a1':
      case 'a2':
        act(b.dataset.does);
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const sceneKey = ['arrowleft', 'arrowright', ' ', 'enter', 'c', 'r', '1', '2'].includes(k);
    if (sceneKey && s.locked) {
      if (k === ' ' || k === 'enter') return; // a focused answer button still works
      lockedNudge();
      e.preventDefault();
      return;
    }
    if (k === '1') setScene('pendulum');
    else if (k === '2') setScene('book');
    else if (k === 'arrowleft' || k === 'arrowright') {
      const step = k === 'arrowright' ? 1 : -1;
      if (s.scene === 'book') {
        const next = Math.round((s.alpha - step * 5) / 5) * 5;
        if (clampAlpha(next) === s.alpha) showHint(t('hint_limit'), { duration: 1500 });
        setAlpha(next, { animate: true });
      } else if (s.cut) nudge();
      else {
        if (s.phase === 'swing') hangStill();
        const want = s.theta + rad(5 * step);
        if (Math.abs(deg(want)) > MAX_DEG + 0.01) showHint(t('hint_limit'), { duration: 1500 });
        setHeld(want);
        coaches.pendulum?.objectUsed();
        refresh();
      }
    } else if ((k === ' ' || k === 'enter') && !target.closest('button')) {
      if (s.scene === 'pendulum' && s.phase === 'held') letGo();
      else return;
    } else if (k === 'c' && s.scene === 'pendulum') cutCord(CUT_AT);
    else if (k === 'r') {
      if (s.scene === 'pendulum') hangStill();
      else setAlpha(ALPHA.start, { animate: true });
    } else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  if (o.hold && s.scene === 'pendulum') setHeld(rad(Number(o.hold) || 0));
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  setScene(s.scene, { animate: false });
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coaches[s.scene]?.start();
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
     * Change any of: scene ('pendulum' | 'book'); hold (deg: the ball held aside by a hand, 0 hangs it still); release
     * (deg: let go from there, then `at` s of the swing; freeze: true holds that moment still); cut (true, or 0…1 of
     * the way down the cord; then `at` s of the slowed fall; animate: false lands it); rehang (true); alpha (deg, the
     * rope's angle); view. animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (s.mode === 'quiz' && (p.scene || p.hold != null || p.release != null || p.cut || p.alpha != null)) quiz.stop();
      if (p.scene) setScene(p.scene, { animate });
      if (p.view) await setView(p.view, { animate });
      if (s.scene === 'pendulum') {
        if (p.rehang) hangStill({ animate });
        if (p.hold != null) {
          if (s.cut) hangStill({ animate });
          const target = rad(Number(p.hold) || 0);
          if (Math.abs(target) < rad(0.01)) hangStill({ animate });
          else if (!animate) {
            setHeld(target);
            refresh();
          } else {
            const start = s.phase === 'held' ? s.theta : 0;
            setHeld(start);
            await tweener.animate({
              key: 'hold',
              duration: 0.8,
              onUpdate: (e) => {
                setHeld(start + (target - start) * e);
                refresh();
              },
            }).finished;
          }
        }
        if (p.release != null) {
          if (s.cut) hangStill({ animate });
          setHeld(rad(Number(p.release) || 0));
          letGo({ quiet: true });
          if (p.at) runFor(Number(p.at));
          if (p.freeze) s.frozen = true;
          refresh();
        }
        if (p.cut) {
          if (s.cut || s.phase !== 'rest') hangStill({ animate: false });
          cutCord(p.cut === true ? CUT_AT : Number(p.cut), { animate });
          if (p.at) runFor(Number(p.at));
          else if (!animate) runFor(10);
          if (p.freeze) s.frozen = true;
          refresh();
        }
      }
      if (p.alpha != null && s.scene === 'book') await setAlpha(p.alpha, { animate });
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.bookMoved = false;
      s.alpha = ALPHA.start;
      hangStill({ animate: false });
      setScene('pendulum', { animate: false });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    // the scene shown, its arrows and the hand: not the pick targets, the marks, the sleeves or the test's choices
    exportRoot: () => world,
  };
}
