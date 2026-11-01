// The apparatus, in metres (y up, x to the right, z toward the student): two clear tubes of the same height on a
// wooden base. The left one is open at the top (বাতাস আছে); the right one is sealed, with a valve where the air
// was pumped out (বাতাসহীন). In each, a small stone and a piece of exercise-book paper rest on a shutter at the same
// height; the red button on the release box (on top of the scale) opens both shutters at once. Between the tubes a centimetre scale counts the
// height fallen downward from the start (h, as the book writes it). Plus the marks of a fall: faint pictures of the
// bodies every 0.1 s, a dashed line at each, and the speed arrows (বেগ). Colours carry meaning (style.css too).
// The still parts are merged into one mesh per material (src/merge.js); the materials and the scale's face are the
// figure's own (small canvases), not the kit's set of brushed-metal textures built for instruments.
import * as THREE from 'three';
import { FONT } from '@shared/student/materials.js';
import { outlinedArrow } from './arrows.js';
import { H, STEPS } from './fall.js';
import { mergeStatic } from './merge.js';

/** The pictures are pale, so they read on the dark board behind the glass; their edges paler still. */
export const COLORS = { v: '#1c6fd9', h: '#e8590c', t: '#6741d9', ghost: '#dfe5ec', ghostEdge: '#f4f7fa' };

/** Tube centres at ±x; glass outer and inner radius; the felt pad's top (the floor of a fall). */
export const TUBE = { x: 0.145, r: 0.08, rIn: 0.076, floor: 0.024, foot: 0.016 };
/** The release level: the bottoms of all bodies start here and fall H to the floor. */
export const Y0 = TUBE.floor + H;
export const TOP = Y0 + 0.056; // the tops of the tube collars
/** Where the bodies sit in each tube (x from the tube's axis). The paper is held tilted toward the student. */
export const STONE = { r: 0.034, x: -0.039 };
export const PAPER = { w: 0.07, x: 0.036, tilt: THREE.MathUtils.degToRad(28), thick: 0.0008 };
PAPER.lift = (PAPER.w / 2) * Math.sin(PAPER.tilt) + PAPER.thick; // centre above its lowest point
export const CRUMPLED = { r: 0.014 };
/** A paper lying on the pad is not quite flat (one edge curls up a little), so it can still be seen from the front. */
export const LANDED_TILT = THREE.MathUtils.degToRad(7);
export const RULER = { w: 0.08 };
/** Speed arrows stand right of the empty tube: k metres of arrow per m/s (not 0.05, which would make the first arrow
 * exactly as long as the distance fallen by then, and read like one). */
export const ARROW = { x: TUBE.x + TUBE.r + 0.026, k: 0.035 };
export const BASE = { w: 0.56, h: 0.036, d: 0.2 };
/** The release box sits on top of the scale, between the tubes, wired to both shutters; its red button faces the student. */
export const BOX = { w: 0.064, h: 0.03, d: 0.034, y: Y0 + 0.018 };
export const BUTTON = { x: 0, y: BOX.y + BOX.h / 2, z: BOX.d / 2 };
/** Where the vacuum pump's hose meets the valve on the empty tube's cap (the end of the valve's nozzle). */
export const VALVE_NOZZLE = new THREE.Vector3(TUBE.x + 0.03, TOP + 0.014, -0.047);

function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** A pebble: an icosphere pushed in and out a little, a bit flattened. */
function pebbleGeometry(r, seed, { flat = 0.82, bump = 0.07, detail = 2 } = {}) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const pos = g.attributes.position;
  const rnd = rand(seed);
  const bumps = Array.from({ length: 7 }, () => ({ d: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), k: (rnd() - 0.5) * 2 }));
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    let s = 1;
    for (const b of bumps) s += bump * b.k * Math.max(0, n.dot(b.d)) ** 3;
    v.multiplyScalar(s);
    v.y *= flat;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

