// The maths of the figure: pure functions, unit-tested (test/unit/electric-potential.test.mjs).
//
// The book (p.287–288): bring a small positive test charge q₀ from infinity, at constant speed (সমবেগে), to a distance r
// from a positive charge q; the work done against the repulsion is W, and the potential there is V = W/q₀ (the book
// prints W/q, meaning W/q₀); for a point charge V(r) = kq/r with k = 9 × 10⁹ N m² C⁻²; 1 V = 1 J/1 C.
//
// The figure's charges are honest lab sizes (nC), chosen so the numbers come out round: q = 10 nC, so kq = 90 V m and
// V = 90/r (r in m): 900 V at 10 cm, 600 V at 15 cm, 450 V at 20 cm, 300 V at 30 cm; on the sphere's surface (R = 5 cm)
// 1,800 V. The test charge q₀ = 2 nC, so W = q₀V in nJ is twice the volts (1,800 nJ at 10 cm), and W/q₀ = nJ ÷ nC = J/C = V.
//
// 10.6.1 (potential difference): a second, uncharged sphere B of the same size 30 cm away is joined to A by a wire.
// Each sphere's potential is its own charge's kQ/R plus the other's kQ/d (the far sphere taken as a point charge, good
// to a few % at d = 6R): A 1,800 V, B 300 V (A's field reaches it, though it has no charge). Electrons go from B to A
// until the two are equal: by symmetry 5 nC each, 1,050 V each. A crow on the wire is at the wire's potential (no
// difference, no shock). Earthing the pair then brings both to 0 V.

/** k (N m² C⁻²), the book's value. */
export const K = 9e9;
/** The charge q on sphere A (nC), its radius (m), the test charge q₀ (nC). */
export const Q_NC = 10;
export const R_SPHERE = 0.05;
export const Q0_NC = 2;
/** Where the test charge can be (cm, centre to centre): from 10 cm (5 cm from the surface) to 30 cm. */
export const R_MIN = 10;
export const R_MAX = 30;
/** Sphere B's centre, from A's (m). */
export const D_AB = 0.3;
/** The equipotential shells drawn round A (cm): 900, 450 and 300 V (twice as far, half the potential). */
export const SHELLS = [10, 20, 30];
/** The steps after the first screen ('intro'). */
export const STEPS = ['bring', 'potential', 'join', 'crow', 'earth'];
/** How many + marks a sphere carries per nC (the full sphere A shows 10). */
export const MARKS_PER_NC = 1;

const NANO = 1e-9;

/** The potential (V) at r cm from A's centre, from q = Q_NC nC: V = kq/r (outside the sphere; inside, the surface's). */
export function potentialAt(rCm, qNc = Q_NC) {
  const r = Math.max(R_SPHERE, rCm / 100);
  return (K * qNc * NANO) / r;
}

/** The work (nJ) to bring q₀ (nC) from infinity to r cm, at constant speed: W = q₀V. */
export function workTo(rCm, q0Nc = Q0_NC, qNc = Q_NC) {
  return q0Nc * potentialAt(rCm, qNc);
}

/** The repulsion on q₀ at r cm (N): F = kqq₀/r² (the book's Coulomb's law). */
export function forceAt(rCm, q0Nc = Q0_NC, qNc = Q_NC) {
  const r = rCm / 100;
  return (K * qNc * NANO * q0Nc * NANO) / (r * r);
}

/** V = W/q₀: nJ ÷ nC = J/C = V. */
export const perUnit = (wNj, q0Nc = Q0_NC) => wNj / q0Nc;

/** Two spheres of radius R_SPHERE, D_AB apart, with charges qa, qb (nC): their potentials (V). */
export function twoSpheres(qa, qb) {
  const k = K * NANO;
  return { a: k * (qa / R_SPHERE + qb / D_AB), b: k * (qb / R_SPHERE + qa / D_AB) };
}

/**
 * The charges while joined and earthed. moved: nC of electrons gone from B into A (0 … Q_NC/2) while joined; earthed:
 * nC of electrons come up from the earth into each sphere (0 … Q_NC/2). Returns { qa, qb, va, vb } (nC, V).
 */
export function chargesAt(moved, earthed = 0) {
  const half = Q_NC / 2;
  const m = Math.min(half, Math.max(0, moved));
  const e = Math.min(half, Math.max(0, earthed));
  const qa = Q_NC - m - e;
  const qb = m - e;
  const { a, b } = twoSpheres(qa, qb);
  return { qa, qb, va: a, vb: b };
}

/** Snaps r (cm) to whole centimetres inside the rail. */
export const clampR = (rCm) => Math.min(R_MAX, Math.max(R_MIN, Math.round(rCm)));

/** A number rounded to `d` decimals with no binary leftovers. */
export const roundTo = (x, d = 0) => +(Math.round(x * 10 ** d) / 10 ** d).toFixed(d);

/** Whole numbers with commas in groups of three (1,800); Bangla digits come later through t.num(). */
export function group(n) {
  const neg = n < 0;
  const s = String(Math.abs(Math.round(n)));
  return (neg ? '−' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** True when x is a whole number (to 1e-6): a rounded value is shown with "≈" otherwise. */
export const isWhole = (x) => Math.abs(x - Math.round(x)) < 1e-6;

/** The test's numeric choices: the right value first, then the usual mistakes (all different). */
export function choicesFor(kind, rCm) {
  const v = potentialAt(rCm);
  const w = workTo(rCm);
  if (kind === 'read')
    // W is shown; V = W/q₀. Mistakes: W itself (forgot to divide), W × q₀, W/q₀ halved again.
    return [
      { key: 'right', v: roundTo(v) },
      { key: 'w', v: roundTo(w) },
      { key: 'times', v: roundTo(w * Q0_NC) },
      { key: 'twice', v: roundTo(v / 2) },
    ];
  if (kind === 'closer') {
    // from rCm to half of it: V doubles. Mistakes: halves (V grows with r), four times (1/r²), the same.
    return [
      { key: 'right', v: roundTo(v * 2) },
      { key: 'half', v: roundTo(v / 2) },
      { key: 'square', v: roundTo(v * 4) },
      { key: 'same', v: roundTo(v) },
    ];
  }
  if (kind === 'double')
    // q₀ doubled: W doubles, V does not change. Mistakes: V doubles, halves, four times.
    return [
      { key: 'right', v: roundTo(v) },
      { key: 'doubled', v: roundTo(v * 2) },
      { key: 'half', v: roundTo(v / 2) },
      { key: 'square', v: roundTo(v * 4) },
    ];
  if (kind === 'earth') {
    const { va } = chargesAt(Q_NC / 2);
    return [
      { key: 'right', v: 0 },
      { key: 'same', v: roundTo(va) },
      { key: 'half', v: roundTo(va / 2) },
      { key: 'start', v: roundTo(potentialAt(R_SPHERE * 100)) },
    ];
  }
  return [];
}
