// The setting, in metres: the teacher's desk before a plain, soft wall, nothing else (no blackboard, chalk, pump or
// hose: the owner asked for only the main object, big). The apparatus stands on the desk. Everything is still:
// merged into one mesh per material (src/merge.js) and never exported to the GLB.
import * as THREE from 'three';
import { BASE } from './apparatus.js';
import { mergeStatic } from './merge.js';

export const DESK_Y = -BASE.h; // the desk's top: the wooden base stands on it
const FLOOR_Y = DESK_Y - 0.75;
const WALL_Z = -0.56;
const DESK = { x0: -0.75, x1: 0.75, z0: -0.45, z1: 0.33, t: 0.032 };

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

  // the wall (plain, soft), the floor
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.6), new THREE.MeshStandardMaterial({ name: 'Wall', color: '#d8d2c6', roughness: 0.95 }));
  wall.position.set(0, FLOOR_Y + 1.3, WALL_Z);
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

  // the desk's sides and the skirting, one vertex-coloured mesh (no blackboard, chalk, pump or hose: the owner
  // asked for only the main object, big)
  const deskSide = plain('#5a321c', 0.6);
  const skirting = plain('#8f8577', 0.6);
  const box = (w, h, d, m, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  box(5, 0.09, 0.014, skirting, 0, FLOOR_Y + 0.045, WALL_Z + 0.007);
  for (const x of [DESK.x0 + 0.02, DESK.x1 - 0.02])
    box(0.04, 0.72, DESK.z1 - DESK.z0 - 0.04, deskSide, x, DESK_Y - DESK.t - 0.36, (DESK.z0 + DESK.z1) / 2);
  root.add(wall, floor, deskTop, front);

  mergeStatic(root, {
    keep: [wall, floor, deskTop, front],
    paint: { from: [deskSide, skirting], material: paintMat() },
  });

  // the room beyond, for the turned view: soft warm grey, a little darker towards the floor
  const bg = canvas(16, 256);
  const g = bg.ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#dcd6cb');
  g.addColorStop(0.6, '#cfc7ba');
  g.addColorStop(1, '#bdb3a4');
  bg.ctx.fillStyle = g;
  bg.ctx.fillRect(0, 0, 16, 256);
  return { root, background: texture(bg.c, { aniso: 1 }), deskTop };
}
