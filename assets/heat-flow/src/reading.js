// The maths of the book's picture (চিত্র ৬.০১, page 162): a tall narrow tube and a wide vessel joined low down by a pipe
// with a tap. Pure functions, in centimetres. Opening the tap, water runs from the higher surface to the lower one until
// the two heights are equal; what is not equal then is the amount of water (the book's "তাপ"), which is why the tube
// (little water, high surface) gives water to the vessel (much water, low surface), as a hot pin gives heat to a glass of
// water.

/** The apparatus, in cm: inner radii of the tube and the vessel, and how high each can hold water. */
export const GEOM = { tubeR: 1.3, vesselR: 5.2, tubeH: 28, vesselH: 13, floor: 0.2 };
/** How many times wider the vessel's water surface is than the tube's (the areas, π cancels). */
export const AREA_RATIO = (GEOM.vesselR / GEOM.tubeR) ** 2;

/** The height both surfaces reach when the tap stays open: the same water, spread over both areas. */
export function settle(left, right) {
  return (left + AREA_RATIO * right) / (1 + AREA_RATIO);
}

/** Flow takes this long (s) to run its course on screen; a real tap would take longer for a wider vessel. */
export const FLOW_SECONDS = 4.6;
const K = 4.2; // how fast the difference dies away (it halves about every 0.7 s)

/** How far the flow has gone (0 to 1) after `sec` seconds: quick at first (big difference), then slower, then stopped. */
export function progress(sec) {
  const s = Math.min(Math.max(sec / FLOW_SECONDS, 0), 1);
  return (1 - Math.exp(-K * s)) / (1 - Math.exp(-K));
}

/** The two surface heights (cm) at flow progress p. */
export function levelsAt(left, right, p) {
  const end = settle(left, right);
  return { left: left + (end - left) * p, right: right + (end - right) * p };
}

/** Which way the water goes when the tap opens: 'right' (tube to vessel), 'left', or 'none' when the heights are equal. */
export function direction(left, right) {
  const d = left - right;
  return Math.abs(d) < 0.05 ? 'none' : d > 0 ? 'right' : 'left';
}

/** The scenes: where the two surfaces start (cm). 'book' is the picture on page 162. */
export const SCENES = {
  book: { left: 22, right: 8 },
  reverse: { left: 8, right: 12 },
};

/** Water in each vessel (cm³): the amounts, which the heights do NOT show on their own. */
export function volumes(left, right) {
  return { left: Math.PI * GEOM.tubeR ** 2 * left, right: Math.PI * GEOM.vesselR ** 2 * right };
}

/** 0 (coolest) to 1 (hottest): the colour of the water in the heat view, from its surface height. */
export function warmth(h) {
  return Math.min(1, Math.max(0, (h - 6) / 18));
}
