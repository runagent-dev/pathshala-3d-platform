// The setting and the people round the handcart, in metres:
//  - createFloor(): a rice godown (চালের গুদাম): a smooth, polished cement floor (warm grey, mottled, saw-cut joints),
//    the lane painted on it (yellow edges, a white line across it every metre), and at its far end a low pile of rice
//    sacks that stops the rolling cart (BUFFER_X). Round it, the room: sand-coloured lime-washed walls over a brown
//    dado, square pillars with a yellow-and-black foot, high barred windows, jute sacks stacked on wooden pallets and
//    a platform scale. Warm neutrals only, so every arrow (dark, teal, blue, green, orange) stands out against it.
//    Everything that never moves is merged into a few meshes, one per material.
//  - createMarks(): the marks the cart's front leaves on the floor every second (thin dark bars across the lane).
//  - createRig(): one handcart with up to two people behind it (who push) and one in front of it (who pushes back),
//    placed from the run of physics.js by place(plan, t).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CART, createCart, createSack, SACK, sackGeometry } from './cart.js';
import { createPerson } from './person.js';
import { BUFFER_X, CATCH_X, catcherAt, pusherAt, runAt, START_X } from './physics.js';

export const FLOOR = { x0: -9, x1: 13, z0: -2.6, z1: 7, lane: 0.62 };
const WALL_H = 4.4;
const HIP_BACK = 0.5; // a pusher's hips are this far behind his hands (leaning in)
export const PUSHER_Z = { 1: [0], 2: [-0.27, 0.27] };

/** A seeded random number generator (the same room every time). */
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** A canvas texture, repeating, in sRGB. */
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Soft blotches that tile seamlessly (each drawn again across the edges). */
function blotches(ctx, w, h, rnd, n, rgb, alpha, rMin, rMax) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = rMin + rnd() * (rMax - rMin);
    const a = alpha * (0.4 + rnd() * 0.6);
    for (const dx of [-w, 0, w])
      for (const dy of [-h, 0, h]) {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        g.addColorStop(0, `rgba(${rgb},${a})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
      }
  }
}

/** Polished cement: warm grey, mottled, with faint trowel arcs; one tile is 2 m × 2 m. */
function cementTexture() {
  const rnd = rng(5);
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#968b7c';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, rnd, 40, '120,108,94', 0.22, 30, 110);
    blotches(ctx, w, h, rnd, 30, '196,186,170', 0.2, 20, 90);
    ctx.lineWidth = 1;
    for (let i = 0; i < 90; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 20 + rnd() * 60;
      const a0 = rnd() * Math.PI * 2;
      ctx.strokeStyle = `rgba(${rnd() < 0.5 ? '230,222,206' : '104,94,82'},${0.05 + rnd() * 0.07})`;
      for (const dx of [-w, 0, w])
        for (const dy of [-h, 0, h]) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, r, a0, a0 + 0.6 + rnd() * 0.8);
          ctx.stroke();
        }
    }
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(${rnd() < 0.5 ? '70,62,54' : '235,228,214'},${0.08 + rnd() * 0.14})`;
      ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
    }
  });
}

