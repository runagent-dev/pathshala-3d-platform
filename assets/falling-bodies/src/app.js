// Laws of falling bodies (book pages 48–49, topic 2.8), student view: the book's own experiment. Two clear tubes of
// the same height, one with air (বাতাস আছে) and one emptied (বাতাসহীন), each with a small stone and a piece of paper
// at the same height. Press the red button (or ছেড়ে দাও): all four fall at once, shown 8 times slower. In air the
// stone wins and the paper flutters down far behind; without air both land together. In the empty tube the bodies
// leave a faint picture every 0.1 s, with a dashed line across the scale and a speed arrow: the table in the panel
// shows v ∝ t (1 : 2 : 3) and h ∝ t² (1 : 4 : 9). Step through it 0.1 s at a time, or crumple the paper (the same
// mass, less air hindrance: it then falls almost with the stone even in air). Then a short test. Built on the
// shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS, svg } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { ARROW, BOX, TUBE, Y0, createApparatus } from './apparatus.js';
import { createLabels } from './labels.js';
import { fitPose } from './camera.js';
import {
  BODIES,
  G,
  SLOW,
  STEP,
  endTime,
  fallen,
  fixed,
  flutter,
  fmt,
  freeH,
  freeV,
  landTime,
  nextStep,
  pickWrong,
  prevStep,
  round,
  stepTimes,
} from './fall.js';

