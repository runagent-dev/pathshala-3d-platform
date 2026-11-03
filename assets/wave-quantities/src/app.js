// Wave quantities (book pages 195–197, topic 7.2.3), student view. A wave driver at one end of a 2 m rope on a lab
// bench makes a transverse wave, y = a cos(kx − ωt); a graph board behind the rope is the metre scale. The rope opens
// still, like the book's চিত্র ৭.০৮ in 3D: λ (orange, crest to crest), a (green, rest line to crest) and a marked
// particle (a green bead). The one action, "এক দোলনকাল চালাও", runs time for exactly one period T (shown slowed ten
// times): the driver goes once up and down, the bead once round, and the crest that starts at the driver (a hollow
// blue ring stays there) is followed by a blue dot and arrow until it stands exactly one λ on, over the end of the
// orange λ mark. So v = λ/T = fλ. The row of words changes f (৫ / ১০ / ২.৫ Hz on the same rope: λ changes, v stays
// 5 m/s) or the rope (a heavy rope at the same tension and 5 Hz: v = 2.5 m/s, λ = 0.5 m). The panel draws the
// displacement–distance and displacement–time graphs live, the result v = f × λ and the book's rule as it grows; a
// six-question test reads a, λ, the crest after 2T, phase and v off the picture. Built on the shared kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { boldArrow } from './arrows.js';
import { COLORS, createGraphs } from './graphs.js';
import { Y0, apparatusMaterials, backdropTexture, createApparatus, envelope } from './apparatus.js';
import {
  A,
  EXAMPLES,
  LENGTH,
  PHASE_EXAMPLE,
  TRAVEL_EXAMPLE,
  PHASE_POINTS,
  ROPES,
  SLOW,
  XP,
  ampChoices,
  ampMark,
  atWholePeriod,
  displacement,
  lambdaChoices,
  markers,
  nextPeriod,
  quantities,
  round,
  slope,
  speedChoices,
  travelChoices,
  travelled,
} from './reading.js';

