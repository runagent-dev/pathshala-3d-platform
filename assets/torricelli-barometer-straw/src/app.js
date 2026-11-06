// The straw (book page 145, topic 5.4.1), student view. A clear glass of cold drink on a plain table, a clear straw in
// it, and the straw's top end in a plain cut-away of a mouth (no face). The air is drawn as small particles: the same
// crowd over the drink and inside the mouth. Three steps, one tap each, slow: ① the pressures are equal (outlined
// arrows: the outside air on the drink, the air in the mouth), nothing rises; ② sucking thins the mouth's air, its
// arrows get fewer and shorter, and the outside air pushes the drink up the straw (one arrow up the straw: কার্যকর বল);
// ③ the camera pulls back to a 10.5 m straw beside a person and a scale: the drink stops at 10.3 m. A calm card on the
// first screen, then one lead-in line, the result and the rule per step; the kit's how-to row; a four-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAir } from './air.js';
import { boldArrow } from './arrows.js';
import { fitPose } from './camera.js';
import { createGlass, DRINK_Y, LIPS, REST_U, STRAW, STRAW_END } from './glass.js';
import { createI18n } from './i18n.js';
import { H_WATER, STEPS, toCm, waterChoices } from './reading.js';
import { backdrop, createTable } from './setting.js';
import { BIG, createTall, TALL } from './tall.js';

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

