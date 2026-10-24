// The countryside of চিত্র ২.০৪ as a 3D tile: rice fields, ponds, village homes and trees round the winding road,
// the kilometre posts 0–7 with the book's points A, B and C, and a compass. The road and its kilometres are to
// scale; the houses, trees and posts are drawn bigger than real so that they can be seen at all.
// Scene units: metres. x = east, z = south (north is −z), y = up. A is at the origin.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { textMesh } from '@shared/student/materials.js';
import { COUNT, END, POSTS, ROAD, ROAD_END, STEP, STOPS, headingAt, pointAt } from './road.js';

/** metres in a kilometre (the road data is in km, the scene in m) */
export const KM = 1000;
/** The tile, in km: west, east, south and north edges. */
export const BOARD = { x0: -0.95, x1: 2.15, n0: -0.92, n1: 2.8 };
const THICK = 70; // m, the tile's soil edge
export const ROAD_W = 90; // m, the road (drawn wider than real, like everything but the distances)
export const ROAD_Y = 3; // m above the fields

/** Scene point of a map point (x east, n north, in km). */
export const toScene = (x, n, y = 0, out = new THREE.Vector3()) => out.set(x * KM, y, -n * KM);

/**
 * The road's centre line and sideways direction at every sample, in scene metres: cx, cz (centre) and
 * rx, rz (unit vector to the right of a rider going the way km grows).
 */
export const FRAME = (() => {
  const cx = new Float32Array(COUNT);
  const cz = new Float32Array(COUNT);
  const rx = new Float32Array(COUNT);
  const rz = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(COUNT - 1, i + 1);
    const fx = ROAD[2 * b] - ROAD[2 * a];
    const fz = -(ROAD[2 * b + 1] - ROAD[2 * a + 1]);
    const len = Math.hypot(fx, fz) || 1;
    cx[i] = ROAD[2 * i] * KM;
    cz[i] = -ROAD[2 * i + 1] * KM;
    // right = forward × up
    rx[i] = -fz / len;
    rz[i] = fx / len;
  }
  return { cx, cz, rx, rz };
})();

// ── where things may stand (km) ─────────────────────────────────────────────────
/** Distance from (x, n) to the road, km. */
function roadClear(x, n) {
  let d = Infinity;
  for (let i = 0; i < COUNT; i++) d = Math.min(d, Math.hypot(ROAD[2 * i] - x, ROAD[2 * i + 1] - n));
  return d;
}
/**
 * Distance from (x, n) to the ground the displacement arrow can lie on (every straight line from A to a point of
 * the road the cyclist can reach), km. Trees and houses stay out of it, so the arrow is never hidden.
 */
function fanClear(x, n) {
  let d = Infinity;
  for (let i = 1, last = Math.round(END / STEP); i <= last; i++) {
    const bx = ROAD[2 * i];
    const by = ROAD[2 * i + 1];
    const f = Math.max(0, Math.min(1, (x * bx + n * by) / (bx * bx + by * by)));
    d = Math.min(d, Math.hypot(bx * f - x, by * f - n));
  }
  return d;
}
const onBoard = (x, n, margin) => x > BOARD.x0 + margin && x < BOARD.x1 - margin && n > BOARD.n0 + margin && n < BOARD.n1 - margin;

/** A small seeded random generator, so the village looks the same every time. */
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

// Village homes (বাড়ি): a courtyard with a few houses, trees round it and a pond. Centres in km.
const HOMES = [
  { x: -0.56, n: -0.42, pond: [0.17, 0.12] },
  { x: -0.62, n: 0.5, pond: [0.12, -0.18] },
  { x: 1.5, n: -0.62, pond: [-0.2, 0.1] },
  { x: 0.3, n: 2.32, pond: [0.2, -0.08] },
  { x: 1.28, n: 2.28, pond: [-0.06, 0.2] },
  { x: 1.92, n: 1.95, pond: null },
  { x: -0.2, n: 2.6, pond: null },
  { x: 1.95, n: -0.12, pond: null },
];
/** The compass stands in the south-east corner, where nothing else is. km. */
const COMPASS_AT = { x: 1.93, n: -0.72 };

