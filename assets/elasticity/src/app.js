// Elasticity (book pages 147–148, topic 5.5), student view. A polished steel spring hangs from a lab stand in a
// workshop; brass weights of 1 N each hang on it one at a time. A metre rule reads its length L from the top hook, a
// dark line marks L₀ and a red one the stretch x = L − L₀; a bold orange arrow is the restoring force (টান T) in the
// spring, a purple one the weight W. Beside it a পীড়ন–বিকৃতি graph gets a point for every load. One weight, then two:
// x, then 2x (পীড়ন ∝ বিকৃতি, Hooke's law). Weights off: back to L₀ (elasticity). On past 4 N, the elastic limit: the
// spring gives way, the graph bends, and with the weights off it stays longer (স্থায়ী বিকৃতি), its coils apart. The
// panel works out বিকৃতি = (L − L₀)/L₀, পীড়ন = F/A and their ratio live. Then a five-question test. Built on the kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createArrow } from '@shared/arrow.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { createGraph, keySwatch } from './graph.js';
import { DIM_X, HANGER, TOP, TRAY, WEIGHT, createApparatus, createWorkshop } from './apparatus.js';
import {
  AREA_M2,
  AREA_MM2,
  FRESH,
  L0,
  LIMIT_N,
  MAX_N,
  MODULUS,
  W1,
  beyond,
  groupBD,
  groupIntl,
  hookeChoices,
  lakh,
  lengthOf,
  limitChoices,
  load,
  onHookeLine,
  overstretched,
  ratio,
  round,
  strain,
  stressChoices,
  stress,
  strainChoices,
  stretchOf,
} from './reading.js';

