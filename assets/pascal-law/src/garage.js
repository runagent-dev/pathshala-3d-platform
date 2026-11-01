// The workshop round the lift: a deep teal back wall with an orange band, a pegboard of tools (spanners, a hammer,
// screwdrivers with red, yellow and blue handles), a red tool chest, a stack of tyres, a window of blue sky, warm
// lamps; a blue-grey epoxy floor with yellow safety lines. Painted on canvases (no image files), a handful of meshes.
// Metres; the floor is y = 0, the lift stands round x = 0, the wall is behind it at z = WALL_Z.
import * as THREE from 'three';

export const WALL_Z = -1.25;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function canvasTexture(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** The back wall: 8 m × 3.2 m, teal below, an orange band, cream above, a pegboard with tools and a window. */
function paintWall(g, W, H) {
  const px = W / 8; // pixels per metre
  const y = (m) => H - m * px; // metres above the floor → canvas y
  const r = rng(7);
  // cream plaster above, deep teal below, an orange band between
  g.fillStyle = '#f3e3c3';
  g.fillRect(0, 0, W, H);
  const teal = g.createLinearGradient(0, y(1.25), 0, H);
  teal.addColorStop(0, '#0f6f7c');
  teal.addColorStop(1, '#0a4f5a');
  g.fillStyle = teal;
  g.fillRect(0, y(1.25), W, H - y(1.25));
  g.fillStyle = '#f08c00';
  g.fillRect(0, y(1.36), W, px * 0.11);
  g.fillStyle = '#d9480f';
  g.fillRect(0, y(1.25) - 3, W, 6);
  // warm red bricks above the band
  const brickH = 0.075 * px;
  const brickW = 0.24 * px;
  g.fillStyle = '#e9d2b0'; // mortar
  g.fillRect(0, 0, W, y(1.36));
  for (let row = 0; row * brickH < y(1.36); row++)
    for (let k = -1; k * brickW < W; k++) {
      const v = r();
      const x0 = k * brickW + (row % 2 ? brickW / 2 : 0);
      g.fillStyle = `rgb(${178 + v * 40},${74 + v * 24},${46 + v * 16})`;
      g.fillRect(x0 + 2, y(1.36) - (row + 1) * brickH + 2, brickW - 4, brickH - 4);
    }
  // a window of blue sky with a palm far off (left)
  const wx = 4 * px - 3.3 * px;
  const wy = y(2.75);
  const ww = 1.25 * px;
  const wh = 0.95 * px;
  const sky = g.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, '#2f86e6');
  sky.addColorStop(1, '#9fd2fa');
  g.fillStyle = '#5a3b22';
  g.fillRect(wx - 10, wy - 10, ww + 20, wh + 20);
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
  // the pegboard (right of the middle) with tools
  const bx = 4 * px + 0.85 * px;
  const by = y(2.6);
  const bw = 2.3 * px;
  const bh = 1.0 * px;
  g.fillStyle = '#c98a4b';
  g.fillRect(bx, by, bw, bh);
  g.fillStyle = 'rgba(70,40,15,0.55)';
  for (let yy = by + 10; yy < by + bh; yy += 18) for (let xx = bx + 10; xx < bx + bw; xx += 18) g.fillRect(xx, yy, 3, 3);
  g.strokeStyle = '#7a4a1e';
  g.lineWidth = 6;
  g.strokeRect(bx, by, bw, bh);
  // spanners of growing size (chrome), screwdrivers, a hammer, pliers
  const steel = '#c9d0d8';
  for (let i = 0; i < 6; i++) {
    const sx = bx + 24 + i * 22;
    const len = bh * (0.42 + i * 0.06);
    g.fillStyle = steel;
    g.fillRect(sx, by + 20, 7, len);
    g.beginPath();
    g.arc(sx + 3.5, by + 20, 9 + i, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#c98a4b';
    g.fillRect(sx, by + 6, 7, 10);
  }
  const handles = ['#e8222c', '#ffc61a', '#1c6fd9', '#e8222c', '#2b8a3e'];
  handles.forEach((c, i) => {
    const sx = bx + 175 + i * 24;
    g.fillStyle = steel;
    g.fillRect(sx + 2, by + 60, 4, bh * 0.4);
    g.fillStyle = c;
    g.fillRect(sx - 2, by + 22, 12, 42);
  });
  // hammer
  g.fillStyle = '#8a5a2b';
  g.fillRect(bx + bw - 120, by + 30, 12, bh * 0.62);
  g.fillStyle = '#3d4450';
  g.fillRect(bx + bw - 140, by + 20, 52, 22);
  // pliers (red grips)
  g.fillStyle = '#e8222c';
  g.save();
  g.translate(bx + bw - 50, by + 40);
  g.rotate(0.12);
  g.fillRect(-10, 30, 7, bh * 0.45);
  g.rotate(-0.24);
  g.fillRect(6, 30, 7, bh * 0.45);
  g.restore();
  g.fillStyle = steel;
  g.fillRect(bx + bw - 56, by + 22, 14, 30);
  // a hanging coil of blue air hose (left of the board)
  g.strokeStyle = '#1c6fd9';
  g.lineWidth = 9;
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    g.ellipse(bx - 0.45 * px, by + 0.45 * px, 0.2 * px - k * 6, 0.32 * px - k * 6, 0, 0, Math.PI * 2);
    g.stroke();
  }
  // a safety poster: a yellow triangle (left, low on the teal)
  const tx = 4 * px - 2.6 * px;
  const ty = y(1.05);
  g.fillStyle = '#ffd21a';
  g.beginPath();
  g.moveTo(tx, ty);
  g.lineTo(tx + 0.25 * px, ty + 0.42 * px);
  g.lineTo(tx - 0.25 * px, ty + 0.42 * px);
  g.closePath();
  g.fill();
  g.fillStyle = '#17181c';
  g.fillRect(tx - 5, ty + 0.13 * px, 10, 0.16 * px);
  g.fillRect(tx - 5, ty + 0.32 * px, 10, 10);
  // a wall socket and a cable on the teal
  g.fillStyle = '#e9ecef';
  g.fillRect(4 * px + 2.6 * px, y(0.45), 46, 30);
}

