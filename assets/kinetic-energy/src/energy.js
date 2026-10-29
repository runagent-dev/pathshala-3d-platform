// The maths of the figure (pure, unit-tested in test/unit/kinetic-energy.test.mjs). Book p104, topic 4.3.1:
// T = ½mv² (the book writes the kinetic energy as T), and ½mv² = ½mu² + W: a body that starts at rest (u = 0) gets
// as much kinetic energy as the work W done on it. Here the bow's string does that work on the arrow.
//
// The bow is drawn as an ideal one: its pull grows evenly with the draw (stiffness K), and all the energy stored in
// the bent bow goes into the arrow (a real bow keeps some of it). So the draw needed for a speed v is
// s = v·√(m/K), and the arrow pushes into the straw bale until the bale's steady resistance has taken all of T.

export const K = 400; // N/m: 200 N at the full 0.5 m draw, about a 45 lb recurve
export const DRAW_MAX = 0.5; // m: how far the string can be pulled back from rest
export const MASSES = [0.02, 0.03, 0.04]; // kg: a light target arrow … a heavy hunting arrow
export const SPEEDS = [20, 30, 40, 50, 60]; // m/s
export const BALE_RESIST = 160; // N: the straw's average push back on the arrow (stated as a model)
export const G = 9.8; // m/s²
export const SLOW = 15; // the flight is shown this many times slower than real
export const DEFAULTS = { m: 0.02, v: 30 };

/** T = ½mv², in J. */
export const kinetic = (m, v) => 0.5 * m * v * v;

/** The draw (m) that gives an arrow of mass m the speed v. */
export const drawFor = (m, v) => v * Math.sqrt(m / K);

/** The energy (J) stored in the bow at draw s: the work its string then does on the arrow. */
export const stored = (s) => 0.5 * K * s * s;

/** The speed an arrow of mass m leaves with from draw s (all the stored energy becomes T). */
export const speedFrom = (m, s) => Math.sqrt((2 * stored(s)) / m);

/** The speeds this bow can give an arrow of mass m (the draw stays within DRAW_MAX). */
export const speedsFor = (m) => SPEEDS.filter((v) => drawFor(m, v) <= DRAW_MAX + 1e-9);

/** The fastest step this bow allows for mass m. */
export const maxSpeed = (m) => Math.max(...speedsFor(m));

/** How deep (m) the arrow goes into the bale: its T against the bale's steady resistance (W = Fs). */
export const depthIn = (T) => T / BALE_RESIST;

/** Round to n decimals and drop trailing zeros: 2.25, 9, 0.02. */
export function plain(x, n = 3) {
  const r = Math.round(x * 10 ** n) / 10 ** n;
  return String(Object.is(r, -0) ? 0 : r);
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * A ratio of two quantities given as whole-number parts (e.g. speeds 30 and 60, masses in grams), as
 * { p, q, value }: reduced p/q.
 */
export function ratio(after, before) {
  const g = gcd(after, before) || 1;
  return { p: after / g, q: before / g, value: after / before };
}

/** The ratio of the kinetic energies of two shots (masses in kg, speeds in m/s), reduced as p/q. */
export function energyRatio(a, b) {
  const ga = Math.round(a.m * 1000);
  const gb = Math.round(b.m * 1000);
  return ratio(ga * a.v * a.v, gb * b.v * b.v);
}

/** Whether a ratio is a short exact decimal (2, 0.25, 2.25); else it is shown rounded, with "about". */
export const ratioExact = ({ p, q }) => Math.abs((p / q) * 100 - Math.round((p / q) * 100)) < 1e-9;

/** A ratio as text: a whole number or a short decimal, rounded to two places (1.67, 0.44). */
export const ratioText = ({ p, q }) => plain(p / q, 2);

/**
 * Where the arrow is t seconds (real time) after it leaves the bow at speed v (m/s), aimed level: dx forward,
 * dy down by gravity, and the slope of its path (for the arrow's tilt).
 */
export function flight(v, t) {
  return { dx: v * t, dy: -0.5 * G * t * t, slope: (-G * t) / v };
}

/** The real time (s) the arrow takes to fly a distance d at speed v. */
export const flightTime = (v, d) => d / v;

/** Fisher–Yates shuffle (in place). */
export function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Four distinct choices: the answer and the first three distinct wrong ones, shuffled. */
export function choicesFrom(answer, wrong) {
  const out = [answer];
  for (const w of wrong) if (out.length < 4 && w >= 0 && !out.some((x) => Math.abs(x - w) < 1e-9)) out.push(w);
  return shuffle(out);
}
