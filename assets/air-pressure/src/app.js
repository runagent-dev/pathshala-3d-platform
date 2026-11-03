// Air pressure (book page 142, topic 5.4), student view, in two parts.
//
// The tin box (চিত্র ৫.০৭): a thin tin box, a cube 10 cm on a side, stands on a plain table. One outlined red arrow
// presses on each open face from outside (the air's 10⁵ N/m², the same length everywhere); one blue arrow on the left
// face pushes back from inside just as hard. Each tap pumps one stroke: the inside pressure drops, the blue arrow
// shrinks, the red ones stay, and the box crumples in from every side while the camera leans in; the panel works out
// the force left over on one face, F = (P outside − P inside) × A. Then the book's contrast: "what if air pushed only
// from the top?" shows the wrong flattening (b) as a ghost, and "what really happens" replays the all-sided crush (c).
//
// Our body, one guided sequence with one big button: (1) on the Earth a student stands under a blue sky; nine pairs of
// arrows meet head to head round the body, red (the outside air) pressing in, blue (the inside of the body) pushing
// out, equally long: they cancel. (2) In space there is no air: the red arrows go, the blue ones grow a little and the
// body strains gently outward (a slight swell and a warm pulsing glow), with the book's sentence about bursting.
// (3) A pressure suit closes round the student from the feet up and the helmet comes down; the suit's purple arrows
// press in again, as long as the blue: balanced again. "আবার দেখো" starts over. Then a four-question test.
// Built on the shared student kit.
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
import { FACES, createCan } from './can.js';
import { createPeople, SUIT_TOP } from './person.js';
import { GROUND, PERSON_AT, bodySkyTexture, createWorld, skyTexture, spaceTexture } from './scene.js';
import {
  BODY_STEPS,
  FACE_CM2,
  PARTS,
  P_AIR,
  P_EXP,
  QUIZ_STROKES,
  SIDE_CM,
  STROKES,
  STROKE_PA,
  arrowLength,
  bodyPressures,
  crumpleFor,
  faceForce,
  fixBodyStep,
  fixStrokes,
  forceChoices,
  groupBD,
  groupIntl,
  insidePressure,
  pressureDifference,
  toM2,
} from './reading.js';

