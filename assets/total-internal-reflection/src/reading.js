// The physics of the figure (book pages 248–251, topic 9.2), pure functions, unit-tested in
// test/unit/total-internal-reflection.test.mjs. The book's letters for this section: the light starts in the DENSE
// medium, index n₂, at angle θ₂ from the normal, and leaves into the LIGHT medium, index n₁, at θ₁:
//   n₁ sin θ₁ = n₂ sin θ₂,  sin θc = n₁ / n₂.
// Everything lies in the face of the optical disc, the plane z = Z_RAY, in centimetres, with the point of incidence O at
// the origin: x to the right, y up. The glass is below the flat face y = 0, the light medium above it.

/** The indices. Glass is 1.50: the value that gives the book's printed 41.8° (1/1.52 would give 41.1°; NOTES.md). */
export const N = { glass: 1.5, air: 1.0, water: 1.33 };
/** The book's example on p250–251: a medium of n = 1.45, light inside it at 75°. */
export const BOOK_75 = { n: 1.45, angle: 75 };

/** The apparatus (cm): the disc, the block, the source, the water cell, the prism; the plane of the light. */
export const DISC = { r: 13, thick: 0.5 };
export const BLOCK = { r: 5.5, thick: 2.4 };
export const Z_RAY = 0.1 + BLOCK.thick / 2; // the block stands 1 mm off the disc's face
export const SOURCE = { r: 10.6, len: 3.0 }; // the slit of the ray box is SOURCE.r − len/2 from O
export const SLIT = SOURCE.r - SOURCE.len / 2;
export const RAY_END = DISC.r - 0.7; // the light is followed to here, on the disc's face
export const CELL = { r: 5.5, wall: 0.18 };
export const PRISM = { leg: 7 }; // a 45°–45°–90° prism, its long face through O
export const ANGLE = { min: 0, max: 80 }; // how far the source turns (θ₂, degrees)
/** θ₂ at each step (the source's place): the book's three cases, its 45° (চিত্র ৯.০৭ and the water example), the prism. */
export const STEP_ANGLE = { intro: 30, less: 30, critical: null, more: 60, water: 45, prism: 0 };
export const STEPS = ['less', 'critical', 'more', 'water', 'prism'];

const RAD = Math.PI / 180;
export const rad = (d) => d * RAD;
export const deg = (r) => r / RAD;
/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** n of the light medium outside the flat face. */
export const outsideN = (outside) => (outside === 'water' ? N.water : N.air);

/** The critical angle (degrees) from the dense medium n2 into the light medium n1: sin θc = n₁ / n₂. */
export const criticalAngle = (n1 = N.air, n2 = N.glass) => (n1 >= n2 ? 90 : deg(Math.asin(n1 / n2)));

/** The critical angle as the panel says it, to a tenth: 41.8° in air, 62.5° in water. */
export const thetaC = (outside = 'air') => round(criticalAngle(outsideN(outside), N.glass), 1);

/** The angle of refraction θ₁ (degrees), or null when there is none (θ₂ > θc). Exactly 90 at θc as shown. */
export function refracted(theta2, n1 = N.air, n2 = N.glass) {
  const s = (n2 * Math.sin(rad(theta2))) / n1;
  if (s > 1 + 1e-9) return null;
  return deg(Math.asin(Math.min(1, s)));
}

/**
 * Fresnel's equations for unpolarised light going from n2 (inside) into n1 (outside) at θ₂: the part reflected, 0…1.
 * 1 at and beyond the critical angle. (The chapter's `reflection-amount` uses the same equations from the other side.)
 */
export function reflectance(theta2, n1 = N.air, n2 = N.glass) {
  const ci = Math.cos(rad(theta2));
  const st = (n2 / n1) * Math.sin(rad(theta2));
  if (st >= 1) return 1;
  const ct = Math.sqrt(1 - st * st);
  const rs = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
  const rp = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct);
  return (rs * rs + rp * rp) / 2;
}

/** The angle the panel shows: whole degrees, except the critical angle itself (to a tenth). */
export const shownAngle = (a) => (Math.abs(a - Math.round(a)) < 1e-6 ? Math.round(a) : round(a, 1));

/**
 * Where a drag lands: whole degrees in range, but within half a degree of θc it takes θc exactly (to a tenth), so the
 * student can stop on the critical angle.
 */
