// Smooth bodies for the shoes, feet and legs (src/shoes.js). A body is made of rings across a shoe's length: each ring
// stands in a plane x = const, a rounded shape that is flatter at the bottom and narrower and rounder at the top (a
// shoe's or a foot's cross-section). A ring can leave out an angle at the top (a shoe's opening round the foot), and a
// body can be painted per vertex (a toe cap, a stripe) so no texture seams show. Also: upright columns (a heel's post)
// and tubes round a vertical axis (legs, trouser legs).
import * as THREE from 'three';

const sgnpow = (v, p) => Math.sign(v) * Math.abs(v) ** p;

/**
 * A point on a section's ring at angle th (0: the top middle, π/2: the +z side, π: the bottom middle), as [z, up].
 * sec: { w (half width at the bottom), h, taper (the top's width as a part of the bottom's), nt, nb (squareness of the
 * top and bottom halves: 2 is round, bigger is boxier) }.
 */
export function ringAt(sec, th) {
  const c = Math.cos(th);
  // the squareness changes smoothly from the bottom half to the top half (a sudden change would show as a crease)
  const nb = sec.nb ?? 3.5;
  const nt = sec.nt ?? 2.2;
  const blend = Math.min(1, Math.max(0, (c + 0.5) / 1));
  const n = nb + (nt - nb) * blend * blend * (3 - 2 * blend);
  const up = (sec.h / 2) * (1 + sgnpow(c, 2 / n));
  const k = sec.h > 1e-9 ? up / sec.h : 0;
  const half = sec.w * (1 - (1 - (sec.taper ?? 1)) * k ** 1.6);
  return [sgnpow(Math.sin(th), 2 / n) * half, up];
}

