// The book's red flower: a hibiscus (জবা) growing in a clay pot, with the flower that the light leaves from, a second one
// behind it and a bud, on a woody stem with toothed leaves. All generated here, one mesh with colours in the vertices (one
// draw call), no image files. Centimetres; `createPlant` places the first flower's heart exactly on the point it is given.
import * as THREE from 'three';

const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const rgb = (hex) => new THREE.Color(hex);
const PETAL = { heart: rgb('#5d0413'), throat: rgb('#a30b1f'), red: rgb('#df1a2e'), lip: rgb('#f2384a'), vein: rgb('#b30f24') };
const LEAF = { dark: rgb('#1d5a2c'), mid: rgb('#2f7d3b'), vein: rgb('#6fae62') };
const STEM = { bark: rgb('#6b4a32'), green: rgb('#4c7a3a') };
const COL = { column: rgb('#f0475a'), anther: rgb('#f7c631'), stigma: rgb('#c80f2a'), sepal: rgb('#3f7f3d') };
const mixed = new THREE.Color();

/** A small repeatable random stream: the plant is the same in every run. */
function stream(seed) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

/** Vertices collected into one geometry. */
class Sheet {
  constructor() {
    this.p = [];
    this.c = [];
    this.i = [];
  }
  /** nu × nv cells; at(u, v, out) in 0…1 fills out = { x, y, z, c: THREE.Color }. */
  grid(nu, nv, at) {
    const base = this.p.length / 3;
    const o = { x: 0, y: 0, z: 0, c: mixed };
    for (let j = 0; j <= nv; j++)
      for (let i = 0; i <= nu; i++) {
        at(i / nu, j / nv, o);
        this.p.push(o.x, o.y, o.z);
        this.c.push(o.c.r, o.c.g, o.c.b);
      }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = base + j * (nu + 1) + i;
        this.i.push(a, a + 1, a + nu + 1, a + 1, a + nu + 2, a + nu + 1);
      }
  }
  /** A round tube along a list of points, radius r(k), colour c(k), k = 0…1. */
  tube(path, r, c, sides = 7) {
    const n = path.length - 1;
    const t = new THREE.Vector3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const up = new THREE.Vector3(0, 0, 1);
    this.grid(sides, n, (u, v, o) => {
      const j = Math.round(v * n);
      const p = path[j];
      t.subVectors(path[Math.min(n, j + 1)], path[Math.max(0, j - 1)]).normalize();
      a.crossVectors(t, Math.abs(t.z) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize();
      b.crossVectors(t, a);
      const w = u * Math.PI * 2;
      const R = r(v);
      o.x = p.x + (a.x * Math.cos(w) + b.x * Math.sin(w)) * R;
      o.y = p.y + (a.y * Math.cos(w) + b.y * Math.sin(w)) * R;
      o.z = p.z + (a.z * Math.cos(w) + b.z * Math.sin(w)) * R;
      o.c = c(v);
    });
  }
  /** Takes a finished geometry in, moved by matrix m, in one colour. */
  add(geometry, m, colour) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const base = this.p.length / 3;
    const v = new THREE.Vector3();
    const pos = g.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k).applyMatrix4(m);
      this.p.push(v.x, v.y, v.z);
      this.c.push(colour.r, colour.g, colour.b);
      this.i.push(base + k);
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i);
    g.computeVertexNormals();
    return g;
  }
}

/**
 * One hibiscus flower of radius R, its heart at the origin, opening along +Y: five broad petals, overlapping like a
 * pinwheel, joined in a funnel and rolling back at the lip, with ruffled edges and fine veins; the long red column with its
 * golden anthers and five stigma pads; the green calyx behind.
 */
