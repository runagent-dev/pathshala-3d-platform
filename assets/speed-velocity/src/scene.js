// The setting of the ride: a calm sandy plain under a soft sky (no scenery), the winding road of চিত্র ২.০৪ with A
// and B, the straight road from A to B for the comparison, the blue trail of the road ridden (দূরত্ব) and a small
// compass on the ground. The road and its kilometres are to scale; the road is drawn wider than real.
// Scene units: metres. x = east, z = south (north is −z), y = up. A is at the origin.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { COUNT, ROAD } from './road.js';
import { B, lengthOf, pointOn } from './ride.js';

/** metres in a kilometre (the road data is in km, the scene in m) */
export const KM = 1000;
export const ROAD_W = 90; // m
export const ROAD_Y = 2; // m above the plain
/** The compass on the ground, km east and north of A: inside the bend of the road, clear of the road and of the সরণ. */
export const COMPASS_AT = { x: 1.0, y: 0.3 };

/** Scene point of a map point (x east, y north, in km). */
export const toScene = (x, y, h = 0, out = new THREE.Vector3()) => out.set(x * KM, h, -y * KM);

/** A small seeded random generator, so the plain looks the same every time. */
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** A canvas texture made once: the sky, a clear blue at the top to a warm haze at the horizon. */
export function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#6fa6d8');
  grad.addColorStop(0.55, '#a9cbe6');
  grad.addColorStop(1, '#efe0c4');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// the plain: PLAIN km square round the middle of the ride
const PLAIN = 9;
const MID = { x: 0.9, y: 0.6 };

/** The plain's texture: warm sand with soft patches and grain, and the road's dusty verge (1024 px, made once). */
function plainTexture(renderer) {
  const W = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = W;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const px = W / PLAIN; // px per km
  const P = (x, y) => [(x - MID.x + PLAIN / 2) * px, (MID.y + PLAIN / 2 - y) * px];
  g.fillStyle = '#d9c39b';
  g.fillRect(0, 0, W, W);
  const r = rand(11);
  // soft patches: a little darker and drier ground here and there
  for (let i = 0; i < 70; i++) {
    const x = r() * W;
    const y = r() * W;
    const rad = 20 + r() * 70;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    const tone = r() < 0.55 ? '150, 118, 72' : '240, 226, 196';
    grad.addColorStop(0, `rgba(${tone}, 0.16)`);
    grad.addColorStop(1, `rgba(${tone}, 0)`);
    g.fillStyle = grad;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // grain
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(110, 84, 50, 0.1)' : 'rgba(255, 248, 230, 0.14)';
    const sz = 1 + r() * 2;
    g.fillRect(r() * W, r() * W, sz, sz);
  }
  // the dusty verge along both roads and round A
  g.strokeStyle = '#e6d0a6';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.lineWidth = 0.17 * px;
  g.beginPath();
  for (let i = 0; i < COUNT; i++) g[i ? 'lineTo' : 'moveTo'](...P(ROAD[2 * i], ROAD[2 * i + 1]));
  g.stroke();
  g.beginPath();
  g.moveTo(...P(0, 0));
  g.lineTo(...P(B.x, B.y));
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

/**
 * Centre points and the unit vector to the right of a rider, every few metres along a map polyline (km): [[x, z, rx, rz], …]
 * in scene metres.
 */
function frames(points) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const fx = b.x - a.x;
    const fz = -(b.y - a.y);
    const len = Math.hypot(fx, fz) || 1;
    out.push([points[i].x * KM, -points[i].y * KM, -fz / len, fx / len]); // right = forward × up
  }
  return out;
}

const roadPoints = () => Array.from({ length: COUNT }, (_, i) => ({ x: ROAD[2 * i], y: ROAD[2 * i + 1] }));
/** Points every 25 m along a path from A to B (km). */
function pathPoints(path) {
  const len = lengthOf(path);
  const n = Math.round(len / 0.025);
  return Array.from({ length: n + 1 }, (_, i) => pointOn(path, (len * i) / n, { x: 0, y: 0 }));
}

