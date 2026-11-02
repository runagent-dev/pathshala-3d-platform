// The settings round the examples, real size in metres, instead of the white page: each example where it happens.
//  - crane: a building site of packed earth under a blue sky;
//  - push: a school corridor, a terrazzo floor, a cream wall over a deep teal dado;
//  - friction: a store room, a blue-grey cement floor, an ochre wall over a slate dado, a yellow lane;
//  - fall: a classroom, a grey tiled floor, an ochre dado under a pale blue wall;
//  - table (magnet, comb): a teak table top;
// Only the main objects (the owner): no fences, buildings, notice boards, doors, sacks, blackboards or books.
//  - yard (the rope test): a brick path past the school's boundary wall under the sky (both slide by as they walk);
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

// ── the building site (crane) ───────────────────────────────────────────────────────────────────────────────────
export function siteSetting() {
  const root = new THREE.Group();
  root.name = 'Site';
  const earth = tex(
    512,
    512,
    (ctx, w, h, r) => {
      ctx.fillStyle = '#bea07a';
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, 90, '120,92,62', 0.16, 60);
      mottle(ctx, w, h, r, 70, '205,184,150', 0.14, 50);
      specks(ctx, w, h, r, 5000, '80,62,44', '226,210,182');
      // pebbles
      for (let i = 0; i < 220; i++) {
        const v = 120 + Math.floor(r() * 90);
        ctx.fillStyle = `rgb(${v},${v - 8},${v - 20})`;
        ctx.beginPath();
        ctx.ellipse(r() * w, r() * h, 1.5 + r() * 2.5, 1 + r() * 1.8, r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { repeat: [12, 9], seed: 21 },
  );
  // tyre ruts along the site (a second, faint layer over the earth)
  plane(root, 70, 54, std('SiteEarth', earth, 0.97), { z: -8, floor: true });
  const ruts = tex(
    256,
    64,
    (ctx, w, h, r) => {
      ctx.clearRect(0, 0, w, h);
      for (const y of [14, 46]) {
        for (let x = 0; x < w; x += 6) {
          ctx.fillStyle = `rgba(80,60,40,${0.12 + r() * 0.12})`;
          ctx.fillRect(x, y - 5 + r() * 2, 4, 8);
        }
      }
    },
    { repeat: [8, 1], seed: 4 },
  );
  const rutMat = new THREE.MeshStandardMaterial({ name: 'SiteRuts', map: ruts, transparent: true, depthWrite: false, roughness: 1 });
  const rut = plane(root, 40, 2.4, rutMat, { x: -4, y: 0.004, z: 3.2, floor: true });
  rut.renderOrder = 1;

  // nothing else on the site (the owner: only the main objects): no fence, building, town or materials
  finish(root);
  return { root, background: skyTexture({ seed: 7 }) };
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

/** The sky (parachute test). */
export function skySetting() {
  return { root: new THREE.Group(), background: skyTexture({ top: '#2f6fb8', mid: '#7db0e0', low: '#cfe1ef', seed: 3, clouds: 10 }) };
}
