// Bold arrows with a dark casing, drawn over everything (unlit colour), so they read on wood, glass, water, the
// balloon and the blue wall alike. A pair of forces of the same kind has one colour: the one solid, the other dashed
// (as in newtons-third-law), so they differ by more than colour. set(from, dir, length) as the kit's createArrow.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';

const UP = new THREE.Vector3(0, 1, 0);
const CASING = '#13213a';

function dashedArrow({ radius, head, headRadius, dash, gap, material, name, max = 16 }) {
  const root = new THREE.Group();
  root.name = name;
  root.visible = false;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 20).translate(0, head / 2, 0), material);
  const unit = new THREE.CylinderGeometry(radius, radius, 1, 10).translate(0, 0.5, 0);
  const dashes = Array.from({ length: max }, () => {
    const m = new THREE.Mesh(unit, material);
    root.add(m);
    return m;
  });
  root.add(cone);
  const d = new THREE.Vector3();
  return {
    root,
    set(from, dir, length) {
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
        m.visible = y < body - 1e-6;
        if (!m.visible) continue;
        m.position.y = y;
        m.scale.set(1, Math.min(dash, body - y), 1);
        y += dash + gap;
      }
    },
  };
}

/**
 * @param {{ name: string, color: string, size?: number, dashed?: boolean, order?: number }} o
 *   size: the shaft's radius in scene units; everything else scales with it.
 */
export function boldArrow({ name, color, size = 0.0045, dashed = false, order = 20 }) {
  const root = new THREE.Group();
  root.name = name;
  root.visible = false;
  root.userData.noExport = true;
  const ink = new THREE.MeshBasicMaterial({ name: `${name}Ink`, color, depthTest: false, depthWrite: false, toneMapped: false, transparent: true });
  const edge = new THREE.MeshBasicMaterial({
    name: `${name}Casing`,
    color: CASING,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    transparent: true,
  });
  const e = size * 0.55; // casing width
  const dims = (r) => ({
    radius: r,
    head: size * 5.6 + (r - size) * 2,
    headRadius: size * 2.7 + (r - size) * 1.6,
    dash: size * 4 + 2 * (r - size),
    gap: size * 2.6 - 2 * (r - size),
  }); // casing dashes wrap the ink's
  const make = (r, material, part) =>
    dashed ? dashedArrow({ ...dims(r), material, name: `${name}${part}` }) : createArrow({ ...dims(r), material, name: `${name}${part}` });
  const outer = make(size + e, edge, 'Casing');
  const inner = make(size, ink, 'Fill');
  outer.root.traverse((o) => (o.renderOrder = order));
  inner.root.traverse((o) => (o.renderOrder = order + 1));
  root.add(outer.root, inner.root);
  const back = new THREE.Vector3();
  const from0 = new THREE.Vector3();
  const tip = new THREE.Vector3();
  const unit = new THREE.Vector3();
  let alpha = 1;
  return {
    root,
    /** Draws it from `from` along `dir`, `length` long; opacity 0…1 fades it. */
    set(from, dir, length, opacity = 1) {
      unit.copy(dir).normalize();
      const on = length > 1e-6 && opacity > 0.01;
      root.visible = on;
      if (!on) return;
      from0.copy(from);
      tip.copy(from).addScaledVector(unit, length);
      back.copy(from).addScaledVector(unit, -e);
      outer.set(back, unit, length + 2 * e);
      inner.set(from, unit, length);
      if (opacity !== alpha) {
        alpha = opacity;
        ink.opacity = edge.opacity = opacity;
      }
    },
    hide() {
      root.visible = false;
    },
    /** Its two ends in world space (while shown), e.g. to keep labels off it. */
    ends() {
      if (!root.visible || !root.parent) return null;
      return [root.parent.localToWorld(from0.clone()), root.parent.localToWorld(tip.clone())];
    },
  };
}
