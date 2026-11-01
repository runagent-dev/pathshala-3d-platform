// The comb scene, in millimetres: one table-top view with everything in it at once. A student sits at the left
// end of a table, leaning over it (seen from the side, facing right); the plastic comb is in their hair; the bits
// of paper lie on the table right in front of them, under their chin, where the comb comes down. The comb shows its
// charge as little "−" discs; the hair's loose strands stand up as the hair gets charged; one bit of paper (the
// right-most, "featured") carries the two force arrows: it lies under the comb's last teeth, so it is the first to
// jump, and it sticks at the comb's end, half beyond it, so its arrows stay clear of the comb. The app moves things;
// this file only builds them and says where they are.
import * as THREE from 'three';
import { boxProjectUV } from '@shared/student/materials.js';
import { createHand } from './hand.js';
import { createChargeSymbol, createChargeSymbols } from './charges.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeStatic } from './merge.js';
import { FLOOR_Y } from './room.js';

export const HEAD = new THREE.Vector3(-150, 85, -5); // middle of the head: bent low over the table's left end
const HEAD_R = 52; // mm, a student's head
const HAIR_R = 58;
const SCALE = new THREE.Vector3(0.94, 1.18, 0.9); // a head is longer than wide, and taller still
/** Where the comb runs along the top of the hair (x of its middle), and how deep its teeth go in. */
export const ARC = { from: HEAD.x + 8, to: HEAD.x + 34, inset: 8 }; // the front of the hair, above the forehead
/** The comb (its local origin is the middle of the row of teeth tips; x along it, y up to the back). */
export const COMB_SIZE = { half: 52.5, end: 58, teeth: 18, top: 30, thick: 3 }; // a 12 cm pocket comb
/** The table: its top at y = 0, from its left end (just right of the student) along x, and front to back along z. */
export const TABLE = { x0: -95, x1: 450, z0: -34, z1: 80 };
/**
 * The bits of paper on the table (top at y = 0): x, z, size (mm). Torn bits of thin paper, 2.4–2.8 cm, so a phone
 * shows each one clearly. All lie under the comb's row of teeth when it hangs over them; the
 * last one, under its last teeth, is the one with the arrows. The comb's middle hangs at x = 15.
 */
const BITS = [
  [-32, -17, 27],
  [-14, 19, 25],
  [4, -17, 28],
  [22, 19, 26],
  [40, -17, 27],
  [50, 27, 24],
  [64, 1, 27],
];
export const FEATURED = BITS.length - 1;
// coloured notebook paper (white bits would vanish against the white page once they are lifted), each with a thin
// darker edge round it
const PAPER = ['#ffd65c', '#ff88af', '#64d5ff', '#9be75b', '#ffa75a', '#bb9bff', '#fff1a0'];
const DISC_SLOTS = 10; // "−" discs on the comb at full charge
const DISC_ORDER = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9]; // they fill from the middle outwards

/** Small seeded random numbers, so the model is the same on every load. */
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** The top outline of the hair (seen from the front, z = 0) at x, and its slope. */
export function hairTop(x) {
  const u = (x - HEAD.x) / (HAIR_R * SCALE.x);
  return HEAD.y + HAIR_R * SCALE.y * Math.sqrt(Math.max(0, 1 - u * u));
}
export function hairSlope(x) {
  const u = (x - HEAD.x) / (HAIR_R * SCALE.x);
  const root = Math.sqrt(Math.max(1e-6, 1 - u * u));
  return (-(SCALE.y / SCALE.x) * u) / root;
}

/** A point on the head (unscaled sphere angles, three.js convention: phi = 0 at the back, theta = 0 at the top). */
function onHead(r, phi, theta) {
  return new THREE.Vector3(
    -r * Math.cos(phi) * Math.sin(theta) * SCALE.x,
    r * Math.cos(theta) * SCALE.y,
    r * Math.sin(phi) * Math.sin(theta) * SCALE.z,
  ).add(HEAD);
}

