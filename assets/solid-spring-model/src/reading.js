// The maths of the spring model (book p167, চিত্র ৬.০৩), pure functions, unit-tested.
// Every atom sits at the corner of a cube and is joined to its neighbours by springs. Heated, it shakes about its
// place. The special spring (book: "বিশেষ ধরনের স্প্রিং") pushes back hard when squeezed and gives way easily when
// stretched, so an atom goes further away than it goes closer: its average place moves out, and the whole cube is
// a little bigger. The model is drawn much bigger than life.

/** The three temperatures the student chooses: the shaking (0 to 1) of each. */
export const LEVELS = [
  { id: 'cold', tau: 0 },
  { id: 'warm', tau: 0.5 },
  { id: 'hot', tau: 1 },
];

/** How far an atom shakes at the biggest, as a fraction of the cube's edge. */
export const A_MAX = 0.12;
/** The special spring: how much further out than in (1.35 : 0.65). */
export const OUT = 1.35;
export const IN = 0.65;

/** The shake (a fraction of the edge) at heat tau (0 to 1). */
export const amplitude = (tau) => A_MAX * Math.min(1, Math.max(0, tau));

/** The displacement of an atom along an axis, outwards positive, at the swing s = sin(phase) in -1…1. */
export const swing = (s, amp) => amp * (s > 0 ? OUT * s : IN * s);

/** The average displacement over a whole shake: out further than in, so it is not zero. */
export const meanShift = (amp) => (amp * (OUT - IN)) / Math.PI;

/** The cube's edge grows by the shift of both of its atoms (a fraction of the cold edge). */
export const edgeGrowth = (tau) => 2 * meanShift(amplitude(tau));

/** The level nearest to a heat tau. */
export function levelOf(tau) {
  let best = LEVELS[0];
  for (const l of LEVELS) if (Math.abs(l.tau - tau) < Math.abs(best.tau - tau)) best = l;
  return best.id;
}

/** The level after this one (the action's next step), or null at the hottest. */
export function nextLevel(id) {
  const i = LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1].id : null;
}
