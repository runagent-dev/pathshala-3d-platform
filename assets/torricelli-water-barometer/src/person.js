// The person beside the water tube, for the scale (from assets/air-pressure's student), in metres, standing on y = 0
// and facing +z: a friendly student (a green short-sleeved shirt, grey trousers, white shoes, a smiling face, black
// hair) about 1.6 m tall. Built from a few lathe, sphere and box shapes merged into one mesh per material (about ten
// draw calls).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// the student's proportions (a class-9 student, a little stylised: the head is a bit big, which reads as friendly)
const HEAD = { y: 1.5, rx: 0.098, ry: 0.122, rz: 0.108 };
const SHOULDER = { x: 0.185, y: 1.31 };
const ARM_TILT = 0.16; // rad: the arms hang a little out from the sides
const ARM_LEN = 0.56; // shoulder to wrist
const HIP = { x: 0.085, y: 0.86 };

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

/** The person: `root` (standing on y = 0, facing +z) and its height (m). */
export function createPerson() {
  const student = createStudent();
  student.root.name = 'Person';
  return { root: student.root, height: HEAD.y + HEAD.ry };
}
