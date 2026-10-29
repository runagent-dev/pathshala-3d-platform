// What the figure draws over each example, in the example's plane (the turning axis is +z, angle 0 is +y): the
// fixed point (purple), the dashed line from it to the moving point (orange: the distance), the moving point, the
// circular path it has traced (blue), and up to four "measured" lines left where the student measured.
// Sizes follow the radius r, so every example looks the same on screen. Nothing here is exported (noExport).
import * as THREE from 'three';
import { pointAt } from './reading.js';

export const COLORS = { center: 0x6741d9, dist: 0xe8590c, path: 0x1c6fd9 };
export const MAX_MARKS = 4;
const TRAIL_STEP = 1; // degrees per segment of the path's tube

/**
 * A tube along an arc of radius r from `from` to `to` degrees, built segment after segment so that a draw range
 * shows any part of it (segment i covers from + i…from + i + 1 steps).
 */
function arcTube(r, tube, from, to, radial = 6) {
  const segs = Math.round((to - from) / TRAIL_STEP);
  const pos = [];
  const nor = [];
  const index = [];
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const a = from + i * TRAIL_STEP;
    const p = pointAt(1, a);
    c.set(p.x * r, p.y * r, 0);
    for (let j = 0; j < radial; j++) {
      const b = (j / radial) * Math.PI * 2;
      n.set(p.x * Math.cos(b), p.y * Math.cos(b), Math.sin(b));
      pos.push(c.x + n.x * tube, c.y + n.y * tube, n.z * tube);
      nor.push(n.x, n.y, n.z);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c2 = a + radial;
      const d = b + radial;
      index.push(a, c2, b, b, c2, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(index);
  return { geometry: g, perSegment: radial * 6, from };
}

/** A flat-coloured material drawn on top of the model (the overlay is a drawing over the photo, so to speak). */
function ink(color, { top = true, opacity = 1 } = {}) {
  const sceneInk = color === COLORS.path ? 0x68d8ff : color === COLORS.dist ? 0xffc14a : color === COLORS.center ? 0xc6a7ff : color;
  return new THREE.MeshBasicMaterial({
    color: sceneInk,
    toneMapped: false,
    depthTest: !top,
    depthWrite: false,
    transparent: opacity < 1 || top,
    opacity,
  });
}

/**
 * @param {{ r: number, lift?: number, pointSize?: number, guide?: boolean }} o  r: the circle's radius; lift: how
 *   far towards the viewer the path is drawn (in the plane's z), so the model never covers it in the front view;
 *   pointSize: the moving point's radius as a part of r (small for the Moon, which is itself the moving thing);
 *   guide: the whole circle drawn faintly under the traced path
 */
export function createOverlay({ r, lift = 0, pointSize = 0.047, guide = false }) {
  const root = new THREE.Group();
  root.name = 'Overlay';
  root.userData.noExport = true;

  // the circular path: two turns of tube around the start, of which the traced part is shown
  const path = arcTube(r, r * 0.013, -360, 360);
  const pathMesh = new THREE.Mesh(path.geometry, ink(COLORS.path, { top: false }));
  pathMesh.position.z = lift;
  pathMesh.renderOrder = 4;
  pathMesh.geometry.setDrawRange(0, 0);
  root.add(pathMesh);
  const guideMesh = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.006, 6, 180), ink(COLORS.path, { top: false, opacity: 0.3 }));
  guideMesh.position.z = lift;
  guideMesh.renderOrder = 3;
  guideMesh.visible = guide;
  root.add(guideMesh);

  // the moving radius: a dashed line, the moving point at its end
  const radius = new THREE.Group();
  radius.name = 'Radius';
  root.add(radius);
  const DASHES = 9;
  const dashLen = (r * 0.62) / DASHES;
  const dashGeo = new THREE.CylinderGeometry(r * 0.011, r * 0.011, dashLen, 8);
  const dashMat = ink(COLORS.dist);
  const dashes = new THREE.InstancedMesh(dashGeo, dashMat, DASHES);
  const m = new THREE.Matrix4();
  for (let i = 0; i < DASHES; i++) {
    m.makeTranslation(0, (r * (i + 0.5)) / DASHES, lift);
    dashes.setMatrixAt(i, m);
  }
  dashes.renderOrder = 10;
  dashes.frustumCulled = false;
  radius.add(dashes);

  const dot = (size, color, order) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 20, 14), ink(color));
    mesh.renderOrder = order;
    return mesh;
  };
  const point = new THREE.Group();
  point.position.set(0, r, lift);
  point.add(dot(r * pointSize * 1.32, 0xffffff, 11), dot(r * pointSize, COLORS.dist, 12));
  radius.add(point);

  const center = new THREE.Group();
  center.position.z = lift;
  center.add(dot(r * 0.05, 0xffffff, 11), dot(r * 0.036, COLORS.center, 12));
  root.add(center);

  // a hollow ring: where the point will be (a question of the test)
  const ghost = new THREE.Mesh(new THREE.TorusGeometry(r * 0.05, r * 0.012, 8, 32), ink(COLORS.dist));
  ghost.renderOrder = 12;
  ghost.visible = false;
  root.add(ghost);

  // the measured lines: a thin solid line with a dot where the point was
  const markGeo = new THREE.CylinderGeometry(r * 0.006, r * 0.006, 1, 6);
  markGeo.translate(0, 0.5, 0);
  const marks = [];
  for (let i = 0; i < MAX_MARKS; i++) {
    const g = new THREE.Group();
    const line = new THREE.Mesh(markGeo, ink(COLORS.dist, { opacity: 0.75 }));
    line.renderOrder = 8;
    const end = dot(r * 0.026, COLORS.dist, 9);
    g.add(line, end);
    g.visible = false;
    g.position.z = lift;
    root.add(g);
    marks.push({ group: g, line, end });
  }

  let marksShown = true;
  return {
    root,
    radius,
    point,
    center,
    /** Turn the radius (and its point) to `deg`. */
    setAngle(deg) {
      radius.rotation.z = THREE.MathUtils.degToRad(deg);
    },
    /** Show the traced part of the path, { lo, hi } in degrees, measured from where the trace began (`from`). */
    setTrace(from, cov) {
      pathMesh.rotation.z = THREE.MathUtils.degToRad(from);
      if (cov.hi - cov.lo >= 360) {
        const turn = (360 / TRAIL_STEP) * path.perSegment;
        pathMesh.geometry.setDrawRange(turn, turn); // the whole circle
        return;
      }
      const a = Math.max(0, Math.floor((cov.lo - from - path.from) / TRAIL_STEP));
      const b = Math.min(720 / TRAIL_STEP, Math.ceil((cov.hi - from - path.from) / TRAIL_STEP));
      pathMesh.geometry.setDrawRange(a * path.perSegment, Math.max(0, b - a) * path.perSegment);
    },
    /** Measured lines at these angles; grow (0…1) is how far the newest one has grown. */
    setMarks(angles, grow = 1) {
      marks.forEach((mk, i) => {
        const a = angles[i];
        mk.group.visible = a != null && marksShown;
        if (a == null) return;
        const k = i === angles.length - 1 ? grow : 1;
        mk.group.rotation.z = THREE.MathUtils.degToRad(a);
        mk.line.scale.set(1, Math.max(0.001, r * k), 1);
        mk.end.position.set(0, r * k, 0);
        mk.end.visible = k > 0.98;
      });
    },
    setGhost(deg) {
      ghost.visible = deg != null;
      if (deg == null) return;
      const p = pointAt(r, deg);
      ghost.position.set(p.x, p.y, lift);
    },
    /** The world position of the point at `deg` (or of the moving point), and of the centre. */
    worldAt(deg, out = new THREE.Vector3()) {
      const p = pointAt(r, deg);
      return root.localToWorld(out.set(p.x, p.y, lift));
    },
    pointWorld: (out = new THREE.Vector3()) => point.getWorldPosition(out),
    centerWorld: (out = new THREE.Vector3()) => center.getWorldPosition(out),
    /** Hide parts of the drawing (a test question that asks for what they would give away). */
    setVisible({ path: showPath = true, radius: showRadius = true, center: showCenter = true, marks: showMarks = true } = {}) {
      pathMesh.visible = showPath;
      guideMesh.visible = guide && showPath;
      radius.visible = showRadius;
      center.visible = showCenter;
      marksShown = showMarks;
      if (!showMarks) for (const mk of marks) mk.group.visible = false;
    },
  };
}
