// The floor (metres): a courtyard of saffron tiles 0.5 m square (each tile its own shade, grout lines, a fine speckle),
// a metre tape along the front edge (0 at the crate's front face where it starts, a long tick and a number every metre,
// a short tick every half metre, tilted towards the viewer so the numbers read from a low camera; a dark bar marks the
// crate's front edge on it, and its front band carries the s and d arrows), and a brick wall for the "push against a
// wall" example. +x is the way the crate is pushed.
// Few draw calls: the tape is one picture (strip, ticks, numbers and unit drawn on one canvas), the wall one brick
// box and one cap.
import * as THREE from 'three';
import { boxProjectUV, FONT } from '@shared/student/materials.js';

export const FLOOR = { x0: -10, x1: 14, z0: -3.5, z1: 8, tile: 0.5 };
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

function canvasTexture(w, h, draw, aniso = 8) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  return tex;
}
function rand(seed) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** 4 × 4 tiles (2 m square) in one picture: each tile a slightly different saffron, worn a little, grout between. */
function tileTexture() {
  const tex = canvasTexture(512, 512, (ctx, w) => {
    const r = rand(23);
    const n = 4;
    const t = w / n;
    ctx.fillStyle = '#ad9474'; // grout
    ctx.fillRect(0, 0, w, w);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const k = r();
        const g = ctx.createLinearGradient(i * t, j * t, (i + 1) * t, (j + 1) * t);
        g.addColorStop(0, `hsl(${32 + k * 4}, ${34 - k * 6}%, ${72 + k * 4}%)`);
        g.addColorStop(1, `hsl(${30 + k * 4}, ${32 - k * 6}%, ${68 + k * 4}%)`);
        ctx.fillStyle = g;
        ctx.fillRect(i * t + 3, j * t + 3, t - 6, t - 6);
        // a soft sheen on each tile
        ctx.fillStyle = 'rgba(255, 246, 220, 0.12)';
        ctx.fillRect(i * t + 6, j * t + 6, t * 0.45, t * 0.3);
      }
    // fine speckle (terrazzo-like chips) and a few scuffs
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = r() < 0.5 ? `rgba(150, 90, 30, ${0.1 + r() * 0.15})` : `rgba(255, 240, 210, ${0.15 + r() * 0.2})`;
      ctx.fillRect(r() * w, r() * w, 1 + r() * 1.5, 1 + r() * 1.5);
    }
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = `rgba(120, 70, 20, ${0.05 + r() * 0.06})`;
      ctx.lineWidth = 1 + r() * 2;
      const x = r() * w;
      const y = r() * w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 20 * r(), y + 10 * r(), x + 30 + 30 * r(), y + (r() - 0.5) * 12);
      ctx.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((FLOOR.x1 - FLOOR.x0) / (4 * FLOOR.tile), (FLOOR.z1 - FLOOR.z0) / (4 * FLOOR.tile));
  return tex;
}

