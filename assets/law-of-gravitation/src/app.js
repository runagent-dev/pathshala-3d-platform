// Law of gravitation (book pages 78–79, topic 3.7), student view. Two solid iron spheres (1,000 kg is a ball 62 cm
// across) rest on stands on a bench with a metre scale; above each one a violet arrow, tied to its sphere, shows the
// pull on it (মহাকর্ষ বল, the colour gravity has in every figure): two equal arrows pointing at each other, drawn to
// one scale (the pull between two 1,000 kg spheres 1 m apart, 6.67 × 10⁻⁵ N, is 1 m long; in words: the weight of an
// ant). The student does five things, each changing one thing from the picture before, the old arrows left faint so
// the change shows, and every change said first as a comparison ("টান ৪ ভাগের ১ ভাগ", "২ গুণ", "৪ গুণ"), never as a
// power of ten: doubles the distance (the arrows shrink to a quarter), doubles the left mass (they double, on both
// spheres: the small one pulls the big one just as hard), doubles the right mass (four times, and now, last, the
// formula F = Gm₁m₂/r² with each symbol in the colour of what the student changed); then, on the Earth cut open to
// its centre, puts a 1 kg weight on the ground (its weight, about 9.8 N: the Earth's pull; R from the Earth's centre)
// and a second one (twice the weight, the same 9.8 N for each kg: g). Then a short test. The panel is the kit's clean
// sheet (one action, one result, one rule): the examples দূরত্ব · ভর · পৃথিবী as one row of words with what was found
// under each, one big numbered action whose same badge rings the part to touch, one result line (how the pull compares
// with the start; the exact force only as a quiet grey note), one short rule. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { BENCH, createSpheres } from './spheres.js';
import { createEarth, LIFT, WEIGHT } from './earth.js';
import { fitPose } from './camera.js';
import { boldArrow } from './arrows.js';
import { createLab, createStars, gradientTexture } from './setting.js';
import {
  BASES,
  EARTH,
  EXAMPLES,
  STEPS,
  arrowLength,
  decimal,
  distanceFactors,
  force,
  gravity,
  heightChoices,
  massFactors,
  radiusChoices,
  roundTo,
  sphereRadius,
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
const GRAVITY_BEFORE = '#ab98f0'; // the faint arrows of the moment before: a pale violet, opaque, inside the same white outline
const DIST = 0x0b7285; // দূরত্ব: one colour for the distance, on the bench's r line, in the sentences and in the formula
const MINUS = '−';
const LANE = { above: 0.14, gap: 0.17 }; // m: the arrows' lanes above the taller sphere, the lower one for m₁'s arrow
const GHOST_DROP = 0.06; // m: the faint arrow of the moment before runs just under its arrow
const LIFT_2R = 1 - WEIGHT.h / 2; // Earth radii above the ground that put the weight's centre two radii from the Earth's centre
const W_ARROW = 0.3; // Earth radii of arrow per kg of the weight (drawn: the scale is the Earth scene's own)
const DOUBLE_TAP = 450; // ms: a second action this soon after one is ignored
const ELEVATION = [26, 22]; // degrees: the spheres seen from above as steeply as a tall stage allows (portrait), a little lower on wide ones (the bench top must stay deep enough for the r label)
const EARTH_DIR = new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(20)), Math.cos(THREE.MathUtils.degToRad(20)));
const VIEW_3D = new THREE.Vector3(0.55, 0.42, 0.9).normalize();
const X_AXIS = new THREE.Vector3(1, 0, 0);

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

  // symbols with subscripts and powers (the font has no ₁ ² ⁻): passed into strings as vars. What the student changes
  // keeps one colour from the picture to the formula: the pull violet, the masses orange, the distance teal (no number
  // in a class name: the vars' numbers turn into Bangla ones)
  const SYM = {
    F: '<i class="lg-qf">F</i>',
    G: '<i>G</i>',
    M: '<i class="lg-qm">M</i>',
    R: '<i class="lg-qd">R</i>',
    r: '<i class="lg-qd">r</i>',
    g: '<i class="lg-qf">g</i>',
    m: '<i class="lg-qm">m</i>',
    m1: '<i class="lg-qm">m</i><sub class="lg-qm">1</sub>',
    m2: '<i class="lg-qm">m</i><sub class="lg-qm">2</sub>',
    r2: '<i class="lg-qd">r</i><sup class="lg-qd">2</sup>',
    R2: '<i class="lg-qd">R</i><sup class="lg-qd">2</sup>',
    ms2: `ms<sup>${MINUS}2</sup>`,
    four: '4',
    one: '1',
    two: '2',
    sq: '2 × 2 = 4', // never split over two lines
    // the words for what the student changes, in the same colours
    dist: `<span class="lg-qd">${t('w_dist')}</span>`,
    mass: `<span class="lg-qm">${t('w_mass')}</span>`,
  };
  /** A fraction written the way a student writes it in a line (the font has no ¼): ১/৪. */
  const frac = (a, b) => `<span class="lg-frac">${N(a)}/${N(b)}</span>`;
  /** One symbol of a formula with the word for it underneath, both in the colour of what it stands for. */
  const term = (cls, sym, cap = '') => `<span class="lg-term ${cls}"><span class="lg-sym">${N(sym)}</span><small>${cap}</small></span>`;
  const op = (c) => `<span class="lg-op">${c}</span>`;
  /** An operator with the term after it, kept together: a formula that must wrap breaks between these, never inside one. */
  const grp = (c, termHtml) => `<span class="lg-grp">${c ? op(c) : ''}${termHtml}</span>`;
  /** The law, last: F = G × m₁ × m₂ ÷ r², each symbol over its word, coloured like what the student changed. */
  const lawHtml = () =>
    `<span class="lg-formula"><span class="lg-sumword">${t('sum_word')}</span>${[
      grp('', term('lg-qf', SYM.F, t('cap_pull'))),
      grp('=', term('lg-qg', SYM.G, t('cap_G'))),
      grp('×', term('lg-qm', SYM.m1, t('cap_mass'))),
      grp('×', term('lg-qm', SYM.m2, t('cap_mass'))),
      grp('÷', term('lg-qd', SYM.r2, t('cap_dist2'))),
    ].join('')}</span>`;
  /** The same law for a body on the Earth, for each kg: g = G × M ÷ R². */
  const earthLawHtml = () =>
    `<span class="lg-formula">${[
      grp('', term('lg-qf', SYM.g)),
      grp('=', term('lg-qg', SYM.G, t('cap_G'))),
      grp('×', term('lg-qm', SYM.M, t('cap_earth_mass'))),
      grp('÷', term('lg-qd', SYM.R2, t('cap_centre_dist2'))),
    ].join('')}</span>`;
  /** a × 10ⁿ as HTML: only in the quiet "book values" line, never in a first view. */
  const pow10 = (m, e) => `${m}\u00a0×\u00a010<sup>${e < 0 ? MINUS : ''}${Math.abs(e)}</sup>`;
  const BOOK = {
    G: SYM.G,
    Gv: pow10('6.67', -11),
    Gu: `N\u00a0m<sup>2</sup>\u00a0kg<sup>${MINUS}2</sup>`,
    M: SYM.M,
    Mv: pow10('5.98', 24),
    R: SYM.R,
    Rv: pow10('6.37', 6),
  };
  /** The book's numbers as a small grey line after a formula, on frames with room for it (CSS: ≥ 900 px). */
  const bookHtml = (key) => `<span class="lg-line lg-book">${t(key, BOOK)}</span>`;

  root.classList.add('pvc', 'lg');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', results: true, items: EXAMPLES.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 2, outcome: 1, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const outcomeEl = ui.$('.pvc-outcome');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 0.05, far: 100, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 12;
  // turning the view keeps the camera in the room: in front of the wall and above the table
  controls.minAzimuthAngle = -1.05;
  controls.maxAzimuthAngle = 1.05;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = 1.42;
  const M = createMaterials(stage.renderer);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // the two spheres, their arrows (and the faint arrows of the moment before), the stalks to them, the r line
  const spheres = createSpheres({ materials: M, N, unit: 'm' });
  const sphereScene = new THREE.Group();
  sphereScene.name = 'LawOfGravitation';
  sphereScene.add(spheres.root);
  // bold violet arrows in a white outline, drawn over everything; the faint arrows of the moment before under them
  const pull = [boldArrow('PullOnM1', GRAVITY, 0.02, { order: 22 }), boldArrow('PullOnM2', GRAVITY, 0.02, { order: 22 })];
  const ghost = [0, 1].map((i) => boldArrow(`Before${i + 1}`, GRAVITY_BEFORE, 0.016, { order: 18 }));
  for (const a of [...pull, ...ghost]) sphereScene.add(a.root);
  for (const a of ghost) a.root.userData.noExport = true;
  // each arrow is tied to its own sphere: a violet cord from the sphere's top to the arrow's tail, with a dot where it
  // is fastened to the sphere and one at the tail
  const cord = new THREE.MeshBasicMaterial({ color: GRAVITY, transparent: true, opacity: 0.85, depthWrite: false });
  const stalks = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 1, 8).translate(0, 0.5, 0), cord);
    m.userData.noExport = true;
    sphereScene.add(m);
    return m;
  });
  const dotGeo = new THREE.SphereGeometry(0.026, 16, 12);
  const dots = [0, 1].map(() =>
    [0, 1].map(() => {
      const m = new THREE.Mesh(dotGeo, cord);
      m.userData.noExport = true;
      sphereScene.add(m);
      return m;
    }),
  );
  const dimInk = new THREE.MeshBasicMaterial({ color: DIST });
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
  // drawn over the weight and the cut faces (a drawing on the picture), white-outlined like the spheres' pulls
  const wArrow = boldArrow('Weight', GRAVITY, 0.0115, { order: 22 });
  const eArrow = boldArrow('PullOnEarth', GRAVITY, 0.0115, { order: 22 });
  const wGhost = boldArrow('WeightBefore', GRAVITY_BEFORE, 0.0095, { order: 18 });
  const eGhost = boldArrow('PullOnEarthBefore', GRAVITY_BEFORE, 0.0095, { order: 18 });
  for (const a of [wArrow, eArrow, wGhost, eGhost]) earthScene.add(a.root);
  wGhost.root.userData.noExport = true;
  eGhost.root.userData.noExport = true;
  /** A dimension line: a bar from a to b with a short tick across each end, in a white rim (drawn over the cut face). */
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, depthWrite: false, toneMapped: false });
  const barGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 1, 8).translate(0, 0.5, 0);
  const barRimGeo = new THREE.CylinderGeometry(0.0115, 0.0115, 1, 8).translate(0, 0.5, 0);
  const tickGeo = new THREE.BoxGeometry(0.05, 0.009, 0.009);
  const tickRimGeo = new THREE.BoxGeometry(0.06, 0.019, 0.019);
  function dimLine(name, color = 0x1d2733) {
    const g = new THREE.Group();
    g.name = name;
    g.userData.noExport = true;
    const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, toneMapped: false });
    const bar = new THREE.Mesh(barGeo, mat);
    bar.add(Object.assign(new THREE.Mesh(barRimGeo, rimMat), { renderOrder: 8 }));
    const ticks = [0, 1].map(() => {
      const tk = new THREE.Mesh(tickGeo, mat);
      tk.add(Object.assign(new THREE.Mesh(tickRimGeo, rimMat), { renderOrder: 8 }));
      return tk;
    });
    g.add(bar, ...ticks);
    for (const m of [bar, ...ticks]) m.renderOrder = 9;
    g.visible = false;
    earthScene.add(g);
    const up = new THREE.Vector3(0, 1, 0);
    const d = new THREE.Vector3();
    const tq = new THREE.Quaternion();
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
        const q = tq.setFromUnitVectors(X_AXIS, across);
        ticks[0].position.copy(a);
        ticks[1].position.copy(a).addScaledVector(d, len);
        for (const tk of ticks) tk.quaternion.copy(q);
        ticks[1].visible = k > 0.999;
      },
      hide: () => (g.visible = false),
    };
  }
  const RLine = dimLine('RLine', DIST); // the distance R in the distance's colour
  const radiusLine = dimLine('RadiusLine', DIST);
  const liftLine = dimLine('HeightLine');
  // the R line runs on the left cut face, beside the edge from the weight to the centre; the radius on the right face
  const LEFT_U = new THREE.Vector3(-1, 0, 1).normalize();
  const LEFT_N = new THREE.Vector3(1, 0, 1).normalize();
  const RIGHT_U = new THREE.Vector3(1, 0, 1).normalize();
  const RIGHT_N = new THREE.Vector3(-1, 0, 1).normalize();
  const R_OFF = new THREE.Vector3().addScaledVector(LEFT_U, 0.11).addScaledVector(LEFT_N, 0.008);
  scene.add(earthScene);
  earthScene.visible = false;

  // the settings: the spheres on a plain table before a soft blue wall, the Earth in a starry night sky (left out on a transparent
  // background, and never exported)
  const opaque = o.bg !== 'transparent';
  const backgrounds = opaque ? { spheres: gradientTexture('#7fa3c4', '#b5cde0'), earth: gradientTexture('#050a1f', '#18204b') } : null;
  if (opaque) {
    sphereScene.add(createLab());
    earthScene.add(createStars());
  }

  // soft shadows of the bench, the stands and the spheres on the table and the bench top, in a box fitted round them
  const sun = new THREE.DirectionalLight(0xffffff, 0.45);
  sun.position.set(0.6, 4, 2.4);
  sun.target.position.set(1, 0, 0);
  scene.add(sun, sun.target);
  const shadows = Boolean(o.shadow && opaque);
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.004;
    // casters: the bench, the stands and every sphere a learn step or a test question can show (to x = 2.62, up to
    // 1.15 m); receivers: the bench top and the table behind it, to the wall
    const cam = new THREE.PerspectiveCamera();
    cam.position.copy(sun.position);
    cam.lookAt(sun.target.position);
    cam.updateMatrixWorld(true);
    const inv = cam.matrixWorldInverse;
    const p = new THREE.Vector3();
    const b = { l: Infinity, r: -Infinity, b: Infinity, t: -Infinity, n: Infinity, f: -Infinity };
    const take = (x, y, z, caster) => {
      p.set(x, y, z).applyMatrix4(inv);
      if (caster) {
        b.l = Math.min(b.l, p.x);
        b.r = Math.max(b.r, p.x);
        b.b = Math.min(b.b, p.y);
        b.t = Math.max(b.t, p.y);
      }
      b.n = Math.min(b.n, -p.z);
      b.f = Math.max(b.f, -p.z);
    };
    for (const x of [BENCH.x0 - 0.05, BENCH.x1 + 0.05])
      for (const z of [-BENCH.depth / 2 - 0.05, BENCH.depth / 2 + 0.05]) {
        for (const y of [-0.01, 1.15]) take(x, y, z, true);
        take(x, 0, -1.1, false);
      }
    Object.assign(sun.shadow.camera, {
      left: b.l - 0.05,
      right: b.r + 0.05,
      bottom: b.b - 0.05,
      top: b.t + 0.05,
      near: Math.max(0.05, b.n - 0.2),
      far: b.f + 0.2,
    });
    sun.shadow.camera.updateProjectionMatrix(); // three never calls it for a directional light's shadow camera
    spheres.root.traverse((m) => {
      if (m instanceof THREE.Mesh) {
        m.castShadow = !m.name.endsWith('Pointer') && m.name !== 'MetreScale';
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
    lift: 0, // the test: held above the ground, in Earth radii
    pullK: 1, // the pull on the weight as a part of its weight at the ground (a quarter two radii out), for the arrows
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
    quizScene: null, // what a test question shows: { arrows: bool, R: bool, radius: bool, lift: bool, M: bool }
    userMovedCamera: false,
  };
  const sceneOf = (ex) => (ex === 'earth' ? 'earth' : 'spheres');
  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let token = 0; // bumped by anything that calls off what is pending
  let lastAct = Number.NEGATIVE_INFINITY;

  const F = () => force(s.m1, s.m2, s.r);
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
      const top = spheres.top(i).y + 0.005;
      stalks[i].visible = arrowsOn;
      stalks[i].position.set(x, top, 0);
      stalks[i].scale.set(1, Math.max(0.001, ys[i] - top), 1);
      dots[i][0].visible = dots[i][1].visible = arrowsOn;
      dots[i][0].position.set(x, top, 0);
      dots[i][1].position.set(x, ys[i], 0);
    }
    rBar.scale.x = s.r;
    rBar.position.x = s.r / 2;
    rEnds[1].position.x = s.r;
  }

  // ── the Earth's scene each frame ───────────────────────────────────────────
  const tB = new THREE.Vector3();
  const tC = new THREE.Vector3();
  const eC = new THREE.Vector3();
  const eTail = new THREE.Vector3();
  const E_OFF = new THREE.Vector3(0, 0, 0.035);
  const E_SIDE = new THREE.Vector3(0.05, 0, 0);
  function placeEarth() {
    earth.setPlaced(s.placed);
    earth.setLift(s.lift);
    earth.setCount(s.kg === 2 || s.dropping ? 2 : 1);
    const q = s.quizScene;
    const arrowsOn = s.placed > 0.001 && (!q || q.arrows);
    const c = earth.bodyCentre(eC);
    const off = E_OFF;
    const L = W_ARROW * s.kg * s.pullK;
    // a weight held far above the ground: its arrow starts at its underside (a short one would hide inside it)
    const tail = eTail.copy(c).add(off);
    if (s.lift > 0.5) tail.y = c.y - (WEIGHT.h * s.kg) / 2;
    if (arrowsOn) {
      wArrow.set(tail, DOWN, L);
      eArrow.set(off, UP, L);
    } else {
      wArrow.hide();
      eArrow.hide();
    }
    if (arrowsOn && s.ghostKg != null && !s.busy) {
      wGhost.set(tC.copy(tail).add(E_SIDE), DOWN, W_ARROW * s.ghostKg);
      eGhost.set(tC.copy(off).add(E_SIDE), UP, W_ARROW * s.ghostKg);
    } else {
      wGhost.hide();
      eGhost.hide();
    }
    if (s.rGrow > 0.001) RLine.set(tC.copy(R_OFF), tB.copy(c).add(R_OFF), LEFT_U, s.rGrow);
    else RLine.hide();
    if (q?.radius) radiusLine.set(tC.set(0, 0, 0).addScaledVector(RIGHT_N, 0.008), tB.copy(RIGHT_U).addScaledVector(RIGHT_N, 0.008), UP);
    else radiusLine.hide();
    if (q?.liftLine) {
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
    mw: new THREE.Vector3(),
    R: new THREE.Vector3(),
    radius: new THREE.Vector3(),
    lift: new THREE.Vector3(),
    gh: new THREE.Vector3(),
  };
  const tLab = new THREE.Vector3();
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
  // each arrow is named just behind its tail (above its own sphere), so the two never meet: "টান ——→" and "←—— টান"
  const tailPoint = (i) => () => {
    const [y0, y1] = lanes();
    return pts.arrow[i].set(i === 0 ? 0 : s.r, i === 0 ? y0 : y1, 0);
  };
  const TAIL_SPOTS = [
    [
      { dx: -12, dy: 0 },
      { dx: -10, dy: -18 },
      { dx: 0, dy: -22 },
      { dx: 24, dy: -22 },
    ],
    [
      { dx: 12, dy: 0 },
      { dx: 10, dy: -18 },
      { dx: 0, dy: -22 },
      { dx: -24, dy: -22 },
    ],
  ];
  /** How big the pull is next to the faint one of the moment before: "২ গুণ" or a fraction; '' when nothing to compare. */
  function pullCompare() {
    if (s.ghostF == null || s.busy) return '';
    const k = F() / s.ghostF;
    if (Math.abs(k - 1) < 0.01) return '';
    return k > 1 ? t('cmp_times', { k: plain(k, 1) }) : frac(1, roundTo(1 / k, 1));
  }
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
  const SPHERE_LABELS = ['m0', 'm1', 'F0', 'F1', 'r', 'gh'];
  const EARTH_LABELS = ['centre', 'w', 'e', 'mw', 'R', 'radius', 'lift'];
  /**
   * Where the faint arrow of the moment before is named: at its tip on m₂'s lane (that arrow points left). `grew` is
   * true when the new arrow is the longer one (the faint one is the short one under it), else the faint one shows
   * beyond the new arrow's tip. Null when there is nothing to name.
   */
  const ghostAt = new THREE.Vector3();
  function ghostLabelAt() {
    if (s.ghostF == null || s.busy) return null;
    const L = arrowLength(F());
    const Lg = arrowLength(s.ghostF);
    if (Math.abs(Lg - L) < 0.05) return null;
    const y1 = lanes()[1];
    return { at: ghostAt.set(s.r - Lg, y1 - GHOST_DROP, 0), grew: Lg < L };
  }
  function labelsFor() {
    const q = s.quizScene;
    if (sceneNow() === 'spheres') {
      unlabel(...EARTH_LABELS);
      // plain first: "১,০০০ kg" on a sphere, "দূরত্ব = ১ m" on the bench; m₁, m₂ and r (same colours) come with the formula
      const symbols = formulaShown();
      for (const i of [0, 1])
        label(`m${i}`, {
          text: symbols ? t('l_mass', { m: i ? SYM.m2 : SYM.m1, kg: groupBD(i ? s.m2 : s.m1) }) : t('l_mass_plain', { kg: groupBD(i ? s.m2 : s.m1) }),
          point: ballPoint(i),
          dx: 0,
          dy: 0,
          kind: 'ball',
        });
      const arrowsOn = !q || q.arrows;
      const cmp = pullCompare();
      const pullText = cmp ? t('l_pull_cmp', { k: cmp }) : t('l_pull');
      for (const i of [0, 1]) {
        if (!arrowsOn) unlabel(`F${i}`);
        else label(`F${i}`, { text: pullText, point: tailPoint(i), kind: 'flat', color: GRAVITY, spots: TAIL_SPOTS[i] });
      }
      // r: written on the middle of the bench top (the bar under it shows the distance, centre to centre)
      label('r', {
        text: symbols ? t('l_r', { r: SYM.r, v: plain(s.r) }) : t('l_dist', { dist: SYM.dist, v: plain(s.r) }),
        point: () => pts.r.set(s.r / 2, BENCH.top + 0.004, 0),
        kind: 'rdim',
        spots: [
          { dx: 0, dy: 0 },
          { dx: 0, dy: -24 },
        ],
      });
      // the faint arrows of the moment before: named at the tip of the one that shows beyond its arrow
      const gl = ghostLabelAt();
      if (arrowsOn && gl)
        label('gh', {
          text: t('l_before'),
          point: () => {
            const g = ghostLabelAt();
            return g ? pts.gh.copy(g.at) : pts.gh;
          },
          kind: 'flat',
          color: '#6b7683',
          // never dropped: it is what "টান আগের ২ গুণ" is compared with. Shrunk: left of the faint tip; grew: under
          // the short faint arrow, below its own box
          spots: gl.grew
            ? [
                { dx: -34, dy: 12 },
                { dx: -34, dy: 22 },
                { dx: 0, dy: 26 },
                { dx: -26, dy: 26 },
                { dx: 26, dy: 26 },
                { dx: 0, dy: 38 },
              ]
            : [
                { dx: -8, dy: -6 },
                { dx: -8, dy: -14 },
                { dx: -8, dy: -26 },
              ],
        });
      else unlabel('gh');
      return;
    }
    unlabel(...SPHERE_LABELS);
    label('centre', {
      text: t('l_centre'),
      point: () => pts.centre,
      kind: 'part',
      // on a short view the label goes to the right of the centre, under the Earth's F (the R label is on the left)
      spots:
        stage.height < 250
          ? q?.R2
            ? [
                { dx: -14, dy: 18 },
                { dx: 14, dy: 20 },
              ]
            : [
                { dx: 14, dy: 20 },
                { dx: -14, dy: 20 },
              ]
          : [
              { dx: -60, dy: 26 },
              { dx: 60, dy: 30 },
              { dx: -70, dy: -10 },
            ],
    });
    const arrowsOn = s.placed > 0.001 && (!q || q.arrows);
    if (arrowsOn) {
      const L = W_ARROW * s.kg * s.pullK;
      label('w', {
        text: t('l_weight'),
        point: () => pts.w.copy(earth.bodyCentre()).add(tLab.set(0, -L * 0.62, 0.035)),
        kind: 'flat',
        color: GRAVITY,
        spots: [
          { dx: 36, dy: 0 },
          { dx: 40, dy: 10 },
          { dx: -36, dy: 0 },
        ],
      });
      label('e', {
        text: t(stage.height < 250 ? 'l_on_earth_short' : 'l_on_earth'),
        point: () => pts.e.set(0, L * 0.6, 0.035),
        kind: 'flat',
        color: GRAVITY,
        spots: [
          { dx: 22, dy: 0 },
          { dx: -22, dy: 0 },
          { dx: 24, dy: -16 },
          { dx: -24, dy: -16 },
        ],
      });
    } else unlabel('w', 'e');
    // the two weights together (each weight has its own "১ kg" plate)
    if (!q && s.placed > 0.999 && (s.kg === 2 || s.dropping))
      label('mw', {
        text: t('l_weight_total', { kg: '2' }),
        point: () => pts.mw.copy(earth.bodyCentre()).add(tLab.set(0, 0, 0.1)),
        kind: 'flat',
        spots: [
          { dx: -30, dy: 0 },
          { dx: -42, dy: -12 },
          { dx: 30, dy: 0 },
        ],
      });
    else unlabel('mw');
    const small = stage.height < 250;
    if (s.rGrow > 0.999 && (!q || q.R))
      label('R', {
        text: q?.R2
          ? t('l_r2R', { r: SYM.r, R: SYM.R, two: '2' })
          : small
            ? t('l_R_short', { R: SYM.R })
            : t('l_R', { R: SYM.R, v: groupBD(EARTH.R / 1000) }),
        point: () => pts.R.copy(R_OFF).setY(earth.bodyCentre().y * (q?.R2 ? 0.74 : 0.42)),
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
        text: q.R2
          ? small
            ? t('l_R_short', { R: SYM.R })
            : t('l_R', { R: SYM.R, v: groupBD(EARTH.R / 1000) })
          : t('l_radius', { v: groupBD(EARTH.R / 1000) }),
        point: () => pts.radius.copy(RIGHT_U).multiplyScalar(0.62),
        kind: 'part',
        spots: small
          ? [
              { dx: 12, dy: 6 },
              { dx: 12, dy: -12 },
            ]
          : [
              { dx: 50, dy: 34 },
              { dx: 30, dy: 50 },
              { dx: 60, dy: -30 },
            ],
      });
    else unlabel('radius');
    if (q?.liftLine)
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
  /** The student's own step: what they have found so far + 1 (never more than five); a step done before keeps its own number. */
  const stepNo = (act) =>
    s.found[act] ? STEPS.findIndex((x) => x.act === act) + 1 : Math.min(STEPS.length, Object.values(s.found).filter(Boolean).length + 1);
  /**
   * What the big button (and a tap on the ringed part) does now: the next change in this example; else the first
   * change of the next example not finished yet (going to it first); else start again ("আবার", no number).
   */
  function plan() {
    const here = nextHere();
    if (here) return { example: s.example, act: here, step: stepNo(here) };
    const at = ORDER.indexOf(s.example);
    for (let k = 1; k <= ORDER.length; k++) {
      const ex = ORDER[(at + k) % ORDER.length];
      if (!doneOf(ex)) return { example: ex, act: FIRST[ex], step: stepNo(FIRST[ex]) };
    }
    return { example: 'dist', act: 'again', step: '' };
  }

  /** The pull the step being animated ends with (so the words are right while the arrows are still moving). */
  function targetForce() {
    if (!s.busy) return F();
    if (s.acting === 'r2') return force(s.m1, s.m2, 2);
    if (s.acting === 'm1') return force(2000, s.m2, s.r);
    if (s.acting === 'm2') return force(s.m1, 2000, s.r);
    return F();
  }
  /** The exact pull, quiet and grey, no power of ten ("আসল মান ০.০০০০৬৬৭ নিউটন"). */
  const exactHtml = (f) => t('out_exact', { f: decimal(f) });
  const block = (html) => `<span class="lg-line">${html}</span>`;
  /** The result, then the honest note as a quiet grey line of its own (once there is a pull or a weight to be honest about). */
  function outcomeHtml() {
    const main = outcomeMain();
    let note = '';
    if (sceneOf(s.example) === 'spheres') {
      if (s.ghostF != null) note = 'note_spheres'; // with a comparison (a one-line result)
    } else if (s.placed > 0.999 && s.acting !== 'place' && (s.kg === 1 || s.acting === 'add')) note = 'note_earth';
    return note ? `${main}<span class="lg-scale">${t(note)}</span>` : main;
  }
  function outcomeMain() {
    if (sceneOf(s.example) === 'spheres') {
      const f = targetForce();
      if (s.ghostF == null) return `${t(s.example === 'mass' ? 'out_start_mass' : 'out_start', { two: '2', mass: SYM.mass })} ${exactHtml(f)}`;
      // the comparison with the faint arrow: "শুরুর ¼ (৪ ভাগের ১ ভাগ)" or "শুরুর ২ গুণ"
      const k = f / s.ghostF;
      if (k >= 1) return `${t('out_vs_times', { k: plain(k, 1) })} ${exactHtml(f)}`;
      const n = roundTo(1 / k, 1);
      return `${t('out_vs_part', { frac: frac(1, n), a: n, b: 1 })} ${exactHtml(f)}`;
    }
    if (s.placed < 0.999 || s.acting === 'place') return t('out_earth0');
    // g is rounded first (9.8), so that two weights read exactly twice one: 9.8 and 19.6 newtons
    const g1 = roundTo(gravity(), 1);
    if (s.kg === 1 || s.acting === 'add') return t('out_weight', { kg: '1', w: plain(g1, 1) });
    return t('out_weight2', { kg: '2', w: plain(g1 * 2, 1), one: '1', two: '2' });
  }
  /** The law is on the screen: every effect met (distance, then the masses), and the rule is the last one or a summary. */
  function formulaShown() {
    if (s.quizScene || sceneOf(s.example) !== 'spheres') return false;
    const f = s.found;
    return Boolean(f.r2 && f.m1 && f.m2 && (s.last == null || s.last === 'm2'));
  }
  function ruleHtml() {
    const v = { ...SYM };
    const f = s.found;
    const all = f.r2 && f.m1 && f.m2; // every effect met: now, last, the law with the same colours
    const law = () => block(lawHtml()) + bookHtml('book_G');
    if (sceneOf(s.example) === 'spheres') {
      if (s.last === 'r2') return t('rule_dist', v);
      if (s.last === 'm1') return t('rule_m1', v);
      if (s.last === 'm2') return t('rule_m2', v) + (all ? law() : t('rule_hint_dist', v));
      if (all) return t('rule_all', v) + law();
      if (f.r2 && f.m1) return t('rule_sum_both', v);
      if (f.r2) return t('rule_sum_dist', v);
      if (f.m1) return t('rule_sum_mass', v);
      return t('rule_start', v);
    }
    if (s.placed < 0.999 || s.acting === 'place' || !f.place) return t('rule_earth0', v);
    if (s.kg === 1 || s.acting === 'add') return t('rule_earth1', { ...v, km: groupBD(EARTH.R / 1000) });
    // g = G × M ÷ R² only after the law for two spheres (so "G" has been met), else the sentence alone
    const earthLaw = all ? block(earthLawHtml()) + bookHtml('book_earth') : '';
    return t('rule_earth2', { ...v, gv: plain(roundTo(gravity(), 1), 1) }) + earthLaw;
  }

  /** The light, the shadows and the background follow the scene on the view (the Earth casts no shadow anywhere). */
  let settingOf = '';
  function syncSetting() {
    const kind = earthScene.visible ? 'earth' : 'spheres';
    if (kind === settingOf) return;
    settingOf = kind;
    const isEarth = kind === 'earth';
    if (backgrounds) scene.background = backgrounds[kind];
    sun.position.set(isEarth ? -1.2 : 0.6, 4, isEarth ? 3 : 2.4);
    sun.target.position.set(isEarth ? 0 : 1, 0, 0);
    sun.castShadow = shadows && !isEarth;
  }

  let lastKind = '';
  function refresh() {
    syncSetting();
    if (sceneNow() === 'spheres') placeSpheres();
    else placeEarth();
    if (s.mode === 'explore') {
      sheet.choose(s.example);
      sheet.result('dist', s.found.r2 ? t('res_part', { a: '4', b: '1' }) : '');
      sheet.result('mass', s.found.m2 ? t('res_times', { k: '4' }) : s.found.m1 ? t('res_times', { k: '2' }) : '');
      sheet.result(
        'earth',
        s.found.add ? t('res_g', { g: plain(gravity(), 1) }) : s.found.place ? t('res_weight', { w: plain(roundTo(gravity(), 1), 1) }) : '',
      );
      sheet.outcome(outcomeHtml());
      const kind = sceneOf(s.example);
      if (kind !== lastKind) outcomeEl.dataset.k = lastKind = kind;
      sheet.rule(ruleHtml());
      if (action) {
        const p = plan();
        action.set({ step: p.step, label: () => t(ACT_KEY[p.act], { two: '2' }), worldRadius: actionRing()?.radius ?? 0.3 });
        sheet.next(p.example !== s.example ? p.example : null);
        if (s.busy) action.hide('run');
        else action.show('run');
      }
    }
    root.dataset.short = stage.height < 250 ? '1' : ''; // a short view: the part labels get smaller
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
  /** A step still moving is finished where it was going (its numbers, found, last), so nothing half-done is kept. */
  function settleStep() {
    const act = s.acting;
    if (!act) return;
    if (act === 'r2') s.r = 2;
    else if (act === 'm1') s.m1 = 2000;
    else if (act === 'm2') s.m2 = 2000;
    else if (act === 'place') {
      s.kg = 1;
      s.placed = 1;
      s.rGrow = 1;
    } else if (act === 'add') s.kg = 2;
    s.found[act] = true;
    s.last = act;
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
    // a mass doubled is compared with where the mass example starts (both 1,000 kg, 2 m apart): step 2 twice, step 3 four times
    const massStart = force(BASES.mass.m1, BASES.mass.m2, BASES.mass.r);
    s.ghostF = sceneOf(s.example) === 'spheres' ? (act === 'm1' || act === 'm2' ? massStart : F()) : null;
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
      // start again for real: nothing found, so the steps and the words under the examples begin at ১ once more
      for (const k of Object.keys(s.found)) s.found[k] = false;
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
    label: () => t('act_double_r', { two: '2' }),
    target: actionTarget,
    worldRadius: 0.36,
    // the masses written on the balls sit inside the ring: the badge keeps clear of the other labels and the arrows
    avoid: [ui.corner, ui.hint, () => [...labelText.keys()].filter((id) => id !== 'm0' && id !== 'm1').map((id) => anno.box(id)), () => arrowBoxes()],
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
    const R = Math.max(spheres.radius(0), spheres.radius(1), 0.3925, s.quizScene?.maxMass ? sphereRadius(s.quizScene.maxMass) : 0);
    const top = Math.max(lanes()[1], 0.62 + R + LANE.above + LANE.gap);
    box.min.set(-R - 0.06, 0.02, -0.15);
    // room above the arrows for their names
    box.max.set(2 + R + 0.06, top + (s.quizScene ? 0.1 : 0.3), BENCH.depth / 2);
    return box;
  }
  function earthBox() {
    // the centre to the top of two stacked weights (or of the weight held two radii out in a test question)
    const top = s.quizScene?.R2 ? 2 + WEIGHT.h / 2 + 0.2 : 1 + WEIGHT.h * 2 + 0.2;
    box.min.set(-0.66, -0.1, -0.3);
    box.max.set(0.66, top, 0.7);
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
    return fitPose({ box: b, dir, camera, width: stage.width, height: stage.height, margin: MARGIN });
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
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  // the view starts from the front; dragging turns it, and then the "front" button appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
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
      s.lift = sc.lift || 0;
      s.pullK = 1;
      s.rGrow = sc.R ? 1 : 0;
    }
    if (s.view !== 'front') {
      s.view = 'front';
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
  const optText = (html) => `<span class="lg-opt lg-opt-words">${html}</span>`;
  /** "how many times" as words: ২ গুণ · ৩ গুণ · অর্ধেক · ৪ ভাগের ১ ভাগ · একই থাকে (no power of ten anywhere). */
  const factorLabel = (f) => {
    if (f === 1) return optText(t('ch_same'));
    if (f === 0.5) return optText(t('ch_half'));
    return optText(f > 1 ? t('ch_times', { k: plain(f, 1) }) : t('ch_part', { k: plain(1 / f, 1), one: '1' }));
  };

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
        settleStep(); // a step still moving (the test tapped mid-run) is finished first, then saved whole
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
        s.lift = 0;
        s.pullK = 1;
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
          // the picture says what the mass is now; the question only says what it becomes, so the factor (×২ or ×৩) is read
          // off the sphere's own "১,০০০ kg"
          const start = pickOne([
            { m1: 1000, m2: 1000, side: 'left', to: 2000 },
            { m1: 1000, m2: 1000, side: 'right', to: 3000 },
            { m1: 1000, m2: 1000, side: 'left', to: 3000 },
            { m1: 2000, m2: 1000, side: 'left', to: 4000 },
            { m1: 2000, m2: 1000, side: 'right', to: 2000 },
            { m1: 1000, m2: 2000, side: 'right', to: 4000 },
          ]);
          const now = start.side === 'left' ? start.m1 : start.m2;
          const k = start.to / now;
          await setQuizScene({ scene: 'spheres', m1: start.m1, m2: start.m2, r: 2, arrows: true, maxMass: Math.max(start.to, start.m1, start.m2) });
          if (!alive()) return null;
          const f = F();
          const list = massFactors(k); // by how many times the pull changes: right, squared, divided, unchanged
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, side: start.side, to: start.to, now, k, f, list, order };
          ask(t('q_mass', { side: t(`side_${start.side}`), to: groupBD(start.to) }));
          return {
            choices: order,
            expected: 0, // the choices are the items' numbers in a shuffled order; item 0 is right
            tolerance: 0.5,
            label: (j) => factorLabel(list[j]),
            meta: { kind, side: start.side, force: f, answer: list[0] },
          };
        }
        if (kind === 'dist') {
          const far = pickOne([false, true]); // false: 1 m, doubled; true: 2 m, halved
          await setQuizScene({ scene: 'spheres', m1: 1000, m2: 1000, r: far ? 2 : 1, arrows: true });
          if (!alive()) return null;
          const f = F();
          const list = distanceFactors(far ? 0.5 : 2);
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, far, f, list, order };
          ask(t(far ? 'q_dist_half' : 'q_dist2', { two: '2' }));
          return {
            choices: order,
            expected: 0, // the choices are the items' numbers in a shuffled order; item 0 is right
            tolerance: 0.5,
            label: (j) => factorLabel(list[j]),
            meta: { kind, halved: far, force: f, answer: list[0] },
          };
        }
        if (kind === 'equal') {
          const bigLeft = pickOne([true, false]);
          await setQuizScene({ scene: 'spheres', m1: bigLeft ? 4000 : 1000, m2: bigLeft ? 1000 : 4000, r: 2, arrows: false });
          if (!alive()) return null;
          const keys = ['eq_same', 'eq_less', 'eq_more', 'eq_none'];
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, keys, order };
          ask(t('q_equal'));
          return {
            choices: order,
            expected: 0, // the choices are the items' numbers in a shuffled order; item 0 is right
            tolerance: 0.5,
            label: (j) => optText(t(keys[j], { four: '4' })),
            meta: { kind, answer: 'same' },
          };
        }
        if (kind === 'radius') {
          await setQuizScene({ scene: 'earth', arrows: true, R: false, radius: true, lift: LIFT, liftLine: true });
          if (!alive()) return null;
          const list = radiusChoices();
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, list, order };
          ask(t('q_radius', { h: '1', R: SYM.R }));
          // all four are written alike (a number and its unit, the radius in km), so none gives the answer away by its look
          const lab = [`${groupBD(list[0] / 1000)}\u00a0km`, '1\u00a0m', `${groupBD(list[2] / 1000)}\u00a0km`, `${groupBD(list[3])}\u00a0m`];
          return {
            choices: order,
            expected: 0, // the choices are the items' numbers in a shuffled order; item 0 is right
            tolerance: 0.5,
            label: (j) => optText(N(lab[j])),
            meta: { kind, answer: list[0] },
          };
        }
        // the weight two radii from the Earth's centre: needs r read off the picture and squared
        await setQuizScene({ scene: 'earth', arrows: false, R: true, R2: true, radius: true, lift: LIFT_2R });
        if (!alive()) return null;
        const list = heightChoices(2);
        const order = shuffle([0, 1, 2, 3]);
        question = { kind: 'h', list, order };
        ask(t('q_h', { kg: '1', two: '2', R: SYM.R, w0: plain(roundTo(gravity(), 1), 1) }));
        return {
          choices: order,
          expected: 0, // the choices are the items' numbers in a shuffled order; item 0 is right
          tolerance: 0.5,
          label: (j) => optText(`${N(plain(list[j], 1))}\u00a0${t('newton')}`),
          meta: { kind: 'h', answer: list[0] },
        };
      },
      reveal(_q, correct) {
        const q = question;
        const wrong = correct ? null : q.order[picked];
        const mistake = (map, vars = {}) => (wrong != null && map[wrong] ? ` ${t(map[wrong], { ...SYM, ...vars })}` : '');
        if (q.kind === 'mass') {
          const key = q.side === 'left' ? 'm1' : 'm2';
          s.ghostF = q.f; // the faint arrows keep the pull before, the new arrows show the answer
          tweenTo(key, q.to, 0.8);
          const vars = { k: plain(q.k, 1), k2: plain(q.k * q.k, 1), kg0: groupBD(q.now), to: groupBD(q.to) };
          return t('why_mass', { ...SYM, ...vars }) + mistake({ 1: 'not_mass_sq', 2: 'not_mass_inv', 3: 'not_mass_same' }, vars);
        }
        if (q.kind === 'dist') {
          s.ghostF = q.f;
          tweenTo('r', q.far ? 1 : 2, 1.1);
          const map = q.far
            ? { 1: 'not_dist_nosq', 2: 'not_dist_near', 3: 'not_dist_near' }
            : { 1: 'not_dist_nosq', 2: 'not_dist_far', 3: 'not_dist_far' };
          return t(q.far ? 'why_dist_half' : 'why_dist2', SYM) + mistake(map);
        }
        if (q.kind === 'equal') {
          s.quizScene = { ...s.quizScene, arrows: true };
          refresh();
          return t('why_equal', SYM) + mistake({ 1: 'not_eq_less', 2: 'not_eq_more', 3: 'not_eq_none' });
        }
        if (q.kind === 'radius') {
          s.quizScene = { ...s.quizScene, R: true };
          tweenTo('rGrow', 1, 0.7);
          const km = groupBD(EARTH.R / 1000);
          return (
            t('why_radius', { ...SYM, km, h: '1' }) +
            mistake({ 1: 'not_rad_height', 2: 'not_rad_diam', 3: 'not_rad_km' }, { km, m: km, kmm: plain(EARTH.R / 1e6, 2) })
          );
        }
        // the pull two radii out: a quarter of the weight at the ground (the faint arrows keep the weight at the ground)
        s.quizScene = { ...s.quizScene, arrows: true };
        s.pullK = 0.25;
        s.ghostKg = 1;
        refresh();
        return (
          t('why_h', { ...SYM, ans: plain(q.list[0], 1), w0: plain(roundTo(gravity(), 1), 1) }) +
          mistake({ 1: 'not_h_nosq', 2: 'not_h_same', 3: 'not_h_more' })
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
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    controls.enableRotate = controls.enableZoom = !s.locked;
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
      if (lastStep.example === 'mass') s.ghostF = force(BASES.mass.m1, BASES.mass.m2, BASES.mass.r);
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
