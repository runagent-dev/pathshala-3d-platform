// Force: contact and non-contact (book page 67, topic 3.1.2: বল), student view. The page's five examples, one at a
// time: a crane lifts a heavy block, a student pushes a trolley, friction stops a sliding crate, a ball let go
// falls, a magnet pulls a nail. Press চালাও (or touch the picture): the force acts, its arrow appears where it acts
// with its name, and the place where it meets the body is marked: a ring where something touches (স্পর্শ), a
// dashed bracket across an empty gap (ফাঁক). The first time, it stops at the telling moment and the student puts
// it in the right box, স্পর্শ বল or অস্পর্শ বল; the book's definition lights the part that applies (a body at
// rest starts moving, or a moving body's velocity changes), and a live readout shows the velocity. Then a short
// test with new cases (a rope pulling a cart, a parachute, a comb lifting paper). Built on the shared student kit.
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
import { EXAMPLE_ICONS } from './icons.js';
import { createOverlay } from './overlay.js';
import { createCraneScene } from './crane.js';
import { createPushScene } from './push.js';
import { createFrictionScene } from './friction.js';
import { createFallScene } from './fall.js';
import { createMagnetScene } from './magnet.js';
import { createCombScene, createParachuteScene, createRopeScene } from './pool.js';
import {
  CASES,
  DURATION,
  EFFECT,
  EFFECT_CHOICES,
  EFFECT_RIGHT,
  EVIDENCE_CHOICES,
  EXAMPLE_IDS,
  FALL,
  FRICTION,
  KEY,
  KIND,
  KIND_CHOICES,
  SLOW,
  actionAt,
  drop,
  roundTo,
  sameChoices,
  shuffle,
  speedText,
} from './motion.js';

