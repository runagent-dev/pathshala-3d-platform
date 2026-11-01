// The tin box (a cube 10 cm on a side, like the book's চিত্র ৫.০৭) with its nozzle, in metres (the pump is not drawn).
// The box is one modest mesh (a rounded cube, 22 × 22 quads a face) with three precomputed morph targets that the
// GPU blends: a first dent, the real crush from every side (the book's (c)) and the wrong flattening from the top
// only (the book's (b)). Nothing is rebuilt per frame. The same
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
  // plain tin, calm: soft silver with one muted slate band near the top and the bottom (the arrows carry the colour)
  const body = g.createLinearGradient(0, 0, 512, 0);
  body.addColorStop(0, '#aeb5bd');
  body.addColorStop(0.5, '#dfe3e7');
  body.addColorStop(1, '#aeb5bd');
  g.fillStyle = body;
  g.fillRect(0, 0, 512, 512);
  for (const y of [40, 440]) {
    g.fillStyle = '#5d6b7a';
    g.fillRect(0, y, 512, 32);
  }
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