export const DEFAULTS = {
  t: 0, // s of fall shown at the start (paused); 0: ready to let go
  paper: 'flat', // 'flat' | 'crumpled'
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const STEPS_T = stepTimes(); // 0.1, 0.2, 0.3 s
const T_VAC = landTime(); // 0.3 s: everything without air
const T_STONE = landTime(BODIES.stone.vt); // the stone in air: 0.3001 s
const SHUTTER = 0.03; // s for the shutters to fold away (faster than the bodies fall)
const SETTLE = 0.04; // s for a landed paper to lie flat
const VIEW_3D = new THREE.Vector3(0.55, 0.3, 0.78).normalize();
const FRONT_ELEVATION = THREE.MathUtils.degToRad(7);
// what must be in the frame: the falls in both tubes (felt pads to the bodies on their shutters, the release box) and
// the speed arrows; the wooden base below and the valve above may run off the edges, so the bodies are big on a phone
const FRAME = new THREE.Box3(
  new THREE.Vector3(-TUBE.x - TUBE.r - 0.008, 0, -TUBE.r - 0.008),
  new THREE.Vector3(ARROW.x + 0.012, Y0 + 0.054, TUBE.r + 0.008),
);
const STEP_ICON = svg('<path d="M6 6l7 6-7 6z" class="fill"/><path d="M17 6v12" stroke-width="2.4"/>');

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'fb');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const cells = (row) =>
    STEPS_T.map((_, i) => `<span class="fb-c fb-${row}" data-i="${i}"><b>–</b>${row === 't' ? '' : '<small></small>'}</span>`).join('');
  const ui = buildStudentShell(root, t, {
    learn: `
          <p class="fb-say" aria-live="polite"></p>
          <div class="fb-table">
            <span class="fb-k fb-t"><b>${t('row_t')}</b></span>${cells('t')}<span class="fb-u">${t('u_s')}</span>
            <span class="fb-k fb-v"><b>${t('row_v')}</b><small>${t('eq_v')}</small></span>${cells('v')}<span class="fb-u">${t('u_ms')}<em>${t('law_v_short')}</em></span>
            <span class="fb-k fb-h"><b>${t('row_h')}</b><small>${t('eq_h')}</small></span>${cells('h')}<span class="fb-u">${t('u_cm')}<em>${t('law_h_short')}</em></span>
          </div>
          <p class="fb-laws"><span class="fb-v">${t('law_2')}</span><span class="fb-h">${t('law_3')}</span></p>
          <p class="fb-eqs">${t('eqs', { z: 0 })}</p>
          <div class="pvc-learn-foot fb-acts">
            <button class="pvc-btn primary" data-act="go"><i class="fb-ic"></i><span></span></button>
            <button class="pvc-btn" data-act="step" aria-label="${t('act_step_long', { dt: STEP })}" title="${t('act_step_long', { dt: STEP })}">${STEP_ICON}<span>${t('act_step', { dt: STEP })}</span></button>
            <button class="pvc-btn" data-act="paper"><span></span></button>
          </div>`,
  });
  const slowNote = document.createElement('div');
  slowNote.className = 'fb-slow';
  ui.stage.append(slowNote);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 20, near: 0.05, far: 40, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.5;
  controls.maxDistance = 6;
  controls.enablePan = false;
  const M = createMaterials(stage.renderer);
  const app = createApparatus({ materials: M, t });
  scene.add(app.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.4);
    sun.position.set(0.6, 2.4, 1.6);
    sun.target.position.set(0, 0.2, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -0.6, right: 0.6, top: 0.8, bottom: -0.5, near: 1, far: 5 });
    sun.shadow.radius = 8;
    sun.shadow.bias = -0.0004;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.12 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -BASE.h;
    floor.receiveShadow = true;
    floor.userData.noExport = true;
    scene.add(sun, sun.target, floor);
    app.root.traverse((m) => {
      if (m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false) m.castShadow = true;
    });
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    tau: 0, // s of real time since the release: everything in both tubes is a function of it
    released: false, // the shutters are open
    playing: false,
    target: 0, // tau where the playing stops (the end, or the next picture for a step)
    playT0: 0,
    playTau0: 0,
    playedAt: -1e9, // performance.now() when the student last started it (a quick second tap must not undo it)
    paper: o.paper === 'crumpled' ? 'crumpled' : 'flat',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
  };
  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const paperKey = () => (s.paper === 'crumpled' ? 'crumpled' : 'paper');
  const vtPaper = () => BODIES[paperKey()].vt;
  const tPaper = () => landTime(vtPaper()); // the paper in air
  const tEnd = () => endTime(paperKey()) + SETTLE; // everything down, and the last paper lying on its pad

  function phase() {
    if (!s.released) return 'ready';
    if (s.playing) return 'falling';
    return s.tau >= tEnd() - 1e-9 ? 'done' : 'paused';
  }

  // ── the scene at time tau ───────────────────────────────────────────────────
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  function render() {
    const tau = s.released ? s.tau : 0;
    app.setShutter(s.released ? clamp01(tau / SHUTTER) : 0);
    const dv = fallen(tau); // without air: the stone and the paper alike
    app.placeBodies('vac', dv, dv, undefined, clamp01((tau - T_VAC) / SETTLE));
    const vp = vtPaper();
    const flutterOn = s.paper !== 'crumpled';
    app.placeBodies(
      'air',
      fallen(tau, BODIES.stone.vt),
      fallen(tau, vp),
      flutterOn ? flutter(tau, vp) : undefined,
      clamp01((tau - tPaper()) / SETTLE),
    );
    // the marks in the empty tube: pictures at 0, 0.1, 0.2 s; lines, arrows and times at 0.1, 0.2, 0.3 s
    const depths = [];
    app.ghosts.forEach((g, i) => {
      const d = fallen(i * STEP);
      app.placeGhost(i, d);
      g.group.visible = s.released && dv - d > 0.004;
    });
    STEPS_T.forEach((ti, i) => {
      const on = s.released && tau >= ti - 1e-9;
      const d = fallen(ti);
      if (on) {
        depths.push(d);
        app.setArrow(i, d, freeV(ti));
      } else app.hideArrow(i);
      labels.show(`t${i}`, on);
    });
    app.setLines(depths);
    const ready = !s.released;
    labels.show('stone', ready);
    labels.show('paper', ready);
    labels.show('vel', s.released && tau >= STEPS_T[0] - 1e-9);
    stage.invalidate();
  }

  // ── labels on the scene ─────────────────────────────────────────────────────
  const labels = createLabels({
    stage,
    layer: ui.annoLayer,
    avoid: () => [
      ui.corner.getBoundingClientRect(),
      slowNote.getBoundingClientRect(),
      ui.hint.classList.contains('show') ? ui.hint.getBoundingClientRect() : null,
      boxRect(),
      coachLabel()?.getBoundingClientRect(),
    ],
  });
  /** The first-use pointer's bubble while it shows (labels keep out from under it). */
  const coachLabel = () => {
    const el = ui.coachLayer.querySelector('.pvc-coach-label');
    return el?.classList.contains('in') ? el : null;
  };
  /** Where the release box is on the page (labels keep off it). */
  function boxRect() {
    const sr = stage.canvas.getBoundingClientRect();
    let [x0, y0, x1, y1] = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
    for (const c of app.points.boxCorners()) {
      c.project(camera);
      const x = sr.left + (c.x * 0.5 + 0.5) * stage.width;
      const y = sr.top + (-c.y * 0.5 + 0.5) * stage.height;
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
    }
    return { left: x0, top: y0, right: x1, bottom: y1, width: x1 - x0, height: y1 - y0 };
  }
  const lp = { air: new THREE.Vector3(), vac: new THREE.Vector3(), stone: new THREE.Vector3(), paper: new THREE.Vector3() };
  const stoneTarget = new THREE.Vector3();
  const paperTarget = new THREE.Vector3();
  labels.add('air', {
    text: t('tube_air'),
    point: () => app.points.tubeFoot('air', lp.air),
    sides: ['below', 'below-l'],
    gap: 0,
    prio: 1,
    cls: 'fb-tube',
  });
  labels.add('vac', {
    text: t('tube_vac'),
    point: () => app.points.tubeFoot('vac', lp.vac),
    sides: ['below', 'below-r'],
    gap: 0,
    prio: 1,
    cls: 'fb-tube',
  });
  // before a fall: the stone and the paper of the left tube, named just under them (where they will fall); on a small
  // stage they are too close for two labels, then the paper is named in the right tube
  const sp = new THREE.Vector3();
  const paperTube = () => {
    const x = (w) => (sp.copy(w).project(camera).x * 0.5 + 0.5) * stage.width;
    return x(app.points.paper('air', paperTarget)) - x(app.points.stone('air', stoneTarget)) >= 36 ? 'air' : 'vac';
  };
  labels.add('stone', {
    text: t('lbl_stone'),
    point: () => app.points.stone('air', lp.stone).setY(Y0 - 0.004),
    target: () => app.points.stone('air', stoneTarget),
    sides: ['below-l', 'below'],
    gap: 12,
    prio: 2,
    leader: true,
  });
  labels.add('paper', {
    text: t('lbl_paper'),
    point: () => app.points.paper(paperTube(), lp.paper).setY(Y0 - 0.004),
    target: () => app.points.paper(paperTube(), paperTarget),
    sides: ['below-r', 'below'],
    gap: 12,
    prio: 2,
    leader: true,
  });
  // the speed arrows are named once, beside the longest one shown (they are not only told apart by colour)
  const velPoint = new THREE.Vector3();
  labels.add('vel', {
    text: t('lbl_velocity'),
    point: () => {
      const i = Math.max(0, STEPS_T.filter((ti) => s.tau >= ti - 1e-9).length - 1);
      return app.points.arrowTail(fallen(STEPS_T[i]), freeV(STEPS_T[i]), velPoint);
    },
    sides: ['right', 'right-up', 'above'],
    gap: 6,
    prio: 4,
    cls: 'fb-vel',
  });
  STEPS_T.forEach((ti, i) => {
    const p = new THREE.Vector3();
    labels.add(`t${i}`, {
      text: t('lbl_time', { t: ti }),
      point: () => app.points.arrowFoot(fallen(ti), p),
      sides: ['right', 'right-up'],
      gap: 2,
      prio: 3,
      cls: 'fb-time',
    });
  });

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    say: $('.fb-say'),
    t: ui.$$('.fb-c.fb-t'),
    v: ui.$$('.fb-c.fb-v'),
    h: ui.$$('.fb-c.fb-h'),
    go: $('[data-act="go"]'),
    goIcon: $('[data-act="go"] .fb-ic'),
    goLabel: $('[data-act="go"] span'),
    paperLabel: $('[data-act="paper"] span'),
  };
  STEPS_T.forEach((ti, i) => {
    el.t[i].querySelector('b').textContent = N(fmt(ti, 1));
    el.v[i].querySelector('small').textContent = t('times', { k: i + 1 });
    el.h[i].querySelector('small').textContent = t('times', { k: (i + 1) ** 2 });
  });

  function sayText() {
    const p = phase();
    const crumpled = s.paper === 'crumpled';
    if (p === 'ready') return t(crumpled ? 'say_ready_crumpled' : 'say_ready');
    if (p === 'done' || s.tau >= tPaper() - 1e-9)
      return t(crumpled ? 'say_done_crumpled' : 'say_done', { tv: fmt(T_VAC), ts: fmt(T_STONE), tp: fmt(tPaper()) });
    if (s.tau >= T_VAC - 1e-9) return t('say_vac_down', { t: fmt(T_VAC) });
    if (p === 'paused' && s.tau > 0) return t(crumpled ? 'say_paused_crumpled' : 'say_paused', { t: fmt(s.tau) });
    return t('say_fall', { dt: STEP });
  }

  let shown = '';
  function refresh() {
    const p = phase();
    const filled = STEPS_T.filter((ti) => s.released && s.tau >= ti - 1e-9).length;
    const say = sayText();
    const key = `${p}|${filled}|${s.paper}|${say}`;
    if (key === shown) return;
    shown = key;
    el.say.textContent = say;
    let last = -1;
    STEPS_T.forEach((ti, i) => {
      const on = s.released && s.tau >= ti - 1e-9;
      if (on) last = i;
      el.v[i].querySelector('b').textContent = on ? N(fixed(freeV(ti), 2)) : '–';
      el.h[i].querySelector('b').textContent = on ? N(fixed(freeH(ti) * 100, 1)) : '–';
      for (const row of [el.t, el.v, el.h]) row[i].classList.toggle('on', on);
    });
    for (const row of [el.t, el.v, el.h]) row.forEach((c, i) => c.classList.toggle('now', i === last && p !== 'done'));
    const go = { ready: ['act_release', 'play'], falling: ['act_pause', 'pause'], paused: ['act_resume', 'play'], done: ['act_again', 'reset'] }[p];
    el.goLabel.textContent = t(go[0]);
    el.goIcon.innerHTML = ICONS[go[1]];
    el.paperLabel.textContent = t(s.paper === 'crumpled' ? 'act_flatten' : 'act_crumple');
    labels.setText('paper', t(s.paper === 'crumpled' ? 'lbl_crumpled' : 'lbl_paper'));
    stage.invalidate();
  }

  function snapshot() {
    const tau = s.released ? s.tau : 0;
    const vp = vtPaper();
    return {
      phase: phase(),
      t: round(tau, 4),
      paper: s.paper,
      vacuum: { stone: round(fallen(tau), 4), paper: round(fallen(tau), 4), down: s.released && tau >= T_VAC - 1e-9 },
      air: {
        stone: round(fallen(tau, BODIES.stone.vt), 4),
        paper: round(fallen(tau, vp), 4),
        stoneDown: s.released && tau >= T_STONE - 1e-9,
        paperDown: s.released && tau >= tPaper() - 1e-9,
      },
      times: { vacuum: round(T_VAC, 4), airStone: round(T_STONE, 4), airPaper: round(tPaper(), 4) },
      steps: STEPS_T.filter((ti) => s.released && tau >= ti - 1e-9).map((ti) => ({ t: ti, v: round(freeV(ti), 2), h: round(freeH(ti), 4) })),
      view: s.view,
      mode: s.mode,
    };
  }

  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([
      snap.phase,
      snap.paper,
      snap.steps.length,
      snap.vacuum.down,
      snap.air.paperDown,
      snap.phase === 'paused' ? snap.t : 0,
    ]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── time: release, play, pause, step ────────────────────────────────────────
  let token = 0; // bumped by anything that changes the scene, so a pending release knows it is out of date
  /** Moments a fall passes (in s of real time): pictures tick, bodies landing thud. */
  function crossings(from, to) {
    for (const ti of STEPS_T) if (from < ti - 1e-9 && to >= ti - 1e-9) audio.tick();
    if (from < T_VAC && to >= T_VAC) {
      audio.contact();
      emit('land', { tube: 'vacuum', body: 'both', t: round(T_VAC, 4) });
    }
    if (from < T_STONE && to >= T_STONE) emit('land', { tube: 'air', body: 'stone', t: round(T_STONE, 4) });
    const tp = tPaper();
    if (from < tp && to >= tp) {
      audio.pop();
      emit('land', { tube: 'air', body: 'paper', t: round(tp, 4) });
    }
  }
  function moveTo(tau) {
    const next = Math.min(tEnd(), Math.max(0, tau));
    crossings(s.tau, next);
    s.tau = next;
    render();
  }
  /** Plays (slowed down) from where it is until `target` (default: the end). Lets go first if needed. */
  function play(target = tEnd()) {
    if (!s.released) {
      s.released = true;
      s.tau = 0;
      coach?.objectUsed(); // however it was let go, the pointer has made its point
      emit('release', { paper: s.paper });
    }
    s.target = Math.min(tEnd(), target);
    if (s.tau >= s.target - 1e-9) return;
    s.playing = true;
    s.playT0 = now();
    s.playTau0 = s.tau;
    render();
    refresh();
    emitChange();
  }
  function pause() {
    if (!s.playing) return;
    s.playing = false;
    refresh();
    emitChange();
  }
  stage.addTicker(() => {
    if (!s.playing) return false;
    const tau = Math.min(s.target, s.playTau0 + (now() - s.playT0) / 1000 / SLOW);
    moveTo(tau);
    if (tau >= s.target - 1e-9) {
      s.playing = false;
      if (phase() === 'done') emit('done', snapshot());
      refresh();
      emitChange();
    } else refresh();
    return true;
  });
  /** Back to the start: both shutters closed under the bodies. */
  function toStart() {
    token++;
    app.hidePaper('vac', false);
    s.playing = false;
    s.released = false;
    s.tau = 0;
    render();
    refresh();
    emitChange();
  }
  /** Jumps to tau s after the release, paused (0: ready to let go). */
  function jumpTo(tau) {
    token++;
    s.playing = false;
    s.released = tau > 0;
    s.tau = Math.min(tEnd(), Math.max(0, tau));
    render();
    refresh();
    emitChange();
  }

  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
  }

  /** The main button: let go, pause, go on, or (when all is down) put everything back and let go again. */
  function go() {
    if (s.locked) return lockedNudge();
    coach?.objectUsed();
    const p = phase();
    if (p === 'falling') {
      if (now() - s.playedAt < 400) return; // a quick second tap does not undo the first
      pause();
      return;
    }
    s.playedAt = now();
    if (p === 'done') {
      toStart();
      const my = token;
      setTimeout(() => {
        if (my === token && !s.locked) {
          s.playedAt = now();
          play();
        }
      }, 450);
      return;
    }
    play();
  }

  /** One step of 0.1 s (played slowed down); dir −1 jumps back one step. */
  function step(dir = 1) {
    if (s.locked) return lockedNudge();
    token++; // a release still pending ("আবার ছেড়ে দাও" a moment ago) must not take over the step
    coach?.objectUsed();
    if (dir < 0) {
      const back = prevStep(s.tau);
      return back > 0 ? jumpTo(back) : toStart();
    }
    if (phase() === 'done') toStart();
    s.playedAt = now();
    play(s.released ? nextStep(s.tau) : STEP);
  }

  /** The flat sheet or the same sheet crumpled into a ball; everything goes back to the start. */
  function setPaper(kind, { animate = true } = {}) {
    const next = kind === 'crumpled' ? 'crumpled' : 'flat';
    toStart();
    if (next === s.paper) return;
    s.paper = next;
    app.setPaper(next);
    if (animate) {
      const parts = [app.bodies.air.paper, app.bodies.vac.paper];
      tweener.animate({
        key: 'paper',
        duration: 0.35,
        ease: ease.outBack,
        onUpdate: (k) => {
          for (const p of parts) p.scale.setScalar(Math.max(0.01, 0.4 + 0.6 * k));
          stage.invalidate();
        },
      });
    }
    render();
    refresh();
    emit('paper', { paper: next });
    emitChange();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewDir(view) {
    if (view === '3d') return VIEW_3D;
    return new THREE.Vector3(0, Math.sin(FRONT_ELEVATION), Math.cos(FRONT_ELEVATION));
  }
  const probe = new THREE.PerspectiveCamera();
  const probePoint = new THREE.Vector3();
  // what must stay clear of the corner buttons and the note: the bodies at the top of both tubes, the release box and
  // the first time label (the collars and the valve above them may pass under the buttons)
  const CLEAR = [
    ...[-TUBE.x - TUBE.r, -TUBE.x + TUBE.r, TUBE.x - TUBE.r, TUBE.x + TUBE.r, -BOX.w / 2, BOX.w / 2].map((x) => ({
      p: new THREE.Vector3(x, Y0 + 0.054, 0),
      pad: 5,
      wide: 0,
    })),
    { p: new THREE.Vector3(ARROW.x + 0.012, Y0 - fallen(STEP), 0), pad: 12, wide: 52 },
  ];
  function blocked(pose) {
    const sr = stage.canvas.getBoundingClientRect();
    const rects = [ui.corner.getBoundingClientRect(), slowNote.getBoundingClientRect()].filter((r) => r.width);
    if (!rects.length) return false;
    probe.copy(camera);
    probe.position.copy(pose.position);
    probe.lookAt(pose.target);
    probe.updateMatrixWorld();
    for (const { p, pad, wide } of CLEAR) {
      probePoint.copy(p).project(probe);
      const x = (probePoint.x * 0.5 + 0.5) * stage.width;
      const y = (-probePoint.y * 0.5 + 0.5) * stage.height;
      for (const r of rects) if (x + wide > r.left - sr.left - 8 && x < r.right - sr.left + 8 && y - pad < r.bottom - sr.top + 4) return true;
    }
    return false;
  }
  /** The closest pose that shows everything, with as little room on top as the corner buttons allow. */
  function viewPose(view = s.view) {
    const fit = (top) =>
      fitPose({ box: FRAME, dir: viewDir(view), camera, width: stage.width, height: stage.height, margin: { top, bottom: 22, left: 10, right: 60 } });
    for (const top of [12, 20, 28, 36, 44]) {
      const pose = fit(top);
      if (!blocked(pose)) return pose;
    }
    return fit(54);
  }
  function flyTo({ position, target }, duration = 0.8) {
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
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  // the note in the corner: shorter on a narrow stage, so it keeps clear of the left tube (before the camera fits)
  const noteText = () => {
    slowNote.textContent = t(stage.width < 480 ? 'slow_short' : 'slow', { k: SLOW });
    // on the smallest stage the speed arrows are named by their symbol only (there is room for "v", not for "বেগ v")
    labels.setText('vel', stage.width < 480 && stage.height < 300 ? 'v' : t('lbl_velocity'));
  };
  noteText();
  stage.onResize(noteText);
  stage.onResize(() => !s.userMovedCamera && flyTo(viewPose(), 0));

  // ── pressing the button (or the bodies) in the scene ────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** What a finger at canvas point p presses: 'button', 'holder' (a tube's top, where the bodies sit) or null. */
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(app.hits, false)[0];
    return hit ? hit.object.userData.part : null;
  }
  let pressed = false;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const part = pick(canvasPoint(e));
      if (!part) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      pressed = true;
      app.pressButton(true);
      stage.invalidate();
      go(); // it acts as the finger goes down
    },
    true,
  );
  const unpress = () => {
    if (!pressed) return;
    pressed = false;
    app.pressButton(false);
    stage.invalidate();
  };
  ui.canvasHost.addEventListener('pointerup', unpress);
  ui.canvasHost.addEventListener('pointercancel', unpress);
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
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
    if (duration) hintTimer = setTimeout(hideHint, duration);
    stage.invalidate();
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
    stage.invalidate();
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
  const num = (v, unit) => `${N(fmt(v))}<small>${t(unit)}</small>`;
  /** Four tap choices from string keys (the right one first): shuffled, with the index of the right one. */
  function textChoices(keys, kind, extra = {}) {
    const list = shuffle([...keys]);
    return {
      choices: [0, 1, 2, 3],
      expected: list.indexOf(keys[0]),
      tolerance: 0.5,
      label: (j) => `<span class="fb-opt">${t(list[j])}</span>`,
      meta: { kind, answer: keys[0], ...extra },
      keys: list,
    };
  }
  /** Four numbers (the right one first, then the mistakes): shuffled; each mistake keeps its note for the answer. */
  function numberChoices(right, mistakes, unit, kind, extra = {}) {
    const values = pickWrong(
      right,
      mistakes.map((m) => m.v),
    );
    const notes = new Map(mistakes.map((m) => [fmt(m.v), m.note]));
    const list = shuffle([...values]);
    return {
      choices: list,
      expected: values[0],
      tolerance: 1e-6,
      label: (v) => num(v, unit),
      meta: { kind, answer: values[0], ...extra },
      note: (v) => notes.get(fmt(v)),
    };
  }
  const ratioLabel = (r) => `<span class="fb-opt">${N(r.join(' : '))}</span>`;

  let kinds = [];
  let pickedIndex = -1;
  let q = null; // the current question: { kind, …, picked note }
  /** Plays the scene of a question to `target` (s of fall), from where it is; for a worked answer. */
  function showPlay(target) {
    s.playedAt = now();
    play(target);
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.locked = true;
        hideHint();
        if (s.paper !== 'flat') setPaper('flat', { animate: false });
        toStart();
        kinds = shuffle(['where', 'why', 'speed', 'height', pickOne(['ratio', 'mass'])]);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        hideHint();
        if (s.paper !== 'flat') setPaper('flat', { animate: false });
        toStart();
        syncUI();
        if (!s.userMovedCamera) flyTo(viewPose(), 0.5);
      },
      async prepare(i, alive, say) {
        const kind = kinds[i % kinds.length];
        toStart(); // nothing left from an earlier question
        if (kind === 'where') {
          // the empty tube 0.2 s into the fall, its paper hidden (and its pictures): where is the paper now?
          app.hidePaper('vac', true);
          jumpTo(STEPS_T[1]);
          const h = round(freeH(STEPS_T[1]) * 100, 1);
          q = { kind };
          const c = textChoices(['c_same_line', 'c_behind', 'c_ahead', 'c_start'], kind);
          q.keys = c.keys;
          return { text: t('q_where', { t: STEPS_T[1], h }), ...c };
        }
        if (kind === 'why') {
          // all four let go; it stops the moment the stone reaches the bottom in air
          say(t('q_why'));
          await wait(200);
          if (!alive()) return null;
          s.playedAt = now();
          play(T_STONE);
          await wait(T_STONE * SLOW * 1000 + 300);
          if (!alive()) return null;
          jumpTo(T_STONE);
          q = { kind };
          const c = textChoices(['c_drag', 'c_less_g', 'c_light', 'c_late'], kind);
          q.keys = c.keys;
          return { text: t('q_why'), ...c };
        }
        if (kind === 'speed') {
          if (Math.random() < 0.5) {
            // from the picture: the arrow at 0.1 s, then what at 0.3 s?
            jumpTo(STEPS_T[0]);
            const [t1, t2] = [STEPS_T[0], STEPS_T[2]];
            const v1 = round(freeV(t1), 2);
            const k = Math.round(t2 / t1);
            const v = round(freeV(t2), 2);
            q = { kind, pic: true, t1, t2, v1, v, k };
            return {
              text: t('q_speed_pic', { t1, v1, t2 }),
              ...numberChoices(
                v,
                [
                  { v: v1 * k * k, note: 'miss_v_sq' },
                  { v: v1, note: 'miss_v_const' },
                  { v: v1 * 2, note: 'miss_v_once' },
                ],
                'u_ms',
                kind,
                { variant: 'picture' },
              ),
            };
          }
          const tt = pickOne([3, 4, 5]);
          const v = round(G * tt, 2);
          q = { kind, t: tt, v };
          return {
            text: t('q_speed_num', { t: tt, g: G }),
            ...numberChoices(
              v,
              [
                { v: 0.5 * G * tt * tt, note: 'miss_v_half_sq' },
                { v: 0.5 * G * tt, note: 'miss_v_half' },
                { v: G * tt * tt, note: 'miss_v_gt2' },
                { v: G / tt, note: 'miss_v_div' },
              ],
              'u_ms',
              kind,
              { variant: 'number', t: tt },
            ),
          };
        }
        if (kind === 'height') {
          if (Math.random() < 0.5) {
            jumpTo(STEPS_T[0]);
            const [t1, t2] = [STEPS_T[0], STEPS_T[1]];
            const h1 = round(freeH(t1) * 100, 1);
            const k = Math.round(t2 / t1);
            const h = round(h1 * k * k, 1);
            q = { kind, pic: true, t1, t2, h1, h, k };
            return {
              text: t('q_height_pic', { t1, h1, t2 }),
              ...numberChoices(
                h,
                [
                  { v: h1 * k, note: 'miss_h_lin' },
                  { v: h1 * (k * k - 1), note: 'miss_h_gap' },
                  { v: h1 * k * k * k, note: 'miss_h_cube' },
                ],
                'u_cm',
                kind,
                { variant: 'picture' },
              ),
            };
          }
          const tt = pickOne([2, 3, 4]);
          const h = round(0.5 * G * tt * tt, 2);
          q = { kind, t: tt, h };
          return {
            text: t('q_height_num', { t: tt, g: G }),
            ...numberChoices(
              h,
              [
                { v: G * tt * tt, note: 'miss_h_no_half' },
                { v: 0.5 * G * tt, note: 'miss_h_no_sq' },
                { v: G * tt, note: 'miss_h_gt' },
                { v: (0.5 * G * tt) ** 2, note: 'miss_h_sq_all' },
              ],
              'u_m',
              kind,
              { variant: 'number', t: tt },
            ),
          };
        }
        if (kind === 'ratio') {
          // the tubes ready (the marks would show the answer); the worked answer plays a fall
          const heights = Math.random() < 0.5;
          const sets = heights
            ? [{ r: [1, 4, 9] }, { r: [1, 2, 3], note: 'miss_r_lin' }, { r: [1, 3, 5], note: 'miss_r_odd' }, { r: [1, 8, 27] }]
            : [{ r: [1, 2, 3] }, { r: [1, 4, 9], note: 'miss_r_sq' }, { r: [1, 3, 5] }, { r: [1, 1, 1], note: 'miss_r_const' }];
          const list = shuffle([...sets]);
          q = { kind, heights, list, right: sets[0] };
          return {
            text: t(heights ? 'q_ratio_h' : 'q_ratio_v', { a: 1, b: 2, c: 3 }),
            choices: [0, 1, 2, 3],
            expected: list.indexOf(sets[0]),
            tolerance: 0.5,
            label: (j) => ratioLabel(list[j].r),
            meta: { kind, variant: heights ? 'height' : 'velocity', answer: sets[0].r.join(':') },
          };
        }
        // mass: a heavy and a light iron ball
        const k = pickOne([5, 10]);
        const tt = pickOne([2, 3]);
        q = { kind, k, t: tt, m1: 1, m2: k };
        return {
          text: t('q_mass', { m1: 1, m2: k, t: tt }),
          ...numberChoices(
            tt,
            [
              { v: tt / k, note: 'miss_mass' },
              { v: tt / 2, note: 'miss_mass' },
              { v: tt - 0.5, note: 'miss_mass' },
            ],
            'u_s',
            kind,
            { variant: 'mass' },
          ),
        };
      },
      reveal(question, correct) {
        const picked = question.choices[pickedIndex];
        const extra = (note, vars = {}) => (!correct && note ? ` ${t(note, vars)}` : '');
        if (q.kind === 'where') {
          app.hidePaper('vac', false); // there it is, beside the stone
          stage.invalidate();
          const key = q.keys?.[picked];
          const notes = { c_behind: 'miss_behind', c_ahead: 'miss_ahead', c_start: 'miss_start' };
          return t('why_where') + extra(notes[key]);
        }
        if (q.kind === 'why') {
          showPlay(tEnd());
          const key = q.keys?.[picked];
          const notes = { c_less_g: 'miss_less_g', c_light: 'miss_light', c_late: 'miss_late' };
          return t('why_air') + extra(notes[key]);
        }
        if (q.kind === 'speed') {
          const note = question.note?.(picked);
          if (q.pic) {
            showPlay(q.t2);
            return t('why_speed_pic', { v: fmt(q.v), v1: fmt(q.v1), k: q.k }) + extra(note, { dt: STEP, v1: fmt(q.v1), t2: q.t2, k: q.k });
          }
          return t('why_speed_num', { v: fmt(q.v), u: 0, g: G, t: q.t }) + extra(note);
        }
        if (q.kind === 'height') {
          const note = question.note?.(picked);
          if (q.pic) {
            showPlay(q.t2);
            return (
              t('why_height_pic', { h: fmt(q.h, 1), h1: fmt(q.h1, 1), k: q.k, k2: q.k * q.k }) + extra(note, { dt: STEP, k: q.k, k2: q.k * q.k })
            );
          }
          return t('why_height_num', { h: fmt(q.h), g: G, t: q.t }) + extra(note);
        }
        if (q.kind === 'ratio') {
          showPlay(T_VAC);
          const r = q.right.r.join(' : ');
          const wrong = q.list[picked];
          const hs = STEPS_T.map((ti) => fmt(freeH(ti) * 100, 1));
          const why = q.heights ? t('why_ratio_h', { r, a: 1, b: 2, c: 3, h1: hs[0], h2: hs[1], h3: hs[2] }) : t('why_ratio_v', { r });
          return why + extra(wrong?.note, { r: wrong?.r.join(' : ') });
        }
        showPlay(tEnd());
        return t('why_mass', { t: q.t }) + extra('miss_mass', { k: q.k });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on the red button ────────────────────────────────────
  let coach = null;
  if (o.coach) {
    const v = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    /** Would the coach take the red button (its rules: inside the view, not near the corner buttons or the note)? */
    const buttonSpotOk = () => {
      v.copy(app.points.button()).project(camera);
      const x = (v.x * 0.5 + 0.5) * stage.width;
      const y = (-v.y * 0.5 + 0.5) * stage.height;
      if (x < 16 || x > stage.width - 16 || y < 16 || y > stage.height - 48) return false;
      const sr = stage.canvas.getBoundingClientRect();
      return ![ui.corner, slowNote].some((el) => {
        const r = el.getBoundingClientRect();
        return r.width && x > r.left - sr.left - 12 && x < r.right - sr.left + 12 && y > r.top - sr.top - 12 && y < r.bottom - sr.top + 12;
      });
    };
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, slowNote],
      object: {
        // the red button; where it can't be pointed at (too near the corner buttons), the stone on its shutter
        get label() {
          return buttonSpotOk() ? 'coach_release' : 'coach_top';
        },
        candidates: () =>
          [app.points.button(), app.points.stone('air', v2)].map((p) => {
            v.copy(p).project(camera);
            return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height };
          }),
        grabbable: (p) => pick(p) != null,
        // the button goes in and out, as if pressed (nothing falls: the student does that)
        async demo(alive) {
          for (let i = 0; i < 2 && alive() && !s.released; i++) {
            app.pressButton(true);
            stage.invalidate();
            await wait(180);
            app.pressButton(false);
            stage.invalidate();
            await wait(380);
          }
        },
        cancel: () => {
          app.pressButton(false);
          stage.invalidate();
        },
      },
    });
  }

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
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      pickedIndex = Number(b.dataset.q); // the worked answer names the mistake of this pick
      quiz.choose(pickedIndex);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'go':
        if (e.detail === 0) go(); // the keyboard; a finger or the mouse acted on pointerdown
        break;
      case 'step':
        step(1);
        break;
      case 'paper':
        if (s.locked) lockedNudge();
        else setPaper(s.paper === 'crumpled' ? 'flat' : 'crumpled');
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // the panel's main button acts as it goes down (a click comes only when the finger lifts)
  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !(/** @type {Element} */ (e.target).closest('[data-act="go"]'))) return;
    audio.unlock();
    go();
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey =
      ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'c', 'C', 'r', 'R'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) go();
    else if (k === 'ArrowRight' || k === 'ArrowDown') step(1);
    else if (k === 'ArrowLeft' || k === 'ArrowUp') step(-1);
    else if (k === 'c' || k === 'C') setPaper(s.paper === 'crumpled' ? 'flat' : 'crumpled');
    else if (k === 'r' || k === 'R') toStart();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  app.setPaper(s.paper);
  setView(s.view, { animate: false });
  if (Number(o.t) > 0) jumpTo(Number(o.t));
  else toStart();
  syncUI();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else if (!s.released) coach?.start();
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
     * Change any of: paper ('flat' | 'crumpled'; back to the start), t (s after the release, shown paused; 0 = ready),
     * release (true: let go from the start and play it, slowed down), play (true goes on, false pauses), step (1 plays
     * one 0.1 s step, −1 jumps one back), view. animate: false with release jumps to the end.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.paper) setPaper(p.paper, { animate });
      if (p.t != null) jumpTo(Number(p.t) || 0);
      if (p.release) {
        toStart();
        if (animate) play();
        else jumpTo(tEnd());
      }
      if (p.play === true && phase() !== 'done') play();
      if (p.play === false) pause();
      if (p.step) step(Number(p.step) < 0 ? -1 : 1);
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      hideHint();
      setPaper('flat', { animate: false });
      toStart();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The apparatus with both tubes and their bodies (as they are now); not the marks of a fall. */
    exportRoot() {
      const copy = app.root.clone(true);
      for (const name of ['PictureLines', 'Speed1', 'Speed2', 'Speed3', 'Picture0', 'Picture1', 'Picture2']) {
        const ob = copy.getObjectByName(name);
        if (ob) ob.userData.noExport = true;
      }
      return copy;
    },
  };
}