/** Three meanings, three colours: the outside air (as its particles), the air in the mouth (as its particles), the net push. */
const COLORS = { outside: '#15aabf', mouth: '#9775fa', net: '#37b24d', ink: '#1d2733' };
const ARROW_R = 0.0009; // the arrows' shaft (m), thickened to a few pixels by thick()
const LA = 0.017; // an air arrow at the outside air's pressure (m)
const NET_LEN = 0.056;
const NET_Y = DRINK_Y + 0.026; // the net push starts above the outside air's arrows
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 14, side: 10 };
// how long things take (s): slow enough to follow
const T = { arrows: 1.6, thin: 2, net: 0.8, rise: 2.8, far: 3, tall: 3, back: 1.8, fly: 1.2 };
/** Where each step ends: arrows shown, the mouth's air thinned, the net push, the drink risen, the camera far, the tall drink. */
const TARGET = {
  intro: { arrows: 0, thin: 0, net: 0, rise: 0, far: 0, tall: 0 },
  rest: { arrows: 1, thin: 0, net: 0, rise: 0, far: 0, tall: 0 },
  suck: { arrows: 1, thin: 1, net: 1, rise: 1, far: 0, tall: 0 },
  max: { arrows: 1, thin: 1, net: 1, rise: 1, far: 1, tall: 1 },
};
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const DOWN = V(0, -1, 0);
const UP = V(0, 1, 0);
/** The outside air's arrows: where they land on the drink (x, z), spread round the straw. */
const OUT_AT = [
  [-0.026, 0.012],
  [-0.011, 0.02],
  [0.027, 0.006],
  [-0.004, -0.021],
];
/** The mouth's arrows, in the mouth's own frame: they point at the straw's end, from inside the mouth (degrees off the straw). */
const MOUTH_AT = [0, -32, 32];

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'tb');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      tight: true,
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the line before the action: what the next tap will show (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'tb-lead';
  $('.pvc-act-row').before(lead);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 400, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.2);
  sun.position.set(0.9, 1.6, 1.1);
  sun.target.position.set(0, 0.08, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.6);
  fill.position.set(-1.6, 0.8, 1.4);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.004;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -0.25, right: 0.25, top: 0.32, bottom: -0.25, near: 0.8, far: 3 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const table = createTable();
  const glass = createGlass();
  const air = createAir(glass.mouth);
  const tall = createTall();
  scene.add(table.root, glass.root, air.mesh, tall.root);

  // ── the arrows: the outside air on the drink, the air in the mouth, the net push up the straw ──
  const outArrows = OUT_AT.map((_, i) => boldArrow(`AirOnDrink${i}`, COLORS.outside, ARROW_R));
  const mouthArrows = MOUTH_AT.map((_, i) => boldArrow(`AirInMouth${i}`, COLORS.mouth, ARROW_R, { order: 36 }));
  const net = boldArrow('NetForce', COLORS.net, ARROW_R * 1.25, { order: 42 });
  for (const a of [...outArrows, ...mouthArrows, net]) scene.add(a.root);
  // the mouth's arrows in the world: each points at the straw's end, from inside the mouth
  // (the side ones land a little above and below the opening, so their heads stay apart on a small screen)
  const intoStraw = STRAW_END.clone().sub(LIPS).normalize().negate(); // from the mouth's inside toward the lips
  const across = V(-intoStraw.y, intoStraw.x, 0);
  const mouthDirs = MOUTH_AT.map((deg) => intoStraw.clone().applyAxisAngle(V(0, 0, 1), THREE.MathUtils.degToRad(deg)));
  const mouthTips = MOUTH_AT.map((deg) =>
    STRAW_END.clone()
      .addScaledVector(intoStraw, -0.003)
      .addScaledVector(across, -Math.sign(deg) * 0.0058),
  );

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
    quizKind: '',
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the scene from the state ────────────────────────────────────────────────
  function perPixel() {
    return (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
  }
  const thick = () => Math.min(3.2, Math.max(1, (2.6 * perPixel()) / ARROW_R));
  const near = () => s.v.far < 0.02;
  const P0 = V(0, 0, 0);
  function syncScene() {
    const v = s.v;
    const close = near();
    const k = thick();
    glass.root.scale.setScalar(1 + (BIG - 1) * v.far);
    for (const m of glass.strawParts) m.visible = close;
    air.mesh.visible = close;
    air.setThin(v.thin);
    glass.setLevel(REST_U + (1 - REST_U) * v.rise);
    tall.set(Math.min(1, v.far * 1.05), v.tall);
    // the outside air: the same length always (its pressure does not change)
    outArrows.forEach((a, i) => {
      const len = LA * v.arrows;
      a.root.visible = close && len > 1e-4;
      if (!a.root.visible) return;
      P0.set(OUT_AT[i][0], DRINK_Y + 0.0015 + len, OUT_AT[i][1]);
      a.set(P0, DOWN, len);
      a.scale(k);
    });
    // the mouth's air: shorter as it thins out, and only the middle arrow stays
    mouthArrows.forEach((a, i) => {
      const len = LA * v.arrows * (1 - 0.55 * v.thin);
      const fade = i === 0 ? 1 : 1 - Math.min(1, v.thin * 1.6);
      a.root.visible = close && len > 1e-4 && fade > 0.02;
      if (!a.root.visible) return;
      P0.copy(mouthTips[i]).addScaledVector(mouthDirs[i], -len);
      a.set(P0, mouthDirs[i], len);
      a.setOpacity(fade);
      a.scale(k);
    });
    // the net push: up the straw, beside it
    const nl = NET_LEN * v.net;
    net.root.visible = close && nl > 1e-4;
    if (net.root.visible) {
      net.set(V(STRAW.x + 0.009, NET_Y, STRAW.z), UP, nl);
      net.scale(k * 1.05);
    }
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const A0 = { x: 0, y: 0 };
  const A1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  const arrowBox = (a) => {
    toScreen(a.root.position, A0);
    toScreen(a.tip, A1);
    return { left: Math.min(A0.x, A1.x) - 6, top: Math.min(A0.y, A1.y) - 6, right: Math.max(A0.x, A1.x) + 6, bottom: Math.max(A0.y, A1.y) + 6 };
  };
  const arrowBoxes = () => [...outArrows, ...mouthArrows, net].filter((a) => a.root.visible).map(arrowBox);
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, arrowBoxes, () => action?.box(), () => action?.ringBox(), () => boxOf(rotateEl)],
  });
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(16, 0), spot(16, -18), spot(16, 18), spot(24, -34)];
  const LEFT_OF = [spot(-16, 0), spot(-16, -18), spot(-16, 18), spot(-24, -34)];
  const ABOVE = [spot(0, -20), spot(18, -20), spot(-18, -20), spot(0, -36)];
  const BELOW = [spot(0, 22), spot(-20, 22), spot(20, 22)];
  const mouthTop = V(-0.045, 0.024, 0);
  const LABELS = {
    outside: {
      text: () => t('lbl_outside'),
      point: () => V(OUT_AT[0][0], DRINK_Y + LA * 0.75, OUT_AT[0][1]),
      color: COLORS.outside,
      spots: [...LEFT_OF, ...BELOW],
      show: () => near() && s.v.arrows > 0.5,
    },
    mouth: {
      text: () => t('lbl_mouth'),
      point: () => glass.mouth.localToWorld(tmp.copy(mouthTop)).clone(),
      color: COLORS.mouth,
      spots: [...ABOVE, ...LEFT_OF],
      show: () => near(),
    },
    net: {
      text: () => t('lbl_net'),
      point: () => V(STRAW.x + 0.009, NET_Y + NET_LEN * 0.6, STRAW.z),
      color: COLORS.net,
      spots: RIGHT_OF,
      show: () => near() && s.v.net > 0.6,
    },
    max: {
      text: () => t('lbl_max', { h: N(H_WATER) }),
      point: () => V(TALL.scaleX, TALL.max, 0),
      color: COLORS.ink,
      spots: RIGHT_OF,
      show: () => s.v.tall > 0.99 && s.quizKind !== 'max',
    },
    five: {
      text: () => t('lbl_five', { h: N(5) }),
      point: () => V(TALL.scaleX, TALL.level + 5, 0),
      color: COLORS.ink,
      spots: RIGHT_OF,
      show: () => s.v.far > 0.95,
    },
    person: {
      text: () => t('lbl_person'),
      point: () => V(TALL.personX, TALL.person + 0.05, 0),
      color: COLORS.ink,
      spots: ABOVE,
      show: () => s.v.far > 0.95,
    },
  };
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      if (want && !anno.has(id)) anno.add(id, { text: L.text(), point: L.point, kind: 'force', color: L.color, spots: L.spots });
      else if (!want && anno.has(id)) anno.remove(id);
    }
  }

  // ── camera: a gentle three-quarter view; it pulls back for the book's limit ───
  const nearBox = new THREE.Box3(V(-0.108, 0, -0.045), V(0.048, 0.216, 0.045));
  const farBox = new THREE.Box3(V(TALL.personX - 0.3, 0, -0.3), V(TALL.scaleX + 0.55, TALL.top + 0.25, 0.3));
  const DIR = V(0.45, 0.2, 1).normalize();
  const poses = { near: null, far: null };
  function fitPoses() {
    const d = DIR.clone();
    if (s.view === '3d' && !s.userMovedCamera) d.add(V(0.6, 0.15, 0)).normalize();
    const args = { dir: d, camera, width: stage.width, height: stage.height, margin: MARGIN };
    const a = fitPose({ box: nearBox, ...args });
    const b = fitPose({ box: farBox, ...args });
    poses.near = { target: a.target, dist: a.position.distanceTo(a.target), dir: d };
    poses.far = { target: b.target, dist: b.position.distanceTo(b.target), dir: d };
  }
  const guided = { position: V(0, 0, 0), target: V(0, 0, 0) };
  function guidedPose() {
    const f = s.v.far;
    const { near: a, far: b } = poses;
    guided.target.lerpVectors(a.target, b.target, f);
    const dist = Math.exp(Math.log(a.dist) + (Math.log(b.dist) - Math.log(a.dist)) * f);
    guided.position.copy(guided.target).addScaledVector(a.dir, dist);
    return guided;
  }
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
  /** The guided camera takes the view back, flying from wherever the student left it. */
  function takeView(duration = T.fly) {
    const was = s.userMovedCamera;
    if (was) {
      s.userMovedCamera = false;
      rotate.home();
    }
    if (s.view !== 'front') {
      s.view = 'front';
      fitPoses();
      syncUI();
      emit('view', { view: s.view });
    }
    if (!was && camK >= 1) return Promise.resolve(true);
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    if (!duration) {
      camK = 1;
      return Promise.resolve(true);
    }
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
    zoom: [0.45, 2.2],
    when: () => s.mode !== 'quiz',
    onTurn: beginOrbit,
  });
  rotateEl = rotate.el;
  function setView(view, { animate = true } = {}) {
    if (view === '3d') {
      s.view = '3d';
      s.userMovedCamera = false;
      rotate.home();
      fitPoses();
      camFrom = { position: camera.position.clone(), target: controls.target.clone() };
      camK = animate ? 0 : 1;
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      if (!animate) return Promise.resolve(true);
      return tweener.animate({ key: 'camera', duration: T.fly, onUpdate: (k) => (camK = k), onComplete: () => (camK = 1) }).finished;
    }
    const p = takeView(animate ? T.fly : 0);
    emitChange();
    return p;
  }
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
  });
  stage.onResize(() => {
    fitPoses();
    syncScene();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  const KEYS = Object.keys(TARGET.intro);
  /** Moves some of the values to where they go, together, over `duration` seconds. */
  function tweenTo(to, duration, my) {
    const from = { ...s.v };
    return tweener
      .animate({
        key: 'step',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const key of Object.keys(to)) s.v[key] = from[key] + (to[key] - from[key]) * k;
          syncLabels();
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  /** The plan from one step to another: a list of [values, seconds], played one after the other. */
  function planFor(from, to) {
    const goal = TARGET[to];
    if (from === 'intro' && to === 'rest') return [[{ arrows: 1 }, T.arrows]];
    if (from === 'rest' && to === 'suck')
      return [
        [{ thin: 1 }, T.thin],
        [{ net: 1 }, T.net],
        [{ rise: 1 }, T.rise],
      ];
    if (from === 'suck' && to === 'max')
      return [
        [{ far: 1 }, T.far],
        [{ tall: 1 }, T.tall],
      ];
    // a jump (a step word, back, or several at once): everything together, then the tall drink if it rises
    const first = {};
    for (const k of KEYS) if (k !== 'tall' || goal.tall === 0) first[k] = goal[k];
    if (goal.far && !s.v.far) first.rise = goal.rise;
    const plan = [[first, goal.far !== s.v.far ? T.far : T.back]];
    if (goal.tall && s.v.tall < 1) plan.push([{ tall: 1 }, T.tall]);
    return plan;
  }
  function stopAll() {
    s.run++;
    tweener.cancel('step');
    s.busy = false;
  }
  async function go(step, { animate = true } = {}) {
    if (!(step in TARGET)) return;
    const from = s.step;
    stopAll();
    const my = s.run;
    s.step = step;
    hintOff();
    takeView(animate ? T.fly : 0);
    if (!animate || from === step) {
      Object.assign(s.v, TARGET[step]);
      s.busy = false;
      done();
      return;
    }
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    for (const [to, sec] of planFor(from, step)) {
      if (!(await tweenTo(to, sec, my))) return;
    }
    s.busy = false;
    audio.success?.();
    done();
  }
  function done() {
    syncScene();
    syncLabels();
    refresh();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_look', 1, ICONS.hand],
    rest: ['act_suck', 2, ICONS.hand],
    suck: ['act_max', 3, ICONS.hand],
    max: ['act_quiz', '', ICONS.chevR],
  };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const steady = { lead: '', act: '' };
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm
      ? `<span class="tb-long">${t('intro')}</span><span class="tb-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('tb-calm', calm);
    }
    const vars = { h: N(H_WATER) };
    sheet.outcome(calm || s.busy ? '' : t(`out_${s.step}`, vars));
    sheet.rule(calm || s.busy ? '' : t(`rule_${s.step}`, vars));
    sheet.choose(calm ? null : s.step);
    sheet.next({ intro: 'rest', rest: 'suck', suck: 'max' }[s.step] ?? null);
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
    syncLabels();
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the glass, a tap on the glass ────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    if (s.step === 'intro') return go('rest');
    if (s.step === 'rest') return go('suck');
    if (s.step === 'suck') return go('max');
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
    target: () => V(0, DRINK_Y - 0.02, 0.03),
    radius: 26,
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
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
    if (!near() || s.step === 'max') return false;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(glass.hitMeshes, false).length > 0;
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

  // ── how to use, in the panel: the rotate pill, the সামনে button, a tap on the glass ──
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'tap', text: t('howto_tap'), when: () => s.step !== 'max', onTap: () => action?.show('scene') },
    ],
    { stage },
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
    const v = s.v;
    return {
      step: s.step,
      suck: v.thin > 0.5,
      // the drink in the straw above the glass's level (cm); in the last step, the tall straw's (m)
      rise: v.far > 0.5 ? Math.round(H_WATER * v.tall * 10) / 10 : toCm(v.rise * (STRAW_END.y - DRINK_Y)),
      riseUnit: v.far > 0.5 ? 'm' : 'cm',
      mouth: Math.round((1 - (2 / 3) * v.thin) * 100) / 100, // the mouth's air, as a part of the outside air's crowd
      busy: s.busy,
      next: { intro: 'look', rest: 'suck', suck: 'max', max: 'quiz' }[s.step],
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view]);
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
      label: (j) => `<span class="tb-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const mText = (v) => `${N(v)}&nbsp;${t('u_m')}`;
  const words = (keys) => keys.map((key) => ({ key }));
  /** The four questions: no sucking, where the pressure falls, why it rises, how high at most. */
  const KINDS = ['rest', 'where', 'suck', 'max'];
  const SCENE_OF = { rest: 'rest', where: 'suck', suck: 'suck', max: 'suck' };

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
        learnSaved = s.step;
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizKind = '';
        syncUI();
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        s.quizKind = kind;
        await go(SCENE_OF[kind], { animate: false });
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        question = { kind };
        if (kind === 'rest')
          return { text: t('q_straw'), ...choicesOf(words(['c_st_right', 'c_st_noair', 'c_st_narrow', 'c_st_down']), kind, (x) => t(x.key)) };
        if (kind === 'where')
          return { text: t('q_st_where'), ...choicesOf(words(['c_wh_right', 'c_wh_glass', 'c_wh_all', 'c_wh_none']), kind, (x) => t(x.key)) };
        if (kind === 'suck')
          return { text: t('q_st_suck'), ...choicesOf(words(['c_su_right', 'c_su_pull', 'c_su_straw', 'c_su_light']), kind, (x) => t(x.key)) };
        return { text: t('q_st_max'), ...choicesOf(waterChoices(), kind, (x) => mText(x.v)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        if (k === 'rest') return t('why_straw') + note({ c_st_noair: 'mis_st_noair', c_st_narrow: 'mis_st_narrow', c_st_down: 'mis_st_down' });
        if (k === 'where') return t('why_where') + note({ c_wh_glass: 'mis_wh_glass', c_wh_all: 'mis_wh_all', c_wh_none: 'mis_wh_none' });
        if (k === 'suck') return t('why_su') + note({ c_su_pull: 'mis_su_pull', c_su_straw: 'mis_su_straw', c_su_light: 'mis_su_light' });
        return t('why_st_max', { h: N(H_WATER) }) + note({ same: 'mis_st_same', divide: 'mis_st_small', tenth: 'mis_st_small' });
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
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    const order = ['intro', ...STEPS];
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowRight' && !onButton) {
      if (s.step !== 'max') doAction();
    } else if (k === 'ArrowLeft' && !onButton) go(order[Math.max(1, order.indexOf(s.step) - 1)]);
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  fitPoses();
  syncUI();
  applyCamera();
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
    /** Change any of: step ('intro' | 'rest' | 'suck' | 'max'), suck (true: the step 'suck'; false: 'rest'), view ('front' |
     * '3d'). animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      const step = p.step ?? (p.suck != null ? (p.suck ? 'suck' : 'rest') : null);
      if (step) await go(step, { animate });
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await setView('front', { animate: false });
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The glass, the drink, the straw and the mouth's section, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Straw';
      const copy = glass.root.clone(true);
      copy.scale.setScalar(1);
      copy.traverse((ob) => {
        ob.visible = true;
      });
      g.add(copy);
      return g;
    },
  };
}
