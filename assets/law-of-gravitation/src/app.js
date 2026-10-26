// Law of gravitation (book pages 78–79, topic 3.7), student view. Two solid iron spheres (1,000 kg is a ball 62 cm
// across) rest on stands on a bench with a metre scale; above each one a violet arrow shows the gravitational pull on
// it (মহাকর্ষ বল, the colour gravity has in every figure): two equal arrows pointing at each other, drawn to one scale
// (the pull between two 1,000 kg spheres 1 m apart, 6.67 × 10⁻⁵ N, is 1 m long). The student does five things, each
// changing one thing from the picture before, the old arrows left faint so the change shows: doubles the distance (the
// arrows shrink to a quarter), doubles the left mass (they double, on both spheres: the small one pulls the big one
// just as hard), doubles the right mass (four times); then, on the Earth cut open to its centre, puts a 1 kg weight on
// the ground (F = GMm/R² is its weight, about 9.8 N, R from the Earth's centre) and a second one (twice the weight,
// the same g = GM/R² ≈ 9.8 m s⁻²). Then a short test. The panel is the kit's clean sheet (one action, one result, one
// rule): the examples দূরত্ব · ভর · পৃথিবী as one row of words with what was found under each, one big numbered action
// whose same badge rings the part to touch, one result line (the force in নিউটন), one rule in the book's words that
// grows with what the student has found. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createArrow } from '@shared/arrow.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { BENCH, createSpheres } from './spheres.js';
import { createEarth, WEIGHT } from './earth.js';
import { fitPose } from './camera.js';
import {
  BASES,
  EARTH,
  EXAMPLES,
  G,
  STEPS,
  arrowLength,
  distanceChoices,
  force,
  gravity,
  gravityChoices,
  massChoices,
  radiusChoices,
  roundTo,
  sci,
  stateAfter,
  weight,
} from './physics.js';

export const DEFAULTS = {
  example: 'dist', // 'dist' | 'mass' | 'earth': where to start
  steps: 0, // 0 … 5: start with that many of the student's steps already done (for pictures)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const GRAVITY = '#7048e8'; // মহাকর্ষ বল: the same violet as gravitational-force and the weight in chapter 3
const MINUS = '−';
const LANE = { above: 0.14, gap: 0.17 }; // m: the arrows' lanes above the taller sphere, the lower one for m₁'s arrow
const GHOST_DROP = 0.06; // m: the faint arrow of the moment before runs just under its arrow
const W_ARROW = 0.25; // Earth radii of arrow per kg of the weight (drawn: the scale is the Earth scene's own)
const DOUBLE_TAP = 450; // ms: a second action this soon after one is ignored
const ELEVATION = [26, 12]; // degrees: the spheres seen from above as steeply as a tall stage allows (portrait), lower on wide ones
const EARTH_DIR = new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(20)), Math.cos(THREE.MathUtils.degToRad(20)));
const VIEW_3D = new THREE.Vector3(0.55, 0.42, 0.9).normalize();

