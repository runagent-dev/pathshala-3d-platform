// The setting, in metres, drawn with small canvas textures (no image files): a school physics laboratory in daylight.
// A long wooden lab bench against a sky-blue wall; on the wall a window onto a blue sky with a school building and
// trees, a pegboard with the lab's springs, a spring balance and slotted weights hanging from pegs, a clock, a row of
// pale blue tiles behind the bench, and a shelf of bottles and flasks; a terrazzo floor under the bench. The bench's
// middle slab is the table of the GLB; everything else is scenery (never exported). Still parts are merged into one
// mesh per material (src/merge.js); the window, the pegboard and the clock share one picture (an atlas).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeStatic } from './merge.js';

export const WALL_Z = -0.5; // the wall's face
export const FRONT_Z = 0.14; // the bench's front edge
const FLOOR_Y = -0.92;
const TOP = 0.04; // the bench top's thickness

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')) };
}
function rand(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function texture(c, { repeat = false, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** The wall's plaster: sky-blue distemper, mottled, with faint roller streaks (repeats every 0.8 m). */
function plasterTexture() {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  const r = rand(7);
  ctx.fillStyle = '#8fc1e3';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const x = r() * S;
    const y = r() * S;
    const s = 6 + r() * 18;
    const d = ctx.createRadialGradient(x, y, 0, x, y, s);
    const c0 = r() < 0.5 ? `rgba(196,226,246,${0.08 + r() * 0.1})` : `rgba(70,120,165,${0.05 + r() * 0.07})`;
    d.addColorStop(0, c0);
    d.addColorStop(1, c0.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = d;
    // wrap round the edges so the repeat has no seam (only spots that cross an edge are drawn again)
    for (const ox of [-S, 0, S])
      for (const oy of [-S, 0, S]) {
        if ((ox && Math.abs(x + ox - S / 2) > S / 2 + s) || (oy && Math.abs(y + oy - S / 2) > S / 2 + s)) continue;
        ctx.fillRect(x - s + ox, y - s + oy, s * 2, s * 2);
      }
  }
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '40,80,120' : '225,240,252'},${0.06 + r() * 0.08})`;
    ctx.fillRect(r() * S, r() * S, 1, 1);
  }
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '200,228,248' : '60,105,150'},0.035)`;
    ctx.fillRect(r() * S, 0, 4 + r() * 10, S);
  }
  return texture(c, { repeat: true });
}

/** The tiles behind the bench: pale blue glazed squares with white grout (one repeat is 4 × 2 tiles of 7.5 cm). */
function tileTexture() {
  const W = 256;
  const H = 128;
  const { c, ctx } = canvas(W, H);
  const r = rand(19);
  ctx.fillStyle = '#f1f6fa';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 2; j++) {
      const x = i * 64 + 2;
      const y = j * 64 + 2;
      const g = ctx.createLinearGradient(x, y, x + 60, y + 60);
      const tone = 0.9 + r() * 0.1;
      g.addColorStop(0, `rgb(${Math.round(214 * tone)},${Math.round(234 * tone)},${Math.round(247 * tone)})`);
      g.addColorStop(1, `rgb(${Math.round(190 * tone)},${Math.round(218 * tone)},${Math.round(238 * tone)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, 60, 60);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(x + 4, y + 4, 22, 3);
    }
  return texture(c, { repeat: true });
}

/** Bench top planks: honey-coloured lacquered wood, along x (repeats; one repeat is 1.2 m). */
function benchTopTexture() {
  const W = 512;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const r = rand(53);
  ctx.fillStyle = '#a86f3e';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 120; i++) {
    const y0 = r() * H;
    ctx.strokeStyle = `rgba(${90 + r() * 40},${46 + r() * 22},18,${0.14 + r() * 0.22})`;
    ctx.lineWidth = 0.8 + r() * 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin(x * 0.012 + i) * 3 + Math.sin(x * 0.05 + i * 2) * 0.8;
      if (x) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(230,180,120,${0.05 + r() * 0.06})`;
    ctx.fillRect(r() * W, r() * H, 20 + r() * 60, 2 + r() * 4);
  }
  // the joints between the planks (four planks across the bench)
  ctx.fillStyle = 'rgba(50,24,8,0.55)';
  for (let y = 0; y < H; y += 64) ctx.fillRect(0, y, W, 2);
  return texture(c, { repeat: true, aniso: 8 });
}

