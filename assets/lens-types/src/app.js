// Lens and its types (book pp 255–257, topics 9.3.4 and 9.4; চিত্র ৯.১৪–৯.১৭): the student view. Two glass lenses stand in their
// rings on the chapter's optical bench. One tap at a time, unhurried, the camera going to each thing: ① both are cut through the middle
// (in imagination) and their sections show: the convex lens thick in the middle, the concave one thin (চিত্র ৯.১৪); ② ③ parallel
// light from a ray box meets at a point after the convex lens and spreads after the concave one (অভিসারী / অপসারী); ④ ⑤ each face is
// part of a sphere, centres C₁ and C₂, and the line through them is the principal axis (চিত্র ৯.১৫); ⑥ one face made flat is still a
// lens; ⑦ a laser's ray through a thick slab comes out parallel but moved aside, less as the slab thins (চিত্র ৯.১৬); ⑧ ⑨ through the
// centre of a thick lens the ray is moved aside, through a thin one it goes straight: the optical centre (চিত্র ৯.১৭). Every ray is
// traced with Snell's law at each face (reading.js) and drawn as crisp lines over the view (draw.js). The student can walk all the
// way round, drag the slab or lens thicker and thinner, and take a five-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createDragHandle } from '@shared/student/draghandle.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { createSetting, RAIL } from './bench.js';
import { fitPose } from './camera.js';
import { createDrawing } from './draw.js';
import { createI18n } from './i18n.js';
import {
  BOX_X,
  bookCentres,
  centreRay,
  clamp,
  focusFrom,
  LENS,
  lensOf,
  parallelRays,
  RAY_END,
  rightFace,
  round,
  runTo,
  SIDE,
  SLAB,
  shuffle,
  slabRay,
  THICK,
  thicknessAt,
} from './reading.js';

