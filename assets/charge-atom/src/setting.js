// The setting: a calm deep-blue backdrop (a gradient, as in equations-of-motion) and, under the atom model, a plain
// round display stand in a quiet sand colour that catches the model's soft shadow. Nothing else.
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

/** A round display stand (cm): a wide low base and a lighter top with a rounded edge. Its top is at y = 0. */
export function createStand() {
  const root = new THREE.Group();
  root.name = 'Stand';
  root.userData.noExport = true;
  const sand = new THREE.MeshStandardMaterial({ name: 'StandTop', color: '#bfa982', roughness: 0.82, metalness: 0 });
  const dark = new THREE.MeshStandardMaterial({ name: 'StandBase', color: '#8e7b5e', roughness: 0.85, metalness: 0 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.2, 0.9, 72), sand);
  top.position.y = -0.45;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(9.02, 0.22, 6, 72), sand);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = -0.22;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(10, 10.4, 1.3, 72), dark);
  base.position.y = -1.55;
  for (const m of [top, base]) m.receiveShadow = true;
  root.add(top, lip, base);
  return { root };
}
