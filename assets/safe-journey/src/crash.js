// The book's example (pages 74–75, topic 3.5.2): a heavily loaded truck (m₁) and a small car (m₂) at the same speed
// collide head-on. Pure functions, no three.js, unit-tested in test/unit/safe-journey.test.mjs.
//
// To the right is positive: the truck's velocity is u, the car's −u. The book takes the car's mass as zero next to
// the truck's (m₂ ≈ 0) and uses the velocities after a collision in which only kinetic energy changes hands (3.5.1):
//   v₁ = ((m₁ − m₂)u₁ + 2m₂u₂) / (m₁ + m₂),   v₂ = ((m₂ − m₁)u₂ + 2m₁u₁) / (m₁ + m₂)
// so v₁ = u and v₂ = 3u: the car's velocity changes by 3u − (−u) = 4u. With real masses (the book says you may try
// them) the numbers are close: a 20,000 kg truck and a 1,000 kg car give v₁ ≈ 0.81u and v₂ ≈ 2.81u.
// Kinetic energy is ½mv²: twice the velocity, four times the energy. One cube of energy is the car's kinetic energy
// at 20 km/h (BASE), so the cubes at a speed v make a square of side v / 20: 1, 4, 9 cubes at 20, 40, 60 km/h.
//
// One run on screen (a pure function of the playback time τ, so it can be jumped to and filmed): the two approach
// with time SLOW times slower than real, touch, and the contact itself is slowed much more (CONTACT s on screen for a
// few hundredths of a second): the velocities change over as a very stiff spring between them would do it (their
// relative velocity goes from −2u to +2u as −2u·cos πk), so the momentum is the same at every instant. The car's
// front is squashed (the crumple, drawn in proportion to its kinetic energy); then they move apart with v₁ and v₂.
// Lengths in m, masses in kg, velocities in m/s inside, km/h on screen.

/** m/s in one km/h. */
export const KMH = 1 / 3.6;
/** The speeds the student can choose (km/h): the second is twice the first, the third three times. */
export const SPEEDS = [20, 40, 60];
/** km/h: one cube of kinetic energy is the car's kinetic energy at this speed. */
export const BASE = 20;
/** The masses: as the book takes them (m₂ ≈ 0), or real ones (a loaded truck and a small car). */
export const MASSES = { book: { m1: 20000, m2: 0 }, real: { m1: 20000, m2: 1000 } };
/** Before and after the contact, time on screen runs this many times slower than in the crash. */
export const SLOW = 8;
/** Seconds on screen for the contact itself (in the crash it lasts a few hundredths of a second). */
export const CONTACT = 1.2;
/** Length of a velocity arrow: metres per km/h. */
export const ARROW = 0.04;
/** The car's length (m): the crumple shortens it from the front. */
export const CAR_LENGTH = 3.5;

/** No binary leftovers and no −0: 0.1 + 0.2 → 0.3. */
export const clean = (x, d = 9) => +(+x).toFixed(d) || 0;

/** The velocities after a collision in which only kinetic energy changes hands (the book's formulas). */
export function elastic(m1, m2, u1, u2) {
  const M = m1 + m2;
  return { v1: clean(((m1 - m2) * u1 + 2 * m2 * u2) / M), v2: clean(((m2 - m1) * u2 + 2 * m1 * u1) / M) };
}

/** The car's kinetic energy at v km/h, in cubes (the energy at 20 km/h): (v / 20)². */
export const cubes = (v) => clean((v / BASE) ** 2);
/** Kinetic energy ½mv² in J, for a mass in kg and a velocity in km/h. */
export const kinetic = (m, v) => clean(0.5 * m * (v * KMH) ** 2, 3);
/** How far the car's front is squashed (m): in proportion to its kinetic energy, 15 cm per cube (drawn, not computed). */
export const crumpleDepth = (v) => clean(0.15 * cubes(v));
/** The gap between the two at the start (m), and how far the car goes after the contact before the run ends. */
export const startGap = (v) => clean(2 + 0.1 * v);
export const flightDistance = (v) => clean(1.2 + 0.05 * v);

