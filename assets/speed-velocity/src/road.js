// The winding road of চিত্র ২.০৪ as a small 3D map (1 km of road = 1 unit; the cyclist and the road are drawn
// much bigger than they would be, so they show): km posts 0 to 7, the road travelled so far (দূরত্ব) and a
// straight arrow from A to the cyclist (সরণ).
// Map coordinates (e = east, n = north, km) become three.js x = e, z = −n, y = height.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { createArrow } from './arrow.js';
import { roadAt } from './motion.js';
import { ROAD } from './road-data.js';

const UP = new THREE.Vector3(0, 1, 0);
const at = (e, n, h = 0) => new THREE.Vector3(e, h, -n);
const ROAD_W = 0.07; // map units: the road is drawn about 70 m wide
const TRAIL_W = 0.042;
export const CYCLIST_SCALE = 0.125; // the 1.8 m cyclist is drawn 220 m long

/** A flat strip along the points (map coordinates), `w` wide, `h` above the ground. */
function ribbon(points, w, h) {
  const n = points.length;
  const pos = new Float32Array(n * 2 * 3);
  const index = [];
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(n - 1, i + 1)];
    let te = b[0] - a[0];
    let tn = b[1] - a[1];
    const l = Math.hypot(te, tn) || 1;
    te /= l;
    tn /= l;
    // left (−tn, te) and right (tn, −te) of the direction of travel
    const [e, nn] = points[i];
    pos.set([e - tn * (w / 2), h, -(nn + te * (w / 2)), e + tn * (w / 2), h, -(nn - te * (w / 2))], i * 6);
    if (i < n - 1) index.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function tube(a, b, r, material) {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
  return m;
}

/** A cyclist in metres, riding along +x: bicycle, rider in a green shirt. */
function createCyclist() {
  const g = new THREE.Group();
  g.name = 'Cyclist';
  const frameMat = new THREE.MeshStandardMaterial({ name: 'Frame', color: 0xc92a2a, roughness: 0.4, metalness: 0.2 });
  const tyre = new THREE.MeshStandardMaterial({ name: 'Tyre', color: 0x24272b, roughness: 0.7 });
  const shirt = new THREE.MeshStandardMaterial({ name: 'Shirt', color: 0x2f9e44, roughness: 0.8 });
  const trousers = new THREE.MeshStandardMaterial({ name: 'Trousers', color: 0x2c3a56, roughness: 0.75 });
  const skin = new THREE.MeshStandardMaterial({ name: 'Skin', color: 0xb27650, roughness: 0.6 });
  const hair = new THREE.MeshStandardMaterial({ name: 'Hair', color: 0x1d1a17, roughness: 0.55 });
  const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  for (const x of [-0.52, 0.52]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 8, 28), tyre);
    w.position.set(x, 0.36, 0);
    g.add(w);
  }
  const rear = v(-0.52, 0.36);
  const crank = v(0, 0.32);
  const seat = v(-0.14, 0.86);
  const head = v(0.38, 0.92);
  const front = v(0.52, 0.36);
  for (const [a, b] of [
    [rear, crank],
    [crank, seat],
    [seat, rear],
    [seat, head],
    [crank, head],
    [head, front],
  ])
    g.add(tube(a, b, 0.028, frameMat));
  g.add(tube(v(0.36, 1.0, -0.26), v(0.36, 1.0, 0.26), 0.026, tyre));
  // the rider
  const hip = v(-0.12, 0.98);
  const shoulder = v(0.08, 1.44);
  const body = tube(hip, shoulder, 0.17, shirt);
  body.scale.set(1, 1, 0.7);
  g.add(body);
  const headBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), skin);
  headBall.position.set(0.16, 1.66, 0);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.128, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  cap.position.set(0.14, 1.68, 0);
  g.add(headBall, cap);
  for (const s of [-1, 1]) {
    g.add(tube(v(0.1, 1.38, 0.17 * s), v(0.36, 1.02, 0.24 * s), 0.05, shirt));
    g.add(tube(v(-0.1, 0.98, 0.1 * s), v(0.12, 0.62, 0.12 * s), 0.07, trousers));
    g.add(tube(v(0.12, 0.62, 0.12 * s), v(0.02, 0.3, 0.12 * s), 0.055, trousers));
  }
  g.scale.setScalar(CYCLIST_SCALE);
  return g;
}

/**
 * @param {{ N: (x: string | number) => string, colors: { distance: string, displacement: string, label: string } }} options
 */
