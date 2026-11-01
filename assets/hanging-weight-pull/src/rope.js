// The rope (metres, world space): one jute rope from the bucket's handle straight up to the pulley, round the top of
// its groove, down to the person's fists, through both of them, and on as a slack tail to a coil on the ground behind
// him. update() rewrites it as one tube, in place, each time something moves; its twisted strands slide along it as it
// runs, so the rope is seen to move over the wheel.
import * as THREE from 'three';
import { PULLEY } from './well.js';

const RADIUS = 0.014;
const LAY = 0.035; // one twist of the strands along the rope (m)
const SEGS = 300; // rings along the rope (about 2 cm apart: the rope is 5–7 m long)
const RADIAL = 8;

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

  // The tube is written in place: a fixed number of rings (SEGS + 1) of RADIAL + 1 vertices, resampled along the
  // rope's curve each time it moves; nothing is allocated while it runs.
  const geo = new THREE.BufferGeometry();
  const ringN = RADIAL + 1;
  const pos = new THREE.BufferAttribute(new Float32Array((SEGS + 1) * ringN * 3), 3);
  const nor = new THREE.BufferAttribute(new Float32Array((SEGS + 1) * ringN * 3), 3);
  const uvs = new Float32Array((SEGS + 1) * ringN * 2);
  const index = [];
  for (let i = 0; i <= SEGS; i++)
    for (let j = 0; j <= RADIAL; j++) {
      uvs[(i * ringN + j) * 2] = i / SEGS;
      uvs[(i * ringN + j) * 2 + 1] = j / RADIAL;
      if (i < SEGS && j < RADIAL) {
        const a0 = i * ringN + j;
        const b0 = (i + 1) * ringN + j;
        index.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
      }
    }
  pos.setUsage(THREE.DynamicDrawUsage);
  nor.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', pos);
  geo.setAttribute('normal', nor);
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(index);
  mesh.geometry.dispose();
  mesh.geometry = geo;

  // the rope's points: a pool reused on every update (the curve's points array is refilled, not rebuilt)
  const pool = Array.from({ length: 160 }, () => new THREE.Vector3());
  const points = [];
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const tailPts = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const tailCurve = new THREE.CatmullRomCurve3(tailPts);
  const left = new THREE.Vector3(PULLEY.x - PULLEY.r, PULLEY.y, PULLEY.z);
  const a = new THREE.Vector3();
  const tail = new THREE.Vector3();
  const along = new THREE.Vector3();
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const Nn = new THREE.Vector3();
  const B = new THREE.Vector3();
  let lastKey = '';
  /** The parts of the rope (world), for arrows and labels after the last update. */
  const info = { tangent: new THREE.Vector3(), down: new THREE.Vector3(), lengthToBucket: 0 };
  const push = (x, y, z) => {
    const v = pool[points.length] || new THREE.Vector3();
    pool[points.length] = v;
    points.push(v.set(x, y, z));
  };

  /** Samples the curve into the tube's rings (parallel-transported frames, so the strands never twist). */
  function writeTube() {
    curve.updateArcLengths();
    for (let i = 0; i <= SEGS; i++) {
      const u = i / SEGS;
      curve.getPointAt(u, P);
      curve.getTangentAt(u, T).normalize();
      if (i === 0) {
        // any normal square to the first tangent
        Nn.set(0, 0, 1);
        if (Math.abs(T.z) > 0.9) Nn.set(1, 0, 0);
      }
      // carry the normal along: take away its part along the new tangent
      Nn.addScaledVector(T, -Nn.dot(T)).normalize();
      B.crossVectors(T, Nn);
      for (let j = 0; j <= RADIAL; j++) {
        const ang = (j / RADIAL) * Math.PI * 2;
        const c = Math.cos(ang);
        const sn = Math.sin(ang);
        const nx = c * Nn.x + sn * B.x;
        const ny = c * Nn.y + sn * B.y;
        const nz = c * Nn.z + sn * B.z;
        const k = i * ringN + j;
        nor.setXYZ(k, nx, ny, nz);
        pos.setXYZ(k, P.x + RADIUS * nx, P.y + RADIUS * ny, P.z + RADIUS * nz);
      }
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;
    geo.computeBoundingSphere();
  }

  /**
   * knot: the top of the bucket's handle; grips: the fists, the one nearer the pulley first; run: metres of rope that
   * have gone over the wheel towards the person (slides the strands).
   */
  function update({ knot, grips, run = 0 }) {
    const g0 = grips[0];
    const g1 = grips[1];
    const key = `${knot.x.toFixed(4)},${knot.y.toFixed(4)},${g0.x.toFixed(4)},${g0.y.toFixed(4)},${g0.z.toFixed(4)},${g1.x.toFixed(4)},${g1.y.toFixed(4)},${g1.z.toFixed(4)},${run.toFixed(4)}`;
    if (key === lastKey) return;
    lastKey = key;
    points.length = 0;
    // up from the bucket to the left of the wheel
    const rise = left.y - knot.y;
    const n = Math.max(2, Math.ceil(rise / 0.08));
    for (let i = 0; i < n; i++) push(left.x, knot.y + (rise * i) / n, knot.z + ((left.z - knot.z) * i) / n);
    // round the top of the groove to the point where it leaves for the first fist
    const phi = tangentAngle(g0);
    for (let i = 0; i <= 14; i++) {
      const ang = Math.PI + ((phi - Math.PI) * i) / 14;
      push(PULLEY.x + Math.cos(ang) * PULLEY.r, PULLEY.y + Math.sin(ang) * PULLEY.r, PULLEY.z);
    }
    info.tangent.copy(points[points.length - 1]);
    // straight to the first fist and on through the second
    a.copy(info.tangent);
    const segs = Math.max(2, Math.ceil(a.distanceTo(g0) / 0.1));
    for (let i = 1; i <= segs; i++) {
      const k = i / segs;
      push(a.x + (g0.x - a.x) * k, a.y + (g0.y - a.y) * k, a.z + (g0.z - a.z) * k);
    }
    push(g1.x, g1.y, g1.z);
    // the slack tail: on a little past the lower fist, then hanging down in a curve to the coil
    along.subVectors(g1, g0);
    if (along.lengthSq() < 1e-6) along.set(1, -0.6, 0);
    along.normalize();
    tail.copy(g1).addScaledVector(along, 0.07);
    tailPts[0].copy(g1);
    tailPts[1].copy(tail);
    tailPts[2].set((tail.x + coilTop.x) / 2 + 0.05, Math.max(0.28, Math.min(tail.y, coilTop.y) + 0.22), (tail.z + coilTop.z) / 2);
    tailPts[3].set(coilTop.x - 0.04, 0.06, coilTop.z);
    tailPts[4].copy(coilTop);
    tailCurve.updateArcLengths();
    for (let i = 1; i <= 20; i++) {
      tailCurve.getPoint(i / 20, P);
      push(P.x, P.y, P.z);
    }
    // one tube through all of it
    writeTube();
    const length = curve.getLength();
    tex.repeat.set(length / LAY, 1);
    tex.offset.x = (-run / LAY) % 1; // the strands move with the rope (towards the person when it runs that way)
    info.down.subVectors(g0, info.tangent).normalize();
    info.lengthToBucket = rise;
  }

  return { root, update, info, radius: RADIUS };
}
