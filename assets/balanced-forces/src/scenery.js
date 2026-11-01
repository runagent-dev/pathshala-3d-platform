// The setting, in metres, drawn with small canvas textures (no image files): a school physics laboratory. Behind the
// figure a wall of blue-grey plaster over a darker dado, a slate blackboard on the left (a chalk drawing of a body on
// a string with its two forces), a cork notice board and a clock on the right, a shelf of bottles and flasks; a long
// wooden lab bench with drawers under it, a stack of books and a beaker at its back; a tiled floor.
// The wall stays in both examples; the bench belongs to the ball on the string (the book hangs in front of the wall).
// Everything is still: merged into one mesh per material (src/merge.js), never exported to the GLB except the bench's
// top (the ball's table).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeStatic } from './merge.js';

export const WALL_Z = -0.45; // the wall's face
const FLOOR_Y = -0.95;
const DADO_Y = -0.42; // the top of the darker paint
// the wall picture: 3.6 m × 1.8 m in 1024 × 512 px
const WX0 = -1.8;
const WX1 = 1.8;
const WY0 = FLOOR_Y;
const WY1 = 0.85;

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

/** The wall: plaster, the dado, the blackboard and the notice board, in one picture. */
function wallTexture() {
  const W = 1024;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const r = rand(11);
  const px = (x) => ((x - WX0) / (WX1 - WX0)) * W;
  const py = (y) => ((WY1 - y) / (WY1 - WY0)) * H;
  // blue-grey distemper, lighter towards the top (the light from the windows), mottled, with roller streaks
  const g = ctx.createLinearGradient(0, 0, 0, py(DADO_Y));
  g.addColorStop(0, '#9db3c8');
  g.addColorStop(1, '#859cb3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, py(DADO_Y));
  // soft patches of uneven distemper, then a fine grain, then faint roller marks
  for (let i = 0; i < 1400; i++) {
    const x = r() * W;
    const y = r() * py(DADO_Y);
    const s = 3 + r() * 13;
    const d = ctx.createRadialGradient(x, y, 0, x, y, s);
    const c0 = r() < 0.5 ? `rgba(168,186,204,${0.05 + r() * 0.07})` : `rgba(66,86,108,${0.04 + r() * 0.06})`;
    d.addColorStop(0, c0);
    d.addColorStop(1, c0.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = d;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  }
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '40,56,74' : '190,205,220'},${0.06 + r() * 0.08})`;
    ctx.fillRect(r() * W, r() * py(DADO_Y), 1, 1);
  }
  for (let i = 0; i < 90; i++) {
    const x = r() * W;
    ctx.fillStyle = `rgba(${r() < 0.5 ? '160,178,196' : '70,90,110'},0.025)`;
    ctx.fillRect(x, 0, 6 + r() * 14, py(DADO_Y));
  }
  // a little grime just above the bench and the dado
  const grime = ctx.createLinearGradient(0, py(-0.12), 0, py(DADO_Y));
  grime.addColorStop(0, 'rgba(50,60,70,0)');
  grime.addColorStop(1, 'rgba(50,60,70,0.18)');
  ctx.fillStyle = grime;
  ctx.fillRect(0, py(-0.12), W, py(DADO_Y) - py(-0.12));
  // the dado: darker oil paint, a few scuffs where stools knock it
  ctx.fillStyle = '#3d5063';
  ctx.fillRect(0, py(DADO_Y), W, H - py(DADO_Y));
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(${r() < 0.6 ? '30,40,52' : '110,128,146'},${0.06 + r() * 0.1})`;
    ctx.fillRect(r() * W, py(DADO_Y) + r() * (H - py(DADO_Y)), 3 + r() * 16, 1 + r() * 3);
  }
  // the blackboard on the left: a wooden frame, slate, chalk dust, a chalk drawing and the ledge
  const bx = px(-1.55);
  const by = py(0.62);
  const bw = px(-0.66) - bx;
  const bh = py(-0.02) - by;
  ctx.fillStyle = 'rgba(20,28,38,0.35)';
  ctx.fillRect(bx - 8, by - 6, bw + 20, bh + 22);
  ctx.fillStyle = '#6b4024';
  ctx.fillRect(bx - 10, by - 10, bw + 20, bh + 20);
  const slate = ctx.createLinearGradient(0, by, 0, by + bh);
  slate.addColorStop(0, '#29333d');
  slate.addColorStop(1, '#202830');
  ctx.fillStyle = slate;
  ctx.fillRect(bx, by, bw, bh);
  for (let i = 0; i < 50; i++) {
    const x = bx + r() * bw;
    const y = by + r() * bh;
    const s = 12 + r() * 40;
    const d = ctx.createRadialGradient(x, y, 0, x, y, s);
    d.addColorStop(0, `rgba(215,220,225,${0.03 + r() * 0.05})`);
    d.addColorStop(1, 'rgba(215,220,225,0)');
    ctx.fillStyle = d;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  }
  ctx.strokeStyle = 'rgba(238,240,242,0.55)';
  ctx.fillStyle = 'rgba(238,240,242,0.55)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  // a hook, a string, a ball; an arrow up from it and one down (the same length)
  const cx = bx + bw * 0.62;
  ctx.beginPath();
  ctx.moveTo(cx - 34, by + 22);
  ctx.lineTo(cx + 34, by + 22);
  ctx.moveTo(cx, by + 22);
  ctx.lineTo(cx, by + 70);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, by + 80, 10, 0, Math.PI * 2);
  ctx.stroke();
  const chalkArrow = (x, y0, y1) => {
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    const s = Math.sign(y1 - y0);
    ctx.moveTo(x - 6, y1 - s * 8);
    ctx.lineTo(x, y1);
    ctx.lineTo(x + 6, y1 - s * 8);
    ctx.stroke();
  };
  chalkArrow(cx + 26, by + 82, by + 40);
  chalkArrow(cx + 26, by + 92, by + 134);
  // a triangle of three arrows, tip to tail, on the left of the board
  ctx.beginPath();
  ctx.moveTo(bx + 40, by + 120);
  ctx.lineTo(bx + 92, by + 120);
  ctx.lineTo(bx + 66, by + 76);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#8a5531';
  ctx.fillRect(bx - 12, by + bh + 6, bw + 24, 7);
  ctx.fillStyle = '#efefe8';
  ctx.fillRect(bx + bw * 0.2, by + bh + 3, 14, 4);
  ctx.fillRect(bx + bw * 0.24, by + bh + 4, 10, 3);
  // the notice board on the right: cork in a thin frame, sheets of paper pinned to it (no writing to read)
  const nx = px(0.27);
  const ny = py(0.47);
  const nw = px(0.86) - nx;
  const nh = py(0.07) - ny;
  ctx.fillStyle = 'rgba(20,28,38,0.3)';
  ctx.fillRect(nx - 4, ny - 2, nw + 12, nh + 12);
  ctx.fillStyle = '#7a5434';
  ctx.fillRect(nx - 5, ny - 5, nw + 10, nh + 10);
  ctx.fillStyle = '#b58a5c';
  ctx.fillRect(nx, ny, nw, nh);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '120,84,50' : '210,170,120'},${0.15 + r() * 0.2})`;
    ctx.fillRect(nx + r() * nw, ny + r() * nh, 1 + r() * 2, 1 + r() * 2);
  }
  const papers = [
    [0.06, 0.1, 0.3, 0.42, '#f6f1e3', -0.04],
    [0.42, 0.06, 0.26, 0.34, '#fde9a6', 0.05],
    [0.72, 0.14, 0.22, 0.3, '#d6e6f5', -0.03],
    [0.4, 0.5, 0.34, 0.4, '#f8f6f0', 0.03],
    [0.06, 0.6, 0.24, 0.32, '#f7d7c8', 0.02],
  ];
  for (const [fx, fy, fw, fh, col, rot] of papers) {
    ctx.save();
    ctx.translate(nx + (fx + fw / 2) * nw, ny + (fy + fh / 2) * nh);
    ctx.rotate(rot);
    const w = fw * nw;
    const h = fh * nh;
    ctx.fillStyle = 'rgba(40,30,20,0.25)';
    ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w, h);
    ctx.fillStyle = col;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = 'rgba(60,70,90,0.28)';
    for (let y = -h / 2 + 8; y < h / 2 - 4; y += 4) ctx.fillRect(-w / 2 + 4, y, (w - 8) * (0.5 + r() * 0.5), 1);
    ctx.fillStyle = r() < 0.5 ? '#c92a2a' : '#1c7ed6';
    ctx.beginPath();
    ctx.arc(0, -h / 2 + 3, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  return texture(c, { aniso: 8 });
}

/** Bench top planks: dark lacquered wood, along x (repeats). */
function benchTopTexture() {
  const W = 512;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const r = rand(53);
  ctx.fillStyle = '#7c4c2b';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 110; i++) {
    const y0 = r() * H;
    ctx.strokeStyle = `rgba(${60 + r() * 40},${30 + r() * 20},14,${0.15 + r() * 0.25})`;
    ctx.lineWidth = 0.8 + r() * 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin(x * 0.012 + i) * 3;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(200,150,100,${0.04 + r() * 0.05})`;
    ctx.fillRect(r() * W, r() * H, 20 + r() * 60, 2 + r() * 4);
  }
  ctx.fillStyle = 'rgba(30,14,6,0.55)';
  for (let y = 0; y < H; y += 64) ctx.fillRect(0, y, W, 2);
  return texture(c, { repeat: true, aniso: 8 });
}

