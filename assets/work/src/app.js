// Work (কাজ), book p100, topic 4.1: the student view. A person leans on a wooden crate and pushes it s metres with a
// force F, lets go, and the crate slides d metres more before it stops: W = Fs counts up only while the hands push,
// and stays put over d (the book's example). The second example pushes the crate against a wall: s = 0, W = 0 (the
// book's দারোয়ান). A small calculator (tap steppers for F and s) works W = Fs out with units; a 5-question test.
// The panel is the kit's clean sheet (one action, one result, one rule): docs/student-kit.md.
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
import { CRATE, createCrate } from './crate.js';
import { createFloor, onTape, TAPE, WALL } from './floor.js';
import { createI18n, group } from './i18n.js';
import { createPusher } from './person.js';
import { createScenery } from './scenery.js';
import {
  choicesFrom,
  clampF,
  clampS,
  DEFAULTS as START,
  F_RANGE,
  fixed1,
  forceMistakes,
  motionAt,
  plain,
  plan,
  roundTo,
  S_RANGE,
  shuffle,
  slideOf,
  work,
  workMistakes,
  workSoFar,
} from './work.js';

export const DEFAULTS = {
  example: 'push', // 'push' (push s, let go, slides d) | 'wall' (pushed against a wall)
  F: START.F, // N
  s: START.s, // m
  at: '', // seconds into the run, held still (pictures); empty: at rest before the push
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the crate pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { F: '#ff6a13', s: '#1c6fd9', d: '#5f6b7a', W: '#237a35' };
// the labels' text in the same hues, dark enough to read on their white chips (at least 4.5 : 1)
const INK = { F: '#c2410c', s: '#1a5fbd', d: '#4f5967' };
const { L, H } = CRATE;
const HAND = { x: 0.4, y: 0.84, z: 0.17 }; // the palms on the crate's back, in the person's frame
const PALM = 0.012; // between the person's reach and the crate's back face
const REST = { x: 0.1, y: 0.8, z: 0.21 }; // where the hands hang when they let go
const RELEASE = 0.45; // s: the hands come off and the person stops
const WALL_T = 2.2; // s: the push against the wall (lean in 0.6 s, then hold)
// the s and d arrows lie on the tape's front band (floor.js), so their ends read against its ticks without parallax
const { y: ARROW_Y, z: ARROW_Z } = onTape(TAPE.band, 0.026);
const ELEVATION = 21; // degrees, the front view: high enough to see the tape and the arrows on the floor
const AZIMUTH = 20; // degrees, when the view is not much wider than the trip
const VIEW_3D = new THREE.Vector3(0.55, 0.45, 0.9).normalize();
const STEP_GAIT = 0.3; // m: both feet are on the floor at whole multiples of this (person.js's gait)
// m: grows with F (not to a stated scale); against the wall it stays over the crate, short of the bricks
const forceLength = (F, wall = false) => (wall ? 0.25 + 0.0049 * F : 0.35 + 0.0075 * F);
const lean = (F) => 0.33 + 0.12 * (F / F_RANGE.max);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'wk');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel: the examples, the calculator, one action, one result, one rule ──
  const stepper = (q, name) =>
    `<div class="wk-step c-${q}" role="group" aria-label="${t(name)}">
      <span class="wk-name">${t(name).replace(/^(.*) ([Fs])$/, '<span class="wk-word">$1 </span><i>$2</i>')}</span>
      <button type="button" class="wk-btn" data-act="${q}-" aria-label="${t(`${q}_down`)}">${ICONS.minus}</button>
      <b class="wk-val" data-v="${q}" aria-live="polite"></b>
      <button type="button" class="wk-btn" data-act="${q}+" aria-label="${t(`${q}_up`)}">${ICONS.plus}</button>
    </div>`;
  const sheetHtml = cleanSheet(t, {
    examples: {
      label: 'examples',
      results: true,
      items: [
        { id: 'push', label: 'ex_push' },
        { id: 'wall', label: 'ex_wall' },
      ],
    },
    quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
    lines: { action: 1, outcome: 1, rule: 3 },
  }).replace(
    '<div class="pvc-act-row"',
    `<div class="wk-calc" role="group" aria-label="${t('calc')}">${stepper('F', 'calc_F')}${stepper('s', 'calc_s')}</div><div class="pvc-act-row"`,
  );
  const ui = buildStudentShell(root, t, { learn: sheetHtml, learnAlign: 'start' });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const el = {
    F: $('[data-v="F"]'),
    s: $('[data-v="s"]'),
    Fminus: $('[data-act="F-"]'),
    Fplus: $('[data-act="F+"]'),
    sminus: $('[data-act="s-"]'),
    splus: $('[data-act="s+"]'),
    sStep: $('.wk-step.c-s'),
    outcome: $('.pvc-outcome'),
  };

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.05, far: 80, environment: 'studio-light', environmentIntensity: 0.45 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 1;
  controls.maxDistance = 30;
  controls.enablePan = false;
  controls.enableRotate = false;
  // the setting: a house's courtyard (teal boundary wall, iron gate, the guard's stool, houses and sky beyond)
  if (o.bg !== 'transparent') scene.add(createScenery().root);
  // a soft fill (sky above, the warm tiles below) and the studio reflections turned down, so the sun's shadows read
  scene.add(new THREE.HemisphereLight(0xe8f4ff, 0xc7924a, 0.5));
  const key = new THREE.DirectionalLight(0xfff1df, 0.3);
  key.position.set(-3, 5, 4);
  scene.add(key);

  const world = new THREE.Group();
  world.name = 'Work';
  scene.add(world);
  const floor = createFloor({ digit: N, unit: t('u_m') });
  const crate = createCrate();
  const person = createPusher({ shirt: '#f3efe6', trousers: '#2f3a56' });
  world.add(floor.root, crate.root, person.root);

  // bold arrows in an outline, drawn over everything: F white-edged (over the wall, the sky, the bricks), s and d
  // dark-edged (on the white tape)
  const arrows = {
    F: boldArrow('ForceF', COLORS.F, 0.034, { head: 0.17, headR: 0.09, pad: 0.016 }),
    s: boldArrow('DisplacementS', COLORS.s, 0.024, { head: 0.13, headR: 0.064, outline: '#10213a', pad: 0.009 }),
    d: boldArrow('SlideD', COLORS.d, 0.02, { head: 0.11, headR: 0.054, outline: '#1d2430', pad: 0.008 }),
  };
  for (const a of Object.values(arrows)) world.add(a.root);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // the morning sun, high and in front on the left: the shadows fall back and to the right, where they show.
  // Soft shadows on the courtyard floor from the person, the crate and the brick wall only, in a box fitted round
  // everywhere they go (from behind the person at the start to the crate's furthest stop, 6 m, and the wall's depth)
  const sun = new THREE.DirectionalLight(0xfff6e8, 1.7);
  sun.position.set(-1.2, 6, 4);
  sun.target.position.set(2.2, 0, 0);
  scene.add(sun, sun.target);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 512);
    Object.assign(sun.shadow.camera, { left: -4.1, right: 4.15, top: 4.1, bottom: -2.8, near: 3.9, far: 10.6 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.01;
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state: every line, label and arrow is drawn from it ─────────────────
  const s = {
    example: o.example === 'wall' ? 'wall' : 'push',
    F: clampF(o.F),
    sPlan: clampS(o.s),
    phase: 'ready', // 'ready' | 'push' | 'slide' | 'done' (the wall: 'ready' | 'push' | 'done')
    t: 0, // s since the push started
    paused: false,
    runs: { push: 0, wall: 0 },
    calc: false, // the steppers were used after a push: the rule turns to the calculator
    results: { push: null, wall: null }, // J, once seen
    labels: 'full', // 'full' | 'letters' (the test: read s off the tape)
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    lastAct: -1e9,
  };
  const planNow = () => plan(s.sPlan);
  const running = () => s.phase === 'push' || s.phase === 'slide';

  /** Where everything is now: the crate's front face (m from the start), the work so far, the person's pose. */
  function now() {
    if (s.example === 'wall') {
      const k = s.phase === 'ready' ? 0 : Math.min(1, s.t / 0.6);
      return { x: 0, sNow: 0, dNow: 0, W: 0, k, pushing: s.phase !== 'ready' };
    }
    const p = planNow();
    const m = s.phase === 'ready' ? { x: 0 } : s.phase === 'done' ? { x: p.s + p.d } : motionAt(p, s.t);
    const so = workSoFar(s.F, p.s, m.x);
    return { x: m.x, ...so, pushing: s.phase === 'push' };
  }

  // ── what the student sees: crate, person, arrows, labels ────────────────────
  const tmp = new THREE.Vector3();
  const XP = new THREE.Vector3(1, 0, 0);
  const handsAt = [new THREE.Vector3(), new THREE.Vector3()];
  const ease01 = (u) => u * u * (3 - 2 * u);
  function place() {
    const n = now();
    const p = planNow();
    crate.root.position.set(n.x - L / 2, 0, 0);
    floor.wall.visible = s.example === 'wall';
    floor.tape.visible = s.example === 'push';
    floor.placeWall(0);
    floor.markFront(n.x);

    // the person: hands on the crate's back while it is pushed; then they let go, take a last step and stand
    const back = (s.example === 'wall' ? 0 : n.x) - L - PALM - HAND.x;
    if (s.example === 'wall') {
      const tremble = s.phase === 'push' ? Math.sin(s.t * 55) * 0.004 : 0;
      handsAt[0].set(HAND.x, HAND.y, HAND.z);
      handsAt[1].set(HAND.x, HAND.y, -HAND.z);
      person.root.position.set(back, 0, 0);
      person.pose({ lean: lean(s.F) * (0.8 + 0.35 * n.k) + tremble, hands: handsAt });
    } else {
      const after = s.phase === 'done' ? RELEASE : s.phase === 'slide' ? Math.min(RELEASE, s.t - p.T1) : 0;
      const r = ease01(after / RELEASE);
      const gait0 = Math.min(n.x, p.s);
      const extra = s.phase === 'ready' || s.phase === 'push' ? 0 : Math.ceil(p.s / STEP_GAIT - 1e-9) * STEP_GAIT - p.s;
      const gait = gait0 + extra * r;
      for (const [i, z] of [HAND.z, -HAND.z].entries()) {
        handsAt[i].set(HAND.x + (REST.x - HAND.x) * r, HAND.y + (REST.y - HAND.y) * r, z * (1 - r) + Math.sign(z) * REST.z * r);
      }
      person.root.position.set(gait - L - PALM - HAND.x, 0, 0);
      const pushLean = s.phase === 'ready' ? 0.3 : lean(s.F);
      person.pose({ lean: pushLean + (0.08 - pushLean) * r, distance: gait, walking: true, hands: handsAt });
    }

    // F: over the crate while the hands push, from its back face forward
    const showF = n.pushing;
    const crateBack = (s.example === 'wall' ? 0 : n.x) - L;
    if (showF) arrows.F.set(tmp.set(crateBack + 0.03, H + 0.24, 0), XP, forceLength(s.F, s.example === 'wall'));
    else arrows.F.hide();
    // s (blue) and d (grey) on the floor in front of the path
    if (s.example === 'push' && n.x > 1e-3) arrows.s.set(tmp.set(0, ARROW_Y, ARROW_Z), XP, Math.min(n.x, p.s));
    else arrows.s.hide();
    if (s.example === 'push' && n.x > p.s + 1e-3) arrows.d.set(tmp.set(p.s, ARROW_Y, ARROW_Z), XP, n.x - p.s);
    else arrows.d.hide();
    labels(n, p);
    panel(n, p);
    stage.invalidate();
  }

  // ── labels on the picture (each only while what it names is shown) ──────────
  let action = null;
  // the person's head on the screen: no label or badge sits on it
  const headP = new THREE.Vector3();
  const headQ = new THREE.Vector3();
  const head = person.root.getObjectByName('AnatomicalHead');
  function headBox() {
    head.getWorldPosition(headP);
    headQ.copy(headP).y += 0.16;
    headP.y -= 0.14;
    headP.project(camera);
    headQ.project(camera);
    const x = (headP.x * 0.5 + 0.5) * stage.width;
    const y0 = (-headQ.y * 0.5 + 0.5) * stage.height;
    const y1 = (-headP.y * 0.5 + 0.5) * stage.height;
    const r = Math.max(14, (y1 - y0) * 0.9);
    return { left: x - r, top: y0 - 4, right: x + r, bottom: y1 + 8 };
  }
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox(), headBox] });
  const shown = new Map();
  const pF = new THREE.Vector3();
  const pS = new THREE.Vector3();
  const pD = new THREE.Vector3();
  const pS0 = new THREE.Vector3(0.02, ARROW_Y, ARROW_Z); // s = 0 at the wall: the crate's front face on the floor
  // F's label beside its head, ahead of the crate (never over the person's head)
  const TIP = [
    { dx: 14, dy: -18 },
    { dx: 14, dy: 18 },
    { dx: 0, dy: -26 },
  ];
  const BELOW = [
    { dx: 0, dy: 24 },
    { dx: 0, dy: -24 },
  ];
  const S0_SPOTS = [{ dx: -40, dy: 20 }, ...BELOW];
  function label(id, on, text, point, color, spots) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!shown.has(id)) {
      anno.add(id, { text, point: () => point, color, spots, kind: 'part' });
      shown.set(id, text);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
    }
  }
  function labels(n, p) {
    const letters = s.labels === 'letters';
    const fLen = forceLength(s.F, s.example === 'wall');
    pF.set((s.example === 'wall' ? 0 : n.x) - L + 0.03 + fLen + 0.05, H + 0.24, 0);
    label('F', arrows.F.root.visible, t('l_F', { F: s.F }), pF, INK.F, TIP);
    const sLen = Math.min(n.x, p.s);
    pS.set(sLen / 2, ARROW_Y, ARROW_Z);
    const sText = letters ? t('l_s_only') : t('l_s', { s: s.phase === 'push' ? fixed1(n.sNow) : plain(n.sNow) });
    label('s', arrows.s.root.visible, sText, pS, INK.s, BELOW);
    pD.set(p.s + Math.max(0, n.x - p.s) / 2, ARROW_Y, ARROW_Z);
    const dText = letters ? t('l_d_only') : t('l_d', { d: s.phase === 'slide' ? fixed1(n.dNow) : plain(n.dNow) });
    label('d', arrows.d.root.visible && n.x - p.s > 0.12, dText, pD, INK.d, BELOW);
    label('s0', s.example === 'wall' && s.phase === 'done', t('l_s0'), pS0, INK.s, S0_SPOTS);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const outcomeKey = { k: '' };
  // the steppers: written only when something changes (place() runs every frame of a push)
  let stepKey = '';
  function panel(n, p) {
    const lock = s.locked;
    const sFixed = s.example === 'wall';
    const key = `${s.F}|${s.sPlan}|${lock}|${sFixed}`;
    if (key !== stepKey) {
      stepKey = key;
      el.F.textContent = `${N(s.F)} ${t('u_N')}`;
      el.s.textContent = `${N(sFixed ? 0 : s.sPlan)} ${t('u_m')}`;
      el.Fminus.disabled = lock || s.F <= F_RANGE.min;
      el.Fplus.disabled = lock || s.F >= F_RANGE.max;
      el.sminus.disabled = lock || sFixed || s.sPlan <= S_RANGE.min;
      el.splus.disabled = lock || sFixed || s.sPlan >= S_RANGE.max;
      el.sStep.title = sFixed ? t('s_fixed') : '';
      el.sStep.classList.toggle('fixed', sFixed);
    }

    // the result: W = Fs with the numbers shown (the same 0.1 m number as the s label)
    let out;
    if (s.phase === 'ready') out = t('out_ready', { F: s.F, s: s.example === 'wall' ? 0 : s.sPlan });
    else if (s.example === 'wall') out = t('out_work', { F: s.F, s: 0, W: 0 });
    else {
      const sTxt = s.phase === 'push' ? fixed1(n.sNow) : plain(n.sNow);
      out = t('out_work', { F: s.F, s: sTxt, W: group(roundTo(n.W, 1)) });
    }
    sheet.outcome(out);
    const k = s.phase === 'ready' ? 'ready' : 'work';
    if (outcomeKey.k !== k) el.outcome.dataset.k = outcomeKey.k = k;

    // the rule, growing with what the student has found out
    let rule;
    if (s.example === 'wall') rule = t({ ready: 'rule_wall_ready', push: 'rule_wall_push', done: 'rule_wall_done' }[s.phase] || 'rule_wall_ready');
    else if (s.phase === 'ready') rule = t('rule_ready', { s: s.sPlan });
    else if (s.phase === 'push') rule = t('rule_push');
    else if (s.phase === 'slide') rule = t('rule_slide');
    else rule = s.calc ? t('rule_calc') : t('rule_done', { d: plain(p.d) });
    sheet.rule(rule);

    sheet.choose(s.example);
    sheet.result('push', s.results.push == null ? '' : t('res_J', { W: group(s.results.push) }));
    sheet.result('wall', s.results.wall == null ? '' : t('res_J', { W: 0 }));
    const nx = nextAction();
    sheet.next(nx.example !== s.example ? nx.example : null);
    action?.set({ label: nx.label, step: nx.step, enabled: !running() && !(s.example === 'wall' && s.phase === 'push') && !s.locked });
  }

  /** What the big button does next: { label, step, example }. Step 1 is the student's first push, 2 the other case. */
  function nextAction() {
    const tried = s.runs.push + s.runs.wall;
    const ex = s.example;
    const other = ex === 'push' ? 'wall' : 'push';
    if (s.phase === 'done' && s.runs[other] === 0) return { label: other === 'wall' ? 'act_try_wall' : 'act_try_push', step: 2, example: other };
    if (s.phase === 'done') return { label: 'act_again', step: '', example: ex };
    return { label: ex === 'wall' ? 'act_wall' : 'act_push', step: tried === 0 ? 1 : s.runs[ex] === 0 ? 2 : '', example: ex };
  }

  // ── the run ─────────────────────────────────────────────────────────────────
  function snapshot() {
    const n = now();
    const p = planNow();
    return {
      example: s.example,
      F: s.F,
      s: s.example === 'wall' ? 0 : s.sPlan,
      d: s.example === 'wall' ? 0 : p.d,
      phase: s.phase,
      t: roundTo(s.t, 0.001),
      x: roundTo(n.x, 0.001),
      sNow: n.sNow,
      dNow: n.dNow,
      W: n.W,
      results: { ...s.results },
      next: (({ label, step, example }) => ({ label, step, example }))(nextAction()),
      mode: s.mode,
      view: s.view,
      locked: s.locked,
      paused: s.paused,
    };
  }
  let lastEmit = '';
  function changed() {
    const snap = snapshot();
    const keyNow = `${snap.example}|${snap.F}|${snap.s}|${snap.phase}|${snap.W}`;
    if (keyNow !== lastEmit) {
      lastEmit = keyNow;
      emit('change', snap);
    }
  }

  function finishRun() {
    s.phase = 'done';
    s.runs[s.example]++;
    s.results[s.example] = s.example === 'wall' ? 0 : work(s.F, s.sPlan);
    place();
    emit('stop', snapshot());
    changed();
  }
  stage.addTicker((dt) => {
    if (!running() || s.paused) return false;
    s.t += dt;
    if (s.example === 'wall') {
      if (s.t >= WALL_T) finishRun();
      else place();
    } else {
      const p = planNow();
      const was = s.phase;
      s.phase = motionAt(p, s.t).phase;
      if (was === 'push' && s.phase !== 'push') audio.tick();
      if (s.phase === 'done') finishRun();
      else place();
    }
    changed();
    return running();
  });

  /** Put the scene back at the start of the current example (no motion). */
  function toReady() {
    s.phase = 'ready';
    s.t = 0;
    s.paused = false;
    place();
    changed();
  }
  function startRun() {
    if (s.locked) return lockedNudge();
    s.t = 0;
    s.paused = false;
    s.phase = 'push';
    s.lastAct = performance.now();
    audio.unlock();
    if (s.example === 'wall') audio.contact();
    else audio.pop();
    place();
    emit('push', snapshot());
    changed();
    stage.invalidate();
  }
  /** Seconds into the run, held still (for pictures and the bridge). */
  function holdAt(sec) {
    const total = s.example === 'wall' ? WALL_T : planNow().T1 + planNow().T2;
    if (sec >= total) {
      s.t = total;
      s.phase = 'done';
      s.results[s.example] = s.example === 'wall' ? 0 : work(s.F, s.sPlan);
    } else {
      s.t = Math.max(0, sec);
      s.phase = s.example === 'wall' ? 'push' : motionAt(planNow(), s.t).phase;
      s.paused = true;
    }
    place();
    changed();
  }
  function jumpDone() {
    holdAt(1e9);
    s.paused = false;
  }

  /** The big button (and a tap on the crate or the person). */
  function act() {
    if (s.locked) return lockedNudge();
    if (performance.now() - s.lastAct < 400) return; // a double tap never undoes the first
    if (running()) return;
    const nx = nextAction();
    if (nx.example !== s.example) {
      setExample(nx.example);
    }
    startRun();
  }

  function setExample(ex, { animate = true } = {}) {
    s.example = ex === 'wall' ? 'wall' : 'push';
    toReady();
    fitCamera(animate ? 0.7 : 0);
    emit('example', { example: s.example });
  }

  function changeF(dir) {
    if (s.locked) return lockedNudge();
    const F = clampF(s.F + dir * F_RANGE.step);
    if (F === s.F) return;
    s.F = F;
    audio.tick();
    afterStepper();
  }
  function changeS(dir) {
    if (s.locked) return lockedNudge();
    if (s.example === 'wall') return;
    const v = clampS(s.sPlan + dir * S_RANGE.step);
    if (v === s.sPlan) return;
    s.sPlan = v;
    audio.tick();
    afterStepper();
    fitCamera(0.5);
  }
  /** A stepper during a run goes to the start of the new plan; after a push it works the new W out at once. */
  function afterStepper() {
    if (running()) return toReady();
    if (s.phase === 'done') {
      if (s.example === 'push') {
        s.calc = true;
        s.results.push = work(s.F, s.sPlan);
      }
      jumpDone();
      return;
    }
    place();
    changed();
  }

  // ── camera: fit the whole trip (person, crate, where it stops) for this plan ─
  const box = new THREE.Box3();
  function viewPose() {
    const end = s.example === 'wall' ? WALL.thick + 0.05 : s.sPlan + slideOf(s.sPlan) + 0.12;
    box.min.set(-L - PALM - HAND.x - 0.45, -0.05, -0.45);
    box.max.set(end, 1.85, TAPE.z + 0.06);
    const e = THREE.MathUtils.degToRad(ELEVATION);
    // turned a little toward the person (unless the view is very wide), so the trip recedes and the person and crate
    // come out bigger
    const az = THREE.MathUtils.degToRad(stage.width / Math.max(1, stage.height) < 2 ? AZIMUTH : 0);
    const dir = s.view === '3d' ? VIEW_3D : new THREE.Vector3(-Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e));
    const top = Math.min(58, stage.height * 0.18);
    return fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: { top, bottom: 44, side: 10 } });
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
  function fitCamera(duration = 0.7) {
    if (s.userMovedCamera) return Promise.resolve(true);
    return flyTo(viewPose(), duration);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    controls.enableZoom = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
  });

  // ── taps on the crate or the person do the action ───────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickable = [crate.hit, person.hit];
  // it acts as the finger goes down, the same as the big button (capture phase: the camera controls never see it)
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const r = stage.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.intersectObjects(pickable, false).length) return;
      e.stopPropagation();
      e.preventDefault();
      act();
    },
    true,
  );

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    clearTimeout(lockedNudge.timer);
    lockedNudge.timer = setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── the action: the big button, and its numbered badge in a ring round the crate ─
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_push',
    // no ring once the crate has stopped: nothing covers the result on the tape (the button offers the next step)
    target: () => (s.phase === 'done' ? null : crate.box()),
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), headBox],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── the test ────────────────────────────────────────────────────────────────
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const numLabel = (unit) => (c) => `${N(group(c.value))}<small>${t(unit)}</small>`;
  let saved = null;
  /** Set a question's scene at once: an example, F, s, the run finished, labels. */
  function questionScene(ex, F, sv, labelsMode) {
    s.example = ex;
    s.F = F;
    s.sPlan = sv;
    s.labels = labelsMode;
    s.userMovedCamera = false;
    jumpDone();
    flyTo(viewPose(), 0);
  }
  /** Each question: { set up the scene, then the question }. */
  const QUESTIONS = {
    part() {
      const sv = pick([2, 3, 4]);
      questionScene('push', pick([30, 40, 50, 60]), sv, 'letters');
      const choices = [
        { html: t('c_s'), why: null },
        { html: t('c_d'), why: 'm_d' },
        { html: t('c_both'), why: 'm_both' },
        { html: t('c_none'), why: 'm_none' },
      ];
      return { text: t('q_part'), choices, reveal: () => t('r_part') };
    },
    W() {
      const sv = pick([2, 3, 4]);
      const F = pick([20, 30, 40, 60, 80]);
      const d = slideOf(sv);
      questionScene('push', F, sv, 'letters');
      const choices = choicesFrom(work(F, sv), workMistakes(F, sv, d)).map((c) => ({ ...c, unit: 'u_J' }));
      return {
        text: t('q_W', { F }),
        choices,
        label: numLabel('u_J'),
        reveal: () => t('r_W', { F, s: sv, d: plain(d), W: group(work(F, sv)) }),
        after: 'full',
      };
    },
    wall() {
      const F = pick([60, 80, 100]);
      const min = pick([5, 10, 15]);
      questionScene('wall', F, s.sPlan, 'full');
      const choices = [
        { value: 0, why: null },
        { value: F * min, why: 't_min' },
        { value: F * min * 60, why: 't_sec' },
        { value: F, why: 't_one' },
      ];
      return { text: t('q_wall', { F, min }), choices, label: numLabel('u_J'), reveal: () => t('r_wall') };
    },
    F() {
      const sv = pick([2, 3, 4]);
      const F = pick([30, 60, 90]);
      const d = slideOf(sv);
      const Wv = work(F, sv);
      questionScene('push', F, sv, 'letters');
      const choices = choicesFrom(F, forceMistakes(Wv, sv, d));
      return {
        text: t('q_F', { W: group(Wv) }),
        choices,
        label: numLabel('u_N'),
        reveal: () => t('r_F', { F, s: sv, W: group(Wv) }),
        after: 'full',
      };
    },
    unit() {
      questionScene('push', pick([40, 50, 60]), pick([2, 3]), 'full');
      const choices = [
        { html: t('c_J'), why: null },
        { html: t('c_N'), why: 'u_N_why' },
        { html: t('c_W'), why: 'u_W_why' },
        { html: t('c_m'), why: 'u_m_why' },
      ];
      return { text: t('q_unit'), choices, reveal: () => t('r_unit') };
    },
  };
  const ORDER = ['part', 'W', 'wall', 'F', 'unit'];
  let currentQ = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: ORDER.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        saved = { example: s.example, F: s.F, sPlan: s.sPlan, phase: s.phase === 'done' ? 'done' : 'ready' };
        s.mode = 'quiz';
        s.locked = true;
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.labels = 'full';
        currentQ = null;
        if (saved) {
          Object.assign(s, { example: saved.example, F: saved.F, sPlan: saved.sPlan });
          if (saved.phase === 'done') jumpDone();
          else toReady();
        }
        s.userMovedCamera = false;
        fitCamera(0.6);
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
          label: (j) => (q.label ? q.label(q.choices[j]) : `<span class="wk-opt">${q.choices[j].html}</span>`),
          meta: { question: ORDER[i], example: s.example, F: s.F, s: s.example === 'wall' ? 0 : s.sPlan },
        };
      },
      reveal(_q, correct, picked) {
        const q = currentQ;
        if (!q) return '';
        if (q.after) {
          s.labels = q.after;
          place();
        }
        const why = !correct && q.choices[picked.value]?.why;
        return `${q.reveal()}${why ? ` <span class="wk-why">${t(why)}</span>` : ''}`;
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
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else if (b.dataset.example !== s.example || running()) setExample(b.dataset.example);
    }
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'F-') changeF(-1);
    if (a === 'F+') changeF(1);
    if (a === 's-') changeS(-1);
    if (a === 's+') changeS(1);
    if (a === 'home') {
      if (s.locked) lockedNudge();
      else toReady();
    }
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (/** @type {Element} */ (e.target).closest?.('.pvc-examples, .pvc-quiz')) return;
    const keys = { ArrowUp: () => changeF(1), ArrowDown: () => changeF(-1), ArrowRight: () => changeS(1), ArrowLeft: () => changeS(-1) };
    const fn = keys[e.key];
    if (!fn) return;
    e.preventDefault();
    fn();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  const at = o.at === '' || o.at == null ? null : Number(o.at);
  if (at != null && Number.isFinite(at)) holdAt(at);
  else place();
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
     * Change any of: example ('push' | 'wall'), F (N), s (m), push (true: start the push), at (seconds into the run,
     * held still), done (true: the run finished), home (true: back to the start), paused, view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.example && p.example !== s.example) setExample(p.example, { animate });
      if (p.F != null) s.F = clampF(p.F);
      if (p.s != null) s.sPlan = clampS(p.s);
      if (p.F != null || p.s != null) {
        if (running()) toReady();
        else if (s.phase === 'done') jumpDone();
        else place();
        if (p.s != null) fitCamera(animate ? 0.5 : 0);
      }
      if (p.home) toReady();
      if (p.at != null) holdAt(Number(p.at));
      if (p.done) jumpDone();
      if (p.paused != null && running()) s.paused = Boolean(p.paused);
      if (p.push && !running()) startRun(); // the current example (the button may offer the other one)
      stage.invalidate();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      Object.assign(s, { example: 'push', F: START.F, sPlan: START.s, calc: false, labels: 'full' });
      s.runs = { push: 0, wall: 0 };
      s.results = { push: null, wall: null };
      toReady();
      await setView('front');
      return snapshot();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world,
  };
}
