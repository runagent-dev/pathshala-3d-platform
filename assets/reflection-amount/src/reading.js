// The physics of the figure, pure functions (unit-tested in test/unit/reflection-amount.test.mjs). Everything lies in the
// plane z = 0: x runs from the boy (left) to the flower (right), y is up from the bench, in centimetres. The boy's eye E and
// the flower F are fixed, at one height and 2·SPAN apart; only the glass moves up and down between them. So the light meets
// the glass half way, at x = 0, at an angle set by how far the glass lies under the line EF: tan θ = SPAN / h.

export const SPAN = 20; // half the distance from the eye to the flower, cm
export const EYE_Y = 46; // the height of the eye and the flower above the bench, cm
// The glass: 32 × 32 cm, and 4 cm thick where a real sheet would be about 1 cm, so that it reads as glass on a phone (NOTES.md).
// card: half the side of the printed card stuck under it; gap: the rubber feet between it and the jack's plate.
export const GLASS = { halfX: 16, halfZ: 16, thick: 4, card: 11, gap: 1.4 };
export const N_GLASS = 1.5; // ordinary glass; air is taken as 1
export const MIN_ANGLE = 30;
export const MAX_ANGLE = 87;
export const STOPS = [30, 60, 80, 87]; // the angles the action moves through
export const START_ANGLE = STOPS[0];

const RAD = Math.PI / 180;
export const rad = (d) => d * RAD;
export const deg = (r) => r / RAD;
const round = (x, places = 6) => Number(x.toFixed(places));

/** Snell's law from air: the angle from the normal inside glass, degrees. */
export const refractedAngle = (theta, n = N_GLASS) => deg(Math.asin(Math.sin(rad(theta)) / n));

/**
 * Fresnel's equations for unpolarised light going from air into a medium of index n: the fraction reflected at one surface
 * at incidence theta (degrees). At 0° it is ((n − 1) / (n + 1))², 4 % for glass; at 90° it is 1.
 */
export function fresnel(theta, n = N_GLASS) {
  if (theta >= 90) return 1;
  const c = Math.cos(rad(theta));
  const ct = Math.sqrt(1 - (1 - c * c) / (n * n));
  const rs = (c - n * ct) / (c + n * ct);
  const rp = (ct - n * c) / (ct + n * c);
  return (rs * rs + rp * rp) / 2;
}
/** The reflected share as a whole percent, as the panel says it ("প্রায়"). */
export const percent = (theta, n = N_GLASS) => Math.round(fresnel(theta, n) * 100);
/** What is not reflected goes into the glass (absorption at the surface is left out: it is `light-at-boundary`'s). */
export const percentIn = (theta, n = N_GLASS) => 100 - percent(theta, n);

export const clampAngle = (a) => Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, Number.isFinite(+a) ? +a : START_ANGLE));
/** How far the top of the glass lies under the line from the eye to the flower, cm. */
export const depthFor = (theta) => SPAN / Math.tan(rad(theta));
/** The height of the top of the glass above the bench, cm. */
export const planeFor = (theta) => EYE_Y - depthFor(theta);
/** The angle of incidence for a glass whose top is at height y. */
export const exactAngle = (y) => deg(Math.atan2(SPAN, Math.max(1e-3, EYE_Y - y)));
/** The same in whole degrees, for a drag: the numbers shown stay exact. */
export const angleFor = (y) => clampAngle(Math.round(exactAngle(y)));

/**
 * Every point of the drawing at angle theta. `inside`: where the flower's refracted ray reaches the bottom of the slab.
 * `under`: the point of the pattern the boy sees at the point of incidence, the same ray on his sight's side of the normal.
 */
export function points(theta) {
  const a = clampAngle(theta);
  const y = planeFor(a);
  const r = refractedAngle(a);
  return {
    angle: a,
    refracted: round(r, 3),
    plane: y,
    eye: { x: -SPAN, y: EYE_Y, z: 0 },
    flower: { x: SPAN, y: EYE_Y, z: 0 },
    hit: { x: 0, y, z: 0 },
    inside: { x: -GLASS.thick * Math.tan(rad(r)), y: y - GLASS.thick, z: 0 },
    under: { x: GLASS.thick * Math.tan(rad(r)), y: y - GLASS.thick, z: 0 },
    top: { x: 0, y: EYE_Y + 13, z: 0 }, // the top of the normal
  };
}

/** The next stop above an angle, or null at the last one. */
export const nextStop = (theta) => STOPS.find((s) => s > theta + 0.25) ?? null;

/** Shuffled copy (the test harness seeds Math.random). */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
