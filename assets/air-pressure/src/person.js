// The body part's people, in metres, standing on y = 0 and facing +z (toward the camera in the front view): a friendly
// student (a green short-sleeved shirt, grey trousers, white shoes, a smiling face with eyes, brows, nose and ears,
// black hair, hands with a thumb) about 1.6 m tall, the arms a little out from the sides; and the pressure suit that
// closes round the same student (a white suit with grey joint rings, gloves, boots, a backpack, a chest box, a small
// flag on the arm, and a glass helmet with a gold sun visor pushed up, so the face still shows).
//
// Everything is built from a few lathe, sphere and box shapes and merged into one mesh per material, so the student is
// about ten draw calls and the suit about eight. The suit's materials share one clipping plane: the figure raises it
// from the feet to the shoulders to make the suit close round the student (the helmet comes down from above).
// `spots` are where the pressure arrows touch: the same nine places round the student and round the suit, as a point
// on the outline in the front plane and the way out of the body there.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// the student's proportions (a class-9 student, a little stylised: the head is a bit big, which reads as friendly)
const HEAD = { y: 1.5, rx: 0.098, ry: 0.122, rz: 0.108 };
const SHOULDER = { x: 0.185, y: 1.31 };
const ARM_TILT = 0.16; // rad: the arms hang a little out from the sides
const ARM_LEN = 0.56; // shoulder to wrist
const HIP = { x: 0.085, y: 0.86 };
// the suit
const S_ARM_R = 0.078;
const S_LEG_R = 0.1;
const HELMET_R = 0.2;
export const SUIT_TOP = 1.36; // the suit's collar (the helmet sits on it)

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });

/** A rounded, tapered limb along +y from 0 to len: radius r0 at the bottom, r1 at the top, round at both ends. */
function pill(r0, r1, len, seg = 18) {
  const pts = [];
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r0), r0 + Math.sin(a) * r0));
  }
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r1), len - r1 + Math.sin(a) * r1));
  }
  return new THREE.LatheGeometry(pts, seg);
}

/** A lathe from [y, r] pairs (bottom to top), closed at both ends. */
function lathe(profile, seg = 24) {
  const pts = profile.map(([y, r]) => new THREE.Vector2(Math.max(1e-4, r), y));
  return new THREE.LatheGeometry(pts, seg);
}

/** Collects shapes by material, each placed by a matrix, and merges them into one mesh per material. */
function builder() {
  /** @type {Map<THREE.Material, THREE.BufferGeometry[]>} */
  const byMat = new Map();
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const sc = new THREE.Vector3();
  const at = new THREE.Vector3();
  function add(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
    let g = geo.clone();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    g.applyMatrix4(m4.compose(at.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), sc.set(sx, sy, sz)));
    if (!g.index) g = indexed(g);
    if (!byMat.has(material)) byMat.set(material, []);
    byMat.get(material).push(g);
  }
  function build(name, { cast = true } = {}) {
    const group = new THREE.Group();
    group.name = name;
    for (const [material, list] of byMat) {
      const merged = mergeGeometries(list, false);
      for (const g of list) g.dispose();
      const mesh = new THREE.Mesh(merged, material);
      mesh.name = `${name}-${material.name || 'part'}`;
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    byMat.clear();
    return group;
  }
  return { add, build };
}

function indexed(g) {
  const n = g.attributes.position.count;
  const idx = new Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  g.setIndex(idx);
  return g;
}

/** A smile: part of a thin torus, the ends turned up. */
function smile(r, tube) {
  return new THREE.TorusGeometry(r, tube, 6, 16, Math.PI * 0.62).rotateZ(Math.PI + Math.PI * 0.19);
}

/** The arm's own frame: from the shoulder, down and a little out. side = ±1 (+1 is the student's left, screen right). */
function armAt(side, t, out = new THREE.Vector3()) {
  return out.set(side * (SHOULDER.x + Math.sin(ARM_TILT) * ARM_LEN * t), SHOULDER.y - Math.cos(ARM_TILT) * ARM_LEN * t, 0);
}

