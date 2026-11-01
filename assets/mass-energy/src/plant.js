// The scenery (procedural three.js, nothing loaded): the reactor pool behind the nuclei, and a nuclear power plant
// (নিউক্লিয়ার শক্তিকেন্দ্র) on a river bank among paddy fields at dusk, cut open to show the book's chain from heat to electricity:
// the reactor's core glows blue in its water, steam runs to the turbine, the turbine turns the generator, and the
// power runs along the lines to a town whose windows light up. Units: metres, roughly to scale with each other.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function tex(c, { repeat = null, anisotropy = 4, data = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/**
 * The water of the reactor pool, behind the nuclei: bright at the top, deeper blue below, the fuel assemblies at
 * the bottom giving off their blue glow, light rippling down from the surface.
 */
export function poolBackground() {
  const W = 1024;
  const H = 1024;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(3);
  // the water: light from the surface at the top, a deep clear blue below (no longer near-white: the red and grey
  // nucleons, the white "+" and the warm glow of the split all stand out on it)
  const lg = g.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, '#5fb9e2');
  lg.addColorStop(0.25, '#3394cc');
  lg.addColorStop(0.55, '#1e76b6');
  lg.addColorStop(0.82, '#135893');
  lg.addColorStop(1, '#0c4478');
  g.fillStyle = lg;
  g.fillRect(0, 0, W, H);
  // the pool's lined wall far behind: steel plates, their seams faint through the water
  g.strokeStyle = 'rgba(200,235,255,0.07)';
  g.lineWidth = 2;
  g.beginPath();
  for (let x = 0; x <= W; x += 128) {
    g.moveTo(x, H * 0.18);
    g.lineTo(x, H);
  }
  for (let y = H * 0.18; y <= H; y += 96) {
    g.moveTo(0, y);
    g.lineTo(W, y);
  }
  g.stroke();
  // light rays from the surface
  for (let i = 0; i < 14; i++) {
    const x = r() * W;
    const w = 30 + r() * 90;
    const ray = g.createLinearGradient(0, 0, 0, H * 0.9);
    ray.addColorStop(0, 'rgba(225,248,255,0.26)');
    ray.addColorStop(1, 'rgba(225,248,255,0)');
    g.fillStyle = ray;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + w, 0);
    g.lineTo(x + w * 2.2 + 120, H * 0.9);
    g.lineTo(x + 120, H * 0.9);
    g.closePath();
    g.fill();
  }
  // ripples of light near the surface
  g.strokeStyle = 'rgba(235,250,255,0.32)';
  g.lineWidth = 2;
  for (let i = 0; i < 70; i++) {
    const x = r() * W;
    const y = r() * H * 0.28;
    const s = 10 + r() * 34;
    g.beginPath();
    g.ellipse(x, y, s, s * 0.35, r() * 0.4, 0, Math.PI * 2);
    g.stroke();
  }
  // the fuel assemblies at the bottom, rows of rods glowing blue (Cherenkov light)
  const base = H * 0.8;
  for (let i = 0; i < 9; i++) {
    const x0 = 40 + i * 112 + r() * 10;
    const glow = g.createRadialGradient(x0 + 40, base + 30, 4, x0 + 40, base + 30, 120);
    glow.addColorStop(0, 'rgba(130,230,255,0.7)');
    glow.addColorStop(1, 'rgba(60,170,255,0)');
    g.fillStyle = glow;
    g.fillRect(x0 - 90, base - 100, 260, 260);
    for (let k = 0; k < 7; k++) {
      const x = x0 + k * 12;
      const rod = g.createLinearGradient(0, base - 10, 0, H);
      rod.addColorStop(0, 'rgba(215,248,255,0.9)');
      rod.addColorStop(1, 'rgba(90,185,240,0.45)');
      g.fillStyle = rod;
      g.fillRect(x, base - 10 + (k % 2) * 6, 6, H);
    }
    g.fillStyle = 'rgba(10,45,80,0.7)';
    g.fillRect(x0 - 4, base - 22, 92, 10);
  }
  // a soft vignette: the middle (where the nuclei are) a little lighter, the corners deeper
  const v = g.createRadialGradient(W / 2, H * 0.45, W * 0.2, W / 2, H * 0.45, W * 0.75);
  v.addColorStop(0, 'rgba(160,220,255,0.12)');
  v.addColorStop(1, 'rgba(0,25,60,0.3)');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  return tex(c);
}

// ── noise and pictures drawn pixel by pixel ────────────────────────────────────────────────────────────────────
/** Smooth value noise in [0, 1], seeded; px, py: the period in cells, so a texture made from it tiles. */
const noiseTables = new Map();
function tileNoise(seed) {
  const N = 512;
  // one table per seed while the plant is built, filled with a plain loop (Float32Array.from with a function took
  // most of the build's time)
  let v = noiseTables.get(seed);
  if (!v) {
    const r = rng(seed);
    v = new Float32Array(N * N);
    for (let i = 0; i < v.length; i++) v[i] = r();
    noiseTables.set(seed, v);
  }
  const at = (x, y, px, py) => v[(((y % py) + py) % py) * N + (((x % px) + px) % px)];
  return (x, y, px = N, py = px) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(xi, yi, px, py);
    const b = at(xi + 1, yi, px, py);
    const c = at(xi, yi + 1, px, py);
    const d = at(xi + 1, yi + 1, px, py);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function fbm(n, x, y, px, py = px, oct = 4) {
  let s = 0;
  let t = 0;
  let a = 1;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * n(x * f, y * f, px * f, py * f);
    t += a;
    a *= 0.5;
    f *= 2;
  }
  return s / t;
}
/** A canvas filled pixel by pixel: fn(u, v) → [r, g, b, a?] with u, v in [0, 1). */
function pixels(w, h, fn) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = fn(x / w, y / h);
      const i = (y * w + x) * 4;
      d[i] = p[0];
      d[i + 1] = p[1];
      d[i + 2] = p[2];
      d[i + 3] = p[3] ?? 255;
    }
  g.putImageData(img, 0, 0);
  return c;
}
/** Grey blotches between lo and hi (1 = white), to multiply over a colour. Tiles. */
function mottle(S, cells, seed, lo = 0.8, hi = 1, oct = 4) {
  const n = tileNoise(seed);
  return pixels(S, S, (u, v) => {
    const k = Math.round(255 * (lo + (hi - lo) * fbm(n, u * cells, v * cells, cells, cells, oct)));
    return [k, k, k];
  });
}
/** A tangent-space normal map of small waves, longer across the river than along it. Tiles. */
function waveNormals(W, H, cx, cy, seed, k = 7) {
  const n = tileNoise(seed);
  const h = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) h[y * W + x] = fbm(n, (x / W) * cx, (y / H) * cy, cx, cy, 4);
  const at = (x, y) => h[((y + H) % H) * W + ((x + W) % W)];
  const c = pixels(W, H, (u, v) => {
    const x = Math.round(u * W);
    const y = Math.round(v * H);
    const nx = (at(x - 1, y) - at(x + 1, y)) * k;
    const ny = (at(x, y + 1) - at(x, y - 1)) * k;
    const l = Math.hypot(nx, ny, 1);
    return [((nx / l) * 0.5 + 0.5) * 255, ((ny / l) * 0.5 + 0.5) * 255, ((1 / l) * 0.5 + 0.5) * 255];
  });
  const t = tex(c, { repeat: [1, 1], data: true });
  return t;
}

// ── the sky ───────────────────────────────────────────────────────────────────────────────────────────────────
/** Where the sun is: low in the west, in front of the plant and to its left, so it lights the cut-open side. */
export const SUN = new THREE.Vector3(-0.84, 0.27, 0.47).normalize();
/** The colour of the haze at the horizon: the fog, and the sky below the horizon. */
export const HAZE = '#e9b597';

/**
 * The sky at dusk as an equirectangular picture, for the background and for the light the materials reflect:
 * deep blue overhead, violet, then pink and orange at the horizon, the sun's glow on its side, thin clouds lit
 * from below.
 */
