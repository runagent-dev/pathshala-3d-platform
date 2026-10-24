// The rest of the scene, procedural three.js in metres: the road (straight, or with the bend), the metre marks
// along the straight road, and the trails the painted points leave behind (tubes along their sampled paths, grown
// with drawRange so nothing is rebuilt while the car moves).
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { CAR, D_MAX, TURN_R } from './motion.js';

export const ROAD_W = 3.4;

/** The road's middle line (x, z), along the rear axle's path, with a little road before and after. */
function centreLine(path) {
  const pts = [];
  if (path !== 'turn') {
    for (const x of [-1.6, CAR.rearAxle + D_MAX.straight + 4.4]) pts.push([x, 0]);
    return pts;
  }
  pts.push([-1.6, 0]);
  const cx = CAR.rearAxle;
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * (Math.PI / 2);
    pts.push([cx + TURN_R * Math.sin(a), -TURN_R + TURN_R * Math.cos(a)]);
  }
  pts.push([cx + TURN_R, -TURN_R - 4.2]);
  return pts;
}

/** A flat band of width w along a line of (x, z) points, at height y. */
function band(pts, w, y, offset = 0) {
  const pos = [];
  const idx = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    const nx = -tz / l; // to the right of the direction of travel (+z when going +x)
    const nz = tx / l;
    const [x, z] = pts[i];
    pos.push(x + nx * (offset + w / 2), y, z + nz * (offset + w / 2), x + nx * (offset - w / 2), y, z + nz * (offset - w / 2));
    if (i) {
      const k = i * 2; // wound so that every face points up
      idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function createRoad(path) {
  const g = new THREE.Group();
  g.name = `Road_${path}`;
  const pts = centreLine(path);
  const asphalt = new THREE.MeshStandardMaterial({ name: 'Road', color: 0xe6e9ed, roughness: 1, metalness: 0 });
  const edge = new THREE.MeshBasicMaterial({ name: 'RoadEdge', color: 0xb8c0ca });
  const road = new THREE.Mesh(band(pts, ROAD_W, 0, 0), asphalt);
  road.receiveShadow = true;
  g.add(road);
  for (const side of [-1, 1]) g.add(new THREE.Mesh(band(pts, 0.07, 0.002, side * (ROAD_W / 2 - 0.12)), edge));
  return g;
}

/**
 * Metre marks along the near edge of the straight road, numbered from where the rear bumper starts (0), so a
 * student can check how far each point went. digits(n) gives the number in the figure's language. Each metre
 * has a short upright peg (it reads as a ruler's mark from any side); the numbers face the camera and sit just
 * under their pegs on the screen (face(camera) before each frame), the unit under the last number.
 */
export function createRuler({ digits, unit, max = 8 }) {
  const g = new THREE.Group();
  g.name = 'MetreMarks';
  const ink = new THREE.MeshBasicMaterial({ name: 'Marks', color: 0x6b7683 });
  const z0 = ROAD_W / 2 - 0.32;
  const PEG = 0.16;
  const pegGeo = new THREE.BoxGeometry(0.035, PEG, 0.035);
  pegGeo.translate(0, PEG / 2, 0);
  const labels = [];
  const text = (s, size, weight) => {
    const m = textMesh(s, size, { color: '#4b5766', weight });
    m.material.depthTest = false; // on the road's near edge, nothing stands in front of them
    m.renderOrder = 4;
    labels.push(m);
    g.add(m);
    return m;
  };
  for (let i = 0; i <= max; i++) {
    const peg = new THREE.Mesh(pegGeo, ink);
    peg.position.set(i, 0, z0);
    g.add(peg);
    text(digits(String(i)), 0.34, 600);
  }
  const line = new THREE.Mesh(new THREE.PlaneGeometry(max + 0.035, 0.035), ink);
  line.rotation.x = -Math.PI / 2;
  line.position.set(max / 2, 0.004, z0);
  g.add(line);
  const u = text(unit, 0.26, 500);
  const down = new THREE.Vector3();
  const base = new THREE.Vector3();
  return {
    group: g,
    face(camera) {
      down.set(0, -1, 0).applyQuaternion(camera.quaternion); // the screen's "down", in the world
      for (let i = 0; i <= max; i++) {
        labels[i].quaternion.copy(camera.quaternion);
        labels[i].position.copy(base.set(i, 0, z0)).addScaledVector(down, 0.3);
      }
      u.quaternion.copy(camera.quaternion);
      u.position.copy(labels[max].position).addScaledVector(down, 0.34);
    },
  };
}

/**
 * A tube along sampled points (from sampleTrail), built once; show(k) draws its first k segments. Frames are
 * carried along the path (parallel transport), so the tube does not twist, even where the tyre point stops.
 */
export function createTrail(points, { radius = 0.035, radial = 8, material }) {
  const n = points.length / 3 - 1;
  const pos = new Float32Array((n + 1) * radial * 3);
  const P = (i) => new THREE.Vector3(points[i * 3], points[i * 3 + 1], points[i * 3 + 2]);
  const t = new THREE.Vector3(1, 0, 0);
  const tPrev = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  // the first tangent that is not zero
  for (let i = 0; i < n; i++) {
    v.copy(P(i + 1)).sub(P(i));
    if (v.lengthSq() > 1e-12) {
      t.copy(v).normalize();
      break;
    }
  }
  normal.set(0, 1, 0);
  if (Math.abs(normal.dot(t)) > 0.9) normal.set(0, 0, 1);
  normal.sub(v.copy(t).multiplyScalar(normal.dot(t))).normalize();
  for (let i = 0; i <= n; i++) {
    tPrev.copy(t);
    const a = P(Math.max(0, i - 1));
    const b = P(Math.min(n, i + 1));
    v.copy(b).sub(a);
    if (v.lengthSq() > 1e-12) t.copy(v).normalize();
    q.setFromUnitVectors(tPrev, t);
    normal.applyQuaternion(q);
    binormal.crossVectors(t, normal);
    const c = P(i);
    for (let j = 0; j < radial; j++) {
      const ang = (j / radial) * Math.PI * 2;
      v.copy(c)
        .addScaledVector(normal, Math.cos(ang) * radius)
        .addScaledVector(binormal, Math.sin(ang) * radius);
      pos.set([v.x, v.y, v.z], (i * radial + j) * 3);
    }
  }
  const idx = new Uint32Array(n * radial * 6);
  let k = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      idx.set([a, a + radial, b, b, a + radial, b + radial], k);
      k += 6;
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  geo.setDrawRange(0, 0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.userData.noExport = true;
  return {
    mesh,
    segments: n,
    show(count) {
      geo.setDrawRange(0, Math.max(0, Math.min(n, Math.floor(count))) * radial * 6);
    },
    dispose() {
      geo.dispose();
    },
  };
}
