// Electrical induction (book pages 275–277, topic 10.3), student view. A polished metal sphere on an insulating stand,
// its charges drawn as the book draws them: "±" pairs (a red "+" over a blue "−"), so it has no charge; a glass rod
// rubbed with silk, its "+" marks. Four steps, one tap each, slow, and the rod can be dragged:
// ① the rod comes near (or the student drags it): electrons, and only electrons, glide over the sphere to the side
//   near the rod; bare "+" are left at the back; the nearer the rod, the more move; take it away and they go back;
// ② a second sphere slides in to touch the first, the rod comes near again: electrons flow from sphere 2 into sphere 1
//   through the point where they touch (চিত্র ১০.০৬, left);
// ③ the spheres are pulled apart with the rod still there, then the rod is taken away: the charges spread over each
//   sphere, and both stay charged, opposite (চিত্র ১০.০৬, right);
// ④ the book's first question (চিত্র ১০.০৫): a negative comb comes down over bits of paper; their near part turns +,
//   far part −; they jump to the comb, fill with negative charge and fly off.
// A calm card on the first screen, then one lead-in line, the result and the rule per step; the kit's how-to row;
// a five-question test.
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
import {
  A_X,
  B_X,
  backdrop,
  COMB_AT,
  COMB_Y,
  createComb,
  createMaterials,
  createPaper,
  createRod,
  createSphere,
  createTable,
  ROD,
  ROD_AXIS,
  SPHERE_Y,
  sphereGeometry,
  TOWARD_ROD,
} from './apparatus.js';
import { boldArrow } from './arrows.js';
import { fitPose } from './camera.js';
import { COLORS, createCharges, createElectrons } from './charges.js';
import { createI18n } from './i18n.js';
import { COMB, combPhase, evenSites, farSites, G_FAR, G_MIN, G_NEAR, G_OUT, gapCm, induced, layout, NMAX, R, SITES } from './reading.js';

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

export const STEPS = ['near', 'pair', 'apart', 'comb'];
const PREV = { near: 'intro', pair: 'near', apart: 'pair', comb: 'apart' };
const INK = '#1d2733';
const PULL = '#0ca678'; // a force arrow: teal (the chapter's shared colour)
const ARROW_R = 0.0011;
const CHIP = { sphere: 0.0118, rod: 0.0105, comb: 0.0095, paper: 0.0085 };
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 14, side: 10 };
// how long things take (s): slow enough to follow
const T = { fly: 1.6, near: 2.4, back: 1.8, slide: 2.4, apart: 2.2, hold: 0.7, out: 2.2, comb: 1.8 };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const TOWARD = TOWARD_ROD.toArray();
/** What the camera frames in each part of the story, and from where (a gentle three-quarter view). */
const FRAMES = {
  intro: { box: new THREE.Box3(V(-0.215, 0.04, -0.05), V(0.075, 0.262, 0.05)), dir: V(-0.36, 0.34, 1) },
  single: { box: new THREE.Box3(V(-0.2, 0.125, -0.04), V(0.066, 0.25, 0.04)), dir: V(-0.36, 0.34, 1) },
  pair: { box: new THREE.Box3(V(-0.09, 0.125, -0.04), V(0.175, 0.25, 0.04)), dir: V(-0.3, 0.32, 1) },
  apart: { box: new THREE.Box3(V(-0.09, 0.125, -0.04), V(0.25, 0.25, 0.04)), dir: V(-0.3, 0.32, 1) },
  comb: { box: new THREE.Box3(V(0.47, 0, 0.02), V(0.615, 0.1, 0.12)), dir: V(0.28, 0.62, 1) },
};
const FRAME_OF = { intro: 'intro', near: 'single', pair: 'pair', apart: 'apart', comb: 'comb' };
/** Where each step ends. */
const END = {
  intro: { gap: G_FAR, bx: B_X.park, phase: 'single', comb: false, combT: 0 },
  near: { gap: G_NEAR, bx: B_X.park, phase: 'single', comb: false, combT: 0 },
  pair: { gap: G_NEAR, bx: B_X.touch, phase: 'pair', comb: false, combT: 0 },
  apart: { gap: G_OUT, bx: B_X.apart, phase: 'apart', comb: false, combT: 0 },
  comb: { gap: G_OUT, bx: B_X.apart, phase: 'apart', comb: true, combT: COMB.end },
};

