// Inertia: the coin and the card (book pages 64–65, topic 3.1.1), student view. A card lies on a glass with a coin
// on it; a finger flicks the card hard. Watched 10 times slower: the card shoots off, the coin at rest wants to stay
// at rest (স্থিতি জড়তা), gets only a few cm/s from friction, and falls straight into the glass. A blue arrow on the
// card and an orange one on the coin show how fast each moves along the table, the panel gives the two speeds, and
// labels say what each does. Then a short test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createTable } from './table.js';
import { backdropTexture } from './textures.js';
import { createArrow, createTags } from './marks.js';
import { EVENTS, TABLE, clamp, sampleAt, simulate } from './motion.js';

export const DEFAULTS = {
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

// the arrows' colours (the card blue, the coin orange), and deeper shades of them for words on a white chip or the
// panel (4.5:1 or more)
const COLOR = { lower: '#1c6fd9', upper: '#e8590c' };
const INK = { lower: '#1a64c4', upper: '#c2410c' };
const ARROW = { scale: 0.05, r: 0.0022 }; // m of arrow per m/s
// from a little above, so the card, the coin and the inside of the glass show
const DIRS = { front: new THREE.Vector3(0, 0.6, -1).normalize(), '3d': new THREE.Vector3(0.5, 0.65, -0.62).normalize() };
const QUIZ_KINDS = ['coin', 'kind', 'speed'];
const KIND = 'coin'; // the one event

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
  // the panel, top to bottom: the action (play / pause / again), the two speeds with how much time is slowed, what
  // happens or why, and the book's definition
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learnAlign: 'start',
    learn: `
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
  // the action: play / pause / again (a tap on the view does the same)
  const playBtn = ui.$('.in-play');
  const slowNote = ui.$('.in-slow');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 28, near: 0.02, far: 120, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  // round the table: a calm deep-blue gradient (the same from every angle; capture paints it too)
  if (o.bg !== 'transparent') scene.background = backdropTexture();
  controls.enablePan = false;
  controls.minDistance = 0.15;
  controls.maxDistance = 30;
  const M = createMaterials(stage.renderer);
  const table = createTable({ materials: M, t });
  scene.add(table.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // daylight: a soft sky light and a sun from the camera's side (it casts soft shadows when shadows are on)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe2dccf, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.75);
  scene.add(sun, sun.target);
  if (o.shadow && o.bg !== 'transparent') {
    // soft PCF on a shadow box fitted round the glass: the card, the coin and the hand cast; the table receives
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.01;
    const solid = (m) => m instanceof THREE.Mesh && m.material?.visible !== false && !m.material?.transparent;
    table.root.traverse((m) => {
      if (solid(m)) m.castShadow = true;
    });
  }

  // the two velocity arrows: the card in blue, the coin in orange
  const A = { lower: createArrow(COLOR.lower, ARROW.r), upper: createArrow(COLOR.upper, ARROW.r) };
  scene.add(A.lower.group, A.upper.group);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    event: KIND,
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
  const dur = () => simulate(KIND).duration; // s
  let sample = sampleAt(s.event, 0);

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    lower: $('.pvc-t.lower b'),
    upper: $('.pvc-t.upper b'),
    extra: $('.in-extra'),
  };
  $('.pvc-t.lower small').textContent = t('part_card');
  $('.pvc-t.upper small').textContent = t('part_coin');
  $('.in-k').textContent = t('speed_k_coin');
  const shown = { lower: '', upper: '', extra: '' };
  function panel() {
    const lo = N(Math.abs(sample.lowerV).toFixed(1));
    const up = N(Math.abs(sample.upperV).toFixed(1));
    if (lo !== shown.lower) el.lower.textContent = shown.lower = lo;
    if (up !== shown.upper) el.upper.textContent = shown.upper = up;
    // before the flick: what is about to happen; while it happens and afterwards: why
    const extra = s.phase === 'before' ? `${t('set_coin')} ${s.playing ? t('watch') : t('do_coin')}` : t('why_coin');
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
  }

  // ── labels on the scene ─────────────────────────────────────────────────────
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
      list.push(objectBox(table.coin), objectBox(table.card), objectBox(table.glass));
      for (const a of Object.values(A)) {
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
  // what each part does; once the card has gone from under it, the coin falls straight down
  const tagHtml = (which) => {
    const key = which === 'upper' && sample.dropped ? 'tag_coin_upper_drop' : `tag_coin_${which}`;
    return `<b>${t(which === 'upper' ? 'part_coin' : 'part_card')}</b><span>${t(key)}</span>`;
  };

  // anchor points of the labels: the middle of each arrow, or the body part itself while its arrow is short
  const anchorLower = new THREE.Vector3();
  const anchorUpper = new THREE.Vector3();
  const aim = (a, fallback, out) => (a.group.visible && a.length > 0.006 ? a.pointAt(0.55, out) : out.copy(fallback));
  const feetPoint = new THREE.Vector3();
  const upperPoint = new THREE.Vector3();

  // ── putting the scene in its state ──────────────────────────────────────────
  let lastT = 0;
  function pose() {
    sample = sampleAt(KIND, s.t);
    table.setState(sample);
    table.root.updateMatrixWorld(true);
    const { card: C, coin: K } = TABLE;
    feetPoint.set(sample.cardX + C.w / 2 + 0.003, sample.cardY, -C.d / 2 - 0.004);
    A.lower.group.position.copy(feetPoint);
    upperPoint.set(sample.coinX + K.r + 0.003, sample.coinY, -0.02);
    A.upper.group.position.copy(upperPoint);
    const k = s.helpers ? ARROW.scale : 0;
    A.lower.set(sample.lowerV, k);
    A.upper.set(sample.upperV, k);
    aimSun(0, 1, { left: -0.32, right: 0.32, top: 0.32, bottom: -0.32, near: 0.4, far: 2.2 });
    A.lower.group.updateMatrixWorld(true);
    A.upper.group.updateMatrixWorld(true);
    // labels: while the event happens (the "act"), each part says what it does
    const phase = sample.phase;
    const showTags = s.helpers && phase === 'act';
    tags.set('lower', showTags ? tagHtml('lower') : null, () => aim(A.lower, feetPoint, anchorLower));
    tags.set('upper', showTags ? tagHtml('upper') : null, () => aim(A.upper, upperPoint, anchorUpper));
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

  /** A sound as the finger strikes the card, and as the coin lands in the glass. */
  function sounds(from, to) {
    const T = simulate(KIND);
    const crossed = (at) => at != null && from < at && to >= at;
    if (crossed(T.act[0])) audio.tick();
    if (crossed(T.landT)) audio.contact();
  }

  stage.addTicker((dt) => {
    if (!s.playing) return false;
    s.t = Math.min(dur(), s.t + dt / ev().slow);
    if (s.t >= dur()) {
      s.playing = false;
      syncPlay();
      emit('end', { event: KIND });
      emitChange();
    }
    pose();
    return true;
  });

  function snapshot() {
    const T = simulate(KIND);
    return {
      event: KIND,
      t: Math.round(s.t * 1000) / 1000,
      duration: dur(),
      playing: s.playing,
      phase: s.phase,
      slow: ev().slow,
      inertia: ev().inertia, // 'rest' (স্থিতি জড়তা) | 'motion' (গতি জড়তা)
      lowerSpeed: Math.round(sample.lowerV * 100) / 100, // m/s along the table (the card)
      upperSpeed: Math.round(sample.upperV * 100) / 100, // m/s along the table (the coin)
      landed: Boolean(sample.landed), // the coin is in the glass
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
  /** Show the event from its beginning (or at time `at`), paused unless `run`. */
  function jumpTo({ run = false, at = 0, animate = true } = {}) {
    s.t = clamp(Number(at) || 0, 0, dur());
    lastT = s.t;
    s.playing = false;
    s.phase = '';
    pose();
    if (!animate) {
      s.userMovedCamera = false;
      flyTo(viewPose(s.view), 0);
    }
    syncPlay();
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
  // The camera: rel.look is where it looks, rel.offset where it stands from there. A student's turn or zoom changes
  // rel.offset.
  const rel = { look: new THREE.Vector3(0, 0.06, 0), offset: new THREE.Vector3(0, 0.3, -0.6) };
  function placeCamera() {
    controls.target.copy(rel.look);
    camera.position.copy(controls.target).add(rel.offset);
  }
  stage.onBeforeRender(() => rel.offset.subVectors(camera.position, controls.target));

  const UP = new THREE.Vector3(0, 1, 0);
  const tmp = new THREE.Vector3();
  // the glass, the card on it (and room ahead for it to fly), the finger and the hand behind it
  const FIT = [
    new THREE.Vector3(-0.19, 0, 0.035),
    new THREE.Vector3(0.15, 0, 0.035),
    new THREE.Vector3(-0.19, 0.125, -0.035),
    new THREE.Vector3(0.15, 0.125, -0.035),
  ];
  function viewPose(view) {
    const dir = DIRS[view];
    const pts = FIT;
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

  // ── tapping the card ────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects([table.hit], false).length > 0;
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
  // a tap anywhere on the view (not a turn of it) plays or pauses the event
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
    questions: 3,
    hooks: {
      enter() {
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
        jumpTo();
      },
      prepare(i) {
        if (i === 0) kinds = shuffle([...QUIZ_KINDS]); // a new order every round ("আবার পরীক্ষা দাও" too)
        const kind = kinds[i % kinds.length];
        s.locked = true;
        s.helpers = false;
        picked = -1;
        if (kind === 'coin') {
          jumpTo({ at: 0.12 });
          return wordQuestion(t('q_coin'), ['o_coin_glass', 'o_coin_with', 'o_coin_back', 'o_coin_float'], { kind, qid: 'coin' });
        }
        if (kind === 'kind') {
          // the kind of inertia, with its reason; the wrong ones are real mistakes
          jumpTo({ at: simulate(KIND).key });
          return wordQuestion(t('q_coin_kind'), ['o_ck_rest', 'o_ck_motion', 'o_ck_card', 'o_ck_push'], { kind, qid: 'coin_kind' });
        }
        // which one moves fast just after the flick (the arrows and numbers hidden until the answer)
        jumpTo({ at: 0.12 });
        return wordQuestion(t('q_coin_speed'), ['o_cs_card', 'o_cs_coin', 'o_cs_same', 'o_cs_none'], { kind, qid: 'coin_speed' });
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

  // ── first-use pointer: on the card (a tap on it plays the flick) ────────────
  let coach = null;
  const coachObject = {
    label: 'coach_card',
    candidates: () => {
      const out = [];
      const add = (p) => {
        v3.copy(p).project(camera);
        out.push({ x: (v3.x * 0.5 + 0.5) * stage.width, y: (-v3.y * 0.5 + 0.5) * stage.height });
      };
      add(new THREE.Vector3(-0.02, TABLE.glass.h, 0));
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
    const changes = ['ArrowLeft', 'ArrowRight'];
    if (changes.includes(k) && s.locked) {
      e.preventDefault();
      return lockedNudge();
    }
    if ((k === ' ' || k === 'Enter') && !target.closest('button')) {
      if (s.mode === 'quiz' && !quiz.revealed) lockedNudge();
      else toggle();
    } else if (k === 'ArrowRight' || k === 'ArrowLeft') step(k === 'ArrowRight' ? 1 : -1);
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') ui.hint.classList.remove('show');
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  jumpTo({ at: o.at ?? 0, animate: false });
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
     * Change any of: t (s of event time, shown paused unless playing: true), playing, view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      // the book shows a moment of an event: no first-use pointer over it
      if (Number(p.t) > 0 || p.playing) coach?.objectUsed();
      if (p.t != null) {
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
      jumpTo({ animate: false });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => table.root, // the glass, card and coin, no arrows
  };
}
