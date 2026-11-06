// What happens when light meets another medium (book p214, topic 8.2, figure 8.02): the student view. One block of clear
// glass on a bench, one narrow ray from a small torch. Three taps, the camera going close each time: part of the light
// comes back into the air (প্রতিফলন), part goes into the glass and bends (প্রতিসরণ) and part ends at the surface between the
// two media (শোষণ). Then all three at once, because they always happen together. The rays are traced (reading.js) and drawn
// as crisp vector lines over the view (rays.js). The panel is the kit's clean sheet: one action, one result, one rule.
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
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import { BLOCK, clampAngle, EVENTS, paths, shuffle, START_ANGLE } from './reading.js';
import { createSetting, FRAMES } from './scene.js';

const RESULT_HOLD = 1000; // ms a finished step's result stays up: a tap on the action before that is ignored
export const DEFAULTS = {
  show: 'none', // 'none' | 'reflection' | 'refraction' | 'absorption' | 'all'
  angle: START_ANGLE, // degrees from the vertical
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

const DIM = 0.42; // how strongly a part that has been seen shows while another one is looked at
const ANGLE_TEST = 65; // the torch's other angle, in the test
const MARGINS = { top: 12, bottom: 10, side: 8 };
const INK = { light: '#8a4f00', term: '#8a4f00', warm: '#c2410c', medium: '#2b3a4a' };
const RAYS = ['incident', ...EVENTS];
const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'lab');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: the sheet of one action, one result, one rule ────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: EVENTS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'replay', label: 'act_replay', icon: ICONS.play },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      tight: true,
      lines: { action: 1, outcome: 1, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const caption = document.createElement('p');
  caption.className = 'lab-cap';
  caption.innerHTML = t('cap_book');
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'lab-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 4, far: 900, environmentIntensity: 0.7 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  const setting = createSetting({ stage, shadow: Boolean(o.shadow) });
  const rays = createRays({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  let restUntil = 0; // no action before this (performance.now): the last step's result is being looked at
  const s = {
    seen: new Set(), // which of the three the student has seen
    focus: null, // what is being looked at: one of EVENTS, 'all', or null at the start
    last: null, // the last focus that was finished: what the test comes back to if a step was cut short
    angle: clampAngle(o.angle),
    busy: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    frame: 'start', // what the camera shows (FRAMES)
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
  const hitPoint = new THREE.Vector3();
  function setAngle(angle) {
    s.angle = clampAngle(angle);
    rays.view.geo = paths(s.angle);
    setting.place(s.angle);
    hitPoint.set(rays.view.geo.hit.x, rays.view.geo.hit.y, 0);
  }
  /** The marks in the 3D scene follow the drawing. */
  function applyMarks() {
    const v = rays.view;
    setting.ember(v.absorption.k);
    setting.landing(v.refraction.k >= 1 ? v.refraction.alpha : 0);
    setting.surface(s.focus === 'absorption' ? v.absorption.k : 0);
  }
  const alphaFor = (name) => (s.focus === 'all' || s.focus === name ? 1 : DIM);
  /** Everything drawn in its final place, at once. */
  function settle() {
    const v = rays.view;
    for (const n of EVENTS) {
      v[n].k = s.seen.has(n) ? 1 : 0;
      v[n].alpha = alphaFor(n);
      v[n].shine = 0;
    }
    s.frame = s.focus || 'start';
    applyMarks();
  }

  const RUNS = ['dim', 'grow', 'shine', 'camera'];
  function stopRun() {
    ++token;
    for (const k of RUNS) tweener.cancel(k);
    s.busy = false;
  }

  /**
   * One step of the story, told by the camera: it goes to the place first, what was there dims, and only then the new part
   * comes out of the point where the light arrives, cause before effect. quick: no flight (the test).
   */
  async function run(name, { quick = false } = {}) {
    stopRun();
    const my = token;
    const alive = () => my === token;
    const v = rays.view;
    s.busy = true;
    s.focus = name;
    clearLabels();
    draw();
    const tween = (key, duration, onUpdate, e = ease.inOutSine) =>
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

    const names = name === 'all' ? EVENTS : [name];
    // a part left half way by an earlier tap goes back, and an earlier glow dies with the dimming
    for (const n of EVENTS) if (!s.seen.has(n) && !names.includes(n)) v[n].k = 0;
    const flying = quick ? true : fly(name, 1.5);
    const from = EVENTS.map((n) => v[n].alpha);
    const lit = EVENTS.map((n) => v[n].shine);
    const dimming = tween('dim', 0.4, (k) => {
      EVENTS.forEach((n, i) => {
        v[n].alpha = from[i] + (alphaFor(n) - from[i]) * k;
        v[n].shine = lit[i] * (1 - k);
      });
      applyMarks();
    });
    await Promise.all([flying, dimming]);
    if (!alive()) return false;

    const todo = names.filter((n) => v[n].k < 1);
    for (const n of names) v[n].shine = 1;
    if (todo.length) {
      await tween(
        'grow',
        quick ? 0.7 : 1.1,
        (k) => {
          for (const n of todo) v[n].k = k;
          applyMarks();
        },
        ease.inOutCubic,
      );
      if (!alive()) return false;
    }
    for (const n of names) s.seen.add(n);
    if (!s.quiz) s.last = name;
    s.busy = false;
    restUntil = performance.now() + RESULT_HOLD;
    audio.tick();
    if (name === 'all') audio.success();
    draw();
    emitChange();
    tween('shine', 1, (k) => {
      for (const n of names) v[n].shine = 1 - k;
    });
    return true;
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function poseNow() {
    const f = FRAMES[s.frame];
    dirFrom(f.az, f.el, camDir);
    return fitPose({ box: f.box, dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGINS });
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
  /** The camera goes to a frame. Its promise settles when it arrives (or a finger takes over). */
  function fly(frame, duration = 1.5) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      rotate.home();
      s.view = 'front';
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    s.frame = frame;
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
    rotate.home();
    syncUI();
    if (animate) fly(s.frame, 1.5);
    else camK = 1;
    stage.invalidate();
  }
  /** The student has really turned the view. */
  function turnedByHand() {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  }
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${t.num(360)}°`,
    label: t('rotate_me'),
    pulse: Boolean(o.coach),
    at: 'bottom-right',
    onTurn: turnedByHand,
  });

  // ── how to use, in the panel: the same icons as on the view, with a few words (kit createHowTo) ──────────
  createHowTo(ui, t, [{ kind: 'orbit', cue: rotate }, { kind: 'front' }], { stage });
  // the stage also calls this when it lowers its resolution mid-turn: a view the student has turned stays theirs
  stage.onResize(() => {
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
  });

  // ── labels on the picture: few and short, each pinned to what it names ───────────────────────────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, rotate.el, note, ui.$('.pvc-panel-toggle'), () => rays.boxes()] });
  const shown = new Map();
  const pts = new Map();
  /** A label pinned to a world point. `spots` are the places it may take, best first; key labels have no `optional`. */
  function label(id, on, text, point, color, spots) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).copy(point);
    const was = shown.get(id);
    if (!was) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part' });
      shown.set(id, { text });
      return;
    }
    if (was.text !== text) {
      anno.setText(id, text);
      was.text = text;
    }
  }
  function clearLabels() {
    for (const id of [...shown.keys()]) anno.remove(id);
    shown.clear();
  }
  const a = new THREE.Vector3();
  const along = (p, q, f) => a.set(p.x + (q.x - p.x) * f, p.y + (q.y - p.y) * f, 0);
  const airAt = (rise) => a.set(hitPoint.x, hitPoint.y + rise, 0);
  const glassAt = new THREE.Vector3(-2.6, BLOCK.height * 0.3, BLOCK.halfDepth);
  const surfaceAt = new THREE.Vector3(-1.2, BLOCK.height, 1.4);
  const SPOTS = {
    light: [
      { dx: -14, dy: 20 },
      { dx: 16, dy: -22 },
      { dx: -14, dy: 34 },
    ],
    reflection: [
      { dx: 16, dy: 18 },
      { dx: -16, dy: -20 },
      { dx: 12, dy: 34 },
      { dx: -24, dy: -34 },
    ],
    refraction: [
      { dx: 16, dy: 6 },
      { dx: -16, dy: 6 },
      { dx: 18, dy: -14 },
      { dx: -18, dy: -14 },
    ],
    absorption: [
      { dx: 26, dy: -24 },
      { dx: 34, dy: 16 },
      { dx: 40, dy: -8 },
      { dx: 18, dy: -38 },
      { dx: 26, dy: 34 },
      { dx: 64, dy: 8 },
      { dx: 70, dy: -8 },
      { dx: 60, dy: 28 },
      { dx: 46, dy: 44 },
    ],
    surface: [
      { dx: -30, dy: -34 },
      { dx: -40, dy: 26 },
    ],
    air: [
      { dx: 0, dy: 0 },
      { dx: 0, dy: -30 },
    ],
    glass: [
      { dx: 0, dy: 0 },
      { dx: 0, dy: 24 },
      { dx: -30, dy: 12 },
    ],
  };
  function labels() {
    const q = s.quiz;
    const g = rays.view.geo;
    const f = s.focus;
    const calm = !s.busy && camK >= 1;
    const at = {
      incident: along(g.lens, g.hit, 0.42).clone(),
      reflection: along(g.hit, g.reflected, 0.5).clone(),
      refraction: along(g.hit, g.refracted, 0.62).clone(),
      absorption: along(g.hit, g.stub, 0.4).clone(),
    };
    const media = calm && (q ? q.media : true);
    label(
      'air',
      media && (f === null || f === 'all' || f === 'reflection'),
      q?.empty ? t('l_empty') : t('l_air'),
      airAt(f === 'reflection' ? 6.6 : 9.4),
      INK.medium,
      SPOTS.air,
    );
    label('glass', media && (f === null || f === 'all' || f === 'refraction'), t('l_glass'), glassAt, INK.medium, SPOTS.glass);
    if (q?.tags && !q.named) {
      for (const n of RAYS) label(`r-${n}`, calm, q.tags[n], at[n], INK.medium, SPOTS[n === 'incident' ? 'light' : n]);
      for (const n of RAYS) label(n, false);
    } else {
      const named = q ? q.named && calm : calm;
      const whole = f === 'all';
      for (const n of RAYS) label(`r-${n}`, false);
      label('incident', named && f !== 'refraction' && f !== 'absorption', t('l_light'), at.incident, INK.light, SPOTS.light);
      // the one with the least room takes its place first
      for (const n of ['absorption', 'refraction', 'reflection']) {
        label(
          n,
          named && (whole || f === n) && rays.view[n].k >= 1,
          t(n === 'absorption' ? 'l_absorbed' : `ex_${n}`),
          at[n],
          n === 'absorption' ? INK.warm : INK.term,
          SPOTS[n],
        );
      }
    }
    label('surface', calm && !q && f === 'absorption', t('l_surface'), surfaceAt, INK.medium, SPOTS.surface);
    anno.update(); // places them now, on this frame's drawing (it asks for no new frame)
  }
  stage.onAfterRender(labels);

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function phase() {
    if (s.busy) return 'busy';
    for (const n of EVENTS) if (!s.seen.has(n)) return n;
    return s.focus === 'all' ? 'test' : 'all';
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400 || now < restUntil) return;
    lastAct = now;
    audio.unlock();
    const ph = phase();
    if (ph === 'busy') return;
    if (ph === 'test') return quiz.start();
    return run(ph);
  }
  /** The step that has just ended, slowly: what it brought goes, and comes again. */
  function replay() {
    if (s.locked) return lockedNudge();
    if (s.busy || !s.last) return;
    audio.unlock();
    const name = s.last;
    const v = rays.view;
    for (const n of name === 'all' ? EVENTS : [name]) {
      s.seen.delete(n);
      v[n].k = 0;
    }
    return run(name);
  }
  function pick(name) {
    if (s.locked) return lockedNudge();
    if (!EVENTS.includes(name)) return;
    if (name === s.focus && !s.busy) return;
    audio.unlock();
    run(name);
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  function outcome() {
    const slot = (n) => (s.seen.has(n) ? `<b>${t(`ex_${n}`)}</b>` : '<span class="lab-slot">?</span>');
    return t('out_sum', { a: slot('reflection'), b: slot('refraction'), c: slot('absorption') });
  }
  const ACTIONS = {
    busy: ['act_wait', ''],
    reflection: ['act_reflection', 1],
    refraction: ['act_refraction', 2],
    absorption: ['act_absorption', 3],
    all: ['act_all', ''],
    test: ['act_test', ''],
  };
  const replayBtn = ui.$('[data-act="replay"]');
  const homeBtn = ui.$('[data-act="home"]'); // it gives way to the test's offer, which needs the room
  function panel() {
    if (s.quiz) return;
    replayBtn.hidden = !s.last;
    replayBtn.disabled = s.busy;
    homeBtn.hidden = phase() === 'test';
    sheet.outcome(outcome());
    sheet.rule(t(`rule_${s.focus || 'start'}`));
    sheet.choose(s.focus);
    const ph = phase();
    sheet.next(EVENTS.includes(ph) ? ph : null);
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
    label: 'act_reflection',
    target: () => (s.locked || s.busy || camK < 1 || !EVENTS.includes(phase()) ? null : hitPoint),
    radius: 24,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // a tap on the point where the light arrives is the same action
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
    if (ray.intersectObject(setting.hit, false).length) act();
  });

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  let order = [];
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  /** The scene of a question: every part drawn, or only the light arriving. */
  function quizScene(q, { all = false, angle = START_ANGLE, media = true, frame = 'all' } = {}) {
    stopRun();
    setAngle(angle);
    s.seen = new Set(all ? EVENTS : []);
    s.focus = all ? 'all' : null;
    settle();
    s.frame = frame;
    s.quiz = { ...q, media, named: false };
    clearLabels();
    stage.invalidate();
  }
  /** A new letter on each ray: the picture must be read each time, not remembered. */
  function letters() {
    const l = shuffle(RAYS.map((n) => t(`tag_${n}`)));
    return Object.fromEntries(RAYS.map((n, i) => [n, l[i]]));
  }
  /** A question that asks which ray is which: its choices are the letters on the picture. */
  function whichRay(kind, answer, scene = { media: false }) {
    const tags = letters();
    quizScene({ kind, tags }, { all: true, ...scene });
    const wrong = RAYS.filter((n) => n !== answer);
    return {
      text: t(`q_${kind}`),
      answer,
      wrong,
      label: (k) => t('c_ray', { x: tags[k] }),
      notes: notesOf(wrong.map((n) => [n, t(`n_${kind}_${n}`)])),
      reveal: t(`a_${kind}`, { x: tags[answer] }),
    };
  }
  const Q = {
    back: () => whichRay('back', 'reflection'),
    end: () => whichRay('end', 'absorption'),
    first() {
      quizScene({ kind: 'first' }, { all: true, media: false });
      const wrong = ['glass', 'bench', 'torch'];
      return {
        text: t('q_first'),
        answer: 'air',
        wrong,
        label: (k) => t(`c_first_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_first_${k}`)])),
        reveal: t('a_first'),
        showMedia: true,
      };
    },
    enter: () => whichRay('enter', 'refraction', { angle: ANGLE_TEST, frame: 'other' }),
    vacuum() {
      quizScene({ kind: 'vacuum', empty: true });
      const wrong = ['stop', 'absorb', 'noreflect'];
      return {
        text: t('q_vacuum'),
        answer: 'same',
        wrong,
        label: (k) => t(`c_vacuum_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_vacuum_${k}`)])),
        reveal: t('a_vacuum'),
        grow: true,
      };
    },
  };
  const saved = { focus: null, seen: [], angle: START_ANGLE };
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
        stopRun(); // a step cut short by the test does not count
        s.mode = 'quiz';
        s.locked = true;
        saved.focus = s.last;
        saved.seen = [...s.seen];
        saved.angle = s.angle;
        // in this order no scene gives away a later answer
        order = ['back', 'end', 'first', 'enter', 'vacuum'];
        clearLabels();
        syncUI();
      },
      leave() {
        stopRun();
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        s.focus = saved.focus;
        s.seen = new Set(saved.seen);
        setAngle(saved.angle);
        clearLabels();
        const frame = s.focus || 'start';
        settle();
        s.frame = 'all';
        syncUI();
        fly(frame, 0.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = Q[order[i]]();
        qCurrent = q;
        say(q.text);
        const done = await fly(s.frame, 0.4);
        if (!alive()) return null;
        if (!done) camK = 1;
        // the kit scores numbers: the choices are places in this list, never its words
        const list = shuffle([q.answer, ...q.wrong]);
        q.list = list;
        s.quiz.right = list.indexOf(q.answer);
        return {
          choices: [0, 1, 2, 3],
          expected: list.indexOf(q.answer),
          tolerance: 0.5,
          label: (i) => q.label(list[i]),
          meta: { kind: order[i], answer: q.answer },
        };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        if (s.quiz) {
          s.quiz.named = true;
          if (q.showMedia) s.quiz.media = true;
          if (q.grow) run('all', { quick: true });
        }
        stage.invalidate();
        const chosen = picked ? q.list[picked.value] : null;
        const why = !correct && picked ? q.notes.get(String(chosen)) : '';
        // the note names what the student chose: alone it could be read as being about the right answer
        return `${q.reveal}${why ? ` <span class="lab-why">${t('n_pick', { x: q.label(chosen) })} ${why}</span>` : ''}`;
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
    stopRun();
    s.focus = null;
    s.last = null;
    s.seen.clear();
    clearLabels();
    setAngle(START_ANGLE);
    const from = s.frame;
    settle();
    s.frame = from;
    fly('start', 1.5);
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
    const act_ = b.dataset.act;
    if (act_ === 'q-next') quiz.next();
    if (act_ === 'q-again') quiz.start();
    if (act_ === 'home') home();
    if (act_ === 'replay') replay();
    if (act_ === 'fullscreen') {
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
      const i = EVENTS.indexOf(s.focus);
      const n = EVENTS.length;
      pick(EVENTS[i < 0 ? (step > 0 ? 0 : n - 1) : (i + step + n) % n]);
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      act();
    }
  });

  // ── state for the book ──────────────────────────────────────────────────────────────────────────────────
  function snapshot() {
    const v = rays.view;
    const g = v.geo;
    return {
      show: s.focus ?? 'none',
      seen: EVENTS.filter((n) => s.seen.has(n)),
      drawn: EVENTS.filter((n) => v[n].k >= 1),
      busy: s.busy,
      angle: g.angle,
      refractedAngle: g.refracted_angle,
      frame: s.frame,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
      question: s.quiz ? { kind: s.quiz.kind, right: s.quiz.right ?? null } : null, // the place of the right choice
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.show, snap.seen, snap.angle]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }
  /** At once: what the book or a test asks to see. */
  function jump(show) {
    stopRun();
    if (show === 'none') {
      s.focus = null;
      s.seen.clear();
    } else {
      s.focus = show;
      for (const n of show === 'all' ? EVENTS : [show]) s.seen.add(n);
    }
    s.last = s.focus;
    clearLabels();
    settle();
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  setAngle(s.angle);
  if (o.show === 'all' || EVENTS.includes(o.show)) jump(o.show);
  else settle();
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
      if (p.angle != null) {
        setAngle(p.angle);
        stage.invalidate();
      }
      const valid = p.show === 'none' || p.show === 'all' || EVENTS.includes(p.show);
      if (valid) {
        if (animate && p.show !== 'none')
          run(p.show); // the story takes its time: the answer does not wait for it
        else jump(p.show);
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
    exportRoot: () => setting.apparatus,
  };
}
