// Electromagnetic force (book page 68, topic 3.2.2), student view. Two examples, switched by two chips:
//  - চিরুনি (the book's own experiment): drag the comb through the hair (or press the button) and it gets a little
//    charge ("−" discs on it; loose hairs stand up). Bring it to the bits of paper on the desk: it comes down, the
//    bits jump up and cling to it, and it lifts them up into the air. One bit carries two arrows: the pull of the
//    whole Earth (down, মাধ্যাকর্ষণ বল) and the pull of the comb (up, তড়িৎ চৌম্বক বল), which grows as the comb comes
//    closer and wins. A comb with no charge does nothing.
//  - চুম্বক: a cell, a switch and a coil of wire in a row, and a bar magnet on a little cart. Switch on: the current
//    runs (chevrons along the wires) and the coil becomes a magnet (electric and magnetic forces are one force);
//    unlike poles attract, like poles repel (turn the magnet round, or drag it); far away the force is small but
//    never zero (its range is infinite).
// The panel says the idea in the book's words, a live comparison (comb's pull vs the Earth's, or the poles and the
// force), and the four fundamental forces with this one highlighted. Then a short test. Built on the shared student
// kit (@shared/student/…); the physics is in physics.js, the models in comb-scene.js and magnet-scene.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createCoach } from '@shared/student/coach.js';
import { createMaterials } from '@shared/student/materials.js';
import { createQuiz } from '@shared/student/quiz.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createArrow } from './arrow.js';
import { ARC, COMB_SIZE, FEATURED, HEAD, createCombScene, hairSlope, hairTop } from './comb-scene.js';
import { createI18n } from './i18n.js';
import { createLabels } from './labels.js';
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
const W_ARROW = 28; // mm of arrow for a bit of paper's weight (the Earth's pull)
const MAX_RATIO = 2; // the comb's arrow is drawn at most this many times the weight's
// where the comb's middle may be over the paper: its last teeth stay over the bit with the arrows, so that bit is the
// first to jump (it hangs at the comb's end, its arrows clear of the comb)
const PAPER_X = { min: 196, start: 200, max: 206 };
const PAPER_H = { min: 9, start: 62, max: 70 }; // height of its teeth above the desk (mm)
const START_GAP = 40; // mm between the coil and the magnet at the start
const DOUBLE_TAP = 400; // ms in which a second tap on the main button is ignored
const deg = THREE.MathUtils.degToRad;
const ELEVATION = { hair: 12, paper: 14, magnet: 24 }; // how far above the front the camera looks from
const COIL_X = (COIL.x0 + COIL.x1) / 2;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** A power of ten in the language's digits: 10<sup>36</sup>, 10<sup>−15</sup>. */
  const pow = (n) => `${N(10)}<sup>${N(String(n).replace('-', '−'))}</sup>`;

  root.classList.add('pvc', 'ef');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const force = (cls, name, range) => `<span class="ef-f ${cls}"><b>${t(name)}</b><small title="${t('range')}">${range}</small></span>`;
  const ui = buildStudentShell(root, t, {
    learn: `
          <p class="ef-idea" aria-live="polite"></p>
          <div class="ef-read"><div class="ef-read-main"></div><button class="pvc-btn ef-flip" data-act="flip" hidden>${t('act_flip')}</button></div>
          <div class="ef-forces" role="group" aria-label="${t('forces')}">
            <span class="ef-forces-k">${t('forces')}</span>
            <div class="ef-ladder">
              ${force('grav', 'f_grav', t('infinite'))}${force('weak', 'f_weak', `${pow(-18)} ${t('unit_m')}`)}${force('em on', 'f_em', t('infinite'))}${force('strong', 'f_strong', `${pow(-15)} ${t('unit_m')}`)}
            </div>
          </div>
          <div class="pvc-learn-foot ef-foot">
            <div class="pvc-seg ef-scenes" role="group" aria-label="${t('scenes')}">
              <button data-scene="comb">${t('scene_comb')}</button>
              <button data-scene="magnet">${t('scene_magnet')}</button>
            </div>
            <button class="pvc-btn primary ef-act" data-act="main"><span></span></button>
          </div>`,
  });

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 5, far: 8000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 120;
  controls.maxDistance = 2500;
  controls.maxPolarAngle = Math.PI * 0.49; // never under the desk
  controls.enableRotate = false;
  controls.enablePan = false;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const M = createMaterials(stage.renderer);
  const cs = createCombScene({ materials: M, colors: COLORS });
  const ms = createMagnetScene({ materials: M, colors: COLORS });
  scene.add(cs.root, ms.root);
  const upArrow = createArrow({ color: COLORS.em, name: 'CombPull', radius: 1.6, head: 8, headRadius: 4.4 });
  const downArrow = createArrow({ color: COLORS.grav, name: 'EarthPull', radius: 1.6, head: 8, headRadius: 4.4 });
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
  /** The sun's shadow covers the part of the desk in the picture. */
  function aimSun() {
    if (!sun) return;
    const c = s.scene === 'comb' ? new THREE.Vector3(230, 0, 0) : new THREE.Vector3(-30, 0, 0);
    sun.position.copy(c).add(new THREE.Vector3(60, 420, 260));
    sun.target.position.copy(c);
    Object.assign(sun.shadow.camera, { left: -190, right: 190, top: 190, bottom: -190, near: 200, far: 900 });
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
    // the comb: at the hair (x of its middle along the top of the head), flying, or over the paper (cx, h)
    comb: { place: 'hair', dest: 'hair', charge: 0, rubbed: 0, hx: (ARC.from + ARC.to) / 2, cx: PAPER_X.start, h: PAPER_H.start, demo: false },
    // each bit of paper: on the desk, jumping up, stuck on the comb, or falling back
    bits: cs.bits.map(() => ({ phase: 'desk', t0: 0, dur: 0, lx: 0, from: new THREE.Vector3(), fromQ: new THREE.Quaternion() })),
    // the magnets: the switch, which way the bar magnet lies ('SN': its S end faces the coil), the gap (mm), speed
    mag: { on: false, orient: 'SN', gap: START_GAP, v: 0, hold: false, flipping: false, dragging: false, everOn: false, fromFar: false },
  };
  let run = 0; // every new action bumps it: an older animation that wakes up after an await stops there
  let lastMain = -1e9;

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
  /** The comb moved along the hair to x: combing leaves charge on it (one level for about one pass), up to `cap`. */
  function rubTo(x, cap = COMB.levels) {
    const c = s.comb;
    const nx = Math.min(Math.max(x, ARC.from), ARC.to);
    if (!c.demo && c.charge < cap) {
      c.rubbed += Math.abs(nx - c.hx);
      let gained = false;
      while (c.rubbed >= COMB.strokeMm && c.charge < cap) {
        c.rubbed -= COMB.strokeMm;
        setCharge(c.charge + 1);
        gained = true;
      }
      if (gained) {
        audio.tick();
        emit('charge', { charge: c.charge });
        refresh();
        refreshLabels();
        emitChange();
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
  /** The comb lets the bits go (they fall back where they were) — or, instantly, puts them back. */
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
  /** The comb's pull on the bit with the arrows ÷ its weight, as drawn (at most MAX_RATIO; 0 with no charge). */
  function featuredRatio() {
    const st = s.bits[FEATURED];
    if (s.comb.charge <= 0) return 0;
    if (st.phase === 'cling') return Infinity;
    return pullRatio(s.comb.charge, teethDist(cs.bits[FEATURED].group.position));
  }

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
      if (!n !== !lastLifted) refreshLabels(); // the paper's name goes once the bits are lifted
      lastLifted = n;
      refresh();
      emitChange();
    }
    // the two arrows on the bit with the arrows
    const ratio = featuredRatio();
    const wins = ratio >= 1;
    if (wins !== lastWins) {
      lastWins = wins;
      refresh();
      emitChange();
    }
    const p = cs.bits[FEATURED].group.position;
    const show = s.showArrows && s.scene === 'comb' && s.comb.place !== 'hair';
    const up = Math.min(ratio, MAX_RATIO);
    const movedUp = upArrow.set(p, UPV, show && up >= 0.05 ? W_ARROW * up : 0);
    const movedDown = downArrow.set(p, DOWNV, show ? W_ARROW : 0);
    if (movedUp || movedDown) stage.invalidate(); // drawing is on demand: an arrow that changed needs a new frame
    syncArrowLabels();
    return busy;
  }

  // ── the magnets ─────────────────────────────────────────────────────────────
  const mag = s.mag;
  const currentForce = () => (mag.flipping ? null : interaction(mag.on, facingPole(mag.orient)));
  const FAR = MAG.gapMax - 12; // mm: a pull that starts from this far shows the infinite range
  /** Remember whether this pull starts from far away (the panel then speaks of the range). */
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
    if (movedMag || movedCoil) stage.invalidate();
    syncForceLabel(kind);
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
    if (!animate) {
      mag.orient = next;
      ms.magnet.rotation.y = next === 'SN' ? 0 : Math.PI;
      noteStart();
      emit('flip', { facing: facingPole(next) });
      refresh();
      emitChange();
      return;
    }
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
      onComplete: () => {
        mag.orient = next;
        mag.flipping = false;
        ms.magnet.rotation.y = next === 'SN' ? 0 : Math.PI;
        ms.magnet.position.y = 19.5;
        noteStart();
        emit('flip', { facing: facingPole(next) });
        refresh();
        refreshLabels();
        emitChange();
      },
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

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = { idea: $('.ef-idea'), read: $('.ef-read-main'), flip: $('.ef-flip'), act: $('[data-act="main"] span') };
  const shown = {};
  function put(key, node, html) {
    if (shown[key] === html) return;
    shown[key] = html;
    node.innerHTML = html;
  }
  const pole = (p) => `<b class="ef-pole ${p === 'N' ? 'n' : 's'}">${p}</b>`;

  function combIdea() {
    const c = s.comb;
    if (c.place === 'hair') return t(c.charge === 0 ? 'idea_comb_0' : c.charge >= COMB.levels ? 'idea_comb_full' : 'idea_comb_some');
    if (c.charge === 0) return t('idea_paper_0');
    // the same bit as the comparison below (it is the first to jump), so the two lines always agree
    return featuredRatio() >= 1 ? t('idea_paper_lifted', { p: pow(STRENGTH_EXP) }) : t('idea_paper_far');
  }
  function magnetIdea() {
    const kind = currentForce();
    if (!mag.on) return t(mag.everOn ? 'idea_mag_off' : 'idea_mag_start');
    if (!kind) return shown.idea ?? t('idea_mag_attract'); // turning round: keep the last sentence
    if (kind === 'attract' && mag.fromFar) return t('idea_mag_far'); // pulled in from far away: the range
    return t(kind === 'attract' ? 'idea_mag_attract' : 'idea_mag_repel');
  }
  function readRow() {
    if (s.scene === 'comb') {
      const q = s.comb.charge;
      const pips = Array.from({ length: COMB.levels }, (_, i) => `<i class="${i < q ? 'on' : ''}"></i>`).join('');
      const wins = featuredRatio() >= 1;
      // in the hair the comb is far from the paper: no comparison yet
      const away = s.comb.place === 'hair';
      const rel = away ? '–' : wins ? '&gt;' : '&lt;';
      return `<span class="ef-charge"><span class="k">${t('charge')}</span><span class="ef-pips" aria-label="${N(q)} / ${N(COMB.levels)}">${pips}</span></span>
        <span class="ef-vs${away ? ' away' : ''}"><span class="ef-pull em">${t('pull_comb')}<small>${t('pull_comb_k')}</small></span><b class="ef-rel">${rel}</b><span class="ef-pull grav">${t('pull_earth')}<small>${t('pull_earth_k')}</small></span></span>`;
    }
    const kind = currentForce();
    const facing = facingPole(mag.orient);
    const like = facing === 'N';
    const verdict = !mag.on
      ? `<span class="ef-verdict off">${t('no_force')}</span>`
      : mag.flipping
        ? '<span class="ef-verdict">…</span>'
        : `<span class="ef-verdict">${t(like ? 'like_poles' : 'unlike_poles')}: <b>${t(kind === 'repel' ? 'repel' : 'attract')}</b></span>`;
    return `<span class="ef-poles"><span class="ef-end">${t('coil')} ${mag.on ? pole('N') : '<b class="ef-pole none">–</b>'}</span><i>⟷</i><span class="ef-end">${mag.flipping ? '<b class="ef-pole none">…</b>' : pole(facing)} ${t('magnet')}</span>${verdict}</span>`;
  }
  function refresh() {
    root.dataset.scene = s.scene;
    put('idea', el.idea, s.scene === 'comb' ? combIdea() : magnetIdea());
    put('read', el.read, readRow());
    el.flip.hidden = s.scene !== 'magnet';
    const c = s.comb;
    const at = c.place === 'travel' ? c.dest : c.place; // while it flies, the button already says what comes next
    const label = s.scene === 'magnet' ? (mag.on ? 'act_off' : 'act_on') : at === 'paper' ? 'act_again' : c.charge ? 'act_bring' : 'act_comb';
    put('act', el.act, t(label));
    stage.invalidate();
  }

  function snapshot() {
    const c = s.comb;
    const ratio = featuredRatio();
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
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.scene, snap.mode, snap.comb.charge, snap.comb.place, snap.comb.lifted, snap.comb.wins, snap.magnet]);
    if (k === lastEmitted) return;
    lastEmitted = k;
    emit('change', snap);
  }

  // ── labels in the picture ──────────────────────────────────────────────────
  const labels = createLabels({ stage, layer: ui.annoLayer, keepOff });
  /** Boxes (stage px) labels keep off: the corner buttons and the hint when it shows. */
  function keepOff() {
    const sr = ui.stage.getBoundingClientRect();
    return [ui.corner, ui.hint, note]
      .filter((n) => n.getBoundingClientRect().width && (n !== ui.hint || n.classList.contains('show')) && (n !== note || !note.hidden))
      .map((n) => {
        const r = n.getBoundingClientRect();
        return { l: r.left - sr.left - 6, t: r.top - sr.top - 6, r: r.right - sr.left + 6, b: r.bottom - sr.top + 6 };
      });
  }
  const corners = [];
  for (const x of [-COMB_SIZE.end, COMB_SIZE.end]) for (const y of [0, COMB_SIZE.top]) corners.push(new THREE.Vector3(x, y, 0));
  const pv = new THREE.Vector3();
  const toScreen = (p) => {
    pv.copy(p).project(camera);
    return { x: (pv.x * 0.5 + 0.5) * stage.width, y: (-pv.y * 0.5 + 0.5) * stage.height };
  };
  /** The comb on the screen (px box). */
  function combBox(pad = 4) {
    const b = { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
    for (const c of corners) {
      const q = toScreen(tmp.copy(c).applyMatrix4(comb.matrixWorld));
      b.l = Math.min(b.l, q.x - pad);
      b.r = Math.max(b.r, q.x + pad);
      b.t = Math.min(b.t, q.y - pad);
      b.b = Math.max(b.b, q.y + pad);
    }
    return b;
  }
  /** An arrow on the screen (px box round it). */
  function arrowBox(arrow, from, pad = 6) {
    if (!arrow.root.visible) return null;
    const a = toScreen(from);
    const b = toScreen(arrow.tip());
    return { l: Math.min(a.x, b.x) - pad, t: Math.min(a.y, b.y) - pad, r: Math.max(a.x, b.x) + pad, b: Math.max(a.y, b.y) + pad };
  }
  const edge = new THREE.Vector3();
  /** The other bits of paper on the screen (px boxes): the arrows' labels keep off them. */
  function bitBoxes() {
    const out = [];
    cs.bits.forEach((b, i) => {
      if (i === FEATURED) return;
      const c = toScreen(b.group.position);
      const r = Math.abs(toScreen(edge.copy(b.group.position).setX(b.group.position.x + b.size / 2)).x - c.x) + 2;
      out.push({ l: c.x - r, r: c.x + r, t: c.y - r, b: c.y + r });
    });
    return out;
  }
  const featuredAt = () => cs.bits[FEATURED].group.position;
  const PAPER_LABEL_AT = new THREE.Vector3(214, 0, 26);
  const COIL_LABEL_AT = new THREE.Vector3(COIL_X, 2, 18);
  const cartLabelAt = new THREE.Vector3();
  const upMid = new THREE.Vector3();
  const downMid = new THREE.Vector3();
  const RIGHT = [
    [16, 0, 0, 0.5],
    [16, -14, 0, 0.5],
    [16, -28, 0, 0.5],
    [16, 14, 0, 0.5],
    [-16, 0, 1, 0.5],
  ];
  function syncArrowLabels() {
    const showUp = upArrow.root.visible;
    const showDown = downArrow.root.visible;
    if (showDown) {
      downMid.copy(featuredAt());
      downMid.y -= W_ARROW * 0.55;
      labels.set('down', {
        text: t('pull_earth'),
        kind: 'callout',
        color: COLORS.grav,
        point: () => downMid,
        spots: [
          [16, 4, 0, 0.5],
          [16, 16, 0, 0.5],
          [16, 30, 0, 0.5],
          [16, -8, 0, 0.5],
          [-16, 4, 1, 0.5],
        ],
        priority: 1, // first: it has the least room (down by the bench); the comb's label then finds room above it
        avoid: () => [combBox(), arrowBox(upArrow, featuredAt()), ...bitBoxes()].filter(Boolean),
      });
    } else labels.remove('down');
    if (showUp) {
      const len = upArrow.tip().distanceTo(featuredAt());
      upMid.copy(featuredAt());
      upMid.y += Math.max(len * 0.6, 4);
      labels.set('up', {
        text: t('pull_comb'),
        kind: 'callout',
        color: COLORS.em,
        point: () => upMid,
        spots: RIGHT,
        priority: 2,
        avoid: () => [combBox(), arrowBox(downArrow, featuredAt()), ...bitBoxes()].filter(Boolean),
      });
    } else labels.remove('up');
  }
  const forceMid = new THREE.Vector3();
  function syncForceLabel(kind) {
    if (magArrow.root.visible && kind) {
      forceMid.set(COIL.x1 + mag.gap / 2, ARROW.y, ARROW.z); // right above the gap, where the two arrows meet or part
      labels.set('force', {
        text: t(kind),
        kind: 'callout',
        color: COLORS.em,
        point: () => forceMid,
        spots: [
          [0, -9, 0.5, 1],
          [0, -24, 0.5, 1],
        ],
        priority: 1,
        leader: false,
        avoid: () => [arrowBox(magArrow, magArrow.root.position, 3), arrowBox(coilArrow, coilArrow.root.position, 3)].filter(Boolean),
      });
    } else labels.remove('force');
  }
  /** The labels that belong to this scene and state (the arrows' and the force's follow by themselves). */
  function refreshLabels() {
    const quizzing = s.mode === 'quiz';
    for (const id of ['charge', 'hair', 'paper', 'coil', 'switch', 'cell', 'magnet', 'poleS', 'poleN', 'current']) labels.remove(id);
    note.hidden = s.scene !== 'magnet';
    if (s.scene === 'comb') {
      labels.remove('force');
      if (s.comb.charge > 0 && !quizzing)
        labels.set('charge', {
          text: t('lbl_charge'),
          kind: 'callout',
          color: COLORS.em,
          point: cs.points.discs,
          spots: [
            [0, -34, 0.5, 1],
            [-50, -34, 0.5, 1],
            [50, -34, 0.5, 1],
            [0, -54, 0.5, 1],
          ],
          optional: s.comb.place !== 'hair',
          priority: 4,
          avoid: () => [combBox(2)],
        });
      if (s.comb.place === 'hair' && !quizzing)
        labels.set('hair', {
          text: t('lbl_hair'),
          point: cs.points.hair,
          spots: [
            [-24, 18, 1, 0],
            [-30, 0, 1, 0.5],
            [0, 30, 0.5, 0],
          ],
          optional: true,
          priority: 8,
          avoid: () => [combBox()],
        });
      if (s.comb.place !== 'hair' && !lifted() && !quizzing)
        labels.set('paper', {
          text: t('lbl_paper'),
          point: () => PAPER_LABEL_AT,
          spots: [
            [-6, 22, 1, 0],
            [0, 26, 0.5, 0],
            [-20, 0, 1, 0.5],
          ],
          optional: true,
          priority: 9,
        });
    } else {
      labels.remove('up');
      labels.remove('down');
      // while the current flows the coil is a magnet: its ends are named under them (N faces the bar magnet)
      if (mag.on) {
        const below = (dx) => [
          [0, 12, 0.5, 0],
          [dx, 10, dx < 0 ? 1 : 0, 0],
        ];
        labels.set('poleS', { text: 'S', kind: 'pole', color: COLORS.south, point: () => ms.points.south, spots: below(-12), priority: 3 });
        labels.set('poleN', { text: 'N', kind: 'pole', color: COLORS.north, point: () => ms.points.north, spots: below(12), priority: 3 });
      }
      if (quizzing) return;
      const part = (id, key, point, spots) => labels.set(id, { text: t(key), point, spots, optional: true, priority: 7 });
      // while the switch is closed, the chevrons on the wires are named: the current
      if (mag.on)
        labels.set('current', {
          text: t('current_on'),
          kind: 'callout',
          color: '#b26a00',
          point: () => ms.points.cell,
          spots: [
            [0, -22, 0.5, 1],
            [-14, -16, 1, 1],
            [14, -16, 0, 1],
          ],
          optional: true,
          priority: 5,
        });
      part('coil', 'lbl_coil', () => COIL_LABEL_AT, [
        [0, mag.on ? 40 : 16, 0.5, 0],
        [-16, mag.on ? 40 : 14, 1, 0],
        [0, 16, 0.5, 0],
      ]);
      part('magnet', 'lbl_magnet', () => cartLabelAt.set(ms.cart.position.x, 2, 18), [
        [0, 16, 0.5, 0],
        [16, 14, 0, 0],
      ]);
      if (!mag.everOn) {
        part('switch', 'lbl_switch', () => ms.points.switch, [
          [0, -26, 0.5, 1],
          [22, -16, 0, 1],
        ]);
        part('cell', 'lbl_cell', () => ms.points.cell, [
          [0, -30, 0.5, 1],
          [-20, -24, 1, 1],
        ]);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  function viewDir(key) {
    const el = deg(ELEVATION[key] + (s.view === '3d' ? 12 : 0));
    const az = s.view === '3d' ? deg(32) : 0;
    return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  }
  /** What a camera view must show: points, some with a box round them on the screen (px from the point). */
  function contentOf(key) {
    const pts = [];
    const combAt = (pose) => {
      const m = new THREE.Matrix4().compose(V(pose.x, pose.y, 0), new THREE.Quaternion().setFromAxisAngle(Z, pose.rot), new THREE.Vector3(1, 1, 1));
      for (const c of corners) pts.push(c.clone().applyMatrix4(m));
    };
    if (key === 'hair') {
      for (let x = ARC.from; x <= ARC.to + 0.1; x += (ARC.to - ARC.from) / 4) combAt(hairPose(x));
      for (let x = HEAD.x - 80; x <= HEAD.x + 80; x += 20) pts.push(V(x, Math.max(HEAD.y + 50, hairTop(x))));
      const mid = hairPose((ARC.from + ARC.to) / 2);
      pts.push({ p: V(mid.x, mid.y + COMB_SIZE.top), box: [-80, -54, 80, 0] }); // room for the charge label
      // on a wide picture there is room for the face too, so the student is a person, not only hair
      if (stage.width > stage.height * 1.35) pts.push(...cs.points.face);
      return pts;
    }
    if (key === 'paper') {
      // the comb's right half (its left end may run off the picture), from where it comes down to where it holds
      // the bits up; the bit with the arrows, both arrows and their labels; the bits around it
      const cx = PAPER_X.start;
      for (const y of [stopHeight(COMB.levels) - 3, PAPER_H.start])
        for (const x of [0, COMB_SIZE.end]) for (const yy of [0, COMB_SIZE.top]) pts.push(V(cx + x, y + yy));
      for (const b of cs.bits) {
        const p = b.home.position;
        if (p.x > cx - 20) pts.push(V(p.x - b.size / 2, 0, p.z - b.size / 2), V(p.x + b.size / 2, 0, p.z + b.size / 2));
      }
      const f = cs.bits[FEATURED].home.position;
      pts.push(V(f.x, -W_ARROW - 3, f.z)); // the weight's arrow under the bit on the desk
      const hung = V(cx + cs.bits[FEATURED].cling.x, LIFT_HEIGHT + cs.bits[FEATURED].cling.y);
      pts.push(hung.clone().setY(hung.y + W_ARROW * MAX_RATIO + 2)); // the comb's arrow when the bit is held up
      pts.push({ p: V(f.x, 0, f.z), box: [8, -24, 150, 34] }); // the labels beside the arrows (16 px off, ~130 px wide)
      pts.push({ p: hung, box: [8, -40, 140, 20] });
      return pts;
    }
    // the magnets: the circuit in a row (cell, switch, coil), the track to the end block, the arrows and their label
    const { left, right } = ms.extent;
    pts.push(V(left, 0, 26), V(left, 22, -12), V(right, 0, 22), V(right, 24, -22));
    pts.push(V(COIL.x0, 2 * COIL.flange, -20), V(COIL_X, 0, 32)); // the coil, the wire along the front
    pts.push(V(COIL.x1 - 40, ARROW.y + 5, ARROW.z), V(COIL.x1 + MAG.gapMax + 40, ARROW.y + 5, ARROW.z)); // the arrows
    pts.push({ p: V(COIL.x1 + START_GAP / 2, ARROW.y, ARROW.z), box: [-45, -40, 45, 0] }); // their label
    pts.push({ p: V(COIL_X, 0, 20), box: [-70, 0, 70, 52] }, { p: V(magnetX(START_GAP), 0, 20), box: [-50, 0, 50, 36] });
    pts.push({ p: ms.points.cell, box: [-50, -46, 50, 0] }); // the current's or the cell's label
    return pts;
  }
  function boxOf(node, pad = 6) {
    if (!node || getComputedStyle(node).visibility === 'hidden') return null;
    const c = stage.canvas.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left - c.left - pad, right: r.right - c.left + pad, top: r.top - c.top - pad, bottom: r.bottom - c.top + pad };
  }
  /** A camera pose that shows the view's content as big as it can, clear of the corner buttons. */
  function poseFor(key) {
    const pts = contentOf(key).map((c) => (c.isVector3 ? { p: c, box: null } : c));
    const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
    const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const { p } of pts) {
      lo.min(p);
      hi.max(p);
    }
    const target = lo.clone().add(hi).multiplyScalar(0.5);
    const back = viewDir(key);
    const right = new THREE.Vector3().crossVectors(WORLD_UP, back).normalize();
    const up = new THREE.Vector3().crossVectors(back, right);
    const local = pts.map(({ p, box }) => {
      const q = p.clone().sub(target);
      return { x: q.dot(right), y: q.dot(up), z: q.dot(back), box };
    });
    const W = stage.width;
    const H = Math.max(stage.height, 120);
    note.hidden = s.scene !== 'magnet';
    const boxes = [boxOf(ui.corner), key === 'magnet' ? boxOf(note) : null].filter(Boolean);
    const tv = Math.tan(deg(camera.fov / 2));
    const th = tv * camera.aspect;
    const MARGIN = 14;
    const clear = (px, py) => {
      if (px < MARGIN || px > W - MARGIN || py < MARGIN || py > H - MARGIN) return false;
      return !boxes.some((r) => px > r.left && px < r.right && py > r.top && py < r.bottom);
    };
    // the picture may move sideways and down (sx, sy px) to make room for labels and the buttons
    const fits = (d, sx, sy) =>
      local.every(({ x, y, z, box }) => {
        const depth = d - z;
        if (depth < 20) return false;
        const px = W / 2 + (x / (depth * th)) * (W / 2) + sx;
        const py = H / 2 - (y / (depth * tv)) * (H / 2) + sy;
        if (!box) return clear(px, py);
        return (
          clear(px + box[0], py + box[1]) && clear(px + box[2], py + box[1]) && clear(px + box[0], py + box[3]) && clear(px + box[2], py + box[3])
        );
      });
    let best = null;
    for (let sy = 0; sy <= 64; sy += 8)
      for (let sx = -96; sx <= 96; sx += 12) {
        let a = 50;
        let b = 6000;
        if (!fits(b, sx, sy)) continue;
        for (let i = 0; i < 26; i++) {
          const mid = (a + b) / 2;
          if (fits(mid, sx, sy)) b = mid;
          else a = mid;
        }
        // a nearer camera wins; of two about as near, the one moved less
        const cost = b * (1 + (Math.abs(sx) + sy) * 0.0004);
        if (!best || cost < best.cost) best = { d: b, sx, sy, cost };
      }
    const d = (best?.d ?? 900) * 1.02;
    const t2 = target.addScaledVector(up, ((best?.sy ?? 0) / (H / 2)) * d * tv).addScaledVector(right, (-(best?.sx ?? 0) / (W / 2)) * d * th);
    return { target: t2, position: t2.clone().addScaledVector(back, d) };
  }
  const viewKey = () => (s.scene === 'magnet' ? 'magnet' : s.comb.place === 'hair' ? 'hair' : 'paper');
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
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(poseFor(viewKey()), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  // a turned phone: the picture is framed again at once (while the comb flies, already for where it is going)
  stage.onResize(() => {
    if (s.userMovedCamera) return;
    const key = s.scene === 'comb' && s.comb.place === 'travel' ? s.comb.dest : viewKey();
    flyTo(poseFor(key), 0);
  });

  // ── combing, bringing the comb to the paper, starting again ────────────────
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  /** Comb the hair a few times (about one charge level a pass): what the button does. */
  async function combAuto(passes = 3) {
    const my = ++run;
    coach?.objectUsed();
    const target = Math.min(COMB.levels, s.comb.charge + passes);
    for (let i = 0; i < 8 && s.comb.charge < target; i++) {
      const to = s.comb.hx < (ARC.from + ARC.to) / 2 ? ARC.to : ARC.from;
      const from = s.comb.hx;
      const ok = await tweener.animate({ key: 'comb', duration: 0.42, ease: ease.inOutSine, onUpdate: (k) => rubTo(from + (to - from) * k, target) })
        .finished;
      if (!ok || my !== run) return;
    }
  }
  /**
   * Fly the comb from the hair to over the paper, lower it slowly until the bits jump (a little inside its reach),
   * then lift it up again with the bits hanging from it: "কাগজকে আকর্ষণ করে তুলে নাও". With no charge it comes
   * right down and nothing happens. It stops as soon as the student takes the comb.
   */
  async function bring({ descend = true } = {}) {
    if (s.comb.place !== 'hair') return;
    const my = ++run;
    coach?.objectUsed();
    tweener.cancel('comb');
    s.comb.place = 'travel';
    s.comb.dest = 'paper';
    s.comb.cx = PAPER_X.start;
    s.comb.h = PAPER_H.start;
    const a = hairPose(s.comb.hx);
    const b = paperPose();
    s.userMovedCamera = false;
    flyTo(poseFor('paper'), 1.0);
    refresh();
    refreshLabels();
    emitChange();
    const ok = await tweener.animate({
      key: 'comb',
      duration: 1.0,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        const lift = Math.sin(Math.PI * k) * 60;
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
    if (!(await lower(stopHeight(q), q ? 1.9 : 2.4, my)) || !q) return;
    await wait(350);
    if (my !== run) return;
    await lower(LIFT_HEIGHT, 1.1, my); // up it goes, the bits with it
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
  /** Start again: the bits fall back, the comb (with no charge now) goes back to the hair. */
  async function again({ animate = true } = {}) {
    const my = ++run;
    tweener.cancel('comb');
    if (!animate) {
      dropBits({ instant: true });
      setCharge(0);
      s.comb.rubbed = 0;
      s.comb.place = s.comb.dest = 'hair';
      s.comb.hx = (ARC.from + ARC.to) / 2;
      placeComb(hairPose(s.comb.hx));
      refresh();
      refreshLabels();
      emitChange();
      return;
    }
    dropBits();
    s.comb.place = 'travel';
    s.comb.dest = 'hair';
    setCharge(0); // starting again: a comb with no charge
    refresh();
    refreshLabels();
    await wait(450);
    if (my !== run) return;
    const a = { x: comb.position.x, y: comb.position.y, rot: comb.rotation.z };
    const hx = (ARC.from + ARC.to) / 2;
    const b = hairPose(hx);
    s.userMovedCamera = false;
    flyTo(poseFor('hair'), 1.0);
    const ok = await tweener.animate({
      key: 'comb',
      duration: 1.0,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        const lift = Math.sin(Math.PI * k) * 60;
        placeComb({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k + lift, rot: b.rot * k });
        stage.invalidate();
      },
    }).finished;
    if (!ok || my !== run) return;
    s.comb.place = s.comb.dest = 'hair';
    s.comb.hx = hx;
    s.comb.rubbed = 0;
    placeComb(hairPose(hx));
    refresh();
    refreshLabels();
    emitChange();
  }
  /**
   * The comb straight to a place (no animation): over the paper at height h, or, with no h, where bring() ends
   * (charged: the bits lifted and held up in the air; no charge: right down over them); or back in the hair.
   */
  function combAt(place, { h = null, cx = PAPER_X.start } = {}) {
    ++run;
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
    if (!s.userMovedCamera && s.scene === 'comb') flyTo(poseFor(viewKey()), 0);
    refresh();
    refreshLabels();
    emitChange();
  }

  function mainAction() {
    if (s.locked || s.mode === 'quiz') return lockedNudge();
    const t0 = now();
    if (t0 - lastMain < DOUBLE_TAP) return; // a double tap must not undo the first
    lastMain = t0;
    if (s.scene === 'magnet') return setSwitch(!mag.on);
    const c = s.comb;
    if (c.place === 'hair') return c.charge ? bring() : combAuto();
    if (c.place === 'paper') return again();
  }

  // ── switching examples ──────────────────────────────────────────────────────
  function setScene(name, { animate = true } = {}) {
    const next = name === 'magnet' ? 'magnet' : 'comb';
    ++run;
    tweener.cancel('comb');
    // a comb in flight lands where it was going
    if (s.comb.place === 'travel') combAt(s.comb.dest);
    mag.dragging = false;
    drag = null;
    s.scene = next;
    cs.root.visible = next === 'comb';
    ms.root.visible = next === 'magnet';
    labels.clear();
    hideHint();
    s.userMovedCamera = false;
    aimSun();
    flyTo(poseFor(viewKey()), animate ? 0.7 : 0);
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
  /** What a finger at this canvas point takes: 'comb', 'magnet', 'switch' or null. */
  function pick(p) {
    rayAt(p);
    if (s.scene === 'comb') {
      if (s.comb.place === 'travel') return null;
      if (raycaster.intersectObject(cs.combHit, false).length) return 'comb';
      // a touch a little off the comb still takes it
      const b = combBox(0);
      return p.x > b.l - 24 && p.x < b.r + 24 && p.y > b.t - 24 && p.y < b.b + 24 ? 'comb' : null;
    }
    const hit = raycaster.intersectObjects(ms.hits, false)[0];
    return hit ? hit.object.userData.part : null;
  }
  /** Where the finger is on the plane of the comb and the magnets (z = 0), in mm. */
  function planeAt(p) {
    rayAt(p);
    return raycaster.ray.intersectPlane(plane, hitP) ? hitP.clone() : null;
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const p = canvasPoint(e);
      const part = pick(p);
      if (!part) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const at = planeAt(p);
      if (!at) return;
      if (part === 'switch') return setSwitch(!mag.on); // like a real switch, it acts as the finger goes down
      ++run; // the student takes over: a running animation of the comb stops
      tweener.cancel('comb');
      if (part === 'comb') {
        coach?.objectUsed();
        drag = { id: e.pointerId, part, dx: comb.position.x - at.x, dy: comb.position.y - at.y };
      } else {
        drag = { id: e.pointerId, part, dx: ms.cart.position.x - at.x, x0: p.x, y0: p.y, moved: false };
      }
      try {
        ui.canvasHost.setPointerCapture(e.pointerId); // keep the drag when the finger leaves the part
      } catch {}
    },
    true,
  );
  function dragTo(e) {
    const p = canvasPoint(e);
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
    if (!drag.moved && Math.hypot(p.x - drag.x0, p.y - drag.y0) < 7) return;
    drag.moved = true;
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
      ui.canvasHost.style.cursor = pick(canvasPoint(e)) ? (s.locked ? 'not-allowed' : 'grab') : '';
    }
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    try {
      ui.canvasHost.releasePointerCapture(e.pointerId);
    } catch {}
    if (d.part === 'magnet') {
      mag.dragging = false;
      if (!d.moved && e.type === 'pointerup')
        flip(); // a tap turns the magnet round
      else noteStart();
      refresh();
    }
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
  /** A question whose answers are i18n keys: the right one first in `keys`. */
  function wordChoices(keys, vars = {}) {
    const order = shuffle(keys.map((_, i) => i));
    return {
      choices: [0, 1, 2, 3],
      expected: order.indexOf(0),
      tolerance: 0.5,
      label: (j) => opt(typeof keys[order[j]] === 'function' ? keys[order[j]]() : t(keys[order[j]], vars)),
      order,
    };
  }
  /** The comb set up for a question: its charge, over the paper at a height, the arrows hidden. */
  function combQuestion(charge, h) {
    if (s.scene !== 'comb') setScene('comb');
    dropBits({ instant: true });
    setCharge(charge);
    combAt('paper', { h });
    if (!s.userMovedCamera) flyTo(poseFor('paper'), 0.7);
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
    if (!s.userMovedCamera) flyTo(poseFor('magnet'), 0.7);
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
    hooks: {
      enter() {
        ++run;
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
        if (kind === 'rise') {
          combQuestion(4);
          say(t('q_rise'));
          const c = wordChoices(['opt_rise_right', 'opt_rise_mass', 'opt_rise_nograv', 'opt_rise_air']);
          question = { kind, ...c };
          return { ...c, meta: { kind } };
        }
        if (kind === 'dry') {
          combQuestion(0, 60);
          say(t('q_dry'));
          const c = wordChoices(['opt_dry_right', 'opt_dry_jump', 'opt_dry_away', 'opt_dry_small']);
          question = { kind, ...c };
          return { ...c, meta: { kind } };
        }
        if (kind === 'poles') {
          const facing = Math.random() < 0.5 ? 'N' : 'S';
          magnetQuestion({ on: true, facing, gap: 34 });
          say(t('q_poles'));
          const like = facing === 'N';
          const c = wordChoices(
            like
              ? ['opt_like_rep', 'opt_like_att', 'opt_unlike_att', 'opt_unlike_rep']
              : ['opt_unlike_att', 'opt_unlike_rep', 'opt_like_rep', 'opt_like_att'],
          );
          question = { kind, facing, ...c };
          return { ...c, meta: { kind, facing } };
        }
        if (kind === 'off') {
          magnetQuestion({ on: false, facing: Math.random() < 0.5 ? 'N' : 'S', gap: 22 });
          say(t('q_off'));
          const c = wordChoices(['opt_off_right', 'opt_off_always', 'opt_off_copper', 'opt_off_repel']);
          question = { kind, ...c };
          return { ...c, meta: { kind } };
        }
        if (kind === 'strength') {
          combQuestion(5);
          say(t('q_strength'));
          const em = t('pull_comb_k');
          const grav = t('pull_earth_k');
          const c = wordChoices([
            () => t('opt_str', { f: em, p: pow(STRENGTH_EXP) }),
            () => t('opt_str', { f: grav, p: pow(STRENGTH_EXP) }),
            () => t('opt_str', { f: em, p: STRENGTH_EXP }),
            () => t('opt_str', { f: grav, p: STRENGTH_EXP }),
          ]);
          question = { kind, ...c };
          return { ...c, meta: { kind } };
        }
        // the range, from the picture: the switch on, the magnet at the far end of the track (unlike poles facing);
        // is the coil still pulling it? (its arrows show after the answer, and the magnet rolls in)
        magnetQuestion({ on: true, facing: 'S', gap: MAG.gapMax });
        say(t('q_range'));
        const c = wordChoices(['opt_far_right', 'opt_far_zero', 'opt_far_touch', 'opt_far_more']);
        question = { kind, ...c };
        return { ...c, meta: { kind } };
      },
      reveal() {
        const q = question;
        const picked = Number(ui.$('.pvc-q-options .pvc-opt.wrong')?.dataset.q ?? -1);
        const mistake = picked >= 0 ? q.order[picked] : -1; // which wrong answer (1–3), or -1
        const note = (key, vars) => (mistake > 0 && t(`${key}_${mistake}`) !== `${key}_${mistake}` ? ` ${t(`${key}_${mistake}`, vars)}` : '');
        const my = ++run;
        if (q.kind === 'rise') {
          s.showArrows = true; // now the two pulls are shown
          return t('why_rise') + note('mis_rise');
        }
        if (q.kind === 'dry') {
          s.showArrows = true;
          lower(stopHeight(0), 1.6, my); // down it comes: nothing jumps
          return t('why_dry') + note('mis_dry');
        }
        if (q.kind === 'poles') {
          mag.hold = false;
          s.showArrows = true;
          return (q.facing === 'N' ? t('why_poles_rep', { p: 'N' }) : t('why_poles_att', { a: 'N', b: 'S' })) + note('mis_poles');
        }
        if (q.kind === 'off') {
          mag.hold = false;
          // then the switch goes on: now it is a magnet again
          wait(1400).then(() => {
            if (my !== run || s.mode !== 'quiz') return;
            s.showArrows = true;
            setSwitch(true);
          });
          return t('why_off') + note('mis_off');
        }
        // no arrows here: their 2 : 1 is this comb and this paper, not the 10^36 of the forces themselves
        if (q.kind === 'strength') return t('why_strength', { p: pow(STRENGTH_EXP), one: 1, n: STRENGTH_EXP }); // long enough already: no note
        mag.hold = false;
        s.showArrows = true;
        return t('why_range') + note('mis_range');
      },
      done() {
        s.locked = false;
      },
    },
  });
  /** Back from the test: the comb at the hair with no charge, the magnets as at the start. */
  function restoreLearn() {
    dropBits({ instant: true });
    setCharge(0);
    tweener.cancel('comb');
    s.comb.place = s.comb.dest = 'hair';
    s.comb.hx = (ARC.from + ARC.to) / 2;
    placeComb(hairPose(s.comb.hx));
    tweener.cancel('flip');
    mag.flipping = false;
    ms.magnet.position.y = 19.5;
    mag.orient = 'SN';
    ms.magnet.rotation.y = 0;
    setSwitch(false, { animate: false });
    mag.everOn = false;
    placeMagnet(START_GAP);
    setScene('comb');
  }

  // ── first-use pointer: on the comb in the hair ─────────────────────────────
  let coach = null;
  if (o.coach) {
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_comb',
        candidates: () => {
          if (s.scene !== 'comb' || s.comb.place !== 'hair') return [];
          const c = toScreen(tmp.set(0, 22, 0).applyMatrix4(comb.matrixWorld));
          const l = toScreen(tmp.set(-30, 22, 0).applyMatrix4(comb.matrixWorld));
          return [c, l];
        },
        grabbable: (p) => pick(p) === 'comb',
        // the comb moves a little along the hair and back (this does not charge it)
        async demo(alive) {
          const x0 = s.comb.hx;
          s.comb.demo = true;
          try {
            for (let i = 0; i < 2 && alive(); i++) {
              for (const dx of [16, -16, 0]) {
                const from = s.comb.hx;
                if (
                  !(await tweener.animate({ key: 'comb', duration: 0.35, ease: ease.inOutSine, onUpdate: (k) => rubTo(from + (x0 + dx - from) * k) })
                    .finished) ||
                  !alive()
                )
                  return;
              }
              await wait(500);
            }
          } finally {
            s.comb.demo = false;
          }
        },
        cancel: () => {
          tweener.cancel('comb');
          s.comb.demo = false;
        },
      },
    });
  }

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
    for (const b of ui.$$('[data-scene]')) {
      const on = b.dataset.scene === s.scene;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.scene && b.dataset.scene !== s.scene && s.mode !== 'quiz') setScene(b.dataset.scene);
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
      case 'main':
        if (e.detail === 0) mainAction(); // the keyboard; a finger or the mouse acted on pointerdown
        break;
      case 'flip':
        if (s.locked) lockedNudge();
        else flip();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // the main button acts as the finger goes down (the switch clicks then, like a real one)
  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !(/** @type {Element} */ (e.target).closest('[data-act="main"]'))) return;
    audio.unlock();
    mainAction();
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const learning = s.mode !== 'quiz'; // in the test the picture belongs to the question
    const c = s.comb;
    if ((k === ' ' || k === 'enter') && !target.closest('button')) mainAction();
    else if (k === '1' && learning) setScene('comb');
    else if (k === '2' && learning) setScene('magnet');
    else if ((k === 'arrowleft' || k === 'arrowright') && learning) {
      const dir = k === 'arrowright' ? 1 : -1;
      ++run;
      tweener.cancel('comb');
      if (s.scene === 'magnet') {
        mag.v = 0;
        placeMagnet(mag.gap + dir * 5);
      } else if (c.place === 'hair') {
        coach?.objectUsed();
        rubTo(c.hx + dir * 10);
      } else if (c.place === 'paper') {
        c.cx = Math.min(Math.max(c.cx + dir * 4, PAPER_X.min), PAPER_X.max);
        placeComb(paperPose());
        stage.invalidate();
      }
    } else if ((k === 'arrowup' || k === 'arrowdown') && learning && s.scene === 'comb' && c.place === 'paper') {
      ++run;
      tweener.cancel('comb');
      c.h = Math.min(Math.max(c.h + (k === 'arrowup' ? 4 : -4), PAPER_H.min), PAPER_H.max);
      placeComb(paperPose());
      stage.invalidate();
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
    else coach?.start(1200);
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
     * down) and height (mm of its teeth above the desk, over the paper); again (true: start again); on (the
     * switch), facing ('N' | 'S': the magnet's end facing the coil), gap (mm between them; the force then acts);
     * view; animate: false jumps (the cart goes straight to where it would stop).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.scene && p.scene !== s.scene) setScene(p.scene, { animate });
      if (p.again) await again({ animate });
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
        else setCharge(s.comb.charge + Number(p.strokes));
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
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    // the example shown: the student, the comb and the paper; or the coil, cell, switch and magnet (no arrows or tags)
    exportRoot: () => (s.scene === 'comb' ? cs.root : ms.root),
  };
}
