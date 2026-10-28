// A dashed arrow: the same cone head as the kit's arrow but a shaft of short dashes. The two forces of a pair are the
// same kind of force, so they have the same colour; the one is drawn solid and the other dashed (with the same swatch
// in its label), so they are told apart by more than colour. API as the kit's createArrow: set(from, dir, length),
// hide(), root, tip, material.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';

const UP = new THREE.Vector3(0, 1, 0);

export function createDashedArrow({
  color,
  radius = 0.016,
  head = 0.1,
  headRadius = 0.05,
  dash = 0.075,
  gap = 0.05,
  max = 14,
  name = 'DashedArrow',
  material: suppliedMaterial,
}) {
  const material =
    suppliedMaterial ||
    new THREE.MeshStandardMaterial({
      name: `${name}Material`,
      color,
      roughness: 0.45,
      metalness: 0,
      emissive: color,
      emissiveIntensity: 0.2,
    });
  const root = new THREE.Group();
  root.name = name;
  root.visible = false;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 24).translate(0, head / 2, 0), material);
  const unit = new THREE.CylinderGeometry(radius, radius, 1, 12).translate(0, 0.5, 0);
  const dashes = Array.from({ length: max }, () => {
    const m = new THREE.Mesh(unit, material);
    m.visible = false;
    root.add(m);
    return m;
  });
  root.add(cone);
  const tip = new THREE.Vector3();
  const d = new THREE.Vector3();
  return {
    root,
    material,
    tip,
    set(from, dir, length) {
      tip.copy(from);
      const n = dir.length();
      root.visible = length > 1e-9 && n > 1e-12;
      if (!root.visible) return;
      d.copy(dir).divideScalar(n);
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, d);
      const h = Math.min(head, length * 0.6);
      const body = length - h;
      cone.position.y = body;
      cone.scale.setScalar(h / head);
      let y = 0;
      for (const m of dashes) {
        if (y >= body - 1e-6) {
          m.visible = false;
          continue;
        }
        const len = Math.min(dash, body - y);
        m.visible = true;
        m.position.y = y;
        m.scale.set(1, len, 1);
        y += dash + gap;
      }
      tip.addScaledVector(d, length);
    },
    hide() {
      root.visible = false;
    },
  };
}

// Bold, unlit vector colours with a dark casing remain readable over water, wood and clothing.
// The casing follows the exact same length and dashed pattern; it does not change the force pair.
export function createLessonArrow({ name, color, dashed = false }) {
  const root = new THREE.Group();
  root.name = name;
  root.visible = false;
  root.userData.noExport = true;
  const make = dashed ? createDashedArrow : createArrow;
  const material = new THREE.MeshBasicMaterial({ name: `${name}Colour`, color, depthTest: false, depthWrite: false, toneMapped: false });
  const casing = new THREE.MeshBasicMaterial({ name: `${name}Casing`, color: '#142b46', depthTest: false, depthWrite: false, toneMapped: false });
  const dimensions = { head: 0.23, dash: 0.12, gap: 0.075 };
  const edge = make({ ...dimensions, name: `${name}Outline`, radius: 0.063, headRadius: 0.14, material: casing });
  const ink = make({ ...dimensions, name: `${name}Fill`, radius: 0.043, headRadius: 0.11, material });
  edge.root.traverse((object) => {
    object.renderOrder = 9;
  });
  ink.root.traverse((object) => {
    object.renderOrder = 10;
  });
  root.add(edge.root, ink.root);
  return {
    root,
    material,
    tip: ink.tip,
    set(from, dir, length) {
      edge.set(from, dir, length);
      ink.set(from, dir, length);
      root.visible = ink.root.visible;
    },
    hide() {
      root.visible = false;
      edge.hide();
      ink.hide();
    },
  };
}