/** The floor: blue-grey epoxy with a sheen and yellow safety lines round the lift. */
function paintFloor(g, W, H) {
  const r = rng(3);
  g.fillStyle = '#6f7d8c';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) {
    const v = (r() - 0.5) * 50;
    g.fillStyle = `rgba(${111 + v},${125 + v},${140 + v},0.45)`;
    g.fillRect(r() * W, r() * H, 2, 2);
  }
  // the canvas covers 8 m × 4 m: x −4…4, z −1.25…2.75; safety lines round the lift (x −1.05…1.5, z −0.75…0.75)
  const px = W / 8;
  const X = (m) => (m + 4) * px;
  const Z = (m) => (m + 1.25) * px;
  g.strokeStyle = '#ffd21a';
  g.lineWidth = 0.06 * px;
  g.strokeRect(X(-1.25), Z(-0.9), 2.95 * px, 1.85 * px);
  // tyre marks and a little oil stain
  g.fillStyle = 'rgba(40,40,45,0.18)';
  g.fillRect(X(-3.6), Z(0.6), 1.6 * px, 0.12 * px);
  g.fillRect(X(-3.6), Z(1.0), 1.6 * px, 0.12 * px);
  g.fillStyle = 'rgba(120,70,10,0.25)';
  g.beginPath();
  g.ellipse(X(2.2), Z(1.3), 0.25 * px, 0.12 * px, 0.3, 0, Math.PI * 2);
  g.fill();
}

/** The workshop. Returns { root }. */
export function createGarage() {
  const root = new THREE.Group();
  root.name = 'Workshop';
  root.userData.noExport = true;

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 3.2),
    new THREE.MeshStandardMaterial({ name: 'Wall', map: canvasTexture(2048, 820, paintWall), roughness: 0.92 }),
  );
  wall.position.set(0.2, 1.6, WALL_Z);
  wall.receiveShadow = true;
  root.add(wall);

  const floorTex = canvasTexture(2048, 1024, paintFloor);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 4).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'EpoxyFloor', map: floorTex, roughness: 0.38, metalness: 0.08 }),
  );
  floor.position.set(0.2, 0, WALL_Z + 2);
  floor.receiveShadow = true;
  root.add(floor);
  // a skirting of orange where the wall meets the floor
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 0.02), new THREE.MeshStandardMaterial({ color: '#d9480f', roughness: 0.6 }));
  skirt.position.set(0.2, 0.04, WALL_Z + 0.01);
  root.add(skirt);

  // a red tool chest (right)
  const red = new THREE.MeshStandardMaterial({ name: 'ChestPaint', color: '#d7191f', metalness: 0.35, roughness: 0.35 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#e9ecef', metalness: 1, roughness: 0.15 });
  const chest = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.95, 0.45), red);
  body.position.y = 0.53;
  body.castShadow = true;
  chest.add(body);
  for (let i = 0; i < 5; i++) {
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.02), chrome);
    pull.position.set(0, 0.2 + i * 0.17, 0.235);
    const gap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.006, 0.005), new THREE.MeshBasicMaterial({ color: '#7a0d10' }));
    gap.position.set(0, 0.12 + i * 0.17, 0.227);
    chest.add(pull, gap);
  }
  for (const sx of [-0.3, 0.3]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.03, 14).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#222' }),
    );
    wheel.position.set(sx, 0.04, 0.15);
    chest.add(wheel);
  }
  chest.position.set(2.15, 0, WALL_Z + 0.3);
  root.add(chest);

  // a stack of tyres (left)
  const tyreMat = new THREE.MeshStandardMaterial({ name: 'Tyre', color: '#1d1e22', roughness: 0.85 });
  const tyreGeo = new THREE.TorusGeometry(0.22, 0.09, 12, 28).rotateX(Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(tyreGeo, tyreMat);
    t.position.set(-1.75 + (i % 2) * 0.02, 0.09 + i * 0.17, WALL_Z + 0.45);
    t.castShadow = true;
    root.add(t);
  }
  // an oil drum (amber stripe, the lift's oil), back left
  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.75, 28),
    new THREE.MeshStandardMaterial({ name: 'Drum', color: '#1c6fd9', metalness: 0.4, roughness: 0.4 }),
  );
  drum.position.set(-2.35, 0.375, WALL_Z + 0.35);
  drum.castShadow = true;
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.243, 0.243, 0.14, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: '#f59f00', roughness: 0.5 }),
  );
  band.position.copy(drum.position);
  root.add(drum, band);

  // warm lamps under the ceiling (glowing discs)
  const lampMat = new THREE.MeshBasicMaterial({ color: '#fff3d0', toneMapped: false });
  for (const x of [-1.6, 0.4, 2.4]) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.06, 24), lampMat);
    lamp.position.set(x, 3.05, WALL_Z + 0.6);
    root.add(lamp);
  }
  return { root };
}
