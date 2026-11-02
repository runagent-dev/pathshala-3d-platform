// গ্যাসের প্রসারণ (book p173-175, topic 6.3.3): the student view. The book's চিত্র ৬.০৭: two cylinders with a piston and a
// fixed weight on it; the right one is heated by a burner and its piston rises (the gas takes more volume at the same
// pressure). The student picks the starting temperature T₁ (200, 300 or 400 K), taps the burner (or the big button)
// to heat the gas by 100 K, and reads T and V before and after. The panel shows the book's PV = nRT, the coefficient
// γ_P = ((V₂ − V₁)/V₁)/(T₂ − T₁) = 1/T₁ with the student's numbers, and the rule "the lower the temperature, the more
// the gas expands". Five tap questions. The panel is the kit's clean sheet (docs/student-kit.md).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createRig, G, GAS_BOTTOM, gasHeight } from './apparatus.js';
import { outlinedArrow } from './arrows.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { HEAT, N_MOL, P_PA, T1_CHOICES, clampT, percent, readings, shuffle } from './reading.js';
import { createRoom } from './scenery.js';

export const DEFAULTS = {
  t1: 300, // K: the starting temperature T₁ (200, 300 or 400)
  t2: null, // K: the temperature of the heated gas (default: T₁, not heated yet)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the burner pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const BLUE = '#1c6fd9'; // the volume V: the arrow and the dashed level
const UP = new THREE.Vector3(0, 1, 0);
const VIEW_DIRS = {
  front: new THREE.Vector3(0, 0.15, 1).normalize(),
  '3d': new THREE.Vector3(0.6, 0.38, 0.8).normalize(),
};
const ARROW_X = -3.6; // the ΔV arrow stands in the gap between the cylinders
const FRONT_Z = G.R_OUT + 0.5;

const fmtP = (v) => (v >= 100000 ? '1,00,000' : String(v)); // Bangladeshi commas: ১,০০,০০০

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const pStr = t.lang === 'bn' || o.numerals === 'bn' ? fmtP(P_PA) : '100,000';

  root.classList.add('pvc', 'gx');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel: the starting temperature, one action, the readings, the formula, one rule ──
  const sub = (s, i) => `<i>${s}</i><sub>${i}</sub>`;
  const readHtml = `<div class="gx-read" role="group" aria-label="${t('rd')}">
      <span class="gx-box"><i>PV</i> = <i>nRT</i></span><b class="gx-h">${t('rd_before')}</b><b class="gx-h">${t('rd_after')}</b>
      <span class="gx-k gx-t">${t('rd_T')} <i>T</i></span><span class="gx-n gx-t" data-r="T1"></span><span class="gx-n gx-t" data-r="T2"></span>
      <span class="gx-k gx-v">${t('rd_V')} <i>V</i></span><span class="gx-n gx-v" data-r="V1"></span><span class="gx-n gx-v" data-r="V2"></span>
      <span class="gx-const">${t('rd_const', { P: pStr, n: N_MOL })}</span>
    </div>
    <div class="gx-fx" role="group" aria-label="${t('fx')}">
      <div class="gx-row"><span class="gx-g">γ<sub>P</sub> =</span><span class="gx-frac"><span>(${sub('V', 2)} − ${sub('V', 1)})/${sub('V', 1)}</span><span>${sub('T', 2)} − ${sub('T', 1)}</span></span><span class="gx-res">= 1/${sub('T', 1)}</span></div>
      <div class="gx-row"><span class="gx-g gx-g2">γ<sub>P</sub> =</span><span class="gx-g" data-eq>=</span><span class="gx-frac" data-num><span data-fnum></span><span data-fden></span></span><span class="gx-res" data-gres></span></div>
    </div>`;
  const sheetHtml = cleanSheet(t, {
    examples: {
      label: 'examples',
      results: true,
      items: T1_CHOICES.map((T) => ({ id: String(T), label: `ex_${T}` })),
    },
    quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
    lines: { action: 1, outcome: 0, rule: 3 },
  }).replace(/<p class="pvc-outcome"[^>]*><\/p>/, readHtml);
  const ui = buildStudentShell(root, t, { layout: 'side', learn: sheetHtml, learnAlign: 'start' });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const el = {
    T1: $('[data-r="T1"]'),
    T2: $('[data-r="T2"]'),
    V1: $('[data-r="V1"]'),
    V2: $('[data-r="V2"]'),
    num: $('[data-num]'),
    eq: $('[data-eq]'),
    fx: $('.gx-fx'),
    fnum: $('[data-fnum]'),
    fden: $('[data-fden]'),
    gres: $('[data-gres]'),
  };
  const cache = new Map();
  /** Write HTML into an element only when it changed (this runs every frame while the gas moves). */
  const put = (key, elem, html) => {
    if (cache.get(key) === html) return;
    cache.set(key, html);
    elem.innerHTML = html;
  };

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 1, far: 2000, environment: 'studio-light', environmentIntensity: 0.65 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 40;
  controls.maxDistance = 400;
  controls.enablePan = false;
  controls.enableZoom = false; // zoom would break the framing; a drag turns the view
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
  const room = createRoom();
  if (o.bg !== 'transparent') {
    scene.add(room.root);
    scene.background = room.background;
  }
  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x8a6a4a, 0.9));
  const rig = createRig();
  scene.add(rig.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(-26, 80, 60);
    sun.target.position.set(0, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 36, bottom: -14, near: 20, far: 200 });
    sun.shadow.radius = 5;
    scene.add(sun, sun.target);
    room.top.receiveShadow = true;
  } else {
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(-26, 80, 60);
    scene.add(sun);
  }

  // the ΔV marks (shown, never exported): a dashed level at the left gas's height across to the right cylinder, and
  // one outlined arrow from that level up to the right piston (the rise)
  const guides = new THREE.Group();
  guides.name = 'Guides';
  guides.userData.noExport = true;
  scene.add(guides);
  const level = new THREE.Group();
  {
    const X0 = -G.GAP_X + G.R_OUT - 0.6;
    const COUNT = Math.floor((G.GAP_X + G.R_OUT + 0.8 - X0) / 1.6);
    const dashes = (r, color, order) => {
      const mesh = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(r, r, 0.9, 6).rotateZ(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color, toneMapped: false, depthTest: false, transparent: true }),
        COUNT,
      );
      const m = new THREE.Matrix4();
      for (let i = 0; i < COUNT; i++) mesh.setMatrixAt(i, m.makeTranslation(X0 + i * 1.6 + 0.45, 0, FRONT_Z));
      mesh.renderOrder = order;
      return mesh;
    };
    level.add(dashes(0.3, '#ffffff', 20), dashes(0.16, BLUE, 21)); // a white outline under the blue dashes
  }
  guides.add(level);
  const dvArrow = outlinedArrow('RiseOfTheVolume', BLUE, { radius: 0.24, head: 1.2, headRadius: 0.62, pad: 0.15, order: 22 });
  guides.add(dvArrow.root);

  // ── state ───────────────────────────────────────────────────────────────────
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  const s = {
    T1: T1_CHOICES.includes(Number(o.t1)) ? Number(o.t1) : 300,
    TL: 0, // the temperature of the gas on the left, as drawn
    TR: 0, // and on the right
    T2: 0, // where the right gas is going (T₂)
    flame: 0, // 0 … 1
    flicker: 0,
    running: false,
    heated: false, // the right gas is at T₂ > T₁ and still
    stage: 0, // the rule: 0 none, 1 heated once, 2 compared two starting temperatures
    tried: new Map(), // T₁ → percent
    mode: 'explore',
    locked: false,
    hideV2: false,
    labels: true,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
  };
  const settled = () => !s.running && Math.abs(s.TL - s.T1) < 0.05 && Math.abs(s.TR - s.T2) < 0.05;
  const snapshot = () => {
    const x = readings(s.T1, s.TR);
    return {
      T1: s.T1,
      T2: Math.round(s.TR),
      V1: x.V1,
      V2: x.V2,
      dV: x.dV,
      gamma: x.gamma,
      heated: s.heated,
      running: s.running,
      stage: s.stage,
      locked: s.locked,
      mode: s.mode,
      view: s.view,
      results: Object.fromEntries(s.tried),
      next: { label: s.heated ? 'act_cool' : 'act_heat', step: s.heated ? 2 : 1 },
    };
  };

  // ── labels on the picture ─────────────────────────────────────────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
  const dvPoint = new THREE.Vector3(ARROW_X, 0, FRONT_Z);
  const labelHtml = (side, T, withV) => {
    const x = readings(s.T1, T);
    const n = side === 'L' ? 1 : 2;
    const v = side === 'L' || !s.hideV2 ? t(`lab_V${n}`, { V: (side === 'L' ? x.V1 : x.V2).toFixed(1) }) : t('lab_V2q');
    return `<span class="gx-lt">${t(`lab_T${n}`, { T: Math.round(T) })}</span><br><span class="gx-lv">${withV ? v : ''}</span>`;
  };
  anno.add('L', {
    text: labelHtml('L', s.T1, true),
    point: () => rig.left.top,
    kind: 'callout',
    color: '#1d2733',
    spots: [
      { dx: 0, dy: -30 },
      { dx: -48, dy: -30 },
      { dx: -48, dy: -56 },
    ],
  });
  anno.add('R', {
    text: labelHtml('R', s.T1, true),
    point: () => rig.right.top,
    kind: 'callout',
    color: '#1d2733',
    spots: [
      { dx: 0, dy: -30 },
      { dx: 48, dy: -30 },
      { dx: 48, dy: -56 },
      { dx: 0, dy: -58 },
    ],
  });
  const addD = () =>
    anno.add('D', {
      text: t('lab_dV'),
      point: () => dvPoint,
      kind: 'callout',
      color: BLUE,
      spots: [
        { dx: 12, dy: 0 },
        { dx: -12, dy: 0 },
      ],
      optional: true,
    });
  const labelCache = { L: '', R: '', D: false };

  // ── drawing the state ───────────────────────────────────────────────────────
  function show() {
    rig.left.set(s.TL);
    rig.right.set(s.TR);
    rig.setFlame(s.flame, s.flicker);
    const y1 = GAS_BOTTOM + gasHeight(s.TL);
    const y2 = GAS_BOTTOM + gasHeight(s.TR);
    const rise = y2 - y1;
    const on = rise > 0.7 && s.labels;
    level.visible = on;
    level.position.y = y1;
    if (on) dvArrow.set(new THREE.Vector3(ARROW_X, y1, FRONT_Z), UP, rise);
    else dvArrow.hide();
    dvPoint.set(ARROW_X, (y1 + y2) / 2, FRONT_Z);
    if (on !== labelCache.D) {
      labelCache.D = on;
      if (on) addD();
      else anno.remove('D');
    }
    const lt = labelHtml('L', s.TL, true);
    const rt = labelHtml('R', s.TR, true);
    if (lt !== labelCache.L) {
      labelCache.L = lt;
      anno.setText('L', lt);
    }
    if (rt !== labelCache.R) {
      labelCache.R = rt;
      anno.setText('R', rt);
    }
    stage.invalidate();
  }
  let lastAction = '';
  function panel() {
    const x = readings(s.T1, settled() ? s.T2 : s.TR);
    const unit = (u) => `<small>${t(`u_${u}`)}</small>`;
    put('T1', el.T1, `${N(x.T1)} ${unit('K')}`);
    put('T2', el.T2, `${N(x.T2)} ${unit('K')}`);
    put('V1', el.V1, `${N(x.V1.toFixed(1))} ${unit('L')}`);
    put('V2', el.V2, `${N(x.V2.toFixed(1))} ${unit('L')}`);
    // the student's numbers in the book's fraction, once the gas has settled after a real heating
    const withNumbers = settled() && s.T2 - s.T1 >= 50;
    el.num.hidden = !withNumbers;
    el.eq.hidden = !withNumbers;
    el.fx.dataset.num = withNumbers ? '1' : '';
    if (withNumbers) {
      put('fnum', el.fnum, `(${N(x.V2.toFixed(1))} − ${N(x.V1.toFixed(1))})/${N(x.V1.toFixed(1))}`);
      put('fden', el.fden, `${N(x.T2)} − ${N(x.T1)}`);
    }
    put('gres', el.gres, `= ${N(1)}/${N(s.T1)} K<sup>−1</sup>`);
    // the rule grows with what was found out
    const rule = s.stage >= 2 ? 'rule_2' : s.stage === 1 ? 'rule_1' : 'rule_0';
    sheet.rule(t(rule, { dv: '1' }));
    sheet.choose(String(s.T1));
    sheet.next(null);
    for (const T of T1_CHOICES) sheet.result(String(T), s.tried.has(T) ? t('res_pct', { p: s.tried.get(T) }) : '');
    const heatedNow = s.heated && !s.running;
    const want = `${heatedNow}|${!s.running && !s.locked}`;
    if (want !== lastAction) {
      lastAction = want;
      action?.set({ label: heatedNow ? 'act_cool' : 'act_heat', step: heatedNow ? 2 : 1, enabled: !s.running && !s.locked });
    }
  }
  let lastChange = '';
  function refresh() {
    show();
    panel();
    const snap = JSON.stringify([s.T1, Math.round(s.TR), s.heated, s.stage]);
    if (snap !== lastChange) {
      lastChange = snap;
      emit('change', snapshot());
    }
  }

  // ── heating and cooling: tweens guarded by a token ─────────────────────────
  let token = 0;
  function glide({ TL = s.TL, TR = s.TR, flame = s.flame, duration = 0.7, flicker = false, key = 'move' }) {
    const a = { TL: s.TL, TR: s.TR, flame: s.flame };
    if (!duration) {
      s.TL = TL;
      s.TR = TR;
      s.flame = flame;
      s.flicker = 0;
      refresh();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key,
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.TL = a.TL + (TL - a.TL) * k;
        s.TR = a.TR + (TR - a.TR) * k;
        s.flame = a.flame + (flame - a.flame) * k;
        s.flicker = flicker ? 0.07 * Math.sin(k * 62) : 0;
        refresh();
      },
    }).finished;
  }
  function stop() {
    token++;
    tweener.cancel('move');
    s.running = false;
    s.flicker = 0;
  }
  function chooseT1(T, { animate = true } = {}) {
    stop();
    s.T1 = T;
    s.T2 = T;
    s.heated = false;
    return glide({ TL: T, TR: T, flame: 0, duration: animate ? 0.7 : 0 });
  }
  async function heat(T2 = s.T1 + HEAT, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    stop();
    const my = token;
    T2 = Math.round(clampT(T2));
    if (T2 <= s.T1) return chooseT1(s.T1, { animate });
    s.T2 = T2;
    s.running = true;
    s.heated = true;
    refresh();
    if (animate) audio.tick();
    const done = await glide({ TR: T2, flame: 1, duration: animate ? 3 : 0, flicker: true });
    if (my !== token || !done) return false;
    s.running = false;
    s.flicker = 0;
    if (s.T2 - s.T1 >= 50) {
      s.tried.set(s.T1, percent(s.T1, s.T2 - s.T1));
      s.stage = Math.max(s.stage, s.tried.size >= 2 ? 2 : 1);
    }
    if (animate) audio.contact();
    refresh();
    return true;
  }
  async function cool({ animate = true } = {}) {
    if (s.locked) return lockedNudge();
    stop();
    const my = token;
    s.T2 = s.T1;
    s.heated = false;
    const done = await glide({ TR: s.T1, flame: 0, duration: animate ? 1.4 : 0 });
    if (my !== token || !done) return false;
    refresh();
    return true;
  }
  const act = () => (s.heated && !s.running ? cool() : s.running ? null : heat());
  function reset() {
    stop();
    s.stage = 0;
    s.tried.clear();
    s.labels = true;
    s.hideV2 = false;
    return chooseT1(300);
  }

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const BOX = new THREE.Box3(new THREE.Vector3(-20.6, -2, -10), new THREE.Vector3(20.6, 36, 10));
  function viewPose(view) {
    return fitPose({ box: BOX, dir: VIEW_DIRS[view], camera, width: stage.width, height: stage.height, margin: { top: 54, bottom: 14, side: 8 } });
  }
  function flyTo({ position, target }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
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
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(viewPose(s.view), 0));

  // ── touching the burner (or the heated cylinder): the same as the big button ─────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hot = [rig.burner, rig.right.root];
  function hit(e) {
    const rect = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(hot, true).length > 0;
  }
  let down = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    audio.unlock();
    down = { x: e.clientX, y: e.clientY, at: performance.now(), id: e.pointerId };
  });
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.at < 500;
    down = null;
    if (tap && s.mode !== 'quiz' && hit(e)) act();
  });

  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_heat',
    icon: ICONS.hand,
    target: () => rig.stand,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── the test ────────────────────────────────────────────────────────────────
  const fix = (T1, T2, { hide = false } = {}) => {
    stop();
    s.T1 = T1;
    s.T2 = T2;
    s.heated = T2 > T1;
    s.hideV2 = hide;
    s.TL = T1;
    s.TR = T2;
    s.flame = T2 > T1 ? 1 : 0;
    s.flicker = 0;
    refresh();
  };
  const QUESTIONS = {
    weight() {
      fix(300, 300);
      return {
        text: t('qw_text'),
        choices: [
          { html: t('qw_ok') },
          { html: t('qw_a'), why: 'qw_a_why' },
          { html: t('qw_b'), why: 'qw_b_why' },
          { html: t('qw_c'), why: 'qw_c_why' },
        ],
        reveal: () => t('qw_r'),
      };
    },
    grew() {
      fix(300, 400);
      return {
        text: t('qg_text'),
        choices: [
          { html: t('qg_ok') },
          { html: t('qg_a'), why: 'qg_a_why' },
          { html: t('qg_b'), why: 'qg_b_why' },
          { html: t('qg_c'), why: 'qg_c_why' },
        ],
        reveal: () => t('qg_r'),
      };
    },
    volume() {
      const T1 = shuffle([200, 300])[0];
      const T2 = T1 + HEAT;
      fix(T1, T2, { hide: true });
      const x = readings(T1, T2);
      const val = (v) => ({ html: `${N(v.toFixed(1))} <small>L</small>` });
      return {
        text: t('qv_text', { T1, T2 }),
        choices: [
          val(x.V2),
          { ...val(x.V1), why: 'qv_same_why' },
          { ...val(x.V1 * 2), why: 'qv_twice_why' },
          { ...val((x.V1 * T1) / T2), why: 'qv_flip_why' },
        ],
        reveal: () => {
          s.hideV2 = false;
          refresh();
          return t('qv_r', { V1: x.V1.toFixed(1), V2: x.V2.toFixed(1), T1, T2 });
        },
      };
    },
    gamma() {
      const T1 = shuffle([200, 400])[0];
      const T2 = T1 + HEAT;
      fix(T1, T2);
      const inv = (d) => ({ html: `${N(1)}/${N(d)} K<sup>−1</sup>` });
      return {
        text: t('qy_text', { T1 }),
        choices: [
          inv(T1),
          { ...inv(T2), why: 'qy_t2_why' },
          { ...inv(HEAT), why: 'qy_dt_why' },
          { html: `${N(T1)} K<sup>−1</sup>`, why: 'qy_flip_why' },
        ],
        reveal: () => t('qy_r', { T1 }),
      };
    },
    colder() {
      const [Ta, Tb] = shuffle([
        [200, 400],
        [200, 300],
        [300, 400],
      ])[0];
      fix(300, 300);
      const order = shuffle([Ta, Tb]); // which is named first in the question
      return {
        text: t('qc_text', { Ta: order[0], Tb: order[1] }),
        choices: [
          { html: t('qc_ok', { Ta, Tb }) },
          { html: t('qc_a', { Ta, Tb }), why: 'qc_a_why' },
          { html: t('qc_b'), why: 'qc_b_why' },
          { html: t('qc_c'), why: 'qc_c_why' },
        ],
        reveal: () => t('qc_r', { Ta, Tb }),
      };
    },
  };
  const ORDER = ['weight', 'grew', 'volume', 'gamma', 'colder'];
  let currentQ = null;
  let saved = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: ORDER.length,
    lines: { text: 3, feedback: 4 },
    action,
    hooks: {
      enter() {
        stop();
        saved = { T1: s.T1, T2: s.T2, heated: s.heated };
        s.mode = 'quiz';
        s.locked = true;
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.hideV2 = false;
        currentQ = null;
        if (saved) {
          fix(saved.T1, saved.T2);
          s.heated = saved.heated;
        }
        s.userMovedCamera = false;
        flyTo(viewPose(s.view), 0.6);
        syncUI();
        refresh();
      },
      prepare(i, alive) {
        if (!alive()) return null;
        const q = QUESTIONS[ORDER[i]]();
        // the right choice is always made first: shuffle their order, keep the index
        const order = shuffle(q.choices.map((_, j) => j));
        currentQ = q;
        return {
          text: q.text,
          choices: order,
          expected: 0,
          tolerance: 0.5,
          label: (j) => `<span class="gx-opt">${q.choices[j].html}</span>`,
          meta: { question: ORDER[i], T1: s.T1 },
        };
      },
      reveal(_q, correct, picked) {
        const q = currentQ;
        if (!q) return '';
        const why = !correct && q.choices[picked.value]?.why;
        return `${q.reveal()}${why ? ` <span class="gx-why">${t(why)}</span>` : ''}`;
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
    controls.enableRotate = !s.locked;
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
    if (b.dataset.example && s.mode !== 'quiz') chooseT1(Number(b.dataset.example));
    if (b.dataset.act === 'home' && s.mode !== 'quiz') reset();
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.act === 'q-next') quiz.next();
    if (b.dataset.act === 'q-again') quiz.start();
    if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (!['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    if (s.locked) return lockedNudge();
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') heat();
    else cool();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  s.TL = s.T1;
  s.TR = s.T1;
  s.T2 = s.T1;
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const ready = (async () => {
    if (o.t2 != null && Number(o.t2) > s.T1) await heat(Number(o.t2), { animate: false });
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
    /** Change any of: t1 (200, 300, 400), t2 (K, above T₁; T₁ or less cools), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.t1 != null && T1_CHOICES.includes(Number(p.t1))) await chooseT1(Number(p.t1), { animate });
      if (p.t2 != null) {
        if (Number(p.t2) > s.T1) await heat(Number(p.t2), { animate });
        else await cool({ animate });
      }
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await Promise.all([setView('front'), reset()]);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => rig.root,
  };
}
