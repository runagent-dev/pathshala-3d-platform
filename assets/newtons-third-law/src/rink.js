// The smooth floor the two skaters stand on: a pale slab with a line every half metre (so the distance each one goes
// can be read off against the floor) and a heavier line where they started. Metres, the top of the floor at y = 0.
import * as THREE from 'three';

export const RINK = { half: 7, depth: 1.3 };

export function createRink(half = RINK.half) {
  const root = new THREE.Group();
  root.name = 'Rink';
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(half * 2, 0.06, RINK.depth),
    new THREE.MeshStandardMaterial({ name: 'Floor', color: '#e1eaf3', roughness: 0.55, metalness: 0 }),
  );
  slab.position.y = -0.03;
  slab.receiveShadow = true;
  root.add(slab);
  const line = new THREE.MeshStandardMaterial({ name: 'FloorLine', color: '#b6c4d3', roughness: 0.7, metalness: 0 });
  const start = new THREE.MeshStandardMaterial({ name: 'StartLine', color: '#6d8099', roughness: 0.7, metalness: 0 });
  const tick = new THREE.BoxGeometry(0.012, 0.004, RINK.depth - 0.04);
  for (let k = -Math.floor(half / 0.5) + 1; k < half / 0.5; k++) {
    const m = new THREE.Mesh(tick, k === 0 ? start : line);
    m.position.set(k * 0.5, 0.001, 0);
    if (k === 0) m.scale.x = 2.2;
    root.add(m);
  }
  return { root };
}
