// How much light is reflected (book p216, topic 8.2.1, চিত্র ৮.০৫): the student view. The book's picture in 3D: a boy, a red
// flower at the height of his eye, and a slab of clear glass between them. The glass lifts on a jack toward the line from
// the flower to his eye: the light meets it at a larger and larger angle of incidence. The rays split into what is reflected
// and what goes in, each as thick as the light it carries, a small picture shows what he really sees (the pattern under the glass
// fading and the flower coming up in it, by Fresnel's equations for each pixel) and a graph in the panel follows. The panel is
// the kit's clean sheet: one action, one result, one rule.
//
// The story comes first, one idea to a tap, and nothing moves on by itself: 0 the glass; 1 he looks and sees the pattern through it
// (প্রতিসরণ); 2 the glass rises and the flower comes up in it (প্রতিফলন); 3 the two angles; 4 how much, in numbers, at each stop.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { fitPose } from './camera.js';
import { createGraph } from './graph.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  angleFor,
  clampAngle,
  exactAngle,
  EYE_Y,
  GLASS,
  MAX_ANGLE,
  MIN_ANGLE,
  nextStop,
  percent,
  percentIn,
  planeFor,
  points,
  shuffle,
  START_ANGLE,
  STOPS,
} from './reading.js';
import { createSetting } from './scene.js';

