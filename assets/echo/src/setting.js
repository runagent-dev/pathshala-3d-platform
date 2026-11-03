// The setting, in metres: a tall sandstone cliff (খাড়া পাহাড়) whose face is the plane x = 0 (facing +x), flat dry
// ground in front of it, a clear late-afternoon sky with a warm haze at the horizon (fog), and a yellow measuring tape
// laid on the ground from the foot of the cliff (0 m) out to 41 m, its numbers every 5 m kept upright and a steady size
// on the screen by the app. Procedural, no image files: the cliff is one displaced grid with layered (strata) vertex
// colours and a fine rock texture, a darker top, and a few fallen boulders at its foot.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { textMesh } from '@shared/student/materials.js';

export const CLIFF = { width: 420, height: 13, depth: 26 };
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

/** Fine rock detail: grain, pits and hairline cracks (grey, multiplied over the strata colours). */
function rockDetail() {
  return canvasTex(
    512,
    512,
    (ctx, W, H) => {
      const r = rng(23);
      ctx.fillStyle = '#d8d8d8';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 14000; i++) {
        const l = 62 + r() * 38;
        ctx.fillStyle = `hsla(30, 6%, ${l}%, ${0.25 + r() * 0.4})`;
        const d = 1 + r() * 2.5;
        ctx.fillRect(r() * W, r() * H, d, d);
      }
      ctx.lineCap = 'round';
      for (let i = 0; i < 46; i++) {
        let x = r() * W;
        let y = r() * H;
        ctx.strokeStyle = `rgba(55,40,30,${0.25 + r() * 0.35})`;
        ctx.lineWidth = 0.8 + r() * 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const steps = 4 + Math.floor(r() * 8);
        const vertical = r() > 0.35;
        for (let k = 0; k < steps; k++) {
          x += vertical ? (r() - 0.5) * 14 : 10 + r() * 16;
          y += vertical ? 10 + r() * 18 : (r() - 0.5) * 8;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    { repeat: [10, 3] },
  );
}

/** The strata: a warm sandstone colour for a height on the face (m), with a little variation. */
function strata(y, n) {
  const bands = ['#b8835a', '#c99a6e', '#a8704a', '#d0a77c', '#9c6a48', '#bf9068', '#b07c55'];
  const yy = y + n * 0.9;
  const i = Math.floor(yy / 2.3);
  const c = new THREE.Color(bands[((i % bands.length) + bands.length) % bands.length]);
  const next = new THREE.Color(bands[(((i + 1) % bands.length) + bands.length) % bands.length]);
  c.lerp(next, THREE.MathUtils.smoothstep(yy / 2.3 - i, 0.75, 1));
  return c;
}

/** The cliff: its face (x ≈ 0, relief ±0.5 m), its top, and boulders at its foot. */
function createCliff() {
  const { width: W, height: H, depth: D } = CLIFF;
  const n = noise2(5);
  const nTop = noise2(9);
  const SX = 300;
  const SY = 32;
  const top = (z) => H + 2.4 * fbm(nTop, z * 0.035, 0.5, 3) + 0.9 * Math.sin(z * 0.05);
  const relief = (z, y) =>
    0.55 * fbm(n, z * 0.18, y * 0.22) + 0.25 * fbm(n, z * 0.7 + 30, y * 0.9) + 0.18 * Math.sin(y * 2.7 + fbm(n, z * 0.1, 3) * 3);
  // the face: z across, y up, displaced along x (the mean plane stays x = 0: what the sound reflects from)
  const face = new THREE.PlaneGeometry(W, 1, SX, SY);
  face.rotateY(Math.PI / 2); // the plane in y–z, facing +x
  const pos = face.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const v = pos.getY(i) + 0.5; // 0…1
    const y = v * top(z);
    const nn = fbm(n, z * 0.2 + 7, y * 0.25);
    // a slight overhang near the top, a little scree slope at the bottom
    const foot = Math.max(0, 1 - y / 1.4) ** 2 * 0.9;
    pos.setXYZ(i, relief(z, y) + foot - 0.12 * (y / H), y, z);
    c.copy(strata(y, nn)).multiplyScalar(0.92 + 0.16 * nn);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  face.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  face.computeVertexNormals();
  // the top, going back into the hill: dry, darker rock
  const cap = new THREE.PlaneGeometry(D, W, 8, SX);
  cap.rotateX(-Math.PI / 2); // x across the depth, z along the cliff
  const cp = cap.attributes.position;
  const ccol = new Float32Array(cp.count * 3);
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
  const mat = new THREE.MeshStandardMaterial({ name: 'Sandstone', vertexColors: true, map: rockDetail(), roughness: 0.95 });
  const capMat = new THREE.MeshStandardMaterial({ name: 'CliffTop', vertexColors: true, roughness: 1 });
  const faceMesh = new THREE.Mesh(face, mat);
  faceMesh.name = 'CliffFace';
  faceMesh.receiveShadow = true;
  const capMesh = new THREE.Mesh(cap, capMat);
  capMesh.name = 'CliffTop';
  // boulders fallen at the foot (a few, merged), off the line of the tape
  const r = rng(31);
  const rocks = [];
  for (let i = 0; i < 16; i++) {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const s = 0.75 + r() * 0.5;
      p.setXYZ(k, p.getX(k) * s, p.getY(k) * s * 0.7, p.getZ(k) * s);
    }
    let z = (r() - 0.5) * 60;
    if (Math.abs(z - TAPE.z) < 3) z += z > TAPE.z ? 3 : -3;
    const size = 0.35 + r() * r() * 1.3;
    g.scale(size, size, size);
    g.rotateY(r() * 6);
    g.translate(0.4 + r() * 1.6, size * 0.45, z);
    rocks.push(g.toNonIndexed());
  }
  const boulders = new THREE.Mesh(
    mergeGeometries(rocks),
    new THREE.MeshStandardMaterial({ name: 'Boulder', color: '#a77b57', map: rockDetail(), roughness: 0.95, flatShading: true }),
  );
  boulders.name = 'Boulders';
  boulders.castShadow = true;
  boulders.receiveShadow = true;
  const root = new THREE.Group();
  root.name = 'Cliff';
  root.add(faceMesh, capMesh, boulders);
  return { root, top };
}

/** The measuring tape on the ground from the cliff (0 m) to 41 m: one long strip with a 1 m tick tile repeated. */
function createTape(digits) {
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
  // the numbers every 5 m (turned to the camera by the app)
  const numbers = [];
  for (let m = 0; m <= 40; m += 5) {
    const t = textMesh(digits(m), 1, { color: '#1d2733', weight: 700 });
    t.position.set(m, 0.05, TAPE.z + TAPE.width / 2 + 0.05);
    t.geometry.translate(0, 0.6, 0); // stands on its point
    t.userData.noExport = true;
    t.renderOrder = 2;
    numbers.push(t);
  }
  // the book's 16.5 m: a crimson band across the tape, shown once the student has found it
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, TAPE.width + 0.5).rotateX(-Math.PI / 2).translate(16.5, 0.018, TAPE.z),
    new THREE.MeshBasicMaterial({ name: 'MinMark', color: '#c2255c' }),
  );
  mark.name = 'Mark16_5';
  mark.visible = false;
  const root = new THREE.Group();
  root.name = 'MeasuringTape';
  root.add(strip, caseMesh, peg, mark, ...numbers);
  return { root, numbers, mark };
}

/** The ground, the cliff and the tape. */
export function createSetting(digits) {
  const root = new THREE.Group();
  root.name = 'Setting';
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2).translate(150, 0, 0),
    new THREE.MeshStandardMaterial({ name: 'Ground', map: earth(), roughness: 1 }),
  );
  ground.name = 'Ground';
  ground.receiveShadow = true;
  const cliff = createCliff();
  const tape = createTape(digits);
  root.add(ground, cliff.root, tape.root);
  return { root, ground, cliff: cliff.root, cliffTop: cliff.top, tape };
}
