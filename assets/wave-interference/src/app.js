// Superposition of water waves (book pages 192–193, topic 7.2.1 (v), চিত্র ৭.০৩), student view. A real ripple tank
// on a lab bench: a vibrator bar on springs with a small motor drives two point dippers in step; each sends circular
// ripples across a fine water surface drawn on the GPU (src/water.js), with dashed still lines where the waves cancel,
// and two floating corks show what the water does at two places: ক on the centre line (equal paths: crest meets crest, it bobs twice as high) and খ on a still line (paths
// differ by 1½λ: crest meets trough, almost still). The panel: one row of words (১ম তরঙ্গ · ২য় তরঙ্গ · দুটো একসাথে),
// one action that walks them in order, a live চিত্র ৭.০৩ (each ball's 1st wave + 2nd wave = sum against time), one
// result line (the two amplitudes in a), one rule in the book's words; a five-question test. Built on the shared kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { BALL_R, OUTER, backdropTexture, createTank } from './tank.js';
import { EXAG, createWater } from './water.js';
import {
  BALL_Z,
  EXAMPLES,
  F,
  GAP,
  GAPS,
  LAMBDA,
  SLOW,
  SOURCES_ON,
  SOURCE_Z,
  V as SPEED,
  amplitudeAt,
  defaultBalls,
  distances,
  pointOnLine,
  ratioText,
  sources,
  steadyAmplitude,
  waveAt,
} from './reading.js';

