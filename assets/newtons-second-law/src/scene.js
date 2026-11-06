// The setting and the people round the handcart, in metres:
//  - createFloor(): a calm floor in a light blue-slate, one round mesh in vertex colours whose edge fades out (its
//    alpha) into the deep blue backdrop (presentation.js), so there is no horizon line or box edge from any side; the
//    lane painted on it (soft amber edges, a light line across it every metre), and at its far end a low pile of rice
//    sacks that stops the rolling cart (BUFFER_X). Nothing else: no room, no textures (the owner: only the main objects).
//    The lines are merged into one mesh.
//  - createMarks(): the marks the cart's front leaves on the floor every second (thin dark bars across the lane).
//  - createRig(): one handcart with up to two people behind it (who push) and one in front of it (who pushes back),
//    placed from the run of physics.js by place(plan, t).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CART, createCart, createSack, SACK } from './cart.js';
import { createPerson } from './person.js';
import { BUFFER_X, CATCH_X, catcherAt, pusherAt, runAt, START_X } from './physics.js';

export const FLOOR = { cx: 1.6, lane: 0.62 };
const FLOOR_R = [0, 4, 8, 10.5, 13, 15.5, 18, 21]; // m: the rings of the round floor (finer where it fades)
const FLOOR_SOLID = 8; // m from the centre: the floor is solid to here, then fades out by FLOOR_GONE
const FLOOR_GONE = 20;
const FLOOR_STRETCH = 1.5; // the floor is longer along the lane (x) than across it
const FLOOR_IN = new THREE.Color('#3d5c8a'); // a lighter blue-slate in the middle, where the cart runs
const FLOOR_OUT = new THREE.Color('#2e4c7a');
const HIP_BACK = 0.5; // a pusher's hips are this far behind his hands (leaning in)
export const PUSHER_Z = { 1: [0], 2: [-0.27, 0.27] };

/** A geometry painted one colour (a vertex colour), with position/normal/uv only, non-indexed. */
function paint(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  const c = new THREE.Color(color);
  const rgb = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < rgb.length; i += 3) c.toArray(rgb, i);
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  return g;
}

/** The round floor: rings of vertices, each with a colour and an alpha (1 in the middle, 0 at the edge). */
function floorGeometry() {
  const seg = 32;
  const pos = [];
  const col = [];
  const idx = [];
  const c = new THREE.Color();
  for (const r of FLOOR_R)
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pos.push(FLOOR.cx + Math.cos(a) * r * FLOOR_STRETCH, 0, Math.sin(a) * r);
      const k = THREE.MathUtils.smoothstep(r, FLOOR_SOLID, FLOOR_GONE);
      c.lerpColors(FLOOR_IN, FLOOR_OUT, Math.min(1, r / FLOOR_SOLID));
      col.push(c.r, c.g, c.b, 1 - k);
    }
  for (let j = 0; j < FLOOR_R.length - 1; j++)
    for (let i = 0; i < seg; i++) {
      const a = j * seg + i;
      const b = j * seg + ((i + 1) % seg);
      idx.push(a, b, a + seg, b, b + seg, a + seg); // counter-clockwise from above
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const up = pos.map((_, i) => (i % 3 === 1 ? 1 : 0));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(up, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  g.setIndex(idx);
  return g;
}

/** The floor with the lane, and the sacks at the end of the lane. */
export function createFloor(cartM) {
  const group = new THREE.Group();
  group.name = 'Floor';

  // its edge fades into the backdrop (alpha), drawn first of the see-through things and writing no depth, so the
  // lines and marks on it and the shadows it takes stay as they are
  const floorMat = new THREE.MeshStandardMaterial({
    name: 'Floor',
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    roughness: 0.82,
    metalness: 0,
  });
  const floor = new THREE.Mesh(floorGeometry(), floorMat);
  floor.name = 'SmoothFloor';
  floor.renderOrder = -1;
  floor.receiveShadow = true;
  floor.userData.noExport = true; // the GLB carries the lane on it, the sacks, the cart and its people (as before)
  group.add(floor);

  // painted on the floor (just above it): the lane's amber edges, a light line across it each metre
  const flat = (x0, x1, z0, z1, color, y = 0.0015) =>
    paint(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2), color);
  const lines = [];
  for (const z of [-FLOOR.lane, FLOOR.lane]) lines.push(flat(-2.6, BUFFER_X, z - 0.035, z + 0.035, '#f6c453'));
  for (let x = START_X; x <= BUFFER_X - 0.3; x += 1)
    lines.push(flat(x - 0.014, x + 0.014, -FLOOR.lane + 0.035, FLOOR.lane - 0.035, '#e8f0fa', 0.002));
  const lineMat = new THREE.MeshStandardMaterial({
    name: 'FloorPaint',
    vertexColors: true,
    roughness: 0.5,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const laneLines = new THREE.Mesh(mergeGeometries(lines, false), lineMat);
  for (const g of lines) g.dispose();
  laneLines.name = 'LaneLines';
  laneLines.receiveShadow = true;
  group.add(laneLines);

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
  const m = new THREE.MeshBasicMaterial({ color: '#17233a', toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
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
