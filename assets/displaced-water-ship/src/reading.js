// The maths of the displaced-water figure (book page 137, topic 5.3.1; page 138, 5.3.2): a model cargo ship lowered on
// a hanging scale into a glass tank filled to its spout; the water it pushes aside runs out of the spout into a beaker
// on a kitchen scale. Pure functions, unit-tested in test/unit/displaced-water-ship.test.mjs. Units: cm, cm³, cm², g
// (and N, kg, m for the book's F = Vρg).
//
// Nothing here is fudged: the tank's water is tracked as a volume. The hull below the deck is a prism (straight sides, a
// flat bottom, the bow pointed only when seen from above), so the water it pushes aside is exactly A × h at every draft.
// While the scale holds the ship, the cord holds the keel where the hand puts it and the scale reads the ship's mass less
// the water it pushes aside (the book: "সেইটুকু তরলের সমান ওজন বস্তুটির ওজন থেকে কমে যায়"); once that reaches zero the
// cord goes slack and the ship floats, pushing aside its own mass of water (p138: "ঠিক যে পরিমাণ ডুবে থাকলে বস্তুর
// সমান ওজনের পানি অপসারণ করবে, ততটুকুই ডুববে"). Whatever would lift the water above the spout's lip runs out into the
// beaker and never comes back, so spilled water = water pushed aside as long as the tank was full when it began.

export const RHO = 1; // the water's density, g/cm³ (1,000 kg/m³)
export const RHO_SI = 1000; // kg/m³
export const G = 9.8; // m/s², the book's

/** The hull seen from above (cm): the flat stern at x = +11, the bow's tip at −11; beam 5; keel to deck 6. */
export const HULL = { stern: 11, parallel: 16, bow: 6, beam: 5, depth: 6, bulwark: 0.8 };

/** The hull's outline (x, z) going round once (starboard from the stern to the bow, then back on port). */
export function hullOutline(segments = 12) {
  const { stern, parallel, bow, beam } = HULL;
  const x0 = stern - parallel; // where the bow begins to narrow (−5)
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

/** The area inside an outline (shoelace). */
export function polygonArea(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    a += x1 * z2 - x2 * z1;
  }
  return Math.abs(a) / 2;
}

/** The waterplane area A (cm²): beam × (parallel length + ⅔ of the bow's length) = 5 × (16 + 4) = 100. */
export const AREA = HULL.beam * (HULL.parallel + (2 / 3) * HULL.bow);

/** Where the waterplane's centre is (x, cm): the parallel part's centre weighed with the bow's (a half parabola). */
export const CENTRE_X = (() => {
  const { stern, parallel, bow, beam } = HULL;
  const x0 = stern - parallel;
  const aPar = beam * parallel;
  const aBow = beam * (2 / 3) * bow;
  return (aPar * (x0 + parallel / 2) + aBow * (x0 - (3 / 8) * bow)) / (aPar + aBow);
})();

/** The ship on its own (g), one toy container (g), how many fit on the deck. */
export const SHIP_G = 200;
export const BOX_G = 50;
export const MAX_BOXES = 6;

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** Containers on board, kept to 0 … 6. */
export const fixBoxes = (n) => Math.min(MAX_BOXES, Math.max(0, Math.round(Number(n) || 0)));

/** The mass of the ship with n containers (g). */
export const shipMass = (n) => SHIP_G + BOX_G * fixBoxes(n);

/** How deep a floating ship of mass m (g) sits: m = ρAh → h = m / (ρA) (cm). 2 cm empty, +0.5 cm a container. */
export const draftFor = (m) => round(m / (RHO * AREA), 9);

/** The load line (painted on the hull): the draft with all six containers (5 cm, 1 cm below the deck). */
export const LOAD_LINE = draftFor(shipMass(MAX_BOXES));

/** The glass tank (cm): inside 27 × 12, the floor's top at 0.6, the spout's lip (the water's level when full) at 11.6. */
export const TANK = { x0: -13.5, x1: 13.5, z0: -6, z1: 6, floor: 0.6, spout: 11.6, glass: 0.5, top: 13 };
export const TANK_AREA = (TANK.x1 - TANK.x0) * (TANK.z1 - TANK.z0); // 324 cm²
/** The tank full to the spout's lip, with no ship in it (cm³). */
export const FULL = round(TANK_AREA * (TANK.spout - TANK.floor), 9);

/** The beaker (cm): inside radius √(100/π), so 100 cm³ fill 1 cm and the printed marks are 1 cm apart. */
export const BEAKER = { r: Math.sqrt(100 / Math.PI), wall: 0.2, base: 0.4, height: 6.9 };
export const BEAKER_AREA = Math.PI * BEAKER.r ** 2; // 100 cm²
/** How high water of volume v (cm³) stands in the beaker (cm above its inside bottom). */
export const beakerLevel = (v) => Math.max(0, v) / BEAKER_AREA;

