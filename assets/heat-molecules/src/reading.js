// The maths and the rules of the heat figure (book page 161, topic 6.1), kept apart from the 3D so it can be
// unit-tested. One number, the heat level h (0 … 1), says how hot the substance is. It sets how fast the molecules
// move (the book: more heat, more motion, more kinetic energy) and, with two thresholds, which state they are in:
// in a solid they shake about fixed places, in a liquid they roam among each other, in a gas they are free.
// The levels are drawn, not measured: the book gives no melting or boiling points, so no temperatures are shown.

export const LEVELS = [0, 0.2, 0.46, 0.62, 0.78, 1]; // the six steps of the heat button
export const STATES = ['solid', 'liquid', 'gas'];
export const FIRST_STEP = { solid: 0, liquid: 2, gas: 4 }; // the step a word of the row jumps to
export const LAST_STEP = LEVELS.length - 1;

export const MELT = [0.3, 0.36]; // the solid's bonds let go between these levels
export const BOIL = [0.64, 0.72]; // the liquid's last bonds let go between these levels

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const smoothstep = (a, b, x) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};

/** 1 for a solid (molecules held to their places), 0 once they are free. */
export const solidness = (h) => 1 - smoothstep(MELT[0], MELT[1], h);
/** 0 for a solid or a liquid, 1 for a gas (nothing holds the molecules together). */
export const gasness = (h) => smoothstep(BOIL[0], BOIL[1], h);

export function stateOf(h) {
  if (h < (MELT[0] + MELT[1]) / 2) return 'solid';
  if (h < (BOIL[0] + BOIL[1]) / 2) return 'liquid';
  return 'gas';
}
export const stateOfStep = (i) => stateOf(LEVELS[clamp(i, 0, LAST_STEP)]);

/** The step whose level is closest to h. */
export function stepOf(h) {
  let best = 0;
  for (let i = 1; i < LEVELS.length; i++) if (Math.abs(LEVELS[i] - h) < Math.abs(LEVELS[best] - h)) best = i;
  return best;
}

/** The heat button: one step hotter, and at the top it starts again from the cold solid. */
export const nextStep = (i) => (i >= LAST_STEP ? 0 : i + 1);

/** How fast the molecules move (cm/s in the drawing): more heat, more speed; a gas is the fastest. */
export const speedOf = (h) => (2 + 8 * h) * (1 + gasness(h));

/** Kinetic energy ∝ speed², in units of the cold solid's: only used to show "more" (never as a number). */
export const energyOf = (h) => (speedOf(h) / speedOf(0)) ** 2;

export const OMEGA = 18; // how stiffly a solid's molecules are held (1/s)
/** About how far a solid's molecule strays from its place (cm): speed over stiffness. */
export const strayOf = (h) => speedOf(h) / OMEGA;

// the container, in cm: inner width, height and depth; the molecules' radius; the liquid's top
export const BOX = { w: 11.6, h: 13, d: 4.4 };
export const MOLECULE_R = 0.62;
export const LIQUID_TOP = 9.4;
export const COLS = 6;
export const ROWS = 5;
export const LAYERS = 2;
export const COUNT = COLS * ROWS * LAYERS;
export const GAP = 1.7;

/** The place of molecule i in the solid's lattice: [x, y, z] in cm, y up from the floor of the container. */
export function homeOf(i) {
  const c = i % COLS;
  const r = Math.floor(i / COLS) % ROWS;
  const l = Math.floor(i / (COLS * ROWS));
  return [(c - (COLS - 1) / 2) * GAP, MOLECULE_R + 0.15 + r * GAP, (l - (LAYERS - 1) / 2) * GAP];
}

// ── the test ──────────────────────────────────────────────────────────────────

/** The steps the test may show for a state (one cold, one hot). */
export const STEPS_OF = { solid: [0, 1], liquid: [2, 3], gas: [4, 5] };

/**
 * What the molecules are doing, as four answers: the three states and the usual wrong idea that the molecules of a
 * solid stand still. The first key is the right one for `state`.
 */
export function doingChoices(state) {
  const all = ['solid', 'liquid', 'gas', 'still'];
  return [state, ...all.filter((k) => k !== state)];
}

/** What more heat does to the molecules' motion in the test (the first is right). */
export const MORE_KEYS = ['faster', 'slower', 'same', 'stop'];

/** The names of the energy the book defines, the first is right. */
export const NAME_KEYS = ['heat', 'electric', 'light', 'stored'];
