// A 3D arrow (round shaft and cone head) for the vectors: বেগ (velocity) and ত্বরণ (acceleration). set(from, dir,
// length) places it: the head keeps its size, the shaft stretches; very short arrows get a smaller head.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/** @param {{ color: THREE.ColorRepresentation, radius?: number, head?: number, headRadius?: number, name?: string }} o */
export function createArrow({ color, radius = 0.045, head = 0.26, headRadius = 0.11, name = 'Arrow' }) {
  const material = new THREE.MeshStandardMaterial({
    name: `${name}Material`,
    color,
    roughness: 0.45,
    metalness: 0,
    emissive: new THREE.Color(color).multiplyScalar(0.25),
  });
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true; // a drawing on the picture, not part of the vehicle
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 14).translate(0, 0.5, 0), material);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 22).translate(0, head / 2, 0), material);
  root.add(shaft, tip);
  const d = new THREE.Vector3();
  const end = new THREE.Vector3();

  return {
    root,
    material,
    /** The tip of the arrow (world coordinates, up to date after set). */
    tip: end,
    set(from, dir, length) {
      d.copy(dir).normalize();
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, d);
      const k = Math.min(1, length / (head * 1.6));
      const h = head * k;
      shaft.scale.set(1, Math.max(0.001, length - h), 1);
      tip.position.y = Math.max(0, length - h);
      tip.scale.setScalar(Math.max(k, 0.001));
      root.visible = length > 0.02;
      end.copy(from).addScaledVector(d, length);
    },
    setColor(c) {
      material.color.set(c);
      material.emissive.set(c).multiplyScalar(0.25);
    },
  };
}
