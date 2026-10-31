// Small helpers for building the scene: many small parts of one material as one mesh (fewer draw calls, so phones
// stay smooth), a run of pipe with fittings at its bends, a sagging cable.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Collects geometries placed in the world (or in a group's frame) and merges them into one mesh.
 * `add(geo, x, y, z, rx, ry, rz)` places one; `mesh(mat, name)` returns the merged mesh.
 */
export function parts() {
  /** @type {THREE.BufferGeometry[]} */
  const list = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const one = new THREE.Vector3(1, 1, 1);
  return {
    add(geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, scale = one) {
      m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), scale);
      return this.push(geo.applyMatrix4(m));
    },
    /** A geometry already placed. */
    push(geo) {
      for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geo.deleteAttribute(name);
      list.push(geo);
      return this;
    },
    get count() {
      return list.length;
    },
    mesh(mat, name = '') {
      // indexed when every part is (smaller to draw and to export), else all without an index
      const all = list.every((g) => g.index) ? list : list.map((g) => (g.index ? g.toNonIndexed() : g));
      const mesh = new THREE.Mesh(all.length ? mergeGeometries(all) : new THREE.BufferGeometry(), mat);
      mesh.name = name;
      return mesh;
    },
  };
}

/** A cylinder between two points (for pipes, rods and posts). */
export function rod(a, b, r, seg = 12) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

/** A run of pipe through points, with a fitting at every bend; one mesh for the pipe, one for the fittings. */
export function pipeRun(points, mat, fitMat, r) {
  const g = new THREE.Group();
  const pipe = parts();
  const fits = parts();
  for (let i = 0; i < points.length - 1; i++) if (points[i].distanceTo(points[i + 1]) > 1e-4) pipe.push(rod(points[i], points[i + 1], r, 16));
  for (let i = 1; i < points.length - 1; i++) fits.add(new THREE.SphereGeometry(r * 1.32, 16, 12), points[i].x, points[i].y, points[i].z);
  // a coupling every metre or so along the long runs
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = a.distanceTo(b);
    for (let d = 0.9; d < len - 0.3; d += 1.1) {
      const p = a.clone().lerp(b, d / len);
      fits.push(
        rod(
          p.clone().addScaledVector(b.clone().sub(a).normalize(), -0.035),
          p.clone().addScaledVector(b.clone().sub(a).normalize(), 0.035),
          r * 1.18,
          16,
        ),
      );
    }
  }
  g.add(pipe.mesh(mat, 'Pipe'), fits.mesh(fitMat, 'Fittings'));
  return g;
}

/** A soft cable through points (a smooth curve). */
export function cable(points, r = 0.007) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2), Math.max(8, points.length * 10), r, 6);
}
