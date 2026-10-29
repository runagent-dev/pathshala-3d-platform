// The floor (metres): bright saffron tiles 0.5 m square, a metre tape along the front edge (0 at the crate's front face where it
// starts, a long tick and a number every metre, a short tick every half metre, tilted towards the viewer so the numbers
// read from a low camera; a dark bar marks the crate's front edge on it, and its front band carries the s and d arrows), and a brick wall for the "push against a wall" example. +x is the way the crate is pushed.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';

export const FLOOR = { x0: -7, x1: 11, z0: -2.5, z1: 6, tile: 0.5 };
export const TAPE = { z: 0.76, from: -0.15, to: 6.4, metres: 6, wide: 0.4, tilt: 0.35, band: 0.05 };

/**
 * A point on the tape's face, `ly` metres back from its front edge and `lz` above it, as world { y, z } (x is the
 * same along the tape): the s and d arrows lie on its front band, so they line up with its ticks from any view.
 */
export function onTape(ly, lz = 0) {
  const th = -Math.PI / 2 + TAPE.tilt;
  return { y: 0.006 + ly * Math.cos(th) - lz * Math.sin(th), z: TAPE.z + ly * Math.sin(th) + lz * Math.cos(th) };
}
export const WALL = { thick: 0.4, high: 1.45, deep: 2.1 };

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function tileTexture() {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f7c35f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d99a3a';
    ctx.fillRect(0, 0, 2, h);
    ctx.fillRect(0, 0, w, 2);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((FLOOR.x1 - FLOOR.x0) / FLOOR.tile, (FLOOR.z1 - FLOOR.z0) / FLOOR.tile);
  return tex;
}

function brickTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    let seed = 5;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    ctx.fillStyle = '#d9d1c4'; // mortar
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const bh = h / rows;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? 0 : -32;
      for (let x = off; x < w; x += 64) {
        const tone = 150 + rnd() * 30;
        ctx.fillStyle = `rgb(${tone + 30}, ${tone * 0.58}, ${tone * 0.42})`;
        ctx.fillRect(x + 2, r * bh + 2, 60, bh - 4);
      }
    }
  });
}

/** @param {{ digit: (n: number | string) => string, unit: string }} options */
export function createFloor({ digit, unit }) {
  const root = new THREE.Group();
  root.name = 'Floor';
  const len = FLOOR.x1 - FLOOR.x0;
  const wide = FLOOR.z1 - FLOOR.z0;
  const top = new THREE.MeshStandardMaterial({ name: 'FloorTiles', map: tileTexture(), roughness: 0.85, metalness: 0 });
  const side = new THREE.MeshStandardMaterial({ name: 'FloorEdge', color: '#b8712a', roughness: 0.9, metalness: 0 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, wide), [side, side, top, side, side, side]);
  slab.position.set((FLOOR.x0 + FLOOR.x1) / 2, -0.03, (FLOOR.z0 + FLOOR.z1) / 2);
  slab.name = 'FloorSlab';
  slab.receiveShadow = true;
  root.add(slab);

  // the metre tape: a white strip tilted up toward the viewer, black ticks, a number at every metre
  const tape = new THREE.Group();
  tape.name = 'MetreTape';
  tape.position.set(0, 0.006, TAPE.z);
  tape.rotation.x = -Math.PI / 2 + TAPE.tilt; // the strip faces up and toward the camera
  root.add(tape);
  const tapeMat = new THREE.MeshStandardMaterial({ name: 'Tape', color: '#fbfaf4', roughness: 0.6, metalness: 0 });
  const inkMat = new THREE.MeshBasicMaterial({ name: 'TapeInk', color: '#1d1f22' });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(TAPE.to - TAPE.from, TAPE.wide, 0.006), tapeMat);
  strip.position.set((TAPE.from + TAPE.to) / 2, TAPE.wide / 2, 0);
  strip.receiveShadow = true;
  tape.add(strip);
  for (let i = 0; i <= TAPE.metres * 2; i++) {
    const whole = i % 2 === 0;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.02, whole ? 0.09 : 0.05, 0.002), inkMat);
    tick.position.set(i / 2, TAPE.wide - (whole ? 0.045 : 0.025), 0.004);
    tape.add(tick);
    if (whole) {
      const n = textMesh(digit(i / 2), 0.17, { color: '#1d1f22', weight: 700 });
      n.position.set(i / 2, 0.205, 0.004);
      tape.add(n);
    }
  }
  // the crate's front edge on the tape: a dark bar that moves with it, so where it stops reads exactly
  const cursor = new THREE.Mesh(new THREE.BoxGeometry(0.03, TAPE.wide, 0.004), new THREE.MeshBasicMaterial({ name: 'TapeCursor', color: '#7a3b0c' }));
  cursor.name = 'CrateFrontOnTape';
  cursor.position.set(0, TAPE.wide / 2, 0.005);
  tape.add(cursor);
  const u = textMesh(unit, 0.13, { color: '#1d1f22', weight: 700 });
  u.position.set(TAPE.metres + 0.25, 0.205, 0.004);
  tape.add(u);

  // the wall: plastered bricks, standing just in front of the crate's starting place
  const wall = new THREE.Group();
  wall.name = 'BrickWall';
  const bricks = brickTexture();
  bricks.wrapS = bricks.wrapT = THREE.RepeatWrapping;
  const faceTex = bricks.clone();
  faceTex.repeat.set(WALL.deep / 1, WALL.high / 1);
  faceTex.needsUpdate = true;
  const face = new THREE.MeshStandardMaterial({ name: 'Bricks', map: faceTex, roughness: 0.9, metalness: 0 });
  const cap = new THREE.MeshStandardMaterial({ name: 'WallCap', color: '#b9ae9e', roughness: 0.85, metalness: 0 });
  const sideTex = bricks.clone();
  sideTex.repeat.set(WALL.thick / 1, WALL.high / 1);
  sideTex.needsUpdate = true;
  const sideMat = new THREE.MeshStandardMaterial({ name: 'BricksSide', map: sideTex, roughness: 0.9, metalness: 0 });
  // faces: +x, −x (the long faces) bricks; top the cap; ±z (the ends the camera sees) bricks too
  const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(WALL.thick, WALL.high, WALL.deep), [face, face, cap, cap, sideMat, sideMat]);
  wallMesh.position.set(WALL.thick / 2, WALL.high / 2, 0);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  wall.add(wallMesh);
  wall.visible = false;
  root.add(wall);

  return {
    root,
    slab,
    tape,
    wall,
    /** The wall's front face (the side the crate touches) at x. */
    /** The crate's front edge at x metres along the tape. */
    markFront(x) {
      cursor.position.x = x;
    },
    placeWall(x) {
      wall.position.x = x;
    },
  };
}
