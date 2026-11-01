// Where each stop happens: the two apples on a wooden table in a room (plastered blue walls with a skirting and a
// window, a red-oxide tiled floor), and the Earth, the Moon, the Sun and the galaxy in a night sky of stars, thick
// along a Milky Way band, with a soft blue atmosphere round the Earth. None of it is exported (noExport, sprites and
// shader materials are left out) and none of it is drawn on a transparent background.
// Cheap on purpose: the room is one inside-out box and two merged meshes, the table two meshes, the grain of the
// plaster and the tiles small textures made once; the stars two point clouds.
import * as THREE from 'three';
import { bakeParts } from './draw.js';

function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function canvasTexture(c, repeat = null) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

/** A vertical gradient for the scene's background: the night sky's depth, or what shows past the room. */
export function gradientTexture(top, bottom) {
  const c = canvas(4, 256);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  return canvasTexture(c);
}

/** Plaster grain: a small grey-white noise array (no canvas), multiplied by a surface's own colour. */
let grain = null;
function plasterGrain() {
  if (grain) return grain;
  const N = 256;
  const data = new Uint8Array(N * N * 4);
  const r = rand(41);
  // value noise at two scales: soft blotches and fine grit
  const coarse = new Float32Array(17 * 17).map(() => r());
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const gx = (x / N) * 16;
      const gy = (y / N) * 16;
      const ix = Math.floor(gx);
      const iy = Math.floor(gy);
      const fx = smooth(gx - ix);
      const fy = smooth(gy - iy);
      const at = (i, j) => coarse[(j % 16) * 17 + (i % 16)];
      const v = at(ix, iy) * (1 - fx) * (1 - fy) + at(ix + 1, iy) * fx * (1 - fy) + at(ix, iy + 1) * (1 - fx) * fy + at(ix + 1, iy + 1) * fx * fy;
      const k = 214 + v * 32 + (r() - 0.5) * 22;
      const i = (y * N + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, k));
      data[i + 3] = 255;
    }
  grain = new THREE.DataTexture(data, N, N);
  grain.colorSpace = THREE.SRGBColorSpace;
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.magFilter = THREE.LinearFilter;
  grain.minFilter = THREE.LinearMipmapLinearFilter;
  grain.generateMipmaps = true;
  grain.needsUpdate = true;
  return grain;
}

