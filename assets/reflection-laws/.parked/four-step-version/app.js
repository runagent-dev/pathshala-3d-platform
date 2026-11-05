// Laws of reflection (প্রতিফলনের সূত্র), book pp 214–218, topics 8.2, 8.2.1, 8.2.2: the student view. A calm mountain
// lake is the setting, and the teaching follows the book step by step, in its words and its order:
//   1. তিন ঘটনা (8.2, চিত্র ৮.০২): at the boundary of প্রথম মাধ্যম (air) and দ্বিতীয় মাধ্যম (water): প্রতিফলন, প্রতিসরণ, শোষণ.
//   2. দুই সূত্র (8.2.1, চিত্র ৮.০৩): the ray XO, the perpendicular at O, the plane, the reflected ray OX′, θi and θr; then
//      the plane is swung (the first law) and X is dragged (the second law).
//   3. কতটুকু (p216, চিত্র ৮.০৫): more is reflected at larger angles; the view sinks with the ray, and the true Fresnel
//      water turns from see-through to a mirror.
//   4. মসৃণ-অমসৃণ (8.2.2, চিত্র ৮.০৭): parallel rays stay parallel on still water; on waves each obeys the law at its own
//      facet and they spread, and the mountain's image breaks up for the same reason.
// The panel is the kit's clean sheet (one action, one result, one rule). A 5-question test, in the book's order.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { fitPose } from './camera.js';
import { ARC, createDiagram, C, L, SHEET } from './diagram.js';
import { createI18n } from './i18n.js';
import { createLake } from './lake.js';
import { createMagnifier, fresnelGraph } from './panelparts.js';
import { angleToNormal, fresnel, N_WATER, offPlane, percent, rad, reflected, sheetNormal, shuffle, snell, toLight } from './reading.js';

export const DEFAULTS = {
  step: 'events', // 'events' | 'laws' | 'amount' | 'surface'
  law: 0, // how far the laws are built: 0 the ray, 1 the normal, 2 the plane, 3 the reflected ray, 4 swung, 5 both laws
  lit: false, // the three events have been shown
  theta: 50, // θi, degrees
  phi: 0, // the swing of the plane, degrees
  waves: false, // the water is wavy
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  sound: true,
};