function createStudent() {
  const M = {
    skin: mat('#b5764a', { name: 'Skin', roughness: 0.62 }),
    shirt: mat('#2f9e6e', { name: 'Shirt', roughness: 0.85 }),
    collar: mat('#e9f5ee', { name: 'Collar', roughness: 0.8 }),
    trousers: mat('#4b5563', { name: 'Trousers', roughness: 0.88 }),
    belt: mat('#3b2a1e', { name: 'Belt', roughness: 0.6 }),
    shoe: mat('#f4f5f7', { name: 'Shoe', roughness: 0.6 }),
    sole: mat('#2c2f36', { name: 'Sole', roughness: 0.9 }),
    hair: mat('#17120e', { name: 'Hair', roughness: 0.55 }),
    dark: mat('#1b1512', { name: 'Eye', roughness: 0.3 }),
    white: mat('#ffffff', { name: 'EyeWhite', roughness: 0.4 }),
    lips: mat('#7a3b2c', { name: 'Lips', roughness: 0.6 }),
  };
  const body = builder();
  const head = builder();
  const sph = new THREE.SphereGeometry(1, 24, 16);
  const sphS = new THREE.SphereGeometry(1, 12, 8);

  // legs (trousers) and shoes
  for (const s of [-1, 1]) {
    body.add(pill(0.052, 0.074, HIP.y - 0.06), M.trousers, { x: s * HIP.x, y: 0.06, rz: s * 0.02 });
    body.add(new THREE.CylinderGeometry(0.056, 0.056, 0.03, 16), M.trousers, { x: s * (HIP.x + 0.012), y: 0.105 }); // the hem
    body.add(sph, M.shoe, { x: s * (HIP.x + 0.012), y: 0.05, z: 0.04, sx: 0.058, sy: 0.05, sz: 0.125 });
    body.add(new THREE.BoxGeometry(1, 1, 1), M.sole, { x: s * (HIP.x + 0.012), y: 0.012, z: 0.04, sx: 0.112, sy: 0.024, sz: 0.25 });
  }
  // hips and the shirt (a short-sleeved shirt, not tucked in), the collar, the belt
  body.add(
    lathe([
      [0.8, 0.0],
      [0.8, 0.13],
      [0.86, 0.15],
      [0.97, 0.145],
      [1.0, 0.0],
    ]),
    M.trousers,
    { sz: 0.66 },
  );
  body.add(new THREE.TorusGeometry(0.147, 0.012, 6, 28).rotateX(Math.PI / 2), M.belt, { y: 0.955, sz: 0.66 });
  body.add(
    lathe([
      [0.93, 0.0],
      [0.93, 0.158],
      [1.0, 0.152],
      [1.1, 0.162],
      [1.2, 0.17],
      [1.28, 0.165],
      [1.33, 0.13],
      [1.36, 0.07],
      [1.37, 0.0],
    ]),
    M.shirt,
    { sz: 0.64 },
  );
  body.add(new THREE.TorusGeometry(0.055, 0.016, 6, 20).rotateX(Math.PI / 2), M.collar, { y: 1.365, z: 0.004, sz: 0.85 });
  // neck
  body.add(new THREE.CylinderGeometry(0.042, 0.047, 0.1, 16), M.skin, { y: 1.39 });
  // arms: a short sleeve, the bare arm, a hand with a thumb
  for (const s of [-1, 1]) {
    const sh = armAt(s, 0);
    body.add(sph, M.shirt, { x: sh.x - s * 0.01, y: sh.y - 0.02, sx: 0.06, sy: 0.058, sz: 0.06 }); // the shoulder
    const sl = armAt(s, 0.36);
    body.add(pill(0.05, 0.058, 0.2), M.shirt, { x: sl.x, y: sl.y, rz: s * ARM_TILT });
    const w = armAt(s, 1);
    body.add(pill(0.033, 0.042, ARM_LEN * 0.82), M.skin, { x: w.x, y: w.y, rz: s * ARM_TILT });
    const h = armAt(s, 1.08);
    body.add(sph, M.skin, { x: h.x, y: h.y, sx: 0.034, sy: 0.058, sz: 0.026, rz: s * ARM_TILT });
    body.add(sphS, M.skin, { x: h.x - s * 0.006, y: h.y + 0.012, z: 0.026, sx: 0.013, sy: 0.026, sz: 0.013, rz: -s * 0.4 }); // thumb
  }

  // the head: face, ears, hair, eyes (white, dark, a glint), brows, nose, smile
  head.add(sph, M.skin, { y: HEAD.y, sx: HEAD.rx, sy: HEAD.ry, sz: HEAD.rz });
  head.add(sph, M.skin, { y: HEAD.y - 0.045, z: 0.01, sx: 0.08, sy: 0.075, sz: 0.088 }); // the jaw and cheeks
  for (const s of [-1, 1]) head.add(sph, M.skin, { x: s * 0.097, y: HEAD.y - 0.005, sx: 0.016, sy: 0.03, sz: 0.022 });
  head.add(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), M.hair, {
    y: HEAD.y + 0.008,
    z: -0.008,
    rx: -0.32,
    sx: HEAD.rx + 0.01,
    sy: HEAD.ry + 0.01,
    sz: HEAD.rz + 0.012,
  });
  head.add(sph, M.hair, { y: HEAD.y + 0.085, z: 0.06, rx: 0.5, sx: 0.085, sy: 0.03, sz: 0.05 }); // the fringe
  const fz = HEAD.rz * 0.93;
  for (const s of [-1, 1]) {
    head.add(sphS, M.white, { x: s * 0.036, y: HEAD.y + 0.012, z: fz - 0.006, sx: 0.017, sy: 0.02, sz: 0.01 });
    head.add(sphS, M.dark, { x: s * 0.035, y: HEAD.y + 0.01, z: fz + 0.001, sx: 0.011, sy: 0.014, sz: 0.008 });
    head.add(sphS, M.white, { x: s * 0.031, y: HEAD.y + 0.016, z: fz + 0.008, sx: 0.0035, sy: 0.0035, sz: 0.002 });
    head.add(new THREE.BoxGeometry(1, 1, 1), M.hair, {
      x: s * 0.037,
      y: HEAD.y + 0.045,
      z: fz - 0.002,
      rz: -s * 0.12,
      sx: 0.034,
      sy: 0.007,
      sz: 0.008,
    });
  }
  head.add(sphS, M.skin, { y: HEAD.y - 0.022, z: fz + 0.01, sx: 0.014, sy: 0.018, sz: 0.014 }); // nose
  head.add(smile(0.03, 0.0045), M.lips, { y: HEAD.y - 0.035, z: fz - 0.004, sz: 1 });

  const root = new THREE.Group();
  root.name = 'Student';
  const bodyGroup = body.build('StudentBody');
  const headGroup = head.build('StudentHead');
  root.add(bodyGroup, headGroup);
  return { root, body: bodyGroup, head: headGroup, glowMats: [M.skin, M.shirt, M.trousers, M.collar] };
}

