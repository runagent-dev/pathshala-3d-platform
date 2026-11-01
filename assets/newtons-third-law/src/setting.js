// Where the boy jumps: a river ghat in Bangladesh on a clear morning. Across the river, a mud bank with a green fringe
// and a footpath, village houses with tin and thatch roofs, round trees and betel-nut palms in the morning haze, a
// moored boat, and a sail boat out on the water; the jetty runs out from the near bank, beyond the right edge of the
// picture. The sky is a dome (deep blue above, a warm haze at the horizon), so the horizon sits where the river ends at
// every frame size. The water is lighter and calm in the distance, deeper blue with small waves in front. Warm earth,
// hazy greens and blue water, so the gold force arrows and the white velocity arrows (both outlined) stand out
// everywhere; no white page and no wide green.
//
// Everything here is still: the banks, houses and boats are one vertex-coloured mesh, the trees three instanced meshes
// (crowns, trunks, palm crowns), all in one flat-shaded material; none of it casts shadows; only the water receives the boat's and the boy's.
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
  const nearC = new THREE.Color('#0a6d97');
  const midC = new THREE.Color('#1f8fb5');
  const farC = new THREE.Color('#78b4c4');
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
function house(parts, x, z, ry, s, wall, roof) {
  const at = (lx, ly, lz, sx, sy, sz, rz = 0) => {
    const local = M(lx, ly, lz, sx, sy, sz, 0, rz);
    return M(x, 0, z, s, s, s, ry).multiply(local);
  };
  const box = new THREE.BoxGeometry(1, 1, 1);
  parts.push(painted(box.clone(), wall, at(0, 0.62, 0, 1.9, 0.95, 1.2)));
  parts.push(painted(box.clone(), '#4a3424', at(0.2, 0.47, 0.605, 0.34, 0.62, 0.02)));
  parts.push(painted(box.clone(), '#3c4b57', at(-0.5, 0.72, 0.605, 0.3, 0.26, 0.02)));
  parts.push(painted(box.clone(), '#6b5238', at(0, 0.12, 0, 2.05, 0.14, 1.35)));
  // a three-sided prism along x as the roof
  const prism = new THREE.CylinderGeometry(1, 1, 1, 3, 1);
  prism.rotateZ(Math.PI / 2);
  prism.rotateX(Math.PI / 2 + Math.PI);
  parts.push(painted(prism, roof, at(0, 1.33, 0, 2.3, 0.62, 1.05)));
}

/** A wooden boat seen from afar (dark hull, an awning or a sail). */
function farBoat(parts, x, z, ry, s, sail) {
  const at = (lx, ly, lz, sx, sy, sz, rz = 0) => M(x, 0, z, s, s, s, ry).multiply(M(lx, ly, lz, sx, sy, sz, 0, rz));
  const hull = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  parts.push(painted(hull, '#3d2b1f', at(0, 0.12, 0, 1.9, 0.38, 0.42)));
  parts.push(painted(new THREE.BoxGeometry(1, 1, 1), '#6d4a2c', at(0, 0.12, 0, 3.7, 0.04, 0.78)));
  if (sail) {
    parts.push(painted(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), '#3a2a1c', at(0.1, 1.4, 0, 1, 1, 1)));
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.lineTo(1.25, 0.15);
    sh.lineTo(0.95, 2.1);
    sh.lineTo(0, 2.3);
    sh.closePath();
    const g = new THREE.ShapeGeometry(sh);
    const back = g.clone();
    back.scale(1, 1, -1);
    back.index && back.setIndex([...back.index.array].reverse());
    parts.push(painted(g, sail, at(0.12, 0.3, 0.01, 1, 1, 1)));
    parts.push(painted(back, hazy('#b97a2e', 0.1), at(0.12, 0.3, -0.01, 1, 1, 1)));
  } else {
    // a curved bamboo awning (chhoi) over the middle
    const roof = new THREE.CylinderGeometry(0.42, 0.42, 1.3, 10, 1, true, -Math.PI / 2, Math.PI);
    roof.rotateZ(Math.PI / 2);
    parts.push(painted(roof, '#8a6a3c', at(-0.1, 0.3, 0, 1, 1, 1)));
  }
}

