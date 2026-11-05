// The optics of the figure, pure functions (unit-tested in test/unit/reflection-laws.test.mjs): the law of reflection
// as a vector formula, Snell's law, the exact Fresnel reflectance of unpolarised light, and the waves on the lake.
// Directions are plain { x, y, z } in the scene's axes: y is up, the water is the plane y = 0, O is the origin.

export const N_WATER = 1.33; // refractive index of water (air: 1), used for প্রতিসরণ and the Fresnel numbers
export const N_GLASS = 1.5; // the book's glass, for checking its 4–5 %

export const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
export const rad = (d) => d * RAD;
export const deg = (r) => r / RAD;

/** Unit vector along the sheet (the plane of incidence) on the water: phi = 0 is along +x. */
export const along = (phi) => ({ x: Math.cos(rad(phi)), y: 0, z: Math.sin(rad(phi)) });

/** Unit vector from O toward the light (toward X): theta from the normal, on the −along side of the sheet. */
export function toLight(theta, phi) {
  const u = along(phi);
  const s = Math.sin(rad(theta));
  const c = Math.cos(rad(theta));
  return { x: -u.x * s, y: c, z: -u.z * s };
}

export const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
export function normalize(a) {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}

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

/** Snell's law: the angle in the water (degrees), n sin(out) = sin(in). */
export const snell = (theta, n = N_WATER) => deg(Math.asin(Math.sin(rad(theta)) / n));

/** The refracted ray's direction from O, into the water, in the sheet. */
export function refracted(theta, phi, n = N_WATER) {
  const u = along(phi);
  const a = rad(snell(theta, n));
  return { x: u.x * Math.sin(a), y: -Math.cos(a), z: u.z * Math.sin(a) };
}

/** Fresnel: the fraction of unpolarised light reflected from air into a medium of index n at incidence theta (deg). */
export function fresnel(theta, n = N_WATER) {
  if (theta >= 90) return 1;
  const c = Math.cos(rad(theta));
  const ct = Math.sqrt(1 - (1 - c * c) / (n * n));
  const rs = (c - n * ct) / (c + n * ct);
  const rp = (ct - n * c) / (ct + n * c);
  return (rs * rs + rp * rp) / 2;
}
/** The reflected share as a whole percent, as the panel says it (প্রায়). */
export const percent = (theta, n = N_WATER) => Math.round(fresnel(theta, n) * 100);

// ── the waves ────────────────────────────────────────────────────────────────────────────────────────────────
// Eight sine waves, the same ones in this file (for the rays) and in the water's shader (for the picture): what
// breaks up the mountain's reflection is what scatters the rays. Slope a·k of each; the slopes add up to about 0.11
// (rms), peaks near 0.3, which is about ±17° at the steepest: strong ripples, seen from close.
const SPEC = [
  [46, 0.07, 96],
  [31, 0.07, 122],
  [22, 0.065, 74],
  [15, 0.06, 138],
  [10.5, 0.05, 58],
  [7.5, 0.045, 112],
  [5.2, 0.04, 150],
  [3.6, 0.035, 86],
];
const G = 26; // the waves' speed is sqrt(g/k): this g suits the scene's scale and keeps them calm to watch
/** Each wave: { kx, kz, w, a }: wave vector, angular speed, height. */
export const WAVES = SPEC.map(([length, slope, dir]) => {
  const k = TAU / length;
  return { kx: k * Math.cos(rad(dir)), kz: k * Math.sin(rad(dir)), w: Math.sqrt(G * k), a: slope / k };
});

/** The slope of the water (dh/dx, dh/dz) at x, z at time t, with the waves at strength wind (0 … 1); out is reused. */
export function slopeAt(x, z, t, wind, out = { x: 0, z: 0 }) {
  let sx = 0;
  let sz = 0;
  for (const w of WAVES) {
    const c = w.a * Math.cos(w.kx * x + w.kz * z - w.w * t);
    sx += w.kx * c;
    sz += w.kz * c;
  }
  out.x = sx * wind;
  out.z = sz * wind;
  return out;
}
/** The height of the water at x, z. */
export function heightAt(x, z, t, wind) {
  let h = 0;
  for (const w of WAVES) h += w.a * Math.sin(w.kx * x + w.kz * z - w.w * t);
  return h * wind;
}
/** The unit normal of the little facet of water at x, z. */
export function facetNormal(x, z, t, wind) {
  const s = slopeAt(x, z, t, wind);
  return normalize({ x: -s.x, y: 1, z: -s.z });
}
/**
 * One ray of a parallel bundle reflected at its own facet: { n, r, i } with the facet's normal, the reflected
 * direction and the angle of incidence there (the same angle comes back: the law holds at every facet). A rare facet
 * that would send the light down into the water is eased flat (the ray would only strike the next wave).
 */
export function facetReflect(d, x, z, t, wind) {
  let k = wind;
  for (let i = 0; i < 6; i++) {
    const n = facetNormal(x, z, t, k);
    const r = reflect(d, n);
    if (r.y > 0.08 || i === 5) return { n, r, i: angleToNormal(d, n) };
    k *= 0.6;
  }
  return null;
}

/**
 * facetReflect without making objects, for the rays redrawn every frame: d is (dx, dy, dz), the result goes into out
 * as { nx, ny, nz, rx, ry, rz }.
 */
export function facetInto(out, dx, dy, dz, x, z, t, wind) {
  let hx = 0;
  let hz = 0;
  for (const w of WAVES) {
    const c = w.a * Math.cos(w.kx * x + w.kz * z - w.w * t);
    hx += w.kx * c;
    hz += w.kz * c;
  }
  let k = wind;
  for (let i = 0; i < 6; i++) {
    const nx0 = -hx * k;
    const nz0 = -hz * k;
    const l = Math.sqrt(nx0 * nx0 + 1 + nz0 * nz0);
    out.nx = nx0 / l;
    out.ny = 1 / l;
    out.nz = nz0 / l;
    const q = 2 * (dx * out.nx + dy * out.ny + dz * out.nz);
    out.rx = dx - q * out.nx;
    out.ry = dy - q * out.ny;
    out.rz = dz - q * out.nz;
    if (out.ry > 0.08) break;
    k *= 0.6;
  }
  return out;
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
