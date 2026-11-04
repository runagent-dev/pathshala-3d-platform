// Expansion of liquids (book pages 171-173, topic 6.3.2), student view. The page's own two pictures, as one figure with
// two words to choose from: the fever thermometer (Fig 6.05: mercury in a glass tube with a narrow bend, climbing when
// heated, held at its mark by the bend until it is shaken down) and the flask with a narrow neck (Fig 6.06: the liquid
// first falls from A to B because the bulb expands, then climbs past A to C because the liquid expands more; AB gives
// the container's expansion V_B, BC the liquid's real expansion V_L, and V_a = V_L − V_B is the apparent expansion).
// Each is one guided sequence with one big step button. Then a five-question test. Built on the shared student kit.
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
import { FLASK, FLASK_HEAT, H1, NECK_AREA, THERMO, THERMO_COLUMN, bulbScale, levelOffset, oneDecimal, volumes } from './reading.js';
import { BENCH_Y, FLASK_GEO, THERMO_GEO, createScene } from './scene.js';

export const DEFAULTS = {
  show: 'thermo', // 'thermo' | 'flask': the word chosen at the start
  step: 0, // how far the sequence has gone (thermometer 0-3, flask 0-2)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const CHIPS = ['thermo', 'flask'];
const LAST = { thermo: 3, flask: 2 };
const VIEW_DIRS = {
  front: new THREE.Vector3(0.22, 0.24, 1).normalize(),
  '3d': new THREE.Vector3(0.55, 0.3, 0.8).normalize(),
};
// what the camera shows for each part of the figure (world boxes); the flask's left is kept free for its labels
const LOOKS = {
  flask: [new THREE.Vector3(-8, BENCH_Y, -2), new THREE.Vector3(6.5, 12.7, 2)],
  thermo: [new THREE.Vector3(-5.5, BENCH_Y + 0.4, -2), new THREE.Vector3(5.2, THERMO_GEO.rest + THERMO_GEO.stemTop + 0.4, 2)],
};
const MARGIN = { top: 48, bottom: 12, side: 8 };
const QUIZ_DIMS = [
  { AB: 1, BC: 3 },
  { AB: 1, BC: 4 },
  { AB: 2, BC: 5 },
];
const SHADOW_BOX = new THREE.Box3(new THREE.Vector3(-16, BENCH_Y, -5), new THREE.Vector3(8, 14.5, 5));

/** Fits the sun's shadow camera tightly round a world box (and updates its projection: three.js does not). */
function fitShadow(light, box) {
  light.updateMatrixWorld();
  light.target.updateMatrixWorld();
  const view = new THREE.Matrix4().lookAt(light.position, light.target.position, new THREE.Vector3(0, 1, 0));
  view.setPosition(light.position);
  const inv = view.clone().invert();
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
  const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const p = new THREE.Vector3();
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        p.set(x, y, z).applyMatrix4(inv);
        lo.min(p);
        hi.max(p);
      }
  const cam = light.shadow.camera;
  Object.assign(cam, { left: lo.x - 1, right: hi.x + 1, bottom: lo.y - 1, top: hi.y + 1, near: Math.max(0.5, -hi.z - 4), far: -lo.z + 60 });
  cam.updateProjectionMatrix();
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const fmt = (x) => N(String(+Number(x).toFixed(2)));
  const cm3 = () => t('u_cm2', { n: 3 });
  const cm2 = () => t('u_cm2', { n: 2 });

  root.classList.add('pvc', 'le');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'examples', items: CHIPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 5 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the formula (flask only): V_a = V_L − V_B, and what each is for the drawn flask, filled in as the student finds them
  const eq = document.createElement('div');
  eq.className = 'le-eq';
  eq.innerHTML = `
    <div class="le-top"><div class="le-law" role="img" aria-label="${t('law_label')}"><span class="c-va">V<sub>a</sub></span><span class="le-op">=</span><span class="c-vl">V<sub>L</sub></span><span class="le-op">−</span><span class="c-vb">V<sub>B</sub></span></div><div class="le-area"></div></div>
    <div class="le-rows" aria-live="polite"><div class="le-row" data-k="vb"></div><div class="le-row" data-k="vl"></div><div class="le-row" data-k="va"></div></div>
    <div class="le-sum" aria-live="polite"></div>`;
  $('.pvc-outcome').after(eq);
  const eqRows = {
    area: eq.querySelector('.le-area'),
    vb: eq.querySelector('[data-k="vb"]'),
    vl: eq.querySelector('[data-k="vl"]'),
    va: eq.querySelector('[data-k="va"]'),
    sum: eq.querySelector('.le-sum'),
  };
  const eqText = new Map();
  function eqSet(key, html) {
    const el = eqRows[key];
    el.classList.toggle('on', Boolean(html));
    if (html && eqText.get(key) !== html) {
      el.innerHTML = html;
      eqText.set(key, html);
    }
  }

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 1, far: 700, environment: 'studio-light', exposure: 1.05 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 14;
  controls.maxDistance = 140;
  const world = createScene({ background: o.bg !== 'transparent' });
  scene.add(world.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(-26, 70, 55);
    sun.target.position.set(0, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 5;
    scene.add(sun, sun.target);
    fitShadow(sun, SHADOW_BOX);
  } else {
    stage.renderer.shadowMap.enabled = false;
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    show: o.show === 'flask' ? 'flask' : 'thermo',
    step: { thermo: 0, flask: 0 },
    mode: 'explore',
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    locked: false,
    busy: false,
    run: 0,
    // the flask's picture
    h: 0,
    dims: { ...FLASK },
    flame: 0,
    markB: false,
    markC: false,
    barVB: false,
    barVL: false,
    dimLabels: false,
    // the thermometer's picture
    col: THERMO.T0,
    gap: 0,
    dip: 0,
    shake: 0,
    quiz: null,
  };
  const vol = () => volumes(s.dims);

  function snapshot() {
    const step = s.step[s.show];
    const v = vol();
    return {
      show: s.show,
      step,
      mode: s.mode,
      locked: s.locked,
      level: +levelOffset(s.h, s.dims).toFixed(3),
      column: +s.col.toFixed(2),
      VB: step >= 1 && s.show === 'flask' ? v.VB : null,
      VL: step >= 2 && s.show === 'flask' ? v.VL : null,
      Va: step >= 2 && s.show === 'flask' ? v.Va : null,
    };
  }
  const emitChange = () => emit('change', snapshot());

  // ── drawing the state ───────────────────────────────────────────────────────
  function draw() {
    if (s.show === 'flask') {
      world.setFlask(FLASK_GEO.A + levelOffset(s.h, s.dims), bulbScale(s.h));
      world.setMarks(s.dims.AB, s.dims.BC, { A: true, B: s.markB, C: s.markC });
      world.setBars(s.dims.AB, s.dims.BC, { VB: s.barVB, VL: s.barVL });
      world.setFlame(s.flame);
    } else {
      world.setThermo(s.col, s.gap);
      world.setDip(s.dip, s.shake);
    }
    syncLabels();
    stage.invalidate();
  }

  /** The picture of a step, at once (no animation). */
  function applyStep(chip, step) {
    s.step[chip] = step;
    if (chip === 'flask') {
      s.dims = { ...FLASK };
      s.h = FLASK_HEAT[step];
      s.flame = step > 0 ? 1 : 0;
      s.markB = s.barVB = step >= 1;
      s.markC = s.barVL = step >= 2;
      s.dimLabels = false;
    } else {
      s.dip = step === 1 ? 1 : 0;
      s.col = THERMO_COLUMN[step];
      s.gap = step === 2 ? 1 : 0;
      s.shake = 0;
    }
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  let action = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const pts = new Map();
  const ptOf = (id) => {
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    return pts.get(id);
  };
  const labelState = new Map();
  const want = new Map();
  function syncLabels() {
    want.clear();
    if (s.show === 'flask') {
      const { AB, BC } = s.dims;
      const v = vol();
      // the marks are only 1 to 5 cm apart: each letter has room above or below its own spot
      want.set('A', {
        text: 'A',
        kind: 'letter',
        point: () => world.flaskNeckAt(FLASK_GEO.A, ptOf('A')),
        spots: [spot(18, 0), spot(18, 22), spot(18, -22)],
      });
      if (s.markB)
        want.set('B', {
          text: 'B',
          kind: 'letter',
          point: () => world.flaskNeckAt(FLASK_GEO.A - AB, ptOf('B')),
          spots: [spot(18, 0), spot(18, 22), spot(18, 40)],
        });
      if (s.markC)
        want.set('C', {
          text: 'C',
          kind: 'letter',
          point: () => world.flaskNeckAt(FLASK_GEO.A - AB + BC, ptOf('C')),
          spots: [spot(18, 0), spot(18, -22), spot(18, -40)],
        });
      if (s.barVB)
        want.set('VB', {
          text: s.dimLabels ? t('lbl_ab', { v: fmt(AB), u: t('u_cm') }) : t('lbl_vb', { v: fmt(v.VB), u: cm3() }),
          kind: 'vb',
          point: () => world.barAt('VB', FLASK_GEO.A - AB / 2, ptOf('VB')),
          spots: [spot(-18, -2), spot(-18, 10), spot(-18, -14), spot(-18, 22)],
        });
      if (s.barVL)
        want.set('VL', {
          text: s.dimLabels ? t('lbl_bc', { v: fmt(BC), u: t('u_cm') }) : t('lbl_vl', { v: fmt(v.VL), u: cm3() }),
          kind: 'vl',
          point: () => world.barAt('VL', FLASK_GEO.A - AB + BC / 2, ptOf('VL')),
          spots: [spot(-18, -26), spot(-18, -40), spot(-18, -12), spot(-18, -54)],
        });
    } else {
      want.set('hg', {
        text: t('lbl_mercury'),
        kind: 'part',
        point: () => world.bulbAt(ptOf('hg')),
        spots: [spot(22, 4), spot(22, 18), spot(22, 32)],
      });
      want.set('bend', {
        text: t('lbl_bend'),
        kind: 'part',
        point: () => world.pinchAt(ptOf('bend')),
        spots: [spot(22, -14), spot(22, -28), spot(22, -2)],
      });
      want.set('temp', {
        text: t('lbl_temp', { T: oneDecimal(s.col), u: t('u_c') }),
        kind: 'val',
        point: () => world.thermoAt(s.col, ptOf('temp')),
        spots: [spot(18, -2), spot(18, -20), spot(18, 16), spot(18, -36)],
      });
      want.set('water', {
        text: t('lbl_water'),
        kind: 'warm',
        point: () => world.beakerAt(ptOf('water')),
        spots: [spot(26, 30), spot(26, 46), spot(26, 14)],
      });
    }
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.kind}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: w.kind, spots: w.spots });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, key);
      }
    }
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  function refresh() {
    const chip = s.show;
    const step = s.step[chip];
    sheet.choose(chip);
    sheet.next(null);
    if (chip === 'thermo') {
      sheet.outcome(t(`out_t${step}`, { T: oneDecimal(THERMO_COLUMN[step]), u: t('u_c') }));
      sheet.rule(t(`rule_t${step}`));
    } else {
      sheet.outcome(t(`out_f${step}`));
      sheet.rule(t(`rule_f${step}`));
    }
    eq.hidden = chip !== 'flask';
    const v = vol();
    const a = fmt(NECK_AREA);
    eqSet('area', step >= 1 && chip === 'flask' ? t('eq_area', { a, u: cm2() }) : '');
    eqSet('vb', step >= 1 && chip === 'flask' ? t('eq_vb', { a, ab: fmt(s.dims.AB), v: fmt(v.VB), u: cm3() }) : '');
    eqSet('vl', step >= 2 && chip === 'flask' ? t('eq_vl', { a, bc: fmt(s.dims.BC), v: fmt(v.VL), u: cm3() }) : '');
    eqSet('sum', chip === 'flask' && step >= 1 ? t(step >= 2 ? 'sum_all' : 'sum_vb', { vb: fmt(v.VB), vl: fmt(v.VL), va: fmt(v.Va), u: cm3() }) : '');
    eqSet('va', step >= 2 && chip === 'flask' ? t('eq_va', { vl: fmt(v.VL), vb: fmt(v.VB), v: fmt(v.Va), u: cm3() }) : '');
    syncAction();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const fitBox = new THREE.Box3();
  function viewPose(chip = s.show) {
    fitBox.min.copy(LOOKS[chip][0]);
    fitBox.max.copy(LOOKS[chip][1]);
    const dir = VIEW_DIRS[s.view].clone();
    const aspect = stage.width / Math.max(1, stage.height);
    if (aspect > 1.2) dir.y = Math.max(0.17, dir.y - (aspect - 1.2) * 0.05); // wide frames: a lower camera
    return fitPose({ box: fitBox, dir: dir.normalize(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      stage.invalidate();
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
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  // the view starts from the front; a drag turns it, and then the "front" icon appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    draw();
  });

  // ── the sequences ───────────────────────────────────────────────────────────
  const alive = (my) => my === s.run;
  /** One animated stretch: onUpdate(k) with k from 0 to 1; resolves true if it ran to the end (and was not cancelled). */
  const stretch = (my, duration, onUpdate, easing = ease.inOutCubic) =>
    alive(my)
      ? tweener.animate({ key: 'run', duration, ease: easing, onUpdate: (k) => (onUpdate(k), draw()) }).finished.then((done) => done && alive(my))
      : Promise.resolve(false);
  const lerp = (a, b, k) => a + (b - a) * k;

  async function flaskForward(step, my) {
    if (step === 1) {
      s.markB = s.markC = s.barVB = s.barVL = false;
      s.flame = 1;
      audio.pop();
      if (!(await stretch(my, 2.0, (k) => (s.h = lerp(0, H1, k)), ease.inOutCubic))) return false;
      s.markB = s.barVB = true;
      audio.success();
    } else {
      if (!(await stretch(my, 2.8, (k) => (s.h = lerp(H1, 1, k)), ease.inOutCubic))) return false;
      s.markC = s.barVL = true;
      audio.success();
    }
    return true;
  }
  async function flaskReset(my) {
    s.markB = s.markC = s.barVB = s.barVL = false;
    const h0 = s.h;
    const f0 = s.flame;
    return stretch(my, 0.8, (k) => {
      s.h = lerp(h0, 0, k);
      s.flame = lerp(f0, 0, k);
    });
  }
  async function thermoForward(step, my) {
    if (step === 1) {
      if (!(await stretch(my, 1.0, (k) => (s.dip = k)))) return false;
      if (!(await stretch(my, 2.0, (k) => (s.col = lerp(THERMO.T0, THERMO.hot, k))))) return false;
      audio.success();
    } else if (step === 2) {
      if (!(await stretch(my, 1.1, (k) => (s.dip = 1 - k)))) return false;
      if (!(await stretch(my, 0.8, (k) => (s.gap = k)))) return false;
    } else {
      // shaken: the thermometer jerks about and the column drops
      const ok = await stretch(
        my,
        1.5,
        (k) => {
          s.shake = Math.sin(k * Math.PI * 9) * 0.55 * (1 - k * 0.6);
          s.col = lerp(THERMO.hot, THERMO.T0, ease.inOutCubic(Math.min(1, Math.max(0, (k - 0.2) / 0.7))));
          s.gap = 1 - Math.min(1, Math.max(0, (k - 0.85) / 0.15));
        },
        ease.linear,
      );
      s.shake = 0;
      if (!ok) return false;
      audio.success();
    }
    return true;
  }
  async function thermoReset(my) {
    const d0 = s.dip;
    const c0 = s.col;
    const g0 = s.gap;
    return stretch(my, 0.8, (k) => {
      s.dip = lerp(d0, 0, k);
      s.col = lerp(c0, THERMO.T0, k);
      s.gap = lerp(g0, 0, k);
      s.shake = 0;
    });
  }

  /** Goes to a step of the chosen word: one step on is animated, going back to 0 is a quick reset, anything else is at once. */
  async function go(step, { animate = true } = {}) {
    const chip = s.show;
    const my = ++s.run;
    tweener.cancel('run');
    s.busy = false;
    const from = s.step[chip];
    step = Math.max(0, Math.min(LAST[chip], step));
    if (!animate || step === from || (step !== 0 && step !== from + 1)) {
      applyStep(chip, step);
      s.busy = false;
      refresh();
      draw();
      emitChange();
      return true;
    }
    s.busy = true;
    action?.hide('run');
    s.step[chip] = step; // the panel moves on as the picture does
    refresh();
    const ok =
      step === 0
        ? await (chip === 'flask' ? flaskReset(my) : thermoReset(my))
        : await (chip === 'flask' ? flaskForward(step, my) : thermoForward(step, my));
    if (!alive(my)) return false;
    s.busy = false;
    if (ok) applyStep(chip, step);
    action?.show('run');
    refresh();
    draw();
    emitChange();
    return ok;
  }

  async function choose(chip, { animate = true } = {}) {
    if (!CHIPS.includes(chip)) return false;
    ++s.run;
    tweener.cancel('run');
    s.busy = false;
    const changed = chip !== s.show;
    s.show = chip;
    world.show(chip);
    applyStep(chip, s.step[chip]);
    s.userMovedCamera = false;
    refresh();
    draw();
    emitChange();
    return changed ? flyTo(viewPose(chip), animate ? 0.8 : 0) : true;
  }

  // ── the action: one big button, and the same numbered badge on the part to touch ─────────────
  const ACT = {
    thermo: [{ label: 'act_warm' }, { label: 'act_out' }, { label: 'act_shake' }, { label: 'act_again', again: true }],
    flask: [{ label: 'act_heat' }, { label: 'act_heat2' }, { label: 'act_again', again: true }],
  };
  const aim = new THREE.Vector3();
  function actionTarget() {
    const step = s.step[s.show];
    if (s.mode === 'quiz' || step >= LAST[s.show]) return null;
    if (s.show === 'flask') return world.lampAt(aim);
    if (step === 0) return world.beakerAt(aim);
    if (step === 1) return world.bulbAt(aim);
    return aim.set(0, world.thermo.position.y + 7, 0.5);
  }
  function syncAction() {
    if (!action) return;
    const step = s.step[s.show];
    const a = ACT[s.show][step];
    action.set({ step: a.again ? '' : step + 1, label: a.label, icon: a.again ? ICONS.reset : ICONS.hand });
    if (a.again) action.hide('end');
    else action.show('end');
  }
  function doAction() {
    if (s.locked || s.busy) return;
    const step = s.step[s.show];
    go(step >= LAST[s.show] ? 0 : step + 1);
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_warm',
    target: actionTarget,
    radius: 34,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: doAction,
  });

  // a tap on the apparatus does the same as the button
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let tap = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    audio.unlock();
    tap = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() };
  });
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!tap || tap.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - tap.x, e.clientY - tap.y);
    const quick = performance.now() - tap.at < 500;
    tap = null;
    if (moved > 8 || !quick || s.mode === 'quiz') return;
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.intersectObjects(world.pickable[s.show], false).length) doAction();
  });

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  /** Choices from items (the right one first), shuffled; each item { key, label }. */
  function choicesOf(items) {
    const list = shuffle([...items]);
    return {
      list,
      choices: list.map((_, j) => j),
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="le-opt">${list[j].label}</span>`,
    };
  }
  let question = null;
  let learnSaved = null;
  /** Sets up a question's scene at once, then flies the camera there. */
  async function quizScene(kind, params = {}) {
    ++s.run;
    tweener.cancel('run');
    s.busy = false;
    const chip = kind === 'stay' || kind === 'shake' ? 'thermo' : 'flask';
    s.show = chip;
    world.show(chip);
    if (chip === 'flask') {
      s.dims = params.dims ? { ...params.dims } : { ...FLASK };
      s.dimLabels = kind === 'va';
      if (kind === 'dip') {
        s.h = 0;
        s.flame = 1;
        s.markB = s.markC = s.barVB = s.barVL = false;
      } else if (kind === 'part') {
        s.h = 1;
        s.flame = 1;
        s.markB = s.markC = true;
        s.barVB = s.barVL = false;
      } else {
        s.h = 1;
        s.flame = 1;
        s.markB = s.markC = s.barVB = s.barVL = true;
      }
    } else {
      s.shake = 0;
      s.dip = kind === 'stay' ? 1 : 0;
      s.col = THERMO.hot;
      s.gap = kind === 'stay' ? 0 : 1;
    }
    s.userMovedCamera = false;
    draw();
    await flyTo(viewPose(chip), 0.7);
  }

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
        learnSaved = { show: s.show, steps: { ...s.step } };
        s.mode = 'quiz';
        s.locked = true;
        syncUI();
        action.hide('quiz');
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        question = null;
        const saved = learnSaved || { show: 'thermo', steps: { thermo: 0, flask: 0 } };
        s.step = { ...saved.steps };
        s.dims = { ...FLASK };
        s.dimLabels = false;
        s.show = saved.show;
        world.show(s.show);
        applyStep('flask', s.step.flask);
        applyStep('thermo', s.step.thermo);
        syncUI();
        refresh();
        draw();
        s.userMovedCamera = false;
        flyTo(viewPose(), 0.6);
        action.show('quiz');
      },
      async prepare(i, alive_) {
        const kind = ['dip', 'part', 'va', 'stay', 'shake'][i % 5];
        if (kind === 'dip') {
          await quizScene('dip');
          if (!alive_()) return null;
          question = { kind };
          return {
            text: t('q_dip'),
            ...choicesOf(['down', 'up', 'same', 'upfirst'].map((k) => ({ key: k, label: t(`c_dip_${k === 'down' ? 'down' : k}`) }))),
          };
        }
        if (kind === 'part') {
          await quizScene('part');
          if (!alive_()) return null;
          question = { kind };
          return {
            text: t('q_part'),
            ...choicesOf(
              [
                ['ab', 'ab'],
                ['bc', 'bc'],
                ['ac', 'ac'],
                ['top', 'top'],
              ].map(([k, c]) => ({ key: k, label: t(`c_part_${c}`) })),
            ),
          };
        }
        if (kind === 'va') {
          const dims = QUIZ_DIMS[Math.floor(Math.random() * QUIZ_DIMS.length)];
          await quizScene('va', { dims });
          if (!alive_()) return null;
          const v = volumes(dims);
          question = { kind, dims, v };
          const val = (x) => `${fmt(x)}&nbsp;${cm3()}`;
          const items = [
            { key: 'right', label: val(v.Va) },
            { key: 'sum', label: val(v.VL + v.VB) },
            { key: 'vl', label: val(v.VL) },
            { key: 'height', label: val(dims.BC - dims.AB) },
          ];
          return { text: t('q_va', { a: fmt(NECK_AREA), u: cm2() }), ...choicesOf(items) };
        }
        if (kind === 'stay') {
          await quizScene('stay');
          if (!alive_()) return null;
          question = { kind };
          return { text: t('q_stay'), ...choicesOf(['stay', 'slow', 'up', 'fall'].map((k) => ({ key: k, label: t(`c_stay_${k}`) }))) };
        }
        await quizScene('shake');
        if (!alive_()) return null;
        question = { kind };
        return {
          text: t('q_shake', { T: oneDecimal(THERMO.hot), u: t('u_c') }),
          ...choicesOf(['shake', 'cold', 'heat', 'wait'].map((k) => ({ key: k, label: t(`c_shake_${k}`) }))),
        };
      },
      reveal(q, correct, picked) {
        const pick = q.list?.[picked.index];
        const note = !correct && pick ? ` ${t(`mis_${question.kind}_${pick.key === 'right' ? '' : pick.key}`, { n: 3 })}` : '';
        const my = ++s.run;
        tweener.cancel('run');
        if (question.kind === 'dip') {
          s.markB = s.barVB = false;
          stretch(my, 2.0, (k) => (s.h = lerp(0, H1, k))).then((done) => {
            if (done) s.markB = true;
            draw();
          });
          return t('why_dip') + note;
        }
        if (question.kind === 'part') {
          s.barVB = true;
          draw();
          return t('why_part') + note;
        }
        if (question.kind === 'va') {
          const { dims, v } = question;
          return t('why_va', { v: fmt(v.Va), u: cm3(), a: fmt(NECK_AREA), bc: fmt(dims.BC), ab: fmt(dims.AB), vl: fmt(v.VL), vb: fmt(v.VB) }) + note;
        }
        if (question.kind === 'stay') {
          (async () => {
            if (!(await stretch(my, 1.1, (k) => (s.dip = 1 - k)))) return;
            await stretch(my, 0.8, (k) => (s.gap = k));
          })();
          return t('why_stay') + note;
        }
        thermoForward(3, my);
        return t('why_shake') + note;
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = $('[data-view="front"]');
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
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.example && s.mode !== 'quiz') choose(b.dataset.example);
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.act === 'home' && s.mode !== 'quiz') go(0);
    if (b.dataset.act === 'q-next') quiz.next();
    if (b.dataset.act === 'q-again') quiz.start();
    if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (s.mode === 'quiz') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (s.step[s.show] < LAST[s.show]) doAction();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!s.busy && s.step[s.show] > 0) go(s.step[s.show] - 1, { animate: false });
    }
  });

  // ── start ───────────────────────────────────────────────────────────────────
  const start = Math.max(0, Math.min(LAST[s.show], Math.round(Number(o.step)) || 0));
  world.show(s.show);
  applyStep('thermo', s.show === 'thermo' ? start : 0);
  applyStep('flask', s.show === 'flask' ? start : 0);
  refresh();
  draw();
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
    getState: () => ({ ...snapshot(), view: s.view }),
    /** Change any of: show ('thermo' | 'flask'), step (0 to 3 / 0 to 2), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.show) await choose(p.show, { animate });
      if (p.step != null) await go(Number(p.step), { animate });
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      await Promise.all([choose('thermo'), setView('front')]);
      applyStep('flask', 0);
      await go(0, { animate: false });
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world.root,
  };
}
