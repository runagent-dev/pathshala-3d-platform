// The maths of floating and sinking (book page 138, topic 5.3.2), kept apart from the 3D so it can be unit-tested
// (test/unit/float-or-sink.test.mjs). A body in water feels an upward force, প্লবতা, equal to the weight of the water
// it pushes aside (অপসারিত পানি). Heavier than a whole body's worth of water: it sinks. Lighter: it floats, sunk just
// so far that the water it pushes aside weighs as much as it does (the book's উদাহরণ: Vρ = V₁ρw, so V₁/V = ρ/ρw).
// Exactly as heavy: it stays wherever it is put (a submarine does this). Units: metres, kilograms, newtons.

export const G = 9.8; // m/s², as the book's worked examples
export const RHO_W = 1000; // kg/m³: the book's ρw = 10³ kg/m³
export const SIDE = 0.1; // m: every block is a 10 cm cube
export const VOLUME = 0.001; // m³: 1 litre, so a whole block's worth of water weighs 9.8 N
export const SURFACE = 0.4; // m: the water's surface above the tank's sandy floor (y = 0)
export const ARROW_K = 0.012; // m of arrow per newton (1.2 cm per N): the arrows' lengths are the real forces

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** The materials the student can drop in the worked example (ρ in kg/m³), in the order of the row of chips. */
export const MATERIALS = {
  cork: { rho: 240 },
  wood: { rho: 500 }, // the book's উদাহরণ: ρ = 0.5 × 10³ kg/m³
  ice: { rho: 920 },
  brick: { rho: 2000 },
};
export const MATERIAL_IDS = ['cork', 'wood', 'ice', 'brick'];

/** The three cases, as the book tells them (floats, sinks, stays), all the same 10 cm size. */
export const CASES = {
  wood: { rho: 500, x: -0.25 }, // floats
  brick: { rho: 2000, x: 0 }, // sinks
  tin: { rho: 1000, x: 0.25 }, // a sealed tin with just enough sand: as heavy as a tin's worth of water
};
export const CASE_IDS = ['wood', 'brick', 'tin'];
export const TIN_DEPTH = 0.17; // m: where the hand puts the tin in the water (its bottom above the floor)

/** The submarine: its hull pushes aside 1 litre when it is under; its tanks take up to 0.4 kg of water. */
export const SUB = { volume: 0.001, hull: 0.8, tank: 0.4, height: 0.075, length: 0.34 };
/** The ballast (kg of water in the tanks) for each command: take in, make it equal, blow out. */
export const BALLAST = { sink: 0.4, hover: 0.2, rise: 0 };

/** W = mg = ρVg, in newtons. */
export const weight = (rho, V = VOLUME) => round(rho * V * G, 6);
/** প্লবতা: the weight of the water pushed aside, ρw·V_under·g, in newtons. */
export const buoyancy = (Vunder) => round(RHO_W * Vunder * G, 6);
/** The submarine's weight with this much water in its tanks. */
export const subWeight = (ballast) => round((SUB.hull + ballast) * G, 6);

/** What a body of this density does in water: 'floats', 'sinks' or 'stays'. */
export const fate = (rho) => (rho < RHO_W - 1e-9 ? 'floats' : rho > RHO_W + 1e-9 ? 'sinks' : 'stays');

/** The part under water when it floats, V₁/V = ρ/ρw (1 when it does not float). */
export const fractionUnder = (rho) => Math.min(1, round(rho / RHO_W, 6));
/** The same in per cent (the book's answer: 50 for wood). */
export const percentUnder = (rho) => round(fractionUnder(rho) * 100, 2);

/** ρ as the book writes it, the number before × 10³ (0.5 for 500 kg/m³). */
export const rhoK = (rho) => round(rho / 1000, 3);

// ── a body in the tank: a vertical, damped motion under its weight, the buoyancy and the floor ───────────────────

/**
 * A body of height h and horizontal area A (V = Ah), mass m, its bottom at y (m above the floor), speed v (up +).
 * drag: k (quadratic, N per (m/s)² when wholly under water) and c (linear, N per m/s).
 */
export function createBody({ h = SIDE, A = SIDE * SIDE, m = 0.5, y = 0, k = 5.25, c = 3.5 } = {}) {
  return { h, A, m, y, v: 0, k, c, held: false };
}

/** How deep the body is in the water (m of its height under the surface, 0 … h). */
export const depthUnder = (b, surface = SURFACE) => Math.min(b.h, Math.max(0, surface - b.y));

