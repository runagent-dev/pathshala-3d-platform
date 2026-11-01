// The setting, in metres, drawn with small canvas textures (no image files): the teacher's desk in a classroom, in
// front of the blackboard. The apparatus stands on the desk; behind it a large slate board in a wooden frame (chalk
// dust, erased lines, and at its sides two chalk sketches without words: Galileo's leaning tower with two balls, and
// a tube with a feather and a coin), its chalk ledge, an ochre wall round it, a red-oxide floor. On the desk, right of
// the empty tube, the vacuum pump that emptied it, its rubber hose on the tube's valve. The dark board lets the clear
// tubes, the cream paper, the blue speed arrows and the orange lines read; the wall stays warm. Everything is still:
// merged into one mesh per material (src/merge.js) and never exported to the GLB.
import * as THREE from 'three';
import { BASE, VALVE_NOZZLE } from './apparatus.js';
import { mergeStatic } from './merge.js';

export const DESK_Y = -BASE.h; // the desk's top: the wooden base stands on it
const FLOOR_Y = DESK_Y - 0.75;
const WALL_Z = -0.56;
const DESK = { x0: -0.75, x1: 0.75, z0: -0.45, z1: 0.33, t: 0.032 };
/** The board's slate: 2 m × 1.03 m; its frame and chalk ledge are just below the desk's top, out of the front view. */
const BOARD = { x0: -1, x1: 1, y0: -0.03, y1: 1, z: WALL_Z + 0.014 };
/** The vacuum pump on the desk, right of the empty tube and a little back. */
export const PUMP = { x: 0.47, z: -0.13 };

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

