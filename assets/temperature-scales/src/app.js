// Temperature scales (book pages 163–164, topic 6.2, চিত্র ৬.০২), student view. The book's own picture, brought to life:
// three thermometers side by side, Celsius, Kelvin and Fahrenheit, with lines across at the fixed points (0 °C =
// 273.15 K = 32 °F, 100 °C = 373.15 K = 212 °F) and one temperature read on all three. One big button walks through the
// book's temperatures in the book's order (melting ice, boiling water, a room at 30 °C, absolute zero, the triple point
// of water); a drag on the mercury sets any other temperature. The panel gives the three readings, K = C + 273.15 with
// the student's numbers, "10 °C বেড়েছে = 10 K বেড়েছে" when the mercury has moved, and the rule in the book's words. Then
// a five-question test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer } from '@shared/student/pointer.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import {
  ABS_ZERO,
  BOIL_C,
  DRAG_MAX,
  ICE_C,
  K_OFFSET,
  LO_NORMAL,
  LO_ZOOM,
  ROOM_C,
  SCALES,
  SCALE_IDS,
  STEPS,
  STEP_C,
  TRIPLE_ATM,
  TRIPLE_C,
  TRIPLE_K,
  change,
  dragTo,
  fmt,
  makeQuiz,
  nextStep,
  readings,
  toF,
  toK,
} from './reading.js';
import { BULB_Y, FRONT_Z, H, PLATE_W, SCALE_COLORS, SPACING, TUBE_DX, TUBE_Z, createBoard } from './board.js';

export const DEFAULTS = {
  T: ROOM_C, // the temperature at the start, °C (the book's room: 30 °C)
  step: '', // '' | 'ice' | 'boil' | 'room' | 'abs' | 'triple': start on one of the book's temperatures
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light', // 'light' | 'transparent'
  shadow: true,
  sound: true,
};

