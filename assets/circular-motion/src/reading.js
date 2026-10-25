// The maths of circular motion (ঘূর্ণন গতি), kept apart from the 3D so it can be unit-tested. Each example turns
// in its own plane: angles are in degrees, 0 is "up" in the front view (12 o'clock), and a positive angle is the
// way the example really turns. A point at angle a on a circle of radius r is (−r sin a, r cos a) in that plane,
// so its distance from the centre is r whatever a is: the one idea of the figure.

/**
 * The three examples of the book (page 36). r: the circle of the marked point in scene units (cm); value + unit:
 * the real distance shown to the student; period: seconds per turn in the figure (stylised: the real fan is much
 * faster, the real clock and Moon much slower).
 */
export const EXAMPLES = {
  // a 56-inch (1400 mm sweep) ceiling fan: the mark near the blade tip is 70 cm from the axis
  fan: { r: 70, value: 70, unit: 'unit_cm', decimals: 0, period: 6 },
  // a 31 cm wall clock: the mark on the second hand is 12 cm from the pin; the clock runs 6 times fast
  clock: { r: 12, value: 12, unit: 'unit_cm', decimals: 0, period: 10 },
  // the Moon: about 3,84,400 km from the Earth's centre (3.84 lakh km); the scene is not to scale
  moon: { r: 60, value: 3.844, unit: 'unit_lakh_km', decimals: 2, period: 12 },
};
export const EXAMPLE_IDS = /** @type {const} */ (['fan', 'clock', 'moon']);

const RAD = Math.PI / 180;
export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);

/** An angle in [0, 360). */
export const wrap360 = (deg) => ((deg % 360) + 360) % 360;

/** The point at `deg` on a circle of radius r around the centre, in the example's plane. */
export function pointAt(r, deg) {
  return { x: -r * Math.sin(deg * RAD), y: r * Math.cos(deg * RAD) };
}

/** The angle (degrees, −180…180) of a point of the plane, seen from the centre: the inverse of pointAt. */
export function angleOf(x, y) {
  return Math.atan2(-x, y) / RAD;
}

/** The distance between two points of the plane. */
export const distance = (p, q = { x: 0, y: 0 }) => Math.hypot(p.x - q.x, p.y - q.y);

/** The continuous angle nearest to `prev` that points the same way as `deg` (no jump of 360 at the back). */
export function unwrap(prev, deg) {
  return prev + ((((deg - prev + 180) % 360) + 360) % 360) - 180;
}

/** The smaller angle between two directions, 0…180 (350° and 10° are 20° apart). */
export const angleBetween = (a, b) => Math.abs(wrap360(a - b + 180) - 180);

/** The angle turned in `seconds` by an example that goes round once in `period` seconds. */
export const turned = (seconds, period) => (360 * seconds) / period;

/**
 * The part of the circle the marked point has passed: { lo, hi } in continuous degrees. It grows both ways (the
 * student may turn it back by hand) and stops at one whole turn: then the path is the full circle.
 */
export function extendCoverage(cov, deg) {
  const lo = Math.min(cov.lo, deg);
  const hi = Math.max(cov.hi, deg);
  if (hi - lo <= 360) return { lo, hi };
  return deg > cov.hi ? { lo: hi - 360, hi } : { lo, hi: lo + 360 };
}

/** How much of the circle has been traced, 0…1. */
export const coverageFraction = (cov) => Math.min(1, (cov.hi - cov.lo) / 360);

/** The straight distance from where the point started after it turned `deg`: what changes (2r after half a turn). */
export const chord = (r, deg) => 2 * r * Math.abs(Math.sin((deg * RAD) / 2));

/** A distance as the student reads it: the example's real value, rounded to its decimals. */
export function realDistance(example, sceneDistance) {
  const ex = EXAMPLES[example];
  return roundTo((sceneDistance * ex.value) / ex.r, 10 ** -ex.decimals);
}

/** Written with the example's decimals: "70", "3.84" (and plain "0" for nothing). */
export const fmt = (example, value) => (Number(value) === 0 ? '0' : Number(value).toFixed(EXAMPLES[example].decimals));

/** The length of the path walked along the circle in `deg` of turning (πr for half a turn). */
export const arc = (r, deg) => (Math.PI * r * Math.abs(deg)) / 180;

/**
 * The test's wrong answers for "how far from the fixed point after `fraction` of a turn", from real mistakes:
 * the distance from the start (2r after half a turn, 0 after a whole one), the length of path walked along the
 * circle (πr, 2πr), and half the radius (half a turn) or the diameter (a whole one). Three, all different from r
 * and from each other, in the example's decimals.
 */
export function distanceMistakes(example, fraction) {
  const r = EXAMPLES[example].value;
  const d = EXAMPLES[example].decimals;
  const key = (v) => v.toFixed(d);
  const seen = new Set([key(r)]);
  const out = [];
  const deg = fraction * 360;
  for (const v of [chord(r, deg), arc(r, deg), fraction < 1 ? r / 2 : 2 * r, 3 * r]) {
    const k = key(roundTo(v, 10 ** -d));
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(Number(k));
    if (out.length === 3) break;
  }
  return out;
}

/** The hands of a clock at `seconds` after midnight, in degrees clockwise from 12. */
export function clockHands(seconds) {
  const s = wrap360(seconds * 6);
  const m = wrap360(seconds * 0.1);
  const h = wrap360(seconds / 120);
  return { hour: h, minute: m, second: s };
}
