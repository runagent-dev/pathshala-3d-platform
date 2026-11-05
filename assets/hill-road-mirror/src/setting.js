// The setting: one terrain mesh (a rocky hill inside the bend, the valley full of morning mist, far ridges), the road, its
// guard rail, and a soft sky. There are no textures bigger than the small tiled detail map: rock, soil and the road's paint
// are worked out per pixel, so they stay crisp at any zoom and on any screen, and the whole setting is five draw calls.
//
// The road's shader also draws two things that belong on the road: the soft shadows under the vehicles, and the strip of
// road the mirror shows (the field of view, traced exactly in reading.js), so neither needs geometry of its own.
import * as THREE from 'three';
import { BEND, MIRROR } from './reading.js';

const SUN = new THREE.Vector3(-0.74, 0.46, -0.12).normalize(); // a low morning sun over the valley: it rakes across the hill
const ROAD_END = 112; // metres of road on each arm
const HILL_TOP = 19; // about how high the hill rises above the road
const { r: R, half: H } = BEND;

// ── seeded noise (every student, and every test, sees the same hill) ────────────────────────────────────────────
const PERM = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = 20261106;
  for (let i = 255; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return Uint8Array.from([...p, ...p]);
})();
const GRADS = Float32Array.from({ length: 512 }, (_, i) => {
  const a = (PERM[i >> 1] / 256) * Math.PI * 2;
  return i & 1 ? Math.sin(a) : Math.cos(a);
});
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function noise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const g = (ix, iy, dx, dy) => {
    const h = PERM[(PERM[ix & 255] + iy) & 255] * 2;
    return GRADS[h] * dx + GRADS[h + 1] * dy;
  };
  const u = fade(fx);
  const v = fade(fy);
  const a = g(xi, yi, fx, fy);
  const b = g(xi + 1, yi, fx - 1, fy);
  const c = g(xi, yi + 1, fx, fy - 1);
  const d = g(xi + 1, yi + 1, fx - 1, fy - 1);
  const ab = a + (b - a) * u;
  return ab + (c + (d - c) * u - ab) * v;
}
function fbm(x, y, n) {
  let s = 0;
  let a = 0.5;
  for (let i = 0; i < n; i++) {
    s += a * noise(x, y);
    x = x * 2.03 + 17.1;
    y = y * 2.03 - 9.3;
    a *= 0.5;
  }
  return s;
}
function ridged(x, y, n) {
  let s = 0;
  let a = 0.5;
  let w = 1;
  for (let i = 0; i < n; i++) {
    const r = 1 - Math.abs(noise(x, y)) * 2.1;
    const v = r * r * w;
    s += a * v;
    w = Math.min(1, v * 1.7);
    x = x * 2.1 + 31.7;
    y = y * 2.1 - 13.3;
    a *= 0.52;
  }
  return s;
}
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ── the road in plan ───────────────────────────────────────────────────────────────────────────────────────────
/** Distance from the road's centre line, positive toward the hill. */
export function roadSide(x, z) {
  if (x < R && z < R) return R - Math.hypot(x - R, z - R);
  if (x >= R && z >= R) return Math.min(x, z);
  return x < R ? x : z;
}
/** A point of the centre line at the distance s along it (s = 0 at the middle of the bend), into out.x, out.z, with the
 * direction of travel toward +s into out.tx, out.tz. */
const ARC = (Math.PI * R) / 2;
function centre(s, out) {
  if (s <= -ARC / 2) {
    out.x = 0;
    out.z = R + (-s - ARC / 2);
    out.tx = 0;
    out.tz = -1;
  } else if (s >= ARC / 2) {
    out.x = R + (s - ARC / 2);
    out.z = 0;
    out.tx = 1;
    out.tz = 0;
  } else {
    const a = Math.PI + (s / ARC + 0.5) * (Math.PI / 2);
    out.x = R + R * Math.cos(a);
    out.z = R + R * Math.sin(a);
    out.tx = -Math.sin(a);
    out.tz = Math.cos(a);
  }
  return out;
}

