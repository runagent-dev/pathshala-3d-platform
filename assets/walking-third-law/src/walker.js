// The walking student, seen from the side: a school uniform (white shirt, navy trousers) built from simple shapes,
// real size in metres (1.6 m tall). Local +x is forward, +y up, +z the student's right (the side the camera sees).
// The right leg is the one that pushes (the rear one, nearer the camera); the left leg swings forward.
//
// pose(p) puts the body in the first push-off of a walk, p = 0 (standing ready, feet 0.26 m apart) … 1 (the rear foot
// on its toes behind, the front heel landing ahead). It is worked in the hip's own frame, so the same pose fits every
// ground: the caller moves the root forward by how far the body really went. The rear foot's toe then keeps its place
// on the ground when the body moves as far as the leg stretches (firm ground) and slides back when it does not.
//
// Drawn with few meshes and the detail kept: the parts that move together (the head, the trunk and the collar on the
// upper body; each hand; each shoe with its sole, tread and laces) are merged once, one mesh per material, the small
// plain colours sharing one vertex-coloured material.
import * as THREE from 'three';
import { mergeStatic } from './merge.js';
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

export function createWalker({ shirt = '#ff593e', trousers = '#2542a5' } = {}) {
  const root = new THREE.Group();
  root.name = 'Student';
  const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });
  const M = {
    shirt: mat('Shirt', shirt, 0.85),
    trousers: mat('Trousers', trousers, 0.85),
    skin: mat('Skin', '#b98057', 0.7),
    hair: mat('Hair', '#1d1d20', 0.75),
    shoe: mat('Shoes', '#262a31', 0.6),
    sole: mat('ShoeSole', '#ffe08a', 0.7),
    eye: mat('Eyes', '#17233e', 0.5),
    white: mat('EyeWhite', '#fff5df'),
    lips: mat('Lips', '#794632'),
    seam: mat('ShirtSeams', '#d73e2d'),
    soleSide: mat('SoleEdge', '#d8b36c'),
    belt: mat('Belt', '#1d2026', 0.5),
  };
  // the small plain colours (collar, buttons, eyes, lips, hair, belt, shoes and their soles) in one material
  const paint = new THREE.MeshStandardMaterial({ name: 'StudentPaint', vertexColors: true, roughness: 0.68, metalness: 0 });
  const painted = [M.hair, M.shoe, M.sole, M.eye, M.white, M.lips, M.seam, M.soleSide, M.belt];
  const limbGeometry = (profile) =>
    new THREE.LatheGeometry(
      profile.map(([y, r]) => new THREE.Vector2(r, y)),
      20,
    );
  const unitTube = limbGeometry([
    [-0.5, 0.72],
    [-0.42, 0.85],
    [-0.2, 0.97],
    [0.05, 1],
    [0.3, 0.92],
    [0.5, 0.85],
  ]);
  const thighGeometry = limbGeometry([
    [-0.5, 0.7],
    [-0.32, 0.78],
    [0, 0.94],
    [0.32, 1],
    [0.5, 0.9],
  ]);
  const calfGeometry = limbGeometry([
    [-0.5, 0.62],
    [-0.25, 0.7],
    [0.08, 1],
    [0.3, 0.94],
    [0.5, 0.78],
  ]);
  // Small procedural weave/skin relief stays offline and gives the surfaces a matte finish.
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const data = ctx.createImageData(128, 128);
    let seed = 17;
    for (let i = 0; i < 128 * 128; i++) {
      seed = (seed * 16807) % 2147483647;
      const v = 115 + (seed % 25);
      data.data.set([v, v, v, 255], i * 4);
    }
    ctx.putImageData(data, 0, 0);
    const relief = new THREE.CanvasTexture(c);
    relief.wrapS = relief.wrapT = THREE.RepeatWrapping;
    relief.repeat.set(6, 6);
    for (const key of ['shirt', 'trousers', 'skin']) {
      M[key].bumpMap = relief;
      M[key].bumpScale = key === 'skin' ? 0.0005 : 0.0012;
    }
  }
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
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, r < 0.02 ? 10 : 24, r < 0.02 ? 8 : 16), m);
    parent.add(mesh);
    return mesh;
  };

  // the upper body leans about the hips
  const upper = new THREE.Group();
  upper.position.y = HIP_Y;
  root.add(upper);
  const torso = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.11, 0.05),
        new THREE.Vector2(0.125, 0.12),
        new THREE.Vector2(0.14, 0.25),
        new THREE.Vector2(0.165, 0.38),
        new THREE.Vector2(0.16, 0.44),
        new THREE.Vector2(0.075, 0.5),
      ],
      32,
    ),
    M.shirt,
  );
  torso.scale.set(0.74, 1, 1.14);
  upper.add(torso);
  // Polo collar, placket, buttons and a sewn chest pocket lie on the front (+x).
  for (const side of [-1, 1]) {
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.065, 0.063), M.seam);
    collar.position.set(0.06, 0.467, side * 0.055);
    collar.rotation.x = side * 0.35;
    upper.add(collar);
  }
  const placket = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.115, 0.018), M.seam);
  placket.position.set(0.12, 0.385, 0);
  upper.add(placket);
  for (let i = 0; i < 3; i++) {
    const button = ball(0.005, M.white, upper);
    button.position.set(0.126, 0.42 - i * 0.033, 0);
  }
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.075, 0.065), M.seam);
  pocket.position.set(0.116, 0.32, 0.09);
  upper.add(pocket);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.13, 0.05, 16), M.belt);
  belt.position.y = 0.04;
  belt.scale.set(0.74, 1, 1);
  upper.add(belt);
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 10), M.skin);
  neckMesh.position.y = 0.55;
  upper.add(neckMesh);
  const head = ball(0.1, M.skin, upper);
  head.position.set(0.01, 0.66, 0);
  // where the neck and the head are, for the boxes labels keep off (the meshes themselves are merged below)
  const neck = new THREE.Object3D();
  neck.position.copy(neckMesh.position);
  const headMark = new THREE.Object3D();
  headMark.name = 'AnatomicalHead';
  headMark.position.copy(head.position);
  upper.add(neck, headMark);
  head.scale.set(0.94, 1.1, 0.85);
  const jaw = ball(0.072, M.skin, upper);
  jaw.position.set(0.034, 0.61, 0);
  jaw.scale.set(0.85, 0.85, 0.95);
  jaw.name = 'Jaw';
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.106, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), M.hair);
  hair.position.set(-0.008, 0.675, 0);
  hair.rotation.z = 0.32;
  hair.scale.set(0.98, 1.06, 0.95);
  upper.add(hair);
  const bridge = ball(0.018, M.skin, upper);
  bridge.position.set(0.097, 0.662, 0);
  bridge.scale.set(0.8, 1.25, 0.68);
  const nose = ball(0.018, M.skin, upper);
  nose.position.set(0.113, 0.645, 0);
  nose.scale.set(0.9, 0.75, 0.85);
  nose.name = 'Nose';
  const mouthPoints = [-0.026, -0.013, 0, 0.013, 0.026].map((z) => new THREE.Vector3(0.099 - Math.abs(z) * 0.12, 0.617 + Math.abs(z) * 0.07, z));
  const mouth = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints), 12, 0.0026, 6, false), M.lips);
  mouth.name = 'Mouth';
  upper.add(mouth);
  for (let i = 0; i < 11; i++) {
    const tuft = ball(0.026, M.hair, upper);
    tuft.scale.set(1.5, 0.55, 0.7);
    tuft.position.set(0.055 - (i % 4) * 0.035, 0.755 + Math.sin(i) * 0.008, ((i % 3) - 1) * 0.044);
    tuft.rotation.z = -0.25;
  }

  for (const side of [1, -1]) {
    const ear = ball(0.025, M.skin, upper);
    ear.position.set(-0.008, 0.65, side * 0.084);
    ear.scale.set(0.65, 1.1, 0.65);
    const eye = ball(0.013, M.white, upper);
    eye.scale.set(0.35, 0.65, 1);
    eye.position.set(0.064, 0.682, side * 0.064);
    eye.rotation.y = -side * 0.7;
    const pupil = ball(0.006, M.eye, upper);
    pupil.scale.set(0.45, 1, 1);
    pupil.position.set(0.068, 0.682, side * 0.068);
    pupil.rotation.y = -side * 0.7;
    pupil.name = side > 0 ? 'EyeNear' : 'EyeFar';
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.003, 0.021, 3, 8), M.hair);
    brow.rotation.x = Math.PI / 2;
    brow.position.set(0.063, 0.7, side * 0.063);
    upper.add(brow);

    const s = ball(0.062, M.shirt, upper);
    s.position.set(0, SHOULDER.y - HIP_Y, side * SHOULDER.z);
  }

  // arms and legs (placed in root space by pose)
  function makeHand() {
    const hand = new THREE.Group();
    hand.name = 'AnatomicalHand';
    root.add(hand);
    const palm = ball(0.032, M.skin, hand);
    palm.scale.set(0.76, 1, 0.45);
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.022 - (i === 0 || i === 3 ? 0.006 : 0), 4, 8), M.skin);
      finger.position.set(-0.019 + i * 0.012, 0.037, 0);
      hand.add(finger);
    }
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.022, 4, 8), M.skin);
    thumb.position.set(-0.03, 0.008, 0.002);
    thumb.rotation.z = -0.55;
    hand.add(thumb);
    return hand;
  }
  const arms = [1, -1].map((side) => ({
    side,
    upper: tube(M.shirt, root),
    fore: tube(M.skin, root),
    hand: makeHand(),
    elbow: ball(0.031, M.skin, root),
    cuff: ball(0.042, M.seam, root),
  }));
  for (const arm of arms) mergeStatic(arm.hand, { paint: { from: painted, material: paint } });
  const shoeShape = new THREE.Shape();
  shoeShape.moveTo(-0.108, -0.034);
  shoeShape.quadraticCurveTo(-0.12, -0.034, -0.114, 0.026);
  shoeShape.quadraticCurveTo(-0.11, 0.04, -0.075, 0.039);
  shoeShape.lineTo(0.07, 0.04);
  shoeShape.quadraticCurveTo(0.114, 0.04, 0.114, 0);
  shoeShape.quadraticCurveTo(0.114, -0.037, 0.065, -0.04);
  shoeShape.lineTo(-0.108, -0.034);
  const shoeGeometry = new THREE.ExtrudeGeometry(shoeShape, {
    depth: 0.052,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.006,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  });
  shoeGeometry.rotateX(Math.PI / 2);
  shoeGeometry.translate(0, 0.026, 0);
  const soleGeometry = new THREE.ExtrudeGeometry(shoeShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.004,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12,
  });
  soleGeometry.rotateX(Math.PI / 2);
  soleGeometry.translate(0, -0.021, 0);

  const legs = [1, -1].map((side) => ({
    side,
    thigh: tube(M.trousers, root),
    shin: tube(M.trousers, root),
    foot: new THREE.Group(),
    knee: ball(0.051, M.trousers, root),
  }));
  for (const l of legs) {
    root.add(l.foot);
    l.foot.add(new THREE.Mesh(shoeGeometry, M.shoe));
    l.thigh.geometry = thighGeometry;
    l.shin.geometry = calfGeometry;
    const sole = new THREE.Mesh(soleGeometry, M.sole);
    sole.name = 'GripSole';
    l.foot.add(sole);
    const heel = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 12), M.shoe);
    heel.scale.set(0.75, 0.8, 1.02);
    heel.position.set(-0.075, 0.025, 0);
    l.foot.add(heel);
    for (let i = 0; i < 6; i++) {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.005, 0.07), M.soleSide);
      tread.position.set(-0.085 + i * 0.032, -0.032, 0);
      l.foot.add(tread);
    }

    for (let i = 0; i < 4; i++) {
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.006, FOOT.wide * 0.75), M.white);
      lace.position.set(-0.03 + i * 0.026, FOOT.thick / 2 + 0.001, 0);
      l.foot.add(lace);
    }
    for (const o of l.foot.children) o.castShadow = true;
    mergeStatic(l.foot, { paint: { from: painted, material: paint } });
  }
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
      arm.elbow.position.copy(elbow);
      arm.cuff.position.copy(elbow).lerp(shoulder, 0.07);
      arm.cuff.scale.set(1, 0.45, 1);
      arm.hand.position.copy(hand);
      arm.hand.quaternion.setFromUnitVectors(UP, new THREE.Vector3().subVectors(hand, elbow).normalize());
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
    rear.knee.position.copy(knee);
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
    front.knee.position.copy(knee);
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
  mergeStatic(upper, { paint: { from: painted, material: paint } });

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
      headMark.getWorldPosition(h);
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
