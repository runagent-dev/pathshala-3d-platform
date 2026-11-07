// The optics of the periscope and the binoculars (book page 254, topic 9.3.3, with 9.2's critical angle), in
// centimetres, pure functions (unit-tested in test/unit/prism-periscope.test.mjs). Every ray is traced: a face it
// crosses square-on does not bend it; at a prism's long face (the hypotenuse) the angle of incidence is worked out from
// the face's normal and compared with the critical angle, and the ray is reflected by the law of reflection. Nothing is
// drawn from a guess.

/** Glass and air (the book's 9.2: θc = 41.8°, which n = 1.5 gives exactly; see NOTES.md). Water for the test's note. */
export const N = { glass: 1.5, air: 1.0, water: 1.33 };

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);
const DEG = 180 / Math.PI;

/** The critical angle (degrees) from a dense medium n2 into a light one n1: sin θc = n1 / n2 (the book's formula). */
export function criticalAngle(n2 = N.glass, n1 = N.air) {
  return n1 >= n2 ? Number.NaN : Math.asin(n1 / n2) * DEG;
}

/** The angle (degrees, 0…90) between a ray's direction d and a face's normal n (any sign; 2D or 3D). */
export function incidence(d, n) {
  const dot = Math.abs(d.x * n.x + d.y * n.y + (d.z ?? 0) * (n.z ?? 0));
  const ld = Math.hypot(d.x, d.y, d.z ?? 0);
  const ln = Math.hypot(n.x, n.y, n.z ?? 0);
  return Math.acos(Math.min(1, dot / (ld * ln))) * DEG;
}

/** The law of reflection: d − 2 (d·n̂) n̂ (n need not be unit length). */
export function reflect(d, n) {
  const ln2 = n.x * n.x + n.y * n.y + (n.z ?? 0) ** 2;
  const k = (2 * (d.x * n.x + d.y * n.y + (d.z ?? 0) * (n.z ?? 0))) / ln2;
  return { x: d.x - k * n.x, y: d.y - k * n.y, z: (d.z ?? 0) - k * (n.z ?? 0) };
}

/** Total internal reflection at a glass–air face: the angle of incidence is larger than the critical angle. */
export const isTotal = (angle, n2 = N.glass, n1 = N.air) => angle > criticalAngle(n2, n1);

// ── the periscope (the light runs in the plane z = 0; the table top is y = 0) ─────────────────────────────────────
/** The scene: a low brick wall, a flower behind it, the periscope on this side of it, the eye at its bottom window. */
export const SCENE = {
  wall: { x0: -15, x1: -11, top: 22, z: 16 }, // the wall's faces (x), its top (y) and half its length (z)
  flower: { x: -30, y: 27, r: 3.6 }, // the flower's head: its centre and radius
  eyeX: 10.6, // where the eye is, in front of the bottom window
};
/** The periscope: the prisms' legs (L), the lower prism's centre (the eye's height), and how far the head slides. */
export const PERI = {
  L: 5, // the right-angle prisms' legs (cm); both are 45°-45°-90°
  depth: 5, // their thickness (z)
  low: 4.6, // the bottom window's centre: the lower prism's centre and the eye's height
  outer: 3.7, // half the width of the fixed lower tube
  inner: 3.15, // half the width of the sliding head
  outerTop: 17.2, // the top of the fixed tube
  headLen: 16.4, // the sliding head's length
  ywMin: 19.8, // the top window's centre, head down (below the wall's top: it looks at the wall)
  ywMax: 27, // head up: level with the flower
};
/** The top window's height (cm) for the head's place k (0 down … 1 up). */
export const headY = (k) => PERI.ywMin + (PERI.ywMax - PERI.ywMin) * Math.min(1, Math.max(0, k));
/** The head's place (0…1) for a top-window height. */
export const headK = (yw) => (yw - PERI.ywMin) / (PERI.ywMax - PERI.ywMin);

/**
 * The light that reaches the eye through the periscope with its top window at height yw: where it comes from (the
 * wall's face while the window is below the wall's top, else the flower: its head when level with it, its stem below
 * that), the faces it crosses and the two reflections, each with its angle of incidence and whether it is total.
 */
