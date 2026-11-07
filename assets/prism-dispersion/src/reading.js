// The physics of the page, as pure functions: a 60° glass prism, apex up and its base (ভূমি) at the bottom, as চিত্র ৯.১২
// draws it, and light traced through it face by face with Snell's law (n₁ sin θ₁ = n₂ sin θ₂, the vector form). The glass is
// a common crown glass: n = A + B/λ² (Cauchy), with n = 1.52 for yellow light (589 nm), the book's table ৯.০১ value for
// glass. Everything is in one plane (the ray plane, z = 0), in centimetres; angles in degrees.
//
// The picture spreads the colours wider than real glass would (K times, see SPREAD): real crown glass fans 400–700 nm
// over about 1.5°, a few millimetres on a screen at this distance. The red light that the figure starts with is traced
// with the real index, and the spread is widened about it, so red stays where it was when the red filter comes off.

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// ── the glass ───────────────────────────────────────────────────────────────────────────────────────────────────
export const CAUCHY = Object.freeze({ B: 0.0042 }); // µm², a common crown glass
const A_CAUCHY = 1.52 - CAUCHY.B / 0.5893 ** 2;
/** The refractive index of the glass at λ (nm): 1.534 for violet (400 nm), 1.52 for yellow, 1.516 for red (700 nm). */
export const indexAt = (nm) => A_CAUCHY + CAUCHY.B / (nm / 1000) ** 2;
/** The red filter in front of the lamp lets through red light: drawn as one wavelength. */
export const RED_NM = 650;
/** How many times wider the picture spreads the colours than real crown glass. */
export const SPREAD = 6;
/** The index the picture uses for λ in white light: the real one for red (650 nm), the difference from it SPREAD times larger. */
export const drawnIndex = (nm) => indexAt(RED_NM) + SPREAD * (indexAt(nm) - indexAt(RED_NM));

// ── the prism and the setting (cm; the table top is y = 0) ───────────────────────────────────────────────────────
export const PRISM = (() => {
  const side = 7;
  const baseY = 9.4; // the base lies on a small prism table this high
  const h = (side * Math.sqrt(3)) / 2;
  const left = { x: -side / 2, y: baseY };
  const right = { x: side / 2, y: baseY };
  const apex = { x: 0, y: baseY + h };
  return Object.freeze({ side, length: 7, baseY, h, left, right, apex, angle: 60 });
})();
/** Where the light meets the first face: this far up that face from the base's left corner. */
const ENTRY_AT = 0.42;
export const ENTRY = Object.freeze({
  x: PRISM.left.x + (PRISM.apex.x - PRISM.left.x) * ENTRY_AT,
  y: PRISM.left.y + (PRISM.apex.y - PRISM.left.y) * ENTRY_AT,
});
/** The lamp turns about the entry point on an arc this far out (to the front of its lens). */
export const ARC_R = 8.2;
/** The angle of incidence the student can set, and where it starts (red's least bending is near 49°). */
export const I_RANGE = Object.freeze([45, 66]);
export const I_START = 50;
export const clampI = (i) => Math.min(I_RANGE[1], Math.max(I_RANGE[0], Number.isFinite(+i) ? +i : I_START));
/** The white screen: a vertical card turned to face the prism and the camera. */
export const SCREEN = Object.freeze({
  at: { x: 15.2, z: 0 }, // where the ray plane meets the card's face
  yaw: 52, // its face turned this far from facing −x toward the camera (+z)
  bottom: 1.6,
  top: 14.2,
  half: 4.6, // half its width
});

// ── the faces, as lines with outward normals ────────────────────────────────────────────────────────────────────
function face(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy);
  // outward: away from the prism's middle
  const mx = (PRISM.left.x + PRISM.right.x + PRISM.apex.x) / 3;
  const my = (PRISM.left.y + PRISM.right.y + PRISM.apex.y) / 3;
  let nx = dy / l;
  let ny = -dx / l;
  if ((a.x - mx) * nx + (a.y - my) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  return Object.freeze({ a, b, nx, ny, len: l });
}
export const FACES = Object.freeze({
  first: face(PRISM.left, PRISM.apex),
  second: face(PRISM.apex, PRISM.right),
  base: face(PRISM.right, PRISM.left),
});

