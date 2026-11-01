// Stopwatch (book page 23, topic 1.6.3), student view: press চালু/থামা to start and stop the watch, read
// minutes:seconds and hundredths, and see the reading in seconds (minutes × 60 + seconds). The lamp game: time a
// lamp by hand and see that a hand-timed reading is off by much more than the least count (0.01 s). Then a short
// test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { createWatch } from './watch.js';
import { createLamp } from './lamp.js';
import { LC, MAX, fmtS, format, roundTo, split, toSeconds } from './reading.js';

export const DEFAULTS = {
  time: 0, // s on the display at the start (stopped)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const VIEW_DIRS = {
  front: new THREE.Vector3(0, 0.2, 1).normalize(),
  '3d': new THREE.Vector3(0.62, 0.42, 0.72).normalize(),
};
const LAMP_X = 106; // the lamp stands to the right of the watch
const two = (n) => String(n).padStart(2, '0');

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const S = (v) => N(fmtS(v)); // seconds with two decimals, in the language's digits

  root.classList.add('pvc', 'sw');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const term = (cls, label) => `<span class="pvc-t ${cls}"><b>0</b><small>${t(label)}</small></span>`;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="sw-acts">
            <button class="pvc-btn primary" data-act="startstop"><span></span></button>
            <button class="pvc-btn" data-act="reset">${t('act_reset')}</button>
            <button class="pvc-btn" data-act="lamp"><span></span></button>
          </div>
          <div class="pvc-learn-main">
            <div class="pvc-result"><span class="k">${t('reading')}</span><span class="v">0</span><span class="u">${t('unit_s')}</span></div>
            <div class="pvc-sum sw-sum">${term('min', 'min_long')}<i>× ${N('60')} +</i>${term('sec', 'sec_long')}<i>=</i>${term('tot', 'total_long')}</div>
          </div>
          <p class="pvc-learn-extra sw-extra"></p>
          <div class="pvc-learn-foot">
            <span class="pvc-status"><i></i><span></span></span>
          </div>`,
  });

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 5, far: 6000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  // a simple coloured setting: a soft sky-to-sand backdrop (never the white page)
  if (o.bg !== 'transparent') {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g2 = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    const grad = g2.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#c9dbe8');
    grad.addColorStop(1, '#efe3d0');
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 4, 256);
    const sky = new THREE.CanvasTexture(c);
    sky.colorSpace = THREE.SRGBColorSpace;
    scene.background = sky;
  }
  controls.minDistance = 80;
  controls.maxDistance = 1500;
  const M = createMaterials(stage.renderer);
  const world = new THREE.Group();
  world.name = 'StopwatchScene';
  scene.add(world);
  const watch = createWatch({ materials: M, t });
  world.add(watch.root);
  const lamp = createLamp(M);
  lamp.root.position.set(LAMP_X, 0, 0);
  lamp.root.visible = false;
  world.add(lamp.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.35);
    sun.position.set(60, 420, 300);
    sun.target.position.set(40, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -200, right: 200, top: 200, bottom: -200, near: 200, far: 900 });
    sun.shadow.radius = 10;
    const table = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity: 0.12 }));
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    scene.add(sun, sun.target, table);
  }
  for (const obj of [watch.root, lamp.root])
    obj.traverse((m) => {
      if (m instanceof THREE.Mesh && m.material && !m.material.transparent) m.castShadow = true;
    });

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    running: false,
    acc: 0, // seconds counted before the current run
    since: 0, // performance.now() when the current run began
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    hidden: false, // the display is covered (a test question asks for it)
    lampShown: false,
    round: null, // the lamp game: { phase: 'wait' | 'on' | 'off' | 'done', onAt, offAt, real, started, result }
    userMovedCamera: false,
  };
  const now = () => performance.now();
  const elapsed = () => Math.min(MAX, s.running ? s.acc + (now() - s.since) / 1000 : s.acc);

  function snapshot() {
    const r = format(elapsed());
    const g = s.round;
    return {
      time: r.value,
      text: r.text,
      min: r.min,
      sec: r.sec,
      running: s.running,
      lamp: s.lampShown ? { on: lamp.on, phase: g?.phase ?? null, real: g?.real ?? null, ...(g?.result || {}) } : null,
      view: s.view,
      mode: s.mode,
    };
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    value: $('.pvc-result .v'),
    min: $('.pvc-t.min b'),
    sec: $('.pvc-t.sec b'),
    tot: $('.pvc-t.tot b'),
    extra: $('.sw-extra'),
    status: $('.pvc-status span'),
    statusDot: $('.pvc-status'),
    startLabel: $('[data-act="startstop"] span'),
    lampLabel: $('[data-act="lamp"] span'),
  };

  function extraLine(r) {
    const g = s.round;
    if (g?.result?.missed) return el.extra.replaceChildren(t('lamp_missed'));
    if (g?.result) {
      const b = document.createElement('b');
      b.textContent = t('lamp_result', { real: fmtS(g.real), measured: fmtS(g.result.measured), diff: fmtS(g.result.diff) });
      return el.extra.replaceChildren(b, ` ${t('lamp_why')}`);
    }
    if (g && g.phase !== 'done') return el.extra.replaceChildren(t('hint_lamp'));
    if (!s.running && r.value > 0 && !s.hidden) {
      return el.extra.replaceChildren(t('read_line', { main: r.main, small: r.small, min: r.min, sec: fmtS(r.sec), total: fmtS(r.value) }));
    }
    el.extra.replaceChildren(t('idea'));
  }

  function refresh() {
    const r = format(elapsed());
    watch.drawDisplay({ seconds: r.value, running: s.running, hidden: s.hidden });
    el.value.textContent = s.hidden ? '?' : S(r.value);
    el.min.textContent = s.hidden ? '?' : N(r.min);
    el.sec.textContent = s.hidden ? '?' : S(r.sec);
    el.tot.textContent = s.hidden ? '?' : S(r.value);
    el.startLabel.textContent = t(s.running ? 'act_stop' : 'act_start');
    el.lampLabel.textContent = t(s.round ? 'act_lamp_again' : 'act_lamp');
    extraLine(r);
    const phase = s.round?.phase;
    const status = s.locked
      ? ['status_locked', 'locked']
      : phase === 'wait'
        ? ['status_wait', 'idle']
        : phase === 'on'
          ? ['status_lamp_on', 'locked']
          : s.running
            ? ['status_running', 'contact']
            : r.value > 0
              ? ['status_stopped', 'contact']
              : ['status_zero', 'idle'];
    el.status.textContent = t(status[0]);
    el.statusDot.dataset.tone = status[1];
    stage.invalidate();
  }

  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.time}|${snap.running}|${snap.lamp?.phase}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the watch ───────────────────────────────────────────────────────────────
  function press(name) {
    watch.pressButton(name, true);
    stage.invalidate();
    setTimeout(() => {
      watch.pressButton(name, false);
      stage.invalidate();
    }, 140);
  }

  function startStop({ silent = false, animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (animate) press('start');
    if (s.running) {
      s.acc = split(elapsed()).value;
      s.running = false;
      if (!silent) audio.lock(true);
      emit('stop', { time: s.acc });
    } else {
      if (s.acc >= MAX) return;
      s.since = now();
      s.running = true;
      if (!silent) audio.lock(false);
      if (s.round && s.round.phase !== 'done') s.round.started = true;
      coach?.objectUsed();
      coach?.objectReleased();
      emit('start', { time: s.acc });
    }
    refresh();
    emitChange();
  }

  function reset({ silent = false, animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (animate) press('reset');
    if (s.running) {
      showHint(t('hint_reset_running'), { duration: 3200 });
      audio.error();
      return;
    }
    s.acc = 0;
    if (s.round) cancelRound();
    if (!silent) audio.tick();
    emit('reset', {});
    refresh();
    emitChange();
  }

  stage.addTicker(() => {
    const game = tickLamp();
    if (!s.running) return game;
    if (elapsed() >= MAX) {
      s.acc = MAX;
      s.running = false;
      emitChange();
    }
    refresh();
    return true;
  });

  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
  }

  // ── the lamp game ───────────────────────────────────────────────────────────
  function showLamp(on, { animate = true } = {}) {
    if (s.lampShown === Boolean(on)) return;
    s.lampShown = Boolean(on);
    lamp.root.visible = s.lampShown;
    if (!s.lampShown) lamp.set(false);
    if (s.lampShown && animate) {
      tweener.animate({
        key: 'lamp-in',
        duration: 0.45,
        ease: ease.outBack,
        onUpdate: (k) => {
          lamp.root.scale.setScalar(Math.max(0.001, k));
          stage.invalidate();
        },
      });
    } else lamp.root.scale.setScalar(1);
    if (!s.userMovedCamera) flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }

  /** A new round: the watch goes to zero, and after a moment the lamp lights for a few seconds. */
  function lampRound({ delay, on } = {}) {
    if (s.locked) return lockedNudge();
    showLamp(true);
    s.running = false;
    s.acc = 0;
    const wait = delay ?? 1.2 + Math.random() * 1.6;
    const real = roundTo(on ?? 2 + Math.random() * 3, LC);
    const t0 = now();
    s.round = { phase: 'wait', onAt: t0 + wait * 1000, offAt: t0 + (wait + real) * 1000, real, started: false, result: null };
    lamp.set(false);
    showHint(t('hint_lamp'), { duration: Math.max(1500, wait * 1000) });
    emit('lamp', { phase: 'wait' });
    refresh();
    emitChange();
  }

  function cancelRound() {
    s.round = null;
    lamp.set(false);
  }

  function tickLamp() {
    const g = s.round;
    if (!g || g.phase === 'done') return false;
    const n = now();
    if (g.phase === 'wait' && n >= g.onAt) {
      g.phase = 'on';
      lamp.set(true);
      hideHint();
      emit('lamp', { phase: 'on' });
      refresh();
      emitChange();
    }
    if (g.phase === 'on' && n >= g.offAt) {
      g.phase = 'off';
      g.offSeen = n;
      lamp.set(false);
      if (s.running) showHint(t('hint_stop_now'), { duration: 2500 });
      emit('lamp', { phase: 'off' });
      refresh();
    }
    if (g.phase === 'off') {
      if (g.started && !s.running) finishRound();
      else if (!g.started && n - g.offSeen > 1500) finishRound({ missed: true });
    }
    return true;
  }

  function finishRound({ missed = false } = {}) {
    const g = s.round;
    g.phase = 'done';
    const measured = split(s.acc).value;
    g.result = missed ? { missed: true } : { measured, diff: roundTo(Math.abs(measured - g.real), LC) };
    hideHint();
    if (missed) showHint(t('lamp_missed'), { duration: 4000 });
    else audio.success();
    emit('lamp', { phase: 'done', real: g.real, ...g.result });
    refresh();
    emitChange();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewPose(view) {
    const wide = s.lampShown;
    const target = new THREE.Vector3(wide ? 44 : 0, 50, 0);
    const halfW = wide ? 100 : 52;
    const halfH = 56;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const usable = Math.max(0.5, 1 - 64 / Math.max(stage.height, 200)); // room for the buttons on top
    const d = Math.max(halfH / Math.tan(vfov / 2) / usable, halfW / Math.tan(hfov / 2)) * 1.04;
    return { target, position: target.clone().addScaledVector(VIEW_DIRS[view], d) };
  }
  function flyTo({ position, target }, duration = 0.8) {
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
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(viewPose(s.view), 0));

  // ── pressing the watch's buttons ────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** The button under a canvas point ('start' | 'reset'), or null. */
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(watch.buttonHits, false)[0];
    return hit ? hit.object.userData.button : null;
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const button = pick(canvasPoint(e));
      down = button ? { button } : null;
      if (!button) return; // the camera controls take it
      e.stopPropagation(); // a press on a button is not a camera move
      e.preventDefault();
      watch.pressButton(button, true);
      // like a real stopwatch it acts as the button goes down, so timing by finger is fair
      if (button === 'start') startStop({ animate: false });
      else reset({ animate: false });
    },
    true,
  );
  ui.canvasHost.addEventListener('pointerup', () => {
    if (!down) return;
    watch.pressButton(down.button, false);
    down = null;
    stage.invalidate();
  });
  ui.canvasHost.addEventListener('pointercancel', () => {
    if (down) watch.pressButton(down.button, false);
    down = null;
    stage.invalidate();
  });
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  const randomCs = (lo, hi) => roundTo(lo + Math.floor(Math.random() * Math.round((hi - lo) * 100)) / 100, LC);
  /** The right answer and three wrong ones from the usual mistakes (positive and all different). */
  function choicesFrom(right, mistakes) {
    const seen = new Set([fmtS(right)]);
    const wrong = [];
    for (const m of shuffle(mistakes.map((v) => roundTo(Math.abs(v), LC)))) {
      if (!(m > 0) || seen.has(fmtS(m))) continue;
      seen.add(fmtS(m));
      wrong.push(m);
      if (wrong.length === 3) break;
    }
    for (let k = 2; wrong.length < 3; k++) {
      const m = roundTo(right + k * 7.3, LC); // fallback, rarely needed
      if (!seen.has(fmtS(m))) {
        seen.add(fmtS(m));
        wrong.push(m);
      }
    }
    return shuffle([right, ...wrong]);
  }
  const dispHtml = ({ main, small }) => `<span class="sw-disp">${N(main)}<small>${N(small)}</small></span>`;
  /** How a time can be shown wrongly on the display: ÷ 100 for minutes, seconds and hundredths swapped, … */
  function displayChoices(v) {
    const r = format(v);
    const right = { main: r.main, small: r.small };
    const dm = Math.floor((v / 60) * 100) / 100; // minutes as a decimal number
    const candidates = shuffle([
      { main: `${Math.floor(v / 100)}:${two(Math.floor(v % 100))}`, small: r.small },
      { main: `${r.min}:${two(r.cs)}`, small: two(r.whole) },
      { main: `${Math.floor(dm)}:${two(Math.round((dm % 1) * 100))}`, small: '00' },
      { main: `0:${two(r.whole)}`, small: r.small },
      { main: `${r.min + 1}:${two(r.whole)}`, small: r.small },
    ]);
    const key = (d) => `${d.main} ${d.small}`;
    const list = [right];
    for (const c of candidates) if (list.length < 4 && !list.some((d) => key(d) === key(c))) list.push(c);
    shuffle(list);
    return { list, expected: list.indexOf(right) };
  }

  let kinds = [];
  let question = null;
  function showTime(seconds) {
    s.running = false;
    s.acc = split(seconds).value;
    refresh();
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
        s.running = false;
        cancelRound();
        showLamp(false);
        hideHint();
        kinds = shuffle(['read', 'interval', 'show', 'lc', pickOne(['read', 'interval'])]);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.hidden = false;
        syncUI();
        refresh();
      },
      async prepare(i, _alive, say) {
        const kind = kinds[i % kinds.length];
        s.locked = true;
        s.hidden = false;
        const label = (v) => `${S(v)}<small>${t('unit_s')}</small>`;
        if (kind === 'read') {
          const min = 1 + Math.floor(Math.random() * 4);
          const sec = randomCs(0, 59.99);
          const v = toSeconds(min, sec);
          showTime(v);
          say(t('q_read'));
          const r = format(v);
          question = { kind, v, min: r.min, sec: r.sec };
          return {
            choices: choicesFrom(v, [r.min * 100 + r.sec, r.sec, r.min * 60 + r.whole, r.min * 60 + r.cs, (r.min + 1) * 60 + r.sec]),
            expected: v,
            tolerance: LC / 2,
            label,
            meta: { kind, time: v },
          };
        }
        if (kind === 'interval') {
          // half the time the run crosses a whole minute, where reading M:SS as a decimal number goes wrong
          const cross = Math.random() < 0.5;
          const a = cross ? randomCs(40, 57) : randomCs(3, 30);
          const d = cross ? randomCs(5, 24) : randomCs(3, 25);
          const b = roundTo(a + d, LC);
          showTime(b);
          say(t('q_interval', { a: format(a).text }));
          const fa = format(a);
          const fb = format(b);
          const naive = fb.min * 100 + fb.sec - (fa.min * 100 + fa.sec);
          question = { kind, a, b, d };
          return {
            choices: choicesFrom(d, [naive, a + b, b, d + 1, d - 1, d + 0.1]),
            expected: d,
            tolerance: LC / 2,
            label,
            meta: { kind, from: a, to: b },
          };
        }
        if (kind === 'show') {
          const v = toSeconds(1 + Math.floor(Math.random() * 3), randomCs(0, 59.99));
          s.hidden = true;
          showTime(v);
          say(t('q_show', { s: fmtS(v) }));
          const { list, expected } = displayChoices(v);
          question = { kind, v, list };
          return { choices: [0, 1, 2, 3], expected, tolerance: 0.5, label: (j) => dispHtml(list[j]), meta: { kind, time: v } };
        }
        // least count
        showTime(randomCs(2, 40));
        say(t('q_lc'));
        question = { kind };
        return {
          choices: shuffle([0.01, 0.1, 1, 0.001]),
          expected: 0.01,
          tolerance: 0.0005,
          label: (v) => `${N(String(v))}<small>${t('unit_s')}</small>`,
          meta: { kind },
        };
      },
      reveal() {
        s.hidden = false;
        refresh();
        const q = question;
        if (q.kind === 'read')
          return `<b class="c-min">${N(q.min)}</b> × ${N('60')} + <b class="c-sec">${S(q.sec)}</b> = <b>${S(q.v)} ${t('unit_s')}</b>`;
        if (q.kind === 'interval') return `${S(q.b)} − ${S(q.a)} = <b>${S(q.d)} ${t('unit_s')}</b>`;
        if (q.kind === 'show') {
          const r = format(q.v);
          return t('show_why', { s: fmtS(q.v), min: r.min, m60: r.min * 60, sec: fmtS(r.sec), disp: `${r.main} ${r.small}` });
        }
        return t('lc_why', { lc: '0.01' });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on the start button ──────────────────────────────────
  let coach = null;
  if (o.coach) {
    const v = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_tap',
        candidates: () => {
          v.copy(watch.points.start()).project(camera);
          return [{ x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height }];
        },
        grabbable: (p) => pick(p) === 'start',
        // the button goes in and out, as if pressed
        async demo(alive) {
          for (let i = 0; i < 2 && alive() && !s.running; i++) {
            watch.pressButton('start', true);
            stage.invalidate();
            await new Promise((r) => setTimeout(r, 180));
            watch.pressButton('start', false);
            stage.invalidate();
            await new Promise((r) => setTimeout(r, 320));
          }
        },
        cancel: () => watch.pressButton('start', false),
      },
    });
  }

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
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'startstop':
        if (e.detail === 0) startStop(); // the keyboard; a finger or the mouse acted on pointerdown
        break;
      case 'reset':
        reset();
        break;
      case 'lamp':
        lampRound();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // the panel's start/stop button also acts as it goes down (a click comes only when the finger lifts)
  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !(/** @type {Element} */ (e.target).closest('[data-act="startstop"]'))) return;
    audio.unlock();
    startStop();
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === ' ' && !target.closest('button')) startStop();
    else if (k === 's') startStop();
    else if (k === 'r') reset();
    else if (k === 'l') lampRound();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  s.acc = split(Number(o.time) || 0).value;
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start();
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
     * Change any of: time (s, shows it stopped), running (true starts, false stops, as the button does), lamp
     * (true shows the lamp, false hides it), round (true or { delay, on } in s: a lamp-game round), view;
     * animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.lamp === false) {
        cancelRound();
        showLamp(false, { animate });
      }
      if (p.lamp === true) showLamp(true, { animate });
      if (p.time != null) {
        cancelRound();
        showTime(Math.max(0, Number(p.time) || 0));
        emitChange();
      }
      if (p.round) lampRound(p.round === true ? {} : p.round);
      if (p.running != null && Boolean(p.running) !== s.running) startStop({ silent: true });
      return snapshot();
    },
    async reset() {
      quiz.stop();
      cancelRound();
      showLamp(false, { animate: false });
      s.running = false;
      s.acc = 0;
      refresh();
      emitChange();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => watch.root, // the watch and its lanyard, not the lamp
  };
}
