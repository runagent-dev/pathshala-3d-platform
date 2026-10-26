// A hanging weight pulls a block (book pages 81–82, topic 3.7), student view. A wooden block rests on a smooth bench,
// held by a gate; a string runs from it over a pulley to an iron weight that hangs beside the bench. One tap lets go:
// the weight falls, the block slides, and both speed up together at a = Mg/(M + m), the string's one tension T
// (T = ma on the block, T − Mg = M(−a) on the weight) smaller than Mg. Arrows show the weight Mg (purple), the
// tension T (orange, the same on both bodies) and the acceleration a (teal). The row of words is the book's story in
// four experiments: M = 2 kg, M = 5 kg (a grows), m = 10 kg (a shrinks), and the page-82 example with a mass hanging
// at each end. The panel is the kit's clean sheet (one action, one result, one rule), then a five-question test.
// Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createArrow } from '@shared/arrow.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { BENCH, STRING_Y, createApparatus } from './apparatus.js';
import { fitPose } from './camera.js';
import {
  CALC_PAIRS,
  EXPERIMENTS,
  G,
  IDS,
  M_PAIRS,
  SLOW,
  TWO_PAIRS,
  calcChoices,
  m_PAIRS,
  plain,
  pull,
  round,
  runAt,
  runTime,
  sameChoices,
  solve,
  travel,
  twoChoices,
  twoWeights,
} from './reading.js';

