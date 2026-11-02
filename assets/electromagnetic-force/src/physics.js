// The physics of the electromagnetic-force figure (book page 68, topic 3.2.2), pure functions (unit-tested in
// test/unit/electromagnetic-force.test.mjs). Lengths in mm, time in s.
//
// The comb: each stroke through the hair leaves a little more charge on it (levels 0–5). A bit of paper is not
// charged, but the comb's charge pulls it (the paper is polarised), with a force that grows very fast as the comb
// comes closer: F ∝ q² / d⁵ for a small polarisable bit. The bit jumps up when that pull is bigger than its
// weight, the pull of the whole Earth. With more charge the comb lifts paper from farther away (about 4.5 cm at
// full charge, as with a real comb); with no charge it does not pull at all.
//
// The magnets: a coil of wire on a plastic tube (no iron inside) is a magnet only while current flows in it.
// Wound and fed as drawn, its end that faces the bar magnet is a north pole (right-hand grip rule). The bar magnet
// rides on a little cart: unlike poles attract, like poles repel, with the force between two magnets falling off
// as 1 / r⁴ (r between their middles) but never reaching zero: the range is infinite.

/** The comb: charge levels, reach at full charge, how much combing makes one level. */
export const COMB = {
  levels: 5, // strokes to a fully charged comb
  reach: 45, // mm: at full charge a bit of paper jumps from this far (teeth to paper)
  strokeMm: 30, // mm of combing through the hair for one more level (one pass along the top of the hair)
};

/** How far from the comb's teeth a bit of paper jumps up, at charge level q (0 when the comb has no charge). */
export function reach(q) {
  const k = Math.min(Math.max(q, 0), COMB.levels) / COMB.levels;
  return k > 0 ? COMB.reach * k ** 0.4 : 0;
}

/** The comb's pull on a bit of paper ÷ the bit's weight (the Earth's pull), at charge q and distance d (mm). */
export function pullRatio(q, d) {
  const k = Math.min(Math.max(q, 0), COMB.levels) / COMB.levels;
  if (k <= 0) return 0;
  return k * k * (COMB.reach / Math.max(d, 0.5)) ** 5;
}

/** The book: the electromagnetic force is about 10^36 times as strong as gravity. */
export const STRENGTH_EXP = 36;

/**
 * Where that number comes from: the electric force between two protons ÷ the gravitational force between them
 * (both fall off as 1 / r², so the ratio does not depend on how far apart they are). Returns about 1.24 × 10^36.
 */
export function protonForceRatio() {
  const k = 8.9875517923e9; // N m² / C²
  const e = 1.602176634e-19; // C
  const G = 6.6743e-11; // N m² / kg²
  const mp = 1.67262192e-27; // kg
  return (k * e * e) / (G * mp * mp);
}

/**
 * How high (mm) the comb holds the lifted bits up in the air, once they have jumped: well above where they lay, so
 * the picture shows them hanging in the air, clear of the table's far edge.
 */
export const LIFT_HEIGHT = 60;

/**
 * How low (mm above the desk) the comb comes down over the paper before it is lifted again: a little inside its
 * reach, so the bits under it (also those a little in front or behind) jump; with no charge, right down.
 */
export function stopHeight(q) {
  return q > 0 ? Math.max(12, reach(q) - 14) : 12;
}

/** The distance (mm) from a point to the comb's row of teeth tips: a segment from (cx − half, h) to (cx + half, h). */
export function teethDistance({ x, y, z = 0 }, { cx, h, half }) {
  const dx = Math.max(0, Math.abs(x - cx) - half);
  return Math.hypot(dx, h - y, z);
}
