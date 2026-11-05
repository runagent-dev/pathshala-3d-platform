// The optics of the figure, pure functions (unit-tested in test/unit/reflection-laws.test.mjs): the law of reflection
// as a vector formula, the waves of the picture, and the magnifier's cross-section of the surface. Directions are plain
// { x, y, z } in the scene's axes: y is up, the water is the plane y = 0, O is the origin.

export const N_WATER = 1.33; // refractive index of water, for how much the lake mirrors

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
export const rad = (d) => d * RAD;
export const deg = (r) => r / RAD;

/** Unit vector along the sheet (the plane of incidence) on the water: phi = 0 is along +x. */
export const along = (phi) => ({ x: Math.cos(rad(phi)), y: 0, z: Math.sin(rad(phi)) });

/** Unit vector from O toward X: theta from the normal, on the −along side of the sheet. */
export function toLight(theta, phi) {
  const u = along(phi);
  const s = Math.sin(rad(theta));
  const c = Math.cos(rad(theta));
  return { x: -u.x * s, y: c, z: -u.z * s };
}

export const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

/** The law of reflection: d is the direction the light travels, n a unit normal. r = d − 2 (d·n) n. */
export function reflect(d, n) {
  const k = 2 * dot(d, n);
  return { x: d.x - k * n.x, y: d.y - k * n.y, z: d.z - k * n.z };
}

/** Angle in degrees between a line along v and the unit normal n (0 … 90). */
export function angleToNormal(v, n) {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return deg(Math.acos(Math.min(1, Math.abs(dot(v, n)) / l)));
}

/** Distance of the tip of v from the plane through the origin with unit normal m (0: v lies in the plane). */
export const offPlane = (v, m) => Math.abs(dot(v, m));

/** The unit normal of the sheet: it holds the normal of the water and the ray. */
export const sheetNormal = (phi) => ({ x: -Math.sin(rad(phi)), y: 0, z: Math.cos(rad(phi)) });

/** The reflected ray's direction from O on flat water: the light's direction reflected in the up normal. */
export function reflected(theta, phi) {
  const l = toLight(theta, phi);
  return reflect({ x: -l.x, y: -l.y, z: -l.z }, { x: 0, y: 1, z: 0 });
}

/** In the sheet, the direction at signed angle a (degrees) from the normal, + toward +along: { s, y }. */
export const sheetDir = (a) => ({ s: Math.sin(rad(a)), y: Math.cos(rad(a)) });

// ── the waves of the picture ─────────────────────────────────────────────────────────────────────────────────
// Eight sine waves for the water's shader, crossing each other (10° to 170°), so no two crests line up. The slopes add up
// to about 0.045 rms: real ripples on a lake, which smear the mirror image into a long shimmering streak.
const SPEC = [
  [52, 0.024, 74],
  [37, 0.024, 118],
  [26, 0.024, 38],
  [18, 0.022, 146],
  [12.5, 0.022, 12],
  [8.7, 0.02, 96],
  [6, 0.018, 168],
  [4.1, 0.016, 58],
];
const G = 26; // the waves' speed is sqrt(g/k): this g suits the scene's scale and keeps them calm to watch
/** Each wave: { kx, kz, w, a, slope }: wave vector, angular speed, height, steepness. */
export const WAVES = SPEC.map(([length, slope, dir]) => {
  const k = TAU / length;
  return { kx: k * Math.cos(rad(dir)), kz: k * Math.sin(rad(dir)), w: Math.sqrt(G * k), a: slope / k, slope };
});
/** The root-mean-square slope of the water: sqrt(Σ slope² / 2). */
export const rmsSlope = (waves = WAVES) => Math.sqrt(waves.reduce((s, w) => s + w.slope * w.slope, 0) / 2);

// ── the magnifier: the water's surface, seen from the side ─────────────────────────────────────────────────────
// চিত্র ৮.০৭ as a drawing: three parallel rays fall on a cross-section of the surface and are traced to it. At strength 0
// it is a straight line. At strength 1 it is the wavy line below, far steeper than the lake's waves (said in the callout),
// and each ray meets it at its own slope. Lengths are the callout's drawing units, x along the surface, y up, the
// undisturbed surface at y = 0. The spacing keeps a reflected ray clear of the next incoming one.
export const LOUPE = { theta: 50, hits: [-120, 0, 120], in: 66, out: 84, normal: 90, sway: 0.9 };

