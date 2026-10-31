// The maths of the density figure (book page 131, topic 5.2): ρ = m/V in the book's units, gm/cc (the book's table
// 5.01) and kg/m³ (1 gm/cc = 1000 kg/m³, since 1 cc = 10⁻⁶ m³ as the page's example works out). Three balls of the
// same volume (cork, wood, iron from the table) and a box whose volume changes round the same mass of particles.
// Pure functions, unit-tested in test/unit/density.test.mjs.

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** ρ = m/V: gm/cc from gm and cc. */
export const density = (m, V) => round(m / V, 6);

/** gm/cc → kg/m³ (1 gm = 10⁻³ kg, 1 cc = 10⁻⁶ m³, so 1 gm/cc = 1000 kg/m³). */
export const toKgM3 = (gcc) => round(gcc * 1000, 6);

/** The water in the tanks (the book's table: পানি 1.00 gm/cc). */
export const WATER = 1;

/** Every ball is the same size: V = 100 cc (a ball about 5.8 cm across). */
export const V_BALL = 100;

/**
 * The three balls, from the book's table 5.01 (কর্ক 0.25, কাঠ 0.4 – 0.5, লোহা 7.80 gm/cc), all 100 cc: so their
 * masses are 25, 45 and 780 gm. Wood takes 0.45, the middle of the book's range.
 */
export const BALLS = {
  cork: { m: 25 },
  wood: { m: 45 },
  iron: { m: 780 },
};
export const BALL_IDS = ['cork', 'wood', 'iron'];
export const ballDensity = (id) => density(BALLS[id].m, V_BALL);

/** Floats (less dense than water) or sinks (more dense). */
export const floats = (rho, water = WATER) => rho < water;

/** The radius (cm) of a ball of volume V (cc): V = 4/3 πr³. */
export const radiusOf = (V) => Math.cbrt((3 * V) / (4 * Math.PI));

/** The volume of a sphere's cap of height h (both in the sphere's units): πh²(3r − h)/3. */
export const capVolume = (r, h) => (Math.PI * h * h * (3 * r - h)) / 3;

/**
 * How deep a floating ball sits in water (cm, from its bottom to the water line): the depth whose cap holds the
 * fraction ρ/ρ_water of the ball's volume (it floats when the water it pushes aside weighs as much as the ball).
 * A ball at least as dense as water is under all the way (2r).
 */
export function floatDepth(r, rho, water = WATER) {
  const f = rho / water;
  if (f >= 1) return 2 * r;
  if (f <= 0) return 0;
  const want = f * (4 / 3) * Math.PI * r ** 3;
  let lo = 0;
  let hi = 2 * r;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (capVolume(r, mid) < want) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The box of particles: the same mass (gm) in one of these volumes (cc); a squeeze halves it. */
export const BOX_MASS = 100;
export const BOX_VOLUMES = [50, 100, 200, 400];
export const BOX_START = 400;
/** The edge of a cube of volume V (cm). */
export const boxSide = (V) => Math.cbrt(V);
/** A volume on the box's steps (the nearest one). */
export function fixVolume(V) {
  const v = Number(V);
  if (!Number.isFinite(v)) return BOX_START;
  return BOX_VOLUMES.reduce((best, x) => (Math.abs(Math.log(x / v)) < Math.abs(Math.log(best / v)) ? x : best));
}
/** The next smaller volume (half), or null at the smallest. */
export const smaller = (V) => BOX_VOLUMES[BOX_VOLUMES.indexOf(fixVolume(V)) - 1] ?? null;

/**
 * Where the particles sit inside a unit cube (each coordinate −0.5 … 0.5), never closer than `gap` (in the same unit
 * cube) to each other: a seeded random scatter, the same every time. Scaled with the box, so the same particles
 * spread out or crowd in.
 */
export function particleLayout(n = 24, gap = 0.27, seed = 11) {
  let s = seed >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const out = [];
  for (let tries = 0; out.length < n && tries < 20000; tries++) {
    const p = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5];
    if (out.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) >= gap)) out.push(p);
  }
  return out;
}

/**
 * Digits grouped the Bangladeshi way (the last three, then twos): 7800 → "7,800", 100000 → "1,00,000". Latin digits;
 * t.num turns them into Bangla ones. Decimals are kept as they are.
 */
export function groupBD(x) {
  const [int, frac] = String(Math.abs(x)).split('.');
  let out = int;
  if (int.length > 3) out = `${int.slice(0, -3).replace(/\B(?=(\d{2})+$)/g, ',')},${int.slice(-3)}`;
  return `${x < 0 ? '−' : ''}${out}${frac ? `.${frac}` : ''}`;
}
/** Digits grouped in threes (for English): 19300 → "19,300". */
export function groupIntl(x) {
  const [int, frac] = String(Math.abs(x)).split('.');
  return `${x < 0 ? '−' : ''}${int.replace(/\B(?=(\d{3})+$)/g, ',')}${frac ? `.${frac}` : ''}`;
}

// ── the test ────────────────────────────────────────────────────────────────
/** The box's volumes for the ρ = m/V question (not the starting 400 cc). */
export const QUIZ_BOX_VOLUMES = [50, 200];

/** ρ of the box from m and V, then the usual mistakes: V ÷ m, m × V, and gm/cc written for kg/m³ (× 1000). */
export function boxChoices(m, V) {
  return [
    { key: 'right', v: density(m, V) },
    { key: 'flip', v: density(V, m) },
    { key: 'times', v: round(m * V, 6) },
    { key: 'kg', v: toKgM3(density(m, V)) },
  ];
}

/**
 * Four balls of different sizes on the table for "which one sinks?": only one is denser than water, and it is
 * not the heaviest (the heaviest floats). m in gm, V in cc.
 */
export const SINK_SET = [
  { key: 'heavy', m: 90, V: 120 }, // 0.75: the heaviest and biggest, yet it floats
  { key: 'right', m: 40, V: 20 }, // 2: small and light, yet it sinks
  { key: 'mid', m: 60, V: 100 }, // 0.6
  { key: 'light', m: 30, V: 60 }, // 0.5
];

/** Three balls of the same size, painted alike, for "which is densest?": ρ in gm/cc (two float, one sinks). */
export const ORDER_SET = [0.3, 0.7, 2.6];

/** Heated: the same mass, twice the volume. The new ρ, then the mistakes: doubled, unchanged, the old ρ ÷ 4. */
export function heatChoices(m, V) {
  const before = density(m, V);
  return [
    { key: 'right', v: density(m, 2 * V) },
    { key: 'double', v: round(before * 2, 6) },
    { key: 'same', v: before },
    { key: 'quarter', v: round(before / 4, 6) },
  ];
}
/** The box's volumes before heating, for the heat question. */
export const QUIZ_HEAT_VOLUMES = [50, 100];

/** A ball's ρ in kg/m³ from m and V on the picture: × 1000, then the mistakes: not changed, ÷ 1000, × 100. */
export const UNIT_SET = [
  { m: 260, V: 100 }, // কাচ 2.60 gm/cc
  { m: 390, V: 50 }, // লোহা 7.80 gm/cc
];
export function unitChoices(m, V) {
  const g = density(m, V);
  return [
    { key: 'right', v: toKgM3(g) },
    { key: 'same', v: g },
    { key: 'div', v: round(g / 1000, 6) },
    { key: 'hundred', v: round(g * 100, 6) },
  ];
}
