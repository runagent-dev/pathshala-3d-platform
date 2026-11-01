// The arrows on the scene: a bold core in flat colour inside a white outline, drawn over the scenery (no depth test),
// so a dark force arrow never melts into a dark corner and a teal or blue one stays clear over the cement and the
// sand-coloured walls. One material per colour is shared by every arrow of that colour.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
const UP = new THREE.Vector3(0, 1, 0);
const ZERO = new THREE.Vector3();
const FLAT = new Map();
/** A flat, unlit material that draws over everything (shared per colour and opacity). */
function flat(color, opacity) {
  const key = `${color}|${opacity}`;
  if (!FLAT.has(key))
    FLAT.set(
      key,
      new THREE.MeshBasicMaterial({
        name: `Arrow ${color}`,
        color,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        fog: false,
        transparent: true,
        opacity,
      }),
    );
  return FLAT.get(key);
}

/**
 * An arrow in `color` with a white outline (`edgeColor` to change it), `opacity` < 1 for a faint copy.
 * set(from, dir, length) as the kit's arrow (head included in the length); hide().
 */
export function createVector(color, name, edgeColor = '#ffffff', opacity = 1) {
  const edge = createArrow({ name: `${name}Outline`, material: flat(edgeColor, opacity), radius: 0.05, head: 0.205, headRadius: 0.118 });
  const ink = createArrow({ name, material: flat(color, opacity), radius: 0.031, head: 0.18, headRadius: 0.088 });
  const root = new THREE.Group();
  root.name = name;
  root.visible = false;
  root.add(edge.root, ink.root);
  for (const o of edge.root.children) o.renderOrder = 8;
  for (const o of ink.root.children) o.renderOrder = 9;
  const tip = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const back = new THREE.Vector3(0, -0.02, 0); // the outline starts a little behind the tail and ends past the tip
  return {
    root,
    material: ink.root.children[0].material,
    tip,
    set(from, dir, length) {
      root.visible = length > 1e-9 && dir.lengthSq() > 1e-12;
      root.position.copy(from);
      direction.copy(dir).normalize();
      root.quaternion.setFromUnitVectors(UP, direction);
      edge.set(back, UP, length + 0.045);
      ink.set(ZERO, UP, length);
      tip.copy(from).addScaledVector(direction, length);
    },
    hide() {
      root.visible = false;
    },
  };
}