function createSuit(clip) {
  const c = [clip];
  const M = {
    suit: mat('#f3f4f6', { name: 'Suit', roughness: 0.92, clippingPlanes: c }),
    ring: mat('#9aa3ad', { name: 'Ring', roughness: 0.5, metalness: 0.3, clippingPlanes: c }),
    boot: mat('#d5d9de', { name: 'Boot', roughness: 0.7, clippingPlanes: c }),
    sole: mat('#3a3f47', { name: 'BootSole', roughness: 0.9, clippingPlanes: c }),
    box: mat('#c3c9d0', { name: 'ChestBox', roughness: 0.6, clippingPlanes: c }),
    knob: mat('#e8590c', { name: 'Knob', roughness: 0.5, clippingPlanes: c }),
    flagG: mat('#006a4e', { name: 'FlagGreen', roughness: 0.8, clippingPlanes: c }),
    flagR: mat('#f42a41', { name: 'FlagRed', roughness: 0.8, clippingPlanes: c }),
  };
  const suit = builder();
  const sph = new THREE.SphereGeometry(1, 24, 16);
  // legs, knee rings, boots
  for (const s of [-1, 1]) {
    suit.add(pill(0.088, S_LEG_R, 0.84), M.suit, { x: s * 0.098, y: 0.09, rz: s * 0.02 });
    suit.add(new THREE.TorusGeometry(0.094, 0.012, 6, 24).rotateX(Math.PI / 2), M.ring, { x: s * 0.1, y: 0.47, sz: 1 });
    suit.add(new THREE.CylinderGeometry(0.096, 0.092, 0.14, 20), M.boot, { x: s * 0.104, y: 0.1 });
    suit.add(sph, M.boot, { x: s * 0.104, y: 0.06, z: 0.045, sx: 0.085, sy: 0.06, sz: 0.15 });
    suit.add(new THREE.BoxGeometry(1, 1, 1), M.sole, { x: s * 0.104, y: 0.014, z: 0.045, sx: 0.17, sy: 0.028, sz: 0.3 });
  }
  // the body of the suit, a waist ring, the collar ring
  suit.add(
    lathe([
      [0.8, 0.0],
      [0.8, 0.19],
      [0.92, 0.205],
      [1.05, 0.21],
      [1.2, 0.225],
      [1.28, 0.22],
      [1.33, 0.18],
      [SUIT_TOP, 0.1],
      [SUIT_TOP + 0.005, 0.0],
    ]),
    M.suit,
    { sz: 0.74 },
  );
  suit.add(new THREE.TorusGeometry(0.205, 0.014, 6, 32).rotateX(Math.PI / 2), M.ring, { y: 0.93, sz: 0.74 });
  suit.add(new THREE.CylinderGeometry(0.15, 0.17, 0.05, 32), M.ring, { y: SUIT_TOP - 0.01, sz: 0.86 });
  // the chest box with two knobs, the backpack
  suit.add(new THREE.BoxGeometry(1, 1, 1), M.box, { y: 1.1, z: 0.16, sx: 0.17, sy: 0.1, sz: 0.05 });
  for (const s of [-1, 1]) suit.add(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 12), M.knob, { x: s * 0.045, y: 1.1, z: 0.19, rx: Math.PI / 2 });
  suit.add(new THREE.BoxGeometry(1, 1, 1), M.suit, { y: 1.13, z: -0.2, sx: 0.4, sy: 0.5, sz: 0.16 });
  suit.add(new THREE.BoxGeometry(1, 1, 1), M.box, { y: 1.13, z: -0.285, sx: 0.32, sy: 0.4, sz: 0.02 });
  // arms, elbow rings, gloves, the flag on the left arm
  for (const s of [-1, 1]) {
    const sh = armAt(s, 0);
    suit.add(sph, M.suit, { x: sh.x + s * 0.02, y: sh.y - 0.02, sx: 0.1, sy: 0.095, sz: 0.1 });
    const w = armAt(s, 0.97);
    suit.add(pill(S_ARM_R * 0.9, S_ARM_R, ARM_LEN * 0.95), M.suit, { x: w.x + s * 0.02, y: w.y, rz: s * ARM_TILT });
    const el = armAt(s, 0.5);
    suit.add(new THREE.TorusGeometry(S_ARM_R, 0.011, 6, 24).rotateX(Math.PI / 2), M.ring, { x: el.x + s * 0.02, y: el.y, rz: s * ARM_TILT });
    const cuff = armAt(s, 0.98);
    suit.add(new THREE.CylinderGeometry(0.064, 0.064, 0.04, 20), M.ring, { x: cuff.x + s * 0.02, y: cuff.y, rz: s * ARM_TILT });
    const h = armAt(s, 1.1);
    suit.add(sph, M.suit, { x: h.x + s * 0.02, y: h.y, sx: 0.058, sy: 0.075, sz: 0.05, rz: s * ARM_TILT });
    suit.add(sph, M.suit, { x: h.x + s * 0.005, y: h.y + 0.02, z: 0.04, sx: 0.022, sy: 0.035, sz: 0.022, rz: -s * 0.4 });
  }
  const fl = armAt(1, 0.25);
  suit.add(new THREE.BoxGeometry(1, 1, 1), M.flagG, { x: fl.x + 0.02, y: fl.y, z: 0.07, rz: ARM_TILT, rx: -0.2, sx: 0.07, sy: 0.045, sz: 0.006 });
  suit.add(new THREE.CylinderGeometry(0.013, 0.013, 0.008, 16), M.flagR, { x: fl.x + 0.016, y: fl.y, z: 0.075, rx: Math.PI / 2 - 0.2 });
  const body = suit.build('SuitBody');

  // the helmet: clear glass (the face shows), a gold sun visor pushed up on top
  const helmet = new THREE.Group();
  helmet.name = 'Helmet';
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(HELMET_R, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.8),
    new THREE.MeshStandardMaterial({
      name: 'Glass',
      color: '#dbeeff',
      roughness: 0.04,
      metalness: 0.1,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      envMapIntensity: 2.2,
    }),
  );
  glass.position.y = HEAD.y;
  glass.renderOrder = 5;
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(HELMET_R + 0.006, 32, 10, Math.PI * 0.05, Math.PI * 0.9, 0, Math.PI * 0.27),
    new THREE.MeshStandardMaterial({ name: 'Visor', color: '#e0a526', roughness: 0.25, metalness: 0.85 }),
  );
  visor.position.y = HEAD.y;
  visor.castShadow = true;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(HELMET_R * 0.8, 0.018, 8, 32).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'HelmetRing', color: '#9aa3ad', roughness: 0.45, metalness: 0.4 }),
  );
  rim.position.y = HEAD.y - HELMET_R * 0.6;
  helmet.add(glass, visor, rim);

  const root = new THREE.Group();
  root.name = 'SpaceSuit';
  root.add(body, helmet);
  return { root, body, helmet, mats: Object.values(M) };
}

