// The comb scene, in millimetres: one table-top view with everything in it at once. A student sits at the left
// end of a table, leaning over it (seen from the side, facing right); the plastic comb is in their hair; the bits
// of paper lie on the table right in front of them, under their chin, where the comb comes down. The comb shows its
// charge as little "−" discs; the hair's loose strands stand up as the hair gets charged; one bit of paper (the
// right-most, "featured") carries the two force arrows: it lies under the comb's last teeth, so it is the first to
// jump, and it sticks at the comb's end, half beyond it, so its arrows stay clear of the comb. The app moves things;
// this file only builds them and says where they are.
import * as THREE from 'three';
import { boxProjectUV } from '@shared/student/materials.js';
import { deskWood } from './desk.js';

export const HEAD = new THREE.Vector3(-150, 105, -5); // middle of the head: bent low over the table's left end
const HEAD_R = 78; // mm, a student's head
const HAIR_R = 84;
const SCALE = new THREE.Vector3(1.06, 1.12, 0.95); // a head is longer than wide, and taller still
/** Where the comb runs along the top of the hair (x of its middle), and how deep its teeth go in. */
export const ARC = { from: HEAD.x + 30, to: HEAD.x + 56, inset: 8 }; // the front of the hair, above the forehead
/** The comb (its local origin is the middle of the row of teeth tips; x along it, y up to the back). */
export const COMB_SIZE = { half: 52.5, end: 58, teeth: 18, top: 30, thick: 3 }; // a 12 cm pocket comb
/** The table: its top at y = 0, from its left end (just right of the student) along x, and front to back along z. */
export const TABLE = { x0: -95, x1: 450, z0: -34, z1: 80 };
/**
 * The bits of paper on the table (top at y = 0): x, z, size (mm). Torn bits of thin paper, 1.7–2.1 cm, so a phone
 * shows each one clearly. All lie under the comb's row of teeth when it hangs over them; the
 * last one, under its last teeth, is the one with the arrows. The comb's middle hangs at x = 15.
 */
const BITS = [
  [-33, -14, 19],
  [-19, 16, 18],
  [-4, -3, 21],
  [10, 22, 17],
  [23, -17, 20],
  [36, 9, 18],
  [48, -7, 19],
  [56, 23, 17],
  [64, 1, 20],
];
export const FEATURED = BITS.length - 1;
const PAPER = ['#fbfbf6', '#f7efd8', '#f8dfe4', '#f6f0c2', '#e0eaf7', '#e3f1de'];
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
  ctx.fillStyle = '#1d1a18';
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
  const edge = (phi) => Math.PI * (0.5 + 0.19 * Math.cos(phi)); // phi = 0 at the back, π at the face
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

/** A strand of hair along +y (bends a little), to be turned from lying down to standing up. */
function strandGeometry(len, r) {
  const bend = (r() < 0.5 ? -1 : 1) * (4 + r() * 8);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(bend * 0.15, len * 0.35, 1),
    new THREE.Vector3(bend * 0.5, len * 0.7, 0.5),
    new THREE.Vector3(bend, len, -1),
  ]);
  return new THREE.TubeGeometry(curve, 12, 0.22, 4, false);
}

