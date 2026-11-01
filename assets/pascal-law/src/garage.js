// The workshop round the lift: a red brick wall over a deep teal dado with an orange band, a pegboard of tools
// (spanners, a hammer, screwdrivers with red, yellow and blue handles, pliers), a coil of blue air hose, a window of
// blue sky, a safety sign; a red tool chest, a stack of tyres, a blue oil drum, warm lamps; a blue-grey epoxy floor
// with yellow safety lines. No image files: the bricks and the floor's grain are small tiling canvases (sharper than
// one big painted wall, a tenth of the memory), the pegboard and the window share one 1024 × 256 canvas, and the plain
// coloured parts share one vertex-coloured material. Merged at the end: about ten draw calls. The props get soft
// contact shadows of their own, so the sun's shadow map only has to cover the lift.
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
const BRICK0 = 1.36; // the bricks start above the orange band

/** One tile of the brick wall: 2.4 m × 0.6 m (10 bricks × 8 rows), warm reds with a little grime, on mortar. */
function paintBricks(g, W, H) {
  const r = rng(7);
  const px = W / 2.4;
  const bh = 0.075 * px;
  const bw = 0.24 * px;
  g.fillStyle = '#e9d2b0';
  g.fillRect(0, 0, W, H);
  for (let row = 0; row < 8; row++)
    for (let k = -1; k <= 10; k++) {
      const v = r();
      const x0 = k * bw + (row % 2 ? bw / 2 : 0);
      const y0 = H - (row + 1) * bh;
      g.fillStyle = `rgb(${178 + v * 40},${74 + v * 24},${46 + v * 16})`;
      g.fillRect(x0 + 2, y0 + 2, bw - 4, bh - 4);
      // a darker lower edge and a few pits, so the bricks read as bricks up close
      g.fillStyle = 'rgba(70,20,10,0.18)';
      g.fillRect(x0 + 2, y0 + bh - 6, bw - 4, 4);
      g.fillStyle = 'rgba(60,20,10,0.22)';
      for (let i = 0; i < 4; i++) g.fillRect(x0 + 4 + r() * (bw - 10), y0 + 4 + r() * (bh - 10), 2, 2);
    }
}

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

/**
 * The pegboard with its tools (left, 576 × 256 px for 2.4 m × 1.07 m) and the window of blue sky with a far cloud
 * (right, 320 × 256 px for 1.33 m × 1.07 m incl. their frames): one canvas, two planes on the wall.
 */
function paintDecals(g) {
  const px = 240; // pixels per metre
  // the pegboard: 2.3 m × 1.0 m inside a 5 cm frame
  const bx = 0.05 * px;
  const by = 0.035 * px;
  const bw = 2.3 * px;
  const bh = 1.0 * px;
  g.fillStyle = '#7a4a1e';
  g.fillRect(0, 0, 576, 256);
  g.fillStyle = '#c98a4b';
  g.fillRect(bx, by, bw, bh);
  g.fillStyle = 'rgba(70,40,15,0.55)';
  for (let yy = by + 8; yy < by + bh - 2; yy += 14) for (let xx = bx + 8; xx < bx + bw - 2; xx += 14) g.fillRect(xx, yy, 3, 3);
  const steel = '#c9d0d8';
  for (let i = 0; i < 6; i++) {
    const sx = bx + 22 + i * 21;
    const len = bh * (0.42 + i * 0.06);
    g.fillStyle = steel;
    g.fillRect(sx, by + 19, 7, len);
    g.beginPath();
    g.arc(sx + 3.5, by + 19, 8 + i, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#c98a4b';
    g.fillRect(sx, by + 6, 7, 9);
  }
  const handles = ['#e8222c', '#ffc61a', '#1c6fd9', '#e8222c', '#2b8a3e'];
  handles.forEach((c, i) => {
    const sx = bx + 165 + i * 23;
    g.fillStyle = steel;
    g.fillRect(sx + 2, by + 58, 4, bh * 0.4);
    g.fillStyle = c;
    g.fillRect(sx - 2, by + 21, 12, 40);
  });
  g.fillStyle = '#8a5a2b';
  g.fillRect(bx + bw - 115, by + 29, 12, bh * 0.62);
  g.fillStyle = '#3d4450';
  g.fillRect(bx + bw - 134, by + 19, 50, 21);
  g.fillStyle = '#e8222c';
  g.save();
  g.translate(bx + bw - 48, by + 38);
  g.rotate(0.12);
  g.fillRect(-10, 29, 7, bh * 0.45);
  g.rotate(-0.24);
  g.fillRect(6, 29, 7, bh * 0.45);
  g.restore();
  g.fillStyle = steel;
  g.fillRect(bx + bw - 54, by + 21, 14, 29);
  // the window: 1.25 m × 0.95 m of sky inside a 4 cm wooden frame, with a cross bar
  const ox = 576;
  const wx = ox + 0.04 * px;
  const wy = 0.06 * px;
  const ww = 1.25 * px;
  const wh = 0.95 * px;
  g.fillStyle = '#5a3b22';
  g.fillRect(ox, 0, 320, 256);
  const sky = g.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, '#2f86e6');
  sky.addColorStop(1, '#9fd2fa');
  g.fillStyle = sky;
  g.fillRect(wx, wy, ww, wh);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.beginPath();
  g.ellipse(wx + ww * 0.3, wy + wh * 0.3, ww * 0.16, wh * 0.07, 0, 0, Math.PI * 2);
  g.ellipse(wx + ww * 0.42, wy + wh * 0.27, ww * 0.12, wh * 0.08, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#5a3b22';
  g.fillRect(wx + ww / 2 - 4, wy, 8, wh);
  g.fillRect(wx, wy + wh / 2 - 4, ww, 8);
}

/** A plane's UVs set to a rectangle of the decal canvas (1024 × 256 px). */
function decalPlane(w, h, x0, x1) {
  const geo = new THREE.PlaneGeometry(w, h);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) ? x1 : x0) / 1024);
  return geo;
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

