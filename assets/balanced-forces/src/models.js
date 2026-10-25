// The 3D objects of the figure, procedural three.js in metres:
//   createPendulum: চিত্র ৩.০২, a 1 kg metal ball (8 cm) on a 30 cm dark cord from the hook of a lab stand, 15 cm
//     above a bench. The cord can be cut at any point; the two pieces are posed by the app.
//   createBookRig: চিত্র ৩.০৩, a heavy book (1 kg, 24 × 17 × 3 cm) hung from the middle of a rope, the two ends held
//     by two hands; the hands move on a circle round the knot (the rope's halves keep their length). The book is
//     turned a little, so its pages show.
//   createHand: a hand closed round a rope (a fist), or pinching the ball between thumb and finger.
// Each has a `root`; parts that are only for picking or pointing, and the sleeves that run out of the picture, carry
// userData.noExport (the GLB keeps the objects, not a metre of shirt).
import * as THREE from 'three';
import { BALL_R, DROP, HALF_ROPE, LENGTH } from './physics.js';

const UP = new THREE.Vector3(0, 1, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const COLORS = {
  pull: '#e8590c', // T, T₁, T₂ (the pull of a string or a rope: the contact-force orange of chapter 3)
  weight: '#7048e8', // W (gravity's colour in the four-forces figures)
  resultant: '#212529', // লব্ধি বল
  cord: '#5c4630',
  rope: '#b48a52',
  skin: '#b98057',
  sleeve: '#f4f6f8',
  hand: '#ffa94d', // the hand's pull: a lighter orange than the cord's, with its own (dashed) label
  handText: '#c25a00', // its label's words (the light orange is too pale for text)
};

const mat = (color, { roughness = 0.6, metalness = 0, name } = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, name });

/** A cylinder from a to b (its geometry is 1 long along y, scaled; call again to move it). */
function stick(radius, material, segments = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, segments).translate(0, 0.5, 0), material);
  const d = new THREE.Vector3();
  m.userData.span = (a, b) => {
    d.subVectors(b, a);
    const l = d.length();
    m.visible = l > 1e-6;
    if (!m.visible) return;
    m.position.copy(a);
    m.quaternion.setFromUnitVectors(UP, d.divideScalar(l));
    m.scale.set(1, l, 1);
  };
  return m;
}

/** A wooden table top, its upper face at y. */
function createTable(_materials, y, { width = 1.6, depth = 0.55, x = 0, z = -0.08 } = {}) {
  // a pale laminate top with a slightly darker edge, like a school lab bench
  const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.03, depth), [
    mat('#d8c7a6', { roughness: 0.7, name: 'BenchEdge' }),
    mat('#d8c7a6', { roughness: 0.7, name: 'BenchEdge' }),
    mat('#efe7d7', { roughness: 0.75, name: 'BenchTop' }),
    mat('#d8c7a6', { roughness: 0.7, name: 'BenchEdge' }),
    mat('#d3c09c', { roughness: 0.7, name: 'BenchEdge' }),
    mat('#d3c09c', { roughness: 0.7, name: 'BenchEdge' }),
  ]);
  top.name = 'Table';
  top.position.set(x, y - 0.015, z);
  // the bench's front, a little set back under the top, down out of the picture
  const front = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, 0.5, depth - 0.04), mat('#e4dccb', { roughness: 0.85, name: 'BenchFront' }));
  front.name = 'BenchFront';
  front.userData.noExport = true; // the GLB keeps the bench's top
  front.position.set(0, -0.265, -0.005);
  top.add(front);
  return top;
}

/**
 * চিত্র ৩.০২: the ball on its cord. The ball's centre rests at the origin; the hook is LENGTH above it.
 * @param {{ materials: any }} options
 */
