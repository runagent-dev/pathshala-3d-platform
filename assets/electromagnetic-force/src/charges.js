// Symbols are explanatory markers, not particles to scale. Both signs on the paper mean NET NEUTRAL.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
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

/**
 * Many charge symbols of one sign as two instanced meshes (the discs, and the white signs over them): place(k, p)
 * puts the k-th, setCount(n) shows the first n, face(q) turns them all to face the camera (only when q changed).
 */
export function createChargeSymbols(positive, radius, max) {
  const root = new THREE.Group();
  root.userData.noExport = true;
  const colour = new THREE.MeshBasicMaterial({ color: positive ? 0xef4f55 : 0x1976d2, toneMapped: false, depthTest: false });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, depthTest: false });
  const bar = () => new THREE.PlaneGeometry(radius * 1.15, radius * 0.25).translate(0, 0, 0.1);
  const sign = positive ? mergeGeometries([bar(), bar().rotateZ(Math.PI / 2)]) : bar();
  const discs = new THREE.InstancedMesh(new THREE.CircleGeometry(radius, 24), colour, max);
  const signs = new THREE.InstancedMesh(sign, white, max);
  discs.renderOrder = 8;
  signs.renderOrder = 9;
  for (const im of [discs, signs]) {
    im.frustumCulled = false;
    im.count = 0;
    root.add(im);
  }
  const at = Array.from({ length: max }, () => new THREE.Vector3());
  const facing = new THREE.Quaternion();
  let stale = true; // the first face() always writes
  const one = new THREE.Vector3(1, 1, 1);
  const m = new THREE.Matrix4();
  const write = () => {
    for (let k = 0; k < max; k++) {
      m.compose(at[k], facing, one);
      discs.setMatrixAt(k, m);
      signs.setMatrixAt(k, m);
    }
    discs.instanceMatrix.needsUpdate = signs.instanceMatrix.needsUpdate = true;
  };
  return {
    root,
    at: (k) => at[k],
    place(k, p) {
      at[k].copy(p);
      write();
    },
    setCount(n) {
      discs.count = signs.count = n;
    },
    face(q) {
      if (!stale && facing.equals(q)) return;
      stale = false;
      facing.copy(q);
      write();
    },
  };
}
