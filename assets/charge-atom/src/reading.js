// The counting behind topic 10.1 (book pages 272–273): an atom's protons (+) and electrons (−), how the book's model
// puts the electrons in shells ("এক কক্ষপথ পূর্ণ করে ইলেকট্রন পরের কক্ষপথে যায়": 2, then 8, then 8 for argon), and
// the atom's net charge, in units of the electron's charge e = 1.6 × 10⁻¹⁹ C and in coulombs. Pure functions,
// unit-tested in test/unit/charge-atom.test.mjs.

/** The charge of one proton (+) or one electron (−), in coulombs: the book's 1.6 × 10⁻¹⁹ C. */
export const E_CHARGE = 1.6e-19;

/**
 * The two atoms of the figure. Argon (চিত্র ১০.০১): 18 protons, 22 neutrons (argon-40, the common one), 18 electrons
 * in 2-8-8. Chlorine (the book's লবণ = sodium + chlorine, page 272): 17 protons, 18 neutrons (chlorine-35), 17
 * electrons in 2-8-7: one place free in its outer shell, so it takes one more electron and becomes negative.
 */
export const ATOMS = {
  ar: { id: 'ar', protons: 18, neutrons: 22 },
  cl: { id: 'cl', protons: 17, neutrons: 18 },
};

/** The book's shells for the first atoms: each fills before the next one starts (2, 8, 8, …). */
export const SHELL_CAP = [2, 8, 8, 2];

/** How many electrons each shell holds when `n` electrons fill them in order: shells(18) → [2, 8, 8]. */
export function shells(n) {
  const out = [];
  let left = Math.max(0, Math.floor(n));
  for (const cap of SHELL_CAP) {
    if (left <= 0) break;
    const k = Math.min(cap, left);
    out.push(k);
    left -= k;
  }
  return out;
}

/** The net charge in units of e: protons − electrons (0 neutral, + fewer electrons, − more electrons). */
export const netCharge = (protons, electrons) => protons - electrons;

/** A number without binary leftovers: round(1.6 * 3, 2) = 4.8. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/**
 * The net charge in coulombs, as a mantissa and a power of ten for showing it: q = n × 1.6 × 10⁻¹⁹ C.
 * coulombs(1) → { sign: 1, m: 1.6, exp: -19 }; coulombs(-2) → { sign: -1, m: 3.2, exp: -19 }; coulombs(0) → { sign: 0, m: 0, exp: 0 }.
 */
export function coulombs(n) {
  if (!n) return { sign: 0, m: 0, exp: 0 };
  let m = Math.abs(n) * 1.6;
  let exp = -19;
  while (m >= 10) {
    m /= 10;
    exp += 1;
  }
  return { sign: Math.sign(n), m: round(m, 2), exp };
}

/** What the net charge makes of the atom: 'neutral' (বিদ্যুৎ নিরপেক্ষ), 'positive' or 'negative' (আয়নিত বা আহিত). */
export const kindOf = (net) => (net === 0 ? 'neutral' : net > 0 ? 'positive' : 'negative');

/**
 * The steps of the figure: the nucleus, the electrons in their shells, fewer electrons (+), more electrons (−), and
 * matter with free electrons (a conductor) or without (an insulator).
 */
export const STEPS = ['nucleus', 'shells', 'less', 'more', 'conduct'];

/** At most this many outer electrons can be taken from the argon atom in the figure (the book speaks of one or two). */
export const MAX_REMOVED = 3;

// ── the test ─────────────────────────────────────────────────────────────────

/**
 * The net charge (in e) after taking `k` electrons from a neutral atom of `z` protons: the right one first, then the
 * usual mistakes: the sign flipped (taking away negative makes it negative), "still neutral", and the protons' count.
 */
export function removedChoices(z, k) {
  return [
    { key: 'right', v: netCharge(z, z - k) },
    { key: 'flip', v: -k },
    { key: 'zero', v: 0 },
    { key: 'protons', v: z },
  ];
}

/**
 * The net charge in coulombs of an atom with one electron more than protons: −1.6 × 10⁻¹⁹ C first; then the sign
 * flipped, "one charge is one coulomb", and "still neutral" (as { sign, m, exp } for showing, see coulombs()).
 */
export function extraChoices() {
  return [
    { key: 'right', q: coulombs(-1) },
    { key: 'flip', q: coulombs(1) },
    { key: 'one', q: { sign: -1, m: 1, exp: 0 } },
    { key: 'zero', q: coulombs(0) },
  ];
}