function bloom(s, R, m, seed) {
  const rnd = stream(seed);
  const O = new THREE.Vector3();
  const put = (o, x, y, z) => {
    O.set(x, y, z).applyMatrix4(m);
    o.x = O.x;
    o.y = O.y;
    o.z = O.z;
  };
  for (let n = 0; n < 5; n++) {
    const a0 = (n / 5) * Math.PI * 2 + 0.15;
    const twist = 0.2 + rnd() * 0.04;
    const ph = rnd() * 6;
    s.grid(18, 13, (u, v, o) => {
      // u: from the throat to the lip; v: across the petal
      const k = v * 2 - 1;
      const reach = 0.2 + u * 0.8;
      // the outline: narrow at the throat, widest beyond the middle, round at the lip
      const halfWide = (0.1 + 0.98 * Math.sin(Math.min(1, u * 1.04) ** 0.7 * Math.PI * 0.62)) * (1 - 0.24 * u ** 6);
      const lipCut = Math.sqrt(Math.max(0, 1 - k * k * 0.72));
      const r = R * reach * lerp(0.82, 1, lipCut);
      const a = a0 + (k * halfWide * 0.67) / Math.max(0.42, reach) + twist * u;
      // the funnel, the flat, the roll back at the lip, the ruffles
      const y =
        R * (-0.5 + 0.86 * smooth(0, 0.46, u) - 0.05 * u - 0.34 * smooth(0.62, 1, u) ** 2) +
        R * 0.1 * Math.sin(k * 5.4 + ph) * u ** 2.2 +
        R * 0.05 * Math.sin(k * 13 + ph * 2) * smooth(0.72, 1, u) -
        R * 0.11 * k * k * u;
      put(o, r * Math.cos(a), y, r * Math.sin(a));
      const c = mixed
        .copy(PETAL.heart)
        .lerp(PETAL.throat, smooth(0.02, 0.2, u))
        .lerp(PETAL.red, smooth(0.16, 0.42, u))
        .lerp(PETAL.lip, smooth(0.8, 1, u) * 0.75);
      c.lerp(PETAL.vein, 0.5 * smooth(0.62, 1, Math.cos(k * 15)) * (1 - u * 0.6) + 0.26 * smooth(0.82, 1, 1 - Math.abs(k * 2.4)));
      o.c = c;
    });
  }
  // the column
  const path = [];
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    path.push(new THREE.Vector3(R * 0.1 * k * k, R * (-0.42 + 1.62 * k), R * 0.06 * k).applyMatrix4(m));
  }
  s.tube(
    path,
    (k) => R * lerp(0.05, 0.022, k),
    () => COL.column,
  );
  // the anthers round its upper part, and the five stigma pads at its tip
  const ball = new THREE.IcosahedronGeometry(1, 0);
  const M = new THREE.Matrix4();
  for (let i = 0; i < 26; i++) {
    const k = 0.5 + 0.42 * rnd();
    const a = rnd() * Math.PI * 2;
    const w = R * (0.09 + 0.09 * rnd());
    M.makeScale(R * 0.03, R * 0.03, R * 0.03).setPosition(R * 0.1 * k * k + Math.cos(a) * w, R * (-0.42 + 1.62 * k), R * 0.06 * k + Math.sin(a) * w);
    s.add(ball, M.clone().premultiply(m), COL.anther);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    M.makeScale(R * 0.05, R * 0.035, R * 0.05).setPosition(R * 0.1 + Math.cos(a) * R * 0.1, R * 1.22, R * 0.06 + Math.sin(a) * R * 0.1);
    s.add(ball, M.clone().premultiply(m), COL.stigma);
  }
  // the calyx: five pointed sepals round the back of the funnel
  for (let n = 0; n < 5; n++) {
    const a0 = (n / 5) * Math.PI * 2;
    s.grid(4, 6, (u, v, o) => {
      const w = (v * 2 - 1) * (1 - u) * 0.34;
      const r = R * (0.1 + 0.26 * u);
      put(o, r * Math.cos(a0 + w), R * (-0.66 + 0.46 * u), r * Math.sin(a0 + w));
      o.c = COL.sepal;
    });
  }
  ball.dispose();
}