/** The speed made valid: one of SPEEDS (the nearest). */
export function normalizeSpeed(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return SPEEDS[0];
  return SPEEDS.reduce((best, s) => (Math.abs(s - x) < Math.abs(best - x) ? s : best), SPEEDS[0]);
}

/**
 * Everything about one run at `speed` km/h: velocities in m/s and km/h, the crumple, the real contact time and the
 * screen times of the three parts (approach, contact, flight).
 * @param {number} speed km/h
 * @param {'book' | 'real'} masses
 */
export function plan(speed, masses = 'book') {
  const { m1, m2 } = MASSES[masses] || MASSES.book;
  const M = m1 + m2;
  const u = speed * KMH;
  const { v1, v2 } = elastic(m1, m2, u, -u);
  const c = crumpleDepth(speed);
  // the contact time that squashes the car by c at the moment both move together (see stateAt)
  const Tc = (Math.PI * c) / (2 * u);
  const gap = startGap(speed);
  const flight = flightDistance(speed);
  const approach = (SLOW * gap) / (2 * u);
  const after = (SLOW * flight) / v2;
  return {
    speed,
    masses: masses === 'real' ? 'real' : 'book',
    m1,
    m2,
    u,
    v1,
    v2,
    V: ((m1 - m2) * u) / M, // the centre of mass's velocity
    c,
    Tc,
    gap,
    flight,
    approach,
    contact: CONTACT,
    after,
    duration: approach + CONTACT + after,
    kmh: { u: speed, v1: clean(v1 / KMH, 6), v2: clean(v2 / KMH, 6), change: clean((v2 + u) / KMH, 6), truckChange: clean((u - v1) / KMH, 6) },
  };
}

/**
 * The run at screen time τ (s; before 0 it waits at the start, after the end it holds the end). Positions are
 * measured from the point where the two fronts first touch: x1 is the truck's front, rear is the car's back end,
 * front is the car's front as squashed. Velocities v1, v2 in m/s (to the right positive).
 * phase: 'ready' | 'approach' | 'contact' | 'after' | 'end'; k: the contact's progress (0…1).
 */
export function stateAt(p, tau) {
  const L = CAR_LENGTH;
  const { u, m1, m2, V, Tc, approach, contact, after } = p;
  const M = m1 + m2;
  const t = Math.max(0, tau);
  if (t < approach || tau <= 0) {
    const real = (t - approach) / SLOW; // s of real time before the contact (negative)
    const x1 = u * real;
    const front = -u * real;
    return { phase: tau <= 0 ? 'ready' : 'approach', k: 0, x1, front, rear: front + L, crumple: 0, v1: u, v2: -u };
  }
  // during the contact: the relative velocity w = v₂ − v₁ goes from −2u to 2u as −2u·cos πk
  const contactAt = (k) => {
    const s = (2 * u * Math.sin(Math.PI * k)) / Math.PI; // ∫ −w dk' from 0 to k, per unit of Tc
    const x1 = Tc * (V * k + (m2 / M) * s);
    const rear = L + Tc * (V * k - (m1 / M) * s);
    const squeeze = Tc * s; // how much shorter the car is than L while the fronts are together (0 at both ends)
    const crumple = k <= 0.5 ? squeeze : p.c; // it squashes up to the middle, then stays squashed
    const w = -2 * u * Math.cos(Math.PI * k);
    return { x1, rear, crumple, front: rear - L + crumple, v1: V - (m2 / M) * w, v2: V + (m1 / M) * w };
  };
  if (t < approach + contact) {
    const k = (t - approach) / contact;
    return { phase: 'contact', k, ...contactAt(k) };
  }
  const end = contactAt(1);
  const tf = Math.min(after, t - approach - contact) / SLOW; // s of real time since the contact ended
  const done = t >= approach + contact + after;
  const x1 = end.x1 + p.v1 * tf;
  const rear = end.rear + p.v2 * tf;
  return { phase: done ? 'end' : 'after', k: 1, x1, rear, front: rear - L + p.c, crumple: p.c, v1: p.v1, v2: p.v2 };
}

/** The total momentum (kg m/s) at a state: the same before, during and after (no force from outside). */
export const momentum = (p, st) => clean(p.m1 * st.v1 + p.m2 * st.v2, 6);
