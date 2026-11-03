// The apparatus, in metres (the bench top is y = 0): a long teak lab bench; on it a mechanical wave driver at x = 0
// (a powder-coated body with a speaker grille, a chrome drive shaft and a brass clamp holding the rope's end), fed by
// a signal generator behind it (its display shows the frequency); the rope (a braided cord whose surface is rebuilt
// every frame from y = a cos(kx − ωt)); a graph board behind the rope (0–3 m in tenths, ±0.1 m, the rest line) that is
// the metre scale; at the far end two foam pads that soak up the wave (so it does not come back), a pulley clamped on
// the bench's end and a slotted mass that keeps the rope taut. Procedural, no image files, modest in triangles.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { textMesh } from '@shared/student/materials.js';
import { LENGTH } from './reading.js';

export const Y0 = 0.3; // the rope's rest line above the bench top
export const BOARD = { x0: -0.06, x1: LENGTH + 0.16, y0: Y0 - 0.25, y1: Y0 + 0.17, z: -0.07 };
export const DAMP = { x0: LENGTH + 0.06, x1: LENGTH + 0.26 }; // the foam pads
export const PULLEY = { x: LENGTH + 0.5, r: 0.035 };
const BENCH = { x0: -0.75, x1: LENGTH + 0.42, z0: -0.5, z1: 0.32, t: 0.05 };
const SEG = 440; // rings along the rope
const RAD = 10; // sides round it
const ROPE_END = PULLEY.x; // the moving part ends over the pulley

