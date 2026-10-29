// A small flat trolley with four rubber wheels (real size in metres): a steel deck 1.08 m × 0.74 m, its top 0.20 m
// above the floor, on four wheels of 0.09 m radius. The block is lifted onto it to show rolling friction. Origin: on
// the floor under the middle of the deck, +x forward. roll(d) turns the wheels for d metres travelled.
import * as THREE from 'three';

export const TROLLEY = { L: 1.08, W: 0.74, top: 0.2, wheel: 0.09, wheelX: 0.38, wheelZ: 0.37 };

const mat = (name, color, roughness = 0.6, metalness = 0) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness });

export function createTrolley() {
  const root = new THREE.Group();
  root.name = 'Trolley';
  const steel = mat('TrolleyDeck', '#f15236', 0.45, 0.55);
  const dark = mat('TrolleyIron', '#3d444d', 0.5, 0.6);
  const tyre = mat('Tyre', '#262a30', 0.92);
  const hubMat = mat('Hub', '#ffcc55', 0.35, 0.7);
  const { L, W, top, wheel: R } = TROLLEY;
  const add = (geo, m, x, y, z, parent = root) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const deckT = 0.04;
  add(new THREE.BoxGeometry(L, deckT, W), steel, 0, top - deckT / 2, 0);
  // a low rim round the deck, so the block sits in it
  for (const z of [-W / 2 + 0.003, W / 2 - 0.003]) add(new THREE.BoxGeometry(L, 0.007, 0.006), dark, 0, top + 0.0035, z);
  for (const x of [-L / 2 + 0.003, L / 2 - 0.003]) add(new THREE.BoxGeometry(0.006, 0.007, W - 0.012), dark, x, top + 0.0035, 0);
  // axles and brackets
  for (const x of [-TROLLEY.wheelX, TROLLEY.wheelX]) {
    add(new THREE.CylinderGeometry(0.004, 0.004, 2 * TROLLEY.wheelZ, 10).rotateX(Math.PI / 2), dark, x, R, 0);
    for (const z of [-W / 2 + 0.012, W / 2 - 0.012])
      add(new THREE.BoxGeometry(0.02, top - deckT - R + 0.004, 0.012), dark, x, (top - deckT + R) / 2, z);
  }
  // wheels: tyre, a light hub disc and three spokes (a mark that shows the turning)
  const wheels = [];
  for (const x of [-TROLLEY.wheelX, TROLLEY.wheelX])
    for (const z of [-TROLLEY.wheelZ, TROLLEY.wheelZ]) {
      const w = new THREE.Group();
      w.name = 'Wheel';
      add(new THREE.CylinderGeometry(R, R, 0.065, 32).rotateX(Math.PI / 2), tyre, 0, 0, 0, w);
      const face = Math.sign(z) * 0.033;
      add(new THREE.CylinderGeometry(R * 0.62, R * 0.62, 0.012, 24).rotateX(Math.PI / 2), hubMat, 0, 0, face, w);
      for (let i = 0; i < 3; i++) {
        const spoke = add(new THREE.BoxGeometry(R * 1.1, 0.015, 0.009), dark, 0, 0, face + Math.sign(z) * 0.0016, w);
        spoke.rotation.z = (i * Math.PI) / 3;
      }
      add(new THREE.CylinderGeometry(0.0055, 0.0055, 0.005, 12).rotateX(Math.PI / 2), dark, 0, 0, face + Math.sign(z) * 0.0032, w);
      w.position.set(x, R, z);
      root.add(w);
      wheels.push(w);
    }

  const handle = new THREE.Group();
  handle.name = 'TrolleyHandle';
  root.add(handle);
  for (const z of [-0.24, 0.24]) {
    add(new THREE.CylinderGeometry(0.018, 0.018, 0.76, 16), dark, -0.6, 0.57, z, handle);
    add(new THREE.BoxGeometry(0.1, 0.035, 0.035), dark, -0.55, top, z, handle);
  }
  add(new THREE.CylinderGeometry(0.028, 0.028, 0.54, 20).rotateX(Math.PI / 2), dark, -0.6, 0.95, 0, handle);
  return {
    root,
    roll(d) {
      for (const w of wheels) w.rotation.z = -d / R;
    },
  };
}
