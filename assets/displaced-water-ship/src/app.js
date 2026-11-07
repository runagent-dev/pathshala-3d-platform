// Displaced water with a model ship (অপসারিত পানি: জাহাজের মডেল): book page 137, topic 5.3.1, student view. On a
// plain table in a calm blue setting: a glass tank filled to the lip of its spout, a beaker under the spout on a
// digital kitchen scale, and a toy cargo ship hanging by four cords from a digital hanging scale on a lab stand; six
// toy containers (50 g each) in a row in front. Four steps, one tap each, slow:
//   ① ওজন: both scales come on: the ship 200 g, the empty beaker 0 g (W = mg).
//   ② নামাও: the arm slides down; as the hull goes under, the hanging scale reads less and exactly that much water runs
//      out of the spout into the beaker, until the scale reads 0 g and the ship floats with 200 g of water in the beaker
//      (the book's sentence). The arm can then be dragged (or moved with ↑ ↓) both ways: lifting the ship lowers the
//      water in the tank, and the spilled water stays in the beaker (the honest overflow can, reading.js `settle`).
//   ③ প্লবতা: the cords are unhooked; the ship floats on its own: ওজন W down, প্লবতা F up, equal; V = 200 cm³ =
//      0.0002 m³ in the beaker; F = Vρg in numbers.
//   ④ বোঝাই: the student taps any container (or the button): that one flies onto the deck; the ship settles 0.5 cm
//      deeper and exactly 50 g more water runs out; a count "২ / ৬" leads the panel; two bars (ship + cargo, water
//      pushed aside) stay equal; the waterplane A and the draft h are drawn for V = Ah. At six the load line lights up.
// Directions everywhere: the ring circles exactly the next thing to touch (the next container pulses gently), the
// button says what and how many, the test points at the reading each question needs. A calm card on the first screen,
// then per step a lead-in line, the result and the book's words; the kit's how-to row; a four-question test.
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
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import {
  AREA,
  BOX_G,
  CENTRE_X,
  forceChoices,
  G,
  HANG,
  HULL,
  keelAt,
  MAX_BOXES,
  moreChoices,
  RHO_SI,
  readingChoices,
  round,
  SHIP_G,
  settle,
  shipMass,
  startTank,
  TANK,
  weightN,
} from './reading.js';
import { ARM_ABOVE_RING, BEAKER_AT, backdrop, createScene, HSCALE, RING_ABOVE_KEEL, ROD, STACK } from './scene.js';
import { BOX, createContainers, createDimension, createFoam, createShip, createWaterplane, DECK, LOAD_LINE_AT, SLOTS } from './ship.js';

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

