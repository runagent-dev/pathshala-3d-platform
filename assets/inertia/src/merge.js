// Fewer draw calls with the same detail: the parts of a model that never move relative to it are merged into one
// mesh per material (their placement baked in). The idea is the momentum figure's merge.js (figures never import
// from each other); this one also reaches into groups (the seats, the head, the bag).
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
 * Merge every mesh under `root` (at any depth, except those `skip` names and everything under them) into one mesh
 * per material, placed in `root`'s own frame. Returns the new meshes. The merged parts must not move on their own
 * afterwards (the root may: the bus drives, the head turns).
 * Plain colours with a similar finish can share one mesh: `paint` names a vertex-coloured material, and `paints`
 * says which materials it stands in for (their colour goes into the vertices).
 * @param {THREE.Object3D} root
 * @param {{ skip?: (o: THREE.Object3D) => boolean, prefix?: string, paint?: THREE.MeshStandardMaterial | null,
 *           paints?: (m: THREE.Material) => boolean }} [options]
 */
export function mergeStatic(root, { skip = () => false, prefix = '', paint = null, paints = () => false } = {}) {
  root.updateMatrixWorld(true);
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map();
  const found = [];
  const walk = (o) => {
    for (const child of o.children) {
      if (skip(child)) continue;
      if (child instanceof THREE.Mesh && !(child instanceof THREE.InstancedMesh)) {
        if (!Array.isArray(child.material) && child.material?.visible !== false) found.push(child);
      }
      walk(child);
    }
  };
  walk(root);
  const m = new THREE.Matrix4();
  for (const mesh of found) {
    m.multiplyMatrices(toRoot, mesh.matrixWorld);
    const g = mesh.geometry.clone().applyMatrix4(m);
    let material = mesh.material;
    if (paint && paints(material)) {
      const c = /** @type {any} */ (material).color;
      const n = g.attributes.position.count;
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.deleteAttribute('uv'); // the painted parts have no picture
      material = paint;
    }
    if (!groups.has(material)) groups.set(material, []);
    groups.get(material).push(g);
    mesh.removeFromParent();
  }
  // groups left empty (a seat whose parts were all merged) go too
  const empty = [];
  root.traverse((o) => {
    if (o !== root && o.type === 'Group' && o.children.length === 0 && !skip(o)) empty.push(o);
  });
  for (const o of empty) o.removeFromParent();
  const made = [];
  for (const [material, list] of groups) {
    const geo = list.length === 1 ? list[0] : mergeGeometries(alike(list));
    if (list.length > 1) for (const g of list) g.dispose();
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = `${prefix}${material.name || 'Part'}`;
    root.add(mesh);
    made.push(mesh);
  }
  return made;
}

/** One geometry from several placed copies: [geometry, matrix] pairs (the geometries are not changed). */
export function mergePlaced(pairs) {
  const list = pairs.map(([g, mx]) => g.clone().applyMatrix4(mx));
  const geo = mergeGeometries(alike(list));
  for (const g of list) g.dispose();
  return geo;
}
