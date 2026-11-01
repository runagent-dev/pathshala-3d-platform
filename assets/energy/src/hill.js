// The landscape: a cycle race track over a smooth hill (the track follows heightAt from energy.js exactly), with
// red-and-white kerbs, white edge lines and a chequered start line, on soft warm sand under the sky: nothing else, so
// the bicycle on the hill is the one thing to look at.
// Metres; +x along the track, the camera looks from +z.
import * as THREE from 'three';
import { HILL, heightAt, START_X } from './energy.js';

const TRACK_HALF = 2; // m: half the asphalt's width (the rider rides in the middle, z = 0)
const KERB = 0.32; // m: width of the kerbs on each side
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

/** How much of the hill's height there is at a distance z from the track (full across the track, down to 0 away from it). */
const EDGE = TRACK_HALF + KERB + 0.2;
const ridge = (z) => (z >= 0 ? 1 - smooth(EDGE, EDGE + 6, z) : 1 - smooth(-EDGE, -EDGE - 10, z));
/** The ground's height anywhere (the track at |z| ≤ TRACK_HALF is exactly heightAt). */
export const groundAt = (x, z) =>
  heightAt(x) * ridge(z) + (Math.abs(z) > 5 ? 0.25 * (noise(x * 0.08, z * 0.08) - 0.5) * smooth(5, 14, Math.abs(z)) : 0);

/**
 * Grain for the ground and the asphalt: fine specks of grit and a few small pebbles, light and dark around white, so
 * it only shades the vertex colours (made once, 512 px, repeated every few metres). Null outside a browser.
 */
let grain = null;
function grainTexture() {
  if (grain || typeof document === 'undefined') return grain;
  const N = 512;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = 'rgb(244,244,244)';
  g.fillRect(0, 0, N, N);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  // soft blotches, then grit, then pebbles with a lit top and a dark rim (tiles seamlessly: drawn wrapped)
  const dot = (x, y, r, fill) => {
    g.fillStyle = fill;
    g.beginPath();
    // the copies across an edge only where the dot reaches it
    for (const dx of x < r ? [0, N] : x > N - r ? [0, -N] : [0])
      for (const dy of y < r ? [0, N] : y > N - r ? [0, -N] : [0]) {
        g.moveTo(x + dx + r, y + dy);
        g.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      }
    g.fill();
  };
  for (let i = 0; i < 70; i++) dot(rnd() * N, rnd() * N, 18 + rnd() * 40, `rgba(${rnd() < 0.5 ? '205,205,205' : '255,255,255'},0.18)`);
  for (let i = 0; i < 9000; i++) {
    const v = rnd() < 0.55 ? 150 + rnd() * 60 : 255;
    dot(rnd() * N, rnd() * N, 0.6 + rnd() * 1.1, `rgba(${v},${v},${v},0.55)`);
  }
  for (let i = 0; i < 160; i++) {
    const x = rnd() * N;
    const y = rnd() * N;
    const r = 2 + rnd() * 3.2;
    dot(x, y + 0.8, r + 0.8, 'rgba(120,120,120,0.55)');
    dot(x, y, r, `rgb(${(232 + rnd() * 23) | 0},${(228 + rnd() * 22) | 0},${(222 + rnd() * 20) | 0})`);
    dot(x - r * 0.3, y - r * 0.3, r * 0.4, 'rgba(255,255,255,0.7)');
  }
  grain = new THREE.CanvasTexture(c);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.colorSpace = THREE.NoColorSpace; // a shade, not a colour: 244/255 ≈ 0.96
  grain.anisotropy = 4;
  return grain;
}

/** Sample positions: dense near the road and the hill, sparse far away. */
function samples(a, b, fine, coarse, from, to) {
  const out = [];
  for (let x = a; x < b; x += x >= from && x < to ? fine : coarse) out.push(x);
  out.push(b);
  return out;
}

/** Length along the track from x = 0 (for kerb blocks and boards that keep their length on the slopes). */
function arcLength(x) {
  const n = Math.max(4, Math.ceil(Math.abs(x) / 0.25));
  const dx = x / n;
  let s = 0;
  for (let k = 0; k < n; k++) s += Math.hypot(dx, heightAt((k + 1) * dx) - heightAt(k * dx));
  return s;
}

