// The courtyard round the tank, in metres (the ground is y = 0): a floor of terracotta tiles, a stone channel the
// jets fall into, a brick stand under the tank, and behind it a saffron lime-plastered wall with a band of cobalt
// and white tiles at the bottom and a garland of marigolds along the top, under an evening sky. Textures are drawn
// on small canvases (no image files); no green, no white page.
import * as THREE from 'three';
import { STAND } from './reading.js';
import { R } from './tank.js';

const WALL_Z = -1.15;

function canvasTexture(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  return tex;
}

// a small fixed sequence instead of Math.random, so the same commit draws the same pixels
function noise(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Terracotta floor tiles, 4 × 4 to a texture, each a little different, in pale grout. */
function tiles() {
  const rnd = noise(7);
  return canvasTexture(
    512,
    512,
    (ctx, w) => {
      ctx.fillStyle = '#e7c9a6';
      ctx.fillRect(0, 0, w, w);
      const n = 4;
      const s = w / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const l = 40 + rnd() * 9;
          ctx.fillStyle = `hsl(${14 + rnd() * 8}, ${58 + rnd() * 10}%, ${l}%)`;
          ctx.fillRect(i * s + 4, j * s + 4, s - 8, s - 8);
          // a soft sheen and a few darker specks
          const g = ctx.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
          g.addColorStop(0, 'rgba(255,230,200,0.16)');
          g.addColorStop(1, 'rgba(90,30,10,0.14)');
          ctx.fillStyle = g;
          ctx.fillRect(i * s + 4, j * s + 4, s - 8, s - 8);
          for (let k = 0; k < 18; k++) {
            ctx.fillStyle = `rgba(80,30,10,${0.08 + rnd() * 0.1})`;
            ctx.fillRect(i * s + 6 + rnd() * (s - 14), j * s + 6 + rnd() * (s - 14), 2 + rnd() * 3, 2 + rnd() * 3);
          }
        }
    },
    [16, 10],
  );
}

