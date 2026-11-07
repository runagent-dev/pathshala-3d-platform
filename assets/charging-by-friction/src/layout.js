// Where everything sits on the table, in metres (y up, +z toward the student, +x to the right). Shared by the models
// (bench.js), the charges (charges.js) and the figure (app.js), so a rod, its signs and its swing agree.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** A rod: 25 cm long, 13 mm thick. Its own +x end is the rubbed end (the "tip"). */
export const ROD = { len: 0.25, r: 0.0065, half: 0.125 };
/** The part of a rod the cloth rubs, along its own x (to the tip). An insulator keeps its charge where it was rubbed. */
export const RUB = { from: 0.035, to: 0.125 };

/** The table top: a rounded slab, its top at y = 0. */
export const TABLE = { x0: -0.44, x1: 0.44, z0: -0.3, z1: 0.31, r: 0.05, th: 0.026 };

/** The two rubbing places at the front: the rod's centre lies on two V-blocks (rod axis 34 mm over the table). */
export const AXIS_Y = 0.034;
export const STATION = { glass: V(-0.19, AXIS_Y, 0.15), plastic: V(0.18, AXIS_Y, 0.15) };
/** The V-blocks under each rod, at these x along the rod (the rubbed end overhangs the second). */
export const BLOCKS = [-0.1, 0.004];
/** The cloth: its middle along the rod at rest, how far one stroke moves it each way, and its size. */
export const CLOTH = { rest: 0.08, amp: 0.026, len: 0.072, width: 0.17 };

/** The two stands at the back: a rod hangs from each, on a silk thread tied at its middle. */
export const HANG_Y = 0.2;
export const STAND = { A: V(-0.29, HANG_Y, -0.1), B: V(0.21, HANG_Y, -0.1), arm: 0.395 };

/**
 * The rod held near a hanging one: its tip comes toward the hanging rod's rubbed (left) end from the front left, as
 * in চিত্র ১০.০৩. `toHand` is the direction from the tip back to the hand (to the left, toward the student and down); `near`
 * the tip's place beside that end, `reach` how far back the rod starts.
 */
export const HELD = {
  toHand: V(-0.6, -0.22, 0.77).normalize(),
  near: V(-ROD.half - 0.03, 0, 0.07), // from the hanging rod's centre
  reach: 0.18,
};

/** The hanging rod's charge sits on its rubbed end, which hangs at the left (its own +x points left). */
export const HANG_CHARGE = { from: -ROD.half, to: -ROD.half + (RUB.to - RUB.from), n: 5 };
/** The held rod's charge: points from its tip back along the rubbed part. */
export const HELD_CHARGE = { n: 4, len: RUB.to - RUB.from };
