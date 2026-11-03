// Internal energy and the flow of heat (book page 162, topic 6.1.1), student view: the book's চিত্র ৬.০১ brought to life.
// A tall narrow tube and a wide vessel hold water at different heights and are joined low down by a pipe with a tap.
// One tap on the tap (or on the big button) opens it: water runs from the higher surface to the lower one, quickly at
// first and then slower, and stops when the two heights are equal (the vessel, with far more water, hardly rises; the
// tube falls). The book's analogy is one chip away: "তাপের প্রবাহ" shows the same picture as a hot pin (little heat
// energy, high temperature) touching a glass of water (much heat energy, lower temperature): the height is the
// temperature, the volume of water the heat, and heat goes from the higher temperature to the lower one until they
// are equal, however much heat each holds. Then a short test (five questions on the picture).
// The panel is the kit's clean sheet (one action, one result, one rule). Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createApparatus, LAYOUT } from './apparatus.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { FLOW_SECONDS, GEOM, SCENES, direction, levelsAt, progress, settle, warmth } from './reading.js';

export const DEFAULTS = {
  example: 'water', // 'water' (the vessels) | 'heat' (the same picture as a hot pin and a glass of water)
  p: '', // start with the tap open and the flow this far (0 to 1), for pictures
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the tap pulses at first (false: it stays still)
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' | 'transparent'
  shadow: true,
  sound: true,
};

const EXAMPLES = ['water', 'heat'];
const VIEW_DIRS = {
  front: new THREE.Vector3(0.3, 0.2, 1).normalize(), // a gentle three-quarter view; the dashed levels are drawn in 3D so they stay with their surfaces
  '3d': new THREE.Vector3(0.7, 0.4, 0.7).normalize(),
};
const FLOW_ARROW_MIN = 2.2; // cm: below this height difference the arrow is too small to read and goes
const DOUBLE_TAP = 400; // ms: a second tap this soon after one is ignored
const round1 = (x) => +x.toFixed(1);

