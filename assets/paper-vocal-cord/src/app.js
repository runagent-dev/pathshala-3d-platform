// A paper vocal cord (book pages 198–199, topic 7.3 শব্দ তরঙ্গ, চিত্র ৭.১০ and its নিজে করো), student view. A page
// of an exercise book folded in half and held by a small clip; at the fold two flaps were cut. "ফুঁ দাও": the blown
// air flows in, the two flaps open and shut like the two vocal cords (slowed 100 times), and in front of the slot the
// air particles bunch into compressions (darker teal shells) and thin out into rarefactions (lighter) that travel away while
// its particles only swing in place: a sound wave, with its λ marked (and, where the panel has room, a live graph). One green particle shows it only swings in place. The
// row of words cuts the flaps long, medium or short: the frequency (about 160, 310, 640 Hz, an honest cantilever
// model) and the voice (মোটা … তীক্ষ্ণ) change, λ shrinks as f rises, and the rule grows to the book's sentence on
// men's and women's voices. With sound on, the buzz plays at the real frequency. Then a five-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { boldArrow } from './arrows.js';
import { createBracket } from './bracket.js';
import { CLIP, createClip } from './clip.js';
import { createGraph } from './graph.js';
import { SHEET, SLOT_Y, createPaper } from './paper.js';
import { FAN, ORIGIN, createAir } from './air.js';
import { createBuzz } from './sound.js';
import { backdropTexture, createBench } from './setting.js';
import { CUT_IDS, CUTS, SLOW, V_SOUND, drawnWave, opening, shownFrequency, voiceOf, wavelength } from './reading.js';

export const DEFAULTS = {
  cut: 'mid',
  blow: false,
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { lambda: '#e8590c', lambdaText: '#c2410c', ink: '#1d2733', green: '#237a35', blow: '#1c6fd9', blowText: '#1864ab' };
/** One breath (s, as the picture runs). */
const BREATH = 8;
/** How long the blowing takes to start and to stop (s). */
const RAMP = 0.3;
const DOUBLE_TAP = 420; // ms
/** The top margin is small: only the fan and the arrow reach up, and both stay left of the corner button. */
const MARGIN = { top: 12, bottom: 8, side: 8 };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
/**
 * The view: close and low, a gentle three-quarter view of the folded strip with its spine (the crease) toward the
 * student, turned 18° round and seen 14° from above, so both halves show and the two flaps stand side by side as two
 * paper tongues with the slit between them, the clip under the paper on the bench. The open back of the fold, where the
 * breath goes in, is behind the paper on the upper left; the sound fills the space to the right of the slot.
 */
const DIR = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(76), THREE.MathUtils.degToRad(72));
/** The fan of sound lies in the upright plane through the slot that faces the camera: its "right" and up. */
const AXIS = new THREE.Vector3(DIR.z, 0, -DIR.x).normalize();
const PLANE = V(0, 1, 0);
/**
 * The λ bracket: along a ray from the slot, a little up and to the right (above the bead), from one compression centre
 * to the next (it rides with the wave and starts again one λ back each period); its label stays put beside the far end
 * of its reach.
 */