export function periscopePath(yw) {
  const { L, low } = PERI;
  const half = L / 2;
  const { wall, flower, eyeX } = SCENE;
  const seen = yw > wall.top ? 'flower' : 'wall';
  const from = seen === 'wall' ? { x: wall.x1, y: yw } : { x: flower.x, y: yw };
  // the upper prism: right angle at its bottom-left; the hypotenuse runs from top-left to bottom-right
  const nUp = { x: 1, y: 1 }; // its normal (out of the glass)
  const d0 = { x: 1, y: 0 };
  const hit1 = { x: 0, y: yw }; // a ray through the window's centre meets the hypotenuse over the prism's middle
  const a1 = incidence(d0, nUp);
  const d1 = reflect(d0, nUp);
  // the lower prism: right angle at its top-right; the hypotenuse again from top-left to bottom-right
  const nLow = { x: -1, y: -1 };
  const hit2 = { x: hit1.x, y: low };
  const a2 = incidence(d1, nLow);
  const d2 = reflect(d1, nLow);
  const points = [
    from,
    { x: -half, y: yw },
    hit1,
    { x: hit1.x, y: yw - half },
    { x: hit1.x, y: low + half },
    hit2,
    { x: half, y: low },
    { x: eyeX, y: low },
  ];
  return {
    seen,
    points,
    hits: [hit1, hit2],
    angles: [a1, a2],
    total: [isTotal(a1), isTotal(a2)],
    turns: [turn(d0, d1), turn(d1, d2)],
    out: d2,
  };
}

/** The angle (degrees) a ray turns through from direction a to direction b. */
export function turn(a, b) {
  const dot = a.x * b.x + a.y * b.y + (a.z ?? 0) * (b.z ?? 0);
  return Math.acos(Math.max(-1, Math.min(1, dot / (Math.hypot(a.x, a.y, a.z ?? 0) * Math.hypot(b.x, b.y, b.z ?? 0))))) * DEG;
}

/**
 * The flower's light on the straight line toward the eye: where it meets the wall's far face (the flower's side), and
 * whether the wall stops it there (below the wall's top).
 */
export function blockedLight() {
  const { wall, flower, eyeX } = SCENE;
  const k = (wall.x0 - flower.x) / (eyeX - flower.x);
  const y = flower.y + (PERI.low - flower.y) * k;
  return { from: { x: flower.x, y: flower.y }, at: { x: wall.x0, y }, blocked: y < wall.top };
}

// ── the binoculars (one barrel, Porro prisms) ─────────────────────────────────────────────────────────────────
/**
 * One barrel in its own frame: u along the barrel (the light goes +u from the objective lens at u = 0 to the eyepiece),
 * v up, w sideways (+w away from the hinge). Two right-angle prisms, the second turned a quarter turn about the barrel
 * from the first (Porro): A folds the light up (v), B folds it sideways (w). h: half the hypotenuse; s: how far the
 * light runs from the hypotenuse's middle; a, b: where the hypotenuses stand; e: the eyepiece.
 */
export const BINO = { h: 1.6, s: 1.0, t: 0.92, a: 7.2, b: 2.6, e: 11.5, front: -1.5, back: 12.7, wb: 3.5 };

/** The light's path through one barrel: points (u, v, w), the four reflections with their angles, and its length. */
export function binocularPath() {
  const { h, s, a, b, e, wb } = BINO;
  const wo = wb + s; // the objective's axis, outside
  const we = wb - s; // the eyepiece's axis, nearer the hinge
  const P = (u, v, w) => ({ x: u, y: v, z: w });
  const pts = [
    P(0, -s, wo),
    P(a, -s, wo),
    P(a + h - s, -s, wo),
    P(a + h - s, s, wo),
    P(a, s, wo),
    P(b, s, wo),
    P(b - (h - s), s, wo),
    P(b - (h - s), s, we),
    P(b, s, we),
    P(e, s, we),
  ];
  // the faces' normals at the four reflections (out of the glass): A's two legs, B's two legs
  const normals = [
    { x: 1, y: -1, z: 0 },
    { x: 1, y: 1, z: 0 },
    { x: -1, y: 0, z: 1 },
    { x: -1, y: 0, z: -1 },
  ];
  const at = [2, 3, 6, 7]; // which points are reflections
  let d = { x: 1, y: 0, z: 0 };
  const angles = [];
  const dirs = [d];
  for (let i = 0; i < 4; i++) {
    const n = normals[i];
    angles.push(incidence(d, n));
    d = reflect(d, n);
    dirs.push(d);
  }
  let length = 0;
  for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
  return { points: pts, at, angles, total: angles.map((x) => isTotal(x)), dirs, length, body: BINO.back - BINO.front };
}

/** The steps: the wall hides the flower; the periscope shows it; inside a prism (45° > θc); the binoculars. */
export const STEPS = ['wall', 'peri', 'prism', 'bino'];
