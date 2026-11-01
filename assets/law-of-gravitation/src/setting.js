// Where the two scenes are: the spheres on a teak table in a school physics room (ochre lime-washed wall over a
// blue-grey dado, a window onto a sunny yard, a poster of the planets going round the Sun, a clock, a blackboard),
// and the Earth in a starry night sky. None of it is exported (noExport) and none of it is drawn on a transparent
// background. Cheap on purpose: the room is a handful of merged meshes (one per material), the plaster grain one
// small pixel array shared by every surface, the stars two point clouds. In metres for the room (the table's top at
// y = 0, the bench's front at z = 0.22); in Earth radii for the sky.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

let grainBase = null;
/**
 * A seamless plaster grain (light grey, so a material's colour tints it): soft trowel blotches from two octaves of
 * tiling value noise and fine grit, written straight into a pixel array (no 2D canvas), made and uploaded once.
 */
function grain(repeatX, repeatY) {
  if (!grainBase) {
    const N = 256;
    const d = new Uint8Array(N * N * 4);
    const r = rand(11);
    const octave = (cells) => {
      const v = Float32Array.from({ length: cells * cells }, () => r());
      return (x, y) => {
        const fx = (x / N) * cells;
        const fy = (y / N) * cells;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const sx = fx - x0;
        const sy = fy - y0;
        const ux = sx * sx * (3 - 2 * sx);
        const uy = sy * sy * (3 - 2 * sy);
        const at = (i, j) => v[(j % cells) * cells + (i % cells)];
        const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * ux;
        const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * ux;
        return top + (bottom - top) * uy;
      };
    };
    const broad = octave(4);
    const fine = octave(16);
    for (let y = 0, i = 0; y < N; y++)
      for (let x = 0; x < N; x++, i += 4) {
        const n = 240 + (broad(x, y) - 0.5) * 16 + (fine(x, y) - 0.5) * 10 + (r() - 0.5) * 12;
        d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, n));
        d[i + 3] = 255;
      }
    grainBase = new THREE.DataTexture(d, N, N);
    grainBase.colorSpace = THREE.SRGBColorSpace;
    grainBase.wrapS = grainBase.wrapT = THREE.RepeatWrapping;
    grainBase.magFilter = THREE.LinearFilter;
    grainBase.minFilter = THREE.LinearMipmapLinearFilter;
    grainBase.generateMipmaps = true;
    grainBase.needsUpdate = true;
  }
  const t = grainBase.clone();
  t.repeat.set(repeatX, repeatY);
  return t;
}

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

/** The planets going round the Sun (a school poster, no words): a dark sky, the Sun at the left, orbits, planets. */
function posterTexture() {
  return canvasTexture(512, 320, (g, W, H) => {
    g.fillStyle = '#f4ead2';
    g.fillRect(0, 0, W, H);
    const sky = g.createLinearGradient(0, 0, W, 0);
    sky.addColorStop(0, '#1d2550');
    sky.addColorStop(1, '#0d1330');
    g.fillStyle = sky;
    g.fillRect(14, 14, W - 28, H - 28);
    const r = rand(3);
    g.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 90; i++) g.fillRect(14 + r() * (W - 28), 14 + r() * (H - 28), 1.6, 1.6);
    const cx = 40;
    const cy = H / 2;
    const sun = g.createRadialGradient(cx, cy, 4, cx, cy, 62);
    sun.addColorStop(0, '#fff3b0');
    sun.addColorStop(0.45, '#ffc533');
    sun.addColorStop(1, 'rgba(255,140,30,0)');
    g.fillStyle = sun;
    g.beginPath();
    g.arc(cx, cy, 62, 0, Math.PI * 2);
    g.fill();
    const planets = [
      [70, 4, '#b8a99a'],
      [104, 7, '#e8c27a'],
      [142, 7.5, '#3d86d9'],
      [180, 6, '#d0603a'],
      [250, 17, '#d9a46b'],
      [330, 14, '#e6cf8f'],
      [400, 10, '#8fd3e0'],
      [455, 9.5, '#4f6fe0'],
    ];
    g.lineWidth = 1.4;
    g.strokeStyle = 'rgba(200,210,255,0.35)';
    planets.forEach(([a, size, color], i) => {
      g.beginPath();
      g.ellipse(cx, cy, a, a * 0.32, 0, -Math.PI / 2.6, Math.PI / 2.6);
      g.stroke();
      const th = ((i % 2 ? 1 : -1) * (0.2 + 0.12 * (i % 3))) % 1;
      const x = cx + a * Math.cos(th);
      const y = cy + a * 0.32 * Math.sin(th);
      g.fillStyle = color;
      g.beginPath();
      g.arc(x, y, size, 0, Math.PI * 2);
      g.fill();
      if (i === 5) {
        g.strokeStyle = 'rgba(240,220,160,0.9)';
        g.lineWidth = 2.5;
        g.beginPath();
        g.ellipse(x, y, size * 1.9, size * 0.5, -0.25, 0, Math.PI * 2);
        g.stroke();
        g.lineWidth = 1.4;
        g.strokeStyle = 'rgba(200,210,255,0.35)';
      }
    });
  });
}

