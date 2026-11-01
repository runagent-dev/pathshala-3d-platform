// The street, in metres (x along the road, +x to the right on screen; z toward the viewer; y up): a wide town
// road of three lanes with dashed lane lines, kerbs painted black and white as on Bangladesh's roads, a footpath of
// warm concrete pavers on each side. Along the far footpath a low sand-coloured wall; along the near one a strip of
// plain paving and a low plastered wall (only the main objects: no shops). The truck runs in the far lane, the bicycle in the near one; the middle lane stays empty, so
// nothing of one lane ever sits over the other on screen. The arrows' colours (blue, green) appear nowhere in the
// setting. Long enough for every run (x from -72 m to +72 m), and only nine draw calls: each surface is one mesh,
// its detail in one canvas texture drawn once.
import * as THREE from 'three';
import { mergePlaced } from './merge.js';

export const LANES = { far: -4.2, near: 4.4 };
export const ROAD = { half: 6.2, length: 144, kerb: 0.16 };
const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const texture = (c, repeatX = 1, repeatY = 1) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
};

/** Specks of grit and a few darker patches over a filled canvas. */
function grit(ctx, w, h, n, seed, light, dark) {
  const r = rand(seed);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = r() < 0.5 ? light : dark;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

export function createStreet() {
  const root = new THREE.Group();
  root.name = 'Street';
  const L = ROAD.length;
  const W = ROAD.half * 2;
  const pathW = 2.2;
  const zFar = -ROAD.half - 0.22 - pathW; // the far footpath's back edge, where the shops stand
  const zNear = ROAD.half + 0.22 + pathW; // the near footpath's outer edge

  // asphalt: 8 m of road in the texture (3 m dash, 5 m gap), 48 px per metre, with grit and wear in the
  // wheel tracks
  {
    const ppm = 48;
    const c = canvas(8 * ppm, Math.round(W * ppm));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#7d8187';
    ctx.fillRect(0, 0, c.width, c.height);
    const zpx = (z) => (z + ROAD.half) * ppm; // canvas row of a z (the plane's v runs with z after the rotation)
    // darker wheel tracks in each lane, a lighter middle
    for (const z of [-5.0, -3.4, -0.8, 0.8, 3.6, 5.2]) {
      const g = ctx.createLinearGradient(0, zpx(z) - 22, 0, zpx(z) + 22);
      g.addColorStop(0, 'rgba(40, 44, 50, 0)');
      g.addColorStop(0.5, 'rgba(40, 44, 50, 0.22)');
      g.addColorStop(1, 'rgba(40, 44, 50, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, zpx(z) - 22, c.width, 44);
    }
    const r = rand(7);
    for (let i = 0; i < 6400; i++) {
      const v = 96 + Math.floor(r() * 60);
      ctx.fillStyle = `rgba(${v},${v + 3},${v + 6},0.5)`;
      ctx.fillRect(r() * c.width, r() * c.height, 2, 2);
    }
    ctx.fillStyle = '#f1efe6';
    for (const z of [-2.07, 2.07]) ctx.fillRect(0, zpx(z) - 4, 3 * ppm, 8); // lane dashes
    ctx.fillStyle = '#eecb4a';
    for (const z of [-ROAD.half + 0.22, ROAD.half - 0.22]) ctx.fillRect(0, zpx(z) - 4, c.width, 7); // edge lines
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(L, W),
      new THREE.MeshStandardMaterial({ name: 'Asphalt', map: texture(c, L / 8, 1), roughness: 0.93 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    road.name = 'Road';
    root.add(road);
  }

  // kerbs: black and white, half a metre each (both sides, one mesh)
  {
    const c = canvas(128, 8);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f2f0e8';
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = '#2b2e33';
    ctx.fillRect(64, 0, 64, 8);
    const box = new THREE.BoxGeometry(L, ROAD.kerb, 0.22);
    const kerb = new THREE.Mesh(
      mergePlaced([-ROAD.half - 0.11, ROAD.half + 0.11].map((z) => [box, new THREE.Matrix4().makeTranslation(0, ROAD.kerb / 2, z)])),
      new THREE.MeshStandardMaterial({ name: 'Kerb', map: texture(c, L, 1), roughness: 0.8 }),
    );
    box.dispose();
    kerb.receiveShadow = true;
    kerb.name = 'Kerbs';
    root.add(kerb);
  }

  // footpaths of warm concrete pavers, 0.5 m, a few a shade darker or lighter (both sides, one mesh)
  {
    const c = canvas(256, 256); // 2 m × 2 m
    const ctx = c.getContext('2d');
    const r = rand(17);
    const tones = ['#c8b294', '#bfa785', '#cdb89b', '#b89e7c', '#c4ad8d'];
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        ctx.fillStyle = tones[Math.floor(r() * tones.length)];
        ctx.fillRect(i * 64, j * 64, 64, 64);
      }
    grit(ctx, 256, 256, 1800, 23, 'rgba(255,250,240,0.18)', 'rgba(80,60,40,0.14)');
    ctx.strokeStyle = '#8f7a60';
    ctx.lineWidth = 3;
    for (let k = 0; k <= 256; k += 64) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k, 256);
      ctx.moveTo(0, k);
      ctx.lineTo(256, k);
      ctx.stroke();
    }
    const plane = new THREE.PlaneGeometry(L, pathW).rotateX(-Math.PI / 2);
    const path = new THREE.Mesh(
      mergePlaced(
        [-ROAD.half - 0.22 - pathW / 2, ROAD.half + 0.22 + pathW / 2].map((z) => [
          plane,
          new THREE.Matrix4().makeTranslation(0, ROAD.kerb - 0.005, z),
        ]),
      ),
      new THREE.MeshStandardMaterial({ name: 'Pavers', map: texture(c, L / 2, pathW / 2), roughness: 0.95 }),
    );
    plane.dispose();
    path.receiveShadow = true;
    path.name = 'Footpaths';
    root.add(path);
  }

  // behind the far footpath: a low plastered wall in a soft sand colour (the owner: only the main objects, so no
  // row of shops)
  {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(L, 1.1, 0.25),
      new THREE.MeshStandardMaterial({ name: 'FarWall', color: '#d8bf9c', roughness: 0.92 }),
    );
    wall.position.set(0, ROAD.kerb + 0.55, zFar - 0.125);
    wall.receiveShadow = true;
    wall.name = 'FarWall';
    root.add(wall);
  }

  // beyond the near footpath: a strip of plain warm paving, then a low plastered wall
  {
    const depth = 3;
    const brick = new THREE.Mesh(
      new THREE.PlaneGeometry(L, depth).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ name: 'Paving', color: '#b89a80', roughness: 0.95 }),
    );
    brick.position.set(0, ROAD.kerb - 0.01, zNear + depth / 2);
    brick.receiveShadow = true;
    brick.name = 'Paving';
    root.add(brick);
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(L, 0.9, 0.25),
      new THREE.MeshStandardMaterial({ name: 'LowWall', color: '#d9a27a', roughness: 0.92 }),
    );
    wall.position.set(0, ROAD.kerb + 0.45, zNear + depth + 0.125);
    wall.name = 'LowWall';
    root.add(wall);
  }

  // the ground further off, for the turned view: packed earth, warm
  {
    const earth = new THREE.MeshStandardMaterial({ name: 'Earth', color: '#b39a78', roughness: 1 });
    const plane = new THREE.PlaneGeometry(L, 70).rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(
      mergePlaced([
        [plane, new THREE.Matrix4().makeTranslation(0, -0.02, zFar - 35)],
        [plane, new THREE.Matrix4().makeTranslation(0, ROAD.kerb - 0.03, zNear + 3.25 + 35)],
      ]),
      earth,
    );
    plane.dispose();
    ground.name = 'Ground';
    root.add(ground);
  }
  return { root };
}

/** The sky behind the turned view: blue overhead, a warm haze at the horizon (made once, screen-filling). */
export function skyTexture() {
  const c = canvas(4, 256);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6fa6dc');
  g.addColorStop(0.55, '#a9cbe8');
  g.addColorStop(1, '#f1d7b0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A soft round shadow under a body (a texture, so it shows without real shadows too). One texture for all. */
let blobTex = null;
export function blobShadow(length, width, opacity = 0.42) {
  if (!blobTex) {
    const c = canvas(128, 128);
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, 'rgba(20, 26, 34, 1)');
    g.addColorStop(0.6, 'rgba(20, 26, 34, 0.45)');
    g.addColorStop(1, 'rgba(20, 26, 34, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    blobTex = new THREE.CanvasTexture(c);
    blobTex.colorSpace = THREE.SRGBColorSpace;
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(length, width),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  m.renderOrder = 1;
  m.userData.noExport = true;
  m.name = 'BlobShadow';
  return m;
}