export function createRoad({ N, colors }) {
  const root = new THREE.Group();
  root.name = 'RoadMap';
  const pts = ROAD.samples;

  const asphalt = new THREE.MeshStandardMaterial({ name: 'Road', color: 0xb9bec5, roughness: 0.9 });
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'RoadEdge', color: 0x8d949c, roughness: 0.9 });
  const edge = new THREE.Mesh(ribbon(pts, ROAD_W + 0.014, 0.003), edgeMat);
  const road = new THREE.Mesh(ribbon(pts, ROAD_W, 0.005), asphalt);
  road.name = 'Road';
  root.add(edge, road);

  // the road travelled so far: a full-length strip, of which only the part behind the cyclist is drawn
  const toB = Math.round(ROAD.B.km / ROAD.stepKm);
  const trailGeo = ribbon(pts.slice(0, toB + 1), TRAIL_W, 0.009);
  const orig = trailGeo.attributes.position.array.slice();
  let moved = -1;
  const trail = new THREE.Mesh(
    trailGeo,
    new THREE.MeshStandardMaterial({
      name: 'Distance',
      color: colors.distance,
      roughness: 0.6,
      emissive: new THREE.Color(colors.distance).multiplyScalar(0.2),
    }),
  );
  trail.name = 'DistanceTravelled';
  root.add(trail);

  // km posts with their numbers, on the outer side of the road (as in the book)
  const postMat = new THREE.MeshStandardMaterial({ name: 'Post', color: 0xf4f5f6, roughness: 0.6 });
  const nearest = (e, n) => pts.reduce((m, p) => Math.min(m, Math.hypot(p[0] - e, p[1] - n)), Infinity);
  for (let k = 0; k <= Math.floor(ROAD.lengthKm); k++) {
    const p = roadAt(k);
    const a = ((p.heading + 90) * Math.PI) / 180;
    const side = [1, -1]
      .map((s) => ({ s, e: p.e + Math.cos(a) * 0.14 * s, n: p.n + Math.sin(a) * 0.14 * s }))
      .sort((x, y) => nearest(y.e, y.n) - nearest(x.e, x.n))[0];
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.04, 0.018), postMat);
    post.position.copy(at(p.e + Math.cos(a) * 0.055 * side.s, p.n + Math.sin(a) * 0.055 * side.s, 0.02));
    const label = textMesh(N(k), 0.12, { color: colors.label, weight: 700 });
    label.rotation.x = -Math.PI / 2;
    label.position.copy(at(side.e, side.n, 0.006));
    root.add(post, label);
  }

  const displacement = createArrow({ color: colors.displacement, radius: 0.014, head: 0.09, headRadius: 0.036, name: 'Displacement' });
  root.add(displacement.root);

  const cyclist = createCyclist();
  root.add(cyclist);
  const cyclistHit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  cyclistHit.userData = { part: 'cyclist', noExport: true };
  root.add(cyclistHit);

  const A = at(0, 0, 0.03);
  const tmp = new THREE.Vector3();

  return {
    root,
    cyclist,
    trail,
    displacement,
    hits: [cyclistHit],
    /** The cyclist `km` along the road: the travelled road (দূরত্ব) and the arrow from A (সরণ). */
    setRide(km, { arrow = true, trailOn = true } = {}) {
      const p = roadAt(km);
      cyclist.position.copy(at(p.e, p.n, 0.01));
      cyclist.rotation.y = (p.heading * Math.PI) / 180;
      cyclistHit.position.copy(at(p.e, p.n, 0.07));
      // the trail: the samples up to km, with the next one moved to the cyclist (put back when it is passed)
      const i = Math.min(toB, Math.floor(km / ROAD.stepKm + 1e-9));
      const pos = trailGeo.attributes.position;
      if (moved >= 0) pos.array.set(orig.subarray(moved * 6, moved * 6 + 6), moved * 6);
      moved = -1;
      if (i < toB) {
        const a = ((p.heading + 90) * Math.PI) / 180;
        const le = (Math.cos(a) * TRAIL_W) / 2;
        const ln = (Math.sin(a) * TRAIL_W) / 2;
        pos.array.set([p.e + le, 0.009, -(p.n + ln), p.e - le, 0.009, -(p.n - ln)], (i + 1) * 6);
        moved = i + 1;
      }
      pos.needsUpdate = true;
      trailGeo.setDrawRange(0, (i < toB ? i + 1 : i) * 6);
      trail.visible = trailOn && km > 0.001;
      tmp.copy(at(p.e, p.n, 0.03)).sub(A);
      displacement.set(A, tmp, tmp.length());
      displacement.root.visible = arrow && tmp.length() > 0.02;
    },
    points: {
      A: () => at(0, 0, 0.02),
      B: () => at(ROAD.B.at[0], ROAD.B.at[1], 0.02),
      cyclist: () => cyclist.position.clone().setY(0.12),
      arrowMid: () => {
        const p = cyclist.position;
        return new THREE.Vector3(p.x / 2, 0.03, p.z / 2);
      },
      trailMid: (km) => {
        const p = roadAt(km / 2);
        return at(p.e, p.n, 0.01);
      },
    },
  };
}
