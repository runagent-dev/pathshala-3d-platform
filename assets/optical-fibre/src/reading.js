// The optics of the fibre, pure functions (unit tested in test/unit/optical-fibre.test.mjs). Everything is in the plane
// of the bend (z = 0), in centimetres: x along the table, y up. The fibre's centre line is a straight start, an S-bend
// of two equal circular arcs (one up, one back down) and a straight end, so every wall is an exact line or circle and
// the light is traced exactly: from the source into the near end face (Snell), to the core–clad wall, where it is totally
// reflected when the angle of incidence θ₁ is at least the critical angle θc, and otherwise mostly refracted into the
// clad (Fresnel: only a part reflects), out of the far end face (Snell) onto the screen.
//
// The book's numbers (page 253): core n₂ = 1.50, clad n₁ = 1.45, θc = sin⁻¹(n₁/n₂) = 75° (1.45/1.50 = 0.967, sin⁻¹ = 75.2°;
// the book rounds to 75°). The figure takes θc = 75° exactly (the clad's index is then 1.50 × sin 75° = 1.449, which is
// 1.45 to the book's two places), so no reading ever shows "75°" on a ray that leaks.

const DEG = Math.PI / 180;

export const N_CORE = 1.5; // n₂, the core (the book's symbol on this page)
export const N_CLAD_BOOK = 1.45; // n₁, the clad, as printed
export const THETA_C = 75; // degrees, the book's critical angle
export const N_CLAD = N_CORE * Math.sin(THETA_C * DEG); // 1.4489: 1.45 to two places, gives θc = 75° exactly
export const N_AIR = 1;

/** The model, cm. Real fibres are hair-thin (the core about 0.05 mm); this one is drawn many times bigger. */
export const FIBRE = {
  core: 0.6, // the core's radius
  clad: 1.0, // the clad's outer radius
  jacket: 1.15, // the plastic coating's outer radius (it absorbs light that leaves the core)
  length: 74, // x of the far end face (the near one is at x = 0)
  s1: 12, // the straight start before the bend
  span: 50, // the S-bend's length along x
};
export const BEND_MAX = 10; // cm: how far the far end can be raised or lowered
export const ALPHA_MAX = 40; // degrees: the steepest the source can be tilted
export const ALPHA_START = 10; // the source's tilt at first (θ₁ = 83° at a straight wall)
export const SOURCE_GAP = 6; // cm from the source's aperture to the near end face
export const SCREEN_GAP = 7; // cm from the far end face to the screen
export const SCREEN_HALF = 4.5; // the screen's half height, cm

/** The angle inside the core to the axis (β, degrees), for a tilt α of the source outside: sin α = n₂ sin β. */
export const insideAngle = (alpha) => Math.asin(Math.sin(alpha * DEG) / N_CORE) / DEG;
/** The angle of incidence at a straight wall for a tilt α outside: θ₁ = 90° − β. */
export const wallAngle = (alpha) => 90 - insideAngle(Math.abs(alpha));
/** The critical angle from two indices (dense n₂ inside, light n₁ outside), the book's θc = sin⁻¹(n₁/n₂), degrees. */
export const criticalAngle = (n1, n2) => Math.asin(n1 / n2) / DEG;
/** The steepest tilt of the source that still keeps θ₁ ≥ θc on a straight fibre (degrees). */
export const ALPHA_EDGE = Math.asin(N_CORE * Math.sin((90 - THETA_C) * DEG)) / DEG; // 22.85°

/**
 * The share of the light reflected at the core–clad wall (unpolarised Fresnel), for θ₁ in degrees. 1 from θc on.
 */
export function reflectance(theta, n1 = N_CORE, n2 = N_CLAD) {
  const si = Math.sin(theta * DEG);
  const st = (n1 / n2) * si;
  if (st >= 1 - 1e-12) return 1;
  const ci = Math.cos(theta * DEG);
  const ct = Math.sqrt(1 - st * st);
  const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct);
  const rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
  return (rs * rs + rp * rp) / 2;
}

/** The centre line for a far end raised by h (cm): its pieces, lines and arcs. */
export function centreLine(h = 0) {
  const { s1, span, length } = FIBRE;
  const pieces = [];
  if (Math.abs(h) < 1e-6) {
    pieces.push({ kind: 'line', x0: 0, y0: 0, x1: length, y1: 0 });
    return { h: 0, phi: 0, radius: Number.POSITIVE_INFINITY, pieces, length };
  }
  const sg = Math.sign(h);
  const phi = 2 * Math.atan(Math.abs(h) / span); // each arc turns by φ
  const R = span / (2 * Math.sin(phi));
  pieces.push({ kind: 'line', x0: 0, y0: 0, x1: s1, y1: 0 });
  pieces.push({ kind: 'arc', cx: s1, cy: sg * R, r: R, a0: -sg * (Math.PI / 2), da: sg * phi });
  pieces.push({ kind: 'arc', cx: s1 + span, cy: h - sg * R, r: R, a0: sg * (Math.PI / 2 + phi), da: -sg * phi });
  pieces.push({ kind: 'line', x0: s1 + span, y0: h, x1: length, y1: h });
  for (const p of pieces) p.len = p.kind === 'line' ? Math.hypot(p.x1 - p.x0, p.y1 - p.y0) : p.r * Math.abs(p.da);
  return { h, phi: phi / DEG, radius: R, pieces, length: pieces.reduce((a, p) => a + (p.len ?? length), 0) };
}

