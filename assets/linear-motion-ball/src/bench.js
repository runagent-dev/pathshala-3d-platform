// A plain lab bench top, in metres: the flat surface (সমতলপৃষ্ঠ) the stand stands on and the ball lands on. A
// light beech-coloured top with a darker edge band and a soft grey landing mat flush with it. The floor is y = 0; the top
// is at BOARD.surface.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BENCH, BOARD } from './motion.js';

export function createBench() {
  const root = new THREE.Group();
  root.name = 'Bench';
  const { x0, x1, z0, z1, thick } = BENCH;
  const w = x1 - x0;
  const d = z1 - z0;
  const topMat = new THREE.MeshStandardMaterial({ name: 'BenchTop', color: 0xe2c79b, roughness: 0.7 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(w, thick, d, 3, 0.008), topMat);
  top.position.set((x0 + x1) / 2, BOARD.surface - thick / 2, (z0 + z1) / 2);
  top.receiveShadow = true;
  root.add(top);
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'BenchEdge', color: 0x3d6f86, roughness: 0.6 });
  const edge = new THREE.Mesh(new RoundedBoxGeometry(w + 0.012, 0.03, d + 0.012, 3, 0.006), edgeMat);
  edge.position.copy(top.position);
  edge.position.y = BOARD.surface - thick - 0.012;
  root.add(edge);
  // a rubber landing mat, flush with the top (drawn on it), where both motions end
  const matMat = new THREE.MeshStandardMaterial({
    name: 'LandingMat',
    color: 0x8a9aa8,
    roughness: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(BENCH.mat.x1 - BENCH.mat.x0, BENCH.mat.z1 - BENCH.mat.z0), matMat);
  mat.rotation.x = -Math.PI / 2;
  mat.position.set((BENCH.mat.x0 + BENCH.mat.x1) / 2, BOARD.surface + 0.0004, (BENCH.mat.z0 + BENCH.mat.z1) / 2);
  mat.receiveShadow = true;
  root.add(mat);
  return { root };
}