/** The slate: dark blue-grey, chalk dust and eraser swipes, faint erased lines, two chalk sketches at the sides. */
function boardTexture() {
  const W = 1024;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const r = rand(17);
  const px = (x) => ((x - BOARD.x0) / (BOARD.x1 - BOARD.x0)) * W;
  const py = (y) => ((BOARD.y1 - y) / (BOARD.y1 - BOARD.y0)) * H;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#3a454c');
  g.addColorStop(1, '#30393f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // the slate's grain
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '18,24,28' : '96,108,116'},${0.08 + r() * 0.1})`;
    ctx.fillRect(r() * W, r() * H, 1, 1);
  }
  // eraser swipes: broad soft arcs of chalk dust, thicker towards the bottom
  ctx.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const y = H * (0.15 + r() * 0.8);
    const x = r() * W;
    const len = 80 + r() * 260;
    ctx.strokeStyle = `rgba(220,226,230,${0.025 + r() * 0.035 + (y / H) * 0.015})`;
    ctx.lineWidth = 16 + r() * 34;
    ctx.beginPath();
    ctx.moveTo(x - len / 2, y + (r() - 0.5) * 20);
    ctx.quadraticCurveTo(x, y - 18 - r() * 30, x + len / 2, y + (r() - 0.5) * 20);
    ctx.stroke();
  }
  // lines of old writing, wiped off: faint wavy strokes in rows
  for (let row = 0; row < 9; row++) {
    const y0 = 40 + row * 48 + r() * 10;
    let x = 30 + r() * 80;
    while (x < W - 60) {
      const w = 14 + r() * 50;
      ctx.strokeStyle = `rgba(225,230,232,${0.03 + r() * 0.04})`;
      ctx.lineWidth = 1.5 + r();
      ctx.beginPath();
      for (let k = 0; k <= w; k += 3) {
        const yy = y0 + Math.sin((x + k) * 0.35 + row) * 4 + (r() - 0.5) * 3;
        k ? ctx.lineTo(x + k, yy) : ctx.moveTo(x + k, yy);
      }
      ctx.stroke();
      x += w + 8 + r() * 30;
    }
  }
  // chalk: a line drawn twice, a little apart, the way chalk skips on slate
  const chalk = (a = 0.55, w = 2.6) => {
    ctx.strokeStyle = `rgba(242,242,234,${a})`;
    ctx.fillStyle = `rgba(242,242,234,${a})`;
    ctx.lineWidth = w;
  };
  const line = (pts, closed = false) => {
    for (const j of [0, 0.9]) {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + j, y - j * 0.5) : ctx.moveTo(x + j, y - j * 0.5)));
      if (closed) ctx.closePath();
      ctx.stroke();
    }
  };
  // left: the leaning tower of Pisa, six tiers with arches, two balls let go from the top (dotted fall lines)
  {
    const gx = px(-0.86);
    const gy = py(0.16); // the ground
    const tilt = 0.075;
    const tw = 70;
    const tier = 40;
    chalk(0.5, 2.4);
    line([
      [px(-0.99), gy],
      [px(-0.52), gy],
    ]);
    const at = (u, h) => [gx + u + h * tilt, gy - h];
    for (let k = 0; k < 6; k++) {
      const h0 = k * tier;
      const h1 = h0 + tier;
      const s = k === 5 ? 0.8 : 1; // the bell chamber is narrower
      const a = (-tw / 2) * s;
      const b = (tw / 2) * s;
      line([at(a, h0), at(b, h0), at(b, h1), at(a, h1)], true);
      // arches along each tier
      for (let u = a + 8; u < b - 6; u += 13) {
        const [x0, y0] = at(u, h0 + 6);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0, y0 - tier * 0.5);
        ctx.arc(x0 + 4, y0 - tier * 0.5, 4, Math.PI, 0);
        ctx.lineTo(x0 + 8, y0);
        ctx.stroke();
      }
    }
    // two balls from the top, a big one and a small one, and their dotted paths to the ground
    const [tx, ty] = at(tw / 2, 6 * tier);
    for (const [dx, rr] of [
      [26, 9],
      [52, 5],
    ]) {
      ctx.beginPath();
      ctx.arc(tx + dx, ty + 6, rr, 0, Math.PI * 2);
      ctx.stroke();
      for (let y = ty + 22; y < gy - 6; y += 12) ctx.fillRect(tx + dx - 1.2, y, 2.4, 5);
    }
  }
  // right: a tall glass tube with a feather and a coin falling side by side, and a strobe column of dots (1 : 4 : 9)
  {
    const cx = px(0.7);
    const top = py(0.86);
    const bot = py(0.16);
    const rw = 34;
    chalk(0.5, 2.4);
    line([
      [cx - rw, top],
      [cx - rw, bot],
    ]);
    line([
      [cx + rw, top],
      [cx + rw, bot],
    ]);
    for (const y of [top, bot]) {
      ctx.beginPath();
      ctx.ellipse(cx, y, rw, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // a feather (a curved quill with barbs)
    const fy = top + (bot - top) * 0.55;
    ctx.beginPath();
    ctx.moveTo(cx - 20, fy + 22);
    ctx.quadraticCurveTo(cx - 12, fy, cx - 6, fy - 26);
    ctx.stroke();
    for (let k = 0; k < 9; k++) {
      const u = k / 9;
      const x = cx - 20 + 14 * u;
      const y = fy + 22 - 48 * u;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 9, y - 4);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8, y - 6);
      ctx.stroke();
    }
    // a coin at the same height
    ctx.beginPath();
    ctx.ellipse(cx + 16, fy, 10, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    // a strobe column: dots at 1, 4, 9, 16 units below the start
    const sx = px(0.9);
    const u = (bot - top - 20) / 16;
    for (const k of [0, 1, 4, 9, 16]) {
      ctx.beginPath();
      ctx.arc(sx, top + 10 + k * u, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // chalk dust settled along the bottom edge
  const dust = ctx.createLinearGradient(0, H - 40, 0, H);
  dust.addColorStop(0, 'rgba(220,224,226,0)');
  dust.addColorStop(1, 'rgba(220,224,226,0.12)');
  ctx.fillStyle = dust;
  ctx.fillRect(0, H - 40, W, 40);
  return texture(c, { aniso: 8 });
}

/** The wall: ochre distemper, mottled, with roller streaks; a dark red dado below the desk's height (5 m × 2.6 m). */
function wallTexture() {
  const W = 512;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const r = rand(23);
  const dado = H * (1 - 0.75 / 2.6);
  const g = ctx.createLinearGradient(0, 0, 0, dado);
  g.addColorStop(0, '#d9b469');
  g.addColorStop(1, '#c79f55');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, dado);
  for (let i = 0; i < 700; i++) {
    const x = r() * W;
    const y = r() * dado;
    const s = 3 + r() * 12;
    const d = ctx.createRadialGradient(x, y, 0, x, y, s);
    const c0 = r() < 0.5 ? `rgba(236,206,140,${0.06 + r() * 0.08})` : `rgba(140,100,44,${0.05 + r() * 0.07})`;
    d.addColorStop(0, c0);
    d.addColorStop(1, c0.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = d;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  }
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '238,210,150' : '150,110,50'},0.03)`;
    ctx.fillRect(r() * W, 0, 4 + r() * 10, dado);
  }
  ctx.fillStyle = '#6e2d24';
  ctx.fillRect(0, dado, W, H - dado);
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(${r() < 0.6 ? '40,14,10' : '150,80,64'},${0.08 + r() * 0.1})`;
    ctx.fillRect(r() * W, dado + r() * (H - dado), 2 + r() * 10, 1 + r() * 2);
  }
  ctx.fillStyle = '#4a1d17';
  ctx.fillRect(0, dado - 2, W, 3);
  return texture(c);
}

/** The desk's top: teak planks along x (repeats). */
function deskTopTexture() {
  const W = 512;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const r = rand(31);
  ctx.fillStyle = '#7a4527';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 120; i++) {
    const y0 = r() * H;
    ctx.strokeStyle = `rgba(${55 + r() * 40},${26 + r() * 18},12,${0.14 + r() * 0.24})`;
    ctx.lineWidth = 0.8 + r() * 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin(x * 0.011 + i) * 3 + Math.sin(x * 0.05 + i * 2) * 0.8;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(214,160,110,${0.04 + r() * 0.05})`;
    ctx.fillRect(r() * W, r() * H, 20 + r() * 70, 2 + r() * 4);
  }
  ctx.fillStyle = 'rgba(30,12,4,0.55)';
  for (let y = 0; y < H; y += 64) ctx.fillRect(0, y, W, 2);
  return texture(c, { repeat: true, aniso: 8 });
}