/** A road surface: grey with light edges, along a map polyline. */
function roadGeometry(points) {
  const across = [-0.5, -0.4, -0.4, 0.4, 0.4, 0.5]; // fractions of the width: edge strip, surface, edge strip
  const edge = new THREE.Color('#e4dcc6');
  const surface = new THREE.Color('#7d828a');
  const pos = [];
  const col = [];
  const fr = frames(points);
  for (const [x, z, rx, rz] of fr)
    for (const [k, f] of across.entries()) {
      pos.push(x + rx * f * ROAD_W, ROAD_Y, z + rz * f * ROAD_W);
      const cc = k === 2 || k === 3 ? surface : edge;
      col.push(cc.r, cc.g, cc.b);
    }
  const idx = [];
  const n = across.length;
  for (let i = 0; i < fr.length - 1; i++)
    for (const k of [0, 2, 4]) {
      const a = i * n + k;
      idx.push(a, a + 1, a + n, a + 1, a + n + 1, a + n);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** A round paved place (A, B), in the road's grey with a light rim. */
function placeGeometry(x, z, radius) {
  const surface = new THREE.Color('#7d828a');
  const edge = new THREE.Color('#e4dcc6');
  const paint = (geo, c) => {
    geo.deleteAttribute('uv');
    const rgb = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < rgb.length; i += 3) c.toArray(rgb, i);
    geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
    return geo;
  };
  return [
    paint(new THREE.RingGeometry(radius, radius + 9, 40).rotateX(-Math.PI / 2).translate(x, ROAD_Y - 0.3, z), edge),
    paint(new THREE.CircleGeometry(radius, 40).rotateX(-Math.PI / 2).translate(x, ROAD_Y - 0.4, z), surface),
  ];
}

/**
 * The trail of the road ridden (দূরত্ব): a blue band on the road along a path from A to B, shown up to km with
 * show(km). One mesh per path.
 */
function createTrail(path, color) {
  const pts = pathPoints(path);
  const fr = frames(pts);
  const half = ROAD_W * 0.3;
  const pos = new Float32Array(fr.length * 2 * 3);
  fr.forEach(([x, z, rx, rz], i) => {
    pos.set([x - rx * half, ROAD_Y + 1.2, z - rz * half, x + rx * half, ROAD_Y + 1.2, z + rz * half], i * 6);
  });
  const idx = [];
  for (let i = 0; i < fr.length - 1; i++) {
    const a = 2 * i;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ name: 'Distance', color, toneMapped: false, side: THREE.DoubleSide }));
  mesh.name = `Trail (${path})`;
  mesh.renderOrder = 1;
  const len = lengthOf(path);
  const segs = fr.length - 1;
  return {
    mesh,
    /** Show the band from A to km along the path (in 25 m pieces: a few pixels on the screen). */
    show(km) {
      const pieces = Math.round(Math.min(Math.max(km / len, 0), 1) * segs);
      geo.setDrawRange(0, pieces * 6);
      mesh.visible = pieces > 0;
    },
  };
}

/** The compass on the ground: a flat dark arrow to the north on a light disc. */
function compassMesh() {
  const g = new THREE.Group();
  g.name = 'Compass';
  const at = toScene(COMPASS_AT.x, COMPASS_AT.y, ROAD_Y);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(150, 40).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'CompassDisc', color: '#f4ecdb', roughness: 0.9 }),
  );
  const shape = new THREE.Shape();
  shape.moveTo(0, 130);
  shape.lineTo(52, -95);
  shape.lineTo(0, -55);
  shape.lineTo(-52, -95);
  shape.closePath();
  const needle = new THREE.Mesh(
    new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'CompassNeedle', color: '#2b3138', roughness: 0.7 }),
  );
  needle.position.y = 0.6;
  g.add(disc, needle);
  g.position.copy(at);
  return { group: g, north: toScene(COMPASS_AT.x, COMPASS_AT.y + 0.14, ROAD_Y + 4) };
}

/**
 * Build it all. colors: { distance }. Returns { root, sky (texture or null), trails: { winding, straight },
 * straightRoad (shown for the comparison), points: { A, B, north } (scene points for labels) }.
 */
export function createScene({ renderer, colors, background = true }) {
  const root = new THREE.Group();
  root.name = 'Plain';

  const plain = new THREE.Mesh(
    new THREE.PlaneGeometry(PLAIN * KM, PLAIN * KM).rotateX(-Math.PI / 2).translate(MID.x * KM, 0, -MID.y * KM),
    new THREE.MeshStandardMaterial({ name: 'Sand', map: plainTexture(renderer), roughness: 1, metalness: 0 }),
  );
  plain.name = 'Ground';
  plain.receiveShadow = true;
  root.add(plain);

  const roadMat = new THREE.MeshStandardMaterial({ name: 'Road', vertexColors: true, roughness: 0.95, metalness: 0 });
  const winding = new THREE.Mesh(mergeGeometries([roadGeometry(roadPoints()), ...placeGeometry(0, 0, 70)]), roadMat);
  winding.name = 'Road (figure 2.04)';
  winding.receiveShadow = true;
  const b = toScene(B.x, B.y);
  const straight = new THREE.Mesh(
    mergeGeometries([roadGeometry(pathPoints('straight')), ...placeGeometry(0, 0, 70), ...placeGeometry(b.x, b.z, 70)]),
    roadMat,
  );
  straight.name = 'Straight road';
  straight.receiveShadow = true;
  straight.visible = false;
  root.add(winding, straight);

  const trails = { winding: createTrail('winding', colors.distance), straight: createTrail('straight', colors.distance) };
  root.add(trails.winding.mesh, trails.straight.mesh);

  // A and B: a white post with a dark cap on the edge of the road, so the letters have something to name
  const postMat = new THREE.MeshStandardMaterial({ name: 'Post', color: '#f7f5ef', roughness: 0.6 });
  const capMat = new THREE.MeshStandardMaterial({ name: 'PostCap', color: '#2b3138', roughness: 0.6 });
  const posts = [];
  for (const [x, z] of [
    [0, 0],
    [b.x, b.z],
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, 120, 12).translate(0, 60, 0), postMat);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 22, 12).translate(0, 128, 0), capMat);
    const g = new THREE.Group();
    g.add(post, cap);
    g.position.set(x - 80, ROAD_Y, z + 35);
    g.traverse((m) => (m.castShadow = true));
    posts.push(g);
    root.add(g);
  }

  const compass = compassMesh();
  root.add(compass.group);

  return {
    root,
    sky: background ? skyTexture() : null,
    trails,
    winding,
    straight,
    points: {
      A: posts[0].position.clone().setY(150),
      B: posts[1].position.clone().setY(150),
      north: compass.north,
    },
  };
}