/** The incident direction for an angle of incidence i: up and to the right, as the book's ray from the lower left. */
export function incident(i) {
  const n = FACES.first;
  // the inward normal, turned by i toward the apex side (counter-clockwise)
  const a = Math.atan2(-n.ny, -n.nx) + rad(i);
  return { x: Math.cos(a), y: Math.sin(a) };
}
/** Where the lamp's lens is for an angle of incidence i (the beam leaves it toward the entry point). */
export function lampAt(i, r = ARC_R) {
  const d = incident(i);
  return { x: ENTRY.x - d.x * r, y: ENTRY.y - d.y * r };
}

/**
 * Snell's law at a face, the vector form. d: the unit direction of travel; nx, ny: the face's unit normal on the side the
 * light comes from; eta = n₁/n₂. Null: no ray goes through (total internal reflection).
 */
export function refract(d, nx, ny, eta) {
  const cosi = -(d.x * nx + d.y * ny);
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  const f = eta * cosi - Math.sqrt(k);
  const x = eta * d.x + f * nx;
  const y = eta * d.y + f * ny;
  const l = Math.hypot(x, y);
  return { x: x / l, y: y / l };
}
/** The angle (degrees, 0…90) between a ray and a face's normal line. */
const angleTo = (d, f) => deg(Math.acos(Math.min(1, Math.abs(d.x * f.nx + d.y * f.ny))));

/** Where a ray from p along d meets the segment of face f (s: how far along it, 0…1), or null. */
function hitFace(p, d, f) {
  const ex = f.b.x - f.a.x;
  const ey = f.b.y - f.a.y;
  const den = d.x * ey - d.y * ex;
  if (Math.abs(den) < 1e-12) return null;
  const qx = f.a.x - p.x;
  const qy = f.a.y - p.y;
  const t = (qx * ey - qy * ex) / den;
  const s = (qx * d.y - qy * d.x) / den;
  if (t <= 1e-9 || s < -1e-9 || s > 1 + 1e-9) return null;
  return { x: p.x + d.x * t, y: p.y + d.y * t, t, s };
}

/** The screen's face, as a line in the ray plane (x, z there is the same line seen from above): its unit normal toward the prism. */
export const SCREEN_NORMAL = Object.freeze({ x: -Math.cos(rad(SCREEN.yaw)), z: Math.sin(rad(SCREEN.yaw)) });
/** Where a ray in the plane z = 0 from p along d meets the screen (its x, y), or null if it misses the card. */
export function onScreen(p, d) {
  if (d.x <= 1e-6) return null;
  const x = SCREEN.at.x;
  const t = (x - p.x) / d.x;
  const y = p.y + d.y * t;
  return { x, y, t, onCard: y >= SCREEN.bottom && y <= SCREEN.top };
}

/**
 * The light through the prism for an angle of incidence i and an index n. Returns the points (entry, exit, on the
 * screen), the directions in, inside and out, the angles at each face (i₁, r₁ at the first; r₂ inside and e outside at
 * the second), how far it is turned from its first direction (δ, degrees, positive toward the base), and `ok: false`
 * when it does not leave by the second face.
 */
export function trace(i, n) {
  const din = incident(i);
  const f1 = FACES.first;
  const f2 = FACES.second;
  const inside = refract(din, f1.nx, f1.ny, 1 / n);
  const p0 = { x: ENTRY.x, y: ENTRY.y };
  const r1 = angleTo(inside, f1);
  const exit = hitFace(p0, inside, f2);
  if (!exit) return { ok: false, din, inside, entry: p0, i1: i, r1 };
  const out = refract(inside, -f2.nx, -f2.ny, n);
  const r2 = angleTo(inside, f2);
  if (!out) return { ok: false, din, inside, entry: p0, exit, i1: i, r1, r2 };
  const e = angleTo(out, f2);
  // turned clockwise (toward the base) from the first direction
  const delta = deg(Math.atan2(din.x * out.y - din.y * out.x, din.x * out.x + din.y * out.y)) * -1;
  const hit = onScreen(exit, out);
  return { ok: true, din, inside, out, entry: p0, exit, hit, i1: i, r1, r2, e, delta };
}

