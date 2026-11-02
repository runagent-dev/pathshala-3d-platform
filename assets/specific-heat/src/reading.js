// The maths of the figure, kept apart from the 3D so it can be unit-tested. Book pages 178–179, topic 6.5:
//   s = Q / m(T₂ − T₁)  (J kg⁻¹K⁻¹)      C = m s  (J K⁻¹)
// The book's example: 10 kg of gold (s = 230) against 10 kg of water (s = 4200): C = 2300 and 42,000 J K⁻¹.

export const MASS = 10; // kg, both
export const T1 = 30; // °C, where both start
export const STEP_Q = 42000; // J given to each by one press: raises 10 kg of water by exactly 1 K
export const MAX_STEPS = 4;
export const IDS = ['water', 'gold'];
/** The book's values of s (J kg⁻¹K⁻¹). */
export const S = { water: 4200, gold: 230 };

export const round = (x, d = 6) => +x.toFixed(d);
/** C = m s (J K⁻¹). */
export const capacity = (m, s) => m * s;
/** T₂ − T₁ (K) when Q joules go into m kg of a substance with specific heat s. */
export const rise = (Q, m, s) => (Q > 0 ? Q / (m * s) : 0);
/** s = Q / m(T₂ − T₁). */
export const specific = (Q, m, dT) => Q / (m * dT);
/** T₂ (°C). */
export const finalT = (Q, m, s, t1 = T1) => t1 + rise(Q, m, s);
/** The heat after n presses (J). */
export const heatAfter = (n) => n * STEP_Q;

/** Whole numbers grouped the Bangladeshi way (42000 → "42,000", 168000 → "1,68,000"); decimals as they are. */
export function groupBD(x) {
  const [int, frac] = String(Math.abs(x)).split('.');
  let out = int;
  if (int.length > 3) out = `${int.slice(0, -3).replace(/\B(?=(\d{2})+$)/g, ',')},${int.slice(-3)}`;
  return `${x < 0 ? '−' : ''}${out}${frac ? `.${frac}` : ''}`;
}
/** Digits grouped in threes (for English). */
export function groupIntl(x) {
  const [int, frac] = String(Math.abs(x)).split('.');
  return `${x < 0 ? '−' : ''}${int.replace(/\B(?=(\d{3})+$)/g, ',')}${frac ? `.${frac}` : ''}`;
}
/** One decimal, none when whole: 18.26 → "18.3", 4 → "4". */
export const dec1 = (x) => String(round(x, 1));

// ── the test ────────────────────────────────────────────────────────────────
/** "Which gets hotter?": both given the same two presses (84,000 J). */
export const Q1_STEPS = 2;
/** s from Q, m and the rise on the picture: gold given 23,000 J rises exactly 10 K → 230. */
export const Q3 = { Q: 23000, m: MASS, s: S.gold };
/** The right s, then the usual mistakes: Q ÷ ΔT (no m: that is C), m × ΔT, and Q ÷ (m² ΔT). */
export function specificChoices({ Q, m, s }) {
  const dT = rise(Q, m, s);
  return [
    { key: 'right', v: round(specific(Q, m, dT)) },
    { key: 'nom', v: round(Q / dT) }, // forgot m (that is C, in J K⁻¹)
    { key: 'prod', v: round(m * dT) }, // multiplied m and ΔT, never divided Q by them
    { key: 'msq', v: round(Q / (m * m * dT)) }, // divided by m twice
  ];
}
/** C = m s for water or gold, then the mistakes: s alone, s ÷ m, a zero too many. */
export function capacityChoices(id) {
  const s = S[id];
  return [
    { key: 'right', v: capacity(MASS, s) },
    { key: 'sOnly', v: s }, // forgot m
    { key: 'div', v: round(s / MASS) }, // s ÷ m
    { key: 'zero', v: capacity(MASS * 10, s) }, // a zero too many
  ];
}