export const STEPS = ['weigh', 'lower', 'buoy', 'load'];
const ORDER = ['intro', ...STEPS];
const NEXT = { intro: 'weigh', weigh: 'lower', lower: 'buoy', buoy: 'load' };
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 12, side: 10 };
const MARGIN_TIGHT = { top: 40, bottom: 4, side: 6 };
// how long things take (s): slow enough to follow
const T = { boot: 0.6, hold: 0.5, lower: 5.2, lift: 1.6, arrows: 1.2, fly: 1.7, settle: 1.4, jump: 1.2, cam: 1.6, down: 1.2 };
const LIFT = 16; // cm the hanging scale rises when unhooked (out of the closer view)
const ARROW_PER_N = 1.1; // cm per newton
const COLORS = { mass: '#5f3dc4', water: '#1864ab', W: '#7048e8', F: '#e8590c', h: '#343a40', A: '#087f5b', line: '#9c6f00' };
/** The order the ring offers the containers in: the middle ones first (any one can be tapped). */
const PREFER = [2, 3, 1, 4, 0, 5];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const rad = (d) => (d * Math.PI) / 180;
const dirOf = (az, el) => V3(Math.sin(rad(az)) * Math.cos(rad(el)), Math.sin(rad(el)), Math.cos(rad(az)) * Math.cos(rad(el))).normalize();

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'dw');
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
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the line before the action (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'dw-lead';
  $('.pvc-act-row').before(lead);
  const probe = document.createElement('p');
  probe.className = 'dw-lead dw-probe';
  probe.setAttribute('aria-hidden', 'true');
  probe.textContent = '.';
  ui.learn.appendChild(probe);
  const outcomeEl = /** @type {HTMLElement} */ ($('.pvc-outcome'));
  const ruleEl = /** @type {HTMLElement} */ ($('.pvc-rule'));
  /** The calm card takes the room the steps' lead-in, result and rule take, so nothing moves at the first tap. */
  function fitCalm() {
    if (!ui.learn.classList.contains('dw-calm')) {
      if (lead.style.minHeight) lead.style.minHeight = '';
      return;
    }
    const gap = parseFloat(getComputedStyle(ui.learn).rowGap) || 0;
    const hOf = (el) => el.getBoundingClientRect().height; // fractional: offsetHeight rounds
    const leadH = hOf(probe);
    const h = leadH + hOf(outcomeEl) + hOf(ruleEl) + gap * (leadH > 0 ? 2 : 1);
    const want = `${h}px`; // not rounded: the steps' rows have fractional heights
    if (lead.style.minHeight !== want) lead.style.minHeight = want;
  }
  new ResizeObserver(() => fitCalm()).observe(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 2, far: 900, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.2);
  sun.position.set(22, 70, 40);
  sun.target.position.set(2, 8, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55);
  fill.position.set(-50, 30, 40);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 4;
    Object.assign(sun.shadow.camera, { left: -30, right: 32, top: 26, bottom: -26, near: 30, far: 140 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const parts = createScene(N);
  const { tank, stream, kscale, beaker, stand, hanging } = parts;
  const ship = createShip({ N });
  const foam = createFoam();
  const boxes = createContainers({ label: t('box_label', { m: BOX_G }) });
  const waterplane = createWaterplane();
  const dimH = createDimension(COLORS.h);
  scene.add(
    parts.table,
    tank.root,
    stream.mesh,
    kscale.root,
    beaker.root,
    stand.root,
    hanging.root,
    ship.root,
    foam,
    boxes.mesh,
    waterplane.mesh,
    dimH.mesh,
  );
  // the forces (step ③ on)
  const arrowW = boldArrow('WeightArrow', COLORS.W, 0.26);
  const arrowF = boldArrow('BuoyancyArrow', COLORS.F, 0.26);
  scene.add(arrowW.root, arrowF.root);
  arrowW.root.visible = false;
  arrowF.root.visible = false;

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
  // v: what the picture shows, tweened: on (the displays, 0…1), k (the arm's travel while the ship hangs, 0…1),
  // lift (the cords unhooked and raised, 0…1), arrows (0…1), cargo (g on the deck, eased while the ship settles),
  // fly (0…1, the container in the air). loaded: the containers on the deck, in the order of the slots they took;
  // flying: the one in the air (or -1).
  const s = {
    step: 'intro',
    v: { on: 0, k: 0, lift: 0, arrows: 0, cargo: 0, fly: 0 },
    loaded: /** @type {number[]} */ ([]),
    flying: -1,
    boot: false,
    tappedOnce: false, // a container has been loaded: the one-time "tap any" caption goes
    tank: startTank(),
    phys: settle(startTank(), { keelHang: keelAt(0), mass: SHIP_G }),
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    quiz: null, // { kind, hideHang, look } while a question is shown
    revealed: false,
    drag: null,
    flow: 0,
    flowRising: true,
  };
  const count = () => s.loaded.length;
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const hooked = () => s.v.lift < 0.001;
  /** The container the ring offers next (any other can be tapped too), or -1. */
  const nextBox = () => PREFER.find((i) => !s.loaded.includes(i) && i !== s.flying) ?? -1;

  // ── the scene from the state ────────────────────────────────────────────────
  let lastSpilled = 0;
  const tmp = V3(0, 0, 0);
  const tmp2 = V3(0, 0, 0);
  const down = V3(0, -1, 0);
  const up = V3(0, 1, 0);
  const hangLcd = V3(0, 0, 0);
  /** Settles the tank for the state now (path-dependent: what ran out stays out), then places everything. */
  function syncScene() {
    const v = s.v;
    const mass = SHIP_G + v.cargo;
    s.phys = settle(s.tank, { keelHang: hooked() ? keelAt(v.k) : null, mass });
    s.tank = { water: s.phys.water, spilled: s.phys.spilled };
    const p = s.phys;
    tank.setLevel(p.level);
    beaker.setVolume(p.spilled);
    ship.root.position.set(0, p.keel, 0);
    foam.position.set(0, p.level, 0);
    foam.visible = p.draft > 0.02;
    // the hanging scale: its ring above the keel while hooked; unhooked it rises out of the view and is put away
    const ringY = hooked() ? keelAt(v.k) + RING_ABOVE_KEEL : HANG.end + RING_ABOVE_KEEL + LIFT * ease.inOutCubic(v.lift);
    hanging.root.position.set(CENTRE_X, ringY, 0);
    hanging.root.visible = v.lift < 0.999;
    hanging.setBridle(1 - Math.min(1, v.lift * 2.5));
    stand.setArm(ringY + ARM_ABOVE_RING);
    hangLcd.copy(hanging.lcdAt).add(hanging.root.position);
    // the containers: on the table, in the air, or on the deck (they ride with the ship)
    for (let i = 0; i < boxes.count; i++) {
      const slot = s.loaded.indexOf(i);
      if (slot >= 0) boxes.place(i, tmp.copy(SLOTS[slot]).add(ship.root.position));
      else if (i === s.flying) boxes.place(i, flyPath(i, count(), v.fly, tmp));
      else boxes.place(i, STACK[i]);
    }
    boxes.done();
    const full = count() >= MAX_BOXES && s.flying < 0;
    ship.lightLoadLine(full && s.step === 'load' && !s.quiz ? 1 : 0);
    // the waterplane A and the draft h (step ④)
    const showAh = s.step === 'load' && v.arrows > 0.5 && !s.quiz;
    waterplane.mesh.visible = showAh;
    waterplane.mesh.position.set(0, p.level + 0.02, 0);
    dimH.mesh.visible = showAh;
    if (showAh) dimH.set(HULL.stern + 0.75, p.keel, p.level, HULL.beam / 2);
    // the displays
    const on = v.on > 0.5;
    const hang = hooked() ? Math.round(p.reading ?? 0) : 0;
    hanging.lcd.draw(s.boot ? N('888') : s.quiz?.hideHang ? '---' : N(hang), on);
    kscale.lcd.draw(s.boot ? N('888') : N(Math.round(p.spilled)), on);
    // the arrows: buoyancy up to the keel, weight down onto the deck (or the cargo), at the waterplane's centre
    const k = ease.outCubic(v.arrows);
    arrowW.root.visible = k > 0.01;
    arrowF.root.visible = k > 0.01;
    if (k > 0.01) {
      const lw = weightN(mass) * ARROW_PER_N * k;
      arrowW.set(tmp.set(CENTRE_X, deckTop() + lw, 0), down, lw);
      const lf = weightN(p.sub) * ARROW_PER_N * k;
      arrowF.set(tmp.set(CENTRE_X, p.keel - 0.12 - lf, 0), up, lf);
      arrowW.setOpacity(Math.min(1, k * 2));
      arrowF.setOpacity(Math.min(1, k * 2));
    }
    // how fast water runs out: the stream shows while the beaker gains
    const gain = p.spilled - lastSpilled;
    lastSpilled = p.spilled;
    if (gain > 1e-6) flowTarget = 1;
  }
  /** The top of what is on the deck at the middle (the deck, or the first two containers). */
  const deckTop = () => s.phys.keel + DECK + (s.loaded.length > 0 ? BOX.y : 0) + 0.15;
  /** The arc a container flies on: up out of its place, over the tank's front glass, down onto its slot. */
  function flyPath(i, slot, k, out) {
    const from = STACK[i];
    const to = tmp2.copy(SLOTS[slot]).add(ship.root.position);
    const e = ease.inOutCubic(k);
    out.lerpVectors(from, to, e);
    const apex = Math.max(from.y, to.y) + 7;
    out.y += Math.sin(Math.PI * e) * (apex - (from.y + (to.y - from.y) * e)) * 0.95;
    return out;
  }

  // the stream: eases on while water runs out, off a little after it stops
  let flowTarget = 0;
  stage.addTicker((dt) => {
    const want = flowTarget;
    flowTarget = 0;
    const before = s.flow;
    s.flowRising = want > s.flow;
    s.flow += (want - s.flow) * Math.min(1, dt * (want > s.flow ? 7 : 3.2));
    if (s.flow < 0.02 && want === 0) s.flow = 0;
    stream.set(s.flow, s.flowRising, beaker.surface(s.phys.spilled));
    const moving = Math.abs(s.flow - before) > 1e-4;
    if (moving) syncLabels();
    return moving;
  });

  /** The next container pulses gently (three beats, then still), so the eye finds it; the ring circles it too. */
  let glowing = -1;
  function pulseNext() {
    if (glowing >= 0) boxes.glow(glowing, 0);
    tweener.cancel('glow');
    const i = nextBox();
    glowing = -1;
    if (i < 0 || !o.coach || s.mode !== 'explore' || !(s.step === 'buoy' || s.step === 'load')) return;
    glowing = i;
    tweener.animate({
      key: 'glow',
      duration: 2.4,
      onUpdate: (k) => {
        boxes.glow(i, 0.5 - 0.5 * Math.cos(k * Math.PI * 6));
        stage.invalidate();
      },
      onComplete: () => {
        boxes.glow(i, 0);
        glowing = -1;
        stage.invalidate();
      },
    });
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  /** @type {ReturnType<typeof createDragHandle> | null} */
  let armHandle = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      $('.pvc-panel-toggle'),
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotateEl),
      () => armHandle?.box() ?? [],
      () => arrowBoxes(),
    ],
  });
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const proj = V3(0, 0, 0);
  function toScreen(p) {
    proj.copy(p).project(camera);
    return { x: (proj.x * 0.5 + 0.5) * stage.width, y: (-proj.y * 0.5 + 0.5) * stage.height, behind: proj.z > 1 };
  }
  // the arrows' screen boxes (labels keep off them)
  const aBoxes = [
    { left: 0, top: 0, right: 0, bottom: 0 },
    { left: 0, top: 0, right: 0, bottom: 0 },
  ];
  const ends = [V3(0, 0, 0), V3(0, 0, 0), V3(0, 0, 0), V3(0, 0, 0)];
  function arrowBoxes() {
    if (s.v.arrows < 0.05) return [];
    const p = s.phys;
    const top = deckTop();
    ends[0].set(CENTRE_X, top, 0);
    ends[1].set(CENTRE_X, top + weightN(SHIP_G + s.v.cargo) * ARROW_PER_N, 0);
    ends[2].set(CENTRE_X, p.keel, 0);
    ends[3].set(CENTRE_X, p.keel - weightN(p.sub) * ARROW_PER_N, 0);
    for (let i = 0; i < 2; i++) {
      const A = toScreen(ends[i * 2]);
      const B = toScreen(ends[i * 2 + 1]);
      Object.assign(aBoxes[i], {
        left: Math.min(A.x, B.x) - 9,
        right: Math.max(A.x, B.x) + 9,
        top: Math.min(A.y, B.y) - 9,
        bottom: Math.max(A.y, B.y) + 9,
      });
    }
    return aBoxes;
  }
  // the ship's box on the screen (the hull and what is on its deck), for labels that must keep off it
  const shipBounds = new THREE.Box3();
  const shipScreen = { left: 0, top: 0, right: 0, bottom: 0 };
  const corner = V3(0, 0, 0);
  const shipMin = V3(-HULL.stern, 0, -HULL.beam / 2);
  const shipMax = V3(HULL.stern, DECK + 4.4, HULL.beam / 2);
  function shipBox() {
    shipBounds.set(shipMin, shipMax).translate(ship.root.position);
    let l = Number.POSITIVE_INFINITY;
    let r = Number.NEGATIVE_INFINITY;
    let tp = Number.POSITIVE_INFINITY;
    let b = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < 8; i++) {
      corner.set(
        i & 1 ? shipBounds.max.x : shipBounds.min.x,
        i & 2 ? shipBounds.max.y : shipBounds.min.y,
        i & 4 ? shipBounds.max.z : shipBounds.min.z,
      );
      const q = toScreen(corner);
      l = Math.min(l, q.x);
      r = Math.max(r, q.x);
      tp = Math.min(tp, q.y);
      b = Math.max(b, q.y);
    }
    return Object.assign(shipScreen, { left: l, right: r, top: tp, bottom: b });
  }
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(20, 0), spot(20, -16), spot(20, 16), spot(28, -32)];
  const LEFT_OF = [spot(-20, 0), spot(-20, -16), spot(-20, 16), spot(-28, -32)];
  const ABOVE = [spot(0, -24), spot(18, -24), spot(-18, -24), spot(0, -40)];
  const inQuiz = () => s.mode === 'quiz';
  const tight = () => stage.height < 260;
  const lookAt = (which) => s.quiz?.look === which && !s.revealed;
  /** A display's reading, as a chip that looks like the display (its leader line points at it). */
  const lcdText = (x, which) => `${lookAt(which) ? '<span class="dw-look"></span>' : ''}${x}`;
  const LABELS = {
    hang: {
      text: () => lcdText(s.quiz?.hideHang ? t('lbl_hidden') : t('lbl_reading', { x: Math.round(s.phys.reading ?? 0) }), 'hang'),
      point: () => hangLcd,
      kind: 'lcd',
      spots: [spot(58, 0), spot(58, 22), spot(58, -20), spot(-58, 22), spot(-58, 0)],
      show: () => hooked() && s.v.on > 0.5 && !s.boot && hanging.root.visible,
    },
    pot: {
      text: () => lcdText(t('lbl_reading', { x: Math.round(s.phys.spilled) }), 'pot'),
      point: () => kscale.lcdAt,
      kind: 'lcd',
      // (in the tightest frame there is no room below the scale, and to its left it would sit on the containers)
      get spots() {
        return tight() ? [spot(60, 6), spot(56, -10)] : [spot(0, 36), spot(60, 6), spot(56, 26), spot(-56, 26), spot(-62, 0)];
      },
      show: () => s.v.on > 0.5 && !s.boot,
    },
    spill: {
      text: () => t('lbl_spill'),
      point: () => V3(BEAKER_AT.x - 2.2, TANK.spout - 1.6, 0),
      color: COLORS.water,
      spots: [spot(34, -42), spot(40, -60), spot(30, -26), spot(-40, -44), ...ABOVE],
      avoid: [() => shipBox()],
      optional: true,
      show: () => s.flow > 0.3 && !inQuiz() && s.step !== 'buoy',
    },
    W: {
      text: () => t('lbl_W', { v: weightN(SHIP_G + s.v.cargo) }),
      point: () => V3(CENTRE_X, deckTop() + weightN(SHIP_G + s.v.cargo) * ARROW_PER_N, 0),
      color: COLORS.W,
      spots: [spot(0, -20), spot(30, -20), spot(56, -20), spot(48, -6), spot(76, -6), spot(-48, -6), spot(0, -36), spot(72, 36), spot(-72, 36)],
      avoid: [() => shipBox()],
      show: () => s.v.arrows > 0.9 && !s.quiz,
    },
    F: {
      text: () => t('lbl_F', { v: weightN(s.phys.sub) }),
      point: () => V3(CENTRE_X, s.phys.keel - weightN(s.phys.sub) * ARROW_PER_N, 0),
      color: COLORS.F,
      spots: [spot(0, 18), spot(40, 12), spot(-40, 12), ...RIGHT_OF],
      avoid: [() => shipBox()],
      show: () => s.v.arrows > 0.9 && !s.quiz,
    },
    V: {
      text: () => t('lbl_V', { v: Math.round(s.phys.spilled) }),
      point: () => V3(BEAKER_AT.x + 1.5, BEAKER_AT.y + 7.2, -2),
      color: COLORS.water,
      spots: [spot(10, -34), spot(-6, -34), spot(34, -20), spot(10, -52), spot(-6, -52)],
      avoid: [() => shipBox()],
      optional: true,
      show: () => s.step === 'buoy' && s.v.arrows > 0.9 && !inQuiz() && !tight(),
    },
    A: {
      text: () => t('lbl_A', { v: AREA }),
      point: () => V3(-HULL.stern + 1.2, s.phys.level, HULL.beam / 2 - 0.6),
      color: COLORS.A,
      spots: [spot(-30, 22), spot(-40, 8), spot(-20, 34), spot(10, 56), spot(30, 56), spot(-8, 56), spot(10, 70), ...LEFT_OF],
      avoid: [() => shipBox()],
      optional: true,
      show: () => waterplane.mesh.visible && !s.busy && frontSide(),
    },
    h: {
      text: () => t('lbl_h', { v: round(s.phys.draft, 1) }),
      point: () => V3(HULL.stern + 0.75, (s.phys.keel + s.phys.level) / 2, HULL.beam / 2),
      color: COLORS.h,
      spots: [spot(34, 0), spot(34, 14), spot(34, -14), spot(46, 26)],
      optional: true,
      show: () => dimH.mesh.visible && !s.busy && frontSide(),
    },
    line: {
      text: () => t('lbl_loadline'),
      point: () => tmp2.copy(LOAD_LINE_AT).add(ship.root.position),
      color: COLORS.line,
      spots: [spot(0, 30), spot(-30, 30), spot(30, 30), spot(0, 44)],
      show: () => s.step === 'load' && count() >= MAX_BOXES && s.flying < 0 && !s.busy && !s.quiz && frontSide(),
    },
  };
  /** The marks and the labels on the near side face the camera. */
  const frontSide = () => camera.position.z > 4 && camera.position.x > -6;
  const shownText = new Map();
  function syncLabels() {
    let added = false;
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      if (want) {
        const text = L.text();
        const color = L.color ?? '';
        const key = `${text}|${color}`;
        if (!anno.has(id) || added) {
          added = true;
          if (anno.has(id)) anno.remove(id);
          anno.add(id, { text, point: L.point, kind: L.kind ?? 'force', color, spots: L.spots, optional: Boolean(L.optional), avoid: L.avoid ?? [] });
          shownText.set(id, key);
        } else if (shownText.get(id) !== key) {
          anno.update(id, { text, color });
          shownText.set(id, key);
        }
      } else if (anno.has(id)) {
        anno.remove(id);
        shownText.delete(id);
      }
    }
  }

  // ── camera: the whole apparatus with the hanging scale; then the ship, tank and beaker ─────
  // (the whole view keeps the hanging scale's body in; its arm may leave the top)
  const POSES = {
    whole: { box: new THREE.Box3(V3(-14.4, 0, -6.5), V3(27.2, HANG.start + RING_ABOVE_KEEL + 2 + HSCALE.h + 0.4, 12.8)), dir: dirOf(26, 15) },
    float: { box: new THREE.Box3(V3(-14.4, 0, -6.5), V3(27.2, 20.5, 12.8)), dir: dirOf(24, 17) },
    // the tightest frames: the beaker's far half and the table's corners may go; the ship, tank, beaker and row stay
    wholeTight: { box: new THREE.Box3(V3(-14, 1, -4), V3(25.5, HANG.start + RING_ABOVE_KEEL + 2 + HSCALE.h, 11.5)), dir: dirOf(26, 15) },
    floatTight: { box: new THREE.Box3(V3(-14, 1, -4), V3(25.5, 19, 11.5)), dir: dirOf(24, 17) },
  };
  const fitted = {};
  function fitPoses() {
    const t2 = stage.height < 260;
    const margin = t2 ? MARGIN_TIGHT : MARGIN;
    for (const key of ['whole', 'float']) {
      const p = POSES[t2 ? `${key}Tight` : key];
      const f = fitPose({ box: p.box, dir: p.dir, camera, width: stage.width, height: stage.height, margin });
      fitted[key] = { target: f.target, dist: f.position.distanceTo(f.target), dir: p.dir };
    }
  }
  const guided = { position: V3(0, 0, 0), target: V3(0, 0, 0) };
  const mid = { target: V3(0, 0, 0), dir: V3(0, 0, 1), dist: 1 };
  function guidedPose() {
    const a = fitted.whole;
    const b = fitted.float;
    const k = ease.inOutCubic(s.v.lift);
    mid.target.lerpVectors(a.target, b.target, k);
    mid.dir.lerpVectors(a.dir, b.dir, k).normalize();
    mid.dist = Math.exp(Math.log(a.dist) + (Math.log(b.dist) - Math.log(a.dist)) * k);
    guided.target.copy(mid.target);
    guided.position.copy(mid.target).addScaledVector(mid.dir, mid.dist);
    return guided;
  }
  let camK = 1;
  let camFrom = null;
  function applyCamera() {
    if (s.userMovedCamera) return;
    const g = guidedPose();
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
  /** The guided camera takes the view back, flying from wherever the student left it. */
  function takeView(duration = T.cam) {
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
    if (!was && camK >= 1) return Promise.resolve(true);
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    if (!duration) {
      camK = 1;
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
      s.userMovedCamera = true;
      tweener.cancel('camera');
      const g = guidedPose();
      const off = g.position
        .clone()
        .sub(g.target)
        .applyAxisAngle(V3(0, 1, 0), rad(-50));
      camera.position.copy(g.target).add(off);
      controls.target.copy(g.target);
      controls.update();
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p = takeView(animate ? T.cam : 0);
    emitChange();
    return p;
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
  });
  stage.onResize(() => {
    fitPoses();
    syncScene();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  /** Moves some of the values to where they go, together, over `duration` seconds. */
  function tweenTo(to, duration, my, easing = ease.inOutCubic) {
    const from = { ...s.v };
    return tweener
      .animate({
        key: 'step',
        duration,
        ease: easing,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const key of Object.keys(to)) s.v[key] = from[key] + (to[key] - from[key]) * k;
          syncScene();
          syncLabels();
          refreshLive();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  const wait = (sec, my) => tweener.animate({ key: 'step', duration: sec }).finished.then((ok) => ok && my === s.run);
  /** Sets up a step's finished state at once (the water poured back in as needed): for jumps, set(), the test. */
  function setupStep(step, n = count()) {
    const box = step === 'load' ? Math.min(MAX_BOXES, Math.max(0, Math.round(n))) : 0;
    s.tank = startTank();
    s.flying = -1;
    s.boot = false;
    lastSpilled = 0;
    const base = { on: 0, k: 0, lift: 0, arrows: 0, cargo: 0, fly: 0 };
    if (step !== 'intro') base.on = 1;
    if (ORDER.indexOf(step) >= ORDER.indexOf('lower')) base.k = 1;
    // lower the ship to where it floats (this runs the water out, as it would)
    Object.assign(s.v, base);
    s.loaded = [];
    syncScene();
    if (ORDER.indexOf(step) >= ORDER.indexOf('buoy')) {
      s.v.lift = 1;
      s.v.arrows = 1;
    }
    s.loaded = PREFER.slice(0, box);
    s.v.cargo = BOX_G * box;
    syncScene();
    lastSpilled = s.phys.spilled;
    // set up, not poured: no stream
    flowTarget = 0;
    s.flow = 0;
    stream.set(0, false, 0);
  }
  /** The plan from one step to the next: an async run, cancellable by s.run. */
  async function play(from, to, my, pick) {
    if (from === 'intro' && to === 'weigh') {
      s.boot = true;
      if (!(await tweenTo({ on: 1 }, T.boot, my))) return false;
      if (!(await wait(0.5, my))) return false;
      s.boot = false;
      syncScene();
      audio.tick?.();
      return wait(T.hold, my);
    }
    if (from === 'weigh' && to === 'lower') {
      if (!(await tweenTo({ k: 1 }, T.lower, my, ease.inOutSine))) return false;
      audio.success?.();
      return wait(T.hold, my);
    }
    if (from === 'lower' && to === 'buoy') {
      // a ship lifted part of the way is first lowered back until it floats, then unhooked: nothing jumps
      if (s.v.k < 0.999 && !(await tweenTo({ k: 1 }, T.down * (1 - s.v.k) + 0.4, my, ease.inOutSine))) return false;
      takeView(T.cam + 0.2);
      if (!(await tweenTo({ lift: 1 }, T.lift, my))) return false;
      return tweenTo({ arrows: 1 }, T.arrows, my, ease.outCubic);
    }
    if ((from === 'buoy' || from === 'load') && to === 'load') return loadOne(my, pick);
    return true;
  }
  /** One container (the one tapped, else the next) from the table onto the deck; 50 g more water runs out. */
  async function loadOne(my, pick = -1) {
    const i = pick >= 0 && !s.loaded.includes(pick) ? pick : nextBox();
    if (i < 0 || count() >= MAX_BOXES) return true;
    if (glowing >= 0) {
      boxes.glow(glowing, 0);
      tweener.cancel('glow');
      glowing = -1;
    }
    s.flying = i;
    s.v.fly = 0;
    audio.tick?.();
    if (!(await tweenTo({ fly: 1 }, T.fly, my))) return false;
    s.flying = -1;
    s.loaded.push(i);
    s.v.fly = 0;
    audio.contact?.();
    if (!(await tweenTo({ cargo: BOX_G * count() }, T.settle, my, ease.outCubic))) return false;
    return wait(0.3, my);
  }
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    s.busy = false;
    if (s.flying >= 0) {
      // a container caught in the air lands at once, with the ship settled
      s.loaded.push(s.flying);
      s.flying = -1;
      s.v.fly = 0;
      s.v.cargo = BOX_G * count();
    }
    s.boot = false;
  }
  async function go(step, { animate = true, pick = -1 } = {}) {
    if (!ORDER.includes(step)) return;
    const from = s.step;
    stopAll();
    endDrag();
    hintOff();
    const my = s.run;
    const forward = NEXT[from] === step || (from === 'load' && step === 'load');
    if (!animate || !forward) {
      // a jump: the experiment set up again as it is at the end of that step
      if (step !== 'load' || from !== 'load') setupStep(step, step === 'load' && from !== 'load' ? Math.max(1, count()) : count());
      s.step = step;
      takeView(animate ? T.cam : 0);
      if (!animate) camK = 1;
      done();
      return;
    }
    s.step = step;
    s.busy = true;
    if (step !== 'buoy') takeView(T.cam);
    refresh();
    emitChange();
    const ok = await play(from, step, my, pick);
    if (!ok || my !== s.run) return;
    s.busy = false;
    done();
  }
  function done() {
    syncScene();
    syncLabels();
    // the beaker's reading picks its place afresh for this view (it must not stay on the row of containers)
    if (anno.has('pot')) anno.update('pot', { spots: LABELS.pot.spots });
    refresh();
    emitChange();
    pulseNext();
    stage.invalidate();
  }
  /** The arm's travel while the ship hangs (step ②): drag, keys, or set(). */
  function setK(k) {
    const kk = Math.min(1, Math.max(0, k));
    if (Math.abs(kk - s.v.k) < 1e-6) return;
    s.v.k = kk;
    syncScene();
    syncLabels();
    refresh();
    stage.invalidate();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const replayBtn = /** @type {HTMLButtonElement} */ ($('[data-act="replay"]'));
  const steady = { lead: '', act: '' };
  const kg = (g) => round(g / 1000, 3);
  const m3 = (cm3) => String(round(cm3 / 1e6, 8));
  const tally = () => ({ n: count(), max: MAX_BOXES });
  /** The action: [words, the student's step number, icon]. */
  function actionNow() {
    if (s.busy) return ['act_wait', '', ICONS.hand];
    if (s.step === 'intro') return ['act_weigh', 1, ICONS.hand];
    if (s.step === 'weigh') return ['act_lower', 2, ICONS.hand];
    if (s.step === 'lower') return ['act_buoy', 3, ICONS.hand];
    if (s.step === 'buoy') return ['act_load', 4, ICONS.hand];
    if (count() >= MAX_BOXES) return ['act_quiz', '', ICONS.chevR];
    return [() => t('act_more', tally()), '', ICONS.hand];
  }
  /** The two bars: ship + cargo (the ship's navy and each container's colour) and the water pushed aside. */
  function bars() {
    const m = SHIP_G + BOX_G * count();
    const w = Math.round(s.phys.spilled);
    const pct = (g) => `${round((g / shipMass(MAX_BOXES)) * 100, 2)}%`;
    let segs = `<span class="dw-seg dw-seg-ship" style="width:${pct(SHIP_G)}"></span>`;
    for (const i of s.loaded) segs += `<span class="dw-seg dw-seg-box${i}" style="width:${pct(BOX_G)}"></span>`;
    return (
      `<span class="dw-bars" role="img" aria-label="${t('bar_aria', { m, w })}">` +
      `<span class="dw-bar"><span class="dw-bl">${t('bar_ship')}</span><span class="dw-track">${segs}</span><b class="dw-m">${N(m)}&nbsp;g</b></span>` +
      `<span class="dw-bar"><span class="dw-bl">${t('bar_water')}</span><span class="dw-track"><span class="dw-seg dw-seg-water" style="width:${pct(w)}"></span></span><b class="dw-w">${N(w)}&nbsp;g</b></span>` +
      '</span>'
    );
  }
  /** The result line, from the live state (it follows the arm in step ②). */
  function outcome() {
    const p = s.phys;
    const step = s.step;
    if (step === 'weigh') return t('out_weigh', { m: SHIP_G, w: Math.round(p.spilled) });
    if (step === 'lower') {
      const r = Math.round(p.reading ?? 0);
      const x = Math.round(p.spilled);
      const atLip = p.level >= TANK.spout - 1e-6;
      if (p.floating || r <= 0) return t('out_float', { x });
      if (!atLip) return t('out_lifted', { x });
      if (x <= 0) return t('out_air', { m: r });
      return t('out_part', { x: SHIP_G - r });
    }
    if (step === 'buoy') {
      const v = Math.round(p.spilled);
      return `${t('out_buoy_v', { v, m3: m3(v) })}<span class="dw-law">${t('out_buoy_f', { m3: m3(v), rho: RHO_SI, g: G, F: weightN(v) })}</span>`;
    }
    if (step === 'load') return bars();
    return '';
  }
  function rule() {
    if (s.step === 'weigh') return t('rule_weigh', { kg: kg(SHIP_G), g: G, W: weightN(SHIP_G), rho: RHO_SI });
    if (s.step === 'load')
      return `${t('rule_load')}<span class="dw-law">${t('rule_load_v', { A: AREA, h: round(s.phys.draft, 1), v: Math.round(s.phys.sub) })}</span>`;
    return t(`rule_${s.step}`);
  }
  function leadText() {
    if (s.step === 'lower') {
      const r = Math.round(s.phys.reading ?? 0);
      return t(r > 0 ? 'lead_lower_up' : 'lead_lower', { r });
    }
    if (s.step === 'buoy') return t('lead_buoy', tally());
    if (s.step === 'load')
      return count() >= MAX_BOXES ? `${t('lead_load', tally())} <span class="dw-done">${ICONS.check}</span>` : t('lead_load', tally());
    return t(`lead_${s.step}`);
  }
  /** Only the lines that follow a moving part (cheap; every frame while it moves). */
  function refreshLive() {
    if (s.mode === 'quiz' || s.step === 'intro') return;
    // while the ship goes down the two readings are the point: the result line follows them
    if (s.busy && s.step !== 'lower') return;
    sheet.outcome(outcome());
  }
  const actBtn = /** @type {HTMLElement} */ ($('.pvc-act-slot'));
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const full = s.step === 'load' && count() >= MAX_BOXES;
    const leadHtml = calm
      ? `<span class="dw-long">${t('intro')}</span><span class="dw-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : leadText();
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('dw-calm', calm);
    }
    fitCalm();
    sheet.outcome(calm || (s.busy && s.step !== 'lower') ? '' : outcome());
    sheet.rule(calm || s.busy ? '' : rule());
    sheet.choose(calm ? null : s.step);
    sheet.next(NEXT[s.step] ?? null);
    const [word, step, icon] = actionNow();
    const enabled = !s.busy;
    const label = typeof word === 'function' ? word() : t(word);
    // the one-time words under the badge: any container will do
    // (on a phone the how-to row says it: the words would cover the row of containers)
    const caption = (s.step === 'buoy' || s.step === 'load') && !s.tappedOnce && !s.busy && !full && stage.width >= 520 ? t('cap_any') : '';
    const key = `${label}|${step}|${enabled}|${caption}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: () => label, step, enabled, icon, caption });
    }
    if (action) {
      if (enabled && s.mode === 'explore' && !full) action.show('scene');
      else action.hide('scene');
    }
    // at six, the test button pulses: the next thing to do is in the panel
    actBtn.classList.toggle('dw-go', full && !s.busy && s.mode === 'explore');
    homeBtn.hidden = s.step === 'intro';
    homeBtn.disabled = s.busy;
    replayBtn.hidden = s.step === 'intro';
    replayBtn.disabled = s.busy;
    syncLabels();
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the part, a tap on the part ─────────
  function doAction(pick = -1) {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    if (s.step === 'load' && count() >= MAX_BOXES) return quiz.start();
    const next = s.step === 'load' ? 'load' : NEXT[s.step];
    if (next === 'load') s.tappedOnce = true;
    if (next) return go(next, { pick });
    return quiz.start();
  }
  /** What the ring is round: the hanging scale, the ship, the hook, exactly the next container. */
  const nextBoxAt = new THREE.Box3();
  const bMin = V3(0, 0, 0);
  const bMax = V3(0, 0, 0);
  function actionTarget() {
    if (s.step === 'intro') return hanging.body;
    if (s.step === 'weigh') return ship.hull;
    if (s.step === 'lower') return hanging.body;
    if (s.step === 'buoy' || s.step === 'load') {
      const i = s.flying < 0 ? nextBox() : -1;
      if (i < 0) return null;
      const c = STACK[i];
      bMin.set(c.x - BOX.x / 2, c.y - BOX.y / 2, c.z - BOX.z / 2);
      bMax.set(c.x + BOX.x / 2, c.y + BOX.y / 2, c.z + BOX.z / 2);
      return nextBoxAt.set(bMin, bMax);
    }
    return null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_weigh',
    icon: ICONS.hand,
    target: actionTarget,
    pad: 6,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), () => armHandle?.box() ?? []],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** What a tap hit: { part: 'box' | 'scale' | 'ship', id } (id: which container). */
  function tappedPart(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const list = [...ship.meshes(), boxes.mesh];
    if (hanging.root.visible) list.push(hanging.body);
    const hit = raycaster.intersectObjects(list, false).find((h) => h.object.visible);
    if (!hit) return null;
    if (hit.object === boxes.mesh) return { part: 'box', id: hit.instanceId ?? -1 };
    if (hit.object === hanging.body) return { part: 'scale', id: -1 };
    return { part: 'ship', id: -1 };
  }

  // ── dragging the arm (step ②): the ship goes down into the water and back up ─────
  const canDrag = () => !s.locked && !s.busy && s.mode === 'explore' && s.step === 'lower' && hooked() && camK >= 1;
  const armY = (k) => keelAt(k) + RING_ABOVE_KEEL + ARM_ABOVE_RING;
  const HANDLE_X = CENTRE_X - 6.5; // near the scale: its words sit above the arm, clear of the scale and the corner pill
  const handleAt = V3(0, 0, 0);
  armHandle = createDragHandle(stage, {
    point: () => handleAt.set(HANDLE_X, stand.arm.position.y, 0),
    axis: 'y',
    track: { from: V3(HANDLE_X, armY(1), 0), to: V3(HANDLE_X, armY(0), 0) },
    label: t('drag_me'),
    labelAt: 'above',
    aria: t('aria_drag_arm'),
    pulse: Boolean(o.coach),
    when: canDrag,
  });
  let handleShown = false;
  stage.addTicker(() => {
    const v = Boolean(armHandle?.visible);
    if (v === handleShown) return false;
    handleShown = v;
    return true;
  });

  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      // last: only while it applies (the arm once the ship has been lowered; the containers while any are left)
      { kind: 'drag', axis: 'y', text: t('howto_lower'), handle: armHandle, when: () => s.step === 'lower' && !s.busy },
      {
        kind: 'tap',
        text: t('howto_box'),
        onTap: () => action?.flash(),
        when: () => (s.step === 'buoy' || s.step === 'load') && count() < MAX_BOXES && !s.busy,
      },
    ],
    { stage, collapse: true },
  );
  function grabArm(p) {
    if (!canDrag()) return false;
    if (armHandle.hit(p.x, p.y)) return true;
    // the arm itself, near the scale, with some slack
    const a = toScreen(V3(ROD.x + 3, stand.arm.position.y, 0));
    const b = toScreen(V3(CENTRE_X, stand.arm.position.y, 0));
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const len2 = Math.max(1, tx * tx + ty * ty);
    const k = ((p.x - a.x) * tx + (p.y - a.y) * ty) / len2;
    if (k < 0 || k > 1) return false;
    return Math.hypot(a.x + tx * k - p.x, a.y + ty * k - p.y) < 14;
  }
  let press = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = hostXY(e);
      press = { x: p.x, y: p.y, at: now() };
      if (!grabArm(p)) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      s.drag = { id: e.pointerId, x: p.x, y: p.y, k: s.v.k };
      armHandle.markUsed();
      action?.hide('drag');
      emit('dragstart', { part: 'arm' });
      e.preventDefault();
      e.stopPropagation();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    // pixels per unit of travel along the arm's path on the screen
    const a = toScreen(V3(HANDLE_X, armY(0), 0));
    const b = toScreen(V3(HANDLE_X, armY(1), 0));
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const dk = ((p.x - g.x) * tx + (p.y - g.y) * ty) / Math.max(1, tx * tx + ty * ty);
    setK(g.k + dk);
  });
  function endDrag(e) {
    const g = s.drag;
    if (!g || (e && e.pointerId !== g.id)) return;
    if (e) releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked;
    action?.show('drag');
    emit('dragend', { part: 'arm' });
    refresh();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const was = Boolean(s.drag);
    endDrag(e);
    if (!press || was) {
      press = null;
      return;
    }
    const p = hostXY(e);
    const moved = Math.hypot(p.x - press.x, p.y - press.y);
    const quick = now() - press.at < 600;
    press = null;
    if (moved > 8 || !quick || s.mode !== 'explore') return;
    const hit = tappedPart(p);
    if (!hit) return;
    if (hit.part === 'box') {
      // any container on the table: that one is loaded
      if ((s.step === 'buoy' || s.step === 'load') && !s.loaded.includes(hit.id) && hit.id !== s.flying) doAction(hit.id);
      return;
    }
    const wants = { intro: 'scale', weigh: 'ship', lower: 'scale' }[s.step];
    if (hit.part === wants || (hit.part === 'ship' && (s.step === 'intro' || s.step === 'lower'))) doAction();
  });
  ui.canvasHost.addEventListener('pointercancel', endDrag);

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
    const p = s.phys;
    return {
      step: s.step,
      busy: s.busy,
      on: s.v.on > 0.5,
      hooked: hooked(),
      lowered: round(s.v.k, 3), // the arm's travel, 0 (up) … 1 (down, the ship floats)
      reading: hooked() && s.v.on > 0.5 ? Math.round(p.reading ?? 0) : null, // g on the hanging scale
      spilled: round(p.spilled, 1), // g (= cm³) of water in the beaker
      pushedAside: round(p.sub, 1), // cm³ the hull pushes aside now
      level: round(p.level, 2), // cm, the water in the tank (11.6 at the spout's lip)
      draft: round(p.draft, 2), // cm
      floating: p.floating,
      containers: count(),
      loaded: [...s.loaded], // which containers (0 … 5, left to right on the table), in the order they were loaded
      next: { intro: 'weigh', weigh: 'lower', lower: 'unhook', buoy: 'load', load: count() < MAX_BOXES ? 'load' : 'quiz' }[s.step],
      nextContainer: s.step === 'buoy' || s.step === 'load' ? nextBox() : null,
      mass: SHIP_G + BOX_G * count(), // g, ship + cargo
      weight: weightN(SHIP_G + BOX_G * count()), // N
      buoyancy: weightN(p.sub), // N
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.reading, snap.spilled, snap.containers]);
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
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="dw-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const words = (keys) => keys.map((key) => ({ key }));
  /** The four questions, in this order (no scene shows a later answer). */
  const KINDS = ['reading', 'carry', 'more', 'force'];
  /** Which reading each question needs (that chip pulses), and its own hint under the choices. */
  const LOOK = { reading: 'pot', carry: 'hang', more: 'pot', force: 'pot' };
  const pickOf = (list) => list[Math.floor(Math.random() * list.length)];
  /** The scene of a question: set up from scratch, so nothing from the learn steps shows through. */
  function quizScene(kind) {
    stopAll();
    endDrag();
    s.revealed = false;
    s.quiz = { kind, hideHang: false, look: LOOK[kind] };
    if (kind === 'reading') {
      const w = pickOf([60, 80, 120, 140]);
      setupStep('weigh');
      // lower the arm until exactly w g has run out
      const keel = TANK.spout - w / AREA;
      s.v.k = (HANG.start - keel) / (HANG.start - HANG.end);
      s.step = 'lower';
      syncScene();
      s.quiz.hideHang = true;
      s.quiz.w = Math.round(s.phys.spilled);
    } else if (kind === 'carry') {
      setupStep('lower');
      s.step = 'lower';
    } else if (kind === 'more') {
      setupStep('load', pickOf([2, 3]));
      s.v.arrows = 0;
      s.step = 'load';
      s.quiz.now = Math.round(s.phys.spilled);
    } else {
      setupStep('load', pickOf([1, 2, 4]));
      s.v.arrows = 0;
      s.step = 'load';
      s.quiz.v = Math.round(s.phys.spilled);
    }
    takeView(0);
    camK = 1;
    syncScene();
    syncLabels();
    stage.invalidate();
  }

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
        learnSaved = { step: s.step, n: count() };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        endDrag();
        tweener.cancel('glow');
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        s.revealed = false;
        syncUI();
        const back = learnSaved || { step: 'intro', n: 0 };
        s.step = back.step === 'load' ? 'load' : 'intro';
        if (back.step === 'load') {
          setupStep('load', back.n);
          done();
        } else go(back.step, { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        quizScene(kind);
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        question = { kind };
        // the question's own hint, in place of the general one: where to look
        const fb = /** @type {HTMLElement} */ ($('.pvc-q-feedback'));
        fb.innerHTML = t(`qh_${kind}`);
        const g = (x) => `${N(x)} g`;
        if (kind === 'reading') {
          const items = readingChoices(s.quiz.w);
          question.items = items;
          return { text: t('q_reading'), ...choicesOf(items, kind, (x) => g(x.v)) };
        }
        if (kind === 'carry')
          return { text: t('q_carry'), ...choicesOf(words(['c_ca_right', 'c_ca_cord', 'c_ca_floor', 'c_ca_mass']), kind, (x) => t(x.key)) };
        if (kind === 'more') {
          const items = moreChoices(s.quiz.now);
          question.items = items;
          return { text: t('q_more'), ...choicesOf(items, kind, (x) => g(x.v)) };
        }
        const items = forceChoices(s.quiz.v);
        question.items = items;
        return { text: t('q_force'), ...choicesOf(items, kind, (x) => `${N(x.v)} N`) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        s.revealed = true;
        if (k === 'reading') {
          s.quiz.hideHang = false;
          syncScene();
          syncLabels();
          stage.invalidate();
          return (
            t('why_reading', { r: SHIP_G - s.quiz.w, w: s.quiz.w }) + note({ same: 'mis_rd_same', whole: 'mis_rd_whole', added: 'mis_rd_added' })
          );
        }
        if (k === 'carry') {
          s.v.arrows = 1;
          syncScene();
          syncLabels();
          stage.invalidate();
          return t('why_carry') + note({ c_ca_cord: 'mis_ca_cord', c_ca_floor: 'mis_ca_floor', c_ca_mass: 'mis_ca_mass' });
        }
        syncLabels();
        if (k === 'more') {
          // the answer: one more container lands and the water runs out
          const my = s.run;
          s.step = 'load';
          loadOne(my).then(() => {
            if (my === s.run) {
              syncScene();
              syncLabels();
              stage.invalidate();
            }
          });
          return t('why_more', { r: question.items[0].v }) + note({ none: 'mis_mo_none', double: 'mis_mo_double', only: 'mis_mo_only' });
        }
        return (
          t('why_force', { r: question.items[0].v, m3: m3(s.quiz.v), rho: RHO_SI }) +
          note({ mass: 'mis_fo_mass', grams: 'mis_fo_grams', divided: 'mis_fo_divided' })
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
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
    if (s.mode === 'quiz') actBtn.classList.remove('dw-go');
  }
  /** The step just finished, once more: from the step before it, played as the first time. */
  function replay() {
    if (s.busy || s.step === 'intro' || s.mode !== 'explore') return;
    const step = s.step;
    if (step === 'load') {
      const n = Math.max(1, count());
      stopAll();
      setupStep('load', n - 1);
      done();
      go('load');
      return;
    }
    go(ORDER[ORDER.indexOf(step) - 1], { animate: false });
    go(step);
  }
  function goHome() {
    s.loaded = [];
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
      if (b.dataset.example === s.step && !s.busy) return;
      go(b.dataset.example);
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
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowRight' && !onButton) {
      if (!(s.step === 'load' && count() >= MAX_BOXES)) doAction();
    } else if (k === 'ArrowLeft' && !onButton) go(ORDER[Math.max(1, ORDER.indexOf(s.step) - 1)]);
    else if ((k === 'ArrowUp' || k === 'ArrowDown') && !onButton) {
      if (!canDrag()) return;
      armHandle.markUsed();
      setK(s.v.k + (k === 'ArrowDown' ? 0.05 : -0.05));
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  fitPoses();
  syncUI();
  setupStep('intro');
  applyCamera();
  syncScene();
  refresh();
  // the parts of later steps are hidden at first: compile their shaders ahead, so the first tap freezes nothing
  beaker.water.visible = false;
  stage.warmUp({ show: [stream.mesh, beaker.water, arrowW.root, arrowF.root, foam, waterplane.mesh, dimH.mesh] });
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
    /** Change any of: step ('intro' | 'weigh' | 'lower' | 'buoy' | 'load'), containers (0 … 6, in 'load'), lowered (0 … 1,
     * the arm's travel in 'lower'), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.containers != null && (p.step === 'load' || (!p.step && s.step === 'load'))) {
        // a number of containers on board: the experiment set up that way at once
        if (s.step !== 'load') await go('load', { animate: false });
        stopAll();
        setupStep('load', Number(p.containers));
        s.step = 'load';
        done();
      } else if (p.step) await go(p.step, { animate });
      if (p.lowered != null && s.step === 'lower' && !s.busy) setK(Number(p.lowered));
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await setView('front', { animate: false });
      s.tappedOnce = false;
      armHandle?.rearm();
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** The view, cover-fitted to the size asked for (background: null keeps it transparent). */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      stage.render();
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const ctx = /** @type {CanvasRenderingContext2D} */ (out.getContext('2d'));
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }
      const gl = stage.canvas;
      const k = Math.max(width / gl.width, height / gl.height);
      ctx.drawImage(gl, (width - gl.width * k) / 2, (height - gl.height * k) / 2, gl.width * k, gl.height * k);
      return out.toDataURL('image/png');
    },
    /** The ship (with its containers on board), the tank and its water, the beaker and its water, in centimetres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'DisplacedWaterShip';
      g.add(ship.root.clone(true), tank.root.clone(true), beaker.root.clone(true), kscale.root.clone(true), boxes.mesh.clone());
      return g;
    },
  };
}
