// The maths of Torricelli's tube tilted (book page 146, topic 5.4.1): the mercury's vertical height stays 76 cm,
// so along a tilted tube it is 76 / cos θ, with a vacuum still left at the top; the test's choices. Pure functions,
// unit-tested in test/unit/torricelli-barometer-tilt.test.mjs.

/** The mercury column at the sea (m): the book's 76 cm. */
export const H_HG = 0.76;

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

// ── the tube ────────────────────────────────────────────────────────────────
/** The glass tube (m): its inside length from the open mouth to the closed top, and how deep its mouth is. */
export const TUBE = { length: 1.05, mouthDepth: 0.025 };

/** The tilts the student steps through (degrees from upright). At 40° a thin vacuum is still left at the top. */
export const TILTS = [0, 10, 20, 30, 40];

/**
 * The mercury along a tilted tube (m, from the dish's surface to the column's top): the vertical height stays h, so
 * the length along the tube is h / cos θ.
 */
export const tiltLength = (h, deg) => h / Math.cos((deg * Math.PI) / 180);

/** The vacuum left at the top of a tilted tube (m along the tube; 0 if the mercury fills it). */
export function vacuumLength(h, deg) {
  const cos = Math.cos((deg * Math.PI) / 180);
  return Math.max(0, TUBE.length - TUBE.mouthDepth / cos - h / cos);
}

// ── numbers ─────────────────────────────────────────────────────────────────
/** Metres as whole centimetres: 0.6 → 60. */
export const toCm = (m) => round(m * 100, 0);

// ── the test ────────────────────────────────────────────────────────────────

/**
 * The vertical height of the mercury's top in a tilted tube (cm): the right one (76) first, then the length along
 * the tube, 76 × cos θ (as if the column were shortened by the tilt), and the reading upright minus the tilt.
 */
export function tiltChoices(deg) {
  const along = toCm(tiltLength(H_HG, deg));
  const cos = toCm(H_HG * Math.cos((deg * Math.PI) / 180));
  const less = 76 - deg / 2;
  const items = [
    { key: 'right', v: 76 },
    { key: 'along', v: along },
    { key: 'cos', v: cos },
  ];
  if (!items.some((x) => x.v === less)) items.push({ key: 'less', v: less });
  else items.push({ key: 'less', v: 76 - deg });
  return items;
}
