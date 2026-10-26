// The maths of the figure, pure functions (unit-tested in test/unit/momentum.test.mjs).
//
// Momentum is p = m v (kg m/s), a vector along the velocity: in one dimension, to the right is positive and a
// velocity or momentum to the left is negative (the same convention as conservation-of-momentum, 3.5.1).
//
// The crash only has to be believable, not taught (momentum conservation is 3.5.1): a vehicle of mass m1 meets a
// parked small car (m2) at speed u. In a short impact the car's end crumples by `crush` while the vehicle keeps its
// speed, then the two separate with the speeds of a collision that loses most of its energy (restitution e), the
// car skids to rest on its locked tyres and the vehicle brakes. Distances along the lane: 0 is the parked car's
// end that is hit; the vehicle comes from negative values.
//
// Numbers (realistic, rounded): a loaded truck about 10,000 kg, a bicycle with its rider 80 kg, the small car
// 1,000 kg, a runner 60 kg.

export const MASS = { truck: 10000, bike: 80, car: 1000, runner: 60 };
/** m between the vehicles' fronts and the parked cars at the start of a run (the same for every speed). */
export const GAP = 5;
/** The speeds the student can choose (m/s, whole numbers): 5 m/s is 18 km/h. */
export const SPEED = { min: 1, max: 8, start: 5 };
/** Arrow lengths in metres: per m/s for velocity, per kg m/s for momentum (both p arrows on one scale). */
export const SCALE = { v: 0.32, p: 1 / 200 };
export const G = 9.8;
export const CRASH = {
  e: 0.15, // restitution: a car crash keeps little of its energy
  skid: 0.7 * G, // the parked car's locked tyres on asphalt
  brake: { truck: 5.5, bike: 3, car: 6, runner: 4 }, // m/s² after the impact (the driver or rider brakes)
  stiffness: 4e5, // N/m of the car's crumple zone
  share: { truck: 0.9, bike: 0.5, car: 0.6, runner: 0.3 }, // part of the lost energy that dents the car
  maxCrush: 0.45, // m
  crumpled: 0.1, // m: a smaller dent is a dent (টোল), a deeper one a crumpled end (দুমড়ে)
};

/** p = m v (kg m/s), signed like v. */
export const momentum = (m, v) => m * v;

/** A number with no binary leftovers: roundTo(0.1 + 0.2, 0.01) === 0.3 */
export function roundTo(x, step) {
  const d = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  return +(Math.round(x / step) * step).toFixed(d);
}

/**
 * Digits of a whole number with commas from 1,000 up, as printed in Bangladesh (the figure's numbers stay under
 * 1,00,000, so the lakh comma never comes up), and the minus sign U+2212 for negative numbers.
 */
export function group(n) {
  const neg = n < 0;
  const s = String(Math.round(Math.abs(n)));
  const out = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return neg ? `−${out}` : out;
}

/** A plain number (no trailing zeros), minus as U+2212: 0.4 → "0.4", -5 → "−5". */
export function plain(x, digits = 2) {
  const v = +x.toFixed(digits);
  return v < 0 ? `−${Math.abs(v)}` : String(v === 0 ? 0 : v);
}

/** A number as the panel shows it: whole numbers with commas (50,000), others with one decimal (11.4). */
export const fmt = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? group(x) : plain(x, 1));

/**
 * A distance said "about" (প্রায়): whole centimetres below a metre, else metres with at most one decimal. Under
 * half a centimetre it is "less than 1 cm" (less: true), never rounded up to look bigger.
 * → { value, unit: 'cm' | 'm', less }
 */
export function about(d) {
  const a = Math.abs(d);
  if (a < 0.005) return { value: 1, unit: 'cm', less: true };
  if (a < 0.995) return { value: Math.round(a * 100), unit: 'cm', less: false };
  return { value: roundTo(a, a < 9.95 ? 0.1 : 1), unit: 'm', less: false };
}

/**
 * What happens when a body of mass m1 (kind: 'truck' | 'bike' | …) meets the parked car at speed u > 0, the gap
 * closing from `gap`.
 * Returns the times (s from the start of the run) and the motion after the impact.
 */
