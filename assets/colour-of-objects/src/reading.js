// The physics of the page, as pure functions: which colours of the light an object reflects and which it absorbs (শোষণ),
// and so how it looks. An object reflects only its own colour; what is left is what reaches the eye; with nothing left it
// looks black. The six colours are the ones drawn in the band; the same rule per channel gives the colours of the 3D.

/** The band's colours, in the order of the spectrum (short wavelengths first). */
export const BANDS = ['violet', 'blue', 'green', 'yellow', 'orange', 'red'];

/** What each light holds. */
export const LIGHTS = {
  white: BANDS,
  red: ['red'],
  green: ['green'],
  blue: ['blue'],
};

/** The colour each object reflects: the book's rose and leaf. */
export const OBJECTS = { rose: 'red', leaf: 'green' };

/** Colours of this light that leave the object. */
export const reflected = (object, light) => LIGHTS[light].filter((c) => c === OBJECTS[object]);
/** Colours of this light that end at the object. */
export const absorbed = (object, light) => LIGHTS[light].filter((c) => c !== OBJECTS[object]);
/** How the object looks: its own colour if that colour is in the light, otherwise black. */
export const looks = (object, light) => reflected(object, light)[0] ?? 'black';
/** What reaches the eye from both objects. */
export const toEye = (light) => [...reflected('rose', light), ...reflected('leaf', light)];

// ── the same rule, per channel, for the 3D view ────────────────────────────────────────────────────────────────
// Reflectance of each surface in linear red, green, blue. The 3D view multiplies light by these numbers and nothing else, so
// what it shows is this rule. The channels an object absorbs are nearly zero: 0.04 of a lamp would still show on a screen as
// a clear dark green, and the book says কুচকুচে কালো.
export const REFLECTANCE = {
  rose: [0.74, 0.0055, 0.011],
  leaf: [0.0045, 0.32, 0.018],
  grey: [0.16, 0.16, 0.16], // the vase: a dark neutral glaze
  card: [0.85, 0.85, 0.85], // white paper: gives back all the light it gets
};
/** The lamp through its filter, in linear red, green, blue. A filter passes one primary only. */
export const LAMP = {
  white: [1, 1, 1],
  red: [1, 0, 0],
  green: [0, 1, 0],
  blue: [0, 0, 1],
};
/** Light × reflectance, channel by channel: what leaves a surface. */
export const leaving = (surface, light) => REFLECTANCE[surface].map((r, i) => r * LAMP[light][i]);

/** The largest channel of what leaves: below this a surface reads as black on a screen. */
export const BLACK_BELOW = 0.02;
export const isBlack = (surface, light) => Math.max(...leaving(surface, light)) < BLACK_BELOW;

/** Fisher–Yates. */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
