// The settings, in metres (no image files):
//   courtyard (দোলনা): a courtyard of swept clay, the ground worn bare under the swing, under a calm sky that fades
//     to pale clay at the horizon (no house, pots, clouds or trees: only the swing and the girl draw the eye).
//   lab (স্প্রিং): a plain wooden bench in front of a soft blue wall.
// Everything is static: merged into one mesh per material (src/merge.js), never exported to GLB.
import * as THREE from 'three';
import { mergeStatic } from './merge.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')) };
}
function rand(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function texture(c, { repeat = false, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
/** Draw fn at (x, y) and at its copies across the edges, so a repeating texture has no seams. */
function wrapped(w, h, x, y, r, fn) {
  for (const dx of [0, -w, w]) for (const dy of [0, -h, h]) if (x + dx > -r && x + dx < w + r && y + dy > -r && y + dy < h + r) fn(x + dx, y + dy);
}

/** Swept clay, about 4 m across one repeat: mottled, small pebbles, broom strokes. */
function earthTexture() {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  const r = rand(7);
  ctx.fillStyle = '#8a6443';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 4 + r() * 22;
    const light = r() < 0.5;
    ctx.fillStyle = light ? `rgba(176,134,92,${0.05 + r() * 0.1})` : `rgba(82,56,34,${0.05 + r() * 0.12})`;
    wrapped(S, S, x, y, rad, (px, py) => {
      ctx.beginPath();
      ctx.ellipse(px, py, rad, rad * (0.5 + r() * 0.5), r() * 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // broom strokes: long faint arcs
  ctx.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const x = r() * S;
    const y = r() * S;
    const len = 30 + r() * 60;
    const a = 0.6 + r() * 0.5;
    ctx.strokeStyle = r() < 0.5 ? 'rgba(70,46,28,0.16)' : 'rgba(186,146,104,0.16)';
    ctx.lineWidth = 0.8 + r() * 1.2;
    wrapped(S, S, x, y, len, (px, py) => {
      ctx.beginPath();
      ctx.arc(px, py, len, a, a + 0.5 + r() * 0.4);
      ctx.stroke();
    });
  }
  for (let i = 0; i < 260; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 0.8 + r() * 2.2;
    const g = 120 + r() * 70;
    ctx.fillStyle = `rgb(${g + 20},${g + 6},${g - 14})`;
    wrapped(S, S, x, y, rad + 1, (px, py) => {
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(50,32,18,0.35)';
      ctx.fillRect(px - rad * 0.4, py + rad * 0.6, rad * 1.4, 0.8);
    });
  }
  return c;
}

/**
 * The same clay with the bare patch children's feet wear under a swing (darker, scuffed, fading out), for the one
 * 4 m square under it: opaque, so it needs no blending (and no shader of its own).
 */
function scuffedTexture(earth) {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  const r = rand(19);
  ctx.drawImage(earth, 0, 0);
  ctx.save();
  ctx.translate(S / 2, S / 2);
  ctx.scale(1, 0.5);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 170);
  g.addColorStop(0, 'rgba(70,44,26,0.55)');
  g.addColorStop(0.55, 'rgba(78,50,30,0.32)');
  g.addColorStop(1, 'rgba(78,50,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-170, -170, 340, 340);
  ctx.restore();
  for (let i = 0; i < 160; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 130;
    const x = S / 2 + Math.cos(a) * d;
    const y = S / 2 + Math.sin(a) * d * 0.45;
    ctx.strokeStyle = `rgba(${r() < 0.5 ? '60,38,22' : '170,128,88'},${0.12 + r() * 0.2})`;
    ctx.lineWidth = 1 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 8);
    ctx.stroke();
  }
  return texture(c, { aniso: 8 });
}

/** The sky all round (for a dome, equirectangular): blue overhead, clouds, a hazy line of far trees and roofs, fields below. */
function skyTexture() {
  const { c, ctx } = canvas(4, 256);
  // a calm sky over the open courtyard, then pale clay to the horizon (no clouds, trees or roofs)
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6f95bd');
  g.addColorStop(0.4, '#a9c2d8');
  g.addColorStop(0.5, '#d2dde5');
  g.addColorStop(0.52, '#b9a588');
  g.addColorStop(1, '#a28c6c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  return texture(c, { aniso: 1 });
}

export function createCourtyard() {
  const root = new THREE.Group();
  root.name = 'Courtyard';
  root.userData.noExport = true;
  const earthCanvas = earthTexture();
  const earthMap = texture(earthCanvas, { repeat: true, aniso: 8 });
  earthMap.repeat.set(19, 19); // one picture every 4 m
  const earth = new THREE.MeshStandardMaterial({ name: 'Clay', map: earthMap, roughness: 0.95, metalness: 0 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(38, 48), earth);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  // the square under the swing (it lines up with one repeat of the clay): the worn patch drawn into it
  const scuff = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    new THREE.MeshStandardMaterial({
      name: 'WornClay',
      map: scuffedTexture(earthCanvas),
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  scuff.rotation.x = -Math.PI / 2;
  scuff.position.y = 0.001;
  scuff.receiveShadow = true;
  root.add(ground, scuff);

  // the sky: a dome round everything (cheaper than a background the renderer turns into a cube map)
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(40, 48, 24),
    new THREE.MeshBasicMaterial({ name: 'Sky', map: skyTexture(), side: THREE.BackSide, depthWrite: false, toneMapped: false, fog: false }),
  );
  dome.renderOrder = -1;
  root.add(dome);
  return { root, background: null };
}

export function createLab() {
  const root = new THREE.Group();
  root.name = 'Lab';
  root.userData.noExport = true;
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.6),
    new THREE.MeshStandardMaterial({ name: 'LabWallUpper', color: 0x9fb6cc, roughness: 0.9 }),
  );
  wall.position.set(0.05, 0.62, -0.55);
  wall.receiveShadow = true;
  const benchMat = new THREE.MeshStandardMaterial({ name: 'Bench', color: 0xb98a5e, roughness: 0.62 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 1.0), benchMat);
  top.position.set(0, -0.025, -0.05);
  top.receiveShadow = true;
  const below = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.2),
    new THREE.MeshStandardMaterial({ name: 'LabWall', color: 0x6f8aa6, roughness: 0.9 }),
  );
  below.position.set(0.05, -0.78, -0.55);
  root.add(wall, top, below);
  mergeStatic(root, { keep: [top] });
  // the room beyond, for the turned view: a dim blue-grey
  const { c, ctx } = canvas(16, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#3a4c66');
  g.addColorStop(1, '#2a3446');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  return { root, background: texture(c, { aniso: 1 }) };
}