export const DEFAULTS = {
  example: 'crane', // the first example shown
  at: 'rest', // 'rest' | 'key' | 'end': where it starts (key: stopped at the telling moment)
  sorted: false, // all five already in their boxes (a summary for the book page)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

/** One colour per meaning: the force (its arrow and name), touching, not touching. */
const COLORS = { force: '#e8590c', contact: '#1c6fd9', noncontact: '#7048e8' };
const TOP_ROOM = 52; // px kept clear at the top of the view for the corner buttons and the note

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'cnf');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="cnf-ex" role="group" aria-label="${t('ex_label')}">
            ${EXAMPLE_IDS.map((id) => `<button data-ex="${id}" aria-pressed="false">${EXAMPLE_ICONS[id]}<span>${t(`ex_${id}`)}</span><i class="cnf-tag"></i></button>`).join('')}
          </div>
          <p class="cnf-def">${t('def')}</p>
          <p class="cnf-line" aria-live="polite"></p>
          <div class="cnf-foot">
            <button class="pvc-btn primary" data-act="play"><span class="ic"></span><span class="lb"></span></button>
            <span class="cnf-speed"><span class="k">${t('speed')}</span><b>0</b><small>${t('unit_ms')}</small></span>
            <span class="cnf-count"></span>
          </div>
          <div class="cnf-trays">
            <button class="cnf-tray" data-sort="contact"><b>${t('tray_contact')}</b><span class="cnf-items"></span></button>
            <button class="cnf-tray" data-sort="noncontact"><b>${t('tray_noncontact')}</b><span class="cnf-items"></span></button>
          </div>`,
  });
  const note = document.createElement('div');
  note.className = 'cnf-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.01, far: 200, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  const M = createMaterials(stage.renderer);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  const shadows = o.shadow && o.bg !== 'transparent';
  const sun = new THREE.DirectionalLight(0xffffff, shadows ? 0.55 : 0.35);
  scene.add(sun, sun.target);
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 6;
    sun.shadow.blurSamples = 12;
  }

  const make = { crane: createCraneScene, push: createPushScene, friction: createFrictionScene, fall: createFallScene, magnet: createMagnetScene };
  const makePool = { rope: createRopeScene, parachute: createParachuteScene, comb: createCombScene };
  /** @type {Record<string, any>} */
  const scenes = {};
  function sceneOf(id) {
    if (!scenes[id]) {
      const f = make[id] || makePool[id];
      const sc = f({ colors: COLORS, materials: M });
      sc.root.visible = false;
      scene.add(sc.root);
      scenes[id] = sc;
    }
    return scenes[id];
  }
  for (const id of EXAMPLE_IDS) sceneOf(id);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    example: EXAMPLE_IDS.includes(o.example) ? o.example : 'crane',
    scene: '', // what the 3D shows: an example, or a test case (rope, parachute, comb)
    phase: 'rest', // 'rest' | 'acting' | 'paused' | 'done'
    time: 0, // s along the example's action
    playing: false,
    stopAtKey: true, // this run stops at the telling moment (the first time, until sorted)
    sorted: /** @type {Record<string, string>} */ ({}),
    feedback: '', // '' | 'wrong' | 'right': the last sorting at this stop
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    poolTime: 0,
    quizShow: { arrow: true, label: true, marker: false, markerLabel: false },
    token: 0,
  };
  const isPool = (id) => id in CASES;
  const cur = () => scenes[s.scene];
  const motion = () => (isPool(s.scene) ? null : actionAt(s.scene, s.time));

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    chips: ui.$$('[data-ex]'),
    def: $('.cnf-def'),
    line: $('.cnf-line'),
    play: $('[data-act="play"]'),
    playIcon: $('[data-act="play"] .ic'),
    playLabel: $('[data-act="play"] .lb'),
    speed: $('.cnf-speed b'),
    count: $('.cnf-count'),
    trays: ui.$$('[data-sort]'),
  };

  /** Has the example's motion ended (the block hangs, the hands let go, the crate stopped, the ball landed, the nail stuck)? */
  function ended(id, m) {
    if (s.phase === 'done') return true;
    if (id === 'crane') return m.speed === 0 && m.pos > 0;
    if (id === 'push') return !m.acting && m.pos > 0;
    if (id === 'friction') return m.speed === 0;
    if (id === 'fall') return m.bounces > 0 || m.resting;
    return m.touching;
  }
  /** What the panel says now: never something the picture contradicts. */
  function lineHtml() {
    const id = s.example;
    if (s.phase === 'rest') return t('lead', { book: t(`book_${id}`), text: t(`rest_${id}`) });
    if (atKey()) return s.feedback === 'wrong' ? `${t(`wrong_${id}`)} ${t('ask')}` : t('ask');
    const m = actionAt(id, s.time);
    const what = t(ended(id, m) ? `end_${id}` : `act_${id}`);
    const kind = s.sorted[id] || s.phase === 'done' ? ` ${t(`kind_${id}`)}` : '';
    return `${s.feedback === 'right' ? `<b class="cnf-ok">${t('right')}</b> ` : ''}${what}${kind}`;
  }
  const atKey = () => s.phase === 'paused' && !s.sorted[s.example] && Math.abs(s.time - KEY[s.example]) < 1e-6;

  /** The velocity readout and the sentence (while it plays, only these change). */
  let lastLine = '';
  function refreshSpeed() {
    if (s.mode === 'quiz') return;
    el.speed.textContent = N(speedText(actionAt(s.example, s.time).speed));
    const html = lineHtml();
    if (html !== lastLine) el.line.innerHTML = lastLine = html;
  }
  function refreshPanel() {
    if (s.mode === 'quiz') return;
    const id = s.example;
    refreshSpeed();
    const lit = s.phase !== 'rest';
    el.def.classList.toggle('on-start', lit && (EFFECT[id] === 'start' || EFFECT[id] === 'both'));
    el.def.classList.toggle('on-change', lit && (EFFECT[id] === 'change' || EFFECT[id] === 'both'));
    const again = s.phase === 'done';
    el.playIcon.innerHTML = again ? ICONS.reset : ICONS.play;
    el.playLabel.textContent = t(again ? 'act_again' : 'act_play');
    el.play.disabled = s.phase === 'acting' || atKey();
    const asking = atKey();
    for (const b of el.trays) {
      const kind = b.dataset.sort;
      const items = EXAMPLE_IDS.filter((x) => s.sorted[x] === kind);
      b.querySelector('.cnf-items').innerHTML = items.length
        ? items.map((x) => `<i title="${t(`ex_${x}`)}" aria-label="${t(`ex_${x}`)}">${EXAMPLE_ICONS[x]}</i>`).join('')
        : `<em>${t('tray_empty')}</em>`;
      b.classList.toggle('cnf-ask', asking);
      b.setAttribute('aria-label', `${t(`tray_${kind}`)}: ${items.map((x) => t(`ex_${x}`)).join(', ') || t('tray_empty')}`);
    }
    const n = Object.keys(s.sorted).length;
    el.count.textContent = n === EXAMPLE_IDS.length ? t('sorted_all') : t('sorted_count', { n, total: EXAMPLE_IDS.length });
    el.count.classList.toggle('all', n === EXAMPLE_IDS.length);
    for (const b of el.chips) {
      const k = s.sorted[b.dataset.ex];
      b.querySelector('.cnf-tag').dataset.kind = k || '';
      b.title = k ? `${t(`ex_${b.dataset.ex}`)}: ${t(`tray_${k}`)}` : t(`ex_${b.dataset.ex}`);
    }
  }

  // ── what the 3D shows ───────────────────────────────────────────────────────
  const overlay = createOverlay({ stage, layer: ui.annoLayer, avoid: avoidRects });
  const tail = new THREE.Vector3();
  const tip = new THREE.Vector3();

  /** Draw the current scene at the current time, and the arrow, marker and labels that go with it. */
  function drawScene() {
    const sc = cur();
    if (!sc) return;
    if (isPool(s.scene)) {
      sc.update(s.poolTime, { arrowOn: s.quizShow.arrow });
    } else {
      const m = motion();
      const shown = s.phase !== 'rest' || (s.mode === 'quiz' && s.time > 0);
      sc.update(m, { arrowOn: shown && m.acting && (s.mode !== 'quiz' || s.quizShow.arrow), moving: true });
    }
    stage.invalidate();
  }

  /** Which marker (if any) the current state shows. */
  function markerNow() {
    const sc = cur();
    if (!sc) return null;
    if (isPool(s.scene)) return s.quizShow.marker ? sc.marker() : null;
    const m = motion();
    if (s.phase === 'rest' && !(s.mode === 'quiz' && s.time > 0)) return null;
    if (s.mode === 'quiz' && !s.quizShow.marker) return null;
    if (!m.acting || !(m.touching || m.gap != null)) return null;
    return sc.marker(m);
  }
  function arrowNow() {
    const sc = cur();
    if (!sc?.arrow.root.visible) return null;
    sc.arrow.ends(tail, tip);
    return { tail, tip };
  }

  /** The labels: the force's name beside its arrow; স্পর্শ / ফাঁক beside the marker once the example is sorted. */
  function setLabels() {
    const id = s.scene;
    const kind = isPool(id) ? CASES[id] : KIND[id];
    const labels = [];
    const quiz = s.mode === 'quiz';
    if (!quiz || s.quizShow.label) labels.push({ id: 'force', html: t(`f_${id}`), tone: 'force', anchor: 'arrow', prefer: scenePrefer[id] });
    const markerLabel = quiz ? s.quizShow.markerLabel : Boolean(s.sorted[id]);
    if (markerLabel)
      labels.push({
        id: 'marker',
        html: t(kind === 'contact' ? 'm_contact' : 'm_gap'),
        tone: kind === 'contact' ? 'contact' : 'gap',
        anchor: 'marker',
        prefer: markerPrefer[id],
      });
    overlay.set({ labels, marker: markerNow, arrow: arrowNow, bodies: () => cur()?.bodies(motion()) || [] });
  }
  // where each label would rather sit (the placer still moves it off anything it would cover)
  const scenePrefer = {
    crane: ['right', 'up', 'ur', 'dr', 'left'],
    push: ['up', 'ur', 'ul', 'down'],
    friction: ['down', 'dl', 'dr', 'left', 'up'],
    fall: ['left', 'ul', 'dl', 'right'],
    magnet: ['up', 'ul', 'ur', 'down'],
    rope: ['up', 'ul', 'ur', 'down'],
    parachute: ['right', 'left', 'ur', 'ul'],
    comb: ['left', 'ul', 'dl', 'right'],
  };
  const markerPrefer = {
    crane: ['left', 'ul', 'dl', 'down'],
    push: ['down', 'dl', 'dr', 'left'],
    friction: ['down', 'dr', 'dl', 'right'],
    fall: ['left', 'dl', 'ul', 'right'],
    magnet: ['down', 'dl', 'dr', 'up'],
    rope: ['down', 'dl', 'dr'],
    parachute: ['down', 'dl', 'dr', 'left'],
    comb: ['left', 'dl', 'ul', 'down'],
  };

  let avoidCache = null;
  function avoidRects() {
    if (avoidCache && !ui.hint.classList.contains('show')) return avoidCache;
    const sr = ui.stage.getBoundingClientRect();
    const out = [];
    for (const e of [ui.corner, note, ui.hint.classList.contains('show') ? ui.hint : null]) {
      if (!e) continue;
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      out.push({ x: r.left - sr.left - 4, y: r.top - sr.top - 4, w: r.width + 8, h: r.height + 8 });
    }
    if (!ui.hint.classList.contains('show')) avoidCache = out;
    return out;
  }

  /** Show scene `id` (an example or a test case), with its camera, light and note. */
  function showScene(id, { animate = true } = {}) {
    const prev = s.scene;
    s.scene = id;
    const sc = sceneOf(id);
    for (const [k, other] of Object.entries(scenes)) other.root.visible = k === id;
    // the light (and its shadow box) follows the scene
    const c = sc.shadow.center;
    const r = sc.shadow.r;
    sun.position.set(c.x + r * 0.6, c.y + r * 1.6, c.z + r * 1.1);
    sun.target.position.copy(c);
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: r * 0.2, far: r * 5 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = r * 0.004;
    note.textContent = isPool(id) ? '' : SLOW[id] > 1 ? t('note_slow', { k: SLOW[id] }) : t('note_real');
    avoidCache = null;
    if (prev !== id) {
      s.userMovedCamera = false;
      const pose = viewPose();
      controls.minDistance = pose.distance * 0.35;
      controls.maxDistance = pose.distance * 3;
      flyTo(pose, 0);
      if (animate) {
        sc.root.scale.setScalar(0.92);
        tweener.animate({
          key: 'pop',
          duration: 0.35,
          ease: ease.outCubic,
          onUpdate: (k) => {
            sc.root.scale.setScalar(0.92 + 0.08 * k);
            stage.invalidate();
          },
        });
      } else sc.root.scale.setScalar(1);
    }
    setLabels();
    drawScene();
  }

  // ── the action ──────────────────────────────────────────────────────────────
  /** Choose an example: it starts afresh, at rest. */
  function setExample(id, { animate = true } = {}) {
    if (!EXAMPLE_IDS.includes(id)) return;
    s.token++;
    s.example = id;
    s.time = 0;
    s.phase = 'rest';
    s.playing = false;
    s.feedback = '';
    s.stopAtKey = !s.sorted[id];
    showScene(id, { animate });
    for (const b of el.chips) b.classList.remove('cnf-nudge');
    hideHint();
    syncUI();
    refreshPanel();
    emit('example', { example: id });
    emitChange();
  }

  /** Play the example's action (from the start, or on from where it stopped). */
  function play({ silent = false } = {}) {
    if (s.locked) return lockedNudge();
    if (s.phase === 'acting') return;
    if (atKey()) return showHint(t('ask').replace(/<[^>]+>/g, ''), { duration: 2600 });
    if (s.phase === 'done' || s.phase === 'rest') {
      s.time = 0;
      s.stopAtKey = !s.sorted[s.example];
      s.feedback = '';
    }
    s.phase = 'acting';
    s.playing = true;
    coach?.objectUsed();
    if (!silent) audio.pop();
    setLabels();
    refreshPanel();
    drawScene();
    emit('act', { example: s.example });
    emitChange();
  }

  let lastSound = { bounces: 0, touching: false };
  stage.addTicker((dt) => {
    if (isPool(s.scene)) {
      s.poolTime += dt;
      drawScene();
      return true;
    }
    if (!s.playing) return false;
    const id = s.scene;
    const before = s.time;
    let next = s.time + dt;
    const stopAt = s.stopAtKey && s.mode !== 'quiz' && before < KEY[id] - 1e-9 ? KEY[id] : Number.POSITIVE_INFINITY;
    if (next >= stopAt) {
      next = stopAt;
      s.playing = false;
      s.phase = 'paused';
      s.feedback = '';
      if (s.mode !== 'quiz') audio.tick();
    }
    if (next >= DURATION[id]) {
      next = DURATION[id];
      s.playing = false;
      s.phase = 'done';
    }
    s.time = next;
    const m = actionAt(id, s.time);
    // little sounds: the nail clicks onto the magnet, the ball lands
    if (id === 'magnet' && m.touching && !lastSound.touching) audio.contact();
    if (id === 'fall' && m.bounces > lastSound.bounces) audio.contact();
    lastSound = { bounces: m.bounces || 0, touching: Boolean(m.touching) };
    drawScene();
    if (!s.playing) {
      setLabels();
      refreshPanel();
      emitChange();
    } else if (Math.floor(before * 8) !== Math.floor(s.time * 8)) refreshSpeed(); // the readout, 8 times a second
    return true;
  });

  /** Put the current example in a box: 'contact' or 'noncontact'. */
  function sort(kind, { silent = false } = {}) {
    if (s.locked) return lockedNudge();
    const id = s.example;
    if (s.phase === 'rest') return showHint(t('hint_play_first'), { duration: 2600 });
    if (s.phase === 'acting' && !s.sorted[id]) return showHint(t('hint_wait'), { duration: 2200 });
    if (s.sorted[id]) return showHint(t('hint_sorted'), { duration: 2200 });
    const correct = KIND[id] === kind;
    emit('sort', { example: id, choice: kind, correct });
    if (!correct) {
      s.feedback = 'wrong';
      if (!silent) audio.error();
      const tray = el.trays.find((b) => b.dataset.sort === kind);
      tray?.classList.remove('cnf-shake');
      void tray?.offsetWidth;
      tray?.classList.add('cnf-shake');
      refreshPanel();
      return;
    }
    s.sorted[id] = kind;
    s.feedback = 'right';
    if (!silent) audio.success();
    setLabels();
    // go on to the end; the next example's chip glows, so the student moves on
    if (s.phase === 'paused') {
      s.phase = 'acting';
      s.playing = true;
    }
    const nextId = EXAMPLE_IDS.find((x) => !s.sorted[x]);
    for (const b of el.chips) b.classList.toggle('cnf-nudge', b.dataset.ex === nextId);
    refreshPanel();
    emitChange();
  }

  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const basisX = new THREE.Vector3();
  const basisY = new THREE.Vector3();
  const corner = new THREE.Vector3();
  const centre = new THREE.Vector3();
  /** The front (or 3D) view that fits the scene's box in the room below the buttons. */
  function viewPose(view = s.view) {
    const sc = cur();
    const dir = sc.views[view];
    const { min, max } = sc.fit;
    centre.addVectors(min, max).multiplyScalar(0.5);
    basisX.crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
    basisY.crossVectors(dir, basisX).normalize();
    let hw = 0;
    let hh = 0;
    let depth = 0;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z).sub(centre);
      hw = Math.max(hw, Math.abs(corner.dot(basisX)));
      hh = Math.max(hh, Math.abs(corner.dot(basisY)));
      depth = Math.max(depth, corner.dot(dir));
    }
    const W = Math.max(stage.width, 1);
    const H = Math.max(stage.height, 1);
    const top = Math.min(TOP_ROOM, H * 0.16);
    const bottom = 8;
    const side = 12;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const tanV = Math.tan(vfov / 2);
    const tanH = tanV * (W / H);
    const usableV = Math.max(0.4, (H - top - bottom) / H);
    const usableH = Math.max(0.6, (W - 2 * side) / W);
    const distance = Math.max(hh / tanV / usableV, hw / tanH / usableH) + depth;
    // centre the box in the room below the buttons: move the look-at point up the screen
    const perPixel = (2 * (distance - depth) * tanV) / H;
    const target = centre.clone().addScaledVector(basisY, ((top - bottom) / 2) * perPixel);
    camera.near = Math.max(0.002, distance * 0.02);
    camera.far = distance * 40;
    camera.updateProjectionMatrix();
    return { target, position: target.clone().addScaledVector(dir, distance), distance };
  }
  function flyTo({ position, target }, duration = 0.8) {
    tweener.cancel('camera');
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
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    avoidCache = null;
    root.classList.toggle('cnf-compact', stage.height < 300 || stage.width < 360);
    if (!s.userMovedCamera && cur()) flyTo(viewPose(s.view), 0);
  });

  // ── touching the picture: a tap on the example plays it ────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pv = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const toScreen = (p) => {
    pv.copy(p).project(camera);
    return { x: (pv.x * 0.5 + 0.5) * stage.width, y: (-pv.y * 0.5 + 0.5) * stage.height };
  };
  /** Does a finger at canvas point p touch the example (its big invisible targets)? */
  function pick(p) {
    const sc = cur();
    if (!sc?.hits.length) return false;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(sc.hits, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      root.focus({ preventScroll: true });
      coach?.interrupt();
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (s.mode === 'quiz' || !pick(canvasPoint(e))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.phase === 'done' || s.phase === 'rest' || (s.phase === 'paused' && !atKey())) play();
      else if (atKey()) pulseTrays();
    },
    true,
  );
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = s.mode !== 'quiz' && pick(p) ? 'pointer' : '';
    });
  });
  function pulseTrays() {
    for (const b of el.trays) {
      b.classList.remove('cnf-shake');
      void b.offsetWidth;
      b.classList.add('cnf-shake');
    }
  }

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
    stage.invalidate();
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
    stage.invalidate();
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  const textLabel = (keys) => (j) => `<span class="cnf-opt">${t(keys[j])}</span>`;
  let kinds = [];
  let question = null;

  /** A book example for a question: stopped at `time` (or playing from the start), its arrow and name shown. */
  function questionExample(id, { time = 0, playing = false } = {}) {
    s.token++;
    s.quizShow = { arrow: true, label: true, marker: false, markerLabel: false };
    s.time = time;
    s.playing = playing;
    s.stopAtKey = false;
    s.phase = playing ? 'acting' : time > 0 ? 'paused' : 'rest';
    showScene(id, { animate: false });
  }
  function questionCase(id) {
    s.token++;
    s.playing = false;
    s.quizShow = { arrow: true, label: true, marker: false, markerLabel: false };
    s.poolTime = 0.6;
    showScene(id, { animate: false });
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
        s.locked = true;
        s.playing = false;
        hideHint();
        kinds = shuffle(['kind_c', 'kind_n', 'effect', 'evidence', 'same']);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizShow = { arrow: true, label: true, marker: false, markerLabel: false };
        syncUI();
        setExample(s.example, { animate: false });
      },
      prepare(i, _alive, say) {
        const kind = kinds[i % kinds.length];
        if (kind === 'kind_c' || kind === 'kind_n') {
          const id = kind === 'kind_c' ? pickOne(['rope', 'parachute']) : 'comb';
          questionCase(id);
          const keys = shuffle(KIND_CHOICES[id]);
          say(t(`q_kind_${id}`));
          question = { kind, id };
          return {
            choices: [0, 1, 2, 3],
            expected: keys.indexOf(KIND_CHOICES[id][0]),
            tolerance: 0.5,
            label: textLabel(keys),
            meta: { kind, case: id },
          };
        }
        if (kind === 'effect') {
          // caught in the middle of its action, stopped: the arrow shows which way the force acts
          const id = pickOne(['friction', 'fall', 'magnet']);
          questionExample(id, { time: KEY[id] });
          const keys = shuffle(EFFECT_CHOICES);
          say(t(`q_eff_${id}`));
          question = { kind, id };
          return {
            choices: [0, 1, 2, 3],
            expected: keys.indexOf(EFFECT_RIGHT[id]),
            tolerance: 0.5,
            label: textLabel(keys),
            meta: { kind, example: id },
          };
        }
        if (kind === 'evidence') {
          // an example plays from the start (and then stays at its end)
          const id = pickOne(['push', 'crane', 'friction']);
          questionExample(id, { time: 0, playing: true });
          const keys = shuffle(EVIDENCE_CHOICES);
          say(t('q_ev'));
          question = { kind, id };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf('ev_change'), tolerance: 0.5, label: textLabel(keys), meta: { kind, example: id } };
        }
        // same kind as which of the book's examples? (a non-contact example, stopped with its gap open)
        const id = pickOne(['magnet', 'fall']);
        questionExample(id, { time: KEY[id] });
        const right = sameChoices(id);
        const keys = shuffle(right.map((x) => `same_${x}`));
        say(t(`q_same_${id}`));
        question = { kind, id };
        return {
          choices: [0, 1, 2, 3],
          expected: keys.indexOf(`same_${right[0]}`),
          tolerance: 0.5,
          label: textLabel(keys),
          meta: { kind, example: id },
        };
      },
      reveal() {
        const q = question;
        if (q.kind === 'kind_c' || q.kind === 'kind_n') {
          s.quizShow = { arrow: true, label: true, marker: true, markerLabel: true };
          setLabels();
          drawScene();
          return t(`why_${q.id}`);
        }
        if (q.kind === 'effect') {
          // it goes on to the end: the answer happens
          s.quizShow = { arrow: true, label: true, marker: true, markerLabel: true };
          s.phase = 'acting';
          s.playing = true;
          setLabels();
          const vLand = Math.abs(drop(Math.sqrt((2 * FALL.h) / 9.8) - 1e-6, FALL.h).v);
          return t(`why_eff_${q.id}`, { v0: FRICTION.v0, v: roundTo(vLand, 0.1) });
        }
        if (q.kind === 'evidence') {
          s.quizShow = { arrow: true, label: true, marker: true, markerLabel: true };
          setLabels();
          return t('why_ev');
        }
        s.quizShow = { arrow: true, label: true, marker: true, markerLabel: true };
        s.phase = 'acting';
        s.playing = true;
        setLabels();
        return t(`why_same_${q.id}`);
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── first-use pointer: on the example ───────────────────────────────────────
  let coach = null;
  if (o.coach) {
    const p = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, note],
      object: {
        label: 'coach_tap',
        // the example's middle first; higher (or lower) on it when the hand and its label would not fit there
        candidates: () => (cur() && !isPool(s.scene) ? [0, 1, 2].map((k) => toScreen(cur().actor(p, k))) : []),
        grabbable: (q) => s.phase === 'rest' && pick(q),
        // the example jiggles a little, as if to say "here" (it does not act)
        async demo(alive) {
          const sc = cur();
          for (let i = 0; i < 2 && alive() && s.phase === 'rest'; i++) {
            await tweener.animate({
              key: 'coach-wiggle',
              duration: 0.8,
              onUpdate: (k) => {
                sc.wiggle(k);
                drawScene();
              },
            }).finished;
            await new Promise((r) => setTimeout(r, 350));
          }
          sc.wiggle(0);
          drawScene();
        },
        cancel: () => {
          tweener.cancel('coach-wiggle');
          cur()?.wiggle?.(0);
          drawScene();
        },
      },
    });
  }

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
    for (const b of el.chips) {
      const on = b.dataset.ex === s.example;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
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
    if (b.dataset.ex) {
      if (s.locked) lockedNudge();
      else if (b.dataset.ex !== s.example || s.phase !== 'rest') setExample(b.dataset.ex);
    }
    if (b.dataset.sort && e.detail === 0) sort(b.dataset.sort); // the keyboard; a finger or the mouse sorted on pointerdown
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
      case 'play':
        play();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // a box takes the example as the finger goes down (a second, quick tap is not a second answer)
  let lastSortAt = 0;
  root.addEventListener('pointerdown', (e) => {
    const b = /** @type {Element} */ (e.target).closest('[data-sort]');
    if (!b || e.button !== 0 || s.mode === 'quiz') return;
    audio.unlock();
    const now = performance.now();
    if (now - lastSortAt < 350) return;
    lastSortAt = now;
    sort(/** @type {HTMLElement} */ (b).dataset.sort);
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const n = Number(k);
    if (n >= 1 && n <= EXAMPLE_IDS.length) {
      if (s.locked) lockedNudge();
      else setExample(EXAMPLE_IDS[n - 1]);
    } else if (k === 'arrowright' || k === 'arrowleft') {
      if (s.locked) lockedNudge();
      else {
        const i = EXAMPLE_IDS.indexOf(s.example) + (k === 'arrowright' ? 1 : -1);
        setExample(EXAMPLE_IDS[(i + EXAMPLE_IDS.length) % EXAMPLE_IDS.length]);
      }
    } else if ((k === ' ' || k === 'enter') && !target.closest('button')) play();
    else if (k === 'p') play();
    else if (k === 'c') sort('contact');
    else if (k === 'n') sort('noncontact');
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const id = s.example;
    const m = actionAt(id, s.time);
    return {
      example: id,
      scene: s.scene,
      phase: s.phase,
      time: roundTo(s.time, 0.01),
      speed: roundTo(m.speed, 0.01),
      acting: s.phase !== 'rest' && Boolean(m.acting),
      touching: Boolean(m.touching),
      gap: m.gap == null ? null : roundTo(m.gap, 0.001),
      kind: KIND[id],
      effect: EFFECT[id],
      waiting: atKey(), // stopped at the telling moment, waiting to be sorted
      sorted: { ...s.sorted },
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.example, snap.phase, snap.waiting, snap.sorted, snap.view, snap.mode]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  /** Jump the current example to 'rest', 'key' or 'end' (or a time in s), stopped. */
  function jump(at) {
    const id = s.example;
    s.token++;
    s.playing = false;
    s.feedback = '';
    if (at === 'rest' || at === 0) {
      s.time = 0;
      s.phase = 'rest';
      s.stopAtKey = !s.sorted[id];
    } else {
      const time = at === 'key' ? KEY[id] : at === 'end' ? DURATION[id] : Math.min(DURATION[id], Math.max(0, Number(at) || 0));
      s.time = time;
      s.phase = time >= DURATION[id] ? 'done' : 'paused';
      s.stopAtKey = !s.sorted[id] && time < KEY[id];
    }
    setLabels();
    drawScene();
    refreshPanel();
    emitChange();
  }

  // ── start ───────────────────────────────────────────────────────────────────
  controls.enableRotate = s.view === '3d';
  root.classList.toggle('cnf-compact', stage.height < 300 || stage.width < 360);
  if (o.sorted) for (const id of EXAMPLE_IDS) s.sorted[id] = KIND[id];
  setExample(s.example, { animate: false });
  if (o.at === 'key' || o.at === 'end') jump(o.at);
  syncUI();
  refreshPanel();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else if (s.phase === 'rest') coach?.start(1000);
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
     * Change any of: example ('crane' | 'push' | 'friction' | 'fall' | 'magnet', starts afresh at rest), sorted
     * ('all' | 'none' | { id: 'contact' | 'noncontact' }), at ('rest' | 'key' | 'end' | seconds: jump there,
     * stopped), play (true: play on), sort ('contact' | 'noncontact': put the current example in that box, as a
     * tap does), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.sorted === 'all') for (const id of EXAMPLE_IDS) s.sorted[id] = KIND[id];
      else if (p.sorted === 'none') s.sorted = {};
      else if (p.sorted && typeof p.sorted === 'object') {
        s.sorted = {};
        for (const [id, k] of Object.entries(p.sorted)) if (EXAMPLE_IDS.includes(id) && (k === 'contact' || k === 'noncontact')) s.sorted[id] = k;
      }
      if (p.example && s.mode !== 'quiz') setExample(p.example, { animate });
      if (p.view) await setView(p.view, { animate });
      if (p.at != null && s.mode !== 'quiz') jump(p.at);
      if (p.sort) sort(p.sort, { silent: true });
      if (p.play) play({ silent: true });
      setLabels();
      drawScene();
      refreshPanel();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      hideHint();
      s.sorted = {};
      if (o.sorted) for (const id of EXAMPLE_IDS) s.sorted[id] = KIND[id];
      setExample(EXAMPLE_IDS.includes(o.example) ? o.example : 'crane', { animate: false });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => cur().model, // the example's objects: no ground, arrow, marker or labels
  };
}
