// Smooth implicit surface for the continuous outer heart tissue; baked once, in metres.
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
export function createSurface(name, material, parent, min, max, spacing = 0.016) {
  const nx = Math.ceil((max[0] - min[0]) / spacing) + 1,
    ny = Math.ceil((max[1] - min[1]) / spacing) + 1,
    nz = Math.ceil((max[2] - min[2]) / spacing) + 1;
  const sx = (max[0] - min[0]) / (nx - 1),
    sy = (max[1] - min[1]) / (ny - 1),
    sz = (max[2] - min[2]) / (nz - 1);
  const field = new Float32Array(nx * ny * nz),
    gradient = new Float32Array(field.length * 3),
    stride = nx * ny;
  const geometry = new THREE.BufferGeometry();
  const capacity = 400000,
    positions = new Float32Array(capacity * 3),
    normals = new Float32Array(capacity * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.boundingBox = new THREE.Box3(new THREE.Vector3(min[0], min[1], min[2]), new THREE.Vector3(max[0], max[1], max[2]));
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  parent.add(mesh);
  const offsets = [0, 1, nx + 1, nx, stride, stride + 1, stride + nx + 1, stride + nx];
  let count = 0;
  function intersect(a, b) {
    const t = field[a] / (field[a] - field[b]);
    const ax = a % nx,
      ay = Math.floor(a / nx) % ny,
      az = Math.floor(a / stride);
    const bx = b % nx,
      by = Math.floor(b / nx) % ny,
      bz = Math.floor(b / stride);
    const nx0 = gradient[a * 3] + t * (gradient[b * 3] - gradient[a * 3]),
      ny0 = gradient[a * 3 + 1] + t * (gradient[b * 3 + 1] - gradient[a * 3 + 1]),
      nz0 = gradient[a * 3 + 2] + t * (gradient[b * 3 + 2] - gradient[a * 3 + 2]);
    const len = Math.hypot(nx0, ny0, nz0) || 1;
    return [
      min[0] + (ax + t * (bx - ax)) * sx,
      min[1] + (ay + t * (by - ay)) * sy,
      min[2] + (az + t * (bz - az)) * sz,
      nx0 / len,
      ny0 / len,
      nz0 / len,
    ];
  }
  function triangle(a, b, c) {
    const ux = b[0] - a[0],
      uy = b[1] - a[1],
      uz = b[2] - a[2],
      vx = c[0] - a[0],
      vy = c[1] - a[1],
      vz = c[2] - a[2];
    if ((uy * vz - uz * vy) * a[3] + (uz * vx - ux * vz) * a[4] + (ux * vy - uy * vx) * a[5] < 0) [b, c] = [c, b];
    if (count + 3 > capacity) throw new Error('Heart surface exceeded its vertex budget');
    for (const p of [a, b, c]) {
      positions.set(p.slice(0, 3), count * 3);
      normals.set(p.slice(3), count * 3);
      count++;
    }
  }
  return {
    mesh,
    update(sample) {
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
      count = 0;
      for (let z = 0; z < nz - 1; z++)
        for (let y = 0; y < ny - 1; y++)
          for (let x = 0; x < nx - 1; x++) {
            const base = z * stride + y * nx + x,
              ids = offsets.map((o) => base + o);
            let mask = 0;
            for (let i = 0; i < 8; i++) if (field[ids[i]] < 0) mask |= 1 << i;
            if (mask === 0 || mask === 255) continue;
            for (const tet of TETS) {
              const inside = [],
                outside = [];
              for (const corner of tet) (field[ids[corner]] < 0 ? inside : outside).push(ids[corner]);
              if (!inside.length || !outside.length) continue;
              if (inside.length === 1 || outside.length === 1) {
                const one = inside.length === 1 ? inside[0] : outside[0],
                  other = inside.length === 1 ? outside : inside;
                const points = other.map((p) => intersect(one, p));
                triangle(points[0], points[1], points[2]);
              } else {
                const a = intersect(inside[0], outside[0]),
                  b = intersect(inside[0], outside[1]),
                  c = intersect(inside[1], outside[0]),
                  d = intersect(inside[1], outside[1]);
                triangle(a, c, b);
                triangle(b, c, d);
              }
            }
          }
      geometry.setDrawRange(0, count);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.normal.needsUpdate = true;
    },
  };
}
