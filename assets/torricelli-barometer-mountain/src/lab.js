// The school lab (procedural, no image files): a warm teak bench, a plain painted blue-grey wall (nothing else on it),
// and a window on the right whose view changes with the height above the sea (the plains and a
// river at the sea, green hills at 1000 m, pine ridges at 2000 m, snowy peaks over the clouds at 3000 m). Units: m.
// The bench top is at y = 0; the wall is at z = WALL_Z.
import * as THREE from 'three';

export const WALL_Z = -0.42;
export const WINDOW = { x0: 0.29, x1: 0.89, y0: 0.42, y1: 1.32 };

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function texture(c, { repeat = [1, 1], aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso;
  return t;
}

/** Warm teak with long grain and a few darker knots. */
function teak() {
  const W = 1024;
  const H = 256;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  const r = rand(7);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#b8692c');
  g.addColorStop(0.5, '#c77a38');
  g.addColorStop(1, '#ad5f27');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 110; i++) {
    const y0 = r() * H;
    const amp = 2 + r() * 6;
    const f = 0.002 + r() * 0.006;
    const ph = r() * 9;
    ctx.strokeStyle = `rgba(${92 + r() * 40},${42 + r() * 20},${14},${0.12 + r() * 0.28})`;
    ctx.lineWidth = 0.6 + r() * 2.2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.7) * amp * 0.3;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  // a few planks
  ctx.strokeStyle = 'rgba(60,26,8,0.55)';
  ctx.lineWidth = 2;
  for (const y of [64, 128, 192]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  return texture(c, { repeat: [1, 1], aniso: 8 });
}

/** Painted plaster, blue-grey, with a soft mottling. */
function plaster() {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  const r = rand(3);
  ctx.fillStyle = '#5f7f92';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const v = r();
    ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.025 + r() * 0.03})` : `rgba(10,30,50,${0.03 + r() * 0.04})`;
    const s = 2 + r() * 10;
    ctx.fillRect(r() * 256, r() * 256, s, s);
  }
  return texture(c, { repeat: [6, 3] });
}

/** The view out of the window at a height above the sea (m). Drawn into the given canvas. */
function drawView(c, z) {
  const ctx = c.getContext('2d');
  const W = c.width;
  const H = c.height;
  const r = rand(5 + Math.round(z / 1000));
  const high = z >= 2500;
  // the sky: a deeper blue higher up (thinner air)
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7);
  const top = ['#3f8fe0', '#2f7fd8', '#2369c9', '#1950b4'][Math.min(3, Math.round(z / 1000))];
  sky.addColorStop(0, top);
  sky.addColorStop(1, high ? '#cfe2f6' : '#cfe8fb');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // the sun's glow at the top right
  const sun = ctx.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, W * 0.35);
  sun.addColorStop(0, 'rgba(255,248,220,0.9)');
  sun.addColorStop(0.25, 'rgba(255,240,200,0.35)');
  sun.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);
  const ridge = (base, amp, color, seed, rough = 1) => {
    const rr = rand(seed);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    let y = base;
    for (let x = 0; x <= W; x += 8) {
      y += (rr() - 0.5) * amp * 0.35 * rough;
      y = Math.min(base + amp, Math.max(base - amp, y));
      ctx.lineTo(x, y + Math.sin(x * 0.012 + seed) * amp * 0.6);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  };
  const peaks = (base, heights, color, snow) => {
    const step = W / (heights.length - 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    heights.forEach((h, i) => ctx.lineTo(i * step, base - h));
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    if (snow) {
      ctx.fillStyle = 'rgba(250,252,255,0.95)';
      heights.forEach((h, i) => {
        if (h < base * 0.42 || i === 0 || i === heights.length - 1) return;
        const x = i * step;
        const y = base - h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - step * 0.32, y + h * 0.28);
        ctx.lineTo(x - step * 0.1, y + h * 0.22);
        ctx.lineTo(x + step * 0.05, y + h * 0.3);
        ctx.lineTo(x + step * 0.3, y + h * 0.24);
        ctx.closePath();
        ctx.fill();
      });
    }
  };
  const cloud = (x, y, s, a = 0.92) => {
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(x + (i - 2.5) * s * 0.5, y + Math.sin(i * 1.7) * s * 0.12, s * (0.45 + 0.2 * Math.sin(i)), s * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  if (z < 500) {
    // the plains: paddy fields, a river, palms and a village line
    cloud(W * 0.25, H * 0.22, 70);
    cloud(W * 0.62, H * 0.3, 50, 0.85);
    ridge(H * 0.58, 6, '#7aa7c9', 2, 0.4);
    const fields = ['#9a9a62', '#b0a874', '#8a8d5a', '#c0b282', '#a19d68']; // muted, ripe fields (not a bright green)
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = fields[i % fields.length];
      const y = H * 0.6 + i * i * 4.6;
      ctx.fillRect(0, y, W, H);
    }
    // the river
    ctx.fillStyle = '#5aa6e0';
    ctx.beginPath();
    ctx.moveTo(W * 0.2, H);
    ctx.bezierCurveTo(W * 0.35, H * 0.8, W * 0.7, H * 0.72, W * 0.95, H * 0.62);
    ctx.lineTo(W, H * 0.625);
    ctx.bezierCurveTo(W * 0.72, H * 0.76, W * 0.45, H * 0.86, W * 0.36, H);
    ctx.closePath();
    ctx.fill();
    // palms along the far edge
    for (let i = 0; i < 14; i++) {
      const x = r() * W;
      const y = H * 0.6 + r() * 6;
      ctx.strokeStyle = '#4a3a22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x + 2, y - 16);
      ctx.stroke();
      ctx.fillStyle = '#2f7a2e';
      ctx.beginPath();
      ctx.ellipse(x + 2, y - 18, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (z < 1500) {
    // green hills
    cloud(W * 0.3, H * 0.2, 60);
    ridge(H * 0.38, 26, '#7d9fc4', 3);
    ridge(H * 0.48, 30, '#4d8f52', 4);
    ridge(H * 0.62, 26, '#3f8a3d', 5);
    ridge(H * 0.8, 20, '#5aa944', 6);
  } else if (z < 2500) {
    // pine ridges, a misty valley
    ridge(H * 0.3, 40, '#8aa3c2', 7);
    ridge(H * 0.42, 44, '#4f7a6a', 8);
    cloud(W * 0.45, H * 0.5, 90, 0.7);
    ridge(H * 0.58, 36, '#2f6b45', 9);
    for (let i = 0; i < 40; i++) {
      const x = r() * W;
      const y = H * 0.66 + r() * H * 0.3;
      ctx.fillStyle = r() > 0.5 ? '#1f5a36' : '#27673c';
      ctx.beginPath();
      ctx.moveTo(x, y - 22);
      ctx.lineTo(x - 7, y);
      ctx.lineTo(x + 7, y);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // snowy peaks, the clouds below
    peaks(H * 0.66, [60, 190, 120, 280, 170, 230, 90], '#6f7f99', true);
    peaks(H * 0.74, [30, 110, 70, 150, 60, 120, 40], '#55667f', true);
    cloud(W * 0.2, H * 0.72, 110, 0.95);
    cloud(W * 0.7, H * 0.76, 120, 0.95);
    ctx.fillStyle = '#f2f6fb';
    ctx.fillRect(0, H * 0.8, W, H);
    ridge(H * 0.9, 14, '#8b8f86', 11);
  }
}

/**
 * The lab: `root` (bench, wall, chalkboard, window), `setHeight(z)` redraws the window's view for a height above the
 * sea, and `shadowCatchers` (meshes that receive the soft shadow).
 */
export function createLab() {
  const root = new THREE.Group();
  root.name = 'Lab';

  // the bench: a thick teak top with a rounded front edge feel (a darker band), the floor far below
  const benchMat = new THREE.MeshStandardMaterial({ name: 'Teak', map: teak(), roughness: 0.48, metalness: 0 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 1.1), benchMat);
  top.position.set(0, -0.025, -0.1);
  top.receiveShadow = true;
  top.name = 'BenchTop';
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'TeakEdge', color: '#7a3e17', roughness: 0.55 });
  const edge = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.012, 0.02), edgeMat);
  edge.position.set(0, -0.006, 0.45);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 0.04), new THREE.MeshStandardMaterial({ color: '#5a3216', roughness: 0.7 }));
  apron.position.set(0, -0.4, 0.38);
  root.add(top, edge, apron);

  // the wall
  const wallMat = new THREE.MeshStandardMaterial({ name: 'Wall', map: plaster(), roughness: 0.95 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.4), wallMat);
  wall.position.set(0, 0.9, WALL_Z);
  wall.receiveShadow = true;
  root.add(wall);
  // a skirting board where wall meets bench
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.02), new THREE.MeshStandardMaterial({ color: '#3f5a68', roughness: 0.8 }));
  skirt.position.set(0, 0.03, WALL_Z + 0.01);
  root.add(skirt);

  // the window: the view (unlit, so it glows like daylight), a green-painted frame with a cross bar and a sill
  const view = canvas(512, 640);
  drawView(view, 0);
  const viewTex = new THREE.CanvasTexture(view);
  viewTex.colorSpace = THREE.SRGBColorSpace;
  const { x0, x1, y0, y1 } = WINDOW;
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(x1 - x0, y1 - y0),
    new THREE.MeshBasicMaterial({ name: 'WindowView', map: viewTex, toneMapped: false, fog: false }),
  );
  glass.position.set((x0 + x1) / 2, (y0 + y1) / 2, WALL_Z + 0.004);
  root.add(glass);
  const winMat = new THREE.MeshStandardMaterial({ name: 'WindowFrame', color: '#2f6e55', roughness: 0.5 });
  const bar = 0.035;
  for (const [w, h, x, y] of [
    [x1 - x0 + bar * 2, bar, (x0 + x1) / 2, y1 + bar / 2],
    [x1 - x0 + bar * 2, bar, (x0 + x1) / 2, y0 - bar / 2],
    [bar, y1 - y0, x0 - bar / 2, (y0 + y1) / 2],
    [bar, y1 - y0, x1 + bar / 2, (y0 + y1) / 2],
    [bar * 0.6, y1 - y0, (x0 + x1) / 2, (y0 + y1) / 2],
    [x1 - x0, bar * 0.6, (x0 + x1) / 2, y0 + (y1 - y0) * 0.62],
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), winMat);
    m.position.set(x, y, WALL_Z + 0.016);
    m.castShadow = true;
    root.add(m);
  }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 0.12, 0.025, 0.08), winMat);
  sill.position.set((x0 + x1) / 2, y0 - bar - 0.012, WALL_Z + 0.04);
  root.add(sill);

  let height = 0;
  return {
    root,
    shadowCatchers: [top, wall],
    setHeight(z) {
      if (z === height) return;
      height = z;
      drawView(view, z);
      viewTex.needsUpdate = true;
    },
  };
}
