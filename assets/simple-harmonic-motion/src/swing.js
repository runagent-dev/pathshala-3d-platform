// The swing (দোলনা) of the book's চিত্র ২.০২, in metres: a bamboo frame (two crossed pairs of poles holding a top
// pole, tied with rope, as swings are often made in Bangladesh), two ropes and a wooden plank seat with a girl
// sitting on it. The ropes, the seat and the girl hang from the top pole and swing in the x–y plane about it (the
// z axis through PIVOT); setAngle(θ) turns them (θ > 0 swings toward +x), setPlait(lean) lets her plait trail.
// The legs of the frame splay wide, so that seen from the side none of them ever passes in front of the girl at
// 25°. The ground is y = 0.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SWING } from './motion.js';

const L = SWING.R; // m: from the middle of the top pole to the middle of the seat (the ropes)
export const PIVOT = new THREE.Vector3(0, L + 0.5, 0); // the seat hangs 0.5 m above the ground
const ROPE_Z = 0.21; // the two ropes, either side of the seat
const FRAME_Z = 0.95; // the two crossed pairs of poles
const FOOT_X = 2.0; // the poles reach the ground this far in front of and behind the top pole
const POLE_R = 0.038;
const TOP_R = 0.044;
const NODE_GAP = 0.36; // bamboo: a node (ring) every 36 cm

const Y = new THREE.Vector3(0, 1, 0);
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** Fine streaks along the cane, for the bamboo's surface (a tiny texture, made here, no image file). */
function bambooTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 8;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d6bd84';
  ctx.fillRect(0, 0, 128, 8);
  let seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 46; i++) {
    const x = rnd() * 128;
    const g = rnd() < 0.5 ? 'rgba(150,120,60,' : 'rgba(240,225,180,';
    ctx.fillStyle = `${g}${0.25 + rnd() * 0.35})`;
    ctx.fillRect(x, 0, 0.6 + rnd() * 1.6, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Turn a mesh (or geometry) built along +y to run from a to b. */
function along(obj, a, b) {
  const dir = new THREE.Vector3().subVectors(b, a);
  obj.position.addVectors(a, b).multiplyScalar(0.5);
  obj.quaternion.setFromUnitVectors(Y, dir.normalize());
  return obj;
}

/** A rounded limb (capsule) from a to b. */
function limb(a, b, r, mat) {
  const len = Math.max(0.001, a.distanceTo(b));
  return along(new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 12), mat), a, b);
}

/** The girl, sitting on the seat (origin: the middle of the seat's top), facing +x, holding both ropes. */
function createGirl() {
  const g = new THREE.Group();
  g.name = 'Girl';
  const mat = (name, color, roughness = 0.75) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });
  const skin = mat('Skin', 0xb57a52, 0.6);
  const dress = mat('Kameez', 0xc2417a);
  const salwar = mat('Salwar', 0xf1e2cf);
  const hair = mat('Hair', 0x1d1714, 0.55);
  const shoe = mat('Sandal', 0x7a4a2b);

  g.add(limb(v3(-0.035, 0.075, -0.07), v3(-0.035, 0.075, 0.07), 0.075, dress)); // hips
  g.add(limb(v3(-0.04, 0.09, 0), v3(-0.075, 0.3, 0), 0.092, dress)); // body, leaning back a little
  g.add(limb(v3(-0.075, 0.36, 0), v3(-0.078, 0.41, 0), 0.034, skin)); // neck
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.088, 28, 18), skin);
  head.position.set(-0.075, 0.49, 0);
  g.add(head);
  // hair: a cap over the top and the back of the head down to the nape (tilted back, so the face shows), and a
  // plait hanging down her back from a hinge at the nape (it trails a little as she swings: setPlait)
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.095, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.7), hair);
  cap.position.set(-0.083, 0.495, 0);
  cap.rotation.z = 0.95;
  g.add(cap);
  const plait = new THREE.Group();
  plait.name = 'Plait';
  plait.position.set(-0.155, 0.44, 0);
  plait.add(limb(v3(0, 0, 0), v3(-0.012, -0.2, 0), 0.027, hair));
  const ribbon = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), mat('Ribbon', 0xd6336c, 0.6));
  ribbon.position.set(-0.013, -0.215, 0);
  plait.add(ribbon);
  g.add(plait);
  g.userData.plait = plait;
  for (const z of [-0.032, 0.032]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), hair);
    eye.position.set(0.006, 0.5, z);
    g.add(eye);
  }

  for (const side of [-1, 1]) {
    // arms: sleeve to the elbow, forearm up to the hand on the rope
    const shoulder = v3(-0.065, 0.3, side * 0.115);
    const elbow = v3(0.025, 0.2, side * 0.17);
    const hand = v3(0, 0.34, side * (ROPE_Z - 0.01));
    g.add(limb(shoulder, elbow, 0.036, dress), limb(elbow, hand, 0.029, skin));
    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), skin);
    fist.position.copy(hand);
    g.add(fist);
    // legs stretched forward, as children do on a swing
    const hip = v3(0, 0.054, side * 0.06);
    const knee = v3(0.27, 0.06, side * 0.068);
    const ankle = v3(0.42, -0.16, side * 0.068);
    g.add(limb(hip, knee, 0.052, salwar), limb(knee, ankle, 0.042, salwar));
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.045, 0.065, 2, 0.018), shoe);
    foot.position.set(0.46, -0.18, side * 0.068);
    foot.rotation.z = -0.55;
    g.add(foot);
  }
  return g;
}

