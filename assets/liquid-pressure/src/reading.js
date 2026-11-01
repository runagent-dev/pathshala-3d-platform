// The maths of the liquid-pressure figure (book page 134, topic 5.3): the pressure at a depth h in a liquid of
// density ρ is the weight of the column of liquid above an area A, divided by A: F = mg = (Ahρ)g, so P = F/A = hρg
// (in N/m² = Pa). Water: ρ = 1000 kg m⁻³, g = 9.8 m s⁻² (the book's worked examples). Also the water jets out of the
// tank's holes (Torricelli: v = √(2gh), a picture of "more pressure, a stronger jet"; the book does not do this sum)
// and the test's choices. Pure functions, unit-tested in test/unit/liquid-pressure.test.mjs.

export const RHO = 1000; // kg m⁻³, water
export const G = 9.8; // m s⁻²
export const ATM = 101325; // Pa: the air's pressure at the ground, 1 atm (the book's number)

/** The tank: the water stands H deep, its bottom STAND above the ground the jets land on (m). */
export const H = 1;
export const STAND = 0.5;

/** The three holes in the side of the tank, by their depth below the water's surface (m). */
export const HOLES = { top: 0.2, mid: 0.4, bot: 0.6 };
export const HOLE_IDS = ['top', 'mid', 'bot'];

/** The imagined surface A at the bottom of the column (the book's figure 5.02): 100 cm². */
export const AREA_CM2 = 100;

/** The depth of the surface A: [shallowest, deepest, step] in metres. */
export const DEPTH_LIMITS = [0.05, 0.95, 0.05];

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** cm² → m² (1 m² = 10,000 cm²). */
export const toM2 = (cm2) => round(cm2 / 10000, 8);

/** P = hρg in pascal, for a depth h (m). */
export const pressure = (h, rho = RHO, g = G) => round(h * rho * g, 6);

/** The column above A: its volume Ah (m³), its mass Ahρ (kg) and its weight F = (Ahρ)g (N). */
export function column(h, cm2 = AREA_CM2, rho = RHO, g = G) {
  const A = toM2(cm2);
  const V = round(A * h, 8);
  const m = round(V * rho, 6);
  return { A, V, m, F: round(m * g, 6) };
}

/** A depth on the grid (0.05 … 0.95 m in steps of 0.05). */
export function fixDepth(h) {
  const [lo, hi, step] = DEPTH_LIMITS;
  const v = round(Math.round((Number(h) || HOLES.top) / step) * step, 2);
  return Math.min(hi, Math.max(lo, v));
}

/** The hole at this depth, if there is one. */
export const holeAt = (h) => HOLE_IDS.find((id) => Math.abs(HOLES[id] - h) < 1e-6) ?? null;

/** The length of a pressure arrow (m) for a pressure (Pa): 6,000 Pa → 15 cm. */
export const ARROW_PER_PA = 0.15 / 6000;
export const arrowLength = (P) => Math.max(0, P) * ARROW_PER_PA;

/** How many metres of water add one atmosphere (101325 Pa): about 10 m, as the book says. */
export const depthPerAtm = (rho = RHO, g = G) => ATM / (rho * g);

// ── the jets ──────────────────────────────────────────────────────────────────
/** A hole's height above the ground the jets land on (m). */
export const holeHeight = (h) => STAND + H - h;

/** The speed the water leaves a hole at depth h (m/s): v = √(2gh). */
export const jetSpeed = (h, g = G) => Math.sqrt(2 * g * h);

/** How far from the hole the jet lands (m): x = v·t with y = gt²/2 → x = 2√(h·y). */
export const jetReach = (h) => 2 * Math.sqrt(h * holeHeight(h));

/** How far the jet has fallen (m) at a distance x from the hole: y = x² / (4h). */
export const jetDrop = (h, x) => (x * x) / (4 * h);

// ── numbers in text ───────────────────────────────────────────────────────────
/**
 * Digits grouped the Bangladeshi way (the last three, then twos): 98000 → "98,000", 980000 → "9,80,000". Latin
 * digits; t.num turns them into Bangla ones. Decimals are kept as they are.
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

/** Digits grouped in threes (for English): 980000 → "980,000". */
export function groupIntl(x) {
  const [int, frac] = String(Math.abs(x)).split('.');
  return `${x < 0 ? '−' : ''}${int.replace(/\B(?=(\d{3})+$)/g, ',')}${frac ? `.${frac}` : ''}`;
}

// ── the test ──────────────────────────────────────────────────────────────────
/**
 * The pressure at a hole whose depth is read off the scale: the right one first, then the usual mistakes: g left
 * out (hρ), the depth in cm, another hole's depth.
 */
export function holeChoices(id) {
  const h = HOLES[id];
  const other = HOLE_IDS.filter((k) => k !== id).map((k) => HOLES[k]);
  return [
    { key: 'right', v: pressure(h) },
    { key: 'no_g', v: round(h * RHO, 6) },
    { key: 'cm', v: pressure(round(h * 100, 6)) },
    { key: 'other', v: pressure(other[id === 'bot' ? 0 : 1]) },
  ];
}

/** The water's own pressure 10 m down: 98,000 Pa (about 1 atm), then 1 m, g left out, 100 m. */
export function tenMetreChoices() {
  return [
    { key: 'right', v: pressure(10) },
    { key: 'one_m', v: pressure(1) },
    { key: 'no_g', v: round(10 * RHO, 6) },
    { key: 'hundred', v: pressure(100) },
  ];
}
