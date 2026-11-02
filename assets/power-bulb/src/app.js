// Power: the 100 W bulb (ক্ষমতা: বাতি), book p120, topic 4.7: the student view. The book's 100 W bulb over the door of
// a sunny Bangladeshi house uses 100 J each second (1 W = 1 J/s): a stopwatch and the energy used so far beside it,
// next to the book's 1000 MW power plant. The panel is the kit's clean sheet (one action, one result as a small
// P = W ÷ t table, one rule): docs/student-kit.md. A 3-question test. (The two pumps are the lab `power`.)
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
import { createI18n, group } from './i18n.js';
import { BULB, BULB_TIME, bulbAt, choicesFrom, energyMistakes, roundTo, shuffle } from './power.js';
import { createPump } from './pump.js';
import { createScene, LAYOUT, ROOF } from './scene.js';
import { createTank } from './tank.js';

export const DEFAULTS = {
  at: '', // seconds since the bulb went on, held still (pictures); empty: before
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the bulb pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const IDS = /** @type {const} */ (['small', 'big']);
const COLORS = { t: '#c2255c', P: '#862e9c' };
const PUMP_COLORS = { small: '#1f74c9', big: '#d4382c' };
const PUMP_SIZE = { small: 1, big: 1.32 };
const ELEVATION = 2; // degrees: the front view stands in the courtyard and looks up a little
const AZIMUTH = -9; // degrees: from a little to the left, so the wall shows its depth
const VIEW_3D = new THREE.Vector3(-0.55, 0.32, 0.9).normalize();

/** A stopwatch drawn in SVG for a label (the font has no clock glyph); its hand at `sec` on a 60 s dial. */
function stopwatchSvg(sec, color) {
  const a = ((sec % 60) / 60) * Math.PI * 2;
  const x = 12 + Math.sin(a) * 6.2;
  const y = 14 - Math.cos(a) * 6.2;
  return `<svg class="pw-sw" viewBox="0 0 24 26" aria-hidden="true"><rect x="10" y="0.6" width="4" height="3" rx="1" fill="${color}"/><circle cx="12" cy="14" r="9.4" fill="#fff" stroke="${color}" stroke-width="2.2"/><path d="M12 14 L${x.toFixed(2)} ${y.toFixed(2)}" stroke="${color}" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="14" r="1.5" fill="${color}"/></svg>`;
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const NG = (x) => N(group(x));

  root.classList.add('pvc', 'pw');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel: one action, the P = W ÷ t table, one rule ──────────────────────
  const sheetHtml = cleanSheet(t, {
    quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
    lines: { action: 1, rule: 3 }, // the result's table keeps its own height (a header and two rows)
  });
  const ui = buildStudentShell(root, t, { layout: 'side', learn: sheetHtml, learnAlign: 'start' });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const outcomeEl = $('.pvc-outcome');
  outcomeEl.setAttribute('aria-label', t('calc'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 42, near: 0.1, far: 400, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.2;
  controls.maxDistance = 40;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.maxPolarAngle = Math.PI * 0.49; // never under the courtyard
  // a calm sky: soft blue at the top, pale near the horizon
  if (o.bg !== 'transparent') {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#5f87b3');
    g.addColorStop(0.5, '#87a7c6');
    g.addColorStop(0.85, '#b9cddd');
    g.addColorStop(1, '#d3e0ea');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const sky = new THREE.CanvasTexture(c);
    sky.colorSpace = THREE.SRGBColorSpace;
    scene.background = sky;
    scene.fog = new THREE.Fog('#d3e0ea', 16, 95); // a little haze far off, none on the house
  }
  scene.add(new THREE.HemisphereLight('#dff0ff', '#b98a55', 0.9));
  const key = new THREE.DirectionalLight('#fff3dc', 1.25);
  key.position.set(-6, 12, 9);
  scene.add(key);

  const world = new THREE.Group();
  world.name = 'Power';
  scene.add(world);
  const pumps = {};
  const tanks = {};
  for (const id of IDS) {
    pumps[id] = createPump({ color: PUMP_COLORS[id], size: PUMP_SIZE[id], name: `Pump_${id}`, cableSide: id === 'big' ? 1 : -1 }); // cables from the wall
    // the small pump's suction faces right (+x) toward the hatch, the big one's left
    pumps[id].root.position.set(LAYOUT.pumpX[id], 0, LAYOUT.pumpZ);
    if (id === 'big') pumps[id].root.rotation.y = Math.PI;
    tanks[id] = createTank({ name: `RoofTank_${id}`, accent: PUMP_COLORS[id] });
    tanks[id].root.position.set(LAYOUT.pumpX[id], ROOF, LAYOUT.tankZ);
    world.add(pumps[id].root, tanks[id].root);
  }
  const place3d = createScene({ pumps, tanks });
  world.add(place3d.root);
  const bulb = place3d.bulb;

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    // soft sun shadows, the shadow camera fitted closely round what casts and takes them in view (the house front,
    // the courtyard, the props by the walls), so a 1024 map is as sharp as a 2048 one on the old loose fit. Which
    // parts cast and take shadows is set where they are built (the ground and the far scenery only take them, or not).
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight('#ffffff', 0.7);
    sun.position.set(-5, 11, 8);
    sun.target.position.set(0, 1.5, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.blurSamples = 8;
    sun.shadow.bias = -0.0005;
    scene.add(sun, sun.target);
    fitShadow(sun, new THREE.Box3(new THREE.Vector3(-7.6, -0.1, -1.6), new THREE.Vector3(7.6, ROOF + 1.7, 4.6)));
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state: every line, label, tank and pump is drawn from it ─────────────
  const s = {
    phase: 'ready', // 'ready' | 'run' | 'done'
    t: 0, // seconds since the switch went on
    paused: false,
    bulbP: BULB, // W (the test changes it)
    bulbT: BULB_TIME, // s
    runs: 0,
    labels: 'full', // 'full' | 'noE' (the test: the bulb's energy hidden)
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    lastAct: -1e9,
  };
  const total = () => s.bulbT;

  /** Where the bulb is now: its stopwatch and the energy used so far. */
  function now() {
    const bt = s.phase === 'ready' ? 0 : s.phase === 'done' ? s.bulbT : s.t;
    return { bulb: bulbAt(bt, s.bulbP, s.bulbT) };
  }

  // ── what the student sees ──────────────────────────────────────────────────
  let action = null;
  for (const id of IDS) tanks[id].setMass(0); // the pumps rest (they are the lab "power")
  function place(n = now()) {
    bulb.set(s.phase === 'run');
    labels(n);
    panel(n);
    stage.invalidate();
  }

  // ── labels on the picture ──────────────────────────────────────────────────
  let flights = 0;
  /** Labels keep their spot while it stays clear: after the camera has moved to a new view, let them choose again. */
  function relabel() {
    for (const id of shown.keys()) anno.remove(id);
    shown.clear();
    place();
  }
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
  const shown = new Map();
  function label(id, on, text, point, color, spots, optional = false) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!shown.has(id)) {
      anno.add(id, { text, point: () => point, color, spots, kind: 'part', optional });
      shown.set(id, text);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
    }
  }
  const pts = { bulb: new THREE.Vector3() };
  bulb.group.getWorldPosition(pts.bulb);
  function labels(n) {
    const b = n.bulb;
    const bulbTime = `${stopwatchSvg(b.t, COLORS.t)}<b class="pw-l-t">${t('l_time', { t: b.t })}</b>`;
    const energy = s.phase === 'ready' || s.labels === 'noE' ? '' : `<small class="pw-l-E">${t('l_energy', { E: group(b.E) })}</small>`;
    label('bulb', true, `<span class="pw-l"><b class="pw-l-name">${t('l_bulb', { P: s.bulbP })}</b>${bulbTime}${energy}</span>`, pts.bulb, COLORS.P, [
      { dx: 40, dy: 0 },
      { dx: -40, dy: 0 },
      { dx: 0, dy: 90 },
    ]);
  }

  // ── the panel: P = W ÷ t for the bulb, and the book's power plant ──
  const cell = (cls, html) => `<span class="${cls}">${html}</span>`;
  function row(name, W, tt, P, ghost = false) {
    const g = ghost ? ' pw-ghost' : '';
    return `${cell(`pw-name${g}`, name)}${cell(`c-W${g}`, W)}${cell(`pw-op${g}`, '÷')}${cell(`c-t${g}`, tt)}${cell(`pw-op${g}`, '=')}<b class="c-P${g}"${ghost ? ' aria-hidden="true"' : ''}>${P}</b>`;
  }
  const q = (u) => `?${u ? ` ${u}` : ''}`;
  function panel(n) {
    const head = `${cell('pw-name', '')}${cell('pw-h c-W', `${t('col_W')} <i>W</i>`)}${cell('pw-op', '')}${cell('pw-h c-t', `${t('col_t')} <i>t</i>`)}${cell('pw-op', '')}${cell('pw-h c-P', `${t('col_P')} <i>P</i>`)}`;
    let rows = '';
    {
      const b = n.bulb;
      const known = s.phase !== 'ready' && b.t > 0;
      rows += row(t('row_bulb'), known ? `${NG(b.E)} J` : q('J'), known ? `${N(b.t)} s` : q('s'), `${N(s.bulbP)} W`);
      // the book's power plant once the bulb has shown what a watt is (until then the row is kept, hidden)
      rows += row(t('row_plant'), `${N(1000)} × ${N('10<sup>6</sup>')} J`, `${N(1)} s`, `${N(1000)} MW`, s.phase !== 'done');
    }
    sheet.outcome(`<span class="pw-grid">${head}${rows}</span>`);

    // the rule, growing with what the student has found out
    const ph = s.phase;
    const rule = ph === 'ready' ? t('rule_bulb_ready', { P: s.bulbP }) : ph === 'run' ? t('rule_bulb_run', { P: s.bulbP }) : t('rule_bulb_done');
    sheet.rule(rule);

    const nx = nextAction();
    action?.set({ label: nx.label, step: nx.step, enabled: s.phase !== 'run' && !s.locked });
  }

  /** What the big button does next: { label, step }. */
  function nextAction() {
    if (s.phase === 'done') return { label: 'act_again', step: '' };
    return { label: 'act_bulb', step: s.runs === 0 ? 1 : '' };
  }

  // ── the run ─────────────────────────────────────────────────────────────────
  function snapshot() {
    const n = now();
    return {
      phase: s.phase,
      t: roundTo(s.t, 0.001),
      total: total(),
      bulb: { P: s.bulbP, t: n.bulb.t, E: n.bulb.E, on: s.phase === 'run' },
      runs: s.runs,
      next: (({ label, step }) => ({ label, step }))(nextAction()),
      mode: s.mode,
      view: s.view,
      locked: s.locked,
      paused: s.paused,
    };
  }
  let lastEmit = '';
  /** Tells the bridge when the stopwatch has moved on a whole second (or the phase changed). */
  function changed(n = now()) {
    const k = `${s.phase}|${n.bulb.t}`;
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snapshot());
    }
  }

  function finishRun() {
    s.phase = 'done';
    s.t = total();
    s.runs++;
    audio.success();
    place();
    emit('stop', snapshot());
    changed();
  }
  stage.addTicker((dt) => {
    if (s.phase !== 'run' || s.paused) return false;
    s.t += dt;
    if (s.t >= total()) {
      finishRun();
      return false;
    }
    const n = now();
    place(n);
    changed(n);
    return true;
  });

  /** Back to the start (no motion). */
  function toReady() {
    s.phase = 'ready';
    s.t = 0;
    s.paused = false;
    place();
    changed();
  }
  function startRun() {
    if (s.locked) return lockedNudge();
    s.t = 0;
    s.paused = false;
    s.phase = 'run';
    s.lastAct = performance.now();
    audio.unlock();
    audio.pop();
    place();
    emit('run', snapshot());
    changed();
  }
  /** Seconds since the bulb went on, held still (for pictures and the bridge). */
  function holdAt(sec) {
    if (sec >= total()) {
      s.t = total();
      s.phase = 'done';
      s.paused = false;
    } else {
      s.t = Math.max(0, sec);
      s.phase = 'run';
      s.paused = true;
    }
    place();
    changed();
  }

  /** The big button (and a tap on the bulb). */
  function act() {
    if (s.locked) return lockedNudge();
    if (performance.now() - s.lastAct < 400) return; // a double tap never undoes the first
    if (s.phase === 'run' && !s.paused) return;
    startRun();
  }

  // ── camera: the bulb over the door ────────────────────────────────────────────
  const box = new THREE.Box3();
  function viewPose() {
    const b = LAYOUT.bulb;
    // the bulb close, big and clear in its holder on the wall (a hint of the door frame below)
    box.min.set(b.x - 0.13, b.y - 0.1, b.z - 0.05);
    box.max.set(b.x + 0.13, b.y + 0.14, b.z + 0.05);
    const e = THREE.MathUtils.degToRad(ELEVATION);
    const az = THREE.MathUtils.degToRad(AZIMUTH);
    const dir = s.view === '3d' ? VIEW_3D : new THREE.Vector3(Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e));
    const top = Math.min(58, stage.height * 0.2);
    const bottom = 24;
    const side = Math.min(110, stage.width * 0.2); // room for the bulb's label beside it
    return fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: { top, bottom, side } });
  }
  function flyTo({ position, target }, duration = 0.8) {
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
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
  function fitCamera(duration = 0.7) {
    if (s.userMovedCamera) return Promise.resolve(true);
    return flyTo(viewPose(), duration);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(), animate ? 0.8 : 0);
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
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    place();
  });

  // ── a tap on the bulb does the action ──────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const r = stage.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.intersectObject(bulb.hit, false).length) return;
      e.stopPropagation();
      e.preventDefault();
      act();
    },
    true,
  );

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    clearTimeout(lockedNudge.timer);
    lockedNudge.timer = setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── the action: the big button, and its numbered badge in a ring round the bulb ─
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_bulb',
    // no ring once the run is over: nothing covers the results (the button offers the next step)
    target: () => {
      if (s.phase === 'done') return null;
      return bulb.mesh;
    },
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── the test ────────────────────────────────────────────────────────────────
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const numLabel = (unit) => (c) => `${NG(c.value)}<small> ${unit}</small>`;
  let saved = null;
  /** Set a question's scene at once: the bulb's numbers, the run finished, labels. */
  function questionScene({ bulbP = BULB, bulbT = BULB_TIME, labels: lm = 'full' } = {}) {
    Object.assign(s, { bulbP, bulbT, labels: lm, userMovedCamera: false });
    holdAt(1e9);
    flyTo(viewPose(), 0);
    relabel();
  }
  const QUESTIONS = {
    bulb() {
      const P = pick([40, 60, 100]);
      const tt = pick([5, 8, 12, 15]);
      questionScene({ bulbP: P, bulbT: tt, labels: 'noE' });
      const choices = choicesFrom(P * tt, energyMistakes(P, tt));
      return {
        text: t('q_bulb'),
        choices,
        label: numLabel('J'),
        reveal: () => t('r_bulb', { E: group(P * tt), P, t: tt }),
        after: 'full',
      };
    },
    unit() {
      questionScene({ labels: 'full' });
      const P = BULB;
      const choices = [
        { html: t('c_u_right', { P }), why: null },
        { html: t('c_u_total', { P }), why: 'm_u_total' },
        { html: t('c_u_bright', { P }), why: 'm_u_bright' },
        { html: t('c_u_time', { P }), why: 'm_u_time' },
      ];
      return { text: t('q_unit', { P }), choices, reveal: () => t('r_unit', { P }) };
    },
    plant() {
      questionScene({ labels: 'full' });
      const MW = 1000;
      const choices = [
        { html: t('c_pl_right', { MW }), why: null },
        { html: t('c_pl_M', { MW }), why: 'm_pl_M' },
        { html: t('c_pl_k', { MW }), why: 'm_pl_k' },
        { html: t('c_pl_W', { MW }), why: 'm_pl_W' },
      ];
      return { text: t('q_plant', { MW }), choices, reveal: () => t('r_plant', { MW }) };
    },
  };
  const ORDER = ['bulb', 'unit', 'plant'];
  let currentQ = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: ORDER.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        saved = { phase: s.phase === 'done' ? 'done' : 'ready' };
        s.mode = 'quiz';
        s.locked = true;
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        currentQ = null;
        Object.assign(s, { bulbP: BULB, bulbT: BULB_TIME, labels: 'full' });
        if (saved) {
          if (saved.phase === 'done') holdAt(1e9);
          else toReady();
        }
        s.userMovedCamera = false;
        const token = ++flights;
        fitCamera(0.6).then(() => token === flights && relabel());
        syncUI();
        place();
      },
      prepare(i, alive) {
        if (!alive()) return null;
        const qq = QUESTIONS[ORDER[i]]();
        // the right choice is always the first made: shuffle their order, keep the index
        const order = shuffle(qq.choices.map((_, j) => j));
        currentQ = qq;
        place();
        return {
          text: qq.text,
          choices: order,
          expected: 0,
          tolerance: 0.5,
          label: (j) => (qq.label ? qq.label(qq.choices[j]) : `<span class="pw-opt">${qq.choices[j].html}</span>`),
          meta: { question: ORDER[i] },
        };
      },
      reveal(_q, correct, picked) {
        const qq = currentQ;
        if (!qq) return '';
        if (qq.after) {
          s.labels = qq.after;
          place();
        }
        const why = !correct && qq.choices[picked.value]?.why;
        return `${qq.reveal()}${why ? ` <span class="pw-why">${t(why)}</span>` : ''}`;
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    controls.enableRotate = controls.enableZoom = !s.locked;
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
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'home') {
      if (s.locked) lockedNudge();
      else toReady();
    }
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (/** @type {Element} */ (e.target).closest?.('.pvc-quiz, button')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      act();
    }
  });

  // ── start ───────────────────────────────────────────────────────────────────
  const at = o.at === '' || o.at == null ? null : Number(o.at);
  if (at != null && Number.isFinite(at)) holdAt(at);
  else place();
  setView(s.view, { animate: false });
  relabel();
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
    getState: () => snapshot(),
    /**
     * Change any of: run (true: switch on), at (seconds since the bulb went on, held still), done (true: the run
     * finished), home (true: back to the start), paused, view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.home) toReady();
      if (p.at != null) holdAt(Number(p.at));
      if (p.done) holdAt(1e9);
      // a run finished from outside counts as run
      if (s.phase === 'done' && (p.done || p.at != null) && !s.runs) {
        s.runs = 1;
        place();
      }
      if (p.paused != null && s.phase === 'run') s.paused = Boolean(p.paused);
      if (p.run && (s.phase !== 'run' || s.paused)) startRun();
      stage.invalidate();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      Object.assign(s, { bulbP: BULB, bulbT: BULB_TIME, labels: 'full' });
      s.runs = 0;
      toReady();
      await setView('front');
      return snapshot();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world,
  };
}

/** Fits a directional light's shadow camera round a world box (in the light's own view), with a small margin. */
function fitShadow(light, box) {
  light.updateMatrixWorld();
  light.target.updateMatrixWorld();
  const view = new THREE.Matrix4().lookAt(light.position, light.target.position, new THREE.Vector3(0, 1, 0));
  view.setPosition(light.position);
  const inv = view.invert();
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
  const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const p = new THREE.Vector3();
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        p.set(x, y, z).applyMatrix4(inv);
        lo.min(p);
        hi.max(p);
      }
  const cam = light.shadow.camera;
  Object.assign(cam, { left: lo.x - 0.2, right: hi.x + 0.2, bottom: lo.y - 0.2, top: hi.y + 0.2, near: Math.max(0.1, -hi.z - 1), far: -lo.z + 1 });
  cam.updateProjectionMatrix();
}
