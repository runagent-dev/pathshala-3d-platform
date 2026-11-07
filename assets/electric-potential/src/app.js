// Electric potential (book pages 287–289, topics 10.6 তড়িৎ বিভব and 10.6.1 বিভব পার্থক্য), student view.
// A polished steel sphere A with a positive charge q (+ marks on it) on an insulating stand at the left of a plain bench,
// and a small positive test charge q₀ on a carriage on a rail running away from it (the line of চিত্র ১০.১৪), with a rule
// in cm from A's centre. Five steps, one tap each, slow; the test charge can be dragged after the first:
// ① it is brought in at constant speed (সমবেগে) from the rail's far end to 10 cm: the repulsion (বিকর্ষণ বল) grows, the
//   applied force matches it, and the work W from infinity is drawn as a graph in the panel;
// ② the work is divided by q₀: the graph keeps its shape and its numbers become volts (V = W/q₀ = kq/r), and three
//   equipotential shells (900, 450, 300 V) appear round A;
// ③ a second, uncharged sphere B comes in at 30 cm and a wire joins them: electrons (blue beads with "−") run from B to A
//   until the two potentials are equal (1,050 V each), and the flow stops;
// ④ a crow lands on the wire: its potential is the wire's, no difference, no shock (the book's example);
// ⑤ an earthing cable joins B to the ground: electrons come up from the earth until both are at 0 V.
// A calm card on the first screen, then a lead-in line, the result and the rule per step; the kit's how-to row; a
// five-question test.
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
import { B_X, createApparatus, H, Q0_R, R } from './apparatus.js';
import { boldArrow } from './arrows.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { choicesFor, clampR, group, isWhole, potentialAt, Q0_NC, Q_NC, R_MAX, R_MIN, roundTo, SHELLS, STEPS, twoSpheres, workTo } from './reading.js';
import { backdrop, createSetting } from './setting.js';

