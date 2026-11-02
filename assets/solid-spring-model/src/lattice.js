// The book's চিত্র ৬.০৩: eight blue atoms at the corners of a cube, the twelve edges are coil springs. Heated, each
// atom shakes about its place; the special spring lets it go further out than in (reading.js), so the average
// edge grows. A thin amber frame marks the old (cold) size. Units are centimetres; the cube's middle is `centre`.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { amplitude, swing } from './reading.js';

export const EDGE = 4;
const ATOM_R = 0.55;
const TURNS = 15;
const COIL_R = 0.21;
const WIRE_R = 0.05;
const OMEGA = [9.3, 11.1, 7.9]; // rad/s per axis: not the same, so the shake looks natural, never a straight line

class Helix extends THREE.Curve {
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * TURNS * 2 * Math.PI;
    return target.set(COIL_R * Math.cos(a), COIL_R * Math.sin(a), t * EDGE);
  }
}

/** The 12 edges as pairs of atom indices (atoms differ in one bit of 0…7: bit 0 = x, 1 = y, 2 = z). */
export const EDGES = [];
for (let i = 0; i < 8; i++) for (let b = 0; b < 3; b++) if (!(i & (1 << b))) EDGES.push([i, i | (1 << b)]);

export function createLattice({ centre = new THREE.Vector3() } = {}) {
  const root = new THREE.Group();
  root.name = 'Lattice';
  root.position.copy(centre);

  const atomGeo = new THREE.SphereGeometry(ATOM_R, 32, 20);
  const atomMat = new THREE.MeshStandardMaterial({ name: 'Atom', color: '#2f8ee0', roughness: 0.2, metalness: 0.05 });
  const springGeo = new THREE.TubeGeometry(new Helix(), TURNS * 10, WIRE_R, 6, false);
  const springMat = new THREE.MeshStandardMaterial({ name: 'Spring', color: '#a5b1bd', roughness: 0.3, metalness: 0.85 });

  const atoms = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(atomGeo, atomMat);
    m.name = `Atom ${i + 1}`;
    atoms.push(m);
    root.add(m);
  }
  const springs = EDGES.map(([a, b], i) => {
    const m = new THREE.Mesh(springGeo, springMat);
    m.name = `Spring ${i + 1}`;
    m.userData.ends = [a, b];
    root.add(m);
    return m;
  });

  // the old size: a thin amber frame (twelve bars in one mesh)
  const bars = [];
  const h = EDGE / 2;
  for (const [a, b] of EDGES) {
    const p = new THREE.Vector3((a & 1 ? 1 : -1) * h, (a & 2 ? 1 : -1) * h, (a & 4 ? 1 : -1) * h);
    const q = new THREE.Vector3((b & 1 ? 1 : -1) * h, (b & 2 ? 1 : -1) * h, (b & 4 ? 1 : -1) * h);
    const len = p.distanceTo(q);
    const g = new THREE.CylinderGeometry(0.045, 0.045, len + 0.09, 6);
    g.rotateX(Math.PI / 2); // along z
    const dir = q.clone().sub(p).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    g.applyQuaternion(quat);
    g.translate((p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2);
    bars.push(g);
  }
  const ghost = new THREE.Mesh(
    mergeGeometries(bars),
    new THREE.MeshBasicMaterial({ name: 'OldSize', color: '#f2a516', transparent: true, opacity: 0.95, depthWrite: false }),
  );
  ghost.name = 'Old size';
  ghost.visible = false;
  ghost.userData.noExport = true;
  root.add(ghost);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const sin = Math.sin;

  /** Put every atom and spring where they are at heat tau (0…1) and time (s). */
  function update(tau, time) {
    const amp = amplitude(tau) * EDGE;
    for (let i = 0; i < 8; i++) {
      const wob = 1 + (0.06 * (((i * 5) % 7) - 3)) / 3; // each atom a slightly different rhythm
      const m = atoms[i];
      const sx = i & 1 ? 1 : -1;
      const sy = i & 2 ? 1 : -1;
      const sz = i & 4 ? 1 : -1;
      m.position.set(
        sx * (h + swing(sin(OMEGA[0] * wob * time + i * 1.7), amp)),
        sy * (h + swing(sin(OMEGA[1] * wob * time + i * 2.3 + 1), amp)),
        sz * (h + swing(sin(OMEGA[2] * wob * time + i * 0.9 + 2), amp)),
      );
    }
    for (const s of springs) {
      a.copy(atoms[s.userData.ends[0]].position);
      b.copy(atoms[s.userData.ends[1]].position);
      s.position.copy(a);
      s.lookAt(b.add(root.position)); // lookAt takes a world point
      s.scale.set(1, 1, a.distanceTo(atoms[s.userData.ends[1]].position) / EDGE);
    }
    ghost.visible = tau > 0.001;
  }
  update(0, 0);

  return { root, atoms, springs, ghost, update, centre };
}