export function crashPlan(kind, u, { m1 = MASS[kind], m2 = MASS.car, gap = GAP } = {}) {
  const { e, skid, stiffness, maxCrush } = CRASH;
  const brake = CRASH.brake[kind] ?? 4;
  const share = CRASH.share[kind] ?? 0.5;
  const mu = (m1 * m2) / (m1 + m2); // reduced mass
  const lost = 0.5 * mu * (1 - e * e) * u * u; // J turned into crumpling, heat and sound
  const crush = Math.min(maxCrush, Math.sqrt((2 * share * lost) / stiffness));
  const v1 = ((m1 - e * m2) / (m1 + m2)) * u; // the body after the impact (negative: it bounces back)
  const v2 = (((1 + e) * m1) / (m1 + m2)) * u; // the car after the impact
  const tHit = gap / u;
  const tSplit = tHit + crush / u; // the end of the crumpling, at the body's speed
  const t1 = Math.abs(v1) / brake; // the body comes to rest this long after the split
  const t2 = v2 / skid;
  const s1 = (v1 * Math.abs(v1)) / (2 * brake); // signed distance the body moves after the split
  const s2 = (v2 * v2) / (2 * skid);
  return { kind, u, m1, m2, gap, crush, v1, v2, brake, skid, tHit, tSplit, t1, t2, s1, s2, tEnd: tSplit + Math.max(t1, t2), lost };
}

/**
 * Where everything is t s after the start of a run (pure in t, so pictures and the video are exact):
 *   front: the body's front (m, 0 = where the parked car's end was), v: the body's velocity (m/s, along the lane),
 *   car: how far the car has been pushed (m), carV, crush: the dent so far (m), phase: 'approach' | 'impact' | 'after'
 *   | 'rest', since: s since the impact (null before).
 */
export function runAt(plan, t) {
  const { u, crush, v1, v2, brake, skid, tHit, tSplit, t1, t2, s1, s2, gap } = plan;
  if (t < tHit) return { phase: 'approach', front: -gap + u * Math.max(0, t), v: u, car: 0, carV: 0, crush: 0, since: null };
  if (t < tSplit) {
    const c = u * (t - tHit);
    return { phase: 'impact', front: c, v: u, car: 0, carV: 0, crush: c, since: t - tHit };
  }
  const a = t - tSplit;
  const ta = Math.min(a, t1);
  const front = crush + v1 * ta - Math.sign(v1) * 0.5 * brake * ta * ta;
  const v = a < t1 ? v1 - Math.sign(v1) * brake * a : 0;
  const tc = Math.min(a, t2);
  const car = v2 * tc - 0.5 * skid * tc * tc;
  const carV = a < t2 ? v2 - skid * a : 0;
  const rest = a >= Math.max(t1, t2);
  return {
    phase: rest ? 'rest' : 'after',
    front: rest ? crush + s1 : front,
    v: rest ? 0 : v,
    car: rest ? s2 : car,
    carV: rest ? 0 : carV,
    crush,
    since: t - tHit,
  };
}

/** The gap left between the body's front and the car's dented end (m): never negative during a run. */
export const clearance = (plan, t) => {
  const st = runAt(plan, t);
  return st.car + st.crush - st.front;
};

// ── the test's choices: the right one and three from the usual mistakes ────────────────────────────────────────
// Each choice: { value (kg m/s), mistake: null | key }. The app shuffles and labels them.

/** "p of this body?": m × v (right), m ÷ v, m + v, and m × v² (as if the velocity counted twice); all different. */
export function calcChoices(m, v) {
  return [
    { value: m * v, mistake: null },
    { value: roundTo(m / v, 0.1), mistake: 'divide' },
    { value: m + v, mistake: 'add' },
    { value: m * v * v, mistake: 'square' },
  ];
}

/** "v doubles: p becomes?": 2p (right), 4p (as if p grew with v²), p (as if only m counted), p/2. */
export function doubleChoices(p) {
  return [
    { value: 2 * p, mistake: null },
    { value: 4 * p, mistake: 'square' },
    { value: p, mistake: 'same' },
    { value: p / 2, mistake: 'half' },
  ];
}

/** "moving left at speed w (positive), p = ?": −m w (right), +m w (sign dropped), −m ÷ w, +m ÷ w. */
export function signChoices(m, w) {
  return [
    { value: -m * w, mistake: null },
    { value: m * w, mistake: 'sign' },
    { value: -roundTo(m / w, 0.1), mistake: 'divide' },
    { value: roundTo(m / w, 0.1), mistake: 'both' },
  ];
}

/** Which of two bodies has more momentum: 'a' | 'b' | 'equal' (to 1 kg m/s). */
export function compare(a, b) {
  const pa = Math.abs(momentum(a.m, a.v));
  const pb = Math.abs(momentum(b.m, b.v));
  if (Math.abs(pa - pb) < 1) return 'equal';
  return pa > pb ? 'a' : 'b';
}