export const DEFAULTS = {
  step: 'intro',
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

/** One colour per quantity: the repulsion (a force, teal), the applied force (orange), work W (green), potential V (violet). */
const COL = { rep: '#0ca678', push: '#e8590c', work: '#237a35', pot: '#7048e8', shell: '#7048e8', ink: '#1d2733', earth: '#2b8a3e', e: '#1971c2' };
const ARROW_R = 0.0016; // the force arrows' shaft (m), thickened to a few pixels by thick()
const F_LEN = 0.1; // the force arrows' length at r = 10 cm (m); ∝ 1/r²
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 14, side: 10 };
// how long things take (s): slow enough to follow
const T = {
  arrows: 1,
  bring: 3.4,
  hide: 0.8,
  morph: 1.6,
  shells: 1.8,
  out: 1.4,
  inB: 1.4,
  hold: 0.8,
  wire: 1.6,
  flow: 4.4,
  crow: 2.2,
  away: 1.2,
  cable: 1.8,
  ground: 4.6,
  back: 1.2,
  fly: 1.6,
};
/** Where each step ends. r is the test charge's distance (cm); the rest go 0 … 1. */
const TARGET = {
  intro: { lines: 1, arrows: 0, morph: 0, shells: 0, q0: 1, b: 0, wire: 0, flow: 0, crow: 0, cable: 0, ground: 0, hold: 0, r: R_MAX },
  bring: { lines: 1, arrows: 1, morph: 0, shells: 0, q0: 1, b: 0, wire: 0, flow: 0, crow: 0, cable: 0, ground: 0, hold: 0, r: R_MIN },
  potential: { lines: 1, arrows: 0, morph: 1, shells: 1, q0: 1, b: 0, wire: 0, flow: 0, crow: 0, cable: 0, ground: 0, hold: 0 },
  join: { lines: 0, arrows: 0, morph: 1, shells: 0, q0: 0, b: 1, wire: 1, flow: 1, crow: 0, cable: 0, ground: 0, hold: 0 },
  crow: { lines: 0, arrows: 0, morph: 1, shells: 0, q0: 0, b: 1, wire: 1, flow: 1, crow: 1, cable: 0, ground: 0, hold: 0 },
  earth: { lines: 0, arrows: 0, morph: 1, shells: 0, q0: 0, b: 1, wire: 1, flow: 1, crow: 0, cable: 1, ground: 1, hold: 0 },
};
const ORDER = ['intro', ...STEPS];
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const RIGHT = V(1, 0, 0);
const LEFT = V(-1, 0, 0);
/** The electrons: while joined, five go from B to A; while earthed, ten come up from the ground (even → B, odd → A). */
const JOIN_E = [0, 1, 2, 3, 4].map((i) => ({ start: i * 0.15, dur: 0.4 }));
const EARTH_E = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({ start: i * 0.05, dur: i % 2 ? 0.5 : 0.3, toA: i % 2 === 1 }));
const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const fmt = (x) => group(x);
  /** A value in volts or nJ as shown: whole numbers, "≈" when rounded. */
  const shown = (x) => `${isWhole(x) ? '' : '≈ '}${N(fmt(x))}`;
  /** "=" for a whole value, "≈" for a rounded one, to go before it in a sum. */
  const eq = (x) => (isWhole(x) ? '=' : '≈');

  root.classList.add('pvc', 'ep');
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
  lead.className = 'ep-lead';
  $('.pvc-act-row').before(lead);
  // the graph, under the result line
  const graphBox = document.createElement('div');
  graphBox.className = 'ep-graph';
  $('.pvc-outcome').after(graphBox);
  const graph = createGraph(graphBox, { t, N, fmt, colors: { work: COL.work, pot: COL.pot, shell: COL.shell, earth: COL.earth } });
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // an honest note while the electrons move: it really takes an instant
  const note = document.createElement('div');
  note.className = 'ep-note';
  note.textContent = t('note_slow');
  note.hidden = true;
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 30, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.2);
  sun.position.set(0.6, 1.4, 0.9);
  sun.target.position.set(0.25, 0.1, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55);
  fill.position.set(-1.2, 0.6, 1.2);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.004;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -0.5, right: 0.5, top: 0.35, bottom: -0.35, near: 0.8, far: 2.6 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const setting = createSetting(stage.renderer, N);
  const app = createApparatus();
  scene.add(setting.root, app.root);

  // the force arrows on the test charge: the repulsion (out from q, as the book) and the applied force (in, equal)
  const repArrow = boldArrow('Repulsion', COL.rep, ARROW_R, { order: 40 });
  const pushArrow = boldArrow('AppliedForce', COL.push, ARROW_R, { order: 44 });
  scene.add(repArrow.root, pushArrow.root);

  // r: a thin dark double arrow on the bench from A's centre to the test charge (as চিত্র ১০.১৪), and the line through
  // them, dashed, running on past the rail toward infinity
  const DIM_Z = 0.072;
  const dimMat = new THREE.MeshBasicMaterial({ color: '#2a3442', toneMapped: false });
  const dimShaft = new THREE.Mesh(new THREE.BoxGeometry(1, 0.0012, 0.0024), dimMat);
  const dimHeadGeo = new THREE.ConeGeometry(0.0045, 0.012, 12);
  dimHeadGeo.rotateZ(-Math.PI / 2); // pointing +x
  const dimHeadR = new THREE.Mesh(dimHeadGeo, dimMat);
  const dimHeadL = new THREE.Mesh(dimHeadGeo, dimMat);
  dimHeadL.rotation.y = Math.PI;
  const dimTick = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.0012, 0.022), dimMat);
  const dim = new THREE.Group();
  dim.name = 'DistanceR';
  dim.add(dimShaft, dimHeadR, dimHeadL, dimTick);
  dim.position.set(0, 0.0012, DIM_Z);
  dim.userData.noExport = true;
  scene.add(dim);
  const lineMat = new THREE.LineDashedMaterial({ color: '#e7eefc', dashSize: 0.008, gapSize: 0.006, transparent: true, opacity: 0.75 });
  const axisLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(R + 0.004, H, 0), V(0.42, H, 0)]), lineMat);
  axisLine.computeLineDistances();
  const infHead = new THREE.Mesh(
    new THREE.ConeGeometry(0.005, 0.014, 12).rotateZ(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#e7eefc', transparent: true, opacity: 0.85 }),
  );
  infHead.position.set(0.427, H, 0);
  const infinity = new THREE.Group();
  infinity.add(axisLine, infHead);
  infinity.userData.noExport = true;
  scene.add(infinity);

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
    quizKind: '',
    drag: null,
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const rNow = () => clampR(s.v.r);

  // ── the charges, the electrons and the potentials from the state ─────────────
  const ePts = Array.from({ length: 10 }, () => V(0, 0, 0));
  const live = { qa: Q_NC, qb: 0, va: 0, vb: 0, marksA: Q_NC, marksB: 0, eCount: 0, eFirst: V(0, 0, 0), eShown: false };
  function charges() {
    const v = s.v;
    let n = 0;
    let qa = Q_NC;
    let qb = 0;
    let marksA = Q_NC;
    let marksB = 0;
    if (v.ground <= 0) {
      // joined: five electrons from B's top along the wire into A. A bead is 1 nC: the charges and the potentials change
      // as each one arrives (150 V a step, always whole volts), so the labels and the columns change a few times, not every frame
      let arrived = 0;
      let left = 0;
      for (const e of JOIN_E) {
        const p = clamp01((v.flow - e.start) / e.dur);
        if (p >= 1) arrived++;
        if (p > 0) left++;
        if (p > 0 && p < 1) app.paths.join.getPoint(p, ePts[n++]);
      }
      qa = Q_NC - arrived;
      qb = arrived;
      marksA = qa;
      marksB = left;
    } else {
      // earthed: ten electrons up the cable, five stop in B, five go on over B and along the wire into A
      let gotA = 0;
      let gotB = 0;
      for (const e of EARTH_E) {
        const p = clamp01((v.ground - e.start) / e.dur);
        if (p >= 1) {
          if (e.toA) gotA++;
          else gotB++;
        }
        if (p > 0 && p < 1) (e.toA ? app.paths.toA : app.paths.toB).getPoint(p, ePts[n++]);
      }
      qa = Q_NC / 2 - gotA;
      qb = Q_NC / 2 - gotB;
      marksA = qa;
      marksB = qb;
    }
    const pv = twoSpheres(qa, qb);
    Object.assign(live, { qa, qb, va: pv.a, vb: v.b > 0.01 ? pv.b : potentialAt(B_X * 100), marksA, marksB, eCount: n });
    if (n) live.eFirst.copy(ePts[0]);
    return n;
  }

  // ── the scene from the state ────────────────────────────────────────────────
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  const thick = () => Math.min(3.2, Math.max(1, (3 * perPixel()) / ARROW_R));
  const P0 = V(0, 0, 0);
  /** The force arrows' length (m) at r cm: ∝ 1/r² (the book's Coulomb's law), F_LEN at 10 cm. */
  const forceLen = (r) => F_LEN * (R_MIN / r) ** 2;
  let noteNow = 'note_slow';
  function syncScene() {
    const v = s.v;
    const r = v.r;
    const x = r / 100;
    app.setR(r);
    app.setQ0Fade(v.q0);
    app.faceCamera(camera);
    app.setBFade(v.b);
    app.field.visible = v.lines > 0.02;
    app.field.scale.setScalar(0.85 + 0.15 * v.lines);
    for (const m of app.fieldMats) {
      m.transparent = true;
      m.opacity = v.lines;
    }
    app.shells.forEach((m, i) => {
      // one after the other, the nearest first; the 300 V shell, which runs through where B stands, waits for the wire
      const held = i === app.shells.length - 1 ? v.hold : 0;
      const k = Math.max(clamp01(v.shells * 3 - i), held);
      m.visible = k > 0.01;
      m.scale.setScalar(0.92 + 0.08 * k);
      app.shellMats[i].uniforms.opacity.value = Math.max(v.shells, held);
    });
    app.setWire(v.wire);
    app.setCable(v.cable);
    app.setCrow(v.crow);
    app.terminal.visible = v.b > 0.5;
    const n = charges();
    app.marksA.set(Math.round(live.marksA));
    app.marksB.set(v.b > 0.5 ? Math.round(live.marksB) : 0);
    app.setElectrons(ePts, n, camera);
    const noteKey = s.mode === 'quiz' ? '' : n > 0 ? 'note_slow' : v.crow > 0.5 ? 'note_crow' : '';
    note.hidden = !noteKey;
    if (noteKey && noteNow !== noteKey) note.textContent = t((noteNow = noteKey));
    // the forces on q₀: equal and opposite (constant speed), a little above and below its centre so both show
    const len = forceLen(r) * v.arrows;
    const k = thick();
    const showF = v.q0 > 0.5 && len > 0.004;
    repArrow.root.visible = showF;
    pushArrow.root.visible = showF;
    if (showF) {
      // both start or end at the bead's surface, so even the short arrows far out stay readable
      P0.set(x + Q0_R, H + 0.006, 0);
      repArrow.set(P0, RIGHT, len);
      repArrow.scale(k);
      P0.set(x + Q0_R + len, H - 0.006, 0);
      pushArrow.set(P0, LEFT, len);
      pushArrow.scale(k);
    }
    // r on the bench, and the line on toward infinity
    dim.visible = v.q0 > 0.5;
    if (dim.visible) {
      const head = 0.012;
      dimShaft.scale.x = Math.max(0.001, x - 2 * head);
      dimShaft.position.x = x / 2;
      dimHeadR.position.x = x - head / 2;
      dimHeadL.position.x = head / 2;
      dimTick.position.x = x;
    }
    infinity.visible = v.q0 > 0.5 && v.morph < 0.5;
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
    return { left: Math.min(A0.x, A1.x) - 6, top: Math.min(A0.y, A1.y) - 6, right: Math.max(A0.x, A1.x) + 6, bottom: Math.max(A0.y, A1.y) + 6 };
  };
  const arrowBoxes = () => [repArrow, pushArrow].filter((a) => a.root.visible).map(arrowBox);
  // the test charge's bead and sphere A's body: no label sits on them
  const bodyBox = (p, rad) => () => {
    if (!p()) return null;
    toScreen(p(), A0);
    const px = rad / perPixel();
    return { left: A0.x - px, top: A0.y - px, right: A0.x + px, bottom: A0.y + px };
  };
  const beadAt = V(0, H, 0);
  const aAt = V(0, H, 0);
  const sphereABox = bodyBox(() => aAt, R);
  const bAt = V(B_X, H, 0);
  const crowMid = V(0, 0, 0);
  /** @type {ReturnType<typeof createDragHandle> | null} */
  let handle = null;
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      arrowBoxes,
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotateEl),
      handleBoxes,
      bodyBox(() => (s.v.q0 > 0.5 ? beadAt.set(s.v.r / 100, H, 0) : null), Q0_R),
      sphereABox,
      bodyBox(() => (s.v.b > 0.5 ? bAt : null), R),
      bodyBox(() => (s.v.crow > 0.5 ? crowMid.set(app.crowAt.x, app.crowAt.y + 0.035, 0) : null), 0.055),
    ],
  });
  /** The drag handle with its word, and 6 px of air: a label that touches the word reads as one with it. */
  const airBoxes = [];
  function handleBoxes() {
    const list = handle?.box() ?? [];
    airBoxes.length = list.length;
    list.forEach((b, i) => {
      const o = airBoxes[i] || (airBoxes[i] = { left: 0, top: 0, right: 0, bottom: 0 });
      o.left = b.left - 6;
      o.top = b.top - 6;
      o.right = b.right + 6;
      o.bottom = b.bottom + 6;
    });
    return airBoxes;
  }
  function boxOf(el) {
    if (!el || el.hidden) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  /** A label's point: one vector of its own, filled in each frame (nothing new per frame). */
  const at = (fill) => {
    const p = V(0, 0, 0);
    return () => fill(p);
  };
  const spot = (dx, dy) => ({ dx, dy });
  const ABOVE = [spot(0, -26), spot(22, -26), spot(-22, -26), spot(0, -44)];
  const RIGHT_OF = [spot(22, 0), spot(22, -18), spot(22, 18)];
  const LEFT_OF = [spot(-22, 0), spot(-22, -18), spot(-22, 18)];
  const vAt = (r) => roundTo(potentialAt(r));
  const SHELL_AT = [0.45, 0.75, 0.6]; // the angle above the rail's line (rad) where each shell's label is pinned
  const LABELS = {
    q: {
      text: () => (s.v.b > 0.5 ? t('lbl_a', { v: shown(live.va) }) : t('lbl_q')),
      point: at((p) => p.set(-0.02, H + R * 0.9, 0)),
      color: COL.ink,
      spots: [...ABOVE, ...LEFT_OF, spot(-34, -30), spot(-44, 20)],
      optional: true,
      show: () => true,
    },
    // what A itself is at: just under it
    surface: {
      text: () => t('lbl_surface', { v: fmt(potentialAt(R * 100)) }),
      point: at((p) => p.set(0, H - R, 0)),
      color: COL.pot,
      spots: [spot(0, 22), spot(16, 24), spot(-14, 24), spot(30, 12), spot(0, 42)],
      optional: true, // the graph always shows it
      show: () => s.v.morph > 0.5 && s.v.b < 0.5 && s.v.q0 > 0.5 && !s.quizKind,
    },
    q0: {
      text: () => {
        if (s.step === 'intro' && !s.quizKind) return t('lbl_q0');
        if (s.quizKind === 'read' || (s.step === 'bring' && !s.quizKind)) return t('lbl_q0_w', { w: fmt(workTo(rNow())), eqw: eq(workTo(rNow())) });
        return t('lbl_here', { v: fmt(potentialAt(rNow())), eq: eq(potentialAt(rNow())) });
      },
      point: at((p) => p.set(s.v.r / 100, H + Q0_R, 0)),
      color: COL.ink,
      spots: [
        ...ABOVE,
        spot(46, -34),
        spot(30, -46),
        spot(70, -22),
        ...RIGHT_OF,
        spot(0, -66),
        spot(40, -64),
        spot(84, -44),
        spot(70, 14),
        spot(60, 40),
      ],
      show: () => s.v.q0 > 0.5 && !s.busy,
    },
    rep: {
      text: () => t('lbl_rep'),
      point: at((p) => p.copy(repArrow.tip)),
      color: COL.rep,
      spots: [spot(34, -24), spot(16, -30), spot(52, -8), spot(60, -30)],
      optional: true,
      show: () => repArrow.root.visible && forceLen(s.v.r) > 0.02,
    },
    push: {
      text: () => t('lbl_push'),
      point: at((p) => p.copy(pushArrow.root.position)),
      color: COL.push,
      spots: [spot(30, 24), spot(14, 32), spot(52, 12), spot(46, 40)],
      optional: true,
      show: () => pushArrow.root.visible && forceLen(s.v.r) > 0.02,
    },
    r: {
      text: () => t('lbl_r', { r: N(rNow()) }),
      point: at((p) => p.set(s.v.r * 0.0036, 0.002, DIM_Z)), // nearer A than the middle: clear of the drag handle's words
      color: COL.ink,
      spots: [spot(0, 18), spot(-30, 18), spot(-52, 12), spot(0, -18), spot(-30, -18), spot(0, 30), spot(-40, 30)],
      optional: true,
      show: () => s.v.q0 > 0.5 && s.v.r > 14,
    },
    inf: {
      text: () => t('lbl_inf'),
      point: at((p) => p.set(0.427, H, 0)),
      color: COL.ink,
      spots: [spot(-24, 24), spot(-8, 24), spot(-24, -24)],
      optional: true,
      show: () => infinity.visible && s.step === 'intro',
    },
    ...Object.fromEntries(
      SHELLS.map((cm, i) => [
        `shell${cm}`,
        {
          text: () => t('lbl_shell', { v: N(fmt(vAt(cm))) }),
          // where the shell meets a line up and to the right of A: clear of the rail and the test charge
          point: at((p) => p.set(Math.cos(SHELL_AT[i]) * (cm / 100), H + Math.sin(SHELL_AT[i]) * (cm / 100), 0)),
          color: COL.shell,
          spots: [spot(-14, -12), spot(-20, 0), spot(0, -20), spot(14, -14)],
          optional: true,
          show: () => (s.v.shells * 3 - i > 0.8 || (i === SHELLS.length - 1 && s.v.hold > 0.5)) && s.quizKind !== 'closer',
        },
      ]),
    ),
    b: {
      text: () => t('lbl_b', { v: shown(live.vb) }),
      point: at((p) => p.set(B_X + 0.02, H + R * 0.9, 0)),
      color: COL.ink,
      spots: [...ABOVE, ...RIGHT_OF, spot(30, -30), spot(26, 30)],
      show: () => s.v.b > 0.5,
    },
    crow: {
      text: () => t('lbl_crow', { v: shown(live.va) }),
      point: at((p) => p.set(app.crowAt.x + 0.02, app.crowAt.y + 0.075, 0)),
      color: COL.ink,
      spots: [spot(0, -22), spot(30, -16), spot(-30, -16)],
      show: () => s.v.crow > 0.95,
    },
    earth: {
      text: () => t('lbl_earth', { v: N(0) }),
      point: at((p) => p.set(app.term.x, 0.006, app.term.z)),
      color: COL.earth,
      spots: [spot(0, 24), spot(26, 18), spot(-26, 22)],
      show: () => s.v.b > 0.5 && (s.v.cable > 0.6 || s.step === 'crow'),
    },
    e: {
      text: () => t('lbl_e'),
      point: at((p) => p.copy(live.eFirst)),
      color: COL.e,
      spots: [spot(0, -22), spot(16, -20), spot(-16, -20)],
      optional: true,
      show: () => live.eCount > 0 && s.mode !== 'quiz',
    },
  };
  const textNow = new Map();
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      if (want && !anno.has(id)) {
        const text = L.text();
        textNow.set(id, text);
        anno.add(id, { text, point: L.point, kind: 'force', color: L.color, spots: L.spots, optional: L.optional });
      } else if (!want && anno.has(id)) anno.remove(id);
      else if (want) {
        const text = L.text();
        if (textNow.get(id) !== text) {
          textNow.set(id, text);
          anno.setText(id, text);
        }
      }
    }
  }

  // ── camera: a gentle three-quarter view over the bench ───────────────────────
  // from A's side, so A is big and near and the line runs away from it toward infinity; a second, wider pose for the
  // two spheres, the wire and the earth terminal
  const BOX_NEAR = new THREE.Box3(V(-0.075, 0.015, -0.045), V(0.385, H + R + 0.03, 0.1));
  const BOX_FAR = new THREE.Box3(V(-0.075, 0.015, -0.05), V(0.45, H + R + 0.1, 0.12));
  const DIR = V(-0.4, 0.34, 1).normalize();
  const pose = { target: V(0, 0, 0), dist: 1, dir: DIR.clone() };
  function fitPoses() {
    const d = DIR.clone();
    if (s.view === '3d' && !s.userMovedCamera) d.add(V(-0.7, 0.2, 0)).normalize();
    const box = TARGET[s.step].b > 0.5 ? BOX_FAR : BOX_NEAR;
    const a = fitPose({ box, dir: d, camera, width: stage.width, height: stage.height, margin: MARGIN });
    const moved = pose.target.distanceTo(a.target) > 1e-4 || Math.abs(pose.dist - a.position.distanceTo(a.target)) > 1e-4;
    pose.target.copy(a.target);
    pose.dist = a.position.distanceTo(a.target);
    pose.dir.copy(d);
    return moved;
  }
  const guided = { position: V(0, 0, 0), target: V(0, 0, 0) };
  function guidedPose() {
    guided.target.copy(pose.target);
    guided.position.copy(pose.target).addScaledVector(pose.dir, pose.dist);
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
    const wasFront = s.view === 'front';
    s.view = 'front';
    const moved = fitPoses();
    if (!wasFront) {
      syncUI();
      emit('view', { view: s.view });
    }
    if (!was && !moved && wasFront && camK >= 1) return Promise.resolve(true);
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
    zoom: [0.5, 2],
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
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
  });
  // the panel under the 3D (a phone held upright) or beside it: the figure's portrait rules apply only under it
  const panelEl = /** @type {HTMLElement} */ ($('.pvc-panel'));
  function syncLayout() {
    root.classList.toggle('ep-stack', panelEl.getBoundingClientRect().top > root.getBoundingClientRect().top + 20);
  }
  stage.onResize(() => {
    syncLayout();
    fitPoses();
    syncScene();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  const KEYS = Object.keys(TARGET.intro);
  const PANEL_MS = 66;
  let lastPanel = Number.NEGATIVE_INFINITY;
  /** Moves some of the values to where they go, together, over `duration` seconds. */
  function tweenTo(to, duration, my, curve = ease.inOutCubic) {
    const from = { ...s.v };
    return tweener
      .animate({
        key: 'step',
        duration,
        ease: curve,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const key of Object.keys(to)) s.v[key] = from[key] + (to[key] - from[key]) * k;
          // the 3D every frame; the words and the SVG graph 15 times a second (done() draws the last state)
          if (now() - lastPanel >= PANEL_MS) {
            lastPanel = now();
            syncLabels();
            drawGraph();
          }
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  const SNAP = ['flow', 'ground'];
  /** The plan from one step to another: a list of [values, seconds, ease], played one after the other. */
  function planFor(from, to) {
    const goal = TARGET[to];
    if (from === 'intro' && to === 'bring')
      return [
        [{ arrows: 1 }, T.arrows],
        [{ r: R_MIN }, T.bring * ((s.v.r - R_MIN) / (R_MAX - R_MIN)) + 0.2, ease.linear], // constant speed (সমবেগে)
      ];
    if (from === 'bring' && to === 'potential')
      return [
        [{ arrows: 0 }, T.hide],
        [{ morph: 1 }, T.morph],
        [{ shells: 1 }, T.shells],
      ];
    if (from === 'potential' && to === 'join')
      return [
        [{ hold: 1 }, 0.02],
        [{ arrows: 0, shells: 0, lines: 0, q0: 0 }, T.out],
        [{ b: 1 }, T.inB],
        [{}, T.hold],
        [{ hold: 0, wire: 1 }, T.wire],
        [{ flow: 1 }, T.flow, ease.linear],
      ];
    if (from === 'join' && to === 'crow') return [[{ crow: 1 }, T.crow, ease.outCubic]];
    if (from === 'crow' && to === 'earth')
      return [
        [{ crow: 0 }, T.away],
        [{ cable: 1 }, T.cable],
        [{}, 0.5],
        [{ ground: 1 }, T.ground, ease.linear],
      ];
    // a jump (a step word, back, or several at once): everything together; the electrons' runs are not replayed
    const first = {};
    for (const k of KEYS) if (!SNAP.includes(k) && goal[k] != null) first[k] = goal[k];
    return [[first, T.back]];
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
    cancelDrag();
    const my = s.run;
    s.step = step;
    hintOff();
    takeView(animate ? T.fly : 0);
    const goal = TARGET[step];
    if (!animate || from === step) {
      for (const k of KEYS) if (goal[k] != null) s.v[k] = goal[k];
      s.busy = false;
      done();
      return;
    }
    const plan = planFor(from, step);
    const jump = plan.length === 1 && plan[0][1] === T.back;
    // a jump lands the electrons' runs at once, before the fades: nothing shows the old charges on the way
    if (jump) for (const k of SNAP) s.v[k] = goal[k];
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    for (const [to, sec, curve] of plan) {
      if (!(await tweenTo(to, sec, my, curve))) return;
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

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_bring', 1, ICONS.hand],
    bring: ['act_potential', 2, ICONS.hand],
    potential: ['act_join', 3, ICONS.hand],
    join: ['act_crow', 4, ICONS.hand],
    crow: ['act_earth', 5, ICONS.hand],
    earth: ['act_quiz', '', ICONS.chevR],
  };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const steady = { lead: '', act: '' };
  function drawGraph() {
    const v = s.v;
    const r = rNow();
    if (v.b > 0.5) {
      graph.draw({
        mode: 'bars',
        bars: { a: roundTo(live.va), b: roundTo(live.vb) },
        aria: t('graph_aria_bars', { a: fmt(live.va), b: fmt(live.vb), zero: 0 }),
      });
      return;
    }
    if (s.step === 'intro' && !s.busy) {
      graph.draw({ mode: 'empty', aria: t('graph_aria_empty') });
      return;
    }
    const isV = v.morph > 0.001;
    graph.draw({
      mode: isV ? 'V' : 'W',
      r: v.r,
      morph: v.morph,
      shells: v.shells > 0.5,
      aria: isV ? t('graph_aria_v', { r, v: fmt(potentialAt(r)) }) : t('graph_aria_w', { r, w: fmt(workTo(r)) }),
    });
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm
      ? `<span class="ep-long">${t('intro')}</span><span class="ep-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead.includes('ep-long')
          ? ''
          : steady.lead
        : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('ep-calm', calm);
    }
    const r = rNow();
    const vars = { r, w: fmt(workTo(r)), eqw: eq(workTo(r)), v: fmt(potentialAt(r)), eq: eq(potentialAt(r)), q0: Q0_NC, one: 1 };
    let out = '';
    if (s.busy) out = t(`doing_${s.step}`);
    else if (!calm) {
      if (s.step === 'bring') out = t('out_bring', vars);
      else if (s.step === 'potential') out = t('out_potential', vars);
      else out = t(`out_${s.step}`, { v: shown(live.va), zero: 0 });
    }
    sheet.outcome(out);
    sheet.rule(calm || s.busy ? '' : t(`rule_${s.step}`, vars));
    sheet.choose(calm ? null : s.step);
    sheet.next({ intro: 'bring', bring: 'potential', potential: 'join', join: 'crow', crow: 'earth' }[s.step] ?? null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      if (step !== '' && enabled && s.mode === 'explore' && actionTarget()) action.show('scene');
      else action.hide('scene');
    }
    homeBtn.hidden = s.step === 'intro';
    homeBtn.disabled = s.busy;
    drawGraph();
    syncLabels();
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the part, a tap on it ────────────
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
  /** What the ring marks: the test charge (steps 1–2), the middle of where the wire goes, the earth terminal. */
  const TARGET_PT = V(0, 0, 0);
  function actionTarget() {
    if (s.step === 'intro' || s.step === 'bring') return TARGET_PT.set(s.v.r / 100, H, 0);
    if (s.step === 'potential') return TARGET_PT.set(B_X, H, 0); // where sphere B will stand
    if (s.step === 'join') return TARGET_PT.copy(app.crowAt);
    if (s.step === 'crow') return TARGET_PT.set(app.term.x, 0.01, app.term.z);
    return null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_bring',
    icon: ICONS.hand,
    target: actionTarget,
    radius: 24,
    pad: 8,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes(), () => handle?.box(), sphereABox],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── dragging the test charge along its rail ─────────────────────────────────
  const canDrag = () => s.mode === 'explore' && !s.busy && (s.step === 'bring' || s.step === 'potential');
  const footAt = V(0, 0, 0);
  handle = createDragHandle(stage, {
    point: () => footAt.set(s.v.r / 100, 0.004, 0.042),
    axis: 'x',
    track: { from: V(R_MIN / 100, 0.004, 0.042), to: V(R_MAX / 100, 0.004, 0.042) },
    label: t('drag_me'),
    labelAt: 'below',
    aria: t('aria_drag'),
    pulse: Boolean(o.coach),
    when: canDrag,
  });
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function onQ0(p) {
    if (s.v.q0 < 0.5) return false;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(app.hitMeshes, false).length > 0;
  }
  function setR(r) {
    const was = rNow();
    s.v.r = clampR(r);
    if (rNow() !== was) {
      if (rNow() % 5 === 0) audio.tick?.();
      syncScene();
      refresh();
      emitChange();
    }
  }
  /** Canvas pixels per cm along the rail, here (its direction on the screen). */
  const S0 = { x: 0, y: 0 };
  const S1 = { x: 0, y: 0 };
  function railOnScreen() {
    toScreen(V(s.v.r / 100, H, 0), S0);
    toScreen(V(s.v.r / 100 + 0.01, H, 0), S1);
    return { x: S1.x - S0.x, y: S1.y - S0.y };
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = hostXY(e);
      down = { x: p.x, y: p.y, at: now() };
      if (!canDrag() || !(handle.hit(p.x, p.y) || onQ0(p))) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      s.drag = { id: e.pointerId, x: p.x, y: p.y, r: s.v.r, axis: railOnScreen() };
      handle.markUsed();
      action.hide('drag');
      emit('dragstart', { part: 'q0' });
      e.preventDefault();
      e.stopPropagation();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (g && e.pointerId === g.id) {
      const p = hostXY(e);
      const a = g.axis;
      const cm = ((p.x - g.x) * a.x + (p.y - g.y) * a.y) / Math.max(0.01, a.x * a.x + a.y * a.y);
      setR(g.r + cm);
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const p = hostXY(e);
    ui.canvasHost.style.cursor = canDrag() && onQ0(p) ? 'grab' : '';
  });
  function endDrag(e) {
    const g = s.drag;
    if (!g || (e && e.pointerId !== g.id)) return;
    if (e) releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked;
    action.show('drag');
    emit('dragend', { part: 'q0', r: rNow() });
    refresh();
    emitChange();
  }
  function cancelDrag() {
    if (!s.drag) return;
    releasePointer(ui.canvasHost, s.drag.id);
    s.drag = null;
    controls.enabled = !s.locked;
    action.show('drag');
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const wasDrag = Boolean(s.drag);
    endDrag(e);
    if (!down || wasDrag) return;
    const p = hostXY(e);
    const moved = Math.hypot(p.x - down.x, p.y - down.y);
    const quick = now() - down.at < 600;
    down = null;
    if (moved > 8 || !quick || s.mode !== 'explore') return;
    // a tap on the ringed part is the action
    const target = actionTarget();
    if (!target) return;
    toScreen(target, A0);
    if (Math.hypot(A0.x - p.x, A0.y - p.y) < 44 || (s.step === 'intro' && onQ0(p))) doAction();
  });
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── how to use, in the panel ────────────────────────────────────────────────
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'drag', axis: 'x', text: t('howto_drag'), handle, when: () => s.step === 'bring' || s.step === 'potential' },
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
    const r = rNow();
    return {
      step: s.step,
      r,
      work: roundTo(workTo(r), 1), // nJ, from infinity
      potential: roundTo(potentialAt(r), 1), // V
      va: roundTo(live.va, 1),
      vb: roundTo(live.vb, 1),
      qa: roundTo(live.qa, 2),
      qb: roundTo(live.qb, 2),
      busy: s.busy,
      next: { intro: 'bring', bring: 'potential', potential: 'join', join: 'crow', crow: 'earth', earth: 'quiz' }[s.step],
      view: s.view,
      mode: s.mode,
      question: s.mode === 'quiz' && question ? { kind: question.kind, right: question.right } : null,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.r, snap.busy, snap.mode, snap.view]);
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
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ep-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  let learnSaved = null;
  /** @type {{ kind: string, r: number } | null} */
  let question = null;
  let picked = -1;
  const volts = (x) => `${N(fmt(x.v))}&nbsp;V`;
  const KINDS = ['read', 'closer', 'double', 'equal', 'earth'];
  const SCENE_OF = { read: 'bring', closer: 'potential', double: 'potential', equal: 'join', earth: 'join' };
  const R_OF = { read: [15, 20, 30], closer: [20, 30], double: [10, 20, 30] };

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
        cancelDrag();
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
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        s.quizKind = kind;
        const r = R_OF[kind] ? pick(R_OF[kind]) : R_MAX;
        await go(SCENE_OF[kind], { animate: false });
        if (R_OF[kind]) s.v.r = r;
        if (kind === 'read') s.v.arrows = 0;
        if (kind === 'closer' || kind === 'double') s.v.shells = 0;
        if (kind === 'earth') s.v.cable = 1;
        syncScene();
        syncLabels();
        stage.invalidate();
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        question = { kind, r, right: -1 };
        const vars = { q0: Q0_NC, q1: Q0_NC * 2, r2: r / 2 };
        const asked =
          kind === 'equal'
            ? choicesOf(
                ['c_eq_stop', 'c_eq_big', 'c_eq_ab', 'c_eq_ba'].map((key) => ({ key })),
                kind,
                (x) => t(x.key),
              )
            : choicesOf(choicesFor(kind, r), kind, volts);
        question.right = asked.expected;
        return { text: t(`q_${kind}`, vars), ...asked };
      },
      reveal(q, correct) {
        const k = question.kind;
        const r = question.r;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        const vars = { q0: Q0_NC, w: fmt(workTo(r)), v: fmt(potentialAt(r)) };
        if (k === 'read') return t('why_read', vars) + note({ w: 'mis_read_w', times: 'mis_read_times', twice: 'mis_read_twice' });
        if (k === 'closer')
          return (
            t('why_closer', { v: fmt(potentialAt(r / 2)) }) + note({ half: 'mis_closer_half', square: 'mis_closer_square', same: 'mis_closer_same' })
          );
        if (k === 'double')
          return t('why_double', vars) + note({ doubled: 'mis_double_doubled', half: 'mis_double_other', square: 'mis_double_other' });
        if (k === 'equal') return t('why_equal') + note({ c_eq_big: 'mis_eq_big', c_eq_ab: 'mis_eq_flow', c_eq_ba: 'mis_eq_flow' });
        return t('why_earth', { zero: 0 }) + note({ same: 'mis_earth_same', half: 'mis_earth_half', start: 'mis_earth_start' });
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
    const onButton = Boolean(tgt.closest('button')) && !tgt.closest('.pvc-dh');
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if ((k === 'ArrowRight' || k === 'ArrowLeft') && !onButton) {
      // the arrows move the test charge along its rail (left: closer to q)
      if (!canDrag()) return;
      handle.markUsed();
      setR(rNow() + (k === 'ArrowRight' ? 1 : -1));
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncLayout();
  fitPoses();
  syncUI();
  applyCamera();
  syncScene();
  refresh();
  // the parts of later steps are hidden now: compile their shaders ahead, so the first tap of each step doesn't stall
  stage.warmUp?.({
    show: [app.B.group, app.wire, app.crow, app.cable, app.terminal, app.eBeads, app.eSigns, ...app.shells, app.marksB.disc, app.marksB.plus],
  });
  const ready = (async () => {
    if (o.step !== 'intro' && o.step in TARGET) await go(o.step, { animate: false });
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
    /** Change any of: step ('intro' | 'bring' | 'potential' | 'join' | 'crow' | 'earth'), r (cm, 10 … 30: moves the test charge;
     * in the first steps only), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step) await go(p.step, { animate });
      if (p.r != null && s.mode === 'explore' && (s.step === 'intro' || s.step === 'bring' || s.step === 'potential')) {
        s.v.r = clampR(Number(p.r));
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
      handle.rearm?.();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The apparatus in metres: sphere A with its + marks, the test charge on its rail, sphere B, the wire, the earth. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'ElectricPotential';
      const copy = app.root.clone(true);
      copy.traverse((ob) => {
        ob.visible = true;
        if (ob.isInstancedMesh) ob.count = ob.instanceMatrix.count;
      });
      g.add(copy, setting.rule.clone(true));
      return g;
    },
  };
}
