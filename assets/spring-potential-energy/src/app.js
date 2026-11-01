// Potential energy of a spring (বিভব শক্তি), book p106–107, topic 4.3.2: the student view. A coil spring is screwed to
// a wall board on a bench; a hand holds the wooden handle at its free end and pulls it out or pushes it in by x (drag
// the handle, tap steppers, or the big button's three steps: 5 cm out, twice as far, now pushed in). The dashed line is
// x = 0 (the spring at rest), the orange bracket is x, read on the ruler below; the hand's force F_P and the spring's
// force F_S are equal and opposite, drawn to scale (F = kx), and the spring's F_S always points back toward x = 0.
// The panel works out F = kx and the book's V = ½kx² live, then compares: twice x, twice the force, four times V.
// The panel is the kit's clean sheet (one action, one result, one rule): docs/student-kit.md.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { AXIS, COIL, createApparatus, X0 } from './apparatus.js';
import { outlinedArrow } from './arrows.js';
import { fitPose } from './camera.js';
import { createHand } from './hand.js';
import { createI18n } from './i18n.js';
import { createRoom } from './scenery.js';
import {
  choicesFrom,
  clampK,
  clampX,
  compare,
  DEFAULTS as START,
  energy,
  energyMistakes,
  force,
  forceMistakes,
  K_RANGE,
  metres,
  plain,
  shuffle,
  stateOf,
  X_RANGE,
} from './spring-maths.js';

