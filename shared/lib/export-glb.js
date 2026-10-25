// GLB export for every 3D figure: the model as it is now, in metres, readable by other glTF tools.
//
//   const glb = await exportGLB(app.exportRoot(), { units: 'mm', name: 'screw-gauge', extras: { pathshala: {…} } });
//
// The figure's own scene is not touched: a copy is exported. In the copy:
//   - objects with userData.noExport (and anything `skip(object)` says) are left out, as are helpers and sprites;
//   - instanced meshes (tick marks…) become ordinary meshes with vertex colours, which every glTF viewer reads;
//   - thick lines (three's Line2 / LineSegments2) become plain glTF lines in their colour (glTF has no line width);
//   - the whole model is scaled from `units` to metres (glTF's unit);
//   - text drawn on canvases is embedded as PNG textures, node names are kept (so parts can be animated).
// Returns an ArrayBuffer (binary glTF).
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const UNIT_TO_METRES = { mm: 0.001, cm: 0.01, m: 1 };

/**
 * @param {THREE.Object3D} root
 * @param {{ units?: string, name?: string, extras?: object, skip?: (object: THREE.Object3D) => boolean, bakeInstances?: boolean,
 *           maxTextureSize?: number }} [options]
 * @returns {Promise<ArrayBuffer>}
 */
export async function exportGLB(
  root,
  { units = 'm', name = root.name || 'figure', extras = {}, skip = () => false, bakeInstances = true, maxTextureSize = 2048 } = {},
) {
  root.updateMatrixWorld(true);
  const copy = root.clone(true);
  const lines = bakeThickLines(copy); // before the shader materials are dropped: LineMaterial is one
  const drop = [];
  copy.traverse((ob) => {
    if (ob === copy) return;
    const material = /** @type {any} */ (ob).material;
    if (ob.userData.noExport || skip(ob) || ob instanceof THREE.Sprite || ob.type.endsWith('Helper') || material?.isShaderMaterial) drop.push(ob);
  });
  for (const ob of drop) ob.removeFromParent();
  const made = [...lines, ...(bakeInstances ? bakeInstancedMeshes(copy) : [])];

  const top = new THREE.Group();
  top.name = name;
  top.scale.setScalar(UNIT_TO_METRES[units] ?? 1);
  top.userData = { ...extras, units: 'm', sourceUnits: units };
  top.add(copy);
  try {
    return /** @type {ArrayBuffer} */ (await new GLTFExporter().parseAsync(top, { binary: true, onlyVisible: true, maxTextureSize }));
  } finally {
    top.remove(copy);
    for (const g of made) g.dispose();
  }
}

/**
 * Replaces each thick line (Line2, LineSegments2) under `root` by a LineSegments with the same segments and colour
 * (and vertex colours if it has them). Returns the new geometries.
 * @param {THREE.Object3D} root
 */
export function bakeThickLines(root) {
  /** @type {any[]} */
  const list = [];
  root.traverse((ob) => /** @type {any} */ (ob).isLineSegments2 && list.push(ob));
  const made = [];
  for (const ob of list) {
    const g = ob.geometry;
    const start = g.attributes.instanceStart;
    const end = g.attributes.instanceEnd;
    const n = start ? Math.min(start.count, g.instanceCount ?? Infinity) : 0;
    const parent = ob.parent;
    if (!n || !parent) {
      ob.removeFromParent();
      continue;
    }
    const m = ob.material;
    const colourStart = m.vertexColors && g.attributes.instanceColorStart;
    const colourEnd = m.vertexColors && g.attributes.instanceColorEnd;
    const pos = new Float32Array(n * 6);
    const col = colourStart && colourEnd ? new Float32Array(n * 6) : null;
    for (let i = 0; i < n; i++) {
      pos.set([start.getX(i), start.getY(i), start.getZ(i), end.getX(i), end.getY(i), end.getZ(i)], i * 6);
      if (col)
        col.set([colourStart.getX(i), colourStart.getY(i), colourStart.getZ(i), colourEnd.getX(i), colourEnd.getY(i), colourEnd.getZ(i)], i * 6);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (col) geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    made.push(geometry);
    const material = new THREE.LineBasicMaterial({
      name: m.name,
      color: m.color,
      vertexColors: !!col,
      opacity: m.opacity,
      transparent: m.transparent,
    });
    const line = new THREE.LineSegments(geometry, material);
    line.name = ob.name || 'Line';
    line.visible = ob.visible;
    line.position.copy(ob.position);
    line.quaternion.copy(ob.quaternion);
    line.scale.copy(ob.scale);
    line.userData = { ...ob.userData };
    parent.children.splice(parent.children.indexOf(ob), 1, line);
    line.parent = parent;
    ob.parent = null;
  }
  return made;
}

/** Replaces each InstancedMesh under `root` by one merged Mesh (instance colours become vertex colours). */
export function bakeInstancedMeshes(root) {
  const list = [];
  root.traverse((ob) => ob.isInstancedMesh && list.push(ob));
  const made = [];
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  for (const im of list) {
    const parts = [];
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, m);
      const g = im.geometry.clone().applyMatrix4(m);
      if (im.instanceColor) {
        im.getColorAt(i, c);
        const n = g.attributes.position.count;
        const colours = new Float32Array(n * 3);
        for (let k = 0; k < n; k++) colours.set([c.r, c.g, c.b], k * 3);
        g.setAttribute('color', new THREE.BufferAttribute(colours, 3));
      }
      parts.push(g);
    }
    const merged = parts.length ? mergeGeometries(parts, false) : null;
    for (const g of parts) g.dispose();
    if (!merged) {
      im.removeFromParent();
      continue;
    }
    made.push(merged);
    const material = (Array.isArray(im.material) ? im.material[0] : im.material).clone();
    if (im.instanceColor) material.vertexColors = true;
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = im.name || 'Instances';
    mesh.visible = im.visible;
    mesh.position.copy(im.position);
    mesh.quaternion.copy(im.quaternion);
    mesh.scale.copy(im.scale);
    mesh.userData = { ...im.userData };
    const parent = im.parent;
    parent.children.splice(parent.children.indexOf(im), 1, mesh);
    mesh.parent = parent;
    im.parent = null;
  }
  return made;
}
