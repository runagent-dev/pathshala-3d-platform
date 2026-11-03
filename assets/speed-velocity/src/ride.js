// The book's example (page 41): a cycle ride from A to B in 20 minutes, along the winding road of চিত্র ২.০৪ (4 km of
// road, a সরণ of 2 km) or, to compare, along a straight road from A to the same B (2 km). Pure functions, no
// browser; unit-tested in test/unit/speed-velocity.test.mjs. Kilometres and minutes; x = east, y = north.
import { STOPS, bearingOf, compass8, headingAt, pointAt } from './road.js';

/** The ride takes 20 minutes (the book). */
export const MINUTES = 20;
/** B on the winding road, km along it from A. */
export const B_KM = STOPS.B;
/** Where B is: east and north of A, km. */
export const B = (() => {
  const p = pointAt(B_KM);
  return { x: p.x, y: p.y };
})();
/** The সরণ from A to B: its length (km) and bearing (degrees clockwise from north). */
export const DISPLACEMENT = { km: Math.hypot(B.x, B.y), bearing: bearingOf(B.x, B.y) };
/** The two paths from A to B. */
export const PATHS = ['winding', 'straight'];

/** The length of a path from A to B, km: 4 on the winding road, 2 on the straight one. */
export const lengthOf = (path) => (path === 'straight' ? DISPLACEMENT.km : B_KM);

/** The point km along a path from A (clamped to A…B). */
export function pointOn(path, km, out = { x: 0, y: 0 }) {
  const k = Math.min(Math.max(km, 0), lengthOf(path));
  if (path !== 'straight') return pointAt(k, out);
  const f = k / DISPLACEMENT.km;
  out.x = B.x * f;
  out.y = B.y * f;
  return out;
}

/** The path's direction at km: a unit vector (east, north) pointing the way the cycle goes. */
export function headingOn(path, km, out = { x: 0, y: 1 }) {
  if (path !== 'straight') return headingAt(Math.min(Math.max(km, 0), B_KM), out);
  out.x = B.x / DISPLACEMENT.km;
  out.y = B.y / DISPLACEMENT.km;
  return out;
}

/**
 * The ride at a moment (minutes from the start, clamped to 0…20), at an even speed: the distance travelled (km),
 * where the cycle is, and the direction of its velocity (bearing in degrees from north and the nearest of the eight
 * compass directions; null before the start and after the end, when it stands still).
 */
export function rideAt(path, minutes) {
  const time = Math.min(Math.max(minutes, 0), MINUTES);
  const km = (lengthOf(path) * time) / MINUTES;
  const at = pointOn(path, km);
  const moving = time > 0 && time < MINUTES;
  const h = headingOn(path, km);
  const bearing = moving ? bearingOf(h.x, h.y) : null;
  return { time, km, x: at.x, y: at.y, bearing, dir: compass8(bearing) };
}

/** km/h from km and minutes. */
export const kmh = (km, minutes) => (km * 60) / minutes;

/**
 * The book's sums for a whole ride: গড় দ্রুতি = মোট অতিক্রান্ত দূরত্ব ÷ মোট সময়, গড় বেগ = সরণ ÷ সময়, in km/h, and the
 * direction of the average velocity (that of the সরণ, A to B).
 */
export function averages(path, minutes = MINUTES) {
  const distance = lengthOf(path);
  return {
    distance,
    displacement: DISPLACEMENT.km,
    minutes,
    speed: kmh(distance, minutes),
    velocity: kmh(DISPLACEMENT.km, minutes),
    bearing: DISPLACEMENT.bearing,
    dir: compass8(DISPLACEMENT.bearing),
  };
}

const decimals = (step) => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
/** x rounded to a multiple of step, without binary leftovers. */
export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(decimals(step));
/** A live reading with d decimals (2.4 → "2.40"); never negative. */
export const fixed = (x, d = 1) => roundTo(Math.max(0, x), 10 ** -d).toFixed(d);
/** A number as in a sentence, to the hundredth without trailing zeros (4.0001 → "4", 2.5 → "2.5"). */
export const short = (x) => String(roundTo(x, 0.01));