export function duskSky() {
  const W = 1024;
  const H = 512;
  const k = W / 2048; // the sizes below were drawn for a 2048 px sky
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const yAt = (deg) => (0.5 - deg / 180) * H;
  const lg = g.createLinearGradient(0, 0, 0, H);
  for (const [e, col] of [
    [90, '#28448a'],
    [55, '#4964ad'],
    [32, '#7d84c2'],
    [18, '#bb8db7'],
    [9, '#ec9f9c'],
    [3.5, '#ffbd92'],
    [0.6, '#fbcda6'],
    [-1.5, HAZE],
    [-90, HAZE],
  ])
    lg.addColorStop(yAt(e) / H, col);
  g.fillStyle = lg;
  g.fillRect(0, 0, W, H);
  const su = (Math.atan2(SUN.z, SUN.x) / (2 * Math.PI) + 0.5) * W;
  const sv = yAt(THREE.MathUtils.radToDeg(Math.asin(SUN.y)));
  const r = rng(9);
  // thin clouds, warmer and brighter toward the sun
  for (let i = 0; i < 60; i++) {
    const e = 3 + r() ** 1.4 * 34;
    const y = yAt(e);
    const x = r() * W;
    const len = (70 + r() * 300) * (1.4 - e / 50) * k;
    const th = (2 + r() * 7) * k;
    const dx = Math.min(Math.abs(x - su), W - Math.abs(x - su)) / W;
    const warm = Math.exp(-dx * 5);
    for (const ox of [-W, 0, W]) {
      const cg = g.createLinearGradient(0, y - th, 0, y + th);
      cg.addColorStop(0, `rgba(${120 + 60 * warm},${100 + 40 * warm},${160},${0.18 + 0.1 * r()})`);
      cg.addColorStop(0.7, `rgba(255,${170 + 60 * warm},${150 + 40 * warm},${0.35 + 0.35 * warm})`);
      cg.addColorStop(1, 'rgba(255,220,200,0)');
      g.fillStyle = cg;
      g.beginPath();
      g.ellipse(x + ox, y, len, th, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  // the sun's glow, spread along the horizon on its side, and the sun itself
  for (const ox of [-W, 0, W]) {
    g.save();
    g.translate(su + ox, yAt(1));
    g.scale(4.5, 1);
    const band = g.createRadialGradient(0, 0, 0, 0, 0, 150 * k);
    band.addColorStop(0, 'rgba(255,214,160,0.75)');
    band.addColorStop(1, 'rgba(255,190,150,0)');
    g.fillStyle = band;
    g.fillRect(-150 * k, -150 * k, 300 * k, 300 * k);
    g.restore();
    const big = g.createRadialGradient(su + ox, sv, 0, su + ox, sv, 300 * k);
    big.addColorStop(0, 'rgba(255,236,190,0.95)');
    big.addColorStop(0.25, 'rgba(255,196,140,0.45)');
    big.addColorStop(1, 'rgba(255,160,130,0)');
    g.fillStyle = big;
    g.fillRect(su + ox - 300 * k, sv - 300 * k, 600 * k, 600 * k);
    const disc = g.createRadialGradient(su + ox, sv, 0, su + ox, sv, 16 * k);
    disc.addColorStop(0, 'rgba(255,255,245,1)');
    disc.addColorStop(0.7, 'rgba(255,244,214,1)');
    disc.addColorStop(1, 'rgba(255,230,190,0)');
    g.fillStyle = disc;
    g.fillRect(su + ox - 16 * k, sv - 16 * k, 32 * k, 32 * k);
  }
  const t = tex(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

// ── surfaces ──────────────────────────────────────────────────────────────────────────────────────────────────
const FIELD_M = 210; // the metres one picture of the fields covers (it repeats beyond, in the haze)
/**
 * Paddy at harvest, seen from the air: small plots on a jittered grid, many cut into long strips, divided by
 * earth bunds. Most are ripe gold; some are cut to stubble, ploughed, yellow with mustard, or flooded.
 */
function fieldTexture(repeat) {
  const S = 1024; // 4.9 px a metre, as before at 2048 px over 420 m
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const r = rng(21);
  g.fillStyle = '#8f6c46';
  g.fillRect(0, 0, S, S);
  const N = 13;
  const cell = S / N;
  const J = Array.from({ length: N }, () => Array.from({ length: N }, () => [(r() - 0.5) * cell * 0.45, (r() - 0.5) * cell * 0.45]));
  const at = (i, j) => {
    const q = J[i % N][j % N];
    return [i * cell + q[0], j * cell + q[1]];
  };
  const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const plots = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const a = at(i, j);
      const b = at(i + 1, j);
      const cc = at(i + 1, j + 1);
      const d = at(i, j + 1);
      const k = r() < 0.55 ? 2 + Math.floor(r() * 2) : 1;
      const along = r() < 0.5;
      for (let s = 0; s < k; s++) {
        const t0 = s / k;
        const t1 = (s + 1) / k;
        plots.push(
          along ? [mix(a, b, t0), mix(a, b, t1), mix(d, cc, t1), mix(d, cc, t0)] : [mix(a, d, t0), mix(b, cc, t0), mix(b, cc, t1), mix(a, d, t1)],
        );
      }
    }
  const kinds = [
    [0.7, () => `hsl(${38 + r() * 7},${60 + r() * 12}%,${51 + r() * 7}%)`, 'rgba(140,90,20,0.2)'], // ripe paddy
    [0.16, () => `hsl(${34 + r() * 5},${32 + r() * 10}%,${57 + r() * 7}%)`, 'rgba(255,240,210,0.26)'], // cut to stubble
    [0.06, () => `hsl(${24 + r() * 6},${28 + r() * 8}%,${36 + r() * 6}%)`, 'rgba(60,38,22,0.3)'], // ploughed
    [0.05, () => `hsl(${49 + r() * 5},${80 + r() * 10}%,${54 + r() * 5}%)`, 'rgba(150,130,20,0.2)'], // mustard in flower
    [0.03, () => `hsl(${205 + r() * 15},${16 + r() * 8}%,${56 + r() * 6}%)`, 'rgba(255,255,255,0.14)'], // flooded: the sky in it
  ];
  const trace = (pts, ox, oy) => {
    g.beginPath();
    g.moveTo(pts[0][0] + ox, pts[0][1] + oy);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] + ox, pts[i][1] + oy);
    g.closePath();
  };
  const drawn = [];
  for (const pts of plots) {
    let roll = r();
    let kind = kinds[0];
    for (const k of kinds) {
      if (roll < k[0]) {
        kind = k;
        break;
      }
      roll -= k[0];
    }
    const fill = kind[1]();
    const ang = r() * Math.PI;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const offs = [];
    for (const ox of [0, x0 < 0 ? S : null, x1 > S ? -S : null])
      for (const oy of [0, y0 < 0 ? S : null, y1 > S ? -S : null]) if (ox !== null && oy !== null) offs.push([ox, oy]);
    for (const [ox, oy] of offs) {
      trace(pts, ox, oy);
      g.fillStyle = fill;
      g.fill();
      g.save();
      g.clip();
      g.translate((x0 + x1) / 2 + ox, (y0 + y1) / 2 + oy);
      g.rotate(ang);
      const R = Math.max(x1 - x0, y1 - y0);
      g.beginPath();
      for (let y = -R; y < R; y += 3) {
        g.moveTo(-R, y);
        g.lineTo(R, y);
      }
      g.strokeStyle = kind[2];
      g.lineWidth = 1.2;
      g.stroke();
      g.restore();
      drawn.push([pts, ox, oy]);
    }
  }
  g.lineJoin = 'round';
  for (const [pts, ox, oy] of drawn) {
    trace(pts, ox, oy);
    g.strokeStyle = '#94744a';
    g.lineWidth = 2.8;
    g.stroke();
    g.strokeStyle = 'rgba(255,226,170,0.25)';
    g.lineWidth = 1.1;
    g.stroke();
  }
  g.globalCompositeOperation = 'multiply';
  g.drawImage(mottle(256, 8, 5, 0.82, 1), 0, 0, S, S);
  const fine = mottle(256, 32, 6, 0.84, 1, 3);
  for (let x = 0; x < S; x += 512) for (let y = 0; y < S; y += 512) g.drawImage(fine, x, y, 512, 512);
  g.globalCompositeOperation = 'source-over';
  return tex(c, { repeat: [repeat, repeat], anisotropy: 8 });
}
/** Cast concrete: pour joints, form seams and tie holes, blotches, rain streaks and grime at the foot. */
function concreteTexture({
  base = '#d7d1c5',
  W = 512,
  H = 512,
  rows = 8,
  cols = 12,
  seed = 13,
  streaks = 50,
  grime = 0.22,
  ties = true,
  repeat = null,
} = {}) {
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'multiply';
  g.drawImage(mottle(256, 6, seed, 0.86, 1), 0, 0, W, H);
  g.drawImage(mottle(256, 32, seed + 1, 0.9, 1, 2), 0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  const rh = H / rows;
  for (let i = 1; i < rows; i++) {
    const y = Math.round(i * rh);
    g.fillStyle = 'rgba(80,70,60,0.28)';
    g.fillRect(0, y, W, 1.5);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(0, y + 1.5, W, 1);
  }
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      const x = ((j + (i % 2) * 0.5) / cols) * W;
      g.fillStyle = 'rgba(80,70,60,0.12)';
      g.fillRect(x, i * rh, 1, rh);
      if (ties) {
        g.fillStyle = 'rgba(70,60,50,0.3)';
        for (const fy of [0.3, 0.7]) for (const fx of [0.25, 0.75]) g.fillRect(x + (W / cols) * fx - 1, i * rh + rh * fy - 1, 2, 2);
      }
    }
  for (let i = 0; i < streaks; i++) {
    const x = r() * W;
    const y0 = r() < 0.5 ? 0 : Math.floor(r() * rows) * rh;
    const len = 20 + r() * H * 0.45;
    const w = 1 + r() * 5;
    const lg = g.createLinearGradient(0, y0, 0, y0 + len);
    lg.addColorStop(0, `rgba(70,62,55,${0.07 + r() * 0.13})`);
    lg.addColorStop(1, 'rgba(70,62,55,0)');
    g.fillStyle = lg;
    g.fillRect(x, y0, w, len);
  }
  if (grime) {
    const lg = g.createLinearGradient(0, H, 0, H * 0.72);
    lg.addColorStop(0, `rgba(90,75,55,${grime})`);
    lg.addColorStop(1, 'rgba(90,75,55,0)');
    g.fillStyle = lg;
    g.fillRect(0, H * 0.72, W, H * 0.28);
  }
  return tex(c, { repeat });
}
/** The plant's yard (62 × 34 m): concrete slabs, their joints, oil stains, yellow walkway lines. */
function yardTexture() {
  const W = 1024;
  const H = 562;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(17);
  g.fillStyle = '#c8c3b8';
  g.fillRect(0, 0, W, H);
  const s = (4 / 62) * W;
  for (let x = 0; x < W; x += s)
    for (let y = 0; y < H; y += s) {
      g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${r() * 0.06})` : `rgba(255,255,255,${r() * 0.08})`;
      g.fillRect(x, y, s, s);
    }
  g.globalCompositeOperation = 'multiply';
  g.drawImage(mottle(256, 8, 4, 0.82, 1), 0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = 'rgba(70,65,60,0.35)';
  for (let x = 0; x < W; x += s) g.fillRect(x, 0, 1.5, H);
  for (let y = 0; y < H; y += s) g.fillRect(0, y, W, 1.5);
  for (let i = 0; i < 14; i++) {
    const x = r() * W;
    const y = r() * H;
    const rad = 6 + r() * 22;
    const o = g.createRadialGradient(x, y, 0, x, y, rad);
    o.addColorStop(0, 'rgba(40,35,30,0.28)');
    o.addColorStop(1, 'rgba(40,35,30,0)');
    g.fillStyle = o;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.fillStyle = '#e0b13c';
  g.fillRect(0, H * 0.9, W, 4);
  g.fillRect(0, H * 0.93, W, 4);
  return tex(c, { anisotropy: 8 });
}
/** Asphalt with white edge lines and a dashed centre line; 7 m wide, 56 m long per repeat. */
function roadTexture(repeat) {
  const W = 128;
  const H = 1024;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#55595e';
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'multiply';
  g.drawImage(mottle(128, 16, 8, 0.8, 1, 3), 0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = 'rgba(240,240,235,0.85)';
  g.fillRect(8, 0, 4, H);
  g.fillRect(W - 12, 0, 4, H);
  g.fillStyle = 'rgba(245,205,90,0.9)';
  for (let y = 0; y < H; y += 120) g.fillRect(W / 2 - 2, y, 4, 60);
  return tex(c, { repeat: [1, repeat], anisotropy: 8 });
}
/** The river's mud bank: dry and pale on the land side, dark and wet at the water. */
function bankTexture() {
  const c = canvas(256, 64);
  const g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 0, 64);
  lg.addColorStop(0, '#b89a6c');
  lg.addColorStop(0.55, '#8b6d4a');
  lg.addColorStop(1, '#55432f');
  g.fillStyle = lg;
  g.fillRect(0, 0, 256, 64);
  g.globalCompositeOperation = 'multiply';
  g.drawImage(mottle(128, 8, 12, 0.75, 1), 0, 0, 256, 64);
  return tex(c, { repeat: [200, 1] });
}
/** Ribbed metal cladding with a band of high windows and a concrete plinth (the turbine hall). */
function claddingTexture() {
  const W = 1024;
  const H = 512;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#a7b8c6';
  g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 14) {
    const lg = g.createLinearGradient(x, 0, x + 14, 0);
    lg.addColorStop(0, 'rgba(255,255,255,0.22)');
    lg.addColorStop(0.45, 'rgba(255,255,255,0)');
    lg.addColorStop(0.55, 'rgba(30,40,55,0.14)');
    lg.addColorStop(1, 'rgba(30,40,55,0)');
    g.fillStyle = lg;
    g.fillRect(x, 0, 14, H);
  }
  // the band of windows near the top
  const wy = H * 0.1;
  const wh = H * 0.1;
  const gl = g.createLinearGradient(0, wy, 0, wy + wh);
  gl.addColorStop(0, '#9fb2cc');
  gl.addColorStop(1, '#41566e');
  g.fillStyle = gl;
  g.fillRect(0, wy, W, wh);
  g.fillStyle = '#6c7d8e';
  for (let x = 0; x < W; x += 48) g.fillRect(x, wy, 3, wh);
  g.fillRect(0, wy - 3, W, 3);
  g.fillRect(0, wy + wh, W, 3);
  // plinth
  g.fillStyle = '#b5ad9f';
  g.fillRect(0, H * 0.9, W, H * 0.1);
  g.globalCompositeOperation = 'multiply';
  g.drawImage(mottle(256, 6, 19, 0.88, 1), 0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  const r = rng(20);
  for (let i = 0; i < 40; i++) {
    const x = r() * W;
    const lg = g.createLinearGradient(0, wy + wh, 0, wy + wh + 120 + r() * 200);
    lg.addColorStop(0, 'rgba(60,60,60,0.12)');
    lg.addColorStop(1, 'rgba(60,60,60,0)');
    g.fillStyle = lg;
    g.fillRect(x, wy + wh, 2 + r() * 4, 320);
  }
  return tex(c);
}
/**
 * A storey-and-bay grid of a town's flats (12 × 12 m per repeat): plastered walls, windows with grilles,
 * balconies, stains. `lit`: only the lit windows, warm and cool (the emissive map).
 */
function flatsTexture(wall, seed, lit = false, balconies = true) {
  const S = 512;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const r = rng(seed);
  const bay = S / 4;
  if (lit) {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, S, S);
  } else {
    g.fillStyle = wall;
    g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'multiply';
    g.drawImage(mottle(256, 6, seed, 0.8, 1), 0, 0, S, S);
    g.globalCompositeOperation = 'source-over';
  }
  for (let f = 0; f < 4; f++)
    for (let b = 0; b < 4; b++) {
      const x = b * bay + bay * 0.22;
      const y = f * bay + bay * 0.2;
      const w = bay * 0.56;
      const h = bay * 0.5;
      if (lit) {
        const roll = r();
        if (roll < 0.68) {
          const col = roll < 0.45 ? [255, 196, 110] : roll < 0.6 ? [255, 236, 200] : [170, 205, 255];
          const lg = g.createLinearGradient(0, y, 0, y + h);
          lg.addColorStop(0, `rgb(${col[0] * 0.75},${col[1] * 0.75},${col[2] * 0.75})`);
          lg.addColorStop(1, `rgb(${col[0]},${col[1]},${col[2]})`);
          g.fillStyle = lg;
          g.fillRect(x, y, w, h);
          if (r() < 0.4) {
            g.fillStyle = 'rgba(0,0,0,0.55)';
            g.fillRect(x + w * (r() < 0.5 ? 0 : 0.55), y, w * 0.45, h);
          }
        }
      } else {
        const gl = g.createLinearGradient(0, y, 0, y + h);
        gl.addColorStop(0, '#5d6a78');
        gl.addColorStop(1, '#27313b');
        g.fillStyle = gl;
        g.fillRect(x, y, w, h);
        g.strokeStyle = 'rgba(40,40,40,0.55)';
        g.lineWidth = 1.2;
        g.beginPath();
        for (let k = 1; k < 6; k++) {
          g.moveTo(x + (w * k) / 6, y);
          g.lineTo(x + (w * k) / 6, y + h);
        }
        g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.fillRect(x - 3, y - 6, w + 6, 5); // the sunshade over the window
        // stains under the sill
        const sg = g.createLinearGradient(0, y + h, 0, y + h + bay * 0.4);
        sg.addColorStop(0, 'rgba(70,60,50,0.22)');
        sg.addColorStop(1, 'rgba(70,60,50,0)');
        g.fillStyle = sg;
        g.fillRect(x + w * 0.1, y + h, w * 0.8, bay * 0.4);
        if (balconies && b % 2 === 0) {
          g.fillStyle = 'rgba(255,255,255,0.4)';
          g.fillRect(x - bay * 0.08, y + h * 0.62, w + bay * 0.16, 3);
          g.fillStyle = 'rgba(60,60,60,0.35)';
          g.fillRect(x - bay * 0.08, y + h * 0.62 + 3, w + bay * 0.16, h * 0.38 + bay * 0.1);
          g.strokeStyle = 'rgba(230,230,230,0.5)';
          g.beginPath();
          for (let k = 0; k < 10; k++) {
            g.moveTo(x - bay * 0.08 + (k * (w + bay * 0.16)) / 10, y + h * 0.62 + 3);
            g.lineTo(x - bay * 0.08 + (k * (w + bay * 0.16)) / 10, y + h + bay * 0.1);
          }
          g.stroke();
        }
      }
    }
  if (!lit) {
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let f = 0; f < 4; f++) g.fillRect(0, f * bay + bay - 4, S, 4); // the floor slabs
  }
  const t = tex(c, { repeat: [1, 1] });
  return t;
}
/** A coconut frond: a midrib and its leaflets, transparent between them. */
function frondTexture() {
  const W = 128;
  const H = 512;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(77);
  g.lineCap = 'round';
  for (let y = 10; y < H - 6; y += 5) {
    const t = y / H; // 0 at the tip, 1 at the stalk
    const len = (W / 2 - 4) * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (0.8 + r() * 0.2);
    for (const s of [-1, 1]) {
      g.strokeStyle = `hsl(${88 + r() * 16},${42 + r() * 12}%,${26 + r() * 12}%)`;
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(W / 2, y);
      g.lineTo(W / 2 + s * len, y - len * 0.55);
      g.stroke();
    }
  }
  g.strokeStyle = '#8a8a4a';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(W / 2, 0);
  g.lineTo(W / 2, H);
  g.stroke();
  return tex(c);
}

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...extra });

// ── drawing it cheaply: still parts merged by material, sprites as one mesh per kind ──────────────────────────
/** A material that is only a colour (no picture, opaque, not glowing): a vertex colour can stand for it. */
const isPlain = (m) =>
  m.type === 'MeshStandardMaterial' &&
  !m.map &&
  !m.normalMap &&
  !m.emissiveMap &&
  !m.transparent &&
  !m.vertexColors &&
  !m.alphaTest &&
  m.emissive.getHex() === 0;

/** One geometry per material group of a multi-material mesh (a box with a different top, …). */
function splitByGroups(geo) {
  const out = new Map();
  for (const gr of geo.groups) {
    const g = new THREE.BufferGeometry();
    for (const name of ['position', 'normal', 'uv']) if (geo.attributes[name]) g.setAttribute(name, geo.attributes[name].clone());
    if (geo.index) g.setIndex(Array.from(geo.index.array.slice(gr.start, gr.start + gr.count)));
    else g.setIndex(Array.from({ length: gr.count }, (_, i) => gr.start + i));
    if (!out.has(gr.materialIndex)) out.set(gr.materialIndex, []);
    out.get(gr.materialIndex).push(g);
  }
  return out;
}

/**
 * Merges the still meshes under `group` into one mesh per material, in the group's frame: the plant's ~700 parts
 * become a few dozen draw calls with every detail kept. Plain colours of about the same finish share one material
 * with vertex colours. Parts that cast a shadow are kept apart from those that don't, so the shadow pass draws only
 * what casts. Left as they are: `keep` (and what is under them), sprites, lights, instanced meshes.
 */
function bake(group, keep = []) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const m = new THREE.Matrix4();
  const bins = new Map();
  const add = (material, geo, mesh) => {
    const plain = isPlain(material);
    const key = `${plain ? `p${Math.round(material.roughness / 0.15)}|${Math.round(material.metalness / 0.3)}|${material.side}` : material.uuid}|${mesh.castShadow}|${mesh.receiveShadow}`;
    let b = bins.get(key);
    if (!b) {
      const mt = plain
        ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: material.roughness, metalness: material.metalness, side: material.side })
        : material;
      b = { mat: mt, geos: [], cast: mesh.castShadow, receive: mesh.receiveShadow };
      bins.set(key, b);
    }
    for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geo.deleteAttribute(name);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (plain) {
      const c = material.color; // linear, as vertex colours are
      const a = new Float32Array(geo.attributes.position.count * 3);
      for (let i = 0; i < a.length; i += 3) {
        a[i] = c.r;
        a[i + 1] = c.g;
        a[i + 2] = c.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
    }
    geo.clearGroups();
    b.geos.push(geo);
  };
  const visit = (o) => {
    for (const c of [...o.children]) {
      if (keep.includes(c) || !c.visible) continue;
      if (c.isMesh && !c.isInstancedMesh && !c.children.length) {
        m.multiplyMatrices(inv, c.matrixWorld);
        if (Array.isArray(c.material)) {
          for (const [i, list] of splitByGroups(c.geometry)) for (const g of list) add(c.material[i], g.applyMatrix4(m), c);
        } else add(c.material, c.geometry.clone().applyMatrix4(m), c);
        o.remove(c);
      } else if (!c.isMesh && !c.isLight && !c.isSprite) visit(c);
    }
  };
  visit(group);
  for (const b of bins.values()) {
    const all = b.geos.every((g) => g.index) ? b.geos : b.geos.map((g) => (g.index ? g.toNonIndexed() : g));
    const mesh = new THREE.Mesh(mergeGeometries(all), b.mat);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    group.add(mesh);
  }
}

/**
 * Many soft sprites of one picture as one mesh (one draw call): each turned to the camera in the vertex shader,
 * with its own place, size, opacity and turn. set(i, x, y, z, size, opacity, turn), then update().
 */
function createSprites(map, count, { additive = false, color = '#ffffff', fog = true } = {}) {
  const geo = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1);
  geo.index = quad.index;
  geo.setAttribute('position', quad.attributes.position);
  geo.setAttribute('uv', quad.attributes.uv);
  const at = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  const look = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3); // size, opacity, turn
  at.setUsage(THREE.DynamicDrawUsage);
  look.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aAt', at);
  geo.setAttribute('aLook', look);
  geo.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), map: { value: map }, color: { value: new THREE.Color(color) } },
    vertexShader: `attribute vec3 aAt; attribute vec3 aLook; varying vec2 vUv; varying float vAlpha;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv; vAlpha = aLook.y;
        vec4 mvPosition = modelViewMatrix * vec4(aAt, 1.0);
        float c = cos(aLook.z), s = sin(aLook.z);
        vec2 p = position.xy * aLook.x;
        mvPosition.xy += vec2(c * p.x - s * p.y, s * p.x + c * p.y);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 color; varying vec2 vUv; varying float vAlpha;
      #include <fog_pars_fragment>
      void main() {
        vec4 t = texture2D(map, vUv);
        gl_FragColor = vec4(color * t.rgb, t.a * vAlpha);
        if (gl_FragColor.a < 0.004) discard;
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    fog,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1; // after the glassy steam line and the water, which they sit in
  mesh.userData.noExport = true;
  return {
    mesh,
    set(i, x, y, z, size, opacity, turn = 0) {
      at.setXYZ(i, x, y, z);
      look.setXYZ(i, size, opacity, turn);
    },
    update() {
      at.needsUpdate = true;
      look.needsUpdate = true;
    },
  };
}

// ── pieces ────────────────────────────────────────────────────────────────────────────────────────────────────
/** A cylindrical wall (two shells, a top rim and the cut faces) with a wedge open toward the viewer. */
function cutCylinder({ r, h, wall, open, at, material, inner, face = mat('#cfc6b6') }) {
  const g = new THREE.Group();
  const start = at + open / 2;
  const len = Math.PI * 2 - open;
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, true, start, len), material);
  const innerM = new THREE.Mesh(new THREE.CylinderGeometry(r - wall, r - wall, h, 64, 1, true, start, len), inner);
  innerM.material.side = THREE.BackSide;
  outer.position.y = innerM.position.y = h / 2;
  const rim = new THREE.Mesh(new THREE.RingGeometry(r - wall, r, 64, 1, 0, len), face);
  rim.rotation.x = -Math.PI / 2;
  // RingGeometry's angle runs from +x toward +y; turned flat it runs from +x toward −z: start it at `start`
  rim.rotation.z = start - Math.PI / 2;
  rim.position.y = h;
  g.add(outer, innerM, rim);
  const faceMat = face.clone();
  faceMat.side = THREE.DoubleSide;
  for (const a of [start, start + len]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(wall, h), faceMat);
    f.position.set(Math.sin(a) * (r - wall / 2), h / 2, Math.cos(a) * (r - wall / 2));
    f.rotation.y = a + Math.PI / 2;
    g.add(f);
  }
  return g;
}