/** A plain school clock: white face, twelve marks, hands at ten past ten. */
function clockTexture() {
  return canvasTexture(256, 256, (g, W) => {
    const c = W / 2;
    g.fillStyle = '#2f3a46';
    g.beginPath();
    g.arc(c, c, c, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fbf8ef';
    g.beginPath();
    g.arc(c, c, c - 14, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2f3a46';
    for (let i = 0; i < 12; i++) {
      g.save();
      g.translate(c, c);
      g.rotate((i / 12) * Math.PI * 2);
      g.fillRect(-3, -(c - 22), 6, i % 3 ? 14 : 24);
      g.restore();
    }
    const hand = (angle, len, w) => {
      g.save();
      g.translate(c, c);
      g.rotate(angle);
      g.fillRect(-w / 2, -len, w, len + 12);
      g.restore();
    };
    hand(((10 + 10 / 60) / 12) * Math.PI * 2, 60, 9);
    hand((10 / 60) * Math.PI * 2, 88, 6);
    g.beginPath();
    g.arc(c, c, 9, 0, Math.PI * 2);
    g.fill();
  });
}

/** The window's view: a blue sky, a far line of trees over a sunny yard wall. */
function viewTexture() {
  return canvasTexture(128, 256, (g, W, H) => {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5ea8e6');
    sky.addColorStop(0.62, '#cfe7f6');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    const r = rand(9);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgb(${60 + r() * 30}, ${100 + r() * 35}, ${52 + r() * 20})`;
      g.beginPath();
      g.arc(r() * W, H * 0.66 + r() * 10, 12 + r() * 14, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#d6b48a'; // a yard wall
    g.fillRect(0, H * 0.74, W, H * 0.08);
    g.fillStyle = '#b98a5c';
    g.fillRect(0, H * 0.82, W, H * 0.18);
  });
}

/** Chalk dust on a charcoal board: faint wiped arcs, no words. */
function boardTexture() {
  return canvasTexture(256, 128, (g, W, H) => {
    g.fillStyle = '#2b3437';
    g.fillRect(0, 0, W, H);
    const r = rand(17);
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = `rgba(235,240,240,${0.04 + r() * 0.06})`;
      g.lineWidth = 6 + r() * 14;
      g.beginPath();
      const x = r() * W;
      const y = r() * H;
      g.arc(x, y, 20 + r() * 60, r() * 6, r() * 6 + 1.5);
      g.stroke();
    }
  });
}

/**
 * The physics room round the bench: the table's top at y = 0 runs from the wall (z = −1.1) to z = 1.5; the wall is
 * lime-washed ochre over a blue-grey dado, with a window, a poster of the planets, a clock and a blackboard.
 * @param {{ wood: THREE.Texture }} options  the bench's wood texture (its image is shared, not drawn again)
 */
export function createLab({ wood }) {
  const root = new THREE.Group();
  root.name = 'PhysicsRoom';
  root.userData.noExport = true;
  const WALL_Z = -1.1;
  const X0 = -7;
  const X1 = 9.5;
  const W = X1 - X0;
  const XC = (X0 + X1) / 2;
  const std = (name, color, map, roughness = 0.92, extra = {}) =>
    new THREE.MeshStandardMaterial({ name, color, map, roughness, metalness: 0, vertexColors: true, ...extra });

  // the wall: ochre plaster above, blue-grey dado below, a little lighter round the window's light, darker high up
  const plaster = grain(W / 1.6, 5.8 / 1.6);
  const wallLight = (x, y) =>
    THREE.MathUtils.clamp(1.06 - Math.hypot((x + 1.8) * 0.55, (y - 1.2) * 0.9) / 7 - Math.max(0, y - 2.4) * 0.05, 0.72, 1.06);
  const wall = merged('Wall', [plane(W, 5.2, XC, 0.55 + 2.6, WALL_Z)], std('Wall', 0xf3c46a, plaster), (x, y) => wallLight(x, y));
  const dado = merged(
    'Dado',
    [plane(W, 1.5, XC, -0.2, WALL_Z + 0.004)],
    std('Dado', 0x6f8ea3, grain(W / 1.2, 1.5 / 1.2)),
    (x, y) => wallLight(x, y) * (0.88 + 0.12 * (y + 0.95)),
  );
  root.add(wall, dado);

  // the wood: the table (top, front edge), the dado rail, window frame and bars, the poster's and board's frames,
  // the chalk tray. One mesh, the bench's wood darkened to teak by its colour.
  const teak = wood.clone();
  teak.repeat.set(1.2, 0.6);
  teak.wrapS = teak.wrapT = THREE.RepeatWrapping;
  const woodParts = [];
  woodParts.push(box(W, 0.06, 2.6, XC, -0.03, WALL_Z + 1.3)); // the table top, z from the wall to 1.5
  woodParts.push(box(W, 0.12, 0.04, XC, -0.12, WALL_Z + 2.58)); // the apron under its front edge
  woodParts.push(box(W, 0.05, 0.03, XC, 0.56, WALL_Z + 0.015)); // the dado rail
  // the window (left): frame, sill, three bars
  const win = { x: -1.8, y: 1.3, w: 1.2, h: 1.3 };
  const wz = WALL_Z + 0.03;
  woodParts.push(box(win.w + 0.16, 0.08, 0.06, win.x, win.y + win.h / 2 + 0.04, wz));
  woodParts.push(box(win.w + 0.24, 0.06, 0.14, win.x, win.y - win.h / 2 - 0.03, wz + 0.04));
  woodParts.push(box(0.08, win.h, 0.06, win.x - win.w / 2 - 0.04, win.y, wz), box(0.08, win.h, 0.06, win.x + win.w / 2 + 0.04, win.y, wz));
  woodParts.push(box(0.05, win.h, 0.04, win.x, win.y, wz));
  for (const dx of [-0.32, 0.32]) woodParts.push(box(0.022, win.h, 0.022, win.x + dx, win.y, wz + 0.02));
  woodParts.push(box(win.w, 0.04, 0.04, win.x, win.y + 0.25, wz));
  // the poster's frame (centre, high), the board's frame and chalk tray (right)
  const poster = { x: 1.0, y: 2.25, w: 1.25, h: 0.78 };
  const board = { x: 4.05, y: 1.3, w: 1.9, h: 1.05 };
  for (const p of [poster, board]) {
    const t = p === poster ? 0.035 : 0.06;
    woodParts.push(
      box(p.w + t * 2, t, 0.03, p.x, p.y + p.h / 2 + t / 2, WALL_Z + 0.02),
      box(p.w + t * 2, t, 0.03, p.x, p.y - p.h / 2 - t / 2, WALL_Z + 0.02),
    );
    woodParts.push(box(t, p.h, 0.03, p.x - p.w / 2 - t / 2, p.y, WALL_Z + 0.02), box(t, p.h, 0.03, p.x + p.w / 2 + t / 2, p.y, WALL_Z + 0.02));
  }
  woodParts.push(box(board.w, 0.03, 0.08, board.x, board.y - board.h / 2 - 0.075, WALL_Z + 0.05));
  const woodMesh = merged('Woodwork', woodParts, std('Teak', 0x8a5a3c, teak, 0.6), (_x, y, z) => (y < 0.01 && z > -1 ? 1 : 0.9));
  woodMesh.receiveShadow = true; // the bench's and the spheres' shadows on the table
  root.add(woodMesh);

  // the pictures on the wall: the window's view (made bright by its colour, so it shares a lit shader), the poster,
  // the board, the clock
  const pics = [
    ['WindowView', plane(win.w, win.h, win.x, win.y, wz - 0.005), viewTexture(), 1.55],
    ['Poster', plane(poster.w, poster.h, poster.x, poster.y, WALL_Z + 0.012), posterTexture(), 1],
    ['Blackboard', plane(board.w, board.h, board.x, board.y, WALL_Z + 0.012), boardTexture(), 1],
  ];
  for (const [name, geo, map, k] of pics) root.add(merged(name, [geo], std(name, 0xffffff, map, 0.85), () => k));
  const clock = new THREE.Mesh(
    new THREE.CircleGeometry(0.2, 40).translate(3.0, 2.25, WALL_Z + 0.03),
    std('Clock', 0xffffff, clockTexture(), 0.5, { vertexColors: false }),
  );
  clock.name = 'Clock';
  root.add(clock);

  // the floor beyond the table (seen only when the view is turned): red oxide
  const floor = merged(
    'Floor',
    [new THREE.PlaneGeometry(W, 14).rotateX(-Math.PI / 2).translate(XC, -0.82, WALL_Z + 7)],
    std('Floor', 0x93402f, grain(W / 0.9, 14 / 0.9), 0.5),
    (_x, _y, z) => 0.95 - Math.min(0.25, Math.abs(z) * 0.02),
  );
  root.add(floor);
  return root;
}

/** The night sky round the Earth: dim stars thick along a Milky Way band, and a few bright ones. */
export function createStars(radius = 60) {
  const root = new THREE.Group();
  root.name = 'Stars';
  root.userData.noExport = true;
  const map = canvasTexture(32, 32, (g) => {
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
  });
  map.colorSpace = THREE.NoColorSpace;
  const r = rand(23);
  const band = new THREE.Vector3(0.35, 0.8, -0.48).normalize();
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
      do v.set(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
      while (v.lengthSq() > 1 || v.lengthSq() < 0.01);
      v.normalize();
      if (r() < inBand) v.addScaledVector(band, -v.dot(band) * (0.75 + r() * 0.25)).normalize();
      pos.set([v.x * radius, v.y * radius, v.z * radius], i * 3);
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
    return pts;
  }
  root.add(cloud(1400, 3, 0.85, 0.55), cloud(140, 5, 1, 0.2));
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
