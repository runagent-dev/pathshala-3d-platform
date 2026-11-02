// The scene of the figure (1 unit = 1 fm):
//   pull  – a carbon-12 nucleus (6 protons, 6 neutrons): one proton sits on the outside, touching the nucleus, and
//           can be pulled straight out to the right; the strong pull and the electric push are drawn as arrows,
//           the strong force's reach (about 1 fm past the nucleus's surface) as a soft orange shell with a dashed
//           edge, and a scale from the surface measures the gap;
import * as THREE from 'three';
import { COLORS, createArrow, createNucleons, createRail, createReach } from './models.js';
import { MAX_PULL, RANGE, R_NUCLEON, chooseProtons, electricArrowLength, packCluster } from './reading.js';

const v3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const D = Math.SQRT1_2;
const BALL_EDGES = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
  [D, D, 0],
  [D, -D, 0],
  [-D, D, 0],
  [-D, -D, 0],
];
/** Points round a circle in the picture's plane (for the camera fit), between two angles (degrees). */
function ring(cx, cy, r, n = 16, from = 0, to = 360) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = THREE.MathUtils.degToRad(from + ((to - from) * i) / n);
    return { p: new THREE.Vector3(cx + r * Math.cos(a), cy + r * Math.sin(a), 0) };
  });
}

// ── pull ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const RAIL_Y = -0.42; // fm: the scale runs just under the pulling line

export function buildPullScene(M) {
  const root = new THREE.Group();
  root.name = 'PullScene';
  // eleven balls; the one farthest from the centre is turned onto the +x axis, and the pulled proton sits on it,
  // touching: so the gap between the proton and the nucleus is exactly how far it has been pulled
  let pts = packCluster(11, { seed: 11 });
  const k = pts.reduce((best, p, i) => (Math.hypot(...p) > Math.hypot(...pts[best]) ? i : best), 0);
  const q = new THREE.Quaternion().setFromUnitVectors(v3(pts[k]).normalize(), new THREE.Vector3(1, 0, 0));
  pts = pts.map((p) => v3(p).applyQuaternion(q).toArray());
  const surface = Math.hypot(...pts[k]) + R_NUCLEON; // the nucleus's outer edge (no ball reaches farther)
  const seat = new THREE.Vector3(surface + R_NUCLEON, 0, 0);
  const isProton = chooseProtons(pts.length, 5, 4);
  const nucleus = createNucleons('Nucleus', isProton, M);
  pts.forEach((p, i) => nucleus.place(i, p));
  nucleus.commit();
  root.add(nucleus.root);

  const proton = new THREE.Mesh(M.geometry, M.proton);
  proton.name = 'PulledProton';
  proton.position.copy(seat);
  root.add(proton);
  // a finger anywhere near the proton takes it
  const hit = new THREE.Mesh(new THREE.SphereGeometry(R_NUCLEON * 1.75, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  proton.add(hit);

  const reach = createReach(surface, RANGE);
  root.add(reach.root);
  const rail = createRail();
  rail.root.position.set(surface, RAIL_Y, 0);
  root.add(rail.root);

  const strongArrow = createArrow('StrongArrow', COLORS.strong);
  const electricArrow = createArrow('ElectricArrow', COLORS.electric);
  root.add(strongArrow.root, electricArrow.root);
  const left = new THREE.Vector3(-1, 0, 0);
  const right = new THREE.Vector3(1, 0, 0);
  const a = new THREE.Vector3();
  const top = new THREE.Vector3();
  const label = new THREE.Vector3();

  return {
    root,
    nucleus,
    proton,
    hit,
    seat,
    surface,
    reach,
    rail,
    strongArrow,
    electricArrow,
    /** Where the proton is when it is d fm out (the gap between it and the nucleus is d). */
    at: (d, out = new THREE.Vector3()) => out.copy(seat).addScaledVector(right, d),
    /** The top of the proton (labels go above it). */
    top: () => top.copy(proton.position).setY(R_NUCLEON),
    /** A point on the orange arrow just left of the proton: the strong-force label points here. */
    strongPoint: () => label.copy(strongArrow.tail).addScaledVector(left, Math.min(0.45, strongArrow.length / 2)),
    /** Where the scale's number k and the unit go (world points; the labels hang below / sit beside them). */
    tick: (n, out = new THREE.Vector3()) => out.set(surface + n, RAIL_Y - 0.3, 0),
    /** The unit goes under the numbers, its right edge at the scale's end. */
    unitAt: (out = new THREE.Vector3()) => out.set(surface + rail.length, RAIL_Y - 0.3, 0),
    /** Put the proton d fm out, with arrows of these lengths (0 hides one). */
    setProton(d, { strong = 0, electric = 0 } = {}) {
      proton.position.copy(seat).addScaledVector(right, d);
      a.copy(proton.position).addScaledVector(left, R_NUCLEON + 0.06);
      strongArrow.set(a, left, strong);
      a.copy(proton.position).addScaledVector(right, R_NUCLEON + 0.06);
      electricArrow.set(a, right, electric);
      rail.setMarker(d);
    },
    face(cq) {
      nucleus.face(cq);
      nucleus.commit();
      proton.quaternion.copy(cq);
      reach.face(cq);
    },
    /**
     * What the camera must show: the whole nucleus, the reach's dashed edge (all but its far left, which may run
     * off a narrow view), the proton's whole path with its push arrow and the room for their labels, the scale
     * with its numbers and unit (screen labels, so given in pixels).
     */
    frame() {
      const R = R_NUCLEON;
      const out = [];
      for (const p of pts) for (const o of BALL_EDGES) out.push({ p: new THREE.Vector3(p[0] + o[0] * R, p[1] + o[1] * R, p[2]) }); // at its depth: a near ball looks bigger
      out.push(...ring(0, 0, surface + RANGE, 20, -125, 125));
      const far = seat.clone().add(new THREE.Vector3(MAX_PULL, 0, 0));
      out.push({ p: far.clone().add(new THREE.Vector3(R + 0.06 + electricArrowLength(MAX_PULL) + 0.12, 0, 0)) });
      // room above the pulled proton for the two force names
      out.push({ p: seat.clone().setY(R), box: [-20, -64, 20, 0] });
      out.push({ p: far.clone().setY(R), box: [-20, -40, 20, 0] });
      for (let n = 0; n <= MAX_PULL; n++) out.push({ p: new THREE.Vector3(surface + n, RAIL_Y - 0.3, 0), box: [-8, 0, 8, 20] });
      out.push({ p: new THREE.Vector3(surface + rail.length, RAIL_Y - 0.3, 0), box: [-84, 18, 2, 36] });
      return out;
    },
    state: { phase: 'still' },
    end: 0,
  };
}
