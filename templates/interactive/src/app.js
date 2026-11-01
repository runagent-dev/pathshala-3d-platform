// {{title}}: the student view. Template figure: slide the marker along a ruler, read cm + mm × 0.1 cm, take a
// short test. It shows the shared student kit (@shared/student/…) and its clean শেখো sheet (one action, one result,
// one rule: docs/student-kit.md): the big numbered action button whose badge rings the part to touch, one result line
// and one rule line (add `examples` to cleanSheet when the student picks from a few cases). Replace the ruler with
// your object and keep the structure: 3D in ruler.js, maths in reading.js, strings in i18n.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createLoupe } from '@shared/student/loupe.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer } from '@shared/student/pointer.js';
import { createI18n } from './i18n.js';
import { createRuler } from './ruler.js';
import { LC, LENGTH, formatCm, read, roundTo } from './reading.js';

export const DEFAULTS = {
  value: 23, // starting position of the marker (mm)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  magnifier: true,
  coach: true, // the numbered ring on the part pulses at first (false: it stays still)
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' | 'transparent'
  shadow: true,
  sound: true,
};

const VIEW_DIRS = {
  front: new THREE.Vector3(0, 1, 0.42).normalize(), // from above, a little from the front: the marks read well
  '3d': new THREE.Vector3(0.45, 0.75, 0.9).normalize(),
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple'; // the student layout of student.css
  root.lang = t.lang;
  root.tabIndex = 0;
  // the clean sheet: the action's row, one result line, one rule line (room kept so the 3D view keeps its size)
  const ui = buildStudentShell(root, t, { learn: cleanSheet(t, { lines: { action: 1, outcome: 1, rule: 2 } }) });
  const sheet = bindCleanSheet(ui.learn);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 2, far: 4000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 20;
  controls.maxDistance = 1200;
  const M = createMaterials(stage.renderer);
  const ruler = createRuler({ materials: M, digits: N, unit: t('unit_cm') });
  scene.add(ruler.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const loupe = createLoupe({ stage, layer: ui.lensLayer, clearColor: 0xffffff });

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.3);
    sun.position.set(60, 300, 120);
    sun.target.position.set(75, 0, 0);
    sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 60, bottom: -60, near: 100, far: 500 });
    sun.shadow.radius = 10;
    const page = new THREE.Mesh(new THREE.PlaneGeometry(1200, 800), new THREE.ShadowMaterial({ opacity: 0.1 }));
    page.rotation.x = -Math.PI / 2;
    page.position.y = -3.01;
    page.receiveShadow = true;
    scene.add(sun, sun.target, page);
    ruler.root.traverse((m) => {
      if (m instanceof THREE.Mesh && !(m instanceof THREE.InstancedMesh)) m.castShadow = true;
    });
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = { pos: 0, view: o.view === '3d' ? '3d' : 'front', mode: 'explore', dragging: false, locked: false, userMovedCamera: false };
  const reading = () => read(s.pos);
  const snapshot = (r = reading()) => ({ value: r.value, cm: r.cm, mm: r.mm, lc: LC, unit: 'mm', locked: s.locked, mode: s.mode });

  // ── the panel: one result (the reading and its sum), one rule ───────────────
  sheet.rule(t('rule_reading'));
  let lastValue = null;
  function refresh() {
    const r = reading();
    ruler.highlight(!quiz || quiz.revealed ? r.value : -1); // in the test the colour waits for the answer
    sheet.outcome(t('out_reading', { v: formatCm(r.value), cm: r.cm, mm: r.mm, lc: '0.1' }));
    if (r.value !== lastValue) {
      lastValue = r.value;
      emit('change', snapshot(r));
    }
    stage.invalidate();
  }

  // ── the marker ──────────────────────────────────────────────────────────────
  function setPos(x) {
    const v = THREE.MathUtils.clamp(x, 0, LENGTH);
    if (s.dragging && Math.round(v) !== Math.round(s.pos)) audio.tick();
    s.pos = v;
    ruler.setMarker(v);
    refresh();
  }
  function animatePos(target, duration = 0.6) {
    const p0 = s.pos;
    return tweener.animate({ key: 'pos', duration, ease: ease.inOutCubic, onUpdate: (k) => setPos(p0 + (target - p0) * k) }).finished;
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewPose(view) {
    const target = new THREE.Vector3(LENGTH / 2, 0, 0);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const usable = Math.max(0.5, 1 - 64 / Math.max(stage.height, 200)); // room for the buttons on top
    const d = Math.max(70 / Math.tan(vfov / 2) / usable, (LENGTH + 24) / 2 / Math.tan(hfov / 2)) * 1.05;
    return { target, position: target.clone().addScaledVector(VIEW_DIRS[view], d) };
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
    loupe.setFollow(true);
    syncUI();
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  // the view starts from the front; dragging turns it, and then the "front" button appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
  });
  stage.onResize(() => !s.userMovedCamera && !tweener.busy && flyTo(viewPose(s.view), 0));

  // ── dragging the marker ─────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    const viaLens = loupe.contains(p.x, p.y);
    if (viaLens) {
      loupe.toNDC(p.x, p.y, ndc);
      raycaster.setFromCamera(ndc, loupe.camera);
    } else {
      ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
    }
    return raycaster.intersectObjects(ruler.pickable, true).length ? { viaLens } : null;
  }
  /** Pixels per millimetre along the ruler on screen, and its direction. */
  function axisOnScreen() {
    const a = ruler.root.localToWorld(new THREE.Vector3(s.pos, 0, 0)).project(camera);
    const b = ruler.root.localToWorld(new THREE.Vector3(s.pos + 10, 0, 0)).project(camera);
    const dx = ((b.x - a.x) / 2) * stage.width;
    const dy = (-(b.y - a.y) / 2) * stage.height;
    const len = Math.hypot(dx, dy) || 1;
    return { ux: dx / len, uy: dy / len, pxPerMm: len / 10 };
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const hit = pick(canvasPoint(e));
      if (!hit || drag) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, pos: s.pos, axis: axisOnScreen(), zoom: hit.viaLens ? loupe.zoom : 1 };
      tweener.cancel('pos');
      s.dragging = true;
      loupe.setFrozen(true);
      capturePointer(ui.canvasHost, e.pointerId); // never throws for a synthetic or lifted pointer
      emit('dragstart', snapshot());
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { ux, uy, pxPerMm } = drag.axis;
    setPos(drag.pos + ((e.clientX - drag.x) * ux + (e.clientY - drag.y) * uy) / drag.zoom / pxPerMm);
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    s.dragging = false;
    loupe.setFrozen(false);
    animatePos(roundTo(s.pos, LC), 0.12).then(() => emit('dragend', snapshot()));
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── the action: one big button, and the same numbered badge in a ring round the marker's grip ─────────────
  // The marker is dragged, so the button shows the move (a short slide and back) and the badge is a sign; a tap on
  // the grip itself starts the drag as before. For a tap action (start, push, drop) onAct does the action itself.
  const action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_drag',
    icon: ICONS.drag,
    target: () => ruler.grip(),
    radius: 24,
    avoid: [ui.corner, ui.hint],
    pulse: Boolean(o.coach),
    onAct: () => {
      if (s.locked) return lockedNudge();
      const p0 = s.pos;
      animatePos(Math.min(LENGTH, p0 + 12), 0.7).then((done) => done && animatePos(p0, 0.6));
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
  /** The right reading and three wrong ones from the usual mistakes. */
  function makeChoices(r) {
    const wrong = shuffle([r.value + 10, r.value - 10, r.value + 1, r.value - 1, r.cm * 10 + (10 - r.mm)]).filter(
      (v) => v >= 0 && v <= LENGTH && v !== r.value,
    );
    return shuffle([r.value, ...[...new Set(wrong)].slice(0, 3)]);
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 2, feedback: 2 }, // room for the longest question and worked answer: the 3D view keeps its size
    action, // its ring and badge hide during the test
    hooks: {
      enter() {
        s.mode = 'quiz';
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        syncUI();
        refresh();
      },
      async prepare(_i, alive, say) {
        say(t('q_text'));
        s.locked = false;
        await animatePos(Math.round(5 + Math.random() * (LENGTH - 10)), 0.6);
        if (!alive()) return null;
        s.locked = true;
        refresh();
        const r = reading();
        return {
          choices: makeChoices(r),
          expected: r.value,
          tolerance: LC / 2,
          label: (v) => `${N(formatCm(v))}<small>${t('unit_cm')}</small>`,
          meta: { value: r.value },
        };
      },
      reveal() {
        refresh();
        const r = reading();
        return `<b class="c-cm">${N(String(r.cm))}</b> + <b class="c-mm">${N(String(r.mm))}</b> × <b class="c-lc">${N('0.1')}</b> = <b>${N(formatCm(r.value))} ${t('unit_cm')}</b>`;
      },
      done() {
        s.locked = false;
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
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || b.closest('.pvc-lens')) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
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
    setPos(roundTo(s.pos, LC) + step * (e.shiftKey ? 10 : 1));
  });
  loupe.setTarget(() => ruler.tip());

  // ── start ───────────────────────────────────────────────────────────────────
  setPos(Number(o.value) || 0);
  setView(s.view, { animate: false });
  loupe.setVisible(Boolean(o.magnifier));
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
    getState: () => ({ ...snapshot(), view: s.view }),
    /** Change any of: value (mm), view, magnifier; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.magnifier != null) loupe.setVisible(Boolean(p.magnifier));
      if (p.view) await setView(p.view, { animate });
      if (p.value != null) {
        if (animate) await animatePos(THREE.MathUtils.clamp(Number(p.value), 0, LENGTH), 0.6);
        else setPos(Number(p.value));
      }
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      await Promise.all([setView('front'), animatePos(DEFAULTS.value)]);
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => ruler.root,
  };
}