/**
 * Flat-coloured quads between two lines that follow the track, one quad per step in x, so colours change sharply
 * (kerb blocks, lines, boards). `edge(x)` gives [ya, za, yb, zb] for the quad's two long sides; `colorAt(s)` returns a
 * colour for the quad whose middle is s metres along the track, or null to leave a gap.
 */
function strip(a, b, edge, colorAt, step = 0.25) {
  const pos = [];
  const col = [];
  const xs = [];
  for (let x = a; x < b - 1e-6; x += step) xs.push(x);
  xs.push(b);
  let s = arcLength(a);
  for (let k = 0; k < xs.length - 1; k++) {
    const x0 = xs[k];
    const x1 = xs[k + 1];
    const ds = Math.hypot(x1 - x0, heightAt(x1) - heightAt(x0));
    const c = colorAt(s + ds / 2);
    s += ds;
    if (!c) continue;
    const [ya0, za0, yb0, zb0] = edge(x0);
    const [ya1, za1, yb1, zb1] = edge(x1);
    pos.push(x0, ya0, za0, x0, yb0, zb0, x1, ya1, za1, x1, ya1, za1, x0, yb0, zb0, x1, yb1, zb1);
    for (let v = 0; v < 6; v++) col.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

export function createLandscape() {
  const root = new THREE.Group();
  root.name = 'Landscape';

  // ── the ground: one grid, coloured by vertex: a narrow sandy run-off beside the track, packed earth on the hill, soft warm sand further out
  const xs = samples(X0, X1, 0.5, 2.5, -HILL.half - 6, HILL.half + 6);
  const zs = samples(-70, 30, 0.6, 3, -10, 12);
  const pos = new Float32Array(xs.length * zs.length * 3);
  const col = new Float32Array(xs.length * zs.length * 3);
  const uv = new Float32Array(xs.length * zs.length * 2);
  const clayA = new THREE.Color('#c9a27e');
  const clayB = new THREE.Color('#d6b590');
  const sand = new THREE.Color('#e6d3b3');
  const earth = new THREE.Color('#b08462');
  const c = new THREE.Color();
  let i = 0;
  for (const z of zs)
    for (const x of xs) {
      const y = groundAt(x, z);
      pos.set([x, y, z], i * 3);
      uv.set([x / 3, z / 3], i * 2);
      const n = noise(x * 0.3, z * 0.3) * 0.6 + noise(x * 1.6, z * 1.6) * 0.4;
      c.copy(clayA).lerp(clayB, n);
      // the hill's flanks: packed earth, a little redder and darker, with ruts and streaks running along the track
      const mound = smooth(0.2, 1.2, y);
      if (mound > 0) {
        c.lerp(earth, 0.55 * mound);
        const streak = noise(x * 0.18, z * 1.7) * 0.7 + noise(x * 0.5, z * 4.1) * 0.3;
        c.offsetHSL(0, -0.04 * mound, -0.1 * mound * smooth(0.35, 0.8, streak));
      }
      c.lerp(sand, 1 - smooth(EDGE + 0.4, EDGE + 2.2, Math.abs(z)));
      c.offsetHSL(0, 0, 0.05 * (noise(x * 3.1, z * 3.1) - 0.5));
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
  groundGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  groundGeo.setIndex(index);
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ name: 'Ground', vertexColors: true, map: grainTexture(), roughness: 1, metalness: 0 }),
  );
  ground.name = 'HillGround';
  ground.receiveShadow = true;
  root.add(ground);

  // ── the race track: asphalt, kerbs, edge lines, start line ──────────────────────────────────────────────────────
  const road = createTrack(-45, 165);
  root.add(road);

  // nothing else: no stands, crowds, flags, boards, far hills or clouds (the owner: only the main object, big)

  // for the GLB: only the hill and a little track at each foot (the long track is for the view)
  const hillRoad = () => createTrack(-HILL.half - 4, HILL.half + 4);
  return { root, road, ground, hillRoad };
}

