// The story in time (seconds): one water molecule, the ice, the ice melting into water, the water, the water boiling
// into vapour, the vapour, then the three states together with the arrows between them. Every function here is pure
// in t, so render(t) can draw any moment directly.
// (segment is the same as shared/lib/timeline.js's; written out here because the checker loads i18n.js, and with it
// this file, without the figure's import map)
const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const segment = (t, start, end) => (end <= start ? (t >= end ? 1 : 0) : clamp01((t - start) / (end - start)));

export const DURATION = 72;
export const T = {
  split: 4, // the molecule breaks into one O and two H …
  join: 6.6, // … and comes back together
  zoomOut: 7.6, // the one molecule becomes one of many in the ice
  solid: 9.5,
  heat: 20, // the flame is lit
  melt: 20.5, // the ice starts to melt (until meltEnd)
  meltEnd: 27.5,
  liquid: 28.5,
  boil: 40, // the flame turns up, bubbles, then steam
  toGas: 44, // the lens moves up into the steam (until gas)
  gas: 46.5,
  cycle: 58, // the three lenses side by side (until cycleIn)
  cycleIn: 60,
};

export const smooth = (x) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

/** How much of the ice is left (1 = the whole cube, 0 = all melted). */
export const iceLeft = (t) => 1 - smooth(segment(t, T.melt, T.meltEnd - 0.3));
/** Depth of the water as a share of the full depth from the melted ice; some boils away later. */
export const waterLevel = (t) => (1 - iceLeft(t) ** 1.2) * (1 - 0.18 * segment(t, T.boil + 2, DURATION));
/** The flame: 0 off, about 0.55 low (melting), 1 high (boiling). */
export const flame = (t) => 0.55 * smooth(segment(t, T.heat - 0.6, T.heat + 0.4)) + 0.45 * smooth(segment(t, T.boil - 0.5, T.boil + 1));
/** Bubbles in the boiling water. */
export const boiling = (t) => smooth(segment(t, T.boil + 0.8, T.boil + 3));
/** The steam above the pan. */
export const steam = (t) => smooth(segment(t, T.boil + 1.5, T.boil + 4));
/** Spring stiffness tying the molecules to their places in the ice: lets go while it melts. */
export const tether = (t) => 260 * (1 - smooth(segment(t, T.melt + 0.5, T.melt + 5.5)));
/** Heat of the molecules in the lens: calm ice, livelier water, livelier still when it boils. */
export const temperature = (t) => 0.03 + 0.09 * smooth(segment(t, T.melt, T.melt + 4.5)) + 0.06 * smooth(segment(t, T.boil, T.boil + 3));

/** When the big lens, on its way up into the steam, swaps the water's molecules for the vapour's. */
export const GAS_SWAP = T.toGas + 0.9;

/** What the big lens shows at t: 'one' (a single molecule), 'solid', 'liquid' or 'gas'. */
export function lensMode(t) {
  if (t < T.zoomOut) return 'one';
  if (t < T.melt) return 'solid';
  return t < GAS_SWAP ? 'liquid' : 'gas';
}

/** Where the big lens points, blended: 0 the ice, 1 the water, 2 the steam. */
export const lensTarget = (t) => smooth(segment(t, T.melt + 3.5, T.meltEnd)) + smooth(segment(t, T.toGas, T.gas - 0.5));

/** 0 while the one big lens is shown, 1 once the three lenses stand side by side. */
export const cycleShare = (t) => smooth(segment(t, T.cycle, T.cycleIn));

/**
 * The arrows of the cycle, in the order they light up: from (0 ice, 1 water, 2 vapour) to, and heat or cool.
 * After the last one all four stay lit.
 */
export const ARROWS = [
  { from: 0, to: 1, kind: 'heat' },
  { from: 1, to: 2, kind: 'heat' },
  { from: 2, to: 1, kind: 'cool' },
  { from: 1, to: 0, kind: 'cool' },
];
export const ARROW_STEP = 2.6;
/** Which arrow is lit at t in the cycle part: its index, -1 before the first, 4 when they are all lit. */
export function litArrow(t) {
  if (t < T.cycleIn) return -1;
  return Math.min(ARROWS.length, Math.floor((t - T.cycleIn) / ARROW_STEP));
}
