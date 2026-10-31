// Pascal's law (book pages 140–141, topic 5.3.3), student view. A hydraulic car lift in a colourful workshop, cut open
// along its middle so the amber oil shows: a small pump cylinder (A₁) with a T-handle, a pipe, and a wide lift
// cylinder (A₂ = 10, 50 or 100 × A₁) whose ram carries a platform with a yellow car (weight W). One tap pushes the
// handle down 10 cm with the force F₁: the oil's pressure P = F₁/A₁ shows as equal red arrows square to every wall and
// both pistons, and the big piston pushes up with F₂ = PA₂ = F₁(A₂/A₁). If F₂ is more than W the car rises, but only
// d₂ = d₁(A₁/A₂) (1 mm for 100 ×): the first time, the camera goes close to the oil, then to a millimetre scale on the
// lift cylinder. The next taps push the handle 100 times (the car rises a little each time) and the rule says the
// book's caveat: it multiplies force, not energy (F₁d₁ = F₂d₂). The student changes F₁ with a stepper and A₂/A₁ with
// the row of words, and the formula updates live. Then a five-question test. Built on the shared student kit.
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
import { createGarage } from './garage.js';
import { GEO, RULER0, createLift, r2For } from './lift.js';
import {
  A1,
  BATCH,
  F_LIMITS,
  F_START,
  QUIZ_FORCES,
  QUIZ_STROKES,
  RATIOS,
  RATIO_START,
  RISE_MAX,
  STROKE,
  W,
  area2,
  distance,
  fixForce,
  fixRatio,
  force2,
  force2Choices,
  groupBD,
  groupIntl,
  lifts,
  pressure,
  pressureChoices,
  pushesLeft,
  rise,
  riseChoices,
  round,
  work,
  workChoices,
} from './reading.js';

