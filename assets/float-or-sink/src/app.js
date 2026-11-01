// Floating or sinking (book page 138, topic 5.3.2), student view. A glass tank of clear water on a teak table by a lake
// at golden hour. Three steps, as the page tells it:
//   তিন অবস্থা: three 10 cm cubes, the same size: wood (floats, half under), a brick (sinks; under water it seems
//     lighter, the floor holds up only W − B) and a sealed tin with just enough sand (as heavy as its water: it stays
//     wherever it is put). Each body has its weight (purple, down) and buoyancy (orange, up) on one line beside it, their
//     lengths the real forces. The student drops them one by one, then can drag any of them anywhere under water.
//   উদাহরণ: কাঠ: the book's worked example made playable: drop the block, it bobs and settles, the camera goes close
//     to the waterline, a scale on its side shows V₁ of V, and the panel works V₁/V = ρ/ρw out. Cork, wood, ice, brick.
//   সাবমেরিন: a toy submarine takes water into its tanks (sinks), lets some out until its weight equals the buoyancy
//     (stays at that depth) or blows it all out (rises).
// The motion is a small damped simulation (reading.js): forces come from the state, never the other way round.
// Then a five-question test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createArrow } from '@shared/arrow.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { TANK, backdropTexture, createScene } from './scene.js';
import { createBlock, createBlockMaterials, createCord, createSub, createTin } from './bodies.js';
import {
  ARROW_K,
  BALLAST,
  CASES,
  CASE_IDS,
  MATERIALS,
  MATERIAL_IDS,
  QUIZ_RHO,
  QUIZ_STONES,
  QUIZ_TINS,
  QUIZ_UNDER_CM,
  RHO_W,
  SIDE,
  SUB,
  SURFACE,
  TIN_DEPTH,
  VOLUME,
  apparentChoices,
  buoyancy,
  createBody,
  densityChoices,
  depthUnder,
  forces,
  percentChoices,
  percentUnder,
  restingY,
  rhoK,
  round,
  stepBody,
  weight,
} from './reading.js';

