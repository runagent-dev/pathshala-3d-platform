// The collision of two balls on a straight, smooth track (book pages 72–73, topic 3.5.1): pure functions, no
// three.js, unit-tested in test/unit/conservation-of-momentum.test.mjs.
//
// No force from outside, so the total momentum is the same before and after (m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂); with the
// book's assumption that only kinetic energy changes hands, the total kinetic energy is the same too
// (½m₁u₁² + ½m₂u₂² = ½m₁v₁² + ½m₂v₂²). The two equations give
//   v₁ = ((m₁ − m₂)u₁ + 2m₂u₂) / (m₁ + m₂),   v₂ = ((m₂ − m₁)u₂ + 2m₁u₁) / (m₁ + m₂).
//
// One run on screen: the balls approach (time 10 times slower), touch, and while they touch (time slowed much more)
// the velocities change over smoothly, as a very stiff spring between them would do it: the relative velocity
// goes from w to −w as w·cos(πk), so at every instant the total momentum is the same. Then they move apart
// (10 times slower again). Everything is a function of the playback time τ, so a run can be scrubbed and filmed.
// Lengths in m, masses in kg, velocities in m/s; to the right is positive.

/** The stretch of track in view (m); the balls stay inside it, this far from its ends. */
export const WINDOW = { left: -0.7, right: 0.7 };
export const EDGE = 0.02;
/** Before and after the contact, time on screen runs this many times slower than in the collision. */
export const SLOW = 10;
/** Seconds on screen for the contact itself (in a real collision it lasts a tiny fraction of a second). */
export const CONTACT = 1.6;
/** At most this long (s, real time) before and after the contact. */
export const T_CAP = 0.25;
/** Length of a velocity arrow: metres per m/s (½ m/s is still a visible arrow on a small phone). */
export const ARROW = 0.1;
/** The velocities the student can choose (m/s, whole numbers). */
export const U_MIN = -3;
export const U_MAX = 3;
/**
 * u₁ − u₂ at most this (m/s): then no velocity after the collision is faster than 5 m/s, so the arrows (0.5 m at
 * most) and the run still fit the track in view.
 */
export const D_MAX = 4;
/** The masses the bridge accepts (kg). */
export const M_MIN = 0.5;
export const M_MAX = 5;

/** The four examples in the panel: clean numbers, so the sums show exactly. */
export const PRESETS = {
  heavy: { m1: 3, m2: 1, u1: 2, u2: 0 }, // a heavy ball runs into a light one at rest: v₁ = 1, v₂ = 3
  equal: { m1: 2, m2: 2, u1: 3, u2: 1 }, // equal masses swap their velocities: v₁ = 1, v₂ = 3
  light: { m1: 1, m2: 3, u1: 2, u2: 0 }, // a light ball runs into a heavy one: it bounces back, v₁ = −1, v₂ = 1
  headon: { m1: 3, m2: 1, u1: 2, u2: -2 }, // head-on: v₁ = 0, v₂ = 4 (momentum 6 + (−2) = 0 + 4)
};
export const PRESET_IDS = /** @type {Array<keyof typeof PRESETS>} */ (Object.keys(PRESETS));

/** No binary leftovers and no −0: 0.1 + 0.2 → 0.3. */
export const clean = (x, d = 9) => +(+x).toFixed(d) || 0;

/** A ball's radius (m) from its mass: all the balls are of the same material (about 470 kg/m³, like light wood). */
export const radiusOf = (m) => 0.08 * Math.cbrt(m);

/** The velocities after an elastic collision (kinetic energy kept), from both conservation laws. */
export function elastic(m1, m2, u1, u2) {
  const M = m1 + m2;
  return { v1: clean(((m1 - m2) * u1 + 2 * m2 * u2) / M), v2: clean(((m2 - m1) * u2 + 2 * m1 * u1) / M) };
}

export const momentum = (m, v) => clean(m * v);
export const kinetic = (m, v) => clean(0.5 * m * v * v);

/** v₂ from the momentum equation alone, when m₁, m₂, u₁, u₂ and v₁ are known. */
export const v2FromMomentum = ({ m1, m2, u1, u2 }, v1) => clean((m1 * u1 + m2 * u2 - m1 * v1) / m2);

/** Do the two balls meet? Ball 1 is behind (to the left), so it must be faster to the right than ball 2. */
export const collides = ({ u1, u2 }) => u1 > u2;

