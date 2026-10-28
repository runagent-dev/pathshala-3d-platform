// A schoolboy with articulated limbs, complete head and sneakers; local +x points towards the jetty.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const HIP_Y = 0.86;
const THIGH = 0.43;
const SHIN = 0.41;
const UPPER = 0.29;
const FORE = 0.27;
const SHOULDER = { y: 1.33, z: 0.18 };
const SOLE = 0.02; // m: the shoe sole under the foot (the body stands this high)
const CROUCH = 0.1; // m: the knees are bent a little, while preparing to jump

const UP = new THREE.Vector3(0, 1, 0);

/**
 * @param {{ jacket?: string, trousers?: string, hair?: string, skin?: string, name?: string }} [look]
 */
export function createPerson({ jacket = '#f05139', trousers = '#183e61', hair = '#1d1d20', skin = '#b98057', name = 'Boy' } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const mat = (matName, color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ name: matName, color, roughness, metalness });
  const M = {
    jacket: mat('Jacket', jacket, 0.85),
    trousers: mat('Trousers', trousers, 0.85),
    skin: mat('Skin', skin, 0.7),
    hair: mat('Hair', hair, 0.75),
    boot: mat('Sneakers', '#fff3dc', 0.5),
    belt: mat('Belt', '#1d2026', 0.5),
  };
  const unitTube = new THREE.CylinderGeometry(1, 1, 1, 10);
  const tmp = new THREE.Vector3();
  const place = (mesh, a, b, r) => {
    tmp.subVectors(b, a);
    const len = tmp.length();
    mesh.position.addVectors(a, b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(UP, tmp.divideScalar(len || 1));
    mesh.scale.set(r, len, r);
    return mesh;
  };
  const tube = (m, parent) => {
    const mesh = new THREE.Mesh(unitTube, m);
    parent.add(mesh);
    return mesh;
  };
  const ball = (r, m, parent) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m);
    parent.add(mesh);
    return mesh;
  };

  // the body stands on its shoe soles: everything is lifted by SOLE; the upper body leans about the hips
  const body = new THREE.Group();
  body.position.y = SOLE;
  root.add(body);
  const upper = new THREE.Group();
  upper.position.y = HIP_Y - CROUCH;
  body.add(upper);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.36, 4, 12), M.jacket);
  torso.position.y = 0.27;
  torso.scale.set(0.72, 1, 1);
  upper.add(torso);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.13, 0.05, 16), M.belt);
  belt.position.y = 0.04;
  belt.scale.set(0.74, 1, 1);
  upper.add(belt);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 10), M.skin);
  neck.position.y = 0.55;
  upper.add(neck);
  const head = ball(0.1, M.skin, upper);
  head.position.set(0.01, 0.66, 0);
  head.scale.set(0.95, 1.08, 0.92);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.106, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), M.hair);
  cap.position.set(-0.008, 0.675, 0);
  cap.rotation.z = 0.32;
  cap.scale.set(0.98, 1.06, 0.95);
  upper.add(cap);
  const nose = ball(0.018, M.skin, upper);
  nose.position.set(0.105, 0.655, 0);
  const face = mat('FaceDetails', '#34211b');
  for (const side of [1, -1]) {
    const ear = ball(0.021, M.skin, upper);
    ear.position.set(-0.015, 0.655, side * 0.091);
    const eye = ball(0.009, face, upper);
    eye.position.set(0.087, 0.68, side * 0.045);
    const sleeve = ball(0.062, M.jacket, upper);
    sleeve.position.set(0, SHOULDER.y - HIP_Y, side * SHOULDER.z);
  }

  // arms (re-placed by pose) and legs
  const arms = [1, -1].map((side) => ({
    side,
    upper: tube(M.jacket, body),
    fore: tube(M.skin, body),
    hand: ball(0.046, M.skin, body),
  }));
  const legs = [1, -1].map((side) => {
    const boot = new THREE.Group();
    const upperShoe = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.085, 0.105, 2, 0.025), M.boot);
    const sole = new THREE.Mesh(new RoundedBoxGeometry(0.23, 0.018, 0.11, 2, 0.008), M.belt);
    sole.name = side > 0 ? 'RightSole' : 'LeftSole';
    sole.position.y = -0.043;
    boot.add(upperShoe, sole);
    body.add(boot);
    return { side, thigh: tube(M.trousers, body), shin: tube(M.skin, body), boot };
  });
  const hipBall = ball(0.13, M.trousers, body);
  hipBall.scale.set(0.75, 0.55, 1);
  hipBall.position.y = HIP_Y - CROUCH;

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

  /** Where a shoulder is (the body's space, before the root's scale) for a lean in radians. */
  function shoulderAt(side, lean, out, crouch = CROUCH) {
    const h = SHOULDER.y - HIP_Y;
    return out.set(Math.sin(lean) * h, HIP_Y - crouch + Math.cos(lean) * h, side * SHOULDER.z);
  }

  /**
   * lean: radians forward; hands: [right, left] points in the body's space (the root's local space, i.e. before the
   * root's scale; `toLocal` makes them from world points) or null (hanging); relax: 0 the hands where they are given,
   * 1 hanging by the sides; stance: how far apart the feet stand along x (m).
   */
  function pose({ lean = 0.1, hands = [null, null], relax = 0, stance = 0.09, jump = 0, crouch = CROUCH, feet = null, footPitch = 0 } = {}) {
    upper.position.y = HIP_Y - crouch;
    hipBall.position.y = HIP_Y - crouch;
    upper.rotation.z = -lean;
    for (const arm of arms) {
      shoulderAt(arm.side, lean, shoulder, crouch);
      rest.set(shoulder.x + 0.06, shoulder.y - UPPER - FORE + 0.02, arm.side * (SHOULDER.z + 0.05));
      const given = hands[arm.side > 0 ? 0 : 1];
      if (given) aim.copy(given).lerp(rest, relax);
      else aim.copy(rest);
      armPole.set(-0.6, -1, arm.side * 0.5);
      reach(shoulder, aim, UPPER, FORE, armPole, elbow, hand);
      place(arm.upper, shoulder, elbow, 0.042);
      place(arm.fore, elbow, hand, 0.034);
      arm.hand.position.copy(hand);
    }
    for (const leg of legs) {
      const fwd = leg.side > 0 ? stance : -stance;
      hip.set(0, HIP_Y - crouch - 0.04, leg.side * 0.085);
      const soleTarget = feet?.[leg.side > 0 ? 0 : 1];
      if (soleTarget) {
        // Inverse kinematics keeps the sole planted on a moving, pitched deck.
        footT.copy(soleTarget).add(new THREE.Vector3(-0.06 - 0.052 * Math.sin(footPitch), -SOLE + 0.005 + 0.052 * Math.cos(footPitch), 0));
      } else footT.set(fwd, 0.037 + (leg.side < 0 ? jump * 0.25 : 0), leg.side * 0.11);
      reach(hip, footT, THIGH, SHIN, legPole, knee, foot);
      place(leg.thigh, hip, knee, 0.062);
      place(leg.shin, knee, foot, 0.05);
      leg.boot.position.set(foot.x + 0.06, foot.y - 0.005, foot.z);
      leg.boot.rotation.z = footPitch;
    }
  }
  pose();

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });

  return {
    root,
    pose,
    shoulderAt,
    materials: M,
    /** A world point in the body's space (the space `pose` takes its hands in; needs the root placed and scaled). */
    toLocal(point, out = new THREE.Vector3()) {
      root.updateMatrixWorld(true);
      out.copy(point);
      body.worldToLocal(out);
      return out;
    },
  };
}
