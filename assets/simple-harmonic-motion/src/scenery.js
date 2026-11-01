// The settings, in metres, drawn here with small canvas textures (no image files):
//   courtyard (দোলনা): a village courtyard of swept clay, the ground worn bare under the swing, and behind it a house
//     of blue-painted corrugated tin on a clay plinth, with a door, a window, a rusty tin roof on two posts and two
//     clay pots; a sky with clouds and a far line of trees all round.
//   lab (স্প্রিং): a wooden bench in front of a slate blackboard (a chalk wave on it) on a blue-grey wall.
// Everything is static: merged into one mesh per material (src/merge.js), never exported to GLB.
import * as THREE from 'three';
import { mergeStatic } from './merge.js';

const HOUSE_Z = -4.6; // the front of the house's wall
const WALL_W = 9;
const WALL_H = 2.4;
const PLINTH_H = 0.42;

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
/** Draw fn at (x, y) and at its copies across the edges, so a repeating texture has no seams. */
function wrapped(w, h, x, y, r, fn) {
  for (const dx of [0, -w, w]) for (const dy of [0, -h, h]) if (x + dx > -r && x + dx < w + r && y + dy > -r && y + dy < h + r) fn(x + dx, y + dy);
}

/** Swept clay, about 4 m across one repeat: mottled, small pebbles, broom strokes. */
function earthTexture() {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  const r = rand(7);
  ctx.fillStyle = '#8a6443';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 4 + r() * 22;
    const light = r() < 0.5;
    ctx.fillStyle = light ? `rgba(176,134,92,${0.05 + r() * 0.1})` : `rgba(82,56,34,${0.05 + r() * 0.12})`;
    wrapped(S, S, x, y, rad, (px, py) => {
      ctx.beginPath();
      ctx.ellipse(px, py, rad, rad * (0.5 + r() * 0.5), r() * 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // broom strokes: long faint arcs
  ctx.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const x = r() * S;
    const y = r() * S;
    const len = 30 + r() * 60;
    const a = 0.6 + r() * 0.5;
    ctx.strokeStyle = r() < 0.5 ? 'rgba(70,46,28,0.16)' : 'rgba(186,146,104,0.16)';
    ctx.lineWidth = 0.8 + r() * 1.2;
    wrapped(S, S, x, y, len, (px, py) => {
      ctx.beginPath();
      ctx.arc(px, py, len, a, a + 0.5 + r() * 0.4);
      ctx.stroke();
    });
  }
  for (let i = 0; i < 260; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 0.8 + r() * 2.2;
    const g = 120 + r() * 70;
    ctx.fillStyle = `rgb(${g + 20},${g + 6},${g - 14})`;
    wrapped(S, S, x, y, rad + 1, (px, py) => {
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(50,32,18,0.35)';
      ctx.fillRect(px - rad * 0.4, py + rad * 0.6, rad * 1.4, 0.8);
    });
  }
  return c;
}

/**
 * The same clay with the bare patch children's feet wear under a swing (darker, scuffed, fading out), for the one
 * 4 m square under it: opaque, so it needs no blending (and no shader of its own).
 */
function scuffedTexture(earth) {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  const r = rand(19);
  ctx.drawImage(earth, 0, 0);
  ctx.save();
  ctx.translate(S / 2, S / 2);
  ctx.scale(1, 0.5);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 170);
  g.addColorStop(0, 'rgba(70,44,26,0.55)');
  g.addColorStop(0.55, 'rgba(78,50,30,0.32)');
  g.addColorStop(1, 'rgba(78,50,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-170, -170, 340, 340);
  ctx.restore();
  for (let i = 0; i < 160; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 130;
    const x = S / 2 + Math.cos(a) * d;
    const y = S / 2 + Math.sin(a) * d * 0.45;
    ctx.strokeStyle = `rgba(${r() < 0.5 ? '60,38,22' : '170,128,88'},${0.12 + r() * 0.2})`;
    ctx.lineWidth = 1 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 8);
    ctx.stroke();
  }
  return texture(c, { aniso: 8 });
}

/** Corrugated tin, painted: `w` px wide for the wall, with a door and a window when `openings`. */
function tinTexture({ w = 1024, h = 256, paint = '#2f6d99', light = '#5b9ac4', dark = '#1d4a6c', openings = false, seed = 3 }) {
  const { c, ctx } = canvas(w, h);
  const r = rand(seed);
  ctx.fillStyle = paint;
  ctx.fillRect(0, 0, w, h);
  // the ribs: a light and a dark edge every 7 px (about 6 cm)
  for (let x = 0; x < w; x += 7) {
    ctx.fillStyle = light;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(x, 0, 2, h);
    ctx.fillStyle = dark;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(x + 4, 0, 2, h);
  }
  ctx.globalAlpha = 1;
  // the sheets overlap every ~1 m, and a row of nails at the rails
  for (let x = 0; x < w; x += 113) {
    ctx.fillStyle = 'rgba(10,30,50,0.35)';
    ctx.fillRect(x, 0, 2, h);
  }
  for (const y of [h * 0.12, h * 0.55, h * 0.93])
    for (let x = 3; x < w; x += 14) {
      ctx.fillStyle = 'rgba(230,240,250,0.6)';
      ctx.fillRect(x, y, 2, 2);
    }
  // weathering: faded paint, rust running down from the nails and along the bottom
  for (let i = 0; i < 120; i++) {
    const x = r() * w;
    const y = r() * h;
    ctx.fillStyle = `rgba(${r() < 0.6 ? '150,80,40' : '220,230,235'},${0.05 + r() * 0.12})`;
    ctx.fillRect(x, y, 1 + r() * 3, 6 + r() * 40);
  }
  const bottom = ctx.createLinearGradient(0, h * 0.82, 0, h);
  bottom.addColorStop(0, 'rgba(120,64,30,0)');
  bottom.addColorStop(1, 'rgba(120,64,30,0.55)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, h * 0.82, w, h * 0.18);
  if (openings) {
    const px = w / WALL_W; // px per metre
    // the door: two wooden leaves in a frame, a little ajar, 2.3 m right of the swing
    const dx = w / 2 + 2.6 * px;
    const dw = 0.95 * px;
    const dh = 1.9 * (h / WALL_H);
    ctx.fillStyle = '#4b2e1c';
    ctx.fillRect(dx - 5, h - dh - 5, dw + 10, dh + 5);
    for (let k = 0; k < 2; k++) {
      const lx = dx + (k * dw) / 2;
      ctx.fillStyle = k ? '#9a5d33' : '#a8693b';
      ctx.fillRect(lx + 1, h - dh, dw / 2 - 2, dh);
      ctx.strokeStyle = 'rgba(60,32,16,0.6)';
      ctx.lineWidth = 1;
      for (let p = 1; p < 4; p++) {
        ctx.beginPath();
        ctx.moveTo(lx + (p * dw) / 8, h - dh);
        ctx.lineTo(lx + (p * dw) / 8, h);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(60,32,16,0.5)';
      ctx.fillRect(lx + 3, h - dh * 0.75, dw / 2 - 6, 3);
      ctx.fillRect(lx + 3, h - dh * 0.3, dw / 2 - 6, 3);
    }
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(dx + dw / 2 - 1, h - dh, 2, dh);
    ctx.fillStyle = '#d9b44a';
    ctx.fillRect(dx + dw / 2 - 6, h - dh * 0.52, 3, 6);
    // the window: a wooden frame, iron bars, the dark room behind, two shutters open, 2.4 m left
    const wx = w / 2 - 2.9 * px;
    const ww = 0.9 * px;
    const wy = h * 0.22;
    const wh = h * 0.42;
    ctx.fillStyle = '#4b2e1c';
    ctx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
    const room = ctx.createLinearGradient(0, wy, 0, wy + wh);
    room.addColorStop(0, '#2a2420');
    room.addColorStop(1, '#4a3a2c');
    ctx.fillStyle = room;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#3a3f46';
    for (let b = 1; b < 6; b++) ctx.fillRect(wx + (b * ww) / 6 - 1, wy, 2, wh);
    for (const side of [-1, 1]) {
      const sx = side < 0 ? wx - ww * 0.42 - 4 : wx + ww + 4;
      ctx.fillStyle = '#b8743f';
      ctx.fillRect(sx, wy - 2, ww * 0.42, wh + 4);
      ctx.strokeStyle = 'rgba(70,38,18,0.55)';
      for (let s = 1; s < 6; s++) {
        ctx.beginPath();
        ctx.moveTo(sx + 2, wy + (s * wh) / 6);
        ctx.lineTo(sx + ww * 0.42 - 2, wy + (s * wh) / 6);
        ctx.stroke();
      }
    }
  }
  return texture(c, { repeat: !openings, aniso: 8 });
}

/** The sky all round (for a dome, equirectangular): blue overhead, clouds, a hazy line of far trees and roofs, fields below. */
function skyTexture() {
  const W = 1024;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const r = rand(29);
  const sky = ctx.createLinearGradient(0, 0, 0, H / 2);
  sky.addColorStop(0, '#2f6fb8');
  sky.addColorStop(0.6, '#6aa5d8');
  sky.addColorStop(1, '#b4d2e6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H / 2);
  for (let i = 0; i < 26; i++) {
    const x = r() * W;
    const y = H * (0.18 + r() * 0.24);
    const s = 18 + r() * 40;
    for (let k = 0; k < 6; k++) {
      const cx = x + (k - 3) * s * 0.55 + (r() - 0.5) * s * 0.4;
      const cy = y + (r() - 0.5) * s * 0.25;
      wrapped(W, H, cx, cy, s * 2, (px, py) => {
        const g = ctx.createRadialGradient(px, py, 0, px, py, s);
        g.addColorStop(0, 'rgba(255,255,255,0.75)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(px - s, py - s * 0.6, s * 2, s * 1.2);
      });
    }
  }
  // fields below the horizon, matching the clay of the courtyard near it
  const ground = ctx.createLinearGradient(0, H / 2, 0, H);
  ground.addColorStop(0, '#7f7258');
  ground.addColorStop(0.08, '#86684a');
  ground.addColorStop(1, '#7a5a3c');
  ctx.fillStyle = ground;
  ctx.fillRect(0, H / 2, W, H / 2);
  // far trees and roofs, hazy blue-grey (far away, so the air makes them pale)
  ctx.fillStyle = '#6e8a8c';
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  for (let x = 0; x <= W; x += 4) {
    const y = H / 2 - 6 - 8 * Math.abs(Math.sin(x * 0.045)) - 9 * Math.abs(Math.sin(x * 0.013 + 1)) - (r() < 0.04 ? 10 : 0);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8b9a9c';
  for (let i = 0; i < 14; i++) {
    const x = r() * W;
    ctx.fillRect(x, H / 2 - 7, 10 + r() * 14, 7);
  }
  return texture(c, { aniso: 1 });
}

/** A clay pot (কলসি), lathe-turned, standing on y = 0. */
function potGeometry(scale) {
  const pts = [
    [0, 0],
    [0.09, 0.005],
    [0.16, 0.06],
    [0.19, 0.16],
    [0.17, 0.26],
    [0.1, 0.33],
    [0.07, 0.36],
    [0.08, 0.4],
    [0.085, 0.41],
  ].map(([x, y]) => new THREE.Vector2(x * scale, y * scale));
  return new THREE.LatheGeometry(pts, 28);
}

export function createCourtyard() {
  const root = new THREE.Group();
  root.name = 'Courtyard';
  root.userData.noExport = true;
  const earthCanvas = earthTexture();
  const earthMap = texture(earthCanvas, { repeat: true, aniso: 8 });
  earthMap.repeat.set(19, 19); // one picture every 4 m
  const earth = new THREE.MeshStandardMaterial({ name: 'Clay', map: earthMap, roughness: 0.95, metalness: 0 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(38, 48), earth);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  // the square under the swing (it lines up with one repeat of the clay): the worn patch drawn into it
  const scuff = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    new THREE.MeshStandardMaterial({
      name: 'WornClay',
      map: scuffedTexture(earthCanvas),
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  scuff.rotation.x = -Math.PI / 2;
  scuff.position.y = 0.001;
  scuff.receiveShadow = true;
  root.add(ground, scuff);

  // the house: a clay plinth, a tin wall with the door and the window, a tin roof on two posts
  const house = new THREE.Group();
  house.name = 'House';
  const plinthMat = new THREE.MeshStandardMaterial({ name: 'Plinth', color: 0xc29a6e, roughness: 0.95 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(WALL_W + 0.6, PLINTH_H, 1.2), plinthMat);
  plinth.position.set(0, PLINTH_H / 2, HOUSE_Z - 0.6 + 0.55);
  const front = new THREE.MeshStandardMaterial({ name: 'TinWall', map: tinTexture({ openings: true }), roughness: 0.6, metalness: 0.25 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, WALL_H), front);
  wall.position.set(0, PLINTH_H + WALL_H / 2, HOUSE_Z);
  const sideMap = tinTexture({ w: 256, h: 256, seed: 5 });
  sideMap.repeat.set(1.2, 1);
  const sideMat = new THREE.MeshStandardMaterial({ name: 'TinSide', map: sideMap, roughness: 0.6, metalness: 0.25 });
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(3, WALL_H), sideMat);
    side.rotation.y = (sx * Math.PI) / 2;
    side.position.set((sx * WALL_W) / 2, PLINTH_H + WALL_H / 2, HOUSE_Z - 1.5);
    house.add(side);
  }
  const roofMap = tinTexture({ w: 512, h: 128, paint: '#8d8378', light: '#c4bcb0', dark: '#5c534a', seed: 9 });
  roofMap.repeat.set(5, 1);
  const roofMat = new THREE.MeshStandardMaterial({ name: 'TinRoof', map: roofMap, roughness: 0.55, metalness: 0.35 });
  const roofDepth = 4.2;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(WALL_W + 0.8, roofDepth, 0.03), roofMat);
  const eaveY = PLINTH_H + WALL_H + 0.08;
  const slope = 0.24;
  roof.rotation.x = -Math.PI / 2 + slope;
  roof.position.set(0, eaveY + (Math.sin(slope) * roofDepth) / 2, HOUSE_Z + 0.75 - (Math.cos(slope) * roofDepth) / 2);
  const wood = new THREE.MeshStandardMaterial({ name: 'Post', color: 0x7a4b2a, roughness: 0.8 });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(WALL_W + 0.8, 0.1, 0.08), wood);
  beam.position.set(0, eaveY - 0.03, HOUSE_Z + 0.72);
  house.add(plinth, wall, roof, beam);
  for (const x of [-3.9, 3.9]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, eaveY - PLINTH_H, 12), wood);
    post.position.set(x, PLINTH_H + (eaveY - PLINTH_H) / 2, HOUSE_Z + 0.5);
    house.add(post);
  }
  // two clay pots by the door, a low wooden stool by the window
  const clay = new THREE.MeshStandardMaterial({ name: 'Terracotta', color: 0xb5562f, roughness: 0.8 });
  const potA = new THREE.Mesh(potGeometry(1), clay);
  potA.position.set(1.75, PLINTH_H, HOUSE_Z + 0.3);
  const potB = new THREE.Mesh(potGeometry(0.8), clay);
  potB.position.set(1.42, PLINTH_H, HOUSE_Z + 0.36);
  const stoolTop = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.34), wood);
  stoolTop.position.set(-1.6, PLINTH_H + 0.2, HOUSE_Z + 0.35);
  house.add(potA, potB, stoolTop);
  for (const sx of [-0.26, 0.26])
    for (const sz of [-0.13, 0.13]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), wood);
      leg.position.set(-1.6 + sx, PLINTH_H + 0.09, HOUSE_Z + 0.35 + sz);
      house.add(leg);
    }
  root.add(house);
  mergeStatic(house);
  // the sky: a dome round everything (cheaper than a background the renderer turns into a cube map)
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(40, 48, 24),
    new THREE.MeshBasicMaterial({ name: 'Sky', map: skyTexture(), side: THREE.BackSide, depthWrite: false, toneMapped: false, fog: false }),
  );
  dome.renderOrder = -1;
  root.add(dome);
  return { root, background: null };
}

