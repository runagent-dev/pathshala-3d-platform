// A 3D arrow for vectors (velocity, displacement, force…): a round shaft and a cone head. It is made of meshes, so
// it is lit like the model, shows in the magnifier, keeps its thickness in every capture and exports to GLB.
//
//   const arrow = createArrow({ color: '#d9480f', radius: 0.01 });   // sizes in the figure's units
//   scene.add(arrow.root);
//   arrow.set(from, dir, length);   // from a point along a direction (any length), `length` long, head included
//   arrow.setVector(from, vector);  // or from a point to from + vector
//   arrow.tip                       // where the head ends (world units of the arrow's parent)
//
// The head keeps its size and the shaft stretches; an arrow shorter than its head gets a smaller head, so a short
// vector still points the right way. Length 0 hides it.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * @param {{ color?: THREE.ColorRepresentation, radius?: number, head?: number, headRadius?: number, opacity?: number,
 *           material?: THREE.Material, name?: string, segments?: number }} [options]
 *   radius: the shaft's; head: the head's length (default 6 × radius); headRadius (default 2.6 × radius);
 *   material: your own (else a lit one in `color`, slightly glowing so it reads in shadow).
 */
export function createArrow({
  color = '#1f5fae',
  radius = 0.01,
  head = radius * 6,
  headRadius = radius * 2.6,
  opacity = 1,
  material,
  name = 'Arrow',
  segments = 16,
} = {}) {
  const mat =
    material ||
    new THREE.MeshStandardMaterial({
      name: `${name}Material`,
      color,
      roughness: 0.45,
      metalness: 0,
      emissive: color,
      emissiveIntensity: 0.2,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
    });
  const root = new THREE.Group();
  root.name = name;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, segments).translate(0, 0.5, 0), mat);
  shaft.name = `${name}Shaft`;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, segments + 8).translate(0, head / 2, 0), mat);
  cone.name = `${name}Head`;
  root.add(shaft, cone);
  root.visible = false;
  const tip = new THREE.Vector3();
  const d = new THREE.Vector3();
  let placed = false; // set() gave it a length
  let alpha = opacity;

  function set(from, dir, length) {
    tip.copy(from);
    d.copy(dir);
    const n = d.length();
    placed = length > 1e-9 && n > 1e-12;
    root.visible = placed && alpha > 0.01;
    if (!placed) return;
    d.divideScalar(n);
    root.position.copy(from);
    root.quaternion.setFromUnitVectors(UP, d);
    const h = Math.min(head, length * 0.6); // a short arrow: a smaller head, same shape
    const body = length - h;
    shaft.visible = body > 1e-9;
    shaft.scale.set(1, Math.max(body, 1e-6), 1);
    cone.position.y = body;
    cone.scale.setScalar(h / head);
    tip.addScaledVector(d, length);
  }

  return {
    root,
    material: mat,
    /** The end of the head (in the arrow's parent's space), after set(). */
    tip,
    head,
    /**
     * @param {THREE.Vector3} from
     * @param {THREE.Vector3} dir any length
     * @param {number} length head included
     */
    set,
    /** From `from` to `from + vector`. @param {THREE.Vector3} from @param {THREE.Vector3} vector */
    setVector(from, vector) {
      set(from, vector, vector.length());
    },
    /** Fade the arrow (0…1); below 0.01 it is hidden. @param {number} a */
    setOpacity(a) {
      alpha = a;
      mat.opacity = a;
      if (!material && mat.transparent !== a < 1) {
        mat.transparent = a < 1;
        mat.depthWrite = a >= 1;
        mat.needsUpdate = true;
      }
      root.visible = placed && a > 0.01;
    },
    hide() {
      placed = false;
      root.visible = false;
    },
    dispose() {
      shaft.geometry.dispose();
      cone.geometry.dispose();
      if (!material) mat.dispose();
      root.removeFromParent();
    },
  };
}
