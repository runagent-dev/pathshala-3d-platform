// The settings round the examples, real size in metres, instead of the white page: each example where it happens.
//  - fall: a classroom, a grey tiled floor, an ochre dado under a pale blue wall;
//  - table (magnet, comb): a teak table top;
// Only the main objects (the owner): no fences, buildings, notice boards, doors, sacks, blackboards or books.
// The colours keep clear of the two kinds' colours (orange স্পর্শ বল, violet অস্পর্শ বল) behind where the arrows,
// the patches and the gaps are, and of the bodies (the grey block, the brown carton and crate, the white football).
// Static: everything that shares a material is merged into one mesh, the plain-coloured parts into one
// vertex-coloured mesh, so a setting is a handful of draw calls. Only the floors (and walls) receive shadows; nothing
// here casts them. Canvas textures are made once, 512 px at most. Each returns { root, background }.
import * as THREE from 'three';
import { mergeStatic } from './merge.js';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}
/** A canvas texture drawn by draw(ctx, w, h, r) (r: a seeded random), tiling `repeat` times. */
function tex(w, h, draw, { repeat = [1, 1], seed = 1, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h, rng(seed));
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  return t;
}
/** Soft blotches of a colour (mottling of plaster, cement or earth). */
function mottle(ctx, w, h, r, count, rgb, alpha, size) {
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = r() * h;
    const s = size * (0.4 + r());
    const g = ctx.createRadialGradient(x, y, 0, x, y, s);
    g.addColorStop(0, `rgba(${rgb},${alpha * (0.4 + r() * 0.6)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  }
}
/** Fine specks (aggregate, grit). */
function specks(ctx, w, h, r, count, dark, light) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = r() < 0.5 ? `rgba(${dark},${0.1 + r() * 0.2})` : `rgba(${light},${0.1 + r() * 0.2})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 1.6, 1 + r() * 1.6);
  }
}

// ── shared pieces ────────────────────────────────────────────────────────────────────────────────────────────────
const plain = new Map();
const PAINT = new THREE.MeshStandardMaterial({ name: 'SettingPaint', vertexColors: true, roughness: 0.85 });

/** A flat textured plane: a floor (rotated flat) or a wall facing +z. */
function plane(parent, w, h, material, { x = 0, y = 0, z = 0, floor = false, receive = true } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  if (floor) m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}
function std(name, map, roughness = 0.9, extra = {}) {
  return new THREE.MeshStandardMaterial({ name, map, roughness, metalness: 0, ...extra });
}
/** Merge the static parts; every plain-coloured part into one vertex-coloured mesh. */
function finish(root) {
  mergeStatic(root, { paint: { from: [...plain.values()], material: PAINT } });
  return root;
}

/** A wall texture, `h` m high (4 m wide per repeat unless set): skirting, a dado to `dadoH` with a line on it, the wall above. */
function wallTexture({ h = 3.2, wall, dado, dadoH = 1.0, line = '#efe6cc', seed = 3 }) {
  const PX = 512;
  return tex(
    PX,
    PX,
    (ctx, W, H, r) => {
      const my = H / h;
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, W, H);
      mottle(ctx, W, H, r, 120, '255,255,255', 0.07, 40);
      mottle(ctx, W, H, r, 120, '60,50,40', 0.05, 40);
      const top = H - dadoH * my;
      ctx.fillStyle = dado;
      ctx.fillRect(0, top, W, H - top);
      mottle(ctx, W, H - top, r, 40, '0,0,0', 0.05, 30);
      ctx.fillStyle = line;
      ctx.fillRect(0, top - 5, W, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, top, W, 2);
      // skirting
      ctx.fillStyle = 'rgba(25,30,35,0.55)';
      ctx.fillRect(0, H - 0.1 * my, W, 0.1 * my);
    },
    { seed, repeat: [1, 1] },
  );
}

// ── a classroom (fall) ──────────────────────────────────────────────────────────────────────────────────────────
export function classroomSetting() {
  const root = new THREE.Group();
  root.name = 'Classroom';
  const W = 10;
  const WALL_Z = -1.35;
  const floor = tex(
    512,
    512,
    (ctx, w, h, r) => {
      ctx.fillStyle = '#aeb3b5';
      ctx.fillRect(0, 0, w, h);
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 4; i++) {
          const v = (r() - 0.5) * 14;
          ctx.fillStyle = `rgba(${v > 0 ? '255,255,255' : '40,45,50'},${Math.abs(v) / 100})`;
          ctx.fillRect((i * w) / 4, (j * h) / 4, w / 4, h / 4);
        }
      mottle(ctx, w, h, r, 60, '90,96,100', 0.08, 40);
      specks(ctx, w, h, r, 3500, '70,74,78', '235,238,240');
      ctx.fillStyle = 'rgba(60,64,68,0.45)';
      for (let k = 0; k < 4; k++) {
        ctx.fillRect((k * w) / 4, 0, 2, h);
        ctx.fillRect(0, (k * h) / 4, w, 2);
      }
    },
    { repeat: [W / 1.6, 6 / 1.6], seed: 17 },
  );
  plane(root, W, 6, std('ClassFloor', floor, 0.6), { z: WALL_Z + 3, floor: true });
  const wall = wallTexture({ wall: '#a9c7dc', dado: '#c58d3e', dadoH: 1.0, line: '#f1e6c8', seed: 12 });
  wall.repeat.set(W / 4, 1);
  plane(root, W, 3.2, std('ClassWall', wall, 0.95), { y: 1.6, z: WALL_Z });
  // nothing on the wall or the floor (only the main objects)
  return { root: finish(root), background: new THREE.Color('#9fb8c9') };
}

// ── a teak table top (magnet, comb) ─────────────────────────────────────────────────────────────────────────────
export function tableSetting() {
  const root = new THREE.Group();
  root.name = 'Table';
  const wood = tex(
    512,
    256,
    (ctx, w, h, r) => {
      ctx.fillStyle = '#9c6a3c';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        const y = r() * h;
        ctx.strokeStyle = r() < 0.5 ? `rgba(80,45,20,${0.08 + r() * 0.12})` : `rgba(200,150,100,${0.06 + r() * 0.1})`;
        ctx.lineWidth = 1 + r() * 3;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 10, w * 0.7, y + (r() - 0.5) * 10, w, y);
        ctx.stroke();
      }
      // two plank joints
      ctx.fillStyle = 'rgba(50,28,12,0.45)';
      ctx.fillRect(0, h * 0.5, w, 2);
      ctx.fillRect(0, 0, w, 2);
    },
    { repeat: [1.6 / 0.4, 1.0 / 0.2], seed: 19 },
  );
  plane(root, 1.6, 1.0, std('TableTop', wood, 0.55), { z: -0.3, floor: true });
  return { root: finish(root), background: new THREE.Color('#6d4a2c') };
}