export const DEFAULTS = {
  part: 'can', // 'can' | 'body'
  strokes: 0, // pump strokes done (0 … 5)
  whatIf: false, // the box: show the wrong flattening from the top only
  space: '0', // the body: '0' on the Earth, '1' in space without a suit, 'suit' in space in the pressure suit
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { out: '#e03131', in: '#1971c2', suit: '#ae3ec9' };
const GAP = 0.0015; // the arrows' tips stop this far off the tin
const STROKE_S = 1.5; // s: one stroke of the pump
const SHAPE_S = 1.6; // s: the flattening (b), the replayed crush (c)
const TO_SPACE_S = 1.8; // s: the body goes to space
const SUIT_S = 2.4; // s: the suit closes round the body
const PULSE_S = 1.4; // s: one beat of the strain in space
const DOUBLE_TAP = 420; // ms
const NBSP = ' ';
const MARGIN = { top: 52, bottom: 10, side: 6 };
// the body's arrows: each pair meets head to head; the inside arrow starts this far off the outline
const B_LEN = 0.15; // m: one arrow of a pair (outside and inside alike)
const B_GAP = 0.012;
const B_GROW = 1.3; // in space the inside arrows grow by this much
const LIFT = 0.07; // m: in space the student floats this far up
// where the camera looks for each part (world boxes) and from where
const LOOKS = {
  can: { box: [new THREE.Vector3(-0.17, -0.004, -0.08), new THREE.Vector3(0.1, 0.19, 0.1)], dir: new THREE.Vector3(-0.5, 0.3, 1) },
  close: { box: [new THREE.Vector3(-0.09, -0.004, -0.09), new THREE.Vector3(0.09, 0.13, 0.09)], dir: new THREE.Vector3(-0.42, 0.3, 1) },
  body: {
    box: [
      new THREE.Vector3(PERSON_AT.x - 0.66, GROUND - 0.01, PERSON_AT.z - 0.12),
      new THREE.Vector3(PERSON_AT.x + 0.66, GROUND + 2.12, PERSON_AT.z + 0.12),
    ],
    dir: new THREE.Vector3(-0.1, 0.05, 1),
  },
};

/** A soft warm oval, bright in the middle and fading out (the glow round the straining body). */
function haloTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const r = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,150,90,0.9)');
  r.addColorStop(0.45, 'rgba(255,110,60,0.45)');
  r.addColorStop(1, 'rgba(255,90,40,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const G = (x) => N(t.lang === 'bn' ? groupBD(x) : groupIntl(x)); // Bangladeshi commas in Bangla (১,০০,০০০)
  const BASE = { p5: t.pow(10, P_EXP), one: 1, zero: 0 };
  const T = (key, vars = {}) => t(key, { ...BASE, ...vars });

  root.classList.add('pvc', 'ap');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side', // the panel beside the 3D on landscape frames (kit 1.5.0)
    learn: cleanSheet(t, {
      examples: { label: 'parts', results: false, items: PARTS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the readings: two pressures as a small list, each with a bar as long as the pressure, then one line under them
  const arrowIn =
    '<svg viewBox="0 0 24 12" aria-hidden="true"><path d="M2 6h13M11 1.5 17 6l-6 4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 1v10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const arrowOut =
    '<svg viewBox="0 0 24 12" aria-hidden="true"><path d="M4 1v10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8 6h13M17 1.5 23 6l-6 4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const read = document.createElement('div');
  read.className = 'ap-read';
  read.innerHTML = `
    <div class="ap-cells">
      <div class="ap-cell" data-cell="a"><span class="ap-ico" data-ico="a"></span><span class="ap-k" data-k="a"></span><b class="ap-v" data-v="a"></b><span class="ap-bar"><i data-bar="a"></i></span></div>
      <div class="ap-cell" data-cell="b"><span class="ap-ico" data-ico="b"></span><span class="ap-k" data-k="b"></span><b class="ap-v" data-v="b"></b><span class="ap-bar"><i data-bar="b"></i></span></div>
    </div>
    <div class="ap-sum" data-sum aria-live="polite"></div>`;
  $('.pvc-act-row').after(read);

  // a small note in the panel, under the rule: what is made simple, a picture that is imagined, or the book's warning
  const note = document.createElement('p');
  note.className = 'ap-note';
  ui.learn.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 90, environment: 'room', environmentIntensity: 0.55 });
  const { camera, controls, scene } = stage;
  stage.renderer.localClippingEnabled = true; // the suit closes round the body from the feet up
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI * 0.52;
  const sky = o.bg !== 'transparent' ? skyTexture() : null;
  let bodySky = null;
  let stars = null;
  scene.background = sky;
  if (sky) scene.fog = new THREE.Fog('#f7d9b2', 6, 60);
  function haze() {
    if (!(scene.fog instanceof THREE.Fog)) return;
    const d = camera.position.distanceTo(controls.target);
    scene.fog.near = d + 4;
    scene.fog.far = d + 40;
  }
  controls.addEventListener('change', haze);
  // a warm sun from the front right, a blue sky and a warm floor bouncing light
  const hemi = new THREE.HemisphereLight('#a9d0ff', '#c9784a', 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffd49a', 2.5);
  const SUN_DIR = new THREE.Vector3(1.5, 1.35, 1.25).normalize();
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe2ff', 0.55);
  fill.position.set(-3, 2, 4);
  scene.add(fill);
  const shadows = o.shadow && o.bg !== 'transparent';
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.01;
  }
  /** The sun's shadow box goes where the camera looks (small and sharp for the box, bigger for the student). */
  function aimSun(part) {
    const c = new THREE.Vector3();
    let size = 0.42;
    if (part === 'body') {
      c.copy(PERSON_AT).add({ x: 0, y: 0.85, z: 0 });
      size = 1.1;
    } else c.set(-0.06, 0.05, -0.03);
    sun.target.position.copy(c);
    sun.position.copy(c).addScaledVector(SUN_DIR, size * 5);
    Object.assign(sun.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: size * 1.5, far: size * 10 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.target.updateMatrixWorld();
  }

  const world = createWorld();
  scene.add(world.root);
  const can = createCan();
  scene.add(can.root);
  const people = createPeople();
  people.root.position.copy(PERSON_AT);
  scene.add(people.root);
  const glowColor = new THREE.Color('#ff7a45');
  for (const m of people.student.glowMats) m.emissive.copy(glowColor);
  // the strain in space: a soft warm glow behind the student (one quad, drawn only then)
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 2.1),
    new THREE.MeshBasicMaterial({
      map: haloTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      fog: false,
    }),
  );
  halo.name = 'StrainGlow';
  halo.userData.noExport = true;
  halo.position.set(0, 0.86, -0.2);
  halo.visible = false;
  people.root.add(halo);

  // the tin's arrows, few and outlined: one red arrow pressing in on each open face (the air outside, every side
  // alike), and on the face toward the camera one blue arrow beside it pushing out (the air inside)
  const openFaces = FACES.filter((f) => f.id !== 'ny');
  const outSpots = openFaces.map((face) => ({ face, u: face.id === 'nx' ? -0.55 : 0, v: 0, top: face.id === 'py' }));
  const inSpots = [{ face: FACES.find((f) => f.id === 'nx'), u: 0.55, v: 0 }];
  const outArrows = createArrowSet({ count: outSpots.length, color: COLORS.out, radius: 0.0048, name: 'OutsidePressure' });
  const inArrows = createArrowSet({
    count: inSpots.length,
    color: COLORS.in,
    outline: '#ffffff',
    radius: 0.0048,
    head: 0.014,
    headRadius: 0.011,
    name: 'InsidePressure',
  });
  // the body's arrows: nine pairs round the outline, head to head
  const NB = people.spots.body.length;
  const bodyArrow = { radius: 0.0125, head: 0.058, headRadius: 0.032, pad: 0.006 };
  const bodyOut = createArrowSet({ count: NB, color: COLORS.out, ...bodyArrow, name: 'BodyOutside' });
  const bodyIn = createArrowSet({ count: NB, color: COLORS.in, outline: '#ffffff', ...bodyArrow, name: 'BodyInside' });
  const suitIn = createArrowSet({ count: NB, color: COLORS.suit, outline: '#ffffff', ...bodyArrow, name: 'SuitPressure' });
  scene.add(outArrows.root, inArrows.root, bodyOut.root, bodyIn.root, suitIn.root);

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
    part: PARTS.includes(o.part) ? o.part : 'can',
    n: 0, // strokes done
    pIn: P_AIR, // the inside pressure as drawn (it moves during a stroke)
    c: 0, // how crumpled the box is drawn (0 … 1)
    f: 0, // how flat the ghost is drawn (0 … 1)
    ghost: false, // the box drawn as the ghost of (b)
    whatIf: false,
    busy: '', // '' | 'pump' | 'flat' | 'real' | 'space' | 'suit'
    step: 0, // the body: 0 on the Earth, 1 in space without a suit, 2 in the suit
    // the body as drawn (they move during a step): the outside / inside / suit arrows (0 … 1, the inside up to
    // B_GROW), the suit closed (0 … 1), the helmet down, the arrows moved from the body to the suit, the strain, the lift
    b: { red: 1, blue: 1, purple: 0, suit: 0, helmet: 0, m: 0, strain: 0, lift: 0 },
    pulse: 0, // s: the strain's beat
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    zoom: 0, // 0 … 1: how far the camera has leaned in to the box
    found: { pump: false, vacuum: false, whatIf: false, real: false, body: false, space: false, suit: false },
    show: { arrows: true, inside: true, values: true, topOnly: false, labels: true }, // the test hides some
    userMovedCamera: false,
    run: 0, // a token: every new stroke, flattening, step, part or reset bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the box and its arrows ──────────────────────────────────────────────────
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const negN = new THREE.Vector3();
  let weights = [0, 0, 0];
  function syncCan() {
    weights = can.setShape(s.c, s.f, { ghost: s.ghost });
    layoutArrows();
    stage.invalidate();
  }
  function layoutArrows() {
    const onCan = s.part === 'can' && s.show.arrows;
    outArrows.setVisible(onCan);
    inArrows.setVisible(onCan);
    const topOnly = s.ghost || s.show.topOnly;
    const L = arrowLength(P_AIR);
    outSpots.forEach((sp, i) => {
      if (!onCan || (topOnly && !sp.top)) return outArrows.hide(i);
      can.pointAt(sp.face, sp.u, sp.v, weights, tmpA).addScaledVector(sp.face.n, GAP);
      tmpB.copy(tmpA).addScaledVector(sp.face.n, L);
      negN.copy(sp.face.n).negate();
      outArrows.set(i, tmpB, negN, L);
    });
    const Li = arrowLength(s.pIn);
    inSpots.forEach((sp, i) => {
      if (!onCan || !s.show.inside || s.ghost || Li < 1e-4) return inArrows.hide(i);
      can.pointAt(sp.face, sp.u, sp.v, weights, tmpA).addScaledVector(sp.face.n, GAP);
      inArrows.set(i, tmpA, sp.face.n, Li);
    });
    layoutBody();
  }

  // ── the body and its arrows ─────────────────────────────────────────────────
  const bP = new THREE.Vector3();
  const bN = new THREE.Vector3();
  const bTip = new THREE.Vector3();
  const bFrom = new THREE.Vector3();
  const bNeg = new THREE.Vector3();
  /** Puts the student, the suit and the three sets of arrows where the drawn state `s.b` says. */
  function layoutBody() {
    const on = s.part === 'body';
    people.root.visible = on;
    const b = s.b;
    people.root.position.set(PERSON_AT.x, PERSON_AT.y + b.lift, PERSON_AT.z);
    // the suit: the clipping plane rises from the feet to the collar; the helmet comes down from above
    const suitOn = on && b.suit > 0;
    people.suit.body.visible = suitOn;
    people.clip.constant = PERSON_AT.y + b.lift - 0.02 + (SUIT_TOP + 0.06) * b.suit;
    people.suit.helmet.visible = on && b.helmet > 0;
    people.suit.helmet.position.y = (1 - ease.outCubic(b.helmet)) * 0.55;
    people.student.body.visible = !(b.suit >= 1 && b.helmet >= 1); // inside the suit, once it is closed
    applyStrain();
    const arrows = on && s.show.arrows;
    bodyOut.setVisible(arrows && b.red > 0.001);
    bodyIn.setVisible(arrows && s.show.inside);
    suitIn.setVisible(arrows && b.purple > 0.001);
    bodyOut.setOpacity(Math.min(1, b.red * 1.6));
    if (!arrows) return;
    const { body, suit } = people.spots;
    for (let i = 0; i < NB; i++) {
      bP.lerpVectors(body[i].p, suit[i].p, b.m).add(people.root.position);
      bN.lerpVectors(body[i].n, suit[i].n, b.m).normalize();
      const Lb = B_LEN * b.blue;
      bFrom.copy(bP).addScaledVector(bN, B_GAP);
      if (s.show.inside) bodyIn.set(i, bFrom, bN, Lb);
      bTip.copy(bFrom).addScaledVector(bN, s.show.inside ? Lb : 0); // with no inside arrows the outside ones touch the body
      bNeg.copy(bN).negate();
      if (b.red > 0.001) bodyOut.set(i, bFrom.copy(bTip).addScaledVector(bN, B_LEN * b.red), bNeg, B_LEN * b.red);
      if (b.purple > 0.001) suitIn.set(i, bFrom.copy(bTip).addScaledVector(bN, B_LEN * b.purple), bNeg, B_LEN * b.purple);
    }
  }
  /** The strain in space: the body swells a little and glows warm, with a slow beat (nothing more). */
  function applyStrain() {
    const k = s.b.strain;
    const beat = k > 0 ? k * (0.62 + 0.38 * Math.sin((s.pulse / PULSE_S) * Math.PI * 2)) : 0;
    const sw = 0.035 * beat;
    people.student.body.scale.set(1 + sw, 1 + sw * 0.25, 1 + sw);
    people.student.head.scale.set(1 + sw * 0.6, 1 + sw * 0.6, 1 + sw * 0.6);
    for (const m of people.student.glowMats) m.emissiveIntensity = 0.12 * beat;
    halo.visible = beat > 0;
    halo.material.opacity = 0.75 * beat;
  }
  stage.addTicker((dt) => {
    if (s.part !== 'body' || s.b.strain <= 0) return false;
    s.pulse = (s.pulse + dt) % PULSE_S;
    applyStrain();
    return true;
  });
  /** The drawn state of a resting step. */
  function restOf(step) {
    if (step === 1) return { red: 0, blue: B_GROW, purple: 0, suit: 0, helmet: 0, m: 0, strain: 1, lift: LIFT };
    if (step === 2) return { red: 0, blue: 1, purple: 1, suit: 1, helmet: 1, m: 1, strain: 0, lift: LIFT };
    return { red: 1, blue: 1, purple: 0, suit: 0, helmet: 0, m: 0, strain: 0, lift: 0 };
  }
  const part01 = (k, a, b) => Math.min(1, Math.max(0, (k - a) / (b - a)));
  /** Goes to a step of the body: at once (jump), or animated from the step before. */
  function bodyTo(step, { jump = false } = {}) {
    const token = ++s.run;
    tweener.cancel('body');
    const prev = s.step;
    s.step = step;
    if (s.mode === 'explore') {
      if (step >= 1) s.found.space = true;
      if (step === 2) s.found.suit = true;
    }
    syncSetting();
    const to = restOf(step);
    const from = { ...s.b };
    const animated = !jump && ((prev === 0 && step === 1) || (prev === 1 && step === 2));
    if (!animated) {
      Object.assign(s.b, to);
      s.busy = '';
      layoutBody();
      refresh();
      emitStep();
      return Promise.resolve(true);
    }
    s.busy = step === 1 ? 'space' : 'suit';
    if (step === 1) audio.pop();
    refresh();
    const lerp = (a, b, k) => a + (b - a) * k;
    return tweener
      .animate({
        key: 'body',
        duration: step === 1 ? TO_SPACE_S : SUIT_S,
        ease: ease.linear,
        onUpdate: (k) => {
          const b = s.b;
          if (step === 1) {
            // the air goes: the red arrows shrink away, the blue ones grow, the body starts to strain
            b.lift = lerp(from.lift, to.lift, ease.inOutSine(part01(k, 0, 0.6)));
            b.red = lerp(from.red, 0, ease.inOutCubic(part01(k, 0.08, 0.55)));
            b.blue = lerp(from.blue, B_GROW, ease.outBack(part01(k, 0.35, 0.85)));
            b.strain = ease.inOutSine(part01(k, 0.55, 1));
          } else {
            // the strain goes, the suit closes from the feet up, the helmet comes down, the purple arrows press in
            b.strain = lerp(from.strain, 0, part01(k, 0, 0.25));
            b.suit = ease.inOutSine(part01(k, 0.05, 0.6));
            b.helmet = part01(k, 0.5, 0.78);
            b.m = ease.inOutCubic(part01(k, 0.15, 0.6));
            b.blue = lerp(from.blue, 1, ease.inOutCubic(part01(k, 0.1, 0.6)));
            b.purple = ease.outBack(part01(k, 0.72, 1));
          }
          layoutBody();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.run) return false;
        Object.assign(s.b, to);
        s.busy = '';
        if (step === 2) audio.contact();
        layoutBody();
        refresh();
        emitStep();
        return true;
      });
  }
  function emitStep() {
    emit('space', { step: BODY_STEPS[s.step], space: s.step >= 1, suit: s.step === 2 });
    emitChange();
  }
  /** The setting: the yard under a muted sky for the box, a blue sky for the body on the Earth, space with the Earth. */
  function syncSetting() {
    const inSpace = s.part === 'body' && s.step >= 1;
    world.outdoors.visible = !inSpace;
    world.earth.visible = inSpace;
    can.root.visible = s.part === 'can';
    if (sky) {
      if (inSpace && !stars) stars = spaceTexture();
      if (s.part === 'body' && !bodySky) bodySky = bodySkyTexture();
      scene.background = inSpace ? stars : s.part === 'body' ? bodySky : sky;
      if (scene.fog instanceof THREE.Fog) scene.fog.color.set(inSpace ? '#0d1b4a' : '#f7d9b2');
    }
    hemi.intensity = inSpace ? 0.5 : 0.85;
    fill.intensity = inSpace ? 0.35 : 0.55;
    stage.invalidate();
  }

  /** One stroke of the pump: some air goes out, the box gives. */
  function pumpStroke({ jump = false } = {}) {
    if (s.n >= STROKES) return Promise.resolve(false);
    const token = ++s.run;
    tweener.cancel('shape');
    s.whatIf = false;
    s.ghost = false;
    s.f = 0;
    const from = { pIn: s.pIn, c: s.c };
    s.n += 1;
    const to = { pIn: insidePressure(s.n), c: crumpleFor(pressureDifference(s.n)) };
    if (s.mode === 'explore') s.found.pump = true;
    if (jump) {
      s.pIn = to.pIn;
      s.c = to.c;
      return Promise.resolve(arrivePump(token));
    }
    s.busy = 'pump';
    audio.tick();
    refresh();
    let crunched = false;
    const last = s.n === STROKES;
    return tweener
      .animate({
        key: 'shape',
        duration: STROKE_S,
        ease: ease.linear,
        onUpdate: (k) => {
          const kp = ease.inOutCubic(Math.min(1, Math.max(0, (k - 0.05) / 0.45)));
          s.pIn = from.pIn + (to.pIn - from.pIn) * kp;
          // the tin holds, then gives with a little spring (a buckle)
          const kc = Math.min(1, Math.max(0, (k - 0.32) / 0.5));
          s.c = from.c + (to.c - from.c) * ease.outBack(kc);
          if (!crunched && kc > 0.05) {
            crunched = true;
            audio.contact();
          }
          s.zoom = last
            ? 0.75 * (k < 0.5 ? Math.sin(Math.PI * k) : 1 - 0.4 * ease.inOutCubic((k - 0.5) / 0.5))
            : 0.45 * Math.sin(Math.PI * Math.min(1, k * 1.15));
          if (!s.userMovedCamera) jumpTo(viewPose());
          syncCan();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.run) return false;
        s.pIn = to.pIn;
        s.c = to.c;
        s.zoom = 0;
        return arrivePump(token);
      });
  }
  function arrivePump(token) {
    if (token !== s.run) return false;
    s.busy = '';
    if (s.n >= STROKES && s.mode === 'explore') s.found.vacuum = true;
    if (!s.userMovedCamera) jumpTo(viewPose());
    syncCan();
    refresh();
    emit('pump', { strokes: s.n, pIn: insidePressure(s.n) });
    emitChange();
    return true;
  }

  /** The book's (b): the box as a ghost, pressed only from the top, flattening. */
  function showWhatIf({ jump = false } = {}) {
    const token = ++s.run;
    tweener.cancel('shape');
    s.whatIf = true;
    s.ghost = true;
    if (s.mode === 'explore') s.found.whatIf = true;
    if (jump) {
      s.f = 1;
      s.busy = '';
      syncCan();
      refresh();
      emitChange();
      return Promise.resolve(true);
    }
    s.f = 0;
    s.busy = 'flat';
    refresh();
    return tweener
      .animate({
        key: 'shape',
        duration: SHAPE_S,
        ease: ease.linear,
        onUpdate: (k) => {
          s.f = ease.outBack(Math.min(1, Math.max(0, (k - 0.15) / 0.75)));
          s.zoom = k < 0.5 ? 0.75 * Math.sin(Math.PI * k) : 0.75 - 0.3 * ease.inOutCubic((k - 0.5) / 0.5);
          if (!s.userMovedCamera) jumpTo(viewPose());
          syncCan();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.run) return false;
        s.f = 1;
        s.busy = '';
        s.zoom = 0;
        syncCan();
        refresh();
        emit('whatif', { whatIf: true });
        emitChange();
        return true;
      });
  }
  /** Back to the real box: the crush from every side, replayed from new (the book's (c)). */
  function showReal({ jump = false } = {}) {
    const token = ++s.run;
    tweener.cancel('shape');
    s.whatIf = false;
    s.ghost = false;
    s.f = 0;
    const to = crumpleFor(pressureDifference(s.n));
    if (s.mode === 'explore' && s.found.whatIf) s.found.real = true;
    if (jump || to === 0) {
      s.c = to;
      s.busy = '';
      syncCan();
      refresh();
      emitChange();
      return Promise.resolve(true);
    }
    s.c = 0;
    s.busy = 'real';
    refresh();
    let crunched = false;
    return tweener
      .animate({
        key: 'shape',
        duration: SHAPE_S,
        ease: ease.linear,
        onUpdate: (k) => {
          const kc = Math.min(1, Math.max(0, (k - 0.12) / 0.7));
          s.c = to * ease.outBack(kc);
          if (!crunched && kc > 0.05) {
            crunched = true;
            audio.contact();
          }
          s.zoom = k < 0.5 ? 0.75 * Math.sin(Math.PI * k) : 0.75 - 0.3 * ease.inOutCubic((k - 0.5) / 0.5);
          if (!s.userMovedCamera) jumpTo(viewPose());
          syncCan();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.run) return false;
        s.c = to;
        s.busy = '';
        s.zoom = 0;
        syncCan();
        refresh();
        emit('whatif', { whatIf: false });
        emitChange();
        return true;
      });
  }
  /** A new box: full of air, not dented. */
  function newCan() {
    s.run++;
    tweener.cancel('shape');
    s.n = 0;
    s.pIn = P_AIR;
    s.c = 0;
    s.f = 0;
    s.ghost = false;
    s.whatIf = false;
    s.busy = '';
    s.zoom = 0;
    syncCan();
    refresh();
    emitChange();
  }
  /** Jump the box to a state (the test, set, the start). */
  function canTo(n, { whatIf = false } = {}) {
    s.run++;
    tweener.cancel('shape');
    s.n = fixStrokes(n);
    s.pIn = insidePressure(s.n);
    s.c = crumpleFor(pressureDifference(s.n));
    s.whatIf = whatIf;
    s.ghost = whatIf;
    s.f = whatIf ? 1 : 0;
    s.busy = '';
    s.zoom = 0;
    syncCan();
  }
  /** Ends whatever was moving where it was going (a part change, the test, set). */
  function settle() {
    s.run++;
    tweener.cancel('shape');
    tweener.cancel('body');
    if (s.busy === 'pump' || s.busy === 'real') {
      s.pIn = insidePressure(s.n);
      s.c = crumpleFor(pressureDifference(s.n));
    }
    if (s.busy === 'flat') s.f = 1;
    if (s.busy === 'space' || s.busy === 'suit') Object.assign(s.b, restOf(s.step));
    s.busy = '';
    s.zoom = 0;
  }

  // ── the parts: the box, the body ────────────────────────────────────────────
  function syncParts() {
    syncSetting();
    aimSun(s.part);
    layoutArrows();
    stage.invalidate();
  }
  function setPart(part, { animate = true } = {}) {
    if (!PARTS.includes(part)) return Promise.resolve(false);
    settle();
    s.part = part;
    if (s.mode === 'explore' && part === 'body') s.found.body = true;
    s.userMovedCamera = false;
    syncCan();
    syncParts();
    refresh();
    emit('part', { part });
    emitChange();
    return flyTo(viewPose(), animate ? 1.3 : 0);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  function plan() {
    if (s.part === 'body') {
      if (s.busy === 'space') return { label: 'act_suit', step: 2 };
      if (s.busy === 'suit') return { label: 'act_again', step: '' };
      if (s.step === 0) return { label: 'act_space', step: 1 };
      if (s.step === 1) return { label: 'act_suit', step: 2 };
      return { label: 'act_again', step: '' };
    }
    if (s.busy === 'flat' || (s.whatIf && !s.busy)) return { label: 'act_real', step: s.found.real ? '' : 3 };
    if (s.n < STROKES || s.busy === 'pump') return { label: s.n === 0 ? 'act_pump' : 'act_pump_more', step: s.found.vacuum ? '' : 1 };
    if (!s.found.real) return { label: 'act_whatif', step: 2 };
    return { label: 'act_new', step: '' };
  }

  function outcomeHtml() {
    if (s.part === 'body') {
      if (s.busy === 'space') return T('out_going');
      if (s.busy === 'suit') return T('out_suiting');
      return T(['out_earth', 'out_space', 'out_suit'][s.step], { zero: G(0) });
    }
    if (s.busy === 'pump') return T('out_pumping');
    if (s.whatIf) return T('out_whatif');
    if (s.found.real && s.n >= STROKES && s.busy !== 'flat') return T('out_real');
    const F = faceForce(pressureDifference(s.n));
    if (s.n === 0) return T('out_can_start');
    if (s.n >= STROKES) return T('out_vacuum', { F: G(F) });
    return T('out_can', { n: N(s.n), F: G(F) });
  }

  function ruleHtml() {
    if (s.part === 'body') return T(['rule_earth', 'rule_space', 'rule_suit'][s.step]);
    if (s.whatIf || s.busy === 'flat') return T('rule_whatif');
    if (s.found.real && s.n >= STROKES) return T('rule_real');
    if (s.n >= STROKES) return T('rule_vacuum');
    if (s.n > 0 || s.busy === 'pump') return T('rule_pump');
    return T('rule_can_start');
  }

  function readout() {
    if (s.part === 'body') {
      const p = bodyPressures(s.step);
      const bySuit = p.by === 'suit';
      return {
        a: {
          k: T(bySuit ? 'cell_suit' : 'cell_out'),
          v: T('val_Pa', { v: G(p.out) }),
          cls: bySuit ? 'k-suit' : 'k-out',
          ico: arrowIn,
          bar: p.out / P_AIR,
        },
        b: { k: T('cell_body_in'), v: T('val_Pa', { v: G(p.inside) }), cls: 'k-in', ico: arrowOut, bar: p.inside / P_AIR },
        sum: '',
        sumCls: '',
      };
    }
    const pIn = insidePressure(s.n);
    const a = { k: T('cell_out'), v: T('val_Pa', { v: G(P_AIR) }), cls: 'k-out', ico: arrowIn, bar: 1 };
    const b = { k: T('cell_in'), v: T('val_Pa', { v: G(pIn) }), cls: 'k-in', ico: arrowOut, bar: pIn / P_AIR };
    const dP = pressureDifference(s.n);
    const narrow = read.clientWidth < 420;
    return {
      a,
      b,
      sum: T(narrow ? 'sum_can_short' : 'sum_can', { dP: G(dP), A: N(toM2(FACE_CM2)), F: G(faceForce(dP)) }),
      sumCls: '',
    };
  }

  let lastRead = '';
  let lastNote = '';
  function refresh() {
    sheet.choose(s.part);
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    root.dataset.part = s.part;
    root.dataset.step = s.part === 'body' ? BODY_STEPS[s.step] : '';
    const r = readout();
    const key = JSON.stringify(r);
    if (key !== lastRead) {
      lastRead = key;
      for (const id of ['a', 'b']) {
        const cell = /** @type {HTMLElement} */ (read.querySelector(`[data-cell="${id}"]`));
        cell.className = `ap-cell ${r[id].cls}`;
        /** @type {HTMLElement} */ (read.querySelector(`[data-k="${id}"]`)).textContent = r[id].k;
        /** @type {HTMLElement} */ (read.querySelector(`[data-v="${id}"]`)).innerHTML = r[id].v;
        /** @type {HTMLElement} */ (read.querySelector(`[data-ico="${id}"]`)).innerHTML = r[id].ico;
        /** @type {HTMLElement} */ (read.querySelector(`[data-bar="${id}"]`)).style.width = `${Math.round(r[id].bar * 100)}%`;
      }
      const sum = /** @type {HTMLElement} */ (read.querySelector('[data-sum]'));
      sum.innerHTML = r.sum;
      sum.className = `ap-sum ${r.sumCls}`;
    }
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label });
      if (s.busy) action.hide('busy');
      else action.show('busy');
    }
    // the note under the rule
    let n = '';
    let warn = false;
    if (s.part === 'can') {
      if (s.whatIf || s.busy === 'flat') {
        n = T('note_whatif');
        warn = true;
      } else if (s.n > 0 || s.busy) n = T('note_steps', { v: G(STROKE_PA) });
    } else if (s.step === 1 && s.busy !== 'suit') {
      n = T('note_burst');
      warn = true;
    } else if (s.step === 2 && !s.busy) n = T('note_suit');
    const nk = `${n}|${warn}`;
    if (nk !== lastNote) {
      lastNote = nk;
      note.innerHTML = n ? `${warn ? ICONS.close : ''}<span>${n}</span>` : '';
      note.classList.toggle('warn', warn);
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const P0 = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  /** Each shown arrow as three small boxes along it (one box round a slanting arrow would cover far too much). */
  function setBoxes(set, list, pad = 5) {
    if (!set.root.visible) return;
    for (let i = 0; i < set.count; i++) {
      if (!set.shown[i]) continue;
      toScreen(set.tails[i], P0);
      toScreen(set.tips[i], P1);
      for (let k = 0; k < 3; k++) {
        const x0 = P0.x + ((P1.x - P0.x) * k) / 3;
        const y0 = P0.y + ((P1.y - P0.y) * k) / 3;
        const x1 = P0.x + ((P1.x - P0.x) * (k + 1)) / 3;
        const y1 = P0.y + ((P1.y - P0.y) * (k + 1)) / 3;
        list.push({ left: Math.min(x0, x1) - pad, top: Math.min(y0, y1) - pad, right: Math.max(x0, x1) + pad, bottom: Math.max(y0, y1) + pad });
      }
    }
  }
  function arrowBoxes() {
    const list = [];
    if (s.part === 'can') {
      setBoxes(outArrows, list);
      setBoxes(inArrows, list);
    } else {
      setBoxes(bodyOut, list);
      setBoxes(bodyIn, list);
      setBoxes(suitIn, list);
    }
    return list;
  }
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const bbox = new THREE.Box3();
  function screenBox(b3) {
    if (b3.isEmpty()) return null;
    let i = 0;
    for (const x of [b3.min.x, b3.max.x])
      for (const y of [b3.min.y, b3.max.y]) for (const z of [b3.min.z, b3.max.z]) corners[i++].set(x, y, z).project(camera);
    const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
    const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }
  /** The thing the labels keep off: the box (or the ghost); the student's head and body (or the suit). */
  function subjectBoxes() {
    const out = [];
    if (s.part === 'can') {
      // the new box's corners (the crushed box is inside them; the ghost is lower and wider)
      const k = s.ghost ? 1.2 : 1;
      bbox.min.set(-can.H * k, 0, -can.H * k);
      bbox.max.set(can.H * k, can.H * (s.ghost ? 0.75 : 2), can.H * k);
      out.push(screenBox(bbox));
    } else {
      const y = people.root.position.y;
      const wide = s.b.suit > 0.5 ? 0.3 : 0.22;
      // the torso and legs, then the head (the arms are thin: a label may sit beside them)
      bbox.min.set(PERSON_AT.x - wide, y, PERSON_AT.z - 0.1);
      bbox.max.set(PERSON_AT.x + wide, y + 1.36, PERSON_AT.z + 0.1);
      out.push(screenBox(bbox));
      const r = s.b.helmet > 0.5 ? 0.2 : 0.13;
      bbox.min.set(PERSON_AT.x - r, y + people.headY - r, PERSON_AT.z);
      bbox.max.set(PERSON_AT.x + r, y + people.headY + r, PERSON_AT.z);
      out.push(screenBox(bbox));
    }
    return out.filter(Boolean);
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const ABOVE = [spot(0, -22), spot(24, -22), spot(-24, -22), spot(0, -40), spot(40, -34), spot(-40, -34), spot(0, -58)];
  const RIGHT = [spot(18, 0), spot(18, -18), spot(18, 18), spot(34, -32), spot(34, 32), spot(50, 0), spot(50, -48), spot(50, 48)];
  const LEFT = [spot(-18, 0), spot(-18, -18), spot(-18, 18), spot(-34, -32), spot(-34, 32), spot(-50, 0), spot(-50, -48), spot(-50, 48)];
  const BELOW = [spot(0, 22), spot(24, 22), spot(-24, 22), spot(0, 40), spot(36, 46), spot(-36, 46), spot(0, 60)];
  // farther off, with a leader line: over the table below the box, or the yard above it
  const FAR_DOWN = [spot(0, 84), spot(50, 80), spot(-50, 80), spot(0, 110), spot(70, 104), spot(-70, 104)];
  const FAR_UP = [spot(0, -84), spot(50, -80), spot(-50, -80), spot(0, -110), spot(70, -104)];
  const pts = {};
  const pt = (id) => (pts[id] ||= new THREE.Vector3());
  const labelState = new Map();
  const want = new Map();
  /** The outside arrow labelled: the top row's middle on the face toward the camera's right (the +z face). */
  const outIdx = outSpots.findIndex((sp) => sp.face.id === 'nx');
  const topIdx = outSpots.findIndex((sp) => sp.face.id === 'py');
  const inIdx = 0;
  // the body's labelled arrows: the outside (or suit) one at the right arm, the inside one at the left arm
  const B_RIGHT_ARM = 4;
  const B_LEFT_ARM = 3;
  function syncLabels() {
    want.clear();
    const compact = stage.height < 260 || stage.width < 340;
    const own = [subjectBoxes];
    const quiz = s.mode === 'quiz';
    if (s.show.labels && s.part === 'can' && s.show.arrows && !s.busy) {
      if (s.ghost || s.show.topOnly) {
        want.set('top', {
          text: T('lbl_top_only'),
          point: () => pt('top').copy(outArrows.tails[topIdx]),
          spots: [...ABOVE, ...RIGHT, ...LEFT],
          color: COLORS.out,
          own,
        });
        if (s.ghost)
          want.set('ghost', {
            text: T('lbl_ghost'),
            point: () => can.pointAt(FACES[4], 0.6, -0.4, [0, 0, s.f], pt('ghost')),
            spots: [...RIGHT, ...BELOW],
            color: '#1f5fae',
            own,
            optional: true,
          });
      } else {
        const values = s.show.values && (!compact || quiz);
        want.set('out', {
          text: values ? T('lbl_out_v', { v: G(P_AIR) }) : T('lbl_out'),
          point: () => pt('out').copy(outArrows.tails[outIdx]),
          spots: [...RIGHT, ...ABOVE, ...FAR_UP, ...FAR_DOWN],
          color: COLORS.out,
          own,
          optional: !quiz,
        });
        if (s.show.inside && inArrows.shown[inIdx])
          want.set('in', {
            text: values ? T('lbl_in_v', { v: G(insidePressure(s.n)) }) : T('lbl_in'),
            point: () => pt('in').copy(inArrows.tails[inIdx]).lerp(inArrows.tips[inIdx], 0.5),
            spots: [...BELOW, ...FAR_DOWN, ...RIGHT, ...LEFT],
            color: COLORS.in,
            own,
            optional: !quiz,
          });
      }
    }
    if (s.show.labels && s.part === 'body' && s.show.arrows && !s.busy) {
      const SIDE_R = [spot(10, -34), spot(0, -40), spot(24, -36), spot(10, 34), spot(0, 40), ...RIGHT];
      const SIDE_L = [spot(-10, -34), spot(0, -40), spot(-24, -36), spot(-10, 34), spot(0, 40), ...LEFT];
      if (s.step === 0)
        want.set('bout', {
          text: T('lbl_air'),
          point: () => pt('bout').copy(bodyOut.tails[B_RIGHT_ARM]).lerp(bodyOut.tips[B_RIGHT_ARM], 0.5),
          spots: SIDE_R,
          color: COLORS.out,
          own,
        });
      if (s.step === 2)
        want.set('bsuit', {
          text: T('lbl_suit'),
          point: () => pt('bsuit').copy(suitIn.tails[B_RIGHT_ARM]).lerp(suitIn.tips[B_RIGHT_ARM], 0.5),
          spots: SIDE_R,
          color: COLORS.suit,
          own,
        });
      if (s.show.inside)
        want.set('bin', {
          text: T(s.step === 2 ? 'lbl_in' : 'lbl_body_in'),
          point: () => pt('bin').copy(bodyIn.tails[B_LEFT_ARM]).lerp(bodyIn.tips[B_LEFT_ARM], 0.5),
          spots: SIDE_L,
          color: COLORS.in,
          own,
        });
    }
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.spots.map((p) => `${p.dx},${p.dy}`).join(';')}|${w.optional}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, avoid: w.own, optional: w.optional });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots, optional: w.optional });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  const poseA = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  function poseOf(look) {
    const L = LOOKS[look];
    box.min.copy(L.box[0]);
    box.max.copy(L.box[1]);
    return fitPose({ box, dir: L.dir.clone().normalize(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  /** How close the camera is to the box: leaning in during a stroke, and staying a little closer once it is crushed. */
  const lean = () => Math.max(s.zoom, s.part === 'can' && !s.busy && (s.n >= STROKES || s.whatIf) ? 0.8 : 0);
  function viewPose() {
    const p = poseOf(s.part);
    const z = lean();
    if (s.part !== 'can' || z <= 0) return p;
    const c = poseOf('close');
    poseA.position.lerpVectors(p.position, c.position, z);
    poseA.target.lerpVectors(p.target, c.target, z);
    return { position: poseA.position.clone(), target: poseA.target.clone() };
  }
  function jumpTo({ position, target: aim }) {
    if (tweener.busy && flying) return; // a flight between parts goes on
    camera.position.copy(position);
    controls.target.copy(aim);
    controls.update();
    haze();
  }
  let flying = false;
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      flying = false;
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      haze();
      stage.invalidate();
      return Promise.resolve(true);
    }
    flying = true;
    // between parts the camera rises a little on the way, so it never passes through the table
    const lift = p0.distanceTo(position) > 1 ? Math.min(1.5, p0.distanceTo(position) * 0.18) : 0;
    return tweener
      .animate({
        key: 'camera',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          camera.position.lerpVectors(p0, position, k);
          camera.position.y += Math.sin(Math.PI * k) * lift;
          controls.target.lerpVectors(t0, aim, k);
          controls.update();
          haze();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        flying = false;
        if (done) refresh();
        return done;
      });
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    flying = false;
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    lastRead = '';
    refresh();
  });

  // ── the action: the big button, the ring round the box (the body has only the button) ──
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.part === 'body') {
      if (s.busy) return showHint(T('hint_watch'), { duration: 1800 });
      return bodyTo((s.step + 1) % BODY_STEPS.length);
    }
    if (s.busy === 'pump' || s.busy === 'real') return showHint(T('hint_wait'), { duration: 1800 });
    if (s.busy === 'flat' || s.whatIf) return showReal();
    if (s.n < STROKES) return pumpStroke();
    if (!s.found.real) return showWhatIf();
    return newCan();
  }
  const targetBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_pump',
    target: () => {
      if (s.part === 'body') return null; // the whole student is the subject: no ring over the arrows
      return targetBox.setFromObject(s.ghost ? can.ghost.children[0] : can.mesh);
    },
    pad: 6,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitCan = [can.mesh];
  const hitBody = [...people.student.body.children, ...people.student.head.children, ...people.suit.body.children];
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const list = s.part === 'can' ? hitCan : hitBody;
    return raycaster.intersectObjects(list, false).some((h) => h.object.visible);
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
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    });
  });

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
    const dP = pressureDifference(s.n);
    const p = plan();
    const bp = bodyPressures(s.step);
    return {
      part: s.part,
      strokes: s.n,
      pOut: P_AIR, // Pa
      pIn: insidePressure(s.n), // Pa
      dP, // Pa
      area: toM2(FACE_CM2), // m² of one face
      F: faceForce(dP), // N on one face
      crumple: crumpleFor(dP),
      whatIf: s.whatIf,
      step: BODY_STEPS[s.step], // the body: 'earth' | 'space' | 'suit'
      space: s.step >= 1,
      suit: s.step === 2,
      bodyOut: bp.out, // Pa pressing on the body from outside (the air, the suit, or nothing)
      bodyIn: bp.inside, // Pa pushing out from inside the body
      busy: s.busy,
      found: { ...s.found },
      next: p.label.replace('act_', ''),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.part, snap.strokes, snap.whatIf, snap.step, snap.found, snap.mode, snap.view]);
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
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ap-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  /** A question's scene: this part and state, these arrows and labels; nothing moving. */
  async function scene_(part, { n = 0, whatIf = false, show = {}, step = 0 } = {}) {
    settle();
    s.show = { arrows: true, inside: true, values: true, topOnly: false, labels: true, ...show };
    s.part = part;
    canTo(n, { whatIf });
    s.step = step;
    Object.assign(s.b, restOf(step));
    s.userMovedCamera = false;
    syncParts();
    refresh();
    return flyTo(viewPose(), 0.6);
  }
  function revealAll() {
    s.show = { ...s.show, arrows: true, inside: true, values: true, labels: true };
    layoutArrows();
    refresh();
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const nText = (v) => `${G(v)}${NBSP}N`;
  const KINDS = ['force', 'all', 'body', 'space'];

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 3, feedback: 3 },
    action,
    hooks: {
      enter() {
        settle();
        learnSaved = { part: s.part, n: s.n, whatIf: s.whatIf, step: s.step, found: { ...s.found } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        const saved = learnSaved;
        s.show = { arrows: true, inside: true, values: true, topOnly: false, labels: true };
        s.found = { ...(saved?.found || s.found) };
        s.part = saved?.part ?? 'can';
        canTo(saved?.n ?? 0, { whatIf: saved?.whatIf ?? false });
        s.step = saved?.step ?? 0;
        Object.assign(s.b, restOf(s.step));
        syncUI();
        syncParts();
        refresh();
        emitChange();
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        if (kind === 'force') {
          const n = pickOne(QUIZ_STROKES);
          await scene_('can', { n });
          if (!alive()) return null;
          question = { kind, n };
          return { text: T('q_force', { s: N(SIDE_CM) }), ...choicesOf(forceChoices(n), kind, (x) => nText(x.v)) };
        }
        if (kind === 'all') {
          await scene_('can', { n: STROKES, show: { arrows: false } });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_nodir', 'c_pump', 'c_weight', 'c_piles'].map((key) => ({ key }));
          return { text: T('q_all'), ...choicesOf(items, kind, (x) => T(x.key)) };
        }
        if (kind === 'body') {
          await scene_('body', { show: { inside: false } });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_inside', 'c_noweight', 'c_toponly', 'c_tiny'].map((key) => ({ key }));
          return { text: T('q_body'), ...choicesOf(items, kind, (x) => T(x.key)) };
        }
        await scene_('body', { step: 1, show: { labels: false } });
        if (!alive()) return null;
        question = { kind: 'space' };
        const items = ['c_cancel', 'c_morepush', 'c_stopair', 'c_float'].map((key) => ({ key }));
        return { text: T('q_space'), ...choicesOf(items, 'space', (x) => T(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const A = toM2(FACE_CM2);
        const note_ = (map) => (wrongKey && map[wrongKey] ? ` ${T(map[wrongKey], { c: N(FACE_CM2), A: N(A), P: G(P_AIR) })}` : '');
        revealAll();
        if (k === 'force') {
          const n = question.n;
          const dP = pressureDifference(n);
          return (
            T('why_force', { F: G(faceForce(dP)), Po: G(P_AIR), Pi: G(insidePressure(n)), dP: G(dP), c: N(FACE_CM2), A: N(A) }) +
            note_({ outside: 'mis_outside', inside: 'mis_inside', cm2: 'mis_cm2' })
          );
        }
        if (k === 'all') return T('why_all') + note_({ c_pump: 'mis_pump', c_weight: 'mis_weight', c_piles: 'mis_piles' });
        if (k === 'body') return T('why_body') + note_({ c_noweight: 'mis_noweight', c_toponly: 'mis_toponly', c_tiny: 'mis_tiny' });
        return T('why_space') + note_({ c_morepush: 'mis_morepush', c_stopair: 'mis_stopair', c_float: 'mis_float' });
      },
      done() {
        s.locked = false;
        refresh();
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
  function goHome() {
    s.found = { pump: false, vacuum: false, whatIf: false, real: false, body: false, space: false, suit: false };
    settle();
    s.step = 0;
    Object.assign(s.b, restOf(0));
    newCan();
    setPart('can');
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else if (b.dataset.example !== s.part) setPart(b.dataset.example);
    }
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
        else goHome();
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
    const sceneKey = ['1', '2', 'r', 'R', 'Home', 'ArrowUp', 'ArrowRight', '+'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2'].includes(k)) setPart(PARTS[Number(k) - 1]);
    else if ((k === 'ArrowUp' || k === 'ArrowRight' || k === '+') && s.part === 'can' && s.n < STROKES && !s.busy && !s.whatIf) pumpStroke();
    else if ((k === 'ArrowRight' || k === '+') && s.part === 'body') doAction();
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  controls.enableRotate = s.view === '3d';
  {
    const n = fixStrokes(o.strokes);
    const whatIf = Boolean(o.whatIf) && n >= STROKES;
    canTo(n, { whatIf });
    if (n > 0) s.found.pump = true;
    if (n >= STROKES) s.found.vacuum = true;
    if (whatIf) s.found.whatIf = true;
    s.step = s.part === 'body' ? fixBodyStep(o.space) : 0;
    Object.assign(s.b, restOf(s.step));
    s.found.body = s.part === 'body';
    s.found.space = s.step >= 1;
    s.found.suit = s.step === 2;
  }
  syncParts();
  flyTo(viewPose(), 0);
  syncCan();
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
     * Change any of: part ('can' | 'body'), strokes (0 … 5: the box jumps there, or with animate it pumps the strokes
     * still to do one by one), whatIf (the box: the wrong flattening from the top only, after 5 strokes), space (the
     * body: false / 'earth' on the Earth, true / 'space' in space without a suit, 'suit' in the pressure suit; with
     * animate the next step plays), view ('front' | '3d'), found.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.found) Object.assign(s.found, p.found);
      if (p.part && p.part !== s.part) await setPart(p.part, { animate });
      if (p.strokes != null) {
        const n = fixStrokes(p.strokes);
        if (animate && n > s.n && !s.whatIf) {
          while (s.n < n) if (!(await pumpStroke())) break;
        } else {
          canTo(n);
          if (n > 0) s.found.pump = true;
          if (n >= STROKES) s.found.vacuum = true;
          refresh();
        }
      }
      if (p.whatIf != null && s.part === 'can') {
        if (p.whatIf && s.n < STROKES) canTo(STROKES);
        if (p.whatIf) await showWhatIf({ jump: !animate });
        else if (s.whatIf) await showReal({ jump: !animate });
      }
      if (p.space != null && s.part === 'body') {
        const step = fixBodyStep(p.space === 'earth' ? 0 : p.space);
        if (step !== s.step || s.busy) {
          settle();
          await bodyTo(step, { jump: !animate || step !== s.step + 1 });
        }
      }
      if (!s.userMovedCamera) flyTo(viewPose(), 0);
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.show = { arrows: true, inside: true, values: true, topOnly: false, labels: true };
      goHome();
      await setView('front', { animate: false });
      flyTo(viewPose(), 0);
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The tin box as it is now (crumpled or not), in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'AirPressure';
      g.add(can.bake());
      return g;
    },
  };
}
