// Procedural textures and materials (no image files, so the asset stays tiny and resolution-independent).
import * as THREE from 'three';

export const FONT = '"Noto Sans Bengali", "Bahnschrift", "Roboto", "Helvetica Neue", Arial, sans-serif';
export const INK = new THREE.Color('#14171c');

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** Long horizontal streaks, tileable: drives roughness + bump for a brushed-steel finish. */
function brushedTexture(anisotropy) {
  const W = 1024;
  const H = 512;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  const r = rand(7);
  ctx.fillStyle = 'rgb(150,150,150)';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 5200; i++) {
    const y = r() * H;
    const len = 80 + r() * W;
    const x = r() * W;
    const g = Math.round(95 + r() * 120);
    ctx.strokeStyle = `rgba(${g},${g},${g},${0.18 + r() * 0.3})`;
    ctx.lineWidth = r() < 0.85 ? 1 : 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    // wrap so the texture tiles horizontally
    if (x + len > W) {
      ctx.moveTo(x - W, y);
      ctx.lineTo(x + len - W, y);
    }
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 90, 1 / 9);
  t.anisotropy = anisotropy;
  return t;
}

/** Engineering cut-section hatch for cutaway views. */
function hatchTexture(anisotropy) {
  const S = 128;
  const c = canvas(S, S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ff8a3d';
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = 'rgba(120,40,0,0.55)';
  ctx.lineWidth = 7;
  for (let i = -S; i < S * 2; i += 26) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + S, S);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 4, 1 / 4);
  t.anisotropy = anisotropy;
  return t;
}

function woodTexture(anisotropy) {
  const W = 512;
  const H = 512;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  const r = rand(11);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#b97a45');
  grad.addColorStop(1, '#a86a3a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const y0 = r() * H;
    const amp = 4 + r() * 10;
    const freq = 0.004 + r() * 0.01;
    const phase = r() * 10;
    ctx.strokeStyle = `rgba(${90 + r() * 30},${48 + r() * 20},${22},${0.15 + r() * 0.3})`;
    ctx.lineWidth = 1 + r() * 3;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1) * amp * 0.25;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 40, 1 / 40);
  t.anisotropy = anisotropy;
  return t;
}

export function createMaterials(renderer) {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const brushed = brushedTexture(aniso);

  const steel = new THREE.MeshPhysicalMaterial({
    name: 'Steel',
    color: 0xd4d9df,
    metalness: 1,
    roughness: 0.62,
    roughnessMap: brushed,
    bumpMap: brushed,
    bumpScale: 0.035,
  });
  const sliderSteel = steel.clone();
  sliderSteel.name = 'SliderSteel';
  sliderSteel.color.set(0xd9dee4);
  sliderSteel.emissive = new THREE.Color(0x000000);

  // Satin chrome where the scales are printed: less mirror-like so the ink always reads.
  const satin = new THREE.MeshPhysicalMaterial({
    name: 'ScaleSatin',
    color: 0xe3e6ea,
    metalness: 0.78,
    roughness: 0.46,
  });
  const satinSlider = satin.clone();

  const knurl = new THREE.MeshPhysicalMaterial({ name: 'Knurl', color: 0xb9bfc7, metalness: 1, roughness: 0.48 });
  const chrome = new THREE.MeshPhysicalMaterial({ name: 'Chrome', color: 0xf2f4f7, metalness: 1, roughness: 0.08 });
  const brass = new THREE.MeshPhysicalMaterial({ name: 'Brass', color: 0xd7a94b, metalness: 1, roughness: 0.28, side: THREE.DoubleSide });
  const copper = new THREE.MeshPhysicalMaterial({ name: 'Copper', color: 0xd88a5a, metalness: 1, roughness: 0.3, side: THREE.DoubleSide });
  const wood = new THREE.MeshStandardMaterial({ name: 'Wood', map: woodTexture(aniso), roughness: 0.72, metalness: 0 });
  const hatch = new THREE.MeshStandardMaterial({
    name: 'CutFace',
    map: hatchTexture(aniso),
    roughness: 0.6,
    metalness: 0,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const acrylic = new THREE.MeshPhysicalMaterial({
    name: 'Acrylic',
    color: 0xa9dcff,
    metalness: 0,
    roughness: 0.08,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const acrylicEdge = new THREE.LineBasicMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.55 });
  const holeWall = new THREE.MeshPhysicalMaterial({
    name: 'HoleWall',
    color: 0x7fb7e0,
    metalness: 0,
    roughness: 0.35,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Instanced tick marks: white base so per-instance colours show exactly.
  const ink = new THREE.MeshBasicMaterial({
    name: 'Ink',
    color: 0xffffff,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  return { aniso, steel, sliderSteel, satin, satinSlider, knurl, chrome, brass, copper, wood, hatch, acrylic, acrylicEdge, holeWall, ink };
}

const textCache = new Map();

/**
 * A crisp text label as a flat mesh. `height` is the em size in mm.
 * align: 'center' | 'left' | 'right' (relative to the mesh origin).
 */
export function textMesh(text, height, { color = '#14171c', weight = 600, align = 'center', aniso = 8, opacity = 1 } = {}) {
  const key = `${text}|${color}|${weight}`;
  let entry = textCache.get(key);
  if (!entry) {
    const px = 160;
    const measure = canvas(8, 8).getContext('2d');
    measure.font = `${weight} ${px}px ${FONT}`;
    const w = Math.ceil(measure.measureText(text).width + px * 0.16);
    const h = Math.ceil(px * 1.2);
    const c = canvas(w, h);
    const ctx = c.getContext('2d');
    ctx.font = `${weight} ${px}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + px * 0.04);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = aniso;
    entry = { texture, aspect: w / h };
    textCache.set(key, entry);
  }
  const planeH = height * 1.2;
  const planeW = planeH * entry.aspect;
  const geo = new THREE.PlaneGeometry(planeW, planeH);
  if (align === 'left') geo.translate(planeW / 2 - height * 0.08, 0, 0);
  if (align === 'right') geo.translate(-planeW / 2 + height * 0.08, 0, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: entry.texture,
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `Text "${text}"`;
  mesh.renderOrder = 2;
  return mesh;
}

/** Re-project UVs from positions so brushed streaks run along +X on every face. */
export function boxProjectUV(geometry) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (az >= ax && az >= ay) {
      uv[i * 2] = x;
      uv[i * 2 + 1] = y;
    } else if (ay >= ax) {
      uv[i * 2] = x;
      uv[i * 2 + 1] = z;
    } else {
      uv[i * 2] = z;
      uv[i * 2 + 1] = y;
    }
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}