export function createPendulum({ materials: M }) {
  const root = new THREE.Group();
  root.name = 'Pendulum';
  const hook = V(0, LENGTH, 0);
  const tableY = -BALL_R - DROP;

  // the stand: a heavy base on the table, an upright rod at the left, an arm out to the hook
  const iron = mat('#3d4650', { roughness: 0.55, metalness: 0.3, name: 'PaintedIron' });
  const stand = new THREE.Group();
  stand.name = 'Stand';
  const baseX = -0.4;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.016, 0.13), iron);
  base.position.set(baseX, tableY + 0.008, -0.03);
  const rod = stick(0.0065, M.steel, 16);
  rod.userData.span(V(baseX + 0.06, tableY, -0.03), V(baseX + 0.06, LENGTH + 0.08, -0.03));
  const boss = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), iron);
  boss.position.set(baseX + 0.06, LENGTH + 0.024, -0.03);
  const arm = stick(0.0055, M.steel, 16);
  arm.userData.span(V(baseX + 0.06, LENGTH + 0.024, -0.03), V(0.035, LENGTH + 0.024, -0.03));
  const armEnd = stick(0.0055, M.steel, 16);
  armEnd.userData.span(V(0.035, LENGTH + 0.024, -0.03), V(0.035, LENGTH + 0.024, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0018, 8, 24), M.steel);
  ring.position.set(0, LENGTH + 0.008, 0);
  const hookBar = stick(0.0025, M.steel, 8);
  hookBar.userData.span(V(0, LENGTH + 0.016, 0), V(0, LENGTH + 0.024, 0));
  const hookCap = stick(0.0025, M.steel, 8);
  hookCap.userData.span(V(0, LENGTH + 0.024, 0), V(0.035, LENGTH + 0.024, 0));
  stand.add(base, rod, boss, arm, armEnd, ring, hookBar, hookCap);
  root.add(stand);

  const table = createTable(M, tableY, { width: 0.9, depth: 0.3, x: -0.1, z: -0.06 });
  root.add(table);

  // the ball: polished steel with a small eye on top where the cord is tied
  const ball = new THREE.Group();
  ball.name = 'Ball';
  const steel = new THREE.MeshPhysicalMaterial({ name: 'BallSteel', color: 0xc9ced4, metalness: 1, roughness: 0.22 });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 40, 28), steel);
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.0055, 0.0016, 8, 20), M.steel);
  eye.position.y = BALL_R + 0.0052;
  ball.add(sphere, eye);
  root.add(ball);
  let EYE = BALL_R + 0.01; // the cord is tied this far above the ball's centre (a test may hang a smaller ball)

  // the cord: one piece, or two once cut (the lower piece goes with the ball)
  const cordMat = mat(COLORS.cord, { roughness: 0.85, name: 'Cord' });
  const upper = stick(0.0017, cordMat, 8);
  upper.name = 'Cord';
  const lower = new THREE.Mesh(new THREE.BufferGeometry(), cordMat);
  lower.name = 'CordPiece';
  lower.visible = false;
  root.add(upper, lower);

  // pick targets (invisible): a big sphere round the ball, a slab along the cord
  const ballHit = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  ballHit.userData.noExport = true;
  ballHit.name = 'BallHit';
  root.add(ballHit);
  const cordHit = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.05).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ visible: false }));
  cordHit.userData.noExport = true;
  cordHit.name = 'CordHit';
  root.add(cordHit);

  const center = new THREE.Vector3();
  const tie = new THREE.Vector3();
  const dir = new THREE.Vector3();
  let lowerPose = '';

  /** A tube through points (the cut piece, which may lie bent on the table). */
  function setLower(points) {
    const key = points.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join(';');
    if (key === lowerPose) return;
    lowerPose = key;
    lower.geometry.dispose();
    lower.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(4, points.length * 6), 0.0017, 6, false);
  }

  return {
    root,
    ball,
    table,
    stand,
    hook,
    tableY,
    hits: { ball: ballHit, cord: cordHit },
    /** The ball's centre (world space, after the last pose). */
    center: () => ball.getWorldPosition(center),
    /**
     * Pose: the ball's centre at (x, y), the cord whole or cut.
     * cut: null (whole), or { at: m below the hook where it was cut, lying: 0…1 (the piece falls over on the table) }.
     */
    pose({ x, y, r = BALL_R, cut = null }) {
      EYE = r + 0.01 * (r / BALL_R);
      ball.position.set(x, y, 0);
      ballHit.position.copy(ball.position);
      dir.set(hook.x - x, hook.y - y, 0).normalize();
      tie.set(x, y, 0).addScaledVector(dir, EYE);
      eye.quaternion.setFromUnitVectors(UP, dir);
      eye.position.copy(dir).multiplyScalar(BALL_R + 0.0052); // in the ball's own (scaled) space
      if (!cut) {
        upper.userData.span(tie, hook);
        lower.visible = false;
        cordHit.visible = true;
        const l = hook.distanceTo(tie);
        cordHit.position.copy(tie);
        cordHit.quaternion.setFromUnitVectors(UP, dir);
        cordHit.scale.set(1, l, 1);
        return;
      }
      cordHit.visible = false;
      // the top piece hangs straight down from the hook; the cut piece stands above the falling ball, then falls over
      upper.userData.span(V(hook.x, hook.y - cut.at, 0), hook);
      const piece = Math.max(0.02, LENGTH - EYE - cut.at);
      const k = THREE.MathUtils.clamp(cut.lying || 0, 0, 1);
      const pts = [];
      const n = 6;
      for (let i = 0; i <= n; i++) {
        const s = (i / n) * piece;
        // standing: straight up from the tie; lying: up a little, then over and along the table to the right
        const standing = V(x, y + EYE + s, 0);
        const bend = Math.min(s, 0.012);
        const lying = V(x + 0.006 + (s - bend) * 0.96, Math.max(tableY + 0.0017, y + EYE + bend - (s - bend) * 0.9), 0.012 + (s - bend) * 0.25);
        pts.push(standing.lerp(lying, k));
      }
      lower.visible = true;
      setLower(pts);
    },
  };
}

