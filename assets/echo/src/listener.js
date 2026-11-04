// The student, in metres, standing on y = 0 and facing +z (the app turns them to face the cliff): a class-9 student in
// school uniform (light blue shirt, navy trousers, black shoes) of real proportions, about 1.62 m tall, with a calm
// face at rest (no cartoon smile) and real hands (palm, four fingers together, thumb). The body is jointed at the
// waist, neck, shoulders, elbows and wrists, so setCall(k, open) can move it from standing at rest (k = 0: arms down) to
// the way people really call at a hill (k = 1): both hands cupped round the mouth with the palms angled forward, the
// elbows out and up, the chest forward, the head tilted up toward the cliff's top; open (0…1) opens the mouth and
// drops the jaw. The call pose is solved once (two-bone reach from the shoulder to a wrist beside the jaw), then only
// quaternions are blended. Merged shapes, one mesh per material and part.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const mat = (name, color, o = {}) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.8, metalness: 0, ...o });

const HEAD = { y: 1.5, rx: 0.084, ry: 0.11, rz: 0.098 };
const SHOULDER = { x: 0.188, y: 1.34 };
const UPPER = 0.29; // shoulder to elbow
const FORE = 0.25; // elbow to wrist
const HIP = { x: 0.088, y: 0.86 };
const WAIST = 0.98; // the torso bends here
const NECK = 1.42; // the head turns here
const LEAN = 0.09; // the chest forward in the call (rad)
const TILT = 0.2; // the head up toward the cliff's top in the call (rad, from level)
const LIPS = { y: HEAD.y - 0.06, z: 0.095 }; // the lips, head upright
export const HEIGHT = HEAD.y + HEAD.ry;

const rotX = (y, z, a) => ({ y: y * Math.cos(a) - z * Math.sin(a), z: y * Math.sin(a) + z * Math.cos(a) });
/** The lips in the torso's frame in the call pose (the head leans back on the neck: −LEAN − TILT from the torso). */
const LIPS_T = (() => {
  const r = rotX(LIPS.y - NECK, LIPS.z, -LEAN - TILT);
  return { y: NECK + r.y, z: r.z };
})();
/**
 * Where the mouth is in the call pose (m, above the ground and in front of the feet, on the student's own axes): the
 * sound's source. The ears stay near z = 0 (the torso's lean brings them about 0.04 m forward).
 */
export const MOUTH = (() => {
  const r = rotX(LIPS_T.y - WAIST, LIPS_T.z, LEAN);
  return { y: WAIST + r.y, z: r.z };
})();

function pill(r0, r1, len, seg = 18, n = 5) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r0), r0 + Math.sin(a) * r0));
  }
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r1), len - r1 + Math.sin(a) * r1));
  }
  return new THREE.LatheGeometry(pts, seg);
}
const lathe = (profile, seg = 28) =>
  new THREE.LatheGeometry(
    profile.map(([y, r]) => new THREE.Vector2(Math.max(1e-4, r), y)),
    seg,
  );

/** Moves a built group's pivot to (x, y, z) without moving its shapes. */
function pivot(group, x, y, z) {
  for (const m of group.children) m.geometry.translate(-x, -y, -z);
  group.position.set(x, y, z);
  return group;
}

