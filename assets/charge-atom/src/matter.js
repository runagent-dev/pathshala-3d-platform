// Step ⑤ (page 273's last paragraph): two rows of atoms in the same plane as the atom model, as two cut-away pieces of
// matter. The metal row (তামা): each atom keeps one electron tight, and one free electron per atom (মুক্ত ইলেকট্রন)
// runs through the whole piece, with a short faint trail behind it; the insulator row (কাচ): each atom holds its two
// electrons tight, nothing runs. The atoms are plain grey balls in both rows (the material is named by its label only,
// so the test can ask which row conducts from the electrons alone). Instanced: one draw for the atoms, one for the
// electrons (they share the atom model's electron material, turned to the viewer the same way), one for both slabs, one
// for their edges, one for the trails. The free electrons move only for a few seconds after the step starts or a tap.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { R_ELECTRON } from './atom.js';

const XS = [-10, -6, -2, 2, 6, 10]; // the atoms along a row (cm)
const ROW_Y = 4.8; // the rows' centres: metal at +ROW_Y, insulator at −ROW_Y (swapped in the test)
const R_CORE = 1.25;
const BOUND_R = 1.95; // a bound electron's distance from its atom
const HALF = { x: 13, y: 3.1, z: 2.2 }; // a slab's half size
const TRAIL = 9; // points behind each free electron
const TRAIL_DT = 0.11; // s between them
const FREE = XS.length;

/** Where free electron j is at time τ (s), relative to its row's centre (cm): through the whole piece, wrapping. */
function freeAt(j, tau, out) {
  const speed = 2.6 + 0.5 * ((j * 7) % 3);
  const span = 2 * (HALF.x - 0.6);
  let x = -HALF.x + 0.6 + (((((j / FREE) * span + tau * speed) % span) + span) % span);
  if (j % 2) x = -x; // half of them run the other way: random motion, no current
  const y = (HALF.y - R_ELECTRON - 0.25) * Math.sin(tau * (1.7 + 0.31 * j) + j * 1.9);
  const z = 1.1 * Math.cos(tau * (1.3 + 0.17 * j) + j);
  return out.set(x, y, z);
}

