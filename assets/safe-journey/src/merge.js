// (The same helpers as the sister figure momentum.)
// Fewer draw calls with the same detail: the static parts of a model are merged into one mesh per material (their
// placement baked in), and repeated parts that move (wheels) are drawn as one InstancedMesh per material.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** The geometries in a list, made alike for merging: all indexed or all not, with the same attributes. */
function alike(list) {
  const indexed = list.every((g) => g.index);
  const out = list.map((g) => (indexed ? g : g.index ? g.toNonIndexed() : g));
  const names = Object.keys(out[0].attributes).filter((n) => out.every((g) => g.attributes[n]));
  for (const g of out) for (const n of Object.keys(g.attributes)) if (!names.includes(n)) g.deleteAttribute(n);
  return out;
}

/**
 * Merge the meshes directly under `parent` (except those `skip` names) into one mesh per material, each mesh's
 * placement baked into its geometry. Returns the new meshes. The parts must not move on their own afterwards.
 * @param {THREE.Object3D} parent
 * @param {{ skip?: (mesh: THREE.Mesh) => boolean, prefix?: string }} [options]
 */
export function mergeByMaterial(parent, { skip = () => false, prefix = '' } = {}) {
  const groups = new Map();
  for (const child of [...parent.children]) {
    if (!(child instanceof THREE.Mesh) || child instanceof THREE.InstancedMesh || skip(child)) continue;
    if (Array.isArray(child.material) || child.material?.visible === false) continue;
    child.updateMatrix();
    const g = child.geometry.clone().applyMatrix4(child.matrix);
    if (!groups.has(child.material)) groups.set(child.material, []);
    groups.get(child.material).push(g);
    parent.remove(child);
  }
  const made = [];
  for (const [material, list] of groups) {
    const geo = list.length === 1 ? list[0] : mergeGeometries(alike(list));
    if (list.length > 1) for (const g of list) g.dispose();
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = `${prefix}${material.name || 'Part'}`;
    parent.add(mesh);
    made.push(mesh);
  }
  return made;
}

/** One geometry from several placed copies: [geometry, matrix] pairs (the geometries are not changed). */
export function mergePlaced(pairs) {
  const list = pairs.map(([g, m]) => g.clone().applyMatrix4(m));
  const geo = mergeGeometries(alike(list));
  for (const g of list) g.dispose();
  return geo;
}

/**
 * Repeated parts that turn about their own axle (wheels): one InstancedMesh per [geometry, material], with an
 * instance at each spot. set(i, angle) turns the i-th; call commit() after a round of set().
 * @param {THREE.Object3D} parent
 * @param {Array<[THREE.BufferGeometry, THREE.Material]>} parts
 * @param {THREE.Vector3[]} spots
 * @param {string} name
 */
export function instancedWheels(parent, parts, spots, name) {
  const meshes = parts.map(([geo, material], k) => {
    const m = new THREE.InstancedMesh(geo, material, spots.length);
    m.name = `${name}${k ? `_${material.name}` : ''}`;
    m.frustumCulled = false; // small, and always near the body it belongs to
    parent.add(m);
    return m;
  });
  const dummy = new THREE.Object3D();
  const set = (i, angle) => {
    dummy.position.copy(spots[i]);
    dummy.rotation.set(0, 0, angle);
    dummy.updateMatrix();
    for (const m of meshes) m.setMatrixAt(i, dummy.matrix);
  };
  const commit = () => {
    for (const m of meshes) m.instanceMatrix.needsUpdate = true;
  };
  for (let i = 0; i < spots.length; i++) set(i, 0);
  commit();
  return { meshes, set, commit };
}