/** The bench's front: drawers and cupboard doors in painted wood, brass handles (2.1 m × 0.72 m). */
function benchFrontTexture() {
  const W = 1024;
  const H = 352;
  const { c, ctx } = canvas(W, H);
  const r = rand(29);
  ctx.fillStyle = '#5b3a24';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) {
    ctx.strokeStyle = `rgba(30,16,8,${0.08 + r() * 0.12})`;
    ctx.lineWidth = 1;
    const y = r() * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + (r() - 0.5) * 6);
    ctx.stroke();
  }
  const panel = (x, y, w, h, handle) => {
    ctx.fillStyle = 'rgba(20,10,4,0.55)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#74492c');
    g.addColorStop(1, '#663f26');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,220,180,0.08)';
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = '#c9a64e';
    if (handle === 'bar') ctx.fillRect(x + w / 2 - 18, y + 14, 36, 5);
    else ctx.fillRect(x + (handle === 'left' ? 10 : w - 15), y + h * 0.42, 5, 26);
  };
  const cols = 5;
  const cw = W / cols;
  for (let i = 0; i < cols; i++) {
    const x = i * cw + 8;
    panel(x, 10, cw - 16, 62, 'bar');
    panel(x, 84, cw - 16, H - 96, i % 2 ? 'left' : 'right');
  }
  return texture(c, { aniso: 8 });
}

