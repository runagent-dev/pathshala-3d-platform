// The setting, in metres, drawn with small canvas textures (no image files): a school physics laboratory. Behind the
// figure a plain wall of blue-grey plaster over a darker dado, a long wooden lab bench with drawers under it and a
// tiled floor; nothing else (the owner: only the main objects).
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

/** The wall: plaster and the dado, in one picture. */
function wallTexture() {
  const W = 1024;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const r = rand(11);
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

const paintMat = () => new THREE.MeshStandardMaterial({ name: 'Paint', vertexColors: true, roughness: 0.7 });
const plain = (color, roughness = 0.7) => new THREE.MeshStandardMaterial({ color, roughness });

/**
 * The room: the wall, its dado rail and skirting, and the floor (nothing else: only the stand and what hangs from it). With `background`
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

  // plain parts, one vertex-coloured mesh: the dado rail and the skirting
  const wood = plain('#6b4428', 0.6);
  const darkWood = plain('#4a2e1b', 0.6);
  const box = (w, h, d, m, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  box(WX1 - WX0, 0.022, 0.016, wood, 0, DADO_Y, WALL_Z + 0.008);
  box(WX1 - WX0, 0.09, 0.014, darkWood, 0, FLOOR_Y + 0.045, WALL_Z + 0.007);

  root.add(wall, floor);
  mergeStatic(root, {
    keep: [wall, floor],
    paint: { from: [wood, darkWood], material: paintMat() },
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
 * the table of the GLB; the drawers under it are scenery.
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
  root.add(scenery);
  mergeStatic(scenery, { keep: [front], paint: { from: [plinth.material], material: paintMat() } });
  return { root, top };
}