/** A soft muted wall behind the bench: warm sand, a little deeper toward the floor. */
function backdropTexture() {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#cdbda0');
  grad.addColorStop(0.55, '#b9a888');
  grad.addColorStop(1, '#9d8c71');
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'hf');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'examples', items: EXAMPLES.map((id) => ({ id, label: `chip_${id}` })) },
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 22, near: 2, far: 600, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  scene.background = o.bg === 'transparent' ? null : backdropTexture();
  controls.minDistance = 25;
  controls.maxDistance = 220;
  controls.enablePan = false;
  const key = new THREE.DirectionalLight('#fff4e0', 1.5);
  key.position.set(-25, 55, 45);
  scene.add(key);
  const apparatus = createApparatus({ shadow: Boolean(o.shadow) && o.bg !== 'transparent' });
  scene.add(apparatus.root);
  const tweener = createTweener();
  const audio = createAudio(o.sound);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  // phase: 'rest' (tap shut), 'run' (the tap opens and water flows, or the picture is being put back), 'done'
  const s = {
    example: o.example === 'heat' ? 'heat' : 'water',
    sceneId: 'book',
    start: { ...SCENES.book },
    phase: 'rest',
    p: 0, // how far the flow has gone (0 to 1)
    tap: 0, // 0 shut to 1 open
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    token: 0,
  };
  const levels = () => levelsAt(s.start.left, s.start.right, s.p);
  const snapshot = () => {
    const lv = levels();
    return {
      example: s.example,
      scene: s.sceneId,
      phase: s.phase,
      progress: +s.p.toFixed(3),
      tap: +s.tap.toFixed(2),
      left: round1(lv.left),
      right: round1(lv.right),
      start: { ...s.start },
      end: round1(settle(s.start.left, s.start.right)),
      direction: direction(s.start.left, s.start.right),
      flowing: s.phase === 'run' && s.p > 0 && s.p < 1,
      mode: s.mode,
      locked: s.locked,
    };
  };

  // ── labels on the 3D view (short; the sentences are in the panel) ───────────
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => action?.ringBox(), () => action?.box()],
  });
  const pL = new THREE.Vector3();
  const pR = new THREE.Vector3();
  const pPin = new THREE.Vector3(0, GEOM.tubeH - 0.6, 0);
  const pGlass = new THREE.Vector3(LAYOUT.vx + GEOM.vesselR * 0.55, GEOM.vesselH, 0);
  const pFlow = new THREE.Vector3(LAYOUT.tapX, 0, 0);
  const LABELS = {
    L: {
      point: () => apparatus.surfacePoint('left', pL),
      spots: [
        { dx: 74, dy: -4 },
        { dx: 74, dy: -26 },
        { dx: -70, dy: -4 },
      ],
      color: '#1d3550',
    },
    R: {
      point: () => apparatus.surfacePoint('right', pR),
      spots: [
        { dx: 0, dy: -26 },
        { dx: 0, dy: -46 },
        { dx: 70, dy: -20 },
        { dx: -70, dy: -20 },
      ],
      color: '#1d3550',
    },
    pin: {
      point: () => pPin,
      spots: [
        { dx: 72, dy: 0 },
        { dx: 72, dy: -22 },
      ],
      color: '#8a3a12',
    },
    glass: {
      point: () => pGlass,
      spots: [
        { dx: 52, dy: -28 },
        { dx: -20, dy: -44 },
        { dx: 0, dy: -28 },
      ],
      color: '#12507a',
    },
    flow: {
      point: () => pFlow,
      spots: [
        { dx: 0, dy: -34 },
        { dx: 0, dy: 34 },
      ],
      color: '#8a4b00',
    },
  };
  function syncLabels(lv, arrowShown) {
    const heat = s.example === 'heat';
    const seen = s.mode !== 'quiz' || quiz.revealed; // in the test the levels' labels wait for the answer
    const want = {};
    if (heat) {
      want.pin = t('l_pin');
      want.glass = t('l_glass');
    }
    if (seen) {
      if (!heat) {
        want.L = t('l_height', { v: round1(lv.left) });
        want.R = t('l_height', { v: round1(lv.right) });
      } else if (Math.abs(lv.left - lv.right) < 0.5) {
        want.L = t('l_same');
      } else {
        want.L = t(lv.left > lv.right ? 'l_hot' : 'l_cold');
        want.R = t(lv.left > lv.right ? 'l_cold' : 'l_hot');
      }
    }
    if (arrowShown) want.flow = t(heat ? 'l_flow_heat' : 'l_flow_water');
    for (const id of Object.keys(LABELS)) {
      if (id in want) {
        if (anno.has(id)) anno.setText(id, want[id]);
        else anno.add(id, { text: want[id], kind: 'part', optional: id === 'flow' || id === 'R', ...LABELS[id] });
      } else if (anno.has(id)) anno.remove(id);
    }
  }

  // ── the panel: one action, one result, one rule ────────────────────────────
  function writeSheet(lv) {
    const w = s.example === 'water';
    if (s.phase === 'rest') {
      sheet.outcome(w ? t('out_w_levels', { l: Math.round(lv.left), r: Math.round(lv.right) }) : t('out_h_rest'));
      sheet.rule(t(w ? 'rule_w_rest' : 'rule_h_rest'));
    } else if (s.phase === 'run' && s.p === 0) {
      // the tap is turning (or the water is back)
      sheet.outcome(w ? t('out_w_levels', { l: Math.round(lv.left), r: Math.round(lv.right) }) : t('out_h_rest'));
      sheet.rule(t(w ? 'rule_w_rest' : 'rule_h_rest'));
    } else if (s.phase === 'run') {
      sheet.outcome(w ? t('out_w_levels', { l: Math.round(lv.left), r: Math.round(lv.right) }) : t('out_h_run'));
      sheet.rule(t(w ? 'rule_w_run' : 'rule_h_run'));
    } else {
      sheet.outcome(w ? t('out_w_done', { h: round1(lv.left) }) : t('out_h_done'));
      sheet.rule(t(w ? 'rule_w_done' : 'rule_h_done'));
    }
    sheet.choose(s.example);
  }

  let lastKey = '';
  function refresh() {
    const lv = levels();
    apparatus.setLevels(lv.left, lv.right);
    if (s.example === 'heat') apparatus.setWarmth(warmth(lv.left), warmth(lv.right));
    else apparatus.setWarmth(null, null);
    apparatus.setTap(s.tap);
    // the arrow sits between the two surfaces, pointing from the higher to the lower, while water runs
    const diff = lv.left - lv.right;
    const flowing = s.phase === 'run' && s.p > 0 && s.p < 1 && Math.abs(diff) >= FLOW_ARROW_MIN;
    apparatus.setArrow(flowing ? Math.sign(diff) : 0, (lv.left + lv.right) / 2, Math.min(1, Math.abs(diff) / 7));
    pFlow.y = (lv.left + lv.right) / 2 + 0.6;
    if (s.mode !== 'quiz') writeSheet(lv);
    syncLabels(lv, flowing);
    if (!action) return stage.invalidate();
    const rest = s.phase === 'rest';
    action.set({
      step: rest ? 1 : '',
      label: rest
        ? s.example === 'water'
          ? 'act_open'
          : 'act_contact'
        : s.phase === 'done'
          ? 'act_again'
          : s.example === 'water'
            ? 'act_open'
            : 'act_contact',
      icon: s.phase === 'done' ? ICONS.reset : ICONS.hand,
      enabled: s.phase !== 'run' && !s.locked,
    });
    const k = `${s.example}|${s.phase}|${round1(lv.left)}|${round1(lv.right)}`;
    if (k !== lastKey) {
      lastKey = k;
      emit('change', snapshot());
    }
    stage.invalidate();
  }

  // ── what happens: the tap opens, the water runs, it stops; or it is put back ─
  const cancelAll = () => {
    s.token++;
    tweener.cancel('tap');
    tweener.cancel('flow');
    tweener.cancel('back');
  };
  /** Put a scene on the bench at once: surfaces at `start`, tap shut (or open, with the flow at `p`). */
  function setScene({ example = s.example, sceneId = 'book', start, p = 0 } = {}) {
    cancelAll();
    s.example = example;
    s.sceneId = sceneId;
    s.start = { ...(start || SCENES[sceneId] || SCENES.book) };
    s.p = p;
    s.tap = p > 0 ? 1 : 0;
    s.phase = p >= 1 ? 'done' : p > 0 ? 'run' : 'rest';
    refresh();
  }
  async function openTap() {
    if (s.phase !== 'rest') return false;
    const my = ++s.token;
    s.phase = 'run';
    audio.contact();
    refresh();
    emit('open', snapshot());
    const opened = await tweener.animate({
      key: 'tap',
      duration: 0.5,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.tap = k;
        refresh();
      },
    }).finished;
    if (!opened || my !== s.token) return false;
    const ran = await tweener.animate({
      key: 'flow',
      duration: FLOW_SECONDS,
      ease: ease.linear,
      onUpdate: (k) => {
        s.p = progress(k * FLOW_SECONDS);
        refresh();
      },
    }).finished;
    if (!ran || my !== s.token) return false;
    s.p = 1;
    s.phase = 'done';
    audio.pop();
    refresh();
    emit('done', snapshot());
    return true;
  }
  /** The water goes back to where it started and the tap shuts. */
  async function putBack() {
    if (s.phase !== 'done') return false;
    const my = ++s.token;
    s.phase = 'run';
    refresh();
    const from = s.p;
    const ok = await tweener.animate({
      key: 'back',
      duration: 0.7,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.p = from * (1 - k);
        s.tap = 1 - k;
        refresh();
      },
    }).finished;
    if (!ok || my !== s.token) return false;
    s.p = 0;
    s.tap = 0;
    s.phase = 'rest';
    refresh();
    return true;
  }
  let lastAct = 0;
  function act() {
    const now = performance.now();
    if (now - lastAct < DOUBLE_TAP) return;
    lastAct = now;
    audio.unlock();
    if (s.locked) return lockedNudge();
    if (s.phase === 'rest') openTap();
    else if (s.phase === 'done') putBack();
  }
  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // the bench is lit and drawn; the water drifts bubbles through the pipe while it flows
  stage.addTicker((dt) => {
    const busy = tweener.tick(dt);
    let speed = 0;
    if (s.phase === 'run' && s.p > 0 && s.p < 1) {
      const lv = levels();
      speed = Math.sign(lv.left - lv.right) * (2.2 + Math.min(1, Math.abs(lv.left - lv.right) / 14) * 7);
    }
    return apparatus.drift(dt, speed) || busy;
  });

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewPose(view) {
    return fitPose({
      box: apparatus.box,
      dir: VIEW_DIRS[view],
      camera,
      width: stage.width,
      height: stage.height,
      margin: { top: 36, bottom: 10, side: 10 },
    });
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
  // the view starts from the front; dragging turns it, and then the "front" icon appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(viewPose(s.view), 0));

  // ── a tap on the tap itself ─────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let press = null;
  const overTap = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(apparatus.pickable, false).length > 0;
  };
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!overTap(e) || press) return;
      e.stopPropagation(); // the camera controls do not turn from here: a touch on the tap is a tap
      press = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() };
    },
    true,
  );
  const endPress = (e) => {
    if (!press || e.pointerId !== press.id) return;
    const tap = e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) <= 10 && performance.now() - press.at < 600;
    press = null;
    if (tap) act();
  };
  ui.canvasHost.addEventListener('pointerup', endPress, true);
  ui.canvasHost.addEventListener('pointercancel', endPress, true);

  // ── the action: one big button, and the same numbered badge in a ring round the tap ─────────────────────
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_open',
    icon: ICONS.hand,
    target: () => apparatus.tap,
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: act,
  });

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const jitter = (v, spread) => v + Math.round((Math.random() * 2 - 1) * spread);
  /** Four tap choices from string keys (the right one first): shuffled, with the index of the right one. */
  function textChoices(keys, kind, vars) {
    const list = shuffle(keys.map((k) => ({ key: k, text: t(k, vars) })));
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.findIndex((it) => it.key === keys[0]),
      tolerance: 0.5,
      label: (j) => `<span class="hf-opt">${list[j].text}</span>`,
      meta: { kind, answer: keys[0] },
    };
  }
  let question = null;
  let picked = -1;
  const note = (map) => {
    const key = question?.list?.[picked]?.key;
    return key && map[key] ? ` ${t(map[key])}` : '';
  };
  // the five kinds, in this order: the water going to the lower surface, the book's pin and glass of water, when it
  // stops, what is equal then, what temperature measures
  const KINDS = ['dir', 'pin', 'stop', 'equal', 'def'];
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
        s.mode = 'quiz';
        s.locked = true;
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        setScene({ example: s.example, sceneId: 'book' });
        syncUI();
      },
      async prepare(i, alive) {
        const kind = KINDS[i % KINDS.length];
        picked = -1;
        s.locked = true;
        if (kind === 'dir') {
          const start = { left: jitter(SCENES.reverse.left, 1), right: jitter(SCENES.reverse.right, 1) };
          setScene({ example: 'water', sceneId: 'reverse', start });
          question = { kind, start };
          return { text: t('q_dir'), ...textChoices(['d_left', 'd_right', 'd_none', 'd_both'], kind) };
        }
        if (kind === 'pin') {
          setScene({ example: 'heat', sceneId: 'book', start: { left: jitter(SCENES.book.left, 1), right: jitter(SCENES.book.right, 1) } });
          question = { kind };
          return { text: t('q_pin'), ...textChoices(['p_pin', 'p_water', 'p_none', 'p_both'], kind) };
        }
        if (kind === 'stop') {
          setScene({ example: 'water', sceneId: 'book', start: { left: jitter(SCENES.book.left, 1), right: jitter(SCENES.book.right, 1) } });
          question = { kind };
          return { text: t('q_stop'), ...textChoices(['s_equal', 's_empty', 's_volume', 's_full'], kind) };
        }
        if (kind === 'equal') {
          setScene({ example: 'heat', sceneId: 'book', start: { ...SCENES.book }, p: 1 });
          if (!alive()) return null;
          question = { kind };
          return { text: t('q_equal'), ...textChoices(['e_temp', 'e_heat', 'e_both', 'e_none'], kind) };
        }
        setScene({ example: 'heat', sceneId: 'book' });
        question = { kind };
        return { text: t('q_def'), ...textChoices(['f_ke', 'f_count', 'f_heat', 'f_size'], kind) };
      },
      reveal(_q, _correct, pick) {
        picked = pick.index;
        const k = question.kind;
        let text = '';
        if (k === 'dir') {
          const st = question.start;
          text = t('why_dir_left', { l: st.left, r: st.right }) + note({ d_right: 'not_d_right', d_none: 'not_d_none', d_both: 'not_d_both' });
          s.locked = false; // the tap opens by itself: the answer is shown
          openTap().then(() => {
            s.locked = s.mode === 'quiz';
          });
        } else if (k === 'pin') {
          text = t('why_pin') + note({ p_water: 'not_p_water', p_none: 'not_p_none', p_both: 'not_p_both' });
          s.locked = false;
          openTap().then(() => {
            s.locked = s.mode === 'quiz';
          });
        } else if (k === 'stop') {
          text = t('why_stop') + note({ s_empty: 'not_s_empty', s_volume: 'not_s_volume', s_full: 'not_s_full' });
          s.locked = false;
          openTap().then(() => {
            s.locked = s.mode === 'quiz';
          });
        } else if (k === 'equal') {
          text = t('why_equal') + note({ e_heat: 'not_e_heat', e_both: 'not_e_both', e_none: 'not_e_none' });
        } else {
          text = t('why_def') + note({ f_count: 'not_f_count', f_heat: 'not_f_heat', f_size: 'not_f_size' });
        }
        refresh(); // the labels of the levels appear with the answer
        return text;
      },
      done() {
        s.locked = false;
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
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && s.mode !== 'quiz' && b.dataset.example !== s.example) {
      setScene({ example: b.dataset.example, sceneId: 'book' });
    }
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
    if (e.target !== root || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    act();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  const p0 = Math.min(1, Math.max(0, Number(o.p) || 0));
  setScene({ example: s.example, sceneId: 'book', p: p0 });
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
    /** Change any of: example ('water' | 'heat'), p (0 to 1: put the flow there), open (true: open the tap and let it
     *  run), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.example && EXAMPLES.includes(p.example) && s.mode !== 'quiz') setScene({ example: p.example, sceneId: 'book' });
      if (p.start && typeof p.start.left === 'number' && typeof p.start.right === 'number') {
        setScene({ example: s.example, sceneId: 'custom', start: { left: p.start.left, right: p.start.right } });
      }
      if (p.view) await setView(p.view, { animate });
      if (p.p != null) setScene({ example: s.example, sceneId: s.sceneId, start: s.start, p: Math.min(1, Math.max(0, Number(p.p))) });
      if (p.open && s.phase === 'rest') {
        const run = openTap();
        if (animate) await run;
      }
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      setScene({ example: s.example, sceneId: 'book' });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => apparatus.root,
  };
}