/** Fine strands drawn into a dark texture: the hair's look (strands run from the crown down). */
function hairTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4c2d20';
  ctx.fillRect(0, 0, 256, 256);
  const r = rand(5);
  for (let i = 0; i < 900; i++) {
    const x = r() * 256;
    const y = r() * 256;
    const g = Math.round(70 + r() * 70);
    ctx.strokeStyle = `rgba(${g},${Math.round(g * 0.85)},${Math.round(g * 0.72)},${0.1 + r() * 0.25})`;
    ctx.lineWidth = r() < 0.8 ? 1 : 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (r() - 0.5) * 6, y + 30, x + (r() - 0.5) * 10, y + 50 + r() * 50);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  return t;
}

/** A painted table top: blue enamel over wood whose grain still shows a little, and a few worn spots. */
function tableTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1f78a8';
  ctx.fillRect(0, 0, 256, 256);
  const r = rand(9);
  for (let i = 0; i < 70; i++) {
    const y = r() * 256;
    ctx.strokeStyle = `rgba(${r() < 0.6 ? '8,40,70' : '150,210,240'},${0.05 + r() * 0.07})`;
    ctx.lineWidth = 1 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 32) ctx.lineTo(x, y + Math.sin(x / 40 + i) * 3 + (r() - 0.5) * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = `rgba(255,255,255,${r() * 0.05})`;
    ctx.fillRect(r() * 256, r() * 256, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** The comb's outline: a back with rounded corners, a wide tooth at each end and a row of fine teeth. */
function combShape() {
  const { end, top, teeth } = COMB_SIZE;
  const pts = [];
  const corner = (cx, cy, a0, a1, last = true) => {
    for (let k = 0; k <= (last ? 4 : 3); k++) {
      const a = a0 + ((a1 - a0) * k) / 4;
      pts.push([cx + 3 * Math.cos(a), cy + 3 * Math.sin(a)]);
    }
  };
  // down the left end, along the teeth to the right, up the right end and back along the top
  const wide = COMB_SIZE.half + 1.5; // the inner edge of the wide end teeth
  pts.push([-end, top - 3], [-end, 1.2], [-end + 0.8, 0], [-wide - 0.8, 0], [-wide, 1.2], [-wide, teeth]);
  const n = 24;
  const w = 1.9;
  const pitch = (2 * COMB_SIZE.half - w) / (n - 1);
  for (let i = 0; i < n; i++) {
    const x0 = -COMB_SIZE.half + i * pitch;
    pts.push([x0, teeth], [x0, 1.4], [x0 + 0.45, 0], [x0 + w - 0.45, 0], [x0 + w, 1.4], [x0 + w, teeth]);
  }
  pts.push([wide, teeth], [wide, 1.2], [wide + 0.8, 0], [end - 0.8, 0], [end, 1.2]);
  corner(end - 3, top - 3, 0, Math.PI / 2);
  corner(-end + 3, top - 3, Math.PI / 2, Math.PI, false);
  return new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
}

/**
 * The hair: a cap over the head (unscaled sphere coordinates) down to a smooth hairline: low at the nape, at the
 * top of the ear at the sides, a fringe on the forehead. Near the hairline it thins down onto the skin.
 */
function hairGeometry(segPhi = 72, segT = 22) {
  const edge = (phi) => Math.PI * (0.48 - 0.16 * Math.sin(phi)); // phi = 0 at the back, π at the face
  const pos = [];
  const uv = [];
  const index = [];
  for (let j = 0; j <= segT; j++) {
    const v = j / segT;
    for (let i = 0; i <= segPhi; i++) {
      const phi = (i / segPhi) * Math.PI * 2;
      const theta = v * edge(phi);
      const r = v < 0.86 ? HAIR_R : HAIR_R - (HAIR_R - HEAD_R - 0.6) * ((v - 0.86) / 0.14) ** 1.5;
      pos.push(-r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta));
      uv.push(i / segPhi, 1 - v);
    }
  }
  const row = segPhi + 1;
  for (let j = 0; j < segT; j++)
    for (let i = 0; i < segPhi; i++) {
      const a = j * row + i;
      index.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** A torn bit of paper: a few corners round its middle, flat in its own x-y plane. */
function bitGeometry(size, r) {
  const n = 5 + Math.floor(r() * 3);
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
    const rad = (size / 2) * (0.72 + r() * 0.3);
    pts.push(new THREE.Vector2(rad * Math.cos(a), rad * Math.sin(a)));
  }
  return new THREE.ShapeGeometry(new THREE.Shape(pts));
}

/** The loose strand's shape: 13 mm along +y, bending 8 mm sideways (x); each strand is one instance of it, stretched
 * to its own length along y and turned to its own side along x. */
const STRAND = { len: 13, bend: 8 };
function strandGeometry() {
  const { len, bend } = STRAND;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(bend * 0.15, len * 0.35, 1),
    new THREE.Vector3(bend * 0.5, len * 0.7, 0.5),
    new THREE.Vector3(bend, len, -1),
  ]);
  return new THREE.TubeGeometry(curve, 12, 0.22, 4, false);
}

