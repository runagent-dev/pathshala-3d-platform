// The landscape: a cycle race track over a smooth hill (the track follows heightAt from energy.js exactly), with
// red-and-white kerbs, white edge lines and a chequered start line; sandy run-off and orange clay around it, a row of
// advertising boards, grandstands with spectators and flags; violet hills far away and a few clouds.
// Metres; +x along the track, the camera looks from +z.
import * as THREE from 'three';
import { bake } from './bake.js';
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

  // ── the ground: one grid, coloured by vertex: a narrow sandy run-off beside the track, packed earth on the hill, orange clay further out
  const xs = samples(X0, X1, 0.5, 2.5, -HILL.half - 6, HILL.half + 6);
  const zs = samples(-70, 30, 0.6, 3, -10, 12);
  const pos = new Float32Array(xs.length * zs.length * 3);
  const col = new Float32Array(xs.length * zs.length * 3);
  const uv = new Float32Array(xs.length * zs.length * 2);
  const clayA = new THREE.Color('#d9692f');
  const clayB = new THREE.Color('#ee9a45');
  const sand = new THREE.Color('#f1d29a');
  const earth = new THREE.Color('#c45a2c');
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

  // ── behind the track (never in front of the rider): boards, flags, grandstands ──────────────────────────────────
  const stands = new THREE.Group();
  stands.name = 'Grandstands';

  // a row of advertising boards that follows the ground, in bright alternating colours (no words)
  const BOARD_Z = -6.5;
  const BOARD_H = 0.8;
  const boardColors = ['#1f6fd1', '#ffd23f', '#e8333a', '#ffffff', '#7a3fd1', '#ff8a1f'].map((h) => new THREE.Color(h));
  const boards = new THREE.Mesh(
    strip(
      -50,
      168,
      (x) => [groundAt(x, BOARD_Z) - 0.1, BOARD_Z, groundAt(x, BOARD_Z) + BOARD_H, BOARD_Z],
      (s) => boardColors[((Math.floor(s / 3) % 6) + 6) % 6],
      0.5,
    ),
    new THREE.MeshStandardMaterial({ name: 'Boards', vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }),
  );
  boards.name = 'Boards';
  stands.add(boards);
  const rail = new THREE.Mesh(
    strip(
      -50,
      168,
      (x) => [groundAt(x, BOARD_Z) + BOARD_H, BOARD_Z + 0.08, groundAt(x, BOARD_Z) + BOARD_H, BOARD_Z - 0.08],
      () => WHITE,
      0.5,
    ),
    new THREE.MeshStandardMaterial({ name: 'BoardTop', vertexColors: true, roughness: 0.5, side: THREE.DoubleSide }),
  );
  stands.add(rail);

  // flags on tall poles
  const poleMat = new THREE.MeshStandardMaterial({ name: 'Pole', color: '#e9edf2', metalness: 0.4, roughness: 0.4 });
  const flagMat = new THREE.MeshStandardMaterial({ name: 'Flags', vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });
  const flagColors = ['#e8333a', '#ffd23f', '#1f6fd1', '#18a058', '#ff8a1f', '#c23fd1'].map((h) => new THREE.Color(h));
  const flagGeos = [];
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.06, 6, 8);
  const flagGeo = new THREE.BufferGeometry();
  flagGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 0, -0.9, 0, 1.6, -0.3, 0.12, 0, -0.9, 0, 1.6, -0.6, 0.12, 1.6, -0.3, 0.12], 3),
  );
  flagGeo.computeVertexNormals();
  let f = 0;
  for (let x = -46; x <= 160; x += 9) {
    const z = -11 - 1.5 * hash(x, 3);
    const base = groundAt(x, z);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, base + 3, z);
    const fc = flagColors[f++ % flagColors.length];
    const flag = flagGeo.clone();
    flag.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: 6 }, () => [fc.r, fc.g, fc.b]).flat(), 3));
    flag.rotateY(0.15 * (hash(x, 9) - 0.5)).translate(x, base + 5.95, z);
    flagGeos.push(flag);
    stands.add(pole);
  }
  const flags = new THREE.Mesh(mergeFlat(flagGeos), flagMat);
  flags.name = 'Flags';
  stands.add(flags);

  // grandstands: stepped rows of coloured seats with spectators, a back wall and a roof on posts
  const concrete = new THREE.MeshStandardMaterial({ name: 'Concrete', color: '#c9ccd3', roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ name: 'Roof', color: '#e8333a', roughness: 0.6 });
  const seatColors = ['#1f6fd1', '#ffd23f', '#e8333a', '#18a8c9'];
  const seatMats = seatColors.map((color) => new THREE.MeshStandardMaterial({ name: 'Seats', color, roughness: 0.6 }));
  const shirts = ['#ffffff', '#e8333a', '#ffd23f', '#1f6fd1', '#ff8a1f', '#2b2b2b', '#c23fd1', '#18a058'].map((h) => new THREE.Color(h));
  const box = new THREE.BoxGeometry(1, 1, 1);
  // spectators are 20 m and more away: a few pixels each, so a lighter capsule and head look the same
  const person = new THREE.CapsuleGeometry(0.17, 0.32, 2, 8);
  const headGeo = new THREE.SphereGeometry(0.13, 10, 6);
  const crowdMat = new THREE.MeshStandardMaterial({ name: 'Spectators', roughness: 0.8 });
  const headMat = new THREE.MeshStandardMaterial({ name: 'Heads', roughness: 0.7 });
  const shirtsOf = (x, z) => shirts[Math.floor(hash(x, z) * shirts.length) % shirts.length];
  const skins = ['#8d5a3b', '#a8714a', '#6e432a', '#c08a60'].map((h) => new THREE.Color(h));
  const m = new THREE.Matrix4();
  const crowds = [];
  const ROWS = 7;
  const STEP_H = 0.5;
  const STEP_D = 0.85;
  const FRONT_Z = -21;
  for (const [cx, w] of [
    [-38, 18],
    [-6, 24],
    [26, 18],
    [56, 22],
    [90, 18],
    [124, 22],
    [156, 18],
  ]) {
    const stand = new THREE.Group();
    stand.position.set(cx, groundAt(cx, FRONT_Z) - 0.05, FRONT_Z);
    const placed = [];
    for (let r = 0; r < ROWS; r++) {
      const step = new THREE.Mesh(box, concrete);
      step.scale.set(w, STEP_H * (r + 1), STEP_D);
      step.position.set(0, (STEP_H * (r + 1)) / 2, -r * STEP_D - STEP_D / 2);
      const seats = new THREE.Mesh(box, seatMats[r % seatMats.length]);
      seats.scale.set(w - 0.2, 0.16, STEP_D * 0.45);
      seats.position.set(0, STEP_H * (r + 1) + 0.08, -r * STEP_D - STEP_D * 0.62);
      stand.add(step, seats);
      for (let px = -w / 2 + 0.4; px < w / 2 - 0.3; px += 0.55)
        if (hash(px + cx, r) < 0.62)
          placed.push([cx + px + 0.12 * (hash(px, r + cx) - 0.5), stand.position.y + STEP_H * (r + 1) + 0.38, FRONT_Z - r * STEP_D - STEP_D * 0.55]);
    }
    const depth = ROWS * STEP_D;
    const wall = new THREE.Mesh(box, concrete);
    wall.scale.set(w, STEP_H * ROWS + 2.6, 0.3);
    wall.position.set(0, (STEP_H * ROWS + 2.6) / 2, -depth - 0.15);
    const roof = new THREE.Mesh(box, roofMat);
    roof.scale.set(w + 1, 0.22, depth + 1.4);
    roof.position.set(0, STEP_H * ROWS + 2.6, -depth / 2 + 0.4);
    roof.rotation.x = -0.06;
    stand.add(wall, roof);
    for (const px of [-w / 2 + 0.3, 0, w / 2 - 0.3]) {
      const post = new THREE.Mesh(box, poleMat);
      post.scale.set(0.16, STEP_H * ROWS + 2.6, 0.16);
      post.position.set(px, (STEP_H * ROWS + 2.6) / 2, 0.3);
      stand.add(post);
    }
    stands.add(stand);
    const crowd = new THREE.InstancedMesh(person, crowdMat, placed.length);
    const heads = new THREE.InstancedMesh(headGeo, headMat, placed.length);
    for (const [k, [x, y, z]] of placed.entries()) {
      crowd.setMatrixAt(k, m.makeTranslation(x, y, z));
      crowd.setColorAt(k, shirtsOf(x, z));
      heads.setMatrixAt(k, m.makeTranslation(x, y + 0.4, z));
      heads.setColorAt(k, skins[Math.floor(hash(z, x) * skins.length) % skins.length]);
    }
    crowd.name = 'Spectators';
    heads.name = 'Heads';
    crowd.computeBoundingSphere();
    heads.computeBoundingSphere();
    crowds.push(crowd, heads);
  }
  // steps, seats, walls, roofs, posts and poles never move: one mesh per material for all seven stands
  bake(stands);
  stands.add(...crowds);

  root.add(stands);

  // ── far hills and clouds: soft, faded by the fog ─────────────────────────────────────────────────────────────────
  const far = new THREE.Group();
  far.name = 'FarHills';
  const farMat = new THREE.MeshStandardMaterial({ name: 'FarHill', color: '#8d7fd0', roughness: 1 });
  const dome = new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  for (const [x, z, r, h] of [
    [-70, -120, 60, 14],
    [10, -150, 80, 20],
    [90, -125, 65, 15],
    [170, -140, 70, 18],
  ]) {
    const hill = new THREE.Mesh(dome, farMat);
    hill.position.set(x, -0.5, z);
    hill.scale.set(r, h, r * 0.45);
    far.add(hill);
  }
  bake(far);
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
      const p = new THREE.Mesh(puff, cloudMat);
      p.position.set(px * s, py * s, pz * s);
      p.scale.set(r * s, r * s * 0.62, r * s * 0.7);
      cloud.add(p);
    }
    clouds.add(cloud);
  }
  bake(clouds);
  root.add(clouds);
  for (const g of [stands, far, clouds]) g.userData.noExport = true;

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
