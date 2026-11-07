// The field lines, drawn cheaply: every line of one configuration is a thin light-gold tube with a dark outline (an
// inverted hull, the same mesh), all merged into ONE geometry and one draw; their arrowheads are one instanced mesh
// (a gold cone in a dark hull). Lines grow along the field's direction from where they start (a shader discards what
// lies beyond `grow` metres along each line), so the field can be shown spreading out, or flowing in, without
// rebuilding anything. A loose end (not on a sphere) thins out over its last few centimetres.
import * as THREE from 'three';
import { lengthOf, resample, traceConfig } from './field.js';

export const LINE_COLOR = '#ffd43b';
const EDGE = '#3a2c05';
const TUBE_R = 0.00125; // m
const HULL = 0.0007; // m: the outline's width
const SIDES = 5;
const HULL_SIDES = 4;
const STEP = 0.006; // m between rings
const TAPER = 0.035; // m: a loose end thins over this
const HEAD = { len: 0.012, r: 0.0042, hull: 0.0011 };
const HEAD_GAP = 0.085; // m between arrowheads on one line

const gold = new THREE.Color(LINE_COLOR);
const dark = new THREE.Color(EDGE);

// the glow only on the gold (the vertex colour), never on the dark outline
const GLOW = '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;';

/** One material per mesh (its own `grow` and `rev`), one shader program for all of them. */
function lineMaterial() {
  const uniforms = { uGrow: { value: 1 }, uRev: { value: 0 } };
  const m = new THREE.MeshStandardMaterial({ name: 'FieldLine', vertexColors: true, roughness: 0.45, metalness: 0.05 });
  m.emissive.set('#5c4300');
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGrow = uniforms.uGrow;
    sh.uniforms.uRev = uniforms.uRev;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aSL;\nuniform float uGrow;\nuniform float uRev;\nvarying float vHide;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHide = mix(aSL.x, aSL.y - aSL.x, uRev) - uGrow;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vHide;')
      .replace('void main() {', 'void main() {\n  if (vHide > 0.0) discard;')
      .replace('#include <emissivemap_fragment>', GLOW);
  };
  m.customProgramCacheKey = () => 'efl-line';
  m.userData.uniforms = uniforms;
  return m;
}

/** A tube (and its hull, wound inside out) along points, written into the arrays. */
function addTube(pts, loose, out) {
  const n = pts.length;
  const L = lengthOf(pts);
  const s = new Float32Array(n);
  for (let i = 1; i < n; i++) s[i] = s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
  // parallel-transport frames
  const T = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    T.push(new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize());
  }
  const N0 = new THREE.Vector3(0, 1, 0);
  if (Math.abs(N0.dot(T[0])) > 0.9) N0.set(1, 0, 0);
  const Nn = [new THREE.Vector3().crossVectors(T[0], N0).normalize()];
  for (let i = 1; i < n; i++) {
    const v = Nn[i - 1].clone();
    v.addScaledVector(T[i], -v.dot(T[i])).normalize();
    Nn.push(v);
  }
  const radiusAt = (i, base) => {
    let k = 1;
    if (loose.end) k = Math.min(k, 0.3 + (0.7 * (L - s[i])) / TAPER);
    if (loose.start) k = Math.min(k, 0.3 + (0.7 * s[i]) / TAPER);
    return base * Math.min(1, k);
  };
  const B = new THREE.Vector3();
  const dirv = new THREE.Vector3();
  for (const [sides, extra, inside, col] of [
    [SIDES, 0, false, gold],
    [HULL_SIDES, HULL, true, dark],
  ]) {
    const base = out.pos.length / 3;
    for (let i = 0; i < n; i++) {
      B.crossVectors(T[i], Nn[i]);
      const r = radiusAt(i, TUBE_R) + extra * Math.min(1, radiusAt(i, 1));
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2;
        dirv.copy(Nn[i]).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
        out.pos.push(pts[i][0] + dirv.x * r, pts[i][1] + dirv.y * r, pts[i][2] + dirv.z * r);
        out.nor.push(dirv.x, dirv.y, dirv.z);
        out.col.push(col.r, col.g, col.b);
        out.sl.push(s[i], L);
      }
    }
    for (let i = 0; i < n - 1; i++)
      for (let j = 0; j < sides; j++) {
        const a = base + i * sides + j;
        const b = base + i * sides + ((j + 1) % sides);
        const c = base + (i + 1) * sides + j;
        const d = base + (i + 1) * sides + ((j + 1) % sides);
        if (inside) out.idx.push(a, c, b, b, c, d);
        else out.idx.push(a, b, c, b, d, c);
      }
  }
}

