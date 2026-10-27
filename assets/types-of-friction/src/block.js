// The wooden block (real size in metres): 0.2 m long, 0.12 m high and 0.14 m deep, a solid piece of wood of 2 kg with
// "২ কেজি" painted on the front, the same block as in the sister figure friction-force. setMass(kg) puts 1 kg brass
// weights on top (3 kg: one, 4 kg: two) for the test. Origin: on the floor under the middle of the block, +x to the
// right (the way it is pushed), +y up.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';

export const BLOCK = { L: 0.2, H: 0.12, D: 0.14, mass: 2 };
const WEIGHT = { r: 0.032, h: 0.034 }; // a 1 kg brass weight
const mat = (name, color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness });

/** Plain wood: long grain along the block, a few darker streaks (a canvas, so the figure has no image files). */
function woodTexture() {
  const W = 256;
  const H = 128;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  let seed = 9;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  ctx.fillStyle = '#d8ad72';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) {
    const y = rnd() * H;
    ctx.strokeStyle = `rgba(120,78,36,${0.08 + rnd() * 0.2})`;
    ctx.lineWidth = 0.6 + rnd() * 1.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(W * 0.3, y + (rnd() - 0.5) * 6, W * 0.65, y + (rnd() - 0.5) * 6, W, y + (rnd() - 0.5) * 3);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * @param {{ t: (key: string, vars?: object) => string }} options
 */
export function createBlock({ t }) {
  const root = new THREE.Group();
  root.name = 'WoodenBlock';
  const body = new THREE.Group();
  body.name = 'BlockBody';
  root.add(body);
  const { L, H, D } = BLOCK;
  const wood = new THREE.MeshStandardMaterial({ name: 'BlockWood', map: woodTexture(), roughness: 0.78, metalness: 0 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(L, H, D), wood);
  block.position.y = H / 2;
  block.name = 'Block';
  body.add(block);

  // the stencil: the mass, painted on the front
  const stencil = textMesh(t('block_kg', { m: BLOCK.mass }), 0.036, { color: '#3a2a16', weight: 700 });
  stencil.position.set(0, H * 0.5, D / 2 + 0.0015);
  stencil.name = 'Stencil';
  body.add(stencil);

  // 1 kg weights on top (for the test): brass cylinders with a knob and their mass on the front
  const brass = mat('Brass', '#c8a24c', 0.35, 0.75);
  const weights = new THREE.Group();
  weights.name = 'Weights';
  body.add(weights);
  for (let i = 0; i < 2; i++) {
    const w = new THREE.Group();
    w.name = `Weight${i + 1}`;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(WEIGHT.r, WEIGHT.r, WEIGHT.h, 28), brass);
    cyl.position.y = WEIGHT.h / 2;
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.01, 12), brass);
    knob.position.y = WEIGHT.h + 0.005;
    const label = textMesh(t('block_kg', { m: 1 }), 0.015, { color: '#3b2e0e', weight: 700 });
    label.position.set(0, WEIGHT.h / 2, WEIGHT.r + 0.0012);
    w.add(cyl, knob, label);
    w.position.y = H + i * (WEIGHT.h + 0.004);
    w.visible = false;
    weights.add(w);
  }

  const hit = new THREE.Mesh(new THREE.BoxGeometry(L + 0.06, H + 0.07, D + 0.05), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, (H + 0.07) / 2 - 0.005, 0);
  hit.userData.noExport = true;
  root.add(hit);

  const box = new THREE.Box3();
  const tmpBox = new THREE.Box3();
  let extra = 0;
  /** The block with (kg − 2) one-kilogram weights on top. */
  function setMass(kg) {
    extra = Math.max(0, Math.min(2, Math.round(kg - BLOCK.mass)));
    weights.children.forEach((w, i) => {
      w.visible = i < extra;
    });
  }
  setMass(BLOCK.mass);

  return {
    root,
    body,
    hit,
    setMass,
    /** What shows now (the block and the weights on it), as a box in the world: for the action's ring. */
    box() {
      box.setFromObject(block);
      for (const w of weights.children) if (w.visible) box.union(tmpBox.setFromObject(w));
      return box;
    },
    /** The block's size (metres). */
    size: () => ({ L, H, D }),
    /** The height of the top of everything on the floor (the block and its weights). */
    top: () => H + (extra ? extra * (WEIGHT.h + 0.004) + 0.01 : 0),
  };
}
