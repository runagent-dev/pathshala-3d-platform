// A loft: a smooth body made of rings along a path, each ring a rounded box (a superellipse) standing across the path
// with its bottom on the path. Shoes, feet and legs are built from these (src/shoes.js). A ring can be open at the top
// (a shoe's upper round a foot): `open` is the angle, from the top, left out on each side.
import * as THREE from 'three';

const sgnpow = (v, p) => Math.sign(v) * Math.abs(v) ** p;

/**
 * stations: [{ p: Vector3 (the bottom of the ring), w (half width), h (height), open = 0, n = 2.4 }].
 * The rings stand across the path (its direction from the stations before and after), with z as their side.
 * Returns a BufferGeometry with normals and uvs (u along the path, v round the ring).
 */
export function loft(stations, { seg = 32 } = {}) {
  const pos = [];
  const uv = [];
  const idx = [];
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  const q = new THREE.Vector3();
  const last = stations.length - 1;
  stations.forEach((s, i) => {
    const a = stations[Math.max(0, i - 1)].p;
    const b = stations[Math.min(last, i + 1)].p;
    T.subVectors(b, a).normalize();
    N.set(-T.y, T.x, 0).normalize(); // "up" across the path, in the path's plane
    B.crossVectors(T, N).normalize(); // the side (z for a level path)
    const open = s.open || 0;
    const n = s.n || 2.4;
    for (let j = 0; j <= seg; j++) {
      const th = open + ((Math.PI * 2 - 2 * open) * j) / seg; // from the top, round by the side
      const side = sgnpow(Math.sin(th), 2 / n) * s.w;
      const up = s.h / 2 + sgnpow(Math.cos(th), 2 / n) * (s.h / 2);
      q.copy(s.p).addScaledVector(N, up).addScaledVector(B, side);
      pos.push(q.x, q.y, q.z);
      uv.push(i / last, j / seg);
    }
  });
  const row = seg + 1;
  for (let i = 0; i < last; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * row + j;
      const b = a + row;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Linear interpolation in a table [[x, value], …] (sorted by x), clamped at the ends. */
export function lerpTable(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [x1, v1] = table[i];
    if (x <= x1) {
      const [x0, v0] = table[i - 1];
      const k = (x - x0) / (x1 - x0);
      // smooth between the points, so the outline has no corners
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
    const e = ends ? 0.5 - 0.5 * Math.cos(Math.PI * k) : k;
    out.push(a + (b - a) * ((1 - ends) * k + ends * e));
  }
  return out;
}
