// The palm (নারকেল গাছ, as in চিত্র ৯.১০): a ringed trunk with a slight lean, a crown of feathered fronds that droop,
// a few coconuts. Procedural: one merged mesh per material (trunk, fronds, nuts). The same geometry, flipped upside
// down below the ground and see-through, is the image the eye believes it sees.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TREE } from './optics.js';

/** The trunk's line: from the foot (TREE.x, 0) up to the crown, leaning a little toward the eye. */
const CROWN_Y = 1.3;
const LEAN = TREE.x - TREE.topX; // how far the crown sits left of the foot
export const CROWN = new THREE.Vector3(TREE.topX, CROWN_Y, 0);
const trunkAt = (t, out) => out.set(TREE.x - LEAN * t ** 1.6, CROWN_Y * t, 0);

function barkTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9a7a55';
  ctx.fillRect(0, 0, 64, 64);
  // one ring per tile: a dark groove and a lighter swelling above it
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#6e5236');
  g.addColorStop(0.18, '#8a6a47');
  g.addColorStop(0.55, '#a8875f');
  g.addColorStop(1, '#7d5f3f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = 'rgba(60, 40, 22, 0.55)';
  ctx.fillRect(0, 0, 64, 4);
  for (let k = 0; k < 40; k++) {
    ctx.fillStyle = `rgba(70, 48, 28, ${0.08 + (k % 5) * 0.03})`;
    ctx.fillRect((k * 37) % 64, 6 + ((k * 13) % 50), 1.5, 4 + (k % 4));
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 14);
  return tex;
}

