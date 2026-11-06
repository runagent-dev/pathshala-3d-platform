// Spherical mirrors and their focus (book pp 223–228 and 235, topics 8.4, 8.5, 8.6, 8.8.3): the student view. A hollow glass
// sphere of radius r; a piece is cut from it and silvered on its inner surface, and stands on the optical bench as a concave
// mirror. Parallel light meets at F; f is measured on the printed scale and stays r/2 for every r; a wide bundle shows why that
// is only nearly true. A half turn and a coat on the other surface make it convex: the light spreads, and only seems to come
// from F behind the mirror. Last, a bulb at the concave mirror's F gives a parallel beam, as in a torch. One action at a time,
// the camera going to each thing as it happens, unhurried (T), and each step waits for the student: nothing moves on by itself. The
// student can walk all the way round whatever is shown. The rays are traced (reading.js) and drawn as crisp lines over the view (rays.js).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createHowTo } from '@shared/student/howto.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { ICONS } from '@shared/student/icons.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { createSetting, FRAMES, RAIL, SCALE_POINT, SPHERE, SPIN } from './bench.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import {
  boxAt,
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
export const STAGES = ['sphere', 'cut', 'coated', 'rays', 'measure', 'wide', 'turned', 'convex', 'virtual', 'torch'];
/** The words in the panel, and the stage each one starts at. */
const WORDS = { sphere: 'sphere', concave: 'coated', convex: 'turned', torch: 'torch' };
const WORD_OF = {
  sphere: 'sphere',
  cut: 'sphere',
  coated: 'concave',
  rays: 'concave',
  measure: 'concave',
  wide: 'concave',
  turned: 'convex',
  convex: 'convex',
  virtual: 'convex',
  torch: 'torch',
};
const RADIUS_STAGES = new Set(['measure', 'virtual']);

/** The pace, seconds (the owner: a lab must not be over before the student has understood it). */
const T = {
  fly: 2, // every camera flight
  fade: 0.6, // the light or a measure going
  radius: 2.2, // the mirror going to another r
  cut: 2.8, // the piece coming out of the sphere
  look: 0.8, // its outer surface, before it turns
  show: 5, // its slow turn, from the outer surface to the inner
  coat: 2.8, // the silver spreading
  mount: 3.2, // the piece going down to the holder, or back up
  clear: 2, // the old coat going
  turn: 3.4, // the mirror turning over
  slide: 2.4, // a ray box or a bulb on the rail
  lamp: 0.6, // a lamp coming on
  rays: 3.2, // one way of the five rays, one after another: with the way back, about 1.2 s a ray
  widen: 2.6, // the light widening
  mark: 1, // F, or the gold on the curve, coming
  bars: 2, // the measures growing along the rail
  bulb: 2.4, // the bulb moved by the action
  hold: 1, // every result, before anything else can happen
};

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
  spin: SPIN.bench,
  tint: 0,
  bulge: 0,
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
  sphere: { ...REST, capOut: 0, mount: 0, sphere: 1, coat: 0, axis: 0, box: 0, spin: SPIN.sphere, tint: 1 },
  cut: { ...REST, mount: 0, sphere: 1, coat: 0, axis: 0, box: 0, spin: SPIN.shown, tint: 1 },
  coated: { ...REST },
  rays: { ...REST, lamp: 1, inK: 1, outK: 1, showF: 1, star: 1 },
  measure: { ...REST, lamp: 1, inK: 1, outK: 1, showF: 1, showO: 1, marks: 1, bars: 1, circle: 1, star: 1 },
  wide: { ...REST, lamp: 1, inK: 1, outK: 1, showF: 1, half: BUNDLE.wide, crossings: 1, star: 0.25 },
  turned: { ...REST, turn: 1, bulge: 1 },
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
  turned: 'turn',
  convex: 'convex',
  virtual: 'virtual',
  torch: 'torch',
};
const FIRST_FRAME = { rays: 'bench' };