/** Integers with Bangladeshi commas: 1,000 · 63,70,000. */
function groupBD(n) {
  const s = String(Math.round(Math.abs(n)));
  if (s.length <= 3) return s;
  const head = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${s.slice(-3)}`;
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const plain = (x, d = 2) => String(roundTo(x, d)); // numbers in sentences: no trailing zeros

  // symbols with subscripts and powers (the font has no ₁ ² ⁻): passed into strings as vars
  const SYM = {
    F: '<i>F</i>',
    G: '<i>G</i>',
    M: '<i>M</i>',
    R: '<i>R</i>',
    r: '<i>r</i>',
    g: '<i>g</i>',
    m: '<i>m</i>',
    m1: '<i>m</i><sub>1</sub>',
    m2: '<i>m</i><sub>2</sub>',
    r2: '<i>r</i><sup>2</sup>',
    law: '<i>F</i> = <i>G</i><i>m</i><sub>1</sub><i>m</i><sub>2</sub>/<i>r</i><sup>2</sup>',
    GMm: '<i>GMm</i>/<i>R</i><sup>2</sup>',
    GM: '<i>GM</i>/<i>R</i><sup>2</sup>',
    mg: '<i>mg</i>',
    ms2: `ms<sup>${MINUS}2</sup>`,
    four: '4',
    one: '1',
    two: '2',
  };
  /** a × 10ⁿ as HTML (digits not yet in Bangla: pass it through t() vars or N). */
  const sciHtml = (x, digits = 2, exp = null) => {
    const { m, e } = sci(x, digits, exp);
    return `${m} × 10<sup>${e < 0 ? MINUS : ''}${Math.abs(e)}</sup>`;
  };

  root.classList.add('pvc', 'lg');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', results: true, items: EXAMPLES.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 2, outcome: 1, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const outcomeEl = ui.$('.pvc-outcome');
  // the honest note, top left of the view (the buttons are top right)
  const note = document.createElement('div');
  note.className = 'lg-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 0.05, far: 100, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 20;
  const M = createMaterials(stage.renderer);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // the two spheres, their arrows (and the faint arrows of the moment before), the stalks to them, the r line
  const spheres = createSpheres({ materials: M, N, unit: 'm' });
  const sphereScene = new THREE.Group();
  sphereScene.name = 'LawOfGravitation';
  sphereScene.add(spheres.root);
  const arrowOpts = { color: GRAVITY, radius: 0.019, head: 0.1, headRadius: 0.046 };
  const pull = [createArrow({ ...arrowOpts, name: 'PullOnM1' }), createArrow({ ...arrowOpts, name: 'PullOnM2' })];
  const ghost = [0, 1].map((i) => createArrow({ ...arrowOpts, opacity: 0.22, name: `Before${i + 1}` }));
  for (const a of [...pull, ...ghost]) sphereScene.add(a.root);
  for (const a of ghost) a.root.userData.noExport = true;
  const ink = new THREE.MeshBasicMaterial({ color: 0x5c6672, transparent: true, opacity: 0.55, depthWrite: false });
  const stalks = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 1, 8).translate(0, 0.5, 0), ink);
    m.userData.noExport = true;
    sphereScene.add(m);
    return m;
  });
  const dimInk = new THREE.MeshBasicMaterial({ color: 0x1d2733 });
  const rLine = new THREE.Group();
  rLine.userData.noExport = true;
  const rBar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.007, 0.007), dimInk);
  const rEnds = [0, 1].map(() => new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.05, 0.007), dimInk));
  rLine.add(rBar, ...rEnds);
  rLine.position.set(0, BENCH.top + 0.004, BENCH.depth / 2 - 0.035);
  sphereScene.add(rLine);
  scene.add(sphereScene);

  // the Earth, cut open to its centre, the weight, the two pulls, the R line (and the test's radius and height lines)
  const earth = createEarth({ renderer: stage.renderer, kg: `${N('1')} kg` });
  const earthScene = new THREE.Group();
  earthScene.name = 'EarthScene';
  earthScene.add(earth.root);
  const eOpts = { color: GRAVITY, radius: 0.011, head: 0.055, headRadius: 0.027 };
  const wArrow = createArrow({ ...eOpts, name: 'Weight' });
  const eArrow = createArrow({ ...eOpts, name: 'PullOnEarth' });
  const wGhost = createArrow({ ...eOpts, opacity: 0.22, name: 'WeightBefore' });
  const eGhost = createArrow({ ...eOpts, opacity: 0.22, name: 'PullOnEarthBefore' });
  for (const a of [wArrow, eArrow, wGhost, eGhost]) {
    a.root.traverse((m) => {
      if (m instanceof THREE.Mesh) {
        m.material.depthTest = false; // drawn over the weight and the cut faces (a drawing on the picture)
        m.renderOrder = 10;
      }
    });
    earthScene.add(a.root);
  }
  wGhost.root.userData.noExport = true;
  eGhost.root.userData.noExport = true;
  /** A dimension line: a bar from a to b with a short tick across each end (on the cut face it is drawn on). */
  function dimLine(name) {
    const g = new THREE.Group();
    g.name = name;
    g.userData.noExport = true;
    const mat = new THREE.MeshBasicMaterial({ color: 0x1d2733, depthTest: false });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 8).translate(0, 0.5, 0), mat);
    const ticks = [0, 1].map(() => new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.008), mat));
    g.add(bar, ...ticks);
    for (const m of [bar, ...ticks]) m.renderOrder = 9;
    g.visible = false;
    earthScene.add(g);
    const up = new THREE.Vector3(0, 1, 0);
    const d = new THREE.Vector3();
    return {
      group: g,
      /** From a to b (world), ticks across along `across`, k: how much of it is drawn (it grows from a). */
      set(a, b, across, k = 1) {
        d.subVectors(b, a);
        const len = d.length() * k;
        g.visible = len > 1e-4;
        bar.position.copy(a);
        bar.quaternion.setFromUnitVectors(up, d.normalize());
        bar.scale.set(1, Math.max(1e-4, len), 1);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), across);
        ticks[0].position.copy(a);
        ticks[1].position.copy(a).addScaledVector(d, len);
        for (const tk of ticks) tk.quaternion.copy(q);
        ticks[1].visible = k > 0.999;
      },
      hide: () => (g.visible = false),
    };
  }
  const RLine = dimLine('RLine');
  const radiusLine = dimLine('RadiusLine');
  const liftLine = dimLine('HeightLine');
  // the R line runs on the left cut face, beside the edge from the weight to the centre; the radius on the right face
  const LEFT_U = new THREE.Vector3(-1, 0, 1).normalize();
  const LEFT_N = new THREE.Vector3(1, 0, 1).normalize();
  const RIGHT_U = new THREE.Vector3(1, 0, 1).normalize();
  const RIGHT_N = new THREE.Vector3(-1, 0, 1).normalize();
  const R_OFF = new THREE.Vector3().addScaledVector(LEFT_U, 0.11).addScaledVector(LEFT_N, 0.008);
  scene.add(earthScene);
  earthScene.visible = false;

  // soft shadows on a white page under the bench
  let sun = null;
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.position.set(0.6, 4, 2.4);
    sun.target.position.set(1, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -2.6, right: 2.6, top: 2.2, bottom: -2.2, near: 0.5, far: 9 });
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);
    const page = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.12 }));
    page.rotation.x = -Math.PI / 2;
    page.userData.noExport = true;
    page.receiveShadow = true;
    sphereScene.add(page);
    spheres.root.traverse((m) => {
      if (m instanceof THREE.Mesh) {
        m.castShadow = true;
        m.receiveShadow = m.name === 'BenchTop';
      }
    });
  }
  // a little light from the front, so the cut faces and the iron read well
  const front = new THREE.DirectionalLight(0xffffff, 0.35);
  front.position.set(-1, 2, 5);
  scene.add(front);

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    example: EXAMPLES.includes(o.example) ? o.example : 'dist',
    m1: 1000,
    m2: 1000,
    r: 1,
    placed: 0, // 0 … 1: the weight on its way down (1: on the ground)
    kg: 1, // weights on the Earth
    lift: 0, // the test: held above the ground
    rGrow: 0, // 0 … 1: the R line drawn so far
    ghostF: null, // the pull before the last change (its faint arrows), or null
    ghostKg: null, // the weight before the last change, or null
    last: null, // the change just made: 'r2' | 'm1' | 'm2' | 'place' | 'add' | null
    busy: false, // a change is being animated
    acting: null, // the change being animated
    dropping: false, // the second weight is on its way down
    found: { r2: false, m1: false, m2: false, place: false, add: false },
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    quizScene: null, // what a test question shows: { arrows: bool, value: bool, R: bool, radius: bool, lift: bool, M: bool }
    userMovedCamera: false,
  };
  const sceneOf = (ex) => (ex === 'earth' ? 'earth' : 'spheres');
  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let token = 0; // bumped by anything that calls off what is pending
  let lastAct = Number.NEGATIVE_INFINITY;

  const F = () => force(s.m1, s.m2, s.r);
  /** The weights the arrows stand for: the second one counts once it has landed. */
  const shownKg = () => s.kg;
  /** The scene on the view now: a test question's, else the example's. */
  const sceneNow = () => (s.quizScene ? s.quizScene.scene : sceneOf(s.example));

  // ── the spheres' scene each frame: sizes, places, arrows on their lanes, faint arrows, stalks, r line ──────────
  const tA = new THREE.Vector3();
  const XP = new THREE.Vector3(1, 0, 0);
  const XN = new THREE.Vector3(-1, 0, 0);
  const UP = new THREE.Vector3(0, 1, 0);
  const DOWN = new THREE.Vector3(0, -1, 0);
  /** The lanes' heights: above the taller sphere (m₁'s arrow lower, m₂'s higher). */
  function lanes() {
    const top = Math.max(spheres.top(0).y, spheres.top(1).y);
    return [top + LANE.above, top + LANE.above + LANE.gap];
  }
  function placeSpheres() {
    spheres.setMasses(s.m1, s.m2);
    spheres.setR(s.r);
    const [y0, y1] = lanes();
    const ys = [y0, y1];
    const arrowsOn = !s.quizScene || s.quizScene.arrows;
    const L = arrowLength(F());
    for (const i of [0, 1]) {
      const x = i === 0 ? 0 : s.r;
      const dir = i === 0 ? XP : XN;
      if (arrowsOn) pull[i].set(tA.set(x, ys[i], 0), dir, L);
      else pull[i].hide();
      if (arrowsOn && s.ghostF != null && !s.busy) ghost[i].set(tA.set(x, ys[i] - GHOST_DROP, 0), dir, arrowLength(s.ghostF));
      else ghost[i].hide();
      const top = spheres.top(i).y + 0.015;
      stalks[i].visible = arrowsOn;
      stalks[i].position.set(x, top, 0);
      stalks[i].scale.set(1, Math.max(0.001, ys[i] - top), 1);
    }
    rBar.scale.x = s.r;
    rBar.position.x = s.r / 2;
    rEnds[1].position.x = s.r;
  }

  // ── the Earth's scene each frame ───────────────────────────────────────────
  const tB = new THREE.Vector3();
  const tC = new THREE.Vector3();
  function placeEarth() {
    earth.setPlaced(s.placed);
    earth.setLift(s.lift);
    earth.setCount(s.kg === 2 || s.dropping ? 2 : 1);
    const q = s.quizScene;
    const arrowsOn = s.placed > 0.001 && (!q || q.arrows);
    const c = earth.bodyCentre(tB).clone();
    const off = new THREE.Vector3(0, 0, 0.035);
    const L = W_ARROW * shownKg();
    if (arrowsOn) {
      wArrow.set(c.clone().add(off), DOWN, L);
      eArrow.set(off, UP, L);
    } else {
      wArrow.hide();
      eArrow.hide();
    }
    if (arrowsOn && s.ghostKg != null && !s.busy) {
      const side = new THREE.Vector3(0.05, 0, 0);
      wGhost.set(c.clone().add(off).add(side), DOWN, W_ARROW * s.ghostKg);
      eGhost.set(off.clone().add(side), UP, W_ARROW * s.ghostKg);
    } else {
      wGhost.hide();
      eGhost.hide();
    }
    if (s.rGrow > 0.001) RLine.set(tC.copy(R_OFF), c.clone().add(R_OFF), LEFT_U, s.rGrow);
    else RLine.hide();
    if (q?.radius) radiusLine.set(tC.set(0, 0, 0).addScaledVector(RIGHT_N, 0.008), tB.copy(RIGHT_U).addScaledVector(RIGHT_N, 0.008), UP);
    else radiusLine.hide();
    if (q?.lift) {
      const x = -(WEIGHT.r0 + 0.05); // left of the weight (the weight's label is on the right)
      liftLine.set(tC.set(x, 1, 0.01), tB.set(x, earth.bodyBottom().y, 0.01), XP);
    } else liftLine.hide();
  }

  // ── labels on the 3D view ───────────────────────────────────────────────────
  let anno = null;
  anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      note,
      () => (ui.hint.classList.contains('show') ? hintBox() : null),
      () => action?.ringBox(),
      () => action?.box(),
      () => arrowBoxes(),
    ],
  });
  /** The arrows shown now, as boxes on the view (canvas pixels): no label and no badge sits on them. */
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const arrowBox = new THREE.Box3();
  function arrowBoxes() {
    const out = [];
    for (const a of [...pull, ...ghost, wArrow, eArrow, wGhost, eGhost]) {
      if (!a.root.visible || !a.root.parent?.visible) continue;
      arrowBox.setFromObject(a.root);
      if (arrowBox.isEmpty()) continue;
      let i = 0;
      for (const x of [arrowBox.min.x, arrowBox.max.x])
        for (const y of [arrowBox.min.y, arrowBox.max.y]) for (const z of [arrowBox.min.z, arrowBox.max.z]) corners[i++].set(x, y, z).project(camera);
      const b = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      for (const c of corners) {
        const x = (c.x * 0.5 + 0.5) * stage.width;
        const y = (-c.y * 0.5 + 0.5) * stage.height;
        b.left = Math.min(b.left, x);
        b.right = Math.max(b.right, x);
        b.top = Math.min(b.top, y);
        b.bottom = Math.max(b.bottom, y);
      }
      out.push(b);
    }
    return out;
  }
  function hintBox() {
    const r = ui.hint.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top };
  }
  const pts = {
    ball: [new THREE.Vector3(), new THREE.Vector3()],
    arrow: [new THREE.Vector3(), new THREE.Vector3()],
    r: new THREE.Vector3(),
    centre: new THREE.Vector3(0, 0, 0),
    w: new THREE.Vector3(),
    e: new THREE.Vector3(),
    R: new THREE.Vector3(),
    radius: new THREE.Vector3(),
    lift: new THREE.Vector3(),
    M: new THREE.Vector3(-0.62, 0.62, -0.3),
  };
  const ballPoint = (i) => () => pts.ball[i].copy(spheres.centre(i));
  // the masses written on the balls follow the balls' size on the screen (--lg-ball: the smaller ball's width in px)
  const bp = [new THREE.Vector3(), new THREE.Vector3()];
  let ballPx = 0;
  stage.addTicker(() => {
    if (!sphereScene.visible) return;
    let px = Infinity;
    for (const i of [0, 1]) {
      bp[0].copy(spheres.centre(i)).project(camera);
      bp[1].copy(spheres.centre(i)).addScaledVector(tA.setFromMatrixColumn(camera.matrixWorld, 0), spheres.radius(i)).project(camera);
      px = Math.min(px, Math.abs(bp[1].x - bp[0].x) * stage.width);
    }
    px = Math.round(px * 2);
    if (px !== ballPx && Number.isFinite(px)) {
      ballPx = px;
      ui.annoLayer.style.setProperty('--lg-ball', String(px));
    }
  });
  // each arrow's F just behind its tail (above its own sphere), so the two never meet: "F ——→" and "←—— F"
  const tailPoint = (i) => () => {
    const [y0, y1] = lanes();
    return pts.arrow[i].set(i === 0 ? 0 : s.r, i === 0 ? y0 : y1, 0);
  };
  const TAIL_SPOTS = [
    [
      { dx: -12, dy: 0 },
      { dx: -10, dy: -16 },
      { dx: 0, dy: -20 },
    ],
    [
      { dx: 12, dy: 0 },
      { dx: 10, dy: -16 },
      { dx: 0, dy: -20 },
    ],
  ];
  // the test's value of F: in the middle, above the arrows
  const valuePoint = new THREE.Vector3();
  const valueAt = () => valuePoint.set(s.r / 2, lanes()[1], 0);
  // a label is (re)made only when its words change: the kit fades a new label in
  const labelText = new Map();
  function label(id, opts) {
    if (labelText.get(id) === opts.text && anno.has(id)) return;
    if (anno.has(id) && labelText.has(id)) anno.update(id, { text: opts.text });
    else anno.add(id, opts);
    labelText.set(id, opts.text);
  }
  function unlabel(...ids) {
    for (const id of ids) {
      anno.remove(id);
      labelText.delete(id);
    }
  }
  const SPHERE_LABELS = ['m0', 'm1', 'F0', 'F1', 'Fv', 'r'];
  const EARTH_LABELS = ['centre', 'w', 'e', 'R', 'radius', 'lift', 'M'];
  function labelsFor() {
    const q = s.quizScene;
    if (sceneNow() === 'spheres') {
      unlabel(...EARTH_LABELS);
      for (const i of [0, 1])
        label(`m${i}`, {
          text: t('l_mass', { m: i ? SYM.m2 : SYM.m1, kg: groupBD(i ? s.m2 : s.m1) }),
          point: ballPoint(i),
          dx: 0,
          dy: 0,
          kind: 'ball',
        });
      const arrowsOn = !q || q.arrows;
      const value = q?.value;
      for (const i of [0, 1]) {
        if (!arrowsOn) unlabel(`F${i}`);
        else label(`F${i}`, { text: t('l_force', { F: SYM.F }), point: tailPoint(i), kind: 'flat', color: GRAVITY, spots: TAIL_SPOTS[i] });
      }
      if (arrowsOn && value)
        label('Fv', {
          text: t('l_force_value', { F: SYM.F, f: sciHtml(F()) }),
          point: valueAt,
          kind: 'flat',
          color: GRAVITY,
          spots: [
            { dx: 0, dy: -28 },
            { dx: 0, dy: -42 },
          ],
        });
      else unlabel('Fv');
      label('r', {
        text: t('l_r', { r: SYM.r, v: plain(s.r) }),
        point: () => pts.r.set(s.r / 2, BENCH.top + 0.01, BENCH.depth / 2 - 0.035),
        kind: 'flat',
        spots: [
          { dx: 0, dy: -13 },
          { dx: 0, dy: -26 },
        ],
      });
      return;
    }
    unlabel(...SPHERE_LABELS);
    label('centre', {
      text: t('l_centre'),
      point: () => pts.centre,
      kind: 'part',
      spots: [
        { dx: -60, dy: 26 },
        { dx: 60, dy: 30 },
        { dx: -70, dy: -10 },
      ],
    });
    const arrowsOn = s.placed > 0.001 && (!q || q.arrows);
    if (arrowsOn) {
      const L = W_ARROW * shownKg();
      label('w', {
        text: t('l_weight', { F: SYM.F }),
        point: () => pts.w.copy(earth.bodyCentre()).add(new THREE.Vector3(0, -L * 0.62, 0.035)),
        kind: 'flat',
        color: GRAVITY,
        spots: [
          { dx: 36, dy: 0 },
          { dx: 40, dy: 10 },
          { dx: -36, dy: 0 },
        ],
      });
      label('e', {
        text: t('l_on_earth', { F: SYM.F }),
        point: () => pts.e.set(0, L * 0.6, 0.035),
        kind: 'flat',
        color: GRAVITY,
        spots: [
          { dx: 22, dy: 0 },
          { dx: -22, dy: 0 },
        ],
      });
    } else unlabel('w', 'e');
    if (s.rGrow > 0.999 && (!q || q.R))
      label('R', {
        text: t('l_R', { R: SYM.R, v: sciHtml(EARTH.R) }),
        point: () => pts.R.copy(R_OFF).setY(earth.bodyCentre().y * 0.42),
        kind: 'part',
        spots: [
          { dx: -70, dy: 0 },
          { dx: -60, dy: -30 },
          { dx: -60, dy: 30 },
        ],
      });
    else unlabel('R');
    if (q?.radius)
      label('radius', {
        text: t('l_radius', { v: groupBD(EARTH.R / 1000) }),
        point: () => pts.radius.copy(RIGHT_U).multiplyScalar(0.62),
        kind: 'part',
        spots: [
          { dx: 50, dy: 34 },
          { dx: 30, dy: 50 },
          { dx: 60, dy: -30 },
        ],
      });
    else unlabel('radius');
    if (q?.lift)
      label('lift', {
        text: t('l_lift', { h: '1' }),
        point: () => pts.lift.set(-(WEIGHT.r0 + 0.05), 1 + 0.04, 0.01),
        kind: 'flat',
        spots: [
          { dx: -14, dy: 0 },
          { dx: -16, dy: -16 },
        ],
      });
    else unlabel('lift');
    if (q?.M)
      label('M', {
        text: t('l_M', { M: SYM.M, v: sciHtml(EARTH.M) }),
        point: () => pts.M,
        kind: 'part',
        spots: [
          { dx: -20, dy: -40 },
          { dx: -10, dy: -60 },
          { dx: 20, dy: -50 },
        ],
      });
    else unlabel('M');
  }

  // ── the panel: one action, one result, one rule ─────────────────────────────
  const ORDER = EXAMPLES;
  const ACT_KEY = { r2: 'act_double_r', m1: 'act_double_m1', m2: 'act_double_m2', place: 'act_place', add: 'act_add', again: 'act_again' };
  const FIRST = { dist: 'r2', mass: 'm1', earth: 'place' };
  /** The change the example offers next from the state now (null: nothing more here). */
  function nextHere(ex = s.example) {
    if (ex === 'dist') return s.m1 === 1000 && s.m2 === 1000 && s.r < 1.5 ? 'r2' : null;
    if (ex === 'mass') {
      if (s.r < 1.5) return null;
      if (s.m1 < 2000) return 'm1';
      if (s.m2 < 2000) return 'm2';
      return null;
    }
    if (s.placed < 0.5) return 'place';
    return s.kg < 2 ? 'add' : null;
  }
  const doneOf = (ex) => (ex === 'dist' ? s.found.r2 : ex === 'mass' ? s.found.m1 && s.found.m2 : s.found.place && s.found.add);
  /** The student's own step: what they have found so far + 1. */
  const stepNo = () => Object.values(s.found).filter(Boolean).length + 1;
  /**
   * What the big button (and a tap on the ringed part) does now: the next change in this example; else the first
   * change of the next example not finished yet (going to it first); else start again ("আবার", no number).
   */
  function plan() {
    const here = nextHere();
    if (here) return { example: s.example, act: here, step: stepNo() };
    const at = ORDER.indexOf(s.example);
    for (let k = 1; k <= ORDER.length; k++) {
      const ex = ORDER[(at + k) % ORDER.length];
      if (!doneOf(ex)) return { example: ex, act: FIRST[ex], step: stepNo() };
    }
    return { example: 'dist', act: 'again', step: '' };
  }

  function factorText(before, after) {
    const k = after / before;
    if (k >= 1) return t('k_times', { a: plain(k, 1) });
    return t('k_part', { a: plain(1 / k, 1), b: '1' });
  }
  function outcomeHtml() {
    if (sceneOf(s.example) === 'spheres') {
      const vars = { F: SYM.F, f: sciHtml(F()) };
      if (s.ghostF != null && !s.busy) return t('out_force_vs', { ...vars, k: factorText(s.ghostF, F()) });
      return t('out_force', vars);
    }
    if (s.placed < 0.999 || s.acting === 'place') return t('out_earth', { M: SYM.M, R: SYM.R, mv: sciHtml(EARTH.M), rv: sciHtml(EARTH.R) });
    if (s.kg === 1 || s.acting === 'add') return t('out_weight', { kg: '1', w: plain(weight(1), 1) });
    return t('out_weight2', { kg: '2', w: plain(weight(2), 1), g: SYM.g, gv: plain(gravity(), 1), ms2: SYM.ms2 });
  }
  function ruleHtml() {
    const v = { ...SYM };
    if (sceneOf(s.example) === 'spheres') {
      if (s.last === 'r2') return t('rule_dist', v);
      if (s.last === 'm1') return t('rule_m1', v);
      if (s.last === 'm2') return t('rule_m2', v);
      if (s.found.r2 && s.found.m1) return t('rule_sum_both', v);
      if (s.found.r2) return t('rule_sum_dist', v);
      if (s.found.m1) return t('rule_sum_mass', v);
      return t('rule_start', v);
    }
    if (s.placed < 0.999 || s.acting === 'place' || !s.found.place) return t('rule_earth0', v);
    if (s.kg === 1 || s.acting === 'add') return t('rule_earth1', v);
    return t('rule_earth2', { ...v, gv: plain(gravity(), 1) });
  }

  let lastKind = '';
  function refresh() {
    if (sceneNow() === 'spheres') placeSpheres();
    else placeEarth();
    if (s.mode === 'explore') {
      sheet.choose(s.example);
      sheet.result('dist', s.found.r2 ? t('res_part', { a: '4', b: '1' }) : '');
      sheet.result('mass', s.found.m1 ? t('res_times', { k: '2' }) : '');
      sheet.result('earth', s.found.place ? t('res_g', { g: plain(gravity(), 1) }) : '');
      sheet.outcome(outcomeHtml());
      const kind = sceneOf(s.example);
      if (kind !== lastKind) outcomeEl.dataset.k = lastKind = kind;
      sheet.rule(ruleHtml());
      if (action) {
        const p = plan();
        action.set({ step: p.step, label: ACT_KEY[p.act], worldRadius: actionRing()?.radius ?? 0.3 });
        sheet.next(p.example !== s.example ? p.example : null);
        if (s.busy) action.hide('run');
        else action.show('run');
      }
    }
    const text = t(sceneNow() === 'earth' ? 'note_earth' : 'note_spheres');
    if (note.dataset.text !== text) {
      note.textContent = text;
      note.dataset.text = text;
    }
    labelsFor();
    stage.invalidate();
  }

  function snapshot() {
    const p = plan();
    const f = F();
    return {
      example: s.example,
      scene: s.quizScene ? s.quizScene.scene : sceneOf(s.example),
      m1: s.m1, // kg
      m2: s.m2, // kg
      r: roundTo(s.r, 3), // m, centre to centre
      force: f, // N
      before: s.ghostF, // N: the pull before the last change (its faint arrows), or null
      earth: {
        placed: s.placed > 0.999,
        kg: s.kg,
        weight: roundTo(weight(s.kg), 2), // N
        g: roundTo(gravity(), 2), // m s⁻²
      },
      found: { ...s.found },
      last: s.last,
      busy: s.busy,
      next: { example: p.example, act: p.act, step: p.step },
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.example, snap.m1, snap.m2, snap.r, snap.earth, snap.found, snap.mode, snap.busy]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── changes, animated ───────────────────────────────────────────────────────
  /** Tweens a state key to a value (resolves true when it got there). */
  function tweenTo(key, to, duration, e = ease.inOutCubic) {
    const from = s[key];
    if (!duration || from === to) {
      s[key] = to;
      refresh();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key,
        duration,
        ease: e,
        onUpdate: (k) => {
          s[key] = from + (to - from) * k;
          refresh();
        },
      })
      .finished.then((done) => {
        if (done) {
          s[key] = to;
          refresh();
        }
        return done;
      });
  }
  function cancelTweens() {
    for (const k of ['m1', 'm2', 'r', 'placed', 'kg', 'lift', 'rGrow', 'fade']) tweener.cancel(k);
    s.busy = false;
    s.acting = null;
    s.dropping = false;
    earth.weights.children[1].position.y = WEIGHT.h;
    ui.canvasHost.style.opacity = '1';
  }

  /** The scene (spheres or Earth) on the view: a short fade through white, the camera framed for it. */
  async function showScene(kind, { animate = true } = {}) {
    const isEarth = kind === 'earth';
    if (earthScene.visible === isEarth && sphereScene.visible === !isEarth) return true;
    const swap = () => {
      earthScene.visible = isEarth;
      sphereScene.visible = !isEarth;
      if (sun) {
        sun.position.set(isEarth ? -1.2 : 0.6, 4, isEarth ? 3 : 2.4);
        sun.target.position.set(isEarth ? 0 : 1, 0, 0);
      }
      refresh();
      flyTo(viewPose(), 0);
    };
    if (!animate) {
      swap();
      return true;
    }
    const host = ui.canvasHost;
    const fade = (a, b) =>
      tweener.animate({ key: 'fade', duration: 0.22, ease: ease.inOutCubic, onUpdate: (k) => (host.style.opacity = String(a + (b - a) * k)) })
        .finished;
    if (!(await fade(1, 0))) return false; // called off: whoever called it off shows its own scene
    swap();
    const ok = await fade(0, 1);
    host.style.opacity = '1';
    return ok;
  }

  /** Back to an example's start (no faint arrows, nothing just changed). Resolves true unless called off. */
  async function chooseExample(ex, { animate = true, quiet = false } = {}) {
    if (!EXAMPLES.includes(ex)) return false;
    if (s.locked && !quiet) return lockedNudge();
    const my = ++token;
    cancelTweens();
    const changed = ex !== s.example;
    s.example = ex;
    s.ghostF = null;
    s.ghostKg = null;
    s.last = null;
    s.quizScene = null;
    if (changed) emit('example', { example: ex });
    if (ex === 'earth') {
      s.placed = 0;
      s.kg = 1;
      s.rGrow = 0;
      s.lift = 0;
      refresh();
      await showScene('earth', { animate });
    } else {
      const base = BASES[ex];
      const wasEarth = earthScene.visible;
      if (wasEarth) {
        Object.assign(s, base);
        await showScene('spheres', { animate });
      } else if (animate) {
        s.busy = true;
        refresh();
        await Promise.all([tweenTo('m1', base.m1, 0.5), tweenTo('m2', base.m2, 0.5), tweenTo('r', base.r, 0.6)]);
        if (my === token) s.busy = false;
      } else Object.assign(s, base);
    }
    if (my !== token) return false;
    refresh();
    emitChange();
    return true;
  }

  /** One change (the student's step): the faint arrows keep the moment before; the rule and the result follow it. */
  async function perform(act, { animate = true } = {}) {
    const my = ++token;
    const dur = (x) => (animate ? x : 0);
    s.ghostF = sceneOf(s.example) === 'spheres' ? F() : null;
    s.ghostKg = act === 'add' ? s.kg : null;
    s.busy = animate;
    s.acting = act;
    refresh();
    emitChange();
    let done = true;
    if (act === 'r2') done = await tweenTo('r', 2, dur(1.1));
    else if (act === 'm1') done = await tweenTo('m1', 2000, dur(0.8));
    else if (act === 'm2') done = await tweenTo('m2', 2000, dur(0.8));
    else if (act === 'place') {
      s.kg = 1;
      done = await tweenTo('placed', 1, dur(0.75), ease.inCubic);
      if (done && my === token && animate) audio.contact();
      if (done && my === token) done = await tweenTo('rGrow', 1, dur(0.6));
    } else if (act === 'add' && animate) {
      // the second weight comes down onto the first; the pulls count it once it has landed
      s.dropping = true;
      const w2 = earth.weights.children[1];
      done = await tweener.animate({
        key: 'kg',
        duration: 0.6,
        ease: ease.inCubic,
        onUpdate: (k) => {
          w2.position.y = WEIGHT.h + 0.9 * (1 - k);
          refresh();
        },
      }).finished;
      w2.position.y = WEIGHT.h;
      s.dropping = false;
      if (done && my === token) audio.contact();
    }
    if (my !== token) return false;
    if (done && act === 'add') s.kg = 2;
    s.busy = false;
    s.acting = null;
    if (done) {
      s.found[act] = true;
      s.last = act;
      emit('act', { act, example: s.example });
    }
    refresh();
    emitChange();
    return done;
  }

  /** The action: the big button, its badge on the view, a tap on the ringed part, Space/Enter/→. */
  async function doAction({ animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (s.busy) return;
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not do two steps
    lastAct = now();
    hintOff();
    const p = plan();
    if (p.act === 'again') {
      await chooseExample('dist', { animate });
      return;
    }
    if (p.example !== s.example) {
      const my = token + 1;
      const base = BASES[p.example];
      const same = base && s.m1 === base.m1 && s.m2 === base.m2 && Math.abs(s.r - base.r) < 1e-6;
      if (!(await chooseExample(p.example, { animate }))) return;
      if (animate && !same) await wait(450); // the start is seen before the change
      if (token !== my) return;
    }
    await perform(p.act, { animate });
  }

  // the big button in the panel and the numbered ring on the part it changes (taps on the ring go through to it)
  /**
   * Where the action's ring goes: round the sphere the next change works on, the spot on the ground where the weight
   * will stand, or the weight (a circle: { at, radius } in scene units); null when the next change needs a new scene.
   */
  const ringAt = new THREE.Vector3();
  function actionRing() {
    if (s.mode === 'quiz' || s.busy) return null;
    const p = plan();
    if (p.example !== s.example && !(p.example === 'mass' && s.example === 'dist')) return null;
    if (p.act === 'r2' || p.act === 'm2' || p.act === 'm1') {
      const i = p.act === 'm1' ? 0 : 1;
      return { at: ringAt.copy(spheres.centre(i)), radius: spheres.radius(i) + 0.05 };
    }
    if (p.act === 'place') return { at: ringAt.set(0, 1 + WEIGHT.h / 2, 0), radius: WEIGHT.h * 0.95 };
    if (p.act === 'add') return { at: ringAt.copy(earth.bodyCentre()), radius: WEIGHT.h * 0.95 };
    return null;
  }
  const actionTarget = () => actionRing()?.at ?? null;
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_double_r',
    target: actionTarget,
    worldRadius: 0.36,
    // the masses written on the balls sit inside the ring: the badge keeps clear of the other labels and the arrows
    avoid: [
      ui.corner,
      note,
      ui.hint,
      () => [...labelText.keys()].filter((id) => id !== 'm0' && id !== 'm1').map((id) => anno.box(id)),
      () => arrowBoxes(),
    ],
    pulse: Boolean(o.coach),
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  function sphereBox() {
    // framed for the largest learn picture (both spheres 2,000 kg, 2 m apart), so the view never moves as they change;
    // a test question with a bigger sphere frames for it
    const R = Math.max(spheres.radius(0), spheres.radius(1), 0.3925);
    const top = Math.max(lanes()[1], 0.62 + R + LANE.above + LANE.gap);
    box.min.set(-R - 0.06, 0.02, -0.15);
    box.max.set(2 + R + 0.06, top + (s.quizScene?.value ? 0.42 : 0.1), BENCH.depth / 2); // the test's F value needs a line
    return box;
  }
  function earthBox() {
    box.min.set(-0.66, -0.18, -0.3);
    box.max.set(0.66, 1.37, 0.7);
    return box;
  }
  const MARGIN = { top: 58, bottom: 10, side: 8 };
  /** 0 for a portrait stage … 1 for a wide one. */
  const wideness = () => THREE.MathUtils.clamp((stage.width / Math.max(1, stage.height) - 0.9) / 0.9, 0, 1);
  /** The spheres' view: from the front, looking down more on a tall stage (the bench's top fills the room). */
  function sphereDir() {
    const e = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(ELEVATION[0], ELEVATION[1], wideness()));
    return new THREE.Vector3(0, Math.sin(e), Math.cos(e));
  }
  function viewPose(view = s.view) {
    const earthNow = s.quizScene ? s.quizScene.scene === 'earth' : sceneOf(s.example) === 'earth';
    const b = earthNow ? earthBox() : sphereBox();
    const dir = view === '3d' ? VIEW_3D : earthNow ? EARTH_DIR : sphereDir();
    return fitPose({ box: b, dir, camera, width: stage.width, height: stage.height, margin: { ...MARGIN, top: MARGIN.top + noteRoom() } });
  }
  /** On a narrow stage the note goes on its own line under the corner buttons (beside them it would be squeezed). */
  const NOTE_BELOW = 380; // px of stage width: below this the note has under 150 px beside the buttons
  function noteRoom() {
    const below = stage.width < NOTE_BELOW;
    note.classList.toggle('below', below);
    return below ? 24 : 0;
  }
  function flyTo({ position, target }, duration = 0.8) {
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d' && !s.locked;
    controls.enableZoom = s.view === '3d' && !s.locked;
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── touching the scene: the ringed sphere or the weight does the action ────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitBall = new THREE.Sphere();
  function pick(e) {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const ring = actionRing();
    if (!ring) return false;
    // a little bigger than the ball or the weight, for a finger
    hitBall.set(ring.at, ring.radius + 0.06);
    return raycaster.ray.intersectsSphere(hitBall);
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (s.mode === 'quiz') return;
      if (!pick(e)) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = s.mode !== 'quiz' && pick(e) ? 'pointer' : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 2600 } = {}) {
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
    showHint(t('q_locked'));
    audio.error();
    return false;
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
  const qText = ui.$('.pvc-q-text');
  let learnSaved = null;
  let kinds = [];
  let question = null;
  let picked = -1;

  /** A question's picture: the spheres with these masses and distance, or the Earth; nothing left from before. */
  async function setQuizScene(sc) {
    ++token;
    cancelTweens();
    s.ghostF = null;
    s.ghostKg = null;
    s.last = null;
    s.quizScene = sc;
    if (sc.scene === 'spheres') {
      s.m1 = sc.m1;
      s.m2 = sc.m2;
      s.r = sc.r;
    } else {
      s.placed = 1;
      s.kg = 1;
      s.lift = sc.lift ? 1 : 0;
      s.rGrow = sc.R ? 1 : 0;
    }
    if (s.view !== 'front') {
      s.view = 'front';
      controls.enableRotate = false;
      controls.enableZoom = false;
      syncUI();
    }
    unlabel(...SPHERE_LABELS, ...EARTH_LABELS);
    const isEarth = sc.scene === 'earth';
    earthScene.visible = isEarth;
    sphereScene.visible = !isEarth;
    refresh();
    s.userMovedCamera = false;
    await flyTo(viewPose(), 0);
    refresh();
  }
  /** The value of a force at the question's power of ten (choices compare at a glance). */
  const forceLabel = (v, exp) => `<span class="lg-opt">${N(sciHtml(v, 2, exp))}</span>`;
  const optText = (html) => `<span class="lg-opt lg-opt-words">${html}</span>`;

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        learnSaved = {
          example: s.example,
          m1: s.m1,
          m2: s.m2,
          r: s.r,
          placed: s.placed,
          kg: s.kg,
          rGrow: s.rGrow,
          found: { ...s.found },
          last: s.last,
          ghostF: s.ghostF,
          ghostKg: s.ghostKg,
        };
        ++token;
        cancelTweens();
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        kinds = [...shuffle(['mass', 'dist', 'equal']), 'radius', 'g'];
        syncUI();
      },
      leave() {
        ++token;
        cancelTweens();
        s.mode = 'explore';
        s.locked = false;
        s.quizScene = null;
        unlabel(...SPHERE_LABELS, ...EARTH_LABELS);
        const saved = learnSaved || {
          example: 'dist',
          ...BASES.dist,
          placed: 0,
          kg: 1,
          rGrow: 0,
          found: { ...s.found },
          last: null,
          ghostF: null,
          ghostKg: null,
        };
        Object.assign(s, saved, { found: { ...saved.found } });
        earth.weights.children[1].position.y = WEIGHT.h;
        const isEarth = sceneOf(s.example) === 'earth';
        earthScene.visible = isEarth;
        sphereScene.visible = !isEarth;
        syncUI();
        setView(s.view, { animate: false });
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        const kind = kinds[i % kinds.length];
        picked = -1;
        const ask = (html) => {
          if (alive()) qText.innerHTML = html;
        };
        if (kind === 'mass') {
          const start = pickOne([
            { m1: 1000, m2: 1000, side: pickOne(['left', 'right']) },
            { m1: 2000, m2: 1000, side: 'right' },
            { m1: 1000, m2: 2000, side: 'left' },
          ]);
          await setQuizScene({ scene: 'spheres', m1: start.m1, m2: start.m2, r: 2, arrows: true, value: true });
          if (!alive()) return null;
          const f = F();
          const exp = sci(f).e;
          const list = massChoices(f, 2);
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, side: start.side, f, exp, list, order };
          ask(t('q_mass', { side: t(`side_${start.side}`), F: SYM.F }));
          return {
            choices: order,
            expected: 0, // the choices are the items' numbers in a shuffled order; item 0 is right
            tolerance: 0.5,
            label: (j) => forceLabel(list[j], exp),
            meta: { kind, side: start.side, force: f, answer: list[0] },
          };
        }
        if (kind === 'dist') {
          const far = pickOne([false, true]); // false: 1 m, doubled; true: 2 m, halved
          await setQuizScene({ scene: 'spheres', m1: 1000, m2: 1000, r: far ? 2 : 1, arrows: true, value: true });
          if (!alive()) return null;
          const f = F();
          const exp = sci(f).e;
          const list = distanceChoices(f, far ? 0.5 : 2);
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, far, f, exp, list, order };
          ask(t(far ? 'q_dist_half' : 'q_dist2', { F: SYM.F }));
          return {
            choices: order,
            expected: 0, // the choices are the items' numbers in a shuffled order; item 0 is right
            tolerance: 0.5,
            label: (j) => forceLabel(list[j], exp),
            meta: { kind, halved: far, force: f, answer: list[0] },
          };
        }
        if (kind === 'equal') {
          const bigLeft = pickOne([true, false]);
          await setQuizScene({ scene: 'spheres', m1: bigLeft ? 4000 : 1000, m2: bigLeft ? 1000 : 4000, r: 2, arrows: false, value: false });
          if (!alive()) return null;
          const keys = ['eq_same', 'eq_less', 'eq_more', 'eq_none'];
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, keys, order };
          ask(t('q_equal'));
          return {
            choices: order,
            expected: 0, // the choices are the items' numbers in a shuffled order; item 0 is right
            tolerance: 0.5,
            label: (j) => optText(t(keys[j], { k: '4' })),
            meta: { kind, answer: 'same' },
          };
        }
        if (kind === 'radius') {
          await setQuizScene({ scene: 'earth', arrows: true, R: false, radius: true, lift: true, M: false });
          if (!alive()) return null;
          const list = radiusChoices();
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, list, order };
          ask(t('q_radius', { h: '1', F: SYM.F, GMm: SYM.GMm, R: SYM.R }));
          const lab = [t('about', { v: sciHtml(list[0]) }), `${N('1')} m`, `${N(sciHtml(list[2]))}`, `${N(groupBD(list[3]))}`];
          return {
            choices: order,
            expected: 0, // the choices are the items' numbers in a shuffled order; item 0 is right
            tolerance: 0.5,
            label: (j) => optText(`${lab[j]}${j >= 2 ? ' m' : ''}`),
            meta: { kind, answer: list[0] },
          };
        }
        // g from the book's numbers
        await setQuizScene({ scene: 'earth', arrows: true, R: true, radius: false, lift: false, M: true });
        if (!alive()) return null;
        const list = gravityChoices();
        const order = shuffle([0, 1, 2, 3]);
        question = { kind: 'g', list, order };
        ask(t('q_g', { G: SYM.G, Gv: `${sciHtml(G)} Nm<sup>2</sup>kg<sup>${MINUS}2</sup>`, M: SYM.M, R: SYM.R, g: SYM.g, GM: SYM.GM }));
        const show = (v) => (v >= 1000 ? sciHtml(v, 1) : plain(v, 1));
        return {
          choices: order,
          expected: 0, // the choices are the items' numbers in a shuffled order; item 0 is right
          tolerance: 0.5,
          label: (j) => optText(`${N(show(list[j]))} ${N(SYM.ms2)}`),
          meta: { kind: 'g', answer: list[0] },
        };
      },
      reveal(_q, correct) {
        const q = question;
        const wrong = correct ? null : q.order[picked];
        const mistake = (map, vars = {}) => (wrong != null && map[wrong] ? ` ${t(map[wrong], { ...SYM, ...vars })}` : '');
        if (q.kind === 'mass') {
          const ans = sciHtml(q.list[0], 2, q.exp);
          const key = q.side === 'left' ? 'm1' : 'm2';
          s.ghostF = q.f;
          tweenTo(key, s[key] * 2, 0.8);
          return t('why_mass', { ...SYM, ans, f: sciHtml(q.f, 2, q.exp) }) + mistake({ 1: 'not_mass_sq', 2: 'not_mass_inv', 3: 'not_mass_same' });
        }
        if (q.kind === 'dist') {
          const ans = sciHtml(q.list[0], 2, q.exp);
          s.ghostF = q.f;
          tweenTo('r', q.far ? 1 : 2, 1.1);
          const map = q.far
            ? { 1: 'not_dist_nosq', 2: 'not_dist_near', 3: 'not_dist_near' }
            : { 1: 'not_dist_nosq', 2: 'not_dist_far', 3: 'not_dist_far' };
          return t(q.far ? 'why_dist_half' : 'why_dist2', { ...SYM, ans, f: sciHtml(q.f, 2, q.exp) }) + mistake(map);
        }
        if (q.kind === 'equal') {
          s.quizScene = { ...s.quizScene, arrows: true };
          refresh();
          return t('why_equal', SYM) + mistake({ 1: 'not_eq_less', 2: 'not_eq_more', 3: 'not_eq_none' });
        }
        if (q.kind === 'radius') {
          s.quizScene = { ...s.quizScene, R: true };
          tweenTo('rGrow', 1, 0.7);
          return (
            t('why_radius', { ...SYM, ans: sciHtml(q.list[0]), km: groupBD(EARTH.R / 1000), h: '1' }) +
            mistake(
              { 1: 'not_rad_height', 2: 'not_rad_diam', 3: 'not_rad_km' },
              { km: groupBD(EARTH.R / 1000), m: groupBD(EARTH.R), kmm: groupBD(EARTH.R / 1000) },
            )
          );
        }
        const exact = plain(q.list[0], 2);
        return (
          t('why_g', { ...SYM, ans: plain(q.list[0], 1), Gv: sciHtml(G), Mv: sciHtml(EARTH.M), Rv: sciHtml(EARTH.R), exact }) +
          mistake({ 1: 'not_g_nosq', 2: 'not_g_diam', 3: 'not_g_km' })
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
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) {
      if (s.locked) lockedNudge();
      else setView(b.dataset.view);
    }
    if (b.dataset.example) chooseExample(b.dataset.example);
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
        else chooseExample(s.example);
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
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey = ['1', '2', '3', 'r', 'R', 'Home', 'ArrowRight', 'f', 'F', 'v', 'V'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) chooseExample(EXAMPLES[Number(k) - 1]);
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') chooseExample(s.example);
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  /** Jumps to the state after the first n of the student's natural steps (n = 0…5), with what they found. */
  function applySteps(n) {
    const st = stateAfter(n);
    ++token;
    cancelTweens();
    s.example = st.example;
    s.m1 = st.m1;
    s.m2 = st.m2;
    s.r = st.r;
    s.placed = st.placed ? 1 : 0;
    s.kg = st.kg;
    s.rGrow = st.placed ? 1 : 0;
    for (const k of Object.keys(s.found)) s.found[k] = false;
    STEPS.slice(0, n).forEach((step) => {
      s.found[step.act] = true;
    });
    const lastStep = n > 0 ? STEPS[n - 1] : null;
    s.last = lastStep && lastStep.example === s.example ? lastStep.act : null;
    // the faint arrows of the moment before the last step
    s.ghostF = null;
    s.ghostKg = null;
    if (lastStep && sceneOf(lastStep.example) === 'spheres') {
      const before = stateAfter(n - 1);
      s.ghostF = force(before.m1, before.m2, before.r);
      if (lastStep.example === 'mass' && lastStep.act === 'm1') s.ghostF = force(BASES.mass.m1, BASES.mass.m2, BASES.mass.r);
    }
    if (lastStep?.act === 'add') s.ghostKg = 1;
    earthScene.visible = sceneOf(s.example) === 'earth';
    sphereScene.visible = !earthScene.visible;
  }

  const steps = Math.max(0, Math.min(STEPS.length, Math.round(Number(o.steps) || 0)));
  if (steps > 0) applySteps(steps);
  else {
    s.example = EXAMPLES.includes(o.example) ? o.example : 'dist';
    if (s.example === 'earth') {
      s.placed = 0;
      earthScene.visible = true;
      sphereScene.visible = false;
    } else Object.assign(s, BASES[s.example]);
  }
  syncUI();
  refresh();
  setView(s.view, { animate: false });
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
     * Change any of: example ('dist' | 'mass' | 'earth': back to its start), steps (0…5: the state after that many of
     * the student's steps), act (true: the big button's next change), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.steps != null) {
        applySteps(Math.max(0, Math.min(STEPS.length, Math.round(Number(p.steps) || 0))));
        refresh();
        flyTo(viewPose(), 0);
      }
      if (p.example) await chooseExample(p.example, { animate, quiet: true });
      if (p.act) {
        lastAct = Number.NEGATIVE_INFINITY;
        const wasLocked = s.locked;
        s.locked = false;
        await doAction({ animate });
        s.locked = wasLocked;
      }
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      ++token;
      cancelTweens();
      for (const k of Object.keys(s.found)) s.found[k] = false;
      s.view = 'front';
      controls.enableRotate = false;
      controls.enableZoom = false;
      syncUI();
      await chooseExample('dist', { animate: false, quiet: true });
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The bench, the two spheres where they are now and their pulls, in metres (or the Earth and the weight). */
    exportRoot: () => (earthScene.visible ? earthScene : sphereScene),
  };
}
