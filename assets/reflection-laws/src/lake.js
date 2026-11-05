// The setting: one terrain mesh (a snow mountain and the hills round a lake), a sky, and the water.
//
// The water is exact. A second, mirrored copy of the terrain and the sky is drawn from the student's own camera into
// a texture (only when the camera moves), so on flat water each pixel shows precisely what a mirror in the plane
// y = 0 shows. On wavy water the reflected ray is worked out from the true normal of the waves (the same eight waves
// as reading.js) and followed out to the scenery, so the image breaks up the way a real one does: long vertical
// streaks, because a tilt of the water turns the reflected ray by twice the tilt. How much is reflected is the exact
// Fresnel formula for n = 1.33.
//
// The mountain stays crisp at any size because its snow and its rock relief are worked out per pixel from a small
// tiled detail map, not painted into one big texture: the painted ground only holds the broad colours.
import * as THREE from 'three';
import { N_WATER, WAVES } from './reading.js';

// the morning sun, from the left and in front of the mountain; it stays put, so the terrain is drawn once for each view
const SUN = new THREE.Vector3(-0.62, 0.5, 0.6).normalize();
const SHORE = 1460; // about how far the far shore is from O
const MASSIF = { x: -1560, z: -3050 }; // the mountain

// ── seeded noise (so every student, and every test, sees the same mountain) ─────────────────────────────────────
const PERM = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = 20261105;
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
/** Gradient noise, about −0.7 … 0.7. */
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
/** Sharp ridges: 0 … about 1. */
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

/** The far shore, as a distance from O for each direction: a lake with a gently wandering edge. */
function shoreAt(a) {
  return SHORE + 150 * Math.sin(a * 2 + 0.7) + 90 * Math.sin(a * 3.4 + 2) + 46 * Math.sin(a * 7.3 + 1);
}
/** The ground's height at x, z (below 0 under the lake). */
export function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  const a = Math.atan2(z, x);
  const past = r - shoreAt(a); // metres past the shore
  // the warp makes the ridges wander instead of following a grid
  const wx = x + 180 * fbm(x * 0.0011, z * 0.0011, 3);
  const wz = z + 180 * fbm(x * 0.0011 + 40, z * 0.0011 + 11, 3);
  const dx = (wx - MASSIF.x) / 1000;
  const dz = (wz - MASSIF.z) / 760;
  const m = Math.exp(-(dx * dx + dz * dz) * 1.25); // the mountain's mass
  const ridges = ridged(wx * 0.00105 + 3.1, wz * 0.00105 + 7.7, 7);
  const massif = m * (78 + 345 * m * (0.42 + 0.78 * ridges));
  const hills = (24 + 150 * Math.max(0, ridged(wx * 0.0011 + 9, wz * 0.0011 + 2, 4))) * smooth(120, 1300, past);
  const land = smooth(0, 420, past) * (massif * smooth(-20, 600, past) + hills) + 6 + 0.012 * past + 6 * fbm(x * 0.012, z * 0.012, 2);
  return past > 0 ? land : -Math.min(30, 2 - past * 0.04);
}

// ── the terrain mesh ────────────────────────────────────────────────────────────────────────────────────────────
const GRID = { w: 300, h: 190 };
const warp = (s, c, lo, hi, b) => {
  const t = 2 * s - 1;
  const k = Math.sinh(b * t) / Math.sinh(b);
  return c + k * (t < 0 ? c - lo : hi - c);
};
const gridX = (s) => warp(s, MASSIF.x, -6000, 6000, 1.9);
const gridZ = (t) => warp(t, -2200, -6000, 2600, 1.5);

