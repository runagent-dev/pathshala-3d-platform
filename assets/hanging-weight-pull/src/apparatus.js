// The apparatus (metres): a lab bench, a wooden block on it, a pulley at the bench's edge (two in the page-82 example),
// a string from the block over the pulley to an iron weight that hangs beside the bench and lands on a low padded
// crate. A small gate of two pegs holds the block until the student lets go; a rubber bar stops it at the end of the
// run, at the moment the weight touches its crate. Bodies are sized from their mass (cube root) so 10 kg looks heavier
// than 5 kg. Origin: the floor under the middle of the bench; x along the bench (the right pulley is at +x), y up, z
// toward the viewer. place(progress) moves the bodies and the strings; geom() says where everything is (for the
// arrows and the labels).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TRAVEL, blockSize, travel, twoWeights, weightSize } from './reading.js';

const TRAVEL_SINGLE = TRAVEL.single;
const TRAVEL_TWO = TRAVEL.two;

export const BENCH = { top: 0.85, slab: 0.05, half: 0.62, depth: 0.34, legs: 0.46 };
export const PULLEY = { x: 0.66, r: 0.045, axle: BENCH.top + 0.03 }; // the right one; the left one mirrors it
export const STRING_Y = BENCH.top + 0.075; // the string runs along the top of the wheel
export const CRATE = { top: 0.22, w: 0.3, x: PULLEY.x + PULLEY.r }; // the padded crate a weight lands on
const STOP_GAP = 0.09; // the stop bar is this far inside the pulley (m)
const THREAD = 0.0028;
const UP = new THREE.Vector3(0, 1, 0);

/** Start heights of the weights' bottoms (single: M falls; two: the heavier m₂ on the left falls, m₁ rises). */
const START = { single: CRATE.top + TRAVEL_SINGLE, left: CRATE.top + TRAVEL_TWO, right: 0.34 };

/**
 * @param {{ materials: ReturnType<typeof import('@shared/student/materials.js').createMaterials> }} options
 */
