// A person who pushes the handcart, built from simple shapes (shirt, trousers), real size in metres: about 1.65 m
// tall. Adapted from the person of contact-noncontact-force (same chapter, same look). Local +x is forward, +y up,
// +z the person's right. pose() leans the body, puts the hands on given points (two-bone reach, elbows down and back)
// and walks the legs (phase in radians, one step per half turn).
import * as THREE from 'three';

const HIP_Y = 0.86;
const THIGH = 0.43;
const SHIN = 0.41;
const UPPER = 0.29;
const FORE = 0.27;
const SHOULDER = { y: 1.33, z: 0.18 };

const UP = new THREE.Vector3(0, 1, 0);

export function createPerson({ shirt = '#f4f6f8', trousers = '#2f3d55', skin = '#b98057', name = 'Person', ponytail = false } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });
  const M = {
    shirt: mat('Shirt', shirt, 0.85),
    trousers: mat('Trousers', trousers, 0.85),
    skin: mat('Skin', skin, 0.7),
    hair: mat('Hair', '#1d1d20', 0.75),
    shoe: mat('Shoes', '#262a31', 0.6),
    belt: mat('Belt', '#1d2026', 0.5),
  };
  const unitTube = new THREE.CylinderGeometry(1, 1, 1, 10);
  const tmp = new THREE.Vector3();
  /** A unit tube from a to b, radius r. */
  function place(mesh, a, b, r) {
    tmp.subVectors(b, a);
    const len = tmp.length();
    mesh.position.addVectors(a, b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(UP, tmp.divideScalar(len || 1));
    mesh.scale.set(r, len, r);
    return mesh;
  }
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

  // the upper body leans about the hips
  const upper = new THREE.Group();
  upper.position.y = HIP_Y;
  root.add(upper);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.36, 4, 12), M.shirt);
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
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.106, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), M.hair);
  hair.position.set(-0.008, 0.675, 0);
  hair.rotation.z = 0.32;
  hair.scale.set(0.98, 1.06, 0.95);
  upper.add(hair);
  const nose = ball(0.018, M.skin, upper);
  nose.position.set(0.105, 0.655, 0);
  const face = mat('Face', '#39251d');
  for (const side of [-1, 1]) {
    const ear = ball(0.021, M.skin, upper);
    ear.position.set(-0.015, 0.655, side * 0.091);
    const eye = ball(0.009, face, upper);
    eye.position.set(0.087, 0.68, side * 0.045);
  }
  if (ponytail) {
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.15, 4, 10), M.hair);
    tail.position.set(-0.11, 0.6, 0);
    tail.rotation.z = -0.18;
    upper.add(tail);
  }
  const sleeves = [1, -1].map((side) => {
    const s = ball(0.062, M.shirt, upper);
    s.position.set(0, SHOULDER.y - HIP_Y, side * SHOULDER.z);
    return s;
  });
  void sleeves;

  // arms (in root space, re-placed by pose) and legs
  const arms = [1, -1].map((side) => ({
    side,
    upper: tube(M.shirt, root),
    fore: tube(M.skin, root),
    hand: (() => {
      const h = ball(0.046, M.skin, root);
      h.name = side > 0 ? 'HandNear' : 'HandFar';
      return h;
    })(),
  }));
  const legs = [1, -1].map((side) => ({
    side,
    thigh: tube(M.trousers, root),
    shin: tube(M.trousers, root),
    foot: (() => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.095), M.shoe);
      f.name = side > 0 ? 'ShoeNear' : 'ShoeFar';
      root.add(f);
      return f;
    })(),
  }));
  const hipBall = ball(0.13, M.trousers, root);
  hipBall.scale.set(0.75, 0.55, 1);
  hipBall.position.y = HIP_Y;

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
  const state = { lean: 0, hands: [null, null], walk: 0, stride: 0.26, spread: 0.11, hipY: HIP_Y };

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
    upper.position.y = hipBall.position.y = state.hipY;
    state.lean = lean;
    state.hands = hands;
    state.walk = walk;
    state.stride = stride;
    state.spread = spread;
    upper.rotation.z = -lean;
    for (const arm of arms) {
      shoulderAt(arm.side, shoulder);
      const target = hands[arm.side > 0 ? 0 : 1];
      if (target) {
        armPole.set(-0.6, -1, arm.side * 0.5);
        reach(shoulder, target, UPPER, FORE, armPole, elbow, hand);
      } else {
        // hanging a little forward and out
        rest.set(shoulder.x + 0.06, shoulder.y - UPPER - FORE + 0.02, arm.side * (SHOULDER.z + 0.05));
        armPole.set(-1, 0, arm.side * 0.3);
        reach(shoulder, rest, UPPER, FORE, armPole, elbow, hand);
      }
      place(arm.upper, shoulder, elbow, 0.042);
      place(arm.fore, elbow, hand, 0.034);
      arm.hand.position.copy(hand);
    }
    for (const leg of legs) {
      const phase = walk + (leg.side > 0 ? 0 : Math.PI);
      hip.set(0, state.hipY - 0.04, leg.side * 0.085);
      if (seated) footT.set(0.5, -0.045, leg.side * 0.11);
      else {
        const cycle = (((phase / (2 * Math.PI)) % 1) + 1) % 1;
        if (cycle < 0.5) footT.set(stride * (1 - 4 * cycle), 0.045, leg.side * spread);
        else {
          const q = (cycle - 0.5) * 2,
            e = q * q * (3 - 2 * q);
          footT.set(stride * (-1 + 2 * e), 0.045 + Math.sin(Math.PI * q) * lift, leg.side * spread);
        }
      }
      reach(hip, footT, THIGH, SHIN, legPole, knee, foot);
      place(leg.thigh, hip, knee, 0.062);
      place(leg.shin, knee, foot, 0.05);
      leg.foot.position.set(foot.x + 0.06, seated ? foot.y - 0.01 : Math.max(0.035, foot.y - 0.01), foot.z);
    }
  }
  pose();

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });

  return {
    root,
    pose,
    /** A hand's place (root space) after the last pose: [right, left]. */
    handAt: (i) => arms[i].hand.position,
    shoulderAt,
    materials: M,
  };
}