function canvasTex(w, h, draw, { repeat = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 8;
  return t;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The backdrop: a calm slate blue at the top to a soft grey-blue low down (screen space). */
export function backdropTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#34495e');
    s.addColorStop(0.55, '#5d7a8c');
    s.addColorStop(1, '#93a8b3');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/** A braided cord: two sets of strands crossing (u runs along the rope, v round it). */
function braid(base, strand, fleck, seed) {
  return canvasTex(
    128,
    64,
    (g, W, H) => {
      const r = rng(seed);
      g.fillStyle = base;
      g.fillRect(0, 0, W, H);
      for (const dir of [1, -1])
        for (let i = -8; i < 16; i++) {
          g.strokeStyle = strand;
          g.lineWidth = 5;
          g.beginPath();
          const x = i * 16;
          g.moveTo(x, 0);
          g.lineTo(x + dir * H * 0.9, H);
          g.stroke();
          g.strokeStyle = 'rgba(0,0,0,0.35)';
          g.lineWidth = 1.2;
          g.beginPath();
          g.moveTo(x + 3, 0);
          g.lineTo(x + 3 + dir * H * 0.9, H);
          g.stroke();
        }
      for (let i = 0; i < 90; i++) {
        g.fillStyle = fleck;
        g.globalAlpha = 0.25 + r() * 0.4;
        g.fillRect(r() * W, r() * H, 1 + r() * 2, 1);
      }
      g.globalAlpha = 1;
    },
    { repeat: [1, 1] },
  );
}

/** Teak planks along x, for the bench top. */
function teak() {
  return canvasTex(
    1024,
    256,
    (g, W, H) => {
      const r = rng(11);
      g.fillStyle = '#9a5a2c';
      g.fillRect(0, 0, W, H);
      for (let p = 0; p < 4; p++) {
        const y0 = (p * H) / 4;
        g.fillStyle = `hsl(${22 + r() * 6}, ${44 + r() * 10}%, ${33 + r() * 7}%)`;
        g.fillRect(0, y0, W, H / 4);
        for (let i = 0; i < 16; i++) {
          const y = y0 + r() * (H / 4);
          g.strokeStyle = `rgba(60,28,8,${0.1 + r() * 0.22})`;
          g.lineWidth = 0.6 + r() * 1.4;
          g.beginPath();
          for (let x = 0; x <= W; x += 16) {
            const yy = y + Math.sin(x * 0.006 + i * 1.7) * 2.5;
            x ? g.lineTo(x, yy) : g.moveTo(x, yy);
          }
          g.stroke();
        }
        g.fillStyle = 'rgba(30,12,2,0.55)';
        g.fillRect(0, y0, W, 2);
      }
    },
    { repeat: [2, 1] },
  );
}

/** A dark vinyl floor that fades into the backdrop far away. */
function floorTex() {
  return canvasTex(256, 256, (g, W, H) => {
    const grad = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2);
    grad.addColorStop(0, 'rgba(70,84,96,1)');
    grad.addColorStop(0.6, 'rgba(80,98,112,0.9)');
    grad.addColorStop(1, 'rgba(120,142,156,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
  });
}

/** The grille of the driver's speaker: a dark disc with rows of holes. */
function grilleTex() {
  return canvasTex(128, 128, (g, W) => {
    g.fillStyle = '#1b1e22';
    g.fillRect(0, 0, W, W);
    g.fillStyle = '#3a4048';
    for (let y = 4; y < W; y += 8) for (let x = (y / 8) % 2 ? 4 : 8; x < W; x += 8) g.fillRect(x, y, 3, 3);
  });
}

export function apparatusMaterials() {
  return {
    teak: new THREE.MeshStandardMaterial({ map: teak(), roughness: 0.55, metalness: 0 }),
    teakDark: new THREE.MeshStandardMaterial({ color: '#5e3518', roughness: 0.6 }),
    floor: new THREE.MeshStandardMaterial({ map: floorTex(), transparent: true, roughness: 0.9, depthWrite: false }),
    body: new THREE.MeshStandardMaterial({ color: '#2f3a48', roughness: 0.48, metalness: 0.25 }),
    bodyDark: new THREE.MeshStandardMaterial({ color: '#1d232b', roughness: 0.6, metalness: 0.2 }),
    panel: new THREE.MeshStandardMaterial({ color: '#c9ced6', roughness: 0.5, metalness: 0.35 }),
    grille: new THREE.MeshStandardMaterial({ map: grilleTex(), roughness: 0.8 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#e6eaef', roughness: 0.16, metalness: 1 }),
    steel: new THREE.MeshStandardMaterial({ color: '#a9b0b8', roughness: 0.38, metalness: 0.9 }),
    alu: new THREE.MeshStandardMaterial({ color: '#cfd5dc', roughness: 0.32, metalness: 0.85 }),
    brass: new THREE.MeshStandardMaterial({ color: '#c99a3e', roughness: 0.32, metalness: 0.9 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#16181b', roughness: 0.9 }),
    red: new THREE.MeshStandardMaterial({ color: '#c92a2a', roughness: 0.45 }),
    black: new THREE.MeshStandardMaterial({ color: '#202225', roughness: 0.45 }),
    lcd: new THREE.MeshStandardMaterial({ color: '#203a2f', roughness: 0.25, emissive: '#0d2219' }),
    foam: new THREE.MeshStandardMaterial({ color: '#4b535c', roughness: 1 }),
    board: new THREE.MeshStandardMaterial({ color: '#f7f1df', roughness: 0.85 }),
    frame: new THREE.MeshStandardMaterial({ color: '#7a4a24', roughness: 0.6 }),
    gridFine: new THREE.LineBasicMaterial({ color: '#b9cde0' }),
    gridBold: new THREE.LineBasicMaterial({ color: '#7f9fbd' }),
    rest: new THREE.LineBasicMaterial({ color: '#33475b' }),
    bead: new THREE.MeshStandardMaterial({ color: '#2b8a3e', roughness: 0.35, emissive: '#0b3d17', emissiveIntensity: 0.4 }),
    light: new THREE.MeshStandardMaterial({ map: braid('#2a2f37', '#4c5561', '#c9d1db', 3), roughness: 0.75 }),
    heavy: new THREE.MeshStandardMaterial({ map: braid('#7a5a30', '#a07a45', '#f0dcae', 5), roughness: 0.9 }),
  };
}

// ── the bench, the floor ─────────────────────────────────────────────────────
function createBench(m) {
  const g = new THREE.Group();
  g.name = 'Bench';
  const w = BENCH.x1 - BENCH.x0;
  const d = BENCH.z1 - BENCH.z0;
  const top = new THREE.Mesh(new RoundedBoxGeometry(w, BENCH.t, d, 2, 0.008), m.teak);
  top.position.set((BENCH.x0 + BENCH.x1) / 2, -BENCH.t / 2, (BENCH.z0 + BENCH.z1) / 2);
  top.receiveShadow = true;
  const apron = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.1, d - 0.1), m.teakDark);
  apron.position.set(top.position.x, -BENCH.t - 0.05, top.position.z);
  const legs = [];
  for (const x of [BENCH.x0 + 0.08, BENCH.x1 - 0.08])
    for (const z of [BENCH.z0 + 0.08, BENCH.z1 - 0.08]) legs.push(new THREE.BoxGeometry(0.07, 0.8, 0.07).translate(x, -0.45, z));
  const legMesh = new THREE.Mesh(mergeGeometries(legs), m.teakDark);
  g.add(top, apron, legMesh);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), m.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(1.4, -0.85, -0.5);
  floor.userData.noExport = true;
  g.add(floor);
  return g;
}

// ── the graph board (the metre scale) ────────────────────────────────────────
function createBoard(m, N) {
  const g = new THREE.Group();
  g.name = 'GraphBoard';
  const { x0, x1, y0, y1, z } = BOARD;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), m.board);
  face.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
  face.receiveShadow = true;
  const frameParts = [];
  const fw = 0.018;
  frameParts.push(new THREE.BoxGeometry(x1 - x0 + 2 * fw, fw, 0.02).translate((x0 + x1) / 2, y1 + fw / 2, z - 0.004));
  frameParts.push(new THREE.BoxGeometry(x1 - x0 + 2 * fw, fw, 0.02).translate((x0 + x1) / 2, y0 - fw / 2, z - 0.004));
  frameParts.push(new THREE.BoxGeometry(fw, y1 - y0, 0.02).translate(x0 - fw / 2, (y0 + y1) / 2, z - 0.004));
  frameParts.push(new THREE.BoxGeometry(fw, y1 - y0, 0.02).translate(x1 + fw / 2, (y0 + y1) / 2, z - 0.004));
  frameParts.push(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.012).translate((x0 + x1) / 2, (y0 + y1) / 2, z - 0.01));
  // feet that hold it upright on the bench
  for (const x of [0.3, LENGTH - 0.3]) {
    frameParts.push(new THREE.BoxGeometry(0.03, y0 + 0.002, 0.03).translate(x, (y0 + 0.002) / 2, z - 0.01));
    frameParts.push(new THREE.BoxGeometry(0.08, 0.016, 0.12).translate(x, 0.008, z - 0.01));
  }
  const frame = new THREE.Mesh(mergeGeometries(frameParts), m.frame);
  frame.castShadow = true;
  frame.receiveShadow = true;
  g.add(face, frame);

  // the grid: every 0.1 m along, every 0.025 m up (bold every 0.5 m and 0.05 m), the rest line darker
  const zz = z + 0.001;
  const fine = [];
  const bold = [];
  const gy0 = Y0 - 0.15;
  const gy1 = Y0 + 0.15;
  for (let i = 0; i <= LENGTH * 10; i++) {
    const x = i / 10;
    (i % 5 === 0 ? bold : fine).push(x, gy0, zz, x, gy1, zz);
  }
  for (let j = -6; j <= 6; j++) {
    if (j === 0) continue;
    const y = Y0 + j * 0.025;
    (j % 2 === 0 ? bold : fine).push(0, y, zz, LENGTH, y, zz);
  }
  const lines = (arr, mat) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return new THREE.LineSegments(geo, mat);
  };
  g.add(lines(fine, m.gridFine), lines(bold, m.gridBold));
  // the rest line (সাম্যাবস্থা), a little thicker: three lines close together
  const rest = [];
  for (const d of [-0.0012, 0, 0.0012]) rest.push(0, Y0 + d, zz + 0.0005, LENGTH, Y0 + d, zz + 0.0005);
  g.add(lines(rest, m.rest));

  // the metre scale along the bottom: ticks every 0.05 m, numbers every 0.5 m, "m" at the end
  const ticks = [];
  const sy = Y0 - 0.17;
  for (let i = 0; i <= LENGTH * 20; i++) {
    const x = i / 20;
    const h = i % 10 === 0 ? 0.03 : i % 2 === 0 ? 0.02 : 0.012;
    ticks.push(x, sy, zz, x, sy - h, zz);
  }
  ticks.push(0, sy, zz, LENGTH, sy, zz);
  g.add(lines(ticks, m.rest));
  const numbers = new THREE.Group();
  numbers.name = 'ScaleNumbers';
  for (let i = 0; i <= LENGTH * 2; i++) {
    const n = textMesh(N(i / 2), 0.034, { color: '#22303d', weight: 700 });
    n.position.set(i / 2, sy - 0.052, zz + 0.001);
    numbers.add(n);
  }
  const unit = textMesh('m', 0.03, { color: '#22303d', weight: 700 });
  unit.position.set(LENGTH + 0.09, sy - 0.05, zz + 0.001);
  numbers.add(unit);
  // the displacement marks at the right end
  for (const [v, label] of [
    [0.1, N(0.1)],
    [0, N(0)],
    [-0.1, `−${N(0.1)}`],
  ]) {
    const n = textMesh(label, 0.026, { color: '#22303d', weight: 600, align: 'left' });
    n.position.set(LENGTH + 0.02, Y0 + v, zz + 0.001);
    numbers.add(n);
  }
  g.add(numbers);
  return g;
}

