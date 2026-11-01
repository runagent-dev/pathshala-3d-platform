// Density (book page 131, topic 5.2), student view. Two ideas, one at a time. First, three balls of the same volume
// (100 cc) from the book's table, cork, wood and iron, wait on a lab bench in front of three tanks of water; one tap
// drops a ball in, and it stops where its density says: the cork floats high, the wood floats about half under, the
// iron sinks to the bottom (water's density, 1.00 gm/cc, decides). The panel works out ρ = m/V for that ball, mass in
// maroon and volume in orange, in gm/cc and kg/m³. Second, a glass box round the same 24 particles (the same mass,
// 100 gm): each tap squeezes it to half the volume, and the density doubles. The rule grows in the book's words
// (ঘনত্ব হচ্ছে একক আয়তনে ভরের পরিমাণ; the unit; temperature changes the volume, not the mass). Then a five-question
// test. Built on the shared student kit.
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
import {
  BALLS,
  BALL_IDS,
  BOX_MASS,
  BOX_START,
  BOX_VOLUMES,
  ORDER_SET,
  QUIZ_BOX_VOLUMES,
  QUIZ_HEAT_VOLUMES,
  SINK_SET,
  UNIT_SET,
  V_BALL,
  WATER,
  ballDensity,
  boxChoices,
  boxSide,
  density,
  fixVolume,
  floatDepth,
  floats,
  groupBD,
  groupIntl,
  heatChoices,
  radiusOf,
  smaller,
  toKgM3,
  unitChoices,
} from './reading.js';
import { BALL_R, BOX_X, REST_Y, TABLE_Z, TANK, TANK_X, WATER_LEVEL, createScene, restOnRing } from './scene.js';