const MARGINS = { top: 12, bottom: 10, side: 8 };
const INK = { dark: '#2b3a4a', ray: '#8a4f00', focus: '#5a37d0', box: '#2b3a4a', inner: '#1864ab', outer: '#8a5a00' };

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
      quiet: [
        { act: 'replay', label: 'act_again', icon: ICONS.play },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      tight: true,
      lines: { action: t.lang === 'en' ? 2 : 1, outcome: 1, rule: 4 },
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
  // the line before the action: what the next tap will show (on the first screen, a few calm words that set the scene)
  const lead = document.createElement('p');
  lead.className = 'lab-lead';
  ui.$('.pvc-act-row').before(lead);
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
  const setting = createSetting({ stage, shadow: Boolean(o.shadow), t });
  const rays = createRays({ stage, host: ui.canvasHost });
  rays.view.fmt = (x) => t.num(round(x, 1).toFixed(1));

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
    holding: false, // the last second of a step: the result is shown, and nothing can be tapped yet
    gliding: false, // the mirror going to another r
    beat: '', // the surface named while the step plays
    orbited: false,
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
  /** Taps are ignored while this is so: no queued jumps. */
  const playing = () => s.busy || s.gliding;

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
    rv.inset = V.crossings;
    rv.rimAt = V.crossings > 0 ? BUNDLE.wide * 0.8 : Infinity;
    rv.chevX = kindNow() === 'convex' ? 25 : V.r + 6;
    rv.arcK = V.axis * Math.cos(Math.PI * V.turn) ** 2; // the bright curve is the mirror's at rest: it goes while the mirror turns
    rv.bulge = V.bulge;
    rv.radiusOnly = V.sphere > 0.02 ? radiusLine : null;
    note.hidden = V.inK <= 0;
    radiusLine.k = V.sphere;
    radiusLine.cut = 1 - V.capOut;
    radiusLine.radius = s.stage === 'sphere' ? 1 : 1 - V.capOut;
    setting.sphere.set(V.sphere);
    setting.placeMirror({ capOut: V.capOut, mount: V.mount, turn: V.turn, spin: V.spin, coat: V.coat, tint: V.tint, r: V.r });
    rv.piece = V.tint > 0.02 ? pieceNow() : null;
    setting.placeBox(V.box, boxAt('concave', V.r) + (boxAt('convex', V.r) - boxAt('concave', V.r)) * V.turn, V.half, V.lamp);
    setting.placeBulb(V.bulb, V.bulbX, V.lit);
    setting.placeStar(focusX('concave', V.r), kindNow() === 'concave' && V.outK >= 1 ? V.star * V.alpha : 0, V.half > 6 ? 7 : 9);
  }
  // the lines on the side of the piece that faces the eye
  const piece = { k: 0, r: R0, a: 0, inner: false, x: 0, y: 0, z: 0, thick: MIRROR.thick };
  function pieceNow() {
    const p = setting.dish.root;
    piece.k = V.tint;
    piece.r = V.r;
    piece.a = p.rotation.y;
    piece.inner = setting.innerFacing(camera.position) > 0;
    piece.x = p.position.x;
    piece.y = p.position.y;
    piece.z = p.position.z;
    return piece;
  }
  // the first step's radius, from O to the edge of the piece: drawn alone, in the air
  const radiusLine = {
    x: SPHERE.x,
    y: SPHERE.y,
    r: SPHERE.r,
    cos: Math.sqrt(1 - (MIRROR.half / SPHERE.r) ** 2),
    sin: MIRROR.half / SPHERE.r,
    k: 1,
    cut: 1,
    radius: 1,
  };

  const RUNS = ['step', 'camera', 'radius', 'bulb'];
  function stopRun() {
    ++token;
    for (const k of RUNS) tweener.cancel(k);
    camK = 1;
    s.busy = false;
    s.holding = false;
    s.gliding = false;
    s.beat = '';
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
    const wait = (duration) => tweener.animate({ key: 'step', duration }).finished.then(alive);
    const first = FIRST_FRAME[name] ?? FRAME_OF[name];

    // what goes: the light first, if it will not stay
    if (V.inK > 0 && changing) {
      if (!(await move(alive, ['alpha'], { alpha: 0 }, T.fade))) return false;
      Object.assign(V, { inK: 0, outK: 0, extK: 0, lamp: 0, lit: 0, crossings: 0, star: 0, alpha: 1 });
      apply();
    }
    const down = {};
    for (const k of ['bars', 'circle', 'marks', 'showF', 'showO', 'extK', 'crossings', 'half']) down[k] = Math.min(V[k], goal[k]);
    if (!(await move(alive, Object.keys(down), down, T.fade))) return false;
    if (s.r !== V.r && !(await move(alive, ['r'], { r: s.r }, T.radius))) return false;
    V.bulbX = s.bulbX;

    // back to the sphere: the piece goes up again, as it came
    if (goal.mount < V.mount) {
      fly(FRAME_OF[name], T.mount);
      const keys = ['mount', 'sphere', 'capOut', 'coat', 'turn', 'spin', 'tint', 'box', 'bulb'];
      if (!(await move(alive, keys, goal, T.mount, ease.inOutCubic))) return false;
    }
    // the piece out of the sphere, its outer surface toward the student; or back into it
    if (goal.capOut !== V.capOut) {
      const out = goal.capOut > V.capOut;
      fly(out ? 'cut' : FRAME_OF[name], T.cut);
      if (!(await move(alive, out ? ['capOut'] : ['capOut', 'spin'], goal, T.cut, ease.inOutCubic))) return false;
    }
    // it turns slowly, so that its curve can be seen from both sides, each named as it comes round
    if (name === 'cut' && goal.spin !== V.spin) {
      if (!(await wait(T.look))) return false;
      if (!(await move(alive, ['spin'], goal, T.show))) return false;
    }
    // silver on the piece while it is still in the air, then down to the holder
    if (goal.coat > V.coat && goal.turn === V.turn) {
      s.beat = 'inner';
      if (!(await move(alive, ['coat'], goal, T.coat))) return false;
      audio.tick();
      if (!(await wait(T.hold))) return false;
      s.beat = '';
    }
    if (goal.mount !== V.mount || goal.sphere !== V.sphere) {
      fly(first, T.mount);
      if (!(await move(alive, ['mount', 'sphere', 'box', 'spin', 'tint'], goal, T.mount, ease.inOutCubic))) return false;
    }
    // the half turn: the old coat goes, the other surface comes round in its colour, named, and the new coat spreads over it
    if (goal.turn !== V.turn) {
      const toConvex = goal.turn > V.turn;
      fly(toConvex ? 'turn' : first, T.fly);
      if (!(await move(alive, ['coat'], { coat: 0 }, Math.max(T.clear, T.fly)))) return false;
      V.source = goal.source;
      s.source = goal.source;
      const after = { ...goal, tint: toConvex ? 1 : 0, bulge: 0 };
      if (!(await move(alive, ['turn', 'tint', 'box', 'bulb'], after, T.turn, ease.inOutCubic))) return false;
      if (toConvex) {
        s.beat = 'outer';
        if (!(await move(alive, ['bulge'], { bulge: 1 }, T.mark))) return false;
        if (!(await wait(T.hold))) return false;
      }
    } else if (goal.box !== V.box || goal.bulb !== V.bulb) {
      fly(first, T.fly);
      V.source = goal.source;
      s.source = goal.source;
      if (!(await move(alive, ['box', 'bulb'], goal, T.slide, ease.inOutCubic))) return false;
    }
    if (goal.coat > V.coat) {
      if (!(await move(alive, ['coat'], goal, T.coat))) return false;
      audio.tick();
    }
    if (!(await move(alive, ['tint', 'bulge'], goal, T.mark))) return false;
    s.beat = '';
    if (s.frame !== first) {
      fly(first, T.fly);
      if (!(await wait(T.fly))) return false;
    }
    // the light comes, one ray after another
    if (goal.inK > V.inK) {
      if (goal.lamp > V.lamp) await move(alive, ['lamp'], goal, T.lamp);
      if (!alive()) return false;
      if (goal.lit > V.lit) await move(alive, ['lit'], goal, T.lamp);
      if (!alive()) return false;
      if (!(await move(alive, ['inK'], goal, T.rays, ease.linear))) return false;
      if (FIRST_FRAME[name]) fly(FRAME_OF[name], T.rays);
      if (!(await move(alive, ['outK'], goal, T.rays, ease.linear))) return false;
    }
    if (goal.half > V.half) {
      fly(FRAME_OF[name], T.widen);
      if (!(await move(alive, ['half'], goal, T.widen))) return false;
    }
    if (s.frame !== FRAME_OF[name]) {
      fly(FRAME_OF[name], T.fly);
      if (!(await wait(T.fly))) return false;
    }
    if (!(await move(alive, ['extK'], goal, T.rays, ease.linear))) return false;
    if (!(await move(alive, ['showF', 'star', 'lamp', 'lit'], goal, T.mark))) return false;
    if (!(await move(alive, ['showO', 'marks', 'bars', 'circle', 'crossings'], goal, T.bars))) return false;
    // the result, a moment, before the student can go on
    s.holding = true;
    audio.tick();
    draw();
    if (!(await wait(T.hold))) return false;
    s.holding = false;
    s.busy = false;
    draw();
    emitChange();
    return true;
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  // a flight goes round the point it looks at, not through it: after a free turn the student may be behind the bench
  const camFrom = { target: new THREE.Vector3(), az: 0, el: 0, d: 1 };
  let camK = 1;
  const camDir = new THREE.Vector3();
  const camOff = new THREE.Vector3();
  function poseNow() {
    const f = FRAMES[s.frame](V.r, stage.width / Math.max(1, stage.height));
    dirFrom(f.az, f.el, camDir);
    return fitPose({ box: f.box, dir: camDir, camera, width: stage.width, height: stage.height, margin: MARGINS });
  }
  function applyCamera() {
    if (s.userMovedCamera) return;
    const pz = poseNow();
    if (camK < 1) {
      const k = ease.inOutCubic(camK);
      camOff.copy(pz.position).sub(pz.target);
      const d = camOff.length();
      const az = Math.atan2(camOff.x, camOff.z);
      const el = Math.asin(camOff.y / d);
      const turn = THREE.MathUtils.euclideanModulo(az - camFrom.az + Math.PI, Math.PI * 2) - Math.PI;
      controls.target.lerpVectors(camFrom.target, pz.target, k);
      const a = camFrom.az + turn * k;
      const e = camFrom.el + (el - camFrom.el) * k;
      const c = Math.cos(e);
      camera.position
        .set(Math.sin(a) * c, Math.sin(e), Math.cos(a) * c)
        .multiplyScalar(camFrom.d + (d - camFrom.d) * k)
        .add(controls.target);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
    }
    controls.update();
  }
  /** Back to the guided camera: the step's framing decides how far away it is. */
  function guided() {
    s.userMovedCamera = false;
    rotate.home();
  }
  /** The camera goes to a frame. Its promise settles when it arrives (or a finger takes over). */
  function fly(frame, duration = T.fly) {
    if (s.userMovedCamera) {
      guided();
      s.view = 'front';
      syncUI();
    }
    camOff.copy(camera.position).sub(controls.target);
    camFrom.d = camOff.length();
    camFrom.az = Math.atan2(camOff.x, camOff.z);
    camFrom.el = Math.asin(camOff.y / camFrom.d);
    camFrom.target.copy(controls.target);
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
    guided();
    syncUI();
    if (animate) fly(s.frame, T.fly);
    else camK = 1;
    stage.invalidate();
  }
  /** A finger has really moved the view (a tap has not): from here it is the student's, within sensible distances. */
  function takeOver() {
    if (s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    controls.maxDistance = Math.min(controls.maxDistance, 430); // inside the backdrop
    s.orbited = true;
    rotate.markUsed();
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  }
  // all the way round, from high above to just over the table, never under it
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${t.num(360)}°`,
    label: t('view_rotate'),
    pulse: Boolean(o.coach),
    zoom: [0.6, 1.6],
    onTurn: () => {
      controls.rotateSpeed = 1;
      takeOver();
    },
  });
  /** At once: the view from this azimuth (degrees round the bench) and height, for the book and the tests. */
  function orbitTo(az, el = 14) {
    applyCamera();
    takeOver();
    const d = camera.position.distanceTo(controls.target);
    dirFrom(az, el, camDir);
    camera.position.copy(controls.target).addScaledVector(camDir, d);
    controls.update();
    stage.invalidate();
  }
  // the kit also calls this when it lowers the resolution while the view moves, at the same CSS size: that must not take a turned
  // view back from the student. Only a page that really changed size frames the step again.
  const framed = { width: stage.width, height: stage.height };
  stage.onResize((width, height) => {
    if (width !== framed.width || height !== framed.height) {
      framed.width = width;
      framed.height = height;
      guided();
      if (s.view === '3d') {
        s.view = 'front';
        syncUI();
      }
    }
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
  });

  // ── labels on the picture: few and short, each pinned to what it names ───────────────────────────────────
  let action = null;
  let handle = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, rotate.el, ui.$('.pvc-panel-toggle'), () => rays.boxes(), () => action?.ringBox(), () => handle?.box()],
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
    rimRay: [
      { dx: 0, dy: -30 },
      { dx: 26, dy: -30 },
      { dx: 40, dy: -14 },
      { dx: 62, dy: -2 },
      { dx: 62, dy: 14 },
      { dx: -26, dy: -30 },
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
      { dx: -8, dy: -22 },
      { dx: 22, dy: -20 },
      { dx: -34, dy: -16 },
      { dx: 34, dy: -14 },
      { dx: -44, dy: -6 },
      { dx: 84, dy: 28 },
      { dx: 96, dy: -6 },
      { dx: 96, dy: 10 },
      { dx: 118, dy: -8 },
      { dx: 118, dy: 24 },
    ],
    far: [
      { dx: 70, dy: -26 },
      { dx: 60, dy: -40 },
      { dx: -60, dy: -40 },
    ],
    boxed: [
      { dx: -30, dy: -16 },
      { dx: -44, dy: -8 },
      { dx: -24, dy: 30 },
      { dx: -40, dy: 16 },
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
      { dx: 0, dy: 0 },
      { dx: 0, dy: 16 },
      { dx: -16, dy: 18 },
      { dx: 16, dy: 18 },
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
      { dx: 0, dy: -30 },
      { dx: 0, dy: -24 },
      { dx: 10, dy: -38 },
      { dx: -10, dy: -38 },
      { dx: 0, dy: 30 },
    ],
    side: [
      { dx: -30, dy: -18 },
      { dx: 30, dy: -18 },
      { dx: -34, dy: 14 },
      { dx: 34, dy: 14 },
    ],
    poleBack: [
      { dx: 26, dy: -32 },
      { dx: 30, dy: 22 },
      { dx: 34, dy: -12 },
      { dx: -30, dy: 30 },
    ],
    pieceUp: [
      { dx: 0, dy: -46 },
      { dx: 34, dy: -40 },
      { dx: -34, dy: -40 },
      { dx: 50, dy: -14 },
    ],
    pieceDown: [
      { dx: 0, dy: 46 },
      { dx: -34, dy: 40 },
      { dx: 34, dy: 40 },
      { dx: -50, dy: 14 },
    ],
    pole: [
      { dx: -30, dy: 42 },
      { dx: -44, dy: 28 },
      { dx: -24, dy: 56 },
      { dx: -44, dy: -8 },
      { dx: 26, dy: 58 },
    ],
  };
  const AX = RAIL.axis;
  const faceP = new THREE.Vector3();
  function labels() {
    const q = s.quiz;
    const calm = (!s.busy || s.holding) && camK >= 1; // they stay while the student walks round: they are on the screen, not in the scene
    const st = s.stage;
    const kind = kindNow();
    const named = !q || q.named;
    const fx = focusX(kind, V.r);
    const cx = kind === 'convex' ? -V.r : V.r;
    const sphereOn = calm && V.sphere > 0.5 && !q;
    label('sphere', sphereOn && st === 'sphere', t('l_sphere'), SPHERE.x + 21, SPHERE.y + 21, 0, INK.dark, SPOTS.up);
    label('o', sphereOn && st === 'sphere', t('l_o'), SPHERE.x, SPHERE.y, 0, INK.dark, SPOTS.down);
    label('rr', sphereOn && st === 'sphere', t('l_r'), SPHERE.x - 14, SPHERE.y + 3.4, 0, INK.dark, SPOTS.up, true);
    label('cap', sphereOn && st === 'sphere', t('l_cap'), SPHERE.x - 7, SPHERE.y + 7, SPHERE.r * 0.89, INK.dark, SPOTS.side);
    // the two sides of the piece, each named while it can be seen (near edge-on, both)
    const air = camK >= 1 && !q && V.mount <= 0 && V.capOut >= 1;
    const facing = setting.innerFacing(camera.position);
    setting.faceAt(false, 5, faceP);
    label('inner', air && facing > -0.45 && (st === 'cut' || s.beat === 'inner'), t('l_inner'), faceP.x, faceP.y, faceP.z, INK.inner, SPOTS.pieceUp);
    setting.faceAt(true, st === 'cut' ? -9 : -5, faceP);
    const turnedOn = !q && camK >= 1 && (s.beat === 'outer' || (st === 'turned' && calm));
    const seen = (air && st === 'cut') || turnedOn; // at rest in the air it is the far side: the label stays, on the rim's edge
    label('outer', seen, t('l_outer'), faceP.x, faceP.y, faceP.z, INK.outer, SPOTS.pieceDown);
    const mirrored = calm && V.mount > 0.9 && named;
    const topEdge = kind === 'convex' ? -sag(V.r, MIRROR.half) : sag(V.r, MIRROR.half);
    const mirrorName =
      mirrored && (st === 'coated' || st === 'rays' || st === 'turned' || st === 'convex' || st === 'virtual' || st === 'torch' || !!q);
    label('mirror', mirrorName, t(kind === 'convex' ? 'l_convex' : 'l_concave'), topEdge, AX + MIRROR.half + 1, 0, INK.dark, SPOTS.mirror);
    const lit = calm && V.outK >= 1 && V.alpha > 0.9 && V.source === 'box';
    const plate = boxAt(kind, V.r);
    label('box', calm && !q && V.box >= 1 && (st === 'coated' || lit), t('l_box'), plate - 0.2, AX + 12.2, 0, INK.dark, SPOTS.boxed, st !== 'coated');
    label('scale', calm && !q && st === 'coated', t('l_scale'), 18, SCALE_POINT.y, SCALE_POINT.z, INK.dark, SPOTS.down, true);
    const fOn = calm && V.showF >= 1 && (named || q?.showF);
    const whole = !q && (st === 'rays' || st === 'virtual' || st === 'torch');
    label('f', fOn, whole ? t('l_f') : t('l_f_short'), fx, AX, 0, INK.focus, st === 'rays' ? SPOTS.high : st === 'virtual' ? SPOTS.up : SPOTS.down);
    const fanTop = BUNDLE.narrow + 0.6;
    label(
      'parallel',
      lit && !q && (st === 'rays' || st === 'convex'),
      t('l_parallel'),
      plate - (st === 'convex' ? 5 : 7),
      AX + fanTop,
      0,
      INK.ray,
      SPOTS.beam,
      true,
    );
    label('oo', calm && V.showO >= 1 && (named || q?.showO), t('l_o'), cx, AX, 0, INK.dark, kind === 'convex' && !q ? SPOTS.down : SPOTS.up);
    // the book's two words, each pinned to the lowest ray on its side of F
    label('conv', lit && !q && st === 'rays', t('l_conv'), V.r * 0.25, AX - BUNDLE.narrow * 0.5, 0, INK.ray, SPOTS.conv);
    label('div', lit && !q && st === 'rays', t('l_div'), V.r * 0.75, AX - BUNDLE.narrow * 0.5, 0, INK.ray, SPOTS.div);
    label('spread', lit && !q && st === 'convex', t('l_spread'), 12, AX + 8, 0, INK.ray, SPOTS.up, true);
    // the two kinds of ray, each pinned to its own line
    const rs = rays.view.rays;
    const wideOn = calm && !q && st === 'wide' && rs.length === BUNDLE.count && V.crossings >= 1;
    const on = (ray, k) => [ray.hit.x + (ray.end.x - ray.hit.x) * k, AX + ray.hit.y + (ray.end.y - ray.hit.y) * k];
    if (wideOn) {
      const [ex, ey] = on(rs[4], 0.13);
      const [mx, my] = on(rs[1], 0.16);
      label('edge', true, t('l_edge'), ex, ey, 0, '#c2300e', SPOTS.rimRay);
      label('mid', true, t('l_mid'), mx, my, 0, INK.ray, SPOTS.down);
    } else {
      label('edge', false);
      label('mid', false);
    }
    label('bulb', calm && V.bulb >= 1 && named && !s.quiz, t('l_bulb'), V.bulbX, AX + 1.3, 0, INK.dark, SPOTS.up);
    const beam = calm && V.source === 'bulb' && V.outK >= 1 && !q && beamKind(V.r, s.bulbX) === 'parallel';
    label('beam', beam, t('l_beam'), 37, AX + 6.8, 0, INK.ray, SPOTS.up, true);
    const barsOn = calm && V.bars >= 1 && named;
    label('barf', barsOn, t('l_bar_f', { f: round(V.r / 2, 1) }), fx * 0.46, RAIL.top + 2.2, 0, INK.focus, SPOTS.barF);
    label('barr', barsOn, t('l_bar_r', { r: V.r }), cx * (kind === 'convex' ? 0.62 : 0.88), RAIL.top + 5.2, 0, '#212529', SPOTS.barR);
    label(
      'p',
      calm && V.axis >= 1 && named && V.outK >= 1 && !s.quiz && st !== 'wide',
      t(st === 'measure' || st === 'virtual' ? 'l_p_short' : 'l_p'),
      0,
      AX,
      0,
      INK.dark,
      kind === 'convex' ? SPOTS.poleBack : SPOTS.pole,
      true,
    );
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
    if (playing()) return 'busy';
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
    if (ph === 'busy' || camK < 1) return; // no queued jumps: a tap while anything plays, the camera included, does nothing
    if (ph === 'again') return quiz.start(); // the end of the story: the test is offered, never forced
    if (ph === 'bulb_in') return bulbTo(s.r / 2 - s.r * 0.17);
    if (ph === 'bulb_out') return bulbTo(s.r / 2 + s.r * 0.2);
    if (ph === 'bulb_f') return bulbTo(s.r / 2);
    return run(ph);
  }
  function pick(word) {
    if (s.locked) return lockedNudge();
    if (!(word in WORDS) || playing() || camK < 1) return;
    if (WORD_OF[s.stage] === word && WORDS[word] === s.stage) return;
    audio.unlock();
    run(WORDS[word]);
  }
  /** Another mirror: another sphere. The mirror, F, O and the camera all go there together. */
  function chooseR(r) {
    if (s.locked) return lockedNudge();
    if (!RADII.includes(r) || r === s.r || !isRadiusStage() || playing()) return;
    audio.tick();
    glideR(r);
  }
  function glideR(r, duration = T.radius) {
    const my = token;
    const from = V.r;
    const story = !s.quiz;
    s.r = r;
    s.bulbX = r / 2;
    V.bulbX = r / 2;
    s.gliding = story;
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
        if (!story) return;
        // the new mirror, a moment, before anything else can happen
        tweener.animate({ key: 'radius', duration: T.hold }).finished.then((ran) => {
          if (ran && my === token) {
            s.gliding = false;
            draw();
          }
        });
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
      duration: T.bulb,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        if (my !== token) return;
        V.bulbX = from + (x - from) * k;
        apply();
        stage.invalidate();
      },
      onComplete: () => {
        if (my !== token) return;
        setBulb(x);
        emitChange();
        if (s.quiz) return;
        s.holding = true;
        draw();
        tweener.animate({ key: 'bulb', duration: T.hold }).finished.then((ran) => {
          if (ran && my === token) {
            s.holding = false;
            s.busy = false;
            draw();
          }
        });
      },
    });
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '', r: -1, on: null, cap: '', lead: '' };
  const replayBtn = ui.$('[data-act="replay"]');
  const homeBtn = ui.$('[data-act="home"]');
  const ACTIONS = {
    busy: ['act_wait', ''],
    cut: ['act_cut', 1],
    coated: ['act_coated', 2],
    rays: ['act_rays', 3],
    measure: ['act_measure', 4],
    wide: ['act_wide', 5],
    turned: ['act_convex', 6],
    convex: ['act_rays', 7],
    virtual: ['act_virtual', 8],
    torch: ['act_torch', 9],
    bulb_in: ['act_bulb_in', ''],
    bulb_out: ['act_bulb_out', ''],
    bulb_f: ['act_bulb_f', ''],
    again: ['act_test', ''],
  };
  function outcomeNow() {
    const st = s.stage;
    if (st === 'sphere') return ''; // the first screen: no number yet
    if (st === 'cut') return t('out_cut');
    if (st === 'coated') return t('out_coated');
    if (st === 'rays') return t('out_rays');
    if (st === 'wide') return t('out_wide', { a: round(exactCrossing(s.r, BUNDLE.wide / 2), 1), b: round(exactCrossing(s.r, BUNDLE.wide), 1) });
    if (st === 'turned') return t('out_turned');
    if (st === 'convex') return t('out_convex');
    if (st === 'torch') return t(`out_${beamKind(s.r, s.bulbX)}`);
    return '';
  }
  function ruleNow() {
    const st = s.stage;
    if (st === 'sphere') return ''; // the first screen: only the calm words above the action
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
    if (!s.busy || s.holding) {
      sheet.outcome(outcomeNow());
      sheet.rule(ruleNow());
      const calm = s.stage === 'sphere';
      const ph = phase();
      const html = calm
        ? `<span class="lab-long">${t('intro')}</span><span class="lab-short">${t('intro_short')}</span>`
        : ph === 'busy'
          ? steady.lead
          : t(`lead_${ACTIONS[ph] ? ph : 'again'}`);
      if (steady.lead !== html) {
        steady.lead = html;
        lead.innerHTML = html;
        lead.classList.toggle('pvc-note', calm);
        ui.learn.classList.toggle('lab-calm', calm);
      }
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
    replayBtn.hidden = s.stage === 'sphere'; // the first step has nothing to play
    replayBtn.disabled = !enabled;
    homeBtn.disabled = !enabled;
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
    if (ph === 'cut') aim.set(SPHERE.x, SPHERE.y, SPHERE.r);
    else if (ph === 'coated') aim.copy(setting.dish.root.position);
    else if (ph === 'rays') aim.set(boxAt('concave', V.r), AX + 3, 0);
    else if (ph === 'measure') aim.set(V.r / 2, AX - 8, 0);
    else if (ph === 'wide')
      aim.set(boxAt('concave', V.r), AX + 2.5, 0); // the holes of the ray box
    else if (ph === 'turned')
      aim.set(sag(V.r, 5), AX + 5, 0); // the mirror itself, its upper half, clear of the stand
    else if (ph === 'convex')
      aim.set(0, AX, 0); // where the light will land
    else if (ph === 'virtual')
      aim.set(-V.r / 2, AX, 0); // where the rays will be seen to meet
    else if (ph === 'torch')
      aim.set(Math.min(V.r / 2, 18), AX, 0); // the concave mirror's F
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
    avoid: [ui.corner, ui.hint, note, rotate.el, () => anno.boxes(), () => handle.box()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // the bulb's handle: on the carrier's front, its track the bulb's whole range along the rail
  const handlePoint = new THREE.Vector3();
  const trackFrom = new THREE.Vector3();
  const trackTo = new THREE.Vector3();
  const HANDLE = { y: RAIL.carrier + 3.4, z: 0 }; // on the stalk, close under the bulb, its track over the dark table
  handle = createDragHandle(stage, {
    point: () => handlePoint.set(V.bulbX, HANDLE.y, HANDLE.z),
    axis: 'x',
    track: {
      from: () => trackFrom.set(bulbRange(s.r).min, HANDLE.y, HANDLE.z),
      to: () => trackTo.set(bulbRange(s.r).max, HANDLE.y, HANDLE.z),
    },
    label: t('drag_me'),
    aria: t('drag_aria'),
    pulse: Boolean(o.coach),
    when: () => s.stage === 'torch' && V.bulb >= 1 && !s.locked && (!s.busy || s.holding),
  });

  // ── how to use, in the panel: the same icons as on the view, with a few words (kit createHowTo) ──────────
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      // last: the bulb can be moved only in the torch step; before that it keeps its place unseen
      { kind: 'drag', axis: 'x', text: t('howto_bulb'), aria: t('aria_howto_bulb'), handle, when: () => s.stage === 'torch' && V.bulb >= 1 },
    ],
    { stage },
  );

  // a tap on the part is the same action; a finger on the bulb moves it along the rail; a finger anywhere else turns the view
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
      controls.rotateSpeed = s.userMovedCamera ? 1 : 0; // a tap is not a turn: nothing moves until the finger has gone 8 px
      if (s.locked || s.busy || s.stage !== 'torch' || V.bulb < 1 || (e.pointerType === 'mouse' && e.button !== 0)) return;
      toNdc(e);
      ray.setFromCamera(ndc, camera);
      const box = ui.canvasHost.getBoundingClientRect();
      if (!handle.hit(e.clientX - box.left, e.clientY - box.top) && !ray.intersectObject(setting.bulbHit, false).length) return;
      handle.markUsed();
      // the rail on the screen: how many pixels to a centimetre, and which way
      pa.set(0, AX, 0).project(camera);
      pb.set(10, AX, 0).project(camera);
      const dx = ((pb.x - pa.x) / 2) * stage.width;
      const dy = ((pa.y - pb.y) / 2) * stage.height;
      const l = Math.hypot(dx, dy) || 1;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: s.bulbX, ux: dx / l, uy: dy / l, perCm: Math.max(1, l / 10) }; // end-on, the rail is short on the screen
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
      quizScene({ kind: 'fromO', showO: true }, 'coated', { r, frame: 'scale', change: { showO: 1, marks: 1 } });
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
        frame: 'measure',
      };
    },
    letters() {
      const r = 30;
      const spots = shuffle([-r / 2, -r, 0, r / 2]);
      quizScene({ kind: 'letters', points: spots }, 'virtual', { r, change: { extK: 0 } });
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
        after: { showF: 1, showO: 1, extK: 1 },
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
      // the picture does it: the mirror flattens from r = 20 to r = 60, and F runs along the scale
      quizScene({ kind: 'plane', showF: true }, 'rays', { r: 20, frame: 'focus', change: { showF: 1 } });
      const wrong = ['p', 'o', 'behind'];
      return {
        text: t('q_plane'),
        answer: 'far',
        wrong,
        label: (k) => t(`c_plane_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_plane_${k}`)])),
        reveal: t('a_plane', { two: 2 }),
        glide: 60,
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
        fly(frame, T.fly);
        draw();
      },
      async prepare(i, alive, say) {
        const q = Q[ORDER[i]]();
        qCurrent = q;
        say(q.text);
        const done = await fly(s.frame, T.fly);
        if (!alive()) return null;
        if (!done) camK = 1;
        if (q.glide) glideR(q.glide, T.radius);
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
            if (q.frame) fly(q.frame, T.fly);
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
    if (playing() || camK < 1) return;
    return run('sphere');
  }
  /** The step just finished, once more, from where it began: the camera cuts back, and the step plays as it did. */
  function replay() {
    if (s.locked) return lockedNudge();
    const i = STAGES.indexOf(s.stage);
    if (i < 1 || playing() || camK < 1) return;
    const name = s.stage;
    guided();
    s.view = 'front';
    syncUI();
    s.bulbX = s.r / 2;
    settle(STAGES[i - 1]);
    return run(name);
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
    if (act_ === 'replay') replay();
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
      if (playing()) return;
      if (s.stage === 'torch') {
        handle.markUsed();
        setBulb(s.bulbX + step);
      }
      if (isRadiusStage()) chooseR(RADII[clamp(RADII.indexOf(s.r) + step, 0, RADII.length - 1)]);
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
      busy: playing(),
      frame: s.frame,
      az: round(THREE.MathUtils.radToDeg(Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z)), 1),
      polar: round(THREE.MathUtils.radToDeg(controls.getPolarAngle()), 1),
      orbited: s.orbited,
      pixelRatio: stage.pixelRatio,
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
    if (s.userMovedCamera) {
      // the book asked for a step: the camera goes back to its framing, or a turned view would be left looking at nothing
      guided();
      s.view = 'front';
      syncUI();
    }
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
      if (p.az != null) orbitTo(Number(p.az), p.el == null ? undefined : Number(p.el));
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
      s.orbited = false;
      rotate.rearm();
      handle.rearm();
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
