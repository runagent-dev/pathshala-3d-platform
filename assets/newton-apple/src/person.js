// The reader under the tree, in metres: a young man of the 1660s, as Isaac Newton would have dressed at Woolsthorpe, of
// real proportions (about 1.7 m tall), sitting on the grass with his back to the trunk, one knee up, an open book in his
// hands, looking down at it. Long dark hair of his own, a plain long-skirted coat, cravat, knee breeches, stockings and
// buckled shoes: a portrait of the time in simple shapes, not a caricature. He faces +x; y = 0 is the ground. Merged
// shapes, one mesh per material; he never moves, so he costs one or two draw calls per material and no per-frame work.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const mat = (name, color, o = {}) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.82, metalness: 0, ...o });

const UP = new THREE.Vector3(0, 1, 0);
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);

const casters = new Set(['Coat', 'Breeches', 'Stockings', 'Shoes', 'Hair']);

function shapes() {
  /** @type {Map<THREE.Material, THREE.BufferGeometry[]>} */
  const byMat = new Map();
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const sc = new THREE.Vector3();
  const at = new THREE.Vector3();
  const add = (geo, material, { p = v(0, 0, 0), s = v(1, 1, 1), quat = null, rot = null } = {}) => {
    const g = geo.clone();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal'].includes(name)) g.deleteAttribute(name);
    g.applyMatrix4(m4.compose(at.copy(p), quat ?? (rot ? q.setFromEuler(e.set(rot[0], rot[1], rot[2])) : q.identity()), sc.copy(s)));
    if (!byMat.has(material)) byMat.set(material, []);
    byMat.get(material).push(g);
  };
  const build = (name) => {
    const group = new THREE.Group();
    group.name = name;
    for (const [material, list] of byMat) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), material);
      for (const g of list) g.dispose();
      mesh.name = `${name}-${material.name}`;
      mesh.castShadow = casters.has(material.name); // the small parts add nothing to the shadow on the grass
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  };
  return { add, build };
}

/** A rounded limb of length 1 along +y: r0 at the foot, r1 at the head (lengths are in the profile, so it is not scaled). */
function pill(r0, r1, len, seg = 14) {
  const pts = [];
  for (let i = 0; i <= 4; i++) {
    const a = -Math.PI / 2 + (i / 4) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r0), r0 * (1 + Math.sin(a)) - r0));
  }
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r1), len + Math.sin(a) * r1));
  }
  return new THREE.LatheGeometry(pts, seg);
}

