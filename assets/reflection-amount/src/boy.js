// The boy of চিত্র ৮.০৫, in metres, standing on y = 0 and facing +z (scene.js turns him to the glass): the student of
// assets/plane-mirror-image/src/boy.js (a modelled profile: brow, nose, lips, chin, ear), in the book's yellow shirt, with
// his head as a part of its own so that he can look down at the glass. Baked into one mesh per finish and part (cloth and
// skin; hair and eyes), with colours in the vertices: four draw calls, however detailed he is.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const COLOUR = {
  skin: '#a9734f',
  lips: '#7f4a3c',
  shirt: '#efc22f',
  shirtDark: '#d3a51f',
  button: '#eef2f6',
  trousers: '#39424f',
  belt: '#3a2415',
  buckle: '#c9ccd1',
  shoe: '#2a1a12',
  sole: '#16110e',
  hair: '#17110d',
  white: '#efeae4',
  iris: '#2a1a12',
};
const HEAD_Y = 1.5; // the head's centre before the whole boy is scaled to 1.5 m
const HEAD_Z = 0.04; // the head sits a little ahead of the body
const FOOT_Z = -0.047; // the feet a little behind: the toe comes under the eye
const NECK = { y: 1.4, z: 0.02 }; // where the head turns
const SHOULDER = { x: 0.186, y: 1.318 };
const UPPER = 0.29;
const FORE = 0.25;
const HIP = { x: 0.088, y: 0.86 };

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const bump = (x, c, s) => Math.exp(-(((x - c) / s) ** 2));
/** A smooth curve through [y, value] rows, y falling (Catmull–Rom). */
function curve(rows) {
  return (y) => {
    if (y >= rows[0][0]) return rows[0][1];
    let i = 0;
    while (i < rows.length - 2 && y < rows[i + 1][0]) i++;
    const p0 = rows[Math.max(0, i - 1)][1];
    const p1 = rows[i][1];
    const p2 = rows[i + 1][1];
    const p3 = rows[Math.min(rows.length - 1, i + 2)][1];
    const t = Math.min(1, Math.max(0, (rows[i][0] - y) / (rows[i][0] - rows[i + 1][0])));
    return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
  };
}
// the head's section at height y from its centre: half width, depth to the front, depth to the back
const HEAD_TOP = 0.1;
const HEAD_LOW = -0.112;
const WIDE = curve([
  [HEAD_TOP, 0],
  [0.093, 0.04],
  [0.075, 0.064],
  [0.05, 0.077],
  [0.02, 0.082],
  [-0.01, 0.081],
  [-0.04, 0.075],
  [-0.065, 0.064],
  [-0.085, 0.05],
  [-0.101, 0.031],
  [HEAD_LOW, 0],
]);
const FRONT = curve([
  [HEAD_TOP, 0],
  [0.093, 0.042],
  [0.075, 0.07],
  [0.05, 0.086],
  [0.02, 0.09],
  [-0.01, 0.088],
  [-0.04, 0.085],
  [-0.065, 0.082],
  [-0.085, 0.08],
  [-0.101, 0.07],
  [HEAD_LOW, 0],
]);
const BACK = curve([
  [HEAD_TOP, 0],
  [0.093, 0.048],
  [0.075, 0.078],
  [0.05, 0.094],
  [0.02, 0.1],
  [-0.01, 0.097],
  [-0.04, 0.082],
  [-0.065, 0.056],
  [-0.085, 0.036],
  [-0.101, 0.026],
  [HEAD_LOW, 0],
]);
/** The face's relief, added forward on top of the egg: strongest on the middle line. */
function relief(x, y) {
  const a = Math.abs(x);
  let z = 0;
  z += 0.006 * bump(y, 0.034, 0.012) * bump(x, 0, 0.055); // the brow
  z -= 0.0045 * bump(y, 0.013, 0.01) * bump(x, 0, 0.012); // the bridge's dip
  const nose = y < -0.031 ? bump(y, -0.031, 0.0085) : bump(y, -0.031, 0.031);
  z += 0.0245 * nose * bump(x, 0, y < -0.015 ? 0.018 : 0.0105); // the nose
  z -= 0.0065 * bump(y, 0.012, 0.0095) * bump(a, 0.032, 0.017); // the eye sockets
  z += 0.004 * bump(y, -0.016, 0.018) * bump(a, 0.05, 0.02); // the cheekbones
  z += 0.0032 * bump(y, -0.0595, 0.0062) * bump(x, 0, 0.023); // the upper lip
  z -= 0.0007 * bump(y, -0.0658, 0.0018) * bump(x, 0, 0.024); // the line of the mouth
  z += 0.003 * bump(y, -0.072, 0.0052) * bump(x, 0, 0.02); // the lower lip
  z -= 0.0022 * bump(y, -0.082, 0.005) * bump(x, 0, 0.02); // under the lip
  z += 0.0045 * bump(y, -0.096, 0.0105) * bump(x, 0, 0.024); // the chin
  return z;
}
/** A point of the head's surface, y from the centre, at the angle a round it (0 at the front), pushed out by `grow`. */
function headPoint(a, y, grow, out) {
  const s = Math.sin(a);
  const c = Math.cos(a);
  const x = WIDE(y) * s;
  const z = (c >= 0 ? FRONT(y) : BACK(y)) * c;
  out.set(x, y, z + (c > 0 ? relief(x, y) * smooth(0, 0.35, c) : 0));
  if (grow) {
    const r = Math.hypot(out.x, out.z) || 1;
    out.x += (out.x / r) * grow;
    out.z += (out.z / r) * grow;
    out.y += grow * 0.8 * smooth(0, 0.08, y);
  }
  return out;
}
/** A grid of the head's surface, closed at the top; lowAt(a) gives each column its own lower end (the hair's edge). */
function headGrid({ rows, cols, grow = () => 0, tint = null, top = HEAD_TOP, lowAt = () => HEAD_LOW }) {
  const pos = [];
  const col = [];
  const index = [];
  const p = new THREE.Vector3();
  // rings close together near the top and the lower end, where the shape turns fast
  const ring = (j) => {
    const k = j / rows;
    return 0.5 - 0.5 * Math.cos(k * Math.PI) * (1 - 0.12) + (k - 0.5) * 0.12;
  };
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      const a = (i / cols) * Math.PI * 2;
      const y = top + (lowAt(a) - top) * ring(j);
      headPoint(a, y, grow(a, y), p);
      pos.push(p.x, p.y, p.z);
      if (tint) {
        const c = tint(p.x, y, p.z);
        col.push(c.r, c.g, c.b);
      }
    }
  const at = (i, j) => j * (cols + 1) + i;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      // seen from outside the rows go down and the columns go round from the front through +x
      index.push(at(i, j), at(i, j + 1), at(i + 1, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1));
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (tint) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  // the seam at the back: both edges of the grid share their normals
  const n = g.attributes.normal;
  for (let j = 0; j <= rows; j++) {
    const a = at(0, j);
    const b = at(cols, j);
    const x = n.getX(a) + n.getX(b);
    const y = n.getY(a) + n.getY(b);
    const z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }
  return g;
}

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

