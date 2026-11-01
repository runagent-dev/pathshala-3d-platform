// Detailed human adapted from walking-third-law: the palms reach the crate or trolley handle,
// while a two-bone gait keeps stance shoes planted as the root advances. Metres; local +x forward.
// Drawn in 22 meshes whatever the pose: the upper body (torso, head, face, hair: parts that never move against each
// other), each hand and each shoe are merged into one mesh each in vertex colours; the limbs stay separate tubes.
import * as THREE from 'three';
import { mergeStatic } from './merge.js';

const HIP_Y = 0.86; // the pelvis (the upper body leans about it)
const HIP_JOINT = 0.78; // where the legs start
const THIGH = 0.43;
const SHIN = 0.41;
const UPPER = 0.29;
const FORE = 0.27;
const SHOULDER = { y: 1.33, z: 0.18 };
const FOOT = { len: 0.24, thick: 0.07, wide: 0.095, back: 0.12, ankle: [-0.06, 0.01] }; // box; ankle in the box's frame

const UP = new THREE.Vector3(0, 1, 0);

export function createPusher({ shirt = '#e8e3d6', trousers = '#3e4452' } = {}) {
  const root = new THREE.Group();
  root.name = 'HumanPusher';
  const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });
  const M = {
    shirt: mat('Shirt', shirt, 0.85),
    trousers: mat('Trousers', trousers, 0.85),
    skin: mat('Skin', '#a8724e', 0.62),
    hair: mat('Hair', '#17171a', 0.7),
    shoe: mat('Shoes', '#5b3b25', 0.5),
    sole: mat('ShoeSole', '#2b2523', 0.85),
    eye: mat('Eyes', '#1b1512', 0.4),
    white: mat('EyeWhite', '#efe8dc'),
    lips: mat('Lips', '#7d4a3a'),
    seam: mat('ShirtSeams', '#d3ccbc', 0.85),
    soleSide: mat('SoleEdge', '#3a322e'),
    belt: mat('Belt', '#3b2a1e', 0.45),
  };
  const limbGeometry = (profile) =>
    new THREE.LatheGeometry(
      profile.map(([y, r]) => new THREE.Vector2(r, y)),
      20,
    );
  // Limbs taper the way real ones do: thick at the body end (y = −0.5), thinner towards the hand or foot.
  const unitTube = limbGeometry([
    [-0.5, 1],
    [-0.25, 0.99],
    [0.1, 0.92],
    [0.5, 0.8],
  ]);
  const foreGeometry = limbGeometry([
    [-0.5, 1],
    [-0.25, 1.03],
    [0.2, 0.86],
    [0.5, 0.74],
  ]);
  const sleeveGeometry = limbGeometry([
    [-0.5, 1],
    [0.35, 0.96],
    [0.5, 0.98],
  ]);
  const thighGeometry = limbGeometry([
    [-0.5, 1],
    [-0.25, 0.99],
    [0.15, 0.9],
    [0.5, 0.82],
  ]);
  const calfGeometry = limbGeometry([
    [-0.5, 0.8],
    [-0.15, 0.79],
    [0.25, 0.74],
    [0.5, 0.73],
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
    for (const key of ['trousers']) {
      M[key].bumpMap = relief;
      M[key].bumpScale = key === 'skin' ? 0.0005 : 0.0012;
    }
  }
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const tmp3 = new THREE.Vector3();
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
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m);
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
        new THREE.Vector2(0.142, -0.03),
        new THREE.Vector2(0.136, 0.0),
        new THREE.Vector2(0.131, 0.1),
        new THREE.Vector2(0.142, 0.24),
        new THREE.Vector2(0.158, 0.36),
        new THREE.Vector2(0.16, 0.43),
        new THREE.Vector2(0.13, 0.48),
        new THREE.Vector2(0.06, 0.51),
      ],
      40,
    ),
    M.shirt,
  );
  torso.scale.set(0.78, 1, 1.18);
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
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.054, 0.09, 16), M.skin);
  neck.position.y = 0.535;
  upper.add(neck);
  const head = ball(0.102, M.skin, upper);
  head.position.set(0.008, 0.655, 0);
  head.name = 'AnatomicalHead';
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
  bridge.position.set(0.091, 0.664, 0);
  bridge.scale.set(0.7, 1.3, 0.62);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 10), M.skin);
  nose.position.set(0.1, 0.648, 0);
  nose.rotation.z = -1.05;
  nose.scale.set(1, 1, 0.8);
  upper.add(nose);
  nose.name = 'Nose';
  const mouthPoints = [-0.026, -0.013, 0, 0.013, 0.026].map((z) => new THREE.Vector3(0.099 - Math.abs(z) * 0.12, 0.617 + Math.abs(z) * 0.07, z));
  const mouth = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints), 12, 0.0026, 6, false), M.lips);
  mouth.name = 'Mouth';
  upper.add(mouth);
  const crown = ball(0.104, M.hair, upper);
  crown.position.set(-0.006, 0.688, 0);
  crown.scale.set(1.0, 0.72, 0.98);
  const fringe = ball(0.05, M.hair, upper);
  fringe.position.set(0.058, 0.728, 0.02);
  fringe.scale.set(0.9, 0.42, 1.25);
  fringe.rotation.z = -0.3;
  const back = ball(0.09, M.hair, upper);
  back.position.set(-0.04, 0.655, 0);
  back.scale.set(0.8, 0.9, 1.04);

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

    const s = ball(0.052, M.shirt, upper);
    s.position.set(0, SHOULDER.y - HIP_Y - 0.012, side * (SHOULDER.z - 0.008));
    s.scale.set(1.05, 0.95, 1);
  }

  // arms and legs (placed in root space by pose)
  function makeHand() {
    const hand = new THREE.Group();
    hand.name = 'AnatomicalHand';
    root.add(hand);
    const palm = ball(0.036, M.skin, hand);
    palm.scale.set(0.78, 1.05, 0.42);
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0072, 0.03 - (i === 0 || i === 3 ? 0.007 : 0), 4, 10), M.skin);
      finger.position.set(-0.021 + i * 0.014, 0.046, 0.002);
      finger.rotation.x = 0.15;
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
    upper: tube(M.skin, root),
    sleeve: new THREE.Mesh(sleeveGeometry, M.shirt),
    fore: new THREE.Mesh(foreGeometry, M.skin),
    hand: makeHand(),
    elbow: ball(0.036, M.skin, root),
    cuff: ball(0.05, M.seam, root),
  }));
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

  for (const arm of arms) {
    arm.hand.name = arm.side > 0 ? 'HandNear' : 'HandFar';
    root.add(arm.sleeve, arm.fore);
  }
  const legs = [1, -1].map((side) => ({
    side,
    thigh: tube(M.trousers, root),
    shin: tube(M.trousers, root),
    foot: new THREE.Group().add(new THREE.Mesh(shoeGeometry, M.shoe)),
    knee: ball(0.063, M.trousers, root),
  }));
  for (const l of legs) {
    root.add(l.foot);
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
  }
  // the seat of the trousers: one piece from the waist over the tops of both thighs
  const seat = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.05, -0.17),
        new THREE.Vector2(0.135, -0.14),
        new THREE.Vector2(0.15, -0.07),
        new THREE.Vector2(0.138, -0.01),
        new THREE.Vector2(0.118, 0.02),
      ],
      32,
    ),
    M.trousers,
  );
  seat.scale.set(0.74, 1, 1.12);
  seat.position.y = HIP_Y;
  root.add(seat);
  const rear = legs[0]; // the right leg: it pushes
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
  function pose({ lean = 0.1, distance = 0, walking = false, hands = null } = {}) {
    upper.rotation.z = -lean;
    for (const arm of arms) {
      const h = SHOULDER.y - HIP_Y;
      shoulder.set(Math.sin(lean) * h, HIP_Y + Math.cos(lean) * h, arm.side * SHOULDER.z);
      const target = hands?.[arm.side > 0 ? 0 : 1];
      if (target) {
        aim.copy(target);
        armPole.set(-0.7, -1, arm.side * 0.3);
      } else {
        aim.set(shoulder.x + 0.06, shoulder.y - UPPER - FORE + 0.03, arm.side * 0.21);
        armPole.set(-1, 0, 0);
      }
      reach(shoulder, aim, UPPER, FORE, armPole, elbow, hand);
      place(arm.upper, shoulder, elbow, 0.045);
      place(arm.sleeve, shoulder, tmp2.copy(shoulder).lerp(elbow, 0.55), 0.053);
      place(arm.fore, elbow, hand, 0.036);
      arm.elbow.position.copy(elbow);
      arm.cuff.position.copy(shoulder).lerp(elbow, 0.55);
      arm.cuff.quaternion.setFromUnitVectors(UP, tmp3.subVectors(elbow, shoulder).normalize());
      arm.cuff.scale.set(1.06, 0.16, 1.06);
      arm.hand.position.copy(hand);
      arm.hand.quaternion.setFromUnitVectors(UP, tmp3.subVectors(hand, elbow).normalize());
      const j = joints.arms[arm.side > 0 ? 0 : 1];
      j.shoulder = (j.shoulder || new THREE.Vector3()).copy(shoulder);
      j.elbow = (j.elbow || new THREE.Vector3()).copy(elbow);
      j.hand = (j.hand || new THREE.Vector3()).copy(hand);
    }
    for (const [i, leg] of legs.entries()) {
      let x = i === 0 ? -0.25 : 0.07,
        y = 0;
      if (walking) {
        const u = (((distance / 0.6 + (i === 0 ? 0 : 0.5)) % 1) + 1) % 1;
        if (u < 0.5) x = 0.15 - 0.6 * u;
        else {
          const q = (u - 0.5) * 2,
            e = q * q * (3 - 2 * q);
          x = -0.15 + 0.3 * e;
          y = Math.sin(Math.PI * q) * 0.07;
        }
      }
      setFoot(leg, leg.side * 0.11, 'toe', x + FOOT.back, y, 0);
      hip.set(0, HIP_JOINT, leg.side * 0.085);
      reach(hip, ankle, THIGH, SHIN, legPole, knee, aim);
      place(leg.thigh, hip, knee, 0.078);
      place(leg.shin, knee, aim, 0.08);
      leg.knee.position.copy(knee);
      storeLeg(i, hip, knee, aim);
      if (i === 0) {
        lastToe.set(x + FOOT.back, y, 0.11);
        lastHeel.set(x - FOOT.back, y, 0.11);
      }
    }
    upper.updateMatrixWorld(true);
  }
  function storeLeg(i, h, k, a) {
    const j = joints.legs[i];
    j.hip = (j.hip || new THREE.Vector3()).copy(h);
    j.knee = (j.knee || new THREE.Vector3()).copy(k);
    j.ankle = (j.ankle || new THREE.Vector3()).copy(a);
  }
  pose();

  // fewer draw calls, the same picture: what never moves against each other becomes one mesh in vertex colours
  const headAt = new THREE.Object3D();
  headAt.name = 'AnatomicalHead';
  headAt.position.copy(head.position);
  const neckAt = new THREE.Object3D();
  neckAt.name = 'Neck';
  neckAt.position.copy(neck.position);
  upper.add(headAt, neckAt);
  head.name = 'Head';
  const paint = {
    from: [M.shirt, M.skin, M.hair, M.shoe, M.sole, M.eye, M.white, M.lips, M.seam, M.soleSide, M.belt],
    material: new THREE.MeshStandardMaterial({ name: 'PersonBody', vertexColors: true, roughness: 0.72, metalness: 0 }),
  };
  mergeStatic(upper, { paint });
  for (const arm of arms) mergeStatic(arm.hand, { paint });
  for (const l of legs) mergeStatic(l.foot, { paint });

  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o !== hit) o.castShadow = true;
  });

  const body = new THREE.Box3();
  return {
    root,
    pose,
    hit,
    rearShoe: rear.foot,
    handAt: (i) => arms[i].hand.position,
    feet: legs.map((l) => l.foot),
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
      neckAt.getWorldPosition(mid);
      out.push([at(new THREE.Vector3(0, HIP_Y, 0)), mid, 0.14, 'trunk']);
      const h = new THREE.Vector3();
      headAt.getWorldPosition(h);
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
