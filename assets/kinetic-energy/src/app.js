// Kinetic energy (গতিশক্তি), book p104, topic 4.3.1: the student view. An archer draws a bow: the bent bow stores
// energy; let go, and the string pushes the arrow (it does work on it), the arrow flies and sinks into a straw bale,
// cut open to show how deep. The student picks the arrow's mass m and speed v with tap steppers (the further the
// string is drawn, the faster the arrow), shoots by the big action button, a tap on the archer or by dragging the
// string back and letting go, and the panel works T = ½mv² out with their numbers. Shots are compared with the one
// before (twice the speed: four times the energy, and four times as deep in the straw). A 5-question test.
// The panel is the kit's clean sheet (one action, one result, one rule): docs/student-kit.md.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer } from '@shared/student/pointer.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createMaterials } from '@shared/student/materials.js';
import { ARM, BOW_SHOULDER, createArcher } from './archer.js';
import { ARROW_LEN, ARROW_RISE, BALE, BRACE, createArrowMesh, createBale, createBow, createFace, createRange } from './bow.js';
import { fitPose } from './camera.js';
import {
  choicesFrom,
  DEFAULTS as START,
  DRAW_MAX,
  depthIn,
  drawFor,
  energyRatio,
  flightTime,
  G,
  K,
  kinetic,
  MASSES,
  maxSpeed,
  plain,
  ratio,
  ratioExact,
  ratioText,
  SLOW,
  shuffle,
  speedsFor,
} from './energy.js';
import { createI18n } from './i18n.js';

export const DEFAULTS = {
  m: START.m, // kg
  v: START.v, // m/s
  stage: 'ready', // 'ready' | 'drawn' | 'flying' | 'hit' | 'compare' (pictures)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the string pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' (the hall) | 'transparent'
  shadow: true,
  sound: true,
};

const COLORS = { pe: '#6741d9', ke: '#e8930c', keText: '#a35f00', v: '#1c6fd9' };
const ARROW_Z = 0.035; // the plane of the string and the arrow (in front of the archer's chin)
const GRIP = new THREE.Vector3(BOW_SHOULDER.x + ARM, 1.41, ARROW_Z);
const NOCK_Y = GRIP.y + ARROW_RISE;
const HITS = [1.43, 1.2]; // where the arrows land on the bale, by turns (the archer aims a little differently)
const VIEW_DIRS = { front: new THREE.Vector3(0, 0.07, 1).normalize(), '3d': new THREE.Vector3(0.55, 0.3, 0.85).normalize() };
const BOX = {
  archer: new THREE.Box3(new THREE.Vector3(-0.42, 0.72, -0.15), new THREE.Vector3(1.4, 2.3, 0.15)),
  bale: new THREE.Box3(new THREE.Vector3(2.45, 0.92, -0.2), new THREE.Vector3(3.85, 1.78, 0.1)),
  all: new THREE.Box3(new THREE.Vector3(-0.42, 0.0, -0.2), new THREE.Vector3(3.85, 2.3, 0.15)),
};
const T = { draw: 0.9, hold: 0.45, settle: 0.7 }; // seconds on screen
const STEP_PX = 26; // a drag of the string: one speed step for each this many pixels