/** A crumpled ball of paper: an icosphere with sharp random dents, drawn flat-shaded so the creases show. */
function crumpledGeometry(r, seed) {
  const g = new THREE.IcosahedronGeometry(r, 1); // a polyhedron is non-indexed: each face keeps its own corners
  const pos = g.attributes.position;
  const rnd = rand(seed);
  const jitter = new Map();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
    if (!jitter.has(key)) jitter.set(key, 0.72 + rnd() * 0.5);
    v.multiplyScalar(jitter.get(key));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

/** Exercise-book paper: off-white with faint blue rules and a red margin line. */
function paperTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fbf5e1';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(60,110,200,0.7)';
  ctx.lineWidth = 3;
  for (let y = 18; y < 128; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(210,60,60,0.6)';
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(22, 128);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Light wood for the base, along x (repeats). */
function woodTexture() {
  const W = 256;
  const H = 128;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const r = rand(11);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#be8049');
  grad.addColorStop(1, '#ab6c3b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) {
    const y0 = r() * H;
    const amp = 2 + r() * 5;
    const freq = 0.01 + r() * 0.02;
    const phase = r() * 10;
    ctx.strokeStyle = `rgba(${90 + r() * 30},${48 + r() * 20},22,${0.15 + r() * 0.3})`;
    ctx.lineWidth = 0.8 + r() * 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 4) {
      const y = y0 + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1) * amp * 0.25;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/**
 * The scale's face in one picture: cream, the millimetre ticks, the numbers every 10 cm (0 at the release level,
 * counting down) and the unit. x across the face (0 at its left edge), y in world metres from `bottom` to `top`.
 */
function scaleTexture({ width, top, bottom, N, unit }) {
  const W = 128;
  const Hpx = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = Hpx;
  const ctx = c.getContext('2d');
  const kx = W / width; // px per metre across
  const ky = Hpx / (top - bottom); // px per metre down (the picture is stretched back on the face)
  const py = (y) => (top - y) * ky;
  ctx.fillStyle = '#fbfaf3';
  ctx.fillRect(0, 0, W, Hpx);
  ctx.fillStyle = '#1d2733';
  const cm = Math.floor(H * 100 + 1e-6);
  for (let i = 0; i <= cm; i++) {
    const len = i % 10 === 0 ? 0.026 : i % 5 === 0 ? 0.017 : 0.01;
    const th = i % 10 === 0 ? 0.0016 : 0.0011;
    ctx.fillRect(W - len * kx, py(Y0 - i / 100) - (th * ky) / 2, len * kx, th * ky);
  }
  /** Text `size` m high, its left edge x m from the face's left edge, its middle at height y. */
  const text = (s, x, y, size, weight, color) => {
    ctx.save();
    ctx.setTransform(kx / ky, 0, 0, 1, x * kx, py(y));
    ctx.font = `${weight} ${Math.round(size * ky)}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(s, 0, size * ky * 0.05);
    ctx.restore();
  };
  for (let i = 0; i <= cm; i += 10) text(N(String(i)), 0.006, Y0 - i / 100, 0.03, 700, '#14171c');
  text(unit, 0.006, TUBE.floor + 0.004, 0.018, 600, '#4b5766');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createApparatus({ t }) {
  const root = new THREE.Group();
  root.name = 'FallingBodies';
  const N = t.num;

  // ── materials ─────────────────────────────────────────────────────────────
  // polished steel and brass take their look from the room's reflections; the wood is a small canvas
  const M = {
    steel: new THREE.MeshStandardMaterial({ name: 'Steel', color: 0xd2d7dd, metalness: 1, roughness: 0.34 }),
    brass: new THREE.MeshStandardMaterial({ name: 'Brass', color: 0xd7a94b, metalness: 1, roughness: 0.3 }),
    wood: new THREE.MeshStandardMaterial({ name: 'Wood', map: woodTexture(), roughness: 0.62 }),
  };
  M.wood.map.repeat.set(2, 1);
  const glass = new THREE.MeshPhysicalMaterial({
    name: 'Glass',
    color: 0xd8eef9,
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const rimGlass = new THREE.MeshPhysicalMaterial({ name: 'GlassRim', color: 0xa9cde4, roughness: 0.1, transparent: true, opacity: 0.55 });
  const felt = new THREE.MeshStandardMaterial({ name: 'Felt', color: 0x6e2a2a, roughness: 1 });
  // the release box is pale enamel and its wires cream, so they show on the dark board behind them
  const dark = new THREE.MeshStandardMaterial({ name: 'Housing', color: 0xb9c1cb, roughness: 0.45, metalness: 0.2 });
  const wireMat = new THREE.MeshStandardMaterial({ name: 'Wire', color: 0xe9e1cc, roughness: 0.6 });
  const lever = new THREE.MeshStandardMaterial({ name: 'Lever', color: 0x3a4250, roughness: 0.5, metalness: 0.3 });
  const red = new THREE.MeshStandardMaterial({ name: 'Button', color: 0xd63a2f, roughness: 0.35, emissive: 0x3a0804 });
  const stoneMat = new THREE.MeshStandardMaterial({ name: 'Stone', color: 0x8f877d, roughness: 0.92 });
  const paperMat = new THREE.MeshStandardMaterial({ name: 'Paper', map: paperTexture(), roughness: 0.9, side: THREE.DoubleSide });
  const paperEdge = new THREE.MeshStandardMaterial({ name: 'PaperEdge', color: 0xb9b3a3, roughness: 0.9 });
  const paperOutline = new THREE.LineBasicMaterial({ name: 'PaperOutline', color: 0x4a4436 });
  const crumpledMat = new THREE.MeshStandardMaterial({ name: 'CrumpledPaper', color: 0xe6dfc9, roughness: 0.85, flatShading: true });
  const rulerSide = new THREE.MeshStandardMaterial({ name: 'ScaleEdge', color: 0xe8e4d6, roughness: 0.7 });

  // ── the base ──────────────────────────────────────────────────────────────
  const base = new THREE.Mesh(new THREE.BoxGeometry(BASE.w, BASE.h, BASE.d), M.wood);
  base.position.y = -BASE.h / 2;
  base.name = 'Base';
  root.add(base);

  // the release box on top of the scale, its wires to the two shutter bands, and its red button
  const box = new THREE.Mesh(new THREE.BoxGeometry(BOX.w, BOX.h, BOX.d), dark);
  box.name = 'ReleaseBox';
  box.position.set(0, BOX.y + BOX.h / 2, 0);
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.01, 28).rotateX(Math.PI / 2), red);
  button.name = 'ReleaseButton';
  const buttonRest = BUTTON.z + 0.005;
  button.position.set(BUTTON.x, BUTTON.y, buttonRest);
  root.add(box, button);
  for (const side of [-1, 1]) {
    const a = new THREE.Vector3(side * (BOX.w / 2), BOX.y + 0.008, -0.006);
    const b = new THREE.Vector3(side * (TUBE.x - TUBE.r - 0.004), Y0 - 0.007, -0.006);
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, a.distanceTo(b), 6), wireMat);
    wire.name = 'ReleaseWire';
    wire.position.copy(a).add(b).multiplyScalar(0.5);
    wire.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    root.add(wire);
  }

  // ── the tubes ─────────────────────────────────────────────────────────────
  const glassH = TOP - TUBE.foot - 0.014;
  /** One tube: collars, glass, felt pad, the two-part shutter; sealed (with a valve) or open at the top. */
  function makeTube(side, sealed) {
    const g = new THREE.Group();
    g.name = sealed ? 'TubeWithoutAir' : 'TubeWithAir';
    g.position.x = side * TUBE.x;
    const collar = (y0, h, r = TUBE.r + 0.007, name = 'Collar') => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48), M.steel);
      m.name = name;
      m.position.y = y0 + h / 2;
      g.add(m);
      return m;
    };
    collar(0, TUBE.foot);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(TUBE.r, TUBE.r, glassH, 56, 1, true), glass);
    tube.position.y = TUBE.foot + glassH / 2;
    tube.renderOrder = 3;
    tube.name = 'Glass';
    g.add(tube);
    // thin bright rings where the glass meets the collars, so the clear tube reads on a white page
    for (const y of [TUBE.foot + 0.001, TOP - 0.015]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(TUBE.r, 0.0012, 6, 56).rotateX(Math.PI / 2), rimGlass);
      ring.position.y = y;
      ring.name = 'GlassRim';
      g.add(ring);
    }
    // a shutter band round the glass at the release level, and the top collar
    collar(Y0 - 0.012, 0.01, TUBE.r + 0.004, 'ShutterBand'); // just under the shutter, so the bodies sit clear of it
    collar(TOP - 0.014, 0.014);
    if (sealed) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(TUBE.r + 0.007, TUBE.r + 0.007, 0.006, 48), M.steel);
      cap.position.y = TOP + 0.003;
      cap.name = 'Cap';
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.022, 16), M.brass);
      valve.position.set(0.03, TOP + 0.017, -0.02);
      valve.name = 'Valve';
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 0.006), lever);
      handle.position.set(0.03, TOP + 0.03, -0.02);
      handle.name = 'ValveLever';
      // the nozzle out of the back of the valve, where the pump's hose is pushed on
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0045, 0.022, 12).rotateX(Math.PI / 2), M.brass);
      nozzle.position.set(VALVE_NOZZLE.x - TUBE.x, VALVE_NOZZLE.y, VALVE_NOZZLE.z + 0.011);
      nozzle.name = 'ValveNozzle';
      g.add(cap, valve, handle, nozzle);
    }
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(TUBE.rIn - 0.002, TUBE.rIn - 0.002, 0.012, 40), felt);
    pad.position.y = TUBE.floor - 0.006;
    pad.name = 'FeltPad';
    g.add(pad);
    // the shutter: two half discs that fold into the wall when the button is pressed
    const leaves = [-1, 1].map((s) => {
      // the round edge against the wall on side s, the straight edge along the middle (lying flat, 2 mm thick)
      const R = TUBE.rIn - 0.001;
      const shape = new THREE.Shape();
      const a0 = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      shape.moveTo(0, s > 0 ? -R : R);
      shape.absarc(0, 0, R, a0, a0 + Math.PI, false);
      shape.lineTo(0, s > 0 ? -R : R);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.002, bevelEnabled: false, curveSegments: 20 });
      geo.rotateX(Math.PI / 2);
      geo.translate(-s * R, 0, 0); // the pivot is at the wall, so the leaf shrinks into it
      const pivot = new THREE.Group();
      pivot.position.set(s * R, Y0, 0);
      const leaf = new THREE.Mesh(geo, M.steel);
      leaf.name = 'ShutterLeaf';
      pivot.add(leaf);
      g.add(pivot);
      return pivot;
    });
    root.add(g);
    return { group: g, tube, leaves };
  }
  const tubes = { air: makeTube(-1, false), vac: makeTube(1, true) };

  /** 0: the shutters closed under the bodies; 1: folded away into the wall. */
  function setShutter(k) {
    const e = Math.min(1, Math.max(0, k));
    for (const tb of Object.values(tubes))
      for (const p of tb.leaves) {
        p.scale.x = Math.max(0.001, 1 - e);
        p.visible = e < 1; // folded away: gone (a leaf squashed to nothing would still show as a thin line)
      }
  }

  // ── the scale (centimetres, 0 at the start, counting down) ────────────────
  const ruler = new THREE.Group();
  ruler.name = 'Scale';
  const rulerTop = BOX.y;
  const rulerBottom = TUBE.floor - 0.012;
  // the face (+z) carries the ticks, the numbers and the unit in one picture; the edges are plain
  const face = new THREE.MeshStandardMaterial({
    name: 'Scale',
    map: scaleTexture({ width: RULER.w, top: rulerTop, bottom: rulerBottom, N, unit: t('u_cm') }),
    roughness: 0.7,
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(RULER.w, rulerTop - rulerBottom, 0.008), [
    rulerSide,
    rulerSide,
    rulerSide,
    rulerSide,
    face,
    rulerSide,
  ]);
  board.position.set(0, (rulerTop + rulerBottom) / 2, 0);
  board.name = 'ScaleBoard';
  ruler.add(board);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(RULER.w + 0.008, 0.012, 0.03), M.steel);
  frame.position.set(0, 0.006, 0);
  frame.name = 'ScaleFoot';
  ruler.add(frame);
  root.add(ruler);

  // ── the bodies ────────────────────────────────────────────────────────────
  const stoneGeo = pebbleGeometry(STONE.r, 5);
  const stoneBottom = -stoneGeo.boundingBox.min.y;
  const paperGeo = new THREE.BoxGeometry(PAPER.w, PAPER.thick, PAPER.w);
  const paperEdges = new THREE.EdgesGeometry(paperGeo);
  const crumpledGeo = crumpledGeometry(CRUMPLED.r, 9);
  const crumpledBottom = -crumpledGeo.boundingBox.min.y;
  const paperMats = [paperEdge, paperEdge, paperMat, paperMat, paperEdge, paperEdge];

  /** One tube's stone and paper; place(...) sets them from a fall (positions relative to the tube's axis). */
  function makeBodies(tube) {
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.name = 'Stone';
    const paper = new THREE.Group();
    paper.name = 'Paper';
    const flat = new THREE.Group(); // turns (yaw) and rocks (tilt) about its centre; the sheet is held tilted
    const sheet = new THREE.Mesh(paperGeo, paperMats);
    sheet.name = 'PaperSheet';
    const outline = new THREE.LineSegments(paperEdges, paperOutline);
    outline.name = 'PaperOutline';
    flat.add(sheet, outline);
    const ball = new THREE.Mesh(crumpledGeo, crumpledMat);
    ball.name = 'CrumpledPaper';
    ball.visible = false;
    paper.add(flat, ball);
    tube.group.add(stone, paper);
    return { stone, paper, flat, ball };
  }
  const bodies = { air: makeBodies(tubes.air), vac: makeBodies(tubes.vac) };

  /** 'paper' (flat) or 'crumpled', in both tubes. */
  function setPaper(kind) {
    for (const b of Object.values(bodies)) {
      b.flat.visible = kind !== 'crumpled';
      b.ball.visible = kind === 'crumpled';
    }
    for (const g of ghosts) {
      g.flat.visible = kind !== 'crumpled';
      g.ball.visible = kind === 'crumpled';
    }
  }

  /** Hides one tube's paper and (empty tube) its pictures, or shows them again. */
  function hidePaper(which, hidden) {
    bodies[which].paper.visible = !hidden;
    if (which === 'vac') for (const g of ghosts) g.paper.visible = !hidden;
  }

  const e = new THREE.Euler();
  /**
   * Places one tube's bodies: ds, dp = height fallen (m) by the stone and the paper; f = the paper's flutter
   * { x, tilt, yaw }; settle = 0…1, how flat the landed paper lies.
   */
  function placeBodies(which, ds, dp, f = { x: 0, tilt: 0, yaw: 0 }, settle = 0) {
    const b = bodies[which];
    b.stone.position.set(STONE.x, Y0 - ds + stoneBottom, 0);
    const crumpled = b.ball.visible;
    if (crumpled) {
      b.paper.position.set(PAPER.x, Y0 - dp + crumpledBottom, 0);
      b.flat.rotation.set(0, 0, 0);
    } else {
      const tilt = PAPER.tilt + (LANDED_TILT - PAPER.tilt) * settle;
      const lift = (PAPER.w / 2) * Math.sin(tilt) + PAPER.thick;
      b.paper.position.set(PAPER.x + f.x, Y0 - dp + lift, 0);
      e.set(tilt, f.yaw, f.tilt, 'XYZ'); // rocks, turns, and stays tilted toward the student
      b.flat.rotation.copy(e);
    }
  }

  // ── the marks of a fall (in the empty tube only) ──────────────────────────
  const ghostMat = new THREE.MeshStandardMaterial({
    name: 'Picture',
    color: COLORS.ghost,
    roughness: 0.6,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const ghostLine = new THREE.LineBasicMaterial({ color: COLORS.ghostEdge, transparent: true, opacity: 0.9 });
  /** Faint pictures of the stone and the paper at 0, 0.1 and 0.2 s (at 0.3 s they are on the floor). */
  const ghosts = Array.from({ length: STEPS }, (_, i) => {
    const g = new THREE.Group();
    g.name = `Picture${i}`;
    const stone = new THREE.Mesh(stoneGeo, ghostMat);
    stone.renderOrder = 1;
    const paper = new THREE.Group();
    const flat = new THREE.Group();
    const sheet = new THREE.Mesh(paperGeo, ghostMat);
    sheet.renderOrder = 1;
    flat.add(sheet, new THREE.LineSegments(paperEdges, ghostLine));
    flat.rotation.x = PAPER.tilt;
    const ball = new THREE.Mesh(crumpledGeo, ghostMat);
    ball.visible = false;
    paper.add(flat, ball);
    g.add(stone, paper);
    g.visible = false;
    tubes.vac.group.add(g);
    return { group: g, stone, paper, flat, ball };
  });
  function placeGhost(i, d) {
    const g = ghosts[i];
    g.stone.position.set(STONE.x, Y0 - d + stoneBottom, 0);
    g.paper.position.set(PAPER.x, Y0 - d + (g.ball.visible ? crumpledBottom : PAPER.lift), 0);
  }

  // dashed lines at the height of each picture, from the scale across the empty tube
  const DASH = 0.008;
  const GAP = 0.005;
  const x0 = RULER.w / 2 + 0.002;
  const x1 = TUBE.x + TUBE.r + 0.012;
  const perLine = Math.ceil((x1 - x0) / (DASH + GAP));
  const lineMat = new THREE.MeshBasicMaterial({ name: 'PictureLine', color: COLORS.h, toneMapped: false });
  const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.003, 0.003), lineMat, perLine * STEPS);
  const m4 = new THREE.Matrix4();
  const dashAt = new THREE.Vector3();
  const dashSize = new THREE.Vector3();
  const noTurn = new THREE.Quaternion();
  dashes.count = 0;
  dashes.frustumCulled = false;
  dashes.name = 'PictureLines';
  root.add(dashes);
  /** The lines at the given heights fallen (m). */
  function setLines(depths) {
    let n = 0;
    for (const d of depths) {
      const y = Y0 - d + 0.0012;
      for (let x = x0; x < x1 - 1e-6; x += DASH + GAP) {
        const w = Math.min(DASH, x1 - x);
        m4.compose(dashAt.set(x + w / 2, y, 0.006), noTurn, dashSize.set(w, 1, 1));
        dashes.setMatrixAt(n++, m4);
      }
    }
    dashes.count = n;
    dashes.instanceMatrix.needsUpdate = true;
  }

  // speed arrows: each ends at the height of its picture (the speed the bodies have as they get there)
  const arrows = Array.from({ length: STEPS }, (_, i) => {
    const a = outlinedArrow(`Speed${i + 1}`, COLORS.v, { radius: 0.0036, head: 0.017, headRadius: 0.0092, pad: 0.0021 });
    root.add(a.root);
    return a;
  });
  const down = new THREE.Vector3(0, -1, 0);
  const from = new THREE.Vector3();
  function setArrow(i, d, v) {
    const len = ARROW.k * v;
    if (!(len > 0)) {
      arrows[i].hide();
      return;
    }
    from.set(ARROW.x, Y0 - d + len, 0);
    arrows[i].set(from, down, len);
  }
  const hideArrow = (i) => arrows[i].hide();

  // ── things a finger can press (invisible, bigger than what you see) ───────
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hits = [];
  const hitButton = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.075, 0.08), hitMat);
  hitButton.position.set(BUTTON.x, BUTTON.y, 0.01);
  hitButton.userData = { noExport: true, part: 'button' };
  hits.push(hitButton);
  for (const side of [-1, 1]) {
    const hit = new THREE.Mesh(new THREE.BoxGeometry(TUBE.r * 2 + 0.02, 0.1, TUBE.r * 2 + 0.02), hitMat);
    hit.position.set(side * TUBE.x, Y0 + 0.03, 0);
    hit.userData = { noExport: true, part: 'holder' };
    hits.push(hit);
  }
  root.add(...hits);

  function pressButton(on) {
    button.position.z = buttonRest - (on ? 0.005 : 0);
  }

  // the still parts (the base, the release box and its wires, the tubes' collars, caps, valve, pads and glass, the
  // scale's foot) become one mesh per material; what moves, what is pressed and what is drawn over stays apart
  const keep = [
    button,
    ruler,
    dashes,
    ...hits,
    ...Object.values(tubes).flatMap((tb) => tb.leaves),
    ...Object.values(bodies).flatMap((b) => [b.stone, b.paper]),
    ...ghosts.map((g) => g.group),
    ...arrows.map((a) => a.root),
  ];
  // shadows: what is seen to cast one (the base, the collars, the scale, the box, the bodies); not the glass, the
  // wires, the pads or the marks of a fall
  const casterMats = new Set([M.wood, M.steel, M.brass, dark, red, rulerSide]);
  root.traverse((m) => {
    if (m instanceof THREE.Mesh && !m.userData.noExport && casterMats.has(m.material)) m.castShadow = true;
  });
  for (const b of Object.values(bodies)) for (const o of [b.stone, ...b.flat.children, b.ball]) o.castShadow = true;
  board.castShadow = true;
  board.receiveShadow = true;
  // and what is seen to receive one: the base and the pads (the bodies' shadows when they land)
  root.traverse((m) => {
    if (m instanceof THREE.Mesh && (m.material === M.wood || m.material === felt)) m.receiveShadow = true;
  });
  mergeStatic(root, { keep });

  const v3 = new THREE.Vector3();
  return {
    root,
    tubes,
    bodies,
    ghosts,
    arrows,
    dashes,
    ruler,
    hits,
    setShutter,
    setPaper,
    hidePaper,
    placeBodies,
    placeGhost,
    setLines,
    setArrow,
    hideArrow,
    pressButton,
    /** World points for labels and pointers. */
    points: {
      button: () => v3.set(BUTTON.x, BUTTON.y, buttonRest + 0.005),
      /** The corners of the release box, to keep labels off it. */
      boxCorners: () => [-1, 1].flatMap((sx) => [-1, 1].map((sy) => new THREE.Vector3((sx * BOX.w) / 2, BOX.y + (sy > 0 ? BOX.h : 0), BOX.d / 2))),
      /** Under a tube, on its foot collar just below the felt pad (the tube's name goes there). */
      tubeFoot: (which, out) => out.set((which === 'air' ? -1 : 1) * TUBE.x, 0.013, TUBE.r + 0.008),
      stone: (which, out) => bodies[which].stone.getWorldPosition(out),
      paper: (which, out) => bodies[which].paper.getWorldPosition(out),
      arrowFoot: (d, out) => out.set(ARROW.x + 0.012, Y0 - d, 0),
      /** The tail (top end) of the speed arrow that ends d below the start, for speed v (m/s). */
      arrowTail: (d, v, out) => out.set(ARROW.x + 0.008, Y0 - d + ARROW.k * v, 0),
    },
  };
}
