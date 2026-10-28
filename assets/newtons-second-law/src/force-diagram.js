import * as THREE from 'three';
import { createVector } from './arrow.js';
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
export function createForceDiagram() {
  const root = new THREE.Group();
  root.name = 'LiveFreeBodyDiagram';
  root.visible = false;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 18, 12), new THREE.MeshBasicMaterial({ color: '#fff5c4' }));
  root.add(dot);
  const colors = { F1: '#ffb347', F2: '#ffb347', friction: '#ff466f', contact: '#ffb347', normal: '#54d5ff', weight: '#b99aff' };
  const arrows = Object.fromEntries(Object.entries(colors).map(([key, color]) => [key, createVector(color, `Diagram_${key}`)]));
  for (const a of Object.values(arrows)) root.add(a.root);
  let values = {};
  return {
    root,
    arrows,
    get values() {
      return values;
    },
    set(front, balance, beside = false) {
      root.position.set(beside ? front + 1.4 : front - 0.65, beside ? 1.05 : 2.65, beside ? 0 : 0.3);
      values = balance;
      for (const [key, a] of Object.entries(arrows)) {
        const value = balance[key];
        if (Math.abs(value) < 1e-8) {
          a.hide();
          continue;
        }
        const vertical = key === 'normal' || key === 'weight';
        const y = key === 'F1' ? 0.18 : key === 'F2' ? -0.18 : key === 'friction' ? -0.18 : key === 'contact' ? -0.35 : 0;
        const length = vertical ? 0.68 : 0.25 + Math.min(0.8, Math.abs(value) * 0.0045);
        a.set(v(0, y), vertical ? v(0, key === 'normal' ? 1 : -1) : v(Math.sign(value), 0), length);
      }
    },
    point(key) {
      root.updateMatrixWorld(true);
      return root.localToWorld(arrows[key].tip.clone());
    },
  };
}