export function snapAngle(a, outside = 'air') {
  const c = thetaC(outside);
  const x = Math.min(ANGLE.max, Math.max(ANGLE.min, Number.isFinite(+a) ? +a : 30));
  if (Math.abs(x - c) <= 0.5) return c;
  return Math.round(x);
}
/** One key press: to the next whole degree, stopping at θc on the way. */
export function stepAngle(a, dir, outside = 'air') {
  const c = thetaC(outside);
  const next = dir > 0 ? Math.floor(a + 1e-6) + 1 : Math.ceil(a - 1e-6) - 1;
  if ((dir > 0 && a < c - 1e-6 && next > c) || (dir < 0 && a > c + 1e-6 && next < c)) return c;
  return Math.min(ANGLE.max, Math.max(ANGLE.min, next));
}

/** Which of the book's three cases (চিত্র ৯.০৬) an angle is: 'less' | 'critical' | 'more'. */
export function caseOf(theta2, outside = 'air') {
  const c = thetaC(outside);
  if (Math.abs(theta2 - c) < 0.05) return 'critical';
  return theta2 < c ? 'less' : 'more';
}

/**
 * The state of the light at θ₂: θ₁ (null if none), the reflected and refracted shares (0…1, refracted 0 at θc and
 * beyond) and the case. At θc exactly the book draws the refracted ray along the surface; it carries next to nothing.
 */
export function lightAt(theta2, outside = 'air') {
  const n1 = outsideN(outside);
  const kase = caseOf(theta2, outside);
  const t1 = kase === 'critical' ? 90 : kase === 'more' ? null : refracted(theta2, n1, N.glass);
  const R = kase === 'less' ? reflectance(theta2, n1, N.glass) : 1;
  return { theta2, theta1: t1, R, T: 1 - R, kase, thetaC: thetaC(outside) };
}

/** A unit vector at angle a (degrees) from the downward normal, toward the lower left: where the incoming light is from. */
export const fromDir = (a) => ({ x: -Math.sin(rad(a)), y: -Math.cos(rad(a)) });

/**
 * Every point of the drawing at θ₂ (cm, in the plane of the light): the slit, where the light meets the curved face, O,
 * the reflected ray to the curved face and on to the disc's rim, the refracted ray (to the cell's wall in water) and on.
 */
export function points(theta2, outside = 'air') {
  const L = lightAt(theta2, outside);
  const u = fromDir(theta2);
  const at = (r, d) => ({ x: d.x * r, y: d.y * r });
  const back = { x: -u.x, y: u.y }; // the reflected ray: mirror image of the incoming one in the normal
  const p = {
    slit: at(SLIT, u),
    entry: at(BLOCK.r, u),
    o: { x: 0, y: 0 },
    reflExit: at(BLOCK.r, back),
    reflEnd: at(RAY_END, back),
    refrDir: null,
    refrWall: null,
    refrEnd: null,
  };
  if (L.theta1 != null) {
    const d = { x: Math.sin(rad(L.theta1)), y: Math.cos(rad(L.theta1)) };
    p.refrDir = d;
    p.refrWall = at(CELL.r, d);
    p.refrEnd = at(RAY_END, d);
  }
  return { ...L, ...p };
}

/**
 * The prism (চিত্র ৯.০৭): its corners (the right angle at the lower right, the long face through O from the lower left
 * to the upper right) and the light from the source straight below: up into the bottom face, onto the long face at 45°,
 * turned by 90°, out of the upright face to the right.
 */
export function prismPath() {
  const h = PRISM.leg / 2;
  return {
    corners: [
      { x: -h, y: -h },
      { x: h, y: -h },
      { x: h, y: h },
    ],
    slit: { x: 0, y: -SLIT },
    enter: { x: 0, y: -h },
    o: { x: 0, y: 0 },
    exit: { x: h, y: 0 },
    end: { x: RAY_END, y: 0 },
    incidence: 45,
    turned: 90,
  };
}

/** The book's 75° example: n sin 75° = 1.40 > 1, so no refraction; θc = 43.6°. */
export const book75 = () => ({
  sinTheta: round(BOOK_75.n * Math.sin(rad(BOOK_75.angle)), 2),
  thetaC: round(criticalAngle(1, BOOK_75.n), 1),
});

/** Shuffled copy (the test harness seeds Math.random). */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
