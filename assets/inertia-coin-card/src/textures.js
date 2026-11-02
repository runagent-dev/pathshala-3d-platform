// The small canvas pictures that give the setting its surfaces (made here, once, no image files): a wooden table
// top, a plastered wall and a ruled index card. Each is 256 px or smaller; seeded, so every load looks the same.
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

/** A wooden table top: warm brown boards with grain, 0.5 m × 0.5 m per repeat. */
export function tableTexture() {
  return canvas(256, 256, (g, w, h) => {
    const rnd = rng(41);
    const boards = 3;
    const tones = ['#9b6a43', '#a87449', '#93633e'];
    for (let b = 0; b < boards; b++) {
      const y0 = (b * h) / boards;
      g.fillStyle = tones[b % tones.length];
      g.fillRect(0, y0, w, h / boards);
      for (let k = 0; k < 16; k++) {
        const yy = y0 + rnd() * (h / boards);
        g.strokeStyle = rnd() > 0.5 ? 'rgba(70, 40, 20, 0.2)' : 'rgba(255, 220, 180, 0.1)';
        g.lineWidth = 1 + rnd() * 1.5;
        g.beginPath();
        g.moveTo(0, yy);
        for (let x = 0; x <= w; x += 32) g.lineTo(x, yy + Math.sin(x / 40 + k) * 2.5);
        g.stroke();
      }
      g.fillStyle = 'rgba(45, 25, 12, 0.6)';
      g.fillRect(0, y0, w, 2);
    }
  });
}

/** A plastered wall in warm ochre, with a soft mottle: the room behind the table. */
export function wallTexture() {
  return canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#d9a86c';
    g.fillRect(0, 0, w, h);
    const rnd = rng(47);
    for (let i = 0; i < 40; i++) {
      const r = 16 + rnd() * 36;
      const x = rnd() * w;
      const y = rnd() * h;
      const cg = g.createRadialGradient(x, y, 0, x, y, r);
      cg.addColorStop(0, rnd() > 0.5 ? 'rgba(255,235,200,0.12)' : 'rgba(120,70,30,0.1)');
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = cg;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  });
}

/** A ruled index card: cream stock, a red header line and pale blue rules (one card, no repeat). */
export function cardTexture() {
  const tex = canvas(256, 168, (g, w, h) => {
    g.fillStyle = '#f7ecc8';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70, 120, 200, 0.55)';
    g.lineWidth = 1.5;
    for (let y = 52; y < h - 6; y += 18) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    g.strokeStyle = 'rgba(210, 60, 60, 0.75)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 34);
    g.lineTo(w, 34);
    g.stroke();
    g.strokeStyle = 'rgba(120, 95, 50, 0.35)';
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, w - 3, h - 3);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
