// A water barometer (book page 145, topic 5.4.1), student view: one guided sequence, one big step button, one short
// line per step. (1) The mercury barometer as in the owner's picture: a glass tube closed at the top in a dish, the
// silver column at 76 cm, the vacuum above, an outlined air-pressure arrow on the dish and a 76 cm dimension line.
// (2) "What if water, not mercury?": the same tube and dish, 11 m tall, with lightly tinted blue water, appear beside
// it; the camera pulls back while the water rises and stops at 10.3 m with a vacuum above, beside a 0–11 m staff and a
// person (1.6 m) for the scale; the mercury barometer stays at the foot, tiny. (3) Compare: 13.6 pieces of 76 cm stack
// up beside the water's column (mercury is 13.6 times as dense: 76 cm × 13.6 ≈ 10.3 m). (4) The book's straw: the
// tube becomes a 10.5 m straw of cold drink; the drink stops at 10.3 m and the top 0.2 m stays empty. Then "watch
// again", and a four-question test. Built on the shared kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { boldArrow, dimensionLine } from './arrows.js';
import { HG, LIQUID, SURFACE_Y, WATER, barometerMaterials, createBarometer } from './barometer.js';
import { STAFF, backdropTexture, createSetting, createStack, createStaff } from './setting.js';
import { createPerson } from './person.js';
import {
  H_HG,
  H_WATER,
  LONG_STRAW,
  PERSON_H,
  RATIO,
  STEPS,
  STRAW,
  peopleTall,
  round,
  segments,
  stepIndex,
  strawChoices,
  strawGap,
  toCm,
  waterChoices,
} from './reading.js';

export const DEFAULTS = {
  step: 1,
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { air: '#1c7ed6', airText: '#1864ab', h: '#e8590c', hText: '#c2410c', ink: '#1d2733' };
const XM = -0.64; // the mercury barometer (its tube's x)
const XW = 0; // the water barometer
const PERSON_X = -1.32;
const DIM_HG = XM + 0.09; // the 76 cm line, right of the mercury tube
const DIM_W = XW - 0.3; // the 10.3 m line (and the stack), left of the water tube
const AIR_HG = XM - 0.115; // the air arrows: on the mercury dish left of its tube, on the water dish right of its tube
const AIR_W = XW + 0.24;
const TOP_W = WATER.length - 0.028; // the water tube's closed top above the surface (11 m)
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 52, bottom: 14, side: 10 };
const DOWN = new THREE.Vector3(0, -1, 0);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const DIR = V(0.42, 0.2, 1).normalize(); // a gentle three-quarter view from the front right, a little above
/** Seconds each step's animation takes. */
const DUR = { water: 7, compare: 5.5, straw: 3.4, again: 1.4 };
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};

