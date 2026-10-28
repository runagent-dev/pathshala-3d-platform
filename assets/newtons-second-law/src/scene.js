// The floor and the people round the handcart, in metres:
//  - createFloor(): a smooth, polished floor (saturated teal tiles, with a line every metre across the lane), and at its far end a low pile of rice sacks that stops the rolling cart (BUFFER_X).
//  - createMarks(): the marks the cart's front leaves on the floor every second (thin dark bars across the lane).
//  - createRig(): one handcart with up to two people behind it (who push) and one in front of it (who pushes back),
//    placed from the run of physics.js by place(plan, t).
import * as THREE from 'three';
import { CART, createCart, createSack, SACK } from './cart.js';
import { createPerson } from './person.js';
import { BUFFER_X, CATCH_X, catcherAt, pusherAt, runAt, START_X } from './physics.js';

export const FLOOR = { x0: -4.2, x1: 7.6, z0: -2.2, z1: 2.4, lane: 0.62 };
const HIP_BACK = 0.5; // a pusher's hips are this far behind his hands (leaning in)
export const PUSHER_Z = { 1: [0], 2: [-0.27, 0.27] };

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** The floor: tiles, the lane's edges, a line each metre, fading to white at the edges; the sacks at its end. */
export function createFloor(cartM) {
  const group = new THREE.Group();
  group.name = 'Floor';
  const W = FLOOR.x1 - FLOOR.x0;
  const D = FLOOR.z1 - FLOOR.z0;
  const px = 160; // texture pixels per metre
  const tex = canvasTexture(Math.round(W * px * 0.5), Math.round(D * px * 0.5), (ctx, w, h) => {
    const k = w / W; // pixels per metre
    const X = (x) => (x - FLOOR.x0) * k;
    const Z = (z) => (z - FLOOR.z0) * k;
    ctx.fillStyle = '#158a98';
    ctx.fillRect(0, 0, w, h);
    // polished tiles, 0.6 m
    ctx.strokeStyle = 'rgba(123,231,220,0.18)';
    ctx.lineWidth = 1.2;
    for (let x = Math.ceil(FLOOR.x0 / 0.6) * 0.6; x < FLOOR.x1; x += 0.6) {
      ctx.beginPath();
      ctx.moveTo(X(x), 0);
      ctx.lineTo(X(x), h);
      ctx.stroke();
    }
    for (let z = Math.ceil(FLOOR.z0 / 0.6) * 0.6; z < FLOOR.z1; z += 0.6) {
      ctx.beginPath();
      ctx.moveTo(0, Z(z));
      ctx.lineTo(w, Z(z));
      ctx.stroke();
    }
    // the lane: two painted edges from the start to the sacks
    ctx.fillStyle = 'rgba(255,211,72,0.9)';
    for (const z of [-FLOOR.lane, FLOOR.lane]) ctx.fillRect(X(-2.6), Z(z) - 1.5, X(BUFFER_X) - X(-2.6), 3);
    // a line across the lane every metre from the start
    ctx.fillStyle = 'rgba(206,249,241,0.5)';
    for (let x = START_X; x <= BUFFER_X - 0.3; x += 1) ctx.fillRect(X(x) - 1, Z(-FLOOR.lane), 2, Z(FLOOR.lane) - Z(-FLOOR.lane));
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const floorMat = new THREE.MeshStandardMaterial({
    name: 'SmoothFloor',
    map: tex,
    transparent: false,
    depthWrite: true,
    roughness: 0.4,
    metalness: 0,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.name = 'SmoothFloor';
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((FLOOR.x0 + FLOOR.x1) / 2, 0, (FLOOR.z0 + FLOOR.z1) / 2);
  floor.receiveShadow = true;
  floor.renderOrder = -1;
  group.add(floor);

  // the pile of sacks at the end of the floor: two on the floor, one on top
  const pile = new THREE.Group();
  pile.name = 'SackPile';
  const spots = [
    [BUFFER_X + SACK.x / 2 + 0.01, SACK.y / 2],
    [BUFFER_X + SACK.x * 1.5 + 0.02, SACK.y / 2],
    [BUFFER_X + SACK.x + 0.015, SACK.y * 1.5 - 0.03],
  ];
  const sacks = spots.map(([x, y]) => {
    const s = createSack(cartM);
    s.position.set(x, y, 0);
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
      sacks[0].position.x = spots[0][0] + d / 2;
      sacks[0].scale.x = 1 - d / SACK.x;
      sacks[2].position.x = spots[2][0] + d * 0.5;
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
