// The physics of the figure, as pure functions (unit-tested in test/unit/speed-velocity.test.mjs).
//
// The stone: whirled overhead in a horizontal circle (a conical pendulum), radius 1 m at a steady 4 m/s. Its
// দ্রুতি never changes; its বেগ always points along the circle (the tangent), so its direction keeps changing.
// Let go of the rope and the stone keeps the বেগ it had at that instant: seen from above it goes in a straight
// line along the tangent while it falls (g = 9.8 m/s²), lands, and slides to a stop (or sinks in the pond).
//
// The road: চিত্র ২.০৪, A to B is 4 km along the road and 2 km in a straight line; by cycle in 20 minutes:
// গড় দ্রুতি = 4 km ÷ 20 min = 12 km/h, গড় বেগ = 2 km ÷ 20 min = 6 km/h towards B.
//
// Map coordinates: e = east, n = north (m for the stone, km for the road). Angles in degrees, counted from east
// towards north (anticlockwise seen from above), the way the stone goes round.
import { ROAD } from './road-data.js';

export const G = 9.8; // m/s²
const rad = (deg) => (deg * Math.PI) / 180;

export const STONE = {
  r: 1, // m, radius of the circle the stone goes round
  v: 4, // m/s, its দ্রুতি
  hand: 1.95, // m, height of the hand above the ground
  size: 0.085, // m, radius of the stone (drawn a little big, so it shows on a phone)
  slide: 8, // m/s², how fast it slows down sliding on the grass after it lands
  slow: 3, // the picture runs 3 times slower than real time
};
/** The rope hangs below the hand: tan(angle) = g r / v² (the stone goes round lower than the hand). */
export const DROOP = (G * STONE.r) / STONE.v ** 2;
export const HEIGHT = STONE.hand - DROOP; // m, height of the circle
export const ROPE = Math.hypot(STONE.r, DROOP); // m, length of the rope
export const PERIOD = (2 * Math.PI * STONE.r) / STONE.v; // s for one turn
export const OMEGA = STONE.v / STONE.r; // rad/s
/** Time in the air after letting go, and how far it goes along its বেগ meanwhile. */
export const AIR_TIME = Math.sqrt((2 * (HEIGHT - STONE.size)) / G);
export const THROW = STONE.v * AIR_TIME;
/** Every throw lands on this circle (the tangent is at right angles to the radius). */
export const LAND_RADIUS = Math.hypot(STONE.r, THROW);
/** Seen from the centre, it lands this far ahead of where it was let go. */
export const LAND_AHEAD = (Math.atan2(THROW, STONE.r) * 180) / Math.PI;

export const POND = { bearing: 35, radius: 0.8 }; // the pond: centre on the landing circle, 35° from east
export const POND_CENTRE = polar(LAND_RADIUS, POND.bearing);

/** 0 ≤ deg < 360. */
export const wrap = (deg) => ((deg % 360) + 360) % 360;

export function polar(r, deg) {
  return { e: r * Math.cos(rad(deg)), n: r * Math.sin(rad(deg)) };
}

/** Where the stone is at angle θ, and its বেগ there (m/s, map axes; along the tangent, anticlockwise). */
export function stoneAt(deg) {
  const p = polar(STONE.r, deg);
  const u = polar(STONE.v, deg + 90);
  return { e: p.e, n: p.n, ve: u.e, vn: u.n, heading: wrap(deg + 90) };
}

// ── directions ────────────────────────────────────────────────────────────────
/** The eight directions of a compass, from east anticlockwise (keys of the strings dir_E, dir_NE, …). */
export const DIRS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
/** The compass word for a heading in degrees (nearest of the eight). */
export const dirOf = (heading) => DIRS[Math.round(wrap(heading) / 45) % 8];

// ── letting go ────────────────────────────────────────────────────────────────
/** The pond's edge is not a perfect circle: its radius in a direction (deg, seen from the pond's centre). */
export function pondRadius(deg) {
  const a = rad(deg);
  return POND.radius * (1 + 0.07 * Math.sin(3 * a + 1) + 0.045 * Math.sin(5 * a + 2.2));
}
export function inPond(e, n) {
  const de = e - POND_CENTRE.e;
  const dn = n - POND_CENTRE.n;
  return Math.hypot(de, dn) < pondRadius((Math.atan2(dn, de) * 180) / Math.PI) - STONE.size;
}

/**
 * The throw if the rope is let go at angle θ: where it lands, whether that is in the pond, and where it stops.
 * Seen from above it never leaves the straight line along its বেগ at the moment of letting go.
 */