const WHITE = new THREE.Color('#ffffff');
const RED = new THREE.Color('#e3262e');
const BLACK = new THREE.Color('#1c1c1f');

/** The race track as one group (it goes into the GLB with the rider): asphalt, kerbs, edge lines and the start line. */
function createTrack(a, b) {
  const track = new THREE.Group();
  track.name = 'RaceTrack';

  // asphalt: a strip across the track, a little darker in the wheel line, with soft edges tucked under the ground
  const xs = samples(a, b, 0.25, 1.5, -HILL.half - 4, HILL.half + 4);
  const zs = [-EDGE - 0.15, -TRACK_HALF, -1.2, -0.3, 0, 0.3, 1.2, TRACK_HALF, EDGE + 0.15];
  const pos = [];
  const col = [];
  const uvs = [];
  const asphalt = new THREE.Color('#4a4e57');
  const worn = new THREE.Color('#3c4048');
  const c = new THREE.Color();
  for (const z of zs)
    for (const x of xs) {
      const edge = Math.abs(z) > TRACK_HALF;
      pos.push(x, heightAt(x) + (edge ? -0.04 : 0.012), z);
      uvs.push(x / 1.6, z / 1.6);
      c.copy(Math.abs(z) < 0.31 ? worn : asphalt);
      c.offsetHSL(0, 0, 0.04 * (noise(x * 2.3, z * 5) - 0.5));
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
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const surface = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      name: 'Asphalt',
      vertexColors: true,
      map: grainTexture(),
      roughness: 0.95,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  surface.name = 'Asphalt';
  surface.receiveShadow = true;
  track.add(surface);

  // markings sit a few millimetres above the asphalt
  const mark = new THREE.MeshStandardMaterial({
    name: 'TrackMarkings',
    vertexColors: true,
    roughness: 0.7,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  // each mark is given as (outer z, inner z) or (larger, smaller); the quad starts at the smaller z so it faces up
  const flat = (z0, z1, lift) => (x) => [heightAt(x) + lift, z1, heightAt(x) + lift, z0];
  const parts = [
    // red-and-white kerbs, 1 m blocks, on both sides
    strip(a, b, flat(TRACK_HALF + KERB, TRACK_HALF, 0.03), (s) => (Math.floor(s) % 2 ? RED : WHITE)),
    strip(a, b, flat(-TRACK_HALF, -TRACK_HALF - KERB, 0.03), (s) => (Math.floor(s) % 2 ? RED : WHITE)),
    // white edge lines just inside the kerbs
    strip(a, b, flat(TRACK_HALF - 0.12, TRACK_HALF - 0.22, 0.016), () => WHITE),
    strip(a, b, flat(-TRACK_HALF + 0.22, -TRACK_HALF + 0.12, 0.016), () => WHITE),
  ];
  // the chequered start line, two rows of squares, just behind the rider's back wheel
  const sx = START_X - 1.3;
  const SQ = 0.25;
  for (let row = 0; row < 2; row++) {
    const x0 = sx + row * SQ;
    if (x0 < a || x0 + SQ > b) continue;
    for (let z = -TRACK_HALF; z < TRACK_HALF - 1e-6; z += SQ) {
      const k = Math.round((z + TRACK_HALF) / SQ);
      parts.push(strip(x0, x0 + SQ, flat(z + SQ, z, 0.018), () => ((k + row) % 2 ? BLACK : WHITE), SQ));
    }
  }
  const geoMarks = mergeFlat(parts);
  const marks = new THREE.Mesh(geoMarks, mark);
  marks.name = 'Markings';
  marks.receiveShadow = true;
  track.add(marks);
  return track;
}

/** Joins non-indexed geometries with position, normal and color into one. */
function mergeFlat(geos) {
  const geo = new THREE.BufferGeometry();
  const total = geos.reduce((n, g) => n + g.attributes.position.array.length, 0);
  for (const key of ['position', 'normal', 'color']) {
    const arr = new Float32Array(total);
    let at = 0;
    for (const g of geos) {
      arr.set(g.attributes[key].array, at);
      at += g.attributes[key].array.length;
    }
    geo.setAttribute(key, new THREE.BufferAttribute(arr, 3));
  }
  return geo;
}
