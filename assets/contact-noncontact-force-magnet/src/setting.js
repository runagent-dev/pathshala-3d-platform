// The settings round the examples, real size in metres, instead of the white page: each example where it happens.
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
