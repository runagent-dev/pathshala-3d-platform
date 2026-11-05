// The book's rose, modelled from the way a real one grows: petals in a spiral at the golden angle, each cupped like a real
// petal and curling out at the lip, small and tight in the heart, wide and open outside; five sepals, a stem with thorns, and
// serrated leaflets with veins. Everything is generated here, merged into a few meshes (one draw call each), with no image
// files. The surfaces' colours come from REFLECTANCE in reading.js, so the 3D view multiplies light by those numbers.
import * as THREE from 'three';
import { REFLECTANCE } from './reading.js';

const GOLDEN = (137.508 * Math.PI) / 180;
const S = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, k) => a + (b - a) * k;

/** A small repeatable random stream: the rose is the same in every run, whatever the page's Math.random does. */
function stream(seed) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

/** Grids of vertices collected into one geometry. */
class Sheets {
  constructor() {
    this.p = [];
    this.c = [];
    this.uv = [];
    this.i = [];
  }
  /** nu × nv cells; at(i, j, out) fills out = { x, y, z, r, g, b, u, v }. */
  grid(nu, nv, at, flip = false) {
    const base = this.p.length / 3;
    const o = { x: 0, y: 0, z: 0, r: 1, g: 1, b: 1, u: 0, v: 0 };
    for (let j = 0; j <= nv; j++)
      for (let i = 0; i <= nu; i++) {
        at(i, j, o);
        this.p.push(o.x, o.y, o.z);
        this.c.push(o.r, o.g, o.b);
        this.uv.push(o.u, o.v);
      }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = base + j * (nu + 1) + i;
        const b = a + 1;
        const c = a + nu + 1;
        const d = c + 1;
        if (flip) this.i.push(a, c, b, b, c, d);
        else this.i.push(a, b, c, b, d, c);
      }
  }
  /** Takes a finished geometry in, moved by matrix m, in one colour. */
  add(geometry, m, [r, g, b]) {
    const base = this.p.length / 3;
    const p = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const v = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k).applyMatrix4(m);
      this.p.push(v.x, v.y, v.z);
      this.c.push(r, g, b);
      this.uv.push(uv ? uv.getX(k) : 0, uv ? uv.getY(k) : 0);
    }
    const idx = geometry.index;
    if (idx) for (let k = 0; k < idx.count; k++) this.i.push(base + idx.getX(k));
    else for (let k = 0; k < p.count; k++) this.i.push(base + k);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.i);
    g.computeVertexNormals();
    return g;
  }
}

// ── petals ───────────────────────────────────────────────────────────────────────────────────────────────────
const PETALS = 34;

/** The petal's half width along its length (0 at the claw, widest past the middle, round at the top). */
function outline(v) {
  if (v < 0.62) return 0.16 + 0.84 * S(0, 0.62, v);
  const x = (v - 0.62) / 0.38;
  return Math.max(0, 1 - x * x) ** 0.62;
}

function addPetal(sheets, p, rose) {
  const NU = 16;
  const NV = 18;
  const row = (j) => 1 - (1 - j / NV) ** 1.45; // more rows near the lip, where the shape turns
  // each column of the petal is walked from the claw up: the tangent turns as it goes, so the shape is a real curve
  const col = new Float32Array((NV + 1) * 2);
  let last = -1;
  const walk = (u) => {
    let r = p.r0;
    let y = p.y0;
    const au = Math.abs(u);
    for (let j = 0; j <= NV; j++) {
      const v = row(j);
      col[j * 2] = r;
      col[j * 2 + 1] = y;
      const ds = (row(j + 1) - v) * p.length;
      const rise = S(0, 0.32, v);
      const lip = S(0.56, 1, v);
      // cupped: out from the claw, up the side, in at the shoulder; then the lip rolls back, the edges most of all
      const a = mix(p.a0, p.a1, rise) + p.lip * lip * lip + p.roll * au * au * au * S(0.34, 1, v) + p.bend * u * lip;
      r += Math.sin(a) * ds;
      y += Math.cos(a) * ds;
    }
  };
  sheets.grid(
    NU,
    NV,
    (i, j, o) => {
      const u = -1 + (2 * i) / NU;
      if (i !== last) {
        walk(u);
        last = i;
      }
      const v = row(j);
      let r = col[j * 2] + p.tuck * u * S(0, 0.7, v);
      const y = col[j * 2 + 1] + p.wave * Math.sin(u * 4.3 + p.phase) * S(0.55, 1, v) * (0.4 + Math.abs(u));
      r += p.wave * 0.7 * Math.sin(u * 7.1 + p.phase * 2) * S(0.6, 1, v);
      const half = (p.width * outline(v)) / Math.max(0.42, Math.abs(r));
      const a = p.theta + u * p.wrap * Math.tanh(half / p.wrap); // wide petals wrap round, never past their limit
      o.x = Math.max(r, 0.02) * Math.cos(a);
      o.y = y;
      o.z = Math.max(r, 0.02) * Math.sin(a);
      // deep in the throat a petal is dark; toward the lip it is at full colour. The heart stays deeper: light rarely gets there
      const throat = mix(0.12, 1, S(0.1, 0.72, v));
      const depth = mix(0.4, 1, S(0.02, 0.6, p.k));
      const edge = 1 - 0.26 * (1 - Math.abs(u) ** 2) * (1 - S(0.5, 1, v)); // the middle of a petal lies deeper than its edges
      const k = throat * depth * edge * p.tone;
      o.r = rose[0] * Math.min(1.05, k);
      o.g = rose[1] * k;
      o.b = rose[2] * k;
      o.u = u * 0.5 + 0.5;
      o.v = v;
    },
    true,
  );
  last = -1;
}

