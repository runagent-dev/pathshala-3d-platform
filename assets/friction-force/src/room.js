// The setting, in metres: a store room (গুদামঘর) with a polished blue-grey cement floor and a painted yellow lane, a
// lime-washed powder-blue wall over a deep teal dado, two barred windows with the sky outside, a shelf of tins and
// boxes, a clock, and jute sacks and wooden crates stacked along the wall. The colours are chosen so the red crate, the
// orange shirt and the outlined orange and pink arrows stand out. Static: everything that shares a material is
// merged into one mesh (the small parts in one vertex-coloured mesh), so the room is a handful of draw calls.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
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

/** The sky outside a window: blue at the top, hazy near the horizon, a few soft clouds. */
function skyTexture() {
  const c = canvasOf(128, 128);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#5aa0dc');
  g.addColorStop(0.75, '#a9d2ee');
  g.addColorStop(1, '#d8ecf5');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const r = rng(5);
  mottle(ctx, 128, 90, r, 10, '255,255,255', 0.55, 22);
  return texture(c, 1);
}

/** Jute: a woven tan cloth. */
function juteTexture(aniso) {
  const c = canvasOf(128, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b48a55';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 4) {
    ctx.fillStyle = 'rgba(90,62,30,0.28)';
    ctx.fillRect(i, 0, 1.5, 128);
    ctx.fillRect(0, i + 2, 128, 1.5);
  }
  return texture(c, aniso, [2, 2]);
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
  const z0 = ROOM.wallZ;

  // the lane painted on the floor: two yellow lines either side of the pull
  for (const z of [-0.94, 0.94]) box(ROOM.width, 0.004, 0.05, '#f2c230', 0, 0.002, z);

  // two windows: a wooden frame, a sill, iron bars (the sky is a separate glass pane)
  const windows = [-2.75, 2.75];
  const glassGeos = [];
  for (const x of windows) {
    const wW = 1.15;
    const wH = 1.3;
    const cy = 2.35;
    const frame = '#7a4a26';
    box(wW + 0.16, 0.09, 0.08, frame, x, cy + wH / 2 + 0.045, z0 + 0.04);
    box(wW + 0.16, 0.09, 0.08, frame, x, cy - wH / 2 - 0.045, z0 + 0.04);
    box(0.08, wH, 0.08, frame, x - wW / 2 - 0.04, cy, z0 + 0.04);
    box(0.08, wH, 0.08, frame, x + wW / 2 + 0.04, cy, z0 + 0.04);
    box(0.06, wH, 0.06, frame, x, cy, z0 + 0.03); // the middle post
    box(wW + 0.34, 0.06, 0.16, '#e8dcc0', x, cy - wH / 2 - 0.12, z0 + 0.08); // sill
    for (let i = 1; i < 6; i++) put(new THREE.CylinderGeometry(0.011, 0.011, wH, 8), '#2b2f36', x - wW / 2 + (i * wW) / 6, cy, z0 + 0.09);
    box(wW, 0.022, 0.022, '#2b2f36', x, cy + 0.2, z0 + 0.09);
    box(wW, 0.022, 0.022, '#2b2f36', x, cy - 0.3, z0 + 0.09);
    glassGeos.push(new THREE.PlaneGeometry(wW, wH).translate(x, cy, z0 + 0.005));
  }

  // a shelf with tins, jars and boxes, between the windows, high on the wall
  const shelfY = 2.05;
  box(1.5, 0.04, 0.3, '#8a5a32', 0.2, shelfY, z0 + 0.15);
  for (const x of [-0.4, 0.8]) box(0.04, 0.18, 0.2, '#6b4224', x, shelfY - 0.11, z0 + 0.1);
  const tins = [
    [-0.35, '#c0392b', 0.07, 0.2],
    [-0.2, '#e0a526', 0.08, 0.16],
    [-0.05, '#3f7fbf', 0.06, 0.22],
    [0.55, '#d35400', 0.07, 0.18],
    [0.7, '#8e44ad', 0.065, 0.2],
  ];
  for (const [x, colour, r, h] of tins) put(new THREE.CylinderGeometry(r, r, h, 16), colour, x, shelfY + 0.02 + h / 2, z0 + 0.15);
  box(0.3, 0.2, 0.22, '#c79a5b', 0.22, shelfY + 0.12, z0 + 0.15);
  box(0.22, 0.12, 0.2, '#e6d3a8', 0.25, shelfY + 0.28, z0 + 0.15);

  // a round wall clock (white face, dark rim, hands at ten past ten)
  const clockX = -1.25;
  const clockY = 3.05;
  put(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 32).rotateX(Math.PI / 2), '#2e3640', clockX, clockY, z0 + 0.02);
  put(new THREE.CylinderGeometry(0.175, 0.175, 0.012, 32).rotateX(Math.PI / 2), '#fbf7ec', clockX, clockY, z0 + 0.045);
  for (const [len, ang] of [
    [0.1, Math.PI / 3],
    [0.14, -Math.PI / 3.2],
  ]) {
    const hand = new THREE.BoxGeometry(0.014, len, 0.006).translate(0, len / 2, 0).rotateZ(ang);
    put(hand, '#1e252c', clockX, clockY, z0 + 0.056);
  }
  // the switchboard and its conduit
  box(0.24, 0.16, 0.03, '#f1ede2', 1.55, 1.45, z0 + 0.015);
  box(0.025, 2.9, 0.025, '#e9e4d6', 1.55, 1.53 + 1.45, z0 + 0.015);

  // jute sacks (rounded, on a pallet) and wooden crates along the wall, at both ends
  const juteGeos = [];
  for (const [x, flip] of [
    [-4.6, 1],
    [4.4, -1],
  ]) {
    box(1.3, 0.12, 0.9, '#9c6b3c', x, 0.06, z0 + 0.6); // pallet
    for (let i = 0; i < 3; i++) juteGeos.push(new RoundedBoxGeometry(0.4, 0.3, 0.7, 2, 0.12).translate(x - 0.42 + i * 0.42, 0.27, z0 + 0.6));
    for (let i = 0; i < 2; i++) juteGeos.push(new RoundedBoxGeometry(0.4, 0.3, 0.7, 2, 0.12).translate(x - 0.21 + i * 0.42, 0.55, z0 + 0.6));
    // two wooden crates beside them
    const cx = x + flip * 1.25;
    box(0.7, 0.6, 0.6, '#a87444', cx, 0.3, z0 + 0.45);
    box(0.55, 0.45, 0.5, '#b98552', cx + flip * 0.05, 0.825, z0 + 0.45);
    for (const y of [0.12, 0.48]) box(0.72, 0.05, 0.62, '#7d522b', cx, y, z0 + 0.45);
  }

  const paint = new THREE.MeshStandardMaterial({ name: 'RoomParts', vertexColors: true, roughness: 0.75, metalness: 0 });
  const merged = new THREE.Mesh(mergeGeometries(parts, false), paint);
  merged.name = 'RoomParts';
  root.add(merged);
  const jute = new THREE.Mesh(
    mergeGeometries(juteGeos, false),
    new THREE.MeshStandardMaterial({ name: 'Jute', map: juteTexture(aniso), roughness: 0.95, metalness: 0 }),
  );
  jute.name = 'JuteSacks';
  root.add(jute);
  const glass = new THREE.Mesh(mergeGeometries(glassGeos, false), new THREE.MeshBasicMaterial({ name: 'Sky', map: skyTexture(), toneMapped: false }));
  glass.name = 'WindowSky';
  root.add(glass);
  for (const g of [...parts, ...juteGeos, ...glassGeos]) g.dispose();

  return { root, floor, background: new THREE.Color('#9fbfcf') };
}
