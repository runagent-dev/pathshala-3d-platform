// The courtyard round the tank, in metres (the ground is y = 0), kept plain so the tank is what you see: a warm
// floor, a stone channel the jets fall into, a concrete stand under the tank, a soft sand-coloured wall and an evening
// sky. Textures are drawn on small canvases (no image files); no green, no white page.
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

/** Plain plaster: a soft warm sand gradient. */
function plaster() {
  return canvasTexture(
    4,
    256,
    (ctx, w, h) => {
      // a soft warm sand, a little lighter up high
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#ecd3b2');
      g.addColorStop(1, '#d9b48c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    [1, 1],
  );
}

export function createCourtyard({ shadow = true } = {}) {
  const root = new THREE.Group();
  root.name = 'Courtyard';

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshStandardMaterial({ name: 'Floor', color: '#b98d6e', roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(1.5, 0, 2.6);
  floor.receiveShadow = shadow;
  floor.name = 'Floor';

  // the wall: plain sand-coloured plaster (nothing on it)
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.4), new THREE.MeshStandardMaterial({ name: 'Wall', map: plaster(), roughness: 0.92 }));
  wall.position.set(1.5, 1.7, WALL_Z);
  wall.receiveShadow = shadow;
  // the stand: a plain concrete block with a stone slab on top
  const standH = STAND - 0.04 - 0.05;
  const blockMat = new THREE.MeshStandardMaterial({ name: 'Block', color: '#a99d8f', roughness: 0.9 });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.6, standH, 0.6), blockMat);
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

  root.add(floor, wall, stand, slab, channel);
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