// ── the rope (rebuilt every frame) ───────────────────────────────────────────
/**
 * A tube along the curve (x, Y0 + y(x)) from x = 0 to the pulley, with `SEG` rings of `RAD` sides. `set(radius,
 * yOf(x), slopeOf(x))` moves its vertices in place (no new objects).
 */
function createRopeMesh(material) {
  const nV = (SEG + 1) * (RAD + 1);
  const pos = new Float32Array(nV * 3);
  const nor = new Float32Array(nV * 3);
  const uv = new Float32Array(nV * 2);
  const idx = [];
  for (let i = 0; i <= SEG; i++)
    for (let j = 0; j <= RAD; j++) {
      const k = i * (RAD + 1) + j;
      uv[2 * k] = ((i / SEG) * ROPE_END) / 0.03;
      uv[2 * k + 1] = j / RAD;
      if (i < SEG && j < RAD) {
        const a = k;
        const b = k + RAD + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = 'Rope';
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  const cos = [];
  const sin = [];
  for (let j = 0; j <= RAD; j++) {
    cos.push(Math.cos((j / RAD) * Math.PI * 2));
    sin.push(Math.sin((j / RAD) * Math.PI * 2));
  }
  return {
    mesh,
    set(radius, yOf, slopeOf) {
      for (let i = 0; i <= SEG; i++) {
        const x = (i / SEG) * ROPE_END;
        const y = Y0 + yOf(x);
        const s = slopeOf(x);
        const l = Math.hypot(1, s);
        // the tangent (1, s)/l; the normal in the xy plane (−s, 1)/l; and z
        const nx = -s / l;
        const ny = 1 / l;
        for (let j = 0; j <= RAD; j++) {
          const k = (i * (RAD + 1) + j) * 3;
          const ox = nx * cos[j];
          const oy = ny * cos[j];
          const oz = sin[j];
          pos[k] = x + radius * ox;
          pos[k + 1] = y + radius * oy;
          pos[k + 2] = radius * oz;
          nor[k] = ox;
          nor[k + 1] = oy;
          nor[k + 2] = oz;
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.normal.needsUpdate = true;
    },
  };
}

/** How much of the wave is left at x: all of it on the board, none past the foam pads. */
export function envelope(x) {
  if (x <= LENGTH + 0.02) return 1;
  if (x >= DAMP.x1 - 0.02) return 0;
  const k = (x - LENGTH - 0.02) / (DAMP.x1 - 0.04 - LENGTH);
  return 0.5 + 0.5 * Math.cos(Math.PI * k);
}

// ── the wave driver and the signal generator ─────────────────────────────────
function createDriver(m) {
  const g = new THREE.Group();
  g.name = 'WaveDriver';
  const W = 0.15;
  const H = 0.16;
  const D = 0.15;
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, 0.014), m.body);
  body.position.set(0, H / 2 + 0.008, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  // a darker top plate with the shaft's boss
  const plate = new THREE.Mesh(new RoundedBoxGeometry(W * 0.86, 0.01, D * 0.86, 2, 0.004), m.bodyDark);
  plate.position.set(0, H + 0.01, 0);
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.016, 28), m.steel);
  boss.position.set(0, H + 0.022, 0);
  // the speaker grille on the front (toward the camera, +z)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.005, 10, 40), m.steel);
  ring.position.set(0, H / 2 + 0.01, D / 2 + 0.002);
  const grille = new THREE.Mesh(new THREE.CircleGeometry(0.046, 40), m.grille);
  grille.position.set(0, H / 2 + 0.01, D / 2 + 0.0015);
  // rubber feet
  const feet = [];
  for (const x of [-W / 2 + 0.02, W / 2 - 0.02])
    for (const z of [-D / 2 + 0.02, D / 2 - 0.02]) feet.push(new THREE.CylinderGeometry(0.012, 0.012, 0.008, 14).translate(x, 0.004, z));
  const footMesh = new THREE.Mesh(mergeGeometries(feet), m.rubber);
  // two sockets on the left side (red, black)
  const sockR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.014, 16).rotateZ(Math.PI / 2), m.red);
  sockR.position.set(-W / 2 - 0.005, H * 0.55, 0.03);
  const sockB = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.014, 16).rotateZ(Math.PI / 2), m.black);
  sockB.position.set(-W / 2 - 0.005, H * 0.55, -0.01);
  g.add(body, plate, boss, ring, grille, footMesh, sockR, sockB);

  // the moving part: the shaft and the clamp on the rope
  const shaft = new THREE.Group();
  shaft.name = 'DriveShaft';
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 1, 16).translate(0, 0.5, 0), m.chrome);
  rod.castShadow = true;
  const clamp = new THREE.Mesh(new RoundedBoxGeometry(0.024, 0.026, 0.03, 2, 0.004), m.brass);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.02, 12).rotateX(Math.PI / 2), m.steel);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 16).rotateX(Math.PI / 2), m.black);
  shaft.add(rod, clamp, screw, knob);
  g.add(shaft);
  const shaftBase = H + 0.03;
  return {
    root: g,
    /** The shaft's top (the rope's end) at height y above the bench. */
    setEnd(y) {
      const len = Math.max(0.01, y - shaftBase);
      rod.position.y = shaftBase;
      rod.scale.y = len;
      clamp.position.set(0, y, 0);
      screw.position.set(0, y, 0.022);
      knob.position.set(0, y, 0.034);
    },
    sockets: { red: sockR.position.clone(), black: sockB.position.clone() },
  };
}