export const DEFAULTS = {
  stage: 'intro', // one of STAGES
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

/** The story, in order. */
export const STAGES = ['intro', 'kinds', 'converge', 'diverge', 'sphere', 'sphere2', 'plano', 'slab', 'centre', 'centre2'];
/** The words in the panel, and the stage each one starts at. */
const WORDS = { lens: 'kinds', light: 'converge', sphere: 'sphere', slab: 'slab', centre: 'centre' };
const WORD_OF = {
  intro: 'lens',
  kinds: 'lens',
  converge: 'light',
  diverge: 'light',
  sphere: 'sphere',
  sphere2: 'sphere',
  plano: 'sphere',
  slab: 'slab',
  centre: 'centre',
  centre2: 'centre',
};

/** The pace, seconds (the owner: flights ≥ 1.5 s, objects 1.5–2.5 s, rays about 1 s a segment, a 1 s hold on each result). */
const T = {
  fly: 2,
  fade: 0.6,
  lift: 1.8, // a stand lifted off the rail or set down on it
  slide: 2, // a stand sliding along the rail
  cut: 2.4, // the front halves taken away
  morph: 2.2, // a face going flat, a lens going back to its shape
  sphere: 2.6, // the circles drawn round
  lamp: 0.6,
  rays: 1.6, // the light up to and through the glass; then out of it
  ext: 1.4, // the rays extended back
  mark: 0.9,
  beam: 2.4, // the laser's beam, three segments
  thin: 3, // the slab or the lens made thin
  hold: 1,
};

const REST = {
  convX: -SIDE,
  concX: SIDE,
  convUp: 0,
  concUp: 0,
  boxUp: 1,
  slabUp: 1,
  laserUp: 1,
  convW: 1,
  concW: 1,
  plano: 0,
  cut: 0,
  sphA: 0,
  sphB: 0,
  lamp: 0,
  inK: 0,
  outK: 0,
  extK: 0,
  showF: 0,
  laserOn: 0,
  beamK: 0,
  origK: 0,
  slabT: SLAB.start,
  axis: 0,
  showO: 0,
  alpha: 1,
};
/** What each stage shows: the end of the step that leads to it. */
const POSE = {
  intro: { ...REST },
  kinds: { ...REST, cut: 1 },
  converge: { ...REST, convX: 0, concUp: 1, boxUp: 0, lamp: 1, inK: 1, outK: 1, showF: 1, axis: 1 },
  diverge: { ...REST, convX: 0, convUp: 1, concX: 0, boxUp: 0, lamp: 1, inK: 1, outK: 1, extK: 1, showF: 1, axis: 1 },
  sphere: { ...REST, convX: 0, concUp: 1, cut: 1, sphA: 1, axis: 1 },
  sphere2: { ...REST, concX: 0, convUp: 1, cut: 1, sphB: 1, axis: 1 },
  plano: { ...REST, cut: 1, plano: 1 },
  slab: { ...REST, convUp: 1, concUp: 1, slabUp: 0, laserUp: 0, laserOn: 1, beamK: 1, origK: 1, slabT: 3 },
  centre: { ...REST, convX: 0, concUp: 1, laserUp: 0, laserOn: 1, beamK: 1, origK: 1, convW: 0, showO: 1 },
  centre2: { ...REST, concX: 0, convUp: 1, laserUp: 0, laserOn: 1, beamK: 1, origK: 1, concW: 0, showO: 1 },
};
/** Where a step's thinning starts (the thick slab or lens), before its beam comes. */
const START_OF = { slab: { slabT: SLAB.start }, centre: { convW: THICK }, centre2: { concW: THICK } };
/** What the laser aims at in a stage. */
const AIM = { slab: 'slab', centre: 'convex', centre2: 'concave' };
/** The lens the ray box shines through. */
const RAY_LENS = { converge: 'convex', diverge: 'concave' };
const FRAME_OF = {
  intro: 'pair',
  kinds: 'pair',
  converge: 'light',
  diverge: 'light',
  sphere: 'spheres',
  sphere2: 'spheres',
  plano: 'pair',
  slab: 'laser',
  centre: 'laser',
  centre2: 'laser',
};
const AX = RAIL.axis;
const box = (a, b, c, d, e, f) => new THREE.Box3(new THREE.Vector3(a, b, c), new THREE.Vector3(d, e, f));
/** What the camera shows: a box to fill and the angle (az: degrees round from the front, negative = from the light's side; el: up). */
const FRAMES = {
  pair: (tall) => ({
    box: box(-SIDE - 8.5, AX - 8.6, -3, SIDE + 8.5, AX + 9.4, 3),
    az: tall ? -20 : -24,
    el: 12,
    margin: { top: 64, bottom: 10, side: 8 },
  }),
  light: (tall) => ({ box: box(BOX_X - (tall ? 2 : 4), AX - 9, -3, RAY_END, AX + 9.5, 3), az: -24, el: 10 }),
  spheres: () => ({ box: box(-31, AX - 16, -2, 31, AX + 16.5, 2), az: -20, el: 10 }),
  laser: (tall) => ({ box: box(tall ? -19 : -21, AX - 10, -3, 21, AX + 12.5, 3), az: -22, el: 10 }),
  single: () => ({ box: box(-10, AX - 10, -3, 10, AX + 9.5, 3), az: -12, el: 10 }),
  /** The test's four paths out of the lens's centre, and a little of the laser's beam. */
  paths: () => ({ box: box(-9, AX - 15, -2, 17, AX + 9, 2), az: -18, el: 8 }),
};
const MARGINS = { top: 46, bottom: 10, side: 8 };
const INK = { dark: '#1d2733', ray: '#8a4f00', focus: '#5a37d0', laser: '#b42323', axis: '#1d2733' };
const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const transparent = o.bg === 'transparent';

  root.classList.add('pvc', 'lab', 'lt');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: one action, one result, one rule ─────────────────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: Object.keys(WORDS).map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'replay', label: 'act_again', icon: ICONS.play },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      tight: true,
      lines: { action: t.lang === 'en' ? 2 : 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const lead = document.createElement('p');
  lead.className = 'lab-lead';
  ui.$('.pvc-act-row').before(lead);
  const caption = document.createElement('p');
  caption.className = 'lab-cap';
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'lab-note';
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 22, near: 4, far: 1200, environmentIntensity: 0.8 });
  const { camera, controls } = stage;
  controls.enablePan = false;
  const setting = createSetting({ stage, shadow: Boolean(o.shadow) && !transparent, t, transparent });
  const drawing = createDrawing({ stage, host: ui.canvasHost });
  const dv = drawing.view;

  // ── state ───────────────────────────────────────────────────────────────────────────────────────────────
  const start = STAGES.includes(o.stage) ? o.stage : 'intro';
  const s = {
    stage: start,
    busy: false,
    holding: false,
    dragging: false,
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    orbited: false,
    quiz: null,
    frame: FRAME_OF[start],
    aim: AIM[start] ?? 'slab',
    rayLens: RAY_LENS[start] ?? 'convex',
    thinned: false, // the student has dragged the thickness in this step
  };
  const V = { ...POSE[start] };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  const playing = () => s.busy;

  // ── what the 3D shows, from V ───────────────────────────────────────────────────────────────────────────
  const shapes = { convex: null, concave: null };
  const lensNow = (kind) => lensOf(kind, kind === 'convex' ? V.convW : V.concW, V.plano);
  let beam = null; // the laser's ray now
  let rays = null; // the ray box's rays now
  let focus = null;
  function laserRay() {
    if (s.aim === 'slab') return slabRay(V.slabT, 0);
    const L = shapes[s.aim];
    return centreRay(L, 0);
  }
  const foot = { x: 0, y: 0 };
  const exitAt = { x: 0, y: 0 };
  function apply() {
    shapes.convex = lensNow('convex');
    shapes.concave = lensNow('concave');
    for (const kind of ['convex', 'concave']) {
      const L = setting.lenses[kind];
      L.setShape(shapes[kind]);
      L.setCut(V.cut);
    }
    setting.placeLens('convex', V.convX, V.convUp);
    setting.placeLens('concave', V.concX, V.concUp);
    setting.placeBox(BOX_X, V.boxUp, V.lamp);
    setting.placeSlab(V.slabT, V.slabUp);
    // the laser: aimed along the ray the figure traces
    beam = laserRay();
    if (beam) {
      setting.placeLaser(beam.start, beam.dIn, V.laserUp, V.laserOn);
      const end = runTo(beam.b, beam.dOut, { floor: RAIL.carrier + 1 - AX, xMax: 21 });
      const len = Math.hypot(end.x - beam.b.x, end.y - beam.b.y);
      // the original direction, continued from where the ray entered, as far as the ray out goes
      const origEnd = { x: beam.a.x + beam.dIn.x * (len + 1.5), y: beam.a.y + beam.dIn.y * (len + 1.5) };
      // the shift: from the ray out, a little after it leaves, straight across to the original line
      exitAt.x = beam.b.x + beam.dOut.x * 3;
      exitAt.y = beam.b.y + beam.dOut.y * 3;
      const px = exitAt.x - beam.a.x;
      const py = exitAt.y - beam.a.y;
      const along = px * beam.dIn.x + py * beam.dIn.y;
      foot.x = beam.a.x + beam.dIn.x * along;
      foot.y = beam.a.y + beam.dIn.y * along;
      dv.beam = {
        start: beam.start,
        a: beam.a,
        b: beam.b,
        end,
        origEnd,
        k: V.beamK,
        origK: V.origK,
        shiftK: V.origK * (beam.shift > 0.05 ? 1 : 0),
        foot,
        at: exitAt,
      };
    } else dv.beam = null;
    // the ray box's light through the lens on the rail
    const kind = s.rayLens;
    rays = parallelRays(shapes[kind], 0);
    focus = focusFrom(shapes[kind], 0);
    dv.rays = V.inK > 0 ? { list: rays, inK: V.inK, outK: V.outK, extK: kind === 'concave' ? V.extK : 0, F: focus, showF: V.showF } : null;
    setting.placeStar(focus, 0, kind === 'convex' && V.outK >= 1 ? V.showF * 0.9 * V.alpha : 0, 3.2);
    dv.alpha = V.alpha;
    // the sections' outlines, while the lenses are cut
    dv.sections.length = 0;
    if (V.cut > 0.3) {
      if (V.convUp < 0.01) dv.sections.push({ L: shapes.convex, at: V.convX, k: (V.cut - 0.3) / 0.7 });
      if (V.concUp < 0.01) dv.sections.push({ L: shapes.concave, at: V.concX, k: (V.cut - 0.3) / 0.7 });
    }
    // the spheres of the faces: the book's circles, with their centres
    dv.circles.length = 0;
    for (const [kind, k, x] of [
      ['convex', V.sphA, V.convX],
      ['concave', V.sphB, V.concX],
    ]) {
      if (k <= 0) continue;
      const L = shapes[kind];
      const c = bookCentres(L);
      const r = Math.abs(1 / L.c1);
      dv.circles.push({ cx: x + c.c1, r, k, plus: true }, { cx: x + c.c2, r, k, plus: true });
      setting.placeSpheres(x + c.c1, x + c.c2, r, k);
    }
    if (V.sphA <= 0 && V.sphB <= 0) setting.placeSpheres(0, 0, 1, 0);
    // the principal axis: through the lens(es) on the rail
    dv.axis.k = V.axis;
    const sp = V.sphA > 0 || V.sphB > 0;
    dv.axis.x0 = sp ? -33 : BOX_X + 0.5;
    dv.axis.x1 = sp ? 33 : RAY_END;
    dv.dots.length = 0;
    if (V.showO > 0) dv.dots.push({ x: 0, y: 0, k: V.showO, color: '#1d2733', r: 3.6 });
    note.textContent = V.inK > 0 ? t('note_rays') : V.cut > 0.5 ? t('note_cut') : '';
    note.hidden = !note.textContent || s.mode === 'quiz';
    stage.invalidate();
  }

  const RUNS = ['step', 'camera', 'thick'];
  function stopRun() {
    ++token;
    for (const k of RUNS) tweener.cancel(k);
    camK = 1;
    s.busy = false;
    s.holding = false;
    s.midHold = false;
  }
  /** Everything in its final place at once. */
  function settle(name) {
    Object.assign(V, POSE[name]);
    s.aim = AIM[name] ?? s.aim;
    s.rayLens = RAY_LENS[name] ?? s.rayLens;
    s.frame = FRAME_OF[name];
    s.thinned = false;
    apply();
  }
  /** Numbers of V move to the goal together; its promise says whether the run is still alive. */
  function move(alive, goal, duration, e = ease.inOutSine) {
    const list = Object.keys(goal).filter((k) => Math.abs(V[k] - goal[k]) > 1e-6);
    if (!list.length) return Promise.resolve(alive());
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
        },
      })
      .finished.then(() => {
        if (!alive()) return false;
        for (const n of list) V[n] = goal[n];
        apply();
        return true;
      });
  }
  const pick = (goal, keys) => Object.fromEntries(keys.map((k) => [k, goal[k]]));

  /** One step of the story, and any jump between steps: what goes goes first, parts move, then the light comes. */
  async function run(name) {
    stopRun();
    const my = token;
    const alive = () => my === token;
    const goal = POSE[name];
    const first = START_OF[name] ?? {};
    s.busy = true;
    s.stage = name;
    s.thinned = false;
    clearLabels();
    draw();
    const wait = (d) => tweener.animate({ key: 'step', duration: d }).finished.then(alive);
    // 1. the light goes
    if (V.inK > 0 || V.beamK > 0) {
      if (!(await move(alive, { alpha: 0, lamp: 0, laserOn: 0 }, T.fade))) return false;
      Object.assign(V, { inK: 0, outK: 0, extK: 0, showF: 0, beamK: 0, origK: 0, alpha: 1 });
      apply();
    }
    // 2. marks that will not stay
    const down = {};
    for (const k of ['sphA', 'sphB', 'axis', 'showO']) if (goal[k] < V[k]) down[k] = goal[k];
    if (!(await move(alive, down, T.fade))) return false;
    s.aim = AIM[name] ?? s.aim;
    s.rayLens = RAY_LENS[name] ?? s.rayLens;
    if (V.plano > goal.plano && !(await move(alive, { plano: goal.plano }, T.morph))) return false;
    if (V.cut > goal.cut && !(await move(alive, { cut: goal.cut }, T.cut))) return false;
    // 3. parts that leave the rail are lifted off, together; the camera sets off for the step's frame
    const ups = ['convUp', 'concUp', 'boxUp', 'slabUp', 'laserUp'];
    const leave = {};
    for (const k of ups) if (goal[k] > V[k]) leave[k] = goal[k];
    fly(FRAME_OF[name], T.fly);
    if (!(await move(alive, leave, T.lift, ease.inOutCubic))) return false;
    // 4. what is off the rail is put where it will come down, in its starting shape
    const lifted = (k) => V[k] >= 0.999;
    if (lifted('convUp')) Object.assign(V, { convX: goal.convX, convW: first.convW ?? goal.convW });
    if (lifted('concUp')) Object.assign(V, { concX: goal.concX, concW: first.concW ?? goal.concW });
    if (lifted('slabUp')) V.slabT = first.slabT ?? goal.slabT;
    apply();
    // 5. parts on the rail slide to their places and take their starting shape
    const slide = {};
    if (!lifted('convUp')) Object.assign(slide, { convX: goal.convX, convW: first.convW ?? goal.convW });
    if (!lifted('concUp')) Object.assign(slide, { concX: goal.concX, concW: first.concW ?? goal.concW });
    if (!lifted('slabUp')) slide.slabT = first.slabT ?? goal.slabT;
    if (!(await move(alive, slide, T.slide, ease.inOutCubic))) return false;
    // 6. arrivals come down
    const arrive = {};
    for (const k of ups) if (goal[k] < V[k]) arrive[k] = goal[k];
    if (!(await move(alive, arrive, T.lift, ease.inOutCubic))) return false;
    if (camK < 1 && !(await wait(Math.max(0.05, (1 - camK) * T.fly)))) return false;
    // 7. the cut, a flat face, the spheres
    if (goal.cut > V.cut && !(await move(alive, { cut: goal.cut }, T.cut, ease.inOutCubic))) return false;
    if (goal.plano > V.plano && !(await move(alive, { plano: goal.plano }, T.morph))) return false;
    if (goal.sphA > V.sphA || goal.sphB > V.sphB) {
      if (!(await move(alive, pick(goal, ['sphA', 'sphB']), T.sphere, ease.inOutSine))) return false;
    }
    if (goal.axis > V.axis && !(await move(alive, { axis: goal.axis }, T.mark))) return false;
    // 8. the light: the lamp, the rays up to and through the glass, out of it, back to F
    if (goal.inK > 0) {
      if (!(await move(alive, { lamp: goal.lamp }, T.lamp))) return false;
      if (!(await move(alive, { inK: 1 }, T.rays, ease.linear))) return false;
      if (!(await move(alive, { outK: 1 }, T.rays, ease.linear))) return false;
      if (goal.extK > 0 && !(await move(alive, { extK: 1 }, T.ext, ease.linear))) return false;
      if (!(await move(alive, { showF: 1 }, T.mark))) return false;
    }
    // the laser's beam, then the original direction and the shift
    if (goal.beamK > 0) {
      if (!(await move(alive, { laserOn: 1 }, T.lamp))) return false;
      if (!(await move(alive, { beamK: 1 }, T.beam, ease.linear))) return false;
      if (!(await move(alive, { origK: 1, showO: goal.showO }, T.mark))) return false;
      // 9. thick, then thin: the shift shrinks
      const thin = pick(goal, ['slabT', 'convW', 'concW']);
      if (Object.keys(thin).some((k) => Math.abs(V[k] - thin[k]) > 1e-6)) {
        // the thick result, a moment: only the result line changes (the rule waits for the thin lens)
        s.midHold = true;
        draw();
        if (!(await wait(T.hold * 1.4))) return false;
        s.midHold = false;
        if (!(await move(alive, thin, T.thin, ease.inOutSine))) return false;
      }
    }
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

  // ── camera: flights go round the point they look at ─────────────────────────────────────────────────────
  const camFrom = { target: new THREE.Vector3(), az: 0, el: 0, d: 1 };
  let camK = 1;
  const camDir = new THREE.Vector3();
  const camOff = new THREE.Vector3();
  function poseNow() {
    const tall = stage.width / Math.max(1, stage.height) < 1.25;
    const f = FRAMES[s.frame](tall);
    dirFrom(f.az, f.el, camDir);
    return fitPose({ box: f.box, dir: camDir, camera, width: stage.width, height: stage.height, margin: f.margin ?? MARGINS });
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
  function guided() {
    s.userMovedCamera = false;
    rotate.home();
  }
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
    const same = s.frame === frame;
    s.frame = frame;
    if (same && camK >= 1) return Promise.resolve(true);
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
    if (animate) {
      s.frame = s.frame || 'pair';
      const f = s.frame;
      s.frame = '';
      fly(f, T.fly);
    } else camK = 1;
    stage.invalidate();
  }
  function takeOver() {
    if (s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    controls.maxDistance = Math.min(controls.maxDistance, 420);
    s.orbited = true;
    rotate.markUsed();
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
    pulse: Boolean(o.coach),
    zoom: [0.6, 1.6],
    when: () => s.mode !== 'quiz',
    onTurn: () => {
      controls.rotateSpeed = 1;
      takeOver();
    },
  });
  function orbitTo(az, el = 12) {
    applyCamera();
    takeOver();
    const d = camera.position.distanceTo(controls.target);
    dirFrom(az, el, camDir);
    camera.position.copy(controls.target).addScaledVector(camDir, d);
    controls.update();
    stage.invalidate();
  }
  const framed = { width: stage.width, height: stage.height };
  stage.onResize((width, height) => {
    if (width !== framed.width || height !== framed.height) {
      framed.width = width;
      framed.height = height;
      action?.refresh();
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

  // ── labels on the picture: few, short, each pinned to what it names, off the rays ──────────────────────
  let action = null;
  let handle = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      note,
      rotate.el,
      ui.$('.pvc-panel-toggle'),
      () => drawing.boxes(),
      () => action?.ringBox(),
      () => action?.box(),
      () => handle?.box(),
    ],
  });
  const shown = new Map();
  const pts = new Map();
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
  const sp = (list) => list.map(([dx, dy]) => ({ dx, dy }));
  const SPOTS = {
    up: sp([
      [0, -30],
      [-26, -32],
      [26, -32],
      [-44, -14],
      [44, -14],
    ]),
    upRight: sp([
      [30, -30],
      [46, -14],
      [0, -34],
      [50, 10],
    ]),
    tag: sp([
      [0, 0],
      [16, 0],
      [-16, 0],
      [0, 18],
      [0, -18],
    ]),
    upLeft: sp([
      [-30, -30],
      [-46, -14],
      [0, -34],
      [-50, 10],
    ]),
    down: sp([
      [0, 30],
      [24, 30],
      [-24, 30],
      [40, 14],
      [-40, 14],
    ]),
    focus: sp([
      [0, 34],
      [20, 36],
      [-20, 36],
      [0, 52],
      [-30, 52],
      [30, 52],
      [0, -34],
      [0, -52],
      [-40, 70],
      [0, 90],
      [0, -90],
      [0, 120],
    ]),
    centreMark: sp([
      [0, 26],
      [0, -26],
      [18, 26],
      [-18, 26],
    ]),
    axis: sp([
      [0, 22],
      [0, -22],
      [20, 24],
      [-10, 40],
      [10, -40],
    ]),
    ray: sp([
      [34, -18],
      [40, 0],
      [34, 18],
      [-34, 18],
      [0, 30],
    ]),
    orig: sp([
      [-36, 16],
      [-40, 0],
      [-30, 30],
      [30, 22],
    ]),
    plane: sp([
      [34, -10],
      [40, 8],
      [30, -28],
    ]),
    o: sp([
      [26, -26],
      [34, -10],
      [-30, 26],
      [26, 28],
    ]),
  };
  const big = (letter) => `<span class="lab-letter">${letter}</span>`;
  function labels() {
    const q = s.quiz;
    const calm = (!s.busy || s.holding || s.midHold) && camK >= 1;
    const st = s.stage;
    const named = !q || q.named;
    const onRail = (k) => V[k] < 0.01;
    const lensTop = AX + LENS.half + 1;
    // the two lenses, named while they stand side by side
    const pair = calm && !q && onRail('convUp') && onRail('concUp') && V.convX < -1;
    label('convex', pair && (st === 'intro' || st === 'kinds'), t(st === 'kinds' ? 'l_thick' : 'l_convex'), V.convX, lensTop, 0, INK.dark, [
      ...SPOTS.upLeft,
      ...SPOTS.up,
    ]);
    label('concave', pair && (st === 'intro' || st === 'kinds'), t(st === 'kinds' ? 'l_thin' : 'l_concave'), V.concX, lensTop, 0, INK.dark, [
      ...SPOTS.upRight,
      ...SPOTS.up,
    ]);
    // a flat face, on each lens
    const planeOn = pair && st === 'plano' && V.plano >= 0.99;
    label('plane1', planeOn, t('l_plane'), V.convX + rightFace(shapes.convex, 4.5), AX + 4.5, 0, INK.dark, SPOTS.plane);
    label('plane2', planeOn, t('l_plane'), V.concX + rightFace(shapes.concave, 4.5), AX + 4.5, 0, INK.dark, SPOTS.plane);
    // the ray box's light: the lens's name and F
    const lit = calm && V.outK >= 1 && V.alpha > 0.9;
    const rk = s.rayLens;
    label('lensName', lit && (named || !q), t(rk === 'convex' ? 'l_conv' : 'l_div'), 0, lensTop, 0, INK.dark, SPOTS.up);
    const fOn = lit && V.showF >= 1 && named && focus != null;
    label('f', fOn, `${t('l_f')} ${big(rk === 'convex' ? 'F′' : 'F')}`, focus ?? 0, AX, 0, INK.focus, SPOTS.focus);
    label('box', lit && !q && st === 'converge', t('l_box'), BOX_X - 4, AX + 8.4, 0, INK.dark, SPOTS.upLeft, true);
    // the spheres' centres and the axis
    const circ = calm && (V.sphA >= 1 || V.sphB >= 1);
    const ck = V.sphA >= 1 ? 'convex' : 'concave';
    const cx = V.sphA >= 1 ? V.convX : V.concX;
    const cc = bookCentres(shapes[ck]);
    label('c1', circ, big(t('l_c1')), cx + cc.c1, AX, 0, INK.dark, SPOTS.centreMark);
    label('c2', circ, big(t('l_c2')), cx + cc.c2, AX, 0, INK.dark, SPOTS.centreMark);
    label('axis', circ && V.axis >= 1 && !q, t('l_axis'), -30, AX, 0, INK.axis, SPOTS.axis, true);
    // the laser: the original direction, the ray out, the optical centre
    const beamOn = calm && V.beamK >= 1 && dv.beam && named;
    if (beamOn) {
      const b = dv.beam;
      label('orig', V.origK >= 1, t('l_orig'), b.origEnd.x, AX + b.origEnd.y, 0, INK.dark, SPOTS.orig);
      const mx = b.b.x + (b.end.x - b.b.x) * 0.55;
      const my = b.b.y + (b.end.y - b.b.y) * 0.55;
      label('dev', st === 'slab' && !q, t('l_dev'), mx, AX + my, 0, INK.laser, SPOTS.ray);
      label('o', V.showO >= 1 && s.aim !== 'slab', `${t('l_o')} ${big('O')}`, 0, AX, 0, INK.dark, SPOTS.o);
    } else {
      label('orig', false);
      label('dev', false);
      label('o', false);
    }
    // the test's letters at the ends of the paths
    for (let i = 0; i < 4; i++) {
      const c = q?.paths?.[i];
      label(`pt${i}`, calm && !!c && !q.named, c ? big(t(`tag_${i}`)) : '', c?.x ?? 0, AX + (c?.y ?? 0), 0, INK.dark, SPOTS.tag);
    }
    anno.update();
  }
  stage.onAfterRender(labels);

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function phase() {
    if (playing()) return 'busy';
    const i = STAGES.indexOf(s.stage);
    return STAGES[i + 1] ?? 'test';
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    const ph = phase();
    if (ph === 'busy' || camK < 1) return;
    if (ph === 'test') return quiz.start();
    return run(ph);
  }
  function pickWord(word) {
    if (s.locked) return lockedNudge();
    if (!(word in WORDS) || playing() || camK < 1) return;
    if (WORDS[word] === s.stage) return;
    audio.unlock();
    run(WORDS[word]);
  }

  // ── the thickness: the student drags the slab or the lens thicker and thinner ──────────────────────────
  const dragKey = () => (s.aim === 'slab' ? 'slabT' : s.aim === 'convex' ? 'convW' : 'concW');
  const canDrag = () =>
    s.mode === 'explore' && !s.locked && (!s.busy || s.holding) && V.beamK >= 1 && ['slab', 'centre', 'centre2'].includes(s.stage);
  const RANGE = { slabT: [SLAB.min, SLAB.max], convW: [0, THICK], concW: [0, THICK] };
  /** The handle's x for a thickness value: the right face, top. */
  const handleX = (key, v) => (key === 'slabT' ? v / 2 + 0.7 : 0.7 + v * 2.2);
  function setThick(value) {
    const key = dragKey();
    const [lo, hi] = RANGE[key];
    V[key] = round(clamp(value, lo, hi), 2);
    s.thinned = true;
    apply();
    draw();
  }
  const hp = new THREE.Vector3();
  const hFrom = new THREE.Vector3();
  const hTo = new THREE.Vector3();
  let dragStart = null;
  const HANDLE_Y = AX + LENS.half + 2.4;
  handle = createDragHandle(stage, {
    point: () => hp.set(handleX(dragKey(), V[dragKey()]), HANDLE_Y, 0),
    axis: 'x',
    track: {
      from: () => hFrom.set(handleX(dragKey(), RANGE[dragKey()][0]), HANDLE_Y, 0),
      to: () => hTo.set(handleX(dragKey(), RANGE[dragKey()][1]), HANDLE_Y, 0),
    },
    label: t('drag_me'),
    labelAt: 'right',
    aria: t('drag_aria'),
    pulse: Boolean(o.coach),
    when: canDrag,
    onStart: () => {
      if (!canDrag()) return;
      const key = dragKey();
      // pixels per unit of the value along the rail on the screen
      const a = drawing.screen(handleX(key, RANGE[key][0]), HANDLE_Y - AX);
      const ax = a.x;
      const ay = a.y;
      const b = drawing.screen(handleX(key, RANGE[key][1]), HANDLE_Y - AX);
      const px = Math.max(20, Math.hypot(b.x - ax, b.y - ay));
      dragStart = { v: V[key], per: (RANGE[key][1] - RANGE[key][0]) / px };
      s.dragging = true;
      emit('dragstart', {});
    },
    onMove: ({ along }) => {
      if (!dragStart || !canDrag()) return;
      setThick(dragStart.v + along * dragStart.per);
    },
    onEnd: () => {
      if (!dragStart) return;
      dragStart = null;
      s.dragging = false;
      emit('dragend', {});
      emitChange();
      draw();
    },
    onKey: (dir) => {
      if (!canDrag()) return;
      const key = dragKey();
      setThick(V[key] + dir * (key === 'slabT' ? 0.5 : 0.2));
      emitChange();
    },
  });

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '', lead: '', cap: '' };
  const replayBtn = ui.$('[data-act="replay"]');
  const homeBtn = ui.$('[data-act="home"]');
  const ACTIONS = {
    busy: ['act_wait', ''],
    kinds: ['act_kinds', 1],
    converge: ['act_converge', 2],
    diverge: ['act_diverge', 3],
    sphere: ['act_sphere', 4],
    sphere2: ['act_sphere2', 5],
    plano: ['act_plano', 6],
    slab: ['act_slab', 7],
    centre: ['act_centre', 8],
    centre2: ['act_centre2', 9],
    test: ['act_test', ''],
  };
  const cm1 = (x) => N(round(x, 1).toFixed(1));
  function outcomeNow() {
    const st = s.stage;
    if (st === 'intro') return '';
    if (st === 'kinds') {
      const a = shapes.convex;
      const b = shapes.concave;
      return t('out_kinds', { a: cm1(a.t), b: cm1(thicknessAt(a, a.h)), c: cm1(b.t), d: cm1(thicknessAt(b, b.h)) });
    }
    if (st === 'sphere' || st === 'sphere2') return t(`out_${st}`, { r: cm1(LENS.R) });
    if (st === 'slab') return t('out_slab', { d: cm1(beam?.shift ?? 0), T: cm1(V.slabT) });
    if (st === 'centre' || st === 'centre2') {
      const L = shapes[s.aim];
      return t('out_centre', { d: N(round((beam?.shift ?? 0) * 10, 1).toFixed(1)), t: cm1(L.t) });
    }
    return t(`out_${st}`);
  }
  function panel() {
    if (s.quiz) return;
    sheet.choose(s.stage === 'intro' ? null : WORD_OF[s.stage]);
    const calm = s.stage === 'intro';
    if (s.midHold) sheet.outcome(outcomeNow());
    if (!s.busy || s.holding) {
      sheet.outcome(outcomeNow());
      sheet.rule(calm ? '' : t(`rule_${s.stage}`));
      const ph = phase();
      const html = calm
        ? `<span class="lab-long">${t('intro')}</span><span class="lab-short">${t('intro_short')}</span>`
        : ph === 'busy'
          ? steady.lead
          : t(`lead_${ph}`);
      if (steady.lead !== html) {
        steady.lead = html;
        lead.innerHTML = html;
        lead.classList.toggle('pvc-note', calm);
        ui.learn.classList.toggle('lab-calm', calm);
      }
    }
    const capKey = WORD_OF[s.stage];
    if (steady.cap !== capKey) {
      steady.cap = capKey;
      caption.innerHTML = s.stage === 'intro' ? '' : t(`cap_${capKey}`);
    }
    const ph = phase();
    const nextWord = STAGES.includes(ph) ? WORD_OF[ph] : null;
    sheet.next(nextWord && nextWord !== WORD_OF[s.stage] ? nextWord : null);
    const [word, step] = ACTIONS[ph] ?? ACTIONS.test;
    const enabled = ph !== 'busy';
    replayBtn.hidden = s.stage === 'intro';
    replayBtn.disabled = !enabled;
    homeBtn.disabled = !enabled;
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      // an upright phone's pill has the whole width: the fuller words; beside the 3D, the short ones never wrap
      action.set({
        label: () => t(word !== 'act_wait' && root.clientWidth < 600 && root.clientWidth < root.clientHeight ? `${word}_long` : word),
        step,
        enabled,
      });
    }
  }
  function draw() {
    panel();
    stage.invalidate();
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  const aim = new THREE.Vector3();
  function target() {
    if (s.locked || s.busy || camK < 1 || s.dragging || s.userMovedCamera) return null;
    const ph = phase();
    if (ph === 'kinds' || ph === 'plano') aim.set(V.convX + 4, AX - 4, 0);
    else if (ph === 'converge' || ph === 'diverge') aim.set(BOX_X - 4.5, AX, 0);
    else if (ph === 'sphere') aim.set(V.convUp < 0.01 ? V.convX : 0, AX, 0);
    else if (ph === 'sphere2') aim.set(V.concUp < 0.01 ? V.concX : 0, AX, 0);
    else if (ph === 'slab' || ph === 'centre' || ph === 'centre2') aim.set(0, AX, 0);
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
    label: 'act_kinds',
    target: () => (o.coach ? target() : null),
    radius: 22,
    avoid: [ui.corner, ui.hint, note, rotate.el, () => anno.boxes(), () => handle.box(), () => drawing.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'drag', axis: 'x', text: t('howto_thick'), aria: t('aria_howto_thick'), handle, when: () => canDrag() },
    ],
    { stage },
  );

  // a tap on the part is the same action; a finger anywhere else turns the view (a tap is not a turn: 8 px first)
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      down = { x: e.clientX, y: e.clientY, at: performance.now() };
      controls.rotateSpeed = s.userMovedCamera ? 1 : 0;
    },
    { capture: true },
  );
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.at < 600;
    down = null;
    if (moved > 8 || !quick || !target()) return;
    const r = ui.canvasHost.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(setting.hit, false).length) act();
  });

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  const ORDER = ['kind', 'rays', 'centres', 'slab', 'centre'];
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  /** The scene of a question: a stage set at once, then changed. */
  function quizScene(q, name, change = {}, frame = FRAME_OF[name]) {
    stopRun();
    s.stage = name;
    settle(name);
    Object.assign(V, change);
    s.frame = frame;
    s.quiz = { ...q, named: false };
    clearLabels();
    apply();
  }
  const otherUp = (kind) => (kind === 'convex' ? { convX: 0, concUp: 1 } : { concX: 0, convUp: 1 });
  const Q = {
    kind() {
      const kind = Math.random() < 0.5 ? 'convex' : 'concave';
      const flat = Math.random() < 0.5 ? 1 : 0;
      quizScene({ kind: 'kind' }, 'kinds', { ...otherUp(kind), plano: flat }, 'single');
      const answer = kind === 'convex' ? 'convex_conv' : 'concave_div';
      const wrong = kind === 'convex' ? ['convex_div', 'concave_div', 'concave_conv'] : ['concave_conv', 'convex_conv', 'convex_div'];
      return {
        text: t('q_kind'),
        answer,
        wrong,
        label: (k) => t(`c_kind_${k}`),
        notes: notesOf([
          [wrong[0], t('n_kind_prop')],
          [wrong[1], t('n_kind_shape')],
          [wrong[2], t('n_kind_both')],
        ]),
        reveal: t(`a_kind_${kind}`) + (flat ? ` ${t('a_kind_plano')}` : ''),
      };
    },
    rays() {
      const kind = Math.random() < 0.5 ? 'convex' : 'concave';
      quizScene({ kind: 'rays' }, kind === 'convex' ? 'converge' : 'diverge', { outK: 0, extK: 0, showF: 0 });
      const answer = kind === 'convex' ? 'meet' : 'spread';
      const wrong = [kind === 'convex' ? 'spread' : 'meet', 'same', 'back'];
      return {
        text: t('q_rays'),
        answer,
        wrong,
        label: (k) => t(`c_rays_${k}`),
        notes: notesOf([
          [wrong[0], t('n_rays_other')],
          ['same', t('n_rays_same')],
          ['back', t('n_rays_back')],
        ]),
        reveal: t(`a_rays_${kind}`),
        after: { outK: 1, extK: kind === 'concave' ? 1 : 0, showF: 1 },
      };
    },
    centres() {
      const kind = Math.random() < 0.5 ? 'convex' : 'concave';
      quizScene({ kind: 'centres' }, kind === 'convex' ? 'sphere' : 'sphere2');
      const answer = kind === 'convex' ? 'c2' : 'c1';
      const near = kind === 'convex' ? 'c1' : 'c2';
      return {
        text: t('q_centres'),
        answer,
        wrong: [near, 'both', 'none'],
        label: (k) => t(`c_cen_${k}`),
        notes: notesOf([
          [near, t(`n_cen_${kind}`)],
          ['both', t('n_cen_both')],
          ['none', t('n_cen_none')],
        ]),
        reveal: t(`a_cen_${kind}`),
      };
    },
    slab() {
      const T0 = shuffle([2.5, 3, 3.5])[0];
      quizScene({ kind: 'slab' }, 'slab', { slabT: T0 });
      const a = slabRay(T0).shift;
      const b = slabRay(T0 * 2).shift;
      return {
        text: t('q_slab'),
        answer: 'double',
        wrong: ['half', 'same', 'none'],
        label: (k) => t(`c_slab_${k}`),
        notes: notesOf([
          ['half', t('n_slab_half')],
          ['same', t('n_slab_same')],
          ['none', t('n_slab_none')],
        ]),
        reveal: t('a_slab', { a: cm1(a), b: cm1(b) }),
        thick: { slabT: T0 * 2 },
      };
    },
    centre() {
      const kind = Math.random() < 0.5 ? 'convex' : 'concave';
      const name = kind === 'convex' ? 'centre' : 'centre2';
      quizScene({ kind: 'centre' }, name, { beamK: 2 / 3, origK: 0, showO: 1 }, 'paths');
      const b = beam;
      const rot = (d, deg) => {
        const a = THREE.MathUtils.degToRad(deg);
        return { x: d.x * Math.cos(a) - d.y * Math.sin(a), y: d.x * Math.sin(a) + d.y * Math.cos(a) };
      };
      const end = (p, d, L = 15) => ({ x: p.x + d.x * L, y: p.y + d.y * L });
      const shiftN = { x: b.dOut.y, y: -b.dOut.x }; // to the lower left of the ray: away, sideways
      const ways = {
        straight: end(b.b, b.dOut),
        down: end(b.b, rot(b.dOut, -30), 13),
        up: end(b.b, rot(b.dOut, 30), 14),
        shift: end({ x: b.b.x - shiftN.x * 4, y: b.b.y - shiftN.y * 4 }, b.dOut, 12),
      };
      const order = shuffle(['straight', 'down', 'up', 'shift']);
      const from = { straight: b.b, down: b.b, up: b.b, shift: { x: b.b.x - shiftN.x * 4, y: b.b.y - shiftN.y * 4 } };
      dv.candidates = { from: b.b, list: order.map((k) => ({ to: ways[k], from: from[k] })), k: 1 };
      // each letter a little beyond the end of its path, off the line
      s.quiz.paths = order.map((k) => {
        const f = from[k];
        const e = ways[k];
        const l = Math.hypot(e.x - f.x, e.y - f.y);
        return { x: e.x + ((e.x - f.x) / l) * 2.2, y: e.y + ((e.y - f.y) / l) * 2.2 };
      });
      const tag = (k) => t(`tag_${order.indexOf(k)}`);
      return {
        text: t('q_centre'),
        answer: 'straight',
        wrong: ['down', 'up', 'shift'],
        label: (k) => t('c_path', { x: tag(k) }),
        notes: notesOf([
          ['down', t('n_centre_bend')],
          ['up', t('n_centre_bend')],
          ['shift', t('n_centre_shift')],
        ]),
        reveal: t('a_centre', { x: tag('straight') }),
        after: { beamK: 1, origK: 1 },
        clearPaths: true,
      };
    },
  };
  const saved = { stage: 'intro' };
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
        const wasBusy = s.busy;
        stopRun();
        s.mode = 'quiz';
        s.locked = true;
        saved.stage = s.stage;
        if (wasBusy) settle(s.stage);
        clearLabels();
        syncUI();
        apply();
      },
      leave() {
        stopRun();
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        dv.candidates = null;
        s.stage = saved.stage;
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
        dv.candidates = null;
        const q = Q[ORDER[i]]();
        qCurrent = q;
        say(q.text);
        const f = s.frame;
        s.frame = '';
        const done = await fly(f, T.fly);
        if (!alive()) return null;
        if (!done) camK = 1;
        const list = shuffle([q.answer, ...q.wrong]);
        q.list = list;
        s.quiz.right = list.indexOf(q.answer);
        stage.invalidate();
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
          if (q.clearPaths) dv.candidates = null;
          const my = token;
          const alive = () => my === token;
          if (q.after) move(alive, q.after, T.rays, ease.linear);
          if (q.thick) move(alive, q.thick, T.thin);
          apply();
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
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
    note.hidden = !note.textContent || s.mode === 'quiz';
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
    return run('intro');
  }
  function replay() {
    if (s.locked) return lockedNudge();
    const i = STAGES.indexOf(s.stage);
    if (i < 1 || playing() || camK < 1) return;
    const name = s.stage;
    guided();
    s.view = 'front';
    syncUI();
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
    const what = b.dataset.act || b.dataset.example || '';
    const now = performance.now();
    if (what && what === lastTap.what && now - lastTap.at < 120) return;
    lastTap = { what, at: now };
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) pickWord(b.dataset.example);
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'home') home();
    if (a === 'replay') replay();
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: 1, ArrowDown: -1 }[e.key];
    if (step) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (!canDrag()) return;
      handle.markUsed();
      const key = dragKey();
      setThick(V[key] + step * (key === 'slabT' ? 0.5 : 0.2));
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
    const conv = shapes.convex;
    const conc = shapes.concave;
    return {
      stage: s.stage,
      next: phase(),
      busy: playing(),
      lenses: {
        convex: { centre: round(conv.t, 2), edge: round(thicknessAt(conv, conv.h), 2), onRail: V.convUp < 0.01, x: round(V.convX, 2) },
        concave: { centre: round(conc.t, 2), edge: round(thicknessAt(conc, conc.h), 2), onRail: V.concUp < 0.01, x: round(V.concX, 2) },
      },
      cut: V.cut >= 1,
      plano: V.plano >= 1,
      rays: dv.rays
        ? { lens: s.rayLens, crossings: rays.filter((r) => r.cross != null).map((r) => round(r.cross, 2)), focus: round(focus, 2) }
        : null,
      spheres: V.sphA >= 1 ? 'convex' : V.sphB >= 1 ? 'concave' : null,
      centres: V.sphA >= 1 || V.sphB >= 1 ? bookCentres(shapes[V.sphA >= 1 ? 'convex' : 'concave']) : null,
      laser: V.beamK > 0 && beam ? { on: s.aim, shift: round(beam.shift, 3), slab: round(V.slabT, 2), w: round(V[dragKey()], 2) } : null,
      frame: s.frame,
      az: round(THREE.MathUtils.radToDeg(Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z)), 1),
      orbited: s.orbited,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
      question: s.quiz ? { kind: s.quiz.kind, right: s.quiz.right ?? null } : null,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.stage, snap.busy, snap.mode, snap.laser?.shift]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }
  function jump(name) {
    stopRun();
    if (s.userMovedCamera) {
      guided();
      s.view = 'front';
      syncUI();
    }
    s.stage = name;
    clearLabels();
    settle(name);
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  jump(start);
  syncUI();
  setView(s.view, { animate: false });
  draw();
  // the parts of later steps are made now, hidden: compile their shaders while the student reads
  stage.warmUp?.({ show: setting.later });
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
    /** stage (one of STAGES), thick (the slab's thickness in cm, or the lens's w, in the laser steps), view, az/el; animate: false lands at once. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) setView(p.view, { animate });
      if (STAGES.includes(p.stage)) {
        if (animate) run(p.stage);
        else jump(p.stage);
      }
      if (p.thick != null && ['slab', 'centre', 'centre2'].includes(s.stage)) setThick(Number(p.thick));
      if (p.az != null) orbitTo(Number(p.az), p.el == null ? undefined : Number(p.el));
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      jump('intro');
      setView('front', { animate: false });
      camK = 1;
      s.orbited = false;
      rotate.rearm();
      handle.rearm();
      draw();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** For the figure's own tests: the boxes of the rays and circles drawn now (canvas pixels). */
    drawnBoxes: () => drawing.boxes().map((b) => ({ ...b })),
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
      ctx.drawImage(drawing.canvas, x, y, gl.width * k, gl.height * k);
      return c.toDataURL('image/png');
    },
    /** The bench with the two lenses in their rings (the slab, ray box and laser left out), in centimetres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'lens-types';
      for (const kind of ['convex', 'concave']) {
        const L = setting.lenses[kind];
        const copy = L.root.clone(true);
        copy.position.set(kind === 'convex' ? -SIDE : SIDE, RAIL.top, 0);
        copy.traverse((ob) => {
          if (ob.isMesh && ob.material?.visible === false) ob.userData.noExport = true;
        });
        g.add(copy);
      }
      return g;
    },
  };
}
