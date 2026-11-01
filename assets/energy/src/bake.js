// Fewer draw calls with the same detail: every mesh that never moves inside a group is merged into one mesh per
// material (in the group's own space), so a bicycle of 110 small parts draws as a dozen meshes. Parts that move
// (wheels, cranks, limbs) are passed in `skip` and stay as they are, with their own children.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Merge the static meshes under `root` by material. Instanced meshes, lines, invisible helpers and everything inside
 * a skipped object are left alone. A merged mesh casts or receives a shadow if any of its parts did.
 * @param {THREE.Object3D} root
 * @param {{ skip?: THREE.Object3D[] }} [options]
 */
export function bake(root, { skip = [] } = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const m = new THREE.Matrix4();
  /** @type {Map<THREE.Material, { geos: THREE.BufferGeometry[], cast: boolean, receive: boolean }>} */
  const buckets = new Map();
  /** @type {THREE.Mesh[]} */
  const merged = [];
  const visit = (o) => {
    for (const c of o.children) {
      if (skip.includes(c)) continue;
      const mesh = /** @type {THREE.Mesh} */ (c);
      if (mesh.isMesh && !(/** @type {any} */ (mesh).isInstancedMesh) && !Array.isArray(mesh.material) && mesh.material.visible !== false) {
        m.multiplyMatrices(inv, mesh.matrixWorld);
        const g = mesh.geometry.clone().applyMatrix4(m);
        if (m.determinant() < 0 && g.index) {
          // a mirrored part: keep its faces turned outward
          const idx = g.index.array;
          for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
        }
        let b = buckets.get(mesh.material);
        if (!b) buckets.set(mesh.material, (b = { geos: [], cast: false, receive: false }));
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
  for (const [material, { geos, cast, receive }] of buckets) {
    const keep = ['position', 'normal', 'uv', 'color'].filter((k) => geos.every((g) => g.attributes[k]));
    for (const g of geos) for (const k of Object.keys(g.attributes)) if (!keep.includes(k)) g.deleteAttribute(k);
    const list = geos.every((g) => g.index) ? geos : geos.map((g) => (g.index ? g.toNonIndexed() : g));
    const mesh = new THREE.Mesh(mergeGeometries(list), material);
    for (const g of geos) g.dispose();
    mesh.name = material.name || 'Merged';
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    root.add(mesh);
  }
  return root;
}
