// The schoolyard (book page 145's 10.3 m): a three-storey school building, a brick yard (no trees: the pipe and the building matter), and
// against a pilaster of the building a glass pipe about 11 m tall standing in a tub of water: with water instead of
// mercury the column the air holds up is 10.3 m, about to the roof. A small mercury barometer (76 cm) stands at its
// foot for comparison, and a red-and-white measuring staff marks the metres. Metres; the yard's ground is y = 0, the
// pipe's axis x = z = 0.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { createBarometer } from './barometer.js';

export const TUB = { r: 0.46, h: 0.38, water: 0.31 };
export const PIPE = { r: 0.1, inner: 0.084, bottom: 0.07, top: 11.2 };
export const FACADE_Z = -0.85;
export const MINI_X = -1.0;
export const STAFF_X = 0.36;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The building's front: cream-yellow walls, white floor bands, green windows with grilles, a red-and-white parapet. */
function facadeTexture(W_M, H_M, x0) {
  const PX = 90; // pixels per metre
  const c = canvas(Math.round(W_M * PX), Math.round(H_M * PX));
  const ctx = c.getContext('2d');
  const X = (m) => (m - x0) * PX;
  const Y = (m) => (H_M - m) * PX;
  const r = rand(17);
  ctx.fillStyle = '#efd27e';
  ctx.fillRect(0, 0, c.width, c.height);
  // weathering streaks
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(150,110,40,${0.02 + r() * 0.04})`;
    ctx.fillRect(r() * c.width, r() * c.height, 2 + r() * 6, 20 + r() * 120);
  }
  // the plinth
  ctx.fillStyle = '#a8442e';
  ctx.fillRect(0, Y(0.45), c.width, 0.45 * PX);
  // floor bands
  const floors = [0.45, 3.75, 7.05];
  ctx.fillStyle = '#f8f4ea';
  for (const f of [3.75, 7.05, 10.35]) ctx.fillRect(0, Y(f + 0.22), c.width, 0.3 * PX);
  // pilasters every 3 m (one behind the pipe at x = 0), a little deeper in colour
  ctx.fillStyle = '#e6c46a';
  for (let x = -6; x <= 6; x += 3) ctx.fillRect(X(x - 0.35), Y(10.35), 0.7 * PX, (10.35 - 0.45) * PX);
  // windows between the pilasters, a door on the ground floor left of the pipe
  for (const f of floors)
    for (let x = -4.5; x <= 4.5; x += 3) {
      if (f === 0.45 && x === -4.5) {
        // a green double door
        ctx.fillStyle = '#245c43';
        ctx.fillRect(X(x - 0.8), Y(f + 2.3), 1.6 * PX, 2.3 * PX);
        ctx.strokeStyle = '#173b2b';
        ctx.lineWidth = 4;
        ctx.strokeRect(X(x - 0.8), Y(f + 2.3), 1.6 * PX, 2.3 * PX);
        ctx.beginPath();
        ctx.moveTo(X(x), Y(f + 2.3));
        ctx.lineTo(X(x), Y(f));
        ctx.stroke();
        continue;
      }
      const wx = X(x - 0.8);
      const wy = Y(f + 2.45);
      const ww = 1.6 * PX;
      const wh = 1.55 * PX;
      // a sunshade over each window
      ctx.fillStyle = '#d9d2c2';
      ctx.fillRect(wx - 10, wy - 16, ww + 20, 12);
      ctx.fillStyle = '#2a6b8f';
      const g = ctx.createLinearGradient(0, wy, 0, wy + wh);
      g.addColorStop(0, '#6fb4dd');
      g.addColorStop(1, '#2a5f86');
      ctx.fillStyle = g;
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = '#2d7552';
      ctx.lineWidth = 7;
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(wx + ww / 2, wy);
      ctx.lineTo(wx + ww / 2, wy + wh);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(30,40,40,0.75)';
      ctx.lineWidth = 2;
      for (let k = 1; k < 8; k++) {
        ctx.beginPath();
        ctx.moveTo(wx + (ww * k) / 8, wy);
        ctx.lineTo(wx + (ww * k) / 8, wy + wh);
        ctx.stroke();
      }
    }
  // the parapet: red and white blocks
  for (let x = -7; x < 7; x += 0.5) {
    ctx.fillStyle = Math.round(x * 2) % 2 ? '#c4402c' : '#f4efe4';
    ctx.fillRect(X(x), Y(11.2), 0.5 * PX + 1, 0.85 * PX);
  }
  ctx.fillStyle = '#7a6a4a';
  ctx.fillRect(0, Y(11.2), c.width, 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Red bricks laid in a running bond, a little worn. */
function brickTexture() {
  const c = canvas(512, 512);
  const ctx = c.getContext('2d');
  const r = rand(23);
  ctx.fillStyle = '#8a4a34';
  ctx.fillRect(0, 0, 512, 512);
  const bw = 64;
  const bh = 32;
  for (let row = 0; row < 16; row++)
    for (let col = -1; col < 9; col++) {
      const x = col * bw + (row % 2 ? bw / 2 : 0);
      const y = row * bh;
      const k = r();
      ctx.fillStyle = `rgb(${170 + k * 40},${78 + k * 26},${52 + k * 18})`;
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(16, 16);
  t.anisotropy = 8;
  return t;
}

export function createYard(mats, { num = String } = {}) {
  const root = new THREE.Group();
  root.name = 'Yard';

  // the ground: bricks near the building, sandy earth beyond
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ name: 'Bricks', map: brickTexture(), roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 10);
  ground.receiveShadow = true;
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ color: '#c9b48e', roughness: 1 }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.01, 30);
  root.add(ground, grass);

  // the building
  const W_M = 14;
  const H_M = 11.2;
  const x0 = -7;
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(W_M, H_M),
    new THREE.MeshStandardMaterial({ name: 'Facade', map: facadeTexture(W_M, H_M, x0), roughness: 0.85 }),
  );
  front.position.set(x0 + W_M / 2, H_M / 2, FACADE_Z);
  front.receiveShadow = true;
  const block = new THREE.Mesh(new THREE.BoxGeometry(W_M, H_M, 8), new THREE.MeshStandardMaterial({ color: '#e3c26e', roughness: 0.9 }));
  block.position.set(x0 + W_M / 2, H_M / 2, FACADE_Z - 4.01);
  root.add(block, front);
  // the floor slabs stick out a little: shadows give the facade depth
  const slabMat = new THREE.MeshStandardMaterial({ color: '#f3eee2', roughness: 0.8 });
  for (const y of [3.75, 7.05, 10.35]) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(W_M, 0.3, 0.25), slabMat);
    slab.position.set(x0 + W_M / 2, y + 0.07, FACADE_Z + 0.12);
    slab.castShadow = true;
    slab.receiveShadow = true;
    root.add(slab);
  }

  // the tub of water
  const tubMat = new THREE.MeshStandardMaterial({ name: 'Tub', color: '#2f7fd0', roughness: 0.4 });
  const tubPts = [
    new THREE.Vector2(0.0001, 0),
    new THREE.Vector2(TUB.r - 0.06, 0),
    new THREE.Vector2(TUB.r, TUB.h),
    new THREE.Vector2(TUB.r + 0.02, TUB.h + 0.01),
    new THREE.Vector2(TUB.r - 0.01, TUB.h + 0.01),
    new THREE.Vector2(TUB.r - 0.03, 0.02),
  ];
  const tub = new THREE.Mesh(new THREE.LatheGeometry(tubPts, 40), tubMat);
  tub.castShadow = true;
  tub.receiveShadow = true;
  const waterMat = new THREE.MeshPhysicalMaterial({
    name: 'Water',
    color: '#3c9be8',
    roughness: 0.05,
    transparent: true,
    opacity: 0.85,
    clearcoat: 1,
  });
  const tubWater = new THREE.Mesh(new THREE.CircleGeometry(TUB.r - 0.03 * (1 - TUB.water / TUB.h) - 0.01, 40), waterMat);
  tubWater.rotation.x = -Math.PI / 2;
  tubWater.position.y = TUB.water;
  root.add(tub, tubWater);

  // the glass pipe, its water (a scaled column) and brackets to the building
  const glass = mats.glass.clone();
  glass.opacity = 0.1;
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(PIPE.r, PIPE.r, PIPE.top - PIPE.bottom, 24, 1, true), glass);
  pipe.name = 'GlassPipe';
  pipe.position.y = (PIPE.top + PIPE.bottom) / 2;
  pipe.renderOrder = 8;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(PIPE.r, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  cap.position.y = PIPE.top;
  cap.renderOrder = 8;
  const colMat = new THREE.MeshPhysicalMaterial({
    name: 'WaterColumn',
    color: '#1f86f0',
    roughness: 0.05,
    transparent: true,
    opacity: 0.95,
    clearcoat: 1,
    emissive: '#0b4fa8',
    emissiveIntensity: 0.6,
  });
  const column = new THREE.Mesh(new THREE.CylinderGeometry(PIPE.inner, PIPE.inner, 1, 20).translate(0, 0.5, 0), colMat);
  column.position.y = PIPE.bottom;
  column.name = 'WaterColumn';
  root.add(column, pipe, cap);
  const steel = mats.steel;
  for (const y of [2.2, 4.8, 7.4, 10.0]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, -FACADE_Z), steel);
    arm.position.set(0, y, FACADE_Z / 2);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(PIPE.r + 0.008, 0.009, 8, 20), steel);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    arm.castShadow = true;
    root.add(arm, ring);
  }

  // the measuring staff: red and white each half metre, a number at every metre
  const staff = new THREE.Group();
  staff.name = 'Staff';
  const red = new THREE.MeshStandardMaterial({ color: '#d4302a', roughness: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: '#f5f2ea', roughness: 0.5 });
  for (let i = 0; i < 23; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.025), i % 2 ? red : white);
    seg.position.set(STAFF_X, 0.25 + i * 0.5, 0);
    seg.castShadow = true;
    staff.add(seg);
  }
  for (let m = 1; m <= 11; m++) {
    const label = textMesh(num(String(m)), 0.2, { color: '#14171c', weight: 700, align: 'left' });
    label.position.set(STAFF_X + 0.06, m, 0.02);
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.26),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }),
    );
    bg.position.set(STAFF_X + 0.2, m, 0.015);
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.03), new THREE.MeshBasicMaterial({ color: '#14171c' }));
    tick.position.set(STAFF_X + 0.035, m, 0.01);
    staff.add(bg, label, tick);
  }
  const mLabel = textMesh('m', 0.2, { color: '#14171c', weight: 700, align: 'left' });
  mLabel.position.set(STAFF_X + 0.06, 11.5, 0.02);
  staff.add(mLabel);
  root.add(staff);

  // a small mercury barometer at the foot, for comparison (no scale of its own)
  const mini = createBarometer(mats, { scale: false, name: 'SmallBarometer' });
  mini.root.position.set(MINI_X, 0, 0.15);
  root.add(mini.root);

  /** The water's top in the pipe (world y). */
  function setWater(top) {
    column.scale.y = Math.max(0.001, top - PIPE.bottom);
  }
  setWater(TUB.water);

  return { root, mini, setWater, shadowCatchers: [ground, front] };
}