export const DEFAULTS = {
  example: 'calm', // 'calm' | 'one' | 'two' | 'both'
  gap: 15, // cm between the dippers: 10, 15 or 20
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const DIR = new THREE.Vector3(0.44, 0.78, 1).normalize(); // three-quarter view from the front right, ~35° above
const MARGIN = { top: 50, bottom: 10, side: 8 };
const LOWER = 0.09; // real seconds a dipper takes to come down to the water (0.45 s on screen)
const CALM = 0.9; // seconds (on screen) the water takes to calm
const DOUBLE_TAP = 420;
const LABEL_INK = '#1d2733';
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const NUMS = { zero: N(0), two: N(2), four: N(4) };

  root.classList.add('pvc', 'wi');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: EXAMPLES.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'pause', label: 'act_pause', icon: ICONS.pause },
        { act: 'reset', label: 'act_reset', icon: ICONS.reset },
      ],
      lines: { action: 2, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const pauseBtn = /** @type {HTMLButtonElement} */ ($('[data-act="pause"]'));

  // the live চিত্র ৭.০৩ under the result line, and a small honest note at the end
  const graphHost = document.createElement('div');
  graphHost.className = 'wi-graph-host';
  $('.pvc-outcome').after(graphHost);
  // the same graph in the test sheet (both sheets share one place, so the panel keeps its height)
  const graphHostQ = document.createElement('div');
  graphHostQ.className = 'wi-graph-host wi-graph-q';
  ui.quiz.querySelector('.pvc-q-text')?.after(graphHostQ);
  const energy = document.createElement('p');
  energy.className = 'wi-energy';
  energy.innerHTML = t('energy', NUMS);
  graphHost.after(energy);
  const note = document.createElement('p');
  note.className = 'wi-note';
  note.textContent = t('note', { l: N(LAMBDA * 100), f: N(F) });
  $('.pvc-rule').after(note);
  // honest scale and time, in a corner of the picture
  const scaleNote = document.createElement('div');
  scaleNote.className = 'wi-scale';
  scaleNote.textContent = t('scale_note', { h: N(EXAG), s: N(SLOW) });
  ui.stage.append(scaleNote);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 30, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.25;

  if (o.bg !== 'transparent') scene.background = backdropTexture();
  scene.add(new THREE.HemisphereLight('#eaf2ff', '#6b4a32', 0.9));
  const sun = new THREE.DirectionalLight('#fff3e0', 2.1);
  sun.position.set(0.9, 2.2, 1.1);
  sun.target.position.set(0, 0, 0);
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight('#cfe0ff', 0.7);
  rim.position.set(-1.5, 1.2, -1.2);
  scene.add(rim);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.004;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -0.45, right: 0.45, top: 0.4, bottom: -0.4, near: 1.5, far: 4 });
    sun.shadow.camera.updateProjectionMatrix();
  }

  const tank = createTank();
  const water = createWater();
  scene.add(tank.root, water.mesh);

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
  const gapOf = (cm) => {
    const m = Number(cm) / 100;
    return GAPS.reduce((a, b) => (Math.abs(b - m) < Math.abs(a - m) ? b : a), GAP);
  };
  const s = {
    mode: 'explore',
    locked: false,
    paused: false,
    userMovedCamera: false,
    sim: 0, // real seconds since the figure started (the screen runs SLOW times slower)
    on: [null, null], // when each dipper touched the water (real s), null: never / not since the last calm
    off: [null, null], // when it left it (null: still dipping)
    gain: 1, // 1 … 0 while the water calms
    example: 'calm',
    found: new Set(),
    gap: gapOf(o.gap),
    balls: defaultBalls(gapOf(o.gap)),
    names: ['lbl_a', 'lbl_b'],
    hideSum: false,
    showLines: true, // the dashed still lines on the water (hidden while a question asks for what they show)
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  const dipping = (i) => s.on[i] != null && s.off[i] == null;
  /** 0 in the water … 1 lifted, from the touch and leave times (so pausing freezes the dippers too). */
  function liftOf(i) {
    const k = (x) => Math.max(0, Math.min(1, x));
    const sm = (x) => k(x) * k(x) * (3 - 2 * k(x));
    if (s.on[i] == null) return 1;
    if (s.off[i] == null) return 1 - sm((s.sim - (s.on[i] - LOWER)) / LOWER);
    return sm((s.sim - s.off[i]) / LOWER);
  }
  /** Is any wave still on the water? */
  function wavesAlive() {
    for (const i of [0, 1]) {
      if (dipping(i)) return true;
      if (s.off[i] != null && SPEED * (s.sim - s.off[i]) < 0.85) return true;
    }
    return false;
  }

  // ── the scene from the state ────────────────────────────────────────────────
  function syncScene() {
    tank.setGap(s.gap);
    water.update(s.sim, s.on, s.off, s.gap, s.gain, refA(), s.showLines ? 1 : 0);
    for (const i of [0, 1]) tank.setLift(i, liftOf(i));
    const shaking = dipping(0) || dipping(1);
    const w = 2 * Math.PI * F * s.sim;
    tank.setShake(shaking ? 0.0012 * Math.sin(w) : 0, w);
    s.balls.forEach((b, i) => {
      tank.setBall(i, b.x, b.z, water.heightAt(b.x, b.z, s.sim, s.on, s.off, s.gap, s.gain));
    });
    graph.draw(s.sim);
    stage.invalidate();
  }
  let wasSettled = false;
  stage.addTicker((dt) => {
    if (s.paused) return false;
    const live = wavesAlive() || s.on.some((x) => x != null && s.sim < x);
    if (!live && !tweener.busy) return false;
    s.sim += dt / SLOW;
    syncScene();
    refreshOutcome();
    const ok = settled();
    if (ok !== wasSettled) {
      wasSettled = ok;
      syncLabels(); // the still line's label comes once the pattern has formed
    }
    return true;
  });

  // ── the graph: displacement at each ball against time ───────────────────────
  const aRef = () => amplitudeAt(distances(s.balls[0].x, s.balls[0].z, s.gap)[0]);
  /** One wave's amplitude at ক's own place (the water's colour scale; the same in every test scene). */
  const refA = () => amplitudeAt(distances(0, BALL_Z, s.gap)[0]);
  function sampleAt(ball, row, time) {
    const b = s.balls[ball];
    const [r1, r2] = distances(b.x, b.z, s.gap);
    const w1 = waveAt(r1, time, s.on[0], s.off[0]);
    const w2 = waveAt(r2, time, s.on[1], s.off[1]);
    return (row === 0 ? w1 : row === 1 ? w2 : w1 + w2) * s.gain;
  }
  const graphOpts = {
    t,
    labels: [t('g_ball', { n: t('lbl_a') }), t('g_ball', { n: t('lbl_b') })],
    rowLabels: [t('g_row1'), t('g_row2'), t('g_sum')],
    axes: { y: t('g_y'), t: t('g_t') },
    sample: sampleAt,
    ref: amplitudeAt(0.27) * 2,
    window: 3 / F,
  };
  const graphs = [createGraph(graphHost, graphOpts), createGraph(graphHostQ, graphOpts)];
  const graph = {
    draw: (x) => graphs.forEach((g) => g.draw(x)),
    redraw: () => graphs.forEach((g) => g.redraw()),
    setLabels: (l) => graphs.forEach((g) => g.setLabels(l)),
    setHideSum: (v) => graphs[1].setHideSum(v),
  };
  function relabelGraph() {
    graph.setLabels([t('g_ball', { n: t(s.names[0]) }), t('g_ball', { n: t(s.names[1]) })]);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  /** Have the waves of every dipping source reached both balls (and settled)? */
  function settled() {
    let any = false;
    for (const i of [0, 1]) {
      if (!dipping(i)) continue;
      any = true;
      for (const b of s.balls) {
        const r = distances(b.x, b.z, s.gap)[i];
        if (SPEED * (s.sim - s.on[i]) < r + LAMBDA) return false;
      }
    }
    return any;
  }
  function ampText(x) {
    const r = x < 0.15 ? { value: '0', about: true } : ratioText(x);
    if (r.value === '0') return `${r.about ? t('about') : ''}${t('amp_zero', NUMS)}`;
    const v = r.value === '1' ? '' : N(r.value);
    return `${r.about ? t('about') : ''}${t('amp_a', { v })}`;
  }
  function amps() {
    const on = [dipping(0), dipping(1)];
    return s.balls.map((b) => steadyAmplitude(b.x, b.z, on, s.gap) / aRef());
  }
  function refreshOutcome() {
    if (s.example === 'calm') {
      sheet.outcome(wavesAlive() && s.gain > 0 ? t('out_dying') : t('out_calm'));
      return;
    }
    if (!settled()) {
      sheet.outcome(t('out_spread'));
      return;
    }
    const [a, b] = amps();
    sheet.outcome(t('out_amp', { a: ampText(a), b: ampText(b) }));
  }
  /**
   * The next step follows what is on the water now (1st → 2nd → both → calm), so the button never offers a case
   * that is already running; each case keeps its own number (১ 1st, ২ 2nd, ৩ both), calming has none.
   */
  const AFTER = { one: 'two', two: 'both', both: 'calm' };
  function plan() {
    const id = s.example === 'calm' ? (EXAMPLES.find((x) => !s.found.has(x)) ?? 'both') : AFTER[s.example];
    if (id === 'calm') return { id, label: 'act_calm', step: '' };
    return { id, label: `act_${id}`, step: EXAMPLES.indexOf(id) + 1 };
  }
  function refresh() {
    sheet.choose(s.example === 'calm' ? null : s.example);
    const p = plan();
    sheet.next(p.id !== 'calm' && p.id !== s.example && p.step !== '' ? p.id : null);
    refreshOutcome();
    const key = s.example === 'calm' ? (s.found.size ? 'rule_calm' : 'rule_start') : `rule_${s.example}`;
    sheet.rule(t(key, NUMS));
    if (action) {
      action.set({ step: p.step, label: p.label, enabled: true });
      if (s.mode === 'explore' && p.step !== '') action.show('scene');
      else action.hide('scene');
    }
    pauseBtn.innerHTML = `${s.paused ? ICONS.play : ICONS.pause}<span>${t(s.paused ? 'act_play' : 'act_pause')}</span>`;
    pauseBtn.setAttribute('aria-label', t(s.paused ? 'act_play' : 'act_pause'));
    pauseBtn.title = t(s.paused ? 'act_play' : 'act_pause');
    pauseBtn.disabled = s.example === 'calm' && !wavesAlive();
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  /** The balls and dipper beads themselves: no label sits on them. */
  function bodyBoxes() {
    const out = [];
    const p = { x: 0, y: 0 };
    const add = (v, r) => {
      toScreen(v, p);
      out.push({ left: p.x - r, right: p.x + r, top: p.y - r, bottom: p.y + r });
    };
    for (const b of tank.balls) add(b.position, 15);
    for (const i of [0, 1]) add(tank.beadTop(i, V3(0, 0, 0)), 12);
    return out;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, scaleNote, bodyBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const AROUND_BALL = [spot(0, -26), spot(22, -18), spot(-22, -18), spot(24, 0), spot(-24, 0), spot(0, 24)];
  const AROUND_SRC = [spot(32, -4), spot(32, -22), spot(46, 8), spot(20, -38)]; // outward: right of the 2nd, left of the 1st
  const labelState = new Map();
  // a point on খ's still line (paths differ by 1½λ), nearer the front of the tank than খ
  const STILL_Z = 0.19;
  const stillPoint = V3(0, 0, STILL_Z);
  const placeStill = () => stillPoint.set(pointOnLine(1.5, STILL_Z, s.gap) ?? 0.16, 0.002, STILL_Z);
  placeStill();
  function wantLabels() {
    const want = new Map();
    s.balls.forEach((_, i) => {
      want.set(`ball${i}`, {
        text: t(s.names[i]),
        point: () => tank.balls[i].position.clone().add(V3(0, BALL_R, 0)),
        spots: AROUND_BALL,
        cls: 'ball',
      });
    });
    if (s.mode === 'explore' && s.showLines && dipping(0) && dipping(1) && settled())
      want.set('still', {
        text: t('lbl_still'),
        point: () => stillPoint,
        spots: [spot(0, 22), spot(26, 16), spot(-26, 16), spot(30, 0), spot(0, -22)],
        optional: true,
        cls: 'still',
      });
    if (s.mode === 'explore')
      for (const i of [0, 1])
        want.set(`src${i}`, {
          text: t(i ? 'lbl_src2' : 'lbl_src1'),
          point: () => tank.beadTop(i, V3(0, 0, 0)).add(V3(0, 0.03, 0)),
          spots: AROUND_SRC.map((p) => (i ? p : { dx: -p.dx, dy: p.dy })),
          optional: true,
          cls: 'src',
        });
    return want;
  }
  function syncLabels() {
    const want = wantLabels();
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, {
          text: w.text,
          point: w.point,
          kind: w.cls === 'ball' ? 'ball' : w.cls === 'still' ? 'still' : 'part',
          color: LABEL_INK,
          spots: w.spots,
          optional: w.optional,
        });
        labelState.set(id, w.text);
      } else if (labelState.get(id) !== w.text) {
        anno.update(id, { text: w.text });
        labelState.set(id, w.text);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const bbox = new THREE.Box3(V3(-OUTER.w / 2, -0.02, -OUTER.d / 2 + 0.02), V3(OUTER.w / 2, 0.08, OUTER.d / 2));
  function viewPose() {
    return fitPose({ box: bbox, dir: DIR, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function place(pose) {
    camera.position.copy(pose.position);
    controls.target.copy(pose.target);
    controls.update();
  }
  function flyTo({ position, target: aim }, duration = 0.7) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, aim, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function homeView(animate = true) {
    s.userMovedCamera = false;
    syncUI();
    if (!animate) {
      tweener.cancel('camera');
      place(viewPose());
      stage.invalidate();
      return Promise.resolve(true);
    }
    return flyTo(viewPose());
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    syncUI();
  });
  controls.addEventListener('change', () => stage.invalidate());
  stage.onResize(() => {
    if (!s.userMovedCamera) place(viewPose());
    graph.redraw();
    syncScene();
    refresh();
  });

  // ── the examples ────────────────────────────────────────────────────────────
  /** Lowers or lifts the dippers for an example; animate: false lands at once with the pattern already formed. */
  function setExample(id, { animate = true } = {}) {
    tweener.cancel('calm');
    s.gain = 1;
    const want = SOURCES_ON[id] || SOURCES_ON.calm;
    for (const i of [0, 1]) {
      if (!animate) {
        s.on[i] = want[i] ? s.sim - 60 : null;
        s.off[i] = null;
        continue;
      }
      if (want[i] && !dipping(i)) {
        s.on[i] = s.sim + LOWER;
        s.off[i] = null;
      } else if (!want[i] && dipping(i)) {
        // a dipper still on its way down never touched: just lift it
        if (s.on[i] > s.sim) s.on[i] = null;
        else s.off[i] = s.sim;
      }
    }
    s.example = id in SOURCES_ON ? id : 'calm';
    if (s.example !== 'calm' && s.mode === 'explore') s.found.add(s.example);
    if (animate) s.paused = false;
    syncScene();
    refresh();
    emitChange();
  }
  /** The water calms (a quick fade), the dippers lift. */
  function calm({ animate = true } = {}) {
    for (const i of [0, 1]) if (dipping(i)) s.off[i] = s.on[i] > s.sim ? null : s.sim;
    for (const i of [0, 1]) if (s.on[i] != null && s.on[i] > s.sim) s.on[i] = null;
    s.example = 'calm';
    const clear = () => {
      s.on = [null, null];
      s.off = [null, null];
      s.gain = 1;
      syncScene();
      refresh();
      emitChange();
    };
    if (!animate) return clear();
    s.paused = false;
    const g0 = s.gain;
    refresh();
    tweener
      .animate({
        key: 'calm',
        duration: CALM,
        onUpdate: (k) => {
          s.gain = g0 * (1 - ease.inOutCubic(k));
          syncScene();
        },
      })
      .finished.then((ok) => ok && clear());
    emitChange();
  }
  function choose(id) {
    if (s.locked) return lockedNudge();
    audio.pop?.();
    if (id === 'calm') calm();
    else setExample(id);
  }
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    choose(plan().id);
  }

  // ── the action: the big button, and its badge on the dipper that goes in next ─
  const beadPoint = (i) => tank.beadTop(i, V3(0, 0, 0)).add(V3(0, 0.012, 0));
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_one',
    target: () => {
      const p = plan();
      // the dipper that changes: the one that goes in, or (if it is already in) the one that comes out
      if (p.id === 'one') return beadPoint(dipping(0) ? 1 : 0);
      if (p.id === 'two') return beadPoint(dipping(1) ? 0 : 1);
      if (p.id === 'both') return beadPoint(dipping(0) ? 1 : 0);
      return null;
    },
    radius: 22,
    avoid: [ui.corner, ui.hint, scaleNote, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // a tap on a dipper does the action too
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      const r = stage.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      down = raycaster.intersectObjects(tank.pickable, false).length ? { x: e.clientX, y: e.clientY, at: now() } : null;
    },
    true,
  );
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down) return;
    const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && now() - down.at < 600;
    down = null;
    if (!tap) return;
    audio.unlock();
    doAction();
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 3000 } = {}) {
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
  const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
  function snapshot() {
    const [a, b] = amps();
    return {
      example: s.example,
      sources: [dipping(0), dipping(1)],
      gap: round(s.gap * 100, 1), // cm
      wavelength: round(LAMBDA * 100, 1), // cm
      frequency: F, // Hz
      speed: SPEED, // m/s
      amplitudeA: round(a, 2), // in a (one wave's amplitude at ball ক)
      amplitudeB: round(b, 2),
      settled: s.example === 'calm' ? true : settled(),
      paused: s.paused,
      found: EXAMPLES.filter((id) => s.found.has(id)),
      next: plan().id,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.example, snap.sources, snap.paused, snap.found, snap.mode, snap.gap]);
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
  /** items[0] is right; each { key, vars?, note? }. */
  function choicesOf(items, kind) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="wi-opt">${t(list[j].key, { ...NUMS, ...(list[j].vars || {}) })}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const KINDS = ['meet', 'which', 'one', 'read', 'energy'];
  let question = null;
  let picked = -1;
  let learnSaved = null;
  function testScene(example, balls = defaultBalls(s.gap), names = ['lbl_a', 'lbl_b'], lines = true) {
    tweener.cancel('calm');
    s.showLines = lines;
    s.balls = balls;
    s.names = names;
    s.paused = false;
    s.gain = 1;
    relabelGraph();
    setExample(example, { animate: false });
    syncLabels();
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
        learnSaved = { example: s.example, found: new Set(s.found) };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
        refresh();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.hideSum = false;
        s.showLines = true;
        graph.setHideSum(false);
        s.balls = defaultBalls(s.gap);
        s.names = ['lbl_a', 'lbl_b'];
        relabelGraph();
        s.found = learnSaved?.found ?? s.found;
        setExample(learnSaved?.example ?? 'calm', { animate: false });
        syncUI();
        homeView(false);
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        question = { kind };
        s.hideSum = kind !== 'energy';
        graph.setHideSum(s.hideSum);
        if (kind === 'which') {
          // two balls on a new row: one on a strong line, one on a still line, named at random
          const z = BALL_Z - 0.04 + Math.random() * 0.08;
          const loud = { x: (Math.random() < 0.5 ? -1 : 1) * (pointOnLine(1, z, s.gap) ?? 0.06), z };
          const quiet = { x: -Math.sign(loud.x) * (pointOnLine(0.5, z, s.gap) ?? 0.03), z };
          const loudFirst = Math.random() < 0.5;
          const balls = loudFirst ? [loud, quiet] : [quiet, loud];
          question.loud = loudFirst ? 0 : 1;
          testScene('both', balls, ['lbl_a', 'lbl_b'], false);
        } else if (kind === 'read') {
          // cork গ on a new row, on a strong line (paths differ by λ) or on a still line (1½λ), either side;
          // the still lines are not drawn until the answer
          const z = BALL_Z - 0.03 + Math.random() * 0.06;
          const loud = Math.random() < 0.5;
          const n = loud ? 1 : 1.5; // (½λ would sit right beside ক)
          const c = { x: (Math.random() < 0.5 ? -1 : 1) * (pointOnLine(n, z, s.gap) ?? 0.05), z };
          const balls = [defaultBalls(s.gap)[0], c];
          question.loud = steadyAmplitude(c.x, c.z, [true, true], s.gap) / refA() > 1;
          testScene('both', balls, ['lbl_a', 'lbl_c'], false);
        } else if (kind === 'meet') testScene('one');
        else testScene('both');
        if (!s.userMovedCamera) await homeView(true);
        if (!alive()) return null;
        if (kind === 'meet')
          return {
            text: t('q_meet'),
            ...choicesOf([{ key: 'c_meet_still' }, { key: 'c_meet_double' }, { key: 'c_meet_one' }, { key: 'c_meet_flow' }], kind),
          };
        if (kind === 'which') {
          const right = question.loud === 0 ? 'c_which_a' : 'c_which_b';
          const wrong = question.loud === 0 ? 'c_which_b' : 'c_which_a';
          return {
            text: t('q_which'),
            ...choicesOf([{ key: right }, { key: wrong }, { key: 'c_which_same' }, { key: 'c_which_none' }], kind),
          };
        }
        if (kind === 'one')
          return {
            text: t('q_one'),
            ...choicesOf([{ key: 'c_one_bob' }, { key: 'c_one_still' }, { key: 'c_one_double' }, { key: 'c_one_drift' }], kind),
          };
        if (kind === 'read') {
          const [right, other] = question.loud ? ['c_read_2', 'c_read_0'] : ['c_read_0', 'c_read_2'];
          return {
            text: t('q_read', NUMS),
            ...choicesOf([{ key: right }, { key: other }, { key: 'c_read_1' }, { key: 'c_read_4' }], kind),
          };
        }
        return {
          text: t('q_energy', NUMS),
          ...choicesOf(
            [
              { key: 'c_energy_4', vars: { n: 4 } },
              { key: 'c_energy_2', vars: { n: 2 } },
              { key: 'c_energy_root', vars: { n: '1.4' } },
              { key: 'c_energy_8', vars: { n: 8 } },
            ],
            kind,
          ),
        };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], NUMS)}` : '');
        s.hideSum = false;
        graph.setHideSum(false);
        s.showLines = true;
        syncScene();
        if (k === 'meet') {
          // show it: both sources, the still ball খ
          testScene('both');
          return t('why_meet', NUMS) + note({ c_meet_double: 'mis_meet_double', c_meet_one: 'mis_meet_one', c_meet_low: 'mis_meet_low' });
        }
        if (k === 'which') {
          const w = t(s.names[question.loud]);
          const other = t(s.names[1 - question.loud]);
          const wrongBall = question.loud === 0 ? 'c_which_b' : 'c_which_a';
          return (
            t('why_which', { ...NUMS, w, o: other }) +
            note({ c_which_same: 'mis_which_same', c_which_none: 'mis_which_none', [wrongBall]: 'mis_which_wrong' })
          );
        }
        if (k === 'one') {
          s.locked = false;
          setExample('one');
          s.locked = true;
          return t('why_one', NUMS) + note({ c_one_still: 'mis_one_still', c_one_double: 'mis_one_double', c_one_once: 'mis_one_once' });
        }
        if (k === 'read')
          return (
            t(question.loud ? 'why_read_2' : 'why_read_0', NUMS) +
            note({ c_read_1: 'mis_read_1', c_read_4: 'mis_read_4', c_read_2: 'mis_read_2', c_read_0: 'mis_read_0' })
          );
        return t('why_energy', NUMS) + note({ c_energy_2: 'mis_energy_2', c_energy_root: 'mis_energy_root', c_energy_8: 'mis_energy_8' });
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
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  function togglePause() {
    if (s.locked) return lockedNudge();
    if (s.example === 'calm' && !wavesAlive()) return;
    s.paused = !s.paused;
    refresh();
    stage.invalidate();
    emitChange();
  }
  function startOver() {
    tweener.cancel('calm');
    s.found = new Set();
    s.paused = false;
    s.balls = defaultBalls(s.gap);
    calm({ animate: false });
    homeView(true);
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.example) {
      if (b.dataset.example !== s.example) choose(b.dataset.example);
      else refresh();
    }
    if (b.dataset.view === 'front') homeView();
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'q-next') quiz.next();
    else if (b.dataset.act === 'q-again') quiz.start();
    else if (b.dataset.act === 'pause') togglePause();
    else if (b.dataset.act === 'reset') {
      if (s.locked) lockedNudge();
      else startOver();
    } else if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['1', '2', '3', 'p', 'P', 'r', 'R', 'ArrowRight'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === 'Enter' && !onButton) || k === 'ArrowRight') doAction();
    else if (k === ' ' && !onButton) togglePause();
    else if (k === '1' || k === '2' || k === '3') choose(EXAMPLES[Number(k) - 1]);
    else if (k === 'p' || k === 'P') togglePause();
    else if (k === 'r' || k === 'R') startOver();
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  place(viewPose());
  const start = String(o.example);
  if (start in SOURCES_ON && start !== 'calm') {
    setExample(start, { animate: false });
    s.found.add(start);
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
     * example: 'calm' | 'one' | 'two' | 'both' (animate: false lands with the pattern already formed); gap: 10, 15 or
     * 20 (cm between the dippers); paused: true/false.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (s.mode === 'quiz' && (p.example != null || p.gap != null)) quiz.stop();
      if (p.gap != null) {
        s.gap = gapOf(p.gap);
        s.balls = defaultBalls(s.gap);
        placeStill();
        if (s.example !== 'calm') setExample(s.example, { animate: false });
      }
      if (p.example != null) {
        const id = String(p.example);
        if (id === 'calm') calm({ animate });
        else if (id in SOURCES_ON) setExample(id, { animate });
      }
      if (p.paused != null) {
        s.paused = Boolean(p.paused);
      }
      syncScene();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      startOver();
      homeView(false);
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The ripple tank as it stands now: tray, vibrator, dippers, balls and the water's surface (in metres). */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'RippleTank';
      g.add(tank.root.clone(true), water.bake(s.sim, s.on, s.off, s.gap, s.gain, refA()));
      return g;
    },
    /** For tests: where each source is, and the sources' row. */
    _debug: { sources: () => sources(s.gap), z: SOURCE_Z, render: () => ({ ...stage.renderer.info.render }) },
  };
}
