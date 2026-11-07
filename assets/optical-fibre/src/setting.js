// The setting: a calm deep-blue backdrop (a vertical gradient, as in equations-of-motion) and a plain, finite table top in
// a quiet light-sand colour with a rounded edge, sitting in the blue. Nothing else.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const BG = ['#0b2a5b', '#123d7a'];

/** The backdrop: a vertical gradient (a small power-of-two canvas, made once). */
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

/** The table top (cm): 150 × 56, 3 thick, its top at y = 0. */
export function createTable() {
  const top = new THREE.Mesh(
    new RoundedBoxGeometry(150, 3, 56, 3, 1.2),
    new THREE.MeshStandardMaterial({ name: 'TableTop', color: '#cbb791', roughness: 0.82, metalness: 0 }),
  );
  top.name = 'Table';
  top.position.set(4, -1.5, -4);
  top.receiveShadow = true;
  top.userData.noExport = true;
  return { root: top };
}
