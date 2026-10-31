// Torricelli's experiment (book pages 145–146, topic 5.4.1), student view. A school lab: a teak bench, a slate
// chalkboard, a window. The row of words follows the page: the straw (sucking lowers the mouth's pressure and the
// outside air pushes the cold drink up; no sucking, equal pressures, nothing rises), Torricelli's tube (fill it with
// mercury, seal it with a thumb, turn it over into the dish, let go: the mercury stops at 76 cm with a vacuum above;
// pierce the top and it falls), the tube tilted (the vertical height stays 76 cm), the barometer up a mountain (less
// air, a lower column), water instead of mercury (10.3 m, against a three-storey school) and a tank with a hole (the
// owner's third picture: with the lid on the jet stops, as in Torricelli's tube; lid off, the column of water above
// the hole pushes a jet out). The panel works out P = hρg with the book's numbers. Then a five-question test. Built
// on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { boldArrow, curvedArrow, dimensionLine } from './arrows.js';
import { createLab, WINDOW } from './lab.js';
import { SCALE, SURFACE_Y, MOUTH_Y, TUBE_R, barometerMaterials, createBarometer } from './barometer.js';
import { createStraw, DRINK_Y, MOUTH, STRAW } from './straw.js';
import { BOX, HOLE, createTank } from './tank.js';
import { MINI_X, PIPE, TUB, createYard } from './yard.js';
import {
  ALTITUDES,
  G,
  H_HG,
  H_WATER,
  RATIO,
  RHO,
  TANK,
  TILTS,
  TUBE,
  columnAt,
  columnPressure,
  groupBD,
  groupIntl,
  holeDepth,
  jetReach,
  pressureChoices,
  round,
  tiltChoices,
  tiltLength,
  toCm,
  vacuumLength,
  waterChoices,
} from './reading.js';

export const EXAMPLES = ['straw', 'torricelli', 'tilt', 'mountain', 'water', 'tank'];
const PHASES = ['ready', 'full', 'dipped', 'settled', 'pierced'];

