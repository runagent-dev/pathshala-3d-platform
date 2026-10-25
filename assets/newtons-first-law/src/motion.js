// The physics of the figure, in metres and seconds, as pure functions (unit-tested in
// test/unit/newtons-first-law.test.mjs). A book is pushed along the launcher's smooth plate (the same push every
// time: it leaves the plate at V0) and then slides on a floor. On the floor the only force along its motion is
// kinetic friction, μ m g, against the velocity, so it slows evenly (a = μ g) and stops after V0² / (2 μ g). With no
// friction (μ = 0) nothing changes its velocity: it slides on at V0 for ever. Air resistance on a book sliding flat
// at 3 m/s is under a tenth of even the ice's friction, so it is left out (NOTES.md).

export const G = 9.8; // m/s²
export const V0 = 3; // m/s: the book's speed as it leaves the launcher (the same push every time)
export const PUSH = { stroke: 0.3, time: 0.2 }; // m and s the paddle pushes the book along the plate (from rest to V0)
export const PUSH_ACC = (2 * PUSH.stroke) / PUSH.time ** 2; // 15 m/s², steady during the push
// a class 9–10 textbook lying flat (m), sliding short side first so its cover reads upright from the side: length is
// along the floor (x, the motion), width across it (z)
export const BOOK = { length: 0.19, width: 0.26, thick: 0.025 };
export const STEP = 0.05; // s between the marks the book leaves on the floor

/** The floors, smoothest last. μ: kinetic friction of a paper-covered book on it (approximate). */
export const SURFACES = {
  mat: { mu: 0.35 },
  wood: { mu: 0.18 },
  ice: { mu: 0.05 },
  none: { mu: 0 },
};
export const SURFACE_IDS = Object.keys(SURFACES);

export const round = (x, d = 3) => +(Math.round(x * 10 ** d) / 10 ** d).toFixed(d);

/** Seconds from the release until the book stops (Infinity without friction). */
export function stopTime(mu) {
  return mu > 0 ? V0 / (mu * G) : Number.POSITIVE_INFINITY;
}

/** Metres from the release to where it stops (Infinity without friction). */
export function stopDistance(mu) {
  return mu > 0 ? (V0 * V0) / (2 * mu * G) : Number.POSITIVE_INFINITY;
}

/** Friction's deceleration (m/s²) while the book slides. */
export const deceleration = (mu) => mu * G;

/**
 * Where the book is, t s after the release, sliding on a floor with friction μ: { x: m from the release point,
 * v: m/s, moving }. Before the release (t < 0) it is on the plate (see runAt).
 */
export function slideAt(t, mu) {
  const T = stopTime(mu);
  const tt = Math.max(0, Math.min(t, T));
  const a = deceleration(mu);
  return { x: V0 * tt - 0.5 * a * tt * tt, v: Math.max(0, V0 - a * tt), moving: t < T };
}

/**
 * The whole run, t s after the paddle starts pushing: phase 'push' (on the plate, x < 0, speeding up), then 'slide'
 * (on the floor, slowing evenly or not at all), then 'stopped'. x is the book's front edge measured from the
 * release point (where the floor and its tape start), v its speed.
 */
export function runAt(t, mu) {
  if (t < PUSH.time) {
    const tt = Math.max(0, t);
    return { phase: 'push', x: -PUSH.stroke + 0.5 * PUSH_ACC * tt * tt, v: PUSH_ACC * tt, since: tt - PUSH.time };
  }
  const since = t - PUSH.time;
  const s = slideAt(since, mu);
  return { phase: s.moving ? 'slide' : 'stopped', x: s.x, v: s.v, since };
}

/** Times (s after the release) of the marks the book leaves up to time t (never past the stop); only the last `max`. */
export function markTimes(t, mu, step = STEP, max = Number.POSITIVE_INFINITY) {
  const end = Math.min(t, stopTime(mu));
  const last = Math.floor(end / step + 1e-9);
  const out = [];
  for (let i = Math.max(0, last - max + 1); i <= last; i++) out.push(round(i * step, 6));
  return out;
}

/**
 * A steady force against the motion (deceleration a, m/s²) from speed v: { dx: m gone, v, moving } after t s. The
 * test stops a book on the frictionless floor this way.
 */
export function brakeAt(t, v, a) {
  const T = v / a;
  const tt = Math.max(0, Math.min(t, T));
  return { dx: v * tt - 0.5 * a * tt * tt, v: Math.max(0, v - a * tt), moving: t < T };
}

// ── the test's curved wall (seen from above; x right, z toward the viewer = down the screen) ──────────────────

/** The book goes round inside a quarter-circle wall about the origin, from (0, −r) moving +x to (r, 0) moving +z. */
export const CURVE = { r: 0.42, speed: 0.7, lead: 0.4 }; // r: radius of the book's centre; lead: straight run-in (m)

/** The book's centre and heading on the curved-wall run, s m along it (run-in, then the quarter circle). */
export function curveAt(s) {
  const { r, lead } = CURVE;
  if (s <= lead) return { x: s - lead, z: -r, heading: 0 }; // heading: angle from +x toward +z (rad)
  const phi = Math.min((s - lead) / r, Math.PI / 2);
  const out = { x: r * Math.sin(phi), z: -r * Math.cos(phi), heading: phi };
  if (s - lead > (r * Math.PI) / 2) {
    const extra = s - lead - (r * Math.PI) / 2; // past the wall's end: straight on, along +z
    out.z += extra;
  }
  return out;
}

/** Length of the run up to the wall's end (m). */
export const curveEnd = () => CURVE.lead + (CURVE.r * Math.PI) / 2;

/**
 * Four paths from the wall's end (points { x, z }, `length` m long): 'straight' on along the last heading (the
 * right one: no force, no turning), 'circle' (as if it kept going round), 'spiral' (still turning, less and less)
 * and 'outward' (flung out away from the centre, the classic mistake; 15° off the radius so it clears the wall's end).
 */
const OUT = (15 * Math.PI) / 180;
export function candidatePaths(length = 0.9, n = 60) {
  const { r } = CURVE;
  const paths = { straight: [], circle: [], spiral: [], outward: [] };
  for (let i = 0; i <= n; i++) {
    const s = (length * i) / n;
    paths.straight.push({ x: r, z: s });
    const phi = Math.PI / 2 + s / r;
    paths.circle.push({ x: r * Math.sin(phi), z: -r * Math.cos(phi) });
    paths.outward.push({ x: r + s * Math.cos(OUT), z: s * Math.sin(OUT) });
  }
  // the spiral: the heading keeps turning toward the centre, at half the circle's rate and fading
  let x = r;
  let z = 0;
  let h = Math.PI / 2;
  const ds = length / n;
  paths.spiral.push({ x, z });
  for (let i = 1; i <= n; i++) {
    h += (ds / r) * 0.55 * (1 - i / (n * 1.6));
    x += Math.cos(h) * ds;
    z += Math.sin(h) * ds;
    paths.spiral.push({ x, z });
  }
  return paths;
}
