// The geometry of a pinhole, pure functions (unit-tested in test/unit/pinhole-camera.test.mjs). Everything is measured from the
// hole, which is the origin of the rail's scale: the candle stands u centimetres before the board (x = −u), the paper v
// centimetres after it (x = +v), and every ray that reaches the paper is a straight line through the hole. Nothing here is
// remembered or eased: the image's size, place, blur and brightness all come from that one straight line.

export const HOLE_Y = 16; // the hole's height above the bench, cm: the middle of the flame
export const FLAME = { length: 4, tip: HOLE_Y + 2, base: HOLE_Y - 2 }; // the flame l, cm: X its tip, Y its base
export const U = { min: 9, max: 21, step: 1, start: 12 }; // the candle's distance from the board, cm
export const V = { min: 6, max: 27, step: 1, start: 18 }; // the paper's distance from the board, cm
export const HOLES = { none: 0, tiny: 0.1, big: 0.8 }; // the hole's diameter, cm: 1 mm, the book's সূক্ষ্ম ফুটো, and 8 mm
export const PAPER = { width: 20, height: 25 }; // cm, centred on the hole's height
export const BOARD = { width: 18, height: 26 }; // cm, centred on the hole: it shades all the paper from the candle
export const STEP_DRAG = 3; // cm: a drag this long has shown the change
export const RAIL_BAR = 4.4; // the depth of the distance bars on the bench, cm: in front of the rail

export const round = (x, digits = 2) => {
  const k = 10 ** digits;
  return Math.round((x + Number.EPSILON) * k) / k;
};
const snap = (x, r) => Math.min(r.max, Math.max(r.min, Math.round(x / r.step) * r.step));
export const clampU = (u) => snap(u, U);
export const clampV = (v) => snap(v, V);

/** m = l′/l = v/u: the two triangles at the hole are similar. */
export const magnification = (u, v) => v / u;
/** The image's length on the paper, cm. */
export const imageLength = (u, v, l = FLAME.length) => l * magnification(u, v);

/** The depth of the bar beside the image: clear of the flame's picture, which is as much wider as it is longer. */
export const imageSide = (u, v) => magnification(u, v) * 0.9 + 0.9;

/** Where the straight line from a point p through the hole meets the paper: the other side of the axis, m times as far. */
export function project(p, u, v) {
  const m = magnification(u, v);
  return { x: v, y: HOLE_Y - (p.y - HOLE_Y) * m, z: -p.z * m };
}

/** The four points of the book's letters, and the hole O. */
export function points(u, v) {
  const X = { x: -u, y: FLAME.tip, z: 0 };
  const Y = { x: -u, y: FLAME.base, z: 0 };
  return { X, Y, O: { x: 0, y: HOLE_Y, z: 0 }, X1: project(X, u, v), Y1: project(Y, u, v) };
}

/** How far a line from a point of the flame through a hole of diameter d spreads on the paper: the hole's own shape, enlarged. */
export const blurDiameter = (d, u, v) => (d * (u + v)) / u;
/** That spread as a share of the image: the blur the eye sees. For a tiny hole it hardly changes with distance. */
export const blurShare = (d, u, v, l = FLAME.length) => blurDiameter(d, u, v) / imageLength(u, v, l);
/**
 * Brightness of the image, per unit of paper, against the opening picture. The light through the hole grows with its area and
 * falls as 1/u², and it spreads over an area that grows as (v/u)²: u cancels, and what is left is (d/v)².
 */
export const brightness = (d, v) => (d / HOLES.tiny) ** 2 * (V.start / v) ** 2;
/** What the shader adds to the paper: the eye takes light roughly as its 0.4 power, kept short of a white-out. */
export const imageGain = (d, v) => (d > 0 ? Math.min(2.4, brightness(d, v) ** 0.4) : 0);

/** A candle flame's slow breathing: smooth, deterministic, a little of everything. t in seconds. */
export function flicker(t) {
  const a = Math.sin(t * 2.3) + 0.6 * Math.sin(t * 5.7 + 1.1) + 0.35 * Math.sin(t * 13.1 + 2);
  const b = Math.sin(t * 3.1 + 0.4) + 0.5 * Math.sin(t * 8.3 + 2.6);
  return { height: 1 + 0.018 * a, width: 1 - 0.012 * a, lean: 0.07 * b, light: 1 + 0.035 * a };
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