/** The bench's front: drawers and cupboard doors in painted blue-grey wood with steel handles (repeats per 1.2 m). */
function benchFrontTexture() {
  const W = 512;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const r = rand(29);
  ctx.fillStyle = '#3f5f7f';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(20,34,50,${0.06 + r() * 0.1})`;
    ctx.lineWidth = 1;
    const y = r() * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + (r() - 0.5) * 6);
    ctx.stroke();
  }
  const panel = (x, y, w, h, handle) => {
    ctx.fillStyle = 'rgba(12,22,34,0.6)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#53769a');
    g.addColorStop(1, '#46698c');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(220,235,250,0.12)';
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = '#c9d1d9';
    if (handle === 'bar') ctx.fillRect(x + w / 2 - 16, y + 12, 32, 5);
    else ctx.fillRect(x + (handle === 'left' ? 9 : w - 14), y + h * 0.38, 5, 24);
  };
  for (let i = 0; i < 2; i++) {
    const x = i * 256 + 7;
    panel(x, 8, 242, 52, 'bar');
    panel(x, 70, 118, H - 78, 'right');
    panel(x + 124, 70, 118, H - 78, 'left');
  }
  return texture(c, { repeat: true, aniso: 4 });
}

/** Floor tiles: grey-and-cream terrazzo squares (repeats; one repeat is 1.2 m). */
function floorTexture() {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  const r = rand(5);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#8f9aa3' : '#c3c8cc';
      ctx.fillRect(i * 64, j * 64, 64, 64);
    }
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '55,60,66' : '235,238,240'},${0.2 + r() * 0.3})`;
    ctx.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2);
  }
  ctx.fillStyle = 'rgba(45,50,56,0.5)';
  for (let k = 0; k <= S; k += 64) {
    ctx.fillRect(k - 1, 0, 2, S);
    ctx.fillRect(0, k - 1, S, 2);
  }
  return texture(c, { repeat: true, aniso: 4 });
}

// the atlas: the window (left half), the pegboard (right half) and the clock face (a corner of the window's half,
// under the window), 1024 × 512
const ATLAS = { w: 1024, h: 512 };
const WINDOW_PX = { x: 0, y: 0, w: 448, h: 512 }; // 0.7 × 0.8 m
const CLOCK_PX = { x: 448, y: 0, w: 128, h: 128 };
const PEG_PX = { x: 576, y: 0, w: 448, h: 512 }; // 0.56 × 0.64 m

