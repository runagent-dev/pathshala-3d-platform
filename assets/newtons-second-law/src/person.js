// A person who pushes the handcart, built from simple shapes (shirt, trousers), real size in metres: about 1.65 m
// tall. Adapted from the person of contact-noncontact-force (same chapter, same look). Local +x is forward, +y up,
// +z the person's right. pose() leans the body, puts the hands on given points (two-bone reach, elbows down and back)
// and walks the legs (phase in radians, one step per half turn).
//
// Drawn in four meshes, whatever the pose: the upper body (torso, head, hair, face, sleeves: parts that never move
// against each other) merged into one mesh in vertex colours, and the limbs as three instanced meshes (eight tubes,
// three balls for the hands and hips, two shoes) coloured per instance. Every person shares the same four materials.
// Empty markers named HandNear/HandFar and ShoeNear/ShoeFar follow the hands and the shoes (tests and exports).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const HIP_Y = 0.86;
const THIGH = 0.43;
const SHIN = 0.41;
const UPPER = 0.29;
const FORE = 0.27;
const SHOULDER = { y: 1.33, z: 0.18 };

const UP = new THREE.Vector3(0, 1, 0);

/** The materials and limb geometries every person shares (made once). */
let SHARED = null;
function shared() {
  if (SHARED) return SHARED;
  const body = new THREE.MeshStandardMaterial({ name: 'PersonBody', vertexColors: true, roughness: 0.8, metalness: 0 });
  const limb = new THREE.MeshStandardMaterial({ name: 'PersonLimb', color: '#ffffff', roughness: 0.82, metalness: 0 });
  SHARED = {
    body,
    limb,
    tube: new THREE.CylinderGeometry(1, 1, 1, 10),
    ball: new THREE.SphereGeometry(1, 14, 10),
    shoe: new THREE.BoxGeometry(0.24, 0.07, 0.095),
  };
  return SHARED;
}

/** A geometry with only position/normal/uv, moved by `m`, painted `color` (a vertex colour). */
function painted(geo, color, m) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  g.applyMatrix4(m);
  const c = new THREE.Color(color);
  const rgb = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < rgb.length; i += 3) c.toArray(rgb, i);
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  return g;
}

