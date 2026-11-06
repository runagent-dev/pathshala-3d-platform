// The setting: a calm deep-blue backdrop (a gradient, as in equations-of-motion) and a plain bench top in a light sand
// colour, finite, sitting in the blue; along its front a wooden metre rule printed in cm, 0 to 100 (the book's
// examples are 10 cm and 1 m), so every distance can be read off the picture. Nothing else.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FONT } from '@shared/student/materials.js';

export const BG = ['#0b2a5b', '#123d7a'];

/** The bench (m): its top is at y = 0; the charges stand on the line z = 0, x = 0 … 1. */
export const BENCH = { x0: -0.3, x1: 1.3, z0: -0.17, z1: 0.17, thick: 0.04 };
/** The metre rule in front of the stands: from −4 cm to 104 cm, its middle line at z = RULE.z. */
export const RULE = { x0: -0.04, x1: 1.04, z: 0.068, width: 0.036, thick: 0.005 };

/** The backdrop: a vertical gradient, light at the bottom (a power-of-two canvas, made once). */
export function backdrop() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, BG[0]);
  g.addColorStop(1, BG[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** One half of the rule's face: cm ticks, a longer one every 5 cm, numbers every 10 cm (a 1024 × 64 canvas). */
function ruleTexture(fromCm, toCm, aniso, num) {
  const W = 1024;
  const H = 64;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f1dfb4');
  g.addColorStop(1, '#e6cf9c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // a faint grain
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = i % 2 ? '#8a6a35' : '#fff6dd';
    ctx.fillRect(0, (i * 37) % H, W, 1);
  }
  ctx.globalAlpha = 1;
  const px = W / (toCm - fromCm);
  ctx.fillStyle = '#2a2116';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 22px ${FONT}`;
  for (let cm = Math.ceil(fromCm); cm <= Math.floor(toCm); cm++) {
    const x = (cm - fromCm) * px;
    const tall = cm % 10 === 0 ? 26 : cm % 5 === 0 ? 17 : 10;
    // ticks hang from the back edge (the edge next to the stands)
    ctx.fillRect(Math.round(x) - 1, 0, cm % 10 === 0 ? 3 : 2, tall);
    if (cm % 10 === 0 && cm >= 0 && cm <= 100) ctx.fillText(num(cm), x, H - 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  return tex;
}

/** num: the figure's digits (Bangla digits on a Bangla page, as the chapter-8 bench). */
export function createSetting(renderer, num = String) {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const root = new THREE.Group();
  root.name = 'Bench';
  const w = BENCH.x1 - BENCH.x0;
  const d = BENCH.z1 - BENCH.z0;
  const top = new THREE.Mesh(
    new RoundedBoxGeometry(w, BENCH.thick, d, 2, 0.008),
    new THREE.MeshStandardMaterial({ name: 'BenchTop', color: '#c9b591', roughness: 0.82, metalness: 0 }),
  );
  top.position.set((BENCH.x0 + BENCH.x1) / 2, -BENCH.thick / 2, (BENCH.z0 + BENCH.z1) / 2);
  top.receiveShadow = true;
  top.userData.noExport = true;
  root.add(top);

  // the metre rule: a thin wooden strip, its face in two halves (two 1024-px canvases keep the print sharp)
  const rule = new THREE.Group();
  rule.name = 'MetreRule';
  const len = RULE.x1 - RULE.x0;
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(len, RULE.thick, RULE.width, 1, 0.0015),
    new THREE.MeshStandardMaterial({ name: 'RuleWood', color: '#d9bf87', roughness: 0.7 }),
  );
  body.position.set((RULE.x0 + RULE.x1) / 2, RULE.thick / 2, RULE.z);
  body.castShadow = false;
  body.receiveShadow = true;
  rule.add(body);
  const midCm = 50;
  const halves = [
    [RULE.x0 * 100, midCm],
    [midCm, RULE.x1 * 100],
  ];
  for (const [a, b] of halves) {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry((b - a) / 100, RULE.width * 0.96),
      new THREE.MeshStandardMaterial({ name: 'RuleFace', map: ruleTexture(a, b, aniso, num), roughness: 0.75 }),
    );
    face.rotation.x = -Math.PI / 2;
    face.position.set((a + b) / 200, RULE.thick + 0.0002, RULE.z);
    face.receiveShadow = true;
    rule.add(face);
  }
  root.add(rule);
  return { root, rule };
}
