// The left fist of চিত্র ৮.১৫, seen from its palm side as the book draws it. Measured in the hand's own frame: +x from the wrist
// to the knuckles, +y out of the palm toward the viewer, the thumb along −z. That is a left hand: x × (thumb) points out of
// the palm. The four fingers curl over the palm in the book's stripes. One geometry with its colours in the vertices: the fist
// and each of its images are one draw.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const SKIN = '#b98560';
const CREASE = '#94633f';
const CUFF = '#3f78ad';
const up = new THREE.Vector3(0, 1, 0);

function paint(g, colour, shade) {
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const base = new THREE.Color(colour);
  const dark = new THREE.Color(CREASE);
  for (let i = 0; i < pos.count; i++) {
    c.copy(base);
    if (shade) c.lerp(dark, shade(pos.getX(i), pos.getY(i), pos.getZ(i)));
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(n)) g.deleteAttribute(n);
  return g;
}
/** A capsule from a to b, its radius r0 at a and r1 at b. */
function capsule(a, b, r0, r1, seg = 10) {
  const pa = new THREE.Vector3(...a);
  const pb = new THREE.Vector3(...b);
  const len = pa.distanceTo(pb);
  const pts = [];
  const n = 3;
  for (let i = 0; i <= n; i++) {
    const t = -Math.PI / 2 + (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(t) * r0), Math.sin(t) * r0));
  }
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(t) * r1), len + Math.sin(t) * r1));
  }
  const g = new THREE.LatheGeometry(pts, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, pb.clone().sub(pa).normalize()));
  g.translate(pa.x, pa.y, pa.z);
  return g;
}
function blob(x, y, z, rx, ry, rz) {
  const g = new THREE.SphereGeometry(1, 16, 12);
  g.scale(rx, ry, rz);
  g.translate(x, y, z);
  return g;
}

/** The fist, its height from the wrist to the knuckles about 1 unit; `scale` makes it world size. */
export function fistGeometry(scale = 0.5) {
  const parts = [];
  const skin = (g, shade) => parts.push(paint(g, SKIN, shade));
  // the back of the hand and the heel of the palm
  skin(blob(0.02, -0.04, 0.02, 0.46, 0.25, 0.42));
  skin(blob(-0.2, 0.1, -0.22, 0.26, 0.17, 0.21)); // the mound under the thumb
  // the fingers, index nearest the thumb: over the knuckle, round, and back over the palm
  const FINGERS = [
    { z: -0.27, k: 1 },
    { z: -0.09, k: 1.04 },
    { z: 0.09, k: 1 },
    { z: 0.26, k: 0.88 },
  ];
  for (const f of FINGERS) {
    const r = 0.095 * (0.8 + 0.2 * f.k);
    const kn = [0.34, -0.03, f.z];
    const pip = [0.34 + 0.28 * f.k, 0.04, f.z];
    const dip = [0.34 + 0.24 * f.k, 0.3, f.z * 0.98];
    const tip = [0.34 - 0.08 * f.k, 0.33, f.z * 0.95];
    const crease = (_x, _y, z) => Math.min(1, Math.abs(z - f.z) / r) ** 5 * 0.75;
    skin(capsule(kn, pip, r * 1.08, r), crease);
    skin(capsule(pip, dip, r, r * 0.94), crease);
    skin(capsule(dip, tip, r * 0.94, r * 0.84), crease);
  }
  // the thumb, up from the side of the hand
  skin(capsule([-0.16, 0.09, -0.3], [-0.03, 0.14, -0.62], 0.15, 0.125, 12));
  skin(capsule([-0.03, 0.14, -0.62], [-0.05, 0.13, -0.95], 0.125, 0.1, 12));
  parts.push(paint(blob(-0.05, 0.215, -0.93, 0.07, 0.02, 0.085), '#e9c3ad')); // the nail
  // the wrist, and a blue cuff, where the arm comes in
  skin(capsule([-0.32, -0.02, 0.03], [-0.88, -0.02, 0.05], 0.29, 0.26, 16));
  const cuff = new THREE.CylinderGeometry(0.33, 0.34, 0.42, 20).rotateZ(Math.PI / 2).translate(-1.05, -0.02, 0.05);
  parts.push(paint(cuff, CUFF));
  const hem = new THREE.TorusGeometry(0.325, 0.022, 6, 20).rotateY(Math.PI / 2).translate(-0.84, -0.02, 0.05);
  parts.push(paint(hem, '#346896'));
  const g = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  g.scale(scale, scale, scale);
  g.computeBoundingSphere();
  return g;
}
