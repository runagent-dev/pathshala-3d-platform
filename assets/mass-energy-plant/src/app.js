// Relation between mass and energy: the power plant (ভর ও শক্তির সম্পর্ক: শক্তিকেন্দ্র), book p119, topic 4.6: the
// student view. A nuclear power plant at dusk, cut open: the core glows, steam turns the turbine, the generator lights
// a town. The student picks the fuel's mass (1 g … 1 kg) and whether it is split (0.079% of the mass becomes energy)
// or, as the book's E = mc² says, turned fully into energy; the panel gives E in J and how long it would light a
// 100 W bulb. The panel is the kit's clean sheet (one action, one result, one rule). A 3-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { buildPlant, duskSky, HAZE, SUN } from './plant.js';
import { C, fissionFraction, fuel, indianParts, MASSES_G, round, sci, shuffle, sigRound, BULB_W } from './reading.js';

export const DEFAULTS = {
  m: 1, // g of uranium-235 in the power-plant scene
  part: 'fission', // 'fission' | 'full'
  run: false, // the power plant running (for pictures)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the reactor pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' (the scenery) | 'transparent'
  shadow: true,
  sound: true,
};

const COLORS = { energy: '#a85700', plant: '#3b4250' };
const VIEW_DIRS = { front: new THREE.Vector3(0.36, 0.42, 1).normalize(), '3d': new THREE.Vector3(0.95, 0.85, 0.75).normalize() };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const bn = t.lang === 'bn';

  // ── formula pieces (the font has no ² or ⁻: powers are <sup>) ───────────────────────────────────────────────
  const sup = (x) => `<sup>${N(x)}</sup>`;
  const F = {
    two: 2,
    emc: `<i>E</i> = <i>mc</i>${sup(2)}`,
    c2: `<i>c</i>${sup(2)}`,
  };
  /** A number as m × 10ⁿ (n ≠ 0), with the minus sign U+2212: "২.৭৮ × ১০⁻¹¹". */
  function sciH(x, sig = 3) {
    const { m, e } = sci(x, sig);
    if (e === 0) return N(m);
    const pow = `${N(10)}<sup>${e < 0 ? '−' : ''}${N(Math.abs(e))}</sup>`;
    return `<span class="me-nb">${m === '1' ? pow : `${N(m)}&nbsp;×&nbsp;${pow}`}</span>`;
  }
  const cH = sciH(C);
  const ccH = sciH(C * C);
  /** Years the bulb glows, said the way people say big numbers. */
  function yearsText(y) {
    const n = sigRound(y, 2);
    if (!bn) return t('years', { n: n >= 1e6 ? `${+(n / 1e6).toPrecision(2)} million` : n.toLocaleString('en-US') });
    if (n < 1000) return t('years', { n });
    const p = indianParts(n);
    const parts = [];
    if (p.crore) parts.push(t('w_crore', { n: p.crore }));
    if (p.lakh) parts.push(t('w_lakh', { n: p.lakh }));
    if (p.thousand) parts.push(t('w_thousand', { n: p.thousand }));
    if (p.rest) parts.push(N(p.rest));
    return t('years', { n: parts.join(' ') });
  }
  const gText = (g) => (g >= 1000 ? `${N(g / 1000)} ${t('u_kg')}` : `${N(g)} ${t('u_g')}`);
  const pct = () => round(fissionFraction() * 100, 3);

  root.classList.add('pvc', 'me');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel: the fuel, one action, one result, one rule ──
  const fuelHtml = `<div class="me-fuel" role="group" aria-label="${t('calc')}">
      <div class="me-step" role="group" aria-label="${t('calc_m')}">
        <span class="me-name"><i>m</i></span>
        <button type="button" class="me-btn" data-act="m-" aria-label="${t('m_down')}">${ICONS.minus}</button>
        <b class="me-val" data-v="m" aria-live="polite"></b>
        <button type="button" class="me-btn" data-act="m+" aria-label="${t('m_up')}">${ICONS.plus}</button>
      </div>
      <div class="me-seg" role="radiogroup" aria-label="${t('part')}">
        <button type="button" role="radio" data-part="fission" aria-label="${t('part_fission', { p: pct() })}">${N(pct())}%</button>
        <button type="button" role="radio" data-part="full" aria-label="${t('part_full')}">${N(100)}%</button>
      </div>
    </div>`;
  const sheetHtml = cleanSheet(t, {
    quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
    lines: { action: 1, outcome: 2, rule: 3 },
  }).replace('<p class="pvc-outcome"', `<div class="me-calc">${fuelHtml}</div><p class="pvc-outcome"`);
  const ui = buildStudentShell(root, t, { layout: 'side', learn: sheetHtml, learnAlign: 'start' });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const el = {
    m: $('[data-v="m"]'),
    mMinus: $('[data-act="m-"]'),
    mPlus: $('[data-act="m+"]'),
  };
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 32, near: 0.5, far: 2000, environment: 'studio-light' });
  const { camera, controls, scene, renderer } = stage;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  const transparent = o.bg === 'transparent';
  const haze = transparent ? null : new THREE.FogExp2(HAZE, 0.0024); // the plant's dusk haze (made once)
  const hemi = new THREE.HemisphereLight('#ffffff', '#9fd2ea', 1.1);
  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  const rim = new THREE.DirectionalLight('#8fe0ff', 1.4);
  scene.add(hemi, key, key.target, rim);

  // ── the power plant: built a piece at a time at the start (its pictures are painted pixel by pixel), then its sky,
  // then the light the sky gives ──────────────────────────────────────────────────────────────────────────────
  /** @type {ReturnType<typeof import('./plant.js').createPlant> | null} */
  let plant = null;
  let sky = null; // the dusk sky: the plant scene's background and the light its materials reflect
  let envDusk = null;
  let steps = null;
  let built = null;
  /** One piece of the plant's building (then its sky, then the light the sky gives); true when it is all done. */
  function plantStep() {
    if (plant) return true;
    if (!built) {
      steps ??= buildPlant();
      const r = steps.next();
      if (r.done) built = r.value;
      return false;
    }
    if (!sky && !transparent) {
      sky = duskSky();
      return false;
    }
    if (sky) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      envDusk = pmrem.fromEquirectangular(sky).texture;
      pmrem.dispose();
    }
    plant = built;
    scene.add(plant.root);
    plant.set(s.power, 0);
    return true;
  }
  function ensurePlant() {
    while (!plantStep());
    return plant;
  }
  if (o.shadow && !transparent) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // (PCFSoft is deprecated: it falls back to this, with a warning)
    // fitted round what is seen of the plant (the yard, the tower, the pylons and the near town), seen from the sun
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 2;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
  }
  /** The sun's shadow box: the corners of the lit area, seen from the sun, fitted tightly (once: the sun stays put). */
  let shadowFitted = false;
  function fitShadow() {
    if (shadowFitted) return;
    shadowFitted = true;
    const cam = key.shadow.camera;
    key.updateMatrixWorld();
    key.target.updateMatrixWorld();
    cam.position.copy(key.position);
    cam.lookAt(key.target.position);
    cam.updateMatrixWorld();
    const inv = cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    const b = new THREE.Box3();
    const p = new THREE.Vector3();
    for (const x of [-40, 56]) for (const y of [0, 32]) for (const z of [-100, 22]) b.expandByPoint(p.set(x, y, z).applyMatrix4(inv));
    Object.assign(cam, { left: b.min.x, right: b.max.x, bottom: b.min.y, top: b.max.y, near: Math.max(1, -b.max.z - 5), far: -b.min.z + 5 });
    cam.updateProjectionMatrix();
  }

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    played: false, // the student has switched the plant on (the action's step)
    m: MASSES_G.includes(Number(o.m)) ? Number(o.m) : 1,
    part: o.part === 'full' ? 'full' : 'fission',
    on: false, // the plant switched on
    power: 0, // the plant's power now, 0 … 1
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    labels: 'learn', // 'learn' | 'quiz'
    quizScene: null, // the test's still scene
    userMovedCamera: false,
  };

  // ── what is shown: the plant's dusk sky, haze and lights ───────────────────────────────────────────────────────
  function applyScene() {
    scene.background = sky;
    scene.environment = envDusk;
    scene.environmentIntensity = 0.75;
    scene.fog = haze;
    hemi.color.set('#aab6ff');
    hemi.groundColor.set('#c4945e');
    hemi.intensity = 0.55;
    key.color.set('#ffc28a');
    key.intensity = 3.1;
    key.target.position.set(5, 0, -10);
    key.position.copy(SUN).multiplyScalar(110).add(key.target.position);
    key.castShadow = renderer.shadowMap.enabled;
    if (key.castShadow) fitShadow();
    rim.intensity = 0.35;
    rim.color.set('#8f9cff');
    rim.position.set(60, 30, -80);
  }

  // ── camera: frames the plant ─────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const MARGINS = { top: 46, bottom: 24, side: 8 };
  function poseNow() {
    return fitPose({ box: ensurePlant().box, dir: VIEW_DIRS[s.view], camera, width: stage.width, height: stage.height, margin: MARGINS });
  }
  function applyCamera() {
    if (s.userMovedCamera) return;
    const p = poseNow();
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, p.position, k);
      controls.target.lerpVectors(camFrom.target, p.target, k);
    } else {
      camera.position.copy(p.position);
      controls.target.copy(p.target);
    }
    controls.update();
  }
  function flyCamera(duration = 0.7) {
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
  // the view starts from the front; dragging turns it, and then the "front" button appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
    camK = 1;
  });
  stage.onResize(() => {
    s.userMovedCamera = false;
    draw();
  });

  // ── every frame: the camera, then the labels ─────────────────────────────────────────────────────────────────
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    labels();
  });

  // ── the running plant: its power follows the switch ─────────────────────────────────────────────────────────────
  stage.addTicker((dt) => {
    if (s.quizScene) return false;
    const target = s.on ? 1 : 0;
    if (s.power === target && !s.on) return false;
    s.power = THREE.MathUtils.clamp(s.power + (s.on ? dt / 4.5 : -dt / 2), 0, 1);
    plant?.set(s.power, dt);
    draw();
    return true;
  });
  function setPlant(on) {
    if (s.locked) return lockedNudge();
    audio.unlock();
    s.on = on;
    if (on) {
      s.played = true;
      audio.success();
    } else audio.tick();
    draw();
    emitChange();
  }

  // ── labels on the picture (each only while what it says is true) ──────────────────────────────────────────────
  let action = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, () => action?.ringBox()],
  });
  const shown = new Map();
  const pts = new Map();
  function label(id, on, text, point, color, spots, optional = false) {
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
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', optional });
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
  const SIDE = [
    { dx: 46, dy: -30 },
    { dx: -46, dy: -30 },
    { dx: 46, dy: 30 },
    { dx: -46, dy: 30 },
  ];
  const ABOVE = [
    { dx: 0, dy: -34 },
    { dx: 0, dy: 34 },
    { dx: 50, dy: -24 },
  ];
  const tmpP = new THREE.Vector3();
  function labels() {
    const quiz = s.labels === 'quiz';
    const qk = s.quizScene?.kind;
    // the power plant
    const pl = Boolean(plant);
    const A = plant?.anchors;
    label('core', pl, t('l_core'), pl ? A.core() : tmpP, COLORS.plant, SIDE);
    label('steam', pl && !quiz, t('l_steam'), pl ? A.steam() : tmpP, COLORS.plant, ABOVE, true);
    label('turb', pl && !quiz, t('l_turbine'), pl ? A.turbine() : tmpP, COLORS.plant, ABOVE, true);
    label('gen', pl && !quiz, t('l_generator'), pl ? A.generator() : tmpP, COLORS.plant, ABOVE, true);
    label('power', pl && !quiz && s.power > 0.6, t('l_power'), pl ? A.town() : tmpP, COLORS.energy, ABOVE, true);
    label('fuel', pl && qk === 'calc', t('l_fuel', { m: s.quizScene?.m ?? 1 }), pl ? A.core() : tmpP, COLORS.energy, ABOVE);
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────────
  function outcome() {
    const fu = fuel(s.m, s.part);
    const w = t(s.part === 'full' ? 'out_plant_full' : 'out_plant', { m: gText(s.m), p: pct(), kg: sciH(fu.kg) });
    const f = t('f_E', { emc: F.emc, kg: sciH(fu.kg), c: cH, two: 2, E: sciH(fu.E) });
    return `<span class="me-w">${w}</span><span class="me-f">${f}</span>`;
  }
  function rule() {
    const fu = fuel(s.m, s.part);
    return t(s.on ? 'rule_plant_on' : 'rule_plant_off', { W: BULB_W, years: yearsText(fu.years) });
  }
  function panel() {
    if (s.labels !== 'learn') return;
    const mText = gText(s.m);
    if (el.m.textContent !== mText) el.m.textContent = mText;
    el.mMinus.disabled = s.locked || s.m === MASSES_G[0];
    el.mPlus.disabled = s.locked || s.m === MASSES_G.at(-1);
    for (const b of ui.$$('[data-part]')) {
      const on = b.dataset.part === s.part;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    }
    sheet.outcome(outcome());
    sheet.rule(rule());
    // the action
    const step = s.played ? '' : 1;
    const lab = s.on ? 'act_plant_off' : 'act_plant_on';
    const icon = s.on ? ICONS.pause : ICONS.play;
    const keyNow = `${lab}|${step}`;
    if (action && action.lastKey !== keyNow) {
      action.lastKey = keyNow;
      action.set({ label: lab, step: lab === 'act_plant_on' ? step : '', icon });
    }
  }

  function draw() {
    applyScene();
    panel();
    stage.invalidate();
  }

  // ── the action: one big button; its badge on the reactor ─────────────────────────────
  const ringPoint = new THREE.Vector3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_plant_on',
    icon: ICONS.play,
    target: () => {
      if (s.locked || camK < 1) return null;
      if (!s.on) return ringPoint.copy(ensurePlant().anchors.core());
      return null;
    },
    radius: 22,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    setPlant(!s.on);
  }

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────────
  const QUESTIONS = ['calc', 'parts', 'why'];
  let order = QUESTIONS;
  let qCurrent = null;
  const notesOf = (pairs) => new Map(pairs.map(([v, html]) => [String(v), html]));
  function choicesFrom(answer, wrong) {
    const out = [answer];
    for (const w of wrong) if (out.length < 4 && !out.some((x) => Math.abs(x - w) <= Math.abs(answer) * 1e-9)) out.push(w);
    return shuffle(out);
  }
  function quizScene(q) {
    s.quizScene = q;
    clearLabels();
    ensurePlant().set(q.power ?? 0, 0);
    applyScene();
    stage.invalidate();
  }
  function prepare(i) {
    const kind = order[i];
    if (kind === 'calc') {
      const m = shuffle([1, 2, 5])[0];
      quizScene({ kind, power: 0, m });
      const kg = m / 1000;
      const E = kg * C * C;
      const wrong = [m * C * C, kg * C, kg * 2 * C];
      const J = (x) => `${sciH(x)} ${t('u_J')}`;
      return {
        text: t('q_calc', { m, c: cH }),
        answer: E,
        wrong,
        tolerance: E * 1e-6,
        label: J,
        html: true,
        notes: notesOf([
          [wrong[0], t('n_calc_g', { m, kg: N(kg) })],
          [wrong[1], t('n_calc_c', { c2: F.c2 })],
          [wrong[2], t('n_calc_2c', { c2: F.c2, two: 2 })],
        ]),
        reveal: t('a_calc', { E: sciH(E), emc: F.emc, kg: N(kg), c: cH, two: 2 }),
      };
    }
    if (kind === 'parts') {
      // which part makes the electricity? (the plant runs, its parts named)
      quizScene({ kind, power: 1 });
      const words = [t('l_generator'), t('l_core'), t('l_steam'), t('l_turbine')];
      return {
        text: t('q_parts'),
        answer: 0,
        wrong: [1, 2, 3],
        label: (x) => words[x],
        notes: notesOf([
          [1, t('n_parts_core')],
          [2, t('n_parts_steam')],
          [3, t('n_parts_turbine')],
        ]),
        reveal: t('a_parts'),
      };
    }
    // why so much energy: the answers are words (values are their indices)
    quizScene({ kind, power: 1 });
    const words = [t('c_why_c2', { c2: F.c2 }), t('c_why_more'), t('c_why_half'), t('c_why_n')];
    return {
      text: t('q_why'),
      answer: 0,
      wrong: [1, 2, 3],
      label: (x) => words[x],
      notes: notesOf([
        [1, t('n_why_more')],
        [2, t('n_why_half', { emc: F.emc })],
        [3, t('n_why_n', { one: 1 })],
      ]),
      reveal: t('a_why', { c2: F.c2, cc: ccH, two: 2, emc: F.emc }),
    };
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 3,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.labels = 'quiz';
        s.locked = true;
        // the why question last
        order = [...shuffle(['calc', 'parts']), 'why'];
        clearLabels();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.labels = 'learn';
        s.locked = false;
        s.quizScene = null;
        clearLabels();
        plant?.set(s.power, 0);
        camFrom = null;
        camK = 1;
        syncUI();
        draw();
      },
      async prepare(i, alive, say) {
        const q = prepare(i);
        qCurrent = q;
        say(q.text.replace(/<[^>]+>/g, ''));
        const done = await flyCamera(0.5);
        if (!alive()) return null;
        if (!done) camK = 1;
        // the question may carry markup (powers): write it again as HTML
        ui.$('.pvc-q-text').innerHTML = q.text;
        return {
          choices: choicesFrom(q.answer, q.wrong),
          expected: q.answer,
          tolerance: q.tolerance ?? 1e-6,
          label: q.label,
          meta: { kind: order[i] },
        };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        const why = !correct && picked ? q.notes.get(String(picked.value)) : '';
        return `${q.reveal}${why ? ` <span class="me-why">${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ─────────────────────────────────────────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    controls.enableRotate = !s.locked;
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
  function stepM(dir) {
    if (s.locked) return lockedNudge();
    const i = MASSES_G.indexOf(s.m) + dir;
    if (i < 0 || i >= MASSES_G.length) return;
    audio.tick();
    s.m = MASSES_G[i];
    draw();
    emitChange();
  }
  function setPart(part) {
    if (s.locked) return lockedNudge();
    if (part === s.part) return;
    audio.tick();
    s.part = part === 'full' ? 'full' : 'fission';
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
    // a second tap within 120 ms on the same button is a bounce, not a second tap
    const what = b.dataset.act || b.dataset.part || '';
    const now = performance.now();
    if (what && what === lastTap.what && now - lastTap.at < 120) return;
    lastTap = { what, at: now };
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.part) setPart(b.dataset.part);
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'home') home();
    if (a === 'm-') stepM(-1);
    if (a === 'm+') stepM(1);
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (d) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      return stepM(d);
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      act();
    }
  });
  function home() {
    if (s.locked) return lockedNudge();
    s.on = false;
    s.power = 0;
    plant?.set(0, 0);
    s.m = 1;
    s.part = 'fission';
    s.userMovedCamera = false;
    clearLabels();
    draw();
    emitChange();
  }

  // ── state for the book ────────────────────────────────────────────────────────────────────────────────────────
  function snapshot() {
    const fu = fuel(s.m, s.part);
    return {
      m: s.m,
      part: s.part,
      convertedKg: +fu.kg.toPrecision(4),
      E: +fu.E.toPrecision(4),
      bulbYears: +fu.years.toPrecision(4),
      on: s.on,
      power: +s.power.toFixed(3),
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.m, snap.part, snap.on]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ─────────────────────────────────────────────────────────────────────────────────────────────────────
  ensurePlant();
  syncUI();
  setView(s.view, { animate: false });
  if (o.run) {
    s.on = true;
    s.power = 1;
    s.played = true;
  }
  plant?.set(s.power, 0);
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
      if (p.view) setView(p.view, { animate: p.animate !== false });
      if (p.m != null && MASSES_G.includes(Number(p.m))) s.m = Number(p.m);
      if (p.part) s.part = p.part === 'full' ? 'full' : 'fission';
      if (p.run != null) {
        s.on = Boolean(p.run);
        if (p.animate === false) s.power = s.on ? 1 : 0;
        if (s.on) s.played = true;
        plant?.set(s.power, 0);
      }
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.played = false;
      setView('front', { animate: false });
      home();
    },
    startPractice: () => quiz.start(),
    capture(opts = {}) {
      const before = scene.background;
      if (opts.background !== undefined) scene.background = null;
      try {
        return stage.capture(opts);
      } finally {
        scene.background = before;
        stage.invalidate();
      }
    },
    exportRoot: () => ensurePlant().root,
  };
}