function bloomGeometry() {
  const rnd = stream(84);
  const sheets = new Sheets();
  for (let n = 0; n < PETALS; n++) {
    const k = n / (PETALS - 1);
    const kk = k ** 0.8;
    addPetal(
      sheets,
      {
        k,
        theta: n * GOLDEN + (rnd() - 0.5) * 0.22,
        length: mix(3.1, 8.6, kk) * (0.96 + rnd() * 0.08),
        width: mix(1.5, 5.1, kk ** 1.15) * (0.94 + rnd() * 0.12),
        r0: mix(0.1, 1.35, kk),
        y0: mix(1.5, -0.55, k ** 0.7),
        a0: mix(0.75, 1.5, kk),
        a1: mix(-0.1, 0.78, k ** 1.5) + (rnd() - 0.5) * 0.08,
        lip: mix(0.6, 1.6, k) * (0.9 + rnd() * 0.25),
        roll: mix(0.25, 1.15, k),
        bend: (rnd() - 0.5) * 0.5,
        wrap: mix(2.1, 1.05, kk),
        tuck: mix(0.28, 0.5, k) * (rnd() < 0.5 ? 1 : 0.7),
        wave: mix(0.03, 0.22, k) * (0.6 + rnd() * 0.8),
        phase: rnd() * 6.28,
        tone: 0.88 + rnd() * 0.17,
      },
      REFLECTANCE.rose,
    );
  }
  const g = sheets.geometry();
  bakeOcclusion(g);
  return g;
}

/**
 * Soft shade where petals crowd each other. The vertices are counted into a coarse grid; from each one a few short rays go
 * out on its open side and add up how crowded the way is. It runs once, and takes only brightness from the colours,
 * so the reflectance ratios (and with them the black in green light) stay exact.
 */
