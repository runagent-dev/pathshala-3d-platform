// The optics of the figure, pure functions (unit-tested in test/unit/kaleidoscope.test.mjs). All in centimetres.
//
// The tube. Three strips of glass make a triangular tube, the eye on its axis at one end, the beads on thin paper at the
// other. A point of the end plane is written (u, v), measured from the axis as the eye sees it: u to the right, v up. The
// three walls are the planes p·n = r, and the three walls' reflections, again and again, cut the end plane into a lattice
// of equal triangles ("cells"): each cell is a picture of the real one, in the order the reflections made it.
//
// Everything follows from one fact. With c_j = (r − p·n_j) / 3r the three coordinates of a point (they add up to 1, and the
// real cell is where all three lie between 0 and 1), the lattice lines are the lines where a c_j is a whole number. So
// the number of reflections that makes a cell is the number of lattice lines between it and the real cell, Σ |⌊c_j⌋|.
// A ray from the eye to a point of a cell is a straight line in this unfolded picture; folding it back gives the real path.

const RAD = Math.PI / 180;
export const rad = (d) => d * RAD;
export const deg = (r) => r / RAD;
const C30 = Math.cos(rad(30));

const L = 15; // the strips' length
const SIDE = 4; // their width: the triangle's side
export const WINDOW = 10; // the eye sees 10 cells along each side of its view
/**
 * The tube. The eye stands e in front of the open end, so that what it sees of the end plane is the open end's triangle
 * blown up WINDOW times, exactly (L + e) / e = 10. A whole number 1 + 3k makes the window's edges fall on lattice lines.
 */
export const TUBE = { L, s: SIDE, e: L / (WINDOW - 1), r: SIDE / (2 * Math.sqrt(3)), h: (SIDE * Math.sqrt(3)) / 2 };
const { r: R, e: EYE } = TUBE;
const D = L + EYE; // from the eye to the end plane
export const WALLS = [
  { id: 'bottom', n: [0, -1] },
  { id: 'front', n: [C30, 0.5] }, // the eye's right; toward the viewer of the 3D view
  { id: 'back', n: [-C30, 0.5] },
];

export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
/** The three coordinates of a point. */
export const coords = (p) => WALLS.map((w) => (R - dot(p, w.n)) / (3 * R));
/** Reflects a point of the end plane in the line of a wall. */
export function reflect(p, j) {
  const n = WALLS[j].n;
  const k = 2 * (dot(p, n) - R);
  return [p[0] - k * n[0], p[1] - k * n[1]];
}
/** How many lattice lines of each of the three directions lie between a point and the real cell. */
export const crossings = (p) => coords(p).map((c) => Math.abs(Math.floor(c)));
/** How many reflections make the cell a point lies in. */
export const reflectionsAt = (p) => crossings(p).reduce((a, b) => a + b, 0);

/**
 * Folds a point back into the real cell: `point` is the real thing whose picture stands here, `word` the walls crossed on
 * the way back, nearest the point first.
 */
export function fold(p) {
  let q = p;
  const word = [];
  for (let i = 0; i < 200; i++) {
    const j = coords(q).findIndex((c) => c < -1e-9);
    if (j < 0) break;
    q = reflect(q, j);
    word.push(j);
  }
  return { point: q, word };
}
/** Where a real point's picture stands in a cell: the cell's word undone, innermost first. */
export function imageIn(p, word) {
  let q = p;
  for (let i = word.length - 1; i >= 0; i--) q = reflect(q, word[i]);
  return q;
}