/** The boxes the camera frames: [x0, y0, x1, y1, z]. */
const BOX = {
  mercury: [XM - 0.42, -0.03, XM + 0.3, 1.13, 0.17],
  side: [PERSON_X - 0.3, -0.05, STAFF.x + 0.45, 2.3, 0.4],
  full: [PERSON_X - 0.25, -0.05, STAFF.x + 0.5, TOP_W + 0.35, 0.4],
  low: [XM - 0.45, -0.05, XW + 0.45, 2.5, 0.4],
  top: [XW - 0.5, 9.35, STAFF.x + 0.5, TOP_W + 0.15, 0.3],
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'wb');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, { lines: { action: 1, outcome: 2, rule: 3 } }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the step counter above the button, the two columns under it, a small note at the end
  const counter = document.createElement('div');
  counter.className = 'wb-step';
  $('.pvc-act-row').before(counter);
  const reading = document.createElement('div');
  reading.className = 'wb-read';
  $('.pvc-act-row').after(reading);
  const note = document.createElement('p');
  note.className = 'wb-note';
  $('.pvc-rule').after(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.05, far: 400, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = Math.PI * 0.52;

  if (o.bg !== 'transparent') scene.background = backdropTexture();
  scene.add(new THREE.HemisphereLight('#e6ecff', '#6b4a32', 1.0));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#d4defa', 0.6);
  fill.position.set(-4, 3, 6);
  scene.add(fill);
  sun.position.set(4, 12, 7);
  sun.target.position.set(-0.4, 2, 0);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.01;
    sun.shadow.radius = 3;
  }
  Object.assign(sun.shadow.camera, { left: -3.2, right: 3.2, top: 3.2, bottom: -3.2, near: 2, far: 24 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.updateMatrixWorld();

  const setting = createSetting();
  scene.add(setting.root);
  const mats = barometerMaterials();
  const hg = createBarometer(mats, HG, { liquid: mats.mercury, kind: 'mercury', name: 'Mercury', x: XM, glassOpacity: 0.16, edges: 0.3 });
  const water = createBarometer(mats, WATER, { liquid: mats.water, kind: 'water', name: 'Water', x: XW, glassOpacity: 0.12, edges: 0.4 });
  hg.setLevel(H_HG);
  const person = createPerson();
  person.root.position.set(PERSON_X, 0, 0.05);
  person.root.rotation.y = Math.atan2(DIR.x, DIR.z) * 0.8;
  for (const m of person.root.children) m.castShadow = true;
  const staff = createStaff(N);
  const stack = createStack(DIM_W, { width: 0.11 });
  const block = createStack(DIM_HG, { width: 0.05, total: 1 }); // one piece of 76 cm beside the mercury
  scene.add(hg.root, water.root, person.root, staff.root, stack.root, block.root);
  hg.column.castShadow = true;

  // the arrows and the heights
  const airHg = boldArrow('AirOnMercury', COLORS.air, 0.012);
  const airW = boldArrow('AirOnWater', COLORS.air, 0.012);
  const dimHg = dimensionLine('MercuryColumn', COLORS.h, 0.004, { dashed: true, ticks: 0.05 });
  const dimW = dimensionLine('WaterColumn', COLORS.h, 0.004, { dashed: true, ticks: 0.05 });
  const dimGap = dimensionLine('StrawGap', COLORS.h, 0.004, { ticks: 0.05 });
  scene.add(airHg.root, airW.root, dimHg.root, dimW.root, dimGap.root);

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
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    step: 0, // 0 mercury, 1 water, 2 compare, 3 straw
    k: 1, // how far the current step's animation has got (1: at rest)
    found: 0, // the furthest step reached
    show: { labels: true, vacuum: true, water: true }, // the test hides some until the answer
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  /** The water's column now (m above the surface). */
  function waterLevel() {
    if (s.step === 0) return 0;
    if (s.step === 1) return H_WATER * waterRise(s.k);
    return H_WATER;
  }
  const waterRise = (k) => ease.inOutCubic(clamp01((k - 0.2) / 0.8));
  /** How far the camera has gone from the mercury toward the whole view, in the water step. */
  const pullBack = (k) => smooth(k / 0.2);
  /** How much of the 13.6 pieces of 76 cm show, in the compare step (after a look at the first one). */
  const stackRise = (k) => ease.inOutCubic(clamp01((k - 0.3) / 0.7));

  // ── the scene from the state ────────────────────────────────────────────────
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  const drinkColor = new THREE.Color();
  const waterColor = new THREE.Color(LIQUID.water);
  const colaColor = new THREE.Color(LIQUID.drink);
  const waterGlow = mats.water.emissive.clone();
  const colaGlow = new THREE.Color('#3a1806');
  function syncScene() {
    const pp = perPixel();
    const st = s.step;
    const k = s.k;
    // the water barometer, the person and the staff appear in the water step
    const shown = st === 0 ? 0 : st === 1 ? smooth(k / 0.15) : 1;
    water.setShown(shown);
    person.root.visible = shown > 0.3;
    staff.root.visible = shown > 0.1;
    const lvl = s.show.water ? waterLevel() : 0;
    water.setLevel(lvl);
    // the straw: the tube shortens to 10.5 m and the water becomes a cold drink
    const sk = st === 3 ? smooth((k - 0.45) / 0.55) : 0;
    water.setTop(TOP_W + (STRAW - TOP_W) * sk);
    drinkColor.copy(waterColor).lerp(colaColor, sk);
    mats.water.color.copy(drinkColor);
    mats.water.emissive.copy(waterGlow).lerp(colaGlow, sk);
    mats.water.opacity = 0.9 + 0.06 * sk;
    // the compare step's stacks
    const ck = st === 2 ? stackRise(k) : st === 3 ? 1 - smooth(k / 0.3) : 0;
    stack.setShown(ck);
    block.setShown((st === 2 && k >= 0.22) || (st === 3 && ck > 0) ? 1 : 0);
    // the arrows: equal (the same air's pressure), a steady size on the screen
    const len = Math.min(1.3, Math.max(0.24, 50 * pp));
    const thick = Math.min(4, Math.max(1, (2 * pp) / 0.012));
    airHg.set(V(AIR_HG, SURFACE_Y + len + 0.004, 0.03), DOWN, len);
    airHg.scale(thick);
    airW.set(V(AIR_W, SURFACE_Y + len + 0.004, 0.06), DOWN, len);
    airW.scale(thick);
    if (shown < 0.5) airW.hide();
    // the heights
    const dk = Math.min(8, Math.max(1, (1.4 * pp) / 0.004));
    for (const d of [dimHg, dimW, dimGap]) {
      d.hide();
      d.root.scale.set(dk, 1, dk);
    }
    if (ck <= 0 && s.show.labels) dimHg.set(DIM_HG, SURFACE_Y, SURFACE_Y + H_HG, 0.03);
    if ((st === 1 && k >= 1) || (st === 3 && k < 0.3)) if (s.show.labels) dimW.set(DIM_W, SURFACE_Y, SURFACE_Y + H_WATER, 0.05);
    if (st === 3 && sk >= 1) dimGap.set(DIM_W, SURFACE_Y + H_WATER, SURFACE_Y + STRAW, 0.05);
    for (const d of [dimHg, dimW, dimGap]) d.root.scale.set(dk, 1, dk);
    // the staff's numbers: turned to the camera, a steady size on the screen; tenths only close up
    const nh = 13 * pp;
    const crowded = 1 / pp < 26; // under 26 px a metre: every other number
    staff.numbers.forEach((m, i) => {
      m.quaternion.copy(camera.quaternion);
      m.scale.setScalar(nh);
      m.visible = !crowded || i % 2 === 0 || i === STAFF.top;
    });
    staff.tenths.visible = pp < 0.012;
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const NEXT = ['act_water', 'act_compare', 'act_straw', 'act_again'];
  function plan() {
    if (s.busy) return { label: NEXT[s.step], step: s.step < 3 ? s.step + 1 : '' };
    return { label: NEXT[s.step], step: s.step < 3 && s.found <= s.step ? s.step + 1 : '' };
  }
  const vars = () => ({
    h: N(H_WATER),
    hHg: N(toCm(H_HG)),
    k: N(RATIO),
    L: N(STRAW),
    gap: N(strawGap()),
    n: N(peopleTall()),
  });
  function refresh() {
    const v = vars();
    const st = s.step;
    counter.textContent = t('step_of', { i: N(st + 1), n: N(STEPS.length) });
    if (st === 0) sheet.outcome(t('out_mercury', { h: N(toCm(H_HG)) }));
    else if (st === 1) sheet.outcome(s.k < 1 ? t('out_rising') : t('out_water', v));
    else if (st === 2) sheet.outcome(t('out_compare', v));
    else sheet.outcome(t('out_straw', v));
    if (st === 0) sheet.rule(t('rule_mercury', { h: N(toCm(H_HG)) }));
    else if (st === 1) sheet.rule(s.k < 1 ? '' : t('rule_water', v));
    else if (st === 2) sheet.rule(t('rule_compare', v));
    else sheet.rule(t('rule_straw', v));
    note.textContent = st === 0 ? '' : t('note_thick');
    const lvl = waterLevel();
    const w = st === 0 ? '—' : `${N(round(lvl, 1))}&nbsp;${t('u_m')}`;
    const html = t('read_cols', { hg: `${N(toCm(H_HG))}&nbsp;${t('u_cm')}`, w });
    if (reading.innerHTML !== html) reading.innerHTML = html;
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label, enabled: true });
      if (p.step !== '' && !s.busy && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
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
  function arrowBox(a) {
    if (!a.visible) return null;
    toScreen(a.root.position, A0);
    toScreen(a.tip, A1);
    return { left: Math.min(A0.x, A1.x) - 8, top: Math.min(A0.y, A1.y) - 8, right: Math.max(A0.x, A1.x) + 8, bottom: Math.max(A0.y, A1.y) + 8 };
  }
  /** The columns themselves: labels never sit on the mercury or the water. */
  function columnBoxes() {
    const out = [];
    const add = (x, y0, y1, r) => {
      toScreen(V(x, y0, 0), A0);
      toScreen(V(x, y1, 0), A1);
      const w = Math.max(5, Math.abs(toScreen(V(x + r, y0, 0), { x: 0, y: 0 }).x - A0.x));
      out.push({ left: Math.min(A0.x, A1.x) - w, right: Math.max(A0.x, A1.x) + w, top: Math.min(A0.y, A1.y), bottom: Math.max(A0.y, A1.y) });
    };
    add(XM, SURFACE_Y, SURFACE_Y + HG.length, HG.ro);
    if (s.step > 0) add(XW, SURFACE_Y, SURFACE_Y + TOP_W, WATER.ro);
    if (person.root.visible) add(PERSON_X, 0, PERSON_H, 0.22);
    return out;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => arrowBox(airHg), () => arrowBox(airW), columnBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(16, 0), spot(16, -18), spot(16, 18), spot(22, -34)];
  const LEFT_OF = [spot(-16, 0), spot(-16, -18), spot(-16, 18), spot(-22, -34)];
  const ABOVE = [spot(0, -20), spot(18, -22), spot(-18, -22), spot(0, -38)];
  const labelState = new Map();
  function wantLabels() {
    const want = new Map();
    if (!s.show.labels) return want;
    const st = s.step;
    const at = (st === 1 || st === 2) && s.k < 1 ? 'moving' : 'rest';
    const hgTop = SURFACE_Y + H_HG;
    const hgVac = (hgTop + SURFACE_Y + HG.length - 0.03) / 2;
    if (st === 0) {
      want.set('hg', { text: t('lbl_hg'), point: () => V(XM - HG.ro, SURFACE_Y + 0.42, 0), spots: LEFT_OF, color: COLORS.ink });
      want.set('hgVac', { text: t('lbl_vacuum'), point: () => V(XM - HG.ro, hgVac, 0), spots: [...LEFT_OF, ...RIGHT_OF], color: COLORS.ink });
      want.set('hgH', {
        text: t('lbl_cm', { h: N(toCm(H_HG)) }),
        point: () => V(DIM_HG, SURFACE_Y + 0.5, 0.03),
        spots: RIGHT_OF,
        color: COLORS.hText,
      });
      want.set('airHg', { text: t('lbl_air'), point: () => V(AIR_HG, SURFACE_Y + airLen() * 0.7, 0.03), spots: LEFT_OF, color: COLORS.airText });
      return want;
    }
    if (st === 3 && s.k >= 0.6) {
      const top = SURFACE_Y + STRAW;
      want.set('straw', {
        text: t('lbl_straw', { h: N(STRAW) }),
        point: () => V(XW, top + 0.05, 0),
        spots: [...ABOVE, ...LEFT_OF],
        color: COLORS.ink,
      });
      want.set('gap', { text: t('lbl_gap', { h: N(strawGap()) }), point: () => V(DIM_W, top - 0.1, 0.05), spots: LEFT_OF, color: COLORS.hText });
      want.set('drink', {
        text: t('lbl_drink', { h: N(H_WATER) }),
        point: () => V(XW - WATER.ro, SURFACE_Y + H_WATER - 0.55, 0),
        spots: [spot(-30, 18), spot(-30, 34), ...LEFT_OF],
        color: COLORS.ink,
      });
      return want;
    }
    if (st === 3) return want;
    // the whole view (water, compare): the mercury in one label, the water's
    want.set('hg', {
      text: t('lbl_hg_h', { h: N(toCm(H_HG)) }),
      point: () => V(XM - HG.ro, SURFACE_Y + 0.5, 0),
      spots: [...LEFT_OF, ...ABOVE],
      color: COLORS.ink,
    });
    if (at === 'rest') {
      const FAR_LEFT = [spot(-34, 0), spot(-34, 16), spot(-34, -16), spot(-50, 0)];
      want.set('w', { text: t('lbl_water'), point: () => V(XW - WATER.ro, SURFACE_Y + 7.6, 0), spots: FAR_LEFT, color: COLORS.ink });
      if (s.show.vacuum)
        want.set('wVac', {
          text: t('lbl_vacuum'),
          point: () => V(XW - WATER.ro, SURFACE_Y + (H_WATER + TOP_W) / 2, 0),
          spots: FAR_LEFT,
          color: COLORS.ink,
        });
      want.set('air', {
        text: t('lbl_air'),
        point: () => V(AIR_W + 0.04, SURFACE_Y + airLen() * 0.8, 0.06),
        spots: [spot(16, -10), ...RIGHT_OF],
        color: COLORS.airText,
      });
      want.set('person', {
        text: t('lbl_person', { h: N(PERSON_H) }),
        point: () => V(PERSON_X - 0.12, 1.45, 0),
        spots: LEFT_OF,
        color: COLORS.ink,
        optional: true,
      });
      if (st === 1)
        want.set('wH', { text: t('lbl_m', { h: N(H_WATER) }), point: () => V(DIM_W, SURFACE_Y + 4.2, 0.05), spots: LEFT_OF, color: COLORS.hText });
      if (st === 2 && s.k >= 0.85)
        want.set('stack', {
          text: t('lbl_stack', { k: N(segments()), h: N(toCm(H_HG)) }),
          point: () => V(DIM_W - 0.06, SURFACE_Y + 4.2, 0),
          spots: LEFT_OF,
          color: COLORS.hText,
        });
    }
    return want;
  }
  const airLen = () => Math.min(1.3, Math.max(0.24, 50 * perPixel()));
  function syncLabels() {
    const want = wantLabels();
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, optional: w.optional });
        labelState.set(id, w.text);
      } else if (labelState.get(id) !== w.text) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, w.text);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const bbox = new THREE.Box3();
  const lerpBox = (a, b, f) => a.map((x, i) => x + (b[i] - x) * f);
  function lookBox() {
    const st = s.step;
    const k = s.k;
    if (st === 0) return BOX.mercury;
    if (st === 1) {
      if (k < 0.2) return lerpBox(BOX.mercury, BOX.side, pullBack(k));
      const f = waterRise(k);
      return lerpBox(BOX.side, BOX.full, f);
    }
    if (st === 2) {
      if (k < 0.2) return lerpBox(BOX.full, BOX.low, smooth(k / 0.2));
      return lerpBox(BOX.low, BOX.full, stackRise(k));
    }
    return lerpBox(BOX.full, BOX.top, smooth(k / 0.45));
  }
  function viewPose() {
    const [x0, y0, x1, y1, z] = lookBox();
    bbox.min.set(x0, y0, -z);
    bbox.max.set(x1, y1, z);
    return fitPose({ box: bbox, dir: DIR, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function place(pose) {
    camera.position.copy(pose.position);
    controls.target.copy(pose.target);
    controls.update();
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      place({ position, target: aim });
      syncScene();
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
        syncScene();
      },
    }).finished;
  }
  function homeView(animate = true) {
    s.userMovedCamera = false;
    syncUI();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    syncUI();
  });
  controls.addEventListener('change', () => syncScene());
  stage.onResize(() => {
    if (!s.userMovedCamera) place(viewPose());
    syncScene();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  const wait = (sec, key = 'wait') => tweener.animate({ key, duration: sec, onUpdate: () => {} }).finished;
  function stopAll() {
    s.run++;
    for (const k of ['step', 'camera']) tweener.cancel(k);
    s.busy = false;
    s.k = 1;
  }
  /** A step at rest, at once. */
  function jumpTo(step) {
    stopAll();
    s.step = step;
    s.k = 1;
    s.found = Math.max(s.found, step);
    syncScene();
    if (!s.userMovedCamera) place(viewPose());
    syncScene();
    refresh();
    emitChange();
  }
  /** Plays a step's animation from where the step before it rests. */
  async function playStep(step, token) {
    s.step = step;
    s.k = 0;
    s.busy = true;
    s.userMovedCamera = s.userMovedCamera && step !== 1 ? s.userMovedCamera : false;
    syncUI();
    syncScene();
    refresh();
    emitChange();
    if (step === 1) audio.pop?.();
    const ok = await tweener.animate({
      key: 'step',
      duration: DUR[STEPS[step]],
      onUpdate: (k) => {
        s.k = k;
        if (!s.userMovedCamera) place(viewPose());
        syncScene();
        refresh();
      },
    }).finished;
    if (!ok || token !== s.run) return;
    s.k = 1;
    s.busy = false;
    s.found = Math.max(s.found, step);
    audio.success();
    syncScene();
    refresh();
    emitChange();
  }
  async function again(token) {
    s.step = 0;
    s.k = 1;
    s.busy = true;
    s.userMovedCamera = false;
    syncUI();
    syncScene();
    refresh();
    emitChange();
    const ok = await flyTo(viewPose(), DUR.again);
    if (!ok || token !== s.run) return;
    s.busy = false;
    refresh();
    emitChange();
  }

  // ── the action: the big button, the badge on the part ───────────────────────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const token = ++s.run;
    if (s.step === 3) return again(token);
    return playStep(s.step + 1, token);
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_water',
    target: () => {
      if (s.step === 0) return V(XM + 0.32, 0.5, 0);
      if (s.step === 1) return V(XW, SURFACE_Y + 5, 0);
      if (s.step === 2) return V(XW, SURFACE_Y + 9.5, 0);
      return null;
    },
    radius: 26,
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
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
  function snapshot() {
    return {
      step: STEPS[s.step],
      stepNumber: s.step + 1,
      water: round(waterLevel(), 2), // the water's column (m)
      mercury: toCm(H_HG), // the mercury's column (cm)
      ratio: RATIO,
      busy: s.busy,
      found: s.found + 1,
      next: plan().label.replace('act_', ''),
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.found, snap.mode]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
    emit('step', { step: snap.step, stepNumber: snap.stepNumber });
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="wb-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const mText = (v) => (v < 1 ? `${N(toCm(v))}&nbsp;${t('u_cm')}` : `${N(v)}&nbsp;${t('u_m')}`);
  const words = (keys) => keys.map((key) => ({ key }));
  /** The four questions: how high the water stands, why so high, what is above it, the long straw. */
  const KINDS = ['water', 'why', 'vac', 'straw'];
  /** Sets up a scene for the test: a step at rest, some labels hidden. */
  function scene_(step, show) {
    stopAll();
    s.step = step;
    s.k = 1;
    s.show = { labels: true, vacuum: true, water: true, ...show };
    s.userMovedCamera = false;
    syncUI();
    syncScene();
    refresh();
  }

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
        learnSaved = { step: s.step, found: s.found };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        stopAll();
        s.show = { labels: true, vacuum: true, water: true };
        s.step = learnSaved?.step ?? 0;
        s.found = learnSaved?.found ?? s.found;
        s.userMovedCamera = false;
        syncUI();
        syncScene();
        place(viewPose());
        syncScene();
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        if (kind === 'water' || kind === 'straw') scene_(0, {});
        else scene_(1, { vacuum: kind !== 'vac' });
        await flyTo(viewPose(), 0.7);
        if (!alive()) return null;
        question = { kind };
        if (kind === 'water') return { text: t('q_water'), ...choicesOf(waterChoices(), kind, (x) => mText(x.v)) };
        if (kind === 'why')
          return { text: t('q_why'), ...choicesOf(words(['c_why_right', 'c_why_wide', 'c_why_more', 'c_why_pull']), kind, (x) => t(x.key)) };
        if (kind === 'vac')
          return { text: t('q_vac'), ...choicesOf(words(['c_vac_right', 'c_vac_pull', 'c_vac_air', 'c_vac_press']), kind, (x) => t(x.key)) };
        return { text: t('q_straw', { L: N(LONG_STRAW) }), ...choicesOf(strawChoices(), kind, (x) => mText(x.v)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const v = vars();
        const noteOf = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], v)}` : '');
        // the answer shown on the picture
        if (k === 'water') scene_(1, {});
        else if (k === 'straw') scene_(3, {});
        else scene_(1, {});
        flyTo(viewPose(), 0.7);
        if (k === 'water') return t('why_water', v) + noteOf({ same: 'mis_water_same', divide: 'mis_water_divide', tenth: 'mis_water_tenth' });
        if (k === 'why') return t('why_why', v) + noteOf({ c_why_wide: 'mis_why_wide', c_why_more: 'mis_why_more', c_why_pull: 'mis_why_pull' });
        if (k === 'vac') return t('why_vac') + noteOf({ c_vac_pull: 'mis_why_pull', c_vac_air: 'mis_vac_air', c_vac_press: 'mis_vac_press' });
        return t('why_straw', v) + noteOf({ whole: 'mis_straw_whole', mercury: 'mis_straw_mercury', tenth: 'mis_straw_tenth' });
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
    if (front) front.hidden = !s.userMovedCamera;
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    root.dataset.step = STEPS[s.step];
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  function goHome() {
    s.userMovedCamera = false;
    jumpTo(0);
    syncUI();
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view === 'front') homeView();
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'q-next') quiz.next();
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
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (((k === ' ' || k === 'Enter') && !onButton) || k === 'ArrowRight') doAction();
    else if (k === 'ArrowLeft') {
      if (!s.busy && s.step > 0) jumpTo(s.step - 1);
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  s.step = stepIndex(o.step);
  s.found = s.step;
  syncUI();
  syncScene();
  place(viewPose());
  syncScene();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
  })();

  /** Waits for whatever the student (or set) started to finish. */
  async function settle() {
    for (let i = 0; i < 600 && s.busy; i++) await wait(0.05, 'settle');
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
     * step: 1–4 or 'mercury' | 'water' | 'compare' | 'straw'. With animate (the default) the next step plays from the
     * one before it; any other step, or animate: false, lands at once.
     */
    async set(p = {}) {
      if (p.step != null) {
        const to = stepIndex(p.step);
        const animate = p.animate !== false;
        if (s.mode === 'quiz') quiz.stop();
        if (animate && to === s.step + 1 && !s.busy) {
          lastAct = Number.NEGATIVE_INFINITY;
          doAction();
          await settle();
        } else {
          s.userMovedCamera = false;
          jumpTo(to);
          syncUI();
        }
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = 0;
      s.show = { labels: true, vacuum: true, water: true };
      goHome();
      s.found = 0;
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The two barometers as they stand, the staff and the person, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'WaterBarometer';
      for (const part of [hg.root, water.root, person.root, staff.root]) if (part.visible) g.add(part.clone(true));
      return g;
    },
  };
}
