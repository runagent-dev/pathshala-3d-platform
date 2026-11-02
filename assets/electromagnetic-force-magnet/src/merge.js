// Fewer draw calls with the same picture (the idea from balanced-forces and falling-bodies): the parts of a group that
// never move relative to each other are merged into one mesh per material (and per shadow setting), in the group's
// own frame. The scenery and the still parts are built part by part, as they read best in code, and merged once.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const ATTRS = ['position', 'normal', 'uv'];

/**
 * Merges every visible mesh under `group` (meshes inside meshes too), except the objects in `keep` and everything
 * under them, into one mesh per material, cast/receive shadow and export setting. The merged meshes are added to
 * `group` and the originals removed (their geometries disposed). Meshes in one of the plain colours listed in
 * `paint.from` (no textures) all go into one mesh in `paint.material`, their colours kept as vertex colours.
 * @param {THREE.Object3D} group
 * @param {{ keep?: THREE.Object3D[], paint?: { from: THREE.Material[], material: THREE.Material } }} [options]
 */
export function mergeStatic(group, { keep = [], paint } = {}) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const m = new THREE.Matrix4();
  /** @type {Map<string, { material: THREE.Material, cast: boolean, receive: boolean, noExport: boolean, order: number, geos: THREE.BufferGeometry[] }>} */
  const buckets = new Map();
  /** @type {THREE.Mesh[]} */
  const merged = [];
  const walk = (obj, noExport) => {
    for (const child of obj.children) {
      if (keep.includes(child) || !child.visible) continue;
      const skip = noExport || Boolean(child.userData.noExport);
      const mesh = /** @type {THREE.Mesh} */ (child);
      if (mesh.isMesh && !(/** @type {any} */ (mesh).isInstancedMesh) && !Array.isArray(mesh.material)) {
        const own = /** @type {THREE.MeshStandardMaterial} */ (mesh.material);
        const painted = Boolean(paint?.from.includes(own));
        const mat = painted && paint ? paint.material : own;
        const key = `${mat.uuid}|${mesh.castShadow}|${mesh.receiveShadow}|${skip}|${mesh.renderOrder}`;
        if (!buckets.has(key))
          buckets.set(key, { material: mat, cast: mesh.castShadow, receive: mesh.receiveShadow, noExport: skip, order: mesh.renderOrder, geos: [] });
        const g = mesh.geometry.clone();
        for (const name of Object.keys(g.attributes)) if (!ATTRS.includes(name)) g.deleteAttribute(name);
        if (painted) {
          const n = g.attributes.position.count;
          const rgb = new Float32Array(n * 3);
          for (let i = 0; i < n; i++) own.color.toArray(rgb, i * 3);
          g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
        }
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
  for (const b of buckets.values()) {
    const indexed = b.geos.every((g) => g.index);
    const geos = indexed ? b.geos : b.geos.map((g) => (g.index ? g.toNonIndexed() : g));
    const geometry = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!geometry) throw new Error(`mergeStatic: the parts in ${b.material.name || 'a material'} do not match`);
    const out = new THREE.Mesh(geometry, b.material);
    out.name = b.material.name || 'Merged';
    out.castShadow = b.cast;
    out.receiveShadow = b.receive;
    out.renderOrder = b.order;
    if (b.noExport) out.userData.noExport = true;
    group.add(out);
    if (geos.length > 1) for (const g of geos) g.dispose();
  }
  for (const mesh of merged) {
    mesh.removeFromParent();
    mesh.geometry.dispose();
  }
  return group;
}
