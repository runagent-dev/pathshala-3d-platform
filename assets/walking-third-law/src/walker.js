// The walking student, seen from the side: a school uniform (white shirt, navy trousers) built from simple shapes,
// real size in metres (1.6 m tall). Local +x is forward, +y up, +z the student's right (the side the camera sees).
// The right leg is the one that pushes (the rear one, nearer the camera); the left leg swings forward.
//
// pose(p) puts the body in the first push-off of a walk, p = 0 (standing ready, feet 0.26 m apart) … 1 (the rear foot
// on its toes behind, the front heel landing ahead). It is worked in the hip's own frame, so the same pose fits every
// ground: the caller moves the root forward by how far the body really went. The rear foot's toe then keeps its place
// on the ground when the body moves as far as the leg stretches (firm ground) and slides back when it does not.
import * as THREE from 'three';
import { PUSH_TIME, stretchAt } from './reading.js';

const HIP_Y = 0.86; // the pelvis (the upper body leans about it)
const HIP_JOINT = 0.78; // where the legs start
const THIGH = 0.43;
const SHIN = 0.41;
const UPPER = 0.29;
const FORE = 0.27;
const SHOULDER = { y: 1.33, z: 0.18 };
const FOOT = { len: 0.24, thick: 0.07, wide: 0.095, back: 0.12, ankle: [-0.06, 0.01] }; // box; ankle in the box's frame
const LEG_Z = 0.1; // the feet's distance from the middle line
const TOE0 = 0.05; // the rear foot's toe at the start (hip frame)
const HEEL0 = 0.07; // the front heel at the start (hip frame)
const HEEL1 = 0.4; // the front heel where it lands (hip frame)
const HEEL_LIFT = 0.75; // rad: the rear heel's lift at the end of the push

const UP = new THREE.Vector3(0, 1, 0);
const smooth = (x) => x * x * (3 - 2 * x);

