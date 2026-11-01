// The maths of the buoyancy figure (book page 137, topic 5.3.1): the pressure of water at a depth P = hρg, the forces
// on the ship's bottom F = AP = Ahρg, the water it pushes aside V = Ah and its weight Vρg (প্লবতা), and how deep the
// ship floats for its load. The hull below the deck is a prism (straight sides, a flat bottom, a pointed bow seen from
// above), so its waterplane area A is the same at every depth and V = Ah exactly. Pure functions, unit-tested in
// test/unit/buoyancy-ship.test.mjs. Units: m, kg, N, Pa (the book's).

export const RHO = 1000; // the water's density (kg m⁻³): fresh water in a river harbour
export const G = 9.8; // m s⁻², the book's
export const RHO_STEEL = 7850; // kg m⁻³

/**
 * The hull seen from above: x along the ship (the flat stern at +14 m, the bow's tip at −14 m), z across (beam 8 m).
 * A parallel part 19 m long, then the bow narrows over 9 m as a parabola: half-beam 4 (1 − (s/9)²).
 */
export const HULL = { stern: 14, parallel: 19, bow: 9, beam: 8, depth: 4 };

/** The hull's outline (x, z) going round once (the starboard side from the stern to the bow, then back on port). */
export function hullOutline(segments = 16) {
  const { stern, parallel, bow, beam } = HULL;
  const x0 = stern - parallel; // where the bow begins to narrow
  const side = [[stern, beam / 2]];
  for (let i = 0; i <= segments; i++) {
    const s = (i / segments) * bow;
    side.push([x0 - s, (beam / 2) * (1 - (s / bow) ** 2)]);
  }
  const port = side
    .slice(0, -1)
    .reverse()
    .map(([x, z]) => [x, -z]);
  return [...side, ...port];
}

/** The area inside an outline (shoelace), in m². */
export function polygonArea(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    a += x1 * z2 - x2 * z1;
  }
  return Math.abs(a) / 2;
}

/** The waterplane area A (m²): beam × (parallel length + ⅔ of the bow's length) = 8 × (19 + 6) = 200. */
export const AREA = HULL.beam * (HULL.parallel + (2 / 3) * HULL.bow);

/** The ship with nothing on board (t), one container (t), how many fit (the twelfth brings the water to the load line). */
export const SHIP_T = 260;
export const CONTAINER_T = 20;
export const MAX_CONTAINERS = 12;

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** Containers on board, kept to 0 … 12. */
export const fixLoad = (n) => Math.min(MAX_CONTAINERS, Math.max(0, Math.round(Number(n) || 0)));

/** The ship's mass (kg) with n containers. */
export const shipMass = (n) => (SHIP_T + CONTAINER_T * fixLoad(n)) * 1000;

/** Weight W = mg (N). */
export const weight = (m) => round(m * G, 6);

/** The pressure of the water at depth h (m): P = hρg (Pa). */
export const pressureAt = (h, rho = RHO) => round(h * rho * G, 6);

/** The volume of water pushed aside when the bottom is h deep: V = Ah (m³). */
export const displaced = (h) => round(AREA * h, 6);

/** The upward force on the bottom (the top of the ship is out of the water, h₁ = 0): F = AP₂ = Ahρg (N). */
export const buoyancy = (h, rho = RHO) => round(AREA * h * rho * G, 6);

/** F = F₂ − F₁ = A(h₂ − h₁)ρg for a body under the water with its top face at h₁ and bottom face at h₂ (the book's). */
export const netUp = (A, h1, h2, rho = RHO) => round(A * (h2 - h1) * rho * G, 6);

/** How deep the ship floats: its weight = the weight of the water it pushes aside, m = ρAh → h = m / (ρA) (m). */
export const draftFor = (m, rho = RHO) => round(m / (rho * AREA), 6);

/** The draft with n containers (1.3 m empty, +0.1 m each, 2.5 m full). */
export const draft = (n) => draftFor(shipMass(n));

/** The load line (the Plimsoll mark): the draft with a full load. */
export const LOAD_LINE = draft(MAX_CONTAINERS);

/** A solid cylinder of steel with the empty ship's mass (260 t): radius 1.6 m, its height from its volume (4.1 m). */
export const STEEL = (() => {
  const m = SHIP_T * 1000;
  const V = m / RHO_STEEL;
  const r = 1.6;
  return { m, V: round(V, 6), r, h: round(V / (Math.PI * r * r), 6) };
})();

/** Its weight and its buoyancy under the water (the same weight as the empty ship, a seventh of the buoyancy). */
export const steelWeight = () => weight(STEEL.m);
export const steelBuoyancy = () => round(STEEL.V * RHO * G, 6);

/** The average density of the ship (kg m⁻³): its mass over the volume its hull closes in (A × depth). */
export const shipDensity = (n) => round(shipMass(n) / (AREA * HULL.depth), 6);

/** Sizes on the picture: the force arrows (m per N) and the pressure arrows (m per Pa). */
export const ARROW_PER_N = 7e-7; // 25,48,000 N (empty) → 1.8 m; 49,00,000 N (full) → 3.4 m
export const ARROW_PER_PA = 5.7e-5; // 12,740 Pa (1.3 m deep) → 0.73 m; 24,500 Pa → 1.4 m
export const forceLength = (F) => Math.max(0, F) * ARROW_PER_N;
export const pressureLength = (P) => Math.max(0, P) * ARROW_PER_PA;

/**
 * Digits grouped the Bangladeshi way (the last three, then twos): 2548000 → "25,48,000". Latin digits; t.num turns
 * them into Bangla ones. Decimals are kept as they are.
 */
export function groupBD(x) {
  const neg = x < 0;
  const [int, frac] = String(Math.abs(x)).split('.');
  let out = int;
  if (int.length > 3) {
    const head = int.slice(0, -3);
    out = `${head.replace(/\B(?=(\d{2})+$)/g, ',')},${int.slice(-3)}`;
  }
  return `${neg ? '−' : ''}${out}${frac ? `.${frac}` : ''}`;
}

/** Digits grouped in threes (for English): 2940000 → "2,940,000". */
export function groupIntl(x) {
  const [int, frac] = String(Math.abs(x)).split('.');
  return `${x < 0 ? '−' : ''}${int.replace(/\B(?=(\d{3})+$)/g, ',')}${frac ? `.${frac}` : ''}`;
}

/** The four steps (the row of words). */
export const STEPS = ['pressure', 'weight', 'displaced', 'load'];

// ── the test ────────────────────────────────────────────────────────────────
/** Loads for the questions (never the empty ship, never full). */
export const QUIZ_LOADS = [2, 3, 4, 6, 7, 8, 9];

/**
 * The pressure on the bottom at draft h (read off the picture): the right one first, then the usual mistakes: ρ
 * without g, the hull's whole height instead of the depth under water, the force (× A) instead of the pressure.
 */
export function pressureChoices(h) {
  return [
    { key: 'right', v: pressureAt(h) },
    { key: 'noG', v: round(h * RHO, 6) },
    { key: 'deck', v: pressureAt(HULL.depth) },
    { key: 'force', v: buoyancy(h) },
  ];
}

/** The weight of the water pushed aside from its volume: Vρg, then Vρ (the mass), Vg, V × steel's ρ × g. */
export function displacedChoices(V) {
  return [
    { key: 'right', v: round(V * RHO * G, 6) },
    { key: 'mass', v: round(V * RHO, 6) },
    { key: 'noRho', v: round(V * G, 6) },
    { key: 'steel', v: round(V * RHO_STEEL * G, 6) },
  ];
}
