// The scene's painted surfaces, drawn on canvases (no image files): the front wall with its weathering, bricks, cement,
// earth, the windows with curtains behind the glass, the door, the neighbours' façades, palm fronds, clouds. Every
// pattern comes from a seeded random, so the same commit always draws the same pixels.
import * as THREE from 'three';

export const seeded = (s) => () => {
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

/** Red bricks laid in a herringbone, worn and dusty, one 1.2 m square repeat. */
export function brickTexture() {
  return canvasTexture(512, 512, (ctx, w) => {
    ctx.fillStyle = '#9b7a63'; // the mortar
    ctx.fillRect(0, 0, w, w);
    const rand = seeded(5);
    const u = w / 12; // a brick is 2u × 1u
    for (let i = -14; i < 26; i++)
      for (let j = -14; j < 26; j++) {
        const x = (i + j) * u;
        const y = (j - i) * u;
        for (const [bx, by, bw, bh] of [
          [x, y, 2 * u, u],
          [x + u, y + u, u, 2 * u],
        ]) {
          if (bx > w || by > w || bx + bw < 0 || by + bh < 0) continue;
          const r = 160 + Math.floor(rand() * 46);
          const g = 70 + Math.floor(rand() * 30);
          const b = 44 + Math.floor(rand() * 20);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
          ctx.fillStyle = 'rgba(255,225,190,0.10)'; // the worn top edge
          ctx.fillRect(bx + 3, by + 3, bw - 6, 3);
          ctx.fillStyle = 'rgba(40,15,5,0.12)';
          ctx.fillRect(bx + 3, by + bh - 6, bw - 6, 3);
          if (rand() < 0.12) {
            ctx.fillStyle = 'rgba(60,25,10,0.25)'; // a chipped corner
            ctx.beginPath();
            ctx.arc(bx + 2 + rand() * (bw - 4), by + 2 + rand() * (bh - 4), 2 + rand() * 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    speckle(ctx, w, w, rand, 2600, 'rgba(255,240,220,0.10)', 'rgba(0,0,0,0.10)', 2);
    for (let i = 0; i < 10; i++) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
      g.addColorStop(0, 'rgba(210,190,160,0.16)'); // dust
      g.addColorStop(1, 'rgba(210,190,160,0)');
      ctx.save();
      ctx.translate(rand() * w, rand() * w);
      ctx.fillStyle = g;
      ctx.fillRect(-60, -60, 120, 120);
      ctx.restore();
    }
  });
}

/** Bricks in English bond (a course of headers, a course of stretchers), for the boundary walls. */
export function wallBrickTexture() {
  return canvasTexture(256, 256, (ctx, w) => {
    ctx.fillStyle = '#b9aa95';
    ctx.fillRect(0, 0, w, w);
    const rand = seeded(61);
    const ch = w / 16; // a course is 1/16 of the repeat (the repeat is 1.2 m tall)
    for (let row = 0; row < 16; row++) {
      const headers = row % 2 === 0;
      const bw = headers ? w / 12 : w / 6;
      const off = headers ? (row % 4 === 0 ? 0 : bw / 2) : 0;
      for (let x = -bw + off; x < w; x += bw) {
        const r = 150 + Math.floor(rand() * 45);
        ctx.fillStyle = `rgb(${r},${62 + Math.floor(rand() * 25)},${40 + Math.floor(rand() * 18)})`;
        ctx.fillRect(x + 1.5, row * ch + 1.5, bw - 3, ch - 3);
      }
    }
    speckle(ctx, w, w, rand, 900, 'rgba(255,240,220,0.12)', 'rgba(0,0,0,0.12)');
  });
}

/** Cement (the roof, the apron along the wall, platforms): grey with water stains. */
export function cementTexture(color = '#cbc5ba', seed = 3) {
  return canvasTexture(256, 256, (ctx, w) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, w);
    const rand = seeded(seed);
    for (let i = 0; i < 26; i++) {
      const x = rand() * w;
      const y = rand() * w;
      const r = 10 + rand() * 40;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const dark = rand() < 0.6;
      g.addColorStop(0, dark ? 'rgba(70,65,55,0.12)' : 'rgba(255,255,255,0.12)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    speckle(ctx, w, w, rand, 2200, 'rgba(255,255,255,0.18)', 'rgba(0,0,0,0.12)');
    ctx.strokeStyle = 'rgba(60,55,45,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      let x = rand() * w;
      let y = rand() * w;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) ctx.lineTo((x += (rand() - 0.5) * 30), (y += 8 + rand() * 12));
      ctx.stroke();
    }
  });
}

/** Bare earth beyond the courtyard: dusty brown, a few dry tufts, a footpath's paler sand. */
export function earthTexture() {
  return canvasTexture(256, 256, (ctx, w) => {
    ctx.fillStyle = '#b79c74';
    ctx.fillRect(0, 0, w, w);
    const rand = seeded(13);
    for (let i = 0; i < 40; i++) {
      const x = rand() * w;
      const y = rand() * w;
      const r = 12 + rand() * 30;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rand() < 0.5 ? 'rgba(120,90,55,0.25)' : 'rgba(225,205,165,0.25)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    speckle(ctx, w, w, rand, 3000, 'rgba(240,225,190,0.25)', 'rgba(70,50,30,0.2)');
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(130,125,60,0.5)' : 'rgba(160,140,80,0.5)'; // dry grass
      const x = rand() * w;
      const y = rand() * w;
      for (let k = 0; k < 4; k++) ctx.fillRect(x + k * 1.5, y - rand() * 4, 1, 3 + rand() * 3);
    }
  });
}

/**
 * The house's front wall in one piece (no repeat), so its weathering sits where weather leaves it: rain streaks
 * down from the roof and from each sill and sunshade, a damp band over the plinth, hairline cracks from the
 * windows' corners, patches of newer plaster.
 * @param {{ x0: number, x1: number, height: number, windows: number[], door: { x: number, w: number, h: number }, spouts: number[] }} o
 */
export function frontWallTexture({ x0, x1, height, windows, door, spouts }) {
  const W = x1 - x0;
  const PX = 110; // pixels per metre
  return canvasTexture(
    Math.round(W * PX),
    Math.round(height * PX),
    (ctx, w, h) => {
      const X = (x) => (x - x0) * PX;
      const Y = (y) => h - y * PX;
      const rand = seeded(9);
      const base = ctx.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, '#f6cb6c');
      base.addColorStop(1, '#eab95a');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      // older and newer coats of paint: broad soft blotches
      for (let i = 0; i < 160; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = 20 + rand() * 70;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rand() < 0.5 ? 'rgba(255,240,200,0.10)' : 'rgba(170,110,20,0.08)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
      // repaired patches: a slightly different yellow with soft edges
      for (let i = 0; i < 7; i++) {
        const x = rand() * w;
        const y = Y(0.6 + rand() * 1.6);
        ctx.fillStyle = `rgba(${rand() < 0.5 ? '255,215,130' : '225,170,80'},0.35)`;
        ctx.beginPath();
        ctx.ellipse(x, y, 25 + rand() * 50, 14 + rand() * 25, rand(), 0, Math.PI * 2);
        ctx.fill();
      }
      // trowel marks
      ctx.strokeStyle = 'rgba(150,100,30,0.05)';
      for (let i = 0; i < 120; i++) {
        const x = rand() * w;
        const y = rand() * h;
        ctx.lineWidth = 1 + rand() * 2;
        ctx.beginPath();
        ctx.arc(x, y, 30 + rand() * 50, 3.6, 3.6 + 0.6 + rand() * 0.6);
        ctx.stroke();
      }
      // rain streaks from the roof's edge
      for (let x = 10; x < w; x += 18 + rand() * 50) streak(ctx, x, 0, 30 + rand() * 140, 2 + rand() * 7, 0.05 + rand() * 0.1);
      // under each sill and sunshade, at the ends and in the middle
      for (const wx of windows) {
        for (const dx of [-0.62, -0.3, 0, 0.32, 0.62])
          streak(ctx, X(wx + dx + (rand() - 0.5) * 0.06), Y(0.8), 50 + rand() * 60, 3 + rand() * 6, 0.1 + rand() * 0.08);
        for (const dx of [-0.8, 0.8]) streak(ctx, X(wx + dx), Y(2.2), 40 + rand() * 50, 4 + rand() * 6, 0.12);
        // hairline cracks from the window's corners
        ctx.strokeStyle = 'rgba(90,60,25,0.45)';
        ctx.lineWidth = 1.2;
        for (const [cx, cy, sx, sy] of [
          [wx - 0.68, 2.08, -1, 1],
          [wx + 0.68, 0.8, 1, -1],
        ]) {
          let px = X(cx);
          let py = Y(cy);
          ctx.beginPath();
          ctx.moveTo(px, py);
          for (let k = 0; k < 7; k++) ctx.lineTo((px += sx * (4 + rand() * 7)), (py -= sy * (3 + rand() * 6)));
          ctx.stroke();
        }
      }
      for (const dx of [-0.6, 0.6]) streak(ctx, X(door.x + dx), Y(door.h + 0.15), 50, 5, 0.1);
      // under the rain spouts: long dark stains
      for (const sx of spouts) {
        streak(ctx, X(sx), 0, h * 0.8, 26, 0.22, '60,50,40');
        streak(ctx, X(sx + 0.05), 0, h * 0.95, 10, 0.2, '50,45,40');
      }
      // the damp band over the plinth: a wavy, darker strip with salt specks
      ctx.fillStyle = 'rgba(120,75,25,0.22)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) ctx.lineTo(x, Y(0.53 + 0.04 * Math.sin(x * 0.05) + 0.05 * Math.sin(x * 0.011 + 2) + rand() * 0.04));
      ctx.lineTo(w, h);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,75,25,0.12)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) ctx.lineTo(x, Y(0.66 + 0.06 * Math.sin(x * 0.037 + 1) + 0.07 * Math.sin(x * 0.008) + rand() * 0.05));
      ctx.lineTo(w, h);
      ctx.fill();
      for (let i = 0; i < 350; i++) {
        ctx.fillStyle = 'rgba(255,250,235,0.35)';
        ctx.fillRect(rand() * w, Y(0.42 + rand() * 0.3), 1.5, 1.5);
      }
      speckle(ctx, w, h, rand, 4500, 'rgba(255,255,255,0.13)', 'rgba(90,55,0,0.07)');
    },
    false,
  );
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

/**
 * A window seen from outside: a teak frame of two casements (a small pane over a tall one each), glass with the sky
 * in it, and a printed curtain behind; the right casement's tall pane stands open, so the curtain shows plainly.
 */
export function windowTexture(seed = 1) {
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      const rand = seeded(seed);
      // the curtain: soft pleats in a warm print
      const hues = [
        ['#b8323a', '#e0a33a'],
        ['#9c3f73', '#f0c24a'],
        ['#c2562a', '#f2d06b'],
      ][seed % 3];
      for (let x = 0; x < w; x += 16) {
        const g = ctx.createLinearGradient(x, 0, x + 16, 0);
        g.addColorStop(0, hues[0]);
        g.addColorStop(0.5, shade(hues[0], 1.25));
        g.addColorStop(1, shade(hues[0], 0.7));
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, 16, h);
      }
      ctx.fillStyle = hues[1];
      for (let y = 10; y < h; y += 22)
        for (let x = (y / 22) % 2 ? 4 : 12; x < w; x += 16) {
          ctx.beginPath();
          ctx.arc(x, y, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      const shadow = ctx.createLinearGradient(0, 0, 0, h);
      shadow.addColorStop(0, 'rgba(0,0,0,0.45)');
      shadow.addColorStop(0.5, 'rgba(0,0,0,0.15)');
      shadow.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = shadow;
      ctx.fillRect(0, 0, w, h);
      // the frame and the panes
      const F = 14; // the outer frame
      const M = 10; // the middle stile and the rails
      const split = 0.3; // the small upper panes' share
      const panes = [];
      for (const [px, pw] of [
        [F, w / 2 - F - M / 2],
        [w / 2 + M / 2, w / 2 - F - M / 2],
      ]) {
        panes.push([px, F, pw, (h - 2 * F) * split - M / 2]);
        panes.push([px, F + (h - 2 * F) * split + M / 2, pw, (h - 2 * F) * (1 - split) - M / 2]);
      }
      panes.forEach(([px, py, pw, ph], i) => {
        if (i === 3) return; // the open one: the curtain shows plain
        const g = ctx.createLinearGradient(px, py, px + pw * 0.6, py + ph);
        g.addColorStop(0, 'rgba(205,232,250,0.88)');
        g.addColorStop(0.45, 'rgba(120,170,210,0.7)');
        g.addColorStop(1, 'rgba(40,70,100,0.75)');
        ctx.fillStyle = g;
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(255,255,255,0.32)';
        ctx.beginPath();
        ctx.moveTo(px + pw * 0.1, py + ph);
        ctx.lineTo(px + pw * 0.55, py);
        ctx.lineTo(px + pw * 0.75, py);
        ctx.lineTo(px + pw * 0.3, py + ph);
        ctx.fill();
      });
      ctx.fillStyle = '#6a3a1f';
      ctx.fillRect(0, 0, w, F);
      ctx.fillRect(0, h - F, w, F);
      ctx.fillRect(0, 0, F, h);
      ctx.fillRect(w - F, 0, F, h);
      ctx.fillRect(w / 2 - M / 2, 0, M, h);
      const ry = F + (h - 2 * F) * split - M / 2;
      ctx.fillRect(0, ry, w, M);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(${rand() < 0.5 ? '30,12,4' : '150,90,50'},0.25)`;
        ctx.fillRect(rand() * w, 0, 1, h);
      }
      // the open casement's edge, seen end-on
      ctx.fillStyle = '#4a2814';
      ctx.fillRect(w - F - 8, ry + M, 8, h - ry - M - F);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, F, w, 4);
    },
    false,
  );
}

/**
 * Several drawings in one texture (one material, one draw call for all the meshes that use them): `tiles` canvases of
 * equal size laid out in `cols` columns. `uv(i, geo)` moves a geometry's 0…1 texture coordinates onto tile i, a
 * hair inside its edges so its neighbours never bleed in.
 * @param {HTMLCanvasElement[]} tiles
 */
export function atlas(tiles, cols, { repeat = false } = {}) {
  const tw = tiles[0].width;
  const th = tiles[0].height;
  const rows = Math.ceil(tiles.length / cols);
  const tex = canvasTexture(
    tw * cols,
    th * rows,
    (ctx) => tiles.forEach((c, i) => ctx.drawImage(c, (i % cols) * tw, Math.floor(i / cols) * th)),
    repeat,
  );
  const W = tw * cols;
  const H = th * rows;
  const inset = 1.5;
  /** @param {number} i @param {THREE.BufferGeometry} geo */
  function uv(i, geo) {
    const u0 = ((i % cols) * tw + inset) / W;
    const du = (tw - 2 * inset) / W;
    // canvas rows go down, texture v goes up (flipY)
    const v0 = 1 - (Math.floor(i / cols) * th + th - inset) / H;
    const dv = (th - 2 * inset) / H;
    const a = geo.attributes.uv;
    for (let k = 0; k < a.count; k++) a.setXY(k, u0 + a.getX(k) * du, v0 + a.getY(k) * dv);
    a.needsUpdate = true;
    return geo;
  }
  return { texture: tex, uv };
}

/** The windows (the house's three and the stair room's) in one texture: tile i is windowTexture(seeds[i]). */
export function windowAtlas(seeds) {
  const tiles = seeds.map((sd) => {
    const t = windowTexture(sd);
    const c = /** @type {HTMLCanvasElement} */ (t.image);
    t.dispose();
    return c;
  });
  return atlas(tiles, 2);
}

/** The neighbours' façade bays (8 colours × 2 kinds) in one texture, for one material on every building. */
export function facadeAtlas(colors) {
  const tiles = [];
  colors.forEach((color, ci) => {
    for (let k = 0; k < 2; k++) {
      const t = facadeTexture(color, 3 + ci * 7 + k * 31);
      tiles.push(/** @type {HTMLCanvasElement} */ (t.image));
      t.dispose();
    }
  });
  return atlas(tiles, 4);
}

/** Clouds in one texture (4 shapes), for one mesh of all the clouds. */
export function cloudAtlas() {
  const tiles = [0, 1, 2, 3].map((i) => {
    const t = cloudTexture(50 + i);
    const c = /** @type {HTMLCanvasElement} */ (t.image);
    t.dispose();
    return c;
  });
  return atlas(tiles, 2);
}

function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return `#${c.getHexString()}`;
}

/** A teak door: two leaves of four raised panels, the grain, a brass hasp. */
export function doorTexture() {
  return canvasTexture(
    256,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#7b4426';
      ctx.fillRect(0, 0, w, h);
      const rand = seeded(17);
      for (let i = 0; i < 140; i++) {
        ctx.fillStyle = `rgba(${rand() < 0.5 ? '40,18,6' : '170,105,60'},0.16)`;
        ctx.fillRect(rand() * w, 0, 1 + rand() * 2, h);
      }
      const panel = (x, y, pw, ph) => {
        ctx.fillStyle = 'rgba(30,12,4,0.35)';
        ctx.fillRect(x, y, pw, ph);
        ctx.fillStyle = '#82492a';
        ctx.fillRect(x + 6, y + 6, pw - 12, ph - 12);
        ctx.fillStyle = 'rgba(255,200,150,0.18)'; // the lit bevels
        ctx.fillRect(x + 6, y + 6, pw - 12, 4);
        ctx.fillRect(x + 6, y + 6, 4, ph - 12);
        ctx.fillStyle = 'rgba(20,8,2,0.3)';
        ctx.fillRect(x + 6, y + ph - 10, pw - 12, 4);
        ctx.fillRect(x + pw - 10, y + 6, 4, ph - 12);
      };
      for (const lx of [16, w / 2 + 10]) {
        const pw = w / 2 - 26;
        panel(lx, 22, pw, h * 0.18);
        panel(lx, 34 + h * 0.18, pw, h * 0.32);
        panel(lx, 46 + h * 0.5, pw, h * 0.4);
      }
      ctx.fillStyle = '#3a1f10';
      ctx.fillRect(w / 2 - 2, 0, 4, h);
      ctx.fillStyle = '#d7aa4a'; // the hasp and the handles
      ctx.fillRect(w / 2 - 14, h * 0.47, 28, 7);
      ctx.fillRect(w / 2 + 12, h * 0.44, 6, 30);
      ctx.fillRect(w / 2 - 18, h * 0.44, 6, 30);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, h - 30, w, 30); // scuffed at the bottom
    },
    false,
  );
}