/**
 * Where each kilometre post stands: beside the road, on the outside, away from the ground the arrow sweeps (the
 * road winds anticlockwise round A up to about km 5.5, so the outside is on the rider's right; after that the road
 * runs north to the west of A, and the outside is on the left).
 */
function postSpots() {
  return POSTS.map((km) => {
    const p = pointAt(km);
    const h = headingAt(km);
    const off = km <= 5.5 ? 0.085 : -0.085;
    return { km, x: p.x + h.y * off, n: p.y - h.x * off };
  });
}

// ── the ground: fields, ponds, paths, the road's verge (one painted texture) ────────
const FIELDS_CALM = ['#9fcb6b', '#a9d074', '#93c262', '#b4d57e', '#a3c96c'];
const FIELDS_ALL = [...FIELDS_CALM, '#c6d982', '#d9d58a', '#e3d27a', '#cdbf91', '#efd54c'];

function groundTexture(renderer, homes, ponds) {
  const W = 1024;
  const H = Math.round((W * (BOARD.n1 - BOARD.n0)) / (BOARD.x1 - BOARD.x0));
  const sx = W / (BOARD.x1 - BOARD.x0);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const P = (x, n) => [(x - BOARD.x0) * sx, (BOARD.n1 - n) * sx];
  g.fillStyle = '#a8cd76';
  g.fillRect(0, 0, W, H);

  // rice fields on a slightly turned, jittered grid; the ground the arrow sweeps stays calm green
  const r = rand(21);
  const a = 0.18;
  const U = [Math.cos(a) * 0.17, Math.sin(a) * 0.17];
  const V = [-Math.sin(a) * 0.115, Math.cos(a) * 0.115];
  const jit = new Map();
  const lattice = (i, j) => {
    const key = `${i},${j}`;
    if (!jit.has(key)) jit.set(key, [(r() - 0.5) * 0.05, (r() - 0.5) * 0.04]);
    const [jx, jy] = jit.get(key);
    return [BOARD.x0 + i * U[0] + j * V[0] + jx, BOARD.n0 + i * U[1] + j * V[1] + jy];
  };
  g.lineJoin = 'round';
  for (let i = -8; i < 24; i++) {
    for (let j = -4; j < 40; j++) {
      const q = [lattice(i, j), lattice(i + 1, j), lattice(i + 1, j + 1), lattice(i, j + 1)];
      const mx = (q[0][0] + q[2][0]) / 2;
      const mn = (q[0][1] + q[2][1]) / 2;
      if (mx < BOARD.x0 - 0.2 || mx > BOARD.x1 + 0.2 || mn < BOARD.n0 - 0.2 || mn > BOARD.n1 + 0.2) continue;
      const calm = fanClear(mx, mn) < 0.05;
      const list = calm ? FIELDS_CALM : FIELDS_ALL;
      g.fillStyle = list[Math.floor(r() * list.length)];
      g.beginPath();
      for (const [k, [x, n]] of q.entries()) g[k ? 'lineTo' : 'moveTo'](...P(x, n));
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(236, 230, 196, 0.9)'; // the ridges (আইল) between fields
      g.lineWidth = 1.6;
      g.stroke();
    }
  }

  // homes: a darker grove of trees, a swept courtyard, a path to the road
  for (const h of homes) {
    const [x, y] = P(h.x, h.n);
    const grad = g.createRadialGradient(x, y, 0, x, y, 0.24 * sx);
    grad.addColorStop(0, 'rgba(98, 140, 72, 0.95)');
    grad.addColorStop(0.7, 'rgba(110, 152, 80, 0.75)');
    grad.addColorStop(1, 'rgba(110, 152, 80, 0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, 0.24 * sx, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = '#d9c99e';
  g.lineCap = 'round';
  g.lineWidth = 0.018 * sx;
  for (const h of homes) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < COUNT; i++) {
      const d = Math.hypot(ROAD[2 * i] - h.x, ROAD[2 * i + 1] - h.n);
      if (d < bestD && fanClear((ROAD[2 * i] + h.x) / 2, (ROAD[2 * i + 1] + h.n) / 2) > 0.04) {
        bestD = d;
        best = i;
      }
    }
    if (bestD > 0.7) continue;
    g.beginPath();
    g.moveTo(...P(h.x, h.n));
    g.lineTo(...P(ROAD[2 * best], ROAD[2 * best + 1]));
    g.stroke();
  }
  for (const h of homes) {
    const [x, y] = P(h.x, h.n);
    g.fillStyle = '#ddd0a8';
    g.beginPath();
    g.arc(x, y, 0.055 * sx, 0, Math.PI * 2);
    g.fill();
  }
  // ponds (পুকুর)
  for (const p of ponds) {
    const [x, y] = P(p.x, p.n);
    g.save();
    g.translate(x, y);
    g.rotate(p.turn);
    g.fillStyle = '#6aa5c9';
    g.strokeStyle = '#c9bd8f';
    g.lineWidth = 0.012 * sx;
    g.beginPath();
    g.roundRect((-p.w / 2) * sx, (-p.h / 2) * sx, p.w * sx, p.h * sx, 0.025 * sx);
    g.fill();
    g.stroke();
    g.fillStyle = 'rgba(255, 255, 255, 0.22)';
    g.beginPath();
    g.roundRect((-p.w / 2 + 0.015) * sx, (-p.h / 2 + 0.012) * sx, (p.w - 0.03) * sx, 0.02 * sx, 0.01 * sx);
    g.fill();
    g.restore();
  }
  // the road's dusty verge (the road itself is a mesh on top)
  g.strokeStyle = '#d6cba3';
  g.lineWidth = 0.14 * sx;
  g.beginPath();
  for (let i = 0; i < COUNT; i++) g[i ? 'lineTo' : 'moveTo'](...P(ROAD[2 * i], ROAD[2 * i + 1]));
  g.lineTo(...P(ROAD[2 * COUNT - 2], BOARD.n1 + 0.1));
  g.stroke();
  g.beginPath();
  g.arc(...P(0, 0), 0.1 * sx, 0, Math.PI * 2);
  g.fillStyle = '#d6cba3';
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

// ── the road ────────────────────────────────────────────────────────────────────
/** The road surface: grey with light edges, from A to where it leaves the tile. */
function roadMesh() {
  // centre line samples, plus a straight run past the last one to the tile's edge
  const pts = [];
  for (let i = 0; i < COUNT; i++) pts.push([FRAME.cx[i], FRAME.cz[i], FRAME.rx[i], FRAME.rz[i]]);
  const [lx, lz, lrx, lrz] = pts[COUNT - 1];
  const fx = lrz; // forward = up × right … in the ground plane: (rz, −rx)
  const fz = -lrx;
  const run = (-BOARD.n1 * KM - lz) / fz; // metres to the north edge
  for (let k = 1; k <= 3; k++) pts.push([lx + (fx * run * k) / 3, lz + (fz * run * k) / 3, lrx, lrz]);
  const across = [-0.5, -0.42, -0.42, 0.42, 0.42, 0.5]; // fractions of the width: edge strip, surface, edge strip
  const edge = new THREE.Color('#dcd6c3');
  const surface = new THREE.Color('#7b8088');
  const pos = [];
  const col = [];
  for (const [x, z, rx, rz] of pts) {
    for (const [k, f] of across.entries()) {
      pos.push(x + rx * f * ROAD_W, ROAD_Y, z + rz * f * ROAD_W);
      const cc = k === 2 || k === 3 ? surface : edge;
      col.push(cc.r, cc.g, cc.b);
    }
  }
  // the edge strips are the quads between columns 0–1 and 4–5; the surface between 2–3
  const idx = [];
  const n = across.length;
  for (let i = 0; i < pts.length - 1; i++) {
    for (const k of [0, 2, 4]) {
      const a = i * n + k;
      const b = a + 1;
      const c = a + n;
      const d = c + 1;
      idx.push(a, b, c, b, d, c); // counter-clockwise seen from above
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'Road', vertexColors: true, roughness: 0.95, metalness: 0 }));
  mesh.name = 'Road';
  mesh.receiveShadow = true;
  // the round open place at A where the ride starts
  const square = new THREE.Mesh(
    new THREE.CircleGeometry(62, 32),
    new THREE.MeshStandardMaterial({ name: 'RoadA', color: '#7b8088', roughness: 0.95 }),
  );
  square.rotation.x = -Math.PI / 2;
  square.position.y = ROAD_Y - 0.5;
  square.receiveShadow = true;
  square.name = 'Square A';
  const group = new THREE.Group();
  group.name = 'Road';
  group.add(mesh, square);
  return group;
}

