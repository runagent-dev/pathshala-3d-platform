// The physics of the figure, kept apart from the 3D so it can be unit-tested. Simple harmonic motion: released
// from rest at one end (t = 0), the displacement from the equilibrium point (সাম্যবিন্দু) is x = x0 cos(ωt), the
// velocity v = −x0 ω sin(ωt), so the speed is zero at the ends and greatest (|x0| ω) at the equilibrium point,
// and the period (পর্যায়কাল) is T = 2π / ω.
//   swing (দোলনা): a pendulum, ω = √(g / L) with L from the top pole to the centre of mass of the girl and the
//     seat (1.5 m; the ropes are 1.7 m to the seat, and a seated child's centre of mass is about 0.2 m above it).
//     True for small swings: up to 25° the real period is at most 1.3 % longer (the unit test checks it), so the
//     figure keeps the swing within 25°.
//   spring (স্প্রিং): a mass m on a spring of stiffness k, ω = √(k / m), exactly.
// Distances are metres along the path (for the swing: the arc the seat travels, radius R), times seconds.

export const G = 9.8; // m/s²
export const SWING = { L: 1.5, R: 1.7, minDeg: 8, maxDeg: 25, startDeg: 24 };
export const SPRING = { m: 2, k: 50, rest: 0.1, minA: 0.06, maxA: 0.15, startA: 0.12 };
export const EXAMPLES = ['swing', 'spring'];
export const STROBE = 16; // the dots on the path: where it is every T/16 (9 places from end to end)

export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const RAD = Math.PI / 180;

/** Angular frequency ω (rad/s) and period T (s) of an example. */
export const omega = (example) => (example === 'spring' ? Math.sqrt(SPRING.k / SPRING.m) : Math.sqrt(G / SWING.L));
export const period = (example) => (2 * Math.PI) / omega(example);

/** The swing's amplitude along the seat's arc (m) from its angle (degrees), and back. */
export const arcOf = (deg) => SWING.R * deg * RAD;
export const degOf = (arc) => arc / SWING.R / RAD;

/** The smallest and largest amplitude the student can give (m along the path). */
export function amplitudeRange(example) {
  return example === 'spring' ? [SPRING.minA, SPRING.maxA] : [arcOf(SWING.minDeg), arcOf(SWING.maxDeg)];
}
export const startAmplitude = (example) => (example === 'spring' ? SPRING.startA : arcOf(SWING.startDeg));

/** How far the spring is stretched at the equilibrium point: m g / k (m). */
export const springStretch = () => (SPRING.m * G) / SPRING.k;

/**
 * The motion at time t (s) after it was let go from rest at x0 (m, signed: which end): displacement x,
 * velocity v (same sign convention), speed, the greatest speed, and the phase (0…1 of the period).
 */
export function motionAt(example, x0, t) {
  const w = omega(example);
  const T = (2 * Math.PI) / w;
  const x = x0 * Math.cos(w * t);
  const v = -x0 * w * Math.sin(w * t);
  return { x, v, speed: Math.abs(v), maxSpeed: Math.abs(x0) * w, phase: phaseOf(t, T), period: T };
}

/** The phase of time t in a period T, 0 ≤ phase < 1 (0: at the end it was let go from). */
export function phaseOf(t, T) {
  const p = (t / T) % 1;
  return p < 0 ? p + 1 : p;
}

/**
 * Where it is in the journey, by phase: 'end' near either end (within 1/32 of a period, where it is almost at
 * rest), 'middle' near the equilibrium point, otherwise 'between'; and whether it is going 'in' (toward the
 * equilibrium point: getting faster) or 'out' (toward an end: getting slower).
 */
export function placeOf(phase) {
  const p = phaseOf(phase, 1);
  const quarter = Math.floor(p * 4); // 0: end → middle, 1: middle → end, 2: end → middle, 3: middle → end
  const q = p * 4 - quarter;
  const going = quarter % 2 === 0 ? 'in' : 'out';
  const fromMiddle = going === 'in' ? 1 - q : q; // in quarter periods: 0 at the equilibrium point, 1 at an end
  const near = 1 / 8; // 1/32 of a period
  return { place: fromMiddle > 1 - near ? 'end' : fromMiddle < near ? 'middle' : 'between', going };
}

/** The strobe dots, as fractions of the amplitude: cos(π k / (n/2)) for k = 0 … n/2, from one end to the other. */
export function strobe(n = STROBE) {
  const half = n / 2;
  return Array.from({ length: half + 1 }, (_, k) => roundTo(Math.cos((Math.PI * k) / half), 1e-6));
}

/** Seconds between two strobe dots. */
export const strobeStep = (example) => period(example) / STROBE;

/**
 * Wrong answers for "it takes h seconds from one end to the other: what is the period?" from the usual
 * mistakes: the half journey itself (h), a quarter (h/2), twice too much (4h). The right one is 2h.
 */
export function periodChoices(h) {
  return { right: roundTo(2 * h, 0.01), wrong: [roundTo(h, 0.01), roundTo(h / 2, 0.01), roundTo(4 * h, 0.01)] };
}

/** Vertical spring: x is measured UP from equilibrium, not from the unstretched spring length.
 * U includes elastic and gravitational potential, with its zero at equilibrium: U = k x² / 2.
 * The two linear terms cancel because k·stretch = mg. K + U is therefore conserved.
 */
export function springQuantities({ x, v }) {
  const kinetic = 0.5 * SPRING.m * v * v;
  const potential = 0.5 * SPRING.k * x * x;
  return { acceleration: -(omega('spring') ** 2) * x, kinetic, potential, total: kinetic + potential };
}
