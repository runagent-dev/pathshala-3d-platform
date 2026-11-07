// A pair of prism binoculars (Porro), in centimetres, lying on the table, objectives toward −x. The far barrel is whole
// (black rubber armour); the near barrel is a cut-away: its tubes and prism housing are drawn as a faint dark shell
// with crisp edges, so the objective lens, the two right-angle glass prisms and the eyepiece inside can be seen from any
// side. Its own frame (u, v, w) is reading.js's BINO frame: x = u along the barrel, y = v up, z = w away from the hinge.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries as mergeAll } from 'three/addons/utils/BufferGeometryUtils.js';
import { glassPiece, lensGeometry, prismGeometry } from './glass.js';
import { BINO } from './reading.js';

/** Merges geometries whether or not they are indexed (the rounded box is not). */
const mergeGeometries = (list) => mergeAll(list.map((g) => (g.index ? g.toNonIndexed() : g)));

/** Where the binoculars lie: their frame's origin (the near objective's centre is at u = 0). */
export const BINO_AT = { x: 25, y: 3.35, z: 12 };
const R_OBJ = 2.3; // the objective tube's outer radius
const R_EYE = 1.45;
const HOUSING = { u0: 0.7, u1: 9.7, half: 2.25 };

/** A tube along x from u0 to u1, radius r, centred on (v, w). */
const tubeAlong = (u0, u1, r, v, w, seg = 32) =>
  new THREE.CylinderGeometry(r, r, u1 - u0, seg, 1, false).rotateZ(-Math.PI / 2).translate((u0 + u1) / 2, v, w);

export function createBinocular() {
  const { h, s, t, a, b, e, front, back, wb } = BINO;
  const wo = wb + s;
  const we = wb - s;
  const root = new THREE.Group();
  root.name = 'Binoculars';
  root.position.set(BINO_AT.x, BINO_AT.y, BINO_AT.z);

  const armour = new THREE.MeshStandardMaterial({ name: 'Armour', color: '#262b31', roughness: 0.78, metalness: 0.05 });
  const trim = new THREE.MeshStandardMaterial({ name: 'Trim', color: '#9aa3ad', roughness: 0.35, metalness: 0.8 });
  const ghost = new THREE.MeshStandardMaterial({
    name: 'CutAway',
    color: '#2a3138',
    roughness: 0.5,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ghostLine = new THREE.LineBasicMaterial({ name: 'CutAwayEdge', color: '#1b2026', transparent: true, opacity: 0.85 });

  /** One barrel's shell (in the near barrel's frame, w > 0): objective tube, prism housing, eyepiece tube, eyecup. */
  function shell() {
    const housing = new RoundedBoxGeometry(HOUSING.u1 - HOUSING.u0, 2 * HOUSING.half, 2 * HOUSING.half + 0.4, 3, 0.7).translate(
      (HOUSING.u0 + HOUSING.u1) / 2,
      0,
      wb + 0.2,
    );
    const obj = tubeAlong(front, 2.9, R_OBJ, -s, wo);
    const eye = tubeAlong(HOUSING.u1 - 0.2, back - 0.9, R_EYE, s, we);
    const cup = tubeAlong(back - 0.9, back, R_EYE + 0.18, s, we);
    return { housing, obj, eye, cup };
  }
  const sh = shell();

  // ── the far barrel (mirrored to w < 0), whole ──
  const far = new THREE.Group();
  far.name = 'FarBarrel';
  far.scale.z = -1;
  const farBody = new THREE.Mesh(mergeGeometries([sh.housing, sh.obj, sh.eye, sh.cup]), armour);
  const farRings = new THREE.Mesh(
    mergeGeometries([tubeAlong(front, front + 0.35, R_OBJ + 0.06, -s, wo), tubeAlong(HOUSING.u1 - 0.3, HOUSING.u1 + 0.2, R_EYE + 0.08, s, we)]),
    trim,
  );
  const farLens = glassPiece('FarObjective', lensGeometry(2.0, 0.5, 0.12).translate(front + 0.05, -s, wo));
  farLens.edges.visible = false;
  for (const p of [farBody, farRings]) {
    p.castShadow = true;
    p.receiveShadow = true;
  }
  far.add(farBody, farRings, farLens.group);

  // ── the hinge between them: a bar, two bridges, the focus wheel ──
  const hinge = new THREE.Mesh(
    mergeGeometries([
      tubeAlong(1.2, 10.6, 0.85, 0.6, 0, 24),
      new THREE.BoxGeometry(1.6, 1.1, 2 * (wb - HOUSING.half) + 1.6).translate(2.2, 0.6, 0),
      new THREE.BoxGeometry(1.6, 1.1, 2 * (wb - HOUSING.half) + 1.6).translate(8.6, 0.6, 0),
    ]),
    armour,
  );
  hinge.castShadow = true;
  const wheel = new THREE.Mesh(tubeAlong(10.7, 11.9, 1.15, 0.6, 0, 40), trim);
  wheel.castShadow = true;

  // ── the near barrel, cut away ──
  const near = new THREE.Group();
  near.name = 'NearBarrel';
  const shellGeo = mergeGeometries([sh.housing, sh.obj, sh.eye]);
  const nearShell = new THREE.Mesh(shellGeo, ghost);
  nearShell.renderOrder = 2;
  const nearEdges = new THREE.LineSegments(
    mergeGeometries([new THREE.EdgesGeometry(sh.housing, 30), new THREE.EdgesGeometry(sh.obj, 30), new THREE.EdgesGeometry(sh.eye, 30)]),
    ghostLine,
  );
  nearEdges.renderOrder = 2;
  nearEdges.userData.noExport = true;
  const nearCup = new THREE.Mesh(sh.cup, armour);
  const nearRings = new THREE.Mesh(farRings.geometry, trim);
  // the glass: the objective, prism A (folds up, in u–v), prism B (folds sideways, in u–w), the eyepiece
  const objective = glassPiece('Objective', lensGeometry(2.0, 0.55, 0.12).translate(0, -s, wo));
  const L = h * Math.SQRT2;
  const prismA = glassPiece(
    'PrismA',
    prismGeometry(L, 2 * t)
      .rotateZ((3 * Math.PI) / 4)
      .translate(a + h, 0, wo),
  );
  const prismB = glassPiece(
    'PrismB',
    prismGeometry(L, 2 * t)
      .rotateZ(-Math.PI / 4)
      .rotateX(Math.PI / 2)
      .translate(b - h, s, wb),
  );
  const eyepiece = glassPiece('Eyepiece', lensGeometry(1.1, 0.45, 0.12).translate(e, s, we));
  near.add(nearShell, nearEdges, nearCup, nearRings, objective.group, prismA.group, prismB.group, eyepiece.group);

  root.add(far, hinge, wheel, near);
  /** The near barrel's visible body, for a ring round it. */
  const body = new THREE.Box3(
    new THREE.Vector3(BINO_AT.x + front, BINO_AT.y - s - R_OBJ, BINO_AT.z - wo - R_OBJ),
    new THREE.Vector3(BINO_AT.x + back, BINO_AT.y + s + R_EYE, BINO_AT.z + wo + R_OBJ),
  );
  return { root, near, prisms: [prismA, prismB], body };
}

/** A point of the near barrel's frame (u, v, w) in the world. */
export function binoWorld(p, out = new THREE.Vector3()) {
  return out.set(BINO_AT.x + p.x, BINO_AT.y + p.y, BINO_AT.z + p.z);
}
