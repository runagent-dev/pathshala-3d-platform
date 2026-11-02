// বেলুন গরম পানিতে (book p175, "নিজে করো" at the end of topic 6.3.3): the student view. Two balloons of the same volume,
// one filled with water and one with air, are kept in hot water for a while. The student picks how hot (50, 70 or
// 90 °C) and taps the big button: the balloon of water stays about the same size, the balloon of air swells a lot
// ("তাপে গ্যাসের প্রসারণ তরল থেকে অনেক বেশি"). The panel gives both volumes before → after and the book's two sentences;
// the picture draws the swelling's radius about 3 times too big and says so. Three tap questions. The panel is the
// kit's clean sheet (docs/student-kit.md).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { G, createBalloons } from './balloons.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { T0, T_CHOICES, V0, clampT, readings, shuffle } from './reading.js';
import { createRoom } from './scenery.js';

export const DEFAULTS = {
  hot: 90, // °C: the hot water (50, 70 or 90)
  heated: false, // start with the balloons already kept in the hot water
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the tank pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const VIEW_DIRS = {
  front: new THREE.Vector3(0, 0.16, 1).normalize(),
  '3d': new THREE.Vector3(0.6, 0.38, 0.8).normalize(),
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'bh');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel: the hot water's temperature, one action, the readings, one rule ──
  const readHtml = `<div class="bh-read" role="group" aria-label="${t('rd')}">
      <span></span><b class="bh-h bh-a">${t('rd_air')}</b><b class="bh-h bh-w">${t('rd_water')}</b>
      <span class="bh-k">${t('rd_T')}</span><span class="bh-n bh-t" data-r="T"></span>
      <span class="bh-k">${t('rd_V')}</span><span class="bh-n bh-a" data-r="Va"></span><span class="bh-n bh-w" data-r="Vw"></span>
      <span class="bh-k">${t('rd_up')}</span><span class="bh-n bh-a bh-big" data-r="Pa"></span><span class="bh-n bh-w bh-big" data-r="Pw"></span>
      <span class="bh-note">${t('note')}</span>
    </div>`;
  const sheetHtml = cleanSheet(t, {
    examples: { label: 'examples', results: true, items: T_CHOICES.map((T) => ({ id: String(T), label: `ex_${T}` })) },
    quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
    lines: { action: 2, outcome: 0, rule: 4 },
  }).replace(/<p class="pvc-outcome"[^>]*><\/p>/, readHtml);
  const ui = buildStudentShell(root, t, { layout: 'side', learn: sheetHtml, learnAlign: 'start' });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const el = { T: $('[data-r="T"]'), Va: $('[data-r="Va"]'), Vw: $('[data-r="Vw"]'), Pa: $('[data-r="Pa"]'), Pw: $('[data-r="Pw"]') };
  const cache = new Map();
  /** Write HTML into an element only when it changed (this runs every frame while the water warms). */
  const put = (key, elem, html) => {
    if (cache.get(key) === html) return;
    cache.set(key, html);
    elem.innerHTML = html;
  };
  const arrow = `<span class="bh-arr">${ICONS.arrowR}</span>`;

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 1, far: 2000, environment: 'studio-light', environmentIntensity: 0.65 });
  const { camera, controls, scene } = stage;
  controls.minDistance = 40;
  controls.maxDistance = 400;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
  const room = createRoom();
  if (o.bg !== 'transparent') {
    scene.add(room.root);
    scene.background = room.background;
  }
  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x8a6a4a, 0.9));
  const rig = createBalloons();
  scene.add(rig.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(-26, 80, 60);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun.target.position.set(0, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 36, bottom: -14, near: 20, far: 220 });
    sun.shadow.radius = 5;
    scene.add(sun.target);
    room.top.receiveShadow = true;
  }
  scene.add(sun);

  // the starting size: a dashed ring round each balloon at its size before (shown, never exported)
  const guides = new THREE.Group();
  guides.name = 'Guides';
  guides.userData.noExport = true;
  scene.add(guides);
  const ringOf = (x) => {
    const g = new THREE.Group();
    const COUNT = 28;
    const dash = (r, color, order) => {
      const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(r * 7, r * 2, r * 2),
        new THREE.MeshBasicMaterial({ color, toneMapped: false, depthTest: false, transparent: true }),
        COUNT,
      );
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const p = new THREE.Vector3();
      const one = new THREE.Vector3(1, 1, 1);
      for (let i = 0; i < COUNT; i++) {
        const a = (i / COUNT) * Math.PI * 2;
        p.set(Math.cos(a) * G.R0, Math.sin(a) * G.R0 * 1.08, 0);
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a + Math.PI / 2);
        mesh.setMatrixAt(i, m.compose(p, q, one));
      }
      mesh.renderOrder = order;
      return mesh;
    };
    g.add(dash(0.24, '#ffffff', 20), dash(0.12, '#1d2733', 21));
    g.position.set(x, G.CY, 0);
    g.visible = false;
    guides.add(g);
    return g;
  };
  const rings = [ringOf(-G.X), ringOf(G.X)];

  // ── state ───────────────────────────────────────────────────────────────────
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  const s = {
    hot: T_CHOICES.includes(Number(o.hot)) ? Number(o.hot) : 90,
    Tw: T0, // the water's temperature as drawn (°C)
    running: false,
    heated: false, // kept in the hot water, and settled
    stage: 0, // the rule: 0 the instruction, 1 the result
    tried: new Map(), // hot → % the air balloon grew
    mode: 'explore',
    locked: false,
    hidePct: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
  };
  const snapshot = () => {
    const x = readings(s.Tw);
    return {
      hot: s.hot,
      T: x.T,
      air: { mL: x.air.mL, percent: x.air.pct },
      water: { mL: x.water.mL, percent: x.water.pct },
      heated: s.heated,
      running: s.running,
      stage: s.stage,
      locked: s.locked,
      mode: s.mode,
      view: s.view,
      results: Object.fromEntries(s.tried),
      next: { label: s.heated ? 'act_cool' : 'act_hot', step: s.heated ? 2 : 1 },
    };
  };

  // ── labels on the picture ─────────────────────────────────────────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
  const tPoint = new THREE.Vector3(G.W / 2 - 1, G.H, 0);
  const labelHtml = (which, x) => {
    const pct = which === 'air' ? x.air.pct : x.water.pct;
    const second = s.hidePct ? '?' : s.Tw > T0 + 0.5 ? t('lab_pct', { p: pct }) : `${t.num(V0)} ${t('u_mL')}`;
    return `<span class="bh-l-${which}">${t(`lab_${which}`)}</span><br><span class="bh-l-pct">${second || '&nbsp;'}</span>`;
  };
  const x0 = readings(T0);
  anno.add('A', {
    text: labelHtml('air', x0),
    point: () => rig.air.top,
    kind: 'callout',
    color: '#1d2733',
    spots: [
      { dx: 0, dy: -34 },
      { dx: -40, dy: -34 },
      { dx: 0, dy: -58 },
    ],
  });
  anno.add('W', {
    text: labelHtml('water', x0),
    point: () => rig.water.top,
    kind: 'callout',
    color: '#1d2733',
    spots: [
      { dx: 0, dy: -34 },
      { dx: 40, dy: -34 },
      { dx: 0, dy: -58 },
    ],
  });
  anno.add('T', {
    text: t('lab_T', { T: T0 }),
    point: () => tPoint,
    kind: 'callout',
    color: '#1d2733',
    spots: [
      { dx: -46, dy: -22 },
      { dx: -46, dy: -48 },
    ],
    optional: true,
  });
  const labelCache = { A: '', W: '', T: '' };

  // ── drawing the state ───────────────────────────────────────────────────────
  function show() {
    rig.set(s.Tw);
    const x = readings(s.Tw);
    const grown = s.Tw > T0 + 0.5;
    for (const r of rings) r.visible = grown;
    const a = labelHtml('air', x);
    const w = labelHtml('water', x);
    const tt = t('lab_T', { T: Math.round(s.Tw) });
    if (a !== labelCache.A) anno.setText('A', (labelCache.A = a));
    if (w !== labelCache.W) anno.setText('W', (labelCache.W = w));
    if (tt !== labelCache.T) anno.setText('T', (labelCache.T = tt));
    stage.invalidate();
  }
  let lastAction = '';
  function panel() {
    const x = readings(s.Tw);
    const grown = s.Tw > T0 + 0.5;
    put('T', el.T, `${N(T0)} ${arrow} ${N(x.T)} <small>${t('u_C')}</small>`);
    put('Va', el.Va, `${N(V0)} ${arrow} ${N(x.air.mL)} <small>${t('u_mL')}</small>`);
    put('Vw', el.Vw, `${N(V0)} ${arrow} ${N(x.water.mL)} <small>${t('u_mL')}</small>`);
    put('Pa', el.Pa, grown ? `+${N(x.air.pct)}%` : '—');
    put('Pw', el.Pw, grown ? `+${N(x.water.pct)}%` : '—');
    sheet.rule(t(s.stage >= 1 ? 'rule_1' : 'rule_0'));
    sheet.choose(String(s.hot));
    sheet.next(null);
    for (const T of T_CHOICES) sheet.result(String(T), s.tried.has(T) ? t('res_pct', { p: s.tried.get(T) }) : '');
    const heatedNow = s.heated && !s.running;
    const want = `${heatedNow}|${!s.running && !s.locked}`;
    if (want !== lastAction) {
      lastAction = want;
      action?.set({ label: heatedNow ? 'act_cool' : 'act_hot', step: heatedNow ? 2 : 1, enabled: !s.running && !s.locked });
    }
  }
  let lastChange = '';
  function refresh() {
    show();
    panel();
    const snap = JSON.stringify([s.hot, Math.round(s.Tw), s.heated, s.stage]);
    if (snap !== lastChange) {
      lastChange = snap;
      emit('change', snapshot());
    }
  }

  // ── warming and cooling: tweens guarded by a token ─────────────────────────
  let token = 0;
  function glide(Tw, duration) {
    if (!duration) {
      s.Tw = Tw;
      refresh();
      return Promise.resolve(true);
    }
    const a = s.Tw;
    return tweener.animate({
      key: 'water',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.Tw = a + (Tw - a) * k;
        refresh();
      },
    }).finished;
  }
  function stop() {
    token++;
    tweener.cancel('water');
    s.running = false;
  }
  async function keepInHotWater(T = s.hot, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    stop();
    const my = token;
    T = Math.round(clampT(T));
    if (T <= T0) return coolDown({ animate });
    s.hot = T_CHOICES.includes(T) ? T : s.hot;
    s.running = true;
    s.heated = true;
    refresh();
    if (animate) audio.tick();
    const done = await glide(T, animate ? 3.6 : 0);
    if (my !== token || !done) return false;
    s.running = false;
    s.tried.set(s.hot, readings(T).air.pct);
    s.stage = 1;
    if (animate) audio.contact();
    refresh();
    return true;
  }
  async function coolDown({ animate = true } = {}) {
    if (s.locked) return lockedNudge();
    stop();
    const my = token;
    s.heated = false;
    const done = await glide(T0, animate ? 1.4 : 0);
    if (my !== token || !done) return false;
    refresh();
    return true;
  }
  const act = () => (s.heated && !s.running ? coolDown() : s.running ? null : keepInHotWater());
  function chooseHot(T) {
    stop();
    s.hot = T;
    s.heated = false;
    return glide(T0, 0.7);
  }
  function reset() {
    stop();
    s.stage = 0;
    s.tried.clear();
    s.hidePct = false;
    s.hot = 90;
    s.heated = false;
    return glide(T0, 0.7);
  }
  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const BOX = new THREE.Box3(new THREE.Vector3(-22, -1, -10), new THREE.Vector3(22, 31, 10));
  const viewPose = (view) =>
    fitPose({ box: BOX, dir: VIEW_DIRS[view], camera, width: stage.width, height: stage.height, margin: { top: 54, bottom: 14, side: 8 } });
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
  // the view starts from the front; a drag turns it, and then the "front" icon appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(viewPose(s.view), 0));

  // ── touching the tank: the same as the big button ───────────────────────────
  const tankPoint = new THREE.Vector3(0, 0.6, G.D / 2);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function hit(e) {
    const rect = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects([rig.air.root, rig.water.root, rig.tank], true).length > 0;
  }
  let down = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    audio.unlock();
    down = { x: e.clientX, y: e.clientY, at: performance.now(), id: e.pointerId };
  });
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.at < 500;
    down = null;
    if (tap && s.mode !== 'quiz' && hit(e)) act();
  });

  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_hot',
    icon: ICONS.hand,
    target: () => tankPoint,
    radius: 30,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── the test ────────────────────────────────────────────────────────────────
  const fix = (T, { hide = false } = {}) => {
    stop();
    s.Tw = T;
    s.heated = T > T0;
    s.hidePct = hide;
    refresh();
  };
  const QUESTIONS = {
    more() {
      fix(90);
      return {
        text: t('qm_text'),
        choices: [
          { html: t('qm_ok') },
          { html: t('qm_a'), why: 'qm_a_why' },
          { html: t('qm_b'), why: 'qm_b_why' },
          { html: t('qm_c'), why: 'qm_c_why' },
        ],
        reveal: () => t('qm_r'),
      };
    },
    why() {
      fix(70);
      return {
        text: t('qw_text'),
        choices: [
          { html: t('qw_ok') },
          { html: t('qw_a'), why: 'qw_a_why' },
          { html: t('qw_b'), why: 'qw_b_why' },
          { html: t('qw_c'), why: 'qw_c_why' },
        ],
        reveal: () => t('qw_r'),
      };
    },
    percent() {
      const T = shuffle([50, 70, 90])[0];
      fix(T, { hide: true });
      const x = readings(T);
      const dT = T - T0;
      const val = (p) => ({ html: `+${N(p)}%` });
      return {
        text: t('qp_text', { T }),
        choices: [
          val(x.air.pct),
          { ...val(dT), why: 'qp_dt_why' },
          { ...val(x.water.pct), why: 'qp_w_why' },
          { ...val(x.air.pct * 2), why: 'qp_x2_why' },
        ],
        reveal: () => {
          s.hidePct = false;
          refresh();
          return t('qp_r', { p: x.air.pct, dT, T1: 303 });
        },
      };
    },
  };
  const ORDER = ['more', 'why', 'percent'];
  let currentQ = null;
  let saved = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: ORDER.length,
    lines: { text: 3, feedback: 4 },
    action,
    hooks: {
      enter() {
        stop();
        saved = { Tw: s.Tw, heated: s.heated };
        s.mode = 'quiz';
        s.locked = true;
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.hidePct = false;
        currentQ = null;
        if (saved) {
          fix(saved.Tw);
          s.heated = saved.heated;
        }
        s.userMovedCamera = false;
        flyTo(viewPose(s.view), 0.6);
        syncUI();
        refresh();
      },
      prepare(i, alive) {
        if (!alive()) return null;
        const q = QUESTIONS[ORDER[i]]();
        // the right choice is always made first: shuffle their order, keep the index
        const order = shuffle(q.choices.map((_, j) => j));
        currentQ = q;
        return {
          text: q.text,
          choices: order,
          expected: 0,
          tolerance: 0.5,
          label: (j) => `<span class="bh-opt">${q.choices[j].html}</span>`,
          meta: { question: ORDER[i], T: s.Tw },
        };
      },
      reveal(_q, correct, picked) {
        const q = currentQ;
        if (!q) return '';
        const why = !correct && q.choices[picked.value]?.why;
        return `${q.reveal()}${why ? ` <span class="bh-why">${t(why)}</span>` : ''}`;
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = $('[data-view="front"]');
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
    if (s.mode !== 'quiz') ui.hint.classList.remove('show');
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && s.mode !== 'quiz') chooseHot(Number(b.dataset.example));
    if (b.dataset.act === 'home' && s.mode !== 'quiz') reset();
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
    if (!['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    if (s.locked) return lockedNudge();
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') keepInHotWater();
    else coolDown();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  s.Tw = T0;
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const ready = (async () => {
    if (String(o.heated) === 'true' || o.heated === true || o.heated === '1') await keepInHotWater(s.hot, { animate: false });
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
    /** Change any of: hot (50, 70, 90 °C), heated (true: kept in the hot water; false: cooled), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.hot != null && T_CHOICES.includes(Number(p.hot))) {
        if (s.heated) await keepInHotWater(Number(p.hot), { animate });
        else s.hot = Number(p.hot);
      }
      if (p.heated != null) {
        if (p.heated) await keepInHotWater(s.hot, { animate });
        else await coolDown({ animate });
      }
      refresh();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await Promise.all([setView('front'), reset()]);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => rig.root,
  };
}
