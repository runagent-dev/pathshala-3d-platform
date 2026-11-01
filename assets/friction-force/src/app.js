// Friction (book pages 88–89, topic 3.9), student view. A wooden block lies on a table. One tap pushes it: a push rod
// leans on it, the push grows (first a gentle push that is held, then harder) and the table holds it back with a force
// exactly as big, the other way round. Only when the push reaches the most the table can hold does the block start to
// slide. The student then pushes from the other side (friction turns round too), puts a weight on the block (it takes
// a bigger push to move it: friction grew), zooms in on the touching place (both surfaces are rough, and their teeth
// lock; more weight, deeper), and rubs the block to and fro (the surfaces get hot). Then a short test.
//
// The panel is the kit's clean sheet: the weights as one row of words (the push that moved the block under each once
// found), one big numbered action (the same numbered ring is on the block: tap either), one result line that says
// what you see right now, one short rule. Plain words first; the symbols F and f only after the first push.
// Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createVector } from './arrow.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { COLORS, DIM, createRig } from './scene.js';
import { createLens } from './micro.js';
import { LOADS, MAX_LOAD, RUB, biteOf, capacity, clamp, pushAt, round, rubAt, warm, weightOf } from './physics.js';

export const DEFAULTS = {
  load: 0, // weights on the block (0…2)
  side: 'left', // the push rod: 'left' pushes the block to the right, 'right' to the left
  at: '', // s after the push began: start with the push already going (for pictures)
  rub: '', // s after the rubbing began: start rubbing already
  hold: '', // N: hold a push of this size, the block at rest (for pictures)
  lens: true, // the zoom-in is open
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the block pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const K_ARROW = 0.052; // m of arrow per newton (the push and the friction share it)
const Y_PUSH = DIM.block.h + 0.3; // the pull arrow above the crate, clear of the weights on it
const Z_PUSH = DIM.block.d / 2 + 0.12; // in front of the pad
const Y_FRIC = 0.035; // the friction arrow lies on the table at the block's front
const Z_FRIC = DIM.block.d / 2 + 0.12;
const SHEAR_PER_M = 8; // teeth units the block's teeth move per metre it slides (the lens is far bigger than life)
const DOUBLE_TAP = 450; // ms: a second tap this soon after one is ignored
const FRONT = new THREE.Vector3(0, 0.22, 1).normalize();
const OBLIQUE = new THREE.Vector3(-0.5, 0.42, 0.75).normalize();
const XP = new THREE.Vector3(1, 0, 0);
const XN = new THREE.Vector3(-1, 0, 0);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const plain = (x) => String(+Number(x).toFixed(1)); // numbers in sentences: one decimal, no trailing zero

  root.classList.add('pvc', 'ff');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'loads', results: true, items: LOADS.map((l) => ({ id: `w${l}`, label: l ? 'chip_w' : 'chip_w0' })) },
      quiet: [
        { act: 'pause', label: 'act_pause', icon: ICONS.pause },
        { act: 'side', label: 'act_side', icon: ICONS.drag },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      lines: { action: 2, outcome: 2, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  // the reading box: rope tension and friction with their values, the result line (what the scene shows now), and the
  // switch for the enlarged contact with its note (not to scale), so nothing but labels sits on the 3D view
  const outcomeEl = ui.$('.pvc-outcome');
  const live = document.createElement('section');
  live.className = 'ff-live';
  live.innerHTML = `<div class="ff-live-values"><div class="ff-force pull"><span class="ff-dir" aria-hidden="true"></span><span>${t('pull_force')}</span><b></b></div><div class="ff-force friction"><span class="ff-dir" aria-hidden="true"></span><span>${t('l_fric')}</span><b></b></div></div><div class="ff-lens-row"><button type="button" data-act="lens-toggle" aria-pressed="false"><span class="ff-check" aria-hidden="true"></span>${t('inside_view')}</button><span class="ff-lens-note">${t('lens_note')}</span></div>`;
  outcomeEl.after(live);
  live.querySelector('.ff-live-values').after(outcomeEl);
  const liveEls = {
    pullDir: live.querySelector('.ff-force.pull .ff-dir'),
    pullVal: live.querySelector('.ff-force.pull b'),
    fricDir: live.querySelector('.ff-force.friction .ff-dir'),
    fricVal: live.querySelector('.ff-force.friction b'),
    lensBtn: live.querySelector('[data-act="lens-toggle"]'),
    note: live.querySelector('.ff-lens-note'),
  };

  for (const l of LOADS.filter(Boolean)) ui.$(`[data-example="w${l}"] .pvc-ex-word`).textContent = t('chip_w', { n: l });

  // ── 3D ──────────────────────────────────────────────────────────────────────
  // a softer studio fill than the default, so the shadows on the floor show
  const stage = createStage(ui.canvasHost, { fov: 32, near: 0.02, far: 40, environment: 'studio-light', environmentIntensity: 0.4 });
  const { camera, controls, scene } = stage;
  // the store room's light: daylight from the high windows behind (it casts the shadows, forward onto the floor
  // where they are seen), the sky's fill, and a warm lamp from the front left on the faces turned to the student
  scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x5a5146, 0.65));
  const mainLight = new THREE.DirectionalLight(0xfff4e2, 2.2);
  mainLight.position.set(-2.2, 5, -2.6);
  scene.add(mainLight, mainLight.target);
  const lamp = new THREE.DirectionalLight(0xffe2c0, 1.3);
  lamp.position.set(-3, 4, 4);
  scene.add(lamp);

  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  // turning stays in front of the wall and above the floor, and zooming stays inside the room
  Object.assign(controls, { minAzimuthAngle: -1.15, maxAzimuthAngle: 1.15, minPolarAngle: 0.4, maxPolarAngle: 1.5, minDistance: 2, maxDistance: 18 });
  ui.canvasHost.setAttribute('role', 'img');
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const aniso = Math.min(8, stage.renderer.capabilities.getMaxAnisotropy());
  const rig = createRig({ t, aniso });
  scene.add(rig.root);
  scene.background = o.bg === 'transparent' ? null : rig.background;
  if (o.bg === 'transparent') rig.room.visible = false; // only the crate, the floor and the people on a transparent page
  const arrows = {
    push: createVector(COLORS.push, 'PullForce'),
    fric: createVector(COLORS.friction, 'FrictionForce'),
  };
  for (const a of Object.values(arrows)) {
    a.root.userData.noExport = true;
    scene.add(a.root);
  }
  const lens = createLens({ stage, t });

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // Soft shadows on the floor only (the one surface where they are seen), from the crate, the weights and the people.
  // The shadow camera is fitted round where they stand and where their shadows fall, so a 1024 × 1024 PCF map is
  // as crisp as a much larger one on a loose box. Small parts (ropes, laces, labels, arrows) cast none.
  // The daylight casts them, so a shadow is a real absence of its light.
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);
    mainLight.shadow.radius = 3;
    mainLight.shadow.bias = -0.0004;
    mainLight.shadow.normalBias = 0.01;
    fitShadow(mainLight, new THREE.Box3(new THREE.Vector3(-2.8, 0, -0.5), new THREE.Vector3(3.6, 1.85, 2.4)));
    rig.table.traverse((m) => {
      if (m instanceof THREE.Mesh) m.receiveShadow = true;
    });
    rig.room.traverse((m) => {
      if (m instanceof THREE.Mesh) m.castShadow = m.receiveShadow = false;
    });
    for (const g of [rig.block, ...rig.weights, rig.pushers[1], rig.pushers[-1]])
      g.traverse((m) => {
        if (!(m instanceof THREE.Mesh)) return;
        const solid = m.material && !m.material.transparent && m.material.visible !== false; // labels are transparent
        m.castShadow = solid && !['TensionRope', 'RopeGrip', 'Strap'].includes(m.name);
      });
  }
  /** Fits a directional light's shadow camera tightly round a world box (seen from the light). */
  function fitShadow(light, worldBox) {
    const cam = light.shadow.camera;
    light.updateMatrixWorld();
    light.target.updateMatrixWorld();
    cam.position.copy(light.position);
    cam.lookAt(light.target.position);
    cam.updateMatrixWorld();
    const inv = cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    const b = new THREE.Box3();
    const p = new THREE.Vector3();
    for (const x of [worldBox.min.x, worldBox.max.x])
      for (const y of [worldBox.min.y, worldBox.max.y])
        for (const z of [worldBox.min.z, worldBox.max.z]) b.expandByPoint(p.set(x, y, z).applyMatrix4(inv));
    Object.assign(cam, { left: b.min.x, right: b.max.x, bottom: b.min.y, top: b.max.y, near: Math.max(0.05, -b.max.z - 0.1), far: -b.min.z + 0.1 });
    cam.updateProjectionMatrix();
  }

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => action?.ringBox(), () => (s.lensK > 0.05 ? lens.box : null)],
  });
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    pausedAt: null,
    load: clamp(Math.round(Number(o.load) || 0), 0, MAX_LOAD), // weights on the block
    side: o.side === 'right' ? -1 : 1, // +1: pull rightward (legacy side=left)
    x: 0, // where the block waits (m); during a push or a rub the run says where it is
    drop: 0, // m the last weight is still above its place (it is lowered when put on)
    moving: false, // the block is gliding back to the middle
    lensDir: 0, // the last change of weights while the zoom-in is open: +1 more, −1 less, 0 none yet
    numbers: false, // the test shows the push's size on its arrow
    frozen: null, // the big button keeps its words while a push or a rub runs
    bite: 0, // how deep the teeth have sunk (follows the weights)
    shear: 0, // how far the block's teeth have leant or slid, in the lens's units (follows the run)
    run: null, // { t0, load, side, slipped, quiet }
    rub: null, // { t0, load, loop, quiet }
    hold: null, // { F, side }: a test scene holds a push of F newtons without a run
    heat: 0, // 0…1: how warm the touching surfaces are
    hideHeat: false, // the test keeps the glow back until the answer
    show: { push: true, fric: true }, // the arrows the scene shows (the test hides friction until the answer)
    lens: Boolean(o.lens),
    lensK: o.lens ? 1 : 0, // how far the zoom-in has opened (0…1)
    found: [null, null, null], // the push (N) at which the block moved, for 0, 1, 2 weights
    sides: new Set(), // the sides it has been pushed from
    seen: { push: false, load: false, lens: false, rub: false },
    topic: 'start', // which rule line shows
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
  };
  s.bite = biteOf(s.load);
  const now = () => s.pausedAt ?? performance.now();
  function setPaused(value) {
    if (value && s.pausedAt == null) s.pausedAt = performance.now();
    else if (!value && s.pausedAt != null) {
      const delta = performance.now() - s.pausedAt;
      if (s.run) s.run.t0 += delta;
      if (s.rub) s.rub.t0 += delta;
      s.pausedAt = null;
    }
    refresh(true);
    stage.invalidate();
  }
  let token = 0; // bumped by anything that calls off what is pending
  let lastAct = Number.NEGATIVE_INFINITY;

  /** What is happening now, from the state and the clock: where everything is and how hard everyone pushes. */
  function model() {
    const T = now();
    if (s.rub) {
      let tt = (T - s.rub.t0) / 1000;
      if (s.rub.loop && tt >= RUB.time) {
        s.rub.t0 = T;
        tt = 0;
      }
      const r = rubAt(tt, s.rub.load);
      const on = r.phase === 'rub';
      return {
        kind: 'rub',
        phase: r.phase,
        x: r.x,
        padX: r.x,
        F: r.F,
        f: r.f,
        dir: r.dir,
        pads: { 1: true, '-1': true },
        press: 1,
        rubbing: on,
        shear: r.x * SHEAR_PER_M,
        limit: r.limit,
        slipped: on,
      };
    }
    if (s.run) {
      const tt = (T - s.run.t0) / 1000;
      const p = pushAt(tt, s.run.load);
      const dir = s.run.side;
      const slid = p.phase === 'slip' || p.phase === 'coast' || p.phase === 'done';
      return {
        kind: 'push',
        phase: p.phase,
        x: dir * p.slide,
        padX: dir * p.padX,
        F: p.F,
        f: p.f,
        dir,
        pads: { [dir]: true, [-dir]: false },
        press: p.phase === 'coast' || p.phase === 'done' ? 0 : clamp(p.F / 0.8, 0, 1),
        rubbing: false,
        shear: slid ? dir * p.slide * SHEAR_PER_M : dir * 0.05 * (p.F / p.limit),
        limit: p.limit,
        slipped: slid,
      };
    }
    if (s.hold) {
      return {
        kind: 'hold',
        phase: 'hold',
        x: 0,
        padX: 0,
        F: s.hold.F,
        f: s.hold.F,
        dir: s.hold.side,
        pads: { [s.hold.side]: true, [-s.hold.side]: false },
        press: 1,
        rubbing: false,
        shear: s.hold.side * 0.05 * (s.hold.F / capacity(s.load)),
        limit: capacity(s.load),
        slipped: false,
      };
    }
    return {
      kind: 'idle',
      phase: 'rest',
      x: s.x,
      padX: s.x,
      F: 0,
      f: 0,
      dir: s.side,
      pads: { [s.side]: true, [-s.side]: false },
      press: 0,
      rubbing: false,
      shear: 0,
      limit: capacity(s.load),
      slipped: false,
    };
  }

  // ── what the student is shown, from that one model ──────────────────────────
  const busy = (m) => (m.kind === 'push' && m.phase !== 'done') || (m.kind === 'rub' && m.phase !== 'done') || Boolean(s.moving);

  /** The result line: what the student sees right now, one number. [key, vars, kind] */
  function outcomeOf(m) {
    if (m.kind === 'rub') {
      if (m.phase === 'rub') return s.heat >= 0.25 ? ['out_rub_hot', {}, 'hot'] : ['out_rub', {}, 'rub'];
    } else if (m.kind === 'push') {
      if (m.phase === 'rise' && m.F < 0.05) return ['out_rest', {}, 'rest'];
      if (!m.slipped) return ['out_hold', { f: plain(m.F) }, 'push'];
      const first = s.found[0];
      const more = s.run.load > 0 && first != null && m.limit > first;
      return [more ? 'out_slip_more' : 'out_slip', { f: plain(m.limit) }, 'push'];
    } else if (m.kind === 'hold') return ['out_hold', { f: plain(m.F) }, 'push'];
    if (s.heat >= 0.3 && !s.hideHeat) return ['out_hot', {}, 'hot'];
    if (s.lens && s.lensK > 0.5) {
      // the first look says what is there and asks for the comparison; the comparison line comes once the student changes the weights
      if (s.lensDir > 0) return ['out_lens_more', {}, 'lens'];
      if (s.lensDir < 0) return ['out_lens_less', {}, 'lens'];
      return ['out_lens', {}, 'lens'];
    }
    return ['out_rest', {}, 'rest'];
  }
  const ruleKey = () => `rule_${s.topic}`;

  /** The one thing the big button does next, from what the student has found. */
  function plan() {
    if (!s.seen.push) return { step: 1, label: 'act_push', kind: 'push' };
    if (s.sides.size < 2) return { step: 2, label: 'act_other', kind: 'other' };
    if (!s.seen.load) return { step: 3, label: 'act_weight', kind: 'weight' };
    if (!s.seen.lens) return { step: 4, label: 'act_lens', kind: 'lens' };
    if (!s.seen.rub) return { step: 5, label: 'act_rub', kind: 'rub' };
    return { step: '', label: 'act_again', kind: 'again' };
  }

  let lastPanel = '';
  let lastLive = '';
  function refresh(force = false) {
    updateLive();
    const m = model();
    const [key, vars, kind] = outcomeOf(m);
    if (busy(m)) s.frozen ||= plan();
    else s.frozen = null;
    const p = s.frozen || plan();
    const next = p.kind === 'weight' && s.load === 0 ? 'w1' : null;
    const panelKey = JSON.stringify([key, vars, s.load, s.found, s.topic, p.kind, busy(m), s.mode, s.locked, s.side, s.seen]);
    if (!force && panelKey === lastPanel) return;
    lastPanel = panelKey;
    sheet.choose(`w${s.load}`);
    for (const l of LOADS) sheet.result(`w${l}`, s.found[l] == null ? '' : t('res_move', { f: plain(s.found[l]) }));
    sheet.next(next);
    sheet.outcome(t(key, vars));
    if (outcomeEl.dataset.k !== kind) outcomeEl.dataset.k = kind;
    sheet.rule(t(ruleKey()));
    if (action) {
      action.set({ step: p.step, label: p.label });
      if (!busy(m) && m.F < 0.01) action.show('run');
      else action.hide('run');
    }
    stage.invalidate();
  }

  const pauseBtn = ui.$('[data-act="pause"]');
  /** The values in the reading box and the pause and contact switches: the DOM is written only when they change. */
  function updateLive() {
    const m = model();
    const key = `${m.dir}|${plain(m.F)}|${plain(m.f)}|${s.pausedAt != null}|${Boolean(s.run || s.rub)}|${s.lens}`;
    if (key === lastLive) return;
    lastLive = key;
    liveEls.pullDir.textContent = m.dir > 0 ? '→' : '←';
    liveEls.fricDir.textContent = m.dir > 0 ? '←' : '→';
    liveEls.pullVal.textContent = t('force_number', { f: plain(m.F) });
    liveEls.fricVal.textContent = t('force_number', { f: plain(m.f) });
    pauseBtn.disabled = !s.run && !s.rub;
    const pauseWord = t(s.pausedAt != null ? 'act_resume' : 'act_pause');
    pauseBtn.innerHTML = `${s.pausedAt != null ? ICONS.play : ICONS.pause}<span>${pauseWord}</span>`;
    pauseBtn.setAttribute('aria-label', pauseWord);
    pauseBtn.title = pauseWord;
    liveEls.lensBtn.setAttribute('aria-pressed', String(s.lens));
    liveEls.note.classList.toggle('off', !s.lens);
  }

  // ── placing everything each frame ───────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const project = (p) => {
    tmp.copy(p).project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * stage.width, y: (-tmp.y * 0.5 + 0.5) * stage.height, ok: tmp.z < 1 };
  };
  const contactPoint = new THREE.Vector3();
  const tailF = new THREE.Vector3();
  const tailf = new THREE.Vector3();
  const { w: BW, d: BD } = DIM.block;

  function placeArrows(m) {
    const d = m.dir;
    // Applied tension above the crate; friction on its contact with the floor.
    if (m.F > 0.04 && s.show.push) {
      const L = m.F * K_ARROW;
      tailF.set(m.x - (d * L) / 2, Y_PUSH, Z_PUSH);
      arrows.push.set(tailF, d > 0 ? XP : XN, L);
    } else arrows.push.hide();
    if (m.f > 0.04 && s.show.fric) {
      const L = m.f * K_ARROW;
      tailf.set(m.x + d * (BW / 2), Y_FRIC, Z_FRIC);
      arrows.fric.set(tailf, d > 0 ? XN : XP, L);
    } else arrows.fric.hide();
  }

  const grid = (ys, xs) => ys.flatMap((dy) => xs.map((dx) => ({ dx, dy })));
  const pushSpots = (side) => grid([-28, -48, -68, -88], [0, side * 25, -side * 25, side * 55, -side * 55, side * 90]);
  // friction's label: first beside the tail, outside the crate (above it, it would cover the crate's 2 kg)
  const fricSpots = (side) => [
    { dx: side * 58, dy: -6 },
    { dx: side * 62, dy: 20 },
    ...grid([28, 48, 68, -28], [0, side * 25, -side * 25, side * 55, -side * 55]),
  ];
  let labelSide = 0;
  let labelWording = '';
  function labelsFor(m) {
    const sym = s.seen.push; // the symbols F and f only once the student has seen the push and the friction
    const side = m.dir > 0 ? 1 : -1;
    const on = (id, show, opts) => {
      if (show && !anno.has(id)) anno.add(id, opts);
      else if (!show && anno.has(id)) anno.remove(id);
    };
    const pushText = () => (s.numbers ? t('l_push_n', { f: plain(s.hold?.F ?? m.F) }) : t(sym ? 'l_push_f' : 'l_push'));
    on('push', arrows.push.root.visible, {
      text: pushText(),
      kind: 'callout',
      color: '#a64b08',
      point: () => tailF,
      spots: pushSpots(side),
      optional: true,
    });
    on('fric', arrows.fric.root.visible, {
      text: t(sym ? 'l_fric_f' : 'l_fric'),
      kind: 'callout',
      color: '#b31e4e',
      point: () => tailf,
      spots: fricSpots(side),
      optional: true,
    });
    // the words follow what the student has seen; the places follow the direction (it turns round in the rub)
    const wording = `${sym}|${s.numbers ? plain(s.hold?.F ?? m.F) : ''}`;
    if (side !== labelSide || wording !== labelWording) {
      if (anno.has('push')) anno.update('push', { text: pushText(), spots: pushSpots(side) });
      if (anno.has('fric')) anno.update('fric', { text: t(sym ? 'l_fric_f' : 'l_fric'), spots: fricSpots(side) });
    }
    labelSide = side;
    labelWording = wording;
  }

  /** The enlarged contact window along the bottom of the view (its note, "not to scale", is in the panel). */
  function lensHeight() {
    return Math.min(160, Math.max(78, stage.height * 0.3));
  }
  let lensKey = '';
  /** Places the window for this frame; true when it moved or changed size (after a resize, a camera move). */
  function placeLens(m) {
    const k = s.lensK;
    contactPoint.set(m.x, 0, BD / 2);
    if (k <= 0.01) {
      lens.place({ cx: 0, cy: 0, d: 100, from: { x: 0, y: 0 }, k: 0 });
      const changed = lensKey !== 'off';
      lensKey = 'off';
      return changed;
    }
    camera.updateMatrixWorld();
    // a wide strip, but never wider than the enlarged surfaces (about 4.6 × its height): centred on wide frames
    const h = lensHeight(),
      from = project(contactPoint),
      w = Math.min(stage.width - 24, Math.round(h * 4.6));
    const cx = stage.width / 2,
      cy = stage.height - 12 - h / 2;
    lens.place({ cx, cy, w, h, from, k });
    lens.set({ bite: s.bite, shear: s.shear, weight: weightOf(s.load), heat: s.hideHeat ? 0 : s.heat, labels: h >= 96, time: now() / 1000 });
    const key = `${w}|${h}|${Math.round(from.x)}|${Math.round(from.y)}|${k}`;
    const changed = key !== lensKey;
    lensKey = key;
    return changed;
  }

  let placedOnce = false;
  function step(dt) {
    if (s.pausedAt != null) dt = 0;
    const m = model();
    // the moment the block gives way
    if (m.kind === 'push' && m.slipped && !s.run.slipped) {
      s.run.slipped = true;
      if (!s.run.quiet && s.mode !== 'quiz') foundIt(s.run);
    }
    // warming while it is rubbed
    const rubbing = m.rubbing && !s.hideHeat;
    const h0 = s.heat;
    if (!s.hideHeat) s.heat = warm(s.heat, rubbing, dt);
    // the teeth follow the weights and the push
    const bite = biteOf(s.load);
    const db = bite - s.bite;
    if (Math.abs(db) > 0.002) s.bite += db * (1 - Math.exp(-dt * 8));
    else s.bite = bite;
    const ds = m.shear - s.shear;
    s.shear = Math.abs(ds) > 0.002 ? s.shear + ds * (1 - Math.exp(-dt * 22)) : m.shear;

    rig.placeBlock(m.x);
    rig.placeWeights(s.load, s.drop, m.x);
    for (const sd of [1, -1])
      rig.placePusher(sd, m.padX, m.dir === sd && m.F > 0 ? clamp(m.F / m.limit, 0, 1) : 0, Boolean(m.pads[sd]), m.kind === 'rub');
    placeArrows(m);
    rig.setHeat(s.hideHeat ? 0 : s.heat, -RUB.amplitude, RUB.amplitude);
    const lensMoved = placeLens(m);
    labelsFor(m);
    refresh();
    if (m.kind === 'push' && m.phase === 'done' && s.run && !s.run.ended) {
      s.run.ended = true;
      emitChange();
    }
    if (m.kind === 'rub' && m.phase === 'done' && !s.rub.loop && !s.rub.ended) {
      s.rub.ended = true;
      emitChange();
    }
    // draw again only while something moves (a held pull is a still scene), and once whenever the placing changed
    // what is drawn: the first frame, the window after a resize
    const first = !placedOnce;
    placedOnce = true;
    return (
      first || lensMoved || busy(m) || s.heat !== h0 || Math.abs(db) > 0.002 || Math.abs(ds) > 0.002 || (s.lensK > 0 && s.lensK < 1) || s.drop > 0
    );
  }
  stage.addTicker(step);

  /** The block gave way at the table's most: what the student has found, and which rule line to show. */
  function foundIt(run) {
    const load = run.load;
    const before = s.sides.size;
    s.found[load] = capacity(load);
    s.sides.add(run.side);
    const fresh = [];
    if (!s.seen.push) fresh.push('push');
    if (before === 1 && s.sides.size === 2) fresh.push('side');
    if (load > 0 && !s.seen.load) {
      s.seen.load = true;
      fresh.push('load');
    }
    s.seen.push = true;
    if (fresh.length) s.topic = fresh[0];
    audio.pop();
    emit('slip', { load, side: s.side > 0 ? 'left' : 'right', push: capacity(load) });
    refresh(true);
    emitChange();
  }

  // ── doing things ────────────────────────────────────────────────────────────

  /** Block back to the middle, nothing running (the pushes and rubs are called off). Resolves true if nothing else came first. */
  async function goHome({ animate = true, own = true } = {}) {
    const my = own ? ++token : token;
    setPaused(false);
    const m = model();
    s.x = m.x;
    s.run = null;
    s.rub = null;
    s.hold = null;
    tweener.cancel('home');
    if (!animate || Math.abs(s.x) < 0.002) {
      s.x = 0;
      s.moving = false;
      refresh(true);
      stage.invalidate();
      return true;
    }
    s.moving = true;
    refresh(true);
    const x0 = s.x;
    const done = await tweener.animate({ key: 'home', duration: 0.4, ease: ease.inOutCubic, onUpdate: (k) => (s.x = x0 * (1 - k)) }).finished;
    if (!done || my !== token) return false; // another call took over (it looks after s.moving)
    s.moving = false;
    s.x = 0;
    refresh(true);
    return true;
  }

  /** One push: the block waits in the middle, the rod leans on it, the push grows until the block gives way. */
  async function push({ quiet = false, force = false, at = null, side = s.side } = {}) {
    if (s.locked && !force) return lockedNudge();
    if (!force && now() - lastAct < DOUBLE_TAP) return;
    if (!force && busy(model())) return hintBusy();
    setPaused(false);
    lastAct = now();
    hintOff();
    const my = ++token;
    s.side = side;
    if (s.run || s.rub || s.hold || Math.abs(s.x) > 0.002) {
      if (!(await goHome({ animate: at == null, own: false })) || my !== token) return;
    }
    if (s.locked && !force) return;
    s.run = { t0: now() - (at ?? 0) * 1000, load: s.load, side: s.side, slipped: false, quiet, ended: false };
    flyTo(viewPose(), 0);
    if (!quiet) audio.tick?.();
    emit('push', { load: s.load, side: s.side > 0 ? 'left' : 'right' });
    refresh(true);
    stage.invalidate();
  }

  /** The block is moved to and fro: friction always against the motion, and the surfaces warm up. */
  async function rubIt({ quiet = false, force = false, at = null, hideHeat = false, loop = false } = {}) {
    if (s.locked && !force) return lockedNudge();
    if (!force && now() - lastAct < DOUBLE_TAP) return;
    if (!force && busy(model())) return hintBusy();
    setPaused(false);
    lastAct = now();
    hintOff();
    const my = ++token;
    if (s.run || s.rub || s.hold || Math.abs(s.x) > 0.002) {
      if (!(await goHome({ animate: at == null, own: false })) || my !== token) return;
    }
    s.hideHeat = hideHeat;
    s.rub = { t0: now() - (at ?? 0) * 1000, load: s.load, loop, quiet, ended: false };
    flyTo(viewPose(), 0);
    if (!quiet && s.mode !== 'quiz') {
      s.seen.rub = true;
      s.topic = 'rub';
      emit('rub', { load: s.load });
    }
    refresh(true);
    emitChange();
    stage.invalidate();
  }

  /** Weights on the block: 0…2. A weight put on is lowered onto it. */
  async function setLoad(l, { animate = true } = {}) {
    const to = clamp(Math.round(l), 0, MAX_LOAD);
    if (s.locked) return lockedNudge();
    if (to === s.load) return;
    ++token;
    const up = to > s.load;
    s.load = to;
    if (s.lens) s.lensDir = up ? 1 : -1; // the zoom-in is open: the comparison is there to see
    await goHome({ animate: false, own: false });
    refresh(true);
    tweener.cancel('drop');
    if (up && animate) {
      s.drop = 0.16;
      audio.contact?.();
      await tweener.animate({ key: 'drop', duration: 0.4, ease: ease.outCubic, onUpdate: (k) => (s.drop = 0.16 * (1 - k)) }).finished;
      s.drop = 0;
    } else s.drop = 0;
    emit('load', { load: to });
    refresh(true);
    emitChange();
    stage.invalidate();
  }

  function setSide(side) {
    const d = side === 'right' || side === -1 ? -1 : 1;
    if (s.locked) return lockedNudge();
    if (d === s.side && !s.run && !s.rub) return;
    ++token;
    s.side = d;
    goHome({ animate: false, own: false });
    flyTo(viewPose(), 0);
    emit('side', { side: d > 0 ? 'left' : 'right' });
    refresh(true);
    emitChange();
  }

  function openLens({ animate = true } = {}) {
    if (!s.lens) {
      s.lens = true;
      s.lensDir = 0;
      emit('lens', { open: true });
      flyTo(viewPose(), animate ? 0.6 : 0); // the view makes room under the table for the window
    }
    tweener.cancel('lens');
    if (!animate) {
      s.lensK = 1;
      stage.invalidate();
      return Promise.resolve();
    }
    const k0 = s.lensK;
    return tweener.animate({ key: 'lens', duration: 0.5, ease: ease.outCubic, onUpdate: (k) => (s.lensK = k0 + (1 - k0) * k) }).finished.then(() => {
      s.lensK = 1;
    });
  }
  function closeLens() {
    s.lens = false;
    s.lensK = 0;
    tweener.cancel('lens');
    flyTo(viewPose(), 0);
    stage.invalidate();
  }

  /** The big button, the ring on the block, a tap on the block, Space or Enter: the next step. */
  async function doAction() {
    if (s.locked) return lockedNudge();
    if (busy(model())) return hintBusy(); // the button stays pressable while it runs: it says so
    const p = plan();
    if (p.kind === 'lens') {
      if (now() - lastAct < DOUBLE_TAP) return;
      lastAct = now();
      await goHome({ animate: true });
      s.seen.lens = true;
      s.topic = 'lens';
      await openLens();
      refresh(true);
      emitChange();
      return;
    }
    if (p.kind === 'rub') return rubIt();
    if (p.kind === 'again') s.topic = 'all';
    if (p.kind === 'other') {
      if (now() - lastAct < DOUBLE_TAP) return;
      return push({ side: s.sides.has(1) ? -1 : 1 }); // the side not tried yet
    }
    if (p.kind === 'weight' && s.load === 0) {
      if (now() - lastAct < DOUBLE_TAP) return;
      lastAct = now() + 500; // the weight takes 0.4 s to land; a second tap meanwhile is ignored
      await setLoad(1);
      lastAct = Number.NEGATIVE_INFINITY;
      return push();
    }
    return push();
  }

  // the big button in the panel and the numbered ring on the block (taps on the ring go through to the block)
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_push',
    target: () => (plan().kind === 'lens' ? contactPoint : rig.body),
    radius: 26,
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes(), () => (s.lensK > 0.05 ? lens.box : null)],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  function viewPose(view = s.view) {
    const both = Boolean(s.rub),
      d = s.side;
    box.min.set(both ? -2.05 : d > 0 ? -0.9 : -2.05, -0.14, -0.4);
    box.max.set(both ? 2.05 : d > 0 ? 2.05 : 0.9, 1.72, 0.7);
    const bottom = s.lens ? lensHeight() + 34 : 42;
    return fitPose({
      box,
      dir: view === '3d' ? OBLIQUE : FRONT,
      camera,
      width: stage.width,
      height: stage.height,
      margin: { top: Math.min(50, stage.height * 0.21), bottom, side: 8 },
    });
  }
  function flyTo({ position, target }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
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
    controls.enableRotate = controls.enableZoom = !s.locked; // the test keeps the view still
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    turning = true;
  });
  // the view starts from the front; a drag turns it (the camera really moves: a tap never does), and then the "front"
  // button appears to come back
  let turning = false;
  controls.addEventListener('end', () => {
    turning = false;
  });
  controls.addEventListener('change', () => {
    if (!turning || s.view === '3d') return;
    s.view = '3d';
    syncUI();
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    lastPanel = '';
    // place everything for the new size now: the stage draws at once after a resize (no blank frame), and the
    // contact window has to be drawn where it now goes
    step(0);
    refresh(true);
  });

  // ── touching the scene: the block, a weight or the rod does the action ─────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const list = [rig.hit, ...rig.weights.filter((wt) => wt.visible), ...[1, -1].map((sd) => rig.pushers[sd]).filter((g) => g.visible)];
    return raycaster.intersectObjects(list, true).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (busy(model())) {
        if (now() - lastAct > DOUBLE_TAP) hintBusy();
        return;
      }
      doAction();
    },
    true,
  );

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 2600 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hintOff, duration);
  }
  function hintOff() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }
  const hintBusy = () => showHint(t('hint_wait'));
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 2400 });
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
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  const item = (key, vars) => ({ key, text: t(key, vars) });
  /** Four tap choices (the right one first in `items`): shuffled, with the index of the right one. */
  function textChoices(items, kind, extra = {}) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ff-opt">${list[j].text}</span>`,
      meta: { kind, answer: items[0].key, ...extra },
    };
  }
  let kinds = [];
  let question = null;
  let picked = -1;
  let learnSaved = null;

  /** A clean scene for a question: nothing running, nothing left from before, the front view. */
  async function cleanScene({ load = 0, side = 1, F = null, showPush = true, showFric = false, lensOn = false, numbers = false } = {}) {
    ++token;
    tweener.cancel('home');
    tweener.cancel('drop');
    s.run = null;
    s.rub = null;
    s.moving = false;
    s.x = 0;
    s.drop = 0;
    s.load = load;
    s.bite = biteOf(load);
    s.side = side;
    s.hold = F != null ? { F, side } : null;
    s.heat = 0;
    s.hideHeat = false;
    s.show = { push: showPush, fric: showFric };
    s.numbers = numbers;
    s.lensDir = 0;
    s.lens = lensOn;
    s.lensK = lensOn ? 1 : 0;
    anno.clear();
    if (s.view !== 'front') await setView('front', { animate: false });
    else await flyTo(viewPose(), 0);
    refresh(true);
    stage.invalidate();
  }
  const dirWord = (d) => (d > 0 ? 'dir_right' : 'dir_left'); // a push to the right (rod on the left): friction points left

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
        learnSaved = { load: s.load, side: s.side, lens: s.lens, lensK: s.lensK, x: s.x };
        setPaused(false);
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        kinds = shuffle(['dir', 'eq', 'wt', 'why', 'heat']);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        ++token;
        const saved = learnSaved || { load: 0, side: 1, lens: false, lensK: 0, x: 0 };
        s.run = null;
        s.rub = null;
        s.hold = null;
        s.moving = false;
        s.heat = 0;
        s.hideHeat = false;
        s.show = { push: true, fric: true };
        s.numbers = false;
        s.load = saved.load;
        s.bite = biteOf(s.load);
        s.side = saved.side;
        s.x = 0;
        s.drop = 0;
        s.lens = saved.lens;
        s.lensK = saved.lensK;
        flyTo(viewPose(), 0);
        anno.clear();
        syncUI();
        refresh(true);
        emitChange();
      },
      async prepare(i, alive, say) {
        const kind = kinds[i % kinds.length];
        picked = -1;
        const side = pickOne([1, -1]);
        if (kind === 'dir') {
          await cleanScene({ side, F: 5 });
          if (!alive()) return null;
          question = { kind, side };
          const correct = item(dirWord(-side));
          const items = [correct, item(dirWord(side)), item('dir_up'), item('dir_none')];
          return { text: t('q_dir'), ...textChoices(items, kind, { side }) };
        }
        if (kind === 'eq') {
          const F = pickOne([3, 4, 6, 7, 8]);
          await cleanScene({ side, F, numbers: true }); // the size of the push is on the arrow, nowhere else
          if (!alive()) return null;
          question = { kind, F };
          const n = (key, f) => ({ key, text: t('n_newton', { f }) });
          const items = [n('e_same', F), n('e_zero', 0), n('e_double', 2 * F), n('e_weight', weightOf(0))];
          return { text: t('q_eq'), ...textChoices(items, kind, { F }) };
        }
        if (kind === 'wt') {
          const load = pickOne([1, 2]);
          const F = 10; // a little over what moves the empty block (9.8 N): it slid at this push
          await cleanScene({ load, side, F, numbers: true });
          if (!alive()) return null;
          question = { kind, load, F };
          return {
            text: t('q_wt'),
            ...textChoices([item('w_stay'), item('w_same'), item('w_easy'), item('w_fast')], kind, { load }),
          };
        }
        if (kind === 'why') {
          const load = pickOne([0, 1, 2]);
          await cleanScene({ load, side, showPush: false, lensOn: true });
          if (!alive()) return null;
          question = { kind, load };
          return { text: t('q_why'), ...textChoices([item('y_lock'), item('y_glue'), item('y_magnet'), item('y_smooth')], kind, { load }) };
        }
        // heat: the block is rubbed to and fro; the glow waits for the answer
        await cleanScene({ load: pickOne([0, 1]), side, showPush: false });
        if (!alive()) return null;
        say(t('q_look'));
        await rubIt({ quiet: true, force: true, hideHeat: true, loop: true });
        question = { kind };
        return { text: t('q_heat'), ...textChoices([item('h_warm'), item('h_cold'), item('h_same'), item('h_slick')], kind) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        if (k === 'dir') {
          s.show.fric = true;
          return (
            t('why_dir', { dir: t(dirWord(-question.side)) }) +
            note({ dir_up: 'not_dir_up', dir_none: 'not_dir_none', [dirWord(question.side)]: 'not_dir_same' })
          );
        }
        if (k === 'eq') {
          s.show.fric = true;
          return t('why_eq', { f: question.F }) + note({ e_zero: 'not_zero', e_double: 'not_double', e_weight: 'not_weight' });
        }
        if (k === 'wt') {
          s.show.fric = true;
          s.numbers = false;
          s.hold = null;
          push({ quiet: true, force: true, side: s.side });
          return t('why_wt', { c: plain(capacity(question.load)) }) + note({ w_same: 'not_same', w_easy: 'not_easy', w_fast: 'not_fast' });
        }
        if (k === 'why') return t('why_why') + note({ y_glue: 'not_glue', y_magnet: 'not_magnet', y_smooth: 'not_smooth' });
        s.hideHeat = false;
        return t('why_heat') + note({ h_cold: 'not_cold', h_same: 'not_hsame', h_slick: 'not_slick' });
      },
      done() {
        s.locked = false;
        refresh(true);
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    if (!s.locked) controls.enableRotate = controls.enableZoom = true; // the test keeps the view still
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
    if (b.dataset.view && s.mode !== 'quiz') setView(b.dataset.view);
    if (b.dataset.example) setLoad(Number(b.dataset.example.slice(1)));
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'pause':
        if (s.mode !== 'quiz') setPaused(s.pausedAt == null);
        break;
      case 'lens-toggle':
        if (s.mode !== 'quiz') {
          if (s.lens) closeLens();
          else openLens();
        }
        break;
      case 'home':
        if (s.locked) lockedNudge();
        else goHome();
        break;
      case 'side':
        setSide(-s.side);
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
    const sceneKey = ['1', '2', '3', 'r', 'R', 'Home', 's', 'S', 'f', 'F', 'v', 'V'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) setLoad(Number(k) - 1);
    else if (k === 's' || k === 'S') setSide(-s.side);
    else if (k === ' ' || k === 'Enter') doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── snapshot, events ────────────────────────────────────────────────────────
  function snapshot() {
    const m = model();
    return {
      load: s.load, // weights on the block (0, 1 or 2; 1 kg each)
      side: s.side > 0 ? 'left' : 'right', // legacy direction alias: left = rightward pull, right = leftward pull
      phase: m.phase, // 'rest' | 'rise' | 'hold' | 'climb' | 'slip' (it speeds up) | 'coast' (the hand let go) | 'done' | 'rub'
      push: round(m.F, 1), // N: the push now
      friction: round(m.f, 1), // N: equal to the push while the block is at rest; once it slides it stays at `limit`
      limit: capacity(s.load), // N: the push at which the block starts to slide, with this many weights
      block: round(m.x, 3), // m the block has moved
      moved: { 0: s.found[0], 1: s.found[1], 2: s.found[2] }, // the push that moved it, per weights (null: not tried)
      lens: s.lens,
      heat: round(s.heat, 2),
      paused: s.pausedAt != null,
      view: s.view,
      mode: s.mode,
      next: plan().kind,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.load, snap.side, snap.phase, snap.moved, snap.lens, snap.view, snap.mode, snap.next, snap.paused]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── start ───────────────────────────────────────────────────────────────────
  setView(s.view, { animate: false });
  syncUI();
  if (o.lens) {
    s.seen.lens = true;
    s.lensK = 1;
  }
  if (s.load > 0) s.drop = 0;
  const at = o.at === '' || o.at == null ? null : Number(o.at);
  if (at != null && Number.isFinite(at)) {
    s.run = { t0: now() - Math.max(0, at) * 1000, load: s.load, side: s.side, slipped: false, quiet: false, ended: false };
  }
  const holdAt = o.hold === '' || o.hold == null ? null : Number(o.hold);
  if (holdAt != null && Number.isFinite(holdAt) && !s.run) s.hold = { F: clamp(holdAt, 0, capacity(s.load)), side: s.side };
  const rubAtStart = o.rub === '' || o.rub == null ? null : Number(o.rub);
  if (rubAtStart != null && Number.isFinite(rubAtStart)) {
    s.run = null;
    s.rub = { t0: now() - Math.max(0, rubAtStart) * 1000, load: s.load, loop: false, quiet: false, ended: false };
    s.heat = clamp(rubAtStart / RUB.warm, 0, 1);
    s.seen.rub = true;
    s.topic = 'rub';
  }
  flyTo(viewPose(), 0);
  refresh(true);
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
     * Change any of: load (0, 1 or 2 weights), side ('left' | 'right': legacy force-direction alias), push (true: the same
     * push as the button), at (s into a push: jump there), rub (true, or s into a rubbing: jump there), lens (true:
     * open the zoom-in), home (true: the block back in the middle), view; animate: false jumps.
     */
    async set(p = {}) {
      if (s.mode === 'quiz') return snapshot();
      const animate = p.animate !== false;
      if (p.view && s.mode !== 'quiz') await setView(p.view, { animate });
      if (p.side != null) setSide(p.side);
      if (p.load != null) await setLoad(p.load, { animate });
      if (p.lens === true) {
        s.seen.lens = true;
        await openLens({ animate });
      } else if (p.lens === false) closeLens();
      if (p.home) await goHome({ animate });
      if (typeof p.hold === 'number') {
        await goHome({ animate: false });
        s.hold = { F: clamp(p.hold, 0, capacity(s.load)), side: s.side };
      } else if (p.hold === false) s.hold = null;
      if (p.at != null && s.mode !== 'quiz') await push({ force: true, at: Math.max(0, Number(p.at) || 0) });
      else if (p.push && s.mode !== 'quiz') await push({ force: true });
      if (p.rub === true && s.mode !== 'quiz') await rubIt({ force: true });
      else if (typeof p.rub === 'number' && s.mode !== 'quiz') {
        await rubIt({ force: true, at: p.rub });
        s.heat = clamp(p.rub / RUB.warm, 0, 1); // rubbed that long: as warm as the URL's rub=… makes it
      }
      if (p.paused != null && s.mode !== 'quiz') setPaused(Boolean(p.paused));
      refresh(true);
      emitChange();
      return snapshot();
    },
    async reset() {
      setPaused(false);
      quiz.stop();
      ++token;
      s.run = null;
      s.rub = null;
      s.hold = null;
      s.x = 0;
      s.moving = false;
      s.load = 0;
      s.bite = biteOf(0);
      s.drop = 0;
      s.side = 1;
      s.heat = 0;
      s.found = [null, null, null];
      s.sides = new Set();
      s.seen = { push: false, load: false, lens: Boolean(o.lens), rub: false };
      s.topic = 'start';
      closeLens();
      s.lens = Boolean(o.lens);
      s.lensK = o.lens ? 1 : 0;
      anno.clear();
      s.view = 'front';
      controls.enableRotate = false;
      syncUI();
      await setView('front', { animate: false });
      refresh(true);
      emitChange();
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
    /** The floor, crate, weights, current people, ropes and force arrows, in metres. */
    exportRoot() {
      step(0);
      const root = rig.exportRoot();
      for (const a of Object.values(arrows))
        if (a.root.visible) {
          const copy = a.root.clone(true);
          delete copy.userData.noExport;
          root.add(copy);
        }
      return root;
    },
  };
}