export const DEFAULTS = {
  example: 'torricelli',
  phase: 'ready', // Torricelli's tube: 'ready' | 'full' | 'dipped' | 'settled' | 'pierced'
  tilt: 0, // degrees
  alt: 0, // m above the sea
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { air: '#1c7ed6', col: '#e03131', h: '#e8590c', ink: '#1d2733', water: '#1864ab' };
const L = TUBE.length;
const MD = TUBE.mouthDepth;
const FILL_X = -0.19; // where the tube stands to be filled
const UP_Y = L - TUBE_R.inner + TUBE_R.outer + 0.0008; // the mouth's height when the tube stands on its closed end
const AIR_LEN = { lab: 0.085, straw: 0.046, tank: 0.05, yard: 0.75 }; // the air arrows at the sea's pressure (m)
const P0 = columnPressure(H_HG, RHO.mercury); // the air's pressure at the sea, the book's way (Pa)
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 12, side: 6 };
const DOWN = new THREE.Vector3(0, -1, 0);
const LEFT = new THREE.Vector3(-1, 0, 0);
const RIGHT = new THREE.Vector3(1, 0, 0);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const box3 = (x0, y0, x1, y1, z = 0.08) => [V(x0, y0, -z), V(x1, y1, z)];

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const G3 = (x) => N(t.lang === 'bn' ? groupBD(x) : groupIntl(x)); // Bangladeshi commas in Bangla (১,০১,২৯৩)
  const fix = (x, d) => N(round(x, d).toFixed(d)); // live readouts: fixed decimals (০.৭৬)

  root.classList.add('pvc', 'tb');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'examples', results: false, items: EXAMPLES.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the formula under the action: what the column is, then P = hρg with this example's numbers
  const eq = document.createElement('div');
  eq.className = 'tb-eq';
  eq.innerHTML = '<div class="tb-cap"></div><div class="tb-sum"></div><div class="tb-res"></div>';
  $('.pvc-act-row').after(eq);
  const eqCap = /** @type {HTMLElement} */ (eq.querySelector('.tb-cap'));
  const eqSum = /** @type {HTMLElement} */ (eq.querySelector('.tb-sum'));
  const eqRes = /** @type {HTMLElement} */ (eq.querySelector('.tb-res'));

  // a note on the stage (top left): where the barometer is, what is drawn bigger or faster than life
  const note = document.createElement('div');
  note.className = 'tb-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 220, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI * 0.53;

  // backgrounds: the lab's painted wall colour; the yard's sky
  const labBg = new THREE.Color('#5b7a8c');
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4;
  skyCanvas.height = 256;
  {
    const ctx = /** @type {CanvasRenderingContext2D} */ (skyCanvas.getContext('2d'));
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#1d5fd1');
    g.addColorStop(0.45, '#3d8ae8');
    g.addColorStop(0.8, '#9cc8f3');
    g.addColorStop(1, '#d6eafb');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  }
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.HemisphereLight('#e3eeff', '#8a5a34', 0.95));
  const sun = new THREE.DirectionalLight('#fff0d8', 2.1);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#d2e2ff', 0.55);
  fill.position.set(-2, 1.4, 2.6);
  scene.add(fill);
  const shadows = o.shadow && o.bg !== 'transparent';
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.01;
  }
  function lightFor(set) {
    if (set === 'yard') {
      sun.position.set(6, 14, 9);
      sun.target.position.set(0, 4, 0);
      Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
    } else {
      sun.position.set(1.3, 2.4, 1.8);
      sun.target.position.set(0, 0.4, 0);
      Object.assign(sun.shadow.camera, { left: -0.9, right: 0.9, top: 1, bottom: -0.9, near: 0.5, far: 6 });
    }
    sun.shadow.camera.updateProjectionMatrix();
    sun.target.updateMatrixWorld();
  }

  const mats = barometerMaterials();
  const lab = createLab();
  const yard = createYard(mats, { num: N });
  const bar = createBarometer(mats, { num: N });
  const straw = createStraw(mats);
  const tank = createTank(mats);
  straw.root.position.x = 0.09;
  scene.add(lab.root, yard.root, bar.root, straw.root, tank.root);
  for (const r of [bar.root, straw.root, tank.root, yard.root])
    r.traverse((m) => {
      if (/** @type {THREE.Mesh} */ (m).isMesh && !m.userData.noExport) m.castShadow = m.castShadow || false;
    });
  bar.tube.traverse((m) => {
    if (/** @type {THREE.Mesh} */ (m).isMesh) m.castShadow = true;
  });

  // a small beaker that pours mercury into the tube while it is filled
  const beaker = new THREE.Group();
  {
    const cup = new THREE.Mesh(
      new THREE.LatheGeometry(
        [V(0.0001, 0), V(0.026, 0), V(0.027, 0.06), V(0.029, 0.062), V(0.025, 0.062), V(0.024, 0.003), V(0.0001, 0.003)].map(
          (v) => new THREE.Vector2(v.x, v.y),
        ),
        32,
      ),
      mats.glass,
    );
    cup.renderOrder = 8;
    const hg = new THREE.Mesh(new THREE.CylinderGeometry(0.0235, 0.0235, 0.022, 28), mats.mercury);
    hg.position.y = 0.014;
    beaker.add(hg, cup);
  }
  beaker.visible = false;
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0022, 1, 10).translate(0, -0.5, 0), mats.mercury);
  stream.visible = false;
  scene.add(beaker, stream);

  // air rushing into the hole: a few small puffs
  const puffs = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.0032, 8, 6),
    new THREE.MeshBasicMaterial({ color: '#e7f3ff', transparent: true, opacity: 0.9, depthTest: false, toneMapped: false }),
    14,
  );
  puffs.renderOrder = 40;
  puffs.visible = false;
  puffs.userData.noExport = true;
  scene.add(puffs);

  // ── arrows and dimension lines ──────────────────────────────────────────────
  const arrows = {
    dish: [boldArrow('AirOnDishLeft', COLORS.air, 0.0034), boldArrow('AirOnDishRight', COLORS.air, 0.0034)],
    col: boldArrow('ColumnPressure', COLORS.col, 0.0028, { order: 34 }),
    top: boldArrow('AirIntoHole', COLORS.air, 0.0032),
    bottle: [boldArrow('AirOnDrinkLeft', COLORS.air, 0.0022), boldArrow('AirOnDrinkRight', COLORS.air, 0.0022)],
    mouth: boldArrow('AirInMouth', COLORS.air, 0.0022, { order: 36 }),
    tankTop: [boldArrow('AirOnWaterLeft', COLORS.air, 0.0028), boldArrow('AirOnWaterRight', COLORS.air, 0.0028)],
    hole: boldArrow('AirAtHole', COLORS.air, 0.0028),
    tub: [boldArrow('AirOnTubLeft', COLORS.air, 0.028), boldArrow('AirOnTubRight', COLORS.air, 0.028)],
  };
  const pass = curvedArrow('AirPassedUp', COLORS.air, 0.0021, [
    V(-0.058, SURFACE_Y - 0.002, 0.03),
    V(-0.057, 0.024, 0.03),
    V(-0.036, 0.012, 0.03),
    V(-0.008, 0.014, 0.03),
    V(0, 0.026, 0.03),
    V(0, SURFACE_Y - 0.007, 0.03),
  ]);
  const allArrows = [...arrows.dish, arrows.col, arrows.top, ...arrows.bottle, arrows.mouth, ...arrows.tankTop, arrows.hole, ...arrows.tub];
  for (const a of allArrows) scene.add(a.root);
  scene.add(pass.root);
  const dims = {
    h: dimensionLine('HeightOfColumn', COLORS.h, 0.0016, { dashed: true }),
    vac: dimensionLine('Vacuum', COLORS.ink, 0.0012),
    vert: dimensionLine('VerticalHeight', COLORS.h, 0.0016, { dashed: true }),
    depth: dimensionLine('HoleDepth', COLORS.h, 0.0014),
    water: dimensionLine('WaterColumn', COLORS.h, 0.014, { dashed: true, ticks: 0.2 }),
  };
  for (const d of Object.values(dims)) scene.add(d.root);
  // a dashed reading line from the mercury's top across to the scale (and to the 76 cm mark's line on the left)
  const readMat = new THREE.MeshBasicMaterial({ color: COLORS.h, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
  const readLine = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), readMat, 60);
  readLine.renderOrder = 27;
  readLine.userData.noExport = true;
  scene.add(readLine);
  const RM = new THREE.Matrix4();
  const RQ = new THREE.Quaternion();
  const RS = new THREE.Vector3();
  const RP = new THREE.Vector3();
  function setReadLine(x0, x1, y, z = 0.012) {
    const len = Math.abs(x1 - x0);
    const n = Math.min(60, Math.max(1, Math.floor(len / 0.008)));
    for (let i = 0; i < n; i++) {
      RP.set(Math.min(x0, x1) + (i + 0.25) * (len / n), y, z);
      RS.set((len / n) * 0.55, 0.0016, 0.0016);
      RM.compose(RP, RQ, RS);
      readLine.setMatrixAt(i, RM);
    }
    readLine.count = n;
    readLine.instanceMatrix.needsUpdate = true;
    readLine.visible = len > 0.004;
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
    ex: EXAMPLES.includes(o.example) ? o.example : 'torricelli',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false, // an animation the student started is running
    run: 0, // a token: every new action, example, reset or question bumps it
    look: 'all', // 'all' | 'vacuum' | 'dish' | 'wide' (the turn) | 'low' (the yard's tub) | 'follow'
    followY: 0,
    userMovedCamera: false,
    // Torricelli's tube
    phase: 'ready', // 'ready' | 'filling' | 'full' | 'turning' | 'dipped' | 'falling' | 'settled' | 'piercing' | 'pierced'
    fill: 0, // 0…1 of the tube filled (upright, mouth up)
    pose: { x: FILL_X, y: UP_Y, a: Math.PI },
    thumb: { on: false, x: 0, y: 0 }, // the thumb's offset from the mouth (tube's local frame)
    col: L, // the mercury's top along the tube (m from the mouth) once it stands in the dish
    hole: false,
    H: H_HG, // the column's vertical height above the dish (m)
    tilt: 0, // degrees, as drawn
    tiltAt: 0, // index in TILTS the student chose
    altAt: 0, // index in ALTITUDES
    // the straw
    suck: false,
    drink: DRINK_Y, // the drink's top in the straw (world y, before the straw's offset)
    mouthP: 1, // the mouth's pressure, as a fraction of the outside air's
    // the water column
    wphase: 'ready', // 'ready' | 'rising' | 'done'
    wtop: TUB.water,
    // the tank
    kphase: 'corked', // 'corked' | 'corking' | 'stopped' | 'opening' | 'open'
    level: TANK.water,
    reach: 0,
    jetR: 0.0055,
    lid: 0, // 0 on … 1 off
    cork: 0, // 0 in … 1 out
    found: { straw: false, torricelli: false, pierced: false, tilt: false, mountain: false, water: false, tank: false, lid: false },
    show: { labels: true, vacuum: true, h: true, tilt: true }, // the test hides some until the answer
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const setOf = (ex = s.ex) => (ex === 'water' ? 'yard' : 'lab');
  const usesBarometer = (ex = s.ex) => ex === 'torricelli' || ex === 'tilt' || ex === 'mountain';
  const air = () => (s.ex === 'mountain' ? columnPressure(s.H, RHO.mercury) / P0 : 1); // the air's pressure / the sea's
  const inDish = () => ['dipped', 'falling', 'settled', 'piercing', 'pierced'].includes(s.phase) || s.ex !== 'torricelli';

  // ── the scene from the state ────────────────────────────────────────────────
  const tmpV = new THREE.Vector3();
  /** The mercury's top in the dish-standing tube, as a world point. */
  function columnTop(out = tmpV) {
    const a = THREE.MathUtils.degToRad(s.tilt);
    return out.set(s.pose.x - Math.sin(a) * s.col, s.pose.y + Math.cos(a) * s.col, 0);
  }
  function tubeTop(out) {
    const a = s.pose.a;
    const len = L - TUBE_R.inner;
    return out.set(s.pose.x - Math.sin(a) * len, s.pose.y + Math.cos(a) * len, 0);
  }
  function syncBarometer() {
    if (s.ex === 'torricelli' && !inDish()) {
      bar.setPose(s.pose.x, s.pose.y, s.pose.a);
      if (s.phase === 'ready' || s.phase === 'filling' || s.phase === 'full') {
        const f = Math.max(0, Math.min(1, s.fill));
        if (f > 0.001) bar.setColumn(L * (1 - f), L, { top: 'dome', low: true });
        else bar.setColumn(0, 0);
      } else bar.setColumn(0, L, { top: 'dome' }); // sealed: full, turning
    } else {
      const a = THREE.MathUtils.degToRad(s.tilt);
      bar.setPose(0, MOUTH_Y, a);
      s.pose = { x: 0, y: MOUTH_Y, a };
      const full = s.col >= L - TUBE_R.inner - 1e-4;
      bar.setColumn(0, Math.min(s.col, L - TUBE_R.inner), { top: full ? 'dome' : 'meniscus' });
    }
    bar.thumb.visible = s.thumb.on;
    bar.thumb.position.set(s.thumb.x, -0.0115 + s.thumb.y, 0);
    bar.hole.visible = s.hole;
  }

  function syncScene() {
    const set = setOf();
    lab.root.visible = set === 'lab';
    yard.root.visible = set === 'yard';
    scene.background = o.bg === 'transparent' ? null : set === 'yard' ? skyTex : labBg;
    scene.fog = set === 'yard' && o.bg !== 'transparent' ? new THREE.Fog('#cfe3f7', 30, 120) : null;
    bar.root.visible = usesBarometer();
    straw.root.visible = s.ex === 'straw';
    tank.root.visible = s.ex === 'tank';
    lab.setHeight(s.ex === 'mountain' ? ALTITUDES[s.altAt] : 0);
    syncBarometer();
    // the straw
    straw.setLevel(s.drink);
    // the yard's water and its small barometer (settled at 76 cm)
    yard.setWater(s.wtop);
    yard.mini.setPose(0, MOUTH_Y, 0);
    yard.mini.setColumn(0, MD + H_HG);
    // the tank
    tank.setWater(s.level);
    tank.setJet(s.reach, s.jetR);
    tank.lid.position.set(-s.lid * 0.03, BOX.h + 0.006 + s.lid * 0.045, 0);
    tank.lid.rotation.z = s.lid * 0.32;
    tank.cork.position.set(HOLE.x + 0.004 + s.cork * 0.05, HOLE.y - s.cork * s.cork * (HOLE.y - 0.007), 0);
    tank.cork.rotation.z = -Math.PI / 2 + s.cork * 1.2;
    const pud = s.ex === 'tank' && (s.kphase === 'open' || s.kphase === 'stopped') ? 1 : 0;
    tank.puddle.position.x = tank.landing(Math.max(s.reach, s.kphase === 'stopped' ? 0.004 : 0));
    tank.puddle.scale.set(pud * (s.kphase === 'open' ? 0.03 : 0.012), pud * (s.kphase === 'open' ? 0.018 : 0.008), 1);
    tank.puddle.visible = pud > 0;
    layoutArrows();
    stage.invalidate();
  }

  // the arrows a few pixels thick however far the camera is
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  const thick = (r, px = 2.6) => Math.min(3, Math.max(1, (px * perPixel()) / r));

  function layoutArrows() {
    for (const a of allArrows) a.hide();
    pass.show(0);
    for (const d of Object.values(dims)) d.hide();
    readLine.visible = false;
    const k = air();
    if (usesBarometer()) {
      const len = AIR_LEN.lab * k;
      const kk = thick(0.0034);
      const settledLike = s.ex !== 'torricelli' || ['settled', 'falling', 'dipped', 'piercing', 'pierced'].includes(s.phase);
      if (inDish() && settledLike) {
        arrows.dish.forEach((a, i) => {
          a.set(V(i ? 0.058 : -0.058, SURFACE_Y + len, 0.03), DOWN, len);
          a.scale(kk);
        });
        const still = s.phase === 'settled' || s.ex !== 'torricelli';
        if (still && s.tilt === 0 && !s.hole) {
          pass.show(1);
          pass.root.scale.set(1, 1, 1);
          // the column's pressure, from above, meets the air's pressure passed up, at the dish's level
          arrows.col.set(V(0, SURFACE_Y + 0.006 + len, 0.03), DOWN, len);
          arrows.col.scale(thick(0.0028));
        }
      }
      if (s.hole && (s.phase === 'piercing' || s.phase === 'pierced')) {
        const top = tubeTop(V(0, 0, 0));
        arrows.top.set(V(top.x, top.y + 0.02 + AIR_LEN.lab * 0.8, 0.02), DOWN, AIR_LEN.lab * 0.8);
        arrows.top.scale(thick(0.0032));
      }
      // heights: the column's (left, dotted, as the book's figure), the vacuum's, or a tilted tube's vertical height
      const settled = s.ex !== 'torricelli' || s.phase === 'settled';
      if (settled && s.tilt === 0 && s.show.h) {
        const yTop = SURFACE_Y + s.H;
        dims.h.set(-0.122, SURFACE_Y, yTop, 0.02);
        setReadLine(-0.122, -TUBE_R.outer - 0.002, yTop);
      }
      if (settled && s.tilt === 0 && s.show.vacuum) dims.vac.set(-0.048, SURFACE_Y + s.H + 0.004, MOUTH_Y + L - 0.001, 0.02);
      if (s.ex === 'tilt' && s.tilt > 0.01) {
        const top = columnTop(V(0, 0, 0));
        if (s.show.tilt) dims.vert.set(top.x, SURFACE_Y, top.y, 0.02);
        setReadLine(top.x, SCALE.x + 0.004, top.y);
      }
    }
    if (s.ex === 'straw') {
      const x0 = straw.root.position.x;
      const len = AIR_LEN.straw;
      arrows.bottle.forEach((a, i) => {
        a.set(V(x0 + (i ? 0.0135 : -0.0135), DRINK_Y + len + 0.002, 0.02), DOWN, len);
        a.scale(thick(0.0022, 2.4));
      });
      // the mouth's pressure: in the pocket of air, pointing at the straw's end
      const ml = len * s.mouthP;
      const tipX = x0 + MOUTH.x - 0.02;
      arrows.mouth.set(V(tipX - ml, MOUTH.y, straw.zFace + 0.012), RIGHT, ml);
      arrows.mouth.scale(thick(0.0022, 2.4));
    }
    if (s.ex === 'tank') {
      const len = AIR_LEN.tank;
      const yS = TANK.floor + s.level;
      if (s.lid > 0.6)
        arrows.tankTop.forEach((a, i) => {
          a.set(V(i ? 0.045 : -0.045, yS + len + 0.002, 0.02), DOWN, len);
          a.scale(thick(0.0028));
        });
      if (s.cork > 0.6 && s.kphase === 'stopped') {
        arrows.hole.set(V(HOLE.x + 0.008 + len, HOLE.y, 0.02), LEFT, len);
        arrows.hole.scale(thick(0.0028));
      }
      if (s.show.h && s.cork > 0.6) dims.depth.set(HOLE.x + (s.reach > 0.01 ? -0.03 : 0.026), HOLE.y, yS, 0.075);
    }
    if (s.ex === 'water') {
      const len = AIR_LEN.yard;
      arrows.tub.forEach((a, i) => {
        a.set(V(i ? 0.29 : -0.29, TUB.water + len + 0.02, 0.1), DOWN, len);
        a.scale(thick(0.028));
      });
      if (s.wphase === 'done' && s.show.h) dims.water.set(-PIPE.r - 0.16, TUB.water, s.wtop, 0.1);
    }
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  function plan() {
    if (s.ex === 'straw') return s.suck ? { label: 'act_stop', step: s.found.straw ? '' : 2 } : { label: 'act_suck', step: s.found.straw ? '' : 1 };
    if (s.ex === 'torricelli') {
      const fresh = !s.found.torricelli;
      if (s.phase === 'ready' || s.phase === 'filling') return { label: 'act_fill', step: fresh ? 1 : '' };
      if (s.phase === 'full' || s.phase === 'turning') return { label: 'act_turn', step: fresh ? 2 : '' };
      if (s.phase === 'dipped' || s.phase === 'falling') return { label: 'act_release', step: fresh ? 3 : '' };
      if (s.phase === 'settled' || s.phase === 'piercing') return { label: 'act_pierce', step: s.found.pierced ? '' : 4 };
      return { label: 'act_again', step: '' };
    }
    if (s.ex === 'tilt') return s.tiltAt < TILTS.length - 1 ? { label: 'act_tilt', step: s.found.tilt ? '' : 1 } : { label: 'act_upright', step: '' };
    if (s.ex === 'mountain')
      return s.altAt < ALTITUDES.length - 1 ? { label: 'act_up', step: s.found.mountain ? '' : 1 } : { label: 'act_down', step: '' };
    if (s.ex === 'water') return s.wphase === 'done' ? { label: 'act_replay', step: '' } : { label: 'act_water', step: s.found.water ? '' : 1 };
    if (s.kphase === 'corked' || s.kphase === 'corking') return { label: 'act_cork', step: s.found.tank ? '' : 1 };
    if (s.kphase === 'stopped' || s.kphase === 'opening') return { label: 'act_lid', step: s.found.lid ? '' : 2 };
    return { label: 'act_refill', step: '' };
  }

  const cmOf = (m) => N(toCm(m));
  function outcomeHtml() {
    const h = cmOf(s.H);
    if (s.ex === 'straw') {
      if (!s.suck) return t('out_straw_rest');
      return s.drink >= STRAW.top - 1e-4 ? t('out_straw_up') : t('out_straw_suck');
    }
    if (s.ex === 'torricelli') {
      const key = {
        ready: 'out_t_ready',
        filling: 'out_t_filling',
        full: 'out_t_full',
        turning: 'out_t_turning',
        dipped: 'out_t_dipped',
        falling: 'out_t_falling',
        settled: 'out_t_settled',
        piercing: 'out_t_piercing',
        pierced: 'out_t_pierced',
      }[s.phase];
      return t(key, { h });
    }
    if (s.ex === 'tilt') {
      if (s.busy) return t('out_tilting');
      return TILTS[s.tiltAt] ? t('out_tilt', { deg: N(TILTS[s.tiltAt]), h }) : t('out_tilt0', { h });
    }
    if (s.ex === 'mountain') {
      if (s.busy) return t('out_mt_moving');
      const z = ALTITUDES[s.altAt];
      return z ? t('out_mt', { z: G3(z), h }) : t('out_mt0', { h });
    }
    if (s.ex === 'water') {
      if (s.wphase === 'rising') return t('out_w_rising');
      if (s.wphase === 'done') return t('out_w_done', { h: N(H_WATER) });
      return t('out_w_ready', { L: N(Math.round(PIPE.top)) });
    }
    if (s.kphase === 'open') return holeDepth(s.level) < holeDepth(TANK.water) - 0.03 ? t('out_k_drain') : t('out_k_open');
    return t({ corked: 'out_k_ready', corking: 'out_k_corking', stopped: 'out_k_stopped', opening: 'out_k_opening' }[s.kphase]);
  }

  function ruleHtml() {
    const h = cmOf(s.H);
    if (s.ex === 'straw') return s.found.straw ? t('rule_straw1', { h: N(H_WATER) }) : t('rule_straw0');
    if (s.ex === 'torricelli') {
      if (s.phase === 'pierced' || s.phase === 'piercing') return t('rule_t_pierced');
      if (s.phase === 'settled') return t('rule_t_settled', { h });
      if (s.phase === 'full' || s.phase === 'turning' || s.phase === 'dipped' || s.phase === 'falling') return t('rule_t1');
      return t('rule_t0', { year: N(1643) });
    }
    if (s.ex === 'tilt') return t('rule_tilt', { h });
    if (s.ex === 'mountain') return t('rule_mt');
    if (s.ex === 'water') return t('rule_water', { k: N(RATIO), hHg: N(76), h: N(H_WATER) });
    if (s.kphase === 'open' || s.kphase === 'opening') return t('rule_tank2');
    if (s.kphase === 'stopped') return t('rule_tank1');
    return t('rule_tank0');
  }

  /** The formula: the column it is about, P = hρg with its numbers, the result. */
  function formula() {
    const sum = (h, rho, d = 2) => t('eq_sum', { h: fix(h, d), rho: G3(rho), g: N(G) });
    const atm = (P) => t('eq_res_atm', { P: G3(P), ten: N(10), five: N(5) });
    if (s.ex === 'straw') {
      const h = Math.max(0, s.drink - DRINK_Y);
      return { cap: t('eq_straw'), sum: sum(h, RHO.drink), res: t('eq_res', { P: G3(columnPressure(round(h, 2), RHO.drink)) }) };
    }
    if (s.ex === 'water') {
      const h = Math.max(0, s.wtop - TUB.water);
      const done = s.wphase === 'done';
      return {
        cap: t('eq_water'),
        sum: sum(done ? H_WATER : h, RHO.water, 1),
        res: done ? atm(columnPressure(H_WATER, RHO.water)) : t('eq_res', { P: G3(columnPressure(round(h, 1), RHO.water)) }),
      };
    }
    if (s.ex === 'tank') {
      const h = holeDepth(s.level);
      return { cap: t('eq_tank'), sum: sum(h, RHO.water), res: t('eq_res', { P: G3(columnPressure(round(h, 2), RHO.water)) }) };
    }
    if (s.ex === 'torricelli' && s.phase !== 'settled' && s.phase !== 'pierced') return { cap: t('eq_hg_wait'), sum: t('eq_wait'), res: '&nbsp;' };
    if (s.ex === 'torricelli' && s.phase === 'pierced') return { cap: t('eq_hg_zero'), sum: sum(0, RHO.mercury), res: t('eq_res', { P: N(0) }) };
    const H = round(s.H, 2);
    return { cap: t('eq_hg'), sum: sum(H, RHO.mercury), res: atm(columnPressure(H, RHO.mercury)) };
  }

  const lastEq = { cap: '', sum: '', res: '' };
  function writeEq() {
    const f = formula();
    if (f.cap !== lastEq.cap) eqCap.innerHTML = lastEq.cap = f.cap;
    if (f.sum !== lastEq.sum) eqSum.innerHTML = lastEq.sum = f.sum;
    if (f.res !== lastEq.res) eqRes.innerHTML = lastEq.res = f.res;
  }

  function nextWord() {
    if (!s.found[s.ex === 'torricelli' ? 'pierced' : s.ex === 'tank' ? 'lid' : s.ex]) return null;
    const i = EXAMPLES.indexOf(s.ex);
    for (let k = 1; k < EXAMPLES.length; k++) {
      const id = EXAMPLES[(i + k) % EXAMPLES.length];
      if (!s.found[id === 'torricelli' ? 'pierced' : id === 'tank' ? 'lid' : id]) return id;
    }
    return null;
  }

  let lastNote = '';
  function refresh() {
    sheet.choose(s.ex);
    sheet.next(nextWord());
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    writeEq();
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label, enabled: true });
      // the ring only while there is a numbered step to take and nothing moves; then the arrows need the room
      if (p.step !== '' && !s.busy && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    let n = '';
    if (s.ex === 'mountain') n = ALTITUDES[s.altAt] ? t('note_mt', { z: G3(ALTITUDES[s.altAt]) }) : t('note_sea');
    else if (s.ex === 'straw') n = t('note_straw');
    else if (s.ex === 'tank' && s.kphase === 'open') n = t('note_fast');
    else if (usesBarometer() && (s.look === 'vacuum' || s.look === 'dish')) n = t('note_tube');
    if (n !== lastNote) {
      note.innerHTML = n;
      lastNote = n;
    }
    note.hidden = !n || stage.height < 230;
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const A0 = { x: 0, y: 0 };
  const A1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  function arrowBoxes() {
    const list = [];
    for (const a of allArrows) {
      if (!a.visible) continue;
      toScreen(a.root.position, A0);
      toScreen(a.tip, A1);
      list.push({ left: Math.min(A0.x, A1.x) - 7, top: Math.min(A0.y, A1.y) - 7, right: Math.max(A0.x, A1.x) + 7, bottom: Math.max(A0.y, A1.y) + 7 });
    }
    return list;
  }
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  function screenBox(b3) {
    let i = 0;
    for (const x of [b3.min.x, b3.max.x])
      for (const y of [b3.min.y, b3.max.y]) for (const z of [b3.min.z, b3.max.z]) corners[i++].set(x, y, z).project(camera);
    const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
    const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }
  const tubeBox3 = new THREE.Box3();
  /** The tube on the screen (labels keep off it), as a few boxes along it. */
  function tubeBoxes() {
    if (!usesBarometer() || !bar.root.visible) return [];
    const out = [];
    const a = s.pose.a;
    const dir = V(-Math.sin(a), Math.cos(a), 0);
    for (let i = 0; i < 6; i++) {
      const p0 = V(s.pose.x, s.pose.y, 0).addScaledVector(dir, (i / 6) * L);
      const p1 = V(s.pose.x, s.pose.y, 0).addScaledVector(dir, ((i + 1) / 6) * L);
      tubeBox3.makeEmpty().expandByPoint(p0).expandByPoint(p1).expandByScalar(TUBE_R.outer);
      out.push(screenBox(tubeBox3));
    }
    return out;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, note, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(14, 0), spot(14, -16), spot(14, 16), spot(20, -30)];
  const LEFT_OF = [spot(-14, 0), spot(-14, -16), spot(-14, 16), spot(-20, -30)];
  const ABOVE = [spot(0, -18), spot(16, -18), spot(-16, -18), spot(0, -34)];
  const BELOW = [spot(0, 18), spot(16, 18), spot(-16, 18), spot(0, 34)];
  const labelState = new Map();
  function syncLabels() {
    const want = new Map();
    const add = (id, w) => want.set(id, w);
    const own = [tubeBoxes];
    const compact = stage.height < 260 || stage.width < 330;
    if (s.show.labels) {
      if (usesBarometer()) {
        const settled = s.ex !== 'torricelli' || s.phase === 'settled';
        const dishVisible = inDish() && (s.ex !== 'torricelli' || ['settled', 'pierced', 'dipped', 'falling', 'piercing'].includes(s.phase));
        const far = s.look === 'all' || s.look === 'wide';
        if (dishVisible && arrows.dish[0].visible && s.look !== 'vacuum')
          add('air', {
            text: t('lbl_air'),
            point: () => V(-0.058, SURFACE_Y + AIR_LEN.lab * air() * 0.75, 0.03),
            spots: [...LEFT_OF, ...ABOVE],
            color: COLORS.air,
          });
        if (settled && s.tilt === 0 && s.show.h)
          add('h', {
            text: t('lbl_h', { h: cmOf(s.H) }),
            point: () => V(-0.122, SURFACE_Y + s.H * 0.5, 0.02),
            spots: [...LEFT_OF, ...RIGHT_OF],
            color: COLORS.h,
          });
        if (settled && s.show.vacuum && s.look !== 'dish' && vacuumLength(s.H, s.tilt) > 0.02)
          add('vac', {
            text: t('lbl_vacuum'),
            point: () =>
              s.tilt === 0 ? V(-0.048, SURFACE_Y + s.H + (L - MD - s.H) * 0.55, 0.02) : tubeTop(V(0, 0, 0)).lerp(columnTop(V(0, 0, 0)), 0.45),
            spots: [...LEFT_OF, ...ABOVE, ...RIGHT_OF],
            color: COLORS.ink,
          });
        if (s.ex === 'torricelli' && arrows.col.visible && (s.look === 'dish' || (far && !compact)))
          add('col', {
            text: t('lbl_col'),
            point: () => V(0, SURFACE_Y + AIR_LEN.lab * 0.8, 0.03),
            spots: [...RIGHT_OF, spot(40, -24)],
            color: COLORS.col,
            optional: true,
          });
        if (arrows.top.visible)
          add('airtop', {
            text: t('lbl_air'),
            point: () => V(0, 0, 0).copy(arrows.top.root.position).lerp(arrows.top.tip, 0.35),
            spots: [...LEFT_OF, ...RIGHT_OF],
            color: COLORS.air,
          });
        if (s.ex === 'torricelli' && ['ready', 'filling', 'full'].includes(s.phase) && s.fill > 0.2)
          add('hg', { text: t('lbl_mercury'), point: () => V(FILL_X, UP_Y * 0.35, 0), spots: [...LEFT_OF, ...RIGHT_OF], color: COLORS.ink });
        if (s.ex === 'torricelli' && (s.phase === 'full' || s.phase === 'dipped') && s.thumb.on)
          add('thumb', {
            text: t('lbl_thumb'),
            point: () => (s.phase === 'full' ? V(s.pose.x, s.pose.y + 0.012, 0) : V(0, SURFACE_Y + 0.004, 0.06)),
            spots: [...RIGHT_OF, ...LEFT_OF],
            color: COLORS.ink,
            optional: true,
          });
        if (s.ex === 'tilt' && s.tilt > 0.01 && !s.busy && s.show.tilt) {
          add('vert', {
            text: t('lbl_vert', { h: cmOf(s.H) }),
            point: () => columnTop(V(0, 0, 0)).setY(SURFACE_Y + s.H * 0.45),
            spots: [...LEFT_OF, ...RIGHT_OF],
            color: COLORS.h,
          });
          add('along', {
            text: t('lbl_along', { L: N(toCm(tiltLength(s.H, s.tilt))) }),
            point: () => {
              const a = THREE.MathUtils.degToRad(s.tilt);
              return V(-Math.sin(a) * s.col * 0.62, MOUTH_Y + Math.cos(a) * s.col * 0.62, 0);
            },
            spots: [...RIGHT_OF, ...BELOW],
            color: COLORS.ink,
          });
        }
      }
      if (s.ex === 'straw') {
        const x0 = straw.root.position.x;
        add('outside', {
          text: t('lbl_outside'),
          point: () => V(x0 + 0.0135, DRINK_Y + AIR_LEN.straw * 0.7, 0.02),
          spots: [...RIGHT_OF, ...ABOVE],
          color: COLORS.air,
        });
        add('mouth', {
          text: t('lbl_mouth'),
          point: () => V(x0 + MOUTH.x - 0.035, MOUTH.y + 0.006, straw.zFace),
          spots: [...ABOVE, ...LEFT_OF],
          color: COLORS.air,
        });
        if (!s.suck && !compact)
          add('same', {
            text: t('lbl_same'),
            point: () => V(x0, DRINK_Y, 0.03),
            spots: [spot(40, 30), spot(-40, 30), ...BELOW],
            color: COLORS.ink,
            optional: true,
          });
      }
      if (s.ex === 'tank') {
        if (s.cork > 0.6 && s.show.h)
          add('depth', {
            text: t('lbl_depth', { h: fix(holeDepth(s.level), 2) }),
            point: () => V(HOLE.x + (s.reach > 0.01 ? -0.03 : 0.026), HOLE.y + holeDepth(s.level) * 0.55, 0.075),
            spots: s.reach > 0.01 ? [...LEFT_OF, ...ABOVE] : [...RIGHT_OF, ...ABOVE],
            color: COLORS.h,
          });
        if (s.kphase === 'stopped' && s.cork > 0.6)
          add('airhole', { text: t('lbl_air'), point: () => V(HOLE.x + 0.04, HOLE.y, 0.02), spots: [...BELOW, ...ABOVE], color: COLORS.air });
        if (s.lid > 0.6)
          add('airtop', {
            text: t('lbl_air'),
            point: () => V(-0.045, TANK.floor + s.level + AIR_LEN.tank * 0.8, 0.02),
            spots: [...LEFT_OF, ...ABOVE],
            color: COLORS.air,
          });
      }
      if (s.ex === 'water') {
        add('mini', {
          text: t('lbl_mini', { h: N(76) }),
          point: () => V(MINI_X, SURFACE_Y + H_HG * 0.6, 0.15),
          spots: [...LEFT_OF, ...ABOVE],
          color: COLORS.ink,
        });
        if (s.wphase === 'done' && s.show.h)
          add('water', {
            text: t('lbl_water', { h: N(H_WATER) }),
            point: () => V(-PIPE.r - 0.16, TUB.water + H_WATER * 0.55, 0.1),
            spots: [...LEFT_OF, ...RIGHT_OF],
            color: COLORS.h,
          });
        if (s.wphase === 'done' && s.show.vacuum)
          add('wvac', {
            text: t('lbl_vacuum'),
            point: () => V(0, (s.wtop + PIPE.top) / 2, 0),
            spots: [...RIGHT_OF, ...LEFT_OF],
            color: COLORS.ink,
            optional: true,
          });
        if (s.look !== 'follow')
          add('tub', {
            text: t('lbl_air'),
            point: () => V(0.29, TUB.water + AIR_LEN.yard * 0.8, 0.1),
            spots: [...RIGHT_OF, ...ABOVE],
            color: COLORS.air,
            optional: true,
          });
      }
    }
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.spots.map((p) => `${p.dx},${p.dy}`).join(';')}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, avoid: own, optional: w.optional });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const bbox = new THREE.Box3();
  const DIR = { lab: V(0.12, 0.16, 1), close: V(0.1, 0.1, 1), yard: V(0.18, 0.06, 1) };
  function lookBox() {
    if (s.ex === 'straw') return { b: box3(-0.17, 0.05, 0.15, 0.56), dir: DIR.lab };
    if (s.ex === 'tank') return { b: box3(-0.115, -0.005, 0.36, 0.38, 0.07), dir: DIR.lab };
    if (s.ex === 'water') {
      if (s.look === 'low') return { b: box3(-1.25, -0.02, 0.75, 2.2, 0.3), dir: DIR.yard };
      if (s.look === 'follow') {
        const y = Math.max(1.6, s.followY);
        return { b: box3(-1.0, y - 1.7, 0.75, y + 1.0, 0.3), dir: DIR.yard };
      }
      return { b: box3(-1.3, -0.05, 0.9, PIPE.top + 0.5, 0.3), dir: DIR.yard };
    }
    if (s.look === 'vacuum') return { b: box3(-0.13, SURFACE_Y + s.H - 0.1, 0.1, MOUTH_Y + L + 0.03, 0.03), dir: DIR.close };
    if (s.look === 'dish') return { b: box3(-0.135, -0.01, 0.12, SURFACE_Y + AIR_LEN.lab + 0.07, 0.1), dir: V(0.1, 0.2, 1) };
    if (s.look === 'wide') return { b: box3(-0.66, -0.01, 0.48, 1.16), dir: DIR.lab };
    if (s.ex === 'tilt') return { b: box3(-0.7, -0.01, 0.11, 1.14, 0.1), dir: DIR.lab };
    if (s.ex === 'mountain') return { b: box3(-0.16, -0.01, WINDOW.x0 + 0.36, 1.16, 0.1), dir: V(0.05, 0.14, 1) };
    if (s.ex === 'torricelli' && !inDish()) return { b: box3(-0.26, -0.01, 0.11, 1.16, 0.1), dir: DIR.lab };
    return { b: box3(-0.16, -0.01, 0.11, 1.15, 0.1), dir: DIR.lab };
  }
  function viewPose() {
    const { b, dir } = lookBox();
    bbox.min.copy(b[0]);
    bbox.max.copy(b[1]);
    const d = dir.clone();
    if (s.view === '3d') d.add(V(0.7, 0.25, 0));
    return fitPose({ box: bbox, dir: d.normalize(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      layoutArrows();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: 'camera',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          camera.position.lerpVectors(p0, position, k);
          controls.target.lerpVectors(t0, aim, k);
          controls.update();
          layoutArrows();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (done) refresh();
        return done;
      });
  }
  const frame = (duration = 0.8) => (s.userMovedCamera ? Promise.resolve(true) : flyTo(viewPose(), duration));
  function setLook(look, duration = 0.9) {
    s.look = look;
    refresh();
    emit('look', { look });
    return frame(duration);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── animation helpers ───────────────────────────────────────────────────────
  const wait = (sec, key = 'wait') => tweener.animate({ key, duration: sec, onUpdate: () => {} }).finished;
  function anim(key, duration, onUpdate, e = ease.inOutCubic) {
    return tweener.animate({ key, duration, ease: e, onUpdate }).finished;
  }
  /** Stop everything that moves (a new action, example, question or reset). */
  function stopAll() {
    s.run++;
    for (const k of ['wait', 'tour', 'tube', 'thumb', 'col', 'tilt', 'alt', 'straw', 'water', 'tank', 'jet', 'lid', 'cork', 'puffs'])
      tweener.cancel(k);
    s.busy = false;
    beaker.visible = false;
    stream.visible = false;
    puffs.visible = false;
  }

  // ── Torricelli's tube ───────────────────────────────────────────────────────
  function tubeReady() {
    s.phase = 'ready';
    s.fill = 0;
    s.pose = { x: FILL_X, y: UP_Y, a: Math.PI };
    s.thumb = { on: false, x: 0, y: 0 };
    s.col = L;
    s.hole = false;
    s.tilt = 0;
  }
  function tubeFull() {
    tubeReady();
    s.phase = 'full';
    s.fill = 1;
  }
  function tubeDipped() {
    s.phase = 'dipped';
    s.fill = 1;
    s.pose = { x: 0, y: MOUTH_Y, a: 0 };
    s.thumb = { on: true, x: 0, y: 0 };
    s.col = L;
    s.hole = false;
    s.tilt = 0;
  }
  function tubeSettled(H = H_HG, deg = 0) {
    s.phase = 'settled';
    s.fill = 1;
    s.pose = { x: 0, y: MOUTH_Y, a: THREE.MathUtils.degToRad(deg) };
    s.thumb = { on: false, x: 0, y: 0 };
    s.H = H;
    s.tilt = deg;
    s.col = Math.min(L - TUBE_R.inner, tiltLength(MD + H, deg));
    s.hole = false;
  }
  function tubePierced() {
    tubeSettled();
    s.phase = 'pierced';
    s.hole = true;
    s.col = MD;
  }

  async function fillTube(token) {
    s.phase = 'filling';
    s.busy = true;
    beaker.visible = true;
    stream.visible = true;
    beaker.position.set(FILL_X + 0.045, UP_Y + 0.07, 0);
    beaker.rotation.z = 1.9;
    refresh();
    const ok = await anim(
      'tube',
      1.7,
      (k) => {
        s.fill = k;
        // the stream from the beaker's lip down to the mercury's surface in the tube
        const lip = V(FILL_X + 0.006, UP_Y + 0.06, 0);
        const surf = UP_Y - L * k;
        stream.position.copy(lip);
        stream.scale.y = Math.max(0.01, lip.y - surf);
        beaker.rotation.z = 1.9 + 0.25 * k;
        syncScene();
      },
      ease.linear,
    );
    beaker.visible = false;
    stream.visible = false;
    if (!ok || token !== s.run) return;
    s.phase = 'full';
    s.busy = false;
    audio.pop();
    syncScene();
    refresh();
    emitChange();
  }

  async function turnTube(token) {
    s.phase = 'turning';
    s.busy = true;
    refresh();
    // the thumb comes down on the mouth
    s.thumb = { on: true, x: 0, y: -0.04 };
    let ok = await anim('thumb', 0.45, (k) => {
      s.thumb.y = -0.04 * (1 - k);
      syncScene();
    });
    if (!ok || token !== s.run) return;
    audio.contact();
    // turn it over through the air (the camera steps back to see the whole swing), then dip the mouth
    s.look = 'wide';
    frame(0.6);
    const c0 = V(FILL_X, UP_Y - L / 2, 0);
    const dipY = MOUTH_Y + 0.07;
    const c1 = V(0, dipY + L / 2, 0);
    ok = await anim('tube', 1.6, (k) => {
      const a = Math.PI * (1 - k);
      const c = c0.clone().lerp(c1, k);
      c.y += 0.12 * Math.sin(Math.PI * k);
      s.pose = { x: c.x + Math.sin(a) * (L / 2), y: c.y - Math.cos(a) * (L / 2), a };
      syncScene();
    });
    if (!ok || token !== s.run) return;
    s.look = 'all';
    s.phase = 'dipped'; // (for the camera's box: the tube is over the dish now)
    frame(0.6);
    s.phase = 'turning';
    ok = await anim('tube', 0.6, (k) => {
      s.pose = { x: 0, y: dipY + (MOUTH_Y - dipY) * k, a: 0 };
      syncScene();
    });
    if (!ok || token !== s.run) return;
    tubeDipped();
    s.busy = false;
    audio.contact();
    syncScene();
    refresh();
    emitChange();
  }

  async function releaseTube(token) {
    s.phase = 'falling';
    s.busy = true;
    refresh();
    // the thumb comes out of the mercury and away
    let ok = await anim('thumb', 0.5, (k) => {
      s.thumb.x = -0.07 * k;
      s.thumb.y = -0.07 * k * k;
      syncScene();
    });
    s.thumb.on = false;
    if (!ok || token !== s.run) return;
    // the mercury falls and bobs to rest at 76 cm
    const target = MD + s.H;
    const A = L - target;
    ok = await anim(
      'col',
      2.0,
      (k) => {
        const tt = k * 2.0;
        const x = k < 1 ? Math.exp(-2.6 * tt) * Math.cos(5.2 * tt) * (1 - k * k) : 0;
        s.col = target + A * x;
        syncScene();
      },
      ease.linear,
    );
    if (!ok || token !== s.run) return;
    tubeSettled(s.H);
    s.busy = false;
    const first = !s.found.torricelli;
    s.found.torricelli = true;
    audio.success();
    syncScene();
    refresh();
    emit('settle', snapshot());
    emitChange();
    if (first && s.mode === 'explore') tour(token);
  }

  /** After the first settle: close to the vacuum, then the dish, then all of it. */
  async function tour(token) {
    for (const [look, hold] of [
      ['vacuum', 0.6],
      ['dish', 2.6],
      ['all', 2.6],
    ]) {
      await wait(hold, 'tour');
      if (token !== s.run || s.mode !== 'explore' || s.userMovedCamera) return;
      await setLook(look, 0.9);
      if (token !== s.run) return;
    }
  }

  async function pierceTube(token) {
    s.phase = 'piercing';
    s.busy = true;
    s.hole = true;
    s.look = 'all';
    audio.pop();
    syncScene();
    refresh();
    frame(0.6);
    // puffs of air rush into the hole
    const top = V(0, MOUTH_Y + L - 0.035, TUBE_R.outer);
    const M = new THREE.Matrix4();
    puffs.visible = true;
    const fallFrom = s.col;
    const ok = await anim(
      'col',
      1.6,
      (k) => {
        for (let i = 0; i < puffs.count; i++) {
          const u = (k * 3 + i / puffs.count) % 1;
          const ang = (i * 2.4) % (Math.PI * 2);
          M.makeTranslation(top.x + Math.cos(ang) * 0.05 * (1 - u), top.y + Math.sin(ang) * 0.03 * (1 - u) + 0.01, top.z + 0.03 * (1 - u));
          puffs.setMatrixAt(i, M);
        }
        puffs.instanceMatrix.needsUpdate = true;
        const kk = Math.max(0, (k - 0.15) / 0.85);
        s.col = fallFrom + (MD - fallFrom) * ease.inOutCubic(kk);
        syncScene();
      },
      ease.linear,
    );
    puffs.visible = false;
    if (!ok || token !== s.run) return;
    tubePierced();
    s.busy = false;
    s.found.pierced = true;
    syncScene();
    refresh();
    emitChange();
  }

  // ── tilt, height, straw, water, tank ────────────────────────────────────────
  async function tiltTo(i, token, { animate = true } = {}) {
    s.tiltAt = i;
    const from = s.tilt;
    const to = TILTS[i];
    s.busy = animate;
    refresh();
    const set = (deg) => {
      s.tilt = deg;
      s.col = Math.min(L - TUBE_R.inner, tiltLength(MD + s.H, deg));
      syncScene();
    };
    if (animate) {
      const ok = await anim('tilt', 0.9, (k) => set(from + (to - from) * k));
      if (!ok || token !== s.run) return;
    }
    set(to);
    s.busy = false;
    if (to > 0) s.found.tilt = true;
    refresh();
    emitChange();
  }

  async function climbTo(i, token, { animate = true } = {}) {
    s.altAt = i;
    const from = s.H;
    const to = columnAt(ALTITUDES[i]);
    s.busy = animate;
    syncScene(); // the window's view changes at once
    refresh();
    const set = (H) => {
      s.H = H;
      s.col = MD + H;
      syncScene();
    };
    if (animate) {
      const ok = await anim('alt', 1.3, (k) => set(from + (to - from) * k));
      if (!ok || token !== s.run) return;
    }
    set(to);
    s.busy = false;
    if (i > 0) s.found.mountain = true;
    refresh();
    emitChange();
  }

  async function suck(on, token, { animate = true } = {}) {
    s.suck = on;
    const from = s.drink;
    const to = on ? STRAW.top + 0.001 : DRINK_Y;
    const p0 = s.mouthP;
    const p1 = on ? 0.62 : 1;
    s.busy = animate;
    refresh();
    const set = (k) => {
      s.mouthP = p0 + (p1 - p0) * Math.min(1, k * 3);
      s.drink = from + (to - from) * k;
      syncScene();
    };
    if (animate) {
      if (on) audio.pop();
      const ok = await anim('straw', on ? 1.4 : 0.9, set);
      if (!ok || token !== s.run) return;
    }
    set(1);
    s.busy = false;
    if (!on) s.found.straw = true;
    refresh();
    emitChange();
  }

  async function raiseWater(token, { animate = true } = {}) {
    const top = TUB.water + H_WATER;
    if (!animate) {
      s.wtop = top;
      s.wphase = 'done';
      s.found.water = true;
      s.look = 'all';
      syncScene();
      refresh();
      emitChange();
      return;
    }
    s.wphase = 'rising';
    s.busy = true;
    s.wtop = TUB.water;
    syncScene();
    await setLook('low', 0.8);
    if (token !== s.run) return;
    s.look = 'follow';
    const ok = await anim(
      'water',
      3.4,
      (k) => {
        s.wtop = TUB.water + H_WATER * k;
        s.followY = s.wtop;
        if (!s.userMovedCamera) {
          const pose = viewPose();
          camera.position.copy(pose.position);
          controls.target.copy(pose.target);
          controls.update();
        }
        syncScene();
        refresh();
      },
      ease.inOutCubic,
    );
    if (!ok || token !== s.run) return;
    s.wtop = top;
    s.wphase = 'done';
    s.busy = false;
    s.found.water = true;
    audio.success();
    syncScene();
    await setLook('all', 1.2);
    emitChange();
  }

  function tankReady() {
    s.kphase = 'corked';
    s.level = TANK.water;
    s.reach = 0;
    s.jetR = 0.0055;
    s.lid = 0;
    s.cork = 0;
  }
  function tankStopped() {
    tankReady();
    s.kphase = 'stopped';
    s.cork = 1;
  }
  function tankOpen(level = TANK.water) {
    tankStopped();
    s.kphase = 'open';
    s.lid = 1;
    s.level = level;
    s.reach = jetReach(holeDepth(level));
  }

  async function pullCork(token) {
    s.kphase = 'corking';
    s.busy = true;
    refresh();
    let ok = await anim('cork', 0.6, (k) => {
      s.cork = k;
      // a little water follows the cork out, then stops
      s.reach = jetReach(holeDepth(s.level)) * 0.55 * Math.sin(Math.PI * Math.min(1, k * 1.3));
      s.jetR = 0.0036 * (1 - k * 0.5);
      syncScene();
    });
    if (!ok || token !== s.run) return;
    ok = await anim('jet', 0.5, (k) => {
      s.reach = jetReach(holeDepth(s.level)) * 0.2 * (1 - k);
      s.jetR = 0.002 * (1 - k);
      syncScene();
    });
    if (!ok || token !== s.run) return;
    tankStopped();
    s.busy = false;
    s.found.tank = true;
    syncScene();
    refresh();
    emitChange();
  }

  async function openLid(token) {
    s.kphase = 'opening';
    s.busy = true;
    refresh();
    let ok = await anim('lid', 0.7, (k) => {
      s.lid = k;
      syncScene();
    });
    if (!ok || token !== s.run) return;
    s.kphase = 'open';
    s.found.lid = true;
    audio.pop();
    // the jet springs out, then the tank drains slowly (shown faster) and the jet weakens as h shrinks
    ok = await anim('jet', 0.35, (k) => {
      s.reach = jetReach(holeDepth(s.level)) * k;
      s.jetR = 0.0055;
      syncScene();
    });
    if (!ok || token !== s.run) return;
    s.busy = false;
    refresh();
    emitChange();
    const from = s.level;
    ok = await anim(
      'tank',
      9,
      (k) => {
        s.level = from + (TANK.low - from) * k;
        s.reach = jetReach(holeDepth(s.level));
        syncScene();
        refresh();
      },
      ease.linear,
    );
    if (!ok || token !== s.run) return;
    emitChange();
  }

  // ── the action: the big button, the badge on the part, a tap on the part ─────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not do two steps at once
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const token = ++s.run;
    tweener.cancel('tour');
    tweener.cancel('wait');
    if (s.ex === 'straw') return suck(!s.suck, token);
    if (s.ex === 'torricelli') {
      if (s.phase === 'ready') return fillTube(token);
      if (s.phase === 'full') return turnTube(token);
      if (s.phase === 'dipped') return releaseTube(token);
      if (s.phase === 'settled') return pierceTube(token);
      tubeReady();
      s.look = 'all';
      syncScene();
      refresh();
      emitChange();
      return frame(0.7);
    }
    if (s.ex === 'tilt') return tiltTo(s.tiltAt < TILTS.length - 1 ? s.tiltAt + 1 : 0, token);
    if (s.ex === 'mountain') return climbTo(s.altAt < ALTITUDES.length - 1 ? s.altAt + 1 : 0, token);
    if (s.ex === 'water') {
      if (s.wphase === 'done') {
        s.wtop = TUB.water;
        s.wphase = 'ready';
      }
      return raiseWater(token);
    }
    if (s.kphase === 'corked') return pullCork(token);
    if (s.kphase === 'stopped') return openLid(token);
    tankReady();
    syncScene();
    refresh();
    emitChange();
  }

  const tgtBox = new THREE.Box3();
  function actionTarget() {
    if (s.ex === 'straw') return V(straw.root.position.x, DRINK_Y + 0.11, 0.02);
    if (s.ex === 'torricelli') {
      if (s.phase === 'ready' || s.phase === 'full') {
        tgtBox.min.set(FILL_X - 0.02, 0, -0.02);
        tgtBox.max.set(FILL_X + 0.02, UP_Y + 0.01, 0.02);
        return tgtBox;
      }
      if (s.phase === 'dipped') return V(0, SURFACE_Y + 0.01, 0.05);
      if (s.phase === 'settled') return tubeTop(V(0, 0, 0));
      return null;
    }
    if (s.ex === 'tilt') return tubeTop(V(0, 0, 0));
    if (s.ex === 'mountain') {
      tgtBox.min.set(WINDOW.x0, WINDOW.y0, -0.42);
      tgtBox.max.set(WINDOW.x1, WINDOW.y1, -0.4);
      return tgtBox;
    }
    if (s.ex === 'water') return V(0, TUB.water + 0.6, 0.1);
    if (s.kphase === 'corked') return V(HOLE.x + 0.01, HOLE.y, 0.02);
    if (s.kphase === 'stopped') {
      tgtBox.min.set(-BOX.w / 2 - 0.01, BOX.h, -0.07);
      tgtBox.max.set(BOX.w / 2 + 0.01, BOX.h + 0.03, 0.07);
      return tgtBox;
    }
    return null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_fill',
    target: actionTarget,
    radius: 26,
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
  function hitList() {
    if (s.ex === 'straw') return straw.hitMeshes;
    if (s.ex === 'tank') return tank.hitMeshes;
    if (usesBarometer()) return bar.hitMeshes;
    return [];
  }
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    const list = hitList();
    if (!list.length) return false;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(list, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return;
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'pointer') : '';
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

  // ── examples ────────────────────────────────────────────────────────────────
  /** Put an example's scene in a still state that teaches (the barometer settled for tilt and height). */
  function enterExample(ex) {
    s.ex = ex;
    s.look = 'all';
    s.userMovedCamera = false;
    if (ex === 'tilt' || ex === 'mountain') {
      s.altAt = 0;
      s.tiltAt = 0;
      tubeSettled(H_HG, 0);
    }
    lightFor(setOf(ex));
  }
  // Torricelli's tube keeps its place in the steps while the student looks at other examples (the tilt and the
  // mountain use the tube settled); a step that was still moving goes back to where it started
  const STABLE = { filling: 'ready', turning: 'full', falling: 'dipped', piercing: 'settled' };
  let savedPhase = s.phase;
  function setExample(ex, { animate = true } = {}) {
    if (!EXAMPLES.includes(ex)) return Promise.resolve(false);
    stopAll();
    const prevEx = s.ex;
    if (prevEx === 'torricelli') savedPhase = STABLE[s.phase] || s.phase;
    s.H = H_HG;
    s.tilt = 0;
    s.tiltAt = 0;
    s.altAt = 0;
    if (ex === 'torricelli') jumpPhase(savedPhase, { found: false });
    if (ex === 'straw') {
      s.suck = false;
      s.drink = DRINK_Y;
      s.mouthP = 1;
    }
    if (ex === 'water') {
      s.wphase = 'ready';
      s.wtop = TUB.water;
    }
    if (ex === 'tank') tankReady();
    enterExample(ex);
    syncScene();
    refresh();
    emit('example', { example: ex });
    emitChange();
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const p = plan();
    const vertical = usesBarometer() ? round(Math.max(0, s.col * Math.cos(THREE.MathUtils.degToRad(s.tilt)) - MD), 4) : 0;
    return {
      example: s.ex,
      phase: s.phase,
      H: toCm(s.H), // the column's height when it stands (cm)
      column: usesBarometer() && inDish() ? toCm(vertical) : 0, // its vertical height now (cm)
      along: usesBarometer() && inDish() ? toCm(Math.max(0, s.col - MD / Math.cos(THREE.MathUtils.degToRad(s.tilt)))) : 0,
      vacuum: usesBarometer() && inDish() && !s.hole ? toCm(Math.max(0, L - TUBE_R.inner - s.col)) : 0,
      P: columnPressure(round(s.H, 2), RHO.mercury), // Pa, P = hρg
      tilt: TILTS[s.tiltAt],
      alt: ALTITUDES[s.altAt],
      suck: s.suck,
      rise: toCm(Math.max(0, s.drink - DRINK_Y)), // the drink in the straw above the bottle's level (cm)
      water: { phase: s.wphase, height: round(Math.max(0, s.wtop - TUB.water), 2) },
      tank: { phase: s.kphase, depth: holeDepth(s.level), jet: s.reach > 0.004 },
      look: s.look,
      busy: s.busy,
      found: { ...s.found },
      next: p.label.replace('act_', ''),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([
      snap.example,
      snap.phase,
      snap.H,
      snap.tilt,
      snap.alt,
      snap.suck,
      snap.water.phase,
      snap.tank.phase,
      snap.found,
      snap.mode,
      snap.view,
    ]);
    if (key === lastEmitted && !force) return;
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
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="tb-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  /** A question's scene: this example in this still state, these labels hidden; nothing moving. */
  function questionScene(ex, setup, show = {}) {
    stopAll();
    s.show = { labels: true, vacuum: true, h: true, tilt: true, ...show };
    enterExample(ex);
    setup();
    syncScene();
    refresh();
    return flyTo(viewPose(), 0.6);
  }
  function revealAll() {
    s.show = { labels: true, vacuum: true, h: true, tilt: true };
    syncScene();
    refresh();
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const cmText = (v) => `${N(v)}&nbsp;cm`;
  const paText = (v) => `${G3(v)}&nbsp;Pa`;
  const mText = (v) => (v < 1 ? `${N(toCm(v))}&nbsp;cm` : `${N(v)}&nbsp;m`);

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
        learnSaved = { ex: s.ex, tube: s.ex === 'torricelli' ? STABLE[s.phase] || s.phase : savedPhase, found: { ...s.found } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { labels: true, vacuum: true, h: true, tilt: true };
        s.found = { ...(learnSaved?.found || s.found) };
        syncUI();
        stopAll();
        // back to the example the student was on, and the tube's step (a moving step goes back to its start)
        const ex = learnSaved?.ex || 'torricelli';
        savedPhase = learnSaved?.tube || 'ready';
        s.ex = '';
        setExample(ex, { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['vacuum', 'tilt', 'mountain', 'water', pickOne(['straw', 'tank'])][i % 5];
        if (kind === 'vacuum') {
          await questionScene('torricelli', () => tubeSettled(), { vacuum: false });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_vac_right', 'c_vac_pull', 'c_vac_air', 'c_vac_press'].map((key) => ({ key }));
          return { text: t('q_vacuum'), ...choicesOf(items, kind, (x) => t(x.key)) };
        }
        if (kind === 'tilt') {
          const deg = pickOne([20, 30, 40]);
          await questionScene(
            'tilt',
            () => {
              s.tiltAt = TILTS.indexOf(deg);
              tubeSettled(H_HG, deg);
            },
            { tilt: false },
          );
          if (!alive()) return null;
          question = { kind, deg };
          return { text: t('q_tilt', { deg: N(deg) }), ...choicesOf(tiltChoices(deg), kind, (x) => cmText(x.v)) };
        }
        if (kind === 'mountain') {
          const at = pickOne([1, 2, 3]);
          await questionScene(
            'mountain',
            () => {
              s.altAt = at;
              tubeSettled(columnAt(ALTITUDES[at]));
            },
            { h: false },
          );
          if (!alive()) return null;
          const cm = toCm(columnAt(ALTITUDES[at]));
          question = { kind, cm };
          return {
            text: t('q_mt', { rho: G3(RHO.mercury), g: N(G) }),
            ...choicesOf(pressureChoices(cm), kind, (x) => paText(x.v)),
          };
        }
        if (kind === 'water') {
          await questionScene('torricelli', () => tubeSettled());
          if (!alive()) return null;
          question = { kind };
          return { text: t('q_water'), ...choicesOf(waterChoices(), kind, (x) => mText(x.v)) };
        }
        if (kind === 'straw') {
          await questionScene('straw', () => {
            s.suck = false;
            s.drink = DRINK_Y;
            s.mouthP = 1;
          });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_st_right', 'c_st_noair', 'c_st_narrow', 'c_st_down'].map((key) => ({ key }));
          return { text: t('q_straw'), ...choicesOf(items, kind, (x) => t(x.key)) };
        }
        await questionScene('tank', () => tankStopped());
        if (!alive()) return null;
        question = { kind: 'tank' };
        const items = ['c_tk_right', 'c_tk_small', 'c_tk_shallow', 'c_tk_lid'].map((key) => ({ key }));
        return { text: t('q_tank'), ...choicesOf(items, 'tank', (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const vars = { k: N(RATIO), hHg: N(76), h: N(H_WATER) };
        const note_ = (map, extra = {}) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], { ...vars, ...extra })}` : '');
        revealAll();
        if (k === 'vacuum') return t('why_vacuum') + note_({ c_vac_pull: 'mis_vac_pull', c_vac_air: 'mis_vac_air', c_vac_press: 'mis_vac_press' });
        if (k === 'tilt') {
          const Lc = N(toCm(tiltLength(H_HG, question.deg)));
          return t('why_tilt', { h: N(76), L: Lc }) + note_({ along: 'mis_tilt_along', cos: 'mis_tilt_cos', less: 'mis_tilt_less' }, { h: N(76) });
        }
        if (k === 'mountain') {
          const cm = question.cm;
          const extra = { cm: N(cm), h: fix(cm / 100, 2), sea: N(76) };
          return (
            t('why_mt', { P: G3(columnPressure(cm / 100, RHO.mercury)), h: fix(cm / 100, 2), rho: G3(RHO.mercury), g: N(G), cm: N(cm) }) +
            note_({ cm: 'mis_mt_cm', water: 'mis_mt_water', sea: 'mis_mt_sea' }, extra)
          );
        }
        if (k === 'water') return t('why_water', vars) + note_({ same: 'mis_water_same', divide: 'mis_water_divide', tenth: 'mis_water_tenth' });
        if (k === 'straw') return t('why_straw') + note_({ c_st_noair: 'mis_st_noair', c_st_narrow: 'mis_st_narrow', c_st_down: 'mis_st_down' });
        return (
          t('why_tank') +
          note_({ c_tk_small: 'mis_tk_small', c_tk_shallow: 'mis_tk_shallow', c_tk_lid: 'mis_tk_lid' }, { h: fix(holeDepth(TANK.water), 2) })
        );
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
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
    stopAll();
    tubeReady();
    savedPhase = 'ready';
    tankReady();
    s.suck = false;
    s.drink = DRINK_Y;
    s.mouthP = 1;
    s.wphase = 'ready';
    s.wtop = TUB.water;
    s.H = H_HG;
    s.tiltAt = 0;
    s.altAt = 0;
    const ex = s.ex;
    enterExample(ex);
    if (ex === 'tilt' || ex === 'mountain') tubeSettled();
    syncScene();
    refresh();
    emitChange();
    return flyTo(viewPose(), 0.6);
  }
  function step(dir) {
    if (s.locked) return lockedNudge();
    if (s.busy) return;
    const token = ++s.run;
    if (s.ex === 'tilt') tiltTo(Math.min(TILTS.length - 1, Math.max(0, s.tiltAt + dir)), token);
    else if (s.ex === 'mountain') climbTo(Math.min(ALTITUDES.length - 1, Math.max(0, s.altAt + dir)), token);
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
      else if (b.dataset.example !== s.ex || s.busy) setExample(b.dataset.example);
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
        else goHome();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey =
      ['1', '2', '3', '4', '5', '6', 'r', 'R', 'Home', 'ArrowUp', 'ArrowDown', '+', '-'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3', '4', '5', '6'].includes(k)) setExample(EXAMPLES[Number(k) - 1]);
    else if (k === 'ArrowUp' || k === '+') step(1);
    else if (k === 'ArrowDown' || k === '-') step(-1);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  /** Jump to a Torricelli phase at once (the book's set command and the URL parameter). */
  function jumpPhase(ph, { found = true } = {}) {
    if (ph === 'full') tubeFull();
    else if (ph === 'dipped') tubeDipped();
    else if (ph === 'settled') tubeSettled();
    else if (ph === 'pierced') tubePierced();
    else tubeReady();
    if (found && (ph === 'settled' || ph === 'pierced')) s.found.torricelli = true;
    if (found && ph === 'pierced') s.found.pierced = true;
  }
  syncUI();
  controls.enableRotate = s.view === '3d';
  jumpPhase(PHASES.includes(o.phase) ? o.phase : 'ready');
  savedPhase = s.phase;
  const startEx = s.ex;
  enterExample(startEx);
  if (startEx === 'tilt') {
    const i = TILTS.indexOf(Number(o.tilt));
    s.tiltAt = i > 0 ? i : 0;
    tubeSettled(H_HG, TILTS[s.tiltAt]);
  }
  if (startEx === 'mountain') {
    const i = ALTITUDES.indexOf(Number(o.alt));
    s.altAt = i > 0 ? i : 0;
    tubeSettled(columnAt(ALTITUDES[s.altAt]));
  }
  flyTo(viewPose(), 0);
  syncScene();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
  })();

  /** Waits for whatever the student (or set) started to finish. */
  async function settle() {
    for (let i = 0; i < 400 && s.busy; i++) await wait(0.05, 'settle');
  }

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /**
     * Change any of: example ('straw' | 'torricelli' | 'tilt' | 'mountain' | 'water' | 'tank'), phase (Torricelli's
     * tube: 'ready' | 'full' | 'dipped' | 'settled' | 'pierced'), tilt (0, 10, 20, 30, 40°), alt (0, 1000, 2000,
     * 3000 m), suck (true | false), water ('ready' | 'done'), tank ('corked' | 'stopped' | 'open'), look ('all' |
     * 'vacuum' | 'dish'), view ('front' | '3d'), found (what the rule has already told). animate: false lands at once.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.example && p.example !== s.ex) await setExample(p.example, { animate });
      if (p.found) Object.assign(s.found, p.found);
      if (p.phase && PHASES.includes(p.phase)) {
        if (s.ex !== 'torricelli') await setExample('torricelli', { animate: false });
        stopAll();
        if (animate) {
          // step by step from where it is
          const order = ['ready', 'full', 'dipped', 'settled', 'pierced'];
          if (order.indexOf(p.phase) < order.indexOf(s.phase) || !order.includes(s.phase)) tubeReady();
          while (order.indexOf(s.phase) < order.indexOf(p.phase)) {
            lastAct = Number.NEGATIVE_INFINITY;
            doAction();
            await settle();
          }
        } else {
          jumpPhase(p.phase);
          s.look = 'all';
          syncScene();
          flyTo(viewPose(), 0);
        }
      }
      if (p.tilt != null) {
        if (s.ex !== 'tilt') await setExample('tilt', { animate: false });
        const i = TILTS.indexOf(Number(p.tilt));
        if (i >= 0) await tiltTo(i, ++s.run, { animate });
      }
      if (p.alt != null) {
        if (s.ex !== 'mountain') await setExample('mountain', { animate: false });
        const i = ALTITUDES.indexOf(Number(p.alt));
        if (i >= 0) await climbTo(i, ++s.run, { animate });
      }
      if (p.suck != null) {
        if (s.ex !== 'straw') await setExample('straw', { animate: false });
        await suck(Boolean(p.suck), ++s.run, { animate });
      }
      if (p.water) {
        if (s.ex !== 'water') await setExample('water', { animate: false });
        if (p.water === 'done') await raiseWater(++s.run, { animate });
        else setExample('water', { animate: false });
      }
      if (p.tank) {
        if (s.ex !== 'tank') await setExample('tank', { animate: false });
        stopAll();
        if (p.tank === 'stopped') tankStopped();
        else if (p.tank === 'open') {
          tankOpen();
          s.found.tank = s.found.lid = true;
        } else tankReady();
        if (p.tank === 'stopped') s.found.tank = true;
        syncScene();
      }
      if (p.look) await setLook(p.look, animate ? 0.9 : 0);
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = { straw: false, torricelli: false, pierced: false, tilt: false, mountain: false, water: false, tank: false, lid: false };
      s.show = { labels: true, vacuum: true, h: true, tilt: true };
      s.ex = 'torricelli';
      await setView('front', { animate: false });
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The barometer as it stands now (dish, mercury, tube, scale and stand), in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'TorricelliBarometer';
      g.add(bar.root.clone(true));
      return g;
    },
  };
}