/**
 * A neighbour's façade, one bay of one floor (4 m × 3 m): a grilled window, a balcony's slab and railing, now and
 * then an air conditioner or washing hung out, rain stains under the slab.
 */
export function facadeTexture(color, seed) {
  return canvasTexture(128, 96, (ctx, w, h) => {
    const rand = seeded(seed);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    for (let x = 4; x < w; x += 10 + rand() * 20) streak(ctx, x, 10, 20 + rand() * 40, 2 + rand() * 3, 0.1);
    const wx = 22 + rand() * 20;
    ctx.fillStyle = '#34414c';
    ctx.fillRect(wx, 26, 44, 40);
    ctx.fillStyle = 'rgba(160,200,230,0.5)';
    ctx.fillRect(wx + 3, 29, 18, 34);
    ctx.fillStyle = '#1f2327';
    for (let x = wx + 4; x < wx + 44; x += 6) ctx.fillRect(x, 26, 1.5, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(wx - 4, 22, 52, 4);
    if (rand() < 0.5) {
      // a balcony on this bay
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(76, 20, 48, 70);
      ctx.fillStyle = '#ece6da';
      ctx.fillRect(74, 84, 54, 6);
      ctx.fillStyle = '#2b2f33';
      ctx.fillRect(74, 66, 54, 2);
      for (let x = 76; x < 128; x += 5) ctx.fillRect(x, 66, 1.2, 18);
      if (rand() < 0.7) {
        const cloth = ['#d6336c', '#f59f00', '#1971c2', '#e8590c', '#f8f9fa', '#7048e8'];
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = cloth[Math.floor(rand() * cloth.length)];
          ctx.fillRect(80 + i * 14, 54, 10, 16 + rand() * 8);
        }
      }
    } else if (rand() < 0.6) {
      ctx.fillStyle = '#e9ecef'; // an air conditioner
      ctx.fillRect(84, 52, 26, 18);
      ctx.fillStyle = '#868e96';
      for (let y = 55; y < 68; y += 3) ctx.fillRect(87, y, 20, 1);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, h - 5, w, 5); // the floor's band
    speckle(ctx, w, h, rand, 300, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.08)', 1);
  });
}

