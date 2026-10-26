// The physics of the figure, pure functions (unit-tested in test/unit/balanced-forces.test.mjs). SI units: m, s, kg,
// N. Angles in radians unless a name says deg. Vectors are plain { x, y } in the picture's plane (x to the right,
// y up).
//
// চিত্র ৩.০২, a body on a string (a pendulum): θ is the string's angle from the vertical (+ to the right), ω = dθ/dt.
// The string pulls along itself, towards the hook, with T = mg cos θ + mLω² (the radial equation of motion; at rest
// or at the moment it is let go ω = 0, so T = mg cos θ). The weight W = mg pulls straight down. Their resultant has a
// part along the path, mg sin θ towards the lowest point, and a part towards the hook, mLω² (it bends the path): it
// is zero only when the body hangs straight down and is still. Held aside by a hand, the ball is still: the hand pulls
// with −(T + W), mg sin θ at right angles to the string, away from the lowest point, and the three forces cancel.
//
// চিত্র ৩.০৩, a book hung from the middle of a rope pulled at both ends: each half of the rope makes the angle α with
// the horizontal; at rest the two pulls (equal, by symmetry) hold the weight up: 2T sin α = W, so T = W / (2 sin α).
// Their horizontal parts cancel. The resultant of T₁, T₂ and W is zero at every α; T grows as the rope flattens.

export const G = 9.8; // ms⁻², as in the book (2.8, falling bodies)
export const MASS = 1; // kg: the ball and the book (W = 9.8 N, so both scenes share one arrow scale)
export const LENGTH = 0.3; // m, the hook to the ball's centre (the hook and the stand's arm stay in the picture)
export const BALL_R = 0.04; // m: the 1 kg ball is 8 cm across (a metal bob, hollow inside)
export const DROP = 0.15; // m from the bottom of the hanging ball to the table
export const SLOW = 5; // the cut string's fall is shown 5 times slower than real (it lasts 0.17 s)
export const DAMPING = 0.1; // 1/s: air slows the swing a little (amplitude halves in about 14 s)
export const MAX_DEG = 30; // the ball is pulled aside at most this far (the book: a little)
export const ALPHA = { min: 20, max: 70, start: 30 }; // deg: the rope's angle above the horizontal
export const HALF_ROPE = 0.32; // m, the knot to each hand