// ── trees and houses (instanced) ────────────────────────────────────────────────
function placeVillage(ponds, posts) {
  const r = rand(5);
  const round = []; // { x, n, s }
  const palms = [];
  const houses = []; // { x, n, turn, kind }
  const busy = (x, n, gap) =>
    ponds.some((p) => Math.hypot(p.x - x, p.n - n) < Math.max(p.w, p.h) / 2 + gap) ||
    posts.some((p) => Math.hypot(p.x - x, p.n - n) < gap + 0.03) ||
    [...round, ...palms].some((t) => Math.hypot(t.x - x, t.n - n) < 0.045) ||
    houses.some((h) => Math.hypot(h.x - x, h.n - n) < 0.07);
  const free = (x, n, gap) => onBoard(x, n, 0.05) && roadClear(x, n) > gap + 0.045 && fanClear(x, n) > gap + 0.035 && !busy(x, n, gap);

  for (const h of HOMES) {
    const turn0 = r() * Math.PI * 2;
    for (let k = 0; k < 3; k++) {
      const t = turn0 + (k * Math.PI * 2) / 3 + (r() - 0.5) * 0.5;
      const x = h.x + Math.cos(t) * 0.075;
      const n = h.n + Math.sin(t) * 0.075;
      if (free(x, n, 0.045)) houses.push({ x, n, turn: t, kind: Math.floor(r() * 4) });
    }
    for (let k = 0; k < 26; k++) {
      const t = r() * Math.PI * 2;
      const d = 0.12 + r() * 0.13;
      const x = h.x + Math.cos(t) * d;
      const n = h.n + Math.sin(t) * d;
      const palm = r() < 0.3;
      if (free(x, n, 0.04)) (palm ? palms : round).push({ x, n, s: 0.8 + r() * 0.45 });
    }
  }
  // trees here and there along the road and the field ridges, never on the arrow's ground
  for (let km = 0.3; km < ROAD_END; km += 0.22) {
    const p = pointAt(km);
    const hd = headingAt(km);
    const side = r() < 0.5 ? 1 : -1;
    const x = p.x + hd.y * side * 0.1;
    const n = p.y - hd.x * side * 0.1;
    if (r() < 0.55 && free(x, n, 0.04)) (r() < 0.25 ? palms : round).push({ x, n, s: 0.75 + r() * 0.4 });
  }
  for (let k = 0; k < 160; k++) {
    const x = BOARD.x0 + r() * (BOARD.x1 - BOARD.x0);
    const n = BOARD.n0 + r() * (BOARD.n1 - BOARD.n0);
    if (r() < 0.45 && free(x, n, 0.05)) (r() < 0.3 ? palms : round).push({ x, n, s: 0.7 + r() * 0.5 });
  }
  return { round, palms, houses };
}

