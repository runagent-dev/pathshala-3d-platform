// The setting: a calm deep-blue backdrop (a gradient, as in equations-of-motion) and a plain round table top in a quiet
// sand colour. Nothing else.
import * as THREE from 'three';

export const BG = ['#0b2a5b', '#123d7a'];

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

export function createTable() {
  const root = new THREE.Group();
  root.name = 'Table';
  root.userData.noExport = true;
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.25, 0.03, 96),
    new THREE.MeshStandardMaterial({ name: 'TableTop', color: '#a3927a', roughness: 0.85, metalness: 0 }),
  );
  top.position.y = -0.015;
  top.receiveShadow = true;
  const edge = new THREE.Mesh(
    new THREE.CylinderGeometry(1.252, 1.24, 0.03, 96, 1, true),
    new THREE.MeshStandardMaterial({ name: 'TableEdge', color: '#7d6e5b', roughness: 0.85 }),
  );
  edge.position.y = -0.016;
  root.add(top, edge);
  return { root };
}