export const rad = (deg) => (deg * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;
/** Rounded to `d` decimals without binary leftovers (0.1 + 0.2 → 0.3). */
export const round = (x, d = 1) => {
  const v = +(Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
  return Object.is(v, -0) ? 0 : v;
};
export const len = (v) => Math.hypot(v.x, v.y);
export const add = (...vs) => vs.reduce((a, v) => ({ x: a.x + v.x, y: a.y + v.y }), { x: 0, y: 0 });

/** The weight of a mass: W = mg (N). */
export const weight = (m = MASS) => m * G;

/** The ball's centre relative to the hook. */
export const bobAt = (theta, L = LENGTH) => ({ x: L * Math.sin(theta), y: -L * Math.cos(theta) });

/**
 * The forces on the ball on its string: T along the string towards the hook, W down, and their resultant R.
 * @param {number} theta rad from the vertical
 * @param {number} [omega] rad/s
 */
export function pendulumForces(theta, omega = 0, { m = MASS, L = LENGTH } = {}) {
  const w = weight(m);
  const tension = w * Math.cos(theta) + m * L * omega * omega;
  const T = { x: -tension * Math.sin(theta), y: tension * Math.cos(theta) };
  const W = { x: 0, y: -w };
  const R = add(T, W);
  return {
    T,
    W,
    R,
    tension,
    weight: w,
    resultant: len(R),
    /** The resultant's part along the path, towards the lowest point (mg sin θ, signed: + to the right). */
    along: -w * Math.sin(theta),
    /** Its part along the string, towards the hook (mLω²). */
    inward: m * L * omega * omega,
  };
}

/**
 * The ball held still at θ by a hand: T = mg cos θ along the string, W down, and the hand's pull H = −(T + W)
 * (mg sin θ at right angles to the string, away from the lowest point). The three add up to zero.
 */
export function heldForces(theta, { m = MASS, L = LENGTH } = {}) {
  const f = pendulumForces(theta, 0, { m, L });
  const H = { x: -f.R.x, y: -f.R.y };
  return { T: f.T, W: f.W, H, tension: f.tension, weight: f.weight, hand: len(H), R: add(f.T, f.W, H), resultant: len(add(f.T, f.W, H)) };
}

/** The resultant of T and W just as the ball is let go at θ: mg sin θ, at right angles to the string. */
export const releaseResultant = (theta, m = MASS) => weight(m) * Math.abs(Math.sin(theta));

/** One step of the swing: θ'' = −(g/L) sin θ − cθ' (RK4). */
export function swingStep({ theta, omega }, dt, { L = LENGTH, damping = DAMPING } = {}) {
  const f = (th, om) => -(G / L) * Math.sin(th) - damping * om;
  const k1t = omega;
  const k1o = f(theta, omega);
  const k2t = omega + (dt / 2) * k1o;
  const k2o = f(theta + (dt / 2) * k1t, omega + (dt / 2) * k1o);
  const k3t = omega + (dt / 2) * k2o;
  const k3o = f(theta + (dt / 2) * k2t, omega + (dt / 2) * k2o);
  const k4t = omega + dt * k3o;
  const k4o = f(theta + dt * k3t, omega + dt * k3o);
  return {
    theta: theta + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t),
    omega: omega + (dt / 6) * (k1o + 2 * k2o + 2 * k3o + k4o),
  };
}

const STEP = 1 / 400; // s: the swing is always worked out in steps this small, so it depends only on time

/** Advance a swing by `dt` seconds in fixed small steps (the same result for any frame rate). */
export function swingAdvance(state, dt, options) {
  let st = { theta: state.theta, omega: state.omega };
  let left = state.carry ? state.carry + dt : dt;
  while (left >= STEP) {
    st = swingStep(st, STEP, options);
    left -= STEP;
  }
  return { ...st, carry: left };
}

/** The swing `t` s after the ball was let go at rest at θ₀. */
export const swingAt = (theta0, t, options) => swingAdvance({ theta: theta0, omega: 0 }, t, options);

/** The time of one full swing (there and back) for small swings: 2π√(L/g). */
export const period = (L = LENGTH) => 2 * Math.PI * Math.sqrt(L / G);

/** The energy left in the swing, as the angle it would reach (rad). */
export function amplitude({ theta, omega }, L = LENGTH) {
  const c = Math.cos(theta) - (L * omega * omega) / (2 * G);
  return Math.acos(Math.max(-1, Math.min(1, c)));
}

/** A fall from rest: how far (m) after t s, and the time to fall h m. */
export const fallDistance = (t) => 0.5 * G * t * t;
export const fallTime = (h = DROP) => Math.sqrt((2 * h) / G);

/** The book on the rope: each pull T = W / (2 sin α), along the rope; the resultant of T₁, T₂ and W. */
export function bookForces(alphaDeg, m = MASS) {
  const a = rad(alphaDeg);
  const w = weight(m);
  const tension = w / (2 * Math.sin(a));
  const T1 = { x: -tension * Math.cos(a), y: tension * Math.sin(a) }; // the left hand's pull
  const T2 = { x: tension * Math.cos(a), y: tension * Math.sin(a) }; // the right hand's
  const W = { x: 0, y: -w };
  const R = add(T1, T2, W);
  return { T1, T2, W, R, tension, weight: w, resultant: len(R) };
}

/**
 * Forces drawn tip to tail, starting at the origin: the corners of the chain, and the resultant from the start to
 * the end. `closed` when the chain comes back to its start (the resultant is zero).
 * @param {{ x: number, y: number }[]} forces
 */
export function chain(forces, eps = 1e-6) {
  const points = [{ x: 0, y: 0 }];
  for (const f of forces) {
    const p = points[points.length - 1];
    points.push({ x: p.x + f.x, y: p.y + f.y });
  }
  const end = points[points.length - 1];
  return { points, resultant: { ...end }, closed: len(end) < eps * Math.max(1, ...forces.map(len)) };
}

/**
 * The four directions offered in the test "which way does the resultant point the moment the ball is let go?"
 * (unit vectors): along the path towards the lowest point (right), straight down (only the weight), along the
 * string to the hook (only the pull), and level towards the middle.
 */
export function releaseDirections(theta) {
  const s = Math.sign(theta) || 1;
  const a = Math.abs(theta);
  return {
    along: { x: -s * Math.cos(a), y: -Math.sin(a) },
    down: { x: 0, y: -1 },
    string: { x: -s * Math.sin(a), y: Math.cos(a) },
    level: { x: -s, y: 0 },
  };
}

/** The angle (deg, 0…180) between two vectors. */
export function angleBetween(a, b) {
  const c = (a.x * b.x + a.y * b.y) / (len(a) * len(b));
  return deg(Math.acos(Math.max(-1, Math.min(1, c))));
}