export const DEFAULTS = {
  F1: F_START, // the push on the handle (N)
  ratio: RATIO_START, // A₂/A₁
  phase: 'ready', // 'ready' | 'pushed': start with the handle up, or pushed once
  look: 'all', // 'all' | 'inside' | 'rim': the whole lift, the oil close up, the scale on the lift cylinder
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { F: '#f76707', P: '#e03131', W: '#7048e8', A: '#0c8599', d: '#1c6fd9' };
const LOOKS = ['all', 'inside', 'rim'];
const F1_LEN = 0.0009; // m of the F₁ arrow per newton (100 N → 9 cm)
const F2_LEN = 0.000015; // m of the F₂ and W arrows per newton (10,000 N → 15 cm): a smaller scale, said on the stage
const P_LEN = 0.07; // every pressure arrow: the same length (the pressure is the same everywhere)
const ZA = 0.006; // the arrows on the cut face are this far in front of it
const PUSH_S = 1.4; // s for one push
const STUCK_S = 0.9;
const BOB_S = 0.2; // s for one visible stroke while pumping many times (sped up: each stands for PER_BOB pushes)
const PER_BOB = 4;
const LOWER_S = 1.6;
const TOUR_HOLD = 2.8;
const DOUBLE_TAP = 450; // ms
const NBSP = ' ';
const MARGIN = { top: 50, bottom: 12, side: 6 };
const UPV = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const G = (x) => N(t.lang === 'bn' ? groupBD(x) : groupIntl(x)); // Bangladeshi commas in Bangla (১০,০০০)
  const D = (m) => {
    const { v, u } = distance(m);
    return `${N(v)}${NBSP}${t(`u_${u}`)}`;
  };

  root.classList.add('pvc', 'pl');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'ratios', results: false, items: RATIOS.map((k) => ({ id: String(k), label: `chip_${k}` })) },
      quiet: [
        { act: 'inside', label: 'act_inside', icon: ICONS.eye },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  for (const b of sheet.words) {
    const k = Number(b.dataset.example);
    const word = /** @type {HTMLElement} */ (b.querySelector('.pvc-ex-word'));
    word.innerHTML = t('chip', { k: N(k) });
    b.setAttribute('aria-label', `A₂/A₁ = ${k}`);
  }

  // the formula: the push's stepper, P = F₁/A₁ = F₂/A₂ with each symbol a button, then the sums with the numbers
  const eq = document.createElement('div');
  eq.className = 'pl-eq';
  const term = (k, html, cls) => `<button type="button" class="pl-term ${cls}" data-term="${k}">${html}</button>`;
  eq.innerHTML = `
    <div class="pl-top">
      <div class="pl-step">
        <span class="pl-name"><b class="c-F">${t('s_F1')}</b> <span>${t('name_F1')}</span></span>
        <span class="pl-ctl">
          <button type="button" class="pl-pm" data-step="F" data-dir="-1" aria-label="${t('less_F')}">${ICONS.minus}</button>
          <output class="pl-val" data-val="F" aria-live="polite"></output>
          <span class="pl-unit">N</span>
          <button type="button" class="pl-pm" data-step="F" data-dir="1" aria-label="${t('more_F')}">${ICONS.plus}</button>
        </span>
      </div>
      <div class="pl-law" role="group" aria-label="${t('law_label')}">
        ${term('P', t('s_P'), 'c-P')}<span class="pl-op">=</span><span class="pl-frac">${term('F1', t('s_F1'), 'c-F')}${term('A1', t('s_A1'), 'c-A')}</span><span class="pl-op">=</span><span class="pl-frac">${term('F2', t('s_F2'), 'c-F')}${term('A2', t('s_A2'), 'c-A')}</span>
      </div>
    </div>
    <div class="pl-sums">
      <div class="pl-sum" data-sum="P"></div>
      <div class="pl-sum pl-f2"><span data-sum="F2"></span><span class="pl-cmp"></span></div>
      <div class="pl-sum pl-w" data-sum="W"></div>
    </div>`;
  $('.pvc-act-row').after(eq);

  // notes on the stage: the cut and the scale (top left; the buttons are top right), what the arrows mean (bottom)
  const notes = document.createElement('div');
  notes.className = 'pl-notes';
  const cutNote = document.createElement('div');
  cutNote.className = 'pl-note';
  notes.append(cutNote);
  const arrowNote = document.createElement('div');
  arrowNote.className = 'pl-note pl-note-low';
  ui.stage.append(notes, arrowNote);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.004, far: 60, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.05;
  controls.maxDistance = 12;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minPolarAngle = 0.4;
  controls.maxPolarAngle = Math.PI * 0.52;
  if (o.bg !== 'transparent') scene.background = new THREE.Color('#0d5966');
  scene.add(new THREE.HemisphereLight('#fff1d6', '#3a4a5c', 0.85));
  const sun = new THREE.DirectionalLight('#ffe7c4', 2.0);
  sun.position.set(-1.6, 3.4, 2.6);
  sun.target.position.set(0.2, 0.5, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe6ff', 0.55);
  fill.position.set(2.4, 1.4, 3);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -1, near: 1, far: 9 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.01;
  }
  if (o.bg !== 'transparent') scene.add(createGarage().root);
  const lift = createLift({ ratios: RATIOS, num: N });
  scene.add(lift.root);

  // ── arrows and marks ────────────────────────────────────────────────────────
  // the forces: thick, flat colour in a white outline with a dark rim, drawn over the scenery
  const flat = (color, extra = {}) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false, ...extra });
  const OUT_FROM = new THREE.Vector3();
  function boldArrow(name, color, r) {
    const core = createArrow({ name, radius: r, head: r * 4.6, headRadius: r * 2.6, material: flat(color) });
    const pads = [
      { pad: r * 0.75, color: '#ffffff', order: 20 },
      { pad: r * 1.3, color: '#1b1e24', order: 19 },
    ].map(({ pad, color: c, order }) => {
      const a = createArrow({ name: `${name}Outline`, radius: r + pad, head: r * 4.6 + pad * 2.8, headRadius: r * 2.6 + pad * 2, material: flat(c) });
      core.root.add(a.root);
      a.root.renderOrder = order;
      for (const m of a.root.children) m.renderOrder = order;
      return { a, pad };
    });
    core.root.renderOrder = 21;
    for (const m of core.root.children) m.renderOrder = 21;
    core.root.userData.noExport = true;
    scene.add(core.root);
    return {
      ...core,
      set(from, dir, length) {
        core.set(from, dir, length);
        for (const { a, pad } of pads) {
          OUT_FROM.set(0, -pad, 0);
          if (length > 1e-9) a.set(OUT_FROM, UPV, length + pad * 2.2);
          else a.hide();
        }
      },
    };
  }
  const arrows = { F1: boldArrow('ForceF1', COLORS.F, 0.011), F2: boldArrow('ForceF2', COLORS.F, 0.016), W: boldArrow('WeightW', COLORS.W, 0.016) };

  // the pressure: flat arrows on the cut face, all P_LEN long, tip on the wall or piston they press on
  const pGeo = (() => {
    const head = 0.028;
    const hw = 0.017;
    const sw = 0.0065;
    const core = new THREE.Shape([
      new THREE.Vector2(0, -sw),
      new THREE.Vector2(P_LEN - head, -sw),
      new THREE.Vector2(P_LEN - head, -hw),
      new THREE.Vector2(P_LEN, 0),
      new THREE.Vector2(P_LEN - head, hw),
      new THREE.Vector2(P_LEN - head, sw),
      new THREE.Vector2(0, sw),
    ]);
    const p = 0.0055;
    const pad = new THREE.Shape([
      new THREE.Vector2(-p, -sw - p),
      new THREE.Vector2(P_LEN - head - p * 0.4, -sw - p),
      new THREE.Vector2(P_LEN - head - p * 0.4, -hw - p * 1.6),
      new THREE.Vector2(P_LEN + p * 1.9, 0),
      new THREE.Vector2(P_LEN - head - p * 0.4, hw + p * 1.6),
      new THREE.Vector2(P_LEN - head - p * 0.4, sw + p),
      new THREE.Vector2(-p, sw + p),
    ]);
    // the arrow points along +x with its tip at the origin
    return { core: new THREE.ShapeGeometry(core).translate(-P_LEN, 0, 0), pad: new THREE.ShapeGeometry(pad).translate(-P_LEN, 0, 0) };
  })();
  const pCore = flat(COLORS.P, { depthTest: true });
  const pPad = flat('#ffffff', { depthTest: true });
  const pArrows = new THREE.Group();
  pArrows.name = 'PressureArrows';
  pArrows.userData.noExport = true;
  scene.add(pArrows);
  const P_COUNT = 18;
  const pList = Array.from({ length: P_COUNT }, () => {
    const g = new THREE.Group();
    const pad = new THREE.Mesh(pGeo.pad, pPad);
    const core = new THREE.Mesh(pGeo.core, pCore);
    pad.renderOrder = 10;
    core.renderOrder = 11;
    core.position.z = 0.0004;
    g.add(pad, core);
    g.visible = false;
    pArrows.add(g);
    return g;
  });

  // the areas: a teal bar under each piston's face; the distances: blue brackets with end ticks
  const tealMat = flat(COLORS.A, { depthTest: true });
  const bar = (name) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), tealMat);
    m.name = name;
    m.renderOrder = 12;
    m.userData.noExport = true;
    scene.add(m);
    return m;
  };
  const areaBars = { A1: bar('AreaA1'), A2: bar('AreaA2') };
  const blueMat = flat(COLORS.d);
  const whiteMat = flat('#ffffff');
  function bracket(name) {
    const g = new THREE.Group();
    g.name = name;
    g.userData.noExport = true;
    const mk = (mat, order) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      m.renderOrder = order;
      g.add(m);
      return m;
    };
    const parts = { pads: [mk(whiteMat, 22), mk(whiteMat, 22), mk(whiteMat, 22)], cores: [mk(blueMat, 23), mk(blueMat, 23), mk(blueMat, 23)] };
    g.visible = false;
    scene.add(g);
    return {
      root: g,
      /** A vertical bracket at x from y0 to y1 (z in front), line w wide, ticks tw long. */
      set(x, y0, y1, z, w, tw) {
        g.visible = true;
        const lo = Math.min(y0, y1);
        const hi = Math.max(y0, y1);
        const lines = [
          [x, (lo + hi) / 2, w, hi - lo + w],
          [x, lo, tw, w],
          [x, hi, tw, w],
        ];
        lines.forEach(([cx, cy, sx, sy], i) => {
          parts.cores[i].position.set(cx, cy, z + 0.0002);
          parts.cores[i].scale.set(sx, sy, 1);
          parts.pads[i].position.set(cx, cy, z);
          parts.pads[i].scale.set(sx + w * 1.2, sy + w * 1.2, 1);
        });
      },
      hide() {
        g.visible = false;
      },
    };
  }
  const marks = { d1: bracket('StrokeD1'), d2: bracket('RiseD2') };

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
    F1: fixForce(o.F1),
    ratio: fixRatio(o.ratio),
    phase: 'ready', // 'ready' | 'push' | 'pushed' | 'stuck' | 'pump' | 'pumped' | 'top' | 'lower'
    h: 0, // how far the car has risen (m)
    hView: 0, // the car's height the whole-lift view makes room for (where this action ends)
    y1: GEO.Y1HIGH, // the small piston's bottom
    pushes: 0, // pushes since the car was down
    count: 0, // pushes so far in a run of many
    last: null, // the last action's { n, D (handle travel), d (rise), h0 }
    look: LOOKS.includes(o.look) ? o.look : 'all',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    found: { push: false, stuck: false, pump: false, ratios: new Set() },
    show: { F1: true, F2: true, W: true, P: true, A: true, d: true, Pval: true, Pbig: true }, // the test hides some
    focus: null,
    focusAt: 0,
    userMovedCamera: false,
    run: 0, // a token: every new push, pump, tour, change or reset bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  const P = () => pressure(s.F1);
  const F2 = () => force2(s.F1, s.ratio);
  const pressing = () => ['push', 'pushed', 'stuck', 'pump', 'pumped', 'top'].includes(s.phase);
  const busy = () => ['push', 'pump', 'lower'].includes(s.phase);

  // ── the scene from the state ────────────────────────────────────────────────
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  let pxSize = 0.004; // metres per screen pixel at the lift (set from the camera)
  function measure() {
    const d = camera.position.distanceTo(controls.target);
    pxSize = (2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  function syncScene() {
    lift.setSmall(s.y1);
    lift.setRise(s.h);
    layoutMarks();
    stage.invalidate();
  }

  /** Where each pressure arrow goes: { x, y, angle } of its tip, the angle it points in (radians from +x). */
  function pressureSpots() {
    const { xS, xB, r1, YB, PIPE } = GEO;
    const r2 = lift.r2;
    const y1 = s.y1;
    const y2 = GEO.Y2LOW + s.h;
    const R = 0;
    const L = Math.PI;
    const U = Math.PI / 2;
    const Dn = -Math.PI / 2;
    const pipe0 = xS + r1;
    const pipe1 = xB - r2;
    const spots = [
      // the small cylinder: both walls, its floor, under the piston
      { x: xS - r1, y: PIPE + (y1 - PIPE) * 0.3, a: L },
      { x: xS - r1, y: PIPE + (y1 - PIPE) * 0.72, a: L },
      { x: xS + r1, y: PIPE + (y1 - PIPE) * 0.5, a: R },
      { x: xS + r1, y: PIPE + (y1 - PIPE) * 0.9, a: R },
      { x: xS - r1 * 0.2, y: YB, a: Dn },
      { x: xS + r1 * 0.35, y: y1, a: U },
      // the pipe: top and bottom
      { x: pipe0 + (pipe1 - pipe0) * 0.3, y: PIPE, a: U },
      { x: pipe0 + (pipe1 - pipe0) * 0.72, y: PIPE, a: U },
      { x: pipe0 + (pipe1 - pipe0) * 0.12, y: YB, a: Dn },
      { x: pipe0 + (pipe1 - pipe0) * 0.52, y: YB, a: Dn },
      { x: pipe0 + (pipe1 - pipe0) * 0.9, y: YB, a: Dn },
      // the lift cylinder: both walls, its floor, under the piston
      { x: xB - r2, y: PIPE + (y2 - PIPE) * 0.55, a: L },
      { x: xB + r2, y: YB + (y2 - YB) * 0.35, a: R },
      { x: xB + r2, y: YB + (y2 - YB) * 0.78, a: R },
      { x: xB - r2 * 0.35, y: YB, a: Dn },
      { x: xB + r2 * 0.4, y: YB, a: Dn },
      { x: xB - r2 * 0.55, y: y2, a: U },
      { x: xB + r2 * 0.1, y: y2, a: U },
    ];
    return spots;
  }

  function layoutMarks() {
    measure();
    const on = pressing();
    const { xS, xB, r1, Y1HIGH, P1H, ROD1 } = GEO;
    const r2 = lift.r2;
    // F₁ down onto the handle's knob, F₂ up from the big piston along the ram, W down from the car's middle
    const hy = lift.handleY();
    const L1 = s.F1 * F1_LEN;
    if (on && s.show.F1) arrows.F1.set(tmpA.set(xS, hy + 0.03 + L1, 0.05), DOWN, L1);
    else arrows.F1.hide();
    // F₂ pushes the platform up from below, W pushes it down from above: they meet at the platform, side by side
    // on one scale, so the longer one wins
    const v = lift.variant();
    const ax = xB - v.rodR - 0.05;
    const under = lift.platTop() - GEO.PLAT_H - 0.006;
    const L2 = F2() * F2_LEN;
    if (on && s.show.F2) arrows.F2.set(tmpA.set(ax, under - L2, 0.2), UPV, L2);
    else arrows.F2.hide();
    const LW = W * F2_LEN;
    if (s.show.W) arrows.W.set(tmpA.set(ax, lift.platTop() + 0.008 + LW, GEO.CAR_W / 2 + 0.08), DOWN, LW);
    else arrows.W.hide();
    // the pressure arrows
    const spots = on && s.show.P ? pressureSpots() : [];
    pList.forEach((g, i) => {
      const sp = spots[i];
      g.visible = Boolean(sp);
      if (!sp) return;
      g.position.set(sp.x, sp.y, ZA);
      g.rotation.z = sp.a;
    });
    // the areas: under each piston's face
    const bw = Math.max(0.006, 3 * pxSize);
    areaBars.A1.visible = s.show.A;
    areaBars.A1.position.set(xS, s.y1 - bw / 2, ZA - 0.002);
    areaBars.A1.scale.set(2 * r1, bw, 1);
    areaBars.A2.visible = s.show.A;
    areaBars.A2.position.set(xB, GEO.Y2LOW + s.h - bw / 2, ZA - 0.002);
    areaBars.A2.scale.set(2 * r2, bw, 1);
    // the distances: the handle's way down (left of the handle), the car's way up (beside the scale)
    const w = Math.max(0.00005, 2.6 * pxSize);
    const tw = 7 * w;
    const showD = s.show.d && s.last && !busy() && s.phase !== 'ready';
    if (showD && s.last.D > 0) {
      const yTop = Y1HIGH + P1H + ROD1;
      marks.d1.set(xS - 0.17, yTop, hy, 0.06, w, tw);
    } else marks.d1.hide();
    if (showD && s.last.d > 0) {
      marks.d2.set(xB - r2 + 0.006 + tw / 2, RULER0 + (s.last.n > 1 ? 0 : s.last.h0), RULER0 + s.h, ZA, w, tw);
    } else marks.d2.hide();
  }

  // ── the actions ─────────────────────────────────────────────────────────────
  /** One push of the handle: down 10 cm and the car up d₂, or (too heavy) a shake and nothing moves. */
  function push({ quiet = false, jump = false } = {}) {
    const token = ++s.run;
    tweener.cancel('move');
    const k = s.ratio;
    s.found.ratios.add(k);
    if (!lifts(s.F1, k)) {
      s.phase = 'stuck';
      s.y1 = GEO.Y1HIGH;
      s.last = null;
      if (s.mode === 'explore') s.found.stuck = true;
      syncScene();
      refresh();
      emitChange();
      if (!quiet) {
        audio.error();
        showHint(t('hint_stuck'), { duration: 2400 });
      }
      if (jump) return Promise.resolve(true);
      return tweener
        .animate({
          key: 'move',
          duration: STUCK_S,
          ease: ease.linear,
          onUpdate: (q) => {
            s.y1 = GEO.Y1HIGH - 0.006 * Math.sin(q * Math.PI * 3) * (1 - q);
            syncScene();
          },
        })
        .finished.then((done) => {
          if (token !== s.run) return false;
          s.y1 = GEO.Y1HIGH;
          syncScene();
          emit('push', snapshotSetup());
          return done;
        });
    }
    // the handle must be up for a push: after a push, it comes up first (oil from the tank fills the pump)
    const h0 = s.h;
    const d2 = Math.min(rise(STROKE, k), RISE_MAX - h0);
    if (d2 <= 1e-9) {
      s.phase = 'top';
      refresh();
      return Promise.resolve(false);
    }
    const d1 = d2 * k;
    const y0 = GEO.Y1HIGH;
    s.phase = 'push';
    s.last = { n: 1, D: d1, d: d2, h0 };
    if (!quiet) audio.pop();
    const finish = () => {
      s.y1 = y0 - d1;
      s.h = round(h0 + d2, 6);
      s.pushes++;
      s.phase = 'pushed';
      const first = !s.found.push;
      if (s.mode === 'explore') s.found.push = true;
      syncScene();
      refresh();
      emit('push', snapshotSetup());
      emitChange();
      if (first && s.mode === 'explore' && !jump) tour(token);
      return true;
    };
    if (jump) return Promise.resolve(finish());
    s.y1 = y0;
    syncScene();
    refresh();
    emitChange();
    return tweener
      .animate({
        key: 'move',
        duration: PUSH_S,
        ease: ease.inOutCubic,
        onUpdate: (q) => {
          s.y1 = y0 - d1 * q;
          s.h = h0 + d2 * q;
          syncScene();
        },
      })
      .finished.then((done) => (done && token === s.run ? finish() : false));
  }

  /** Push the handle many times (sped up): each push raises the car d₂, until BATCH pushes or the top. */
  function pump({ jump = false } = {}) {
    const token = ++s.run;
    tweener.cancel('move');
    const k = s.ratio;
    const h0 = s.h;
    const n = Math.min(BATCH, pushesLeft(h0, k));
    if (n <= 0) {
      s.phase = 'top';
      refresh();
      return Promise.resolve(false);
    }
    const d2 = rise(STROKE, k);
    s.phase = 'pump';
    s.last = { n, D: round(n * STROKE, 6), d: round(n * d2, 6), h0 };
    s.count = 0;
    if (s.mode === 'explore') s.found.pump = true;
    s.hView = round(h0 + n * d2, 6);
    if (!jump && s.look === 'all' && !s.userMovedCamera) flyTo(viewPose(), 0.6);
    const finish = () => {
      s.h = round(h0 + n * d2, 6);
      s.y1 = GEO.Y1HIGH - STROKE;
      s.pushes += n;
      s.count = n;
      s.phase = pushesLeft(s.h, k) > 0 ? 'pumped' : 'top';
      syncScene();
      refresh();
      emit('pump', snapshotSetup());
      emitChange();
      if (s.phase === 'top') showHint(t('hint_top'), { duration: 2600 });
      return true;
    };
    if (jump) return Promise.resolve(finish());
    refresh();
    emitChange();
    const bobs = Math.ceil(n / PER_BOB);
    let lastTick = -1;
    let lastCount = -1;
    return tweener
      .animate({
        key: 'move',
        duration: bobs * BOB_S,
        ease: ease.linear,
        onUpdate: (q) => {
          const b = q * bobs; // bobs done
          const i = Math.min(bobs - 1, Math.floor(b));
          const f = b - i; // in this bob: up (0 … 0.4), then down
          const down = f < 0.4 ? 0 : ease.inOutCubic((f - 0.4) / 0.6);
          s.y1 = GEO.Y1HIGH - STROKE * (f < 0.4 ? 1 - ease.inOutCubic(f / 0.4) : down);
          const done = Math.min(n, i * PER_BOB + PER_BOB * down);
          s.h = h0 + done * d2;
          s.count = Math.min(n, Math.round(done));
          if (i !== lastTick && f > 0.9) {
            lastTick = i;
            audio.tick();
          }
          syncScene();
          if (s.count !== lastCount) {
            lastCount = s.count;
            refresh();
          }
        },
      })
      .finished.then((done) => (done && token === s.run ? finish() : false));
  }

  /** Open the valve: the oil goes back to the tank, the car comes down, the handle comes up. */
  function lower({ jump = false } = {}) {
    const token = ++s.run;
    tweener.cancel('move');
    const h0 = s.h;
    const y0 = s.y1;
    s.phase = 'lower';
    const finish = () => {
      s.h = 0;
      s.hView = 0;
      if (!s.userMovedCamera) flyTo(viewPose(), jump ? 0 : 0.7);
      s.y1 = GEO.Y1HIGH;
      s.pushes = 0;
      s.last = null;
      s.phase = 'ready';
      syncScene();
      refresh();
      emitChange();
      return true;
    };
    if (jump) return Promise.resolve(finish());
    refresh();
    return tweener
      .animate({
        key: 'move',
        duration: LOWER_S,
        ease: ease.inOutCubic,
        onUpdate: (q) => {
          s.h = h0 * (1 - q);
          s.y1 = y0 + (GEO.Y1HIGH - y0) * q;
          syncScene();
        },
      })
      .finished.then((done) => (done && token === s.run ? finish() : false));
  }

  /** Back to the start of this set-up: the car down, the handle up, no force (no animation). */
  function settle() {
    s.run++;
    tweener.cancel('move');
    s.h = 0;
    s.hView = 0;
    s.y1 = GEO.Y1HIGH;
    s.pushes = 0;
    s.last = null;
    s.phase = 'ready';
    syncScene();
  }

  /** After the first push: close to the oil (equal arrows), then to the scale (the tiny rise), then the whole lift. */
  async function tour(token) {
    for (const look of ['inside', 'rim', 'all']) {
      await wait(look === 'inside' ? 0.7 : TOUR_HOLD);
      if (token !== s.run || s.mode !== 'explore' || s.userMovedCamera) return;
      await setLook(look, { tour: true });
      if (token !== s.run) return;
    }
  }
  const wait = (sec) => tweener.animate({ key: 'wait', duration: sec, onUpdate: () => {} }).finished;

  // ── the panel ───────────────────────────────────────────────────────────────
  function plan() {
    if (s.phase === 'top' || s.phase === 'lower') return { label: 'act_lower', step: '' };
    if (s.phase === 'pushed' || s.phase === 'pumped' || s.phase === 'pump') return { label: 'act_pump', step: s.found.pump ? '' : 2 };
    return { label: 'act_push', step: s.found.push || s.found.stuck ? '' : 1 };
  }

  function outcomeHtml() {
    const f2 = G(F2());
    switch (s.phase) {
      case 'push':
        return t('out_push');
      case 'pushed':
        return t('out_up', { F2: f2, D: D(s.last.D), d: D(s.last.d) });
      case 'stuck':
        return t('out_stuck', { F2: f2, W: G(W) });
      case 'pump':
        return t('out_pumping', { n: N(s.count || 0) });
      case 'pumped':
        return t('out_pump', { n: N(s.last.n), D: D(s.last.D), d: D(s.last.d) });
      case 'top':
        return t('out_top', { d: D(s.h) });
      case 'lower':
        return t('out_lower');
      default:
        return t('out_ready', { W: G(W) });
    }
  }

  function ruleHtml() {
    const f = s.found;
    const k = N(s.ratio);
    const energy = () => t('rule_energy', { F: N(s.F1), d1: N(STROKE), F2: G(F2()), d2: N(rise(STROKE, s.ratio)), E: N(work(s.F1, STROKE)) });
    if (s.phase === 'stuck') return t('rule_stuck');
    if (['pump', 'pumped', 'top'].includes(s.phase)) return energy();
    if (s.phase === 'pushed') return f.pump ? energy() : t('rule_equal', { k });
    if (f.pump && f.ratios.size >= 2) return t('rule_use', { k });
    if (f.pump) return energy();
    if (f.push) return t('rule_equal', { k });
    return t('rule_law');
  }

  let lastSums = '';
  function sums() {
    const f2 = F2();
    const key = `${s.F1}|${s.ratio}`;
    if (key === lastSums) return;
    lastSums = key;
    eq.querySelector('[data-sum="P"]').innerHTML = t('sum_P', { F: N(s.F1), A: N(A1), P: G(P()) });
    eq.querySelector('[data-sum="F2"]').innerHTML = t('sum_F2', { F: N(s.F1), k: N(s.ratio), F2: G(f2) });
    eq.querySelector('[data-sum="W"]').innerHTML = t('sum_W', { W: G(W) });
    const cmp = /** @type {HTMLElement} */ (eq.querySelector('.pl-cmp'));
    const up = f2 > W;
    cmp.className = `pl-cmp ${up ? 'ok' : 'no'}`;
    cmp.innerHTML = `${up ? ICONS.check : ICONS.close}<span>${t('s_F2')} ${t(up ? 'cmp_more' : 'cmp_less')} ${t('s_W')}</span>`;
  }

  let lastNotes = '';
  function refresh() {
    sheet.choose(String(s.ratio));
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    $('[data-val="F"]').textContent = N(s.F1);
    const [lo, hi] = F_LIMITS;
    for (const b of eq.querySelectorAll('[data-step]')) {
      const dir = Number(/** @type {HTMLElement} */ (b).dataset.dir);
      b.classList.toggle('off', dir < 0 ? s.F1 <= lo : s.F1 >= hi);
    }
    sums();
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label === 'act_pump' ? () => t('act_pump', { n: N(BATCH) }) : p.label });
      // the ring round the handle only before the first push: then the arrows and labels need the room
      if (s.phase === 'ready' && !s.found.push && s.look === 'all') action.show('scene');
      else action.hide('scene');
    }
    const insideBtn = /** @type {HTMLElement} */ ($('[data-act="inside"]'));
    const insideKey = s.look === 'all' ? 'act_inside' : 'act_all';
    insideBtn.setAttribute('aria-label', t(insideKey));
    insideBtn.title = t(insideKey);
    insideBtn.querySelector('span').textContent = t(insideKey);
    const key = `${t.lang}|${pressing()}|${s.phase}|${s.look}|${stage.width < 560}|${stage.height}`;
    if (key !== lastNotes) {
      cutNote.innerHTML = s.look === 'all' ? t('note_cut') : t('note_zoom');
      let low = '';
      if (s.phase === 'pump') low = t('note_fast');
      else if (pressing() && s.show.P && s.look !== 'rim') low = s.look === 'all' && s.show.F2 ? t('note_scale') : t('note_arrows');
      arrowNote.innerHTML = stage.height >= 230 ? low : '';
      lastNotes = key;
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const S0 = { x: 0, y: 0 };
  const S1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  function arrowBoxes() {
    const list = [];
    for (const a of [arrows.F1, arrows.F2, arrows.W]) {
      if (!a.root.visible) continue;
      toScreen(a.root.position, S0);
      toScreen(a.tip, S1);
      list.push({ left: Math.min(S0.x, S1.x) - 9, top: Math.min(S0.y, S1.y) - 9, right: Math.max(S0.x, S1.x) + 9, bottom: Math.max(S0.y, S1.y) + 9 });
    }
    return list;
  }
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const bbox = new THREE.Box3();
  function screenBox(b3) {
    let i = 0;
    for (const x of [b3.min.x, b3.max.x])
      for (const y of [b3.min.y, b3.max.y]) for (const z of [b3.min.z, b3.max.z]) corners[i++].set(x, y, z).project(camera);
    const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
    const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }
  /** The handle and the small cylinder's top on the screen (labels keep off them). */
  function handleBox() {
    const { xS } = GEO;
    bbox.min.set(xS - 0.14, s.y1 + GEO.P1H, -0.02);
    bbox.max.set(xS + 0.14, lift.handleY() + 0.03, 0.02);
    return screenBox(bbox);
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, notes, arrowNote, arrowBoxes, handleBox, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const LEFT = [spot(-14, 0), spot(-14, -18), spot(-14, 18), spot(-14, -34)];
  const RIGHT = [spot(14, 0), spot(14, -18), spot(14, 18), spot(14, 34)];
  const ABOVE = [spot(0, -16), spot(-18, -16), spot(18, -16)];
  const BELOW = [spot(0, 16), spot(-18, 16), spot(18, 16)];
  const pts = {};
  const pt = (id) => (pts[id] ||= new THREE.Vector3());
  const labelState = new Map();
  const want = new Map();
  function syncLabels() {
    want.clear();
    const { xS, xB, r1, P1H } = GEO;
    const r2 = lift.r2;
    const on = pressing();
    const look = s.look;
    const narrow = stage.width < 520 || stage.height < 300;
    const tiny = stage.height < 280; // only the forces' labels: the panel has the rest
    if (look !== 'rim') {
      if (on && s.show.F1 && arrows.F1.root.visible)
        want.set('F1', {
          text: t('lbl_F1', { v: N(s.F1) }),
          point: () => pt('F1').copy(arrows.F1.root.position).lerp(arrows.F1.tip, 0.4),
          spots: [...LEFT, ...RIGHT],
          color: COLORS.F,
          optional: tiny && s.mode !== 'quiz', // the stepper shows F₁ too
        });
      if (look === 'all' && on && s.show.F2 && arrows.F2.root.visible)
        want.set('F2', {
          text: t('lbl_F2', { v: G(F2()) }),
          point: () => pt('F2').copy(arrows.F2.root.position).lerp(arrows.F2.tip, 0.35),
          spots: [...LEFT, ...RIGHT],
          color: COLORS.F,
        });
      if (look === 'all' && s.show.W)
        want.set('W', {
          text: t('lbl_W', { v: G(W) }),
          point: () => pt('W').copy(arrows.W.root.position).lerp(arrows.W.tip, 0.3),
          spots: [spot(-14, -10), spot(-14, -28), spot(14, -24), ...ABOVE],
          color: COLORS.W,
        });
      if (marks.d1.root.visible)
        want.set('d1', {
          text: t('lbl_d1', { v: D(STROKE) }),
          point: () => pt('d1').set(xS - 0.17, (GEO.Y1HIGH + P1H + GEO.ROD1 + lift.handleY()) / 2, 0.06),
          spots: [...LEFT, spot(-14, -30), spot(-14, 30)],
          color: COLORS.d,
          optional: true,
        });
      if (s.show.A && (!tiny || s.mode === 'quiz')) {
        want.set('A1', {
          text: t('lbl_A1', { v: N(A1) }),
          point: () => pt('A1').set(xS - r1, s.y1, ZA),
          spots: [...LEFT, spot(-14, 30)],
          color: COLORS.A,
          optional: !(s.mode === 'quiz'),
        });
        want.set('A2', {
          text: t('lbl_A2', { v: N(area2(s.ratio)) }),
          point: () => pt('A2').set(xB + r2 * 0.6, GEO.Y2LOW + s.h, ZA),
          spots: [spot(0, -16), spot(20, -16), spot(-20, -16), spot(0, 18), ...RIGHT],
          color: COLORS.A,
          optional: !(s.mode === 'quiz'),
        });
      }
      if (on && s.show.Pval && (!tiny || look === 'inside' || s.mode === 'quiz')) {
        want.set('P1', {
          text: t('lbl_P', { v: G(P()) }),
          point: () => pt('P1').set(xS + r1 * 0.35, s.y1 - P_LEN * 0.55, ZA),
          spots: look === 'inside' ? [...RIGHT, ...LEFT] : [spot(14, 26), spot(14, 44), ...RIGHT],
          color: COLORS.P,
          optional: !(s.mode === 'quiz'),
        });
        if (s.show.Pbig && (look === 'inside' || !narrow))
          want.set('P2', {
            text: t('lbl_P2', { v: G(P()) }),
            point: () => pt('P2').set(xB - r2 * 0.55, GEO.Y2LOW + s.h - P_LEN * 0.55, ZA),
            spots: [...RIGHT, ...LEFT, ...BELOW],
            color: COLORS.P,
            optional: true,
          });
      }
    }
    if (marks.d2.root.visible && (look === 'rim' || s.last.n > 1))
      want.set('d2', {
        text: s.last.n > 1 ? t('lbl_h', { v: D(s.h) }) : t('lbl_d2', { v: D(s.last.d) }),
        point: () => pt('d2').set(xB - r2 + 0.01, RULER0 + ((s.last.n > 1 ? 0 : s.last.h0) + s.h) / 2, ZA),
        spots: look === 'rim' ? [spot(60, 0), spot(60, -30), spot(60, 30)] : [spot(16, -14), ...RIGHT],
        color: COLORS.d,
      });
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${Boolean(w.optional)}|${w.spots.map((p) => `${p.dx},${p.dy}`).join(';')}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, optional: w.optional });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots, optional: Boolean(w.optional) });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  const LOOK_DIR = { all: new THREE.Vector3(0.1, 0.17, 1), inside: new THREE.Vector3(0.08, 0.06, 1), rim: new THREE.Vector3(0, 0, 1) };
  function viewPose(look = s.look) {
    const { xS, xB, r1, t1, t2, Y1TOP } = GEO;
    const r2 = r2For(s.ratio);
    if (look === 'inside') {
      box.min.set(xS - r1 - t1 - 0.2, 0.02, -0.02);
      box.max.set(Math.min(xB + r2 + t2, xB - r2 + 0.32), Y1TOP + 0.05, 0.02);
    } else if (look === 'rim') {
      const last = s.last && s.last.n === 1 ? s.last : null;
      const lo = RULER0 + (last ? last.h0 : s.h);
      const hi = RULER0 + (last ? last.h0 + last.d : s.h);
      const mid = (lo + hi) / 2;
      const half = Math.max(0.0065, (hi - lo) * 0.9);
      box.min.set(xB - r2 - t2 * 0.9, mid - half, -0.002);
      box.max.set(xB - r2 + 0.014, mid + half, 0.002);
    } else {
      const platHalf = GEO.PLAT_W / 2;
      box.min.set(xS - 0.22, 0.0, -0.1);
      box.max.set(
        lift.top.position.x + platHalf + 0.02,
        GEO.Y2LOW + GEO.P2H + GEO.ROD2 + GEO.PLAT_H + GEO.CAR_H + 0.02 + Math.max(s.h, s.hView),
        0.1,
      );
    }
    // a wide, short stage: the corner buttons are off to the right of the lift, so it may come up to the top
    const wide = look === 'all' && stage.width / Math.max(1, stage.height) > 1.9;
    const margin = wide ? { ...MARGIN, top: 14 } : MARGIN;
    return fitPose({ box, dir: LOOK_DIR[look].clone().normalize(), camera, width: stage.width, height: stage.height, margin });
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      layoutMarks();
      stage.invalidate();
      return Promise.resolve(true);
    }
    // the distance changes a lot (the whole lift → 4 cm of a scale): ease it on a log scale
    const d0 = p0.distanceTo(t0);
    const d1 = position.distanceTo(aim);
    const dir0 = p0.clone().sub(t0).normalize();
    const dir1 = position.clone().sub(aim).normalize();
    return tweener
      .animate({
        key: 'camera',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          const d = d0 * (d1 / d0) ** k;
          const kk = d0 === d1 ? k : (d0 - d) / (d0 - d1);
          controls.target.lerpVectors(t0, aim, kk);
          tmpB.copy(dir0).lerp(dir1, k).normalize();
          camera.position.copy(controls.target).addScaledVector(tmpB, d);
          controls.update();
          layoutMarks();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (done) refresh();
        return done;
      });
  }
  /** Where the camera looks: the whole lift, the oil close up, or the scale on the lift cylinder. */
  function setLook(look, { animate = true, tour: fromTour = false } = {}) {
    if (!LOOKS.includes(look)) return Promise.resolve(false);
    if (!fromTour) {
      s.run += busy() ? 0 : 1; // a word the student taps stops the tour (never a push half way)
      tweener.cancel('wait');
    }
    s.look = look;
    s.userMovedCamera = false;
    refresh();
    emit('look', { look });
    emitChange();
    return flyTo(viewPose(), animate ? (look === 'rim' || look === 'all' ? 1.2 : 1.0) : 0);
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
  controls.addEventListener('change', () => {
    layoutMarks();
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── the action: the big button, the ring round the handle, a tap on the handle ─
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not push twice
    lastAct = now();
    hintOff();
    if (busy()) return showHint(t('hint_wait'), { duration: 2000 });
    if (s.look !== 'all' && !s.userMovedCamera) setLook('all');
    if (s.phase === 'top') return lower();
    if ((s.phase === 'pushed' || s.phase === 'pumped') && lifts(s.F1, s.ratio)) return pump();
    return push();
  }
  const handleBox3 = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_push',
    target: () => {
      const { xS } = GEO;
      handleBox3.min.set(xS - 0.14, lift.handleY() - 0.03, -0.03);
      handleBox3.max.set(xS + 0.14, lift.handleY() + 0.03, 0.03);
      return handleBox3;
    },
    pad: 6,
    avoid: [ui.corner, ui.hint, notes, arrowNote, () => anno.boxes()],
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
    if (raycaster.intersectObjects(lift.pumpMeshes, true).length > 0) return true;
    // a finger a little off the handle still counts (touch screens)
    const hp = toScreen(tmpA.set(GEO.xS, lift.handleY(), 0), S0);
    return Math.abs(p.x - hp.x) < 34 && Math.abs(p.y - hp.y) < 26;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return;
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

  // ── the term buttons: the arrows (or the area) of the symbol pulse ──────────
  function tick() {
    if (!s.focus) return false;
    const on = now() - s.focusAt < 1600;
    const k = on ? 1 + 0.35 * Math.sin(((now() - s.focusAt) / 1000) * Math.PI * 4) : 1;
    arrows.F1.root.scale.setScalar(s.focus === 'F1' ? k : 1);
    arrows.F2.root.scale.setScalar(s.focus === 'F2' ? k : 1);
    for (const g of pList) g.scale.setScalar(s.focus === 'P' ? k : 1);
    areaBars.A1.scale.y = Math.max(0.006, 3 * pxSize) * (s.focus === 'A1' ? 1 + 2 * (k - 0.65) : 1);
    areaBars.A2.scale.y = Math.max(0.006, 3 * pxSize) * (s.focus === 'A2' ? 1 + 2 * (k - 0.65) : 1);
    if (!on) {
      s.focus = null;
      for (const b of eq.querySelectorAll('[data-term]')) b.classList.remove('on');
      layoutMarks();
    }
    stage.invalidate();
    return on;
  }
  stage.addTicker(() => tick());
  function focusTerm(k) {
    s.focus = k;
    s.focusAt = now();
    for (const b of eq.querySelectorAll('[data-term]')) b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.term === k);
    if (!pressing() && ['P', 'F1', 'F2'].includes(k) && s.mode === 'explore') showHint(t('hint_press'), { duration: 2400 });
    stage.invalidate();
  }

  // ── the push and the piston ─────────────────────────────────────────────────
  /** A new push or piston: the car comes down; if it was being pushed, the new push comes at once (quietly). */
  function changed({ animate = true } = {}) {
    const again = pressing();
    settle();
    if (!s.userMovedCamera) flyTo(viewPose(), animate ? 0.6 : 0);
    refresh();
    emitChange();
    if (again && s.mode === 'explore') push({ quiet: true, jump: !animate });
  }
  function setForce(F, opts) {
    const v = fixForce(F);
    if (v === s.F1) return;
    s.F1 = v;
    changed(opts);
  }
  function setRatio(k, opts) {
    const v = fixRatio(k);
    if (v === s.ratio) return;
    s.ratio = v;
    lift.setRatio(v);
    changed(opts);
  }
  function step(dir) {
    if (s.locked) return lockedNudge();
    setForce(s.F1 + dir * F_LIMITS[2]);
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshotSetup() {
    return { F1: s.F1, ratio: s.ratio, A1, A2: area2(s.ratio), P: P(), F2: F2(), W, lifts: lifts(s.F1, s.ratio) };
  }
  function snapshot() {
    const p = plan();
    return {
      ...snapshotSetup(),
      phase: s.phase,
      rise: round(s.h * 1000, 3), // mm
      pushes: s.pushes,
      d1: s.last ? round(s.last.D * 100, 4) : 0, // cm the handle went down in the last action
      d2: s.last ? round(s.last.d * 1000, 4) : 0, // mm the car rose in the last action
      look: s.look,
      found: { push: s.found.push, stuck: s.found.stuck, pump: s.found.pump, ratios: [...s.found.ratios].sort((a, b) => a - b) },
      next: p.label.replace('act_', ''),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.F1, snap.ratio, snap.phase, snap.pushes, snap.look, snap.found, snap.mode, snap.view]);
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
      label: (j) => `<span class="pl-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const ALL_SHOWN = { F1: true, F2: true, W: true, P: true, A: true, d: true, Pval: true, Pbig: true };
  /** A question's scene: this push and piston, pushed once (or stuck), these labels; nothing moving. */
  async function scene_(F1, ratio, { pushed = true, show = {} } = {}) {
    s.F1 = fixForce(F1);
    s.ratio = fixRatio(ratio);
    lift.setRatio(s.ratio);
    settle();
    s.show = { ...ALL_SHOWN, ...show };
    if (pushed) await push({ quiet: true, jump: true });
    s.look = 'all';
    refresh();
    return flyTo(viewPose(), 0.6);
  }
  function revealAll() {
    s.show = { ...ALL_SHOWN };
    syncScene();
    refresh();
  }
  /** The question's words (with sub- and superscripts: the kit writes text, so the HTML is put in here). */
  const ask = (html, q) => {
    $('.pvc-q-text').innerHTML = html;
    return q;
  };
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const nText = (v) => `${G(v)}${NBSP}${t('u_N')}`;
  const paText = (v) => `${G(v)}${NBSP}${t('u_Pa')}`;
  const jText = (v) => `${G(v)}${NBSP}${t('u_J')}`;

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
        learnSaved = { F1: s.F1, ratio: s.ratio, pressed: pressing(), look: s.look };
        s.mode = 'quiz';
        s.locked = true;
        tweener.cancel('wait');
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { ...ALL_SHOWN };
        syncUI();
        const saved = learnSaved;
        s.F1 = saved?.F1 ?? s.F1;
        s.ratio = saved?.ratio ?? s.ratio;
        lift.setRatio(s.ratio);
        settle();
        s.look = 'all';
        if (saved?.pressed) push({ quiet: true, jump: true });
        syncScene();
        refresh();
        emitChange();
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['f2', 'rise', 'p', 'dir', 'work'][i % 5];
        if (kind === 'f2') {
          const F = pickOne([50, ...QUIZ_FORCES]);
          const k = pickOne([50, 100]);
          await scene_(F, k, { show: { F2: false, Pval: false, d: false } });
          if (!alive()) return null;
          question = { kind, F, k };
          return ask(
            t('q_f2'),
            choicesOf(force2Choices(F, k), kind, (x) => nText(x.v)),
          );
        }
        if (kind === 'rise') {
          const k = pickOne([50, 100]);
          const dcm = pickOne(QUIZ_STROKES);
          await scene_(pickOne(QUIZ_FORCES), k, { pushed: false, show: { F2: false, P: false, Pval: false, d: false } });
          if (!alive()) return null;
          question = { kind, k, dcm };
          return ask(
            t('q_rise', { d: D(dcm / 100) }),
            choicesOf(riseChoices(dcm, k), kind, (x) => D(x.v / 100)),
          );
        }
        if (kind === 'p') {
          const F = pickOne(QUIZ_FORCES);
          const k = pickOne([50, 100]);
          await scene_(F, k, { show: { P: false, Pbig: false, F2: false, d: false } });
          if (!alive()) return null;
          question = { kind, F, k };
          return ask(
            t('q_p'),
            choicesOf(pressureChoices(pressure(F), k), kind, (x) => paText(x.v)),
          );
        }
        if (kind === 'dir') {
          await scene_(pickOne(QUIZ_FORCES), 100, { show: { P: false, d: false } });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_perp', 'c_down', 'c_along', 'c_big'].map((key) => ({ key }));
          return ask(
            t('q_dir'),
            choicesOf(items, kind, (x) => t(x.key)),
          );
        }
        const F = pickOne(QUIZ_FORCES);
        const k = pickOne([50, 100]);
        await scene_(F, k, { show: { F2: false, Pval: false } });
        if (!alive()) return null;
        question = { kind: 'work', F, k };
        return ask(
          t('q_work'),
          choicesOf(workChoices(F, STROKE, k), 'work', (x) => jText(x.v)),
        );
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const vars = { k: N(question.k ?? s.ratio) };
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], vars)}` : '');
        revealAll();
        if (k === 'f2')
          return (
            t('why_f2', { F2: G(force2(question.F, question.k)), F: N(question.F), k: N(question.k) }) +
            note({ same: 'mis_f2_same', divide: 'mis_f2_divide', add: 'mis_f2_add' })
          );
        if (k === 'rise') {
          const v = D(question.dcm / 100 / question.k);
          return (
            t('why_rise', { v, k: N(question.k), d: D(question.dcm / 100) }) +
            note({ same: 'mis_rise_same', times: 'mis_rise_times', tenth: 'mis_rise_tenth' })
          );
        }
        if (k === 'p') return t('why_p', { P: G(pressure(question.F)) }) + note({ times: 'mis_p_times', divide: 'mis_p_divide', half: 'mis_p_half' });
        if (k === 'dir') return t('why_dir') + note({ c_down: 'mis_down', c_along: 'mis_along', c_big: 'mis_big' });
        return (
          t('why_work', { E: G(work(question.F, STROKE)), F: N(question.F), dm: N(STROKE) }) +
          note({ times: 'mis_work_times', divide: 'mis_work_divide', cm: 'mis_work_cm', half: 'mis_work_half' })
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
  function goHome() {
    settle();
    refresh();
    emitChange();
    return setLook('all');
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else setRatio(Number(b.dataset.example));
    }
    if (b.dataset.step) step(Number(b.dataset.dir));
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
      case 'inside':
        if (s.locked) lockedNudge();
        else setLook(s.look === 'all' ? 'inside' : 'all');
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
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey =
      ['1', '2', '3', 'i', 'I', 'r', 'R', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-'].includes(k) ||
      ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) setRatio(RATIOS[Number(k) - 1]);
    else if (k === 'ArrowUp' || k === 'ArrowRight' || k === '+') step(1);
    else if (k === 'ArrowDown' || k === 'ArrowLeft' || k === '-') step(-1);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'i' || k === 'I') setLook(s.look === 'all' ? 'inside' : 'all');
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  controls.enableRotate = s.view === '3d';
  lift.setRatio(s.ratio);
  if (o.phase === 'pushed') {
    s.found.push = true;
    push({ quiet: true, jump: true });
  }
  flyTo(viewPose(), 0);
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
     * Change any of: F1 (the push, N), ratio (A₂/A₁: 10, 50 or 100), phase ('ready' | 'pushed' | 'pumped' | 'top';
     * with animate: false it lands there at once), look ('all' | 'inside' | 'rim'), view ('front' | '3d').
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.ratio != null) setRatio(p.ratio, { animate });
      if (p.F1 != null) setForce(p.F1, { animate });
      if (p.phase === 'ready') {
        settle();
        refresh();
      } else if (p.phase === 'pushed') {
        if (pressing()) settle();
        await push({ quiet: !animate, jump: !animate });
      } else if (p.phase === 'pumped' || p.phase === 'top') {
        if (!pressing() || s.phase === 'stuck') await push({ quiet: true, jump: true });
        if (lifts(s.F1, s.ratio)) {
          if (p.phase === 'top') while (s.phase !== 'top' && s.phase !== 'stuck') await pump({ jump: true });
          else await pump({ jump: !animate });
        }
      }
      if (p.look) await setLook(p.look, { animate });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = { push: false, stuck: false, pump: false, ratios: new Set() };
      s.show = { ...ALL_SHOWN };
      s.F1 = F_START;
      s.ratio = RATIO_START;
      lift.setRatio(s.ratio);
      settle();
      s.look = 'all';
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The lift with its oil, pistons, platform and car, as they are now, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'PascalCarLift';
      g.add(lift.root.clone(true));
      return g;
    },
  };
}