/** @param {THREE.Material} electronMat the atom model's electron material (sign texture, faces the viewer) */
export function createMatter(electronMat, electronGeo) {
  const root = new THREE.Group();
  root.name = 'ConductorAndInsulator';
  root.userData.noExport = true;

  const coreMat = new THREE.MeshStandardMaterial({ name: 'MatterAtom', color: '#b9c1c9', roughness: 0.45, metalness: 0.1 });
  const cores = new THREE.InstancedMesh(new THREE.SphereGeometry(R_CORE, 20, 14), coreMat, XS.length * 2);
  cores.name = 'MatterAtoms';
  const bound = XS.length * 1 + XS.length * 2; // metal: one tight electron per atom; insulator: two
  const electrons = new THREE.InstancedMesh(electronGeo, electronMat, bound + FREE);
  electrons.name = 'MatterElectrons';
  for (const m of [cores, electrons]) m.frustumCulled = false;

  const slabGeo = mergeGeometries([
    new THREE.BoxGeometry(2 * HALF.x, 2 * HALF.y, 2 * HALF.z).translate(0, ROW_Y, 0),
    new THREE.BoxGeometry(2 * HALF.x, 2 * HALF.y, 2 * HALF.z).translate(0, -ROW_Y, 0),
  ]);
  const slabs = new THREE.Mesh(
    slabGeo,
    new THREE.MeshStandardMaterial({ name: 'MatterSlab', color: '#dbe4ee', transparent: true, opacity: 0.13, roughness: 0.2, depthWrite: false }),
  );
  slabs.name = 'MatterSlabs';
  slabs.renderOrder = 2;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(slabGeo),
    new THREE.LineBasicMaterial({ name: 'MatterEdge', color: '#e9f1fb', transparent: true, opacity: 0.75 }),
  );
  edges.name = 'MatterEdges';

  const trailPos = new Float32Array(FREE * (TRAIL - 1) * 2 * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  const trails = new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({ name: 'Trail', color: '#a5d8ff', transparent: true, opacity: 0.8 }));
  trails.name = 'FreeElectronTrails';
  trails.frustumCulled = false;
  root.add(slabs, edges, cores, electrons, trails);

  const M = new THREE.Matrix4();
  const S = new THREE.Vector3();
  const P = new THREE.Vector3();
  const Q = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  let tau = 0;
  let swapped = false; // the metal row at the bottom (the test)
  const metalY = () => (swapped ? -ROW_Y : ROW_Y);
  const glassY = () => -metalY();
  /** The free electrons' places now, relative to the matter's origin. */
  const freePos = Array.from({ length: FREE }, () => new THREE.Vector3());

  function layout() {
    for (let j = 0; j < FREE; j++) freeAt(j, tau, freePos[j]).add(P.set(0, metalY(), 0));
    // trails: the last few places of each free electron (a segment is left out where it wrapped round)
    let n = 0;
    const my = metalY();
    for (let j = 0; j < FREE; j++)
      for (let k = 0; k < TRAIL - 1; k++) {
        freeAt(j, tau - k * TRAIL_DT, P);
        freeAt(j, tau - (k + 1) * TRAIL_DT, Q);
        const ok = tau - (k + 1) * TRAIL_DT >= 0 && Math.abs(P.x - Q.x) < 3;
        if (!ok) Q.copy(P);
        trailPos[n++] = P.x;
        trailPos[n++] = P.y + my;
        trailPos[n++] = P.z;
        trailPos[n++] = Q.x;
        trailPos[n++] = Q.y + my;
        trailPos[n++] = Q.z;
      }
    trailGeo.attributes.position.needsUpdate = true;
  }
  layout();

  return {
    root,
    meshes: [cores, electrons],
    /** Time of the free electrons' run (s). */
    setTime(t) {
      if (t === tau) return;
      tau = t;
      layout();
    },
    get time() {
      return tau;
    },
    /** The metal row at the bottom (true) or the top. */
    setSwapped(on) {
      if (on === swapped) return;
      swapped = on;
      layout();
    },
    get swapped() {
      return swapped;
    },
    /** Points for the labels (in the atom model's plane): the metal row's and the insulator row's left ends, a free electron. */
    metalLabel: (out) => out.set(-HALF.x + 2, metalY() + HALF.y, HALF.z),
    glassLabel: (out) => out.set(-HALF.x + 2, glassY() + HALF.y, HALF.z),
    /** The free electron nearest the metal row's top now (its label sits above the row, clear of the balls). */
    freeElectron(out) {
      const dir = swapped ? -1 : 1;
      let best = freePos[0];
      for (const p of freePos) if (p.y * dir > best.y * dir) best = p;
      return out.copy(best);
    },
    /** Write every ball, turned to the viewer by q (in the atom model's space), the whole scaled by k (0–1). */
    commit(q, k) {
      root.visible = k > 0.002;
      if (!root.visible) return;
      root.scale.setScalar(k);
      let c = 0;
      let e = 0;
      S.setScalar(1);
      for (const y of [metalY(), glassY()])
        for (const x of XS) {
          M.compose(P.set(x, y, 0), q, one);
          cores.setMatrixAt(c++, M);
        }
      S.setScalar(R_ELECTRON);
      XS.forEach((x, i) => {
        // metal: one tight electron per atom; insulator: two, on opposite sides
        const a = 0.6 + i * 1.3;
        M.compose(P.set(x + Math.cos(a) * BOUND_R, metalY() + Math.sin(a) * BOUND_R, 0.4), q, S);
        electrons.setMatrixAt(e++, M);
        for (const b of [a + 0.4, a + 0.4 + Math.PI]) {
          M.compose(P.set(x + Math.cos(b) * BOUND_R, glassY() + Math.sin(b) * BOUND_R, 0.4), q, S);
          electrons.setMatrixAt(e++, M);
        }
      });
      for (const p of freePos) {
        M.compose(p, q, S);
        electrons.setMatrixAt(e++, M);
      }
      cores.instanceMatrix.needsUpdate = true;
      electrons.instanceMatrix.needsUpdate = true;
    },
  };
}