/** A toothed leaf of length L, from its stalk at `from` along `dir`, with a soft fold along the midrib and a drooping tip. */
function leaf(s, L, from, dir, side, droop) {
  const d = dir.clone().normalize();
  const w = new THREE.Vector3().crossVectors(d, side).normalize();
  const n = new THREE.Vector3().crossVectors(w, d).normalize();
  s.grid(20, 8, (u, v, o) => {
    const k = v * 2 - 1;
    const wide = 0.36 * L * Math.sin(Math.PI * u ** 0.75) ** 0.8;
    const tooth = 1 - 0.1 * (0.5 + 0.5 * Math.sin(u * 62)) * Math.abs(k);
    const x = k * wide * tooth;
    const along = u * L;
    const lift = Math.abs(k) * wide * 0.32 - droop * L * u * u;
    o.x = from.x + d.x * along + w.x * x + n.x * lift;
    o.y = from.y + d.y * along + w.y * x + n.y * lift;
    o.z = from.z + d.z * along + w.z * x + n.z * lift;
    const c = mixed.copy(LEAF.dark).lerp(LEAF.mid, 0.4 + 0.3 * Math.abs(k));
    c.lerp(
      LEAF.vein,
      0.8 * smooth(0.86, 1, 1 - Math.abs(k) * 6) +
        0.42 * smooth(0.72, 1, Math.cos((u * 7 - Math.abs(k) * 1.7) * Math.PI * 2)) * (1 - Math.abs(k) ** 3),
    );
    o.c = c;
  });
}

const curve = (points, n) => new THREE.CatmullRomCurve3(points).getPoints(n);

/** The stem of the plant, the flowers and the leaves, one geometry. `heart`: where the first flower's heart must be. */
function plantGeometry(heart, potTop) {
  const s = new Sheet();
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const H = heart;
  // where the first flower opens toward: the glass and the boy, and a little toward the student
  const face = v(-0.56, 0.1, 0.82).normalize();
  const orient = (at, dir, roll = 0) => {
    const q = new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), dir.clone().normalize());
    q.multiply(new THREE.Quaternion().setFromAxisAngle(v(0, 1, 0), roll));
    return new THREE.Matrix4().compose(at, q, v(1, 1, 1));
  };
  const R = 6.2;
  // the main stem, up from the pot and over to the flower, from behind it
  const base = v(potTop.x, potTop.y - 0.3, potTop.z);
  const fork = v(lerp(base.x, H.x, 0.42) + 4, lerp(base.y, H.y, 0.62), -2.6);
  const back = H.clone().addScaledVector(face, -R * 1.28);
  const main = curve([base, v(base.x - 0.5, lerp(base.y, fork.y, 0.5), -1.2), fork, v(back.x + 3.4, back.y - 3, back.z - 1), back], 14);
  const barked = (k) => mixed.copy(STEM.bark).lerp(STEM.green, smooth(0.45, 0.9, k));
  s.tube(main, (k) => lerp(0.52, 0.2, k), barked);
  bloom(s, R, orient(H.clone(), face, 0.4), 11);

  // the second flower, up and behind on its own branch, and a bud
  const H2 = v(H.x + 9.5, H.y + 6.8, -6.5);
  const face2 = v(-0.5, 0.42, 0.76).normalize();
  const back2 = H2.clone().addScaledVector(face2, -4.6 * 1.28);
  s.tube(curve([fork, v(fork.x + 2, fork.y + 7, -4), back2], 8), (k) => lerp(0.32, 0.15, k), barked);
  bloom(s, 4.6, orient(H2, face2, 1.1), 37);
  const tip = v(H.x + 14, H.y - 8.5, 3.5);
  s.tube(curve([v(fork.x, fork.y + 1, -2.4), v(fork.x + 4, fork.y + 1.6, 1), tip], 6), (k) => lerp(0.24, 0.12, k), barked);
  const bud = new THREE.SphereGeometry(1, 10, 8);
  const M = new THREE.Matrix4().compose(
    tip.clone().add(v(0.5, 1.4, 0.3)),
    new THREE.Quaternion().setFromAxisAngle(v(0, 0, 1), -0.3),
    v(0.95, 2, 0.95),
  );
  s.add(bud, M, PETAL.throat);
  const M2 = new THREE.Matrix4().compose(tip.clone().add(v(0.2, 0.3, 0.1)), new THREE.Quaternion(), v(1.1, 1, 1.1));
  s.add(bud, M2, COL.sepal);
  bud.dispose();

  // the leaves, placed along the stems by hand: none in front of the flower's face or on the ray
  const leaves = [
    [0.3, 9, v(0.9, 0.5, 0.5), 0.3],
    [0.42, 10, v(0.7, 0.3, 0.8), 0.32],
    [0.48, 8.5, v(1, 0.1, -0.5), 0.25],
    [0.56, 11, v(0.5, 0.15, 0.9), 0.3],
    [0.62, 10, v(0.9, 0.5, -0.4), 0.26],
    [0.68, 9.5, v(0.75, -0.25, 0.75), 0.34],
    [0.72, 12, v(0.3, -0.45, 0.85), 0.3],
    [0.8, 10.5, v(0.95, 0.25, 0.3), 0.3],
    [0.86, 9, v(0.7, 0.7, -0.5), 0.25],
  ];
  for (const [k, L, dir, droop] of leaves) {
    const p = main[Math.round(k * (main.length - 1))];
    const stalk = p.clone().addScaledVector(dir.clone().normalize(), 1.3);
    s.tube(
      [p, stalk],
      () => 0.09,
      () => STEM.green,
      5,
    );
    leaf(s, L, stalk, dir, v(0.2, 1, 0.1), droop);
  }
  return s.build();
}

