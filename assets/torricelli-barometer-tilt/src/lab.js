// The school lab (procedural, no image files): a warm teak bench and a plain painted blue-grey wall, nothing else
// (one scene per lab, only the main object draws the eye). Units: m.
// The bench top is at y = 0; the wall is at z = WALL_Z.
import * as THREE from 'three';

export const WALL_Z = -0.42;

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

/** The lab: `root` (bench, wall) and `shadowCatchers` (meshes that receive the soft shadow). */
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

  return { root, shadowCatchers: [top, wall] };
}
