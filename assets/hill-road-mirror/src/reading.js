// The optics and the plan of the bend, in metres, as pure functions (unit-tested in test/unit/hill-road-mirror.test.mjs).
//
// The plan: y is up; the car comes north (−z) up the south road, the bus comes west (−x) down the east road. The two
// straight centre lines would cross at (0, 0); the bend between them is an arc round (BEND.r, BEND.r) and the hill stands
// inside it. Traffic keeps left, as in Bangladesh, and both drivers sit on the right of their vehicles. Because the road
// is rounded, the two drivers' straight-ahead lines cross just outside its outer edge: the mirror's pole stands there, so
// each driver looks straight at it and a ray along one road turns exactly into the other.

export const rad = (d) => (d * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;

export const BEND = { r: 12, half: 3.2 }; // the centre line's radius, half the road's width
export const LANE = 1.6; // a lane's centre from the road's centre line
export const CAR = { eyeRight: 0.36, eyeUp: 1.15, eyeBack: 1.9, length: 4.3, width: 1.75 }; // from the car's front centre
export const BUS = { eyeRight: 0.62, eyeUp: 2.35, eyeBack: 0.75, length: 9.5, width: 2.5 };
/** The mirror's centre: where the drivers' two lines cross. It looks along NORMAL, 45° to both roads. */
export const MIRROR = { x: -LANE + CAR.eyeRight, y: 1.8, z: LANE - BUS.eyeRight, radius: 0.8, rho: 5 };
export const NORMAL = { x: Math.SQRT1_2, y: 0, z: Math.SQRT1_2 };
export const TANGENT = { x: Math.SQRT1_2, y: 0, z: -Math.SQRT1_2 }; // along the mirror's face, level
export const FOCAL_CONVEX = -MIRROR.rho / 2; // f = r/2, negative for a convex mirror (the book's sign)

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a, b, k = 1) => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });
const unit = (a) => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};

/** The direction after a mirror with unit normal n: d − 2(d·n)n. */
export function reflect(d, n) {
  const k = 2 * dot(d, n);
  return { x: d.x - k * n.x, y: d.y - k * n.y, z: d.z - k * n.z };
}
/** The mirror image of a point in the plane through `on` with unit normal n. */
export function imageIn(p, n, on = MIRROR) {
  const k = 2 * dot(sub(p, on), n);
  return { x: p.x - k * n.x, y: p.y - k * n.y, z: p.z - k * n.z };
}
/** The car driver's eye with the car's nose at z. */
export const carEye = (noseZ) => ({ x: MIRROR.x, y: CAR.eyeUp, z: noseZ + CAR.eyeBack });
/** The bus driver's eye with the bus's nose at x. */
export const busEye = (noseX) => ({ x: noseX + BUS.eyeBack, y: BUS.eyeUp, z: MIRROR.z });

/**
 * The real path of light between two points by way of the plane mirror (the mirror image of one, joined to the other):
 * P, where it strikes, and the angles measured from the normal at P.
 * @param {number} [yaw] how far, in degrees, the mirror is turned from 45° (the test's wrongly set mirror)
 */
export function path(a, b, yaw = 0) {
  const n = turned(NORMAL, yaw);
  const b2 = imageIn(b, n);
  const d = sub(b2, a);
  const k = dot(sub(MIRROR, a), n) / dot(d, n);
  const P = add(a, d, k);
  const thetaI = deg(Math.acos(Math.abs(dot(unit(sub(a, P)), n))));
  const thetaR = deg(Math.acos(Math.abs(dot(unit(sub(b, P)), n))));
  const turn = 180 - deg(Math.acos(dot(unit(sub(a, P)), unit(sub(b, P)))));
  return { P, thetaI, thetaR, turn };
}
/** A level direction turned about the vertical, degrees (positive: x toward −z). */
export function turned(v, a) {
  const c = Math.cos(rad(a));
  const s = Math.sin(rad(a));
  return { x: v.x * c + v.z * s, y: v.y, z: v.z * c - v.x * s };
}

/** The surface normal of the convex mirror at a point offset (t along TANGENT, v up) from its centre. */
export function convexNormal(t, v, rho = MIRROR.rho) {
  const w = Math.sqrt(rho * rho - t * t - v * v);
  return unit({ x: (NORMAL.x * w + TANGENT.x * t) / rho, y: v / rho, z: (NORMAL.z * w + TANGENT.z * t) / rho });
}
/** The point of the mirror's face at offset t along TANGENT (at the centre's height), convex or plane. */
export function facePoint(t, convex, rho = MIRROR.rho) {
  const sag = convex ? rho - Math.sqrt(rho * rho - t * t) : 0;
  return { x: MIRROR.x + TANGENT.x * t - NORMAL.x * sag, y: MIRROR.y, z: MIRROR.z + TANGENT.z * t - NORMAL.z * sag };
}

/**
 * What the eye reaches through the mirror, on the level: the rays that leave the two edges of the mirror after
 * reflection. { a, b }: each { from, dir }, in the ground's plan (dir level and unit). The edge rays are traced exactly;
 * for the plane mirror they meet at the eye's image.
 */
export function fieldOfView(eye, convex) {
  const edge = (t) => {
    const P = facePoint(t, convex);
    const n = convex ? convexNormal(t, 0) : NORMAL;
    const d = reflect(unit({ x: P.x - eye.x, y: 0, z: P.z - eye.z }), n);
    return { from: P, dir: unit({ x: d.x, y: 0, z: d.z }) };
  };
  return { a: edge(MIRROR.radius), b: edge(-MIRROR.radius) };
}
/** The field's whole angle, degrees. */
export function fieldAngle(eye, convex) {
  const { a, b } = fieldOfView(eye, convex);
  return deg(Math.acos(Math.min(1, a.dir.x * b.dir.x + a.dir.z * b.dir.z)));
}
/** Is the point (x, z) inside the field? */
export function inField(field, x, z) {
  const side = (e) => e.dir.x * (z - e.from.z) - e.dir.z * (x - e.from.x);
  return side(field.a) * side(field.b) <= 0 && (x - MIRROR.x) * NORMAL.x + (z - MIRROR.z) * NORMAL.z > 0;
}
/** The width of the field at the distance x along the east road (the width of road the mirror shows), metres. */
export function fieldWidthAt(field, x) {
  const at = (e) => e.from.z + (e.dir.z / e.dir.x) * (x - e.from.x);
  return Math.abs(at(field.a) - at(field.b));
}

/** The mirror formula 1/u + 1/v = 1/f: the image distance (negative: behind the mirror). */
export function imageDistance(u, f) {
  return 1 / (1 / f - 1 / u);
}
/** The magnification m = |v/u| = l′/l. */
export function magnification(u, f) {
  return Math.abs(imageDistance(u, f) / u);
}
/**
 * How wide the mirror holds an object `width` metres wide, u metres from the mirror, in the eye `e` metres away, as a
 * fraction of the mirror's width seen from there.
 * Plane mirror: the image stands u behind it, its full size. Convex: v behind it (f < 0), m times the size.
 */
export function shareOfMirror(width, u, e, convex) {
  const v = convex ? Math.abs(imageDistance(u, FOCAL_CONVEX)) : u;
  const size = convex ? width * magnification(u, FOCAL_CONVEX) : width;
  return ((size / (e + v)) * e) / (2 * MIRROR.radius * Math.SQRT1_2);
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
