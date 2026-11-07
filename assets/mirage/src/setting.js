// The setting: a calm deep-blue backdrop (the sister figures' gradient) and one finite strip of desert sand floating in
// it, with a few pebbles (the book's picture has them). Over the sand, the book's three layers of air: faint tinted
// slabs, warmer near the sand, with a light line at each boundary. A pale patch on the sand is the "water" the eye
// believes it sees. Nothing else: no dunes, sky or buildings.
import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LAYER } from './optics.js';

export const BG = ['#0b2a5b', '#123d7a'];
/** The sand strip: x from left to right, z across, its top at y = 0. */
export const SAND = { left: -3.15, right: 2.65, depth: 1.7, thick: 0.16 };

/** The backdrop: a vertical gradient, lighter at the bottom (a power-of-two canvas, made once). */
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

/** A small seeded random generator, so the pebbles and the sand's grain are the same on every load. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The sand's top: fine grain and soft wind ripples (colour), and the same ripples as a bump map. */
function sandTextures() {
  const S = 512;
  const col = document.createElement('canvas');
  col.width = S;
  col.height = S;
  const bump = document.createElement('canvas');
  bump.width = S;
  bump.height = S;
  const c = col.getContext('2d');
  const b = bump.getContext('2d');
  c.fillStyle = '#dcb782';
  c.fillRect(0, 0, S, S);
  b.fillStyle = '#808080';
  b.fillRect(0, 0, S, S);
  // ripples: wavy bands across the strip (tileable: whole waves across the canvas)
  for (let y = 0; y < S; y += 2) {
    for (let x = 0; x < S; x += 4) {
      const w = Math.sin((x / S) * Math.PI * 2 * 9 + Math.sin((y / S) * Math.PI * 2 * 2) * 1.6);
      const k = Math.round(128 + w * 34);
      b.fillStyle = `rgb(${k},${k},${k})`;
      b.fillRect(x, y, 4, 2);
      c.fillStyle = w > 0.55 ? 'rgba(255, 236, 200, 0.22)' : w < -0.6 ? 'rgba(150, 105, 55, 0.12)' : 'rgba(0,0,0,0)';
      c.fillRect(x, y, 4, 2);
    }
  }
  // grain
  const r = rng(7);
  for (let k = 0; k < 9000; k++) {
    const x = r() * S;
    const y = r() * S;
    const d = r();
    c.fillStyle = d < 0.5 ? 'rgba(120, 82, 40, 0.28)' : 'rgba(255, 245, 225, 0.35)';
    c.fillRect(x, y, 1.2, 1.2);
  }
  const map = new THREE.CanvasTexture(col);
  map.colorSpace = THREE.SRGBColorSpace;
  const bm = new THREE.CanvasTexture(bump);
  for (const tex of [map, bm]) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    tex.anisotropy = 4;
  }
  return { map, bump: bm };
}

