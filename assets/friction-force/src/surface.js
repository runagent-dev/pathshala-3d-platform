// Smooth unions for connected clothing. A tetrahedral isosurface is baked once into an indexed (welded) geometry; the
// person skins it on the GPU for each live pose (no per-frame work on the CPU).
import * as THREE from 'three';
const TETS = [
  [0, 5, 1, 6],
  [0, 1, 2, 6],
  [0, 2, 3, 6],
  [0, 3, 7, 6],
  [0, 7, 4, 6],
  [0, 4, 5, 6],
];
export function smoothMin(a, b, k = 0.03) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
export function ellipsoidDistance(x, y, z, cx, cy, cz, rx, ry, rz) {
  const a = (x - cx) / rx,
    b = (y - cy) / ry,
    c = (z - cz) / rz;
  return (Math.sqrt(a * a + b * b + c * c) - 1) * Math.min(rx, ry, rz);
}
export function boneDistance(x, y, z, a, b, r0, r1, bulge = 0) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    dz = b.z - a.z;
  const t = THREE.MathUtils.clamp(((x - a.x) * dx + (y - a.y) * dy + (z - a.z) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
  const px = x - a.x - t * dx,
    py = y - a.y - t * dy,
    pz = z - a.z - t * dz;
  return Math.sqrt(px * px + py * py + pz * pz) - (r0 + (r1 - r0) * t + bulge * Math.sin(Math.PI * t));
}
/**
 * The surface where sample(x, y, z) = 0 inside the box min…max, on a grid `spacing` apart: an indexed geometry whose
 * vertices are shared by the triangles round them (one vertex per cut grid edge), with normals from the field.
 * @param {number[]} min @param {number[]} max @param {number} spacing
 * @param {(x: number, y: number, z: number) => number} sample
 */
export function bakeSurface(min, max, spacing, sample) {
  const nx = Math.ceil((max[0] - min[0]) / spacing) + 1,
    ny = Math.ceil((max[1] - min[1]) / spacing) + 1,
    nz = Math.ceil((max[2] - min[2]) / spacing) + 1;
  const sx = (max[0] - min[0]) / (nx - 1),
    sy = (max[1] - min[1]) / (ny - 1),
    sz = (max[2] - min[2]) / (nz - 1);
  const field = new Float32Array(nx * ny * nz),
    gradient = new Float32Array(field.length * 3),
    stride = nx * ny;
  let index = 0;
  for (let z = 0; z < nz; z++)
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) field[index++] = sample(min[0] + x * sx, min[1] + y * sy, min[2] + z * sz);
  for (let z = 1; z < nz - 1; z++)
    for (let y = 1; y < ny - 1; y++)
      for (let x = 1; x < nx - 1; x++) {
        const i = z * stride + y * nx + x;
        gradient[i * 3] = (field[i + 1] - field[i - 1]) / (2 * sx);
        gradient[i * 3 + 1] = (field[i + nx] - field[i - nx]) / (2 * sy);
        gradient[i * 3 + 2] = (field[i + stride] - field[i - stride]) / (2 * sz);
      }
  const positions = [],
    normals = [],
    indices = [],
    cut = new Map(); // grid edge (lower id × count + higher id) → vertex
  const total = field.length;
  /** The vertex where the surface cuts the grid edge a–b (made once, shared). */
  function vertex(p, q) {
    const a = Math.min(p, q),
      b = Math.max(p, q),
      key = a * total + b;
    const known = cut.get(key);
    if (known !== undefined) return known;
    const t = field[a] / (field[a] - field[b]);
    const ax = a % nx,
      ay = Math.floor(a / nx) % ny,
      az = Math.floor(a / stride);
    const bx = b % nx,
      by = Math.floor(b / nx) % ny,
      bz = Math.floor(b / stride);
    const gx = gradient[a * 3] + t * (gradient[b * 3] - gradient[a * 3]),
      gy = gradient[a * 3 + 1] + t * (gradient[b * 3 + 1] - gradient[a * 3 + 1]),
      gz = gradient[a * 3 + 2] + t * (gradient[b * 3 + 2] - gradient[a * 3 + 2]);
    const len = Math.hypot(gx, gy, gz) || 1;
    positions.push(min[0] + (ax + t * (bx - ax)) * sx, min[1] + (ay + t * (by - ay)) * sy, min[2] + (az + t * (bz - az)) * sz);
    normals.push(gx / len, gy / len, gz / len);
    const id = positions.length / 3 - 1;
    cut.set(key, id);
    return id;
  }
  function triangle(a, b, c) {
    if (a === b || b === c || a === c) return; // a cut exactly through a grid point: nothing to draw
    const P = positions,
      ux = P[b * 3] - P[a * 3],
      uy = P[b * 3 + 1] - P[a * 3 + 1],
      uz = P[b * 3 + 2] - P[a * 3 + 2],
      vx = P[c * 3] - P[a * 3],
      vy = P[c * 3 + 1] - P[a * 3 + 1],
      vz = P[c * 3 + 2] - P[a * 3 + 2];
    const N = normals;
    if ((uy * vz - uz * vy) * N[a * 3] + (uz * vx - ux * vz) * N[a * 3 + 1] + (ux * vy - uy * vx) * N[a * 3 + 2] < 0) indices.push(a, c, b);
    else indices.push(a, b, c);
  }
  const offsets = [0, 1, nx + 1, nx, stride, stride + 1, stride + nx + 1, stride + nx],
    ids = new Array(8),
    inside = [],
    outside = [];
  for (let z = 0; z < nz - 1; z++)
    for (let y = 0; y < ny - 1; y++)
      for (let x = 0; x < nx - 1; x++) {
        const base = z * stride + y * nx + x;
        let mask = 0;
        for (let i = 0; i < 8; i++) {
          ids[i] = base + offsets[i];
          if (field[ids[i]] < 0) mask |= 1 << i;
        }
        if (mask === 0 || mask === 255) continue;
        for (const tet of TETS) {
          inside.length = 0;
          outside.length = 0;
          for (const corner of tet) (field[ids[corner]] < 0 ? inside : outside).push(ids[corner]);
          if (!inside.length || !outside.length) continue;
          if (inside.length === 1 || outside.length === 1) {
            const one = inside.length === 1 ? inside[0] : outside[0],
              other = inside.length === 1 ? outside : inside;
            triangle(vertex(one, other[0]), vertex(one, other[1]), vertex(one, other[2]));
          } else {
            const a = vertex(inside[0], outside[0]),
              b = vertex(inside[0], outside[1]),
              c = vertex(inside[1], outside[0]),
              d = vertex(inside[1], outside[1]);
            triangle(a, c, b);
            triangle(b, c, d);
          }
        }
      }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
