// A force arrow (round shaft and cone head), drawn over everything like an arrow on a printed diagram, so it
// stays visible where it passes into the desk. set(from, dir, length) places it (and says whether anything
// changed, so the caller can ask for a new frame); the head keeps its size, the shaft stretches. A helper, never
// exported to the GLB.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * @param {{ color: THREE.ColorRepresentation, radius?: number, head?: number, headRadius?: number, name?: string }} options
 */
export function createArrow({ color, radius = 1.2, head = 6, headRadius = 3.4, name = 'Arrow' }) {
  const material = new THREE.MeshStandardMaterial({
    name: `${name}Material`,
    color,
    roughness: 0.45,
    metalness: 0,
    emissive: new THREE.Color(color).multiplyScalar(0.25),
    depthTest: false,
    depthWrite: false,
  });
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  root.renderOrder = 10;
  root.visible = false;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 14).translate(0, 0.5, 0), material);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 20).translate(0, head / 2, 0), material);
  shaft.renderOrder = tip.renderOrder = 10;
  root.add(shaft, tip);
  const d = new THREE.Vector3();
  const end = new THREE.Vector3();
  const last = { from: new THREE.Vector3(Infinity, 0, 0), dir: new THREE.Vector3(), length: -1 };

  return {
    root,
    material,
    /** The point the arrow ends at (world), after the last set(). */
    tip: () => end,
    /** From a point, along a direction (any length), `length` long (head included); 0 hides it. True if it changed. */
    set(from, dir, length) {
      d.copy(dir).normalize();
      const visible = length > 0.01;
      if (!visible && !root.visible) return false;
      if (visible && root.visible && last.from.distanceToSquared(from) < 1e-6 && last.dir.equals(d) && Math.abs(last.length - length) < 1e-3)
        return false;
      last.from.copy(from);
      last.dir.copy(d);
      last.length = length;
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, d);
      end.copy(from).addScaledVector(d, length);
      const body = Math.max(0.001, length - head);
      const k = Math.min(1, length / head); // very short arrows: a smaller head
      shaft.scale.set(1, length > head ? body : 0.001, 1);
      tip.position.y = length > head ? body : 0;
      tip.scale.setScalar(Math.max(k, 0.001));
      root.visible = visible;
      return true;
    },
  };
}