const VIEW_DIRS = {
  front: new THREE.Vector3(0, 0.04, 1).normalize(),
  '3d': new THREE.Vector3(0.62, 0.32, 0.82).normalize(),
};
const MARGIN = { top: 74, bottom: 14, side: 10 };
const DOUBLE_TAP = 400;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const OFF = fmt(K_OFFSET);

  root.classList.add('pvc', 'ts');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'examples', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the three readings (the same temperature on the three scales), then K = C + 273.15 with the numbers
  const readEl = document.createElement('div');
  readEl.className = 'ts-read';
  readEl.setAttribute('role', 'group');
  readEl.setAttribute('aria-label', t('read_label'));
  readEl.innerHTML = SCALE_IDS.map(
    (id) =>
      `<div class="ts-col" data-s="${id}"><span class="ts-name">${t(`scale_${id}`)}</span><span class="ts-val" aria-live="polite"></span></div>`,
  ).join('');
  const eqEl = document.createElement('div');
  eqEl.className = 'ts-eq';
  eqEl.innerHTML = `<span class="ts-law" role="img" aria-label="${t('law_label', { off: OFF })}">T<sub>K</sub> = T<sub>C</sub> + ${N(OFF)}</span><span class="ts-sum" aria-live="polite"></span>`;
  $('.pvc-act-row').after(readEl);
  readEl.after(eqEl);
  const colVal = Object.fromEntries(SCALE_IDS.map((id) => [id, readEl.querySelector(`[data-s="${id}"] .ts-val`)]));
  const sumEl = eqEl.querySelector('.ts-sum');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 30, far: 3000, environment: 'studio-light', exposure: 1.02 });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 1.05;
  controls.maxPolarAngle = 1.75;
  controls.minAzimuthAngle = -1.1;
  controls.maxAzimuthAngle = 1.1;
  const bgOn = o.bg !== 'transparent';
  const shadowsOn = Boolean(o.shadow && bgOn);
  if (shadowsOn) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
  }
  const board = createBoard({ materials: createMaterials(stage.renderer), shadows: shadowsOn });
  scene.add(board.root);
  if (bgOn) scene.background = new THREE.Color('#5f8795');

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
    T: Number.isFinite(Number(o.T)) ? Math.min(DRAG_MAX, Math.max(ABS_ZERO, Number(o.T))) : ROOM_C, // °C
    moving: false, // the mercury is on its way (readings show whole degrees until it arrives)
    zoomed: false, // the tubes show the whole way down to absolute zero
    step: '', // the book's temperature last chosen, or ''
    base: ROOM_C, // where a change of temperature is measured from
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    show: SCALE_IDS, // the test: which scales' readings the picture shows
    revealed: false,
    userMovedCamera: false,
    dragging: false,
  };
  s.base = s.T;
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const disp = () => (s.moving || s.dragging ? Math.round(s.T) : s.T);
  const nextId = () => (s.step ? nextStep(s.step) : STEPS[0]);
  const inQuiz = () => s.mode === 'quiz';
  const onScale = (id, c) => (id === 'C' ? c : id === 'K' ? toK(c) : toF(c));

  // ── labels on the picture ───────────────────────────────────────────────────
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const CUR_SPOTS = [spot(7, 0), spot(7, -20), spot(7, 20)];
  const FIX_SPOTS = [spot(7, -14), spot(7, 14), spot(7, -33), spot(7, 33)];
  const TITLE_SPOTS = [spot(0, -18), spot(0, -38)];
  const pts = new Map();
  const ptOf = (id) => {
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    return pts.get(id);
  };
  const clampY = (c) => Math.min(H, Math.max(0, board.y(c)));
  const labelState = new Map();
  const want = new Map();
  function syncLabels() {
    want.clear();
    const hide = inQuiz() && !s.revealed;
    SCALE_IDS.forEach((id, i) => {
      const color = SCALE_COLORS[id];
      want.set(`title-${id}`, {
        text: `<b>${t(`scale_${id}`)}</b>`,
        point: () => ptOf(`title-${id}`).set(board.tubeX[i] + TUBE_DX, H + 26, 0),
        spots: TITLE_SPOTS,
        kind: 'title',
        color,
      });
      if (!inQuiz() || s.revealed || s.show.includes(id))
        want.set(`cur-${id}`, {
          text: t('lbl_cur', { v: fmt(onScale(id, disp())), u: SCALES[id].unit }),
          point: () => ptOf(`cur-${id}`).set(board.tubeX[i] + PLATE_W / 2, clampY(s.T), FRONT_Z),
          spots: CUR_SPOTS,
          kind: 'cur',
          color,
        });
      if (!hide)
        for (const c of s.zoomed ? [BOIL_C, ICE_C, ABS_ZERO] : [BOIL_C, ICE_C]) {
          if (Math.abs(s.T - c) < 0.5 && !s.moving) continue; // the temperature's own label says it
          want.set(`fix-${c}-${id}`, {
            text: t('lbl_fix', { v: fmt(onScale(id, c)), u: SCALES[id].unit }),
            point: () => ptOf(`fix-${c}-${id}`).set(board.tubeX[i] + PLATE_W / 2, board.y(c), FRONT_Z),
            spots: FIX_SPOTS,
            kind: 'fix',
            color,
            optional: true,
          });
        }
    });
    if (!inQuiz())
      want.set('mercury', {
        text: t('mercury'),
        point: () => ptOf('mercury').set(board.tubeX[0] + TUBE_DX, BULB_Y, TUBE_Z),
        spots: [spot(30, 12), spot(30, 28)],
        kind: 'part',
        optional: true,
      });
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.kind}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: w.kind, color: w.color, spots: w.spots, optional: w.optional });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text });
        labelState.set(id, key);
      }
    }
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const written = new Map();
  const put = (el, key, html) => {
    if (written.get(key) === html) return;
    el.innerHTML = html;
    written.set(key, html);
  };
  function ruleHtml() {
    const c = s.step ? STEP_C[s.step] : null;
    if (s.step === 'ice') return t('rule_ice', { atm: 1, c: fmt(ICE_C), k: fmt(toK(ICE_C)), f: fmt(toF(ICE_C)) });
    if (s.step === 'boil') return t('rule_boil', { c: fmt(BOIL_C), k: fmt(toK(BOIL_C)), f: fmt(toF(BOIL_C)) });
    if (s.step === 'room') return t('rule_room', { off: OFF, c: fmt(c), k: fmt(toK(c)) });
    if (s.step === 'abs') return t('rule_abs', { a: fmt(ABS_ZERO) });
    if (s.step === 'triple') return t('rule_triple', { p: TRIPLE_ATM, c: fmt(TRIPLE_C), k: fmt(TRIPLE_K) });
    return t('rule_start');
  }
  function outcomeHtml() {
    const d = s.moving || inQuiz() ? 0 : change(s.T, s.base);
    if (!d) return t('out_drag');
    return t(d > 0 ? 'out_up' : 'out_down', { d: Math.abs(d) });
  }
  function refresh() {
    const c = disp();
    const r = readings(c);
    for (const id of SCALE_IDS) put(colVal[id], `val-${id}`, t('read_val', { v: fmt(r[id]), u: SCALES[id].unit }));
    put(sumEl, 'sum', t('sum', { c: fmt(c), off: OFF, k: fmt(r.K) }));
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    sheet.choose(s.step || null);
    sheet.next(nextId());
    if (action) action.set({ step: STEPS.indexOf(nextId()) + 1, label: `act_${nextId()}` });
    syncLabels();
    emitChange();
    stage.invalidate();
  }

  // ── the temperature and the scale ───────────────────────────────────────────
  function setT(c) {
    s.T = c;
    board.setLevel(c);
    refresh();
  }
  function moveT(target, duration = 1) {
    const t0 = s.T;
    if (!duration || t0 === target) {
      tweener.cancel('T');
      s.moving = false;
      setT(target);
      return Promise.resolve(true);
    }
    s.moving = true;
    return tweener.animate({ key: 'T', duration, ease: ease.inOutCubic, onUpdate: (k) => setT(t0 + (target - t0) * k) }).finished.then((done) => {
      if (done) {
        s.moving = false;
        setT(target);
      }
      return done;
    });
  }
  function zoomTo(on, duration = 1) {
    s.zoomed = on;
    const l0 = board.lo;
    const l1 = on ? LO_ZOOM : LO_NORMAL;
    if (!duration || l0 === l1) {
      tweener.cancel('lo');
      board.setLo(l1);
      refresh();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: 'lo',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          board.setLo(l0 + (l1 - l0) * k);
          refresh();
        },
      })
      .finished.then((done) => {
        if (done) refresh();
        return done;
      });
  }
  /** One of the book's temperatures: the mercury goes there (and the tubes show the whole range for absolute zero). */
  function goStep(id, { animate = true } = {}) {
    if (!STEPS.includes(id)) return Promise.resolve(false);
    s.step = id;
    s.base = STEP_C[id];
    hintOff();
    const zoomNow = id === 'abs';
    const long = zoomNow || s.zoomed;
    const run = Promise.all([moveT(STEP_C[id], animate ? (long ? 1.5 : 1) : 0), zoomTo(zoomNow, animate ? (long ? 1.5 : 0) : 0)]);
    refresh();
    return run;
  }
  function goHome() {
    tweener.cancel('T');
    tweener.cancel('lo');
    s.step = '';
    s.base = DEFAULTS.T;
    s.moving = false;
    s.zoomed = false;
    board.setLo(LO_NORMAL);
    setT(DEFAULTS.T);
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const fitBox = new THREE.Box3(new THREE.Vector3(-18, -26, -8), new THREE.Vector3(0, H + 28, 4));
  const LABEL_PX = 92; // room right of the last plate for a label
  /** Where the frame is wide and short the tubes stand further apart, so each label has room beside its own tube. */
  function layoutFor() {
    const perMm = Math.max(0.2, (stage.height - MARGIN.top - MARGIN.bottom) / (fitBox.max.y - fitBox.min.y));
    const wanted = PLATE_W + (LABEL_PX + 10) / perMm;
    const fits = ((stage.width - 2 * MARGIN.side - LABEL_PX) / perMm - PLATE_W - 24) / 2;
    board.setSpacing(Math.round(Math.min(240, Math.max(SPACING, Math.min(wanted, fits)))));
    fitBox.max.x = board.tubeX[2] + PLATE_W / 2 + 4 + LABEL_PX / perMm;
  }
  function viewPose(view = s.view) {
    layoutFor();
    return fitPose({ box: fitBox, dir: VIEW_DIRS[view].clone(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
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
        controls.target.lerpVectors(t0, aim, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    return flyTo(viewPose(s.view), animate ? 0.7 : 0);
  }
  // the view starts from the front; a drag on the board turns it, and then the front button appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  // the same test the shell uses for the panel beside the 3D (landscape, at least 600 px wide): for the CSS of this figure
  function sideCheck() {
    const r = root.getBoundingClientRect();
    root.dataset.side = r.width >= r.height && r.width >= 600 ? '1' : '0';
    root.dataset.short = r.height <= 460 ? '1' : '0';
    root.dataset.compact = !(r.width >= r.height && r.width >= 600) && r.height < 600 ? '1' : '0';
  }
  stage.onResize(() => {
    sideCheck();
    if (!s.userMovedCamera) flyTo(viewPose(s.view), 0);
    refresh();
  });
  sideCheck();

  // ── the action: the big button, the ring on the top of the mercury ─────────
  const ringPoint = new THREE.Vector3();
  function doNext() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not skip a step
    lastAct = now();
    goStep(nextId());
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: `act_${nextId()}`,
    target: () => board.columnTop(ringPoint, 0),
    radius: 22,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => {
      audio.unlock();
      doNext();
    },
  });

  // ── dragging the mercury ────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -TUBE_Z);
  const hitPoint = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function ray(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  const pick = (p) => {
    ray(p);
    return raycaster.intersectObjects(board.pickables, false).length > 0;
  };
  /** The temperature (°C) under a point of the view, read off the scale at the tubes' depth; null if the ray misses. */
  function temperatureAt(p) {
    ray(p);
    return raycaster.ray.intersectPlane(plane, hitPoint) ? board.cOf(hitPoint.y) : null;
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = canvasPoint(e);
      if (drag || !pick(p)) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const at = temperatureAt(p);
      if (at == null) return;
      tweener.cancel('T');
      s.moving = false;
      s.dragging = true;
      drag = { id: e.pointerId, offset: s.T - at };
      capturePointer(ui.canvasHost, e.pointerId);
      emit('dragstart', snapshot());
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const p = canvasPoint(e);
    if (!drag) {
      if (e.pointerType === 'mouse') ui.canvasHost.style.cursor = pick(p) ? 'grab' : '';
      return;
    }
    if (e.pointerId !== drag.id) return;
    const at = temperatureAt(p);
    if (at == null) return;
    const next = dragTo(at + drag.offset, s.zoomed);
    if (next !== s.T) {
      if (Math.round(next) !== Math.round(s.T)) audio.tick();
      setT(next);
    }
    if (s.zoomed && next === ABS_ZERO && at + drag.offset < ABS_ZERO - 3) showHint(t('hint_abs'), { duration: 2400 });
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    s.dragging = false;
    refresh();
    emit('dragend', snapshot());
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
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
    const r = readings(s.T);
    return {
      T: r.C, // °C
      C: r.C,
      K: r.K,
      F: r.F,
      step: s.step,
      next: nextId(),
      zoomed: s.zoomed,
      change: change(s.T, s.base),
      locked: s.locked,
      mode: s.mode,
      view: s.view,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.T, snap.step, snap.zoomed, snap.mode, snap.view, snap.change]);
    if (key === lastEmitted && !force) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the test ────────────────────────────────────────────────────────────────
  let questions = [];
  const baseKind = (k) => (k === 'fboil' || k === 'fice' ? 'f' : k);
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 2, feedback: 3 }, // room for the longest question and worked answer: the 3D view keeps its size
    action, // its ring and badge hide during the test
    hooks: {
      enter() {
        s.mode = 'quiz';
        syncUI();
        refresh();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.revealed = false;
        board.setGuides(true);
        syncUI();
        // back to what the learn sheet was showing
        const c = s.step ? STEP_C[s.step] : DEFAULTS.T;
        zoomTo(s.step === 'abs', 0.6);
        moveT(c, 0.6);
        refresh();
      },
      async prepare(i, alive, say) {
        if (i === 0) questions = makeQuiz();
        const q = questions[i];
        s.locked = false;
        s.revealed = false;
        s.show = q.scene.show;
        board.setGuides(false);
        zoomTo(false, 0.5);
        say(t(`q_${q.kind}`, q.vars).replaceAll('&nbsp;', '\u00a0'));
        if (q.scene.from != null) {
          await moveT(q.scene.from, 0);
          await moveT(q.scene.c, 1.2);
        } else await moveT(q.scene.c, 0.7);
        if (!alive()) return null;
        s.locked = true;
        refresh();
        return {
          spec: q,
          choices: q.choices,
          expected: q.expected,
          tolerance: 0.001,
          label: (v) => `${N(fmt(v))}<small>${q.unit}</small>`,
          meta: { kind: q.kind, unit: q.unit },
        };
      },
      reveal(q, correct, picked) {
        s.revealed = true;
        board.setGuides(true);
        refresh();
        const spec = q.spec;
        const k = baseKind(spec.kind);
        const vars = { ...spec.vars, off: OFF };
        let html = t(`why_${k}`, vars);
        if (!correct) {
          const note = spec.notes[String(picked.value)];
          if (note) html += ` ${t(`mis_${k}_${note}`, vars)}`;
        }
        return html;
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
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && !s.locked) goStep(b.dataset.example);
    if (b.dataset.act === 'home' && !s.locked) {
      goHome();
      setView('front');
    }
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
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    if (s.locked) return lockedNudge();
    tweener.cancel('T');
    s.moving = false;
    const next = dragTo(Math.round(s.T) + step * (e.shiftKey ? 10 : 1), s.zoomed);
    setT(next);
    if (s.zoomed && next === ABS_ZERO && step < 0) showHint(t('hint_abs'), { duration: 2400 });
  });

  // ── start ───────────────────────────────────────────────────────────────────
  board.setLevel(s.T);
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const ready = (async () => {
    if (STEPS.includes(o.step)) await goStep(o.step, { animate: false });
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
    /** Change any of: step ('ice' | 'boil' | 'room' | 'abs' | 'triple'), T (°C), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step) await goStep(p.step, { animate });
      if (p.T != null) {
        const c = Math.min(DRAG_MAX, Math.max(ABS_ZERO, Number(p.T)));
        s.base = c;
        await Promise.all([zoomTo(c < LO_NORMAL + 4, animate ? 0.8 : 0), moveT(c, animate ? 0.8 : 0)]);
      }
      return snapshot();
    },
    async reset() {
      quiz.stop();
      goHome();
      await setView('front', { animate: false });
      refresh();
      emitChange(true);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The three thermometers on their board, in millimetres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Temperature scales';
      for (const child of board.root.children) {
        if (child.name === 'Board' || child.name.startsWith('Thermometer') || child.name.startsWith('Fixed point')) g.add(child.clone(true));
      }
      return g;
    },
  };
}
