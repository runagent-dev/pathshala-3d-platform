// The maths of the figure (pure, unit-tested in test/unit/mass-energy.test.mjs). Book p119, topic 4.6: if a mass m
// is turned fully into energy, E = mc², with c = 3 × 10⁸ m/s (the book's rounded light speed). The book's reaction
// ¹₀n + ²³⁵₉₂U → ⁹²₃₆Kr + ¹⁴¹₅₆Ba + 3¹₀n: the right side weighs a little less than the left, and that mass comes out
// as energy. Atomic masses (AME2020, in u, rounded to 4 places as school tables print them):
//   n 1.0087, ²³⁵U 235.0439, ⁹²Kr 91.9262, ¹⁴¹Ba 140.9144.
// Left 236.0526 u, right 235.8667 u: 0.1859 u less, 2.78 × 10⁻¹¹ J (≈ 173 MeV) for one nucleus; that is 0.079% of
// the uranium's mass (fission's often-quoted "about 0.09%" also counts the later decays of the fragments).

export const C = 3e8; // m/s, as the book writes it (3 × 10⁸ m/s; the exact value is 299 792 458 m/s)
export const U_KG = 1.66054e-27; // kg in one atomic mass unit u
export const MASS = { n: 1.0087, U: 235.0439, Kr: 91.9262, Ba: 140.9144 }; // u
export const NUCLEUS = {
  U: { A: 235, Z: 92 },
  Kr: { A: 92, Z: 36 },
  Ba: { A: 141, Z: 56 },
  n: { A: 1, Z: 0 },
};
export const BULB_W = 100; // W: the bulb the energy is compared with
export const YEAR_S = 365.25 * 24 * 3600;
export const MASSES_G = [1, 10, 100, 1000]; // g: the fuel the student picks in the power-plant scene

/** Round to n decimals without binary leftovers (0.1 + 0.2 → 0.3). */
export const round = (x, n = 4) => +(Math.round(x * 10 ** n) / 10 ** n).toFixed(n);

/** The book's reaction, in u: the left side, the right side and the mass that went missing. */
export function reaction() {
  const left = round(MASS.n + MASS.U);
  const right = round(MASS.Kr + MASS.Ba + 3 * MASS.n);
  return { left, right, defect: round(left - right) };
}

/** E = mc², in J, for a mass in kg (c as the book gives it). */
export const energy = (kg) => kg * C * C;

/** The energy (J) of one split, from the missing mass. */
export const energyPerSplit = () => energy(reaction().defect * U_KG);

/** How much of the uranium's own mass becomes energy when it splits (a fraction: 7.9 × 10⁻⁴, i.e. 0.079%). */
export const fissionFraction = () => reaction().defect / MASS.U;

/**
 * The fuel of the power-plant scene: `grams` of uranium-235, split (part 'fission') or, as the book's E = mc² says,
 * turned fully into energy (part 'full'). Returns the mass that becomes energy (kg), E (J) and how many years a
 * 100 W bulb would glow on it.
 */
export function fuel(grams, part = 'fission') {
  const kg = (grams / 1000) * (part === 'full' ? 1 : fissionFraction());
  const E = energy(kg);
  return { kg, E, years: E / BULB_W / YEAR_S };
}

/** Nuclei split in a chain reaction after `steps` steps when each split's three neutrons each split one more. */
export const chainSplits = (steps) => (3 ** steps - 1) / 2;

/**
 * A number as mantissa × 10^exp with `sig` significant figures, trailing zeros dropped: 2.78e-11 → { m: '2.78',
 * e: -11 }, 9e16 → { m: '9', e: 16 }.
 */
export function sci(x, sig = 3) {
  if (x === 0) return { m: '0', e: 0 };
  let e = Math.floor(Math.log10(Math.abs(x)));
  let m = x / 10 ** e;
  m = +m.toPrecision(sig);
  if (Math.abs(m) >= 10) {
    m /= 10;
    e += 1;
  }
  return { m: String(+m.toPrecision(sig)), e };
}

/** Round to `sig` significant figures (for sentences: 22.56 → 23, 28 519 → 29 000). */
export function sigRound(x, sig = 2) {
  if (x === 0) return 0;
  const e = Math.floor(Math.log10(Math.abs(x))) - sig + 1;
  return e >= 0 ? Math.round(x / 10 ** e) * 10 ** e : round(x, -e);
}

/**
 * A whole number cut the way Bangladesh says big numbers: { crore, lakh, thousand, rest } (2 85 00 000 → 2 crore
 * 85 lakh). Crores are not split further (1 000 crore stays 1000 crore).
 */
export function indianParts(n) {
  let x = Math.round(n);
  const crore = Math.floor(x / 1e7);
  x -= crore * 1e7;
  const lakh = Math.floor(x / 1e5);
  x -= lakh * 1e5;
  const thousand = Math.floor(x / 1e3);
  x -= thousand * 1e3;
  return { crore, lakh, thousand, rest: x };
}

/** Fisher–Yates shuffle (in place). */
export function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