const TREE_GREENS = ['#4f8a3c', '#5c9a45', '#3f7a35', '#6aa64f', '#558f40'];
const WALLS = ['#e9e2d2', '#cfa77d', '#b9c0c6', '#ddd2b8'];
const ROOFS = ['#8e979f', '#a65a3f', '#4e806b', '#b04a3c'];

function villageMeshes(v) {
  const group = new THREE.Group();
  group.name = 'Village';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  const r = rand(9);
  const up = new THREE.Vector3(0, 1, 0);
  const instanced = (geo, mat, count, name) => {
    const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
    mesh.count = count;
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const plain = (name) => new THREE.MeshStandardMaterial({ name, color: '#ffffff', roughness: 0.9, metalness: 0 });

  // round trees (mango, jackfruit…): a lumpy crown on a trunk
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  crownGeo.translate(0, 0.9, 0);
  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.13, 1, 6);
  trunkGeo.translate(0, 0.5, 0);
  const crowns = instanced(crownGeo, plain('TreeCrown'), v.round.length, 'Trees');
  const trunks = instanced(
    trunkGeo,
    new THREE.MeshStandardMaterial({ name: 'Trunk', color: '#7a5a3c', roughness: 0.9 }),
    v.round.length + v.palms.length,
    'Trunks',
  );
  for (const [i, t] of v.round.entries()) {
    const size = 42 * t.s;
    q.setFromAxisAngle(up, r() * 6.28);
    m.compose(toScene(t.x, t.n, 28 * t.s, p), q, s.set(size, size * (0.85 + r() * 0.25), size));
    crowns.setMatrixAt(i, m);
    crowns.setColorAt(i, c.set(TREE_GREENS[Math.floor(r() * TREE_GREENS.length)]));
    m.compose(toScene(t.x, t.n, 0, p), q.identity(), s.set(size * 0.9, 34 * t.s, size * 0.9));
    trunks.setMatrixAt(i, m);
  }
  // palms (coconut, betel nut): a tall thin trunk and a crown of fronds
  const fronds = [];
  for (let k = 0; k < 7; k++) {
    const leaf = new THREE.ConeGeometry(0.16, 1.1, 4, 1);
    leaf.scale(1, 1, 0.25);
    leaf.translate(0, 0.55, 0);
    leaf.rotateZ(-1.15 - (k % 2) * 0.25);
    leaf.rotateY((k * Math.PI * 2) / 7);
    fronds.push(leaf);
  }
  const frondGeo = mergeGeometries(fronds);
  const palmCrowns = instanced(frondGeo, plain('PalmFronds'), v.palms.length, 'Palms');
  for (const [i, t] of v.palms.entries()) {
    const h = 105 * t.s;
    const lean = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.18, 0, (r() - 0.5) * 0.18));
    m.compose(toScene(t.x, t.n, 0, p), lean, s.set(20 * t.s, h, 20 * t.s));
    trunks.setMatrixAt(v.round.length + i, m);
    const top = new THREE.Vector3(0, h, 0).applyQuaternion(lean).add(toScene(t.x, t.n));
    q.setFromAxisAngle(up, r() * 6.28);
    m.compose(top, q, s.setScalar(58 * t.s));
    palmCrowns.setMatrixAt(i, m);
    palmCrowns.setColorAt(i, c.set(TREE_GREENS[Math.floor(r() * 3)]).offsetHSL(0.02, 0.05, 0.03));
  }
  // houses with tin roofs (টিনের চালা)
  const wallGeo = new THREE.BoxGeometry(1, 1, 1);
  wallGeo.translate(0, 0.5, 0);
  const roofGeo = (() => {
    const L = 0.56;
    const W = 0.42;
    const H = 0.3;
    const v3 = [
      // two slopes
      [-L, 0, W],
      [L, 0, W],
      [L, H, 0],
      [-L, 0, W],
      [L, H, 0],
      [-L, H, 0],
      [L, 0, -W],
      [-L, 0, -W],
      [-L, H, 0],
      [L, 0, -W],
      [-L, H, 0],
      [L, H, 0],
      // gable ends
      [-L, 0, -W],
      [-L, 0, W],
      [-L, H, 0],
      [L, 0, W],
      [L, 0, -W],
      [L, H, 0],
    ].flat();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v3, 3));
    geo.computeVertexNormals();
    geo.translate(0, 1, 0);
    return geo;
  })();
  const walls = instanced(wallGeo, plain('Walls'), v.houses.length, 'Houses');
  const roofs = instanced(
    roofGeo,
    new THREE.MeshStandardMaterial({ name: 'Roofs', color: '#ffffff', roughness: 0.55, metalness: 0.25, side: THREE.DoubleSide }),
    v.houses.length,
    'Roofs',
  );
  for (const [i, h] of v.houses.entries()) {
    q.setFromAxisAngle(up, -h.turn + Math.PI / 2);
    m.compose(toScene(h.x, h.n, 0, p), q, s.set(70, 34, 50));
    walls.setMatrixAt(i, m);
    walls.setColorAt(i, c.set(WALLS[h.kind]));
    m.compose(toScene(h.x, h.n, 0, p), q, s.set(70 * 1.05, 34, 50 * 1.12));
    roofs.setMatrixAt(i, m);
    roofs.setColorAt(i, c.set(ROOFS[(h.kind + i) % ROOFS.length]));
  }
  for (const mesh of group.children) {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }
  return group;
}

