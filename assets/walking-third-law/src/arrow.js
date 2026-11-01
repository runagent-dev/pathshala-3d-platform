// A force arrow that stands out on every ground and wall: the colour inside a dark edge inside a white halo, drawn over
// the scene (no depth test), so an orange push never melts into sand and a crimson one stays clear over the wall or
// the dark cut of the ground. set(from, dir, length) as the kit's arrow; the edge and the halo reach a little past
// both ends, so the tip is outlined too.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';

const UP = new THREE.Vector3(0, 1, 0);
// transparent (even when fully opaque), so the arrows are drawn after the see-through puddle and foam, not under them
const flat = (name, color) =>
  new THREE.MeshBasicMaterial({ name, color, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false });

export function createVector(color, name, edgeColor = '#14263c') {
  const material = flat(name, color);
  const edgeMaterial = flat(`${name}Edge`, edgeColor);
  const haloMaterial = flat(`${name}Halo`, '#ffffff');
  const layers = [
    // [arrow, padding round the colour (m)]
    [createArrow({ name: `${name}Halo`, material: haloMaterial, radius: 0.034, head: 0.124, headRadius: 0.088, segments: 12 }), 0.019],
    [createArrow({ name: `${name}Outline`, material: edgeMaterial, radius: 0.027, head: 0.108, headRadius: 0.072, segments: 12 }), 0.009],
    [createArrow({ name, material, radius: 0.019, head: 0.09, headRadius: 0.055, segments: 12 }), 0],
  ];
  const root = new THREE.Group();
  root.name = name;
  root.visible = false;
  for (const [i, [arrow]] of layers.entries()) {
    root.add(arrow.root);
    arrow.root.traverse((o) => {
      o.renderOrder = 7 + i;
    });
  }
  const tip = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const start = new THREE.Vector3();
  let alpha = 1;
  return {
    root,
    material,
    tip,
    set(from, dir, length) {
      root.visible = length > 1e-9 && dir.lengthSq() > 1e-12 && alpha > 0.01;
      root.position.copy(from);
      direction.copy(dir).normalize();
      root.quaternion.setFromUnitVectors(UP, direction);
      for (const [arrow, pad] of layers) arrow.set(start.set(0, -pad, 0), UP, length + pad * 2.2);
      tip.copy(from).addScaledVector(direction, length);
    },
    setOpacity(a) {
      alpha = a;
      root.visible = a > 0.01;
      for (const m of [material, edgeMaterial, haloMaterial]) m.opacity = a;
    },
    hide() {
      root.visible = false;
    },
  };
}