/** Bricks in a picture 1 m square (8 courses, two and a half bricks each), with lime mortar. */
function brickTexture() {
  const tex = canvasTexture(256, 256, (ctx, w, h) => {
    const r = rand(5);
    ctx.fillStyle = '#d9d1c4'; // mortar
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const bh = h / rows;
    for (let row = 0; row < rows; row++) {
      const off = row % 2 ? 0 : -32;
      for (let x = off; x < w; x += 64) {
        const tone = 150 + r() * 30;
        ctx.fillStyle = `rgb(${tone + 30}, ${tone * 0.58}, ${tone * 0.42})`;
        ctx.fillRect(x + 2, row * bh + 2, 60, bh - 4);
        ctx.fillStyle = `rgba(60, 20, 10, ${0.06 + r() * 0.1})`;
        ctx.fillRect(x + 2, row * bh + bh - 7, 60, 5);
      }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** The tape in one picture: the white strip, a tick every half metre, a number every metre, the unit at the end. */
function tapeTexture(digit, unit) {
  const len = TAPE.to - TAPE.from;
  const W = 2048;
  const H = 128;
  const px = W / len; // per metre along
  const py = H / TAPE.wide; // per metre across (the top of the picture is the tape's back edge)
  return canvasTexture(
    W,
    H,
    (ctx) => {
      ctx.fillStyle = '#fbfaf4';
      ctx.fillRect(0, 0, W, H);
      // a faint printed edge line along both sides
      ctx.fillStyle = 'rgba(29, 31, 34, 0.18)';
      ctx.fillRect(0, 0, W, 2);
      ctx.fillRect(0, H - 2, W, 2);
      ctx.fillStyle = '#1d1f22';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= TAPE.metres * 2; i++) {
        const whole = i % 2 === 0;
        const x = (i / 2 - TAPE.from) * px;
        ctx.fillRect(x - 0.01 * px, 0, 0.02 * px, (whole ? 0.09 : 0.05) * py);
        if (whole) {
          ctx.font = `700 ${Math.round(0.17 * py)}px ${FONT}`;
          ctx.fillText(digit(i / 2), x, (TAPE.wide - 0.205) * py + 0.006 * py);
        }
      }
      ctx.font = `700 ${Math.round(0.13 * py)}px ${FONT}`;
      ctx.fillText(unit, (TAPE.metres + 0.25 - TAPE.from) * px, (TAPE.wide - 0.205) * py);
    },
    16,
  );
}

/** @param {{ digit: (n: number | string) => string, unit: string }} options */
export function createFloor({ digit, unit }) {
  const root = new THREE.Group();
  root.name = 'Floor';
  const len = FLOOR.x1 - FLOOR.x0;
  const wide = FLOOR.z1 - FLOOR.z0;
  const top = new THREE.MeshStandardMaterial({ name: 'FloorTiles', map: tileTexture(), roughness: 0.7, metalness: 0 });
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(len, wide).rotateX(-Math.PI / 2), top);
  slab.position.set((FLOOR.x0 + FLOOR.x1) / 2, 0, (FLOOR.z0 + FLOOR.z1) / 2);
  slab.name = 'FloorSlab';
  slab.receiveShadow = true;
  root.add(slab);

  // the metre tape: a white strip tilted up toward the viewer, black ticks, a number at every metre (one picture)
  const tape = new THREE.Group();
  tape.name = 'MetreTape';
  tape.position.set(0, 0.006, TAPE.z);
  tape.rotation.x = -Math.PI / 2 + TAPE.tilt; // the strip faces up and toward the camera
  root.add(tape);
  const tapeMat = new THREE.MeshStandardMaterial({ name: 'Tape', map: tapeTexture(digit, unit), roughness: 0.6, metalness: 0 });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(TAPE.to - TAPE.from, TAPE.wide), tapeMat);
  strip.position.set((TAPE.from + TAPE.to) / 2, TAPE.wide / 2, 0.003);
  strip.receiveShadow = true;
  tape.add(strip);
  // the crate's front edge on the tape: a dark bar that moves with it, so where it stops reads exactly
  const cursor = new THREE.Mesh(new THREE.PlaneGeometry(0.03, TAPE.wide), new THREE.MeshBasicMaterial({ name: 'TapeCursor', color: '#7a3b0c' }));
  cursor.name = 'CrateFrontOnTape';
  cursor.position.set(0, TAPE.wide / 2, 0.005);
  tape.add(cursor);

  // the wall: bricks on every side (UVs in metres), a cement cap on top, just in front of the crate's starting place
  const wall = new THREE.Group();
  wall.name = 'BrickWall';
  const bricks = new THREE.MeshStandardMaterial({ name: 'Bricks', map: brickTexture(), roughness: 0.9, metalness: 0 });
  const body = boxProjectUV(new THREE.BoxGeometry(WALL.thick, WALL.high - 0.06, WALL.deep).translate(0, (WALL.high - 0.06) / 2, 0));
  const wallMesh = new THREE.Mesh(body, bricks);
  wallMesh.name = 'Bricks';
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(WALL.thick + 0.05, 0.06, WALL.deep + 0.05),
    new THREE.MeshStandardMaterial({ name: 'WallCap', color: '#b9ae9e', roughness: 0.85, metalness: 0 }),
  );
  cap.position.y = WALL.high - 0.03;
  cap.name = 'WallCap';
  wallMesh.position.x = cap.position.x = WALL.thick / 2;
  wallMesh.castShadow = cap.castShadow = true;
  wallMesh.receiveShadow = true;
  wall.add(wallMesh, cap);
  wall.visible = false;
  root.add(wall);

  return {
    root,
    slab,
    tape,
    wall,
    /** The crate's front edge at x metres along the tape. */
    markFront(x) {
      cursor.position.x = x;
    },
    /** The wall's front face (the side the crate touches) at x. */
    placeWall(x) {
      wall.position.x = x;
    },
  };
}