export const DEFAULTS = {
  id: 'w2', // 'w2' | 'w5' | 'heavy' | 'two': the experiment (the row of words)
  at: '', // 0 … 1: start frozen at that part of the run, with the arrows (for pictures)
  tried: '', // experiments already run, e.g. 'w2,w5' (their results show under the words)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the block pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { W: '#7048e8', T: '#e8590c', a: '#0c8599' };
// m of arrow per newton (one scale for all forces in a scene) and per ms⁻²; no arrow is longer than ARROW_MAX (m), so a
// big mass never draws an arrow off the stage
const FORCE_SCALE = { single: 0.0048, two: 0.0028 };
const ACC_SCALE = { single: 0.045, two: 0.07 };
const ARROW_MAX = 0.3;
const NBSP = '\u00a0';
const ZF = 0.2; // the arrows are drawn in a plane in front of the bench, so nothing hides them
const DOUBLE_TAP = 450; // ms
// what the camera shows: the bench from the left a little before the block to beyond the weight (room for labels)
const VIEW_BOXES = {
  single: [new THREE.Vector3(-0.12, 0.05, -0.22), new THREE.Vector3(1.15, 1.12, 0.22)],
  two: [new THREE.Vector3(-1.15, 0.05, -0.22), new THREE.Vector3(1.15, 1.12, 0.22)],
};
const VIEW_DIRS = { front: new THREE.Vector3(-0.1, 0.19, 1), '3d': new THREE.Vector3(-0.58, 0.4, 0.75) };
const MARGIN = { top: 50, bottom: 22, side: 6 };
const DOWN = new THREE.Vector3(0, -1, 0);
const UPV = new THREE.Vector3(0, 1, 0);
const RIGHT = new THREE.Vector3(1, 0, 0);
const LEFT = new THREE.Vector3(-1, 0, 0);
export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'hw');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'experiments', results: true, items: IDS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const note = document.createElement('div');
  note.className = 'hw-note';
  const scaleNote = document.createElement('div');
  scaleNote.className = 'hw-scale';
  ui.stage.append(note, scaleNote);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 0.05, far: 60, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 1;
  controls.maxDistance = 12;
  controls.enablePan = false;
  controls.enableRotate = false;
  const M = createMaterials(stage.renderer);
  const ap = createApparatus({ materials: M });
  scene.add(ap.root);
  const geom = ap.geom;

  let sun = null;
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 1.6, bottom: -0.2, near: 1, far: 9 });
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0004;
    sun.position.set(0.8, 3.4, 2.4);
    sun.target.position.set(0, 0.6, 0);
    scene.add(sun, sun.target);
  }

  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const mkArrow = (name, color) => createArrow({ color, radius: 0.0065, head: 0.04, headRadius: 0.0175, name });
  // arrows: on the weights (W weight, T tension, a acceleration), on the block (T on each side, a)
  const A = {
    rW: mkArrow('WeightArrow', COLORS.W),
    rT: mkArrow('TensionArrow', COLORS.T),
    ra: mkArrow('AccelerationArrow', COLORS.a),
    lW: mkArrow('WeightArrowLeft', COLORS.W),
    lT: mkArrow('TensionArrowLeft', COLORS.T),
    la: mkArrow('AccelerationArrowLeft', COLORS.a),
    bR: mkArrow('BlockTensionRight', COLORS.T),
    bL: mkArrow('BlockTensionLeft', COLORS.T),
    ba: mkArrow('BlockAcceleration', COLORS.a),
  };
  for (const a of Object.values(A)) {
    a.root.userData.noExport = true;
    scene.add(a.root);
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

  const s = {
    id: IDS.includes(o.id) ? o.id : 'w2',
    setup: null,
    sol: null,
    D: 0.4,
    phase: 'ready', // 'ready' | 'run' | 'done'
    hold: null, // a fixed progress (a test's picture, or ?at=): the run is frozen there
    forces: true, // the arrows show once it runs (the test keeps them off until the answer)
    numbers: true, // the labels carry their numbers (the test keeps symbols only until the answer)
    t0: 0,
    results: Object.fromEntries(IDS.map((id) => [id, null])), // a (ms⁻²) of each experiment's last run
    mode: 'explore',
    view: o.view === '3d' ? '3d' : 'front',
    locked: false,
    custom: false, // set({ masses }): other masses than the four experiments
    userMovedCamera: false,
  };
  const now = () => performance.now();
  let lastRelease = Number.NEGATIVE_INFINITY;

  // ── the scene ───────────────────────────────────────────────────────────────
  function loadSetup(setup, { animate = true } = {}) {
    const kindChanged = s.setup?.kind !== setup.kind;
    s.setup = { ...setup };
    s.sol = solve(setup);
    s.D = travel(setup);
    ap.setup(setup);
    controls.enableRotate = s.view === '3d';
    if (kindChanged) s.userMovedCamera = false;
    if (kindChanged || !s.userMovedCamera) flyTo(viewPose(), animate && kindChanged ? 0.7 : 0);
    syncScene();
  }

  /** How far the run has gone, 0 … 1. */
  function progress() {
    if (s.hold != null) return s.hold;
    if (s.phase === 'ready') return 0;
    if (s.phase === 'done') return 1;
    return runAt(s.sol.a, s.D, Math.max(0, (now() - s.t0) / 1000) / SLOW).s / s.D;
  }
  const arrowsOn = () => s.forces && (s.phase !== 'ready' || s.hold != null);

  /** Everything in the picture for now: the bodies, the arrows. */
  function syncScene() {
    if (!s.setup) return;
    ap.place(progress());
    layoutArrows();
    stage.invalidate();
  }

  const at = (x, y, z = ZF) => tmp.set(x, y, z);
  function layoutArrows() {
    for (const a of Object.values(A)) a.hide();
    if (!arrowsOn()) return;
    const { sol, setup } = s;
    const two = setup.kind === 'two';
    const biggest = two ? Math.max(sol.W2, sol.W1, sol.T2, sol.T1) : Math.max(sol.W, sol.T);
    const kf = Math.min(FORCE_SCALE[two ? 'two' : 'single'], ARROW_MAX / biggest);
    const ka = Math.min(ACC_SCALE[two ? 'two' : 'single'], ARROW_MAX / Math.max(sol.a, 1e-6));
    const bk = geom.block;
    if (!two) {
      const r = geom.right;
      A.rW.set(at(r.x, r.com), DOWN, sol.W * kf);
      A.rT.set(at(r.x, r.top), UPV, sol.T * kf);
      A.ra.set(at(r.x + r.size.rBottom + 0.075, r.com), DOWN, sol.a * ka);
      A.bR.set(at(bk.x + bk.w / 2 + 0.012, STRING_Y), RIGHT, sol.T * kf);
      A.ba.set(at(bk.x, BENCH.top - 0.03), RIGHT, sol.a * ka);
      return;
    }
    // two weights: the heavier one (m₂ on the left, or m₁ on the right) falls and the lighter one rises
    const l = geom.left;
    const r = geom.right;
    const leftFalls = sol.left;
    A.lW.set(at(l.x, l.com), DOWN, sol.W2 * kf);
    A.lT.set(at(l.x, l.top), UPV, sol.T2 * kf);
    A.la.set(at(l.x - l.size.rBottom - 0.075, l.com), leftFalls ? DOWN : UPV, sol.a * ka);
    A.rW.set(at(r.x, r.com), DOWN, sol.W1 * kf);
    A.rT.set(at(r.x, r.top), UPV, sol.T1 * kf);
    A.ra.set(at(r.x + r.size.rBottom + 0.075, r.com), leftFalls ? UPV : DOWN, sol.a * ka);
    A.bL.set(at(bk.x - bk.w / 2 - 0.012, STRING_Y), LEFT, sol.T2 * kf);
    A.bR.set(at(bk.x + bk.w / 2 + 0.012, STRING_Y), RIGHT, sol.T1 * kf);
    A.ba.set(at(bk.x, BENCH.top - 0.03), leftFalls ? LEFT : RIGHT, sol.a * ka);
  }

  // ── the run ─────────────────────────────────────────────────────────────────
  /** Two equal masses hold each other: nothing moves (only reachable through set({ masses })). */
  const balanced = () => s.setup.kind === 'two' && s.sol.a < 1e-3;
  function release({ quiet = false, jump = false } = {}) {
    if (s.phase === 'run' && s.hold == null) return;
    if (balanced()) return showHint(t('hint_balanced'), { duration: 3000 });
    s.hold = null;
    s.phase = 'run';
    s.t0 = now();
    if (!quiet) audio.pop();
    emit('release', { id: s.id, ...snapshotSetup() });
    if (jump) finish(true);
    syncScene();
    refresh();
    emitChange();
  }
  function finish(quiet = false) {
    s.phase = 'done';
    s.hold = null;
    if (s.mode === 'explore' && !s.custom) s.results[s.id] = round(s.sol.a, 2);
    if (!quiet) audio.contact();
    emit('stop', { id: s.id, a: round(s.sol.a, 2) });
    syncScene();
    refresh();
    emitChange();
  }
  function tick() {
    if (s.phase !== 'run' || s.hold != null) return false;
    if (now() - s.t0 >= runTime(s.sol.a, s.D) * SLOW * 1000) {
      finish();
      return false;
    }
    syncScene();
    return true;
  }
  stage.addTicker(() => tick());

  /** Back to the start of the run: the gate holds the block again. */
  function goHome() {
    s.phase = 'ready';
    s.hold = null;
    syncScene();
    refresh();
    emitChange();
  }

  /** A new experiment in the row of words: its masses, the block held. */
  function choose(id, { animate = true } = {}) {
    if (!IDS.includes(id)) return;
    s.id = id;
    s.custom = false;
    s.phase = 'ready';
    s.hold = null;
    loadSetup(EXPERIMENTS[id], { animate });
    refresh();
    emitChange();
    emit('experiment', { id });
  }

  // ── the panel: one action, one result, one rule ─────────────────────────────
  const outcomeEl = ui.$('.pvc-outcome');
  const found = (id) => s.results[id] != null;

  /** What the big button does now: let go with this experiment; once it has run, the next experiment not run yet. */
  function plan() {
    const tried = IDS.filter(found).length;
    if (s.phase !== 'done') return { id: s.id, label: 'act_release', step: tried + 1 };
    const next = IDS.find((id) => !found(id) && id !== s.id);
    return next ? { id: next, label: `act_next_${next}`, step: tried + 1 } : { id: s.id, label: 'act_again', step: '' };
  }

  /** The result: what they see, one number (the masses before the run; the speed it gains each second during it). */
  function outcomeHtml() {
    const { sol, setup } = s;
    if (s.phase === 'ready')
      return setup.kind === 'two' ? t('out_ready_two', { m2: setup.m2, m1: setup.m1, m: setup.m }) : t('out_ready', { M: setup.M, m: setup.m });
    return t(s.phase === 'done' ? 'out_done' : 'out_run', { a: plain(sol.a) });
  }

  /** All three single experiments run: the law may be shown, and the picture's words become the symbols. */
  const lawFound = () => found('w2') && found('w5') && found('heavy');
  /** The symbols (M, m, Mg, T, a) only after the student has met every effect (the learn tab, one hanging mass). */
  const symbols = () => s.mode === 'explore' && s.setup.kind === 'single' && lawFound();

  /** The rule: one short sentence per idea, growing with what the student has found; the law last. */
  function ruleHtml() {
    if (s.setup.kind === 'two') {
      if (balanced()) return t('rule_two_balanced');
      return s.phase === 'ready' ? t('rule_two_ready') : t(s.sol.left ? 'rule_two_left' : 'rule_two_right');
    }
    // the law, and under it, small and quiet, the book's own two equations
    if (lawFound()) return `${t('rule_law')}<span class="hw-book">${t('rule_book')}</span>`;
    if (s.phase === 'ready') return t('rule_ready');
    if (s.id === 'w2') return t(found('w5') ? 'rule_more_M' : 'rule_first');
    if (s.id === 'w5') return t(found('w2') ? 'rule_more_M' : found('heavy') ? 'rule_more_m' : 'rule_first');
    return t(found('w5') ? 'rule_more_m' : 'rule_first');
  }

  let lastKind = '';
  let lastNote = '';
  function refresh() {
    if (!s.setup) return;
    sheet.choose(s.id);
    for (const id of IDS) sheet.result(id, found(id) ? t('res_a', { a: plain(s.results[id]) }) : '');
    sheet.outcome(outcomeHtml());
    const kind = s.phase === 'ready' ? 'ready' : 'run';
    if (kind !== lastKind) outcomeEl.dataset.k = lastKind = kind;
    sheet.rule(ruleHtml());
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label });
      sheet.next(p.id !== s.id ? p.id : null);
      // the ring shows on the block while it waits, never while it moves or stands at the end of a run
      if (s.phase === 'ready' && s.hold == null) action.show('run');
      else action.hide('run');
    }
    // the honest notes on the stage
    const body = t(stage.width < 480 ? 'note_body_short' : 'note_body', { k: SLOW });
    const text = `<b>${t('note_head')}</b> <span>${body}</span>`;
    if (text !== lastNote) {
      note.innerHTML = text;
      lastNote = text;
    }
    scaleNote.textContent = arrowsOn() ? t(s.phase === 'done' ? 'note_scale_done' : 'note_scale') : '';
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const P0 = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp2.copy(p).project(camera);
    out.x = (tmp2.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp2.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  const arrowBoxList = [];
  /** Boxes of the arrows on the screen (labels keep off them). */
  function arrowBoxes() {
    arrowBoxList.length = 0;
    for (const a of Object.values(A)) {
      if (!a.root.visible) continue;
      toScreen(a.root.position, P0);
      toScreen(a.tip, P1);
      arrowBoxList.push({
        left: Math.min(P0.x, P1.x) - 5,
        top: Math.min(P0.y, P1.y) - 5,
        right: Math.max(P0.x, P1.x) + 5,
        bottom: Math.max(P0.y, P1.y) + 5,
      });
    }
    return arrowBoxList.slice();
  }
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const tmpBox = new THREE.Box3();
  function screenBox(obj) {
    tmpBox.setFromObject(obj);
    if (tmpBox.isEmpty()) return null;
    let i = 0;
    for (const x of [tmpBox.min.x, tmpBox.max.x])
      for (const y of [tmpBox.min.y, tmpBox.max.y]) for (const z of [tmpBox.min.z, tmpBox.max.z]) corners[i++].set(x, y, z).project(camera);
    const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
    const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }
  /** The block and the weights on the screen (force labels keep off them). */
  function bodyBoxes() {
    const list = [ap.blockBody, ap.weightBody('right'), ...(s.setup?.kind === 'two' ? [ap.weightBody('left')] : [])];
    return list.map(screenBox).filter(Boolean);
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, note, scaleNote, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });

  const spot = (dx, dy) => ({ dx, dy });
  // spots for a label next to an arrow's tip: on the bench side of a weight ("in"), or away from it ("out")
  const SIDE_R = [spot(12, 0), spot(12, 16), spot(12, -16), spot(12, 32), spot(12, -32)];
  const SIDE_L = [spot(-12, 0), spot(-12, 16), spot(-12, -16), spot(-12, 32), spot(-12, -32)];
  const IN_R = [...SIDE_L, ...SIDE_R];
  const IN_L = [...SIDE_R, ...SIDE_L];
  const OUT_R = [...SIDE_R, ...SIDE_L];
  const OUT_L = [...SIDE_L, ...SIDE_R];
  // the T on the block: above its head; to its right, or below, when the corner buttons or the note are in the way
  const T_BLOCK = [spot(36, -15), spot(36, -33), spot(0, -33), spot(0, -15), spot(12, 0), spot(0, 18), spot(0, 36)];
  const T_BLOCK_L = [spot(-36, -15), spot(-36, -33), spot(0, -33), spot(0, -15), spot(-12, 0), spot(0, 18), spot(0, 36)];
  const BELOW = [spot(0, 16), spot(0, 34), spot(14, 16), spot(-14, 16)];
  const RIGHT_OF = [spot(12, 0), spot(12, 16), spot(12, -16)];
  const A_BLOCK = [spot(-8, 16), spot(-8, 34), spot(0, 16), spot(0, 34), ...RIGHT_OF];
  const AROUND = [spot(0, 16), spot(0, 34), spot(0, -16), spot(0, -34)]; // above or below a weight's acceleration arrow

  const blockTop = new THREE.Vector3();
  const weightMid = { right: new THREE.Vector3(), left: new THREE.Vector3() };
  const labelState = new Map(); // id → the text now shown
  const want = new Map();
  // optional: a label that finds no clear place stays hidden (its arrow is named by the same colour's other label)
  function addLabel(id, { text, point, spots, color, kind = 'force', own = [], optional = false }) {
    want.set(id, { text, point, spots, color, kind, own, optional });
  }
  function syncLabels() {
    want.clear();
    const two = s.setup.kind === 'two';
    const sol = s.sol;
    const on = arrowsOn();
    const compact = stage.height < 250 || stage.width < 350; // a small view: only the labels that matter
    const sym = symbols();
    // a label is the word (ওজন, টান, ত্বরণ), or its symbol once the law has been shown; it carries a number only where
    // it matters, and the test keeps the numbers off until the answer
    const name = (k) => t(sym ? `nm_${k}_sym` : `nm_${k}`);
    const label = (k, numbered, v, unit) =>
      s.numbers && numbered ? t(`${sym ? 'lbl_sym' : 'lbl_plain'}_${unit}`, { name: name(k), v: plain(v) }) : name(k);
    // two weights: always the words (বাম, ডান): the symbols m₁, m₂, T₁, T₂ are left to the book
    const side = (k, numbered, v, unit) => (s.numbers && numbered ? t(`lbl_plain_${unit}`, { name: t(`nm_${k}`), v: plain(v) }) : t(`nm_${k}`));
    // the masses: a weight's label sits beside it, clear of its ring (the weight's width on the screen sets how far)
    const away = (sd, dir) => {
      const b = screenBox(ap.weightBody(sd));
      const d = (b ? ((b.right - b.left) / 2) * 1.3 : 24) + 22;
      return [spot(dir * d, 0), spot(dir * d, -20), spot(dir * d, 20), spot(-dir * d, 0)];
    };
    addLabel('m', {
      kind: 'mass-on', // printed on the block
      text: t(sym ? 'lbl_block_sym' : 'lbl_block', { m: s.setup.m }),
      point: () => blockTop.set(geom.block.x, BENCH.top + geom.block.h / 2, 0),
      spots: [spot(0, 0)],
    });
    if (two) {
      addLabel('mL', {
        kind: 'mass',
        text: t('lbl_left', { m: s.setup.m2 }),
        point: () => weightMid.left.set(geom.left.x, geom.left.com, 0),
        spots: away('left', 1),
      });
      addLabel('mR', {
        kind: 'mass',
        text: t('lbl_right', { m: s.setup.m1 }),
        point: () => weightMid.right.set(geom.right.x, geom.right.com, 0),
        spots: away('right', -1),
      });
    } else {
      addLabel('mR', {
        kind: 'mass',
        text: t(sym ? 'lbl_hang_sym' : 'lbl_hang', { M: s.setup.M }),
        point: () => weightMid.right.set(geom.right.x, geom.right.com, 0),
        spots: away('right', -1),
      });
    }
    if (on) {
      const own = [bodyBoxes];
      // the ones that matter first (they choose their places first); then the ones on the weights, which hide when crowded
      if (!two) {
        addLabel('bR', { text: label('T', true, sol.T, 'N'), point: () => A.bR.tip, spots: T_BLOCK, color: COLORS.T, own });
        addLabel('rW', { text: label('W', true, sol.W, 'N'), point: () => A.rW.tip, spots: IN_R, color: COLORS.W, own });
        addLabel('ba', {
          text: label('a', true, sol.a, 'a'),
          point: () => A.ba.tip,
          spots: A_BLOCK, // under its arrow and left of its head: clear of the string by the pulley
          color: COLORS.a,
          own,
          optional: true,
        });
        if (!compact) {
          addLabel('rT', { text: label('T', false), point: () => A.rT.tip, spots: IN_R, color: COLORS.T, own, optional: true });
          addLabel('ra', {
            text: label('a', false),
            point: () => A.ra.tip,
            spots: [...OUT_R, ...IN_R, ...AROUND],
            color: COLORS.a,
            own,
            optional: true,
          });
        }
      } else {
        addLabel('bL', { text: side('Tl', true, sol.T2, 'N'), point: () => A.bL.tip, spots: T_BLOCK_L, color: COLORS.T, own });
        addLabel('bR', { text: side('Tr', true, sol.T1, 'N'), point: () => A.bR.tip, spots: T_BLOCK, color: COLORS.T, own });
        addLabel('lW', { text: side('Wl', false), point: () => A.lW.tip, spots: IN_L, color: COLORS.W, own, optional: true });
        addLabel('rW', { text: side('Wr', false), point: () => A.rW.tip, spots: IN_R, color: COLORS.W, own, optional: true });
        addLabel('ba', { text: side('a', true, sol.a, 'a'), point: () => A.ba.tip, spots: BELOW, color: COLORS.a, own, optional: true });
        if (!compact) {
          addLabel('lT', { text: side('T', false), point: () => A.lT.tip, spots: IN_L, color: COLORS.T, own, optional: true });
          addLabel('rT', { text: side('T', false), point: () => A.rT.tip, spots: IN_R, color: COLORS.T, own, optional: true });
          addLabel('la', {
            text: side('a', false),
            point: () => A.la.tip,
            spots: [...OUT_L, ...IN_L, ...AROUND],
            color: COLORS.a,
            own,
            optional: true,
          });
          addLabel('ra', {
            text: side('a', false),
            point: () => A.ra.tip,
            spots: [...OUT_R, ...IN_R, ...AROUND],
            color: COLORS.a,
            own,
            optional: true,
          });
        }
      }
    }
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${s.setup.kind}|${w.spots.map((p) => `${Math.round(p.dx)},${p.dy}`).join(';')}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: w.kind, color: w.color, spots: w.spots, avoid: w.own, optional: w.optional });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  function viewPose() {
    const [min, max] = VIEW_BOXES[s.setup?.kind === 'two' ? 'two' : 'single'];
    box.min.copy(min);
    box.max.copy(max);
    // a wide, short view (a book column): show more of the bench on the left, so the picture fills the frame
    if (s.setup?.kind !== 'two' && stage.width / Math.max(1, stage.height) > 2.3) box.min.x = -0.5;
    return fitPose({ box, dir: VIEW_DIRS[s.view].clone().normalize(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function flyTo({ position, target }, duration = 0.7) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
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
          camera.position.lerpVectors(p0, position, k);
          controls.target.lerpVectors(t0, target, k);
          controls.update();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (done) refresh(); // the labels' places depend on how big things now are on the screen
        return done;
      });
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

  // ── the action: the big button, the ring on the block, a tap on the block or the weight ────────────────────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (s.phase === 'run') return;
    if (now() - lastRelease < DOUBLE_TAP) return; // a double tap must not skip an experiment
    lastRelease = now();
    hintOff();
    const p = plan();
    if (s.phase === 'done' || p.id !== s.id) choose(p.id, { animate: true });
    release();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_release',
    // the block (held by the gate); with two weights, the heavier one (the block sits too near the corner buttons)
    target: () => (s.setup?.kind === 'two' ? ap.weightBody(s.sol?.left === false ? 'right' : 'left') : ap.blockBody),
    pad: 8,
    avoid: [ui.corner, ui.hint, note, scaleNote, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // touching the scene: the block or a weight lets go
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const targets = [ap.blockHit, ap.weightR.group, ...(s.setup?.kind === 'two' ? [ap.weightL.group] : [])];
    return raycaster.intersectObjects(targets, true).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (s.phase === 'run') {
        if (now() - lastRelease > DOUBLE_TAP) showHint(t('hint_wait'), { duration: 2400 });
        return;
      }
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

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshotSetup() {
    const { setup, sol } = s;
    const base = { kind: setup.kind, m: setup.m, a: round(sol.a, 3) };
    return setup.kind === 'two'
      ? { ...base, m2: setup.m2, m1: setup.m1, T2: round(sol.T2, 3), T1: round(sol.T1, 3), towards: sol.left ? 'left' : 'right' }
      : { ...base, M: setup.M, W: round(sol.W, 3), T: round(sol.T, 3) };
  }
  function snapshot() {
    const p = plan();
    return {
      id: s.id,
      ...snapshotSetup(),
      phase: s.phase, // 'ready' | 'run' | 'done'
      progress: round(progress(), 3), // 0 … 1 of the way (the block's travel and the weight's fall)
      distance: round(progress() * s.D, 3), // m
      results: { ...s.results }, // a of each experiment run so far (ms⁻²), or null
      view: s.view,
      mode: s.mode,
      next: { id: p.id, step: p.step }, // what the big button does now
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.id, snap.kind, snap.M, snap.m, snap.phase, snap.results, snap.mode, snap.view]);
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
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  /** Four tap choices (the right one first in `items`): shuffled, with the index of the right one. */
  function choicesOf(items, kind, label, extra = {}) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="hw-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key, ...extra },
    };
  }

  /** A scene for a question: these masses, the block held, nothing moving. */
  function showScene(setup, { hold = null, forces = false, numbers = false } = {}) {
    s.phase = hold != null ? 'run' : 'ready';
    s.hold = hold;
    s.forces = forces;
    s.numbers = numbers;
    loadSetup(setup, { animate: false });
    refresh();
  }
  /** Shows the answer: the numbers on, the scene runs (or, if frozen, stays frozen with its numbers). */
  function reveal({ run = true } = {}) {
    s.forces = true;
    s.numbers = true;
    if (run && s.hold == null) release({ quiet: true });
    else syncScene();
    refresh();
  }

  let learnSaved = null;
  let question = null;
  let picked = -1;
  const unit = () => t('u_a');
  const aText = (v) => `${N(plain(v))}${NBSP}${unit()}`;

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
        learnSaved = { id: s.id, results: { ...s.results } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.forces = true;
        s.numbers = true;
        s.results = { ...(learnSaved?.results || s.results) };
        syncUI();
        choose(learnSaved?.id || s.id, { animate: false });
        setView(s.view, { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['calc', pickOne(['M', 'm']), 'tension', 'same', 'two'][i % 5];
        if (kind === 'calc') {
          const [Mm, m] = pickOne(CALC_PAIRS);
          const items = calcChoices(Mm, m);
          showScene({ kind: 'single', M: Mm, m });
          question = { kind, M: Mm, m, a: items[0].v };
          return { text: t('q_calc', { g: G }), ...choicesOf(items, kind, (x) => aText(x.v), { M: Mm, m }) };
        }
        if (kind === 'M') {
          const [Mm, m] = pickOne(M_PAIRS);
          const a1 = round(pull(Mm, m).a, 2);
          const a2 = round(pull(2 * Mm, m).a, 2);
          const items = ['c_M_more', 'c_M_double', 'c_M_same', 'c_M_less'].map((key) => ({ key }));
          showScene({ kind: 'single', M: Mm, m });
          question = { kind, M: Mm, m, a1, a2 };
          return { text: t('q_M'), ...choicesOf(items, kind, (x) => t(x.key), { M: Mm, m }) };
        }
        if (kind === 'm') {
          const [Mm, m] = pickOne(m_PAIRS);
          const a1 = round(pull(Mm, m).a, 2);
          const a2 = round(pull(Mm, 2 * m).a, 2);
          const items = ['c_m_less', 'c_m_half', 'c_m_same', 'c_m_more'].map((key) => ({ key }));
          showScene({ kind: 'single', M: Mm, m });
          question = { kind, M: Mm, m, a1, a2 };
          return { text: t('q_m'), ...choicesOf(items, kind, (x) => t(x.key), { M: Mm, m }) };
        }
        if (kind === 'tension') {
          const [Mm, m] = pickOne(CALC_PAIRS);
          showScene({ kind: 'single', M: Mm, m }, { hold: 0.5, forces: true, numbers: false });
          question = { kind, M: Mm, m };
          const items = ['c_T_less', 'c_T_equal', 'c_T_more', 'c_T_zero'].map((key) => ({ key }));
          return { text: t('q_tension'), ...choicesOf(items, kind, (x) => t(x.key), { M: Mm, m }) };
        }
        if (kind === 'same') {
          // the string's pull on the block is written on the picture: how big is it on the hanging mass?
          const [Mm, m] = pickOne(CALC_PAIRS);
          const items = sameChoices(Mm, m);
          showScene({ kind: 'single', M: Mm, m }, { hold: 0.5, forces: true, numbers: true });
          question = { kind, M: Mm, m, T: items[0].v };
          const word = { same: 'c_same_same', weight: 'c_same_weight', zero: 'c_same_zero', sum: 'c_same_sum' };
          return {
            text: t('q_same'),
            ...choicesOf(items, kind, (x) => t(word[x.key], { T: plain(x.v), W: plain(x.v), T2: plain(x.v) }), { M: Mm, m }),
          };
        }
        // two weights (the page-82 example): which way, and a
        const [m2, m1, m] = pickOne(TWO_PAIRS);
        const sol = twoWeights(m2, m1, m);
        const big = Math.max(m1, m2);
        const small = Math.min(m1, m2);
        const a = round(sol.a, 2);
        const items = twoChoices(m2, m1, m);
        showScene({ kind: 'two', m2, m1, m });
        question = { kind: 'two', m2, m1, m, a, big, small, sol };
        if (!alive()) return null;
        return {
          text: t('q_two', { g: G }),
          ...choicesOf(items, 'two', (x) => `${t(x.left ? 'side_left' : 'side_right')},${NBSP}<b>${aText(x.v)}</b>`, { m2, m1, m }),
        };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note2 = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        if (k === 'calc') {
          reveal();
          return (
            t('why_calc', { M: question.M, m: question.m, g: G, a: plain(question.a) }) + note2({ swap: 'mis_swap', block: 'mis_block', g: 'mis_g' })
          );
        }
        if (k === 'M') {
          loadSetup({ kind: 'single', M: 2 * question.M, m: question.m }, { animate: false });
          reveal();
          return (
            t('why_M', { a1: plain(question.a1), a2: plain(question.a2) }) +
            note2({ c_M_double: 'not_M_double', c_M_same: 'not_M_same', c_M_less: 'not_M_less' })
          );
        }
        if (k === 'm') {
          loadSetup({ kind: 'single', M: question.M, m: 2 * question.m }, { animate: false });
          reveal();
          return (
            t('why_m', { a1: plain(question.a1), a2: plain(question.a2) }) +
            note2({ c_m_half: 'not_m_half', c_m_same: 'not_m_same', c_m_more: 'not_m_more' })
          );
        }
        if (k === 'tension') {
          reveal();
          const sol = solve({ kind: 'single', M: question.M, m: question.m });
          return (
            t('why_tension', { W: plain(sol.W), T: plain(sol.T) }) +
            note2({ c_T_equal: 'not_T_equal', c_T_more: 'not_T_more', c_T_zero: 'not_T_zero' })
          );
        }
        if (k === 'same') {
          reveal();
          return t('why_same', { T: plain(question.T) }) + note2({ weight: 'not_same_weight', zero: 'not_same_zero', sum: 'not_same_sum' });
        }
        reveal();
        const sol = question.sol;
        return (
          t('why_two', {
            side: t(sol.left ? 'side_left' : 'side_right'),
            a: plain(question.a),
            big: question.big,
            small: question.small,
            g: G,
            m: question.m,
            T2: plain(sol.T2),
            T1: plain(sol.T1),
          }) + note2({ side: 'not_two_side', one: 'not_two_one', nomass: 'not_two_nomass' })
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
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey = ['1', '2', '3', '4', 'r', 'R', 'Home', 'ArrowRight'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3', '4'].includes(k)) choose(IDS[Number(k) - 1]);
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  for (const id of String(o.tried || '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => IDS.includes(x)))
    s.results[id] = round(solve(EXPERIMENTS[id]).a, 2);
  loadSetup(EXPERIMENTS[s.id], { animate: false });
  syncUI();
  const startAt = o.at === '' || o.at == null ? null : Number(o.at);
  if (startAt != null && Number.isFinite(startAt)) {
    s.phase = 'run';
    s.hold = Math.min(1, Math.max(0, startAt));
    if (s.hold >= 1) {
      s.hold = null;
      s.phase = 'done';
    }
    syncScene();
  }
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
     * Change any of: id ('w2' | 'w5' | 'heavy' | 'two'), release (true: let go; with animate: false it lands at the end),
     * at (0 … 1: frozen that far into the run, with the arrows), masses ({ M, m } or { m2, m1, m } in kg), home (true:
     * the block held again), view; tried
     * (experiments whose results show, e.g. ['w2']).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.id) choose(p.id, { animate });
      if (p.masses) {
        // other masses (kg): { M, m } for one hanging mass, { m2, m1, m } for one at each end; the block is held
        const k = p.masses;
        const kg = (x, fallback) => Math.min(20, Math.max(0.5, Number(x) || fallback));
        const setup =
          k.m2 != null || k.m1 != null
            ? { kind: 'two', m2: kg(k.m2, 10), m1: kg(k.m1, 5), m: kg(k.m, 5) }
            : { kind: 'single', M: kg(k.M, 2), m: kg(k.m, 5) };
        s.custom = true; // not one of the four experiments: its run is not kept in the row of words
        s.phase = 'ready';
        s.hold = null;
        loadSetup(setup, { animate });
        refresh();
      }
      if (p.tried) {
        for (const id of (Array.isArray(p.tried) ? p.tried : String(p.tried).split(',')).filter((x) => IDS.includes(x)))
          s.results[id] = round(solve(EXPERIMENTS[id]).a, 2);
        refresh();
      }
      if (p.home) goHome();
      if (p.at != null) {
        s.phase = 'run';
        s.hold = Math.min(1, Math.max(0, Number(p.at) || 0));
        syncScene();
        refresh();
      }
      if (p.release) {
        s.hold = null;
        release({ quiet: true, jump: !animate });
      }
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.results = Object.fromEntries(IDS.map((id) => [id, null]));
      s.view = 'front';
      s.forces = true;
      s.numbers = true;
      syncUI();
      choose('w2', { animate: false });
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The bench, the block, the pulley(s), the string(s) and the weight(s) as they stand, in metres. */
    exportRoot() {
      return ap.root.clone(true);
    },
  };
}
