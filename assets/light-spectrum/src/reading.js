// The physics of the page, as pure functions. The colours are measured: the CIE 1931 standard observer, 2°, every 10 nm, and
// the eye's sensitivity is its ȳ (the CIE photopic V(λ), the curve of চিত্র ৮.০১). A CD is a reflection grating: its tracks
// lie 1.6 µm apart, and at one spot of the disc the light gains λ/d along the radius (the grating equation in 3D, so that
// it holds for sunlight falling from any side). Everything on the view comes from these numbers. Centimetres, nanometres.

// ── the eye ────────────────────────────────────────────────────────────────────────────────────────────────────
const FROM = 380;
const STEP = 10;
// x̄, ȳ, z̄ at 380, 390 … 780 nm
const CIE = [
  [0.0014, 0.00004, 0.0065],
  [0.0042, 0.00012, 0.0201],
  [0.0143, 0.0004, 0.0679],
  [0.0435, 0.0012, 0.2074],
  [0.1344, 0.004, 0.6456],
  [0.2839, 0.0116, 1.3856],
  [0.3483, 0.023, 1.7471],
  [0.3362, 0.038, 1.7721],
  [0.2908, 0.06, 1.6692],
  [0.1954, 0.091, 1.2876],
  [0.0956, 0.139, 0.813],
  [0.032, 0.208, 0.4652],
  [0.0049, 0.323, 0.272],
  [0.0093, 0.503, 0.1582],
  [0.0633, 0.71, 0.0782],
  [0.1655, 0.862, 0.0422],
  [0.2904, 0.954, 0.0203],
  [0.4334, 0.995, 0.0087],
  [0.5945, 0.995, 0.0039],
  [0.7621, 0.952, 0.0021],
  [0.9163, 0.87, 0.0017],
  [1.0263, 0.757, 0.0011],
  [1.0622, 0.631, 0.0008],
  [1.0026, 0.503, 0.0003],
  [0.8544, 0.381, 0.0002],
  [0.6424, 0.265, 0],
  [0.4479, 0.175, 0],
  [0.2835, 0.107, 0],
  [0.1649, 0.061, 0],
  [0.0874, 0.032, 0],
  [0.0468, 0.017, 0],
  [0.0227, 0.0082, 0],
  [0.0114, 0.0041, 0],
  [0.0058, 0.0021, 0],
  [0.0029, 0.00105, 0],
  [0.0014, 0.00052, 0],
  [0.0007, 0.00025, 0],
  [0.0003, 0.00012, 0],
  [0.0002, 0.00006, 0],
  [0.0001, 0.00003, 0],
  [0, 0, 0],
];
const PEAK = 555;

/** The standard observer at λ, by straight lines between the table's rows. Outside 380 … 780 nm: nothing. */
export function observer(nm) {
  if (!(nm >= FROM && nm <= FROM + STEP * (CIE.length - 1))) return [0, 0, 0];
  const f = (nm - FROM) / STEP;
  const i = Math.min(CIE.length - 2, Math.floor(f));
  const k = f - i;
  return [0, 1, 2].map((c) => CIE[i][c] + (CIE[i + 1][c] - CIE[i][c]) * k);
}