/** The clay pot, with its rim, on the bench, and the soil in it. */
function potGeometry(r, h) {
  const v2 = (x, y) => new THREE.Vector2(x, y);
  const clay = new THREE.LatheGeometry(
    [
      v2(0, 0),
      v2(r * 0.66, 0),
      v2(r * 0.7, 0.2),
      v2(r * 0.92, h * 0.8),
      v2(r * 0.93, h * 0.8),
      v2(r * 1.02, h * 0.82),
      v2(r * 1.03, h),
      v2(r * 0.96, h),
      v2(r * 0.9, h * 0.93),
    ],
    36,
  );
  const soil = new THREE.CircleGeometry(r * 0.9, 28);
  soil.rotateX(-Math.PI / 2);
  soil.translate(0, h * 0.92, 0);
  return { clay, soil };
}

export const POT = { x: 36, z: -3, r: 8.5, h: 13 };

/** The plant, on the bench at y = 0. heart: the point the light leaves from, on the first flower. */
export function createPlant(heart) {
  const root = new THREE.Group();
  root.name = 'hibiscus';
  const petal = new THREE.MeshStandardMaterial({
    name: 'hibiscus',
    vertexColors: true,
    roughness: 0.58,
    side: THREE.DoubleSide,
    envMapIntensity: 0.55,
  });
  const plant = new THREE.Mesh(plantGeometry(heart, new THREE.Vector3(POT.x, POT.h * 0.9, POT.z)), petal);
  plant.castShadow = true;
  const { clay, soil } = potGeometry(POT.r, POT.h);
  const pot = new THREE.Mesh(clay, new THREE.MeshStandardMaterial({ name: 'clay', color: 0xa85a36, roughness: 0.82, side: THREE.DoubleSide }));
  pot.position.set(POT.x, 0, POT.z);
  pot.castShadow = true;
  const dirt = new THREE.Mesh(soil, new THREE.MeshStandardMaterial({ name: 'soil', color: 0x33241a, roughness: 1 }));
  dirt.position.copy(pot.position);
  root.add(plant, pot, dirt);
  return root;
}
