// The optics of the figure, pure functions (unit-tested in test/unit/reflection-laws.test.mjs): the law of reflection
// as a vector formula, the waves of the picture, and the magnified rough strip of the diagram. Directions are plain
// { x, y, z } in the scene's axes: y is up, the water is the plane y = 0, O is the origin.

export const N_WATER = 1.33; // refractive index of water, for how much the lake mirrors

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
export const rad = (d) => d * RAD;
export const deg = (r) => r / RAD;

/** Unit vector along the sheet (the plane of incidence) on the water: phi = 0 is along +x. */
export const along = (phi) => ({ x: Math.cos(rad(phi)), y: 0, z: Math.sin(rad(phi)) });

/** Unit vector from O toward X: theta from the normal, on the −along side of the sheet. */
export function toLight(theta, phi) {
  const u = along(phi);
  const s = Math.sin(rad(theta));
  const c = Math.cos(rad(theta));
  return { x: -u.x * s, y: c, z: -u.z * s };
}

export const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

/** The law of reflection: d is the direction the light travels, n a unit normal. r = d − 2 (d·n) n. */
export function reflect(d, n) {
  const k = 2 * dot(d, n);
  return { x: d.x - k * n.x, y: d.y - k * n.y, z: d.z - k * n.z };
}

/** Angle in degrees between a line along v and the unit normal n (0 … 90). */
export function angleToNormal(v, n) {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return deg(Math.acos(Math.min(1, Math.abs(dot(v, n)) / l)));
}

/** Distance of the tip of v from the plane through the origin with unit normal m (0: v lies in the plane). */
export const offPlane = (v, m) => Math.abs(dot(v, m));

/** The unit normal of the sheet: it holds the normal of the water and the ray. */
export const sheetNormal = (phi) => ({ x: -Math.sin(rad(phi)), y: 0, z: Math.cos(rad(phi)) });

/** The reflected ray's direction from O on flat water: the light's direction reflected in the up normal. */
export function reflected(theta, phi) {
  const l = toLight(theta, phi);
  return reflect({ x: -l.x, y: -l.y, z: -l.z }, { x: 0, y: 1, z: 0 });
}

/** In the sheet, the direction at signed angle a (degrees) from the normal, + toward +along: { s, y }. */
export const sheetDir = (a) => ({ s: Math.sin(rad(a)), y: Math.cos(rad(a)) });

// ── the waves of the picture ─────────────────────────────────────────────────────────────────────────────────
// Eight sine waves for the water's shader, crossing each other (10° to 170°), so no two crests line up. The slopes add up
// to about 0.045 rms: real ripples on a lake, which smear the mirror image into a long shimmering streak.
const SPEC = [
  [52, 0.024, 74],
  [37, 0.024, 118],
  [26, 0.024, 38],
  [18, 0.022, 146],
  [12.5, 0.022, 12],
  [8.7, 0.02, 96],
  [6, 0.018, 168],
  [4.1, 0.016, 58],
];
const G = 26; // the waves' speed is sqrt(g/k): this g suits the scene's scale and keeps them calm to watch
/** Each wave: { kx, kz, w, a, slope }: wave vector, angular speed, height, steepness. */
export const WAVES = SPEC.map(([length, slope, dir]) => {
  const k = TAU / length;
  return { kx: k * Math.cos(rad(dir)), kz: k * Math.sin(rad(dir)), w: Math.sqrt(G * k), a: slope / k, slope };
});
/** The root-mean-square slope of the water: sqrt(Σ slope² / 2). */
export const rmsSlope = (waves = WAVES) => Math.sqrt(waves.reduce((s, w) => s + w.slope * w.slope, 0) / 2);

// ── the rough strip of the diagram ───────────────────────────────────────────────────────────────────────────
// চিত্র ৮.০৭ made solid: a little strip of surface, enlarged, where five parallel rays land on five facets. The tilts
// are far larger than the waves' (said on the view), so that the spread can be seen; the law is the same at each.
export const STRIP = { n: 5, gap: 20, half: 7.5, tilts: [-32, -18, -4, 8, 16], sway: 2.5 };

/**
 * One facet of the strip, as a flat array of 6 numbers per facet in the sheet (s along it, y up): tilt in degrees (+ leans
 * toward +s), then the facet's normal (ns, ny), then the reflected ray (rs, rv), then the angle of incidence there. The
 * rays fall at theta from the −s side. strength: 0 flat … 1 rough; time gives the facets a slow sway. out is reused.
 */
export function stripInto(out, theta, strength, time = 0) {
  const ds = Math.sin(rad(theta));
  const dy = -Math.cos(rad(theta));
  for (let i = 0; i < STRIP.n; i++) {
    const tilt = (STRIP.tilts[i] + STRIP.sway * Math.sin(time * 0.9 + i * 1.7)) * strength;
    const ns = Math.sin(rad(tilt));
    const ny = Math.cos(rad(tilt));
    const k = 2 * (ds * ns + dy * ny);
    const o = i * 6;
    out[o] = tilt;
    out[o + 1] = ns;
    out[o + 2] = ny;
    out[o + 3] = ds - k * ns;
    out[o + 4] = dy - k * ny;
    out[o + 5] = deg(Math.acos(Math.min(1, Math.abs(ds * ns + dy * ny))));
  }
  return out;
}
/** The widest angle between two reflected rays of the strip, degrees. */
export function stripSpread(strip) {
  let c = 1;
  for (let i = 0; i < STRIP.n; i++)
    for (let j = 0; j < i; j++) c = Math.min(c, strip[i * 6 + 3] * strip[j * 6 + 3] + strip[i * 6 + 4] * strip[j * 6 + 4]);
  return deg(Math.acos(Math.max(-1, c)));
}

/** Fisher–Yates on a copy. */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