/**
 * A setup made valid: whole-number velocities within U_MIN…U_MAX, masses within M_MIN…M_MAX, u₁ > u₂ (they must
 * meet) and u₁ − u₂ ≤ D_MAX. `keep` says which velocity the student just set ('u1' | 'u2'): the other one gives way.
 */
export function normalize({ m1, m2, u1, u2 }, keep = 'u1') {
  const m = (x) => Math.min(M_MAX, Math.max(M_MIN, clean(Number(x) || 1, 3)));
  const u = (x) => Math.min(U_MAX, Math.max(U_MIN, Math.round(Number(x) || 0)));
  let a = u(u1);
  let b = u(u2);
  if (keep === 'u2') {
    if (a <= b) a = Math.min(U_MAX, b + 1);
    if (a <= b) b = a - 1;
    if (a - b > D_MAX) a = b + D_MAX;
  } else {
    if (a <= b) b = Math.max(U_MIN, a - 1);
    if (a <= b) a = b + 1;
    if (a - b > D_MAX) b = a - D_MAX;
  }
  return { m1: m(m1), m2: m(m2), u1: a, u2: b };
}

/** Every setup the student can reach: the examples' mass pairs and whole velocities with u₁ > u₂, u₁ − u₂ ≤ D_MAX. */
export function reachableSetups() {
  const out = [];
  for (const [m1, m2] of [
    [3, 1],
    [2, 2],
    [1, 3],
  ])
    for (let u1 = U_MIN; u1 <= U_MAX; u1++) for (let u2 = U_MIN; u2 < u1; u2++) if (u1 - u2 <= D_MAX) out.push({ m1, m2, u1, u2 });
  return out;
}

/**
 * The run for a setup: where the balls touch, how long they move before and after, the velocities after, the
 * totals. Each ball and its velocity arrow (ARROW m per m/s, from the ball's centre) stay inside the window the
 * whole run. The contact point is chosen so the run before and after the contact is as long as the window allows
 * (both up to T_CAP), and as near the middle as possible.
 */
export function plan(setup) {
  const { m1, m2, u1, u2 } = setup;
  const r1 = radiusOf(m1);
  const r2 = radiusOf(m2);
  const { v1, v2 } = elastic(m1, m2, u1, u2);
  const L = WINDOW.left + EDGE;
  const R = WINDOW.right - EDGE;
  /** The reach of a ball with its arrow, from its centre: [lo, hi]. */
  const reach = (r, v) => [Math.min(-r, ARROW * v), Math.max(r, ARROW * v)];
  /** How long a ball at x (radius r, arrow for w) can move at v before it or its arrow leaves the window. */
  function room(x, r, w, v) {
    const [lo, hi] = reach(r, w);
    if (x + lo < L - 1e-9 || x + hi > R + 1e-9) return -1; // already out
    return v > 0 ? (R - hi - x) / v : v < 0 ? (x + lo - L) / -v : Number.POSITIVE_INFINITY;
  }
  let best = null;
  for (let c = L + 2 * r1; c <= R - 2 * r2 + 1e-9; c += 0.005) {
    const x1 = c - r1;
    const x2 = c + r2;
    // before the contact the balls came from where moving at −u for that long takes them
    const tb = Math.min(T_CAP, room(x1, r1, u1, -u1), room(x2, r2, u2, -u2));
    const ta = Math.min(T_CAP, room(x1, r1, v1, v1), room(x2, r2, v2, v2));
    const score = (tb < 0 || ta < 0 ? -100 : 0) + 10 * Math.min(tb, ta) + tb + ta - 0.01 * Math.abs(c);
    if (!best || score > best.score + 1e-12) best = { score, c, tb: Math.max(0.02, tb), ta: Math.max(0.02, ta) };
  }
  const c = clean(best.c, 4);
  const P = clean(m1 * u1 + m2 * u2);
  const K = clean(0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2);
  return {
    m1,
    m2,
    u1,
    u2,
    v1,
    v2,
    r1,
    r2,
    contact: c, // where they touch (x of the touching point)
    x1c: clean(c - r1, 6), // the centres while they touch
    x2c: clean(c + r2, 6),
    tb: clean(best.tb, 6), // real seconds before and after the contact
    ta: clean(best.ta, 6),
    P, // total momentum (kg m/s), the same all the time
    K, // total kinetic energy before = after (J)
    Tb: clean(best.tb * SLOW, 6), // seconds on screen: before, the contact, after
    Tc: CONTACT,
    Ta: clean(best.ta * SLOW, 6),
    T: clean(best.tb * SLOW + CONTACT + best.ta * SLOW, 6),
  };
}

