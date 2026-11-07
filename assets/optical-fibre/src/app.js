// The optical fibre (book page 253, topic 9.3.1), student view. A magnified fibre on a plain table in a calm blue setting:
// a clear glass core, a pale-blue glass clad and a dark plastic coating cut away on the near side; a light source on a
// swing arm at the near end, a white screen at the far end. Five steps, one tap each, slow: ① the camera flies to the
// near end face: কোর (n₂ = 1.50) and ক্ল্যাড (n₁ = 1.45); ② the light is sent: the camera follows it along the fibre as it
// is reflected again and again at the core–clad wall, onto the screen; ③ one reflection close up (চিত্র ৯.১১b): the
// normal, θ₁ and θc = sin⁻¹(1.45/1.50) = 75°; ④ the fibre is bent into an S (চিত্র ৯.১১a, a handle on the far clamp):
// every θ₁ stays above 75°, the light follows the bends; ⑤ the source is tilted (a handle on it): θ₁ falls below 75°
// and most of the light leaves the core at every wall, the screen goes dark. A graph in the panel shows θ₁ at every
// wall against θc. The light is traced exactly (reading.js). A calm card first, then one lead-in line, the result and
// the rule per step; the kit's how-to row; a five-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { createApparatus, X0, Y0 } from './apparatus.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { C, createRays } from './rays.js';
import { ALPHA_MAX, ALPHA_START, BEND_MAX, FIBRE, N_CLAD_BOOK, N_CORE, SOURCE_GAP, shownTheta, THETA_C, trace } from './reading.js';
import { backdrop, createTable } from './setting.js';

