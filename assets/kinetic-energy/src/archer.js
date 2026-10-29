// A realistic archer, adapted from the pusher in types-of-friction (same proportions, limbs and face): he stands
// side-on to the target in a firm stance, feet apart, chest to the camera, the bow arm straight out to +x, the head
// turned to look along the arrow, and the drawing hand on the string. Metres. The root is world-aligned (+x towards
// the target, +z towards the camera); the body inside it faces +z.
import * as THREE from 'three';

const HIP_Y = 0.86; // the pelvis
const HIP_JOINT = 0.78; // where the legs start
const THIGH = 0.38; // a little shorter than the pusher's, so he stands tall on soft knees
const SHIN = 0.36;
const UPPER = 0.3;
const FORE = 0.28;
const HOOK = 0.46; // elbow to the fingers' hook on the string: forearm, palm and curled fingers
const WRIST = 0.32;
const SHOULDER = { y: 1.33, z: 0.18 }; // body frame: z across the shoulders
const STANCE = 0.21; // half the distance between the feet
const FOOT = { len: 0.24, thick: 0.07, wide: 0.095, back: 0.12, ankle: [-0.06, 0.01] };

const UP = new THREE.Vector3(0, 1, 0);

/** Root space (world-aligned) → the body's frame (it faces +z of the root): x_b = z, z_b = −x. */
const toBody = (v, out) => out.set(v.z, v.y, -v.x);
/** The body's frame → root space. */
const toRoot = (v, out) => out.set(-v.z, v.y, v.x);

/** Where the bow shoulder (left) is, in root space. The bow hand goes straight out from it. */
export const BOW_SHOULDER = new THREE.Vector3(SHOULDER.z, SHOULDER.y, 0);
export const DRAW_SHOULDER = new THREE.Vector3(-SHOULDER.z, SHOULDER.y, 0);
export const ARM = UPPER + FORE;

