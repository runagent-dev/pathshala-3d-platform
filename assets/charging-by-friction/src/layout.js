// Where everything sits, in metres (y up, +z toward the student, +x to the right). Shared by the models (bench.js), the
// charges and the figure (app.js), so a rod, its signs and its swing agree.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** A rod: 25 cm long, 22 mm thick. Its own +x end is the rubbed end (the "tip"). */
export const ROD = { len: 0.25, r: 0.011, half: 0.125 };
/** The part of a rod the cloth rubs, along its own x (to the tip). An insulator keeps its charge where it was rubbed. */
export const RUB = { from: 0.035, to: 0.125 };

/** The rubbing table: a rounded slab, its top at y = 0. The stands stand behind it, on their own heavy bases. */
export const TABLE = { x0: -0.44, x1: 0.44, z0: 0.03, z1: 0.35, r: 0.05, th: 0.026 };

/** The two rubbing places: the rod's centre lies on two V-blocks (rod axis 40 mm over the table). */
export const AXIS_Y = 0.04;
export const STATION = { glass: V(-0.19, AXIS_Y, 0.19), plastic: V(0.18, AXIS_Y, 0.19) };
/** The V-blocks under each rod, at these x along the rod (the rubbed end overhangs the second). */
export const BLOCKS = [-0.1, 0.004];
/** The cloth: its middle along the rod at rest, how far one stroke moves it each way, and its size. */
export const CLOTH = { rest: 0.08, amp: 0.026, len: 0.072, width: 0.19 };

/**
 * The two stands: a rod hangs from each, on a silk thread tied at its middle, in the air over the blue. `back`: how far
 * behind the rod the pillar stands (out of the way of the swing and of the close view), `arm`: the height of the arm.
 */
export const HANG_Y = 0.2;
export const STAND = { A: V(-0.33, HANG_Y, -0.2), B: V(0.27, HANG_Y, -0.2), arm: 0.395, back: 0.3 };

/**
 * The rod held near a hanging one: it comes in from the left, almost level, tip first, beside the hanging rod's rubbed
 * end, as in চিত্র ১০.০৩. `toHand` is the direction from its tip back to the hand; `near` the tip's place at the closest,
 * from the hanging rod's centre; `away` the way it is drawn back from there (toward the student), `reach` how far.
 */
export const HELD = {
  toHand: V(-0.99, -0.02, 0.12).normalize(),
  near: V(-0.018, 0, 0.095),
  away: V(0.25, -0.02, 1).normalize(),
  reach: 0.07,
};

/** The hanging rod's charge sits on its rubbed end, which hangs at the left (its own +x points left). */
export const HANG_CHARGE = { from: -ROD.half, to: -ROD.half + (RUB.to - RUB.from), n: 5 };
/** The held rod's charge: points from its tip back along the rubbed part. */
export const HELD_CHARGE = { n: 4, len: RUB.to - RUB.from };
