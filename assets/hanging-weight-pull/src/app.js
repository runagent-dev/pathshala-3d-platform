// Newton's second law with a rope over a pulley (book pages 81–83, topic 3.7), student view. A village well, cut in
// half so its shaft can be seen: a man pulls a rope over the well's pulley and a bucket of water hangs from its other
// end. One light rope over a smooth pulley carries one tension T, so his pull is the rope's pull on the bucket. The
// student chooses the pull T and the bucket with its water M (steppers, or the row of words: ধরে রাখো, জোরে টানো, কম
// টানো, বেশি পানি) and the panel works out the book's law for the bucket live, up being positive: T − Mg = Ma, so
// a = (T − Mg)/M. One tap runs it: he pulls hand over hand (or lets the rope slip), the bucket speeds up (up or down)
// or stays where it is, and arrows show T at the bucket and at his fists (the same number), the weight Mg and the
// acceleration a. The book's own pictures (চিত্র ৩.০৯: a hanging mass pulls a block on a smooth table; চিত্র ৩.১০: a
// mass at each end) open in the উদাহরণ window (example.js), solved line by line. Then a five-question test.
// Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { boldArrow } from './arrows.js';
import { createI18n } from './i18n.js';
import { BUCKET_SIZE, KNOT, createBucket } from './bucket.js';
import { fitPose } from './camera.js';
import { createExample } from './example.js';
import { createPerson } from './person.js';
import {
  CALC_SETS,
  EASE_SETS,
  EXPERIMENTS,
  FULL_SETS,
  G,
  HOLD_MASSES,
  IDS,
  LIMITS,
  SHAFT,
  SLOW,
  bucketAt,
  calcChoices,
  fixLift,
  fullChoices,
  holdChoices,
  lift,
  plain,
  round,
  runSeconds,
  signed,
} from './reading.js';
import { createRope, tangentAngle } from './rope.js';
import { PULLEY, createWell } from './well.js';