function builder() {
  /** @type {Map<THREE.Material, THREE.BufferGeometry[]>} */
  const byMat = new Map();
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const sc = new THREE.Vector3();
  const at = new THREE.Vector3();
  function add(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, quat = null } = {}) {
    // indexed shapes stay indexed (half the size in the GLB)
    const g = geo.clone();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal'].includes(name)) g.deleteAttribute(name);
    g.applyMatrix4(m4.compose(at.set(x, y, z), quat ?? q.setFromEuler(e.set(rx, ry, rz)), sc.set(sx, sy, sz)));
    if (!byMat.has(material)) byMat.set(material, []);
    byMat.get(material).push(g);
  }
  function build(name) {
    const group = new THREE.Group();
    group.name = name;
    for (const [material, list] of byMat) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), material);
      for (const g of list) g.dispose();
      mesh.name = `${name}-${material.name}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    byMat.clear();
    return group;
  }
  return { add, build };
}

export function createListener() {
  const M = {
    skin: mat('Skin', '#9c6644', { roughness: 0.6 }),
    shirt: mat('Shirt', '#cfe0f2', { roughness: 0.85 }),
    trousers: mat('Trousers', '#27324a', { roughness: 0.85 }),
    belt: mat('Belt', '#1e1a17', { roughness: 0.5 }),
    shoe: mat('Shoe', '#15171b', { roughness: 0.35 }),
    hair: mat('Hair', '#14100d', { roughness: 0.6 }),
    dark: mat('Eye', '#1b1512', { roughness: 0.3 }),
    lips: mat('Lips', '#6e3d2e', { roughness: 0.6 }),
    button: mat('Button', '#f4f6f8', { roughness: 0.3 }),
    pocket: mat('Pocket', '#bfd3ea', { roughness: 0.85 }),
    badge: mat('Badge', '#1f4e8c', { roughness: 0.6 }),
  };
  const sph = new THREE.SphereGeometry(1, 24, 16);
  const sphS = new THREE.SphereGeometry(1, 12, 8);
  const box = new THREE.BoxGeometry(1, 1, 1);

  const legs = builder();
  const torsoB = builder();
  const headB = builder();
  // legs, shoes
  for (const s of [-1, 1]) {
    // a trouser leg: straight-cut, a little wider at the thigh, a crease of shade from the lathe's facets
    legs.add(
      lathe(
        [
          [0, 0.056],
          [0.1, 0.058],
          [0.38, 0.063],
          [0.48, 0.068],
          [0.68, 0.082],
          [HIP.y - 0.06, 0.09],
        ],
        20,
      ),
      M.trousers,
      { x: s * HIP.x, y: 0.06, rz: s * 0.015 },
    );
    legs.add(sph, M.shoe, { x: s * (HIP.x + 0.01), y: 0.048, z: 0.045, sx: 0.052, sy: 0.045, sz: 0.13 });
    legs.add(box, M.shoe, { x: s * (HIP.x + 0.01), y: 0.012, z: 0.045, sx: 0.1, sy: 0.024, sz: 0.26 });
  }
  // hips, belt, the shirt tucked in, the collar
  legs.add(
    lathe([
      [0.8, 0],
      [0.8, 0.13],
      [0.88, 0.152],
      [0.98, 0.148],
      [1.0, 0],
    ]),
    M.trousers,
    { sz: 0.62 },
  );
  legs.add(new THREE.TorusGeometry(0.149, 0.013, 6, 30).rotateX(Math.PI / 2), M.belt, { y: 0.975, sz: 0.62 });
  torsoB.add(
    lathe([
      [0.95, 0],
      [0.95, 0.15],
      [1.06, 0.156],
      [1.18, 0.174],
      [1.28, 0.186],
      [1.335, 0.176],
      [1.375, 0.12],
      [1.4, 0.055],
      [1.41, 0],
    ]),
    M.shirt,
    { sz: 0.62 },
  );
  torsoB.add(new THREE.TorusGeometry(0.056, 0.016, 6, 20).rotateX(Math.PI / 2), M.shirt, { y: 1.405, z: 0.004, sz: 0.85 });
  torsoB.add(box, M.shirt, { y: 1.18, z: 0.11, sx: 0.014, sy: 0.4, sz: 0.006 }); // the placket
  for (let k = 0; k < 4; k++) torsoB.add(sphS, M.button, { y: 1.04 + k * 0.1, z: 0.114, sx: 0.006, sy: 0.006, sz: 0.003 });
  torsoB.add(box, M.pocket, { x: 0.075, y: 1.25, z: 0.104, rx: -0.12, sx: 0.07, sy: 0.08, sz: 0.004 }); // the pocket
  torsoB.add(box, M.badge, { x: -0.075, y: 1.27, z: 0.104, rx: -0.12, sx: 0.045, sy: 0.03, sz: 0.004 }); // a school badge
  torsoB.add(new THREE.CylinderGeometry(0.043, 0.047, 0.1, 16), M.skin, { y: 1.42 });
  // the head: skull, ears, hair, eyes, brows, nose (the jaw and the mouth are parts of their own)
  headB.add(sph, M.skin, { y: HEAD.y, sx: HEAD.rx, sy: HEAD.ry, sz: HEAD.rz });
  for (const s of [-1, 1]) headB.add(sph, M.skin, { x: s * 0.084, y: HEAD.y - 0.005, sx: 0.014, sy: 0.028, sz: 0.02 });
  headB.add(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair, {
    y: HEAD.y + 0.01,
    z: -0.01,
    rx: -0.3,
    sx: HEAD.rx + 0.008,
    sy: HEAD.ry + 0.008,
    sz: HEAD.rz + 0.01,
  });
  const fz = HEAD.rz * 0.9;
  for (const s of [-1, 1]) {
    headB.add(sphS, M.dark, { x: s * 0.031, y: HEAD.y + 0.008, z: fz, sx: 0.009, sy: 0.007, sz: 0.006 });
    headB.add(box, M.hair, { x: s * 0.032, y: HEAD.y + 0.033, z: fz + 0.002, rz: -s * 0.08, sx: 0.03, sy: 0.006, sz: 0.008 });
  }
  headB.add(sphS, M.skin, { y: HEAD.y - 0.025, z: fz + 0.012, sx: 0.012, sy: 0.022, sz: 0.016 });
  // the jaw swings down from just under the ears
  const jawB = builder();
  jawB.add(sph, M.skin, { y: HEAD.y - 0.05, z: 0.012, sx: 0.07, sy: 0.07, sz: 0.08 });
  const jaw = pivot(jawB.build('ListenerJaw'), 0, HEAD.y - 0.02, -0.01);
  // the mouth: lips and the dark inside, flat when shut (a calm line), opened by scaling
  const mouthB = builder();
  mouthB.add(sph, M.dark, { z: 0.002, sx: 0.019, sy: 0.019, sz: 0.008 });
  mouthB.add(new THREE.TorusGeometry(0.021, 0.0045, 6, 20), M.lips, {});
  const mouth = mouthB.build('ListenerMouth');
  mouth.position.set(0, LIPS.y, LIPS.z - 0.004);
  for (const m of mouth.children) m.castShadow = false;

  const root = new THREE.Group();
  root.name = 'Listener';
  root.add(legs.build('ListenerLegs'));
  const torso = pivot(torsoB.build('ListenerTorso'), 0, WAIST, 0);
  root.add(torso);
  const head = pivot(headB.build('ListenerHead'), 0, NECK, 0);
  head.position.y -= WAIST;
  head.add(jaw, mouth);
  jaw.position.y -= NECK;
  mouth.position.y -= NECK;
  torso.add(head);

  // the hand, from the wrist along −y: a flattened palm, four fingers side by side and a thumb on the +z side, a little
  // curled toward the palm (−s x), so hanging it looks relaxed and raised it cups
  function addHand(b, s) {
    b.add(pill(0.037, 0.043, 0.098, 12, 3), M.skin, { y: -0.102, sx: 0.36 }); // the palm, wider at the knuckles
    b.add(sph, M.skin, { x: -s * 0.006, y: -0.038, z: 0.024, sx: 0.013, sy: 0.033, sz: 0.019, rx: 0.25 }); // the ball of the thumb
    const FINGERS = [
      { z: 0.0295, len: 0.074, r: 0.0098 },
      { z: 0.0098, len: 0.082, r: 0.0102 },
      { z: -0.0098, len: 0.076, r: 0.0096 },
      { z: -0.0285, len: 0.06, r: 0.0085 },
    ];
    const CURL = [0.2, 0.3, 0.22];
    const PART = [0.46, 0.31, 0.23];
    for (const f of FINGERS) {
      let x = 0;
      let y = -0.094;
      let a = 0;
      for (let j = 0; j < 3; j++) {
        a += CURL[j];
        const len = f.len * PART[j];
        const r0 = f.r * (1 - 0.1 * j);
        const r1 = f.r * (1 - 0.1 * (j + 1));
        // pill along +y from its r0 end; turned to point down and in, its far end joins the next part
        b.add(pill(r0, r1, len + r0, 8, 2), M.skin, { x, y, z: f.z, rz: Math.PI - s * a });
        x += -s * Math.sin(a) * len;
        y += -Math.cos(a) * len;
      }
    }
    const th = new THREE.Vector3();
    const qt = new THREE.Quaternion();
    const yUp = new THREE.Vector3(0, 1, 0);
    let p = new THREE.Vector3(-s * 0.008, -0.046, 0.036);
    for (const [dx, dy, dz, len, r] of [
      [-s * 0.16, -0.75, 0.64, 0.04, 0.0118],
      [-s * 0.34, -0.86, 0.38, 0.034, 0.0104],
    ]) {
      th.set(dx, dy, dz).normalize();
      b.add(pill(r, r * 0.86, len + r, 8, 2), M.skin, { x: p.x, y: p.y, z: p.z, quat: qt.setFromUnitVectors(yUp, th).clone() });
      p = p.clone().addScaledVector(th, len);
    }
  }

  // the arms: shoulder → upper arm → elbow → forearm → wrist → hand. The rest pose hangs relaxed; the call pose is
  // solved below in the torso's frame
  const q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
  const L1 = UPPER - 0.02;
  const L2 = FORE;
  const arms = [];
  const DOWN = new THREE.Vector3(0, -1, 0);
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Group();
    const restS = new THREE.Vector3(s * SHOULDER.x, SHOULDER.y - WAIST, 0);
    const callS = new THREE.Vector3(s * (SHOULDER.x - 0.008), SHOULDER.y - WAIST + 0.018, 0.01); // raised a little
    const upper = builder();
    upper.add(sph, M.shirt, { y: -0.01, sx: 0.06, sy: 0.06, sz: 0.06 });
    upper.add(pill(0.05, 0.06, UPPER * 0.78), M.shirt, { y: -UPPER * 0.78 }); // the half sleeve
    upper.add(pill(0.036, 0.042, UPPER), M.skin, { y: -UPPER }); // the arm below the sleeve
    shoulder.add(upper.build(`UpperArm${s}`));
    const elbow = new THREE.Group();
    elbow.position.set(0, -L1, 0);
    const fore = builder();
    fore.add(pill(0.031, 0.04, FORE), M.skin, { y: -FORE });
    elbow.add(fore.build(`Forearm${s}`));
    const wrist = new THREE.Group();
    wrist.position.set(0, -FORE, 0);
    const handB = builder();
    addHand(handB, s);
    wrist.add(handB.build(`Hand${s}`));
    elbow.add(wrist);
    shoulder.add(elbow);
    torso.add(shoulder);

    // the call pose: the wrist just under the corner of the mouth, the fingers running up and forward past it (thumb
    // back toward the cheek), the two palms facing in and forward so the hands make a funnel in front of the lips
    const W = new THREE.Vector3(s * 0.072, LIPS_T.y - WAIST - 0.095, LIPS_T.z + 0.04);
    const fingers = new THREE.Vector3(-s * 0.1, 0.74, 0.62).normalize();
    const palm = new THREE.Vector3(-s * 0.85, -0.1, 0.5);
    palm.addScaledVector(fingers, -palm.dot(fingers)).normalize();
    const thumb = palm.clone().cross(fingers).multiplyScalar(s);
    const handAxes = new THREE.Matrix4().makeBasis(palm.clone().multiplyScalar(-s), fingers.clone().negate(), thumb);
    const handQ = new THREE.Quaternion().setFromRotationMatrix(handAxes);
    // two-bone reach: the elbow on the circle round shoulder→wrist, on the side of the pole: out, forward and a little
    // under shoulder height (the arm folds about 35°, as far as an elbow goes)
    const sw = W.clone().sub(callS);
    const D = Math.min(L1 + L2 - 1e-3, sw.length());
    const u = sw.clone().normalize();
    const a = (L1 * L1 - L2 * L2 + D * D) / (2 * D);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const pole = new THREE.Vector3(s, -0.55, 0.7);
    const n = pole.addScaledVector(u, -pole.dot(u)).normalize();
    const E = callS.clone().addScaledVector(u, a).addScaledVector(n, h);
    const upperDir = E.clone().sub(callS).normalize();
    const callU = new THREE.Quaternion().setFromUnitVectors(DOWN, upperDir);
    const foreDir = W.clone().sub(E).normalize().applyQuaternion(callU.clone().invert());
    const callE = new THREE.Quaternion().setFromUnitVectors(DOWN, foreDir);
    const callW = callU.clone().multiply(callE).invert().multiply(handQ);
    arms.push({
      shoulder,
      elbow,
      wrist,
      restS,
      callS,
      rest: { u: q(0.1, 0, s * 0.1), e: q(-0.3, 0, 0), w: q(0, 0, 0) },
      call: { u: callU, e: callE, w: callW },
    });
  }

  /** k: 0 at rest … 1 calling; open: 0 mouth shut … 1 wide open. */
  function setCall(k, open = 0) {
    for (const a of arms) {
      a.shoulder.position.lerpVectors(a.restS, a.callS, k);
      a.shoulder.quaternion.slerpQuaternions(a.rest.u, a.call.u, k);
      a.elbow.quaternion.slerpQuaternions(a.rest.e, a.call.e, k);
      a.wrist.quaternion.slerpQuaternions(a.rest.w, a.call.w, k);
    }
    torso.rotation.x = LEAN * k;
    head.rotation.x = -(LEAN + TILT) * k;
    jaw.rotation.x = 0.24 * open;
    mouth.scale.set(1 - 0.14 * open, 0.12 + 0.8 * open, 1);
    mouth.position.y = LIPS.y - NECK - 0.009 * open;
  }
  setCall(0);
  return {
    root,
    setCall,
    height: HEIGHT,
    /** The head's centre in the world, as it is now (for the ring when the echo arrives). */
    headAt: (out) => head.localToWorld(out.set(0, HEAD.y - NECK, 0)),
  };
}
