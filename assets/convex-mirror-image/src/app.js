// Image in a convex mirror (book pp 225–227 and 235, topics 8.5.1 and 8.8.2): the student view. The book's pencil XY stands before a
// convex mirror on the chapter's optical bench. First the mirror itself: the pencil is seen in the silver, small and upright, by a
// reflection traced for every pixel. Then the book's three rays, one at a time, each traced on the exact sphere; their extensions
// meet behind the mirror at X′, where the virtual image grows up from Y′. The student moves the pencil and the image slides along the
// one line it can never leave, toward F. Last the rear-view mirror: from one eye, the same mirror plane and then convex.
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
import { createSetting, EYE, FRAMES, IMAGE_U, RAIL, SEE_U } from './bench.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  clamp,
  EYE_X,
  F0,
  FLAT_R,
  fraction,
  imageOf,
  MIRROR,
  miss,
  PENCIL,
  pencilsSeen,
  R0,
  ROW_X,
  round,
  sag,
  seenAt,
  shuffle,
  threeRays,
  U,
} from './reading.js';

export const DEFAULTS = {
  stage: 'see', // one of STAGES
  u: U.start, // where the pencil stands, cm from the mirror
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring and the hand
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

/** The story, in order. */
export const STAGES = ['see', 'ray1', 'ray2', 'ray3', 'image', 'move', 'plane', 'eye', 'wide'];
/** The words in the panel, and the stage each one starts at. */
const WORDS = { see: 'see', rays: 'ray1', move: 'move', rear: 'plane' };
const WORD_OF = { see: 'see', ray1: 'rays', ray2: 'rays', ray3: 'rays', image: 'rays', move: 'move', plane: 'rear', eye: 'rear', wide: 'rear' };

const REST = {
  r1in: 0,
  r1out: 0,
  r1ext: 0,
  r2in: 0,
  r2out: 0,
  r2ext: 0,
  r3in: 0,
  r3out: 0,
  r3ext: 0,
  showO: 0,
  showF: 0,
  axis: 1,
  ghost: 0,
  bars: 0,
  row: 0,
  curve: 1, // 1 convex, 0 plane
  cone: 0,
  flat: 0,
  eye: 0,
};
const R1 = { r1in: 1, r1out: 1, r1ext: 1, showO: 1 };
const R2 = { r2in: 1, r2out: 1, r2ext: 1, showF: 1 };
const R3 = { r3in: 1, r3out: 1, r3ext: 1 };
/** What each stage shows. */
const POSE = {
  see: { ...REST, axis: 0 },
  ray1: { ...REST, ...R1 },
  ray2: { ...REST, ...R1, ...R2 },
  ray3: { ...REST, ...R1, ...R2, ...R3 },
  image: { ...REST, ...R1, ...R2, ...R3, ghost: 1 },
  move: { ...REST, ...R1, ...R2, showO: 0, r1ext: 0, ghost: 1, bars: 1 },
  plane: { ...REST, axis: 0, row: 1, curve: 0 },
  eye: { ...REST, axis: 0, row: 1 },
  wide: { ...REST, axis: 0, row: 1, cone: 1, flat: 1, eye: 1 },
};
const REAR = new Set(['plane', 'eye', 'wide']);
const FRAME_OF = { see: 'see', ray1: 'rays', ray2: 'rays', ray3: 'rays', image: 'image', move: 'move', plane: 'eye', eye: 'eye', wide: 'wide' };
/** The ray each step adds, for the step-back of the others. */
const NOW = { ray1: 0, ray2: 1, ray3: 2 };
/** The order things come in. */
const UPS = [
  ['showO'],
  ['r1in'],
  ['r1out'],
  ['r1ext'],
  ['showF'],
  ['r2in'],
  ['r2out'],
  ['r2ext'],
  ['r3in'],
  ['r3out'],
  ['r3ext'],
  ['ghost'],
  ['bars'],
  ['flat'],
  ['cone'],
  ['eye'],
];
const ALL_UPS = UPS.flat();

const MARGINS = { top: 12, bottom: 10, side: 8 };
const INK = { dark: '#2b3a4a', ray: '#8a4f00', focus: '#5a37d0' };
const AX = RAIL.axis;
/** The bars of u and v lie this high above the rail's top. */
const BAR_Y = RAIL.top + 1.6;

const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};
const radiusOf = (curve) => 1 / (curve / R0 + (1 - curve) / FLAT_R);

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
      examples: { label: 'ex_label', items: Object.keys(WORDS).map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const caption = document.createElement('p');
  caption.className = 'lab-cap';
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'lab-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 22, near: 10, far: 1600, environmentIntensity: 0.8 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(30);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(91);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(6); // the silver faces the pencil: never from behind the mirror
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(91);
  const setting = createSetting({ stage, shadow: Boolean(o.shadow), t });
  const rays = createRays({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const pickU = (u) => clamp(Number.isFinite(Number(u)) ? Number(u) : U.start, U.min, U.max);
  const start = STAGES.includes(o.stage) ? o.stage : 'see';
  const s = {
    stage: start,
    u: pickU(o.u), // where the student put the pencil
    sawFar: false,
    sawNear: false,
    busy: false,
    dragging: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    frame: FRAME_OF[start],
  };
  // what is drawn now; the numbers move, the state above does not
  const V = { ...POSE.see, u: s.u };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  const uGoal = (name) => (REAR.has(name) ? ROW_X : s.u);

  // ── what the 3D shows, from V ──────────────────────────────────────────────────────────────────────────
  let tracedU = -1;
  function apply() {
    const rv = rays.view;
    const r = radiusOf(V.curve);
    if (V.u !== tracedU) {
      tracedU = V.u;
      rv.rays = threeRays(V.u);
    }
    const img = imageOf(V.u);
    rv.r = r;
    rv.keys[0].in = V.r1in;
    rv.keys[0].out = V.r1out;
    rv.keys[0].ext = V.r1ext;
    rv.keys[1].in = V.r2in;
    rv.keys[1].out = V.r2out;
    rv.keys[1].ext = V.r2ext;
    rv.keys[2].in = V.r3in;
    rv.keys[2].out = V.r3out;
    rv.keys[2].ext = V.r3ext;
    rv.now = NOW[s.stage] ?? -1;
    rv.axis = V.axis;
    rv.showF = V.showF;
    rv.showO = V.showO;
    rv.imageAt = { x: img.v, y: img.height };
    rv.imageK = V.ghost >= 1 ? 1 : 0;
    rv.bars = V.bars;
    rv.u = V.u;
    rv.iv = img.v;
    rv.cone = V.cone;
    rv.coneFlat = V.flat;
    rv.eye = V.eye;
    note.hidden = V.r1in <= 0; // it speaks of the three rays
    setting.placeMirror(r);
    // once X′Y′ is drawn it is the one image on the view: from the side the silver would show the same image a second time, at its rim
    setting.placePencil(V.u, V.row, V.ghost <= 0);
    setting.placeImage(img.v, img.m, V.ghost);
  }

  const RUNS = ['step', 'camera', 'pencil'];
  function stopRun() {
    ++token;
    for (const k of RUNS) tweener.cancel(k);
    camK = 1;
    s.busy = false;
  }
  /** Everything in its final place at once. */
  function settle(name) {
    Object.assign(V, POSE[name]);
    V.u = uGoal(name);
    s.frame = FRAME_OF[name];
    apply();
  }

  /** Numbers of V move to the goal together; its promise says whether the run is still alive. */
  function move(alive, keys, goal, duration, e = ease.inOutSine) {
    const list = keys.filter((k) => Math.abs(V[k] - goal[k]) > 1e-6);
    if (!list.length) return Promise.resolve(true);
    const from = list.map((k) => V[k]);
    return tweener
      .animate({
        key: 'step',
        duration,
        ease: e,
        onUpdate: (k) => {
          if (!alive()) return;
          list.forEach((n, i) => {
            V[n] = from[i] + (goal[n] - from[i]) * k;
          });
          apply();
          stage.invalidate();
        },
      })
      .finished.then(() => {
        if (!alive()) return false;
        for (const n of list) V[n] = goal[n];
        apply();
        return true;
      });
  }

  /** One step of the story, and any jump between steps: what must go goes first, then the mirror and the pencils, then the light. */
  async function run(name) {
    stopRun();
    const my = token;
    const alive = () => my === token;
    const goal = { ...POSE[name], u: uGoal(name) };
    s.busy = true;
    s.stage = name;
    clearLabels();
    coach?.setMode('off');
    draw();
    const frame = FRAME_OF[name];

    const down = {};
    for (const k of [...ALL_UPS, 'axis']) if (V[k] > goal[k]) down[k] = goal[k];
    const downKeys = Object.keys(down);
    if (downKeys.length && !(await move(alive, downKeys, { ...V, ...down }, 0.3))) return false;

    const rearing = V.u !== goal.u || V.row !== goal.row || V.curve !== goal.curve;
    if (s.frame !== frame) {
      const flown = fly(frame, rearing ? 1.5 : 0.9);
      if (!rearing) {
        await flown;
        if (!alive()) return false;
      }
    }
    if (rearing) {
      const bench = ['u', 'row'].filter((k) => V[k] !== goal[k]);
      if (bench.length && !(await move(alive, bench, goal, 1.3, ease.inOutCubic))) return false;
      if (V.curve !== goal.curve && !(await move(alive, ['curve'], goal, 1.5, ease.inOutCubic))) return false;
    }
    if (goal.axis > V.axis && !(await move(alive, ['axis'], goal, 0.3))) return false;

    const ups = UPS.filter(([k]) => goal[k] > V[k]);
    const rayUps = ups.filter(([k]) => k.startsWith('r'));
    if (rayUps.length > 3) {
      // a jump over several rays: they come together
      if (!(await move(alive, ups.flat(), goal, 0.8))) return false;
    } else {
      for (const [k] of ups) {
        const time = k.endsWith('in') ? 1 : k.endsWith('out') ? 0.9 : k.endsWith('ext') ? 1.1 : k === 'ghost' ? 1.2 : 0.45;
        if (!(await move(alive, [k], goal, time, k.startsWith('r') ? ease.linear : ease.inOutSine))) return false;
      }
    }
    s.busy = false;
    audio.tick();
    draw();
    if (name === 'move') coachOn();
    emitChange();
    return true;
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function poseNow() {
    if (s.frame === 'eye') return EYE;
    const f = FRAMES[s.frame](V.u, stage.width / stage.height);
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
    controls.enabled = s.frame !== 'eye' && !s.dragging; // at the eye the view is the eye's: it does not turn
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
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, ui.$('.pvc-panel-toggle'), () => rays.boxes(), () => action?.ringBox()],
  });
  const shown = new Map();
  const pts = new Map();
  /** A label pinned to a world point. `spots` are the places it may take, best first; key labels have no `optional`. */
  function label(id, on, text, x, y, z, color, spots, optional = false) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).set(x, y, z);
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
  const SPOTS = {
    up: [
      { dx: 0, dy: -24 },
      { dx: 22, dy: -26 },
      { dx: -22, dy: -26 },
      { dx: 34, dy: -12 },
      { dx: -34, dy: -12 },
    ],
    down: [
      { dx: 0, dy: 22 },
      { dx: 22, dy: 24 },
      { dx: -22, dy: 24 },
      { dx: 34, dy: 12 },
      { dx: -34, dy: 12 },
    ],
    left: [
      { dx: -24, dy: -8 },
      { dx: -26, dy: 12 },
      { dx: -14, dy: -24 },
      { dx: -14, dy: 24 },
    ],
    right: [
      { dx: 22, dy: -6 },
      { dx: 24, dy: 12 },
      { dx: 12, dy: -24 },
      { dx: 12, dy: 24 },
    ],
    mirror: [
      { dx: -8, dy: -34 },
      { dx: 18, dy: -32 },
      { dx: -34, dy: -24 },
      { dx: 34, dy: -24 },
    ],
    image: [
      { dx: -6, dy: 48 },
      { dx: 18, dy: 50 },
      { dx: -34, dy: 50 },
      { dx: -40, dy: -44 },
    ],
    x: [
      { dx: 0, dy: -22 },
      { dx: -18, dy: -22 },
      { dx: 18, dy: -18 },
      { dx: -26, dy: 8 },
      { dx: 22, dy: 8 },
      { dx: 14, dy: 22 },
    ],
    tab: [
      { dx: -6, dy: 0 },
      { dx: -6, dy: 22 },
      { dx: -6, dy: -22 },
      { dx: -6, dy: 44 },
    ],
    fleft: [
      { dx: -14, dy: 24 },
      { dx: -30, dy: 16 },
      { dx: -8, dy: 34 },
    ],
    onU: [
      { dx: 10, dy: 0 },
      { dx: 18, dy: -16 },
      { dx: 18, dy: 16 },
    ],
    onV: [
      { dx: -8, dy: 0 },
      { dx: -16, dy: -16 },
      { dx: -16, dy: 16 },
    ],
    far: [
      { dx: 0, dy: 36 },
      { dx: -30, dy: 34 },
      { dx: 30, dy: 34 },
      { dx: -44, dy: 16 },
      { dx: 0, dy: -36 },
    ],
    near: [
      { dx: 0, dy: 0 },
      { dx: 0, dy: -16 },
      { dx: 0, dy: 16 },
    ],
  };
  const camPoint = new THREE.Vector3();
  function labels() {
    const q = s.quiz;
    const calm = !s.busy && camK >= 1 && !s.userMovedCamera;
    const st = s.stage;
    const named = !q || q.named;
    const r = radiusOf(V.curve);
    const rim = -sag(r, MIRROR.half);
    const img = imageOf(V.u);
    const rv = rays.view;
    const onRays = V.axis >= 1 && !REAR.has(st);
    const small = stage.width < 330 || stage.height < 300;
    // past this a close frame lets the pencil go, and the tab says where it is
    const cap = st === 'see' ? SEE_U : st === 'image' ? IMAGE_U : Infinity;
    const inFrame = V.u <= cap;

    // the mirror and the pencil, by name
    const nameMirror = calm && !q && (st === 'see' || st === 'ray1' || REAR.has(st));
    label('mirror', nameMirror, t(V.curve > 0.5 ? 'l_mirror' : 'l_plane'), rim, AX + MIRROR.half + 1.2, 0, INK.dark, SPOTS.mirror);
    label('object', calm && !q && st === 'see' && inFrame, t('l_object'), V.u, AX + PENCIL + 0.2, 0, INK.dark, SPOTS.up);
    if (calm && !q && st === 'see') {
      camPoint.copy(camera.position);
      const p = seenAt({ x: camPoint.x, y: camPoint.y - AX, z: camPoint.z }, { x: V.u, y: PENCIL / 2, z: 0 });
      label('seen', true, t('l_seen'), p.x, AX + p.y, p.z, INK.dark, SPOTS.far);
    } else label('seen', false);
    // the pencil's letters
    const letters = calm && V.axis >= 1 && (st !== 'see' || !!q) && !REAR.has(st) && inFrame;
    label('x', letters, t('l_x'), V.u, AX + PENCIL, 0, INK.dark, SPOTS.x);
    label('y', letters && !small, t('l_y'), V.u, AX, 0, INK.dark, SPOTS.down, true);
    // the points on the axis
    const whole = !q && !small && st !== 'move';
    label('o', calm && V.showO >= 1 && named && onRays && st !== 'image', t(whole ? 'l_o' : 'l_o_short'), -r, AX, 0, INK.dark, SPOTS.down);
    label(
      'f',
      calm && V.showF >= 1 && named && onRays,
      t(whole ? 'l_f' : 'l_f_short'),
      -r / 2,
      AX,
      0,
      INK.focus,
      st === 'image' || st === 'move' ? SPOTS.down : SPOTS.up,
    );
    label(
      'p',
      calm && V.axis >= 1 && onRays && named && st !== 'see',
      t(whole && st !== 'ray2' && st !== 'ray3' ? 'l_p' : 'l_p_short'),
      0,
      AX,
      0,
      INK.dark,
      SPOTS.down,
    );
    // this step's ray, by name, where it is clear of the others
    const R = rv.rays;
    for (let i = 0; i < 3; i++) {
      const ray = R[i];
      const on = calm && !q && NOW[st] === i && V[`r${i + 1}out`] >= 1;
      label(
        `r${i}`,
        on,
        t(`l_r${i + 1}`),
        (ray.start.x + ray.hit.x) * 0.45,
        AX + (ray.start.y + ray.hit.y) / 2,
        0,
        INK.ray,
        i === 1 ? SPOTS.up : SPOTS.down,
        true,
      );
    }
    // the image
    const imageOn = calm && V.ghost >= 1;
    label('xi', imageOn, t('l_xi'), img.v, AX + img.height, 0, INK.dark, SPOTS.left);
    label('yi', imageOn && st !== 'move' && F0 - img.behind > 3, t('l_yi'), img.v, AX, 0, INK.dark, SPOTS.down, true);
    label('image', imageOn && !q && st === 'image', t('l_image'), img.v, AX, 0, INK.dark, SPOTS.image);
    // the distances, on the rail
    const barsOn = calm && V.bars >= 1;
    label('u', barsOn, t('l_u', { u: round(V.u, 1) }), V.u * 0.55, BAR_Y, 0, INK.dark, SPOTS.onU);
    label('v', barsOn && (!q || q.named), t('l_v', { v: round(img.behind, 1) }), img.v * 0.5, BAR_Y, 0, INK.focus, SPOTS.onV);
    // the pencil, if a close frame has left it out
    label('tab', calm && !q && !inFrame, t('l_tab', { u: round(V.u, 1) }), cap + 1, AX - 2.5, 0, INK.dark, SPOTS.tab);
    // over the bench
    const top = calm && V.cone + V.flat > 0;
    label('eye', calm && V.eye >= 1, t('l_eye'), EYE_X, AX, 0, INK.dark, SPOTS.up);
    label('coneFlat', top && V.flat >= 1, t('l_cone_flat', { n: pencilsSeen(FLAT_R) }), 40, AX, -8, '#1864ab', SPOTS.near);
    label('cone', top && V.cone >= 1, t('l_cone', { n: pencilsSeen(R0) }), 26, AX, 32, INK.ray, SPOTS.near);
    // the test's letters on the axis
    for (let i = 0; i < 4; i++) {
      const on = calm && !!q?.points && !q.named;
      label(`pt${i}`, on, on ? t(`tag_${i}`) : '', q?.points?.[i] ?? 0, AX, 0, INK.dark, i % 2 ? SPOTS.up : SPOTS.down);
    }
    anno.update(); // places them now, on this frame's drawing (it asks for no new frame)
  }
  stage.onAfterRender(labels);

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function phase() {
    if (s.busy) return 'busy';
    if (s.stage === 'move') {
      if (!s.sawFar) return 'far';
      if (!s.sawNear) return 'near';
      return 'plane';
    }
    if (s.stage === 'wide') return 'again';
    return STAGES[STAGES.indexOf(s.stage) + 1];
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
    if (ph === 'far') return pencilTo(60);
    if (ph === 'near') return pencilTo(8);
    return run(ph);
  }
  function pick(word) {
    if (s.locked) return lockedNudge();
    if (!(word in WORDS)) return;
    if (WORD_OF[s.stage] === word && !s.busy && WORDS[word] === s.stage) return;
    audio.unlock();
    run(WORDS[word]);
  }
  function coachOn() {
    coach?.setMode('explore');
    coach?.start();
  }
  const movable = () => !s.locked && !s.busy && !REAR.has(s.stage);
  /** The pencil stands here; everything follows it at once. */
  function setPencil(x) {
    s.u = round(clamp(x, U.min, U.max), 1);
    V.u = s.u;
    if (s.stage === 'move') {
      if (s.u >= 45) s.sawFar = true;
      if (s.sawFar && s.u <= 12) s.sawNear = true;
    }
    apply();
    draw();
  }
  function pencilTo(x) {
    const my = token;
    const from = V.u;
    s.busy = true;
    draw();
    return tweener.animate({
      key: 'pencil',
      duration: 1.5,
      ease: ease.inOutSine,
      onUpdate: (k) => {
        if (my !== token) return;
        V.u = from + (x - from) * k;
        apply();
        stage.invalidate();
      },
      onComplete: () => {
        if (my !== token) return;
        s.busy = false;
        setPencil(x);
        emitChange();
      },
    }).finished;
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '', cap: '' };
  const ACTIONS = {
    busy: ['act_wait', ''],
    ray1: ['act_ray1', 1],
    ray2: ['act_ray2', 2],
    ray3: ['act_ray3', 3],
    image: ['act_image', 4],
    move: ['act_move', 5],
    far: ['act_far', ''],
    near: ['act_near', ''],
    plane: ['act_plane', 6],
    eye: ['act_eye', 7],
    wide: ['act_wide', 8],
    again: ['act_again', ''],
  };
  /** P to F, large: the line X′ can never leave, and the image on it. F on the left, the mirror on the right, as on the bench. */
  function zone(u) {
    const img = imageOf(u);
    const W = 320;
    const AXIS_Y = 60;
    const xOf = (cm) => 292 - (cm / F0) * 250;
    const yOf = (cm) => AXIS_Y - cm * 8.2;
    const x = xOf(img.behind);
    const y = yOf(img.height);
    return `<svg class="lab-zone" viewBox="0 0 ${W} 84" role="img" aria-label="${t('l_xi')}"><line class="z-axis" x1="24" y1="${AXIS_Y}" x2="${W - 8}" y2="${AXIS_Y}"/><line class="z-line" x1="${xOf(0)}" y1="${yOf(PENCIL)}" x2="${xOf(F0)}" y2="${AXIS_Y}"/><path class="z-mirror" d="M${xOf(0) + 7} 6 Q${xOf(0) - 5} ${AXIS_Y - 20} ${xOf(0) + 2} ${AXIS_Y + 8}"/><rect class="z-image" x="${x - 3.5}" y="${y}" width="7" height="${AXIS_Y - y}" rx="1"/><circle class="z-tip" cx="${x}" cy="${y}" r="5"/><text x="${x}" y="${Math.max(13, y - 9)}" text-anchor="middle">${t('zone_x')}</text><circle class="z-f" cx="${xOf(F0)}" cy="${AXIS_Y}" r="4.4"/><text class="z-f" x="${xOf(F0)}" y="81" text-anchor="middle">${t('zone_f')}</text><text x="${xOf(0)}" y="81" text-anchor="middle">${t('zone_p')}</text></svg>`;
  }
  function mText(m) {
    const f = fraction(m);
    return f ? `${f.n}/${f.d}` : round(m, 2);
  }
  function outcomeNow() {
    const st = s.stage;
    if (st === 'move') {
      const img = imageOf(s.u);
      return t('out_move', { u: round(s.u, 1), v: round(img.behind, 1), m: mText(img.m) });
    }
    if (st === 'plane') return t('out_plane', { n: pencilsSeen(FLAT_R) });
    if (st === 'eye') return t('out_eye', { n: pencilsSeen(R0) });
    if (st === 'wide') return t('out_wide', { a: pencilsSeen(FLAT_R), b: pencilsSeen(R0) });
    return t(`out_${st}`);
  }
  function ruleNow() {
    const st = s.stage;
    if (st === 'move') return zone(s.u) + t(s.sawNear ? 'rule_move_both' : s.sawFar ? 'rule_move_far' : 'rule_move');
    return t(`rule_${st}`);
  }
  function panel() {
    if (s.quiz) return;
    sheet.choose(WORD_OF[s.stage]);
    // the words wait for what they describe: while a step runs, the last ones stay
    if (!s.busy) {
      sheet.outcome(outcomeNow());
      sheet.rule(ruleNow());
    }
    const cap = WORD_OF[s.stage];
    if (steady.cap !== cap) {
      steady.cap = cap;
      caption.innerHTML = t(`cap_${cap}`);
    }
    const ph = phase();
    const nextWord = STAGES.includes(ph) ? WORD_OF[ph] : null;
    sheet.next(nextWord !== WORD_OF[s.stage] ? nextWord : null);
    const [word, step] = ACTIONS[ph] ?? ACTIONS.again;
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
  const aim = new THREE.Vector3();
  function target() {
    if (s.locked || s.busy || camK < 1 || s.dragging) return null;
    const ph = phase();
    if (ph === 'ray1' || ph === 'ray2' || ph === 'ray3') aim.set(V.u, AX + PENCIL + 3, 0);
    else if (ph === 'image') aim.set(imageOf(V.u).v, AX + imageOf(V.u).height + 3.5, 0);
    else if (ph === 'move') aim.set(V.u, AX + PENCIL + 3, 0);
    else if (ph === 'plane' || ph === 'eye' || ph === 'wide') aim.set(0, AX + MIRROR.half - 2.5, 0);
    else return null; // far and near are drags: the hand shows them
    setting.tapTarget.position.copy(aim);
    return aim;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_ray1',
    target: () => (o.coach ? target() : null), // a poster or a book page can do without the ring
    radius: 20,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // a tap on the part is the same action; a finger on the pencil moves it along the rail
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  let down = null;
  let drag = null;
  const toNdc = (e) => {
    const r = ui.canvasHost.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
  };
  const onPencil = (x, y) => {
    ndc.set((x / stage.width) * 2 - 1, 1 - (y / stage.height) * 2);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(setting.hit, false).length > 0;
  };
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      coach?.interrupt();
      down = { x: e.clientX, y: e.clientY, at: performance.now() };
      if (!movable() || (e.pointerType === 'mouse' && e.button !== 0)) return;
      toNdc(e);
      ray.setFromCamera(ndc, camera);
      if (!ray.intersectObject(setting.hit, false).length) return;
      // the rail on the screen: how many pixels to a centimetre, and which way
      pa.set(0, AX, 0).project(camera);
      pb.set(10, AX, 0).project(camera);
      const dx = ((pb.x - pa.x) / 2) * stage.width;
      const dy = ((pa.y - pb.y) / 2) * stage.height;
      const l = Math.hypot(dx, dy) || 1;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: s.u, ux: dx / l, uy: dy / l, perCm: l / 10 };
      s.dragging = true;
      capturePointer(ui.canvasHost, e.pointerId);
      e.stopPropagation();
      e.preventDefault();
      draw();
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const along = (e.clientX - drag.x) * drag.ux + (e.clientY - drag.y) * drag.uy;
    setPencil(drag.from + along / drag.perCm);
    coach?.objectUsed();
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    releasePointer(ui.canvasHost, drag.id);
    if (e && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down = null; // a tap on the pencil stays a tap
    drag = null;
    s.dragging = false;
    draw();
    emitChange();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.at < 600;
    down = null;
    if (moved > 8 || !quick || !target()) return;
    toNdc(e);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(setting.tapTarget, false).length) act();
  });

  if (o.coach) {
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, note],
      object: {
        label: 'coach_drag',
        labelAt: ['above', 'left', 'below'],
        labelAvoid: () => anno.boxes(),
        inset: { bottom: 16 },
        candidates: () => {
          pa.set(V.u, AX - 3, 0).project(camera);
          pb.set(V.u, AX + 3, 0).project(camera);
          const at = (p) => ({ x: ((p.x + 1) / 2) * stage.width, y: ((1 - p.y) / 2) * stage.height });
          return [at(pa), at(pb)];
        },
        grabbable: (p) => movable() && onPencil(p.x, p.y),
        // the pencil slides a little away and back, as if to say "this moves"
        async demo(alive) {
          const from = s.u;
          await tweener.animate({
            key: 'coach-nudge',
            duration: 1.1,
            onUpdate: (k) => {
              if (!alive()) return;
              V.u = from + 4 * Math.sin(k * Math.PI);
              apply();
              stage.invalidate();
            },
          }).finished;
          V.u = s.u;
          apply();
          stage.invalidate();
        },
        cancel: () => {
          tweener.cancel('coach-nudge');
          V.u = s.u;
          apply();
          stage.invalidate();
        },
      },
    });
    coach.setMode('off');
  }

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  const ORDER = ['rule', 'number', 'far', 'screen', 'rear'];
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  /** The scene of a question: a stage set at once, with what it may show. */
  function quizScene(q, name, { u = U.start, frame = FRAME_OF[name], change = {} } = {}) {
    stopRun();
    s.u = u;
    s.stage = name;
    settle(name);
    Object.assign(V, change);
    apply();
    s.frame = frame;
    s.quiz = { ...q, named: false };
    clearLabels();
    stage.invalidate();
  }
  const NO_RAYS = { r1in: 0, r1out: 0, r1ext: 0, r2in: 0, r2out: 0, r2ext: 0, r3in: 0, r3out: 0, r3ext: 0, showO: 0, showF: 0 };
  const Q = {
    rule() {
      const points = shuffle([-F0, -R0, 0, -F0 / 2]);
      const u = shuffle([15, 22, 30])[0];
      quizScene({ kind: 'rule', points }, 'ray2', { u, change: { ...NO_RAYS, r2in: 1, r2out: 1 } });
      const tag = (x) => t(`tag_${points.indexOf(x)}`);
      const wrong = [-R0, 0, -F0 / 2];
      return {
        text: t('q_rule'),
        answer: -F0,
        wrong,
        label: (x) => t('c_point', { x: tag(x) }),
        notes: notesOf([
          [-R0, t('n_rule_o')],
          [0, t('n_rule_p')],
          [-F0 / 2, t('n_rule_mid')],
        ]),
        reveal: t('a_rule', { x: tag(-F0) }),
        after: { r2ext: 1, showF: 1 },
      };
    },
    number() {
      const [u, v] = shuffle([
        [30, 10],
        [60, 12],
        [10, 6],
      ])[0];
      quizScene({ kind: 'number' }, 'move', { u, change: { ...NO_RAYS, ghost: 0, showF: 1 } });
      const sign = Math.abs((u * F0) / (u - F0));
      const wrong = [u, F0, sign === u || sign === F0 ? u + F0 : sign];
      return {
        text: t('q_number', { f: F0 }),
        answer: v,
        wrong,
        label: (x) => t('c_cm', { x }),
        notes: notesOf([
          [u, t('n_number_u')],
          [F0, t('n_number_f')],
          [wrong[2], t('n_number_sign')],
        ]),
        reveal: t('a_number', { u, f: F0, v, one: 1 }),
        after: { ghost: 1 },
      };
    },
    far() {
      quizScene({ kind: 'far' }, 'move', { u: 15, change: { ...NO_RAYS, r2in: 1, r2out: 1, r2ext: 1, showF: 1, bars: 0 } });
      const wrong = ['mirror', 'big', 'same'];
      return {
        text: t('q_far'),
        answer: 'right',
        wrong,
        label: (k) => t(`c_far_${k}`),
        notes: notesOf([
          ['mirror', t('n_far_mirror')],
          ['big', t('n_far_big')],
          ['same', t('n_far_same')],
        ]),
        reveal: t('a_far'),
        slideTo: 60,
      };
    },
    screen() {
      quizScene({ kind: 'screen' }, 'ray3', { u: 15 });
      const wrong = ['small', 'inv', 'dot'];
      return {
        text: t('q_screen'),
        answer: 'none',
        wrong,
        label: (k) => t(`c_screen_${k}`),
        notes: notesOf([
          ['small', t('n_screen_small')],
          ['inv', t('n_screen_inv')],
          ['dot', t('n_screen_dot')],
        ]),
        reveal: t('a_screen'),
      };
    },
    rear() {
      quizScene({ kind: 'rear' }, 'wide', { change: { curve: 0, cone: 0, flat: 1 } });
      const wrong = ['big', 'less', 'same'];
      return {
        text: t('q_rear'),
        answer: 'right',
        wrong,
        label: (k) => t(`c_rear_${k}`),
        notes: notesOf([
          ['big', t('n_rear_big')],
          ['less', t('n_rear_less')],
          ['same', t('n_rear_same')],
        ]),
        reveal: t('a_rear', { a: pencilsSeen(FLAT_R), b: pencilsSeen(R0) }),
        after: { curve: 1, cone: 1 },
      };
    },
  };
  const saved = { stage: 'see', u: U.start };
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
        // a step cut short by the test goes back to where it was ready to end
        const wasBusy = s.busy;
        stopRun();
        coach?.setMode('off');
        s.mode = 'quiz';
        s.locked = true;
        saved.stage = s.stage;
        saved.u = s.u;
        if (wasBusy) settle(s.stage);
        clearLabels();
        syncUI();
      },
      leave() {
        stopRun();
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        s.stage = saved.stage;
        s.u = saved.u;
        clearLabels();
        const was = s.frame;
        settle(s.stage);
        const frame = s.frame;
        s.frame = was;
        syncUI();
        fly(frame, 0.5);
        if (s.stage === 'move') coachOn();
        draw();
      },
      async prepare(i, alive, say) {
        const q = Q[ORDER[i]]();
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
          label: (n) => q.label(list[n]),
          meta: { kind: ORDER[i] },
        };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        if (s.quiz) {
          s.quiz.named = true;
          if (q.after) {
            Object.assign(V, q.after);
            apply();
          }
          if (q.slideTo != null)
            pencilTo(q.slideTo).then(() => {
              s.busy = false;
            });
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
    s.u = U.start;
    s.sawFar = false;
    s.sawNear = false;
    return run('see');
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  let lastTap = { what: '', at: 0 };
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest('button');
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
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (!movable()) return;
      setPencil(s.u + step);
      coach?.objectUsed();
      emitChange();
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
    const img = imageOf(s.u);
    return {
      stage: s.stage,
      u: s.u,
      f: -F0,
      r: R0,
      v: round(img.v, 3),
      m: round(img.m, 4),
      imageHeight: round(img.height, 3),
      miss: round(miss(s.u), 3),
      rays: rays.view.keys.filter((k) => k.in >= 1).length,
      ghost: V.ghost >= 1,
      curve: V.curve,
      row: V.row >= 1,
      seen: V.curve >= 1 ? pencilsSeen(R0) : pencilsSeen(FLAT_R),
      sawFar: s.sawFar,
      sawNear: s.sawNear,
      busy: s.busy,
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
    const k = JSON.stringify([snap.stage, snap.u]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }
  /** At once: what the book or a test asks to see. */
  function jump(name) {
    stopRun();
    s.stage = name;
    clearLabels();
    settle(name);
    if (name === 'move') coachOn();
    else coach?.setMode('off');
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  jump(start);
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
      if (STAGES.includes(p.stage)) {
        if (p.u != null) s.u = pickU(p.u);
        if (animate)
          run(p.stage); // the story takes its time: the answer does not wait for it
        else jump(p.stage);
      } else if (p.u != null && movable()) {
        setPencil(pickU(p.u));
      }
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.u = U.start;
      s.sawFar = false;
      s.sawNear = false;
      jump('see');
      setView('front', { animate: false });
      camK = 1;
      draw();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** The view with its drawing on it, cover-fitted to the size asked for (background: null keeps it transparent). */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      stage.render();
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      const ctx = c.getContext('2d');
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
      return c.toDataURL('image/png');
    },
    exportRoot: () => setting.apparatus,
  };
}