export const DEFAULTS = {
  id: 'hold', // 'hold' | 'pull' | 'ease' | 'full': the experiment (the row of words)
  at: '', // 0 … 1: start frozen at that part of the run, with the arrows (for pictures)
  tried: '', // experiments already run, e.g. 'hold,pull' (their results show under the words)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the bucket pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { W: '#7048e8', T: '#e8590c', a: '#0c8599', F: '#212529' };
const FORCE_SCALE = 0.0056; // m of arrow per newton (98 N → 0.55 m)
const ACC_SCALE = 0.13; // m of arrow per ms⁻²
const ARROW_MAX = 1.1;
const NBSP = ' ';
const DOUBLE_TAP = 450; // ms
const ZF = 0.24; // the bucket's arrows are drawn this far in front of the rope, so nothing hides them
// the person: where he stands (world), the line his fists hold on the rope, the stroke of one hand
const MAN = new THREE.Vector3(1.98, 0, -0.14);
const GRIP_HOME = new THREE.Vector3(1.6, 1.28, -0.14); // the upper fist when he holds the rope still
const STROKE = 0.24; // m of rope one fist pulls before the other takes over
const BUCKET_X = PULLEY.x - PULLEY.r; // the rope hangs from the left of the wheel
// what the camera shows: from left of the well to behind the man, from the water to the beam
const VIEW_BOX = [new THREE.Vector3(-0.95, -1.12, -0.3), new THREE.Vector3(2.6, 2.32, 0.3)];
const VIEW_DIRS = { front: new THREE.Vector3(0, 0.15, 1), '3d': new THREE.Vector3(-0.55, 0.32, 0.78) };
const MARGIN = { top: 56, bottom: 24, side: 4 };
const UPV = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const BOOK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7.5h8M8 11h6"/></svg>';

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'wl');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'experiments', results: true, items: IDS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [
        { act: 'example', label: 'act_example', icon: BOOK_ICON },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      lines: { action: 1, outcome: 0, rule: 2 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the formula: two steppers (the pull T, the bucket M), the law with each symbol a button, the sum with the numbers
  const stepper = (k, unit) => `
      <div class="wl-step k-${k}">
        <span class="wl-name"><b class="c-${k}">${k}</b> <span>${t(`name_${k}`)}</span></span>
        <span class="wl-ctl">
          <button type="button" class="wl-pm" data-step="${k}" data-dir="-1" aria-label="${t(`less_${k}`)}">${ICONS.minus}</button>
          <output class="wl-val" data-val="${k}" aria-live="polite"></output>
          <span class="wl-unit">${unit}</span>
          <button type="button" class="wl-pm" data-step="${k}" data-dir="1" aria-label="${t(`more_${k}`)}">${ICONS.plus}</button>
        </span>
      </div>`;
  const eq = document.createElement('div');
  eq.className = 'wl-eq';
  eq.innerHTML = `
    <div class="wl-steps">${stepper('T', 'N')}${stepper('M', 'kg')}</div>
    <div class="wl-law" aria-label="${t('law_label')}">
      <button type="button" class="wl-term c-T" data-term="T">T</button><span class="wl-op">−</span><button type="button" class="wl-term c-W" data-term="W">M<i>g</i></button><span class="wl-op">=</span><button type="button" class="wl-term c-M" data-term="M">M</button><button type="button" class="wl-term c-a" data-term="a">a</button>
      <span class="wl-key">${t('key_up')}</span>
      <span class="wl-sum"></span>
    </div>`;
  $('.pvc-act-row').after(eq);
  const sumEl = /** @type {HTMLElement} */ (eq.querySelector('.wl-sum'));

  // under the rule (not on phones): what the picture leaves out (the cut, the light rope) and the arrows' scale; on the
  // panel a line with the bucket's velocity and the time of the run (slowed SLOW times), over the rule
  const meta = document.createElement('p');
  meta.className = 'wl-meta';
  meta.innerHTML = `<span>${t('meta_cut')}</span> <span>${t('meta_rope')}</span> <span class="wl-meta-scale">${t('meta_scale')}</span>`;
  $('.pvc-rule').after(meta);
  const speed = document.createElement('div');
  speed.className = 'wl-speed';
  $('.pvc-rule').before(speed);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.05, far: 90, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 1.5;
  controls.maxDistance = 30;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = Math.PI * 0.53;
  if (o.bg !== 'transparent') {
    // a deep blue sky, paler at the horizon
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#5b86b4');
    g.addColorStop(0.45, '#7fa3c6');
    g.addColorStop(0.8, '#b3cadd');
    g.addColorStop(1, '#d3e0ea');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const sky = new THREE.CanvasTexture(c);
    sky.colorSpace = THREE.SRGBColorSpace;
    scene.background = sky;
    // a haze over the yard behind the well: the well, the bucket and the arrows stand out
    scene.fog = new THREE.Fog('#d3e0ea', 10, 20);
  }
  function hazeYard() {
    if (!(scene.fog instanceof THREE.Fog)) return;
    const d = camera.position.distanceTo(controls.target);
    scene.fog.near = d + 0.5;
    scene.fog.far = d + 6;
  }
  controls.addEventListener('change', hazeYard);
  scene.add(new THREE.HemisphereLight('#d6ecff', '#b0703c', 0.95));
  const sun = new THREE.DirectionalLight('#fff1d6', 1.55);
  sun.position.set(-3.5, 7.5, 6.5);
  sun.target.position.set(0.7, 0, -0.6);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe2ff', 0.35);
  fill.position.set(4, 3, 5);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -4.5, right: 4.5, top: 4, bottom: -3, near: 1, far: 20 });
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0005;
  }

  const well = createWell();
  scene.add(well.root);
  const bucket = createBucket();
  scene.add(bucket.root);
  const rope = createRope();
  scene.add(rope.root);
  const man = createPerson();
  man.root.position.copy(MAN);
  man.root.rotation.y = Math.PI; // he faces the well (−x)
  scene.add(man.root);

  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  // the arrows are the point of the picture: thick, flat colour in a white outline, drawn over the scenery (arrows.js)
  let thick = 1; // the arrows get thicker (not longer) on a small stage, so they stay at least about 4 px wide
  const A = {
    T: boldArrow('TensionOnBucket', COLORS.T),
    W: boldArrow('WeightOfBucket', COLORS.W),
    F: boldArrow('ResultantOnBucket', COLORS.F, 0.026),
    a: boldArrow('AccelerationOfBucket', COLORS.a, 0.022),
    H: boldArrow('TensionOnHands', COLORS.T, 0.026),
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
    id: IDS.includes(o.id) ? o.id : 'hold',
    T: EXPERIMENTS.hold.T,
    M: EXPERIMENTS.hold.M,
    sol: lift(EXPERIMENTS.hold.T, EXPERIMENTS.hold.M),
    custom: false, // the steppers chose other numbers than the row's
    phase: 'ready', // 'ready' | 'run' | 'done'
    hold: null, // a fixed part of the run, 0 … 1 (a test's picture, or ?at=): frozen there
    forces: true, // the arrows show while it runs (the test keeps them off until the answer)
    numbers: true, // the labels carry their numbers (the test keeps symbols only until the answer)
    t0: 0,
    results: Object.fromEntries(IDS.map((id) => [id, null])), // a (ms⁻²) of each experiment's last run
    mode: 'explore',
    view: o.view === '3d' ? '3d' : 'front',
    locked: false,
    focus: null, // a symbol of the law the student tapped: its arrow pulses
    focusAt: 0,
    userMovedCamera: false,
  };
  const now = () => performance.now();
  let lastRelease = Number.NEGATIVE_INFINITY;

  // ── the run ─────────────────────────────────────────────────────────────────
  /** Real seconds since the run started (or the frozen moment). */
  function runTime() {
    const total = runSeconds(s.sol.a);
    if (s.hold != null) return s.hold * total;
    if (s.phase === 'ready') return 0;
    if (s.phase === 'done') return total;
    return Math.min(total, Math.max(0, (now() - s.t0) / 1000) / SLOW);
  }
  const where = () => bucketAt(s.sol.a, runTime());
  const moving = () => s.phase === 'run' || s.hold != null;
  const arrowsOn = () => s.forces && moving();

  function setNumbers(T, M, { custom = true } = {}) {
    const f = fixLift({ T, M });
    s.T = f.T;
    s.M = f.M;
    s.sol = lift(s.T, s.M);
    s.custom = custom;
    s.phase = 'ready';
    s.hold = null;
    bucket.setMass(s.M);
  }

  function release({ quiet = false, jump = false } = {}) {
    if (s.phase === 'run' && s.hold == null) return;
    s.hold = null;
    s.phase = 'run';
    s.t0 = now();
    if (!quiet) audio.pop();
    emit('release', snapshotSetup());
    if (jump) finish(true);
    syncScene();
    refresh();
    emitChange();
  }
  function finish(quiet = false) {
    s.phase = 'done';
    s.hold = null;
    if (s.mode === 'explore' && !s.custom) s.results[s.id] = round(s.sol.a, 2);
    const end = bucketAt(s.sol.a, runSeconds(s.sol.a)).end;
    if (!quiet) {
      if (end === 'water') audio.contact();
      else audio.pop();
    }
    if (end === 'water') splashFrom = now();
    emit('stop', { id: s.id, a: round(s.sol.a, 2), end: end || 'held' });
    syncScene();
    refresh();
    emitChange();
  }
  let splashFrom = Number.NEGATIVE_INFINITY;
  function tick() {
    let busy = false;
    if (s.phase === 'run' && s.hold == null) {
      if ((now() - s.t0) / 1000 >= runSeconds(s.sol.a) * SLOW) finish();
      else busy = true;
      syncScene();
    }
    const k = (now() - splashFrom) / 1200;
    if (k >= 0 && k <= 1) {
      well.splash(k);
      busy = true;
    } else well.splash(null);
    if (s.focus && now() - s.focusAt < 1600) {
      pulseFocus();
      busy = true;
    } else if (s.focus) {
      s.focus = null;
      pulseFocus();
    }
    if (s.phase === 'run') speedChip();
    return busy;
  }
  stage.addTicker(() => tick());

  /** Back to the start: the bucket half way down, held still. */
  function goHome() {
    s.phase = 'ready';
    s.hold = null;
    syncScene();
    refresh();
    emitChange();
  }
  /** A word in the row: its pull and bucket, held at the start. */
  function choose(id) {
    if (!IDS.includes(id)) return;
    s.id = id;
    setNumbers(EXPERIMENTS[id].T, EXPERIMENTS[id].M, { custom: false });
    syncScene();
    refresh();
    emitChange();
    emit('experiment', { id });
  }

  // ── the picture: the bucket, the rope, the man's fists hand over hand ──────
  const ropeDir = new THREE.Vector3(); // from the wheel towards his fists
  const gripA = new THREE.Vector3();
  const gripB = new THREE.Vector3();
  const lineA = new THREE.Vector3();
  const lineB = new THREE.Vector3();
  const knot = new THREE.Vector3();
  const off = new THREE.Vector3();
  const handA = new THREE.Vector3();
  const handB = new THREE.Vector3();
  const hands = [handA, handB];
  function syncScene() {
    const w = where();
    const y = w.y;
    bucket.root.position.set(BUCKET_X, y, 0);
    bucket.drip(runTime() * SLOW, moving() && y < SHAFT.start + 0.6 && w.v > 0);
    knot.set(BUCKET_X, y + KNOT, 0);
    // the rope's line from the wheel to his fists (fixed: he stands still and pulls the rope through his hands)
    const phi = tangentAngle(GRIP_HOME);
    tmp.set(PULLEY.x + Math.cos(phi) * PULLEY.r, PULLEY.y + Math.sin(phi) * PULLEY.r, PULLEY.z);
    ropeDir.subVectors(GRIP_HOME, tmp).normalize();
    // hand over hand: one fist holds the rope and moves with it for a stroke while the other goes back for a new hold
    const run = w.s; // metres of rope that have come towards him
    const p = (((run / STROKE) % 2) + 2) % 2;
    const strokeAt = (q) => (q < 1 ? q : 2 - q); // 0 … 1 … 0 along the stroke
    const place = (q, out, line) => {
      const along = -0.04 + STROKE * strokeAt(q);
      line.copy(GRIP_HOME).addScaledVector(ropeDir, along);
      out.copy(line);
      if (q >= 1) {
        // going back up for a new hold: off the rope, nearer his chest
        const lift2 = Math.sin(Math.PI * (q - 1)) * 0.07;
        off.set(-ropeDir.y, ropeDir.x, 0).multiplyScalar(lift2);
        out.add(off);
        out.z += lift2 * 0.6;
      }
    };
    place(p, gripA, lineA);
    place((p + 1) % 2, gripB, lineB);
    // the rope goes through both holds on its line (the nearer the wheel first)
    const firstA = lineA.distanceTo(tmp) <= lineB.distanceTo(tmp);
    rope.update({ knot, grips: firstA ? [lineA, lineB] : [lineB, lineA], run });
    well.spin(run);
    // his fists (in his own frame), his lean: further back the harder he pulls, a little sway with each stroke
    man.root.worldToLocal(handA.copy(gripA));
    man.root.worldToLocal(handB.copy(gripB));
    const pullK = Math.min(1, (moving() ? s.T : s.sol.W) / 180);
    const sway = moving() && Math.abs(w.v) > 0.01 ? Math.sin(Math.PI * strokeAt(p)) * 0.03 : 0;
    man.pose({
      hands,
      rope: tmp2.copy(ropeDir).negate().applyAxisAngle(UPV, Math.PI), // towards the wheel, in his frame
      lean: 0.16 + 0.12 * pullK + sway,
      hipX: -0.04 - 0.05 * pullK,
      hipDrop: 0.02 + 0.03 * pullK,
      look: 0.42,
    });
    layoutArrows(w);
    stage.invalidate();
  }

  function layoutArrows(w) {
    for (const a of Object.values(A)) a.hide();
    const perPx = (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
    thick = Math.min(1.8, Math.max(1, (4.2 * perPx) / 0.03));
    for (const a of Object.values(A)) a.scale(thick); // a pulse (pulseFocus) scales it again on the next frame
    if (!arrowsOn()) return;
    const { sol } = s;
    const kf = Math.min(FORCE_SCALE, ARROW_MAX / Math.max(sol.T, sol.W, 1));
    const ka = Math.min(ACC_SCALE, ARROW_MAX / Math.max(Math.abs(sol.a), 1e-6));
    const y = w.y;
    // on the bucket: T up from the handle, Mg down from its middle; on its left the resultant T − Mg, on its right a
    // (the same way as the resultant: F = Ma)
    const mid = y + BUCKET_SIZE.h / 2;
    if (sol.T > 0.01) A.T.set(tmp.set(BUCKET_X, y + KNOT + 0.02, ZF), UPV, sol.T * kf);
    A.W.set(tmp.set(BUCKET_X, mid, ZF), DOWN, sol.W * kf);
    if (Math.abs(sol.net) > 1e-6) A.F.set(tmp.set(BUCKET_X - BUCKET_SIZE.rTop - 0.15, mid, ZF), sol.net > 0 ? UPV : DOWN, Math.abs(sol.net) * kf);
    if (Math.abs(sol.a) > 1e-3) A.a.set(tmp.set(BUCKET_X + BUCKET_SIZE.rTop + 0.15, mid, ZF), sol.a > 0 ? UPV : DOWN, Math.abs(sol.a) * ka);
    // on his fists: the rope pulls them towards the wheel (the same T)
    if (sol.T > 0.01) {
      const first = lineA.distanceTo(PULLEY_C) <= lineB.distanceTo(PULLEY_C) ? lineA : lineB;
      tmp2.copy(ropeDir).negate();
      tmp.copy(first).addScaledVector(tmp2, 0.06);
      tmp.z += 0.22; // in front of his fists, so nothing hides it
      A.H.set(tmp, tmp2, sol.T * kf);
    }
  }
  const PULLEY_C = new THREE.Vector3(PULLEY.x, PULLEY.y, PULLEY.z);

  /** The arrow of the symbol the student tapped in the law grows and shrinks for a moment. */
  function pulseFocus() {
    const k = s.focus ? 1 + 0.25 * Math.sin(((now() - s.focusAt) / 1000) * Math.PI * 4) : 1;
    const map = { T: [A.T, A.H], W: [A.W], a: [A.a, A.F], M: [] };
    for (const [key, list] of Object.entries(map)) for (const a of list) a.scale(thick, s.focus === key ? k : 1);
    bucket.root.scale.setScalar(s.focus === 'M' ? k * 0.97 + 0.03 : 1);
    stage.invalidate();
  }

  // ── the panel: the row of words, one action, the law with numbers, one rule ──
  const found = (id) => s.results[id] != null;
  /** What the big button does now: run these numbers; once they have run, the next experiment not run yet. */
  function plan() {
    const tried = IDS.filter(found).length;
    if (s.phase !== 'done')
      return { id: s.id, label: s.sol.a < -1e-9 ? 'act_ease' : Math.abs(s.sol.a) < 1e-9 ? 'act_hold' : 'act_pull', step: tried + 1 };
    if (s.custom) return { id: s.id, label: 'act_again', step: '' };
    const next = IDS.find((id) => !found(id) && id !== s.id);
    return next ? { id: next, label: `act_next_${next}`, step: tried + 1 } : { id: s.id, label: 'act_again', step: '' };
  }

  /** The sum with the student's numbers: "১৩০ − ১০ × ৯.৮ = ১০ × a ⇒ a = +৩.২ ms⁻²". */
  function sumHtml() {
    const { T, M, a } = s.sol;
    const w = `${N(M)}${NBSP}×${NBSP}${N(G)}`;
    const head = `<span class="wl-num"><b class="c-T">${N(T)}</b> − <b class="c-W">${w}</b> = <b class="c-M">${N(M)}</b>${NBSP}×${NBSP}<b class="c-a">a</b></span>`;
    const res = `<span class="wl-res">⇒ <b class="c-a">a = ${N(signed(a))}${NBSP}${t('u_a')}</b></span>`;
    return `${head} ${res}`;
  }

  /** The rule: one idea at a time, growing with what the student has found; the book's words. */
  function ruleHtml() {
    const { a } = s.sol;
    if (s.phase === 'ready' && !IDS.some(found)) return t('rule_start');
    if (found('hold') && found('pull') && found('ease') && found('full')) return t('rule_law');
    if (a < -1e-9) return t('rule_down');
    if (Math.abs(a) < 1e-9) return t('rule_still');
    if (s.id === 'full' && !s.custom) return t('rule_mass');
    return t('rule_one_rope');
  }

  function refresh() {
    sheet.choose(s.custom ? null : s.id);
    for (const id of IDS) sheet.result(id, found(id) ? t('res_a', { a: N(signed(s.results[id])) }) : '');
    sheet.rule(ruleHtml());
    $('[data-val="T"]').textContent = N(s.T);
    $('[data-val="M"]').textContent = N(s.M);
    for (const b of eq.querySelectorAll('[data-step]')) {
      const k = /** @type {HTMLElement} */ (b).dataset.step;
      const [lo, hi] = LIMITS[k];
      const dir = Number(/** @type {HTMLElement} */ (b).dataset.dir);
      b.classList.toggle('off', dir < 0 ? s[k] <= lo : s[k] >= hi);
    }
    const sum = sumHtml();
    if (sumEl.dataset.html !== sum) {
      sumEl.innerHTML = sum;
      sumEl.dataset.html = sum;
    }
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label });
      sheet.next(p.id !== s.id && !s.custom ? p.id : null);
      if (s.phase === 'ready' && s.hold == null) action.show('run');
      else action.hide('run');
    }
    speedChip();
    syncLabels();
    stage.invalidate();
  }

  /** On a chip at the bottom: the bucket's velocity (it grows by a each second) and the time, during and after a run. */
  let lastSpeed = '';
  function speedChip() {
    let html = '';
    if (stage.height >= 240 && s.mode === 'explore' && (moving() || s.phase === 'done')) {
      const w = where();
      const v = Math.abs(w.v);
      const arrow = v < 0.005 ? '' : `${NBSP}${w.v > 0 ? '↑' : '↓'}`;
      html = t('speed', { v: v.toFixed(1), dir: arrow, t: runTime().toFixed(1), k: SLOW });
    }
    if (html !== lastSpeed) {
      speed.innerHTML = html;
      lastSpeed = html;
    }
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
  /** Boxes of the arrows on the screen (labels keep off them). */
  function arrowBoxes() {
    const list = [];
    for (const a of Object.values(A)) {
      if (!a.root.visible) continue;
      toScreen(a.root.position, P0);
      toScreen(a.tip, P1);
      list.push({ left: Math.min(P0.x, P1.x) - 6, top: Math.min(P0.y, P1.y) - 6, right: Math.max(P0.x, P1.x) + 6, bottom: Math.max(P0.y, P1.y) + 6 });
    }
    return list;
  }
  const corner = new THREE.Vector3();
  function screenBox(b3) {
    if (b3.isEmpty()) return null;
    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;
    for (const x of [b3.min.x, b3.max.x])
      for (const y of [b3.min.y, b3.max.y])
        for (const z of [b3.min.z, b3.max.z]) {
          corner.set(x, y, z).project(camera);
          const sx = (corner.x * 0.5 + 0.5) * stage.width;
          const sy = (-corner.y * 0.5 + 0.5) * stage.height;
          left = Math.min(left, sx);
          right = Math.max(right, sx);
          top = Math.min(top, sy);
          bottom = Math.max(bottom, sy);
        }
    return { left, top, right, bottom };
  }
  /** The bucket and the man on the screen (labels keep off them). */
  const bodyBoxes = () => [screenBox(bucket.box()), screenBox(man.box())].filter(Boolean);
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, speed, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(14, 0), spot(14, 18), spot(14, -18), spot(14, 36), spot(14, -36)];
  const LEFT_OF = [spot(-14, 0), spot(-14, 18), spot(-14, -18), spot(-14, 36), spot(-14, -36)];
  const SIDES = [...LEFT_OF, ...RIGHT_OF];
  const ABOVE = [spot(0, -16), spot(16, -16), spot(-16, -16), spot(0, -34), ...RIGHT_OF, ...LEFT_OF];
  const labelPoint = {
    bucket: new THREE.Vector3(),
    net: new THREE.Vector3(),
  };
  const labelState = new Map();
  const want = new Map();
  function addLabel(id, w) {
    want.set(id, w);
  }
  function syncLabels() {
    want.clear();
    const on = arrowsOn();
    const compact = stage.height < 250 || stage.width < 350;
    const sol = s.sol;
    const lbl = (k, v) => (s.numbers ? t(`lbl_${k}`, { v }) : t(`sym_${k}`));
    // the bucket's mass under it, on the left (the resultant's arrow is beside it)
    addLabel('M', {
      kind: 'mass',
      text: t('lbl_M', { m: N(s.M) }),
      point: () => labelPoint.bucket.set(BUCKET_X - BUCKET_SIZE.rBottom, bucket.root.position.y, ZF),
      spots: [spot(-16, 16), spot(-16, 34), spot(-30, 0), spot(-16, -20)],
    });
    if (on) {
      const own = [bodyBoxes];
      addLabel('TB', { text: lbl('T', plain(sol.T)), point: () => A.T.tip, spots: [...RIGHT_OF, ...ABOVE], color: COLORS.T, own });
      addLabel('W', { text: lbl('W', plain(sol.W)), point: () => A.W.tip, spots: [...RIGHT_OF, ...LEFT_OF], color: COLORS.W, own });
      if (Math.abs(sol.a) > 1e-3)
        addLabel('a', { text: lbl('a', signed(sol.a)), point: () => A.a.tip, spots: [...RIGHT_OF, ...SIDES], color: COLORS.a, own });
      // the resultant: at its arrow's tip, or beside the bucket when it is zero (held still)
      const still = Math.abs(sol.net) < 1e-6;
      addLabel('F', {
        text: s.numbers ? t('lbl_F', { v: still ? '0' : signed(sol.net, 1) }) : t('sym_F'),
        point: () => (still ? labelPoint.net.set(BUCKET_X - BUCKET_SIZE.rTop - 0.15, bucket.root.position.y + BUCKET_SIZE.h / 2, ZF) : A.F.tip),
        spots: [...LEFT_OF, ...ABOVE],
        color: COLORS.F,
        own,
      });
      if (!compact && sol.T > 0.01)
        addLabel('TH', { text: lbl('T', plain(sol.T)), point: () => A.H.tip, spots: ABOVE, color: COLORS.T, own, optional: true });
    }
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.spots.map((p) => `${p.dx},${p.dy}`).join(';')}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, {
          text: w.text,
          point: w.point,
          kind: w.kind || 'force',
          color: w.color,
          spots: w.spots,
          avoid: w.own || [],
          optional: w.optional,
        });
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
    box.min.copy(VIEW_BOX[0]);
    box.max.copy(VIEW_BOX[1]);
    // a wide, short frame: the well and the man side by side fill it; a tall one: a little less of the water
    const aspect = stage.width / Math.max(1, stage.height);
    if (aspect > 1.9) box.min.y = -1.0;
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
      hazeYard();
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
          hazeYard();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (done) refresh();
        return done;
      });
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
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

  // ── the action: the big button, the ring on the bucket, a tap on the bucket or the man ─────────────────────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (s.phase === 'run' && s.hold == null) return;
    if (now() - lastRelease < DOUBLE_TAP) return; // a double tap must not skip an experiment
    lastRelease = now();
    hintOff();
    const p = plan();
    if (s.phase === 'done' && !s.custom && p.id !== s.id) choose(p.id);
    else if (s.phase === 'done') goHome();
    release();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_hold',
    target: () => bucket.box(),
    pad: 8,
    avoid: [ui.corner, ui.hint, speed, () => anno.boxes()],
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
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects([bucket.hit, man.hit], false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return;
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (s.phase === 'run' && s.hold == null) {
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

  // ── the book's examples (চিত্র ৩.০৯ and ৩.১০), in their own window ─────────────
  const example = createExample({
    root,
    t,
    now,
    onChange: (st) => {
      emit('example', st);
      emitChange(true);
    },
  });

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshotSetup() {
    const { T, M, W, a, net } = s.sol;
    return { T, M, W: round(W, 3), net: round(net, 3), a: round(a, 3) };
  }
  function snapshot() {
    const p = plan();
    const w = where();
    return {
      id: s.custom ? null : s.id,
      ...snapshotSetup(),
      phase: s.phase, // 'ready' | 'run' | 'done'
      time: round(runTime(), 3), // real seconds into the run
      height: round(w.y, 3), // the bucket's bottom, m (the courtyard is 0)
      speed: round(w.v, 3), // m/s, up +
      end: s.phase === 'done' ? bucketAt(s.sol.a, runSeconds(s.sol.a)).end || 'held' : null,
      results: { ...s.results },
      view: s.view,
      mode: s.mode,
      next: { id: p.id, step: p.step },
      example: example.state,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.id, snap.T, snap.M, snap.phase, snap.results, snap.mode, snap.view]);
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
  function choicesOf(items, kind, label, extra = {}) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="wl-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key, ...extra },
    };
  }
  /** A scene for a question: these numbers, the bucket held at the start (or frozen part way), nothing moving. */
  function showScene(T, M, { hold = null, forces = false, numbers = false } = {}) {
    setNumbers(T, M, { custom: true });
    s.phase = hold != null ? 'run' : 'ready';
    s.hold = hold;
    s.forces = forces;
    s.numbers = numbers;
    syncScene();
    refresh();
  }
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
  const aText = (v) => `${N(signed(v))}${NBSP}${t('u_a')}`;
  const nText = (v) => `${N(plain(v))}${NBSP}N`;

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
        learnSaved = { id: s.id, T: s.T, M: s.M, custom: s.custom, results: { ...s.results } };
        s.mode = 'quiz';
        s.locked = true;
        example.close();
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.forces = true;
        s.numbers = true;
        const saved = learnSaved;
        s.results = { ...(saved?.results || s.results) };
        syncUI();
        if (saved?.custom) {
          setNumbers(saved.T, saved.M);
          syncScene();
          refresh();
        } else choose(saved?.id || s.id);
        setView(s.view, { animate: false });
      },
      async prepare(i) {
        picked = -1;
        const kind = ['calc', 'hold', 'ease', 'same', 'full'][i % 5];
        if (kind === 'calc') {
          const [T, M] = pickOne(CALC_SETS);
          const items = calcChoices(T, M);
          showScene(T, M, { hold: 0.35, forces: true, numbers: false });
          question = { kind, T, M, a: items[0].v };
          return { text: t('q_calc', { T: N(T), M: N(M), g: N(G) }), ...choicesOf(items, kind, (x) => aText(x.v), { T, M }) };
        }
        if (kind === 'hold') {
          const M = pickOne(HOLD_MASSES);
          const items = holdChoices(M);
          showScene(M * G, M, { forces: false });
          // held still: the pull is exactly Mg (the steppers' grid may not have it, so set it directly)
          s.T = M * G;
          s.sol = lift(s.T, M);
          refresh();
          question = { kind, M, T: items[0].v };
          return { text: t('q_hold', { M: N(M), g: N(G) }), ...choicesOf(items, kind, (x) => nText(x.v), { M }) };
        }
        if (kind === 'ease') {
          const [T, M] = pickOne(EASE_SETS);
          showScene(T, M, { forces: false });
          question = { kind, T, M, a: round(lift(T, M).a, 2) };
          const items = ['c_down', 'c_up', 'c_none', 'c_up_slow'].map((key) => ({ key }));
          return { text: t('q_ease', { T: N(T), M: N(M), W: N(plain(M * G)) }), ...choicesOf(items, kind, (x) => t(x.key), { T, M }) };
        }
        if (kind === 'same') {
          // the pull at his fists is written on the picture: how big is the rope's pull on the bucket?
          const [T, M] = pickOne(CALC_SETS);
          showScene(T, M, { hold: 0.35, forces: true, numbers: false });
          question = { kind, T, M };
          const items = [
            { key: 'same', v: T },
            { key: 'weight', v: round(M * G, 2) },
            { key: 'net', v: round(T - M * G, 2) },
            { key: 'half', v: T / 2 },
          ];
          return { text: t('q_same', { T: N(T) }), ...choicesOf(items, kind, (x) => nText(x.v), { T, M }) };
        }
        const [T, M, extra] = pickOne(FULL_SETS);
        const items = fullChoices(T, M, extra);
        showScene(T, M + extra, { forces: false });
        question = { kind: 'full', T, M, extra, a1: round(lift(T, M).a, 2), a2: items[0].v };
        return {
          text: t('q_full', { T: N(T), M: N(M), a: N(plain(lift(T, M).a)), extra: N(extra) }),
          ...choicesOf(items, 'full', (x) => aText(x.v), { T, M, extra }),
        };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note2 = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        if (k === 'calc') {
          reveal({ run: false });
          return (
            t('why_calc', { T: N(question.T), M: N(question.M), g: N(G), W: N(plain(question.M * G)), a: N(signed(question.a)) }) +
            note2({ nog: 'mis_nog', plus: 'mis_plus', byW: 'mis_byW' })
          );
        }
        if (k === 'hold') {
          reveal();
          return t('why_hold', { M: question.M, g: G, T: plain(question.T), z: 0 }) + note2({ kg: 'mis_kg', zero: 'mis_zero', double: 'mis_double' });
        }
        if (k === 'ease') {
          reveal();
          return (
            t('why_ease', { T: N(question.T), W: N(plain(question.M * G)), M: N(question.M), a: N(signed(question.a)) }) +
            note2({ c_up: 'mis_up', c_none: 'mis_none', c_up_slow: 'mis_up_slow' })
          );
        }
        if (k === 'same') {
          reveal({ run: false });
          return t('why_same', { T: N(question.T) }) + note2({ weight: 'mis_weight', net: 'mis_net', half: 'mis_half' });
        }
        reveal();
        return (
          t('why_full', {
            T: N(question.T),
            M2: N(question.M + question.extra),
            W: N(plain((question.M + question.extra) * G)),
            a1: N(signed(question.a1)),
            a2: N(signed(question.a2)),
          }) + note2({ same: 'mis_same', ratio: 'mis_ratio', nog: 'mis_nog2' })
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
    controls.enableRotate = !s.locked;
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  /** A stepper: the pull or the bucket changes, the bucket goes back to the start (held). */
  function step(k, dir) {
    if (s.locked) return lockedNudge();
    const [, , inc] = LIMITS[k];
    setNumbers(k === 'T' ? s.T + dir * inc : s.T, k === 'M' ? s.M + dir * inc : s.M);
    syncScene();
    refresh();
    emitChange();
  }
  let focusTimer = 0;
  function focusTerm(k) {
    s.focus = k;
    s.focusAt = now();
    for (const b of eq.querySelectorAll('[data-term]')) b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.term === k);
    clearTimeout(focusTimer);
    focusTimer = setTimeout(() => {
      for (const b of eq.querySelectorAll('[data-term]')) b.classList.remove('on');
    }, 1600);
    if (!arrowsOn() && k !== 'M') showHint(t('hint_arrows'), { duration: 2400 });
    stage.invalidate();
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b) || example.el.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else choose(b.dataset.example);
    }
    if (b.dataset.step) step(b.dataset.step, Number(b.dataset.dir));
    if (b.dataset.term) focusTerm(b.dataset.term);
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
      case 'example':
        if (s.locked) lockedNudge();
        else {
          if (s.phase === 'run') goHome();
          example.open();
        }
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (example.state.open) return; // the window has its own keys
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey =
      ['1', '2', '3', '4', 'r', 'R', 'e', 'E', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-'].includes(k) ||
      ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3', '4'].includes(k)) choose(IDS[Number(k) - 1]);
    else if (k === 'ArrowUp') step('T', 1);
    else if (k === 'ArrowDown') step('T', -1);
    else if (k === 'ArrowRight' || k === '+') step('M', 1);
    else if (k === 'ArrowLeft' || k === '-') step('M', -1);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'e' || k === 'E') example.open();
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  for (const id of String(o.tried || '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => IDS.includes(x)))
    s.results[id] = round(lift(EXPERIMENTS[id].T, EXPERIMENTS[id].M).a, 2);
  setNumbers(EXPERIMENTS[s.id].T, EXPERIMENTS[s.id].M, { custom: false });
  syncUI();
  flyTo(viewPose(), 0);
  const startAt = o.at === '' || o.at == null ? null : Number(o.at);
  if (startAt != null && Number.isFinite(startAt)) {
    s.phase = 'run';
    s.hold = Math.min(1, Math.max(0, startAt));
    if (s.hold >= 1) {
      s.hold = null;
      s.phase = 'done';
    }
  }
  syncScene();
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
     * Change any of: id ('hold' | 'pull' | 'ease' | 'full'), T and M (the pull in N and the bucket in kg: the bucket
     * goes back to the start), release (true: he pulls; with animate: false it lands at the end), at (0 … 1: frozen
     * that far into the run, with the arrows), home (true: the bucket held at the start again), view, tried
     * (experiments whose results show, e.g. ['hold']), example (true/false: the উদাহরণ window, or an object for it:
     * { open, kind: 'single' | 'two', M, m, part, time, playing }).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.id) choose(p.id);
      if (p.T != null || p.M != null) {
        setNumbers(p.T ?? s.T, p.M ?? s.M);
        syncScene();
        refresh();
      }
      if (p.tried) {
        for (const id of (Array.isArray(p.tried) ? p.tried : String(p.tried).split(',')).filter((x) => IDS.includes(x)))
          s.results[id] = round(lift(EXPERIMENTS[id].T, EXPERIMENTS[id].M).a, 2);
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
      if (p.example != null) {
        if (p.example === true) example.open();
        else if (p.example === false) example.close();
        else if (typeof p.example === 'object') example.set({ open: true, ...p.example });
      }
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      example.close();
      example.set({ kind: 'single', M: 2, m: 5, part: 0 });
      s.results = Object.fromEntries(IDS.map((id) => [id, null]));
      s.forces = true;
      s.numbers = true;
      choose('hold');
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The well, its frame and pulley, the rope, the bucket and the man as they stand, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'WellPull';
      for (const obj of [well.root, bucket.root, rope.root, man.root]) g.add(obj.clone(true));
      return g;
    },
  };
}