export function createArcher({ jacket = '#2a5db0', trousers = '#353a46' } = {}) {
  const root = new THREE.Group();
  root.name = 'Archer';
  const body = new THREE.Group();
  body.rotation.y = -Math.PI / 2; // body +x (its front) → root +z
  root.add(body);
  const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });
  const M = {
    jacket: mat('Jacket', jacket, 0.82),
    lining: mat('JacketTrim', '#1d3f7a', 0.8),
    tee: mat('Tee', '#e9eef5', 0.85),
    trousers: mat('Trousers', trousers, 0.85),
    skin: mat('Skin', '#a8724e', 0.62),
    hair: mat('Hair', '#17171a', 0.7),
    shoe: mat('Shoes', '#4a3020', 0.5),
    sole: mat('ShoeSole', '#2b2523', 0.85),
    eye: mat('Eyes', '#1b1512', 0.4),
    white: mat('EyeWhite', '#efe8dc'),
    lips: mat('Lips', '#7d4a3a'),
    soleSide: mat('SoleEdge', '#3a322e'),
    belt: mat('Belt', '#3b2a1e', 0.45),
    leather: mat('ArmGuard', '#8a4b22', 0.55),
    quiver: mat('Quiver', '#6b3a1c', 0.6),
    fletch: mat('QuiverFletching', '#f2c230', 0.7),
  };
  const limbGeometry = (profile) =>
    new THREE.LatheGeometry(
      profile.map(([y, r]) => new THREE.Vector2(r, y)),
      20,
    );
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
  // a faint weave on the cloth (procedural, offline)
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
    for (const key of ['trousers', 'jacket']) {
      M[key].bumpMap = relief;
      M[key].bumpScale = 0.0012;
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
  const ball = (r, m, parent) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m);
    parent.add(mesh);
    return mesh;
  };

  // the trunk: a jacket over a light tee
  const upper = new THREE.Group();
  upper.position.y = HIP_Y;
  body.add(upper);
  const torso = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.146, -0.06),
        new THREE.Vector2(0.14, 0.0),
        new THREE.Vector2(0.133, 0.1),
        new THREE.Vector2(0.144, 0.24),
        new THREE.Vector2(0.16, 0.36),
        new THREE.Vector2(0.162, 0.43),
        new THREE.Vector2(0.13, 0.48),
        new THREE.Vector2(0.06, 0.51),
      ],
      40,
    ),
    M.jacket,
  );
  torso.scale.set(0.78, 1, 1.18);
  upper.add(torso);
  // the open front of the jacket shows the tee; a zip edge on each side, a collar
  const tee = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.36, 0.07), M.tee);
  tee.position.set(0.118, 0.27, 0);
  upper.add(tee);
  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.42, 0.012), M.lining);
    edge.position.set(0.121, 0.25, side * 0.04);
    upper.add(edge);
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.07), M.lining);
    collar.position.set(0.055, 0.468, side * 0.058);
    collar.rotation.x = side * 0.35;
    upper.add(collar);
  }
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.132, 0.05, 16), M.belt);
  belt.position.y = 0.0;
  belt.scale.set(0.74, 1, 1);
  upper.add(belt);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.054, 0.09, 16), M.skin);
  neck.position.y = 0.535;
  upper.add(neck);

  // the head turns about the neck to look along the arrow
  const NECK_Y = 0.56;
  const headPivot = new THREE.Group();
  headPivot.position.y = NECK_Y;
  upper.add(headPivot);
  const headG = new THREE.Group();
  headG.position.y = -NECK_Y;
  headPivot.add(headG);
  const head = ball(0.102, M.skin, headG);
  head.position.set(0.008, 0.655, 0);
  head.name = 'Head';
  head.scale.set(0.94, 1.1, 0.85);
  const jaw = ball(0.072, M.skin, headG);
  jaw.position.set(0.034, 0.61, 0);
  jaw.scale.set(0.85, 0.85, 0.95);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.106, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), M.hair);
  hair.position.set(-0.008, 0.675, 0);
  hair.rotation.z = 0.32;
  hair.scale.set(0.98, 1.06, 0.95);
  headG.add(hair);
  const bridge = ball(0.018, M.skin, headG);
  bridge.position.set(0.091, 0.664, 0);
  bridge.scale.set(0.7, 1.3, 0.62);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 10), M.skin);
  nose.position.set(0.1, 0.648, 0);
  nose.rotation.z = -1.05;
  nose.scale.set(1, 1, 0.8);
  headG.add(nose);
  const mouthPoints = [-0.026, -0.013, 0, 0.013, 0.026].map((z) => new THREE.Vector3(0.099 - Math.abs(z) * 0.12, 0.617 + Math.abs(z) * 0.03, z));
  const mouth = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints), 12, 0.0026, 6, false), M.lips);
  headG.add(mouth);
  const crown = ball(0.104, M.hair, headG);
  crown.position.set(-0.006, 0.688, 0);
  crown.scale.set(1.0, 0.72, 0.98);
  const fringe = ball(0.05, M.hair, headG);
  fringe.position.set(0.058, 0.728, 0.02);
  fringe.scale.set(0.9, 0.42, 1.25);
  fringe.rotation.z = -0.3;
  const back = ball(0.09, M.hair, headG);
  back.position.set(-0.04, 0.655, 0);
  back.scale.set(0.8, 0.9, 1.04);
  for (const side of [1, -1]) {
    const ear = ball(0.025, M.skin, headG);
    ear.position.set(-0.008, 0.65, side * 0.084);
    ear.scale.set(0.65, 1.1, 0.65);
    const eye = ball(0.013, M.white, headG);
    eye.scale.set(0.35, 0.65, 1);
    eye.position.set(0.064, 0.682, side * 0.064);
    eye.rotation.y = -side * 0.7;
    const pupil = ball(0.006, M.eye, headG);
    pupil.scale.set(0.45, 1, 1);
    pupil.position.set(0.068, 0.682, side * 0.068);
    pupil.rotation.y = -side * 0.7;
    // a concentrating brow, a little lower towards the nose
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.0032, 0.022, 3, 8), M.hair);
    brow.rotation.x = Math.PI / 2;
    brow.rotation.y = side * 0.18;
    brow.position.set(0.064, 0.699, side * 0.062);
    headG.add(brow);

    const s = ball(0.054, M.jacket, upper);
    s.position.set(0, SHOULDER.y - HIP_Y - 0.012, side * (SHOULDER.z - 0.008));
    s.scale.set(1.05, 0.95, 1);
  }

  // a hip quiver with yellow fletchings, on the drawing side (body +z = root −x)
  const quiver = new THREE.Group();
  quiver.name = 'Quiver';
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.42, 16, 1, true), M.quiver);
  tube.material.side = THREE.DoubleSide;
  quiver.add(tube);
  for (let i = 0; i < 3; i++) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.16, 6), M.lining);
    shaft.position.set(-0.012 + i * 0.012, 0.27, (i - 1) * 0.014);
    quiver.add(shaft);
    const vane = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.07, 0.022), M.fletch);
    vane.position.set(-0.012 + i * 0.012, 0.32, (i - 1) * 0.014);
    quiver.add(vane);
  }
  quiver.position.set(-0.05, HIP_Y - 0.12, 0.165);
  quiver.rotation.x = 0.25;
  quiver.rotation.z = 0.2;
  body.add(quiver);

  // arms and legs (placed in the body frame by pose)
  function makeHand() {
    const hand = new THREE.Group();
    body.add(hand);
    const palm = ball(0.036, M.skin, hand);
    palm.scale.set(0.78, 1.05, 0.42);
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0072, 0.024 - (i === 0 || i === 3 ? 0.006 : 0), 4, 10), M.skin);
      finger.position.set(-0.021 + i * 0.014, 0.042, 0.006);
      finger.rotation.x = 0.55; // curled round the grip or the string
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
    upper: new THREE.Mesh(unitTube, M.skin),
    sleeve: new THREE.Mesh(sleeveGeometry, M.jacket),
    fore: new THREE.Mesh(foreGeometry, M.jacket), // long sleeves to the wrist
    hand: makeHand(),
    elbow: ball(0.04, M.jacket, body),
    cuff: ball(0.04, M.lining, body),
  }));
  for (const arm of arms) {
    arm.hand.name = arm.side > 0 ? 'DrawHand' : 'BowHand';
    body.add(arm.upper, arm.sleeve, arm.fore);
    arm.upper.visible = false; // the sleeve covers it
  }
  // a leather arm guard on the bow forearm
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 1, true), M.leather);
  guard.material.side = THREE.DoubleSide;
  body.add(guard);

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
    thigh: new THREE.Mesh(thighGeometry, M.trousers),
    shin: new THREE.Mesh(calfGeometry, M.trousers),
    foot: new THREE.Mesh(shoeGeometry, M.shoe),
    knee: ball(0.063, M.trousers, body),
  }));
  for (const l of legs) {
    body.add(l.thigh, l.shin, l.foot);
    l.foot.add(new THREE.Mesh(soleGeometry, M.sole));
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
  body.add(seat);

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
  const pole = new THREE.Vector3();
  // at full draw the draw elbow is out behind the head, a little above the arrow and behind its line, the forearm
  // nearly along the arrow (body frame: +z = away from the bow, −x = the archer's back); the bow elbow turns down
  const POLES = { draw: new THREE.Vector3(-0.5, 0.2, 0.6), bow: new THREE.Vector3(0.2, -1, 0) };
  const dir = new THREE.Vector3();
  const legPole = new THREE.Vector3(1, 0, 0);

  /**
   * bowHand: the bow hand's palm on the grip; drawHand: the fingers' hook on the string; both in root space.
   * headYaw: how far the head turns towards the target. The drawing shoulder comes forward a little when the string
   * is far (protraction).
   */
  function pose({ bowHand, drawHand, headYaw = 1.25 }) {
    headPivot.rotation.set(0, headYaw, -0.06);
    for (const arm of arms) {
      const isDraw = arm.side > 0;
      shoulder.set(0, SHOULDER.y, arm.side * SHOULDER.z);
      toBody(isDraw ? drawHand : bowHand, aim);
      if (isDraw) {
        const far = Math.max(0, shoulder.distanceTo(aim) - (UPPER + HOOK) * 0.93);
        shoulder.z -= Math.min(0.07, far); // towards the bow
      }
      pole.copy(isDraw ? POLES.draw : POLES.bow);
      reach(shoulder, aim, UPPER, isDraw ? HOOK : FORE, pole, elbow, hand);
      if (isDraw) {
        // the hook is at the fingertips: the wrist and the palm are back along the forearm
        dir.subVectors(hand, elbow).normalize();
        hand.copy(elbow).addScaledVector(dir, WRIST + 0.045);
        tmp3.copy(elbow).addScaledVector(dir, WRIST);
      } else tmp3.copy(hand);
      place(arm.sleeve, shoulder, elbow, 0.056);
      place(arm.fore, elbow, tmp3, 0.042);
      arm.elbow.position.copy(elbow);
      arm.cuff.position.copy(hand).lerp(elbow, 0.08);
      arm.cuff.quaternion.setFromUnitVectors(UP, tmp3.subVectors(hand, elbow).normalize());
      arm.cuff.scale.set(0.95, 0.35, 0.95);
      arm.hand.position.copy(hand);
      arm.hand.quaternion.setFromUnitVectors(UP, tmp2.subVectors(hand, elbow).normalize());
      if (!isDraw) {
        // the arm guard: on the inside of the forearm, from the wrist half way to the elbow
        const a = tmp2.copy(hand).lerp(elbow, 0.12);
        const b = tmp.copy(hand).lerp(elbow, 0.6);
        guard.position.addVectors(a, b).multiplyScalar(0.5);
        guard.quaternion.setFromUnitVectors(UP, tmp3.subVectors(b, a).normalize());
        guard.scale.set(0.045, a.distanceTo(b), 0.045);
      }
    }
    for (const leg of legs) {
      // a firm stance: feet a shoulder's width apart, toes to the camera, slightly turned out
      const z = leg.side * STANCE;
      leg.foot.position.set(0.04, FOOT.thick / 2, z);
      leg.foot.rotation.set(0, -leg.side * 0.18, 0);
      ankle.set(0.04 + FOOT.ankle[0], FOOT.thick / 2 + FOOT.ankle[1], z);
      hip.set(0, HIP_JOINT, leg.side * 0.085);
      reach(hip, ankle, THIGH, SHIN, legPole, knee, aim);
      place(leg.thigh, hip, knee, 0.08);
      place(leg.shin, knee, aim, 0.08);
      leg.knee.position.copy(knee);
    }
  }

  // a big invisible box round the archer's drawing side: a tap on it shoots
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0.1, 0.95, 0);
  hit.userData.noExport = true;
  root.add(hit);

  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o !== hit) o.castShadow = true;
  });

  const box = new THREE.Box3();
  const headAt = new THREE.Vector3();
  return {
    root,
    pose,
    hit,
    /** The drawing hand, in root space (after the last pose). */
    drawHand: () => toRoot(arms[0].hand.position, new THREE.Vector3()),
    /** The head's centre, world space. */
    head: () => head.getWorldPosition(headAt),
    drawHandMesh: arms[0].hand,
    /** The archer's box in world space (for the camera), without the hit box. */
    box() {
      box.makeEmpty();
      body.updateWorldMatrix(true, true);
      return box.expandByObject(body);
    },
    materials: M,
  };
}
