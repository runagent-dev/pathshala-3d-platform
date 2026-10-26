// Electromagnetic force (book page 68, topic 3.2.2), student view on the kit's clean sheet: one action, one result,
// one rule. Two examples in a row of words:
//  - চিরুনি (the book's own experiment), all in one table-top view: the student's head at the edge, the comb in the
//    hair, the bits of paper on the table under the face. "১ চিরুনি দিয়ে চুল আঁচড়াও": a few strokes, and the charge
//    builds on the comb ("−" discs; loose hairs stand up). "২ চিরুনি কাগজের কাছে আনো": it comes down over the bits,
//    they jump up and cling, and it lifts them into the air. One bit carries two arrows: the pull of the whole Earth
//    (down, মাধ্যাকর্ষণ বল) and the comb's pull (up, তড়িৎ চৌম্বক বল), which grows as the comb comes closer and wins.
//  - চুম্বক: a cell, a switch and a coil of wire in a row, and a bar magnet on a little cart. "১ সুইচ চালু করো": the
//    current runs and the coil becomes a magnet that pulls the cart in (unlike poles); "২ চুম্বকটি ঘুরিয়ে দাও": like
//    poles, it is pushed away; turned back, it is pulled in again from the far end (the range is infinite).
// The result line says what happened (the two pulls compared, or the poles and the force), the rule line explains it
// in the book's words and grows into the book's rule; a quiet strip names the four fundamental forces in order. Then
// a five-question test. Physics in physics.js, models in comb-scene.js and magnet-scene.js, framing in camera.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createMaterials } from '@shared/student/materials.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { createArrow } from './arrow.js';
import { fitPose } from './camera.js';
import { ARC, COMB_SIZE, FEATURED, HEAD, createCombScene, hairSlope, hairTop } from './comb-scene.js';
import { createI18n } from './i18n.js';
import { ARROW, COIL, createMagnetScene, magnetX } from './magnet-scene.js';
import {
  COMB,
  LIFT_HEIGHT,
  MAG,
  STRENGTH_EXP,
  facingPole,
  interaction,
  magnetArrowLength,
  pullRatio,
  reach,
  settleCart,
  stepCart,
  stopHeight,
  teethDistance,
} from './physics.js';

