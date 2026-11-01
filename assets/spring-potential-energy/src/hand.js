// A right hand and forearm (metres) that hold the spring's wooden handle, palm down with the fingers hooked round the
// bar (the bar runs toward the viewer): to pull, the fingers take the load on the bar's wall side; to push, the heel of
// the hand presses its other side and the forearm drops a little. (An open palm pushing the end, as in the book's
// finger, reached up through the x bracket; a handle is held the same way both ways.) Built from a rounded palm, three
// tapered bones per finger, a thumb with its ball of muscle, nails, a wrist and a tapered forearm in a rolled sleeve;
// pose(bar, p) blends the two grips.
//
// Drawn in three meshes (skin, nails, sleeve): the parts are built and posed as a hierarchy that is never drawn, and
// pose() writes their vertices into the three merged meshes, only when the grip changes (moving the hand with the
// handle only moves the root).
//
// Hand frame (the group's local axes): origin at the wrist, the fingers point along −x, the palm faces −y, the thumb
// is on the +z side. `turn` can rotate the hand about z for a pose (0 for both grips).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const PALM = { length: 0.094, thick: 0.027, width: 0.08 };
// index (thumb side, +z) to little finger: knuckle x, z, bone lengths, radius
const FINGERS = [
  { x: -0.092, z: 0.028, bones: [0.042, 0.025, 0.021], r: 0.0088 },
  { x: -0.096, z: 0.0095, bones: [0.046, 0.028, 0.022], r: 0.009 },
  { x: -0.093, z: -0.0095, bones: [0.043, 0.027, 0.021], r: 0.0086 },
  { x: -0.086, z: -0.027, bones: [0.034, 0.021, 0.018], r: 0.0076 },
];
// the two poses: finger curl per joint (radians, + bends toward the palm), thumb angles, where the wrist sits
// relative to the bar's centre, which way the forearm runs from the wrist (to the elbow)
export const POSES = {
  pull: {
    curl: [1.5, 1.62, 0.75],
    spread: 0.02,
    thumb: { yaw: 0.12, pitch: 1.25, curl: [-0.45, -0.35] },
    wrist: new THREE.Vector3(0.076, 0.025, 0),
    turn: 0,
    elbow: new THREE.Vector3(0.25, 0.07, 0.06),
  },
  push: {
    curl: [1.42, 1.55, 0.7],
    spread: 0.03,
    thumb: { yaw: 0.12, pitch: 1.15, curl: [-0.4, -0.3] },
    wrist: new THREE.Vector3(0.07, 0.021, 0),
    turn: 0,
    elbow: new THREE.Vector3(0.255, 0.035, 0.06),
  },
};

