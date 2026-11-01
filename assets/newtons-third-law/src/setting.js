// Where the boy jumps: a river ghat in Bangladesh on a clear morning. Across the river, only a mud bank with a green
// fringe and a footpath (no houses, trees or other boats: only the main objects); the jetty runs out from the near bank, beyond the right edge of the
// picture. The sky is a dome (deep blue above, a warm haze at the horizon), so the horizon sits where the river ends at
// every frame size. The water is lighter and calm in the distance, deeper blue with small waves in front. Warm earth,
// hazy greens and blue water, so the gold force arrows and the white velocity arrows (both outlined) stand out
// everywhere; no white page and no wide green.
//
// Everything here is still: the banks are one vertex-coloured mesh in one flat-shaded material; none of it casts shadows; only the water receives the boat's and the boy's.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const RIVER = { far: -30, near: 8, width: 110 };

function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const HAZE = new THREE.Color('#e9d5b3');
/** A colour faded towards the morning haze by `k` (0 none, 1 all haze). */
const hazy = (c, k) => new THREE.Color(c).lerp(HAZE, k);

/** position + normal + a plain colour, moved by a matrix: ready to merge with the rest of the scenery. */
function painted(geo, color, matrix) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
  if (matrix) g.applyMatrix4(matrix);
  const c = color instanceof THREE.Color ? color : new THREE.Color(color);
  const rgb = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < rgb.length; i += 3) c.toArray(rgb, i);
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  return g;
}
const M = (x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  );

/** The sky: a dome, deep blue overhead, pale blue, then a warm haze at the horizon and below it. */
function sky() {
  const geo = new THREE.SphereGeometry(70, 32, 16);
  const stops = [
    [-1, '#e6cfa6'],
    [0, '#efd6aa'],
    [0.06, '#f3dcb4'],
    [0.16, '#b9d6ea'],
    [0.42, '#78aedb'],
    [1, '#3d77bd'],
  ].map(([y, c]) => [y, new THREE.Color(c)]);
  const p = geo.attributes.position;
  const rgb = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 70;
    let k = 1;
    while (k < stops.length - 1 && y > stops[k][0]) k++;
    const [y0, c0] = stops[k - 1];
    const [y1, c1] = stops[k];
    c.copy(c0).lerp(c1, Math.min(1, Math.max(0, (y - y0) / (y1 - y0))));
    c.toArray(rgb, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  const dome = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ name: 'MorningSky', vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  dome.name = 'Sky';
  dome.renderOrder = -2;
  dome.frustumCulled = false;
  return dome;
}

/** A few soft clouds high over the far bank (seen when the student turns the view up). */
function clouds(rnd) {
  const parts = [];
  const puff = new THREE.IcosahedronGeometry(1, 1);
  const top = new THREE.Color('#fbf6ee');
  const under = new THREE.Color('#d9d2c8');
  const c = new THREE.Color();
  for (let i = 0; i < 7; i++) {
    const a = -1.2 + (2.4 * i) / 6 + (rnd() - 0.5) * 0.2;
    const r = 58;
    const x = Math.sin(a) * r;
    const z = -Math.cos(a) * r;
    const y = 9 + rnd() * 9;
    for (let j = 0; j < 6; j++) {
      const s = 1.6 + rnd() * 1.8;
      const g = puff.clone();
      g.applyMatrix4(M(x + (j - 2.5) * 2.1 + rnd(), y + rnd() * 0.8, z + rnd() * 2, s * 1.5, s * 0.7, s, a));
      const p = g.attributes.position;
      const rgb = new Float32Array(p.count * 3);
      for (let k = 0; k < p.count; k++) {
        const t = Math.min(1, Math.max(0, (p.getY(k) - y + s * 0.4) / (s * 0.9)));
        c.copy(under)
          .lerp(top, t)
          .toArray(rgb, k * 3); // the underside a little greyer
      }
      for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
      g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
      parts.push(g.index ? g.toNonIndexed() : g);
    }
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshBasicMaterial({ name: 'Clouds', vertexColors: true, fog: false }));
  mesh.name = 'Clouds';
  return mesh;
}

/** The river: a wide sheet with gentle waves, light and hazy by the far bank, deeper blue in front. */
function water() {
  const depth = RIVER.near - RIVER.far;
  const geo = new THREE.PlaneGeometry(RIVER.width, depth, 120, 60);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, (RIVER.near + RIVER.far) / 2);
  const p = geo.attributes.position;
  const rgb = new Float32Array(p.count * 3);
  const nearC = new THREE.Color('#2a6f8c');
  const midC = new THREE.Color('#4b8fa8');
  const farC = new THREE.Color('#8fb6c2');
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const fade = Math.min(1, Math.max(0, (z + 14) / 8)); // calm in the distance, small waves from 14 m away
    p.setY(i, fade * (0.025 * Math.sin(x * 3.5 + z * 2) + 0.012 * Math.sin(z * 8)));
    const t = (z - RIVER.far) / depth;
    if (t < 0.55) c.copy(farC).lerp(midC, t / 0.55);
    else c.copy(midC).lerp(nearC, (t - 0.55) / 0.45);
    c.toArray(rgb, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ name: 'RiverWater', vertexColors: true, specular: 0x5fb6cc, shininess: 60 }));
  mesh.name = 'River';
  mesh.position.y = -0.13;
  mesh.receiveShadow = true;
  return mesh;
}

/** A village house: walls, a door and a window, a pitched roof (tin or thatch); in the house's own frame. */
export function createRiverSetting() {
  const root = new THREE.Group();
  root.name = 'RiverGhat';
  root.userData.noExport = true;
  const rnd = rng(7);
  root.add(sky(), clouds(rnd), water());

  const parts = [];
  const box = () => new THREE.BoxGeometry(1, 1, 1);
  const W = 120; // the banks run this far across, wider than any frame sees
  const bankZ = RIVER.far - 1.2;
  // the far bank: wet mud at the water, a sloping mud face, a dry top with a green fringe and a footpath
  parts.push(painted(box(), hazy('#5f4a33', 0.3), M(0, -0.1, RIVER.far - 0.1, W, 0.16, 0.8)));
  parts.push(painted(box(), hazy('#8d6c47', 0.35), M(0, 0.2, bankZ + 0.4, W, 0.7, 1.6)));
  parts.push(painted(box(), hazy('#a88a5e', 0.38), M(0, 0.55, bankZ - 8, W, 0.04, 16)));
  parts.push(painted(box(), hazy('#5f7f36', 0.4), M(0, 0.58, bankZ - 0.8, W, 0.04, 0.8)));
  parts.push(painted(box(), hazy('#b89a6a', 0.4), M(0, 0.575, bankZ - 2.2, W, 0.04, 0.9)));
  // nothing on the far bank (the owner: only the main objects): no houses, trees or other boats
  // one material (one shader) for all the still scenery: flat-shaded, vertex colours times each instance's colour;
  // the banks are a single "instance" in white
  const scenery = new THREE.MeshLambertMaterial({ name: 'RiverScenery', vertexColors: true, flatShading: true });

  const far = new THREE.InstancedMesh(mergeGeometries(parts), scenery, 1);
  far.setMatrixAt(0, new THREE.Matrix4());
  far.setColorAt(0, new THREE.Color('#ffffff'));
  far.computeBoundingSphere();
  far.name = 'Banks';
  root.add(far);
  for (const g of parts) g.dispose();

  return root;
}
