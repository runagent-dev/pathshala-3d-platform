// The desk's wood, shared by both scenes: the kit's wood with a wider grain, a little lighter (a soft glow of its
// own grain, so the colours stay valid in the GLB, where a colour above 1 is not allowed).
import * as THREE from 'three';

export function deskWood(materials) {
  const wood = materials.wood.clone();
  wood.name = 'DeskWood';
  wood.map = materials.wood.map.clone();
  wood.map.repeat.set(1 / 240, 1 / 240);
  wood.map.needsUpdate = true;
  wood.emissive = new THREE.Color(0xffffff);
  wood.emissiveMap = wood.map;
  wood.emissiveIntensity = 0.12;
  return wood;
}
