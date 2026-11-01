// The setting, in metres: a plain wooden bench (one calm colour, no grain) before a soft blue wall, lighter low down,
// and a plain floor. No window, pegboard, clock, tiles or shelf: only the spring, its support, the ruler and the hand
// draw the eye. The bench's middle slab is the table of the GLB; everything else is scenery (never exported).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const WALL_Z = -0.5; // the wall's face
export const FRONT_Z = 0.14; // the bench's front edge
const FLOOR_Y = -0.92;
const TOP = 0.04; // the bench top's thickness

/** A vertical gradient in vertex colours: `low` at the bottom of the geometry, `high` at its top. */
function gradient(geo, h, low, high) {
  const a = new THREE.Color(low);
  const b = new THREE.Color(high);
  const col = new THREE.Color();
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    col.lerpColors(a, b, pos.getY(i) / h + 0.5);
    colors.set([col.r, col.g, col.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export function createRoom() {
  const root = new THREE.Group();
  root.name = 'Laboratory';
  root.userData.noExport = true;

  const wall = new THREE.Mesh(
    gradient(new THREE.PlaneGeometry(4, 2.1, 1, 6), 2.1, '#cfdbe4', '#89a8c4'),
    new THREE.MeshStandardMaterial({ name: 'Wall', vertexColors: true, roughness: 0.95 }),
  );
  wall.position.set(0.2, FLOOR_Y + 1.05, WALL_Z);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 2.4),
    new THREE.MeshStandardMaterial({ name: 'Floor', color: '#9c8a7a', roughness: 0.8 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0.2, FLOOR_Y, WALL_Z + 1.2);

  // the bench: the middle slab under the apparatus (the table of the GLB), the two long ends one mesh, a plain front
  const W0 = -1.7;
  const W1 = 2.1;
  const D = FRONT_Z - WALL_Z;
  const z0 = (FRONT_Z + WALL_Z) / 2;
  const topMat = new THREE.MeshStandardMaterial({ name: 'BenchTop', color: '#b98a5e', roughness: 0.55 });
  const slab = (x0, x1) => new THREE.BoxGeometry(x1 - x0, TOP, D).translate((x0 + x1) / 2, -TOP / 2, z0);
  const top = new THREE.Mesh(slab(-0.25, 0.85), topMat);
  top.name = 'Table';
  top.receiveShadow = true;
  const ends = new THREE.Mesh(mergeGeometries([slab(W0, -0.25), slab(0.85, W1)]), topMat);
  ends.name = 'BenchEnds';
  ends.receiveShadow = true;
  const H = -TOP - FLOOR_Y;
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(W1 - W0, H),
    new THREE.MeshStandardMaterial({ name: 'BenchFront', color: '#8a6446', roughness: 0.65 }),
  );
  front.position.set((W0 + W1) / 2, -TOP - H / 2, FRONT_Z - 0.025);
  root.add(wall, floor, ends, front);
  // only the bench gets shadows (the apparatus's and the hand's); nothing in the room casts one

  // the room beyond, for the turned view: the same soft blue, darker towards the floor
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#a9c0d4');
  g.addColorStop(0.55, '#89a8c4');
  g.addColorStop(1, '#5f7c96');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const background = new THREE.CanvasTexture(c);
  background.colorSpace = THREE.SRGBColorSpace;
  return { root, top, background };
}