export const DEFAULTS = {
  x: START.x, // cm: + pulled out, − pushed in
  k: START.k, // N/m
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the handle pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per quantity, the same in the picture and in the formula (style.css has them too): the hand's force F_P
// green, the spring's force F_S blue, x orange, x = 0 navy (as in the owner's reference picture), the stored energy V
// purple (as the energy figure), the spring and its constant k magenta
const COLORS = { FP: '#2b9a3e', FS: '#1864d6', x: '#f76707', V: '#7048e8', zero: '#1b1f3b', spring: '#e0317a' };
// the labels' text: the same hues, dark enough to read on their white chips (4.5:1 or more)
const INK = { FP: '#237a35', FS: '#1864d6', x: '#c2410c', V: '#6741d9', zero: '#1b1f3b', k: '#c2255c' };
const SCALE = 0.004; // m of arrow per newton (40 N → 16 cm): the arrows are drawn to scale, F = kx
const ARROW_Y = 0.03; // the force arrows run under the spring, above the bench
const BRACKET_Y = 0.215; // the x bracket above the spring
const ZERO_TOP = 0.275; // the dashed x = 0 line reaches above the bracket, so its label clears the x label
const ELEVATION = 22; // degrees: high enough to read the ruler on the bench
const AZIMUTH = 16; // degrees, from the hand's side
const VIEW_3D = new THREE.Vector3(0.6, 0.5, 0.75).normalize();
const XP = new THREE.Vector3(1, 0, 0);
const XN = new THREE.Vector3(-1, 0, 0);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'sp');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel: the three states, the calculator, one action, one result, one rule ──
  const stepper = (q, name) =>
    `<div class="sp-step c-${q}" role="group" aria-label="${t(name)}">
      <span class="sp-name"><span class="sp-word">${t(name).replace(/ [xk]$/, '')} </span><i>${q}</i></span>
      <button type="button" class="sp-btn" data-act="${q}-" aria-label="${t(`${q}_down`)}">${ICONS.minus}</button>
      <b class="sp-val" data-v="${q}" aria-live="polite"></b>
      <button type="button" class="sp-btn" data-act="${q}+" aria-label="${t(`${q}_up`)}">${ICONS.plus}</button>
    </div>`;
  const sheetHtml = cleanSheet(t, {
    examples: {
      label: 'examples',
      results: true,
      items: [
        { id: 'rest', label: 'ex_rest' },
        { id: 'stretched', label: 'ex_stretched' },
        { id: 'compressed', label: 'ex_compressed' },
      ],
    },
    quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
    lines: { action: 1, outcome: 2, rule: 3 },
  }).replace(
    '<p class="pvc-outcome"',
    `<div class="sp-calc" role="group" aria-label="${t('calc')}">${stepper('x', 'calc_x')}${stepper('k', 'calc_k')}</div><p class="pvc-outcome"`,
  );
  const ui = buildStudentShell(root, t, { learn: sheetHtml, learnAlign: 'start' });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the result line is the book's two formulas, each letter a button tied to its part of the picture (k the spring,
  // x the orange bracket, F the arrows, V the stored energy, ½ and the square explained), with the student's numbers
  // in the same colours and a bar under each that grows with the value (the force evenly, the energy as x²)
  const sym = (id, html) =>
    `<button type="button" class="sp-s s-${id}" data-sym="${id}" aria-pressed="false" aria-label="${t(`sym_${id}`)}">${html}</button>`;
  const row = (q, lhs) =>
    `<span class="sp-lhs"><span class="sp-wd">${t(`w_${q}`)} </span>${lhs}</span><span class="sp-sum" data-sum="${q}"></span><span class="sp-res c-${q}" data-res="${q}"></span><span class="sp-bar c-${q}" aria-hidden="true"><span data-bar="${q}"></span></span>`;
  const fx = $('.pvc-outcome');
  fx.innerHTML = `<span class="sp-fx" role="group" aria-label="${t('fx')}">${row('F', `${sym('F', '<i>F</i>')}<span class="sp-eq">=</span>${sym('k', '<i>k</i>')}${sym('x', '<i>x</i>')}`)}${row(
    'V',
    `${sym('V', '<i>V</i>')}<span class="sp-eq">=</span>${sym('half', t('half'))}${sym('k', '<i>k</i>')}${sym('sq', `<span><i>x</i><sup>${N(2)}</sup></span>`)}`,
  )}</span>`;
  const fxEl = {
    box: $('.sp-fx'),
    sum: { F: $('[data-sum="F"]'), V: $('[data-sum="V"]') },
    res: { F: $('[data-res="F"]'), V: $('[data-res="V"]') },
    bar: { F: $('[data-bar="F"]'), V: $('[data-bar="V"]') },
    syms: ui.$$('[data-sym]'),
  };
  const el = {
    x: $('[data-v="x"]'),
    k: $('[data-v="k"]'),
    xminus: $('[data-act="x-"]'),
    xplus: $('[data-act="x+"]'),
    kminus: $('[data-act="k-"]'),
    kplus: $('[data-act="k+"]'),
  };
  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 20, environment: 'studio-light', environmentIntensity: 0.6 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.3;
  controls.maxDistance = 4;
  controls.enablePan = false;
  controls.enableRotate = false;
  // a plain bench before a soft blue wall (src/scenery.js);
  // with bg=transparent only the bench's middle (the GLB's table)
  const world = new THREE.Group();
  world.name = 'SpringPotentialEnergy';
  scene.add(world);
  const room = createRoom();
  if (o.bg !== 'transparent') {
    scene.add(room.root);
    scene.background = room.background;
  }
  // a soft fill from the room (the sky-blue wall above, the wooden bench below)
  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x8a6a4a, 1.0));

  const app = createApparatus({ num: N, unit: t('u_cm'), springColor: COLORS.spring });
  const hand = createHand({ sleeve: '#ffffff' });
  world.add(room.top, app.root, hand.root);

  const helpers = new THREE.Group(); // arrows and guide lines: shown, never exported
  helpers.name = 'Guides';
  helpers.userData.noExport = true;
  scene.add(helpers);
  // bold arrows in a white outline, drawn over the picture (the hand's force runs under its fingers), as in the book's
  // pictures: the two forces under the spring, the x bracket above it (two arrows from its middle)
  const arrowOf = (name, color, radius, head, headRadius, order) => {
    const a = outlinedArrow(name, color, { radius, head, headRadius, order });
    helpers.add(a.root);
    return a;
  };
  const arrows = {
    FP: arrowOf('HandForceFP', COLORS.FP, 0.0048, 0.027, 0.012, 12),
    FS: arrowOf('SpringForceFS', COLORS.FS, 0.0048, 0.027, 0.012, 12),
    xa: arrowOf('StretchXa', COLORS.x, 0.0026, 0.016, 0.0075, 10),
    xb: arrowOf('StretchXb', COLORS.x, 0.0026, 0.016, 0.0075, 10),
  };
  // x = 0: a dashed navy line from the ruler's 0 up past the spring, in a thin white outline so it reads on the wood
  // and the wall (dashes are thin cylinders, so they read on phones; one mesh for the dashes, one for the outline)
  const zeroLine = new THREE.Group();
  zeroLine.name = 'ZeroLine';
  {
    const dashes = (r) => {
      const list = [];
      for (let y = 0.004; y < ZERO_TOP; y += 0.014) {
        const h = Math.min(0.008, ZERO_TOP - y);
        list.push(new THREE.CylinderGeometry(r, r, h + (r - 0.0013) * 2, 8).translate(X0, y + 0.004, 0));
      }
      const g = mergeGeometries(list);
      for (const d of list) d.dispose();
      return g;
    };
    const core = new THREE.Mesh(dashes(0.0013), new THREE.MeshBasicMaterial({ color: COLORS.zero, toneMapped: false }));
    const rim = new THREE.Mesh(dashes(0.0021), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, side: THREE.BackSide }));
    zeroLine.add(rim, core);
  }
  helpers.add(zeroLine);
  // the end's mark: a thin orange line from the ruler up to the bracket, so x reads on the ruler without parallax
  const endLine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0012, 0.0012, 1, 8).translate(0, 0.5, 0),
    new THREE.MeshBasicMaterial({ color: COLORS.x, toneMapped: false }),
  );
  endLine.name = 'EndLine';
  endLine.position.y = 0.003;
  endLine.scale.y = BRACKET_Y + 0.012 - 0.003;
  helpers.add(endLine);

  // ── a letter of the formula lights its part of the picture: it pulses a few times, then stays lit ──
  const FOCUS = {
    F: { arrows: true, labels: ['FP', 'FS'] },
    half: { arrows: true, labels: ['FP', 'FS'] }, // ½: the force grows from 0 to kx while the spring is pulled
    k: { spring: COLORS.spring, labels: ['k'] },
    x: { x: true, labels: ['x'] },
    sq: { x: true, labels: ['x'] },
    V: { spring: COLORS.V, labels: ['V'] },
  };
  const springMat = app.materials.spring;
  const pulse = { t: 0 };
  const PULSE = 2.4; // s: two and a half pulses, ending lit
  // a lit arrow's outline turns from white to a yellow glow
  function glow() {
    const f = FOCUS[s.focus] || {};
    const lit = pulse.t >= PULSE ? 1 : 0.5 - 0.5 * Math.cos((pulse.t / (PULSE / 2.5)) * Math.PI * 2);
    arrows.FP.glow(f.arrows ? lit : 0);
    arrows.FS.glow(f.arrows ? lit : 0);
    arrows.xa.glow(f.x ? lit : 0);
    arrows.xb.glow(f.x ? lit : 0);
    if (f.spring) springMat.emissive.set(f.spring);
    springMat.emissiveIntensity = f.spring ? 0.55 * lit : 0;
    stage.invalidate();
  }
  stage.addTicker((dt) => {
    if (!s.focus || pulse.t >= PULSE) return false;
    pulse.t = Math.min(PULSE, pulse.t + dt);
    glow();
    return true;
  });

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // daylight from the window side, high in front: the spring, the hand and the wall block cast soft shadows on the
  // bench (only the bench and the ruler receive them)
  const sun = new THREE.DirectionalLight(0xfff6ea, 1.9);
  sun.position.set(0.4, 1.6, 0.9);
  sun.target.position.set(0.3, 0, 0);
  scene.add(sun, sun.target);
  if (o.shadow && o.bg !== 'transparent') {
    // PCF in a box fitted round what casts (the wall block, the spring at its longest, the handle, the hand and the
    // forearm), seen from the light: 1024 px for about 0.9 m
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -0.38, right: 0.62, top: 0.45, bottom: -0.16, near: 1.2, far: 2.3 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.0015;
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state: every line, label and arrow is drawn from it ─────────────────
  const s = {
    x: clampX(o.x), // cm, whole: the numbers on screen
    shown: clampX(o.x), // cm, where the spring is drawn now (moves smoothly toward x)
    k: clampK(o.k),
    grip: clampX(o.x) < 0 ? 1 : 0, // the hand: 0 pulls, 1 pushes
    moving: false, // the action's run
    dragging: false,
    seen: { stretched: false, compressed: false, double: false },
    law: false, // all three seen, and the student has moved on since: the rule states the book's formula
    results: { stretched: null, compressed: null },
    history: [], // settled { k, x }, the latest last (for "twice x, four times V")
    cmp: null,
    labels: 'full', // 'full' | 'letters' (the test: forces and energy by their letters only)
    hideFS: false, // the test's first question asks for F_S
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    lastAct: -1e9,
    run: 0, // a token: bumped by anything that cancels a run
    focus: null, // the formula's letter the student tapped: 'F' | 'k' | 'x' | 'half' | 'sq' | 'V' (lit in the picture)
  };
  const F = () => force(s.k, s.x);
  const V = () => energy(s.k, s.x);

  /** A new resting state: remembered for comparisons, and what the student has found out so far. */
  function settle() {
    const now = { k: s.k, x: s.x };
    const last = s.history[s.history.length - 1];
    if (!last || last.k !== now.k || last.x !== now.x) {
      s.cmp = null;
      for (let i = s.history.length - 1; i >= 0 && !s.cmp; i--) s.cmp = compare(s.history[i], now);
      s.history.push(now);
      if (s.history.length > 16) s.history.shift();
    }
    const st = stateOf(s.x);
    if (s.seen.stretched && s.seen.compressed && s.seen.double) s.law = true;
    if (st !== 'rest') {
      s.seen[st] = true;
      s.results[st] = V();
    }
    if (s.cmp) s.seen.double = true;
    place();
    changed();
  }
  /** Forget what the student found out (reset). */
  function forget() {
    s.seen = { stretched: false, compressed: false, double: false };
    s.law = false;
    s.results = { stretched: null, compressed: null };
    s.history = [];
    s.cmp = null;
  }

  // ── what the student sees: spring, hand, arrows, labels ─────────────────────
  const tmp = new THREE.Vector3();
  const bar = new THREE.Vector3();
  function place() {
    const end = X0 + s.shown / 100;
    app.setEnd(end);
    hand.pose(app.barCentre(bar), s.grip);
    const xs = s.shown;
    const Fs = force(s.k, xs);
    const out = xs > 0;
    // F_P: the hand's force on the spring, outward when pulled, inward when pushed; F_S: the spring's, opposite
    const show = Math.abs(xs) >= 0.3;
    if (show) {
      arrows.FP.set(tmp.set(end, ARROW_Y, AXIS.z), out ? XP : XN, Fs * SCALE);
      if (s.hideFS) arrows.FS.hide();
      else arrows.FS.set(tmp.set(end, ARROW_Y, AXIS.z), out ? XN : XP, Fs * SCALE);
      const half = Math.abs(end - X0) / 2;
      const mid = (end + X0) / 2;
      arrows.xa.set(tmp.set(mid, BRACKET_Y, 0), XP, half);
      arrows.xb.set(tmp.set(mid, BRACKET_Y, 0), XN, half);
    } else {
      for (const a of Object.values(arrows)) a.hide();
    }
    endLine.position.x = end;
    endLine.visible = show;
    labels(end, Fs, show);
    panel();
    stage.invalidate();
  }

  // ── labels on the picture (each only while what it names is shown) ──────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
  const shown = new Map();
  const P = {
    zero: new THREE.Vector3(X0, ZERO_TOP + 0.004, 0),
    x: new THREE.Vector3(),
    FP: new THREE.Vector3(),
    FS: new THREE.Vector3(),
    V: new THREE.Vector3(),
  };
  // above the line's top first; when the corner buttons are there (a short phone), beside the line lower down
  const ZERO_SPOTS = [
    { dx: 0, dy: -14 },
    { dx: -30, dy: -6 },
    { dx: 30, dy: -6 },
    { dx: -24, dy: 22 },
    { dx: 24, dy: 22 },
    { dx: -24, dy: 44 },
  ];
  // under the bracket first (between it and the spring), so the x = 0 label above stays clear
  const X_SPOTS = [
    { dx: 0, dy: 15 },
    { dx: 0, dy: -16 },
    { dx: 44, dy: 15 },
  ];
  // pushed in, the bracket ends by the hand and the action's badge: above it first
  const X_SPOTS_IN = [X_SPOTS[1], X_SPOTS[0], { dx: -44, dy: 15 }];
  const ZERO_SPOTS_R = [ZERO_SPOTS[0], ZERO_SPOTS[2], ZERO_SPOTS[1], ZERO_SPOTS[4], ZERO_SPOTS[3], { dx: 24, dy: 44 }];
  const ABOVE = [
    { dx: 0, dy: -16 },
    { dx: 0, dy: -32 },
    { dx: 40, dy: -16 },
  ];
  const TIP_R = [
    { dx: 30, dy: 16 },
    { dx: 26, dy: -16 },
    { dx: 0, dy: 26 },
  ];
  const TIP_L = [
    { dx: -30, dy: 16 },
    { dx: -26, dy: -16 },
    { dx: 0, dy: 26 },
  ];
  function label(id, on, text, point, color, spots, optional = false) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    const was = shown.get(id);
    if (!was) anno.add(id, { text, point: () => point, color, spots, kind: 'part', optional });
    else if (was.text !== text || was.spots !== spots) anno.update(id, { text, spots }); // the spots change with the side
    shown.set(id, { text, spots });
  }
  function labels(end, Fs, show) {
    const letters = s.labels === 'letters';
    const out = s.shown > 0;
    // a label whose letter the student tapped in the formula is filled with its colour
    const lit = FOCUS[s.focus]?.labels || [];
    const hot = (id, text) => (lit.includes(id) ? `<span class="sp-hot">${text}</span>` : text);
    label('zero', true, t('l_zero'), P.zero, INK.zero, s.shown < 0 ? ZERO_SPOTS_R : ZERO_SPOTS);
    P.x.set((end + X0) / 2, BRACKET_Y, 0);
    label('x', show, hot('x', t('l_x', { x: Math.abs(s.x) })), P.x, INK.x, s.shown < 0 ? X_SPOTS_IN : X_SPOTS); // x is given by the picture, also in the test
    const len = Fs * SCALE;
    P.FP.set(end + (out ? len : -len), ARROW_Y, 0);
    P.FS.set(end + (out ? -len : len), ARROW_Y, 0);
    // a label per direction: when the spring goes from pulled to pushed, each label starts again on its arrow's side
    const fp = hot('FP', letters ? t('l_FP_only') : t('l_FP', { F: F() }));
    const fs = hot('FS', letters ? 'F<sub>S</sub>' : t('l_FS', { F: F() }));
    label('FP-out', show && out, fp, P.FP, INK.FP, TIP_R);
    label('FP-in', show && !out, fp, P.FP, INK.FP, TIP_L);
    label('FS-out', show && out && !s.hideFS, fs, P.FS, INK.FS, TIP_L);
    label('FS-in', show && !out && !s.hideFS, fs, P.FS, INK.FS, TIP_R);
    P.V.set(Math.max(0.07, (Math.min(end, X0) - 0.06) / 2), AXIS.y + COIL.radius + 0.004, 0); // over the coils by the wall, clear of the bracket
    // k names the spring itself (shown while its letter is lit, in the stored energy's place)
    label('k', s.focus === 'k', hot('k', t('l_k', { k: s.k })), P.V, INK.k, ABOVE);
    label('V', show && !letters && s.focus !== 'k', hot('V', t('l_V', { V: plain(V()) })), P.V, INK.V, ABOVE, true);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  // the DOM is written only when a value changes (place() runs every frame while the spring moves)
  const text = (node, v) => {
    if (node.textContent !== v) node.textContent = v;
  };
  const off = (node, v) => {
    if (node.disabled !== v) node.disabled = v;
  };
  function panel() {
    text(el.x, `${N(Math.abs(s.x))} ${t('u_cm')}`);
    text(el.k, `${N(s.k)} ${t('u_Nm')}`);
    const lock = s.locked;
    off(el.xminus, lock || s.x <= X_RANGE.min);
    off(el.xplus, lock || s.x >= X_RANGE.max);
    off(el.kminus, lock || s.k <= K_RANGE.min);
    off(el.kplus, lock || s.k >= K_RANGE.max);

    const xm = plain(metres(s.x));
    const vars = { k: s.k, x: Math.abs(s.x), xm, F: F(), V: plain(V()), x2: plain(metres(s.x) ** 2) };
    writeFormula(vars);

    // the rule: what the tapped letter means, else growing with what the student has found out
    let rule;
    const st = stateOf(s.x);
    if (s.focus) rule = `${t(`why_${s.focus}`, vars)}${st === 'rest' && !['k', 'x'].includes(s.focus) ? ` ${t('why_rest')}` : ''}`;
    else if (st === 'rest') rule = s.seen.stretched || s.seen.compressed ? t('rule_rest_after') : t('rule_rest');
    else if (s.cmp && !s.dragging && !s.moving) {
      const prev = { k: s.k, x: (s.x / Math.abs(s.x)) * (Math.abs(s.x) / s.cmp.times) };
      rule = t('rule_times', {
        n: s.cmp.times,
        nn: s.cmp.V,
        x1: Math.abs(prev.x),
        x2: Math.abs(s.x),
        F1: s.cmp.from.F,
        F2: F(),
        V1: plain(s.cmp.from.V),
        V2: plain(V()),
      });
    } else if (s.law) rule = t('rule_law');
    else rule = t(st === 'stretched' ? 'rule_stretched' : 'rule_compressed');
    sheet.rule(rule);

    sheet.choose(st);
    sheet.result('stretched', s.results.stretched == null ? '' : t('res_J', { V: plain(s.results.stretched) }));
    sheet.result('compressed', s.results.compressed == null ? '' : t('res_J', { V: plain(s.results.compressed) }));
    const nx = nextAction();
    sheet.next(stateOf(nx.to[nx.to.length - 1]) !== st ? stateOf(nx.to[nx.to.length - 1]) : null);
    action?.set({ label: nx.label, step: nx.step, enabled: !s.moving && !s.locked });
  }

  /** The formula's numbers and bars, written only when they change (the letters are buttons: never rebuilt). */
  const lastFx = {};
  function writeFormula(v) {
    const n = (cls, x) => `<span class="${cls}">${N(x)}</span>`;
    const op = (c) => `<i class="sp-op">${c}</i>`; // = and ×, spaced by CSS (closer in a narrow panel)
    const parts = {
      sumF: `${op('=')}${n('n-k', v.k)}<span class="sp-u"> N/m</span>${op('×')}${n('n-x', v.xm)}<span class="sp-u"> m</span>`,
      sumV: `${op('=')}<span class="n-half">${t('half')}</span>${op('×')}${n('n-k', v.k)}${op('×')}<span class="n-x">${N(v.xm)}<sup class="n-sq">${N(2)}</sup></span>`,
      resF: `${op('=')}<b>${N(v.F)} N</b>`,
      resV: `${op('=')}<b>${N(v.V)} J</b>`,
    };
    for (const [key, html] of Object.entries(parts)) {
      if (lastFx[key] === html) continue;
      lastFx[key] = html;
      const el = key.startsWith('sum') ? fxEl.sum[key.slice(3)] : fxEl.res[key.slice(3)];
      el.innerHTML = html;
    }
    // the bars: the largest force and energy the figure can show (k 400 N/m, x 10 cm: 40 N, 2 J) fill them
    const wF = `${(100 * v.F) / force(K_RANGE.max, X_RANGE.max)}%`;
    const wV = `${(100 * Number(v.V)) / energy(K_RANGE.max, X_RANGE.max)}%`;
    if (lastFx.wF !== wF) fxEl.bar.F.style.width = lastFx.wF = wF;
    if (lastFx.wV !== wV) fxEl.bar.V.style.width = lastFx.wV = wV;
    if (lastFx.focus === (s.focus || '')) return;
    lastFx.focus = s.focus || '';
    fxEl.box.dataset.focus = lastFx.focus;
    for (const b of fxEl.syms) {
      const on = b.dataset.sym === s.focus;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
  }

  /** Light a letter of the formula, its part of the picture, and say what it means (null: none). */
  function setFocus(f) {
    const next = f && FOCUS[f] ? f : null;
    if (next === s.focus) return;
    s.focus = next;
    pulse.t = 0;
    glow();
    place();
    changed();
  }

  /** What the big button does next: { label, step, to: [cm, …] }. The steps are the student's own. */
  function nextAction() {
    const x = s.x;
    if (!s.seen.stretched) return { label: () => t('act_pull5', { x: 5 }), key: 'act_pull5', step: 1, to: [5] };
    if (!s.seen.double) return { label: 'act_double', key: 'act_double', step: 2, to: x >= 1 && x <= 5 ? [2 * x] : [5, 10] };
    if (!s.seen.compressed) return { label: 'act_push', key: 'act_push', step: 3, to: [-(Math.abs(x) || 5)] };
    if (x !== 0) return { label: 'act_release', key: 'act_release', step: '', to: [0] };
    return { label: 'act_again', key: 'act_again', step: '', to: [5] };
  }

  // ── moving the end: the action's runs, a drag, the steppers ─────────────────
  function snapshot() {
    const nx = nextAction();
    return {
      x: s.x,
      k: s.k,
      xm: metres(s.x),
      F: F(),
      V: V(),
      state: stateOf(s.x),
      seen: { ...s.seen },
      results: { ...s.results },
      compare: s.cmp ? { times: s.cmp.times, F: s.cmp.F, V: s.cmp.V } : null,
      next: { label: nx.key, step: nx.step, to: nx.to },
      moving: s.moving,
      mode: s.mode,
      view: s.view,
      locked: s.locked,
      focus: s.focus,
    };
  }
  let lastEmit = '';
  function changed() {
    const snap = snapshot();
    const keyNow = `${snap.x}|${snap.k}|${snap.moving}|${snap.mode}|${snap.focus}`;
    if (keyNow !== lastEmit) {
      lastEmit = keyNow;
      emit('change', snap);
    }
  }

  // the spring follows s.x smoothly (a drag snaps x to whole cm; the drawing catches up in a few frames)
  stage.addTicker((dt) => {
    let busy = false;
    if (!s.moving && Math.abs(s.shown - s.x) > 1e-4) {
      s.shown += (s.x - s.shown) * Math.min(1, dt * 22);
      if (Math.abs(s.shown - s.x) < 0.02) s.shown = s.x;
      busy = true;
    }
    const gripTo = s.shown < -0.15 || (s.x < 0 && s.shown <= 0) ? 1 : 0;
    if (Math.abs(s.grip - gripTo) > 1e-3) {
      s.grip += (gripTo - s.grip) * Math.min(1, dt * 9);
      if (Math.abs(s.grip - gripTo) < 0.01) s.grip = gripTo;
      busy = true;
    }
    if (busy) place();
    return busy;
  });

  /** Move the end to x (cm) and back to rest there; animate: false jumps. */
  function moveTo(x, { animate = true, settleAfter = true } = {}) {
    const to = clampX(x);
    const token = ++s.run;
    if (!animate) {
      s.moving = false;
      s.x = to;
      s.shown = to;
      s.grip = to < 0 ? 1 : 0;
      tweener.cancel('end');
      if (settleAfter) settle();
      else place();
      return Promise.resolve(true);
    }
    const from = s.shown;
    const dist = Math.abs(to - from);
    if (dist < 1e-3) {
      s.x = to;
      if (settleAfter) settle();
      return Promise.resolve(true);
    }
    s.moving = true;
    changed();
    const duration = 0.35 + 0.06 * dist;
    return tweener
      .animate({
        key: 'end',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (token !== s.run) return;
          s.shown = from + (to - from) * k;
          s.x = clampX(Math.round(s.shown));
          place();
        },
      })
      .finished.then(() => {
        if (token !== s.run) return false;
        s.moving = false;
        s.x = to;
        s.shown = to;
        if (settleAfter) settle();
        return true;
      });
  }
  /** Stop a run where it is (a drag, a stepper, the test): the end keeps its whole-cm place. */
  function cancelRun() {
    s.run++;
    tweener.cancel('end');
    if (s.moving) {
      s.moving = false;
      s.x = clampX(Math.round(s.shown));
    }
  }

  /** The big button (and a tap on the handle). */
  async function act() {
    if (s.locked) return lockedNudge();
    if (performance.now() - s.lastAct < 400) return; // a double tap never undoes the first
    if (s.moving || s.dragging) return;
    s.lastAct = performance.now();
    audio.unlock();
    if (s.focus) setFocus(null); // the step's own words come back
    const nx = nextAction();
    const token = s.run + 1;
    for (const [i, x] of nx.to.entries()) {
      audio.tick();
      const ok = await moveTo(x, { settleAfter: true });
      if (!ok || s.run !== token + i) return;
      if (i < nx.to.length - 1) await new Promise((r) => setTimeout(r, 450));
      if (s.locked) return;
    }
    emit('act', snapshot());
  }

  function changeX(dir) {
    if (s.locked) return lockedNudge();
    cancelRun();
    const x = clampX(s.x + dir);
    if (x === s.x) return;
    s.x = x;
    audio.tick();
    settle();
  }
  function changeK(dir) {
    if (s.locked) return lockedNudge();
    cancelRun();
    const k = clampK(s.k + dir * K_RANGE.step);
    if (k === s.k) return;
    s.k = k;
    audio.tick();
    settle();
  }
  function home() {
    if (s.locked) return lockedNudge();
    moveTo(0);
  }

  // ── camera: the wall, the spring at its longest, the hand, the longest arrow ─
  const box = new THREE.Box3(new THREE.Vector3(-0.02, -0.01, -0.03), new THREE.Vector3(0.52, ZERO_TOP + 0.02, 0.03));
  function viewPose() {
    // a tall view is short of width: turn further toward the hand, so the spring recedes and the hand comes closer
    const tall = stage.width / Math.max(1, stage.height) < 1.2;
    const e = THREE.MathUtils.degToRad(tall ? ELEVATION + 6 : ELEVATION);
    const az = THREE.MathUtils.degToRad(tall ? AZIMUTH + 16 : AZIMUTH);
    const dir = s.view === '3d' ? VIEW_3D : new THREE.Vector3(Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e));
    const top = Math.min(54, stage.height * 0.16);
    return fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: { top, bottom: 8, side: 6 } });
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
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
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
  });

  // ── dragging the handle (a tap on it does the action) ───────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const axisPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -AXIS.z);
  const hitPoint = new THREE.Vector3();
  const drag = { id: null, x0: 0, y0: 0, t0: 0, grab: 0, moved: false };
  function ray(e) {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  /** Where the pointer is along the spring's axis, in m (on the plane through the axis, facing the viewer). */
  function alongAxis(e) {
    ray(e);
    axisPlane.normal.set(0, 0, 1);
    if (s.view === '3d') axisPlane.normal.copy(camera.position).sub(controls.target).setX(0).normalize();
    axisPlane.constant = -axisPlane.normal.dot(tmp.set(0, AXIS.y, AXIS.z));
    return raycaster.ray.intersectPlane(axisPlane, hitPoint) ? hitPoint.x : null;
  }
  // capture phase: the camera controls never see a touch on the handle
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (drag.id != null) return;
      ray(e);
      if (!raycaster.intersectObject(app.hit, false).length) return;
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const ax = alongAxis(e);
      if (ax == null) return;
      Object.assign(drag, { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), grab: ax - (X0 + s.shown / 100), moved: false });
      try {
        ui.canvasHost.setPointerCapture(e.pointerId);
      } catch {
        // a synthetic pointer (tests) cannot be captured; the moves still reach the canvas
      }
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      cancelRun();
      s.dragging = true;
      action?.hide('drag');
      emit('dragstart', snapshot());
    }
    const ax = alongAxis(e);
    if (ax == null) return;
    const x = clampX(Math.round(((ax - drag.grab - X0) * 100) / X_RANGE.step) * X_RANGE.step);
    if (x !== s.x) {
      s.x = x;
      audio.tick();
      place();
      changed();
    }
  });
  const endDrag = (e) => {
    if (e.pointerId !== drag.id) return;
    drag.id = null;
    if (ui.canvasHost.hasPointerCapture?.(e.pointerId)) ui.canvasHost.releasePointerCapture(e.pointerId);
    if (!drag.moved) {
      // a tap on the handle: the same as the big button
      if (e.type === 'pointerup' && performance.now() - drag.t0 < 600) act();
      return;
    }
    s.dragging = false;
    action?.show('drag');
    settle();
    emit('dragend', snapshot());
  };
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    clearTimeout(lockedNudge.timer);
    lockedNudge.timer = setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // the coils, the x bracket and the force arrows on the screen: the action's badge never sits on them
  const area = new THREE.Box3();
  const corner = new THREE.Vector3();
  function screenBox(box3) {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? box3.max.x : box3.min.x, i & 2 ? box3.max.y : box3.min.y, i & 4 ? box3.max.z : box3.min.z).project(camera);
      const x = (corner.x * 0.5 + 0.5) * stage.width;
      const y = (-corner.y * 0.5 + 0.5) * stage.height;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
    return { left, top, right, bottom };
  }
  function coilsBox() {
    area.min.set(0.01, AXIS.y - 0.025, -0.025);
    area.max.set(X0 + s.shown / 100, AXIS.y + 0.025, 0.025);
    return screenBox(area);
  }
  function bracketBox() {
    const end = X0 + s.shown / 100;
    if (Math.abs(end - X0) < 0.003) return null;
    area.min.set(Math.min(end, X0), BRACKET_Y - 0.01, -0.01);
    area.max.set(Math.max(end, X0), BRACKET_Y + 0.01, 0.01);
    return screenBox(area);
  }
  function forcesBox() {
    const end = X0 + s.shown / 100;
    const len = force(s.k, s.shown) * SCALE;
    if (len < 0.003) return null;
    area.min.set(end - len, ARROW_Y - 0.012, -0.012);
    area.max.set(end + len, ARROW_Y + 0.012, 0.012);
    return screenBox(area);
  }

  // ── the action: the big button, and its numbered badge in a ring round the handle ─
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: () => t('act_pull5', { x: 5 }),
    target: () => (s.moving ? null : app.endBox()),
    pad: 10,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), coilsBox, forcesBox, bracketBox],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── the test ────────────────────────────────────────────────────────────────
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const numLabel = (unit) => (c) => `${N(plain(c.value))}<small>${t(unit)}</small>`;
  let saved = null;
  /** Set a question's scene at once: x, k, the labels. */
  function questionScene(x, k, { labelsMode = 'letters', hideFS = false } = {}) {
    cancelRun();
    s.k = k;
    s.labels = labelsMode;
    s.hideFS = hideFS;
    s.userMovedCamera = false;
    moveTo(x, { animate: false, settleAfter: false });
    s.cmp = null;
    flyTo(viewPose(), 0);
  }
  const QUESTIONS = {
    dir() {
      questionScene(-pick([5, 6, 7, 8]), pick([200, 300]), { hideFS: true });
      const choices = [
        { html: t('c_out'), why: null },
        { html: t('c_in'), why: 'm_in' },
        { html: t('c_none'), why: 'm_none' },
        { html: t('c_down'), why: 'm_down' },
      ];
      return { text: t('q_dir'), choices, reveal: () => t('r_dir'), after: 'full' };
    },
    F() {
      const x = pick([4, 6, 8]);
      const k = pick([200, 300, 400]);
      questionScene(x, k);
      const choices = choicesFrom(force(k, x), forceMistakes(k, x));
      return {
        text: t('q_F', { k }),
        choices,
        label: numLabel('u_N'),
        reveal: () => t('r_F', { k, x, xm: plain(metres(x)), F: force(k, x) }),
        after: 'full',
      };
    },
    V() {
      const x = -pick([4, 6, 8, 10]);
      const k = pick([100, 200, 400]);
      questionScene(x, k);
      const choices = choicesFrom(energy(k, x), energyMistakes(k, x));
      return {
        text: t('q_V', { k }),
        choices,
        label: numLabel('u_J'),
        reveal: () => t('r_V', { k, x: -x, xm: plain(metres(x)), V: plain(energy(k, x)) }),
        after: 'full',
      };
    },
    times() {
      const x1 = pick([3, 4]);
      const n = pick([2, 2, 3].filter((m) => m * x1 <= 10));
      const k = 200;
      const x2 = n * x1;
      questionScene(-x2, k);
      const V1 = energy(k, x1);
      const V2 = energy(k, x2);
      const choices = choicesFrom(V2, [
        { value: V1 * n, why: 'm_lin' },
        { value: V1 * n ** 3, why: 'm_cube' },
        { value: V1, why: 'm_same' },
      ]);
      const vars = { x1, x2, n, nn: n * n, V1: plain(V1), V2: plain(V2) };
      return {
        text: t('q_times', vars),
        choices,
        label: numLabel('u_J'),
        reveal: () => t('r_times', vars),
        why: vars,
        after: 'full',
      };
    },
    same() {
      const x = pick([5, 6, 8]);
      const k = pick([200, 400]);
      questionScene(x, k, { labelsMode: 'full' });
      const Vv = energy(k, x);
      const choices = [
        { value: Vv, why: null },
        { value: -Vv, why: 'm_neg' },
        { value: 0, why: 'm_zero' },
        { value: 2 * Vv, why: 'm_twice' },
      ];
      return {
        text: t('q_same', { x, V: plain(Vv) }),
        choices,
        label: (c) => `${N(c.value < 0 ? `−${plain(-c.value)}` : plain(c.value))}<small>${t('u_J')}</small>`,
        reveal: () => t('r_same', { V: plain(Vv) }),
      };
    },
  };
  const ORDER = ['dir', 'F', 'V', 'times', 'same'];
  let currentQ = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: ORDER.length,
    lines: { text: 2, feedback: 4 },
    action,
    hooks: {
      enter() {
        cancelRun();
        setFocus(null);
        saved = { x: s.x, k: s.k };
        s.mode = 'quiz';
        s.locked = true;
        if (drag.id != null) {
          drag.id = null;
          s.dragging = false;
        }
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.labels = 'full';
        s.hideFS = false;
        currentQ = null;
        if (saved) {
          s.k = saved.k;
          moveTo(saved.x, { animate: false });
        }
        s.userMovedCamera = false;
        flyTo(viewPose(), 0.6);
        syncUI();
        place();
      },
      prepare(i, alive) {
        if (!alive()) return null;
        const q = QUESTIONS[ORDER[i]]();
        // the right choice is always the first made: shuffle their order, keep the index
        const order = shuffle(q.choices.map((_, j) => j));
        currentQ = q;
        place();
        return {
          text: q.text,
          choices: order,
          expected: 0,
          tolerance: 0.5,
          label: (j) => (q.label ? q.label(q.choices[j]) : `<span class="sp-opt">${q.choices[j].html}</span>`),
          meta: { question: ORDER[i], x: s.x, k: s.k },
        };
      },
      reveal(_q, correct, picked) {
        const q = currentQ;
        if (!q) return '';
        if (q.after) {
          s.labels = q.after;
          s.hideFS = false;
          place();
        }
        const why = !correct && q.choices[picked.value]?.why;
        return `${q.reveal()}${why ? ` <span class="sp-why">${t(why, q.why)}</span>` : ''}`;
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
    if (s.mode !== 'quiz') ui.hint.classList.remove('show');
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.sym) {
      // a second tap on the same letter puts it out
      setFocus(b.dataset.sym === s.focus ? null : b.dataset.sym);
      audio.tick();
    }
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else {
        // the state's word: the same distance the other way (5 cm when at rest), or back to rest
        const m = Math.abs(s.x) || 5;
        const to = { rest: 0, stretched: m, compressed: -m }[b.dataset.example];
        if (to !== s.x) {
          cancelRun();
          moveTo(to);
        }
      }
    }
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'x-') changeX(-1);
    if (a === 'x+') changeX(1);
    if (a === 'k-') changeK(-1);
    if (a === 'k+') changeK(1);
    if (a === 'home') home();
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (/** @type {Element} */ (e.target).closest?.('.pvc-examples, .pvc-quiz')) return;
    const keys = {
      ArrowRight: () => changeX(1),
      ArrowLeft: () => changeX(-1),
      ArrowUp: () => changeK(1),
      ArrowDown: () => changeK(-1),
      r: home,
      R: home,
    };
    const fn = keys[e.key];
    if (!fn) return;
    e.preventDefault();
    fn();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  moveTo(s.x, { animate: false });
  setView(s.view, { animate: false });
  syncUI();
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
    getState: () => snapshot(),
    /**
     * Change any of: x (cm, + pulled out, − pushed in), k (N/m), act (true: the big button), home (true: back to
     * rest), view, focus (a letter of the formula: 'F' | 'k' | 'x' | 'half' | 'sq' | 'V', or null); animate: false jumps
     * (and waits for nothing).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.focus !== undefined && !s.locked) setFocus(p.focus);
      if (s.locked && (p.x != null || p.k != null || p.act || p.home)) return snapshot();
      if (p.view) await setView(p.view, { animate });
      if (p.k != null) {
        cancelRun();
        s.k = clampK(p.k);
        if (p.x == null) settle();
      }
      if (p.x != null) {
        cancelRun();
        await moveTo(Number(p.x), { animate });
      }
      if (p.home) {
        cancelRun();
        await moveTo(0, { animate });
      }
      if (p.act) await act();
      stage.invalidate();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      cancelRun();
      Object.assign(s, { k: START.k, labels: 'full', hideFS: false });
      setFocus(null);
      forget();
      await moveTo(START.x, { animate: false });
      forget();
      place();
      await setView('front');
      return snapshot();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world,
  };
}
