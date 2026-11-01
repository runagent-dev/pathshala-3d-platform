// Around the house (not exported): plain, calm ground. No neighbours' houses, trees, poles or clouds: only the house
// wall, the pumps, the pipes and the tanks draw the eye.
import * as THREE from 'three';

export function createSurroundings() {
  const g = new THREE.Group();
  g.name = 'Surroundings';
  g.userData.noExport = true;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ name: 'Ground', color: '#b8a284', roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.012;
  ground.receiveShadow = true;
  g.add(ground);
  return g;
}