/** The signal generator: a grey case, a front panel with a display (`setDisplay(text)`), a knob and sockets. */
function createGenerator(m) {
  const g = new THREE.Group();
  g.name = 'SignalGenerator';
  const W = 0.3;
  const H = 0.12;
  const D = 0.22;
  const box = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, 0.01), m.body);
  box.position.set(0, H / 2 + 0.006, 0);
  box.castShadow = true;
  box.receiveShadow = true;
  const face = new THREE.Mesh(new RoundedBoxGeometry(W * 0.94, H * 0.84, 0.006, 2, 0.003), m.panel);
  face.position.set(0, H / 2 + 0.006, D / 2 + 0.001);
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.135, 0.052), m.lcd);
  lcd.position.set(-0.055, H / 2 + 0.014, D / 2 + 0.0045);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.022, 32).rotateX(Math.PI / 2), m.black);
  knob.position.set(0.085, H / 2 + 0.012, D / 2 + 0.014);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.004, 24).rotateX(Math.PI / 2), m.alu);
  cap.position.set(0.085, H / 2 + 0.012, D / 2 + 0.026);
  const btns = [];
  for (const x of [-0.1, -0.07, -0.04, -0.01]) btns.push(new RoundedBoxGeometry(0.02, 0.01, 0.008, 1, 0.002).translate(x, 0.025, D / 2 + 0.006));
  const btnMesh = new THREE.Mesh(mergeGeometries(btns), m.bodyDark);
  const sR = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.012, 16).rotateX(Math.PI / 2), m.red);
  sR.position.set(0.035, 0.03, D / 2 + 0.008);
  const sB = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.012, 16).rotateX(Math.PI / 2), m.black);
  sB.position.set(0.035, 0.065, D / 2 + 0.008);
  const feet = [];
  for (const x of [-W / 2 + 0.03, W / 2 - 0.03])
    for (const z of [-D / 2 + 0.03, D / 2 - 0.03]) feet.push(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 12).translate(x, 0.003, z));
  g.add(box, face, lcd, knob, cap, btnMesh, sR, sB, new THREE.Mesh(mergeGeometries(feet), m.rubber));
  let text = null;
  return {
    root: g,
    lcd,
    setDisplay(s) {
      if (text) {
        g.remove(text);
        text.geometry.dispose();
        text.material.dispose();
      }
      text = textMesh(s, 0.026, { color: '#a8f0c6', weight: 700 });
      text.position.set(lcd.position.x, lcd.position.y, lcd.position.z + 0.001);
      g.add(text);
    },
    sockets: { red: sR.position.clone(), black: sB.position.clone() },
  };
}