const STEPS = ['events', 'laws', 'amount', 'surface'];
const LIMIT = {
  events: [20, 75],
  laws: [15, 75],
  amount: [0, 88],
  surface: [20, 62],
};
const PHI = [-60, 34]; // the plane turns this far (it faces the view at −24°): never edge-on
const VIEW = { az: 24, el: 8.5, amountTop: 50, planeEl: 24 };
const FRAME = new THREE.Box3(new THREE.Vector3(-122, -36, -46), new THREE.Vector3(122, 118, 46));
const CHIP_W = 68; // an angle's chip on the view, px
const CHIP_H = 62; // and how high it sits on the normal, in units
const TALL_TOP = 170; // on a squarish view there is height to spare: it goes to the sky, so the mountain is whole
const MARGINS = { top: 36, bottom: 6, side: 6 };
const INK = C.ink;
const AMBER_TEXT = '#9a5300';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'rl');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'rl-note';
  ui.stage.appendChild(note);
  const mag = createMagnifier({ host: ui.stage, t });
  mag.show(false);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 27, near: 10, far: 14000, environment: false });
  const { camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(35);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(86);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-50);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(80);
  const lake = createLake({ stage });
  const dia = createDiagram({ scene: stage.scene });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    step: STEPS.includes(o.step) ? o.step : 'events',
    law: clamp(Math.round(Number(o.law) || 0), 0, 5),
    lit: o.lit ? 1 : 0, // the events' progress, 0 … 1
    theta: clamp(Math.round(Number(o.theta) || 50), 0, 88),
    phi: clamp(Math.round(Number(o.phi) || 0), PHI[0], PHI[1]),
    wavesOn: Boolean(o.waves),
    wind: o.waves ? 1 : 0, // the waves' strength now, 0 … 1
    time: 2.4, // the waves' clock
    spread: 0,
    reveal: 1, // the newest part of the laws, 0 … 1 (it grows in)
    sawGrazing: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    drag: null,
  };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  /** What the panel's action does now. */
  function phase() {
    if (s.step === 'events') return s.lit >= 1 ? 'ev1' : s.lit > 0 ? 'busy' : 'ev0';
    if (s.step === 'laws') return s.reveal < 1 ? 'busy' : `l${s.law}`;
    if (s.step === 'amount') return s.sawGrazing ? 'a1' : 'a0';
    return s.wavesOn ? 's1' : 's0';
  }

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  function applyWorld() {
    lake.setSun(toLight(s.theta, s.phi));
    lake.setWaves(s.wind, s.time);
    dia.clear();
    dia.pose(s.theta, s.phi);
    const q = s.quiz;
    if (q) return applyQuiz(q);
    dia.showO(s.step !== 'surface');
    if (s.step === 'events') {
      const a = clamp(s.lit / 0.5, 0, 1);
      const b = clamp((s.lit - 0.5) / 0.5, 0, 1);
      if (a > 0) dia.drawIncident(a);
      if (a > 0 && a < 1) {
        dia.pulses[0].visible = true;
        const k = (1 - a) * 215;
        const l = dia.dirs.light;
        dia.pulses[0].position.set(l.x * k, l.y * k, l.z * k);
      }
      if (b > 0) {
        dia.drawReflected(b);
        dia.drawRefracted(Math.min(1, b * 1.5));
        dia.drawAbsorbed(Math.min(1, b * 2));
        dia.flash.visible = b < 1;
        dia.flash.material.opacity = 1 - b;
      }
    } else if (s.step === 'laws') {
      const k = s.reveal;
      dia.drawIncident();
      dia.showX(true);
      if (s.law === 1) dia.drawNormal(k);
      else if (s.law > 1) dia.drawNormal();
      if (s.law >= 1 && k >= 1) dia.drawRightAngle();
      if (s.law === 2) dia.sheet(k);
      else if (s.law > 2) dia.sheet(1);
      if (s.law === 3) {
        dia.drawReflected(k * (L / 215));
        if (k >= 1) dia.drawReflected();
      } else if (s.law > 3) dia.drawReflected();
      if (s.law >= 3 && k >= 1) {
        dia.drawAngles(s.theta);
        dia.showDial(true);
      }
    } else if (s.step === 'amount') {
      const R = fresnel(s.theta, N_WATER);
      dia.drawIncident();
      dia.drawNormal();
      dia.sheet(0.7);
      // the width says how much light each way: never quite zero, so the 2 % can still be seen
      dia.drawReflected(1, 0.5 + 4.2 * Math.sqrt(R));
      dia.drawRefracted(1, 0.5 + 3.2 * Math.sqrt(1 - R));
      dia.drawAngles(s.theta, 'i');
      dia.showX(true);
    } else {
      s.spread = dia.drawBundle(s.time, s.wind);
      dia.showX(true);
    }
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function elNow() {
    if (s.quiz?.kind === 'plane') return VIEW.planeEl; // from higher: the feet on the water tell the rays apart
    if (s.step === 'amount' && !s.quiz) return clamp(90 - s.theta, VIEW.el, VIEW.amountTop);
    return VIEW.el;
  }
  function poseNow() {
    dirFrom(VIEW.az, elNow(), camDir);
    FRAME.max.y = stage.width / stage.height < 1.2 ? TALL_TOP : 118;
    return fitPose({ box: FRAME, dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGINS });
  }
  function applyCamera() {
    if (s.userMovedCamera) return;
    const pz = poseNow();
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, pz.position, k);
      controls.target.lerpVectors(camFrom.target, pz.target, k);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
    }
    controls.update();
  }
  function flyCamera(duration = 0.8) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      s.view = 'front';
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camK = k;
        stage.invalidate();
      },
      onComplete: () => {
        camK = 1;
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    if (animate) flyCamera(0.8);
    else camK = 1;
    stage.invalidate();
  }
  controls.addEventListener('start', () => {
    if (s.drag) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  });
  stage.onResize(() => {
    s.userMovedCamera = false;
    if (s.view === '3d') {
      s.view = 'front';
      syncUI();
    }
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    lake.update(camera);
    labels();
  });

  // ── the waves run ──────────────────────────────────────────────────────────────────────────────────────
  let magClock = 0;
  stage.addTicker((dt) => {
    const want = s.wavesOn ? 1 : 0;
    if (s.wind === want && want === 0) return false;
    if (s.wind !== want) {
      s.wind = want > s.wind ? Math.min(1, s.wind + dt / 1.4) : Math.max(0, s.wind - dt / 1.1);
      panel();
    }
    s.time += dt;
    lake.setWaves(s.wind, s.time);
    if (s.step === 'surface' || s.quiz?.kind === 'rough') {
      s.spread = dia.drawBundle(s.time, s.wind);
      magClock += dt;
      if (magClock > 0.09) {
        magClock = 0;
        const { u } = dia.dirs;
        mag.draw(s.theta, u.x, u.z, s.time, s.wind);
        panel();
      }
    }
    return true;
  });

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function poseTween(theta, phi, duration = 0.7) {
    const t0 = s.theta;
    const p0 = s.phi;
    return tweener.animate({
      key: 'pose',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.theta = Math.round(t0 + (theta - t0) * k);
        s.phi = Math.round(p0 + (phi - p0) * k);
        draw();
      },
    }).finished;
  }
  function go(step, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (!STEPS.includes(step)) return;
    ++token;
    tweener.cancel('reveal');
    s.reveal = 1;
    const was = s.step;
    s.step = step;
    const [lo, hi] = LIMIT[step];
    const th = clamp(step === 'amount' ? s.theta : was === 'amount' ? 50 : s.theta, lo, hi);
    s.wavesOn = step === 'surface' ? s.wavesOn : false;
    if (step !== 'surface') s.wind = animate ? s.wind : 0;
    if (animate) {
      clearLabels();
      poseTween(th, step === 'surface' ? 0 : s.phi);
      flyCamera(0.8);
    } else {
      s.theta = th;
      if (step === 'surface') s.phi = 0;
    }
    draw();
    emitChange();
  }
  /** The light falls: down to O, then it divides in three. */
  function shine() {
    const my = ++token;
    s.lit = 0.001;
    draw();
    audio.tick();
    tweener
      .animate({
        key: 'lit',
        duration: 2,
        ease: ease.linear,
        onUpdate: (k) => {
          if (my !== token) return;
          const was = s.lit;
          s.lit = Math.max(0.001, k);
          if (was < 0.5 && s.lit >= 0.5) audio.pop?.();
          draw();
        },
      })
      .finished.then((ok) => {
        if (!ok || my !== token) return;
        s.lit = 1;
        audio.success();
        draw();
        emitChange();
      });
  }
  /** The next part of the laws grows in. */
  function buildLaw(next) {
    const my = ++token;
    s.law = next;
    s.reveal = 0;
    audio.tick();
    draw();
    tweener
      .animate({
        key: 'reveal',
        duration: 0.9,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== token) return;
          s.reveal = Math.min(0.999, k);
          draw();
        },
      })
      .finished.then((ok) => {
        if (!ok || my !== token) return;
        s.reveal = 1;
        audio.success();
        draw();
        emitChange();
      });
  }
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    const ph = phase();
    if (ph === 'ev0') return shine();
    if (ph === 'ev1') return go('laws');
    if (ph === 'l0') return buildLaw(1);
    if (ph === 'l1') return buildLaw(2);
    if (ph === 'l2') return buildLaw(3);
    // a tap on a drag's button shows the move, and the student can go on by hand
    if (ph === 'l3') {
      const my = ++token;
      return poseTween(s.theta, s.phi < -14 ? 22 : -46, 1.5).then((ok) => {
        if (ok && my === token) passLaw(4);
      });
    }
    if (ph === 'l4') {
      const my = ++token;
      return poseTween(s.theta > 42 ? 30 : 62, s.phi, 1.3).then((ok) => {
        if (ok && my === token) passLaw(5);
      });
    }
    if (ph === 'l5') return go('amount');
    if (ph === 'a0') {
      const my = ++token;
      return poseTween(84, s.phi, 2.6).then((ok) => {
        if (ok && my === token) noteAmount();
      });
    }
    if (ph === 'a1') return go('surface');
    if (ph === 's0' || ph === 's1') return setWaves(!s.wavesOn);
  }
  let lastAct = -1e9;
  function setWaves(on) {
    s.wavesOn = on;
    audio.tick();
    draw();
    emitChange();
  }
  function passLaw(n) {
    if (s.law >= n) return;
    s.law = n;
    audio.success();
    draw();
    emitChange();
  }
  function noteAmount() {
    if (s.step === 'amount' && s.theta >= 80 && !s.sawGrazing) {
      s.sawGrazing = true;
      audio.success();
      draw();
      emitChange();
    }
  }

  // ── labels on the picture ──────────────────────────────────────────────────────────────────────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, note, mag.box, () => action?.ringBox()] });
  const shown = new Map();
  const pts = new Map();
  function label(id, on, text, point, color, spots, optional = false, avoid = []) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).copy(point);
    if (!shown.has(id)) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', optional, avoid });
      shown.set(id, text);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
    }
  }
  function clearLabels() {
    for (const id of [...shown.keys()]) anno.remove(id);
    shown.clear();
  }
  const screen = new THREE.Vector3();
  /** Keep labels off the rays and the normal: small boxes along the lines, in canvas pixels. */
  function lineBoxes() {
    const out = [];
    const add = (x, y, z) => {
      screen.set(x, y, z).project(camera);
      const px = ((screen.x + 1) / 2) * stage.width;
      const py = ((1 - screen.y) / 2) * stage.height;
      out.push({ left: px - 5, top: py - 5, right: px + 5, bottom: py + 5 });
    };
    const d = dia.dirs;
    for (let i = 1; i <= 10; i++) {
      const k = i * 16;
      if (s.step !== 'surface') {
        add(d.light.x * k, d.light.y * k, d.light.z * k);
        add(d.out.x * k, d.out.y * k, d.out.z * k);
      }
      if (s.step === 'laws' && s.law >= 1) add(0, k * 0.8, 0);
    }
    return out;
  }
  /** The angles' chips are fixed by the geometry: every other label steps round them. */
  function chipBoxes() {
    const out = [];
    for (const id of ['ti', 'tr', 'pct']) if (shown.has(id)) out.push(anno.box(id));
    return out.filter(Boolean);
  }
  const lineAvoid = [lineBoxes, chipBoxes];
  const chipAvoid = [chipBoxes];
  const LEFT = [
    { dx: -46, dy: -8 },
    { dx: -46, dy: 14 },
    { dx: -46, dy: -28 },
    { dx: 40, dy: -24 },
  ];
  const RIGHT = [
    { dx: 46, dy: -8 },
    { dx: 46, dy: 14 },
    { dx: 46, dy: -28 },
    { dx: -40, dy: -24 },
  ];
  const ABOVE = [
    { dx: 0, dy: -24 },
    { dx: 26, dy: -16 },
    { dx: -26, dy: -16 },
    { dx: 30, dy: 12 },
    { dx: -30, dy: 12 },
  ];
  // X wears the action's ring when it is the part to drag: its letter sits beyond the ring
  const XSPOTS = [...ABOVE, { dx: -46, dy: -6 }, { dx: 0, dy: -44 }, { dx: -40, dy: -32 }, { dx: -46, dy: 24 }];
  const BELOW = [
    { dx: -26, dy: 24 },
    { dx: 26, dy: 24 },
    { dx: 0, dy: 26 },
  ];
  const AT = [{ dx: 0, dy: 0 }];
  const PCT = [
    { dx: 12, dy: -32 },
    { dx: 12, dy: 30 },
    { dx: 46, dy: -8 },
    { dx: -40, dy: -30 },
  ];
  const tmp = new THREE.Vector3();
  const O = new THREE.Vector3();
  const along = (dir, k) => tmp.set(dir.x * k, dir.y * k, dir.z * k);
  function labels() {
    const d = dia.dirs;
    const q = s.quiz;
    const learn = !q;
    const step = s.step;
    const ev = learn && step === 'events';
    const law = learn && step === 'laws';
    const amount = learn && step === 'amount';
    const surface = learn && step === 'surface';
    const camBusy = camK < 1;
    const split = s.lit >= 1;
    const u = d.u;
    const lit = !camBusy;

    label('m1', ev && lit, t('l_m1'), tmp.set(0, 104, 0), INK, AT, true);
    label('m2', ev && lit, t('l_m2'), tmp.set(-u.x * 70, -21, -u.z * 70), '#0b4f6c', AT, true);
    label('ray', (ev || (law && s.law === 0)) && s.lit + (law ? 1 : 0) > 0 && lit, t('l_ray'), along(d.light, 66), AMBER_TEXT, LEFT, true, lineAvoid);
    label('p_reflect', ev && split, t('l_reflection'), along(d.out, 72), AMBER_TEXT, RIGHT, false, lineAvoid);
    label('p_refract', ev && split, t('l_refraction'), along(d.down, 34), '#0b4f6c', RIGHT);
    label('p_absorb', ev && split, t('l_absorption'), tmp.set(u.x * 54, -11, u.z * 54), '#7a4300', RIGHT);

    const lawsOn = law || amount;
    label('x', lawsOn && lit && (amount || s.law >= 3 || s.law === 0 || s.reveal >= 1), t('l_x'), dia.pX, AMBER_TEXT, XSPOTS, false, chipAvoid);
    label('o', law && s.law >= 1, t('l_o'), O, INK, BELOW, true);
    label('op', law && s.law === 0, t('l_op'), O, INK, BELOW);
    label(
      'lamba',
      law && s.law >= 1 && lit && s.reveal >= 1 && s.theta >= 20,
      s.law === 1 ? t('l_lamba') : t('l_normal'),
      tmp.set(0, SHEET.up - 4, 0),
      C.normal,
      [
        { dx: 0, dy: -18 },
        { dx: 30, dy: -16 },
        { dx: -30, dy: -16 },
      ],
      true,
    );
    label('plane', law && s.law >= 2 && lit && s.reveal >= 1, t('l_plane'), tmp.set(u.x * 74, -22, u.z * 74), '#33506b', AT, true);
    label('xp', law && s.law >= 3 && s.reveal >= 1, t('l_xp'), dia.pXr, AMBER_TEXT, ABOVE, false, chipAvoid);
    label('inc', law && s.law >= 2 && s.reveal >= 1 && s.theta <= 66, t('l_inc'), along(d.light, 66), AMBER_TEXT, LEFT, true, lineAvoid);
    label('ref', law && s.law >= 3 && s.reveal >= 1 && s.theta <= 66, t('l_ref'), along(d.out, 66), AMBER_TEXT, RIGHT, true, lineAvoid);
    const showAngles = law && s.law >= 3 && s.reveal >= 1;
    const mid = rad(s.theta / 2);
    const my = Math.cos(mid) * ARC;
    const mh = Math.sin(mid) * ARC;
    // inside the V where there is room, each on its own side of the normal; outside it when the angle is small
    label('ti', (showAngles || amount) && lit, t('l_ti', { a: s.theta }), chipPoint(-1), C.ti, AT);
    label('tr', showAngles, t('l_tr', { a: thetaR() }), chipPoint(1), C.tr, AT);

    label('pct', amount && lit, t('l_pct', { p: percent(s.theta) }), along(d.out, 44), AMBER_TEXT, PCT, true, [lineBoxes]);
    label('eye', amount && lit, `<span class="rl-eye">${ICONS.eye}</span>${t('l_eye')}`, dia.pXr, INK, ABOVE, true, chipAvoid);
    label('frac', amount && lit, t('l_refraction'), along(d.down, 30), '#0b4f6c', RIGHT, true);

    const rough = s.wind > 0.5;
    label('smooth', surface && lit, rough ? t('l_rough') : t('l_smooth'), tmp.set(-u.x * 62, -4, -u.z * 62 + 24), '#0b4f6c', AT, true);
    label('para', surface && lit, rough ? t('l_scatter') : t('l_parallel'), along(d.out, 92), AMBER_TEXT, RIGHT, true);

    // the test
    const qk = q?.kind;
    label('qa', qk === 'events', q?.names?.[0] ?? '', along(d.out, 62), INK, RIGHT);
    label('qb', qk === 'events', q?.names?.[1] ?? '', along(d.down, 32), INK, RIGHT);
    label('qc', qk === 'events', q?.names?.[2] ?? '', tmp.set(u.x * 54, -11, u.z * 54), INK, RIGHT);
    label('qx', qk === 'angle' || qk === 'plane', t('l_x'), dia.pX, AMBER_TEXT, ABOVE);
    label('qo', qk === 'angle' || qk === 'plane' || qk === 'amount', t('l_o'), O, INK, BELOW, true);
    label('qs', qk === 'angle', q ? t('l_surface_angle', { a: q.alpha }) : '', tmp.set(-u.x * 44, 7, -u.z * 44), INK, LEFT, false, lineAvoid);
    label(
      'qr',
      qk === 'angle',
      t('l_tr_q'),
      tmp.set(u.x * mh, my, u.z * mh),
      C.tr,
      [
        { dx: 34, dy: -32 },
        { dx: 44, dy: -12 },
      ],
      false,
      lineAvoid,
    );
    for (let i = 0; i < 4; i++) {
      const on = (qk === 'plane' || qk === 'amount') && i < (q?.letters?.length ?? 0);
      label(`qc${i}`, on, on ? q.letters[i] : '', dia.cands[i].tip, INK, ABOVE);
    }
  }
  /** Where an angle's chip goes: on its bisector inside the V, or beyond the ray when the V is too narrow. */
  function chipPoint(side) {
    const u = dia.dirs.u;
    // how many pixels one unit along the sheet is, as it is turned now
    const a = toScreen(O);
    const ax = a.x;
    const ay = a.y;
    const b = toScreen(probe.set(u.x * 20, 0, u.z * 20));
    const pxU = Math.max(0.2, Math.hypot(b.x - ax, b.y - ay) / 20);
    const chip = CHIP_W / pxU;
    const gap = 7 / pxU;
    const ray = Math.tan(rad(s.theta)) * CHIP_H; // the ray's distance from the normal, at the chips' height
    const d = ray >= chip + 2 * gap ? Math.min(ray / 2, chip / 2 + gap) : ray + chip / 2 + gap;
    return tmp.set(side * u.x * d, CHIP_H, side * u.z * d);
  }
  const thetaR = () => Math.round(angleToNormal(reflected(s.theta, s.phi), { x: 0, y: 1, z: 0 }));

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  function outcome() {
    if (s.step === 'events') return s.lit >= 1 ? t('out_ev1') : t('out_ev0');
    if (s.step === 'laws') {
      if (s.law < 3 || (s.law === 3 && s.reveal < 1)) return t(`out_l${Math.min(2, s.law)}`);
      return t('out_angles', { a: s.theta, b: thetaR() });
    }
    if (s.step === 'amount') return t('out_amount', { a: s.theta, p: percent(s.theta) });
    return s.wind > 0.5 ? t('out_wavy', { d: Math.max(1, Math.round(s.spread / 2) * 2) }) : t('out_smooth');
  }
  function rule() {
    if (s.step === 'events') return s.lit >= 1 ? t('rule_ev1') : t('rule_ev0');
    if (s.step === 'laws') return t(`rule_l${s.law}`);
    if (s.step === 'amount')
      return `${s.sawGrazing ? t('rule_a1', { w: percent(0), g1: 4, g2: 5, h1: 80, h2: 90 }) : t('rule_a0')}${fresnelGraph(s.theta, t)}`;
    return s.wind > 0.5 ? t('rule_s1') : t('rule_s0');
  }
  const ACTIONS = {
    ev0: ['act_light', 1, ICONS.hand],
    ev1: ['act_next', '', ICONS.chevR],
    busy: ['act_wait', '', ICONS.hand],
    l0: ['act_normal', 1, ICONS.hand],
    l1: ['act_plane', 2, ICONS.hand],
    l2: ['act_reflect', 3, ICONS.hand],
    l3: ['act_swing', 4, ICONS.drag],
    l4: ['act_tilt', 5, ICONS.drag],
    l5: ['act_next', '', ICONS.chevR],
    a0: ['act_raise', 1, ICONS.drag],
    a1: ['act_next', '', ICONS.chevR],
    s0: ['act_waves', 1, ICONS.hand],
    s1: ['act_calm', '', ICONS.hand],
  };
  function panel() {
    if (s.quiz) return;
    sheet.outcome(outcome());
    sheet.rule(rule());
    sheet.choose(s.step);
    const ph = phase();
    sheet.next(ph === 'ev1' ? 'laws' : ph === 'l5' ? 'amount' : ph === 'a1' ? 'surface' : null);
    root.dataset.step = s.step;
    const [label_, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${label_}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: label_, step, enabled, icon });
    }
    note.textContent = s.step === 'amount' ? t('note_amount') : t('note_rays');
    const wantMag = s.step === 'surface' && s.wind > 0.02;
    if (wantMag === mag.box.hidden) mag.show(wantMag);
  }
  function draw() {
    applyWorld();
    panel();
    if (s.step === 'surface') mag.draw(s.theta, dia.dirs.u.x, dia.dirs.u.z, s.time, s.wind);
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  const ringPoint = new THREE.Vector3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_light',
    target: () => {
      if (s.locked || camK < 1) return null;
      const ph = phase();
      if (ph === 'l3') return ringPoint.copy(dia.pS);
      if (ph === 'l4' || ph === 'a0') return ringPoint.copy(dia.pX);
      if (ph === 'ev0' || ph === 'l0' || ph === 'l1' || ph === 'l2') return ringPoint.set(0, 0, 0);
      if (ph === 's0') return ringPoint.set(0, 0, 0);
      return null;
    },
    radius: 26,
    avoid: [ui.corner, ui.hint, note, mag.box, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── dragging X and the disc; a tap on O ────────────────────────────────────────────────────────────────
  const ptr = new THREE.Vector3();
  const probe = new THREE.Vector3();
  function toScreen(p) {
    ptr.copy(p).project(camera);
    return { x: ((ptr.x + 1) / 2) * stage.width, y: ((1 - ptr.y) / 2) * stage.height };
  }
  function grabAt(x, y, touch) {
    const reach = touch ? 40 : 28;
    const near = (p, r = reach) => {
      const a = toScreen(p);
      return Math.hypot(a.x - x, a.y - y) <= r;
    };
    if (s.locked) return null;
    if (grabbable('phi') && near(dia.pS)) return 'phi';
    if (grabbable('theta') && near(dia.pX)) return 'theta';
    return null;
  }
  let down = null;
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      const p = hostXY(e);
      down = { x: p.x, y: p.y, at: performance.now() };
      const what = grabAt(p.x, p.y, e.pointerType === 'touch');
      if (!what) return;
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      ++token;
      tweener.cancel('pose');
      s.drag = { what, id: e.pointerId, x: p.x, y: p.y, theta: s.theta, phi: s.phi, moved: 0 };
      action.hide('drag');
      audio.unlock();
      emit('dragstart', { part: what });
      e.preventDefault();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    g.moved = Math.max(g.moved, Math.hypot(dx, dy));
    if (g.what === 'phi') {
      // the finger turns the sheet like a page: to the left brings the disc round toward the viewer
      const next = clamp(Math.round(g.phi - dx * (140 / Math.max(240, stage.width))), PHI[0], PHI[1]);
      if (next !== s.phi) {
        s.phi = next;
        audio.tick?.();
        draw();
        emitChange();
      }
      return;
    }
    // along the way X moves on the screen at this moment: stable even while the camera moves with it
    const a = toScreen(dirPoint(g.theta));
    const b = toScreen(dirPoint(g.theta + 1));
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const l2 = Math.max(0.01, tx * tx + ty * ty);
    const [lo, hi] = LIMIT[s.step];
    const next = clamp(Math.round(g.theta + (dx * tx + dy * ty) / l2), lo, hi);
    if (next !== s.theta) {
      s.theta = next;
      draw();
      emitChange();
      noteAmount();
    }
  });
  const dirV = new THREE.Vector3();
  function dirPoint(theta) {
    const l = toLight(theta, s.phi);
    return dirV.set(l.x, l.y, l.z).multiplyScalar(L);
  }
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = !s.locked;
    action.show('drag');
    emit('dragend', { part: g.what });
    if (g.moved > 6 && s.step === 'laws') {
      if (g.what === 'phi' && s.law === 3 && Math.abs(s.phi - g.phi) >= 6) passLaw(4);
      if (g.what === 'theta' && s.law === 4 && Math.abs(s.theta - g.theta) >= 3) passLaw(5);
    }
    noteAmount();
  }
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const wasDrag = Boolean(s.drag);
    endDrag(e);
    if (wasDrag || !down) return;
    const p = hostXY(e);
    const moved = Math.hypot(p.x - down.x, p.y - down.y);
    const quick = performance.now() - down.at < 500;
    down = null;
    if (moved > 8 || !quick || s.mode === 'quiz') return;
    // a tap on O does what the button says, while the button is a tap
    const a = toScreen(O);
    const ph = phase();
    if (Math.hypot(a.x - p.x, a.y - p.y) < 44 && ['ev0', 'l0', 'l1', 'l2', 's0', 's1'].includes(ph)) act();
  });
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  const LETTERS = t('letters').split(',');
  function applyQuiz(q) {
    dia.showO(true);
    if (q.kind === 'events') {
      dia.drawIncident();
      dia.drawReflected();
      dia.drawRefracted();
      dia.drawAbsorbed();
    } else if (q.kind === 'angle') {
      dia.drawIncident();
      dia.drawReflected();
      dia.drawNormal();
      dia.sheet(0.8);
      dia.drawSurfaceAngle(s.theta);
      dia.drawAngles(s.theta, 'r');
      dia.showX(true);
      dia.knobX.visible = true;
    } else if (q.kind === 'plane') {
      dia.drawIncident();
      dia.drawNormal();
      dia.sheet(1);
      dia.showX(true);
      q.rays.forEach((r, i) => dia.candidate(i, r));
    } else if (q.kind === 'amount') {
      dia.drawNormal();
      dia.sheet(0.7);
      q.rays.forEach((r, i) => dia.candidateIn(i, r));
    } else if (q.kind === 'rough') {
      s.spread = dia.drawBundle(s.time, s.wind);
    }
  }
  function quizScene(q, { theta = 50, phi = 0, waves = false } = {}) {
    ++token;
    tweener.cancel('pose');
    tweener.cancel('reveal');
    tweener.cancel('lit');
    s.theta = theta;
    s.phi = phi;
    s.wavesOn = waves;
    s.wind = waves ? 1 : 0;
    s.quiz = q;
    clearLabels();
    mag.show(false);
    applyWorld();
    stage.invalidate();
  }
  const notesOf = (pairs) => new Map(pairs.map(([v, html]) => [String(v), html]));
  let order = [];
  let qCurrent = null;
  function prepare(i) {
    const kind = order[i];
    if (kind === 'events') {
      // the three lines get the letters ক, খ, গ in a shuffled order; which event is asked is chosen too
      const letters = shuffle([0, 1, 2]);
      const asked = Math.floor(Math.random() * 3);
      const names = letters.map((k) => `<b>${LETTERS[k]}</b>`);
      quizScene({ kind, names });
      const L3 = (k) => (k === 3 ? t('c_none') : t('c_letter', { x: LETTERS[k] }));
      const answer = letters[asked];
      const wrong = [0, 1, 2].filter((k) => k !== answer);
      return {
        text: t(`q_events_${asked}`),
        answer,
        wrong: [...wrong, 3],
        label: L3,
        notes: notesOf([...wrong.map((k) => [k, t(`n_events_${asked}`)]), [3, t('n_events_none')]]),
        reveal: t(`a_events_${asked}`, { x: LETTERS[answer] }),
      };
    }
    if (kind === 'angle') {
      const alpha = [30, 35, 40, 25][Math.floor(Math.random() * 4)];
      const theta = 90 - alpha;
      quizScene({ kind, alpha }, { theta });
      const u = (x) => `${N(x)}°`;
      const wrong = [alpha, 2 * theta > 90 ? 2 * theta : 2 * alpha, 90];
      return {
        text: t('q_angle', { a: alpha }),
        answer: theta,
        wrong,
        label: u,
        notes: notesOf([
          [wrong[0], t('n_angle_surface')],
          [wrong[1], t('n_angle_double')],
          [wrong[2], t('n_angle_right')],
        ]),
        reveal: t('a_angle', { a: alpha, b: theta, r: 90 }),
      };
    }
    if (kind === 'plane') {
      // four rays leave O: the real one, one out of the plane, one at a wrong angle, one back on X's side
      const theta = 48;
      const phi = 8;
      const real = reflected(theta, phi);
      const off = reflected(theta, phi + 42);
      const angle = reflected(theta - 26, phi);
      const l = toLight(theta - 22, phi);
      const kinds = shuffle(['real', 'off', 'angle', 'back']);
      const ray = { real, off, angle, back: l };
      const rays = kinds.map((k) => ray[k]);
      quizScene({ kind, rays, letters: kinds.map((_, k) => `<b>${LETTERS[k]}</b>`) }, { theta, phi });
      const answer = kinds.indexOf('real');
      const wrong = [0, 1, 2, 3].filter((k) => k !== answer);
      return {
        text: t('q_plane'),
        answer,
        wrong,
        label: (k) => t('c_ray', { x: LETTERS[k] }),
        notes: notesOf(wrong.map((k) => [k, t(`n_plane_${kinds[k]}`)])),
        reveal: t('a_plane', { x: LETTERS[answer] }),
      };
    }
    if (kind === 'amount') {
      const angles = shuffle([18, 50, 82]);
      const rays = angles.map((a) => toLight(a, 0));
      const best = angles.indexOf(82);
      quizScene({ kind, rays, letters: angles.map((_, k) => `<b>${LETTERS[k]}</b>`) }, { theta: 50 });
      const wrong = [0, 1, 2].filter((k) => k !== best);
      return {
        text: t('q_amount'),
        answer: best,
        wrong: [...wrong, 3],
        label: (k) => (k === 3 ? t('c_same') : t('c_ray', { x: LETTERS[k] })),
        notes: notesOf([...wrong.map((k) => [k, t('n_amount_small')]), [3, t('n_amount_same')]]),
        reveal: t('a_amount', { x: LETTERS[best], p: percent(82) }),
      };
    }
    quizScene({ kind }, { theta: 50, waves: true });
    const words = [t('c_rough_ok'), t('c_rough_law'), t('c_rough_absorb'), t('c_rough_light')];
    return {
      text: t('q_rough'),
      answer: 0,
      wrong: [1, 2, 3],
      label: (x) => words[x],
      notes: notesOf([
        [1, t('n_rough_law')],
        [2, t('n_rough_absorb')],
        [3, t('n_rough_light')],
      ]),
      reveal: t('a_rough'),
    };
  }
  const saved = { theta: 50, phi: 0, step: 'events' };
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
        s.mode = 'quiz';
        s.locked = true;
        Object.assign(saved, { theta: s.theta, phi: s.phi, step: s.step });
        // the book's order: no scene shows the answer to a later question
        order = ['events', 'angle', 'plane', 'amount', 'rough'];
        if (s.drag) {
          controls.enabled = true;
          s.drag = null;
          action.show('drag');
        }
        clearLabels();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        clearLabels();
        s.wavesOn = false;
        s.wind = 0;
        s.theta = saved.theta;
        s.phi = saved.phi;
        syncUI();
        flyCamera(0.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = prepare(i);
        qCurrent = q;
        say(q.text);
        const done = await flyCamera(0.5);
        if (!alive()) return null;
        if (!done) camK = 1;
        const out = [q.answer];
        for (const w of q.wrong) if (out.length < 4 && !out.includes(w)) out.push(w);
        return { choices: shuffle(out), expected: q.answer, tolerance: 1e-6, label: q.label, meta: { kind: order[i] } };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        const why = !correct && picked ? q.notes.get(String(picked.value)) : '';
        return `${q.reveal}${why ? ` <span class="rl-why">${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────────────────────────────────
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
  let hintTimer = 0;
  function hint(text) {
    ui.hintText.innerHTML = text;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => ui.hint.classList.remove('show'), 3200);
  }
  function lockedNudge() {
    hint(t('q_locked'));
    audio.error();
  }
  function home() {
    if (s.locked) return lockedNudge();
    ++token;
    for (const k of ['pose', 'lit', 'reveal']) tweener.cancel(k);
    s.reveal = 1;
    if (s.step === 'events') s.lit = 0;
    if (s.step === 'laws') s.law = 0;
    if (s.step === 'amount') s.sawGrazing = false;
    s.wavesOn = false;
    s.theta = 50;
    s.phi = 0;
    clearLabels();
    if (s.view === '3d') setView('front');
    else flyCamera(0.5);
    draw();
    emitChange();
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  let lastTap = { what: '', at: 0 };
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    const what = b.dataset.act || b.dataset.example || '';
    const now = performance.now();
    if (what && what === lastTap.what && now - lastTap.at < 120) return;
    lastTap = { what, at: now };
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) go(b.dataset.example);
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'home') home();
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const dTheta = { ArrowRight: 2, ArrowLeft: -2 }[e.key];
    const dPhi = { ArrowUp: 3, ArrowDown: -3 }[e.key];
    if (dTheta || dPhi) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (dTheta && grabbable('theta')) {
        const [lo, hi] = LIMIT[s.step];
        const was = s.theta;
        s.theta = clamp(s.theta + dTheta, lo, hi);
        if (s.law === 4 && s.step === 'laws' && s.theta !== was) passLaw(5);
        noteAmount();
      }
      if (dPhi && grabbable('phi')) {
        s.phi = clamp(s.phi + dPhi, PHI[0], PHI[1]);
        if (s.law === 3) passLaw(4);
      }
      draw();
      emitChange();
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      act();
    }
  });
  function grabbable(what) {
    if (what === 'phi') return s.step === 'laws' && s.law >= 3 && s.reveal >= 1;
    return (s.step === 'laws' && s.law >= 3 && s.reveal >= 1) || s.step === 'amount' || s.step === 'surface';
  }

  // ── state for the book ──────────────────────────────────────────────────────────────────────────────────
  function snapshot() {
    const r = reflected(s.theta, s.phi);
    const up = { x: 0, y: 1, z: 0 };
    return {
      step: s.step,
      law: s.law,
      lit: s.lit >= 1,
      theta: s.theta,
      thetaR: +angleToNormal(r, up).toFixed(6),
      phi: s.phi,
      inPlane: offPlane(r, sheetNormal(s.phi)) < 1e-9,
      reflected: +(fresnel(s.theta, N_WATER) * 100).toFixed(1),
      refraction: +snell(s.theta).toFixed(1),
      waves: s.wavesOn,
      wind: +s.wind.toFixed(2),
      spread: +s.spread.toFixed(1),
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.step, snap.law, snap.lit, snap.theta, snap.phi, snap.waves]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  syncUI();
  setView(s.view, { animate: false });
  if (s.law > 0 && s.step === 'events') s.step = 'laws';
  draw();
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
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) setView(p.view, { animate });
      if (p.step) go(p.step, { animate });
      if (p.law != null) {
        ++token;
        tweener.cancel('reveal');
        s.step = 'laws';
        s.law = clamp(Number(p.law), 0, 5);
        s.reveal = 1;
      }
      if (p.lit != null) {
        ++token;
        tweener.cancel('lit');
        s.step = 'events';
        s.lit = p.lit ? 1 : 0;
      }
      if (p.theta != null) {
        const [lo, hi] = LIMIT[s.step];
        tweener.cancel('pose');
        s.theta = clamp(Math.round(Number(p.theta)), lo, hi);
        noteAmount();
      }
      if (p.phi != null) {
        tweener.cancel('pose');
        s.phi = clamp(Math.round(Number(p.phi)), PHI[0], PHI[1]);
      }
      if (p.waves != null) {
        s.wavesOn = Boolean(p.waves);
        if (s.step !== 'surface') go('surface', { animate: false });
        if (!animate) s.wind = s.wavesOn ? 1 : 0;
      }
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      ++token;
      for (const k of ['pose', 'lit', 'reveal']) tweener.cancel(k);
      Object.assign(s, {
        step: 'events',
        law: 0,
        lit: 0,
        theta: 50,
        phi: 0,
        wavesOn: false,
        wind: 0,
        reveal: 1,
        sawGrazing: false,
        spread: 0,
      });
      clearLabels();
      setView('front', { animate: false });
      camK = 1;
      draw();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture(opts = {}) {
      return stage.capture(opts);
    },
    exportRoot() {
      // the mountain lake, with the book's picture on it: XO, the normal, OX′
      const g = new THREE.Group();
      g.name = 'reflection-laws';
      g.add(lake.exportModel());
      const up = new THREE.Vector3(0, 1, 0);
      const l = toLight(s.theta, s.phi);
      const r = reflected(s.theta, s.phi);
      const ray = (name, color, from, dir, length) => {
        const a = createArrow({ color, radius: 1.2, head: 8, headRadius: 3.6, name });
        a.set(from, dir, length);
        g.add(a.root);
      };
      ray('incident-ray-XO', C.ray, new THREE.Vector3(l.x, l.y, l.z).multiplyScalar(L), new THREE.Vector3(-l.x, -l.y, -l.z), L);
      ray('reflected-ray-OX', C.ray, new THREE.Vector3(), new THREE.Vector3(r.x, r.y, r.z), L);
      ray('normal', C.normal, new THREE.Vector3(0, -SHEET.down, 0), up, SHEET.up + SHEET.down);
      return g;
    },
  };
}