export const DEFAULTS = {
  scene: 'comb', // 'comb' | 'magnet'
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  charge: 0, // the comb's charge at the start (0–5 strokes)
  place: 'hair', // where the comb is at the start: 'hair' | 'paper'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per thing: the four forces as in the other three figures of 3.2 (তড়িৎ চৌম্বক blue, মহাকর্ষ purple),
// the magnet's poles as painted (N red, S grey: not blue, which is the force's colour); style.css has the same
const COLORS = { em: '#1c7ed6', grav: '#7048e8', north: '#e03131', south: '#5c6670' };
const W_ARROW = 26; // mm of arrow for a bit of paper's weight (the Earth's pull)
const MAX_RATIO = 2; // the comb's arrow is drawn at most this many times the weight's
// where the comb's middle may be over the paper: its last teeth stay over the bit with the arrows, so that bit is the
// first to jump (it hangs at the comb's end, its arrows clear of the comb)
const PAPER_X = { min: 11, start: 15, max: 19 };
const PAPER_H = { min: 9, start: 62, max: 80 }; // height of its teeth above the table (mm)
const REST_X = (ARC.from + ARC.to) / 2; // the comb's middle at rest in the hair
const START_GAP = 40; // mm between the coil and the magnet at the start
const DOUBLE_TAP = 400; // ms in which a second tap on the action is ignored
const TAP_MOVE = 7; // px a finger may move and still tap
const deg = THREE.MathUtils.degToRad;
// how far above the front the camera looks from (front view): the comb's from higher up, so the bits on the table show
// as bits, not slivers, and the head is seen from above a little (its hair, where the comb goes)
const ELEVATION = { comb: 42, magnet: 24 };
const COIL_X = (COIL.x0 + COIL.x1) / 2;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** A power of ten in the language's digits: 10<sup>36</sup>. */
  const pow = (n) => `${N(10)}<sup>${N(String(n).replace('-', '−'))}</sup>`;

  root.classList.add('pvc', 'ef');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  // the four fundamental forces, weakest first, this one marked (colour, weight and an underline): quiet words
  const forces = ['grav', 'weak', 'em', 'strong']
    .map((k) => `<span class="ef-f ${k}${k === 'em' ? ' on' : ''}"${k === 'em' ? ' aria-current="true"' : ''}>${t(`f_${k}`)}</span>`)
    .join(' <i aria-hidden="true">·</i> ');
  const ui = buildStudentShell(root, t, {
    learn: `${cleanSheet(t, {
      examples: {
        label: 'scenes',
        items: [
          { id: 'comb', label: 'scene_comb' },
          { id: 'magnet', label: 'scene_magnet' },
        ],
      },
      lines: { action: 1, outcome: 1, rule: 3 },
    })}
          <p class="ef-forces" role="group" aria-label="${t('forces')}"><span class="ef-forces-k">${t('forces')}</span> <span class="ef-forces-list">${forces}</span></p>`,
  });
  const sheet = bindCleanSheet(ui.learn);
  const outcomeEl = ui.$('.pvc-outcome');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  // a long lens (narrow field of view): the head, nearer the camera than the table, is not drawn much bigger than it is
  const stage = createStage(ui.canvasHost, { fov: 20, near: 5, far: 12000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 120;
  controls.maxDistance = 4000;
  controls.maxPolarAngle = Math.PI * 0.49; // never under the table
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableZoom = false; // the front view frames itself (zoom only when turning the view)
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const M = createMaterials(stage.renderer);
  const cs = createCombScene({ materials: M, colors: COLORS });
  const ms = createMagnetScene({ materials: M, colors: COLORS });
  scene.add(cs.root, ms.root);
  const upArrow = createArrow({ color: COLORS.em, name: 'CombPull', radius: 1.7, head: 8, headRadius: 4.6 });
  const downArrow = createArrow({ color: COLORS.grav, name: 'EarthPull', radius: 1.7, head: 8, headRadius: 4.6 });
  const magArrow = createArrow({ color: COLORS.em, name: 'ForceOnMagnet', radius: 1.4, head: 7, headRadius: 4 });
  const coilArrow = createArrow({ color: COLORS.em, name: 'ForceOnCoil', radius: 1.4, head: 7, headRadius: 4 });
  cs.root.add(upArrow.root, downArrow.root);
  ms.root.add(magArrow.root, coilArrow.root);
  // honest about the coil: in the magnet example, a small note in the corner says its pull is drawn stronger
  const note = document.createElement('div');
  note.className = 'ef-note';
  note.textContent = t('note_coil');
  ui.stage.append(note);

  const shadows = o.shadow && o.bg !== 'transparent';
  let sun = null;
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun = new THREE.DirectionalLight(0xffffff, 0.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 8;
    scene.add(sun, sun.target);
    for (const part of [cs.comb, ...cs.bits.map((b) => b.group), ms.coil, ms.cart, ...Object.values(ms.meshes)])
      part.traverse((m) => {
        if (m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false && !m.userData.noExport)
          m.castShadow = true;
      });
  }
  /** The sun's shadow covers the part of the table in the picture. */
  function aimSun() {
    if (!sun) return;
    const c = s.scene === 'comb' ? new THREE.Vector3(-20, 0, 0) : new THREE.Vector3(-30, 0, 0);
    sun.position.copy(c).add(new THREE.Vector3(60, 420, 260));
    sun.target.position.copy(c);
    Object.assign(sun.shadow.camera, { left: -200, right: 200, top: 200, bottom: -200, near: 200, far: 900 });
    sun.shadow.camera.updateProjectionMatrix();
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const now = () => performance.now();
  const s = {
    scene: o.scene === 'magnet' ? 'magnet' : 'comb',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    showArrows: true,
    busy: false, // a run of the action is playing (combing, bringing the comb, starting again): the button waits
    // the comb: in the hair (x of its middle along the top of the head), flying, or over the paper (cx, h)
    comb: { place: 'hair', dest: 'hair', charge: 0, rubbed: 0, hx: REST_X, cx: PAPER_X.start, h: PAPER_H.start },
    // each bit of paper: on the table, jumping up, stuck on the comb, or falling back
    bits: cs.bits.map(() => ({ phase: 'desk', t0: 0, dur: 0, lx: 0, from: new THREE.Vector3(), fromQ: new THREE.Quaternion() })),
    // the magnets: the switch, which way the bar magnet lies ('SN': its S end faces the coil), the gap (mm), speed
    mag: { on: false, orient: 'SN', gap: START_GAP, v: 0, hold: false, flipping: false, dragging: false, everOn: false, fromFar: false, flips: 0 },
    // what the student has seen: the comb beat the Earth; like poles pushed apart (then the rule grows into the book's)
    seen: { comb: false, magnet: false },
  };
  let run = 0; // every new action bumps it: an older animation that wakes up after an await stops there
  let lastAct = -1e9;

  // ── the comb ────────────────────────────────────────────────────────────────
  const comb = cs.comb;
  /** The comb's pose with its middle at x along the top of the hair, teeth a little into it. */
  function hairPose(x) {
    const a = Math.atan(hairSlope(x));
    return { x: x + Math.sin(a) * ARC.inset, y: hairTop(x) - Math.cos(a) * ARC.inset, rot: a };
  }
  const paperPose = () => ({ x: s.comb.cx, y: s.comb.h, rot: 0 });
  function placeComb({ x, y, rot }) {
    comb.position.set(x, y, 0);
    comb.rotation.set(0, 0, rot);
    comb.updateMatrixWorld(true);
    if (s.comb.charge) frizz();
  }
  const e0 = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  /** Distance from a point to the comb's row of teeth tips, wherever the comb is. */
  function teethDist(p) {
    if (Math.abs(comb.rotation.z) < 1e-6) return teethDistance(p, { cx: comb.position.x, h: comb.position.y, half: COMB_SIZE.half });
    e0.set(-COMB_SIZE.half, 0, 0).applyMatrix4(comb.matrixWorld);
    e1.set(COMB_SIZE.half, 0, 0).applyMatrix4(comb.matrixWorld);
    const ab = e1.sub(e0);
    const k = Math.min(1, Math.max(0, tmp.copy(p).sub(e0).dot(ab) / ab.lengthSq()));
    return e0.addScaledVector(ab, k).distanceTo(p);
  }
  const teethMid = new THREE.Vector3();
  /** The charged hair's loose strands stand up, leaning towards the comb when it is near. */
  function frizz() {
    cs.setFrizz(s.comb.charge / COMB.levels, s.comb.charge ? comb.localToWorld(teethMid.set(0, 8, 0)) : null);
  }
  function setCharge(q) {
    s.comb.charge = Math.min(Math.max(Math.round(q), 0), COMB.levels);
    cs.setCharge(s.comb.charge);
    frizz();
  }
  /** One more level of charge (a pass through the hair): the discs, a tick, the panel. */
  function gainCharge() {
    if (s.comb.charge >= COMB.levels) return;
    setCharge(s.comb.charge + 1);
    audio.tick();
    emit('charge', { charge: s.comb.charge });
    refresh();
    emitChange();
  }
  /** The comb moved along the hair to x; by hand (`charge`), combing leaves charge on it: a level a pass. */
  function rubTo(x, { charge = true } = {}) {
    const c = s.comb;
    const nx = Math.min(Math.max(x, ARC.from), ARC.to);
    if (charge && c.charge < COMB.levels) {
      c.rubbed += Math.abs(nx - c.hx);
      while (c.rubbed >= COMB.strokeMm - 0.5 && c.charge < COMB.levels) {
        c.rubbed = Math.max(0, c.rubbed - COMB.strokeMm);
        gainCharge();
      }
    }
    c.hx = nx;
    placeComb(hairPose(nx));
    stage.invalidate();
  }

  const clingPos = new THREE.Vector3();
  const clingQ = new THREE.Quaternion();
  const tiltQ = new THREE.Quaternion();
  const Z = new THREE.Vector3(0, 0, 1);
  /** Where a bit sticks on the comb now (world), from its place on the comb's own axes. */
  function clingPose(i) {
    const b = cs.bits[i];
    clingPos.set(s.bits[i].lx, b.cling.y, b.cling.z).applyMatrix4(comb.matrixWorld);
    tiltQ.setFromAxisAngle(Z, b.cling.tilt);
    clingQ.copy(comb.quaternion).multiply(tiltQ);
  }
  function startJump(i, d) {
    const st = s.bits[i];
    const b = cs.bits[i];
    st.phase = 'jump';
    st.t0 = now();
    st.dur = (0.14 + d * 0.004) * 1000;
    st.from.copy(b.group.position);
    st.fromQ.copy(b.group.quaternion);
    const local = comb.worldToLocal(b.home.position.clone());
    st.lx = b.cling.x ?? Math.min(Math.max(local.x, -56), 56);
  }
  /** The comb lets the bits go (they fall back where they were), or, instantly, puts them back. */
  function dropBits({ instant = false } = {}) {
    s.bits.forEach((st, i) => {
      const b = cs.bits[i];
      if (instant || st.phase === 'desk') {
        st.phase = 'desk';
        b.group.position.copy(b.home.position);
        b.group.quaternion.copy(b.home.quaternion);
        return;
      }
      st.phase = 'fall';
      st.t0 = now();
      st.dur = 420;
      st.from.copy(b.group.position);
      st.fromQ.copy(b.group.quaternion);
    });
  }
  /** Bits within the comb's reach jump at once (for set() without animation). */
  function settleBits() {
    s.bits.forEach((st, i) => {
      if (st.phase !== 'desk') return;
      const d = teethDist(cs.bits[i].home.position);
      if (s.comb.charge > 0 && d <= reach(s.comb.charge)) {
        startJump(i, d);
        st.phase = 'cling';
      }
    });
  }
  const lifted = () => s.bits.filter((b) => b.phase === 'cling' || b.phase === 'jump').length;
  /** The comb's pull on the bit with the arrows ÷ its weight (Infinity once it clings; 0 with no charge). */
  function featuredRatio() {
    const st = s.bits[FEATURED];
    if (s.comb.charge <= 0) return 0;
    if (st.phase === 'cling' || st.phase === 'jump') return Infinity;
    return pullRatio(s.comb.charge, teethDist(cs.bits[FEATURED].group.position));
  }
  /** Is the comb (or is it going) over the paper? */
  const atPaper = () => (s.comb.place === 'travel' ? s.comb.dest : s.comb.place) === 'paper';

  const UPV = new THREE.Vector3(0, 1, 0);
  const DOWNV = new THREE.Vector3(0, -1, 0);
  let lastLifted = 0;
  let lastWins = false;
  /** Bits jump, stick and fall; the arrows follow the bit with the arrows. Returns true while something moves. */
  function tickComb() {
    const tnow = now();
    let busy = false;
    const q = s.comb.charge;
    const r = reach(q);
    s.bits.forEach((st, i) => {
      const b = cs.bits[i];
      if (st.phase === 'desk') {
        if (q > 0 && s.comb.place !== 'hair') {
          const d = teethDist(b.home.position);
          if (d <= r) startJump(i, d);
        }
        if (st.phase === 'desk') return;
      }
      if (st.phase === 'jump' || st.phase === 'cling') {
        clingPose(i);
        if (st.phase === 'jump') {
          const k = Math.min(1, (tnow - st.t0) / st.dur);
          b.group.position.lerpVectors(st.from, clingPos, k * k);
          b.group.quaternion.slerpQuaternions(st.fromQ, clingQ, Math.min(1, k * 1.4));
          if (k >= 1) st.phase = 'cling';
          busy = true;
        } else {
          b.group.position.copy(clingPos);
          b.group.quaternion.copy(clingQ);
        }
        return;
      }
      if (st.phase === 'fall') {
        const k = Math.min(1, (tnow - st.t0) / st.dur);
        b.group.position.lerpVectors(st.from, b.home.position, k * k);
        b.group.quaternion.slerpQuaternions(st.fromQ, b.home.quaternion, k);
        if (k >= 1) st.phase = 'desk';
        busy = true;
      }
    });
    const n = lifted();
    if (n !== lastLifted) {
      if (n > lastLifted && s.mode !== 'quiz') audio.pop?.();
      if (n > lastLifted) emit('lift', { lifted: n });
      const named = !n !== !lastLifted; // the bits' name goes once they are lifted, and comes back with them
      lastLifted = n;
      if (named) refreshLabels();
      refresh();
      emitChange();
    }
    const ratio = featuredRatio();
    const wins = ratio >= 1;
    if (wins !== lastWins) {
      lastWins = wins;
      if (wins && s.mode !== 'quiz') s.seen.comb = true;
      refresh();
      emitChange();
    }
    // the two arrows on the bit with the arrows, while the comb is over the paper (or on its way)
    const p = cs.bits[FEATURED].group.position;
    const show = s.showArrows && s.scene === 'comb' && s.comb.place !== 'hair';
    const up = Math.min(ratio, MAX_RATIO);
    const movedUp = upArrow.set(p, UPV, show && up >= 0.05 ? W_ARROW * up : 0);
    const movedDown = downArrow.set(p, DOWNV, show ? W_ARROW : 0);
    if (movedUp || movedDown) {
      stage.invalidate(); // drawing is on demand: an arrow that changed needs a new frame
      syncArrowLabels();
    }
    return busy;
  }

  // ── the magnets ─────────────────────────────────────────────────────────────
  const mag = s.mag;
  const currentForce = () => (mag.flipping ? null : interaction(mag.on, facingPole(mag.orient)));
  const FAR = MAG.gapMax - 12; // mm: a pull that starts from this far shows the infinite range
  /** Remember whether this pull starts from far away (the rule then speaks of the range). */
  const noteStart = () => {
    mag.fromFar = currentForce() === 'attract' && mag.gap >= FAR;
  };
  function placeCart() {
    ms.cart.position.x = magnetX(mag.gap);
  }
  const PX = new THREE.Vector3(1, 0, 0);
  const NX = new THREE.Vector3(-1, 0, 0);
  const magFrom = new THREE.Vector3();
  const coilFrom = new THREE.Vector3();
  let currentShown = false;
  function tickMagnet(dt) {
    let moving = false;
    const kind = currentForce();
    if (!mag.hold && !mag.dragging) {
      const st = stepCart({ gap: mag.gap, v: mag.v }, kind, dt);
      moving = st.v !== 0 || Math.abs(st.gap - mag.gap) > 1e-6;
      if (moving) {
        mag.gap = st.gap;
        mag.v = st.v;
        placeCart();
        if (st.hit === 'coil') {
          if (s.mode !== 'quiz' || quiz.revealed) audio.contact?.();
          emit('snap', { gap: 0 });
        }
        if (st.hit === 'stop') audio.tick();
        if (!mag.v) {
          refresh();
          emitChange();
        }
      }
    }
    // the two forces, at the facing ends just above them: a pull points from each body towards the other (the
    // arrows' tips meet at the gap), a push points away from the gap; they shrink with distance but never vanish
    const show = s.showArrows && s.scene === 'magnet' && Boolean(kind);
    const len = show ? magnetArrowLength(mag.gap) : 0;
    const magEnd = COIL.x1 + mag.gap;
    let movedMag;
    let movedCoil;
    if (kind === 'attract') {
      movedMag = magArrow.set(magFrom.set(magEnd + len, ARROW.y, ARROW.z), NX, len);
      movedCoil = coilArrow.set(coilFrom.set(COIL.x1 - len, ARROW.y, ARROW.z), PX, len);
    } else {
      movedMag = magArrow.set(magFrom.set(magEnd, ARROW.y, ARROW.z), PX, len);
      movedCoil = coilArrow.set(coilFrom.set(COIL.x1, ARROW.y, ARROW.z), NX, len);
    }
    if (movedMag || movedCoil) {
      stage.invalidate();
      syncForceLabel(kind);
    }
    // the current runs along the wires while the switch is closed (only then is there anything to draw each frame)
    const flowing = s.scene === 'magnet' && mag.on;
    const stopped = currentShown && !flowing; // the chevrons just went: one more frame without them
    if (flowing || stopped) ms.setCurrent(flowing, now() / 1000);
    currentShown = flowing;
    return moving || mag.flipping || flowing || stopped;
  }
  stage.addTicker((dt) => (s.scene === 'comb' ? tickComb() : tickMagnet(dt)));

  function setSwitch(on, { animate = true } = {}) {
    on = Boolean(on);
    if (on === mag.on) return;
    mag.on = on;
    if (on) mag.everOn = true;
    noteStart();
    ms.setCoilOn(on);
    tweener.animate({
      key: 'switch',
      duration: animate ? 0.22 : 0,
      onUpdate: (k) => {
        ms.setBlade(on ? k : 1 - k);
        stage.invalidate();
      },
    });
    if (animate && s.mode !== 'quiz') audio.lock?.(!on);
    emit('switch', { on });
    refresh();
    refreshLabels();
    emitChange();
  }
  /** Turn the bar magnet round (it lifts a little, turns, and settles back on its cart). */
  function flip({ animate = true } = {}) {
    if (mag.flipping) return;
    const r0 = mag.orient === 'SN' ? 0 : Math.PI;
    const next = mag.orient === 'SN' ? 'NS' : 'SN';
    const done = () => {
      mag.orient = next;
      mag.flipping = false;
      ms.magnet.rotation.y = next === 'SN' ? 0 : Math.PI;
      ms.magnet.position.y = 19.5;
      if (s.mode !== 'quiz') mag.flips += 1;
      noteStart();
      emit('flip', { facing: facingPole(next) });
      refresh();
      refreshLabels();
      emitChange();
    };
    if (!animate) return done();
    mag.flipping = true;
    mag.v = 0;
    refresh();
    tweener.animate({
      key: 'flip',
      duration: 0.5,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        ms.magnet.rotation.y = r0 + Math.PI * k;
        ms.magnet.position.y = 19.5 + Math.sin(Math.PI * k) * 14;
        stage.invalidate();
      },
      onComplete: done,
    });
  }
  /** The cart put at a gap; it then moves as the force says (or, without animation, to where it would stop). */
  function placeMagnet(gap, { animate = true } = {}) {
    mag.gap = Math.min(Math.max(Number(gap) || 0, 0), MAG.gapMax);
    mag.v = 0;
    noteStart();
    if (!animate && !mag.hold) mag.gap = settleCart(mag.gap, currentForce()).gap;
    placeCart();
    refresh();
    emitChange();
  }

  // ── the panel: the action, the result line, the rule line ──────────────────
  const pole = (p) => `<span class="ef-pole ${p === 'N' ? 'n' : 's'}">${p}</span>`;
  const combRing = new THREE.Box3();
  const ringC = new THREE.Vector3();
  const ringH = new THREE.Vector3();
  /** The box the ring goes round on the comb: its middle part (the comb is tilted in the hair, and the box of a
   * tilted comb would make a ring far bigger than the comb). */
  function combRingBox() {
    combRing.setFromObject(cs.combMesh);
    combRing.getCenter(ringC);
    combRing.getSize(ringH).multiplyScalar(0.5 * (Math.abs(comb.rotation.z) > 0.1 ? 0.7 : 1));
    return combRing.set(ringC.clone().sub(ringH), ringC.clone().add(ringH));
  }
  const TARGETS = {
    comb: combRingBox,
    paper: () => cs.paperBox,
    switch: () => ms.meshes.sw,
    magnet: () => ms.magnet,
    none: () => null,
  };
  // the big button in the panel and its numbered badge on the part to touch (made before the labels, so in every frame
  // the ring is placed first and the labels keep off it)
  /** @type {ReturnType<typeof createAction>} */
  const action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_comb',
    target: TARGETS.comb,
    pad: 8,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: o.coach,
    onAct: doAction,
  });
  /** What the action does now: its id, the student's step number ('' once both steps are done), words, target. */
  function plan() {
    if (s.scene === 'comb') {
      const c = s.comb;
      if (atPaper()) return { id: 'again', step: '', label: 'act_again_comb', target: 'none' }; // no ring over the result
      if (c.charge > 0) return { id: 'bring', step: 2, label: 'act_bring', target: 'paper' };
      return { id: 'comb', step: 1, label: 'act_comb', target: 'comb' };
    }
    if (!mag.on) return { id: 'on', step: 1, label: 'act_on', target: 'switch' };
    return mag.flips
      ? { id: 'flip', step: '', label: 'act_flip_back', target: 'magnet' }
      : { id: 'flip', step: 2, label: 'act_flip', target: 'magnet' };
  }
  function outcomeHtml() {
    if (s.scene === 'comb') {
      const c = s.comb;
      if (!atPaper()) return c.charge ? t('out_rub', { n: c.charge }) : t('out_none');
      const rel = featuredRatio() >= 1 ? '&gt;' : '&lt;';
      return t('out_pull', { em: `<span class="ef-em">${t('pull_comb')}</span>`, grav: `<span class="ef-grav">${t('pull_earth')}</span>`, rel });
    }
    const kind = currentForce();
    if (!mag.on) return t('out_off');
    if (!kind) return t('out_turn');
    return kind === 'attract' ? t('out_attract', { a: pole('N'), b: pole('S') }) : t('out_repel', { a: pole('N'), b: pole('N') });
  }
  let lastRule = '';
  function ruleHtml() {
    const law = () => t('rule_law', { p: pow(STRENGTH_EXP) });
    if (s.scene === 'comb') {
      const c = s.comb;
      if (!atPaper()) return t(c.charge ? 'rule_comb_q' : 'rule_comb_0');
      if (!c.charge) return t('rule_comb_none');
      if (featuredRatio() < 1) return t('rule_comb_near');
      return s.seen.magnet && s.mode !== 'quiz' ? law() : t('rule_comb_won', { p: pow(STRENGTH_EXP) });
    }
    const kind = currentForce();
    if (!mag.on) return t(mag.everOn ? 'rule_mag_off' : 'rule_mag_0');
    if (!kind) return lastRule || t('rule_mag_on'); // turning round: keep the last sentence
    if (kind === 'repel') return t('rule_mag_repel');
    if (mag.fromFar) return s.seen.comb && s.mode !== 'quiz' ? law() : t('rule_mag_far'); // pulled in from far away: the range
    return t('rule_mag_on');
  }
  function refresh() {
    root.dataset.scene = s.scene;
    sheet.choose(s.scene);
    const out = outcomeHtml();
    sheet.outcome(out);
    const k = s.scene === 'comb' ? (atPaper() ? 'pull' : 'charge') : 'magnet';
    if (outcomeEl.dataset.k !== k) outcomeEl.dataset.k = k;
    lastRule = ruleHtml();
    sheet.rule(lastRule);
    if (s.scene === 'magnet' && currentForce() === 'repel' && s.mode !== 'quiz') s.seen.magnet = true;
    {
      const p = plan();
      action.set({ step: p.step, label: p.label, target: TARGETS[p.target], enabled: !s.busy && !mag.flipping });
      // the ring shows on the part to touch while nothing plays (never while the comb flies or combs)
      if (s.busy || s.comb.place === 'travel' || mag.flipping) action.hide('run');
      else action.show('run');
    }
    stage.invalidate();
  }

  function snapshot() {
    const c = s.comb;
    const ratio = featuredRatio();
    const p = plan();
    return {
      scene: s.scene,
      view: s.view,
      mode: s.mode,
      comb: {
        charge: c.charge,
        place: c.place,
        height: c.place === 'paper' ? +c.h.toFixed(1) : null,
        reach: +reach(c.charge).toFixed(1),
        lifted: lifted(),
        pull: Number.isFinite(ratio) ? +ratio.toFixed(2) : null, // the comb's pull ÷ the paper's weight (null: stuck to it)
        wins: ratio >= 1,
      },
      magnet: {
        on: mag.on,
        facing: facingPole(mag.orient),
        gap: +mag.gap.toFixed(1),
        force: currentForce(),
        moving: mag.v !== 0,
      },
      next: { action: p.id, step: p.step, busy: s.busy }, // what the big button does now
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.scene, snap.mode, snap.comb.charge, snap.comb.place, snap.comb.lifted, snap.comb.wins, snap.magnet, snap.next]);
    if (k === lastEmitted) return;
    lastEmitted = k;
    emit('change', snap);
  }

  // ── labels in the picture (the kit's annotations: each takes the first clear spot) ──
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, note, () => action?.ringBox(), () => action?.box()] });
  /** Add a label, or change it in place (no fade-in again) if it is there. */
  function label(id, opts) {
    if (anno.has(id)) anno.update(id, opts);
    else anno.add(id, opts);
  }
  const V3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const pv = new THREE.Vector3();
  const toScreen = (p) => {
    pv.copy(p).project(camera);
    return { x: (pv.x * 0.5 + 0.5) * stage.width, y: (-pv.y * 0.5 + 0.5) * stage.height };
  };
  const combCorners = [];
  for (const x of [-COMB_SIZE.end, COMB_SIZE.end]) for (const y of [0, COMB_SIZE.top]) combCorners.push(new THREE.Vector3(x, y, 0));
  /** A box round some screen points (px). */
  function boxOfPoints(list, pad = 4) {
    const b = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (const q of list) {
      b.left = Math.min(b.left, q.x - pad);
      b.right = Math.max(b.right, q.x + pad);
      b.top = Math.min(b.top, q.y - pad);
      b.bottom = Math.max(b.bottom, q.y + pad);
    }
    return b;
  }
  /** The comb on the screen (px box). */
  const combBox = (pad = 4) =>
    boxOfPoints(
      combCorners.map((c) => toScreen(tmp.copy(c).applyMatrix4(comb.matrixWorld))),
      pad,
    );
  /** An arrow on the screen (px box round it), or null when hidden. */
  function arrowBox(arrow, pad = 5) {
    if (!arrow.root.visible) return null;
    return boxOfPoints([toScreen(arrow.root.position), toScreen(arrow.tip())], pad);
  }
  const edge = new THREE.Vector3();
  /** The bits of paper on the screen (px boxes), but the one with the arrows. */
  function bitBoxes() {
    const out = [];
    cs.bits.forEach((b, i) => {
      if (i === FEATURED) return;
      const c = toScreen(b.group.position);
      const r = Math.abs(toScreen(edge.copy(b.group.position).setX(b.group.position.x + b.size / 2)).x - c.x) + 2;
      out.push({ left: c.x - r, right: c.x + r, top: c.y - r * 0.7, bottom: c.y + r * 0.7 });
    });
    return out;
  }
  const [, NOSE, CHIN] = cs.points.face;
  const headCorners = [V3(HEAD.x - 100, hairTop(HEAD.x) + 4), V3(NOSE.x, hairTop(HEAD.x) + 4), V3(HEAD.x - 100, CHIN.y - 8), V3(NOSE.x, CHIN.y - 8)];
  /** The student's face and hair on the screen (px box): the pulls' names keep off it. */
  const headBox = () =>
    boxOfPoints(
      headCorners.map((p) => toScreen(p)),
      0,
    );
  const PAPER_LABEL_AT = new THREE.Vector3(15, 0, 28);
  const COIL_LABEL_AT = new THREE.Vector3(COIL_X, 2, 18);
  const cartLabelAt = new THREE.Vector3();
  const upTip = new THREE.Vector3();
  const downTip = new THREE.Vector3();
  const SIDE = (d) => [
    { dx: 14, dy: d },
    { dx: -14, dy: d },
    { dx: 14, dy: 0 },
    { dx: -14, dy: 0 },
  ];
  /** The two pulls' names beside their arrows (left out when there is no room: the result line names them too). */
  function syncArrowLabels() {
    if (downArrow.root.visible && s.mode !== 'quiz') {
      label('down', {
        text: t('pull_earth'),
        kind: 'callout',
        color: COLORS.grav,
        point: () => downTip.copy(downArrow.tip()),
        spots: [
          { dx: -14, dy: 12 },
          { dx: 0, dy: 20 },
          { dx: 14, dy: 10 },
          { dx: -14, dy: 26 },
        ],
        optional: true,
        avoid: [() => combBox(), () => arrowBox(upArrow), () => bitBoxes(), headBox],
      });
    } else anno.remove('down');
    if (upArrow.root.visible && s.mode !== 'quiz') {
      label('up', {
        text: t('pull_comb'),
        kind: 'callout',
        color: COLORS.em,
        point: () => upTip.copy(upArrow.tip()).setY(upArrow.tip().y - 6),
        spots: [{ dx: 0, dy: -16 }, ...SIDE(-4), { dx: -20, dy: -18 }, { dx: -40, dy: -26 }],
        optional: true,
        avoid: [() => combBox(), () => arrowBox(downArrow), () => bitBoxes(), headBox],
      });
    } else anno.remove('up');
  }
  const forceMid = new THREE.Vector3();
  function syncForceLabel(kind) {
    if (magArrow.root.visible && kind) {
      forceMid.set(COIL.x1 + mag.gap / 2, ARROW.y, ARROW.z); // right above the gap, where the two arrows meet or part
      label('force', {
        text: t(kind),
        kind: 'callout',
        color: COLORS.em,
        point: () => forceMid,
        spots: [
          { dx: 0, dy: -20 },
          { dx: 0, dy: -34 },
        ],
        avoid: [() => arrowBox(magArrow, 3), () => arrowBox(coilArrow, 3)],
      });
    } else anno.remove('force');
  }
  /** The labels that belong to this scene and state (the arrows' and the force's follow by themselves). */
  function refreshLabels() {
    const quizzing = s.mode === 'quiz';
    note.hidden = s.scene !== 'magnet';
    if (s.scene === 'comb') {
      for (const id of ['force', 'poleS', 'poleN', 'current', 'coil', 'magnet', 'switch', 'cell']) anno.remove(id);
      if (s.comb.charge > 0 && s.comb.place === 'hair' && !quizzing)
        label('charge', {
          text: t('lbl_charge'),
          kind: 'callout',
          color: COLORS.em,
          point: cs.points.discs,
          spots: [
            { dx: 40, dy: -30 },
            { dx: 90, dy: 30 },
            { dx: 100, dy: 60 },
            { dx: 110, dy: 0 },
            { dx: 30, dy: 50 },
          ],
          optional: true,
          avoid: [() => combBox(2)],
        });
      else anno.remove('charge');
      if (!lifted() && !quizzing)
        label('paper', {
          text: t('lbl_paper'),
          point: () => PAPER_LABEL_AT,
          spots: [
            { dx: 0, dy: 26 },
            { dx: -30, dy: 24 },
            { dx: 30, dy: 24 },
            { dx: 0, dy: -50 },
            { dx: -80, dy: 14 },
          ],
          optional: true,
          avoid: [() => bitBoxes(), () => combBox()],
        });
      else anno.remove('paper');
      syncArrowLabels();
    } else {
      for (const id of ['up', 'down', 'charge', 'paper']) anno.remove(id);
      // while the current flows the coil is a magnet: its ends are named under them (N faces the bar magnet)
      if (mag.on) {
        const below = (dx) => [
          { dx: 0, dy: 16 },
          { dx, dy: 14 },
        ];
        label('poleS', { text: 'S', kind: 'pole', color: COLORS.south, point: () => ms.points.south, spots: below(-12) });
        label('poleN', { text: 'N', kind: 'pole', color: COLORS.north, point: () => ms.points.north, spots: below(12) });
      } else {
        anno.remove('poleS');
        anno.remove('poleN');
      }
      const part = (id, key, point, spots, show = true) =>
        show && !quizzing ? label(id, { text: t(key), point, spots, optional: true }) : anno.remove(id);
      part(
        'current',
        'current_on',
        () => ms.points.cell,
        [
          { dx: 0, dy: -26 },
          { dx: -20, dy: -22 },
          { dx: 20, dy: -22 },
        ],
        mag.on,
      );
      part('coil', 'lbl_coil', () => COIL_LABEL_AT, [
        { dx: 0, dy: mag.on ? 44 : 20 },
        { dx: -20, dy: mag.on ? 44 : 18 },
        { dx: 0, dy: 20 },
      ]);
      part('magnet', 'lbl_magnet', () => cartLabelAt.set(ms.cart.position.x, 2, 18), [
        { dx: 0, dy: 20 },
        { dx: 20, dy: 18 },
      ]);
      part(
        'switch',
        'lbl_switch',
        () => ms.points.switch,
        [
          { dx: 0, dy: -30 },
          { dx: 24, dy: -20 },
        ],
        !mag.everOn,
      );
      part(
        'cell',
        'lbl_cell',
        () => ms.points.cell,
        [
          { dx: 0, dy: -34 },
          { dx: -22, dy: -26 },
        ],
        !mag.everOn,
      );
      syncForceLabel(currentForce());
    }
    stage.invalidate();
  }

  // ── camera: one frame per example that shows the whole experiment ──────────
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  function viewDir(key) {
    const el = deg(ELEVATION[key] + (s.view === '3d' ? 12 : 0));
    const az = s.view === '3d' ? deg(32) : 0;
    return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  }
  /** What a view must show: points, some with a box round them on the screen (px from the point). */
  function contentOf(key) {
    const pts = [];
    const combAt = (pose, box = null) => {
      const m = new THREE.Matrix4().compose(V(pose.x, pose.y, 0), new THREE.Quaternion().setFromAxisAngle(Z, pose.rot), new THREE.Vector3(1, 1, 1));
      for (const c of combCorners) pts.push(box ? { p: c.clone().applyMatrix4(m), box } : c.clone().applyMatrix4(m));
    };
    const combAtBox = (pose) => {
      const m = new THREE.Matrix4().compose(V(pose.x, pose.y, 0), new THREE.Quaternion().setFromAxisAngle(Z, pose.rot), new THREE.Vector3(1, 1, 1));
      return new THREE.Box3().setFromPoints(combCorners.map((c) => c.clone().applyMatrix4(m)));
    };
    if (key === 'comb') {
      // the comb in the hair (its ring round it, with room for the badge), enough of the hair, the face
      combAt(hairPose(REST_X), [-12, -12, 12, 12]);
      // the ring is a pill round the tilted comb's box: its corners must stay clear of the buttons too
      const rest = combAtBox(hairPose(REST_X));
      for (const x of [rest.min.x, rest.max.x]) for (const y of [rest.min.y, rest.max.y]) pts.push({ p: V(x, y), box: [-6, -6, 6, 6] });
      combAt(hairPose(ARC.from));
      combAt(hairPose(ARC.to));
      pts.push(...cs.points.crown, cs.points.face[1]);
      // the bits on the table (their ring round them)
      for (const b of cs.bits) {
        const p = b.home.position;
        pts.push(
          { p: V(p.x - b.size / 2, 0, p.z - b.size / 2), box: [-12, -12, 0, 0] },
          { p: V(p.x + b.size / 2, 0, p.z + b.size / 2), box: [0, 0, 12, 12] },
        );
      }
      // the comb over them, from where it arrives to where it holds the bits up in the air
      for (const y of [stopHeight(COMB.levels), PAPER_H.start]) combAt({ x: PAPER_X.start, y, rot: 0 });
      const f = cs.bits[FEATURED].home.position;
      pts.push({ p: V(f.x, -W_ARROW, f.z), box: [-8, 0, 8, 8] }); // the weight's arrow under the bit
      const hung = V(PAPER_X.start + cs.bits[FEATURED].cling.x, LIFT_HEIGHT + cs.bits[FEATURED].cling.y);
      pts.push({ p: hung.clone().setY(hung.y + W_ARROW * MAX_RATIO), box: [-8, -26, 8, 0] }); // the comb's arrow, its name above
      return pts;
    }
    // the magnets: the circuit in a row (cell, switch, coil), the track to the end block, the arrows and their label
    const { left, right } = ms.extent;
    pts.push(V(left, 0, 26), V(left, 22, -12), V(right, 0, 22), V(right, 24, -22));
    pts.push(V(COIL.x0, 2 * COIL.flange, -20), V(COIL_X, 0, 32)); // the coil, the wire along the front
    pts.push(V(COIL.x1 - 40, ARROW.y + 5, ARROW.z), V(COIL.x1 + MAG.gapMax + 40, ARROW.y + 5, ARROW.z)); // the arrows
    pts.push({ p: V(COIL.x1 + START_GAP / 2, ARROW.y, ARROW.z), box: [-45, -44, 45, 0] }); // their label
    pts.push({ p: V(COIL_X, 0, 20), box: [-70, 0, 70, 56] }, { p: V(magnetX(START_GAP), 0, 20), box: [-50, 0, 50, 40] });
    pts.push({ p: ms.points.cell, box: [-50, -48, 50, 0] }); // the current's or the cell's label
    return pts;
  }
  function boxOf(node, pad = 6) {
    if (!node || node.hidden || getComputedStyle(node).visibility === 'hidden') return null;
    const c = stage.canvas.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left - c.left - pad, right: r.right - c.left + pad, top: r.top - c.top - pad, bottom: r.bottom - c.top + pad };
  }
  /** A camera pose that shows the example's whole experiment as big as it can, clear of the corner buttons. */
  function poseFor(key) {
    note.hidden = s.scene !== 'magnet';
    return fitPose({
      points: contentOf(key),
      dir: viewDir(key),
      fov: camera.fov,
      aspect: camera.aspect,
      width: stage.width,
      height: stage.height,
      keepOff: [boxOf(ui.corner), key === 'magnet' ? boxOf(note) : null].filter(Boolean),
    });
  }
  function flyTo({ position, target }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
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
    controls.enableRotate = s.view === '3d';
    controls.enableZoom = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(poseFor(s.scene), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  // a turned phone: the picture is framed again at once
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(poseFor(s.scene), 0);
  });

  // ── the comb's action: comb the hair, bring it to the paper, start again ──
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  /** Runs an animation of the action: the button waits and the ring hides until it ends (or a newer run starts). */
  async function playing(my, fn) {
    s.busy = true;
    refresh();
    try {
      return await fn();
    } finally {
      if (my === run) {
        s.busy = false;
        refresh();
        refreshLabels();
        emitChange();
      }
    }
  }
  /** One pass of the comb along the hair to x (no charge from the motion itself: the caller adds a level). */
  const pass = (to, seconds = 0.36) => {
    const from = s.comb.hx;
    return tweener.animate({
      key: 'comb',
      duration: seconds,
      ease: ease.inOutSine,
      onUpdate: (k) => rubTo(from + (to - from) * k, { charge: false }),
    }).finished;
  };
  /** Comb the hair: a few passes, a level of charge each, up to a fully charged comb. */
  function combAuto(passes = COMB.levels) {
    const my = ++run;
    tweener.cancel('comb');
    return playing(my, async () => {
      const target = Math.min(COMB.levels, s.comb.charge + passes);
      for (let i = 0; i < 8 && s.comb.charge < target; i++) {
        const to = s.comb.hx < REST_X ? ARC.to : ARC.from;
        if (!(await pass(to)) || my !== run) return;
        gainCharge();
        refreshLabels();
      }
      // back to the middle of the crown, where it rests
      if (my === run) await pass(REST_X, 0.25);
    });
  }
  /**
   * Fly the comb from the hair to over the paper, lower it slowly until the bits jump (a little inside its reach),
   * then lift it up again with the bits hanging from it: "কাগজকে আকর্ষণ করে তুলে নাও". With no charge it comes
   * right down and nothing happens. It stops as soon as the student takes the comb.
   */
  function bring({ descend = true } = {}) {
    if (s.comb.place !== 'hair') return Promise.resolve();
    const my = ++run;
    tweener.cancel('comb');
    return playing(my, async () => {
      s.comb.place = 'travel';
      s.comb.dest = 'paper';
      s.comb.cx = PAPER_X.start;
      s.comb.h = PAPER_H.start;
      const a = hairPose(s.comb.hx);
      const b = paperPose();
      refresh();
      refreshLabels();
      emitChange();
      const ok = await tweener.animate({
        key: 'comb',
        duration: 1.0,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          const lift = Math.sin(Math.PI * k) * 30;
          placeComb({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k + lift, rot: a.rot * (1 - k) });
          stage.invalidate();
        },
      }).finished;
      if (!ok || my !== run) return;
      s.comb.place = s.comb.dest = 'paper';
      placeComb(paperPose());
      refresh();
      refreshLabels();
      emitChange();
      if (!descend) return;
      const q = s.comb.charge;
      if (!(await lower(stopHeight(q), q ? 1.9 : 2.2, my)) || !q) return;
      await wait(350);
      if (my !== run) return;
      await lower(LIFT_HEIGHT, 1.0, my); // up it goes, the bits with it
    });
  }
  /** Lower (or raise) the comb over the paper to height h in some seconds. */
  async function lower(h, seconds, my = ++run) {
    const h0 = s.comb.h;
    const ok = await tweener.animate({
      key: 'comb',
      duration: seconds,
      ease: ease.inOutSine,
      onUpdate: (k) => {
        s.comb.h = h0 + (h - h0) * k;
        placeComb(paperPose());
        stage.invalidate();
      },
    }).finished;
    if (ok && my === run) emitChange();
    return ok && my === run;
  }
  /** The comb back in the hair, with no charge (instantly, or the bits fall and it flies back). */
  async function again({ animate = true, my = ++run } = {}) {
    tweener.cancel('comb');
    if (!animate) {
      dropBits({ instant: true });
      setCharge(0);
      s.comb.rubbed = 0;
      s.comb.place = s.comb.dest = 'hair';
      s.comb.hx = REST_X;
      placeComb(hairPose(s.comb.hx));
      refresh();
      refreshLabels();
      emitChange();
      return true;
    }
    dropBits();
    s.comb.place = 'travel';
    s.comb.dest = 'hair';
    setCharge(0); // starting again: a comb with no charge
    refresh();
    refreshLabels();
    await wait(420);
    if (my !== run) return false;
    const a = { x: comb.position.x, y: comb.position.y, rot: comb.rotation.z };
    const b = hairPose(REST_X);
    const ok = await tweener.animate({
      key: 'comb',
      duration: 0.9,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        const lift = Math.sin(Math.PI * k) * 30;
        placeComb({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k + lift, rot: b.rot * k });
        stage.invalidate();
      },
    }).finished;
    if (!ok || my !== run) return false;
    s.comb.place = s.comb.dest = 'hair';
    s.comb.hx = REST_X;
    s.comb.rubbed = 0;
    placeComb(hairPose(REST_X));
    refresh();
    refreshLabels();
    emitChange();
    return true;
  }
  /** The action once both steps are done: the bits fall, the comb goes back to the hair and is combed again. */
  function againAndComb() {
    const my = ++run;
    return playing(my, async () => {
      if (await again({ my })) combAuto();
    });
  }
  /**
   * The comb straight to a place (no animation): over the paper at height h, or, with no h, where bring() ends
   * (charged: the bits lifted and held up in the air; no charge: right down over them); or back in the hair.
   */
  function combAt(place, { h = null, cx = PAPER_X.start } = {}) {
    ++run;
    s.busy = false;
    tweener.cancel('comb');
    if (place === 'paper') {
      s.comb.place = s.comb.dest = 'paper';
      s.comb.cx = Math.min(Math.max(cx, PAPER_X.min), PAPER_X.max);
      s.comb.h = Math.min(Math.max(h ?? stopHeight(s.comb.charge), PAPER_H.min), PAPER_H.max);
      placeComb(paperPose());
      settleBits();
      if (h == null && s.comb.charge) {
        s.comb.h = LIFT_HEIGHT;
        placeComb(paperPose());
      }
      tickComb();
    } else {
      dropBits({ instant: true });
      s.comb.place = s.comb.dest = 'hair';
      placeComb(hairPose(s.comb.hx));
    }
    refresh();
    refreshLabels();
    emitChange();
  }

  /** The action: the big button, its badge on the picture, a tap on the part it rings, Space/Enter. */
  function doAction() {
    audio.unlock();
    if (s.locked || s.mode === 'quiz') return lockedNudge();
    if (s.busy || mag.flipping) return;
    const t0 = now();
    if (t0 - lastAct < DOUBLE_TAP) return; // a double tap must not undo the first
    lastAct = t0;
    const p = plan();
    if (p.id === 'comb') combAuto();
    else if (p.id === 'bring') bring();
    else if (p.id === 'again') againAndComb();
    else if (p.id === 'on') setSwitch(true);
    else if (p.id === 'flip') flip();
  }

  // ── switching examples ──────────────────────────────────────────────────────
  function setScene(name, { animate = true } = {}) {
    const next = name === 'magnet' ? 'magnet' : 'comb';
    ++run;
    s.busy = false;
    tweener.cancel('comb');
    // a comb in flight lands where it was going
    if (s.comb.place === 'travel') combAt(s.comb.dest);
    mag.dragging = false;
    drag = null;
    s.scene = next;
    cs.root.visible = next === 'comb';
    ms.root.visible = next === 'magnet';
    anno.clear();
    hideHint();
    s.userMovedCamera = false;
    aimSun();
    flyTo(poseFor(next), animate ? 0.7 : 0);
    syncUI();
    refresh();
    refreshLabels();
    emit('scene', { scene: next });
    emitChange();
  }

  // ── touching the 3D ─────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitP = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function rayAt(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  /** What a finger at this canvas point takes: 'comb', 'paper', 'magnet', 'switch' or null. */
  function pick(p) {
    rayAt(p);
    if (s.scene === 'comb') {
      if (s.comb.place === 'travel') return null;
      if (raycaster.intersectObject(cs.combHit, false).length) return 'comb';
      // a touch a little off the comb still takes it
      const b = combBox(0);
      if (p.x > b.left - 20 && p.x < b.right + 20 && p.y > b.top - 20 && p.y < b.bottom + 20) return 'comb';
      return raycaster.intersectObject(cs.paperHit, false).length ? 'paper' : null;
    }
    const hit = raycaster.intersectObjects(ms.hits, false)[0];
    return hit ? hit.object.userData.part : null;
  }
  /** Where the finger is on the plane of the comb and the magnets (z = 0), in mm. */
  function planeAt(p) {
    rayAt(p);
    return raycaster.ray.intersectPlane(plane, hitP) ? hitP.clone() : null;
  }
  let drag = null; // { id, part, x0, y0, moved, dx, dy }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = canvasPoint(e);
      const part = pick(p);
      if (!part) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (part === 'switch') return setSwitch(!mag.on); // like a real switch, it acts as the finger goes down
      const at = planeAt(p);
      if (!at) return;
      drag = { id: e.pointerId, part, x0: p.x, y0: p.y, moved: false, dx: 0, dy: 0 };
      if (part === 'comb') Object.assign(drag, { dx: comb.position.x - at.x, dy: comb.position.y - at.y });
      if (part === 'magnet') drag.dx = ms.cart.position.x - at.x;
      capturePointer(ui.canvasHost, e.pointerId); // keep the drag when the finger leaves the part
    },
    true,
  );
  function dragTo(e) {
    const p = canvasPoint(e);
    if (!drag.moved) {
      if (Math.hypot(p.x - drag.x0, p.y - drag.y0) < TAP_MOVE || drag.part === 'paper') return;
      drag.moved = true;
      ++run; // the student takes over: a running animation of the comb stops
      tweener.cancel('comb');
      if (s.busy) {
        s.busy = false;
        refresh();
      }
    }
    const at = planeAt(p);
    if (!at) return;
    if (drag.part === 'comb') {
      if (s.comb.place === 'hair') rubTo(at.x + drag.dx);
      else if (s.comb.place === 'paper') {
        s.comb.cx = Math.min(Math.max(at.x + drag.dx, PAPER_X.min), PAPER_X.max);
        s.comb.h = Math.min(Math.max(at.y + drag.dy, PAPER_H.min), PAPER_H.max);
        placeComb(paperPose());
        stage.invalidate();
      }
      return;
    }
    mag.dragging = true;
    mag.v = 0;
    mag.gap = Math.min(Math.max(at.x + drag.dx - magnetX(0), 0), MAG.gapMax);
    placeCart();
    stage.invalidate();
  }
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      e.preventDefault();
      dragTo(e);
    } else if (e.pointerType === 'mouse' && !drag) {
      ui.canvasHost.style.cursor = pick(canvasPoint(e)) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    }
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    releasePointer(ui.canvasHost, e.pointerId);
    if (d.part === 'magnet') {
      mag.dragging = false;
      noteStart();
    }
    const tap = !d.moved && e.type === 'pointerup';
    if (tap && d.part === 'magnet') flip();
    else if (tap && d.part === 'comb')
      doAction(); // a tap on the comb does what the button says
    else if (tap && d.part === 'paper') {
      // the bits of paper: bring the comb (with or without charge: an uncharged one lifts nothing)
      if (s.comb.place === 'hair' && !s.busy) {
        lastAct = now();
        bring();
      } else doAction();
    }
    refresh();
    refreshLabels();
    emitChange();
  };
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── hint line (only for the locked picture in the test) ─────────────────────
  let hintTimer = 0;
  function showHint(msg, { duration = 3000 } = {}) {
    ui.hintText.textContent = msg;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }
  function lockedNudge() {
    showHint(t('q_locked'));
    audio.error();
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const opt = (html) => `<span class="ef-opt">${html}</span>`;
  /** A question whose answers are i18n keys (or functions): the right one first in `keys`. */
  function wordChoices(keys) {
    const order = shuffle(keys.map((_, i) => i));
    return {
      choices: [0, 1, 2, 3],
      expected: order.indexOf(0),
      tolerance: 0.5,
      label: (j) => opt(typeof keys[order[j]] === 'function' ? keys[order[j]]() : t(keys[order[j]])),
      order,
    };
  }
  /** The comb set up for a question: its charge, over the paper at a height (none: holding the lifted bits up). */
  function combQuestion(charge, h) {
    if (s.scene !== 'comb') setScene('comb');
    dropBits({ instant: true });
    setCharge(charge);
    combAt('paper', { h });
  }
  /** The magnets set up for a question: the switch, the magnet's facing pole, held at a gap. */
  function magnetQuestion({ on, facing, gap }) {
    if (s.scene !== 'magnet') setScene('magnet');
    tweener.cancel('flip');
    mag.flipping = false;
    ms.magnet.position.y = 19.5;
    mag.orient = facing === 'N' ? 'NS' : 'SN';
    ms.magnet.rotation.y = mag.orient === 'SN' ? 0 : Math.PI;
    mag.hold = true;
    setSwitch(on, { animate: false });
    placeMagnet(gap);
    refreshLabels();
  }

  let kinds = [];
  let question = null;
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
        ++run;
        s.busy = false;
        tweener.cancel('comb');
        s.mode = 'quiz';
        s.showArrows = false;
        drag = null;
        mag.dragging = false;
        hideHint();
        kinds = shuffle([Math.random() < 0.5 ? 'rise' : 'dry', 'poles', 'off', 'strength', 'range']);
        syncUI();
        refreshLabels();
      },
      leave() {
        ++run;
        s.mode = 'explore';
        s.locked = false;
        s.showArrows = true;
        mag.hold = false;
        restoreLearn();
        syncUI();
      },
      async prepare(i, _alive, say) {
        ++run;
        s.locked = true;
        s.showArrows = false; // the arrows would give the answer away: they come back after it
        const kind = kinds[i % kinds.length];
        question = { kind };
        let c;
        if (kind === 'rise') {
          combQuestion(4);
          say(t('q_rise'));
          c = wordChoices(['opt_rise_right', 'opt_rise_mass', 'opt_rise_nograv', 'opt_rise_air']);
        } else if (kind === 'dry') {
          combQuestion(0, 62);
          say(t('q_dry'));
          c = wordChoices(['opt_dry_right', 'opt_dry_jump', 'opt_dry_away', 'opt_dry_small']);
        } else if (kind === 'poles') {
          const facing = Math.random() < 0.5 ? 'N' : 'S';
          magnetQuestion({ on: true, facing, gap: 34 });
          say(t('q_poles'));
          c = wordChoices(
            facing === 'N'
              ? ['opt_like_rep', 'opt_like_att', 'opt_unlike_att', 'opt_unlike_rep']
              : ['opt_unlike_att', 'opt_unlike_rep', 'opt_like_rep', 'opt_like_att'],
          );
          question.facing = facing;
        } else if (kind === 'off') {
          magnetQuestion({ on: false, facing: Math.random() < 0.5 ? 'N' : 'S', gap: 22 });
          say(t('q_off'));
          c = wordChoices(['opt_off_right', 'opt_off_always', 'opt_off_copper', 'opt_off_repel']);
        } else if (kind === 'strength') {
          combQuestion(5);
          say(t('q_strength'));
          const em = t('f_em_long');
          const grav = t('f_grav_long');
          c = wordChoices([
            () => t('opt_str', { f: em, p: pow(STRENGTH_EXP) }),
            () => t('opt_str', { f: grav, p: pow(STRENGTH_EXP) }),
            () => t('opt_str', { f: em, p: STRENGTH_EXP }),
            () => t('opt_str', { f: grav, p: STRENGTH_EXP }),
          ]);
        } else {
          // the range, from the picture: the switch on, the magnet at the far end of the track (unlike poles facing);
          // is the coil still pulling it? (its arrows show after the answer, and the magnet rolls in)
          magnetQuestion({ on: true, facing: 'S', gap: MAG.gapMax });
          say(t('q_range'));
          c = wordChoices(['opt_far_right', 'opt_far_zero', 'opt_far_touch', 'opt_far_more']);
        }
        Object.assign(question, c);
        return { ...c, meta: { kind, facing: question.facing } };
      },
      reveal(_q, _correct, picked) {
        const q = question;
        const mistake = picked && picked.index >= 0 ? q.order[picked.index] : -1; // which wrong answer (1–3), or -1 / 0
        const miss = (key) => (mistake > 0 && t(`${key}_${mistake}`) !== `${key}_${mistake}` ? ` ${t(`${key}_${mistake}`)}` : '');
        const my = ++run;
        if (q.kind === 'rise') {
          s.showArrows = true; // now the two pulls are shown
          return t('why_rise') + miss('mis_rise');
        }
        if (q.kind === 'dry') {
          s.showArrows = true;
          lower(stopHeight(0), 1.6, my); // down it comes: nothing jumps
          return t('why_dry') + miss('mis_dry');
        }
        if (q.kind === 'poles') {
          mag.hold = false;
          s.showArrows = true;
          return (q.facing === 'N' ? t('why_poles_rep', { p: 'N' }) : t('why_poles_att', { a: 'N', b: 'S' })) + miss('mis_poles');
        }
        if (q.kind === 'off') {
          mag.hold = false;
          // then the switch goes on: now it is a magnet again
          wait(1400).then(() => {
            if (my !== run || s.mode !== 'quiz') return;
            s.showArrows = true;
            setSwitch(true);
          });
          return t('why_off') + miss('mis_off');
        }
        // no arrows here: their 2 : 1 is this comb and this paper, not the 10^36 of the forces themselves
        if (q.kind === 'strength') return t('why_strength', { p: pow(STRENGTH_EXP), one: 1, n: STRENGTH_EXP }); // long enough already: no note
        mag.hold = false;
        s.showArrows = true;
        return t('why_range') + miss('mis_range');
      },
      done() {
        s.locked = false;
      },
    },
  });
  /** Back from the test: the comb at the hair with no charge, the magnets as at the start, the comb example. */
  function restoreLearn() {
    dropBits({ instant: true });
    setCharge(0);
    tweener.cancel('comb');
    s.busy = false;
    s.comb.place = s.comb.dest = 'hair';
    s.comb.hx = REST_X;
    s.comb.rubbed = 0;
    placeComb(hairPose(s.comb.hx));
    tweener.cancel('flip');
    mag.flipping = false;
    ms.magnet.position.y = 19.5;
    mag.orient = 'SN';
    ms.magnet.rotation.y = 0;
    setSwitch(false, { animate: false });
    mag.everOn = false;
    mag.flips = 0;
    placeMagnet(START_GAP);
    setScene('comb');
  }

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
    sheet.choose(s.scene);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && s.mode !== 'quiz' && b.dataset.example !== s.scene) setScene(b.dataset.example);
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
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    const k = e.key.toLowerCase();
    const learning = s.mode !== 'quiz'; // in the test the picture belongs to the question
    const c = s.comb;
    if ((k === ' ' || k === 'enter') && !target.closest('button')) doAction();
    else if (k === '1' && learning) setScene('comb');
    else if (k === '2' && learning) setScene('magnet');
    else if ((k === 'arrowleft' || k === 'arrowright') && learning) {
      const dir = k === 'arrowright' ? 1 : -1;
      ++run;
      s.busy = false;
      tweener.cancel('comb');
      if (s.scene === 'magnet') {
        mag.v = 0;
        placeMagnet(mag.gap + dir * 5);
      } else if (c.place === 'hair') rubTo(c.hx + dir * 10);
      else if (c.place === 'paper') {
        c.cx = Math.min(Math.max(c.cx + dir * 4, PAPER_X.min), PAPER_X.max);
        placeComb(paperPose());
        stage.invalidate();
      }
      refresh();
    } else if ((k === 'arrowup' || k === 'arrowdown') && learning && s.scene === 'comb' && c.place === 'paper') {
      ++run;
      s.busy = false;
      tweener.cancel('comb');
      c.h = Math.min(Math.max(c.h + (k === 'arrowup' ? 4 : -4), PAPER_H.min), PAPER_H.max);
      placeComb(paperPose());
      stage.invalidate();
      refresh();
      emitChange();
    } else if (k === 'x' && learning && s.scene === 'magnet') flip();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  setCharge(Number(o.charge) || 0);
  placeComb(hairPose(s.comb.hx));
  placeCart();
  ms.setCoilOn(false);
  if (o.place === 'paper') combAt('paper');
  setScene(s.scene, { animate: false });
  setView(s.view, { animate: false });
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
    getState: snapshot,
    /**
     * Change any of: scene ('comb' | 'magnet'); charge (0–5, the comb's charge); strokes (comb the hair this many
     * times, animated); place ('hair' | 'paper': where the comb is; to the paper with animate it flies and comes
     * down) and height (mm of its teeth above the table, over the paper); again (true: start again); on (the
     * switch), facing ('N' | 'S': the magnet's end facing the coil), gap (mm between them; the force then acts);
     * view; animate: false jumps (the cart goes straight to where it would stop).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.scene && p.scene !== s.scene) setScene(p.scene, { animate });
      if (p.again) {
        if (s.scene !== 'comb') setScene('comb', { animate });
        await again({ animate });
      }
      if (p.charge != null) {
        setCharge(Number(p.charge));
        refresh();
        refreshLabels();
        emitChange();
      }
      if (p.strokes) {
        if (s.scene !== 'comb') setScene('comb', { animate });
        if (s.comb.place !== 'hair') combAt('hair');
        if (animate) combAuto(Number(p.strokes));
        else {
          setCharge(s.comb.charge + Number(p.strokes));
          refresh();
          refreshLabels();
        }
      }
      if (p.place === 'paper' || (p.height != null && s.comb.place === 'paper')) {
        if (s.scene !== 'comb') setScene('comb', { animate });
        if (s.comb.place === 'hair' && animate && p.height == null) bring();
        else if (animate && s.comb.place === 'paper' && p.height != null) lower(Number(p.height), 1.2);
        else combAt('paper', { h: p.height != null ? Number(p.height) : null });
      } else if (p.place === 'hair' && s.comb.place !== 'hair') {
        if (animate) again();
        else combAt('hair');
      }
      if (p.on != null || p.facing || p.gap != null) {
        if (s.scene !== 'magnet') setScene('magnet', { animate });
        if (p.facing && facingPole(mag.orient) !== p.facing) flip({ animate });
        if (p.on != null) setSwitch(p.on, { animate });
        if (p.gap != null) placeMagnet(p.gap, { animate });
        else if (!animate) placeMagnet(mag.gap, { animate: false });
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      ++run;
      restoreLearn();
      s.seen.comb = s.seen.magnet = false;
      refresh();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    // the example shown: the student, the comb and the paper; or the coil, cell, switch and magnet (no arrows or tags)
    exportRoot: () => (s.scene === 'comb' ? cs.root : ms.root),
  };
}
