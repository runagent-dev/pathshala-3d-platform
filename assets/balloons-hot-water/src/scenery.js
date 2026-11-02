// The setting, in centimetres: a plain wooden lab bench (its top is y = 0) before a soft blue wall, lighter low down.
// Nothing else: no window, shelf, flasks or clock. Only the apparatus is the model; the
// bench and the wall are scenery (never exported).
import * as THREE from 'three';

const WALL_Z = -30;

/** A vertical gradient in vertex colours over a plane of height h: `low` at the bottom, `high` at the top. */
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
    gradient(new THREE.PlaneGeometry(260, 110, 1, 8), 110, '#c9d8e4', '#7fa1c0'),
    new THREE.MeshStandardMaterial({ name: 'Wall', vertexColors: true, roughness: 0.95 }),
  );
  wall.position.set(0, 25, WALL_Z);
  // the bench top and its front (the same warm wood)
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(150, 3, 52).translate(0, -1.5, WALL_Z + 26),
    new THREE.MeshStandardMaterial({ name: 'BenchTop', color: '#b98a5e', roughness: 0.55 }),
  );
  top.receiveShadow = true;
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 40),
    new THREE.MeshStandardMaterial({ name: 'BenchFront', color: '#8a6446', roughness: 0.7 }),
  );
  front.position.set(0, -23, WALL_Z + 52 - 0.05);
  root.add(wall, top, front);

  // the room beyond the wall, when the view is turned: the same soft blue
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#a3bcd2');
  g.addColorStop(0.55, '#7fa1c0');
  g.addColorStop(1, '#58748f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const background = new THREE.CanvasTexture(c);
  background.colorSpace = THREE.SRGBColorSpace;
  return { root, top, background };
}
