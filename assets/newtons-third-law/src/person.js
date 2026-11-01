// A schoolboy with articulated limbs, complete head and sneakers; local +x points towards the jetty.
// Drawn in five meshes with the same shapes as before: the upper body (torso, belt, neck, head, hair, face, sleeves) is
// one vertex-coloured mesh that leans as a whole; the eight limb tubes are one instanced mesh and the hands and hips
// another (each instance in its own colour); each sneaker (upper and sole) is one mesh.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const HIP_Y = 0.86;
const THIGH = 0.43;
const SHIN = 0.41;
const UPPER = 0.29;
const FORE = 0.27;
const SHOULDER = { y: 1.33, z: 0.18 };
const SOLE = 0.02; // m: the shoe sole under the foot (the body stands this high)
const CROUCH = 0.1; // m: the knees are bent a little, while preparing to jump

const UP = new THREE.Vector3(0, 1, 0);

/** A geometry with only position, normal and a plain vertex colour, moved by a matrix (for merging). */
function painted(geo, color, matrix) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
  if (matrix) g.applyMatrix4(matrix);
  const c = new THREE.Color(color);
  const rgb = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < rgb.length; i += 3) c.toArray(rgb, i);
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  return g;
}
const at = (x, y, z, sx = 1, sy = 1, sz = 1, rz = 0) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rz),
    new THREE.Vector3(sx, sy, sz),
  );

/**
 * @param {{ jacket?: string, trousers?: string, hair?: string, skin?: string, name?: string }} [look]
 */