/** A palm frond: leaflets on a midrib, on transparent; `dry` browns it. */
export function frondTexture(dry = 0) {
  return canvasTexture(
    256,
    64,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#8a7a3c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      const greens = dry ? ['#a08646', '#8c733a', '#b79a58'] : ['#5f7f2c', '#6f8a34', '#86973e'];
      for (let x = 8; x < w - 4; x += 5) {
        const len = (h / 2 - 2) * Math.sin((Math.PI * (x + 20)) / (w + 30));
        for (const s of [-1, 1]) {
          ctx.strokeStyle = greens[(x / 5) % 3];
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(x, h / 2);
          ctx.lineTo(x + 9, h / 2 + s * len);
          ctx.stroke();
        }
      }
    },
    false,
  );
}

/** A soft white cloud on transparent. */
export function cloudTexture(seed) {
  return canvasTexture(
    256,
    128,
    (ctx, w, h) => {
      const rand = seeded(seed);
      for (let i = 0; i < 18; i++) {
        const x = w * (0.18 + rand() * 0.64);
        const y = h * (0.42 + rand() * 0.28);
        const r = 16 + rand() * 32;
        const g = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.97)');
        g.addColorStop(0.7, 'rgba(240,246,252,0.6)');
        g.addColorStop(1, 'rgba(225,235,245,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    false,
  );
}

/** Spokes and a tyre for a bicycle wheel, on transparent. */
export function wheelTexture() {
  return canvasTexture(
    128,
    128,
    (ctx, w) => {
      const c = w / 2;
      ctx.clearRect(0, 0, w, w);
      ctx.strokeStyle = '#c9ced3';
      ctx.lineWidth = 1;
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a + 0.4) * 6, c + Math.sin(a + 0.4) * 6);
        ctx.lineTo(c + Math.cos(a) * 56, c + Math.sin(a) * 56);
        ctx.stroke();
      }
      ctx.fillStyle = '#9aa1a8';
      ctx.beginPath();
      ctx.arc(c, c, 7, 0, Math.PI * 2);
      ctx.fill();
    },
    false,
  );
}
