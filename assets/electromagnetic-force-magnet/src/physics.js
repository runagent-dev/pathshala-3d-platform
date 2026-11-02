// The physics of the electromagnetic-force-magnet figure (book page 68, topic 3.2.2), pure functions (unit-tested
// in test/unit/electromagnetic-force-magnet.test.mjs). Lengths in mm, time in s.
//
// The magnets: a coil of wire on a plastic tube (no iron inside) is a magnet only while current flows in it.
// Wound and fed as drawn, its end that faces the bar magnet is a north pole (right-hand grip rule). The bar magnet
// rides on a little cart: unlike poles attract, like poles repel, with the force between two magnets falling off
// as 1 / r⁴ (r between their middles) but never reaching zero: the range is infinite.

/** The book: the electromagnetic force is about 10^36 times as strong as gravity. */
export const STRENGTH_EXP = 36;

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