/** A slate blackboard with a frame, chalk dust and a chalk wave; the blue-grey wall round it. */
function boardTexture() {
  const W = 1024;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const r = rand(41);
  ctx.fillStyle = '#4c6079';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '30,44,62' : '120,140,165'},${0.04 + r() * 0.06})`;
    ctx.fillRect(r() * W, r() * H, 2 + r() * 10, 2 + r() * 10);
  }
  // the board: 2.2 m × 1.1 m in a 3.2 m × 1.6 m wall picture
  const bx = W * 0.156;
  const by = H * 0.12;
  const bw = W * 0.688;
  const bh = H * 0.69;
  ctx.fillStyle = '#6b4024';
  ctx.fillRect(bx - 14, by - 14, bw + 28, bh + 34);
  ctx.fillStyle = '#8a5531';
  ctx.fillRect(bx - 14, by + bh, bw + 28, 20); // the chalk ledge
  const slate = ctx.createLinearGradient(0, by, 0, by + bh);
  slate.addColorStop(0, '#26303a');
  slate.addColorStop(1, '#1e262f');
  ctx.fillStyle = slate;
  ctx.fillRect(bx, by, bw, bh);
  for (let i = 0; i < 70; i++) {
    const x = bx + r() * bw;
    const y = by + r() * bh;
    const s = 20 + r() * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, s);
    g.addColorStop(0, `rgba(210,215,220,${0.03 + r() * 0.05})`);
    g.addColorStop(1, 'rgba(210,215,220,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  }
  // a chalk wave and its axis, high on the board's left (clear of the spring in the middle)
  ctx.strokeStyle = 'rgba(235,238,240,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx + 40, by + 120);
  ctx.lineTo(bx + 290, by + 120);
  ctx.moveTo(bx + 40, by + 50);
  ctx.lineTo(bx + 40, by + 190);
  ctx.stroke();
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let x = 0; x <= 240; x += 3) {
    const y = by + 120 - 52 * Math.cos((x / 240) * Math.PI * 2 * 1.25);
    x ? ctx.lineTo(bx + 40 + x, y) : ctx.moveTo(bx + 40 + x, y);
  }
  ctx.stroke();
  // chalk sticks and a duster on the ledge
  ctx.fillStyle = '#f0f0ea';
  ctx.fillRect(bx + bw * 0.7, by + bh + 4, 26, 6);
  ctx.fillRect(bx + bw * 0.74, by + bh + 5, 18, 5);
  ctx.fillStyle = '#7d5a3a';
  ctx.fillRect(bx + bw * 0.12, by + bh + 1, 60, 12);
  ctx.fillStyle = '#d7d2c8';
  ctx.fillRect(bx + bw * 0.12, by + bh + 10, 60, 4);
  return texture(c, { aniso: 8 });
}

/** Bench planks: warm wood, along x. */
function benchTexture() {
  const W = 512;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const r = rand(53);
  ctx.fillStyle = '#9c6236';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    const y0 = r() * H;
    ctx.strokeStyle = `rgba(${70 + r() * 30},${38 + r() * 18},18,${0.15 + r() * 0.25})`;
    ctx.lineWidth = 0.8 + r() * 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin(x * 0.01 + i) * 4;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(40,20,8,0.55)';
  for (let y = 0; y < H; y += 64) ctx.fillRect(0, y, W, 2);
  return texture(c, { repeat: true, aniso: 8 });
}

export function createLab() {
  const root = new THREE.Group();
  root.name = 'Lab';
  root.userData.noExport = true;
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.6),
    new THREE.MeshStandardMaterial({ name: 'Blackboard', map: boardTexture(), roughness: 0.9 }),
  );
  wall.position.set(0.05, 0.62, -0.55);
  wall.receiveShadow = true;
  const benchMap = benchTexture();
  benchMap.repeat.set(1, 1);
  const benchMat = new THREE.MeshStandardMaterial({ name: 'Bench', map: benchMap, roughness: 0.62 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 1.0), benchMat);
  top.position.set(0, -0.025, -0.05);
  top.receiveShadow = true;
  const below = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.2),
    new THREE.MeshStandardMaterial({ name: 'LabWall', color: 0x3f5068, roughness: 0.9 }),
  );
  below.position.set(0.05, -0.78, -0.55);
  root.add(wall, top, below);
  mergeStatic(root, { keep: [top] });
  // the room beyond, for the turned view: a dim blue-grey
  const { c, ctx } = canvas(16, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#3a4c66');
  g.addColorStop(1, '#2a3446');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  return { root, background: texture(c, { aniso: 1 }) };
}
