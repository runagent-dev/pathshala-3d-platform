// One raindrop, cut open along the plane of the light. A small raindrop is round (not the tear shape of drawings); it
// is drawn as a sphere of water (radius 1 = 1 mm in the GLB) cut in half: the far half as clear water, the cut face as a
// pale disc on which the light's path is drawn (rays.js), its rim as a fine bright line, and the near half as a faint
// ghost so the whole sphere still reads. The drop's own frame is the frame of reading.js's trace: x along the sunlight,
// y up, z out of the cut face toward the viewer.
import * as THREE from 'three';
import { DROP_PATHS } from './reading.js';

export function createDrop() {
  const root = new THREE.Group();
  root.name = 'Raindrop';
  const water = new THREE.MeshPhysicalMaterial({
    name: 'Water',
    color: '#8fd0f5',
    roughness: 0.04,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  // the far half (z < 0): SphereGeometry's z is sin(φ)·sin(θ), negative for φ in (π, 2π)
  const back = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, Math.PI, Math.PI), water);
  back.name = 'DropBack';
  back.renderOrder = 1;
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(1, 96),
    new THREE.MeshStandardMaterial({
      name: 'CutFace',
      color: '#cbeaff',
      roughness: 0.3,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  face.name = 'CutFace';
  face.renderOrder = 2;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.014, 8, 128),
    new THREE.MeshBasicMaterial({ name: 'Rim', color: '#eef8ff', toneMapped: false }),
  );
  rim.name = 'CutRim';
  const ghost = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 24, 0, Math.PI),
    new THREE.MeshPhysicalMaterial({
      name: 'WaterGhost',
      color: '#bfe6ff',
      roughness: 0.05,
      clearcoat: 1,
      transparent: true,
      opacity: 0.12,
      side: THREE.FrontSide,
      depthWrite: false,
    }),
  );
  ghost.name = 'DropGhost';
  ghost.renderOrder = 3;
  root.add(back, face, rim, ghost);
  // a big invisible target for taps on the drop
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1.25, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  root.add(hit);
  return { root, back, face, ghost, hit };
}

/** For the GLB: the drop (1 mm across its radius) with each colour's path as a thin tube, in the drop's own frame. */
export function dropModel() {
  const { root, hit } = createDrop();
  root.remove(hit);
  const tubeMat = new Map();
  const add = (points, color, r = 0.012) => {
    if (!tubeMat.has(color)) tubeMat.set(color, new THREE.MeshBasicMaterial({ name: `Ray_${color}`, color }));
    for (let i = 1; i < points.length; i++) {
      const curve = new THREE.LineCurve3(points[i - 1], points[i]);
      root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 1, r, 6, false), tubeMat.get(color)));
    }
  };
  const V = (p) => new THREE.Vector3(p.x, p.y, 0);
  const first = DROP_PATHS[0];
  add([V({ x: first.p1.x - 2.2, y: first.p1.y }), V(first.p1)], '#fff6d5', 0.018);
  for (const p of DROP_PATHS) {
    add([V(p.p1), V(p.p2), V(p.p3), V({ x: p.p3.x + p.d3.x * 2.2, y: p.p3.y + p.d3.y * 2.2 })], p.css);
  }
  return root;
}