/** The ground's height at x, z, m from the road's level. */
export function terrainHeight(x, z) {
  const d = roadSide(x, z);
  const far = Math.hypot(x, z);
  const beyond = Math.max(x, z); // the road runs into the next fold of the hills, out of sight
  let h;
  if (d >= 0) {
    const s = Math.max(0, d - H - 0.5);
    // the rock is cut steeper at the bend itself; along the two arms the slope stays gentler than the view from above,
    // so the hill hides the road from the drivers but not from the student
    const c = Math.hypot(x - 3.6, z - 3.6);
    const corner = Math.exp(-(c * c) / 90);
    const k = 0.52 + 0.75 * corner;
    const wx = x + 5 * fbm(x * 0.04, z * 0.04, 2);
    const wz = z + 5 * fbm(x * 0.04 + 8, z * 0.04 + 3, 2);
    const top = HILL_TOP * (0.86 + 0.5 * ridged(wx * 0.016 + 2, wz * 0.016 + 5, 3));
    h = top * (1 - Math.exp((-k * s) / top));
    // at the bend the road is cut into the rock: a low face right beside it, where no vehicle waits
    h += 2.6 * smooth(0, 1.7, s) * smooth(17, 9, Math.max(x, z));
    const rough = smooth(0.4, 6, s);
    // gullies running down the slope, and broken rock
    const gully = 1 - ridged(wx * 0.075 + 4, wz * 0.075 + 9, 3);
    h += rough * (3.4 * fbm(wx * 0.09, wz * 0.09, 3) - 3.2 * gully * smooth(2, 12, s) + 1.0 * fbm(wx * 0.3, wz * 0.3, 2));
  } else {
    const s = Math.max(0, -d - H - 0.9);
    // a narrow verge, a steep bank, then the valley
    h = -2.2 * s * smooth(0, 3, s) - 66 * (1 - Math.exp(-s / 42));
    h += smooth(6, 30, s) * 3.5 * fbm(x * 0.06 + 3, z * 0.06, 3);
  }
  // the far ridges, across the valley and behind the hill
  const ridge = smooth(170, 760, far);
  if (ridge > 0) h = h * (1 - ridge) + ridge * (14 + 200 * ridged(x * 0.0017 + 1, z * 0.0017 + 4, 4));
  // the hill's own folds close over the road where it ends
  const fold = smooth(ROAD_END - 18, ROAD_END + 6, beyond);
  if (fold > 0 && far < 400) h = Math.max(h, fold * 24 * (1 + fbm(x * 0.03, z * 0.03, 2)));
  const flat = d > -H - 0.5 && d < H + 0.5 && beyond < ROAD_END - 4;
  if (flat) return -0.12;
  // a level pad for the mirror's footing
  const m = Math.hypot(x - MIRROR.x, z - MIRROR.z);
  const pad = Math.exp(-(m * m) / 5);
  return h * (1 - pad) + -0.1 * pad;
}