/** A soft round spot (white in the middle, clear at the rim): the "water" patch. */
function spotTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.75)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSetting() {
  const root = new THREE.Group();
  root.name = 'Desert';
  const W = SAND.right - SAND.left;
  const cx = (SAND.left + SAND.right) / 2;
  const tex = sandTextures();
  const top = new THREE.MeshStandardMaterial({ name: 'Sand', color: '#ffffff', map: tex.map, bumpMap: tex.bump, bumpScale: 1.2, roughness: 0.95 });
  const side = new THREE.MeshStandardMaterial({ name: 'SandSide', color: '#b98f5c', roughness: 0.95 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(W, SAND.thick, SAND.depth), [side, side, top, side, side, side]);
  slab.position.set(cx, -SAND.thick / 2, 0);
  slab.receiveShadow = true;
  slab.name = 'Sand';
  root.add(slab);
  // a darker lip along the top edge: the strip reads as a block, not a sheet
  const lipMat = new THREE.MeshStandardMaterial({ name: 'SandLip', color: '#c99c62', roughness: 0.95 });
  const lip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.01, 0.012, SAND.depth + 0.01), lipMat);
  lip.position.set(cx, -0.012, 0);
  root.add(lip);

  // pebbles: one instanced mesh, a few on the strip (none on the light's path or under the eye)
  const r = rng(21);
  const pebGeo = new THREE.IcosahedronGeometry(1, 1);
  const pebMat = new THREE.MeshStandardMaterial({ name: 'Pebble', color: '#ffffff', roughness: 0.8 });
  const PEB = 16;
  const pebbles = new THREE.InstancedMesh(pebGeo, pebMat, PEB);
  pebbles.name = 'Pebbles';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const tones = ['#a07850', '#8c6a4c', '#b3946c', '#7a6550'].map((h) => new THREE.Color(h));
  for (let k = 0; k < PEB; k++) {
    let x;
    let z;
    do {
      x = SAND.left + 0.2 + r() * (W - 0.4);
      z = (r() - 0.5) * (SAND.depth - 0.25);
    } while (Math.abs(z) < 0.18);
    const s = 0.018 + r() * 0.03;
    pos.set(x, s * 0.35, z);
    e.set(r() * 3, r() * 3, r() * 3);
    q.setFromEuler(e);
    sc.set(s * (1 + r() * 0.5), s * 0.55, s);
    m.compose(pos, q, sc);
    pebbles.setMatrixAt(k, m);
    pebbles.setColorAt(k, tones[k % tones.length]);
  }
  pebbles.castShadow = true;
  pebbles.receiveShadow = true;
  root.add(pebbles);

  // the three layers of air: tinted slabs over the sand (the lowest, on the hot sand, the warmest), drawn before the rays
  const layers = new THREE.Group();
  layers.name = 'AirLayers';
  layers.userData.noExport = true;
  const slabOf = (y0, y1, color, opacity, name) => {
    const mat = new THREE.MeshBasicMaterial({ name, color, transparent: true, opacity, depthWrite: false, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, y1 - y0, SAND.depth - 0.02), mat);
    mesh.position.set(cx, (y0 + y1) / 2, 0);
    mesh.renderOrder = 2;
    mesh.userData.opacity = opacity;
    layers.add(mesh);
    return mesh;
  };
  const low = slabOf(0.002, LAYER.b, '#ff7a2e', 0.42, 'LayerLow');
  const mid = slabOf(LAYER.b, LAYER.a, '#ffbf5e', 0.3, 'LayerMid');
  const up = slabOf(LAYER.a, LAYER.top, '#a5d8ff', 0.16, 'LayerTop');
  // the boundaries: a light line round each, at a and b
  const ring = (y) => {
    const x0 = SAND.left + 0.01;
    const x1 = SAND.right - 0.01;
    const z0 = -SAND.depth / 2 + 0.01;
    const z1 = SAND.depth / 2 - 0.01;
    return [x0, y, z1, x1, y, z1, x1, y, z1, x1, y, z0, x1, y, z0, x0, y, z0, x0, y, z0, x0, y, z1];
  };
  const lineGeo = new LineSegmentsGeometry().setPositions([...ring(LAYER.a), ...ring(LAYER.b)]);
  const lineMat = new LineMaterial({ color: '#e7f5ff', linewidth: 2, transparent: true, opacity: 0.95, depthWrite: false });
  const lines = new LineSegments2(lineGeo, lineMat);
  lines.renderOrder = 3;
  lines.name = 'Boundaries';
  layers.add(lines);
  layers.visible = false;
  root.add(layers);

  // the "water": a pale sky-blue patch on the sand where the eye's line meets the ground
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    new THREE.MeshBasicMaterial({
      name: 'Water',
      color: '#a9d6ff',
      map: spotTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.scale.set(0.8, 0.5, 1);
  water.position.y = 0.003;
  water.renderOrder = 4; // over the layers' tint
  water.visible = false;
  water.userData.noExport = true;
  root.add(water);

  /** k: 0…1, how much the layers show. */
  function setHeat(k) {
    layers.visible = k > 0.001;
    for (const ms of [low, mid, up]) ms.material.opacity = ms.userData.opacity * k;
    lineMat.opacity = 0.95 * k;
  }
  /** The water patch at x, with opacity a. */
  function setWater(x, a) {
    water.visible = a > 0.01;
    water.position.x = x;
    water.material.opacity = 0.85 * a;
  }
  return { root, slab, layers, setHeat, setWater, water, top };
}
