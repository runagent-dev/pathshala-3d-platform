// The setting, in metres: a store room (গুদামঘর) with a polished blue-grey cement floor and a painted yellow lane, a
// lime-washed powder-blue wall over a deep teal dado, and nothing else (only the main objects). The colours are chosen so the red crate, the
// orange shirt and the outlined orange and pink arrows stand out. Static: everything that shares a material is
// merged into one mesh (the small parts in one vertex-coloured mesh), so the room is a handful of draw calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const ROOM = { wallZ: -2.1, wallH: 4.6, width: 24, floorFront: 12 };

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function rng(seed) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}
function texture(canvas, aniso, repeat = null) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}
/** Soft blotches of a colour (mottling of plaster or cement). */
function mottle(ctx, w, h, r, count, colour, alpha, size) {
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = r() * h;
    const s = size * (0.4 + r());
    const g = ctx.createRadialGradient(x, y, 0, x, y, s);
    g.addColorStop(0, `rgba(${colour},${alpha * (0.4 + r() * 0.6)})`);
    g.addColorStop(1, `rgba(${colour},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  }
}

/** Polished cement in blue-grey, 2 m square per repeat: mottled, with saw-cut joints every metre. */
function floorTexture(aniso) {
  const S = 1024;
  const c = canvasOf(S, S);
  const ctx = c.getContext('2d');
  const r = rng(11);
  ctx.fillStyle = '#7f909c';
  ctx.fillRect(0, 0, S, S);
  mottle(ctx, S, S, r, 220, '62,78,92', 0.12, 46);
  mottle(ctx, S, S, r, 200, '170,184,194', 0.12, 38);
  // fine aggregate specks
  for (let i = 0; i < 9000; i++) {
    const v = r();
    ctx.fillStyle = v < 0.5 ? `rgba(48,60,72,${0.12 + r() * 0.2})` : `rgba(214,222,228,${0.1 + r() * 0.2})`;
    ctx.fillRect(r() * S, r() * S, 1 + r() * 1.6, 1 + r() * 1.6);
  }
  // joints (a dark cut with a lighter lip)
  for (const p of [0, S / 2]) {
    ctx.fillStyle = 'rgba(40,50,60,0.55)';
    ctx.fillRect(p, 0, 3, S);
    ctx.fillRect(0, p, S, 3);
    ctx.fillStyle = 'rgba(220,228,234,0.35)';
    ctx.fillRect(p + 3, 0, 1.5, S);
    ctx.fillRect(0, p + 3, S, 1.5);
  }
  return texture(c, aniso, [ROOM.width / 2, (ROOM.floorFront - ROOM.wallZ) / 2]);
}

/** The wall, 4 m wide per repeat, floor to top: skirting, deep teal dado with a cream line, powder-blue lime wash. */
function wallTexture(aniso) {
  const W = 512;
  const H = 512;
  const c = canvasOf(W, H);
  const ctx = c.getContext('2d');
  const r = rng(23);
  const yOf = (m) => H - (m / ROOM.wallH) * H; // metres above the floor → pixels
  // lime wash: a little lighter at the top, blotchy
  const g = ctx.createLinearGradient(0, 0, 0, yOf(1.05));
  g.addColorStop(0, '#cfe6ef');
  g.addColorStop(1, '#b2d5e4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, yOf(1.05));
  mottle(ctx, W, yOf(1.05), r, 90, '120,160,182', 0.18, 70);
  mottle(ctx, W, yOf(1.05), r, 60, '226,238,242', 0.22, 60);
  // dado: oil paint, deep teal-blue, with a few scuffs near the floor
  const d = ctx.createLinearGradient(0, yOf(1.0), 0, H);
  d.addColorStop(0, '#2c6276');
  d.addColorStop(1, '#245366');
  ctx.fillStyle = d;
  ctx.fillRect(0, yOf(1.0), W, H - yOf(1.0));
  mottle(ctx, W, H - yOf(1.0), r, 30, '18,52,66', 0.25, 40);
  ctx.save();
  ctx.translate(0, yOf(1.0));
  mottle(ctx, W, H - yOf(1.0), r, 18, '70,120,138', 0.2, 30);
  ctx.restore();
  // the cream line on top of the dado, and the dark skirting
  ctx.fillStyle = '#efe2bf';
  ctx.fillRect(0, yOf(1.05), W, yOf(1.0) - yOf(1.05));
  ctx.fillStyle = '#1b3644';
  ctx.fillRect(0, yOf(0.12), W, H - yOf(0.12));
  return texture(c, aniso, [ROOM.width / 4, 1]);
}

/**
 * @param {{ aniso?: number }} [options]
 * @returns {{ root: THREE.Group, floor: THREE.Mesh, background: THREE.Color }}
 */
export function createRoom({ aniso = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'StoreRoom';
  root.userData.noExport = true;

  // the floor and the lane (the floor is exported with the crate; the room is not)
  const depth = ROOM.floorFront - ROOM.wallZ;
  const floorGeo = new THREE.PlaneGeometry(ROOM.width, depth).rotateX(-Math.PI / 2).translate(0, 0, (ROOM.floorFront + ROOM.wallZ) / 2);
  const floor = new THREE.Mesh(
    floorGeo,
    new THREE.MeshStandardMaterial({ name: 'CementFloor', map: floorTexture(aniso), roughness: 0.5, metalness: 0 }),
  );
  floor.name = 'Floor';
  floor.receiveShadow = true;

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.wallH).translate(0, ROOM.wallH / 2, ROOM.wallZ),
    new THREE.MeshStandardMaterial({ name: 'Wall', map: wallTexture(aniso), roughness: 0.92, metalness: 0 }),
  );
  wall.name = 'Wall';
  root.add(wall);

  // small parts, in plain colours: merged into one vertex-coloured mesh
  const parts = [];
  const put = (geo, colour, x, y, z, ry = 0) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const key of Object.keys(g.attributes)) if (key !== 'position' && key !== 'normal') g.deleteAttribute(key);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    const col = new THREE.Color(colour);
    const rgb = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < rgb.length; i += 3) col.toArray(rgb, i);
    g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
    parts.push(g);
  };
  const box = (w, h, d, colour, x, y, z, ry = 0) => put(new THREE.BoxGeometry(w, h, d), colour, x, y, z, ry);

  // the lane painted on the floor: two yellow lines either side of the pull
  for (const z of [-0.94, 0.94]) box(ROOM.width, 0.004, 0.05, '#f2c230', 0, 0.002, z);

  // nothing else on the wall or along it (the owner: only the main objects): no windows, shelf, clock or sacks

  const paint = new THREE.MeshStandardMaterial({ name: 'RoomParts', vertexColors: true, roughness: 0.75, metalness: 0 });
  const merged = new THREE.Mesh(mergeGeometries(parts, false), paint);
  merged.name = 'RoomParts';
  root.add(merged);
  for (const g of parts) g.dispose();

  return { root, floor, background: new THREE.Color('#9fbfcf') };
}
