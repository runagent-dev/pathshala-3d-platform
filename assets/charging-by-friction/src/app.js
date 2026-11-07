// Static electricity by rubbing (book pages 274–275, topic 10.2), student view. On a plain table in a calm blue setting:
// a glass rod and a piece of silk, a plastic rod and a piece of flannel, each rod lying on two wooden V-blocks with the
// cloth draped over its end; behind them two lab stands, each with a rod hanging from a silk thread tied at its middle.
// Charges are signs (red +, blue −, always with the sign drawn): every body starts neutral (equal + and −); rubbing (a
// tap, or dragging the cloth back and forth) moves electrons only, glass → silk and flannel → plastic, as the book
// says. Then চিত্র ১০.০৩: the rubbed rod is held near a hanging one (a tap, or dragging the rod) and the hanging rod
// turns away (like charges) or toward it (unlike), from a real Coulomb torque about the thread (./physics.js), with
// outlined force arrows. Five experiments in the book's order, each in two taps (look, then do), a calm first card,
// one lead-in line, one result and one rule per step; the kit's how-to row; a five-question test.
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
import { boldArrow } from './arrows.js';
import { createBench } from './bench.js';
import { fitPose } from './camera.js';
import { createCharges } from './charges.js';
import { createI18n } from './i18n.js';
import { CLOTH, HANG_CHARGE, HELD, HELD_CHARGE, ROD, STAND, STATION, TABLE } from './layout.js';
import { COUNTS, chargeOf, movedAfter, settle, step as swingStep, still, SWING, torqueY } from './physics.js';

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

const BG = ['#0b2a5b', '#123d7a'];
const FORCE = '#0ca678';
const INK = '#1d2733';
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 52, bottom: 14, side: 12 };
const STROKE = 0.8; // s per stroke when the figure rubs
const ARROW_FROM = 0.35; // how near the rod in the hand comes (0…1) before the force arrows show
// how long things take (s): slow enough to follow
const T = { fly: 1.8, signs: 1, carry: 2.2, near: 2.4, back: 1.3, hold: 1.4, jump: 1.6 };

/** The steps: the intro, then each of the book's five experiments in two steps (look, then do it). */
export const PHASES = ['intro', 'glass0', 'glass', 'plastic0', 'plastic', 'pp0', 'pp', 'nn0', 'nn', 'pn0', 'pn'];
export const ITEMS = ['glass', 'plastic', 'pp', 'nn', 'pn'];
const itemOf = (phase) => (phase === 'intro' ? null : phase.replace(/0$/, ''));

/**
 * Where each step ends. signsG / signsP: the signs on the glass and silk / plastic and flannel (0…1); rubG / rubP:
 * strokes rubbed (0…4); hangA / hangB: the hanging glass / plastic charged (0…1); gAt: the glass rod on its blocks (0),
 * at stand A (1), at stand B (2); pAt: the plastic rod on its blocks (0), at stand B (1); gNear / pNear: how close the
 * rod in the hand is (0 far, 1 near).
 */
