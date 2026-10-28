// Symbols are explanatory markers, not particles to scale. Both signs on the paper mean NET NEUTRAL.
import * as THREE from 'three';
export function createChargeSymbol(positive, radius = 4.8) {
  const group = new THREE.Group();
  group.name = positive ? 'PositiveCharge' : 'NegativeCharge';
  group.userData.noExport = true;
  const colour = new THREE.MeshBasicMaterial({ color: positive ? 0xef4f55 : 0x1976d2, toneMapped: false, depthTest: false });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, depthTest: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), colour);
  const horizontal = new THREE.Mesh(new THREE.PlaneGeometry(radius * 1.15, radius * 0.25), white);
  horizontal.position.z = 0.1;
  group.add(disc, horizontal);
  if (positive) {
    const vertical = horizontal.clone();
    vertical.rotation.z = Math.PI / 2;
    group.add(vertical);
  }
  group.traverse((mesh) => {
    if (mesh instanceof THREE.Mesh) mesh.renderOrder = mesh === disc ? 8 : 9;
  });
  return group;
}