export const DEFAULTS = {
  n: 0, // weights on the spring at the start
  spring: 'fresh', // 'fresh' | 'stretched': a spring that has carried all six weights once before
  look: 'all', // 'all' | 'close': the whole spring, or close to the stretch x
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { T: '#e8590c', W: '#7048e8', x: '#e03131', L0: '#1f2430' };
// the labels' text: the same hues, a shade darker, so each reads at 4.5 : 1 or more on its white chip
const INK = { T: '#c2410c', W: '#6741d9', x: '#c92a2a', L0: '#1f2430' };
const CM = 0.01; // m per cm
const FORCE_LEN = 0.02; // m of arrow per newton
const SLOT = WEIGHT.h + 0.0016; // one weight's place on the stack
const DOUBLE_TAP = 420; // ms
const HANG_S = 0.75; // s: a weight goes from the bench onto the hanger
const SETTLE_S = 1.35; // s: the spring bounces and settles
const GIVE_S = 1.7; // s: past the limit it gives way slowly
const OFF_S = 1.0; // s: the weights come off
const CLOSE_HOLD = 1.9; // s the camera stays close to the stretch after a step
const VIEW_DIR = new THREE.Vector3(0.1, 0.1, 1).normalize();
const UPV = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const bn = t.lang === 'bn';
  /** A stress in words: lakh in Bangla (৩ লাখ Pa), digit groups in English (300,000 Pa). */
  const paText = (pa) => (bn && Math.abs(pa) >= 100000 ? t('pa_lakh', { v: lakh(pa) }) : t('pa_plain', { v: bn ? groupBD(pa) : groupIntl(pa) }));

  root.classList.add('pvc', 'el');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the stepper of weights with L₀ and L, then the three sums
  const eq = document.createElement('div');
  eq.className = 'el-eq';
  eq.innerHTML = `
    <div class="el-top">
      <div class="el-step">
        <span class="el-name"><b class="c-W">W</b> <span>${t('name_W')}</span></span>
        <span class="el-ctl">
          <button type="button" class="el-pm" data-step="-1" aria-label="${t('less_W')}">${ICONS.minus}</button>
          <output class="el-val" aria-live="polite"></output>
          <span class="el-unit">N</span>
          <button type="button" class="el-pm" data-step="1" aria-label="${t('more_W')}">${ICONS.plus}</button>
        </span>
      </div>
      <div class="el-len"></div>
    </div>
    <div class="el-sums">
      <div class="el-sum"><span class="el-q">${t('s_strain')}</span><span class="el-calc" data-sum="strain"></span></div>
      <div class="el-sum"><span class="el-q">${t('s_stress')}</span><span class="el-calc" data-sum="stress"></span></div>
      <div class="el-sum"><span class="el-q">${t('s_ratio')}</span><span class="el-calc" data-sum="ratio"></span></div>
      <div class="el-sum el-keyrow"><span class="el-q">${t('g_key')}</span><span class="el-calc el-key"></span></div>
    </div>`;
  $('.pvc-act-row').after(eq); // the readings under the action
  const keyEl = /** @type {HTMLElement} */ (eq.querySelector('.el-key'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 30, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.25;
  controls.maxDistance = 4;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = Math.PI * 0.56;
  controls.minAzimuthAngle = -1.0;
  controls.maxAzimuthAngle = 1.0;
  if (o.bg !== 'transparent') scene.background = new THREE.Color('#7a3a22');
  scene.add(new THREE.HemisphereLight('#ffe9cf', '#5a3420', 0.75));
  const lamp = new THREE.DirectionalLight('#ffe2b8', 2.1); // a warm workshop lamp, up and to the left
  lamp.position.set(-0.9, 1.9, 1.3);
  lamp.target.position.set(0, 0.4, 0);
  scene.add(lamp, lamp.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55);
  fill.position.set(1.4, 0.8, 1.6);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    lamp.castShadow = true;
    lamp.shadow.mapSize.set(1024, 1024);
    Object.assign(lamp.shadow.camera, { left: -0.45, right: 0.45, top: 0.5, bottom: -0.5, near: 0.5, far: 4 });
    lamp.shadow.bias = -0.0006;
    lamp.shadow.radius = 3;
  }

  const app = createApparatus(N, L0 * CM);
  scene.add(app.root);
  if (o.bg !== 'transparent') scene.add(createWorkshop(app.materials).root);
  const { spring, hanger, weights } = app;

  // the marks drawn over the scene: L₀ (dark) and x (red) on one line just left of the rule, L₀'s level across
  const flat = (color, opacity = 1) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false, depthWrite: false, toneMapped: false });
  const marks = new THREE.Group();
  marks.name = 'Marks';
  marks.userData.noExport = true;
  scene.add(marks);
  const dimL0 = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 1, 0.001), flat(COLORS.L0));
  const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.0016, 0.001), flat(COLORS.L0));
  const level = new THREE.Group(); // L₀'s level: a dashed line from the dimension line across to the spring
  const dashMat = flat(COLORS.L0, 0.8);
  for (let x = DIM_X - 0.006; x < 0.03; x += 0.008) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.0045, 0.0013, 0.001), dashMat);
    d.position.set(x + 0.00225, 0, 0);
    level.add(d);
  }
  level.position.set(0, TOP - L0 * CM, 0.03);
  dimL0.position.set(DIM_X, TOP - (L0 * CM) / 2, 0.03);
  dimL0.scale.y = L0 * CM;
  capTop.position.set(DIM_X, TOP, 0.03);
  for (const m of [dimL0, capTop, level]) m.renderOrder = 22;
  for (const d of level.children) d.renderOrder = 22;
  marks.add(dimL0, capTop, level);

  // the arrows: thick, flat colour in a white outline, drawn over the scenery
  let thick = 1;
  function boldArrow(name, color, r) {
    const core = createArrow({ name, radius: r, head: r * 4.6, headRadius: r * 2.6, material: flat(color) });
    const pad = r * 0.75;
    const outline = createArrow({
      name: `${name}Outline`,
      radius: r + pad,
      head: r * 4.6 + pad * 2.6,
      headRadius: r * 2.6 + pad * 1.9,
      material: flat('#ffffff'),
    });
    core.root.add(outline.root);
    core.root.renderOrder = 24;
    outline.root.renderOrder = 23;
    core.root.userData.noExport = true;
    const from0 = new THREE.Vector3();
    return {
      ...core,
      set(from, dir, length) {
        core.set(from, dir, length);
        core.root.scale.set(thick, 1, thick);
        from0.set(0, -pad, 0);
        if (length > 1e-9) outline.set(from0, UPV, length + pad * 2.2);
        else outline.hide();
      },
    };
  }
  const arrowT = boldArrow('Tension', COLORS.T, 0.0024);
  const arrowW = boldArrow('Weight', COLORS.W, 0.0024);
  const arrowX = boldArrow('Stretch', COLORS.x, 0.0018);
  scene.add(arrowT.root, arrowW.root, arrowX.root);
  const xCap = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.0022, 0.001), flat(COLORS.x));
  xCap.renderOrder = 25;
  marks.add(xCap);

  // what moves in the scene (the weights, the spring) keeps the frames coming; the camera and the pauses do not ask for
  // a redraw of the scene (the camera's own change does, without drawing the shadows again on kit 1.4)
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const quiet = createTweener();
  stage.addTicker((dt) => {
    quiet.tick(dt);
    return false;
  });
  const cancel = (k) => {
    tweener.cancel(k);
    quiet.cancel(k);
  };
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    n: 0, // weights on the hanger (what was last asked for)
    spring: { ...FRESH }, // the spring's history: { set, peak }
    L: L0, // cm: the spring's length as drawn now
    settled: { n: 0, spring: { ...FRESH } }, // what the panel describes: the last state the spring came to rest in
    moving: false,
    hanging: [], // per weight: 'tray' | 'hanger' | 'moving'
    path: [{ e: 0, s: 0 }], // the graph: the points in the order they happened
    loads: [],
    found: { hang: false, double: false, back: false, limit: false, beyond: false, set: false },
    show: { numbers: true, graphWords: true, graphPoints: true, xLabel: true },
    marks: [], // letters on graph points (the test)
    look: o.look === 'close' ? 'close' : 'all',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    run: 0, // a token: every new step, reset or question bumps it
    tour: 0, // a token for the short camera visits
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const endY = (L = s.L) => TOP - L * CM; // where the spring ends (the pointer) in the world

  // ── the weights ─────────────────────────────────────────────────────────────
  const onHanger = () => s.hanging.filter((h) => h === 'hanger').length;
  /** Where weight i rests: on the hanger in its slot, or on the bench's block (the next to hang on top). */
  function restPos(i, out, L = s.L) {
    if (i < s.n || s.hanging[i] === 'hanger') return out.set(0, endY(L) + hanger.plateBottom + HANGER.plate + i * SLOT, 0);
    return out.set(TRAY.x, app.trayTop + (MAX_N - 1 - i) * SLOT, TRAY.z);
  }
  const P = new THREE.Vector3();
  function placeWeights() {
    for (let i = 0; i < MAX_N; i++) {
      if (s.hanging[i] === 'moving') continue;
      restPos(i, P);
      weights[i].root.position.copy(P);
    }
  }

  // ── the spring, the hanger, the marks, the arrows ─────────────────────────────
  function syncScene() {
    const L = s.L;
    spring.setLength(L * CM, s.spring.set > 0 ? 1 : 0);
    hanger.root.position.set(0, endY(L), 0);
    placeWeights();
    layoutArrows();
    stage.invalidate();
  }

  const FROM = new THREE.Vector3();
  function layoutArrows() {
    const perPx = (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
    thick = Math.min(2.6, Math.max(1, (3.4 * perPx) / 0.0048));
    const F = onHanger() * W1;
    const y = endY();
    arrowT.hide();
    arrowW.hide();
    if (F > 0 && s.look !== 'close') {
      // T in the spring, up from its end; W down from the hanger's plate: the same length (they balance at rest)
      arrowT.set(FROM.set(0, y + 0.004, 0.024), UPV, F * FORCE_LEN);
      arrowW.set(FROM.set(0, y + hanger.plateBottom - 0.003, 0.03), DOWN, F * FORCE_LEN);
    }
    const x = s.L - L0;
    if (x > 0.05) {
      arrowX.set(FROM.set(DIM_X, TOP - L0 * CM, 0.03), DOWN, x * CM);
      xCap.visible = true;
      xCap.position.set(DIM_X + 0.002, y, 0.03);
    } else {
      arrowX.hide();
      xCap.visible = false;
    }
  }

  /** The spring's length moves from a to b: a bounce that dies away, or (past the limit) a slow giving way. */
  function stretchTo(L1, { give = false, token }) {
    const L_from = s.L;
    const dur = give ? GIVE_S : SETTLE_S;
    return tweener
      .animate({
        key: 'spring',
        duration: dur,
        ease: ease.linear,
        onUpdate: (k) => {
          const tt = k * dur;
          if (give) s.L = L_from + (L1 - L_from) * (1 - (1 - k) ** 3);
          else s.L = L1 + (L_from - L1) * Math.exp(-3.4 * tt) * Math.cos(2 * Math.PI * 1.7 * tt);
          syncScene();
        },
      })
      .finished.then((done) => {
        if (token !== s.run) return false;
        s.L = L1;
        syncScene();
        return done;
      });
  }

  /** One weight from the bench onto the hanger (it slides on from the front, the slot round the rod). */
  function flyOn(i, token) {
    const w = weights[i].root;
    const a = w.position.clone(); // from where it is now (on the bench)
    s.hanging[i] = 'moving';
    const stop = new THREE.Vector3();
    return tweener
      .animate({
        key: `w${i}`,
        duration: HANG_S,
        ease: ease.linear,
        onUpdate: (k) => {
          // to the front of the hanger at its slot's height (an arc), then straight in onto the rod
          s.hanging[i] = 'hanger';
          restPos(i, stop);
          s.hanging[i] = 'moving';
          if (k < 0.7) {
            const q = ease.inOutCubic(k / 0.7);
            w.position.set(a.x + (0 - a.x) * q, a.y + (stop.y - a.y) * q + Math.sin(q * Math.PI) * 0.05, a.z + (0.11 - a.z) * q);
          } else {
            const q = ease.outCubic((k - 0.7) / 0.3);
            w.position.set(0, stop.y, 0.11 * (1 - q));
          }
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (token !== s.run) return false;
        s.hanging[i] = 'hanger';
        placeWeights();
        return done;
      });
  }

  /** Weights from the top of the stack down to `to` come off and go back to the bench. */
  function flyOff(to, token) {
    const ids = [];
    for (let i = MAX_N - 1; i >= to; i--) if (s.hanging[i] === 'hanger') ids.push(i);
    if (!ids.length) return Promise.resolve(true);
    const from = ids.map((i) => weights[i].root.position.clone());
    for (const i of ids) s.hanging[i] = 'moving';
    const end = ids.map((i) => {
      s.hanging[i] = 'tray';
      const p = restPos(i, new THREE.Vector3());
      s.hanging[i] = 'moving';
      return p;
    });
    return tweener
      .animate({
        key: 'off',
        duration: OFF_S,
        ease: ease.linear,
        onUpdate: (k) => {
          ids.forEach((i, j) => {
            const w = weights[i].root;
            if (k < 0.3) {
              const q = ease.inOutCubic(k / 0.3);
              w.position.set(from[j].x, from[j].y + 0.01 * q, from[j].z + 0.11 * q);
            } else {
              const q = ease.inOutCubic((k - 0.3) / 0.7);
              const ax = from[j].x;
              const ay = from[j].y + 0.01;
              w.position.set(ax + (end[j].x - ax) * q, ay + (end[j].y - ay) * q + Math.sin(q * Math.PI) * 0.06, 0.11 + (end[j].z - 0.11) * q);
            }
          });
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (token !== s.run) return false;
        for (const i of ids) s.hanging[i] = 'tray';
        placeWeights();
        return done;
      });
  }

  /** Jump to the end of whatever is moving (a new tap goes on from where the spring will be). */
  function settleNow() {
    if (!s.moving) return;
    s.run++;
    for (const k of ['spring', 'off', ...weights.map((_, i) => `w${i}`)]) cancel(k);
    for (let i = 0; i < MAX_N; i++) s.hanging[i] = i < s.n ? 'hanger' : 'tray';
    s.L = lengthOf(s.spring, s.n);
    s.moving = false;
    syncScene();
    arrive();
  }

  /** The spring has come to rest with s.n weights: the graph gets its point, the panel and the rule catch up. */
  function arrive() {
    const prev = s.settled;
    s.settled = { n: s.n, spring: { ...s.spring } };
    const pt = point(s.n, s.spring);
    const last = s.path[s.path.length - 1];
    if (!last || last.e !== pt.e || last.s !== pt.s) {
      s.path.push(pt);
      if (s.path.length > 60) s.path.splice(1, 1);
      if (s.n > 0 && !s.loads.some((p) => p.e === pt.e && p.s === pt.s)) s.loads.push({ ...pt, beyond: !onHookeLine(s.spring, s.n) });
    }
    if (s.mode === 'explore') {
      const f = s.found;
      if (s.n >= 1) f.hang = true;
      if (s.n >= 2 && onHookeLine(s.spring, s.n)) f.double = true;
      if (s.n === 0 && prev.n > 0 && s.spring.set === 0) f.back = true;
      if (s.n >= LIMIT_N) f.limit = true;
      if (beyond(s.n)) f.beyond = true;
      if (s.n === 0 && s.spring.set > 0) f.set = true;
    }
    refresh();
    emitChange();
  }
  const point = (n, sp) => ({ e: strain(sp, n), s: lakh(stress(n)) });

  // ── the student's steps ─────────────────────────────────────────────────────
  /** Hang one more weight (from the bench). */
  async function addWeight({ animate = true } = {}) {
    if (s.n >= MAX_N) {
      showHint(t('hint_max'), { duration: 2200 });
      action?.flash();
      return false;
    }
    settleNow();
    const token = ++s.run;
    const i = s.n;
    const was = s.spring;
    s.n++;
    s.spring = load(s.spring, s.n);
    const L1 = lengthOf(s.spring, s.n);
    const give = s.spring.peak > was.peak && beyond(s.n);
    emitChange();
    if (!animate) {
      s.hanging[i] = 'hanger';
      s.L = L1;
      syncScene();
      arrive();
      return true;
    }
    s.moving = true;
    refresh();
    fitCamera(0.6);
    audio.pop();
    const on = await flyOn(i, token);
    if (!on || token !== s.run) return false;
    audio.contact();
    const ok = await stretchTo(L1, { give, token });
    if (!ok || token !== s.run) return false;
    s.moving = false;
    arrive();
    // a short look close to the stretch the first times it teaches something
    const firstBeyond = give && s.found.beyond && s.spring.peak === LIMIT_N + 1;
    if (s.mode === 'explore' && (s.n <= 2 || firstBeyond) && !(s.found.back && s.n <= 2)) visitClose();
    return true;
  }

  /** Take weights off down to `to` (all of them: to = 0). */
  async function removeTo(to, { animate = true } = {}) {
    if (s.n === 0) {
      showHint(t('hint_none'), { duration: 2000 });
      return false;
    }
    settleNow();
    const token = ++s.run;
    const k = Math.max(0, Math.min(s.n, to));
    s.n = k;
    const L1 = lengthOf(s.spring, s.n);
    emitChange();
    if (!animate) {
      for (let i = 0; i < MAX_N; i++) s.hanging[i] = i < k ? 'hanger' : 'tray';
      s.L = L1;
      syncScene();
      arrive();
      return true;
    }
    s.moving = true;
    refresh();
    audio.pop();
    const off = flyOff(k, token);
    await wait(0.3 * OFF_S);
    if (token !== s.run) return false;
    const ok = await stretchTo(L1, { token });
    await off;
    if (!ok || token !== s.run) return false;
    s.moving = false;
    arrive();
    fitCamera(0.7);
    if (s.mode === 'explore' && s.n === 0 && s.spring.set > 0) visitClose();
    return true;
  }

  /** A fresh spring (the weights back on the bench). */
  function newSpring() {
    s.run++;
    s.tour++;
    for (const k of ['spring', 'off', 'wait', ...weights.map((_, i) => `w${i}`)]) cancel(k);
    s.n = 0;
    s.spring = { ...FRESH };
    s.L = L0;
    s.moving = false;
    for (let i = 0; i < MAX_N; i++) s.hanging[i] = 'tray';
    s.path = [{ e: 0, s: 0 }];
    s.loads = [];
    s.settled = { n: 0, spring: { ...FRESH } };
    syncScene();
    refresh();
    emitChange();
    if (!s.userMovedCamera) flyTo(viewPose('all'), 0.6);
    s.look = 'all';
  }

  const wait = (sec) => quiet.animate({ key: 'wait', duration: sec }).finished;

  /** The camera goes close to the stretch for a moment, then back to the whole spring. */
  async function visitClose() {
    if (s.userMovedCamera) return;
    const tour = ++s.tour;
    s.look = 'close';
    refresh();
    await flyTo(viewPose('close'), 0.8);
    if (tour !== s.tour) return;
    await quiet.animate({ key: 'visit', duration: CLOSE_HOLD }).finished;
    if (tour !== s.tour || s.userMovedCamera) return;
    s.look = 'all';
    refresh();
    await flyTo(viewPose('all'), 0.8);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  /** What the big button does next, and the student's step number for it. */
  function plan() {
    const f = s.found;
    const n = s.n;
    if (overstretched(s.spring) && n === 0) return { act: 'new', label: 'act_new', step: '' };
    if (n >= MAX_N) return { act: 'off', label: 'act_off', step: f.set ? '' : 5 };
    if (!f.hang) return { act: 'hang', label: 'act_hang1', step: 1 };
    if (!f.double) return { act: 'hang', label: n ? 'act_hang2' : 'act_hang1', step: 2 };
    if (!f.back) return n ? { act: 'off', label: 'act_off', step: 3 } : { act: 'hang', label: 'act_hang1', step: '' };
    if (!f.beyond) return { act: 'hang', label: n ? 'act_more' : 'act_hang1', step: 4 };
    if (!f.set) return n > LIMIT_N ? { act: 'off', label: 'act_off', step: 5 } : { act: 'hang', label: 'act_more', step: '' };
    return { act: 'hang', label: n ? 'act_hang2' : 'act_hang1', step: '' };
  }

  function outcomeHtml() {
    const { n, spring: sp } = s.settled;
    const x = stretchOf(sp, n);
    const x1 = stretchOf(FRESH, 1);
    if (n === 0) {
      if (sp.set > 0) return t('out_set', { L: N(lengthOf(sp, 0)), s: N(round(sp.set * L0, 2)) });
      if (s.found.back && s.path.length > 2) return t('out_back', { L0: N(L0) });
      return t('out_rest', { L0: N(L0), W: N(W1), A: N(AREA_MM2) });
    }
    if (sp.set > 0 && n <= sp.peak && !beyond(n)) return t('out_set_some', { n: N(n), x: N(x), s: N(round(sp.set * L0, 2)) });
    if (beyond(n)) return t('out_beyond', { n: N(n), x: N(x), xx: N(round(x1 * n, 2)) });
    if (n === 1) return t('out_one', { n: N(n), x: N(x) });
    return t('out_times', { n: N(n), x: N(x) });
  }

  function ruleHtml() {
    const f = s.found;
    if (f.set && s.spring.set === 0) return t('rule_law');
    if (f.set) return t('rule_set');
    if (f.beyond) return t('rule_beyond');
    if (f.limit && f.back) return t('rule_limit', { F: N(LIMIT_N * W1) });
    if (f.back) return t('rule_back');
    if (f.double) return t('rule_double', { two: N(2) });
    if (f.hang) return t('rule_hang');
    return t('rule_start');
  }

  function sumsHtml() {
    const { n, spring: sp } = s.settled;
    const L = lengthOf(sp, n);
    const e = strain(sp, n);
    const out = {
      strain: t('sum_strain', { L: N(L), L0: N(L0), e: N(e) }),
      stress: t('sum_stress', { F: N(n * W1), A: N(AREA_M2.toFixed(5)), S: paText(stress(n)) }),
      ratio: '',
    };
    if (n === 0) out.ratio = t(sp.set > 0 ? 'sum_ratio_set' : 'sum_ratio_none');
    else if (onHookeLine(sp, n)) out.ratio = t('sum_ratio', { R: paText(MODULUS) });
    else out.ratio = t('sum_ratio_off', { R: paText(round(ratio(sp, n) / 10000, 0) * 10000) });
    return out;
  }

  function refresh() {
    $('.el-val').textContent = N(s.n * W1);
    for (const b of eq.querySelectorAll('[data-step]')) {
      const dir = Number(/** @type {HTMLElement} */ (b).dataset.step);
      b.classList.toggle('off', dir < 0 ? s.n <= 0 : s.n >= MAX_N);
    }
    const L = lengthOf(s.settled.spring, s.settled.n);
    const len = /** @type {HTMLElement} */ ($('.el-len'));
    const lenHtml = t('lengths', { L0: N(L0), L: N(L) });
    if (len.dataset.html !== lenHtml) {
      len.innerHTML = lenHtml;
      len.dataset.html = lenHtml;
    }
    const sums = sumsHtml();
    for (const k of Object.keys(sums)) {
      const el = /** @type {HTMLElement} */ (eq.querySelector(`[data-sum="${k}"]`));
      if (el.dataset.html !== sums[k]) {
        el.innerHTML = sums[k];
        el.dataset.html = sums[k];
      }
    }
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label });
    }
    drawGraph();
    syncLabels();
    stage.invalidate();
  }

  // ── the graph ───────────────────────────────────────────────────────────────
  const graphText = {
    axisS: t('g_axisS'),
    axisE: t('g_axisE'),
    limit: t('g_limit'),
    limit2: t('g_limit2').split('|'),
  };
  const graph = createGraph(ui.stage, { N, text: graphText });
  const G = { x: 0, y: 0, w: 1, h: 1, side: 0 };
  // beside the 3D the graph goes into the panel (under the sheet); on a portrait frame, or with the panel hidden, it
  // stays a card on the 3D view
  const panelEl = /** @type {HTMLElement} */ (root.querySelector('.pvc-panel'));
  const shellEl = /** @type {HTMLElement} */ (root.querySelector('.pvc-shell'));
  function placeGraph() {
    const W = stage.width;
    const H = stage.height;
    const pr = panelEl.getBoundingClientRect();
    const side = shellEl.dataset.panel !== 'closed' && pr.width > 0 && pr.left >= ui.stage.getBoundingClientRect().right - 2;
    graph.el.classList.toggle('in-panel', side);
    if (side) {
      if (graph.el.parentElement !== panelEl) panelEl.append(graph.el);
      const w = Math.max(160, Math.round(panelEl.clientWidth - 28));
      graph.place({ x: 0, y: 0, w, h: Math.round(Math.min(230, w * 0.72)) });
      return;
    }
    if (graph.el.parentElement !== ui.stage) ui.stage.append(graph.el);
    const wide = W / Math.max(1, H) >= 1.15;
    if (wide) {
      G.w = Math.round(Math.min(330, Math.max(170, W * 0.4)));
      G.h = Math.round(Math.min(250, Math.max(140, H - 70)));
      G.x = W - G.w - 10;
      G.y = Math.round(Math.max(54, (H - G.h) / 2 + 22));
      if (G.y + G.h > H - 8) G.y = Math.max(50, H - G.h - 8);
    } else {
      G.w = Math.round(Math.min(250, Math.max(150, W * 0.46)));
      G.h = Math.round(Math.min(230, Math.max(130, Math.min(H * 0.52, G.w * 1.0))));
      G.x = W - G.w - 6;
      G.y = H - G.h - 8;
    }
    graph.place(G);
  }
  function drawGraph() {
    const f = s.found;
    const { n, spring: sp } = s.settled;
    const inQuiz = s.mode === 'quiz';
    const words = s.show.graphWords;
    const dots = s.show.graphPoints;
    const show = {
      hooke: words && (inQuiz || f.double),
      limit: words && (inQuiz || f.beyond || (f.limit && f.back)),
      bands: words && (inQuiz || f.beyond),
      set: words && dots && sp.set > 0 && n === 0,
    };
    graph.draw({
      path: dots ? s.path : [],
      // in the test every point is a circle until the answer (a square would show where the limit is)
      loads: dots ? (words ? s.loads : s.loads.map((p) => ({ ...p, beyond: false }))) : [],
      now: dots && (n > 0 || sp.set > 0) ? point(n, sp) : null,
      show,
      limit: point(LIMIT_N, FRESH),
      set: sp.set,
      marks: s.marks,
    });
    graph.label(t('g_aria', { k: N(s.loads.length) }));
    drawKey(show);
  }

  // the graph's key in the panel: what its marks mean, the newest first; as many as fit on the line
  let lastKey = '';
  function drawKey(show) {
    const kinds = show.set ? ['set', 'out', 'in', 'hooke'] : show.bands ? ['in', 'out', 'hooke'] : show.hooke ? ['hooke', 'point'] : ['point'];
    const want = `${kinds.join()}|${keyEl.clientWidth}`;
    if (want === lastKey) return;
    lastKey = want;
    const html = (list) => list.map((k) => `<span class="el-k">${keySwatch(k)}${t(`k_${k}`)}</span>`).join('');
    keyEl.innerHTML = html(kinds);
    while (kinds.length > 1 && keyEl.scrollWidth > keyEl.clientWidth + 1) {
      kinds.pop();
      keyEl.innerHTML = html(kinds);
    }
    keyEl.setAttribute('aria-label', kinds.map((k) => t(`k_${k}`)).join(', '));
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const P0 = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  function arrowBoxes() {
    const list = [];
    for (const a of [arrowT, arrowW, arrowX]) {
      if (!a.root.visible) continue;
      toScreen(a.root.position, P0);
      toScreen(a.tip, P1);
      list.push({ left: Math.min(P0.x, P1.x) - 8, top: Math.min(P0.y, P1.y) - 6, right: Math.max(P0.x, P1.x) + 8, bottom: Math.max(P0.y, P1.y) + 6 });
    }
    return list;
  }
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  function screenBox(b3) {
    let i = 0;
    for (const x of [b3.min.x, b3.max.x])
      for (const y of [b3.min.y, b3.max.y]) for (const z of [b3.min.z, b3.max.z]) corners[i++].set(x, y, z).project(camera);
    const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
    const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }
  const springBox3 = new THREE.Box3();
  const stackBox3 = new THREE.Box3();
  /** The spring, the hanger with its weights, and the rule: labels keep off them. */
  function bodyBoxes() {
    const y = endY();
    springBox3.min.set(-0.022, y, -0.02);
    springBox3.max.set(0.022, TOP, 0.02);
    stackBox3.min.set(-WEIGHT.r, y + hanger.plateBottom, -0.02);
    stackBox3.max.set(WEIGHT.r, y, 0.02);
    return [screenBox(springBox3), screenBox(stackBox3)];
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, graph.el, arrowBoxes, bodyBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const LEFT = [spot(-12, 0), spot(-12, -16), spot(-12, 16), spot(-12, -32), spot(-12, 32)];
  const pts = { L0: new THREE.Vector3(), x: new THREE.Vector3(), T: new THREE.Vector3(), W: new THREE.Vector3() };
  const labelState = new Map();
  function syncLabels() {
    const want = new Map();
    const F = onHanger() * W1;
    const x = s.L - L0;
    const settledF = s.settled.n * W1;
    const steady = !s.moving;
    want.set('L0', {
      text: t('lbl_L0', { v: N(L0) }),
      point: () => pts.L0.set(DIM_X, TOP - (L0 * CM) / 2, 0.03),
      spots: LEFT,
      color: INK.L0,
      optional: true, // close to x its middle is off the view
    });
    if (x > 0.3 && s.show.xLabel)
      want.set('x', {
        text: !s.show.numbers
          ? t('lbl_x_q')
          : s.settled.n === 0 && s.spring.set > 0
            ? t('lbl_xs', { v: N(round(x, 1)) })
            : t('lbl_x', { v: N(round(x, 1)) }),
        point: () => pts.x.set(DIM_X, TOP - (L0 + (s.L - L0) / 2) * CM, 0.03),
        spots: LEFT,
        color: INK.x,
      });
    if (F > 0 && steady && settledF > 0 && s.look !== 'close') {
      want.set('T', {
        text: s.show.numbers ? t('lbl_T', { v: N(settledF) }) : 'T',
        point: () => pts.T.copy(arrowT.tip),
        spots: [
          spot(22, -4),
          spot(22, -20),
          spot(-22, -4),
          spot(22, 12),
          spot(-22, -20),
          spot(0, -24),
          spot(48, -4),
          spot(-48, -4),
          spot(48, -24),
          spot(-48, -24),
        ],
        color: INK.T,
        optional: true,
      });
      want.set('W', {
        text: s.show.numbers ? t('lbl_W', { v: N(settledF) }) : 'W',
        point: () => pts.W.copy(arrowW.root.position).addScaledVector(DOWN, (settledF * FORCE_LEN) / 2),
        spots: [spot(-16, 0), spot(16, 0), spot(-16, -14), spot(16, -14), spot(-16, 14), spot(16, 14)],
        color: INK.W,
        optional: true,
      });
    }
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, optional: w.optional });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  /** The whole spring with its weights and arrows, or close to the stretch x (L₀'s level down to the pointer). */
  function viewPose(look = s.look) {
    const Lmax = Math.max(s.L, lengthOf(s.spring, s.n));
    const F = s.n * W1;
    const yEnd = TOP - Lmax * CM;
    if (look === 'close') {
      const x = Math.max(lengthOf(s.spring, s.n), s.L) - L0;
      box.min.set(DIM_X - 0.022, yEnd - 0.03, -0.01);
      box.max.set(0.026, TOP - L0 * CM + 0.03, 0.03);
      if (x < 3) box.min.y = TOP - (L0 + 3) * CM - 0.03;
    } else {
      const low = yEnd + hanger.plateBottom - F * FORCE_LEN - 0.02;
      box.min.set(DIM_X - 0.06, Math.min(low, TOP - 0.33), -0.02);
      box.max.set(0.05, TOP + 0.03, 0.03);
    }
    const margin = { top: 44, bottom: 10, left: 8, right: G.w + 14 };
    return fitPose({ box, dir: VIEW_DIR, camera, width: stage.width, height: stage.height, margin });
  }
  function fitCamera(dur = 0.6) {
    if (s.userMovedCamera) return Promise.resolve(false);
    return flyTo(viewPose(), dur);
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      quiet.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      layoutArrows();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return quiet
      .animate({
        key: 'camera',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          camera.position.lerpVectors(p0, position, k);
          controls.target.lerpVectors(t0, aim, k);
          controls.update(); // its change event asks for the frame
          layoutArrows();
        },
      })
      .finished.then((done) => {
        if (done) refresh();
        return done;
      });
  }
  function setLook(look, { animate = true } = {}) {
    s.tour++;
    s.look = look === 'close' ? 'close' : 'all';
    s.userMovedCamera = false;
    emitChange();
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
    s.userMovedCamera = true;
    s.tour++;
    quiet.cancel('camera');
  });
  controls.addEventListener('change', () => layoutArrows());
  stage.onResize(() => {
    placeGraph();
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── the action: the big button, the ring round the hanger, a tap on the spring ───
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not hang two weights at once
    lastAct = now();
    hintOff();
    const p = plan();
    if (p.act === 'new') return newSpring();
    if (p.act === 'off') return removeTo(0);
    return addWeight();
  }
  const ringBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_hang1',
    target: () => {
      const y = endY();
      if (plan().act === 'new') {
        ringBox.min.set(-0.022, y, -0.02);
        ringBox.max.set(0.022, TOP, 0.02);
      } else {
        ringBox.min.set(-WEIGHT.r - 0.002, y + hanger.plateBottom - 0.002, -0.02);
        ringBox.max.set(WEIGHT.r + 0.002, y + 0.01, 0.02);
      }
      return ringBox;
    },
    pad: 6,
    avoid: [ui.corner, ui.hint, graph.el, () => anno.boxes(), arrowBoxes, () => bodyBoxes()[0]],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // the badge is placed after the labels (it keeps clear of them where it can); if it still had to sit on one, the
  // labels are placed again at once, now keeping clear of the badge (a label moves to its next spot)
  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  stage.onAfterRender(() => {
    const b = action?.box();
    if (b && anno.boxes().some((r) => overlaps(b, r))) anno.update();
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitList = [spring.coil, ...hanger.meshes, ...weights.map((w) => w.body)];
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** Is the hanger, a weight or the spring under this point (or within a finger's width of it on a touch)? */
  function pick(p, touch = false) {
    const offs = touch
      ? [
          [0, 0],
          [10, 0],
          [-10, 0],
          [0, 10],
          [0, -10],
        ]
      : [[0, 0]];
    for (const [dx, dy] of offs) {
      ndc.set(((p.x + dx) / stage.width) * 2 - 1, -((p.y + dy) / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.intersectObjects(hitList, false).length > 0) return true;
    }
    return false;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e), e.pointerType === 'touch')) return;
      e.stopPropagation();
      e.preventDefault();
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

  function step(dir) {
    if (s.locked) return lockedNudge();
    if (dir > 0) return addWeight();
    return removeTo(s.n - 1);
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const { n, spring: sp } = s.settled;
    const p = plan();
    return {
      n: s.n,
      F: s.n * W1, // N
      L0,
      L: lengthOf(s.spring, s.n), // cm, once the spring has settled
      x: stretchOf(s.spring, s.n),
      strain: strain(s.spring, s.n),
      stress: stress(s.n), // Pa
      ratio: ratio(s.spring, s.n),
      set: round(s.spring.set * L0, 2), // cm the spring keeps with nothing on it
      peak: s.spring.peak,
      beyondLimit: overstretched(s.spring),
      settled: !s.moving && n === s.n && sp.peak === s.spring.peak,
      points: s.loads.length,
      found: { ...s.found },
      next: p.act,
      look: s.look,
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.n, snap.peak, snap.settled, snap.found, snap.mode, snap.view, snap.look]);
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
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="el-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  /** A question's scene: this spring with n weights on it, its graph as it would be, nothing moving. */
  async function scene_({ n, history = [], show = {}, look = 'all', marks = [] }) {
    s.run++;
    s.tour++;
    for (const k of ['spring', 'off', 'wait', 'visit', ...weights.map((_, i) => `w${i}`)]) cancel(k);
    s.spring = { ...FRESH };
    s.path = [{ e: 0, s: 0 }];
    s.loads = [];
    for (const k of [...history, n]) {
      s.spring = load(s.spring, k);
      const pt = point(k, s.spring);
      s.path.push(pt);
      if (k > 0 && !s.loads.some((p) => p.e === pt.e && p.s === pt.s)) s.loads.push({ ...pt, beyond: !onHookeLine(s.spring, k) });
    }
    s.n = n;
    s.moving = false;
    for (let i = 0; i < MAX_N; i++) s.hanging[i] = i < n ? 'hanger' : 'tray';
    s.L = lengthOf(s.spring, n);
    s.settled = { n, spring: { ...s.spring } };
    s.show = { numbers: true, graphWords: true, graphPoints: true, xLabel: true, ...show };
    s.marks = marks;
    s.look = look;
    syncScene();
    refresh();
    return flyTo(viewPose(), 0.6);
  }
  function revealAll() {
    s.show = { numbers: true, graphWords: true, graphPoints: true, xLabel: true };
    s.marks = [];
    refresh();
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const cm = (v) => t('c_unit', { v: N(v) });

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
        settleNow();
        learnSaved = { n: s.n, spring: { ...s.spring }, path: s.path.map((p) => ({ ...p })), loads: s.loads.map((p) => ({ ...p })), look: s.look };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.run++;
        s.tour++;
        for (const k of ['spring', 'off', 'wait', 'visit', ...weights.map((_, i) => `w${i}`)]) cancel(k);
        const saved = learnSaved;
        s.show = { numbers: true, graphWords: true, graphPoints: true, xLabel: true };
        s.marks = [];
        if (saved) {
          s.n = saved.n;
          s.spring = saved.spring;
          s.path = saved.path;
          s.loads = saved.loads;
          s.look = 'all';
        }
        s.moving = false;
        for (let i = 0; i < MAX_N; i++) s.hanging[i] = i < s.n ? 'hanger' : 'tray';
        s.L = lengthOf(s.spring, s.n);
        s.settled = { n: s.n, spring: { ...s.spring } };
        syncUI();
        syncScene();
        refresh();
        emitChange();
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['strain', 'stress', 'hooke', 'limit', 'set'][i % 5];
        if (kind === 'strain') {
          const n = pickOne([1, 2, 3]);
          await scene_({ n, look: 'close', show: { numbers: false, xLabel: false, graphWords: false, graphPoints: false } });
          if (!alive()) return null;
          question = { kind, n };
          const items = strainChoices(n);
          return {
            text: t('q_strain', { L0: N(L0) }),
            ...choicesOf(items, kind, (x) => (x.key === 'cm' || x.key === 'unit' ? cm(x.v) : N(x.v))),
          };
        }
        if (kind === 'stress') {
          const n = pickOne([2, 3, 4]);
          await scene_({ n, show: { numbers: false, graphWords: false, graphPoints: false } });
          if (!alive()) return null;
          question = { kind, n };
          return {
            text: t('q_stress', { W: N(W1), A: N(AREA_M2.toFixed(5)) }),
            ...choicesOf(stressChoices(n), kind, (x) => (x.key === 'force' ? `${N(x.v)}&nbsp;N` : paText(x.v))),
          };
        }
        if (kind === 'hooke') {
          const n = pickOne([3, 4]);
          await scene_({ n: 1, show: { graphWords: false } });
          if (!alive()) return null;
          question = { kind, n };
          return { text: t('q_hooke', { x: N(stretchOf(FRESH, 1)), n: N(n) }), ...choicesOf(hookeChoices(n), kind, (x) => cm(x.v)) };
        }
        if (kind === 'limit') {
          await scene_({ n: MAX_N, history: [1, 2, 3, 4, 5], show: { graphWords: false } });
          if (!alive()) return null;
          question = { kind };
          return { text: t('q_limit'), ...choicesOf(limitChoices(), kind, (x) => paText(x.v * 100000)) };
        }
        await scene_({ n: 0, history: [1, 2, 3, 4, 5, 6], show: { graphWords: false } });
        if (!alive()) return null;
        question = { kind: 'set' };
        const items = ['c_set_right', 'c_set_never', 'c_set_hooke', 'c_set_restore'].map((key) => ({ key }));
        return { text: t('q_set', { n: N(MAX_N), L0: N(L0) }), ...choicesOf(items, 'set', (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note_ = (map) =>
          wrongKey && map[wrongKey]
            ? ` ${t(map[wrongKey], { Amm: N(AREA_MM2), A: N(AREA_M2.toFixed(5)), x: N(stretchOf(FRESH, 1)), S: paText(stress(LIMIT_N)) })}`
            : '';
        if (k === 'strain') {
          revealAll();
          const L = lengthOf(FRESH, question.n);
          return (
            t('why_strain', { L: N(L), L0: N(L0), e: N(strain(FRESH, question.n)) }) +
            note_({ cm: 'mis_strain_cm', ratio: 'mis_strain_ratio', unit: 'mis_strain_unit' })
          );
        }
        if (k === 'stress') {
          revealAll();
          return (
            t('why_stress', { S: paText(stress(question.n)), F: N(question.n * W1), A: N(AREA_M2.toFixed(5)) }) +
            note_({ force: 'mis_stress_force', mm2: 'mis_stress_mm2', zero: 'mis_stress_zero' })
          );
        }
        if (k === 'hooke') {
          // the picture shows it: n weights on the same spring
          const n = question.n;
          const shown = scene_({ n });
          const token = s.run; // a question after this one must not get this reveal
          shown.then(() => {
            if (token === s.run) revealAll();
          });
          const x1 = stretchOf(FRESH, 1);
          return (
            t('why_hooke', { v: N(round(x1 * n, 2)), n: N(n), x: N(x1) }) +
            note_({ same: 'mis_hooke_same', count: 'mis_hooke_count', square: 'mis_hooke_square' })
          );
        }
        revealAll();
        if (k === 'limit')
          return t('why_limit', { S: paText(stress(LIMIT_N)) }) + note_({ top: 'mis_limit_top', after: 'mis_limit_after', early: 'mis_limit_early' });
        return t('why_set') + note_({ c_set_never: 'mis_set_never', c_set_hooke: 'mis_set_hooke', c_set_restore: 'mis_set_restore' });
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
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.step) step(Number(b.dataset.step));
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
        else newSpring();
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
      ['r', 'R', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', '1', '2'].includes(k) ||
      ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (k === 'ArrowUp' || k === 'ArrowRight' || k === '+') step(1);
    else if (k === 'ArrowDown' || k === 'ArrowLeft' || k === '-') step(-1);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') newSpring();
    else if (k === '1') setLook('all');
    else if (k === '2') setLook('close');
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  for (let i = 0; i < MAX_N; i++) s.hanging[i] = 'tray';
  if (o.spring === 'stretched') {
    for (const k of [1, 2, 3, 4, 5, 6, 0]) {
      s.spring = load(s.spring, k);
      s.path.push(point(k, s.spring));
      if (k > 0) s.loads.push({ ...point(k, s.spring), beyond: !onHookeLine(s.spring, k) });
    }
    Object.assign(s.found, { hang: true, double: true, back: true, limit: true, beyond: true, set: true });
  }
  const n0 = Math.max(0, Math.min(MAX_N, Math.round(Number(o.n) || 0)));
  for (let k = 1; k <= n0; k++) {
    s.spring = load(s.spring, k);
    s.n = k;
    const pt = point(k, s.spring);
    s.path.push(pt);
    if (!s.loads.some((p) => p.e === pt.e && p.s === pt.s)) s.loads.push({ ...pt, beyond: !onHookeLine(s.spring, k) });
    s.found.hang = true;
    if (k >= 2 && onHookeLine(s.spring, k)) s.found.double = true;
  }
  for (let i = 0; i < MAX_N; i++) s.hanging[i] = i < s.n ? 'hanger' : 'tray';
  s.L = lengthOf(s.spring, s.n);
  s.settled = { n: s.n, spring: { ...s.spring } };
  syncUI();
  placeGraph();
  syncScene();
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
     * Change any of: n (weights on the spring, 0–6: hung on or taken off one by one, so a spring taken past its limit
     * keeps its permanent set), spring ('fresh': a new spring), look ('all' | 'close'), view ('front' | '3d'),
     * found ({ hang, double, back, limit, beyond, set }: what the rule has already told). animate: false lands at once.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.spring === 'fresh') newSpring();
      if (p.found) {
        Object.assign(s.found, p.found);
        refresh();
      }
      if (p.n != null) {
        const target = Math.max(0, Math.min(MAX_N, Math.round(Number(p.n))));
        if (!animate) {
          settleNow();
          while (s.n < target) await addWeight({ animate: false });
          if (s.n > target) await removeTo(target, { animate: false });
          fitCamera(0);
        } else if (target > s.n) {
          while (s.n < target) if (!(await addWeight())) break;
        } else if (target < s.n) await removeTo(target);
      }
      if (p.look) await setLook(p.look, { animate });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = { hang: false, double: false, back: false, limit: false, beyond: false, set: false };
      s.show = { numbers: true, graphWords: true, graphPoints: true, xLabel: true };
      newSpring();
      await setView('front', { animate: false });
      await setLook('all', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The stand, the rule, the spring as it is now, the hanger and the weights, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Elasticity';
      g.add(app.root.clone(true));
      return g;
    },
  };
}
