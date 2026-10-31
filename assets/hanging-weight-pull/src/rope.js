// The rope (metres, world space): one jute rope from the bucket's handle straight up to the pulley, round the top of
// its groove, down to the person's fists, through both of them, and on as a slack tail to a coil on the ground behind
// him. update() rebuilds it as one tube each time something moves; its twisted strands slide along it as it runs, so
// the rope is seen to move over the wheel.
import * as THREE from 'three';
import { PULLEY } from './well.js';

const RADIUS = 0.014;
const LAY = 0.035; // one twist of the strands along the rope (m)

/** The tangent point on the pulley for a rope leaving towards P (on the wheel's upper side), as an angle (rad). */
export function tangentAngle(P) {
  const dx = P.x - PULLEY.x;
  const dy = P.y - PULLEY.y;
  const L = Math.hypot(dx, dy);
  return Math.atan2(dy, dx) + Math.acos(Math.min(1, PULLEY.r / Math.max(L, PULLEY.r + 1e-6)));
}

export function createRope({ coil = new THREE.Vector3(2.32, 0, -0.42) } = {}) {
  const root = new THREE.Group();
  root.name = 'Rope';
  // the strands: diagonal bands of light and dark jute
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 32;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  ctx.fillStyle = '#c99a4c';
  ctx.fillRect(0, 0, 64, 32);
  for (let k = -2; k < 4; k++) {
    ctx.fillStyle = k % 2 ? '#9c7232' : '#dcb468';
    ctx.beginPath();
    ctx.moveTo(k * 21, 0);
    ctx.lineTo(k * 21 + 21, 0);
    ctx.lineTo(k * 21 + 21 + 32, 32);
    ctx.lineTo(k * 21 + 32, 32);
    ctx.fill();
  }
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,230,170,0.5)' : 'rgba(80,50,15,0.4)';
    ctx.fillRect(Math.random() * 64, Math.random() * 32, 1 + Math.random() * 2, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const mat = new THREE.MeshStandardMaterial({ name: 'Jute', map: tex, roughness: 0.92, metalness: 0 });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.name = 'RopeTube';
  mesh.castShadow = true;
  root.add(mesh);

  // the coil on the ground: three loops of rope lying flat
  const coilPts = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const ang = t * Math.PI * 2 * 3;
    const r = 0.16 - t * 0.05;
    coilPts.push(new THREE.Vector3(coil.x + Math.cos(ang) * r, RADIUS + t * 0.022, coil.z + Math.sin(ang) * r));
  }
  const coilMat = mat.clone();
  coilMat.map = tex.clone();
  coilMat.map.needsUpdate = true;
  const coilCurve = new THREE.CatmullRomCurve3(coilPts);
  coilMat.map.repeat.set(coilCurve.getLength() / LAY, 1);
  const coilMesh = new THREE.Mesh(new THREE.TubeGeometry(coilCurve, 240, RADIUS, 8, false), coilMat);
  coilMesh.name = 'RopeCoil';
  coilMesh.castShadow = true;
  root.add(coilMesh);
  const coilTop = coilPts[coilPts.length - 1];

  const points = [];
  const a = new THREE.Vector3();
  const tail = new THREE.Vector3();
  const along = new THREE.Vector3();
  let lastKey = '';
  /** The parts of the rope (world), for arrows and labels after the last update. */
  const info = { tangent: new THREE.Vector3(), down: new THREE.Vector3(), lengthToBucket: 0 };

  /**
   * knot: the top of the bucket's handle; grips: the fists, the one nearer the pulley first; run: metres of rope that
   * have gone over the wheel towards the person (slides the strands).
   */
  function update({ knot, grips, run = 0 }) {
    const key = [knot.x, knot.y, ...grips.flatMap((g) => [g.x, g.y, g.z]), run].map((v) => v.toFixed(4)).join(',');
    if (key === lastKey) return;
    lastKey = key;
    points.length = 0;
    // up from the bucket to the left of the wheel
    const left = new THREE.Vector3(PULLEY.x - PULLEY.r, PULLEY.y, PULLEY.z);
    const rise = left.y - knot.y;
    const n = Math.max(2, Math.ceil(rise / 0.08));
    for (let i = 0; i < n; i++) points.push(new THREE.Vector3(left.x, knot.y + (rise * i) / n, knot.z + ((left.z - knot.z) * i) / n));
    // round the top of the groove to the point where it leaves for the first fist
    const phi = tangentAngle(grips[0]);
    for (let i = 0; i <= 14; i++) {
      const ang = Math.PI + ((phi - Math.PI) * i) / 14;
      points.push(new THREE.Vector3(PULLEY.x + Math.cos(ang) * PULLEY.r, PULLEY.y + Math.sin(ang) * PULLEY.r, PULLEY.z));
    }
    info.tangent.copy(points[points.length - 1]);
    // straight to the first fist and on through the second
    a.copy(info.tangent);
    const segs = Math.max(2, Math.ceil(a.distanceTo(grips[0]) / 0.1));
    for (let i = 1; i <= segs; i++) points.push(a.clone().lerp(grips[0], i / segs));
    points.push(grips[1].clone());
    // the slack tail: on a little past the lower fist, then hanging down in a curve to the coil
    along.subVectors(grips[1], grips[0]);
    if (along.lengthSq() < 1e-6) along.set(1, -0.6, 0);
    along.normalize();
    tail.copy(grips[1]).addScaledVector(along, 0.07);
    const mid = new THREE.Vector3((tail.x + coilTop.x) / 2 + 0.05, Math.max(0.28, Math.min(tail.y, coilTop.y) + 0.22), (tail.z + coilTop.z) / 2);
    const tailCurve = new THREE.CatmullRomCurve3([
      grips[1].clone(),
      tail,
      mid,
      new THREE.Vector3(coilTop.x - 0.04, 0.06, coilTop.z),
      coilTop.clone(),
    ]);
    for (let i = 1; i <= 20; i++) points.push(tailCurve.getPoint(i / 20));
    // one tube through all of it
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const length = curve.getLength();
    mesh.geometry.dispose();
    mesh.geometry = new THREE.TubeGeometry(curve, Math.min(420, Math.ceil(length / 0.02)), RADIUS, 8, false);
    tex.repeat.set(length / LAY, 1);
    tex.offset.x = (-run / LAY) % 1; // the strands move with the rope (towards the person when it runs that way)
    info.down.subVectors(grips[0], info.tangent).normalize();
    info.lengthToBucket = rise;
  }

  return { root, update, info, radius: RADIUS };
}