/** Heights on the grid, with vertices closer together on the mountain. */
function buildHeights() {
  const { w, h } = GRID;
  const H = new Float32Array((w + 1) * (h + 1));
  const X = new Float32Array(w + 1);
  const Z = new Float32Array(h + 1);
  for (let i = 0; i <= w; i++) X[i] = gridX(i / w);
  for (let j = 0; j <= h; j++) Z[j] = gridZ(j / h);
  for (let j = 0; j <= h; j++) for (let i = 0; i <= w; i++) H[j * (w + 1) + i] = terrainHeight(X[i], Z[j]);
  return { H, X, Z };
}
function terrainGeometry({ H, X, Z }, step = 1) {
  const { w, h } = GRID;
  const nx = Math.floor(w / step);
  const nz = Math.floor(h / step);
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
  const uv = new Float32Array((nx + 1) * (nz + 1) * 2);
  const at = (i, j) => H[j * (w + 1) + i];
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const v = j * (nx + 1) + i;
      pos[v * 3] = X[i * step];
      pos[v * 3 + 1] = at(i * step, j * step);
      pos[v * 3 + 2] = Z[j * step];
      uv[v * 2] = (i * step) / w;
      uv[v * 2 + 1] = 1 - (j * step) / h;
    }
  const index = [];
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const c = a + nx + 1;
      const d = c + 1;
      // what lies wholly under the lake is never seen
      if (Math.max(pos[a * 3 + 1], pos[b * 3 + 1], pos[c * 3 + 1], pos[d * 3 + 1]) < -0.5) continue;
      index.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** The painted ground, broad colours only: rock, dark forest, golden meadow. Snow and fine relief come per pixel. */