function bakeOcclusion(g) {
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const col = g.attributes.color;
  g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  const N = 28;
  const size = new THREE.Vector3().subVectors(max, min);
  const cell = Math.max(size.x, size.y, size.z) / N;
  const grid = new Uint16Array(N * N * N);
  const at = (x, y, z) => {
    const i = Math.floor((x - min.x) / cell);
    const j = Math.floor((y - min.y) / cell);
    const k = Math.floor((z - min.z) / cell);
    return i < 0 || j < 0 || k < 0 || i >= N || j >= N || k >= N ? -1 : i + N * (j + N * k);
  };
  for (let v = 0; v < pos.count; v++) {
    const c = at(pos.getX(v), pos.getY(v), pos.getZ(v));
    if (c >= 0) grid[c]++;
  }
  const rays = [
    [0, 1, 0],
    [0.7, 0.7, 0],
    [-0.7, 0.7, 0],
    [0, 0.7, 0.7],
    [0, 0.7, -0.7],
  ];
  const axis = new THREE.Vector3();
  for (let v = 0; v < pos.count; v++) {
    const x = pos.getX(v);
    const y = pos.getY(v);
    const z = pos.getZ(v);
    // the open side: away from the heart and upward, whichever way the normal happens to point
    let nx = nor.getX(v);
    let ny = nor.getY(v);
    let nz = nor.getZ(v);
    axis.set(x, 1.5, z).normalize();
    if (nx * axis.x + ny * axis.y + nz * axis.z < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    let crowd = 0;
    for (const [dx, dy, dz] of rays) {
      const rx = nx + dx * 0.9;
      const ry = ny + dy * 0.9;
      const rz = nz + dz * 0.9;
      const l = Math.hypot(rx, ry, rz) || 1;
      for (let step = 1; step <= 4; step++) {
        const d = (step + 0.6) * cell;
        const c = at(x + (rx / l) * d, y + (ry / l) * d, z + (rz / l) * d);
        if (c >= 0) crowd += grid[c] / (step * 0.8 + 0.6);
      }
    }
    const light = Math.max(0.1, Math.exp(-crowd * 0.034));
    col.setXYZ(v, col.getX(v) * light, col.getY(v) * light, col.getZ(v) * light);
  }
}

/** Fine lines down a petal: a multiplier near white, so colour stays exactly the reflectance. */
function petalTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 256, 256);
  const rnd = stream(5);
  g.lineCap = 'round';
  for (let i = 0; i < 44; i++) {
    const x = (i + rnd() * 0.8) * (256 / 44);
    const fan = (x - 128) * 0.28;
    g.strokeStyle = `rgba(120,120,120,${0.04 + rnd() * 0.07})`;
    g.lineWidth = 1 + rnd() * 2.4;
    g.beginPath();
    g.moveTo(128 + (x - 128) * 0.5, 256);
    g.quadraticCurveTo(x, 140, x + fan, 0);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 2;
  return t;
}

// ── leaves ───────────────────────────────────────────────────────────────────────────────────────────────────
const TEETH = 17;
/** Rows of a leaf: three to a tooth, so that every tooth has a sharp point. */
const LEAF_ROWS = (() => {
  const rows = [];
  for (let t = 0; t < TEETH; t++) rows.push(t / TEETH, (t + 0.45) / TEETH, (t + 0.8) / TEETH);
  rows.push(1);
  return rows;
})();

function leafOutline(v) {
  // ovate: widest a third of the way, drawn out to a point
  return Math.sin(Math.PI * v ** 0.72) ** 0.74;
}

/** One leaflet, built along +Y with its face toward +Z, base at the origin. */
function addLeaflet(sheets, l, m) {
  const NU = 8;
  const NV = LEAF_ROWS.length - 1;
  const rnd = stream(l.seed);
  const a = rnd() * 6.28;
  const v3 = new THREE.Vector3();
  sheets.grid(NU, NV, (i, j, o) => {
    const u = -1 + (2 * i) / NU;
    const v = LEAF_ROWS[j];
    const fr = v * TEETH - Math.floor(v * TEETH + 1e-6);
    // the tooth: it leans forward, a sharp point at 0.8 of its length
    const tooth = fr < 0.8 ? fr / 0.8 : 1 - (fr - 0.8) / 0.2;
    const edge = leafOutline(v) * (1 + 0.075 * tooth * S(0, 0.16, v) * (1 - S(0.94, 1, v)));
    const w = l.half * edge;
    const x = u * w;
    const y = l.length * v + 0.09 * l.half * tooth * Math.abs(u) ** 3 * (1 - S(0.92, 1, v));
    const au = Math.abs(u);
    // folded along the midrib, arched along its length, a soft quilt between the side veins, a loose edge
    let z = l.fold * au * w - l.arch * (2 * v - 1) ** 2 + l.arch;
    z += 0.05 * au * (1 - au) * 4 * Math.sin(v * 44 + (u > 0 ? 0 : 1.2)) * 0.6;
    z += l.flutter * au ** 2 * Math.sin(v * 9 + a + (u > 0 ? 0 : 2));
    v3.set(x + l.sway * (v * v) * l.length, y, z).applyMatrix4(m);
    o.x = v3.x;
    o.y = v3.y;
    o.z = v3.z;
    o.r = o.g = o.b = l.tone;
    o.u = u * 0.5 + 0.5;
    o.v = v;
  });
}

