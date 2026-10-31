// Efficiency (book page 121, section 4.8 কর্মদক্ষতা): the book's example as a real machine. On the roof of a building
// going up, a 1000 W electric motor, fed from a battery through a red and a blue cable, drives a worm gear and spur
// gears that wind a rope on a drum; the rope lifts a 100 kg pallet of bricks 10 m from the street. The student switches
// it on and watches where the energy goes: the current runs in the cables (প্রদত্ত শক্তি, P × t), the load rises
// (কাজের পরিমাণ, mgh), and the rest leaves as heat shimmering off the motor (its windings glow), sparks and warmth where
// the teeth rub, and rings of sound (শক্তির অপচয়). The result line is a flow diagram that fills as it runs; the rule is
// the book's formula with the numbers, each term a button that lights its part of the machine. Three motors: the
// book's (15 s, 65.3%), with oiled gears (14 s, 70%) and with worn gears (20 s, 49%). "উদাহরণ" opens the book's
// worked example with steppers. The test asks five tap questions on frozen scenes.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { fitPose } from './camera.js';
import { createEffects } from './effects.js';
import { createExample } from './example.js';
import { createFlow } from './flow.js';
import { createI18n } from './i18n.js';
import { AT, ROPE_X, createMachine } from './machine.js';
import { BOOK, CONDITIONS, CONDITION_IDS, PLANT, energyAt, groupJ, liveJ, pct, runOf, solve, wasteShares } from './reading.js';
import { createSite, skyTexture } from './site.js';