/** The textbook check: δ = i₁ + e − A. */
export const deviation = (i1, e, A = PRISM.angle) => i1 + e - A;

/** Where the original direction (আলোর মূল দিক) and the outgoing ray (drawn back) cross: the corner of the turning angle. */
export function turnCorner(tr) {
  const p = tr.entry;
  const d = tr.din;
  const q = tr.exit;
  const o = tr.out;
  const den = d.x * o.y - d.y * o.x;
  if (Math.abs(den) < 1e-9) return { x: q.x, y: q.y };
  const t = ((q.x - p.x) * o.y - (q.y - p.y) * o.x) / den;
  return { x: p.x + d.x * t, y: p.y + d.y * t };
}

// ── colours (as the sister figure light-spectrum: the CIE 1931 2° observer, every 10 nm from 380 nm) ─────────────
const FROM = 380;
const STEP = 10;
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
];
function observer(nm) {
  if (!(nm >= FROM && nm <= FROM + STEP * (CIE.length - 1))) return [0, 0, 0];
  const f = (nm - FROM) / STEP;
  const i = Math.min(CIE.length - 2, Math.floor(f));
  const k = f - i;
  return [0, 1, 2].map((c) => CIE[i][c] + (CIE[i + 1][c] - CIE[i][c]) * k);
}
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const VISIBLE = Object.freeze([400, 700]);
/** How bright λ shows on the screen, 0…1: fading out at the book's two ends (light-spectrum's curve). */
export function glow(nm) {
  const f = smooth(VISIBLE[0] - 4, 424, nm) * (1 - smooth(672, VISIBLE[1] + 4, nm));
  return f ** 0.6;
}
/** The hue of λ at full strength, linear sRGB 0…1 (XYZ to sRGB, cut at zero, a touch of white). */
export function hue(nm) {
  const [x, y, z] = observer(Math.min(690, Math.max(415, nm)));
  const c = [3.2406 * x - 1.5372 * y - 0.4986 * z, -0.9689 * x + 1.8758 * y + 0.0415 * z, 0.0557 * x - 0.204 * y + 1.057 * z];
  const up = c.map((v) => Math.max(0, v));
  const top = Math.max(up[0], up[1], up[2]) || 1;
  const grey = (up[0] + up[1] + up[2]) / (3 * top);
  const lin = up.map((v) => (v / top) * 0.86 + grey * 0.14);
  const m = Math.max(...lin) || 1;
  return lin.map((v) => v / m);
}
const toSRGB = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const hex = (v) =>
  Math.round(Math.min(1, Math.max(0, v)) * 255)
    .toString(16)
    .padStart(2, '0');
/** The colour of λ at full strength as #rrggbb. */
export function cssColour(nm) {
  const c = hue(nm);
  return `#${hex(toSRGB(c[0]))}${hex(toSRGB(c[1]))}${hex(toSRGB(c[2]))}`;
}

/** The book's colours, in light-spectrum's order and bands; `nm` is the one drawn for each. */
export const COLOURS = Object.freeze([
  { id: 'violet', nm: 420 },
  { id: 'blue', nm: 470 },
  { id: 'green', nm: 530 },
  { id: 'yellow', nm: 580 },
  { id: 'orange', nm: 605 },
  { id: 'red', nm: 660 },
]);
/** The wavelengths the white light is drawn with, short to long. */
export const FAN_NM = Object.freeze(Array.from({ length: 25 }, (_, k) => 400 + (300 * k) / 24));

/** Rounded for the panel: n to three places, angles to whole degrees. */
export const round3 = (x) => Math.round(x * 1000) / 1000;
export const round0 = (x) => Math.round(x);