export function createCombScene({ materials, colors }) {
  const root = new THREE.Group();
  root.name = 'CombScene';
  const r = rand(17);

  // ── the table ──
  const wood = deskWood(materials);
  const { x0, x1, z0, z1 } = TABLE;
  const desk = new THREE.Mesh(boxProjectUV(new THREE.BoxGeometry(x1 - x0, 24, z1 - z0)), wood);
  desk.name = 'Desk';
  desk.position.set((x0 + x1) / 2, -12, (z0 + z1) / 2);
  desk.receiveShadow = true;
  root.add(desk);
  for (const x of [x0 + 20, x1 - 20])
    for (const z of [z0 + 20, z1 - 20]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(26, 700, 26), wood);
      leg.position.set(x, -374, z);
      root.add(leg);
    }

  // ── the student: head, hair, neck, shoulders (a light blue school shirt) ──
  const skin = new THREE.MeshStandardMaterial({ name: 'Skin', color: 0xb27650, roughness: 0.6 });
  const hairMat = new THREE.MeshPhysicalMaterial({
    name: 'Hair',
    color: 0xffffff,
    map: hairTexture(),
    roughness: 0.5,
    sheen: 0.7,
    sheenColor: new THREE.Color(0x7a6a5c),
    sheenRoughness: 0.45,
  });
  const shirt = new THREE.MeshStandardMaterial({ name: 'Shirt', color: 0x9cc3e6, roughness: 0.8 });
  const student = new THREE.Group();
  student.name = 'Student';
  const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 48, 32), skin);
  head.scale.copy(SCALE);
  head.position.copy(HEAD);
  const hair = new THREE.Mesh(hairGeometry(), hairMat);
  hair.name = 'Hair';
  hair.scale.copy(SCALE);
  hair.position.copy(HEAD);
  const ear = new THREE.Mesh(new THREE.SphereGeometry(15, 20, 14), skin);
  ear.scale.set(0.62, 1, 0.32);
  ear.position.copy(onHead(HEAD_R - 2, Math.PI * 0.53, Math.PI * 0.57));
  const nose = new THREE.Mesh(new THREE.SphereGeometry(10, 18, 12), skin);
  nose.scale.set(1, 1.45, 0.8);
  nose.position.copy(onHead(HEAD_R - 1, Math.PI, Math.PI * 0.6));
  // a closed, calm eye and an eyebrow on the side of the face (the student looks down at the desk)
  const dark = new THREE.MeshStandardMaterial({ name: 'EyeBrow', color: 0x2a201b, roughness: 0.6 });
  const eye = new THREE.Mesh(new THREE.SphereGeometry(4.6, 16, 10), dark);
  eye.scale.set(1.25, 0.38, 0.5);
  eye.position.copy(onHead(HEAD_R - 0.9, Math.PI * 0.78, Math.PI * 0.55));
  const browCurve = new THREE.CatmullRomCurve3([
    onHead(HEAD_R + 0.2, Math.PI * 0.73, Math.PI * 0.49),
    onHead(HEAD_R + 0.6, Math.PI * 0.78, Math.PI * 0.475),
    onHead(HEAD_R + 0.2, Math.PI * 0.83, Math.PI * 0.485),
  ]);
  const brow = new THREE.Mesh(new THREE.TubeGeometry(browCurve, 10, 1.3, 6, false), dark);
  // the neck leans forward a little: the student bends over the table to watch the paper
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(30, 34, 120, 24), skin);
  neck.position.set(HEAD.x - 22, HEAD.y - 112, 0);
  neck.rotation.z = -0.32;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(80, 150, 8, 24), shirt);
  torso.scale.set(0.8, 1, 1.3);
  torso.position.set(HEAD.x - 48, HEAD.y - 282, 0);
  torso.rotation.z = -0.2;
  student.add(head, hair, ear, nose, eye, brow, neck, torso);
  root.add(student);

  // loose strands on the crown: they lie down, and stand up (towards the comb, when it is near) as the hair is charged
  const strandMat = new THREE.MeshStandardMaterial({ name: 'HairStrand', color: 0x221d1a, roughness: 0.5 });
  const strands = [];
  const UP = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 36; i++) {
    // most just behind the comb's plane along the top outline (so they show above the head), a few anywhere
    const behind = 0.08 + r() * 0.3;
    const phi = i < 26 ? (r() < 0.5 ? -behind : Math.PI + behind) : r() * Math.PI * 2;
    const theta = 0.02 * Math.PI + r() * 0.2 * Math.PI;
    const p = onHead(HAIR_R - 1.5, phi, theta);
    const normal = p.clone().sub(HEAD).divide(SCALE).normalize();
    const down = onHead(HAIR_R - 1.5, phi, theta + 0.2)
      .sub(p)
      .normalize(); // down the slope, away from the crown
    const len = 16 + r() * 14;
    const g = new THREE.Group();
    g.position.copy(p);
    g.add(new THREE.Mesh(strandGeometry(len, r), strandMat));
    const rest = new THREE.Quaternion().setFromUnitVectors(UP, down.clone().addScaledVector(normal, 0.15).normalize());
    const upDir = normal
      .clone()
      .multiplyScalar(0.35)
      .add(new THREE.Vector3((r() - 0.5) * 0.45, 0.65, (r() - 0.5) * 0.3))
      .normalize();
    g.quaternion.copy(rest);
    strands.push({ group: g, base: p, rest, upDir, weight: 0.55 + r() * 0.45 });
    student.add(g);
  }
  const dir = new THREE.Vector3();
  const toward = new THREE.Vector3();
  const qStand = new THREE.Quaternion();
  /**
   * Loose strands stand up as the hair gets charged (k: 0 none … 1 full), leaning towards the comb when it is
   * close (`comb`: a world point on its teeth, or null); lying flat, they are not drawn.
   */
  function setFrizz(k, comb = null) {
    for (const s of strands) {
      s.group.visible = k > 0;
      if (!(k > 0)) continue;
      dir.copy(s.upDir);
      if (comb) {
        toward.copy(comb).sub(s.base);
        const near = Math.max(0, 1 - toward.length() / 160);
        dir.lerp(toward.normalize(), 0.7 * near).normalize();
      }
      qStand.setFromUnitVectors(UP, dir);
      s.group.quaternion.slerpQuaternions(s.rest, qStand, Math.min(1, 0.9 * k * s.weight));
    }
  }

  // ── the comb, with its charge ──
  const plastic = new THREE.MeshPhysicalMaterial({ name: 'CombPlastic', color: 0x2a2d33, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.25 });
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
  comb.add(combMesh);
  const discMat = new THREE.MeshBasicMaterial({ name: 'Charge', color: colors.em, toneMapped: false });
  const minusMat = new THREE.MeshBasicMaterial({ name: 'ChargeSign', color: 0xffffff, toneMapped: false });
  const discGeo = new THREE.CircleGeometry(4.8, 24);
  const minusGeo = new THREE.PlaneGeometry(5.2, 1.3);
  const discs = [];
  const zFace = COMB_SIZE.thick / 2 + 0.6;
  for (let i = 0; i < DISC_SLOTS; i++) {
    const g = new THREE.Group();
    g.name = 'ChargeDisc';
    for (const face of [1, -1]) {
      const d = new THREE.Mesh(discGeo, discMat);
      const m = new THREE.Mesh(minusGeo, minusMat);
      d.position.z = face * zFace;
      m.position.z = face * (zFace + 0.05);
      if (face < 0) d.rotation.y = m.rotation.y = Math.PI;
      g.add(d, m);
    }
    g.position.set((i - (DISC_SLOTS - 1) / 2) * 10.6, 24, 0);
    g.visible = false;
    comb.add(g);
    discs.push(g);
  }
  /** Show the charge as discs: two per level. */
  function setCharge(q) {
    const n = Math.round(Math.min(Math.max(q, 0), 5) * 2);
    DISC_ORDER.forEach((slot, k) => {
      discs[slot].visible = k < n;
    });
  }
  // a big invisible box round the comb, so a finger takes it easily
  const combHit = new THREE.Mesh(new THREE.BoxGeometry(150, 46, 30), new THREE.MeshBasicMaterial({ visible: false }));
  combHit.position.set(0, 15, 0);
  combHit.userData = { part: 'comb', noExport: true };
  comb.add(combHit);
  root.add(comb);

  // ── the bits of paper ──
  const bits = BITS.map(([x, z, size], i) => {
    const mat = new THREE.MeshStandardMaterial({ name: 'Paper', color: PAPER[i % PAPER.length], roughness: 0.85, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(bitGeometry(size, r), mat);
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
    points: {
      discs: () => comb.localToWorld(discsAt.set(0, 24, zFace)),
      hair: () => hairAt,
      /** Points of the face (for framing): forehead, nose tip, chin. */
      face: [onHead(HEAD_R, Math.PI, Math.PI * 0.38), onHead(HEAD_R + 12, Math.PI, Math.PI * 0.6), onHead(HEAD_R, Math.PI * 0.95, Math.PI * 0.8)],
      /** The top of the hair from the crown to the front (for framing): enough of it to comb. */
      crown: [10, 35, 60, 80].map((dx) => new THREE.Vector3(HEAD.x + dx, hairTop(HEAD.x + dx), 0)),
    },
  };
}
