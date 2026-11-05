// Why a rose looks red (book p217, the part on absorption under topic 8.2.1, figure 8.06): the student view. The book's red
// rose with green leaves, under one lamp. White light comes in as a band of the spectrum colours; every colour but the
// object's own ends at the surface (absorbed), and only red leaves the petal and only green the leaf, toward an eye. Then the
// book's surprise: with red light the leaf has nothing to give back and looks black; with green light the rose does. The
// 3D view multiplies the lamp's colour by each surface's reflectance, channel by channel, so its colours are the rule itself.
// The panel is the kit's clean sheet (one action, one result, one rule). A 5-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import { absorbed, BANDS, LAMP, leaving, looks, reflected, shuffle, toEye } from './reading.js';
import { createRose } from './rose.js';
import { createSetting, LAYOUT } from './scene.js';

export const DEFAULTS = {
  light: 'white', // 'white' | 'red' | 'green' | 'blue'
  rays: false, // the band and the arrows are drawn
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

const LEARN = ['white', 'red', 'green'];
const ALL = [...LEARN, 'blue'];
const VIEW = { az: 15, el: 9 };
const MARGINS = { top: 8, bottom: 6, side: 6 };
const SINGLE = 2.6; // a coloured light's band, in stripes
const WIDTHS = (light) => BANDS.map((b) => (light === 'white' ? 1 : b === light ? SINGLE : 0));
const CHIP = { red: '#c92a2a', green: '#237a35', blue: '#1864ab', white: '#343a40', black: '#212529' };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'coo');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: the sheet of one action, one result, one rule ────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: LEARN.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'coo-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 4, far: 900, environment: false, toneMapping: THREE.NoToneMapping });
  const { camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(56);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(100);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-24);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(46);
  const setting = createSetting({ stage, shadow: Boolean(o.shadow) });
  const rose = createRose({ layout: LAYOUT });
  stage.scene.add(rose.root);
  const rays = createRays({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const start = ALL.includes(o.light) ? o.light : 'white';
  const s = {
    light: start,
    rgb: [...LAMP[start]], // the lamp's light now, linear (it moves when the filter does)
    gel: [...LAMP[start === 'white' ? 'red' : start]],
    filter: start === 'white' ? 0 : 1,
    rays: Boolean(o.rays) || false,
    busy: false,
    seen: new Set(o.rays ? [start] : []),
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
  };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  function applyLight() {
    setting.light(s.rgb);
    setting.lamp.set(s.filter, s.rgb, s.gel);
  }
  function keepsFor(light) {
    return {
      rose: reflected('rose', light)[0] ?? null,
      leaf: reflected('leaf', light)[0] ?? null,
    };
  }
  /** Everything drawn in its final place, at once. */
  function settle(light, on) {
    const v = rays.view;
    const k = keepsFor(light);
    v.widths.set(WIDTHS(light));
    v.grow = on ? 1 : 0;
    v.absorb = on ? 1 : 0;
    v.rose.on = v.leaf.on = true;
    v.rose.keeps = k.rose;
    v.leaf.keeps = k.leaf;
    v.rose.out = on && k.rose ? 1 : 0;
    v.leaf.out = on && k.leaf ? 1 : 0;
    s.rgb = [...LAMP[light]];
    s.filter = light === 'white' ? 0 : 1;
    if (light !== 'white') s.gel = [...LAMP[light]];
    applyLight();
  }

  /** The light changes, the band comes or narrows, the absorbed colours sink in, and what is left leaves for the eye. */
  async function run(light) {
    const my = ++token;
    const alive = () => my === token;
    const v = rays.view;
    s.busy = true;
    clearLabels();
    s.light = light;
    draw();
    const tween = (key, duration, onUpdate, e = ease.inOutCubic) =>
      tweener.animate({
        key,
        duration,
        ease: e,
        onUpdate: (k) => {
          if (alive()) {
            onUpdate(k);
            stage.invalidate();
          }
        },
      }).finished;

    // what was leaving stops
    const r0 = v.rose.out;
    const l0 = v.leaf.out;
    if (r0 > 0 || l0 > 0) {
      await tween('out', 0.25, (k) => {
        v.rose.out = r0 * (1 - k);
        v.leaf.out = l0 * (1 - k);
      });
      if (!alive()) return false;
    }
    const k = keepsFor(light);
    const wantRgb = LAMP[light];
    const from = [...s.rgb];
    const w0 = Float32Array.from(v.widths);
    const w1 = WIDTHS(light);
    const f0 = s.filter;
    const f1 = light === 'white' ? 0 : 1;
    const swap = f0 > 0 && f1 > 0 && from.join() !== wantRgb.join(); // one filter out, the next one in
    const a0 = v.absorb;
    if (!swap && f1 > 0) s.gel = [...wantRgb];
    if (from.join() !== wantRgb.join()) {
      await tween('light', 0.8, (x) => {
        s.rgb = from.map((c, i) => c + (wantRgb[i] - c) * x);
        if (swap) {
          s.filter = x < 0.5 ? 1 - 2 * x : 2 * x - 1;
          if (x >= 0.5) s.gel = [...wantRgb];
        } else s.filter = f0 + (f1 - f0) * x;
        for (let i = 0; i < 6; i++) v.widths[i] = w0[i] + (w1[i] - w0[i]) * x;
        v.absorb = a0 * (1 - x);
        applyLight();
      });
      if (!alive()) return false;
    }
    v.rose.keeps = k.rose;
    v.leaf.keeps = k.leaf;
    audio.tick();
    if (v.grow < 1) {
      await tween('grow', 1.1, (x) => {
        v.grow = x;
      });
      if (!alive()) return false;
    }
    await tween(
      'absorb',
      0.55,
      (x) => {
        v.absorb = Math.max(v.absorb, x);
      },
      ease.outCubic,
    );
    if (!alive()) return false;
    if (k.rose || k.leaf) {
      await tween('out', 0.95, (x) => {
        if (k.rose) v.rose.out = x;
        if (k.leaf) v.leaf.out = x;
      });
      if (!alive()) return false;
    }
    s.busy = false;
    s.rays = true;
    s.seen.add(light);
    audio.success();
    draw();
    emitChange();
    return true;
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function poseNow() {
    dirFrom(VIEW.az, VIEW.el, camDir);
    return fitPose({ box: LAYOUT.frame, dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGINS });
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
    labels();
  });

  // ── labels on the picture: few and short ───────────────────────────────────────────────────────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, note, () => action?.ringBox()] });
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
  const rayBoxes = () => rays.boxes();
  const lineAvoid = [rayBoxes];
  const toggle = ui.$('.pvc-panel-toggle');
  const IN_SPOTS = [
    { dx: 14, dy: 70 },
    { dx: -6, dy: 78 },
    { dx: 60, dy: 62 },
  ];
  const ABS_ROSE = [
    { dx: 0, dy: -54 },
    { dx: 0, dy: -44 },
    { dx: -10, dy: -46 },
    { dx: -26, dy: -40 },
    { dx: -40, dy: -46 },
    { dx: -58, dy: 50 },
    { dx: -82, dy: 34 },
  ];
  const ABS_LEAF = [
    { dx: -44, dy: 34 },
    { dx: -66, dy: 52 },
    { dx: 8, dy: 56 },
  ];
  const OUT_ROSE = [
    { dx: -6, dy: -28 },
    { dx: -6, dy: -40 },
    { dx: -36, dy: -34 },
    { dx: -36, dy: -46 },
    { dx: -66, dy: -32 },
    { dx: 26, dy: 26 },
  ];
  const OUT_LEAF = [
    { dx: 26, dy: 10 },
    { dx: 26, dy: 34 },
    { dx: 26, dy: -16 },
  ];
  const BLACK_ROSE = [
    { dx: 22, dy: -30 },
    { dx: 44, dy: -18 },
    { dx: 60, dy: 8 },
  ];
  const BLACK_LEAF = [
    { dx: 40, dy: -48 },
    { dx: 70, dy: -40 },
    { dx: 0, dy: 50 },
  ];
  const tmp = new THREE.Vector3();
  const inAt = new THREE.Vector3();
  const roseRim = new THREE.Vector3().copy(LAYOUT.bloomCentre).add(new THREE.Vector3(-3.4, 3.3, 1.6));
  const roseTop = new THREE.Vector3().copy(LAYOUT.bloomCentre).add(new THREE.Vector3(2, 5.2, 0));
  function labels() {
    const v = rays.view;
    const q = s.quiz;
    const on = !s.busy && camK >= 1 && (s.rays || q?.drawn);
    const after = on && !q?.waiting;
    const L = s.light;
    inAt.lerpVectors(LAYOUT.lamp, LAYOUT.aim, 0.1);
    const rNone = keepRose() === null;
    const lNone = keepLeaf() === null;
    tmp.lerpVectors(LAYOUT.bloomCentre, LAYOUT.eye, 0.7);
    label('or', after && v.rose.out >= 1, t('l_out_red'), tmp, CHIP.red, OUT_ROSE, true, lineAvoid);
    tmp.lerpVectors(LAYOUT.leafHit, LAYOUT.eye, 0.42);
    label('ol', after && v.leaf.out >= 1, t('l_out_green'), tmp, CHIP.green, OUT_LEAF, true, [rayBoxes, toggle]);
    label('ar', after && v.rose.on && v.absorb >= 1, t('l_absorb'), roseRim, CHIP.white, ABS_ROSE, true, lineAvoid);
    label('al', after && v.leaf.on && v.absorb >= 1, t('l_absorb'), LAYOUT.leafHit, CHIP.white, ABS_LEAF, true, lineAvoid);
    label('br', after && rNone, t('l_black'), roseTop, CHIP.black, BLACK_ROSE, true, lineAvoid);
    label('bl', after && lNone, t('l_black'), LAYOUT.leafHit, CHIP.black, BLACK_LEAF, true, lineAvoid);
    // last, so that the words of the idea get their places first
    label('in', on && v.grow >= 1 && v.absorb >= 1, t(`l_${L}`), inAt, CHIP[L], IN_SPOTS, true, lineAvoid);
  }
  const keepRose = () => rays.view.rose.keeps;
  const keepLeaf = () => rays.view.leaf.keeps;

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function phase() {
    if (s.busy) return 'busy';
    if (!s.rays) return 'start';
    if (!s.seen.has('red')) return 'red';
    if (!s.seen.has('green')) return 'green';
    return s.light === 'white' ? 'again' : 'white';
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    const ph = phase();
    if (ph === 'busy') return;
    if (ph === 'start') return run(s.light);
    if (ph === 'again') return replay();
    return run(ph);
  }
  function replay() {
    settle(s.light, false);
    s.rays = false;
    return run(s.light);
  }
  function pick(light) {
    if (s.locked) return lockedNudge();
    if (!LEARN.includes(light)) return;
    if (light === s.light && s.rays && !s.busy) return;
    audio.unlock();
    run(light);
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  const colourWord = (c) => t(`c_${c}`);
  function outcome() {
    const a = looks('rose', s.light);
    const b = looks('leaf', s.light);
    return t('out_looks', { a: colourWord(a), b: colourWord(b), ca: `coo-c-${a}`, cb: `coo-c-${b}` });
  }
  function rule() {
    if (!s.rays && (s.busy ? s.seen.size === 0 : true)) return t('rule_start');
    return t(`rule_${s.light}`);
  }
  const ACTIONS = {
    busy: ['act_wait', ''],
    start: ['act_show', 1],
    red: ['act_red', 2],
    green: ['act_green', 3],
    white: ['act_white', ''],
    again: ['act_again', ''],
  };
  function panel() {
    if (s.quiz) return;
    sheet.outcome(outcome());
    sheet.rule(rule());
    sheet.choose(s.light);
    const ph = phase();
    sheet.next(ph === 'red' || ph === 'green' ? ph : null);
    const [word, step] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled });
    }
  }
  function draw() {
    panel();
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_show',
    target: () => (s.locked || s.busy || camK < 1 ? null : LAYOUT.lamp),
    radius: 36,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // a tap on the lamp is the same action
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, at: performance.now() };
  });
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.at < 600;
    down = null;
    if (moved > 8 || !quick) return;
    const r = ui.canvasHost.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(setting.lamp.hit, false).length) act();
  });

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  let order = [];
  let predictPair = 'leaf';
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  /** The scene of a question: this light, the drawing as far as the question allows. */
  function quizScene(q, light, { drawn = false, rose = true, leaf = true } = {}) {
    ++token;
    for (const k of ['out', 'light', 'grow', 'absorb']) tweener.cancel(k);
    s.busy = false;
    s.rays = false;
    s.light = light;
    settle(light, false);
    const v = rays.view;
    v.grow = drawn ? 1 : 0;
    v.rose.on = rose;
    v.leaf.on = leaf;
    s.quiz = { ...q, drawn, waiting: true };
    clearLabels();
    stage.invalidate();
  }
  /** After the answer: the picture finishes the sentence. */
  function showAnswer(q) {
    if (!s.quiz) return;
    s.quiz.waiting = false;
    run(q.after === 'same' ? s.light : q.after);
  }
  const Q = {
    leaf() {
      quizScene({ kind: 'leaf' }, 'white', { drawn: true, rose: false });
      const wrong = ['all', 'red', 'none'];
      return {
        text: t('q_leaf'),
        answer: 'green',
        wrong,
        label: (k) => t(`c_leaf_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_leaf_${k}`)])),
        reveal: t('a_leaf'),
        after: 'same',
      };
    },
    count() {
      quizScene({ kind: 'count' }, 'white', { drawn: true, leaf: false });
      const n = BANDS.length - reflected('rose', 'white').length;
      const wrong = [6, 1, 0];
      return {
        text: t('q_rose_count'),
        answer: n,
        wrong,
        label: (k) => (k === 0 ? t('c_none') : t('c_n', { n: k })),
        notes: notesOf([
          [6, t('n_count_all')],
          [1, t('n_count_one')],
          [0, t('n_count_zero')],
        ]),
        reveal: t('a_count', { n: absorbed('rose', 'white').length }),
        after: 'same',
      };
    },
    predict() {
      quizScene({ kind: 'predict' }, 'white');
      const obj = predictPair;
      const light = obj === 'leaf' ? 'red' : 'green';
      const own = obj === 'leaf' ? 'green' : 'red';
      const wrong = [light, own, 'white'];
      return {
        text: t(`q_predict_${obj}`),
        answer: 'black',
        wrong,
        label: (k) => t(`c_${k}`),
        notes: notesOf([
          [light, t(`n_predict_${obj}_light`)],
          [own, t(`n_predict_${obj}_own`)],
          ['white', t('n_predict_white')],
        ]),
        reveal: t(`a_predict_${obj}`),
        after: light,
      };
    },
    which() {
      // the opposite pair to the prediction: this scene must not answer it
      const light = predictPair === 'leaf' ? 'green' : 'red';
      quizScene({ kind: 'which' }, light, { drawn: true });
      const answer = light === 'green' ? 'leaf' : 'rose';
      const other = light === 'green' ? 'rose' : 'leaf';
      const wrong = [other, 'both', 'neither'];
      return {
        text: t('q_which', { c: t(`c_${light}`) }),
        answer,
        wrong,
        label: (k) => t(`c_from_${k}`),
        notes: notesOf([
          [other, t(`n_which_${other}`)],
          ['both', t('n_which_both')],
          ['neither', t('n_which_neither')],
        ]),
        reveal: t(`a_which_${answer}`),
        after: 'same',
      };
    },
    blue() {
      quizScene({ kind: 'blue' }, 'white');
      const wrong = ['blue', 'same', 'half'];
      return {
        text: t('q_blue'),
        answer: 'black',
        wrong,
        label: (k) => t(`c_blue_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_blue_${k}`)])),
        reveal: t('a_blue'),
        after: 'blue',
      };
    },
  };
  const saved = { light: 'white', rays: false, seen: [] };
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
        saved.light = s.light;
        saved.rays = s.rays;
        saved.seen = [...s.seen];
        predictPair = Math.random() < 0.5 ? 'leaf' : 'rose';
        order = shuffle(Object.keys(Q));
        clearLabels();
        syncUI();
      },
      leave() {
        ++token;
        for (const k of ['out', 'light', 'grow', 'absorb']) tweener.cancel(k);
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        s.busy = false;
        s.light = saved.light;
        s.rays = saved.rays;
        s.seen = new Set(saved.seen);
        clearLabels();
        settle(s.light, s.rays);
        syncUI();
        flyCamera(0.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = Q[order[i]]();
        qCurrent = q;
        say(q.text);
        const done = await flyCamera(0.4);
        if (!alive()) return null;
        if (!done) camK = 1;
        const out = [q.answer];
        for (const w of q.wrong) if (out.length < 4 && !out.includes(w)) out.push(w);
        return { choices: shuffle(out), expected: q.answer, tolerance: 1e-6, label: q.label, meta: { kind: order[i] } };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        showAnswer(q);
        const why = !correct && picked ? q.notes.get(String(picked.value)) : '';
        // the note names what the student chose: alone it could be read as being about the right answer
        return `${q.reveal}${why ? ` <span class="coo-why">${t('n_pick', { x: q.label(picked.value) })} ${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────────────────────────────────
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
    for (const k of ['out', 'light', 'grow', 'absorb']) tweener.cancel(k);
    s.busy = false;
    s.light = 'white';
    s.rays = false;
    s.seen.clear();
    clearLabels();
    settle('white', false);
    if (s.view === '3d') setView('front');
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
    if (b.dataset.example) pick(b.dataset.example);
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
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const i = LEARN.indexOf(s.light);
      pick(LEARN[clamp((i < 0 ? 0 : i) + step, 0, LEARN.length - 1)]);
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      act();
    }
  });

  // ── state for the book ──────────────────────────────────────────────────────────────────────────────────
  const part = (object) => ({
    looks: looks(object, s.light),
    reflected: reflected(object, s.light),
    absorbed: absorbed(object, s.light),
    arrow: rays.view[object].on && rays.view[object].out >= 1,
  });
  function snapshot() {
    return {
      light: s.light,
      rays: s.rays,
      busy: s.busy,
      band: BANDS.filter((_, i) => rays.view.widths[i] > 0.05),
      rose: part('rose'),
      leaf: part('leaf'),
      toEye: toEye(s.light),
      roseLeaving: leaving('rose', s.light),
      leafLeaving: leaving('leaf', s.light),
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.light, snap.rays]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  settle(s.light, s.rays);
  syncUI();
  setView(s.view, { animate: false });
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
      const light = ALL.includes(p.light) ? p.light : s.light;
      if (p.light != null || p.rays != null) {
        if (animate && p.rays !== false) {
          await run(light);
        } else {
          ++token;
          for (const k of ['out', 'light', 'grow', 'absorb']) tweener.cancel(k);
          s.busy = false;
          s.light = light;
          if (p.rays != null) s.rays = Boolean(p.rays);
          if (s.rays) s.seen.add(light);
          clearLabels();
          settle(light, s.rays);
        }
      }
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      home();
      setView('front', { animate: false });
      camK = 1;
      draw();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** The view with its drawing on it, cover-fitted to the size asked for (background: null keeps it transparent). */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      stage.render();
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const ctx = out.getContext('2d');
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
      return out.toDataURL('image/png');
    },
    exportRoot: () => rose.root,
  };
}