/**
 * The river ghat scenery. Returns the group to add to the boat example; it is left out of GLB exports.
 */
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
  // houses along the far bank, mud or bamboo walls under tin or thatch
  const looks = [
    ['#c49a62', '#7d8b98'],
    ['#b88d55', '#9a5838'],
    ['#cfa877', '#a5864f'],
    ['#b98f5c', '#7d8b98'],
    ['#c79f6a', '#a5864f'],
    ['#bd9461', '#8d4f34'],
    ['#c49a62', '#9a5838'],
  ];
  [-30, -19, -11, -2.5, 6, 15, 26].forEach((x, i) => {
    const [wall, roof] = looks[i];
    const z = bankZ - 4 - rnd() * 3;
    const lift = M(0, 0.57, 0);
    const before = parts.length;
    house(parts, x + (rnd() - 0.5) * 2, z, (rnd() - 0.5) * 0.6, 1.5 + rnd() * 0.3, hazy(wall, 0.35), hazy(roof, 0.32));
    for (let k = before; k < parts.length; k++) parts[k].applyMatrix4(lift);
  });
  // a boat moored at the far bank, and a sail boat out on the river
  farBoat(parts, 3, RIVER.far + 1.2, 0.12, 1.3, null);
  farBoat(parts, -8, -23, -0.15, 1.4, hazy('#d9993c', 0.15));
  // one material (one shader) for all the still scenery: flat-shaded, vertex colours times each instance's colour;
  // the banks are a single "instance" in white
  const scenery = new THREE.MeshLambertMaterial({ name: 'RiverScenery', vertexColors: true, flatShading: true });
  const white = (geo) => {
    if (!geo.attributes.color) geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3));
    return geo;
  };
  const far = new THREE.InstancedMesh(mergeGeometries(parts), scenery, 1);
  far.setMatrixAt(0, new THREE.Matrix4());
  far.setColorAt(0, new THREE.Color('#ffffff'));
  far.computeBoundingSphere();
  far.name = 'Banks';
  root.add(far);
  for (const g of parts) g.dispose();

  // trees: round crowns of a few blobs each, and betel-nut palms (tall thin trunks, a small crown of fronds)
  const crowns = [];
  const trunks = [];
  const palms = [];
  const greens = ['#3f6b2a', '#4c7b30', '#335f25', '#5a8a38', '#466f2b'];
  for (let i = 0; i < 52; i++) {
    const x = -52 + i * 2 + (rnd() - 0.5) * 1.6;
    const z = bankZ - 6 - rnd() * 7;
    const h = 4 + rnd() * 4;
    const haze = 0.38 + (bankZ - 6 - z) * 0.03;
    if (rnd() < 0.24) {
      palms.push({ x, z, h: h + 3, haze });
      trunks.push({ x, y: 0.57, z, h: h + 2.9, r: 0.13 });
      continue;
    }
    trunks.push({ x, y: 0.57, z, h: h * 0.55, r: 0.25 });
    const blobs = 2 + Math.floor(rnd() * 2);
    for (let b = 0; b < blobs; b++) {
      const sz = h * (0.3 + rnd() * 0.1);
      crowns.push({
        x: x + (rnd() - 0.5) * h * 0.5,
        y: 0.57 + h * 0.62 + rnd() * h * 0.22,
        z: z + (rnd() - 0.5) * 1.5,
        s: sz,
        c: hazy(greens[Math.floor(rnd() * greens.length)], haze),
      });
    }
  }
  const m4 = new THREE.Matrix4();
  const crownMesh = new THREE.InstancedMesh(white(new THREE.IcosahedronGeometry(1, 1)), scenery, crowns.length);
  crownMesh.name = 'TreeCrowns';
  crowns.forEach((t, i) => {
    crownMesh.setMatrixAt(i, m4.copy(M(t.x, t.y, t.z, t.s * 1.15, t.s * 0.9, t.s, rnd() * 3)));
    crownMesh.setColorAt(i, t.c);
  });
  const trunkMesh = new THREE.InstancedMesh(white(new THREE.CylinderGeometry(0.7, 1, 1, 6).translate(0, 0.5, 0)), scenery, trunks.length);
  trunkMesh.name = 'TreeTrunks';
  trunks.forEach((t, i) => {
    trunkMesh.setMatrixAt(i, m4.copy(M(t.x, t.y, t.z, t.r, t.h, t.r)));
    trunkMesh.setColorAt(i, hazy(t.r < 0.2 ? '#8a7a5c' : '#5b4331', t.y < 0.3 ? 0 : 0.35));
  });
  // a palm crown: eight drooping fronds round the top of the trunk
  const fronds = [];
  for (let k = 0; k < 8; k++) {
    const f = new THREE.ConeGeometry(0.16, 1.3, 4, 1);
    f.translate(0, 0.65, 0);
    f.applyMatrix4(M(0, 0, 0, 1, 1, 0.35, (k / 8) * Math.PI * 2, 0).multiply(M(0, 0, 0, 1, 1, 1, 0, -1.15 - (k % 2) * 0.25)));
    fronds.push(f.toNonIndexed());
  }
  const palmMesh = new THREE.InstancedMesh(white(mergeGeometries(fronds)), scenery, palms.length);
  palmMesh.name = 'PalmCrowns';
  palms.forEach((t, i) => {
    palmMesh.setMatrixAt(i, m4.copy(M(t.x, 0.57 + t.h, t.z, 1.7, 1.7, 1.7, rnd() * 3)));
    palmMesh.setColorAt(i, hazy('#4f7a2c', t.haze));
  });
  for (const im of [crownMesh, trunkMesh, palmMesh]) {
    im.computeBoundingSphere();
    root.add(im);
  }
  return root;
}