export function createPerson() {
  const M = {
    skin: mat('Skin', '#d9a988', { roughness: 0.6 }),
    coat: mat('Coat', '#4d2f38', { roughness: 0.9 }),
    lining: mat('CoatEdge', '#3a2029', { roughness: 0.9 }),
    linen: mat('Linen', '#efe9dc', { roughness: 0.75 }),
    breeches: mat('Breeches', '#6b5b45', { roughness: 0.85 }),
    stocking: mat('Stockings', '#e4dcc8', { roughness: 0.8 }),
    shoe: mat('Shoes', '#1d1917', { roughness: 0.4 }),
    brass: mat('Brass', '#c49a45', { roughness: 0.35, metalness: 0.8 }),
    hair: mat('Hair', '#33241b', { roughness: 0.62 }),
    eye: mat('Eyes', '#231a16', { roughness: 0.4 }),
    lips: mat('Lips', '#a8665c', { roughness: 0.6 }),
    cover: mat('BookCover', '#5c3320', { roughness: 0.6 }),
    pages: mat('Pages', '#f2ead8', { roughness: 0.9 }),
  };
  const sph = new THREE.SphereGeometry(1, 20, 14);
  const sphS = new THREE.SphereGeometry(1, 12, 8);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const b = shapes();
  const q = new THREE.Quaternion();
  const d = new THREE.Vector3();
  /** A limb from a to b, its radius going r0 → r1. */
  const limb = (a, c, r0, r1, material, seg = 14) => {
    d.subVectors(c, a);
    const len = d.length();
    q.setFromUnitVectors(UP, d.clone().normalize());
    b.add(pill(r0, r1, len, seg), material, { p: a, quat: q.clone() });
  };

  // the torso, leaning back on the trunk: wider than deep; the coat's skirt spread on the grass
  const hip = v(0, 0.17);
  const neck = v(-0.17, 0.66);
  d.subVectors(neck, hip).normalize();
  const lean = new THREE.Quaternion().setFromUnitVectors(UP, d);
  const torso = new THREE.LatheGeometry(
    [
      [0.0001, -0.03],
      [0.15, 0.0],
      [0.17, 0.12],
      [0.185, 0.3],
      [0.19, 0.4],
      [0.165, 0.47],
      [0.08, 0.52],
      [0.0001, 0.53],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    20,
  );
  b.add(torso, M.coat, { p: hip, quat: lean, s: v(0.82, 1, 1.02) });
  const skirt = new THREE.LatheGeometry(
    [
      [0.17, 0.26],
      [0.22, 0.18],
      [0.3, 0.08],
      [0.36, 0.012],
      [0.0001, 0.012],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    22,
  );
  b.add(skirt, M.coat, { p: v(-0.06, 0, 0), s: v(1.15, 1, 1.05) });
  // the coat's front: an edge and a line of brass buttons down the chest
  const front = (k) => new THREE.Vector3().lerpVectors(hip, neck, k).add(v(0.135, 0, 0).applyQuaternion(lean));
  for (let i = 0; i < 6; i++) b.add(sphS, M.brass, { p: front(0.24 + i * 0.125), s: v(0.009, 0.009, 0.009) });
  limb(front(0.2), front(0.86), 0.012, 0.012, M.lining, 6);
  // the cravat at the throat and its fall
  b.add(sph, M.linen, { p: v(-0.095, 0.655, 0), s: v(0.06, 0.042, 0.058) });
  limb(v(-0.075, 0.645, 0), v(-0.03, 0.52, 0), 0.03, 0.022, M.linen, 8);

  // the legs: the near knee up (it holds the book), the far leg out along the grass
  const shoe = (ankle, turn) => {
    b.add(sph, M.shoe, { p: ankle.clone().add(v(0.06, -0.035, 0)), s: v(0.125, 0.046, 0.052), rot: [0, 0, turn] });
    b.add(box, M.brass, { p: ankle.clone().add(v(0.075, 0.01, 0)), s: v(0.022, 0.006, 0.04), rot: [0, 0, turn - 0.5] });
    b.add(box, M.shoe, { p: ankle.clone().add(v(-0.03, -0.07, 0)), s: v(0.06, 0.03, 0.06) });
  };
  for (const [hipL, knee, ankle, turn] of [
    [v(0.03, 0.14, 0.1), v(0.4, 0.41, 0.13), v(0.54, 0.105, 0.13), 0.05],
    [v(0.03, 0.13, -0.1), v(0.43, 0.15, -0.13), v(0.85, 0.105, -0.16), 0.5],
  ]) {
    limb(hipL, knee, 0.088, 0.066, M.breeches);
    const garter = new THREE.Vector3().lerpVectors(knee, ankle, 0.08);
    limb(knee, garter, 0.066, 0.058, M.breeches);
    limb(garter, ankle, 0.056, 0.038, M.stocking);
    b.add(sphS, M.stocking, { p: ankle, s: v(0.04, 0.04, 0.04) });
    shoe(ankle, turn);
  }

  // the arms, the elbows at his sides, the hands holding the book
  for (const [shoulder, elbow, wrist] of [
    [v(-0.14, 0.59, 0.195), v(-0.005, 0.385, 0.255), v(0.21, 0.47, 0.17)],
    [v(-0.14, 0.59, -0.195), v(0.005, 0.385, -0.25), v(0.235, 0.455, -0.14)],
  ]) {
    b.add(sph, M.coat, { p: shoulder, s: v(0.062, 0.06, 0.062) });
    limb(shoulder, elbow, 0.058, 0.05, M.coat);
    limb(elbow, wrist, 0.05, 0.04, M.coat);
    d.subVectors(wrist, elbow).normalize();
    const cuffEnd = wrist.clone().addScaledVector(d, 0.03);
    limb(wrist.clone().addScaledVector(d, -0.05), cuffEnd, 0.05, 0.05, M.lining, 12); // the turned-back cuff
    const hand = cuffEnd.clone().addScaledVector(d, 0.06);
    limb(cuffEnd, hand, 0.03, 0.03, M.linen, 8);
    b.add(sph, M.skin, {
      p: hand.clone().addScaledVector(d, 0.03),
      s: v(0.052, 0.022, 0.036),
      quat: new THREE.Quaternion().setFromUnitVectors(v(1, 0, 0), d),
    });
  }

  // the open book, resting against the raised knee and tilted toward his face
  const bookQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.62));
  const book = v(0.34, 0.5, 0);
  const inBook = (x, y, z) => v(x, y, z).applyQuaternion(bookQ).add(book);
  for (const side of [-1, 1]) {
    const open = new THREE.Quaternion().setFromEuler(new THREE.Euler(side * 0.16, 0, 0));
    const turn = bookQ.clone().multiply(open);
    b.add(box, M.cover, { p: inBook(0, -0.006, side * 0.085), s: v(0.21, 0.008, 0.17), quat: turn });
    b.add(box, M.pages, { p: inBook(0, 0.008, side * 0.082), s: v(0.195, 0.022, 0.158), quat: turn });
  }

  // the neck and the head, bowed over the book
  limb(v(-0.125, 0.63, 0), v(-0.085, 0.72, 0), 0.05, 0.048, M.skin, 12);
  const headAt = v(-0.05, 0.815, 0);
  const bow = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.36));
  const inHead = (x, y, z) => v(x, y, z).applyQuaternion(bow).add(headAt);
  b.add(sph, M.skin, { p: headAt, s: v(0.098, 0.118, 0.086), quat: bow });
  b.add(sph, M.skin, { p: inHead(0.038, -0.078, 0), s: v(0.062, 0.05, 0.066), quat: bow }); // jaw and chin
  b.add(sph, M.skin, { p: inHead(0.097, -0.012, 0), s: v(0.03, 0.02, 0.015), quat: bow }); // nose
  b.add(sph, M.skin, { p: inHead(0.084, 0.02, 0), s: v(0.018, 0.01, 0.052), quat: bow }); // brow
  for (const s of [-1, 1]) {
    b.add(sphS, M.eye, { p: inHead(0.09, 0.007, s * 0.034), s: v(0.005, 0.0045, 0.0125), quat: bow });
    b.add(box, M.hair, { p: inHead(0.09, 0.03, s * 0.034), s: v(0.008, 0.0055, 0.03), quat: bow });
  }
  b.add(sphS, M.lips, { p: inHead(0.094, -0.058, 0), s: v(0.007, 0.0055, 0.021), quat: bow });

  // long hair: parted at the top, down both sides of the face to the shoulders, in soft waves
  b.add(sph, M.hair, { p: inHead(-0.022, 0.03, 0), s: v(0.104, 0.112, 0.097), quat: bow });
  const locks = [
    [-0.01, -0.03, 0.092, 0.046],
    [-0.02, -0.095, 0.1, 0.05],
    [-0.045, -0.16, 0.112, 0.052],
    [-0.08, -0.215, 0.13, 0.05],
    [-0.09, -0.025, 0.068, 0.052],
    [-0.11, -0.09, 0.075, 0.056],
    [-0.13, -0.155, 0.08, 0.058],
    [-0.15, -0.215, 0.09, 0.055],
    [-0.105, -0.03, 0.0, 0.06],
    [-0.125, -0.1, 0.0, 0.062],
    [-0.15, -0.17, 0.0, 0.064],
    [-0.165, -0.235, 0.02, 0.058],
  ];
  for (const [x, y, z, r] of locks)
    for (const s of z ? [-1, 1] : [1]) b.add(sphS, M.hair, { p: inHead(x, y, s * z), s: v(r, r * 1.2, r * 0.92), quat: bow });

  const root = b.build('Reader');
  return { root };
}