export const DEFAULTS = {
  step: 'cases', // 'cases' | 'wood' | 'sub'
  material: 'wood', // the worked example's block: 'cork' | 'wood' | 'ice' | 'brick'
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const STEPS = ['cases', 'wood', 'sub'];
const COLORS = { W: '#7048e8', B: '#f76707', N: '#5c6773', V1: '#ffd43b' };
const HOLD_Y = 0.425; // m: the bottom of a body held over the water on its cord
const FORCE_DX = SIDE / 2 + 0.02; // m: the line of a block's two arrows, beside its right face
const SUB_DX = 0.11; // m: the same for the submarine (clear of its sail)
const DOUBLE_TAP = 400; // ms
const BALLAST_RATE = 0.25; // kg of water a second through the tanks' valves
const VIEW_DIR = { front: new THREE.Vector3(0, 0.12, 1), '3d': new THREE.Vector3(0.55, 0.38, 1) };
const MARGIN = { top: 48, bottom: 22, side: 6 };
const UPV = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const NBSP = ' ';

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const F1 = (x) => N(round(x, 1).toFixed(1)); // a force in a label: one decimal
  const E3 = '10<sup>3</sup>'; // its digits become Bangla through the vars
  const rhoText = (rho) => `${rhoK(rho)} × ${E3}`;

  root.classList.add('pvc', 'fs');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'steps', results: false, items: STEPS.map((id) => ({ id, label: `step_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the row under the action: the arrows' key (three cases), the materials (the example), the tanks' gauge (submarine)
  const row = document.createElement('div');
  row.className = 'fs-row';
  const arrowSvg = (dir) =>
    `<svg viewBox="0 0 14 22" aria-hidden="true"><path d="${dir > 0 ? 'M7 21V8M2 9l5-7 5 7z' : 'M7 1v13M2 13l5 7 5-7z'}" /></svg>`;
  row.innerHTML = `
    <div class="fs-pane" data-pane="cases">
      <span class="fs-key k-W">${arrowSvg(-1)}${t('legend_W')}</span>
      <span class="fs-key k-B">${arrowSvg(1)}${t('legend_B')}</span>
    </div>
    <div class="fs-pane fs-mats" data-pane="wood" role="radiogroup" aria-label="${t('materials')}">
      ${MATERIAL_IDS.map(
        (id) =>
          `<button type="button" role="radio" class="fs-mat m-${id}" data-mat="${id}"><span>${t(`name_${id}`)}</span><small>ρ = ${N(rhoK(MATERIALS[id].rho))}</small></button>`,
      ).join('')}
    </div>
    <div class="fs-pane fs-gauge" data-pane="sub">
      <span class="fs-gauge-l">${t('gauge')}</span>
      <span class="fs-bar" aria-hidden="true"><i></i><em></em></span>
      <output class="fs-gauge-v" aria-live="polite"></output>
    </div>`;
  $('.pvc-act-row').after(row);
  const note = document.createElement('div');
  note.className = 'fs-note';
  row.after(note); // in the panel, under the key (never on the 3D view)

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 28, near: 0.02, far: 40, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.4;
  controls.maxDistance = 6;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = Math.PI * 0.56;
  if (o.bg !== 'transparent') {
    scene.background = backdropTexture();
  }
  scene.add(new THREE.HemisphereLight('#d2e6ff', '#c98a55', 0.85));
  const sun = new THREE.DirectionalLight('#ffe2b8', 2.1);
  sun.position.set(-1.4, 2.6, 2.2);
  sun.target.position.set(0, 0.15, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe4ff', 0.5);
  fill.position.set(2, 1, 2.5);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -0.6, right: 0.6, top: 0.7, bottom: -0.4, near: 1, far: 6 });
    sun.shadow.bias = -0.0006;
  }

  const place = createScene();
  scene.add(place.root);
  const mats = createBlockMaterials();

  // ── the bodies ──────────────────────────────────────────────────────────────
  /**
   * @typedef {{ id: string, name: string, view: { root: THREE.Object3D, meshes: THREE.Mesh[] }, phys: ReturnType<typeof createBody>,
   *   x: number, dx: number, mid: number, cord: THREE.Mesh | null, moving: boolean, status: string, placing: boolean }} Body
   */
  /** @type {Record<string, Body>} */
  const bodies = {};
  function addBody(id, name, view, phys, x, { dx = FORCE_DX, mid = SIDE / 2, cord = true } = {}) {
    const b = { id, name, view, phys, x, dx, mid, cord: cord ? createCord(`${id}Cord`) : null, moving: false, status: 'held', placing: false };
    view.root.position.x = x;
    scene.add(view.root);
    if (b.cord) scene.add(b.cord);
    bodies[id] = b;
    return b;
  }
  const blockBody = (rho, y = HOLD_Y) => createBody({ m: rho * VOLUME, y });
  addBody('wood', 'name_wood', createBlock(mats.wood, 'Wood'), blockBody(CASES.wood.rho), CASES.wood.x);
  addBody('brick', 'name_brick', createBlock(mats.brick, 'Brick'), blockBody(CASES.brick.rho), CASES.brick.x);
  addBody('tin', 'name_tin', createTin('Tin'), blockBody(CASES.tin.rho), CASES.tin.x);
  addBody('block', 'name_wood', createBlock(mats.wood, 'Block'), blockBody(MATERIALS.wood.rho), 0);
  const subView = createSub();
  addBody('sub', 'name_sub', subView, createBody({ h: SUB.height, A: SUB.volume / SUB.height, m: SUB.hull, y: 0.3, k: 12, c: 8 }), 0, {
    dx: SUB_DX,
    mid: SUB.height / 2,
    cord: false,
  });
  for (const i of [0, 1, 2]) addBody(`q${i}`, `letter_${i}`, createTin(`TestTin${i}`), blockBody(1000), CASE_IDS.map((id) => CASES[id].x)[i]);
  const LAYOUTS = { cases: CASE_IDS, wood: ['block'], sub: ['sub'], tins: ['q0', 'q1', 'q2'] };

  // the worked example's scale (a white strip with a mark every cm on the block's left), the V₁ bar and the waterline
  const flat = (color, opacity = 1) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false, depthWrite: false, toneMapped: false, fog: false });
  const scaleGroup = new THREE.Group();
  scaleGroup.name = 'Scale';
  scaleGroup.userData.noExport = true;
  const SX = -SIDE / 2 - 0.011; // the scale's middle, from the block's middle
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.009, SIDE, 0.001).translate(0, SIDE / 2, 0), flat('#ffffff', 0.95));
  strip.position.x = SX;
  strip.renderOrder = 22;
  scaleGroup.add(strip);
  const tickMat = flat('#1b1f24');
  for (let i = 0; i <= 10; i++) {
    const long = i % 5 === 0;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(long ? 0.009 : 0.005, 0.0011, 0.001), tickMat);
    tick.position.set(SX + (long ? 0 : 0.002), (i * SIDE) / 10, 0.0005);
    tick.renderOrder = 23;
    scaleGroup.add(tick);
  }
  const v1Bar = new THREE.Mesh(new THREE.BoxGeometry(0.005, 1, 0.001).translate(0, 0.5, 0), flat(COLORS.V1));
  v1Bar.position.x = SX - 0.0085;
  v1Bar.renderOrder = 24;
  const v1Edge = new THREE.Mesh(new THREE.BoxGeometry(0.008, 1, 0.0008).translate(0, 0.5, 0), flat('#1b1f24'));
  v1Edge.position.set(SX - 0.0085, 0, -0.0005);
  v1Edge.renderOrder = 23.5;
  scaleGroup.add(v1Edge, v1Bar);
  scene.add(scaleGroup);
  const ring = new THREE.Group();
  ring.name = 'Waterline';
  ring.userData.noExport = true;
  // (tested against depth, so the block hides the ring's far side)
  const ringMat = new THREE.MeshBasicMaterial({ color: COLORS.V1, toneMapped: false, fog: false });
  const P = SIDE / 2 + 0.0015;
  for (const [w, d, x, z] of [
    [2 * P + 0.003, 0.003, 0, P],
    [2 * P + 0.003, 0.003, 0, -P],
    [0.003, 2 * P, P, 0],
    [0.003, 2 * P, -P, 0],
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.0024, d), ringMat);
    m.position.set(x, 0, z);
    m.renderOrder = 25;
    ring.add(m);
  }
  scene.add(ring);

  // bubbles: from the submarine's sail while its tanks fill or empty, and round a body that splashes in
  const BUBBLES = 48;
  const bubbleMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 8),
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
      emissive: '#bfefff',
      emissiveIntensity: 0.3,
    }),
    BUBBLES,
  );
  bubbleMesh.userData.noExport = true;
  bubbleMesh.frustumCulled = false;
  bubbleMesh.renderOrder = 6;
  scene.add(bubbleMesh);
  const bubbles = Array.from({ length: BUBBLES }, () => ({ on: false, x: 0, y: 0, z: 0, r: 0.003, v: 0.2, ph: 0 }));
  let bubbleSeed = 1;
  const brand = () => {
    bubbleSeed = (bubbleSeed * 16807) % 2147483647;
    return bubbleSeed / 2147483647;
  };
  function spawnBubble(x, y, z, spread = 0.01) {
    const b = bubbles.find((q) => !q.on);
    if (!b) return;
    Object.assign(b, {
      on: true,
      x: x + (brand() - 0.5) * spread,
      y,
      z: z + (brand() - 0.5) * spread,
      r: 0.002 + brand() * 0.0035,
      v: 0.16 + brand() * 0.12,
      ph: brand() * 6,
    });
  }
  const bm = new THREE.Matrix4();
  function stepBubbles(dt) {
    let any = false;
    for (let i = 0; i < BUBBLES; i++) {
      const b = bubbles[i];
      if (b.on) {
        b.y += b.v * dt;
        b.ph += dt * 9;
        if (b.y > SURFACE - b.r) b.on = false;
      }
      any ||= b.on;
      const r = b.on ? b.r : 0;
      bm.makeScale(r, r, r).setPosition(b.x + Math.sin(b.ph) * 0.002, b.y, b.z);
      bubbleMesh.setMatrixAt(i, bm);
    }
    bubbleMesh.instanceMatrix.needsUpdate = true;
    return any;
  }
  stepBubbles(0);

  // the arrows: thick, flat colour in a white outline, drawn over the water and the glass
  const flatArrow = (color) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
  const OUTLINE_FROM = new THREE.Vector3();
  function boldArrow(name, color, r) {
    const core = createArrow({ name, radius: r, head: r * 4.6, headRadius: r * 2.5, material: flatArrow(color) });
    const pad = r * 0.7;
    const outline = createArrow({
      name: `${name}Outline`,
      radius: r + pad,
      head: r * 4.6 + pad * 2.8,
      headRadius: r * 2.5 + pad * 2,
      material: flatArrow('#ffffff'),
    });
    core.root.add(outline.root);
    core.root.renderOrder = 31;
    outline.root.renderOrder = 30;
    core.root.userData.noExport = true;
    return {
      ...core,
      set(from, dir, length) {
        core.set(from, dir, length);
        OUTLINE_FROM.set(0, -pad, 0);
        if (length > 1e-6) outline.set(OUTLINE_FROM, UPV, length + pad * 2.2);
        else outline.hide();
      },
    };
  }
  const arrows = {};
  for (const id of Object.keys(bodies)) {
    const a = {
      W: boldArrow(`Weight_${id}`, COLORS.W, 0.0042),
      B: boldArrow(`Buoyancy_${id}`, COLORS.B, 0.0042),
      N: boldArrow(`Floor_${id}`, COLORS.N, 0.003),
    };
    scene.add(a.W.root, a.B.root, a.N.root);
    arrows[id] = a;
  }

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
    step: STEPS.includes(o.step) ? o.step : 'cases',
    layout: 'cases', // which bodies are in the tank (the test has its own)
    mat: MATERIAL_IDS.includes(o.material) ? o.material : 'wood',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    focus: null, // the body the panel talks about
    dropped: false, // the example's block is in the water
    ballast: 0, // kg of water in the submarine's tanks
    target: 0, // where the valves are taking it
    subCmd: null, // 'fill' | 'hover' | 'blow': the last command
    found: { wood: false, brick: false, tin: false, move: false, example: false, material: false, fill: false, hover: false, blow: false },
    show: { W: true, B: true, N: true, numbers: true, scale: true, v1: true }, // the test hides some until the answer
    userMovedCamera: false,
    run: 0, // a token: a step change, a reset or a new question bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const active = () => LAYOUTS[s.layout].map((id) => bodies[id]);
  const rhoOf = (b) => b.phys.m / VOLUME;

  /** What the body is doing: 'held', 'falling', 'rising', 'floats', 'sinks', 'stays'. */
  function statusOf(b) {
    const p = b.phys;
    if (p.held) return 'held';
    if (b.moving) return p.v < 0 ? 'falling' : 'rising';
    const f = forces(p);
    if (f.N > 1e-6) return 'sinks';
    if (depthUnder(p) < p.h - 1e-6) return p.y >= SURFACE - 1e-6 ? 'falling' : 'floats';
    return 'stays';
  }

  // ── drawing the state ───────────────────────────────────────────────────────
  const tmpA = new THREE.Vector3();
  function syncBody(b) {
    const p = b.phys;
    b.view.root.position.set(b.x, p.y, 0);
    if (b.cord) {
      b.cord.visible = b.view.root.visible && p.held && !b.dragged;
      b.cord.position.set(b.x, p.y + (b.id === 'sub' ? 0 : b.id === 'tin' || b.id.startsWith('q') ? SIDE + 0.003 : SIDE), 0);
    }
    const a = arrows[b.id];
    const shown = b.view.root.visible;
    const f = forces(p);
    const x = b.x + b.dx;
    const yc = p.y + b.mid;
    if (shown && s.show.W) a.W.set(tmpA.set(x, yc, 0.0), DOWN, f.W * ARROW_K);
    else a.W.hide();
    if (shown && s.show.B && f.B > 0.05) a.B.set(tmpA.set(x, yc, 0.0), UPV, f.B * ARROW_K);
    else a.B.hide();
    if (shown && s.show.N && f.N > 0.05) a.N.set(tmpA.set(b.x, p.y - f.N * ARROW_K, 0.06), UPV, f.N * ARROW_K);
    else a.N.hide();
  }
  function syncExample() {
    const b = bodies.block;
    const on = s.layout === 'wood' && b.view.root.visible;
    const p = b.phys;
    const under = depthUnder(p);
    scaleGroup.visible = on && s.show.scale && !p.held;
    scaleGroup.position.set(b.x, p.y, SIDE / 2 + 0.002);
    v1Bar.scale.y = Math.max(1e-4, under);
    v1Edge.scale.y = Math.max(1e-4, under + 0.0015);
    v1Edge.position.y = -0.00075;
    v1Bar.visible = v1Edge.visible = s.show.v1 && under > 0.001 && under < SIDE - 0.001;
    ring.visible = on && s.show.v1 && under > 0.001 && under < SIDE - 0.001;
    ring.position.set(b.x, SURFACE, 0);
  }
  function syncScene() {
    for (const b of Object.values(bodies)) syncBody(b);
    syncExample();
    stage.invalidate();
  }

  function setLayout(layout) {
    s.layout = layout;
    const on = new Set(LAYOUTS[layout]);
    for (const b of Object.values(bodies)) b.view.root.visible = on.has(b.id);
    bubbles.forEach((q) => {
      q.on = false;
    });
    stepBubbles(0);
    syncScene();
  }

  // ── the simulation ──────────────────────────────────────────────────────────
  let statusKey = '';
  stage.addTicker((dt) => {
    let moving = false;
    // the submarine's valves
    const sub = bodies.sub;
    if (s.layout === 'sub' && Math.abs(s.ballast - s.target) > 1e-9) {
      const d = s.target - s.ballast;
      s.ballast = Math.abs(d) <= BALLAST_RATE * dt ? s.target : s.ballast + Math.sign(d) * BALLAST_RATE * dt;
      s.ballast = round(s.ballast, 6);
      sub.phys.m = round(SUB.hull + s.ballast, 6);
      subView.setFill(s.ballast / SUB.tank);
      if (brand() < 0.55) spawnBubble(sub.x + subView.vent.x, sub.phys.y + subView.vent.y, 0.0, 0.012);
      sub.moving = true;
      moving = true;
    }
    for (const b of active()) {
      if (b.phys.held) continue;
      const wasAbove = b.phys.y > SURFACE - 0.02;
      if (b.moving || !b.phys.held) b.moving = stepBody(b.phys, dt);
      if (wasAbove && b.phys.y <= SURFACE - 0.02 && b.phys.v < -0.4) splash(b);
      moving ||= b.moving;
    }
    if (s.layout === 'sub' && moving) subView.prop.rotation.x += dt * 6;
    const bub = stepBubbles(dt);
    if (moving || bub) syncScene();
    const key = active()
      .map((b) => `${b.id}:${(b.status = statusOf(b))}`)
      .join('|');
    if (key !== statusKey) {
      statusKey = key;
      onStatus();
    } else if (moving) liveText();
    return moving || bub;
  });
  function splash(b) {
    audio.contact();
    for (let i = 0; i < 9; i++) spawnBubble(b.x, SURFACE - 0.03 - brand() * 0.05, 0, SIDE * 0.9);
  }
  /** Something stopped or started moving: the panel, the action and the camera follow. */
  function onStatus() {
    if (s.mode === 'explore') {
      for (const id of CASE_IDS)
        if (s.layout === 'cases' && bodies[id].status !== 'held' && !bodies[id].moving) s.found[id] ||= isSettled(bodies[id]);
      if (s.layout === 'wood' && s.dropped && isSettled(bodies.block)) {
        s.found.example = true;
        if (!s.userMovedCamera && !tweener.busy) flyTo(viewPose(), 0.9);
      }
    }
    refresh();
    emitChange();
  }
  const isSettled = (b) => ['floats', 'sinks', 'stays'].includes(b.status);

  // ── the panel ───────────────────────────────────────────────────────────────
  function plan() {
    if (s.layout === 'cases') {
      const next = CASE_IDS.find((id) => bodies[id].phys.held && !bodies[id].placing);
      if (next)
        return { label: next === 'tin' ? 'act_put_tin' : `act_drop_${next}`, step: CASE_IDS.indexOf(next) + 1, target: next, icon: ICONS.hand };
      return { label: 'act_move_tin', step: s.found.move ? '' : 4, target: 'tin', icon: ICONS.drag };
    }
    if (s.layout === 'wood') {
      if (!s.dropped) return { label: 'act_drop_block', step: s.found.example ? '' : 1, target: 'block', icon: ICONS.hand };
      const next = MATERIAL_IDS[(MATERIAL_IDS.indexOf(s.mat) + 1) % MATERIAL_IDS.length];
      return { label: `act_try_${next}`, step: s.found.material ? '' : 2, target: 'block', icon: ICONS.hand, next };
    }
    const cmd = s.subCmd === 'fill' ? 'hover' : s.subCmd === 'hover' ? 'blow' : 'fill';
    const all = s.found.fill && s.found.hover && s.found.blow;
    return {
      label: { fill: 'act_sub_fill', hover: 'act_sub_hover', blow: 'act_sub_blow' }[cmd],
      step: all ? '' : { fill: 1, hover: 2, blow: 3 }[cmd],
      target: 'sub',
      icon: ICONS.hand,
      cmd,
    };
  }

  const nameOf = (b) => t(b.name);
  function forceVars(b) {
    const f = forces(b.phys);
    return { name: nameOf(b), W: F1(f.W), B: F1(f.B), A: F1(f.W - f.B) };
  }
  function outcomeHtml() {
    if (s.layout === 'cases') {
      const b = s.focus ? bodies[s.focus] : null;
      if (!b) return t('out_start', { B: F1(buoyancy(VOLUME)) });
      return caseLine(b);
    }
    if (s.layout === 'wood') {
      const b = bodies.block;
      const rho = rhoOf(b);
      const v = { name: t(`name_${s.mat}`), rho: rhoText(rho), w: E3, p: round(percentUnder(rho), 1) };
      if (b.phys.held) return t('out_block_held', v);
      if (b.status === 'floats') return t('out_block_floats', v);
      if (b.status === 'sinks') return t('out_block_sinks', v);
      return t('out_block_moving', v);
    }
    const b = bodies.sub;
    const f = forces(b.phys);
    const v = { W: F1(f.W), B: F1(buoyancy(SUB.volume)) };
    if (Math.abs(s.ballast - s.target) > 1e-9 && s.target > s.ballast && b.status !== 'falling') return t('out_sub_filling', v);
    if (b.status === 'falling' || b.status === 'rising') {
      if (f.W > f.B + 0.01) return t('out_sub_falling', v);
      if (f.B > f.W + 0.01) return t('out_sub_rising', v);
      return t('out_sub_slowing', v);
    }
    if (b.status === 'sinks') return t('out_sub_bottom', v);
    if (b.status === 'stays') return t('out_sub_hover', v);
    return t('out_sub_float', { W: F1(f.W) });
  }
  function caseLine(b) {
    const v = forceVars(b);
    if (b.placing) return t('out_placing', v);
    switch (b.status) {
      case 'held':
        return t(b.dragged ? 'out_held' : 'out_start', { ...v, B: F1(buoyancy(VOLUME)) });
      case 'falling':
      case 'rising': {
        // by the forces and the way it moves, never one without the other (a bobbing body slows before it turns)
        const f = forces(b.phys);
        if (b.status === 'falling' && f.W > f.B + 0.01) return t('out_falling', v);
        if (b.status === 'rising' && f.B > f.W + 0.01) return t('out_rising', v);
        return t('out_settling', v);
      }
      case 'floats':
        return t('out_floats', v);
      case 'sinks':
        return t('out_sinks', v);
      default:
        return t('out_stays', v);
    }
  }
  function ruleHtml() {
    if (s.layout === 'cases') {
      const b = s.focus ? bodies[s.focus] : null;
      const kind = b && (isSettled(b) ? b.status : null);
      if (kind === 'floats') return t('rule_wood');
      if (kind === 'sinks') return t('rule_brick', forceVars(b));
      if (kind === 'stays') return t('rule_tin');
      if (b && lastRule) return lastRule;
      return t('rule_start');
    }
    if (s.layout === 'wood')
      return bodies.block.status === 'sinks' && !bodies.block.phys.held ? t('rule_example_sunk') : t('rule_example', { w: E3 });
    return t('rule_sub');
  }
  let lastRule = '';
  /** The lines whose numbers change while things move (cheap: bindCleanSheet writes only what changed). */
  function liveText() {
    sheet.outcome(outcomeHtml());
    if (s.layout === 'sub') gaugeSync();
    syncLabels();
  }
  function gaugeSync() {
    const bar = /** @type {HTMLElement} */ (row.querySelector('.fs-bar i'));
    bar.style.width = `${(s.ballast / SUB.tank) * 100}%`;
    /** @type {HTMLElement} */ (row.querySelector('.fs-bar em')).style.left = `${(BALLAST.hover / SUB.tank) * 100}%`;
    const out = /** @type {HTMLElement} */ (row.querySelector('.fs-gauge-v'));
    const html = t('gauge_val', { v: round(s.ballast, 2).toFixed(2) });
    if (out.innerHTML !== html) out.innerHTML = html;
  }

  function refresh() {
    sheet.choose(s.step);
    sheet.outcome(outcomeHtml());
    const rule = ruleHtml();
    lastRule = rule;
    sheet.rule(rule);
    row.dataset.step = s.step;
    for (const b of row.querySelectorAll('[data-mat]')) {
      const on = /** @type {HTMLElement} */ (b).dataset.mat === s.mat;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    }
    gaugeSync();
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label, icon: p.icon });
      const target = bodies[p.target];
      // no ring while its body moves, and none for the tin's new depth once the student has done it (labels need the room)
      const quietScene =
        target.moving ||
        target.placing ||
        (s.layout === 'wood' && s.dropped && !isSettled(target)) ||
        (p.target === 'tin' && !p.step && s.found.move);
      if (quietScene) action.hide('scene');
      else action.show('scene');
    }
    const noteHtml = s.mode === 'quiz' || stage.height < 300 ? '' : t('note_arrows');
    if (note.innerHTML !== noteHtml) note.innerHTML = noteHtml;
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const P0 = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  function arrowBoxes() {
    const list = [];
    for (const b of active())
      for (const a of Object.values(arrows[b.id])) {
        if (!a.root.visible) continue;
        toScreen(a.root.position, P0);
        toScreen(a.tip, P1);
        list.push({
          left: Math.min(P0.x, P1.x) - 8,
          top: Math.min(P0.y, P1.y) - 4,
          right: Math.max(P0.x, P1.x) + 8,
          bottom: Math.max(P0.y, P1.y) + 4,
        });
      }
    return list;
  }
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const bbox = new THREE.Box3();
  function bodyBoxes() {
    const list = [];
    for (const b of active()) {
      bbox.setFromObject(b.view.root);
      let i = 0;
      for (const x of [bbox.min.x, bbox.max.x])
        for (const y of [bbox.min.y, bbox.max.y]) for (const z of [bbox.min.z, bbox.max.z]) corners[i++].set(x, y, z).project(camera);
      const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
      const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
      list.push({ left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) });
    }
    return list;
  }
  /** How wide the tank is on the screen (px). */
  function tankWidthPx() {
    toScreen(tmpA.set(-TANK.x, 0, TANK.z), P0);
    toScreen(tmpA.set(TANK.x, 0, TANK.z), P1);
    return Math.abs(P1.x - P0.x);
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const BELOW = [spot(16, 8), spot(16, 24), spot(-16, 8), spot(-16, 24), spot(0, 26), spot(16, -8)];
  const ABOVE = [spot(16, -8), spot(16, -24), spot(-16, -8), spot(-16, -24), spot(0, -26), spot(16, 8)];
  const LEFT = [spot(-14, 0), spot(-14, 14), spot(-14, -14), spot(-14, 28)];
  const pts = new Map();
  const ptOf = (key) => {
    if (!pts.has(key)) pts.set(key, new THREE.Vector3());
    return pts.get(key);
  };
  const labelState = new Map();
  const want = new Map();
  function syncLabels() {
    want.clear();
    const own = [arrowBoxes, bodyBoxes];
    const tiny = stage.height < 250;
    // a small tank on the screen: the force labels are only the number (the arrow's direction, up or down, and the
    // key in the panel say which force it is), so they fit beside the bodies without covering them
    const short = s.layout !== 'wood' && tankWidthPx() < 300;
    const forceText = (key, v) => (short ? t('lbl_v', { v }) : t(key, { v }));
    for (const b of active()) {
      if (!b.view.root.visible) continue;
      const a = arrows[b.id];
      const f = forces(b.phys);
      const quizTins = s.layout === 'tins';
      if (a.W.root.visible)
        want.set(`W-${b.id}`, {
          text: s.show.numbers ? forceText('lbl_W', F1(f.W)) : t('lbl_Wq'),
          point: () => ptOf(`W-${b.id}`).copy(arrows[b.id].W.tip),
          spots: BELOW,
          color: COLORS.W,
          optional: tiny && !quizTins,
        });
      if (a.B.root.visible && !quizTins)
        want.set(`B-${b.id}`, {
          text: forceText('lbl_B', F1(f.B)),
          point: () => ptOf(`B-${b.id}`).copy(arrows[b.id].B.tip),
          spots: ABOVE,
          color: COLORS.B,
          optional: tiny,
        });
      if (a.N.root.visible)
        want.set(`N-${b.id}`, {
          text: forceText('lbl_N', F1(f.N)),
          point: () => ptOf(`N-${b.id}`).copy(arrows[b.id].N.root.position),
          spots: [spot(-14, 10), spot(-14, 24), spot(16, 18)],
          color: COLORS.N,
          optional: true,
        });
      if (s.layout === 'cases' || quizTins)
        want.set(`name-${b.id}`, {
          text: t(b.name),
          point: () => ptOf(`name-${b.id}`).set(b.x - SIDE / 2, b.phys.y + SIDE * 0.6, SIDE / 2),
          spots: LEFT,
          color: quizTins ? '#1b1f24' : '#3b2b1d',
          optional: !quizTins,
          kind: quizTins ? 'letter' : 'name',
        });
    }
    if (s.layout === 'wood' && scaleGroup.visible) {
      const b = bodies.block;
      const under = depthUnder(b.phys);
      if (v1Bar.visible)
        want.set('V1', {
          text: s.show.numbers ? `${t('lbl_V1')} = ${t('lbl_cm', { v: round(under * 100, 1) })}` : t('lbl_V1'),
          point: () => ptOf('V1').set(b.x + SX - 0.0085, b.phys.y + under / 2, SIDE / 2),
          spots: LEFT,
          color: '#8a6100',
        });
      want.set('V', {
        text: `${t('lbl_V')}: ${t('lbl_cm', { v: SIDE * 100 })}`,
        point: () => ptOf('V').set(b.x + SX, b.phys.y + SIDE, SIDE / 2),
        spots: [spot(-12, -12), spot(-20, -24), spot(-12, 4)],
        color: '#1b1f24',
        optional: true,
      });
    }
    // the labels take their spots in the order they were added: forces first, then V and V₁, the names last
    const rank = (id) => (id.startsWith('name-') ? 2 : id.startsWith('V') ? 1 : 0);
    const order = [...want.keys()].sort((a, b) => rank(a) - rank(b));
    const sorted = new Map(order.map((id) => [id, want.get(id)]));
    const kept = [...labelState.keys()].filter((id) => sorted.has(id));
    const keptOrder = order.filter((id) => labelState.has(id));
    const reorder =
      kept.some((id, i) => id !== keptOrder[i]) ||
      order.some((id, i) => !labelState.has(id) && order.slice(i + 1).some((later) => labelState.has(later)));
    for (const id of [...labelState.keys()])
      if (!sorted.has(id) || reorder) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of sorted) {
      const key = w.spots.map((p) => `${p.dx},${p.dy}`).join(';');
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: w.kind || 'force', color: w.color, spots: w.spots, avoid: own, optional: w.optional });
        labelState.set(id, { key, text: w.text });
      } else {
        const st = labelState.get(id);
        if (st.text !== w.text) {
          anno.setText(id, w.text);
          st.text = w.text;
        }
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  /** The box to show for the current layout (for the example: where the block will come to rest). */
  function viewBox() {
    if (s.layout === 'cases' || s.layout === 'tins') {
      // with a body still on its cord the whole tank; once all are in, closer (the empty rim off the top)
      const held = LAYOUTS[s.layout].some((id) => bodies[id].phys.held && !bodies[id].dragged);
      box.min.set(-0.42, -0.205, -0.15);
      box.max.set(0.42, held ? TANK.top + 0.012 : SURFACE + 0.1, 0.15);
      return box;
    }
    if (s.layout === 'sub') {
      box.min.set(-0.3, -0.16, -0.15);
      box.max.set(0.3, SURFACE + 0.135, 0.15);
      return box;
    }
    const b = bodies.block;
    if (b.phys.held) {
      box.min.set(-0.15, SURFACE - 0.12, -0.06);
      box.max.set(0.18, TANK.top + 0.01, 0.06);
      return box;
    }
    const y = restingY(b.phys);
    const W = b.phys.m * 9.8;
    const B = Math.min(W, buoyancy(VOLUME));
    const lo = Math.min(y, y + SIDE / 2 - W * ARROW_K) - 0.022;
    const hi = Math.max(y + SIDE, y + SIDE / 2 + B * ARROW_K, SURFACE) + 0.03;
    box.min.set(-0.12, lo, -0.06);
    box.max.set(0.17, hi, 0.06);
    return box;
  }
  function viewPose() {
    const dir = VIEW_DIR[s.view].clone().normalize();
    return fitPose({ box: viewBox(), dir, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      syncLabels();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, aim, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── doing things ────────────────────────────────────────────────────────────
  /** Lets go of a body held on its cord (the tin is first put under water at TIN_DEPTH). */
  function release(id, { jump = false } = {}) {
    const b = bodies[id];
    if (!b.phys.held || b.placing) return Promise.resolve(false);
    s.focus = id;
    audio.pop();
    const token = s.run;
    const letGo = () => {
      b.placing = false;
      b.phys.held = false;
      b.phys.v = 0;
      b.moving = true;
      if (jump) settleNow(b);
      syncScene();
      refresh();
      emitChange();
      return true;
    };
    if (!s.userMovedCamera && (s.layout === 'cases' || s.layout === 'tins') && !LAYOUTS[s.layout].some((k) => k !== id && bodies[k].phys.held))
      settleCamera(jump);
    const stays = Math.abs(rhoOf(b) - RHO_W) < 1e-6;
    if (!stays) return Promise.resolve(letGo());
    // as heavy as water: a hand puts it under water first (dropped, it would carry on down with the speed of its fall)
    const y0 = b.phys.y;
    const y1 = b.id === 'tin' ? TIN_DEPTH : 0.15;
    if (jump) {
      b.phys.y = y1;
      return Promise.resolve(letGo());
    }
    b.placing = true;
    refresh();
    return tweener
      .animate({
        key: `place-${id}`,
        duration: 1.3,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          b.phys.y = y0 + (y1 - y0) * k;
          syncScene();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.run) {
          b.placing = false;
          return false;
        }
        return letGo();
      });
  }
  /** The last body is going in: the camera comes closer once the hand has let go of it. */
  function settleCamera(jump) {
    const token = s.run;
    if (jump) return;
    tweener.animate({ key: 'wait-camera', duration: 1.4, onUpdate: () => {} }).finished.then((done) => {
      if (done && token === s.run && !s.userMovedCamera) flyTo(viewPose(), 1.0);
    });
  }
  /** Straight to where it comes to rest (tests, poster, `animate: false`). */
  function settleNow(b) {
    b.phys.held = false;
    b.phys.v = 0;
    b.phys.y = restingY(b.phys);
    b.moving = false;
    b.status = statusOf(b);
  }
  /** Puts a released body at another depth with the hand and lets go (the 4th step: the tin stays there). */
  function moveTo(id, y) {
    const b = bodies[id];
    if (b.phys.held || b.placing) return Promise.resolve(false);
    const token = s.run;
    const y0 = b.phys.y;
    s.focus = id;
    b.phys.held = true;
    b.dragged = true;
    b.placing = true;
    refresh();
    return tweener
      .animate({
        key: `place-${id}`,
        duration: 1.1,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          b.phys.y = y0 + (y - y0) * k;
          syncScene();
        },
      })
      .finished.then((done) => {
        b.placing = false;
        b.dragged = false;
        b.phys.held = false;
        b.phys.v = 0;
        b.moving = true;
        if (done && token === s.run && id === 'tin' && s.mode === 'explore') foundMove();
        syncScene();
        refresh();
        emitChange();
        return done;
      });
  }

  /** The first time the tin is put somewhere new: the others can be dragged too (said once, briefly). */
  function foundMove() {
    if (!s.found.move) showHint(t('rule_drag'), { duration: 4500 });
    s.found.move = true;
  }

  function setMaterial(id, { animate = true } = {}) {
    if (!MATERIAL_IDS.includes(id)) return;
    const b = bodies.block;
    const changed = id !== s.mat;
    if (changed && s.mode === 'explore' && s.dropped) s.found.material = true;
    s.mat = id;
    b.view.setMaterial(mats[id]);
    b.name = `name_${id}`;
    b.phys.m = MATERIALS[id].rho * VOLUME;
    if (!b.phys.held) {
      b.moving = true;
      if (!animate) settleNow(b);
    }
    if (!s.userMovedCamera && s.layout === 'wood') flyTo(viewPose(), animate ? 1.0 : 0);
    syncScene();
    refresh();
    emitChange();
  }
  function dropBlock({ jump = false } = {}) {
    if (s.dropped) return Promise.resolve(false);
    s.dropped = true;
    const p = release('block', { jump });
    if (!s.userMovedCamera) flyTo(viewPose(), jump ? 0 : 1.4);
    return p;
  }
  /** The submarine's valves: take water in, let it out until W = B, or blow it all out. */
  function subCommand(cmd, { jump = false } = {}) {
    if (!['fill', 'hover', 'blow'].includes(cmd)) return;
    s.subCmd = cmd;
    if (s.mode === 'explore') s.found[cmd] = true;
    s.target = { fill: BALLAST.sink, hover: BALLAST.hover, blow: BALLAST.rise }[cmd];
    audio.pop();
    const b = bodies.sub;
    b.moving = true;
    if (jump) {
      s.ballast = s.target;
      b.phys.m = round(SUB.hull + s.ballast, 6);
      subView.setFill(s.ballast / SUB.tank);
      if (cmd === 'hover') b.phys.v = 0;
      else settleNow(b);
      b.moving = false;
    }
    syncScene();
    refresh();
    emitChange();
  }

  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    const p = plan();
    if (s.layout === 'cases') {
      if (p.target !== 'tin' || bodies.tin.phys.held) return release(p.target);
      const b = bodies.tin;
      if (b.moving || b.placing) return showHint(t('hint_wait'), { duration: 1800 });
      // another depth: up near the surface if it is low, down near the floor if it is high
      return moveTo('tin', b.phys.y > 0.2 ? 0.05 : 0.27);
    }
    if (s.layout === 'wood') {
      if (!s.dropped) return dropBlock();
      return setMaterial(p.next);
    }
    return subCommand(p.cmd);
  }

  // ── the step (the row of words) ─────────────────────────────────────────────
  function setStep(step, { animate = true } = {}) {
    if (!STEPS.includes(step)) return Promise.resolve(false);
    s.run++;
    s.step = step;
    setLayout(step);
    s.userMovedCamera = false;
    refresh();
    emit('step', { step });
    emitChange();
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  /** The current step back to its start: bodies on their cords, the block out of the water, the submarine floating. */
  function resetStep(step = s.step) {
    s.run++;
    for (const k of [...placeKeys]) tweener.cancel(k);
    if (step === 'cases') {
      for (const id of CASE_IDS) hold(bodies[id]);
      s.focus = null;
    }
    if (step === 'wood') {
      hold(bodies.block);
      s.dropped = false;
    }
    if (step === 'sub') {
      s.ballast = s.target = 0;
      s.subCmd = null;
      const b = bodies.sub;
      b.phys.m = SUB.hull;
      b.phys.held = false;
      subView.setFill(0);
      settleNow(b);
    }
    syncScene();
    refresh();
    emitChange();
  }
  const placeKeys = ['place-wood', 'place-brick', 'place-tin', 'place-block', 'place-q0', 'place-q1', 'place-q2'];
  function hold(b) {
    b.phys.held = true;
    b.phys.v = 0;
    b.phys.y = HOLD_Y;
    b.moving = false;
    b.placing = false;
    b.dragged = false;
    b.status = 'held';
  }

  // ── touching the bodies: a tap lets go of one on its cord, a drag moves one in the water ───────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    let best = null;
    for (const b of active()) {
      if (!b.view.root.visible) continue;
      const hit = raycaster.intersectObjects(b.view.meshes, false)[0];
      if (hit && (!best || hit.distance < best.d)) best = { b, d: hit.distance };
    }
    if (best) return best.b;
    // a finger a little off a small body still finds it (touch screens)
    for (const b of active()) {
      if (!b.view.root.visible) continue;
      const c = toScreen(tmpA.set(b.x, b.phys.y + b.mid, 0), { x: 0, y: 0 });
      if (Math.hypot(c.x - p.x, c.y - p.y) < 30) return b;
    }
    return null;
  }
  /** Pixels per metre, vertically, at the body. */
  function pxPerM(b) {
    toScreen(tmpA.set(b.x, b.phys.y, 0), P0);
    toScreen(tmpA.set(b.x, b.phys.y + 0.1, 0), P1);
    return Math.max(1, Math.abs(P0.y - P1.y) / 0.1);
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (drag) return;
      const b = pick(canvasPoint(e));
      if (!b) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (b.placing) return;
      if (b.phys.held) {
        // on its cord: a tap lets go (the example's block goes in the same way)
        if (b.id === 'block') return dropBlock();
        return release(b.id);
      }
      drag = { id: e.pointerId, b, y: e.clientY, y0: b.phys.y, v0: b.phys.v, k: pxPerM(b), moved: false };
      b.phys.held = true;
      b.dragged = true;
      b.phys.v = 0;
      s.focus = b.id;
      capturePointer(ui.canvasHost, e.pointerId);
      action?.hide('drag');
      refresh();
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) {
      if (e.pointerType === 'mouse' && !drag) {
        const p = canvasPoint(e);
        requestAnimationFrame(() => {
          ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'grab') : '';
        });
      }
      return;
    }
    const b = drag.b;
    const top = b.id === 'sub' ? SURFACE - 0.02 : SURFACE + 0.02;
    b.phys.y = THREE.MathUtils.clamp(drag.y0 - (e.clientY - drag.y) / drag.k, 0, top);
    drag.moved ||= Math.abs(e.clientY - drag.y) > 4;
    syncScene();
    liveText();
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const b = drag.b;
    const tap = !drag.moved;
    const { y0, v0 } = drag;
    releasePointer(ui.canvasHost, e.pointerId);
    drag = null;
    if (tap) {
      b.phys.y = y0;
      b.phys.v = v0;
      // a tap, not a drag: the body is left as it was, and if the action is about it (the tin's new depth, the
      // submarine's valves) the tap does the action, as the ring round it says
      b.phys.held = false;
      b.dragged = false;
      action?.show('drag');
      const p = plan();
      if (p.target === b.id && !p.next) doAction();
      else {
        syncScene();
        refresh();
      }
      return;
    }
    b.phys.held = false;
    b.dragged = false;
    b.phys.v = 0;
    b.moving = true;
    if (b.id === 'tin' && s.mode === 'explore') foundMove();
    action?.show('drag');
    syncScene();
    refresh();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_drop_wood',
    target: () => {
      const p = plan();
      if (p.next) return null; // the example's next material: the words in the panel are what to touch
      const b = bodies[p.target];
      return b?.view.root.visible ? (b.id === 'sub' ? subView.root : b.view.meshes[0]) : null;
    },
    pad: 6,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), arrowBoxes],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
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
  function bodyState(b) {
    const f = forces(b.phys);
    return {
      status: statusOf(b),
      rho: round(rhoOf(b), 3),
      W: round(f.W, 3),
      B: round(f.B, 3),
      N: round(f.N, 3),
      y: round(b.phys.y, 4),
      under: round((depthUnder(b.phys) / b.phys.h) * 100, 1), // per cent of it under water
    };
  }
  function snapshot() {
    const p = plan();
    return {
      step: s.step,
      cases: Object.fromEntries(CASE_IDS.map((id) => [id, bodyState(bodies[id])])),
      material: s.mat,
      rho: MATERIALS[s.mat].rho,
      percent: percentUnder(MATERIALS[s.mat].rho), // the book's V₁/V = ρ/ρw (100 when it sinks)
      dropped: s.dropped,
      block: bodyState(bodies.block),
      sub: { ...bodyState(bodies.sub), ballast: round(s.ballast, 3), command: s.subCmd },
      next: p.label.replace('act_', ''),
      found: { ...s.found },
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([
      snap.step,
      CASE_IDS.map((id) => snap.cases[id].status),
      snap.material,
      snap.block.status,
      snap.sub.status,
      round(snap.sub.ballast, 1),
      snap.found,
      snap.mode,
      snap.view,
    ]);
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
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  function choicesOf(items, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="fs-opt">${label(list[j])}</span>`,
    };
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  /** A question's scene: this layout, these bodies placed, nothing moving, these labels. */
  async function sceneFor(layout, setup, show = {}) {
    s.run++;
    for (const k of placeKeys) tweener.cancel(k);
    s.show = { W: true, B: true, N: true, numbers: true, scale: true, v1: true, ...show };
    setLayout(layout);
    setup();
    syncScene();
    statusKey = '';
    refresh();
    return flyTo(viewPose(), 0.6);
  }
  function revealAll() {
    s.show = { W: true, B: true, N: true, numbers: true, scale: true, v1: true };
    syncScene();
    refresh();
  }
  const pct = (v) => `${N(v)}%`;
  /** The question's words: they carry HTML (units with <sup>), so they are written here, not as the kit's plain text. */
  function ask(html, rest) {
    $('.pvc-q-text').innerHTML = html;
    return rest;
  }
  const rhoChoice = (v) => `${N(v)} × ${N(10)}<sup>${N(3)}</sup>${NBSP}${t('u_rho')}`;

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 3, feedback: 3 },
    action,
    hooks: {
      enter() {
        learnSaved = { step: s.step, ballast: s.ballast, subCmd: s.subCmd };
        s.mode = 'quiz';
        s.locked = true;
        if (drag) {
          drag.b.phys.held = false;
          drag.b.dragged = false;
          drag = null;
        }
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { W: true, B: true, N: true, numbers: true, scale: true, v1: true };
        syncUI();
        // back to the start of the step the student was on (the test moved the bodies about)
        const step = learnSaved?.step ?? 'cases';
        setLayout(step);
        resetStep('cases');
        resetStep('wood');
        resetStep('sub');
        setMaterial(s.mat, { animate: false });
        setStep(step, { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['sinks', 'percent', 'density', 'apparent', 'sub'][i % 5];
        if (kind === 'sinks') {
          const W = { light: pickOne(QUIZ_TINS.light), equal: QUIZ_TINS.equal[0], heavy: pickOne(QUIZ_TINS.heavy) };
          const order = shuffle(['light', 'equal', 'heavy']);
          await sceneFor(
            'tins',
            () => {
              order.forEach((k, j) => {
                const b = bodies[`q${j}`];
                b.phys.m = round(W[k] / 9.8, 6);
                hold(b);
              });
            },
            { B: false },
          );
          if (!alive()) return null;
          question = { kind, order, W };
          const letter = (k) => t(`letter_${order.indexOf(k)}`);
          const items = [{ key: 'heavy' }, { key: 'light' }, { key: 'equal' }, { key: 'none' }];
          return ask(
            t('q_sinks', { B: F1(buoyancy(VOLUME)) }),
            choicesOf(items, (x) => (x.key === 'none' ? t('c_none') : letter(x.key))),
          );
        }
        if (kind === 'percent') {
          const rho = pickOne(QUIZ_RHO);
          await sceneFor('wood', () => {
            const b = bodies.block;
            b.view.setMaterial(mats.painted);
            b.name = 'name_painted';
            b.phys.m = rho * VOLUME;
            hold(b);
            s.dropped = false;
          });
          if (!alive()) return null;
          question = { kind, rho };
          return ask(
            t('q_percent', { name: t('name_painted'), rho: rhoText(rho) }),
            choicesOf(percentChoices(rho), (x) => pct(x.v)),
          );
        }
        if (kind === 'density') {
          const cm = pickOne(QUIZ_UNDER_CM);
          const rho = cm * 100;
          await sceneFor(
            'wood',
            () => {
              const b = bodies.block;
              b.view.setMaterial(mats.painted);
              b.name = 'name_painted';
              b.phys.m = rho * VOLUME;
              s.dropped = true;
              settleNow(b);
            },
            { numbers: false, W: false, B: false },
          );
          if (!alive()) return null;
          question = { kind, cm };
          return ask(
            t('q_density', { s: SIDE * 100 }),
            choicesOf(densityChoices(cm / 10), (x) => rhoChoice(x.v)),
          );
        }
        if (kind === 'apparent') {
          const rho = pickOne(QUIZ_STONES);
          await sceneFor(
            'wood',
            () => {
              const b = bodies.block;
              b.view.setMaterial(mats.stone);
              b.name = 'name_stone';
              b.phys.m = rho * VOLUME;
              s.dropped = true;
              settleNow(b);
            },
            { N: false, scale: false },
          );
          if (!alive()) return null;
          const W = weight(rho);
          const B = buoyancy(VOLUME);
          question = { kind, W, B };
          return ask(
            t('q_apparent'),
            choicesOf(apparentChoices(W, B), (x) => `${F1(x.v)}${NBSP}${t('u_N')}`),
          );
        }
        const up = Math.random() < 0.5;
        await sceneFor('sub', () => {
          const b = bodies.sub;
          s.ballast = s.target = up ? BALLAST.hover : 0;
          s.subCmd = up ? 'hover' : null;
          b.phys.m = round(SUB.hull + s.ballast, 6);
          subView.setFill(s.ballast / SUB.tank);
          b.phys.held = false;
          b.phys.v = 0;
          b.phys.y = up ? 0.14 : restingY(b.phys);
          b.moving = false;
        });
        if (!alive()) return null;
        question = { kind: 'sub', up };
        const items = up
          ? [{ key: 'c_blow' }, { key: 'c_fill' }, { key: 'c_wait_up' }, { key: 'c_keep' }]
          : [{ key: 'c_fill' }, { key: 'c_blow' }, { key: 'c_wait_down' }, { key: 'c_keep' }];
        return ask(
          t(up ? 'q_sub_up' : 'q_sub_down'),
          choicesOf(items, (x) => t(x.key)),
        );
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrong = correct ? null : q.list?.[picked]?.key;
        const note_ = (map, vars = {}) => (wrong && map[wrong] ? ` ${t(map[wrong], vars)}` : '');
        revealAll();
        if (k === 'sinks') {
          const { order, W } = question;
          const letter = (key) => t(`letter_${order.indexOf(key)}`);
          // let all three go: the heavy one sinks, the light one floats, the one as heavy as its water stays put
          order.forEach((_, j) => release(`q${j}`));
          return (
            t('why_sinks', { x: letter('heavy'), W: F1(W.heavy), B: F1(buoyancy(VOLUME)) }) +
            note_({ light: 'mis_light', equal: 'mis_equal', none: 'mis_none' }, { x: wrong && wrong !== 'none' ? letter(wrong) : '' })
          );
        }
        if (k === 'percent') {
          const { rho } = question;
          s.dropped = true;
          release('block');
          flyTo(viewPoseAfterDrop(), 1.2);
          const p = percentUnder(rho);
          return (
            t('why_percent', { p, rho: rhoText(rho), w: E3, f: rhoK(rho), h: 100 }) +
            note_({ above: 'mis_above', all: 'mis_all', noHundred: 'mis_noHundred' }, { h: 100 })
          );
        }
        if (k === 'density') {
          const { cm } = question;
          return (
            t('why_density', { rho: rhoText(cm * 100), d: cm, s: SIDE * 100, f: round(cm / 10, 2) }) +
            note_({ above: 'mis_d_above', inverse: 'mis_d_inverse', whole: 'mis_d_whole' }, { s: SIDE * 100 })
          );
        }
        if (k === 'apparent') {
          const { W, B } = question;
          return t('why_apparent', { W: F1(W), B: F1(B), A: F1(W - B) }) + note_({ same: 'mis_same', added: 'mis_added', buoyancy: 'mis_buoyancy' });
        }
        const { up } = question;
        subCommand(up ? 'blow' : 'fill');
        return up
          ? t('why_sub_up') + note_({ c_fill: 'mis_sub_fill', c_wait_up: 'mis_sub_wait', c_keep: 'mis_sub_keep' })
          : t('why_sub_down') + note_({ c_blow: 'mis_sub_blow', c_wait_down: 'mis_sub_wait_down', c_keep: 'mis_sub_keep' });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });
  /** The example's pose once the block has come to rest (it is still falling when the camera sets off). */
  function viewPoseAfterDrop() {
    const b = bodies.block;
    const held = b.phys.held;
    b.phys.held = false;
    const pose = viewPose();
    b.phys.held = held;
    return pose;
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
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else if (b.dataset.example !== s.step) setStep(b.dataset.example);
    }
    if (b.dataset.mat) {
      if (s.locked) lockedNudge();
      else setMaterial(b.dataset.mat);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'home':
        if (s.locked) lockedNudge();
        else {
          resetStep();
          flyTo(viewPose(), 0.6);
        }
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // the materials are a radio group: one Tab stop, the arrow keys move along it
  row.addEventListener('keydown', (e) => {
    const btn = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('[data-mat]'));
    if (!btn) return;
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();
    if (s.locked) return lockedNudge();
    const id = MATERIAL_IDS[(MATERIAL_IDS.indexOf(s.mat) + d + MATERIAL_IDS.length) % MATERIAL_IDS.length];
    setMaterial(id);
    /** @type {HTMLElement} */ (row.querySelector(`[data-mat="${id}"]`))?.focus();
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['1', '2', '3', 'r', 'R', 'Home', 'ArrowUp', 'ArrowDown'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) setStep(STEPS[Number(k) - 1]);
    else if (k === 'ArrowUp' || k === 'ArrowDown') nudgeFocus(k === 'ArrowUp' ? 1 : -1);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') {
      resetStep();
      flyTo(viewPose(), 0.6);
    } else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });
  /** The arrow keys move the body the panel talks about up or down by 2 cm (in the water), then let go. */
  function nudgeFocus(dir) {
    const id = s.layout === 'cases' ? s.focus || 'tin' : s.layout === 'wood' ? 'block' : 'sub';
    const b = bodies[id];
    if (!b || b.phys.held || b.placing) return;
    const top = id === 'sub' ? SURFACE - 0.02 : SURFACE;
    b.phys.y = THREE.MathUtils.clamp(b.phys.y + dir * 0.02, 0, top);
    b.phys.v = 0;
    b.moving = true;
    s.focus = s.layout === 'cases' ? id : s.focus;
    syncScene();
    refresh();
    stage.invalidate();
  }

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  for (const id of CASE_IDS) hold(bodies[id]);
  hold(bodies.block);
  setMaterial(s.mat, { animate: false });
  resetStep('sub');
  setLayout(s.step);
  flyTo(viewPose(), 0);
  syncScene();
  refresh();
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
     * Change any of: step ('cases' | 'wood' | 'sub'), release ('wood' | 'brick' | 'tin' | 'all': lets go of the
     * three cases), drop (true: the example's block goes in), material ('cork' | 'wood' | 'ice' | 'brick'), sub
     * ('fill' | 'hover' | 'blow'), view ('front' | '3d'), found ({ wood, brick, tin, move, … }: what the student has
     * already done). With animate: false everything comes to rest at once.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.found) Object.assign(s.found, p.found);
      if (p.step && p.step !== s.step) await setStep(p.step, { animate });
      if (p.material) setMaterial(p.material, { animate });
      if (p.release) {
        const ids = p.release === 'all' ? CASE_IDS : [p.release];
        await Promise.all(ids.map((id) => (CASE_IDS.includes(id) ? release(id, { jump: !animate }) : false)));
      }
      if (p.drop) await dropBlock({ jump: !animate });
      if (p.sub) subCommand(p.sub, { jump: !animate });
      if (!animate) {
        for (const b of active()) if (!b.phys.held && b.id !== 'sub') settleNow(b);
        if (!s.userMovedCamera) flyTo(viewPose(), 0);
        syncScene();
        statusKey = '';
        stage.invalidate();
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = Object.fromEntries(Object.keys(s.found).map((k) => [k, false]));
      s.show = { W: true, B: true, N: true, numbers: true, scale: true, v1: true };
      resetStep('cases');
      resetStep('wood');
      resetStep('sub');
      setMaterial(DEFAULTS.material, { animate: false });
      s.view = 'front';
      controls.enableRotate = false;
      await setStep('cases', { animate: false });
      syncUI();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The tank of water with the bodies of the current step, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'FloatingOrSinking';
      g.add(place.root.clone(true));
      for (const b of active()) g.add(b.view.root.clone(true));
      return g;
    },
  };
}
