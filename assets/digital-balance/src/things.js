// The things to weigh, in millimetres, each sitting with its bottom at y = 0 of its group:
// an egg, a mango, a coin, a brass 100 g weight (বাটখারা) and a steel bowl that others can go into.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';

/** A solid of revolution from (radius, height) points, bottom to top. */
const lathe = (points, segments = 48) =>
  new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );

function egg() {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI; // bottom (0) to top (π)
    const y = (1 - Math.cos(a)) * 27.5;
    const r = Math.sin(a) * 21 * (1 - 0.13 * (y / 55)); // narrower towards the top
    pts.push([Math.max(0.01, r), y]);
  }
  const mesh = new THREE.Mesh(lathe(pts), new THREE.MeshPhysicalMaterial({ name: 'Egg', color: 0xf1e2c6, roughness: 0.62, sheen: 0.4 }));
  mesh.name = 'Egg';
  return { object: mesh, radius: 22, height: 55 };
}

function mango() {
  const g = new THREE.SphereGeometry(1, 48, 32);
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // a mango lying on its side: long along x, a little fuller at one end, with a beak
    const bulge = 1 + 0.12 * x - 0.08 * x * x;
    pos.setXYZ(i, x * 58, y * 38 * bulge, z * 42 * bulge);
    const k = THREE.MathUtils.clamp((x + 1) / 2 + y * 0.25, 0, 1);
    c.setRGB(0.42 + 0.53 * k, 0.62 - 0.12 * k, 0.12 + 0.02 * k); // green to golden orange
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const group = new THREE.Group();
  group.name = 'Mango';
  const body = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ name: 'Mango', vertexColors: true, roughness: 0.45, clearcoat: 0.25 }));
  body.position.y = 38;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 2.2, 8, 10),
    new THREE.MeshStandardMaterial({ name: 'Stem', color: 0x5b4126, roughness: 0.8 }),
  );
  stem.position.set(-52, 44, 0);
  stem.rotation.z = 1.1;
  group.add(body, stem);
  return { object: group, radius: 50, height: 76 };
}

function coin(M, t) {
  const group = new THREE.Group();
  group.name = 'Coin';
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 2, 48), M.chrome);
  disc.position.y = 1;
  const mark = textMesh(t.num('5'), 9, { color: '#7d8590', weight: 700 });
  mark.rotation.x = -Math.PI / 2;
  mark.position.y = 2.05;
  group.add(disc, mark);
  return { object: group, radius: 14, height: 2 };
}

function brassWeight(M, t) {
  const mesh = new THREE.Mesh(
    lathe([
      [0.01, 0],
      [15, 0],
      [15.5, 1],
      [15.5, 30],
      [14, 32],
      [6, 33],
      [5, 37],
      [8, 40],
      [8.5, 43],
      [6, 46],
      [0.01, 46.5],
    ]),
    M.brass,
  );
  mesh.name = 'BrassWeight';
  const group = new THREE.Group();
  group.name = 'Weight100g';
  const mark = textMesh(t('weight_mark'), 5.2, { color: '#5a3d08', weight: 700 });
  mark.position.set(0, 16, 15.6);
  group.add(mesh, mark);
  return { object: group, radius: 17, height: 46 };
}

function bowl(M) {
  const outer = [
    [0.01, 0],
    [22, 0],
    [24, 1.5],
    [36, 10],
    [48, 26],
    [55, 42],
    [56, 45],
  ];
  const inner = [
    [54, 45],
    [53, 42],
    [46, 27],
    [34, 12],
    [22, 4],
    [0.01, 4],
  ];
  const mesh = new THREE.Mesh(lathe([...outer, ...inner], 64), M.satin);
  mesh.name = 'Bowl';
  return { object: mesh, radius: 56, height: 45, inner: 4 };
}

/** createThing(kind, materials, t) → { kind, group, radius, height, inner? } with the bottom at y = 0. */
export function createThing(kind, M, t) {
  const made = { egg, mango, coin: () => coin(M, t), weight: () => brassWeight(M, t), bowl: () => bowl(M) }[kind]();
  const group = new THREE.Group();
  group.name = `Thing:${kind}`;
  group.add(made.object);
  group.userData.kind = kind;
  return { kind, group, radius: made.radius, height: made.height, inner: made.inner ?? null };
}
