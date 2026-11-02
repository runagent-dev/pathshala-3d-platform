// The settings round the examples, real size in metres, instead of the white page: each example where it happens.
//  - push: a school corridor, a terrazzo floor, a cream wall over a deep teal dado;
// Only the main objects (the owner): no fences, buildings, notice boards, doors, sacks, blackboards or books.
//  - yard (the rope test): a brick path past the school's boundary wall under the sky (both slide by as they walk);
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

/** A sky for scene.background: a gradient with soft clouds. */
function skyTexture({ top = '#3f7fc4', mid = '#86b6e2', low = '#d4e4ee', seed = 5, clouds = 7 } = {}) {
  const t = tex(
    512,
    256,
    (ctx, w, h, r) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, top);
      g.addColorStop(0.55, mid);
      g.addColorStop(1, low);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < clouds; i++) {
        const x = r() * w;
        const y = 30 + r() * 120;
        for (let k = 0; k < 7; k++) {
          const rad = 12 + r() * 22;
          const cx = x + (r() - 0.5) * 80;
          const cy = y + (r() - 0.5) * 12;
          const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
          cg.addColorStop(0, 'rgba(255,255,255,0.6)');
          cg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = cg;
          ctx.fillRect(cx - rad, cy - rad, 2 * rad, 2 * rad);
        }
      }
    },
    { seed },
  );
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
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

// ── a school corridor (push) ────────────────────────────────────────────────────────────────────────────────────
/** Terrazzo tiles, `tile` m square, 4 × 4 per repeat. */
function terrazzo({ base = '#c8bfae', seed = 13, tile = 0.6 } = {}) {
  return (repeatW, repeatD) =>
    tex(
      512,
      512,
      (ctx, w, h, r) => {
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);
        mottle(ctx, w, h, r, 60, '255,255,255', 0.08, 50);
        for (let i = 0; i < 6000; i++) {
          const v = r();
          ctx.fillStyle =
            v < 0.4
              ? `rgba(70,64,58,${0.25 + r() * 0.3})`
              : v < 0.7
                ? `rgba(160,110,80,${0.2 + r() * 0.3})`
                : `rgba(250,248,240,${0.35 + r() * 0.3})`;
          const s = 1 + r() * 2.6;
          ctx.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.6));
        }
        ctx.fillStyle = 'rgba(70,60,50,0.4)';
        for (let k = 0; k < 4; k++) {
          ctx.fillRect((k * w) / 4, 0, 2, h);
          ctx.fillRect(0, (k * h) / 4, w, 2);
        }
      },
      { repeat: [repeatW / (tile * 4), repeatD / (tile * 4)], seed },
    );
}

export function corridorSetting() {
  const root = new THREE.Group();
  root.name = 'Corridor';
  const W = 16;
  const WALL_Z = -1.5;
  plane(root, W, 9, std('CorridorFloor', terrazzo()(W, 9), 0.55), { z: WALL_Z + 4.5, floor: true });
  const wall = wallTexture({ wall: '#ecd8a6', dado: '#2f6075', dadoH: 1.05, seed: 8 });
  wall.repeat.set(W / 4, 1);
  plane(root, W, 3.2, std('CorridorWall', wall, 0.92), { y: 1.6, z: WALL_Z });
  // nothing on the wall (only the main objects)
  return { root: finish(root), background: new THREE.Color('#d9c79c') };
}

// ── the school yard (rope test): its path and wall slide by, so the student walks past them ─────────────────────
export function yardSetting() {
  const root = new THREE.Group();
  root.name = 'Yard';
  const bricks = tex(
    256,
    256,
    (ctx, w, h, r) => {
      ctx.fillStyle = '#7e6a5a';
      ctx.fillRect(0, 0, w, h);
      const bw = w / 4;
      const bh = h / 8;
      for (let j = 0; j < 8; j++)
        for (let i = -1; i < 5; i++) {
          const x = i * bw + (j % 2 ? bw / 2 : 0);
          const v = r();
          ctx.fillStyle = `rgb(${150 + v * 30},${92 + v * 20},${70 + v * 15})`;
          ctx.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
        }
      specks(ctx, w, h, r, 1500, '60,40,30', '210,180,150');
    },
    { repeat: [24 / 1.0, 8 / 1.0], seed: 23 },
  );
  const ground = std('YardBricks', bricks, 0.9);
  plane(root, 24, 8, ground, { z: 0.5, floor: true });
  const wall = wallTexture({ h: 2.2, wall: '#e3c27a', dado: '#8c7e70', dadoH: 0.5, line: '#efe3c0', seed: 15 });
  wall.repeat.set(24 / 3, 1);
  plane(root, 24, 2.2, std('YardWall', wall, 0.95), { y: 1.1, z: -3.2 });
  return { root: finish(root), background: skyTexture({ seed: 11 }), slide: [bricks, wall], per: [1, 3] };
}
