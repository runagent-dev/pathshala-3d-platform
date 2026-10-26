// How we walk: the third law (book page 86, topic 3.8, চিত্র ৩.১২), student view. A student stands on a path, seen from
// the side. One big action ("পা দিয়ে ধাক্কা দাও"; its numbered badge rings the pushing foot) takes the first push-off of
// a walk, slowed down, and holds at the telling moment: the foot pushes the ground backward (F, drawn on the ground)
// and the ground pushes the student forward (−F, drawn at the student), the two arrows equally long and each named
// where it acts. The panel's row of words is the page's three grounds: firm ground (the push is as big as the leg
// gives: the student moves off), loose sand (it gives way: a smaller push, a heap of sand pushed back) and a floor made
// slippery with soapy water or oil (the foot slides back, the push is tiny, the student hardly moves). The panel is the
// kit's clean sheet: that row of words, the action, one result line, one rule in the book's own sentences that grows
// as each ground is found. Then a short test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createArrow } from '@shared/arrow.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createWalker } from './walker.js';
import { createGround } from './ground.js';
import { GROUND_IDS, SHOWN_TIME, SLOW, accelOn, bodyAt, progress, pushOn, realTime, round, slipAt, speedAt } from './reading.js';

export const DEFAULTS = {
  ground: 'hard', // 'hard' | 'sand' | 'slip'
  at: 'rest', // 'rest' | 'hold' | seconds of the slowed-down picture: where it starts (hold: at the telling moment)
  tried: '', // grounds already found, e.g. 'hard,sand' (their pushes under the words; for pictures)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the foot pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

/** One colour per force, the same on the arrow, its label and the result: the foot's push on the ground (a push, as in
 * the other figures of the chapter), the ground's push on the student (a friction-like grip force, crimson). */
export const COLORS = { foot: '#e8590c', ground: '#c2255c', plain: '#4b5766' };
const ARROW_PER_N = 0.005; // m of arrow per newton: both arrows, the same scale (100 N = 0.5 m)
const ARROW = { radius: 0.013, head: 0.09, headRadius: 0.038 };
const ARROW_Z = 0.22; // in front of the feet, so nothing hides them
const F_Y = 0.03; // the foot's push lies on the ground
const MF_Y = 0.118; // the ground's push starts at the shoe
const TOP_ROOM = 44; // px kept clear at the top of the view for the corner buttons and the note
const TAP = { move: 10, ms: 600 };
const FRAME = { min: new THREE.Vector3(-0.7, -0.26, -0.45), max: new THREE.Vector3(1.2, 1.72, 0.45) };
const DIRS = { front: new THREE.Vector3(0, 0.16, 1).normalize(), '3d': new THREE.Vector3(0.62, 0.34, 1).normalize() };

/** Where the labels may go round their point (px, best first): rows of offsets, nearest row first. */
const rows = (dys, dxs) => dys.flatMap((dy) => dxs.map((dx) => [dx, dy]));
const SPOTS = {
  // the foot's push: under the ground line, in the face of the ground
  f: rows([34, 58], [0, 46, -46, 92, -92, 130, -130]).concat(rows([-44, -70, -96], [-62, -100, -140, 62, 100, 140]), [[-80, 0]]),
  // the ground's push: over the arrow, between the legs or clear of them, left or right of the student
  mf: rows([-38, -62, -88, -14], [0, 46, -46, 92, -92, 112, -112, 140]),
  start: [
    [-26, 0],
    [26, 0],
    [0, -16],
  ],
};
const toSpots = (list) => list.map(([dx, dy]) => ({ dx, dy }));

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'wtl');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', results: true, items: GROUND_IDS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 2, outcome: 2, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const outcomeEl = /** @type {HTMLElement} */ (ui.$('.pvc-outcome'));
  outcomeEl.setAttribute('aria-live', 'polite');
  const note = document.createElement('div');
  note.className = 'wtl-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.01, far: 100, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  const world = new THREE.Group();
  world.name = 'WalkingThirdLaw';
  scene.add(world);
  const ground = createGround({ anisotropy: stage.renderer.capabilities.getMaxAnisotropy() });
  const walker = createWalker();
  world.add(ground.root, walker.root);

  const shadows = o.shadow && o.bg !== 'transparent';
  const sun = new THREE.DirectionalLight(0xffffff, shadows ? 0.6 : 0.35);
  sun.position.set(1.4, 3.2, 2.2);
  sun.target.position.set(0.3, 0.5, 0);
  scene.add(sun, sun.target);
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -1.6, right: 1.8, top: 2, bottom: -1, near: 0.5, far: 9 });
    sun.shadow.radius = 6;
    sun.shadow.blurSamples = 12;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.01;
    sun.shadow.camera.updateProjectionMatrix();
  }

  // the two force arrows: the foot's push on the ground (backward), the ground's push on the student (forward)
  const arrows = {
    f: createArrow({ color: COLORS.foot, name: 'FootPushArrow', ...ARROW }),
    mf: createArrow({ color: COLORS.ground, name: 'GroundPushArrow', ...ARROW }),
  };
  for (const a of Object.values(arrows)) {
    a.root.userData.noExport = true;
    world.add(a.root);
  }

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    ground: GROUND_IDS.includes(o.ground) ? o.ground : 'hard',
    phase: 'rest', // 'rest' | 'push' (the slowed-down push-off runs) | 'held' (stopped at the telling moment)
    shown: 0, // s into the slowed-down picture, 0 … SHOWN_TIME
    tried: /** @type {Record<string, boolean>} */ ({}), // grounds whose telling moment has been seen
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    // the test's scene
    arrows: true, // the two arrows show
    plain: '', // '' (named, in their colours) or the letters the arrows carry (a test question)
    letters: { f: '', mf: '' }, // the letters on the two arrows of a test question (t('letters'))
    numbers: false, // the foot's push shows its number ("equal" question)
    reveal: false,
  };
  const realNow = () => realTime(s.shown);
  const progressNow = () => progress(realNow());
  const triedCount = () => GROUND_IDS.filter((g) => s.tried[g]).length;

  // ── the picture at the current time ──────────────────────────────────────────
  const tail = new THREE.Vector3();
  const along = new THREE.Vector3();
  const FWD = new THREE.Vector3(1, 0, 0);
  const BACK = new THREE.Vector3(-1, 0, 0);
  const pv = new THREE.Vector3();
  const toScreen = (p) => {
    pv.copy(p).project(camera);
    return { x: (pv.x * 0.5 + 0.5) * stage.width, y: (-pv.y * 0.5 + 0.5) * stage.height };
  };
  const arrowAlpha = () => (!s.arrows || s.phase === 'rest' ? 0 : Math.min(1, s.shown / 0.35));

  /** The student, the ground's marks and both arrows at the current time. */
  function place() {
    const t1 = realNow();
    const hip = bodyAt(t1, s.ground);
    walker.root.position.x = hip;
    walker.pose(progressNow());
    const toe = hip + walker.toe().x;
    ground.foot(toe, slipAt(t1, s.ground));
    const a = arrowAlpha();
    const len = pushOn(s.ground) * ARROW_PER_N;
    if (a > 0.01) {
      arrows.f.set(tail.set(toe, F_Y, ARROW_Z), BACK, len);
      arrows.mf.set(tail.set(toe + 0.012, MF_Y, ARROW_Z), FWD, len);
      arrows.f.setOpacity(a);
      arrows.mf.setOpacity(a);
    } else {
      arrows.f.hide();
      arrows.mf.hide();
    }
    const grey = s.plain ? COLORS.plain : null;
    arrows.f.material.color.set(grey || COLORS.foot);
    arrows.f.material.emissive.set(grey || COLORS.foot);
    arrows.mf.material.color.set(grey || COLORS.ground);
    arrows.mf.material.emissive.set(grey || COLORS.ground);
    stage.invalidate();
  }

  // ── what labels must keep off: the body in short boxes along its bones, and both arrows ──
  const pxPerM = () => stage.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.distanceTo(controls.target));
  function bodyBoxes(skip = '') {
    const out = [];
    const k = pxPerM();
    for (const [a, b, r, part] of walker.bones()) {
      if (part === skip) continue;
      const pa = toScreen(a);
      const pb = toScreen(b);
      const half = Math.max(r * k, 5) + 2;
      const n = Math.max(1, Math.ceil(Math.hypot(pb.x - pa.x, pb.y - pa.y) / 9));
      for (let i = 0; i <= n; i++) {
        const x = pa.x + ((pb.x - pa.x) * i) / n;
        const y = pa.y + ((pb.y - pa.y) * i) / n;
        out.push({ left: x - half, top: y - half, right: x + half, bottom: y + half });
      }
    }
    return out;
  }
  function arrowBoxes() {
    const out = [];
    for (const a of Object.values(arrows)) {
      if (!a.root.visible) continue;
      const pa = toScreen(a.root.position);
      const pb = toScreen(a.tip);
      const n = Math.max(1, Math.ceil(Math.hypot(pb.x - pa.x, pb.y - pa.y) / 9));
      for (let i = 0; i <= n; i++) {
        const x = pa.x + ((pb.x - pa.x) * i) / n;
        const y = pa.y + ((pb.y - pa.y) * i) / n;
        out.push({ left: x - 10, top: y - 10, right: x + 10, bottom: y + 10 });
      }
    }
    return out;
  }

  // ── the labels: each force named where it acts; the start line ──
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, note, ui.hint, () => action?.ringBox()] });
  const mid = { f: new THREE.Vector3(), mf: new THREE.Vector3() };
  const midOf = (key) => () => {
    const a = arrows[key];
    return mid[key].copy(a.root.position).addScaledVector(along.subVectors(a.tip, a.root.position), 0.5);
  };
  const startTop = new THREE.Vector3(0, 1.7, 0);
  const labelState = { f: '', mf: '', start: false };
  /** The symbols F and −F show only once all three grounds are found: the rule then names them (the book's picture). */
  const symbolsOn = () => s.mode === 'explore' && !s.plain && triedCount() === GROUND_IDS.length;
  /** The text of a force's label now: who pushes whom in plain words (the symbol later); a letter in a test question. */
  function labelText(key) {
    const words = t(key === 'f' ? 'l_f' : 'l_mf');
    if (s.plain) {
      if (!s.numbers) return `<b>${s.letters[key]}</b>`;
      return `${words}<small>${key === 'f' ? t('e_val', { n: pushOn(s.ground) }) : '?'}</small>`;
    }
    return symbolsOn() ? `<b>${key === 'f' ? 'F' : '−F'}</b> ${words}` : words;
  }
  function syncLabels() {
    for (const key of ['f', 'mf']) {
      const want = arrows[key].root.visible && arrowAlpha() > 0.6;
      const text = want ? labelText(key) : '';
      const color = s.plain ? COLORS.plain : key === 'f' ? COLORS.foot : COLORS.ground;
      const sig = `${text}|${color}`;
      if (!want) {
        if (labelState[key]) anno.remove(key);
        labelState[key] = '';
        continue;
      }
      if (!labelState[key]) {
        anno.add(key, {
          text,
          point: midOf(key),
          kind: s.plain && !s.numbers ? 'letter' : 'force',
          color,
          spots: toSpots(s.plain && !s.numbers ? SPOTS[key].map(([x, y]) => [x * 0.5, y * 0.8]) : SPOTS[key]),
          avoid: [() => bodyBoxes(), arrowBoxes],
          optional: false,
        });
        labelState[key] = sig;
      } else if (labelState[key] !== sig) {
        anno.update(key, { text, color });
        labelState[key] = sig;
      }
    }
    if (!labelState.start) {
      anno.add('start', {
        text: t('l_start'),
        point: () => startTop,
        kind: 'start',
        spots: toSpots(SPOTS.start),
        avoid: [() => bodyBoxes()],
        optional: true,
      });
      labelState.start = true;
    }
  }

  /** The picture and its labels. */
  function drawScene() {
    place();
    syncLabels();
    noteNow();
  }

  // ── the panel: the row of words, the action, the result, the rule ─────────────
  /**
   * What the big action does now: push on this ground (or again, once found); once the moment has been seen, go on to
   * the next ground not found yet, in the page's order. Its step counts the student's own steps: the grounds found so
   * far + 1; "আবার ধাক্কা দাও" has none.
   */
  function plan() {
    const count = triedCount();
    if (s.phase !== 'held')
      return s.tried[s.ground] ? { ground: s.ground, label: 'act_again', step: '' } : { ground: s.ground, label: `act_${s.ground}`, step: count + 1 };
    const next = GROUND_IDS.find((g) => !s.tried[g]);
    return next ? { ground: next, label: `act_${next}`, step: count + 1 } : { ground: s.ground, label: 'act_again', step: '' };
  }

  function outcomeHtml() {
    const g = s.ground;
    if (s.phase === 'rest') return t(`out_rest_${g}`);
    if (s.phase === 'push') return t('out_push');
    return t(`out_${g}`, { n: pushOn(g) });
  }
  /**
   * The rule, one short sentence per idea: the puzzle, then what the student finds on each ground in everyday words,
   * and the book's own sentence last, once all three grounds are found.
   */
  function ruleHtml() {
    const g = s.ground;
    if (triedCount() === GROUND_IDS.length) return t('rule_all');
    if (s.phase === 'rest') return s.tried[g] ? t(`rule_${g}`) : t('rule_start');
    return t(`rule_${g}`);
  }

  let lastNote = '';
  function noteNow() {
    const html = s.phase === 'push' ? t('note_slow', { k: SLOW }) : s.phase === 'held' ? `${ICONS.pause}${t('note_held')}` : '';
    if (html === lastNote) return;
    note.innerHTML = lastNote = html;
    note.classList.toggle('held', s.phase === 'held');
  }

  /** Write the panel and the action (only what changed: it runs on every frame of a run). */
  function refresh() {
    if (s.mode === 'quiz') return;
    sheet.choose(s.ground);
    for (const g of GROUND_IDS) sheet.result(g, s.tried[g] ? t('res_push', { n: pushOn(g) }) : '');
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    const p = plan();
    sheet.next(p.ground !== s.ground ? p.ground : null);
    action?.set({ step: p.step, label: p.label, enabled: s.phase !== 'push' });
    if (action) {
      if (s.mode === 'explore' && s.phase === 'rest') action.show('run');
      else action.hide('run');
    }
  }

  // ── the run ─────────────────────────────────────────────────────────────────
  let lastAct = -1e9;
  /** A new ground: the student stands still on it, ready to push. */
  function setGround(id, { quiet = false } = {}) {
    if (!GROUND_IDS.includes(id)) return;
    const changed = id !== s.ground;
    s.ground = id;
    s.phase = 'rest';
    s.shown = 0;
    ground.setSurface(id);
    drawScene();
    refresh();
    if (changed && !quiet) emit('ground', { ground: id });
    emitChange();
  }

  /** The first push-off, slowed down, from standing to the telling moment, where it holds. */
  function play({ silent = false } = {}) {
    if (s.locked) return lockedNudge();
    if (s.phase === 'push') return;
    s.phase = 'push';
    s.shown = 0;
    lastAct = performance.now();
    if (!silent) audio.pop();
    drawScene();
    refresh();
    emit('push', { ground: s.ground });
    emitChange();
  }

  /** The big action: push on this ground, or go on to the next one not found yet. */
  function doAction() {
    if (s.locked) return lockedNudge();
    if (s.phase === 'push' || performance.now() - lastAct < 400) return; // a double tap is not a second push
    const p = plan();
    if (p.ground !== s.ground) setGround(p.ground);
    play();
  }

  /** The telling moment is reached: this ground is found. */
  function arrived() {
    if (s.mode !== 'quiz') s.tried[s.ground] = true;
    emit('hold', { ground: s.ground, force: pushOn(s.ground) });
  }

  stage.addTicker((dt) => {
    if (s.phase !== 'push') return false;
    s.shown = Math.min(SHOWN_TIME, s.shown + dt);
    if (s.shown >= SHOWN_TIME) {
      s.phase = 'held';
      arrived();
      if (s.mode !== 'quiz') audio.tick();
      drawScene();
      refresh();
      emitChange();
      return true;
    }
    drawScene();
    refresh();
    return true;
  });

  // ── camera ──────────────────────────────────────────────────────────────────
  const basisX = new THREE.Vector3();
  const basisY = new THREE.Vector3();
  const corner = new THREE.Vector3();
  const centre = new THREE.Vector3();
  /** The side (or turned) view that fits the frame in the room below the buttons. */
  function viewPose(view = s.view) {
    const dir = DIRS[view];
    const { min, max } = FRAME;
    centre.addVectors(min, max).multiplyScalar(0.5);
    basisX.crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
    basisY.crossVectors(dir, basisX).normalize();
    let hw = 0;
    let hh = 0;
    let depth = 0;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z).sub(centre);
      hw = Math.max(hw, Math.abs(corner.dot(basisX)));
      hh = Math.max(hh, Math.abs(corner.dot(basisY)));
      depth = Math.max(depth, corner.dot(dir));
    }
    const W = Math.max(stage.width, 1);
    const H = Math.max(stage.height, 1);
    const top = Math.min(TOP_ROOM, H * 0.16);
    const bottom = 6;
    const side = 8;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * (W / H);
    const usableV = Math.max(0.4, (H - top - bottom) / H);
    const usableH = Math.max(0.6, (W - 2 * side) / W);
    const distance = Math.max(hh / tanV / usableV, hw / tanH / usableH) + depth;
    const perPixel = (2 * (distance - depth) * tanV) / H;
    const target = centre.clone().addScaledVector(basisY, ((top - bottom) / 2) * perPixel);
    camera.near = Math.max(0.01, distance * 0.02);
    camera.far = distance * 40;
    camera.updateProjectionMatrix();
    return { target, position: target.clone().addScaledVector(dir, distance), distance };
  }
  function flyTo({ position, target }, duration = 0.8) {
    tweener.cancel('camera');
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
    controls.enableRotate = controls.enableZoom = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  /** A narrow view wraps the labels to two lines; a short one makes them smaller; both made again at their new size. */
  function setCompact() {
    const compact = stage.height < 280 || stage.width < 360;
    const narrow = stage.width < 480;
    if (root.classList.contains('wtl-compact') === compact && root.classList.contains('wtl-narrow') === narrow) return;
    root.classList.toggle('wtl-compact', compact);
    root.classList.toggle('wtl-narrow', narrow);
    labelState.f = labelState.mf = '';
    labelState.start = false;
    anno.clear();
  }
  stage.onResize(() => {
    setCompact();
    if (!s.userMovedCamera) flyTo(viewPose(s.view), 0);
    noteNow();
  });

  // ── touching the picture: a tap on the student pushes ───────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(walker.hit, false).length > 0;
  }
  /** @type {{ id: number, x: number, y: number, at: number } | null} */
  let down = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    audio.unlock();
    root.focus({ preventScroll: true });
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    down = pick(canvasPoint(e)) ? { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() } : null;
  });
  // a real tap pushes; a drag on the student still turns the camera in the turned view
  window.addEventListener('pointerup', (e) => {
    const d = down;
    if (!d || e.pointerId !== d.id) return;
    down = null;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP.move || performance.now() - d.at > TAP.ms) return;
    if (pick(canvasPoint(e))) doAction();
  });
  window.addEventListener('pointercancel', () => {
    down = null;
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

  // ── hint line (only for a locked tap in the test) ───────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
    stage.invalidate();
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
    stage.invalidate();
  }
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 2200 });
    audio.error();
  }

  // the big button in the panel and the numbered ring round the pushing foot (taps on the ring go through to the
  // student, whose own tap pushes too); the ring shows only while the student waits at rest
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: `act_${s.ground}`,
    target: () => (s.mode === 'explore' && s.phase === 'rest' ? walker.rearShoe : null),
    pad: 14,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes(), () => bodyBoxes('rearFoot')],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
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
  const letters = [...t('letters')];
  /** @type {{ kind: string, [k: string]: any } | null} */
  let question = null;
  let order = [];

  /** The scene of a question: this ground, held at the telling moment; the arrows plain, hidden or named. */
  function questionScene(g, { arrows = true, plain = '', numbers = false } = {}) {
    s.ground = g;
    ground.setSurface(g);
    s.phase = 'held';
    s.shown = SHOWN_TIME;
    s.arrows = arrows;
    s.plain = plain;
    s.numbers = numbers;
    s.reveal = false;
    labelState.f = labelState.mf = '';
    anno.remove('f');
    anno.remove('mf');
    drawScene();
  }
  const textChoices = (items) => {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="wtl-opt">${list[j].text}</span>`,
    };
  };
  const item = (key, vars) => ({ key, text: t(key, vars) });
  /** After the answer the arrows are named (and shown, if the question hid them). */
  function showNames() {
    s.arrows = true;
    s.plain = '';
    s.numbers = false;
    s.reveal = true;
    labelState.f = labelState.mf = '';
    anno.remove('f');
    anno.remove('mf');
    drawScene();
  }

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
        s.mode = 'quiz';
        s.locked = true;
        hideHint();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.arrows = true;
        s.plain = '';
        s.numbers = false;
        s.reveal = false;
        question = null;
        labelState.f = labelState.mf = '';
        anno.remove('f');
        anno.remove('mf');
        syncUI();
        setGround(s.ground, { quiet: true });
      },
      prepare(i, _alive, say) {
        if (i === 0) order = shuffle(['which', 'equal', 'cancel', 'slip', 'sand']);
        const kind = order[i % order.length];
        if (kind === 'which') {
          const g = pickOne(GROUND_IDS.filter((x) => x !== 'slip'));
          const [lf, lmf] = shuffle([...letters]);
          s.letters = { f: lf, mf: lmf };
          questionScene(g, { plain: 'letters' });
          question = { kind, k: lmf, o: lf };
          const items = [item('w_arrow', { k: lmf }), item('w_arrow', { k: lf }), item('w_both'), item('w_self')];
          const c = textChoices(items);
          question.keys = ['w_right', 'w_ground', 'w_both', 'w_self'];
          question.list = c.list.map((x) => question.keys[items.indexOf(x)]);
          say(t('q_which'));
          return { text: t('q_which'), ...c, meta: { kind, answer: lmf } };
        }
        if (kind === 'equal') {
          const g = pickOne(GROUND_IDS);
          const n = pushOn(g);
          s.letters = { f: 'F', mf: '−F' };
          questionScene(g, { plain: 'numbers', numbers: true });
          question = { kind, n };
          const items = [item('e_val', { n }), item('e_val', { n: n * 2 }), item('e_val', { n: n / 2 }), item('e_val', { n: 0 })];
          const c = textChoices(items);
          const keys = ['e_right', 'e_double', 'e_half', 'e_zero'];
          question.list = c.list.map((x) => keys[items.indexOf(x)]);
          say(t('q_equal'));
          return { text: t('q_equal'), ...c, meta: { kind, answer: n } };
        }
        if (kind === 'cancel') {
          questionScene('hard');
          question = { kind };
          const items = [item('c_bodies'), item('c_bigger'), item('c_inertia'), item('c_muscle')];
          const c = textChoices(items);
          question.list = c.list.map((x) => x.key);
          say(t('q_cancel'));
          return { text: t('q_cancel'), ...c, meta: { kind, answer: 'bodies' } };
        }
        if (kind === 'slip') {
          questionScene('slip', { arrows: false });
          question = { kind };
          const items = [item('s_friction'), item('s_back'), item('s_law'), item('s_weak')];
          const c = textChoices(items);
          question.list = c.list.map((x) => x.key);
          say(t('q_slip'));
          return { text: t('q_slip'), ...c, meta: { kind, answer: 'friction' } };
        }
        questionScene('sand', { arrows: false });
        question = { kind: 'sand' };
        const items = [item('d_less'), item('d_same'), item('d_more'), item('d_none')];
        const c = textChoices(items);
        question.list = c.list.map((x) => x.key);
        say(t('q_sand'));
        return { text: t('q_sand'), ...c, meta: { kind: 'sand', answer: 'less' } };
      },
      reveal(_q, correct, picked) {
        const q = question;
        const key = q.list[picked.value];
        showNames();
        if (q.kind === 'which') {
          const miss = { w_ground: 'miss_w_ground', w_both: 'miss_w_both', w_self: 'miss_w_self' }[key];
          return t(correct ? 'why_which' : miss, { k: q.k, o: q.o });
        }
        if (q.kind === 'equal') {
          const miss = { e_double: 'miss_e_double', e_half: 'miss_e_half', e_zero: 'miss_e_zero' }[key];
          return t(correct ? 'why_equal' : miss, { n: q.n });
        }
        if (q.kind === 'cancel') return t(correct ? 'why_cancel' : `miss_${key}`);
        if (q.kind === 'slip') return t(correct ? 'why_slip' : `miss_${key}`);
        return t(correct ? 'why_sand' : `miss_${key}`, { a: pushOn('hard'), b: pushOn('sand') });
      },
      done() {
        s.locked = false;
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
    const b = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else if (b.dataset.example !== s.ground || s.phase !== 'rest') setGround(b.dataset.example);
    }
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
      case 'home':
        if (s.locked) lockedNudge();
        else setGround(s.ground);
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
    const k = e.key.toLowerCase();
    const n = Number(k);
    if (n >= 1 && n <= GROUND_IDS.length) {
      if (s.locked) lockedNudge();
      else setGround(GROUND_IDS[n - 1]);
    } else if (k === 'arrowright' && !target.closest('[role="radiogroup"]')) {
      doAction(); // (on the row of words the kit's radio group takes the arrows itself)
    } else if ((k === ' ' || k === 'enter') && !target.closest('button')) doAction();
    else if (k === 'r' || k === 'home') {
      if (s.locked) lockedNudge();
      else setGround(s.ground);
    } else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const t1 = realNow();
    const p = plan();
    return {
      ground: s.ground,
      phase: s.phase, // 'rest' | 'push' | 'held'
      time: round(t1, 3), // s of the push-off in real time (0 … 0.6)
      push: pushOn(s.ground), // N: the foot's push on the ground = the ground's push on the student
      acceleration: round(accelOn(s.ground), 2), // ms⁻², once the push has begun
      speed: round(speedAt(t1, s.ground), 2), // m/s now
      moved: round(bodyAt(t1, s.ground), 3), // m the student has moved
      slipped: round(slipAt(t1, s.ground), 3), // m the foot has slid back over the ground
      arrows: arrows.f.root.visible,
      tried: { ...s.tried },
      next: { ground: p.ground, step: p.step }, // what the big action does now
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.ground, snap.phase, snap.tried, snap.view, snap.mode]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  /** Jump to 'rest', 'hold', or a time in s of the slowed-down picture; stopped there. */
  function jump(at) {
    if (at === 'rest' || at === 0) {
      s.phase = 'rest';
      s.shown = 0;
    } else {
      const shown = at === 'hold' || at === 'end' ? SHOWN_TIME : Math.min(SHOWN_TIME, Math.max(0, Number(at) || 0));
      s.shown = shown;
      s.phase = shown >= SHOWN_TIME ? 'held' : 'push';
      if (s.phase === 'held') arrived();
    }
    drawScene();
    refresh();
    emitChange();
  }

  // ── start ───────────────────────────────────────────────────────────────────
  controls.enableRotate = controls.enableZoom = s.view === '3d';
  setCompact();
  for (const g of String(o.tried || '')
    .split(',')
    .map((x) => x.trim()))
    if (GROUND_IDS.includes(g)) s.tried[g] = true;
  ground.setSurface(s.ground);
  flyTo(viewPose(s.view), 0);
  drawScene();
  if (o.at === 'hold' || (o.at !== 'rest' && o.at !== '' && Number.isFinite(Number(o.at)) && Number(o.at) > 0))
    jump(o.at === 'hold' ? 'hold' : Number(o.at));
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
     * Change any of: ground ('hard' | 'sand' | 'slip': the student stands on it, ready), at ('rest' | 'hold' | seconds of
     * the slowed-down picture: jump there, stopped), tried (grounds already found, e.g. ['hard', 'sand'] or 'all'),
     * play (true: the push-off from standing), act (true: what the big action does now), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.tried != null && s.mode !== 'quiz') {
        const list = p.tried === 'all' ? GROUND_IDS : Array.isArray(p.tried) ? p.tried : String(p.tried).split(',');
        s.tried = {};
        for (const g of list.map((x) => String(x).trim())) if (GROUND_IDS.includes(g)) s.tried[g] = true;
      }
      if (p.ground && s.mode !== 'quiz') setGround(p.ground);
      if (p.view) await setView(p.view, { animate });
      if (p.at != null && s.mode !== 'quiz') jump(p.at);
      if (p.play) play({ silent: true });
      if (p.act) doAction();
      drawScene();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      hideHint();
      s.tried = {};
      for (const g of String(o.tried || '')
        .split(',')
        .map((x) => x.trim()))
        if (GROUND_IDS.includes(g)) s.tried[g] = true;
      setGround(GROUND_IDS.includes(o.ground) ? o.ground : 'hard', { quiet: true });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The student in the pose on screen and the ground: no arrows, labels or start line. */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'WalkingThirdLaw';
      copy.add(walker.root.clone(true), ground.exportGroup());
      return copy;
    },
  };
}