export function throwFrom(deg) {
  const s = stoneAt(deg);
  const ue = s.ve / STONE.v;
  const un = s.vn / STONE.v;
  const land = { e: s.e + ue * THROW, n: s.n + un * THROW };
  const wet = inPond(land.e, land.n);
  const slide = wet ? 0 : STONE.v ** 2 / (2 * STONE.slide);
  const rest = { e: land.e + ue * slide, n: land.n + un * slide };
  return { from: { e: s.e, n: s.n }, dir: { e: ue, n: un }, heading: s.heading, land, wet, rest, slide };
}

/**
 * The stone τ real seconds after letting go at angle θ: { e, n, h (height of its centre), phase }.
 * phase: 'air' → 'slide' → 'rest' on the grass, or 'air' → 'sink' → 'gone' in the pond.
 */
export function flightAt(deg, tau, thr = throwFrom(deg)) {
  const { from, dir } = thr;
  const v = STONE.v;
  if (tau < AIR_TIME) {
    const d = v * Math.max(0, tau);
    return { e: from.e + dir.e * d, n: from.n + dir.n * d, h: HEIGHT - 0.5 * G * Math.max(0, tau) ** 2, phase: 'air', d };
  }
  const after = tau - AIR_TIME;
  if (thr.wet) {
    const sink = Math.min(1, after / 0.35);
    return { e: thr.land.e, n: thr.land.n, h: STONE.size * (1 - 2.4 * sink), phase: sink < 1 ? 'sink' : 'gone', d: THROW };
  }
  const tStop = v / STONE.slide;
  const ts = Math.min(after, tStop);
  const d = v * ts - 0.5 * STONE.slide * ts * ts;
  return { e: thr.land.e + dir.e * d, n: thr.land.n + dir.n * d, h: STONE.size, phase: after < tStop ? 'slide' : 'rest', d: THROW + d };
}
/** Real seconds from letting go until the stone is at rest (or under water). */
export const flightEnd = (thr) => AIR_TIME + (thr.wet ? 0.35 : STONE.v / STONE.slide);

/** The angle to let go at so that it lands in the middle of the pond. */
export const AIM = wrap(POND.bearing - LAND_AHEAD);

// ── the road (চিত্র ২.০৪) ─────────────────────────────────────────────────────
export const RIDE = { km: ROAD.B.km, minutes: 20 }; // A to B by cycle
export const RIDE_SPEED = RIDE.km / (RIDE.minutes / 60); // km/h, the cyclist goes at a steady speed

/** The point on the road `km` from A (map km), and its direction there (deg from east). */
export function roadAt(km) {
  const pts = ROAD.samples;
  const x = Math.min(Math.max(km, 0), ROAD.lengthKm) / ROAD.stepKm;
  const i = Math.min(Math.floor(x), pts.length - 2);
  const k = Math.min(1, x - i);
  const [a, b] = [pts[i], pts[i + 1]];
  return {
    e: a[0] + (b[0] - a[0]) * k,
    n: a[1] + (b[1] - a[1]) * k,
    heading: wrap((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI),
  };
}

/** Everything on the road `km` along from A, at the cyclist's steady speed: the book's sum, worked live. */
export function rideAt(km) {
  const d = Math.min(Math.max(km, 0), RIDE.km);
  const p = roadAt(d);
  const minutes = (d / RIDE_SPEED) * 60;
  const displacement = Math.hypot(p.e, p.n);
  const hours = minutes / 60;
  return {
    km: d,
    minutes,
    distance: d,
    displacement,
    heading: wrap((Math.atan2(p.n, p.e) * 180) / Math.PI), // of the সরণ, from A
    avgSpeed: hours > 0 ? d / hours : null, // km/h
    avgVelocity: hours > 0 ? displacement / hours : null, // km/h
    at: p,
  };
}

/** km/h from km and minutes, the way the book works it: 20 minutes = 1/3 hour. */
export const kmh = (km, minutes) => km / (minutes / 60);

// ── numbers ───────────────────────────────────────────────────────────────────
/** At most `d` decimals, no trailing zeros, no binary leftovers ("4", "2.4", "1.55"). */
export function fmt(x, d = 2) {
  if (x == null || !Number.isFinite(x)) return '';
  const s = (+x.toFixed(d)).toFixed(d);
  return d ? s.replace(/\.?0+$/, '') : s;
}
/** Exactly `d` decimals ("2.40"): for numbers that change while you watch, so they do not jump about. */
export const fixed = (x, d) => (x == null || !Number.isFinite(x) ? '' : (+x.toFixed(d)).toFixed(d));
