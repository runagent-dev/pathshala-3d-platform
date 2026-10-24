// The 3D model, in millimetres: a 15 cm ruler lying along x (0 at the zero mark), its marks on the top face (+y),
// and a red marker the student slides along it. Build the figure's own object here; keep the app logic in app.js.
import * as THREE from 'three';
import { INK, textMesh } from '@shared/student/materials.js';
import { LENGTH } from './reading.js';

export const HIGHLIGHT = new THREE.Color('#d9480f');

export function createRuler({ materials: M, digits = (x) => String(x), unit = 'cm' }) {
  const root = new THREE.Group();
  root.name = 'Ruler';

  const body = new THREE.Mesh(new THREE.BoxGeometry(LENGTH + 16, 3, 28), M.wood);
  body.name = 'Body';
  body.position.set(LENGTH / 2, -1.5, 0);
  root.add(body);

  // One mark per millimetre: longer at 5 and 10. Instanced, so the mark that is read can be coloured.
  const count = LENGTH + 1;
  const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.06, 1), M.ink.clone(), count);
  marks.name = 'Marks';
  const m = new THREE.Matrix4();
  for (let k = 0; k < count; k++) {
    const len = k % 10 === 0 ? 7 : k % 5 === 0 ? 5 : 3.2;
    m.compose(new THREE.Vector3(k, 0.04, -14 + len / 2), new THREE.Quaternion(), new THREE.Vector3(1, 1, len));
    marks.setMatrixAt(k, m);
    marks.setColorAt(k, INK);
  }
  marks.instanceColor.needsUpdate = true;
  root.add(marks);

  for (let cm = 0; cm <= LENGTH / 10; cm++) {
    const label = textMesh(digits(String(cm)), 3.2, { weight: 600 });
    label.rotation.x = -Math.PI / 2;
    label.position.set(cm * 10, 0.05, -3.5);
    root.add(label);
  }
  const unitLabel = textMesh(unit, 2.6, { weight: 500 });
  unitLabel.rotation.x = -Math.PI / 2;
  unitLabel.position.set(LENGTH + 6.5, 0.05, -3.5);
  root.add(unitLabel);

  // The marker: a red arrow standing on the ruler; its tip is at x = 0 of the group.
  const marker = new THREE.Group();
  marker.name = 'Marker';
  const red = new THREE.MeshPhysicalMaterial({ name: 'Marker', color: 0xd9480f, roughness: 0.35, clearcoat: 0.6 });
  const tip = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 24), red);
  tip.rotation.x = Math.PI;
  tip.position.y = 2.5;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 10, 16), red);
  stem.position.y = 10;
  const grip = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 16), red);
  grip.position.y = 16;
  marker.add(tip, stem, grip);
  marker.position.z = -10;
  root.add(marker);

  let lit = -1;
  function setMarker(x) {
    marker.position.x = x;
  }
  /** Colour the millimetre mark that is read (or none). */
  function highlight(index) {
    if (lit >= 0) marks.setColorAt(lit, INK);
    lit = index;
    if (lit >= 0) marks.setColorAt(lit, HIGHLIGHT);
    marks.instanceColor.needsUpdate = true;
  }

  return {
    root,
    marker,
    setMarker,
    highlight,
    pickable: [marker],
    /** The marker's tip on the scale, in world space (where the magnifier looks). */
    tip: () => root.localToWorld(new THREE.Vector3(marker.position.x, 0, -11)),
    /** A point on the marker's grip, for the first-use pointer. */
    grip: () => marker.localToWorld(new THREE.Vector3(0, 16, 0)),
  };
}
