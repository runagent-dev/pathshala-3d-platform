// The physics of the figure, pure functions (unit-tested in test/unit/refraction-of-light.test.mjs): the book's table
// ৯.০১, v = c/n, the second law n₁ sin θ₁ = n₂ sin θ₂ applied at every boundary a ray crosses, the law of reflection for
// the weak reflected ray, and how much light reflects (Fresnel, for the line's strength only). Centimetres; the ray
// lies in the plane z = 0 and comes down from the left (−x); angles in degrees from the normal (the vertical).

export const C = 3e8; // m/s, as the book takes it (p.243: 3×10⁸ m/s in practice)

/** টেবিল ৯.০১, in the book's order. */
export const TABLE = [
  { id: 'vacuum', n: 1.0 },
  { id: 'air', n: 1.00029 },
  { id: 'water', n: 1.33 },
  { id: 'glass', n: 1.52 },
  { id: 'diamond', n: 2.42 },
];

/**
 * The second media the figure can show. `water`, `glass`, `diamond` are the book's table; `n16` is the উদাহরণ's
 * ভিন্ন মাধ্যম with n = 1.6 (চিত্র ৯.০৪ a); `nq` is চিত্র ৯.০৪ (b)'s unknown medium, n = sin 60° / sin 45°, so that a
 * ray at 60° goes in at exactly 45°.
 */
export const MEDIA = {
  water: { n: 1.33, look: 'water' },
  glass: { n: 1.52, look: 'glass' },
  diamond: { n: 2.42, look: 'diamond' },
  n16: { n: 1.6, look: 'other' },
  nq: { n: Math.sin(Math.PI / 3) / Math.sin(Math.PI / 4), look: 'other' },
};
export const CHOOSABLE = ['water', 'glass', 'diamond'];

/** Where things are (cm). O: the point of incidence, the middle of the top face; the torch rides an arc round it. */
export const TOP = 7; // the block's top face (and, in the last step, the water's surface)
export const BLOCK = { halfLength: 10, height: TOP, halfDepth: 4.5 };
export const SLAB = 3.6; // the last step: a thinner glass slab under the water, its top here
export const O = Object.freeze({ x: 0, y: TOP, z: 0 });
export const ARC_R = 15; // the arc the torch rides
export const APERTURE = 11.2; // the torch's window, from O
export const MIN_ANGLE = 0;
export const MAX_ANGLE = 80;
export const START_ANGLE = 50;
export const PRESETS = [30, 50, 70]; // the angles the Measure (মাপো) action goes to, in turn
export const REFLECT_LEN = 9; // how far the weak reflected ray is drawn

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
export const round = (x, places = 2) => Number(Number(x).toFixed(places));
/** Four significant figures (a sine as the figure shows it). */
export const sig4 = (x) => Number(Number(x).toPrecision(4));
export const clampAngle = (a) => Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, Number.isFinite(+a) ? +a : START_ANGLE));

/** v = c/n (m/s). */
export const speedIn = (n) => C / n;

/** The speed as the book writes it: mantissa × 10⁸ m/s (two decimals; the book prints 3/1.52 as 2, the figure 1.97). */
export const speedMantissa = (n) => round(speedIn(n) / 1e8, 2);

/**
 * The second law, n₁ sin θ₁ = n₂ sin θ₂: the angle in the second medium (degrees), or null when no light goes in
 * (sin θ₂ would be more than 1: it cannot happen from a lighter into a denser medium).
 */
export function refractAngle(theta1, n1, n2) {
  const s = (n1 * Math.sin(rad(theta1))) / n2;
  return s > 1 + 1e-12 ? null : deg(Math.asin(Math.min(1, s)));
}

/** The relative refractive index of medium 2 with respect to medium 1: n₂ / n₁ (the book's 1.14 for glass in water). */
export const relative = (n2, n1) => n2 / n1;

/** The fraction of light reflected at a boundary (unpolarised, Fresnel), for the reflected line's strength. */
export function reflectance(theta1, n1, n2) {
  const t2 = refractAngle(theta1, n1, n2);
  if (t2 == null) return 1;
  const ci = Math.cos(rad(theta1));
  const ct = Math.cos(rad(t2));
  const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct);
  const rp = (n1 * ct - n2 * ci) / (n1 * ct + n2 * ci);
  return (rs * rs + rp * rp) / 2;
}

/** The torch's window for an angle of incidence `a` (from the normal at O, the light coming from the left). */
export function sourceAt(a, r = APERTURE) {
  return { x: O.x - r * Math.sin(rad(a)), y: O.y + r * Math.cos(rad(a)), z: 0 };
}

/**
 * Follows the ray from the torch at angle `a` down through horizontal layers, applying n₁ sin θ₁ = n₂ sin θ₂ at each
 * boundary. layers: [{ top, n }] from the top down (the medium under `top`, down to the next layer's top), the last
 * reaching `floor`; above the first is air (n = 1). Returns the points (the window, each hit, the end on the floor),
 * the angle in each medium (air first) and the reflected ray off the first boundary.
 */
export function trace(a, layers, floor = 0) {
  const angle = clampAngle(a);
  const start = sourceAt(angle);
  const points = [start];
  const angles = [angle];
  const ns = [1];
  let p = start;
  let th = angle;
  let n = 1;
  for (const layer of layers) {
    const dx = Math.sin(rad(th));
    const dy = -Math.cos(rad(th));
    const s = (p.y - layer.top) / -dy;
    const hit = { x: p.x + dx * s, y: layer.top, z: 0 };
    points.push(hit);
    const next = refractAngle(th, n, layer.n);
    if (next == null) break; // not with these layers: every layer is denser than the one above it
    th = next;
    n = layer.n;
    angles.push(th);
    ns.push(n);
    p = hit;
  }
  const dx = Math.sin(rad(th));
  const dy = -Math.cos(rad(th));
  const s = (p.y - floor) / -dy;
  points.push({ x: p.x + dx * s, y: floor, z: 0 });
  const first = points[1];
  const reflected = { x: first.x + REFLECT_LEN * Math.sin(rad(angle)), y: first.y + REFLECT_LEN * Math.cos(rad(angle)), z: 0 };
  return { angle, points, angles, ns, reflected, reflect: layers.length ? reflectance(angle, 1, layers[0].n) : 0 };
}

/** One Measure (মাপো) reading: θ₁, θ₂ (one decimal, as shown), their sines (four significant figures, as shown, so that the shown division gives the shown ratio at every angle) and sin θ₁ ÷ sin θ₂. */
export function measure(theta1, n1, n2) {
  const t2 = refractAngle(theta1, n1, n2) ?? 90;
  const s1 = sig4(Math.sin(rad(theta1)));
  const s2 = sig4(Math.sin(rad(t2)));
  return { t1: round(theta1, 1), t2: round(t2, 1), s1, s2, ratio: s2 > 0 ? round(s1 / s2, 2) : null };
}

/** The next angle the Measure (মাপো) action goes to: the first preset not measured yet (by angle). */
export function nextPreset(measured) {
  return PRESETS.find((p) => !measured.some((m) => Math.abs(m.t1 - p) < 0.5)) ?? null;
}

/** Shuffled copy (the test harness seeds Math.random). */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
