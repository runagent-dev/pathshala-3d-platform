// The wall's plaster and the bulb's glow, drawn on canvases (no image files), from a seeded random, so the same commit
// always draws the same pixels.
import * as THREE from 'three';

const seeded = (s) => () => {
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
};

/**
 * @param {number} w
 * @param {number} h
 * @param {(ctx: CanvasRenderingContext2D, w: number, h: number) => void} draw
 */
export function canvasTexture(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function speckle(ctx, w, h, rand, n, light, dark, size = 1.5) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rand() < 0.5 ? light : dark;
    ctx.fillRect(rand() * w, rand() * h, size, size);
  }
}

/** A streak running down from (x, y): dirt washed down by the rain, fading out. */
function streak(ctx, x, y, len, width, alpha, color = '70,55,35') {
  const g = ctx.createLinearGradient(0, y, 0, y + len);
  g.addColorStop(0, `rgba(${color},${alpha})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - width / 2, y, width, len);
}

/** Plain painted plaster (the side walls, the stair room): a mottle and grain on a colour. */
export function plasterTexture(color, seed = 9) {
  return canvasTexture(256, 256, (ctx, w) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, w);
    const rand = seeded(seed);
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(120,70,0,0.05)';
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * w, 8 + rand() * 26, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let x = 5; x < w; x += 20 + rand() * 40) streak(ctx, x, 0, 20 + rand() * 60, 2 + rand() * 4, 0.06);
    speckle(ctx, w, w, rand, 1500, 'rgba(255,255,255,0.12)', 'rgba(80,50,0,0.06)');
  });
}
