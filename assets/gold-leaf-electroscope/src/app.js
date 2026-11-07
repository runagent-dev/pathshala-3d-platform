// The electroscope (book pages 278–279, topic 10.3.1), student view. A gold-leaf electroscope in a clear glass bottle
// on a plain table in a calm blue setting. Five steps, one tap each, slow: ① the parts (the metal path from the disc
// down the rod to the leaves; the insulating stopper) and its charges, "+ over −" pairs, so no charge; ② a glass rod
// rubbed with silk comes near without touching: electrons (blue −) slide up to the disc, bare + stay on the leaves and
// they spread (চার্জের আবেশ; the rod can be dragged nearer and farther); ③ it touches the disc: some electrons go into
// the glass, the rod is taken away and the leaves stay apart (চার্জ আহিতকরণ); ④⑤ the book's test of a charge's kind,
// with the known (+) electroscope: a comb rubbed with flannel makes the gap smaller (negative), the glass rubbed again
// makes it wider (positive). A calm card on the first screen, then one lead-in line, the result and the rule per
// step; the kit's how-to row; a five-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS } from '@shared/student/icons.js';
import { createMaterials } from '@shared/student/materials.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { CHARGE_AT, createBodies, GLASS_ROD } from './bodies.js';
import { fitPose } from './camera.js';
import { CHARGE_COLORS, createCharges } from './charges.js';
import { createElectroscope, DISC, DISC_TOP, JAR } from './electroscope.js';
import { createI18n } from './i18n.js';
import {
  D,
  DISC_SLOTS,
  gapDeg,
  LEAF_SLOTS,
  layout,
  leafAngle,
  parts,
  RUBBED,
  regionOf,
  SCENES,
  sceneLeaf,
  shiftFrom,
  TOUCH_TAKES,
  WORDS,
  assign,
} from './reading.js';
import { backdrop, createTable } from './setting.js';

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

