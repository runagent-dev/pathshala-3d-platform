// The small canvas pictures that give the setting its surfaces (made here, once, no image files): the sky over the
// street, the bus's plank floor and its laminate lining, the asphalt, the brick footpaths, and for the coin trick a
// wooden table top and a plastered wall. Each is 256 px or smaller and repeats; seeded, so every load looks the same.
import * as THREE from 'three';

/** A small seeded random generator (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Fine specks over a filled canvas (grain, grit). */
function specks(g, w, h, rnd, n, colors, size = 1.5) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[i % colors.length];
    g.fillRect(rnd() * w, rnd() * h, size, size);
  }
}

/** A late-morning sky: deep blue overhead, paler and warmer at the horizon, a few soft clouds. */
export function skyTexture() {
  const tex = canvas(256, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#3d7cc2');
    grad.addColorStop(0.5, '#7fb1df');
    grad.addColorStop(0.85, '#cfe0ec');
    grad.addColorStop(1, '#efdcbc');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    const rnd = rng(17);
    for (let i = 0; i < 6; i++) {
      const x = rnd() * w;
      const y = 26 + rnd() * 80;
      for (let k = 0; k < 6; k++) {
        const r = 10 + rnd() * 16;
        const cx = x + (rnd() - 0.5) * 50;
        const cy = y + (rnd() - 0.5) * 8;
        const cg = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        cg.addColorStop(0, 'rgba(255,255,255,0.55)');
        cg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = cg;
        g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      }
    }
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** The bus floor: worn wooden planks along the bus, 1 m × 1 m per repeat (u along the bus, v across it). */
export function plankTexture() {
  return canvas(256, 256, (g, w, h) => {
    const rnd = rng(5);
    const rows = 8; // planks 12.5 cm wide
    const tones = ['#8a6243', '#94694a', '#7f5a3d', '#9a7150', '#86603f'];
    for (let r = 0; r < rows; r++) {
      const y0 = (r * h) / rows;
      let x = -rnd() * 120;
      while (x < w) {
        const len = 110 + rnd() * 120;
        g.fillStyle = tones[Math.floor(rnd() * tones.length)];
        g.fillRect(x, y0, len, h / rows);
        // grain: thin darker streaks along the plank
        g.strokeStyle = 'rgba(60, 38, 22, 0.18)';
        g.lineWidth = 1;
        for (let k = 0; k < 4; k++) {
          const yy = y0 + 3 + rnd() * (h / rows - 6);
          g.beginPath();
          g.moveTo(x, yy);
          g.bezierCurveTo(x + len * 0.3, yy + (rnd() - 0.5) * 4, x + len * 0.7, yy + (rnd() - 0.5) * 4, x + len, yy);
          g.stroke();
        }
        g.fillStyle = 'rgba(40, 26, 15, 0.55)';
        g.fillRect(x, y0, 2, h / rows); // the end joint
        x += len;
      }
      g.fillStyle = 'rgba(40, 26, 15, 0.6)';
      g.fillRect(0, y0, w, 2); // the gap between planks
    }
    specks(g, w, h, rnd, 500, ['rgba(255,240,220,0.08)', 'rgba(30,20,10,0.12)']);
  });
}

/**
 * The lining under the windows: powder-blue laminate panels with seams and rivets, a darker kick band at the
 * bottom and a cream rail at the top. u: 1.2 m along the bus per repeat; v: the whole lining height (floor to sill).
 */
export function liningTexture() {
  return canvas(256, 128, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#b4cad9');
    grad.addColorStop(1, '#9db7c9');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    const rnd = rng(9);
    specks(g, w, h, rnd, 300, ['rgba(255,255,255,0.1)', 'rgba(40,70,95,0.07)']);
    g.fillStyle = '#f0e4c4'; // the rail at the top (canvas top = the sill)
    g.fillRect(0, 0, w, 7);
    g.fillStyle = 'rgba(80, 60, 30, 0.35)';
    g.fillRect(0, 7, w, 1.5);
    g.fillStyle = '#4e6a80'; // the kick band at the bottom
    g.fillRect(0, h - 22, w, 22);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.fillRect(0, h - 22, w, 1.5);
    for (const x of [0, w / 2]) {
      g.fillStyle = 'rgba(45, 70, 90, 0.45)';
      g.fillRect(x, 8, 2, h - 30); // the seam between two panels
      g.fillStyle = 'rgba(60, 80, 100, 0.5)';
      for (let y = 18; y < h - 26; y += 22) {
        g.beginPath();
        g.arc(x + 7, y, 1.6, 0, Math.PI * 2);
        g.arc(x + w / 2 - 6, y, 1.6, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
}

/** Dhaka asphalt: dark grey with grit and a few lighter worn streaks, 4 m × 4 m per repeat. */
export function asphaltTexture() {
  return canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#5b5f64';
    g.fillRect(0, 0, w, h);
    const rnd = rng(23);
    for (let i = 0; i < 26; i++) {
      const r = 18 + rnd() * 40;
      const x = rnd() * w;
      const y = rnd() * h;
      const cg = g.createRadialGradient(x, y, 0, x, y, r);
      const light = rnd() > 0.5;
      cg.addColorStop(0, light ? 'rgba(150,150,150,0.12)' : 'rgba(25,28,32,0.14)');
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = cg;
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) g.fillRect(x - r + dx, y - r + dy, 2 * r, 2 * r);
    }
    specks(g, w, h, rnd, 2600, ['rgba(200,200,200,0.22)', 'rgba(20,20,22,0.3)', 'rgba(140,130,120,0.2)'], 1.3);
  });
}
