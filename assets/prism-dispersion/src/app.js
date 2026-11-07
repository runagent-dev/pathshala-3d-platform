// The prism (book page 254, topic 9.3.2, চিত্র ৯.১২), student view. A 60° glass prism lies on its base on a small prism
// table, apex up as the book draws it; a ray box on an arc rail shines on its first face, a red filter in front of its lens;
// a white screen stands beyond. Five steps, one tap each, slow: ① red light goes in and bends toward the normal (লম্ব);
// ② it comes out and bends away from the normal; ③ the original direction (আলোর মূল দিক) beside the refracted direction
// (প্রতিসরিত আলোর দিক): turned toward the base (ভূমি), and the student may turn the lamp (it always is); ④ the red filter
// comes off: white light opens into its colours on the screen, violet bent most, red least; ⑤ the refractive index for
// each colour, on the graph in the panel. A calm card on the first screen, one lead-in line, the result and the rule per
// step, the kit's how-to row, five test questions on the picture.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS } from '@shared/student/icons.js';
import { createMaterials } from '@shared/student/materials.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { backdrop, createApparatus, createTable } from './apparatus.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { C, createLight } from './light.js';
import {
  ARC_R,
  COLOURS,
  clampI,
  cssColour,
  drawnIndex,
  ENTRY,
  FACES,
  FAN_NM,
  I_RANGE,
  I_START,
  indexAt,
  lampAt,
  PRISM,
  RED_NM,
  round0,
  round3,
  SCREEN,
  SPREAD,
  trace,
  turnCorner,
} from './reading.js';