// [x, height, slope] of the wavy line: it passes through each ray's point, leaning −32°, −9° and +15° there
const KNOTS = [
  [-200, 2, 0],
  [-165, -7, 0],
  [-120, 0, Math.tan(rad(32))],
  [-85, 13, 0],
  [-42, -9, 0],
  [0, 0, Math.tan(rad(9))],
  [18, 3, 0],
  [52, -8, 0],
  [96, 9, 0],
  [120, 0, -Math.tan(rad(15))],
  [152, -8, 0],
  [200, -2, 0],
];

/** The wavy line at x: height into wave.h, slope into wave.m (a cubic through the knots). No objects are made. */
const wave = { h: 0, m: 0 };
function waveAt(x, strength, time) {
  const c = Math.max(KNOTS[0][0], Math.min(KNOTS[KNOTS.length - 1][0], x));
  let i = 0;
  while (i < KNOTS.length - 2 && c > KNOTS[i + 1][0]) i++;
  const k0 = KNOTS[i];
  const k1 = KNOTS[i + 1];
  const x0 = k0[0];
  const h0 = k0[1];
  const m0 = k0[2];
  const h1 = k1[1];
  const m1 = k1[2];
  const d = k1[0] - x0;
  const u = (c - x0) / d;
  const u2 = u * u;
  const u3 = u2 * u;
  const h = (2 * u3 - 3 * u2 + 1) * h0 + (u3 - 2 * u2 + u) * d * m0 + (3 * u2 - 2 * u3) * h1 + (u3 - u2) * d * m1;
  const m = ((6 * u2 - 6 * u) * h0) / d + (3 * u2 - 4 * u + 1) * m0 + ((6 * u - 6 * u2) * h1) / d + (3 * u2 - 2 * u) * m1;
  const a = 0.04 * c + 0.9 * time; // a slow sway, so that the water is alive
  wave.h = strength * (h + LOUPE.sway * Math.sin(a));
  wave.m = strength * (m + LOUPE.sway * 0.04 * Math.cos(a));
  return wave;
}
/** Height of the magnified surface at x. */
export const loupeHeight = (x, strength, time = 0) => waveAt(x, strength, time).h;

export const LOUPE_FIELDS = 8;
/**
 * Traces the rays: for each, into out at i × 8: the point it meets the surface (x, y), the normal's lean there in degrees
 * (+ toward +x), the normal (nx, ny), the reflected ray (rx, ry) and the angle of incidence. out is reused.
 */
export function loupeInto(out, strength, time = 0) {
  const dx = Math.sin(rad(LOUPE.theta));
  const dy = -Math.cos(rad(LOUPE.theta));
  for (let i = 0; i < LOUPE.hits.length; i++) {
    const sx = LOUPE.hits[i] - dx * LOUPE.in;
    const sy = -dy * LOUPE.in;
    // walk down the ray to the first point under the surface, then close in on the surface
    let a = 0;
    let b = 4;
    while (sy + dy * b > waveAt(sx + dx * b, strength, time).h && b < LOUPE.in * 2) {
      a = b;
      b += 4;
    }
    for (let n = 0; n < 24; n++) {
      const mid = (a + b) / 2;
      if (sy + dy * mid > waveAt(sx + dx * mid, strength, time).h) a = mid;
      else b = mid;
    }
    const hx = sx + (dx * (a + b)) / 2;
    const m = waveAt(hx, strength, time).m;
    const l = Math.hypot(m, 1);
    const nx = -m / l;
    const ny = 1 / l;
    const c = dx * nx + dy * ny;
    const o = i * LOUPE_FIELDS;
    out[o] = hx;
    out[o + 1] = wave.h;
    out[o + 2] = deg(Math.atan2(nx, ny));
    out[o + 3] = nx;
    out[o + 4] = ny;
    out[o + 5] = dx - 2 * c * nx;
    out[o + 6] = dy - 2 * c * ny;
    out[o + 7] = deg(Math.acos(Math.min(1, Math.abs(c))));
  }
  return out;
}
/** The widest angle between two reflected rays, degrees. */
export function loupeSpread(rays) {
  let c = 1;
  for (let i = 0; i < LOUPE.hits.length; i++)
    for (let j = 0; j < i; j++) {
      const a = i * LOUPE_FIELDS;
      const b = j * LOUPE_FIELDS;
      c = Math.min(c, rays[a + 5] * rays[b + 5] + rays[a + 6] * rays[b + 6]);
    }
  return deg(Math.acos(Math.max(-1, c)));
}

/** Fisher–Yates on a copy. */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