/** The three corners of the real cell, in a fixed order: the top, then the back and front corners of the bottom. */
export const CORNERS = [
  [0, 2 * R],
  [-SIDE / 2, -R],
  [SIDE / 2, -R],
];
const keyOf = (p) => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`;
const inWindow = (p) => WALLS.every((w) => dot(p, w.n) <= WINDOW * R + 1e-6);
const centreOf = (v) => [(v[0][0] + v[1][0] + v[2][0]) / 3, (v[0][1] + v[1][1] + v[2][1]) / 3];

/**
 * The cells the eye can see: WINDOW² triangles, the real one first, then by reflections. `corners[i]` is which corner of
 * the real cell stands at `verts[i]`: a texture of the real cell laid on with those corners is exactly the reflected picture.
 */
export function lattice() {
  const out = new Map();
  const todo = [CORNERS];
  while (todo.length) {
    const verts = todo.pop();
    const c = centreOf(verts);
    const key = keyOf(c);
    if (out.has(key) || !inWindow(c)) continue;
    const { word } = fold(c);
    out.set(key, {
      verts,
      centre: c,
      word,
      n: word.length,
      crossings: crossings(c),
      corners: verts.map((v) => {
        const f = fold([v[0] * (1 - 1e-7) + c[0] * 1e-7, v[1] * (1 - 1e-7) + c[1] * 1e-7]).point;
        return CORNERS.findIndex((k) => Math.hypot(k[0] - f[0], k[1] - f[1]) < 1e-3);
      }),
    });
    for (let i = 0; i < 3; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % 3];
      const o = verts[(i + 2) % 3];
      // the third corner mirrored in the edge a–b
      const ex = b[0] - a[0];
      const ey = b[1] - a[1];
      const t = ((o[0] - a[0]) * ex + (o[1] - a[1]) * ey) / (ex * ex + ey * ey);
      todo.push([a, b, [2 * (a[0] + ex * t) - o[0], 2 * (a[1] + ey * t) - o[1]]]);
    }
  }
  return [...out.values()].sort((p, q) => p.n - q.n || Math.atan2(p.centre[1], p.centre[0]) - Math.atan2(q.centre[1], q.centre[0]));
}
/** The cell a point of the end plane lies in. */
export const cellAt = (cells, p) => cells.find((c) => keyOf(c.centre) === keyOf(fromFold(p))) ?? null;
function fromFold(p) {
  const { word } = fold(p);
  return imageIn([0, 0], word);
}

/** Fresnel's equations for unpolarised light from air into glass (as `reflection-amount`): the share one surface reflects. */
export const N_GLASS = 1.5;
export function fresnel(theta, n = N_GLASS) {
  if (theta >= 90) return 1;
  const c = Math.cos(rad(theta));
  const ct = Math.sqrt(1 - (1 - c * c) / (n * n));
  const rs = (c - n * ct) / (c + n * ct);
  const rp = (ct - n * c) / (ct + n * c);
  return (rs * rs + rp * rp) / 2;
}
export const percent = (theta) => Math.round(fresnel(theta) * 100);
/** The angle of incidence, at a lattice line of direction j, of the straight line from the eye to p in the end plane. */
export function incidence(p, j) {
  const cos = Math.abs(dot(p, WALLS[j].n)) / Math.hypot(D, p[0], p[1]);
  return deg(Math.acos(cos));
}
/** A strip has two faces, and both reflect: one surface's share R, and what comes back from the far face, 2R / (1 + R). */
export const stripShare = (theta) => {
  const r = fresnel(theta);
  return (2 * r) / (1 + r);
};
/**
 * The share of the light from a point of the end plane that reaches the eye: every crossing of a lattice line is one
 * reflection in a strip at that angle. `counts` is the cell's crossings (a corner of a cell lies on the lines themselves).
 */
export function brightness(p, counts = crossings(p)) {
  let b = 1;
  counts.forEach((k, j) => {
    if (k) b *= stripShare(incidence(p, j)) ** k;
  });
  return b;
}

/**
 * The path of the light from a real point on the end plane, through a cell's picture of it, to the eye. Returns the hits in
 * the order the light meets them (each with the wall and the angle), the eye-side hit first in `fromEye`, and the image.
 * x runs along the axis, 0 at the open end, L at the end plane; a point of a path is [x, u, v].
 */
export function path(p, word) {
  const image = imageIn(p, word);
  const c0 = coords([0, 0]);
  const c1 = coords(image);
  const ts = [];
  for (let j = 0; j < 3; j++) {
    const lo = Math.min(c0[j], c1[j]);
    const hi = Math.max(c0[j], c1[j]);
    for (let k = Math.ceil(lo); k <= hi; k++) ts.push((k - c0[j]) / (c1[j] - c0[j]));
  }
  ts.sort((a, b) => a - b);
  const fromEye = ts.map((t) => {
    const q = [image[0] * t, image[1] * t];
    const f = fold([q[0] * (1 - 1e-9), q[1] * (1 - 1e-9)]).point;
    const wall = WALLS.findIndex((w) => Math.abs(dot(f, w.n) - R) < 1e-6);
    return { x: -EYE + t * D, p: f, wall };
  });
  const points = [[L, p[0], p[1]], ...[...fromEye].reverse().map((h) => [h.x, h.p[0], h.p[1]]), [-EYE, 0, 0]];
  const hits = [...fromEye].reverse().map((h, i) => {
    const a = points[i];
    const b = points[i + 1];
    const dir = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const len = Math.hypot(...dir);
    const n = WALLS[h.wall].n;
    return { ...h, theta: deg(Math.acos(Math.abs(dir[1] * n[0] + dir[2] * n[1]) / len)) };
  });
  return { points, hits, fromEye, image };
}

// ── one strip of glass, seen at any angle (the student moves the eye) ───────────────────────────────────────────────────
// The plane of the picture: a along the strip, b out of it, the glass's front at b = 0. The bead stands at (a0, b0) and the
// eye always lies on a straight line from the image through the glass, as it must, a fixed way from the glass along it.
export const STRIP = { half: 9, height: 4.6, thick: 0.4, a0: -6.5, b0: 0.7, reach: 6, min: 5, max: 84, ray: 2.4 };
export function stripView(theta) {
  const { a0, b0, reach } = STRIP;
  const t = rad(theta);
  const inside = Math.asin(Math.sin(t) / N_GLASS);
  const hit = [a0 + b0 * Math.tan(t), 0];
  const eye = [hit[0] + reach * Math.sin(t), reach * Math.cos(t)];
  const back = [hit[0] + STRIP.thick * Math.tan(inside), -STRIP.thick];
  const away = [back[0] + 4.5 * Math.sin(t), back[1] - 4.5 * Math.cos(t)];
  return { theta, bead: [a0, b0], image: [a0, -b0], hit, eye, back, away, reflected: fresnel(theta) };
}
/** The angle of the eye at a point the finger is at, whole degrees. */
export function stripAngle(a, b) {
  const { a0, b0, min, max } = STRIP;
  const th = deg(Math.atan2(a - a0, Math.max(0.01, b + b0)));
  return Math.min(max, Math.max(min, Math.round(th)));
}

// ── চিত্র ৮.১৩: two mirrors at 60° ──────────────────────────────────────────────────────────────────────────────────────
// The plane of the picture: the mirrors meet at the origin, A along the negative a axis (b = 0), B up and to the left at
// 60° from it. The light comes down to the fixed point of A from an angle θ.
const C60 = 0.5;
const S60 = Math.sqrt(3) / 2;
export const WEDGE = { arm: 14, hit: 7, source: 8.5, end: 15, min: 12, max: 78, start: 60, ray: 2.4 };
const AT_A = [-WEDGE.hit, 0];
const B_DIR = [-C60, S60];
const MIRRORS = {
  A: { from: [-WEDGE.arm, 0], dir: [1, 0], n: [0, 1] }, // n: toward the light
  B: { from: [0, 0], dir: B_DIR, n: [-S60, -C60] },
};
export const wedgeSource = (theta) => [AT_A[0] - WEDGE.source * Math.sin(rad(theta)), WEDGE.source * Math.cos(rad(theta))];
/** Traces the ray by the law of reflection. `hits`: mirror, point, angle of incidence. `back`: it came back along itself. */
export function traceWedge(theta) {
  let at = wedgeSource(theta);
  let dir = [Math.sin(rad(theta)), -Math.cos(rad(theta))];
  const points = [at];
  const hits = [];
  let back = false;
  for (let bounce = 0; bounce < 12; bounce++) {
    let best = null;
    for (const [id, m] of Object.entries(MIRRORS)) {
      const denom = dir[0] * m.n[0] + dir[1] * m.n[1];
      if (denom > -1e-9) continue;
      const t = ((m.from[0] - at[0]) * m.n[0] + (m.from[1] - at[1]) * m.n[1]) / denom;
      if (t < 1e-6) continue;
      const q = [at[0] + dir[0] * t, at[1] + dir[1] * t];
      const along = (q[0] - m.from[0]) * m.dir[0] + (q[1] - m.from[1]) * m.dir[1];
      if (along < -1e-9 || along > WEDGE.arm + 1e-9) continue;
      if (!best || t < best.t) best = { id, t, q, m, denom };
    }
    if (!best) {
      points.push([at[0] + dir[0] * WEDGE.end, at[1] + dir[1] * WEDGE.end]);
      break;
    }
    const inc = deg(Math.acos(Math.min(1, -best.denom)));
    points.push(best.q);
    hits.push({ mirror: best.id, point: best.q, theta: inc });
    if (inc < 1e-6) back = true;
    dir = [dir[0] - 2 * best.denom * best.m.n[0], dir[1] - 2 * best.denom * best.m.n[1]];
    at = best.q;
    if (back && hits.length === 3) {
      points.push(wedgeSource(theta));
      break;
    }
  }
  return { points, hits, back };
}
/** The angle of incidence at B after a hit on A at θ: the triangle of the two hits and the corner gives |60° − θ|. */
export const atB = (theta) => Math.abs(60 - theta);
/** The angle of the ray above mirror A after it leaves A. */
export const aboveA = (theta) => 90 - theta;
/** The third angle of the triangle of the corner and the two hits: 180° − 60° − (90° − θ). It is 90° only at θ = 60°. */
export const thirdAngle = (theta) => 30 + theta;
export const snapWedge = (a) => Math.min(WEDGE.max, Math.max(WEDGE.min, Math.round(a)));
/** The θ a finger at (a, b) asks for: the source moves on its arc round the hit on A. */
export const wedgeAngle = (a, b) => snapWedge(deg(Math.atan2(AT_A[0] - a, Math.max(0.01, b))));

// ── the test's numbers: wrong answers from real mistakes ──────────────────────────────────────────────────────────────
/** B's angle: the answer, and the mistakes: θ copied across, the angle above the mirror, the mirrors' own 60°. */
export function sixtyChoices(theta) {
  return { answer: atB(theta), copied: theta, above: aboveA(theta), corner: 60 };
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
