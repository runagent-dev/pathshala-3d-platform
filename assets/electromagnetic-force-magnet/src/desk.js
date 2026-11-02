// The magnet example's materials: a plain warm bench (no grain: the coil, the cell and the magnet stand out on it),
// and copper, brass and steel that take their look from the studio reflections.
import * as THREE from 'three';

export function benchMaterials() {
  const wood = new THREE.MeshStandardMaterial({ name: 'DeskWood', color: 0xb98a5e, roughness: 0.75, metalness: 0 });
  return {
    wood,
    copper: new THREE.MeshStandardMaterial({ name: 'Copper', color: 0xd88a5a, metalness: 1, roughness: 0.3 }),
    brass: new THREE.MeshStandardMaterial({ name: 'Brass', color: 0xd7a94b, metalness: 1, roughness: 0.28 }),
    steel: new THREE.MeshStandardMaterial({ name: 'Steel', color: 0xd4d9df, metalness: 1, roughness: 0.42 }),
  };
}
