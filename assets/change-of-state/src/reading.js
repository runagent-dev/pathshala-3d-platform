// The maths of the heating curve (book figure ৬.০৮, p176): water heated at a steady rate. Pure functions, no DOM.
// "u" is the position along the heating curve (the book's time axis, 0 to 8 squares); a cooling run walks the same
// curve backwards, so on the graph it is drawn mirrored (time still runs left to right) and the scene is always a
// function of u.

export const TMAX = 8; // the graph's squares along the time axis
export const T_MIN = -20; // °C at the bottom of the graph (as the book's)
export const T_MAX = 120; // °C at the top
export const MELT = 0; // গলনাঙ্ক of ice, °C
export const BOIL = 100; // স্ফুটনাঙ্ক of water, °C

/** The book's curve while heating: [u, °C]. A flat part is a change of state (গলন at 0 °C, বাষ্পীভবন at 100 °C). */
export const KNOTS = [
  [0, -20],
  [1, 0],
  [3, 0],
  [5, 100],
  [7, 100],
  [8, 120],
];

/** The five parts of the curve, in heating order: the phase on each and where it starts and ends on u. */
export const PHASES = ['ice', 'melt', 'water', 'boil', 'steam'];
export const PART_ENDS = [0, 1, 3, 5, 7, 8]; // part k runs from PART_ENDS[k] to PART_ENDS[k + 1]
export const PART_SECONDS = 1.5; // seconds of the animation for one square of the graph (the longest parts take 3 s)

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** Temperature (°C) at u while heating. */
export function heatTemp(u) {
  const x = clamp(u, 0, TMAX);
  for (let i = 1; i < KNOTS.length; i++) {
    if (x <= KNOTS[i][0]) {
      const [x0, y0] = KNOTS[i - 1];
      const [x1, y1] = KNOTS[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return KNOTS[KNOTS.length - 1][1];
}

/** The position along the heating curve for the graph's time τ ('heat' | 'cool'). */
export const toU = (tau, flow) => (flow === 'cool' ? TMAX - clamp(tau, 0, TMAX) : clamp(tau, 0, TMAX));

/** The graph's points [τ, °C] for a run: the book's own curve, or its mirror for cooling. */
export function curve(flow) {
  return flow === 'cool' ? KNOTS.map(([u, T]) => [TMAX - u, T]).reverse() : KNOTS.map(([u, T]) => [u, T]);
}

export const temperature = (tau, flow) => heatTemp(toU(tau, flow));

/**
 * The phase of the water at u: 'ice' (solid), 'melt' (ice and water), 'water' (liquid), 'boil' (water and steam),
 * 'steam' (gas). The ends of a flat part count as the phase next to it: at 0 °C with nothing melted yet it is still
 * ice; with everything melted, water; the same at 100 °C.
 */
export function phaseAt(u) {
  if (u <= 1) return 'ice';
  if (u < 3) return 'melt';
  if (u <= 5) return 'water';
  if (u < 7) return 'boil';
  return 'steam';
}

/** How much of the ice has melted (0–1) and how much of the water has boiled away (0–1). */
export const melted = (u) => clamp((u - 1) / 2, 0, 1);
export const boiled = (u) => clamp((u - 5) / 2, 0, 1);

/** The part of the graph a time τ lies in: 0–4 (a time exactly at a joint belongs to the part before it); −1 at τ = 0. */
export function partOf(tau) {
  const x = clamp(tau, 0, TMAX);
  if (x <= 0) return -1;
  for (let k = 0; k < 5; k++) if (x <= PART_ENDS[k + 1] + 1e-9) return k;
  return 4;
}

/** The next part to play from τ (5 when the run is complete). */
export function nextPart(tau) {
  const x = clamp(tau, 0, TMAX);
  for (let k = 0; k < 5; k++) if (x < PART_ENDS[k + 1] - 1e-9) return k;
  return 5;
}

/** The phase on part k of a run (a cooling run meets the phases in the opposite order). */
export const phaseOfPart = (k, flow) => PHASES[flow === 'cool' ? 4 - k : k];

/** Seconds of animation to play part k. */
export const partSeconds = (k) => (PART_ENDS[k + 1] - PART_ENDS[k]) * PART_SECONDS;

/** The process at a flat part of a run: heating melts and boils, cooling condenses and freezes. */
export function processOf(phase, flow) {
  if (phase === 'melt') return flow === 'cool' ? 'freeze' : 'melt';
  if (phase === 'boil') return flow === 'cool' ? 'condense' : 'boil';
  return null;
}
