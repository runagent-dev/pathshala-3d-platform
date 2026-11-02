// Where the crate is pushed: a railway station platform on a clear morning, where porters push crates and trolleys
// and travellers pull suitcases on wheels (the page's own example). Behind the platform the station building's wall:
// a maroon dado with a cream moulding and a powder-blue lime-washed wall above, and nothing else (only the main
// objects).
// Warm greys, maroon and a soft blue, so the orange push, the red friction and the light blue velocity arrows all
// stand out, and the golden crate and orange shirt read clearly. Nothing white and nothing green.
//
// Everything is still, one textured wall that casts no shadow and repeats every 6 m along x, so the test's long steady slide,
// which jumps back 6 m, is seamless.
import * as THREE from 'three';

export const WALL = { z: -2.6, h: 3.7, x0: -12, x1: 18, bay: 3, dado: 1.05 };

function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function canvasTexture(w, h, draw, { repeatX = 1, repeatY = 1, anisotropy = 8 } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  return tex;
}

function blotches(g, w, y0, h, rnd, n, rgb, alpha, rMin, rMax) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = y0 + rnd() * h;
    const r = rMin + rnd() * (rMax - rMin);
    const a = alpha * (0.4 + rnd() * 0.6);
    // the copies one picture to each side only where the blotch crosses the edge, so the wall repeats seamlessly
    for (const dx of [-w, 0, w]) {
      if ((dx < 0 && x + r < w) || (dx > 0 && x - r > 0)) continue;
      const grad = g.createRadialGradient(x + dx, y, 0, x + dx, y, r);
      grad.addColorStop(0, `rgba(${rgb},${a})`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = grad;
      g.fillRect(x + dx - r, Math.max(y0, y - r), 2 * r, Math.min(2 * r, y0 + h - Math.max(y0, y - r)));
    }
  }
}

/** The wall's face, one bay (3 m) wide and the wall high: skirting, maroon dado, cream moulding, powder-blue wall. */
function wallTexture(anisotropy) {
  return canvasTexture(
    512,
    512,
    (g, w, h) => {
      const rnd = rng(17);
      const y = (m) => h * (1 - m / WALL.h); // metres above the platform → canvas row
      // the upper wall: powder-blue lime-wash with its clouding and rain streaks under the cornice
      g.fillStyle = '#86a9bd';
      g.fillRect(0, 0, w, y(WALL.dado));
      blotches(g, w, 0, y(WALL.dado), rnd, 40, '160,190,206', 0.45, 12, 46);
      blotches(g, w, 0, y(WALL.dado), rnd, 26, '96,128,148', 0.3, 10, 40);
      for (let i = 0; i < 22; i++) {
        const x = rnd() * w;
        const grad = g.createLinearGradient(0, y(3.55), 0, y(3.55) + 30 + rnd() * 60);
        grad.addColorStop(0, 'rgba(70,90,104,0.3)');
        grad.addColorStop(1, 'rgba(70,90,104,0)');
        g.fillStyle = grad;
        g.fillRect(x, y(3.55), 2 + rnd() * 3, 90);
      }
      // the cornice
      g.fillStyle = '#d8c7a4';
      g.fillRect(0, 0, w, y(3.52));
      g.fillStyle = '#9f8d6c';
      g.fillRect(0, y(3.52) - 3, w, 3);
      // the dado: maroon gloss paint, scuffed
      g.fillStyle = '#7a2b26';
      g.fillRect(0, y(WALL.dado), w, h - y(WALL.dado));
      blotches(g, w, y(WALL.dado), h - y(WALL.dado), rnd, 30, '140,62,52', 0.4, 8, 30);
      blotches(g, w, y(WALL.dado), h - y(WALL.dado), rnd, 18, '70,24,22', 0.35, 8, 26);
      // a cream moulding on top of the dado
      g.fillStyle = '#e1cfa6';
      g.fillRect(0, y(WALL.dado + 0.035), w, y(WALL.dado - 0.02) - y(WALL.dado + 0.035));
      g.fillStyle = '#a28d64';
      g.fillRect(0, y(WALL.dado - 0.02), w, 2);
      // the skirting: dark slate
      g.fillStyle = '#39424b';
      g.fillRect(0, y(0.13), w, h - y(0.13));
      g.fillStyle = '#59636c';
      g.fillRect(0, y(0.13), w, 2);
    },
    { repeatX: (WALL.x1 - WALL.x0) / WALL.bay, anisotropy: Math.min(2, anisotropy) },
  );
}

/** The morning sky behind everything (seen over the wall in the turned view). */
export function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#3f7fc4');
  grad.addColorStop(0.6, '#8fbde4');
  grad.addColorStop(1, '#efd9b4');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSetting({ anisotropy = 8 } = {}) {
  const root = new THREE.Group();
  root.name = 'StationPlatform';
  root.userData.noExport = true;
  const len = WALL.x1 - WALL.x0;

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(len, WALL.h),
    new THREE.MeshStandardMaterial({ name: 'StationWall', map: wallTexture(anisotropy), roughness: 0.9, metalness: 0 }),
  );
  wall.position.set((WALL.x0 + WALL.x1) / 2, WALL.h / 2, WALL.z);
  wall.name = 'StationWall';
  root.add(wall);

  // the parts, in plain colours (merged below into one vertex-coloured mesh)
  // nothing in front of the wall or on it (the owner: only the main objects): no windows, doors, columns, notice
  // boards, lamps or suitcases
  return { root };
}
