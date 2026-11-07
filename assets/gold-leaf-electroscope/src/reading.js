// The physics of the electroscope (book pages 278–279, topic 10.3.1), as pure functions, unit-tested in
// test/unit/gold-leaf-electroscope.test.mjs.
//
// Charge is counted in "beads": one blue bead is a small packet of free electrons, one red + the same amount of
// positive charge left where those electrons were (a real electroscope moves about 10⁹–10¹⁰ electrons; a bead stands
// for many). The metal (disc, rod, leaves) has a fixed + at each of its slots; a neutral electroscope has one
// electron beside each, the "+ over −" pairs the book and the sister figures draw. Only electrons move (the book's
// point in 10.2 and 10.3): an electron leaving its slot leaves a bare +, one arriving at a bare + makes a pair again.

/** Slots of + (fixed) on the metal: three on the disc, three down each leaf. */
export const DISC_SLOTS = 3;
export const LEAF_SLOTS = 3;
/** Room for extra electrons beyond the + slots (an electron excess). */
export const DISC_EXTRA = 6;
export const LEAF_EXTRA = 3;
/** The electrons a neutral electroscope holds: one per + slot. */
export const NEUTRAL = DISC_SLOTS + 2 * LEAF_SLOTS;

/** The charge on a freshly rubbed body (beads): glass rubbed with silk +, a comb rubbed with flannel −. */
export const RUBBED = { glass: 7, comb: -6 };
/** Beads that go from the disc into the glass rod when it touches the disc (glass is an insulator: only charge at
 * the touching spot moves, "খানিকটা চার্জ"). */
export const TOUCH_TAKES = 5;

/** Distances (mm) from a body's tip to the disc's rim: touching, near (the closest a drag goes), far. */
export const D = { touch: 0, near: 14, far: 50, rub: 52, park: 320 };
/** Induction: electrons pulled toward the disc per leaf by a body of charge q at distance d (mm), before rounding:
 * κ q / (1 + (d / d0)²): strongest when touching, about a third at 3 cm, under half a bead from 5 cm on. */
export const KAPPA = 0.5;
export const D0 = 20;
export const pull = (q, d) => (KAPPA * q) / (1 + (Math.max(0, d) / D0) ** 2);

/** Electrons moved per leaf (signed whole beads: + from the leaves up to the disc, − from the disc down to the
 * leaves) by all the bodies near the disc. */
export function shiftFrom(bodies) {
  let x = 0;
  for (const b of bodies) if (b?.q) x += pull(b.q, b.d);
  return Math.round(x + (x >= 0 ? 1e-9 : -1e-9)) || 0;
}

/** The share of the electroscope's own net charge Q (beads, + = electrons missing) on each leaf: the leaves take
 * theirs first, so even a small charge opens them (sign(Q) · ⌈|Q| / 3⌉). */
export const leafShare = (Q) => Math.sign(Q) * Math.ceil(Math.abs(Q) / 3);

/**
 * The charge on each part (beads, + = electrons missing): the leaves (each) and the disc, for an electroscope of net
 * charge Q with an induced shift s (shiftFrom). Clamped to the slots there are; the total is always Q.
 */
export function parts(Q, s = 0) {
  let leaf = leafShare(Q) + s;
  leaf = Math.max(-LEAF_EXTRA, Math.min(LEAF_SLOTS, leaf));
  let disc = Q - 2 * leaf;
  // the disc full (too many electrons missing or too many extra): give the rest back to the leaves
  while (disc > DISC_SLOTS && leaf < LEAF_SLOTS) {
    leaf++;
    disc -= 2;
  }
  while (disc < -DISC_EXTRA && leaf > -LEAF_EXTRA) {
    leaf--;
    disc += 2;
  }
  return { leaf, disc, total: disc + 2 * leaf };
}

/** Which slots hold an electron for a part with `charge` (+ = that many slots uncovered; − = all covered and that
 * many extras), with `order` the order to uncover + slots in and `extraOrder` the order to fill extras. */
export function occupied(prefix, slots, charge, order, extraOrder) {
  const out = [];
  if (charge >= 0) {
    const bare = new Set(order.slice(0, charge));
    for (let i = 0; i < slots; i++) if (!bare.has(i)) out.push(`${prefix}${i}`);
  } else {
    for (let i = 0; i < slots; i++) out.push(`${prefix}${i}`);
    for (const i of extraOrder.slice(0, -charge)) out.push(`${prefix}X${i}`);
  }
  return out;
}

/** The order a leaf's + slots are uncovered in (slot 0 at the top): the lower ones first, then spread. */
export const LEAF_ORDER = [2, 0, 1];
export const LEAF_EXTRA_ORDER = [2, 0, 1];
/** The disc's + slots in a row, slot 2 nearest the bodies: spread out when nothing is near, the near side first when
 * a body pushes electrons away. Extras (electrons pulled by a + body) gather on the near side. */
export const DISC_SPREAD = [1, 2, 0];
export const DISC_NEAR = [2, 1, 0];
export const DISC_EXTRA_ORDER = [0, 1, 2, 3, 4, 5];