/** A box (thickness t) from a to b, as geometry to merge. */
function strut(a, b, t) {
  const geo = new THREE.BoxGeometry(t, a.distanceTo(b), t);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  geo.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
  return geo;
}

/**
 * A steel lattice pylon: four tapering legs with cross-bracing on every face, three cross-arms (the middle one
 * longest), strings of glass insulators and the earth-wire peak. Returns it and where the three conductors on one
 * side hang.
 */
function pylon(h) {
  const g = new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const half = (y) => 0.16 * h * (1 - y / h) ** 1.35 + 0.035 * h;
  const parts = [];
  const levels = [0, 0.14, 0.27, 0.39, 0.5, 0.6, 0.68, 0.76, 0.84, 0.92, 1].map((f) => f * h);
  const corner = (y, sx, sz) => V(sx * half(y), y, sz * half(y));
  const C = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  for (let k = 0; k < levels.length - 1; k++) {
    const y0 = levels[k];
    const y1 = levels[k + 1];
    for (let i = 0; i < 4; i++) {
      const [ax, az] = C[i];
      const [bx, bz] = C[(i + 1) % 4];
      parts.push(strut(corner(y0, ax, az), corner(y1, ax, az), 0.16));
      parts.push(strut(corner(y0, ax, az), corner(y1, bx, bz), 0.06));
      parts.push(strut(corner(y0, bx, bz), corner(y1, ax, az), 0.06));
      parts.push(strut(corner(y1, ax, az), corner(y1, bx, bz), 0.07));
    }
  }
  const tips = [];
  const insulators = [];
  for (const [f, reach] of [
    [0.6, 0.2],
    [0.76, 0.26],
    [0.92, 0.2],
  ]) {
    const y = f * h;
    const w = half(y);
    for (const s of [-1, 1]) {
      const tip = V(0, y, s * reach * h);
      for (const sx of [-1, 1]) {
        parts.push(strut(V(sx * w, y, s * w), tip, 0.09)); // the bottom chords
        parts.push(strut(V(sx * w, y + 1.4, s * w), tip, 0.07)); // the ties from above
      }
      // a string of glass discs hanging from the tip
      for (let k = 0; k < 7; k++) {
        const d = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 10);
        d.translate(0, y - 0.25 - k * 0.2, s * reach * h);
        insulators.push(d);
      }
      if (s < 0) tips.push(V(0, y - 1.75, s * reach * h));
    }
  }
  // the peak that carries the earth wire
  parts.push(strut(corner(h, -1, -1), V(0, h + 1.6, 0), 0.08), strut(corner(h, 1, 1), V(0, h + 1.6, 0), 0.08));
  parts.push(strut(corner(h, 1, -1), V(0, h + 1.6, 0), 0.08), strut(corner(h, -1, 1), V(0, h + 1.6, 0), 0.08));
  const steel = new THREE.Mesh(mergeGeometries(parts), mat('#9aa3ab', { metalness: 0.6, roughness: 0.42 }));
  const glass = new THREE.Mesh(mergeGeometries(insulators), mat('#7fb3a3', { metalness: 0.1, roughness: 0.15 }));
  g.add(steel, glass);
  return { root: g, tips, peak: V(0, h + 1.6, 0) };
}

