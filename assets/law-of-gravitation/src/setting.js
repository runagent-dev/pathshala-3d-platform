// Where the spheres are: a plain table before a soft blue wall. None of it is exported (noExport) and none of it is
// drawn on a transparent background. Cheap on purpose: three merged meshes without textures. In metres (the table's
// top at y = 0, the bench's front at z = 0.22).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Vertex colours from a function of the position (a soft light falling across a surface). */
function shade(geo, fn) {
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const k = fn(pos.getX(i), pos.getY(i), pos.getZ(i));
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const plane = (w, h, x, y, z) => new THREE.PlaneGeometry(w, h).translate(x, y, z);
/** Merged parts in one mesh (every part given the same attributes: position, normal, uv, color). */
function merged(name, parts, material, fn = () => 1) {
  const geos = parts.map((g) => shade(g.index ? g.toNonIndexed() : g, fn));
  const mesh = new THREE.Mesh(mergeGeometries(geos), material);
  for (const g of geos) g.dispose();
  mesh.name = name;
  return mesh;
}

/**
 * The setting round the bench: a plain table top (y = 0, from the wall at z = −1.1 to z = 1.5) before a soft blue
 * wall, lighter low down, and a plain floor beyond (seen only when the view is turned). No pictures or props: only
 * the spheres draw the eye.
 */
export function createLab() {
  const root = new THREE.Group();
  root.name = 'PhysicsRoom';
  root.userData.noExport = true;
  const WALL_Z = -1.1;
  const X0 = -7;
  const X1 = 9.5;
  const W = X1 - X0;
  const XC = (X0 + X1) / 2;
  const std = (name, color, roughness = 0.92) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0, vertexColors: true });
  const wall = merged('Wall', [plane(W, 6.7, XC, 2.55, WALL_Z)], std('Wall', 0x9fbbd6), (_x, y) =>
    THREE.MathUtils.clamp(1.05 - Math.max(0, y) * 0.06, 0.8, 1.05),
  );
  const table = merged(
    'Table',
    [box(W, 0.06, 2.6, XC, -0.03, WALL_Z + 1.3), box(W, 0.12, 0.04, XC, -0.12, WALL_Z + 2.58)],
    std('Table', 0xb98552, 0.7),
    (_x, y) => (y < -0.05 ? 0.8 : 1),
  );
  table.receiveShadow = true; // the bench's and the spheres' shadows on the table
  const floor = merged('Floor', [new THREE.PlaneGeometry(W, 14).rotateX(-Math.PI / 2).translate(XC, -0.82, WALL_Z + 7)], std('Floor', 0x8f5a48, 0.8));
  root.add(wall, table, floor);
  return root;
}

/** A vertical gradient for the scene's background (the night sky's depth; past the room's walls). */
export function gradientTexture(top, bottom) {
  return canvasTexture(4, 256, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
  });
}