/** Veins and mottling. The red channel stays almost empty: this leaf has nothing to give back to a red lamp. */
function leafTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const rnd = stream(11);
  const [, lg] = REFLECTANCE.leaf;
  const green = (k) => {
    const l = Math.round(255 * (lg * k) ** (1 / 2.2));
    const r = Math.round(255 * (0.0045 * k) ** (1 / 2.2));
    const b = Math.round(255 * (0.018 * k) ** (1 / 2.2));
    return `rgb(${r},${l},${b})`;
  };
  g.fillStyle = green(1);
  g.fillRect(0, 0, 512, 512);
  // blotches of deeper and paler green
  for (let i = 0; i < 160; i++) {
    g.fillStyle = green(0.72 + rnd() * 0.5);
    g.globalAlpha = 0.14;
    g.beginPath();
    g.ellipse(rnd() * 512, rnd() * 512, 12 + rnd() * 40, 8 + rnd() * 26, rnd() * 3, 0, 6.3);
    g.fill();
  }
  g.globalAlpha = 1;
  // darker along the veins' valleys, the veins themselves pale
  const cx = 256;
  const vein = (x0, y0, side, up, w, col) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo(x0 + side * 120, y0 - up * 0.42, x0 + side * 236, y0 - up);
    g.stroke();
  };
  g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const y = 470 - i * 50;
    const up = 104 - i * 3;
    for (const side of [-1, 1]) {
      vein(cx, y, side, up, 13, green(0.62));
      vein(cx, y, side, up, 3.2, green(1.75));
      // the fine net between the veins
      for (let n = 0; n < 7; n++) {
        const k = 0.14 + n * 0.12;
        g.strokeStyle = green(1.35);
        g.lineWidth = 1;
        g.beginPath();
        const x = cx + side * 236 * k;
        const yy = y - up * k * (0.42 + 0.58 * k);
        g.moveTo(x, yy);
        g.lineTo(x + side * (6 + rnd() * 12), yy - 42 - rnd() * 8);
        g.stroke();
      }
    }
  }
  g.strokeStyle = green(0.6);
  g.lineWidth = 15;
  g.beginPath();
  g.moveTo(cx, 512);
  g.lineTo(cx, 0);
  g.stroke();
  g.strokeStyle = green(1.9);
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(cx, 512);
  g.lineTo(cx, 0);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 2;
  return t;
}

/** A frame at `at`, with +Y along `along` and +Z as near as can be to `face`. */
function frame(at, along, face) {
  const y = along.clone().normalize();
  const x = new THREE.Vector3().crossVectors(y, face).normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  return new THREE.Matrix4().makeBasis(x, y, z).setPosition(at);
}

function tube(sheets, points, radius, color, segments = 18, radial = 7) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(curve, segments, radius, radial, false);
  const p = g.attributes.position;
  // a little thinner toward the tip
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const t = Math.floor(i / (radial + 1)) / segments;
    curve.getPointAt(t, n);
    v.fromBufferAttribute(p, i)
      .sub(n)
      .multiplyScalar(1 - 0.28 * t)
      .add(n);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  sheets.add(g, new THREE.Matrix4(), color);
  g.dispose();
  return curve;
}