/** Saffron lime plaster, softly mottled. */
function plaster() {
  const rnd = noise(11);
  return canvasTexture(
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#ec9a3c';
      ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 140; k++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const r = 10 + rnd() * 40;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const warm = rnd() > 0.5;
        g.addColorStop(0, warm ? 'rgba(255,190,110,0.22)' : 'rgba(190,90,30,0.16)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    },
    [4, 1.6],
  );
}

/** Cobalt and white glazed tiles with a four-petal flower: the band along the bottom of the wall. */
function blueTiles() {
  return canvasTexture(
    256,
    256,
    (ctx, w) => {
      const s = w / 2;
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++) {
          const x = i * s;
          const y = j * s;
          ctx.fillStyle = '#f6f1e6';
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = '#1b3fa0';
          ctx.fillRect(x, y, s, 10);
          ctx.fillRect(x, y, 10, s);
          ctx.save();
          ctx.translate(x + s / 2, y + s / 2);
          for (let k = 0; k < 4; k++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.ellipse(0, -s * 0.2, s * 0.1, s * 0.2, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#2251c4';
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2);
          ctx.fillStyle = '#f2a20c';
          ctx.fill();
          ctx.restore();
          for (const [cx, cy] of [
            [x, y],
            [x + s, y],
            [x, y + s],
            [x + s, y + s],
          ]) {
            ctx.beginPath();
            ctx.arc(cx, cy, s * 0.14, 0, Math.PI * 2);
            ctx.fillStyle = '#1b3fa0';
            ctx.fill();
          }
        }
    },
    [40, 1],
  );
}

/** Red bricks in English bond with pale mortar. */
function bricks() {
  const rnd = noise(5);
  return canvasTexture(
    256,
    256,
    (ctx, w) => {
      ctx.fillStyle = '#d8c3a8';
      ctx.fillRect(0, 0, w, w);
      const rows = 8;
      const bh = w / rows;
      for (let r = 0; r < rows; r++) {
        const bw = r % 2 ? w / 4 : w / 2;
        const off = r % 4 === 1 ? bw / 2 : 0;
        for (let x = -off; x < w; x += bw) {
          ctx.fillStyle = `hsl(${8 + rnd() * 8}, ${55 + rnd() * 12}%, ${30 + rnd() * 9}%)`;
          ctx.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
        }
      }
    },
    [1.4, 1.2],
  );
}

export function createCourtyard({ shadow = true } = {}) {
  const root = new THREE.Group();
  root.name = 'Courtyard';

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshStandardMaterial({ name: 'Floor', map: tiles(), roughness: 0.78 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(1.5, 0, 2.6);
  floor.receiveShadow = shadow;
  floor.name = 'Floor';

  // the wall: plaster above, the band of blue tiles below, a cornice on top
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.4), new THREE.MeshStandardMaterial({ name: 'Wall', map: plaster(), roughness: 0.92 }));
  wall.position.set(1.5, 1.7, WALL_Z);
  wall.receiveShadow = shadow;
  const band = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 0.4),
    new THREE.MeshStandardMaterial({ name: 'WallTiles', map: blueTiles(), roughness: 0.35, metalness: 0.05 }),
  );
  band.position.set(1.5, 0.2, WALL_Z + 0.004);
  band.receiveShadow = shadow;
  const trimMat = new THREE.MeshStandardMaterial({ name: 'Trim', color: '#fff1d6', roughness: 0.7 });
  const trim = new THREE.Mesh(new THREE.BoxGeometry(16, 0.05, 0.04), trimMat);
  trim.position.set(1.5, 0.425, WALL_Z + 0.02);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(16, 0.12, 0.12), trimMat);
  cornice.position.set(1.5, 3.36, WALL_Z + 0.06);
  // a garland of marigolds, swinging in loops along the wall
  const flowers = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.03, 1),
    new THREE.MeshStandardMaterial({ name: 'Marigold', color: '#ffffff', roughness: 0.8 }),
    150,
  );
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  for (let i = 0; i < 150; i++) {
    const x = -1.6 + i * 0.04;
    const loop = ((x + 1.6) % 1.2) / 1.2;
    const y = 2.12 - 0.2 * Math.sin(Math.PI * loop);
    m4.makeTranslation(x, y, WALL_Z + 0.05);
    flowers.setMatrixAt(i, m4);
    flowers.setColorAt(i, col.set(i % 3 === 0 ? '#e8590c' : i % 3 === 1 ? '#fab005' : '#f76707'));
  }
  flowers.name = 'Garland';

  // the stand: bricks with a stone slab on top
  const standH = STAND - 0.04 - 0.05;
  const brickMat = new THREE.MeshStandardMaterial({ name: 'Bricks', map: bricks(), roughness: 0.9 });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.6, standH, 0.6), brickMat);
  stand.position.y = standH / 2;
  stand.castShadow = shadow;
  stand.receiveShadow = shadow;
  stand.name = 'Stand';
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.05, 0.68),
    new THREE.MeshStandardMaterial({ name: 'Slab', color: '#b8b2a7', roughness: 0.7 }),
  );
  slab.position.y = standH + 0.025;
  slab.castShadow = shadow;
  slab.receiveShadow = shadow;
  slab.name = 'Slab';

  // the stone channel the jets fall into, with a little water in it
  const stone = new THREE.MeshStandardMaterial({ name: 'ChannelStone', color: '#8f8a99', roughness: 0.75 });
  const x0 = R + 0.42;
  const x1 = 2.15;
  const channel = new THREE.Group();
  channel.name = 'Channel';
  for (const z of [-0.2, 0.2]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.03, 0.06), stone);
    side.position.set((x0 + x1) / 2, 0.015, z);
    side.receiveShadow = shadow;
    channel.add(side);
  }
  for (const x of [x0, x1]) {
    const end = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.46), stone);
    end.position.set(x, 0.015, 0);
    channel.add(end);
  }
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(x1 - x0, 0.34),
    new THREE.MeshStandardMaterial({ name: 'ChannelWater', color: '#2f8fe0', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.85 }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set((x0 + x1) / 2, 0.008, 0);
  pool.receiveShadow = shadow;
  channel.add(pool);

  root.add(floor, wall, band, trim, cornice, flowers, stand, slab, channel);
  return { root, near: [stand, slab] };
}

/** The evening sky behind the wall: indigo above, rose and orange towards the horizon. */
export function skyTexture() {
  const tex = canvasTexture(4, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#24306e');
    g.addColorStop(0.35, '#5b3b8c');
    g.addColorStop(0.62, '#c8547a');
    g.addColorStop(0.85, '#f48a52');
    g.addColorStop(1, '#ffc078');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(1, 1);
  return tex;
}
