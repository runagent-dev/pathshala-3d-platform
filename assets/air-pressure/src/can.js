// The tin box (a cube 10 cm on a side, like the book's চিত্র ৫.০৭), the hose and the hand vacuum pump, in metres.
// The box is one modest mesh (a rounded cube, 22 × 22 quads a face) with three precomputed morph targets that the
// GPU blends: a first dent, the real crush from every side (the book's (c)) and the wrong flattening from the top
// only (the book's (b)). Nothing is rebuilt per frame except the short hose while the box changes shape. The same
// displacement can be worked out on the CPU for a few points (where the arrows touch the faces, where the hose
// enters), so they follow the box as it crumples.
import * as THREE from 'three';
import { SIDE } from './reading.js';

const H = SIDE / 2;
const R = 0.0055; // the rounded edges
const S = 22; // quads along a face

// ── noise (deterministic, so every run crumples the same way) ───────────────────
function hash(i, j, k) {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const fade = (t) => t * t * (3 - 2 * t);
/** Value noise in −1 … 1. */
function vnoise(x, y, z) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = fade(x - xi);
  const v = fade(y - yi);
  const w = fade(z - zi);
  const c = (a, b, d) => hash(xi + a, yi + b, zi + d);
  const x00 = c(0, 0, 0) + (c(1, 0, 0) - c(0, 0, 0)) * u;
  const x10 = c(0, 1, 0) + (c(1, 1, 0) - c(0, 1, 0)) * u;
  const x01 = c(0, 0, 1) + (c(1, 0, 1) - c(0, 0, 1)) * u;
  const x11 = c(0, 1, 1) + (c(1, 1, 1) - c(0, 1, 1)) * u;
  const y0 = x00 + (x10 - x00) * v;
  const y1 = x01 + (x11 - x01) * v;
  return (y0 + (y1 - y0) * w) * 2 - 1;
}
/** Ridged noise: sharp creases, like folds in thin metal (0 … about 0.9). */
function ridged(x, y, z) {
  let a = 0;
  let amp = 0.55;
  let f = 1;
  for (let o = 0; o < 3; o++) {
    const n = 1 - Math.abs(vnoise(x * f + o * 17.3, y * f - o * 9.1, z * f + o * 4.7));
    a += amp * n * n;
    f *= 2.07;
    amp *= 0.5;
  }
  return a;
}

/** How free a point is to move: 1 in the middle of a face, 0 along the edges (where two faces stiffen each other). */
function bulge(qx, qy, qz) {
  const a = 1 - qx * qx;
  const b = 1 - qy * qy;
  const c = 1 - qz * qz;
  return qx * qx * b * c + qy * qy * a * c + qz * qz * a * b;
}

const MORPHS = ['dent', 'crush', 'flat'];
/**
 * Where a point of the new box (p, with the rounded cube's normal n; box-centred, metres) goes in each morph target.
 * Every term is a smooth function of p and n, so the faces stay joined along the edges.
 */
function targets(p, n, out) {
  const qx = p.x / H;
  const qy = p.y / H;
  const qz = p.z / H;
  const B = bulge(qx, qy, qz);
  const rid = ridged(p.x * 52 + 3.1, p.y * 52 - 1.7, p.z * 52 + 0.6);
  const tw = (o) => vnoise(p.x * 38 + o, p.y * 38 - o, p.z * 38 + o * 0.5);
  // the first dent: each face sinks in a little, smoothly
  {
    const inward = H * (0.24 * B + 0.06 * rid * B);
    out.dent.set(p.x * 0.985, -H + (p.y + H) * 0.985, p.z * 0.985).addScaledVector(n, -inward);
  }
  // the real crush: every face caves in and creases, the edges buckle, the whole box shrinks a little (onto the table)
  {
    const inward = H * (0.72 * B + 0.34 * rid * (0.3 + 0.7 * B) + 0.05);
    const k = 0.84;
    const t = H * 0.18 * (0.3 + 0.7 * B);
    out.crush
      .set(p.x * k, -H + (p.y + H) * k, p.z * k)
      .addScaledVector(n, -inward)
      .add({ x: tw(11.3) * t, y: tw(5.9) * t * 0.7, z: tw(23.1) * t });
    out.crush.y = Math.max(-H, out.crush.y);
  }
  // the wrong (b): squashed from the top only, the sides folded out like a stack of folds, the top creased
  {
    const side = 1 - n.y * n.y;
    const y = -H + (p.y + H) * 0.3;
    const fold = H * 0.2 * side * Math.abs(Math.sin((qy + 1) * Math.PI * 1.5)) + H * 0.05 * side * rid;
    const spread = 1.14;
    out.flat.set(p.x * spread, y, p.z * spread).addScaledVector({ x: n.x, y: 0, z: n.z }, fold);
    if (n.y > 0.5) out.flat.y -= H * 0.06 * rid * B;
  }
  return out;
}