export const PHASES = ['idle', 'run', 'done'];
const TERMS = ['input', 'work', 'waste'];
export const DEFAULTS = {
  cond: 'book', // which motor: book | oiled | worn
  phase: 'idle', // start part way (pictures): idle | run | done
  at: '', // s into the run for phase 'run'
  hold: false, // keep a part-way start still (pictures) until the student acts
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const VIEW_FRONT = new THREE.Vector3(0.34, 0.24, 0.9).normalize();
const VIEW_3D = new THREE.Vector3(-0.5, 0.42, 0.76).normalize();
const DOUBLE_TAP = 400; // ms
const COLORS = { input: '#1c6fd9', work: '#2b8a3e', waste: '#e8590c' };
const SWAP_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>';
const PAGE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h4"/></svg>';

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const G = (j) => N(groupJ(j));
  const J = (j) => t('f_j', { e: groupJ(j) });

  root.classList.add('pvc', 'ef');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'conds', results: true, items: CONDITION_IDS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [
        { act: 'example', label: 'act_example', icon: PAGE_ICON },
        { act: 'form', label: 'form_other', icon: SWAP_ICON },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      lines: { action: 1, rule: 4 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const flow = createFlow(/** @type {HTMLElement} */ (ui.$('.pvc-outcome')), t);

  // on the view: the honest note (top left) and the height of the load (a gauge on the right)
  const note = document.createElement('div');
  note.className = 'ef-note';
  note.textContent = t('note');
  const gauge = document.createElement('div');
  gauge.className = 'ef-gauge';
  gauge.setAttribute('aria-hidden', 'true');
  gauge.innerHTML = `<span class="ef-gauge-name">${t('gauge')}</span><span class="ef-gauge-bar"><i></i><b></b></span><span class="ef-gauge-h"></span>`;
  const ring = document.createElement('div');
  ring.className = 'ef-ring';
  ring.hidden = true;
  ui.stage.append(note, gauge, ring);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.05, far: 700, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  if (o.bg !== 'transparent') scene.background = skyTexture();
  scene.fog = new THREE.Fog('#cfe6f7', 70, 420);
  scene.add(new THREE.HemisphereLight('#e3f1ff', '#b08a5a', 1.0));
  const sun = new THREE.DirectionalLight('#fff3dc', 2.3);
  sun.position.set(3, 7, 5);
  sun.target.position.set(-0.3, 0.4, 0);
  scene.add(sun, sun.target);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 1, far: 20 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
  }
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.minDistance = 2;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * 0.62;

  const site = createSite();
  const machine = createMachine({ maxHeight: 20 });
  scene.add(site, machine.root);
  if (o.shadow) {
    machine.root.traverse((m) => {
      if (/** @type {THREE.Mesh} */ (m).isMesh) m.castShadow = m.receiveShadow = true;
    });
    site.traverse((m) => {
      if (/** @type {THREE.Mesh} */ (m).isMesh) m.receiveShadow = true;
    });
  }
  const effects = createEffects({ points: machine.points, curves: machine.curves, camera });
  scene.add(effects.root);
  machine.setTexts({ plateText: t('plate', { p: BOOK.P }), plateSub: t('plate_sub'), massText: t('mass', { m: BOOK.m }) });

  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state: every line, label and effect is drawn from it ───────────────
  const s = {
    cond: CONDITIONS[o.cond] ? o.cond : 'book',
    run: runOf('book'),
    shares: wasteShares('book'),
    phase: 'idle',
    time: 0, // s into the run
    fx: 0, // the effects' own clock
    cooling: 0, // s since the run ended (the haze fades)
    form: 1, // which of the book's two forms of the formula
    term: /** @type {string | null} */ (null), // the term lit on the machine
    termUntil: 0,
    found: { book: false, oiled: false, worn: false },
    taken: 0,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    frozen: false,
    held: false,
    quiz: /** @type {null | { labels: string[] }} */ (null),
    userMovedCamera: false,
  };
  let lastTap = Number.NEGATIVE_INFINITY;
  const energy = () => energyAt(s.run, s.time, s.shares);
  /** The final shares of the input (work and the three wasted parts), for the flow's band widths. */
  function shares() {
    const r = solve(s.run);
    const w = r.input > 0 ? r.work / r.input : 0;
    return { work: w, motor: (1 - w) * s.shares.motor, friction: (1 - w) * s.shares.friction, sound: (1 - w) * s.shares.sound };
  }

  // ── the machine and its effects at the state ───────────────────────────────
  function place() {
    const e = energy();
    machine.set(e.height, s.run.h);
    const r = solve(s.run);
    const wastePower = r.possible ? (r.input - r.work) / s.run.t : 0;
    const running = s.phase === 'run';
    const pMotor = wastePower * s.shares.motor;
    const pFriction = wastePower * s.shares.friction;
    const pSound = wastePower * s.shares.sound;
    const warm = Math.min(1, e.motor / 3200);
    const cool = s.phase === 'done' ? Math.max(0, 1 - s.cooling / 6) : 1;
    effects.set({
      heat: warm * cool,
      motorPower: running ? Math.min(1, pMotor / 200) : 0,
      friction: running ? Math.min(1, Math.max(0.12, (pFriction - 100) / 200)) : 0,
      sound: running ? Math.min(1, pSound / 9) : 0,
      current: running ? 1 : 0,
    });
    machine.setHeat({ motor: warm * (0.35 + 0.65 * cool), gears: Math.min(1, e.friction / 5000) * (0.4 + 0.6 * cool) });
    machine.setSwitch(running);
    effects.render(s.fx);
  }
  function drawDisplay() {
    const tt = s.phase === 'idle' ? 0 : s.time;
    const p = t('disp_p', { p: s.run.P });
    const time = t('disp_t', { t: (Math.floor(tt * 10 + 1e-6) / 10).toFixed(1) });
    machine.setDisplay((g, w, h) => {
      g.fillStyle = '#0d2a1f';
      g.fillRect(0, 0, w, h);
      g.fillStyle = s.phase === 'run' ? '#7dff9a' : '#5fbf78';
      g.font = '700 66px "Noto Sans Bengali", sans-serif';
      g.textBaseline = 'middle';
      g.fillText(p, 26, h * 0.3);
      g.fillStyle = '#ffe066';
      g.fillText(time, 26, h * 0.74);
    });
  }
  let lastDisplay = '';
  function display() {
    const key = `${s.phase}|${s.run.P}|${Math.floor(s.time * 10 + 1e-6)}`;
    if (key === lastDisplay) return;
    lastDisplay = key;
    drawDisplay();
  }

  // ── camera: the machine big, the jib and the edge in view, room on the right for the gauge ────────────────────────
  const frame = new THREE.Box3();
  function viewPose(view = s.view) {
    const tall = stage.width / Math.max(1, stage.height) < 1.05;
    // a very wide, short view (a laptop with the panel below): crop a little top and bottom so the machine is big
    const flat = stage.width / Math.max(1, stage.height) > 2.4;
    frame.min.set(tall ? -1.38 : -1.5, tall ? -0.3 : flat ? -0.08 : -0.15, -0.45);
    frame.max.set(tall ? 1.1 : 1.3, flat ? 1.38 : 1.5, 0.55);
    const top = Math.min(52, stage.height * 0.13);
    return fitPose({
      box: frame,
      dir: view === '3d' ? VIEW_3D : VIEW_FRONT,
      camera,
      width: stage.width,
      height: stage.height,
      margin: { top, bottom: 8, side: 6 },
    });
  }
  function fitCamera() {
    if (s.userMovedCamera) return;
    const p = viewPose();
    camera.position.copy(p.position);
    controls.target.copy(p.target);
    controls.update();
  }
  function setView(view) {
    if (s.mode === 'quiz') return;
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = controls.enableZoom = s.view === '3d';
    s.userMovedCamera = false;
    fitCamera();
    syncUI();
    stage.invalidate();
    emit('view', { view: s.view });
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
  });
  controls.addEventListener('change', () => stage.invalidate());

  // ── screen boxes ────────────────────────────────────────────────────────────
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const tmpBox = new THREE.Box3();
  function screenBox(box3, out = { left: 0, top: 0, right: 0, bottom: 0 }) {
    let i = 0;
    for (const x of [box3.min.x, box3.max.x])
      for (const y of [box3.min.y, box3.max.y]) for (const z of [box3.min.z, box3.max.z]) corners[i++].set(x, y, z).project(camera);
    out.left = out.top = Number.POSITIVE_INFINITY;
    out.right = out.bottom = Number.NEGATIVE_INFINITY;
    for (const c of corners) {
      const px = (c.x * 0.5 + 0.5) * stage.width;
      const py = (-c.y * 0.5 + 0.5) * stage.height;
      out.left = Math.min(out.left, px);
      out.right = Math.max(out.right, px);
      out.top = Math.min(out.top, py);
      out.bottom = Math.max(out.bottom, py);
    }
    return out;
  }
  const P = machine.parts;
  const TERM_PARTS = { input: [P.battery, P.cables], work: [P.load], waste: [P.motor, P.gearGroup, P.wheel] };
  function boxOf(list) {
    const b = new THREE.Box3();
    for (const obj of list) b.union(tmpBox.setFromObject(obj));
    return b;
  }
  const loadVisible = () => machine.points.hook.y > frame.min.y - 0.2;
  function loadBox() {
    if (!loadVisible()) return null;
    const b = screenBox(tmpBox.setFromObject(P.load));
    if (b.top > stage.height) return null;
    return b;
  }

  // ── labels ──────────────────────────────────────────────────────────────────
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, note, gauge, () => action?.ringBox(), () => action?.box(), () => loadBox()],
  });
  const grid = (dys, dxs) => dys.flatMap((dy) => dxs.map((dx) => ({ dx, dy })));
  const SPOTS = {
    up: grid([-34, -54, -74], [0, 30, -30, 60, -60]),
    side: grid([0, -24, 24, -48], [-70, 70, -110, 110]),
    low: grid([46, 66, 30], [-70, -100, -130, 90, 120]),
    work: grid([34, 54, 14, -20], [-80, -110, -140, -50]),
  };
  const pts = {
    input: new THREE.Vector3(),
    heat: new THREE.Vector3(),
    friction: new THREE.Vector3(),
    sound: new THREE.Vector3(),
    work: new THREE.Vector3(),
    motor: new THREE.Vector3(),
    load: new THREE.Vector3(),
  };
  function label(id, show, opts) {
    if (!show) {
      if (anno.has(id)) anno.remove(id);
      return;
    }
    if (anno.has(id)) {
      anno.setText(id, opts.text);
      anno.update(id, { color: opts.color });
    } else anno.add(id, opts);
  }
  function labels() {
    const M = machine.points;
    const live = s.phase !== 'idle' && !s.quiz;
    const running = s.phase === 'run';
    pts.input.copy(M.battery).add(new THREE.Vector3(0, 0.02, -0.1));
    pts.heat.copy(M.motorTop).add(new THREE.Vector3(0, 0.22, 0));
    pts.friction.copy(M.wormMesh);
    pts.sound.copy(M.gears).add(new THREE.Vector3(0.25, 0.25, 0));
    const hookY = M.hook.y;
    // on the load once it is in view, else on the rope near the bottom of the view
    pts.work.set(ROPE_X - 0.1, Math.max(hookY - 0.62, frame.min.y + 0.45), AT.pulley.z + 0.15);
    label('input', live, { text: t('l_input'), color: COLORS.input, point: () => pts.input, kind: 'part', spots: SPOTS.up, optional: true });
    const roomy = stage.height >= 260; // a short view keeps only the two labels of the formula's terms
    label('heat', roomy && live && (running || s.cooling < 6), {
      text: t('l_heat'),
      color: '#d9480f',
      point: () => pts.heat,
      kind: 'part',
      spots: SPOTS.up,
      optional: true,
    });
    label('friction', roomy && running, {
      text: t('l_friction'),
      color: '#c92a2a',
      point: () => pts.friction,
      kind: 'part',
      spots: SPOTS.down,
      optional: true,
    });
    label('sound', roomy && running, {
      text: t('l_sound'),
      color: '#6741d9',
      point: () => pts.sound,
      kind: 'part',
      spots: SPOTS.side,
      optional: true,
    });
    label('work', live, {
      text: t(s.phase === 'done' ? 'l_work_done' : 'l_work', { h: s.run.h }),
      color: COLORS.work,
      point: () => pts.work,
      kind: 'part',
      spots: SPOTS.work,
      optional: true,
    });
    // the test's labels: the numbers the question needs
    const q = s.quiz?.labels || [];
    const e = energy();
    pts.load.set(ROPE_X, hookY - 0.45, AT.pulley.z);
    pts.motor.copy(M.motorTop).add(new THREE.Vector3(0, 0.1, 0));
    label('q_input', q.includes('input'), {
      text: t('l_q_input', { e: groupJ(e.input) }),
      color: COLORS.input,
      point: () => pts.input,
      kind: 'callout',
      spots: SPOTS.up,
    });
    label('q_work', q.includes('work'), {
      text: t('l_q_work', { e: groupJ(e.work) }),
      color: COLORS.work,
      point: () => pts.load,
      kind: 'callout',
      spots: grid([-30, 0, 30, -60], [-110, -140, -170]),
    });
    label('q_motor', q.includes('motor'), {
      text: t('l_q_motor', { p: s.run.P, t: s.run.t }),
      color: '#343a40',
      point: () => pts.motor,
      kind: 'callout',
      spots: SPOTS.up,
    });
    anno.update();
  }

  // ── a term of the formula lights its part of the machine (a ring round it, a label) ─────────────────────────────
  function lightTerm(term) {
    if (!TERMS.includes(term)) return;
    s.term = term;
    s.termUntil = performance.now() + 2800;
    ringTo();
    emit('term', { term });
    stage.invalidate();
  }
  function ringTo() {
    if (!s.term || performance.now() > s.termUntil || s.mode === 'quiz') {
      if (!ring.hidden) {
        ring.hidden = true;
        s.term = null;
        refresh();
      }
      return false;
    }
    const b = screenBox(boxOf(TERM_PARTS[s.term]));
    const pad = 8;
    const L = Math.max(4, b.left - pad);
    const T = Math.max(4, b.top - pad);
    const R = Math.min(stage.width - 4, b.right + pad);
    const B = Math.min(stage.height - 4, b.bottom + pad);
    ring.hidden = false;
    ring.style.cssText = `left:${L}px;top:${T}px;width:${Math.max(20, R - L)}px;height:${Math.max(20, B - T)}px;--c:${COLORS[s.term]}`;
    ring.dataset.label = t(`term_ring_${s.term}`);
    return true;
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const fr = (top, bottom) => `<span class="fr"><span>${top}</span><span>${bottom}</span></span>`;
  const term = (k, text = t(`f_${k}`)) => `<button type="button" class="ef-term ${k}${s.term === k ? ' on' : ''}" data-term="${k}">${text}</button>`;
  function formula() {
    const e = energy();
    const done = s.phase === 'done';
    const known = s.phase !== 'idle';
    const val = (j, k) => `<span class="v ${k}">${!known ? t('f_none') : done ? J(j) : t('f_j', { e: groupJ(liveJ(j)) })}</span>`;
    const r = solve(s.run);
    const eff = `<b class="ef-eff">${known ? `${N(pct(r.eff))}%` : '?'}</b>`;
    // the book's first form: each term with its number; the second: input − waste over input (in words, with the
    // numbers beside it where the panel is wide enough)
    const one = s.form === 1;
    const top = one ? `${term('work')} ${val(e.work, 'work')}` : `${term('input')} − ${term('waste')}`;
    const bottom = one ? `${term('input')} ${val(e.input, 'input')}` : term('input');
    const nums = one
      ? ''
      : `<span class="ef-eq ef-nums">= ${fr(`${val(e.input, 'input')} − ${val(e.waste, 'waste')}`, val(e.input, 'input'))} ${t('times100')}</span>`;
    return `<span class="ef-f${one ? '' : ' two'}"><span class="ef-eq"><span class="ef-name">${t('eff')}</span> =</span> <span class="ef-eq">${fr(top, bottom)} ${t('times100')}</span> ${nums} <span class="ef-eq">= ${eff}</span></span>`;
  }
  function next() {
    if (s.held) return { label: 'act_run', kind: 'go', enabled: true };
    if (s.phase === 'run') return { label: 'act_running', kind: 'run', enabled: false };
    if (s.phase === 'done') return { label: 'act_again', kind: 'again', enabled: true };
    return { label: 'act_run', kind: 'run', enabled: true };
  }
  const stepOf = (n) => (n.kind === 'again' ? '' : Math.max(1, s.taken + (s.phase === 'run' ? 0 : 1)));
  function refresh() {
    const known = s.phase !== 'idle';
    const e = energy();
    const done = s.phase === 'done';
    const shown = known ? Object.fromEntries(Object.entries(e).map(([k, v]) => [k, done ? v : liveJ(v)])) : null;
    flow.draw({ e: shown, shares: shares(), flowing: s.phase === 'run' && !s.frozen, J, G });
    const cond = CONDITIONS[s.cond] ? s.cond : null;
    sheet.choose(cond);
    for (const id of CONDITION_IDS) sheet.result(id, s.found[id] ? t('res_eff', { e: pct(solve(runOf(id)).eff) }) : '');
    sheet.next(done ? CONDITION_IDS.find((id) => !s.found[id] && id !== s.cond) || null : null);
    const say = !known
      ? t('rule_idle', { p: s.run.P, m: s.run.m, h: s.run.h })
      : !done
        ? t('rule_run')
        : `${t(`rule_${cond || 'custom'}`, { e: pct(solve(s.run).eff), c: 100 })} ${
            Object.values(s.found).filter(Boolean).length >= 2 ? t('rule_plant', { p: PLANT }) : t('rule_never', { c: 100 })
          }`;
    sheet.rule(`${formula()}<span class="ef-say">${say}</span>`);
    const n = next();
    action?.set({ step: stepOf(n), label: n.label, icon: n.kind === 'again' ? ICONS.reset : ICONS.hand, enabled: n.enabled && !s.locked });
    // the gauge
    const k = s.run.h > 0 ? e.height / s.run.h : 0;
    gauge.style.setProperty('--k', k.toFixed(4));
    /** @type {HTMLElement} */ (gauge.querySelector('.ef-gauge-h')).textContent = t('gauge_h', {
      h: done ? s.run.h : (Math.floor(e.height * 10 + 1e-6) / 10).toFixed(1),
    });
    labels();
    stage.invalidate();
  }

  function snapshot() {
    const e = energy();
    const r = solve(s.run);
    const n = next();
    const J10 = (j) => Math.round(j);
    return {
      cond: CONDITIONS[s.cond] ? s.cond : 'custom',
      phase: s.phase,
      time: Math.round(s.time * 1000) / 1000,
      height: Math.round(e.height * 1000) / 1000,
      run: { ...s.run },
      energy: {
        input: J10(e.input),
        work: J10(e.work),
        waste: J10(e.waste),
        motor: J10(e.motor),
        friction: J10(e.friction),
        sound: J10(e.sound),
      },
      efficiency: +pct(r.eff),
      found: { ...s.found },
      next: { action: n.kind, step: stepOf(n), enabled: n.enabled && !s.locked },
      form: s.form,
      term: s.term,
      example: example.state,
      view: s.view,
      mode: s.mode,
    };
  }
  function emitChange() {
    emit('change', snapshot());
  }

  // ── running it ──────────────────────────────────────────────────────────────
  /** Choose a motor (or a run of the example's numbers) and put it at a phase at once. */
  function setup(cond, run = null) {
    s.cond = run ? 'custom' : CONDITIONS[cond] ? cond : 'book';
    s.run = run ? { ...run } : runOf(s.cond);
    s.shares = wasteShares(run ? 'book' : s.cond);
    machine.setCondition(run ? 'book' : s.cond);
    machine.setMass(s.run.m);
    machine.setTexts({ plateText: t('plate', { p: s.run.P }), plateSub: t('plate_sub'), massText: t('mass', { m: s.run.m }) });
    lastDisplay = '';
  }
  function jumpTo(phase, at) {
    s.held = false;
    s.phase = PHASES.includes(phase) ? phase : 'idle';
    s.time =
      s.phase === 'done'
        ? s.run.t
        : s.phase === 'run'
          ? Math.min(s.run.t - 0.05, Math.max(0, Number.isFinite(+at) && at !== '' && at != null ? +at : s.run.t / 2))
          : 0;
    s.cooling = 0;
    if (s.phase === 'done' && CONDITIONS[s.cond]) s.found[s.cond] = true;
    place();
    display();
    refresh();
  }
  function start() {
    s.phase = 'run';
    s.time = 0;
    s.cooling = 0;
    s.taken++;
    audio.tick();
    emit('action', { action: 'run', cond: s.cond });
    place();
    display();
    refresh();
    emitChange();
  }
  function doAction() {
    if (s.locked || s.mode === 'quiz') return lockedNudge();
    const now = performance.now();
    if (now - lastTap < DOUBLE_TAP) return;
    const n = next();
    if (!n.enabled) {
      action?.flash();
      return;
    }
    lastTap = now;
    if (n.kind === 'go') {
      s.held = false;
      refresh();
      emitChange();
      return;
    }
    if (n.kind === 'again') {
      s.time = 0;
      s.phase = 'idle';
    }
    start();
  }
  function chooseCond(cond) {
    if (s.mode === 'quiz' || !CONDITIONS[cond]) return;
    setup(cond);
    s.taken = 0;
    jumpTo('idle');
    emit('cond', { cond });
    emitChange();
  }
  function goHome() {
    s.taken = 0;
    s.userMovedCamera = false;
    s.form = 1;
    setup(CONDITIONS[s.cond] ? s.cond : 'book');
    jumpTo('idle');
    fitCamera();
    emitChange();
  }

  let throttle = 0;
  stage.addTicker((dt) => {
    let moving = false;
    if (s.phase === 'run' && !s.frozen && !s.held) {
      s.time = Math.min(s.run.t, s.time + dt);
      if (s.time >= s.run.t - 1e-9) {
        s.phase = 'done';
        if (CONDITIONS[s.cond]) s.found[s.cond] = true;
        if (!s.locked) audio.success();
        emit('phase', { from: 'run', to: 'done' });
        refresh();
        emitChange();
      }
      moving = true;
    } else if (s.phase === 'done' && s.cooling < 6 && !s.frozen) {
      s.cooling += dt;
      moving = true;
    }
    const animate = moving || (s.phase === 'run' && !s.frozen) || (s.frozen && s.phase === 'run');
    if (animate) {
      s.fx += dt;
      place();
      display();
      throttle += dt;
      if (throttle > 0.1) {
        throttle = 0;
        refresh();
      } else labels();
    }
    const lit = ringTo();
    return animate || lit;
  });
  stage.onResize(() => {
    fitCamera();
    refresh();
  });

  // the big button and the numbered ring on the battery's switch
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_run',
    target: () => machine.points.switch,
    radius: 22,
    avoid: [ui.corner, ui.hint, note, gauge, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // touching the battery or the motor acts like the big button
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const r = stage.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / stage.width) * 2 - 1, -((e.clientY - r.top) / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.intersectObjects([P.battery, P.motor], true).length === 0) return;
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );

  let hintTimer = 0;
  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(hintOff, 2600);
  }
  function hintOff() {
    ui.hint.classList.remove('show');
  }

  // ── the worked example ─────────────────────────────────────────────────────
  const example = createExample({
    root,
    t,
    onTerm: (k) => lightTerm(k),
    onRun: (run) => {
      setup('custom', run);
      s.taken = 0;
      jumpTo('idle');
      start();
    },
    onChange: () => emitChange(),
  });

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  const word = (key, vars) => ({ key, text: t(key, vars) });
  const joules = (key, j) => ({ key, text: J(j) });
  const percent = (key, x) => ({ key, text: `${N(pct(x))}%` });
  function choices(items, kind) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ef-opt">${list[j].text}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const KINDS = ['eff', 'waste', 'input', 'heat', 'oil', 'plant'];
  let kinds = [];
  let question = null;
  let learnSaved = null;
  function setScene(cond, phase, at, labels, alive) {
    if (!alive()) return false;
    s.frozen = false;
    s.quiz = { labels };
    setup(cond);
    jumpTo(phase, at);
    s.frozen = true;
    s.fx = 1.3;
    place();
    refresh();
    return true;
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    action,
    lines: { text: 3, feedback: 3 },
    hooks: {
      enter() {
        learnSaved = { cond: s.cond, run: { ...s.run }, phase: s.phase, time: s.time, taken: s.taken, found: { ...s.found } };
        example.close();
        s.mode = 'quiz';
        s.locked = true;
        s.view = 'front';
        s.userMovedCamera = false;
        s.term = null;
        ring.hidden = true;
        controls.enableRotate = controls.enableZoom = false;
        hintOff();
        fitCamera();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.frozen = false;
        s.quiz = null;
        hintOff();
        if (learnSaved) {
          setup(learnSaved.cond, learnSaved.cond === 'custom' ? learnSaved.run : null);
          s.found = { ...learnSaved.found };
          s.taken = learnSaved.taken;
          jumpTo(learnSaved.phase === 'run' ? 'idle' : learnSaved.phase);
        }
        fitCamera();
        syncUI();
        refresh();
        emitChange();
      },
      prepare(i, alive) {
        if (i === 0) kinds = shuffle([...KINDS]).slice(0, 5);
        const kind = kinds[i % kinds.length];
        question = { kind };
        if (kind === 'eff' || kind === 'waste') {
          const cond = pickOne(['oiled', 'worn', 'book']);
          if (!setScene(cond, 'done', null, ['input', 'work'], alive)) return null;
          const r = solve(s.run);
          Object.assign(question, { w: r.work, i: r.input, x: r.waste, e: r.eff });
          if (kind === 'eff')
            return {
              text: t('q_eff'),
              ...choices(
                [
                  percent('e_right', r.eff),
                  percent('e_flip', (r.input / r.work) * 100),
                  percent('e_waste', (r.waste / r.input) * 100),
                  percent('e_k', r.work / 1000),
                ],
                kind,
              ),
            };
          return {
            text: t('q_waste'),
            ...choices([joules('w_right', r.waste), joules('w_sum', r.input + r.work), joules('w_work', r.work), joules('w_input', r.input)], kind),
          };
        }
        if (kind === 'input') {
          const cond = pickOne(['oiled', 'worn']);
          if (!setScene(cond, 'done', null, ['motor'], alive)) return null;
          const r = solve(s.run);
          Object.assign(question, { i: r.input, p: s.run.P, t: s.run.t });
          return {
            text: t('q_input'),
            ...choices([joules('i_right', r.input), joules('i_div', s.run.P / s.run.t), joules('i_p', s.run.P), joules('i_work', r.work)], kind),
          };
        }
        if (kind === 'heat') {
          if (!setScene('worn', 'run', 13, [], alive)) return null;
          return { text: t('q_heat'), ...choices([word('h_waste'), word('h_work'), word('h_new'), word('h_load')], kind) };
        }
        if (kind === 'oil') {
          if (!setScene('book', 'done', null, [], alive)) return null;
          return { text: t('q_oil'), ...choices([word('o_better'), word('o_work'), word('o_full', { c: 100 }), word('o_worse')], kind) };
        }
        if (!setScene('book', 'done', null, [], alive)) return null;
        const c = 100;
        return {
          text: t('q_plant', { p: PLANT, c }),
          ...choices([joules('p_right', PLANT), joules('p_waste', c - PLANT), joules('p_all', c), joules('p_tiny', PLANT / 10)], kind),
        };
      },
      reveal(q, correct, picked) {
        const k = question.kind;
        const key = correct ? null : q.list?.[picked.index]?.key;
        const v = {
          w: groupJ(question.w ?? 0),
          i: groupJ(question.i ?? 0),
          x: groupJ(question.x ?? 0),
          e: pct(question.e ?? 0),
          p: question.p ?? PLANT,
          t: question.t ?? 0,
          c: 100,
          k: groupJ(1000),
        };
        const extra = key && !key.endsWith('_right') && !['h_waste', 'o_better'].includes(key) ? ` ${t(`not_${key}`, v)}` : '';
        if (k === 'plant')
          return (
            t('why_plant', { p: PLANT, c: 100, w: 100 - PLANT, e: pct(solve(BOOK).eff) }) +
            (key ? ` ${t(`not_${key}`, { p: PLANT, c: 100, w: 100 - PLANT })}` : '')
          );
        return t(`why_${k}`, v) + extra;
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
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
    if (!b || !root.contains(b)) return;
    audio.unlock();
    const d = /** @type {HTMLElement} */ (b).dataset;
    if (d.view) setView(d.view);
    if (d.example) chooseCond(d.example);
    if (d.term) {
      lightTerm(d.term);
      refresh();
    }
    if (d.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (d.mode === 'explore') quiz.stop();
    if (d.q != null) quiz.choose(Number(d.q));
    switch (d.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'home':
        if (s.locked) lockedNudge();
        else goHome();
        break;
      case 'example':
        if (s.locked) lockedNudge();
        else example.open(/** @type {HTMLElement} */ (b));
        break;
      case 'form':
        s.form = s.form === 1 ? 2 : 1;
        refresh();
        emitChange();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey = ['1', '2', '3', 'r', 'R', 'e', 'E', 'Home', 'ArrowRight'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) chooseCond(CONDITION_IDS[Number(k) - 1]);
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'e' || k === 'E') example.open(null);
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  setup(s.cond);
  fitCamera();
  jumpTo(o.phase, o.at);
  if (o.hold && s.phase === 'run') s.held = true;
  controls.enableRotate = controls.enableZoom = s.view === '3d';
  fitCamera();
  syncUI();
  refresh();
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
    getState: snapshot,
    /**
     * Change any of: cond ('book' | 'oiled' | 'worn'), phase ('idle' | 'run' | 'done', with `at` in s for 'run'),
     * hold (true: keep a part-way run still), run ({ P, t, m, h }: the example's numbers on the machine, at rest),
     * tap (true: the big button), home (true), term ('input' | 'work' | 'waste': light it), form (1 | 2),
     * example ({ open, P, t, m, h }), view ('front' | '3d'), camera ({ position: [x, y, z], target: [x, y, z] } in m, for
     * close-up pictures).
     */
    async set(p = {}) {
      if (s.mode !== 'quiz') {
        if (p.view) setView(p.view);
        if (Array.isArray(p.camera?.position) && Array.isArray(p.camera?.target)) {
          s.userMovedCamera = true;
          camera.position.fromArray(p.camera.position);
          controls.target.fromArray(p.camera.target);
          controls.update();
        }
        if (p.cond) chooseCond(p.cond);
        if (p.run) {
          const r = solve({ ...BOOK, ...p.run });
          if (r.possible) {
            setup('custom', { ...BOOK, ...p.run });
            jumpTo('idle');
          }
        }
        if (p.phase) {
          s.taken = 0;
          jumpTo(p.phase, p.at);
        }
        if (p.hold != null) s.held = Boolean(p.hold) && s.phase === 'run';
        if (p.home) goHome();
        if (p.form === 1 || p.form === 2) s.form = p.form;
        if (p.term) lightTerm(p.term);
        if (p.example) {
          example.set(p.example);
          if (p.example.open === true) example.open(null);
          if (p.example.open === false) example.close();
        }
        if (p.tap) {
          lastTap = Number.NEGATIVE_INFINITY;
          doAction();
        }
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      example.close();
      example.set(BOOK);
      s.found = { book: false, oiled: false, worn: false };
      s.view = 'front';
      s.userMovedCamera = false;
      s.cond = 'book';
      controls.enableRotate = controls.enableZoom = false;
      goHome();
      syncUI();
      refresh();
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
    /** The winch with the load lifted (the book's result), whatever the moment: no site, no effects. */
    exportRoot() {
      const now = machine.height;
      machine.set(s.run.h, s.run.h);
      const copy = machine.root.clone(true);
      copy.name = 'EfficiencyWinch';
      machine.set(now, s.run.h);
      return copy;
    },
  };
}
