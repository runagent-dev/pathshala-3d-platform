// Solid as atoms and springs (book p167, চিত্র ৬.০৩): the student heats a cube of atoms joined by springs and sees
// the atoms shake more and more widely; the special spring lets them go further out than in, so the average
// distance, and with it the whole solid, grows a little. Built on the shared student kit (@shared/student/…): the
// clean শেখো sheet (the three temperatures, one action, one result, one rule) and a short test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { createRoom } from './scenery.js';
import { createBurner } from './burner.js';
import { EDGE, createLattice } from './lattice.js';
import { LEVELS, edgeGrowth, nextLevel } from './reading.js';

export const DEFAULTS = {
  level: 'cold', // 'cold' | 'warm' | 'hot'
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  motion: true, // false: the atoms keep one still pose (a poster, a slow phone)
  coach: true, // the numbered ring on the burner pulses at first (false: it stays still)
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' | 'transparent'
  sound: true,
};

const CENTRE = new THREE.Vector3(0, 6.4, 0); // the cube's middle (cm above the bench)
const VIEW_DIRS = {
  front: new THREE.Vector3(0.5, 0.36, 1).normalize(), // a corner towards us, a little from above, as the book draws it
  '3d': new THREE.Vector3(0.9, 0.5, 0.7).normalize(),
};
const TAU = Object.fromEntries(LEVELS.map((l) => [l.id, l.tau]));
// each question's scene: what the student looks at while answering
const QUIZ_SCENES = ['warm', 'cold', 'hot', 'hot'];
const QUIZ_SIZE = QUIZ_SCENES.length;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple'; // the student layout of student.css
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: {
        label: 'examples',
        items: LEVELS.map((l) => ({ id: l.id, label: `chip_${l.id}` })),
      },
      lines: { action: 1, outcome: 1, rule: 4 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 1, far: 400, environment: 'studio-light', environmentIntensity: 0.9 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 12;
  controls.maxDistance = 90;
  controls.enablePan = false;
  const model = new THREE.Group();
  model.name = 'SolidSpringModel';
  scene.add(model);
  const room = createRoom();
  if (o.bg !== 'transparent') {
    scene.add(room.root);
    scene.background = room.background;
  }
  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x9a7650, 1.0));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(12, 30, 20);
  scene.add(sun);

  const lattice = createLattice({ centre: CENTRE });
  const burner = createBurner({ height: 2.3, flame: 1.9 });
  burner.root.userData.noExport = true; // the burner is the book's heat, not the model
  model.add(lattice.root, burner.root);

  const tweener = createTweener();
  const audio = createAudio(o.sound);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = { level: 'cold', tau: 0, time: 0, view: o.view === '3d' ? '3d' : 'front', mode: 'explore', locked: false, userMovedCamera: false };
  const snapshot = () => ({ level: s.level, tau: s.tau, growth: edgeGrowth(s.tau), locked: s.locked, mode: s.mode });

  // ── the picture: atoms, springs and the flame at heat s.tau ─────────────────
  const clock = () => (o.motion ? s.time : 0.8); // without motion every frame is the same pose
  stage.addTicker((dt) => {
    const moving = tweener.tick(dt);
    s.time += dt;
    if (s.tau > 0.001 && (o.motion || moving)) {
      lattice.update(s.tau, clock());
      burner.set(s.tau, clock());
      return true; // shaking (or heating): keep drawing
    }
    return moving;
  });
  function draw() {
    lattice.update(s.tau, clock());
    burner.set(s.tau, clock());
    stage.invalidate();
  }

  // ── labels: short names of the parts, the old size ──────────────────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
  const pAtom = new THREE.Vector3();
  const pSpring = new THREE.Vector3();
  const pOld = new THREE.Vector3();
  const h = EDGE / 2;
  anno.add('atom', {
    text: t('lbl_atom'),
    point: () => pAtom.copy(lattice.atoms[5].position).add(CENTRE),
    spots: [
      { dx: 58, dy: 22 },
      { dx: -58, dy: 22 },
      { dx: 58, dy: 60 },
    ],
    kind: 'part',
    color: '#1f6fb8',
  });
  anno.add('spring', {
    text: t('lbl_spring'),
    point: () => pSpring.copy(lattice.atoms[6].position).add(lattice.atoms[7].position).multiplyScalar(0.5).add(CENTRE),
    spots: [
      { dx: -62, dy: -36 },
      { dx: 62, dy: -36 },
      { dx: -62, dy: -70 },
    ],
    kind: 'part',
    color: '#4f5f70',
  });
  let oldShown = false;
  function syncOldLabel() {
    const on = TAU[s.level] > 0.001;
    if (on === oldShown) return;
    oldShown = on;
    if (!on) return anno.remove('old');
    anno.add('old', {
      text: t('lbl_before'),
      point: () => pOld.set(-h, -h, h).add(CENTRE),
      spots: [
        { dx: -64, dy: 34 },
        { dx: -64, dy: 66 },
      ],
      kind: 'part',
      color: '#8a5a00',
      optional: true,
    });
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const BOX = new THREE.Box3(new THREE.Vector3(-3.1, 2.6, -3.1), new THREE.Vector3(3.1, 9.2, 3.1));
  const viewPose = (view) =>
    fitPose({ box: BOX, dir: VIEW_DIRS[view], camera, width: stage.width, height: stage.height, margin: { top: 56, bottom: 14, side: 14 } });
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
  // the view starts from the front; dragging turns it, and then the "front" button appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(viewPose(s.view), 0));

  // ── the temperature ─────────────────────────────────────────────────────────
  const TEXT = {
    cold: { out: 'out_cold', rule: 'rule_cold' },
    warm: { out: 'out_warm', rule: 'rule_warm' },
    hot: { out: 'out_hot', rule: 'rule_hot' },
  };
  /** Heat the lattice to a level (chips, the action, keys, the bridge). */
  function setLevel(id, { animate = true } = {}) {
    if (!(id in TAU)) return Promise.resolve(false);
    const changed = id !== s.level;
    s.level = id;
    syncUI();
    if (changed) emit('change', snapshot());
    const to = TAU[id];
    const from = s.tau;
    syncOldLabel();
    if (!animate || from === to) {
      tweener.cancel('tau');
      s.tau = to;
      draw();
      syncOldLabel();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: 'tau',
        duration: 1.1,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          s.tau = from + (to - from) * k;
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (done) {
          s.tau = to;
          draw();
        }
        return done;
      });
  }
  /** One step of the guided sequence: heat, heat more, then cool again. */
  function step() {
    if (s.locked) return lockedNudge();
    audio.unlock();
    setLevel(nextLevel(s.level) ?? 'cold');
  }

  // ── the action: one big button, and the same numbered badge on the burner ───
  const flameAt = new THREE.Vector3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_heat1',
    icon: ICONS.hand,
    target: () => {
      burner.flamePoint(flameAt);
      return flameAt.add(burner.root.position);
    },
    radius: 30,
    avoid: [ui.corner, ui.hint],
    pulse: Boolean(o.coach),
    onAct: step,
  });
  // a tap on the burner or its flame does the same
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let tap = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const r = stage.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / stage.width) * 2 - 1, -((e.clientY - r.top) / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.intersectObject(burner.hit).length) return;
      e.stopPropagation(); // not the camera
      tap = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() };
    },
    true,
  );
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!tap || e.pointerId !== tap.id) return;
    const quick = performance.now() - tap.at < 600 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 10;
    tap = null;
    if (quick) step();
  });
  ui.canvasHost.addEventListener('pointercancel', () => (tap = null));

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
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
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: QUIZ_SIZE,
    lines: { text: 3, feedback: 3 },
    action, // its ring and badge hide during the test
    hooks: {
      enter() {
        s.mode = 'quiz';
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        setLevel('cold', { animate: false });
        syncUI();
      },
      async prepare(i, alive, say) {
        const n = i + 1;
        say(t(`q${n}_text`));
        s.locked = false;
        await setLevel(QUIZ_SCENES[i], { animate: false });
        if (!alive()) return null;
        s.locked = true;
        return {
          choices: shuffle([0, 1, 2, 3]), // 0 is the right answer: its words are q<n>_c0
          expected: 0,
          tolerance: 0.5,
          label: (v) => t(`q${n}_c${v}`),
          meta: { question: n },
        };
      },
      reveal(q, correct, picked) {
        const n = q.meta.question;
        const lead = `<b>${t('q_sure')} ${t(`q${n}_c0`)}</b>`;
        return correct ? lead : `${lead} ${t(`q${n}_n${picked.value}`)}`;
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── the panel, buttons, keys ────────────────────────────────────────────────
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
    sheet.choose(s.level);
    sheet.next(nextLevel(s.level));
    sheet.outcome(t(TEXT[s.level].out));
    sheet.rule(t(TEXT[s.level].rule));
    const hotAlready = nextLevel(s.level) == null;
    action.set({
      label: hotAlready ? 'act_cool' : s.level === 'cold' ? 'act_heat1' : 'act_heat2',
      step: hotAlready ? '' : s.level === 'cold' ? 1 : 2,
    });
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) return lockedNudge();
      setLevel(b.dataset.example);
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
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!dir || e.target.closest?.('.pvc-examples')) return; // the chips use the arrows themselves
    e.preventDefault();
    if (s.locked) return lockedNudge();
    const i = LEVELS.findIndex((l) => l.id === s.level);
    setLevel(LEVELS[Math.min(LEVELS.length - 1, Math.max(0, i + dir))].id);
  });

  // ── start ───────────────────────────────────────────────────────────────────
  setLevel(LEVELS.some((l) => l.id === o.level) ? o.level : 'cold', { animate: false });
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
    /** Change any of: level ('cold' | 'warm' | 'hot'), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.level != null) await setLevel(p.level, { animate });
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      await Promise.all([setView('front'), setLevel('cold')]);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => lattice.root,
  };
}
