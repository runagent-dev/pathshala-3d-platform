// The landscape: a grassy hill with a dirt road over it (the road follows heightAt from energy.js exactly), trees,
// low hills far away and a few clouds. Metres; +x along the road, the camera looks from +z.
import * as THREE from 'three';
import { HILL, heightAt } from './energy.js';

const ROAD_HALF = 0.75; // m: half the road's width
const X0 = -60;
const X1 = 175;

/** A small deterministic value noise (no Math.random: the same landscape every time). */
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const fx = x - xi;
  const fz = z - zi;
  const u = fx * fx * (3 - 2 * fx);
  const w = fz * fz * (3 - 2 * fz);
  const a = hash(xi, zi);
  const b = hash(xi + 1, zi);
  const c = hash(xi, zi + 1);
  const d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}
const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** How much of the hill's height there is at a distance z from the road (full near the road, down to 0 away from it). */
const ridge = (z) => (z >= 0 ? 1 - smooth(1.4, 7, z) : 1 - smooth(-2.5, -13, z));
/** The ground's height anywhere (the road at z = 0 is exactly heightAt). */
export const groundAt = (x, z) =>
  heightAt(x) * ridge(z) + (Math.abs(z) > 3 ? 0.25 * (noise(x * 0.08, z * 0.08) - 0.5) * smooth(3, 12, Math.abs(z)) : 0);

/** Sample positions: dense near the road and the hill, sparse far away. */
function samples(a, b, fine, coarse, from, to) {
  const out = [];
  for (let x = a; x < b; x += x >= from && x < to ? fine : coarse) out.push(x);
  out.push(b);
  return out;
}

