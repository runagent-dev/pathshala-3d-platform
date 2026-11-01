import * as THREE from 'three';
import { createVector } from './arrow.js';
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
export const DIAGRAM_COLORS = { F1: '#e8590c', F2: '#e8590c', friction: '#d6336c', contact: '#e8590c', normal: '#0b7285', weight: '#7048e8' };
/** The same, dark enough for text on a white chip (4.5:1). */
export const DIAGRAM_TEXT = { F1: '#a8440a', F2: '#a8440a', friction: '#a61e4d', contact: '#a8440a', normal: '#0b6070', weight: '#5f3dc4' };
export function createForceDiagram() {
  const root = new THREE.Group();
  root.name = 'LiveFreeBodyDiagram';
  root.visible = false;
  // the body as a dot: dark, ringed in white (it sits over the sand-coloured wall)
  const ring = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 16, 10),
    new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false, toneMapped: false }),
  );
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.062, 16, 10),
    new THREE.MeshBasicMaterial({ color: '#212529', depthTest: false, toneMapped: false }),
  );
  ring.renderOrder = 10;
  dot.renderOrder = 11;
  root.add(ring, dot);
  // the pushes in the push's orange, friction red, the ground's support cyan, the weight in gravity's violet
  // (docs/book-notes.md), each named in its label too
  const colors = DIAGRAM_COLORS;
  const arrows = Object.fromEntries(Object.entries(colors).map(([key, color]) => [key, createVector(color, `Diagram_${key}`)]));
  for (const a of Object.values(arrows)) root.add(a.root);
  const tips = Object.fromEntries(Object.keys(colors).map((k) => [k, new THREE.Vector3()]));
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
    /** Where an arrow's tip is now (world space; the same vector each call for that arrow). */
    point(key) {
      root.updateMatrixWorld(true);
      return root.localToWorld(tips[key].copy(arrows[key].tip));
    },
  };
}
