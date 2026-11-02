// Pressure and melting point (book pages 181–182, topic 6.7, চিত্র ৬.০৯), student view. The book's own picture: a block
// of ice across a pink table, a wire over it with a weight on each side. One guided sequence, one big button:
//   1. hang the wire and the two weights on the ice (the wire presses; the ice under it melts: a film of water),
//   2. let time pass (the wire sinks through, the water above it freezes again: a faint seam),
//   3. take the wire and weights away (the block is still one whole piece).
// The panel says in the book's words what happens under and over the wire; a five-question test follows. Built on the
// shared student kit. The book gives no numbers here, so none are shown: the speed is only a picture (said in a note).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { createArrowSet } from './arrows.js';
import { createIce, createRig, createWorld, wallTexture } from './scene.js';
import { CUT_SECONDS, ICE, P_HANG, QUIZ_KINDS, SCENES, WIRE_R, isCutting, nextOf, phaseOf, seamHeight, wireY } from './reading.js';

export const DEFAULTS = {
  step: 0, // 0 … 3: the steps done (3 = the wire and weights taken away)
  progress: null, // 0 … 1: how far through the ice the wire is (with step 2)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { press: '#e03131', melt: '#1864ab', freeze: '#0b7285', weight: '#6741d9', wire: '#343a40', ice: '#1864ab' };
const HANG_S = 1.4; // s: the wire and weights come down onto the ice
const REMOVE_S = 0.9; // s: they are taken away
const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 52, bottom: 14, side: 8 };
const FOCUS = new THREE.Box3(new THREE.Vector3(-0.37, -0.32, -0.3), new THREE.Vector3(0.37, 0.36, 0.3));
const ARROW_LEN = 0.075; // m: the pressure arrow
const VIEW_DIRS = { front: new THREE.Vector3(0.85, 0.34, 0.8), '3d': new THREE.Vector3(0.4, 0.45, 1) };
const DOWN = new THREE.Vector3(0, -1, 0);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'pm');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side', // the panel beside the 3D on landscape frames
    learn: cleanSheet(t, {
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 2, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the readings under the action: what happens under the wire and over it, and why, in the book's words
  const read = document.createElement('div');
  read.className = 'pm-read';
  read.innerHTML = ['under', 'over']
    .map(
      (id) =>
        `<div class="pm-row k-${id}" data-row="${id}"><div class="pm-head"><span class="pm-dot"></span><span class="pm-k"></span><b class="pm-v"></b></div><div class="pm-why"></div></div>`,
    )
    .join('');
  $('.pvc-act-row').after(read);
  const note = document.createElement('p');
  note.className = 'pm-note';
  ui.learn.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 60, environment: 'room', environmentIntensity: 0.6 });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI * 0.5;
  scene.background = o.bg !== 'transparent' ? wallTexture() : null;
  if (o.bg !== 'transparent') scene.fog = new THREE.Fog('#8da4b8', 4, 14);
  scene.add(new THREE.HemisphereLight('#cfe3ff', '#c08a6a', 0.9));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.2);
  sun.position.set(0.9, 1.7, 1.3);
  sun.target.position.set(0, -0.1, 0);
  scene.add(sun, sun.target);
  const fillLight = new THREE.DirectionalLight('#cfe2ff', 0.5);
  fillLight.position.set(-1.5, 0.8, 1.6);
  scene.add(fillLight);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.008;
    Object.assign(sun.shadow.camera, { left: -0.75, right: 0.75, top: 0.75, bottom: -0.75, near: 0.5, far: 4 });
    sun.shadow.camera.updateProjectionMatrix();
  }

  const world = createWorld();
  const ice = createIce();
  const rig = createRig();
  scene.add(world.root, ice.root, rig.root);
  // the one arrow: the pressure of the wire on the ice under it, pointing down into the ice
  const press = createArrowSet({
    count: 1,
    color: COLORS.press,
    outline: '#ffffff',
    radius: 0.0075,
    head: 0.03,
    headRadius: 0.016,
    pad: 0.003,
    xray: true,
    name: 'Pressure',
  });
  scene.add(press.root);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    step: 0, // steps done
    p: 0, // how far down the wire is (0 on top … 1 out of the bottom)
    rig: 0, // 0 … 1: how much of the wire and weights is drawn
    off: 0, // m: the rig is held this far above its place (while it comes down)
    seam: 1, // 0 … 1: how much of the refrozen seam is drawn
    busy: '', // '' | 'hang' | 'cut' | 'remove'
    show: { arrow: true, film: true, seam: true, labels: true }, // the test hides what would give an answer away
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    run: 0, // a token: every new run, jump or reset bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the picture, from the state ─────────────────────────────────────────────
  const A0 = new THREE.Vector3();
  function apply() {
    const yw = wireY(s.p);
    rig.root.position.y = yw + s.off;
    rig.setAlpha(s.rig);
    const seated = s.rig > 0.99 && s.off < 0.004 && s.step >= 1;
    const inside = seated && isCutting(s.p);
    const filmOn = inside && s.show.film;
    ice.film.visible = filmOn;
    if (filmOn) ice.film.position.y = yw - WIRE_R - 0.005 - ICE.y / 2;
    const h = seamHeight(s.p);
    const seamOn = s.step >= 1 && s.p > P_HANG * 0.5 && h > 0.004 && s.seam > 0.01 && s.show.seam;
    ice.seam.visible = seamOn;
    if (seamOn) {
      ice.seam.scale.y = h;
      ice.seam.position.y = (yw + WIRE_R + ICE.y) / 2 - ICE.y / 2;
      ice.seamMat.opacity = 0.6 * s.seam;
    }
    // the arrow presses down on the wire from just above it (outlined, drawn over the ice)
    if (inside && s.show.arrow) press.set(0, A0.set(0, yw + WIRE_R + ARROW_LEN + 0.006, 0), DOWN, ARROW_LEN);
    else press.hide(0);
    stage.invalidate();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const phase = () => phaseOf({ step: s.step, p: s.p });
  const OUT = { start: 'out_start', hung: 'out_hung', cutting: 'out_cutting', out: 'out_out', whole: 'out_whole' };
  const RULE = { start: 'rule_start', hung: 'rule_hung', cutting: 'rule_cut', out: 'rule_cut', whole: 'rule_whole' };
  const PLAN = { hang: ['act_hang', 1], cut: ['act_cut', 2], remove: ['act_remove', 3], again: ['act_again', ''] };
  const rowEls = {
    under: /** @type {HTMLElement} */ (read.querySelector('[data-row="under"]')),
    over: /** @type {HTMLElement} */ (read.querySelector('[data-row="over"]')),
  };
  const rowText = new Map();
  function setRow(id, on) {
    const el = rowEls[id];
    const key = `${on}`;
    if (rowText.get(id) === key) return;
    rowText.set(id, key);
    el.classList.toggle('on', on);
    /** @type {HTMLElement} */ (el.querySelector('.pm-k')).textContent = t(`cell_${id}`);
    /** @type {HTMLElement} */ (el.querySelector('.pm-v')).textContent = on ? t(`val_${id}`) : t('none');
    /** @type {HTMLElement} */ (el.querySelector('.pm-why')).textContent = on ? t(`why_${id}`) : '';
  }
  let lastNote = '';
  function refresh() {
    const ph = phase();
    sheet.outcome(t(OUT[ph]));
    sheet.rule(t(RULE[ph]));
    setRow('under', ph !== 'start');
    setRow('over', ph === 'cutting' || ph === 'out' || ph === 'whole');
    const nk = s.busy === 'cut' || ph === 'cutting' ? t('note_cut') : '';
    if (nk !== lastNote) {
      lastNote = nk;
      note.textContent = nk;
    }
    if (action) {
      const [label, step] = PLAN[nextOf(s.step, false, s.p)];
      action.set({ label, step });
      if (s.busy) action.hide('busy');
      else action.show('busy');
    }
    syncLabels();
    apply();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT = [spot(20, 0), spot(20, -20), spot(20, 20), spot(40, -30), spot(40, 30), spot(60, 0), spot(60, -50), spot(60, 50)];
  const LEFT = [spot(-20, 0), spot(-20, -20), spot(-20, 20), spot(-40, -30), spot(-40, 30), spot(-60, 0), spot(-60, -50), spot(-60, 50)];
  const UPLEFT = [spot(-30, -30), spot(-48, -40), spot(-62, -22), spot(-24, -50)];
  const UPRIGHT = [spot(30, -30), spot(48, -40), spot(62, -22), spot(24, -50)];
  const ABOVE = [spot(0, -24), spot(26, -24), spot(-26, -24), spot(0, -44), spot(44, -36), spot(-44, -36)];
  const BELOW = [spot(0, 24), spot(26, 24), spot(-26, 24), spot(0, 44), spot(44, 36), spot(-44, 36)];
  const tmp = new THREE.Vector3();
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const bbox = new THREE.Box3();
  function screenBox(b3) {
    let i = 0;
    for (const x of [b3.min.x, b3.max.x])
      for (const y of [b3.min.y, b3.max.y]) for (const z of [b3.min.z, b3.max.z]) corners[i++].set(x, y, z).project(camera);
    const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
    const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }
  /** The ice block, so no label sits on the wire's path inside it (the arrow is inside it too). */
  const subjectBoxes = () => {
    bbox.setFromObject(ice.block);
    return [screenBox(bbox)];
  };
  /** The pressure arrow as three small boxes along it (the labels keep clear of it). */
  const P0 = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };
  const toScreen = (p, out) => {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  };
  function arrowBoxes() {
    if (!press.shown[0]) return [];
    toScreen(press.tails[0], P0);
    toScreen(press.tips[0], P1);
    const list = [];
    for (let k = 0; k < 3; k++) {
      const x0 = P0.x + ((P1.x - P0.x) * k) / 3;
      const y0 = P0.y + ((P1.y - P0.y) * k) / 3;
      const x1 = P0.x + ((P1.x - P0.x) * (k + 1)) / 3;
      const y1 = P0.y + ((P1.y - P0.y) * (k + 1)) / 3;
      list.push({ left: Math.min(x0, x1) - 8, top: Math.min(y0, y1) - 8, right: Math.max(x0, x1) + 8, bottom: Math.max(y0, y1) + 8 });
    }
    return list;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const pts = {};
  const pt = (id) => (pts[id] ||= new THREE.Vector3());
  const labelKey = new Map();
  const want = new Map();
  function syncLabels() {
    want.clear();
    const ph = phase();
    const L = s.show.labels;
    const yw = wireY(s.p);
    if (L) {
      // at most three short labels, spread round the block: the ice up on the left, the wire to the right, a weight below
      want.set('ice', {
        text: t(ph === 'whole' ? 'lbl_whole' : 'lbl_ice'),
        point: () => pt('ice').set(-ICE.x * 0.4, ICE.y, ICE.z / 2),
        spots: [...UPLEFT, ...ABOVE, ...LEFT],
        color: COLORS.ice,
      });
      if (s.rig > 0.5 && s.off < 0.01) {
        want.set('wire', {
          text: t('lbl_wire'),
          point: () =>
            pt('wire')
              .copy(rig.pointOf.wire)
              .setY(rig.pointOf.wire.y + yw),
          spots: [spot(-34, -2), spot(-44, 14), ...LEFT, ...RIGHT, ...UPRIGHT],
          color: COLORS.wire,
        });
        want.set('weight', {
          text: t('lbl_weight'),
          point: () =>
            pt('weight')
              .copy(rig.pointOf.weight)
              .setY(rig.pointOf.weight.y + yw),
          spots: [...BELOW, ...LEFT, ...RIGHT],
          color: COLORS.weight,
        });
      }
    }
    for (const id of [...labelKey.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelKey.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.spots.length}|${w.optional}`;
      if (!labelKey.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, avoid: [subjectBoxes], optional: w.optional });
        labelKey.set(id, key);
      } else if (labelKey.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots, optional: w.optional });
        labelKey.set(id, key);
      }
    }
  }

  // ── the story: three steps, each cancellable ────────────────────────────────
  function cancelRuns() {
    s.run++;
    for (const k of ['hang', 'cut', 'remove']) tweener.cancel(k);
    s.busy = '';
  }
  function jumpTo(step, { p = null } = {}) {
    cancelRuns();
    s.step = Math.min(3, Math.max(0, Math.round(step)));
    s.off = 0;
    s.seam = s.step >= 3 ? 0 : 1;
    s.rig = s.step === 0 || s.step >= 3 ? 0 : 1;
    s.p = s.step === 0 ? 0 : s.step === 1 ? P_HANG : 1;
    if (s.step === 2 && p != null && p !== '' && Number.isFinite(Number(p))) s.p = Math.min(1, Math.max(P_HANG, Number(p)));
    refresh();
    emitChange();
  }
  const finished = (job, token) => job.finished.then((done) => done && token === s.run);
  async function runHang() {
    cancelRuns();
    const token = s.run;
    s.step = 1;
    s.busy = 'hang';
    s.seam = 1;
    refresh();
    emitChange();
    const job = tweener.animate({
      key: 'hang',
      duration: HANG_S,
      ease: ease.outCubic,
      onUpdate: (k) => {
        s.rig = Math.min(1, k * 3);
        s.off = (1 - k) * 0.14;
        s.p = P_HANG * k;
        refresh();
      },
    });
    if (!(await finished(job, token))) return false;
    s.off = 0;
    s.p = P_HANG;
    s.rig = 1;
    s.busy = '';
    audio.contact();
    refresh();
    emitChange();
    return true;
  }
  async function runCut() {
    cancelRuns();
    const token = s.run;
    s.step = 2;
    s.busy = 'cut';
    refresh();
    emitChange();
    const p0 = s.p;
    const job = tweener.animate({
      key: 'cut',
      duration: CUT_SECONDS * ((1 - p0) / (1 - P_HANG)),
      ease: ease.linear,
      onUpdate: (k) => {
        s.p = p0 + (1 - p0) * k;
        refresh();
      },
    });
    if (!(await finished(job, token))) return false;
    s.p = 1;
    s.busy = '';
    audio.success();
    refresh();
    emitChange();
    return true;
  }
  async function runRemove() {
    cancelRuns();
    const token = s.run;
    s.step = 3;
    s.busy = 'remove';
    refresh();
    emitChange();
    const job = tweener.animate({
      key: 'remove',
      duration: REMOVE_S,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.rig = 1 - k;
        s.seam = 1 - k;
        refresh();
      },
    });
    if (!(await finished(job, token))) return false;
    s.rig = 0;
    s.seam = 0;
    s.busy = '';
    audio.pop();
    refresh();
    emitChange();
    return true;
  }
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 1500 });
    const next = nextOf(s.step, false, s.p);
    if (next === 'hang') return runHang();
    if (next === 'cut') return runCut();
    if (next === 'remove') return runRemove();
    jumpTo(0);
    return runHang();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewPose(view = s.view) {
    return fitPose({
      box: FOCUS,
      dir: VIEW_DIRS[view],
      camera,
      width: stage.width,
      height: stage.height,
      margin: stage.height < 260 ? { top: 38, bottom: 8, side: 6 } : MARGIN,
    });
  }
  function flyTo({ position, target }, duration = 0.7) {
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
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
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
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    syncLabels();
  });

  // ── the action: the big button, and the ring round the ice ──────────────────
  const targetBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_hang',
    target: () => targetBox.setFromObject(ice.block),
    pad: 6,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const hitList = [ice.block, ...rig.pickables];
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(hitList, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return;
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 3000 } = {}) {
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
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 2400 });
    audio.error();
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const ph = phase();
    return {
      step: s.step,
      phase: ph,
      progress: +s.p.toFixed(3), // 0 on top … 1 out of the bottom
      wireY: +wireY(s.p).toFixed(4), // m above the table top (the block is 0 … 0.22)
      pressing: s.rig > 0.99 && isCutting(s.p) && s.step >= 1, // the wire presses on the ice under it
      whole: ph === 'whole' || ph === 'out', // the block is one piece (it only looks cut at 'out')
      busy: s.busy,
      next: nextOf(s.step, s.busy, s.p),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.phase, snap.busy, snap.mode, snap.view]);
    if (key === lastEmitted && !force) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const SHOWN = {
    press: { arrow: true, film: false, seam: false },
    why: { arrow: true, film: true, seam: false },
    refreeze: { arrow: true, film: true, seam: false },
    whole: { arrow: true, film: true, seam: false },
    join: { arrow: false, film: false, seam: false },
  };
  /** A question's scene: this step of the story, with what would give the answer away left out. */
  function scene_(kind) {
    cancelRuns();
    const sc = SCENES[kind];
    s.step = sc.step;
    s.p = sc.p;
    s.rig = sc.rig;
    s.off = 0;
    s.seam = 1;
    s.show = { ...SHOWN[kind], labels: true };
    s.userMovedCamera = false;
    refresh();
    return flyTo(viewPose(), 0.5);
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 2, feedback: 4 },
    action,
    hooks: {
      enter() {
        cancelRuns();
        learnSaved = { step: s.step, p: s.p };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { arrow: true, film: true, seam: true, labels: true };
        syncUI();
        jumpTo(learnSaved?.step ?? 0, { p: learnSaved?.p });
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = QUIZ_KINDS[i % QUIZ_KINDS.length];
        await scene_(kind);
        if (!alive()) return null;
        const list = shuffle([0, 1, 2, 3]);
        question = { kind, list };
        return {
          text: t(`q_${kind}`),
          choices: [0, 1, 2, 3],
          expected: list.indexOf(0),
          tolerance: 0.5,
          label: (j) => `<span class="pm-opt">${t(`q_${kind}_${list[j]}`)}</span>`,
          meta: { kind },
        };
      },
      reveal(_q, correct) {
        const { kind, list } = question;
        s.show = { arrow: true, film: true, seam: kind !== 'join', labels: true };
        refresh();
        const wrong = correct ? '' : list[picked];
        return t(`why_${kind}`) + (wrong ? ` ${t(`mis_${kind}_${wrong}`)}` : '');
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

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
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
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
      case 'home':
        if (s.locked) lockedNudge();
        else jumpTo(0);
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowUp'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (k === 'ArrowRight' || k === 'ArrowUp' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') jumpTo(0);
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  flyTo(viewPose(), 0);
  jumpTo(Number(o.step) || 0, { p: o.progress });
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
     * Change any of: step (0 … 3: jumps there; with animate it plays the steps still to do), progress (0 … 1, with
     * step 2: how far the wire has sunk), view ('front' | '3d').
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step != null) {
        const target = Math.min(3, Math.max(0, Math.round(Number(p.step))));
        if (animate && target > s.step && !s.busy) {
          while (s.step < target) {
            const ok = s.step === 0 ? await runHang() : s.step === 1 ? await runCut() : await runRemove();
            if (!ok) break;
          }
        } else jumpTo(target, { p: p.progress });
      } else if (p.progress != null && s.step === 2) jumpTo(2, { p: p.progress });
      if (!s.userMovedCamera) flyTo(viewPose(), 0);
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.show = { arrow: true, film: true, seam: true, labels: true };
      jumpTo(0);
      await setView('front', { animate: false });
      flyTo(viewPose(), 0);
      emitChange(true);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The table, the block of ice and (when it is there) the wire and weights, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'PressureMeltingPoint';
      g.add(world.table.clone(), ice.root.clone());
      if (s.rig > 0.5) g.add(rig.root.clone());
      return g;
    },
  };
}