/**
 * A point of the centre line at arc length s, its unit tangent and left normal, written into `out`
 * ({ x, y, tx, ty, nx, ny }; the left normal is the tangent turned a quarter anticlockwise).
 */
export function centreAt(line, s, out = { x: 0, y: 0, tx: 1, ty: 0, nx: 0, ny: 1 }) {
  let left = Math.max(0, s);
  const ps = line.pieces;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    const len = p.len ?? Math.hypot(p.x1 - p.x0, p.y1 - p.y0);
    if (left <= len || i === ps.length - 1) {
      const k = Math.min(1, left / len);
      if (p.kind === 'line') {
        out.x = p.x0 + (p.x1 - p.x0) * k;
        out.y = p.y0 + (p.y1 - p.y0) * k;
        out.tx = (p.x1 - p.x0) / len;
        out.ty = (p.y1 - p.y0) / len;
      } else {
        const a = p.a0 + p.da * k;
        out.x = p.cx + p.r * Math.cos(a);
        out.y = p.cy + p.r * Math.sin(a);
        const sg = Math.sign(p.da);
        out.tx = -Math.sin(a) * sg;
        out.ty = Math.cos(a) * sg;
      }
      out.nx = -out.ty;
      out.ny = out.tx;
      return out;
    }
    left -= len;
  }
  return out;
}

const EPS = 1e-7;