/** চোখের সংবেদনশীলতা, 0 … 1: the book's curve, 1 at 555 nm (the table's own value there, between 0.995 and 0.995). */
export function sensitivity(nm) {
  const y = observer(nm)[1];
  if (nm <= 550 || nm >= 560) return y;
  return y + 0.005 * (1 - Math.abs(nm - PEAK) / 5);
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const toSRGB = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
export const VISIBLE = Object.freeze([400, 700]);

/** How bright the wall shows λ, 0 … 1 (on a screen). Nothing at all past the book's two ends. */
export function glow(nm) {
  const f = smooth(VISIBLE[0] - 4, 440, nm) * (1 - smooth(628, VISIBLE[1] + 4, nm));
  return f ** 0.5;
}

/**
 * The colour of λ on a screen, in linear sRGB 0 … 1: XYZ to sRGB; a pure colour lies outside what a screen can show, so what
 * goes below zero is cut off; then the brightest channel is scaled to `glow`. A hue from measurement, not a hue wheel.
 */
export function linearColour(nm) {
  const [x, y, z] = observer(nm);
  const c = [3.2406 * x - 1.5372 * y - 0.4986 * z, -0.9689 * x + 1.8758 * y + 0.0415 * z, 0.0557 * x - 0.204 * y + 1.057 * z];
  const up = c.map((v) => Math.max(0, v));
  const top = Math.max(up[0], up[1], up[2]);
  if (top <= 0) return [0, 0, 0];
  const g = glow(nm) ** 2.2;
  const grey = (up[0] + up[1] + up[2]) / (3 * top);
  return up.map((v) => (v / top) * 0.86 * g + grey * 0.14 * g); // a touch of white: a pure screen primary looks neon
}
const hex = (v) =>
  Math.round(Math.min(1, Math.max(0, v)) * 255)
    .toString(16)
    .padStart(2, '0');
/** The same colour as #rrggbb. */
export function cssColour(nm) {
  const c = linearColour(nm);
  return `#${hex(toSRGB(c[0]))}${hex(toSRGB(c[1]))}${hex(toSRGB(c[2]))}`;
}
/** The colour in full strength (the ends of the spectrum too), for the words and the marks. */
export function pureColour(nm) {
  const c = linearColour(Math.min(690, Math.max(420, nm)));
  const top = Math.max(c[0], c[1], c[2]) || 1;
  return `#${hex(toSRGB(c[0] / top))}${hex(toSRGB(c[1] / top))}${hex(toSRGB(c[2] / top))}`;
}

// ── the colours' names, and the book's other kinds of light ───────────────────────────────────────────────────
/** The book's order: "বেগুনি নীল সবুজ হলুদ কমলা লাল". `nm` is where a tap on the word goes. */
export const COLOURS = Object.freeze([
  { id: 'violet', from: 400, to: 450, nm: 425 },
  { id: 'blue', from: 450, to: 495, nm: 470 },
  { id: 'green', from: 495, to: 570, nm: 530 },
  { id: 'yellow', from: 570, to: 590, nm: 580 },
  { id: 'orange', from: 590, to: 620, nm: 605 },
  { id: 'red', from: 620, to: 700, nm: 660 },
]);
/** The kind of light at λ: a colour's id, or 'uv' / 'ir' past the book's two ends. */
export function kindOf(nm) {
  if (nm < VISIBLE[0]) return 'uv';
  if (nm > VISIBLE[1]) return 'ir';
  return (COLOURS.find((c) => nm < c.to) ?? COLOURS[5]).id;
}
export const isVisible = (nm) => nm >= VISIBLE[0] && nm <= VISIBLE[1];

/** The bands of চিত্র ৮.০১, by log₁₀ of the wavelength in metres. */
export const BANDS = Object.freeze([
  { id: 'gamma', from: -14, to: -11 },
  { id: 'xray', from: -11, to: -8 },
  { id: 'uv', from: -8, to: Math.log10(400e-9) },
  { id: 'visible', from: Math.log10(400e-9), to: Math.log10(700e-9) },
  { id: 'ir', from: Math.log10(700e-9), to: -3 },
  { id: 'micro', from: -3, to: -1 },
  { id: 'radio', from: -1, to: 6 },
]);

// ── the CD as a grating ───────────────────────────────────────────────────────────────────────────────────────
export const PITCH_NM = 1600; // the tracks of a CD: 1.6 µm
export const CD = Object.freeze({ radius: 6, hole: 0.75, thick: 0.12, data: [2.4, 5.8] }); // 120 mm, 15 mm hole, 1.2 mm thick

const rad = (d) => (d * Math.PI) / 180;
const v = (x, y, z) => ({ x, y, z });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const scale = (a, k) => v(a.x * k, a.y * k, a.z * k);
const plus = (a, b, k = 1) => v(a.x + b.x * k, a.y + b.y * k, a.z + b.z * k);
const unit = (a) => scale(a, 1 / Math.hypot(a.x, a.y, a.z));
const cross = (a, b) => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

const YAW = 40; // the disc's normal, from the camera's side toward the wall on the left
const TILT = 8; // the disc leans back by this much
const CENTRE = v(13.2, 14.2, 0); // the disc's centre
const SPOT_R = 4.2; // where the sunlight falls, from the centre, on the upward radius: there the grooves run level
const SUN = { yaw: 26, el: 38 }; // where the sunlight comes from
const SLIT = 0.2; // half the width of the sunlight on the disc: a narrow sliver, level

export const WALL = Object.freeze({
  yaw: 42, // how far its face is turned to the camera's right
  at: v(-10.9, 0, -0.66), // the middle of its foot, on the bench
  half: 6.8, // half its width
  height: 25,
});

/** The disc in space. `up` runs up the disc; `side` lies level in it, toward the wall. */
export const DISC = (() => {
  const normal = v(-Math.sin(rad(YAW)) * Math.cos(rad(TILT)), Math.sin(rad(TILT)), Math.cos(rad(YAW)) * Math.cos(rad(TILT)));
  const side = v(-Math.cos(rad(YAW)), 0, -Math.sin(rad(YAW)));
  const raw = unit(cross(side, normal));
  return Object.freeze({ centre: CENTRE, normal, side, up: raw.y < 0 ? scale(raw, -1) : raw });
})();
export const SPOT = Object.freeze(plus(CENTRE, DISC.up, SPOT_R));

/** A unit vector toward the sun. */
export const TO_SUN = Object.freeze(
  v(Math.sin(rad(SUN.yaw)) * Math.cos(rad(SUN.el)), Math.sin(rad(SUN.el)), Math.cos(rad(SUN.yaw)) * Math.cos(rad(SUN.el))),
);
const WALL_NORMAL = Object.freeze(v(Math.sin(rad(WALL.yaw)), 0, Math.cos(rad(WALL.yaw)))); // toward the disc and the camera
const WALL_ALONG = Object.freeze(v(Math.cos(rad(WALL.yaw)), 0, -Math.sin(rad(WALL.yaw)))); // along it, to the camera's right
export { WALL_ALONG, WALL_NORMAL };

/**
 * The grating equation in 3D. The ray leaves with the sun's along-the-disc part plus m·λ/d along the local radius; the part
 * along the normal is what is left of a unit vector. λ = 0 is the plain mirror reflection. Null: that order does not exist.
 */
export function diffracted(nm, { radial = DISC.up, order = 1, sun = TO_SUN } = {}) {
  const inward = scale(sun, -1);
  const tangent = plus(inward, DISC.normal, -dot(inward, DISC.normal));
  const out = plus(tangent, radial, (order * nm) / PITCH_NM);
  const left = 1 - dot(out, out);
  if (left <= 0) return null;
  return plus(out, DISC.normal, Math.sqrt(left));
}

/** Where a ray from `from` along `dir` meets the plane of the wall. */
export function onWall(from, dir) {
  const k = dot(plus(WALL.at, from, -1), WALL_NORMAL) / dot(dir, WALL_NORMAL);
  return plus(from, dir, k);
}
/** Along the wall from the middle of its foot, cm: to the camera's right is positive. */
export const alongWall = (p) => dot(plus(p, WALL.at, -1), WALL_ALONG);
/** The point of the wall at `u` along it, at height y. */
export const wallPoint = (u, y) => plus(v(WALL.at.x, y, WALL.at.z), WALL_ALONG, u);

/** The ray of λ from the middle of the sliver: where it lands on the wall. */
export function landing(nm) {
  const d = diffracted(nm);
  return d ? onWall(SPOT, d) : null;
}
/** The same from a point `off` cm along the sliver: its radius points a little differently, so the band flares. */
export function landingAt(nm, off) {
  const from = plus(SPOT, DISC.side, off);
  const r = unit(plus(from, CENTRE, -1));
  const d = diffracted(nm, { radial: r });
  return d ? onWall(from, d) : null;
}
export const SLIT_HALF = SLIT;

export const MIN_NM = 330;
export const MAX_NM = 860;
export const clampNm = (n) => Math.min(MAX_NM, Math.max(MIN_NM, Number.isFinite(+n) ? +n : 550));

/** The wavelength that lands at height y on the wall: the inverse of `landing`, by bisection (the height grows with λ). */
export function nmAt(y) {
  let lo = MIN_NM;
  let hi = MAX_NM;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (landing(mid).y < y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Fisher–Yates. */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
