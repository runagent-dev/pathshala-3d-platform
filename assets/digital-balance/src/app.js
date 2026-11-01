// Digital balance (book page 23, topic 1.6.2), student view: tap things to put them on the pan and read their
// mass; tare with a bowl; switch grams and kilograms; look inside at the load cell that feels the weight
// (mass = weight ÷ g). Then a short test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createI18n } from './i18n.js';
import { createBalance, DIM } from './balance.js';
import { createThing } from './things.js';
import { G, LC, THINGS, THING_KINDS, display, massFromWeight, randomMass, roundTo, weightOf } from './reading.js';

export const DEFAULTS = {
  things: '', // comma-separated kinds on the pan at the start, e.g. "bowl,egg"
  unit: 'g', // 'g' | 'kg'
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const VIEW_DIRS = {
  front: new THREE.Vector3(0, 1.05, 1).normalize(),
  '3d': new THREE.Vector3(0.62, 0.85, 0.85).normalize(),
};
// where each thing waits on the table, in front of the balance (x, z)
const TRAY = { bowl: [-112, 172], egg: [-22, 168], mango: [72, 170], weight: [-58, 242], coin: [32, 238] };
// lifted inside the bowl so they sit on its curved floor
const IN_BOWL = { egg: 4, coin: 4, weight: 4, mango: 22 };
const MAX_ON_PAN = 3;
const SETTLE = 0.9; // s: the display settles like a real balance

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const fmtG = (g) => g.toFixed(1);

  root.classList.add('pvc', 'bal');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const term = (cls, label) => `<span class="pvc-t ${cls}"><b>0</b><small>${t(label)}</small></span>`;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: `
          <div class="bal-acts">
            <button class="pvc-btn" data-act="tare">${t('act_tare')}</button>
            <button class="pvc-btn" data-act="unit"><span></span></button>
            <button class="pvc-btn" data-act="xray"><span></span></button>
          </div>
          <div class="pvc-learn-main">
            <div class="pvc-result"><span class="k">${t('reading')}</span><span class="v">0</span><span class="u"></span></div>
            <div class="pvc-sum bal-sum">${term('w', 'w_long')}<i>÷</i>${term('g', 'g_long')}<i>=</i>${term('m', 'm_long')}</div>
          </div>
          <p class="pvc-learn-extra bal-extra"></p>
          <div class="pvc-learn-foot">
            <span class="pvc-status"><i></i><span></span></span>
          </div>`,
  });

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 5, far: 8000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 120;
  controls.maxDistance = 2500;
  const M = createMaterials(stage.renderer);
  const world = new THREE.Group();
  world.name = 'DigitalBalanceScene';
  scene.add(world);
  const balance = createBalance({ materials: M, t });
  world.add(balance.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });

  // a simple coloured setting: a soft sky-to-sand backdrop and a warm table (never the white page)
  if (o.bg !== 'transparent') {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g2 = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    const grad = g2.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#c9dbe8');
    grad.addColorStop(1, '#efe3d0');
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 4, 256);
    const sky = new THREE.CanvasTexture(c);
    sky.colorSpace = THREE.SRGBColorSpace;
    scene.background = sky;
    const desk = new THREE.Mesh(new THREE.CircleGeometry(900, 48), new THREE.MeshStandardMaterial({ color: '#dcc9ad', roughness: 0.8 }));
    desk.rotation.x = -Math.PI / 2;
    desk.position.y = -0.5;
    desk.userData.noExport = true;
    scene.add(desk);
  }
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.35);
    sun.position.set(80, 600, 260);
    sun.target.position.set(0, 0, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -260, right: 260, top: 260, bottom: -260, near: 200, far: 1000 });
    sun.shadow.radius = 10;
    const table = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity: 0.18 }));
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    scene.add(sun, sun.target, table);
  }
  const castShadows = (obj) =>
    obj.traverse((m) => {
      if (m instanceof THREE.Mesh && m.material && !m.material.transparent) m.castShadow = true;
    });
  castShadows(balance.root);

  // the things, each on its spot on the table
  const things = {};
  for (const kind of THING_KINDS) {
    const thing = createThing(kind, M, t);
    thing.mass = THINGS[kind].mass;
    thing.group.position.set(TRAY[kind][0], 0, TRAY[kind][1]);
    castShadows(thing.group);
    world.add(thing.group);
    things[kind] = thing;
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    onPan: [], // kinds, in the order they were put on
    tare: 0, // grams taken off by "tare"
    unit: o.unit === 'kg' ? 'kg' : 'g',
    xray: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    hidden: false, // the display is covered (a test question asks for it)
    shown: 0, // grams on the display right now (it settles)
    settle: null, // { from, to, t } while settling
    userMovedCamera: false,
  };
  const load = () =>
    roundTo(
      s.onPan.reduce((sum, k) => sum + things[k].mass, 0),
      LC,
    );
  const reading = () => display(load(), { tare: s.tare, unit: s.unit });
  const stable = () => !s.settle;

  function snapshot() {
    const r = reading();
    return {
      reading: r.grams,
      text: r.text,
      unit: s.unit,
      net: r.net,
      tare: s.tare,
      load: load(),
      weight: +weightOf(load()).toFixed(3),
      things: s.onPan.map((k) => ({ kind: k, mass: things[k].mass })),
      stable: stable(),
      xray: s.xray,
      mode: s.mode,
    };
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    value: $('.pvc-result .v'),
    unit: $('.pvc-result .u'),
    w: $('.pvc-t.w b'),
    g: $('.pvc-t.g b'),
    m: $('.pvc-t.m b'),
    extra: $('.bal-extra'),
    status: $('.pvc-status span'),
    statusDot: $('.pvc-status'),
    unitBtn: $('[data-act="unit"] span'),
    xrayBtn: $('[data-act="xray"] span'),
  };
  el.g.textContent = N(String(G));

  function refresh() {
    const r = reading();
    const total = load();
    const shownGrams = s.settle ? s.shown - s.tare : r.grams;
    const shownText = s.unit === 'kg' ? (shownGrams / 1000).toFixed(4) : fmtG(roundTo(shownGrams, LC));
    balance.drawDisplay({ text: s.hidden ? null : shownText, unit: s.unit, net: r.net, stable: stable() && !s.hidden });
    el.value.textContent = s.hidden ? '?' : N(shownText);
    el.unit.textContent = t(s.unit === 'kg' ? 'unit_kg' : 'unit_g');
    el.w.textContent = N(weightOf(total).toFixed(3));
    el.m.textContent = N((total / 1000).toFixed(4));
    el.extra.textContent = r.net
      ? t('net_line', { tare: fmtG(s.tare), total: fmtG(total), net: fmtG(r.grams) })
      : `${t('idea')} ${t('conv', { kg: (total / 1000).toFixed(4), g: fmtG(total) })}`;
    el.unitBtn.textContent = t('act_unit', { unit: t(s.unit === 'kg' ? 'unit_kg' : 'unit_g') });
    el.xrayBtn.textContent = t(s.xray ? 'act_xray_off' : 'act_xray');
    const status = s.locked
      ? ['status_locked', 'locked']
      : s.settle
        ? ['status_settling', 'idle']
        : r.net
          ? ['status_net', 'contact']
          : total
            ? ['status_stable', 'contact']
            : ['status_empty', 'idle'];
    el.status.textContent = t(status[0]);
    el.statusDot.dataset.tone = status[1];
    stage.invalidate();
  }

  // ── weighing ────────────────────────────────────────────────────────────────
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.reading}|${snap.unit}|${snap.tare}|${snap.things.map((x) => x.kind).join()}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }
  /** The load changed: the pan dips, the display settles on the new value. */
  function measure({ animate = true } = {}) {
    const target = load();
    balance.setLoad(target);
    if (s.xray) balance.xray(true); // the arrow follows the load
    if (!animate) {
      s.settle = null;
      s.shown = target;
      refresh();
      emitChange();
      return;
    }
    s.settle = { from: s.shown, to: target, t: 0 };
    tweener.animate({
      key: 'pan',
      duration: 0.5,
      ease: ease.linear,
      onUpdate: (_k, p) => balance.setLoad(target, { press: Math.sin(Math.PI * p) * Math.exp(-3 * p) * 2.2 }),
    });
    refresh();
  }
  stage.addTicker((dt) => {
    if (!s.settle) return false;
    const st = s.settle;
    st.t += dt;
    const k = Math.min(1, st.t / SETTLE);
    const wobble = Math.exp(-5 * k) * Math.cos(9 * k);
    const noise = (1 - k) * (Math.random() - 0.5) * 0.6;
    s.shown = st.to + (st.from - st.to) * wobble + noise;
    if (k >= 1) {
      s.settle = null;
      s.shown = st.to;
      audio.tick();
      emitChange();
    }
    refresh();
    return true;
  });
  const settled = () =>
    new Promise((resolve) => {
      const check = () => (s.settle ? setTimeout(check, 50) : resolve(true));
      check();
    });

  /** Where each thing on the pan sits, in the pan's coordinates: things go into the bowl when it is there. */
  function spots(list) {
    const out = {};
    const c = new THREE.Vector3(0, DIM.panTop, DIM.panZ);
    const others = list.filter((k) => k !== 'bowl');
    if (list.includes('bowl')) {
      out.bowl = c.clone();
      const inBowl = [
        [0, 0],
        [-15, 8],
        [16, -6],
      ];
      others.forEach((k, i) => (out[k] = c.clone().add(new THREE.Vector3(inBowl[i][0], IN_BOWL[k], inBowl[i][1]))));
      return out;
    }
    const layout =
      {
        1: [[0, 0]],
        2: [
          [-32, 0],
          [32, 0],
        ],
        3: [
          [-36, -22],
          [36, -22],
          [0, 30],
        ],
      }[others.length] || [];
    others.forEach((k, i) => (out[k] = c.clone().add(new THREE.Vector3(layout[i][0], 0, layout[i][1]))));
    return out;
  }

  /** Moves every thing to where it belongs (pan spots for those on the pan, the table for the rest). */
  async function arrange({ animate = true } = {}) {
    const targets = spots(s.onPan);
    const moves = [];
    for (const kind of THING_KINDS) {
      const thing = things[kind];
      const onPan = s.onPan.includes(kind);
      const parent = onPan ? balance.pan : world;
      const local = onPan ? targets[kind] : new THREE.Vector3(TRAY[kind][0], 0, TRAY[kind][1]);
      if (thing.group.parent === parent && thing.group.position.distanceTo(local) < 0.01) continue;
      // fly in the scene's space, then hand over to the pan (it sinks under load) or to the table
      world.updateMatrixWorld(true);
      world.attach(thing.group);
      const from = thing.group.position.clone();
      const to = world.worldToLocal(parent.localToWorld(local.clone()));
      const done = () => {
        parent.attach(thing.group);
        thing.group.position.copy(local);
        stage.invalidate();
      };
      if (!animate) {
        done();
        continue;
      }
      const lift = 70 + Math.abs(to.y - from.y);
      moves.push(
        tweener
          .animate({
            key: `move:${kind}`,
            duration: 0.6,
            ease: ease.inOutCubic,
            onUpdate: (k) => {
              thing.group.position.lerpVectors(from, to, k);
              thing.group.position.y += Math.sin(Math.PI * k) * lift;
              stage.invalidate();
            },
          })
          .finished.then(done),
      );
    }
    await Promise.all(moves);
  }

  async function toggleThing(kind, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (s.onPan.includes(kind)) s.onPan = s.onPan.filter((k) => k !== kind);
    else if (s.onPan.length >= MAX_ON_PAN) return showHint(t('hint_full'), { duration: 2600 });
    else s.onPan = [...s.onPan, kind];
    coach?.objectUsed();
    coach?.objectReleased();
    if (animate) audio.pop();
    emit('thing', { kind, on: s.onPan.includes(kind) });
    await arrange({ animate });
    measure({ animate });
  }

  function tare({ silent = false } = {}) {
    if (s.locked && !silent) return lockedNudge();
    s.tare = load();
    balance.pressButton('tare', true);
    setTimeout(() => (balance.pressButton('tare', false), stage.invalidate()), 160);
    if (!silent) {
      audio.tick();
      showHint(t(s.tare ? 'hint_tare' : 'hint_tare_zero'), { duration: 3600 });
    }
    s.settle = null;
    s.shown = load();
    refresh();
    emit('tare', { tare: s.tare });
    emitChange();
  }

  function setUnit(unit, { silent = false } = {}) {
    s.unit = unit === 'kg' ? 'kg' : 'g';
    if (!silent) {
      balance.pressButton('unit', true);
      setTimeout(() => (balance.pressButton('unit', false), stage.invalidate()), 160);
      audio.tick();
      showHint(t('hint_unit'), { duration: 2600 });
    }
    refresh();
    emit('unit', { unit: s.unit });
    emitChange();
  }

  function setXray(on, { animate = true } = {}) {
    s.xray = Boolean(on);
    balance.xray(s.xray);
    if (s.xray) {
      annotations.add('w', { text: t('weight_label'), point: balance.points.arrowTip, dx: -60, dy: -24, kind: 'part' });
      annotations.add('cell', { text: t('cell_label'), point: balance.points.cell, dx: 40, dy: 46, kind: 'part' });
      showHint(t('hint_xray'), { duration: 5000 });
    } else {
      annotations.remove('w');
      annotations.remove('cell');
    }
    s.userMovedCamera = false;
    flyTo(s.xray ? insidePose() : viewPose(s.view), animate ? 0.9 : 0);
    refresh();
    emit('view', { view: s.view, xray: s.xray });
  }

  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewPose(view) {
    const target = new THREE.Vector3(5, 30, 62);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const usable = Math.max(0.5, 1 - 64 / Math.max(stage.height, 200)); // room for the buttons on top
    const d = Math.max(190 / Math.tan(vfov / 2) / usable, 180 / Math.tan(hfov / 2)) * 1.02;
    return { target, position: target.clone().addScaledVector(VIEW_DIRS[view], d) };
  }
  /** Looking inside: from the right side, low, so the load cell under the pan shows through the body. */
  function insidePose() {
    const target = new THREE.Vector3(0, 52, -24);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const usable = Math.max(0.5, 1 - 64 / Math.max(stage.height, 200));
    const d = Math.max(105 / Math.tan(vfov / 2) / usable, 150 / Math.tan(hfov / 2));
    return { target, position: target.clone().addScaledVector(new THREE.Vector3(1, 0.45, 0.12).normalize(), d) };
  }
  function flyTo({ position, target }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
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
    if (s.xray) setXray(false, { animate: false });
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view, xray: s.xray });
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(s.xray ? insidePose() : viewPose(s.view), 0));

  // ── tapping things and buttons ──────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const pickables = () => [...THING_KINDS.map((k) => things[k].group), ...balance.buttonHits];
  /** What is under a canvas point: { thing } or { button }, or null. */
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    for (const hit of raycaster.intersectObjects(pickables(), true)) {
      if (hit.object.userData.button) return { button: hit.object.userData.button };
      for (let ob = hit.object; ob; ob = ob.parent) if (ob.userData.kind) return { thing: ob.userData.kind };
    }
    return null;
  }
  // a finger is wide: a tap just beside a small thing (the coin) still takes it
  function pickNear(p, touch) {
    const direct = pick(p);
    if (direct || !touch) return direct;
    for (const r of [10, 20]) {
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const found = pick({ x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a) });
        if (found) return found;
      }
    }
    return null;
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const hit = pickNear(canvasPoint(e), e.pointerType !== 'mouse');
      down = hit ? { ...hit, x: e.clientX, y: e.clientY, at: performance.now() } : null;
      if (!hit) return; // the camera controls take it
      e.stopPropagation(); // a tap on a thing or a button is not a camera move
      e.preventDefault();
      if (hit.button) {
        balance.pressButton(hit.button, true);
        stage.invalidate();
      }
    },
    true,
  );
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down) return;
    const hit = down;
    down = null;
    if (hit.button) balance.pressButton(hit.button, false);
    if (Math.hypot(e.clientX - hit.x, e.clientY - hit.y) > 12 || performance.now() - hit.at > 900) return;
    if (hit.thing) toggleThing(hit.thing);
    else if (hit.button === 'tare') tare();
    else if (hit.button === 'unit') setUnit(s.unit === 'g' ? 'kg' : 'g');
  });
  ui.canvasHost.addEventListener('pointercancel', () => (down = null));
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
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
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
  /** The right answer and three wrong ones from the usual mistakes (positive and all different). */
  function choicesFrom(right, mistakes) {
    const seen = new Set([fmtG(right)]);
    const wrong = [];
    for (const m of shuffle(mistakes.map((v) => roundTo(Math.abs(v), LC)))) {
      if (!(m > 0) || seen.has(fmtG(m))) continue;
      seen.add(fmtG(m));
      wrong.push(m);
      if (wrong.length === 3) break;
    }
    for (let k = 2; wrong.length < 3; k++) {
      const m = roundTo(right * k, LC); // fallback, rarely needed
      if (!seen.has(fmtG(m))) {
        seen.add(fmtG(m));
        wrong.push(m);
      }
    }
    return shuffle([right, ...wrong]);
  }
  let kinds = [];
  let question = null;
  async function clearPan() {
    s.onPan = [];
    s.tare = 0;
    s.hidden = false;
    await arrange({ animate: true });
    measure({ animate: false });
  }
  async function put(list, alive) {
    s.onPan = list;
    await arrange();
    if (!alive()) return false;
    measure();
    await settled();
    return alive();
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
        const any = () => pickOne(['kg', 'tare', 'weight']);
        kinds = shuffle(['kg', 'tare', 'weight', any(), any()]);
        hideHint();
        if (s.xray) setXray(false);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.hidden = false;
        syncUI();
        refresh();
      },
      async prepare(i, alive, say) {
        const kind = kinds[i % kinds.length];
        s.locked = false;
        await clearPan();
        if (!alive()) return null;
        setUnit('g', { silent: true });
        const label = (v) => `${N(fmtG(v))}<small>${t('unit_g')}</small>`;
        if (kind === 'kg') {
          const list = shuffle(['egg', 'mango', 'coin', 'weight']).slice(0, 1 + Math.floor(Math.random() * 2));
          for (const k of list) things[k].mass = randomMass(k);
          say(t('q_kg'));
          setUnit('kg', { silent: true });
          if (!(await put(list, alive))) return null;
          const g = reading().grams;
          question = { kind, grams: g };
          s.locked = true;
          refresh();
          return {
            choices: choicesFrom(g, [g / 10, g * 10, g / 1000, g / 100]),
            expected: g,
            tolerance: LC / 2,
            label,
            meta: { kind, things: list },
          };
        }
        if (kind === 'tare') {
          const thing = pickOne(['egg', 'mango', 'weight', 'coin']);
          things.bowl.mass = randomMass('bowl');
          things[thing].mass = randomMass(thing);
          say(t('q_tare', { bowl: fmtG(things.bowl.mass), thing: t(`thing_${thing}`) }));
          if (!(await put(['bowl'], alive))) return null;
          tare({ silent: true });
          if (!(await put(['bowl', thing], alive))) return null;
          const a = things.bowl.mass;
          const b = things[thing].mass;
          const total = roundTo(a + b, LC);
          question = { kind, bowl: a, thing: b };
          s.locked = true;
          refresh();
          return { choices: choicesFrom(total, [b, a, a - b, total + a]), expected: total, tolerance: LC / 2, label, meta: { kind, thing } };
        }
        // weight → mass: the display stays covered until the answer
        const thing = pickOne(['egg', 'mango', 'weight', 'coin']);
        const w = +weightOf(randomMass(thing)).toFixed(3);
        const grams = roundTo(massFromWeight(w), LC);
        things[thing].mass = grams;
        say(t('q_weight', { w: w.toFixed(3) }));
        s.hidden = true;
        if (!(await put([thing], alive))) return null;
        question = { kind, w, grams };
        s.locked = true;
        refresh();
        return {
          choices: choicesFrom(grams, [w * 1000, grams / 10, w * G * 1000, w * 100]),
          expected: grams,
          tolerance: LC / 2,
          label,
          meta: { kind, weight: w, thing },
        };
      },
      reveal() {
        s.hidden = false;
        refresh();
        const q = question;
        if (q.kind === 'kg')
          return `<b class="c-m">${N((q.grams / 1000).toFixed(4))}</b> ${t('unit_kg')} × ${N('1000')} = <b>${N(fmtG(q.grams))} ${t('unit_g')}</b>`;
        if (q.kind === 'tare')
          return `${N(fmtG(q.bowl))} + <b class="c-m">${N(fmtG(q.thing))}</b> = <b>${N(fmtG(roundTo(q.bowl + q.thing, LC)))} ${t('unit_g')}</b>`;
        return `<b class="c-w">${N(q.w.toFixed(3))}</b> ÷ <b class="c-g">${N(String(G))}</b> = ${N((q.grams / 1000).toFixed(4))} ${t('unit_kg')} = <b>${N(fmtG(q.grams))} ${t('unit_g')}</b>`;
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on a thing waiting on the table ──────────────────────
  let coach = null;
  if (o.coach) {
    const v = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_tap',
        candidates: () =>
          ['egg', 'mango', 'weight']
            .filter((k) => !s.onPan.includes(k))
            .map((k) => {
              v.copy(things[k].group.getWorldPosition(new THREE.Vector3()));
              v.y += things[k].height * 0.6;
              v.project(camera);
              return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height };
            }),
        grabbable: (p) => Boolean(pick(p)?.thing),
        // the egg hops a little, as if it wants to be weighed
        async demo(alive) {
          const egg = things.egg.group;
          for (let i = 0; i < 2 && alive() && !s.onPan.includes('egg'); i++) {
            const y0 = egg.position.y;
            await tweener.animate({
              key: 'hop',
              duration: 0.5,
              ease: ease.linear,
              onUpdate: (_k, p) => {
                egg.position.y = y0 + Math.sin(Math.PI * p) * 14;
                stage.invalidate();
              },
            }).finished;
            egg.position.y = y0;
          }
        },
        cancel: () => tweener.cancel('hop'),
      },
    });
  }

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
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'tare':
        tare();
        break;
      case 'unit':
        setUnit(s.unit === 'g' ? 'kg' : 'g');
        break;
      case 'xray':
        setXray(!s.xray);
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  const KEYS = { 1: 'egg', 2: 'mango', 3: 'coin', 4: 'weight', 5: 'bowl' };
  root.addEventListener('keydown', (e) => {
    if (/** @type {Element} */ (e.target).closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (KEYS[k]) toggleThing(KEYS[k]);
    else if (k === 't') tare();
    else if (k === 'u') setUnit(s.unit === 'g' ? 'kg' : 'g');
    else if (k === 'x') setXray(!s.xray);
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  s.onPan = String(o.things || '')
    .split(',')
    .map((x) => x.trim())
    .filter((k) => THINGS[k])
    .slice(0, MAX_ON_PAN);
  arrange({ animate: false });
  measure({ animate: false });
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start();
  })();

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: () => ({ ...snapshot(), view: s.view }),
    /**
     * Change any of: things (["bowl", "egg"] or "bowl,egg"), masses ({ egg: 55.2 }), tare (true: tare what is on
     * the pan now; false: clear it), unit ("g" | "kg"), xray, view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.masses) for (const [k, m] of Object.entries(p.masses)) if (things[k]) things[k].mass = roundTo(Number(m), LC);
      if (p.view) await setView(p.view, { animate });
      if (p.things != null) {
        const list = (Array.isArray(p.things) ? p.things : String(p.things).split(',')).map((x) => String(x).trim()).filter((k) => THINGS[k]);
        s.onPan = [...new Set(list)].slice(0, MAX_ON_PAN);
        await arrange({ animate });
        measure({ animate });
        if (animate) await settled();
      } else if (p.masses) measure({ animate: false });
      if (p.tare === true) tare({ silent: true });
      if (p.tare === false) {
        s.tare = 0;
        refresh();
        emitChange();
      }
      if (p.unit) setUnit(p.unit, { silent: true });
      if (p.xray != null) setXray(p.xray, { animate });
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      if (s.xray) setXray(false);
      for (const k of THING_KINDS) things[k].mass = THINGS[k].mass;
      setUnit('g', { silent: true });
      await clearPan();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => balance.root, // the balance and what is on its pan, not the things on the table
  };
}