/** The six faces: normal, and two directions along it (u × v = the normal, so the triangles face out). */
export const FACES = [
  { id: 'px', n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { id: 'nx', n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { id: 'py', n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  { id: 'ny', n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { id: 'pz', n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { id: 'nz', n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
].map((f) => ({ ...f, n: new THREE.Vector3(...f.n), u: new THREE.Vector3(...f.u), v: new THREE.Vector3(...f.v) }));

/** A point on a face of the new box at (u, v) in −1 … 1, and the rounded cube's normal there (box-centred). */
export function facePoint(face, u, v, p = new THREE.Vector3(), n = new THREE.Vector3()) {
  p.copy(face.n)
    .multiplyScalar(H)
    .addScaledVector(face.u, u * H)
    .addScaledVector(face.v, v * H);
  const lim = H - R;
  const ix = Math.min(lim, Math.max(-lim, p.x));
  const iy = Math.min(lim, Math.max(-lim, p.y));
  const iz = Math.min(lim, Math.max(-lim, p.z));
  n.set(p.x - ix, p.y - iy, p.z - iz).normalize();
  p.set(ix, iy, iz).addScaledVector(n, R);
  return { p, n };
}

/** The morph weights for a crumple c (0 … 1) and a flattening f (0 … 1): a dent first, then the crush. */
export function morphWeights(c, f = 0, out = [0, 0, 0]) {
  const k = Math.min(1, Math.max(0, c));
  const split = 0.42;
  out[0] = k < split ? k / split : 1 - (k - split) / (1 - split);
  out[1] = k < split ? 0 : (k - split) / (1 - split);
  out[2] = Math.min(1, Math.max(0, f));
  return out;
}

// ── the printed label: golden-yellow tin, deep blue bands, a cream oval with a marigold, no words ──────────
function labelTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const body = g.createLinearGradient(0, 0, 512, 0);
  body.addColorStop(0, '#d98e04');
  body.addColorStop(0.5, '#ffc61a');
  body.addColorStop(1, '#d98e04');
  g.fillStyle = body;
  g.fillRect(0, 0, 512, 512);
  // deep blue bands near the top and the bottom, with a fine gold line inside each
  for (const y of [34, 432]) {
    g.fillStyle = '#1b2f7a';
    g.fillRect(0, y, 512, 46);
    g.fillStyle = '#ffd95a';
    g.fillRect(0, y + 21, 512, 4);
  }
  // diagonal sheen stripes in the yellow
  g.globalAlpha = 0.09;
  g.fillStyle = '#ffffff';
  for (let x = -512; x < 512; x += 56) {
    g.beginPath();
    g.moveTo(x, 80);
    g.lineTo(x + 26, 80);
    g.lineTo(x + 26 + 352, 432);
    g.lineTo(x + 352, 432);
    g.fill();
  }
  g.globalAlpha = 1;
  // the cream oval with a blue rim
  g.save();
  g.translate(256, 256);
  g.fillStyle = '#1b2f7a';
  g.beginPath();
  g.ellipse(0, 0, 150, 118, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff6df';
  g.beginPath();
  g.ellipse(0, 0, 138, 106, 0, 0, Math.PI * 2);
  g.fill();
  // a marigold: rings of petals, orange to yellow, on two green leaves
  g.fillStyle = '#2f9e44';
  for (const s of [-1, 1]) {
    g.beginPath();
    g.ellipse(s * 62, 40, 56, 20, s * 0.5, 0, Math.PI * 2);
    g.fill();
  }
  const rings = [
    [74, 22, '#e8590c'],
    [60, 20, '#f76707'],
    [46, 18, '#fd7e14'],
    [32, 15, '#fab005'],
    [18, 12, '#ffd43b'],
  ];
  for (const [r, count, col] of rings) {
    g.fillStyle = col;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + r * 0.07;
      g.beginPath();
      g.ellipse(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62 - 8, r * 0.36, r * 0.2, a, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.fillStyle = '#b35900';
  g.beginPath();
  g.arc(0, -8, 9, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** The plain tin of the lid and the bottom: brushed rings round the middle. */
function lidTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  g.fillStyle = '#d7dbe0';
  g.fillRect(0, 0, 256, 256);
  for (let r = 4; r < 182; r += 3) {
    g.strokeStyle = r % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(80,90,100,0.10)';
    g.beginPath();
    g.arc(128, 128, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.strokeStyle = 'rgba(70,78,90,0.5)';
  g.lineWidth = 5;
  g.strokeRect(14, 14, 228, 228);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * The tin box on its bottom face at the origin (the table's top is y = 0). Returns the group, its mesh, the GPU morph
 * weights setter, the ghost (the wrong (b), drawn see-through), a CPU `pointAt` for any face point, and the place where
 * the hose comes out.
 */
export function createCan() {
  const root = new THREE.Group();
  root.name = 'TinBox';
  const per = (S + 1) * (S + 1);
  const pos = new Float32Array(per * 6 * 3);
  const nor = new Float32Array(per * 6 * 3);
  const uv = new Float32Array(per * 6 * 2);
  const morph = MORPHS.map(() => new Float32Array(per * 6 * 3));
  const index = [];
  const geo = new THREE.BufferGeometry();
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const tg = { dent: new THREE.Vector3(), crush: new THREE.Vector3(), flat: new THREE.Vector3() };
  // denser near the edges, so the rounded edges are smooth with few quads
  const grid = (i) => {
    const s = -1 + (2 * i) / S;
    return 0.45 * s + 0.55 * Math.sin((Math.PI * s) / 2);
  };
  FACES.forEach((face, fi) => {
    const base = fi * per;
    for (let j = 0; j <= S; j++)
      for (let i = 0; i <= S; i++) {
        const k = base + j * (S + 1) + i;
        const u = grid(i);
        const v = grid(j);
        facePoint(face, u, v, p, n);
        p.toArray(pos, k * 3);
        n.toArray(nor, k * 3);
        uv[k * 2] = (u + 1) / 2;
        uv[k * 2 + 1] = (v + 1) / 2;
        targets(p, n, tg);
        MORPHS.forEach((m, mi) => tg[m].toArray(morph[mi], k * 3));
      }
    const start = index.length;
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        const a = base + j * (S + 1) + i;
        const b = a + 1;
        const c = a + S + 2;
        const d = a + S + 1;
        index.push(a, b, c, a, c, d);
      }
    const side = Math.abs(face.n.y) < 0.5;
    geo.addGroup(start, index.length - start, side ? 0 : 1);
  });
  geo.setIndex(index);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.morphAttributes.position = morph.map((a) => new THREE.BufferAttribute(a, 3));
  geo.computeBoundingSphere();
  geo.boundingSphere.radius *= 1.3; // the folded-out (b) is wider than the new box

  // printed tin: a little metallic all over, the creases catch the light (flat shading shows each fold)
  const label = new THREE.MeshStandardMaterial({ name: 'PrintedTin', map: labelTexture(), metalness: 0.55, roughness: 0.3, flatShading: true });
  const lid = new THREE.MeshStandardMaterial({ name: 'Tin', map: lidTexture(), metalness: 0.92, roughness: 0.24, flatShading: true });
  const mesh = new THREE.Mesh(geo, [label, lid]);
  mesh.name = 'TinBoxBody';
  mesh.position.y = H;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.morphTargetInfluences = [0, 0, 0];
  root.add(mesh);

  // the ghost: the same mesh, see-through pale blue, for the wrong (b)
  const ghostFill = new THREE.MeshStandardMaterial({
    name: 'Ghost',
    color: '#9fd0ff',
    emissive: '#3d8fe0',
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    metalness: 0,
    roughness: 0.5,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const ghost = new THREE.Group();
  ghost.name = 'GhostTopOnly';
  ghost.userData.noExport = true;
  const gFill = new THREE.Mesh(geo, ghostFill);
  for (const g of [gFill]) {
    g.position.y = H;
    g.morphTargetInfluences = [0, 0, 0];
    g.renderOrder = 5;
    ghost.add(g);
  }
  ghost.visible = false;
  root.add(ghost);

  // the nozzle on the left face, low down (where the book's tube goes in), and its brass nut
  const HOSE_FACE = FACES[1];
  const HOSE_UV = [0, -0.5];
  const brass = new THREE.MeshStandardMaterial({ name: 'Brass', color: '#c9a043', metalness: 0.9, roughness: 0.3 });
  const nozzle = new THREE.Group();
  nozzle.name = 'Nozzle';
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.006, 6), brass);
  nut.rotation.z = Math.PI / 2;
  nut.position.x = -0.003;
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.016, 14), brass);
  pipe.rotation.z = Math.PI / 2;
  pipe.position.x = -0.01;
  nozzle.add(nut, pipe);
  for (const m of [nut, pipe]) m.castShadow = true;
  root.add(nozzle);

  const W = [0, 0, 0];
  const wp = new THREE.Vector3();
  const wn = new THREE.Vector3();
  /** Where face point (u, v) is now (root coordinates), for the weights w (as morphWeights gives). */
  function pointAt(face, u, v, w, out = new THREE.Vector3()) {
    facePoint(face, u, v, wp, wn);
    targets(wp, wn, tg);
    out.copy(wp);
    MORPHS.forEach((m, mi) => {
      if (w[mi]) out.addScaledVector(tg[m].sub(wp), w[mi]);
    });
    out.y += H;
    return out;
  }
  const hoseAt = new THREE.Vector3();
  function setShape(c, f = 0, { ghost: asGhost = false } = {}) {
    morphWeights(c, f, W);
    const show = asGhost ? [0, 0, W[2]] : [W[0], W[1], 0];
    for (let i = 0; i < 3; i++) {
      mesh.morphTargetInfluences[i] = show[i];
      gFill.morphTargetInfluences[i] = show[i];
    }
    mesh.visible = !asGhost;
    ghost.visible = asGhost;
    pointAt(HOSE_FACE, HOSE_UV[0], HOSE_UV[1], show, hoseAt);
    nozzle.position.copy(hoseAt);
    return show;
  }
  setShape(0);

  /** A plain copy of the box as it is now (the morph baked in), for the GLB. */
  function bake() {
    const g = geo.clone();
    const out = g.attributes.position;
    const infl = mesh.morphTargetInfluences;
    for (let k = 0; k < out.count; k++) {
      let x = pos[k * 3];
      let y = pos[k * 3 + 1];
      let z = pos[k * 3 + 2];
      morph.forEach((m, mi) => {
        const w = infl[mi];
        if (!w) return;
        x += (m[k * 3] - pos[k * 3]) * w;
        y += (m[k * 3 + 1] - pos[k * 3 + 1]) * w;
        z += (m[k * 3 + 2] - pos[k * 3 + 2]) * w;
      });
      out.setXYZ(k, x, y, z);
    }
    g.morphAttributes = {};
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, [label.clone(), lid.clone()]);
    m.position.y = H;
    m.name = 'TinBoxBody';
    const box = new THREE.Group();
    box.name = 'TinBox';
    box.add(m, nozzle.clone(true));
    return box;
  }

  return { root, mesh, ghost, setShape, pointAt, hoseAt, bake, H };
}

/** A small round dial: white face, a band from green to red, ticks; no words (the numbers are in the panel). */
function dialTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  g.fillStyle = '#fbfbf7';
  g.beginPath();
  g.arc(128, 128, 124, 0, Math.PI * 2);
  g.fill();
  const a0 = Math.PI * 0.75;
  const a1 = Math.PI * 2.25;
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const k = i / steps;
    g.strokeStyle = `hsl(${120 - 120 * k}, 70%, 45%)`;
    g.lineWidth = 16;
    g.beginPath();
    g.arc(128, 128, 96, a0 + (a1 - a0) * k, a0 + (a1 - a0) * (k + 1 / steps) + 0.01);
    g.stroke();
  }
  g.strokeStyle = '#222';
  for (let i = 0; i <= 10; i++) {
    const a = a0 + ((a1 - a0) * i) / 10;
    g.lineWidth = i % 5 ? 3 : 6;
    const r0 = i % 5 ? 70 : 62;
    g.beginPath();
    g.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0);
    g.lineTo(128 + Math.cos(a) * 84, 128 + Math.sin(a) * 84);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * A hand vacuum pump standing on the table: a black barrel on a rubber foot, a T-handle on a steel rod, a dial that
 * shows the pressure left in the box (full: needle on the left; none: on the right). `setStroke(k)` lifts the handle
 * (0 down … 1 up), `setDial(fraction)` turns the needle. The hose's end is `inlet` (pump coordinates).
 */
export function createPump() {
  const root = new THREE.Group();
  root.name = 'VacuumPump';
  const barrel = new THREE.MeshStandardMaterial({ name: 'PumpBarrel', color: '#1d2126', metalness: 0.4, roughness: 0.28 });
  const rubber = new THREE.MeshStandardMaterial({ name: 'Rubber', color: '#24272b', roughness: 0.85 });
  const steel = new THREE.MeshStandardMaterial({ name: 'Steel', color: '#d9dde3', metalness: 0.95, roughness: 0.18 });
  const grip = new THREE.MeshStandardMaterial({ name: 'Grip', color: '#f2b705', roughness: 0.55 });
  const meshes = [];
  const add = (geo, mat, x, y, z, parent = root) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    meshes.push(m);
    return m;
  };
  add(new THREE.CylinderGeometry(0.05, 0.056, 0.014, 40), rubber, 0, 0.007, 0);
  add(new THREE.CylinderGeometry(0.024, 0.024, 0.19, 36), barrel, 0, 0.11, 0);
  add(new THREE.CylinderGeometry(0.027, 0.027, 0.012, 36), steel, 0, 0.02, 0);
  add(new THREE.CylinderGeometry(0.027, 0.027, 0.012, 36), steel, 0, 0.205, 0);
  // the handle: rod and T-grip, moved up and down as one
  const handle = new THREE.Group();
  handle.name = 'Handle';
  root.add(handle);
  add(new THREE.CylinderGeometry(0.0045, 0.0045, 0.12, 14), steel, 0, 0.21, 0, handle);
  const bar = add(new THREE.CylinderGeometry(0.0095, 0.0095, 0.1, 20), grip, 0, 0.272, 0, handle);
  bar.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) {
    const cap = add(new THREE.SphereGeometry(0.0105, 16, 10), grip, s * 0.05, 0.272, 0, handle);
    cap.scale.set(0.6, 1, 1);
  }
  // the inlet at the foot, where the hose goes in
  const inletPipe = add(new THREE.CylinderGeometry(0.005, 0.005, 0.03, 14), steel, 0.034, 0.03, 0);
  inletPipe.rotation.z = Math.PI / 2;
  const inlet = new THREE.Vector3(0.048, 0.03, 0);
  // the dial on the front of the barrel, facing the camera's side
  const dial = new THREE.Group();
  dial.name = 'Dial';
  dial.position.set(0, 0.115, 0.024);
  root.add(dial);
  add(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 40).rotateX(Math.PI / 2), steel, 0, 0, 0.006, dial);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.022, 40), new THREE.MeshStandardMaterial({ map: dialTexture(), roughness: 0.4 }));
  face.position.z = 0.0125;
  dial.add(face);
  const needlePivot = new THREE.Group();
  needlePivot.position.z = 0.0135;
  dial.add(needlePivot);
  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(0.0022, 0.018, 0.0012).translate(0, 0.007, 0),
    new THREE.MeshBasicMaterial({ color: '#c92a2a' }),
  );
  needlePivot.add(needle);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0022, 0.0022, 0.002, 12).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#222' }),
  );
  needlePivot.add(hub);
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(0.023, 40),
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0, clearcoat: 1 }),
  );
  glass.position.z = 0.0145;
  dial.add(glass);
  // the band on the dial runs from 135° (full) clockwise to 405° (none), in canvas angles (y down)
  function setDial(fraction) {
    const k = 1 - Math.min(1, Math.max(0, fraction));
    const a = Math.PI * 0.75 + Math.PI * 1.5 * k; // canvas angle, clockwise from +x
    needlePivot.rotation.z = -a - Math.PI / 2; // the needle points along +y at rotation 0; canvas angles turn the other way
  }
  setDial(1);
  function setStroke(k) {
    handle.position.y = 0.075 * Math.min(1, Math.max(0, k));
  }
  return { root, meshes, handle, setStroke, setDial, inlet };
}

/** The hose from the box's nozzle to the pump's inlet (rebuilt only when the nozzle moves). */
export function createHose() {
  const mat = new THREE.MeshStandardMaterial({ name: 'Hose', color: '#e8a33d', roughness: 0.42, metalness: 0, transparent: true, opacity: 0.93 });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.name = 'Hose';
  mesh.castShadow = true;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  let last = '';
  function set(from, to) {
    const key = `${from.x.toFixed(4)},${from.y.toFixed(4)},${from.z.toFixed(4)}|${to.x.toFixed(4)},${to.y.toFixed(4)},${to.z.toFixed(4)}`;
    if (key === last) return;
    last = key;
    const start = a.copy(from).add({ x: -0.017, y: 0, z: 0 });
    const end = b.copy(to);
    const mid1 = start.clone().add({ x: -0.035, y: -0.004, z: -0.01 });
    const mid2 = end.clone().add({ x: 0.04, y: 0.004, z: 0.03 });
    const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
    mesh.geometry.dispose();
    mesh.geometry = new THREE.TubeGeometry(curve, 36, 0.0052, 10, false);
  }
  return { mesh, set };
}
