// The facts and the maths of the gravitational-force figure (মহাকর্ষ বল, book page 68, topic 3.2.1), kept apart
// from the 3D so they can be unit-tested: the five stops from two apples to a galaxy, the places a person can stand
// on the Earth's rim in the figure, Newton's law of gravitation for the apples, the path of a body whose pull is
// taken away (a straight line, Newton's first law), the four directions offered in the "which way is down?"
// question, a dropped apple's places at equal moments of its fall, and people stepping aside when you come near.

/** The gravitational constant, N·m²/kg². */
export const G = 6.674e-11;

/** The stops, from the smallest distance to the largest (the chips in the panel, left to right). */
export const STOPS = /** @type {const} */ (['apples', 'earth', 'moon', 'sun', 'galaxy']);

/**
 * Real facts shown to the student (rounded the way the panel says them), and how fast each orbit turns in the
 * figure (seconds per turn on screen: the real ones take 27 days, a year and some 230 million years).
 */
export const FACTS = {
  apple: { mass: 0.2, radius: 3.5 }, // kg; cm (a big apple, about 7 cm across)
  earthRadiusKm: 6400, // about 6,371 km
  moon: { lakh: 3, thousand: 84, days: 27, period: 10 }, // about 3 lakh 84 thousand km (3,84,400); about 27.3 days per turn
  sun: { croreKm: 15, years: 1, period: 14 }, // about 14.96 crore km; one year
  galaxy: { thousandLy: 26, croreYears: 23, period: 48 }, // the Sun is about 26,000 light-years from the centre; about 230 million years per turn
};

/** The apples' distance (centre to centre, cm): the student drags it between these. */
export const GAP = { min: 20, max: 40, start: 20 };

const RAD = Math.PI / 180;
export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
/** An angle in [0, 360). */
export const wrap360 = (deg) => ((deg % 360) + 360) % 360;
/** The smaller angle between two directions, 0…180. */
export const angleBetween = (a, b) => Math.abs(wrap360(a - b + 180) - 180);
/** The continuous angle nearest to `prev` that points the same way as `deg` (no jump of 360). */
export const unwrap = (prev, deg) => prev + wrap360(deg - prev + 180) - 180;

/** Newton's law of gravitation: the pull between two masses (kg) whose centres are r metres apart, in newtons. */
export function gravity(m1, m2, r) {
  return (G * m1 * m2) / (r * r);
}

/** The pull between the two apples when their centres are `cm` apart, in newtons. */
export const applePull = (cm) => gravity(FACTS.apple.mass, FACTS.apple.mass, cm / 100);

/** g at the Earth's surface, m/s²: the Earth pulls a 200 g apple with about 2 N (its weight). */
export const g = 9.8;
export const appleWeight = () => FACTS.apple.mass * g;

/**
 * How many times stronger the Earth's pull on an apple is than the two apples' pull on each other, `cm` apart, in
 * crore (10⁷), to two significant figures: about 2,900 crore at 20 cm.
 */
export function earthPullTimesCrore(cm) {
  const crore = appleWeight() / applePull(cm) / 1e7;
  const p = 10 ** (Math.floor(Math.log10(crore)) - 1);
  return Math.round(crore / p) * p;
}

/**
 * A positive number as a × 10^n with one decimal in a (1.0 ≤ a < 10): { a: '1.2', n: -10 }. Rounding up to 10.0
 * moves to the next power (9.97e-11 → 1.0 × 10⁻¹⁰).
 */
export function scientific(x) {
  let n = Math.floor(Math.log10(x));
  let a = roundTo(x / 10 ** n, 0.1);
  if (a >= 10) {
    a = roundTo(a / 10, 0.1);
    n += 1;
  }
  return { a: a.toFixed(1), n };
}

// ── the Earth's rim ────────────────────────────────────────────────────────────
// In the figure the people stand on the great circle through the poles along 90° E (the right half, where
// Bangladesh is) and 90° W (the left half). A place on it is an angle θ from the North Pole, clockwise as seen in
// the front view: θ = 90 − latitude on the right (90° E), θ = 270 + latitude on the left (90° W).

/** Latitude and longitude (degrees) of the rim point at θ. */
export function rimLatLon(theta) {
  const a = wrap360(theta);
  return a <= 180 ? { lat: 90 - a, lon: 90 } : { lat: a - 270, lon: -90 };
}
/** The rim angle θ of a latitude on the 90° E side (east) or the 90° W side. */
export const rimAngle = (lat, east = true) => (east ? 90 - lat : wrap360(270 + lat));

/** Where the people stand at the start: you in Bangladesh, people at both poles and one on the far side of the Earth. */
export const PEOPLE = {
  you: rimAngle(23.5), // Bangladesh (about 23.5° N on 90° E)
  north: 0, // the North Pole
  south: 180, // the South Pole
  far: rimAngle(-23.5, false), // the point exactly opposite Bangladesh: the Pacific Ocean, west of South America
};

/**
 * The places along the rim, by θ (degrees), each up to the next: what is under a person standing there, and
 * whether it is sea (then the person stands in a boat). Coarse on purpose, matching the drawn map.
 */