export function createHand({ skin = '#c58a5f', sleeve = '#1f7a8c' } = {}) {
  const root = new THREE.Group();
  root.name = 'Hand';
  const M = {
    skin: new THREE.MeshPhysicalMaterial({
      name: 'Skin',
      color: skin,
      roughness: 0.52,
      metalness: 0,
      sheen: 0.4,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color('#f2c8a8'),
    }),
    nail: new THREE.MeshPhysicalMaterial({ name: 'Nail', color: '#e9b9a4', roughness: 0.25, metalness: 0, clearcoat: 0.6 }),
    cloth: new THREE.MeshStandardMaterial({ name: 'Sleeve', vertexColors: true, roughness: 0.85 }),
  };
  const COLOR = { sleeve: new THREE.Color(sleeve), cuff: new THREE.Color(sleeve).multiplyScalar(0.8) };
  // the posed hierarchy (never drawn): each part remembers which merged mesh it goes into, and its colour there
  const rig = new THREE.Group();
  /** @type {{ mesh: THREE.Mesh, into: 'skin' | 'nail' | 'cloth', color?: THREE.Color }[]} */
  const parts = [];
  const mesh = (geometry, material, parent, name, color = undefined) => {
    const m = new THREE.Mesh(geometry, material);
    m.name = name;
    parent.add(m);
    parts.push({ mesh: m, into: material === M.nail ? 'nail' : material === M.skin ? 'skin' : 'cloth', color });
    return m;
  };

  // ── the hand, in its own frame ──
  const hand = new THREE.Group();
  hand.name = 'RightHand';
  rig.add(hand);
  const palm = mesh(new RoundedBoxGeometry(PALM.length, PALM.thick, PALM.width, 5, 0.012), M.skin, hand, 'Palm');
  palm.position.set(-PALM.length / 2 - 0.004, 0, 0);
  // the heel of the hand and the back of the hand are rounder than a box
  const heel = mesh(new THREE.SphereGeometry(1, 24, 16), M.skin, hand, 'HandHeel');
  heel.scale.set(0.022, 0.015, 0.035);
  heel.position.set(-0.018, -0.004, -0.008);

  /** A bone: a capsule from its joint (the group's origin) to −len along x, a little thinner at its far end and a
   * little flatter across the back of the hand, as a finger is. */
  const bone = (len, r) => {
    const g = new THREE.CapsuleGeometry(r, len, 6, 14).rotateZ(Math.PI / 2).translate(-len / 2, 0, 0);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const k = 1 - 0.13 * Math.min(1, Math.max(0, -pos.getX(i) / len));
      pos.setY(i, pos.getY(i) * k * 0.9);
      pos.setZ(i, pos.getZ(i) * k);
    }
    g.computeVertexNormals();
    return g;
  };
  const fingers = FINGERS.map((f, i) => {
    const joints = [];
    let parent = hand;
    let at = new THREE.Vector3(f.x, 0.002, f.z);
    f.bones.forEach((len, j) => {
      const joint = new THREE.Group();
      joint.position.copy(at);
      parent.add(joint);
      const r = f.r * (1 - 0.07 * j);
      mesh(bone(len, r), M.skin, joint, `Finger${i}Bone${j}`);
      if (j === 0) {
        // the knuckle: a bump on the back of the hand
        const k = mesh(new THREE.SphereGeometry(r * 1.08, 16, 12), M.skin, joint, `Finger${i}Knuckle`);
        k.position.set(0.002, 0.002, 0);
      }
      if (j === 2) {
        const nail = mesh(new THREE.SphereGeometry(1, 16, 10), M.nail, joint, `Finger${i}Nail`);
        nail.scale.set(len * 0.42, r * 0.28, r * 0.78);
        nail.position.set(-len * 0.62, r * 0.78, 0);
      }
      joints.push(joint);
      parent = joint;
      at = new THREE.Vector3(-len, 0, 0);
    });
    return { joints, z: f.z };
  });

  // the thumb: a ball of muscle at the base, then two bones from a joint that swings out and down
  const thenar = mesh(new THREE.SphereGeometry(1, 24, 16), M.skin, hand, 'ThumbBall');
  thenar.scale.set(0.03, 0.016, 0.019);
  thenar.position.set(-0.03, -0.009, 0.024);
  const thumbBase = new THREE.Group();
  thumbBase.position.set(-0.032, -0.011, 0.031);
  hand.add(thumbBase);
  const thumb = [];
  {
    let parent = thumbBase;
    let at = new THREE.Vector3(0, 0, 0);
    [0.034, 0.03].forEach((len, j) => {
      const joint = new THREE.Group();
      joint.position.copy(at);
      parent.add(joint);
      const r = 0.0098 * (1 - 0.08 * j);
      mesh(bone(len, r), M.skin, joint, `ThumbBone${j}`);
      if (j === 1) {
        const nail = mesh(new THREE.SphereGeometry(1, 16, 10), M.nail, joint, 'ThumbNail');
        nail.scale.set(len * 0.38, r * 0.3, r * 0.8);
        nail.position.set(-len * 0.6, r * 0.75, 0);
      }
      thumb.push(joint);
      parent = joint;
      at = new THREE.Vector3(-len, 0, 0);
    });
  }

  // the wrist and the forearm in a rolled-up sleeve (posed in the scene's frame, between the wrist and the elbow)
  const wrist = mesh(new THREE.SphereGeometry(1, 24, 16), M.skin, rig, 'Wrist');
  wrist.scale.set(0.026, 0.023, 0.031);
  const forearm = mesh(new THREE.CylinderGeometry(1, 1, 1, 28, 1, true).translate(0, 0.5, 0), M.skin, rig, 'Forearm');
  // tapered: thin at the wrist (y = 0), thick at the elbow (y = 1)
  {
    const pos = forearm.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const r = 0.023 + (0.036 - 0.023) * Math.min(1, y * 1.3);
      pos.setX(i, pos.getX(i) * r * 1.12);
      pos.setZ(i, pos.getZ(i) * r * 0.92);
    }
    forearm.geometry.computeVertexNormals();
  }
  const sleeveMesh = mesh(new THREE.CylinderGeometry(0.046, 0.043, 0.5, 28).translate(0, 0.25, 0), M.cloth, rig, 'Sleeve', COLOR.sleeve);
  const cuff = mesh(new THREE.TorusGeometry(0.043, 0.008, 12, 32), M.cloth, rig, 'SleeveCuff', COLOR.cuff);

  // ── posing ──
  const qPull = new THREE.Quaternion();
  const qPush = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), POSES.push.turn);
  const lerp = (a, b, k) => a + (b - a) * k;
  const wristAt = new THREE.Vector3();
  const elbowAt = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const sleeveStart = new THREE.Vector3();
  const Z = new THREE.Vector3(0, 0, 1);
  const out = new THREE.Vector3();
  let last = Number.NaN;

  // ── the three merged meshes ──
  const merged = {};
  const nm = new THREE.Matrix3();
  for (const into of /** @type {const} */ (['skin', 'nail', 'cloth'])) {
    const list = parts.filter((p) => p.into === into);
    let count = 0;
    let indices = 0;
    for (const { mesh: m } of list) {
      count += m.geometry.attributes.position.count;
      indices += m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count;
    }
    const pos = new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const nor = new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const index = count > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
    const rgb = into === 'cloth' ? new Float32Array(count * 3) : null;
    let v = 0;
    let n = 0;
    const spans = list.map(({ mesh: m, color }) => {
      const g = m.geometry;
      const c = g.attributes.position.count;
      if (g.index) for (let i = 0; i < g.index.count; i++) index[n++] = g.index.getX(i) + v;
      else for (let i = 0; i < c; i++) index[n++] = i + v;
      if (rgb && color) for (let i = 0; i < c; i++) color.toArray(rgb, (v + i) * 3);
      const span = { mesh: m, from: v, src: g.attributes.position.array, srcN: g.attributes.normal.array };
      v += c;
      return span;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', pos);
    geometry.setAttribute('normal', nor);
    if (rgb) geometry.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
    geometry.setIndex(new THREE.BufferAttribute(index, 1));
    const drawn = new THREE.Mesh(geometry, M[into]);
    drawn.name = { skin: 'HandSkin', nail: 'Nails', cloth: 'Sleeve' }[into];
    drawn.castShadow = true;
    root.add(drawn);
    merged[into] = { geometry, pos, nor, spans };
  }
  const pv = new THREE.Vector3();
  /** Writes every part's vertices, posed, into its merged mesh (the rig's frame: the bar at the origin). */
  function writeVertices() {
    rig.updateMatrixWorld(true);
    for (const { geometry, pos, nor, spans } of Object.values(merged)) {
      const P = /** @type {Float32Array} */ (pos.array);
      const Nn = /** @type {Float32Array} */ (nor.array);
      for (const { mesh: m, from, src, srcN } of spans) {
        const e = m.matrixWorld.elements;
        nm.getNormalMatrix(m.matrixWorld);
        const q = nm.elements;
        for (let i = 0, k = from * 3; i < src.length; i += 3, k += 3) {
          const x = src[i];
          const y = src[i + 1];
          const z = src[i + 2];
          P[k] = e[0] * x + e[4] * y + e[8] * z + e[12];
          P[k + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
          P[k + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
          pv.set(
            q[0] * srcN[i] + q[3] * srcN[i + 1] + q[6] * srcN[i + 2],
            q[1] * srcN[i] + q[4] * srcN[i + 1] + q[7] * srcN[i + 2],
            q[2] * srcN[i] + q[5] * srcN[i + 1] + q[8] * srcN[i + 2],
          ).normalize();
          Nn[k] = pv.x;
          Nn[k + 1] = pv.y;
          Nn[k + 2] = pv.z;
        }
      }
      pos.needsUpdate = true;
      nor.needsUpdate = true;
      geometry.computeBoundingSphere();
    }
  }

  /**
   * bar: the handle bar's centre (scene frame); p: 0 the pull grip … 1 the push. Returns the wrist point.
   * @param {THREE.Vector3} bar
   * @param {number} p
   */
  function pose(bar, p) {
    root.position.copy(bar);
    if (p === last) return out.copy(wristAt).add(bar);
    last = p;
    const A = POSES.pull;
    const B = POSES.push;
    wristAt.copy(A.wrist).lerp(B.wrist, p);
    hand.position.copy(wristAt);
    hand.quaternion.slerpQuaternions(qPull, qPush, p);
    const spread = lerp(A.spread, B.spread, p);
    fingers.forEach((f, i) => {
      f.joints.forEach((joint, j) => {
        joint.rotation.set(0, 0, lerp(A.curl[j], B.curl[j], p) * (1 - 0.05 * Math.abs(i - 1.5)));
      });
      f.joints[0].rotation.y = (i - 1.5) * spread;
    });
    thumbBase.rotation.set(0, lerp(A.thumb.yaw, B.thumb.yaw, p), 0);
    thumbBase.rotateZ(lerp(A.thumb.pitch, B.thumb.pitch, p));
    thumb.forEach((joint, j) => joint.rotation.set(0, 0, lerp(A.thumb.curl[j], B.thumb.curl[j], p)));

    // wrist, forearm, sleeve: from the wrist toward the elbow, then the upper arm away to the right and up
    wrist.position.copy(wristAt);
    wrist.quaternion.copy(hand.quaternion);
    elbowAt.copy(A.elbow).lerp(B.elbow, p).add(wristAt);
    dir.subVectors(elbowAt, wristAt);
    const len = dir.length();
    dir.normalize();
    forearm.position.copy(wristAt).addScaledVector(dir, -0.004);
    forearm.quaternion.setFromUnitVectors(UP, dir);
    forearm.scale.set(1, len, 1);
    sleeveStart.copy(wristAt).addScaledVector(dir, len * 0.97);
    sleeveMesh.position.copy(sleeveStart);
    sleeveMesh.quaternion.setFromUnitVectors(UP, dir);
    cuff.position.copy(sleeveStart).addScaledVector(dir, 0.004);
    cuff.quaternion.setFromUnitVectors(Z, dir);
    writeVertices();
    return out.copy(wristAt).add(bar);
  }

  return { root, pose, materials: M };
}