export function createCombScene({ colors }) {
  const root = new THREE.Group();
  root.name = 'CombScene';
  const r = rand(17);

  // ── the table: a blue painted top (it takes the shadows), four legs down to the floor ──
  const tableMap = tableTexture();
  tableMap.repeat.set(1 / 260, 1 / 260);
  const wood = new THREE.MeshStandardMaterial({ name: 'BlueExperimentTable', color: 0xc8dcea, map: tableMap, roughness: 0.42 });
  const { x0, x1, z0, z1 } = TABLE;
  const desk = new THREE.Mesh(boxProjectUV(new THREE.BoxGeometry(x1 - x0, 24, z1 - z0)), wood);
  desk.name = 'Desk';
  desk.position.set((x0 + x1) / 2, -12, (z0 + z1) / 2);
  desk.receiveShadow = true;
  root.add(desk);
  const legs = new THREE.Group();
  const legLen = -24 - FLOOR_Y;
  for (const x of [x0 + 20, x1 - 20])
    for (const z of [z0 + 20, z1 - 20]) {
      const leg = new THREE.Mesh(boxProjectUV(new THREE.BoxGeometry(26, legLen, 26)), wood);
      leg.position.set(x, -24 - legLen / 2, z);
      legs.add(leg);
    }
  root.add(mergeStatic(legs));

  // ── the student: head, hair, neck, shoulders (a light blue school shirt) ──
  const skin = new THREE.MeshStandardMaterial({ name: 'Skin', color: 0xdca27d, roughness: 0.6 });
  const hairMat = new THREE.MeshPhysicalMaterial({
    name: 'Hair',
    color: 0xffffff,
    map: hairTexture(),
    roughness: 0.5,
    sheen: 0.7,
    sheenColor: new THREE.Color(0x7a6a5c),
    sheenRoughness: 0.45,
  });
  const student = new THREE.Group();
  student.name = 'Student';
  const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 32, 24), skin);
  head.name = 'Head';
  head.scale.copy(SCALE);
  head.position.copy(HEAD);
  const hair = new THREE.Mesh(hairGeometry(), hairMat);
  hair.name = 'Hair';
  hair.scale.copy(SCALE);
  hair.position.copy(HEAD);
  student.add(head, hair);
  const faceInk = new THREE.MeshStandardMaterial({ name: 'FaceInk', color: 0x35251f, roughness: 0.75 });
  const eyeWhite = new THREE.MeshStandardMaterial({ name: 'EyeWhite', color: 0xfff8e9, roughness: 0.7 });
  const iris = new THREE.MeshStandardMaterial({ name: 'BrownEyes', color: 0x593a26, roughness: 0.6 });
  const lip = new THREE.MeshStandardMaterial({ name: 'Lips', color: 0x8e4e43, roughness: 0.75 });
  const innerEar = new THREE.MeshStandardMaterial({ name: 'InnerEar', color: 0xba7b62, roughness: 0.8 });
  const frontAt = (dx, dy, offset = 0) =>
    new THREE.Vector3(
      HEAD.x + dx,
      HEAD.y + dy,
      HEAD.z + HEAD_R * SCALE.z * Math.sqrt(Math.max(0, 1 - (dx / (HEAD_R * SCALE.x)) ** 2 - (dy / (HEAD_R * SCALE.y)) ** 2)) + offset,
    );
  for (const dx of [-16, 16]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), eyeWhite);
    eye.name = 'Eye';
    eye.scale.set(6, 3, 2);
    eye.position.copy(frontAt(dx, 1, 0.8));
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), iris);
    pupil.name = 'Iris';
    pupil.scale.set(2.3, 2.6, 0.9);
    pupil.position.copy(frontAt(dx, 1, 2.4));
    const brow = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([frontAt(dx - 6, 10, 1.2), frontAt(dx, 12, 1.2), frontAt(dx + 6, 10, 1.2)]),
        10,
        1.1,
        6,
        false,
      ),
      faceInk,
    );
    brow.name = 'Eyebrow';
    student.add(eye, pupil, brow);
  }
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), skin);
    ear.name = 'Ear';
    ear.scale.set(6, 10, 4);
    ear.position.set(HEAD.x + side * HEAD_R * SCALE.x, HEAD.y - 7, HEAD.z + 4);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), innerEar);
    inner.scale.set(3.1, 6.3, 1);
    inner.position.copy(ear.position).add(new THREE.Vector3(0, 0, 3.5));
    student.add(ear, inner);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), skin);
  nose.name = 'Nose';
  nose.scale.set(4.5, 7, 5);
  nose.position.copy(frontAt(0, -8, 1));
  const mouth = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([frontAt(-10, -23, 1), frontAt(0, -26, 1), frontAt(10, -23, 1)]), 14, 0.9, 6, false),
    lip,
  );
  mouth.name = 'Mouth';
  student.add(mouth);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 42, 20), skin);
  neck.name = 'Neck';
  neck.position.set(HEAD.x, 15, HEAD.z);
  // the upper body in a blue school shirt: shoulders sloping from the neck, down out of the picture (the student sits
  // at the table's end), one turned profile, flattened front to back
  const shirtMat = new THREE.MeshStandardMaterial({ name: 'BlueShirt', color: 0x2168c5, roughness: 0.7 });
  const profile = [
    [0, 4],
    [15, 2],
    [28, -4],
    [41, -14],
    [49, -28],
    [52, -48],
    [50, -110],
    [46, -250],
    [44, -460],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const shirt = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), shirtMat);
  shirt.name = 'Shoulders';
  shirt.scale.z = 0.64;
  shirt.position.set(HEAD.x, -6, HEAD.z);
  // a white collar round the neck
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(17, 3.2, 8, 24),
    new THREE.MeshStandardMaterial({ name: 'Collar', color: 0xf1f3f5, roughness: 0.7 }),
  );
  collar.name = 'Collar';
  collar.rotation.x = Math.PI / 2 - 0.25;
  collar.position.set(HEAD.x, 1, HEAD.z + 2);
  student.add(nose, neck, shirt, collar);
  root.add(student);

  // the parts, by name (merged below into one mesh per material: the face's small parts in one, by colour)
  student.userData.parts = student.children.map((m) => m.name);
  mergeStatic(student, {
    paint: {
      from: [faceInk, eyeWhite, iris, lip, innerEar],
      material: new THREE.MeshStandardMaterial({ name: 'Face', vertexColors: true, roughness: 0.7 }),
    },
  });

  // loose strands on the crown: they lie down, and stand up (towards the comb, when it is near) as the hair is charged;
  // one instanced mesh, a strand each
  const strandMat = new THREE.MeshStandardMaterial({ name: 'HairStrand', color: 0x221d1a, roughness: 0.5 });
  const strandMesh = new THREE.InstancedMesh(strandGeometry(), strandMat, 12);
  strandMesh.name = 'LooseHair';
  strandMesh.frustumCulled = false;
  strandMesh.visible = false;
  student.add(strandMesh);
  const strands = [];
  const UP = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 12; i++) {
    // most just behind the comb's plane along the top outline (so they show above the head), a few anywhere
    const behind = 0.08 + r() * 0.3;
    const phi = i < 26 ? (r() < 0.5 ? -behind : Math.PI + behind) : r() * Math.PI * 2;
    const theta = 0.02 * Math.PI + r() * 0.2 * Math.PI;
    const p = onHead(HAIR_R - 1.5, phi, theta);
    const normal = p.clone().sub(HEAD).divide(SCALE).normalize();
    const down = onHead(HAIR_R - 1.5, phi, theta + 0.2)
      .sub(p)
      .normalize(); // down the slope, away from the crown
    const len = 9 + r() * 8;
    const side = r() < 0.5 ? -1 : 1;
    r(); // (the bend's size, as before: the same random numbers for the bits of paper below)
    const scale = new THREE.Vector3(side, len / STRAND.len, 1);
    const rest = new THREE.Quaternion().setFromUnitVectors(UP, down.clone().addScaledVector(normal, 0.15).normalize());
    const upDir = normal
      .clone()
      .multiplyScalar(0.35)
      .add(new THREE.Vector3((r() - 0.5) * 0.45, 0.65, (r() - 0.5) * 0.3))
      .normalize();
    strands.push({ base: p, scale, rest, upDir, weight: 0.55 + r() * 0.45 });
  }
  const dir = new THREE.Vector3();
  const toward = new THREE.Vector3();
  const qStand = new THREE.Quaternion();
  const qNow = new THREE.Quaternion();
  const strandM = new THREE.Matrix4();
  /**
   * Loose strands stand up as the hair gets charged (k: 0 none … 1 full), leaning towards the comb when it is
   * close (`comb`: a world point on its teeth, or null); lying flat, they are not drawn.
   */
  function setFrizz(k, comb = null) {
    strandMesh.visible = k > 0;
    if (!(k > 0)) return;
    strands.forEach((s, i) => {
      dir.copy(s.upDir);
      if (comb) {
        toward.copy(comb).sub(s.base);
        const near = Math.max(0, 1 - toward.length() / 160);
        dir.lerp(toward.normalize(), 0.7 * near).normalize();
      }
      qStand.setFromUnitVectors(UP, dir);
      qNow.slerpQuaternions(s.rest, qStand, Math.min(1, 0.9 * k * s.weight));
      strandMesh.setMatrixAt(i, strandM.compose(s.base, qNow, s.scale));
    });
    strandMesh.instanceMatrix.needsUpdate = true;
  }

  // ── the comb, with its charge ──
  const plastic = new THREE.MeshPhysicalMaterial({ name: 'CombPlastic', color: 0xf34e42, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.25 });
  const combGeo = new THREE.ExtrudeGeometry(combShape(), {
    depth: COMB_SIZE.thick,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.35,
    bevelSegments: 2,
    curveSegments: 4,
  });
  combGeo.translate(0, 0, -COMB_SIZE.thick / 2);
  const comb = new THREE.Group();
  comb.name = 'Comb';
  const combMesh = new THREE.Mesh(combGeo, plastic);
  combMesh.name = 'CombBody';
  comb.add(combMesh, createHand(skin));
  const discMat = new THREE.MeshBasicMaterial({ name: 'Charge', color: colors.em, toneMapped: false });
  const minusMat = new THREE.MeshBasicMaterial({ name: 'ChargeSign', color: 0xffffff, toneMapped: false });
  // the "−" discs on both faces of the comb: one instanced mesh of discs and one of signs, in the order they fill
  // (from the middle outwards), two instances (the faces) per disc; `count` shows the first ones
  const zFace = COMB_SIZE.thick / 2 + 0.6;
  const discs = new THREE.InstancedMesh(new THREE.CircleGeometry(4.8, 24), discMat, 2 * DISC_SLOTS);
  const minuses = new THREE.InstancedMesh(new THREE.PlaneGeometry(5.2, 1.3), minusMat, 2 * DISC_SLOTS);
  discs.name = 'ChargeDiscs';
  minuses.name = 'ChargeSigns';
  {
    const m = new THREE.Matrix4();
    const turn = new THREE.Matrix4().makeRotationY(Math.PI);
    DISC_ORDER.forEach((slot, k) => {
      const x = (slot - (DISC_SLOTS - 1) / 2) * 10.6;
      [1, -1].forEach((face, f) => {
        m.makeTranslation(x, 24, face * zFace);
        if (face < 0) m.multiply(turn);
        discs.setMatrixAt(2 * k + f, m);
        m.makeTranslation(x, 24, face * (zFace + 0.05));
        if (face < 0) m.multiply(turn);
        minuses.setMatrixAt(2 * k + f, m);
      });
    });
  }
  for (const im of [discs, minuses]) {
    im.userData.noExport = true;
    im.frustumCulled = false;
    im.count = 0;
    comb.add(im);
  }
  // the "+" marks on the hair (as many as "−" on the comb), turned to face the camera
  const positiveCharges = createChargeSymbols(true, 4.6, DISC_SLOTS);
  positiveCharges.root.name = 'HairPositiveCharges';
  DISC_ORDER.forEach((slot, k) =>
    positiveCharges.place(k, onHead(HAIR_R + 3, Math.PI * (0.25 + (slot % 5) * 0.125), Math.PI * (slot < 5 ? 0.2 : 0.29))),
  );
  root.add(positiveCharges.root);
  /** Show equal numbers of positive hair markers and negative comb markers: electrons moved, not created. */
  function setCharge(q) {
    const n = Math.round(Math.min(Math.max(q, 0), 5) * 2);
    discs.count = minuses.count = 2 * n;
    positiveCharges.setCount(n);
  }
  // a big invisible box round the comb, so a finger takes it easily
  const combHit = new THREE.Mesh(new THREE.BoxGeometry(240, 58, 35), new THREE.MeshBasicMaterial({ visible: false }));
  combHit.position.set(-40, 15, 0);
  combHit.userData = { part: 'comb', noExport: true };
  comb.add(combHit);
  root.add(comb);

  // ── the bits of paper ──
  // one material for all of them: each bit's colour, and its darker edge, are vertex colours
  const paperMat = new THREE.MeshStandardMaterial({ name: 'Paper', vertexColors: true, roughness: 0.86, side: THREE.DoubleSide });
  const bits = BITS.map(([x, z, size], i) => {
    const face = bitGeometry(size, r);
    // the edge: the same shape a little bigger, darker, just behind it
    const rim = face
      .clone()
      .scale(1 + 1.6 / size, 1 + 1.6 / size, 1)
      .translate(0, 0, -0.12);
    const colour = new THREE.Color(PAPER[i % PAPER.length]);
    const paint = (g, c) => {
      const rgb = new Float32Array(g.attributes.position.count * 3);
      for (let k = 0; k < rgb.length; k += 3) c.toArray(rgb, k);
      g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
      return g;
    };
    const geo = mergeGeometries([paint(face, colour), paint(rim, colour.clone().multiplyScalar(0.62))]);
    face.dispose();
    rim.dispose();
    const mesh = new THREE.Mesh(geo, paperMat);
    mesh.name = 'PaperBit';
    const g = new THREE.Group();
    g.add(mesh);
    const home = {
      position: new THREE.Vector3(x, 0.35 + i * 0.01, z),
      quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, r() * Math.PI * 2, 'YXZ')),
    };
    g.position.copy(home.position);
    g.quaternion.copy(home.quaternion);
    // where it sticks on the comb (in the comb's own coordinates): on the teeth, facing out; the bit with the
    // arrows hangs at the right end, half beyond it, so its arrows stay clear of the comb
    const cling = {
      x: i === FEATURED ? COMB_SIZE.end + 4 : null,
      y: i === FEATURED ? 5 : 1 + r() * 4,
      z: zFace + 0.4 + i * 0.06,
      tilt: (r() - 0.5) * 0.8,
    };
    root.add(g);
    return { group: g, mesh, size, home, cling };
  });

  // the bits on the table: a box round them (for the ring that says "touch here") and a big invisible hit box
  const paperBox = new THREE.Box3();
  for (const b of bits) {
    const p = b.home.position;
    paperBox.expandByPoint(new THREE.Vector3(p.x - b.size / 2, 0, p.z - b.size / 2));
    paperBox.expandByPoint(new THREE.Vector3(p.x + b.size / 2, 2, p.z + b.size / 2));
  }
  const paperHit = new THREE.Mesh(new THREE.BoxGeometry(150, 30, 84), new THREE.MeshBasicMaterial({ visible: false }));
  paperBox.getCenter(paperHit.position);
  paperHit.userData = { part: 'paper', noExport: true };
  root.add(paperHit);

  const positivePaper = createChargeSymbol(true, 4.3);
  const negativePaper = createChargeSymbol(false, 4.3);
  positivePaper.visible = negativePaper.visible = false;
  positivePaper.name = 'PaperPositiveCharge';
  negativePaper.name = 'PaperNegativeCharge';
  root.add(positivePaper, negativePaper);
  const towardComb = new THREE.Vector3();
  const viewNormal = new THREE.Vector3();
  const combPoint = new THREE.Vector3();
  function updateChargeMarkers(camera, showPaper) {
    positiveCharges.face(camera.quaternion);
    positivePaper.visible = negativePaper.visible = showPaper;
    if (!showPaper) return;
    const centre = bits[FEATURED].group.position;
    viewNormal.set(0, 0, 1).applyQuaternion(camera.quaternion);
    comb.localToWorld(combPoint.set(0, 0, 0));
    towardComb.subVectors(combPoint, centre);
    towardComb.addScaledVector(viewNormal, -towardComb.dot(viewNormal)).normalize();
    for (const [marker, side] of [
      [positivePaper, 1],
      [negativePaper, -1],
    ]) {
      marker.position
        .copy(centre)
        .addScaledVector(towardComb, side * 5.5)
        .addScaledVector(viewNormal, 3);
      marker.quaternion.copy(camera.quaternion);
    }
  }
  const discsAt = new THREE.Vector3();
  const hairAt = new THREE.Vector3(HEAD.x - 50, hairTop(HEAD.x - 50) - 10, HAIR_R * SCALE.z * 0.3);
  return {
    root,
    comb,
    combMesh,
    combHit,
    paperHit,
    paperBox,
    bits,
    setCharge,
    setFrizz,
    updateChargeMarkers,
    points: {
      positive: () => positiveCharges.at(0),
      discs: () => comb.localToWorld(discsAt.set(0, 24, zFace)),
      hair: () => hairAt,
      /** Points of the face (for framing): forehead, nose tip, chin. */
      face: [
        onHead(HEAD_R, Math.PI, Math.PI * 0.32),
        new THREE.Vector3(HEAD.x + HEAD_R * SCALE.x, HEAD.y, HEAD.z),
        new THREE.Vector3(HEAD.x, HEAD.y - HEAD_R * SCALE.y, HEAD.z),
      ],
      /** The top of the hair from the crown to the front (for framing): enough of it to comb. */
      crown: [-40, -20, 0, 20, 40].map((dx) => new THREE.Vector3(HEAD.x + dx, hairTop(HEAD.x + dx), 0)),
    },
  };
}