/** A soft round shadow (black, alpha falling off from the middle) for the props' contact shadows. */
function blobTexture() {
  return canvasTexture(64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
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

  // the wall: bricks above the band (a tiling texture), the teal dado, the orange band and its red line, the skirting
  const brickH = 3.2 - BRICK0;
  const bricks = canvasTexture(1024, 256, paintBricks, { repeat: [8 / 2.4, brickH / 0.6] });
  add(
    new THREE.PlaneGeometry(8, brickH),
    new THREE.MeshStandardMaterial({ name: 'BrickWall', map: bricks, roughness: 0.92 }),
    WX,
    BRICK0 + brickH / 2,
    WALL_Z,
    {
      receive: true,
    },
  );
  add(gradientPlane(8, BAND, '#0a4f5a', '#0f6f7c'), paint, WX, BAND / 2, WALL_Z, { receive: true });
  add(painted(new THREE.PlaneGeometry(8, 0.024), '#d9480f'), paint, WX, BAND, WALL_Z + 0.001, { receive: true });
  add(painted(new THREE.PlaneGeometry(8, BRICK0 - BAND - 0.012), '#f08c00'), paint, WX, (BAND + 0.012 + BRICK0) / 2, WALL_Z, { receive: true });
  add(painted(new THREE.BoxGeometry(8, 0.08, 0.02), '#d9480f'), paint, WX, 0.04, WALL_Z + 0.01, { receive: true });
  // the pegboard and the window (one canvas), a little in front of the bricks
  const decal = new THREE.MeshStandardMaterial({ name: 'WallDecals', map: canvasTexture(1024, 256, paintDecals), roughness: 0.85 });
  add(decalPlane(2.4, 1.07, 0, 576), decal, 2.2, 2.1, WALL_Z + 0.008, { receive: true });
  add(decalPlane(1.33, 1.07, 576, 896), decal, -3.3 + 0.625 + 0.2, 2.275, WALL_Z + 0.008, { receive: true });
  // a coil of blue air hose left of the pegboard (three loops)
  for (let k = 0; k < 3; k++) {
    const loop = new THREE.TorusGeometry(0.2 - k * 0.022, 0.018, 8, 40).scale(1, 1.6, 0.6);
    add(painted(loop, '#1c6fd9'), paint, 0.6 + k * 0.012, 2.15 - k * 0.02, WALL_Z + 0.05 + k * 0.012);
  }
  // a yellow warning sign low on the teal (left), and a wall socket (right)
  const sign = new THREE.Shape([new THREE.Vector2(0, 0.42), new THREE.Vector2(0.25, 0), new THREE.Vector2(-0.25, 0)]);
  add(painted(new THREE.ShapeGeometry(sign), '#ffd21a'), paint, -2.4, 0.63, WALL_Z + 0.004);
  add(painted(new THREE.PlaneGeometry(0.04, 0.16), '#17181c'), paint, -2.4, 0.84, WALL_Z + 0.006);
  add(painted(new THREE.PlaneGeometry(0.04, 0.04), '#17181c'), paint, -2.4, 0.71, WALL_Z + 0.006);
  add(painted(new THREE.BoxGeometry(0.18, 0.12, 0.02), '#e9ecef'), paint, 2.8, 0.39, WALL_Z + 0.01);

  // the floor: the grain tiles every metre; the yellow safety lines, the tyre marks and an oil stain on it
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
  flat(1.6, 0.12, '#646f7c', -2.8, 0.66, 0.001);
  flat(1.6, 0.12, '#646f7c', -2.8, 1.06, 0.001);
  add(
    painted(
      new THREE.CircleGeometry(0.25, 24)
        .rotateX(-Math.PI / 2)
        .scale(1, 1, 0.48)
        .rotateY(-0.3),
      '#6f6e64',
    ),
    paint,
    2.2,
    0.001,
    1.3,
    {
      receive: true,
    },
  );

  // a red tool chest (right): drawers with chrome pulls and dark gaps, on castors
  const red = new THREE.MeshStandardMaterial({ name: 'ChestPaint', color: '#d7191f', metalness: 0.35, roughness: 0.35 });
  const chrome = new THREE.MeshStandardMaterial({ name: 'ChestChrome', color: '#e9ecef', metalness: 1, roughness: 0.15 });
  const CX = 2.15;
  const CZ = WALL_Z + 0.3;
  add(new THREE.BoxGeometry(0.75, 0.95, 0.45), red, CX, 0.53, CZ);
  for (let i = 0; i < 5; i++) {
    add(new THREE.BoxGeometry(0.5, 0.02, 0.02), chrome, CX, 0.2 + i * 0.17, CZ + 0.235);
    add(painted(new THREE.BoxGeometry(0.72, 0.006, 0.005), '#7a0d10'), paint, CX, 0.12 + i * 0.17, CZ + 0.227);
  }
  for (const sx of [-0.3, 0.3])
    add(painted(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 14).rotateX(Math.PI / 2), '#222222'), paint, CX + sx, 0.04, CZ + 0.15);

  // a stack of tyres (left)
  const tyreMat = new THREE.MeshStandardMaterial({ name: 'Tyre', color: '#1d1e22', roughness: 0.85 });
  const tyreGeo = new THREE.TorusGeometry(0.22, 0.09, 12, 28).rotateX(Math.PI / 2);
  for (let i = 0; i < 4; i++) add(tyreGeo, tyreMat, -1.75 + (i % 2) * 0.02, 0.09 + i * 0.17, WALL_Z + 0.45);
  // a blue oil drum with an amber band (the lift's oil), back left
  const drumAt = new THREE.Vector3(-2.35, 0.375, WALL_Z + 0.35);
  add(
    new THREE.CylinderGeometry(0.24, 0.24, 0.75, 28),
    new THREE.MeshStandardMaterial({ name: 'Drum', color: '#1c6fd9', metalness: 0.4, roughness: 0.4 }),
    drumAt.x,
    drumAt.y,
    drumAt.z,
  );
  add(painted(new THREE.CylinderGeometry(0.243, 0.243, 0.14, 28, 1, true), '#f59f00'), paint, drumAt.x, drumAt.y, drumAt.z);

  // soft contact shadows under the props (the sun's shadow map covers only the lift)
  const blob = new THREE.MeshBasicMaterial({ name: 'ContactShadows', map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false });
  const shadow = (w, d, x, z) => {
    const m = add(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), blob, x, 0.003, z);
    m.renderOrder = -1;
  };
  shadow(0.75, 0.5, -1.7, WALL_Z + 0.5);
  shadow(1.0, 0.62, CX + 0.06, CZ + 0.02);
  shadow(0.62, 0.62, drumAt.x + 0.05, drumAt.z + 0.03);

  // warm lamps under the ceiling (glowing discs)
  const lampMat = new THREE.MeshBasicMaterial({ name: 'Lamps', color: '#fff3d0', toneMapped: false });
  for (const x of [-1.6, 0.4, 2.4]) add(new THREE.CylinderGeometry(0.22, 0.28, 0.06, 24), lampMat, x, 3.05, WALL_Z + 0.6);

  mergeStatic(root);
  return { root };
}