export const PLACES = [
  { from: 0, key: 'north_pole', sea: false }, // the Arctic's ice, down to 74° N here
  { from: 16, key: 'russia', sea: false },
  { from: 40, key: 'mongolia', sea: false },
  { from: 44, key: 'china', sea: false },
  { from: 62, key: 'bhutan_india', sea: false },
  { from: 64.5, key: 'bangladesh', sea: false }, // 25.5° N … 21.5° N
  { from: 68.5, key: 'bay_of_bengal', sea: true },
  { from: 85, key: 'indian_ocean', sea: true },
  { from: 158, key: 'antarctica', sea: false }, // the ice from 68° S
  { from: 172, key: 'south_pole', sea: false },
  { from: 188, key: 'antarctica', sea: false },
  { from: 202, key: 'pacific', sea: true },
  { from: 283.7, key: 'central_america', sea: false }, // Guatemala and Yucatán, about 14° N … 19.5° N on the map
  { from: 289.5, key: 'gulf_of_mexico', sea: true },
  { from: 299.5, key: 'usa', sea: false }, // from the coast near New Orleans (29.5° N)
  { from: 319, key: 'canada', sea: false },
  { from: 341, key: 'north_pole', sea: false }, // the Arctic's ice from 71° N here
];

/** The place under a person standing at θ. */
export function placeAt(theta) {
  const a = wrap360(theta);
  let place = PLACES[0];
  for (const p of PLACES) if (a >= p.from) place = p;
  return place;
}

/** Where a person at θ stands, in the front view's plane (x right, y up), r from the centre. */
export function rimPoint(theta, r = 1) {
  return { x: r * Math.sin(theta * RAD), y: r * Math.cos(theta * RAD) };
}
/** The rim angle θ of a point of the front view's plane (the inverse of rimPoint). */
export const rimAngleOf = (x, y) => wrap360(Math.atan2(x, y) / RAD);

/**
 * The four directions offered when the test asks "which way is the pull (or the fall) for a person at θ?", as
 * screen angles (degrees, 0 = right, 90 = up, anticlockwise): towards the Earth's centre (right), straight away
 * from it, along the ground, and "down the screen" (the usual mistake). Of the two directions along the ground
 * the one furthest from "down the screen" is used, so no two choices look alike.
 */
export function directionChoices(theta) {
  const out = wrap360(90 - theta);
  const inward = wrap360(out + 180);
  const screenDown = 270;
  const tangents = [wrap360(out + 90), wrap360(out - 90)];
  const tangent = angleBetween(tangents[0], screenDown) >= angleBetween(tangents[1], screenDown) ? tangents[0] : tangents[1];
  return { inward, outward: out, tangent, screenDown };
}

/** The smallest angle between any two of the four choices: questions use places where it is at least 40°. */
export function choiceSpread(theta) {
  const d = Object.values(directionChoices(theta));
  let min = 180;
  for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) min = Math.min(min, angleBetween(d[i], d[j]));
  return min;
}

/**
 * Where a person who normally stands at `base` stands when you are at `you`: they step aside so there is always
 * `gap` degrees between you (you never stand on top of each other); further away they stand at their own place.
 */
export function stepAside(base, you, gap = 14) {
  const d = wrap360(you - base + 180) - 180; // you, seen from their place: −180 … 180
  if (Math.abs(d) >= gap) return base;
  return wrap360(you - (d >= 0 ? gap : -gap));
}

/**
 * A dropped apple, at equal moments of its fall (a quarter, a half and three quarters of the time): it has fallen
 * 1/16, 1/4 and 9/16 of the way (the distance grows as the time squared), so the gaps grow: it speeds up.
 */
export const FALL_MOMENTS = [1 / 16, 1 / 4, 9 / 16];

/** Places on the rim where the "which way" question is fair (all four choices clearly apart), in whole degrees. */
export function fairQuestionAngles(minSpread = 40) {
  const list = [];
  for (let a = 0; a < 360; a += 1) if (choiceSpread(a) >= minSpread) list.push(a);
  return list;
}

// ── orbits ─────────────────────────────────────────────────────────────────────
// In the orbit stops the plane of the orbit is horizontal (the scene's x–z plane) and the body goes round
// anticlockwise as seen from above: at angle φ it is at (r cos φ, −r sin φ) in (x, z).

/** The position of a body on its circle at angle φ (degrees). */
export function orbitPoint(r, phi) {
  return { x: r * Math.cos(phi * RAD), z: -r * Math.sin(phi * RAD) };
}
/** The angle turned in `seconds` by a body that goes round once in `period` seconds. */
export const turned = (seconds, period) => (360 * seconds) / period;

/**
 * Where a body goes if its pull vanishes when it is at angle φ0 on a circle of radius r, turning once in `period`
 * seconds: in a straight line along the circle's tangent at the speed it had (Newton's first law). `t` seconds later.
 */
export function straightPath(r, phi0, period, t) {
  const p = orbitPoint(r, phi0);
  const speed = (2 * Math.PI * r) / period;
  const a = phi0 * RAD;
  // the velocity at φ0 for anticlockwise motion (seen from above): d/dφ of (cos φ, −sin φ) = (−sin φ, −cos φ)
  return { x: p.x - speed * t * Math.sin(a), z: p.z - speed * t * Math.cos(a) };
}
