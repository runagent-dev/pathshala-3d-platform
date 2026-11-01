// পদার্থের আণবিক গতিতত্ত্ব (page 152–153, topic 5.6.1), an animation as a pure function of time (shared/lib/timeline.js).
// How a solid, a liquid and a gas each press on what holds them; the book's নিজে করো (a balloon with sellotape on it,
// pierced through the tape: it does not burst and the air streams out); then inside the balloon: molecules hit the
// wall and bounce back, the force on the wall and the equal reaction on the molecule (Newton's third law), countless
// hits adding up to the gas's pressure; and a hint that heating raises it.
//
// One scene: the room on top and the molecules far below it. The main camera looks at the room; a second camera looks
// at the molecules, drawn into a round magnifier beside a container, or opened like an iris to fill the view when we go
// inside the balloon. render(t) sets everything from t, so the parts can be jumped to and the video renders exact frames.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTimeline, markAt } from '@shared/timeline.js';
import { ICONS } from '@shared/student/icons.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { boldArrow } from './arrows.js';
import { CUES, createI18n, STEPS } from './i18n.js';
import { buildMicro, WALL } from './micro.js';
import { balloonScale, clock, clockRate, lerp, smooth, windowed } from './motion.js';
import { BALLOON, buildWorld, HOLE_Y, TANK, TAPE, X, balloonNormal, balloonPoint } from './world.js';

export const DEFAULTS = { autoplay: true, loop: true, lang: 'bn', numerals: null, bg: 'light' };

export const DURATION = 78;
const COLOR = { pressure: '#e03131', force: '#7048e8', momentum: '#2f9e44', heat: '#e8590c' };

/** Every time the story uses, in seconds. */
export const K = {
  balloon: { small: 0.3, inflate: [28.6, 31.4], leak: [38.6, 45], leaked: 0.8, freshAt: 45, hot: 1.07, swell: [70.5, 73] },
  tape: [32.6, 34],
  needle: [35.3, 38.6],
  pierce: 37.2,
  dip: [44.6, 45.4],
  irisOpen: [46.4, 47.9],
  irisClose: [61.2, 62.6],
  clock: [
    [50.2, 1],
    [50.8, 0.35],
    [52.0, 0.35],
    [52.25, 0],
    [55.5, 0],
    [55.8, 0.35],
    [57.6, 0.35],
    [58.3, 1],
    [66.8, 1],
    [70, 1.9],
  ],
  focus: [50.4, 58.2],
  hit: 52.25,
  release: 55.5,
};

const SHOTS = {
  solid: { target: [X.solid, 0.03, 0.02], R: 0.15, dir: [0.25, 0.3, 1], lens: 1, look: [X.solid, 0.06, 0] },
  liquid: { target: [X.liquid + 0.05, 0.1, 0.02], R: 0.215, dir: [0.2, 0.28, 1], lens: 1, look: [X.liquid, 0.08, 0] },
  gas: { target: [X.gas, 0.1, 0.02], R: 0.17, dir: [0.15, 0.28, 1], lens: 1, look: [X.gas, 0.1, 0] },
  balloon: { target: [X.balloon, 0.27, 0], R: 0.25, dir: [0.12, 0.16, 1], lens: 0 },
  tape: { target: 'tape', R: 0.12, dir: [-0.3, 0.2, 1], lens: 0 },
  leak: { target: [X.balloon + 0.09, 0.31, 0], R: 0.25, dir: [0.18, 0.16, 1], lens: 0 },
  inside: { target: 'centre', R: 0.115, dir: [0.04, 0.08, 1], lens: 0 },
  pressure: { target: 'centre', R: 0.25, dir: [0.04, 0.08, 1], lens: 0 },
  heat: { target: [X.balloon + 0.13, 0.3, 0], R: 0.3, dir: [0.08, 0.14, 1], lens: 1, look: 'centre' },
};
const SHOT_TIMES = [
  [0, 'solid'],
  [9, 'liquid'],
  [19, 'gas'],
  [28, 'balloon'],
  [34.8, 'tape'],
  [39, 'leak'],
  [45, 'balloon'],
  [45.6, 'inside'],
  [61.6, 'pressure'],
  [66.5, 'heat'],
];
const MOVE = 1.4; // seconds for the camera to move to the next shot