/** The desk's front: two drawers and a kneehole panel in darker wood, brass handles (1.5 m × 0.72 m). */
function deskFrontTexture() {
  const W = 512;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const r = rand(37);
  ctx.fillStyle = '#5a321c';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = `rgba(28,12,4,${0.08 + r() * 0.12})`;
    ctx.lineWidth = 1;
    const y = r() * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + (r() - 0.5) * 5);
    ctx.stroke();
  }
  const panel = (x, y, w, h, handle) => {
    ctx.fillStyle = 'rgba(18,8,2,0.55)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#70442a');
    g.addColorStop(1, '#623a23');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,220,180,0.08)';
    ctx.fillRect(x, y, w, 2);
    if (handle) {
      ctx.fillStyle = '#c9a64e';
      ctx.fillRect(x + w / 2 - 16, y + h / 2 - 2, 32, 5);
    }
  };
  panel(10, 10, 150, 46, true);
  panel(W - 160, 10, 150, 46, true);
  panel(10, 66, 150, H - 76, true);
  panel(W - 160, 66, 150, H - 76, true);
  panel(172, 10, W - 344, 36, false);
  return texture(c, { aniso: 8 });
}

/** The red-oxide cement floor, polished and a little worn (repeats; one repeat is 1 m). */
function floorTexture() {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  const r = rand(5);
  ctx.fillStyle = '#8e3d2e';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const x = r() * S;
    const y = r() * S;
    const s = 6 + r() * 26;
    const d = ctx.createRadialGradient(x, y, 0, x, y, s);
    const c0 = r() < 0.5 ? `rgba(170,84,64,${0.08 + r() * 0.1})` : `rgba(70,24,16,${0.08 + r() * 0.1})`;
    d.addColorStop(0, c0);
    d.addColorStop(1, c0.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = d;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  }
  ctx.fillStyle = 'rgba(40,12,8,0.45)';
  ctx.fillRect(0, 0, S, 1.5);
  ctx.fillRect(0, 0, 1.5, S);
  return texture(c, { repeat: true, aniso: 8 });
}

/** The pump's vacuum gauge: a cream dial, a scale arc, the needle far round (the air is out). */
function gaugeTexture() {
  const S = 128;
  const { c, ctx } = canvas(S, S);
  ctx.fillStyle = '#f2ede0';
  ctx.fillRect(0, 0, S, S);
  ctx.translate(S / 2, S / 2);
  ctx.strokeStyle = '#2b2f36';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * (0.75 + (i / 10) * 1.5);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 44, Math.sin(a) * 44);
    ctx.lineTo(Math.cos(a) * (i % 5 ? 38 : 32), Math.sin(a) * (i % 5 ? 38 : 32));
    ctx.stroke();
  }
  ctx.strokeStyle = '#c92a2a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 47, Math.PI * 1.95, Math.PI * 2.25);
  ctx.stroke();
  ctx.strokeStyle = '#1d2733';
  ctx.lineWidth = 4;
  const a = Math.PI * 2.1;
  ctx.beginPath();
  ctx.moveTo(-Math.cos(a) * 8, -Math.sin(a) * 8);
  ctx.lineTo(Math.cos(a) * 40, Math.sin(a) * 40);
  ctx.stroke();
  ctx.fillStyle = '#1d2733';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  return texture(c);
}