/** The paper: bits lying under the comb's line (they jump) and a few farther out (they stay). [along, across, turn, size] */
const COMB_DIR = V(Math.cos(-0.22), 0, -Math.sin(-0.22)); // the comb's length on the table
const ACROSS = V(-COMB_DIR.z, 0, COMB_DIR.x);
const BITS = [
  [-0.044, 0.005, 0.4, 0.0168],
  [-0.016, -0.006, 1.9, 0.0189],
  [0.012, 0.004, 3.1, 0.0175],
  [0.036, -0.004, 0.9, 0.0154],
  [-0.03, -0.004, 2.5, 0.014],
  [-0.058, 0.03, 1.2, 0.0154],
  [-0.022, 0.034, 2.2, 0.0175],
  [0.016, 0.038, 0.3, 0.0147],
  [0.05, 0.028, 1.6, 0.0168],
  [-0.05, -0.034, 2.8, 0.0154],
  [0.004, -0.036, 0.7, 0.0175],
  [0.044, -0.03, 2.0, 0.0147],
];
const JUMPERS = 5; // the first five jump; the first three carry their charges' signs
const HEROES = 3;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'ei');
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
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the charges' legend: the same chips as on the spheres
  const chipSvg = (fill, plus) =>
    `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="${COLORS.edge}"/><circle cx="10" cy="10" r="7.6" fill="${fill}"/><path d="M5.6 10h8.8${plus ? 'M10 5.6v8.8' : ''}" stroke="#fff" stroke-width="2.3"/></svg>`;
  const legend = document.createElement('p');
  legend.className = 'ei-legend';
  legend.innerHTML = `<span>${chipSvg(COLORS.plus, true)}${t('legend_plus')}</span><span>${chipSvg(COLORS.minus, false)}${t('legend_minus')}</span><span class="ei-pair"><i>${chipSvg(COLORS.plus, true)}${chipSvg(COLORS.minus, false)}</i>${t('legend_pair')}</span>`;
  $('.pvc-examples')?.after(legend);
  // the line before the action: what the next tap will show (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'ei-lead';
  $('.pvc-act-row').before(lead);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 20, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 0.9));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.1);
  sun.position.set(0.55, 1.4, 0.9);
  sun.target.position.set(0.2, 0.05, 0.02);
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
    Object.assign(sun.shadow.camera, { left: -0.48, right: 0.48, top: 0.3, bottom: -0.3, near: 0.9, far: 2.4 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const mats = createMaterials();
  const geo = sphereGeometry();
  const table = createTable();
  const A = createSphere('Sphere1', mats, geo);
  const B = createSphere('Sphere2', mats, geo);
  A.root.position.x = A_X;
  const rod = createRod(mats);
  const comb = createComb(mats);
  const paper = createPaper(mats, BITS.length);
  const combGroup = new THREE.Group();
  combGroup.name = 'CombAndPaper';
  combGroup.add(comb.root, paper);
  scene.add(table, A.root, B.root, rod.root, combGroup);

  // the charges: every "+" in one mesh, every "−" in another
  const charges = createCharges({ plus: SITES * 2 + 6 + HEROES, minus: SITES * 2 + 5 + HEROES * 2 });
  scene.add(...charges.meshes);
  const PLUS = { sites: 0, rod: SITES * 2, paper: SITES * 2 + 6 };
  const MINUS = { comb: SITES * 2, paper: SITES * 2 + 5 };
  const cA = V(A_X, SPHERE_Y, 0);
  const cB = V(B_X.park, SPHERE_Y, 0);
  const LA = layout(TOWARD, { turn: 0.35 });
  const LB = layout(TOWARD, { turn: 1.9 });
  const HOME = [...LA.sites.map((dir) => ({ sp: 0, dir })), ...LB.sites.map((dir) => ({ sp: 1, dir }))];
  const electrons = createElectrons({ chips: charges.minus.chips, centres: [cA, cB], home: HOME, size: CHIP.sphere });
  HOME.forEach((h, i) => {
    const c = charges.plus.chips[PLUS.sites + i];
    c.centre = h.sp ? cB : cA;
    c.size = CHIP.sphere;
    c.shift = 1;
    c.scale = 1;
  });
  for (let i = 0; i < SITES * 2; i++) charges.minus.chips[i].scale = 1;
  for (let k = 0; k < 6; k++) Object.assign(charges.plus.chips[PLUS.rod + k], { size: CHIP.rod, push: ROD.r + 0.0016, scale: 1 });
  for (let k = 0; k < 5; k++) Object.assign(charges.minus.chips[MINUS.comb + k], { size: CHIP.comb, push: 0.03, scale: 0 });
  for (let k = 0; k < HEROES; k++) Object.assign(charges.plus.chips[PLUS.paper + k], { size: CHIP.paper, push: 0.006, scale: 0 });
  for (let k = 0; k < HEROES * 2; k++) Object.assign(charges.minus.chips[MINUS.paper + k], { size: CHIP.paper, push: 0.006, scale: 0 });

  // the pull on the sphere toward the rod: one outlined arrow
  const pull = boldArrow('Attraction', PULL, ARROW_R, { order: 40 });
  scene.add(pull.root);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  stage.addTicker((dt) => {
    const moving = electrons.tick(dt);
    if (moving) charges.touch();
    return moving;
  });
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
    gap: G_FAR,
    bx: B_X.park,
    phase: 'single', // which arrangement the electrons go to: one sphere by the rod, the touching pair, apart
    qn: 0, // electrons moved when the spheres were separated
    comb: false,
    combT: 0,
    frame: 'intro',
    hide: { a: false, paper: false }, // the test hides some signs
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    drag: null,
    quizKind: '',
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const moved = () => (s.phase === 'apart' ? s.qn : induced(s.gap));

  // ── where the electrons go ────────────────────────────────────────────────────
  const evenCache = new Map();
  function targetsFor() {
    const out = [];
    const sites = (L, sp, skip) => {
      L.sites.forEach((dir, i) => {
        if (!skip.has(i)) out.push({ sp, dir });
      });
    };
    const n = moved();
    if (s.phase === 'apart') {
      if (!evenCache.has(n)) evenCache.set(n, new Set(evenSites(LB.sites, n)));
      sites(LA, 0, new Set());
      for (const dir of LA.spread.slice(0, n)) out.push({ sp: 0, dir });
      sites(LB, 1, evenCache.get(n));
    } else if (s.phase === 'pair') {
      sites(LA, 0, new Set());
      for (const dir of LA.cap.slice(0, n)) out.push({ sp: 0, dir });
      sites(LB, 1, new Set(farSites(LB.sites, LB.toward, n)));
    } else {
      sites(LA, 0, new Set(farSites(LA.sites, LA.toward, n)));
      for (const dir of LA.cap.slice(0, n)) out.push({ sp: 0, dir });
      sites(LB, 1, new Set());
    }
    return out;
  }
  let electronKey = '';
  const front = V(0, 0, 0);
  function syncElectrons({ stagger = 0, force = false, cross = false } = {}) {
    const key = `${s.phase}|${moved()}`;
    if (key === electronKey && !force) return;
    electronKey = key;
    front.copy(camera.position).sub(cA).normalize();
    // `cross`: a landing, no trip is played, so electrons may change sphere even with the spheres apart
    const touching = cross || (s.phase === 'pair' && Math.abs(s.bx - B_X.touch) < 1e-4);
    electrons.setTargets(targetsFor(), { touching, stagger, front });
    charges.touch();
    stage.invalidate();
  }

  // ── the scene from the state ────────────────────────────────────────────────
  const tip = V(0, 0, 0);
  const tipAt = (gap, out = V(0, 0, 0)) => out.copy(cA).addScaledVector(TOWARD_ROD, R + gap);
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  const thick = () => Math.min(3.2, Math.max(1, (2.6 * perPixel()) / ARROW_R));
  const PULL_FROM = V(0, 0, 0);
  const PULL_DIR = V(TOWARD_ROD.x, 0, TOWARD_ROD.z).normalize();
  const tmp = V(0, 0, 0);
  const bitM = new THREE.Matrix4();
  const bitQ = new THREE.Quaternion();
  const bitQ2 = new THREE.Quaternion();
  const bitP = V(0, 0, 0);
  const bitS = V(1, 1, 1);
  const X_AXIS = V(1, 0, 0);
  const Y_AXIS = V(0, 1, 0);
  const stick = BITS.map(() => V(0, 0, 0));
  const restAt = BITS.map(([a, c]) => V(0, 0, 0).copy(COMB_AT).addScaledVector(COMB_DIR, a).addScaledVector(ACROSS, c).setY(0.0008));
  const landAt = BITS.map(([a, c], j) =>
    V(0, 0, 0)
      .copy(COMB_AT)
      .addScaledVector(COMB_DIR, a * 1.15)
      .addScaledVector(ACROSS, c + (j % 2 ? -1 : 1) * (0.026 + j * 0.004))
      .setY(0.0008),
  );
  const bitWorld = BITS.map(() => new THREE.Matrix4());
  let combKey = '';

  /** The comb, the paper and their signs at the comb's time. */
  function syncComb() {
    const key = `${s.comb}|${s.combT.toFixed(4)}|${s.hide.paper}`;
    if (key === combKey) return;
    combKey = key;
    combGroup.visible = s.comb;
    for (let k = 0; k < 5; k++) charges.minus.chips[MINUS.comb + k].scale = s.comb ? 1 : 0;
    if (!s.comb) {
      for (let k = 0; k < HEROES; k++) charges.plus.chips[PLUS.paper + k].scale = 0;
      for (let k = 0; k < HEROES * 2; k++) charges.minus.chips[MINUS.paper + k].scale = 0;
      return;
    }
    const ph = combPhase(s.combT);
    const lower = ease.inOutCubic(ph.lower);
    comb.root.position.copy(COMB_AT).setY(COMB_Y.up + (COMB_Y.down - COMB_Y.up) * lower);
    comb.root.updateMatrixWorld(true);
    for (let k = 0; k < 5; k++) {
      const c = charges.minus.chips[MINUS.comb + k];
      comb.root.localToWorld(c.anchor.set(-0.05 + k * 0.025, 0.027, 0));
    }
    BITS.forEach(([, , turn, size], j) => {
      const jumper = j < JUMPERS;
      let tilt = 0;
      let spin = turn;
      bitP.copy(restAt[j]);
      if (jumper) {
        const delay = j * 0.09;
        const tJ = Math.max(0, s.combT - delay);
        const pj = combPhase(tJ);
        comb.root.localToWorld(stick[j].set(BITS[j][0] * 0.95, -0.002 - size * 0.45, 0));
        if (pj.fall > 0) {
          const k = ease.outCubic(pj.fall);
          bitP.lerpVectors(stick[j], landAt[j], k);
          bitP.y = stick[j].y + (0.0008 - stick[j].y) * ease.inOutCubic(pj.fall) + Math.sin(Math.PI * pj.fall) * 0.01;
          tilt = 1.35 * (1 - pj.fall);
          spin = turn + pj.fall * 2.4;
        } else if (pj.jump > 0) {
          const k = pj.jump * pj.jump;
          bitP.lerpVectors(restAt[j], stick[j], k);
          bitP.y += pj.polar * 0.003 * (1 - k);
          tilt = 0.5 + 0.85 * k;
        } else {
          tilt = 0.5 * pj.polar;
          bitP.y += 0.003 * pj.polar;
        }
      }
      bitQ.setFromAxisAngle(Y_AXIS, spin);
      bitQ2.setFromAxisAngle(X_AXIS, -tilt);
      bitQ.multiply(bitQ2);
      bitM.compose(bitP, bitQ, bitS.set(size, size, size));
      bitWorld[j].copy(bitM);
      paper.setMatrixAt(j, bitM);
      if (j < HEROES) {
        const pj = combPhase(Math.max(0, s.combT - j * 0.09));
        const show = s.hide.paper ? 0 : 1;
        const plus = charges.plus.chips[PLUS.paper + j];
        const far = charges.minus.chips[MINUS.paper + j * 2];
        const near = charges.minus.chips[MINUS.paper + j * 2 + 1];
        // the near (raised) edge and the far edge, a little above the paper
        plus.anchor.set(0, 0.18, 0.4).applyMatrix4(bitM);
        near.anchor.copy(plus.anchor);
        far.anchor.set(0, 0.18, -0.4).applyMatrix4(bitM);
        const on = pj.fall > 0 || pj.charged > 0 ? 1 : pj.polar;
        plus.scale = show * on * (1 - pj.charged);
        near.scale = show * pj.charged;
        far.scale = show * on;
      }
    });
    paper.instanceMatrix.needsUpdate = true;
    paper.computeBoundingSphere();
  }

  function syncScene() {
    tipAt(s.gap, tip);
    rod.root.position.copy(tip);
    rod.root.visible = s.gap < 0.3;
    cB.set(s.bx, SPHERE_Y, 0);
    B.root.position.x = s.bx;
    // sphere 2 waits out of the story until step 2: nothing of it at the edge of the view, from any angle
    const secondIn = s.bx < B_X.park - 1e-4;
    B.root.visible = secondIn;
    for (let k = 0; k < 6; k++) charges.plus.chips[PLUS.rod + k].anchor.copy(tip).addScaledVector(ROD_AXIS, 0.022 + k * 0.024);
    for (let k = 0; k < 6; k++) charges.plus.chips[PLUS.rod + k].scale = rod.root.visible ? 1 : 0;
    HOME.forEach((h, i) => {
      const c = charges.plus.chips[PLUS.sites + i];
      c.anchor
        .set(...h.dir)
        .multiplyScalar(R)
        .add(h.sp ? cB : cA);
      c.scale = (h.sp === 0 && s.hide.a) || (h.sp === 1 && !secondIn) ? 0 : 1;
    });
    electrons.write();
    for (const e of electrons.list) charges.minus.chips[e.i].scale = (e.sp === 0 && s.hide.a) || (e.sp === 1 && !secondIn) ? 0 : 1;
    syncComb();
    // the pull on the sphere, while the rod is near one sphere
    const n = induced(s.gap);
    const len = s.phase === 'single' && s.step === 'near' && s.mode !== 'quiz' && n >= 2 && !s.busy ? 0.016 + 0.026 * (n / NMAX) : 0;
    pull.root.visible = len > 0;
    if (len > 0) {
      PULL_FROM.copy(cA)
        .add(tmp.set(0, R + 0.012, 0))
        .addScaledVector(PULL_DIR, 0.006);
      pull.set(PULL_FROM, PULL_DIR, len);
      pull.scale(thick());
    }
    charges.touch();
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  const A0 = { x: 0, y: 0 };
  const A1 = { x: 0, y: 0 };
  const scr = V(0, 0, 0);
  function toScreen(p, out) {
    scr.copy(p).project(camera);
    out.x = (scr.x * 0.5 + 0.5) * stage.width;
    out.y = (-scr.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  const arrowBox = () => {
    if (!pull.root.visible) return null;
    toScreen(pull.root.position, A0);
    toScreen(pull.tip, A1);
    return { left: Math.min(A0.x, A1.x) - 6, top: Math.min(A0.y, A1.y) - 8, right: Math.max(A0.x, A1.x) + 6, bottom: Math.max(A0.y, A1.y) + 8 };
  };
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  /** @type {ReturnType<typeof createDragHandle> | null} */
  let rodHandle = null;
  // the honest note: the drawn charges are a few of very many
  const noteEl = document.createElement('p');
  noteEl.className = 'ei-note';
  noteEl.textContent = t('note_few');
  ui.stage.append(noteEl);
  // after step 3 nothing in the view can be tapped: a small word at the edge says where the story goes
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'ei-next';
  nextBtn.dataset.act = 'next';
  nextBtn.textContent = t('next_comb');
  nextBtn.setAttribute('aria-label', t('act_comb'));
  nextBtn.hidden = true;
  ui.stage.append(nextBtn);
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      arrowBox,
      () => action?.box(),
      () => (s.step === 'intro' ? action?.ringBox() : null), // later the ring goes round a sphere: labels may cross its line
      () => boxOf(rotateEl),
      () => boxOf(noteEl),
      () => boxOf(nextBtn),
      () => boxOf(root.querySelector('.pvc-panel-toggle')),
      () => boxOf(root.querySelector('.pvc-dh-word')),
      () => rodHandle?.box(),
    ],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(18, 0), spot(18, -20), spot(18, 20), spot(26, -36)];
  const LEFT_OF = [spot(-18, 0), spot(-18, -20), spot(-18, 20), spot(-26, -36)];
  const ABOVE = [spot(0, -22), spot(20, -22), spot(-20, -22), spot(0, -40)];
  const BELOW = [spot(0, 30), spot(-22, 30), spot(22, 30), spot(0, 46)];
  const onA = (x, y, z) => () => tmp.set(x, y, z).normalize().multiplyScalar(R).add(cA).clone();
  const onB = (x, y, z) => () => tmp.set(x, y, z).normalize().multiplyScalar(R).add(cB).clone();
  const nearSide = V(TOWARD_ROD.x, -0.75, 0.35);
  const farSide = V(-TOWARD_ROD.x, -0.75, 0.35);
  const learning = () => s.mode !== 'quiz';
  const LABELS = {
    sphere: {
      text: () => t('lbl_sphere'),
      point: onA(0.45, 0.8, 0.3),
      color: INK,
      spots: [...RIGHT_OF, ...ABOVE],
      show: () => s.step === 'intro' && learning(),
    },
    rod: {
      text: () => t('lbl_rod'),
      // the rod rises to the left: its free side is up and to the right, or down and to the left
      point: () =>
        tmp
          .copy(tip)
          .addScaledVector(ROD_AXIS, 0.05 + 0.055 * (1 - s.gap / G_FAR))
          .clone(),
      color: COLORS.plus,
      spots: [spot(-34, 36), spot(-48, 28), spot(30, -34), spot(46, -26), spot(14, -44)],
      optional: true, // the tightest frame's first screen has no free room: the card names the rod
      show: () => s.frame !== 'comb' && s.gap < 0.2 && (s.step === 'intro' || s.step === 'near' || s.quizKind === 'sign'),
    },
    stand: {
      text: () => t('lbl_stand'),
      point: () => V(A_X + 0.007, 0.105, 0),
      color: INK,
      spots: [...RIGHT_OF, ...LEFT_OF],
      show: () => s.step === 'intro' && learning(),
    },
    neg: {
      text: () => t('lbl_neg'),
      point: () => onA(nearSide.x, nearSide.y, nearSide.z)(),
      color: COLORS.minus,
      spots: [...LEFT_OF, ...BELOW],
      show: () => learning() && s.phase === 'single' && s.step === 'near' && induced(s.gap) >= 2,
    },
    pos: {
      text: () => t('lbl_pos'),
      point: () => onA(farSide.x, farSide.y, farSide.z)(),
      color: COLORS.plus,
      spots: [...RIGHT_OF, ...BELOW, spot(-14, 54), spot(-34, 48)],
      show: () => learning() && s.phase === 'single' && s.step === 'near' && induced(s.gap) >= 2,
    },
    pull: {
      text: () => t('lbl_pull'),
      point: () => pull.tip.clone(),
      color: PULL,
      spots: [...ABOVE, ...LEFT_OF],
      show: () => pull.root.visible,
    },
    s1: {
      text: () => (learning() ? t('lbl_s1_neg') : t('lbl_s1')),
      point: onA(-0.25, 1, 0.3),
      color: () => (learning() ? COLORS.minus : INK),
      spots: [...ABOVE, ...LEFT_OF],
      show: () =>
        (s.frame === 'pair' || s.frame === 'apart') && !s.busy && moved() > 0 && (s.step === 'pair' || s.step === 'apart' || s.quizKind === 'apart'),
    },
    s2: {
      text: () => (learning() ? t('lbl_s2_pos') : t('lbl_s2')),
      point: onB(0.3, 1, 0.3),
      color: () => (learning() ? COLORS.plus : INK),
      spots: [...ABOVE, ...RIGHT_OF, spot(-44, -26), spot(-64, -34)],
      show: () =>
        (s.frame === 'pair' || s.frame === 'apart') && !s.busy && moved() > 0 && (s.step === 'pair' || s.step === 'apart' || s.quizKind === 'apart'),
    },
    comb: {
      text: () => t('lbl_comb'),
      point: () => comb.root.localToWorld(tmp.set(-0.068, 0.03, 0)).clone(),
      color: COLORS.minus,
      spots: [...LEFT_OF, ...ABOVE],
      show: () => s.comb && s.frame === 'comb' && !s.busy,
    },
    paper: {
      text: () => t('lbl_paper'),
      point: () => tmp.setFromMatrixPosition(bitWorld[8]).clone(),
      color: INK,
      spots: [...RIGHT_OF, ...BELOW],
      show: () => s.comb && s.frame === 'comb' && !s.busy,
    },
  };
  const shown = new Map(); // id → the text and colour it was added with
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      const text = L.text();
      const color = typeof L.color === 'function' ? L.color() : L.color;
      const key = `${text}|${color}`;
      if (want && anno.has(id) && shown.get(id) !== key) anno.remove(id);
      if (want && !anno.has(id)) {
        anno.add(id, { text, point: L.point, kind: 'force', color, spots: L.spots, optional: L.optional });
        shown.set(id, key);
      } else if (!want && anno.has(id)) anno.remove(id);
    }
  }

  // ── camera: a gentle three-quarter view, framed per part of the story ─────────
  const poses = {};
  function fitPoses() {
    for (const [key, f] of Object.entries(FRAMES)) {
      const d = f.dir.clone().normalize();
      if (s.view === '3d' && !s.userMovedCamera) d.add(V(0.5, 0.25, 0)).normalize();
      const p = fitPose({ box: f.box, dir: d, camera, width: stage.width, height: stage.height, margin: MARGIN });
      poses[key] = p;
    }
  }
  let camK = 1;
  let camFrom = null;
  function applyCamera() {
    if (s.userMovedCamera) return;
    const g = poses[s.frame];
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
  /** The guided camera flies to `frame`, from wherever it is (the student's view included). */
  function fly(frame, duration = T.fly) {
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
    const same = frame === s.frame && !was;
    s.frame = frame;
    if (same && camK >= 1) return Promise.resolve(true);
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
    const p = fly(s.frame, animate ? T.fly : 0);
    emitChange();
    return p;
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
    charges.update(camera);
  });
  stage.onResize(() => {
    fitPoses();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    tweener.cancel('wait');
    electrons.cancelWaits();
    s.busy = false;
  }
  /** Tweens some of the state's numbers together over `duration` s; false if the run was replaced. */
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
          syncElectrons();
          syncLabels();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  const wait = (sec, my) => tweener.animate({ key: 'wait', duration: sec }).finished.then((ok) => ok && my === s.run);
  const settle = (my) => electrons.settled().then((ok) => ok && my === s.run);
  /** Every part of the scene at the end of `step`, at once. */
  function land(step) {
    const e = END[step];
    s.gap = e.gap;
    s.bx = e.bx;
    s.phase = e.phase;
    s.qn = e.phase === 'apart' ? induced(G_NEAR) : 0;
    s.comb = e.comb;
    s.combT = e.combT;
    syncScene();
    syncElectrons({ force: true, cross: true });
    electrons.snap();
    charges.touch();
  }
  async function play(step, my) {
    if (step === 'near') {
      await fly('single');
      if (my !== s.run) return false;
      return (await tweenTo({ gap: G_NEAR }, T.near, my)) && (await settle(my));
    }
    if (step === 'pair') {
      fly('pair', T.fly);
      if (!(await tweenTo({ gap: G_FAR }, T.back, my))) return false;
      if (!(await settle(my))) return false;
      if (!(await tweenTo({ bx: B_X.touch }, T.slide, my))) return false;
      s.bx = B_X.touch;
      s.phase = 'pair';
      syncElectrons({ force: true });
      if (!(await wait(0.4, my))) return false;
      return (await tweenTo({ gap: G_NEAR }, T.near, my)) && (await settle(my));
    }
    if (step === 'apart') {
      fly('apart', T.fly);
      s.qn = induced(s.gap);
      if (!(await tweenTo({ bx: B_X.apart }, T.apart, my))) return false;
      if (!(await wait(T.hold, my))) return false;
      if (!(await tweenTo({ gap: G_OUT }, T.out, my))) return false;
      s.phase = 'apart';
      syncElectrons({ stagger: 0.12 });
      return settle(my);
    }
    if (step === 'comb') {
      s.comb = true;
      s.combT = 0;
      if (!(await fly('comb', T.comb))) return false;
      if (my !== s.run) return false;
      return tweenTo({ combT: COMB.end }, COMB.end, my, ease.linear);
    }
    return true;
  }
  /** Goes to a step: from the step before it, it plays; from anywhere else it starts from the step before. */
  async function go(step, { animate = true } = {}) {
    if (!(step in END)) return;
    const from = s.step;
    stopAll();
    const my = s.run;
    hintOff();
    cancelDrag();
    if (!animate || step === 'intro') {
      s.step = step;
      land(step);
      fly(FRAME_OF[step], animate ? T.fly : 0);
      done();
      return;
    }
    if (from !== PREV[step]) land(PREV[step]);
    s.step = step;
    s.busy = true;
    if (s.frame !== FRAME_OF[PREV[step]] && step !== 'comb') fly(FRAME_OF[PREV[step]], 0);
    refresh();
    emitChange();
    audio.tick?.();
    const ok = await play(step, my);
    if (!ok || my !== s.run) return;
    land(step);
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

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_near', 1, ICONS.hand],
    near: ['act_pair', 2, ICONS.hand],
    pair: ['act_apart', 3, ICONS.hand],
    apart: ['act_comb', 4, ICONS.hand],
    comb: ['act_quiz', '', ICONS.chevR],
  };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const replayBtn = /** @type {HTMLButtonElement} */ ($('[data-act="replay"]'));
  const steady = { lead: '', act: '' };
  const ringAt = V(0, 0, 0);
  let sceneMarked = true;
  function ringOf() {
    if (s.busy || s.mode !== 'explore') return null;
    if (s.step === 'intro') return ringAt.copy(tip).addScaledVector(ROD_AXIS, 0.006);
    if (s.step === 'near') return cA;
    if (s.step === 'pair') return cB;
    return null;
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm
      ? `<span class="ei-long">${t('intro')}</span><span class="ei-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('ei-calm', calm);
    }
    const n = moved();
    const vars = { n, d: gapCm(s.gap) };
    let out = '';
    let rule = '';
    if (!calm && !s.busy) {
      if (s.step === 'near') {
        out = t(n > 0 ? 'out_near' : 'out_near_none', vars);
        rule = t(n > 0 ? 'rule_near' : 'rule_near_none', vars);
      } else {
        out = t(`out_${s.step}`, vars);
        rule = t(`rule_${s.step}`, vars);
      }
    }
    sheet.outcome(out);
    sheet.rule(rule);
    sheet.choose(calm ? null : s.step);
    sheet.next({ intro: 'near', near: 'pair', pair: 'apart', apart: 'comb' }[s.step] ?? null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      // the numbered ring on the part the tap is about: the rod, then the sphere, then the second sphere
      const marked = step !== '' && enabled && s.mode === 'explore' && o.coach && ringOf() != null;
      if (marked !== sceneMarked) {
        sceneMarked = marked;
        if (marked) action.show('scene');
        else action.hide('scene');
      }
      action.set({ worldRadius: s.step === 'intro' ? 0 : R * 1.08 });
    }
    noteEl.textContent = t(s.step === 'comb' ? 'note_slow' : 'note_few');
    nextBtn.hidden = !(s.step === 'apart' && !s.busy && s.mode === 'explore' && o.coach);
    homeBtn.hidden = s.step === 'intro';
    homeBtn.disabled = s.busy;
    replayBtn.hidden = s.step === 'intro';
    replayBtn.disabled = s.busy;
    syncLabels();
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the part, a tap on the part ──────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const next = { intro: 'near', near: 'pair', pair: 'apart', apart: 'comb' }[s.step];
    if (next) return go(next);
    return quiz.start();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_near',
    icon: ICONS.hand,
    target: ringOf,
    radius: 30,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), () => rodHandle?.box()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── dragging the rod (in the first step); a tap on the rod is the action ─────
  const canDrag = () =>
    s.mode === 'explore' && !s.locked && !s.busy && (s.step === 'intro' || s.step === 'near') && (s.frame === 'intro' || s.frame === 'single');
  const handleAt = V(0, 0, 0);
  rodHandle = createDragHandle(stage, {
    point: () => handleAt.copy(tip).addScaledVector(ROD_AXIS, 0.042),
    axis: 'x',
    track: { from: tipAt(G_MIN).addScaledVector(ROD_AXIS, 0.042), to: tipAt(G_FAR).addScaledVector(ROD_AXIS, 0.042) },
    label: t('drag_me'),
    labelAt: 'below',
    aria: t('aria_drag_rod'),
    pulse: Boolean(o.coach),
    when: canDrag,
  });
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      {
        kind: 'drag',
        axis: 'x',
        text: t('howto_rod'),
        aria: t('aria_howto_rod'),
        handle: rodHandle,
        when: () => s.step === 'intro' || s.step === 'near',
      },
    ],
    { stage },
  );

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function hits(p, list) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(list, false).length > 0;
  }
  /** The part whose tap is the action now. */
  const tapTarget = () => ({ intro: [rod.hit], near: [A.hit], pair: [B.hit, A.hit] })[s.step] ?? [];
  function setGap(g) {
    const was = induced(s.gap);
    s.gap = Math.max(G_MIN, Math.min(G_FAR, g));
    if (s.step === 'intro') {
      s.step = 'near';
      refresh();
    }
    if (induced(s.gap) !== was) audio.tick();
    syncElectrons();
    refresh();
    emitChange();
    stage.invalidate();
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = hostXY(e);
      down = { x: p.x, y: p.y, at: now() };
      if (!canDrag()) return;
      if (!rodHandle.hit(p.x, p.y) && !hits(p, [rod.hit])) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      s.drag = { id: e.pointerId, x: p.x, y: p.y, gap: s.gap, moved: false };
      rodHandle.markUsed();
      action.hide('drag');
      emit('dragstart', { part: 'rod' });
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
          const over = (canDrag() && (rodHandle.hit(p.x, p.y) || hits(p, [rod.hit]))) || hits(p, tapTarget());
          ui.canvasHost.style.cursor = over ? (s.locked ? 'not-allowed' : canDrag() ? 'grab' : 'pointer') : '';
        });
      }
      return;
    }
    const p = hostXY(e);
    if (Math.hypot(p.x - g.x, p.y - g.y) > 6) g.moved = true;
    if (!g.moved) return;
    toScreen(tipAt(g.gap, tmp), A0);
    toScreen(tipAt(g.gap + 0.01, tmp), A1);
    const vx = A1.x - A0.x;
    const vy = A1.y - A0.y;
    const per = vx * vx + vy * vy || 1;
    setGap(g.gap + (((p.x - g.x) * vx + (p.y - g.y) * vy) / per) * 0.01);
  });
  function cancelDrag() {
    if (!s.drag) return;
    releasePointer(ui.canvasHost, s.drag.id);
    s.drag = null;
    controls.enabled = s.mode !== 'quiz';
    action.show('drag');
  }
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return false;
    cancelDrag();
    emit('dragend', { part: 'rod' });
    if (s.frame === 'intro' && s.step === 'near') fly('single'); // the rod moved: closer now
    refresh();
    emitChange();
    return g.moved;
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const dragged = endDrag(e);
    if (!down || dragged) {
      down = null;
      return;
    }
    const p = hostXY(e);
    const quick = now() - down.at < 600 && Math.hypot(p.x - down.x, p.y - down.y) < 8;
    down = null;
    if (!quick || s.mode === 'quiz') return;
    if (hits(p, tapTarget())) doAction();
  });
  ui.canvasHost.addEventListener('pointercancel', (e) => endDrag(e));

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
    const [ea, eb] = electrons.counts();
    return {
      step: s.step,
      gap: gapCm(s.gap),
      moved: moved(),
      charge: { sphere1: SITES - ea, sphere2: SITES - eb }, // in drawn charges: − extra electrons, + missing ones
      touching: Math.abs(s.bx - B_X.touch) < 1e-4,
      rod: s.gap < 0.2,
      comb: s.comb ? Math.round((s.combT / COMB.end) * 100) / 100 : 0,
      busy: s.busy,
      next: { intro: 'near', near: 'pair', pair: 'apart', apart: 'comb', comb: 'quiz' }[s.step],
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.gap]);
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
  /** Four answers in words: the first key is right. Choices and the answer are indices (the quiz compares numbers). */
  function choicesOf(keys, kind) {
    const list = shuffle([...keys]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(keys[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ei-opt">${t(list[j])}</span>`,
      meta: { kind, answer: keys[0] },
    };
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const KINDS = ['sign', 'moves', 'apart', 'paper', 'fly'];
  const QUESTIONS = {
    sign: {
      scene: 'near',
      text: 'q_sign',
      keys: ['c_sg_right', 'c_sg_plus', 'c_sg_none', 'c_sg_far'],
      why: 'why_sign',
      mis: { c_sg_plus: 'mis_sg_plus', c_sg_none: 'mis_sg_none', c_sg_far: 'mis_sg_far' },
    },
    moves: {
      scene: 'near',
      text: 'q_moves',
      keys: ['c_mv_right', 'c_mv_proton', 'c_mv_both', 'c_mv_rod'],
      why: 'why_moves',
      mis: { c_mv_proton: 'mis_mv_proton', c_mv_both: 'mis_mv_both', c_mv_rod: 'mis_mv_rod' },
    },
    apart: {
      scene: 'pair',
      text: 'q_apart',
      keys: ['c_ap_right', 'c_ap_minus', 'c_ap_none', 'c_ap_same'],
      why: 'why_apart',
      mis: { c_ap_minus: 'mis_ap_minus', c_ap_none: 'mis_ap_none', c_ap_same: 'mis_ap_same' },
    },
    paper: {
      scene: 'comb',
      combT: 2.6,
      text: 'q_paper',
      keys: ['c_pp_right', 'c_pp_minus', 'c_pp_none', 'c_pp_both'],
      why: 'why_paper',
      mis: { c_pp_minus: 'mis_pp_minus', c_pp_none: 'mis_pp_none', c_pp_both: 'mis_pp_both' },
    },
    fly: {
      scene: 'comb',
      combT: 4.1,
      text: 'q_fly',
      keys: ['c_fl_right', 'c_fl_heavy', 'c_fl_plus', 'c_fl_air'],
      why: 'why_fly',
      mis: { c_fl_heavy: 'mis_fl_heavy', c_fl_plus: 'mis_fl_plus', c_fl_air: 'mis_fl_air' },
    },
  };

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
        controls.enabled = false;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizKind = '';
        s.hide.a = false;
        s.hide.paper = false;
        controls.enabled = true;
        syncUI();
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        const q = QUESTIONS[kind];
        s.quizKind = kind;
        s.hide.a = kind === 'sign';
        s.hide.paper = kind === 'paper' || kind === 'fly';
        await go(q.scene, { animate: false });
        if (q.combT != null) {
          s.combT = q.combT;
          syncScene();
        }
        syncLabels();
        stage.invalidate();
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        question = { kind };
        return { text: t(q.text), ...choicesOf(q.keys, kind) };
      },
      reveal(q, correct) {
        const Q = QUESTIONS[question.kind];
        const wrongKey = correct ? null : q.list?.[picked];
        const note = wrongKey && Q.mis[wrongKey] ? ` ${t(Q.mis[wrongKey])}` : '';
        // the answer, then the picture shows it: the hidden signs come back
        s.hide.a = false;
        s.hide.paper = false;
        stage.invalidate();
        return t(Q.why) + note;
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const frontBtn = ui.$('[data-view="front"]');
    if (frontBtn) frontBtn.hidden = s.view !== '3d';
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
  function replay() {
    if (s.busy || s.step === 'intro') return;
    go(s.step);
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
    else if (b.dataset.act === 'next') doAction();
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
    const onButton = Boolean(tgt.closest('button')) && !tgt.closest('.pvc-drag');
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === 'ArrowRight' || k === 'ArrowLeft') && !onButton) {
      // the rod is on the left: → brings it nearer, ← takes it away
      if (canDrag()) {
        rodHandle.markUsed();
        setGap(s.gap + (k === 'ArrowRight' ? -0.01 : 0.01));
      } else if (s.busy) showHint(t('hint_wait'), { duration: 2000 });
      else showHint(t('hint_drag_later'), { duration: 2200 });
    } else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  fitPoses();
  syncUI();
  // the paper's instances get their places now: hidden, they are still exported and warmed
  s.comb = true;
  syncComb();
  land('intro');
  applyCamera();
  refresh();
  // the parts of later steps exist from the start, hidden: compile them now so the first tap freezes nothing
  // (the arrow's meshes stay hidden until it has a length)
  pull.set(PULL_FROM, PULL_DIR, 0.03);
  // and one more frame with the shadow maps: three links the shadow pass again once the lights are known (the second
  // shadow render), and that should happen here, not on the first tap
  Promise.resolve(stage.warmUp({ show: [combGroup, pull.root] })).then(() => stage.invalidate());
  const ready = (async () => {
    if (o.step !== 'intro' && o.step in END) await go(o.step, { animate: false });
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
    /** Change any of: step ('intro' | 'near' | 'pair' | 'apart' | 'comb'), gap (the rod's gap in cm, in the first
     * step: 1…11), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step) await go(p.step, { animate });
      if (p.gap != null) {
        if (s.step !== 'intro' && s.step !== 'near') await go('near', { animate: false });
        setGap(Number(p.gap) / 100);
        if (!animate) electrons.snap();
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await setView('front', { animate: false });
      await goHome();
      rodHandle.rearm();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The two spheres on their stands, the glass rod, the comb and the paper, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'ElectricalInduction';
      for (const part of [A.root, B.root, rod.root, combGroup]) {
        const copy = part.clone(true);
        copy.visible = true;
        g.add(copy);
      }
      return g;
    },
  };
}
