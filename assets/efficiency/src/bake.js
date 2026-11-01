// Fewer draw calls with the same detail: every mesh that never moves inside a group is merged into one mesh per
// material (in the group's own space), so the roof's hundred props or the winch's frame, battery and motor draw as a
// handful of meshes. Parts that move (shafts, gears, the pulley, the load) are passed in `skip` and stay as they are.
// Shared geometries are copied, never changed; the copies are disposed of once merged.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Merge the static meshes under `root` by material. Instanced meshes, points, sprites, lines and everything inside a
 * skipped object are left alone. A merged mesh casts or receives a shadow if any of its parts did.
 * @param {THREE.Object3D} root
 * @param {{ skip?: THREE.Object3D[] }} [options]
 * @returns {THREE.Mesh[]} the merged meshes
 */
export function bake(root, { skip = [] } = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const m = new THREE.Matrix4();
  /** @type {Map<THREE.Material, { geos: THREE.BufferGeometry[], cast: boolean, receive: boolean, name: string }>} */
  const buckets = new Map();
  /** @type {THREE.Mesh[]} */
  const merged = [];
  const visit = (o) => {
    for (const c of o.children) {
      if (skip.includes(c)) continue;
      const mesh = /** @type {THREE.Mesh} */ (c);
      if (mesh.isMesh && !(/** @type {any} */ (mesh).isInstancedMesh) && !Array.isArray(mesh.material) && mesh.visible) {
        m.multiplyMatrices(inv, mesh.matrixWorld);
        const g = mesh.geometry.clone().applyMatrix4(m);
        if (m.determinant() < 0 && g.index) {
          // a mirrored part: keep its faces turned outward
          const idx = g.index.array;
          for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
        }
        let b = buckets.get(mesh.material);
        if (!b) buckets.set(mesh.material, (b = { geos: [], cast: false, receive: false, name: mesh.material.name || mesh.name }));
        b.geos.push(g);
        b.cast ||= mesh.castShadow;
        b.receive ||= mesh.receiveShadow;
        merged.push(mesh);
      }
      visit(c);
    }
  };
  visit(root);
  for (const mesh of merged) {
    // anything left inside a merged part (a skipped child) moves up to the part's parent, where it was
    for (const c of [...mesh.children]) if (!merged.includes(/** @type {THREE.Mesh} */ (c))) mesh.parent?.attach(c);
    mesh.removeFromParent();
  }
  // empty groups left behind are removed too
  const prune = (o) => {
    for (const c of [...o.children]) {
      prune(c);
      if (c.type === 'Group' && c.children.length === 0 && !skip.includes(c)) c.removeFromParent();
    }
  };
  prune(root);
  /** @type {THREE.Mesh[]} */
  const out = [];
  for (const [material, { geos, cast, receive, name }] of buckets) {
    const keep = ['position', 'normal', 'uv', 'color'].filter((k) => geos.every((g) => g.attributes[k]));
    for (const g of geos) for (const k of Object.keys(g.attributes)) if (!keep.includes(k)) g.deleteAttribute(k);
    const list = geos.every((g) => g.index) ? geos : geos.map((g) => (g.index ? g.toNonIndexed() : g));
    const geo = mergeGeometries(list);
    for (const g of geos) g.dispose();
    for (const g of list) g.dispose();
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name || 'Merged';
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    mesh.renderOrder = 0;
    root.add(mesh);
    out.push(mesh);
  }
  return out;
}