/** The nearest crossing (t > EPS) of the ray p + t·d with the centre line's offset at `off` (left +, right −). */
function hitOffset(line, off, px, py, dx, dy, best) {
  for (const p of line.pieces) {
    if (p.kind === 'line') {
      const len = p.len ?? Math.hypot(p.x1 - p.x0, p.y1 - p.y0);
      const tx = (p.x1 - p.x0) / len;
      const ty = (p.y1 - p.y0) / len;
      const nx = -ty;
      const ny = tx;
      const ax = p.x0 + nx * off;
      const ay = p.y0 + ny * off;
      // p + t d = a + u τ
      const den = dx * ty - dy * tx;
      if (Math.abs(den) < 1e-12) continue;
      const qx = ax - px;
      const qy = ay - py;
      const t = (qx * ty - qy * tx) / den;
      const u = (qx * dy - qy * dx) / den;
      if (t > EPS && t < best.t && u >= -1e-6 && u <= len + 1e-6) {
        best.t = t;
        best.nx = nx * Math.sign(off);
        best.ny = ny * Math.sign(off);
      }
    } else {
      const sg = Math.sign(p.da);
      const r = p.r - sg * off; // the left side of an anticlockwise arc is toward its centre
      const fx = px - p.cx;
      const fy = py - p.cy;
      const b = fx * dx + fy * dy;
      const c = fx * fx + fy * fy - r * r;
      const disc = b * b - c;
      if (disc < 0) continue;
      const sq = Math.sqrt(disc);
      for (const t of [-b - sq, -b + sq]) {
        if (!(t > EPS && t < best.t)) continue;
        const hx = px + dx * t - p.cx;
        const hy = py + dy * t - p.cy;
        let rel = (Math.atan2(hy, hx) - p.a0) * sg;
        rel = ((rel % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (rel > 2 * Math.PI - 1e-6) rel = 0;
        if (rel > Math.abs(p.da) + 1e-6) continue;
        best.t = t;
        // outward (away from the axis): the left normal is −radial on an anticlockwise arc
        const ux = hx / r;
        const uy = hy / r;
        best.nx = -sg * ux * Math.sign(off);
        best.ny = -sg * uy * Math.sign(off);
      }
    }
  }
  return best;
}

/** Snell's law in vector form: d into a medium across a surface with unit normal n pointing INTO the new medium. */
function refract(dx, dy, nx, ny, n1, n2) {
  const ci = dx * nx + dy * ny;
  const k = n1 / n2;
  const st2 = k * k * (1 - ci * ci);
  if (st2 >= 1) return null;
  const ct = Math.sqrt(1 - st2);
  return { x: k * (dx - ci * nx) + ct * nx, y: k * (dy - ci * ny) + ct * ny };
}

const P = (x, y) => ({ x, y });

/**
 * The light from the source through the fibre: { segs, hits, out, spot, arrived, leaked, minTheta, entry }.
 *  segs: [{ a, b, power, kind }] with kind 'air' (source to the face), 'core', 'clad' (leaking, ends at the coating),
 *    'exit' (far face to the screen); power 0…1 is the share of the light;
 *  hits: [{ x, y, nx, ny, theta, tir, power }] each core–clad wall the light meets (theta = θ₁, degrees; power before);
 *  spot: { x, y } on the screen, or null; arrived: the share of the light that reaches the screen;
 *  leaked: true if any wall had θ₁ < θc; minTheta: the smallest θ₁ met.
 * alpha: the source's tilt (degrees, + up), h: the far end's rise (cm).
 */
export function trace({ alpha = ALPHA_START, h = 0, line = centreLine(h), maxHits = 40, minPower = 0.004 } = {}) {
  const { core, clad, length } = FIBRE;
  const a = alpha * DEG;
  const segs = [];
  const hits = [];
  const src = P(-SOURCE_GAP * Math.cos(a), -SOURCE_GAP * Math.sin(a));
  const face = P(0, 0);
  segs.push({ a: src, b: face, power: 1, kind: 'air' });
  const d0 = refract(Math.cos(a), Math.sin(a), 1, 0, N_AIR, N_CORE);
  let dx = d0.x;
  let dy = d0.y;
  let px = 0;
  let py = 0;
  let power = 1;
  let leaked = false;
  let minTheta = 90;
  let spot = null;
  let arrived = 0;
  const endY = line.pieces[line.pieces.length - 1].y1;
  const best = { t: 0, nx: 0, ny: 0 };
  for (let n = 0; n <= maxHits; n++) {
    // the far end face: x = length, |y − endY| ≤ core (the last piece is level)
    let tEnd = Number.POSITIVE_INFINITY;
    if (dx > 1e-9) {
      const t = (length - px) / dx;
      const y = py + dy * t;
      if (t > EPS && Math.abs(y - endY) <= core + 1e-6) tEnd = t;
    }
    best.t = tEnd;
    best.nx = 0;
    best.ny = 0;
    hitOffset(line, core, px, py, dx, dy, best);
    hitOffset(line, -core, px, py, dx, dy, best);
    if (!Number.isFinite(best.t)) break; // lost (cannot happen inside a closed core)
    const qx = px + dx * best.t;
    const qy = py + dy * best.t;
    segs.push({ a: P(px, py), b: P(qx, qy), power, kind: 'core' });
    if (best.t === tEnd) {
      // out of the far face into the air, onto the screen
      const out = refract(dx, dy, 1, 0, N_CORE, N_AIR);
      if (out) {
        const ts = SCREEN_GAP / out.x;
        const sy = qy + out.y * ts;
        const onScreen = Math.abs(sy - endY) <= SCREEN_HALF;
        const end = onScreen ? P(length + SCREEN_GAP, sy) : P(qx + out.x * ts * 1.6, qy + out.y * ts * 1.6);
        segs.push({ a: P(qx, qy), b: end, power, kind: 'exit' });
        if (onScreen) {
          spot = P(length + SCREEN_GAP, sy);
          arrived = power;
        }
      }
      break;
    }
    const nx = best.nx;
    const ny = best.ny;
    const cosi = dx * nx + dy * ny;
    const theta = Math.acos(Math.min(1, Math.max(-1, cosi))) / DEG;
    const tir = theta >= THETA_C - 1e-9;
    hits.push({ x: qx, y: qy, nx, ny, theta, tir, power });
    minTheta = Math.min(minTheta, theta);
    if (!tir) {
      leaked = true;
      const R = reflectance(theta);
      const tr = refract(dx, dy, nx, ny, N_CORE, N_CLAD);
      if (tr) {
        // through the clad to its outer face, where the plastic coating absorbs it
        const b2 = { t: Number.POSITIVE_INFINITY, nx: 0, ny: 0 };
        hitOffset(line, clad, qx, qy, tr.x, tr.y, b2);
        hitOffset(line, -clad, qx, qy, tr.x, tr.y, b2);
        if (Number.isFinite(b2.t)) segs.push({ a: P(qx, qy), b: P(qx + tr.x * b2.t, qy + tr.y * b2.t), power: power * (1 - R), kind: 'clad' });
      }
      power *= R;
    }
    // the reflected part goes on
    dx -= 2 * cosi * nx;
    dy -= 2 * cosi * ny;
    px = qx;
    py = qy;
    if (power < minPower) break;
  }
  return { segs, hits, spot, arrived, leaked, minTheta, entry: face, source: src, alpha };
}

/** The angle shown for a wall, whole degrees, never "75°" on a wall that leaks nor below 75° on one that reflects. */
export const shownTheta = (hit) => (hit.tir ? Math.max(THETA_C, Math.round(hit.theta)) : Math.min(THETA_C - 1, Math.round(hit.theta)));