/**
 * Every slot holding an electron for net charge Q and shift s: 'D0'…'D5', 'DX0'…, 'L0'…'L3', 'LX0'…, 'R0'…, 'RX0'….
 * pushed: a negative body near (its + slots on the disc are uncovered on the near side first).
 */
export function layout(Q, s = 0) {
  const p = parts(Q, s);
  const discOrder = s < 0 ? DISC_NEAR : DISC_SPREAD;
  return [
    ...occupied('D', DISC_SLOTS, p.disc, discOrder, DISC_EXTRA_ORDER),
    ...occupied('L', LEAF_SLOTS, p.leaf, LEAF_ORDER, LEAF_EXTRA_ORDER),
    ...occupied('R', LEAF_SLOTS, p.leaf, LEAF_ORDER, LEAF_EXTRA_ORDER),
  ];
}

/** The region a slot belongs to: 'disc', 'L' or 'R'. */
export const regionOf = (slot) => (slot[0] === 'D' ? 'disc' : slot[0]);

/**
 * Moves electrons from the slots they hold (`from`, a list of slot ids, one per electron; null = not on the metal) to
 * the set `to` with as little travel as possible: an electron already on a wanted slot stays; the others go, the
 * leaves' first, to the free wanted slots, the same region first. Returns the new slot of each electron (the same
 * length as `from`; null = not on the metal). `to` must not hold more slots than there are electrons on the metal.
 */
export function assign(from, to) {
  const want = new Set(to);
  const out = from.slice();
  const movers = [];
  for (let i = 0; i < from.length; i++) {
    const slot = from[i];
    if (slot == null) continue;
    if (want.has(slot)) want.delete(slot);
    else movers.push(i);
  }
  const free = [...want];
  // the same region first, then the rest in the order given
  for (const i of movers) {
    const r = regionOf(from[i]);
    let k = free.findIndex((x) => regionOf(x) === r);
    if (k < 0) k = 0;
    out[i] = free.length ? free.splice(k, 1)[0] : null;
  }
  return out;
}

/** The leaves' balance. Each leaf hangs from its top; the two carry the same charge q (beads) and push each other
 * apart. Taking the push as k q² / r² between the leaves' lower parts, r = 2 L sin θ, and the weight at the middle of
 * the leaf, the turning effects balance when sin²θ · tan θ = C q² (θ: each leaf from the vertical). C is chosen so the
 * largest charge on a leaf here (3 beads) opens each leaf about 38°. */
export const LEAF_C = 0.033;
export const balance = (theta) => Math.sin(theta) ** 2 * Math.tan(theta);
/** Each leaf's angle from the vertical (radians) for a charge q (beads, either sign) on it. */
export function leafAngle(q) {
  const target = LEAF_C * q * q;
  if (target <= 0) return 0;
  let lo = 0;
  let hi = Math.PI / 2 - 1e-6;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (balance(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
export const deg = (rad) => (rad * 180) / Math.PI;
/** The gap between the leaves (degrees, whole): twice each leaf's angle. */
export const gapDeg = (q) => Math.round(2 * deg(leafAngle(q)));

/** The steps, in the order the student meets them, and the words of the row of steps. */
export const STEPS = ['parts', 'near', 'touch', 'testNeg', 'testPos'];
export const WORDS = ['parts', 'near', 'touch', 'test'];
/**
 * Where each step ends: the electroscope's own charge Q (beads) and each body's charge and distance from the disc
 * (mm; D.park = put away).
 * - near: glass rubbed with silk (+7) held near: the leaves open by induction, Q stays 0 (চার্জের আবেশ).
 * - touch: it touched the disc, 5 beads went into the glass, then it was taken away: Q = +5 (চার্জ আহিতকরণ).
 * - testNeg / testPos: the book's test with a known (+) electroscope: a comb rubbed with flannel brought near closes
 *   the gap, without closing it (negative); glass rubbed again with silk opens it wider (positive) (চার্জের প্রকৃতি বের করা).
 */
export const SCENES = {
  intro: { Q: 0, glass: { q: 0, d: D.park }, comb: { q: 0, d: D.park } },
  parts: { Q: 0, glass: { q: 0, d: D.park }, comb: { q: 0, d: D.park } },
  near: { Q: 0, glass: { q: RUBBED.glass, d: D.near }, comb: { q: 0, d: D.park } },
  touch: { Q: TOUCH_TAKES, glass: { q: RUBBED.glass - TOUCH_TAKES, d: D.park }, comb: { q: 0, d: D.park } },
  testNeg: { Q: TOUCH_TAKES, glass: { q: RUBBED.glass - TOUCH_TAKES, d: D.park }, comb: { q: RUBBED.comb, d: D.near } },
  testPos: { Q: TOUCH_TAKES, glass: { q: RUBBED.glass, d: D.near }, comb: { q: RUBBED.comb, d: D.park } },
};

/** The charge on each leaf (beads) in a scene: what the leaves show. */
export function sceneLeaf(scene) {
  const s = shiftFrom([scene.glass, scene.comb]);
  return parts(scene.Q, s).leaf;
}