// ── the terrain mesh ───────────────────────────────────────────────────────────────────────────────────────────
// a grid that is fine at the bend and opens out toward the ridges
function axis(lo, hi, near0, near1, step, cells) {
  const line = [];
  for (let x = near0; x <= near1 + 1e-6; x += step) line.push(x);
  const grow = (from, to) => {
    const out = [];
    const r = Math.abs(to - from);
    const k = Math.exp(Math.log(r / step + 1) / cells); // cells growing by k each
    let at = 0;
    let d = step;
    for (let i = 0; i < cells; i++) {
      at += d;
      d *= k;
      out.push(from + Math.sign(to - from) * (i === cells - 1 ? r : Math.min(at, r)));
    }
    return out;
  };
  return [...grow(near0, lo).reverse(), ...line, ...grow(near1, hi)];
}
function terrainGeometry(step = 1) {
  const X = axis(-2600, 2600, -34, 62, 1.8, 30).filter((_, i) => i % step === 0);
  const Z = axis(-2600, 2600, -34, 62, 1.8, 30).filter((_, i) => i % step === 0);
  const nx = X.length;
  const nz = Z.length;
  const pos = new Float32Array(nx * nz * 3);
  const side = new Float32Array(nx * nz);
  const broad = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const v = j * nx + i;
      pos[v * 3] = X[i];
      pos[v * 3 + 1] = terrainHeight(X[i], Z[j]);
      pos[v * 3 + 2] = Z[j];
      side[v] = roadSide(X[i], Z[j]);
      broad[v] = fbm(X[i] * 0.045 + 11, Z[j] * 0.045 + 4, 3);
    }
  const index = [];
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      index.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  g.setAttribute('aBroad', new THREE.BufferAttribute(broad, 1));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** The tiled detail map: a ridged rock height in blue, its slopes in red and green. */
function detailTexture(renderer) {
  const N = 256;
  const D = new Float32Array(N * N);
  const per = (x, y, f) => {
    const a = (x / N) * Math.PI * 2;
    const b = (y / N) * Math.PI * 2;
    return noise(Math.cos(a) * f + Math.cos(b) * f * 0.41 + 30, Math.sin(a) * f + Math.sin(b) * f * 0.41 + 30);
  };
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const r1 = 1 - Math.abs(per(x, y, 1.7)) * 2.2;
      const r2 = 1 - Math.abs(per(y, x, 3.9)) * 2.2;
      const r3 = 1 - Math.abs(per(x, y, 8.3)) * 2.2;
      D[y * N + x] = 0.55 * r1 * r1 + 0.3 * r2 * r2 * r1 + 0.15 * r3;
    }
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  const at = (x, y) => D[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const o = (y * N + x) * 4;
      img.data[o] = 128 + 255 * Math.max(-0.5, Math.min(0.5, (at(x - 1, y) - at(x + 1, y)) * 2.6));
      img.data[o + 1] = 128 + 255 * Math.max(-0.5, Math.min(0.5, (at(x, y - 1) - at(x, y + 1)) * 2.6));
      img.data[o + 2] = 255 * Math.min(1, D[y * N + x]);
      img.data[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

const MIST = 'vec3(0.40, 0.54, 0.68)';
const TERRAIN_VS = /* glsl */ `
  attribute float aSide; attribute float aBroad;
  varying vec3 vN; varying vec3 vP; varying float vSide; varying float vBroad;
  void main() {
    vN = normal; vP = position; vSide = aSide; vBroad = aBroad;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const TERRAIN_FS = /* glsl */ `
  uniform sampler2D detail; uniform vec3 uSun; uniform vec3 uCam;
  varying vec3 vN; varying vec3 vP; varying float vSide; varying float vBroad;
  void main() {
    vec3 n = normalize(vN);
    float dist = length(vP - uCam);
    // the detail is laid on from the side the slope faces; beyond about 300 m it would only shimmer
    vec3 w = pow(abs(n), vec3(4.0));
    w /= w.x + w.y + w.z;
    vec4 dx = texture2D(detail, vP.zy / 11.0);
    vec4 dy = texture2D(detail, vP.xz / 11.0);
    vec4 dz = texture2D(detail, vP.xy / 11.0);
    vec4 fx = texture2D(detail, vec2(vP.z * 0.8 - vP.y * 0.6, vP.z * 0.6 + vP.y * 0.8) / 2.9);
    vec4 fy = texture2D(detail, vec2(vP.x * 0.8 - vP.z * 0.6, vP.x * 0.6 + vP.z * 0.8) / 2.9);
    vec4 fz = texture2D(detail, vec2(vP.x * 0.8 - vP.y * 0.6, vP.x * 0.6 + vP.y * 0.8) / 2.9);
    float b = (dx.b * 0.62 + fx.b * 0.38) * w.x + (dy.b * 0.62 + fy.b * 0.38) * w.y + (dz.b * 0.62 + fz.b * 0.38) * w.z;
    vec3 tn = vec3(0.0, dx.r + fx.r * 0.7 - 0.85, dx.g + fx.g * 0.7 - 0.85) * w.x
      + vec3(dy.r + fy.r * 0.7 - 0.85, 0.0, dy.g + fy.g * 0.7 - 0.85) * w.y
      + vec3(dz.r + fz.r * 0.7 - 0.85, dz.g + fz.g * 0.7 - 0.85, 0.0) * w.z;
    float near = 1.0 - smoothstep(60.0, 300.0, dist);
    vec3 N = normalize(n + tn * 0.85 * near);
    // a broad pattern that does not repeat within the view, to break the tile
    float big = texture2D(detail, vP.xz / 47.0).b;
    float mid = texture2D(detail, vP.zx / 19.0).b;
    // warm rock in faint layers on the steep faces, red laterite, and low scrub in clumps where the slope lets it hold:
    // never a green setting
    float steep = 1.0 - smoothstep(0.62, 0.86, n.y);
    float layer = sin(vP.y * 3.4 + vBroad * 11.0 + mid * 4.0) * 0.5 + 0.5;
    vec3 rock = mix(vec3(0.150, 0.112, 0.088), vec3(0.300, 0.222, 0.160), b * 0.8 + mid * 0.3);
    rock = mix(rock, rock * (0.72 + 0.5 * layer), steep * near);
    rock = mix(rock, vec3(0.255, 0.112, 0.062) * (0.7 + 0.6 * b), smoothstep(0.42, 0.62, big + vBroad * 0.6) * 0.8);
    float hold = n.y + (mid - 0.5) * 0.5 + vBroad * 0.3;
    float clump = smoothstep(0.42, 0.56, fy.b * 0.6 + mid * 0.5 + (big - 0.5) * 0.5);
    float scrub = smoothstep(0.7, 0.86, hold) * clump;
    vec3 leaf = mix(vec3(0.060, 0.082, 0.042), vec3(0.150, 0.150, 0.062), b);
    vec3 a = mix(rock, leaf, scrub * 0.92);
    // gravel and dust along the road
    float verge = 1.0 - smoothstep(0.3, 2.2, abs(vSide) - ${(H + 0.2).toFixed(2)} + (b - 0.5) * 1.6);
    a = mix(a, vec3(0.270, 0.232, 0.195) * (0.75 + 0.5 * b), verge);
    float sun = max(dot(N, uSun), 0.0);
    float sky = 0.5 + 0.5 * N.y;
    vec3 c = a * (vec3(0.52, 0.60, 0.74) * (0.40 + 0.8 * sky) + vec3(1.0, 0.90, 0.74) * 2.1 * sun);
    // the mist lies in the valley in soft banks and thins upward; the far ridges fade into it
    float air = 1.0 - exp(-max(0.0, dist - 110.0) * 0.0011);
    float bank = 0.5 + 0.28 * sin(vP.x * 0.021 + 2.0 * sin(vP.z * 0.017)) + 0.22 * sin(vP.z * 0.029 + 2.0 * sin(vP.x * 0.013));
    float low = smoothstep(-7.0 - 20.0 * bank, -44.0, vP.y);
    c = mix(c, ${MIST} * (0.88 + 0.24 * bank), max(air, low));
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

const ROAD_VS = /* glsl */ `
  varying vec2 vRoad; varying vec3 vP;
  void main() {
    vRoad = uv; vP = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
// uv: x across the road in metres (0 at the centre line), y along it in metres
const ROAD_FS = /* glsl */ `
  uniform sampler2D detail; uniform vec3 uCam;
  uniform vec4 uFanA; uniform vec4 uFanB; uniform float uFan; // two edges of the field: from.xz, dir.xz
  uniform vec2 uFanN; uniform vec2 uFanO;
  uniform vec4 uShade[3]; uniform vec2 uTurn[3]; // the soft shadows: centre.xz, half length, half width; heading
  varying vec2 vRoad; varying vec3 vP;
  float band(float x, float a, float b, float e) { return smoothstep(a - e, a + e, x) * (1.0 - smoothstep(b - e, b + e, x)); }
  float sideOf(vec4 e) { return e.z * (vP.z - e.y) - e.w * (vP.x - e.x); }
  void main() {
    vec2 q = vRoad;
    float ax = fwidth(q.x) * 0.8 + 0.002;
    float ay = fwidth(q.y) * 0.8 + 0.002;
    vec4 d1 = texture2D(detail, vP.xz / 3.1);
    vec4 d2 = texture2D(detail, vec2(vP.x * 0.8 - vP.z * 0.6, vP.x * 0.6 + vP.z * 0.8) / 0.83);
    float g = d1.b * 0.55 + d2.b * 0.45;
    // asphalt, worn paler where the wheels run
    float wheel = exp(-pow((abs(q.x) - 1.6) / 0.85, 2.0));
    vec3 c = mix(vec3(0.060, 0.061, 0.065), vec3(0.094, 0.093, 0.096), g * 0.8 + wheel * 0.25);
    // long-worn, a little uneven
    c *= 0.94 + 0.14 * texture2D(detail, vP.xz / 23.0).b;
    // the paint: white edge lines and a dashed centre line
    float edge = band(abs(q.x), ${(H - 0.28).toFixed(2)}, ${(H - 0.14).toFixed(2)}, ax);
    float dash = band(fract(q.y / 6.0), 0.0, 0.5, ay / 6.0) * band(abs(q.x), -1.0, 0.075, ax);
    float paint = max(edge, dash) * (0.74 + 0.3 * g);
    c = mix(c, vec3(0.74, 0.73, 0.68), paint);
    // soft shadows under the vehicles
    float sh = 0.0;
    for (int i = 0; i < 3; i++) {
      vec2 p = vP.xz - uShade[i].xy;
      vec2 u = vec2(p.x * uTurn[i].x + p.y * uTurn[i].y, p.y * uTurn[i].x - p.x * uTurn[i].y);
      vec2 e = abs(u) - uShade[i].zw;
      float box = (1.0 - smoothstep(-0.34, 0.38, e.x)) * (1.0 - smoothstep(-0.34, 0.38, e.y));
      sh = max(sh, box);
    }
    c *= 1.0 - 0.66 * sh;
    // the strip of road the mirror shows: traced exactly
    if (uFan > 0.001) {
      float sa = sideOf(uFanA);
      float sb = sideOf(uFanB);
      float front = dot(vP.xz - uFanO, uFanN);
      float aa = fwidth(sa) + fwidth(sb) + 0.004;
      float inside = smoothstep(-aa, aa, sa) * smoothstep(-aa, aa, -sb) * smoothstep(0.0, 0.3, front);
      float rim = (1.0 - smoothstep(0.03, 0.08 + aa, abs(sa))) + (1.0 - smoothstep(0.03, 0.08 + aa, abs(sb)));
      rim *= smoothstep(0.0, 0.3, front);
      c = mix(c, vec3(1.0, 0.56, 0.05), inside * 0.3 * uFan);
      c = mix(c, vec3(1.0, 0.72, 0.16), min(1.0, rim) * uFan * 0.95);
    }
    float dist = length(vP - uCam);
    c = mix(c, ${MIST}, 1.0 - exp(-max(0.0, dist - 90.0) * 0.0013));
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/** A ribbon along the road: one row of vertices every metre or so, finer on the bend. */
function roadStations() {
  const out = [];
  const ARC_HALF = ARC / 2;
  const add = (s) => out.push(s);
  for (let s = -ROAD_END; s < -ARC_HALF - 0.01; s += 18) add(s);
  for (let i = 0; i <= 28; i++) add(-ARC_HALF + (ARC * i) / 28);
  for (let s = ARC_HALF + 18; s <= ROAD_END; s += 18) add(s);
  return out;
}
function roadGeometry() {
  const st = roadStations();
  const across = [-H, H];
  const pos = [];
  const uv = [];
  const index = [];
  const c = { x: 0, z: 0, tx: 0, tz: 0 };
  st.forEach((s, i) => {
    centre(s, c);
    for (const a of across) {
      // +a is toward the hill: to the right of the way +s runs
      pos.push(c.x - c.tz * a, 0, c.z + c.tx * a);
      uv.push(a, s);
    }
    if (i) {
      const k = (i - 1) * 2;
      index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeBoundingSphere();
  return g;
}

/** The W-beam of the guard rail, a ribbon along the valley's edge. */
function railGeometry() {
  const off = -(H + 0.42);
  const prof = [
    [-0.03, 0.56],
    [0.03, 0.61],
    [-0.015, 0.66],
    [0.03, 0.71],
    [-0.03, 0.76],
  ];
  const st = roadStations();
  const pos = [];
  const index = [];
  const c = { x: 0, z: 0, tx: 0, tz: 0 };
  st.forEach((s, i) => {
    centre(s, c);
    for (const [u, y] of prof) {
      const a = off + u;
      pos.push(c.x - c.tz * a, y, c.z + c.tx * a);
    }
    if (i) {
      const n = prof.length;
      const k = (i - 1) * n;
      for (let j = 0; j < n - 1; j++) index.push(k + j, k + j + 1, k + j + n, k + j + 1, k + j + n + 1, k + j + n);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#3f86cf');
  gr.addColorStop(0.5, '#79b3e4');
  gr.addColorStop(0.82, '#b7d6ea');
  gr.addColorStop(1, '#dfe6e4');
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#b4c6d4';
  g.fillRect(0, 128, 512, 128);
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < 22; i++) {
    const h = rnd();
    const y = 128 - 5 - h * h * 78;
    const x = rnd() * 512;
    const w = 14 + (1 - h) * 50 + rnd() * 22;
    const a = 0.12 + rnd() * 0.22;
    for (const ox of [0, -512, 512]) {
      g.save();
      g.translate(x + ox, y);
      g.scale(1, 0.1 + 0.08 * h);
      const r = g.createRadialGradient(0, 0, 0, 0, 0, w);
      r.addColorStop(0, `rgba(255,255,255,${a})`);
      r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r;
      g.fillRect(-w, -w, 2 * w, 2 * w);
      g.restore();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** @param {{ stage: any }} o */
export function createSetting({ stage }) {
  const { scene, renderer } = stage;
  const root = new THREE.Group();
  root.name = 'setting';
  const detail = detailTexture(renderer);
  const uCam = { value: new THREE.Vector3() };
  const uSun = { value: SUN };

  const ground = new THREE.Mesh(
    terrainGeometry(),
    new THREE.ShaderMaterial({ vertexShader: TERRAIN_VS, fragmentShader: TERRAIN_FS, uniforms: { detail: { value: detail }, uSun, uCam } }),
  );
  ground.frustumCulled = false;
  ground.userData.noExport = true;

  const road = {
    uFanA: { value: new THREE.Vector4() },
    uFanB: { value: new THREE.Vector4() },
    uFan: { value: 0 },
    uFanN: { value: new THREE.Vector2() },
    uFanO: { value: new THREE.Vector2() },
    uShade: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
    uTurn: { value: [new THREE.Vector2(1, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 0)] },
  };
  const roadMesh = new THREE.Mesh(
    roadGeometry(),
    new THREE.ShaderMaterial({
      vertexShader: ROAD_VS,
      fragmentShader: ROAD_FS,
      uniforms: { detail: { value: detail }, uCam, ...road },
    }),
  );
  roadMesh.userData.noExport = true;

  const steel = new THREE.MeshStandardMaterial({ color: '#b8bec4', metalness: 0.75, roughness: 0.42, side: THREE.DoubleSide });
  const rail = new THREE.Mesh(railGeometry(), steel);
  rail.name = 'guard-rail';

  // the posts: one instanced mesh, a post every 2.5 m along the rail
  const c = { x: 0, z: 0, tx: 0, tz: 0 };
  const postGeo = new THREE.BoxGeometry(0.09, 0.82, 0.13);
  postGeo.translate(0, 0.41, 0);
  const count = Math.floor((ROAD_END * 2) / 2.5);
  const posts = new THREE.InstancedMesh(postGeo, new THREE.MeshStandardMaterial({ color: '#7f868c', metalness: 0.6, roughness: 0.5 }), count);
  posts.name = 'guard-rail-posts';
  const m = new THREE.Matrix4();
  const a = -(H + 0.5);
  const yAxis = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  for (let i = 0; i < count; i++) {
    centre(-ROAD_END + i * 2.5 + 1, c);
    q.setFromAxisAngle(yAxis, Math.atan2(-c.tz, c.tx));
    m.compose(new THREE.Vector3(c.x - c.tz * a, -0.1, c.z + c.tx * a), q, new THREE.Vector3(1, 1, 1));
    posts.setMatrixAt(i, m);
  }
  posts.frustumCulled = false;

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(5200, 24, 12),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  sky.userData.noExport = true;

  root.add(sky, ground, roadMesh, rail, posts);
  scene.add(root);

  return {
    root,
    /** Call before a view is drawn: the mist is measured from its camera. */
    setViewer(camera) {
      uCam.value.setFromMatrixPosition(camera.matrixWorld);
    },
    /** The strip of road the mirror shows. strength 0 hides it. field: from reading.js fieldOfView (a must be left of b). */
    setField(field, strength) {
      road.uFan.value = strength;
      if (!field) return;
      const { a, b } = field;
      road.uFanA.value.set(a.from.x, a.from.z, a.dir.x, a.dir.z);
      road.uFanB.value.set(b.from.x, b.from.z, b.dir.x, b.dir.z);
      road.uFanO.value.set(MIRROR.x, MIRROR.z);
      road.uFanN.value.set(Math.SQRT1_2, Math.SQRT1_2);
    },
    /** The vehicles' shadows: { x, z, length, width, heading } (radians, 0 along +x). */
    setShadow(i, x, z, length, width, heading) {
      road.uShade.value[i].set(x, z, length / 2, width / 2);
      road.uTurn.value[i].set(Math.cos(heading), Math.sin(heading));
    },
    /** A light model of the ground for the GLB, coloured at its vertices. */
    exportModel() {
      const g = new THREE.Group();
      g.name = 'bend-setting';
      const geo = terrainGeometry(3);
      const p = geo.attributes.position;
      const col = new Float32Array(p.count * 3);
      const pale = new THREE.Color('#9fb6c8');
      const rock = new THREE.Color('#7a5238');
      const k = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        k.copy(rock).lerp(pale, smooth(-12, -60, p.getY(i)));
        col[i * 3] = k.r;
        col[i * 3 + 1] = k.g;
        col[i * 3 + 2] = k.b;
      }
      geo.deleteAttribute('aSide');
      geo.deleteAttribute('aBroad');
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
      land.name = 'terrain';
      const asphalt = new THREE.Mesh(roadGeometry(), new THREE.MeshStandardMaterial({ color: '#3b3c40', roughness: 0.9 }));
      asphalt.name = 'road';
      asphalt.geometry.deleteAttribute('uv');
      asphalt.geometry.computeVertexNormals();
      g.add(land, asphalt, rail.clone());
      return g;
    },
  };
}