export const DEFAULTS = {
  show: 'cork', // 'cork' | 'wood' | 'iron' | 'box': the word chosen at the start
  dropped: false, // start with all three balls in the water
  V: BOX_START, // the box's volume (cc)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const EXAMPLES = [...BALL_IDS, 'box'];
const DOUBLE_TAP = 450; // ms
const AREA = Math.PI * TANK.R ** 2;
const TOP_Y = TANK.H + BALL_R + 1.2; // a dropped ball passes over the tank's rim here
// what the camera shows for each part of the figure (world boxes), and from where
const LOOKS = {
  balls: { box: [new THREE.Vector3(-21.6, 0, -6), new THREE.Vector3(21.6, TANK.H + 1, TABLE_Z + 3.4)], dir: new THREE.Vector3(0, 0.42, 1) },
  box: { box: [new THREE.Vector3(BOX_X - 4.6, 0, -4), new THREE.Vector3(BOX_X + 4.6, 8.4, 4)], dir: new THREE.Vector3(0.4, 0.34, 1) },
};
const MARGIN = { top: 50, bottom: 34, side: 6 };
const QUIZ_X = [-16.5, -5.5, 5.5, 16.5]; // the four painted balls on the bench
// everything that casts a shadow, wherever it goes: the balls (on the bench, over the rims, in the tanks), the test's
// balls and rings, and the box of particles at its biggest
const SHADOW_BOX = new THREE.Box3(new THREE.Vector3(-21, 0, -6), new THREE.Vector3(BOX_X + 4.6, TANK.H + BALL_R + 5, TABLE_Z + 3.5));

/** Fits the sun's shadow camera tightly round a world box (and updates its projection: three.js does not). */
function fitShadow(light, box) {
  light.updateMatrixWorld();
  light.target.updateMatrixWorld();
  const view = new THREE.Matrix4().lookAt(light.position, light.target.position, new THREE.Vector3(0, 1, 0));
  view.setPosition(light.position);
  const inv = view.clone().invert();
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
  const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const p = new THREE.Vector3();
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        p.set(x, y, z).applyMatrix4(inv);
        lo.min(p);
        hi.max(p);
      }
  const cam = light.shadow.camera;
  const pad = 1;
  Object.assign(cam, { left: lo.x - pad, right: hi.x + pad, bottom: lo.y - pad, top: hi.y + pad, near: Math.max(0.5, -hi.z - 4), far: -lo.z + 40 }); // the bench, beyond the casters, must be inside too
  cam.updateProjectionMatrix();
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const G = (x) => N(t.lang === 'bn' ? groupBD(x) : groupIntl(x)); // Bangladeshi commas in Bangla (৭,৮০০)
  const LETTERS = t('letters').split(',');

  root.classList.add('pvc', 'dn');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'examples', results: true, items: EXAMPLES.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the formula: ρ = m/V (mass maroon, volume orange), and the sum with the numbers of what is chosen
  const eq = document.createElement('div');
  eq.className = 'dn-eq';
  eq.innerHTML = `
    <div class="dn-law" role="img" aria-label="${t('law_label')}">
      <span class="dn-sym c-rho">ρ</span><span class="dn-op">=</span>
      <span class="dn-frac"><span class="dn-sym c-m">m</span><span class="dn-sym c-V">V</span></span>
    </div>
    <div class="dn-sum" aria-live="polite"><span class="dn-l1"><span class="dn-mv"></span> <span class="dn-rho"></span></span><span class="dn-kg"></span></div>`;
  $('.pvc-act-row').after(eq);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 1, far: 900, environment: 'studio-light', exposure: 1.05 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 20;
  controls.maxDistance = 400;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI * 0.49;
  const bgOn = o.bg !== 'transparent';
  if (bgOn) scene.background = new THREE.Color('#eebb8f'); // the wall's own colour, if a turn ever looks past it
  scene.add(new THREE.HemisphereLight('#fff4e6', '#4a5f80', 0.85));
  const sun = new THREE.DirectionalLight('#fff3e0', 1.7);
  sun.position.set(-30, 70, 45);
  sun.target.position.set(15, 0, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#dfeaff', 0.5);
  fill.position.set(40, 25, 60);
  scene.add(fill);
  if (o.shadow && bgOn) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    fitShadow(sun, SHADOW_BOX);
  }
  const world = createScene({ background: bgOn });
  scene.add(world.root);
  const { tanks, balls, rings, quizBalls, quizRings, box } = world;

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    chosen: EXAMPLES.includes(o.show) ? o.show : 'cork',
    where: { cork: 'table', wood: 'table', iron: 'table' }, // 'table' | 'falling' | 'water'
    V: fixVolume(o.V), // the box's volume (cc): where it is going
    shownV: fixVolume(o.V), // where it is now (it moves there smoothly)
    boxMove: '', // '' | 'squeeze' | 'expand'
    prevV: fixVolume(o.V), // the volume before the last change
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    found: { cork: false, wood: false, iron: false, squeeze: false },
    quiz: null, // the question's scene: { kind, … }
    userMovedCamera: false,
    boxRun: 0, // a token: every new squeeze, reset or question bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const part = () => (s.chosen === 'box' ? 'box' : 'balls');

  // ── the balls and the water ─────────────────────────────────────────────────
  /** Where a ball comes to rest in its tank: its centre's height (cm). */
  function restY(rho, r = BALL_R) {
    if (!floats(rho)) return TANK.base + r;
    const V = (4 / 3) * Math.PI * r ** 3;
    const level = WATER_LEVEL + (rho * V) / AREA; // the water it pushes aside raises the level
    return level - floatDepth(r, rho) + r;
  }
  function placeOnTable(id) {
    balls[id].position.set(TANK_X[id], REST_Y, TABLE_Z);
    balls[id].visible = true;
    rings[id].visible = true;
    tanks[id].setLevel(WATER_LEVEL);
    tanks[id].setContact(99);
  }
  function placeInWater(id) {
    const y = restY(ballDensity(id));
    balls[id].position.set(TANK_X[id], y, 0);
    tanks[id].setLevel(world.waterLevelFor(y));
    tanks[id].setContact(y);
  }

  /** The ball jumps from its ring over the rim, drops into the water and stops where its density says. */
  function drop(id, { jump = false } = {}) {
    if (s.where[id] !== 'table') return Promise.resolve(false);
    s.where[id] = 'falling';
    choose(id, { quiet: true });
    if (jump) {
      placeInWater(id);
      return Promise.resolve(arrive(id, true));
    }
    audio.pop();
    refresh();
    const b = balls[id];
    const x = TANK_X[id];
    const rho = ballDensity(id);
    const yEnd = restY(rho);
    const sinks = !floats(rho);
    const spin = new THREE.Euler().copy(b.rotation);
    let splashed = false;
    // over the rim (0 … 0.42), down to the water (… 0.55), then into it: a floater bobs and settles, the iron slows
    // in the water and sinks to the bottom
    return tweener
      .animate({
        key: `drop-${id}`,
        duration: sinks ? 2.3 : 2.6,
        ease: ease.linear,
        onUpdate: (k) => {
          let y;
          let z;
          if (k < 0.42) {
            const u = ease.inOutCubic(k / 0.42);
            z = TABLE_Z * (1 - u);
            y = REST_Y + (TOP_Y - REST_Y) * u + Math.sin(u * Math.PI) * 3;
          } else {
            z = 0;
            const top = WATER_LEVEL + BALL_R; // the ball's centre as it touches the water
            if (k < 0.55) {
              const u = (k - 0.42) / 0.13;
              y = TOP_Y + (top - 0.3 - TOP_Y) * u * u;
            } else {
              if (!splashed) {
                splashed = true;
                audio.contact();
              }
              const u = (k - 0.55) / 0.45;
              if (sinks) y = top + (yEnd - top) * ease.outCubic(Math.min(1, u * 1.15));
              else {
                const dip = Math.max(0, top - 0.3 - yEnd);
                const A = dip + 1.2;
                y = yEnd - A * Math.exp(-4.2 * u) * Math.cos(u * 15) * (1 - u) ** 0.5;
                y = Math.max(y, TANK.base + BALL_R);
              }
            }
          }
          b.position.set(x, y, z);
          b.rotation.set(spin.x + k * 1.6, spin.y + k * 0.9, spin.z);
          tanks[id].setLevel(world.waterLevelFor(y));
          tanks[id].setContact(z === 0 ? y : 99);
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        // cut short (the test began, another view): it lands at once; back on the bench (reset): nothing to do
        if (s.where[id] !== 'falling') return false;
        return arrive(id, !done);
      });
  }
  function arrive(id, quiet) {
    s.where[id] = 'water';
    if (s.mode === 'quiz') return true; // the test has its own scene; leaving it puts the ball in its tank
    placeInWater(id);
    if (s.mode === 'explore') s.found[id] = true;
    if (!quiet) audio.success();
    refresh();
    emit('drop', { ball: id, floats: floats(ballDensity(id)) });
    emitChange();
    return true;
  }

  /** All three balls back on their rings. */
  function ballsHome() {
    for (const id of BALL_IDS) {
      s.where[id] = 'table';
      tweener.cancel(`drop-${id}`);
      placeOnTable(id);
    }
  }

  // ── the box of particles ────────────────────────────────────────────────────
  /** The box goes to volume V (cc), smoothly unless jump. */
  function boxTo(V, { jump = false, quiet = false } = {}) {
    const target = fixVolume(V);
    const token = ++s.boxRun;
    const from = s.shownV;
    s.prevV = s.V;
    s.V = target;
    if (target < from && s.mode === 'explore') s.found.squeeze = true;
    if (jump || from === target) {
      tweener.cancel('box');
      s.shownV = target;
      s.boxMove = '';
      box.setVolume(target);
      refresh();
      emitChange();
      return Promise.resolve(true);
    }
    s.boxMove = target < from ? 'squeeze' : 'expand';
    if (!quiet) audio.tick();
    refresh();
    // the edge changes evenly (the volume as its cube)
    const a = boxSide(from);
    const b = boxSide(target);
    return tweener
      .animate({
        key: 'box',
        duration: Math.abs(Math.log2(target / from)) > 1.5 ? 1.4 : 1.0,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          const side = a + (b - a) * k;
          s.shownV = side ** 3;
          box.setVolume(s.shownV);
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.boxRun) return false;
        s.shownV = target;
        s.boxMove = '';
        box.setVolume(target);
        if (!quiet) audio.contact();
        refresh();
        emit('volume', { V: s.V });
        emitChange();
        return true;
      });
  }
  function squeeze() {
    const v = smaller(s.V);
    return v ? boxTo(v) : Promise.resolve(false);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const foundCount = () => BALL_IDS.filter((id) => s.found[id] || s.where[id] === 'falling').length + (s.found.squeeze ? 1 : 0);
  const falling = () => BALL_IDS.some((id) => s.where[id] === 'falling');
  /** What the big button does next: { label, step, kind, ball }. */
  function plan() {
    if (part() === 'box') {
      if (smaller(s.V)) return { kind: 'squeeze', label: 'act_squeeze', step: s.found.squeeze ? '' : foundCount() + 1 };
      return { kind: 'expand', label: 'act_expand', step: '' };
    }
    const id = s.where[s.chosen] === 'table' ? s.chosen : BALL_IDS.find((b) => s.where[b] === 'table');
    if (id) return { kind: 'drop', ball: id, label: `act_drop_${id}`, step: s.found[id] ? '' : foundCount() + 1 };
    if (falling()) return { kind: 'wait', label: 'act_box', step: '' };
    return { kind: 'box', label: 'act_box', step: '' };
  }

  function sumParts() {
    if (part() === 'box') return { m: BOX_MASS, V: s.V };
    return { m: BALLS[s.chosen].m, V: V_BALL };
  }
  function sumHtml() {
    const { m, V } = sumParts();
    const r = density(m, V);
    return { mv: t('sum_mv', { m: G(m), V: G(V) }), rho: t('sum_rho', { r: N(r) }), kg: t('sum_kg', { k: G(toKgM3(r)) }) };
  }

  function outcomeHtml() {
    if (part() === 'box') {
      if (s.boxMove) return t(s.boxMove === 'squeeze' ? 'out_squeezing' : 'out_expanding');
      if (s.V * 2 === s.prevV) return t('out_half');
      if (s.V < s.prevV) return t('out_less');
      if (s.V > s.prevV && s.V === BOX_START) return t('out_back', { V: G(s.V), r: N(density(BOX_MASS, s.V)) });
      if (s.V > s.prevV) return t('out_more');
      return t('out_box', { n: N(box.count), m: N(BOX_MASS) });
    }
    const w = s.where[s.chosen];
    if (w === 'falling') return t('out_falling');
    if (w === 'water') return t(`out_${s.chosen}`, { r: N(ballDensity(s.chosen)), w: N(WATER.toFixed(2)) });
    return t('out_ready', { V: N(V_BALL) });
  }

  function ruleHtml() {
    const f = s.found;
    if (part() === 'box') return f.squeeze ? t('rule_squeeze') : t('rule_box');
    if (f.cork && f.wood && f.iron)
      return t('rule_same_v', { a: N(ballDensity('cork')), b: N(ballDensity('wood')), c: N(ballDensity('iron')), one: N(1), k: G(toKgM3(1)) });
    if (BALL_IDS.some((id) => f[id])) return t('rule_water', { w: N(WATER.toFixed(2)) });
    return t('rule_start');
  }

  function refresh() {
    sheet.choose(s.chosen);
    for (const id of BALL_IDS) sheet.result(id, s.where[id] === 'water' ? `${N(ballDensity(id))}` : '');
    sheet.result('box', s.found.squeeze || part() === 'box' ? `${N(density(BOX_MASS, s.V))}` : '');
    const p = plan();
    sheet.next(p.kind === 'drop' && p.ball !== s.chosen ? p.ball : p.kind === 'box' ? 'box' : null);
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    const sum = sumHtml();
    const mv = /** @type {HTMLElement} */ (eq.querySelector('.dn-mv'));
    const rho = /** @type {HTMLElement} */ (eq.querySelector('.dn-rho'));
    if (mv.dataset.html !== sum.mv) mv.innerHTML = mv.dataset.html = sum.mv;
    if (rho.dataset.html !== sum.rho) rho.innerHTML = rho.dataset.html = sum.rho;
    const kg = /** @type {HTMLElement} */ (eq.querySelector('.dn-kg'));
    if (kg.dataset.html !== sum.kg) kg.innerHTML = kg.dataset.html = sum.kg;
    if (action) {
      action.set({ step: p.step, label: p.label });
      // the ring and badge only point at something new; then the labels need the room
      if (p.step === '' || falling()) action.hide('scene');
      else action.show('scene');
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const BELOW = [spot(0, 20), spot(0, 34), spot(14, 22), spot(-14, 22)];
  const pts = new Map();
  const ptOf = (id) => {
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    return pts.get(id);
  };
  const labelState = new Map();
  const want = new Map();
  const NAMES = { cork: 'ex_cork', wood: 'ex_wood', iron: 'ex_iron' };
  function syncLabels() {
    want.clear();
    const q = s.quiz;
    if (s.mode === 'quiz' && q) {
      if (q.kind === 'sink')
        q.balls.forEach((b, i) =>
          want.set(`q${i}`, {
            text: t('lbl_quiz', { x: LETTERS[i], m: G(b.m), V: G(b.V) }),
            point: () => ptOf(`q${i}`).set(QUIZ_X[i], 0, TABLE_Z + 2.4),
            spots: BELOW,
          }),
        );
      if (q.kind === 'unit')
        want.set('q0', {
          text: t('lbl_quiz', { x: '', m: G(q.m), V: G(q.V) }),
          point: () => ptOf('q0').set(0, 0, TABLE_Z + 2.4),
          spots: BELOW,
        });
      if (q.kind === 'order')
        BALL_IDS.forEach((id, i) =>
          want.set(`q${i}`, {
            text: t('lbl_letter', { x: LETTERS[i] }),
            point: () => ptOf(`q${i}`).set(TANK_X[id], 0, TANK.R + 1),
            spots: BELOW,
          }),
        );
      if (q.kind === 'box' || q.kind === 'heat') boxLabels();
    } else if (part() === 'box') boxLabels();
    else
      for (const id of BALL_IDS)
        want.set(id, {
          text: t('lbl_ball', { name: `<b>${t(NAMES[id])}</b>`, m: G(BALLS[id].m) }),
          point: () => ptOf(id).set(TANK_X[id], 0, TABLE_Z + 2.4),
          spots: BELOW,
          cls: s.chosen === id ? 'on' : '',
        });
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.kind || 'tag'}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: w.kind || 'tag', color: w.color, spots: w.spots, optional: w.optional });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, key);
      }
    }
  }
  function boxLabels() {
    const side = () => boxSide(s.shownV);
    want.set('box-m', {
      text: t('lbl_m', { m: N(BOX_MASS) }),
      point: () => ptOf('box-m').set(BOX_X - side() / 2, side() * 0.45, side() / 2),
      spots: [spot(-18, 0), spot(-18, 16), spot(-18, -16), spot(-18, 30)],
      kind: 'mass',
    });
    want.set('box-V', {
      text: t('lbl_V', { V: G(s.V) }),
      point: () => ptOf('box-V').set(BOX_X + side() / 2, side(), -side() / 2),
      spots: [spot(16, -16), spot(16, 0), spot(16, -30), spot(0, -24)],
      kind: 'volume',
    });
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const fitBox = new THREE.Box3();
  function viewPose(look = part()) {
    const L = LOOKS[look];
    fitBox.min.copy(L.box[0]);
    fitBox.max.copy(L.box[1]);
    // wide, short frames: a lower camera, so the bench in front takes less of the height and the tanks are bigger
    const aspect = stage.width / Math.max(1, stage.height);
    const dir = L.dir.clone();
    if (look === 'balls' && aspect > 1.2) dir.y = Math.max(0.2, dir.y - (aspect - 1.2) * 0.12);
    return fitPose({ box: fitBox, dir: dir.normalize(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  /** Only the part being looked at is drawn (the other would peek in at the side of tall frames). */
  function showParts(both = false) {
    box.root.visible = both || shownLook === 'box';
    world.ballsPart.visible = both || shownLook === 'balls';
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      showParts();
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: 'camera',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          showParts(k < 1);
          camera.position.lerpVectors(p0, position, k);
          controls.target.lerpVectors(t0, aim, k);
          controls.update();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (done) {
          showParts();
          refresh();
        }
        return done;
      });
  }
  let shownLook = part();
  /** Chooses a word: a ball (the camera on the tanks) or the box (the camera on the box). */
  function choose(id, { animate = true, quiet = false } = {}) {
    if (!EXAMPLES.includes(id)) return Promise.resolve(false);
    s.chosen = id;
    const look = part();
    const fly = look !== shownLook;
    shownLook = look;
    if (fly) s.userMovedCamera = false;
    if (!quiet) {
      refresh();
      emit('choose', { show: id });
      emitChange();
    }
    return fly || !s.userMovedCamera ? flyTo(viewPose(look), animate && fly ? 1.0 : 0) : Promise.resolve(true);
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
    if (!s.userMovedCamera) flyTo(viewPose(shownLook), 0);
    refresh();
  });

  // ── the action: the big button, the ring on what it acts on, a tap in the picture ─
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not drop two balls at once
    lastAct = now();
    hintOff();
    if (falling() && part() === 'balls') return showHint(t('hint_wait'), { duration: 2200 });
    const p = plan();
    if (p.kind === 'drop') return drop(p.ball);
    if (p.kind === 'box') return choose('box');
    if (p.kind === 'squeeze') return squeeze();
    return boxTo(BOX_START);
  }
  const ringBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_drop_cork',
    target: () => {
      const p = plan();
      if (p.kind === 'drop') return balls[p.ball];
      if (p.kind === 'squeeze' || p.kind === 'expand') {
        const h = boxSide(s.shownV);
        ringBox.min.set(BOX_X - h / 2, 0, -h / 2);
        ringBox.max.set(BOX_X + h / 2, h, h / 2);
        return ringBox;
      }
      return null;
    },
    pad: 6,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** What a tap at p hits: a ball on the bench, the box, or nothing. */
  function pick(p) {
    if (s.mode === 'quiz') return null;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const list = part() === 'box' ? [box.glass] : BALL_IDS.map((id) => balls[id]);
    const hit = raycaster.intersectObjects(list, false)[0];
    if (!hit) return null;
    if (hit.object === box.glass) return 'box';
    return BALL_IDS.find((id) => balls[id] === hit.object) || null;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const what = pick(canvasPoint(e));
      if (!what) return;
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (what === 'box') return doAction();
      if (s.where[what] === 'table') {
        if (now() - lastAct < DOUBLE_TAP) return;
        if (falling()) return showHint(t('hint_wait'), { duration: 2200 });
        lastAct = now();
        hintOff();
        return drop(what);
      }
      choose(what);
      if (s.where[what] === 'water') showHint(t('hint_in'), { duration: 3000 });
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = pick(p) ? 'pointer' : '';
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

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const p = plan();
    const { m, V } = sumParts();
    return {
      show: s.chosen,
      balls: Object.fromEntries(BALL_IDS.map((id) => [id, { m: BALLS[id].m, V: V_BALL, rho: ballDensity(id), where: s.where[id] }])),
      box: { m: BOX_MASS, V: s.V, rho: density(BOX_MASS, s.V) },
      m,
      V,
      rho: density(m, V), // gm/cc, of what is chosen
      kgm3: toKgM3(density(m, V)),
      found: { ...s.found },
      next: p.kind,
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.show, s.where, snap.box.V, snap.found, snap.mode, snap.view]);
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
  const gcc = (v) => `${G(v)}&nbsp;${t('u_gcc')}`;
  const kgm = (v) => `${G(v)}&nbsp;${t('u_kgm3')}`;
  /** Four choices from items (the right one first), shuffled. */
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="dn-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  /** Hides everything the questions add, and puts the learn scene's balls away or back. */
  function clearQuizScene(showBalls) {
    for (const b of quizBalls) b.visible = false;
    for (const r of quizRings) r.visible = false;
    for (const id of BALL_IDS) {
      balls[id].visible = showBalls;
      rings[id].visible = showBalls;
      tanks[id].setLevel(WATER_LEVEL);
      tanks[id].setContact(99);
    }
  }
  function quizLook(look) {
    shownLook = look;
    s.userMovedCamera = false;
    return flyTo(viewPose(look), 0.6);
  }
  function restingOnRing(ball, ring, x, r) {
    ball.scale.setScalar(r);
    ball.position.set(x, restOnRing(r), TABLE_Z);
    ball.visible = true;
    ring.position.set(x, rings.cork.position.y, TABLE_Z);
    ring.visible = true;
  }
  async function quizScene(q) {
    s.boxRun++;
    for (const id of BALL_IDS) tweener.cancel(`drop-${id}`);
    tweener.cancel('box');
    s.quiz = q;
    if (q.kind === 'box' || q.kind === 'heat') {
      clearQuizScene(true);
      s.chosen = 'box';
      s.V = q.V;
      s.shownV = q.V;
      s.boxMove = '';
      box.setVolume(q.V);
      refresh();
      return quizLook('box');
    }
    s.chosen = s.chosen === 'box' ? 'cork' : s.chosen;
    clearQuizScene(false);
    if (q.kind === 'sink') q.balls.forEach((b, i) => restingOnRing(quizBalls[i], quizRings[i], QUIZ_X[i], radiusOf(b.V)));
    if (q.kind === 'unit') restingOnRing(quizBalls[0], quizRings[0], 0, radiusOf(q.V));
    if (q.kind === 'order')
      BALL_IDS.forEach((id, i) => {
        const b = quizBalls[i];
        const y = restY(q.rhos[i]);
        b.scale.setScalar(BALL_R);
        b.position.set(TANK_X[id], y, 0);
        b.visible = true;
        tanks[id].setLevel(world.waterLevelFor(y));
        tanks[id].setContact(y);
      });
    refresh();
    return quizLook('balls');
  }
  /** Back to the learn scene as it was before the test. */
  function restoreLearn(saved) {
    clearQuizScene(true);
    s.quiz = null;
    for (const id of BALL_IDS) {
      s.where[id] = saved.where[id] === 'table' ? 'table' : 'water';
      if (s.where[id] === 'water') placeInWater(id);
      else placeOnTable(id);
    }
    s.V = saved.V;
    s.shownV = saved.V;
    s.boxMove = '';
    box.setVolume(saved.V);
    s.chosen = saved.chosen;
    shownLook = part();
    s.userMovedCamera = false;
    refresh();
    flyTo(viewPose(), 0);
  }

  let learnSaved = null;
  let question = null;
  let picked = -1;
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
        learnSaved = { chosen: s.chosen, where: { ...s.where }, V: s.V, found: { ...s.found } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.boxRun++;
        syncUI();
        const saved = learnSaved || { chosen: 'cork', where: { cork: 'table', wood: 'table', iron: 'table' }, V: BOX_START, found: s.found };
        s.found = { ...saved.found };
        restoreLearn(saved);
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['box', 'order', 'sink', 'heat', 'unit'][i % 5];
        if (kind === 'box') {
          const V = pickOne(QUIZ_BOX_VOLUMES);
          await quizScene({ kind, V });
          if (!alive()) return null;
          question = { kind, m: BOX_MASS, V };
          return { text: t('q_box'), ...choicesOf(boxChoices(BOX_MASS, V), kind, (x) => gcc(x.v)) };
        }
        if (kind === 'order') {
          const rhos = shuffle([...ORDER_SET]);
          await quizScene({ kind, rhos });
          if (!alive()) return null;
          const sinker = rhos.findIndex((r) => !floats(r));
          question = { kind, rhos, sinker };
          const items = [sinker, ...[0, 1, 2].filter((j) => j !== sinker), 'equal'].map((j) => ({ key: j === 'equal' ? 'equal' : `b${j}`, j }));
          return { text: t('q_order'), ...choicesOf(items, kind, (x) => (x.key === 'equal' ? t('c_equal') : LETTERS[x.j])) };
        }
        if (kind === 'sink') {
          const set = shuffle(SINK_SET.map((b) => ({ ...b })));
          await quizScene({ kind, balls: set });
          if (!alive()) return null;
          question = { kind, balls: set };
          const right = set.findIndex((b) => b.key === 'right');
          const items = [right, ...[0, 1, 2, 3].filter((j) => j !== right)].map((j) => ({ key: set[j].key, j }));
          return { text: t('q_sink'), ...choicesOf(items, kind, (x) => LETTERS[x.j]) };
        }
        if (kind === 'heat') {
          const V = pickOne(QUIZ_HEAT_VOLUMES);
          await quizScene({ kind, V });
          if (!alive()) return null;
          question = { kind, m: BOX_MASS, V };
          return { text: t('q_heat'), ...choicesOf(heatChoices(BOX_MASS, V), kind, (x) => gcc(x.v)) };
        }
        const u = pickOne(UNIT_SET);
        await quizScene({ kind: 'unit', ...u });
        if (!alive()) return null;
        question = { kind: 'unit', ...u };
        return { text: t('q_unit'), ...choicesOf(unitChoices(u.m, u.V), 'unit', (x) => kgm(x.v)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const item = q.list?.[picked];
        const wrong = correct ? null : item;
        if (k === 'box') {
          const r = density(question.m, question.V);
          const notes_ = { flip: 'mis_box_flip', times: 'mis_box_times', kg: 'mis_box_kg' };
          return (
            t('why_box', { r: N(r), m: N(question.m), V: N(question.V) }) +
            (wrong && notes_[wrong.key] ? ` ${t(notes_[wrong.key], { one: N(1), k: G(toKgM3(r)) })}` : '')
          );
        }
        if (k === 'order') {
          const x = LETTERS[question.sinker];
          let note = '';
          if (wrong?.key === 'equal') note = ` ${t('mis_order_equal')}`;
          else if (wrong) note = ` ${t('mis_order_float', { x: LETTERS[wrong.j] })}`;
          return t('why_order', { x }) + note;
        }
        if (k === 'sink') {
          const j = question.balls.findIndex((b) => b.key === 'right');
          const b = question.balls[j];
          let note = '';
          if (wrong) {
            const w = question.balls[wrong.j];
            note = ` ${t(w.key === 'heavy' ? 'mis_sink_heavy' : 'mis_sink_other', { x: LETTERS[wrong.j], r: N(density(w.m, w.V)) })}`;
          }
          return t('why_sink', { x: LETTERS[j], m: N(b.m), V: N(b.V), r: N(density(b.m, b.V)) }) + note;
        }
        if (k === 'heat') {
          const notes_ = { double: 'mis_heat_double', same: 'mis_heat_same', quarter: 'mis_heat_quarter' };
          return (
            t('why_heat', { r: N(density(question.m, 2 * question.V)), m: N(question.m), V2: N(2 * question.V) }) +
            (wrong && notes_[wrong.key] ? ` ${t(notes_[wrong.key])}` : '')
          );
        }
        const g = density(question.m, question.V);
        const vars = { k: G(toKgM3(g)), m: N(question.m), V: N(question.V), g: N(g), one: N(1), th: G(1000), h: N(100), ten: N(10), e6: `−${N(6)}` };
        const notes_ = { same: 'mis_unit_same', div: 'mis_unit_div', hundred: 'mis_unit_hundred' };
        return t('why_unit', vars) + (wrong && notes_[wrong.key] ? ` ${t(notes_[wrong.key], vars)}` : '');
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
    s.boxRun++;
    tweener.cancel('box');
    ballsHome();
    s.V = BOX_START;
    s.shownV = BOX_START;
    s.boxMove = '';
    s.prevV = BOX_START;
    box.setVolume(BOX_START);
    choose('cork');
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
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else choose(b.dataset.example);
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
      ['1', '2', '3', '4', 'r', 'R', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-'].includes(k) ||
      ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    const step = (dir) => {
      if (part() !== 'box') return;
      const i = BOX_VOLUMES.indexOf(s.V) + dir;
      if (i >= 0 && i < BOX_VOLUMES.length) boxTo(BOX_VOLUMES[i]);
    };
    if (['1', '2', '3', '4'].includes(k)) choose(EXAMPLES[Number(k) - 1]);
    else if (k === 'ArrowDown' || k === 'ArrowLeft' || k === '-') step(-1);
    else if (k === 'ArrowUp' || k === 'ArrowRight' || k === '+') step(1);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  controls.enableRotate = s.view === '3d';
  for (const id of BALL_IDS) placeOnTable(id);
  if (o.dropped)
    for (const id of BALL_IDS) {
      s.where[id] = 'water';
      s.found[id] = true;
      placeInWater(id);
    }
  box.setVolume(s.shownV);
  if (s.V < BOX_START) s.found.squeeze = true;
  shownLook = part();
  flyTo(viewPose(), 0);
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
     * Change any of: show ('cork' | 'wood' | 'iron' | 'box': the word chosen), drop ('cork' | 'wood' | 'iron' | 'all':
     * into the water; with animate: false at once), V (the box's volume, 50 | 100 | 200 | 400 cc), view ('front' |
     * '3d'), found ({ cork, wood, iron, squeeze }: what the rule has already told).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.found) {
        Object.assign(s.found, p.found);
        refresh();
      }
      if (p.show) await choose(p.show, { animate });
      if (p.drop) {
        const list = p.drop === 'all' ? BALL_IDS : [p.drop];
        for (const id of list) if (BALL_IDS.includes(id)) await drop(id, { jump: !animate });
      }
      if (p.V != null) {
        if (part() !== 'box') await choose('box', { animate });
        await boxTo(p.V, { jump: !animate, quiet: !animate });
      }
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = { cork: false, wood: false, iron: false, squeeze: false };
      goHome();
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The three tanks of water with their balls, and the box of particles, in centimetres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Density';
      for (const id of BALL_IDS) g.add(tanks[id].root.clone(true), balls[id].clone(true), rings[id].clone(true));
      g.add(box.root.clone(true));
      return g;
    },
  };
}
