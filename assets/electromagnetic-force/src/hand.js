// A simple original hand gripping the left end of the comb. Rounded forms keep the gesture legible on phones.
import * as THREE from 'three';
export function createHand(skin) {
  const hand = new THREE.Group();
  hand.name = 'HandHoldingComb';
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const oval = (name, x, y, z, sx, sy, sz, material = skin, angle = 0) => {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.rotation.z = angle;
    hand.add(mesh);
  };
  const cuff = new THREE.MeshStandardMaterial({ name: 'BlueCuff', color: 0x2168c5, roughness: 0.7 });
  oval('Sleeve', -124, 20, 0, 23, 15, 10, cuff, 0.12);
  oval('Wrist', -105, 21, 2, 22, 12, 8, skin, 0.12);
  oval('Palm', -83, 20, 3, 23, 18, 9, skin, 0.15);
  for (let i = 0; i < 4; i++) oval('CurledFinger', -66 - i * 3, 13 - i * 6, 5, 10, 4.6, 5.5, skin, -0.32);
  oval('Thumb', -66, 31, 8, 18, 6.5, 5.5, skin, -0.3);
  return hand;
}