/** A broad-leaved crown (mango, jackfruit, rain tree): lumpy blobs merged, shaded darker underneath. Unit size. */
function crownGeometry(seed, blobs, detail) {
  const r = rng(seed);
  const n = tileNoise(seed);
  const parts = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < blobs; i++) {
    const g = new THREE.IcosahedronGeometry(0.5 + r() * 0.3, detail);
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k);
      const d = 1 + 0.32 * (n(v.x * 3 + 9 + i * 7, v.y * 3 + v.z * 2.3 + 5) - 0.5);
      p.setXYZ(k, v.x * d, v.y * d * 0.85, v.z * d);
    }
    const a = (i / blobs) * Math.PI * 2 + r();
    const rad = i === 0 ? 0 : 0.42 + r() * 0.18;
    g.translate(Math.cos(a) * rad, i === 0 ? 0.28 : r() * 0.3, Math.sin(a) * rad);
    parts.push(mergeVertices(g));
  }
  const geo = mergeGeometries(parts);
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  for (let k = 0; k < p.count; k++) {
    const t = (p.getY(k) - min.y) / (max.y - min.y);
    const s = 0.42 + 0.58 * t ** 0.8 + (r() - 0.5) * 0.12;
    col[k * 3] = s;
    col[k * 3 + 1] = s;
    col[k * 3 + 2] = s;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.translate(0, -min.y, 0);
  return geo;
}
/** A coconut palm: a gently curved trunk and a crown of drooping fronds. Returns { trunk, fronds } geometry. */
function palmGeometry() {
  const top = new THREE.Vector3(0.7, 8.6, 0);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, 3, 0), new THREE.Vector3(0.35, 6, 0), top]);
  const trunk = new THREE.TubeGeometry(curve, 10, 0.16, 6);
  const fronds = [];
  const L = 4.2;
  for (let k = 0; k < 11; k++) {
    const g = new THREE.PlaneGeometry(1.3, L, 1, 8);
    const p = g.attributes.position;
    const up = 0.5 + (k % 3) * 0.25;
    for (let i = 0; i < p.count; i++) {
      const w = p.getX(i);
      const s = p.getY(i) + L / 2; // 0 at the stalk … L at the tip
      p.setXYZ(i, s, up * s - (0.55 * s * s) / L - Math.abs(w) * 0.25, w);
    }
    g.rotateY((k / 11) * Math.PI * 2 + (k % 2) * 0.2);
    g.translate(top.x, top.y, top.z);
    fronds.push(g);
  }
  // the uv runs from the stalk (v = 0) to the tip (v = 1); the texture has the tip at its top
  return { trunk, fronds: mergeGeometries(fronds) };
}