/** Smooth 0…1 of the contact: the relative velocity is w·cos(πk). */
export function contactVelocities(p, k) {
  const M = p.m1 + p.m2;
  const V = (p.m1 * p.u1 + p.m2 * p.u2) / M; // the centre of mass keeps its velocity
  const w = (p.u1 - p.u2) * Math.cos(Math.PI * Math.min(1, Math.max(0, k)));
  return { v1: clean(V + (p.m2 / M) * w), v2: clean(V - (p.m1 / M) * w) };
}

/**
 * Everything at playback time τ (s on screen, 0…p.T): phase ('before' | 'contact' | 'after'), k (0…1 through
 * the contact), the centres x1, x2 (m), the velocities v1, v2 (m/s), the momenta p1, p2 (kg m/s) and the kinetic
 * energies k1, k2 (J). τ = Tb is the touch (still 'before'); the run ends at τ = T ('after').
 */
export function stateAt(p, tau) {
  const t = Math.min(p.T, Math.max(0, tau));
  let phase;
  let k = 0;
  let x1;
  let x2;
  let v1;
  let v2;
  if (t <= p.Tb) {
    phase = 'before';
    const dt = (t - p.Tb) / SLOW; // real seconds from the touch (negative)
    x1 = p.x1c + p.u1 * dt;
    x2 = p.x2c + p.u2 * dt;
    v1 = p.u1;
    v2 = p.u2;
  } else if (t < p.Tb + p.Tc) {
    phase = 'contact';
    k = (t - p.Tb) / p.Tc;
    x1 = p.x1c;
    x2 = p.x2c;
    ({ v1, v2 } = contactVelocities(p, k));
  } else {
    phase = 'after';
    k = 1;
    const dt = (t - p.Tb - p.Tc) / SLOW;
    x1 = p.x1c + p.v1 * dt;
    x2 = p.x2c + p.v2 * dt;
    v1 = p.v1;
    v2 = p.v2;
  }
  return {
    tau: t,
    phase,
    k,
    x1,
    x2,
    v1,
    v2,
    p1: momentum(p.m1, v1),
    p2: momentum(p.m2, v2),
    k1: kinetic(p.m1, v1),
    k2: kinetic(p.m2, v2),
  };
}

/** The playback time of a named moment: 'start' | 'touch' | 'contact' (half way through it) | 'after' | 'end'. */
export function momentAt(p, at) {
  if (typeof at === 'number' && Number.isFinite(at)) return Math.min(p.T, Math.max(0, at));
  if (at === 'touch') return p.Tb;
  if (at === 'contact') return p.Tb + p.Tc / 2;
  if (at === 'after') return p.Tb + p.Tc;
  if (at === 'end') return p.T;
  return 0;
}

/**
 * The momentum strip's range (kg m/s): from the smallest to the largest of 0, the parts and the total, before,
 * during and after the contact (during it m₁'s momentum goes from m₁u₁ to m₁v₁ without passing them).
 */
export function stripRange(p) {
  const xs = [0, p.m1 * p.u1, p.m1 * p.v1, p.P];
  const lo = Math.min(...xs);
  let hi = Math.max(...xs);
  if (hi - lo < 1) hi = lo + 1;
  return { lo, hi };
}

/**
 * A number for a sentence or a sum: at most `d` decimals, no trailing zeros, a real minus sign (−).
 * fixed: always `fixed` decimals (live readouts while something changes).
 */
export function fmt(x, d = 2, fixed = null) {
  const v = clean(x, fixed ?? d);
  const s = fixed != null ? Math.abs(v).toFixed(fixed) : String(Math.abs(v));
  return v < 0 ? `−${s}` : s;
}

/** The setup of a preset, or null. */
export const presetOf = (id) => (PRESETS[id] ? { ...PRESETS[id] } : null);

/** Which preset a setup is ('' if none). */
export function presetMatching({ m1, m2, u1, u2 }) {
  for (const id of PRESET_IDS) {
    const q = PRESETS[id];
    if (q.m1 === m1 && q.m2 === m2 && q.u1 === u1 && q.u2 === u2) return id;
  }
  return '';
}