/** Lime-washed plaster: sand above, a brown dado below with a dark line on top; one tile is 2.2 m wide, the full height. */
function wallTexture() {
  const rnd = rng(9);
  return canvasTexture(256, 512, (ctx, w, h) => {
    const dado = h * (1 - 1.05 / WALL_H); // y (px) of the dado's top
    ctx.fillStyle = '#d3b47f';
    ctx.fillRect(0, 0, w, dado);
    blotches(ctx, w, h, rnd, 26, '178,140,86', 0.2, 14, 60);
    blotches(ctx, w, h, rnd, 18, '236,214,170', 0.25, 10, 50);
    // a damp shadow over the dado, faint streaks down from the windows
    const damp = ctx.createLinearGradient(0, dado - 50, 0, dado);
    damp.addColorStop(0, 'rgba(150,112,70,0)');
    damp.addColorStop(1, 'rgba(150,112,70,0.28)');
    ctx.fillStyle = damp;
    ctx.fillRect(0, dado - 50, w, 50);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `rgba(160,124,80,${0.05 + rnd() * 0.06})`;
      ctx.fillRect(rnd() * w, h * 0.22, 2 + rnd() * 5, h * (0.2 + rnd() * 0.3));
    }
    ctx.fillStyle = '#8c745c';
    ctx.fillRect(0, dado, w, h - dado);
    blotches(ctx, w, h, rnd, 14, '110,88,66', 0.25, 10, 34);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(${rnd() < 0.5 ? '90,70,52' : '200,170,130'},${0.1 + rnd() * 0.15})`;
      ctx.fillRect(rnd() * w, dado + rnd() * (h - dado), 1 + rnd() * 2, 1);
    }
    ctx.fillStyle = '#5d4a3a';
    ctx.fillRect(0, dado - 3, w, 4);
  });
}

/** A geometry painted one colour (a vertex colour), with position/normal/uv only, non-indexed, moved by `m`. */
function paint(geo, color, m = null) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  if (m) g.applyMatrix4(m);
  const c = new THREE.Color(color);
  const rgb = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < rgb.length; i += 3) c.toArray(rgb, i);
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  return g;
}
const box = (w, h, d, x, y, z, color) => paint(new THREE.BoxGeometry(w, h, d).translate(x, y, z), color);
/** A plane whose uv runs in tiles of `tile` m (so a repeating texture keeps its scale on any size). */
function tiledPlane(w, h, tile) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile[0], (uv.getY(i) * h) / tile[1]);
  return g;
}
function merged(geos, material, name) {
  const mesh = new THREE.Mesh(mergeGeometries(geos, false), material);
  for (const g of geos) g.dispose();
  mesh.name = name;
  return mesh;
}

/** The godown: the floor with the lane, the room round it, and the sacks at the end of the lane. */
export function createFloor(cartM) {
  const group = new THREE.Group();
  group.name = 'Floor';
  const room = new THREE.Group();
  room.name = 'Godown';
  room.userData.noExport = true; // the GLB carries the floor, the lane and the cart, not the room
  const W = FLOOR.x1 - FLOOR.x0;
  const D = FLOOR.z1 - FLOOR.z0;

  const floorMat = new THREE.MeshStandardMaterial({ name: 'PolishedCement', map: cementTexture(), roughness: 0.38, metalness: 0 });
  const floor = new THREE.Mesh(tiledPlane(W, D, [2, 2]), floorMat);
  floor.name = 'SmoothFloor';
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((FLOOR.x0 + FLOOR.x1) / 2, 0, (FLOOR.z0 + FLOOR.z1) / 2);
  floor.receiveShadow = true;
  floor.userData.noExport = true; // the GLB carries the cart, its people, the lane and the sacks, not the whole floor
  group.add(floor);

  // painted on the floor (just above it): saw-cut joints every 2 m, the lane's yellow edges, a white line each metre
  const flat = (x0, x1, z0, z1, color, y = 0.0015) =>
    paint(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2), color);
  const lines = [];
  const joints = [];
  for (let x = Math.ceil(FLOOR.x0 / 2) * 2 + 1; x < FLOOR.x1; x += 2) joints.push(flat(x - 0.007, x + 0.007, FLOOR.z0, FLOOR.z1, '#6c6255', 0.001));
  for (let z = FLOOR.z0 + 1.6; z < FLOOR.z1; z += 2) joints.push(flat(FLOOR.x0, FLOOR.x1, z - 0.007, z + 0.007, '#6c6255', 0.001));
  for (const z of [-FLOOR.lane, FLOOR.lane]) lines.push(flat(-2.6, BUFFER_X, z - 0.035, z + 0.035, '#f2b705'));
  for (let x = START_X; x <= BUFFER_X - 0.3; x += 1)
    lines.push(flat(x - 0.014, x + 0.014, -FLOOR.lane + 0.035, FLOOR.lane - 0.035, '#f3eee4', 0.002));
  const lineMat = new THREE.MeshStandardMaterial({
    name: 'FloorPaint',
    vertexColors: true,
    roughness: 0.5,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const laneLines = merged(lines, lineMat, 'LaneLines');
  laneLines.receiveShadow = true;
  group.add(laneLines);
  const jointLines = merged(joints, lineMat, 'FloorJoints');
  jointLines.receiveShadow = true;
  room.add(jointLines);

  // the walls: the back wall and the two ends, one mesh (the texture tiles every 2.2 m)
  const wallMat = new THREE.MeshStandardMaterial({ name: 'LimeWash', map: wallTexture(), roughness: 0.92, metalness: 0 });
  const back = tiledPlane(W, WALL_H, [2.2, WALL_H]).translate((FLOOR.x0 + FLOOR.x1) / 2, WALL_H / 2, FLOOR.z0);
  const left = tiledPlane(D, WALL_H, [2.2, WALL_H])
    .rotateY(Math.PI / 2)
    .translate(FLOOR.x0, WALL_H / 2, (FLOOR.z0 + FLOOR.z1) / 2);
  const right = tiledPlane(D, WALL_H, [2.2, WALL_H])
    .rotateY(-Math.PI / 2)
    .translate(FLOOR.x1, WALL_H / 2, (FLOOR.z0 + FLOOR.z1) / 2);
  room.add(merged([back, left, right], wallMat, 'Walls'));

  // the painted and plain parts of the room, one mesh in vertex colours
  const rnd = rng(21);
  const parts = [];
  const zw = FLOOR.z0;
  // a dark skirting along the back wall
  parts.push(box(W, 0.1, 0.03, (FLOOR.x0 + FLOOR.x1) / 2, 0.05, zw + 0.015, '#4a3d33'));
  // square pillars: plaster above, the dado colour below, a yellow-and-black foot
  const PILLARS = [-5.8, -1.9, 2.0, 5.9, 9.8];
  for (const x of PILLARS) {
    const z = zw + 0.2;
    parts.push(box(0.42, WALL_H - 1.05, 0.4, x, 1.05 + (WALL_H - 1.05) / 2, z, '#dcc39a'));
    parts.push(box(0.43, 1.05 - 0.36, 0.41, x, 0.36 + (1.05 - 0.36) / 2, z, '#8c745c'));
    for (let k = 0; k < 4; k++) parts.push(box(0.44, 0.09, 0.42, x, 0.045 + k * 0.09, z, k % 2 ? '#f2b705' : '#22252a'));
  }
  // high windows between the pillars: a dark frame and four bars each; the glass is its own mesh (bright)
  const glass = [];
  const WINDOWS = [-7.75, -3.85, 0.05, 3.95, 7.85, 11.6];
  for (const x of WINDOWS) {
    const y = 3.1;
    glass.push(new THREE.PlaneGeometry(1.36, 0.8).translate(x, y, zw + 0.012));
    parts.push(box(1.5, 0.07, 0.06, x, y + 0.435, zw + 0.03, '#3a4048'));
    parts.push(box(1.56, 0.08, 0.14, x, y - 0.44, zw + 0.07, '#9a8466'));
    for (const dx of [-0.72, 0.72]) parts.push(box(0.07, 0.9, 0.06, x + dx, y, zw + 0.03, '#3a4048'));
    for (let k = 1; k < 6; k++) parts.push(box(0.022, 0.8, 0.022, x - 0.68 + (k * 1.36) / 6, y, zw + 0.04, '#2c3036'));
  }
  // wooden pallets with jute sacks stacked on them, against the back wall (and a short stack at the far end)
  const sacks = [];
  const sackGeo = sackGeometry();
  const mtx = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const pallet = (x, z) => {
    for (const dz of [-0.4, 0, 0.4]) parts.push(box(1.2, 0.08, 0.1, x, 0.04, z + dz, '#7a5a3a'));
    for (let k = 0; k < 7; k++) parts.push(box(0.12, 0.025, 0.9, x - 0.54 + k * 0.18, 0.0925, z, k % 2 ? '#9c7a52' : '#8f6d47'));
  };
  const stack = (x, z, layers, across = 2) => {
    pallet(x, z);
    for (let l = 0; l < layers; l++)
      for (let i = 0; i < across; i++) {
        if (l === layers - 1 && rnd() < 0.3) continue;
        const sx = x + (i - (across - 1) / 2) * (SACK.x + 0.04) + (rnd() - 0.5) * 0.04;
        const sy = 0.105 + SACK.y / 2 + l * (SACK.y - 0.035);
        quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, (rnd() - 0.5) * 0.12 + (l % 2 ? 0.05 : -0.04));
        const g = sackGeo.clone().applyMatrix4(mtx.compose(new THREE.Vector3(sx, sy, z + (rnd() - 0.5) * 0.05), quat, one));
        sacks.push(g);
      }
  };
  stack(-4.0, zw + 0.6, 4);
  stack(-7.7, zw + 0.6, 3);
  stack(3.95, zw + 0.6, 3);
  stack(7.9, zw + 0.6, 4);
  stack(11.6, zw + 0.6, 2);
  stack(11.0, zw + 2.2, 3); // beside the lane's far end
  // a platform scale against the wall (base, column, dial)
  {
    const x = 9.2;
    const z = zw + 0.5;
    parts.push(box(0.62, 0.08, 0.5, x, 0.04, z, '#4b5763'));
    parts.push(box(0.56, 0.015, 0.44, x, 0.0875, z, '#7c8894'));
    parts.push(paint(new THREE.CylinderGeometry(0.025, 0.03, 0.95, 10).translate(x, 0.55, z - 0.2), '#4b5763'));
    parts.push(paint(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 24).rotateX(Math.PI / 2).translate(x, 1.1, z - 0.2), '#3a4048'));
    parts.push(paint(new THREE.CircleGeometry(0.125, 24).translate(x, 1.1, z - 0.165), '#f4ecd8'));
    parts.push(box(0.012, 0.1, 0.004, x + 0.02, 1.13, z - 0.162, '#c0392b'));
  }
  const roomPaint = new THREE.MeshStandardMaterial({ name: 'GodownPaint', vertexColors: true, roughness: 0.78, metalness: 0 });
  room.add(merged(parts, roomPaint, 'GodownParts'));
  const glassMat = new THREE.MeshBasicMaterial({ name: 'WindowLight', color: '#cfe6f3', toneMapped: false });
  room.add(merged(glass, glassMat, 'WindowGlass'));
  const stacked = merged(sacks, cartM.jute, 'SackStacks');
  room.add(stacked);
  group.add(room);

  // the pile of sacks at the end of the floor: two on the floor, one on top
  const pile = new THREE.Group();
  pile.name = 'SackPile';
  const spots = [
    [BUFFER_X + SACK.x / 2 + 0.01, SACK.y / 2],
    [BUFFER_X + SACK.x * 1.5 + 0.02, SACK.y / 2],
    [BUFFER_X + SACK.x + 0.015, SACK.y * 1.5 - 0.03],
  ];
  const pileSacks = spots.map(([x, y]) => {
    const s = createSack(cartM);
    s.position.set(x, y, 0);
    s.castShadow = true;
    pile.add(s);
    return s;
  });
  group.add(pile);
  return {
    group,
    floor,
    room,
    pile,
    /** The front sacks give way by `d` m as they stop the cart. */
    squash(d) {
      pileSacks[0].position.x = spots[0][0] + d / 2;
      pileSacks[0].scale.x = 1 - d / SACK.x;
      pileSacks[2].position.x = spots[2][0] + d * 0.5;
    },
  };
}

/** The marks the cart's front leaves on the floor every second: up to `max` thin bars across the lane. */
export function createMarks(max = 12) {
  const geo = new THREE.BoxGeometry(0.03, 0.004, 2 * FLOOR.lane - 0.12);
  const m = new THREE.MeshBasicMaterial({ color: '#3a4350', toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const mesh = new THREE.InstancedMesh(geo, m, max);
  mesh.name = 'SecondMarks';
  mesh.count = 0;
  mesh.frustumCulled = false;
  const mtx = new THREE.Matrix4();
  const xs = [];
  return {
    mesh,
    xs,
    get count() {
      return xs.length;
    },
    add(x) {
      if (xs.length >= max) return;
      xs.push(x);
      mtx.makeTranslation(x, 0.002, 0);
      mesh.setMatrixAt(xs.length - 1, mtx);
      mesh.count = xs.length;
      mesh.instanceMatrix.needsUpdate = true;
    },
    clear() {
      xs.length = 0;
      mesh.count = 0;
    },
  };
}

const SHIRTS = [
  { shirt: '#ffb51b', trousers: '#4b43c4', skin: '#b27b50', ponytail: true }, // the first pusher: a white shirt
  { shirt: '#ef478d', trousers: '#193d72', skin: '#9c6a43' }, // the second pusher: a pale yellow shirt
  { shirt: '#3079e6', trousers: '#25334b', skin: '#a8734a' }, // the person in front: grey-green
];

/**
 * One handcart and its people. setup({ pushers, sacks, back }) says who is there; place(plan, t, opts) puts
 * everything where the run says at t s (the cart's front at baseX + x).
 * @param {{ M: any, name?: string }} options
 */
export function createRig({ M, name = 'Rig' }) {
  const root = new THREE.Group();
  root.name = name;
  const cart = createCart(M);
  root.add(cart.root);
  const people = SHIRTS.map((look, i) => {
    const p = createPerson({ ...look, name: i < 2 ? `Pusher${i + 1}` : 'PersonInFront' });
    root.add(p.root);
    return p;
  });
  const passenger = createPerson({ shirt: '#13d8d5', trousers: '#233b72', skin: '#bd835b', name: 'ChildPassenger' });
  passenger.root.scale.setScalar(0.62);
  passenger.root.position.set(-0.96, 0.55, 0);
  passenger.pose({ seated: true, lean: 0.04, hands: [new THREE.Vector3(0.32, 0.43, 0.16), new THREE.Vector3(0.32, 0.43, -0.16)] });
  cart.body.add(passenger.root);
  const catcher = people[2];
  catcher.root.rotation.y = Math.PI; // faces the cart, toward −x
  const cfg = { pushers: 1, sacks: 0, back: false };
  let baseX = 0;
  const handR = new THREE.Vector3();
  const handL = new THREE.Vector3();
  const g = CART.grip;

  function setup({ pushers = 1, sacks = 0, back = false } = {}) {
    cfg.pushers = pushers;
    cfg.sacks = sacks;
    cfg.back = back;
    cart.setLoad(sacks);
    people[0].root.scale.setScalar(pushers === 2 ? 0.86 : 1);
    people[1].root.scale.setScalar(0.84);
    people[0].root.visible = pushers >= 1;
    people[1].root.visible = pushers >= 2;
    catcher.root.visible = back;
  }

  /** A pusher behind the cart: on the crossbar while pushing, then letting go and slowing to a stop. */
  function placePusher(p, z, st, letGo) {
    const gripX = baseX + START_X + g.x + st.dx; // where the crossbar was when he last held it, or is now
    const scale = p.root.scale.x;
    const hip = gripX - HIP_BACK * scale;
    p.root.position.set(hip, 0, z);
    const speed = st.v;
    // after letting go the arms come down over 0.4 s
    const reach = st.on ? 1 : Math.max(0, 1 - letGo / 0.4);
    const lean = 0.06 + 0.32 * (st.on ? 1 : reach) + Math.min(0.12, speed * 0.03);
    const cartGrip = cart.root.position.x + g.x; // the crossbar now
    const hx = st.on ? cartGrip - hip : Math.min(cartGrip - hip, HIP_BACK + 0.02);
    // the hands, in the person's own space (+z is world +z here): shoulder-wide on the crossbar
    const w = z === 0 ? 0.18 : 0.15;
    handR.set(hx / scale, g.y / scale, w / scale);
    handL.set(hx / scale, g.y / scale, -w / scale);
    p.pose({
      lean,
      hands: reach > 0.05 ? [handR, handL] : [null, null],
      walk: (Math.PI * st.dx) / (0.62 * scale),
      stride: 0.31,
      lift: speed > 0.01 ? 0.05 + Math.min(0.08, speed * 0.02) : 0,
      spread: 0.1,
    });
  }

  /** The person in front ("back"): hands up, ready; then pushing back against the cart's front as it slows. */
  function placeCatcher(st) {
    const handsX = baseX + CATCH_X + CART.rail.x + st.dx; // where his hands are (world x): on the front rail
    const hipBack = 0.46;
    catcher.root.position.set(handsX + hipBack, 0, 0);
    // in his own space +x is toward the cart (world −x)
    handR.set(hipBack - 0.03, CART.rail.y, 0.17);
    handL.set(hipBack - 0.03, CART.rail.y, -0.17);
    catcher.pose({
      lean: st.on ? 0.36 : 0.16,
      hands: [handR, handL],
      walk: (-Math.PI * st.dx) / 0.5,
      stride: 0.25,
      lift: st.v > 0.01 ? 0.04 : 0,
      spread: 0.11,
    });
  }

  /**
   * @param {any} plan from physics.planOf (null: everything at rest at the start)
   * @param {number} t s after the push began
   */
  function place(plan, t = 0) {
    const r = plan ? runAt(plan, t) : { x: START_X, v: 0 };
    cart.root.position.set(baseX + r.x, 0, 0);
    cart.roll(r.x - START_X);
    const zs = PUSHER_Z[cfg.pushers] || PUSHER_Z[1];
    const st = plan ? pusherAt(plan, t) : { dx: 0, v: 0, on: false };
    const letGo = plan ? Math.max(0, t - plan.segs[0].dur) : 1;
    // before the push (no run) the pushers stand with their hands on the crossbar, ready
    const ready = plan ? st : { ...st, on: true };
    zs.forEach((z, i) => placePusher(people[i], z, ready, plan ? letGo : 0));
    if (cfg.back) placeCatcher(plan ? catcherAt(plan, t) : { dx: 0, v: 0, on: false });
    return r;
  }

  return {
    root,
    cart,
    people,
    catcher,
    passenger,
    cfg,
    setup,
    place,
    get baseX() {
      return baseX;
    },
    set baseX(x) {
      baseX = x;
    },
    /** World x of the cart's front, now. */
    front: () => cart.root.position.x,
  };
}