/** The arrowhead: a gold cone (tip up, +y) in a dark hull, one geometry with vertex colours. */
function headGeometry() {
  const g = new THREE.ConeGeometry(HEAD.r, HEAD.len, 12, 1, false);
  const h = new THREE.ConeGeometry(HEAD.r + HEAD.hull, HEAD.len + HEAD.hull * 2.6, 10, 1, false);
  h.translate(0, -HEAD.hull * 0.2, 0);
  // the hull inside out: reverse its triangles
  const hi = h.index.array;
  for (let i = 0; i < hi.length; i += 3) [hi[i + 1], hi[i + 2]] = [hi[i + 2], hi[i + 1]];
  const paint = (geo, c) => {
    const n = geo.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  };
  paint(g, gold);
  paint(h, dark);
  const merged = new THREE.BufferGeometry();
  const pos = [...g.attributes.position.array, ...h.attributes.position.array];
  const nor = [...g.attributes.normal.array, ...h.attributes.normal.array];
  const col = [...g.attributes.color.array, ...h.attributes.color.array];
  const off = g.attributes.position.count;
  const idx = [...g.index.array, ...Array.from(h.index.array, (i) => i + off)];
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  merged.setIndex(idx);
  g.dispose();
  h.dispose();
  return merged;
}

/**
 * The lines of one configuration (`flat`: the book's plane only). Returns { mesh, heads, lines, set(grow, rev),
 * maxLength }. `set(grow, rev)`: show each line up to `grow` metres along the field (rev: the field turned round, so
 * lines grow from their far ends inward), and the arrowheads already reached, pointing the field's way.
 */
export function createFieldLines(name, { flat = false, headMaterial }) {
  const traced = traceConfig(name, { flat });
  const out = { pos: [], nor: [], col: [], sl: [], idx: [] };
  /** Arrowheads: where on which line (s from the line's start, in the field's direction), in both senses. */
  const heads = [];
  let maxLength = 0;
  const lines = [];
  for (const l of traced) {
    const pts = resample(l.points, STEP);
    const L = lengthOf(pts);
    maxLength = Math.max(maxLength, L);
    addTube(pts, { start: l.from < 0, end: l.to < 0 }, out);
    lines.push({ pts, L, from: l.from, to: l.to });
    // heads measured from the end on a charge (both ends on charges: the middle)
    const at = [];
    if (l.from >= 0 && l.to >= 0) at.push(L / 2);
    else if (l.from >= 0) for (let s = 0.045; s < L - 0.03; s += HEAD_GAP) at.push(s);
    else if (l.to >= 0) for (let s = L - 0.045; s > 0.03; s -= HEAD_GAP) at.push(s);
    for (const s of at) heads.push({ line: lines.length - 1, s });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(out.nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(out.col, 3));
  geo.setAttribute('aSL', new THREE.Float32BufferAttribute(out.sl, 2));
  geo.setIndex(out.idx);
  geo.computeBoundingSphere();
  const material = lineMaterial();
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = `FieldLines_${name}${flat ? '_flat' : ''}`;
  mesh.frustumCulled = false;

  // where each head sits and which way the line runs there
  const place = heads.map(({ line, s }) => {
    const { pts, L } = lines[line];
    const f = Math.min(pts.length - 1.001, (s / L) * (pts.length - 1));
    const i = Math.floor(f);
    const k = f - i;
    const a = pts[i];
    const b = pts[i + 1];
    const p = new THREE.Vector3(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    return { p, d, s, L };
  });
  const headMesh = new THREE.InstancedMesh(HEAD_GEO(), headMaterial, Math.max(1, place.length));
  headMesh.name = `FieldArrows_${name}${flat ? '_flat' : ''}`;
  headMesh.count = place.length;
  headMesh.frustumCulled = false;
  const UP = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const m4 = new THREE.Matrix4();
  const one = new THREE.Vector3(1, 1, 1);
  const zero = new THREE.Vector3(0, 0, 0);
  const dir = new THREE.Vector3();
  let lastGrow = -1;
  let lastRev = false;
  /** Which heads show now, so a frame that changes nothing writes nothing. */
  const shown = new Uint8Array(place.length);
  function set(grow, rev = false) {
    if (grow === lastGrow && rev === lastRev) return;
    const turned = rev !== lastRev || lastGrow < 0;
    lastGrow = grow;
    lastRev = rev;
    const u = material.userData.uniforms;
    u.uGrow.value = grow;
    u.uRev.value = rev ? 1 : 0;
    mesh.visible = grow > 1e-4;
    headMesh.visible = mesh.visible;
    // the heads: shown once the line has grown past them (+ half a head), pointing along the field
    let changed = false;
    for (let i = 0; i < place.length; i++) {
      const h = place[i];
      const reached = (rev ? h.L - h.s : h.s) + HEAD.len < grow ? 1 : 0;
      if (reached === shown[i] && !turned) continue;
      shown[i] = reached;
      changed = true;
      dir.copy(h.d);
      if (rev) dir.negate();
      q.setFromUnitVectors(UP, dir);
      // the cone's middle on the line
      m4.compose(h.p, q, reached ? one : zero);
      headMesh.setMatrixAt(i, m4);
    }
    if (changed) headMesh.instanceMatrix.needsUpdate = true;
  }
  set(0);
  return { mesh, heads: headMesh, lines, set, maxLength, count: lines.length };
}

let headGeo = null;
const HEAD_GEO = () => {
  headGeo ??= headGeometry();
  return headGeo;
};

/** The arrowheads' material (shared by every configuration). */
export const headMaterial = () => {
  const m = new THREE.MeshStandardMaterial({ name: 'FieldArrow', vertexColors: true, roughness: 0.45, metalness: 0.05 });
  m.emissive.set('#5c4300');
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', GLOW);
  };
  m.customProgramCacheKey = () => 'efl-head';
  return m;
};
