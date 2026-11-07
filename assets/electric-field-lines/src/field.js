// The physics, pure (unit-tested in test/unit/electric-field-lines.test.mjs): point charges on one line (the x axis,
// at the spheres' height), the field E = kq/r² of each, added as vectors, and field lines traced along E with RK4.
// The book's k = 9 × 10⁹ N m²/C². The spheres carry a lab-sized charge, q = 4 × 10⁻⁹ C (4 nC), so kq = 36 N m²/C and
// the numbers come out round: at r = 6 cm, E = 10,000 N/C; at 12 cm, 2,500 N/C.
// All lengths in metres. Every configuration is symmetric about the x axis.

export const K = 9e9;
export const Q = 4e-9; // C: one "q"
export const KQ = K * Q; // 36 N m²/C
/** Where things are (m): the spheres' centres at height H on the line z = 0; the two charges of a pair at ±D. */
export const H = 0.16;
export const R = 0.025; // the spheres' radius
export const D = 0.08;
export const XA = -D; // the left sphere (the single charge too)
export const XB = D;
/** The test charge q₀ in the single-charge steps: r (m) from the left sphere's centre, within this range. */
export const RANGE = { min: 0.05, minNeg: 0.07, max: 0.15, start: 0.12, near: 0.06, neg: 0.1 };
/** …and between the pair (x, m): clear of both spheres' bases. */
export const GAP = { min: -0.035, max: 0.035 };

/**
 * The configurations: the charges (x, and q in units of q). `bound`: lines stop this far from `centre` (m); `depth`: this
 * far from the charges' plane (a long loop would otherwise swing out past the camera).
 */
export const CONFIGS = {
  single: { charges: [{ x: XA, q: 1 }], centre: XA, bound: 0.17 },
  unlike: {
    charges: [
      { x: XA, q: 1 },
      { x: XB, q: -1 },
    ],
    centre: 0,
    bound: 0.4,
    depth: 0.15,
  },
  like: {
    charges: [
      { x: XA, q: 1 },
      { x: XB, q: 1 },
    ],
    centre: 0,
    bound: 0.4,
    depth: 0.15,
  },
  double: {
    charges: [
      { x: XA, q: -2 },
      { x: XB, q: 1 },
    ],
    centre: 0,
    bound: 0.4,
    depth: 0.15,
  },
};
const FLOOR = 0.003; // lines stop at the table top (y = 0) and a hair above it

/**
 * The field at (x, y, z) from charges on the axis (y = H, z = 0), in N/C, written into `out` ([x, y, z]).
 * `sign` multiplies every charge (−1: the single charge made negative).
 */
export function fieldAt(charges, x, y, z, out = [0, 0, 0], sign = 1) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  for (const c of charges) {
    const dx = x - c.x;
    const dy = y - H;
    const dz = z;
    const r2 = dx * dx + dy * dy + dz * dz;
    const r = Math.sqrt(r2);
    const k = (KQ * c.q * sign) / (r2 * r);
    out[0] += k * dx;
    out[1] += k * dy;
    out[2] += k * dz;
  }
  return out;
}

/** The field along the axis (N/C, + to the right) at x: what q₀ feels per coulomb there. */
export function fieldOnAxis(charges, x, sign = 1) {
  let e = 0;
  for (const c of charges) {
    const dx = x - c.x;
    e += (KQ * c.q * sign * Math.sign(dx)) / (dx * dx);
  }
  return e;
}

/** E = kq/r² for one charge of `n` q at r metres (N/C). */
export const fieldOfOne = (r, n = 1) => (KQ * Math.abs(n)) / (r * r);

/** Where E = 0 on the axis between (or beside) two charges, or null. Pure maths for the like pair (the middle). */
export function neutralPoint(charges) {
  if (charges.length !== 2) return null;
  const [a, b] = charges;
  const lo = Math.min(a.x, b.x) + 1e-4;
  const hi = Math.max(a.x, b.x) - 1e-4;
  const f = (x) => fieldOnAxis(charges, x);
  if (Math.sign(f(lo)) === Math.sign(f(hi))) return null;
  let l = lo;
  let h = hi;
  for (let i = 0; i < 60; i++) {
    const m = (l + h) / 2;
    if (Math.sign(f(m)) === Math.sign(f(l))) l = m;
    else h = m;
  }
  return (l + h) / 2;
}

/** Evenly spread directions on a sphere (a Fibonacci lattice), turned so none points straight down the stand. */
export function sphereDirections(n) {
  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const rr = Math.sqrt(1 - y * y);
    const a = i * golden + 0.35;
    out.push([Math.cos(a) * rr, y, Math.sin(a) * rr]);
  }
  return out;
}

/** Directions in the book's plane (z = 0), n of them, the first at `offset` (radians) from +x. */
export function planeDirections(n, offset = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = offset + (i * 2 * Math.PI) / n;
    out.push([Math.cos(a), Math.sin(a), 0]);
  }
  return out;
}

/**
 * One field line from a point, following +E (dir = 1) or −E (dir = −1), with RK4 steps that shrink near the charges.
 * Stops on a sphere it runs into (`end`: that charge's index), outside the bound, at the table, or where the field
 * dies away (a neutral point: `stalled`). Returns { points: [x, y, z][], end, stalled }.
 */