/** A spot where a pressure arrow touches: a point on the outline (front plane, z = 0) and the way out there. */
const spot = (x, y, nx, ny) => ({ p: new THREE.Vector3(x, y, 0), n: new THREE.Vector3(nx, ny, 0).normalize() });

function spotsFor({ headR, headY, top, arm, armR, thigh, shin }) {
  const d = Math.SQRT1_2;
  return [
    spot(0, top, 0, 1),
    spot(-headR.x * d, headY + headR.y * d, -0.78, 0.62),
    spot(headR.x * d, headY + headR.y * d, 0.78, 0.62),
    spot(-(arm.x + armR), arm.y, -1, 0.12),
    spot(arm.x + armR, arm.y, 1, 0.12),
    spot(-thigh.x, thigh.y, -1, 0),
    spot(thigh.x, thigh.y, 1, 0),
    spot(-shin.x, shin.y, -1, 0),
    spot(shin.x, shin.y, 1, 0),
  ];
}

export function createPeople() {
  const student = createStudent();
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const suit = createSuit(clip);
  const root = new THREE.Group();
  root.name = 'Person';
  root.add(student.root, suit.root);
  const ARM_Y = 1.1;
  const armX = (y, dx = 0) => SHOULDER.x + dx + Math.tan(ARM_TILT) * (SHOULDER.y - y);
  const spots = {
    body: spotsFor({
      headR: { x: HEAD.rx + 0.012, y: HEAD.ry + 0.012 },
      headY: HEAD.y,
      top: HEAD.y + HEAD.ry + 0.02,
      arm: { x: armX(ARM_Y), y: ARM_Y },
      armR: 0.045,
      thigh: { x: HIP.x + 0.07, y: 0.56 },
      shin: { x: HIP.x + 0.06, y: 0.24 },
    }),
    suit: spotsFor({
      headR: { x: HELMET_R, y: HELMET_R },
      headY: HEAD.y,
      top: HEAD.y + HELMET_R + 0.006,
      arm: { x: armX(ARM_Y, 0.02), y: ARM_Y },
      armR: S_ARM_R,
      thigh: { x: 0.098 + S_LEG_R - 0.004, y: 0.56 },
      shin: { x: 0.098 + 0.092, y: 0.24 },
    }),
  };
  return { root, student, suit, clip, spots, height: HEAD.y + HELMET_R, headY: HEAD.y };
}