/** The forces on it now: W down, B (প্লবতা) up, N (the floor's push) up; all in newtons. */
export function forces(b, surface = SURFACE) {
  const W = b.m * G;
  const B = buoyancy(b.A * depthUnder(b, surface));
  const onFloor = b.y <= 1e-6 && !b.held;
  const N = onFloor ? Math.max(0, W - B) : 0;
  return { W: round(W, 6), B, N: round(N, 6) };
}

/** Where it comes to rest from here: floating (its bottom so deep that B = W), on the floor, or where it is (W = B). */
export function restingY(b, surface = SURFACE) {
  const W = b.m * G;
  const Bmax = buoyancy(b.A * b.h);
  if (Math.abs(W - Bmax) < 1e-9) return Math.max(0, Math.min(b.y, surface - b.h));
  if (W > Bmax) return 0;
  const under = b.m / (RHO_W * b.A); // m of its height under water
  return round(surface - under, 9);
}

/**
 * Moves it on by dt seconds (small steps inside). Returns true while it still moves. A body at rest within a hair
 * of where it would settle is put there exactly, so the numbers come out as the book's.
 */
export function stepBody(b, dt, surface = SURFACE) {
  if (b.held) return false;
  const n = Math.max(1, Math.ceil(dt / 0.002));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    const under = depthUnder(b, surface) / b.h;
    const { W, B } = forces(b, surface);
    // the water near it moves with it: it reacts as if a little heavier (half the water it pushes aside)
    const mEff = b.m + 0.5 * RHO_W * b.A * b.h * under;
    const drag = -(b.k * under * b.v * Math.abs(b.v) + b.c * under * b.v);
    b.v += ((B - W + drag) / mEff) * h;
    b.y += b.v * h;
    if (b.y <= 0) {
      b.y = 0;
      if (b.v < 0) b.v = 0;
    }
  }
  const rest = restingY(b, surface);
  const settled = Math.abs(b.v) < 0.004 && Math.abs(b.y - rest) < 0.0008;
  const still = Math.abs(b.v) < 0.0015 && Math.abs(forces(b, surface).W - forces(b, surface).B - forces(b, surface).N) < 0.02;
  if (settled || still) {
    b.y = settled ? rest : b.y;
    b.v = 0;
    return false;
  }
  return true;
}

/** Runs it until it rests (for tests and for jumping to the end); returns the seconds it took. */
export function settle(b, surface = SURFACE, limit = 30) {
  let t = 0;
  while (t < limit && stepBody(b, 1 / 60, surface)) t += 1 / 60;
  return t;
}

// ── the test's choices: the right answer first, then the usual mistakes (each with its key) ─────────────────────

/** "What per cent is under water for this ρ?": V₁/V = ρ/ρw; mistakes: the part above, all of it, forgetting × 100. */
export function percentChoices(rho) {
  const p = percentUnder(rho);
  return [
    { key: 'right', v: p },
    { key: 'above', v: round(100 - p, 2) },
    { key: 'all', v: 100 },
    { key: 'noHundred', v: round(p / 100, 4) },
  ];
}

/** "The waterline is at this fraction: what is ρ?": ρ = (V₁/V)·ρw; mistakes: the part above, ρw ÷ the fraction, × 10. */
export function densityChoices(fraction) {
  return [
    { key: 'right', v: round(fraction, 3) },
    { key: 'above', v: round(1 - fraction, 3) },
    { key: 'inverse', v: round(1 / fraction, 2) },
    { key: 'whole', v: round(fraction * 10, 3) },
  ];
}

/** "How heavy does it seem under water?": W − B; mistakes: no change, W + B, the buoyancy itself. */
export function apparentChoices(W, B) {
  return [
    { key: 'right', v: round(W - B, 2) },
    { key: 'same', v: round(W, 2) },
    { key: 'added', v: round(W + B, 2) },
    { key: 'buoyancy', v: round(B, 2) },
  ];
}

/** Densities (kg/m³) for the per-cent question: never 500 (above = under) and the book's own wood is the example. */
export const QUIZ_RHO = [200, 300, 400, 600, 700, 800, 900];
/** Waterlines (cm of a 10 cm block under water) for the density question. */
export const QUIZ_UNDER_CM = [2, 3, 4, 6, 7, 8];
/** Stones for the apparent-weight question (ρ in kg/m³): W − B, W and W + B never equal B. */
export const QUIZ_STONES = [1500, 1800, 2500];
/** Weights (N) of the three tins in "which one sinks": one lighter, one as heavy, one heavier than 9.8 N of water. */
export const QUIZ_TINS = { light: [2.9, 4.9, 6.9], equal: [9.8], heavy: [12.7, 14.7, 19.6] };
