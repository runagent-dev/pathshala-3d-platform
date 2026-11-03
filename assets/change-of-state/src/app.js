// Change of State (পদার্থের অবস্থার পরিবর্তনে তাপের প্রভাব), book topic 6.4, pages 175–178.
// The book's one picture is figure ৬.০৮, the temperature of ice heated to steam: flat at the melting point and at the
// boiling point. Here it is a chart on the lab wall, and the beaker it describes stands beside it: ice, a spirit
// lamp, a thermometer. One big button runs the next part of the curve (ice warms, melts, water warms, boils, steam
// warms); a finger on the chart goes to any moment; "তাপ সরানো" runs the same curve the other way (ঘনীভবন,
// কঠিনীভবন). The scene is always a function of the position along the curve (reading.js), drawn by lab.js and
// board.js; this file is the layout, the panel, the test and the bridge.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { createLab } from './lab.js';
import { BOARD, createBoard } from './board.js';
import { BOIL, MELT, PART_ENDS, PART_SECONDS, PHASES, TMAX, nextPart, partOf, partSeconds, phaseAt, temperature, toU } from './reading.js';

export const DEFAULTS = {
  time: 0, // where the run is on the graph's time axis (0 to 8 squares)
  flow: 'heat', // 'heat' | 'cool'
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the ring on the lamp pulses at first (false: it stays still)
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' | 'transparent'
  shadow: true,
  sound: true,
};

const NBSP = ' ';
const BOARD_AT = new THREE.Vector3(18.6, 13.4, -10.1); // the chart on the wall
const FRONT = new THREE.Vector3(0.26, 0.32, 1).normalize();
const SIDE = new THREE.Vector3(0.7, 0.5, 1).normalize();
const SHOT = new THREE.Box3(new THREE.Vector3(-6.6, 0, -10.5), new THREE.Vector3(30.2, 25, 6)); // what the camera keeps in view