export function createSwing({ materials: M }) {
  const root = new THREE.Group();
  root.name = 'Swing';

  const cane = bambooTexture();
  const bamboo = new THREE.MeshStandardMaterial({ name: 'Bamboo', map: cane, roughness: 0.42, metalness: 0 });
  const node = new THREE.MeshStandardMaterial({ name: 'BambooNode', color: 0xa98a52, roughness: 0.5, metalness: 0 });
  const tie = new THREE.MeshStandardMaterial({ name: 'Lashing', color: 0x5e4630, roughness: 0.95, metalness: 0 });
  const rope = new THREE.MeshStandardMaterial({ name: 'Rope', color: 0xc6a06a, roughness: 0.95, metalness: 0 });
  // the kit's wood is tiled for millimetres: here one picture of the grain runs along the whole seat
  const grain = M.wood.map.clone();
  grain.repeat.set(1, 0.3);
  grain.needsUpdate = true;
  const seatWood = M.wood.clone();
  seatWood.name = 'SeatWood';
  seatWood.map = grain;

  // ── the frame: bamboo poles with a node every NODE_GAP, crossed in pairs and tied, holding the top pole ──
  const frame = new THREE.Group();
  frame.name = 'Frame';
  root.add(frame);
  const nodes = [];
  function pole(a, b, r) {
    const len = a.distanceTo(b);
    frame.add(along(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.04, len, 18), bamboo), a, b));
    const m = new THREE.Mesh();
    along(m, a, b);
    m.updateMatrix();
    for (let d = NODE_GAP * 0.6; d < len - 0.05; d += NODE_GAP) {
      const ring = new THREE.CylinderGeometry(r * 1.07, r * 1.07, 0.014, 18, 1, true);
      ring.translate(0, d - len / 2, 0);
      nodes.push(ring.applyMatrix4(m.matrix));
    }
  }
  const cross = PIVOT.y - 0.09; // where each pair of poles crosses; the top pole rests in the fork above it
  for (const z of [-FRAME_Z, FRAME_Z]) {
    const out = Math.sign(z) * 0.1; // the feet stand a little wider than the top
    for (const x of [-FOOT_X, FOOT_X]) {
      const dz = Math.sign(x) * (POLE_R + 0.004); // the two poles of a pair cross side by side
      const foot = v3(x, 0, z + out + dz);
      const c = v3(0, cross, z + dz);
      const top = c.clone().addScaledVector(c.clone().sub(foot).normalize(), 0.2); // the pole goes on past the fork
      pole(foot, top, POLE_R);
    }
    for (let i = 0; i < 3; i++) {
      const lash = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.01, 8, 24), tie);
      lash.position.set(0, cross + 0.012 * (i - 1), z);
      lash.rotation.x = Math.PI / 2;
      lash.rotation.y = (i - 1) * 0.5;
      frame.add(lash);
    }
  }
  pole(v3(0, PIVOT.y, -FRAME_Z - 0.18), v3(0, PIVOT.y, FRAME_Z + 0.18), TOP_R);
  const knots = new THREE.Mesh(mergeGeometries(nodes), node);
  knots.name = 'BambooNodes';
  frame.add(knots);

  // ── what swings: the ropes, the seat and the girl, hanging from the top pole ──
  const arm = new THREE.Group();
  arm.name = 'SwingingPart';
  arm.position.copy(PIVOT);
  root.add(arm);
  for (const z of [-ROPE_Z, ROPE_Z]) {
    const top = -(TOP_R + 0.01);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, L + top, 10), rope);
    r.position.set(0, (top - L) / 2, z);
    arm.add(r);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(TOP_R + 0.008, 0.011, 8, 24), rope); // tied round the pole
    loop.position.z = z;
    arm.add(loop);
  }
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.036, 0.52, 2, 0.01), seatWood);
  seat.name = 'Seat';
  seat.position.y = -L;
  arm.add(seat);
  const girl = createGirl();
  girl.position.y = -L + 0.018;
  arm.add(girl);
  const plait = girl.userData.plait;

  // a big invisible box round the seat and the girl: what a finger grabs
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.05, 0.62), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0.1, -L + 0.3, 0);
  hit.userData.noExport = true;
  // and one along the ropes: pulling a rope swings it too
  const ropeHit = new THREE.Mesh(new THREE.BoxGeometry(0.2, L - 0.5, 0.62), hit.material);
  ropeHit.position.y = -0.2 - (L - 0.5) / 2;
  ropeHit.userData.noExport = true;
  arm.add(hit, ropeHit);

  return {
    root,
    arm,
    hits: [hit, ropeHit],
    /** Turn what swings to angle θ (radians from straight down; > 0 toward +x). */
    setAngle(theta) {
      arm.rotation.z = theta;
    },
    /** How far the plait trails behind her (radians; > 0 swings its tip backward, away from her back). */
    setPlait(lean) {
      plait.rotation.z = -0.15 - lean;
    },
    /** The point at angle θ on the circle of radius r round the pivot (r = L: the middle of the seat). */
    pointAt(theta, r = L, out = new THREE.Vector3()) {
      return out.set(PIVOT.x + r * Math.sin(theta), PIVOT.y - r * Math.cos(theta), 0);
    },
    /**
     * Where the first-use hand points: the near rope, high up, where it hardly moves; its label then falls in the
     * open space under the top pole, clear of the girl and of the labels on the path.
     */
    grip(out = new THREE.Vector3()) {
      return arm.localToWorld(out.set(0, -0.45, ROPE_Z));
    },
    /**
     * The points the camera keeps in view: the top pole (seen end-on), the swing out at either end with room for
     * the end labels, and the space under the seat for the speed arrow and the সাম্যবিন্দু label. The legs of the
     * frame run off the edges.
     */
    fit: [v3(0, PIVOT.y + TOP_R + 0.01, -0.5), v3(0, PIVOT.y + TOP_R + 0.01, 0.5), v3(-1.3, 0.62, 0), v3(1.3, 0.62, 0), v3(0, 0, 0)],
  };
}