/** The window: sky, clouds, a school building and trees beyond, a white frame and the iron grill. */
function drawWindow(ctx, r) {
  const { x, y, w, h } = WINDOW_PX;
  ctx.save();
  ctx.translate(x, y);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#3d8fd6');
  sky.addColorStop(0.62, '#8cc6f0');
  sky.addColorStop(1, '#cfe9fb');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // clouds: soft white puffs
  for (const [cx, cy, s] of [
    [110, 120, 1],
    [320, 70, 0.8],
    [250, 200, 0.6],
  ]) {
    for (let i = 0; i < 9; i++) {
      const px = cx + (r() - 0.5) * 120 * s;
      const py = cy + (r() - 0.5) * 30 * s;
      const rad = (22 + r() * 26) * s;
      const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
  }
  // the school building across the yard: cream walls, a red-brown roof line, rows of windows
  const by = h * 0.66;
  ctx.fillStyle = '#e9dcc0';
  ctx.fillRect(40, by, 300, h - by);
  ctx.fillStyle = '#9c4a2f';
  ctx.fillRect(34, by - 10, 312, 12);
  ctx.fillStyle = '#5b7da0';
  for (let row = 0; row < 3; row++) for (let i = 0; i < 7; i++) ctx.fillRect(56 + i * 40, by + 18 + row * 46, 20, 26);
  // trees at the side: dark rounded crowns over trunks
  for (const [tx, ty, tr] of [
    [372, by + 10, 46],
    [420, by + 30, 38],
    [18, by + 24, 34],
  ]) {
    ctx.fillStyle = '#5a3b22';
    ctx.fillRect(tx - 4, ty, 8, h - ty);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#2f6b3a' : '#3d7f47';
      ctx.beginPath();
      ctx.arc(tx + (r() - 0.5) * tr, ty - 10 + (r() - 0.5) * tr * 0.8, tr * (0.45 + r() * 0.25), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // the frame: white paint, a crossbar, and the grill's iron bars in front of the glass
  ctx.fillStyle = 'rgba(30,60,90,0.25)';
  for (let i = 1; i < 8; i++) ctx.fillRect((i * w) / 8 - 3, 0, 6, h);
  ctx.fillStyle = '#4a5560';
  for (let i = 1; i < 8; i++) ctx.fillRect((i * w) / 8 - 2, 0, 4, h);
  ctx.fillStyle = '#f4f6f8';
  ctx.fillRect(0, 0, w, 22);
  ctx.fillRect(0, h - 22, w, 22);
  ctx.fillRect(0, 0, 22, h);
  ctx.fillRect(w - 22, 0, 22, h);
  ctx.fillRect(w / 2 - 9, 0, 18, h);
  ctx.fillRect(0, h * 0.36 - 8, w, 16);
  ctx.fillStyle = 'rgba(40,60,80,0.18)';
  ctx.fillRect(22, 22, w - 44, 4);
  ctx.fillRect(22, 22, 4, h - 44);
  ctx.restore();
}

/** The pegboard: brown hardboard with holes, the lab's springs, a spring balance and slotted weights on pegs. */
function drawPegboard(ctx, r) {
  const { x, y, w, h } = PEG_PX;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#6e4a2c';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8895a';
  ctx.fillRect(10, 10, w - 20, h - 20);
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '120,80,44' : '220,180,130'},${0.15 + r() * 0.2})`;
    ctx.fillRect(10 + r() * (w - 20), 10 + r() * (h - 20), 1 + r() * 2, 1);
  }
  ctx.fillStyle = 'rgba(60,36,18,0.75)';
  for (let px = 30; px < w - 20; px += 28) for (let py = 30; py < h - 20; py += 28) ctx.fillRect(px - 2, py - 2, 4, 4);
  const peg = (px, py) => {
    ctx.fillStyle = '#868e96';
    ctx.fillRect(px - 3, py - 3, 6, 12);
  };
  /** A coil spring hanging from a peg: `turns` loops `width` wide over `len` px, in `color`. */
  const spring = (px, py, len, width, turns, color, wire) => {
    peg(px, py);
    ctx.strokeStyle = 'rgba(40,24,10,0.3)';
    ctx.lineWidth = wire + 2;
    const coil = (dx, dy, stroke) => {
      ctx.beginPath();
      ctx.moveTo(px + dx, py + 8 + dy);
      ctx.lineTo(px + dx, py + 18 + dy);
      for (let i = 0; i <= turns * 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.lineTo(px + dx + Math.sin(a) * width * 0.5, py + 18 + dy + (i / (turns * 24)) * len + Math.cos(a) * 3);
      }
      ctx.lineTo(px + dx, py + 30 + len + dy);
      ctx.strokeStyle = stroke;
      ctx.stroke();
    };
    coil(3, 3, 'rgba(40,24,10,0.3)');
    ctx.lineWidth = wire;
    coil(0, 0, color);
  };
  spring(60, 40, 150, 26, 12, '#adb5bd', 3);
  spring(120, 40, 110, 34, 9, '#1c7ed6', 4);
  spring(180, 40, 190, 20, 16, '#868e96', 2.5);
  // a spring balance: a brass tube with a scale window and a hook
  peg(260, 40);
  ctx.fillStyle = 'rgba(40,24,10,0.3)';
  ctx.fillRect(250, 56, 26, 210);
  ctx.fillStyle = '#d4a72c';
  ctx.fillRect(246, 52, 26, 210);
  ctx.fillStyle = '#f8f1d8';
  ctx.fillRect(252, 70, 14, 170);
  ctx.fillStyle = '#343a40';
  for (let i = 0; i < 12; i++) ctx.fillRect(252, 76 + i * 14, i % 2 ? 5 : 9, 2);
  ctx.strokeStyle = '#868e96';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(259, 262);
  ctx.lineTo(259, 284);
  ctx.arc(259, 292, 8, -Math.PI / 2, Math.PI, false);
  ctx.stroke();
  // slotted weights on a hanger
  peg(350, 40);
  ctx.strokeStyle = '#495057';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(350, 48);
  ctx.lineTo(350, 110);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const wy = 110 + i * 15;
    ctx.fillStyle = 'rgba(40,24,10,0.3)';
    ctx.fillRect(320, wy + 3, 66, 12);
    ctx.fillStyle = i % 2 ? '#7d858c' : '#959da5';
    ctx.fillRect(317, wy, 66, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(317, wy, 66, 2);
  }
  // a coil of red and black wires on the lower pegs
  peg(110, 330);
  peg(300, 330);
  for (const [cx, col] of [
    [110, '#c92a2a'],
    [300, '#212529'],
  ]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(cx + i * 2, 380 + i * 3, 34, 44, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** The clock's face: cream, twelve marks, the hands at ten past ten (no numbers). */
function drawClock(ctx) {
  const { x, y, w } = CLOCK_PX;
  ctx.save();
  ctx.translate(x + w / 2, y + w / 2);
  ctx.fillStyle = '#2b2f36';
  ctx.beginPath();
  ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4efe2';
  ctx.beginPath();
  ctx.arc(0, 0, w / 2 - 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2f36';
  for (let i = 0; i < 12; i++) {
    ctx.save();
    ctx.rotate((i / 12) * Math.PI * 2);
    ctx.fillRect(-2, -w / 2 + 11, 4, i % 3 ? 7 : 12);
    ctx.restore();
  }
  const hand = (a, l, wd) => {
    ctx.save();
    ctx.rotate(a);
    ctx.fillRect(-wd / 2, -l, wd, l + 6);
    ctx.restore();
  };
  hand((10 / 12) * Math.PI * 2 + (10 / 60) * (Math.PI / 6), 28, 5);
  hand((10 / 60) * Math.PI * 2, 42, 3.5);
  ctx.restore();
}

function atlasTexture() {
  const { c, ctx } = canvas(ATLAS.w, ATLAS.h);
  const r = rand(31);
  ctx.fillStyle = '#8fc1e3';
  ctx.fillRect(0, 0, ATLAS.w, ATLAS.h);
  drawWindow(ctx, r);
  drawPegboard(ctx, r);
  drawClock(ctx);
  return texture(c, { aniso: 8 });
}

/** A plane on the wall showing one region of the atlas. */
function decal(px, x0, y0, x1, y1, z = WALL_Z + 0.002) {
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (px.x + uv.getX(i) * px.w) / ATLAS.w, 1 - (px.y + (1 - uv.getY(i)) * px.h) / ATLAS.h);
  }
  return g.translate((x0 + x1) / 2, (y0 + y1) / 2, z);
}

const paintMat = () => new THREE.MeshStandardMaterial({ name: 'Paint', vertexColors: true, roughness: 0.65 });
const plain = (color, roughness = 0.65) => new THREE.MeshStandardMaterial({ color, roughness });

/**
 * The laboratory round the apparatus: the wall with its window, pegboard, clock and tiles, the shelf, the bench (its
 * middle slab is `top`, the table of the GLB, added by the caller) and the floor, plus a background for the turned
 * view. Returns { root, top, background }.
 */
export function createRoom() {
  const root = new THREE.Group();
  root.name = 'Laboratory';
  root.userData.noExport = true;

  // the wall: plaster over everything, then the tiles behind the bench, then the atlas pictures
  const plaster = plasterTexture();
  plaster.repeat.set(5, 2.6);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.1), new THREE.MeshStandardMaterial({ name: 'Wall', map: plaster, roughness: 0.95 }));
  wall.position.set(0.2, FLOOR_Y + 1.05, WALL_Z);
  const tiles = tileTexture();
  tiles.repeat.set(4 / 0.224, 1);
  const tileRow = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.112), new THREE.MeshStandardMaterial({ name: 'Tiles', map: tiles, roughness: 0.3 }));
  tileRow.position.set(0.2, 0.056, WALL_Z + 0.001);
  const atlas = new THREE.Mesh(
    mergeGeometries([decal(WINDOW_PX, -1.05, 0.17, -0.35, 0.97), decal(PEG_PX, 0.3, 0.15, 0.86, 0.79), decal(CLOCK_PX, 1.2, 0.86, 1.4, 1.06)]),
    new THREE.MeshStandardMaterial({ name: 'WallPictures', map: atlasTexture(), roughness: 0.8 }),
  );
  const floorMap = floorTexture();
  floorMap.repeat.set(3.5, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshStandardMaterial({ name: 'Floor', map: floorMap, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0.2, FLOOR_Y, WALL_Z + 1.2);

  // plain parts, one vertex-coloured mesh: the window's sill and frame, the tiles' top edge, the shelf and its
  // brackets, the bottles' liquids, caps and labels
  const sill = plain('#eef1f4', 0.5);
  const tileEdge = plain('#d5e3ee', 0.4);
  const wood = plain('#6b4428', 0.6);
  const darkWood = plain('#4a2e1b', 0.6);
  const cap = plain('#1f2329', 0.5);
  const brown = plain('#6e3b12', 0.3);
  const blue = plain('#1c4f8c', 0.3);
  const amber = plain('#d9902a', 0.35);
  const label = plain('#efe9da', 0.8);
  const box = (w, h, d, m, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  const cyl = (rt, rb, h, m, x, y, z, seg = 18) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  // the window's sill and its frame's depth
  box(0.78, 0.025, 0.06, sill, -0.7, 0.16, WALL_Z + 0.03);
  box(0.76, 0.02, 0.02, sill, -0.7, 0.98, WALL_Z + 0.01);
  for (const x of [-1.06, -0.34]) box(0.02, 0.82, 0.02, sill, x, 0.57, WALL_Z + 0.01);
  box(4, 0.012, 0.012, tileEdge, 0.2, 0.114, WALL_Z + 0.006);
  // the shelf high on the right, its brackets, and what stands on it
  const SY = 0.98;
  const SZ = WALL_Z + 0.08;
  box(0.7, 0.02, 0.16, wood, 0.25, SY - 0.01, SZ);
  for (const x of [-0.05, 0.55]) box(0.016, 0.07, 0.12, darkWood, x, SY - 0.055, WALL_Z + 0.065);
  const bottle = (x, liquid, h = 0.11, rr = 0.026) => {
    cyl(rr, rr, h, liquid, x, SY + h / 2, SZ);
    cyl(rr * 0.45, rr * 0.6, 0.02, liquid, x, SY + h + 0.01, SZ, 12);
    cyl(rr * 0.5, rr * 0.5, 0.016, cap, x, SY + h + 0.028, SZ, 12);
    box(rr * 1.4, h * 0.42, 0.002, label, x, SY + h * 0.48, SZ + rr + 0.0005);
  };
  bottle(0.0, brown);
  bottle(0.07, blue, 0.095, 0.024);
  bottle(0.42, brown, 0.08, 0.022);
  bottle(0.5, amber, 0.1, 0.025);
  const glass = new THREE.MeshStandardMaterial({
    name: 'Glass',
    color: '#e3f1f7',
    roughness: 0.08,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const flask = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0, 0],
        [0.042, 0],
        [0.044, 0.004],
        [0.016, 0.085],
        [0.014, 0.12],
        [0.017, 0.124],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      20,
    ),
    glass,
  );
  flask.position.set(0.22, SY, SZ);
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.028, 20), plain('#c2255c', 0.35));
  liquid.position.set(0.22, SY + 0.016, SZ);
  root.add(liquid);

  // the bench: three slabs side by side, their grain continuous: the middle one under the apparatus (the table of the
  // GLB), the two long ends one mesh of scenery; under the top, the drawers and cupboards; a dark plinth
  const W0 = -1.7;
  const W1 = 2.1;
  const D = FRONT_Z - WALL_Z;
  const z0 = (FRONT_Z + WALL_Z) / 2;
  const topMap = benchTopTexture();
  topMap.repeat.set((W1 - W0) / 1.2, 1);
  const topMat = new THREE.MeshStandardMaterial({ name: 'BenchTop', map: topMap, roughness: 0.45 });
  const edge = new THREE.MeshStandardMaterial({ name: 'BenchEdge', color: '#6e4424', roughness: 0.5 });
  const slab = (x0, x1) => {
    const w = x1 - x0;
    const g = new THREE.BoxGeometry(w, TOP, D);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, (x0 + uv.getX(i) * w - W0) / (W1 - W0));
    return g.translate((x0 + x1) / 2, -TOP / 2, z0);
  };
  const top = new THREE.Mesh(slab(-0.25, 0.85), [edge, edge, topMat, edge, edge, edge]);
  top.name = 'Table';
  top.receiveShadow = true;
  const ends = new THREE.Mesh(
    mergeGeometries(
      [slab(W0, -0.25), slab(0.85, W1)].map((g) => {
        g.clearGroups();
        return g;
      }),
    ),
    topMat,
  );
  ends.name = 'BenchEnds';
  ends.receiveShadow = true;
  const frontMap = benchFrontTexture();
  const H = -TOP - FLOOR_Y - 0.07;
  frontMap.repeat.set((W1 - W0) / 1.2, 1);
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(W1 - W0, H),
    new THREE.MeshStandardMaterial({ name: 'BenchFront', map: frontMap, roughness: 0.6 }),
  );
  front.position.set((W0 + W1) / 2, -TOP - H / 2, FRONT_Z - 0.025);
  const plinth = plain('#22303d');
  box(W1 - W0, 0.07, 0.02, plinth, (W0 + W1) / 2, FLOOR_Y + 0.035, FRONT_Z - 0.035);

  root.add(wall, tileRow, atlas, floor, ends, front, flask);
  mergeStatic(root, {
    keep: [wall, tileRow, atlas, floor, ends, front, flask],
    paint: { from: [sill, tileEdge, wood, darkWood, cap, brown, blue, amber, label, plinth, liquid.material], material: paintMat() },
  });
  // only the bench gets shadows (the apparatus's and the hand's); nothing in the room casts one

  // the room beyond, for the turned view: the same sky blue, darker towards the floor
  const bg = canvas(16, 256);
  const g = bg.ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#9ccbe9');
  g.addColorStop(0.55, '#7aa9cc');
  g.addColorStop(1, '#4d6f8c');
  bg.ctx.fillStyle = g;
  bg.ctx.fillRect(0, 0, 16, 256);
  return { root, top, background: texture(bg.c, { aniso: 1 }) };
}
