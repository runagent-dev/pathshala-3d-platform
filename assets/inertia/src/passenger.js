// The passenger: a school student in uniform (white shirt, navy trousers, a school bag on the back), built from
// simple rounded shapes like the girl on the swing in simple-harmonic-motion. Facing +x (the way the bus goes).
// setPose(pose) places every part from the joint angles of ./motion.js (skeleton): the origin of `root` is the
// middle of the soles, under the ankles; the legs are a little apart (±z), the arms at the shoulders' sides.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeStatic } from './merge.js';
import { SEG, skeleton } from './motion.js';

const Y = new THREE.Vector3(0, 1, 0);
const HIP_Z = 0.085;
const SHOULDER_Z = 0.19;

const mat = (name, color, roughness = 0.75) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });

/** A capsule `len` long (between the centres of its round ends), radius r, along +y from its middle. */
const capsule = (r, len, m, name) => {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 4, 14), m);
  mesh.name = name;
  return mesh;
};

export function createPassenger() {
  const root = new THREE.Group();
  root.name = 'Passenger';
  const skin = mat('Skin', 0xb27b50, 0.6);
  const shirt = mat('Shirt', 0xf3f4f6, 0.8);
  const trousers = mat('Trousers', 0x2c3a5a, 0.8);
  const shoe = mat('Shoe', 0x1f1f22, 0.5);
  const hair = mat('Hair', 0x1c1a19, 0.55);
  const bagMat = mat('SchoolBag', 0x7d2a35, 0.7);
  const belt = mat('Belt', 0x2a2522, 0.5);

  const parts = [];
  /** A part that runs from joint `a` to joint `b` (names in skeleton()), at side z. */
  function limb(a, b, r, len, m, z, name) {
    const mesh = capsule(r, len, m, name);
    root.add(mesh);
    parts.push({ mesh, a, b, z });
    return mesh;
  }
  for (const side of [-1, 1]) {
    const z = side * HIP_Z;
    limb('ankle', 'knee', 0.056, SEG.shin, trousers, z, 'Shin');
    limb('knee', 'hip', 0.068, SEG.thigh, trousers, z, 'Thigh');
    const zs = side * SHOULDER_Z;
    limb('shoulder', 'elbow', 0.048, SEG.upperArm, shirt, zs, 'UpperArm');
    limb('elbow', 'wrist', 0.037, SEG.forearm, skin, zs, 'Forearm');
  }
  // the trunk: a wide, flat capsule from hip to shoulder (scaled across the body), hips, the belt
  const torso = limb('hip', 'shoulder', 0.14, SEG.torso - 0.22, shirt, 0, 'Torso');
  torso.scale.set(0.85, 1, 1.35);
  const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.12, 4, 12).rotateX(Math.PI / 2), trousers);
  pelvis.name = 'Hips';
  root.add(pelvis);
  const beltRing = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.128, 0.045, 20, 1, true), belt);
  beltRing.scale.set(0.92, 1, 1.4);
  beltRing.name = 'Belt';
  root.add(beltRing);
  limb('shoulder', 'neck', 0.046, SEG.neck, skin, 0, 'Neck');
  const head = new THREE.Group();
  head.name = 'Head';
  root.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(SEG.head, 26, 18), skin);
  head.add(skull);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(SEG.head + 0.008, 26, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hair);
  cap.rotation.z = 0.55; // the hair covers the top and the back; the face shows
  cap.position.set(-0.008, 0.006, 0);
  head.add(cap);
  for (const z of [-0.035, 0.035]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), hair);
    eye.position.set(SEG.head * 0.9, 0.012, z);
    head.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), skin);
  nose.position.set(SEG.head * 0.98, -0.018, 0);
  head.add(nose);
  for (const z of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), skin);
    ear.scale.set(0.6, 1, 0.5);
    ear.position.set(-0.005, 0, z * SEG.head);
    head.add(ear);
  }
  // hands
  const hands = [-1, 1].map((side) => {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.043, 14, 10), skin);
    h.scale.set(1, 1.15, 0.8);
    h.name = 'Hand';
    root.add(h);
    return { mesh: h, z: side * SHOULDER_Z };
  });
  // feet (shoes): from the heel to the toe, pivoting at the ankle
  const shoeGeo = new RoundedBoxGeometry(SEG.foot, 0.085, 0.1, 2, 0.035).translate(SEG.foot / 2 - SEG.heel, -SEG.ankle + 0.0425, 0);
  const feet = [-1, 1].map((side) => {
    const f = new THREE.Mesh(shoeGeo, shoe);
    f.name = 'Shoe';
    root.add(f);
    return { mesh: f, z: side * HIP_Z };
  });
  // the school bag on the back, with its two straps over the shoulders
  const bag = new THREE.Group();
  bag.name = 'SchoolBag';
  const pack = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.36, 0.3, 3, 0.04), bagMat);
  pack.position.set(-0.19, 0, 0);
  bag.add(pack);
  const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.15, 0.24, 2, 0.02), mat('BagPocket', 0x6a222c, 0.7));
  pocket.position.set(-0.27, -0.07, 0);
  bag.add(pocket);
  for (const z of [-0.1, 0.1]) {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.014, 6, 18, Math.PI * 1.1), bagMat);
    strap.position.set(-0.04, 0.08, z);
    strap.rotation.z = 0.15;
    bag.add(strap);
  }
  root.add(bag);
  // the head's and the bag's parts never move against each other: one mesh per material each
  mergeStatic(head, { prefix: 'Head' });
  mergeStatic(bag, { prefix: 'Bag' });

  // a big invisible box round the body: a tap on the passenger plays the event too
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.7), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.9;
  hit.userData.noExport = true;
  hit.name = 'PassengerHit';
  root.add(hit);

  const j = {};
  const a3 = new THREE.Vector3();
  const b3 = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);

  return {
    root,
    hit,
    /** The joints of the last pose (local x forward, y up from the soles). */
    joints: j,
    setPose(p) {
      skeleton(p, j);
      for (const { mesh, a, b, z } of parts) {
        a3.set(j[a].x, j[a].y, z);
        b3.set(j[b].x, j[b].y, z);
        mesh.position.addVectors(a3, b3).multiplyScalar(0.5);
        dir.subVectors(b3, a3).normalize();
        mesh.quaternion.setFromUnitVectors(Y, dir);
      }
      pelvis.position.set(j.hip.x, j.hip.y, 0);
      pelvis.rotation.z = -p.torso;
      beltRing.position.set(j.hip.x + 0.06 * Math.sin(p.torso), j.hip.y + 0.06 * Math.cos(p.torso), 0);
      beltRing.rotation.z = -p.torso;
      head.position.set(j.head.x, j.head.y, 0);
      head.rotation.z = -p.head;
      for (const h of hands) {
        h.mesh.position.set(j.hand.x, j.hand.y, h.z);
        h.mesh.rotation.z = Math.PI - p.forearm;
      }
      // the feet stay flat until the shins lie far forward (kneeling): then the toes tuck under, on the road
      const tuck = THREE.MathUtils.smoothstep(p.shin, 0.8, 1.64);
      for (const f of feet) {
        f.mesh.position.set(0, SEG.ankle, f.z);
        f.mesh.quaternion.setFromAxisAngle(zAxis, -2.73 * tuck);
      }
      // the bag sits on the back, turning with the trunk
      bag.position.set(j.hip.x + 0.3 * Math.sin(p.torso), j.hip.y + 0.3 * Math.cos(p.torso), 0);
      bag.rotation.z = -p.torso;
    },
  };
}