/** Floor tiles: grey-and-cream terrazzo squares (repeats; one repeat is 1.2 m). */
function floorTexture() {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  const r = rand(5);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#9b948a' : '#c9c0b0';
      ctx.fillRect(i * 64, j * 64, 64, 64);
    }
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '60,55,50' : '235,230,220'},${0.2 + r() * 0.3})`;
    ctx.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2);
  }
  ctx.fillStyle = 'rgba(50,45,40,0.5)';
  for (let k = 0; k <= S; k += 64) {
    ctx.fillRect(k - 1, 0, 2, S);
    ctx.fillRect(0, k - 1, S, 2);
  }
  return texture(c, { repeat: true, aniso: 8 });
}

/** The clock's face: cream, twelve marks, the hands at ten past ten (no numbers). */
function clockTexture() {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  ctx.fillStyle = '#f4efe2';
  ctx.fillRect(0, 0, S, S);
  ctx.translate(S / 2, S / 2);
  ctx.fillStyle = '#2b2f36';
  for (let i = 0; i < 60; i++) {
    ctx.save();
    ctx.rotate((i / 60) * Math.PI * 2);
    if (i % 5 === 0) ctx.fillRect(-3, -118, 6, 22);
    else ctx.fillRect(-1, -118, 2, 9);
    ctx.restore();
  }
  const hand = (a, l, w) => {
    ctx.save();
    ctx.rotate(a);
    ctx.fillRect(-w / 2, -l, w, l + 12);
    ctx.restore();
  };
  hand((10 / 12) * Math.PI * 2 + (10 / 60) * (Math.PI / 6), 62, 9);
  hand((10 / 60) * Math.PI * 2, 92, 6);
  ctx.fillStyle = '#c92a2a';
  hand((38 / 60) * Math.PI * 2, 100, 2);
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  return texture(c);
}

const paintMat = () => new THREE.MeshStandardMaterial({ name: 'Paint', vertexColors: true, roughness: 0.7 });
const plain = (color, roughness = 0.7) => new THREE.MeshStandardMaterial({ color, roughness });

/**
 * The room: the wall, its dado rail and skirting, the shelf with bottles, the clock and the floor. With `background`
 * the room beyond (for the turned view).
 */
export function createRoom() {
  const root = new THREE.Group();
  root.name = 'Laboratory';
  root.userData.noExport = true;
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0),
    new THREE.MeshStandardMaterial({ name: 'Wall', map: wallTexture(), roughness: 0.92 }),
  );
  wall.position.set((WX0 + WX1) / 2, (WY0 + WY1) / 2, WALL_Z);
  wall.receiveShadow = true;
  const floorMap = floorTexture();
  floorMap.repeat.set(3, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4), new THREE.MeshStandardMaterial({ name: 'Floor', map: floorMap, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR_Y, WALL_Z + 1.2);

  // plain parts, one vertex-coloured mesh: the dado rail, the skirting, the shelf and its brackets, the clock's rim,
  // the bottles' liquids and caps
  const wood = plain('#6b4428', 0.6);
  const darkWood = plain('#4a2e1b', 0.6);
  const rim = plain('#2b2f36', 0.45);
  const cap = plain('#1f2329', 0.5);
  const brown = plain('#6e3b12', 0.3);
  const blue = plain('#1c4f8c', 0.3);
  const amber = plain('#d9902a', 0.35);
  const pink = plain('#c2255c', 0.35);
  const label = plain('#efe9da', 0.8);
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
  box(WX1 - WX0, 0.022, 0.016, wood, 0, DADO_Y, WALL_Z + 0.008);
  box(WX1 - WX0, 0.09, 0.014, darkWood, 0, FLOOR_Y + 0.045, WALL_Z + 0.007);

  // the shelf on the right, its brackets, and what stands on it: reagent bottles, a flask, a beaker
  const SY = 0.16; // the shelf's top
  const SZ = WALL_Z + 0.08;
  const SX = 0.5; // the shelf's middle is this far right of where the bottles below are drawn
  box(0.62, 0.02, 0.16, wood, 0.74 + SX, SY - 0.01, SZ).castShadow = true;
  for (const x of [0.5, 0.98]) box(0.016, 0.07, 0.12, darkWood, x + SX, SY - 0.055, WALL_Z + 0.065);
  const glass = new THREE.MeshStandardMaterial({
    name: 'Glass',
    color: '#dfeef5',
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const bottle = (x, liquid, h = 0.11, r = 0.026) => {
    cyl(r, r, h, liquid, x, SY + h / 2, SZ, 20);
    cyl(r * 0.45, r * 0.6, 0.02, liquid, x, SY + h + 0.01, SZ, 14);
    cyl(r * 0.5, r * 0.5, 0.016, cap, x, SY + h + 0.028, SZ, 14);
    box(r * 1.4, h * 0.42, 0.002, label, x, SY + h * 0.48, SZ + r + 0.0005);
  };
  bottle(0.56 + SX, brown);
  bottle(0.63 + SX, blue, 0.095, 0.024);
  bottle(0.92 + SX, brown, 0.08, 0.022);
  // a conical flask with pink liquid, and a beaker with amber, in glass
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
      24,
    ),
    glass,
  );
  flask.position.set(0.74 + SX, SY, SZ);
  root.add(flask);
  const liquidIn = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0, 0.002],
        [0.04, 0.002],
        [0.032, 0.03],
        [0, 0.03],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      24,
    ),
    pink,
  );
  liquidIn.position.copy(flask.position);
  root.add(liquidIn);
  const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 24, 1, true), glass);
  beaker.position.set(0.84 + SX, SY + 0.04, SZ);
  root.add(beaker);
  cyl(0.028, 0.028, 0.035, amber, 0.84 + SX, SY + 0.019, SZ, 24);

  // the clock, high on the right above the notice board
  const CX = 0.56;
  const CY = 0.64;
  const clockRim = cyl(0.085, 0.085, 0.03, rim, CX, CY, WALL_Z + 0.015, 40);
  clockRim.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.075, 40),
    new THREE.MeshStandardMaterial({ name: 'ClockFace', map: clockTexture(), roughness: 0.5 }),
  );
  face.position.set(CX, CY, WALL_Z + 0.031);
  root.add(wall, floor, face);
  mergeStatic(root, {
    keep: [wall, floor, face],
    paint: { from: [wood, darkWood, rim, cap, brown, blue, amber, pink, label], material: paintMat() },
  });

  // the room beyond, for the turned view: a dim warm grey, darker towards the floor
  const bg = canvas(16, 256);
  const g = bg.ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#7b8794');
  g.addColorStop(0.6, '#5c6672');
  g.addColorStop(1, '#3f4650');
  bg.ctx.fillStyle = g;
  bg.ctx.fillRect(0, 0, 16, 256);
  return { root, background: texture(bg.c, { aniso: 1 }) };
}

/**
 * The lab bench the stand and the ball stand over: its top's upper face at y. The top (a lacquered wooden slab) is
 * the table of the GLB; the drawers under it, the books and the beaker at its back are scenery.
 * @param {number} y
 */
export function createBench(y) {
  const root = new THREE.Group();
  root.name = 'Bench';
  const W = 2.2;
  const D = WALL_Z * -1 + 0.15; // from the wall to 15 cm in front of the ball
  const z0 = WALL_Z + D / 2;
  const topMap = benchTopTexture();
  topMap.repeat.set(3, 1);
  const edge = new THREE.MeshStandardMaterial({ name: 'BenchEdge', color: '#5e3820', roughness: 0.5 });
  const topMat = new THREE.MeshStandardMaterial({ name: 'BenchTop', map: topMap, roughness: 0.42 });
  // three slabs side by side, their grain continuous: the middle one under the stand and the ball (0.9 m, as the
  // table of the GLB), the two long ends one mesh of scenery
  const slab = (x0, x1) => {
    const w = x1 - x0;
    const g = new THREE.BoxGeometry(w, 0.035, D);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, (x0 + uv.getX(i) * w + W / 2) / W);
    return g.translate((x0 + x1) / 2, y - 0.0175, z0);
  };
  const top = new THREE.Mesh(slab(-0.55, 0.35), [edge, edge, topMat, edge, edge, edge]);
  top.name = 'Table';
  const ends = new THREE.Mesh(
    mergeGeometries(
      [slab(-W / 2, -0.55), slab(0.35, W / 2)].map((g) => {
        g.clearGroups();
        return g;
      }),
    ),
    topMat,
  );
  ends.name = 'BenchEnds';
  ends.userData.noExport = true;
  top.receiveShadow = ends.receiveShadow = true;
  root.add(top, ends);

  const scenery = new THREE.Group();
  scenery.name = 'BenchScenery';
  scenery.userData.noExport = true;
  const H = y - 0.035 - FLOOR_Y;
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.1, H),
    new THREE.MeshStandardMaterial({ name: 'BenchFront', map: benchFrontTexture(), roughness: 0.6 }),
  );
  front.position.set(0, FLOOR_Y + H / 2, z0 + D / 2 - 0.03);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.07, 0.02), plain('#2b1b10'));
  plinth.position.set(0, FLOOR_Y + 0.035, z0 + D / 2 - 0.02);
  scenery.add(front, plinth);
  // at the back: two textbooks on the left, a beaker of water on the right
  const cover1 = plain('#1f5fae', 0.6);
  const cover2 = plain('#c25a00', 0.6);
  const pages = plain('#eee6d2', 0.9);
  const book = (w, h, d, cover, x, yy, z, rot) => {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cover);
    const p = new THREE.Mesh(new THREE.BoxGeometry(w - 0.006, h - 0.004, d - 0.006), pages);
    p.position.x = 0.004;
    g.add(c, p);
    g.position.set(x, yy + h / 2, z);
    g.rotation.y = rot;
    c.castShadow = true;
    scenery.add(g);
  };
  book(0.26, 0.035, 0.19, cover1, -0.76, y, WALL_Z + 0.14, 0.12);
  book(0.24, 0.03, 0.17, cover2, -0.75, y + 0.035, WALL_Z + 0.14, -0.08);
  const glass = new THREE.MeshStandardMaterial({
    name: 'BenchGlass',
    color: '#e3f1f7',
    roughness: 0.06,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.11, 28, 1, true), glass);
  beaker.position.set(0.44, y + 0.055, WALL_Z + 0.13);
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.06, 28),
    new THREE.MeshStandardMaterial({ name: 'Water', color: '#6fa8dc', roughness: 0.1, transparent: true, opacity: 0.55 }),
  );
  water.position.set(0.44, y + 0.031, WALL_Z + 0.13);
  scenery.add(beaker, water);
  root.add(scenery);
  mergeStatic(scenery, { keep: [front, beaker, water], paint: { from: [cover1, cover2, pages, plinth.material], material: paintMat() } });
  return { root, top };
}
