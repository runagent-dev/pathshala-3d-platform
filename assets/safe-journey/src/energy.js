// The car's kinetic energy as amber cubes in a square: one cube is its kinetic energy at 20 km/h, and at a speed v
// the cubes make a square of side v / 20 (so its area is (v / 20)²: 1, 4, 9 cubes at 20, 40, 60 km/h). Between
// whole speeds the last row and column are part cubes, so the area is always exact (30 km/h: 1.5 × 1.5 = 2.25).
// The square stands upright facing the viewer; its origin is the middle of its bottom edge.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const ENERGY = { cube: 1.0, depth: 0.6, gap: 0.08, max: 4, color: '#f59f00' };

export function createEnergy() {
  const root = new THREE.Group();
  root.name = 'KineticEnergy';
  const material = new THREE.MeshStandardMaterial({
    name: 'KineticEnergyMaterial',
    color: ENERGY.color,
    roughness: 0.5,
    metalness: 0,
    emissive: ENERGY.color,
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 1,
  });
  const geo = new RoundedBoxGeometry(1, 1, 1, 2, 0.07);
  // all the cubes in one draw call: the ones that show are the first `count` instances
  const cubes = new THREE.InstancedMesh(geo, material, ENERGY.max * ENERGY.max);
  cubes.name = 'EnergyCubes';
  cubes.count = 0;
  cubes.frustumCulled = false; // small, and its bounds change with the side
  root.add(cubes);
  const m4 = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const q = new THREE.Quaternion();
  let side = 0;
  const step = ENERGY.cube + ENERGY.gap;
  /** The square's width (= height) in metres for a side of s cubes. */
  const extent = (s) => (s <= 0 ? 0 : s * ENERGY.cube + (Math.ceil(s - 1e-9) - 1) * ENERGY.gap);

  /** A square of side s cubes (its area s² is the energy in cubes). */
  function setSide(s) {
    const next = Math.max(0, Math.min(ENERGY.max, s));
    if (next === side && cubes.count) return;
    side = next;
    const half = extent(side) / 2;
    let n = 0;
    for (let j = 0; j < ENERGY.max; j++)
      for (let i = 0; i < ENERGY.max; i++) {
        const w = Math.min(1, side - i);
        const h = Math.min(1, side - j);
        if (w <= 1e-3 || h <= 1e-3) continue;
        const sx = w * ENERGY.cube;
        const sy = h * ENERGY.cube;
        pos.set(-half + i * step + sx / 2, j * step + sy / 2, 0);
        scl.set(sx, sy, ENERGY.depth);
        cubes.setMatrixAt(n++, m4.compose(pos, q, scl));
      }
    cubes.count = n;
    cubes.instanceMatrix.needsUpdate = true;
  }

  return {
    root,
    mesh: cubes,
    material,
    setSide,
    get side() {
      return side;
    },
    /** Width and height of the square now (m). */
    get size() {
      return extent(side);
    },
    extent,
    setOpacity(a) {
      material.opacity = a;
      material.depthWrite = a > 0.99;
      root.visible = a > 0.01 && side > 0;
    },
  };
}
