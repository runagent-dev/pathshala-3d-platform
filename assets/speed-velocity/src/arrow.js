// A 3D arrow (round shaft and cone head) for the vector quantities: বেগ on the stone, সরণ on the road.
// set(from, dir, length) places it; the head keeps its size, the shaft stretches.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * @param {{ color: THREE.ColorRepresentation, radius?: number, head?: number, headRadius?: number,
 *           opacity?: number, name?: string }} options
 */
export function createArrow({ color, radius = 0.03, head = 0.17, headRadius = 0.08, opacity = 1, name = 'Arrow' }) {
  const material = new THREE.MeshStandardMaterial({
    name: `${name}Material`,
    color,
    roughness: 0.45,
    metalness: 0,
    emissive: new THREE.Color(color).multiplyScalar(0.18),
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  });
  const root = new THREE.Group();
  root.name = name;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 16).translate(0, 0.5, 0), material);
  shaft.name = `${name}Shaft`;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 24).translate(0, head / 2, 0), material);
  tip.name = `${name}Head`;
  root.add(shaft, tip);
  const d = new THREE.Vector3();

  return {
    root,
    material,
    head,
    /** From a point, along a direction (any length), `length` long (head included). */
    set(from, dir, length) {
      d.copy(dir).normalize();
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, d);
      const body = Math.max(0.001, length - head);
      const k = Math.min(1, length / head); // very short arrows: a smaller head
      shaft.scale.set(1, body * (length > head ? 1 : 0.001), 1);
      tip.position.y = length > head ? body : 0;
      tip.scale.setScalar(k);
      root.visible = length > 0.001;
    },
    setOpacity(a) {
      material.opacity = a;
      root.visible = a > 0.01;
    },
  };
}