export function createRose({ layout }) {
  const root = new THREE.Group();
  root.name = 'rose';
  const { bloomAt, bloomTilt, stem, sprays } = layout;

  // ── the bloom ───────────────────────────────────────────────────────────────────────────────────────────
  const petalMap = petalTexture();
  const petals = new THREE.MeshPhysicalMaterial({
    name: 'petal',
    vertexColors: true,
    map: petalMap,
    roughness: 0.5,
    metalness: 0,
    side: THREE.DoubleSide,
    sheen: 1,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(REFLECTANCE.rose[0], 0.004, 0.008),
    specularIntensity: 0.5,
    specularColor: new THREE.Color(1, 0.16, 0.18), // a soft sheen in the petal's own colour, so that green light finds nothing here
  });
  const bloom = new THREE.Mesh(bloomGeometry(), petals);
  bloom.name = 'bloom';
  bloom.position.copy(bloomAt);
  bloom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bloomTilt.clone().normalize());
  bloom.castShadow = true; // on the leaves; among its own thin petals the shading is in the vertex colours
  root.add(bloom);

  // ── stem, sepals, thorns (one mesh) ─────────────────────────────────────────────────────────────────────
  const G = REFLECTANCE.leaf;
  const stemGreen = [G[0] * 0.8, G[1] * 0.62, G[2] * 0.6];
  const paleGreen = [G[0], G[1] * 0.85, G[2]];
  const wood = new Sheets();
  const curve = tube(wood, stem, 0.27, stemGreen, 34, 8);
  // the hip under the bloom
  const hip = new THREE.LatheGeometry(
    [
      [0.02, -0.75],
      [0.34, -0.72],
      [0.72, -0.35],
      [0.95, 0.15],
      [0.9, 0.55],
      [0.5, 0.8],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    14,
  );
  wood.add(hip, bloom.matrix.clone().compose(bloomAt, bloom.quaternion, new THREE.Vector3(1, 1, 1)), paleGreen);
  hip.dispose();
  // five sepals, turned down from under the bloom
  const rnd = stream(9);
  const q = new THREE.Matrix4().compose(bloomAt, bloom.quaternion, new THREE.Vector3(1, 1, 1));
  const v3 = new THREE.Vector3();
  for (let n = 0; n < 5; n++) {
    const th = (n / 5) * Math.PI * 2 + 0.4;
    const length = 3.7 + rnd() * 0.5;
    wood.grid(
      5,
      12,
      (i, j, o) => {
        const u = -1 + (2 * i) / 5;
        const v = j / 12;
        const a = 2.0 + 0.95 * v * v;
        const r = 0.82 + length * v * Math.sin(a) * 0.82;
        const y = 0.35 + length * v * Math.cos(a) * 0.82;
        const half = (0.62 * Math.sin(Math.PI * Math.min(1, v * 0.86 + 0.14)) ** 0.8 * (1 - v * 0.55)) / Math.max(0.5, r);
        const t = th + u * half;
        v3.set(r * Math.cos(t), y, r * Math.sin(t)).applyMatrix4(q);
        o.x = v3.x;
        o.y = v3.y;
        o.z = v3.z;
        o.r = paleGreen[0];
        o.g = paleGreen[1] * (0.85 + 0.15 * v);
        o.b = paleGreen[2];
        o.u = 0;
        o.v = 0;
      },
      true,
    );
  }
  // thorns: curved down the stem
  const up = new THREE.Vector3(0, 1, 0);
  for (const [t, side] of [
    [0.1, 0.4],
    [0.2, 3.2],
    [0.32, 1.7],
    [0.44, 4.6],
    [0.56, 0.9],
    [0.68, 2.6],
    [0.8, 5.4],
    [0.9, 3.9],
  ]) {
    const p = curve.getPointAt(t);
    const out = new THREE.Vector3(Math.cos(side), 0.0, Math.sin(side));
    const dir = out.clone().multiplyScalar(0.95).addScaledVector(up, -0.42).normalize();
    wood.grid(5, 4, (i, j, o) => {
      const a = (i / 5) * Math.PI * 2;
      const v = j / 4;
      const r = 0.2 * (1 - v) ** 1.2;
      const along = v * 0.72;
      const c = p
        .clone()
        .addScaledVector(dir, along)
        .addScaledVector(up, -0.28 * v * v);
      const side2 = new THREE.Vector3().crossVectors(dir, up).normalize();
      c.addScaledVector(side2, r * Math.cos(a)).addScaledVector(up, r * Math.sin(a));
      o.x = c.x;
      o.y = c.y;
      o.z = c.z;
      o.r = stemGreen[0] * 0.9;
      o.g = stemGreen[1] * 0.75;
      o.b = stemGreen[2];
      o.u = 0;
      o.v = 0;
    });
  }

  // ── the leaves ──────────────────────────────────────────────────────────────────────────────────────────
  const leaves = new Sheets();
  for (const spray of sprays) {
    const c = tube(wood, spray.stalk, 0.1, stemGreen, 12, 5);
    for (const l of spray.leaflets) {
      const at = c.getPointAt(l.at);
      const m = frame(at, l.along, l.face);
      addLeaflet(leaves, l, m);
    }
  }
  const stemMat = new THREE.MeshStandardMaterial({ name: 'stem', vertexColors: true, roughness: 0.62, side: THREE.DoubleSide, envMapIntensity: 0 });
  const stems = new THREE.Mesh(wood.geometry(), stemMat);
  stems.name = 'stem';
  stems.castShadow = true;
  stems.receiveShadow = true;
  root.add(stems);
  const leafMap = leafTexture();
  const leafMat = new THREE.MeshPhysicalMaterial({
    name: 'leaf',
    vertexColors: true,
    map: leafMap,
    roughness: 0.5,
    side: THREE.DoubleSide,
    specularIntensity: 0.22,
  });
  const leafMesh = new THREE.Mesh(leaves.geometry(), leafMat);
  leafMesh.name = 'leaves';
  leafMesh.castShadow = true;
  leafMesh.receiveShadow = true;
  root.add(leafMesh);

  return { root, bloom, leaves: leafMesh, stems };
}