/** Floor tiles: square tiles with thin grout lines and a little mottling (near white: the material gives the colour). */
function tileTexture() {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  g.fillStyle = '#f2f2f2';
  g.fillRect(0, 0, S, S);
  const r = rand(7);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '120,110,100'}, ${0.05 + r() * 0.08})`;
    g.beginPath();
    g.arc(r() * S, r() * S, 4 + r() * 18, 0, Math.PI * 2);
    g.fill();
  }
  // two tiles a side, each a shade apart
  for (const [x, y, a] of [
    [0, 0, 0.0],
    [1, 1, 0.0],
    [1, 0, 0.06],
    [0, 1, 0.06],
  ]) {
    g.fillStyle = `rgba(60, 30, 20, ${a})`;
    g.fillRect(x * (S / 2), y * (S / 2), S / 2, S / 2);
  }
  g.strokeStyle = 'rgba(70, 60, 55, 0.55)';
  g.lineWidth = 3;
  for (const p of [1.5, S / 2]) {
    g.beginPath();
    g.moveTo(p, 0);
    g.lineTo(p, S);
    g.moveTo(0, p);
    g.lineTo(S, p);
    g.stroke();
  }
  return canvasTexture(c, [7, 7]);
}

/** The table's wood: warm brown boards with long grain lines. */
function woodTexture() {
  const W = 512;
  const H = 256;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#8f5a32';
  g.fillRect(0, 0, W, H);
  const r = rand(19);
  // three boards along the table, each a shade apart, then the grain
  for (let b = 0; b < 3; b++) {
    g.fillStyle = `rgba(${b === 1 ? '60, 30, 10' : '255, 210, 160'}, ${0.06 + r() * 0.05})`;
    g.fillRect(0, (b * H) / 3, W, H / 3);
  }
  for (let i = 0; i < 140; i++) {
    const y0 = r() * H;
    const dark = r() < 0.6;
    g.strokeStyle = dark ? `rgba(70, 38, 16, ${0.12 + r() * 0.2})` : `rgba(255, 214, 160, ${0.08 + r() * 0.12})`;
    g.lineWidth = 0.6 + r() * 1.6;
    g.beginPath();
    g.moveTo(0, y0);
    for (let x = 0; x <= W; x += 32) g.lineTo(x, y0 + Math.sin(x * 0.012 + i) * 2.2 + (r() - 0.5) * 1.2);
    g.stroke();
  }
  g.strokeStyle = 'rgba(50, 26, 10, 0.55)';
  g.lineWidth = 2;
  for (let b = 1; b < 3; b++) {
    g.beginPath();
    g.moveTo(0, (b * H) / 3);
    g.lineTo(W, (b * H) / 3);
    g.stroke();
  }
  return canvasTexture(c);
}

export const TABLE = { w: 150, d: 52, top: 3.5, h: 75, cx: 2 }; // cm; the top's upper face is at y = 0

/**
 * The table the apples lie on: its top (the only part that shows the apples' shadows) and its legs and apron (one
 * mesh), in centimetres.
 */
export function createTableModel() {
  const wood = new THREE.MeshStandardMaterial({ name: 'TableWood', map: woodTexture(), roughness: 0.62, metalness: 0 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(TABLE.w, TABLE.top, TABLE.d), wood);
  top.name = 'TableTop';
  top.position.set(TABLE.cx, -TABLE.top / 2, 0);
  const parts = [];
  const legH = TABLE.h - TABLE.top;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(5, legH, 5));
      leg.position.set(TABLE.cx + sx * (TABLE.w / 2 - 6), -TABLE.top - legH / 2, sz * (TABLE.d / 2 - 6));
      parts.push({ mesh: leg, color: '#7a4a2a' });
    }
  for (const sz of [-1, 1]) {
    const apron = new THREE.Mesh(new THREE.BoxGeometry(TABLE.w - 14, 9, 2.4));
    apron.position.set(TABLE.cx, -TABLE.top - 4.5, sz * (TABLE.d / 2 - 5));
    parts.push({ mesh: apron, color: '#6e4224' });
  }
  for (const sx of [-1, 1]) {
    const apron = new THREE.Mesh(new THREE.BoxGeometry(2.4, 9, TABLE.d - 14));
    apron.position.set(TABLE.cx + sx * (TABLE.w / 2 - 5), -TABLE.top - 4.5, 0);
    parts.push({ mesh: apron, color: '#6e4224' });
  }
  const frame = new THREE.Mesh(bakeParts(parts), new THREE.MeshStandardMaterial({ name: 'TableFrame', vertexColors: true, roughness: 0.7 }));
  frame.name = 'TableFrame';
  return { top, frame };
}

/** The room round the table: blue plastered walls, a warm ceiling, a red-oxide tiled floor, a skirting and a window. */
export function createRoom() {
  const root = new THREE.Group();
  root.name = 'Room';
  root.userData.noExport = true;
  const W = 520;
  const Hh = 290;
  const D = 360;
  const floorY = -TABLE.h;
  const backZ = -78; // the back wall, a little behind the table
  const plaster = plasterGrain();
  const wallMap = plaster.clone();
  wallMap.repeat.set(3, 2);
  wallMap.needsUpdate = true;
  const wall = new THREE.MeshStandardMaterial({ name: 'Wall', color: '#7c9cb6', map: wallMap, roughness: 0.95, side: THREE.BackSide });
  const ceiling = new THREE.MeshStandardMaterial({ name: 'Ceiling', color: '#e6d9c2', map: plaster, roughness: 0.95, side: THREE.BackSide });
  const floor = new THREE.MeshStandardMaterial({ name: 'Floor', color: '#9c4a34', map: tileTexture(), roughness: 0.55, side: THREE.BackSide });
  // BoxGeometry's faces: +x, −x, +y (ceiling), −y (floor), +z, −z
  const box = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, D), [wall, wall, ceiling, floor, wall, wall]);
  box.position.set(0, floorY + Hh / 2, backZ + D / 2);
  box.name = 'RoomBox';
  root.add(box);

  // the skirting round the walls and the window's frame: one mesh
  const parts = [];
  const strip = (w, h, d, x, y, z, color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.position.set(x, y, z);
    parts.push({ mesh: m, color });
  };
  const sk = '#4a3020';
  strip(W, 12, 1.6, 0, floorY + 6, backZ + 0.8, sk);
  strip(W, 12, 1.6, 0, floorY + 6, backZ + D - 0.8, sk);
  strip(1.6, 12, D, -W / 2 + 0.8, floorY + 6, backZ + D / 2, sk);
  strip(1.6, 12, D, W / 2 - 0.8, floorY + 6, backZ + D / 2, sk);
  // the window on the back wall, up and to the left of the table: a wooden frame, a sill, two bars
  const wx = -95;
  const wy = floorY + 150;
  const ww = 96;
  const wh = 110;
  const fr = '#f1e6d2';
  strip(ww + 10, 6, 4, wx, wy + wh / 2 + 3, backZ + 2, fr);
  strip(ww + 16, 5, 9, wx, wy - wh / 2 - 2.5, backZ + 4.5, fr);
  strip(6, wh, 4, wx - ww / 2 - 2, wy, backZ + 2, fr);
  strip(6, wh, 4, wx + ww / 2 + 2, wy, backZ + 2, fr);
  strip(3.5, wh, 3, wx, wy, backZ + 1.8, fr);
  for (const k of [-0.25, 0.25]) strip(ww, 2.2, 2.5, wx, wy + wh * k, backZ + 1.6, '#3d4a57');
  const trim = new THREE.Mesh(bakeParts(parts), new THREE.MeshStandardMaterial({ name: 'Trim', vertexColors: true, roughness: 0.6 }));
  trim.name = 'RoomTrim';
  root.add(trim);
  // the view through the window: a bright sky over a far line of trees (unlit: the brightest thing in the room)
  const c = canvas(64, 128);
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 128);
  sky.addColorStop(0, '#8ec5ef');
  sky.addColorStop(0.7, '#d7ecfa');
  g.fillStyle = sky;
  g.fillRect(0, 0, 64, 128);
  g.fillStyle = '#5f7f55';
  g.beginPath();
  g.moveTo(0, 128);
  for (let x = 0; x <= 64; x += 4) g.lineTo(x, 100 - Math.abs(Math.sin(x * 0.31)) * 9 - (x % 12 === 0 ? 5 : 0));
  g.lineTo(64, 128);
  g.fill();
  const view = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ map: canvasTexture(c), toneMapped: false }));
  view.position.set(wx, wy, backZ + 0.3);
  view.name = 'WindowView';
  root.add(view);
  return root;
}

/** The night sky: dim stars thick along a Milky Way band, and a few bright ones (two point clouds, far away). */
export function createStars() {
  const root = new THREE.Group();
  root.name = 'Stars';
  root.userData.noExport = true;
  const dot = canvas(32, 32);
  const g = dot.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const map = new THREE.CanvasTexture(dot);
  const r = rand(23);
  const band = new THREE.Vector3(0.35, 0.8, -0.48).normalize(); // the band's pole
  const v = new THREE.Vector3();
  const tints = [
    [1, 1, 1],
    [0.78, 0.86, 1],
    [1, 0.9, 0.74],
  ];
  function cloud(count, size, bright, inBand) {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      do {
        v.set(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
      } while (v.lengthSq() > 1 || v.lengthSq() < 0.01);
      v.normalize();
      if (r() < inBand) v.addScaledVector(band, -v.dot(band) * (0.75 + r() * 0.25)).normalize();
      pos.set([v.x * 3000, v.y * 3000, v.z * 3000], i * 3);
      const t = tints[Math.floor(r() * tints.length)];
      const k = bright * (0.45 + r() * 0.55);
      col.set([t[0] * k, t[1] * k, t[2] * k], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size, map, vertexColors: true, sizeAttenuation: false, transparent: true, depthWrite: false, toneMapped: false }),
    );
    pts.frustumCulled = false;
    pts.renderOrder = -1;
    return pts;
  }
  root.add(cloud(1800, 3, 0.8, 0.55), cloud(170, 5.2, 1, 0.2));
  return root;
}

/**
 * A soft blue atmosphere round a planet of radius r: a slightly larger sphere seen from inside, brightest at the
 * planet's edge and fading outwards (additive, a shader: never exported).
 */
export function createHalo(r, color = '#5fa8ff', strength = 0.9) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color).multiplyScalar(strength) } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      void main() {
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      varying vec3 vN;
      void main() {
        float k = clamp(-vN.z / 0.42, 0.0, 1.0);
        gl_FragColor = vec4(color * k * k, 1.0);
      }`,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 48, 24), mat);
  halo.name = 'Atmosphere';
  halo.userData.noExport = true;
  halo.renderOrder = 2;
  return halo;
}
