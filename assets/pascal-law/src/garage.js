// The workshop round the lift, kept plain so the lift is what you see: a soft plaster wall over a muted teal dado and a
// blue-grey epoxy floor with yellow safety lines round the lift. No image files: the floor's grain is a small tiling
// canvas, and the plain coloured parts share one vertex-coloured material. Merged at the end: a few draw calls.
// Metres; the floor is y = 0, the lift stands round x = 0, the wall is behind it at z = WALL_Z.
import * as THREE from 'three';
import { mergeStatic } from './merge.js';

export const WALL_Z = -1.25;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function canvasTexture(w, h, paint, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.anisotropy = 2;
  return tex;
}

const BAND = 1.25; // the top of the teal dado (m)

/** The floor's grain: one metre of blue-grey epoxy with specks (it tiles). */
function paintFloor(g, W, H) {
  const r = rng(3);
  g.fillStyle = '#6f7d8c';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) {
    const v = (r() - 0.5) * 50;
    g.fillStyle = `rgba(${111 + v},${125 + v},${140 + v},0.5)`;
    g.fillRect(r() * W, r() * H, 3, 3);
  }
}

/** A geometry in one plain colour (as vertex colours, for the shared paint material). */
function painted(geo, color) {
  const c = new THREE.Color(color);
  const n = geo.attributes.position.count;
  const rgb = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(rgb, i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  return geo;
}
/** A plane with a vertical gradient (bottom colour, top colour), for the dado. */
function gradientPlane(w, h, bottom, top) {
  const geo = new THREE.PlaneGeometry(w, h);
  const b = new THREE.Color(bottom);
  const t = new THREE.Color(top);
  const pos = geo.attributes.position;
  const rgb = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) (pos.getY(i) > 0 ? t : b).toArray(rgb, i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  return geo;
}

/** The workshop. Returns { root }. */
export function createGarage() {
  const root = new THREE.Group();
  root.name = 'Workshop';
  root.userData.noExport = true;
  const WX = 0.2; // the wall's and the floor's middle (x)
  const paint = new THREE.MeshStandardMaterial({ name: 'WorkshopPaint', vertexColors: true, roughness: 0.8, metalness: 0.05 });
  const add = (geo, mat, x, y, z, { cast = false, receive = false } = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = receive;
    root.add(m);
    return m;
  };

  // the wall: plain soft plaster above (lighter up high), a muted teal dado, a thin skirting; nothing hung on it
  add(gradientPlane(8, 3.2 - BAND, '#cdbba5', '#e6dccd'), paint, WX, BAND + (3.2 - BAND) / 2, WALL_Z, { receive: true });
  add(gradientPlane(8, BAND, '#3f6b70', '#5a878b'), paint, WX, BAND / 2, WALL_Z, { receive: true });
  add(painted(new THREE.BoxGeometry(8, 0.08, 0.02), '#3a4a52'), paint, WX, 0.04, WALL_Z + 0.01, { receive: true });

  // the floor: the grain tiles every metre; the yellow safety lines round the lift
  const floorTex = canvasTexture(512, 512, paintFloor, { repeat: [8, 4] });
  add(
    new THREE.PlaneGeometry(8, 4).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'EpoxyFloor', map: floorTex, roughness: 0.38, metalness: 0.08 }),
    WX,
    0,
    WALL_Z + 2,
    { receive: true },
  );
  const flat = (w, d, color, x, z, y = 0.0015) =>
    add(painted(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), color), paint, x, y, z, { receive: true });
  // the safety lines round the lift: x −1.25 … 1.7, z −0.9 … 0.95, 6 cm wide
  flat(2.95 + 0.06, 0.06, '#ffd21a', 0.225, -0.9);
  flat(2.95 + 0.06, 0.06, '#ffd21a', 0.225, 0.95);
  flat(0.06, 1.85, '#ffd21a', -1.25, 0.025);
  flat(0.06, 1.85, '#ffd21a', 1.7, 0.025);

  mergeStatic(root);
  return { root };
}