export function createLandscape() {
  const root = new THREE.Group();
  root.name = 'Landscape';

  // ── the ground: one grid, grass coloured by vertex (a little yellower and lighter on the sunny top) ──────────────
  const xs = samples(X0, X1, 0.5, 2.5, -HILL.half - 6, HILL.half + 6);
  const zs = samples(-70, 30, 0.6, 3, -6, 10);
  const pos = new Float32Array(xs.length * zs.length * 3);
  const col = new Float32Array(xs.length * zs.length * 3);
  const grassA = new THREE.Color('#3f9a22');
  const grassB = new THREE.Color('#6dbd35');
  const dry = new THREE.Color('#a8c84a');
  const c = new THREE.Color();
  let i = 0;
  for (const z of zs)
    for (const x of xs) {
      const y = groundAt(x, z);
      pos.set([x, y, z], i * 3);
      const n = noise(x * 0.35, z * 0.35) * 0.6 + noise(x * 1.7, z * 1.7) * 0.4;
      c.copy(grassA).lerp(grassB, n);
      c.lerp(dry, 0.25 * smooth(0.6, 1, y / HILL.height) + 0.2 * smooth(0.55, 0.85, noise(x * 0.05 + 7, z * 0.05)));
      col.set([c.r, c.g, c.b], i * 3);
      i++;
    }
  const index = [];
  for (let r = 0; r < zs.length - 1; r++)
    for (let q = 0; q < xs.length - 1; q++) {
      const a = r * xs.length + q;
      const b = a + 1;
      const d = a + xs.length;
      const e = d + 1;
      index.push(a, d, b, b, d, e);
    }
  const groundGeo = new THREE.BufferGeometry();
  groundGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  groundGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  groundGeo.setIndex(index);
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ name: 'Grass', vertexColors: true, roughness: 1, metalness: 0 }));
  ground.name = 'GrassyHill';
  ground.receiveShadow = true;
  root.add(ground);

  // ── the road: a strip of packed earth over the hill, with worn wheel tracks and soft edges ───────────────────────
  const road = createRoad(-45, 165);
  root.add(road);

  // ── trees behind the road (never in front of the rider) ─────────────────────────────────────────────────────────
  const trees = new THREE.Group();
  trees.name = 'Trees';
  const SPOTS = [
    [-44, -16, 7],
    [-36, -24, 8.5],
    [-28, -15, 6.5],
    [-21, -30, 9],
    [-12, -34, 8],
    [-3, -38, 9.5],
    [8, -33, 8.5],
    [18, -28, 8],
    [26, -18, 7],
    [34, -24, 8.5],
    [43, -15, 6.8],
    [52, -26, 9],
    [62, -16, 7.2],
    [74, -22, 8],
    [88, -15, 6.8],
    [102, -24, 8.6],
    [118, -16, 7],
    [134, -22, 8.2],
    [150, -15, 7],
  ];
  const trunkMat = new THREE.MeshStandardMaterial({ name: 'Bark', color: '#6b4a32', roughness: 0.95 });
  const leafMats = ['#2f8a2a', '#3fa233', '#2a7a2e'].map((color) => new THREE.MeshStandardMaterial({ name: 'Leaves', color, roughness: 0.9 }));
  const leafGeo = new THREE.SphereGeometry(1, 22, 16);
  {
    // a little lumpiness so the crowns are not perfect balls
    const p = leafGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k);
      v.multiplyScalar(1 + 0.22 * (noise(v.x * 3.1 + 5, v.y * 3.1 + v.z * 2) - 0.5));
      p.setXYZ(k, v.x, v.y, v.z);
    }
    leafGeo.computeVertexNormals();
  }
  for (const [k, [x, z, h]] of SPOTS.entries()) {
    const tree = new THREE.Group();
    const base = groundAt(x, z);
    tree.position.set(x, base - 0.1, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * (h / 6), 0.22 * (h / 6), h * 0.55, 8), trunkMat);
    trunk.position.y = h * 0.27;
    tree.add(trunk);
    const crown = [
      [0, 0.62, 0, 0.3],
      [0.18, 0.72, 0.08, 0.24],
      [-0.17, 0.7, -0.05, 0.25],
      [0.04, 0.86, -0.02, 0.22],
      [-0.06, 0.66, 0.16, 0.2],
    ];
    for (const [j, [cx, cy, cz, r]] of crown.entries()) {
      const leaf = new THREE.Mesh(leafGeo, leafMats[(k + j) % 3]);
      leaf.position.set(cx * h, cy * h, cz * h);
      leaf.scale.set(r * h, r * h * 0.85, r * h);
      leaf.rotation.y = k + j;
      tree.add(leaf);
    }
    trees.add(tree);
  }
  root.add(trees);

  // ── far hills and clouds: soft, faded by the fog ─────────────────────────────────────────────────────────────────
  const far = new THREE.Group();
  far.name = 'FarHills';
  const farMat = new THREE.MeshStandardMaterial({ name: 'FarHill', color: '#4f9a5a', roughness: 1 });
  for (const [x, z, r, h] of [
    [-70, -120, 60, 14],
    [10, -150, 80, 20],
    [90, -125, 65, 15],
    [170, -140, 70, 18],
  ]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), farMat);
    m.position.set(x, -0.5, z);
    m.scale.set(r, h, r * 0.45);
    far.add(m);
  }
  root.add(far);
  const clouds = new THREE.Group();
  clouds.name = 'Clouds';
  const cloudMat = new THREE.MeshLambertMaterial({ name: 'Cloud', color: '#ffffff', emissive: '#dfe9f2', emissiveIntensity: 0.55 });
  const puff = new THREE.SphereGeometry(1, 16, 10);
  for (const [x, y, z, s] of [
    [-40, 26, -110, 6],
    [-8, 31, -130, 8],
    [30, 24, -105, 5.5],
    [62, 30, -125, 7],
    [100, 27, -110, 6],
    [140, 32, -130, 8],
  ]) {
    const cloud = new THREE.Group();
    cloud.position.set(x, y, z);
    for (const [px, py, pz, r] of [
      [0, 0, 0, 1],
      [1.1, -0.15, 0.1, 0.75],
      [-1.15, -0.2, 0, 0.7],
      [0.45, 0.45, -0.1, 0.65],
      [-0.5, 0.35, 0.1, 0.6],
    ]) {
      const m = new THREE.Mesh(puff, cloudMat);
      m.position.set(px * s, py * s, pz * s);
      m.scale.set(r * s, r * s * 0.62, r * s * 0.7);
      cloud.add(m);
    }
    clouds.add(cloud);
  }
  root.add(clouds);
  for (const g of [trees, far, clouds]) g.userData.noExport = true;

  // for the GLB: only the hill and a little road at each foot (the long road is for the view)
  const hillRoad = () => createRoad(-HILL.half - 4, HILL.half + 4);
  return { root, road, ground, hillRoad };
}

/** The road as its own mesh (it goes into the GLB with the rider). */
function createRoad(a, b) {
  const xs = samples(a, b, 0.25, 1.5, -HILL.half - 4, HILL.half + 4);
  const zs = [-1.15, -ROAD_HALF, -0.5, -0.3, 0, 0.3, 0.5, ROAD_HALF, 1.15];
  const pos = [];
  const col = [];
  const earth = new THREE.Color('#d2a46a');
  const track = new THREE.Color('#b8864f');
  const verge = new THREE.Color('#6a9a32');
  const c = new THREE.Color();
  for (const z of zs)
    for (const x of xs) {
      const edge = Math.abs(z) > ROAD_HALF;
      // the outer row tucks just under the grass, so the road's edge blends in
      pos.push(x, heightAt(x) + (edge ? -0.03 : 0.012), z);
      if (edge) c.copy(verge);
      else if (Math.abs(Math.abs(z) - 0.3) < 0.01) c.copy(track);
      else c.copy(earth);
      c.offsetHSL(0, 0, 0.05 * (noise(x * 1.3, z * 4) - 0.5));
      col.push(c.r, c.g, c.b);
    }
  const index = [];
  for (let r = 0; r < zs.length - 1; r++)
    for (let q = 0; q < xs.length - 1; q++) {
      const p = r * xs.length + q;
      const d = p + xs.length;
      index.push(p, d, p + 1, p + 1, d, d + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      name: 'DirtRoad',
      vertexColors: true,
      roughness: 1,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  mesh.name = 'Road';
  mesh.receiveShadow = true;
  return mesh;
}
