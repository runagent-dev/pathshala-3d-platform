// A carrom board (ক্যারম বোর্ড) and its striker, in metres: the flat surface (সমতলপৃষ্ঠ) the striker is pushed
// on. Playing area 74 cm square of light plywood with the usual printed lines (base lines, centre circles, the
// corner arrows), a polished dark frame 7.5 cm wide, four corner pockets. The floor is y = 0.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BOARD, STRIKER } from './motion.js';

const TEX = 1024; // px across the playing area (0.72 mm per pixel)

/** The printed playing surface: plywood with faint grain, the base lines, the centre circles and the corner arrows. */
function surfaceTexture(aniso) {
  const c = document.createElement('canvas');
  c.width = c.height = TEX;
  const g = c.getContext('2d');
  const px = TEX / (2 * BOARD.half); // pixels per metre
  const grad = g.createLinearGradient(0, 0, TEX, TEX);
  grad.addColorStop(0, '#f3dfb4');
  grad.addColorStop(1, '#ebd09d');
  g.fillStyle = grad;
  g.fillRect(0, 0, TEX, TEX);
  // faint grain along x
  let seed = 5;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 140; i++) {
    const y0 = rnd() * TEX;
    g.strokeStyle = `rgba(150, 105, 50, ${0.04 + rnd() * 0.06})`;
    g.lineWidth = 1 + rnd() * 2.5;
    g.beginPath();
    for (let x = 0; x <= TEX; x += 16) {
      const y = y0 + Math.sin(x * 0.006 + i) * (3 + rnd() * 2);
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  const m = (v) => TEX / 2 + v * px; // metres from the centre → pixels
  const ink = '#2a1d14';
  const red = '#b3261e';
  g.lineCap = 'round';
  // base lines: two lines 3.2 cm apart, 47 cm long, 10 cm in from each side, a red circle at each end
  const L = 0.235;
  const outer = BOARD.half - 0.102;
  const inner = outer - 0.032;
  for (let side = 0; side < 4; side++) {
    g.save();
    g.translate(TEX / 2, TEX / 2);
    g.rotate((side * Math.PI) / 2);
    g.translate(-TEX / 2, -TEX / 2);
    g.strokeStyle = ink;
    g.lineWidth = 2.4;
    for (const z of [outer, inner]) {
      g.beginPath();
      g.moveTo(m(-L), m(z));
      g.lineTo(m(L), m(z));
      g.stroke();
    }
    for (const x of [-L, L]) {
      g.beginPath();
      g.arc(m(x), m((outer + inner) / 2), 0.016 * px, 0, Math.PI * 2);
      g.fillStyle = red;
      g.fill();
      g.stroke();
    }
    // the corner arrow: from near the pocket toward the middle, with an arc across it
    const a0 = BOARD.half - 0.055;
    const a1 = BOARD.half - 0.32;
    g.beginPath();
    g.moveTo(m(a0), m(a0));
    g.lineTo(m(a1), m(a1));
    g.stroke();
    g.beginPath();
    g.arc(m(a1 + 0.02), m(a1 + 0.02), 0.032 * px, Math.PI * 0.75, Math.PI * 1.75, true);
    g.stroke();
    g.beginPath(); // arrow head toward the pocket
    g.moveTo(m(a0), m(a0));
    g.lineTo(m(a0 - 0.022), m(a0 - 0.006));
    g.moveTo(m(a0), m(a0));
    g.lineTo(m(a0 - 0.006), m(a0 - 0.022));
    g.stroke();
    g.restore();
  }
  // centre: a circle 17 cm across, a red spot 3.2 cm across and an eight-point star
  g.strokeStyle = ink;
  g.lineWidth = 2.4;
  g.beginPath();
  g.arc(TEX / 2, TEX / 2, 0.085 * px, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  for (let i = 0; i < 16; i++) {
    const r = (i % 2 ? 0.03 : 0.07) * px;
    const a = (i * Math.PI) / 8;
    const x = TEX / 2 + r * Math.sin(a);
    const y = TEX / 2 - r * Math.cos(a);
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
  g.lineWidth = 1.8;
  g.stroke();
  g.beginPath();
  g.arc(TEX / 2, TEX / 2, 0.016 * px, 0, Math.PI * 2);
  g.fillStyle = red;
  g.fill();
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  t.userData.mimeType = 'image/jpeg'; // in the GLB: plywood has no transparency, and a JPEG is a fraction of a PNG
  return t;
}

/** The striker's top: ivory with a red ring and a small star. */
function strikerTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#f6f2e8';
  g.fillRect(0, 0, S, S);
  g.strokeStyle = '#b3261e';
  g.lineWidth = 14;
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.36, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = '#1f3f8f';
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = (i % 2 ? 0.09 : 0.2) * S;
    const a = (i * Math.PI) / 5;
    const x = S / 2 + r * Math.sin(a);
    const y = S / 2 - r * Math.cos(a);
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createCarrom({ materials: M }) {
  const root = new THREE.Group();
  root.name = 'CarromBoard';
  const half = BOARD.half;
  const fw = BOARD.frame;
  const full = 2 * (half + fw);
  const top = BOARD.surface + 0.022; // the frame stands 2.2 cm above the playing surface

  const frameMat = M.wood.clone();
  frameMat.name = 'Frame';
  frameMat.color = new THREE.Color(0x6b3a1c);
  if (frameMat.map) frameMat.map.userData.mimeType = 'image/jpeg';
  frameMat.roughness = 0.38;
  const base = new THREE.Mesh(new THREE.BoxGeometry(2 * half + 0.01, BOARD.surface - 0.002, 2 * half + 0.01), frameMat);
  base.position.y = (BOARD.surface - 0.002) / 2;
  base.name = 'Base';
  root.add(base);
  for (let i = 0; i < 4; i++) {
    const along = i < 2;
    const geo = new RoundedBoxGeometry(along ? full : fw, top, along ? fw : 2 * half, 3, 0.006);
    const rail = new THREE.Mesh(geo, frameMat);
    rail.name = `Frame ${i + 1}`;
    const s = i % 2 ? 1 : -1;
    if (along) rail.position.set(0, top / 2, s * (half + fw / 2));
    else rail.position.set(s * (half + fw / 2), top / 2, 0);
    root.add(rail);
  }

  const surfaceMat = new THREE.MeshStandardMaterial({ name: 'Plywood', map: surfaceTexture(M.aniso), roughness: 0.55, metalness: 0 });
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(2 * half, 2 * half), surfaceMat);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = BOARD.surface;
  surface.name = 'PlayingSurface';
  surface.receiveShadow = true;
  root.add(surface);

  const pocketMat = new THREE.MeshStandardMaterial({ name: 'Pocket', color: 0x15100c, roughness: 0.9 });
  const pocketGeo = new THREE.CircleGeometry(0.0225, 28);
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const p = new THREE.Mesh(pocketGeo, pocketMat);
    p.rotation.x = -Math.PI / 2;
    p.position.set(sx * (half - 0.026), BOARD.surface + 0.0004, sz * (half - 0.026));
    p.name = 'Pocket';
    root.add(p);
  }

  // the striker: an ivory disc 4.1 cm across, with a generous invisible target for a finger
  const striker = new THREE.Group();
  striker.name = 'Striker';
  const bodyMat = new THREE.MeshPhysicalMaterial({ name: 'Striker', color: 0xf3efe4, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(STRIKER.r, STRIKER.r, STRIKER.h, 48), bodyMat);
  body.position.y = STRIKER.h / 2;
  striker.add(body);
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(STRIKER.r * 0.96, 48),
    new THREE.MeshPhysicalMaterial({ name: 'StrikerTop', map: strikerTexture(), roughness: 0.3, clearcoat: 0.6 }),
  );
  face.rotation.x = -Math.PI / 2;
  face.position.y = STRIKER.h + 0.0002;
  striker.add(face);
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 20), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.03;
  hit.userData.noExport = true;
  striker.add(hit);
  striker.position.set(STRIKER.start.x, BOARD.surface, STRIKER.start.z);
  root.add(striker);

  return {
    root,
    striker,
    strikerHit: hit,
    /** Geometry and material for the strobe pictures of the striker. */
    ghostGeometry: body.geometry,
  };
}