export const DEFAULTS = {
  example: 'f5',
  at: 0,
  play: false,
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const TEXT = { a: '#237a35', lambda: '#c2410c', T: '#c2255c', f: '#862e9c', v: '#1864ab', ink: '#1d2733' };
const DOUBLE_TAP = 400; // ms
const MARGIN = { top: 46, bottom: 26, side: 6 };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
// a mild three-quarter view (about 14° from the right, 11° from above): the board is a printed scale that must be
// read, so the milder angle of lessons.md 42, which still shows the depth of the bench, the driver and the board
const DIR = V(0.25, 0.2, 1).normalize();
const UPV = V(0, 1, 0);
const DOWNV = V(0, -1, 0);
const RIGHTV = V(1, 0, 0);
const LEFTV = V(-1, 0, 0);
/** The box the camera frames: the driver, the rope and the board with its scale (the generator may run off the edge). */
const FRAME_BOX = new THREE.Box3(V(-0.1, Y0 - 0.3, -0.07), V(LENGTH + 0.15, Y0 + 0.18, 0.03));
const BRACKET_Y = Y0 - A - 0.045; // the λ bracket, under the troughs
const ARROW_Y = Y0 + A + 0.045; // the blue arrow, over the crests

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'wq');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'examples', results: true, items: EXAMPLES.map((e) => ({ id: e.id, label: e.rope === 'light' ? 'ex_f' : `ex_${e.id}` })) },
      quiet: [
        { act: 'play', label: 'act_play', icon: ICONS.play },
        { act: 'reset', label: 'act_reset', icon: ICONS.reset },
      ],
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the frequency words carry their numbers through t.num
  for (const b of sheet.words) {
    const ex = EXAMPLES.find((e) => e.id === b.dataset.example);
    const w = b.querySelector('.pvc-ex-word');
    if (ex && w && ex.rope === 'light') w.textContent = t('ex_f', { f: ex.f });
  }
  // the two graphs, between the action and the result
  const graphHost = document.createElement('div');
  graphHost.className = 'wq-graph';
  $('.pvc-act-row').after(graphHost);
  const graphs = createGraphs(graphHost, t);
  // the honest note on time, on the view
  const note = document.createElement('div');
  note.className = 'wq-note';
  note.textContent = t('slow', { k: SLOW });
  ui.stage.append(note);
  const playBtn = /** @type {HTMLButtonElement} */ ($('[data-act="play"]'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.05, far: 60, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  controls.minPolarAngle = 0.6;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minAzimuthAngle = -1.1;
  controls.maxAzimuthAngle = 1.1;

  if (o.bg !== 'transparent') scene.background = backdropTexture();
  scene.add(new THREE.HemisphereLight('#eef3ff', '#6b4a32', 1.05));
  const sun = new THREE.DirectionalLight('#fff3e0', 2.0);
  sun.position.set(1.8, 4.5, 3.2);
  sun.target.position.set(1.3, 0.2, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#d4defa', 0.55);
  fill.position.set(-3, 2, 5);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 512);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.006;
    sun.shadow.radius = 3;
  }
  Object.assign(sun.shadow.camera, { left: -2.6, right: 2.6, top: 0.9, bottom: -0.9, near: 1, far: 9 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.updateMatrixWorld();

  const mats = apparatusMaterials();
  const app3d = createApparatus(mats, N);
  scene.add(app3d.root);

  // the crest that is followed for one period: a hollow blue ring where it started (at the driver) and a solid blue
  // dot on it as it moves, each in a white rim so they read on the rope and the board
  const flat = (color) => new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true });
  function marker(geo, rimGeo) {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(rimGeo, flat('#ffffff'));
    const core = new THREE.Mesh(geo, flat(COLORS.v));
    rim.renderOrder = 32;
    core.renderOrder = 33;
    g.add(rim, core);
    g.userData.noExport = true;
    g.visible = false;
    scene.add(g);
    return g;
  }
  const startRing = marker(new THREE.TorusGeometry(0.024, 0.0045, 10, 40), new THREE.TorusGeometry(0.024, 0.008, 10, 40));
  const crestDot = marker(new THREE.CircleGeometry(0.017, 32), new THREE.CircleGeometry(0.024, 32));

  // the marks: λ (an orange double arrow under the troughs with ticks up to the crests), a (green), the crest's
  // travel (blue)
  const lamL = boldArrow('LambdaLeft', COLORS.lambda, 0.0045);
  const lamR = boldArrow('LambdaRight', COLORS.lambda, 0.0045);
  const ampArrow = boldArrow('Amplitude', COLORS.a, 0.0045);
  const goArrow = boldArrow('CrestTravel', COLORS.v, 0.008);
  const tickMat = new THREE.MeshBasicMaterial({ color: COLORS.lambda, transparent: true, opacity: 0.9, depthTest: false });
  const tickGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 1, 6).translate(0, 0.5, 0);
  const ticks = [new THREE.Mesh(tickGeo, tickMat), new THREE.Mesh(tickGeo, tickMat)];
  for (const m of ticks) {
    m.renderOrder = 29;
    m.userData.noExport = true;
  }
  scene.add(lamL.root, lamR.root, ampArrow.root, goArrow.root, ...ticks);
  // the quiz's points A–E: small dark rings on the rope
  const pointMat = new THREE.MeshBasicMaterial({ color: '#1d2733', depthTest: false, transparent: true });
  const pointMeshes = PHASE_POINTS.map(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 10), pointMat);
    m.renderOrder = 31;
    m.userData.noExport = true;
    m.visible = false;
    scene.add(m);
    return m;
  });

  // a big invisible box round the driver and the generator: a tap there runs one period
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(-0.25, 0.22, -0.08);
  hit.userData.noExport = true;
  scene.add(hit);

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
    mode: 'explore',
    locked: false,
    ex: EXAMPLES.some((e) => e.id === o.example) ? o.example : 'f5',
    tau: 0, // the wave's own time (real seconds; the picture runs SLOW times slower)
    playing: false,
    /** One period: { ff: a whole period to reach first (fast), from, to } or null. */
    run: null,
    /** The last period run (for the ghost, the blue arrow and the result), or null. */
    shown: null,
    measured: new Set(),
    userMovedCamera: false,
    show: { marks: true, points: false, labels: true, start: false },
    token: 0,
    revealed: false, // the test's answer is shown (the scale chips step aside)
  };
  let q = quantities(s.ex);
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the scene from the state ────────────────────────────────────────────────
  const yOf = (x) => displacement(q, x, s.tau) * envelope(x);
  const slopeOf = (x) => {
    const e = envelope(x);
    // d/dx (y·e): the envelope's own slope is small; a finite difference keeps it exact enough
    const h = 1e-4;
    const de = (envelope(x + h) - envelope(x - h)) / (2 * h);
    return slope(q, x, s.tau) * e + displacement(q, x, s.tau) * de;
  };
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  function syncScene() {
    const rope = ROPES[q.rope];
    app3d.setRope(q.rope, rope.radius, yOf, slopeOf);
    app3d.driver.setEnd(Y0 + displacement(q, 0, s.tau));
    app3d.bead.position.set(XP, Y0 + displacement(q, XP, s.tau), 0);
    app3d.bead.scale.setScalar(rope.radius + 0.011);
    // marks: shown at rest (and during a period: λ as the reference, a hidden)
    const still = !s.playing && !s.run?.ff;
    const mk = still && s.show.marks ? markers(q, s.run ? s.run.from : s.tau) : null;
    if (mk) {
      const mid = (mk.start + mk.end) / 2;
      lamL.set(tmpA.set(mid, BRACKET_Y, 0.02), LEFTV, mid - mk.start);
      lamR.set(tmpA.set(mid, BRACKET_Y, 0.02), RIGHTV, mk.end - mid);
      const y0 = mk.crest ? Y0 + A : Y0 - A;
      ticks.forEach((m, i) => {
        const x = i ? mk.end : mk.start;
        m.visible = true;
        m.position.set(x, BRACKET_Y, 0.02);
        m.scale.y = Math.max(0.001, y0 - BRACKET_Y - 0.012);
      });
    } else {
      lamL.hide();
      lamR.hide();
      for (const m of ticks) m.visible = false;
    }
    const am = still && !s.run && !s.shown && s.show.marks ? ampMark(q, s.tau) : null;
    if (am) ampArrow.set(tmpB.set(am.x, Y0, 0.02), am.up ? UPV : DOWNV, A - 0.004);
    else ampArrow.hide();
    // the crest's travel during and after one period: start ring ○ at the driver, the crest ● one λ later at the end
    const r = s.run && !s.run.ff ? s.run : s.shown;
    const follow = r && !s.playing;
    const d = follow ? travelled(q, Math.min(s.tau, r.to) - r.from) : 0;
    if (follow && d > 0.004) goArrow.set(tmpA.set(0, ARROW_Y, 0.02), RIGHTV, d);
    else goArrow.hide();
    startRing.visible = Boolean(follow) || s.show.start;
    startRing.position.set(0, Y0 + A, 0.03);
    crestDot.visible = Boolean(follow);
    crestDot.position.set(d, Y0 + displacement(q, d, s.tau), 0.03);
    for (const m of [startRing, crestDot]) m.quaternion.copy(camera.quaternion);
    // the quiz's points
    PHASE_POINTS.forEach((p, i) => {
      const m = pointMeshes[i];
      m.visible = s.show.points;
      m.position.set(p.x, Y0 + displacement(q, p.x, s.tau), 0.015);
    });
    graphs.draw({ q, tau: s.tau, runFrom: r && !s.playing ? r.from : null });
    stage.invalidate();
  }

  // the clock: the wave's time runs while playing or during one period
  stage.addTicker((dt) => {
    if (s.playing) {
      s.tau += dt / SLOW;
      syncScene();
      syncLabels();
      refreshLive();
      return true;
    }
    const r = s.run;
    if (!r) return false;
    if (r.ff) {
      // reach the next whole period quickly (four times the slowed speed), then count
      s.tau = Math.min(r.from, s.tau + (4 * dt) / SLOW);
      if (s.tau >= r.from - 1e-9) {
        s.tau = r.from;
        r.ff = false;
        audio.tick?.();
      }
    } else {
      s.tau = Math.min(r.to, s.tau + dt / SLOW);
      if (s.tau >= r.to - 1e-9) finishPeriod();
    }
    syncScene();
    syncLabels();
    refreshLive();
    return true;
  });

  // ── the panel ───────────────────────────────────────────────────────────────
  const fmt = (x, d = 2) => N(round(x, d));
  const vars = () => ({ f: fmt(q.f), T: fmt(q.T), lambda: fmt(q.lambda), v: fmt(q.v), a: fmt(q.a) });
  function ruleHtml() {
    const light = [...s.measured].filter((id) => quantities(id).rope === 'light').length;
    if (s.measured.has('heavy') && light >= 1) {
      const h = quantities('heavy');
      return t('rule_3', { f: fmt(h.f), v: fmt(h.v), lambda: fmt(h.lambda) });
    }
    if (light >= 2) return t('rule_2');
    if (s.measured.size >= 1) return t('rule_1', { one: 1 });
    return t('rule_0');
  }
  function outcomeHtml() {
    const v = vars();
    if (s.playing) return t('out_play', v);
    if (s.run && !s.run.ff) {
      const el = s.tau - s.run.from;
      return t('out_run', { t: fmt(el), d: fmt(travelled(q, el)) });
    }
    if (s.shown) return t('out_done', v);
    return t('out_ask', { ...v, one: 1 });
  }
  function nextExample() {
    for (const e of EXAMPLES) if (!s.measured.has(e.id)) return e.id;
    return null;
  }
  function refreshLive() {
    sheet.outcome(outcomeHtml());
  }
  function refresh() {
    sheet.choose(s.ex);
    for (const e of EXAMPLES) sheet.result(e.id, s.measured.has(e.id) ? t('ex_res', { v: fmt(quantities(e.id).v) }) : '');
    sheet.next(s.measured.has(s.ex) ? nextExample() : null);
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    const playing = s.playing;
    playBtn.innerHTML = `${playing ? ICONS.pause : ICONS.play}<span>${t(playing ? 'act_pause' : 'act_play')}</span>`;
    playBtn.setAttribute('aria-label', t(playing ? 'act_pause' : 'act_play'));
    playBtn.title = t(playing ? 'act_pause' : 'act_play');
    playBtn.setAttribute('aria-pressed', String(playing));
    if (action) {
      const again = s.measured.has(s.ex);
      action.set({ label: again ? 'act_again' : 'act_period', step: again ? '' : s.measured.size + 1, enabled: true });
      if (!again && !s.run && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    app3d.gen.setDisplay(`${fmt(q.f)} Hz`);
    syncLabels();
    stage.invalidate();
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
  function arrowBox(a, pad = 6) {
    if (!a.visible) return null;
    toScreen(a.root.position, P0);
    toScreen(a.tip, P1);
    return {
      left: Math.min(P0.x, P1.x) - pad,
      top: Math.min(P0.y, P1.y) - pad,
      right: Math.max(P0.x, P1.x) + pad,
      bottom: Math.max(P0.y, P1.y) + pad,
    };
  }
  /** The rope's band on the screen (the labels keep off it): its crests and troughs over the board. */
  function ropeBoxes() {
    const out = [];
    for (let i = 0; i < 6; i++) {
      const x0 = (i / 6) * LENGTH;
      const x1 = ((i + 1) / 6) * LENGTH;
      toScreen(tmp.set(x0, Y0 + A, 0), P0);
      const ax = P0.x;
      const ay = P0.y;
      toScreen(tmp.set(x1, Y0 - A, 0), P1);
      out.push({ left: Math.min(ax, P1.x), right: Math.max(ax, P1.x), top: Math.min(ay, P1.y) - 2, bottom: Math.max(ay, P1.y) + 2 });
    }
    return out;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, note, () => action?.box(), () => action?.ringBox(), () => arrowBox(goArrow), () => arrowBox(ampArrow, 3)],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const BELOW = [spot(0, 20), spot(26, 20), spot(-26, 20), spot(0, 34)];
  const SIDE = [spot(18, 0), spot(-18, 0), spot(18, -16), spot(-18, -16), spot(20, 16)];
  const labelState = new Map();
  function wantLabels() {
    const want = new Map();
    if (!s.show.labels) return want;
    const still = !s.playing && !s.run?.ff;
    want.set('f', {
      text: t('lbl_f', { f: fmt(q.f) }),
      point: () => V(0.04, 0.06, 0.076),
      spots: [spot(-8, 30), spot(26, 30), spot(-22, 0)],
      color: TEXT.f,
    });
    if (still && s.show.marks) {
      const mk = markers(q, s.run ? s.run.from : s.tau);
      if (mk)
        want.set('lambda', {
          text: t('lbl_lambda', { v: fmt(q.lambda) }),
          point: () => V((mk.start + mk.end) / 2, BRACKET_Y, 0.02),
          spots: BELOW,
          color: TEXT.lambda,
        });
      const am = !s.run && !s.shown ? ampMark(q, s.tau) : null;
      if (am)
        want.set('a', {
          text: t('lbl_a', { v: fmt(A) }),
          point: () => V(am.x + 0.01, Y0 + (am.up ? A : -A) * 0.5, 0.02),
          spots: [spot(-20, 0), spot(20, 0), spot(-22, am.up ? -14 : 14), spot(22, am.up ? -14 : 14)],
          color: TEXT.a,
        });
    }
    const r = s.run && !s.run.ff ? s.run : s.shown;
    const following = Boolean(r) && !s.playing;
    if (s.show.marks && !following)
      want.set('particle', {
        text: t('lbl_particle'),
        point: () => app3d.bead.position,
        spots: [spot(0, -26), spot(24, -24), spot(-24, -24), spot(0, 26)],
        color: TEXT.a,
        optional: true,
      });
    if (following) {
      const el = Math.min(r.to, s.tau) - r.from;
      const done = !s.run && s.shown;
      // the clock on the picture only where there is room (the result line always says t and T)
      if (stage.width >= 700)
        want.set('time', {
          text: done ? t('lbl_time_T', { t: fmt(q.T) }) : t('lbl_time', { t: fmt(el) }),
          point: () => V(0, Y0 + A + 0.02, 0),
          optional: true,
          spots: [spot(-30, -14), spot(-14, -30), spot(-30, 14), spot(0, -34)],
          color: TEXT.T,
        });
      const d = travelled(q, el);
      if (d > 0.05)
        want.set('went', {
          text: t('lbl_went', { d: fmt(d) }),
          point: () => V(d / 2, ARROW_Y, 0.02),
          spots: [spot(0, -20), spot(30, -22), spot(0, -36), spot(46, -24)],
          color: TEXT.v,
        });
    }
    if (s.show.points)
      PHASE_POINTS.forEach((p, i) => {
        want.set(`p${p.id}`, {
          text: p.id,
          point: () => pointMeshes[i].position,
          spots:
            p.id === 'D'
              ? [spot(-18, -4), spot(-16, 8), ...SIDE]
              : p.id === 'E'
                ? [spot(18, -4), spot(16, 8), ...SIDE]
                : displacement(q, p.x, s.tau) >= 0
                  ? [spot(0, -18), ...SIDE]
                  : [spot(0, 18), ...SIDE],
          color: TEXT.ink,
        });
      });
    // in the test: the board's numbers as big chips, so the scale reads on a phone
    if (s.mode === 'quiz' && !s.revealed && s.show.scale !== false) {
      for (let i = 0; i <= LENGTH * 2; i++)
        want.set(`sx${i}`, {
          text: `${N(i / 2)}${i === LENGTH * 2 ? '&nbsp;m' : ''}`,
          point: () => V(i / 2, Y0 - 0.25, 0),
          kind: 'scale',
          color: TEXT.ink,
        });
      for (const [k, y, txt] of [
        ['sy1', A, N(0.1)],
        ['sy2', -A, `−${N(0.1)}`],
      ])
        want.set(k, { text: `${txt}${k === 'sy1' ? '&nbsp;m' : ''}`, point: () => V(LENGTH + 0.06, Y0 + y, 0), kind: 'scale', color: TEXT.ink });
    }
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
        if (w.kind === 'scale') anno.add(id, { text: w.text, point: w.point, kind: 'scale', color: w.color, dx: 0, dy: 0 });
        else anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, optional: w.optional, avoid: [ropeBoxes] });
        labelState.set(id, w.text);
      } else if (labelState.get(id) !== w.text) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, w.text);
      } else anno.update(id, { point: w.point });
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewPose() {
    return fitPose({ box: FRAME_BOX, dir: DIR, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function place(pose) {
    camera.position.copy(pose.position);
    controls.target.copy(pose.target);
    controls.update();
  }
  function flyTo({ position, target: aim }, duration = 0.7) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      place({ position, target: aim });
      return Promise.resolve(true);
    }
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
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    syncUI();
  });
  controls.addEventListener('change', () => stage.invalidate());
  stage.onBeforeRender(() => {
    for (const m of [startRing, crestDot]) m.quaternion.copy(camera.quaternion);
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) place(viewPose());
    syncScene();
    refresh();
  });

  // ── one period ──────────────────────────────────────────────────────────────
  function runPeriod() {
    s.playing = false;
    s.shown = null;
    const from = atWholePeriod(q, s.tau) ? s.tau : nextPeriod(q, s.tau);
    s.run = { ff: from > s.tau + 1e-9, from, to: from + q.T };
    audio.pop?.();
    syncScene();
    refresh();
    emitChange();
  }
  function finishPeriod() {
    const r = s.run;
    if (!r) return;
    s.tau = r.to;
    s.run = null;
    s.shown = { from: r.from, to: r.to };
    s.measured.add(s.ex);
    audio.success();
    syncScene();
    refresh();
    emitChange();
  }
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.run) return showHint(t('hint_wait'), { duration: 1800 });
    runPeriod();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_period',
    target: () => app3d.driver.root.children[0],
    pad: 10,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── examples, play, reset ───────────────────────────────────────────────────
  function chooseExample(id) {
    if (!EXAMPLES.some((e) => e.id === id)) return;
    s.token++;
    s.ex = id;
    q = quantities(id);
    s.run = null;
    s.shown = null;
    s.tau = 0;
    syncScene();
    refresh();
    emitChange();
  }
  function togglePlay(on = !s.playing) {
    if (s.locked) return lockedNudge();
    if (on) {
      s.run = null;
      s.shown = null;
    }
    s.playing = on;
    syncScene();
    refresh();
    emitChange();
  }
  function resetAll() {
    s.token++;
    s.measured.clear();
    s.playing = false;
    s.show = { marks: true, points: false, labels: true, start: false };
    chooseExample('f5');
    homeView(false);
  }

  // ── taps on the picture ─────────────────────────────────────────────────────
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt = null;
  stage.canvas.addEventListener('pointerdown', (e) => {
    downAt = { x: e.clientX, y: e.clientY, t: now() };
  });
  stage.canvas.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    const quick = now() - downAt.t < 500;
    downAt = null;
    if (moved > 8 || !quick || s.mode === 'quiz') return;
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(hit, false).length) {
      audio.unlock();
      doAction();
    }
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
  function snapshot() {
    return {
      example: s.ex,
      rope: q.rope,
      a: q.a,
      f: q.f,
      T: round(q.T, 3),
      lambda: round(q.lambda, 3),
      v: q.v,
      tau: round(s.tau, 4),
      playing: s.playing,
      running: Boolean(s.run),
      travelled: s.shown ? round(travelled(q, s.shown.to - s.shown.from), 3) : s.run && !s.run.ff ? round(travelled(q, s.tau - s.run.from), 3) : 0,
      measured: EXAMPLES.map((e) => e.id).filter((id) => s.measured.has(id)),
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.example, snap.playing, snap.running, snap.measured, snap.mode]);
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
      choices: list.map((_, i) => i),
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="wq-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const mVal = (x) => `${fmt(x, 3)}&nbsp;m`;
  const msVal = (x) => `${fmt(x, 3)}&nbsp;m/s`;
  const KINDS = ['amp', 'lambda', 'travel', 'phase', 'speed', 'double'];
  let lambdaEx = 'f2';
  let learnSaved = null;
  let question = null;
  let picked = -1;
  /** Sets up a still scene for a question. */
  function sceneFor(ex, show) {
    s.token++;
    s.playing = false;
    s.run = null;
    s.shown = null;
    s.ex = ex;
    q = quantities(ex);
    s.tau = 0;
    s.show = { marks: false, points: false, labels: true, start: false, ...show };
    s.userMovedCamera = false;
    syncUI();
    syncScene();
    refresh();
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
        learnSaved = { ex: s.ex, measured: new Set(s.measured) };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { marks: true, points: false, labels: true, start: false };
        s.measured = learnSaved?.measured ?? s.measured;
        chooseExample(learnSaved?.ex ?? 'f5');
        syncUI();
        homeView(false);
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        s.revealed = false;
        const kind = KINDS[i % KINDS.length];
        const pick = (ids) => ids[Math.floor(Math.random() * ids.length)];
        if (kind === 'amp') sceneFor(pick(['f5', 'f2']), {});
        else if (kind === 'lambda') {
          lambdaEx = pick(['f2', 'heavy']);
          sceneFor(lambdaEx, {});
        } else if (kind === 'travel') sceneFor(TRAVEL_EXAMPLE, { start: true });
        else if (kind === 'phase') sceneFor(PHASE_EXAMPLE, { points: true });
        else if (kind === 'speed')
          sceneFor(lambdaEx === 'f2' ? 'heavy' : 'f2', {}); // never the rope whose λ was just shown
        else sceneFor('f5', { marks: true, scale: false }); // a question on the idea: λ shown, no scale needed
        await flyTo(viewPose(), 0.6);
        if (!alive()) return null;
        question = { kind, ex: s.ex };
        if (kind === 'amp') return { text: t('q_amp'), ...choicesOf(ampChoices(q), kind, (c) => mVal(c.v)) };
        if (kind === 'lambda') return { text: t('q_lambda'), ...choicesOf(lambdaChoices(q), kind, (c) => mVal(c.v)) };
        if (kind === 'travel') return { text: t('q_travel'), ...choicesOf(travelChoices(q), kind, (c) => mVal(c.v)) };
        if (kind === 'phase')
          return {
            text: t('q_phase'),
            ...choicesOf(
              ['AC', 'AB', 'DE', 'BD'].map((k) => ({ key: k })),
              kind,
              (c) => t(`c_phase_${c.key}`),
            ),
          };
        if (kind === 'speed') return { text: t('q_speed'), ...choicesOf(speedChoices(q), kind, (c) => msVal(c.v)) };
        return {
          text: t('q_double', { f1: fmt(q.f), f2: fmt(q.f * 2) }),
          ...choicesOf(
            ['right', 'lambda2', 'v2', 'halfv'].map((k) => ({ key: k })),
            kind,
            (c) => t(`c_dbl_${c.key}`),
          ),
        };
      },
      reveal(qq, correct) {
        s.revealed = true;
        syncLabels();
        const k = question.kind;
        const wrongKey = correct ? null : qq.list?.[picked]?.key;
        const v = vars();
        const noteOf = (prefix, map = null) => (wrongKey && wrongKey !== 'right' ? ` ${t(map?.[wrongKey] ?? `${prefix}${wrongKey}`, v)}` : '');
        if (k === 'amp') {
          s.show = { marks: true, points: false, labels: true, start: false };
          syncScene();
          refresh();
          return t('why_amp', v) + (wrongKey === 'half' ? ` ${t('mis_amp_half', { c: fmt(0.025, 3) })}` : noteOf('mis_amp_'));
        }
        if (k === 'lambda') {
          s.show = { marks: true, points: false, labels: true, start: false };
          syncScene();
          refresh();
          return t('why_lambda', v) + noteOf('mis_lambda_');
        }
        if (k === 'travel') {
          // the answer on the picture: the crest two periods on, two λ from where it started
          s.show = { marks: true, points: false, labels: true, start: true };
          s.shown = { from: 0, to: 2 * q.T };
          s.tau = 2 * q.T;
          syncScene();
          refresh();
          return t('why_travel', { lambda: fmt(q.lambda), d: fmt(2 * q.lambda) }) + noteOf('mis_travel_');
        }
        if (k === 'phase') return t('why_phase', { fig: '7.09' }) + (wrongKey && wrongKey !== 'AC' ? ` ${t(`mis_phase_${wrongKey}`)}` : '');
        if (k === 'speed') {
          s.show = { marks: true, points: false, labels: true, start: false };
          syncScene();
          refresh();
          return t('why_speed', v) + noteOf('mis_speed_');
        }
        // the answer on the picture: the same rope at twice the frequency
        const f2 = q.f * 2;
        const l2 = q.v / f2;
        const out = t('why_double', { v: fmt(q.v), f2: fmt(f2), l2: fmt(l2) }) + noteOf('mis_dbl_');
        sceneFor('f10', { marks: true });
        return out;
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
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view === 'front') homeView();
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.example) {
      if (s.locked) return lockedNudge();
      chooseExample(b.dataset.example);
    }
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'play') togglePlay();
    else if (b.dataset.act === 'reset') resetAll();
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
    const sceneKey = ['r', 'R', 'p', 'P', 'ArrowRight', 'ArrowLeft'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    const at = EXAMPLES.findIndex((x) => x.id === s.ex);
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowRight') chooseExample(EXAMPLES[(at + 1) % EXAMPLES.length].id);
    else if (k === 'ArrowLeft') chooseExample(EXAMPLES[(at + EXAMPLES.length - 1) % EXAMPLES.length].id);
    else if (k === 'p' || k === 'P') togglePlay();
    else if (k === 'r' || k === 'R') resetAll();
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  q = quantities(s.ex);
  s.tau = Math.max(0, Number(o.at) || 0);
  s.playing = Boolean(o.play);
  syncUI();
  place(viewPose());
  syncScene();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
  })();

  const wait = (sec) => tweener.animate({ key: `wait${Math.random()}`, duration: sec, onUpdate: () => {} }).finished;
  async function settle() {
    for (let i = 0; i < 800 && s.run; i++) await wait(0.05);
  }

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /**
     * example: 'f5' | 'f10' | 'f2' | 'heavy'; tau: the wave's time (s); play: true | false; run: true runs one period
     * (with animate: false it lands at the end at once); measured: a list of examples already measured.
     */
    async set(p = {}) {
      if (s.mode === 'quiz' && (p.example || p.run || p.play != null || p.tau != null)) quiz.stop();
      if (p.example) chooseExample(p.example);
      if (Array.isArray(p.measured)) {
        s.measured = new Set(p.measured.filter((id) => EXAMPLES.some((e) => e.id === id)));
        refresh();
      }
      if (p.tau != null) {
        s.run = null;
        s.shown = null;
        s.tau = Math.max(0, Number(p.tau) || 0);
        syncScene();
        refresh();
      }
      if (p.play != null) togglePlay(Boolean(p.play));
      if (p.run) {
        if (p.animate === false) {
          runPeriod();
          s.tau = s.run.to;
          finishPeriod();
        } else {
          lastAct = Number.NEGATIVE_INFINITY;
          doAction();
          await settle();
        }
      }
      if (p.view === 'front') homeView(false);
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      resetAll();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The apparatus as it stands (the rope in its current shape), without the bench, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'WaveQuantities';
      // the rope as it stands, the driver, the generator, the board and the far end; not the bench or the floor
      for (const part of app3d.root.children) if (part.name !== 'Bench' && part.visible) g.add(part.clone(true));
      return g;
    },
  };
}
