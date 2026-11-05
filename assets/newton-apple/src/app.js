// The falling apple (book page 79, topic 3.7), student view. An apple tree on a late-summer meadow, a young Newton
// reading under it, five apples at 1 m to 5 m beside a height pole. The student lets an apple go: in slow motion it falls
// with the Earth's pull F on it, leaving a picture every 0.1 s, and the camera follows it down and pulls back to show the
// whole trail. The panel's heart is the formula F = G mM/R² as a live calculator: every symbol is a button that shows what
// it stands for (the apple, the arrow, the Earth from afar with R from its centre), two sliders change m and h, and the
// line under it divides F by m: F grows with m, g stays. Then a short test. One action, one result, one rule.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { boldArrow } from './arrows.js';
import { fitPose } from './camera.js';
import { createGlobe } from './globe.js';
import { createI18n } from './i18n.js';
import { createPerson } from './person.js';
import {
  BOOK_G,
  EARTH,
  HEIGHT,
  MASS,
  STROBE,
  appleRadius,
  earthAcceleration,
  fallAt,
  fallTime,
  gravity,
  groupBD,
  roundTo,
  sci,
  strobeHeights,
  weight,
  weightChoices,
} from './reading.js';
import { createMeadow, createPole } from './setting.js';
import { APPLE_BOTTOM, APPLE_TOP, FALL_Z, SPOTS, TRUNK, createAppleKit, createTree } from './tree.js';