/** The power plant, built at once (see buildPlant). */
export function createPlant() {
  const steps = buildPlant();
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

/**
 * The power plant, built a piece at a time: each `yield` is a place to stop, so the figure can build it in the
 * browser's idle moments after the start instead of holding the first picture up. Returns { root, set(power, dt),
 * anchors: { core, steam, turbine, generator, lines, town }, box }.
 * power: 0 (off) … 1 (running): the control rods rise, the core glows, steam runs, the turbine spins, the town lights.
 */
export function* buildPlant() {
  const root = new THREE.Group();
  root.name = 'PowerPlant';
  const r = rng(31);

  // ── the land: paddy to the haze, the river and its mud bank, the plant's yard and the road ─────────────────
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 1600),
    new THREE.MeshStandardMaterial({ map: fieldTexture(1600 / FIELD_M), roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);
  const waves = waveNormals(256, 128, 8, 4, 41);
  waves.repeat.set(120, 4);
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 26),
    new THREE.MeshStandardMaterial({ color: '#5d7480', roughness: 0.07, metalness: 0, normalMap: waves, normalScale: new THREE.Vector2(0.45, 0.45) }),
  );
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.03, 34);
  const bank = new THREE.Mesh(new THREE.PlaneGeometry(1600, 5), new THREE.MeshStandardMaterial({ map: bankTexture(), roughness: 0.6 }));
  bank.rotation.x = -Math.PI / 2;
  bank.position.set(0, 0.025, 19);
  bank.receiveShadow = true;
  root.add(river, bank);
  const kerb = mat('#b3ada3', { roughness: 0.9 });
  const yard = new THREE.Mesh(new THREE.BoxGeometry(62, 0.3, 34), [
    kerb,
    kerb,
    new THREE.MeshStandardMaterial({ map: yardTexture(), roughness: 0.88 }),
    kerb,
    kerb,
    kerb,
  ]);
  yard.position.set(2, 0.15, -6);
  yard.receiveShadow = true;
  root.add(yard);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 160), new THREE.MeshStandardMaterial({ map: roadTexture(160 / 56), roughness: 0.85 }));
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = 0.5;
  road.position.set(30, 0.05, -30);
  road.receiveShadow = true;
  root.add(road);
  yield;

  // ── the containment building, cut open toward the viewer ─────────────────────────────────────────────────
  const RX = -15;
  const RZ = -2;
  const OPEN = THREE.MathUtils.degToRad(115);
  const AT = THREE.MathUtils.degToRad(28); // the open wedge faces the camera's side (from +z toward +x)
  const RR = 8;
  const RH = 13;
  const concrete = new THREE.MeshStandardMaterial({ map: concreteTexture({ W: 1024, H: 512, rows: 9, cols: 22, streaks: 90 }), roughness: 0.85 });
  const domeConcrete = new THREE.MeshStandardMaterial({
    map: concreteTexture({ rows: 6, cols: 28, seed: 15, streaks: 70, grime: 0 }),
    roughness: 0.85,
  });
  yield;
  const cutFace = mat('#c9c1b2', { roughness: 0.95 });
  const liner = mat('#b7c0ba', { roughness: 0.55, metalness: 0.2 });
  const reactor = new THREE.Group();
  reactor.position.set(RX, 0.3, RZ);
  root.add(reactor);
  reactor.add(cutCylinder({ r: RR, h: RH, wall: 0.8, open: OPEN, at: AT, material: concrete, inner: liner, face: cutFace }));
  const domeStart = AT + OPEN / 2 + Math.PI / 2;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(RR, 64, 20, domeStart, Math.PI * 2 - OPEN, 0, Math.PI / 2), domeConcrete);
  dome.position.y = RH;
  const domeIn = new THREE.Mesh(new THREE.SphereGeometry(RR - 0.8, 48, 16, domeStart, Math.PI * 2 - OPEN, 0, Math.PI / 2), liner.clone());
  domeIn.material.side = THREE.BackSide;
  domeIn.position.y = RH;
  reactor.add(dome, domeIn);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(RR - 0.8, 48), mat('#7f8c86', { roughness: 0.5 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  reactor.add(floor);
  // the polar crane: its ring girder round the wall and the yellow bridge across, behind the vessel
  const yellow = mat('#e2a91f', { roughness: 0.5, metalness: 0.2 });
  {
    const len = Math.PI * 2 - OPEN;
    const start = AT + OPEN / 2;
    const ringGeo = new THREE.TorusGeometry(RR - 1.15, 0.22, 8, 64, len);
    ringGeo.rotateZ(Math.PI / 2 - start - len);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, yellow);
    ring.position.y = RH - 0.6;
    const zb = -2.6;
    const span = 2 * Math.sqrt((RR - 1.15) ** 2 - zb * zb);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(span, 0.7, 0.5), yellow);
    bridge.position.set(0, RH - 0.2, zb);
    const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.2), mat('#3c4148', { metalness: 0.4, roughness: 0.5 }));
    trolley.position.set(-1.5, RH - 0.75, zb);
    reactor.add(ring, bridge, trolley);
  }
  // the reactor vessel (steel, cut open too), its glowing core of fuel rods in water, the control rods above
  const steel = new THREE.MeshStandardMaterial({ color: '#b4bcc4', metalness: 0.85, roughness: 0.28 });
  const vessel = cutCylinder({
    r: 2.4,
    h: 7.2,
    wall: 0.3,
    open: OPEN * 1.1,
    at: AT,
    material: steel,
    inner: mat('#6f7a86', { metalness: 0.5, roughness: 0.4 }),
    face: mat('#8d969f', { metalness: 0.6, roughness: 0.35 }),
  });
  vessel.position.set(0, 0.6, 0.6);
  reactor.add(vessel);
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.08, 2.08, 5.6, 32),
    new THREE.MeshStandardMaterial({
      color: '#8fe1ff',
      transparent: true,
      opacity: 0.32,
      emissive: '#2fb8ff',
      emissiveIntensity: 0.25,
      depthWrite: false,
    }),
  );
  water.position.set(0, 3.6, 0.6);
  reactor.add(water);
  const rodGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.4, 8);
  const coreMat = new THREE.MeshStandardMaterial({ color: '#d8f4ff', emissive: '#38c6ff', emissiveIntensity: 0.6, roughness: 0.4 });
  const spots = [];
  for (let x = -1.6; x <= 1.6; x += 0.36) for (let z = -1.6; z <= 1.6; z += 0.36) if (x * x + z * z < 1.8 * 1.8) spots.push([x, z]);
  const core = new THREE.InstancedMesh(rodGeo, coreMat, spots.length);
  core.name = 'ReactorCore';
  const m4 = new THREE.Matrix4();
  for (const [i, [x, z]] of spots.entries()) core.setMatrixAt(i, m4.makeTranslation(x, 2.9, z + 0.6));
  reactor.add(core);
  const coreLight = new THREE.PointLight('#5fd0ff', 0, 14, 1.6);
  coreLight.position.set(0, 3.5, 2.2);
  reactor.add(coreLight);
  const coreGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex('rgba(200,245,255,1)', 'rgba(60,190,255,0.6)'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  coreGlow.position.set(0, 3, 1.6);
  coreGlow.scale.setScalar(7);
  coreGlow.userData.noExport = true;
  reactor.add(coreGlow);
  const ctrl = new THREE.Group();
  const ctrlMat = mat('#30363d', { metalness: 0.5, roughness: 0.45 });
  for (const [x, z] of [
    [-0.9, -0.9],
    [0.9, -0.9],
    [-0.9, 0.9],
    [0.9, 0.9],
    [0, 0],
  ]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 4, 8), ctrlMat);
    rod.position.set(x, 0, z + 0.6);
    ctrl.add(rod);
  }
  ctrl.position.y = 4.3;
  reactor.add(ctrl);
  const head = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2), steel);
  head.position.set(0, 7.8, 0.6);
  head.scale.y = 0.5;
  // (the head sits above the cut vessel; drawn as a lid you can see under)
  reactor.add(head);
  // the steam generator beside it (narrow below, the wider steam drum above), the pressuriser behind, the
  // coolant pump on the cold leg, and the hot (red) and cool (blue) water pipes
  const sgProfile = [];
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    sgProfile.push(new THREE.Vector2(Math.max(0.001, 1.15 * Math.sin(a)), 1.35 - 1.15 * Math.cos(a)));
  }
  sgProfile.push(new THREE.Vector2(1.15, 5), new THREE.Vector2(1.55, 6), new THREE.Vector2(1.55, 7.6));
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    sgProfile.push(new THREE.Vector2(Math.max(0.001, 1.55 * Math.cos(a)), 7.6 + 1.55 * Math.sin(a)));
  }
  const sg = new THREE.Mesh(new THREE.LatheGeometry(sgProfile, 32), steel);
  sg.position.set(-4.2, 0, -1.8);
  reactor.add(sg);
  const pressuriser = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 3.4, 8, 20), steel);
  pressuriser.position.set(-1.5, 5.6, -4.6);
  reactor.add(pressuriser);
  const tube = (pts, color, radius, extra = {}) =>
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 40, radius, 10),
      mat(color, { roughness: 0.4, metalness: 0.2, ...extra }),
    );
  reactor.add(
    tube(
      [
        [-1.6, 5.6, 0.2],
        [-2.7, 6.2, -0.8],
        [-3.6, 6.4, -1.6],
      ],
      '#d9480f',
      0.32,
    ),
  );
  reactor.add(
    tube(
      [
        [-3.6, 2.2, -1.6],
        [-2.6, 1.6, -0.8],
        [-1.7, 1.9, 0.2],
      ],
      '#1c7ed6',
      0.32,
    ),
  );
  reactor.add(
    tube(
      [
        [-1.5, 3.4, -4.6],
        [-1.9, 2.9, -3.0],
        [-2.5, 4.6, -1.4],
        [-2.7, 6.0, -0.85],
      ],
      '#b4bcc4',
      0.12,
      { metalness: 0.8, roughness: 0.3 },
    ),
  );
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 1.3, 20), steel);
  pump.position.set(-2.75, 1.5, -0.95);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 20), mat('#2f5d8a', { roughness: 0.45, metalness: 0.3 }));
  motor.position.set(-2.75, 2.75, -0.95);
  reactor.add(pump, motor);
  // the auxiliary building behind, and the ventilation stack with its red and white bands
  const panels = new THREE.MeshStandardMaterial({
    map: concreteTexture({ base: '#d2ccbf', rows: 5, cols: 8, seed: 23, streaks: 40 }),
    roughness: 0.85,
  });
  const aux = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 9), [panels, panels, mat('#8d9096', { roughness: 0.8 }), panels, panels, panels]);
  aux.position.set(RX - 1, 4.8, RZ - 12.5);
  root.add(aux);
  const aux2 = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 7), [panels, panels, mat('#8d9096', { roughness: 0.8 }), panels, panels, panels]);
  aux2.position.set(RX - 11, 3.3, RZ - 2);
  root.add(aux2);
  const stack = new THREE.Group();
  stack.position.set(RX - 4, 9.3, RZ - 12.5);
  const stackShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 20, 24), mat('#dcd6cb', { roughness: 0.8 }));
  stackShaft.position.y = 10;
  stack.add(stackShaft);
  for (let i = 0; i < 4; i++) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.77, 0.79, 1.2, 24), mat(i % 2 ? '#f1f1ee' : '#c92a2a', { roughness: 0.6 }));
    band.position.y = 15.6 + i * 1.2;
    stack.add(band);
  }
  root.add(stack);
  // two water tanks by the road
  for (const [x, z, rad, ht] of [
    [14, -18, 2.6, 6],
    [20, -19.5, 2, 5],
  ]) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, ht, 40), mat('#e9ecef', { roughness: 0.4, metalness: 0.3 }));
    tank.position.set(x, 0.3 + ht / 2, z);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(rad, 40, 8, 0, Math.PI * 2, 0, 0.35), mat('#dee2e6', { roughness: 0.4, metalness: 0.3 }));
    lid.position.set(x, 0.3 + ht - rad * Math.cos(0.35), z);
    root.add(tank, lid);
  }

  yield;
  // ── steam line: from the steam generator, out through the wall, into the turbine hall ─────────────────────
  const steamPts = [
    new THREE.Vector3(RX - 4.2, 9.2, RZ - 1.8),
    new THREE.Vector3(RX - 1, 11.2, RZ - 3.5),
    new THREE.Vector3(RX + 7, 11, RZ - 3.4),
    new THREE.Vector3(-1, 8.6, -3.2),
    new THREE.Vector3(3.2, 5.6, -2.4),
  ];
  const steamCurve = new THREE.CatmullRomCurve3(steamPts);
  const steamPipe = new THREE.Mesh(
    new THREE.TubeGeometry(steamCurve, 80, 0.55, 14),
    new THREE.MeshStandardMaterial({ color: '#eef2f6', transparent: true, opacity: 0.42, roughness: 0.08, metalness: 0, depthWrite: false }),
  );
  steamPipe.name = 'SteamLine';
  root.add(steamPipe);
  const PUFFS = 26;
  const puffs = createSprites(glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,0.7)'), PUFFS);
  root.add(puffs.mesh);

  yield;
  // ── turbine hall: back wall, ends and half a roof on its trusses; the crane; the turbine and generator ─────
  const hall = new THREE.Group();
  hall.position.set(10, 0.3, -4);
  root.add(hall);
  const cladTex = claddingTexture();
  const clad = new THREE.MeshStandardMaterial({ map: cladTex, roughness: 0.5, metalness: 0.35 });
  const cladEnd = clad.clone();
  cladEnd.map = cladTex.clone();
  cladEnd.map.repeat.set(9 / 22, 1);
  cladEnd.map.wrapS = THREE.RepeatWrapping;
  const back = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 0.4), clad);
  back.position.set(0, 5, -4.5);
  const endL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 9), cladEnd);
  endL.position.set(-11, 5, 0);
  const endR = endL.clone();
  endR.position.x = 11;
  const roofMat = mat('#76828c', { roughness: 0.5, metalness: 0.45 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.35, 4.6), roofMat);
  roof.position.set(0, 10.15, -2.4);
  const hallFloor = new THREE.Mesh(new THREE.BoxGeometry(22, 0.2, 9), mat('#8e9b93', { roughness: 0.45 }));
  hallFloor.position.y = 0.1;
  hall.add(back, endL, endR, roof, hallFloor);
  const beamMat = mat('#59626b', { roughness: 0.5, metalness: 0.5 });
  for (let x = -11; x <= 11; x += 4.4) {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 9), beamMat);
    truss.position.set(x, 10.1, 0);
    hall.add(truss);
  }
  for (const z of [-4.1, 4.3]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(22, 0.35, 0.35), beamMat);
    rail.position.set(0, 8.4, z);
    hall.add(rail);
  }
  const edge = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.5, 0.25), beamMat);
  edge.position.set(0, 10.1, 4.4);
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 10, 0.3), beamMat);
  postL.position.set(-10.8, 5, 4.4);
  const postR = postL.clone();
  postR.position.x = 10.8;
  hall.add(edge, postL, postR);
  const crane = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 8.8), yellow);
  crane.position.set(-8.6, 8.95, 0.1);
  const hoist = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), mat('#3c4148', { metalness: 0.4, roughness: 0.5 }));
  hoist.position.set(-8.6, 8.4, -1.2);
  hall.add(crane, hoist);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(17, 1.6, 3), mat('#aaa498', { roughness: 0.85 }));
  bed.position.set(0.5, 0.9, 0);
  hall.add(bed);
  // the turbine: three stages of blades on one shaft, half-cased, turning together
  const rotor = new THREE.Group();
  rotor.position.set(-4.5, 3.6, 0);
  hall.add(rotor);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 17, 12), steel);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = 5;
  rotor.add(shaft);
  const bladeMat = new THREE.MeshStandardMaterial({ color: '#d5dbe1', metalness: 0.9, roughness: 0.22 });
  const casingMat = mat('#8796a2', { side: THREE.DoubleSide, metalness: 0.55, roughness: 0.38 });
  const stages = [
    [-2.6, 1.1, 14],
    [0, 1.5, 18],
    [2.8, 1.9, 22],
  ];
  for (const [x, rad, n] of stages) {
    const disc = new THREE.Group();
    disc.position.x = x;
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, rad, 0.08), bladeMat);
      b.position.y = rad / 2 + 0.25;
      b.rotation.y = 0.5;
      const arm = new THREE.Group();
      arm.rotation.x = (i / n) * Math.PI * 2;
      arm.add(b);
      disc.add(arm);
    }
    rotor.add(disc);
    const casing = new THREE.Mesh(new THREE.CylinderGeometry(rad + 0.55, rad + 0.55, 2.2, 32, 1, true, Math.PI, Math.PI), casingMat);
    casing.rotation.z = Math.PI / 2;
    casing.position.set(-4.5 + x, 3.6, 0);
    hall.add(casing);
    for (const dx of [-1.1, 1.1]) {
      const flange = new THREE.Mesh(new THREE.CylinderGeometry(rad + 0.7, rad + 0.7, 0.18, 32, 1, false, Math.PI, Math.PI), casingMat);
      flange.rotation.z = Math.PI / 2;
      flange.position.set(-4.5 + x + dx, 3.6, 0);
      hall.add(flange);
    }
  }
  // the generator: a big green drum on the same shaft, its stripes turning
  const genTex = (() => {
    const c = canvas(256, 64);
    const g = c.getContext('2d');
    g.fillStyle = '#2f7a4c';
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#25623c';
    for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 10, 64);
    return tex(c);
  })();
  const generator = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 1.9, 4.4, 40),
    new THREE.MeshStandardMaterial({ map: genTex, roughness: 0.38, metalness: 0.35 }),
  );
  generator.rotation.z = Math.PI / 2;
  generator.position.set(6.6, 3.6, 0);
  hall.add(generator);
  const genEnd = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.3, 40), mat('#21603a', { roughness: 0.4, metalness: 0.35 }));
  genEnd.rotation.z = Math.PI / 2;
  genEnd.position.set(8.9, 3.6, 0);
  const exciter = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 24), mat('#58626c', { roughness: 0.4, metalness: 0.5 }));
  exciter.rotation.z = Math.PI / 2;
  exciter.position.set(9.8, 3.1, 0);
  hall.add(genEnd, exciter);
  // the main transformer outside: its tank, cooling fins, oil conservator and three porcelain bushings
  const trafo = new THREE.Group();
  trafo.position.set(25, 0.3, -2);
  const gravel = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 8),
    new THREE.MeshStandardMaterial({ map: tex(mottle(256, 48, 33, 0.55, 1, 2), { repeat: [3, 3] }), color: '#c9c6bf', roughness: 1 }),
  );
  gravel.rotation.x = -Math.PI / 2;
  gravel.position.y = 0.02;
  gravel.receiveShadow = true;
  trafo.add(gravel);
  const tankMat = mat('#66726b', { roughness: 0.5, metalness: 0.35 });
  const tbox = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 2), tankMat);
  tbox.position.y = 1.3;
  trafo.add(tbox);
  const fins = [];
  for (const sz of [-1, 1])
    for (let i = 0; i < 9; i++) {
      const f = new THREE.BoxGeometry(0.06, 2.2, 0.7);
      f.translate(-1.2 + i * 0.3, 1.3, sz * 1.38);
      fins.push(f);
    }
  trafo.add(new THREE.Mesh(mergeGeometries(fins), tankMat));
  const cons = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.4, 16), tankMat);
  cons.rotation.z = Math.PI / 2;
  cons.position.set(0, 3.1, -0.7);
  trafo.add(cons);
  const porcelain = mat('#8b4a2b', { roughness: 0.25 });
  for (let i = 0; i < 3; i++) {
    const sheds = [];
    for (let k = 0; k < 6; k++) {
      const d = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 12);
      d.translate(0, 2.75 + k * 0.2, 0);
      sheds.push(d);
    }
    const core2 = new THREE.CylinderGeometry(0.12, 0.16, 1.4, 10);
    core2.translate(0, 3.2, 0);
    sheds.push(core2);
    const ins = new THREE.Mesh(mergeGeometries(sheds), porcelain);
    ins.position.set(-0.9 + i * 0.9, 0, 0.3);
    trafo.add(ins);
  }
  root.add(trafo);

  yield;
  // ── the cooling tower behind: a hyperbolic concrete shell on a ring of legs, its plume of vapour ───────────
  const TX = -3;
  const TZ = -30;
  const TH = 30;
  const Rb = 11;
  const Rt = 6.8;
  const yt = 0.78 * TH;
  const ka = yt / Math.sqrt((Rb / Rt) ** 2 - 1);
  const towerR = (y) => Rt * Math.sqrt(1 + ((y - yt) / ka) ** 2);
  const LEG = 2.2;
  const outerPts = [];
  const innerPts = [];
  for (let i = 0; i <= 28; i++) {
    const y = LEG + (i / 28) * (TH - LEG);
    outerPts.push(new THREE.Vector2(towerR(y), y));
    innerPts.push(new THREE.Vector2(towerR(y) - 0.35, y));
  }
  yield;
  const towerTex = concreteTexture({ base: '#ddd7cb', W: 1024, H: 1024, rows: 22, cols: 48, seed: 29, streaks: 220, grime: 0.18, ties: false });
  const tower = new THREE.Group();
  tower.position.set(TX, 0.3, TZ);
  root.add(tower);
  tower.add(new THREE.Mesh(new THREE.LatheGeometry(outerPts, 72), new THREE.MeshStandardMaterial({ map: towerTex, roughness: 0.88 })));
  tower.add(new THREE.Mesh(new THREE.LatheGeometry(innerPts, 72), mat('#8d8a84', { side: THREE.BackSide, roughness: 0.95 })));
  const lip = new THREE.Mesh(new THREE.TorusGeometry(towerR(TH) - 0.15, 0.28, 6, 72), mat('#cfc8bb', { roughness: 0.9 }));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = TH;
  tower.add(lip);
  const legs = [];
  const NL = 44;
  const rTop = towerR(LEG);
  for (let i = 0; i < NL; i++) {
    const a = (i / NL) * Math.PI * 2;
    const top = new THREE.Vector3(Math.cos(a) * rTop, LEG, Math.sin(a) * rTop);
    for (const s of [-1, 1]) {
      const b = a + (s * Math.PI) / NL;
      legs.push(strut(new THREE.Vector3(Math.cos(b) * (rTop + 0.4), 0, Math.sin(b) * (rTop + 0.4)), top, 0.32));
    }
  }
  tower.add(new THREE.Mesh(mergeGeometries(legs), mat('#c8c1b4', { roughness: 0.9 })));
  const basin = new THREE.Mesh(new THREE.CircleGeometry(rTop + 0.4, 64), mat('#3f5560', { roughness: 0.15 }));
  basin.rotation.x = -Math.PI / 2;
  basin.position.y = 0.06;
  const basinWall = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop + 1.2, rTop + 1.2, 0.7, 72, 1, true),
    mat('#c2bbaf', { roughness: 0.9, side: THREE.DoubleSide }),
  );
  basinWall.position.y = 0.35;
  tower.add(basin, basinWall);
  const PLUME = 22;
  const plume = createSprites(cloudTex(), PLUME, { color: '#fff3ee' });
  root.add(plume.mesh);

  yield;
  // ── power lines to the town ──────────────────────────────────────────────────────────────────────────────
  const pylonAt = [new THREE.Vector3(27, 0, -15), new THREE.Vector3(25, 0, -32), new THREE.Vector3(22, 0, -49)];
  const tipsAll = [];
  const peaks = [];
  for (const p of pylonAt) {
    const py = pylon(17);
    py.root.position.copy(p);
    py.root.rotation.y = Math.atan2(1, -0.15); // the arms across the line, which runs back toward the town
    root.add(py.root);
    py.root.updateMatrixWorld(true);
    tipsAll.push(py.tips.map((tp) => tp.clone().applyMatrix4(py.root.matrixWorld)));
    peaks.push(py.peak.clone().applyMatrix4(py.root.matrixWorld));
  }
  const wireMat = new THREE.MeshStandardMaterial({ color: '#3a3f45', metalness: 0.7, roughness: 0.35 });
  const cables = [];
  const trafoTop = [-0.9, 0, 0.9].map((dx) => new THREE.Vector3(25 + dx, 4.2, -1.7));
  const chain = [trafoTop, ...tipsAll];
  const sagCable = (a, b, keep) => {
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= a.distanceTo(b) * 0.06;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.045, 5), wireMat));
    if (keep) cables.push(curve);
  };
  for (let w = 0; w < 3; w++) for (let s = 0; s < chain.length - 1; s++) sagCable(chain[s][w], chain[s + 1][w], true);
  for (let s = 0; s < peaks.length - 1; s++) sagCable(peaks[s], peaks[s + 1], false);
  const sparks = createSprites(glowTex('rgba(255,255,230,1)', 'rgba(255,214,90,0.9)'), cables.length, { additive: true });
  root.add(sparks.mesh);

  yield;
  // ── the town: blocks of flats with water tanks on their roofs; their windows light up when the power comes ─
  const town = new THREE.Group();
  town.position.set(22, 0, -72);
  root.add(town);
  const townGround = new THREE.Mesh(
    new THREE.PlaneGeometry(64, 46),
    new THREE.MeshStandardMaterial({ map: tex(mottle(256, 12, 61, 0.7, 1), { repeat: [2, 2] }), color: '#a39a8a', roughness: 1 }),
  );
  townGround.rotation.x = -Math.PI / 2;
  townGround.position.set(0, 0.04, 2);
  town.add(townGround);
  const styles = [
    ['#efe6d6', 101, true],
    ['#f2d7b8', 102, true],
    ['#d9e2e4', 103, false],
    ['#f0e1a8', 104, true],
    ['#e9c8c0', 105, false],
    ['#e4e4dc', 106, true],
  ].map(([wall, seed, balc]) => ({ map: flatsTexture(wall, seed, false, balc), lit: flatsTexture(wall, seed, true) }));
  yield;
  const roofMatTown = mat('#a29d94', { roughness: 0.95 });
  // the buildings of one style are one mesh; each building's windows light at its own moment, read in the shader
  // from a number on its vertices (they used to be 24 materials, 48 draw calls)
  const facades = styles.map(() => []);
  const roofGeos = [];
  const tankSpots = [];
  for (let i = 0; i < 24; i++) {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const w = 6 + Math.floor(r() * 2) * 3;
    const d = 6 + Math.floor(r() * 2) * 3;
    const floors = 2 + Math.floor(r() * (row === 0 ? 3 : 4)) + (i % 7 === 3 ? 2 : 0);
    const h = floors * 3;
    const st = styles[i % styles.length];
    const geo = new THREE.BoxGeometry(w, h, d);
    // the facade's uv in metres / 12, so storeys and windows keep their size; shifted per building by whole bays
    const uv = geo.attributes.uv;
    const ou = Math.floor(r() * 4) * 0.25;
    const ov = Math.floor(r() * 4) * 0.25;
    for (let f = 0; f < 6; f++) {
      const across = f < 2 ? d : w;
      for (let k = 0; k < 4; k++) {
        const j = f * 4 + k;
        uv.setXY(j, uv.getX(j) * (across / 12) + ou, uv.getY(j) * (h / 12) + ov);
      }
    }
    const x = col * 9.5 - 24 + r() * 1.5;
    const z = row * 10.5 - 14 + r() * 1.5;
    const at = 0.55 + 0.4 * (Math.abs(col - 2.5) / 2.5) * 0.6 + r() * 0.15;
    geo.translate(x, h / 2, z);
    for (const [mi, list] of splitByGroups(geo))
      for (const g of list) {
        if (mi === 2 || mi === 3) roofGeos.push(g);
        else {
          g.setAttribute('aAt', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(at), 1));
          facades[styles.indexOf(st)].push(g);
        }
      }
    for (let k = 0; k < 1 + Math.floor(r() * 2); k++) tankSpots.push([x + (r() - 0.5) * (w - 2), h, z + (r() - 0.5) * (d - 2)]);
  }
  const lit = { value: 0 };
  const facadeMeshes = styles.map((st, k) => {
    const mesh = new THREE.Mesh(mergeGeometries(facades[k]), facadeMaterial(st, lit));
    town.add(mesh);
    return mesh;
  });
  town.add(new THREE.Mesh(mergeGeometries(roofGeos), roofMatTown));
  const tanks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 12), mat('#2a2e33', { roughness: 0.6 }), tankSpots.length);
  for (const [i, [x, y, z]] of tankSpots.entries()) tanks.setMatrixAt(i, m4.makeTranslation(x, y + 0.6, z));
  town.add(tanks);
  // the street lamps: one shared bulb material (they light together), merged into one mesh below
  const lampMat = new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: '#ffc94d', emissiveIntensity: 0 });
  const poleMat = mat('#4a4f55', { metalness: 0.5, roughness: 0.5 });
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 5, 6);
  const bulbGeo = new THREE.SphereGeometry(0.3, 12, 8);
  for (let i = 0; i < 9; i++) {
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(-26 + i * 6.5, 2.5, 22);
    const bulb = new THREE.Mesh(bulbGeo, lampMat);
    bulb.position.set(-26 + i * 6.5, 5.1, 22);
    town.add(pole, bulb);
  }

  yield;
  // ── trees: along the bank, round the yard, homesteads among the fields, a line of trees in the haze ─────────
  const keepOut = (x, z) =>
    (x > -36 && x < 40 && z > -50 && z < 15) || // the plant
    (x > -14 && x < 56 && z > -98 && z < -44) || // the town
    (z > 16 && z < 48); // the bank and the river
  const crownNear = crownGeometry(5, 5, 1);
  const crownFar = crownGeometry(6, 3, 0);
  const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const barkMat = mat('#6b5240', { roughness: 0.95 });
  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.14, 1, 6);
  trunkGeo.translate(0, 0.5, 0);
  const near = [];
  const far = [];
  const palms = [];
  const huts = [];
  const plant = (x, z, size, list) => list.push([x, z, size, r() * 6]);
  for (let i = 0; i < 26; i++) {
    const x = -90 + i * 7 + r() * 4;
    const z = 15.5 + r() * 2.5;
    if (x > -40 && x < 50) continue; // keep the view of the plant open
    if (r() < 0.4) plant(x, z, 0.9 + r() * 0.3, palms);
    else plant(x, z, 3 + r() * 2, near);
  }
  for (const [x, z] of [
    [-34, -20],
    [-33, -34],
    [-30, -46],
    [38, -8],
    [-34, 2],
    [-20, -48],
    [8, -50],
  ])
    plant(x + r() * 2, z + r() * 2, 3 + r() * 2, near);
  // homesteads: a clump of trees round a few houses with tin roofs, on a patch of bare earth
  const yardDecal = new THREE.MeshStandardMaterial({
    map: glowTex('rgba(150,120,85,1)', 'rgba(150,120,85,0.9)'),
    transparent: true,
    depthWrite: false,
    roughness: 1,
  });
  let made = 0;
  for (let tries = 0; made < 26 && tries < 400; tries++) {
    const x = -260 + r() * 520;
    const z = -320 + r() * 330;
    if (keepOut(x, z) || (x > -60 && x < 70 && z > -110 && z < 15)) continue;
    made++;
    const dist = Math.hypot(x - 5, z + 20);
    const ring = 9 + r() * 7;
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(ring * 2.6, ring * 2.6), yardDecal);
    decal.rotation.x = -Math.PI / 2;
    decal.position.set(x, 0.06, z);
    root.add(decal);
    for (let k = 0; k < 14; k++) {
      const a = r() * Math.PI * 2;
      const rr = ring * (0.4 + r() * 0.75);
      const tx = x + Math.cos(a) * rr;
      const tz = z + Math.sin(a) * rr;
      if (r() < 0.3) plant(tx, tz, 0.9 + r() * 0.35, palms);
      else plant(tx, tz, 3.5 + r() * 2.5, dist < 140 ? near : far);
    }
    for (let k = 0; k < 2 + Math.floor(r() * 3); k++) huts.push([x + (r() - 0.5) * ring, z + (r() - 0.5) * ring, r() * Math.PI]);
  }
  // the tree line in the haze, all round the far side
  for (let i = 0; i < 240; i++) {
    const a = Math.PI + (i / 240) * Math.PI * 1.15 - 0.08;
    const rr = 330 + r() * 160;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr * 0.9 - 40;
    if (z > 60) continue;
    plant(x, z, 7 + r() * 5, far);
  }
  const greens = ['#4d7a33', '#3e6a2c', '#5b8436', '#46722f', '#6a8a3a', '#3a6230'];
  const place = (list, crown, palm = false, cast = true) => {
    if (!list.length) return;
    const top = new THREE.InstancedMesh(palm ? palmGeo.fronds : crown, palm ? frondMat : leafMat, list.length);
    const stem = new THREE.InstancedMesh(palm ? palmGeo.trunk : trunkGeo, palm ? palmBark : barkMat, list.length);
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    for (const [i, [x, z, s, rot]] of list.entries()) {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      if (palm) {
        m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s, s));
        top.setMatrixAt(i, m4);
        stem.setMatrixAt(i, m4);
        c.setHSL(0.24 + r() * 0.04, 0.35, 0.75 + r() * 0.2);
      } else {
        const trunkH = s * 0.55;
        m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s * 0.7, trunkH, s * 0.7));
        stem.setMatrixAt(i, m4);
        m4.compose(new THREE.Vector3(x, trunkH * 0.82, z), q, new THREE.Vector3(s, s * (0.8 + r() * 0.3), s));
        top.setMatrixAt(i, m4);
        c.set(greens[Math.floor(r() * greens.length)]).offsetHSL(0, 0, (r() - 0.5) * 0.06);
      }
      top.setColorAt(i, c);
    }
    top.computeBoundingSphere();
    stem.computeBoundingSphere();
    top.castShadow = stem.castShadow = cast;
    top.receiveShadow = stem.receiveShadow = true;
    root.add(top, stem);
    return top;
  };
  const palmGeo = palmGeometry();
  const frondMat = new THREE.MeshStandardMaterial({ map: frondTexture(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 });
  const palmBark = mat('#857563', { roughness: 0.95 });
  place(near, crownNear);
  place(far, crownFar, false, false); // in the haze, beyond the shadows' reach
  place(palms, null, true);
  // the houses: walls of mud, brick or painted tin; roofs of corrugated tin that catch the low sun
  const hutBody = new THREE.BoxGeometry(1, 1, 1);
  hutBody.translate(0, 0.5, 0);
  const gable = new THREE.Shape([new THREE.Vector2(-0.62, 0), new THREE.Vector2(0.62, 0), new THREE.Vector2(0, 0.48)]);
  const hutRoof = new THREE.ExtrudeGeometry(gable, { depth: 1, bevelEnabled: false });
  hutRoof.translate(0, 0, -0.5);
  const bodies = new THREE.InstancedMesh(hutBody, mat('#ffffff', { roughness: 0.9 }), huts.length);
  const roofs = new THREE.InstancedMesh(hutRoof, mat('#ffffff', { roughness: 0.32, metalness: 0.65 }), huts.length);
  const wallCols = ['#b48a62', '#a8653f', '#c9b089', '#7d93a8', '#b9a48a'];
  const roofCols = ['#b9c0c4', '#a5adb2', '#9a6a4c', '#c7ccd0', '#6f8fa8'];
  const c = new THREE.Color();
  for (const [i, [x, z, rot]] of huts.entries()) {
    const w = 3 + r() * 2;
    const d = 5 + r() * 3;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(w, 2.3, d));
    bodies.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, 2.3, z), q, new THREE.Vector3(w * 1.08, 2.4, d * 1.08));
    roofs.setMatrixAt(i, m4);
    bodies.setColorAt(i, c.set(wallCols[Math.floor(r() * wallCols.length)]));
    roofs.setColorAt(i, c.set(roofCols[Math.floor(r() * roofCols.length)]));
  }
  bodies.computeBoundingSphere();
  roofs.computeBoundingSphere();
  bodies.receiveShadow = roofs.receiveShadow = true;
  root.add(bodies, roofs);

  yield;
  // ── country boats on the river, one under a patched sail ───────────────────────────────────────────────────
  const wood = mat('#4e3626', { roughness: 0.8 });
  const sailTex = (() => {
    const cv = canvas(128, 128);
    const g = cv.getContext('2d');
    const rr = rng(55);
    const cols = ['#c9a77c', '#b88c62', '#d8c2a0', '#9c6b4f', '#c4b08a', '#a97b5a'];
    for (let x = 0; x < 128; x += 32)
      for (let y = 0; y < 128; y += 32) {
        g.fillStyle = cols[Math.floor(rr() * cols.length)];
        g.fillRect(x, y, 32, 32);
      }
    g.strokeStyle = 'rgba(60,40,30,0.4)';
    for (let x = 0; x <= 128; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 128);
      g.moveTo(0, x);
      g.lineTo(128, x);
      g.stroke();
    }
    return tex(cv);
  })();
  for (const [x, z, rot, sail] of [
    [-42, 29, 0.15, true],
    [58, 38, -0.2, false],
    [-80, 41, 0.05, false],
  ]) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood);
    hull.scale.set(5, 0.9, 1.1);
    hull.position.y = 0.45;
    boat.add(hull);
    const hood = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.95, 3.2, 16, 1, true, -Math.PI / 2, Math.PI),
      mat('#a88552', { roughness: 0.9, side: THREE.DoubleSide }),
    );
    hood.rotation.z = Math.PI / 2;
    hood.position.set(-0.6, 0.5, 0);
    boat.add(hood);
    if (sail) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 7, 6), wood);
      mast.position.set(1.4, 3.9, 0);
      const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 5, 4, 4),
        new THREE.MeshStandardMaterial({ map: sailTex, side: THREE.DoubleSide, roughness: 0.9 }),
      );
      const p = cloth.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, 0.5 * Math.cos((p.getX(i) / 4.2) * Math.PI)); // the wind fills it
      cloth.geometry.computeVertexNormals();
      cloth.rotation.y = Math.PI / 2 + 0.4;
      cloth.position.set(1.5, 4.4, 0.2);
      boat.add(mast, cloth);
    }
    boat.position.set(x, 0, z);
    boat.rotation.y = rot;
    root.add(boat);
  }

  yield;
  // ── shadows, then the still parts merged ─────────────────────────────────────────────────────────────────
  // everything takes shadows; what is big enough for its shadow to be seen casts one (not the ground, floors, water,
  // the thin wires, the far houses and decals)
  const flat = new Set([ground, river, bank, yard, road, floor, water, hallFloor, bed, gravel, townGround, basin, steamPipe]);
  const thin = new Set([wireMat, yardDecal, lampMat, poleMat]);
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.noExport) return;
    o.receiveShadow = o !== water && o !== steamPipe;
    o.castShadow = !flat.has(o) && !thin.has(o.material);
  });
  for (const m of facadeMeshes) m.castShadow = m.receiveShadow = true;
  bake(ctrl);
  bake(rotor);
  bake(root, [ctrl, rotor, generator, ...facadeMeshes, puffs.mesh, plume.mesh, sparks.mesh]);
  noiseTables.clear();

  // ── running it ────────────────────────────────────────────────────────────────────────────────────────────
  let spin = 0;
  let clock = 0;
  const tmpV = new THREE.Vector3();
  const smooth = (a, b, x) => {
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  const towerTop = new THREE.Vector3(TX, TH + 0.3, TZ);
  /** power 0…1; dt: seconds since the last call (the turbine and the steam move on). */
  function set(power, dt = 0) {
    clock += dt;
    const k = power;
    ctrl.position.y = 4.3 + 2.4 * smooth(0, 0.4, k);
    coreMat.emissiveIntensity = 0.5 + 2.2 * smooth(0.05, 0.5, k);
    coreLight.intensity = 60 * smooth(0.05, 0.5, k);
    coreGlow.material.opacity = 0.25 + 0.75 * smooth(0.05, 0.5, k);
    const steam = smooth(0.25, 0.6, k);
    puffs.mesh.visible = steam > 0.01;
    if (puffs.mesh.visible) {
      for (let i = 0; i < PUFFS; i++) {
        const u = (i / PUFFS + clock * 0.22) % 1;
        steamCurve.getPointAt(u, tmpV);
        puffs.set(i, tmpV.x, tmpV.y, tmpV.z, 1.2, steam * 0.85 * Math.sin(Math.PI * Math.min(1, u * 1.15)));
      }
      puffs.update();
    }
    spin += dt * 9 * smooth(0.35, 0.8, k);
    rotor.rotation.x = spin;
    generator.rotation.x = spin;
    const elec = smooth(0.6, 0.85, k);
    sparks.mesh.visible = elec > 0.01;
    if (sparks.mesh.visible) {
      for (const [i, cable] of cables.entries()) {
        cable.getPoint((clock * 0.45 + i * 0.137) % 1, tmpV);
        sparks.set(i, tmpV.x, tmpV.y, tmpV.z, 1.6, elec);
      }
      sparks.update();
    }
    lit.value = k; // each building's windows light at their own moment (in the facade shader)
    lampMat.emissiveIntensity = 2 * smooth(0.7, 0.85, k);
    // the cooling tower's vapour: always a little, a full billowing plume drifting with the wind when running
    const vap = 0.3 + 0.7 * smooth(0.3, 0.8, k);
    for (let i = 0; i < PLUME; i++) {
      const u = (i / PLUME + clock * 0.05) % 1;
      plume.set(
        i,
        towerTop.x + Math.sin(i * 1.7) * 2.2 + u * u * 16,
        towerTop.y + 1 + u * 20,
        towerTop.z + Math.cos(i * 2.3) * 2.2 - u * 4,
        (9 + u * 16) * (0.7 + 0.3 * vap),
        vap * 0.85 * Math.sin(Math.PI * Math.min(1, u * 1.25 + 0.08)) ** 0.7,
        i * 1.7 + clock * 0.03,
      );
    }
    plume.update();
  }
  set(0, 0);

  const anchor = (obj, local) => () => obj.localToWorld(tmpV.copy(local));
  return {
    root,
    set,
    anchors: {
      core: anchor(reactor, new THREE.Vector3(0, 3.2, 1.6)),
      reactor: anchor(reactor, new THREE.Vector3(0, RH + RR * 0.7, 0)),
      steam: () => steamCurve.getPointAt(0.55, tmpV),
      turbine: anchor(hall, new THREE.Vector3(-4.5, 5.4, 0)),
      generator: anchor(hall, new THREE.Vector3(6.6, 5.5, 0)),
      lines: () => tmpV.copy(tipsAll[0][2]),
      town: anchor(town, new THREE.Vector3(-6, 8, 0)),
    },
    /** What the camera frames: the reactor, the hall, the tower's top and the first pylon. */
    box: new THREE.Box3(new THREE.Vector3(-24, 0, -32), new THREE.Vector3(32, 31, 6)),
  };
}

