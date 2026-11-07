// The book's model of desert air (page 252, চিত্র ৯.১০): three flat layers over the hot sand, the refractive index
// highest in the upper layer and lowest in the layer on the sand. A ray from the tree's top crosses each boundary by
// Snell's law (n₁ sin i₁ = n₂ sin i₂, angles from the vertical normal); at a boundary where sin i would pass 1 it is
// totally reflected (পূর্ণ অভ্যন্তরীণ প্রতিফলন) and climbs back the same way, so the path is symmetric about that
// boundary. Pure functions, no three.js: unit-tested in test/unit/mirage.test.mjs.
//
// Honesty: in real air the indices differ only in the fourth decimal (about 1.00029 over cool air, 1.00025 over hot
// sand), so a real mirage ray arrives almost parallel to the ground (within about 1°) and the bending is gradual. The
// figure exaggerates the differences (and the layers' height) so the bends can be seen; the panel says so.
// Distances are in the scene's units (metres of a model, not to scale).

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/** Heights of the two boundaries over the sand: a between the upper and middle layers, b between the middle and the lowest. */
export const LAYER = { a: 0.36, b: 0.18, top: 0.78 };

/**
 * The model's indices, relative to the upper layer (n = 1 there). Chosen so a ray from the upper layer is totally
 * reflected at boundary a when it travels within 25° of the ground, and at b within 35°: n_mid = cos 25°, n_low = cos 35°.
 */
export const N = { top: 1, mid: Math.cos(25 * D2R), low: Math.cos(35 * D2R) };

/** The tree: its foot, and the point at the top of its crown the light leaves from. */
export const TREE = { x: 1.9, topX: 1.8, topY: 1.42 };
/** The eye: its height, where it starts (far: the mirage shows), the near place of the last step, and how far it can go. */
export const EYE = { y: 0.85, far: -2.2, near: -0.55, min: -2.8, max: -0.35 };

/** The critical angle (ক্রান্তি কোণ) from the middle layer into the lowest, in degrees: sin θc = n_low / n_mid. */
export const CRIT_B = Math.asin(N.low / N.mid) * R2D;
/** From the upper layer into the middle one. */
export const CRIT_A = Math.asin(N.mid / N.top) * R2D;

/** The angle in a layer of index n2 for a ray at `i` (degrees from the normal) in a layer of index n1; null: total reflection. */
export function refract(i, n1, n2) {
  const s = (n1 / n2) * Math.sin(i * D2R);
  return s > 1 ? null : Math.asin(s) * R2D;
}

/**
 * How far (along the ground) a ray goes from the tree's top to the eye's height when it leaves the top at `g` degrees
 * below the horizontal and is totally reflected at boundary b. NaN when it would not be reflected at b.
 */
export function reach(g) {
  const i = 90 - g; // from the vertical normal, in the upper layer
  const ib = refract(i, N.top, N.mid);
  if (ib == null) return Number.NaN; // reflected already at a
  if (refract(ib, N.mid, N.low) != null) return Number.NaN; // goes on into the lowest layer
  const t = Math.tan(g * D2R);
  const tb = Math.tan((90 - ib) * D2R); // the slope in the middle layer
  return (TREE.topY - LAYER.a) / t + (EYE.y - LAYER.a) / t + (2 * (LAYER.a - LAYER.b)) / tb;
}

/** The steepest ray still reflected at b (just past the critical angle): it gives the nearest the eye can see a mirage. */
const G_STEEP = 35 - 1e-9;
/** The nearest distance from the tree's top (along the ground) at which the eye still gets a reflected ray. */
export const D_MIN = reach(G_STEEP);

/**
 * Trace for an eye at x (scene units, left of the tree). Returns:
 * - kind: 'tir' (the ray is totally reflected at b and reaches the eye: a mirage) or 'sand' (the ray that would have to
 *   come up to the eye is too steep: it crosses both boundaries and ends in the sand: no mirage);
 * - g: its angle below the horizontal in the upper layer (degrees);
 * - path: the points [{ x, y }]: the top, boundary a, boundary b, (then a again and the eye for 'tir'; the sand for 'sand');
 * - i1, r1: the angles of incidence and refraction at a (from the normal); iB: the angle of incidence at b; crit: θc at b;
 * - image: { x, y } where the eye sees the top of the tree (the ray's line carried on below the ground to the tree's x)
 *   for 'tir', null for 'sand'; water: x where that line meets the ground (the "water"); scale: the image's height
 *   over the tree's.
 */
export function trace(eyeX) {
  const D = TREE.topX - eyeX;
  if (D >= D_MIN) {
    // reach() falls as the ray steepens: find the angle that lands at the eye by bisection
    let lo = 25 + 1e-7; // reflected at a below this
    let hi = G_STEEP;
    for (let k = 0; k < 60; k++) {
      const mid = (lo + hi) / 2;
      if (reach(mid) > D) lo = mid;
      else hi = mid;
    }
    const g = (lo + hi) / 2;
    const i1 = 90 - g;
    const r1 = refract(i1, N.top, N.mid);
    const t = Math.tan(g * D2R);
    const tb = Math.tan((90 - r1) * D2R);
    const xA = TREE.topX - (TREE.topY - LAYER.a) / t;
    const xB = xA - (LAYER.a - LAYER.b) / tb;
    const xA2 = xB - (LAYER.a - LAYER.b) / tb;
    const path = [
      { x: TREE.topX, y: TREE.topY },
      { x: xA, y: LAYER.a },
      { x: xB, y: LAYER.b },
      { x: xA2, y: LAYER.a },
      { x: eyeX, y: EYE.y },
    ];
    // the eye looks back down along the last piece: carried on, the line meets the ground, then the tree's x
    const imgY = EYE.y - D * t;
    const water = eyeX + EYE.y / t;
    return { kind: 'tir', g, path, i1, r1, iB: r1, crit: CRIT_B, image: { x: TREE.topX, y: imgY }, water, scale: -imgY / TREE.topY, D };
  }
  // too near: the ray that would have to come up into the eye (as from water at the ground) is steeper than the
  // critical angle allows; it passes into the lowest layer and ends in the sand
  const g = Math.atan((TREE.topY + EYE.y) / D) * R2D;
  const i1 = 90 - g;
  const r1 = refract(i1, N.top, N.mid);
  const r2 = refract(r1, N.mid, N.low);
  const t = Math.tan(g * D2R);
  const xA = TREE.topX - (TREE.topY - LAYER.a) / t;
  const xB = xA - (LAYER.a - LAYER.b) * Math.tan(r1 * D2R);
  const xS = xB - LAYER.b * Math.tan(r2 * D2R);
  const path = [
    { x: TREE.topX, y: TREE.topY },
    { x: xA, y: LAYER.a },
    { x: xB, y: LAYER.b },
    { x: xS, y: 0 },
  ];
  return { kind: 'sand', g, path, i1, r1, iB: r1, r2, crit: CRIT_B, image: null, water: null, scale: 0, D };
}

/** The straight ray from the tree's top to the eye (seeing the tree directly). */
export function direct(eyeX) {
  return [
    { x: TREE.topX, y: TREE.topY },
    { x: eyeX, y: EYE.y },
  ];
}

/** Whole degrees for the panel. */
export const deg = (a) => Math.round(a);
