import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createBridge } from '@shared/bridge.js';

const params = new URLSearchParams(location.search);
const bg = params.get('bg') || 'light';
document.body.classList.add(bg);

const stage = createStage(document.getElementById('app'), { fov: 35, environment: bg === 'dark' ? 'studio' : 'studio-light' });
stage.camera.position.set(0, 1.2, 4);
stage.controls.target.set(0, 0, 0);

// Placeholder: replace with the real model.
const mesh = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.8, 0.28, 220, 32),
  new THREE.MeshPhysicalMaterial({ color: 0x5ab0ff, metalness: 0.3, roughness: 0.25, clearcoat: 1 }),
);
stage.scene.add(mesh);
stage.addTicker((dt) => {
  mesh.rotation.y += dt * 0.4;
  return true;
});

const bridge = createBridge({
  asset: '{{id}}',
  commands: {
    capture: ({ width, height }) => stage.capture({ width, height }),
  },
});
bridge.emit('ready', { asset: '{{id}}' });
