// The maths of the Pascal's law figure (book page 141, topic 5.3.3). A force F₁ on the small piston (area A₁) makes a
// pressure P = F₁/A₁ in the oil; Pascal's law carries it unchanged to the big piston (area A₂), so F₂ = PA₂ =
// F₁(A₂/A₁). The same oil volume leaves one cylinder and enters the other, so the big piston moves d₂ = d₁(A₁/A₂), and
// the work in equals the work out: F₁d₁ = F₂d₂ (it multiplies force, not energy). Forces in newtons, areas in m²,
// distances in metres. Pure functions, unit-tested in test/unit/pascal-law.test.mjs.

/** The small piston's area: 100 cm² = 0.01 m² (a round bore of about 11.3 cm). */
export const A1 = 0.01;
/** A₂/A₁ for the three lift pistons the student can pick (the book's example is 100). */
export const RATIOS = [10, 50, 100];
export const RATIO_START = 100;
/** The force of the worker's push on the handle: [lowest, highest, step] in newtons, and where it starts. */
export const F_LIMITS = [50, 300, 50];
export const F_START = 100;
/** The weight of the car on the lift (N): about 816 kg, a small car. */
export const W = 8000;
/** One push of the handle: the small piston goes down 10 cm. */
export const STROKE = 0.1;
/** The car rises at most this far (m): then the lift is at its top. */
export const RISE_MAX = 0.25;
/** "Pump many times" pushes the handle this many times. */
export const BATCH = 100;

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** A₂ (m²) for a ratio A₂/A₁. */
export const area2 = (ratio) => round(A1 * ratio, 6);

/** P = F₁/A₁ (Pa). */
export const pressure = (F1) => round(F1 / A1, 6);

/** F₂ = PA₂ = F₁(A₂/A₁) (N). */
export const force2 = (F1, ratio) => round(pressure(F1) * area2(ratio), 6);

/** The car rises only when the push on the big piston is more than its weight. */
export const lifts = (F1, ratio) => force2(F1, ratio) > W;

/** The least push (on the stepper's grid) that lifts the car with this piston, or null if none does. */
export function leastForce(ratio) {
  const [lo, hi, step] = F_LIMITS;
  for (let F = lo; F <= hi; F += step) if (lifts(F, ratio)) return F;
  return null;
}

/** d₂ = d₁(A₁/A₂): the same volume of oil, spread over the bigger area (m). */
export const rise = (d1, ratio) => round(d1 / ratio, 9);

/** Work = force × distance (J). */
export const work = (F, d) => round(F * d, 6);

/** The oil one push moves (m³): A₁ × d₁. */
export const volume = (d1 = STROKE) => round(A1 * d1, 9);

/** A push force on the stepper's grid (50 … 300 N in steps of 50). */
export function fixForce(F) {
  const [lo, hi, step] = F_LIMITS;
  const v = Math.round((Number(F) || F_START) / step) * step;
  return Math.min(hi, Math.max(lo, v));
}
/** A ratio from the list (else the book's 100). */
export const fixRatio = (k) => (RATIOS.includes(Number(k)) ? Number(k) : RATIO_START);

/** How many pushes are left before the lift is at its top, from a rise h (m). */
export function pushesLeft(h, ratio) {
  return Math.max(0, Math.floor(round((RISE_MAX - h) / rise(STROKE, ratio), 6)));
}

/**
 * A distance in the unit a person would say it in: { v, u } with u 'mm' under 1 cm, 'cm' under 1 m, else 'm'.
 * 0.001 → 1 mm, 0.05 → 5 cm, 0.25 → 25 cm.
 */
export function distance(m) {
  const a = Math.abs(m);
  if (a < 0.01 - 1e-12) return { v: round(m * 1000, 2), u: 'mm' };
  if (a < 1 - 1e-12) return { v: round(m * 100, 2), u: 'cm' };
  return { v: round(m, 3), u: 'm' };
}

/**
 * Digits grouped the Bangladeshi way (the last three, then twos): 100000 → "1,00,000", 25000 → "25,000". Latin
 * digits; t.num turns them into Bangla ones. Decimals are kept as they are (0.005 → "0.005").
 */
export function groupBD(x) {
  const neg = x < 0;
  const [int, frac] = String(Math.abs(x)).split('.');
  let out = int;
  if (int.length > 3) {
    const head = int.slice(0, -3);
    out = `${head.replace(/\B(?=(\d{2})+$)/g, ',')},${int.slice(-3)}`;
  }
  return `${neg ? '−' : ''}${out}${frac ? `.${frac}` : ''}`;
}

/** Digits grouped in threes (for English): 100000 → "100,000". */
export function groupIntl(x) {
  const [int, frac] = String(Math.abs(x)).split('.');
  return `${x < 0 ? '−' : ''}${int.replace(/\B(?=(\d{3})+$)/g, ',')}${frac ? `.${frac}` : ''}`;
}

// ── the test ────────────────────────────────────────────────────────────────
/** Pushes for the questions (not the starting 50 N). */
export const QUIZ_FORCES = [100, 150, 200, 250];
/** Strokes for the distance question (cm). */
export const QUIZ_STROKES = [10, 20, 30];

/**
 * F₂ from F₁ and A₂/A₁: the right one first, then the usual mistakes: the same force as the push (pressure is equal,
 * so they think the force is too), F₁ ÷ ratio (the wrong way round), F₁ + ratio.
 */
export function force2Choices(F1, ratio) {
  return [
    { key: 'right', v: force2(F1, ratio) },
    { key: 'same', v: F1 },
    { key: 'divide', v: round(F1 / ratio, 6) },
    { key: 'add', v: F1 + ratio },
  ];
}

/** The big piston's rise for a push of d₁ (cm) with A₂/A₁ = ratio, in cm: d₁ ÷ ratio, then d₁, d₁ × ratio, d₁ ÷ 10. */
export function riseChoices(d1cm, ratio) {
  const right = round(d1cm / ratio, 6);
  const tenth = round(d1cm / 10, 6);
  return [
    { key: 'right', v: right },
    { key: 'same', v: d1cm },
    { key: 'times', v: round(d1cm * ratio, 6) },
    { key: 'tenth', v: tenth === right ? round(d1cm / 1000, 6) : tenth },
  ];
}

/** The pressure under the big piston from the pressure under the small one: the same, then × ratio, ÷ ratio, 0. */
export function pressureChoices(P, ratio) {
  return [
    { key: 'right', v: P },
    { key: 'times', v: round(P * ratio, 6) },
    { key: 'divide', v: round(P / ratio, 6) },
    { key: 'half', v: round(P / 2, 6) },
  ];
}

/**
 * The work out of the big piston for a push F₁ through d₁ (m): the same as in, then the first three different ones
 * of: × ratio (energy multiplied like the force), ÷ ratio, d₁ left in cm, half.
 */
export function workChoices(F1, d1, ratio) {
  const w = work(F1, d1);
  const out = [{ key: 'right', v: w }];
  const more = [
    { key: 'times', v: round(w * ratio, 6) },
    { key: 'divide', v: round(w / ratio, 6) },
    { key: 'cm', v: work(F1, round(d1 * 100, 6)) },
    { key: 'half', v: round(w / 2, 6) },
  ];
  for (const c of more) if (out.length < 4 && !out.some((x) => x.v === c.v)) out.push(c);
  return out;
}
