// Inertia (book pages 64–65, topic 3.1.1), student view. A Dhaka bus, with its left side cut away, with a
// school student standing inside. Choose an event and watch it in slow motion: the bus starts suddenly (the feet
// go with the bus, the upper body stays: he leans back, স্থিতি জড়তা), brakes suddenly (the feet stop, the upper
// body runs on: he leans forward, গতি জড়তা), or he steps off the moving bus (the feet stop on the road, the upper
// body runs on: he tumbles forward, গতি জড়তা); and the coin-and-card trick on a glass (স্থিতি জড়তা). A blue
// arrow on the feet and an orange one at the shoulders show how fast each part moves along the road, the panel gives
// the two speeds, and labels say what each part does. Then a short test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createBus, createStreet } from './bus.js';
import { createPassenger } from './passenger.js';
import { createTable } from './table.js';
import { createArrow, createTags } from './marks.js';
import { mergePlaced } from './merge.js';
import { skyTexture } from './textures.js';
import { BUS, EVENT_KEYS, EVENTS, TABLE, clamp, sampleAt, simulate } from './motion.js';

export const DEFAULTS = {
  event: 'start', // 'start' | 'brake' | 'alight' | 'coin'
  at: null, // s: show this moment of the event, paused (the poster); null: the beginning, ready to play
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// the arrows' colours, and deeper shades of them for words on a white chip or the panel (4.5:1 or more)
const COLOR = { lower: '#1c6fd9', upper: '#e8590c' };
const INK = { lower: '#1a64c4', upper: '#c2410c' };
const ARROW = { bus: { scale: 0.28, r: 0.036 }, coin: { scale: 0.05, r: 0.0022 } }; // m of arrow per m/s
// the camera looks at the bus's left side from a little above (the doors are on the left in Bangladesh)
const DIRS = {
  bus: { front: new THREE.Vector3(0, 0.13, -1).normalize(), '3d': new THREE.Vector3(0.55, 0.3, -0.78).normalize() },
  // stepping off: a little higher, so the road he lands on (and its seams streaming past) shows
  alight: { front: new THREE.Vector3(0, 0.24, -1).normalize(), '3d': new THREE.Vector3(0.55, 0.36, -0.76).normalize() },
  // the coin and card from higher up, so the card, the coin and the inside of the glass show
  coin: { front: new THREE.Vector3(0, 0.6, -1).normalize(), '3d': new THREE.Vector3(0.5, 0.65, -0.62).normalize() },
};
const QUIZ_KINDS = ['start', 'brake', 'alight', 'coin', 'gentle'];

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'in');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const term = (cls) => `<span class="pvc-t ${cls}"><b>0</b><small></small></span>`;
  // the panel, top to bottom: the four events (the kit's row of example words), the action (play / pause / again), the two speeds with how much time
  // is slowed, what happens or why (the book's words), and the book's definition
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learnAlign: 'start',
    learn: `
          <div class="pvc-examples in-evs" role="radiogroup" aria-label="${t('events')}">
            ${EVENT_KEYS.map((ev, i) => `<button type="button" role="radio" aria-checked="false" tabindex="${i ? -1 : 0}" data-example="${ev}" title="${t(`ev_${ev}`)}"><span class="pvc-ex-word">${t(`ex_${ev}`)}</span></button>`).join('')}
          </div>
          <div class="pvc-act-row"><button type="button" class="pvc-act in-play" data-act="play"></button></div>
          <div class="in-speeds">
            <span class="in-k"></span>
            ${term('lower')}${term('upper')}
            <span class="in-u">${t('unit_speed')}</span>
            <span class="in-slow"></span>
          </div>
          <p class="in-extra" aria-live="polite"></p>
          <p class="in-idea">${t('idea')}</p>`,
  });
  const sheet = bindCleanSheet(ui.learn);
  // the action under the events: play / pause / again (a tap on the view does the same)
  const playBtn = ui.$('.in-play');
  const slowNote = ui.$('.in-slow');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 28, near: 0.02, far: 120, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  // a blue sky over the street (the coin trick has its own wall behind the table)
  const sky = o.bg === 'transparent' ? null : skyTexture();
  const room = new THREE.Color(0xc8955c); // round the table: the warm room (only seen past the wall when turned)
  scene.background = sky;
  controls.enablePan = false;
  controls.minDistance = 0.15;
  controls.maxDistance = 30;
  const M = createMaterials(stage.renderer);
  const busScene = new THREE.Group();
  busScene.name = 'BusAndPassenger';
  scene.add(busScene);
  const bus = createBus({ materials: M });
  const passenger = createPassenger();
  busScene.add(bus.root, passenger.root);
  const street = createStreet();
  scene.add(street.root);
  const table = createTable({ materials: M, t });
  scene.add(table.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // daylight: a soft sky over the street, and a sun from the camera's side that lights the inside of the bus
  // through the cut-away (it casts soft shadows when shadows are on)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe2dccf, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.75);
  scene.add(sun, sun.target);
  if (o.shadow && o.bg !== 'transparent') {
    // soft PCF on a shadow box fitted round what is in view (it goes with the event): 1024 px on a 7 m box is as
    // sharp as the 2048 px on a 10 m box before. Only parts whose shadows are seen cast them: the passenger, the
    // seats and the bus's body (its shadow on the road, the roof's on the floor); the coin trick's card, coin and
    // hand. Only the floor, the lining, the road, the footpath and the table receive them.
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.01;
    const solid = (m) => m instanceof THREE.Mesh && m.material?.visible !== false && !m.material?.transparent;
    for (const obj of [passenger.root, table.root])
      obj.traverse((m) => {
        if (solid(m) && m.name !== 'Wall') m.castShadow = true;
      });
    const CAST = /^Bus(BusPaint|SeatFrame|Trim)$|^WheelsTyre$/;
    const RECEIVE = /^Bus(Floor|BusInside|BusPaint)$/;
    for (const m of bus.root.children) {
      if (!solid(m)) continue;
      m.castShadow = CAST.test(m.name);
      m.receiveShadow = RECEIVE.test(m.name);
    }
  }

  // the two velocity arrows: the lower body (feet) or the card in blue, the upper body (shoulders) or the coin in orange
  const arrows = {
    bus: { lower: createArrow(COLOR.lower, ARROW.bus.r), upper: createArrow(COLOR.upper, ARROW.bus.r) },
    coin: { lower: createArrow(COLOR.lower, ARROW.coin.r), upper: createArrow(COLOR.upper, ARROW.coin.r) },
  };
  for (const set of Object.values(arrows)) scene.add(set.lower.group, set.upper.group);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    event: EVENTS[o.event] && o.event !== 'gentle' ? o.event : 'start',
    t: 0, // s of event time
    playing: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    helpers: true, // arrows and labels (hidden while a test question is asked)
    userMovedCamera: false,
    phase: 'before',
  };
  const ev = () => EVENTS[s.event];
  const dur = (kind = s.event) => simulate(kind).duration; // s (a start or a brake ends when he is upright)
  const sceneOf = (kind = s.event) => EVENTS[kind].scene;
  let sample = sampleAt(s.event, 0);

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    lower: $('.pvc-t.lower b'),
    upper: $('.pvc-t.upper b'),
    lowerLab: $('.pvc-t.lower small'),
    upperLab: $('.pvc-t.upper small'),
    speedK: $('.in-k'),
    extra: $('.in-extra'),
  };
  const shown = { lower: '', upper: '', extra: '', labs: '' };
  function panel() {
    const lo = N(Math.abs(sample.lowerV).toFixed(1));
    const up = N(Math.abs(sample.upperV).toFixed(1));
    if (lo !== shown.lower) el.lower.textContent = shown.lower = lo;
    if (up !== shown.upper) el.upper.textContent = shown.upper = up;
    const coin = sceneOf() === 'coin';
    const labs = coin ? 'coin' : 'bus';
    if (labs !== shown.labs) {
      shown.labs = labs;
      el.lowerLab.textContent = t(coin ? 'part_card' : 'part_lower');
      el.upperLab.textContent = t(coin ? 'part_coin' : 'part_upper');
      el.speedK.textContent = t(coin ? 'speed_k_coin' : 'speed_k_bus');
    }
    // before the push: what is about to happen; while it happens: why; afterwards (start, brake), what happened and
    // how he straightens up again (the upper body then moves faster, or slower, than the feet)
    const after = s.phase === 'after' && t.has(`after_${s.event}`);
    const extra =
      s.phase === 'before'
        ? `${t(`set_${s.event}`)} ${s.playing ? t('watch') : t(`do_${s.event}`)}`
        : t(after ? `after_${s.event}` : `why_${s.event}`);
    if (extra !== shown.extra) el.extra.innerHTML = shown.extra = extra;
  }
  function syncPlay() {
    const end = s.t >= dur() - 1e-6;
    const [icon, label] = s.playing ? [ICONS.pause, 'act_pause'] : end ? [ICONS.reset, 'act_replay'] : [ICONS.play, 'act_play'];
    if (playBtn.dataset.k !== label) {
      playBtn.dataset.k = label;
      playBtn.innerHTML = `<span class="pvc-act-num">${icon}</span><span>${t(label)}</span>`;
    }
    const slow = t('slow_badge', { k: ev().slow });
    if (slowNote.textContent !== slow) slowNote.textContent = slow;
    sheet.choose(s.event === 'gentle' ? null : s.event);
  }

  // ── labels on the scene ─────────────────────────────────────────────────────
  const passengerBox = () => {
    // the passenger's outline on screen, from the joints (with room for the head, the bag and the hands)
    const j = passenger.joints;
    const r = passenger.root.position;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const k of ['ankle', 'knee', 'hip', 'shoulder', 'head', 'hand', 'elbow']) {
      for (const [dx, dy] of [
        [-0.16, -0.12],
        [0.2, 0.14],
      ]) {
        v3.set(r.x + j[k].x + dx, r.y + j[k].y + dy, r.z).project(camera);
        const x = (v3.x * 0.5 + 0.5) * stage.width;
        const y = (-v3.y * 0.5 + 0.5) * stage.height;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  const v3 = new THREE.Vector3();
  // the boxes of the buttons on the view, read once per size (and the hint's once per text), never every frame
  const domBoxes = new Map();
  const domBox = (node, key = '') => {
    const id = `${stage.width}x${stage.height}:${key}`;
    const cached = domBoxes.get(node);
    if (cached?.id === id) return cached.box;
    const sr = stage.canvas.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    const box = { x: r.left - sr.left - 4, y: r.top - sr.top - 4, w: r.width + 8, h: r.height + 8 };
    domBoxes.set(node, { id, box });
    return box;
  };
  const tipA = new THREE.Vector3();
  const tipB = new THREE.Vector3();
  const arrowBox = (a) => {
    if (!a.group.visible) return null;
    const p = a.pointAt(0, tipA).project(camera);
    const q = a.pointAt(1, tipB).project(camera);
    const x0 = (p.x * 0.5 + 0.5) * stage.width;
    const x1 = (q.x * 0.5 + 0.5) * stage.width;
    const y0 = (-p.y * 0.5 + 0.5) * stage.height;
    const y1 = (-q.y * 0.5 + 0.5) * stage.height;
    return { x: Math.min(x0, x1) - 6, y: Math.min(y0, y1) - 8, w: Math.abs(x1 - x0) + 12, h: Math.abs(y1 - y0) + 16 };
  };
  const tags = createTags({
    stage,
    layer: ui.annoLayer,
    obstacles: () => {
      const list = [domBox(ui.corner)];
      if (ui.hint.classList.contains('show')) list.push(domBox(ui.hint, ui.hintText.textContent));
      if (sceneOf() === 'bus') list.push(passengerBox());
      else list.push(objectBox(table.coin), objectBox(table.card), objectBox(table.glass));
      for (const a of Object.values(arrows[sceneOf()])) {
        const b = arrowBox(a);
        if (b) list.push(b);
      }
      return list;
    },
  });
  const box3 = new THREE.Box3();
  const corner = new THREE.Vector3();
  function objectBox(obj) {
    box3.setFromObject(obj);
    const { min: a, max: b } = box3;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      const p = corner.set(i & 1 ? b.x : a.x, i & 2 ? b.y : a.y, i & 4 ? b.z : a.z).project(camera);
      const x = (p.x * 0.5 + 0.5) * stage.width;
      const y = (-p.y * 0.5 + 0.5) * stage.height;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    return { x: x0 - 6, y: y0 - 6, w: x1 - x0 + 12, h: y1 - y0 + 12 };
  }
  tags.add('upper', { color: COLOR.upper, ink: INK.upper, prefer: ['above-left', 'above', 'above-right', 'left', 'right'] });
  tags.add('lower', { color: COLOR.lower, ink: INK.lower, prefer: ['below-left', 'below', 'left', 'below-right', 'right'] });
  tags.add('mark', {
    color: COLOR.upper,
    ink: INK.upper,
    prefer: ['right', 'below-right', 'far-right', 'above-right', 'below'],
    small: true,
    optional: true,
  });

  // the mark of where the head was when the bus started: a thin dashed orange line standing on the bus floor
  const MARK_TOP = BUS.floor + 1.74; // a little above his head
  const headMark = new THREE.Group();
  headMark.name = 'HeadMark';
  headMark.userData.noExport = true;
  headMark.visible = false;
  {
    // the dashes in one mesh, inside a white rim in one more (so the mark shows on the lining, the seats and the
    // windows alike)
    const mx = new THREE.Matrix4();
    const dashes = (w, h) => {
      const geo = new THREE.BoxGeometry(w, h, w);
      const pairs = [];
      for (let y = BUS.floor + 0.04; y < MARK_TOP; y += 0.12) pairs.push([geo, mx.clone().makeTranslation(0, y + 0.035, 0)]);
      const merged = mergePlaced(pairs);
      geo.dispose();
      return merged;
    };
    const core = new THREE.Mesh(dashes(0.016, 0.07), new THREE.MeshBasicMaterial({ name: 'HeadMark', color: COLOR.upper }));
    const rim = new THREE.Mesh(dashes(0.03, 0.084), new THREE.MeshBasicMaterial({ name: 'HeadMarkRim', color: 0xffffff, side: THREE.BackSide }));
    headMark.add(core, rim);
  }
  scene.add(headMark);
  const markTop = new THREE.Vector3();
  // what each part does; once the card has gone from under it, the coin falls straight down
  const tagHtml = (part, kind) => {
    const which = part === 'part_upper' || part === 'part_coin' ? 'upper' : 'lower';
    const key = kind === 'coin' && which === 'upper' && sample.dropped ? 'tag_coin_upper_drop' : `tag_${kind}_${which}`;
    return `<b>${t(part)}</b><span>${t(key)}</span>`;
  };

  // anchor points of the labels: the middle of each arrow, or the body part itself while its arrow is short
  const anchorLower = new THREE.Vector3();
  const anchorUpper = new THREE.Vector3();
  const aim = (a, fallback, out) =>
    a.group.visible && a.length > 0.12 * (sceneOf() === 'coin' ? 0.05 : 1) ? a.pointAt(0.55, out) : out.copy(fallback);
  const feetPoint = new THREE.Vector3();
  const upperPoint = new THREE.Vector3();

  // ── putting the scene in its state ──────────────────────────────────────────
  let lastT = 0;
  function pose() {
    const kind = s.event;
    sample = sampleAt(kind, s.t);
    const coin = sceneOf() === 'coin';
    busScene.visible = street.root.visible = !coin;
    table.root.visible = coin;
    if (sky) scene.background = coin ? room : sky;
    const A = arrows[coin ? 'coin' : 'bus'];
    const other = arrows[coin ? 'bus' : 'coin'];
    other.lower.set(0, 1);
    other.upper.set(0, 1);
    if (!coin) {
      bus.setX(sample.busX);
      passenger.root.position.set(sample.rootX, sample.rootY, sample.rootZ);
      passenger.setPose(sample.pose);
      passenger.root.updateMatrixWorld(true);
      const j = passenger.joints;
      const r = passenger.root.position;
      const z = r.z - 0.26; // the arrows run just in front of the body (nearer the camera), so it never hides them
      const dl = sample.lowerV < -0.05 ? -1 : 1;
      feetPoint.set(r.x + 0.06 + dl * 0.14, r.y + 0.05, z);
      A.lower.group.position.copy(feetPoint);
      // the upper body's arrow starts at the shoulders (whose speed it shows), in front of or behind the trunk
      const du = sample.upperV < -0.05 ? -1 : 1;
      upperPoint.set(r.x + j.shoulder.x + du * 0.17, r.y + j.shoulder.y - 0.07, z);
      A.upper.group.position.copy(upperPoint);
      // where the head was when the bus started, marked on the road's frame: the head stays at the mark at first
      const markOn = s.helpers && sample.headMark != null && sample.phase === 'act';
      headMark.visible = markOn;
      if (markOn) headMark.position.set(sample.headMark, 0, r.z + 0.12);
      const k = s.helpers ? ARROW.bus.scale : 0;
      A.lower.set(sample.lowerV, k);
      A.upper.set(sample.upperV, k);
      focusX = sample.camX;
      focusLift = sample.camLift;
      focusZoom = sample.camZoom;
      aimSun(focusX, 8, { left: -3.6, right: 3.6, top: 3.6, bottom: -3.6, near: 4, far: 17 });
    } else {
      table.setState(sample);
      table.root.updateMatrixWorld(true);
      const { card: C, coin: K } = TABLE;
      feetPoint.set(sample.cardX + C.w / 2 + 0.003, sample.cardY, -C.d / 2 - 0.004);
      A.lower.group.position.copy(feetPoint);
      upperPoint.set(sample.coinX + K.r + 0.003, sample.coinY, -0.02);
      A.upper.group.position.copy(upperPoint);
      const k = s.helpers ? ARROW.coin.scale : 0;
      A.lower.set(sample.lowerV, k);
      A.upper.set(sample.upperV, k);
      focusX = 0;
      focusLift = 0;
      focusZoom = 1;
      aimSun(0, 1, { left: -0.32, right: 0.32, top: 0.32, bottom: -0.32, near: 0.4, far: 2.2 });
    }
    A.lower.group.updateMatrixWorld(true);
    A.upper.group.updateMatrixWorld(true);
    // labels: while the event happens (the "act"), each part says what it does
    const phase = sample.phase;
    const showTags = s.helpers && phase === 'act';
    tags.set('lower', showTags ? tagHtml(coin ? 'part_card' : 'part_lower', kind) : null, () => aim(A.lower, feetPoint, anchorLower));
    tags.set('upper', showTags ? tagHtml(coin ? 'part_coin' : 'part_upper', kind) : null, () => aim(A.upper, upperPoint, anchorUpper));
    tags.set('mark', headMark.visible ? t('mark_head') : null, () => markTop.set(headMark.position.x, BUS.floor + 0.12, headMark.position.z));
    if (s.playing) sounds(lastT, s.t);
    lastT = s.t;
    placeCamera();
    if (phase !== s.phase) {
      s.phase = phase;
      emitChange();
    }
    panel();
    stage.invalidate();
  }

  /** The sun stands up and to the camera's side of point x, `size` metres away (the shadow box goes with it). */
  function aimSun(x, size, box) {
    sun.position.set(x - 0.3 * size, size, -0.8 * size);
    sun.target.position.set(x, 0.1 * size, 0);
    if (!sun.castShadow) return;
    Object.assign(sun.shadow.camera, box);
    sun.shadow.camera.updateProjectionMatrix();
  }

  /** A sound as something lands: the passenger's feet on the road, his hands; the coin in the glass. */
  function sounds(from, to) {
    const T = simulate(s.event);
    const crossed = (at) => at != null && from < at && to >= at;
    if (crossed(T.act[0]) && s.event !== 'alight') audio.tick();
    if (crossed(T.land?.t)) audio.contact();
    if (crossed(T.handsT)) audio.pop();
    if (crossed(T.landT)) audio.contact();
  }

  stage.addTicker((dt) => {
    if (!s.playing) return false;
    s.t = Math.min(dur(), s.t + dt / ev().slow);
    if (s.t >= dur()) {
      s.playing = false;
      syncPlay();
      emit('end', { event: s.event });
      emitChange();
    }
    pose();
    return true;
  });

  function snapshot() {
    const T = simulate(s.event);
    return {
      event: s.event,
      scene: sceneOf(),
      t: Math.round(s.t * 1000) / 1000,
      duration: dur(),
      playing: s.playing,
      phase: s.phase,
      slow: ev().slow,
      inertia: ev().inertia, // 'rest' (স্থিতি জড়তা) | 'motion' (গতি জড়তা)
      lowerSpeed: Math.round(sample.lowerV * 100) / 100, // m/s along the road (the feet, or the card)
      upperSpeed: Math.round(sample.upperV * 100) / 100, // m/s along the road (the shoulders, or the coin)
      lean: sceneOf() === 'bus' ? Math.round(THREE.MathUtils.radToDeg(sample.theta || 0) * 10) / 10 : null, // ° (> 0 back)
      landed: Boolean(sample.landed),
      key: T.key,
      view: s.view,
      mode: s.mode,
    };
  }
  function emitChange() {
    emit('change', snapshot());
  }

  // ── playing ─────────────────────────────────────────────────────────────────
  let lastPress = -1e9;
  function play() {
    if (s.t >= dur() - 1e-6) s.t = 0;
    s.playing = true;
    coach?.objectUsed();
    coach?.objectReleased();
    syncPlay();
    pose();
    emitChange();
  }
  function pause() {
    s.playing = false;
    syncPlay();
    pose();
    emitChange();
  }
  /** Play, pause, or (at the end) play again. A second press within 0.4 s is ignored (a double tap). */
  function toggle() {
    const now = performance.now();
    if (now - lastPress < 400) return;
    lastPress = now;
    audio.unlock();
    if (s.playing) pause();
    else play();
  }
  /** Show another event, from its beginning (or at time `at`), paused unless `run`. */
  function selectEvent(kind, { run = false, at = 0, animate = true } = {}) {
    if (!EVENTS[kind]) return;
    const changed = kind !== s.event;
    const sceneChanged = sceneOf(kind) !== sceneOf();
    s.event = kind;
    s.t = clamp(Number(at) || 0, 0, dur(kind));
    lastT = s.t;
    s.playing = false;
    s.phase = '';
    if (coach) {
      // the pointer says what to tap in this scene (also when it is already showing)
      coachObject.label = sceneOf() === 'coin' ? 'coach_card' : 'coach_bus';
      const shownLabel = ui.coachLayer.querySelector('.pvc-coach-label');
      if (shownLabel && coach.step === 'object') shownLabel.textContent = t(coachObject.label);
    }
    pose();
    if (changed || sceneChanged || !animate) {
      // between bus events the camera glides to the new framing; to and from the table it cuts (another scale)
      s.userMovedCamera = false;
      flyTo(viewPose(s.view), animate && !sceneChanged ? 0.7 : 0);
    }
    syncPlay();
    if (changed) emit('event', { event: kind });
    if (run) {
      lastPress = performance.now();
      play();
    } else emitChange();
  }
  /** One small step of event time (keys): it pauses first. */
  function step(dir) {
    if (s.playing) pause();
    coach?.objectUsed(); // the student moves through the event: the pointer has done its job
    s.t = clamp(s.t + dir / 30, 0, dur());
    lastT = s.t;
    pose();
    syncPlay();
    emitChange();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  // The camera is kept relative to a point that moves along the road with the event (focusX): rel.look is where it
  // looks from that point, rel.offset where it stands from there. A student's turn or zoom changes rel.offset.
  // The event may also bring the camera lower and closer (focusLift m, focusZoom × the distance), e.g. once the
  // passenger is down on the road.
  let focusX = 0;
  let focusLift = 0;
  let focusZoom = 1;
  const rel = { look: new THREE.Vector3(0, 1.2, -0.6), offset: new THREE.Vector3(0, 1, -8) };
  function placeCamera() {
    controls.target.set(focusX + rel.look.x, rel.look.y - focusLift, rel.look.z);
    camera.position.copy(controls.target).addScaledVector(rel.offset, focusZoom);
  }
  stage.onBeforeRender(() => rel.offset.subVectors(camera.position, controls.target).divideScalar(focusZoom));

  const UP = new THREE.Vector3(0, 1, 0);
  const tmp = new THREE.Vector3();
  /** The points the view must hold (relative to focusX): the passenger with room for the arrows, or the glass. */
  function fitPoints() {
    if (sceneOf() === 'coin')
      // the glass, the card on it (and room ahead for it to fly), the finger and the hand behind it
      return [
        new THREE.Vector3(-0.19, 0, 0.035),
        new THREE.Vector3(0.15, 0, 0.035),
        new THREE.Vector3(-0.19, 0.125, -0.035),
        new THREE.Vector3(0.15, 0.125, -0.035),
      ];
    const hw = 1.15;
    // stepping off: from the road in front of where he lands (and the kerb) to above his head on the door step
    if (s.event === 'alight')
      return [
        new THREE.Vector3(-hw, 0, -2.25),
        new THREE.Vector3(hw, 0, -2.25),
        new THREE.Vector3(0, 0.17, -2.6),
        new THREE.Vector3(-hw, 2.15, BUS.stepZ),
        new THREE.Vector3(hw, 2.15, BUS.stepZ),
      ];
    // standing in the bus: from the floor to above the head
    return [
      new THREE.Vector3(-hw, 0.6, -0.6),
      new THREE.Vector3(hw, 0.6, -0.6),
      new THREE.Vector3(-hw, 2.5, -0.45),
      new THREE.Vector3(hw, 2.5, -0.45),
    ];
  }
  function viewPose(view) {
    const dir = DIRS[s.event === 'alight' ? 'alight' : sceneOf()][view];
    const pts = fitPoints();
    const target = new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
    const right = new THREE.Vector3().crossVectors(UP, dir).normalize();
    const up = new THREE.Vector3().crossVectors(dir, right);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * camera.aspect;
    const band = 58 / Math.max(stage.height, 200); // the buttons on top take this part of the height
    const tanUse = tanV * Math.max(0.5, 1 - band);
    let d = 0;
    for (const p of pts) {
      tmp.subVectors(p, target);
      const z = tmp.dot(dir);
      d = Math.max(d, z + Math.abs(tmp.dot(right)) / tanH, z + Math.abs(tmp.dot(up)) / tanUse);
    }
    d *= 1.03;
    target.addScaledVector(up, band * d * tanV * 0.5); // the picture sits a little lower, clear of the buttons
    return { look: target, offset: dir.clone().multiplyScalar(d) };
  }
  function flyTo({ look, offset }, duration = 0.7) {
    tweener.cancel('camera');
    if (!duration) {
      rel.look.copy(look);
      rel.offset.copy(offset);
      placeCamera();
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const l0 = rel.look.clone();
    const o0 = rel.offset.clone();
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        rel.look.lerpVectors(l0, look, k);
        rel.offset.lerpVectors(o0, offset, k);
        placeCamera();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = !s.locked; // the test keeps the view still
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    turning = true;
  });
  // the view starts from the front; a drag turns it (the camera really moves: a tap never does), and then the "front"
  // button appears to come back
  let turning = false;
  controls.addEventListener('end', () => {
    turning = false;
  });
  controls.addEventListener('change', () => {
    if (!turning || s.view === '3d') return;
    s.view = '3d';
    syncUI();
  });
  stage.onResize(() => !s.userMovedCamera && flyTo(viewPose(s.view), 0));

  // ── tapping the bus, the passenger or the card ──────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = sceneOf() === 'coin' ? [table.hit] : [bus.hit, passenger.hit];
    return raycaster.intersectObjects(hits, false).length > 0;
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      root.focus({ preventScroll: true });
      coach?.interrupt();
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    true,
  );
  // a tap anywhere on the view (not a turn of it) plays or pauses the event: the bus may have driven out of sight
  // and the boy may lie on the road, so the whole view is the target
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 10) return;
    tapScene();
  });
  ui.canvasHost.addEventListener('pointercancel', () => (down = null));
  function tapScene() {
    if (s.mode === 'quiz' && !quiz.revealed) return lockedNudge();
    toggle();
  }
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(p) ? 'pointer' : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 3000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(() => ui.hint.classList.remove('show'), duration);
  }
  function lockedNudge() {
    showHint(t('q_locked'));
    audio.error();
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const opt = (html) => `<span class="in-opt">${html}</span>`;

  let kinds = [];
  let question = null;
  let picked = -1;
  let before = null; // the learn state before the test
  /**
   * A question with word choices: keys of the options, the right one first (they are shuffled here). meta.qid names
   * its worked answer (w_<qid>) and the line for each wrong choice's mistake (m_<qid>_<choice>).
   */
  function wordQuestion(text, keys, meta, label = (k) => t(k)) {
    const order = shuffle([...keys]);
    question = { ...meta, order, right: keys[0] };
    return {
      text,
      choices: order.map((_, i) => i),
      expected: order.indexOf(keys[0]),
      tolerance: 0.5,
      label: (i) => opt(label(order[i])),
      meta: { ...meta, answer: keys[0] },
    };
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        before = { event: s.event };
        s.mode = 'quiz';
        s.playing = false;
        kinds = shuffle([...QUIZ_KINDS]);
        ui.hint.classList.remove('show');
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.helpers = true;
        syncUI();
        selectEvent(before?.event ?? 'start');
      },
      prepare(i) {
        if (i === 0) kinds = shuffle([...QUIZ_KINDS]); // a new order every round ("আবার পরীক্ষা দাও" too)
        const kind = kinds[i % kinds.length];
        s.locked = true;
        s.helpers = false;
        picked = -1;
        const T = simulate(kind);
        if (kind === 'start') {
          if (Math.random() < 0.5) {
            selectEvent('start', { at: T.key });
            return wordQuestion(t('q_start_why'), ['o_up_rest', 'o_bus_push', 'o_up_moving', 'o_air'], { kind, qid: 'start_why' });
          }
          selectEvent('start', { at: 0.2 });
          return wordQuestion(t('q_start_dir'), ['o_back', 'o_fwd', 'o_side', 'o_none'], { kind, qid: 'start_dir' });
        }
        if (kind === 'brake') {
          if (Math.random() < 0.5) {
            selectEvent('brake', { at: T.key });
            // the kind of inertia with its reason; the wrong choices are real mistakes: the other kind, the wrong
            // part of the body, and a push
            const pairs = {
              mm: ['o_kind_motion', 'o_why_moving'],
              rest: ['o_kind_rest', 'o_why_rest'],
              feet: ['o_kind_motion', 'o_why_feet'],
              push: ['o_kind_push', 'o_why_push'],
            };
            return wordQuestion(
              t('q_brake_type'),
              ['mm', 'rest', 'feet', 'push'],
              { kind, qid: 'brake_type' },
              (k) => `<b>${t(pairs[k][0])}</b><small>${t(pairs[k][1])}</small>`,
            );
          }
          selectEvent('brake', { at: 0.3 });
          return wordQuestion(t('q_brake_dir'), ['o_fwd', 'o_back', 'o_side', 'o_none'], { kind, qid: 'brake_dir' });
        }
        if (kind === 'alight') {
          // in the air, a moment before his feet touch the road (nothing in the picture gives the answer away)
          selectEvent('alight', { at: 0.8 });
          return wordQuestion(t('q_alight'), ['o_fall_fwd', 'o_fall_back', 'o_fall_down', 'o_fall_bus'], { kind, qid: 'alight' });
        }
        if (kind === 'coin') {
          selectEvent('coin', { at: 0.12 });
          return wordQuestion(t('q_coin'), ['o_coin_glass', 'o_coin_with', 'o_coin_back', 'o_coin_float'], { kind, qid: 'coin' });
        }
        selectEvent('gentle', { at: 0.2 });
        return wordQuestion(t('q_gentle'), ['o_g_little', 'o_g_more', 'o_g_same', 'o_g_fwd'], { kind, qid: 'gentle' });
      },
      reveal(_q, correct) {
        // the scene now plays on with its arrows and labels: the answer, seen
        s.helpers = true;
        lastPress = performance.now();
        play();
        const q = question;
        const tapped = q.order[picked];
        const mistake = !correct && tapped && t.has(`m_${q.qid}_${tapped}`) ? ` ${t(`m_${q.qid}_${tapped}`)}` : '';
        return t(`w_${q.qid}`) + mistake;
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── first-use pointer: on the passenger (a tap on the bus plays it) ─────────
  let coach = null;
  const coachObject = {
    label: 'coach_bus',
    candidates: () => {
      const out = [];
      const add = (p) => {
        v3.copy(p).project(camera);
        out.push({ x: (v3.x * 0.5 + 0.5) * stage.width, y: (-v3.y * 0.5 + 0.5) * stage.height });
      };
      if (sceneOf() === 'coin') {
        add(new THREE.Vector3(-0.02, TABLE.glass.h, 0));
        return out;
      }
      const r = passenger.root.position;
      // the bus just behind the passenger, at hip height (the label then falls on the bus, clear of him), or just
      // ahead of him; then his chest
      add(new THREE.Vector3(r.x - 0.5, r.y + 0.5, r.z));
      add(new THREE.Vector3(r.x + 0.55, r.y + 0.5, r.z));
      add(new THREE.Vector3(r.x + passenger.joints.chest.x, r.y + passenger.joints.chest.y, r.z));
      return out;
    },
    grabbable: (p) => pick(p),
  };
  if (o.coach) coach = createCoach({ stage, layer: ui.coachLayer, t, loupe: null, tweener, avoid: [ui.corner, ui.hint], object: coachObject });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    if (!s.locked) controls.enableRotate = true; // the test keeps the view still; afterwards a drag turns it again
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
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.example) {
      if (s.locked) return lockedNudge();
      selectEvent(b.dataset.example, { run: true });
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'play':
        if (s.mode === 'quiz' && !quiz.revealed) return lockedNudge();
        toggle();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const changes = ['ArrowLeft', 'ArrowRight', '1', '2', '3', '4'];
    if (changes.includes(k) && s.locked) {
      e.preventDefault();
      return lockedNudge();
    }
    if ((k === ' ' || k === 'Enter') && !target.closest('button')) {
      if (s.mode === 'quiz' && !quiz.revealed) lockedNudge();
      else toggle();
    } else if (k === 'ArrowRight' || k === 'ArrowLeft') step(k === 'ArrowRight' ? 1 : -1);
    else if (['1', '2', '3', '4'].includes(k)) selectEvent(EVENT_KEYS[Number(k) - 1], { run: true });
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') ui.hint.classList.remove('show');
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  selectEvent(s.event, { at: o.at ?? 0, animate: false });
  setView(s.view, { animate: false });
  syncPlay();
  syncUI();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else if (o.at == null) coach?.start();
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
     * Change any of: event ('start' | 'brake' | 'alight' | 'coin'; it starts again from the beginning), t (s of
     * event time, shown paused unless playing: true), playing, view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      // the book shows a moment of an event: no first-use pointer over it
      if (Number(p.t) > 0 || p.playing) coach?.objectUsed();
      if (p.event && EVENTS[p.event]) selectEvent(p.event, { at: p.t ?? 0, animate });
      else if (p.t != null) {
        s.t = clamp(Number(p.t) || 0, 0, dur());
        lastT = s.t;
        s.playing = false;
        pose();
      }
      if (p.view) await setView(p.view, { animate });
      if (p.playing === true && !s.playing) play();
      if (p.playing === false && s.playing) pause();
      syncPlay();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      selectEvent('start', { animate: false });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => (sceneOf() === 'coin' ? table.root : busScene), // the bus and the passenger (or the glass, card and coin), no arrows
  };
}
