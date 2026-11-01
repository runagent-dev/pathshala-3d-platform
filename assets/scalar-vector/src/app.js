// Book p38, 2.3: a single journey distinguishes scalar length from vector position; then two arrows at a time.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { COLORS, createDiagram, point3 } from './diagram.js';
import { JOURNEY, pointAt } from './journey.js';
import { VECTORS, PAIRS, compass, verdict } from './reading.js';
import { fitPose } from './camera.js';
import { createCompass } from './compass.js';

export const DEFAULTS = { stage: 0, view: 'front', mode: 'explore', coach: true, numerals: null, lang: 'bn', bg: 'light', shadow: true, sound: true };
const NAMES = ['B', 'C', 'D'];
const ACTIONS = ['act_walk', 'act_position', 'act_equal', 'act_direction', 'act_magnitude', 'act_again'];
const FRAME = new THREE.Box3(new THREE.Vector3(-29, 0, -17), new THREE.Vector3(30, 1, 16));
const shuffle = (values) => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const V = (name) => `<span class="sv-vec">${name}</span>`;
  root.classList.add('pvc', 'sv');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, { quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }], lines: { action: 1, outcome: 2, rule: 3 } }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.$('.pvc-outcome').setAttribute('aria-live', 'polite');

  const stage = createStage(ui.canvasHost, { fov: 30, near: 1, far: 1000, environment: false });
  const { camera, controls, scene } = stage;
  const compassRose = createCompass(stage, t);
  const north = compassRose.el;
  ui.stage.append(north);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minPolarAngle = 0.00001;
  controls.maxPolarAngle = 0.8;
  const diagram = createDiagram();
  scene.add(diagram.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  const emit = (type, data) => {
    for (const fn of listeners.get(type) || []) fn(data);
  };
  const s = { stage: 0, progress: 0, vector: 0, busy: false, view: o.view === '3d' ? '3d' : 'front', mode: 'explore', comparison: null };
  let token = 0;
  let lastTap = -Infinity;
  let saved = null;
  let question = null;
  let order = [];
  let quiz;
  let annotations;
  let action;

  function target() {
    if (s.stage === 2 && diagram.map.visible) return null; // The next action changes the example, rather than a part of this map.
    if (diagram.pairs.visible) {
      const pose = diagram.poses[s.comparison || 'B'][1];
      const a = THREE.MathUtils.degToRad(pose.angle);
      return point3([pose.tail[0] + (Math.cos(a) * pose.length) / 2, pose.tail[1] + (Math.sin(a) * pose.length) / 2]);
    }
    return point3(s.stage ? JOURNEY.finish : JOURNEY.start);
  }

  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    onAct: () => advance(),
    target,
    radius: 25,
    pulse: o.coach,
    avoid: [ui.corner, north, () => diagram.walkerBox(), () => annotations?.boxes() || []],
  });
  annotations = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, north, () => diagram.walkerBox(), () => action.ringBox()],
  });

  function fit() {
    const dir = s.view === '3d' ? new THREE.Vector3(0.12, 1, 0.48).normalize() : new THREE.Vector3(0, 1, 0.0001).normalize();
    const pose = fitPose({
      box: diagram.pairs.visible ? new THREE.Box3(new THREE.Vector3(-25, 0, -11), new THREE.Vector3(23, 1, 14)) : FRAME,
      dir,
      camera,
      width: stage.width,
      height: stage.height,
      margin: { top: 50, bottom: 16, side: 10 },
    });
    camera.position.copy(pose.position);
    controls.target.copy(pose.target);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld();
    diagram.fitMarker(stage);
    controls.update();
    stage.invalidate();
  }
  stage.onResize(fit);
  stage.onBeforeRender(() => diagram.fitMarker(stage));

  function labels({ testing = false, reveal = false } = {}) {
    annotations.clear();
    if (diagram.map.visible) {
      const lift = stage.width >= 720 ? -52 : stage.height >= 300 ? -35 : -30;
      for (const [id, p, key] of [
        ['start', JOURNEY.start, 'start'],
        ['finish', JOURNEY.finish, 'finish'],
      ]) {
        annotations.add(id, {
          text: t(key),
          point: () => point3(p),
          kind: 'endpoint',
          spots: [
            ...(id === 'finish'
              ? [
                  { dx: 0, dy: -28 },
                  { dx: 14, dy: -24 },
                ]
              : []),
            { dx: -12, dy: 0 },
            { dx: 0, dy: 23 },
            { dx: 12, dy: 0 },
            { dx: 0, dy: -23 },
          ],
        });
      }
      if (!testing || reveal) {
        if (s.progress === 1)
          annotations.add('scalar', {
            text: `<b>${t('scalar_label')}</b><small>${t('scalar_value', { d: 120 })}</small>`,
            point: () => point3(pointAt(0.28)),
            color: COLORS.scalar,
            kind: 'reading',
            spots: [
              { dx: 0, dy: lift },
              { dx: -12, dy: lift },
              { dx: 0, dy: 35 },
              { dx: 12, dy: -35 },
            ],
          });
        if (s.vector === 1)
          annotations.add('vector', {
            text: `<b>${t('vector_label')}</b><small>${t('vector_value', { d: JOURNEY.magnitude })}</small>`,
            point: () => point3([-18, 1]),
            color: COLORS.vector,
            kind: 'reading',
            spots: [
              { dx: 14, dy: -14 },
              { dx: 14, dy: -40 },
              { dx: 14, dy: 38 },
              { dx: -12, dy: 0 },
            ],
          });
      }
    } else {
      for (const [i, pose] of diagram.poses[s.comparison || 'B'].entries()) {
        const angle = THREE.MathUtils.degToRad(pose.angle);
        const p = [pose.tail[0] + (Math.cos(angle) * pose.length) / 2, pose.tail[1] + (Math.sin(angle) * pose.length) / 2];
        annotations.add(`arrow-${i}`, {
          text: `<b>${V(pose.name)}</b><small>${t('pair_value', { d: pose.length })}</small>`,
          point: () => point3(p),
          kind: 'arrow',
          color: i ? (s.comparison === 'B' ? COLORS.equal : COLORS.other) : COLORS.vector,
          spots: [
            { dx: (i ? 1 : -1) * 24, dy: (pose.angle < 90 ? (i ? 1 : -1) : i ? -1 : 1) * 32 },
            { dx: (i ? 1 : -1) * 34, dy: 0 },
            { dx: (i ? 1 : -1) * 44, dy: 0 },
            { dx: (i ? 1 : -1) * 30, dy: 60 },
            { dx: (i ? 1 : -1) * 30, dy: -60 },
          ],
        });
      }
    }
  }

  function syncUI() {
    root.dataset.mode = s.mode;
    root.dataset.scene = diagram.pairs.visible ? 'comparison' : 'journey';
    ui.learn.inert = s.mode !== 'explore';
    ui.quiz.inert = s.mode !== 'quiz';
    for (const button of ui.$$('[data-mode]')) {
      const on = button.dataset.mode === s.mode;
      button.classList.toggle('on', on);
      button.setAttribute('aria-selected', String(on));
    }
    for (const button of ui.$$('[data-view]')) {
      button.classList.toggle('on', button.dataset.view === s.view);
      button.disabled = s.mode === 'quiz';
    }
    const name = s.comparison || NAMES[s.stage - 3];
    const kind = s.stage < 2 ? 'scalar' : s.stage === 2 ? 'vector' : name === 'B' ? 'equal' : 'different';
    ui.$('.pvc-outcome').dataset.kind = kind;
    const outcome = s.busy && s.stage === 0 ? 'out_walking' : ['out_start', 'out_scalar', 'out_vector'][s.stage] || `out_${name}`;
    const rule = ['rule_start', 'rule_scalar', 'rule_vector'][s.stage] || `rule_${name}`;
    sheet.outcome(t(outcome, { d: s.stage === 1 ? 120 : JOURNEY.magnitude }));
    const vars = { walk: 120, position: JOURNEY.magnitude, full: 25, half: 12.5 };
    if (s.stage < 3) {
      sheet.rule(`<span class="sv-explain-intro">${t('guide_intro')}</span>
        <span class="sv-meaning scalar"><b>${t('guide_scalar_title')}</b><span>${t(s.stage === 0 ? 'guide_scalar_start' : 'guide_scalar_done', vars)}</span></span>
        <span class="sv-meaning vector"><b>${t('guide_vector_title')}</b><span>${t(s.stage < 2 ? 'guide_vector_start' : 'guide_vector_done', vars)}</span></span>`);
    } else sheet.rule(`${t(rule)}<span class="sv-book-detail">${t(`guide_${name}`, vars)}</span>`);
    action.set({ step: s.stage < 5 ? s.stage + 1 : '', label: ACTIONS[s.stage], enabled: !s.busy && s.mode === 'explore' });
    if (o.bg !== 'transparent') scene.background = new THREE.Color(diagram.pairs.visible ? '#dde5ec' : COLORS.grass);
  }

  function draw() {
    if (s.stage < 3) diagram.setMap(s.progress, s.vector);
    else diagram.setPair(s.comparison || NAMES[s.stage - 3]);
    fit();
    syncUI();
    labels();
    stage.invalidate();
  }

  function snapshot() {
    const compared = NAMES.slice(0, Math.max(0, s.stage - 2));
    const name = s.comparison || compared.at(-1);
    return {
      stage: s.stage,
      mode: s.mode,
      view: s.view,
      busy: s.busy,
      clue: s.stage === 0 ? 'none' : s.stage === 1 ? 'distance' : 'direction',
      found: s.stage >= 2,
      journey: {
        distance: +(s.progress * 120).toFixed(2),
        magnitude: JOURNEY.magnitude,
        direction: 'n',
        vectorVisible: diagram.map.visible && s.vector > 0,
      },
      compared,
      current: name ? { name, with: PAIRS[name], verdict: verdict(VECTORS[name], VECTORS[PAIRS[name]]) } : null,
      vectors: Object.fromEntries(
        Object.keys(VECTORS).map((key) => {
          const pose = diagram.pairs.visible ? diagram.poses[s.comparison || 'B'].find((item) => item.name === key) : null;
          return [key, pose ? { tail: pose.tail, length: pose.length, angle: pose.angle, direction: compass(pose.angle) } : null];
        }),
      ),
      next: {
        action: s.stage === 0 ? 'walk' : s.stage === 1 ? 'position' : s.stage === 5 ? 'again' : 'compare',
        step: s.stage < 5 ? s.stage + 1 : '',
        name: NAMES[s.stage - 2],
      },
      question: s.mode === 'quiz' ? question?.kind || null : null,
    };
  }
  const changed = () => emit('change', snapshot());
  function cancel() {
    token++;
    tweener.cancel('lesson');
    s.busy = false;
  }
  function jump(index) {
    cancel();
    s.stage = Math.max(0, Math.min(5, Math.round(Number(index) || 0)));
    s.progress = s.stage >= 1 ? 1 : 0;
    s.vector = s.stage >= 2 ? 1 : 0;
    s.comparison = NAMES[s.stage - 3] || null;
    draw();
    changed();
  }

  async function advance({ animate = true, bridge = false } = {}) {
    if (s.mode === 'quiz' || s.busy || (!bridge && performance.now() - lastTap < 450)) return;
    lastTap = performance.now();
    if (s.stage === 5) {
      jump(0);
      return;
    }
    const next = s.stage + 1;
    const my = ++token;
    if (next <= 2 && animate) {
      s.busy = true;
      syncUI();
      const run = tweener.animate({
        key: 'lesson',
        duration: next === 1 ? 3.2 : 0.65,
        ease: ease.linear,
        onUpdate(k) {
          if (my !== token) return;
          if (next === 1) s.progress = k;
          else s.vector = k;
          diagram.setMap(s.progress, s.vector);
          diagram.fitMarker(stage);
        },
      });
      const completed = await run.finished;
      if (!completed || my !== token || s.mode === 'quiz') return;
    }
    jump(next);
    audio.pop();
    emit('step', { stage: next });
    if (next >= 3) emit('compare', snapshot().current);
  }

  function setView(view) {
    if (s.mode === 'quiz') return;
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    fit();
    syncUI();
    changed();
    emit('view', { view: s.view });
  }

  function questionScene(kind) {
    cancel();
    s.progress = 1;
    s.vector = kind === 'scalar' ? 0 : 1;
    s.comparison = kind === 'equal' ? 'B' : kind === 'difference' ? (Math.random() < 0.5 ? 'C' : 'D') : null;
    if (s.comparison) diagram.setPair(s.comparison);
    else diagram.setMap(1, s.vector);
    fit();
    syncUI();
    labels({ testing: true });
    stage.invalidate();
  }

  quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    action,
    questions: 5,
    lines: { text: 2, feedback: 3 },
    hooks: {
      enter() {
        saved = { stage: s.stage, view: s.view };
        cancel();
        s.mode = 'quiz';
        s.view = 'front';
        controls.enableRotate = false;
        order = shuffle(['scalar', 'vector', 'direction', 'equal', 'difference']);
        fit();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        question = null;
        s.view = saved?.view || 'front';
        controls.enableRotate = s.view === '3d';
        jump(saved?.stage || 0);
        fit();
      },
      async prepare(i, alive) {
        if (!alive()) return null;
        if (i === 0) order = shuffle(['scalar', 'vector', 'direction', 'equal', 'difference']);
        const kind = order[i];
        questionScene(kind);
        const keys = ['scalar', 'vector'].includes(kind)
          ? ['only_magnitude', 'only_direction', 'both', 'magnitude_time']
          : kind === 'direction'
            ? ['n', 'e', 's', 'w']
            : kind === 'equal'
              ? ['equal', 'magnitude', 'direction', 'different_both']
              : ['magnitude', 'direction', 'different_both', 'place'];
        const expected = {
          scalar: 'only_magnitude',
          vector: 'both',
          direction: 'n',
          equal: 'equal',
          difference: s.comparison === 'C' ? 'direction' : 'magnitude',
        }[kind];
        const choices = shuffle(keys);
        question = { kind, keys: choices, answer: expected, comparison: s.comparison };
        changed();
        return {
          text: t(`q_${kind}`),
          choices: [0, 1, 2, 3],
          expected: choices.indexOf(expected),
          tolerance: 0.5,
          label: (index) => `<span class="sv-opt">${t(choices[index])}</span>`,
          meta: { kind },
        };
      },
      reveal(_q, correct, picked) {
        labels({ testing: true, reveal: true });
        const q = question;
        const pick = q.keys[picked.value];
        const answer = q.kind === 'difference' ? q.comparison : q.kind;
        let noteKey = 'not_equal';
        if (q.kind === 'direction') noteKey = 'not_compass';
        else if (pick === 'place') noteKey = 'not_place';
        else if (pick === 'only_magnitude') noteKey = 'not_magnitude';
        else if (pick === 'only_direction') noteKey = 'not_direction';
        else if (pick === 'both') noteKey = 'not_both';
        else if (pick === 'magnitude_time') noteKey = 'not_time';
        else if (q.kind === 'equal') noteKey = pick === 'magnitude' ? 'same_magnitude' : pick === 'direction' ? 'same_direction' : 'both_same';
        else if (q.kind === 'difference') noteKey = q.comparison === 'C' ? 'same_magnitude' : 'same_direction';
        return (
          t(`answer_${answer}`, { d: q.kind === 'scalar' ? 120 : q.kind === 'equal' ? 25 : JOURNEY.magnitude }) + (correct ? '' : ` ${t(noteKey)}`)
        );
      },
    },
  });

  const abort = new AbortController();
  const signal = abort.signal;
  root.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest('button');
      if (!button || !root.contains(button)) return;
      audio.unlock();
      if (button.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
      if (button.dataset.mode === 'explore') quiz.stop();
      if (button.dataset.view) setView(button.dataset.view);
      if (button.dataset.q != null) quiz.choose(Number(button.dataset.q));
      if (button.dataset.act === 'q-next') quiz.next();
      if (button.dataset.act === 'q-again') quiz.start();
      if (button.dataset.act === 'home' && s.mode !== 'quiz') jump(0);
      if (button.dataset.act === 'fullscreen') {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
      }
    },
    { signal },
  );
  if (!document.fullscreenEnabled) ui.$('[data-act="fullscreen"]').hidden = true;
  root.addEventListener(
    'keydown',
    (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,select,textarea')) return;
      const key = event.key;
      if (s.mode === 'quiz') return;
      if (key === 'ArrowRight' || ((key === 'Enter' || key === ' ') && !event.target.closest('button'))) advance();
      else if (key === 'ArrowLeft') jump(Math.max(0, s.stage - 1));
      else if (key === 'Home' || key.toLowerCase() === 'r') jump(0);
      else if (key.toLowerCase() === 'f') setView('front');
      else if (key.toLowerCase() === 'v') setView('3d');
      else return;
      event.preventDefault();
    },
    { signal },
  );
  let down = null;
  stage.canvas.addEventListener(
    'pointerdown',
    (event) => {
      down = [event.clientX, event.clientY];
    },
    { signal },
  );
  stage.canvas.addEventListener(
    'pointerup',
    (event) => {
      if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 8 || s.mode === 'quiz') return;
      down = null;
      const targetPoint = target();
      if (!targetPoint) return;
      const p = targetPoint.project(camera);
      const rect = stage.canvas.getBoundingClientRect();
      if (Math.hypot(event.clientX - rect.left - (p.x * 0.5 + 0.5) * stage.width, event.clientY - rect.top - (-p.y * 0.5 + 0.5) * stage.height) < 34)
        advance();
    },
    { signal },
  );

  jump(o.stage);
  fit();
  return {
    ready: o.mode === 'quiz' ? quiz.start() : Promise.resolve(),
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    async set(p = {}) {
      if (s.mode === 'quiz' && (p.stage != null || p.home || p.act || p.compare)) quiz.stop();
      if (p.view) setView(p.view);
      if (p.home) jump(0);
      if (p.stage != null) jump(p.stage);
      if (p.act) {
        if (s.busy) jump(Math.min(5, s.stage + 1));
        await advance({ animate: p.animate !== false, bridge: true });
      }
      if (NAMES.includes(p.compare)) {
        const original = s.stage;
        jump(Math.max(original, 3 + NAMES.indexOf(p.compare)));
        s.comparison = p.compare;
        diagram.setPair(p.compare);
        syncUI();
        labels();
        emit('compare', snapshot().current);
      }
      changed();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      jump(0);
      setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => diagram.root,
    dispose() {
      cancel();
      quiz.stop();
      abort.abort();
      action.dispose();
      annotations.clear();
      compassRose.dispose();
      diagram.root.traverse((mesh) => {
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          mesh.material.dispose();
        }
      });
      stage.dispose();
      root.innerHTML = '';
      listeners.clear();
    },
    _internals: { stage, diagram, compass: compassRose },
  };
}
