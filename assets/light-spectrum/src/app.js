// The nature of light (book pp212–213, topic 8.1, figure 8.01): the student view. The book's নিজে করো, exact: a CD held in
// sunlight throws the whole spectrum on a nearby wall. One action at a time, the camera going close each time: the sunlight
// falls and the colours come out (a white patch and, past it, the band from violet to red); the disc's fine grooves; then a
// marker along the band that names the colour, gives its wavelength, carries its wave and reads the eye's sensitivity in the
// panel; past the two ends the wall shows nothing, though the light is there. The rays are traced (reading.js) and drawn as
// crisp lines over the view (rays.js). The panel is the kit's clean sheet: one action, one result, one rule.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createCoach } from '@shared/student/coach.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  alongWall,
  clampNm,
  COLOURS,
  DISC,
  isVisible,
  kindOf,
  landing,
  MAX_NM,
  MIN_NM,
  nmAt,
  PITCH_NM,
  pureColour,
  PEAK,
  sensitivity,
  shuffle,
  SPOT,
  TO_SUN,
  VISIBLE,
  WALL,
  WALL_NORMAL,
  wallPoint,
} from './reading.js';
import { createSetting, FRAMES } from './scene.js';

export const DEFAULTS = {
  show: 'none', // 'none' | 'light' | 'grooves' | 'wave' | 'all'
  nm: 550, // the wavelength on the marker
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

const STEPS = ['light', 'grooves', 'sweep', 'ir', 'uv', 'all'];
const IR_NM = 760;
const FAN_DIM = 0.32; // how strongly the fan shows behind a chosen ray
const UV_NM = 360;
const MARGINS = { top: 12, bottom: 10, side: 8 };
const INK = { dark: '#22303c', sun: '#8a4f00' };
const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'lab');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: the sheet of one action, one result, one rule ────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: COLOURS.map(({ id }) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const graph = createGraph(t, { onScrub: (nm) => panelScrub(nm) });
  ui.learn.querySelector('.pvc-rule').before(graph.el);
  const caption = document.createElement('p');
  caption.className = 'lab-cap';
  caption.innerHTML = t('cap_book');
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'lab-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 4, far: 900, environmentIntensity: 0.7 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(50);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-55);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(30);
  const setting = createSetting({ stage, shadow: Boolean(o.shadow) });
  const rays = createRays({ stage, host: ui.canvasHost, t });
  const v = rays.view;

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    done: new Set(), // the steps the student has seen
    focus: null, // what is being looked at: one of STEPS, 'pick' (a colour chosen), or null at the start
    nm: clampNm(o.nm),
    touched: false, // the marker has been moved by hand
    busy: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    frame: 'start', // what the camera shows (FRAMES)
    drag: null,
  };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  /** The marks in the 3D scene follow the drawing. */
  function applyMarks() {
    setting.sun(v.beam >= 1 ? 1 : 0);
    setting.spectrum(v.out);
    setting.white(v.out >= 1 ? 1 : v.out);
  }
  function setNm(nm) {
    s.nm = clampNm(nm);
    v.nm = s.nm;
    graph.set(s.nm);
  }
  const marked = () => s.done.has('sweep') || s.focus === 'pick' || s.focus === 'sweep' || s.touched;
  /** Everything drawn in its final place, at once. */
  function settle() {
    const lit = s.done.has('light');
    v.beam = lit ? 1 : 0;
    v.out = lit ? 1 : 0;
    v.lens = s.focus === 'grooves' ? 1 : 0;
    const on = lit && marked() && s.focus && s.focus !== 'grooves' && s.focus !== 'light' && s.focus !== 'all';
    v.scale = on ? 1 : 0;
    v.marker = on ? 1 : 0;
    v.chosen = on ? 1 : 0;
    v.wave = on ? 1 : 0;
    v.fan = on ? FAN_DIM : 1;
    v.tags = [];
    s.frame = frameFor(s.focus);
    applyMarks();
  }
  function frameFor(focus) {
    if (!focus) return 'start';
    if (focus === 'light' || focus === 'all') return 'light';
    if (focus === 'grooves') return 'grooves';
    if (focus === 'ir' || focus === 'uv') return 'beyond';
    return 'wall';
  }

  const RUNS = ['beam', 'out', 'lens', 'nm', 'ink', 'camera'];
  function stopRun() {
    ++token;
    for (const k of RUNS) tweener.cancel(k);
    s.busy = false;
  }
  function tweenOf(alive) {
    return (key, duration, onUpdate, e = ease.inOutSine) =>
      tweener.animate({
        key,
        duration,
        ease: e,
        onUpdate: (k) => {
          if (alive()) {
            onUpdate(k);
            applyMarks();
            draw();
          }
        },
      }).finished;
  }
  /** The marker, the scale, the ray and its wave come in or go out together. */
  function ink(tween, on, duration = 0.5) {
    const from = { scale: v.scale, marker: v.marker, chosen: v.chosen, wave: v.wave, fan: v.fan };
    const to = on ? { scale: 1, marker: 1, chosen: 1, wave: 1, fan: FAN_DIM } : { scale: 0, marker: 0, chosen: 0, wave: 0, fan: 1 };
    return tween('ink', duration, (k) => {
      for (const key of Object.keys(to)) v[key] = from[key] + (to[key] - from[key]) * k;
    });
  }

  /**
   * One step of the story, told by the camera: it goes to the place first, what was there leaves, and only then the new part
   * comes, cause before effect.
   */
  async function run(name) {
    stopRun();
    const my = token;
    const alive = () => my === token;
    const tween = tweenOf(alive);
    s.busy = true;
    s.focus = name;
    clearLabels();
    draw();
    const lens0 = v.lens;
    const closing = lens0 > 0 && name !== 'grooves' ? tween('lens', 0.3, (k) => (v.lens = lens0 * (1 - k))) : true;
    const flying = fly(frameFor(name), 0.95);
    if (name === 'grooves' || name === 'light' || name === 'all') await Promise.all([ink(tween, false, 0.35), closing]);
    if (!alive()) return false;
    if (name === 'all') {
      await flying;
      if (!alive()) return false;
    }
    if (name === 'light') {
      await flying;
      if (!alive()) return false;
      await tween('beam', 0.8, (k) => (v.beam = k), ease.inOutCubic);
      if (!alive()) return false;
      v.beam = 1;
      audio.tick();
      await tween('out', 1.4, (k) => (v.out = k), ease.inOutCubic);
      if (!alive()) return false;
    }
    if (name === 'grooves') {
      await flying;
      if (!alive()) return false;
      await tween('lens', 0.6, (k) => (v.lens = k), ease.outCubic);
      if (!alive()) return false;
    }
    if (name === 'sweep') {
      setNm(VISIBLE[0]);
      await Promise.all([flying, closing, ink(tween, true, 0.7)]);
      if (!alive()) return false;
      await tween('nm', 4.2, (k) => setNm(Math.round(VISIBLE[0] + (VISIBLE[1] - VISIBLE[0]) * k)), ease.inOutSine);
      if (!alive()) return false;
    }
    if (name === 'ir' || name === 'uv') {
      const from = s.nm;
      const to = name === 'ir' ? IR_NM : UV_NM;
      await Promise.all([
        flying,
        closing,
        ink(tween, true, 0.4),
        tween('nm', 1.2, (k) => setNm(Math.round(from + (to - from) * k)), ease.inOutCubic),
      ]);
      if (!alive()) return false;
    }
    s.done.add(name);
    s.busy = false;
    audio.tick();
    if (name === 'all') audio.success();
    draw();
    emitChange();
    if (name === 'sweep') coach?.start(600);
    return true;
  }

  /** A word of the row: the marker goes to that colour. The light comes first, whatever the order. */
  async function goToColour(nm) {
    stopRun();
    if (!s.done.has('light')) {
      s.done.add('light');
      s.focus = 'pick';
      settle();
      s.frame = 'start';
    }
    const my = token;
    const alive = () => my === token;
    const tween = tweenOf(alive);
    s.focus = 'pick';
    s.busy = true;
    clearLabels();
    draw();
    const lens0 = v.lens;
    const from = s.nm;
    await Promise.all([
      fly('wall', 0.8),
      lens0 > 0 ? tween('lens', 0.3, (k) => (v.lens = lens0 * (1 - k))) : true,
      ink(tween, true, 0.5),
      tween('nm', 0.8, (k) => setNm(Math.round(from + (nm - from) * k)), ease.inOutCubic),
    ]);
    if (!alive()) return;
    s.touched = true;
    s.busy = false;
    draw();
    emitChange();
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function poseNow() {
    const f = FRAMES[s.frame];
    dirFrom(f.az, f.el, camDir);
    return fitPose({ box: f.box, dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGINS });
  }
  function applyCamera() {
    if (s.userMovedCamera) return;
    const pz = poseNow();
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, pz.position, k);
      controls.target.lerpVectors(camFrom.target, pz.target, k);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
    }
    controls.update();
  }
  /** The camera goes to a frame. Its promise settles when it arrives (or a finger takes over). */
  function fly(frame, duration = 0.8) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      s.view = 'front';
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    s.frame = frame;
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
    if (animate) fly(s.frame, 0.8);
    else camK = 1;
    stage.invalidate();
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    coach?.interrupt();
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  });
  stage.onResize(() => {
    s.userMovedCamera = false;
    if (s.view === '3d') {
      s.view = 'front';
      syncUI();
    }
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
  });

  // ── labels on the picture: few and short, each pinned to what it names ───────────────────────────────────
  let action = null;
  let coach = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, note, ui.$('.pvc-panel-toggle'), () => rays.boxes()] });
  const shown = new Map();
  const pts = new Map();
  /** A label pinned to a world point. `spots` are the places it may take, best first; key labels have no `optional`. */
  function label(id, on, text, point, color, spots, optional = false) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).set(point.x, point.y, point.z);
    const was = shown.get(id);
    if (!was) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', optional });
      shown.set(id, { text });
      return;
    }
    if (was.text !== text) {
      anno.setText(id, text);
      was.text = text;
    }
  }
  function clearLabels() {
    for (const id of [...shown.keys()]) anno.remove(id);
    shown.clear();
  }
  const SKYWARD = { x: SPOT.x + TO_SUN.x * 7, y: SPOT.y + TO_SUN.y * 7, z: SPOT.z + TO_SUN.z * 7 };
  const whiteAt = landing(0);
  const wallAt = wallPoint(WALL.half - 3.4, WALL.height - 2.4);
  const cdAt = { x: DISC.centre.x - DISC.side.x * 5.6, y: DISC.centre.y - 1.6, z: DISC.centre.z - DISC.side.z * 5.6 };
  const bandAt = landing(640);
  const SPOTS = {
    sun: [
      { dx: -52, dy: 0 },
      { dx: -52, dy: 16 },
      { dx: 46, dy: 12 },
    ],
    cd: [
      { dx: 24, dy: 18 },
      { dx: -6, dy: 34 },
      { dx: 26, dy: -16 },
    ],
    wall: [
      { dx: 0, dy: 0 },
      { dx: 10, dy: 14 },
    ],
    white: [
      { dx: 2, dy: 26 },
      { dx: 40, dy: 22 },
      { dx: 0, dy: -24 },
    ],
    spectrum: [
      { dx: -66, dy: -12 },
      { dx: -66, dy: 12 },
      { dx: 0, dy: -44 },
    ],
    marker: [
      { dx: -82, dy: 0 },
      { dx: 40, dy: -24 },
      { dx: 0, dy: -24 },
      { dx: -40, dy: -24 },
      { dx: 0, dy: 24 },
    ],
    lambda: [
      { dx: 0, dy: -18 },
      { dx: 26, dy: -26 },
      { dx: -26, dy: -26 },
      { dx: 8, dy: 56 },
    ],
  };
  const name = (nm) => t(kindOf(nm) === 'uv' || kindOf(nm) === 'ir' ? `c_${kindOf(nm)}` : `ex_${kindOf(nm)}`);
  const handle = new THREE.Vector3();
  function labels() {
    const calm = !s.busy && camK >= 1;
    const q = s.quiz;
    const lit = v.beam >= 1;
    const f = s.focus;
    label('sun', calm && lit && !q && (f === 'light' || f === 'all'), t('l_sun'), SKYWARD, INK.sun, SPOTS.sun);
    label('cd', calm && !q && (f === null || f === 'light' || f === 'grooves'), t('l_cd'), cdAt, INK.dark, SPOTS.cd);
    label('wall', calm && !q && f === null, t('l_wall'), wallAt, INK.dark, SPOTS.wall);
    label('white', calm && !q && f === 'light' && v.out >= 1, t('l_white'), whiteAt, INK.dark, SPOTS.white);
    label('spectrum', calm && !q && f === 'light' && v.out >= 1, t('l_spectrum'), bandAt, INK.dark, SPOTS.spectrum);
    const marking = !q && v.marker >= 1;
    if (marking) handle.copy(rays.scaleAt(s.nm));
    label('marker', marking, t('l_marker', { nm: t.num(s.nm), name: name(s.nm) }), handle, INK.dark, SPOTS.marker);
    label('lambda', !q && v.wave >= 1 && !s.drag && calm, t('l_lambda'), v.bracket, INK.dark, SPOTS.lambda, true);
    label('visible', calm && !q && f === 'all', t('l_visible', range()), bandAt, INK.dark, SPOTS.spectrum);
    anno.update(); // places them now, on this frame's drawing (it asks for no new frame)
  }
  stage.onAfterRender(labels);

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function phase() {
    if (s.busy) return 'busy';
    for (const n of STEPS) if (!s.done.has(n)) return n;
    return 'again';
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    const ph = phase();
    if (ph === 'busy') return;
    if (ph === 'again') return home();
    return run(ph);
  }
  function pick(id) {
    if (s.locked) return lockedNudge();
    const c = COLOURS.find((x) => x.id === id);
    if (!c) return;
    audio.unlock();
    goToColour(c.nm);
  }

  // ── the marker under a finger ──────────────────────────────────────────────────────────────────────────
  const near = new THREE.Vector3();
  const far = new THREE.Vector3();
  const nrm = new THREE.Vector3(WALL_NORMAL.x, WALL_NORMAL.y, WALL_NORMAL.z);
  const onPlane = new THREE.Vector3();
  const atWall = new THREE.Vector3(WALL.at.x, WALL.at.y, WALL.at.z);
  /** The point of the wall under a pixel, into onPlane. */
  function toWall(x, y) {
    near.set((x / stage.width) * 2 - 1, 1 - (y / stage.height) * 2, 0.5).unproject(camera);
    far.copy(near).sub(camera.position).normalize();
    const k = atWall.clone().sub(camera.position).dot(nrm) / far.dot(nrm);
    if (!(k > 0)) return false;
    onPlane.copy(camera.position).addScaledVector(far, k);
    return true;
  }
  const hostXY = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** A finger's wavelength on the band, or null when it is elsewhere. Generous in px: the band can be small on a phone. */
  function nmUnder(x, y, touch) {
    if (!s.done.has('light') || !toWall(x, y)) return null;
    if (onPlane.y < landing(MIN_NM).y - 1 || onPlane.y > landing(MAX_NM).y + 1) return null;
    const reach = touch ? 56 : 44;
    const sideways = Math.abs(x - rays.bandPoint(550).x);
    const knob = v.marker > 0 && Math.hypot(x - v.handle.x, y - v.handle.y) < reach * 0.7;
    if (sideways > reach && !knob) return null;
    return nmAt(onPlane.y);
  }
  function moved(nm) {
    const next = clampNm(Math.round(nm));
    if (next === s.nm) return;
    setNm(next);
    s.touched = true;
    draw();
    emitChange();
  }
  /** The marker comes out at once when it is first taken. */
  function takeMarker() {
    stopRun();
    if (camK < 1) fly(s.frame, 0.4); // a flight cut short still arrives
    if (s.focus === 'light' || s.focus === 'grooves' || s.focus === 'all' || s.focus === null) s.focus = 'pick';
    s.touched = true;
    v.lens = 0;
    v.scale = 1;
    v.marker = 1;
    v.chosen = 1;
    v.wave = 1;
    v.fan = FAN_DIM;
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      const p = hostXY(e);
      down = { x: p.x, y: p.y, at: performance.now() };
      if (s.locked) return;
      const nm = nmUnder(p.x, p.y, e.pointerType === 'touch');
      if (nm == null) return;
      coach?.objectUsed();
      coach?.interrupt();
      controls.enabled = false;
      capturePointer(ui.canvasHost, e.pointerId);
      takeMarker();
      s.drag = { id: e.pointerId, moved: 0 };
      action.hide('drag');
      audio.unlock();
      emit('dragstart', { part: 'marker' });
      moved(nm);
      e.preventDefault();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    const p = hostXY(e);
    if (!toWall(p.x, p.y)) return;
    moved(nmAt(Math.min(landing(MAX_NM).y, Math.max(landing(MIN_NM).y, onPlane.y))));
  });
  function endDrag(e) {
    const g = s.drag;
    if (!g || e.pointerId !== g.id) return;
    releasePointer(ui.canvasHost, e.pointerId);
    s.drag = null;
    controls.enabled = true;
    action.show('drag');
    coach?.objectReleased();
    emit('dragend', { part: 'marker' });
    draw();
  }
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  ui.canvasHost.addEventListener('pointerup', (e) => {
    const wasDrag = Boolean(s.drag);
    endDrag(e);
    if (wasDrag || !down) return;
    const p = hostXY(e);
    const quick = performance.now() - down.at < 600;
    const far2 = Math.hypot(p.x - down.x, p.y - down.y);
    down = null;
    if (far2 > 8 || !quick) return;
    // a tap on the disc is the same action
    ndc.set((p.x / stage.width) * 2 - 1, 1 - (p.y / stage.height) * 2);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(setting.hit, false).length) act();
  });
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  function panelScrub(nm) {
    if (s.locked) return lockedNudge();
    if (!s.done.has('light')) return;
    if (v.marker < 1) {
      takeMarker();
      if (s.frame !== 'wall' && s.frame !== 'beyond') fly('wall', 0.7);
    }
    coach?.objectUsed();
    moved(nm);
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  v.words = [t('ex_violet'), t('ex_red')];
  const range = () => ({ a: VISIBLE[0], b: VISIBLE[1] });
  function outcome() {
    if (s.focus === 'all') return t('out_all', range());
    if (v.marker > 0) {
      if (!isVisible(s.nm)) return t('out_hidden', { nm: s.nm, name: name(s.nm) });
      // the colour goes in after the digits are turned: they would turn inside it too
      const sens = sensitivity(s.nm);
      const value = sens < 0.005 ? '0' : sens >= 0.995 ? '1' : sens.toFixed(2);
      return `<i class="lab-swatch" style="background:${pureColour(s.nm)}"></i>${t('out_nm', { nm: s.nm, name: name(s.nm), s: value })}`;
    }
    if (s.focus === 'grooves') return t('out_grooves', { d: PITCH_NM / 1000 });
    return s.done.has('light') ? t('out_light') : t('out_start');
  }
  function rule() {
    if (s.focus === 'all') return t('rule_done', range());
    if (v.marker > 0) {
      if (s.nm < VISIBLE[0]) return t('rule_uv', range());
      if (s.nm > VISIBLE[1]) return t('rule_ir', range());
      return t('rule_colour', { peak: PEAK });
    }
    if (s.focus === 'grooves') return t('rule_grooves');
    return s.done.has('light') ? t('rule_light') : t('rule_start');
  }
  const ACTIONS = {
    busy: ['act_wait', ''],
    light: ['act_light', 1],
    grooves: ['act_grooves', 2],
    sweep: ['act_sweep', 3],
    ir: ['act_ir', 4],
    uv: ['act_uv', 5],
    all: ['act_all', 6],
    again: ['act_again', ''],
  };
  function panel() {
    note.textContent = t(v.wave <= 0 ? 'note_rays' : isVisible(s.nm) ? 'note_wave' : 'note_beyond');
    graph.whole(s.focus === 'all' && !s.quiz);
    graph.mark(v.marker > 0);
    v.named = v.marker > 0 && !s.quiz;
    if (s.quiz) return;
    sheet.outcome(outcome());
    sheet.rule(rule());
    const kind = kindOf(s.nm);
    sheet.choose(v.marker > 0 && COLOURS.some((c) => c.id === kind) ? kind : null);
    const ph = phase();
    const [word, step] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled });
    }
  }
  function draw() {
    panel();
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  const pointAt = new THREE.Vector3();
  /** The ring never lies on the marker or on its label: while it would, only the button shows the action. */
  function clashes(p) {
    if (v.marker <= 0) return false;
    const c = rays.project(p);
    if (Math.hypot(c.x - v.handle.x, c.y - v.handle.y) < 40) return true;
    const b = anno.box('marker');
    const near = 30;
    return Boolean(b) && c.x > b.left - near && c.x < b.right + near && c.y > b.top - near && c.y < b.bottom + near;
  }
  const spotAt = new THREE.Vector3(SPOT.x, SPOT.y, SPOT.z);
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_light',
    target: () => {
      const ph = phase();
      if (s.locked || s.busy || s.drag || camK < 1 || !STEPS.includes(ph) || ph === 'all') return null;
      if (ph === 'sweep' && s.frame === 'grooves') {
        const p = landing(550);
        return pointAt.set(p.x, p.y, p.z).lerp(spotAt, 0.66); // on the fan, the part in view
      }
      // the ring goes where the question is: just under the scale's 400, the empty wall past red, the empty wall before violet
      if (ph === 'sweep') pointAt.copy(rays.scaleAt(350));
      else if (ph === 'ir' || ph === 'uv') {
        const p = landing(ph === 'ir' ? 780 : 350);
        pointAt.set(p.x, p.y, p.z);
      } else pointAt.set(SPOT.x, SPOT.y, SPOT.z);
      return clashes(pointAt) ? null : pointAt;
    },
    radius: 22,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes(), () => rays.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });
  if (o.coach) {
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_drag',
        labelAt: ['right', 'below'],
        inset: { bottom: 16 },
        candidates: () => {
          const q = rays.bandPoint(540);
          return [{ x: q.x, y: q.y }];
        },
        grabbable: (p) => nmUnder(p.x, p.y, true) != null,
      },
    });
  }

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  let order = [];
  const notesOf = (pairs) => new Map(pairs.map(([k, val]) => [String(k), val]));
  const tagText = () => shuffle([0, 1, 2, 3]).map((i) => t(`tag_${i}`));
  /** The scene of a question: the wall with the light on it, nothing named. */
  function quizScene(q, { frame = 'wall', marker = false, nm = 550, scale = false, tags = [], dark = false } = {}) {
    stopRun();
    setNm(nm);
    v.beam = 1;
    v.out = 1;
    v.fan = marker || tags.length ? FAN_DIM : 1;
    v.lens = 0;
    v.plain = marker;
    v.marker = marker ? 1 : 0;
    v.chosen = marker ? 1 : 0;
    v.wave = 0;
    v.scale = scale ? 1 : 0;
    v.tags = tags;
    s.frame = frame;
    s.quiz = { ...q };
    if (dark) {
      v.beam = 0;
      v.out = 0;
    }
    clearLabels();
    applyMarks();
    stage.invalidate();
  }
  /** A question whose choices are letters on the band. */
  function byLetter(kind, marks, answer) {
    const letters = tagText();
    const tags = marks.map((id, i) => ({ nm: COLOURS.find((c) => c.id === id).nm, text: letters[i] }));
    quizScene({ kind }, { tags });
    const at = Object.fromEntries(marks.map((id, i) => [id, letters[i]]));
    const wrong = marks.filter((m) => m !== answer);
    return {
      text: t(`q_${kind}`),
      answer,
      wrong,
      label: (k) => t('c_mark', { x: at[k] }),
      notes: notesOf(wrong.map((m) => [m, t(`n_${kind}_${m}`)])),
      reveal: t(`a_${kind}`, { x: at[answer] }),
    };
  }
  const Q = {
    grooves() {
      // no light yet: where the light falls would give it away
      const onDisc = (side, up) => ({
        x: DISC.centre.x + DISC.side.x * side + DISC.up.x * up + DISC.normal.x * 0.06,
        y: DISC.centre.y + DISC.side.y * side + DISC.up.y * up + DISC.normal.y * 0.06,
        z: DISC.centre.z + DISC.side.z * side + DISC.up.z * up + DISC.normal.z * 0.06,
      });
      const places = {
        data: { p: onDisc(-4.1, 0.6), dx: 30, dy: -26 },
        hub: { p: onDisc(1, 1), dx: -30, dy: -34 },
        hole: { p: onDisc(0, 0), dx: 34, dy: 30 },
        rim: { p: onDisc(4.2, -4.2), dx: -26, dy: 26 },
      };
      const parts = Object.keys(places);
      const letters = tagText();
      const mark = Object.fromEntries(parts.map((id, i) => [id, letters[i]]));
      quizScene({ kind: 'grooves' }, { frame: 'grooves', dark: true, tags: parts.map((id) => ({ ...places[id], text: mark[id] })) });
      const wrong = ['hub', 'hole', 'rim'];
      return {
        text: t('q_grooves'),
        answer: 'data',
        wrong,
        label: (k) => t('c_mark', { x: mark[k] }),
        notes: notesOf(wrong.map((k) => [k, t(`n_grooves_${k}`)])),
        reveal: t('a_grooves', { x: mark.data }),
        lens: true,
      };
    },
    longest: () => byLetter('longest', ['violet', 'green', 'orange', 'red'], 'red'),
    read() {
      const nm = shuffle([450, 500, 600, 650])[0];
      quizScene({ kind: 'read' }, { marker: true, nm, scale: true });
      const others = [nm - 100, nm - 50, nm + 50, nm + 100].filter((n) => n >= 400 && n <= 700);
      const wrong = shuffle(others).slice(0, 3);
      const low = Math.floor(nm / 100) * 100;
      const notes = wrong.map((n) => [n, t(n > nm ? 'n_read_high' : 'n_read_low', { n, step: 100 })]);
      return {
        text: t('q_read'),
        answer: nm,
        wrong,
        label: (k) => t('l_nm', { nm: k }),
        notes: notesOf(notes),
        reveal: nm === low ? t('a_read_on', { nm }) : t('a_read_mid', { nm, low, high: low + 100 }),
      };
    },
    eye() {
      quizScene({ kind: 'eye' }, { frame: 'light' });
      const wrong = ['violet', 'blue', 'red'];
      return {
        text: t('q_eye'),
        answer: 'green',
        wrong,
        label: (k) => t(`ex_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_eye_${k}`)])),
        reveal: t('a_eye', { peak: PEAK }),
      };
    },
    dark() {
      const side = Math.random() < 0.5 ? 'ir' : 'uv';
      quizScene({ kind: 'dark' }, { frame: 'beyond', marker: true, nm: side === 'ir' ? IR_NM : UV_NM, scale: true });
      const wrong = [side === 'ir' ? 'uv' : 'ir', 'xray', 'none'];
      return {
        text: t('q_dark'),
        answer: side,
        wrong,
        label: (k) => t(`c_d_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(k === 'uv' || k === 'ir' ? 'n_dark_opposite' : `n_dark_${k}`)])),
        reveal: t(`a_dark_${side}`, range()),
      };
    },
  };
  const saved = { focus: null, done: [], nm: 550, touched: false };
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
        const cut = s.busy; // a step cut short by the test does not count
        stopRun();
        s.mode = 'quiz';
        s.locked = true;
        saved.focus = cut ? null : s.focus;
        saved.done = [...s.done];
        saved.nm = cut ? 550 : s.nm;
        saved.touched = cut ? false : s.touched;
        // in this order no scene gives away a later answer
        order = ['grooves', 'longest', 'read', 'eye', 'dark'];
        clearLabels();
        coach?.setMode('quiz');
        syncUI();
      },
      leave() {
        stopRun();
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        v.plain = false;
        s.focus = saved.focus;
        s.done = new Set(saved.done);
        s.touched = saved.touched;
        setNm(saved.nm);
        clearLabels();
        const frame = frameFor(s.focus);
        settle();
        s.frame = 'wall';
        coach?.setMode('explore');
        syncUI();
        fly(frame, 0.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = Q[order[i]]();
        qCurrent = q;
        say(q.text);
        const done = await fly(s.frame, 0.4);
        if (!alive()) return null;
        if (!done) camK = 1;
        // the kit scores numbers: the choices are places in this list, never its words
        const list = shuffle([q.answer, ...q.wrong]);
        q.list = list;
        s.quiz.right = list.indexOf(q.answer);
        return {
          choices: [0, 1, 2, 3],
          expected: list.indexOf(q.answer),
          tolerance: 0.5,
          label: (k) => q.label(list[k]),
          meta: { kind: order[i], answer: q.answer },
        };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        if (s.quiz && q.lens) {
          v.beam = 1;
          v.out = 1;
          v.lens = 1;
          v.tags = [];
          applyMarks();
        }
        stage.invalidate();
        const chosen = picked ? q.list[picked.value] : null;
        const why = !correct && picked ? q.notes.get(String(chosen)) : '';
        // the note names what the student chose: alone it could be read as being about the right answer
        return `${q.reveal}${why ? ` <span class="lab-why">${t('n_pick', { x: q.label(chosen) })} ${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────────────────────────────────
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
  function home() {
    if (s.locked) return lockedNudge();
    stopRun();
    s.focus = null;
    s.done.clear();
    s.touched = false;
    clearLabels();
    setNm(550);
    const from = s.frame;
    settle();
    s.frame = from;
    fly('start', 0.7);
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
    const what = b.dataset.act || b.dataset.example || '';
    const now = performance.now();
    if (what && what === lastTap.what && now - lastTap.at < 120) return;
    lastTap = { what, at: now };
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) pick(b.dataset.example);
    const act_ = b.dataset.act;
    if (act_ === 'q-next') quiz.next();
    if (act_ === 'q-again') quiz.start();
    if (act_ === 'home') home();
    if (act_ === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const step = { ArrowRight: 5, ArrowLeft: -5 }[e.key];
    if (step) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (!s.done.has('light')) return act();
      if (v.marker < 1) {
        takeMarker();
        if (s.frame !== 'wall' && s.frame !== 'beyond') fly('wall', 0.7);
      }
      moved(s.nm + step);
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      act();
    }
  });

  // ── state for the book ──────────────────────────────────────────────────────────────────────────────────
  function snapshot() {
    const p = landing(s.nm);
    return {
      show: s.focus ?? 'none',
      done: STEPS.filter((n) => s.done.has(n)),
      nm: s.nm,
      kind: kindOf(s.nm),
      visible: isVisible(s.nm),
      sensitivity: Number(sensitivity(s.nm).toFixed(3)),
      onWall: p ? Number(alongWall(p).toFixed(2)) : null,
      busy: s.busy,
      marker: v.marker >= 1,
      frame: s.frame,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
      question: s.quiz ? { kind: s.quiz.kind, right: s.quiz.right ?? null } : null, // the place of the right choice
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.show, snap.done, snap.nm]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }
  /** At once: what the book or a test asks to see. */
  function jump(show) {
    stopRun();
    s.done.clear();
    s.touched = false;
    if (show === 'none') s.focus = null;
    if (show === 'light') {
      s.focus = 'light';
      s.done.add('light');
    }
    if (show === 'grooves') {
      s.focus = 'grooves';
      s.done.add('light').add('grooves');
    }
    if (show === 'wave') {
      s.focus = 'pick';
      s.done.add('light').add('grooves');
      s.touched = true;
    }
    if (show === 'all') {
      s.focus = 'all';
      for (const n of STEPS) s.done.add(n);
    }
    camK = 1;
    clearLabels();
    settle();
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  setNm(s.nm);
  jump(['light', 'grooves', 'wave', 'all'].includes(o.show) ? o.show : 'none');
  syncUI();
  setView(s.view, { animate: false });
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
      const animate = p.animate !== false;
      if (p.view) setView(p.view, { animate });
      const valid = ['none', 'light', 'grooves', 'wave', 'all'].includes(p.show);
      if (valid) {
        if (animate && p.show === 'light') run('light');
        else if (animate && p.show === 'grooves') {
          if (!s.done.has('light')) jump('light');
          run('grooves');
        } else jump(p.show);
      }
      if (p.nm != null) {
        if (animate && !valid && s.done.has('light')) goToColour(clampNm(p.nm));
        else {
          setNm(p.nm);
          if (s.focus === 'all') {
            s.focus = 'pick';
            settle();
          }
        }
      }
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      home();
      setView('front', { animate: false });
      camK = 1;
      draw();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** The view with its drawing on it, cover-fitted to the size asked for (background: null keeps it transparent). */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      stage.render();
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const ctx = out.getContext('2d');
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }
      const gl = stage.canvas;
      const k = Math.max(width / gl.width, height / gl.height);
      const x = (width - gl.width * k) / 2;
      const y = (height - gl.height * k) / 2;
      ctx.drawImage(gl, x, y, gl.width * k, gl.height * k);
      ctx.drawImage(rays.canvas, x, y, gl.width * k, gl.height * k);
      return out.toDataURL('image/png');
    },
    exportRoot: () => setting.apparatus,
  };
}