function terrainTexture({ H, X, Z }) {
  const W = 512;
  const T = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = T;
  const g = c.getContext('2d');
  const img = g.createImageData(W, T);
  const d = img.data;
  const { w, h } = GRID;
  const at = (i, j) => H[Math.min(h, j) * (w + 1) + Math.min(w, i)];
  // sRGB colours
  const ROCK = [132, 124, 122];
  const ROCK_DARK = [92, 88, 92];
  const SCREE = [164, 152, 136];
  const FOREST = [38, 72, 54];
  const FOREST_L = [66, 100, 62];
  const MEADOW = [168, 164, 84];
  const GOLD = [206, 176, 96];
  const px = [0, 0, 0];
  const mix = (a, b, k) => {
    px[0] = a[0] + (b[0] - a[0]) * k;
    px[1] = a[1] + (b[1] - a[1]) * k;
    px[2] = a[2] + (b[2] - a[2]) * k;
  };
  const over = (b, k) => {
    px[0] += (b[0] - px[0]) * k;
    px[1] += (b[1] - px[1]) * k;
    px[2] += (b[2] - px[2]) * k;
  };
  for (let y = 0; y < T; y++) {
    const gv = (y / (T - 1)) * h;
    const j = Math.min(h - 1, Math.floor(gv));
    const fy = gv - j;
    for (let x = 0; x < W; x++) {
      const gu = (x / (W - 1)) * w;
      const i = Math.min(w - 1, Math.floor(gu));
      const fx = gu - i;
      const h00 = at(i, j);
      const h10 = at(i + 1, j);
      const h01 = at(i, j + 1);
      const h11 = at(i + 1, j + 1);
      const ht = h00 + (h10 - h00) * fx + (h01 - h00) * fy + (h00 - h10 - h01 + h11) * fx * fy;
      const dx = X[i + 1] - X[i];
      const dz = Z[j + 1] - Z[j];
      const slope = Math.hypot((h10 - h00) / dx, (h01 - h00) / dz);
      const wx = X[i] + dx * fx;
      const wz = Z[j] + dz * fy;
      const n = noise(wx * 0.01, wz * 0.01);
      const n2 = noise(wx * 0.033 + 5, wz * 0.033 + 8);
      const n3 = noise(wx * 0.0035 + 2, wz * 0.0035 + 3);
      mix(ROCK, ROCK_DARK, smooth(-0.3, 0.35, n + n2 * 0.5));
      over(SCREE, smooth(0.7, 0.35, slope) * 0.6);
      const tree = 156 + 46 * n3 + 24 * n; // the tree line
      const forest = smooth(tree + 26, tree - 34, ht) * smooth(1.25, 0.8, slope);
      over(FOREST, forest);
      over(FOREST_L, forest * smooth(-0.25, 0.3, n2 + n * 0.7));
      const meadow = smooth(34 + 26 * n3, 8, ht); // meadows along the shore
      over(MEADOW, meadow * 0.92);
      over(GOLD, meadow * smooth(-0.2, 0.3, n + n3));
      over(SCREE, smooth(5, 1.5, ht) * 0.8); // a thin pebble line at the water
      const o = (y * W + x) * 4;
      d[o] = px[0];
      d[o + 1] = px[1];
      d[o + 2] = px[2];
      d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/**
 * The tiled detail map: a ridged rock height in blue and its slopes in red and green, so one small picture lights the
 * rock per pixel and gives the snow a sharp, broken edge.
 */
function detailTexture(renderer) {
  const N = 256;
  const H = new Float32Array(N * N);
  // periodic: the noise is walked round a torus, so the tile has no seams
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
      H[y * N + x] = 0.55 * r1 * r1 + 0.3 * r2 * r2 * r1 + 0.15 * r3;
    }
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  const at = (x, y) => H[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const o = (y * N + x) * 4;
      img.data[o] = 128 + 255 * Math.max(-0.5, Math.min(0.5, (at(x - 1, y) - at(x + 1, y)) * 2.6));
      img.data[o + 1] = 128 + 255 * Math.max(-0.5, Math.min(0.5, (at(x, y - 1) - at(x, y + 1)) * 2.6));
      img.data[o + 2] = 255 * Math.min(1, H[y * N + x]);
      img.data[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

// ── the sky ─────────────────────────────────────────────────────────────────────────────────────────────────────
function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#2f7fd0');
  gr.addColorStop(0.45, '#5aa5e6');
  gr.addColorStop(0.78, '#9fd0f0');
  gr.addColorStop(0.95, '#d5ebf3');
  gr.addColorStop(1, '#f1ecdc');
  g.fillStyle = gr;
  g.fillRect(0, 0, 1024, 256);
  g.fillStyle = '#c4c9c4';
  g.fillRect(0, 256, 1024, 256);
  // soft high clouds, in bands, wider near the horizon (they are seen on the slant there)
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < 34; i++) {
    const h = rnd();
    const y = 256 - 8 - h * h * 150;
    const x = rnd() * 1024;
    const w = 26 + (1 - h) * 92 + rnd() * 40;
    const hh = w * (0.06 + 0.08 * h);
    const a = 0.1 + rnd() * 0.22;
    for (const ox of [0, -1024, 1024]) {
      g.save();
      g.translate(x + ox, y);
      g.scale(1, hh / w);
      const r = g.createRadialGradient(0, 0, 0, 0, 0, w);
      r.addColorStop(0, `rgba(255,255,255,${a})`);
      r.addColorStop(0.55, `rgba(255,252,246,${a * 0.5})`);
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

const TERRAIN_VS = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vP;
  void main() {
    vUv = uv; vN = normal; vP = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
// lit in the mesh's own coordinates, so the mirrored copy is lit exactly as the real one
const TERRAIN_FS = /* glsl */ `
  uniform sampler2D map; uniform sampler2D detail; uniform vec3 uSun;
  varying vec2 vUv; varying vec3 vN; varying vec3 vP;
  void main() {
    if (vP.y < 0.0) discard; // only what stands above the water is seen, or mirrored
    vec4 d1 = texture2D(detail, vP.xz / 330.0);
    vec4 d2 = texture2D(detail, vP.xz / 97.0 + 0.37);
    float rock = smoothstep(90.0, 210.0, vP.y); // the fine relief belongs to the mountain, not the forest
    vec3 n = normalize(vN);
    vec3 N = normalize(n + vec3((d1.r - 0.5) * 1.5 + (d2.r - 0.5) * 0.9, 0.0, (d1.g - 0.5) * 1.5 + (d2.g - 0.5) * 0.9) * (0.28 + 0.72 * rock));
    vec3 a = texture2D(map, vUv).rgb;
    a *= 0.72 + 0.56 * mix(d2.b, d1.b, 0.5);
    // snow lies above a broken line, and only where it can hold: sharp edges, at any size
    float h = vP.y + (d1.b - 0.5) * 120.0 + (d2.b - 0.5) * 46.0;
    float snow = smoothstep(196.0, 206.0, h) * smoothstep(0.42, 0.56, N.y + (d2.b - 0.5) * 0.3);
    a = mix(a, vec3(0.92, 0.94, 0.98), snow);
    float sun = max(dot(N, uSun), 0.0);
    float sky = 0.5 + 0.5 * N.y;
    vec3 c = a * (vec3(0.40, 0.48, 0.60) * (0.5 + 0.7 * sky) + vec3(1.0, 0.95, 0.86) * 1.2 * sun);
    float d = length(vP.xz);
    c = mix(c, vec3(0.66, 0.80, 0.92), (1.0 - exp(-max(0.0, d - 1500.0) * 0.00017)) * 0.62);
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

const WATER_VS = /* glsl */ `
  varying vec3 vP;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vP = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const COUNT = WAVES.length;
const WATER_FS = /* glsl */ `
  #define NW ${COUNT}
  uniform sampler2D tRefl; uniform sampler2D tDepth; uniform mat4 uVP; uniform vec3 uCam;
  uniform float uWind; uniform float uTime; uniform vec4 uW[NW]; uniform float uN;
  uniform float uExtent;
  varying vec3 vP;
  const float PROXY = 2600.0; // how far the scenery is, for following a turned ray out to it

  // exact Fresnel for unpolarised light, air to water
  float fresnel(float c) {
    float ct = sqrt(1.0 - (1.0 - c * c) / (uN * uN));
    float rs = (c - uN * ct) / (c + uN * ct);
    float rp = (ct - uN * c) / (ct + uN * c);
    return 0.5 * (rs * rs + rp * rp);
  }
  // what a ray leaving P along R sees: the mirror image's point, seen from the camera
  vec3 look(vec3 V, vec3 N, float lod) {
    vec3 R = reflect(V, N);
    R.y = max(R.y, 0.004);
    vec3 H = vP + R * PROXY;
    H.y = -H.y;
    vec4 c = uVP * vec4(H, 1.0);
    return textureLod(tRefl, clamp(c.xy / c.w * 0.5 + 0.5, 0.001, 0.999), lod).rgb;
  }
  void main() {
    vec3 toP = vP - uCam;
    vec3 V = normalize(toP);
    vec2 s = vec2(0.0);
    float lost = 0.0; // the slopes of the waves too small for one pixel: they blur instead of shimmer
    vec3 sum;
    vec3 N = vec3(0.0, 1.0, 0.0);
    if (uWind > 0.0005) {
      float fp = max(length(dFdx(vP.xz)), length(dFdy(vP.xz)));
      for (int i = 0; i < NW; i++) {
        vec4 w = uW[i];
        float k = length(w.xy);
        float len = 6.2832 / k;
        float f = 1.0 - smoothstep(len * 0.07, len * 0.22, fp);
        float slope = w.w * k;
        s += w.xy * w.w * cos(dot(w.xy, vP.xz) - w.z * uTime) * f;
        lost += (1.0 - f) * 0.5 * slope * slope;
      }
      s *= uWind;
      lost *= uWind * uWind;
      N = normalize(vec3(-s.x, 1.0, -s.y));
    }
    if (lost > 1e-6) {
      // waves too small to draw still turn the rays: four slopes along the view, spread as theirs are, each a little
      // blurred (a tilt of the water moves the image along the view far more than across it: the long streaks)
      float r = sqrt(lost);
      vec2 along = normalize(V.xz);
      float lod = clamp(log2(1.0 + r * 40.0), 0.0, 4.0);
      sum = vec3(0.0);
      sum += look(V, normalize(N + vec3(along.x, 0.0, along.y) * r * 0.5), lod) * 0.3;
      sum += look(V, normalize(N - vec3(along.x, 0.0, along.y) * r * 0.5), lod) * 0.3;
      sum += look(V, normalize(N + vec3(along.x, 0.0, along.y) * r * 1.4), lod) * 0.2;
      sum += look(V, normalize(N - vec3(along.x, 0.0, along.y) * r * 1.4), lod) * 0.2;
    } else {
      sum = look(V, N, 0.0);
    }
    float F = fresnel(clamp(dot(-V, N), 0.02, 1.0));
    // the light that comes back up out of the water itself: a clear glacial blue, paler over the shallows
    vec2 uv = vP.xz / uExtent * 0.5 + 0.5;
    float depth = texture2D(tDepth, uv).r;
    vec3 up = mix(vec3(0.190, 0.340, 0.300), vec3(0.040, 0.215, 0.310), depth);
    vec3 c = mix(up, sum, F);
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/** A small map of how deep the lake is: pale in the shallows by the shore. */
function depthTexture(extent) {
  const N = 256;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const wx = (x / (N - 1)) * 2 * extent - extent;
      const wz = (y / (N - 1)) * 2 * extent - extent;
      const past = Math.hypot(wx, wz) - shoreAt(Math.atan2(wz, wx));
      const v = 255 * smooth(0, -130, past);
      const o = (y * N + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = v;
      img.data[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.flipY = false;
  return t;
}

/**
 * @param {{ stage: any }} o
 * The setting. `update(camera)` keeps the mirrored picture current (call it just before each frame is drawn; it does
 * the work only when the camera has moved).
 */
export function createLake({ stage }) {
  const { scene, renderer } = stage;
  const root = new THREE.Group();
  root.name = 'lake';
  const heights = buildHeights();
  const groundCanvas = terrainTexture(heights);
  const groundTex = new THREE.CanvasTexture(groundCanvas);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  const geo = terrainGeometry(heights);
  const groundMat = new THREE.ShaderMaterial({
    vertexShader: TERRAIN_VS,
    fragmentShader: TERRAIN_FS,
    uniforms: { map: { value: groundTex }, detail: { value: detailTexture(renderer) }, uSun: { value: SUN } },
  });
  const ground = new THREE.Mesh(geo, groundMat);
  ground.frustumCulled = false;
  ground.userData.noExport = true;

  const skyTex = skyTexture();
  const skyGeo = new THREE.SphereGeometry(5600, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false, fog: false });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.renderOrder = -10;
  sky.userData.noExport = true;

  root.add(sky, ground);
  scene.add(root);

  // the mirror world: the same meshes, flipped in the plane of the water
  const mirrorScene = new THREE.Scene();
  const mirror = new THREE.Group();
  mirror.scale.y = -1;
  const mGround = new THREE.Mesh(geo, groundMat);
  mGround.frustumCulled = false;
  const mSky = new THREE.Mesh(skyGeo, skyMat);
  mSky.renderOrder = -10;
  mirror.add(mSky, mGround);
  mirrorScene.add(mirror);

  const size = new THREE.Vector2();
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: true, samples: 0 });
  rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
  rt.texture.generateMipmaps = true;

  const extent = 3700;
  const waterMat = new THREE.ShaderMaterial({
    vertexShader: WATER_VS,
    fragmentShader: WATER_FS,
    uniforms: {
      tRefl: { value: rt.texture },
      tDepth: { value: depthTexture(extent) },
      uVP: { value: new THREE.Matrix4() },
      uCam: { value: new THREE.Vector3() },
      uWind: { value: 0 },
      uTime: { value: 0 },
      uN: { value: N_WATER },
      uExtent: { value: extent },
      uW: { value: WAVES.map((w) => new THREE.Vector4(w.kx, w.kz, w.w, w.a)) },
    },
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(extent, 96), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.frustumCulled = false;
  water.userData.noExport = true;
  root.add(water);

  let stale = true;
  const lastCam = new Float64Array(32);
  /** Draw the mirror world if anything it depends on moved. */
  function update(camera) {
    camera.updateMatrixWorld();
    const a = camera.matrixWorld.elements;
    const b = camera.projectionMatrix.elements;
    for (let i = 0; i < 16; i++) {
      if (lastCam[i] !== a[i] || lastCam[i + 16] !== b[i]) stale = true;
      lastCam[i] = a[i];
      lastCam[i + 16] = b[i];
    }
    renderer.getDrawingBufferSize(size);
    const scale = Math.min(1, 1024 / Math.max(size.x, size.y));
    const w = Math.max(4, Math.round(size.x * scale));
    const h = Math.max(4, Math.round(size.y * scale));
    if (rt.width !== w || rt.height !== h) {
      rt.setSize(w, h);
      stale = true;
    }
    waterMat.uniforms.uCam.value.setFromMatrixPosition(camera.matrixWorld);
    waterMat.uniforms.uVP.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    if (!stale) return;
    stale = false;
    const before = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(mirrorScene, camera);
    renderer.setRenderTarget(before);
  }

  return {
    root,
    water,
    update,
    /** The waves: 0 flat … 1 strong; time in seconds. */
    setWaves(wind, time) {
      waterMat.uniforms.uWind.value = wind;
      waterMat.uniforms.uTime.value = time;
    },
    /** The ground as a model for the GLB: a lighter mesh with the painted ground as a JPEG. */
    exportModel() {
      const g = new THREE.Group();
      g.name = 'lake-setting';
      const light = terrainGeometry(heights, 3);
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      c.getContext('2d').drawImage(groundCanvas, 0, 0, 512, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.userData.mimeType = 'image/jpeg';
      const land = new THREE.Mesh(light, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
      land.name = 'terrain';
      const lake = new THREE.Mesh(
        new THREE.CircleGeometry(3400, 64),
        new THREE.MeshStandardMaterial({ color: '#1d3f55', metalness: 0.2, roughness: 0.08 }),
      );
      lake.name = 'lake-surface';
      lake.rotation.x = -Math.PI / 2;
      g.add(land, lake);
      return g;
    },
  };
}
