// The ground the student walks on, seen from the side as a cut-away block: its top is the path the feet stand on and
// its front face shows what lies under it. Firm ground (packed earth with pebbles over clay), loose sand (rippled
// sand over earth) or a smooth floor made slippery with soapy water or oil (polished tiles over a concrete screed).
// Real size in metres; the top is at y = 0, the student's feet are at z = +0.1. Each ground also shows what the foot
// did to it: nothing on firm ground, a heap of sand pushed back on sand, a smear of foam where the foot slid on the
// slippery floor. The pictures are drawn once on small canvases (seeded, so every run looks the same) and shared with
// the enlarged view of the contact (contact.js), which shows the same ground magnified.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const SLAB = { x0: -8, x1: 10, depth: 0.8, thick: 1.6 };
const FOOT_Z = 0.1;
const TOP_TILE = 0.8; // m of ground in one picture of the top
const SIDE_TILE = 1; // m of ground in one picture of the front face (its height is the slab's)

/** A seeded random number generator (the same ground every time). */
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  return c;
}

/** Soft blotches that tile seamlessly (each drawn again across the edges). */
function blotches(g, w, h, rnd, n, rgb, alpha, rMin, rMax, wrapY = true) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = rMin + rnd() * (rMax - rMin);
    const a = alpha * (0.4 + rnd() * 0.6);
    for (const dx of [-w, 0, w])
      for (const dy of wrapY ? [-h, 0, h] : [0]) {
        const grad = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        grad.addColorStop(0, `rgba(${rgb},${a})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = grad;
        g.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
      }
  }
}

/** Small stones: an ellipse, a lit edge and a shadow under it. */
function pebbles(g, w, h, rnd, n, colors, rMin, rMax, yMin = 0, yMax = h) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = yMin + rnd() * (yMax - yMin);
    const rx = rMin + rnd() * (rMax - rMin);
    const ry = rx * (0.55 + rnd() * 0.4);
    const rot = rnd() * Math.PI;
    for (const dx of [-w, 0, w]) {
      g.fillStyle = 'rgba(40,28,18,0.35)';
      g.beginPath();
      g.ellipse(x + dx + 1, y + 1.5, rx, ry, rot, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = colors[Math.floor(rnd() * colors.length)];
      g.beginPath();
      g.ellipse(x + dx, y, rx, ry, rot, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.22)';
      g.beginPath();
      g.ellipse(x + dx - rx * 0.25, y - ry * 0.3, rx * 0.45, ry * 0.35, rot, 0, Math.PI * 2);
      g.fill();
    }
  }
}

/** Fine grains: one-pixel dots in a few shades. */
function grains(g, w, h, rnd, n, colors, size = 1.2, yMin = 0, yMax = h) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(rnd() * colors.length)];
    g.globalAlpha = 0.45 + rnd() * 0.5;
    const s = size * (0.6 + rnd() * 0.8);
    g.fillRect(rnd() * w, yMin + rnd() * (yMax - yMin), s, s);
  }
  g.globalAlpha = 1;
}

/** The top of each ground (one picture is TOP_TILE m square). */
const TOPS = {
  hard: (g, w, h) => {
    const rnd = rng(11);
    g.fillStyle = '#8c7457';
    g.fillRect(0, 0, w, h);
    blotches(g, w, h, rnd, 40, '112,88,62', 0.55, 20, 70);
    blotches(g, w, h, rnd, 26, '170,146,112', 0.45, 15, 55);
    grains(g, w, h, rnd, 5000, ['#6a5440', '#a58d6c', '#7b6249', '#b9a07c'], 1.6);
    // hairline cracks of dry, packed earth
    g.strokeStyle = 'rgba(62,46,32,0.55)';
    g.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) {
      let x = rnd() * w;
      let y = rnd() * h;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (rnd() - 0.5) * 40;
        y += (rnd() - 0.5) * 40;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    pebbles(g, w, h, rnd, 70, ['#9c968c', '#b8ad98', '#7f776c', '#c4a77d', '#a5826a'], 2, 7);
  },
  sand: (g, w, h) => {
    const rnd = rng(23);
    g.fillStyle = '#ddbf86';
    g.fillRect(0, 0, w, h);
    blotches(g, w, h, rnd, 30, '196,160,100', 0.4, 25, 80);
    blotches(g, w, h, rnd, 24, '240,218,170', 0.45, 20, 60);
    // wind ripples across the sand (tile in both directions: whole waves per picture)
    for (let k = 0; k < 9; k++) {
      const y0 = (k + 0.5) * (h / 9);
      g.strokeStyle = 'rgba(150,112,60,0.38)';
      g.lineWidth = 2.4;
      g.beginPath();
      for (let x = 0; x <= w; x += 4) g.lineTo(x, y0 + Math.sin((x / w) * Math.PI * 4 + k) * 6);
      g.stroke();
      g.strokeStyle = 'rgba(255,240,205,0.45)';
      g.lineWidth = 1.4;
      g.beginPath();
      for (let x = 0; x <= w; x += 4) g.lineTo(x, y0 - 3 + Math.sin((x / w) * Math.PI * 4 + k) * 6);
      g.stroke();
    }
    grains(g, w, h, rnd, 9000, ['#b48a4e', '#f4dfae', '#c9a46a', '#8f6e40', '#fff1cf'], 1.3);
    pebbles(g, w, h, rnd, 8, ['#c7b9a2', '#e9e0cf', '#a49176'], 1.5, 3.5);
  },
  slip: (g, w, h) => {
    const rnd = rng(37);
    // two by two polished tiles (terrazzo), with grout joints and a wet sheen
    g.fillStyle = '#b9c6cf';
    g.fillRect(0, 0, w, h);
    for (let ty = 0; ty < 2; ty++)
      for (let tx = 0; tx < 2; tx++) {
        const x0 = (tx * w) / 2;
        const y0 = (ty * h) / 2;
        g.fillStyle = (tx + ty) % 2 ? '#b2c0ca' : '#bfcbd3';
        g.fillRect(x0, y0, w / 2, h / 2);
      }
    grains(g, w, h, rnd, 2600, ['#8a9aa6', '#e9eef1', '#6f808c', '#d6c9b6', '#a3b3be'], 2.2);
    g.strokeStyle = '#7d8c97';
    g.lineWidth = 3;
    for (const p of [0, w / 2, w]) {
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, h);
      g.stroke();
      g.beginPath();
      g.moveTo(0, p);
      g.lineTo(w, p);
      g.stroke();
    }
    const sheen = g.createLinearGradient(0, 0, w, h);
    sheen.addColorStop(0, 'rgba(255,255,255,0.28)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
    sheen.addColorStop(1, 'rgba(255,255,255,0.18)');
    g.fillStyle = sheen;
    g.fillRect(0, 0, w, h);
  },
};

/**
 * The front face of each ground: what lies under the path, top to bottom, drawn in metres (`k` px per metre down the
 * face, which is SLAB.thick deep; one picture is SIDE_TILE m wide).
 */
const SIDES = {
  hard: (g, w, h, k) => {
    const rnd = rng(51);
    const soil = 0.14 * k;
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#6e5639');
    grad.addColorStop(soil / h, '#5d452d');
    grad.addColorStop((soil + 4) / h, '#7b5534');
    grad.addColorStop(0.55, '#6a4429');
    grad.addColorStop(1, '#4e3320');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    blotches(g, w, h, rnd, 60, '120,84,52', 0.5, 8, 30, false);
    blotches(g, w, h, rnd, 40, '58,38,22', 0.4, 6, 24, false);
    grains(g, w, h, rnd, 5000, ['#4a3420', '#8d6a48', '#3d2a19', '#a07a52'], 1.5);
    // roots in the top soil, stones lower down
    g.strokeStyle = 'rgba(48,32,18,0.7)';
    g.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      let x = rnd() * w;
      let y = 2;
      g.beginPath();
      g.moveTo(x, y);
      for (let n = 0; n < 5; n++) {
        x += (rnd() - 0.5) * 10;
        y += (soil / 5) * (0.6 + rnd() * 0.8);
        g.lineTo(x, y);
      }
      g.stroke();
    }
    pebbles(g, w, h, rnd, 70, ['#8f8a80', '#a8a090', '#6e675e', '#b49a74'], 2, 6, soil + 6, h);
    g.fillStyle = 'rgba(30,20,10,0.4)';
    g.fillRect(0, 0, w, 2);
  },
  sand: (g, w, h, k) => {
    const rnd = rng(63);
    const grad0 = g.createLinearGradient(0, 0, 0, h);
    grad0.addColorStop(0, '#6a4a2e');
    grad0.addColorStop(1, '#4b321f');
    g.fillStyle = grad0;
    g.fillRect(0, 0, w, h);
    // the sand layer, its bedding lines, then the earth under it
    const sand = 0.26 * k;
    const grad = g.createLinearGradient(0, 0, 0, sand);
    grad.addColorStop(0, '#d4b27a');
    grad.addColorStop(1, '#b88f56');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, sand);
    for (let n = 1; n < 6; n++) {
      g.strokeStyle = `rgba(${n % 2 ? '150,112,64' : '236,212,160'},0.5)`;
      g.lineWidth = 1.2;
      g.beginPath();
      for (let x = 0; x <= w; x += 4) g.lineTo(x, (n * sand) / 6 + Math.sin((x / w) * Math.PI * 2 + n) * 2);
      g.stroke();
    }
    grains(g, w, sand, rnd, 3000, ['#a57d45', '#f0d9a6', '#8c6838'], 1.2);
    g.fillStyle = '#8c6a44';
    g.fillRect(0, sand - 1, w, 3);
    blotches(g, w, h, rnd, 36, '90,60,36', 0.45, 6, 24, false);
    grains(g, w, h, rnd, 3000, ['#3f2b19', '#7d5c3c'], 1.4, sand + 2, h);
    pebbles(g, w, h, rnd, 40, ['#8f8a80', '#a8a090', '#6e675e'], 2, 5, sand + 6, h);
  },
  slip: (g, w, h, k) => {
    const rnd = rng(77);
    const grad0 = g.createLinearGradient(0, 0, 0, h);
    grad0.addColorStop(0, '#5c4a39');
    grad0.addColorStop(1, '#45372a');
    g.fillStyle = grad0;
    g.fillRect(0, 0, w, h);
    // a tile 2 cm thick, a cement screed, a concrete slab with aggregate, then the earth
    const tile = Math.max(5, 0.025 * k);
    const screed = 0.08 * k;
    const slab = 0.32 * k;
    g.fillStyle = '#cdd7de';
    g.fillRect(0, 0, w, tile);
    g.fillStyle = '#7d8c97';
    for (let x = 0; x < w; x += w / 2.5) g.fillRect(x, 0, 2, tile);
    g.fillStyle = '#a9a39a';
    g.fillRect(0, tile, w, screed - tile);
    g.fillStyle = '#8e8a84';
    g.fillRect(0, screed, w, slab - screed);
    pebbles(g, w, h, rnd, 90, ['#b5afa5', '#77726b', '#c9c1b3', '#5f5b55'], 1.5, 4, screed + 3, slab - 2);
    grains(g, w, slab, rnd, 1800, ['#6c6862', '#c4beb4'], 1.2, tile, slab);
    g.fillStyle = 'rgba(30,24,18,0.35)';
    g.fillRect(0, slab, w, 2);
    blotches(g, w, h, rnd, 30, '86,64,44', 0.45, 6, 24, false);
    grains(g, w, h, rnd, 2500, ['#3f2b19', '#7d5c3c'], 1.4, slab + 2, h);
    pebbles(g, w, h, rnd, 30, ['#8f8a80', '#a8a090', '#6e675e'], 2, 5, slab + 6, h);
  },
};

/** The pictures of one ground: its top and its front face (each drawn once; contact.js magnifies clones of them). */
const textures = new Map();
function texturesOf(id, anisotropy) {
  if (textures.has(id)) return textures.get(id);
  const top = new THREE.CanvasTexture(canvas(512, 512, TOPS[id]));
  const side = new THREE.CanvasTexture(canvas(256, 512, (g, w, h) => SIDES[id](g, w, h, h / SLAB.thick)));
  for (const t of [top, side]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy;
    t.wrapS = THREE.RepeatWrapping;
  }
  top.wrapT = THREE.RepeatWrapping;
  side.wrapT = THREE.ClampToEdgeWrapping;
  const out = { top, side };
  textures.set(id, out);
  return out;
}

const ROUGH = { hard: 0.96, sand: 1, slip: 0.12 };

/**
 * The top and front-face materials of a ground; `scale` magnifies (contact.js: the same ground, larger). `width` and
 * `depth` (m) are the size of the box the materials go on, so the pictures keep their real size.
 */
export function groundMaterials(id, { width, depth, height, scale = 1, anisotropy = 4 }) {
  const base = texturesOf(id, anisotropy);
  const top = base.top.clone();
  top.repeat.set(width / (TOP_TILE * scale), depth / (TOP_TILE * scale));
  const side = base.side.clone();
  side.repeat.set(width / (SIDE_TILE * scale), 1);
  side.offset.set(0, 1 - Math.min(1, height / (SLAB.thick * scale)));
  side.repeat.y = Math.min(1, height / (SLAB.thick * scale));
  const topMaterial =
    id === 'slip'
      ? new THREE.MeshPhysicalMaterial({ name: 'WetTiles', map: top, roughness: ROUGH[id], metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 })
      : new THREE.MeshStandardMaterial({ name: id === 'hard' ? 'FirmGround' : 'Sand', map: top, roughness: ROUGH[id], metalness: 0 });
  const sideMaterial = new THREE.MeshStandardMaterial({ name: `${id}Cut`, map: side, roughness: 0.95, metalness: 0 });
  return { top: topMaterial, side: sideMaterial };
}

export function createGround({ anisotropy = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'Ground';
  const len = SLAB.x1 - SLAB.x0;
  /** @type {Record<string, { top: THREE.Material, side: THREE.Material }>} */
  const looks = {};
  for (const id of Object.keys(TOPS)) looks[id] = groundMaterials(id, { width: len, depth: SLAB.depth, height: SLAB.thick, anisotropy });
  // the ends of the block (seen in the turned view) show the cut too, at their own width
  const ends = {};
  for (const id of Object.keys(TOPS)) ends[id] = groundMaterials(id, { width: SLAB.depth, depth: SLAB.depth, height: SLAB.thick, anisotropy }).side;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(len, SLAB.thick, SLAB.depth), [
    ends.hard,
    ends.hard,
    looks.hard.top,
    looks.hard.side,
    looks.hard.side,
    looks.hard.side,
  ]);
  slab.position.set((SLAB.x0 + SLAB.x1) / 2, -SLAB.thick / 2, 0);
  slab.name = 'GroundSlab';
  slab.receiveShadow = true;
  root.add(slab);
  // deeper earth under the block, for the turned view that looks down past its foot
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(len, 3, SLAB.depth),
    new THREE.MeshStandardMaterial({ name: 'DeepEarth', color: '#4a3322', roughness: 1, metalness: 0 }),
  );
  base.position.set(slab.position.x, -SLAB.thick - 1.5, 0);
  base.name = 'DeepEarth';
  base.userData.noExport = true;
  root.add(base);

  // the slippery floor's puddle of soapy water, with a few bubbles (one mesh)
  const puddleMat = new THREE.MeshStandardMaterial({
    name: 'Puddle',
    color: '#e3f1f7',
    roughness: 0.03,
    metalness: 0,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.62, 40), puddleMat);
  puddle.rotation.x = -Math.PI / 2;
  puddle.scale.set(1.25, 0.5, 1);
  puddle.position.set(0.1, 0.002, 0.04);
  puddle.renderOrder = 1;
  const foam = new THREE.MeshStandardMaterial({ name: 'Foam', color: '#ffffff', roughness: 0.3, metalness: 0, transparent: true, opacity: 0.92 });
  const bubbleGeos = [
    [-0.46, 0.17, 0.02],
    [-0.36, 0.28, 0.014],
    [0.62, 0.2, 0.022],
    [0.74, 0.05, 0.012],
    [0.5, 0.3, 0.016],
    [-0.58, -0.02, 0.012],
    [0.3, -0.18, 0.01],
    [-0.12, 0.31, 0.013],
  ].map(([x, z, r]) => new THREE.SphereGeometry(r, 10, 8).translate(x, r * 0.7, z));
  const bubbles = new THREE.Mesh(mergeGeometries(bubbleGeos), foam);
  for (const b of bubbleGeos) b.dispose();
  bubbles.name = 'Bubbles';
  const smear = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 1, 6, 10), foam);
  smear.rotation.z = Math.PI / 2;
  smear.scale.set(0.3, 1, 1.8); // flat (local x is up after the turn), the long axis along the ground
  smear.visible = false;
  smear.name = 'FootSlide';
  const wet = new THREE.Group();
  wet.name = 'Wet';
  wet.userData.noExport = true;
  wet.add(puddle, bubbles, smear);
  root.add(wet);

  // the heap of sand the foot pushes back, and the grains it throws behind (one instanced mesh)
  const sandMat = new THREE.MeshStandardMaterial({ name: 'SandHeap', color: '#d7b072', roughness: 1, metalness: 0 });
  const heap = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), sandMat);
  heap.name = 'SandHeap';
  heap.visible = false;
  heap.castShadow = true;
  const GRAINS = 14;
  const grainMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), sandMat, GRAINS);
  grainMesh.name = 'SandGrains';
  grainMesh.visible = false;
  grainMesh.frustumCulled = false;
  const grainSpots = [];
  const rnd = rng(5);
  for (let i = 0; i < GRAINS; i++) grainSpots.push({ r: 0.007 + rnd() * 0.007, u: 0.25 + rnd() * 0.75, v: rnd(), w: rnd() - 0.5 });
  const sand = new THREE.Group();
  sand.name = 'Sand';
  sand.userData.noExport = true;
  sand.add(heap, grainMesh);
  root.add(sand);

  // the line the student starts from: dark dashes standing on the ground at x = 0, so a step forward can be seen
  const dashMat = new THREE.MeshBasicMaterial({ name: 'StartLine', color: '#24384f' });
  const dashGeos = Array.from({ length: 24 }, (_, i) => new THREE.BoxGeometry(0.016, 0.034, 0.016).translate(0, 0.02 + i * 0.068, 0.02));
  const dash = new THREE.Mesh(mergeGeometries(dashGeos), dashMat);
  for (const g of dashGeos) g.dispose();
  const m4 = new THREE.Matrix4();
  dash.name = 'StartLine';
  dash.userData.noExport = true;
  root.add(dash);

  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const size = new THREE.Vector3();
  let id = 'hard';
  const api = {
    root,
    get surface() {
      return id;
    },
    setSurface(next) {
      id = next;
      slab.material[0] = slab.material[1] = ends[next];
      slab.material[2] = looks[next].top;
      for (const k of [3, 4, 5]) slab.material[k] = looks[next].side;
      wet.visible = next === 'slip';
      heap.visible = grainMesh.visible = false;
      smear.visible = false;
    },
    /**
     * What the foot did to the ground: `toe` the rear toe's x now, `slip` how far it has slid back (m).
     * Sand: the heap it pushed back; the slippery floor: the smear it left.
     */
    foot(toe, slip) {
      const sliding = slip > 0.012;
      if (id === 'sand') {
        heap.visible = grainMesh.visible = sliding;
        if (sliding) {
          const w = 0.08 + slip * 0.9;
          heap.scale.set(w, 0.035 + slip * 0.3, 0.1);
          heap.position.set(toe - w * 0.8, 0, FOOT_Z);
          for (const [i, { r, u, v, w: z }] of grainSpots.entries()) {
            const d = 0.05 + u * (0.1 + slip * 1.2);
            pos.set(toe - w * 1.2 - d, 0.01 + Math.sin(v * Math.PI) * (0.04 + slip * 0.25), FOOT_Z + z * 0.18);
            grainMesh.setMatrixAt(i, m4.compose(pos, q, size.setScalar(r)));
          }
          grainMesh.instanceMatrix.needsUpdate = true;
        }
      }
      if (id === 'slip') {
        smear.visible = sliding;
        if (sliding) {
          smear.scale.y = slip + 0.05; // the capsule's long axis
          smear.position.set(toe + slip / 2, 0.006, FOOT_Z);
        }
      }
    },
    /** The ground, as the model the book gets. */
    exportGroup() {
      // a 6 m piece of the path, 0.4 m deep (the view's long block is only there to fill wide frames)
      const g = new THREE.Group();
      g.name = 'Ground';
      const w = 6;
      const h = 0.4;
      const piece = groundMaterials(id, { width: w, depth: SLAB.depth, height: h, anisotropy });
      const end = groundMaterials(id, { width: SLAB.depth, depth: SLAB.depth, height: h, anisotropy }).side;
      const block = new THREE.Mesh(new THREE.BoxGeometry(w, h, SLAB.depth), [end, end, piece.top, piece.side, piece.side, piece.side]);
      block.name = 'GroundSlab';
      block.position.set(0.4, -h / 2, 0);
      g.add(block);
      return g;
    },
    anchors: { footZ: FOOT_Z },
  };
  api.setSurface('hard');
  return api;
}