/** A shoe's shell: rings from heel to toe, each a low arch; or, with `flat`, the sole's outline. */
function shoeGeometry({ flat = 0 } = {}) {
  const pos = [];
  const index = [];
  const N = 24;
  const M = 14;
  const LONG = 0.28;
  // half width and height along the foot, 0 at the heel and 1 at the toe
  const wide = (u) => 0.05 * (0.72 + 0.28 * smooth(0, 0.5, u)) * (u > 0.72 ? Math.sqrt(Math.max(0, 1 - ((u - 0.72) / 0.28) ** 2)) * 0.9 + 0.1 : 1);
  const high = (u) => {
    const instep = 0.042 + 0.062 * (1 - smooth(0.14, 0.62, u));
    const heel = smooth(-0.02, 0.08, u);
    const toe = u > 0.78 ? Math.sqrt(Math.max(0, 1 - ((u - 0.78) / 0.22) ** 2)) : 1;
    return instep * (0.4 + 0.6 * heel) * (0.25 + 0.75 * toe);
  };
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    for (let j = 0; j <= M; j++) {
      const a = (j / M) * Math.PI;
      pos.push(Math.cos(a) * wide(u) * (flat ? 1.05 : 1), flat ? (Math.sin(a) > 0.01 ? flat : 0) : Math.sin(a) * high(u), u * LONG);
    }
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j;
      const b = a + M + 1;
      index.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function bakery() {
  const lists = { matte: [], gloss: [], headMatte: [], headGloss: [] };
  let head = false;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const sc = new THREE.Vector3();
  const at = new THREE.Vector3();
  const c = new THREE.Color();
  /**
   * Bakes a shape into the mesh of its finish. colour: a key of COLOUR, or null when the shape brings its own.
   * parent: a matrix for the shape's whole limb.
   */
  function add(
    geo,
    colour,
    { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, quat = null, parent = null, finish = 'matte' } = {},
  ) {
    const g = geo.clone();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(name)) g.deleteAttribute(name);
    m4.compose(at.set(x, y, z), quat ?? q.setFromEuler(e.set(rx, ry, rz)), sc.set(sx, sy, sz));
    if (parent) m4.premultiply(parent);
    g.applyMatrix4(m4);
    if (colour) {
      c.set(COLOUR[colour]);
      const n = g.attributes.position.count;
      const a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        a[i * 3] = c.r;
        a[i * 3 + 1] = c.g;
        a[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    }
    lists[head ? (finish === 'gloss' ? 'headGloss' : 'headMatte') : finish].push(g);
  }
  return {
    add,
    lists,
    /** What is added from now on belongs to the head (it nods) or to the body. */
    onHead(on) {
      head = on;
    },
  };
}

/** Builds his geometries, in metres, with the top of his head at exactly 1.5 m. `eye`: the eye nearer the student once he faces +x, from the neck. */
export function boyGeometry() {
  const { add, lists, onHead } = bakery();
  const sph = new THREE.SphereGeometry(1, 20, 14);
  const sphS = new THREE.SphereGeometry(1, 10, 7);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const gloss = { finish: 'gloss' };

  // legs, shoes
  const shoe = shoeGeometry();
  const sole = shoeGeometry({ flat: 0.016 });
  for (const s of [-1, 1]) {
    add(
      lathe(
        [
          [0, 0.058],
          [0.1, 0.06],
          [0.38, 0.065],
          [0.48, 0.07],
          [0.68, 0.081],
          [HIP.y - 0.1, 0.08],
          [HIP.y - 0.02, 0.056],
          [HIP.y + 0.02, 0],
        ],
        18,
      ),
      'trousers',
      { x: s * HIP.x, y: 0.075, z: FOOT_Z * 0.45, rx: 0.03, rz: s * 0.015 },
    );
    add(shoe, 'shoe', { x: s * (HIP.x + 0.012), y: 0.016, z: FOOT_Z - 0.09, ...gloss });
    add(sole, 'sole', { x: s * (HIP.x + 0.012), y: 0, z: FOOT_Z - 0.09, ...gloss });
    add(box, 'sole', { x: s * (HIP.x + 0.012), y: 0.02, z: FOOT_Z - 0.052, sx: 0.074, sy: 0.04, sz: 0.078, ...gloss }); // the heel
    // the laces, three short bars over the instep
    for (let k = 0; k < 3; k++)
      add(box, 'button', { x: s * (HIP.x + 0.012), y: 0.098 - k * 0.012, z: FOOT_Z + 0.03 + k * 0.024, rx: 0.5, sx: 0.028, sy: 0.003, sz: 0.005 });
  }
  // hips, belt, the shirt tucked in, the collar
  add(
    lathe([
      [0.74, 0],
      [0.76, 0.1],
      [0.82, 0.16],
      [0.9, 0.164],
      [0.98, 0.15],
      [1.0, 0],
    ]),
    'trousers',
    { sz: 0.7 },
  );
  add(new THREE.TorusGeometry(0.149, 0.016, 6, 30).rotateX(Math.PI / 2), 'belt', { y: 0.978, sz: 0.66, ...gloss });
  add(box, 'buckle', { y: 0.978, z: 0.105, sx: 0.036, sy: 0.03, sz: 0.008, ...gloss });
  add(
    lathe([
      [0.96, 0],
      [0.96, 0.152],
      [1.06, 0.156],
      [1.18, 0.174],
      [1.26, 0.186],
      [1.315, 0.176],
      [1.355, 0.12],
      [1.38, 0.056],
      [1.392, 0],
    ]),
    'shirt',
    { sz: 0.64 },
  );
  // the collar: a band, and two points lying on the chest
  add(new THREE.TorusGeometry(0.056, 0.014, 6, 20).rotateX(Math.PI / 2), 'shirtDark', { y: 1.382, z: 0.012, rx: 0.1, sz: 0.92 });
  for (const s of [-1, 1]) add(box, 'shirtDark', { x: s * 0.03, y: 1.352, z: 0.082, rz: s * 0.5, rx: -0.62, sx: 0.05, sy: 0.05, sz: 0.007 });
  // the placket, buttons and pocket follow the chest
  const chest = curve([
    [1.38, 0.056],
    [1.355, 0.12],
    [1.315, 0.176],
    [1.26, 0.186],
    [1.18, 0.174],
    [1.06, 0.156],
    [0.96, 0.152],
  ]);
  const front = (y, x = 0) => Math.sqrt(Math.max(0, chest(y) ** 2 - x * x)) * 0.64;
  for (let k = 0; k < 8; k++) {
    const y = 1.0 + k * 0.042;
    const tilt = Math.atan2(front(y + 0.02) - front(y - 0.02), 0.04);
    add(box, 'shirtDark', { y, z: front(y) + 0.001, rx: -tilt, sx: 0.022, sy: 0.044, sz: 0.003 });
  }
  for (let k = 0; k < 4; k++) add(sphS, 'button', { y: 1.02 + k * 0.09, z: front(1.02 + k * 0.09) + 0.003, sx: 0.0065, sy: 0.0065, sz: 0.003 });
  add(box, 'shirtDark', { x: 0.08, y: 1.22, z: front(1.22, 0.08) + 0.001, ry: 0.26, rx: -0.05, sx: 0.075, sy: 0.085, sz: 0.004 }); // the pocket
  add(new THREE.CylinderGeometry(0.045, 0.05, 0.13, 16), 'skin', { y: 1.42, z: HEAD_Z * 0.45, rx: 0.2 }); // the neck

  // the head
  onHead(true);
  const skin = new THREE.Color(COLOUR.skin);
  const lips = new THREE.Color(COLOUR.lips);
  const mixed = new THREE.Color();
  const face = headGrid({
    rows: 60,
    cols: 64,
    tint: (x, y, z) => {
      const k = z > 0.03 ? 0.8 * bump(y, -0.0655, 0.0098) * smooth(0.027, 0.02, Math.abs(x)) : 0;
      return mixed.copy(skin).lerp(lips, k);
    },
  });
  add(face, null, { y: HEAD_Y, z: HEAD_Z });
  const P = new THREE.Vector3();
  /** On the face at (x, y): how far forward its skin is. */
  const skinAt = (x, y) => {
    let lo = 0;
    let hi = Math.PI / 2;
    for (let i = 0; i < 24; i++) {
      const a = (lo + hi) / 2;
      if (headPoint(a, y, 0, P).x < x) lo = a;
      else hi = a;
    }
    return headPoint(lo, y, 0, P).z;
  };
  // the eyes: the white, the iris, the upper lid; the brows
  for (const s of [-1, 1]) {
    const z = skinAt(0.03, 0.012);
    add(sphS, 'white', { x: s * 0.031, y: HEAD_Y + 0.012, z: HEAD_Z + z - 0.0035, sx: 0.0125, sy: 0.0075, sz: 0.0095, ...gloss });
    add(sphS, 'iris', { x: s * 0.0335, y: HEAD_Y + 0.012, z: HEAD_Z + z + 0.0035, sx: 0.0052, sy: 0.0052, sz: 0.0035, ...gloss });
    add(box, 'hair', { x: s * 0.032, y: HEAD_Y + 0.0205, z: HEAD_Z + z + 0.0015, rz: -s * 0.05, sx: 0.028, sy: 0.0022, sz: 0.0075, ...gloss }); // the lid's lashes
    add(box, 'hair', {
      x: s * 0.033,
      y: HEAD_Y + 0.033,
      z: HEAD_Z + skinAt(0.033, 0.033) + 0.001,
      rz: -s * 0.08,
      sx: 0.036,
      sy: 0.0062,
      sz: 0.006,
      ...gloss,
    });
  }
  // the ears: the rim, and the darker bowl inside it
  for (const s of [-1, 1]) {
    add(sph, 'skin', { x: s * 0.083, y: HEAD_Y - 0.004, z: HEAD_Z - 0.008, rz: s * 0.14, rx: 0.1, sx: 0.0085, sy: 0.031, sz: 0.019 });
    add(sphS, 'lips', { x: s * 0.0885, y: HEAD_Y - 0.002, z: HEAD_Z - 0.006, rz: s * 0.14, sx: 0.0045, sy: 0.018, sz: 0.0105 });
  }
  // the hair: cut short and neat, the skull's own shape grown out, a little more on top and swept to one side
  const edge = curve([
    [1, 0.06],
    [0.7, 0.057],
    [0.45, 0.042],
    [0.22, 0.002],
    [0.1, -0.006],
    [-0.02, 0.022],
    [-0.2, 0.02],
    [-0.5, -0.045],
    [-1, -0.062],
  ]);
  const hair = headGrid({
    rows: 22,
    cols: 72,
    lowAt: (a) => edge(Math.cos(a)),
    grow: (a, y) => 0.0058 + 0.0052 * smooth(0.02, 0.08, y) + 0.0024 * Math.sin(a * 11) * Math.sin(y * 105 + a * 3) * smooth(-0.04, 0.03, y),
  });
  add(hair, 'hair', { y: HEAD_Y, z: HEAD_Z, ...gloss });
  // the crown of short curls, as in the book's picture
  let c = 0;
  for (const [ring, n] of [
    [0.068, 15],
    [0.05, 12],
    [0.031, 8],
    [0.012, 3],
  ])
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 40;
      c++;
      add(sphS, 'hair', {
        x: Math.cos(a) * ring,
        y: HEAD_Y + 0.088 + 0.014 * (1 - ring / 0.068),
        z: HEAD_Z + Math.sin(a) * ring * 1.15,
        sx: 0.0155 + (c % 3) * 0.0016,
        sy: 0.0125,
        sz: 0.0155,
      });
    }

  onHead(false);
  // the arms: shoulder → upper arm → elbow → forearm → wrist → hand, hanging relaxed; the matrices give each its place
  const M = (x, y, z, rx, rz, parent) => {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, rz)),
      new THREE.Vector3(1, 1, 1),
    );
    return parent ? m.premultiply(parent) : m;
  };
  const addHand = (s, parent) => {
    const at = (g, colour, o = {}) => add(g, colour, { ...o, parent });
    at(pill(0.037, 0.043, 0.098, 10, 3), 'skin', { y: -0.102, sx: 0.36 });
    at(sph, 'skin', { x: -s * 0.006, y: -0.038, z: 0.024, sx: 0.013, sy: 0.033, sz: 0.019, rx: 0.25 });
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
        at(pill(r0, r1, len + r0, 7, 2), 'skin', { x, y, z: f.z, rz: Math.PI - s * a });
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
      at(pill(r, r * 0.86, len + r, 7, 2), 'skin', { x: p.x, y: p.y, z: p.z, quat: qt.setFromUnitVectors(yUp, th).clone() });
      p = p.clone().addScaledVector(th, len);
    }
  };
  const L1 = UPPER - 0.02;
  for (const s of [-1, 1]) {
    const sh = M(s * SHOULDER.x, SHOULDER.y, 0, 0.07, s * 0.075);
    add(sph, 'shirt', { y: -0.012, sx: 0.0575, sy: 0.058, sz: 0.06, parent: sh });
    // the half sleeve, open at its hem
    add(
      lathe(
        [
          [0, 0.039],
          [0.003, 0.05],
          [0.07, 0.0525],
          [UPPER * 0.68, 0.058],
        ],
        16,
      ),
      'shirt',
      { y: -UPPER * 0.7, parent: sh },
    );
    add(pill(0.033, 0.04, UPPER, 12, 3), 'skin', { y: -UPPER, parent: sh });
    add(sphS, 'skin', { y: -L1, sx: 0.0365, sy: 0.0365, sz: 0.0365, parent: sh }); // the elbow
    const el = M(0, -L1, 0, -0.16, 0, sh);
    add(pill(0.028, 0.034, FORE, 12, 3), 'skin', { y: -FORE, parent: el });
    const wr = M(0, -FORE, 0, 0, 0, el);
    addHand(s, wr);
  }

  // one geometry per finish, scaled to exactly 1.5 m
  const out = {};
  for (const name of Object.keys(lists)) {
    out[name] = mergeGeometries(lists[name], false);
    for (const g of lists[name]) g.dispose();
  }
  for (const g of [sph, sphS, box, shoe, sole, face, hair]) g.dispose();
  let top = 0;
  for (const name of Object.keys(out)) {
    out[name].computeBoundingBox();
    top = Math.max(top, out[name].boundingBox.max.y);
  }
  const k = 1.5 / top;
  for (const name of Object.keys(out)) {
    out[name].scale(k, k, k);
    out[name].computeBoundingBox();
    out[name].computeBoundingSphere();
  }
  // the head turns about the top of the neck: its meshes are built round that point
  const neck = new THREE.Vector3(0, NECK.y * k, NECK.z * k);
  for (const name of ['headMatte', 'headGloss']) out[name].translate(0, -neck.y, -neck.z);
  const eye = new THREE.Vector3(-0.0335 * k, (HEAD_Y + 0.012) * k - neck.y, (HEAD_Z + skinAt(0.03, 0.012)) * k - neck.z);
  return { geometry: out, scale: k, neck, eye };
}