const shuffle = (list) => {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'cs');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: {
        label: 'flows',
        items: [
          { id: 'heat', label: 'chip_heat' },
          { id: 'cool', label: 'chip_cool' },
        ],
      },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);

  // the readings and the three states: after the result line, before the rule
  const extra = document.createElement('div');
  extra.className = 'cs-extra';
  extra.innerHTML = `
    <dl class="cs-read">
      <div><dt>${t('r_temp')}</dt><dd data-r="temp" class="big"></dd></div>
      <div><dt>${t('r_state')}</dt><dd data-r="state"></dd></div>
    </dl>
    <div class="cs-strip" role="group">${[0, 1, 2, 3, 4].map((i) => `<span class="${i % 2 ? 'pr' : 'st'}" data-i="${i}"></span>`).join('')}</div>`;
  ui.learn.querySelector('.pvc-rule').before(extra);
  const $r = (k) => extra.querySelector(`[data-r="${k}"]`);
  const strip = [...extra.querySelectorAll('.cs-strip > span')];

  // ── 3D ────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 10, far: 1500, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  scene.background = new THREE.Color(0x86a8bf);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(35);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(86);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-60);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(60);
  const M = createMaterials(stage.renderer);
  const lab = createLab({ materials: M });
  const board = createBoard();
  board.root.position.copy(BOARD_AT);
  lab.root.add(board.root);
  scene.add(lab.root);
  const tweener = createTweener();
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xfff3e0, 1.1);
    sun.position.set(48, 78, 70);
    sun.target.position.set(4, 8, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 22, bottom: -16, near: 40, far: 200 });
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);
  } else {
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a99a8, 0.5));
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state ─────────────────────────────────────────────────────────────────
  const s = {
    tau: 0, // time on the graph, in squares (0–8)
    flow: o.flow === 'cool' ? 'cool' : 'heat',
    mode: 'explore',
    run: null, // { to, rate, resolve } a part being played
    scrub: false,
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quizNames: true, // process names on the chart (hidden while a question asks for them)
  };
  const u = () => toU(s.tau, s.flow);
  const phase = () => phaseAt(u());
  const temp = () => temperature(s.tau, s.flow);
  const tempText = (T) => {
    const r = Math.round(T);
    return `${r < 0 ? '−' : ''}${N(Math.abs(r))}${NBSP}°C`;
  };
  const tempLatin = (T) => `${Math.round(T) < 0 ? '−' : ''}${Math.abs(Math.round(T))}${NBSP}°C`; // digits mapped by t() in a string
  const snapshot = () => ({
    time: s.tau,
    flow: s.flow,
    temperature: Math.round(temp() * 10) / 10,
    phase: phase(),
    step: nextPart(s.tau),
    mode: s.mode,
    playing: Boolean(s.run),
  });

  // ── labels on the 3D view ─────────────────────────────────────────────────────
  const boardBox = () => {
    const out = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        const p = new THREE.Vector3(BOARD_AT.x + (sx * BOARD.w) / 2, BOARD_AT.y + (sy * BOARD.h) / 2, BOARD_AT.z).project(camera);
        const x = (p.x * 0.5 + 0.5) * stage.width;
        const y = (-p.y * 0.5 + 0.5) * stage.height;
        out.left = Math.min(out.left, x);
        out.right = Math.max(out.right, x);
        out.top = Math.min(out.top, y);
        out.bottom = Math.max(out.bottom, y);
      }
    return out;
  };
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox(), boardBox] });
  anno.add('temp', {
    kind: 'temp',
    text: '',
    point: () => lab.anchors.thermoTop,
    dx: 0,
    dy: 0,
    spots: [
      { dx: 34, dy: -14 },
      { dx: -34, dy: -14 },
      { dx: 0, dy: -30 },
    ],
  });
  // the others come and go: what is in the beaker, and the note that heat is leaving
  const LABELS = {
    sub: {
      kind: 'name',
      point: () => lab.anchors.beakerLeft,
      dx: 0,
      dy: 0,
      spots: [
        { dx: -34, dy: 0 },
        { dx: 34, dy: 0 },
      ],
      optional: true,
    },
    removing: {
      kind: 'cold',
      point: () => lab.anchors.lamp,
      dx: 0,
      dy: 0,
      spots: [
        { dx: 52, dy: 8 },
        { dx: -52, dy: 8 },
        { dx: 0, dy: 40 },
      ],
      optional: false,
    },
  };
  function label(id, text) {
    if (!text) anno.remove(id);
    else if (anno.has(id)) anno.setText(id, text);
    else anno.add(id, { ...LABELS[id], text });
  }

  // ── what the student sees now: scene, chart, labels, panel ────────────────────
  let shown = '';
  function apply() {
    const uu = u();
    lab.update(uu, s.flow, s.flow === 'heat' && s.tau > 0);
    board.setTau(s.tau);
    const ph = phaseAt(uu);
    const T = temp();
    const text = tempText(T);
    anno.setText('temp', text);
    label('sub', s.mode === 'quiz' ? '' : t(`lab_${ph}`));
    label('removing', s.flow === 'cool' ? t('lab_removing') : '');
    const k = partOf(s.tau);
    const key = `${s.flow}|${ph}|${k}|${s.mode}|${Math.round(T)}`;
    if (key !== shown) {
      shown = key;
      panel(ph, T, k);
      stage.invalidate();
      emit('change', snapshot());
    }
    stage.invalidate();
  }
  function panel(ph, T, k) {
    const cool = s.flow === 'cool';
    sheet.choose(s.flow);
    sheet.outcome(t(k < 0 ? `out_${s.flow}_intro` : `out_${s.flow}_${ph}`));
    sheet.rule(t(k < 0 ? `rule_${s.flow}_intro` : `rule_${s.flow}_${ph}`));
    $r('state').textContent = t(`st_${ph}`);
    $r('temp').textContent = tempText(T);
    // the three states and the two processes between them, in the order of this run; the one going on is lit
    const words = cool
      ? ['state_gas', 'proc_condense', 'state_liquid', 'proc_freeze', 'state_solid']
      : ['state_solid', 'proc_melt', 'state_liquid', 'proc_boil', 'state_gas'];
    const at = cool ? 4 - PHASES.indexOf(ph) : PHASES.indexOf(ph);
    strip.forEach((el, i) => {
      el.textContent = t(words[i]);
      el.classList.toggle('on', i === at && k >= 0);
    });
    syncAction();
  }

  // ── running the curve ─────────────────────────────────────────────────────────
  /** Plays the curve to time `to` over `seconds`; resolves true at the end, false if something took over. */
  function runTo(to, seconds) {
    cancelRun();
    return new Promise((resolve) => {
      const from = s.tau;
      if (Math.abs(to - from) < 1e-6) return resolve(true);
      s.run = { to, rate: (to - from) / Math.max(seconds, 0.05), resolve };
      syncAction();
      stage.invalidate();
    });
  }
  function cancelRun() {
    const r = s.run;
    s.run = null;
    if (r) r.resolve(false);
  }
  function setTau(tau, { silent = false } = {}) {
    s.tau = Math.min(TMAX, Math.max(0, tau));
    if (!silent) apply();
  }
  stage.addTicker((dt) => {
    tweener.tick(dt);
    const moving = Boolean(s.run) || s.scrub;
    if (s.run) {
      const r = s.run;
      const next = s.tau + r.rate * dt;
      const done = r.rate > 0 ? next >= r.to : next <= r.to;
      setTau(done ? r.to : next);
      if (done) {
        s.run = null;
        syncAction();
        r.resolve(true);
      }
    }
    if (moving || tweener.busy) lab.tick(dt);
    return moving || tweener.busy;
  });

  // ── camera ────────────────────────────────────────────────────────────────────
  function viewPose(view) {
    return fitPose({
      box: SHOT,
      dir: view === '3d' ? SIDE : FRONT,
      camera,
      width: stage.width,
      height: stage.height,
      margin: { top: 46, bottom: 10, side: 10 },
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
    stage.invalidate(); // the tween moves on the stage's ticks
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
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
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(viewPose(s.view), 0));

  // ── touches: a finger on the chart goes to that time; a tap on the lamp (or the beaker) is the action ─────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function cast(p, objects) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(objects, true)[0] || null;
  }
  let drag = null;
  let tap = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = canvasPoint(e);
      const onChart = cast(p, [board.face()]);
      const onLab = !onChart && cast(p, lab.pickable);
      if (onChart && !drag) {
        e.stopPropagation();
        e.preventDefault();
        if (s.locked) return lockedNudge();
        cancelRun();
        drag = { id: e.pointerId };
        s.scrub = true;
        capturePointer(ui.canvasHost, e.pointerId);
        setTau(board.tauAtUV(onChart.uv.x));
        syncAction();
        return;
      }
      if (onLab) tap = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() };
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const hit = cast(canvasPoint(e), [board.face()]);
    if (hit) setTau(board.tauAtUV(hit.uv.x));
  });
  function endTouch(e) {
    if (drag && e.pointerId === drag.id) {
      drag = null;
      s.scrub = false;
      releasePointer(ui.canvasHost, e.pointerId);
      stage.invalidate();
      syncAction();
    }
    if (tap && e.pointerId === tap.id) {
      const quick = performance.now() - tap.at < 500 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 8;
      tap = null;
      if (quick && e.type === 'pointerup') act();
    }
  }
  ui.canvasHost.addEventListener('pointerup', endTouch);
  ui.canvasHost.addEventListener('pointercancel', endTouch);

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── the action: one big button, the same numbered badge on the lamp ───────────
  function step() {
    return nextPart(s.tau);
  }
  const labelOf = () => t(step() >= 5 ? 'act_again' : s.flow === 'cool' ? 'act_cool' : 'act_heat');
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: labelOf,
    icon: ICONS.hand,
    target: () => lab.lampBox,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), boardBox],
    pad: 3,
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });
  function syncAction() {
    const k = step();
    action.set({ label: labelOf, icon: k >= 5 ? ICONS.reset : ICONS.hand, step: k >= 5 ? '' : k + 1, enabled: !s.run && !s.scrub && !s.locked });
  }
  function act() {
    if (s.locked) return lockedNudge();
    if (s.run || s.scrub) return;
    const k = step();
    if (k >= 5) return home();
    audio.tick();
    runTo(PART_ENDS[k + 1], partSeconds(k));
  }
  function home(flow = s.flow) {
    cancelRun();
    s.flow = flow === 'cool' ? 'cool' : 'heat';
    board.setFlow(s.flow);
    setTau(0);
    syncUI();
  }

  // ── the test ──────────────────────────────────────────────────────────────────
  let question = null;
  let learnSaved = null;
  /** The scene for a question: this run, this time, nothing moving. */
  function sceneFor(flow, uu) {
    cancelRun();
    s.flow = flow;
    board.setFlow(flow);
    setTau(flow === 'cool' ? TMAX - uu : uu);
    syncUI();
  }
  function choicesOf(items, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="cs-opt">${label(list[j])}</span>`,
      meta: {},
    };
  }
  const chosen = (q, picked) => q.list?.[picked?.index];
  /** A plateau scene, not the same run and part as the last one asked. */
  let lastPlateau = '';
  function plateauScene() {
    const all = [
      ['heat', 'melt'],
      ['heat', 'boil'],
      ['cool', 'condense'],
      ['cool', 'freeze'],
    ].filter(([f, p]) => `${f}${p}` !== lastPlateau);
    const [flow, proc] = pickOne(all);
    lastPlateau = `${flow}${proc}`;
    const uu = (proc === 'melt' || proc === 'freeze' ? 2 : 6) + (Math.random() - 0.5) * 0.9;
    return { flow, proc, uu };
  }
  const KINDS = ['stay', 'states', 'process', 'name', 'sweat'];
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 3, feedback: 3 },
    action,
    hooks: {
      enter() {
        learnSaved = { tau: s.tau, flow: s.flow };
        cancelRun();
        s.mode = 'quiz';
        s.locked = true;
        lastPlateau = '';
        syncUI();
        apply();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizNames = true;
        question = null;
        if (learnSaved) {
          s.flow = learnSaved.flow;
          board.setFlow(s.flow);
          setTau(learnSaved.tau);
        }
        syncUI();
        apply();
      },
      async prepare(i, alive) {
        const kind = KINDS[i % KINDS.length];
        s.locked = true;
        s.quizNames = false;
        syncUI();
        if (kind === 'stay') {
          const ice = Math.random() < 0.5;
          sceneFor('heat', ice ? 1 : 5);
          question = { kind, ice };
          const items = [
            { key: 'stay', text: 'c_stay' },
            { key: 'rise', text: 'c_rise' },
            { key: 'fall', text: 'c_fall' },
            { key: 'dip', text: 'c_dip' },
          ];
          const q = choicesOf(items, (x) => t(x.text));
          return { ...q, text: t(ice ? 'q_stay_ice' : 'q_stay_water', { T: tempLatin(ice ? MELT : BOIL) }) };
        }
        if (kind === 'states') {
          const sc = plateauScene();
          sceneFor(sc.flow, sc.uu);
          question = { kind, ...sc };
          const mix = sc.proc === 'melt' || sc.proc === 'freeze' ? 'solid_liquid' : 'liquid_gas';
          const items = [mix, mix === 'solid_liquid' ? 'liquid_gas' : 'solid_liquid', 'only_liquid', 'only_gas'].map((k) => ({ key: k }));
          const q = choicesOf(items, (x) => t(`c_${x.key}`));
          return { ...q, text: t('q_states') };
        }
        if (kind === 'process') {
          const sc = plateauScene();
          sceneFor(sc.flow, sc.uu);
          question = { kind, ...sc };
          const items = [sc.proc, ...['melt', 'boil', 'condense', 'freeze'].filter((k) => k !== sc.proc)].map((k) => ({ key: k }));
          const q = choicesOf(items, (x) => t(`proc_${x.key}`));
          return { ...q, text: t('q_process') };
        }
        if (kind === 'name') {
          const melt = Math.random() < 0.5;
          sceneFor('heat', melt ? 2 : 6);
          question = { kind, melt };
          const items = [melt ? 'meltpoint' : 'boilpoint', melt ? 'boilpoint' : 'meltpoint', 'latent_melt', 'latent_boil'].map((k) => ({ key: k }));
          const q = choicesOf(items, (x) => t(`c_${x.key}`));
          return { ...q, text: t('q_name') };
        }
        sceneFor('heat', 6);
        question = { kind };
        const items = ['sweat_right', 'sweat_cond', 'sweat_air', 'sweat_ice'].map((k) => ({ key: k }));
        const q = choicesOf(items, (x) => t(`c_${x.key}`));
        if (!alive()) return null;
        return { ...q, text: t('q_sweat') };
      },
      reveal(q, correct, picked) {
        const wrong = correct ? null : chosen(q, picked)?.key;
        const note = (key) => (wrong ? ` ${t(key)}` : '');
        s.quizNames = true;
        syncUI();
        const T = tempLatin(temp());
        if (question.kind === 'stay') {
          // let the heat go on: the temperature stays put
          runTo(question.ice ? 2.2 : 6.2, 1.6);
          return t(question.ice ? 'why_stay_ice' : 'why_stay_water') + note('mis_stay');
        }
        if (question.kind === 'states') {
          return t(`why_states_${question.proc}`, { T }) + note('mis_states');
        }
        if (question.kind === 'process') {
          return t(`why_process_${question.proc}`) + (wrong ? ` ${t(`mis_${wrong}`)}` : '');
        }
        if (question.kind === 'name') {
          const nt = wrong === 'latent_melt' || wrong === 'latent_boil' ? 'mis_name_latent' : 'mis_name_point';
          return t(question.melt ? 'why_name_melt' : 'why_name_boil', { T }) + note(nt);
        }
        return t('why_sweat') + (wrong ? ` ${t(`mis_${wrong}`)}` : '');
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── buttons, keys ─────────────────────────────────────────────────────────────
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
    board.setNames(s.mode !== 'quiz' || s.quizNames);
    board.setFuture(s.mode !== 'quiz' || s.quizNames);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && s.mode !== 'quiz') home(b.dataset.example);
    if (b.dataset.act === 'home' && s.mode !== 'quiz') home();
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
    const stepKey = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!stepKey || /** @type {Element} */ (e.target).closest?.('[role="radiogroup"]')) return;
    e.preventDefault();
    if (s.locked) return lockedNudge();
    cancelRun();
    setTau(Math.round(s.tau * 4) / 4 + stepKey * (e.shiftKey ? 1 : 0.25));
    syncAction();
  });

  // ── start ─────────────────────────────────────────────────────────────────────
  board.setFlow(s.flow);
  setTau(Number(o.time) || 0, { silent: true });
  setView(s.view, { animate: false });
  syncUI();
  apply();
  const ready = (async () => {
    try {
      await Promise.all(['400', '600', '700'].map((w) => document.fonts.load(`${w} 40px "Noto Sans Bengali"`)));
    } catch {
      /* the fallback font draws instead */
    }
    board.paint({
      num: N,
      xTitle: t('axis_time'),
      yTitle: t('axis_temp'),
      solid: t('state_solid'),
      liquid: t('state_liquid'),
      gas: t('state_gas'),
      melt: t('proc_melt'),
      boil: t('proc_boil'),
      condense: t('proc_condense'),
      freeze: t('proc_freeze'),
    });
    board.setNames(true);
    stage.invalidate();
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
    /** Change any of: time (squares 0–8), flow ('heat' | 'cool'), view; animate: true plays to the new time. */
    async set(p = {}) {
      if (p.view) await setView(p.view, { animate: p.animate !== false });
      if (p.flow && p.flow !== s.flow) home(p.flow);
      if (p.time != null) {
        const to = Math.min(TMAX, Math.max(0, Number(p.time)));
        if (p.animate === true) await runTo(to, Math.abs(to - s.tau) * PART_SECONDS);
        else {
          cancelRun();
          setTau(to);
        }
      }
      syncAction();
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      home('heat');
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => lab.set,
  };
}
