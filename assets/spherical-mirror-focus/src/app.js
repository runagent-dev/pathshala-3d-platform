// Spherical mirrors and their focus (book pp 223–228 and 235, topics 8.4, 8.5, 8.6, 8.8.3): the student view. A hollow glass
// sphere of radius r; a piece is cut from it and silvered on its inner surface, and stands on the optical bench as a concave
// mirror. Parallel light meets at F; f is measured on the printed scale and stays r/2 for every r; a wide bundle shows why that
// is only nearly true. A half turn and a coat on the other surface make it convex: the light spreads, and only seems to come
// from F behind the mirror. Last, a bulb at the concave mirror's F gives a parallel beam, as in a torch. One action at a time,
// the camera going to each thing as it happens. The rays are traced (reading.js) and drawn as crisp lines over the view (rays.js).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { createSetting, FRAMES, RAIL, SCALE_POINT, SPHERE } from './bench.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  BOX_X,
  beamKind,
  bulbBundle,
  bulbRange,
  BUNDLE,
  clamp,
  exactCrossing,
  focusX,
  MIRROR,
  parallelBundle,
  R0,
  RADII,
  round,
  sag,
  shuffle,
} from './reading.js';

export const DEFAULTS = {
  stage: 'sphere', // one of STAGES
  r: R0, // the sphere's radius, cm: one of RADII
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the part
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

/** The story, in order. */
export const STAGES = ['sphere', 'cut', 'coated', 'rays', 'measure', 'wide', 'convex', 'virtual', 'torch'];
/** The words in the panel, and the stage each one starts at. */
const WORDS = { sphere: 'sphere', concave: 'coated', convex: 'convex', torch: 'torch' };
const WORD_OF = {
  sphere: 'sphere',
  cut: 'sphere',
  coated: 'concave',
  rays: 'concave',
  measure: 'concave',
  wide: 'concave',
  convex: 'convex',
  virtual: 'convex',
  torch: 'torch',
};
const RADIUS_STAGES = new Set(['measure', 'virtual']);

const REST = {
  capOut: 1,
  mount: 1,
  sphere: 0,
  turn: 0,
  coat: 1,
  box: 1,
  lamp: 0,
  bulb: 0,
  lit: 0,
  inK: 0,
  outK: 0,
  extK: 0,
  bars: 0,
  circle: 0,
  axis: 1,
  showF: 0,
  showO: 0,
  marks: 0,
  half: BUNDLE.narrow,
  crossings: 0,
  star: 0,
  source: 'box',
};
/** What each stage shows: the end of the step that leads to it. */
const POSE = {
  sphere: { ...REST, capOut: 0, mount: 0, sphere: 1, coat: 0, axis: 0, box: 0 },
  cut: { ...REST, mount: 0, sphere: 1, coat: 0, axis: 0, box: 0 },
  coated: { ...REST },
  rays: { ...REST, lamp: 1, inK: 1, outK: 1, showF: 1, star: 1 },
  measure: { ...REST, lamp: 1, inK: 1, outK: 1, showF: 1, showO: 1, marks: 1, bars: 1, circle: 1, star: 1 },
  wide: { ...REST, lamp: 1, inK: 1, outK: 1, showF: 1, half: BUNDLE.wide, crossings: 1, star: 0.5 },
  convex: { ...REST, turn: 1, lamp: 1, inK: 1, outK: 1 },
  virtual: { ...REST, turn: 1, lamp: 1, inK: 1, outK: 1, extK: 1, showF: 1, showO: 1, marks: 1, bars: 1, circle: 1 },
  torch: { ...REST, box: 0, bulb: 1, lit: 1, inK: 1, outK: 1, showF: 1, marks: 0, source: 'bulb' },
};
/** The view a stage ends in, and the one its light starts from. */
const FRAME_OF = {
  sphere: 'sphere',
  cut: 'cut',
  coated: 'bench',
  rays: 'focus',
  measure: 'measure',
  wide: 'wide',
  convex: 'convex',
  virtual: 'virtual',
  torch: 'torch',
};
const FIRST_FRAME = { rays: 'bench' };

const MARGINS = { top: 12, bottom: 10, side: 8 };
const INK = { dark: '#2b3a4a', ray: '#8a4f00', focus: '#5a37d0', box: '#2b3a4a' };

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
      examples: { label: 'ex_label', items: Object.keys(WORDS).map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  // the choice of r shares the place of the result line, so that nothing moves when it comes
  const out = ui.$('.pvc-outcome');
  const place = document.createElement('div');
  place.className = 'lab-result';
  out.replaceWith(place);
  place.appendChild(out);
  const radii = document.createElement('div');
  radii.className = 'lab-radii';
  radii.innerHTML = `<i class="lab-r-sym">r</i><span class="lab-r-eq">=</span>${RADII.map((x, i) => `<button type="button" class="lab-r" data-r="${i}" aria-label="${t('r_aria', { x })}">${t.num(x)}</button>`).join('')}<span class="lab-r-unit">${t('unit_cm')}</span><span class="lab-r-f"></span>`;
  place.appendChild(radii);
  const radiusButtons = [...radii.querySelectorAll('.lab-r')];
  const radiusF = radii.querySelector('.lab-r-f');
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
  controls.minPolarAngle = THREE.MathUtils.degToRad(55);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-10);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(80);
  const setting = createSetting({ stage, shadow: Boolean(o.shadow), t });
  const rays = createRays({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const start = STAGES.includes(o.stage) ? o.stage : 'sphere';
  const pickR = (r) => (RADII.includes(Number(r)) ? Number(r) : R0);
  const s = {
    stage: start,
    r: pickR(o.r), // the radius the student chose
    bulbX: pickR(o.r) / 2,
    tried: new Set(), // which of the bulb's other places the student has seen
    source: 'box',
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
  const V = { ...POSE.sphere, alpha: 1, r: s.r, bulbX: s.bulbX };
  const _NUMBERS = Object.keys(POSE.sphere).filter((k) => k !== 'source');
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  const kindNow = () => (V.turn > 0.5 ? 'convex' : 'concave');
  const isRadiusStage = () => RADIUS_STAGES.has(s.stage);

  // ── what the 3D shows, from V ──────────────────────────────────────────────────────────────────────────
  let traced = '';
  function trace() {
    const key = `${kindNow()}|${V.r}|${V.half}|${V.source}|${V.bulbX}`;
    if (key === traced) return;
    traced = key;
    const rv = rays.view;
    if (V.source === 'bulb') rv.rays = bulbBundle(V.r, V.bulbX);
    else rv.rays = parallelBundle(kindNow(), V.r, V.half);
  }
  function apply() {
    trace();
    const rv = rays.view;
    rv.kind = kindNow();
    rv.r = V.r;
    rv.source = V.source;
    rv.inK = V.inK;
    rv.outK = V.outK;
    rv.extK = V.extK;
    rv.alpha = V.alpha;
    rv.axis = V.axis;
    rv.marks = V.marks;
    rv.showF = V.showF;
    rv.showO = V.showO;
    rv.bars = V.bars;
    rv.circle = V.circle;
    rv.crossings = V.crossings;
    rv.chevX = Math.max(18, Math.min(44, V.r * 0.96 + 2));
    rv.radiusOnly = V.sphere > 0.02 ? radiusLine : null;
    note.hidden = V.inK <= 0;
    radiusLine.k = V.sphere;
    setting.sphere.set(V.sphere);
    setting.placeMirror({ capOut: V.capOut, mount: V.mount, turn: V.turn, coat: V.coat, r: V.r });
    setting.placeBox(V.box, V.half, V.lamp);
    setting.placeBulb(V.bulb, V.bulbX, V.lit);
    setting.placeStar(focusX('concave', V.r), kindNow() === 'concave' && V.outK >= 1 ? V.star * V.alpha : 0, V.half > 6 ? 7 : 9);
  }
  // the first step's radius, from O to the edge of the piece: drawn alone, in the air
  const radiusLine = { x: SPHERE.x, y: SPHERE.y, r: SPHERE.r, cos: Math.sqrt(1 - (MIRROR.half / SPHERE.r) ** 2), sin: MIRROR.half / SPHERE.r, k: 1 };

  const RUNS = ['step', 'camera', 'radius', 'bulb'];
  function stopRun() {
    ++token;
    for (const k of RUNS) tweener.cancel(k);
    camK = 1;
    s.busy = false;
  }
  /** Everything in its final place at once. */
  function settle(name) {
    const goal = POSE[name];
    Object.assign(V, goal);
    V.alpha = 1;
    V.source = goal.source;
    V.r = s.r;
    V.bulbX = s.bulbX;
    s.source = goal.source;
    s.frame = FRAME_OF[name];
    traced = '';
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

  /**
   * One step of the story, told by the camera, and any jump between steps: what must go goes first, the piece and the mirror
   * move next, and only then the light comes, cause before effect.
   */
  async function run(name) {
    stopRun();
    const my = token;
    const alive = () => my === token;
    const goal = POSE[name];
    s.busy = true;
    s.stage = name;
    if (name !== 'torch') s.tried.clear();
    clearLabels();
    draw();
    if (name === 'sphere' || name === 'cut' || name === 'coated') s.r = R0;
    if (goal.bulb > 0 || V.bulb > 0) s.bulbX = s.r / 2;
    const changing = goal.source !== V.source || goal.turn > 0.5 !== V.turn > 0.5 || goal.inK === 0 || s.r !== V.r;

    // what goes: the light first, if it will not stay
    if (V.inK > 0 && changing) {
      if (!(await move(alive, ['alpha'], { alpha: 0 }, 0.28))) return false;
      Object.assign(V, { inK: 0, outK: 0, extK: 0, lamp: 0, lit: 0, crossings: 0, star: 0, alpha: 1 });
      apply();
    }
    const down = {};
    for (const k of ['bars', 'circle', 'marks', 'showF', 'showO', 'extK', 'crossings', 'half']) down[k] = Math.min(V[k], goal[k]);
    if (!(await move(alive, Object.keys(down), down, 0.3))) return false;
    if (s.r !== V.r && !(await move(alive, ['r'], { r: s.r }, 0.45))) return false;
    V.bulbX = s.bulbX;

    // back to the sphere: the piece goes up again, as it came
    if (goal.mount < V.mount) {
      fly(FRAME_OF[name], 1.3);
      if (!(await move(alive, ['mount', 'sphere', 'capOut', 'coat', 'turn', 'box', 'bulb'], goal, 1.3, ease.inOutCubic))) return false;
    }
    // the piece out of the sphere
    if (goal.capOut !== V.capOut) {
      fly('cut', 0.8);
      if (!(await move(alive, ['capOut'], goal, 1.1, ease.inOutCubic))) return false;
    }
    // silver on the piece while it is still in the air, then down to the holder
    const coatFirst = goal.coat > V.coat && goal.turn === V.turn;
    if (coatFirst) {
      if (!(await move(alive, ['coat'], goal, 1.3))) return false;
      audio.tick();
    }
    if (goal.mount !== V.mount || goal.sphere !== V.sphere) {
      fly(FIRST_FRAME[name] ?? FRAME_OF[name], 1.5);
      if (!(await move(alive, ['mount', 'sphere', 'box'], goal, 1.5, ease.inOutCubic))) return false;
    }
    // the half turn: the old coat goes, the other surface comes round, and the new coat spreads
    const turning = goal.turn !== V.turn;
    if (turning || goal.box !== V.box || goal.bulb !== V.bulb) {
      const after = { ...goal };
      if (turning) after.coat = 0;
      const moved = move(alive, ['turn', 'box', 'bulb', ...(turning ? ['coat'] : [])], after, 1.3, ease.inOutCubic);
      fly(FIRST_FRAME[name] ?? FRAME_OF[name], 1.1);
      V.source = goal.source;
      s.source = goal.source;
      if (!(await moved)) return false;
    } else if (s.frame !== (FIRST_FRAME[name] ?? FRAME_OF[name])) {
      fly(FIRST_FRAME[name] ?? FRAME_OF[name], 0.8);
      if (goal.inK > V.inK || name === 'coated') await tweener.animate({ key: 'step', duration: 0.55 }).finished;
      if (!alive()) return false;
    }
    if (goal.coat > V.coat) {
      if (!(await move(alive, ['coat'], goal, 1.2))) return false;
      audio.tick();
    }
    // the light comes
    if (goal.inK > V.inK) {
      if (goal.lamp > V.lamp) await move(alive, ['lamp'], goal, 0.3);
      if (!alive()) return false;
      if (goal.lit > V.lit) await move(alive, ['lit'], goal, 0.35);
      if (!alive()) return false;
      if (!(await move(alive, ['inK'], goal, goal.source === 'bulb' ? 0.7 : 1.0, ease.linear))) return false;
      if (FIRST_FRAME[name]) fly(FRAME_OF[name], 1.3);
      if (!(await move(alive, ['outK'], goal, goal.source === 'bulb' ? 1.0 : 1.2, ease.linear))) return false;
    }
    if (goal.half > V.half) {
      fly(FRAME_OF[name], 1.2);
      if (!(await move(alive, ['half'], goal, 1.1))) return false;
    }
    if (s.frame !== FRAME_OF[name]) {
      fly(FRAME_OF[name], 1);
      if (goal.extK > V.extK) await tweener.animate({ key: 'step', duration: 0.7 }).finished;
      if (!alive()) return false;
    }
    if (!(await move(alive, ['extK'], goal, 1.2))) return false;
    if (!(await move(alive, ['showF', 'star', 'lamp', 'lit'], goal, 0.5))) return false;
    if (!(await move(alive, ['showO', 'marks', 'bars', 'circle', 'crossings'], goal, 0.9))) return false;
    s.busy = false;
    audio.tick();
    draw();
    emitChange();
    return true;
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function poseNow() {
    const f = FRAMES[s.frame](V.r);
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
      { dx: 0, dy: -30 },
      { dx: 26, dy: -30 },
      { dx: -26, dy: -30 },
      { dx: 40, dy: -14 },
      { dx: -40, dy: -14 },
    ],
    down: [
      { dx: 0, dy: 26 },
      { dx: 24, dy: 28 },
      { dx: -24, dy: 28 },
      { dx: 36, dy: 12 },
      { dx: -36, dy: 12 },
    ],
    near: [
      { dx: 0, dy: 0 },
      { dx: 0, dy: -18 },
      { dx: 0, dy: 18 },
      { dx: 22, dy: -14 },
      { dx: -22, dy: -14 },
    ],
    mirror: [
      { dx: -6, dy: -40 },
      { dx: 18, dy: -40 },
      { dx: -30, dy: -30 },
      { dx: 30, dy: -24 },
      { dx: -44, dy: -8 },
    ],
    conv: [
      { dx: -14, dy: 26 },
      { dx: -26, dy: 30 },
      { dx: 0, dy: 40 },
    ],
    div: [
      { dx: 16, dy: 26 },
      { dx: 30, dy: 30 },
      { dx: 6, dy: 40 },
    ],
    barF: [
      { dx: 0, dy: 8 },
      { dx: -16, dy: 14 },
      { dx: 0, dy: 0 },
    ],
    barR: [
      { dx: 10, dy: -12 },
      { dx: 24, dy: -14 },
      { dx: 0, dy: -22 },
      { dx: 0, dy: 0 },
    ],
    beam: [
      { dx: 6, dy: -28 },
      { dx: 40, dy: -22 },
      { dx: -30, dy: -28 },
      { dx: 56, dy: -8 },
      { dx: 44, dy: 62 },
      { dx: 30, dy: 74 },
    ],
    edge: [
      { dx: -44, dy: 26 },
      { dx: -64, dy: 14 },
      { dx: -44, dy: -28 },
      { dx: -30, dy: 42 },
    ],
    high: [
      { dx: 0, dy: -46 },
      { dx: 22, dy: -46 },
      { dx: -22, dy: -46 },
      { dx: 0, dy: -36 },
      { dx: 0, dy: 32 },
    ],
    side: [
      { dx: -30, dy: -18 },
      { dx: 30, dy: -18 },
      { dx: -34, dy: 14 },
      { dx: 34, dy: 14 },
    ],
    pole: [
      { dx: -36, dy: 22 },
      { dx: -30, dy: 34 },
      { dx: 24, dy: 40 },
      { dx: -44, dy: -6 },
    ],
  };
  const AX = RAIL.axis;
  function labels() {
    const q = s.quiz;
    const calm = !s.busy && camK >= 1 && !s.userMovedCamera;
    const st = s.stage;
    const kind = kindNow();
    const named = !q || q.named;
    const fx = focusX(kind, V.r);
    const cx = kind === 'convex' ? -V.r : V.r;
    const sphereOn = calm && V.sphere > 0.5 && !q;
    label('sphere', sphereOn && st === 'sphere', t('l_sphere'), SPHERE.x + 21, SPHERE.y + 21, 0, INK.dark, SPOTS.up);
    label('o', sphereOn, t('l_o'), SPHERE.x, SPHERE.y, 0, INK.dark, SPOTS.down);
    label('rr', sphereOn && st === 'sphere', t('l_r'), SPHERE.x - 14, SPHERE.y + 3.4, 0, INK.dark, SPOTS.up, true);
    label('cap', sphereOn && st === 'sphere', t('l_cap'), SPHERE.x - SPHERE.r, SPHERE.y + 6, 0, INK.dark, SPOTS.side);
    const mirrored = calm && V.mount > 0.9 && named;
    const topEdge = kind === 'convex' ? -sag(V.r, MIRROR.half) : sag(V.r, MIRROR.half);
    const mirrorName = mirrored && (st === 'coated' || st === 'rays' || st === 'convex' || st === 'virtual' || st === 'torch' || !!q);
    label('mirror', mirrorName, t(kind === 'convex' ? 'l_convex' : 'l_concave'), topEdge, AX + MIRROR.half + 1, 0, INK.dark, SPOTS.mirror);
    const lit = calm && V.outK >= 1 && V.alpha > 0.9 && V.source === 'box';
    label('box', calm && !q && st === 'coated', t('l_box'), BOX_X - 0.2, AX + 12.4, 0, INK.dark, SPOTS.up);
    label('scale', calm && !q && st === 'coated', t('l_scale'), 30, SCALE_POINT.y, SCALE_POINT.z, INK.dark, SPOTS.down, true);
    const fOn = calm && V.showF >= 1 && (named || q?.showF);
    const whole = !q && (st === 'rays' || st === 'virtual' || st === 'torch');
    label('f', fOn, whole ? t('l_f') : t('l_f_short'), fx, AX, 0, INK.focus, st === 'rays' ? SPOTS.high : st === 'virtual' ? SPOTS.up : SPOTS.down);
    const fanTop = BUNDLE.narrow + 0.6;
    label(
      'parallel',
      lit && !q && (st === 'rays' || st === 'convex'),
      t('l_parallel'),
      Math.max(fx, 0) + (st === 'convex' ? 18 : V.r * 0.92),
      AX + fanTop,
      0,
      INK.ray,
      SPOTS.beam,
      true,
    );
    label('oo', calm && V.showO >= 1 && (named || q?.showO), t('l_o'), cx, AX, 0, INK.dark, kind === 'convex' && !q ? SPOTS.down : SPOTS.up);
    label(
      'p',
      calm && V.axis >= 1 && named && V.outK >= 1 && !s.quiz && st !== 'wide',
      t(st === 'measure' || st === 'virtual' ? 'l_p_short' : 'l_p'),
      0,
      AX,
      0,
      INK.dark,
      SPOTS.pole,
      true,
    );
    // the book's two words, each pinned to the lowest ray on its side of F
    label('conv', lit && !q && st === 'rays', t('l_conv'), V.r * 0.25, AX - BUNDLE.narrow * 0.5, 0, INK.ray, SPOTS.conv);
    label('div', lit && !q && st === 'rays', t('l_div'), V.r * 0.75, AX - BUNDLE.narrow * 0.5, 0, INK.ray, SPOTS.div);
    label('spread', lit && !q && st === 'convex', t('l_spread'), 15, AX + 10, 0, INK.ray, SPOTS.up, true);
    label('edge', calm && !q && st === 'wide', t('l_edge'), exactCrossing(V.r, BUNDLE.wide), AX, 0, INK.ray, SPOTS.edge);
    label('mid', calm && !q && st === 'wide', t('l_mid'), exactCrossing(V.r, BUNDLE.wide / 2), AX, 0, INK.ray, SPOTS.up, true);
    label('bulb', calm && V.bulb >= 1 && named && !s.quiz, t('l_bulb'), V.bulbX, AX + 1.3, 0, INK.dark, SPOTS.up);
    const beam = calm && V.source === 'bulb' && V.outK >= 1 && !q && beamKind(V.r, s.bulbX) === 'parallel';
    label('beam', beam, t('l_beam'), 37, AX + 6.8, 0, INK.ray, SPOTS.up);
    const barsOn = calm && V.bars >= 1 && named;
    label('barf', barsOn, t('l_bar_f', { f: round(V.r / 2, 1) }), fx * 0.46, RAIL.top + 2.2, 0, INK.focus, SPOTS.barF);
    label('barr', barsOn, t('l_bar_r', { r: V.r }), cx * (kind === 'convex' ? 0.62 : 0.88), RAIL.top + 5.2, 0, '#212529', SPOTS.barR);
    // the test's letters on the axis
    for (let i = 0; i < 4; i++) {
      const on = calm && !!q?.points && !q.named;
      label(`pt${i}`, on, on ? t(`tag_${i}`) : '', q?.points?.[i] ?? 0, AX, 0, INK.dark, SPOTS.up);
    }
    anno.update(); // places them now, on this frame's drawing (it asks for no new frame)
  }
  stage.onAfterRender(labels);

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function bulbNext() {
    const kind = beamKind(s.r, s.bulbX);
    if (kind !== 'parallel' && s.tried.has('spread') && s.tried.has('closing')) return 'bulb_f';
    if (!s.tried.has('spread')) return 'bulb_in';
    if (!s.tried.has('closing')) return 'bulb_out';
    return kind === 'parallel' ? 'again' : 'bulb_f';
  }
  function phase() {
    if (s.busy) return 'busy';
    if (s.stage === 'torch') return bulbNext();
    const i = STAGES.indexOf(s.stage);
    return STAGES[i + 1];
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
    if (ph === 'bulb_in') return bulbTo(s.r / 2 - s.r * 0.17);
    if (ph === 'bulb_out') return bulbTo(s.r / 2 + s.r * 0.2);
    if (ph === 'bulb_f') return bulbTo(s.r / 2);
    return run(ph);
  }
  function pick(word) {
    if (s.locked) return lockedNudge();
    if (!(word in WORDS)) return;
    if (WORD_OF[s.stage] === word && !s.busy && WORDS[word] === s.stage) return;
    audio.unlock();
    run(WORDS[word]);
  }
  /** Another mirror: another sphere. The mirror, F, O and the camera all go there together. */
  function chooseR(r) {
    if (s.locked) return lockedNudge();
    if (!RADII.includes(r) || r === s.r || !isRadiusStage() || s.busy) return;
    audio.tick();
    glideR(r);
  }
  function glideR(r, duration = 0.8) {
    const my = token;
    const from = V.r;
    s.r = r;
    s.bulbX = r / 2;
    V.bulbX = r / 2;
    tweener.animate({
      key: 'radius',
      duration,
      ease: ease.inOutSine,
      onUpdate: (k) => {
        if (my !== token) return;
        V.r = from + (r - from) * k;
        apply();
        stage.invalidate();
      },
      onComplete: () => {
        if (my !== token) return;
        V.r = r;
        apply();
        draw();
        emitChange();
      },
    });
    draw();
  }
  function setBulb(x) {
    const range = bulbRange(s.r);
    let bx = clamp(x, range.min, range.max);
    const f = s.r / 2;
    if (Math.abs(bx - f) < range.snap) bx = f;
    s.bulbX = round(bx, 2);
    V.bulbX = s.bulbX;
    const k = beamKind(s.r, s.bulbX);
    if (k !== 'parallel') s.tried.add(k);
    apply();
    draw();
  }
  function bulbTo(x) {
    if (s.stage !== 'torch') return;
    const my = token;
    const from = V.bulbX;
    s.busy = true;
    draw();
    tweener.animate({
      key: 'bulb',
      duration: 0.9,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        if (my !== token) return;
        V.bulbX = from + (x - from) * k;
        apply();
        stage.invalidate();
      },
      onComplete: () => {
        if (my !== token) return;
        s.busy = false;
        setBulb(x);
        emitChange();
      },
    });
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '', r: -1, on: null, cap: '' };
  const ACTIONS = {
    busy: ['act_wait', ''],
    cut: ['act_cut', 1],
    coated: ['act_coated', 2],
    rays: ['act_rays', 3],
    measure: ['act_measure', 4],
    wide: ['act_wide', 5],
    convex: ['act_convex', 6],
    virtual: ['act_virtual', 7],
    torch: ['act_torch', 8],
    bulb_in: ['act_bulb_in', ''],
    bulb_out: ['act_bulb_out', ''],
    bulb_f: ['act_bulb_f', ''],
    again: ['act_again', ''],
  };
  function outcomeNow() {
    const st = s.stage;
    if (st === 'sphere') return t('out_sphere', { r: R0 });
    if (st === 'cut') return t('out_cut');
    if (st === 'coated') return t('out_coated');
    if (st === 'rays') return t('out_rays');
    if (st === 'wide') return t('out_wide', { a: round(exactCrossing(s.r, BUNDLE.wide / 2), 1), b: round(exactCrossing(s.r, BUNDLE.wide), 1) });
    if (st === 'convex') return t('out_convex');
    if (st === 'torch') return t(`out_${beamKind(s.r, s.bulbX)}`);
    return '';
  }
  function ruleNow() {
    const st = s.stage;
    if (st === 'torch') {
      const k = beamKind(s.r, s.bulbX);
      return t(k === 'parallel' ? 'rule_torch' : `rule_torch_${k}`);
    }
    return t(`rule_${st}`, { r: s.r, f: s.r / 2, two: 2 });
  }
  function panel() {
    if (s.quiz) return;
    const on = isRadiusStage();
    if (steady.on !== on && !s.busy) {
      steady.on = on;
      radii.classList.toggle('on', on);
      out.classList.toggle('off', on);
      for (const b of radiusButtons) b.tabIndex = on ? 0 : -1;
    }
    if (steady.r !== s.r) {
      steady.r = s.r;
      radiusButtons.forEach((b, i) => {
        const here = RADII[i] === s.r;
        b.classList.toggle('on', here);
        b.setAttribute('aria-pressed', String(here));
      });
      radiusF.innerHTML = t('out_f', { f: s.r / 2 });
    }
    sheet.choose(WORD_OF[s.stage]);
    // the words wait for what they describe: while a step runs, the last ones stay
    if (!s.busy) {
      sheet.outcome(outcomeNow());
      sheet.rule(ruleNow());
    }
    if (steady.cap !== WORD_OF[s.stage]) {
      steady.cap = WORD_OF[s.stage];
      caption.innerHTML = t(`cap_${steady.cap}`);
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
    const cap = SPHERE.x - SPHERE.r - V.capOut * 8;
    if (ph === 'cut') aim.set(cap + 1.5, SPHERE.y - 9, 0);
    else if (ph === 'coated') aim.set(cap + 0.6, SPHERE.y, 0);
    else if (ph === 'rays') aim.set(BOX_X, AX + 3, 0);
    else if (ph === 'measure') aim.set(V.r / 2, AX - 8, 0);
    else if (ph === 'wide' || ph === 'convex' || ph === 'virtual' || ph === 'torch') aim.set(0, AX + 7.4, 0);
    else if (ph === 'bulb_in' || ph === 'bulb_out' || ph === 'bulb_f') aim.set(V.bulbX, AX, 0);
    else return null;
    setting.hit.position.copy(aim);
    return aim;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_cut',
    target: () => (o.coach ? target() : null), // a poster or a book page can do without the ring
    radius: 20,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // a tap on the part is the same action; a finger on the bulb moves it along the rail
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
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      down = { x: e.clientX, y: e.clientY, at: performance.now() };
      if (s.locked || s.busy || s.stage !== 'torch' || V.bulb < 1 || (e.pointerType === 'mouse' && e.button !== 0)) return;
      toNdc(e);
      ray.setFromCamera(ndc, camera);
      if (!ray.intersectObject(setting.bulbHit, false).length) return;
      // the rail on the screen: how many pixels to a centimetre, and which way
      pa.set(0, AX, 0).project(camera);
      pb.set(10, AX, 0).project(camera);
      const dx = ((pb.x - pa.x) / 2) * stage.width;
      const dy = ((pa.y - pb.y) / 2) * stage.height;
      const l = Math.hypot(dx, dy) || 1;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: s.bulbX, ux: dx / l, uy: dy / l, perCm: l / 10 };
      s.dragging = true;
      controls.enabled = false;
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
    setBulb(drag.from + along / drag.perCm);
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    releasePointer(ui.canvasHost, drag.id);
    if (e && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down = null; // a tap on the bulb stays a tap
    drag = null;
    s.dragging = false;
    controls.enabled = true;
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
    if (ray.intersectObject(setting.hit, false).length) act();
  });

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  const ORDER = ['kind', 'fromO', 'letters', 'bulb', 'plane'];
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  /** The scene of a question: a stage set at once, with what it may show. */
  function quizScene(q, name, { r = R0, bulbX = r / 2, frame = FRAME_OF[name], change = {} } = {}) {
    stopRun();
    s.r = r;
    s.bulbX = bulbX;
    s.stage = name;
    settle(name);
    Object.assign(V, { showF: 0, showO: 0, bars: 0, marks: 0, circle: 0, crossings: 0 }, change);
    traced = '';
    apply();
    s.frame = frame;
    s.quiz = { ...q, named: false };
    clearLabels();
    stage.invalidate();
  }
  const Q = {
    kind() {
      const kind = Math.random() < 0.5 ? 'concave' : 'convex';
      quizScene({ kind: 'kind' }, kind === 'concave' ? 'rays' : 'convex');
      const answer = `${kind}_${kind === 'concave' ? 'meet' : 'spread'}`;
      const other = kind === 'concave' ? 'convex' : 'concave';
      const wrong = [
        `${kind}_${kind === 'concave' ? 'spread' : 'meet'}`,
        `${other}_${kind === 'concave' ? 'meet' : 'spread'}`,
        `${other}_${kind === 'concave' ? 'spread' : 'meet'}`,
      ];
      return {
        text: t('q_kind'),
        answer,
        wrong,
        label: (k) => t(`c_kind_${k}`),
        notes: notesOf([
          [wrong[0], t('n_kind_path')],
          [wrong[1], t('n_kind_name')],
          [wrong[2], t('n_kind_both')],
        ]),
        reveal: t(`a_kind_${kind}`),
        after: { showF: kind === 'concave' ? 1 : 0 },
      };
    },
    fromO() {
      const r = shuffle([20, 40, 60])[0];
      quizScene({ kind: 'fromO', showO: true }, 'coated', { r, frame: 'measure', change: { showO: 1, marks: 1 } });
      const answer = r / 2;
      const wrong = [r, r * 2, r / 4];
      return {
        text: t('q_from_o'),
        answer,
        wrong,
        label: (k) => t('c_cm', { x: k }),
        notes: notesOf([
          [r, t('n_from_o_r')],
          [r * 2, t('n_from_o_double')],
          [r / 4, t('n_from_o_quarter')],
        ]),
        reveal: t('a_from_o', { r, f: answer, two: 2 }),
        after: { showF: 1, bars: 1 },
      };
    },
    letters() {
      const r = 30;
      const spots = shuffle([-r / 2, -r, 0, r / 2]);
      quizScene({ kind: 'letters', points: spots }, 'virtual', { r, change: { extK: 1 } });
      const tagOf = (x) => t(`tag_${spots.indexOf(x)}`);
      const answer = -r / 2;
      const wrong = [-r, 0, r / 2];
      return {
        text: t('q_letters'),
        answer,
        wrong,
        label: (x) => t('c_point', { x: tagOf(x) }),
        notes: notesOf([
          [-r, t('n_letters_o')],
          [0, t('n_letters_p')],
          [r / 2, t('n_letters_front')],
        ]),
        reveal: t('a_letters', { x: tagOf(answer) }),
        after: { showF: 1, showO: 1 },
      };
    },
    bulb() {
      const far = Math.random() < 0.5;
      const r = R0;
      const x = far ? r / 2 + 6 : r / 2 - 5;
      quizScene({ kind: 'bulb', showF: true }, 'torch', { r, bulbX: x, change: { showF: 1 } });
      const answer = far ? 'near' : 'far';
      const other = far ? 'far' : 'near';
      const wrong = [other, 'o', 'stay'];
      return {
        text: t('q_bulb'),
        answer,
        wrong,
        label: (k) => t(`c_bulb_${k}`),
        notes: notesOf([
          [other, t('n_bulb_wrong')],
          ['o', t('n_bulb_o')],
          ['stay', t('n_bulb_stay')],
        ]),
        reveal: t(`a_bulb_${answer}`),
        bulbBack: r / 2,
      };
    },
    plane() {
      const r = 60;
      quizScene({ kind: 'plane' }, 'rays', { r, frame: 'focus', change: { showF: 1 } });
      const wrong = ['zero', 'r', 'f'];
      return {
        text: t('q_plane', { r }),
        answer: 'inf',
        wrong,
        label: (k) => (k === 'inf' || k === 'zero' ? t(`c_plane_${k}`) : t('c_cm', { x: k === 'r' ? r : r / 2 })),
        notes: notesOf([
          ['zero', t('n_plane_zero')],
          ['r', t('n_plane_same')],
          ['f', t('n_plane_same')],
        ]),
        reveal: t('a_plane', { two: 2 }),
      };
    },
  };
  const saved = { stage: 'sphere', r: R0, bulbX: R0 / 2 };
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
        s.mode = 'quiz';
        s.locked = true;
        saved.stage = s.stage;
        saved.r = s.r;
        saved.bulbX = s.bulbX;
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
        s.r = saved.r;
        s.bulbX = saved.bulbX;
        clearLabels();
        const was = s.frame;
        settle(s.stage);
        const frame = s.frame;
        s.frame = was;
        syncUI();
        fly(frame, 0.5);
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
          meta: { kind: ORDER[i], answer: q.answer },
        };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        if (s.quiz) {
          s.quiz.named = true;
          if (q.after) {
            Object.assign(V, q.after);
            if (q.after.bars) V.circle = 1;
            apply();
          }
          if (q.bulbBack != null) {
            s.stage = 'torch';
            bulbTo(q.bulbBack);
            s.busy = false;
          }
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
    return run('sphere');
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  let lastTap = { what: '', at: 0 };
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    const what = b.dataset.act || b.dataset.example || b.dataset.r || '';
    const now = performance.now();
    if (what && what === lastTap.what && now - lastTap.at < 120) return;
    lastTap = { what, at: now };
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) pick(b.dataset.example);
    if (b.dataset.r != null) chooseR(RADII[Number(b.dataset.r)]);
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
      if (s.busy) return;
      if (s.stage === 'torch') setBulb(s.bulbX + step);
      else if (isRadiusStage()) chooseR(RADII[clamp(RADII.indexOf(s.r) + step, 0, RADII.length - 1)]);
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
    const kind = kindNow();
    return {
      stage: s.stage,
      kind,
      r: s.r,
      f: s.r / 2,
      focusAt: focusX(kind, s.r),
      bulbX: s.bulbX,
      beam: V.source === 'bulb' ? beamKind(s.r, s.bulbX) : null,
      rays: rays.view.rays.length,
      drawn: { in: V.inK >= 1, out: V.outK >= 1, ext: V.extK >= 1, bars: V.bars >= 1 },
      crossings: rays.view.rays.filter((r) => r.h > 0).map((r) => round(r.cross, 3)),
      spreads: rays.view.rays.filter((r) => r.h > 0).map((r) => round(r.slope ?? 0, 3)),
      coat: V.coat,
      mounted: V.mount >= 1,
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
    const k = JSON.stringify([snap.stage, snap.r, snap.bulbX]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }
  /** At once: what the book or a test asks to see. */
  function jump(name) {
    stopRun();
    s.stage = name;
    s.tried.clear();
    if (name === 'sphere' || name === 'cut' || name === 'coated') s.r = R0;
    s.bulbX = s.r / 2;
    clearLabels();
    settle(name);
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
      if (p.r != null && RADII.includes(Number(p.r))) {
        s.r = Number(p.r);
        s.bulbX = s.r / 2;
      }
      if (STAGES.includes(p.stage)) {
        if (animate)
          run(p.stage); // the story takes its time: the answer does not wait for it
        else jump(p.stage);
      } else if (p.r != null) {
        settle(s.stage);
      }
      if (p.bulb != null && s.stage === 'torch') setBulb(Number(p.bulb));
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.r = R0;
      s.bulbX = R0 / 2;
      jump('sphere');
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
