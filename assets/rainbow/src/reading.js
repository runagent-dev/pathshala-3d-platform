// The physics of the page, as pure functions (unit-tested in test/unit/rainbow.test.mjs). Nothing here touches the 3D.
//
// Water's refractive index depends on the colour (dispersion). The book gives no numbers, so the figure uses typical
// values for water at about 20 °C, from a two-term Cauchy fit n(λ) = A + B/λ² to measured values (656 nm: 1.3311,
// 589 nm: 1.3330, 486 nm: 1.3371, 405 nm: 1.3428). A ray of sunlight is traced through a round drop exactly: Snell's
// law where it goes in, a reflection at the back, Snell's law where it comes out. Seen from the eye, the colours come
// back at about 42° (red) to 40.5° (violet) from the point opposite the sun, so a drop at 42° sends red to the eye and
// one at 40.5° sends violet: red is outside, violet inside. The light meets the back of the drop at about 40°, below
// water's critical angle (48.6°): it is an ordinary, partial reflection; some light goes on out of the back.

const DEG = Math.PI / 180;
export const toDeg = (rad) => rad / DEG;
export const toRad = (deg) => deg * DEG;

// ── water ──────────────────────────────────────────────────────────────────────────────────────────────────────
export const CAUCHY = Object.freeze({ A: 1.324, B: 3100 }); // B in nm²
/** Water's refractive index for light of wavelength nm (typical, about 20 °C). */
export const nWater = (nm) => CAUCHY.A + CAUCHY.B / (nm * nm);
/** The critical angle of water to air (degrees). */
export const criticalDeg = (n = 1.333) => toDeg(Math.asin(1 / n));

/** The seven colours of the bow, outside to inside (the book's own order in the band is not printed; this is nature's). */
export const COLOURS = Object.freeze([
  { id: 'red', nm: 660, css: '#e8262a' },
  { id: 'orange', nm: 610, css: '#ff7a1a' },
  { id: 'yellow', nm: 580, css: '#ffd21f' },
  { id: 'green', nm: 530, css: '#2fbf4a' },
  { id: 'cyan', nm: 490, css: '#22b8e6' },
  { id: 'blue', nm: 455, css: '#3b5bdb' },
  { id: 'violet', nm: 410, css: '#8a3ffc' },
]);
export const RED = COLOURS[0];
export const VIOLET = COLOURS[COLOURS.length - 1];

// ── one ray through a round drop (2D: the plane of the sun, the drop and the eye) ───────────────────────────────
// The drop is a circle of radius 1 at the origin. Sunlight comes along +x; b is how far above the centre the ray is
// aimed (0 … 1). y is up.

/** Refraction of the unit direction d at a surface with unit normal m (pointing back toward where d came from). */
export function refract(d, m, eta) {
  const cosi = -(d.x * m.x + d.y * m.y);
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null; // total internal reflection
  const a = eta * cosi - Math.sqrt(k);
  return norm({ x: eta * d.x + a * m.x, y: eta * d.y + a * m.y });
}
/** Mirror reflection of d at a surface with unit normal m. */
export function reflect(d, m) {
  const k = 2 * (d.x * m.x + d.y * m.y);
  return { x: d.x - k * m.x, y: d.y - k * m.y };
}
function norm(v) {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
}
/** From a point p inside the unit circle along unit d: where it meets the circle again. */
function chord(p, d) {
  const b = p.x * d.x + p.y * d.y;
  const c = p.x * p.x + p.y * p.y - 1;
  const s = -b + Math.sqrt(Math.max(0, b * b - c));
  return { x: p.x + d.x * s, y: p.y + d.y * s };
}

/**
 * The primary-bow path for refractive index n and aim b: entry point p1, back point p2, exit point p3, the directions
 * in (d0), inside (d1, d2) and out (d3); the angle of incidence i and of refraction r (degrees); the angle at the
 * back (= r, below the critical angle); and theta, the angle between the light that comes out and the direction back
 * toward the sun (the rainbow angle seen from the eye).
 */