export const DEFAULTS = {
  step: 'intro',
  i: I_START,
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

export const STEPS = ['enter', 'exit', 'base', 'white', 'colours'];
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 14, side: 10 };
// how long things take (s): slow enough to follow
const T = {
  on: 0.5,
  ray: 1.0,
  normal: 0.6,
  arcs: 0.6,
  out: 1.2,
  fade: 0.6,
  orig: 1.2,
  dev: 0.8,
  filter: 1.6,
  white: 0.35,
  fanIn: 1.0,
  fanOut: 1.6,
  patch: 0.5,
  pick: 0.8,
  jump: 1.0,
  fly: 1.6,
};
const ZERO = {
  on: 0,
  inRay: 0,
  n1: 0,
  inside: 0,
  arcs1: 0,
  n2: 0,
  outRay: 0,
  arcs2: 0,
  orig: 0,
  dev: 0,
  filter: 0,
  white: 0,
  fanIn: 0,
  fanOut: 0,
  patch: 0,
  pick: 0,
};
/** Where each step ends. */
const TARGET = {
  intro: { ...ZERO },
  enter: { ...ZERO, on: 1, inRay: 1, n1: 1, inside: 1, arcs1: 1 },
  exit: { ...ZERO, on: 1, inRay: 1, n1: 1, inside: 1, arcs1: 1, n2: 1, outRay: 1, arcs2: 1 },
  base: { ...ZERO, on: 1, inRay: 1, inside: 1, outRay: 1, orig: 1, dev: 1 },
  white: { ...ZERO, on: 1, inRay: 1, filter: 1, white: 1, fanIn: 1, fanOut: 1, patch: 1 },
  colours: { ...ZERO, on: 1, inRay: 1, filter: 1, white: 1, fanIn: 1, fanOut: 1, patch: 1, pick: 1 },
};
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'pd');
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
  // the line before the action, the result and the rule share one place with the calm first card, which takes exactly
  // their room (measured with them shown), so the panel and the 3D keep one height from the first screen on
  const lead = document.createElement('p');
  lead.className = 'pd-lead';
  const card = document.createElement('p');
  card.className = 'pd-card pvc-note';
  card.innerHTML = `<span class="pd-long">${t('intro')}</span><span class="pd-short">${t('intro_short')}</span>`;
  const stack = document.createElement('div');
  stack.className = 'pd-stack';
  const outcomeEl = /** @type {HTMLElement} */ ($('.pvc-outcome'));
  const ruleEl = /** @type {HTMLElement} */ ($('.pvc-rule'));
  outcomeEl.before(stack);
  stack.append(card, lead, outcomeEl, ruleEl);
  // the graph, under the rule: it takes the panel's free height
  const graphBox = document.createElement('div');
  graphBox.className = 'pd-graph';
  ui.learn.append(graphBox);
  function fitCard() {
    const calm = ui.learn.classList.contains('pd-calm');
    if (calm) ui.learn.classList.remove('pd-calm');
    const gap = Number.parseFloat(getComputedStyle(stack).rowGap) || 0;
    const shown = [lead, outcomeEl, ruleEl].filter((el) => el.offsetParent !== null);
    const h = shown.reduce((a, el) => a + el.offsetHeight, 0) + gap * Math.max(0, shown.length - 1);
    if (calm) ui.learn.classList.add('pd-calm');
    if (h > 0) card.style.minHeight = `${h}px`;
    const panel = root.querySelector('.pvc-panel');
    if (panel) root.classList.toggle('pd-side', panel.getBoundingClientRect().left > root.getBoundingClientRect().left + 20);
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => fitCard()).observe(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // the note in a corner: what is drawn bigger than life
  const note = document.createElement('div');
  note.className = 'pd-note';
  note.hidden = true;
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 1, far: 600, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.1);
  sun.position.set(-14, 40, 30);
  sun.target.position.set(1, 6, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55);
  fill.position.set(30, 18, 26);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 14, bottom: -14, near: 20, far: 80 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const mats = createMaterials(stage.renderer);
  const table = createTable();
  const app = createApparatus(mats);
  const light = createLight();
  app.screen.add(light.patch, light.spot);
  scene.add(table.root, app.root, light.root);

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
    i: clampI(o.i),
    colour: 'violet',
    v: { ...TARGET.intro },
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    drag: null,
    quiz: null, // { kind, marks: [...] } while a test question needs its own marks
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the light from the state ────────────────────────────────────────────────
  const col = {
    red: new THREE.Color(C.red),
    redGlow: new THREE.Color(C.redGlow),
    white: new THREE.Color(C.white),
    orig: new THREE.Color(C.orig),
    inc: new THREE.Color(C.incidence),
    ref: new THREE.Color(C.refraction),
    turn: new THREE.Color(C.turn),
    trial: new THREE.Color('#ffd43b'),
    mark: new THREE.Color('#1d2733'),
    pick: new THREE.Color(),
  };
  const colourOf = Object.fromEntries(COLOURS.map((c) => [c.id, new THREE.Color(cssColour(c.nm))]));
  /** The geometry now: the red light's trace, the fan's (white light), the labels' points. */
  const geo = {
    red: trace(s.i, indexAt(RED_NM)),
    fan: FAN_NM.map((nm) => trace(s.i, drawnIndex(nm))),
    colours: Object.fromEntries(COLOURS.map((c) => [c.id, trace(s.i, drawnIndex(c.nm))])),
    i: Number.NaN,
  };
  const exits = FAN_NM.map(() => ({ x: 0, y: 0 }));
  const ends = FAN_NM.map(() => ({ x: 0, y: 0 }));
  function retrace() {
    if (geo.i === s.i) return;
    geo.i = s.i;
    geo.red = trace(s.i, indexAt(RED_NM));
    geo.fan = FAN_NM.map((nm) => trace(s.i, drawnIndex(nm)));
    for (const c of COLOURS) geo.colours[c.id] = trace(s.i, drawnIndex(c.nm));
    geo.fan.forEach((tr, k) => {
      exits[k].x = tr.exit.x;
      exits[k].y = tr.exit.y;
      ends[k].x = tr.hit.x;
      ends[k].y = tr.hit.y;
    });
  }
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  const angleOf = (d) => Math.atan2(d.y, d.x);
  const lerp = (a, b, k) => a + (b - a) * k;
  /** The start of the drawn beam: just past the red filter. */
  const beamStart = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };
  const P2 = { x: 0, y: 0 };
  const turnAt = { x: 0, y: 0 };
  let turnI = Number.NaN;
  const rows = FAN_NM.map(() => ({ y: 0, r: 0, g: 0, b: 0, a: 1 }));
  const spotRow = [{ y: 0, r: 1, g: 0.2, b: 0.2, a: 1 }];
  const redHue = new THREE.Color(C.red);
  let lampI = Number.NaN;

  function syncScene() {
    retrace();
    const v = s.v;
    const tr = geo.red;
    if (lampI !== s.i) {
      // only when the lamp turns: its pose and where its beam starts (just past the red filter)
      lampI = s.i;
      app.setLamp(s.i);
      const ls = lampAt(s.i, ARC_R - 1.75);
      beamStart.x = ls.x;
      beamStart.y = ls.y;
    }
    const head = 12 * perPixel(); // an arrowhead about 12 px long
    const whiteOn = v.white >= 0.5;

    // the lamp glows; the red filter slides up and away
    app.lensMat.emissive.set(whiteOn ? '#fff6e0' : '#ff3030');
    app.lensMat.emissiveIntensity = v.on * (whiteOn ? 1.6 : 1.3);
    app.filter.position.set(0.85, 3.6 * smooth(0, 0.7, v.filter), 0);
    app.filter.visible = v.filter < 0.999;
    app.filterMat.opacity = 0.82 * (1 - smooth(0.6, 1, v.filter));

    light.beam.begin();
    light.headsBegin();
    // ① lamp → entry (red, then white)
    const inColour = whiteOn ? col.white : col.red;
    if (v.inRay > 0) {
      P1.x = lerp(beamStart.x, tr.entry.x, v.inRay);
      P1.y = lerp(beamStart.y, tr.entry.y, v.inRay);
      light.beam.add(beamStart.x, beamStart.y, P1.x, P1.y, inColour);
      if (v.inRay > 0.6) light.head(lerp(beamStart.x, tr.entry.x, 0.55), lerp(beamStart.y, tr.entry.y, 0.55), tr.din.x, tr.din.y, head, inColour);
    }
    if (!whiteOn) {
      // ② inside, ③ out to the screen: one colour
      if (v.inside > 0) {
        P2.x = lerp(tr.entry.x, tr.exit.x, v.inside);
        P2.y = lerp(tr.entry.y, tr.exit.y, v.inside);
        light.beam.add(tr.entry.x, tr.entry.y, P2.x, P2.y, col.red);
        if (v.inside > 0.75) light.head(lerp(tr.entry.x, tr.exit.x, 0.5), lerp(tr.entry.y, tr.exit.y, 0.5), tr.inside.x, tr.inside.y, head, col.red);
      }
      if (v.outRay > 0 && s.quiz?.kind !== 'path') {
        P2.x = lerp(tr.exit.x, tr.hit.x, v.outRay);
        P2.y = lerp(tr.exit.y, tr.hit.y, v.outRay);
        light.beam.add(tr.exit.x, tr.exit.y, P2.x, P2.y, col.red);
        if (v.outRay > 0.6) light.head(lerp(tr.exit.x, tr.hit.x, 0.42), lerp(tr.exit.y, tr.hit.y, 0.42), tr.out.x, tr.out.y, head, col.red);
      }
    } else {
      // the edges of the fan (violet and red) and, in the last step, the colour picked
      // in the test's question on the screen, nothing past the entry point shows until the answer
      const hideOut = s.quiz?.kind === 'red' && !s.quiz.shown;
      const kIn = hideOut ? 0 : v.fanIn;
      const kOut = hideOut ? 0 : v.fanOut;
      const dim = 1 - 0.45 * v.pick;
      for (const id of ['violet', 'red']) {
        const c = geo.colours[id];
        const cc = colourOf[id];
        if (kIn > 0) light.beam.add(c.entry.x, c.entry.y, lerp(c.entry.x, c.exit.x, kIn), lerp(c.entry.y, c.exit.y, kIn), cc);
        if (kOut > 0) light.beam.add(c.exit.x, c.exit.y, lerp(c.exit.x, c.hit.x, kOut), lerp(c.exit.y, c.hit.y, kOut), cc);
        if (kOut > 0.6 && v.pick < 0.5) light.head(lerp(c.exit.x, c.hit.x, 0.45), lerp(c.exit.y, c.hit.y, 0.45), c.out.x, c.out.y, head, cc);
      }
      if (v.pick > 0.5 && s.colour !== 'violet' && s.colour !== 'red') {
        const c = geo.colours[s.colour];
        const cc = colourOf[s.colour];
        light.beam.add(c.entry.x, c.entry.y, c.exit.x, c.exit.y, cc);
        light.beam.add(c.exit.x, c.exit.y, c.hit.x, c.hit.y, cc);
      }
      if (v.pick > 0.5) {
        const c = geo.colours[s.colour];
        light.head(lerp(c.exit.x, c.hit.x, 0.45), lerp(c.exit.y, c.hit.y, 0.45), c.out.x, c.out.y, head * 1.15, colourOf[s.colour]);
      }
      light.setFan(tr.entry, exits, ends, kIn, kOut, dim * (s.quiz?.kind === 'red' && !s.quiz.shown ? 0 : 1));
    }
    if (!whiteOn) light.setFan(tr.entry, exits, ends, 0, 0, 0);
    light.beam.end();

    // the patch on the screen: the red spot, or the spectrum
    const spotA = whiteOn ? 0 : smooth(0.92, 1, v.outRay) * (s.quiz?.kind === 'path' ? 0 : 1);
    spotRow[0].y = tr.hit.y;
    spotRow[0].r = redHue.r;
    spotRow[0].g = redHue.g;
    spotRow[0].b = redHue.b;
    light.setPatch(light.spot, spotRow, 0.22, spotA);
    geo.fan.forEach((f, k) => {
      const c = light.fanColours[k];
      rows[k].y = f.hit.y;
      rows[k].r = c[0];
      rows[k].g = c[1];
      rows[k].b = c[2];
      rows[k].a = c[3];
    });
    const patchA = whiteOn ? v.patch * (s.quiz?.kind === 'red' && !s.quiz.shown ? 0 : 1) : 0;
    light.setPatch(light.patch, rows, 0.25, patchA);

    // the normals at each face (they grow from the face out both ways)
    light.normal.begin();
    const normalAt = (p, f, k) => {
      if (k <= 0) return;
      light.normal.dashed(p.x, p.y, p.x + f.nx * 3.4 * k, p.y + f.ny * 3.4 * k, col.white);
      light.normal.dashed(p.x, p.y, p.x - f.nx * 2.2 * k, p.y - f.ny * 2.2 * k, col.white);
    };
    normalAt(tr.entry, FACES.first, v.n1);
    if (tr.exit) normalAt(tr.exit, FACES.second, v.n2);
    light.normal.end();

    // the angles: i and r at the first face, r and e at the second (sweeping in), the turn (amber)
    light.arcs.begin();
    const f1 = FACES.first;
    const f2 = FACES.second;
    if (v.arcs1 > 0) {
      const aN = Math.atan2(f1.ny, f1.nx);
      const aI = Math.atan2(-tr.din.y, -tr.din.x);
      light.arcs.arc(tr.entry.x, tr.entry.y, 2.3, aN, lerp(aN, aN + wrap(aI - aN), v.arcs1), col.inc, 16);
      const aNi = Math.atan2(-f1.ny, -f1.nx);
      const aR = angleOf(tr.inside);
      light.arcs.arc(tr.entry.x, tr.entry.y, 2.0, aNi, lerp(aNi, aNi + wrap(aR - aNi), v.arcs1), col.ref, 14);
    }
    if (v.arcs2 > 0 && tr.ok) {
      const aNi = Math.atan2(-f2.ny, -f2.nx);
      const aR = Math.atan2(-tr.inside.y, -tr.inside.x);
      light.arcs.arc(tr.exit.x, tr.exit.y, 2.0, aNi, lerp(aNi, aNi + wrap(aR - aNi), v.arcs2), col.inc, 14); // at the second face the angle in the glass is the one of incidence (blue)
      const aN = Math.atan2(f2.ny, f2.nx);
      const aE = angleOf(tr.out);
      light.arcs.arc(tr.exit.x, tr.exit.y, 2.3, aN, lerp(aN, aN + wrap(aE - aN), v.arcs2), col.ref, 16); // and the one in the air is the one of refraction (green)
    }
    if (v.dev > 0 && tr.ok) {
      if (turnI !== s.i) {
        turnI = s.i;
        const c = turnCorner(tr);
        turnAt.x = c.x;
        turnAt.y = c.y;
      }
      const c = turnAt;
      const a0 = angleOf(tr.din);
      const a1 = angleOf(tr.out);
      light.arcs.arc(c.x, c.y, DEV_R, a0, lerp(a0, a0 + wrap(a1 - a0), v.dev), col.turn, 26);
    }
    light.arcs.end();

    // the original direction: the incoming ray, straight on (thin, grey, dashed), with its arrowhead
    light.orig.begin();
    if (v.orig > 0) {
      const L = origLen(tr) * v.orig;
      light.orig.dashed(tr.entry.x, tr.entry.y, tr.entry.x + tr.din.x * L, tr.entry.y + tr.din.y * L, col.orig, 0.5, 0.32);
      if (v.orig > 0.9) light.head(tr.entry.x + tr.din.x * L, tr.entry.y + tr.din.y * L, tr.din.x, tr.din.y, head * 0.9, col.orig);
    }
    light.orig.end();

    // the test's trial paths and marks
    light.trial.begin();
    if (s.quiz?.marks) {
      for (const m of s.quiz.marks) {
        if (m.kind === 'path' && !m.hidden)
          light.trial.dashed(m.from.x, m.from.y, m.from.x + m.d.x * m.len, m.from.y + m.d.y * m.len, col.trial, 0.45, 0.3);
      }
    }
    light.trial.end();
    light.marks.begin();
    if (s.quiz?.marks)
      for (const m of s.quiz.marks) {
        if (m.kind !== 'mark') continue;
        // a bar across the light's width on the card, a hair in front of it
        const w = light.patchHalf + 0.15;
        const cx = SCREEN.at.x + CARD_N.x * 0.06;
        const cz = CARD_N.z * 0.06;
        light.marks.add3(cx - CARD_T.x * w, m.at.y, cz - CARD_T.z * w, cx + CARD_T.x * w, m.at.y, cz + CARD_T.z * w, col.mark);
      }
    light.marks.end();
    light.headsEnd();
  }
  // the screen's face: its normal toward the prism, and its level direction across it (in the plane of the card)
  const CARD_N = { x: -Math.cos(THREE.MathUtils.degToRad(SCREEN.yaw)), z: Math.sin(THREE.MathUtils.degToRad(SCREEN.yaw)) };
  const CARD_T = { x: CARD_N.z, z: -CARD_N.x };
  const wrap = (d) => {
    let x = d;
    while (x > Math.PI) x -= 2 * Math.PI;
    while (x < -Math.PI) x += 2 * Math.PI;
    return x;
  };
  const DEV_R = 6.2;
  const ORIG_LEN = 15.5;
  /** The original direction is drawn up to 17 cm above the table at most, so its end stays in the view. */
  const origLen = (r) => Math.min(ORIG_LEN, (17 - r.entry.y) / Math.max(0.05, r.din.y));

  // ── labels on the picture: short ─────────────────────────────────────────────
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  let handle = null;
  // the light and the marks, as small boxes along each segment, so no label sits on a ray
  const rayBoxList = [];
  const pv = new THREE.Vector3();
  function rayBoxes() {
    let k = 0;
    const put = (x, y) => {
      pv.set(x, y, 0).project(camera);
      if (pv.z > 1) return;
      const sx = (pv.x * 0.5 + 0.5) * stage.width;
      const sy = (-pv.y * 0.5 + 0.5) * stage.height;
      if (!rayBoxList[k]) rayBoxList[k] = { left: 0, top: 0, right: 0, bottom: 0 };
      const b = rayBoxList[k];
      b.left = sx - 6;
      b.right = sx + 6;
      b.top = sy - 6;
      b.bottom = sy + 6;
      k++;
    };
    for (const set of [light.beam, light.orig, light.normal]) {
      const a = set.array;
      const steps = set === light.beam ? 14 : 2;
      for (let j = 0; j < set.count; j++) {
        const o = j * 6;
        for (let q = 0; q <= steps; q++) put(lerp(a[o], a[o + 3], q / steps), lerp(a[o + 1], a[o + 4], q / steps));
      }
    }
    rayBoxList.length = k;
    return rayBoxList;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      rayBoxes,
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotateEl),
      () => handle?.box(),
      () => boxOf($('.pvc-panel-toggle')),
    ],
  });
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const spot = (dx, dy) => ({ dx, dy });
  const AROUND = [spot(0, -22), spot(22, -16), spot(-22, -16), spot(24, 0), spot(-24, 0), spot(0, 22), spot(22, 18), spot(-22, 18)];
  const UPLEFT = [spot(-20, -18), spot(-26, 0), spot(0, -22), spot(-20, 18), ...AROUND];
  const UPRIGHT = [spot(20, -18), spot(26, 0), spot(0, -22), spot(20, 18), ...AROUND];
  const RIGHT = [spot(18, 0), spot(18, -16), spot(18, 16), ...AROUND];
  const BELOW = [spot(0, 20), spot(18, 18), spot(-18, 18), ...AROUND];
  const ABOVE = [spot(0, -20), spot(18, -18), spot(-18, -18), ...AROUND];
  const NEAR = [spot(0, 0), spot(0, -9), spot(0, 9), spot(-10, 0), spot(10, 0), spot(-10, -9), spot(10, 9), spot(10, -9), spot(-10, 9), ...AROUND];
  const onCard = (y, x = 0) => {
    const v = new THREE.Vector3(x, y, 0.05);
    return app.screen.localToWorld(v);
  };
  const tr = () => geo.red;
  const mid = (a, b, r, at) => {
    // a point at radius r on the bisector of the directions a and b from `at`
    const x = a.x + b.x;
    const y = a.y + b.y;
    const l = Math.hypot(x, y) || 1;
    return V(at.x + (x / l) * r, at.y + (y / l) * r, 0);
  };
  const neg = (d) => ({ x: -d.x, y: -d.y });
  const nrm = (f, sgn = 1) => ({ x: f.nx * sgn, y: f.ny * sgn });
  const explore = () => s.mode === 'explore';
  const LABELS = {
    lamp: {
      kind: 'tag',
      text: () => t('lbl_lamp'),
      point: () => app.lamp.localToWorld(V(-3.1, 1.4, 0)),
      spots: ABOVE,
      show: () => explore() && s.step === 'intro',
    },
    filter: {
      kind: 'tag',
      text: () => t('lbl_filter'),
      point: () => app.lamp.localToWorld(V(0.85, -0.9, 1.1)),
      spots: BELOW,
      show: () => explore() && (s.step === 'intro' || s.step === 'enter') && s.v.filter < 0.3 && !s.busy,
    },
    prism: {
      kind: 'tag',
      text: () => t('lbl_prism'),
      point: () => V(0.9, PRISM.apex.y - 1.4, PRISM.length / 2),
      spots: UPRIGHT,
      show: () => explore() && s.step === 'intro',
    },
    screen: {
      kind: 'tag',
      text: () => t('lbl_screen'),
      point: () => onCard(SCREEN.top - 0.6),
      spots: ABOVE,
      show: () => explore() && s.step === 'intro',
    },
    normal1: {
      kind: 'num',
      cls: 'pd-normal',
      text: () => t('lbl_normal'),
      point: () => V(tr().entry.x + FACES.first.nx * 3.6, tr().entry.y + FACES.first.ny * 3.6, 0),
      spots: UPLEFT,
      show: () => s.v.n1 > 0.8 && !s.busy,
    },
    normal2: {
      kind: 'num',
      cls: 'pd-normal',
      text: () => t('lbl_normal'),
      point: () => V(tr().exit.x + FACES.second.nx * 3.6, tr().exit.y + FACES.second.ny * 3.6, 0),
      spots: UPRIGHT,
      show: () => s.v.n2 > 0.8 && !s.busy && tr().ok,
    },
    i1: {
      kind: 'num',
      cls: 'pd-inc',
      text: () => t('lbl_deg', { a: round0(tr().i1) }),
      point: () => mid(neg(tr().din), nrm(FACES.first), 3.6, tr().entry),
      spots: NEAR,
      show: () => s.step === 'enter' && s.v.arcs1 > 0.9 && !s.busy,
    },
    r1: {
      kind: 'num',
      cls: 'pd-ref',
      text: () => t('lbl_deg', { a: round0(tr().r1) }),
      point: () => mid(tr().inside, nrm(FACES.first, -1), 2.9, tr().entry),
      spots: NEAR,
      show: () => s.step === 'enter' && s.v.arcs1 > 0.9 && !s.busy,
    },
    r2: {
      kind: 'num',
      cls: 'pd-inc',
      text: () => t('lbl_deg', { a: round0(tr().r2) }),
      point: () => mid(neg(tr().inside), nrm(FACES.second, -1), 2.9, tr().exit),
      spots: NEAR,
      show: () => s.v.arcs2 > 0.9 && !s.busy && tr().ok,
    },
    e: {
      kind: 'num',
      cls: 'pd-ref',
      text: () => t('lbl_deg', { a: round0(tr().e) }),
      point: () => mid(tr().out, nrm(FACES.second), 3.6, tr().exit),
      spots: NEAR,
      show: () => s.v.arcs2 > 0.9 && !s.busy && tr().ok,
    },
    orig: {
      kind: 'num',
      cls: 'pd-orig',
      text: () => t('lbl_orig'),
      point: () => V(tr().entry.x + tr().din.x * origLen(tr()) * 0.82, tr().entry.y + tr().din.y * origLen(tr()) * 0.82, 0),
      spots: [spot(0, -18), spot(-10, -20), spot(14, -16), ...ABOVE],
      show: () => explore() && s.v.orig > 0.9 && !s.busy,
    },
    out: {
      kind: 'num',
      cls: 'pd-out',
      text: () => t('lbl_out'),
      point: () => V(lerp(tr().exit.x, tr().hit.x, 0.55), lerp(tr().exit.y, tr().hit.y, 0.55), 0),
      spots: [spot(0, 22), spot(12, 26), spot(-12, 28), spot(0, 36), spot(20, 34), spot(-24, 36), ...BELOW],
      show: () => explore() && s.step === 'base' && !s.busy,
    },
    base: {
      kind: 'tag',
      text: () => t('lbl_base'),
      point: () => V(0, PRISM.baseY + 0.05, PRISM.length / 2),
      spots: [spot(-34, 18), spot(-26, 26), spot(-48, 8), spot(0, 26), ...BELOW],
      show: () => explore() && s.step === 'base' && !s.busy,
    },
    dev: {
      kind: 'num',
      cls: 'pd-turn',
      text: () => t('lbl_deg', { a: round0(tr().delta) }),
      point: () => {
        const r = tr();
        const a = (angleOf(r.din) + angleOf(r.out)) / 2;
        const c = turnCorner(r);
        return V(c.x + Math.cos(a) * (DEV_R + 1.1), c.y + Math.sin(a) * (DEV_R + 1.1), 0);
      },
      spots: NEAR,
      show: () => s.v.dev > 0.95 && !s.busy && tr().ok,
    },
    white: {
      kind: 'tag',
      cls: 'pd-white',
      text: () => t('lbl_white'),
      point: () => V(lerp(beamStart.x, tr().entry.x, 0.55), lerp(beamStart.y, tr().entry.y, 0.55), 0),
      // well above the rising beam, on a leader: next to it there is the prism
      spots: [spot(10, -48), spot(0, -44), spot(30, -52), spot(-10, -46), spot(0, 30)],
      optional: true,
      show: () => explore() && s.v.white > 0.5 && s.v.fanIn > 0.5 && !s.busy,
    },
    violet: {
      kind: 'num',
      cls: 'pd-violet',
      text: () => t('c_violet'),
      point: () => onCard(geo.colours.violet.hit.y),
      spots: [spot(40, 10), spot(40, 22), spot(30, 26), spot(0, 30), spot(-34, 30), spot(-60, 22), ...BELOW],
      show: () => explore() && s.v.patch > 0.9 && !s.busy,
    },
    red: {
      kind: 'num',
      cls: 'pd-red',
      text: () => t('c_red'),
      point: () => onCard(geo.colours.red.hit.y),
      spots: [spot(40, -10), spot(40, -22), spot(30, -26), spot(0, -30), spot(-34, -30), spot(-60, -24), ...ABOVE],
      show: () => explore() && s.v.patch > 0.9 && !s.busy,
    },
    pick: {
      kind: 'num',
      cls: 'pd-pick',
      text: () => t(`c_${s.colour}`),
      point: () => onCard(geo.colours[s.colour].hit.y),
      spots: [spot(44, 0), spot(44, -14), spot(44, 14), spot(-50, -30), spot(-50, 30), ...RIGHT],
      optional: true, // the result line names the colour too
      show: () => explore() && s.v.pick > 0.9 && !s.busy && s.colour !== 'violet' && s.colour !== 'red',
    },
  };
  const placed = new Map();
  /** The test's letters on the picture. */
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      const text = L.text();
      if (want && !anno.has(id)) {
        anno.add(id, { text, point: L.point, kind: L.kind, spots: L.spots, optional: Boolean(L.optional) });
        placed.set(id, text);
        const el = ui.annoLayer.querySelector(`.pvc-anno:last-of-type`);
        if (el && L.cls) el.classList.add(L.cls);
      } else if (want && placed.get(id) !== text) {
        anno.setText(id, text);
        placed.set(id, text);
      } else if (!want && anno.has(id)) anno.remove(id);
    }
    // the test's letters
    const marks = s.quiz?.marks ?? [];
    for (let k = 0; k < 4; k++) {
      const id = `q${k}`;
      const m = marks[k] && !marks[k].hidden ? marks[k] : null;
      if (m && !anno.has(id)) {
        anno.add(id, { text: m.letter, point: m.point, kind: m.kind === 'mark' ? 'mark' : 'num', spots: m.spots });
        ui.annoLayer.querySelector('.pvc-anno:last-of-type')?.classList.add('pd-letter');
      } else if (!m && anno.has(id)) anno.remove(id);
    }
  }

  // ── camera: a gentle three-quarter view from the left front ─────────────────
  // wide frames show the whole bench; a tall (phone upright) frame shows the working part: from the lamp's lens to the
  // screen's face, so the prism is big (the lamp's back and the screen's far edge may leave the view)
  const BOXES = {
    wide: {
      all: new THREE.Box3(V(-15.4, 0.6, -3), V(18.6, 15.6, 3)),
      near: new THREE.Box3(V(-16.6, 3.2, -2.6), V(8.6, 16.2, 2.6)),
      right: new THREE.Box3(V(-7, 2.5, -2), V(18, 17, 2)),
      screen: new THREE.Box3(V(-5.5, 2.4, -2.2), V(18.6, 15, 2.2)),
      marks: new THREE.Box3(V(-4, 2.4, -2.2), V(21.5, 15, 2.2)), // room right of the card for the test's letters
    },
    tall: {
      all: new THREE.Box3(V(-14.6, 3.0, -1.5), V(16.6, 15.4, 1.5)),
      near: new THREE.Box3(V(-14.4, 4.5, -1.5), V(6.5, 15.8, 1.5)),
      right: new THREE.Box3(V(-5, 3.5, -1.5), V(16.4, 16.5, 1.5)),
      screen: new THREE.Box3(V(-4, 3, -1.5), V(17.2, 14.8, 1.5)),
      marks: new THREE.Box3(V(-3, 3, -1.5), V(21.5, 14.8, 1.5)),
    },
  };
  const DIR = V(-0.34, 0.26, 1).normalize();
  const poses = { all: null, near: null, right: null, screen: null, marks: null };
  function fitPoses() {
    const d = DIR.clone();
    const boxes = stage.width / Math.max(1, stage.height) < 1.2 ? BOXES.tall : BOXES.wide;
    for (const k of Object.keys(boxes)) {
      const p = fitPose({ box: boxes[k], dir: d, camera, width: stage.width, height: stage.height, margin: MARGIN });
      poses[k] = { target: p.target, position: p.position };
    }
  }
  // the white light and its colours are seen closer, so the spectrum on the screen is big
  const frameOf = (step) => s.quiz?.frame ?? (step === 'enter' ? 'near' : step === 'white' || step === 'colours' ? 'screen' : 'all');
  const cam = { from: null, to: 'all', k: 1 };
  const guided = { position: V(0, 0, 0), target: V(0, 0, 0) };
  function applyCamera() {
    if (s.userMovedCamera) return;
    const g = poses[cam.to];
    if (cam.k < 1 && cam.from) {
      const k = ease.inOutCubic(cam.k);
      guided.position.lerpVectors(cam.from.position, g.position, k);
      guided.target.lerpVectors(cam.from.target, g.target, k);
    } else {
      guided.position.copy(g.position);
      guided.target.copy(g.target);
    }
    camera.position.copy(guided.position);
    controls.target.copy(guided.target);
    controls.update();
  }
  /** The guided camera flies to a frame (from wherever the student left it). */
  function flyTo(frame, duration = T.fly) {
    const was = s.userMovedCamera;
    if (was) {
      s.userMovedCamera = false;
      rotate.home();
    }
    if (s.view !== 'front') {
      s.view = 'front';
      syncUI();
      emit('view', { view: s.view });
    }
    if (!was && cam.to === frame && cam.k >= 1) return Promise.resolve(true);
    cam.from = { position: camera.position.clone(), target: controls.target.clone() };
    cam.to = frame;
    cam.k = 0;
    if (!duration) {
      cam.k = 1;
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        cam.k = k;
        stage.invalidate();
      },
      onComplete: () => {
        cam.k = 1;
      },
    }).finished;
  }
  function beginOrbit() {
    if (s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    cam.k = 1;
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
    zoom: [0.45, 2.0],
    when: () => s.mode !== 'quiz',
    onTurn: beginOrbit,
  });
  rotateEl = rotate.el;
  function setView(view, { animate = true } = {}) {
    if (view === '3d') {
      // a turned view to start with: the guided pose seen from further round
      s.view = '3d';
      s.userMovedCamera = true;
      tweener.cancel('camera');
      const g = poses[cam.to];
      const off = g.position
        .clone()
        .sub(g.target)
        .applyAxisAngle(V(0, 1, 0), THREE.MathUtils.degToRad(-35));
      camera.position.copy(g.target).add(off);
      controls.target.copy(g.target);
      controls.update();
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p = flyTo(frameOf(s.step), animate ? T.fly : 0);
    emitChange();
    return p;
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    // from behind the screen, the card fades so it does not hide the prism
    const behind = (camera.position.x - SCREEN.at.x) * CARD_N.x + (camera.position.z - SCREEN.at.z) * CARD_N.z < 0;
    app.cardMat.opacity = behind ? 0.3 : 1;
    app.card.castShadow = !behind;
    syncScene();
  });
  stage.onResize(() => {
    fitPoses();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  function tweenTo(to, duration, my) {
    const from = { ...s.v };
    return tweener
      .animate({
        key: 'step',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const key of Object.keys(to)) s.v[key] = from[key] + (to[key] - from[key]) * k;
          syncLabels();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  /** The plan from one step to the next: a list of [values, seconds], one after the other. */
  function planFor(from, to) {
    if (from === 'intro' && to === 'enter')
      return [
        [{ on: 1 }, T.on],
        [{ inRay: 1 }, T.ray],
        [{ n1: 1 }, T.normal],
        [{ inside: 1 }, T.ray],
        [{ arcs1: 1 }, T.arcs],
      ];
    if (from === 'enter' && to === 'exit')
      return [
        [{ n2: 1 }, T.normal],
        [{ outRay: 1 }, T.out],
        [{ arcs2: 1 }, T.arcs],
      ];
    if (from === 'exit' && to === 'base')
      return [
        [{ arcs1: 0, arcs2: 0, n1: 0, n2: 0 }, T.fade],
        [{ orig: 1 }, T.orig],
        [{ dev: 1 }, T.dev],
      ];
    if (from === 'base' && to === 'white')
      return [
        [{ dev: 0, orig: 0 }, T.fade],
        [{ filter: 1 }, T.filter],
        () => flyTo('screen'), // the red filter came off in view of the lamp; now closer to the screen
        [{ white: 1, inside: 0, outRay: 0 }, T.white],
        [{ fanIn: 1 }, T.fanIn],
        [{ fanOut: 1 }, T.fanOut],
        [{ patch: 1 }, T.patch],
      ];
    if (from === 'white' && to === 'colours') return [[{ pick: 1 }, T.pick]];
    // a jump (a step word, back, several at once): the light switches at once, the rest moves together
    const goal = TARGET[to];
    const plan = [];
    const lightChanges = goal.white >= 0.5 !== s.v.white >= 0.5;
    if (lightChanges) plan.push([{ ...ZERO, on: s.v.on, filter: s.v.filter }, T.fade]);
    if (goal.filter !== s.v.filter) plan.push([{ filter: goal.filter }, T.filter * 0.7]);
    plan.push([{ ...goal }, T.jump]);
    return plan;
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
    const my = s.run;
    s.step = step;
    hintOff();
    // from the base step the red filter comes off in view of the lamp first; the plan flies closer after it
    const later = animate && from === 'base' && step === 'white';
    flyTo(later ? 'all' : frameOf(step), animate ? T.fly : 0);
    if (!animate || from === step) {
      Object.assign(s.v, TARGET[step]);
      s.busy = false;
      done();
      return;
    }
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    for (const item of planFor(from, step)) {
      if (typeof item === 'function') {
        if (my !== s.run) return;
        item();
        continue;
      }
      const [to, sec] = item;
      if (!(await tweenTo(to, sec, my))) return;
    }
    s.busy = false;
    audio.success?.();
    done();
  }
  function done() {
    syncLabels();
    refresh();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_on', 1, ICONS.hand],
    enter: ['act_exit', 2, ICONS.hand],
    exit: ['act_base', 3, ICONS.hand],
    base: ['act_white', 4, ICONS.hand],
    white: ['act_colours', 5, ICONS.hand],
    colours: ['act_quiz', '', ICONS.chevR],
  };
  const NEXT = { intro: 'enter', enter: 'exit', exit: 'base', base: 'white', white: 'colours' };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const graph = createGraph(graphBox, t, { onPick: (id) => pickColour(id, true) });
  const steady = { lead: '', act: '', note: '' };
  function outcomeText() {
    const r = geo.red;
    if (s.step === 'enter') return t('out_enter', { i: round0(r.i1), r: round0(r.r1) });
    if (s.step === 'exit') return t('out_exit', { r2: round0(r.r2), e: round0(r.e) });
    if (s.step === 'base') return t('out_base', { d: round0(r.delta) });
    if (s.step === 'white') return t('out_white');
    if (s.step === 'colours') {
      const c = COLOURS.find((k) => k.id === s.colour);
      const which = s.colour === 'violet' ? 'violet' : s.colour === 'red' ? 'red' : 'mid';
      return t(`out_colour_${which}`, { c: t(`c_${s.colour}`), n: round3(indexAt(c.nm)).toFixed(3) });
    }
    return '';
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    retrace();
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm ? '' : s.busy ? steady.lead : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml || '&nbsp;';
    }
    if (ui.learn.classList.contains('pd-calm') !== calm) {
      ui.learn.classList.toggle('pd-calm', calm);
      fitCard();
    }
    sheet.outcome(calm || s.busy ? '' : outcomeText());
    sheet.rule(calm || s.busy ? '' : t(`rule_${s.step}`));
    sheet.choose(calm ? null : s.step);
    sheet.next(NEXT[s.step] ?? null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      if (step !== '' && enabled && s.mode === 'explore' && o.coach && s.step === 'intro') action.show('scene');
      else action.hide('scene');
    }
    homeBtn.hidden = s.step === 'intro';
    homeBtn.disabled = false; // a step may be cut short: home stops it
    graph.set({ full: s.v.white >= 0.5 && (s.step === 'white' || s.step === 'colours'), pick: s.step === 'colours' && !s.busy ? s.colour : null });
    const noteText = s.v.white >= 0.5 ? t('note_spread', { k: SPREAD }) : s.v.on > 0 ? t('note_drawn') : '';
    if (steady.note !== noteText) {
      steady.note = noteText;
      note.textContent = noteText;
      note.hidden = !noteText;
    }
    syncLabels();
    stage.invalidate();
  }
  function pickColour(id, focus = false) {
    if (!COLOURS.some((c) => c.id === id) || s.mode === 'quiz') return;
    if (s.step !== 'colours') {
      go('colours').then(() => {
        s.colour = id;
        refresh();
      });
      s.colour = id;
      return;
    }
    if (s.busy) return;
    s.colour = id;
    audio.tick?.();
    refresh();
    if (focus) graph.set({ focus: true });
    emitChange();
  }

  // ── the action: the big button, the ring on the part, a tap on the part ──────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const next = NEXT[s.step];
    if (next) return go(next);
    return quiz.start();
  }
  const targetOf = () => {
    if (s.step === 'intro') return app.lampBody;
    if (s.step === 'enter' || s.step === 'exit') return app.prismMesh;
    if (s.step === 'base') return app.filter;
    if (s.step === 'white') return app.card;
    return null;
  };
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_on',
    icon: ICONS.hand,
    target: targetOf,
    pad: 8,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes(), () => boxOf(rotateEl)],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── turning the lamp: a handle on it, a drag on it, or the arrow keys ───────
  const canDrag = () => !s.locked && !s.busy && s.mode === 'explore' && s.step !== 'intro';
  const closeUp = () => s.step === 'white' || s.step === 'colours';
  const handleAt = V(0, 0, 0);
  const trackPt = (i) => {
    const p = lampAt(i, ARC_R + 1.3);
    const d = { x: ENTRY.x - p.x, y: ENTRY.y - p.y };
    const l = Math.hypot(d.x, d.y);
    return V(p.x - (d.y / l) * 1.9, p.y + (d.x / l) * 1.9, 0);
  };
  handle = createDragHandle(stage, {
    point: () => handleAt.copy(trackPt(s.i)),
    axis: 'turn',
    track: { from: trackPt(I_RANGE[0]), to: trackPt(I_RANGE[1]), via: trackPt((I_RANGE[0] + I_RANGE[1]) / 2) },
    label: t('drag_me'),
    labelAt: 'below',
    aria: t('aria_drag_lamp'),
    pulse: Boolean(o.coach),
    // not in the white-light steps: the view is closer to the screen there and the lamp is out of it
    when: () => canDrag() && !closeUp(),
  });
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(V(0, 0, 1), 0);
  const hitP = V(0, 0, 0);
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function rayAt(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  /** The angle of incidence the pointer asks for: the lamp points from where the finger is to the entry point. */
  function iAt(p) {
    rayAt(p);
    if (!raycaster.ray.intersectPlane(plane, hitP)) return null;
    const dx = ENTRY.x - hitP.x;
    const dy = ENTRY.y - hitP.y;
    if (Math.hypot(dx, dy) < 2) return null;
    return THREE.MathUtils.radToDeg(Math.atan2(dy, dx)) + 30;
  }
  function pickPart(p) {
    rayAt(p);
    const hits = raycaster.intersectObjects([app.hit.lamp, app.hit.prism, app.hit.filter, app.hit.screen], false);
    return hits.length ? hits[0].object : null;
  }
  function setI(i) {
    const was = s.i;
    s.i = clampI(Math.round(i * 2) / 2);
    if (s.i === was) return;
    if (Math.round(s.i) !== Math.round(was)) audio.tick?.();
    refresh();
    emitChange();
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = hostXY(e);
      const onHandle = handle.hit(p.x, p.y);
      const part = onHandle ? app.hit.lamp : pickPart(p);
      if (!part) return;
      if (part === app.hit.lamp && canDrag()) {
        const i0 = iAt(p);
        controls.enabled = false;
        capturePointer(ui.canvasHost, e.pointerId);
        s.drag = { id: e.pointerId, x: p.x, y: p.y, off: i0 == null ? 0 : s.i - i0, moved: false };
        handle.markUsed();
        action.hide('drag');
        emit('dragstart', { part: 'lamp' });
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      // a tap on the part the action names does the action
      const target = targetOf();
      const isTarget =
        (part === app.hit.lamp && target === app.lampBody) ||
        (part === app.hit.prism && target === app.prismMesh) ||
        (part === app.hit.filter && target === app.filter) ||
        (part === app.hit.screen && target === app.card);
      if (isTarget && s.mode === 'explore') {
        e.stopPropagation();
        e.preventDefault();
        doAction();
      }
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (g && e.pointerId === g.id) {
      const p = hostXY(e);
      if (!g.moved && Math.hypot(p.x - g.x, p.y - g.y) < 4) return;
      g.moved = true;
      const i = iAt(p);
      if (i != null) setI(i + g.off);
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const p = hostXY(e);
    requestAnimationFrame(() => {
      const part = pickPart(p);
      ui.canvasHost.style.cursor = part === app.hit.lamp && canDrag() ? 'grab' : part ? 'pointer' : '';
    });
  });
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked;
    action.show('drag');
    emit('dragend', { part: 'lamp', i: s.i });
    // a tap on the lamp (no drag) at the first step switches it on
    if (!g.moved && s.step === 'intro') doAction();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── how to use, in the panel ────────────────────────────────────────────────
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'drag', axis: 'turn', text: t('howto_lamp'), aria: t('aria_howto_lamp'), handle, when: () => s.step !== 'intro' && !closeUp() },
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
    retrace();
    const r = geo.red;
    const white = s.v.white >= 0.5;
    return {
      step: s.step,
      i: s.i,
      light: s.v.on < 0.5 ? 'off' : white ? 'white' : 'red',
      r1: round0(r.r1),
      r2: round0(r.r2),
      e: round0(r.e),
      deviation: round0(r.delta),
      toward: r.delta > 0 ? 'base' : 'apex',
      colour: s.step === 'colours' ? s.colour : null,
      n: s.step === 'colours' ? round3(indexAt(COLOURS.find((c) => c.id === s.colour).nm)) : round3(indexAt(RED_NM)),
      order: white ? COLOURS.map((c) => c.id).sort((a, b) => geo.colours[a].hit.y - geo.colours[b].hit.y) : null,
      busy: s.busy,
      next: { intro: 'on', enter: 'exit', exit: 'base', base: 'white', white: 'colours', colours: 'quiz' }[s.step],
      view: s.view,
      mode: s.mode,
      question: s.quiz ? { kind: s.quiz.kind, right: s.quiz.right, index: s.quiz.index } : null,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.i, snap.colour]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let k = list.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [list[k], list[j]] = [list[j], list[k]];
    }
    return list;
  };
  const LETTERS = [...t('letters')];
  /** Four answers in words: the first is right; the rest are real mistakes, each with its own note. */
  function wordChoices(kind, keys, notes) {
    const list = shuffle([...keys]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(keys[0]),
      tolerance: 0.5,
      label: (j) => `<span class="pd-opt">${t(list[j])}</span>`,
      meta: { kind, answer: keys[0] },
      notes,
    };
  }
  /** Four lettered marks on the picture: the first candidate is right. The letters go to the candidates at random. */
  function letterChoices(kind, candidates) {
    const order = shuffle(candidates.map((_, k) => k));
    const marks = candidates.map((c, k) => ({ ...c, letter: LETTERS[order.indexOf(k)] }));
    marks.sort((a, b) => LETTERS.indexOf(a.letter) - LETTERS.indexOf(b.letter));
    const right = marks.findIndex((m) => m.right);
    return {
      marks,
      choices: [0, 1, 2, 3],
      expected: right,
      tolerance: 0.5,
      label: (j) => `<span class="pd-opt pd-opt-letter">${LETTERS[j]}</span>`,
      meta: { kind, answer: LETTERS[right] },
    };
  }
  let learnSaved = null;
  let learnI = I_START;
  let picked = -1;
  let current = null;
  const KINDS = ['path', 'orig', 'red', 'cause', 'define'];
  const rot = (d, a) => ({ x: d.x * Math.cos(a) - d.y * Math.sin(a), y: d.x * Math.sin(a) + d.y * Math.cos(a) });

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
        learnSaved = s.step;
        learnI = s.i;
        s.mode = 'quiz';
        s.locked = true;
        s.drag = null;
        controls.enabled = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        s.i = learnI;
        syncUI();
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        // the two questions on the picture's right part are framed closer
        s.quiz = {
          kind,
          frame: kind === 'path' || kind === 'orig' ? 'right' : kind === 'red' ? 'marks' : null,
          marks: null,
          right: null,
          shown: kind !== 'path' && kind !== 'red',
        };
        s.i = I_START;
        retrace();
        const scene = { path: 'exit', orig: 'base', red: 'white', cause: 'white', define: 'intro' }[kind];
        await go(scene, { animate: false });
        if (kind === 'path') Object.assign(s.v, { outRay: 0, arcs2: 0, arcs1: 0 });
        if (kind === 'orig') Object.assign(s.v, { orig: 0, dev: 0 });
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        const r = geo.red;
        /** Lettered dashed lines from a point, the letter just beyond each end, along it. */
        const lines = (from, list, maxLen) =>
          list.map((c) => {
            const len = Math.min(maxLen, (17 - from.y) / Math.max(0.05, c.d.y));
            const end = { x: from.x + c.d.x * len, y: from.y + c.d.y * len };
            const ax = Math.round(c.d.x * 18);
            const ay = Math.round(-c.d.y * 18);
            return {
              ...c,
              kind: 'path',
              from,
              len,
              point: () => V(end.x, end.y, 0),
              spots: [spot(ax, ay), spot(ax + 10, ay), spot(ax, ay - 10), spot(ax, ay + 10)],
            };
          });
        if (kind === 'path' || kind === 'orig') {
          const turnOut = Math.atan2(r.inside.x * r.out.y - r.inside.y * r.out.x, r.inside.x * r.out.x + r.inside.y * r.out.y);
          const cands =
            kind === 'path'
              ? lines(
                  r.exit,
                  [
                    { key: 'right', d: r.out, right: true },
                    { key: 'straight', d: r.inside },
                    { key: 'orig', d: r.din },
                    { key: 'apex', d: rot(r.inside, -2 * turnOut) },
                  ],
                  9.5,
                )
              : // which line is the original direction: the incoming light straight on, from where it meets the prism
                lines(
                  r.entry,
                  [
                    { key: 'right', d: r.din, right: true },
                    { key: 'inside', d: r.inside },
                    { key: 'out', d: r.out },
                    { key: 'up', d: rot(r.din, THREE.MathUtils.degToRad(20)) },
                  ],
                  12,
                );
          const q = letterChoices(kind, cands);
          Object.assign(s.quiz, { marks: q.marks, right: q.meta.answer, index: q.expected, shown: false });
          current = q;
          syncLabels();
          stage.invalidate();
          return { text: t(`q_${kind}`), ...q };
        }
        if (kind === 'red') {
          const ys = {
            right: geo.colours.red.hit.y,
            violet: geo.colours.violet.hit.y,
            green: geo.colours.green.hit.y,
            straight: r.exit.y + (r.inside.y / r.inside.x) * (SCREEN.at.x - r.exit.x),
          };
          // the letters go left and right of the marks in turn, and the two on one side lean apart, so close marks keep
          // their letters apart
          const markSpots = (k) => {
            const side = k % 2 ? 30 : -30;
            const lean = k === 0 ? 9 : k === 2 ? -9 : k === 1 ? 6 : -6;
            return [spot(side, lean), spot(side, lean * 2), spot(side, 0)];
          };
          const byY = Object.values(ys).sort((a, b) => a - b);
          const cands = Object.entries(ys).map(([key, y]) => ({
            key,
            right: key === 'right',
            kind: 'mark',
            at: { x: SCREEN.at.x, y },
            // the leader starts at the end of the mark's bar, on its letter's side
            point: () => onCard(y, (byY.indexOf(y) % 2 ? 1 : -1) * (light.patchHalf + 0.15)),
            spots: markSpots(byY.indexOf(y)),
          }));
          const q = letterChoices(kind, cands);
          Object.assign(s.quiz, { marks: q.marks, right: q.meta.answer, index: q.expected, shown: false });
          current = q;
          syncLabels();
          stage.invalidate();
          return { text: t('q_red'), ...q };
        }
        syncLabels();
        stage.invalidate();
        if (kind === 'cause')
          current = wordChoices(kind, ['c_cause_right', 'c_cause_paint', 'c_cause_screen', 'c_cause_reflect'], {
            c_cause_paint: 'n_cause_paint',
            c_cause_screen: 'n_cause_screen',
            c_cause_reflect: 'n_cause_reflect',
          });
        else
          current = wordChoices(kind, ['c_def_right', 'c_def_slab', 'c_def_lens', 'c_def_mirror'], {
            c_def_slab: 'n_def_slab',
            c_def_lens: 'n_def_lens',
            c_def_mirror: 'n_def_mirror',
          });
        s.quiz.right = current.meta.answer;
        s.quiz.index = current.expected;
        return { text: t(`q_${kind}`), ...current };
      },
      reveal(_q, correct) {
        const k = s.quiz?.kind;
        const q2 = current;
        if (!k || !q2) return '';
        if (k === 'path' || k === 'red' || k === 'orig') {
          // show the real light (or the original direction) now, in place of its lettered line
          s.quiz.shown = true;
          if (k === 'path') s.v.outRay = 1;
          if (k === 'orig') s.v.orig = 1;
          for (const m of s.quiz.marks) if (m.right && k !== 'red') m.hidden = true;
          const wrong = correct || picked < 0 ? null : q2.marks[picked];
          const note = wrong && !wrong.right ? ` ${t(`n_${k}_${wrong.key}`)}` : '';
          syncLabels();
          stage.invalidate();
          return t(`a_${k}`, { x: q2.meta.answer }) + note;
        }
        const wrongKey = correct || picked < 0 ? null : q2.list[picked];
        const note = wrongKey && q2.notes[wrongKey] ? ` ${t(q2.notes[wrongKey])}` : '';
        return t(`a_${k === 'define' ? 'def' : k}`) + note;
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
    s.i = I_START;
    s.colour = 'violet';
    handle.rearm?.();
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
    const dot = tgt.closest('.pd-graph [data-colour]');
    if (dot && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      // from the dot that has the focus
      const k = COLOURS.findIndex((c) => c.id === dot.getAttribute('data-colour'));
      const n = Math.min(COLOURS.length - 1, Math.max(0, k + (e.key === 'ArrowRight' ? 1 : -1)));
      pickColour(COLOURS[n].id, true);
      e.preventDefault();
      return;
    }
    const k = e.key;
    const onButton = Boolean(tgt.closest('button, [role="button"]'));
    const turnKey = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(k);
    const sceneKey = turnKey || ['r', 'R', 'Home'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (turnKey && !tgt.closest('.pvc-examples')) {
      if (!canDrag()) return;
      handle.markUsed();
      setI(s.i + (k === 'ArrowRight' || k === 'ArrowUp' ? 1 : -1));
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  fitCard();
  fitPoses();
  cam.to = 'all';
  syncUI();
  applyCamera();
  if (o.step && o.step !== 'intro' && o.step in TARGET) {
    s.step = o.step;
    Object.assign(s.v, TARGET[o.step]);
    cam.to = frameOf(o.step);
  }
  syncScene();
  syncLabels();
  refresh();
  // the parts of later steps are in the scene from the start: compile their shaders ahead
  stage.warmUp?.({ show: [app.filter, light.fanIn, light.fanOut, light.patch, light.spot] });
  const ready = (async () => {
    if (s.view === '3d') await setView('3d', { animate: false });
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
    /** Change any of: step ('intro' | 'enter' | 'exit' | 'base' | 'white' | 'colours'), i (the angle of incidence, 45…66),
     * colour (in the last step), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.i != null) setI(Number(p.i));
      if (p.colour && COLOURS.some((c) => c.id === p.colour)) s.colour = p.colour;
      if (p.step) await go(p.step, { animate });
      if (p.view) await setView(p.view, { animate });
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.view = 'front';
      s.userMovedCamera = false;
      await goHome();
      await flyTo('all', 0);
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The prism, its table, the lamp on its rail and the screen, in centimetres (exported in metres). */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Prism';
      const copy = app.root.clone(true);
      const plain = new Map();
      copy.traverse((ob) => {
        if (ob.name === 'RedFilter') ob.visible = true;
        if (!ob.isMesh || ob.userData.noExport) return;
        // shared vertices (the merged parts are built unindexed) and plain metals without the brushed textures:
        // the GLB stays small and looks the same in any viewer
        ob.geometry = mergeVertices(ob.geometry.index ? ob.geometry : ob.geometry.toNonIndexed(), 1e-4);
        const m = ob.material;
        if (m?.map || m?.roughnessMap || m?.bumpMap) {
          if (!plain.has(m))
            plain.set(m, new THREE.MeshStandardMaterial({ name: m.name, color: m.color, metalness: m.metalness, roughness: m.roughness }));
          ob.material = plain.get(m);
        }
      });
      g.add(copy);
      return g;
    },
  };
}