/** The flats' walls, their windows lit as the power comes: smoothstep(at, at + 0.12, power) per building. */
function facadeMaterial(st, lit) {
  const m = new THREE.MeshStandardMaterial({ map: st.map, emissiveMap: st.lit, emissive: '#ffffff', emissiveIntensity: 1.1, roughness: 0.85 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uLit = lit;
    shader.vertexShader = `attribute float aAt;\nvarying float vAt;\n${shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvAt = aAt;')}`;
    shader.fragmentShader = `uniform float uLit;\nvarying float vAt;\n${shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= smoothstep(vAt, vAt + 0.12, uLit);',
    )}`;
  };
  m.customProgramCacheKey = () => 'me-facade';
  return m;
}

function glowTex(inner, outer) {
  const S = 128;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.35, outer);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return tex(c);
}
/** A billow of vapour: soft lumps, lit on top, a little grey and blue underneath. */
function cloudTex() {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const r = rng(71);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const d = r() ** 0.7 * S * 0.24;
    const x = S / 2 + Math.cos(a) * d;
    const y = S / 2 + Math.sin(a) * d * 0.8;
    const rad = S * (0.1 + r() * 0.13);
    const lit = 1 - (y - S * 0.25) / (S * 0.6);
    const gr = g.createRadialGradient(x, y - rad * 0.3, 0, x, y, rad);
    const k = Math.max(0, Math.min(1, lit));
    gr.addColorStop(0, `rgba(${Math.round(225 + 30 * k)},${Math.round(222 + 28 * k)},${Math.round(228 + 20 * k)},0.55)`);
    gr.addColorStop(0.6, `rgba(${Math.round(200 + 40 * k)},${Math.round(198 + 40 * k)},${Math.round(212 + 30 * k)},0.3)`);
    gr.addColorStop(1, 'rgba(210,205,220,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
  }
  return tex(c);
}
