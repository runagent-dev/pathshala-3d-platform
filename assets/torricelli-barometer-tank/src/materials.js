// The materials the scene shares: clear glass (the tank).
import * as THREE from 'three';

export function sceneMaterials() {
  return {
    glass: new THREE.MeshPhysicalMaterial({
      name: 'Glass',
      color: '#e6f4ff',
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      side: THREE.FrontSide,
      envMapIntensity: 0.9,
      specularIntensity: 0.8,
    }),
  };
}