const ZERO = { signsG: 0, signsP: 0, rubG: 0, rubP: 0, hangA: 0, hangB: 0, gAt: 0, pAt: 0, gNear: 0, pNear: 0 };
const TARGET = {
  intro: { ...ZERO },
  glass0: { ...ZERO, signsG: 1 },
  glass: { ...ZERO, signsG: 1, rubG: 4 },
  plastic0: { ...ZERO, signsG: 1, rubG: 4, signsP: 1 },
  plastic: { ...ZERO, signsG: 1, rubG: 4, signsP: 1, rubP: 4 },
  pp0: { ...ZERO, signsG: 1, rubG: 4, signsP: 1, rubP: 4, hangA: 1, gAt: 1 },
  pp: { ...ZERO, signsG: 1, rubG: 4, signsP: 1, rubP: 4, hangA: 1, gAt: 1, gNear: 1 },
  nn0: { ...ZERO, signsG: 1, rubG: 4, signsP: 1, rubP: 4, hangA: 1, hangB: 1, gAt: 1, pAt: 1 },
  nn: { ...ZERO, signsG: 1, rubG: 4, signsP: 1, rubP: 4, hangA: 1, hangB: 1, gAt: 1, pAt: 1, pNear: 1 },
  pn0: { ...ZERO, signsG: 1, rubG: 4, signsP: 1, rubP: 4, hangA: 1, hangB: 1, gAt: 2 },
  pn: { ...ZERO, signsG: 1, rubG: 4, signsP: 1, rubP: 4, hangA: 1, hangB: 1, gAt: 2, gNear: 1 },
};
const KEYS = Object.keys(ZERO);
/** The camera's frame in each step. */
const FRAME_OF = {
  intro: 'all',
  glass0: 'glass',
  glass: 'glass',
  plastic0: 'plastic',
  plastic: 'plastic',
  pp0: 'A',
  pp: 'A',
  nn0: 'B',
  nn: 'B',
  pn0: 'B',
  pn: 'B',
};
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'cf');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: ITEMS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'replay', label: 'act_replay', icon: ICONS.play },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      tight: true,
      lines: { action: 2, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const lead = document.createElement('p');
  lead.className = 'cf-lead';
  $('.pvc-act-row').before(lead);
  // what has been found so far, under the result: + and +, − and −, + and − (each with its force once seen)
  const found = document.createElement('p');
  found.className = 'cf-found';
  $('.pvc-rule').before(found);
  const sg = (q) => `<span class="cf-sg ${q > 0 ? 'p' : 'n'}">${q > 0 ? ICONS.plus : ICONS.minus}</span>`;
  const PAIRS3 = [
    ['pp', 1, 1],
    ['nn', -1, -1],
    ['pn', 1, -1],
  ];
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 20, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.1);
  sun.position.set(0.7, 1.6, 0.9);
  sun.target.position.set(0, 0.1, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.6);
  fill.position.set(-1.4, 0.8, 1.2);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.003;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -0.55, right: 0.55, top: 0.45, bottom: -0.45, near: 0.9, far: 2.9 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const bench = createBench();
  scene.add(bench.root);
  const { rods, cloths, hangers } = bench;
  const charges = createCharges({ max: 64 });
  scene.add(charges.root);

  // the force arrows: on the hanging rod's end and on the tip of the rod in the hand (equal and opposite)
  const ARROW_R = 0.003;
  const fHang = boldArrow('ForceOnHanging', FORCE, ARROW_R, { order: 40 });
  const fHeld = boldArrow('ForceOnHeld', FORCE, ARROW_R, { order: 40 });
  scene.add(fHang.root, fHeld.root);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    phase: 'intro',
    v: { ...TARGET.intro },
    cloth: { silk: 0, flannel: 0 }, // each cloth's offset from its rest place along the rod (m)
    frame: 'all',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    freeze: false, // the test: the hanging rods held still until the answer
    hideHang: false, // the test: the signs of the hanging rod in view hidden ("?")
    quizKind: '',
    dragging: '',
  };
  const swing = { A: { theta: 0, omega: 0 }, B: { theta: 0, omega: 0 } };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── where the rods are, from the state ────────────────────────────────────────────────────────────────────────
  const tipNear = { A: STAND.A.clone().add(HELD.near), B: STAND.B.clone().add(HELD.near) };
  const HAND_Q = new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), HELD.toHand.clone().negate());
  const tmpQ = new THREE.Quaternion();
  const P1 = V(0, 0, 0);
  const P2 = V(0, 0, 0);
  /** A rod's pose at a place: 'blocks' (on its station), or held at a stand, `near` 0…1 (its tip `reach` m back at 0). */
  function poseAt(place, station, near, outPos, outQ) {
    if (place === 'blocks') {
      outPos.copy(STATION[station]);
      outQ.identity();
      return;
    }
    // the rod's centre is half a rod behind its tip, toward the hand
    outPos.copy(tipNear[place]).addScaledVector(HELD.toHand, (1 - near) * HELD.reach + ROD.half);
    outQ.copy(HAND_Q);
  }
  /** Places a rod from `at` (0…n between the places in `places`), with a lift between the blocks and a stand. */
  function placeRod(rod, places, station, at, near) {
    const i = Math.max(0, Math.min(places.length - 1, Math.floor(at)));
    const j = Math.min(places.length - 1, i + 1);
    const k = at - i;
    poseAt(places[i], station, places[i] === 'blocks' ? 0 : near, P1, rod.quaternion);
    if (k > 1e-6 && j !== i) {
      poseAt(places[j], station, places[j] === 'blocks' ? 0 : near, P2, tmpQ);
      const e = ease.inOutCubic(k);
      rod.position.lerpVectors(P1, P2, e);
      rod.position.y += 0.08 * Math.sin(Math.PI * e); // lifted over the table, not dragged through things
      rod.quaternion.slerp(tmpQ, e);
    } else rod.position.copy(P1);
    rod.updateMatrixWorld();
  }
  const G_PLACES = ['blocks', 'A', 'B'];
  const P_PLACES = ['blocks', 'B'];
  function placeRods() {
    placeRod(rods.glass, G_PLACES, 'glass', s.v.gAt, s.v.gNear);
    placeRod(rods.plastic, P_PLACES, 'plastic', s.v.pAt, s.v.pNear);
    bench.placeCloth('silk', CLOTH.rest + s.cloth.silk);
    bench.placeCloth('flannel', CLOTH.rest + s.cloth.flannel);
    hangers.A.rotation.y = swing.A.theta;
    hangers.B.rotation.y = swing.B.theta;
    hangers.A.updateMatrixWorld();
    hangers.B.updateMatrixWorld();
  }

  // ── charges: each a sign that follows a body (and the electrons that move, from one body to the other) ─────────
  const moved = {
    glass: () => movedAfter(s.v.rubG),
    plastic: () => movedAfter(s.v.rubP),
  };
  const net = {
    glass: () => moved.glass() / COUNTS.moved, // +1 when fully rubbed
    plastic: () => -moved.plastic() / COUNTS.moved,
  };
  const PAIR_X = [-0.095, -0.052, 0.048, 0.073, 0.098, 0.121]; // along a rod: two pairs at the plain end, four where it is rubbed
  const PAIR_DY = 0.0056;
  const CLOTH_COLS = [-0.03, -0.01, 0.01, 0.03];
  const CR = ROD.r + 0.002; // a cloth's surface round the rod
  const W = V(0, 0, 0);
  const W2 = V(0, 0, 0);
  /** A sign fixed on a body. */
  function fixed(sign, body, x, y, z, vis) {
    const local = V(x, y, z);
    charges.add(sign, (out) => {
      const k = vis();
      if (k <= 0) return 0;
      out.copy(local);
      body.localToWorld(out);
      return k;
    });
  }
  /** An electron that hops from one body to another as `progress()` goes 0 → 1. */
  function hopper(fromBody, from, toBody, to, progress, vis) {
    const a = V(...from);
    const b = V(...to);
    charges.add('-', (out) => {
      const k = vis();
      if (k <= 0) return 0;
      const p = progress();
      W.copy(a);
      fromBody.localToWorld(W);
      if (p <= 0) {
        out.copy(W);
        return k;
      }
      W2.copy(b);
      toBody.localToWorld(W2);
      const e = ease.inOutCubic(Math.min(1, p));
      out.lerpVectors(W, W2, e);
      out.y += 0.03 * Math.sin(Math.PI * e);
      return k * (1 + 0.25 * Math.sin(Math.PI * e)); // a little larger in flight, so the eye follows it
    });
  }
  // the signs at the rubbing places show while the camera is there (or over the whole table); a rod in the hand keeps
  // its signs wherever it goes
  const atStations = () => s.frame === 'all' || s.frame === 'glass' || s.frame === 'plastic';
  const visG = () => (s.v.gAt > 0.01 || atStations() ? s.v.signsG : 0);
  const visP = () => (s.v.pAt > 0.01 || atStations() ? s.v.signsP : 0);
  const visSilk = () => (atStations() ? s.v.signsG : 0);
  const visFlannel = () => (atStations() ? s.v.signsP : 0);
  // the glass rod: six + always; its − stay, except three that go to the silk
  const GLASS_OUT = [4, 3, 5]; // the pairs whose electron leaves, in order
  PAIR_X.forEach((x, i) => {
    fixed('+', rods.glass, x, PAIR_DY, 0, visG);
    if (!GLASS_OUT.includes(i)) fixed('-', rods.glass, x, -PAIR_DY, 0, visG);
  });
  // the silk: four neutral pairs on its front skirt, and room for the three electrons from the glass
  CLOTH_COLS.forEach((x) => {
    fixed('+', cloths.silk, x, -0.017, CR + 0.005, visSilk);
    fixed('-', cloths.silk, x, -0.028, CR + 0.009, visSilk);
  });
  GLASS_OUT.forEach((pi, i) => {
    hopper(
      rods.glass,
      [PAIR_X[pi], -PAIR_DY, 0],
      cloths.silk,
      [[-0.02, 0, 0.02][i], -0.033, CR + 0.026],
      () => Math.max(0, Math.min(1, moved.glass() - i)),
      () => (moved.glass() - i >= 1 ? visSilk() : visG()),
    );
  });
  // the plastic rod: six neutral pairs, and room for three electrons from the flannel between its rubbed pairs
  PAIR_X.forEach((x) => {
    fixed('+', rods.plastic, x, PAIR_DY, 0, visP);
    fixed('-', rods.plastic, x, -PAIR_DY, 0, visP);
  });
  // the flannel: four +, one − that stays; three electrons go to the plastic
  const FLANNEL_OUT = [1, 2, 0];
  CLOTH_COLS.forEach((x, c) => {
    fixed('+', cloths.flannel, x, -0.017, CR + 0.005, visFlannel);
    if (!FLANNEL_OUT.includes(c)) fixed('-', cloths.flannel, x, -0.028, CR + 0.009, visFlannel);
  });
  FLANNEL_OUT.forEach((c, i) => {
    hopper(
      cloths.flannel,
      [CLOTH_COLS[c], -0.028, CR + 0.009],
      rods.plastic,
      [[0.0605, 0.0855, 0.1095][i], 0, ROD.r + 0.001],
      () => Math.max(0, Math.min(1, moved.plastic() - i)),
      () => (moved.plastic() - i >= 1 ? visP() : visFlannel()),
    );
  });
  // the hanging rods, charged "the same way": the glass with three electrons gone, the plastic with three more
  const visA = () => (s.hideHang || s.frame !== 'A' ? 0 : s.v.hangA);
  const visB = () => (s.hideHang || s.frame !== 'B' ? 0 : s.v.hangB);
  PAIR_X.forEach((x, i) => {
    fixed('+', rods.hangGlass, x, PAIR_DY, 0, visA);
    if (!GLASS_OUT.includes(i)) fixed('-', rods.hangGlass, x, -PAIR_DY, 0, visA);
    fixed('+', rods.hangPlastic, x, PAIR_DY, 0, visB);
    fixed('-', rods.hangPlastic, x, -PAIR_DY, 0, visB);
  });
  for (const x of [0.0605, 0.0855, 0.1095]) fixed('-', rods.hangPlastic, x, 0, ROD.r + 0.001, visB);

  // ── the swing of the hanging rods: Coulomb's law between the charges, a weak twist of the thread ─────────────────
  const C3 = { A: [STAND.A.x, STAND.A.y, STAND.A.z], B: [STAND.B.x, STAND.B.y, STAND.B.z] };
  // the charges of the rod in the hand: fixed arrays, filled in place (nothing allocated per frame)
  const MAX_HELD = 2 * HELD_CHARGE.n;
  const slots = (n, make) => Array.from({ length: n }, make);
  const heldPts = { A: slots(MAX_HELD, () => [0, 0, 0]), B: slots(MAX_HELD, () => [0, 0, 0]) };
  const heldQs = { A: slots(MAX_HELD, () => 0), B: slots(MAX_HELD, () => 0) };
  const nHeld = { A: 0, B: 0 };
  const scratch = [];
  const TIP = V(0, 0, 0);
  const AXIS = V(0, 0, 0);
  /** The charges of the rods near each stand now (the rod in the hand: its rubbed part, from its tip). */
  function gatherHeld() {
    nHeld.A = 0;
    nHeld.B = 0;
    addHeld('A', 'glass', net.glass(), weight(s.v.gAt, 1));
    addHeld('B', 'glass', net.glass(), weight(s.v.gAt, 2));
    addHeld('B', 'plastic', net.plastic(), weight(s.v.pAt, 1));
  }
  const weight = (at, place) => Math.max(0, 1 - Math.abs(at - place) * 2);
  function addHeld(id, rod, q, w) {
    if (!(w > 0) || !q || nHeld[id] + HELD_CHARGE.n > MAX_HELD) return;
    rods[rod].updateMatrixWorld();
    TIP.set(ROD.half, 0, 0);
    rods[rod].localToWorld(TIP);
    AXIS.set(-1, 0, 0).applyQuaternion(rods[rod].quaternion); // from the tip back toward the hand
    for (let j = 0; j < HELD_CHARGE.n; j++) {
      const d = (HELD_CHARGE.len * j) / (HELD_CHARGE.n - 1);
      const p = heldPts[id][nHeld[id]];
      p[0] = TIP.x + AXIS.x * d;
      p[1] = TIP.y + AXIS.y * d;
      p[2] = TIP.z + AXIS.z * d;
      heldQs[id][nHeld[id]] = (q * w) / HELD_CHARGE.n;
      nHeld[id]++;
    }
  }
  const hangQ = { A: () => s.v.hangA, B: () => -s.v.hangB };
  const hangOf = { A: { ...HANG_CHARGE, q: 0 }, B: { ...HANG_CHARGE, q: 0 } };
  const torqueOf = (id) => (theta) => {
    if (!nHeld[id]) return 0;
    hangOf[id].q = hangQ[id]();
    return torqueY(C3[id], hangOf[id], theta, heldPts[id], heldQs[id], scratch, nHeld[id]);
  };
  const torque = { A: torqueOf('A'), B: torqueOf('B') };
  let acc = 0;
  stage.addTicker((dt) => {
    if (s.freeze) return false;
    placeRods();
    gatherHeld();
    acc += dt;
    let n = 0;
    while (acc >= SWING.dt && n < 40) {
      acc -= SWING.dt;
      n++;
      swingStep(swing.A, torque.A);
      swingStep(swing.B, torque.B);
    }
    if (acc > SWING.dt) acc = 0;
    return !(still(swing.A, torque.A) && still(swing.B, torque.B));
  });
  /** Both hanging rods at rest at once (for jumps without animation). */
  function settleSwings() {
    placeRods();
    gatherHeld();
    for (const id of ['A', 'B']) {
      swing[id].theta = s.freeze ? 0 : settle(torque[id], swing[id].theta);
      swing[id].omega = 0;
    }
    placeRods();
  }
  /** The electric force on the hanging rod at a stand (x, z), as the sum over its charges. */
  const F = V(0, 0, 0);
  function forceOn(id) {
    F.set(0, 0, 0);
    const pts = heldPts[id];
    if (!nHeld[id]) return F;
    const q = hangQ[id]() / HANG_CHARGE.n;
    const cs = Math.cos(swing[id].theta);
    const sn = Math.sin(swing[id].theta);
    const e2 = SWING.soft * SWING.soft;
    for (let i = 0; i < HANG_CHARGE.n; i++) {
      const sx = HANG_CHARGE.from + ((HANG_CHARGE.to - HANG_CHARGE.from) * i) / (HANG_CHARGE.n - 1);
      const px = C3[id][0] + sx * cs;
      const pz = C3[id][2] - sx * sn;
      for (let j = 0; j < nHeld[id]; j++) {
        const dx = px - pts[j][0];
        const dy = C3[id][1] - pts[j][1];
        const dz = pz - pts[j][2];
        const r2 = dx * dx + dy * dy + dz * dz + e2;
        const f = (q * heldQs[id][j]) / (r2 * Math.sqrt(r2));
        F.x += f * dx;
        F.z += f * dz;
      }
    }
    return F;
  }
  /** The force between the rods when the rod in the hand is right up close (for the arrows' scale). */
  let F_REF = 1;
  {
    const saved = { ...s.v };
    Object.assign(s.v, TARGET.pp);
    placeRods();
    gatherHeld();
    F_REF = forceOn('A').length() || 1;
    Object.assign(s.v, saved);
    placeRods();
  }
  /** Which stand the student is looking at, and the rod in the hand there. */
  function activeStand() {
    if (s.frame === 'A') return { id: 'A', rod: 'glass', near: 'gNear' };
    if (s.frame === 'B') return s.v.gAt > 1.5 ? { id: 'B', rod: 'glass', near: 'gNear' } : { id: 'B', rod: 'plastic', near: 'pNear' };
    return null;
  }
  const END = V(0, 0, 0);
  const DIR = V(0, 0, 0);
  /** 'away' | 'toward' | 'still': how the hanging rod at a stand has turned, as seen from the rod in the hand. */
  function swingKind(id) {
    const th = swing[id].theta;
    if (Math.abs(th) < (8 * Math.PI) / 180) return 'still';
    const tip = tipNear[id];
    const end = (a) => [C3[id][0] - ROD.half * Math.cos(a), C3[id][2] + ROD.half * Math.sin(a)];
    const [x0, z0] = end(0);
    const [x1, z1] = end(th);
    const d0 = Math.hypot(x0 - tip.x, z0 - tip.z);
    const d1 = Math.hypot(x1 - tip.x, z1 - tip.z);
    return d1 > d0 ? 'away' : 'toward';
  }
  function syncArrows() {
    const st = activeStand();
    fHang.root.visible = false;
    fHeld.root.visible = false;
    if (!st || s.quizKind === 'predict' || s.quizKind === 'unknown' || s.busy === 'carry') return;
    // the arrows come in as the rod comes near, never before: they would give the answer away
    if (s.v[st.near] < ARROW_FROM) return;
    const f = forceOn(st.id);
    const mag = f.length();
    const len = Math.min(0.075, 0.09 * Math.min(1, mag / F_REF));
    if (len < 0.012) return;
    DIR.copy(f).normalize();
    // a pull is drawn lying on the rod it acts on, its head at the rod's end, so it never reaches across to the other rod
    const back = swingForce() === 'attract' ? -len : 0;
    // on the hanging rod: at its charged end, pointing the way it is pushed or pulled
    END.set(ROD.half - 0.012, 0, 0);
    rods[st.id === 'A' ? 'hangGlass' : 'hangPlastic'].localToWorld(END);
    END.addScaledVector(DIR, back);
    END.y += 0.019; // just over the rod it acts on
    fHang.set(END, DIR, len);
    // on the rod in the hand: equal and opposite, at its tip
    TIP.set(ROD.half - 0.012, 0, 0);
    rods[st.rod].localToWorld(TIP);
    DIR.negate();
    TIP.addScaledVector(DIR, back);
    TIP.y -= 0.028; // just under the rod it acts on, clear of its signs
    fHeld.set(TIP, DIR, len);
  }

  // ── camera: a gentle three-quarter view of each place, flown between ──────────────────────────────────────────
  const dirOf = (az, el) => {
    const a = THREE.MathUtils.degToRad(az);
    const e = THREE.MathUtils.degToRad(el);
    return V(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
  };
  const stBox = (st) => new THREE.Box3(V(st.x - 0.13, -0.004, st.z - 0.035), V(st.x + 0.135, 0.058, st.z + 0.06));
  // beside a panel: the rod in the hand's whole way in view; a phone held upright: the working end and the hanging rod
  const standBox = (c) => new THREE.Box3(V(c.x - 0.4, c.y - 0.1, c.z - 0.1), V(c.x + 0.15, c.y + 0.05, c.z + 0.3));
  const standTall = (c) => new THREE.Box3(V(c.x - 0.3, c.y - 0.08, c.z - 0.1), V(c.x + 0.14, c.y + 0.04, c.z + 0.26));
  const FRAMES = {
    all: { box: new THREE.Box3(V(TABLE.x0 + 0.03, 0, TABLE.z0 + 0.04), V(TABLE.x1 - 0.03, 0.36, TABLE.z1 - 0.03)), dir: dirOf(16, 30) },
    glass: { box: stBox(STATION.glass), dir: dirOf(18, 27) },
    plastic: { box: stBox(STATION.plastic), dir: dirOf(18, 27) },
    // a phone held upright looks from the other side, so the rod in the hand runs up the narrow view, not off its edge
    A: { box: standBox(STAND.A), tall: standTall(STAND.A), dir: dirOf(16, 34), tallDir: dirOf(-14, 34) },
    B: { box: standBox(STAND.B), tall: standTall(STAND.B), dir: dirOf(16, 34), tallDir: dirOf(-14, 34) },
  };
  function poseOf(frame) {
    const f = FRAMES[frame];
    const tall = f.tall && root.classList.contains('cf-stack');
    return fitPose({ box: tall ? f.tall : f.box, dir: tall ? f.tallDir : f.dir, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  let camK = 1;
  let camFrom = null;
  function applyCamera() {
    if (s.userMovedCamera) return;
    const g = poseOf(s.frame);
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
  /** The guided camera flies to a frame (taking the view back from the student). Settles when it arrives. */
  function fly(frame, duration = T.fly) {
    const took = s.userMovedCamera;
    if (took) {
      s.userMovedCamera = false;
      rotate.home();
    }
    if (s.view !== 'front') {
      s.view = 'front';
      syncUI();
      emit('view', { view: s.view });
    }
    const same = frame === s.frame && !took && camK >= 1;
    s.frame = frame;
    if (same) return Promise.resolve(true);
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    if (!duration) {
      camK = 1;
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
  function turnedByHand() {
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
    label: t('rotate_me'),
    pulse: Boolean(o.coach),
    zoom: [0.5, 2.2],
    when: () => s.mode !== 'quiz',
    onTurn: turnedByHand,
  });
  function setView(view, { animate = true } = {}) {
    if (view === '3d') {
      // a little more from the side, so the depth shows
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
      return Promise.resolve(true);
    }
    return fly(s.frame, animate ? T.fly : 0);
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    placeRods();
    gatherHeld();
    syncArrows();
    charges.update(camera, stage.height, stage.width);
  });
  // the panel under the 3D (a phone held upright) or beside it: the figure's portrait rules apply only under it
  const panelEl = /** @type {HTMLElement} */ ($('.pvc-panel'));
  function syncLayout() {
    const stack = panelEl.getBoundingClientRect().top > root.getBoundingClientRect().top + 20;
    root.classList.toggle('cf-stack', stack);
  }
  stage.onResize(() => {
    syncLayout();
    refresh();
  });

  // ── labels on the picture: short names, each pinned beside what it names ─────────────────────────────────────
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      rotate.el,
      $('.pvc-panel-toggle'),
      () => action?.box(),
      () => action?.ringBox(),
      () => clothHandle.box(),
      () => rodHandle.box(),
      () => arrowBoxes(),
      () => charges.boxes(),
    ],
  });
  const tmp = V(0, 0, 0);
  const A0 = { x: 0, y: 0 };
  const A1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  function arrowBoxes() {
    const out = [];
    for (const a of [fHang, fHeld]) {
      if (!a.root.visible) continue;
      toScreen(a.root.position, A0);
      toScreen(a.tip, A1);
      out.push({ left: Math.min(A0.x, A1.x) - 8, top: Math.min(A0.y, A1.y) - 8, right: Math.max(A0.x, A1.x) + 8, bottom: Math.max(A0.y, A1.y) + 8 });
    }
    return out;
  }
  const at = (body, x, y, z) => {
    const p = V(x, y, z);
    const out = V(0, 0, 0);
    return () => body.localToWorld(out.copy(p));
  };
  const spot = (dx, dy) => ({ dx, dy });
  const BELOW = [spot(0, 30), spot(-26, 30), spot(26, 30), spot(0, 46)];
  const ABOVE = [spot(0, -30), spot(-24, -30), spot(24, -30), spot(0, -46)];
  const LEFT = [spot(-30, 0), spot(-30, -22), spot(-30, 22)];
  const RIGHT = [spot(30, 0), spot(30, -22), spot(30, 22)];
  const done = (key) => s.v[key] >= 3.999;
  const ptSilkE = at(cloths.silk, 0.02, -0.033, CR + 0.026);
  const ptPlasticE = at(rods.plastic, 0.1095, 0, ROD.r + 0.001);
  const ptSilkEnd = at(cloths.silk, CLOTH.len / 2, -0.01, CR);
  const ptFlannelEnd = at(cloths.flannel, CLOTH.len / 2, -0.01, CR);
  const ptHangA = at(rods.hangGlass, -ROD.half, 0, 0);
  const ptHangB = at(rods.hangPlastic, -ROD.half, 0, 0);
  const ptHeld = { glass: at(rods.glass, -0.1, 0, 0), plastic: at(rods.plastic, -0.1, 0, 0) };
  const THREAD = V(0, 0, 0);
  const E_ON_SILK = [spot(30, 46), spot(66, 34), spot(-14, 54), spot(80, 8), spot(54, 54)];
  const E_ON_ROD = [spot(30, -40), spot(-30, -42), spot(0, -54), spot(60, -30)];
  const calm = () => !s.busy && camK >= 1;
  const LABELS = {
    glass: {
      text: () => t(done('rubG') && s.frame !== 'all' ? 'lbl_glass_pos' : 'lbl_glass'),
      point: at(rods.glass, -0.07, 0, 0),
      spots: [...ABOVE, ...BELOW],
      show: () => (s.frame === 'all' || s.frame === 'glass') && s.v.gAt < 0.01,
    },
    silk: {
      text: () => t(done('rubG') && s.frame !== 'all' ? 'lbl_silk_neg' : 'lbl_silk'),
      point: at(cloths.silk, -0.03, -0.034, CR + 0.03),
      spots: [spot(-40, 24), spot(-56, 4), ...BELOW],
      show: () => s.frame === 'all' || s.frame === 'glass',
    },
    plastic: {
      text: () => t(done('rubP') && s.frame !== 'all' ? 'lbl_plastic_neg' : 'lbl_plastic'),
      point: at(rods.plastic, -0.07, 0, 0),
      spots: [...ABOVE, ...BELOW],
      show: () => (s.frame === 'all' || s.frame === 'plastic') && s.v.pAt < 0.01,
    },
    flannel: {
      text: () => t(done('rubP') && s.frame !== 'all' ? 'lbl_flannel_pos' : 'lbl_flannel'),
      point: at(cloths.flannel, -0.03, -0.034, CR + 0.03),
      spots: [spot(-40, 24), spot(-56, 4), ...BELOW],
      show: () => s.frame === 'all' || s.frame === 'plastic',
    },
    electron: {
      text: () => t('lbl_electron'),
      point: () => (s.frame === 'glass' ? ptSilkE() : ptPlasticE()),
      spots: () => (s.frame === 'glass' ? E_ON_SILK : E_ON_ROD),
      optional: true,
      show: () =>
        calm() && ((s.phase === 'glass' && s.frame === 'glass' && done('rubG')) || (s.phase === 'plastic' && s.frame === 'plastic' && done('rubP'))),
    },
    rub: {
      text: () => t('lbl_rubs', { n: Math.min(COUNTS.strokes, Math.floor(s.v[s.frame === 'glass' ? 'rubG' : 'rubP'] + 1e-6)), m: COUNTS.strokes }),
      point: () => (s.frame === 'glass' ? ptSilkEnd() : ptFlannelEnd()),
      spots: [spot(46, 10), spot(50, 30), spot(46, -14), spot(40, 50), spot(16, 70), spot(-20, 70), spot(60, 66), spot(-60, 60)],
      optional: true,
      show: () => (s.phase === 'glass' || s.phase === 'plastic') && s.frame === s.phase && !stepDone(),
    },
    thread: {
      text: () => t('lbl_thread'),
      point: () => THREAD.set(s.frame === 'A' ? STAND.A.x : STAND.B.x, STAND.arm - 0.07, s.frame === 'A' ? STAND.A.z : STAND.B.z),
      spots: [...RIGHT, ...LEFT],
      optional: true,
      show: () => calm() && (s.phase === 'pp0' || s.phase === 'nn0'),
    },
    hang: {
      text: () => t(s.hideHang ? 'lbl_hang_unknown' : s.frame === 'A' ? 'lbl_hang_glass' : 'lbl_hang_plastic'),
      point: () => (s.frame === 'A' ? ptHangA() : ptHangB()),
      spots: [spot(34, 22), spot(40, 0), spot(30, 40), spot(34, -26), spot(-10, 40), spot(-30, 46), spot(-10, -34)],
      show: () => (s.frame === 'A' || s.frame === 'B') && !s.busy,
    },
    held: {
      text: () => t(activeStand()?.rod === 'plastic' ? 'lbl_held_plastic' : 'lbl_held_glass'),
      point: () => {
        const st = activeStand();
        return st ? ptHeld[st.rod]() : THREAD;
      },
      spots: [spot(30, 26), spot(40, 6), ...BELOW, ...ABOVE, ...RIGHT],
      optional: true,
      show: () => calm() && Boolean(activeStand()) && (s.phase.endsWith('0') || s.mode === 'quiz'),
    },
    force: {
      text: () => t(swingForce() === 'repel' ? 'lbl_repel' : 'lbl_attract'),
      point: () => fHang.tip,
      spots: [...ABOVE, ...RIGHT, ...LEFT],
      show: () => fHang.root.visible && !s.busy && s.dragging !== 'rod' && swingForce() != null,
    },
  };
  /** 'repel' | 'attract' | null at the stand in view (from the charges, not from the picture). */
  function swingForce() {
    const st = activeStand();
    if (!st) return null;
    const qh = hangQ[st.id]();
    const qr = net[st.rod]();
    if (!qh || !qr) return null;
    return qh * qr > 0 ? 'repel' : 'attract';
  }
  const placed = new Map();
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = s.mode !== 'quiz' || id === 'hang' || id === 'held' ? L.show() : false;
      const spots = typeof L.spots === 'function' ? L.spots() : L.spots;
      const text = L.text();
      if (want && anno.has(id) && placed.get(id)?.spots !== spots) anno.remove(id);
      if (want && !anno.has(id)) {
        anno.add(id, { text, point: L.point, kind: 'force', color: id === 'force' ? FORCE : INK, spots, optional: Boolean(L.optional) });
        placed.set(id, { spots, text });
      } else if (want && placed.get(id)?.text !== text) {
        anno.setText(id, text);
        placed.get(id).text = text;
      } else if (!want && anno.has(id)) anno.remove(id);
    }
  }
  stage.onAfterRender(syncLabels);

  // ── the steps ─────────────────────────────────────────────────────────────────────────────────────────────────
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    tweener.cancel('wait');
    s.busy = false;
  }
  /** Moves some of the values to where they go, together, over `sec` seconds. `rub`: also rub the cloth meanwhile. */
  function tweenTo(to, sec, my, { rub = null, linear = false } = {}) {
    const from = { ...s.v };
    const c0 = rub ? s.cloth[rub] : 0;
    const r0 = rub ? s.v[rub === 'silk' ? 'rubG' : 'rubP'] : 0;
    return tweener
      .animate({
        key: 'step',
        duration: sec,
        ease: linear ? ease.linear : ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const key of Object.keys(to)) s.v[key] = from[key] + (to[key] - from[key]) * k;
          if (rub) {
            const r = s.v[rub === 'silk' ? 'rubG' : 'rubP'] - r0;
            const back = Math.max(0, 1 - r * 2); // first glide from where the student left it
            s.cloth[rub] = c0 * back + CLOTH.amp * Math.sin(Math.PI * r);
            if (Math.floor(r) !== Math.floor(prevStroke)) {
              audio.tick?.();
              refresh();
            }
            prevStroke = r;
          }
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  let prevStroke = 0;
  const wait = (sec, my) => tweener.animate({ key: 'wait', duration: sec }).finished.then((ok) => ok && my === s.run);
  /** The plan from one step to the next: a list of { to, sec, frame?, rub?, hold? }, played one after the other. */
  function planFor(from, to) {
    const goal = TARGET[to];
    const fwd = PHASES.indexOf(to) === PHASES.indexOf(from) + 1;
    if (fwd) {
      if (to === 'glass0')
        return [
          { frame: 'glass', to: {}, sec: T.fly },
          { to: { signsG: 1 }, sec: T.signs },
        ];
      if (to === 'plastic0')
        return [
          { frame: 'plastic', to: {}, sec: T.fly },
          { to: { signsP: 1 }, sec: T.signs },
        ];
      if (to === 'glass' || to === 'plastic') {
        const key = to === 'glass' ? 'rubG' : 'rubP';
        const left = COUNTS.strokes - s.v[key];
        return [{ to: { [key]: COUNTS.strokes }, sec: Math.max(0.6, left * STROKE), rub: to === 'glass' ? 'silk' : 'flannel', linear: true }];
      }
      if (to === 'pp0')
        return [
          { frame: 'A', to: { gAt: 1 }, sec: T.carry, carry: true },
          { to: { hangA: 1 }, sec: T.signs },
        ];
      if (to === 'nn0')
        return [
          { to: { gNear: 0 }, sec: T.back },
          { frame: 'B', to: { pAt: 1 }, sec: T.carry, carry: true },
          { to: { hangB: 1 }, sec: T.signs },
        ];
      if (to === 'pn0')
        return [
          { to: { pNear: 0 }, sec: T.back },
          { to: { pAt: 0, gAt: 2, gNear: 0 }, sec: T.carry, carry: true },
        ];
      if (to === 'pp' || to === 'nn' || to === 'pn') {
        const key = to === 'nn' ? 'pNear' : 'gNear';
        return [
          { to: { [key]: 1 }, sec: T.near * (1 - s.v[key]) + 0.3 },
          { to: {}, sec: T.hold },
        ];
      }
    }
    // a jump (a word, "see it again", back): everything together while the camera flies
    const all = {};
    for (const k of KEYS) all[k] = goal[k];
    return [{ frame: FRAME_OF[to], to: all, sec: T.jump, carry: true }];
  }
  async function go(phase, { animate = true } = {}) {
    if (!PHASES.includes(phase)) return;
    const from = s.phase;
    stopAll();
    const my = s.run;
    s.phase = phase;
    hintOff();
    if (!animate || from === phase) {
      Object.assign(s.v, TARGET[phase]);
      s.cloth.silk = 0;
      s.cloth.flannel = 0;
      fly(FRAME_OF[phase], animate ? T.fly : 0);
      settleSwings();
      finish();
      return;
    }
    const plan = planFor(from, phase);
    s.busy = true;
    refresh();
    emitChange();
    for (const p of plan) {
      if (p.frame) fly(p.frame, Math.max(T.fly, p.sec));
      s.busy = p.carry ? 'carry' : true;
      if (!(await tweenTo(p.to, p.sec, my, { rub: p.rub, linear: p.linear }))) return;
    }
    if (camK < 1 && !(await wait(Math.max(0.1, (1 - camK) * T.fly), my))) return;
    s.busy = false;
    audio.success?.();
    finish();
  }
  function finish() {
    stage.invalidate();
    refresh();
    emitChange();
  }
  /** "See it again": the experiment in view, from its first step. */
  function replay() {
    if (s.locked) return lockedNudge();
    const item = itemOf(s.phase);
    if (!item || s.busy) return;
    audio.unlock();
    const start = `${item}0`;
    go(start, { animate: false });
    // the first look of an experiment plays again from the step before it
    const before = PHASES[PHASES.indexOf(start) - 1];
    if (s.phase === start && PHASES.indexOf(s.phase) > 0) {
      Object.assign(s.v, TARGET[before === 'intro' ? 'intro' : before]);
      if (item === 'glass') Object.assign(s.v, TARGET.intro);
      s.phase = before;
      settleSwings();
      go(start);
    }
  }

  // ── dragging: the cloth along its rod (rubbing), the rod in the hand toward the hanging rod ─────────────────────
  const rubKey = (cloth) => (cloth === 'silk' ? 'rubG' : 'rubP');
  /** The cloth that can be rubbed now, or ''. */
  function rubbable() {
    if (s.locked || s.busy || s.mode === 'quiz' || camK < 1) return '';
    // once rubbed, the cloth is done with: "see it again" rubs it again
    if ((s.phase === 'glass0' || s.phase === 'glass') && s.frame === 'glass' && !done('rubG')) return 'silk';
    if ((s.phase === 'plastic0' || s.phase === 'plastic') && s.frame === 'plastic' && !done('rubP')) return 'flannel';
    return '';
  }
  /** The rod in the hand that can be dragged now, or null. */
  function bringable() {
    if (s.locked || s.busy || s.mode === 'quiz' || camK < 1) return null;
    if (!['pp0', 'pp', 'nn0', 'nn', 'pn0', 'pn'].includes(s.phase)) return null;
    return activeStand();
  }
  const clothAt = V(0, 0, 0);
  const clothFrom = V(0, 0, 0);
  const clothTo = V(0, 0, 0);
  const clothAxis = V(1, 0, 0);
  const lastCloth = { k: 'silk' };
  const clothPoint = () => {
    const c = cloths[lastCloth.k];
    return clothAt.set(c.position.x, c.position.y + ROD.r + 0.026, c.position.z);
  };
  const clothHandle = createDragHandle(stage, {
    point: clothPoint,
    axis: 'x',
    direction: clothAxis,
    track: {
      from: () => clothFrom.copy(STATION[lastCloth.k === 'silk' ? 'glass' : 'plastic']).add(V(CLOTH.rest - CLOTH.amp, ROD.r + 0.026, 0)),
      to: () => clothTo.copy(STATION[lastCloth.k === 'silk' ? 'glass' : 'plastic']).add(V(CLOTH.rest + CLOTH.amp, ROD.r + 0.026, 0)),
    },
    label: t('drag_rub'),
    labelAt: 'above',
    aria: t('aria_drag_cloth'),
    pulse: Boolean(o.coach),
    when: () => {
      const k = rubbable();
      if (k) lastCloth.k = k;
      return Boolean(k);
    },
  });
  const rodAt = V(0, 0, 0);
  const rodFrom = V(0, 0, 0);
  const rodTo = V(0, 0, 0);
  const GRIP = 0.11; // the handle sits this far from the tip, toward the hand: between the rubbed and the plain part
  const lastStand = { id: 'A' };
  const rodHandle = createDragHandle(stage, {
    point: () => {
      const st = activeStand() || { rod: 'glass' };
      return rodAt.set(ROD.half - GRIP, 0, 0).applyMatrix4(rods[st.rod].matrixWorld);
    },
    axis: 'x',
    direction: () => HELD.toHand,
    track: {
      from: () => rodFrom.copy(tipNear[lastStand.id]).addScaledVector(HELD.toHand, GRIP + HELD.reach),
      to: () => rodTo.copy(tipNear[lastStand.id]).addScaledVector(HELD.toHand, GRIP),
    },
    label: t('drag_bring'),
    labelAt: 'right',
    aria: t('aria_drag_rod'),
    pulse: Boolean(o.coach),
    when: () => {
      const st = bringable();
      if (st) lastStand.id = st.id;
      return Boolean(st);
    },
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function hits(p, objects) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(objects, true).length > 0;
  }
  /** What a finger at p grabs: 'cloth', 'rod' or ''. */
  function grab(p) {
    const k = rubbable();
    if (k && (clothHandle.hit(p.x, p.y) || hits(p, [cloths[k]]))) return 'cloth';
    const st = bringable();
    if (st && (rodHandle.hit(p.x, p.y) || hits(p, [rods[st.rod]]))) return 'rod';
    return '';
  }
  /** Where along a screen segment a point lies (0 at a, 1 at b). */
  function along(p, a, b) {
    toScreen(a, A0);
    toScreen(b, A1);
    const dx = A1.x - A0.x;
    const dy = A1.y - A0.y;
    const L2 = dx * dx + dy * dy || 1;
    return ((p.x - A0.x) * dx + (p.y - A0.y) * dy) / L2;
  }
  /** A tap acts like the action's button: on its ring, or on the part the next step rubs or brings near. */
  function onTarget(p) {
    if (s.mode === 'quiz' || s.busy) return false;
    const b = action?.ringBox?.();
    if (b && p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom) return true;
    const next = stepDone() ? NEXT[s.phase] : s.phase;
    if (next === 'glass' || next === 'plastic') return grab(p) === 'cloth';
    if (next === 'pp' || next === 'nn' || next === 'pn') return grab(p) === 'rod';
    return false;
  }
  let press = null;
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const p = press;
    press = null;
    if (!p || e.pointerId !== p.id || !p.on || now() - p.at > 500) return;
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 8) doAction();
  });
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (drag) return;
      const p = canvasPoint(e);
      press = { id: e.pointerId, x: e.clientX, y: e.clientY, at: now(), on: onTarget(p) };
      const what = grab(p);
      if (!what) return;
      e.stopPropagation();
      e.preventDefault();
      hintOff();
      if (what === 'cloth') {
        const k = rubbable();
        clothHandle.markUsed();
        const a = clothFrom
          .copy(STATION[k === 'silk' ? 'glass' : 'plastic'])
          .add(V(CLOTH.rest - CLOTH.amp, ROD.r, 0))
          .clone();
        const b = clothTo
          .copy(STATION[k === 'silk' ? 'glass' : 'plastic'])
          .add(V(CLOTH.rest + CLOTH.amp, ROD.r, 0))
          .clone();
        const u0 = along(p, a, b);
        drag = { what, k, id: e.pointerId, a, b, grab: (s.cloth[k] + CLOTH.amp) / (2 * CLOTH.amp) - u0 };
      } else {
        const st = bringable();
        rodHandle.markUsed();
        const a = tipNear[st.id].clone().addScaledVector(HELD.toHand, HELD.reach);
        const b = tipNear[st.id].clone();
        drag = { what, st, id: e.pointerId, a, b, grab: s.v[st.near] - along(p, a, b) };
      }
      s.dragging = what;
      capturePointer(ui.canvasHost, e.pointerId);
      emit('dragstart', { what });
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) {
      if (e.pointerType === 'mouse' && !drag) {
        const p = canvasPoint(e);
        ui.canvasHost.style.cursor = grab(p) ? 'grab' : '';
      }
      return;
    }
    const u = Math.max(0, Math.min(1, along(canvasPoint(e), drag.a, drag.b) + drag.grab));
    if (drag.what === 'cloth') moveCloth(drag.k, u * 2 * CLOTH.amp - CLOTH.amp);
    else moveRod(drag.st, u);
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    const what = drag.what;
    drag = null;
    s.dragging = '';
    emit('dragend', { what });
    refresh();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  /** The student rubs: every 2·amp of travel is one stroke; an electron hops for each stroke after the first. */
  function moveCloth(k, offset) {
    const key = rubKey(k);
    const before = s.cloth[k];
    s.cloth[k] = offset;
    const was = s.v[key];
    s.v[key] = Math.min(COUNTS.strokes, s.v[key] + Math.abs(offset - before) / (2 * CLOTH.amp));
    if (Math.floor(movedAfter(s.v[key])) > Math.floor(movedAfter(was))) audio.pop?.();
    if (was < COUNTS.strokes && s.v[key] >= COUNTS.strokes) audio.success?.();
    const doPhase = k === 'silk' ? 'glass' : 'plastic';
    if (s.phase !== doPhase) {
      s.phase = doPhase;
      s.run++;
    }
    stage.invalidate();
    refresh();
    emitChange();
  }
  function moveRod(st, u) {
    s.v[st.near] = u;
    const doPhase = { A: 'pp', B: st.rod === 'glass' ? 'pn' : 'nn' }[st.id];
    if (s.phase === `${doPhase}0` && u > 0.5) s.phase = doPhase;
    stage.invalidate();
    refresh();
    emitChange();
  }

  // ── the panel ─────────────────────────────────────────────────────────────────────────────────────────────────
  const NEXT = {
    intro: 'glass0',
    glass0: 'glass',
    glass: 'plastic0',
    plastic0: 'plastic',
    plastic: 'pp0',
    pp0: 'pp',
    pp: 'nn0',
    nn0: 'nn',
    nn: 'pn0',
    pn0: 'pn',
  };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const replayBtn = /** @type {HTMLButtonElement} */ ($('[data-act="replay"]'));
  const steady = { lead: '', act: '' };
  /** Is the rubbing (or the bringing near) of this step finished? Before that the panel says what is left. */
  function stepDone() {
    const p = s.phase;
    if (p === 'glass') return done('rubG');
    if (p === 'plastic') return done('rubP');
    if (p === 'pp' || p === 'pn') return s.v.gNear > 0.6;
    if (p === 'nn') return s.v.pNear > 0.6;
    return true;
  }
  /** "ঘষা ২/৪ …": how many strokes are done (whole strokes), the rubbing in view. */
  function rubProgress(p) {
    const n = Math.min(COUNTS.strokes, Math.floor(s.v[p === 'glass' ? 'rubG' : 'rubP'] + 1e-6));
    return t('out_rub_more', { n, m: COUNTS.strokes });
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    const p = s.phase;
    const intro = p === 'intro';
    const finished = stepDone();
    const leadHtml = intro
      ? `<span class="cf-long">${t('intro')}</span><span class="cf-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : finished
          ? t(`lead_${p}`)
          : '';
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', intro);
      ui.learn.classList.toggle('cf-calm', intro);
    }
    const vars = { n: COUNTS.moved };
    let out = '';
    let rule = '';
    const rubbing = (p === 'glass' || p === 'plastic') && !finished;
    if (rubbing && s.busy) {
      out = rubProgress(p);
      rule = t(p === 'glass' ? 'rule_glass0' : 'rule_plastic0');
    } else if (!intro && !s.busy) {
      if (finished) {
        out = t(`out_${p}`, vars);
        rule = t(`rule_${p}`, vars);
      } else if (p === 'glass' || p === 'plastic') {
        out = rubProgress(p);
        rule = t(p === 'glass' ? 'rule_glass0' : 'rule_plastic0');
      } else {
        out = t('out_bring_more');
        rule = t(`rule_${p}0`);
      }
    }
    sheet.outcome(out);
    sheet.rule(rule);
    // the row of what has been found: only beside the hanging rods
    const hanging = ['pp0', 'pp', 'nn0', 'nn', 'pn0', 'pn'].includes(p);
    const idx = PHASES.indexOf(p);
    const foundHtml = PAIRS3.map(([id, a, b]) => {
      const seen = idx > PHASES.indexOf(id) || (p === id && finished && !s.busy);
      const word = seen ? t(id === 'pn' ? 'lbl_attract' : 'lbl_repel') : '?';
      const now = itemOf(p) === id ? ' now' : '';
      return `<span class="cf-pair${seen ? ' on' : ''}${now}">${sg(a)}${sg(b)} ${word}</span>`;
    }).join('');
    if (found.innerHTML !== foundHtml) found.innerHTML = foundHtml;
    if (hanging) found.removeAttribute('data-off');
    else found.setAttribute('data-off', '');
    const item = itemOf(p);
    sheet.choose(item);
    const nextItem = NEXT[p] ? itemOf(NEXT[p]) : null;
    sheet.next(nextItem && nextItem !== item ? nextItem : null);
    // the action: the next step (or rub / bring near, when the student has started it by hand), numbered 1…10
    const target = !finished ? p : NEXT[p];
    const label = s.busy ? 'act_wait' : target ? `act_${target}` : 'act_quiz';
    const num = s.busy || !target ? '' : PHASES.indexOf(target);
    const icon = target ? ICONS.hand : ICONS.chevR;
    const enabled = !s.busy;
    const key = `${label}|${num}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label, step: num, enabled, icon });
    }
    if (action) {
      if (enabled && target && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    // a finished bring-near: the rod can still be dragged, but only the action asks for a tap now
    root.classList.toggle('cf-settled', finished && (p === 'pp' || p === 'nn' || p === 'pn'));
    homeBtn.hidden = intro;
    homeBtn.disabled = Boolean(s.busy);
    replayBtn.hidden = intro || !finished || p.endsWith('0');
    replayBtn.disabled = Boolean(s.busy);
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the thing it acts on, a tap on that thing ─────────────────────────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    if (!stepDone()) {
      // the student started this step by hand: finish it (from where they left it)
      const p = s.phase;
      s.phase = PHASES[PHASES.indexOf(p) - 1];
      return go(p);
    }
    const next = NEXT[s.phase];
    if (next) return go(next);
    return quiz.start();
  }
  /** What the action's ring is round: a point on the part the next tap acts on (the cloth to rub, the rod to bring). */
  const RING = V(0, 0, 0);
  function actionTarget() {
    const p = stepDone() ? NEXT[s.phase] : s.phase;
    if (!p) return null;
    const on = (body, x, y = 0, z = 0) => body.localToWorld(RING.set(x, y, z));
    if (p === 'glass0') return on(rods.glass, 0.04);
    if (p === 'glass') return on(cloths.silk, 0, ROD.r + 0.004);
    if (p === 'plastic0') return s.frame === 'plastic' || s.frame === 'all' ? on(rods.plastic, 0.04) : null;
    if (p === 'plastic') return on(cloths.flannel, 0, ROD.r + 0.004);
    if (p === 'pp' || p === 'pn') return on(rods.glass, ROD.half - 0.03);
    if (p === 'nn') return on(rods.plastic, ROD.half - 0.03);
    return null; // the next step flies somewhere else: the button says it
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_glass0',
    icon: ICONS.hand,
    target: actionTarget,
    radius: 26,
    avoid: [ui.corner, ui.hint, rotate.el, $('.pvc-panel-toggle'), () => anno.boxes(), () => clothHandle.box(), () => rodHandle.box()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── how to use, in the panel ─────────────────────────────────────────────────────────────────────────────────
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'drag', axis: 'x', text: t('howto_rub'), handle: clothHandle, when: () => Boolean(rubbable()) },
      { kind: 'drag', axis: 'x', text: t('howto_bring'), handle: rodHandle, when: () => Boolean(bringable()) },
    ],
    { stage, collapse: true },
  );

  // ── hint line ─────────────────────────────────────────────────────────────────────────────────────────────────
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

  // ── state for the book ────────────────────────────────────────────────────────────────────────────────────────
  const deg = (r) => Math.round((r * 180) / Math.PI);
  function snapshot() {
    const mg = moved.glass();
    const mp = moved.plastic();
    const st = activeStand();
    return {
      phase: s.phase,
      item: itemOf(s.phase),
      busy: Boolean(s.busy),
      done: stepDone(),
      moved: { glass: Math.round(mg * 100) / 100, plastic: Math.round(mp * 100) / 100 },
      net: {
        glass: chargeOf('glass', 'rod', mg).net,
        silk: chargeOf('glass', 'cloth', mg).net,
        plastic: chargeOf('plastic', 'rod', mp).net,
        flannel: chargeOf('plastic', 'cloth', mp).net,
      },
      strokes: { glass: Math.round(s.v.rubG * 100) / 100, plastic: Math.round(s.v.rubP * 100) / 100 },
      swing: { A: deg(swing.A.theta), B: deg(swing.B.theta) },
      stand: st ? st.id : null,
      near: st ? Math.round(s.v[st.near] * 100) / 100 : null,
      force: swingForce(),
      turned: st ? swingKind(st.id) : null,
      next: NEXT[s.phase] ?? 'quiz',
      view: s.view,
      mode: s.mode,
      question: s.mode === 'quiz' && question ? { kind: question.kind, answer: question.answer } : null,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.phase, snap.busy, snap.done, snap.mode, snap.view]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the test ──────────────────────────────────────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  /** Four answers in words (the right one first in `keys`), shuffled; the quiz scores by index. */
  function choicesOf(keys, kind) {
    const list = shuffle([...keys]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(keys[0]),
      tolerance: 0.5,
      label: (j) => `<span class="cf-opt">${t(list[j])}</span>`,
      meta: { kind, answer: keys[0] },
    };
  }
  const KINDS = ['move', 'flannel', 'predict', 'unknown', 'mass'];
  const Q = {
    move: { scene: 'glass', text: 'q_move', keys: ['c_mv_right', 'c_mv_back', 'c_mv_proton', 'c_mv_new'], why: 'why_move' },
    flannel: { scene: 'plastic', text: 'q_flannel', keys: ['c_fl_right', 'c_fl_neg', 'c_fl_zero', 'c_fl_both'], why: 'why_flannel' },
    predict: { scene: 'pn', text: 'q_predict', keys: ['c_pr_right', 'c_pr_away', 'c_pr_still', 'c_pr_spin'], why: 'why_predict' },
    unknown: { scene: 'pp', text: 'q_unknown', keys: ['c_un_pos', 'c_un_neg', 'c_un_zero', 'c_un_any'], why: 'why_un_pos' },
    mass: { scene: 'pn', text: 'q_mass', keys: ['c_ms_right', 'c_ms_strong', 'c_ms_near', 'c_ms_negmass'], why: 'why_mass' },
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
        learnSaved = s.phase;
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
        s.freeze = false;
        s.hideHang = false;
        syncUI();
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        const q = Q[kind];
        s.quizKind = kind;
        s.freeze = kind === 'predict';
        s.hideHang = kind === 'unknown';
        // the hidden rod is repelled by the rod in the hand, which is the glass or the plastic: read its sign off the picture
        const neg = kind === 'unknown' && Math.random() < 0.5;
        await go(neg ? 'nn' : q.scene, { animate: false });
        await tweener.animate({ key: 'qwait', duration: 0.3 }).finished;
        if (!alive()) return null;
        const keys = neg ? ['c_un_neg', 'c_un_pos', 'c_un_zero', 'c_un_any'] : q.keys;
        question = { kind, answer: keys[0], why: neg ? 'why_un_neg' : q.why };
        return { text: t(q.text), ...choicesOf(keys, kind) };
      },
      reveal(q, correct) {
        const kind = question.kind;
        const wrong = correct ? null : q.list?.[picked];
        const note = wrong ? ` ${t(wrong.replace(/^c_/, 'mis_'))}` : '';
        if (kind === 'predict') {
          // now let it swing: the answer, shown
          s.freeze = false;
          s.quizKind = 'predict-shown';
          stage.invalidate();
        }
        if (kind === 'unknown') {
          // the hidden signs come back: the answer, shown, with the arrows
          s.hideHang = false;
          s.quizKind = 'unknown-shown';
          stage.invalidate();
        }
        return t(question.why) + note;
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ─────────────────────────────────────────────────────────────────────────────────────────────
  function cancelDrag() {
    if (!drag) return;
    drag = null;
    s.dragging = '';
  }
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
      const start = `${b.dataset.example}0`;
      if (s.busy && itemOf(s.phase) === b.dataset.example) return;
      go(start);
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
    const arrows = k === 'ArrowRight' || k === 'ArrowLeft' || k === 'ArrowUp' || k === 'ArrowDown';
    const sceneKey = ['r', 'R', 'Home'].includes(k) || arrows || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (arrows && (!onButton || tgt.classList.contains('pvc-dh'))) {
      const dir = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : -1;
      const cloth = rubbable();
      const st = bringable();
      if (cloth) {
        // each press is half a stroke, back and forth
        const target = s.cloth[cloth] > 0 ? -CLOTH.amp : CLOTH.amp;
        moveCloth(cloth, target);
      } else if (st) moveRod(st, Math.max(0, Math.min(1, s.v[st.near] + dir * 0.1)));
      else return;
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ─────────────────────────────────────────────────────────────────────────────────────────────────────
  syncUI();
  syncLayout();
  placeRods();
  applyCamera();
  refresh();
  // every part of every step exists at load (hidden or out of view): compile them now, not on the first tap
  stage.warmUp?.({ show: [fHang.root, fHeld.root] });
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
     * Change any of: phase (one of PHASES), item ('glass' | 'plastic' | 'pp' | 'nn' | 'pn': that experiment done),
     * strokes (the rubbing in view, 0…4), near (the rod in the hand, 0…1), view ('front' | '3d'). animate: false
     * lands at once (the hanging rods come to rest at once).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      const phase = p.phase ?? (p.item ? p.item : null);
      if (phase) await go(phase, { animate });
      if (p.strokes != null) {
        const k = s.frame === 'plastic' ? 'flannel' : s.frame === 'glass' ? 'silk' : '';
        if (k) {
          s.v[rubKey(k)] = Math.max(0, Math.min(COUNTS.strokes, Number(p.strokes)));
          s.phase = k === 'silk' ? 'glass' : 'plastic';
        }
      }
      if (p.near != null) {
        const st = activeStand();
        if (st) moveRod(st, Math.max(0, Math.min(1, Number(p.near))));
      }
      if (!animate || p.near != null || p.strokes != null) settleSwings();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.view = 'front';
      await goHome();
      fly('all', 0);
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The rods, the cloths and the stands with their hanging rods, in metres (no table, no signs, no arrows). */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'ChargingByFriction';
      for (const ob of bench.root.children) {
        if (ob.userData.noExport) continue;
        g.add(ob.clone(true));
      }
      return g;
    },
  };
}

/** The backdrop: a deep-blue vertical gradient, lighter at the bottom (a small power-of-two canvas, made once). */
function backdrop() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, BG[0]);
  g.addColorStop(1, BG[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
