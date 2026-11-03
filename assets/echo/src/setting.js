// The setting, in metres: a tall sandstone cliff (খাড়া পাহাড়) whose face is the plane x = 0 (facing +x), flat dry
// ground in front of it, a clear late-afternoon sky with a warm haze at the horizon (fog), and a yellow measuring tape
// laid on the ground from the foot of the cliff (0 m) out to 41 m, its numbers every 5 m kept upright and a steady size
// on the screen by the app. Procedural, no image files: the cliff is one displaced grid with layered (strata) vertex
// colours and a fine rock texture, a darker top, and a few fallen boulders at its foot.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const CLIFF = { width: 160, height: 13, depth: 26, exportWidth: 60 };
export const TAPE = { length: 41, z: 1.15, width: 0.42 };
export const HAZE = '#e9d9c4';

function canvasTex(w, h, draw, { repeat = null, color = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 8;
  return t;
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Smooth value noise in 2D (deterministic), about −1…1. */
function noise2(seed) {
  const r = rng(seed);
  const N = 256;
  const table = new Float32Array(N * N);
  for (let i = 0; i < table.length; i++) table[i] = r() * 2 - 1;
  const at = (i, j) => table[((j & (N - 1)) * N + (i & (N - 1))) | 0];
  const f = (x) => x * x * (3 - 2 * x);
  return (x, y) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const u = f(x - i);
    const v = f(y - j);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * u;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * u;
    return a + (b - a) * v;
  };
}
function fbm(n, x, y, oct = 4) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let k = 0; k < oct; k++) {
    s += a * n(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

/** The sky: a clear blue overhead to a warm haze at the horizon (screen space). */
export function skyTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#5f8fc4');
    s.addColorStop(0.45, '#9dbbd8');
    s.addColorStop(0.8, '#dcd3c6');
    s.addColorStop(1, HAZE);
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/** Packed dry earth with grit and small stones. */
function earth() {
  return canvasTex(
    512,
    512,
    (ctx, W, H) => {
      const r = rng(11);
      ctx.fillStyle = '#b49470';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 9000; i++) {
        const l = 38 + r() * 30;
        ctx.fillStyle = `hsla(${26 + r() * 10}, ${22 + r() * 18}%, ${l}%, ${0.18 + r() * 0.3})`;
        const d = 1 + r() * 3.5;
        ctx.fillRect(r() * W, r() * H, d, d);
      }
      for (let i = 0; i < 160; i++) {
        const x = r() * W;
        const y = r() * H;
        const rr = 2 + r() * 5;
        ctx.fillStyle = `hsl(${24 + r() * 14}, ${10 + r() * 14}%, ${50 + r() * 24}%)`;
        ctx.beginPath();
        ctx.ellipse(x, y, rr, rr * (0.6 + r() * 0.4), r() * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(60,40,20,0.25)';
        ctx.beginPath();
        ctx.ellipse(x + rr * 0.3, y + rr * 0.4, rr, rr * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { repeat: [60, 60] },
  );
}

/** The beds of the sandstone, bottom up: thickness (m), colour, and how far the bed stands out of the face (m: hard
 * beds stand out as ledges, soft ones are worn back under them, so the hard ones overhang a little). */
const BEDS = [
  { h: 1.5, c: '#a46b45', out: 0.15 },
  { h: 0.9, c: '#d8b386', out: 0.95 },
  { h: 1.9, c: '#b27a50', out: -0.3 },
  { h: 0.6, c: '#83563a', out: 0.55 },
  { h: 1.7, c: '#c8996c', out: -0.1 },
  { h: 0.9, c: '#e0bd90', out: 1.0 },
  { h: 2.1, c: '#a86d45', out: -0.35 },
  { h: 0.8, c: '#c38c5f', out: 0.5 },
  { h: 1.5, c: '#b4805a', out: 0.0 },
  { h: 2.6, c: '#9a6746', out: 0.35 },
];
const BED_TOPS = [];
for (let i = 0, y = 0; i < BEDS.length; i++) BED_TOPS.push((y += BEDS[i].h));
/** The strata texture covers this many metres up and along the face. */
const TEX_M = 16;
/** The bed at a height (the beds dip a little and wander: yy is the height plus noise). */
function bedAt(yy) {
  for (let i = 0; i < BEDS.length; i++) if (yy < BED_TOPS[i]) return { i, f: (yy - (BED_TOPS[i] - BEDS[i].h)) / BEDS[i].h };
  return { i: BEDS.length - 1, f: 1 };
}
/** How far the face stands out at a height (m): each bed's own step, a rounded lip at the top of the hard ones. */
function ledge(y, n) {
  const { i, f } = bedAt(y + n * 0.5);
  const b = BEDS[i];
  const S = THREE.MathUtils.smoothstep;
  // the step between beds is sharp (over the lowest 6 % of a bed), not a smooth ramp
  const below = i > 0 ? BEDS[i - 1].out : b.out;
  const base = below + (b.out - below) * S(f, 0, 0.06);
  const lip = b.out > 0.4 ? 0.3 * S(f, 0.5, 0.9) * (1 - S(f, 0.93, 1)) : 0;
  // soft beds are hollowed in their middle
  const hollow = b.out < 0 ? -0.25 * Math.sin(Math.PI * f) : 0;
  return base + lip + hollow;
}

/** The strata, painted once (TEX_M × TEX_M metres, bed 0 at the bottom): each bed its colour with sharp breaks, fine
 * laminations, a dark weathered seam at its base, a pale top on the hard beds, grain, and joints (vertical cracks)
 * that stop at the bed's edges. */
function strataTexture(k = 1) {
  return canvasTex(
    512 * k,
    1024 * k,
    (ctx, W, H) => {
      const r = rng(23);
      const py = (m) => H - (m / TEX_M) * H; // metres up → canvas y
      ctx.fillStyle = BEDS[BEDS.length - 1].c;
      ctx.fillRect(0, 0, W, H);
      const c = new THREE.Color();
      for (let i = 0; i < BEDS.length; i++) {
        const b = BEDS[i];
        const y0 = py(BED_TOPS[i] - b.h);
        const y1 = py(BED_TOPS[i]);
        ctx.fillStyle = b.c;
        ctx.fillRect(0, y1, W, y0 - y1);
        // laminations: thin lines a shade lighter or darker, slightly wavy
        const n = Math.round(b.h * 7);
        for (let k = 1; k < n; k++) {
          const y = y1 + ((y0 - y1) * k) / n + (r() - 0.5) * 3;
          c.set(b.c).multiplyScalar(r() > 0.5 ? 0.9 : 1.08);
          ctx.strokeStyle = `#${c.getHexString()}`;
          ctx.globalAlpha = 0.35 + r() * 0.35;
          ctx.lineWidth = 1 + r() * 1.5;
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x <= W; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.03 + k) * 1.5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // the pale top of a hard bed, the dark seam at the base of every bed
        if (b.out > 0.4) {
          ctx.fillStyle = 'rgba(245, 222, 186, 0.45)';
          ctx.fillRect(0, y1, W, (y0 - y1) * 0.18);
        }
        ctx.fillStyle = 'rgba(52, 32, 20, 0.75)';
        ctx.fillRect(0, y0 - 5, W, 5);
        ctx.fillStyle = 'rgba(52, 32, 20, 0.3)';
        ctx.fillRect(0, y0 - 9, W, 4);
        // joints: vertical cracks inside the bed
        const joints = Math.round(3 + r() * 4);
        for (let k = 0; k < joints; k++) {
          let x = r() * W;
          ctx.strokeStyle = `rgba(48, 30, 18, ${0.45 + r() * 0.3})`;
          ctx.lineWidth = 1.2 + r() * 1.8;
          ctx.beginPath();
          ctx.moveTo(x, y1 + 2);
          for (let y = y1 + 2; y < y0 - 4; y += 10) {
            x += (r() - 0.5) * 5;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      // grain and pits over everything
      for (let i = 0; i < 26000 * k * k; i++) {
        const l = r();
        ctx.fillStyle = l > 0.5 ? `rgba(255, 240, 215, ${0.08 + r() * 0.14})` : `rgba(40, 25, 15, ${0.08 + r() * 0.16})`;
        const d = 1 + r() * 2;
        ctx.fillRect(r() * W, r() * H, d, d);
      }
    },
    { repeat: [1, 1] },
  );
}

/** The cliff: its face (x ≈ 0, ledges up to about 1 m), its top, and fallen blocks at its foot. width: m along z;
 * detail: 1 in the scene, less for the GLB (a coarser grid and a smaller strata picture). */
export function createCliff(width = CLIFF.width, detail = 1) {
  const { height: H, depth: D } = CLIFF;
  const W = width;
  const n = noise2(5);
  const nTop = noise2(9);
  const SX = Math.round(W * 1.25 * detail);
  const SY = Math.round(120 * Math.max(0.6, detail));
  const top = (z) => H + 2.4 * fbm(nTop, z * 0.035, 0.5, 3) + 0.9 * Math.sin(z * 0.05);
  const wander = (z) => fbm(n, z * 0.06, 3.3) * 0.8;
  const relief = (z, y) =>
    0.3 * fbm(n, z * 0.18, y * 0.22) + 0.12 * fbm(n, z * 0.9 + 30, y * 1.4) + ledge(y, wander(z)) * (0.8 + 0.4 * fbm(n, z * 0.05, 7));
  // the face: z across, y up, displaced along x (the mean plane stays x = 0: what the sound reflects from)
  const face = new THREE.PlaneGeometry(W, 1, SX, SY);
  face.rotateY(Math.PI / 2); // the plane in y–z, facing +x
  const pos = face.attributes.position;
  const uv = face.attributes.uv;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const v = pos.getY(i) + 0.5; // 0…1
    const y = v * top(z);
    const nn = wander(z);
    // a little scree slope at the bottom
    const foot = Math.max(0, 1 - y / 1.4) ** 2 * 0.9;
    const x = relief(z, y) + foot - 0.12 * (y / H);
    pos.setXYZ(i, x, y, z);
    // the strata texture follows the beds (their wander), so the colour breaks sit exactly on the ledges
    uv.setXY(i, -z / TEX_M, (y + nn * 0.5) / TEX_M);
    // light and shade the texture can't know: recesses darker (less sky), a little mottling
    const k = THREE.MathUtils.clamp(0.82 + 0.22 * (x - ledge(y, nn) * 0.5) + 0.1 * fbm(n, z * 0.3 + 7, y * 0.4), 0.6, 1);
    colors.set([k, k * 0.98, k * 0.96], i * 3);
  }
  face.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  face.computeVertexNormals();
  // the top, going back into the hill: dry, darker rock
  const cap = new THREE.PlaneGeometry(D, W, 8, Math.round(SX / 3));
  cap.rotateX(-Math.PI / 2); // x across the depth, z along the cliff
  const cp = cap.attributes.position;
  const ccol = new Float32Array(cp.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < cp.count; i++) {
    const z = cp.getZ(i);
    const x = -(cp.getX(i) + D / 2); // 0 at the edge … −D
    const edge = relief(z, top(z)) - 0.12;
    cp.setXYZ(i, x + edge, top(z) + 0.6 * fbm(n, x * 0.2, z * 0.2) * Math.min(1, -x / 3), z);
    c.set('#8f6a4c').multiplyScalar(0.85 + 0.2 * fbm(n, x * 0.3, z * 0.3));
    ccol.set([c.r, c.g, c.b], i * 3);
  }
  cap.setAttribute('color', new THREE.BufferAttribute(ccol, 3));
  cap.computeVertexNormals();
  const strata = strataTexture(detail < 1 ? 0.5 : 1);
  strata.wrapS = THREE.RepeatWrapping;
  const mat = new THREE.MeshStandardMaterial({ name: 'Sandstone', vertexColors: true, map: strata, roughness: 0.93 });
  const capMat = new THREE.MeshStandardMaterial({ name: 'CliffTop', vertexColors: true, roughness: 1 });
  const faceMesh = new THREE.Mesh(face, mat);
  faceMesh.name = 'CliffFace';
  faceMesh.receiveShadow = true;
  const capMesh = new THREE.Mesh(cap, capMat);
  capMesh.name = 'CliffTop';
  // blocks fallen from the ledges, at the foot: rounded, lumpy, a little flattened, off the student's line and the tape
  const r = rng(31);
  const nb = noise2(17);
  const rocks = [];
  const palette = ['#b98a60', '#a77b57', '#c69b70', '#9b6d4b'];
  for (let i = 0; i < 12; i++) {
    const ico = new THREE.IcosahedronGeometry(1, 3);
    ico.deleteAttribute('normal');
    ico.deleteAttribute('uv');
    const g = mergeVertices(ico); // shared corners: smooth and small
    ico.dispose();
    const p = g.attributes.position;
    const sx = 0.8 + r() * 0.6;
    const sz = 0.7 + r() * 0.5;
    const off = r() * 100;
    const col = new Float32Array(p.count * 3);
    c.set(palette[i % palette.length]);
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k);
      const y = p.getY(k);
      const z = p.getZ(k);
      const bump = 1 + 0.18 * fbm(nb, x * 1.6 + off, z * 1.6 + y * 1.3, 3);
      // a flat underside (it sits on the ground) and a slightly flattened top: a block, not a ball
      const yy = y < -0.35 ? -0.35 - (y + 0.35) * 0.15 : y > 0.6 ? 0.6 + (y - 0.6) * 0.5 : y;
      p.setXYZ(k, x * sx * bump, yy * 0.7 * bump, z * sz * bump);
      const shade = 0.85 + 0.25 * (y * 0.5 + 0.5);
      col.set([Math.min(1, c.r * shade), Math.min(1, c.g * shade), Math.min(1, c.b * shade)], k * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    let z = (r() - 0.5) * Math.min(50, W - 6);
    if (Math.abs(z) < 4.5) z += z >= 0 ? 4.5 : -4.5;
    const size = 0.3 + r() * r() * 0.9;
    g.scale(size, size, size);
    g.rotateY(r() * 6);
    g.translate(0.8 + r() * 1.8, size * 0.24, z);
    g.computeVertexNormals();
    rocks.push(g);
  }
  const boulders = new THREE.Mesh(mergeGeometries(rocks), new THREE.MeshStandardMaterial({ name: 'Boulder', vertexColors: true, roughness: 0.92 }));
  boulders.name = 'Boulders';
  boulders.castShadow = true;
  boulders.receiveShadow = true;
  const root = new THREE.Group();
  root.name = 'Cliff';
  root.add(faceMesh, capMesh, boulders);
  return { root, top };
}

/** The measuring tape on the ground from the cliff (0 m) to 41 m: one long strip with a 1 m tick tile repeated. */
function createTape() {
  const L = TAPE.length;
  const tile = canvasTex(
    256,
    64,
    (ctx, W, H) => {
      ctx.fillStyle = '#f2c230';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1d2733';
      ctx.fillRect(0, 0, 9, H); // the metre
      ctx.fillRect(W / 2 - 3, 0, 6, H * 0.55); // the half metre
      for (let k = 1; k < 10; k++) if (k !== 5) ctx.fillRect((k * W) / 10 - 1.5, 0, 3, H * 0.28);
      ctx.fillStyle = 'rgba(120,80,0,0.25)';
      ctx.fillRect(0, H - 4, W, 4);
    },
    { repeat: [L, 1] },
  );
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(L, TAPE.width).rotateX(-Math.PI / 2).translate(L / 2, 0.012, TAPE.z),
    new THREE.MeshStandardMaterial({ name: 'Tape', map: tile, roughness: 0.55 }),
  );
  strip.name = 'Tape';
  strip.receiveShadow = true;
  // the case at the far end and a steel peg at the cliff's foot
  const caseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.07, 32).rotateX(Math.PI / 2).translate(L + 0.16, 0.16, TAPE.z),
    new THREE.MeshStandardMaterial({ name: 'TapeCase', color: '#2b3440', roughness: 0.45, metalness: 0.2 }),
  );
  caseMesh.name = 'TapeCase';
  caseMesh.castShadow = true;
  const peg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.012, 0.3, 12).translate(0.02, 0.12, TAPE.z),
    new THREE.MeshStandardMaterial({ name: 'Peg', color: '#9aa3ad', roughness: 0.35, metalness: 0.8 }),
  );
  peg.name = 'Peg';
  // (the numbers every 5 m are words placed on the screen by the app: upright and a steady size)
  // the book's 16.5 m: a crimson band across the tape, shown once the student has found it
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, TAPE.width + 0.5).rotateX(-Math.PI / 2).translate(16.5, 0.018, TAPE.z),
    new THREE.MeshBasicMaterial({ name: 'MinMark', color: '#c2255c' }),
  );
  mark.name = 'Mark16_5';
  mark.visible = false;
  const root = new THREE.Group();
  root.name = 'MeasuringTape';
  root.add(strip, caseMesh, peg, mark);
  return { root, mark };
}

/** The ground, the cliff and the tape. */
export function createSetting() {
  const root = new THREE.Group();
  root.name = 'Setting';
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2).translate(150, 0, 0),
    new THREE.MeshStandardMaterial({ name: 'Ground', map: earth(), roughness: 1 }),
  );
  ground.name = 'Ground';
  ground.receiveShadow = true;
  const cliff = createCliff();
  const tape = createTape();
  root.add(ground, cliff.root, tape.root);
  return { root, ground, cliff: cliff.root, cliffTop: cliff.top, tape };
}