/**
 * A hand closed round a line along its local +x (a rope going through the fist from the knot side), the forearm
 * going on along +x out of the picture. Local y is up, z towards the viewer.
 */
export function createHand({ materials: _M, grip = 'rope' } = {}) {
  const root = new THREE.Group();
  root.name = 'Hand';
  const skin = mat(COLORS.skin, { roughness: 0.62, name: 'Skin' });
  const sleeve = mat(COLORS.sleeve, { roughness: 0.85, name: 'Shirt' });
  const capsule = (r, a, b, material = skin) => {
    const l = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 12), material);
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, new THREE.Vector3().subVectors(b, a).normalize());
    root.add(m);
    return m;
  };
  if (grip === 'rope') {
    // the back of the hand above the rope, four curled fingers wrapping under it towards the viewer, the thumb over
    const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), skin);
    palm.scale.set(0.046, 0.03, 0.036);
    palm.position.set(0.012, 0.022, -0.006);
    root.add(palm);
    for (let i = 0; i < 4; i++) {
      const x = -0.026 + i * 0.0165;
      const r = i === 3 ? 0.0078 : 0.0088;
      capsule(r, V(x, 0.026, 0.02), V(x, 0.006, 0.026)); // the knuckle down the front
      capsule(r, V(x, 0.004, 0.024), V(x + 0.001, -0.012, 0.006)); // curled under the rope
    }
    capsule(0.0095, V(-0.03, 0.03, -0.006), V(-0.038, 0.016, 0.018)); // thumb over the first finger
    capsule(0.026, V(0.04, 0.022, -0.008), V(0.11, 0.03, -0.012)); // wrist
    capsule(0.036, V(0.1, 0.03, -0.012), V(1.3, 0.1, -0.08), sleeve).userData.noExport = true; // out of the picture
  } else {
    // pinching the ball: the hand's local +x points away from the ball (the way the hand pulls), the ball's surface
    // is at x = 0; thumb and forefinger touch it just above and below, the other fingers curl behind, a slim wrist
    const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), skin);
    palm.scale.set(0.03, 0.021, 0.017);
    palm.position.set(0.052, 0.002, -0.006);
    root.add(palm);
    capsule(0.0062, V(0.04, 0.016, 0.002), V(0.004, 0.0085, 0.004)); // forefinger
    capsule(0.0068, V(0.036, -0.016, 0.006), V(0.004, -0.0085, 0.005)); // thumb
    for (let i = 0; i < 3; i++) capsule(0.0056, V(0.048, 0.012 - i * 0.009, -0.012), V(0.03, 0.004 - i * 0.007, -0.016)); // curled
    capsule(0.0145, V(0.07, 0.002, -0.006), V(0.12, 0.004, -0.008)); // wrist
    capsule(0.02, V(0.112, 0.004, -0.008), V(0.75, 0.02, -0.03), sleeve).userData.noExport = true; // out of the picture
  }
  return { root };
}

/**
 * চিত্র ৩.০৩: the book on its rope. The knot is at the origin, the book hangs below it, the two halves of the rope go
 * up to the hands at angle α above the horizontal.
 * @param {{ materials: any }} options
 */