export function createWalker({ shirt = '#f4f6f8', trousers = '#2f3d55' } = {}) {
  const root = new THREE.Group();
  root.name = 'Student';
  const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });
  const M = {
    shirt: mat('Shirt', shirt, 0.85),
    trousers: mat('Trousers', trousers, 0.85),
    skin: mat('Skin', '#b98057', 0.7),
    hair: mat('Hair', '#1d1d20', 0.75),
    shoe: mat('Shoes', '#262a31', 0.6),
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
  for (const side of [1, -1]) {
    const s = ball(0.062, M.shirt, upper);
    s.position.set(0, SHOULDER.y - HIP_Y, side * SHOULDER.z);
  }

  // arms and legs (placed in root space by pose)
  const arms = [1, -1].map((side) => ({ side, upper: tube(M.shirt, root), fore: tube(M.skin, root), hand: ball(0.046, M.skin, root) }));
  const legs = [1, -1].map((side) => ({
    side,
    thigh: tube(M.trousers, root),
    shin: tube(M.trousers, root),
    foot: new THREE.Mesh(new THREE.BoxGeometry(FOOT.len, FOOT.thick, FOOT.wide), M.shoe),
  }));
  for (const l of legs) root.add(l.foot);
  const hipBall = ball(0.13, M.trousers, root);
  hipBall.scale.set(0.75, 0.55, 1);
  hipBall.position.y = HIP_Y;
  const rear = legs[0]; // the right leg: it pushes
  const front = legs[1];
  rear.foot.name = 'RearShoe';

  // a big invisible box round the student: a tap anywhere on it acts
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.8, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0.05, 0.9, 0);
  hit.userData.noExport = true;
  root.add(hit);

  // two-bone reach from a to the target, the joint bending toward `pole`
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
  const ankle = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const armPole = new THREE.Vector3();
  const legPole = new THREE.Vector3(1, 0, 0);
  const lastToe = new THREE.Vector3(); // the rear foot's toe on the ground, root space
  const lastHeel = new THREE.Vector3();
  const joints = { legs: [{}, {}], arms: [{}, {}] }; // each pose's joints (root space), for boxes labels keep off

  /** Rotate (a, b) by theta about z. */
  const rot = (a, b, th) => [a * Math.cos(th) - b * Math.sin(th), a * Math.sin(th) + b * Math.cos(th)];

  /** A foot box pivoting about one of its bottom corners (the toe or the heel) placed at (px, py) in root space. */
  function setFoot(leg, z, corner, px, py, theta) {
    const sx = corner === 'toe' ? FOOT.back : -FOOT.back;
    const [ox, oy] = rot(sx, -FOOT.thick / 2, theta);
    const cx = px - ox;
    const cy = py - oy;
    leg.foot.position.set(cx, cy, z);
    leg.foot.rotation.set(0, 0, theta);
    const [ax, ay] = rot(FOOT.ankle[0], FOOT.ankle[1], theta);
    ankle.set(cx + ax, cy + ay, z);
  }

  /**
   * p: the push-off, 0 … 1. The rear toe goes back by the leg's stretch (reading.js), heel lifting; the front heel swings
   * ahead and lands; the body leans forward; the arms swing.
   */
  function pose(p) {
    const k = Math.min(1, Math.max(0, p));
    const stretch = stretchAt(k * PUSH_TIME); // m the rear toe goes back in the hip's frame
    // the upper body and the arms
    const lean = 0.05 + 0.15 * k;
    upper.rotation.z = -lean;
    const swing = [0.6 * k, -0.5 * k]; // the right arm forward as the right leg goes back
    for (const arm of arms) {
      const c = Math.cos(lean);
      const s = Math.sin(lean);
      const h = SHOULDER.y - HIP_Y;
      shoulder.set(s * h, HIP_Y + c * h, arm.side * SHOULDER.z);
      const a = swing[arm.side > 0 ? 0 : 1];
      aim.set(shoulder.x + Math.sin(a) * 0.5, shoulder.y - Math.cos(a) * 0.5, arm.side * (SHOULDER.z + 0.04));
      armPole.set(a > 0 ? 1 : -0.4, -0.3, 0);
      reach(shoulder, aim, UPPER, FORE, armPole, elbow, hand);
      place(arm.upper, shoulder, elbow, 0.042);
      place(arm.fore, elbow, hand, 0.034);
      arm.hand.position.copy(hand);
      const j = joints.arms[arm.side > 0 ? 0 : 1];
      j.shoulder = (j.shoulder || new THREE.Vector3()).copy(shoulder);
      j.elbow = (j.elbow || new THREE.Vector3()).copy(elbow);
      j.hand = (j.hand || new THREE.Vector3()).copy(hand);
    }
    // the rear (right) foot: its toe on the ground, the heel lifting
    const toeX = TOE0 - stretch;
    const lift = HEEL_LIFT * k ** 1.5;
    setFoot(rear, LEG_Z, 'toe', toeX, 0, -lift);
    hip.set(0, HIP_JOINT, 0.085);
    reach(hip, ankle, THIGH, SHIN, legPole, knee, aim);
    place(rear.thigh, hip, knee, 0.062);
    place(rear.shin, knee, aim, 0.05);
    storeLeg(0, hip, knee, aim);
    lastToe.set(toeX, 0, LEG_Z);
    lastHeel.set(toeX - FOOT.len * Math.cos(lift), FOOT.len * Math.sin(lift), LEG_Z);
    // the front (left) foot: swings ahead and lands heel first
    const heelX = HEEL0 + (HEEL1 - HEEL0) * smooth(k);
    const heelY = 0.02 * k + 0.14 * Math.sin(Math.PI * k);
    const toeDown = -0.2 * Math.sin(Math.PI * k);
    const landing = 0.32 * k ** 3;
    setFoot(front, -LEG_Z, 'heel', heelX, heelY, toeDown + landing);
    hip.set(0, HIP_JOINT, -0.085);
    reach(hip, ankle, THIGH, SHIN, legPole, knee, aim);
    place(front.thigh, hip, knee, 0.062);
    place(front.shin, knee, aim, 0.05);
    storeLeg(1, hip, knee, aim);
    upper.updateMatrixWorld(true);
  }
  function storeLeg(i, h, k, a) {
    const j = joints.legs[i];
    j.hip = (j.hip || new THREE.Vector3()).copy(h);
    j.knee = (j.knee || new THREE.Vector3()).copy(k);
    j.ankle = (j.ankle || new THREE.Vector3()).copy(a);
  }
  pose(0);

  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o !== hit) o.castShadow = true;
  });

  const body = new THREE.Box3();
  return {
    root,
    pose,
    hit,
    rearShoe: rear.foot,
    /** Where the rear foot's toe touches the ground, in root space (after the last pose). */
    toe: () => lastToe,
    /** The rear heel, in root space. */
    heel: () => lastHeel,
    /**
     * The body as line segments [from, to, radius] in world space (the root's place added), for the boxes that labels
     * keep off: legs, feet, arms, the trunk and the head.
     * @returns {[THREE.Vector3, THREE.Vector3, number, string][]} (the last: which part)
     */
    bones() {
      /** @type {[THREE.Vector3, THREE.Vector3, number, string][]} */
      const out = [];
      const at = (v) => v.clone().add(root.position);
      for (const [i, l] of legs.entries()) {
        const j = joints.legs[i];
        out.push([at(j.hip), at(j.knee), 0.07, 'leg'], [at(j.knee), at(j.ankle), 0.055, 'leg']);
        const half = new THREE.Vector3(FOOT.len / 2, 0, 0).applyQuaternion(l.foot.quaternion);
        out.push([at(l.foot.position).sub(half), at(l.foot.position).add(half), 0.05, l === rear ? 'rearFoot' : 'foot']);
      }
      for (const j of joints.arms) out.push([at(j.shoulder), at(j.elbow), 0.05, 'arm'], [at(j.elbow), at(j.hand), 0.045, 'arm']);
      const mid = new THREE.Vector3();
      neck.getWorldPosition(mid);
      out.push([at(new THREE.Vector3(0, HIP_Y, 0)), mid, 0.14, 'trunk']);
      const h = new THREE.Vector3();
      head.getWorldPosition(h);
      out.push([h, h.clone(), 0.115, 'head']);
      return out;
    },
    /** The student's box in world space (for the camera). */
    box() {
      return body.setFromObject(root);
    },
    materials: M,
  };
}