export function createPerson({ shirt = '#f4f6f8', trousers = '#2f3d55', skin = '#b98057', name = 'Person', ponytail = false } = {}) {
  const S = shared();
  const root = new THREE.Group();
  root.name = name;
  const C = {
    shirt: new THREE.Color(shirt),
    trousers: new THREE.Color(trousers),
    skin: new THREE.Color(skin),
    shoe: new THREE.Color('#262a31'),
  };

  // the upper body leans about the hips: its parts merged into one mesh (vertex colours)
  const upper = new THREE.Group();
  upper.position.y = HIP_Y;
  root.add(upper);
  const parts = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const at = (x, y, z, sx = 1, sy = sx, sz = sx, rz = 0) =>
    m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(0, 0, rz)), new THREE.Vector3(sx, sy, sz));
  parts.push(painted(new THREE.CapsuleGeometry(0.135, 0.36, 4, 12), shirt, at(0, 0.27, 0, 0.72, 1, 1)));
  parts.push(painted(new THREE.CylinderGeometry(0.128, 0.13, 0.05, 16), '#1d2026', at(0, 0.04, 0, 0.74, 1, 1)));
  parts.push(painted(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 10), skin, at(0, 0.55, 0)));
  parts.push(painted(new THREE.SphereGeometry(0.1, 14, 10), skin, at(0.01, 0.66, 0, 0.95, 1.08, 0.92)));
  parts.push(
    painted(new THREE.SphereGeometry(0.106, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), '#1d1d20', at(-0.008, 0.675, 0, 0.98, 1.06, 0.95, 0.32)),
  );
  parts.push(painted(new THREE.SphereGeometry(0.018, 8, 6), skin, at(0.105, 0.655, 0)));
  for (const side of [-1, 1]) {
    parts.push(painted(new THREE.SphereGeometry(0.021, 8, 6), skin, at(-0.015, 0.655, side * 0.091)));
    parts.push(painted(new THREE.SphereGeometry(0.009, 6, 4), '#39251d', at(0.087, 0.68, side * 0.045)));
    parts.push(painted(new THREE.SphereGeometry(0.062, 12, 8), shirt, at(0, SHOULDER.y - HIP_Y, side * SHOULDER.z)));
  }
  if (ponytail) parts.push(painted(new THREE.CapsuleGeometry(0.045, 0.15, 4, 10), '#1d1d20', at(-0.11, 0.6, 0, 1, 1, 1, -0.18)));
  const upperGeo = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  const torso = new THREE.Mesh(upperGeo, S.body);
  torso.name = `${name}Body`;
  upper.add(torso);

  // the limbs: tubes (upper arm, forearm × 2; thigh, shin × 2), balls (two hands, the hips), two shoes
  const tubes = new THREE.InstancedMesh(S.tube, S.limb, 8);
  tubes.name = `${name}Limbs`;
  const balls = new THREE.InstancedMesh(S.ball, S.limb, 3);
  balls.name = `${name}Joints`;
  const shoes = new THREE.InstancedMesh(S.shoe, S.limb, 2);
  shoes.name = `${name}Shoes`;
  [C.shirt, C.shirt, C.skin, C.skin, C.trousers, C.trousers, C.trousers, C.trousers].forEach((c, i) => tubes.setColorAt(i, c));
  [C.skin, C.skin, C.trousers].forEach((c, i) => balls.setColorAt(i, c));
  shoes.setColorAt(0, C.shoe);
  shoes.setColorAt(1, C.shoe);
  for (const im of [tubes, balls, shoes]) {
    im.frustumCulled = false; // the instances move about; their box is never recomputed
    root.add(im);
  }
  const marker = (n) => {
    const o = new THREE.Object3D();
    o.name = n;
    root.add(o);
    return o;
  };
  const handMarks = [marker('HandNear'), marker('HandFar')];
  const shoeMarks = [marker('ShoeNear'), marker('ShoeFar')];

  const mtx = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const IDQ = new THREE.Quaternion();
  /** Instance i of `im`: a unit tube from a to b, radius r. */
  function tubeAt(i, a, b, r) {
    tmp.subVectors(b, a);
    const len = tmp.length();
    pos.addVectors(a, b).multiplyScalar(0.5);
    quat.setFromUnitVectors(UP, tmp.divideScalar(len || 1));
    tubes.setMatrixAt(i, mtx.compose(pos, quat, scl.set(r, len, r)));
  }

  // two-bone reach: from a to the target, bones l1 and l2, the joint bending toward `pole`
  const u = new THREE.Vector3();
  const n = new THREE.Vector3();
  function reach(a, target, l1, l2, pole, outJoint, outEnd) {
    u.subVectors(target, a);
    const d = Math.min(Math.max(u.length(), 0.05), l1 + l2 - 1e-4);
    u.normalize();
    outEnd.copy(a).addScaledVector(u, d);
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    n.copy(pole).addScaledVector(u, -pole.dot(u));
    if (n.lengthSq() < 1e-8) n.set(0, -1, 0);
    n.normalize();
    outJoint.copy(a).addScaledVector(u, along).addScaledVector(n, h);
  }

  const shoulder = new THREE.Vector3();
  const elbow = new THREE.Vector3();
  const hand = new THREE.Vector3();
  const hip = new THREE.Vector3();
  const knee = new THREE.Vector3();
  const foot = new THREE.Vector3();
  const footT = new THREE.Vector3();
  const armPole = new THREE.Vector3();
  const legPole = new THREE.Vector3(1, 0, 0);
  const rest = new THREE.Vector3();
  const state = { lean: 0, hipY: HIP_Y };

  /** Where a shoulder is (root space) for the current lean. */
  function shoulderAt(side, out) {
    const c = Math.cos(state.lean);
    const sn = Math.sin(state.lean);
    const h = SHOULDER.y - HIP_Y;
    return out.set(sn * h, state.hipY + c * h, side * SHOULDER.z);
  }

  /**
   * lean: radians forward; hands: [right, left] root-space points or null (hanging); walk: radians of the step
   * cycle; stride: half a step's length in m; spread: feet apart from the middle line (m); lift: how high a foot
   * comes up as it steps (0 standing).
   */
  function pose({ lean = 0, hands = [null, null], walk = 0, stride = 0.26, spread = 0.11, lift = 0.07, seated = false } = {}) {
    state.hipY = seated ? 0.45 : HIP_Y;
    upper.position.y = state.hipY;
    state.lean = lean;
    upper.rotation.z = -lean;
    for (let k = 0; k < 2; k++) {
      const side = k === 0 ? 1 : -1;
      shoulderAt(side, shoulder);
      const target = hands[k];
      if (target) {
        armPole.set(-0.6, -1, side * 0.5);
        reach(shoulder, target, UPPER, FORE, armPole, elbow, hand);
      } else {
        // hanging a little forward and out
        rest.set(shoulder.x + 0.06, shoulder.y - UPPER - FORE + 0.02, side * (SHOULDER.z + 0.05));
        armPole.set(-1, 0, side * 0.3);
        reach(shoulder, rest, UPPER, FORE, armPole, elbow, hand);
      }
      tubeAt(k, shoulder, elbow, 0.042);
      tubeAt(2 + k, elbow, hand, 0.034);
      balls.setMatrixAt(k, mtx.compose(hand, IDQ, scl.setScalar(0.046)));
      handMarks[k].position.copy(hand);
    }
    for (let k = 0; k < 2; k++) {
      const side = k === 0 ? 1 : -1;
      const phase = walk + (side > 0 ? 0 : Math.PI);
      hip.set(0, state.hipY - 0.04, side * 0.085);
      if (seated) footT.set(0.5, -0.045, side * 0.11);
      else {
        const cycle = (((phase / (2 * Math.PI)) % 1) + 1) % 1;
        if (cycle < 0.5) footT.set(stride * (1 - 4 * cycle), 0.045, side * spread);
        else {
          const qq = (cycle - 0.5) * 2;
          const ee = qq * qq * (3 - 2 * qq);
          footT.set(stride * (-1 + 2 * ee), 0.045 + Math.sin(Math.PI * qq) * lift, side * spread);
        }
      }
      reach(hip, footT, THIGH, SHIN, legPole, knee, foot);
      tubeAt(4 + k, hip, knee, 0.062);
      tubeAt(6 + k, knee, foot, 0.05);
      shoeMarks[k].position.set(foot.x + 0.06, seated ? foot.y - 0.01 : Math.max(0.035, foot.y - 0.01), foot.z);
      shoes.setMatrixAt(k, mtx.compose(shoeMarks[k].position, IDQ, scl.setScalar(1)));
    }
    balls.setMatrixAt(2, mtx.compose(pos.set(0, state.hipY, 0), IDQ, scl.set(0.13 * 0.75, 0.13 * 0.55, 0.13)));
    tubes.instanceMatrix.needsUpdate = true;
    balls.instanceMatrix.needsUpdate = true;
    shoes.instanceMatrix.needsUpdate = true;
  }
  pose();

  for (const mesh of [torso, tubes, balls, shoes]) mesh.castShadow = true;

  return {
    root,
    pose,
    /** A hand's place (root space) after the last pose: [right, left]. */
    handAt: (i) => handMarks[i].position,
    shoulderAt,
  };
}