export function createBookRig({ materials: M }) {
  const root = new THREE.Group();
  root.name = 'BookOnRope';
  const W = 0.17;
  const H = 0.24;
  const D = 0.03;
  const ROPE_R = 0.0055;
  const top = -ROPE_R * 1.6; // the book's top edge, just under the knot
  const book = new THREE.Group();
  book.name = 'Book';
  const cover = new THREE.MeshStandardMaterial({ name: 'Cover', color: '#7a2433', roughness: 0.55 });
  const pages = new THREE.MeshStandardMaterial({ name: 'Pages', color: '#f1e8d2', roughness: 0.9 });
  const board = 0.003;
  const front = new THREE.Mesh(new THREE.BoxGeometry(W, H, board), cover);
  front.position.set(0, 0, D / 2 - board / 2);
  const back = front.clone();
  back.position.z = -D / 2 + board / 2;
  const spine = new THREE.Mesh(new THREE.BoxGeometry(board * 1.6, H, D), cover);
  spine.position.set(-W / 2 + board * 0.8, 0, 0);
  const block = new THREE.Mesh(new THREE.BoxGeometry(W - 0.006, H - 0.008, D - board * 2), pages);
  block.position.set(0.001, 0, 0);
  // two gold lines across the cover, near the top and the bottom (the rope crosses the middle)
  const gold = new THREE.MeshStandardMaterial({ name: 'Gold', color: '#c9a64e', roughness: 0.4, metalness: 0.5 });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, 0.006), gold);
  band.position.set(0.006, H * 0.36, D / 2 + 0.0002);
  const band2 = band.clone();
  band2.position.y = -H * 0.36;
  book.add(front, back, spine, block, band, band2);
  book.position.set(0, top - H / 2, 0);
  // the book and the rope round it, turned a little about the vertical through the knot
  const turned = new THREE.Group();
  turned.name = 'TurnedBook';
  turned.rotation.y = -0.42;
  turned.add(book);
  root.add(turned);

  // the rope round the book (front, under, back), tied in a knot at the top; the two halves to the hands
  const ropeMat = new THREE.MeshStandardMaterial({ name: 'Rope', color: COLORS.rope, roughness: 0.92 });
  const z = D / 2 + ROPE_R;
  const yb = top - H - ROPE_R;
  const loopPts = [
    V(0, 0, 0.004),
    V(0, top, z),
    V(0, yb + 0.01, z),
    V(0, yb, z - 0.01),
    V(0, yb, -z + 0.01),
    V(0, yb + 0.01, -z),
    V(0, top, -z),
    V(0, 0, -0.004),
  ];
  const loopPath = new THREE.CurvePath();
  for (let i = 0; i < loopPts.length - 1; i++) loopPath.add(new THREE.LineCurve3(loopPts[i], loopPts[i + 1]));
  const loop = new THREE.Mesh(new THREE.TubeGeometry(loopPath, 64, ROPE_R, 8, false), ropeMat);
  loop.name = 'RopeLoop';
  const knot = new THREE.Group();
  knot.name = 'Knot';
  const k1 = new THREE.Mesh(new THREE.TorusGeometry(0.008, ROPE_R, 8, 16), ropeMat);
  k1.rotation.y = Math.PI / 2;
  const k2 = new THREE.Mesh(new THREE.SphereGeometry(ROPE_R * 1.7, 12, 10), ropeMat);
  knot.add(k1, k2);
  const left = stick(ROPE_R, ropeMat, 10);
  const right = stick(ROPE_R, ropeMat, 10);
  left.name = 'RopeLeft';
  right.name = 'RopeRight';
  turned.add(loop);
  root.add(knot, left, right);

  // the hands: the left one is the right one mirrored (scale x −1 on a parent)
  const handR = createHand({ materials: M });
  const handL = createHand({ materials: M });
  const holdR = new THREE.Group();
  const holdL = new THREE.Group();
  holdL.scale.x = -1;
  holdR.add(handR.root);
  holdL.add(handL.root);
  holdL.name = 'LeftHand';
  holdR.name = 'RightHand';
  root.add(holdL, holdR);
  // pick targets: a big sphere round each fist
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), hitMat);
  const hitR = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), hitMat);
  hitL.userData.noExport = hitR.userData.noExport = true;
  hitL.userData.hand = 'left';
  hitR.userData.hand = 'right';
  root.add(hitL, hitR);
  const edge = new THREE.Vector3();

  const gripL = new THREE.Vector3();
  const gripR = new THREE.Vector3();
  const knotAt = V(0, 0, 0);
  return {
    root,
    book,
    hits: { left: hitL, right: hitR },
    /** The parts that cast a shadow on the wall behind (the book and its rope, not the hands and arms). */
    shadowCasters: [turned, knot],
    /** Where the forces meet (the knot) and where the weight is drawn from (the middle of the book's bottom edge). */
    knot: knotAt,
    bottom: V(0, top - H, 0),
    center: V(0, top - H / 2, 0),
    /** The middle of the book's left edge (world space), for a label's leader line. */
    leftEdge: () => turned.localToWorld(edge.set(-W / 2, top - H / 2, D / 2)),
    size: { W, H, D },
    grip: (side) => (side === 'left' ? gripL : gripR),
    /** Each half of the rope at α (deg) above the horizontal, its hand at the end. */
    pose(alphaDeg) {
      const a = (alphaDeg * Math.PI) / 180;
      gripR.set(HALF_ROPE * Math.cos(a), HALF_ROPE * Math.sin(a), 0);
      gripL.set(-gripR.x, gripR.y, 0);
      left.userData.span(knotAt, gripL);
      right.userData.span(knotAt, gripR);
      // a hand's local +x goes on along the rope, away from the knot
      holdR.position.copy(gripR);
      holdR.rotation.set(0, 0, a);
      holdL.position.copy(gripL);
      holdL.rotation.set(0, 0, -a);
      hitL.position.copy(gripL);
      hitR.position.copy(gripR);
    },
  };
}
