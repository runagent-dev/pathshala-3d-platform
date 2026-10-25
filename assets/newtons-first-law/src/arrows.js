// 3D arrows for the forces and the velocity (metres): a round shaft and a cone head, flat-lit enough to read on any
// floor. set(from, dir, length) places one; very short arrows get a smaller head, so the length still means
// something (the ice's friction is a tiny arrow). Colours carry meaning: বেগ blue, ঘর্ষণ crimson, ধাক্কা orange (the
// same as style.css).
import * as THREE from 'three';

export const COLORS = { velocity: '#1c6fd9', friction: '#c2255c', push: '#e8590c', option: '#3f4954' };
const UP = new THREE.Vector3(0, 1, 0);

export function createArrow({ color, radius = 0.006, head = 0.034, headRadius = 0.015, name = 'Arrow' }) {
  const material = new THREE.MeshStandardMaterial({
    name: `${name}Material`,
    color,
    roughness: 0.5,
    metalness: 0,
    emissive: new THREE.Color(color).multiplyScalar(0.35),
  });
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 14).translate(0, 0.5, 0), material);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 20).translate(0, head / 2, 0), material);
  root.add(shaft, tip);
  root.visible = false;
  const d = new THREE.Vector3();
  const end = new THREE.Vector3();
  const mid = new THREE.Vector3();
  return {
    root,
    material,
    /** The arrow's tip and its middle (for labels). */
    end,
    mid,
    set(from, dir, length) {
      d.copy(dir).normalize();
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, d);
      const k = Math.min(1, length / (head * 1.4));
      const h = head * k;
      const body = Math.max(0, length - h);
      shaft.scale.set(1, Math.max(1e-4, body), 1);
      shaft.visible = body > 0.002;
      tip.position.y = body;
      tip.scale.setScalar(Math.max(0.35, k));
      end.copy(from).addScaledVector(d, length);
      mid.copy(from).addScaledVector(d, length / 2);
      root.visible = length > 0.001;
    },
    hide() {
      root.visible = false;
    },
    get visible() {
      return root.visible;
    },
  };
}

/** A dotted path on the floor (the test's candidate paths), from points { x, z }. */
export function createDottedPath({ color = COLORS.option, max = 60, radius = 0.0075 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ name: 'CandidatePath', color, toneMapped: false, transparent: true });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(radius, 8, 6), mat, max);
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.userData.noExport = true;
  const m = new THREE.Matrix4();
  return {
    mesh,
    material: mat,
    set(points, y = 0.004, spacing = 0.022) {
      let n = 0;
      let last = null;
      for (const p of points) {
        if (last && Math.hypot(p.x - last.x, p.z - last.z) < spacing) continue;
        if (n >= max) break;
        mesh.setMatrixAt(n++, m.makeTranslation(p.x, y, p.z));
        last = p;
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    },
    clear() {
      mesh.count = 0;
    },
  };
}
