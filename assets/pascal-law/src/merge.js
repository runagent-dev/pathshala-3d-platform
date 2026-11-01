// Fewer draw calls with the same picture: the parts of a group that never move relative to each other are merged into
// one mesh per material (and per shadow setting), in the group's own frame. The lift and the workshop are built part
// by part, as they read best in code, and merged once at the end. (The idea is the one in hanging-weight-pull; figures
// never import each other.)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Merges every visible mesh under `group` (meshes inside meshes too), except the objects in `keep` and everything
 * under them, into one mesh per material, cast/receive shadow, export setting and draw order. The merged meshes are
 * added to `group` and the originals removed (their geometries disposed). Vertex colours are kept for materials that
 * use them. Returns the merged meshes.
 * @param {THREE.Object3D} group
 * @param {{ keep?: THREE.Object3D[] }} [options]
 * @returns {THREE.Mesh[]}
 */
export function mergeStatic(group, { keep = [] } = {}) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const m = new THREE.Matrix4();
  /** @type {Map<string, { material: THREE.Material, cast: boolean, receive: boolean, noExport: boolean, order: number, name: string, geos: THREE.BufferGeometry[] }>} */
  const buckets = new Map();
  /** @type {THREE.Mesh[]} */
  const merged = [];
  const walk = (obj, noExport) => {
    for (const child of [...obj.children]) {
      if (keep.includes(child) || !child.visible) continue;
      const skip = noExport || Boolean(child.userData.noExport);
      const mesh = /** @type {THREE.Mesh} */ (child);
      if (mesh.isMesh && !(/** @type {any} */ (mesh).isInstancedMesh) && !Array.isArray(mesh.material)) {
        const mat = /** @type {THREE.MeshStandardMaterial} */ (mesh.material);
        const key = `${mat.uuid}|${mesh.castShadow}|${mesh.receiveShadow}|${skip}|${mesh.renderOrder}`;
        if (!buckets.has(key))
          buckets.set(key, {
            material: mat,
            cast: mesh.castShadow,
            receive: mesh.receiveShadow,
            noExport: skip,
            order: mesh.renderOrder,
            name: mat.name || mesh.name,
            geos: [],
          });
        const keepAttrs = mat.vertexColors ? ['position', 'normal', 'uv', 'color'] : ['position', 'normal', 'uv'];
        const g = mesh.geometry.clone();
        for (const name of Object.keys(g.attributes)) if (!keepAttrs.includes(name)) g.deleteAttribute(name);
        g.morphAttributes = {};
        g.clearGroups();
        g.applyMatrix4(m.multiplyMatrices(inv, mesh.matrixWorld));
        buckets.get(key).geos.push(g);
        merged.push(mesh);
      }
      walk(child, skip);
    }
  };
  walk(group, false);
  /** @type {THREE.Mesh[]} */
  const out = [];
  for (const b of buckets.values()) {
    const indexed = b.geos.every((g) => g.index);
    const geos = indexed ? b.geos : b.geos.map((g) => (g.index ? g.toNonIndexed() : g));
    const geometry = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!geometry) throw new Error(`mergeStatic: the parts in ${b.name || 'a material'} do not match`);
    const mesh = new THREE.Mesh(geometry, b.material);
    mesh.name = b.name || 'Merged';
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.renderOrder = b.order;
    if (b.noExport) mesh.userData.noExport = true;
    group.add(mesh);
    out.push(mesh);
    if (geos.length > 1) for (const g of geos) g.dispose();
  }
  for (const mesh of merged) {
    mesh.removeFromParent();
    mesh.geometry.dispose();
  }
  // groups left empty by the merge go too
  for (const child of [...group.children])
    if (child.type === 'Group' && child.children.length === 0 && !keep.includes(child)) child.removeFromParent();
  return out;
}