export const DEFAULTS = {
  m: 200, // g
  h: 2, // m
  t: null, // a moment of the fall (s) to start frozen at (for pictures)
  steps: 0, // 1: start after one fall
  sym: '', // a symbol of the formula to start on
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const GRAVITY = '#7048e8'; // মহাকর্ষ বল: the same violet as the sister figures
const MASS_C = '#c2410c'; // the masses
const DIST = '#0b7285'; // the distance R
const HEIGHT_C = '#1c6fd9'; // a height h
const MINUS = '−';
const SLOW = 5; // the fall is shown this many times slower than life
const DRAWN = 2.5; // the apples are drawn this many times bigger than life
const F_ARROW = 0.25; // metres of arrow for each newton
const DOUBLE_TAP = 450; // ms
const TAP_MOVE = 8; // px: a finger that moves further is turning the view
const TAP_MS = 500;
const AZ = THREE.MathUtils.degToRad(32); // this side, the reader, the apple and the pole stand close together on the screen
const EL = THREE.MathUtils.degToRad(6);
const VIEW_DIR = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
const GLOBE_DIR = new THREE.Vector3(0.26, 0.3, 0.92).normalize();
const SPACE = '#070c22';
const INK_LINE = '#20262e';

const drawnRadius = (m) => DRAWN * appleRadius(m);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (k) => k * k * (3 - 2 * k);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const plain = (x, d = 2) => String(roundTo(x, d)); // no trailing zeros
  const fixed = (x, d = 2) => roundTo(x, d).toFixed(d);

  /** a × 10ⁿ as HTML, its digits through t.num. */
  const pow10 = (m, e) => `${N(m)}×${N('10')}<sup>${N(`${e < 0 ? MINUS : ''}${Math.abs(e)}`)}</sup>`;
  const SYM = {
    F: '<i class="na-qf">F</i>',
    g: '<i class="na-qf">g</i>',
    G: '<i>G</i>',
    m: '<i class="na-qm">m</i>',
    M: '<i class="na-qm">M</i>',
    R: '<i class="na-qd">R</i>',
    h: '<i class="na-qh">h</i>',
    ms2: `ms<sup>${MINUS}${N('2')}</sup>`,
    Gu: `Nm<sup>${N('2')}</sup>kg<sup>${MINUS}${N('2')}</sup>`,
    Gv: pow10('6.67', -11),
  };
  SYM.Rplain = '<i>R</i>';
  SYM.GMR = `${SYM.G}${SYM.M}/${SYM.R}<sup>${N('2')}</sup>`;
  SYM.law = `${SYM.G}${SYM.m}${SYM.M}/${SYM.R}<sup>${N('2')}</sup> = ${SYM.m}${SYM.g}`;

  const chip = (sym, label, cls, extra = '') =>
    `<button type="button" class="na-chip ${cls}" data-sym="${sym}" aria-label="${t(`aria_${sym}`)}" aria-pressed="false"><span class="na-sym">${label}</span><small data-val="${sym}"></small><small class="na-unit" data-unit="${sym}"></small></button>${extra}`;
  const formulaHtml = `
    <div class="na-fml" role="group" aria-label="${t('aria_formula')}">
      ${chip('F', '<i>F</i>', 'k-F')}
      <span class="na-eq">=</span>
      ${chip('G', '<i>G</i>', 'k-G')}
      <span class="na-fr">
        <span class="na-top">${chip('m', '<i>m</i>', 'k-m', '<span class="na-op k-m-x">×</span>')}${chip('M', '<i>M</i>', 'k-M')}</span>
        <span class="na-div" aria-hidden="true">÷</span>
        <span class="na-bot">${chip('R', `<i>R</i><sup>${N('2')}</sup>`, 'k-R')}</span>
      </span>
    </div>`;
  const sliderHtml = (id, min, max, step, label) => `
      <label class="na-sl k-${id}">
        <span class="na-sl-text"><span data-sl-label="${id}"></span> <b data-sl-val="${id}"></b></span>
        <input type="range" data-sl="${id}" min="${min}" max="${max}" step="${step}" aria-label="${label}">
      </label>`;
  const slidersHtml = `<div class="na-sliders">
      ${sliderHtml('m', MASS.min * 1000, MASS.max * 1000, MASS.step * 1000, t('aria_sl_m'))}
      ${sliderHtml('h', HEIGHT.min, HEIGHT.max, HEIGHT.step, t('aria_sl_h'))}
    </div>`;

  /** Two small graphs for tall panels: F grows with m, g does not. The dot is the student's apple. */
  const G_W = 150;
  const G_H = 97;
  const X0 = 32;
  const X1 = 144;
  const Y0 = 8;
  const Y1 = 66;
  const gx = (m) => X0 + ((m - 0) / 0.5) * (X1 - X0);
  const gy = (v, top) => Y1 - (v / top) * (Y1 - Y0);
  const graph = (id, top, yLabel, line, ticks) => `
      <svg class="pvc-graph na-graph" data-graph="${id}" viewBox="0 0 ${G_W} ${G_H}" role="img" aria-label="${t(`aria_graph_${id}`)}">
        <line class="axis" x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}"/><line class="axis" x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}"/>
        <line class="na-gl" x1="${gx(0)}" y1="${gy(line(0), top)}" x2="${gx(0.5)}" y2="${gy(line(0.5), top)}"/>
        <circle class="na-gd" r="5" cx="${gx(0.2)}" cy="${gy(line(0.2), top)}"/>
        <text x="${X0 - 4}" y="${Y0 + 8}" text-anchor="end">${N(ticks)}</text><text x="${X0 - 4}" y="${Y1 + 3}" text-anchor="end">${N('0')}</text>
        <text x="${gx(0.5)}" y="${Y1 + 13}" text-anchor="end">${N('0.5')}</text><text x="${X0}" y="${Y1 + 13}" text-anchor="middle">${N('0')}</text>
        <text x="${(X0 + X1) / 2}" y="${G_H - 6}" text-anchor="middle">m (kg)</text>
        <text x="${X0 + 6}" y="${Y0 + 3}">${yLabel}</text>
      </svg>`;
  const graphsHtml = `<div class="na-graphs">${graph('F', 5, `F (${t('newton')})`, (m) => weight(m), '5')}${graph('g', 15, `g (ms<tspan dy="-3" font-size="9">${MINUS}${N('2')}</tspan>)`, () => BOOK_G, '15')}</div>`;

  root.classList.add('pvc', 'na');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learnAlign: 'start',
    learn:
      formulaHtml +
      slidersHtml +
      graphsHtml +
      cleanSheet(t, {
        quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
        lines: { action: 1, outcome: 1, rule: 3 },
      }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const note = document.createElement('div');
  note.className = 'na-note';
  ui.stage.append(note);
  const fade = document.createElement('div');
  fade.className = 'na-fade';
  ui.stage.append(fade);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.1, far: 400, environment: 'studio-light', environmentIntensity: 0.55, exposure: 1 });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 1.05;
  controls.maxPolarAngle = 1.56;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // the meadow: the tree, the reader, the pole, the apples
  const transparent = o.bg === 'transparent';
  const meadowScene = new THREE.Group();
  meadowScene.name = 'MeadowScene';
  scene.add(meadowScene);
  const kit = createAppleKit();
  const meadow = createMeadow({ trunk: TRUNK, shadow: o.shadow });
  meadow.root.visible = !transparent;
  meadowScene.add(meadow.root);
  const world = new THREE.Group(); // what the GLB holds
  world.name = 'AppleTreeAndReader';
  meadowScene.add(world);
  const tree = createTree({ apples: kit });
  world.add(tree.root);
  const reader = createPerson();
  reader.root.position.set(-0.92, 0, -0.14);
  reader.root.rotation.y = -0.3;
  world.add(reader.root);
  const pole = createPole({ x: 2.28, z: FALL_Z, N });
  world.add(pole.root);

  // the five apples; `hero` is the one chosen, drawn at the student's mass
  const apples = SPOTS.map((q, i) => {
    const a = kit.apple(`Apple${q.h}m`);
    a.spot = q;
    a.spur = tree.spurs[i];
    world.add(a.root);
    return a;
  });
  const twin = kit.apple('SecondApple');
  twin.root.visible = false;
  world.add(twin.root);
  // the pictures of the fall
  const ghostMat = new THREE.MeshLambertMaterial({ color: '#ff5a4d', emissive: '#7a1410', transparent: true, opacity: 0.62 });
  const ghosts = new THREE.InstancedMesh(kit.body, ghostMat, 12);
  ghosts.name = 'Pictures';
  ghosts.count = 0;
  ghosts.frustumCulled = false;
  ghosts.userData.noExport = true;
  meadowScene.add(ghosts);
  // the height on the pole, and the dashed line from the apple to it
  const heightMat = new THREE.MeshBasicMaterial({ color: HEIGHT_C, toneMapped: false });
  const heightBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1, 0.03).translate(0, 0.5, 0), heightMat);
  heightBar.name = 'HeightOnPole';
  heightBar.position.set(pole.x - 0.075, 0, pole.z);
  heightBar.userData.noExport = true;
  meadowScene.add(heightBar);
  const dashGeo = new THREE.BoxGeometry(0.075, 0.016, 0.016);
  const dashes = new THREE.InstancedMesh(dashGeo, heightMat, 24);
  dashes.name = 'HeightLine';
  dashes.frustumCulled = false;
  dashes.userData.noExport = true;
  meadowScene.add(dashes);
  const landing = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.13, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.75, depthWrite: false }),
  );
  landing.name = 'LandingSpot';
  landing.userData.noExport = true;
  meadowScene.add(landing);
  const fArrow = boldArrow('Pull', GRAVITY, 0.022, { order: 22 });
  meadowScene.add(fArrow.root);
  fArrow.root.visible = false;

  // the Earth from afar
  const earth = createGlobe({ renderer: stage.renderer });
  const globeScene = earth.root;
  globeScene.visible = false;
  scene.add(globeScene);
  const gArrowA = boldArrow('PullOnApple', GRAVITY, 0.015, { order: 26 });
  const gArrowE = boldArrow('PullOnEarth', GRAVITY, 0.015, { order: 26 });
  globeScene.add(gArrowA.root, gArrowE.root);
  /** A line drawn over the Earth (a measure, not a thing): a bar with a white rim, ticks across both ends. */
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, depthWrite: false, toneMapped: false });
  const barGeo = new THREE.CylinderGeometry(0.0125, 0.0125, 1, 8).translate(0, 0.5, 0);
  const rimGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 8).translate(0, 0.5, 0);
  const UP = new THREE.Vector3(0, 1, 0);
  const DOWN = new THREE.Vector3(0, -1, 0);
  function measure(name, color) {
    const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, toneMapped: false });
    const bar = new THREE.Mesh(barGeo, mat);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    bar.renderOrder = 24;
    rim.renderOrder = 23;
    const g = new THREE.Group();
    g.name = name;
    g.add(rim, bar);
    g.visible = false;
    g.userData.noExport = true;
    globeScene.add(g);
    const d = new THREE.Vector3();
    return {
      group: g,
      set(a, b) {
        d.subVectors(b, a);
        const len = d.length();
        for (const m of [bar, rim]) {
          m.position.copy(a);
          m.quaternion.setFromUnitVectors(UP, d.clone().normalize());
          m.scale.set(1, len, 1);
        }
        g.visible = true;
      },
      hide: () => (g.visible = false),
      color: (c) => mat.color.set(c),
    };
  }
  const RLine = measure('RFromCentre', DIST);
  const lineA = measure('LineA', INK_LINE);
  const lineC = measure('LineC', INK_LINE);
  const centreDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false, depthWrite: false, toneMapped: false }),
  );
  centreDot.renderOrder = 27;
  centreDot.userData.noExport = true;
  globeScene.add(centreDot);

  // light: a high warm sun from the upper left, and the sky's soft fill
  const sun = new THREE.DirectionalLight('#fff1d6', 2.4);
  sun.position.set(-4.5, 8.5, 5.5);
  scene.add(sun, sun.target);
  const fill = new THREE.HemisphereLight('#cfe4ff', '#a79a58', 1.15);
  scene.add(fill);
  if (o.shadow && !transparent) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 4;
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 6, bottom: -5, near: 1, far: 22 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  const skyColor = transparent ? null : new THREE.Color('#9cc5e4');
  scene.background = skyColor;

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    m: clamp(Number(o.m) || 200, MASS.min * 1000, MASS.max * 1000) / 1000, // kg
    h: clamp(Math.round(Number(o.h) || 2), HEIGHT.min, HEIGHT.max),
    phase: 'hang', // 'hang' | 'fall' | 'landed'
    t: 0, // seconds of the fall (real seconds, the picture runs SLOW times slower)
    paused: false,
    sym: null, // the symbol tapped
    place: 'meadow', // 'meadow' | 'globe'
    shot: 'open', // 'open' (reader, apple, pole) | 'tree' (the whole trail) | 'close' | 'race' | 'globe'
    runs: [], // the falls so far: { m, h, t }
    follow: null, // the camera's glide down with the apple
    mode: 'explore',
    locked: false,
    view: 'front',
    quiz: null, // what a test question shows
    race: 0, // the test's two apples: seconds since they were let go (0: not running)
    userMovedCamera: false,
    fading: false,
  };
  const now = () => performance.now();
  let token = 0;
  let lastAct = Number.NEGATIVE_INFINITY;
  const g0 = BOOK_G;
  const heroIndex = () => s.h - HEIGHT.min;
  const hero = () => apples[heroIndex()];
  const F = () => weight(s.m);

  // ── the apples ──────────────────────────────────────────────────────────────
  /** Hangs an apple of radius r at height h (its lowest point) from a twig's end. */
  function hang(a, r, h, spurY) {
    const top = h + r * (APPLE_BOTTOM + APPLE_TOP * 0.75);
    a.set(r, Math.max(0.02, spurY - top));
    a.root.position.y = h + r * APPLE_BOTTOM;
    a.root.rotation.set(0, 0, 0);
  }
  function hangAll() {
    apples.forEach((a, i) => {
      a.root.position.x = a.spot.x;
      a.root.position.z = a.spot.z;
      a.root.visible = true;
      hang(a, i === heroIndex() ? drawnRadius(s.m) : drawnRadius(0.2), a.spot.h, a.spur.y);
    });
  }
  const heroCentre = new THREE.Vector3();
  function placeFall() {
    const a = hero();
    const r = drawnRadius(s.m);
    const f = fallAt(s.t, s.h, g0);
    if (s.phase === 'hang') hangAll();
    else {
      a.set(r, 0.04);
      a.root.position.y = f.y + r * APPLE_BOTTOM;
      a.root.rotation.z = -s.t * 0.9;
      a.root.rotation.x = s.t * 0.5;
    }
    heroCentre.copy(a.root.position);
    for (const x of apples) x.mesh.castShadow = x === a;
    // the pictures of the fall, one every 0.1 s (the first at the branch)
    const q = s.quiz;
    const list = s.phase === 'hang' || q?.noPictures ? [] : strobeHeights(s.h, s.t, STROBE, g0);
    ghosts.count = list.length;
    const m = placeFall.m;
    for (let i = 0; i < list.length; i++)
      ghosts.setMatrixAt(i, m.compose(placeFall.p.set(a.spot.x, list[i] + r * APPLE_BOTTOM, a.spot.z), placeFall.q, placeFall.sc.setScalar(r)));
    ghosts.instanceMatrix.needsUpdate = true;
    // the pull on the falling apple: its length is the student's F; it stops when the apple is on the ground
    const showArrow = s.phase !== 'landed' && (!q || q.arrow);
    if (showArrow) fArrow.set(placeFall.p.set(a.spot.x, a.root.position.y, a.spot.z), DOWN, Math.max(0.1, F() * F_ARROW));
    else fArrow.hide();
    fArrow.root.visible = showArrow;
    // the height: on the pole, and dashes from the apple's start to it
    heightBar.scale.y = s.h;
    const x0 = a.spot.x + r + 0.05;
    const x1 = pole.x - 0.05;
    const n = Math.min(dashes.instanceMatrix.count, Math.max(1, Math.floor((x1 - x0) / 0.14)));
    const showDashes = !q || q.height;
    dashes.count = showDashes ? n : 0;
    heightBar.visible = showDashes;
    for (let i = 0; i < n; i++)
      dashes.setMatrixAt(i, m.compose(placeFall.p.set(x0 + (i + 0.5) * ((x1 - x0) / n), s.h, a.spot.z), placeFall.q0, placeFall.one));
    dashes.instanceMatrix.needsUpdate = true;
    landing.position.set(a.spot.x, 0.012, a.spot.z);
    landing.visible = s.phase === 'hang' && !q;
  }
  placeFall.m = new THREE.Matrix4();
  placeFall.p = new THREE.Vector3();
  placeFall.q = new THREE.Quaternion();
  placeFall.q0 = new THREE.Quaternion();
  placeFall.sc = new THREE.Vector3();
  placeFall.one = new THREE.Vector3(1, 1, 1);

  // ── the camera ──────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  const MARGIN = { top: 54, bottom: 10, side: 8 };
  const fit = (margin = MARGIN, dir = VIEW_DIR) => fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin });
  /** The opening: the apple and the pole, big; the reader too for the low apples; a higher apple's own part of the tree. */
  function openPose() {
    const a = hero().spot;
    const low = s.h <= 2;
    box.min.set(low ? -1.0 : a.x - 0.7, low ? -0.05 : s.h - 1.9, low ? -0.3 : a.z - 0.1);
    box.max.set(pole.x + 0.5, s.h + 0.42, a.z + 0.1);
    return fit({ top: 26, bottom: 8, side: 6 });
  }
  /** After a fall: the whole trail, from the branch to the grass. */
  function treePose() {
    const a = hero().spot;
    box.min.set(Math.min(-1.0, a.x - 1.2), -0.06, -0.2);
    box.max.set(pole.x + 0.55, Math.max(2.5, s.h + 0.5), a.z + 0.1);
    return fit();
  }
  /** The apple and its arrow, filling the view. */
  function closePose() {
    const a = hero().spot;
    const L = F() * F_ARROW;
    box.min.set(a.x - 0.6, Math.max(-0.05, s.h - Math.max(0.45, L - 0.05)), a.z - 0.1);
    box.max.set(a.x + 0.75, s.h + 0.5, a.z + 0.1);
    return fit();
  }
  /** The test's two apples, against the meadow. */
  function racePose() {
    box.min.set(tree.twinSpur.x - 0.55, -0.05, FALL_Z - 0.1);
    box.max.set(hero().spot.x + 0.55, 1.5, FALL_Z + 0.1);
    return fit();
  }
  /** The window that rides down with the apple (about 1.1 m tall): its pose near the ground, then moved by the apple's height. */
  const followBase = { key: '', pose: null, y: 0.8 };
  function followPose(y) {
    const a = hero().spot;
    const H = Math.max(1.1, F() * F_ARROW + 0.62);
    const key = `${stage.width}x${stage.height}x${a.x}x${H}`;
    if (followBase.key !== key) {
      followBase.y = H - 0.36; // the apple rides this high in the window, its arrow below it
      box.min.set(a.x - 0.5, 0.0, a.z - 0.1);
      box.max.set(a.x + 0.5, H, a.z + 0.1);
      followBase.pose = fit({ top: 30, bottom: 10, side: 8 });
      followBase.key = key;
    }
    const dy = Math.max(0, y + drawnRadius(s.m) * APPLE_BOTTOM - followBase.y);
    follow.position.copy(followBase.pose.position).setY(followBase.pose.position.y + dy);
    follow.target.copy(followBase.pose.target).setY(followBase.pose.target.y + dy);
    return follow;
  }
  const follow = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  function globePose() {
    box.min.set(-1.05, -1.05, -1);
    box.max.set(1.05, 1.5, 1);
    return fit({ top: 44, bottom: 10, side: 8 }, GLOBE_DIR);
  }
  const POSES = { open: openPose, tree: treePose, close: closePose, race: racePose, globe: globePose };
  const poseFor = (shot = s.shot) => POSES[shot]();
  function jump({ position, target }) {
    tweener.cancel('camera');
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
    stage.invalidate();
    return Promise.resolve(true);
  }
  function flyTo({ position, target }, duration = 0.9) {
    if (!duration) return jump({ position, target });
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const p1 = position.clone();
    const t1 = target.clone();
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, p1, k);
        controls.target.lerpVectors(t0, t1, k);
        controls.update();
        labelsFor(); // which side a label takes depends on where things are on the screen
        stage.invalidate();
      },
    }).finished;
  }
  /** Goes to a shot; the Earth and the meadow are two scenes, a quick fade between them. */
  async function goShot(shot, { animate = true } = {}) {
    const place = shot === 'globe' ? 'globe' : 'meadow';
    const my = ++fadeToken;
    s.shot = shot;
    s.userMovedCamera = false;
    syncControls();
    if (place === s.place) {
      if (Number(fade.style.opacity) > 0) fadeTo(0, 0.2);
      return flyTo(poseFor(shot), animate ? 0.9 : 0);
    }
    if (!animate) {
      clearFade();
      setPlace(place);
      return jump(poseFor(shot));
    }
    await fadeTo(1, 0.26);
    if (my !== fadeToken) return false;
    setPlace(place);
    if (place === 'globe') {
      // from close to the tree, back out to the whole Earth
      const p = globePose();
      await jump({
        position: p.position
          .clone()
          .sub(p.target)
          .multiplyScalar(0.42)
          .add(p.target)
          .add(gA.set(0, 0.3, 0)),
        target: p.target.clone().add(gA.set(0, 0.45, 0)),
      });
      flyTo(p, 1.25);
    } else await jump(poseFor(shot));
    return fadeTo(0, 0.36);
  }
  function clearFade() {
    ++fadeToken;
    tweener.cancel('fade');
    fade.style.opacity = '0';
  }
  let fadeToken = 0;
  function fadeTo(to, duration) {
    const from = Number(fade.style.opacity) || 0;
    return tweener.animate({
      key: 'fade',
      duration,
      ease: ease.linear,
      onUpdate: (k) => {
        fade.style.opacity = String(from + (to - from) * k);
      },
    }).finished;
  }
  function setPlace(place) {
    s.place = place;
    meadowScene.visible = place === 'meadow';
    globeScene.visible = place === 'globe';
    if (!transparent) scene.background = place === 'globe' ? spaceColor : skyColor;
    controls.minPolarAngle = place === 'globe' ? 0.5 : 1.05;
    controls.maxPolarAngle = place === 'globe' ? 2 : 1.56;
    sun.castShadow = place === 'meadow' && Boolean(o.shadow) && !transparent;
    fill.intensity = place === 'globe' ? 0.5 : 1.15;
    stage.invalidate();
    refresh();
  }
  const spaceColor = new THREE.Color(SPACE);

  /** The student has turned the view: the figure leaves the camera alone until "first view". */
  function cameraTaken() {
    s.userMovedCamera = true;
    s.follow = null;
    tweener.cancel('camera');
    syncControls();
  }
  stage.onResize(() => {
    followBase.key = '';
    if (!s.userMovedCamera && !s.follow) jump(poseFor());
    refresh();
  });

  // ── the globe's lines ───────────────────────────────────────────────────────
  const gTip = new THREE.Vector3();
  const gA = new THREE.Vector3();
  const gB = new THREE.Vector3();
  const OFF = new THREE.Vector3(0.1, 0, 0.06);
  function placeGlobe() {
    earth.apple.getWorldPosition(gTip);
    const q = s.quiz;
    const lines = q?.lines;
    centreDot.visible = true;
    if (lines) {
      RLine.color(q.shown ? DIST : INK_LINE); // three lines alike until the answer is out
      RLine.set(gA.set(0, 0, 0), gTip);
      lineA.set(gA.set(0.09, 1, 0), gB.set(0.09, gTip.y, 0));
      lineC.set(gA.set(-0.09, -1, 0), gB.set(-0.09, 1, 0));
      gArrowA.hide();
      gArrowE.hide();
      return;
    }
    lineA.hide();
    lineC.hide();
    RLine.color(DIST);
    if (!q && (s.sym === 'R' || s.sym === 'M')) RLine.set(gA.set(0, 0, 0), gTip);
    else RLine.hide();
    const L = 0.34;
    gArrowA.set(gA.set(0, 1 - 0.02, 0).add(OFF), DOWN, L);
    if (!q?.pair || q.shown) gArrowE.set(gA.set(0, 0.02, 0).add(OFF), UP, L);
    else gArrowE.hide();
  }

  // ── labels on the 3D view ───────────────────────────────────────────────────
  const bb = new THREE.Box3();
  /** A box in the scene as a box on the view (canvas pixels), written into `out`. */
  function projected(b3, out) {
    out.left = out.top = Number.POSITIVE_INFINITY;
    out.right = out.bottom = Number.NEGATIVE_INFINITY;
    for (const x of [b3.min.x, b3.max.x])
      for (const y of [b3.min.y, b3.max.y])
        for (const z of [b3.min.z, b3.max.z]) {
          const c = tmp.set(x, y, z).project(camera);
          const sx = (c.x * 0.5 + 0.5) * stage.width;
          const sy = (-c.y * 0.5 + 0.5) * stage.height;
          out.left = Math.min(out.left, sx);
          out.right = Math.max(out.right, sx);
          out.top = Math.min(out.top, sy);
          out.bottom = Math.max(out.bottom, sy);
        }
    return out;
  }
  const arrowOut = { left: 0, top: 0, right: 0, bottom: 0 };
  function arrowBox() {
    if (!fArrow.root.visible) return null;
    bb.setFromObject(fArrow.root);
    return bb.isEmpty() ? null : projected(bb, arrowOut);
  }
  // the reader and the pole's number plates stay clear of the labels that move with the apple
  const readerBox = new THREE.Box3().setFromObject(reader.root);
  const plateBox = new THREE.Box3(new THREE.Vector3(pole.x - 0.03, 0, pole.z - 0.02), new THREE.Vector3(pole.x + 0.5, 5.4, pole.z + 0.04));
  const readerOut = { left: 0, top: 0, right: 0, bottom: 0 };
  const plateOut = { left: 0, top: 0, right: 0, bottom: 0 };
  const keepClear = [
    () => (s.place === 'meadow' ? projected(readerBox, readerOut) : null),
    () => (s.place === 'meadow' ? projected(plateBox, plateOut) : null),
  ];
  const tmp = new THREE.Vector3();
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, ui.$('.pvc-panel-toggle'), () => action?.ringBox(), () => action?.box(), () => arrowBox()],
  });
  const labelText = new Map();
  const labelSpots = new Map();
  function label(id, opts) {
    const spotsKey = JSON.stringify(opts.spots);
    if (labelSpots.get(id) !== spotsKey && anno.has(id)) anno.update(id, { spots: opts.spots });
    labelSpots.set(id, spotsKey);
    if (labelText.get(id) === opts.text && anno.has(id)) return;
    if (anno.has(id) && labelText.has(id)) anno.update(id, { text: opts.text });
    else anno.add(id, opts);
    labelText.set(id, opts.text);
  }
  function unlabel(...ids) {
    for (const id of ids) {
      if (anno.has(id)) anno.remove(id);
      labelText.delete(id);
    }
  }
  const LABELS = ['m', 'F', 'h', 'tv', 'M', 'R', 'centre', 'onE', 'onA', 'tree', 'a', 'b', 'c', 'twin', 'ask'];
  const pts = {
    m: new THREE.Vector3(),
    F: new THREE.Vector3(),
    h: new THREE.Vector3(),
    tv: new THREE.Vector3(),
    R: new THREE.Vector3(),
    onE: new THREE.Vector3(),
    onA: new THREE.Vector3(),
    centre: new THREE.Vector3(0, 0, 0),
    M: new THREE.Vector3(),
    a: new THREE.Vector3(),
    c: new THREE.Vector3(),
    twin: new THREE.Vector3(),
  };
  const RIGHT_F = [
    { dx: 62, dy: 36 },
    { dx: 62, dy: 0 },
    { dx: 62, dy: 58 },
    { dx: -66, dy: 36 },
    { dx: -66, dy: 0 },
    { dx: 62, dy: -30 },
    { dx: 122, dy: 10 },
  ];
  const LEFT_F = [
    { dx: -66, dy: 36 },
    { dx: -66, dy: 0 },
    { dx: -66, dy: 58 },
    { dx: 62, dy: 36 },
    { dx: 62, dy: 0 },
    { dx: -66, dy: -30 },
  ];
  const sxOf = (x, y, z) => (tmp.set(x, y, z).project(camera).x * 0.5 + 0.5) * stage.width;
  function labelsFor() {
    const q = s.quiz;
    if (s.place === 'globe') {
      unlabel('m', 'F', 'h', 'tv', 'twin');
      if (!q?.lines) unlabel('a', 'b', 'c');
      label('centre', {
        text: t('l_centre'),
        point: () => pts.centre,
        kind: 'part',
        spots: [
          { dx: -78, dy: 42 },
          { dx: 78, dy: 42 },
          { dx: 0, dy: 54 },
        ],
      });
      if (q?.lines) {
        unlabel('M', 'R', 'onE', 'onA', 'tree', 'ask');
        const letter = (id, key, p, spots) => label(id, { text: t(key), point: () => p, kind: 'flat', spots });
        letter('a', 'l_a', pts.a.set(0.09, (1 + gTip.y) / 2, 0), [{ dx: 26, dy: 0 }]);
        label('b', { text: t('l_b'), point: () => pts.R.set(0, 0.5, 0), kind: 'flat', spots: [{ dx: 24, dy: 0 }] });
        label('c', { text: t('l_c'), point: () => pts.c.set(-0.09, -0.55, 0), kind: 'flat', spots: [{ dx: -24, dy: 0 }] });
        return;
      }
      label('tree', {
        text: t('l_tree'),
        point: () => pts.a.set(-0.2, 1.33, 0),
        kind: 'part',
        spots: [
          { dx: -74, dy: -30 },
          { dx: 70, dy: -34 },
        ],
      });
      label('onA', {
        text: t('l_on_apple', { F: SYM.F }),
        point: () => pts.onA.set(0, 0.8, 0).add(OFF),
        kind: 'part',
        color: GRAVITY,
        spots: [
          { dx: 80, dy: -8 },
          { dx: 84, dy: 12 },
        ],
      });
      if (q?.pair && !q.shown) {
        unlabel('R', 'M', 'onE');
        label('ask', { text: '?', point: () => pts.onE.set(0, 0.2, 0).add(OFF), kind: 'flat', color: GRAVITY, spots: [{ dx: 0, dy: 0 }] });
        return;
      }
      unlabel('ask');
      label('onE', {
        text: t('l_on_earth', { F: SYM.F }),
        point: () => pts.onE.set(0, 0.2, 0).add(OFF),
        kind: 'part',
        color: GRAVITY,
        spots: [
          { dx: 84, dy: 8 },
          { dx: 84, dy: -14 },
        ],
      });
      if (q) {
        unlabel('R', 'M');
        return;
      }
      label('R', {
        text: t('l_R', { R: SYM.R, v: groupBD(EARTH.R / 1000) }),
        point: () => pts.R.copy(gTip).multiplyScalar(0.55),
        kind: 'flat',
        color: DIST,
        spots: [
          { dx: -74, dy: 0 },
          { dx: -80, dy: 16 },
        ],
      });
      label('M', { text: t('l_M', { M: SYM.M }), point: () => pts.M.set(0.55, -0.62, 0.5), kind: 'flat', color: MASS_C, spots: [{ dx: 0, dy: 0 }] });
      return;
    }
    unlabel('M', 'R', 'centre', 'onE', 'onA', 'tree', 'a', 'b', 'c', 'ask');
    if ((!q || q.showMass) && s.phase !== 'landed')
      label('m', {
        text: t('l_m', { m: SYM.m, v: String(Math.round(s.m * 1000)) }),
        point: () => pts.m.copy(hero().root.position).add(tmp.set(-drawnRadius(s.m), 0, 0)),
        kind: 'part',
        color: MASS_C,
        avoid: keepClear,
        spots: [
          ...(q?.twin ? [{ dx: 70, dy: -32 }] : []),
          { dx: -78, dy: -34 },
          ...(s.phase === 'fall' ? [] : [{ dx: -82, dy: 12 }]),
          { dx: -78, dy: -58 },
          { dx: 76, dy: -36 },
          { dx: 76, dy: 30 },
        ],
      });
    else unlabel('m');
    // is there room between the arrow and the pole for the F label?
    const appleX = sxOf(hero().spot.x, hero().root.position.y, hero().spot.z);
    const besidePole = sxOf(pole.x, hero().root.position.y, pole.z) - appleX > 136;
    if (fArrow.root.visible && (!q || q.showF)) {
      label('F', {
        text: t('l_F', { F: SYM.F, v: plain(F(), 2) }),
        point: () => pts.F.copy(heroCentre).setY(Math.max(0.1, heroCentre.y - F() * F_ARROW * 0.45)),
        kind: 'flat',
        color: GRAVITY,
        avoid: keepClear,
        spots: besidePole ? RIGHT_F : LEFT_F,
      });
    } else unlabel('F');
    if ((!q || q.height) && !s.follow && s.shot !== 'close')
      label('h', {
        text: t('l_h', { h: SYM.h, v: String(s.h) }),
        point: () => pts.h.set(pole.x, s.h - 0.5, pole.z),
        kind: 'flat',
        color: HEIGHT_C,
        spots: [
          { dx: 46, dy: 0 },
          { dx: 46, dy: -24 },
          { dx: 46, dy: 24 },
          { dx: -46, dy: 0 },
          { dx: -46, dy: -28 },
          { dx: -46, dy: 28 },
          { dx: -46, dy: -56 },
          { dx: -46, dy: 56 },
        ],
      });
    else unlabel('h');
    if (s.phase !== 'hang' && !s.quiz) {
      const f = fallAt(s.t, s.h, g0);
      label('tv', {
        text: t('l_tv', { t: fixed(f.t, 2), v: fixed(f.v, 1) }),
        point: () => pts.tv.copy(hero().root.position),
        kind: 'flat',
        avoid: keepClear,
        spots:
          s.phase === 'landed'
            ? [
                { dx: 86, dy: -26 },
                { dx: -86, dy: -62 },
                { dx: 86, dy: -66 },
                { dx: -86, dy: -92 },
                { dx: 86, dy: -92 },
              ]
            : [
                { dx: -86, dy: 8 },
                { dx: 86, dy: -24 },
                { dx: -86, dy: -24 },
                { dx: 86, dy: 26 },
                { dx: -86, dy: 36 },
              ],
      });
    } else unlabel('tv');
    if (q?.twin)
      label('twin', {
        text: t('l_m', { m: SYM.m, v: String(Math.round(q.twin * 1000)) }),
        point: () => pts.twin.copy(twin.root.position),
        kind: 'part',
        color: MASS_C,
        spots: [
          { dx: -60, dy: -22 },
          { dx: -60, dy: 20 },
        ],
      });
    else unlabel('twin');
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const fml = ui.$('.na-fml');
  const val = (id) => ui.$(`[data-val="${id}"]`);
  const unit = (id) => ui.$(`[data-unit="${id}"]`);
  const sl = (id) => ui.$(`[data-sl="${id}"]`);
  const fkLabel = fml.querySelector('.k-F .na-sym');
  const fieldText = new Map();
  function html(el, text) {
    if (fieldText.get(el) !== text) {
      el.innerHTML = text;
      fieldText.set(el, text);
    }
  }
  function rule() {
    const sc = sci(earthAcceleration(s.m), 1);
    const vars = { ...SYM };
    if (s.sym) {
      switch (s.sym) {
        case 'M':
          return t('rule_M', { ...vars, a: pow10(sc.m, sc.e) });
        case 'R':
          return t('rule_R', { ...vars, km: groupBD(EARTH.R / 1000), h: String(s.h) });
        case 'g':
          return t('rule_g', vars);
        default:
          return t(`rule_${s.sym}`, vars);
      }
    }
    if (s.phase === 'fall') return t('rule_fall', vars);
    const n = s.runs.length;
    if (!n) return t('rule_start', vars);
    const last = s.runs[n - 1];
    const prev = n > 1 ? s.runs[n - 2] : null;
    if (prev && prev.h === last.h && prev.m !== last.m)
      return t('rule_mass', {
        ...vars,
        a: String(Math.round(Math.min(prev.m, last.m) * 1000)),
        b: String(Math.round(Math.max(prev.m, last.m) * 1000)),
        t: fixed(last.t, 2),
      });
    if (prev && prev.h !== last.h) return t('rule_height', { ...vars, h: String(last.h), t: fixed(last.t, 2) });
    return t('rule_fell', vars);
  }
  function outcome() {
    const g = `<button type="button" class="na-gbtn" data-sym="g" aria-label="${t('aria_g')}"><i>g</i></button>`;
    if (s.place === 'globe') return t('out_gm', { ...SYM, g, exact: fixed(gravity(), 2), v: plain(g0, 1) }); // the one place the 9.83 shows
    return t('out_g_sum', {
      ...SYM,
      g,
      Fv: fixed(F(), 2),
      mv: fixed(s.m, 2),
      v: plain(g0, 1),
    });
  }
  function refresh() {
    const isG = s.sym === 'g';
    fml.classList.toggle('is-g', isG);
    html(fkLabel, isG ? '<i>g</i>' : '<i>F</i>');
    html(val('F'), N(isG ? fixed(g0, 1) : fixed(F(), 2)));
    html(val('G'), pow10('6.67', -11));
    html(val('m'), N(fixed(s.m, 2)));
    html(val('M'), pow10('5.98', 24));
    html(val('R'), `(${pow10('6.37', 6)})<sup>${N('2')}</sup>`);
    html(unit('F'), isG ? SYM.ms2 : t('newton'));
    html(unit('G'), SYM.Gu);
    html(unit('m'), 'kg');
    html(unit('M'), 'kg');
    html(unit('R'), `m<sup>${N('2')}</sup>`);
    for (const b of ui.$$('.na-chip')) {
      const on = b.dataset.sym === s.sym || (isG && b.dataset.sym === 'F');
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    html(ui.$('[data-sl-label="m"]'), t('sl_m', { m: SYM.m }));
    html(ui.$('[data-sl-label="h"]'), t('sl_h', { h: SYM.h }));
    html(ui.$('[data-sl-val="m"]'), `${N(String(Math.round(s.m * 1000)))} g`);
    html(ui.$('[data-sl-val="h"]'), `${N(String(s.h))} m`);
    for (const [id, value, lo, hi] of [
      ['m', s.m * 1000, MASS.min * 1000, MASS.max * 1000],
      ['h', s.h, HEIGHT.min, HEIGHT.max],
    ]) {
      const el = sl(id);
      if (Number(el.value) !== value) el.value = String(value);
      el.style.setProperty('--p', `${((value - lo) / (hi - lo)) * 100}%`);
    }
    sheet.outcome(outcome());
    sheet.rule(rule());
    const dotF = ui.$('[data-graph="F"] .na-gd');
    dotF.setAttribute('cx', String(gx(s.m)));
    dotF.setAttribute('cy', String(gy(F(), 5)));
    ui.$('[data-graph="g"] .na-gd').setAttribute('cx', String(gx(s.m)));
    const trail = s.place === 'meadow' && s.phase !== 'hang' && !s.quiz ? `<br>${t('l_every', { dt: plain(STROBE, 1) })}` : '';
    html(note, (s.place === 'globe' ? t('note_globe') : t('note_meadow', { k: String(DRAWN), slow: String(SLOW) })) + trail);
    placeFall();
    if (s.place === 'globe') placeGlobe();
    // the ring first: the labels read where it is now
    action?.set({
      step: s.runs.length ? (s.runs.length < 3 ? String(s.runs.length + 1) : '') : '1',
      label: () => t(s.phase === 'fall' ? 'act_falling' : s.phase === 'landed' ? 'act_again' : 'act_drop'),
      enabled: s.phase !== 'fall',
    });
    action?.refresh();
    action?.update();
    labelsFor();
    anno.update();
    stage.invalidate();
  }
  function snapshot() {
    const f = fallAt(s.t, s.h, g0);
    return {
      m: roundTo(s.m, 3),
      h: s.h,
      F: roundTo(F(), 3),
      g: roundTo(g0, 2),
      R: EARTH.R + s.h,
      phase: s.phase,
      t: roundTo(f.t, 3),
      v: roundTo(f.v, 2),
      y: roundTo(f.y, 3),
      pictures: ghosts.count,
      time: roundTo(fallTime(s.h, g0), 3),
      sym: s.sym,
      place: s.place,
      shot: s.shot,
      runs: s.runs.length,
      mode: s.mode,
      locked: s.locked,
      arrow: roundTo(fArrow.root.visible ? F() * F_ARROW : 0, 3),
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify(snap);
    if (key === lastEmit) return;
    lastEmit = key;
    emit('change', snap);
  }

  // ── the student's actions ───────────────────────────────────────────────────
  /** Back on the tree: no fall going on, the trail gone. */
  function rearm() {
    ++token;
    s.phase = 'hang';
    s.t = 0;
    s.paused = false;
    s.follow = null;
    s.race = 0;
    tweener.cancel('bounce');
  }
  function setMass(grams) {
    if (s.locked) return lockedNudge();
    const v = clamp(Math.round(grams / 50) * 50, MASS.min * 1000, MASS.max * 1000) / 1000;
    if (v === s.m && s.phase === 'hang') return true;
    rearm();
    s.m = v;
    if (s.place === 'meadow' && s.shot !== 'close') goShot('close');
    else if (s.place === 'meadow' && !s.userMovedCamera) flyTo(closePose(), 0.35);
    refresh();
    emitChange();
    return true;
  }
  function setHeight(h) {
    if (s.locked) return lockedNudge();
    const v = clamp(Math.round(h), HEIGHT.min, HEIGHT.max);
    if (v === s.h && s.phase === 'hang') return true;
    rearm();
    s.h = v;
    followBase.key = '';
    hangAll();
    if (s.place === 'meadow') goShot('open');
    refresh();
    emitChange();
    return true;
  }
  function setSymbol(sym, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    fml.classList.remove('pulse');
    s.sym = s.sym === sym ? null : sym;
    const shot = s.sym === 'M' || s.sym === 'R' ? 'globe' : s.sym === 'F' || s.sym === 'm' ? 'close' : 'open';
    if (s.phase === 'fall' || (s.phase === 'landed' && (s.sym === 'F' || s.sym === 'm'))) rearm();
    goShot(shot, { animate });
    refresh();
    emit('symbol', { sym: s.sym });
    emitChange();
    return true;
  }
  function land(animate = true) {
    const f = fallAt(1e3, s.h, g0);
    s.t = f.t;
    s.phase = 'landed';
    s.runs.push({ m: s.m, h: s.h, t: f.t });
    if (s.runs.length > 8) s.runs.shift();
    s.follow = null;
    if (animate) {
      audio.contact();
      const a = hero();
      const y0 = drawnRadius(s.m) * APPLE_BOTTOM;
      // a small bounce on the grass
      tweener.animate({
        key: 'bounce',
        duration: 0.5,
        ease: ease.linear,
        onUpdate: (k) => {
          a.root.position.y = y0 + 0.07 * Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k);
          stage.invalidate();
        },
      });
      if (!s.userMovedCamera) {
        s.shot = 'tree';
        flyTo(treePose(), 1.5);
      }
    } else if (!s.userMovedCamera) {
      s.shot = 'tree';
      jump(treePose());
    }
    refresh();
    emit('land', { m: s.m, h: s.h, t: roundTo(f.t, 3), v: roundTo(f.v, 2) });
    emitChange();
  }
  async function drop({ animate = true } = {}) {
    rearm();
    const my = token;
    s.sym = null;
    if (s.place === 'globe') await goShot('open', { animate });
    if (my !== token) return;
    s.phase = 'fall';
    s.t = 0;
    refresh();
    emit('drop', { m: s.m, h: s.h });
    if (!animate) return land(false);
    audio.tick?.();
    if (!s.userMovedCamera) s.follow = { p: camera.position.clone(), t: controls.target.clone(), k: 0 };
    tweener.cancel('camera');
    emitChange();
  }
  async function doAction({ animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (s.phase === 'fall' && !s.paused) return;
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.paused) {
      s.paused = false;
      refresh();
      return;
    }
    await drop({ animate });
  }
  function home({ quiet = false } = {}) {
    if (s.locked && !quiet) return lockedNudge();
    rearm();
    Object.assign(s, { m: 0.2, h: 2, sym: null, runs: [] });
    followBase.key = '';
    goShot('open', { animate: !quiet });
    refresh();
    emitChange();
    return true;
  }

  // the fall itself
  stage.addTicker((dt) => {
    if (s.race) return tickRace(dt);
    if (s.phase !== 'fall') return false;
    if (s.paused) return false;
    s.t += dt / SLOW;
    const f = fallAt(s.t, s.h, g0);
    if (f.landed) {
      land();
      return true;
    }
    placeFall();
    if (s.follow) {
      s.follow.k = Math.min(1, s.follow.k + dt / 0.8);
      const k = smooth(s.follow.k);
      const pose = followPose(f.y);
      camera.position.lerpVectors(s.follow.p, pose.position, k);
      controls.target.lerpVectors(s.follow.t, pose.target, k);
      controls.update();
    }
    labelsFor();
    return true;
  });

  const actionAt = new THREE.Vector3();
  function ringTarget() {
    if (s.mode === 'quiz' || s.place !== 'meadow' || s.phase === 'fall') return null;
    return actionAt.copy(hero().root.position); // on the branch, or on the grass after a fall
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: '1',
    label: () => t('act_drop'),
    target: () => ringTarget(),
    worldRadius: 0.17,
    avoid: [ui.corner, note, () => [...labelText.keys()].map((id) => anno.box(id)), () => arrowBox()],
    pulse: Boolean(o.coach),
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // touching an apple lets it go
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const ball = new THREE.Sphere();
  function pick(e) {
    if (s.place !== 'meadow' || s.mode === 'quiz') return null;
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    for (const a of apples) {
      if (!a.root.visible) continue;
      ball.set(a.root.position, 0.27);
      if (raycaster.ray.intersectsSphere(ball)) return a;
    }
    return null;
  }
  /** Lets that apple go; it first becomes the chosen one. */
  function letGo(a) {
    if (s.phase === 'fall') return;
    if (a.spot.h !== s.h) {
      rearm();
      s.h = a.spot.h;
      followBase.key = '';
      hangAll();
    }
    lastAct = Number.NEGATIVE_INFINITY;
    doAction();
  }
  // a tap on an apple lets it go when the finger comes up; a drag turns the view, wherever it starts
  let press = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      press = { id: e.pointerId, x: e.clientX, y: e.clientY, at: now(), apple: pick(e), moved: false };
    },
    true,
  );
  window.addEventListener(
    'pointermove',
    (e) => {
      if (!press || press.moved || e.pointerId !== press.id) return;
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) <= TAP_MOVE) return;
      press.moved = true;
      if (controls.enableRotate) cameraTaken();
    },
    true,
  );
  const endPress = (e) => {
    if (!press || e.pointerId !== press.id) return;
    const p = press;
    press = null;
    if (e.type === 'pointerup' && !p.moved && p.apple && now() - p.at <= TAP_MS) letGo(p.apple);
  };
  window.addEventListener('pointerup', endPress, true);
  window.addEventListener('pointercancel', endPress, true);
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(e) ? 'pointer' : '';
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
  const qText = ui.$('.pvc-q-text');
  let learnSaved = null;
  let question = null;
  let picked = -1;
  let kinds = [];
  const KINDS = ['gap', 'weight', 'radius', 'race', 'pair'];

  /** A question's picture, nothing left from before. */
  async function setQuizScene(sc, { m = 0.2, h = 2, shot = 'open', phase = 'hang' } = {}) {
    rearm();
    s.sym = null;
    s.quiz = sc;
    s.m = m;
    s.h = h;
    s.userMovedCamera = false;
    hangAll();
    twin.root.visible = false;
    if (phase === 'landed') {
      s.phase = 'landed';
      s.t = fallTime(h, g0);
    }
    unlabel(...LABELS);
    if (s.mode === 'quiz') {
      s.shot = shot;
      const place = shot === 'globe' ? 'globe' : 'meadow';
      if (place !== s.place) setPlace(place);
      syncControls();
      await jump(poseFor(shot));
    }
    refresh();
  }
  /** The two apples of the race, each on its own twig at the same height. */
  function placeTwin(mass) {
    const r = drawnRadius(mass);
    twin.root.position.set(tree.twinSpur.x, 0, tree.twinSpur.z);
    hang(twin, r, s.h, tree.twinSpur.y);
    twin.root.visible = true;
  }
  function tickRace(dt) {
    s.race += dt / SLOW;
    const f = fallAt(s.race, s.h, g0);
    const r = drawnRadius(s.m);
    const a = hero();
    a.set(r, 0.04);
    a.root.position.y = f.y + r * APPLE_BOTTOM;
    const q = drawnRadius(s.quiz?.twin ?? 0.1);
    twin.set(q, 0.04);
    twin.root.position.y = f.y + q * APPLE_BOTTOM;
    if (f.landed) {
      s.race = 0;
      audio.contact();
    }
    stage.invalidate();
    return true;
  }
  const optText = (html2) => `<span class="na-opt">${html2}</span>`;

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        ++token;
        clearFade();
        learnSaved = { m: s.m, h: s.h, runs: s.runs.slice() };
        rearm();
        kinds = shuffle(KINDS.slice());
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        ++token;
        rearm();
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        twin.root.visible = false;
        unlabel(...LABELS);
        Object.assign(s, learnSaved || { m: 0.2, h: 2, runs: [] });
        s.sym = null;
        hangAll();
        syncUI();
        if (s.place !== 'meadow') setPlace('meadow');
        s.shot = 'open';
        s.userMovedCamera = false;
        jump(openPose());
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        const kind = kinds[i % kinds.length];
        picked = -1;
        const ask = (h2) => {
          if (alive()) qText.innerHTML = h2;
        };
        const order = shuffle([0, 1, 2, 3]);
        if (kind === 'gap') {
          await setQuizScene({ arrow: false, height: false }, { h: 4, shot: 'tree', phase: 'landed' });
          if (!alive()) return null;
          const keys = ['gap_g', 'gap_v', 'gap_d', 'gap_p'];
          const vars = { ...SYM, dt: plain(STROBE, 1) };
          question = { kind, keys, order };
          ask(t('q_gap', vars));
          return { choices: order, expected: 0, tolerance: 0.5, label: (j) => optText(t(keys[j], vars)), meta: { kind, answer: 'g' } };
        }
        if (kind === 'weight') {
          const m = [0.15, 0.25, 0.3, 0.4][Math.floor(Math.random() * 4)];
          await setQuizScene({ arrow: false, showMass: true, height: false }, { m, h: 1, shot: 'close' });
          if (!alive()) return null;
          const list = weightChoices(m);
          question = { kind, list, order, m };
          ask(t('q_weight'));
          const words = list.map((v) => `${N(plain(v, 2))} ${t('newton')}`);
          return { choices: order, expected: 0, tolerance: 0.5, label: (j) => optText(words[j]), meta: { kind, answer: list[0] } };
        }
        if (kind === 'radius') {
          await setQuizScene({ lines: true }, { shot: 'globe' });
          if (!alive()) return null;
          const keys = ['rad_b', 'rad_a', 'rad_c', 'rad_ab'];
          question = { kind, keys, order };
          ask(t('q_radius', SYM));
          return { choices: order, expected: 0, tolerance: 0.5, label: (j) => optText(t(keys[j])), meta: { kind, answer: 'centre' } };
        }
        if (kind === 'race') {
          await setQuizScene({ arrow: false, showMass: true, height: false, twin: 0.1 }, { m: 0.5, h: 1, shot: 'race' });
          placeTwin(0.1);
          refresh();
          if (!alive()) return null;
          const words = [t('race_same'), t('race_heavy'), t('race_light'), t('race_five', { n: '5' })];
          question = { kind, order };
          ask(t('q_race'));
          return { choices: order, expected: 0, tolerance: 0.5, label: (j) => optText(words[j]), meta: { kind, answer: 'together' } };
        }
        await setQuizScene({ pair: true }, { shot: 'globe' });
        if (!alive()) return null;
        const keys = ['pair_same', 'pair_half', 'pair_less', 'pair_more'];
        question = { kind: 'pair', order };
        ask(t('q_pair', SYM));
        return { choices: order, expected: 0, tolerance: 0.5, label: (j) => optText(t(keys[j], SYM)), meta: { kind: 'pair', answer: 'same' } };
      },
      reveal(_q, correct) {
        const q = question;
        const wrong = correct ? null : q.order[picked];
        const mistake = (map, vars = {}) => (wrong != null && map[wrong] ? ` ${t(map[wrong], { ...SYM, ...vars })}` : '');
        if (q.kind === 'gap') {
          const vars = { ...SYM, dt: plain(STROBE, 1) };
          return t('why_gap', vars) + mistake({ 1: 'not_gap_v', 2: 'not_gap_d', 3: 'not_gap_p' });
        }
        if (q.kind === 'weight') {
          s.quiz = { ...s.quiz, arrow: true, showF: true };
          refresh();
          return (
            t('why_weight', { ...SYM, v: plain(q.list[0], 2), kg: plain(q.m, 2), gv: plain(g0, 1) }) +
            mistake({ 1: 'not_w_g', 2: 'not_w_m', 3: 'not_w_gv' })
          );
        }
        if (q.kind === 'radius') {
          s.quiz = { ...s.quiz, shown: true };
          refresh();
          return t('why_radius', { ...SYM, km: groupBD(EARTH.R / 1000) }) + mistake({ 1: 'not_rad_a', 2: 'not_rad_c', 3: 'not_rad_ab' });
        }
        if (q.kind === 'race') {
          s.race = 1e-6;
          stage.invalidate();
          return t('why_race', SYM) + mistake({ 1: 'not_race_heavy', 2: 'not_race_light', 3: 'not_race_heavy' });
        }
        s.quiz = { ...s.quiz, shown: true };
        refresh();
        return t('why_pair', SYM) + mistake({ 1: 'not_pair_half', 2: 'not_pair_less', 3: 'not_pair_more' });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncControls() {
    controls.enableRotate = !s.locked;
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = !s.userMovedCamera;
  }
  function syncUI() {
    syncControls();
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
      else goShot(s.place === 'globe' ? 'globe' : s.shot);
    }
    if (b.dataset.sym) setSymbol(b.dataset.sym);
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
        home();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('input', (e) => {
    const el = /** @type {HTMLInputElement} */ (e.target);
    if (el.dataset?.sl === 'm') setMass(Number(el.value));
    else if (el.dataset?.sl === 'h') setHeight(Number(el.value));
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const keys = ['r', 'R', 'Home', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    const sceneKey = keys.includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowRight') setMass(s.m * 1000 + 50);
    else if (k === 'ArrowLeft') setMass(s.m * 1000 - 50);
    else if (k === 'ArrowUp') setHeight(s.h + 1);
    else if (k === 'ArrowDown') setHeight(s.h - 1);
    else if (k === 'r' || k === 'R' || k === 'Home') home();
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  hangAll();
  syncUI();
  refresh();
  jump(poseFor());
  if (o.coach) fml.classList.add('pulse');
  if (o.t != null && o.t !== '' && Number.isFinite(Number(o.t))) freezeAt(Number(o.t));
  else if (Number(o.steps) >= 1) applyDrop();
  if (o.sym) setSymbol(o.sym, { animate: false });
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
  })();

  /** Frozen at a moment of the fall (for pictures, and the book's own stepping). */
  function freezeAt(time) {
    rearm();
    s.phase = 'fall';
    s.paused = true;
    s.t = clamp(time, 0, fallTime(s.h, g0) - 1e-3);
    refresh();
  }
  function applyDrop() {
    rearm();
    s.phase = 'fall';
    land(false);
  }

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /** Change any of: m (grams), h (m), sym ('F', 'G', 'm', 'M', 'R', 'g', or null), t (freeze the fall there), drop (true lets go); animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      const was = s.locked;
      s.locked = false;
      if (p.m != null) {
        if (animate) setMass(Number(p.m));
        else {
          rearm();
          s.m = clamp(Math.round(Number(p.m) / 50) * 50, MASS.min * 1000, MASS.max * 1000) / 1000;
        }
      }
      if (p.h != null) {
        if (animate) setHeight(Number(p.h));
        else {
          rearm();
          s.h = clamp(Math.round(Number(p.h)), HEIGHT.min, HEIGHT.max);
          followBase.key = '';
          hangAll();
          s.shot = 'open';
        }
      }
      if (p.sym !== undefined) {
        if (p.sym === null) {
          s.sym = null;
          await goShot('open', { animate });
        } else if (p.sym !== s.sym) setSymbol(p.sym, { animate });
      }
      if (p.t != null) freezeAt(Number(p.t));
      if (p.drop) await drop({ animate });
      s.locked = was;
      if (!animate && !p.drop && p.sym === undefined && !s.userMovedCamera) jump(poseFor());
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      clearFade();
      s.userMovedCamera = false;
      home({ quiet: true });
      setPlace('meadow');
      s.shot = 'open';
      syncControls();
      jump(openPose());
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The tree, the reader, the pole and the apples (metres). */
    exportRoot: () => world,
  };
}
