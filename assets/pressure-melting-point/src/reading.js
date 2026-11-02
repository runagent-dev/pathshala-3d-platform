// The maths and the story of the book's চিত্র ৬.০৯, as pure functions (unit-tested in test/unit/): the ice block's
// size, how high the wire is when it has cut a given part of the way through, and what the sheet says at each step.
// Lengths in metres. The book gives no numbers for this experiment, so none are invented: the speed is only a picture.

export const ICE = { x: 0.7, y: 0.26, z: 0.3 }; // the block (its bottom is y = 0, resting on the table)
export const WIRE_R = 0.009; // drawn thick enough to see (a real wire is much thinner)
export const P_HANG = 0.06; // how far the wire has sunk once the weights hang on it (a little way into the top)
export const P_OUT = 0.97; // from here the wire is clear of the block: no more pressure on the ice
export const CUT_SECONDS = 7; // the cut, shown fast (the real thing takes a long time)
export const STEPS = 3; // hang the weights, let the wire cut through, take the wire and weights away

export const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** The height of the wire's centre: resting on the top (p = 0) to just below the bottom of the block (p = 1). */
export function wireY(p) {
  return ICE.y + WIRE_R + (-0.012 - (ICE.y + WIRE_R)) * clamp01(p);
}

/** How tall the refrozen seam above the wire is (from the wire up to the top of the block). */
export function seamHeight(p) {
  return Math.max(0, ICE.y - (wireY(p) + WIRE_R));
}

/** The wire is inside the block, pressing on the ice under it. */
export function isCutting(p) {
  return p < P_OUT;
}

/** Which part of the story: 'start' (wire on top), 'hung', 'cutting', 'out' (through), 'whole' (wire taken away). */
export function phaseOf({ step, p }) {
  if (step >= 3) return 'whole';
  if (step === 2 && p >= 1) return 'out';
  if (step === 2 || (step === 1 && p > P_HANG + 0.001)) return 'cutting';
  if (step === 1) return 'hung';
  return 'start';
}

/** What the next tap does (with the wire only part of the way through, it goes on cutting). */
export function nextOf(step, busy, p = 1) {
  if (busy) return '';
  if (step === 2 && p < 1) return 'cut';
  return ['hang', 'cut', 'remove', 'again'][Math.min(3, Math.max(0, step))];
}

/** The test's five scenes: { step, p, rig } for each question kind. */
export const SCENES = {
  press: { step: 1, p: P_HANG, rig: 1 },
  why: { step: 2, p: 0.5, rig: 1 },
  refreeze: { step: 2, p: 0.58, rig: 1 },
  whole: { step: 2, p: 0.42, rig: 1 },
  join: { step: 3, p: 1, rig: 0 },
};
export const QUIZ_KINDS = ['press', 'why', 'refreeze', 'whole', 'join'];