export const DEFAULTS = {
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

export const STEPS = ['parts', 'light', 'one', 'bend', 'tilt'];
const COLORS = { ti: C.ti, crit: C.crit, critText: '#5f3dc4', out: '#d9480f', ink: '#1d2733' };
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 14, side: 10 };
// how long things take (s): slow enough to follow
const T = { fly: 1.8, light: 7, back: 1.8, normal: 0.9, arc: 0.9, crit: 0.7, bend: 2.6, tilt: 2.4, jump: 1.2 };
const BEND_TO = 8; // cm: the S of চিত্র ৯.১১a
const TILT_TO = 35; // degrees: θ₁ = 67.5° at a straight wall
const FOCUS_ONE = 2; // the wall shown close up in step ③ (the third: clear of the near clamp)
/** Where each step ends: the light drawn (0…1), the far end's rise (cm), the source's tilt (°), the angle's marks (0…1). */
const TARGET = {
  intro: { light: 0, h: 0, alpha: ALPHA_START, marks: 0 },
  parts: { light: 0, h: 0, alpha: ALPHA_START, marks: 0 },
  light: { light: 1, h: 0, alpha: ALPHA_START, marks: 0 },
  one: { light: 1, h: 0, alpha: ALPHA_START, marks: 1 },
  bend: { light: 1, h: BEND_TO, alpha: ALPHA_START, marks: 0 },
  tilt: { light: 1, h: BEND_TO, alpha: TILT_TO, marks: 0 },
};
/** Where the camera looks in each step. */
const CAM = { intro: 'all', parts: 'end', light: 'all', one: 'close', bend: 'all', tilt: 'source' };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** Two decimals, as the book prints the indices (1.50, 1.45). */
  const N2 = (x) => N(x.toFixed(2));

  root.classList.add('pvc', 'of');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'replay', label: 'act_replay', icon: ICONS.play },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      tight: true,
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the line before the action: what the next tap will show (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'of-lead';
  $('.pvc-act-row').before(lead);
  // the graph: θ₁ at each wall against θc (in a side panel with room for it)
  const graphBox = document.createElement('div');
  graphBox.className = 'of-graph';
  ui.learn.append(graphBox);
  const graph = createGraph(graphBox, { t, N, theta: THETA_C, colors: COLORS });
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'of-note';
  note.textContent = t('note_scale');
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.5, far: 1200, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.1);
  sun.position.set(30, 110, 70);
  sun.target.position.set(0, 10, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.55);
  fill.position.set(-90, 40, 80);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -62, right: 58, top: 40, bottom: -36, near: 60, far: 220 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const table = createTable();
  const app = createApparatus();
  scene.add(table.root, app.root);
  const rays = createRays({ stage, host: ui.canvasHost });

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
    step: 'intro',
    v: { ...TARGET.intro },
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    drag: null,
    quizKind: '',
    quizFocus: -1,
    quizShowTheta: false,
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the light from the state ────────────────────────────────────────────────
  let tr = trace({ alpha: s.v.alpha, h: s.v.h });
  let trKey = '';
  function retrace() {
    const key = `${s.v.alpha.toFixed(4)}|${s.v.h.toFixed(4)}`;
    if (key === trKey) return tr;
    trKey = key;
    const line = app.setBend(s.v.h);
    app.setTilt(s.v.alpha);
    tr = trace({ alpha: s.v.alpha, h: s.v.h, line });
    rays.setTrace(tr);
    return tr;
  }
  /** The wall the angle is shown at: in step ③ the second; else the one with the smallest θ₁ (the first of equals). */
  function focusIndex() {
    if (s.mode === 'quiz') return s.quizFocus;
    if (!tr.hits.length) return -1;
    if (s.step === 'one') return Math.min(FOCUS_ONE, tr.hits.length - 1);
    let k = 0;
    for (let i = 1; i < tr.hits.length; i++) if (tr.hits[i].theta < tr.hits[k].theta - 0.05) k = i;
    return k;
  }
  const fractions = [];
  function syncScene() {
    retrace();
    const v = s.v;
    const rv = rays.view;
    rv.light = v.light;
    rv.focus = v.marks > 0 || s.step === 'bend' || s.step === 'tilt' || s.mode === 'quiz' ? focusIndex() : -1;
    rv.normal = s.mode === 'quiz' ? (s.quizFocus >= 0 ? 1 : 0) : Math.min(1, v.marks * 3);
    rv.arc = s.mode === 'quiz' ? (s.quizFocus >= 0 ? 1 : 0) : Math.max(0, Math.min(1, v.marks * 3 - 1));
    rv.crit = s.mode === 'quiz' ? 0 : Math.max(0, Math.min(1, v.marks * 3 - 2));
    // in steps ④ and ⑤ the wall with the smallest θ₁ gets its normal and angle too, once the light is through
    if ((s.step === 'bend' || s.step === 'tilt') && s.mode !== 'quiz' && v.light >= 1) {
      rv.normal = 1;
      rv.arc = 1;
    }
    const on = v.light > 0;
    const reached = v.light >= 0.999;
    app.setLight(on, reached ? tr.spot : null, reached ? tr.arrived : 0);
  }
  function graphNow() {
    syncScene();
    rays.hitFractions(fractions);
    const angles = [];
    for (let i = 0; i < tr.hits.length; i++) if (fractions[i] != null && fractions[i] <= s.v.light + 1e-6) angles.push(tr.hits[i]);
    const shown = s.v.light > 0 && s.step !== 'intro' && s.step !== 'parts';
    graphBox.classList.toggle('off', !shown);
    graph.draw({ angles: shown ? angles : [], slots: 10, focus: shown ? rays.view.focus : -1 });
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  let bendHandle = null;
  let tiltHandle = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      () => rays.boxes(),
      () => action?.box(),
      () => action?.ringBox(),
      () => boxOf(rotateEl),
      () => boxOf(ui.$('.pvc-panel-toggle')),
      () => bendHandle?.box(),
      () => tiltHandle?.box(),
    ],
  });
  function boxOf(el) {
    if (!el || el.hidden) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const spot = (dx, dy) => ({ dx, dy });
  const ABOVE = [spot(0, -26), spot(22, -30), spot(-22, -30), spot(0, -46)];
  const BELOW = [spot(0, 28), spot(-24, 30), spot(24, 30), spot(0, 46)];
  const RIGHT = [spot(30, -18), spot(34, 0), spot(30, 22)];
  const LEFT = [spot(-30, -18), spot(-34, 0), spot(-30, 22)];
  // the lists of places, made once (a label is put again only when its list changes)
  const UP_SIDE = [...ABOVE, ...RIGHT, ...LEFT];
  const DOWN_SIDE = [...BELOW, ...RIGHT, ...LEFT];
  const BELOW_R = [...BELOW, ...RIGHT];
  const ABOVE_R = [...ABOVE, ...RIGHT];
  const BELOW_L = [...BELOW, ...LEFT];
  const ABOVE_L = [...ABOVE, ...LEFT];
  // label anchors are read every frame: a small ring of vectors, so nothing is made per frame
  const POOL = Array.from({ length: 32 }, () => new THREE.Vector3());
  let poolAt = 0;
  const W = (x, y, z = 0) => POOL[(poolAt = (poolAt + 1) % POOL.length)].set(x, y, z);
  const fw = (x, y, z = 0) => W(X0 + x, Y0 + y, z);
  const hitPoint = (i) => {
    const hit = tr.hits[i];
    return hit ? fw(hit.x, hit.y) : fw(0, 0);
  };
  const leakEnd = () => {
    const seg = tr.segs.find((x) => x.kind === 'clad');
    return seg ? fw(seg.a.x + (seg.b.x - seg.a.x) * 0.6, seg.a.y + (seg.b.y - seg.a.y) * 0.6) : fw(0, 0);
  };
  const critQ = () => s.mode === 'quiz' && s.quizKind === 'crit';
  /** A point of the fibre's plane dx cm along from the wall shown close up, at height y. */
  const closeAt = (dx, y) => fw((tr.hits[FOCUS_ONE]?.x ?? 26) + dx, y);
  const thetaAt = (i) => (tr.hits[i] ? shownTheta(tr.hits[i]) : 0);
  const LABELS = {
    core: {
      text: () => t('lbl_core', { n: N2(N_CORE) }),
      // on the near end face; in the test's close view, on the core beside the wall that is shown
      point: () => (critQ() ? closeAt(-3.2, 0.15) : W(X0 - 0.1, Y0 + FIBRE.core * 0.3, FIBRE.core * 0.5)),
      color: COLORS.ink,
      spots: [...LEFT, ...ABOVE],
      show: () => (s.mode !== 'quiz' && s.step === 'parts') || critQ(),
    },
    clad: {
      text: () => t('lbl_clad', { n: N2(N_CLAD_BOOK) }),
      point: () => (critQ() ? closeAt(2.6, -(FIBRE.core + FIBRE.clad) / 2) : W(X0 - 0.1, Y0 - (FIBRE.core + FIBRE.clad) / 2, 0.25)),
      color: '#1864ab',
      spots: [...BELOW, ...LEFT],
      show: () => (s.mode !== 'quiz' && s.step === 'parts') || critQ(),
    },
    coat: {
      text: () => t('lbl_coat'),
      point: () => W(X0 + 5, Y0 + FIBRE.jacket, -0.2),
      color: COLORS.ink,
      spots: [...ABOVE, ...RIGHT],
      show: () => s.mode !== 'quiz' && s.step === 'parts',
    },
    source: {
      text: () => t('lbl_source'),
      point: () => {
        const a = THREE.MathUtils.degToRad(s.v.alpha);
        const r = SOURCE_GAP + 5;
        return W(X0 - r * Math.cos(a), Y0 - r * Math.sin(a) + 1.2, 0);
      },
      color: COLORS.ink,
      spots: [...ABOVE, ...BELOW],
      show: () => s.mode !== 'quiz' && (s.step === 'light' || s.step === 'tilt') && !s.busy,
    },
    screen: {
      text: () => t('lbl_screen'),
      point: () => W(app.screenX + 0.2, Y0 + s.v.h + 4.6, 0),
      color: COLORS.ink,
      spots: [...ABOVE, ...RIGHT],
      show: () => s.mode !== 'quiz' && s.step === 'light' && !s.busy,
    },
    theta: {
      text: () => t('lbl_t1', { a: N(thetaAt(rays.view.focus)) }),
      point: () => hitPoint(rays.view.focus),
      color: C.ti,
      spots: () => (tr.hits[rays.view.focus]?.ny > 0 ? UP_SIDE : DOWN_SIDE),
      show: () => rays.view.focus >= 0 && rays.view.arc > 0.6 && !s.busy && (s.mode !== 'quiz' || s.quizShowTheta),
    },
    normal: {
      text: () => t('lbl_normal'),
      point: () => {
        const hit = tr.hits[rays.view.focus];
        return hit ? fw(hit.x - hit.nx * 1.0, hit.y - hit.ny * 1.0) : fw(0, 0);
      },
      color: '#343a40',
      spots: () => (tr.hits[rays.view.focus]?.ny > 0 ? BELOW_R : ABOVE_R),
      show: () => s.mode !== 'quiz' && s.step === 'one' && rays.view.normal > 0.9 && !s.busy,
    },
    crit: {
      text: () => t('lbl_tc', { c: N(THETA_C) }),
      point: () => {
        const hit = tr.hits[rays.view.focus];
        return hit ? fw(hit.x - 1.2, hit.y - hit.ny * 0.35) : fw(0, 0);
      },
      color: COLORS.critText,
      spots: () => (tr.hits[rays.view.focus]?.ny > 0 ? BELOW_L : ABOVE_L),
      show: () => s.mode !== 'quiz' && s.step === 'one' && rays.view.crit > 0.9 && !s.busy,
    },
    leak: {
      text: () => t('lbl_leak'),
      point: leakEnd,
      color: '#c2410c',
      spots: () => {
        const seg = tr.segs.find((x) => x.kind === 'clad');
        return seg && seg.b.y > seg.a.y ? ABOVE_R : BELOW_R;
      },
      show: () => s.step === 'tilt' && tr.leaked && s.v.light >= 1 && !s.busy && s.mode !== 'quiz',
    },
  };
  const placed = new Map();
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      const spots = typeof L.spots === 'function' ? L.spots() : L.spots;
      const text = want ? L.text() : '';
      const was = placed.get(id);
      if (want && anno.has(id) && was && was.spots !== spots) {
        anno.remove(id);
        placed.delete(id);
      }
      if (want && !anno.has(id)) {
        anno.add(id, { text, point: L.point, kind: 'chip', color: L.color, spots });
        placed.set(id, { spots, text });
      } else if (want && was && was.text !== text) {
        anno.setText(id, text);
        was.text = text;
      } else if (!want && anno.has(id)) {
        anno.remove(id);
        placed.delete(id);
      }
    }
  }

  // ── camera: a gentle three-quarter view per step ─────────────────────────────
  const BACK = -SOURCE_GAP - 9.5;
  const boxes = {
    all: () => new THREE.Box3(V(X0 + BACK - 0.5, Y0 - BEND_MAX - 1.5, -2), V(app.screenX + 1, Y0 + BEND_MAX + 1.5, 2)),
    end: () => new THREE.Box3(V(X0 - 1.5, Y0 - 2.6, -1.4), V(X0 + 9, Y0 + 2.6, 1.4)),
    close: () => {
      const hit = tr.hits[FOCUS_ONE] || { x: 15, y: 0.6 };
      return new THREE.Box3(V(X0 + hit.x - 6.5, Y0 - 2.2, -1), V(X0 + hit.x + 4.5, Y0 + 2.2, 1));
    },
    source: () => new THREE.Box3(V(X0 + BACK + 3, Y0 - 7.5, -1.5), V(X0 + 15, Y0 + 2.5, 1.5)),
  };
  const DIRS = {
    all: V(-0.75, 0.4, 1).normalize(),
    end: V(-0.85, 0.42, 0.95).normalize(),
    close: V(0.2, 0.16, 1).normalize(),
    follow: V(0.22, 0.2, 1).normalize(),
    source: V(0.12, 0.2, 1).normalize(),
  };
  const poses = {};
  const followPoses = [];
  const FOLLOW_N = 9;
  function fitPoses() {
    const args = { camera, width: stage.width, height: stage.height, margin: MARGIN };
    for (const k of Object.keys(boxes)) {
      const p = fitPose({ box: boxes[k](), dir: DIRS[k], ...args });
      poses[k] = { position: p.position, target: p.target };
    }
    // the follow camera: a window about 30 cm long round the light's front, at points along the fibre
    followPoses.length = 0;
    for (let i = 0; i < FOLLOW_N; i++) {
      const x = X0 - 8 + ((FIBRE.length + 14) * i) / (FOLLOW_N - 1);
      const box = new THREE.Box3(V(x - 13, Y0 - 3, -1.5), V(x + 13, Y0 + 3, 1.5));
      const p = fitPose({ box, dir: DIRS.follow, ...args });
      followPoses.push({ x, position: p.position, target: p.target });
    }
  }
  const guided = { position: V(0, 0, 0), target: V(0, 0, 0) };
  let follow = 0; // 0…1: how much the light's follow camera has the view
  const frontAt = V(0, 0, 0);
  function lightFront() {
    // where the light's front is now (the main path at v.light)
    const reach = s.v.light * rays.total;
    let done = 0;
    for (const sg of tr.segs) {
      if (sg.kind === 'clad') continue;
      const len = Math.hypot(sg.b.x - sg.a.x, sg.b.y - sg.a.y);
      if (done + len >= reach) {
        const k = (reach - done) / Math.max(1e-6, len);
        return frontAt.set(sg.a.x + (sg.b.x - sg.a.x) * k, sg.a.y + (sg.b.y - sg.a.y) * k, 0);
      }
      done += len;
    }
    const last = tr.segs[tr.segs.length - 1];
    return frontAt.set(last.b.x, last.b.y, 0);
  }
  function guidedPose() {
    const p = poses[s.mode === 'quiz' ? quizCam : CAM[s.step]] || poses.all;
    guided.position.copy(p.position);
    guided.target.copy(p.target);
    if (follow > 0 && followPoses.length) {
      const fx = X0 + lightFront().x;
      let i = 0;
      while (i < followPoses.length - 2 && followPoses[i + 1].x < fx) i++;
      const a = followPoses[i];
      const b = followPoses[i + 1];
      const k = Math.min(1, Math.max(0, (fx - a.x) / (b.x - a.x)));
      const ft = tmpT.lerpVectors(a.target, b.target, k);
      const fp = tmpP.lerpVectors(a.position, b.position, k);
      // the bend lifts the light: the window follows it up
      const dy = lightFront().y;
      ft.y += dy;
      fp.y += dy;
      guided.target.lerp(ft, follow);
      guided.position.lerp(fp, follow);
    }
    return guided;
  }
  const tmpT = V(0, 0, 0);
  const tmpP = V(0, 0, 0);
  let camK = 1;
  let camFrom = null;
  function applyCamera() {
    if (s.userMovedCamera) return;
    const g = guidedPose();
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, g.position, k);
      controls.target.lerpVectors(camFrom.target, g.target, k);
    } else {
      camera.position.copy(g.position);
      controls.target.copy(g.target);
    }
    controls.update();
  }
  /** The guided camera flies from wherever it is now to the step's pose. */
  function flyFrom(duration) {
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = duration ? 0 : 1;
    if (!duration) return Promise.resolve(true);
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camK = k;
        stage.invalidate();
      },
      onComplete: () => {
        camK = 1;
      },
    }).finished;
  }
  /** The guided camera takes the view back. */
  function takeView(duration = T.fly) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      rotate.home();
    }
    if (s.view !== 'front') {
      s.view = 'front';
      syncUI();
      emit('view', { view: s.view });
    }
    return flyFrom(duration);
  }
  function beginOrbit() {
    if (s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
      emitChange();
    }
  }
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${t.num(360)}°`,
    label: t('view_rotate'),
    pulse: Boolean(o.coach),
    zoom: [0.35, 2.2],
    when: () => s.mode !== 'quiz',
    onTurn: beginOrbit,
  });
  rotateEl = rotate.el;
  function setView(view, { animate = true } = {}) {
    if (view === '3d') {
      // a turned view: the same pose seen from further round
      s.view = '3d';
      s.userMovedCamera = true;
      tweener.cancel('camera');
      const g = guidedPose();
      const off = camera.position.clone().sub(controls.target);
      off.applyAxisAngle(V(0, 1, 0), 0.7);
      camera.position.copy(g.target).add(off);
      controls.target.copy(g.target);
      controls.update();
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p = takeView(animate ? T.fly : 0);
    emitChange();
    return p;
  }
  stage.onBeforeRender(() => {
    syncScene();
    applyCamera();
    camera.updateMatrixWorld();
  });
  stage.onAfterRender(() => {
    syncLabels();
  });
  stage.onResize(() => {
    // the scale note only where the view has room for it beside the handles' words
    note.hidden = stage.height < 260;
    fitPoses();
    steadySheet();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  /** Moves some of the values to where they go, together, over `duration` seconds. */
  function tweenTo(to, duration, my, easing = ease.inOutCubic) {
    const from = { ...s.v };
    return tweener
      .animate({
        key: 'step',
        duration,
        ease: easing,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const key of Object.keys(to)) s.v[key] = from[key] + (to[key] - from[key]) * k;
          stage.invalidate();
          graphNow();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  const wait = (sec, my) => tweener.animate({ key: 'wait', duration: sec }).finished.then((ok) => ok && my === s.run);
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    tweener.cancel('wait');
    tweener.cancel('follow');
    follow = 0;
    s.busy = false;
  }
  /** The light sent along the fibre, the camera following its front. */
  async function sendLight(my) {
    s.v.light = 0;
    await tweener.animate({
      key: 'follow',
      duration: 0.9,
      onUpdate: (k) => {
        if (my === s.run) follow = ease.inOutCubic(k);
        stage.invalidate();
      },
    }).finished;
    if (my !== s.run) return false;
    camFrom = null;
    camK = 1;
    if (!(await tweenTo({ light: 1 }, T.light, my, ease.linear))) return false;
    audio.success?.();
    if (!(await wait(0.6, my))) return false;
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    follow = 0;
    camK = 0;
    await tweener.animate({ key: 'camera', duration: T.back, onUpdate: (k) => (camK = k), onComplete: () => (camK = 1) }).finished;
    return my === s.run;
  }
  async function go(step, { animate = true } = {}) {
    if (!(step in TARGET)) return;
    const from = s.step;
    stopAll();
    const my = s.run;
    s.step = step;
    hintOff();
    const goal = TARGET[step];
    if (!animate) {
      Object.assign(s.v, goal);
      takeView(0);
      s.busy = false;
      done();
      return;
    }
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    const order = ['intro', ...STEPS];
    const next = order.indexOf(step) === order.indexOf(from) + 1;
    if (step === 'light' && (next || from === step)) {
      // the light goes out first if it was on, then it is sent with the camera following it
      Object.assign(s.v, { h: goal.h, alpha: goal.alpha, marks: 0, light: 0 });
      takeView(T.jump);
      if (!(await wait(0.4, my))) return;
      if (!(await sendLight(my))) return;
    } else if (step === 'one' && (next || from === step)) {
      await takeView(T.fly);
      if (my !== s.run) return;
      s.v.marks = 0;
      if (!(await wait(0.3, my))) return;
      if (!(await tweenTo({ marks: 1 }, T.normal + T.arc + T.crit, my, ease.linear))) return;
    } else if (step === 'bend' && (next || from === step)) {
      Object.assign(s.v, { marks: 0, light: 1, alpha: goal.alpha });
      if (from === step) s.v.h = 0;
      await takeView(T.fly);
      if (my !== s.run) return;
      if (!(await tweenTo({ h: goal.h }, T.bend, my))) return;
    } else if (step === 'tilt' && (next || from === step)) {
      Object.assign(s.v, { marks: 0, light: 1 });
      if (from === step) s.v.alpha = ALPHA_START;
      await takeView(T.fly);
      if (my !== s.run) return;
      if (!(await tweenTo({ alpha: goal.alpha }, T.tilt, my))) return;
    } else {
      // a jump (a step word, back, several at once): the camera flies and the values land together
      takeView(T.fly);
      if (!(await tweenTo(goal, T.jump, my))) return;
    }
    s.busy = false;
    done();
  }
  function done() {
    graphNow();
    refresh();
    emitChange();
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_look', 1, ICONS.hand],
    parts: ['act_light', 2, ICONS.hand],
    light: ['act_one', 3, ICONS.hand],
    one: ['act_bend', 4, ICONS.hand],
    bend: ['act_tilt', 5, ICONS.hand],
    tilt: ['act_quiz', '', ICONS.chevR],
  };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const replayBtn = /** @type {HTMLButtonElement} */ ($('[data-act="replay"]'));
  /**
   * Steady layout: the 3D keeps one size in every state. Below the 3D (a phone held upright) the শেখো sheet is made as
   * tall as its tallest state: the calm card and each step's lead-in, result and rule are written in turn, measured, and
   * put back, all before the next paint. Beside the 3D the panel's height does not change the 3D's.
   */
  const outcomeEl = $('.pvc-outcome');
  const ruleEl = $('.pvc-rule');
  function steadySheet() {
    ui.learn.style.minHeight = '';
    ui.quiz.style.minHeight = '';
    const side = root.clientWidth >= 600 && root.clientWidth >= root.clientHeight;
    root.classList.toggle('of-side', side);
    if (side) return;
    const keep = [lead.innerHTML, outcomeEl.innerHTML, ruleEl.innerHTML, ui.learn.classList.contains('of-calm'), lead.classList.contains('pvc-note')];
    let tallest = 0;
    // measured as in the শেখো tab (the test hides the how-to row), whatever tab is open now
    const mode = root.dataset.mode;
    root.dataset.mode = 'explore';
    const tryState = (calm, l, out, rule) => {
      ui.learn.classList.toggle('of-calm', calm);
      lead.classList.toggle('pvc-note', calm);
      lead.innerHTML = l;
      outcomeEl.innerHTML = out;
      ruleEl.innerHTML = rule;
      tallest = Math.max(tallest, ui.learn.offsetHeight);
    };
    const vars = { c: N(THETA_C), n1: N2(N_CLAD_BOOK), n2: N2(N_CORE), s: N('0.967'), a: N(88), k: N(12), p: N(88) };
    tryState(true, leadOf('intro'), '', '');
    const outs = {
      parts: ['out_parts'],
      light: ['out_light'],
      one: ['out_one'],
      bend: ['out_bend', 'out_none'],
      tilt: ['out_tilt_ok', 'out_tilt_some', 'out_tilt_none'],
    };
    for (const step of STEPS) for (const out of outs[step]) tryState(false, leadOf(step), t(out, vars), t(`rule_${step}`, vars));
    [lead.innerHTML, outcomeEl.innerHTML, ruleEl.innerHTML] = keep;
    ui.learn.classList.toggle('of-calm', keep[3]);
    lead.classList.toggle('pvc-note', keep[4]);
    root.dataset.mode = mode;
    ui.learn.style.minHeight = `${tallest}px`;
    // the test's sheet as tall as the learn sheet, so the 3D keeps its height in the test too
    ui.quiz.style.minHeight = `${tallest}px`;
  }
  function leadOf(step) {
    if (step === 'intro') return `<span class="of-long">${t('intro')}</span><span class="of-short">${t('intro_short')}</span>`;
    return t(`lead_${step}`);
  }
  const steady = { lead: '', act: '' };
  function minWall() {
    let k = -1;
    for (let i = 0; i < tr.hits.length; i++) if (k < 0 || tr.hits[i].theta < tr.hits[k].theta - 0.05) k = i;
    return k;
  }
  function outcomeNow() {
    retrace();
    const vars = { c: N(THETA_C), n1: N2(N_CLAD_BOOK), n2: N2(N_CORE) };
    switch (s.step) {
      case 'parts':
        return t('out_parts', vars);
      case 'light':
        return t('out_light', { k: N(tr.hits.length) });
      case 'one': {
        const i = Math.min(FOCUS_ONE, tr.hits.length - 1);
        return t('out_one', { ...vars, a: N(thetaAt(i)) });
      }
      case 'bend':
      case 'tilt': {
        const k = minWall();
        if (k < 0) return t('out_none');
        const a = N(thetaAt(k));
        if (!tr.leaked) return t(s.step === 'bend' ? 'out_bend' : 'out_tilt_ok', { ...vars, a });
        const p = Math.round(tr.arrived * 100);
        return t(p > 0 ? 'out_tilt_some' : 'out_tilt_none', { ...vars, a, p: N(p) });
      }
      default:
        return '';
    }
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = s.busy && !calm ? steady.lead : leadOf(s.step);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('of-calm', calm);
    }
    const vars = { c: N(THETA_C), n1: N2(N_CLAD_BOOK), n2: N2(N_CORE), s: N('0.967') };
    sheet.outcome(calm || s.busy ? '' : outcomeNow());
    sheet.rule(calm || s.busy ? '' : t(`rule_${s.step}`, vars));
    sheet.choose(calm ? null : s.step);
    const order = ['intro', ...STEPS];
    sheet.next(order[order.indexOf(s.step) + 1] ?? null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      if (step !== '' && enabled && s.mode === 'explore' && o.coach && s.step === 'intro') action.show('scene');
      else action.hide('scene');
    }
    homeBtn.hidden = s.step === 'intro';
    homeBtn.disabled = s.busy;
    replayBtn.hidden = s.step === 'intro';
    replayBtn.disabled = s.busy;
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the fibre's near end ─────────────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const order = ['intro', ...STEPS];
    const next = order[order.indexOf(s.step) + 1];
    if (next) return go(next);
    return quiz.start();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_look',
    icon: ICONS.hand,
    target: () => W(X0 + 4, Y0, 0),
    radius: 26,
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── dragging: the far clamp up and down (the bend), the source round its pivot (the tilt) ──
  const canBend = () => s.mode === 'explore' && !s.busy && s.step === 'bend';
  const canTilt = () => s.mode === 'explore' && !s.busy && s.step === 'tilt';
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(V(0, 0, 1), 0);
  const hitP = V(0, 0, 0);
  /** The pointer (canvas px) on the plane z = z0, or null. */
  function onPlane(x, y, z0) {
    ndc.set((x / stage.width) * 2 - 1, -(y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    plane.constant = -z0;
    return raycaster.ray.intersectPlane(plane, hitP);
  }
  const clampH = (h) => Math.max(-BEND_MAX, Math.min(BEND_MAX, h));
  const clampA = (a) => Math.max(0, Math.min(ALPHA_MAX, a));
  function setBendNow(h) {
    const v = Math.round(clampH(h) * 10) / 10;
    if (v === s.v.h) return;
    if (Math.round(v) !== Math.round(s.v.h)) audio.tick?.();
    s.v.h = v;
    changed();
  }
  function setTiltNow(a) {
    const v = Math.round(clampA(a) * 10) / 10;
    if (v === s.v.alpha) return;
    if (Math.round(v) !== Math.round(s.v.alpha)) audio.tick?.();
    s.v.alpha = v;
    changed();
  }
  function changed() {
    retrace();
    graphNow();
    sheet.outcome(outcomeNow());
    stage.invalidate();
    emitChange();
  }
  const bossAt = V(0, 0, 0);
  bendHandle = createDragHandle(stage, {
    point: () => bossAt.set(app.farX, Y0 + s.v.h + 5, app.POST_Z),
    axis: 'y',
    direction: V(0, 1, 0),
    track: { from: V(app.farX, Y0 - BEND_MAX + 5, app.POST_Z), to: V(app.farX, Y0 + BEND_MAX + 5, app.POST_Z) },
    label: t('drag_bend'),
    labelAt: 'right',
    aria: t('aria_bend'),
    pulse: Boolean(o.coach),
    when: canBend,
    onStart: (d) => {
      const p = onPlane(d.x, d.y, app.POST_Z);
      s.drag = { what: 'bend', off: p ? s.v.h - (p.y - Y0) : 0 };
      controls.enabled = false;
      audio.unlock();
      emit('dragstart', { part: 'bend' });
    },
    onMove: (d) => {
      const p = onPlane(d.x, d.y, app.POST_Z);
      if (p && s.drag) setBendNow(p.y - Y0 + s.drag.off);
    },
    onEnd: () => {
      s.drag = null;
      controls.enabled = true;
      emit('dragend', { part: 'bend' });
      refresh();
    },
    onKey: (dir) => {
      if (canBend()) setBendNow(s.v.h + dir);
    },
  });
  const backAt = V(0, 0, 0);
  const arcAt = (deg) => {
    const a = THREE.MathUtils.degToRad(deg);
    const r = SOURCE_GAP + 9.5 - 1.2;
    return V(X0 - r * Math.cos(a), Y0 - r * Math.sin(a), 0);
  };
  tiltHandle = createDragHandle(stage, {
    point: () => {
      const a = THREE.MathUtils.degToRad(s.v.alpha);
      const r = SOURCE_GAP + 9.5 - 1.2;
      return backAt.set(X0 - r * Math.cos(a), Y0 - r * Math.sin(a), 0);
    },
    axis: 'turn',
    track: { from: arcAt(0), to: arcAt(ALPHA_MAX), via: arcAt(ALPHA_MAX / 2) },
    label: t('drag_tilt'),
    labelAt: 'left',
    aria: t('aria_tilt'),
    pulse: Boolean(o.coach),
    when: canTilt,
    onStart: () => {
      s.drag = { what: 'tilt' };
      controls.enabled = false;
      audio.unlock();
      emit('dragstart', { part: 'tilt' });
    },
    onMove: (d) => {
      const p = onPlane(d.x, d.y, 0);
      if (!p) return;
      const dx = X0 - p.x;
      const dy = Y0 - p.y;
      if (Math.hypot(dx, dy) < 2) return;
      setTiltNow(THREE.MathUtils.radToDeg(Math.atan2(dy, dx)));
    },
    onEnd: () => {
      s.drag = null;
      controls.enabled = true;
      emit('dragend', { part: 'tilt' });
      refresh();
    },
    onKey: (dir) => {
      if (canTilt()) setTiltNow(s.v.alpha + dir);
    },
  });

  // ── how to use, in the panel: the rotate pill, the সামনে button, the two handles ──
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      {
        kind: 'drag',
        axis: 'y',
        text: t('howto_bend'),
        aria: t('aria_bend'),
        handle: bendHandle,
        when: () => s.step === 'bend',
      },
      { kind: 'drag', axis: 'turn', text: t('howto_tilt'), aria: t('aria_tilt'), handle: tiltHandle, when: () => s.step === 'tilt' },
    ],
    { stage, collapse: true },
  );

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
    const k = minWall();
    return {
      step: s.step,
      busy: s.busy,
      light: Math.round(s.v.light * 1000) / 1000,
      h: Math.round(s.v.h * 10) / 10,
      alpha: Math.round(s.v.alpha * 10) / 10,
      walls: tr.hits.length,
      theta: tr.hits.map((x) => Math.round(x.theta * 10) / 10),
      minTheta: k >= 0 ? thetaAt(k) : null,
      critical: THETA_C,
      leaked: tr.leaked,
      arrived: Math.round(tr.arrived * 1000) / 1000,
      next: { intro: 'look', parts: 'light', light: 'one', one: 'bend', bend: 'tilt', tilt: 'quiz' }[s.step],
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.h, snap.alpha]);
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
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="of-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const words = (keys) => keys.map((key) => ({ key }));
  /** The five questions: what happens at this wall, the book's θc, why no light arrives, why the bent fibre works, which light. */
  const KINDS = ['what', 'crit', 'leak', 'bend', 'ir'];
  /** Each question's scene: the step's values, the wall ringed, the light drawn so far, θ₁ shown. */
  function quizScene(kind) {
    s.quizShowTheta = false;
    s.quizFocus = -1;
    if (kind === 'what') {
      const tirCase = Math.random() < 0.5;
      // θ₁ = 80° or 70° at a straight wall
      const alpha = tirCase ? 15.7 : 30.3;
      Object.assign(s.v, { h: 0, alpha, light: 0, marks: 0 });
      s.step = 'one';
      retrace();
      s.quizFocus = 0;
      s.quizShowTheta = true;
      rays.hitFractions(fractions);
      s.v.light = fractions[0] ?? 0.2;
      return { cam: 'source', tir: tr.hits[0]?.tir ?? tirCase };
    }
    if (kind === 'crit') {
      Object.assign(s.v, { h: 0, alpha: ALPHA_START, light: 1, marks: 0 });
      s.step = 'one';
      return { cam: 'close' };
    }
    if (kind === 'leak') {
      Object.assign(s.v, { h: 0, alpha: 33, light: 1, marks: 0 });
      s.step = 'tilt';
      retrace();
      s.quizFocus = 0;
      s.quizShowTheta = true;
      return { cam: 'source' };
    }
    if (kind === 'bend') {
      Object.assign(s.v, { h: -BEND_TO, alpha: ALPHA_START, light: 1, marks: 0 });
      s.step = 'bend';
      return { cam: 'all' };
    }
    Object.assign(s.v, { h: 0, alpha: ALPHA_START, light: 1, marks: 0 });
    s.step = 'light';
    return { cam: 'all' };
  }
  const deg = (x) => `${N(x)}°`;
  let quizCam = 'all'; // during the test, the camera looks where the question says
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
        learnSaved = s.step;
        stopAll();
        s.mode = 'quiz';
        s.locked = true;
        s.drag = null;
        controls.enabled = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizKind = '';
        s.quizFocus = -1;
        s.quizShowTheta = false;
        syncUI();
        go(learnSaved && learnSaved !== 'intro' ? learnSaved : 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        s.quizKind = kind;
        stopAll();
        const sc = quizScene(kind);
        quizCam = sc.cam;
        trKey = '';
        retrace();
        graphNow();
        takeView(0);
        stage.invalidate();
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        question = { kind, tir: sc.tir };
        if (kind === 'what') {
          const right = sc.tir ? 'c_wh_tir' : 'c_wh_leak';
          const others = ['c_wh_tir', 'c_wh_leak', 'c_wh_air', 'c_wh_stop'].filter((k) => k !== right);
          return { text: t('q_what', { a: N(thetaAt(0)) }), ...choicesOf(words([right, ...others]), kind, (x) => t(x.key)) };
        }
        if (kind === 'crit') {
          const items = [75, 42, 15, 44].map((v, j) => ({ key: ['right', 'air', 'wall', 'clad'][j], v }));
          return { text: t('q_crit'), ...choicesOf(items, kind, (x) => deg(x.v)) };
        }
        if (kind === 'leak')
          return { text: t('q_leak'), ...choicesOf(words(['c_lk_right', 'c_lk_more', 'c_lk_absorb', 'c_lk_same']), kind, (x) => t(x.key)) };
        if (kind === 'bend')
          return { text: t('q_bend'), ...choicesOf(words(['c_bd_right', 'c_bd_curve', 'c_bd_mirror', 'c_bd_coat']), kind, (x) => t(x.key)) };
        return { text: t('q_ir'), ...choicesOf(words(['c_ir_right', 'c_ir_seen', 'c_ir_uv', 'c_ir_straight']), kind, (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const vars = { c: N(THETA_C), n1: N2(N_CLAD_BOOK), n2: N2(N_CORE), s: N('0.967'), v: N(q.list?.[picked]?.v ?? '') };
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], vars)}` : '');
        if (k === 'what') {
          // the rest of the light, now that the answer is in
          s.v.light = 1;
          stage.invalidate();
          const a = N(thetaAt(0));
          return question.tir
            ? t('why_wh_tir', { a, c: N(THETA_C) }) + note({ c_wh_leak: 'mis_wh_leak_tir', c_wh_air: 'mis_wh_air', c_wh_stop: 'mis_wh_stop' })
            : t('why_wh_leak', { a, c: N(THETA_C) }) + note({ c_wh_tir: 'mis_wh_tir_leak', c_wh_air: 'mis_wh_air', c_wh_stop: 'mis_wh_stop' });
        }
        if (k === 'crit') return t('why_crit', vars) + note({ air: 'mis_cr_air', wall: 'mis_cr_wall', clad: 'mis_cr_clad' });
        if (k === 'leak')
          return (
            t('why_leak', { ...vars, a: N(thetaAt(0)) }) + note({ c_lk_more: 'mis_lk_more', c_lk_absorb: 'mis_lk_absorb', c_lk_same: 'mis_lk_same' })
          );
        if (k === 'bend')
          return (
            t('why_bend', { a: N(thetaAt(minWall())) }) + note({ c_bd_curve: 'mis_bd_curve', c_bd_mirror: 'mis_bd_mirror', c_bd_coat: 'mis_bd_coat' })
          );
        return t('why_ir') + note({ c_ir_seen: 'mis_ir_seen', c_ir_uv: 'mis_ir_uv', c_ir_straight: 'mis_ir_straight' });
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
  function goHome() {
    return go('intro', { animate: false });
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && s.mode === 'explore') {
      if (s.busy && b.dataset.example === s.step) return;
      go(b.dataset.example);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'home') goHome();
    else if (b.dataset.act === 'replay' && !s.busy && s.step !== 'intro') go(s.step);
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
    const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const sceneKey = ['r', 'R', 'Home', ...arrows].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (arrows.includes(k) && onButton && tgt.closest('.pvc-examples')) return; // the row of steps has its own keys
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if ((k === 'ArrowUp' || k === 'ArrowDown') && !onButton) {
      if (canBend()) setBendNow(s.v.h + (k === 'ArrowUp' ? 1 : -1));
      else bendHint();
    } else if ((k === 'ArrowLeft' || k === 'ArrowRight') && !onButton) {
      if (canTilt()) setTiltNow(s.v.alpha + (k === 'ArrowRight' ? 1 : -1));
      else bendHint();
    } else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });
  function bendHint() {
    if (!s.busy) showHint(t('hint_keys'), { duration: 2600 });
  }

  // ── start ───────────────────────────────────────────────────────────────────
  fitPoses();
  syncUI();
  steadySheet();
  retrace();
  syncScene();
  applyCamera();
  refresh();
  graphNow();
  // later parts are made at load; the light's spot is shown for the shader warm-up
  stage.warmUp?.({ show: [app.root.getObjectByName('Spot')] });
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
     * Change any of: step ('intro' | 'parts' | 'light' | 'one' | 'bend' | 'tilt'), h (the far end's rise, cm, ±10), alpha
     * (the source's tilt, degrees, 0…40), view ('front' | '3d'). animate: false lands at once. h and alpha apply after
     * the step (they are the drags of steps ④ and ⑤).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.step) await go(p.step, { animate });
      if (p.h != null) {
        s.v.h = clampH(Number(p.h));
        changed();
      }
      if (p.alpha != null) {
        s.v.alpha = clampA(Number(p.alpha));
        changed();
      }
      if (p.view) await setView(p.view, { animate });
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await setView('front', { animate: false });
      await goHome();
      bendHandle.rearm();
      tiltHandle.rearm();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** The view with the light drawn on it, cover-fitted to the size asked for (background: null keeps it transparent). */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      stage.render();
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      const ctx = c.getContext('2d');
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }
      const gl = stage.canvas;
      const k = Math.max(width / gl.width, height / gl.height);
      const x = (width - gl.width * k) / 2;
      const y = (height - gl.height * k) / 2;
      ctx.drawImage(gl, x, y, gl.width * k, gl.height * k);
      ctx.drawImage(rays.canvas, x, y, gl.width * k, gl.height * k);
      return c.toDataURL('image/png');
    },
    /** The fibre, its holders, the source and the screen, in centimetres (the GLB is scaled to metres). */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'OpticalFibre';
      const copy = app.root.clone(true);
      copy.traverse((ob) => {
        if (ob.name !== 'Spot') ob.visible = true;
      });
      g.add(copy);
      return g;
    },
  };
}
