// The listener, in metres, standing on y = 0 and facing +z (the app turns it to face the cliff): a class-9 student in
// school uniform (light blue shirt, navy trousers, black shoes) of real proportions, about 1.62 m tall, with a calm
// face (no cartoon smile). The forearms hang from the elbows so the hands can swing together in front of the chest:
// setClap(k) with k = 0 hands apart, 1 hands together (the clap). Merged shapes, one mesh per material and part.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const mat = (name, color, o = {}) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.8, metalness: 0, ...o });

const HEAD = { y: 1.5, rx: 0.084, ry: 0.11, rz: 0.098 };
const SHOULDER = { x: 0.175, y: 1.34 };
const UPPER = 0.29; // shoulder to elbow
const FORE = 0.25; // elbow to wrist
const HIP = { x: 0.088, y: 0.86 };
/** Where the hands meet (m above the ground), for the sound's start. */
export const HANDS_Y = 1.2;
export const HANDS_Z = 0.38;
export const HEIGHT = HEAD.y + HEAD.ry;

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
const lathe = (profile, seg = 28) =>
  new THREE.LatheGeometry(
    profile.map(([y, r]) => new THREE.Vector2(Math.max(1e-4, r), y)),
    seg,
  );

function builder() {
  /** @type {Map<THREE.Material, THREE.BufferGeometry[]>} */
  const byMat = new Map();
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const sc = new THREE.Vector3();
  const at = new THREE.Vector3();
  function add(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal'].includes(name)) g.deleteAttribute(name);
    g.applyMatrix4(m4.compose(at.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), sc.set(sx, sy, sz)));
    g = g.toNonIndexed();
    if (!byMat.has(material)) byMat.set(material, []);
    byMat.get(material).push(g);
  }
  function build(name) {
    const group = new THREE.Group();
    group.name = name;
    for (const [material, list] of byMat) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), material);
      for (const g of list) g.dispose();
      mesh.name = `${name}-${material.name}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    byMat.clear();
    return group;
  }
  return { add, build };
}

export function createListener() {
  const M = {
    skin: mat('Skin', '#9c6644', { roughness: 0.6 }),
    shirt: mat('Shirt', '#cfe0f2', { roughness: 0.85 }),
    trousers: mat('Trousers', '#27324a', { roughness: 0.85 }),
    belt: mat('Belt', '#1e1a17', { roughness: 0.5 }),
    shoe: mat('Shoe', '#15171b', { roughness: 0.35 }),
    hair: mat('Hair', '#14100d', { roughness: 0.6 }),
    dark: mat('Eye', '#1b1512', { roughness: 0.3 }),
    lips: mat('Lips', '#6e3d2e', { roughness: 0.6 }),
  };
  const sph = new THREE.SphereGeometry(1, 24, 16);
  const sphS = new THREE.SphereGeometry(1, 12, 8);
  const box = new THREE.BoxGeometry(1, 1, 1);

  const body = builder();
  // legs, shoes
  for (const s of [-1, 1]) {
    body.add(pill(0.05, 0.078, HIP.y - 0.06), M.trousers, { x: s * HIP.x, y: 0.06, rz: s * 0.015 });
    body.add(sph, M.shoe, { x: s * (HIP.x + 0.01), y: 0.048, z: 0.045, sx: 0.052, sy: 0.045, sz: 0.13 });
    body.add(box, M.shoe, { x: s * (HIP.x + 0.01), y: 0.012, z: 0.045, sx: 0.1, sy: 0.024, sz: 0.26 });
  }
  // hips, belt, the shirt tucked in, the collar
  body.add(
    lathe([
      [0.8, 0],
      [0.8, 0.13],
      [0.88, 0.152],
      [0.98, 0.148],
      [1.0, 0],
    ]),
    M.trousers,
    { sz: 0.62 },
  );
  body.add(new THREE.TorusGeometry(0.149, 0.013, 6, 30).rotateX(Math.PI / 2), M.belt, { y: 0.975, sz: 0.62 });
  body.add(
    lathe([
      [0.97, 0],
      [0.97, 0.145],
      [1.06, 0.15],
      [1.18, 0.164],
      [1.28, 0.172],
      [1.34, 0.158],
      [1.38, 0.1],
      [1.4, 0.05],
      [1.41, 0],
    ]),
    M.shirt,
    { sz: 0.62 },
  );
  body.add(new THREE.TorusGeometry(0.056, 0.016, 6, 20).rotateX(Math.PI / 2), M.shirt, { y: 1.405, z: 0.004, sz: 0.85 });
  body.add(box, M.shirt, { y: 1.18, z: 0.106, sx: 0.012, sy: 0.4, sz: 0.006 }); // the placket
  body.add(new THREE.CylinderGeometry(0.043, 0.047, 0.1, 16), M.skin, { y: 1.42 });
  // the head: skull, jaw, ears, hair, eyes, brows, nose, mouth (calm)
  body.add(sph, M.skin, { y: HEAD.y, sx: HEAD.rx, sy: HEAD.ry, sz: HEAD.rz });
  body.add(sph, M.skin, { y: HEAD.y - 0.05, z: 0.012, sx: 0.07, sy: 0.07, sz: 0.08 });
  for (const s of [-1, 1]) body.add(sph, M.skin, { x: s * 0.084, y: HEAD.y - 0.005, sx: 0.014, sy: 0.028, sz: 0.02 });
  body.add(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair, {
    y: HEAD.y + 0.01,
    z: -0.01,
    rx: -0.3,
    sx: HEAD.rx + 0.008,
    sy: HEAD.ry + 0.008,
    sz: HEAD.rz + 0.01,
  });
  const fz = HEAD.rz * 0.9;
  for (const s of [-1, 1]) {
    body.add(sphS, M.dark, { x: s * 0.031, y: HEAD.y + 0.008, z: fz, sx: 0.009, sy: 0.007, sz: 0.006 });
    body.add(box, M.hair, { x: s * 0.032, y: HEAD.y + 0.033, z: fz + 0.002, rz: -s * 0.08, sx: 0.03, sy: 0.006, sz: 0.008 });
  }
  body.add(sphS, M.skin, { y: HEAD.y - 0.025, z: fz + 0.012, sx: 0.012, sy: 0.022, sz: 0.016 });
  body.add(box, M.lips, { y: HEAD.y - 0.06, z: fz - 0.002, sx: 0.03, sy: 0.006, sz: 0.006 });

  const root = new THREE.Group();
  root.name = 'Listener';
  root.add(body.build('ListenerBody'));

  // the arms: shoulder → upper arm (down and a little forward) → elbow → forearm and hand, swung by setClap
  const elbows = [];
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(s * SHOULDER.x, SHOULDER.y, 0);
    shoulder.rotation.set(0.32, 0, s * 0.06); // the upper arm a little forward
    const upper = builder();
    upper.add(sph, M.shirt, { y: -0.01, sx: 0.06, sy: 0.06, sz: 0.06 });
    upper.add(pill(0.044, 0.056, UPPER), M.shirt, { y: -UPPER, sx: 1, sz: 1 });
    shoulder.add(upper.build(`UpperArm${s}`));
    const elbow = new THREE.Group();
    elbow.position.set(0, -UPPER + 0.02, 0);
    elbow.rotation.order = 'YXZ';
    const fore = builder();
    fore.add(pill(0.031, 0.04, FORE), M.skin, { y: -FORE });
    // the hand: a flat palm (thin across x: palms face each other) and a thumb
    fore.add(sph, M.skin, { y: -FORE - 0.075, sx: 0.022, sy: 0.075, sz: 0.045 });
    fore.add(sphS, M.skin, { y: -FORE - 0.035, z: 0.04, sx: 0.013, sy: 0.03, sz: 0.013, rx: 0.5 });
    elbow.add(fore.build(`Forearm${s}`));
    shoulder.add(elbow);
    root.add(shoulder);
    elbows.push({ elbow, s });
  }
  const APART = 0.12;
  const TOGETHER = 0.56;
  function setClap(k) {
    const yaw = APART + (TOGETHER - APART) * k;
    for (const { elbow, s } of elbows) elbow.rotation.set(-(Math.PI / 2 + 0.55), -s * yaw, 0);
  }
  setClap(0);
  return { root, setClap, height: HEIGHT };
}