export const DEFAULTS = {
  angle: START_ANGLE, // the angle of incidence, degrees (any other than the first opens the last step)
  step: 0, // the step of the story to open at, 0 to 4
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

const BOOK = { low: 4, high: 5, a: 80, b: 90 }; // the book's numbers
const MARGINS = { top: 10, bottom: 8, side: 8 };
const LIFT_FROM = 50; // the test's question on lifting the glass starts at this angle
const INK = { ray: '#8a4f00', ti: '#1971c2', tr: '#2b8a3e', dark: '#2b3a4a' };
const VIEW = { az: 24, elLow: 21, elHigh: 12 }; // lower as the glass comes up, so that its top keeps reading as a mirror
const RAISED = 85; // where the story's lift ends: the flower is plain to see
const LAST = 4; // the last step
const FLY = 1.9; // a camera flight, s
const RISE = 3; // the story's lift, s
const MOVE = 2.4; // the glass from stop to stop, s
const HOLD = 1; // a pause on a result before the student can go on, s
const QUIZ_MOVE = 1.2; // the camera and the glass going to a test question, s
const TAP_SLOP = 8; // px: a finger that moves less has tapped, not turned the view
const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};
// the frame follows the glass: from under the jack's plate to above the boy's head, so that the view closes in as the glass comes up.
// The flower is whole in it; the back of the boy's head may leave the left edge.
const FRAME = new THREE.Box3(new THREE.Vector3(-31, 0, -4), new THREE.Vector3(35, EYE_Y + 13.5, 4));
const STORY_ARROW = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1v9M2.5 6.5 6 10l3.5-3.5"/></svg>';

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'lab');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: the sheet of one action, one result, one rule ────────────────────────────────────────────
  // four words: the steps of the story, and in the last step the four stops, each with its percent
  const wordId = (i) => `w${i}`;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_steps', results: true, items: STOPS.map((_, i) => ({ id: wordId(i), label: `w_${i}` })) },
      quiet: [{ act: 'replay', label: 'act_replay', icon: ICONS.play }],
      tight: true,
      lines: { action: 1, outcome: 1, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const graph = createGraph(t);
  ui.learn.querySelector('.pvc-rule').before(graph.el);
  // the line before the action: what the next tap will show (on the first screen, a few calm words that set the scene)
  const lead = document.createElement('p');
  lead.className = 'lab-lead';
  ui.$('.pvc-act-row').before(lead);
  const caption = document.createElement('p');
  caption.className = 'lab-cap';
  caption.innerHTML = t('cap_book');
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'lab-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);

  // the picture of what he sees, with what is in it pointed out
  const eyeBox = document.createElement('figure');
  eyeBox.className = 'ra-eye off';
  eyeBox.innerHTML = `<div class="ra-eye-pic"><canvas></canvas><span class="ra-tag ra-tag-image" hidden>${t('l_image')}${STORY_ARROW}</span><span class="ra-tag ra-tag-pattern" hidden>${STORY_ARROW}${t('l_pattern')}</span></div><figcaption>${ICONS.eye}<span>${t('l_eye')}</span></figcaption>`;
  ui.stage.appendChild(eyeBox);
  const eyeCanvas = eyeBox.querySelector('canvas');
  const eyeCtx = eyeCanvas.getContext('2d');
  const tagImage = /** @type {HTMLElement} */ (eyeBox.querySelector('.ra-tag-image'));
  const tagPattern = /** @type {HTMLElement} */ (eyeBox.querySelector('.ra-tag-pattern'));

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 18, near: 10, far: 1200, environmentIntensity: 0.7 });
  const { camera, controls } = stage;
  camera.layers.enable(1); // the boy: not in the view from his own eye
  controls.enablePan = false;
  const setting = createSetting({ stage, shadow: Boolean(o.shadow) });
  const rays = createRays({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    angle: clampAngle(o.angle), // while it moves it is not a whole number; what is shown is
    seen: new Set(), // the stops the student has reached
    stage: 0, // the step of the story
    shot: 'start', // the guided framing
    dragged: false, // the student has moved the glass: the handle calms down
    beat: 0, // the angle step's names: 1 the rays, 2 the angles too
    orbited: false, // the student has turned the view: its sign calms down
    busy: false,
    holding: false, // the pause at the end of a move: its labels are up, taps still wait
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    dragging: null,
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
  const shown = () => Math.round(s.angle);
  let eyeDirty = true;
  let eyeOn = false;
  const markPoint = new THREE.Vector3();
  function setAngle(angle) {
    s.angle = clampAngle(angle);
    const g = setting.place(s.angle);
    rays.view.geo = g;
    rays.view.r = percent(shown()) / 100;
    markPoint.set(-3, g.plane - 1, GLASS.halfZ); // on the glass's front edge, clear of the rays and the picture
    eyeDirty = true;
    if (!s.busy) markSeen();
  }
  /** A stop counts when the glass rests on it, not as it goes past. */
  function markSeen() {
    if (s.stage === LAST && !s.quiz) for (const a of STOPS) if (Math.abs(s.angle - a) < 0.26) s.seen.add(a);
  }
  /** What each step has on the view when it has ended. */
  function settle(n) {
    const v = rays.view;
    v.through = n === 1 || n === 2 ? 1 : 0;
    v.flower = n >= 2 ? 1 : 0;
    v.normal = v.arcs = n >= 3 ? 1 : 0;
    v.refracted = n === LAST ? 1 : 0;
    v.guide = n === 2;
    s.beat = n === 3 ? 2 : 0;
    showEye(n >= 1, n === 1 || n === 2);
    eyeBox.classList.toggle('look', n === 2);
    s.shot = ['start', 'through', 'follow', 'angle', 'follow'][n];
  }

  const stopRun = () => {
    ++token;
    for (const key of ['lift', 'step', 'ray']) tweener.cancel(key);
    s.busy = s.holding = false;
  };
  /** Waits; false if something else has taken over meanwhile. */
  const hold = async (seconds, my) => {
    s.holding = true;
    stage.invalidate();
    await tweener.animate({ key: 'step', duration: seconds }).finished;
    if (my !== token) return false;
    s.holding = false;
    return true;
  };
  /** One part of the drawing comes in, or goes. */
  async function bring(part, to, seconds, my) {
    const from = rays.view[part];
    await tweener.animate({
      key: 'ray',
      duration: seconds,
      ease: ease.inOutSine,
      onUpdate: (k) => {
        if (my !== token) return;
        rays.view[part] = from + (to - from) * k;
        stage.invalidate();
      },
    }).finished;
    if (my !== token) return false;
    rays.view[part] = to;
    return true;
  }
  /** The glass goes to an angle at a steady speed up the jack. */
  async function glide(to, duration, my) {
    const from = planeFor(s.angle);
    const end = planeFor(to);
    await tweener.animate({
      key: 'lift',
      duration,
      ease: ease.inOutSine,
      onUpdate: (k) => {
        if (my !== token) return;
        setAngle(exactAngle(from + (end - from) * k));
        draw();
      },
    }).finished;
    if (my !== token) return false;
    setAngle(to);
    markSeen();
    audio.tick();
    draw();
    return true;
  }

  /** The glass goes to an angle, and the student has a moment on the result. */
  async function lift(to, { duration = MOVE, pause = HOLD } = {}) {
    stopRun();
    const my = token;
    s.busy = true;
    clearAll();
    draw();
    if (!(await glide(to, duration, my))) return false;
    if (pause && !(await hold(pause, my))) return false;
    s.busy = false;
    if (!s.quiz && !nextStop(s.angle)) audio.success();
    draw();
    emitChange();
    return true;
  }

  // ── the story: each step from where the one before it ended, and then it waits for the student ──────────
  const RUN = {
    async 1(my) {
      if (s.angle !== START_ANGLE && !(await glide(START_ANGLE, MOVE, my))) return false;
      s.shot = 'through';
      await fly(FLY);
      if (my !== token) return false;
      if (!(await bring('through', 1, 2, my))) return false;
      showEye(true, true);
      return true;
    },
    async 2(my) {
      if (s.angle !== START_ANGLE && !(await glide(START_ANGLE, MOVE, my))) return false;
      showEye(true, true);
      eyeBox.classList.add('look'); // the flower's image lies past the far edge from outside: it is in this picture that one sees it
      if (!(await bring('flower', 1, 1.2, my))) return false;
      rays.view.guide = true;
      s.shot = 'follow';
      fly(RISE);
      return glide(RAISED, RISE, my);
    },
    async 3(my) {
      if (s.angle !== RAISED && !(await glide(RAISED, MOVE, my))) return false;
      rays.view.guide = false;
      if (!(await bring('through', 0, 0.8, my))) return false;
      s.shot = 'angle';
      await fly(FLY);
      if (my !== token) return false;
      if (!(await bring('normal', 1, 1, my))) return false;
      // two beats: first what the rays are called, then the angles between them
      s.beat = 1;
      if (!(await hold(1.2, my))) return false;
      if (!(await bring('arcs', 1, 1.4, my))) return false;
      s.beat = 2;
      return true;
    },
    async 4(my) {
      s.shot = 'follow';
      fly(MOVE);
      if (!(await glide(START_ANGLE, MOVE, my))) return false;
      return bring('refracted', 1, 1, my);
    },
  };
  /** Plays a step. While it plays a tap does nothing; at its end nothing moves on until the student does. */
  async function play(n) {
    stopRun();
    const my = token;
    s.busy = true;
    if (n === LAST) s.seen.clear();
    settle(n - 1);
    s.stage = n;
    clearAll();
    draw();
    if (!(await RUN[n](my))) return false;
    if (!(await hold(HOLD, my))) return false;
    settle(n);
    s.busy = false;
    draw();
    emitChange();
    return true;
  }
  /** A step as it stands at its end, at once (the book's commands, and coming back from the test). */
  function jump(n, angle = n === 0 || n === 1 || n === LAST ? START_ANGLE : RAISED) {
    stopRun();
    s.stage = n;
    settle(n);
    clearAll();
    setAngle(angle);
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function poseNow() {
    const at = s.quiz?.frameAngle ?? s.angle;
    const k = (at - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE);
    const side = root.clientWidth >= root.clientHeight;
    dirFrom(VIEW.az, VIEW.elLow + (VIEW.elHigh - VIEW.elLow) * k, camDir);
    const shot = s.quiz ? 'follow' : s.shot;
    const plane = planeFor(at);
    MARGINS.bottom = 8;
    if (shot === 'angle') {
      // the point of incidence: the two arcs and the rays near it fill the view
      FRAME.min.set(-22, plane - GLASS.thick - 4, -4);
      FRAME.max.set(24, Math.max(EYE_Y + 3, plane + 16), 4);
    } else {
      FRAME.min.set(-31, plane - GLASS.thick - 7, -4);
      FRAME.max.set(side ? 39 : 35, EYE_Y + 13.5, 4); // beside the panel its tab lies on the view's right edge
      if (shot === 'through') FRAME.min.x = -27;
      // the picture from his eye sits at the bottom right, under the flower
      if (eyeOn && shot !== 'start') MARGINS.bottom = 8 + (side ? 0.14 : 0.1) * stage.height;
    }
    const pose = fitPose({ box: FRAME, dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGINS });
    return pose;
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
  function fly(duration = FLY) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      rotate.home();
      s.view = 'front';
      clearAll();
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
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
    rotate.home();
    clearAll();
    syncUI();
    if (animate) fly();
    else camK = 1;
    stage.invalidate();
  }
  // the view turns at the first real movement: a tap (under 8 px) stays a tap
  function orbiting() {
    if (s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    clearAll(); // off the guided view a label gives way rather than cover something: see label()
    s.orbited = true;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  }
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${t.num(360)}°`,
    label: t('view_rotate'),
    compact: !o.coach, // for pictures and tests: the small sign from the start
    pulse: Boolean(o.coach),
    onTurn: orbiting,
  });
  // the kit also calls this when it lowers the resolution of a slow phone, in the middle of a turn: only a new size is a new view
  let sizeW = stage.width;
  let sizeH = stage.height;
  stage.onResize(() => {
    if (stage.width !== sizeW || stage.height !== sizeH) {
      sizeW = stage.width;
      sizeH = stage.height;
      s.userMovedCamera = false;
      rotate.home();
      if (s.view === '3d') {
        s.view = 'front';
        syncUI();
      }
    }
    sizeEye();
    draw();
  });

  // ── the picture from his eye: drawn into a corner of the canvas before the main pass, copied, and drawn over ──
  let eyeW = 1;
  let eyeH = 1;
  let eyeLarge = false; // the test's question that is read off this picture alone
  function sizeEye() {
    eyeBox.classList.toggle('big', eyeLarge);
    eyeBox.style.width = eyeLarge ? `${Math.round(Math.min(stage.width - 16, ((stage.height - 40) * 4) / 3))}px` : '';
    const c = eyeCanvas.getBoundingClientRect();
    eyeW = Math.max(1, Math.round(c.width));
    eyeH = Math.max(1, Math.round(c.height));
    const r = stage.pixelRatio;
    eyeCanvas.width = Math.round(eyeW * r);
    eyeCanvas.height = Math.round(eyeH * r);
    eyeDirty = true;
  }
  function showEyeLarge(on) {
    eyeLarge = on;
    sizeEye();
    stage.invalidate();
  }
  /** The picture's place on the view, as soon as it is on: the kit would skip it while it fades in, and then nothing draws again. */
  function eyeArea() {
    if (!eyeOn) return null;
    const r = eyeBox.getBoundingClientRect();
    const h = ui.canvasHost.getBoundingClientRect();
    return { left: r.left - h.left, top: r.top - h.top, right: r.right - h.left, bottom: r.bottom - h.top };
  }
  /** The picture on or off, and at its story size (the steps it is about) or its everyday size. */
  function showEye(on, story) {
    eyeOn = on;
    eyeBox.classList.toggle('off', !on);
    eyeBox.classList.toggle('story', Boolean(on && story));
    sizeEye();
    stage.invalidate();
  }
  sizeEye();
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    if (!eyeDirty || !eyeOn) return;
    eyeDirty = false;
    setting.renderEye(s.angle, eyeW, eyeH);
    const gl = stage.canvas;
    eyeCtx.drawImage(gl, 0, gl.height - eyeCanvas.height, eyeCanvas.width, eyeCanvas.height, 0, 0, eyeCanvas.width, eyeCanvas.height);
  });

  // ── labels on the picture: few and short, each pinned to what it names ───────────────────────────────────
  let action = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, rotate.el, eyeArea, ui.$('.pvc-panel-toggle'), () => rays.boxes(), () => action?.ringBox(), () => glassHandle.box()],
  });
  const on = new Map();
  const pts = new Map();
  function label(id, show, text, point, color, spots, optional = false) {
    const free = s.userMovedCamera; // the student's own view: a label with no clear place, or whose part is behind the picture, waits
    if (show && free && behindEye(point)) show = false;
    if (!show) {
      if (on.has(id)) {
        anno.remove(id);
        on.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).copy(point);
    const was = on.get(id);
    if (!was) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', optional: optional || free });
      on.set(id, { text });
      return;
    }
    if (was.text !== text) {
      anno.setText(id, text);
      was.text = text;
    }
  }
  function behindEye(point) {
    const e = eyeArea();
    if (!e) return false;
    const p = rays.screen(point);
    return p.x > e.left && p.x < e.right && p.y > e.top && p.y < e.bottom;
  }
  function clearAll() {
    for (const id of [...on.keys()]) anno.remove(id);
    on.clear();
  }
  const SPOTS = {
    ti: [
      { dx: 26, dy: -28 },
      { dx: 26, dy: -18 },
      { dx: 44, dy: -8 },
      { dx: 30, dy: -40 },
      { dx: 50, dy: -30 },
      { dx: 40, dy: -62 },
      { dx: 26, dy: -84 },
      { dx: 62, dy: -74 },
      { dx: 64, dy: -104 },
      { dx: 26, dy: -112 },
      { dx: 30, dy: -134 },
    ],
    tr: [
      { dx: -26, dy: -18 },
      { dx: -44, dy: -8 },
      { dx: -30, dy: -40 },
      { dx: -50, dy: -30 },
      { dx: -40, dy: -62 },
      { dx: -26, dy: -84 },
      { dx: -26, dy: -112 },
      { dx: -66, dy: -14 },
      { dx: -72, dy: -44 },
    ],
    normal: [
      { dx: 0, dy: -14 },
      { dx: 34, dy: -2 },
      { dx: -34, dy: -2 },
    ],
    out: [
      { dx: 4, dy: 22 },
      { dx: -8, dy: -20 },
      { dx: -24, dy: 26 },
      { dx: 24, dy: -28 },
      { dx: -46, dy: 16 },
      { dx: -56, dy: -6 },
      { dx: 44, dy: -18 },
      { dx: -58, dy: 36 },
      { dx: 62, dy: -36 },
      { dx: -70, dy: 26 },
      { dx: 72, dy: -24 },
      { dx: -84, dy: 8 },
      { dx: -92, dy: -14 },
      { dx: 86, dy: 20 },
      { dx: -6, dy: -36 },
      { dx: -8, dy: -50 },
    ],
    in: [
      { dx: 10, dy: -20 },
      { dx: -14, dy: -22 },
      { dx: 34, dy: -16 },
      { dx: -30, dy: -34 },
      { dx: 6, dy: 22 },
      { dx: -56, dy: -14 },
      { dx: 44, dy: 20 },
      { dx: -30, dy: 24 },
      { dx: 20, dy: -46 },
      { dx: -10, dy: -60 },
      { dx: 40, dy: -40 },
      { dx: -74, dy: -30 },
      { dx: 22, dy: -28 },
    ],
    ref: [
      { dx: 62, dy: 24 },
      { dx: -62, dy: 18 },
      { dx: 74, dy: 8 },
      { dx: -74, dy: 4 },
      { dx: -56, dy: 36 },
      { dx: 56, dy: 40 },
      { dx: -80, dy: 28 },
      { dx: -66, dy: 50 },
      { dx: 0, dy: 72 },
      { dx: -34, dy: -36 },
      { dx: 20, dy: 46 },
      { dx: 2, dy: 80 },
    ],
    glass: [
      { dx: -26, dy: 24 },
      { dx: -40, dy: 36 },
      { dx: -44, dy: 12 },
      { dx: 12, dy: 30 },
      { dx: -8, dy: 44 },
      { dx: 34, dy: 42 },
    ],
    pattern: [
      { dx: 40, dy: -34 },
      { dx: -40, dy: -34 },
      { dx: 56, dy: -56 },
      { dx: -56, dy: -56 },
      { dx: 10, dy: -60 },
    ],
    through: [
      { dx: 26, dy: -16 },
      { dx: -26, dy: 22 },
      { dx: 38, dy: -30 },
      { dx: -38, dy: 34 },
      { dx: 14, dy: -50 },
      { dx: 14, dy: -66 },
      { dx: -44, dy: -34 },
    ],
    reflection: [
      { dx: 22, dy: -20 },
      { dx: -22, dy: 22 },
      { dx: 34, dy: -34 },
      { dx: 44, dy: 8 },
    ],
    before: [
      { dx: 26, dy: 18 },
      { dx: -26, dy: 18 },
      { dx: 34, dy: -6 },
    ],
  };
  // after the hand-picked places, a grid: wherever the rays land on a small frame, every name finds room
  const FALLBACK = [];
  for (const dy of [-34, -50, -66, -82, 34, 50, 66, 82, 98]) for (const dx of [0, -8, 8, -36, 36, -66, 66, -96, 96, -126]) FALLBACK.push({ dx, dy });
  for (const key of Object.keys(SPOTS)) if (key !== 'before') SPOTS[key].push(...FALLBACK);
  const P = new THREE.Vector3();
  const P2 = new THREE.Vector3();
  const P3 = new THREE.Vector3();
  const pins = rays.view.pins;
  const mid = (a, b, f) => P.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 0);
  function labels() {
    const q = s.quiz;
    const g = rays.view.geo;
    const a = shown();
    const moving = (s.busy && !s.holding) || camK < 1;
    const plain = q && !q.named;
    const rayOn = rays.view.show;
    const half = (a * Math.PI) / 360;
    const step = q ? LAST : s.stage;
    const still = rayOn && !moving;
    const glassPoint = P2.set(-13, g.plane - GLASS.thick / 2, GLASS.halfZ);
    const patternPoint = P3.set(6, g.plane, 3);
    // the story's names, three at most to a step
    const named = (step === 3 && (t.lang === 'bn' || stage.height > 300)) || (step === LAST && !!q && stage.width >= 500 && stage.height > 400);
    const beat = step === 3 ? s.beat : 0; // the angle step brings its names in two beats, while it plays
    label('glass', !moving && step <= 2, t('l_glass'), glassPoint, INK.dark, SPOTS.glass);
    pins.length = 0;
    if (!moving && step <= 2) pins.push(glassPoint);
    if (!moving && step === 0) pins.push(patternPoint);
    label('pattern', !moving && step === 0, t('l_pattern'), patternPoint, INK.dark, SPOTS.pattern);
    label(
      'through',
      still && (step === 1 || step === 2) && rays.view.through >= 1,
      t('l_through'),
      mid(g.under, g.hit, 0.5),
      INK.dark,
      SPOTS.through,
    );
    label('reflection', still && step === 2, t('l_reflection'), mid(g.eye, g.hit, 0.72), INK.ray, SPOTS.reflection);
    // the angle step: the two angles, the normal, the two rays
    label('normal', beat >= 1, t('l_normal'), P.set(g.top.x, g.top.y, 0), INK.dark, SPOTS.normal);
    label('in', beat >= 1, t('l_in'), mid(g.flower, g.hit, 0.3), INK.ray, SPOTS.in);
    // the amounts come last, on the rays
    const outOn = beat >= 1 || (still && step === LAST && (!plain || q?.showOut));
    label('out', outOn, step === 3 ? t('l_out_name') : t('l_out', { p: percent(a) }), mid(g.eye, g.hit, 0.3), INK.ray, SPOTS.out);
    const angleOn = beat >= 2 || (still && step === LAST && !q?.hideAngle);
    label(
      'ti',
      angleOn,
      t(named ? 'l_ti_long' : 'l_ti', { a }),
      P.set(g.hit.x + 9 * Math.sin(half), g.hit.y + 9 * Math.cos(half), 0),
      INK.ti,
      SPOTS.ti,
    );
    label(
      'tr',
      angleOn,
      t(named ? 'l_tr_long' : 'l_tr', { a }),
      P.set(g.hit.x - 9 * Math.sin(half), g.hit.y + 9 * Math.cos(half), 0),
      INK.tr,
      SPOTS.tr,
    );
    label('ref', still && step === LAST && !plain, t('l_ref', { p: percentIn(a) }), P.set(g.inside.x, g.inside.y, 0), INK.ray, SPOTS.ref);
    const old = rays.view.ghost;
    label('before', Boolean(old) && !moving, t('l_before'), old ? P.set(GLASS.halfX, old.plane, GLASS.halfZ) : P, INK.dark, SPOTS.before);
    anno.update();
    tags();
  }
  // inside the picture from his eye: what is in it, by how much of each there is
  function tags() {
    const R = percent(shown());
    const story = eyeOn && !s.quiz && s.stage !== 3;
    const image = story && R >= 9;
    const pattern = story && R < 50 && !(s.busy && s.stage === 1);
    if (tagImage.hidden === image) tagImage.hidden = !image;
    if (tagPattern.hidden === pattern) tagPattern.hidden = !pattern;
  }
  const gripPoint = new THREE.Vector3();
  const trackA = new THREE.Vector3();
  const trackB = new THREE.Vector3();
  /** The handle stands on the lower edge of the glass, on the side nearest the camera, with its range dashed under it. */
  function gripWhere() {
    const z = GLASS.halfZ * (camera.position.z >= 0 ? 1 : -1);
    trackA.set(-8, planeFor(MIN_ANGLE) - GLASS.thick, z);
    trackB.set(-8, planeFor(MAX_ANGLE) - GLASS.thick, z);
    gripPoint.set(-8, planeFor(s.angle) - GLASS.thick, z).project(camera);
    let x = Math.min(stage.width - 26, Math.max(26, ((gripPoint.x + 1) / 2) * stage.width));
    // above the note in the corner
    const noteTop = note.offsetHeight ? note.offsetHeight + 6 : 0;
    const y = Math.min(stage.height - 26 - noteTop, Math.max(26, ((1 - gripPoint.y) / 2) * stage.height));
    // never over the picture from his eye, from any side
    const e = eyeArea();
    const wide = s.dragged || !o.coach ? 20 : 44;
    if (e && x + wide > e.left && x - wide < e.right && y + 26 > e.top && y - 26 < e.bottom) x = Math.max(wide, e.left - wide);
    return gripPoint.set((x / stage.width) * 2 - 1, 1 - (y / stage.height) * 2, gripPoint.z).unproject(camera);
  }
  const glassHandle = createDragHandle(stage, {
    point: gripWhere,
    axis: 'y',
    track: { from: trackA, to: trackB },
    label: o.coach ? t('l_drag') : '',
    labelAt: 'below', // over the disc when there is no room under it
    aria: t('aria_glass'),
    pulse: Boolean(o.coach),
    when: () => !s.locked && !s.busy && s.stage >= 2 && camK >= 1,
  });
  if (!o.coach) glassHandle.markUsed(); // for pictures and tests: the small disc from the start
  stage.onAfterRender(labels); // after the handle has been placed: the labels keep off it

  // ── moving on ──────────────────────────────────────────────────────────────────────────────────────────
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    if (s.busy) return; // a tap while something plays is ignored: nothing queues up
    if (s.stage < LAST) return play(s.stage + 1);
    if (testReady()) return quiz.start();
    const next = nextStop(s.angle);
    return lift(next ?? STOPS.find((a) => !s.seen.has(a)) ?? STOPS[0]);
  }
  const testReady = () => s.stage === LAST && STOPS.every((a) => s.seen.has(a));
  function pick(i) {
    if (s.locked) return lockedNudge();
    if (s.busy) return;
    audio.unlock();
    if (s.stage < LAST) {
      if (i <= s.stage) play(i + 1); // its own word plays a step again; a word further on waits for its turn
      return;
    }
    if (STOPS[i] !== shown()) lift(STOPS[i]);
  }
  /** The step that has just ended, slowly, from where it began. The last one has its words: there the button starts again. */
  function replay() {
    if (s.locked) return lockedNudge();
    if (s.busy) return;
    audio.unlock();
    if (s.stage === LAST) home();
    else if (s.stage > 0) play(s.stage);
  }
  function nudge(by) {
    if (s.locked) return lockedNudge();
    if (s.busy || s.stage < 2) return;
    clearAll();
    setAngle(Math.round(s.angle) + by);
    moved();
    draw();
    emitChange();
  }
  function moved() {
    if (s.dragged) return;
    s.dragged = true;
    glassHandle.markUsed();
    rays.view.guide = false;
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const ACT = ['act_look', 'act_lift', 'act_angles', 'act_amount'];
  const steady = { act: '', row: -1, quiet: '', lead: '' };
  function ruleText() {
    const a = shown();
    if (s.stage === 0) return ''; // the first screen: only the calm words above the action
    if (s.stage < LAST) return t(`rule_${['', 'through', 'raise', 'angles'][s.stage]}`);
    if (a < 45) return t('rule_small', { a: BOOK.low, b: BOOK.high });
    if (a < 75) return t('rule_mid');
    if (STOPS.every((x) => s.seen.has(x))) return t('rule_end');
    return t('rule_big', { a: BOOK.a, b: BOOK.b });
  }
  /** The row of four words: the steps, then the stops. */
  function words() {
    const last = s.stage === LAST;
    const key = last ? 1 : 0;
    if (steady.row !== key) {
      steady.row = key;
      ui.$('.pvc-examples')?.setAttribute('aria-label', t(last ? 'ex_label' : 'ex_steps'));
      sheet.words.forEach((b, i) => {
        b.querySelector('.pvc-ex-word').textContent = last ? `${t.num(STOPS[i])}°` : t(`w_${i}`);
      });
    }
    sheet.words.forEach((b, i) => {
      b.disabled = !last && i > s.stage;
    });
    if (last) {
      const at = STOPS.indexOf(shown());
      sheet.choose(at >= 0 ? wordId(at) : null);
      const next = nextStop(s.angle);
      sheet.next(next ? wordId(STOPS.indexOf(next)) : null);
      STOPS.forEach((x, i) => {
        sheet.result(wordId(i), s.seen.has(x) ? `${t.num(percent(x))}%` : '');
      });
      return;
    }
    sheet.choose(s.stage ? wordId(s.stage - 1) : null);
    sheet.next(wordId(s.stage));
    STOPS.forEach((_, i) => {
      sheet.result(wordId(i), '');
    });
  }
  function panel() {
    const a = shown();
    graph.set(a);
    if (s.quiz) return;
    const last = s.stage === LAST;
    root.dataset.story = last ? 'amount' : 'story';
    sheet.outcome(last ? t('out_now', { a, p: percent(a) }) : s.stage ? t(`out_${['', 'through', 'raise', 'angles'][s.stage]}`) : '');
    sheet.rule(ruleText());
    words();
    const ready = testReady();
    const calm = s.stage === 0;
    const leadKey = !last ? `lead_${s.stage}` : ready ? 'lead_test' : nextStop(s.angle) ? 'lead_up' : 'lead_down';
    const html = calm
      ? `<span class="lab-long">${t('intro')}</span><span class="lab-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : t(leadKey);
    if (steady.lead !== html) {
      steady.lead = html;
      lead.innerHTML = html;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('lab-calm', calm);
    }
    const word = s.busy ? 'act_wait' : !last ? ACT[s.stage] : ready ? 'act_test' : nextStop(s.angle) ? 'act_lift' : 'act_down';
    const step = s.busy || last ? '' : s.stage + 1;
    const enabled = !s.busy;
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled });
    }
    const q = last ? 'act_home' : 'act_replay'; // ↺ only to start again; ▶ to see a step again
    const quiet = ui.$('[data-act="replay"]');
    if (quiet) {
      quiet.hidden = s.stage === 0;
      if (steady.quiet !== q) {
        steady.quiet = q;
        quiet.innerHTML = `${last ? ICONS.reset : ICONS.play}<span>${t(q)}</span>`;
        quiet.classList.toggle('lab-worded', !last);
        quiet.title = t(q);
        quiet.setAttribute('aria-label', t(q));
      }
      quiet.disabled = s.busy;
    }
  }
  function draw() {
    panel();
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_lift',
    // on the glass while a tap on it is the way on; after that its handle says what it does
    target: () => (s.locked || s.busy || camK < 1 || s.dragging || s.stage > 1 ? null : markPoint),
    radius: 26,
    avoid: [ui.corner, ui.hint, note, rotate.el, eyeArea, () => anno.boxes(), () => rays.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // a tap on the glass or the jack is the same action; a drag lifts it by hand
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function onGlass(e) {
    const r = ui.canvasHost.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(setting.hit, false).length > 0;
  }
  const pxPerCm = () => {
    const a = rays.screen({ x: 0, y: planeFor(s.angle), z: 0 });
    const b = rays.screen({ x: 0, y: planeFor(s.angle) + 10, z: 0 });
    return Math.max(0.5, (a.y - b.y) / 10);
  };
  const host = ui.canvasHost;
  const nearHandle = (e) => {
    const r = host.getBoundingClientRect();
    return glassHandle.hit(e.clientX - r.left, e.clientY - r.top);
  };
  let press = null; // a finger on the view: a tap, a turn of the view, or a drag of the glass
  host.addEventListener(
    'pointerdown',
    (e) => {
      const glass = !s.locked && onGlass(e);
      press = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now(), glass, moved: false };
      if (s.locked || s.busy || s.stage < 2 || !(glass || nearHandle(e))) return;
      controls.enabled = false;
      s.dragging = { id: e.pointerId, plane: planeFor(s.angle), scale: pxPerCm() };
      capturePointer(host, e.pointerId);
      stage.invalidate();
    },
    { capture: true },
  );
  host.addEventListener('pointermove', (e) => {
    if (!press || press.id !== e.pointerId) return;
    if (!press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) < TAP_SLOP) return;
    if (!press.moved) {
      press.moved = true;
      if (s.dragging) {
        clearAll();
        audio.unlock();
        moved();
      }
    }
    const d = s.dragging;
    if (!d || s.locked) return;
    setAngle(angleFor(d.plane + (press.y - e.clientY) / d.scale));
    draw();
  });
  const endPress = (e) => {
    if (!press || press.id !== e.pointerId) return;
    const was = press;
    press = null;
    if (s.dragging) {
      s.dragging = null;
      controls.enabled = true;
      releasePointer(host, e.pointerId);
    }
    if (was.moved) {
      emitChange();
      draw();
    } else if (e.type === 'pointerup' && was.glass && !s.busy && !testReady() && performance.now() - was.at < 600) act();
  };
  host.addEventListener('pointerup', endPress);
  host.addEventListener('pointercancel', endPress);

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  let order = [];
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  function quizScene(q, angle) {
    stopRun();
    s.quiz = { ...q, named: false };
    settle(LAST);
    rays.view.guide = true;
    rays.view.ghost = null;
    s.quiz.at = angle; // the glass eases there as the camera flies: see prepare
    clearAll();
    draw();
  }
  const pick1 = (list) => shuffle(list)[0];
  const Q = {
    small() {
      quizScene({ kind: 'small' }, 30);
      const wrong = [20, 50, 95];
      return {
        text: t('q_small'),
        answer: BOOK.low,
        wrong,
        label: (k) => t('c_pct_about', { a: k }),
        notes: notesOf(wrong.map((k) => [k, t(`n_small_${k}`, { big: 70 })])),
        reveal: t('a_small', { a: BOOK.low, b: BOOK.high }),
      };
    },
    lift() {
      quizScene({ kind: 'lift', hideAngle: true, frameAngle: LIFT_FROM }, LIFT_FROM);
      rays.view.ghost = points(LIFT_FROM);
      s.quiz.grow = 76;
      const wrong = ['lessR', 'lessA', 'none'];
      return {
        text: t('q_lift'),
        answer: 'both',
        wrong,
        label: (k) => t(`c_lift_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_lift_${k}`)])),
        reveal: t('a_lift'),
      };
    },
    eye() {
      const answer = pick1([30, 80, 87]); // pictures that plainly differ: 30° and 60° (4 % and 9 %) are not told apart by eye
      quizScene({ kind: 'eye', hideAngle: true }, answer);
      rays.view.show = false;
      showEyeLarge(true);
      const wrong = [30, 70, 80, 87].filter((k) => k !== answer);
      return {
        text: t('q_eye'),
        answer,
        wrong,
        label: (k) => t('c_deg', { a: k }),
        notes: notesOf(wrong.map((k) => [k, t(k > answer ? 'n_eye_more' : 'n_eye_less')])),
        reveal: t(`a_eye_${answer}`, { a: answer, p: percent(answer) }),
      };
    },
    rest() {
      const angle = pick1([60, 80, 87]);
      const p = percent(angle);
      quizScene({ kind: 'rest', showOut: true }, angle);
      return {
        text: t('q_rest'),
        answer: 100 - p,
        wrong: [p, 100, BOOK.low],
        label: (k) => t('c_pct', { a: k }),
        notes: notesOf([
          [p, t('n_rest_same')],
          [100, t('n_rest_all')],
          [BOOK.low, t('n_rest_small', { a: BOOK.low })],
        ]),
        reveal: t('a_rest', { p, q: 100 - p, all: 100 }),
      };
    },
    window() {
      quizScene({ kind: 'window', hideAngle: true }, 60); // it asks for the angle to the glass: the θ labels would only mislead
      const wrong = [30, 60, 90];
      return {
        text: t('q_window'),
        answer: 5,
        wrong,
        label: (k) => t('c_sight', { a: k }),
        notes: notesOf(wrong.map((k) => [k, t(`n_window_${k}`, { a: 90 - k, p: percent(90 - k) })])),
        reveal: t('a_window', { a: 5, b: 85 }),
      };
    },
  };
  const saved = { angle: START_ANGLE, seen: [], stage: 0 };
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
        stopRun();
        s.dragging = null;
        controls.enabled = true;
        s.mode = 'quiz';
        s.locked = true;
        saved.angle = shown();
        saved.seen = [...s.seen];
        saved.stage = s.stage;
        order = ['small', 'lift', 'eye', 'rest', 'window'];
        clearAll();
        syncUI();
      },
      leave() {
        stopRun();
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        rays.view.show = true;
        rays.view.ghost = null;
        showEyeLarge(false);
        jump(saved.stage, saved.angle);
        s.seen = new Set(saved.seen);
        syncUI();
        fly();
        draw();
      },
      async prepare(i, alive, say) {
        rays.view.show = true;
        showEyeLarge(false);
        const q = Q[order[i]]();
        qCurrent = q;
        say(q.text);
        stopRun();
        const my = token;
        s.busy = true;
        const [done] = await Promise.all([fly(QUIZ_MOVE), glide(s.quiz.at, QUIZ_MOVE, my)]);
        if (!alive() || my !== token) return null;
        s.busy = false;
        if (!done) camK = 1;
        draw();
        if (s.quiz.grow) {
          await lift(s.quiz.grow, { pause: 0 });
          if (!alive()) return null;
        }
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
        if (s.quiz) {
          s.quiz.named = true;
          s.quiz.hideAngle = s.quiz.kind === 'window';
          rays.view.show = true;
          showEyeLarge(false);
        }
        stage.invalidate();
        const chosen = picked ? q.list[picked.value] : null;
        const why = !correct && picked ? q.notes.get(String(chosen)) : '';
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
      const active = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', active);
      b.setAttribute('aria-selected', String(active));
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
    s.seen.clear();
    jump(0);
    fly();
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
    if (b.dataset.example) pick(sheet.words.indexOf(/** @type {HTMLElement} */ (b)));
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'replay') replay();
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      nudge(step * (e.shiftKey ? 5 : 1));
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
    const a = shown();
    const g = points(a);
    return {
      angle: a,
      reflected: percent(a),
      refractedShare: percentIn(a),
      refractedAngle: g.refracted,
      plane: Number(g.plane.toFixed(3)),
      seen: STOPS.filter((x) => s.seen.has(x)),
      step: s.stage,
      busy: s.busy,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
      question: s.quiz ? { kind: s.quiz.kind, right: s.quiz.right ?? null } : null,
      handle: { shown: glassHandle.visible, used: s.dragged },
      orbited: s.orbited,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.angle, snap.seen]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  const first = THREE.MathUtils.clamp(Math.round(Number(o.step) || 0), 0, LAST);
  jump(first > 0 ? first : s.angle !== START_ANGLE ? LAST : 0, first > 0 && o.angle === DEFAULTS.angle ? undefined : s.angle);
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
      if (p.step != null) {
        const n = THREE.MathUtils.clamp(Math.round(Number(p.step)), 0, LAST);
        if (animate && n > 0) play(n);
        else jump(n);
      }
      if (p.angle != null) {
        const to = Math.round(clampAngle(p.angle));
        if (s.stage !== LAST) jump(LAST, s.angle); // the book asks for an angle: that is the last step
        if (animate) lift(to);
        else {
          stopRun();
          clearAll();
          setAngle(to);
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
    /** The view with its drawing and the picture from his eye, cover-fitted to the size asked for. */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      eyeDirty = true;
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
      const r = ui.canvasHost.getBoundingClientRect();
      const c = eyeCanvas.getBoundingClientRect();
      const ratio = gl.width / r.width;
      if (eyeOn)
        ctx.drawImage(eyeCanvas, x + (c.left - r.left) * ratio * k, y + (c.top - r.top) * ratio * k, c.width * ratio * k, c.height * ratio * k);
      return out.toDataURL('image/png');
    },
    exportRoot: () => setting.apparatus,
  };
}
