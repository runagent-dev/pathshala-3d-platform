// The maths of the figure, kept apart from the 3D so it can be unit-tested (book p173-174, topic 6.3.3).
// The gas is the ideal gas of the book, PV = nRT, in a cylinder under a piston with a fixed weight: P and n stay the same,
// so V = nRT / P grows with the temperature T (in kelvin). The book's coefficient of volume expansion at constant
// pressure is γ_P = ((V₂ − V₁)/V₁) / (T₂ − T₁) = 1/T₁.

export const R = 8.314; // J K⁻¹ mol⁻¹, as the book
export const N_MOL = 0.12; // mol of gas (fixed)
export const P_PA = 100000; // Pa: the piston's weight and the air above it (fixed)
export const HEAT = 100; // K: one turn of the flame
export const T1_CHOICES = [200, 300, 400]; // K: the starting temperatures T₁
export const T_MIN = 150;
export const T_MAX = 520;

/** V in litres from V = nRT/P (T in K; the gas in m³ × 1000). */
export const volume = (T) => ((N_MOL * R * T) / P_PA) * 1000;
/** The volume as the panel writes it: litres to one decimal (2.0, 3.0, 4.0 …). */
export const roundV = (v) => Math.round(v * 10) / 10;
export const clampT = (T) => Math.min(T_MAX, Math.max(T_MIN, T));

/** Everything the panel says for a starting temperature T1 and a temperature T2. */
export function readings(T1, T2) {
  const V1 = roundV(volume(T1));
  const V2 = roundV(volume(T2));
  const dT = Math.round(T2 - T1);
  return {
    T1,
    T2: Math.round(T2),
    V1,
    V2,
    dV: Math.round((V2 - V1) * 10) / 10,
    dT,
    /** (V₂ − V₁)/V₁ from the exact volumes (the same as dT/T₁) */
    rel: volume(T2) / volume(T1) - 1,
    /** the book's γ_P = 1/T₁, in K⁻¹ */
    gamma: 1 / T1,
  };
}

/** The relative expansion for the heating dT from T1, whole percent. */
export const percent = (T1, dT) => Math.round((dT / T1) * 100);

export function shuffle(list, rnd = Math.random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