/** A cable as a tube through a few points. */
function cable(points, mat) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0035, 8), mat);
  mesh.castShadow = true;
  return mesh;
}

// ── the far end: foam pads, the pulley, the mass ─────────────────────────────
function createFarEnd(m) {
  const g = new THREE.Group();
  g.name = 'FarEnd';
  const w = DAMP.x1 - DAMP.x0;
  const cx = (DAMP.x0 + DAMP.x1) / 2;
  // two foam pads pressing on the rope from above and below, held in a steel frame on a small stand
  const padGeo = new RoundedBoxGeometry(w, 0.05, 0.07, 3, 0.012);
  const top = new THREE.Mesh(padGeo, m.foam);
  top.position.set(cx, Y0 + 0.032, 0);
  const bottom = new THREE.Mesh(padGeo, m.foam);
  bottom.position.set(cx, Y0 - 0.032, 0);
  const parts = [
    new THREE.BoxGeometry(w + 0.03, 0.008, 0.012).translate(cx, Y0 + 0.062, -0.04),
    new THREE.BoxGeometry(0.012, 0.15, 0.012).translate(cx, Y0, -0.046),
    new THREE.BoxGeometry(0.012, Y0 - 0.075, 0.012).translate(cx, (Y0 - 0.075) / 2, -0.046),
    new THREE.BoxGeometry(0.1, 0.012, 0.1).translate(cx, 0.006, -0.03),
  ];
  const frame = new THREE.Mesh(mergeGeometries(parts), m.steel);
  frame.castShadow = true;
  for (const p of [top, bottom]) p.castShadow = true;
  // the pulley: an aluminium wheel with a groove, on a bracket clamped to the bench's end
  const prof = [];
  const r = PULLEY.r;
  for (const [pr, pz] of [
    [0.006, -0.012],
    [r, -0.012],
    [r, -0.008],
    [r - 0.008, -0.002],
    [r - 0.008, 0.002],
    [r, 0.008],
    [r, 0.012],
    [0.006, 0.012],
  ])
    prof.push(new THREE.Vector2(pr, pz));
  const wheel = new THREE.Mesh(new THREE.LatheGeometry(prof, 40).rotateX(Math.PI / 2), m.alu);
  wheel.position.set(PULLEY.x, Y0 - r + 0.008, 0);
  wheel.castShadow = true;
  const bx = PULLEY.x;
  const bracket = new THREE.Mesh(
    mergeGeometries([
      new THREE.BoxGeometry(0.01, 0.1, 0.006).translate(bx, Y0 - r - 0.03, -0.018),
      new THREE.BoxGeometry(0.01, 0.1, 0.006).translate(bx, Y0 - r - 0.03, 0.018),
      new THREE.BoxGeometry(0.11, 0.014, 0.05).translate(bx - 0.06, Y0 - r - 0.085, 0),
      new THREE.BoxGeometry(0.014, Y0 - r - 0.07, 0.05).translate(bx - 0.11, (Y0 - r - 0.08) / 2, 0),
      new THREE.BoxGeometry(0.06, 0.014, 0.06).translate(BENCH.x1 - 0.03, 0.007, 0),
      new THREE.BoxGeometry(0.06, 0.014, 0.06).translate(BENCH.x1 - 0.03, -BENCH.t - 0.007, 0),
      new THREE.BoxGeometry(0.014, BENCH.t + 0.028, 0.06).translate(BENCH.x1 + 0.007, -BENCH.t / 2, 0),
    ]),
    m.steel,
  );
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.046, 12).rotateX(Math.PI / 2), m.chrome);
  axle.position.copy(wheel.position);
  // the slotted mass on its hanger
  const hx = PULLEY.x + r - 0.008;
  const hang = new THREE.Group();
  const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.1, 8), m.steel);
  hook.position.set(hx, -0.33, 0);
  hang.add(hook);
  for (let i = 0; i < 4; i++) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.016, 32), m.brass);
    disc.position.set(hx, -0.4 - i * 0.017, 0);
    disc.castShadow = true;
    hang.add(disc);
  }
  g.add(top, bottom, frame, wheel, bracket, axle, hang);
  return { root: g, hangX: hx, wheel };
}

