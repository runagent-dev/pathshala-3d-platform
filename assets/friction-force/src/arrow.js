import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
const UP = new THREE.Vector3(0, 1, 0);
const ZERO = new THREE.Vector3();
const BACK = new THREE.Vector3(0, -0.012, 0);
// A bold force arrow in flat colour inside a white outline that runs round the head's tip too, drawn over the scene,
// so it reads on the blue wall, the grey floor and the red crate alike.
const PAD = 0.012;
export function createVector(color, name, edgeColor = '#ffffff') {
  const material = new THREE.MeshBasicMaterial({ name, color, depthTest: false, depthWrite: false, toneMapped: false });
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: edgeColor, depthTest: false, depthWrite: false, toneMapped: false });
  const edge = createArrow({
    name: `${name}Outline`,
    material: edgeMaterial,
    radius: 0.022 + PAD,
    head: 0.1 + PAD * 2.8,
    headRadius: 0.06 + PAD * 1.8,
  });
  const ink = createArrow({ name, material, radius: 0.022, head: 0.1, headRadius: 0.06 });
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
      edge.set(BACK, UP, length + PAD * 2.2);
      ink.set(ZERO, UP, length);
      tip.copy(from).addScaledVector(direction, length);
    },
    setOpacity(alpha) {
      root.visible = alpha > 0.01;
      for (const m of [material, edgeMaterial]) {
        m.transparent = alpha < 1;
        m.opacity = alpha;
      }
    },
    hide() {
      root.visible = false;
    },
  };
}
