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
  strokeMm: 60, // mm of combing through the hair for one more level (about one pass)
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

/** How high (mm) the comb holds the lifted bits up in the air, once they have jumped. */
export const LIFT_HEIGHT = 50;

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

// ── the magnets ─────────────────────────────────────────────────────────────

export const MAG = {
  coil: 70, // mm, length of the coil
  bar: 76, // mm, length of the bar magnet
  gapMax: 60, // mm, the cart stops against the block at the end of the track
  pull: 1600, // mm/s²: the cart's acceleration when the magnet touches the coil
  friction: 40, // mm/s²: how much the wheels' friction slows the cart (it stays put under a smaller pull)
};
/** Distance between the middles of the coil and the magnet when they touch. */
export const CONTACT = (MAG.coil + MAG.bar) / 2;

/** The magnet's pole facing the coil: 'S' when it lies S-to-N from the coil outwards (orientation 'SN'). */
export const facingPole = (orientation) => (orientation === 'NS' ? 'N' : 'S');

/**
 * What the coil does to the magnet: 'attract' (unlike poles face each other), 'repel' (like poles) or null (no
 * current: the coil is not a magnet). The coil's end facing the magnet is `coilPole` while the current flows.
 */
export function interaction(on, magnetPole, coilPole = 'N') {
  if (!on) return null;
  return magnetPole === coilPole ? 'repel' : 'attract';
}

/** The size of the pull or push on the cart (mm/s²) at this gap (mm) between the coil and the magnet. */
export function magnetPull(gap) {
  const r = CONTACT + Math.max(0, gap);
  return MAG.pull * (CONTACT / r) ** 4;
}

/** Signed acceleration of the cart along the track (+ away from the coil), before friction. */
export function cartAccel(gap, kind) {
  if (!kind) return 0;
  return (kind === 'repel' ? 1 : -1) * magnetPull(gap);
}

/**
 * One step of the cart: { gap, v } after dt seconds (small steps inside). `hit` says if it ran into the coil
 * ('coil', it sticks there) or the block at the end ('stop'). Static friction keeps it still under a small force.
 */
export function stepCart({ gap, v }, kind, dt) {
  let hit = null;
  const n = Math.max(1, Math.ceil(dt / 0.004));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    const a = cartAccel(gap, kind);
    if (v === 0 && Math.abs(a) <= MAG.friction) continue; // static friction holds it
    const dir = v !== 0 ? Math.sign(v) : Math.sign(a);
    const nv = v + (a - MAG.friction * dir) * h;
    // friction alone never turns it round: it stops
    v = v !== 0 && Math.sign(nv) !== Math.sign(v) && Math.abs(a) <= MAG.friction ? 0 : nv;
    gap += v * h;
    if (gap <= 0) {
      gap = 0;
      if (v < 0) hit = 'coil';
      v = Math.max(0, v);
      if (kind === 'attract') v = 0;
    }
    if (gap >= MAG.gapMax) {
      gap = MAG.gapMax;
      if (v > 0) hit = 'stop';
      v = Math.min(0, v);
    }
  }
  return { gap, v, hit };
}

/** Where the cart comes to rest from this gap (mm), starting still: the state after a long enough time. */
export function settleCart(gap, kind) {
  let st = { gap, v: 0 };
  for (let i = 0; i < 600; i++) {
    st = stepCart(st, kind, 0.05);
    if (st.v === 0 && (st.gap === 0 || st.gap === MAG.gapMax || Math.abs(cartAccel(st.gap, kind)) <= MAG.friction)) break;
  }
  return { gap: st.gap, v: 0 };
}

/**
 * How long (mm) the force arrows are drawn at this gap: 8 + 30 × (F / F₀)^0.35, so they keep shrinking along the
 * whole track as the force does, but never vanish (the force never reaches zero). Not to scale: a 1/r⁴ force drawn
 * to scale would be invisible a few centimetres away.
 */
export function magnetArrowLength(gap) {
  return 8 + 30 * (magnetPull(gap) / MAG.pull) ** 0.35;
}
