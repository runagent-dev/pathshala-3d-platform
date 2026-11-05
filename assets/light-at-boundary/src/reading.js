// The physics of the figure, pure functions: the law of reflection, Snell's law and where each part of the light goes.
// Centimetres, with the air above the top face of the block and the glass below it. All in one vertical plane, z = 0.

export const EVENTS = ['reflection', 'refraction', 'absorption'];
export const N_GLASS = 1.5; // the refractive index of ordinary glass; air is taken as 1 (the book: nearly the same as nothing)

/** The block: 17 cm long, 8 cm tall, 9 cm deep, on a bench at y = 0. */
export const BLOCK = { halfLength: 8.5, height: 8, halfDepth: 4.5 };
export const HIT = Object.freeze({ x: 1, y: BLOCK.height, z: 0 }); // where the light meets the glass
export const START_ANGLE = 50; // degrees from the vertical
export const MIN_ANGLE = 20;
export const MAX_ANGLE = 70;
export const TO_LENS = 14; // cm from the hole in the torch's cap to the glass
export const OUT = 13; // how far the reflected ray is drawn
export const STUB = 1.8; // how far the part that is absorbed is drawn: it dies away at once, at the surface
const STUB_SLOPE = (18 * Math.PI) / 180; // just under the surface

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const round = (x, places = 6) => Number(x.toFixed(places));

/** Snell's law, n₁ sin θ₁ = n₂ sin θ₂: the angle from the vertical inside the second medium, degrees. */
export function refractedAngle(angle, n1 = 1, n2 = N_GLASS) {
  return deg(Math.asin((n1 * Math.sin(rad(angle))) / n2));
}

export const clampAngle = (a) => Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, Number.isFinite(+a) ? +a : START_ANGLE));

/**
 * Every point of the drawing for light coming from the left at `angle` from the vertical: the hole of the torch, the
 * hit, the ends of the reflected ray (same angle on the other side), of the refracted ray (it stops on the bench, under
 * the block) and of the short part that is absorbed.
 */
export function paths(angle = START_ANGLE) {
  const a = clampAngle(angle);
  const s = Math.sin(rad(a));
  const c = Math.cos(rad(a));
  const r = refractedAngle(a);
  const lens = { x: HIT.x - TO_LENS * s, y: HIT.y + TO_LENS * c, z: 0 };
  const reflected = { x: HIT.x + OUT * s, y: HIT.y + OUT * c, z: 0 };
  const refracted = { x: HIT.x + HIT.y * Math.tan(rad(r)), y: 0, z: 0 };
  const stub = { x: HIT.x + STUB * Math.cos(STUB_SLOPE), y: HIT.y - STUB * Math.sin(STUB_SLOPE), z: 0 };
  return { angle: a, refracted_angle: round(r, 3), lens, hit: { ...HIT }, reflected, refracted, stub };
}

/** Shuffled copy (the test harness seeds Math.random). */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