const LAMBDA_AT = { turn: THREE.MathUtils.degToRad(14) };
const LAMBDA_DIR = AXIS.clone().multiplyScalar(Math.cos(LAMBDA_AT.turn)).addScaledVector(PLANE, Math.sin(LAMBDA_AT.turn));
/** The breath comes from behind the paper, above the open back of the fold, and goes down into it. */
const BLOW_FROM = V(-18, SLOT_Y + 7.6, 0);
const BLOW_TO = V(-9, SLOT_Y + 4.4, 0);
/** How far the wave reaches from the slot (mm): at least this on a wide stage, and on a squarer one. */
const REACH = { wide: 31, square: 22 };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'pv');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'cuts', results: true, items: CUT_IDS.map((id) => ({ id, label: `cut_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the colour key of the air and the honest note, one quiet line under the result
  const key = document.createElement('p');
  key.className = 'pv-key';
  key.innerHTML = t('key_line', { k: N(SLOW) });
  $('.pvc-outcome').after(key);
  // where the panel has room (800 × 500, 1280 × 800): the live pressure–distance graph under the rule
  const graph = createGraph($('.pvc-rule'), t);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 4, far: 4000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  // the student may turn the view a fair way round the start pose, never under the paper or behind it
  const polar = Math.acos(DIR.y);
  const az = Math.atan2(DIR.x, DIR.z);
  controls.minPolarAngle = Math.max(0.15, polar - 0.6);
  controls.maxPolarAngle = Math.min(1.62, polar + 0.6);
  controls.minAzimuthAngle = az - 0.9;
  controls.maxAzimuthAngle = az + 0.9;

  if (o.bg !== 'transparent') scene.background = backdropTexture();
  scene.add(new THREE.HemisphereLight('#fff3e6', '#7a5440', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e4', 2.3);
  sun.position.set(160, 150, 40);
  sun.target.position.set(-10, -5, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#dce6ff', 0.5);
  fill.position.set(-120, 40, 160);
  scene.add(fill);
  // a warm light from behind the paper: it lights the far half's inside and makes the thin flaps glow a little
  const rim = new THREE.DirectionalLight('#ffe6c8', 0.9);
  rim.position.set(-140, 90, -120);
  scene.add(rim);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.15;
    sun.shadow.radius = 3;
  }
  // fitted round the paper and the clip (the only things that cast shadows)
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 170, far: 290 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.updateMatrixWorld();

  const paper = createPaper();
  scene.add(paper.root);
  // the clip grips the paper's bottom edge, mouth up, its spine on the bench: the front jaw on the crease, the back jaw
  // across the two halves at the clip's ends, so the foot of the V is inside the jaws
  const clip = createClip({ top: -SHEET.H / 2 + CLIP.bite, front: SHEET.T * 1.2, back: -(CLIP.width / 2 + 0.2) / Math.tan(SHEET.alpha) - SHEET.T });
  scene.add(clip.root);
  const benchY = clip.bottom;
  if (o.bg !== 'transparent') scene.add(createBench(benchY));
  const air = createAir(AXIS, PLANE);
  scene.add(air.root);
  // λ: a bracket drawn over the picture between two compression centres (screen space, so it never foreshortens)
  const lamBracket = createBracket(ui.annoLayer, COLORS.lambda);
  // the breath: a slim outlined arrow coming in toward the open back of the fold, along its middle
  const blowArrow = boldArrow('Breath', COLORS.blow, 0.3);
  /** The breath's arrow ends at the open back of the fold, on the way to the slot. */
  const BLOW_LEN = BLOW_FROM.distanceTo(BLOW_TO);
  const BLOW_DIR = BLOW_TO.clone().sub(BLOW_FROM).normalize();
  const blowFrom = () => BLOW_FROM.clone();
  scene.add(blowArrow.root);

  // a big invisible target round the fold: a tap on the paper blows
  const hit = new THREE.Mesh(new THREE.BoxGeometry(30, SHEET.H + 4, 44), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(-8, 0, 0);
  hit.userData.noExport = true;
  scene.add(hit);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const buzz = createBuzz(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    mode: 'explore',
    locked: false,
    cut: CUTS[o.cut] ? o.cut : 'mid',
    tried: /** @type {Set<string>} */ (new Set()),
    clock: 0, // the picture's own time (s), slowed
    blows: /** @type {{ a: number, b: number }[]} */ ([]),
    breath: BREATH,
    userMovedCamera: false,
    show: { flap: true, lambda: true, bead: true, blow: true },
    run: 0,
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const blowing = () => s.blows.length > 0 && s.blows[s.blows.length - 1].b === Number.POSITIVE_INFINITY;
  const freq = () => shownFrequency(s.cut);
  let wave = drawnWave(freq());

  /** How strongly the flaps were vibrating at the picture's time τ (0 … 1). */
  function on(tau) {
    let e = 0;
    for (const { a, b } of s.blows) {
      if (tau <= a || tau >= b + RAMP) continue;
      const up = Math.min(1, (tau - a) / RAMP);
      const down = b === Number.POSITIVE_INFINITY ? 1 : Math.min(1, Math.max(0, (b + RAMP - tau) / RAMP));
      e = Math.max(e, Math.min(up, down));
    }
    return e;
  }
  /** Something still moves: the flaps, or the last wave still crossing the picture. */
  function moving() {
    if (blowing()) return true;
    const last = s.blows[s.blows.length - 1];
    return Boolean(last) && s.clock < last.b + RAMP + reach().end / wave.speed + 0.2;
  }

  /**
   * Where the wave starts and ends along the λ bracket's ray and the axis (mm): `flap` how far the far flap reaches
   * from the slot, `start` just past it, `end` so that two wavelengths fit after the start (the bracket's far end rides
   * up to start + 2λ), further where the stage is wide.
   */
  function reach() {
    const flap = paper.halves[1].u.dot(AXIS) * CUTS[s.cut].L + 0.4;
    const start = (flap + 1) / Math.cos(LAMBDA_AT.turn);
    const end = Math.max(start + 2.05 * wave.lambda, stage.width > 1.25 * stage.height ? REACH.wide : REACH.square);
    return { flap, start, end: Math.min(FAN.r1, end) };
  }

  // ── the scene from the state ────────────────────────────────────────────────
  const lamA = V();
  const lamB = V();
  const SA = { x: 0, y: 0 };
  const SB = { x: 0, y: 0 };
  let breathDt = 0;
  /** Keeps the arrows a few pixels thick however near the camera is: mm per pixel at the target. */
  function thickness() {
    const mmPerPx =
      (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, stage.height);
    blowArrow.scale((1.5 * mmPerPx) / 0.3);
  }
  function syncScene() {
    thickness();
    const e = on(s.clock);
    const open = opening(wave.omega * s.clock) * e;
    paper.setOpen(open);
    paper.setGhost(e);
    air.update(s.clock, wave, on);
    air.updateBreath(breathDt, e, open);
    breathDt = 0;
    if (e > 0.02 && s.show.blow) {
      blowArrow.set(BLOW_FROM, BLOW_DIR, BLOW_LEN);
      blowArrow.setOpacity(Math.min(1, e * 1.3));
    } else blowArrow.hide();
    // λ: from a compression centre to the next one, once the wave fills that stretch
    const lam = wave.lambda;
    const r0 = reach().start;
    const rc = r0 + ((((wave.speed * s.clock - lam / 2 - r0) % lam) + lam) % lam);
    const filled = on(s.clock - (rc + lam) / wave.speed) > 0.6 && on(s.clock - rc / wave.speed) > 0.6;
    if (filled && s.show.lambda) {
      lamA.copy(ORIGIN).addScaledVector(LAMBDA_DIR, rc);
      lamB.copy(lamA).addScaledVector(LAMBDA_DIR, lam);
      lamBracket.set(toScreen(lamA, SA), toScreen(lamB, SB));
    } else lamBracket.hide();
    // the green particle shows once the wave reaches it (before, the air is drawn only where the wave is)
    const beadOn = s.show.bead && on(s.clock - air.followR / wave.speed) > 0.01;
    air.bead.visible = beadOn;
    air.mark.visible = beadOn;
    graph.draw(s.clock, wave, on, wavelength(freq()), N);
    stage.invalidate();
  }

  let wasMoving = false;
  stage.addTicker((dt) => {
    s.clock += dt;
    breathDt = dt;
    const last = s.blows[s.blows.length - 1];
    if (last && last.b === Number.POSITIVE_INFINITY && s.clock - last.a >= s.breath) stopBlow(false);
    if (!moving() && !wasMoving) return false;
    wasMoving = moving();
    syncScene();
    syncLabels();
    if (!wasMoving) refresh();
    return true;
  });

  // ── blowing ─────────────────────────────────────────────────────────────────
  function startBlow({ steady = false } = {}) {
    if (blowing()) return;
    s.blows = s.blows.filter((x) => s.clock < x.b + RAMP + FAN.r1 / wave.speed + 0.5).slice(-2);
    // steady: as if blowing for a while already (the whole fan filled), for the book, the poster and the test. The
    // picture's clock is moved on to a moment that has the flaps open widest 1.6 s later: the exports and pictures
    // wait 1.5 s after their setup, and the bridge call itself takes 0.1 s, so the stills catch the vocal cords open
    // (the phase is arbitrary otherwise).
    if (steady) {
      const T = 1 / wave.fShow;
      s.clock += (((0.5 * T - 1.6 - s.clock) % T) + T) % T;
    }
    s.blows.push({ a: steady ? s.clock - 30 : s.clock, b: Number.POSITIVE_INFINITY });
    s.tried.add(s.cut);
    wasMoving = true;
    buzz.start(freq());
    syncScene();
    refresh();
    emitChange();
  }
  function stopBlow(user = true) {
    const last = s.blows[s.blows.length - 1];
    if (!last || last.b !== Number.POSITIVE_INFINITY) return;
    last.b = s.clock;
    buzz.stop();
    if (user) lastAct = now();
    refresh();
    emitChange();
  }
  /** Air at rest, at once (a new cut, the test, reset). */
  function still() {
    s.blows = [];
    buzz.stop();
    syncScene();
  }
  function chooseCut(id, { blow = false, steady = false } = {}) {
    if (!CUTS[id]) return;
    const changed = id !== s.cut;
    if (changed) {
      still();
      s.cut = id;
      wave = drawnWave(freq());
      paper.setCut(CUTS[id].L);
      setReach();
      if (!s.userMovedCamera) flyTo(viewPose(), 0.6);
    }
    if (blow) startBlow({ steady });
    syncScene();
    refresh();
    emitChange();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  /** What the action does next: blow this cut, try the next one, or stop. */
  function plan() {
    if (blowing()) return { label: 'act_stop', step: '', cut: s.cut, icon: ICONS.pause };
    const n = s.tried.size;
    if (!s.tried.has(s.cut)) return { label: 'act_blow', step: n + 1, cut: s.cut };
    const order = ['mid', 'short', 'long'];
    const next = order.find((id) => !s.tried.has(id));
    if (next) return { label: 'act_blow_cut', step: n + 1, cut: next };
    return { label: 'act_again', step: '', cut: s.cut };
  }
  const voiceWord = (f) => t(`voice_${voiceOf(f)}`);
  function ruleKey() {
    const n = s.tried.size;
    if (n === 0) return 'rule_0';
    if (n === 1) return 'rule_1';
    if (n === 2) return 'rule_2';
    return 'rule_3';
  }
  function refresh() {
    sheet.choose(s.cut);
    for (const id of CUT_IDS) sheet.result(id, s.tried.has(id) ? t('res_f', { f: N(shownFrequency(id)) }) : '');
    const p = plan();
    sheet.next(p.cut !== s.cut ? p.cut : null);
    const f = freq();
    const heard = s.tried.has(s.cut) && (blowing() || moving() || s.blows.length > 0);
    sheet.outcome(heard ? t('out_f', { f: N(f), voice: voiceWord(f) }) : t('out_idle'));
    sheet.rule(t(ruleKey()));
    root.dataset.wave = heard ? 'on' : 'off';
    if (action) {
      action.set({
        step: p.step,
        label: p.label === 'act_blow_cut' ? () => t('act_blow_cut', { cut: t(`cutname_${p.cut}`) }) : p.label,
        icon: p.icon || ICONS.hand,
        enabled: true,
      });
      if (p.step !== '' && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  const A0 = { x: 0, y: 0 };
  const A1 = { x: 0, y: 0 };
  /** The flaps and the slot (both flaps at their widest swing): no label ever sits on them. */
  const fb = new THREE.Box3();
  const fbTmp = new THREE.Box3();
  function flapsBox3() {
    fb.setFromObject(paper.halves[0].ghost, true).union(fbTmp.setFromObject(paper.halves[1].ghost, true));
    return fb.union(fbTmp.setFromObject(paper.flaps[0], true)).union(fbTmp.setFromObject(paper.flaps[1], true));
  }
  const flapBox = () => {
    const b = flapsBox3();
    let l = Infinity;
    let tp = Infinity;
    let r = -Infinity;
    let bt = -Infinity;
    for (const x of [b.min.x, b.max.x])
      for (const y of [b.min.y, b.max.y])
        for (const z of [b.min.z, b.max.z]) {
          toScreen(V(x, y, z), A0);
          l = Math.min(l, A0.x);
          r = Math.max(r, A0.x);
          tp = Math.min(tp, A0.y);
          bt = Math.max(bt, A0.y);
        }
    return { left: l - 3, top: tp - 3, right: r + 3, bottom: bt + 3 };
  };
  const arrowBox = (a) => {
    if (!a.visible) return null;
    toScreen(a.root.position, A0);
    toScreen(a.tip, A1);
    return { left: Math.min(A0.x, A1.x) - 8, top: Math.min(A0.y, A1.y) - 8, right: Math.max(A0.x, A1.x) + 8, bottom: Math.max(A0.y, A1.y) + 8 };
  };
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, flapBox, () => arrowBox(blowArrow), () => lamBracket.box(), () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const labelState = new Map();
  // the label points at the near flap (its outer face is toward the camera), near its top
  const flapPoint = () =>
    paper
      .edgePoint(1, V())
      .lerp(paper.hingePoint(1, V()), 0.5)
      .setY(SHEET.H / 2 - 3.5);
  function wantLabels() {
    const want = new Map();
    if (s.show.flap)
      want.set('flap', {
        text: t('lbl_flap'),
        point: flapPoint,
        spots: [spot(-40, -34), spot(-60, -10), spot(-20, -44), spot(-60, 20)],
        color: COLORS.ink,
      });
    if (on(s.clock) > 0.02 && s.show.blow)
      want.set('blow', {
        text: t('lbl_blow'),
        // at the arrow's tail, below it, never on the shaft
        point: () => blowFrom(),
        spots: [spot(34, -6), spot(-30, -6), spot(0, 22), spot(26, 16)],
        color: COLORS.blowText,
      });
    if (lamBracket.visible)
      want.set('lambda', {
        text: t('lbl_lambda', { l: N(wavelength(freq())) }),
        // beside the far half of the bracket's reach (it rides with the wave, its far end between r + λ and r + 2λ),
        // above the ray: never over the bracket (which the labels also avoid)
        point: () => ORIGIN.clone().addScaledVector(LAMBDA_DIR, reach().start + 1.6 * wave.lambda),
        spots: [spot(-6, -30), spot(-24, -30), spot(10, -32), spot(-40, -10)],
        color: COLORS.lambdaText,
      });
    // the green particle is named once the wave reaches it (before, the action's marker has the room)
    if (s.show.bead && (s.mode === 'quiz' || on(s.clock - air.followR / wave.speed) > 0.02))
      want.set('bead', {
        text: t('lbl_bead'),
        point: () => air.beadRest.clone().addScaledVector(AXIS, -1.5),
        spots: [spot(0, 26), spot(16, 30), spot(-16, 30), spot(0, 40)],
        color: COLORS.green,
        optional: true,
      });
    return want;
  }
  function syncLabels() {
    const want = wantLabels();
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'tag', color: w.color, spots: w.spots, optional: w.optional });
        labelState.set(id, w.text);
      } else if (labelState.get(id) !== w.text) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, w.text);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function setReach() {
    const { end, flap } = reach();
    air.setReach(end, flap);
  }
  /** The points the camera frames (mm): the strip, the clip with its handles' feet, the arrow's tail and the wave's reach. */
  function framePoints() {
    const pts = [];
    for (const side of [1, -1]) pts.push(...paper.corners(side));
    pts.push(...clip.feet, BLOW_FROM);
    const { end } = reach();
    const onFan = (x, y) => ORIGIN.clone().addScaledVector(AXIS, x).addScaledVector(PLANE, y);
    pts.push(onFan(end, 0), onFan(Math.sqrt(end * end - FAN.top * FAN.top), FAN.top));
    return pts;
  }
  function viewPose() {
    return fitPose({ points: framePoints(), dir: DIR, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function place(pose) {
    camera.position.copy(pose.position);
    controls.target.copy(pose.target);
    controls.update();
  }
  function flyTo({ position, target: aim }, duration = 0.7) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      place({ position, target: aim });
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, aim, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function homeView(animate = true) {
    s.userMovedCamera = false;
    syncUI();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    syncUI();
  });
  controls.addEventListener('change', () => {
    syncScene();
    stage.invalidate();
  });
  stage.onResize(() => {
    setReach();
    if (!s.userMovedCamera) place(viewPose());
    syncScene();
    refresh();
  });

  // ── the action: the big button, the badge on the flaps ──────────────────────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    audio.unlock();
    buzz.unlock();
    if (blowing()) return stopBlow();
    const p = plan();
    if (p.cut !== s.cut) chooseCut(p.cut);
    startBlow();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_blow',
    target: () => flapsBox3(),
    pad: 10,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => doAction(),
  });

  // taps on the paper blow too
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt = null;
  stage.canvas.addEventListener('pointerdown', (e) => {
    downAt = { x: e.clientX, y: e.clientY, t: now() };
  });
  stage.canvas.addEventListener('pointerup', (e) => {
    if (!downAt || s.mode !== 'explore') return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    const quick = now() - downAt.t < 500;
    downAt = null;
    if (moved > 8 || !quick) return;
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(hit, false).length) doAction();
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
    const f = freq();
    return {
      cut: s.cut,
      flapLength: CUTS[s.cut].L, // mm
      frequency: f, // Hz, about
      wavelength: wavelength(f), // m, λ = v / f
      voice: voiceOf(f),
      blowing: blowing(),
      opening: Math.round(paper.swing * 100) / 100, // mm, how far a flap's free edge is out now
      tried: CUT_IDS.filter((id) => s.tried.has(id)),
      next: plan().label.replace('act_', ''),
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.cut, snap.blowing, snap.tried, snap.mode]);
    if (k === lastEmitted) return;
    lastEmitted = k;
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
  /** The five questions, each with its right choice first and a note for each wrong one. */
  const QUESTIONS = [
    { kind: 'what', q: 'q_what', choices: ['c_what_flaps', 'c_what_fingers', 'c_what_breath', 'c_what_sheet'], why: 'why_what' },
    { kind: 'bead', q: 'q_bead', choices: ['c_bead_swing', 'c_bead_fly', 'c_bead_updown', 'c_bead_still'], why: 'why_bead' },
    { kind: 'short', q: 'q_short', choices: ['c_short_up', 'c_short_down', 'c_short_same', 'c_short_mixed'], why: 'why_short' },
    { kind: 'widest', q: 'q_widest', choices: ['c_widest_comp', 'c_widest_rare', 'c_widest_fly', 'c_widest_both'], why: 'why_widest' },
    { kind: 'lambda', q: 'q_lambda', choices: ['c_lambda_cc', 'c_lambda_cr', 'c_lambda_amp', 'c_lambda_flap'], why: 'why_lambda' },
  ];
  const mistake = (c) => c.replace(/^c_/, 'mis_');
  let learnSaved = null;
  let picked = -1;
  /** The scene for a question: a cut, blowing steadily, some labels hidden. */
  function scene_(cut, show) {
    s.show = { flap: true, lambda: true, bead: true, blow: true, ...show };
    chooseCut(cut);
    still();
    startBlow({ steady: true });
    s.userMovedCamera = false;
    tweener.cancel('camera');
    place(viewPose());
    syncUI();
    syncScene();
    refresh();
  }
  const fVars = () => ({ fs: N(shownFrequency('short')), fm: N(shownFrequency('mid')), lm: N(wavelength(shownFrequency('mid'))), v: N(V_SOUND) });

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: QUESTIONS.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        learnSaved = { cut: s.cut, tried: new Set(s.tried) };
        s.mode = 'quiz';
        s.locked = true;
        s.breath = Number.POSITIVE_INFINITY;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.breath = BREATH;
        s.show = { flap: true, lambda: true, bead: true, blow: true };
        still();
        if (learnSaved) {
          chooseCut(learnSaved.cut);
          s.tried = learnSaved.tried;
        }
        s.userMovedCamera = false;
        place(viewPose());
        syncUI();
        syncScene();
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const q = QUESTIONS[i % QUESTIONS.length];
        if (q.kind === 'what') scene_('mid', { flap: false, lambda: false });
        else if (q.kind === 'bead') scene_('mid', { flap: false });
        else if (q.kind === 'short') scene_('mid', {});
        else if (q.kind === 'widest') scene_('mid', { lambda: false });
        else scene_('mid', {});
        await new Promise((r) => setTimeout(r, 0));
        if (!alive()) return null;
        const list = shuffle([...q.choices]);
        return {
          text: t(q.q),
          choices: [0, 1, 2, 3],
          expected: list.indexOf(q.choices[0]),
          tolerance: 0.5,
          label: (j) => `<span class="pv-opt">${t(list[j])}</span>`,
          list,
          meta: { kind: q.kind, answer: q.choices[0] },
        };
      },
      reveal(q, correct) {
        const kind = q.meta.kind;
        const item = QUESTIONS.find((x) => x.kind === kind);
        const wrong = correct ? null : q.list?.[picked];
        // the answer shown on the picture
        if (kind === 'what' || kind === 'bead') scene_('mid', {});
        else if (kind === 'short') scene_('short', {});
        return t(item.why, fVars()) + (wrong && wrong !== item.choices[0] ? ` ${t(mistake(wrong))}` : '');
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = !s.userMovedCamera;
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const isOn = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', isOn);
      b.setAttribute('aria-selected', String(isOn));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  function goHome() {
    s.tried = new Set();
    s.show = { flap: true, lambda: true, bead: true, blow: true };
    still();
    chooseCut('mid');
    homeView(false);
    refresh();
    emitChange();
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    buzz.unlock();
    if (b.dataset.view === 'front') homeView();
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.example) {
      if (s.locked) return lockedNudge();
      const wasBlowing = blowing();
      if (b.dataset.example !== s.cut) chooseCut(b.dataset.example, { blow: wasBlowing });
    }
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'q-next') quiz.next();
    else if (b.dataset.act === 'q-again') quiz.start();
    else if (b.dataset.act === 'home') goHome();
    else if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft', '1', '2', '3'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowRight' || k === 'ArrowLeft') {
      const i = CUT_IDS.indexOf(s.cut) + (k === 'ArrowRight' ? 1 : -1);
      if (i >= 0 && i < CUT_IDS.length) chooseCut(CUT_IDS[i], { blow: blowing() });
    } else if (k === '1' || k === '2' || k === '3') chooseCut(CUT_IDS[Number(k) - 1], { blow: blowing() });
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  paper.setCut(CUTS[s.cut].L);
  wave = drawnWave(freq());
  syncUI();
  setReach();
  place(viewPose());
  if (o.blow) startBlow({ steady: true });
  syncScene();
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
     * cut: 'long' | 'mid' | 'short'; blow: true (start blowing) | false (stop). With animate: false the blowing is
     * already steady (the air full of the wave) and lasts until stopped.
     */
    async set(p = {}) {
      if (s.mode === 'quiz' && (p.cut != null || p.blow != null)) quiz.stop();
      const steady = p.animate === false;
      if (steady) s.breath = Number.POSITIVE_INFINITY;
      if (p.cut != null && CUTS[p.cut]) chooseCut(p.cut);
      if (p.blow === true) {
        if (steady) still();
        startBlow({ steady });
      } else if (p.blow === false) {
        stopBlow(false);
        if (steady) still();
      }
      syncScene();
      syncLabels();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.breath = BREATH;
      goHome();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The folded paper with its flaps as they are bent now, and the clip, in millimetres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'PaperVocalCord';
      g.add(paper.root.clone(true), clip.root.clone(true));
      // the paper's texture at 512 px for the file (the 1024 px one is for the screen), no glow map: GLB under 1 MB
      const small = new Map();
      g.traverse((m) => {
        if (!m.isMesh) return;
        m.material = (Array.isArray(m.material) ? m.material : [m.material]).map((mat) => {
          if (!mat.map || mat.map.image?.width <= 512) return mat;
          if (!small.has(mat)) {
            const c = document.createElement('canvas');
            c.width = c.height = 512;
            c.getContext('2d')?.drawImage(mat.map.image, 0, 0, 512, 512);
            const map = mat.map.clone();
            map.image = c;
            map.needsUpdate = true;
            const copy = mat.clone();
            Object.assign(copy, { map, emissiveMap: null, bumpMap: null });
            small.set(mat, copy);
          }
          return small.get(mat);
        });
        if (m.material.length === 1) m.material = m.material[0];
      });
      return g;
    },
  };
}