/** The angle to leave out at the top so the ring's sides stand `t` high (t ≥ h: none). */
export function openFor(sec, t) {
  if (t >= sec.h - 1e-6) return 0;
  // search the angle whose point stands t high (the squareness blends with the angle, so no closed form)
  let lo = 0;
  let hi = Math.PI;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (ringAt(sec, mid)[1] > t) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * A smooth body: a ring at each x, from section(x) = { y (its bottom), w, h, taper, nt, nb, open }. The first and last
 * rings shrink to a point, so the body is closed. color(c, x, th, k) paints a vertex (k: 0 at the bottom of its ring, 1
 * at the top). inset shrinks every ring (a lining inside a shell); flip turns the faces inward.
 * uv: true gives each vertex (u, v) = (x from the first ring to the last, 0 … 1; the angle from the top middle, 0 at
 * the top … 1 at the bottom), the same on both sides, so a texture painted in it has no seam.
 * Returns { geometry, rows } (rows[i][j]: the vertex positions, for joining an edge to another body).
 */
export function body(xs, section, { seg = 56, color = null, inset = 0, flip = false, uv = false } = {}) {
  const pos = [];
  const col = [];
  const uvs = [];
  const idx = [];
  const rows = [];
  const closed = [];
  const c3 = new THREE.Color();
  const last = xs.length - 1;
  xs.forEach((x, i) => {
    const s = section(x);
    const end = i === 0 || i === last;
    const sec = {
      ...s,
      w: end ? 1e-5 : Math.max(1e-5, s.w - inset),
      h: end ? 1e-5 : Math.max(1e-5, s.h - inset * 1.4),
      y: s.y + inset * 0.6,
    };
    const open = s.open || 0;
    closed.push(open < 1e-6);
    const row = [];
    for (let j = 0; j <= seg; j++) {
      const th = open + ((Math.PI * 2 - 2 * open) * j) / seg;
      const [z, up] = ringAt(sec, th);
      const p = new THREE.Vector3(x, sec.y + up, z);
      row.push(p);
      pos.push(p.x, p.y, p.z);
      if (uv) uvs.push((x - xs[0]) / (xs[last] - xs[0]), Math.min(th, Math.PI * 2 - th) / Math.PI);
      if (color) {
        color(c3, x, th, sec.h > 1e-4 ? up / sec.h : 0);
        col.push(c3.r, c3.g, c3.b);
      }
    }
    rows.push(row);
  });
  const n = seg + 1;
  for (let i = 0; i < last; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * n + j;
      const b = a + n;
      if (flip) idx.push(a, b, a + 1, a + 1, b, b + 1);
      else idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (color) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // a closed ring has its first and last vertex in the same place: share their normals, so no seam shows on top
  const nr = g.attributes.normal;
  const v = new THREE.Vector3();
  closed.forEach((isClosed, i) => {
    if (!isClosed) return;
    const a = i * n;
    const b = a + seg;
    v.set(nr.getX(a) + nr.getX(b), nr.getY(a) + nr.getY(b), nr.getZ(a) + nr.getZ(b)).normalize();
    nr.setXYZ(a, v.x, v.y, v.z);
    nr.setXYZ(b, v.x, v.y, v.z);
  });
  return { geometry: g, rows };
}

/** A strip joining two bodies' open edges (a shoe's outside and its lining): the rolled top edge. */
export function rim(outer, inner) {
  const pos = [];
  const idx = [];
  let k = 0;
  for (const j of [0, outer[0].length - 1])
    for (let i = 0; i < outer.length; i++) {
      for (const p of [outer[i][j], inner[i][j]]) pos.push(p.x, p.y, p.z);
      if (i > 0) {
        const a = k - 2;
        idx.push(a, a + 1, k, k, a + 1, k + 1);
      }
      k += 2;
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** An upright column of horizontal ellipses, top to bottom: levels [{ x, y, z, rx, rz }], closed at the bottom. */
export function column(levels, { seg = 36 } = {}) {
  const pos = [];
  const idx = [];
  const n = seg + 1;
  for (const L of levels)
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      pos.push(L.x + Math.cos(a) * L.rx, L.y, (L.z || 0) + Math.sin(a) * L.rz);
    }
  for (let i = 0; i < levels.length - 1; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * n + j;
      idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
    }
  const b = levels[levels.length - 1];
  const centre = pos.length / 3;
  pos.push(b.x, b.y, b.z || 0);
  const lastRow = (levels.length - 1) * n;
  for (let j = 0; j < seg; j++) idx.push(lastRow + j, centre, lastRow + j + 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * A tube round a vertical axis (legs, trouser legs): from the hem up to y1. radius(k, y, a) (k: 0 at the hem … 1 at
 * the top; a: the angle round, 0 towards +x); hem(a): the hem's height at that angle. A leg is a little deeper (x) than
 * wide (z). lean: how far the axis moves in x per metre up.
 */
export function tube(axis, hem, y1, radius, { seg = 48, rows = 30, lean = 0 } = {}) {
  const pos = [];
  const uv = [];
  const idx = [];
  const hemAt = typeof hem === 'function' ? hem : () => hem;
  for (let i = 0; i <= rows; i++) {
    const k = i / rows;
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      const y0 = hemAt(a);
      const y = y0 + (y1 - y0) * k;
      const r = radius(k, y, a);
      const cx = axis.x + lean * (y - y0);
      pos.push(cx + Math.cos(a) * r * 1.06, y, axis.z + Math.sin(a) * r * 0.94);
      uv.push(j / seg, k);
    }
  }
  const n = seg + 1;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * n + j;
      idx.push(a, a + 1, a + n, a + 1, a + n + 1, a + n);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Linear interpolation in a table [[x, value], …] (sorted by x), smoothed between the points, clamped at the ends. */
export function lerpTable(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [x1, v1] = table[i];
    if (x <= x1) {
      const [x0, v0] = table[i - 1];
      const k = (x - x0) / (x1 - x0);
      const s = k * k * (3 - 2 * k);
      return v0 + (v1 - v0) * (0.5 * k + 0.5 * s);
    }
  }
  return table[table.length - 1][1];
}

/** `count` numbers from a to b (both ends included), closer together near the ends when `ends` > 0. */
export function spread(a, b, count, ends = 0) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const k = i / (count - 1);
    const e = 0.5 - 0.5 * Math.cos(Math.PI * k);
    out.push(a + (b - a) * ((1 - ends) * k + ends * e));
  }
  return out;
}

/** 1 in the middle, falling to 0 like a quarter circle over r at each end of [x0, x1] (rounded toes and heels). */
export function roundEnds(x, x0, x1, r0, r1 = r0) {
  const a = Math.max(0, x0 + r0 - x) / r0;
  const b = Math.max(0, x - (x1 - r1)) / r1;
  return Math.sqrt(Math.max(0, 1 - a * a)) * Math.sqrt(Math.max(0, 1 - b * b));
}