/** The book's ½ as a small stacked fraction (the bundled font has no ½), digits as given. */
const frac = (a, b) => `<span class="ke-frac"><span>${a}</span><span>${b}</span></span>`;
const fx = (html) => html.replaceAll('½', frac('1', '2'));

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const tx = (key, vars) => fx(t(key, vars));

  root.classList.add('pvc', 'ke');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel: the steppers, one action, one result (in words, then the formula), one rule ──
  const stepper = (q, name) =>
    `<div class="ke-step c-${q}" role="group" aria-label="${t(name)}">
      <span class="ke-name"><span class="ke-word">${t(name)} </span><i>${q}</i></span>
      <button type="button" class="ke-btn" data-act="${q}-" aria-label="${t(`${q}_down`)}">${ICONS.minus}</button>
      <b class="ke-val" data-v="${q}" aria-live="polite"></b>
      <button type="button" class="ke-btn" data-act="${q}+" aria-label="${t(`${q}_up`)}">${ICONS.plus}</button>
    </div>`;
  const sheetHtml = cleanSheet(t, {
    quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
    lines: { action: 1, outcome: 2, rule: 3 },
  }).replace(
    '<p class="pvc-outcome"',
    `<div class="ke-calc" role="group" aria-label="${t('calc')}">${stepper('m', 'calc_m')}${stepper('v', 'calc_v')}</div><p class="pvc-outcome"`,
  );
  const ui = buildStudentShell(root, t, { layout: 'side', learn: sheetHtml, learnAlign: 'start' });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const el = {
    m: $('[data-v="m"]'),
    v: $('[data-v="v"]'),
    mMinus: $('[data-act="m-"]'),
    mPlus: $('[data-act="m+"]'),
    vMinus: $('[data-act="v-"]'),
    vPlus: $('[data-act="v+"]'),
  };
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // ── 3D: the archer and the target on a plain floor before a soft wall ─────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.05, far: 80, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 1;
  controls.maxDistance = 25;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  // indoors: the roof's underside behind everything, a warm fill from the maple floor, lamps overhead
  scene.background = o.bg === 'transparent' ? null : new THREE.Color('#9fb6cc');
  scene.add(new THREE.HemisphereLight('#fff6e6', '#b5793c', 0.95));
  const sun = new THREE.DirectionalLight('#fff4e0', 1.7); // the lamps over the lane
  sun.position.set(0.8, 6, 2.4);
  sun.target.position.set(1.6, 0, 0);
  scene.add(sun, sun.target);

  const world = new THREE.Group();
  world.name = 'KineticEnergy';
  scene.add(world);
  const M = createMaterials(stage.renderer);
  const range = createRange();
  const archer = createArcher();
  const bow = createBow({ wood: M.wood });
  bow.root.position.copy(GRIP);
  const bale = createBale({ cutZ: ARROW_Z - 0.004 });
  range.backdrop.visible = o.bg !== 'transparent';
  // a 60 cm target face, its gold 1.3 m above the floor as World Archery sets it indoors
  bale.root.add(createFace({ cutZ: ARROW_Z - 0.004, y: 1.31 }));
  world.add(range.root, archer.root, bow.root, bale.root);
  // a hit area round the string and the drawing hand: a drag here draws the bow
  const stringHit = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.4), new THREE.MeshBasicMaterial({ visible: false }));
  stringHit.userData.noExport = true;
  world.add(stringHit);

  if (o.shadow && o.bg !== 'transparent') {
    // soft PCF shadows, the shadow camera fitted closely round the archer, the bow and the bale (and the floor just
    // behind them, where their shadows fall): 1024 px on this small box is as sharp as the old 2048 on a loose one
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -2.3, right: 2.4, top: 2, bottom: -1, near: 3.5, far: 9 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.01;
  }

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state: every line, label and pose is drawn from it ──────────────────
  const s = {
    m: MASSES.includes(Number(o.m)) ? Number(o.m) : START.m,
    v: Number(o.v) || START.v,
    phase: 'ready', // 'ready' | 'draw' | 'hold' | 'push' | 'fly' | 'enter' | 'stuck'
    clock: 0, // seconds on screen since the phase began
    draw: 0, // m, the string pulled back from rest
    target: 0, // the draw of this shot
    shot: null, // the arrow on the string or in flight: { m, v, T, mesh, hitY, vy, x, y, slope, depth }
    stuck: [], // the arrows in the bale, newest last: { m, v, T, mesh, tail }
    count: 0, // shots so far (for the aim)
    last: null, // the comparison of the last two shots
    seen: { v2: false, m: false },
    look: 'archer', // 'archer' | 'bale': where the camera rests between shots
    frozen: false, // a picture state ('flying') that never runs on by itself
    handX: null, // where the drawing hand let go (it stays at the anchor after the release)
    labels: 'learn', // 'learn' | 'quiz'
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    token: 0,
    userMovedCamera: false,
  };
  s.v = clampV(s.m, s.v);
  function clampV(m, v) {
    const list = speedsFor(m);
    if (list.includes(v)) return v;
    return list.reduce((best, x) => (Math.abs(x - v) < Math.abs(best - v) ? x : best), list[0]);
  }
  // phases: 'ready' (bow at rest), 'held' (a picture: held drawn), the run 'draw' → 'hold' → 'push' → 'fly' →
  // 'enter' → 'stuck'; and the test's still scenes 'qdrawn', 'qfly', 'qbale'
  const busy = () => ['draw', 'hold', 'push', 'fly', 'enter'].includes(s.phase);
  const qPhase = () => s.phase.startsWith('q');
  const flying = () => ['push', 'fly', 'enter'].includes(s.phase);

  // ── arrows ──────────────────────────────────────────────────────────────────
  // a speed streak behind a flying arrow: longer when it is faster (0.015 s of its real path)
  const streakTex = (() => {
    // a blue core in a white edge, so it reads on the red brick, the orange padding and the dark net alike
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 16;
    const g = c.getContext('2d');
    const edge = g.createLinearGradient(0, 0, 128, 0);
    edge.addColorStop(0, 'rgba(255,255,255,0)');
    edge.addColorStop(1, 'rgba(255,255,255,0.95)');
    g.fillStyle = edge;
    g.fillRect(0, 1, 128, 14);
    const core = g.createLinearGradient(0, 0, 128, 0);
    core.addColorStop(0, 'rgba(28,111,217,0)');
    core.addColorStop(1, 'rgba(28,111,217,1)');
    g.fillStyle = core;
    g.fillRect(0, 4, 128, 8);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const streakMat = new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, depthWrite: false });
  const streakGeo = new THREE.PlaneGeometry(1, 0.04);
  streakGeo.translate(-0.5, 0, 0);
  function newArrow(m) {
    const a = createArrowMesh(m);
    const streak = new THREE.Mesh(streakGeo, streakMat);
    streak.userData.noExport = true;
    streak.visible = false;
    a.root.add(streak);
    a.streak = streak;
    world.add(a.root);
    return a;
  }
  function nockArrow() {
    if (s.shot?.mesh) {
      world.remove(s.shot.mesh.root);
    }
    const mesh = newArrow(s.m);
    s.shot = { m: s.m, v: s.v, T: kinetic(s.m, s.v), mesh, x: 0, y: NOCK_Y, slope: 0, vy: 0, hitY: NOCK_Y, depth: 0 };
  }
  // how deep an arrow went: an amber bar (the colour of গতিশক্তি) along its buried part, on the cut face
  const barMat = new THREE.MeshStandardMaterial({
    name: 'DepthBar',
    color: '#b35400', // a deep amber: গতিশক্তি's colour, darker than the golden straw
    emissive: '#b35400',
    emissiveIntensity: 0.15,
    roughness: 0.5,
  });
  const barGeo = new THREE.BoxGeometry(1, 0.034, 0.002);
  const backGeo = new THREE.BoxGeometry(1, 0.054, 0.001);
  const backMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  /** An arrow in the bale: sh = { m, v }, at height y; mesh: the arrow that flew (else a new one). */
  function stick(sh, y, mesh = newArrow(sh.m)) {
    const T0 = kinetic(sh.m, sh.v);
    const depth = depthIn(T0);
    const x = BALE.x + depth - ARROW_LEN;
    mesh.root.position.set(x, y, ARROW_Z + 0.004);
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.scale.x = depth;
    bar.position.set(BALE.x + depth / 2, y, ARROW_Z - 0.0015); // on the cut face, behind the shaft
    bar.userData.noExport = true;
    const back = new THREE.Mesh(backGeo, backMat); // a white edge so the amber stands out on the straw
    back.scale.x = 1 + 0.02 / depth;
    back.position.z = -0.0016;
    bar.add(back);
    world.add(bar);
    const a = { m: sh.m, v: sh.v, T: T0, mesh, bar, depth, tail: new THREE.Vector3(x, y, ARROW_Z + 0.004) };
    s.stuck.push(a);
    return a;
  }
  function unstick(a) {
    world.remove(a.mesh.root, a.bar);
  }
  function clearStuck() {
    for (const a of s.stuck) unstick(a);
    s.stuck = [];
  }

  // ── where everything is now ─────────────────────────────────────────────────
  const nockX = () => GRIP.x - BRACE - s.draw;
  const drawHand = new THREE.Vector3();
  const bowHand = new THREE.Vector3();
  let wobble = 0; // the limbs ringing after the release
  function place() {
    if (qPhase()) return placeQ();
    const k = s.draw / DRAW_MAX + wobble;
    bow.set(k, -BRACE - s.draw);
    // the drawing hand holds the string; after the release it stays at the anchor, then comes forward again
    const handX = s.handX ?? nockX();
    drawHand.set(handX - 0.004, NOCK_Y - 0.006, ARROW_Z + 0.004); // the fingers hook the string at the nock
    bowHand.set(GRIP.x - 0.004, GRIP.y - 0.03, ARROW_Z - 0.03);
    archer.pose({ bowHand, drawHand });
    stringHit.position.set(GRIP.x - BRACE - 0.25, NOCK_Y, ARROW_Z);
    const a = s.shot;
    if (a?.mesh) {
      const r = a.mesh.root;
      if (!flying()) r.position.set(nockX(), NOCK_Y, ARROW_Z + 0.004);
      else r.position.set(a.x, a.y, ARROW_Z + 0.004);
      r.rotation.set(0, 0, flying() ? Math.atan(a.slope) : 0);
      r.visible = s.phase !== 'stuck';
      a.mesh.streak.visible = s.phase === 'fly';
      a.mesh.streak.scale.x = a.v * 0.015;
    }
    labels();
    panel();
    stage.invalidate();
  }

  // ── the shot: draw, hold, release (the string pushes the arrow), fly, into the straw ──
  let lastTick = -1;
  function startPhase(p) {
    s.phase = p;
    s.clock = 0;
  }
  stage.addTicker((dt) => {
    if (s.frozen || (!busy() && !wobble)) return false;
    s.clock += dt;
    step(dt);
    place();
    return true;
  });
  function step(dt) {
    const a = s.shot;
    if (wobble) {
      s.wobbleT = (s.wobbleT || 0) + dt;
      wobble = -0.06 * Math.exp(-s.wobbleT / 0.18) * Math.cos(s.wobbleT * 38);
      if (s.wobbleT > 1) wobble = 0;
    }
    if (s.phase === 'draw') {
      const u = Math.min(1, s.clock / T.draw);
      const from = s.drawFrom;
      s.draw = from + (s.target - from) * ease.inOutCubic(u);
      const tickAt = Math.floor(u * 6);
      if (tickAt !== lastTick) {
        lastTick = tickAt;
        if (u < 1) audio.tick();
      }
      if (u >= 1) startPhase('hold');
    } else if (s.phase === 'hold') {
      if (s.clock >= T.hold) release();
    } else if (s.phase === 'push') {
      // an ideal bow pushes like a spring: the string comes back in a quarter swing, the arrow speeding up
      const w = Math.sqrt(K / a.m) / SLOW;
      const end = Math.PI / 2 / w;
      const tt = Math.min(s.clock, end);
      s.draw = s.target * Math.cos(w * tt);
      a.x = nockX();
      a.y = NOCK_Y;
      if (s.clock >= end) {
        s.draw = 0;
        s.wobbleT = 0;
        wobble = -1e-6;
        a.x0 = a.x;
        startPhase('fly');
        audio.contact();
      }
    } else if (s.phase === 'fly') {
      const tr = s.clock / SLOW; // real time in the air
      a.x = a.x0 + a.v * tr;
      a.y = NOCK_Y + a.vy * tr - 0.5 * G * tr * tr;
      a.slope = (a.vy - G * tr) / a.v;
      if (a.x + ARROW_LEN >= BALE.x) {
        a.x = BALE.x - ARROW_LEN;
        a.vIn = a.v;
        startPhase('enter');
        audio.lock();
      }
    } else if (s.phase === 'enter') {
      // the straw pushes back steadily: the arrow slows evenly to rest over its depth (W = Fs takes all of T)
      const d = a.depth;
      const tEnd = (2 * d) / a.v; // real time
      const tr = Math.min(s.clock / SLOW, tEnd);
      const dec = (a.v * a.v) / (2 * d);
      a.x = BALE.x - ARROW_LEN + a.v * tr - 0.5 * dec * tr * tr;
      if (s.clock / SLOW >= tEnd) land();
    }
  }
  function release() {
    const a = s.shot;
    a.m = s.m;
    a.v = s.v;
    a.T = kinetic(a.m, a.v);
    a.depth = depthIn(a.T);
    // aim so the arrow lands at its spot on the bale (the archer aims a little differently each time)
    const hitY = HITS[s.count % HITS.length];
    const tHit = flightTime(a.v, BALE.x - (nockX() + ARROW_LEN) + s.target);
    a.vy = (hitY - NOCK_Y + 0.5 * G * tHit * tHit) / tHit;
    a.slope = a.vy / a.v;
    s.handX = nockX();
    startPhase('push');
    audio.pop();
  }
  function land() {
    const a = s.shot;
    const prev = s.stuck.at(-1);
    const stuck = stick(a, a.y, a.mesh);
    while (s.stuck.length > 2) unstick(s.stuck.shift());
    s.shot = null;
    s.count += 1;
    // compare with the arrow before
    if (prev) {
      const rm = ratio(Math.round(stuck.m * 1000), Math.round(prev.m * 1000));
      const rv = ratio(stuck.v, prev.v);
      const rt = energyRatio(stuck, prev);
      s.last = { rm, rv, rt };
      const mSame = rm.p === rm.q;
      const vSame = rv.p === rv.q;
      if (mSame && !vSame && (rv.value === 2 || rv.value === 0.5)) s.seen.v2 = true;
      if (vSame && !mSame) s.seen.m = true;
    } else s.last = null;
    startPhase('stuck');
    audio.success();
    emitChange();
    const token = s.token;
    s.look = 'bale';
    flyCamera();
    setTimeout(() => {
      if (token !== s.token || s.phase !== 'stuck') return;
      // he takes the next arrow from the quiver
      s.handX = null;
      nockArrow();
      startPhase('ready');
      place();
    }, T.settle * 1000);
  }

  /** The action: draw to the planned speed (or from where a drag left the string) and let go. */
  function shoot({ fromDrag = false } = {}) {
    if (s.locked) return lockedNudge();
    unfreeze();
    if (busy()) return action.flash();
    audio.unlock();
    s.token += 1;
    const held = fromDrag || s.phase === 'held';
    if (!s.shot || s.phase === 'stuck') nockArrow();
    s.handX = null;
    s.target = drawFor(s.m, s.v);
    if (held) s.draw = s.target;
    s.drawFrom = s.draw;
    lastTick = -1;
    startPhase(held ? 'hold' : 'draw');
    if (held) s.clock = T.hold - 0.05;
    s.look = 'archer';
    flyCamera();
    place();
  }
  function unfreeze() {
    if (!s.frozen) return;
    s.frozen = false;
    relax();
  }
  /** Back to an undrawn bow with a fresh arrow (a stepper during the draw, reset, the test). */
  function relax() {
    s.token += 1;
    s.draw = 0;
    wobble = 0;
    s.handX = null;
    const wasFlying = flying();
    startPhase('ready');
    if (!s.shot || s.shot.m !== s.m || wasFlying) nockArrow();
  }

  // ── labels on the picture (each only while what it says is true) ────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, () => action?.ringBox()] });
  const shown = new Map();
  function label(id, on, text, point, color, spots, optional = false) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!shown.has(id)) {
      anno.add(id, { text, point: () => point, color, spots, kind: 'part', optional });
      shown.set(id, text);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
    }
  }
  const pStore = new THREE.Vector3();
  const pFly = new THREE.Vector3();
  const pNow = new THREE.Vector3();
  const pPrev = new THREE.Vector3();
  const P_CUT = new THREE.Vector3(BALE.x + BALE.depth * 0.5, BALE.y + BALE.h, ARROW_Z);
  const CUT_SPOTS = [
    { dx: 0, dy: -18 },
    { dx: -40, dy: -18 },
  ];
  const LEFT_UP = [
    { dx: -70, dy: -30 },
    { dx: -60, dy: 30 },
    { dx: 60, dy: -30 },
  ];
  const ABOVE = [
    { dx: 0, dy: -26 },
    { dx: 0, dy: 26 },
  ];
  const TAIL = [
    { dx: -50, dy: -22 },
    { dx: -50, dy: 22 },
    { dx: 0, dy: -28 },
  ];
  function labels() {
    if (s.labels !== 'learn') return;
    const k = s.draw / DRAW_MAX;
    pStore.set(GRIP.x - 0.17 - 0.08 * k, GRIP.y + 0.66, ARROW_Z);
    const drawn = s.phase === 'draw' || s.phase === 'hold' || s.phase === 'held' || (s.phase === 'ready' && s.draw > 0.05);
    label('store', drawn && s.draw > 0.05, t('l_store'), pStore, COLORS.pe, LEFT_UP);
    const a = s.shot;
    const inAir = a && (s.phase === 'fly' || s.phase === 'enter');
    if (inAir) pFly.set(a.x + ARROW_LEN * 0.5, a.y, ARROW_Z);
    label('v', Boolean(inAir), inAir ? tx('l_v', { v: a.v }) : '', pFly, COLORS.v, ABOVE);
    const now = s.stuck.at(-1);
    const prev = s.stuck.length > 1 ? s.stuck.at(-2) : null;
    if (now) pNow.copy(now.tail).setX(now.tail.x + 0.05);
    if (prev) pPrev.copy(prev.tail).setX(prev.tail.x + 0.05);
    // the arrows in the bale carry their energies while the camera is on them
    const showStuck = (s.look === 'bale' || wide()) && !flying() && camK >= 1;
    label('now', Boolean(now) && showStuck, now ? tx('l_T', { T: plain(now.T) }) : '', pNow, COLORS.keText, TAIL);
    label('prev', Boolean(prev) && showStuck, prev ? tx('l_prev', { T: plain(prev.T) }) : '', pPrev, '#5c6470', TAIL);
    label('cut', showStuck && s.stuck.length > 0, t('l_cut'), P_CUT, '#6b4f12', CUT_SPOTS, true);
  }
  function clearLabels() {
    for (const id of [...shown.keys()]) anno.remove(id);
    shown.clear();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  function formula(m, v) {
    const Tv = kinetic(m, v);
    // three unbreakable parts, so a narrow panel wraps it only at an "="
    const nb = (x) => `<span class="ke-nb">${x}</span>`;
    return `<span class="ke-f">${nb(`<i>T</i> = ${frac('1', '2')}<i>mv</i><sup>2</sup>`)} ${nb(`= ${frac(N(1), N(2))} × ${N(plain(m))} kg × (${N(v)} m/s)<sup>${N(2)}</sup>`)} ${nb(`= <b>${N(plain(Tv))} J</b>`)}</span>`;
  }
  /** A ratio for a sentence: exact (২, ২.২৫) or rounded with প্রায় (প্রায় ১.৬৭). */
  const rText = (x) => (ratioExact(x) ? '' : t('about')) + ratioText(x);
  function words() {
    if (s.phase === 'draw' || s.phase === 'hold' || s.phase === 'held' || (s.phase === 'ready' && s.draw > 0.05)) return t('out_drawn');
    if (flying()) return t('out_flying', { v: s.shot.v, k: SLOW });
    if (!s.stuck.length) return t('out_start');
    const c = s.last;
    if (!c) return t('out_first');
    const mSame = c.rm.p === c.rm.q;
    const vSame = c.rv.p === c.rv.q;
    const r = rText;
    if (mSame && vSame) return t('out_cmp_same');
    if (mSame) return t('out_cmp_v', { rv: r(c.rv), rt: r(c.rt) });
    if (vSame) return t('out_cmp_m', { rm: r(c.rm), rt: r(c.rt) });
    return t('out_cmp_both', { rm: r(c.rm), rv: r(c.rv), rt: r(c.rt) });
  }
  function rule() {
    if (!s.stuck.length) return tx('rule_start');
    if (s.seen.v2 && s.seen.m) return tx('rule_both');
    const c = s.last;
    if (!c) return tx('rule_first');
    const mSame = c.rm.p === c.rm.q;
    const vSame = c.rv.p === c.rv.q;
    if (mSame && vSame) return tx(s.seen.v2 ? 'rule_v2' : 'rule_first');
    if (mSame) return c.rv.value === 2 || c.rv.value === 0.5 ? tx('rule_v2') : tx('rule_v', { rv: rText(c.rv), rt: rText(c.rt) });
    if (vSame) return c.rm.value === 2 || c.rm.value === 0.5 ? tx('rule_m2') : tx('rule_m', { rm: rText(c.rm), rt: rText(c.rt) });
    return tx('rule_mix');
  }
  let lastPanel = '';
  function panel() {
    if (s.labels !== 'learn') return;
    // during a flight the panel shows that arrow; otherwise the next one (the steppers)
    const shownM = flying() && s.shot ? s.shot.m : s.m;
    const shownV = flying() && s.shot ? s.shot.v : s.v;
    const actKey = s.stuck.length ? 'act_again' : 'act_shoot';
    if (action && action.lastKey !== actKey) {
      action.lastKey = actKey;
      action.set({ label: actKey, step: s.stuck.length ? '' : 1 });
    }
    // the page is written only when something in it changes (place() runs every frame of a shot)
    const key = [s.m, s.v, s.locked, shownM, shownV, words(), rule()].join('|');
    if (key === lastPanel) return;
    lastPanel = key;
    el.m.textContent = `${N(plain(s.m))} ${t('u_kg')}`;
    el.v.textContent = `${N(s.v)} ${t('u_ms')}`;
    const lock = s.locked;
    const mi = MASSES.indexOf(s.m);
    el.mMinus.disabled = lock || mi <= 0;
    el.mPlus.disabled = lock || mi >= MASSES.length - 1;
    el.vMinus.disabled = lock || s.v <= speedsFor(s.m)[0];
    el.vPlus.disabled = lock;
    el.vPlus.classList.toggle('at-max', s.v >= maxSpeed(s.m));
    sheet.outcome(`<span class="ke-w">${words()}</span>${formula(shownM, shownV)}`);
    sheet.rule(rule());
  }

  // ── steppers ────────────────────────────────────────────────────────────────
  /** Back to the archer (from the bale): the student gets ready for the next shot. */
  function lookAtArcher() {
    if (s.look === 'archer') return;
    s.look = 'archer';
    flyCamera(0.6);
    place();
  }
  function setM(m) {
    unfreeze();
    s.m = m;
    s.v = clampV(m, Math.min(s.v, maxSpeed(m)));
    if (!flying()) relax();
    if (!flying()) lookAtArcher();
    place();
    emitChange();
  }
  function setV(v) {
    unfreeze();
    s.v = v;
    if (!flying()) relax();
    if (!flying()) lookAtArcher();
    place();
    emitChange();
  }
  function stepM(dir) {
    if (s.locked) return lockedNudge();
    const i = MASSES.indexOf(s.m) + dir;
    if (i < 0 || i >= MASSES.length) return;
    audio.tick();
    setM(MASSES[i]);
  }
  function stepV(dir) {
    if (s.locked) return lockedNudge();
    const list = speedsFor(s.m);
    const i = list.indexOf(s.v) + dir;
    if (i >= list.length) return hint(t('v_max'));
    if (i < 0) return;
    audio.tick();
    setV(list[i]);
  }

  // ── camera: close on the archer, out along the flight, close on the bale ────
  let camFrom = null;
  let camK = 1;
  const camBox = new THREE.Box3();
  const tmpBox = new THREE.Box3();
  let wideFor = '';
  let wideNow = false;
  /** Is the stage big enough to show the whole range at once? (Worked out again only when its size changes.) */
  function wide() {
    const key = `${stage.width}x${stage.height}`;
    if (key === wideFor) return wideNow;
    wideFor = key;
    const p = fitPose({ box: BOX.all, dir: VIEW_DIRS.front, camera, width: stage.width, height: stage.height, margin: margins() });
    const scale = stage.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * p.position.distanceTo(p.target));
    wideNow = scale >= 125; // px per metre: big enough to show everything at once
    return wideNow;
  }
  function margins() {
    return { top: 50, bottom: 10, side: 8 };
  }
  function boxNow(out) {
    if (wide()) return out.copy(BOX.all);
    if (qPhase()) return out.copy(s.phase === 'qbale' ? BOX.bale : s.phase === 'qfly' ? lerpBox(BOX.archer, BOX.all, 0.35) : BOX.archer);
    const a = s.shot;
    if ((s.phase === 'fly' || s.phase === 'enter') && a && !s.frozen) {
      // out along the flight: from the archer to the whole range as the arrow nears the bale
      const span = BALE.x - GRIP.x;
      const u = THREE.MathUtils.clamp((a.x + ARROW_LEN - GRIP.x) / span, 0, 1);
      return out.copy(lerpBox(BOX.archer, BOX.all, u));
    }
    if (s.frozen) return out.copy(lerpBox(BOX.archer, BOX.all, 0.35));
    return out.copy(s.look === 'bale' ? BOX.bale : BOX.archer);
  }
  function lerpBox(a, b, u) {
    tmpBox.min.lerpVectors(a.min, b.min, u);
    tmpBox.max.lerpVectors(a.max, b.max, u);
    return tmpBox;
  }
  const poseBox = new THREE.Box3();
  const poseFor = { view: '', w: 0, h: 0 };
  let pose = null;
  /** The camera pose for what is shown now (worked out again only when the box, the view or the size changes). */
  function poseNow() {
    boxNow(camBox);
    if (pose && camBox.equals(poseBox) && poseFor.view === s.view && poseFor.w === stage.width && poseFor.h === stage.height) return pose;
    poseBox.copy(camBox);
    Object.assign(poseFor, { view: s.view, w: stage.width, h: stage.height });
    pose = fitPose({
      box: camBox,
      dir: VIEW_DIRS[s.view === '3d' ? '3d' : 'front'],
      camera,
      width: stage.width,
      height: stage.height,
      margin: margins(),
    });
    return pose;
  }
  function applyCamera() {
    if (s.userMovedCamera) return;
    const p = poseNow();
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, p.position, k);
      controls.target.lerpVectors(camFrom.target, p.target, k);
    } else {
      camera.position.copy(p.position);
      controls.target.copy(p.target);
    }
    controls.update();
  }
  stage.onBeforeRender(applyCamera);
  /** A new frame for a camera move only: the scene is as it was, so the shadows need not be drawn again (kit 1.4). */
  const redrawView = () => controls.dispatchEvent({ type: 'change' });
  /** Glide from where the camera is to the pose for the new phase. */
  function flyCamera(duration = 0.7) {
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camK = k;
        redrawView();
      },
      onComplete: () => {
        camK = 1;
        place(); // labels that wait for the camera
      },
    });
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    if (animate) flyCamera(0.8);
    else camK = 1;
    stage.invalidate();
  }
  // the view starts from the front; dragging turns it, and then the "front" button appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
    camK = 1;
  });
  stage.onResize(() => {
    s.userMovedCamera = false;
    stage.invalidate();
  });

  // ── touches: a tap on the archer or bow shoots; a drag on the string draws it ──
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects([stringHit, archer.hit, bow.root], true);
    return hits.length ? hits[0].object : null;
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      // looking at the bale (a phone): a tap anywhere on the view goes back to the archer for the next shot
      if (s.look === 'bale' && !wide() && !busy() && !s.locked && !drag && e.isPrimary !== false) {
        e.stopPropagation();
        e.preventDefault();
        return lookAtArcher();
      }
      const hit = pick(canvasPoint(e));
      if (!hit || drag) return;
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (busy()) return action.flash();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, step: 0, list: speedsFor(s.m), v0: s.v };
      capturePointer(ui.canvasHost, e.pointerId);
      emit('dragstart', snapshot());
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = drag.x - e.clientX; // pulling back = to the left
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
      drag.moved = true;
      unfreeze();
      s.token += 1;
      if (s.phase !== 'ready' || !s.shot) relax();
      if (s.look !== 'archer') {
        s.look = 'archer';
        flyCamera(0.4);
      }
      action.hide('drag');
    }
    if (!drag.moved) return;
    const n = THREE.MathUtils.clamp(Math.floor(dx / STEP_PX), 0, drag.list.length);
    if (n !== drag.step) {
      drag.step = n;
      audio.tick();
      if (n > 0) s.v = drag.list[n - 1];
      const to = n > 0 ? drawFor(s.m, s.v) : 0;
      const from = s.draw;
      tweener.animate({
        key: 'draw',
        duration: 0.12,
        ease: ease.outCubic,
        onUpdate: (k) => {
          s.draw = from + (to - from) * k;
          place();
        },
      });
      place();
    }
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    action.show('drag');
    tweener.cancel('draw');
    if (!d.moved) shoot();
    else if (d.step > 0) {
      s.draw = drawFor(s.m, s.v);
      shoot({ fromDrag: true });
    } else {
      s.v = d.v0;
      relax();
      place();
    }
    emit('dragend', snapshot());
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

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

  // ── the action: one big button, its badge on the string ─────────────────────
  const ringPoint = new THREE.Vector3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_shoot',
    icon: ICONS.drag,
    target: () => (s.phase === 'ready' && camK >= 1 ? ringPoint.set(nockX() - 0.02, NOCK_Y - 0.02, ARROW_Z) : null),
    radius: 30,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => shoot(),
  });

  // ── the test ────────────────────────────────────────────────────────────────
  /** A still scene for a question: the bow drawn, an arrow paused in the air, or arrows in the bale. */
  function sceneOf(kind, p = {}) {
    s.token += 1;
    tweener.cancel('draw');
    wobble = 0;
    clearStuck();
    if (s.shot?.mesh) world.remove(s.shot.mesh.root);
    s.shot = null;
    s.m = p.m ?? s.m;
    s.v = p.v ?? s.v;
    if (kind === 'drawn') {
      nockArrow();
      s.draw = drawFor(s.m, s.v);
      s.target = s.draw;
      startPhase('hold');
      s.phase = 'qdrawn';
    } else if (kind === 'flying') {
      nockArrow();
      const a = s.shot;
      a.v = s.v;
      a.x = 1.35;
      a.y = NOCK_Y - 0.02;
      a.slope = -0.01;
      s.draw = 0;
      s.handX = GRIP.x - BRACE - drawFor(s.m, s.v);
      s.phase = 'qfly';
    } else if (kind === 'bale') {
      s.draw = 0;
      for (const [i, sh] of p.shots.entries()) stick(sh, HITS[i % HITS.length]);
      nockArrow();
      s.phase = 'qbale';
    }
  }
  // the question scenes are still poses
  function placeQ() {
    const k = s.draw / DRAW_MAX;
    bow.set(k, -BRACE - s.draw);
    const handX = s.phase === 'qfly' ? s.handX : nockX();
    drawHand.set(handX - 0.004, NOCK_Y - 0.006, ARROW_Z + 0.004); // the fingers hook the string at the nock
    bowHand.set(GRIP.x - 0.004, GRIP.y - 0.03, ARROW_Z - 0.03);
    archer.pose({ bowHand, drawHand });
    const a = s.shot;
    if (a?.mesh) {
      const r = a.mesh.root;
      if (s.phase === 'qfly') {
        r.position.set(a.x, a.y, ARROW_Z + 0.004);
        r.rotation.set(0, 0, Math.atan(a.slope));
      } else r.position.set(nockX(), NOCK_Y, ARROW_Z + 0.004);
      r.visible = s.phase !== 'qbale';
      a.mesh.streak.visible = s.phase === 'qfly';
      a.mesh.streak.scale.x = a.v * 0.015;
    }
    stage.invalidate();
  }
  function qLabel(id, text, point, color, spots) {
    anno.add(id, { text, point: () => point, color, spots, kind: 'part' });
    shown.set(id, text);
  }
  /** The notes on wrong answers, keyed by the shown value (floats compared as text). */
  const notesOf = (pairs) => Object.fromEntries(pairs.map(([v, html]) => [plain(v), html]));
  const QUESTIONS = ['rest', 'calc', 'double', 'mass', 'work'];
  let order = QUESTIONS;
  const J = (x) => `${N(plain(x))} ${t('u_J')}`;
  const times = (r) => t('c_times', { r });
  function prepare(i) {
    const kind = order[i];
    clearLabels();
    if (kind === 'rest') {
      const m = shuffle([0.02, 0.04])[0];
      const v = shuffle(speedsFor(m).slice(1))[0];
      sceneOf('drawn', { m, v });
      const Tv = kinetic(m, v);
      qLabel('q1', t('l_rest'), new THREE.Vector3(GRIP.x + 0.35, NOCK_Y, ARROW_Z), '#3b4250', ABOVE);
      return {
        text: tx('q_rest', { v }),
        answer: 0,
        wrong: [Tv, 0.5 * m * v, 0.5 * m],
        notes: notesOf([
          [Tv, tx('n_rest_T', { T: plain(Tv) })],
          [0.5 * m * v, tx('n_rest_half')],
          [0.5 * m, tx('n_rest_m')],
        ]),
        reveal: tx('a_rest', { z: 0 }),
        unit: 'J',
      };
    }
    if (kind === 'calc') {
      const m = shuffle([...MASSES])[0];
      const v = shuffle(speedsFor(m))[0];
      sceneOf('flying', { m, v });
      const Tv = kinetic(m, v);
      const a = s.shot;
      qLabel('q1', tx('l_mv', { m: plain(m), v }), new THREE.Vector3(a.x + ARROW_LEN / 2, a.y, ARROW_Z), COLORS.v, ABOVE);
      const g = Math.round(m * 1000);
      const notes = notesOf([
        [0.5 * m * v, tx('n_calc_half')],
        [m * v * v, tx('n_calc_noHalf')],
        [0.5 * g * v * v, tx('n_calc_g', { g })],
      ]);
      return {
        text: tx('q_calc'),
        answer: Tv,
        wrong: [m * v * v, 0.5 * m * v, 0.5 * g * v * v],
        notes,
        reveal: tx('a_calc', { T: plain(Tv), m: plain(m), v }),
        unit: 'J',
      };
    }
    if (kind === 'double') {
      const m = shuffle([0.02, 0.04])[0];
      const v1 = shuffle(speedsFor(m).filter((v) => speedsFor(m).includes(2 * v)))[0];
      const shots = [
        { m, v: v1 },
        { m, v: 2 * v1 },
      ];
      sceneOf('bale', { m, v: v1, shots });
      const T1 = kinetic(m, v1);
      const T2 = kinetic(m, 2 * v1);
      const [a1, a2] = s.stuck;
      qLabel('q1', tx('l_v', { v: v1 }), a1.tail.clone().setX(a1.tail.x + 0.05), COLORS.v, TAIL);
      qLabel('q2', tx('l_v', { v: 2 * v1 }), a2.tail.clone().setX(a2.tail.x + 0.05), COLORS.v, TAIL);
      return {
        text: tx('q_double', { T: plain(T1) }),
        answer: T2,
        wrong: [2 * T1, T1, 8 * T1],
        notes: notesOf([
          [2 * T1, tx('n_double_2')],
          [T1, tx('n_double_same')],
          [8 * T1, tx('n_double_8')],
        ]),
        reveal: tx('a_double', { T1: plain(T1), T2: plain(T2), k: 4 }),
        unit: 'J',
      };
    }
    if (kind === 'mass') {
      const v = shuffle(speedsFor(0.04).slice())[0];
      const shots = shuffle([
        { m: 0.02, v },
        { m: 0.04, v },
      ]);
      sceneOf('bale', { m: 0.02, v, shots });
      for (const [j, a] of s.stuck.entries()) qLabel(`q${j}`, tx('l_m', { m: plain(a.m) }), a.tail.clone().setX(a.tail.x + 0.05), '#3b4250', TAIL);
      return {
        text: tx('q_mass', { v }),
        answer: 2,
        wrong: [4, 1, 0.5],
        notes: notesOf([
          [4, tx('n_mass_4')],
          [1, tx('n_mass_same')],
          [0.5, tx('n_mass_half')],
        ]),
        reveal: tx('a_mass', { r: 2 }),
        label: (x) => (x === 1 ? t('c_same') : x === 0.5 ? t('c_half') : times(x)),
      };
    }
    // work: ½mv² = ½mu² + W with u = 0
    const m = shuffle([...MASSES])[0];
    const v = shuffle(speedsFor(m))[0];
    const W = kinetic(m, v);
    sceneOf('flying', { m, v });
    const a = s.shot;
    qLabel('q1', tx('l_q'), new THREE.Vector3(a.x + ARROW_LEN / 2, a.y, ARROW_Z), COLORS.keText, ABOVE);
    return {
      text: tx('q_work', { W: plain(W), z: 0 }),
      answer: W,
      wrong: [0, W / 2, 2 * W],
      notes: notesOf([
        [0, tx('n_work_0')],
        [W / 2, tx('n_work_half', { z: 0 })],
        [2 * W, tx('n_work_double')],
      ]),
      reveal: tx('a_work', { W: plain(W), z: 0 }),
      unit: 'J',
    };
  }
  let qCurrent = null;
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
        s.mode = 'quiz';
        s.labels = 'quiz';
        s.locked = true;
        order = shuffle([...QUESTIONS.slice(0, 4)]).concat('work');
        // the rest question first, so no earlier scene shows a drawn bow's answer
        order = ['rest', ...order.filter((k) => k !== 'rest')];
        if (drag) drag = null;
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.labels = 'learn';
        s.locked = false;
        clearLabels();
        clearStuck();
        s.m = START.m;
        s.v = START.v;
        s.last = null;
        s.shot = null;
        relax();
        camK = 1;
        syncUI();
        place();
      },
      async prepare(i, alive, say) {
        const q = prepare(i);
        qCurrent = q;
        say(q.text);
        placeQ();
        camFrom = { position: camera.position.clone(), target: controls.target.clone() };
        camK = 0;
        const done = await tweener.animate({
          key: 'camera',
          duration: 0.6,
          onUpdate: (k) => ((camK = k), redrawView()),
          onComplete: () => (camK = 1),
        }).finished;
        if (!alive()) return null;
        if (!done) camK = 1;
        const choices = choicesFrom(q.answer, q.wrong);
        return {
          choices,
          expected: q.answer,
          tolerance: 1e-6,
          label: q.label || ((x) => J(x)),
          meta: { kind: order[i] },
        };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        const why = !correct && picked ? q.notes[plain(picked.value)] : '';
        return `${q.reveal}${why ? ` <span class="ke-why">${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    controls.enableRotate = !s.locked;
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  let lastStep = { act: '', at: 0 };
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    const act = b.dataset.act;
    if (act === 'q-next') quiz.next();
    if (act === 'q-again') quiz.start();
    if (act === 'home') home();
    if (act === 'm-' || act === 'm+' || act === 'v-' || act === 'v+') {
      const now = performance.now();
      if (act === lastStep.act && now - lastStep.at < 120) return; // a bounce, not a second tap
      lastStep = { act, at: now };
      if (act === 'm-') stepM(-1);
      if (act === 'm+') stepM(1);
      if (act === 'v-') stepV(-1);
      if (act === 'v+') stepV(1);
    }
    if (act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    // ← → the speed (how far the string is drawn), ↑ ↓ the arrow's mass
    const dv = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    const dm = { ArrowUp: 1, ArrowDown: -1 }[e.key];
    if (dv || dm) {
      e.preventDefault();
      if (s.mode === 'quiz') return lockedNudge();
      return dv ? stepV(dv) : stepM(dm);
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      shoot();
    }
  });
  function home() {
    if (s.locked) return lockedNudge();
    clearStuck();
    s.m = START.m;
    s.v = START.v;
    s.last = null;
    s.seen = { v2: false, m: false };
    s.count = 0;
    s.look = 'archer';
    relax();
    flyCamera();
    place();
    emitChange();
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const now = s.stuck.at(-1);
    return {
      m: s.m,
      v: s.v,
      T: kinetic(s.m, s.v),
      draw: +drawFor(s.m, s.v).toFixed(4),
      phase: s.phase,
      arrow: s.shot && flying() ? { x: +s.shot.x.toFixed(3), y: +s.shot.y.toFixed(3) } : null,
      shots: s.stuck.map((a) => ({ m: a.m, v: a.v, T: a.T, depth: +a.depth.toFixed(4) })),
      last: now ? { m: now.m, v: now.v, T: now.T } : null,
      ratio: s.last ? { m: s.last.rm.value, v: s.last.rv.value, T: s.last.rt.value } : null,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.m, snap.v, snap.shots.length, snap.phase]);
    if (key !== lastEmit) {
      lastEmit = key;
      emit('change', snap);
    }
  }

  /** Jump to a still state (pictures, the book): no animation. */
  function jumpTo(st) {
    s.token += 1;
    s.frozen = false;
    s.look = st === 'compare' || st === 'hit' ? 'bale' : 'archer';
    tweener.cancel('draw');
    wobble = 0;
    clearStuck();
    s.last = null;
    s.shot = null;
    s.handX = null;
    if (st === 'compare' || st === 'hit') {
      const shots =
        st === 'compare'
          ? [
              { m: s.m, v: speedsFor(s.m).includes(s.v / 2) ? s.v / 2 : s.v },
              { m: s.m, v: s.v },
            ]
          : [{ m: s.m, v: s.v }];
      for (const [i, sh] of shots.entries()) stick(sh, HITS[i % HITS.length]);
      if (s.stuck.length > 1) {
        const [p, n] = s.stuck;
        s.last = { rm: ratio(1, 1), rv: ratio(n.v, p.v), rt: energyRatio(n, p) };
        if (s.last.rv.value === 2) s.seen.v2 = true;
      }
      s.count = s.stuck.length;
      s.draw = 0;
      nockArrow();
      startPhase('stuck');
    } else if (st === 'drawn') {
      nockArrow();
      s.draw = drawFor(s.m, s.v);
      s.target = s.draw;
      startPhase('held'); // held until the student acts
    } else if (st === 'flying') {
      nockArrow();
      const a = s.shot;
      a.v = s.v;
      a.T = kinetic(s.m, s.v);
      a.depth = depthIn(a.T);
      a.x = 1.25;
      a.y = NOCK_Y - 0.01;
      a.vy = 0;
      a.slope = -0.005;
      s.handX = GRIP.x - BRACE - drawFor(s.m, s.v);
      startPhase('fly');
      s.frozen = true;
    } else {
      nockArrow();
      s.draw = 0;
      startPhase('ready');
    }
    camK = 1;
    place();
  }
  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  setView(s.view, { animate: false });
  jumpTo(o.stage);
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
      if (p.view) setView(p.view, { animate: p.animate !== false });
      if (p.m != null && MASSES.includes(Number(p.m))) s.m = Number(p.m);
      if (p.v != null) s.v = clampV(s.m, Number(p.v));
      if (p.stage) jumpTo(p.stage);
      else if (p.m != null || p.v != null) {
        relax();
        place();
      }
      if (p.shoot) {
        shoot();
        if (p.animate === false) {
          // run the whole shot at once
          for (let i = 0; i < 4000 && busy(); i++) {
            s.clock += 1 / 30;
            step(1 / 30);
          }
          camK = 1;
          place();
        }
      }
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.seen = { v2: false, m: false };
      s.count = 0;
      s.m = START.m;
      s.v = START.v;
      setView('front', { animate: false });
      jumpTo('ready');
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture(opts = {}) {
      const before = scene.background;
      if (opts.background !== undefined) scene.background = null;
      try {
        return stage.capture(opts);
      } finally {
        scene.background = before;
        stage.invalidate();
      }
    },
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'KineticEnergy';
      for (const r of [archer.root, bow.root, bale.root, ...s.stuck.map((a) => a.mesh.root), s.shot?.mesh.root].filter(Boolean)) copy.add(r.clone());
      return copy;
    },
  };
}