const paintMat = () => new THREE.MeshStandardMaterial({ name: 'Paint', vertexColors: true, roughness: 0.6 });
const plain = (color, roughness = 0.6, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

/**
 * The classroom round the apparatus: the wall and the board, the desk, the floor, the pump and its hose. Returns the
 * root, the room beyond (a background for the turned view), the desk's top and the shadow casters (the pump).
 */
export function createClassroom() {
  const root = new THREE.Group();
  root.name = 'Classroom';
  root.userData.noExport = true;

  // the wall and the board, the floor
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.6), new THREE.MeshStandardMaterial({ name: 'Wall', map: wallTexture(), roughness: 0.95 }));
  wall.position.set(0, FLOOR_Y + 1.3, WALL_Z);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0),
    new THREE.MeshStandardMaterial({ name: 'Blackboard', map: boardTexture(), roughness: 0.92 }),
  );
  board.position.set((BOARD.x0 + BOARD.x1) / 2, (BOARD.y0 + BOARD.y1) / 2, BOARD.z);
  board.receiveShadow = true;
  const floorMap = floorTexture();
  floorMap.repeat.set(5, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), new THREE.MeshStandardMaterial({ name: 'Floor', map: floorMap, roughness: 0.4 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR_Y, WALL_Z + 1.5);

  // the desk: its top (receives the apparatus's shadows), its front with drawers, its sides
  const topMap = deskTopTexture();
  topMap.repeat.set(2, 1);
  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(DESK.x1 - DESK.x0, DESK.t, DESK.z1 - DESK.z0),
    new THREE.MeshStandardMaterial({ name: 'DeskTop', map: topMap, roughness: 0.5 }),
  );
  deskTop.position.set((DESK.x0 + DESK.x1) / 2, DESK_Y - DESK.t / 2, (DESK.z0 + DESK.z1) / 2);
  deskTop.receiveShadow = true;
  const frontH = 0.7;
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(DESK.x1 - DESK.x0 - 0.04, frontH),
    new THREE.MeshStandardMaterial({ name: 'DeskFront', map: deskFrontTexture(), roughness: 0.6 }),
  );
  front.position.set(0, DESK_Y - DESK.t - frontH / 2, DESK.z1 - 0.015);

  // plain parts, one vertex-coloured mesh: the board's frame and ledge, the chalk and the duster, the desk's sides,
  // the skirting, the pump
  const frameWood = plain('#6b4024', 0.55);
  const ledgeWood = plain('#8a5531', 0.55);
  const chalkWhite = plain('#efeee6', 0.9);
  const chalkYellow = plain('#efd77a', 0.9);
  const felt = plain('#3b3f46', 1);
  const deskSide = plain('#5a321c', 0.6);
  const skirting = plain('#3d1a14', 0.6);
  const enamel = plain('#4d6378', 0.4, 0.2);
  const enamelDark = plain('#2f3a46', 0.45, 0.2);
  const alu = plain('#a9afb6', 0.35, 0.8);
  const rubber = plain('#6b1d17', 0.55);
  const box = (w, h, d, m, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  const cyl = (rt, rb, h, m, x, y, z, seg = 20) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  const bw = BOARD.x1 - BOARD.x0;
  const bh = BOARD.y1 - BOARD.y0;
  const fz = BOARD.z + 0.004;
  box(bw + 0.08, 0.04, 0.024, frameWood, 0, BOARD.y1 + 0.02, fz);
  box(bw + 0.08, 0.04, 0.024, frameWood, 0, BOARD.y0 - 0.02, fz);
  box(0.04, bh, 0.024, frameWood, BOARD.x0 - 0.02, (BOARD.y0 + BOARD.y1) / 2, fz);
  box(0.04, bh, 0.024, frameWood, BOARD.x1 + 0.02, (BOARD.y0 + BOARD.y1) / 2, fz);
  // the chalk ledge, with chalk and a duster lying on it
  const ledgeY = BOARD.y0 - 0.034;
  box(bw + 0.1, 0.012, 0.07, ledgeWood, 0, ledgeY, WALL_Z + 0.035);
  for (const [x, m, len] of [
    [-0.62, chalkWhite, 0.05],
    [-0.57, chalkWhite, 0.03],
    [0.58, chalkYellow, 0.045],
    [0.66, chalkWhite, 0.04],
  ]) {
    const c = cyl(0.0055, 0.0055, len, m, x, ledgeY + 0.0115, WALL_Z + 0.045, 10);
    c.rotation.z = Math.PI / 2;
    c.rotation.y = (x * 7) % 0.6;
  }
  box(0.11, 0.022, 0.045, ledgeWood, -0.78, ledgeY + 0.017, WALL_Z + 0.04);
  box(0.11, 0.01, 0.045, felt, -0.78, ledgeY + 0.0065, WALL_Z + 0.04);
  // the skirting along the floor; the desk's sides
  box(5, 0.09, 0.014, skirting, 0, FLOOR_Y + 0.045, WALL_Z + 0.007);
  for (const x of [DESK.x0 + 0.02, DESK.x1 - 0.02])
    box(0.04, 0.72, DESK.z1 - DESK.z0 - 0.04, deskSide, x, DESK_Y - DESK.t - 0.36, (DESK.z0 + DESK.z1) / 2);

  // the vacuum pump: a base plate, the motor (end caps, cooling fins), the pump head, the gauge, the inlet
  const pumpParts = new THREE.Group();
  pumpParts.name = 'VacuumPump';
  const base = DESK_Y + 0.018;
  const addTo = (mesh) => {
    mesh.removeFromParent();
    pumpParts.add(mesh);
    return mesh;
  };
  addTo(box(0.19, 0.018, 0.11, enamelDark, PUMP.x, DESK_Y + 0.009, PUMP.z));
  const motorY = base + 0.046;
  const mx = PUMP.x - 0.035;
  const motor = addTo(cyl(0.042, 0.042, 0.1, enamel, mx, motorY, PUMP.z, 28));
  motor.rotation.z = Math.PI / 2;
  for (const dx of [-0.054, 0.054]) {
    const cap = addTo(cyl(0.044, 0.044, 0.012, enamelDark, mx + dx, motorY, PUMP.z, 28));
    cap.rotation.z = Math.PI / 2;
  }
  for (let k = -2; k <= 2; k++) {
    const fin = addTo(cyl(0.045, 0.045, 0.004, enamel, mx + k * 0.018, motorY, PUMP.z, 28));
    fin.rotation.z = Math.PI / 2;
  }
  addTo(box(0.1, 0.012, 0.05, enamelDark, mx, base + 0.006, PUMP.z)); // the motor's cradle
  const hx = PUMP.x + 0.06;
  addTo(box(0.06, 0.07, 0.08, alu, hx, base + 0.035, PUMP.z));
  addTo(cyl(0.004, 0.004, 0.02, alu, hx, base + 0.08, PUMP.z + 0.012, 10));
  const gaugeY = base + 0.112;
  const gauge = addTo(cyl(0.026, 0.026, 0.014, enamelDark, hx, gaugeY, PUMP.z + 0.012, 28));
  gauge.rotation.x = Math.PI / 2;
  addTo(cyl(0.006, 0.006, 0.022, alu, hx, base + 0.081, PUMP.z - 0.022, 12));
  root.add(pumpParts);
  for (const m of pumpParts.children) m.castShadow = true;
  const dial = new THREE.Mesh(
    new THREE.CircleGeometry(0.022, 28),
    new THREE.MeshStandardMaterial({ name: 'Gauge', map: gaugeTexture(), roughness: 0.4 }),
  );
  dial.position.set(hx, gaugeY, PUMP.z + 0.012 + 0.0075);
  // the rubber hose from the valve on the empty tube's cap: back and level to the right, above the speed arrows and
  // their labels, then down to the pump's inlet
  const inlet = new THREE.Vector3(hx, base + 0.092, PUMP.z - 0.022);
  const a = VALVE_NOZZLE;
  const curve = new THREE.CatmullRomCurve3([
    a.clone(),
    a.clone().add(new THREE.Vector3(0.004, 0.002, -0.035)),
    new THREE.Vector3(a.x + 0.1, a.y + 0.012, -0.12),
    new THREE.Vector3(hx + 0.035, a.y - 0.03, -0.15),
    new THREE.Vector3(hx + 0.03, inlet.y + 0.12, inlet.z - 0.04),
    new THREE.Vector3(hx + 0.012, inlet.y + 0.04, inlet.z - 0.02),
    inlet.clone(),
  ]);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.0055, 8), rubber);
  hose.castShadow = true;
  root.add(hose, wall, board, floor, deskTop, front, dial);

  mergeStatic(root, {
    keep: [wall, board, floor, deskTop, front, dial],
    paint: {
      from: [frameWood, ledgeWood, chalkWhite, chalkYellow, felt, deskSide, skirting, enamel, enamelDark, alu, rubber],
      material: paintMat(),
    },
  });

  // the room beyond, for the turned view: warm grey, darker towards the floor
  const bg = canvas(16, 256);
  const g = bg.ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#8a8072');
  g.addColorStop(0.6, '#6a6157');
  g.addColorStop(1, '#4a423b');
  bg.ctx.fillStyle = g;
  bg.ctx.fillRect(0, 0, 16, 256);
  return { root, background: texture(bg.c, { aniso: 1 }), deskTop };
}