// ── labels that always face the viewer and keep their size on screen ────────────────
/**
 * Plates drawn in pixels (1 unit = 1 px at scale 1) and scaled every frame so they keep that size on screen: the
 * kilometre numbers, the letters A, B, C and the compass's north. They draw over everything, like map labels.
 */
function createLabels() {
  const group = new THREE.Group();
  group.name = 'Labels';
  group.userData.noExport = true;
  const items = [];
  const flat = (geo, color, order) => {
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, toneMapped: false, transparent: true }),
    );
    mesh.renderOrder = order;
    return mesh;
  };
  const rounded = (w, h, r) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, 0);
    s.lineTo(w / 2 - r, 0);
    s.quadraticCurveTo(w / 2, 0, w / 2, r);
    s.lineTo(w / 2, h - r);
    s.quadraticCurveTo(w / 2, h, w / 2 - r, h);
    s.lineTo(-w / 2 + r, h);
    s.quadraticCurveTo(-w / 2, h, -w / 2, h - r);
    s.lineTo(-w / 2, r);
    s.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
    return new THREE.ShapeGeometry(s, 4);
  };
  /**
   * A label beside the road point `road`, on the side where `side` lies (the post), clear of the road: a number
   * plate, with a letter disc on top for A, B and C. Without `side` (the compass) it stands just above `road`.
   * km: the place it names (a tap on it rides there).
   */
  function add({ text, letter = null, road, side = null, km = null, dark = false }) {
    const holder = new THREE.Group();
    const order = 20 + items.length * 6; // each label's layers together, so overlapping labels never interleave
    const em = 14;
    const num = textMesh(text, em, { color: '#1d2733', weight: 700 });
    num.geometry.computeBoundingBox();
    const box = num.geometry.boundingBox;
    const pw = Math.max(22, box.max.x - box.min.x - 0.16 * em + 11); // the glyphs' width (textMesh pads 0.16 em)
    const h = letter ? 24 + 3 + 33 : 24;
    const w = letter ? Math.max(pw + 3, 33) : pw + 3;
    const y0 = -h / 2; // the plate at the bottom, the letter above it
    const border = flat(rounded(pw + 3, 24, 6), dark ? '#1d2733' : '#5b6672', order);
    border.position.y = y0;
    const plate = flat(rounded(pw, 21, 5), '#ffffff', order + 1);
    plate.position.y = y0 + 1.5;
    num.position.y = y0 + 12.3;
    num.material.depthTest = false;
    num.renderOrder = order + 2;
    holder.add(border, plate, num);
    if (letter) {
      const cy = y0 + 27 + 16.5;
      const ring = flat(new THREE.CircleGeometry(16.5, 32), '#ffffff', order + 3);
      const disc = flat(new THREE.CircleGeometry(15, 32), '#1d2733', order + 4);
      const glyph = textMesh(letter, 19, { color: '#ffffff', weight: 700 });
      ring.position.y = disc.position.y = cy;
      glyph.position.y = cy + 0.6;
      glyph.material.depthTest = false;
      glyph.renderOrder = order + 5;
      holder.add(ring, disc, glyph);
    }
    holder.userData = { road: road.clone(), side: side?.clone() ?? null, w, h, km };
    group.add(holder);
    items.push(holder);
    return holder;
  }

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  /**
   * Every frame: face the camera, keep the size in pixels (times `size`: smaller on small screens), and sit beside
   * the road on the post's side, far enough that the plate never covers the road. `keepClear` ({ x0, y0, x1, y1 }
   * in pixels: the cyclist) pushes a label further out while it would cover it.
   */
  function update(camera, width, height, size = 1, keepClear = null) {
    const k = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, height);
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const px = (p, out) => {
      out.copy(p).project(camera);
      return out.set(((out.x + 1) / 2) * width, ((1 - out.y) / 2) * height, out.z);
    };
    for (const it of items) {
      const { road, side } = it.userData;
      const w = it.userData.w * size;
      const h = it.userData.h * size;
      px(road, a);
      let dx = 0;
      let dy = -1; // straight up when there is no side
      if (side) {
        px(side, b);
        const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        dx = (b.x - a.x) / len;
        dy = (b.y - a.y) / len;
      }
      let d = (side ? 6 : 3) + Math.abs(dx) * (w / 2) + Math.abs(dy) * (h / 2);
      const covers = () => {
        const cx = a.x + dx * d;
        const cy = a.y + dy * d;
        return cx + w / 2 > keepClear.x0 && cx - w / 2 < keepClear.x1 && cy + h / 2 > keepClear.y0 && cy - h / 2 < keepClear.y1;
      };
      // (but never up under the buttons in the view's top corner: better over the cyclist's head than hidden)
      const roomAbove = () => a.y + dy * (d + 3) - h / 2 > 50;
      if (side && keepClear) for (let n = 0; n < 24 && covers() && (dy >= 0 || roomAbove()); n++) d += 3;
      const wpp = camera.position.distanceTo(road) * k; // scene metres per pixel there
      it.position
        .copy(road)
        .addScaledVector(right, dx * d * wpp)
        .addScaledVector(up, -dy * d * wpp);
      it.quaternion.copy(camera.quaternion);
      it.scale.setScalar(wpp * size);
    }
  }
  return { group, add, update };
}

