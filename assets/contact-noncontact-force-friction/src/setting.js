// The settings round the examples, real size in metres, instead of the white page: each example where it happens.
//  - friction: a store room, a blue-grey cement floor, an ochre wall over a slate dado, a yellow lane;
// Only the main objects (the owner): no fences, buildings, notice boards, doors, sacks, blackboards or books.
//  - sky (the parachute test): a blue sky with clouds.
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
/** A plain-coloured material for a part that is merged into the setting's vertex-coloured mesh. */
function pc(color) {
  if (!plain.has(color)) plain.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  return plain.get(color);
}
const PAINT = new THREE.MeshStandardMaterial({ name: 'SettingPaint', vertexColors: true, roughness: 0.85 });

function boxAt(parent, w, h, d, color, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? pc(color) : color);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  parent.add(m);
  return m;
}
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

// ── a store room (friction) ─────────────────────────────────────────────────────────────────────────────────────
export function storeSetting() {
  const root = new THREE.Group();
  root.name = 'StoreRoom';
  const W = 12;
  const WALL_Z = -1.15;
  const floor = tex(
    512,
    512,
    (ctx, w, h, r) => {
      ctx.fillStyle = '#7f909c';
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, 120, '62,78,92', 0.12, 46);
      mottle(ctx, w, h, r, 110, '170,184,194', 0.12, 38);
      specks(ctx, w, h, r, 5000, '48,60,72', '214,222,228');
      for (const p of [0, w / 2]) {
        ctx.fillStyle = 'rgba(40,50,60,0.5)';
        ctx.fillRect(p, 0, 3, h);
        ctx.fillRect(0, p, w, 3);
        ctx.fillStyle = 'rgba(220,228,234,0.3)';
        ctx.fillRect(p + 3, 0, 1.5, h);
        ctx.fillRect(0, p + 3, w, 1.5);
      }
    },
    { repeat: [W / 2, 4], seed: 11 },
  );
  plane(root, W, 8, std('StoreFloor', floor, 0.5), { z: WALL_Z + 4, floor: true });
  const wall = wallTexture({ wall: '#d6b46e', dado: '#43596b', dadoH: 0.9, line: '#e9dcb8', seed: 6 });
  wall.repeat.set(W / 4, 1);
  plane(root, W, 3.2, std('StoreWall', wall, 0.95), { y: 1.6, z: WALL_Z });
  // a yellow lane painted on the floor, far from the crate
  boxAt(root, W, 0.002, 0.08, '#d9b23a', 0, 0.001, -0.62);
  return { root: finish(root), background: new THREE.Color('#bfa36a') };
}

/** The sky (parachute test). */
export function skySetting() {
  return { root: new THREE.Group(), background: skyTexture({ top: '#2f6fb8', mid: '#7db0e0', low: '#cfe1ef', seed: 3, clouds: 10 }) };
}
