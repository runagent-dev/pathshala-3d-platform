// A village man drawing water, adapted from the archer in kinetic-energy (the same proportions, two-bone limbs and
// face): a royal-blue shirt with short sleeves, grey trousers rolled up to the calf, rubber sandals and a
// moustache. He stands in a stride towards the well, leans back from the hips and
// grips the rope with both fists; pose() puts each fist on a point of the rope (two-bone reach for the arms and the
// legs). Metres. In the root's own frame he faces +x (the root is turned to face the well); +z is his left.
import * as THREE from 'three';

const HIP_Y = 0.87; // the pelvis (the upper body leans about it)
const HIP_JOINT = 0.8; // where the legs start
const THIGH = 0.42;
const SHIN = 0.4;
const UPPER = 0.29;
const FORE = 0.25; // elbow to wrist
const GRIP = 0.07; // wrist to the middle of the fist (where the rope runs)
const SHOULDER = { y: 0.47, z: 0.175 }; // above the pelvis, across
const ANKLE = 0.075;

const UP = new THREE.Vector3(0, 1, 0);

export function createPerson({ shirt = '#2457c9', trousers = '#4a4f5c' } = {}) {
  const root = new THREE.Group();
  root.name = 'Villager';
  const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });
  const M = {
    shirt: mat('Shirt', shirt, 0.82),
    shirtDark: mat('ShirtSeam', '#1a3f96', 0.8),
    button: mat('Button', '#e9e2cf', 0.5),
    trousers: mat('Trousers', trousers, 0.88),
    skin: mat('Skin', '#9c6440', 0.6),
    skinDark: mat('SkinShade', '#7e4e30', 0.65),
    hair: mat('Hair', '#141416', 0.7),
    eye: mat('Eyes', '#1b1512', 0.4),
    white: mat('EyeWhite', '#efe6d8'),
    lips: mat('Lips', '#6e3d2e'),
    sandal: mat('Sandal', '#1f6fd1', 0.6),
    sole: mat('SandalSole', '#2a2a2e', 0.9),
  };
  // a faint weave on the shirt and the trousers (procedural, offline)
  if (typeof document !== 'undefined') {
    const n = document.createElement('canvas');
    n.width = n.height = 64;
    const nctx = /** @type {CanvasRenderingContext2D} */ (n.getContext('2d'));
    const data = nctx.createImageData(64, 64);
    let seed = 23;
    for (let i = 0; i < 64 * 64; i++) {
      seed = (seed * 16807) % 2147483647;
      const v = 115 + (seed % 25);
      data.data.set([v, v, v, 255], i * 4);
    }
    nctx.putImageData(data, 0, 0);
    const relief = new THREE.CanvasTexture(n);
    relief.wrapS = relief.wrapT = THREE.RepeatWrapping;
    relief.repeat.set(6, 6);
    for (const key of ['shirt', 'trousers']) {
      M[key].bumpMap = relief;
      M[key].bumpScale = 0.0012;
    }
  }
  const lathe = (profile, segments = 20) =>
    new THREE.LatheGeometry(
      profile.map(([y, r]) => new THREE.Vector2(r, y)),
      segments,
    );
  // unit limbs (length 1 along y, radius 1), scaled by place()
  const tubeG = lathe([
    [-0.5, 1],
    [-0.25, 0.99],
    [0.1, 0.92],
    [0.5, 0.8],
  ]);
  const foreG = lathe([
    [-0.5, 0.78],
    [-0.2, 0.86],
    [0.25, 1.02],
    [0.5, 0.92],
  ]);
  const thighG = lathe([
    [-0.5, 0.82],
    [-0.15, 0.9],
    [0.25, 0.99],
    [0.5, 1],
  ]);
  const calfG = lathe([
    [-0.5, 0.62],
    [-0.1, 0.8],
    [0.3, 0.9],
    [0.5, 0.86],
  ]);
  const tmp = new THREE.Vector3();
  const place = (mesh, a, b, r) => {
    tmp.subVectors(b, a);
    const len = tmp.length();
    mesh.position.addVectors(a, b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(UP, tmp.divideScalar(len || 1));
    mesh.scale.set(r, len, r);
  };
  const ball = (r, m, parent, name = '') => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  const part = (g, m, parent, name = '') => {
    const mesh = new THREE.Mesh(g, m);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  // ── the trunk (leans about the pelvis): the shirt, its collar and buttons ───────────────────────────────────────────
  const upper = new THREE.Group();
  upper.name = 'UpperBody';
  root.add(upper);
  const torso = part(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.14, -0.1),
        new THREE.Vector2(0.142, 0.0),
        new THREE.Vector2(0.136, 0.1),
        new THREE.Vector2(0.146, 0.24),
        new THREE.Vector2(0.162, 0.36),
        new THREE.Vector2(0.163, 0.42),
        new THREE.Vector2(0.13, 0.47),
        new THREE.Vector2(0.06, 0.5),
      ],
      40,
    ),
    M.shirt,
    upper,
    'Shirt',
  );
  torso.scale.set(0.76, 1, 1.18);
  // the shirt hangs out over the trousers: a hem a little wider than the waist
  const hem = part(new THREE.CylinderGeometry(0.145, 0.15, 0.06, 32, 1, true), M.shirt, upper, 'ShirtHem');
  hem.scale.set(0.78, 1, 1.18);
  hem.position.y = -0.12;
  hem.material.side = THREE.DoubleSide;
  const placket = part(new THREE.BoxGeometry(0.012, 0.44, 0.03), M.shirtDark, upper, 'Placket');
  placket.position.set(0.112, 0.2, 0);
  for (let i = 0; i < 5; i++) ball(0.0065, M.button, upper, 'Button').position.set(0.12, 0.38 - i * 0.085, 0);
  for (const side of [-1, 1]) {
    const collar = part(new THREE.BoxGeometry(0.05, 0.06, 0.07), M.shirt, upper, 'Collar');
    collar.position.set(0.06, 0.475, side * 0.05);
    collar.rotation.x = side * 0.45;
    collar.rotation.z = -0.3;
    // the shoulders, rounded
    ball(0.056, M.shirt, upper, 'Shoulder').position.set(0, SHOULDER.y - 0.012, side * (SHOULDER.z - 0.006));
  }
  const neck = part(new THREE.CylinderGeometry(0.046, 0.053, 0.1, 16), M.skin, upper, 'Neck');
  neck.position.y = 0.53;
  // ── the head (turns about the neck to look at the pulley) ───────────────────────────────────────────────────────
  const NECK_Y = 0.56;
  const headPivot = new THREE.Group();
  headPivot.position.y = NECK_Y;
  upper.add(headPivot);
  const headG = new THREE.Group();
  headG.position.y = -NECK_Y;
  headPivot.add(headG);
  const head = ball(0.102, M.skin, headG, 'Head');
  head.position.set(0.008, 0.655, 0);
  head.scale.set(0.94, 1.1, 0.85);
  const jaw = ball(0.072, M.skin, headG, 'Jaw');
  jaw.position.set(0.034, 0.61, 0);
  jaw.scale.set(0.85, 0.85, 0.95);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.106, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), M.hair);
  hair.position.set(-0.008, 0.675, 0);
  hair.rotation.z = 0.32;
  hair.scale.set(0.98, 1.06, 0.95);
  headG.add(hair);
  const crown = ball(0.104, M.hair, headG, 'Crown');
  crown.position.set(-0.006, 0.688, 0);
  crown.scale.set(1.0, 0.72, 0.98);
  const backHair = ball(0.09, M.hair, headG, 'BackHair');
  backHair.position.set(-0.04, 0.655, 0);
  backHair.scale.set(0.8, 0.9, 1.04);
  const bridge = ball(0.018, M.skin, headG, 'NoseBridge');
  bridge.position.set(0.091, 0.664, 0);
  bridge.scale.set(0.7, 1.3, 0.62);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.042, 10), M.skin);
  nose.position.set(0.1, 0.646, 0);
  nose.rotation.z = -1.05;
  nose.scale.set(1, 1, 0.85);
  headG.add(nose);
  // a moustache and the mouth under it, set with effort
  const stache = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.04, 4, 8), M.hair);
  stache.rotation.x = Math.PI / 2;
  stache.position.set(0.098, 0.628, 0);
  headG.add(stache);
  const mouthPoints = [-0.022, -0.011, 0, 0.011, 0.022].map((z) => new THREE.Vector3(0.096 - Math.abs(z) * 0.12, 0.612, z));
  headG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints), 12, 0.0026, 6, false), M.lips));
  for (const side of [1, -1]) {
    const ear = ball(0.025, M.skin, headG, 'Ear');
    ear.position.set(-0.008, 0.65, side * 0.084);
    ear.scale.set(0.65, 1.1, 0.65);
    const eye = ball(0.013, M.white, headG, 'EyeWhite');
    eye.scale.set(0.35, 0.65, 1);
    eye.position.set(0.064, 0.682, side * 0.064);
    eye.rotation.y = -side * 0.7;
    const pupil = ball(0.006, M.eye, headG, 'Pupil');
    pupil.scale.set(0.45, 1, 1);
    pupil.position.set(0.068, 0.684, side * 0.068);
    pupil.rotation.y = -side * 0.7;
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.0034, 0.022, 3, 8), M.hair);
    brow.rotation.x = Math.PI / 2;
    brow.rotation.y = side * 0.22; // drawn together with effort
    brow.position.set(0.066, 0.7, side * 0.06);
    headG.add(brow);
  }

  // ── arms: a short sleeve over the upper arm, bare forearms, fists that close round the rope ───────────────────────
  function makeFist() {
    const fist = new THREE.Group();
    root.add(fist);
    const palm = ball(0.036, M.skin, fist, 'Palm');
    palm.scale.set(0.8, 1.05, 0.5);
    palm.position.y = 0.02;
    // four fingers curled round the rope (the rope runs across the fist, along the hand's x)
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.0085, 8, 12, Math.PI * 1.25), M.skin);
      finger.name = 'Finger';
      finger.rotation.y = Math.PI / 2;
      finger.rotation.x = -0.3;
      finger.position.set(-0.024 + i * 0.016, GRIP - 0.002, 0.004);
      fist.add(finger);
    }
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.03, 4, 8), M.skin);
    thumb.name = 'Thumb';
    thumb.position.set(-0.03, GRIP - 0.012, -0.018);
    thumb.rotation.z = 1.2;
    fist.add(thumb);
    return fist;
  }
  const arms = [1, -1].map((side) => ({
    side,
    upper: part(tubeG, M.skin, root, 'UpperArm'),
    sleeve: part(
      lathe([
        [-0.5, 1],
        [0.35, 1.02],
        [0.5, 1.06],
      ]),
      M.shirt,
      root,
      'Sleeve',
    ),
    fore: part(foreG, M.skin, root, 'Forearm'),
    elbow: ball(0.037, M.skin, root, 'Elbow'),
    fist: makeFist(),
  }));

  // ── legs: trousers rolled up below the knee, bare calves, sandals ────────────────────────────────────────────────
  const footShape = new THREE.Shape();
  footShape.moveTo(-0.1, -0.035);
  footShape.quadraticCurveTo(-0.118, 0, -0.1, 0.035);
  footShape.lineTo(0.06, 0.045);
  footShape.quadraticCurveTo(0.125, 0.04, 0.128, 0);
  footShape.quadraticCurveTo(0.125, -0.042, 0.06, -0.045);
  footShape.lineTo(-0.1, -0.035);
  const soleG = new THREE.ExtrudeGeometry(footShape, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.004, bevelSegments: 2 });
  soleG.rotateX(Math.PI / 2);
  soleG.translate(0, 0.016, 0);
  const legs = [1, -1].map((side) => {
    const foot = new THREE.Group();
    root.add(foot);
    part(soleG, M.sole, foot, 'SandalSole');
    const top = part(soleG, M.sandal, foot, 'SandalTop');
    top.scale.set(1, 0.45, 1);
    top.position.y = 0.012;
    // the bare foot on the sandal: an instep and toes
    const instep = ball(0.042, M.skin, foot, 'Foot');
    instep.scale.set(1.9, 0.62, 0.95);
    instep.position.set(-0.005, 0.045, 0);
    for (let i = 0; i < 5; i++) {
      const toe = ball(0.0105 - i * 0.0011, M.skin, foot, 'Toe');
      toe.position.set(0.098 - i * 0.006, 0.034, -0.03 + i * 0.015);
    }
    // a V strap between the toes to both sides
    for (const s of [-1, 1]) {
      const strap = part(new THREE.BoxGeometry(0.075, 0.01, 0.014), M.sandal, foot, 'Strap');
      strap.position.set(0.045, 0.055, s * 0.02);
      strap.rotation.y = s * 0.65;
      strap.rotation.z = 0.25;
    }
    return {
      side,
      foot,
      thigh: part(thighG, M.trousers, root, 'Thigh'),
      shin: part(calfG, M.trousers, root, 'TrouserLeg'),
      calf: part(calfG, M.skin, root, 'Calf'),
      roll: part(new THREE.TorusGeometry(1, 0.22, 8, 20), M.trousers, root, 'TrouserRoll'),
      knee: ball(0.062, M.trousers, root, 'Knee'),
    };
  });
  const seat = part(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.05, -0.17),
        new THREE.Vector2(0.135, -0.14),
        new THREE.Vector2(0.152, -0.07),
        new THREE.Vector2(0.14, -0.01),
        new THREE.Vector2(0.12, 0.02),
      ],
      32,
    ),
    M.trousers,
    root,
    'Seat',
  );
  seat.scale.set(0.68, 1, 1.0);

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
  const wrist = new THREE.Vector3();
  const grip = new THREE.Vector3();
  const hip = new THREE.Vector3();
  const knee = new THREE.Vector3();
  const ankle = new THREE.Vector3();
  const end = new THREE.Vector3();
  const pole = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const legPole = new THREE.Vector3(1, 0.1, 0);
  const lastGrip = [new THREE.Vector3(), new THREE.Vector3()];
  const ropeDir = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const xAxis = new THREE.Vector3();
  const zAxis = new THREE.Vector3();
  const basis = new THREE.Matrix4();

  /**
   * hands: where each fist holds the rope (root frame: x towards the well, y up, z his left); rope: the rope's
   * direction through the fists (towards the pulley), so the fists turn to it; lean: how far the trunk leans back
   * (rad); hipX: the pelvis forward (+) or back (−) of the feet's middle; look: how far up he looks (rad).
   */
  function pose({ hands, rope = new THREE.Vector3(1, 0.5, 0), lean = 0.22, hipX = -0.06, hipDrop = 0.03, look = 0.35, front = 0.3, back = -0.26 }) {
    const hipY = HIP_Y - hipDrop;
    upper.position.set(hipX, hipY, 0);
    upper.rotation.z = lean; // positive: the shoulders go back (−x)
    headPivot.rotation.set(0, 0, look - lean);
    seat.position.set(hipX, hipY - 0.03, 0);
    seat.rotation.z = lean * 0.4;
    ropeDir.copy(rope).normalize();
    const c = Math.cos(lean);
    const s = Math.sin(lean);
    for (const [i, arm] of arms.entries()) {
      // the shoulder, turned with the trunk
      shoulder.set(hipX - s * SHOULDER.y, hipY + c * SHOULDER.y, arm.side * SHOULDER.z);
      pole.set(-0.25, -1, arm.side * 0.7);
      // the fist's middle is GRIP beyond the wrist, along the forearm: reach for the wrist so the fist lands on the rope
      reach(shoulder, hands[i], UPPER, FORE + GRIP, pole, elbow, grip);
      dir.subVectors(grip, elbow).normalize();
      wrist.copy(elbow).addScaledVector(dir, FORE);
      lastGrip[i].copy(grip);
      place(arm.upper, shoulder, elbow, 0.046);
      place(arm.sleeve, shoulder, mid.copy(shoulder).lerp(elbow, 0.5), 0.062);
      place(arm.fore, elbow, wrist, 0.038);
      arm.elbow.position.copy(elbow);
      // the fist: its y along the forearm, its x along the rope (the fingers curl round the rope)
      arm.fist.position.copy(wrist);
      xAxis.copy(ropeDir).addScaledVector(dir, -ropeDir.dot(dir));
      if (xAxis.lengthSq() < 1e-6) xAxis.set(0, 0, 1);
      xAxis.normalize();
      zAxis.crossVectors(xAxis, dir);
      basis.makeBasis(xAxis, dir, zAxis);
      arm.fist.quaternion.setFromRotationMatrix(basis);
    }
    for (const leg of legs) {
      // a stride towards the well: the near leg forward, the far leg back, the feet a little apart
      const fx = leg.side > 0 ? front : back;
      const z = leg.side * 0.11;
      leg.foot.position.set(fx, 0, z);
      leg.foot.rotation.set(0, -leg.side * 0.12, 0);
      ankle.set(fx - 0.055, ANKLE, z);
      hip.set(hipX, hipY - (HIP_Y - HIP_JOINT), leg.side * 0.085);
      reach(hip, ankle, THIGH, SHIN, legPole, knee, end);
      place(leg.thigh, hip, knee, 0.078);
      // the trousers to a roll part way down the calf, the bare calf below
      const roll = mid.copy(knee).lerp(end, 0.45);
      place(leg.shin, knee, roll, 0.07);
      place(leg.calf, roll, end, 0.058);
      leg.roll.position.copy(roll);
      leg.roll.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.subVectors(end, knee).normalize());
      leg.roll.scale.setScalar(0.062);
      leg.knee.position.copy(knee);
    }
  }

  // an invisible box round him (taps)
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 0.9, 0);
  hit.userData.noExport = true;
  root.add(hit);

  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o !== hit) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  const box = new THREE.Box3();
  return {
    root,
    pose,
    hit,
    /** Where a fist holds the rope (root frame, after the last pose). */
    gripAt: (i) => lastGrip[i],
    /** The head's centre (world). */
    head: () => head.getWorldPosition(new THREE.Vector3()),
    /** His box in world space, without the hit box. */
    box() {
      box.makeEmpty();
      root.updateWorldMatrix(true, true);
      for (const c of root.children) if (c !== hit) box.expandByObject(c);
      return box;
    },
    materials: M,
    reach: UPPER + FORE + GRIP,
    shoulderHeight: HIP_Y + SHOULDER.y,
  };
}