/** What the magnifier shows when: [from, to, which close-up, caption key]. */
const LENS = [
  [3, 9, 'solid', 'lens_solid'],
  [11.4, 19, 'liquid', 'lens_liquid'],
  [21, 28, 'gas', 'lens_gas'],
  [67.6, DURATION + 1, 'wall', 'lens_hot'],
];

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'anim', 'kt');
  root.dataset.theme = o.bg;
  root.lang = t.lang;
  root.innerHTML = `
    <div class="pvc-stage kt-stage" role="img" aria-label="${t('aria_stage')}">
      <div class="pvc-canvas"></div>
      <svg class="kt-leader" aria-hidden="true"><line/></svg>
      <div class="pvc-anno-layer kt-anno"></div>
      <div class="kt-lens" aria-hidden="true"><i></i><span class="kt-lens-cap"></span></div>
      <div class="kt-iris" aria-hidden="true"></div>
      <div class="kt-dip" aria-hidden="true"></div>
      <div class="kt-note"></div>
    </div>
    <div class="anim-panel">
      <p class="anim-caption" aria-live="polite"></p>
      <div class="anim-controls">
        <button class="pvc-btn anim-play" data-act="play"></button>
        <div class="anim-steps" role="group" aria-label="${t('parts')}">${STEPS.map((s, i) => `<button data-step="${i}">${t(`${s.key}_short`)}</button>`).join('')}</div>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const el = {
    caption: $('.anim-caption'),
    lens: $('.kt-lens'),
    lensCap: $('.kt-lens-cap'),
    iris: $('.kt-iris'),
    dip: $('.kt-dip'),
    note: $('.kt-note'),
    leader: $('.kt-leader'),
    leaderLine: $('.kt-leader line'),
    chips: [...root.querySelectorAll('[data-step]')],
  };

  // ── scene ───────────────────────────────────────────────────────────────────
  const stage = createStage($('.pvc-canvas'), { fov: 30, near: 0.01, far: 200, environment: 'room', environmentIntensity: 0.9 });
  const { camera, controls, scene, renderer } = stage;
  controls.enabled = false; // an animation, not a viewer
  controls.enableDamping = false; // the stage still calls controls.update(): keep its target on ours
  scene.background = new THREE.Color('#173f93');
  const key = new THREE.DirectionalLight('#fff4e0', 2.2);
  key.position.set(-1.5, 3, 2.5);
  const fill = new THREE.HemisphereLight('#cfe3ff', '#7b4524', 0.9);
  scene.add(key, fill);

  const world = buildWorld();
  world.room.children[0].userData.noExport = true; // the wall picture stays out of the GLB
  scene.add(world.model);
  const micro = buildMicro();
  scene.add(micro.group);
  const W = micro.wall;

  // arrows: pressure (red) on what holds each substance, forces (purple) and momentum (green) at the wall
  const S = 0.0042; // world arrows' shaft radius (m)
  const pressureArrow = (name) => {
    const a = boldArrow({ name, color: COLOR.pressure, size: S });
    world.model.add(a.root);
    return a;
  };
  const solidArrows = [-0.07, -0.035, 0, 0.035, 0.07].map((x, i) => ({ a: pressureArrow(`SolidPressure${i}`), x }));
  const tankArrows = [];
  {
    const { w, wall, level } = TANK;
    const len = (depth) => 0.014 + 0.17 * depth; // deeper, more pressure
    for (const x of [-0.06, 0, 0.06]) tankArrows.push({ tip: [x, wall, 0], dir: [0, -1, 0], len: len(level - wall) });
    for (const y of [0.115, 0.075, 0.035]) {
      tankArrows.push({ tip: [-w / 2 + wall, y, 0], dir: [-1, 0, 0], len: len(level - y) });
      tankArrows.push({ tip: [w / 2 - wall, y, -0.02], dir: [1, 0, 0], len: len(level - y) });
    }
    tankArrows.forEach((s, i) => (s.a = pressureArrow(`LiquidPressure${i}`)));
  }
  const gasArrows = [];
  {
    const { w, h, wall } = TANK;
    const L = 0.034;
    for (const x of [-0.06, 0, 0.06]) {
      gasArrows.push({ tip: [x, h - wall, 0], dir: [0, 1, 0], len: L });
      gasArrows.push({ tip: [x, wall, 0], dir: [0, -1, 0], len: L });
    }
    for (const y of [0.06, 0.14]) {
      gasArrows.push({ tip: [-w / 2 + wall, y, 0], dir: [-1, 0, 0], len: L });
      gasArrows.push({ tip: [w / 2 - wall, y, 0], dir: [1, 0, 0], len: L });
    }
    gasArrows.forEach((s, i) => (s.a = pressureArrow(`GasPressure${i}`)));
  }
  const balloonArrows = Array.from({ length: 14 }, (_, i) => pressureArrow(`BalloonPressure${i}`));
  // inside the balloon (local units of the wall close-up)
  const MS = 0.016;
  const microArrow = (name, color, dashed = false, size = MS) => {
    const a = boldArrow({ name, color, size, dashed });
    W.group.add(a.root);
    return a;
  };
  const pIn = microArrow('MomentumBefore', COLOR.momentum);
  const pOut = microArrow('MomentumAfter', COLOR.momentum);
  const fWall = microArrow('ForceOnWall', COLOR.force);
  const fMol = microArrow('ReactionOnMolecule', COLOR.force, true);
  const flashes = Array.from({ length: 12 }, (_, i) => microArrow(`HitForce${i}`, COLOR.force, false, MS * 0.75));

  // ── layout: the magnifier's place and the room left for the subject ─────────
  const lay = { W: 1, H: 1, wide: false, d: 150, lx: 0, ly: 0 };
  function layout() {
    lay.W = stage.width;
    lay.H = stage.height;
    lay.wide = lay.W / lay.H > 1.15;
    lay.d = Math.round(Math.max(118, Math.min(250, lay.wide ? lay.H * 0.56 : lay.W * 0.44, lay.H * 0.46)));
    lay.lx = lay.W - lay.d / 2 - 10;
    lay.ly = lay.wide ? lay.H * 0.42 : lay.d / 2 + 10;
    el.lens.style.width = el.lens.style.height = `${lay.d}px`;
    // inside the balloon: the wall on top on tall screens, on the right on wide ones
    W.group.rotation.z = lay.wide ? -Math.PI / 2 : 0;
    W.group.updateMatrixWorld(true);
  }

  // ── cameras ─────────────────────────────────────────────────────────────────
  const V = (a) => new THREE.Vector3(...a);
  const balloonCentre = (out = new THREE.Vector3()) => {
    world.balloon.balloon.updateMatrixWorld(true);
    return world.balloon.balloon.localToWorld(out.set(0, BALLOON.Ry + BALLOON.knot, 0));
  };
  function shotTarget(name, out) {
    const s = SHOTS[name];
    if (s.target === 'centre') {
      // the balloon's middle when blown up, not as it is now (the camera should not bob as it grows)
      return out.set(X.balloon, BALLOON.stick + BALLOON.Ry + BALLOON.knot, 0);
    }
    if (s.target === 'tape') {
      const p = balloonPoint(TAPE.theta, TAPE.phi, out);
      return p.add(V([X.balloon, BALLOON.stick, 0]));
    }
    return out.set(...s.target);
  }
  const camPose = { target: new THREE.Vector3(), dir: new THREE.Vector3(), R: 0.2, lens: 0 };
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  function poseAt(time) {
    let i = 0;
    while (i + 1 < SHOT_TIMES.length && SHOT_TIMES[i + 1][0] <= time) i++;
    const [at, name] = SHOT_TIMES[i];
    const prev = SHOT_TIMES[Math.max(0, i - 1)][1];
    const u = i === 0 ? 1 : smooth(time, at, at + MOVE);
    const a = SHOTS[prev];
    const b = SHOTS[name];
    camPose.target.copy(shotTarget(prev, tmpA)).lerp(shotTarget(name, tmpB), u);
    camPose.dir.copy(V(a.dir).normalize()).lerp(V(b.dir).normalize(), u).normalize();
    camPose.R = Math.exp(lerp(Math.log(a.R), Math.log(b.R), u));
    camPose.lens = lerp(a.lens, b.lens, u);
    return camPose;
  }
  /** Points the main camera at the pose, fitting R into the part of the view the magnifier leaves free. */
  function placeCamera(pose) {
    const { W: w, H: h, d, wide } = lay;
    const k = pose.lens;
    // the subject may run a little under the glass's edge: keep 80% of its width (or height) free
    const free = wide ? { x: 0, y: 0, w: w - k * 0.8 * (d + 16), h } : { x: 0, y: k * 0.8 * (d + 14), w, h: h - k * 0.8 * (d + 14) };
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const tanH = tanV * (w / h);
    const dist = pose.R / Math.min(tanV * (free.h / h), tanH * (free.w / w));
    camera.position.copy(pose.target).addScaledVector(pose.dir, dist);
    camera.lookAt(pose.target);
    controls.target.copy(pose.target);
    camera.setViewOffset(w, h, w / 2 - (free.x + free.w / 2), h / 2 - (free.y + free.h / 2), w, h);
    camera.updateMatrixWorld(true);
  }

  // inside the balloon: a camera that frames the wall close-up (local box, turned with the group)
  const microCam = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
  const BOX = { x0: -0.62, x1: 0.62, y0: -1.05, y1: 0.24 };
  function placeMicroCamera(cam, aspect, box = BOX) {
    const cx = (box.x0 + box.x1) / 2;
    const cy = (box.y0 + box.y1) / 2;
    const bw = box.x1 - box.x0;
    const bh = box.y1 - box.y0;
    // on wide screens the group is turned a quarter: the box's height runs across the screen
    const [sw, sh] = lay.wide ? [bh, bw] : [bw, bh];
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const dist = Math.max(sh / 2 / tanV, sw / 2 / (tanV * aspect)) + 0.3;
    const c = W.group.localToWorld(new THREE.Vector3(cx, cy, 0.3));
    cam.aspect = aspect;
    cam.position.set(c.x, c.y, c.z + dist);
    cam.up.set(0, 1, 0);
    cam.lookAt(c);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
  }
  // the magnifier's own camera, square
  const lensCam = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
  function placeLensCamera(which) {
    if (which === 'wall') return placeMicroCamera(lensCam, 1, { x0: -0.55, x1: 0.55, y0: -0.86, y1: 0.24 });
    const c = micro.CENTRE[which];
    const tanV = Math.tan(THREE.MathUtils.degToRad(lensCam.fov / 2));
    lensCam.aspect = 1;
    lensCam.position.set(c.x, c.y, c.z + 0.5 / tanV + 0.05);
    lensCam.lookAt(c);
    lensCam.updateProjectionMatrix();
  }

  // the round view (magnifier or iris) is a second render into a texture, drawn as a disc over the canvas
  const rt = new THREE.WebGLRenderTarget(512, 512, { samples: 4, type: THREE.HalfFloatType });
  const overlayScene = new THREE.Scene();
  const overlayCam = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 96),
    new THREE.MeshBasicMaterial({ map: rt.texture, depthTest: false, depthWrite: false }),
  );
  overlayScene.add(disc);
  const round = { on: false, x: 0, y: 0, d: 0, cam: lensCam, iris: false };
  stage.onAfterRender(() => {
    if (!round.on) return;
    const dpr = renderer.getPixelRatio();
    const size = Math.min(1024, Math.max(64, Math.round(round.d * dpr)));
    if (rt.width !== size) rt.setSize(size, size);
    const prevTarget = renderer.getRenderTarget();
    const prevAuto = renderer.autoClear;
    micro.group.visible = true;
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, round.cam);
    renderer.setRenderTarget(prevTarget);
    overlayCam.right = stage.width;
    overlayCam.bottom = -stage.height;
    overlayCam.updateProjectionMatrix();
    disc.scale.set(round.d - 4, round.d - 4, 1);
    disc.position.set(round.x, -round.y, 0);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlayScene, overlayCam);
    renderer.autoClear = prevAuto;
  });

  // ── labels ──────────────────────────────────────────────────────────────────
  const anno = createAnnotations({
    stage,
    layer: $('.kt-anno'),
    avoid: [el.note, () => (round.on && !round.iris ? [lensBox(), capBox()] : null), () => leaderBox(), () => arrowBoxes(), () => balloonBox()],
  });
  // every arrow on screen, so a label never sits on one
  const roomArrows = [...solidArrows.map((s) => s.a), ...tankArrows.map((s) => s.a), ...gasArrows.map((s) => s.a), ...balloonArrows];
  const insideArrows = [pIn, pOut, fWall, fMol, ...flashes];
  const sp = new THREE.Vector3();
  const toScreen = (p) => (sp.copy(p).project(camera), { x: (sp.x * 0.5 + 0.5) * lay.W, y: (-sp.y * 0.5 + 0.5) * lay.H });
  function arrowBoxes() {
    const out = [];
    for (const a of micro.group.userData.inside ? insideArrows : roomArrows) {
      const e = a.ends();
      if (!e) continue;
      const p = toScreen(e[0]);
      const q = toScreen(e[1]);
      out.push({ left: Math.min(p.x, q.x) - 7, top: Math.min(p.y, q.y) - 7, right: Math.max(p.x, q.x) + 7, bottom: Math.max(p.y, q.y) + 7 });
    }
    return out;
  }
  const capBox = () => {
    const a = el.lensCap.getBoundingClientRect();
    const o = el.lens.parentElement.getBoundingClientRect();
    return { left: a.left - o.left - 4, top: a.top - o.top - 4, right: a.right - o.left + 4, bottom: a.bottom - o.top + 4 };
  };
  // the balloon itself, so a label about its pressure sits outside it
  function balloonBox() {
    if (micro.group.userData.inside || !pts.centre) return null;
    const s = world.balloon.balloon.scale.x;
    const c = toScreen(pts.centre);
    const e = toScreen(v1.copy(pts.centre).addScaledVector(camera.up, BALLOON.Ry * s));
    const r = Math.hypot(e.x - c.x, e.y - c.y) * 0.85;
    return { left: c.x - r * 0.85, top: c.y - r, right: c.x + r * 0.85, bottom: c.y + r };
  }
  const lensBox = () => ({
    left: round.x - round.d / 2 - 4,
    top: round.y - round.d / 2 - 4,
    right: round.x + round.d / 2 + 4,
    bottom: round.y + round.d / 2 + 30,
  });
  const leader = { on: false, x1: 0, y1: 0, x2: 0, y2: 0 };
  const leaderBox = () =>
    leader.on
      ? {
          left: Math.min(leader.x1, leader.x2),
          top: Math.min(leader.y1, leader.y2),
          right: Math.max(leader.x1, leader.x2),
          bottom: Math.max(leader.y1, leader.y2),
        }
      : null;

  const SIDE = [
    { dx: 70, dy: -40 },
    { dx: -70, dy: -40 },
    { dx: 70, dy: 40 },
    { dx: -70, dy: 40 },
    { dx: 0, dy: -60 },
    { dx: 0, dy: 60 },
  ];
  const FAR = [
    { dx: 110, dy: -80 },
    { dx: -110, dy: -80 },
    { dx: 120, dy: 20 },
    { dx: -120, dy: 20 },
    { dx: 60, dy: 110 },
    { dx: -60, dy: 110 },
  ];
  const UPFIRST = [SIDE[4], SIDE[0], SIDE[1], SIDE[5], SIDE[2], SIDE[3], ...FAR];
  const DOWNFIRST = [SIDE[5], SIDE[2], SIDE[3], SIDE[4], SIDE[0], SIDE[1], ...FAR];
  const LEFTFIRST = [SIDE[1], SIDE[3], SIDE[4], SIDE[0], SIDE[5], SIDE[2], ...FAR];
  const BELOWLEFT = [{ dx: -10, dy: 75 }, { dx: -40, dy: 60 }, SIDE[3], SIDE[1], SIDE[5], ...FAR];
  const RIGHTFIRST = [SIDE[0], SIDE[2], SIDE[4], SIDE[1], SIDE[5], SIDE[3], ...FAR];
  const pts = {}; // live points the labels read (world space), updated in render
  const P = (name) => () => pts[name] || tmpA.set(0, -1000, 0);
  const LABELS = [
    ['l_solid', 0.6, 9, 'brickTop', UPFIRST, 'part'],
    ['l_touch', 2, 9, 'solidArrows', DOWNFIRST, 'callout', COLOR.pressure],
    ['l_table', 0.6, 9, 'table', LEFTFIRST, 'part'],
    ['l_liquid', 10, 19, 'water', LEFTFIRST, 'part'],
    ['l_sides', 11.2, 19, 'tankLeft', BELOWLEFT, 'callout', COLOR.pressure],
    ['l_vessel', 10, 13.6, 'tankRim', UPFIRST, 'part'],
    ['l_hole', 13.8, 19, 'hole', RIGHTFIRST, 'part'],
    ['l_jet', 15.2, 19, 'jet', RIGHTFIRST, 'callout', '#1864ab'],
    ['l_gas', 19.8, 28, 'gasCentre', LEFTFIRST, 'part'],
    ['l_closed', 19.8, 28, 'lid', UPFIRST, 'part'],
    ['l_all', 21.2, 28, 'gasLeft', LEFTFIRST, 'callout', COLOR.pressure],
    ['l_balloon', 29.6, 34.8, 'balloonSide', LEFTFIRST, 'part'],
    ['l_tape', 33.6, 44.6, 'tape', RIGHTFIRST, 'part'],
    ['l_needle', 35.6, 38.6, 'needleEnd', UPFIRST, 'part'],
    ['l_air', 39.4, 44.6, 'air', RIGHTFIRST, 'callout', '#1864ab'],
    ['l_wall', 48.2, 61.2, 'wall', LEFTFIRST, 'part'],
    ['l_molecule', 48.2, 50.4, 'molecule', RIGHTFIRST, 'part'],
    ['l_p_in', 50.9, K.hit + 0.15, 'pInTip', LEFTFIRST, 'callout', COLOR.momentum],
    ['l_on_wall', 52.4, 55.6, 'fWallTip', RIGHTFIRST, 'callout', COLOR.force],
    ['l_on_mol', 52.4, 55.6, 'fMolTip', RIGHTFIRST, 'callout', COLOR.force],
    ['l_p_out', 55.9, 58.2, 'pOutTip', RIGHTFIRST, 'callout', COLOR.momentum],
    ['l_hits', 58.6, 61.2, 'flash', DOWNFIRST, 'callout', COLOR.force],
    ['l_pressure', 62.8, 66.5, 'pressureTip', RIGHTFIRST, 'callout', COLOR.pressure],
    ['l_heat', 67.2, DURATION + 1, 'lamp', UPFIRST, 'callout', COLOR.heat],
    ['l_more', 72, DURATION + 1, 'pressureTip', LEFTFIRST, 'callout', COLOR.pressure],
  ];
  let labelSig = '';
  function syncLabels(time) {
    const on = LABELS.filter(([, a, b]) => time >= a && time < b);
    const sig = on.map((l) => l[0]).join(',');
    if (sig === labelSig) return;
    labelSig = sig;
    anno.clear();
    for (const [k, , , point, spots, kind, color] of on) anno.add(k, { text: t(k), point: P(point), spots, kind, color, optional: kind === 'part' });
  }

  // ── the animation: everything from t ────────────────────────────────────────
  const listeners = new Map();
  const emit = (type, payload) => {
    for (const fn of listeners.get(type) || []) fn(payload);
  };
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  const UPV = new THREE.Vector3(0, 1, 0);
  let step = -1;
  let cue = -1;

  function renderBalloon(time) {
    const B = world.balloon;
    const s = balloonScale(time, K.balloon);
    // a just-blown balloon is a bit longer than round
    B.balloon.scale.set(s, s * (1 + 0.1 * (1 - s)), s);
    B.balloon.updateMatrixWorld(true);
    const fresh = time >= K.balloon.freshAt;
    // the sellotape, smoothed on from one end
    const tapeU = fresh ? 0 : smooth(time, ...K.tape);
    B.tape.visible = tapeU > 0;
    B.tape.geometry.setDrawRange(0, Math.ceil(tapeU * 24) * B.tape.userData.indexPerColumn);
    B.tapeEdge.visible = !fresh && time >= K.tape[1];
    B.hole.visible = !fresh && time >= K.pierce;
    // the needle: in along the hole's normal, through the tape, and out again
    const [n0, n1] = K.needle;
    B.needle.visible = !fresh && time >= n0 && time < n1;
    const holeW = B.balloon.localToWorld(v1.copy(B.holePoint));
    const nW = v2.copy(B.holeNormal).transformDirection(B.balloon.matrixWorld);
    if (B.needle.visible) {
      const inT = smooth(time, n0, 36.8);
      const push = smooth(time, 36.8, K.pierce);
      const out = smooth(time, 37.6, n1);
      const gap = lerp(0.14, 0, inT) - 0.008 * push + 0.008 * out + 0.16 * out;
      B.needle.position.copy(holeW).addScaledVector(nW, gap);
      B.needle.quaternion.setFromUnitVectors(UPV, nW);
      pts.needleEnd = v3.copy(B.needle.position).addScaledVector(nW, 0.07).clone();
    }
    pts.tape = B.balloon.localToWorld(balloonPoint(TAPE.theta, TAPE.phi - TAPE.dPhi * 0.7, new THREE.Vector3()));
    // air streaming out of the hole, while it leaks
    const leakT = time - K.balloon.leak[0];
    B.puffs.visible = !fresh && leakT > 0;
    if (B.puffs.visible) {
      const strength = 1 - 0.55 * smooth(time, ...K.balloon.leak);
      const side = v3.copy(nW).cross(UPV).normalize();
      const n = B.puffs.count;
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const p = new THREE.Vector3();
      const sc = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const phase = i / n;
        const age = (leakT / 1.1 + phase) % 1;
        const born = leakT >= phase * 1.1;
        const wob = Math.sin(i * 2.4) * 0.5;
        const up = Math.cos(i * 1.7) * 0.4;
        p.copy(holeW)
          .addScaledVector(nW, 0.006 + 0.22 * age * strength)
          .addScaledVector(side, wob * 0.07 * age)
          .addScaledVector(UPV, up * 0.06 * age + 0.03 * age * age);
        const r = born && age < 0.96 ? (0.003 + 0.011 * age) * (0.6 + 0.4 * strength) : 0;
        m.compose(p, q, sc.setScalar(r));
        B.puffs.setMatrixAt(i, m);
      }
      B.puffs.instanceMatrix.needsUpdate = true;
      pts.air = holeW.clone().addScaledVector(nW, 0.12 * strength);
    }
    const c = balloonCentre(new THREE.Vector3());
    pts.balloonSide = c.clone().add(v3.set(-BALLOON.R * s * 0.95, 0.02, 0));
    pts.centre = c;
    return { s, c };
  }

  function renderPressureArrows(time, centre) {
    const show = windowed(time, 62.2, DURATION + 2, 0.8);
    const grow = 1 + 0.5 * smooth(time, ...K.balloon.swell);
    // in the plane facing the camera: point on the skin in that direction, along the skin's normal there
    const view = v1.copy(V(SHOTS.pressure.dir)).normalize();
    const right = v2.copy(UPV).cross(view).normalize();
    const up = new THREE.Vector3().copy(view).cross(right).normalize();
    balloonArrows.forEach((a, i) => {
      const ang = -Math.PI / 2 + ((i + 0.5) / balloonArrows.length) * Math.PI * 2;
      if (Math.abs(Math.sin(ang) + 1) < 0.08 || show <= 0) return a.hide(); // not on the knot
      const dir = new THREE.Vector3().addScaledVector(right, Math.cos(ang)).addScaledVector(up, Math.sin(ang));
      const local = world.balloon.balloon.worldToLocal(dir.clone().add(centre)).sub(v3.set(0, BALLOON.Ry + BALLOON.knot, 0));
      const theta = Math.acos(THREE.MathUtils.clamp(local.y / local.length(), -1, 1));
      const phi = Math.atan2(local.x, local.z);
      const p = world.balloon.balloon.localToWorld(balloonPoint(theta, phi, new THREE.Vector3()));
      const n = balloonNormal(theta, phi, new THREE.Vector3()).transformDirection(world.balloon.balloon.matrixWorld);
      const len = 0.055 * grow * show;
      a.set(p.addScaledVector(n, 0.004), n, len, show);
      if (i === 4) pts.pressureTip = p.clone().addScaledVector(n, len);
    });
  }

  function renderMolecules(time) {
    const tau = clock(time, K.clock);
    const rate = clockRate(time, K.clock);
    micro.states.update(time);
    const [f0, f1] = K.focus;
    const following = windowed(time, f0, f1, 0.4);
    W.update(tau, following * 0.8);
    // the molecule we follow: in towards the wall, held at the moment of the hit, out the other way
    const r = WALL.r;
    const H = v1.set(0.05, -r, 0.05);
    const dIn = v2.set(0.45, 1, 0).normalize();
    const speed = 0.55;
    const tauHit = clock(K.hit, K.clock);
    const focusOn = time >= f0 && time < f1;
    W.focus.visible = focusOn;
    const fp = new THREE.Vector3();
    if (focusOn) {
      if (tau <= tauHit) fp.copy(H).addScaledVector(dIn, -speed * (tauHit - tau));
      else fp.copy(H).add(v3.set(dIn.x, -dIn.y, 0).multiplyScalar(speed * (tau - tauHit)));
      const squash = windowed(time, K.hit - 0.05, K.release + 0.15, 0.2);
      const grow = smooth(time, f0, f0 + 0.3) * (1 - smooth(time, f1 - 0.4, f1));
      W.focus.position.copy(fp);
      W.focus.scale.set(r * (1 + 0.12 * squash) * grow, r * (1 - 0.16 * squash) * grow, r * grow);
    }
    const len = 0.3;
    const aIn = windowed(time, 50.7, K.hit + 0.2, 0.2);
    const aF = windowed(time, K.hit + 0.15, K.release + 0.2, 0.25);
    const aOut = windowed(time, K.release + 0.2, f1, 0.25);
    if (focusOn && aIn > 0) {
      pIn.set(fp.clone().addScaledVector(dIn, r * 1.2), dIn, len, aIn);
      pts.pInTip = W.group.localToWorld(fp.clone().addScaledVector(dIn, len * 0.5));
    } else pIn.hide();
    if (focusOn && aF > 0) {
      fWall.set(v3.set(H.x, 0, H.z), UPV, len, aF);
      pts.fWallTip = W.group.localToWorld(new THREE.Vector3(H.x, len * 0.75, H.z));
      fMol.set(fp.clone().add(v3.set(0, -r * 1.1, 0)), v3.set(0, -1, 0), len, aF);
      pts.fMolTip = W.group.localToWorld(new THREE.Vector3(fp.x, fp.y - len * 0.8, fp.z));
    } else {
      fWall.hide();
      fMol.hide();
    }
    if (focusOn && aOut > 0) {
      const dOut = v3.set(dIn.x, -dIn.y, 0);
      pOut.set(fp.clone().addScaledVector(dOut, r * 1.2), dOut, len, aOut);
      pts.pOutTip = W.group.localToWorld(fp.clone().addScaledVector(dOut, len * 0.6));
    } else pOut.hide();
    // a purple force on the wall at every hit (not while we follow one molecule)
    const flashOn = (time >= 48.4 && time < 50.4) || (time >= 58.3 && time < K.irisClose[1]) || time >= LENS[3][0];
    const within = 0.5 * Math.max(rate, 0.3);
    const hits = flashOn ? W.hits(tau, within).sort((a, b) => a.age - b.age) : [];
    flashes.forEach((a, i) => {
      const h = hits[i];
      if (!h) return a.hide();
      const fade = 1 - h.age / within;
      a.set(v3.set(h.x, 0, h.z), UPV, 0.42 * h.speed * Math.max(1, rate) * (0.6 + 0.4 * fade), fade);
    });
    if (hits.length) pts.flash = W.group.localToWorld(new THREE.Vector3(hits[0].x, 0.05, hits[0].z));
    else pts.flash = W.group.localToWorld(new THREE.Vector3(0.2, 0.05, 0));
    pts.wall = W.group.localToWorld(new THREE.Vector3(-0.38, WALL.thick * 0.6, 0.2));
    pts.molecule = W.group.localToWorld(W.positionOf(3, tau, new THREE.Vector3()));
  }

  function render(time) {
    if (!(lay.W > 1)) layout();
    // the room
    const { c } = renderBalloon(time);
    renderPressureArrows(time, c);
    const brickShow = windowed(time, 1.6, 9.2, 0.5);
    solidArrows.forEach(({ a, x }) => a.set(v1.set(X.solid + x, 0.044, 0.049), v2.set(0, -1, 0), 0.042, brickShow));
    const tankShow = windowed(time, 10.6, 19.2, 0.5);
    const T = world.liquid;
    for (const s2 of tankArrows) {
      const tip = v1.set(...s2.tip).add(T.group.position);
      const dir = v2.set(...s2.dir);
      s2.a.set(tip.addScaledVector(dir, -s2.len), dir, s2.len, tankShow);
    }
    T.hole.visible = time >= 13.6 && time < 28;
    const jetU = time >= 28 ? 0 : smooth(time, 14.2, 15.4);
    T.jet.visible = jetU > 0;
    T.jet.geometry.setDrawRange(0, Math.ceil(jetU * 24) * T.jet.userData.indexPerSegment);
    T.puddle.visible = time >= 15.2 && time < 28;
    const gasShow = windowed(time, 20.6, 28.2, 0.5);
    for (const s2 of gasArrows) {
      const tip = v1.set(...s2.tip).add(world.gas.group.position);
      const dir = v2.set(...s2.dir);
      s2.a.set(tip.addScaledVector(dir, -s2.len), dir, s2.len, gasShow);
    }
    // the heat lamp, the warm glow, the balloon warming
    const heat = smooth(time, 66.5, 67.4);
    const warm = smooth(time, 67, 68.5);
    world.heater.group.visible = heat > 0;
    world.heater.group.scale.setScalar(Math.max(1e-3, heat));
    world.heater.bulbMat.emissiveIntensity = 2.4 * warm;
    world.heater.glow.material.opacity = 0.9 * warm;
    world.heater.glow.position.copy(c).add(v1.set(0.09, -0.02, 0.02));
    const beam = world.heater.beam;
    const bulb = world.heater.group.localToWorld(new THREE.Vector3(-0.03, 0.31, 0));
    const toBalloon = v2.copy(c).sub(bulb);
    beam.visible = warm > 0;
    beam.position.copy(bulb);
    beam.quaternion.setFromUnitVectors(v3.set(0, -1, 0), toBalloon.clone().normalize());
    beam.scale.set(1, toBalloon.length() * 0.85, 1);
    beam.material.opacity = 0.22 * warm;
    world.solid.userData.footprint.opacity = windowed(time, 1.6, 9.2, 0.5);
    world.balloon.skinMat.emissiveIntensity = 0.22 * warm;
    pts.lamp = world.heater.group.localToWorld(new THREE.Vector3(0, 0.33, 0));

    // live points for the labels
    pts.brickTop = v1.set(X.solid - 0.05, 0.065, 0.02).clone();
    pts.solidArrows = new THREE.Vector3(X.solid + 0.07, 0.01, 0.05);
    pts.table = new THREE.Vector3(X.solid - 0.17, 0, 0.3);
    pts.water = new THREE.Vector3(X.liquid - 0.05, 0.1, 0.03);
    pts.tankLeft = new THREE.Vector3(X.liquid - TANK.w / 2 - 0.02, 0.04, 0);
    pts.tankRim = new THREE.Vector3(X.liquid - 0.07, TANK.h, 0.06);
    pts.hole = new THREE.Vector3(X.liquid + TANK.w / 2, HOLE_Y, 0.025);
    pts.jet = new THREE.Vector3(X.liquid + T.landX - 0.03, 0.03, 0.025);
    pts.gasCentre = new THREE.Vector3(X.gas + 0.03, 0.11, 0.03);
    pts.lid = new THREE.Vector3(X.gas - 0.06, TANK.h + 0.016, 0.06);
    pts.gasLeft = new THREE.Vector3(X.gas - TANK.w / 2 - 0.02, 0.06, 0);

    // the molecules
    renderMolecules(time);

    // cameras: the room, or (between the irises) inside the balloon
    const pose = poseAt(time);
    placeCamera(pose);
    const [o0, o1] = K.irisOpen;
    const [c0, c1] = K.irisClose;
    const inside = time >= o1 && time < c0;
    const diag = Math.hypot(lay.W, lay.H);
    placeMicroCamera(microCam, lay.W / lay.H);
    if (inside) {
      camera.position.copy(microCam.position);
      camera.quaternion.copy(microCam.quaternion);
      camera.clearViewOffset();
      controls.target.copy(W.group.localToWorld(v1.set((BOX.x0 + BOX.x1) / 2, (BOX.y0 + BOX.y1) / 2, 0.3)));
      camera.updateMatrixWorld(true);
    }
    // the round view
    round.on = false;
    round.iris = false;
    el.iris.style.opacity = '0';
    const irisU = time >= o0 && time < o1 ? smooth(time, o0, o1) : time >= c0 && time < c1 ? 1 - smooth(time, c0, c1) : 0;
    if (irisU > 0) {
      // open from the balloon's middle until the circle covers the view
      const p = c.clone().project(camera);
      const bx = (p.x * 0.5 + 0.5) * lay.W;
      const by = (-p.y * 0.5 + 0.5) * lay.H;
      round.on = true;
      round.iris = true;
      round.d = Math.max(4, irisU * irisU * diag * 1.08);
      round.x = lerp(bx, lay.W / 2, irisU);
      round.y = lerp(by, lay.H / 2, irisU);
      // the circle shows that part of the inside view (so it fills seamlessly)
      round.cam = microCam.clone();
      round.cam.setViewOffset(lay.W, lay.H, round.x - round.d / 2, round.y - round.d / 2, round.d, round.d);
      round.cam.aspect = 1;
      round.cam.updateProjectionMatrix();
      el.iris.style.opacity = '1';
      el.iris.style.width = el.iris.style.height = `${round.d}px`;
      el.iris.style.transform = `translate(${round.x - round.d / 2}px, ${round.y - round.d / 2}px)`;
    }
    const lens = LENS.find(([a, b]) => time >= a && time < b);
    const lensU = lens ? windowed(time, lens[0], lens[1], 0.45) : 0;
    leader.on = false;
    if (lens && lensU > 0.01 && !round.on) {
      placeLensCamera(lens[2]);
      round.on = true;
      round.cam = lensCam;
      round.d = lay.d * (0.4 + 0.6 * lensU);
      round.x = lay.lx;
      round.y = lay.ly;
      el.lensCap.textContent = t(lens[3]);
      // a leader from the glass to what it magnifies
      const look = SHOTS[lens[2] === 'wall' ? 'heat' : lens[2]].look;
      const target = look === 'centre' ? c : V(look);
      const p = target.clone().project(camera);
      const tx = (p.x * 0.5 + 0.5) * lay.W;
      const ty = (-p.y * 0.5 + 0.5) * lay.H;
      const ang = Math.atan2(ty - round.y, tx - round.x);
      leader.on = true;
      leader.x1 = round.x + Math.cos(ang) * (round.d / 2 + 2);
      leader.y1 = round.y + Math.sin(ang) * (round.d / 2 + 2);
      leader.x2 = tx - Math.cos(ang) * 8;
      leader.y2 = ty - Math.sin(ang) * 8;
    }
    el.lens.classList.toggle('on', round.on && !round.iris);
    el.lens.style.opacity = String(round.on && !round.iris ? Math.min(1, lensU * 1.5) : 0);
    el.lens.style.transform = `translate(${lay.lx - lay.d / 2}px, ${lay.ly - lay.d / 2}px) scale(${round.on && !round.iris ? round.d / lay.d : 0.4})`;
    el.leader.style.opacity = leader.on ? String(lensU) : '0';
    el.leaderLine.setAttribute('x1', String(leader.x1));
    el.leaderLine.setAttribute('y1', String(leader.y1));
    el.leaderLine.setAttribute('x2', String(leader.x2));
    el.leaderLine.setAttribute('y2', String(leader.y2));
    // the molecules are drawn only by the second camera, or when we are inside
    micro.group.visible = inside;
    micro.group.userData.inside = inside;
    // a quick dip to the wall's blue while a fresh balloon replaces the leaking one
    el.dip.style.opacity = String(windowed(time, K.dip[0], K.dip[1], 0.4));

    // the honest note
    const note =
      time >= K.hit && time < K.release
        ? 'note_freeze'
        : (time >= 50.4 && time < K.hit) || (time >= K.release && time < 58.3)
          ? 'note_slow'
          : inside || (round.on && !round.iris)
            ? 'note_big'
            : time >= 35 && time < 39
              ? 'note_size'
              : '';
    el.note.textContent = note ? t(note) : '';
    el.note.classList.toggle('on', !!note);

    // the words
    const nowCue = Math.max(0, markAt(CUES, time));
    if (nowCue !== cue) {
      cue = nowCue;
      el.caption.innerHTML = t(CUES[cue].key);
    }
    const now = Math.max(0, markAt(STEPS, time));
    if (now !== step) {
      step = now;
      for (const b of el.chips) b.classList.toggle('on', Number(b.dataset.step) === step);
      emit('step', { step, key: STEPS[step].key, t: time });
    }
    syncLabels(irisU > 0 ? -1 : time);
    stage.invalidate();
  }

  const timeline = createTimeline({ duration: DURATION, render, loop: o.loop, onEnd: () => syncPlay() });
  stage.addTicker((dt) => timeline.tick(dt));
  stage.onResize(() => {
    layout();
    anno.clear();
    labelSig = '';
    render(timeline.time);
  });

  function syncPlay() {
    const b = $('[data-act="play"]');
    b.innerHTML = timeline.playing ? ICONS.pause : ICONS.play;
    b.title = b.ariaLabel = t(timeline.playing ? 'pause' : 'play');
  }
  function play() {
    timeline.play();
    syncPlay();
    emit('play', { t: timeline.time });
  }
  function pause() {
    timeline.pause();
    syncPlay();
    emit('pause', { t: timeline.time });
  }
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    if (b.dataset.act === 'play') timeline.playing ? pause() : play();
    if (b.dataset.step != null) timeline.seek(STEPS[Number(b.dataset.step)].at + 0.01);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !(/** @type {Element} */ (e.target).closest('button'))) {
      e.preventDefault();
      timeline.playing ? pause() : play();
    }
  });

  layout();
  timeline.seek(0);
  if (o.autoplay) timeline.play();
  syncPlay();

  return {
    ready: Promise.resolve(),
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: () => ({ t: +timeline.time.toFixed(3), duration: DURATION, playing: timeline.playing, step, cue: CUES[Math.max(0, cue)].key }),
    /** { step } jumps to a part, { t } to a time (seconds), { playing } plays or pauses. */
    set(p = {}) {
      if (p.step != null) timeline.seek((STEPS[Number(p.step)]?.at ?? 0) + 0.01);
      if (p.t != null) timeline.seek(Number(p.t));
      if (p.playing === true) play();
      if (p.playing === false) pause();
      return { t: timeline.time, step };
    },
    play,
    pause,
    seek: (time) => timeline.seek(time),
    duration: DURATION,
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world.model,
  };
}