export function createPerson({ jacket = '#f05139', trousers = '#183e61', hair = '#1d1d20', skin = '#b98057', name = 'Boy' } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const C = { jacket, trousers, skin, hair, boot: '#fff3dc', belt: '#1d2026', face: '#34211b' };
  const cloth = new THREE.MeshStandardMaterial({ name: 'BoyClothesAndSkin', vertexColors: true, roughness: 0.8, metalness: 0 });
  const white = new THREE.MeshStandardMaterial({ name: 'BoyLimbs', roughness: 0.8, metalness: 0 });

  // the body stands on its shoe soles: everything is lifted by SOLE; the upper body leans about the hips
  const body = new THREE.Group();
  body.position.y = SOLE;
  root.add(body);
  const upper = new THREE.Group();
  upper.position.y = HIP_Y - CROUCH;
  body.add(upper);
  const ball = (r) => new THREE.SphereGeometry(r, 14, 10);
  const parts = [
    painted(new THREE.CapsuleGeometry(0.135, 0.36, 4, 12), C.jacket, at(0, 0.27, 0, 0.72, 1, 1)),
    painted(new THREE.CylinderGeometry(0.128, 0.13, 0.05, 16), C.belt, at(0, 0.04, 0, 0.74, 1, 1)),
    painted(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 10), C.skin, at(0, 0.55, 0)),
    painted(ball(0.1), C.skin, at(0.01, 0.66, 0, 0.95, 1.08, 0.92)),
    painted(new THREE.SphereGeometry(0.106, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), C.hair, at(-0.008, 0.675, 0, 0.98, 1.06, 0.95, 0.32)),
    painted(ball(0.018), C.skin, at(0.105, 0.655, 0)),
  ];
  for (const side of [1, -1]) {
    parts.push(painted(ball(0.021), C.skin, at(-0.015, 0.655, side * 0.091)));
    parts.push(painted(ball(0.009), C.face, at(0.087, 0.68, side * 0.045)));
    parts.push(painted(ball(0.062), C.jacket, at(0, SHOULDER.y - HIP_Y, side * SHOULDER.z)));
  }
  const trunk = new THREE.Mesh(mergeGeometries(parts), cloth);
  trunk.name = 'BoyUpperBody';
  upper.add(trunk);
  for (const g of parts) g.dispose();

  // limbs: tubes [right upper arm, right forearm, left upper arm, left forearm, right thigh, right shin, left thigh,
  // left shin]; balls [right hand, left hand, hips]
  const tubes = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 10), white, 8);
  tubes.name = 'BoyLimbs';
  const balls = new THREE.InstancedMesh(ball(1), white, 3);
  balls.name = 'BoyHandsAndHips';
  [C.jacket, C.skin, C.jacket, C.skin, C.trousers, C.skin, C.trousers, C.skin].forEach((c, i) => tubes.setColorAt(i, new THREE.Color(c)));
  [C.skin, C.skin, C.trousers].forEach((c, i) => balls.setColorAt(i, new THREE.Color(c)));
  for (const im of [tubes, balls]) {
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    body.add(im);
  }
  const boots = [1, -1].map((side) => {
    const boot = new THREE.Group();
    const shoe = painted(new RoundedBoxGeometry(0.22, 0.085, 0.105, 2, 0.025), C.boot);
    const sole = painted(new RoundedBoxGeometry(0.23, 0.018, 0.11, 2, 0.008), C.belt, at(0, -0.043, 0));
    const mesh = new THREE.Mesh(mergeGeometries([shoe, sole]), cloth);
    mesh.name = side > 0 ? 'RightSneaker' : 'LeftSneaker';
    shoe.dispose();
    sole.dispose();
    // the sole's own frame (where the tests measure the grip on the deck)
    const soleMark = new THREE.Object3D();
    soleMark.name = side > 0 ? 'RightSole' : 'LeftSole';
    soleMark.position.y = -0.043;
    boot.add(mesh, soleMark);
    body.add(boot);
    return boot;
  });

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const place = (index, a, b, r) => {
    tmp.subVectors(b, a);
    const len = tmp.length();
    mid.addVectors(a, b).multiplyScalar(0.5);
    q.setFromUnitVectors(UP, tmp.divideScalar(len || 1));
    tubes.setMatrixAt(index, m4.compose(mid, q, sc.set(r, len, r)));
  };
  const placeBall = (index, p, sx, sy, sz) => {
    q.identity();
    balls.setMatrixAt(index, m4.compose(p, q, sc.set(sx, sy, sz)));
  };

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
  const aim = new THREE.Vector3();
  const hips = new THREE.Vector3();

  /** Where a shoulder is (the body's space, before the root's scale) for a lean in radians. */
  function shoulderAt(side, lean, out, crouch = CROUCH) {
    const h = SHOULDER.y - HIP_Y;
    return out.set(Math.sin(lean) * h, HIP_Y - crouch + Math.cos(lean) * h, side * SHOULDER.z);
  }

  /**
   * lean: radians forward; hands: [right, left] points in the body's space (the root's local space, i.e. before the
   * root's scale) or null (hanging); relax: 0 the hands where they are given, 1 hanging by the sides; stance: how far
   * apart the feet stand along x (m); feet: [right, left] sole targets or null; footPitch: the soles' tilt.
   */
  function pose({ lean = 0.1, hands = [null, null], relax = 0, stance = 0.09, jump = 0, crouch = CROUCH, feet = null, footPitch = 0 } = {}) {
    upper.position.y = HIP_Y - crouch;
    placeBall(2, hips.set(0, HIP_Y - crouch, 0), 0.13 * 0.75, 0.13 * 0.55, 0.13);
    upper.rotation.z = -lean;
    for (const side of [1, -1]) {
      const k = side > 0 ? 0 : 1;
      shoulderAt(side, lean, shoulder, crouch);
      rest.set(shoulder.x + 0.06, shoulder.y - UPPER - FORE + 0.02, side * (SHOULDER.z + 0.05));
      const given = hands[k];
      if (given) aim.copy(given).lerp(rest, relax);
      else aim.copy(rest);
      armPole.set(-0.6, -1, side * 0.5);
      reach(shoulder, aim, UPPER, FORE, armPole, elbow, hand);
      place(k * 2, shoulder, elbow, 0.042);
      place(k * 2 + 1, elbow, hand, 0.034);
      placeBall(k, hand, 0.046, 0.046, 0.046);

      const fwd = side > 0 ? stance : -stance;
      hip.set(0, HIP_Y - crouch - 0.04, side * 0.085);
      const soleTarget = feet?.[k];
      if (soleTarget) {
        // Inverse kinematics keeps the sole planted on a moving, pitched deck.
        footT.set(soleTarget.x - 0.06 - 0.052 * Math.sin(footPitch), soleTarget.y - SOLE + 0.005 + 0.052 * Math.cos(footPitch), soleTarget.z);
      } else footT.set(fwd, 0.037 + (side < 0 ? jump * 0.25 : 0), side * 0.11);
      reach(hip, footT, THIGH, SHIN, legPole, knee, foot);
      place(4 + k * 2, hip, knee, 0.062);
      place(5 + k * 2, knee, foot, 0.05);
      boots[k].position.set(foot.x + 0.06, foot.y - 0.005, foot.z);
      boots[k].rotation.z = footPitch;
    }
    for (const im of [tubes, balls]) {
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingBox();
      im.computeBoundingSphere();
    }
  }
  pose();

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });

  return { root, pose };
}