// ── kilometre posts (মাইলফলক-like) and the compass ───────────────────────────────
function postMesh() {
  const body = new THREE.BoxGeometry(26, 52, 14);
  body.translate(0, 26, 0);
  const cap = new THREE.CylinderGeometry(13, 13, 14, 16, 1, false, 0, Math.PI);
  cap.rotateZ(Math.PI / 2);
  cap.rotateY(Math.PI / 2);
  cap.translate(0, 52, 0);
  return { body, cap };
}

function compass(labels, t) {
  const group = new THREE.Group();
  group.name = 'Compass';
  const at = toScene(COMPASS_AT.x, COMPASS_AT.n, ROAD_Y);
  group.position.copy(at);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(78, 40),
    new THREE.MeshStandardMaterial({ name: 'CompassDisc', color: '#ffffff', roughness: 0.8 }),
  );
  disc.rotation.x = -Math.PI / 2;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(70, 78, 40),
    new THREE.MeshStandardMaterial({ name: 'CompassRing', color: '#5b6672', roughness: 0.8 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.6;
  const needle = (color, dir) => {
    const s = new THREE.Shape();
    s.moveTo(0, 64 * dir);
    s.lineTo(14, 0);
    s.lineTo(-14, 0);
    s.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshStandardMaterial({ name: 'Needle', color, roughness: 0.6 }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 1.2;
    return mesh;
  };
  group.add(disc, ring, needle('#1d2733', 1), needle('#aab3bd', -1));
  for (const m of group.children) m.receiveShadow = true;
  labels.add({ text: t('north_short'), road: toScene(COMPASS_AT.x, COMPASS_AT.n + 0.064, ROAD_Y + 2), dark: true });
  return group;
}

/**
 * The whole tile. t: the strings (for the compass), N: digits in the language. Returns { root, labels (update them
 * before each frame), pickables (the road, posts and labels, for tapping a place), box (for framing) }.
 */
export function createCountryside({ renderer, t, N }) {
  const root = new THREE.Group();
  root.name = 'Countryside';

  const ponds = HOMES.filter((h) => h.pond).map((h, i) => ({
    x: h.x + h.pond[0],
    n: h.n + h.pond[1],
    w: 0.13 + (i % 3) * 0.02,
    h: 0.085,
    turn: (i * 0.7) % 1.2,
  }));
  const spots = postSpots();
  const village = placeVillage(ponds, [...spots, { x: COMPASS_AT.x, n: COMPASS_AT.n }]);

  // the tile: fields on top, soil on the sides
  const w = (BOARD.x1 - BOARD.x0) * KM;
  const d = (BOARD.n1 - BOARD.n0) * KM;
  const soil = new THREE.MeshStandardMaterial({ name: 'Soil', color: '#9a7656', roughness: 1 });
  const fields = new THREE.MeshStandardMaterial({ name: 'Fields', map: groundTexture(renderer, HOMES, ponds), roughness: 1, metalness: 0 });
  const tile = new THREE.Mesh(new THREE.BoxGeometry(w, THICK, d), [soil, soil, fields, soil, soil, soil]);
  tile.name = 'Fields';
  tile.position.copy(toScene((BOARD.x0 + BOARD.x1) / 2, (BOARD.n0 + BOARD.n1) / 2, -THICK / 2));
  tile.receiveShadow = true;
  root.add(tile);

  const road = roadMesh();
  root.add(road);
  root.add(villageMeshes(village));

  const labels = createLabels();
  const { body, cap } = postMesh();
  const white = new THREE.MeshStandardMaterial({ name: 'PostWhite', color: '#f4f2ec', roughness: 0.8 });
  const yellow = new THREE.MeshStandardMaterial({ name: 'PostYellow', color: '#f2c230', roughness: 0.7 });
  const postGroup = new THREE.Group();
  postGroup.name = 'Kilometre posts';
  const letters = Object.fromEntries(Object.entries(STOPS).map(([k, v]) => [v, k]));
  for (const sp of spots) {
    const post = new THREE.Group();
    post.name = `Post ${sp.km} km`;
    post.position.copy(toScene(sp.x, sp.n, 0));
    const p = pointAt(sp.km);
    post.rotation.y = Math.atan2(sp.x - p.x, -(sp.n - p.y)); // the face looks at the road
    const b = new THREE.Mesh(body, white);
    const c = new THREE.Mesh(cap, yellow);
    b.castShadow = c.castShadow = true;
    post.add(b, c);
    post.userData.km = sp.km;
    postGroup.add(post);
    labels.add({ text: N(sp.km), letter: letters[sp.km] ?? null, road: toScene(p.x, p.y, ROAD_Y), side: toScene(sp.x, sp.n, ROAD_Y), km: sp.km });
  }
  root.add(postGroup);
  root.add(compass(labels, t));
  root.add(labels.group);

  // a generous invisible strip over the road: a tap anywhere on it sends the cyclist there
  const hitPos = [];
  const hitIdx = [];
  for (let i = 0; i < COUNT; i++) {
    hitPos.push(FRAME.cx[i] - FRAME.rx[i] * 110, ROAD_Y + 2, FRAME.cz[i] - FRAME.rz[i] * 110);
    hitPos.push(FRAME.cx[i] + FRAME.rx[i] * 110, ROAD_Y + 2, FRAME.cz[i] + FRAME.rz[i] * 110);
    if (i) hitIdx.push(2 * i - 2, 2 * i, 2 * i - 1, 2 * i - 1, 2 * i, 2 * i + 1);
  }
  const hitGeo = new THREE.BufferGeometry();
  hitGeo.setAttribute('position', new THREE.Float32BufferAttribute(hitPos, 3));
  hitGeo.setIndex(hitIdx);
  const roadHit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  roadHit.userData.noExport = true;
  roadHit.name = 'Road (tap target)';
  root.add(roadHit);

  return {
    root,
    labels,
    pickables: [roadHit, postGroup, labels.group],
    /** Scene box of everything that matters for framing (the tile's top face). */
    box: new THREE.Box3(toScene(BOARD.x0, BOARD.n1, 0), toScene(BOARD.x1, BOARD.n0, 60)),
  };
}