/** Where the ship's keel is while it hangs, for the arm's travel k (0 = up, at the start; 1 = down to where it floats). */
export const HANG = { start: TANK.spout + 1.6, end: TANK.spout - draftFor(SHIP_G) };
export const keelAt = (k) => HANG.start + (HANG.end - HANG.start) * Math.min(1, Math.max(0, k));

/** The water pushed aside by the hull with its keel at `keel`, under a surface at `level` (cm³). */
export const pushedAside = (level, keel) => AREA * Math.min(HULL.depth, Math.max(0, level - keel));

/**
 * The tank and the ship, settled. `state`: { water (cm³ in the tank), spilled (cm³ in the beaker) }; `keelHang`: where
 * the cord holds the keel (cm), or null when the ship is not hooked; `mass`: the ship and its load (g). Returns a new
 * state and what it looks like: { water, spilled, level, keel, sub (cm³ pushed aside), draft (cm), reading (g on the
 * hanging scale; 0 once it floats; null unhooked), floating }.
 */
export function settle(state, { keelHang, mass }) {
  let water = state.water;
  let spilled = state.spilled;
  const A = AREA;
  const At = TANK_AREA;
  const fill = (lvl, sub) => {
    // anything above the lip runs out
    if (lvl <= TANK.spout + 1e-12) return lvl;
    const keep = At * (TANK.spout - TANK.floor) - sub;
    spilled += water - keep;
    water = keep;
    return TANK.spout;
  };
  // the floating ship: it pushes aside its own mass of water, wherever the level is
  const floatSub = Math.min(A * HULL.depth, mass / RHO);
  const floatLevel = () => TANK.floor + (water + floatSub) / At;
  if (keelHang != null) {
    // held by the cord: where the level would be with the keel there. Below the keel the water fills the whole tank;
    // above it, the tank round the hull: At·(L − f) − A·(L − k) = W, so L = (W + At·f − A·k) / (At − A)
    let level = TANK.floor + water / At;
    if (level > keelHang) level = (water + At * TANK.floor - A * keelHang) / (At - A);
    const sub = pushedAside(Math.min(level, TANK.spout), keelHang);
    if (mass - RHO * sub >= 0) {
      const lvl = fill(level, pushedAside(TANK.spout, keelHang));
      const s2 = pushedAside(lvl, keelHang);
      const reading = round(mass - RHO * s2, 9);
      return out(lvl, keelHang, s2, reading, reading <= 1e-9); // at 0 g the cord carries nothing: it floats
    }
    // the cord goes slack: it floats (the scale reads 0)
    const lvl = fill(floatLevel(), floatSub);
    return out(lvl, lvl - floatSub / A, floatSub, 0, true);
  }
  const lvl = fill(floatLevel(), floatSub);
  return out(lvl, lvl - floatSub / A, floatSub, null, true);

  function out(level, keel, sub, reading, floating) {
    return { water, spilled, level, keel, sub, draft: Math.max(0, level - keel), reading, floating };
  }
}

/** The tank at the start: full to the spout's lip, the beaker empty. */
export const startTank = () => ({ water: FULL, spilled: 0 });

// ── the book's F = Vρg ────────────────────────────────────────────────────────
/** The weight (N) of m grams: W = mg with m in kg. */
export const weightN = (grams) => round((grams / 1000) * G, 6);

/** Digits grouped in threes (English) or the Bangladeshi way (the last three, then twos). Latin digits. */
export function group(x, bd = true) {
  const [int, frac] = String(Math.abs(x)).split('.');
  let out = int;
  if (int.length > 3) out = bd ? `${int.slice(0, -3).replace(/\B(?=(\d{2})+$)/g, ',')},${int.slice(-3)}` : int.replace(/\B(?=(\d{3})+$)/g, ',');
  return `${x < 0 ? '−' : ''}${out}${frac ? `.${frac}` : ''}`;
}

// ── the test ──────────────────────────────────────────────────────────────────
/** While it is lowered, the beaker holds `water` g: the hanging scale reads the rest; the usual mistakes after it. */
export function readingChoices(water) {
  return [
    { key: 'right', v: SHIP_G - water },
    { key: 'same', v: water }, // reads the beaker's number
    { key: 'whole', v: SHIP_G }, // thinks nothing changes in water
    { key: 'added', v: SHIP_G + water }, // adds the water to the ship
  ];
}

/** The beaker holds `now` g; one more container: the right total, then the mistakes. */
export function moreChoices(now) {
  return [
    { key: 'right', v: now + BOX_G },
    { key: 'none', v: now }, // a floating ship pushes aside nothing more
    { key: 'double', v: now + 2 * BOX_G },
    { key: 'only', v: BOX_G }, // only the new container's water
  ];
}

/** The weight (N) of the water in the beaker (cm³): Vρg, then mass in kg, grams × g, and kg ÷ g. */
export function forceChoices(v) {
  const kg = (v * RHO) / 1000;
  return [
    { key: 'right', v: round(kg * G, 2) },
    { key: 'mass', v: round(kg, 2) },
    { key: 'grams', v: round(v * RHO * G, 0) },
    { key: 'divided', v: round(kg / G, 3) },
  ];
}