export function trace(n, b) {
  const d0 = { x: 1, y: 0 };
  const p1 = { x: -Math.sqrt(Math.max(0, 1 - b * b)), y: b };
  const m1 = { x: p1.x, y: p1.y }; // outward normal at p1, toward the sun's side
  const d1 = refract(d0, m1, 1 / n);
  const p2 = chord(p1, d1);
  const m2 = { x: -p2.x, y: -p2.y }; // inward normal at p2
  const d2 = reflect(d1, m2);
  const p3 = chord(p2, d2);
  const m3 = { x: -p3.x, y: -p3.y }; // inward normal at p3: the light goes out against it
  const d3 = refract(d2, m3, n);
  const out = refract(d1, m2, n); // the part of the light that goes on out of the back
  const i = toDeg(Math.asin(b));
  const r = toDeg(Math.asin(b / n));
  const theta = toDeg(Math.acos(Math.max(-1, Math.min(1, -(d3.x * d0.x + d3.y * d0.y)))));
  return { p1, p2, p3, d0, d1, d2, d3, out, i, r, back: r, theta };
}

/** The aim b that gives the least turning (the rainbow ray), for index n: cos² i = (n² − 1) / 3. */
export const rainbowAim = (n) => Math.sin(Math.acos(Math.sqrt((n * n - 1) / 3)));
/** The rainbow angle for index n (degrees): 4r − 2i at the rainbow ray. */
export function rainbowDeg(n) {
  const i = Math.acos(Math.sqrt((n * n - 1) / 3));
  const r = Math.asin(Math.sin(i) / n);
  return toDeg(4 * r - 2 * i);
}
/** The rainbow angle of each colour, typical (degrees). */
export const ANGLE = Object.freeze(Object.fromEntries(COLOURS.map((c) => [c.id, rainbowDeg(nWater(c.nm))])));
export const THETA_RED = ANGLE.red; // ≈ 42.3°
export const THETA_VIOLET = ANGLE.violet; // ≈ 40.6°

// ── the drawing of one big drop ────────────────────────────────────────────────────────────────────────────────
// In one real drop the colours part by less than 2°: drawn exactly, they would lie on one line. The big drop is drawn
// with the difference between the colours' indices made SPREAD times bigger (still traced with Snell's law), and the
// panel says so; the angles the figure names (42°, 40°) are the true ones, from the true indices.
export const SPREAD = 12;
export const N_MID = 1.3333;
export const drawnIndex = (nm) => N_MID + SPREAD * (nWater(nm) - N_MID);
/** One white ray aimed where the middle colour turns least. */
export const AIM = rainbowAim(N_MID);
/** The paths drawn in the big drop, one per colour, red first. */
export const DROP_PATHS = Object.freeze(COLOURS.map((c) => ({ ...c, ...trace(drawnIndex(c.nm), AIM) })));

// ── the sky ────────────────────────────────────────────────────────────────────────────────────────────────────
// The eye looks along +z; the sun is behind it (−z), `sun` degrees above the horizon. The point opposite the sun is
// `sun` degrees below the horizon in front. A drop seen at angle θ from that point, straight above it, is θ − sun
// degrees above the horizon. Everything in degrees.

/** How high the top of the band of colour θ stands above the horizon (degrees; negative: below it). */
export const topDeg = (sunDeg, theta = THETA_RED) => theta - sunDeg;
/** Can a rainbow be seen at all with the sun this high? Only while the red top is above the horizon. */
export const bowVisible = (sunDeg) => topDeg(sunDeg, THETA_RED) > 0;
/**
 * How far round the bow is above the horizon: the half-angle φ (degrees) of the arc of colour θ about its top, when the
 * horizon is level with the eye. 180: a full circle; 0: none.
 */
export function halfArcDeg(sunDeg, theta = THETA_RED) {
  const c = Math.tan(toRad(sunDeg)) / Math.tan(toRad(theta)); // cos φ at the horizon: cos θ sin α = sin θ cos φ cos α
  if (c >= 1) return 0;
  if (c <= -1) return 180;
  return toDeg(Math.acos(c));
}

/** The sun's height the student can set (degrees). */
export const SUN = Object.freeze({ min: 5, max: 70, start: 15, noon: 60 });
export const clampSun = (deg) => Math.min(SUN.max, Math.max(SUN.min, Number.isFinite(+deg) ? +deg : SUN.start));

/** Rounded to whole degrees, as the figure says them. */
export const wholeDeg = (x) => Math.round(x);

/** Answers for "how high is the top of the bow", the right one first: θ − α, θ, θ + α, α. */
export function heightChoices(sunDeg) {
  const right = wholeDeg(topDeg(sunDeg));
  const list = [right, wholeDeg(THETA_RED), wholeDeg(THETA_RED + sunDeg), wholeDeg(sunDeg)];
  return list.map((v, k) => ({ v, key: ['right', 'theta', 'sum', 'sun'][k] }));
}
