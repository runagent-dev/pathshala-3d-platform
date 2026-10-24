// Things to measure with the screw gauge, held between the anvil (x = 0) and the spindle (x = size).
import * as THREE from 'three';
import { roundTo, LC } from './reading.js';

export const OBJECTS = {
  wire: { size: 1.24, min: 0.4, max: 2.5 }, // copper wire: its diameter
  ball: { size: 6.35, min: 3, max: 12 }, // steel ball (bearing): its diameter
  plate: { size: 1.85, min: 1, max: 4 }, // glass plate: its thickness
};
export const OBJECT_KINDS = Object.keys(OBJECTS);

export function randomSize(kind) {
  const d = OBJECTS[kind];
  const lo = Math.ceil(d.min / LC);
  const hi = Math.floor(d.max / LC);
  return roundTo((lo + Math.floor(Math.random() * (hi - lo + 1))) * LC, LC);
}

/** Builds the object; it sits centred between the faces, so its left side touches the anvil. */
export function createObject(kind, size, M) {
  const group = new THREE.Group();
  group.name = `Object:${kind}`;
  const mats = [];
  if (kind === 'wire') {
    // a copper wire across the jaws, with a gentle bend
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const s = i / 24;
      pts.push(new THREE.Vector3(Math.sin(s * Math.PI) * 0.6 * (s > 0.5 ? 1 : 0.3), -20 + s * 34, -6 + s * 10));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const mat = M.copper.clone();
    mats.push(mat);
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, size / 2, 20), mat);
    // make sure it passes the axis exactly at x = size/2 (centre between the faces)
    const p = curve.getPoint(20 / 34);
    wire.position.set(size / 2 - p.x, -p.y, -p.z);
    group.add(wire);
  } else if (kind === 'ball') {
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xe4e7eb, metalness: 1, roughness: 0.2 });
    mats.push(mat);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(size / 2, 48, 32), mat);
    ball.position.x = size / 2;
    group.add(ball);
  } else {
    // a glass plate standing between the faces (thickness along the axis)
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xdff3ff,
      metalness: 0,
      roughness: 0.05,
      transmission: 0.6,
      thickness: size,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    mats.push(mat);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(size, 22, 16), mat);
    plate.position.set(size / 2, -6, 0);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(plate.geometry),
      new THREE.LineBasicMaterial({ color: 0x7fb6d6, transparent: true, opacity: 0.8 }),
    );
    edges.position.copy(plate.position);
    mats.push(edges.material);
    group.add(plate, edges);
  }
  return {
    kind,
    size,
    group,
    setGlow(k) {
      for (const m of mats) if (m.emissive) m.emissive.setRGB(0.06 * k, 0.32 * k, 0.12 * k);
    },
    setOpacity(a) {
      for (const m of mats) {
        const base = m.userData.baseOpacity ?? (m.userData.baseOpacity = m.opacity);
        const wasTransparent = m.transparent;
        m.transparent = a < 1 || base < 1;
        m.opacity = base * a;
        if (m.transparent !== wasTransparent) m.needsUpdate = true;
      }
    },
    dispose() {
      group.traverse((o) => o.geometry?.dispose());
      for (const m of mats) m.dispose();
    },
  };
}
