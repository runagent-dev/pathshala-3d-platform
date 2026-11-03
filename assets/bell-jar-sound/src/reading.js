// The bell-jar experiment's numbers, as pure functions (unit-tested in test/unit/bell-jar-sound.test.mjs).
// The air left in the jar is a fraction f (1 = full, at the room's air pressure; 0 = no air). A rotary pump takes out
// a share of what is left every second, and a little more, so the jar empties "ধীরে ধীরে" (slowly at the end) yet
// does reach zero; opening the valve lets the room's air back in quickly. The jar's pressure is f × 101 kPa. How loud
// the bell is outside follows the air in the jar (the figure's simple model: the bell's sound, carried by the air, is
// in proportion to how much air is left; with none, none). The hammer strikes the gong at the same rate throughout.

/** The room's air pressure (kPa), what the gauge reads with the jar full. */
export const P_ATM = 101;
/** The gauge's scale: 0 to this (kPa). */
export const GAUGE_MAX = 120;
/** How often the hammer strikes the gong (per second): the same with or without air. */
export const STRIKES = 8;
/** The pump: seconds for the air left to fall by e (the share part), and the steady part (per second). */
export const PUMP = { tau: 2.4, steady: 0.02 };
/** The valve: air back in, seconds. */
export const VALVE = { tau: 0.55, steady: 0.15 };

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** The air left after `dt` seconds of pumping, from `f`. */
export function pumpOut(f, dt) {
  const { tau, steady } = PUMP;
  const k = steady * tau;
  return clamp01((f + k) * Math.exp(-dt / tau) - k);
}

/** The air in the jar after `dt` seconds with the valve open, from `f`. */
export function letIn(f, dt) {
  const { tau, steady } = VALVE;
  const k = steady * tau;
  // the gap to full shrinks the same way as the air does in pumpOut
  return 1 - clamp01((1 - f + k) * Math.exp(-dt / tau) - k);
}

/** Seconds of pumping from `from` down to `to` (both fractions). */
export function pumpTime(from = 1, to = 0) {
  const { tau, steady } = PUMP;
  const k = steady * tau;
  return tau * Math.log((from + k) / (to + k));
}

/** The jar's air pressure (kPa) for an air fraction. */
export const pressure = (f) => P_ATM * clamp01(f);

/** The air left as a whole percentage. */
export const percent = (f) => Math.round(100 * clamp01(f));

/** The pressure as shown (whole kPa), from the percentage shown, so the two numbers always agree. */
export const kPaShown = (f) => Math.round((P_ATM * percent(f)) / 100);

/** How loud the bell sounds outside (0–1) for the air left. */
export const loudness = (f) => clamp01(f);

/** The word for how the bell sounds: loud, softer, faint, none. */
export function loudWord(f) {
  const L = loudness(f);
  if (L >= 0.8) return 'loud';
  if (L >= 0.3) return 'soft';
  if (L >= 0.03) return 'faint';
  return 'none';
}

/** The air amounts the figure names (set({ air }) and the test). */
export const AIR = { full: 1, half: 0.5, vacuum: 0 };

/** An air amount from a number (0–1, or a percentage over 1) or a name. */
export function airOf(v) {
  if (typeof v === 'string' && v in AIR) return AIR[v];
  const x = Number(v);
  if (!Number.isFinite(x)) return 1;
  return clamp01(x > 1 ? x / 100 : x);
}

/**
 * The hammer's swing away from the gong (0 at the gong, 1 fully back) at time `t` (s). |sin| has a sharp corner at
 * each strike, like a hammer that hits and bounces back.
 */
export function hammerSwing(t, rate = STRIKES) {
  return Math.abs(Math.sin(Math.PI * rate * t)) ** 0.7;
}

/** How many strikes have happened by time `t` (s). */
export const strikesBy = (t, rate = STRIKES) => Math.floor(t * rate);

/** The gauge needle's angle (radians, clockwise from straight up) for a pressure: 0 kPa at −135°, 120 kPa at +135°. */
export function needleAngle(kPa) {
  const k = Math.max(0, Math.min(GAUGE_MAX, kPa)) / GAUGE_MAX;
  return ((-135 + 270 * k) * Math.PI) / 180;
}