/**
 * The whole apparatus. `N` writes numbers (Bangla digits). Returns its parts; `setRope(kind, yOf, slopeOf)` draws the
 * rope (`kind`: 'light' | 'heavy'), `setDriver(y)` moves the shaft, `bead` is the marked particle.
 */
export function createApparatus(m, N) {
  const root = new THREE.Group();
  root.name = 'RopeWaveApparatus';
  const bench = createBench(m);
  const board = createBoard(m, N);
  const driver = createDriver(m);
  const gen = createGenerator(m);
  gen.root.position.set(-0.36, 0, -0.26);
  gen.root.rotation.y = 0.28;
  const far = createFarEnd(m);
  // the two cables from the generator to the driver
  const cables = new THREE.Group();
  cables.name = 'Cables';
  gen.root.updateMatrixWorld(true);
  for (const [k, mat] of [
    ['red', m.red],
    ['black', m.black],
  ]) {
    const a = gen.sockets[k].clone().applyMatrix4(gen.root.matrixWorld);
    const b = driver.sockets[k].clone();
    cables.add(
      cable(
        [
          a,
          a.clone().add(new THREE.Vector3(0.02, -0.02, 0.06)),
          new THREE.Vector3((a.x + b.x) / 2, 0.006, (a.z + b.z) / 2 + 0.12),
          b.clone().add(new THREE.Vector3(-0.05, -0.04, 0)),
          b,
        ],
        mat,
      ),
    );
  }
  const ropes = { light: createRopeMesh(m.light), heavy: createRopeMesh(m.heavy) };
  // the hanging part of the rope (from the pulley down to the hanger)
  const drop = {
    light: new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, -0.5, 0), m.light),
    heavy: new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, -0.5, 0), m.heavy),
  };
  const bead = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), m.bead);
  bead.name = 'MarkedParticle';
  bead.castShadow = true;
  root.add(bench, board, driver.root, gen.root, cables, far.root, ropes.light.mesh, ropes.heavy.mesh, drop.light, drop.heavy, bead);
  return {
    root,
    board,
    driver,
    gen,
    bead,
    setRope(kind, radius, yOf, slopeOf) {
      for (const k of /** @type {const} */ (['light', 'heavy'])) {
        ropes[k].mesh.visible = k === kind;
        drop[k].visible = k === kind;
      }
      ropes[kind].set(radius, yOf, slopeOf);
      const d = drop[kind];
      const top = Y0 - PULLEY.r + 0.008;
      d.position.set(far.hangX + radius * 0.2, top, 0);
      d.scale.set(radius, top + 0.28, radius);
    },
    ropeMesh: (kind) => ropes[kind].mesh,
  };
}