/** A frond's picture: a rib along the middle and many narrow leaflets, clear between them (alpha). u along, v across. */
function frondTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.lineCap = 'round';
  for (let side = -1; side <= 1; side += 2) {
    for (let k = 0; k < 34; k++) {
      const x0 = 14 + k * 14.4;
      const len = 58 * Math.sin(Math.PI * Math.min(1, (k + 2) / 36)) ** 0.7;
      const x1 = x0 + len * 0.62;
      const y1 = 64 + side * len * 0.95;
      const g = ctx.createLinearGradient(x0, 64, x1, y1);
      g.addColorStop(0, '#2f6a2a');
      g.addColorStop(1, k % 3 ? '#5e9f3e' : '#4f8f37');
      ctx.strokeStyle = g;
      ctx.lineWidth = 5.2;
      ctx.beginPath();
      ctx.moveTo(x0, 64);
      ctx.quadraticCurveTo(x0 + len * 0.2, 64 + side * len * 0.55, x1, y1);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = '#7d8a3a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.lineTo(512, 64);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** The trunk: rings of vertices along the curve, a little wider at the foot. */
function trunkGeometry() {
  const ALONG = 22;
  const AROUND = 12;
  const pos = [];
  const uv = [];
  const idx = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= ALONG; i++) {
    const t = i / ALONG;
    trunkAt(t, p);
    const r = 0.045 + 0.022 * (1 - t) ** 3 + 0.012 * (1 - t);
    for (let j = 0; j <= AROUND; j++) {
      const a = (j / AROUND) * Math.PI * 2;
      pos.push(p.x + Math.cos(a) * r, p.y, p.z + Math.sin(a) * r);
      uv.push(j / AROUND, t);
    }
  }
  for (let i = 0; i < ALONG; i++)
    for (let j = 0; j < AROUND; j++) {
      const a = i * (AROUND + 1) + j;
      const b = a + AROUND + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * One frond: a strip along a drooping curve, folded a little along its rib (a shallow V) so it has depth from the
 * side. az: its direction round the crown; rise: how steeply it starts up; len: its length.
 */
function frondGeometry(az, rise, len, droop) {
  const SEG = 16;
  const pos = [];
  const uv = [];
  const idx = [];
  const dir = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
  const side = new THREE.Vector3(-dir.z, 0, dir.x);
  for (let i = 0; i <= SEG; i++) {
    const s = i / SEG;
    const h = len * s;
    const y = len * (rise * s - droop * s * s);
    const w = 0.17 * Math.sin(Math.PI * Math.min(1, s * 0.95 + 0.04)) ** 0.6;
    const fold = w * 0.35; // the leaflets hang below the rib
    const cx = CROWN.x + dir.x * h;
    const cz = CROWN.z + dir.z * h;
    const cy = CROWN.y + 0.03 + y;
    pos.push(cx + side.x * w, cy - fold, cz + side.z * w);
    pos.push(cx, cy, cz);
    pos.push(cx - side.x * w, cy - fold, cz - side.z * w);
    uv.push(s, 1, s, 0.5, s, 0);
  }
  for (let i = 0; i < SEG; i++) {
    const a = i * 3;
    const b = a + 3;
    idx.push(a, b, a + 1, b, b + 1, a + 1, a + 1, b + 1, a + 2, b + 1, b + 2, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function crownGeometry() {
  const parts = [];
  // a lower ring that droops and an upper ring that rises more (the top of the crown), turned between each other
  const LOW = 8;
  for (let k = 0; k < LOW; k++) parts.push(frondGeometry((k / LOW) * Math.PI * 2 + 0.2, 0.42, 0.74 - (k % 2) * 0.06, 1.05));
  const HIGH = 6;
  for (let k = 0; k < HIGH; k++) parts.push(frondGeometry((k / HIGH) * Math.PI * 2 + 0.65, 0.95, 0.5, 1.15));
  return mergeGeometries(parts);
}

function nutsGeometry() {
  const parts = [];
  const at = [
    [0.05, -0.05, 0.03],
    [-0.04, -0.06, 0.04],
    [0.0, -0.06, -0.05],
    [-0.05, -0.04, -0.02],
  ];
  for (const [x, y, z] of at) {
    const s = new THREE.SphereGeometry(0.038, 14, 10);
    s.scale(1, 1.15, 1);
    s.translate(CROWN.x + x, CROWN.y + y, CROWN.z + z);
    parts.push(s);
  }
  return mergeGeometries(parts);
}

export function createPalm() {
  const trunkGeo = trunkGeometry();
  const crownGeo = crownGeometry();
  const nutsGeo = nutsGeometry();
  const bark = barkTexture();
  const leaf = frondTexture();
  const trunkMat = new THREE.MeshStandardMaterial({ name: 'Bark', map: bark, bumpMap: bark, bumpScale: 2, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ name: 'Frond', map: leaf, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75 });
  const nutMat = new THREE.MeshStandardMaterial({ name: 'Coconut', color: '#5d6b2a', roughness: 0.55 });

  const tree = new THREE.Group();
  tree.name = 'Palm';
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  const crown = new THREE.Mesh(crownGeo, leafMat);
  const nuts = new THREE.Mesh(nutsGeo, nutMat);
  for (const m of [trunk, crown, nuts]) {
    m.castShadow = true;
    m.receiveShadow = true;
    tree.add(m);
  }

  // the image: the same shapes upside down, hanging from the ground line, pale and see-through (প্রতিবিম্ব (অবাস্তব))
  const ghostOf = (src, extra = {}) =>
    new THREE.MeshBasicMaterial({
      name: `${src.name}Image`,
      color: '#d7ecff',
      map: src.map,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      ...extra,
    });
  const ghostMats = [ghostOf(trunkMat), ghostOf(leafMat, { alphaTest: 0.2, side: THREE.DoubleSide }), ghostOf(nutMat, { color: '#b9d3c0' })];
  // a pale, light-filled copy: the dark bark and fronds lifted (colours above 1, not tone mapped) so it reads on the blue
  ghostMats[0].color.setRGB(1.6, 1.75, 1.95);
  ghostMats[1].color.setRGB(1.9, 2.2, 2.1);
  const ghost = new THREE.Group();
  ghost.name = 'PalmImage';
  ghost.userData.noExport = true;
  [trunkGeo, crownGeo, nutsGeo].forEach((g, k) => {
    const m = new THREE.Mesh(g, ghostMats[k]);
    m.renderOrder = 5;
    ghost.add(m);
  });
  ghost.visible = false;

  /** a: 0…1 how much the image shows; s: its height as a part of the tree's (the ray decides it); wobble: the shimmer, 0…1. */
  function setImage(a, s, wobble = 0) {
    ghost.visible = a > 0.01;
    if (!ghost.visible) return;
    for (const m of ghostMats) m.opacity = 0.5 * a;
    // the fronds' leaflets are cut out by their alpha: test against the faded opacity, never 0 (no shader change)
    ghostMats[1].alphaTest = Math.max(0.02, 0.45 * 0.5 * a);
    // flipped about the ground: y → −s·y; a shimmer squeezes it sideways for a moment as it appears
    const w = 1 + 0.06 * Math.sin(wobble * Math.PI * 6) * (1 - wobble);
    ghost.scale.set(w, -s, 1);
    ghost.position.x = TREE.x * (1 - w);
  }
  return { tree, ghost, setImage, trunk, crown };
}