const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 40, bottom: 12, side: 10 };
// how long things take (s): slow enough to follow
const T = {
  fly: 1.6,
  bodyIn: 1.4,
  rub: 2.2,
  clothOff: 0.8,
  approach: 2.4,
  flow: 1.6,
  drag: 0.8,
  touch: 1.4,
  transfer: 1.8,
  away: 2.2,
  labels: 0.55,
  glow: 2.6,
  chips: 0.9,
};
const POOL = 16; // electron chips: nine on the neutral metal, room for the extras
const GLASS_N = CHARGE_AT.length;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
/** The line bodies come in along: from the disc's rim, out to the right, a little up and toward the viewer. */
const OUT = V(1, 0.3, 0.25).normalize();
const FACING = Math.atan2(OUT.z, OUT.x);
const CONTACT = V((DISC.r + 0.4) * Math.cos(FACING), DISC.y + DISC.h / 2 + 2, (DISC.r + 0.4) * Math.sin(FACING));
/** How far along a body its drag handle sits: just behind its charges. */
const HANDLE_AT = 106;
const BODY_KEYS = ['glass', 'comb', 'unknown'];
const PREV = { parts: 'intro', near: 'parts', touch: 'near', testNeg: 'touch', testPos: 'testNeg' };
const NEXT = { intro: 'parts', parts: 'near', near: 'touch', touch: 'testNeg', testNeg: 'testPos', testPos: null };
const WORD_OF = { intro: null, parts: 'parts', near: 'near', touch: 'touch', testNeg: 'test', testPos: 'test' };
/** The body a student may drag in each step. */
const DRAGS = { near: 'glass', testNeg: 'comb', testPos: 'glass' };
const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'ge');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: WORDS.map((id) => ({ id, label: `ex_${id}` })) },
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
  // the charges' legend: the same chips as on the instrument
  const chipSvg = (fill, plus) =>
    `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="${CHARGE_COLORS.edge}"/><circle cx="10" cy="10" r="7.6" fill="${fill}"/><path d="M5.6 10h8.8${plus ? 'M10 5.6v8.8' : ''}" stroke="#fff" stroke-width="2.3"/></svg>`;
  const legend = document.createElement('p');
  legend.className = 'ge-legend';
  legend.innerHTML = `<span>${chipSvg(CHARGE_COLORS.plus, true)}${t('legend_plus')}</span><span>${chipSvg(CHARGE_COLORS.minus, false)}${t('legend_minus')}</span><span class="ge-pair"><i>${chipSvg(CHARGE_COLORS.plus, true)}${chipSvg(CHARGE_COLORS.minus, false)}</i>${t('legend_pair')}</span>`;
  $('.pvc-examples')?.after(legend);
  // the line before the action: what the next tap will show (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'ge-lead';
  $('.pvc-act-row').before(lead);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // what the chips are, in a corner of the view
  const noteEl = document.createElement('div');
  noteEl.className = 'ge-note';
  noteEl.textContent = t('note_few');
  ui.stage.appendChild(noteEl);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 5, far: 6000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.05));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.3);
  sun.position.set(380, 760, 520);
  sun.target.position.set(0, 100, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.65);
  fill.position.set(-700, 320, 500);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.8;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -130, right: 220, top: 190, bottom: -120, near: 500, far: 1500 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const mats = createMaterials(stage.renderer);
  const table = createTable();
  const scope = createElectroscope(mats);
  const bodies = createBodies();
  const charges = createCharges(9 + GLASS_N, POOL + GLASS_N);
  scene.add(table.root, scope.root, charges.plus, charges.minus);
  for (const k of BODY_KEYS) scene.add(bodies[k].root);
  // each body's frame: its +x out along the line, its +y up as far as it can be
  const bodyQuat = (() => {
    const x = OUT.clone();
    const y = V(0, 1, 0).addScaledVector(x, -x.y).normalize();
    const z = new THREE.Vector3().crossVectors(x, y);
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  })();
  for (const k of BODY_KEYS) bodies[k].root.quaternion.copy(bodyQuat);

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
  const body = (q = 0, d = D.park) => ({ q, d, lit: new Array(GLASS_N).fill(0), paired: new Array(GLASS_N).fill(0), cloth: -1 });
  const s = {
    step: 'intro',
    Q: 0,
    bodies: { glass: body(), comb: body(), unknown: body() },
    view: o.view === '3d' ? '3d' : 'front',
    pose: 'whole',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    labelsOn: 0, // how many of the parts' labels show
    chips: 0, // the electroscope's own charges: how much they show (none on the calm first screen)
    hideMetal: false, // the electroscope's own charges hidden (a test question that must not give the answer)
    leafOverride: null, // a test scene that sets the leaves' charge directly (the rainy day)
    ghost: null, // the leaves' earlier angle, drawn faintly
    watch: false, // electrons follow the bodies (re-laid out whenever the shift changes)
    dragging: false,
    quizKind: '',
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the electrons ───────────────────────────────────────────────────────────
  // Each chip: the slot it is at (null: not on the metal), or a trip from one slot to another (`to` may be 'G0'…: into
  // the glass rod, where it pairs up with a bare + there).
  const electrons = Array.from({ length: POOL }, () => ({
    slot: null,
    from: null,
    to: null,
    p: 1,
    delay: 0,
    dur: 1,
    path: Array.from({ length: 8 }, () => new THREE.Vector3()),
    n: 0,
  }));
  const moving = (e) => e.to != null;
  const ION_SLOTS = [
    ...Array.from({ length: DISC_SLOTS }, (_, i) => `D${i}`),
    ...Array.from({ length: LEAF_SLOTS }, (_, i) => `L${i}`),
    ...Array.from({ length: LEAF_SLOTS }, (_, i) => `R${i}`),
  ];
  const isIon = (slot) => slot != null && slot[1] !== 'X' && slot[0] !== 'G';
  /** Every electron at once on the slots of `list` (no trip). */
  function placeElectrons(list) {
    electrons.forEach((e, i) => {
      e.slot = list[i] ?? null;
      e.from = null;
      e.to = null;
      e.p = 1;
    });
  }
  const shiftNow = () => shiftFrom(BODY_KEYS.map((k) => s.bodies[k]));
  let laidFor = { Q: 0, shift: 0 };
  let pendingFlow = 0;
  /** Sends electrons to where the charges want them now (Q and the bodies), each on a trip of `dur` seconds. */
  function relayout(dur = T.flow) {
    if (electrons.some(moving)) {
      pendingFlow = dur;
      return;
    }
    pendingFlow = 0;
    const shift = shiftNow();
    laidFor = { Q: s.Q, shift };
    const want = layout(s.Q, shift);
    const from = electrons.map((e) => e.slot);
    const to = assign(from, want);
    let k = 0;
    electrons.forEach((e, i) => {
      if (to[i] === e.slot) return;
      startTrip(e, to[i], dur, k++ * 0.14);
    });
    stage.invalidate();
  }
  function startTrip(e, to, dur, delay) {
    e.from = e.slot;
    e.to = to;
    e.p = 0;
    e.dur = dur;
    e.delay = delay;
  }
  const settledWaiters = [];
  const isSettled = () => !electrons.some(moving) && !pendingFlow;
  /** Resolves once no electron is moving. */
  function settled() {
    if (isSettled()) return Promise.resolve();
    return new Promise((res) => settledWaiters.push(res));
  }
  // a trip's path: from its slot, along the metal (leaf → its top → the rod's foot → the rod's top → the disc's
  // centre), to the other slot; into the glass by the point where the rod touches the disc
  const P = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() };
  const bodyAt = { glass: new THREE.Vector3() };
  function slotPos(slot, out) {
    if (slot[0] === 'G') return bodyPoint('glass', bodies.glass.charges[Number(slot.slice(1))], out);
    return scope.slot(slot, out);
  }
  function chain(e) {
    const pts = e.path;
    let n = 0;
    const add = (v) => pts[n++].copy(v);
    const ra = regionOf(e.from);
    const rb = e.to[0] === 'G' ? 'glass' : regionOf(e.to);
    add(slotPos(e.from, P.a));
    if (ra !== rb) {
      if (ra === 'L' || ra === 'R') {
        add(scope.points.leafTop(ra === 'L' ? 0 : 1, P.b));
        if (rb === 'L' || rb === 'R') add(scope.points.rodFoot);
        else {
          add(scope.points.rodFoot);
          add(scope.points.rodTop);
          add(scope.points.discCentre);
        }
      } else if (ra === 'disc') {
        if (rb === 'glass') add(CONTACT);
        else {
          add(scope.points.discCentre);
          add(scope.points.rodTop);
          add(scope.points.rodFoot);
        }
      }
      if (rb === 'L' || rb === 'R') add(scope.points.leafTop(rb === 'L' ? 0 : 1, P.b));
      if (rb === 'glass') add(bodyPoint('glass', P.c.set(0, 0, 0), P.c));
    }
    add(slotPos(e.to, P.a));
    e.n = n;
  }
  const BEAD = new THREE.Vector3();
  function along(e, k, out) {
    const pts = e.path;
    let total = 0;
    for (let i = 1; i < e.n; i++) total += pts[i].distanceTo(pts[i - 1]);
    let left = total * k;
    for (let i = 1; i < e.n; i++) {
      const L = pts[i].distanceTo(pts[i - 1]);
      if (left <= L || i === e.n - 1) return out.lerpVectors(pts[i - 1], pts[i], L > 0 ? Math.min(1, left / L) : 1);
      left -= L;
    }
    return out.copy(pts[0]);
  }
  function stepElectrons(dt) {
    let any = false;
    for (const e of electrons) {
      if (!moving(e)) continue;
      any = true;
      if (e.delay > 0) {
        e.delay -= dt;
        continue;
      }
      e.p = Math.min(1, e.p + dt / e.dur);
      if (e.p >= 1) {
        if (e.to[0] === 'G') {
          s.bodies.glass.paired[Number(e.to.slice(1))] = 1;
          e.slot = null;
        } else e.slot = e.to;
        e.from = null;
        e.to = null;
      }
    }
    if (!electrons.some(moving)) {
      if (pendingFlow) relayout(pendingFlow);
      else if (s.watch) {
        const sh = shiftNow();
        if (sh !== laidFor.shift || s.Q !== laidFor.Q) relayout(s.dragging ? T.drag : T.flow);
      }
      if (isSettled()) for (const res of settledWaiters.splice(0)) res();
    }
    return any || electrons.some(moving);
  }
  /** How much of an electron is counted on a region now (0…1): it leaves early on its trip and arrives late. */
  function weightOn(e, region) {
    if (!moving(e)) return e.slot != null && regionOf(e.slot) === region ? 1 : 0;
    let w = 0;
    if (regionOf(e.from) === region) w += 1 - smooth(0, 0.3, e.p);
    if (e.to[0] !== 'G' && regionOf(e.to) === region) w += smooth(0.7, 1, e.p);
    return w;
  }
  /** The charge on each leaf now (beads, + = electrons missing), counting electrons on their way. */
  function leafCharge() {
    if (s.leafOverride != null) return s.leafOverride;
    let l = LEAF_SLOTS;
    let r = LEAF_SLOTS;
    for (const e of electrons) {
      l -= weightOn(e, 'L');
      r -= weightOn(e, 'R');
    }
    return (l + r) / 2;
  }

  // ── the leaves: they swing to the balance the charge gives, smoothly ─────────
  const leaf = { a: 0, w: 0 };
  const OMEGA = 8;
  function stepLeaves(dt, snap = false) {
    const target = leafAngle(leafCharge());
    if (snap) {
      leaf.a = target;
      leaf.w = 0;
    } else {
      const h = Math.min(dt, 0.05);
      leaf.w += (OMEGA * OMEGA * (target - leaf.a) - 2 * OMEGA * leaf.w) * h;
      leaf.a += leaf.w * h;
    }
    scope.setLeaves(leaf.a);
    return Math.abs(target - leaf.a) > 2e-4 || Math.abs(leaf.w) > 2e-3;
  }
  stage.addTicker((dt) => {
    const e = stepElectrons(dt);
    const l = stepLeaves(dt);
    return e || l;
  });

  // ── the bodies on their line ───────────────────────────────────────────────
  function bodyPoint(key, local, out) {
    const b = bodies[key].root;
    return out.copy(local).applyQuaternion(b.quaternion).add(b.position);
  }
  function placeBodies() {
    for (const k of BODY_KEYS) {
      const st = s.bodies[k];
      const b = bodies[k];
      b.root.visible = st.d < 260;
      b.root.position.copy(CONTACT).addScaledVector(OUT, st.d + (k === 'comb' ? 1.5 : 0.6));
      if (b.cloth) {
        b.cloth.visible = st.cloth >= 0;
        if (st.cloth >= 0) b.cloth.position.x = st.cloth;
      }
    }
    bodyAt.glass.copy(bodies.glass.root.position);
  }

  // ── the charges, every frame ────────────────────────────────────────────────
  // A + on the metal never moves. With an electron on its slot it shows as a pair, "+ over −"; bare, it sits alone.
  const cover = new Map(ION_SLOTS.map((id) => [id, 0]));
  const Q1 = new THREE.Vector3();
  const lift = (id) => (id[0] === 'D' ? 3 : 2.4);
  const STACK = 0.46;
  function drawCharges() {
    charges.begin(camera);
    if (!s.hideMetal && s.chips > 0) {
      for (const id of ION_SLOTS) cover.set(id, 0);
      for (const e of electrons) {
        if (!moving(e)) {
          if (e.slot && isIon(e.slot)) cover.set(e.slot, cover.get(e.slot) + 1);
          continue;
        }
        if (isIon(e.from)) cover.set(e.from, cover.get(e.from) + 1 - smooth(0, 0.14, e.p));
        if (isIon(e.to)) cover.set(e.to, cover.get(e.to) + smooth(0.86, 1, e.p));
      }
      for (const id of ION_SLOTS) charges.put('plus', scope.slot(id, Q1), s.chips, lift(id), STACK * Math.min(1, cover.get(id)));
      for (const e of electrons) {
        if (!moving(e)) {
          if (e.slot) charges.put('minus', scope.slot(e.slot, Q1), s.chips, lift(e.slot), isIon(e.slot) ? -STACK : 0);
          continue;
        }
        if (e.delay > 0) {
          charges.put('minus', scope.slot(e.from, Q1), s.chips, lift(e.from), isIon(e.from) ? -STACK : 0);
          continue;
        }
        chain(e);
        let down = 0;
        if (isIon(e.from)) down = Math.max(down, 1 - smooth(0, 0.14, e.p));
        if (isIon(e.to)) down = Math.max(down, smooth(0.86, 1, e.p));
        charges.put('minus', along(e, ease.inOutCubic(e.p), BEAD), s.chips, 3.4, -STACK * down);
      }
    }
    // the bodies' own charges (the unknown rod's are never shown)
    for (const k of ['glass', 'comb']) {
      const st = s.bodies[k];
      if (!bodies[k].root.visible) continue;
      const kind = k === 'glass' ? 'plus' : 'minus';
      const up = k === 'glass' ? GLASS_ROD.r + 1.5 : 3.2;
      st.lit.forEach((a, i) => {
        if (a <= 0.01) return;
        const paired = st.paired[i];
        bodyPoint(k, bodies[k].charges[i], Q1);
        charges.put(kind, Q1, a, up, paired ? STACK : 0);
        if (paired) charges.put('minus', Q1, a, up, -STACK);
      });
    }
    charges.end();
  }

  // ── camera: a gentle three-quarter view of the whole instrument; closer on the disc and leaves for the charges ──
  const BOXES = {
    whole: new THREE.Box3(V(-JAR.r - 4, 0, -JAR.r), V(JAR.r + 4, DISC_TOP + 4, JAR.r)),
    charge: new THREE.Box3(V(-JAR.r - 6, 6, -24), V(186, DISC_TOP + 30, 40)),
  };
  /** The two poses look from the same side; the charges' a little higher, to see the disc's top. */
  const DIRS = { whole: V(0.42, 0.34, 1).normalize(), charge: V(0.42, 0.46, 1).normalize() };
  const poses = { whole: null, charge: null };
  function fitPoses() {
    for (const key of Object.keys(BOXES)) {
      const d = DIRS[key].clone();
      if (s.view === '3d' && !s.userMovedCamera) d.add(V(0.7, 0.15, -0.2)).normalize();
      const p = fitPose({ box: BOXES[key], dir: d, camera, width: stage.width, height: stage.height, margin: MARGIN });
      poses[key] = { target: p.target, position: p.position };
    }
  }
  let camK = 1;
  let camFrom = null;
  function applyCamera() {
    if (s.userMovedCamera) return;
    const g = poses[s.pose];
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
  /** The guided camera flies to the pose (or takes the view back from the student). */
  function flyTo(pose, duration = T.fly) {
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
    if (!was && pose === s.pose && camK >= 1) return Promise.resolve(true);
    s.pose = pose;
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
    const p = flyTo(s.pose, animate ? T.fly : 0);
    emitChange();
    return p;
  }
  const poseOf = (step) => (step === 'intro' || step === 'parts' ? 'whole' : 'charge');

  // ── every frame: the camera, the bodies, the charges (their size in pixels stays the same) ───────────────────
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    placeBodies();
    const dist = camera.position.distanceTo(controls.target);
    charges.setSize(camera, dist, stage.height, stage.height < 300 ? 11 : 14, 7);
    drawCharges();
  });
  stage.onResize(() => {
    fitPoses();
    refresh();
  });

  // ── labels on the picture: short ─────────────────────────────────────────────
  const handleBox = () => dragHandle?.box();
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, noteEl, () => action?.box(), () => action?.ringBox(), () => boxOf(rotate.el), handleBox],
  });
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const spot = (dx, dy) => ({ dx, dy });
  const LEFT_OF = [spot(-22, 0), spot(-22, -18), spot(-22, 18), spot(-30, -34), spot(-30, 34)];
  const RIGHT_OF = [spot(22, 0), spot(22, -18), spot(22, 18), spot(30, -34), spot(30, 34)];
  const ABOVE = [spot(0, -26), spot(-24, -26), spot(24, -26), spot(0, -44)];
  const BELOW = [spot(0, 24), spot(-24, 24), spot(24, 24)];
  const pts = new Map();
  const ptOf = (id) => {
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    return pts.get(id);
  };
  const bodyLabelPoint = (k, at) => () => bodyPoint(k, ptOf(`b-${k}-local`).set(at, k === 'comb' ? 10 : GLASS_ROD.r, 0), ptOf(`b-${k}`));
  const clothPoint = (k) => () => bodyPoint(k, ptOf(`c-${k}-local`).set(Math.max(0, s.bodies[k].cloth), 8, 0), ptOf(`c-${k}`));
  const near = (k) => s.bodies[k].d < 200;
  const LABELS = {
    disc: { text: 'lbl_disc', point: () => scope.points.disc, spots: [...LEFT_OF, ...ABOVE], show: () => s.labelsOn >= 1 },
    rod: { text: 'lbl_rod', point: () => scope.points.rod, spots: LEFT_OF, show: () => s.labelsOn >= 2 },
    leaf: {
      text: 'lbl_leaf',
      point: () => scope.points.leaf(0, ptOf('leaf')),
      spots: [...LEFT_OF, ...BELOW],
      show: () => s.labelsOn >= 3,
    },
    stopper: { text: 'lbl_stopper', point: () => scope.points.stopper, spots: [...LEFT_OF, ...BELOW], show: () => s.labelsOn >= 4 },
    glass: {
      text: 'lbl_glass',
      point: bodyLabelPoint('glass', 46),
      spots: [...ABOVE, ...RIGHT_OF, ...BELOW],
      show: () => near('glass') && s.bodies.glass.cloth < 0 && (s.step !== 'intro' || s.mode === 'quiz'),
    },
    silk: {
      text: 'lbl_silk',
      point: clothPoint('glass'),
      spots: [...ABOVE, ...BELOW],
      show: () => s.bodies.glass.cloth >= 0 && s.bodies.glass.cloth < 200,
    },
    comb: {
      text: 'lbl_comb',
      point: bodyLabelPoint('comb', 24),
      spots: [...ABOVE, ...BELOW],
      show: () => near('comb') && s.bodies.comb.cloth < 0,
    },
    flannel: {
      text: 'lbl_flannel',
      point: clothPoint('comb'),
      spots: [...ABOVE, ...BELOW],
      show: () => s.bodies.comb.cloth >= 0 && s.bodies.comb.cloth < 200,
    },
    unknown: { text: 'lbl_unknown', point: bodyLabelPoint('unknown', 46), spots: [...ABOVE, ...RIGHT_OF, ...BELOW], show: () => near('unknown') },
    before: {
      text: 'lbl_before',
      point: () => scope.points.ghostTip(s.ghost ?? 0, ptOf('before')),
      spots: [...LEFT_OF, ...BELOW],
      show: () => s.ghost != null && Math.abs(s.ghost - leaf.a) > 0.06 && !s.busy,
      optional: true,
    },
  };
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      if (want && !anno.has(id)) {
        const key = typeof L.text === 'function' ? L.text() : L.text;
        anno.add(id, { text: t(key), point: L.point, kind: 'part', spots: L.spots, optional: L.optional });
      } else if (!want && anno.has(id)) anno.remove(id);
    }
  }

  // ── the scene of a step, at once ─────────────────────────────────────────────
  /** Puts everything as the end of `name` has it (a step in SCENES), with no trip. */
  function applyScene(name, extra = {}) {
    const sc = SCENES[name];
    s.Q = sc.Q;
    for (const k of BODY_KEYS) {
      const st = s.bodies[k];
      const def = sc[k] ?? { q: 0, d: D.park };
      st.q = def.q;
      st.d = def.d;
      st.cloth = -1;
      const lit = Math.abs(def.q);
      st.lit = st.lit.map((_, i) => (i < lit ? 1 : 0));
      st.paired.fill(0);
    }
    Object.assign(
      s,
      { labelsOn: name === 'parts' ? 4 : 0, chips: name === 'intro' ? 0 : 1, ghost: null, leafOverride: null, hideMetal: false },
      extra,
    );
    if (name === 'testNeg' || name === 'testPos') s.ghost = leafAngle(sceneLeaf(SCENES.touch));
    scope.setGhost(s.ghost);
    const shift = shiftNow();
    placeElectrons(layout(s.Q, shift));
    laidFor = { Q: s.Q, shift };
    pendingFlow = 0;
    stepLeaves(0, true);
    setGlow(0);
    stage.invalidate();
  }

  // ── small animations ─────────────────────────────────────────────────────────
  const live = (my) => my === s.run;
  function tween(key, duration, onUpdate, my, easing = ease.inOutCubic) {
    return tweener
      .animate({
        key,
        duration,
        ease: easing,
        onUpdate: (k) => {
          if (!live(my)) return;
          onUpdate(k);
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && live(my));
  }
  const wait = (sec, my) => tween('wait', sec, () => {}, my, ease.linear);
  function moveBody(k, d, sec, my) {
    const st = s.bodies[k];
    const from = st.d;
    return tween(`body-${k}`, sec, (x) => (st.d = from + (d - from) * x), my);
  }
  /** The cloth rubs the body: twice along it and back, the body's charges coming up as it passes; then it is pulled
   * off the end. `to`: how many charges the body has after. */
  async function rub(k, to, my) {
    const st = s.bodies[k];
    const start = st.lit.filter((a) => a > 0.5).length;
    st.paired.fill(0);
    st.cloth = 96;
    syncLabels();
    const X = [96, 14, 84, 12, 80];
    const ok = await tween(
      `rub-${k}`,
      T.rub,
      (x) => {
        const seg = Math.min(X.length - 2, Math.floor(x * (X.length - 1)));
        const f = x * (X.length - 1) - seg;
        const w = 0.5 - 0.5 * Math.cos(Math.PI * f);
        st.cloth = X[seg] + (X[seg + 1] - X[seg]) * w;
        const n = start + (to - start) * Math.min(1, x * 1.15);
        st.lit = st.lit.map((_, i) => Math.max(st.lit[i], Math.min(1, Math.max(0, n - i))));
      },
      my,
      ease.linear,
    );
    if (!ok) return false;
    st.q = k === 'comb' ? -to : to;
    st.lit = st.lit.map((_, i) => (i < to ? 1 : 0));
    const off = await tween(`rub-${k}`, T.clothOff, (x) => (st.cloth = 80 + 170 * x), my, ease.inCubic);
    st.cloth = -1;
    syncLabels();
    return off;
  }
  function setGlow(k) {
    for (const m of scope.metal) {
      m.emissive.set(k > 0 || !m.userData.emissive ? '#ffcf6b' : m.userData.emissive);
      m.emissiveIntensity = k > 0 || !m.userData.emissive ? 0.55 * k : m.userData.intensity;
    }
  }
  /** The bodies come in or go, the electrons following them on the way. */
  async function approach(k, d, sec, my) {
    s.watch = true;
    const ok = await moveBody(k, d, sec, my);
    if (!ok) return false;
    await settled();
    return live(my);
  }

  // ── the steps ───────────────────────────────────────────────────────────────
  const PLAYS = {
    async parts(my) {
      s.labelsOn = 0;
      const glow = tween('glow', T.glow, (x) => setGlow(Math.sin(Math.PI * x)), my, ease.linear);
      for (let i = 1; i <= 4; i++) {
        if (!(await wait(T.labels, my))) return false;
        s.labelsOn = i;
        syncLabels();
      }
      if (!(await glow)) return false;
      // what the metal holds: pairs, as many + as −
      return tween('chips', T.chips, (x) => (s.chips = x), my);
    },
    async near(my) {
      const g = s.bodies.glass;
      g.q = 0;
      g.lit.fill(0);
      g.d = D.park;
      if (!(await moveBody('glass', D.rub, T.bodyIn, my))) return false;
      if (!(await rub('glass', RUBBED.glass, my))) return false;
      return approach('glass', D.near, T.approach, my);
    },
    async touch(my) {
      const g = s.bodies.glass;
      if (!(await approach('glass', D.touch, T.touch, my))) return false;
      // some electrons go from the disc into the glass, each to a bare + nearest the tip; the crowd by the rod first
      const onDisc = (e) => e.slot && e.slot[0] === 'D';
      const crowd = (e) => (e.slot[1] === 'X' ? 0 : 1);
      const takers = electrons
        .filter(onDisc)
        .sort((a, b) => crowd(a) - crowd(b))
        .slice(0, TOUCH_TAKES);
      let n = 0;
      for (const e of takers) {
        const i = g.lit.findIndex((a, j) => a > 0.5 && !g.paired[j] && !electrons.some((x) => x.to === `G${j}`));
        if (i < 0) break;
        startTrip(e, `G${i}`, T.transfer, n++ * 0.22);
      }
      stage.invalidate();
      await settled();
      if (!live(my)) return false;
      s.Q += n;
      g.q -= n;
      relayout(T.flow);
      await settled();
      if (!(await wait(0.5, my))) return false;
      return approach('glass', D.park, T.away, my);
    },
    async testNeg(my) {
      s.ghost = leaf.a;
      scope.setGhost(s.ghost);
      const c = s.bodies.comb;
      c.q = 0;
      c.lit.fill(0);
      if (!(await moveBody('comb', D.rub, T.bodyIn, my))) return false;
      if (!(await rub('comb', -RUBBED.comb, my))) return false;
      return approach('comb', D.near, T.approach, my);
    },
    async testPos(my) {
      if (!(await approach('comb', D.park, T.away, my))) return false;
      if (!(await moveBody('glass', D.rub, T.bodyIn, my))) return false;
      if (!(await rub('glass', RUBBED.glass, my))) return false;
      return approach('glass', D.near, T.approach, my);
    },
  };
  function stopAll() {
    s.run++;
    for (const k of ['step', 'wait', 'glow', 'chips', 'rub-glass', 'rub-comb', 'body-glass', 'body-comb', 'body-unknown', 'leak']) tweener.cancel(k);
    s.busy = false;
    s.watch = false;
    s.dragging = false;
    settledWaiters.splice(0);
  }
  /** Plays a step from the end of the one before it (a step word, the action, or আবার দেখো); animate: false lands. */
  async function go(step, { animate = true } = {}) {
    if (!(step in SCENES)) return;
    stopAll();
    const my = s.run;
    hintOff();
    if (!animate || step === 'intro') {
      s.step = step;
      applyScene(step);
      flyTo(poseOf(step), animate ? T.fly : 0);
      s.watch = Boolean(DRAGS[step]);
      done();
      return;
    }
    applyScene(PREV[step], { labelsOn: 0 });
    s.step = step;
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    flyTo(poseOf(step), T.fly);
    if (step !== 'parts') await wait(0.4, my);
    if (!live(my)) return;
    const ok = await PLAYS[step](my);
    if (!ok || !live(my)) return;
    s.busy = false;
    s.watch = Boolean(DRAGS[step]);
    audio.success?.();
    done();
  }
  function done() {
    syncLabels();
    refresh();
    emitChange();
    stage.invalidate();
  }

  // ── the drag: the body in this step, nearer or farther ─────────────────────
  const dragKey = () => (s.mode === 'explore' && !s.busy ? DRAGS[s.step] : null);
  const handlePoint = new THREE.Vector3();
  const trackA = new THREE.Vector3();
  const trackB = new THREE.Vector3();
  let dragFrom = 0;
  let pxPerMm = 1;
  function setDistance(d, { snap = false } = {}) {
    const k = DRAGS[s.step];
    if (!k) return;
    s.bodies[k].d = Math.max(D.near, Math.min(D.far, d));
    s.watch = true;
    if (snap) {
      tweener.cancel(`body-${k}`);
      const shift = shiftNow();
      placeElectrons(layout(s.Q, shift));
      laidFor = { Q: s.Q, shift };
      stepLeaves(0, true);
    }
    stage.invalidate();
    refresh();
  }
  const T0 = new THREE.Vector3();
  const T1 = new THREE.Vector3();
  function measurePx() {
    const k = DRAGS[s.step] ?? 'glass';
    const at = s.bodies[k].d;
    T0.copy(CONTACT).addScaledVector(OUT, at).project(camera);
    T1.copy(CONTACT)
      .addScaledVector(OUT, at + 10)
      .project(camera);
    const dx = ((T1.x - T0.x) * stage.width) / 2;
    const dy = ((T1.y - T0.y) * stage.height) / 2;
    pxPerMm = Math.max(0.2, Math.hypot(dx, dy) / 10);
  }
  const dragHandle = createDragHandle(stage, {
    point: () => {
      const k = DRAGS[s.step] ?? 'glass';
      return bodyPoint(k, handlePoint.set(HANDLE_AT, k === 'comb' ? 5 : 0, 0), handlePoint);
    },
    axis: 'x',
    direction: OUT,
    track: {
      from: () => trackA.copy(CONTACT).addScaledVector(OUT, D.near + HANDLE_AT),
      to: () => trackB.copy(CONTACT).addScaledVector(OUT, D.far + HANDLE_AT),
    },
    label: o.coach ? t('drag_me') : '',
    aria: t('aria_drag'),
    pulse: Boolean(o.coach),
    when: () => Boolean(dragKey()),
    onStart: () => {
      const k = dragKey();
      if (!k) return;
      measurePx();
      dragFrom = s.bodies[k].d;
      s.dragging = true;
      emit('dragstart', { body: k });
    },
    onMove: ({ along: a }) => {
      if (!s.dragging) return;
      setDistance(dragFrom + a / pxPerMm);
    },
    onEnd: () => {
      if (!s.dragging) return;
      s.dragging = false;
      emit('dragend', { body: DRAGS[s.step], d: Math.round(s.bodies[DRAGS[s.step]].d) });
      emitChange();
    },
    onKey: (dir) => {
      if (!dragKey()) return;
      setDistance(s.bodies[DRAGS[s.step]].d + dir * 8);
      emitChange();
    },
  });

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_parts', 1, ICONS.hand],
    parts: ['act_near', 2, ICONS.hand],
    near: ['act_touch', 3, ICONS.hand],
    touch: ['act_comb', 4, ICONS.hand],
    testNeg: ['act_glass', 5, ICONS.hand],
    testPos: ['act_quiz', '', ICONS.chevR],
  };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const replayBtn = /** @type {HTMLButtonElement} */ ($('[data-act="replay"]'));
  const steady = { lead: '', act: '' };
  /** The result line: in a step where the body can be dragged, what it says follows the body's distance. */
  function outcomeKey() {
    const k = DRAGS[s.step];
    if (!k) return `out_${s.step}`;
    const sh = Math.abs(shiftFrom([s.bodies[k]]));
    if (s.step === 'near') return sh >= 2 ? 'out_near' : sh === 1 ? 'out_near_mid' : 'out_near_far';
    return sh >= 1 ? `out_${s.step}` : `out_${s.step}_far`;
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm
      ? `<span class="ge-long">${t('intro')}</span><span class="ge-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('ge-calm', calm);
    }
    sheet.outcome(calm || s.busy ? '' : t(outcomeKey()));
    sheet.rule(calm || s.busy ? '' : t(`rule_${s.step}`));
    sheet.choose(WORD_OF[s.step]);
    const nx = NEXT[s.step];
    sheet.next(nx && WORD_OF[nx] !== WORD_OF[s.step] ? WORD_OF[nx] : null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      // the ring on the instrument: at every step, so the student always sees what to tap next
      if (step !== '' && enabled && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    noteEl.hidden = s.step === 'intro';
    homeBtn.hidden = s.step === 'intro';
    homeBtn.disabled = s.busy;
    replayBtn.hidden = s.step === 'intro';
    replayBtn.disabled = s.busy;
    syncLabels();
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the instrument, a tap on it ──────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const nx = NEXT[s.step];
    if (nx) return go(nx);
    return quiz.start();
  }
  const ringAt = new THREE.Vector3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_parts',
    icon: ICONS.hand,
    // low on the bottle's front: never over the disc's or the leaves' charges
    target: () => ringAt.set(36, 10, 40),
    radius: 22,
    pad: 8,
    avoid: [ui.corner, ui.hint, noteEl, () => anno.boxes()],
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
  function pick(p) {
    if (dragHandle.hit(p.x, p.y)) return false;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(scope.hitMeshes, false).length > 0;
  }
  // a tap (not a turn) on the instrument is the action
  let downAt = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    audio.unlock();
    const p = canvasPoint(e);
    downAt = pick(p) ? { x: p.x, y: p.y, t: now() } : null;
  });
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const p = canvasPoint(e);
    const tap = Math.hypot(p.x - downAt.x, p.y - downAt.y) < 8 && now() - downAt.t < 600;
    downAt = null;
    if (tap) doAction();
  });
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    });
  });

  // ── how to use, in the panel: the rotate pill, the সামনে button, the rod's handle, a tap on the instrument ──
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'tap', text: t('howto_tap'), onTap: () => action?.show('scene') },
      { kind: 'drag', axis: 'x', text: t('howto_drag'), handle: dragHandle, when: () => Boolean(dragKey()) },
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
    const q = leafCharge();
    const shift = shiftNow();
    const settledLeaf = s.leafOverride ?? parts(s.Q, shift).leaf;
    return {
      step: s.step,
      busy: s.busy,
      charge: s.Q, // the electroscope's own charge (beads; + = electrons missing)
      leafCharge: Math.round(q * 100) / 100,
      gap: gapDeg(settledLeaf), // the angle between the leaves (degrees) once they settle
      glass: { q: s.bodies.glass.q, d: Math.round(s.bodies.glass.d) },
      comb: { q: s.bodies.comb.q, d: Math.round(s.bodies.comb.d) },
      drag: DRAGS[s.step] ?? null,
      next: s.step === 'testPos' ? 'quiz' : NEXT[s.step],
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.gap, snap.charge]);
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
  function choicesOf(keys, kind) {
    const items = keys.map((key) => ({ key }));
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ge-opt">${t(list[j].key)}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const KINDS = ['induce', 'spread', 'unknown', 'comb', 'rain'];
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
        stopAll();
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        stopAll();
        s.mode = 'explore';
        s.locked = false;
        s.quizKind = '';
        syncUI();
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive, say) {
        picked = -1;
        stopAll();
        const my = s.run;
        const kind = KINDS[i % KINDS.length];
        s.quizKind = kind;
        flyTo('charge', 0);
        if (kind === 'induce') applyScene('near', { hideMetal: true });
        else if (kind === 'spread') applyScene('touch');
        else if (kind === 'unknown') {
          applyScene('touch', { hideMetal: true });
          s.ghost = leaf.a;
          scope.setGhost(s.ghost);
          const sign = Math.random() < 0.5 ? -1 : 1;
          Object.assign(s.bodies.unknown, { q: 7 * sign, d: D.far + 40 });
          question = { kind, sign };
          syncLabels();
          await wait(0.3, my);
          await approach('unknown', D.near, T.approach, my);
        } else if (kind === 'comb') {
          applyScene('touch', { hideMetal: true });
          s.Q = -TOUCH_TAKES;
          Object.assign(s.bodies.comb, { q: RUBBED.comb + TOUCH_TAKES, d: D.far, lit: s.bodies.comb.lit.map((_, j) => (j < 1 ? 1 : 0)) });
          placeElectrons(layout(s.Q, shiftNow()));
          laidFor = { Q: s.Q, shift: shiftNow() };
          stepLeaves(0, true);
        } else {
          say?.(t('q_rain'));
          applyScene('touch', { hideMetal: true, leafOverride: sceneLeaf(SCENES.touch) });
          stepLeaves(0, true);
          await wait(0.4, my);
          await tween('leak', 3.2, (x) => (s.leafOverride = sceneLeaf(SCENES.touch) * (1 - x) ** 1.5), my, ease.linear);
        }
        syncLabels();
        stage.invalidate();
        if (!alive() || !live(my)) return null;
        if (kind !== 'unknown') question = { kind };
        if (kind === 'induce') return { text: t('q_induce'), ...choicesOf(['c_pos', 'c_neg', 'c_none', 'c_mixed'], kind) };
        if (kind === 'spread') return { text: t('q_spread'), ...choicesOf(['c_sp_right', 'c_sp_opp', 'c_sp_rod', 'c_sp_air'], kind) };
        if (kind === 'unknown') {
          const right = question.sign > 0 ? 'c_pos' : 'c_neg';
          const wrong = question.sign > 0 ? 'c_neg' : 'c_pos';
          return { text: t('q_unknown'), ...choicesOf([right, wrong, 'c_none', 'c_cant'], kind) };
        }
        if (kind === 'comb') return { text: t('q_comb'), ...choicesOf(['c_neg', 'c_pos', 'c_none', 'c_mixed'], kind) };
        return { text: t('q_rain'), ...choicesOf(['c_rain_right', 'c_rain_heavy', 'c_rain_more', 'c_rain_cold'], kind) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        // the answer shows on the picture too (not on the rainy day: the charge has gone, the signs would say otherwise)
        if (question.kind !== 'rain') s.hideMetal = false;
        stage.invalidate();
        if (k === 'induce') return t('why_induce') + note({ c_neg: 'mis_induce_neg', c_none: 'mis_induce_none', c_mixed: 'mis_mixed' });
        if (k === 'spread') return t('why_spread') + note({ c_sp_opp: 'mis_sp_opp', c_sp_rod: 'mis_sp_rod', c_sp_air: 'mis_sp_air' });
        if (k === 'unknown') {
          const why = question.sign > 0 ? 'why_unknown_pos' : 'why_unknown_neg';
          return t(why) + note({ c_pos: 'mis_un_flip', c_neg: 'mis_un_flip', c_none: 'mis_un_none', c_cant: 'mis_un_cant' });
        }
        if (k === 'comb') return t('why_comb') + note({ c_pos: 'mis_comb_pos', c_none: 'mis_comb_none', c_mixed: 'mis_mixed' });
        return t('why_rain') + note({ c_rain_heavy: 'mis_rain_heavy', c_rain_more: 'mis_rain_more', c_rain_cold: 'mis_rain_cold' });
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
  const goHome = () => go('intro', { animate: false });
  const stepOfWord = (w) => (w === 'test' ? 'testNeg' : w);
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && s.mode === 'explore') {
      const step = stepOfWord(b.dataset.example);
      if (s.busy && step === s.step) return;
      go(step);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'home') goHome();
    else if (b.dataset.act === 'replay' && !s.busy && s.step !== 'intro') go(s.step);
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
    else if ((k === 'ArrowLeft' || k === 'ArrowRight') && !onButton && dragKey()) {
      // ← brings the body nearer (it comes in from the right), → takes it away
      setDistance(s.bodies[DRAGS[s.step]].d + (k === 'ArrowRight' ? 8 : -8));
      emitChange();
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  fitPoses();
  syncUI();
  s.step = o.step in SCENES ? o.step : 'intro';
  s.pose = poseOf(s.step);
  s.watch = Boolean(DRAGS[s.step]);
  applyScene(s.step);
  applyCamera();
  placeBodies();
  refresh();
  // parts of later steps are made now (hidden): compile their shaders before the first tap
  stage.warmUp({ show: [...BODY_KEYS.map((k) => bodies[k].root), ...BODY_KEYS.map((k) => bodies[k].cloth).filter(Boolean)] });
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
    /** Change any of: step ('intro' | 'parts' | 'near' | 'touch' | 'testNeg' | 'testPos'), d (mm: the dragged body's
     * distance from the disc, in steps near / testNeg / testPos), view ('front' | '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step) await go(p.step, { animate });
      if (typeof p.d === 'number' && DRAGS[s.step] && !s.busy) setDistance(p.d, { snap: !animate });
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await setView('front', { animate: false });
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The electroscope (jar, stopper, rod, disc, leaves), in millimetres (the GLB is scaled to metres). */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'GoldLeafElectroscope';
      g.add(scope.root.clone(true));
      return g;
    },
  };
}