export function createApparatus({ materials: M }) {
  const root = new THREE.Group();
  root.name = 'HangingWeightPull';

  const mats = {
    block: new THREE.MeshStandardMaterial({ name: 'Block', color: 0xe9c98f, roughness: 0.68, metalness: 0 }),
    blockEdge: new THREE.MeshStandardMaterial({ name: 'BlockEnd', color: 0xd9b072, roughness: 0.7, metalness: 0 }),
    iron: new THREE.MeshStandardMaterial({ name: 'IronWeight', color: 0x474d55, roughness: 0.42, metalness: 0.7 }),
    ironBand: new THREE.MeshStandardMaterial({ name: 'IronBand', color: 0x7b838d, roughness: 0.35, metalness: 0.85 }),
    bench: new THREE.MeshStandardMaterial({ name: 'BenchTop', color: 0xd9b27a, map: M.wood.map, roughness: 0.7, metalness: 0 }),
    legs: new THREE.MeshStandardMaterial({ name: 'BenchLegs', color: 0x9aa3ad, roughness: 0.5, metalness: 0.55 }),
    crate: new THREE.MeshStandardMaterial({ name: 'Crate', color: 0xc9a46c, roughness: 0.75, metalness: 0 }),
    pad: new THREE.MeshStandardMaterial({ name: 'Pad', color: 0x6f7a86, roughness: 0.9, metalness: 0 }),
    rubber: new THREE.MeshStandardMaterial({ name: 'StopBar', color: 0xb8505a, roughness: 0.85, metalness: 0 }),
    peg: new THREE.MeshStandardMaterial({ name: 'GatePeg', color: 0xd6336c, roughness: 0.5, metalness: 0.1 }),
    string: new THREE.MeshStandardMaterial({ name: 'String', color: 0x2f353d, roughness: 0.8, metalness: 0 }),
  };

  // ── the floor: a soft white disc that fades out, so the bench stands on something without a hard edge ─────────
  const floorTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 126);
    g.addColorStop(0, 'rgba(226,230,236,1)');
    g.addColorStop(0.7, 'rgba(232,235,240,0.85)');
    g.addColorStop(1, 'rgba(240,242,245,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 2.6).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Floor', map: floorTex, transparent: true, roughness: 1, metalness: 0, depthWrite: false }),
  );
  floor.position.y = -0.002;
  floor.name = 'Floor';
  floor.userData.noExport = true;
  floor.receiveShadow = true;

  // ── the bench ─────────────────────────────────────────────────────────────────────────────────────────────────
  const bench = new THREE.Group();
  bench.name = 'Bench';
  const slab = new THREE.Mesh(new RoundedBoxGeometry(BENCH.half * 2, BENCH.slab, BENCH.depth, 3, 0.008), mats.bench);
  slab.position.y = BENCH.top - BENCH.slab / 2;
  bench.add(slab);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, BENCH.top - BENCH.slab, 0.05), mats.legs);
      leg.position.set(sx * BENCH.legs, (BENCH.top - BENCH.slab) / 2, sz * (BENCH.depth / 2 - 0.045));
      bench.add(leg);
    }
  // a cross bar low between the legs, so it reads as a bench
  for (const sz of [-1, 1]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(BENCH.legs * 2, 0.035, 0.03), mats.legs);
    bar.position.set(0, 0.2, sz * (BENCH.depth / 2 - 0.045));
    bench.add(bar);
  }

  // ── a pulley on a clamp at the bench's end (the left one is made only for the two-weights example) ───────────
  function makePulley(side) {
    const g = new THREE.Group();
    g.name = side > 0 ? 'PulleyRight' : 'PulleyLeft';
    const profile = [
      [0.009, -0.014],
      [PULLEY.r, -0.014],
      [PULLEY.r, -0.007],
      [PULLEY.r - 0.005, 0],
      [PULLEY.r, 0.007],
      [PULLEY.r, 0.014],
      [0.009, 0.014],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const wheel = new THREE.Mesh(new THREE.LatheGeometry(profile, 36).rotateX(Math.PI / 2), M.chrome);
    wheel.position.set(side * PULLEY.x, PULLEY.axle, 0);
    g.add(wheel);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 16).rotateX(Math.PI / 2), M.chrome);
    cap.position.copy(wheel.position);
    g.add(cap);
    for (const z of [-0.028, 0.028]) {
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.1, 0.008), mats.legs);
      cheek.position.set(side * (PULLEY.x - 0.015), PULLEY.axle - 0.02, z);
      g.add(cheek);
    }
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.09), mats.legs);
    clamp.position.set(side * (BENCH.half - 0.02), BENCH.top - BENCH.slab - 0.02, 0);
    g.add(clamp);
    return g;
  }
  const pulleyR = makePulley(1);
  const pulleyL = makePulley(-1);

  // ── the crates the weights land on ────────────────────────────────────────────────────────────────────────────
  function makeCrate(side) {
    const g = new THREE.Group();
    g.name = side > 0 ? 'CrateRight' : 'CrateLeft';
    const box = new THREE.Mesh(new RoundedBoxGeometry(CRATE.w, CRATE.top - 0.02, 0.3, 3, 0.008), mats.crate);
    box.position.y = (CRATE.top - 0.02) / 2;
    const pad = new THREE.Mesh(new RoundedBoxGeometry(CRATE.w - 0.02, 0.025, 0.28, 3, 0.01), mats.pad);
    pad.position.y = CRATE.top - 0.0125;
    g.add(box, pad);
    g.position.x = side * CRATE.x;
    return g;
  }
  const crateR = makeCrate(1);
  const crateL = makeCrate(-1);

  // ── the stop bar and the gate (made where the block ends and starts, in setup()) ──────────────────────────────
  const stopBar = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.045, 0.2, 2, 0.006), mats.rubber);
  stopBar.name = 'StopBar';
  const gate = new THREE.Group();
  gate.name = 'Gate';
  for (const z of [-0.075, 0.075]) {
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.055, 14), mats.peg);
    peg.position.set(0, 0.0275, z);
    gate.add(peg);
  }

  // ── the block ─────────────────────────────────────────────────────────────────────────────────────────────────
  const block = new THREE.Group();
  block.name = 'Block';
  const blockBody = new THREE.Group();
  block.add(blockBody);
  const hookMat = M.chrome;
  const hookR = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.022, 10).rotateZ(Math.PI / 2), hookMat);
  const hookL = hookR.clone();
  block.add(hookR, hookL);
  // a hit box for fingers: a little bigger than the block (hidden, never exported)
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  block.add(hit);

  // ── the weights ───────────────────────────────────────────────────────────────────────────────────────────────
  function makeWeight(name) {
    const g = new THREE.Group();
    g.name = name;
    const body = new THREE.Group();
    g.add(body);
    return { group: g, body, size: null };
  }
  const weightR = makeWeight('WeightRight');
  const weightL = makeWeight('WeightLeft');
  function buildWeight(w, mass) {
    w.size = weightSize(mass);
    const { rBottom, rTop, body, knob } = w.size;
    w.body.clear();
    const frustum = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, body, 40), mats.iron);
    frustum.position.y = body / 2;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(rBottom + 0.0015, rBottom + 0.0015, 0.014, 40), mats.ironBand);
    band.position.y = 0.007;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(rTop * 0.55, rTop, 0.016, 40), mats.iron);
    top.position.y = body + 0.008;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.014, 12), mats.ironBand);
    neck.position.y = body + 0.023;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.0035, 8, 20), mats.ironBand);
    ring.position.y = body + knob - 0.011;
    w.body.add(frustum, band, top, neck, ring);
    w.mass = mass;
    w.height = body + knob;
  }

  // ── the strings: a thread is a stretched cylinder; the bit over each wheel is a quarter ring ──────────────────
  function makeThread() {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(THREAD, THREAD, 1, 8).translate(0, 0.5, 0), mats.string);
    m.name = 'String';
    return m;
  }
  const a = new THREE.Vector3();
  function stretch(m, from, to) {
    a.copy(to).sub(from);
    const len = a.length();
    m.visible = len > 1e-4;
    m.position.copy(from);
    m.quaternion.setFromUnitVectors(UP, a.normalize());
    m.scale.set(1, Math.max(len, 1e-4), 1);
  }
  const strings = {
    right: { run: makeThread(), drop: makeThread(), arc: null },
    left: { run: makeThread(), drop: makeThread(), arc: null },
  };
  for (const [side, s] of [
    ['right', strings.right],
    ['left', strings.left],
  ]) {
    s.arc = new THREE.Mesh(new THREE.TorusGeometry(PULLEY.r + THREAD, THREAD, 6, 20, Math.PI / 2), mats.string);
    s.arc.name = 'String';
    const sx = side === 'right' ? 1 : -1;
    s.arc.position.set(sx * PULLEY.x, PULLEY.axle, 0);
    if (sx < 0) s.arc.rotation.z = Math.PI / 2; // from the top round to the left side
  }

  const shadowed = [slab, block, weightR.group, weightL.group, crateR, crateL];
  root.add(floor, bench, pulleyR, pulleyL, crateR, crateL, stopBar, gate, block, weightR.group, weightL.group);
  for (const s of Object.values(strings)) root.add(s.run, s.drop, s.arc);

  // ── the setup: what the figure shows now ──────────────────────────────────────────────────────────────────────
  let cfg = null; // { kind, dir, D, bs, x0, ... }
  const G = {
    block: { x: 0, y: BENCH.top, w: 0.26, h: 0.17, d: 0.2 }, // x: the centre; y: the bottom
    right: { x: PULLEY.x + PULLEY.r, bottom: 0, top: 0, com: 0, size: null, visible: true },
    left: { x: -(PULLEY.x + PULLEY.r), bottom: 0, top: 0, com: 0, size: null, visible: false },
  };

  /**
   * One hanging mass M (single) or masses m2 (left) and m1 (right) (two), and the block m. Positions everything at
   * the start of a run.
   */
  function setup(s) {
    const two = s.kind === 'two';
    const D = travel(s);
    const bs = blockSize(s.m);
    // with two weights the block goes towards the heavier one (the left one in the book's example)
    const leftFalls = two ? twoWeights(s.m2, s.m1, s.m).left : false;
    const dir = two && leftFalls ? -1 : 1;
    cfg = { kind: s.kind, two, D, dir, bs, leftFalls };
    blockBody.clear();
    const box = new THREE.Mesh(new RoundedBoxGeometry(bs.w, bs.h, bs.d, 4, 0.012), [
      mats.blockEdge,
      mats.blockEdge,
      mats.block,
      mats.block,
      mats.block,
      mats.block,
    ]);
    box.position.y = bs.h / 2;
    blockBody.add(box);
    hit.scale.set(bs.w + 0.08, bs.h + 0.06, bs.d + 0.06);
    hit.position.y = bs.h / 2;
    // the block's start: single, its right face (the string's side) D short of the stop bar; two: centred
    cfg.x0 = two ? 0 : PULLEY.x - STOP_GAP - D - bs.w / 2;
    cfg.xEndFace = cfg.x0 + dir * (bs.w / 2 + D); // the leading face at the end of the run
    stopBar.position.set(cfg.xEndFace + dir * 0.0175, BENCH.top + 0.0225, 0);
    gate.position.set(cfg.x0 + dir * (bs.w / 2 + 0.012), BENCH.top, 0);
    // the hooks: the string's end on the faces it pulls from
    hookR.position.set(bs.w / 2 + 0.006, STRING_Y - BENCH.top, 0);
    hookL.position.set(-bs.w / 2 - 0.006, STRING_Y - BENCH.top, 0);
    hookL.visible = two;
    // weights
    if (two) {
      buildWeight(weightL, s.m2);
      buildWeight(weightR, s.m1);
    } else {
      buildWeight(weightR, s.M);
    }
    weightL.group.visible = two;
    pulleyL.visible = two;
    crateL.visible = two;
    strings.left.run.visible = strings.left.drop.visible = strings.left.arc.visible = two;
    G.left.visible = two;
    G.left.size = two ? weightL.size : null;
    G.right.size = weightR.size;
    G.block.w = bs.w;
    G.block.h = bs.h;
    G.block.d = bs.d;
    shadowed.forEach((o) =>
      o.traverse((m) => {
        if (m.isMesh && !m.userData.noShadow) m.castShadow = true;
      }),
    );
    place(0);
  }

  const wheelRight = new THREE.Vector3(PULLEY.x + PULLEY.r, PULLEY.axle, 0);
  const wheelLeft = new THREE.Vector3(-(PULLEY.x + PULLEY.r), PULLEY.axle, 0);
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();

  /** The run at progress p (0 … 1): the block, the weights and the strings. */
  function place(p) {
    if (!cfg) return;
    const { two, dir, D, bs } = cfg;
    const x = cfg.x0 + dir * D * p;
    block.position.set(x, BENCH.top, 0);
    G.block.x = x;
    gate.visible = p <= 0;
    // the weights: single: M falls D; two: m2 (left) falls D while m1 (right) rises D
    if (two) {
      // the heavier weight falls D to its crate while the lighter one rises D
      const falling = START.left - D * p;
      const rising = START.right + D * p;
      G.left.bottom = cfg.leftFalls ? falling : rising;
      G.right.bottom = cfg.leftFalls ? rising : falling;
    } else {
      G.right.bottom = START.single - D * p;
    }
    for (const [side, w, g] of [
      ['right', weightR, G.right],
      ['left', weightL, G.left],
    ]) {
      if (!g.visible && side === 'left') continue;
      if (!w.size) continue;
      g.x = (side === 'right' ? 1 : -1) * (PULLEY.x + PULLEY.r);
      w.group.position.set(g.x, g.bottom, 0);
      g.top = g.bottom + w.height;
      g.com = g.bottom + w.size.body / 2;
    }
    // strings
    if (!two) {
      stretch(strings.right.run, p0.set(x + bs.w / 2 + 0.012, STRING_Y, 0), p1.set(PULLEY.x, STRING_Y, 0));
      stretch(strings.right.drop, p0.set(PULLEY.x + PULLEY.r, PULLEY.axle, 0), p1.set(PULLEY.x + PULLEY.r, G.right.top, 0));
    } else {
      stretch(strings.right.run, p0.set(x + bs.w / 2 + 0.012, STRING_Y, 0), p1.set(PULLEY.x, STRING_Y, 0));
      stretch(strings.right.drop, p0.copy(wheelRight), p1.set(wheelRight.x, G.right.top, 0));
      stretch(strings.left.run, p0.set(x - bs.w / 2 - 0.012, STRING_Y, 0), p1.set(-PULLEY.x, STRING_Y, 0));
      stretch(strings.left.drop, p0.copy(wheelLeft), p1.set(wheelLeft.x, G.left.top, 0));
    }
  }

  /** A weight's knob top (where its string ends), and a point on the block's faces. */
  return {
    root,
    block,
    blockHit: hit,
    weightR,
    weightL,
    setup,
    place,
    /** Where things are now (live object: read it, do not keep it). */
    geom: G,
    get config() {
      return cfg;
    },
    /** The visible body of the block, for a ring on it. */
    get blockBody() {
      return blockBody;
    },
    weightBody: (side) => (side === 'left' ? weightL.body : weightR.body),
    shadowed,
  };
}