export function traceLine(cfg, start, dir, { sign = 1, from = -1, maxSteps = 900 } = {}) {
  const ch = cfg.charges;
  const pts = [start.slice()];
  let [x, y, z] = start;
  const e = [0, 0, 0];
  const k1 = [0, 0, 0];
  const k2 = [0, 0, 0];
  const k3 = [0, 0, 0];
  const k4 = [0, 0, 0];
  const unit = (px, py, pz, out) => {
    fieldAt(ch, px, py, pz, e, sign);
    const m = Math.hypot(e[0], e[1], e[2]);
    out[0] = (dir * e[0]) / m;
    out[1] = (dir * e[1]) / m;
    out[2] = (dir * e[2]) / m;
    return m;
  };
  const near0 = KQ / (0.25 * 0.25) / 400; // far weaker than anything drawn: a neutral point
  for (let i = 0; i < maxSteps; i++) {
    let dmin = Number.POSITIVE_INFINITY;
    for (const c of ch) dmin = Math.min(dmin, Math.hypot(x - c.x, y - H, z));
    const h = Math.min(0.006, Math.max(0.0012, 0.12 * dmin));
    const m = unit(x, y, z, k1);
    if (m < near0) return { points: pts, end: -1, stalled: true };
    unit(x + (h / 2) * k1[0], y + (h / 2) * k1[1], z + (h / 2) * k1[2], k2);
    unit(x + (h / 2) * k2[0], y + (h / 2) * k2[1], z + (h / 2) * k2[2], k3);
    unit(x + h * k3[0], y + h * k3[1], z + h * k3[2], k4);
    const nx = x + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    const ny = y + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    const nz = z + (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    // a U-turn in one step: stuck at a neutral point
    const turn = k1[0] * k4[0] + k1[1] * k4[1] + k1[2] * k4[2];
    if (turn < -0.5) return { points: pts, end: -1, stalled: true };
    x = nx;
    y = ny;
    z = nz;
    // into a sphere: end on its surface, on the way to its centre
    for (let j = 0; j < ch.length; j++) {
      if (j === from) continue;
      const c = ch[j];
      const d = Math.hypot(x - c.x, y - H, z);
      if (d < R) {
        pts.push([c.x + ((x - c.x) * R) / d, H + ((y - H) * R) / d, (z * R) / d]);
        return { points: pts, end: j, stalled: false };
      }
    }
    if (y < FLOOR) {
      // the table: end exactly on it
      const [px, py, pz] = pts[pts.length - 1];
      const k = (py - FLOOR) / (py - y);
      pts.push([px + (x - px) * k, FLOOR, pz + (z - pz) * k]);
      return { points: pts, end: -1, stalled: false };
    }
    pts.push([x, y, z]);
    if (Math.hypot(x - cfg.centre, y - H, z) > cfg.bound || Math.abs(z) > (cfg.depth ?? 1)) return { points: pts, end: -1, stalled: false };
  }
  return { points: pts, end: -1, stalled: false };
}

/** Arc length of a polyline. */
export function lengthOf(points) {
  let L = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    L += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  }
  return L;
}

/** The same polyline at points `step` apart (m), ends kept. */
export function resample(points, step) {
  const L = lengthOf(points);
  const n = Math.max(2, Math.ceil(L / step) + 1);
  const out = [];
  let seg = 1;
  let acc = 0; // arc length at points[seg - 1]
  for (let i = 0; i < n; i++) {
    const s = (L * i) / (n - 1);
    while (seg < points.length - 1) {
      const a = points[seg - 1];
      const b = points[seg];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      if (acc + l >= s) break;
      acc += l;
      seg++;
    }
    const a = points[seg - 1];
    const b = points[seg];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1;
    const k = Math.min(1, Math.max(0, (s - acc) / l));
    out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]);
  }
  return out;
}

/**
 * All the field lines of a configuration. Each line runs in the field's direction (from + toward −) and records which
 * charge it starts on (`from`, or −1: from far away) and ends on (`to`, or −1). `perQ` lines leave each unit of
 * positive charge and arrive at each unit of negative charge (rule (b): twice the charge, twice the lines); a line
 * from a negative charge's seed that would end on a positive charge is already drawn from that side, and is dropped.
 * `flat`: only the book's plane z = 0. `sign`: −1 turns every charge round (the single charge made negative).
 */
export function traceConfig(name, { flat = false, perQ = flat ? 16 : 24, sign = 1 } = {}) {
  const cfg = CONFIGS[name];
  const charges = cfg.charges.map((c) => ({ ...c, q: c.q * sign }));
  const signed = { ...cfg, charges };
  const lines = [];
  // like charges: no seed straight at the other charge (it would stall in the middle)
  const offset = name === 'like' ? Math.PI / perQ : 0;
  charges.forEach((c, i) => {
    const n = Math.round(perQ * Math.abs(c.q));
    const dirs = flat ? planeDirections(n, offset) : sphereDirections(n);
    for (const d of dirs) {
      const start = [c.x + d[0] * R, H + d[1] * R, d[2] * R];
      if (start[1] < FLOOR) continue;
      const out = c.q > 0;
      const tr = traceLine(signed, start, out ? 1 : -1, { from: i });
      if (tr.stalled || tr.points.length < 3) continue;
      if (!out && tr.end >= 0) continue; // drawn from the positive side already
      const points = out ? tr.points : tr.points.slice().reverse();
      lines.push({ points, from: out ? i : tr.end, to: out ? tr.end : i });
    }
  });
  return lines;
}

/** A number written the Bangladeshi way: 1,00,000 for Bangla, 100,000 for English (digits converted later). */
export function groupDigits(n, lang = 'bn') {
  const s = String(Math.round(Math.abs(n)));
  const neg = n < 0 ? '−' : '';
  if (s.length <= 3) return neg + s;
  if (lang !== 'bn') return neg + s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const last = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${neg}${rest},${last}`;
}

/** A field value rounded as it is shown: to the nearest 10 N/C. */
export const roundField = (e) => Math.round(e / 10) * 10 || 0;
