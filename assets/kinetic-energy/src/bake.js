// Fewer draw calls with the same detail: every mesh that never moves inside a group is merged into one mesh per
// material (in the group's own space), so an archer of ninety small parts draws as a couple of dozen meshes. Parts
// that move (the arms, the bow's limbs and string) are passed in `skip` and stay as they are, with their children.
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
      if (
        mesh.isMesh &&
        mesh.visible &&
        !(/** @type {any} */ (mesh).isInstancedMesh) &&
        !Array.isArray(mesh.material) &&
        mesh.material.visible !== false
      ) {
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

/**
 * Plain-coloured parts with a similar finish can share one material: each listed mesh gets its own copy of its
 * geometry with its material's colour written into the vertices, and the shared vertex-coloured `target` material.
 * Run before bake(), so they merge into one mesh.
 * @param {THREE.Object3D} root
 * @param {THREE.Material[]} from
 * @param {THREE.Material} target
 */
export function paint(root, from, target) {
  root.traverse((o) => {
    const mesh = /** @type {THREE.Mesh} */ (o);
    if (!mesh.isMesh || !from.includes(/** @type {THREE.Material} */ (mesh.material))) return;
    mesh.geometry = colourGeometry(mesh.geometry, /** @type {THREE.MeshStandardMaterial} */ (mesh.material).color);
    mesh.material = target;
  });
}

/** A copy of `geometry` with every vertex in `color` (linear, as three keeps material colours). */
export function colourGeometry(geometry, color) {
  const g = geometry.clone();
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.set([color.r, color.g, color.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
