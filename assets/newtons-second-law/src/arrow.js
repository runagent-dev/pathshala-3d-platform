import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
const UP = new THREE.Vector3(0, 1, 0);
const ZERO = new THREE.Vector3();
export function createVector(color, name, edgeColor = '#132b46') {
  const material = new THREE.MeshBasicMaterial({ name, color, depthTest: false, depthWrite: false, toneMapped: false });
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: edgeColor, depthTest: false, depthWrite: false, toneMapped: false });
  const edge = createArrow({ name: `${name}Outline`, material: edgeMaterial, radius: 0.044, head: 0.18, headRadius: 0.103 });
  const ink = createArrow({ name, material, radius: 0.029, head: 0.18, headRadius: 0.077 });
  const root = new THREE.Group();
  root.name = name;
  root.visible = false;
  root.add(edge.root, ink.root);
  edge.root.traverse((o) => {
    o.renderOrder = 8;
  });
  ink.root.traverse((o) => {
    o.renderOrder = 9;
  });
  const tip = new THREE.Vector3();
  const direction = new THREE.Vector3();
  return {
    root,
    material,
    tip,
    set(from, dir, length) {
      root.visible = length > 1e-9 && dir.lengthSq() > 1e-12;
      root.position.copy(from);
      direction.copy(dir).normalize();
      root.quaternion.setFromUnitVectors(UP, direction);
      edge.set(ZERO, UP, length);
      ink.set(ZERO, UP, length);
      tip.copy(from).addScaledVector(direction, length);
    },
    hide() {
      root.visible = false;
    },
  };
}
