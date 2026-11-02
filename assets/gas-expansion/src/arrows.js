// The arrows on the picture: bold, in flat colour inside a white outline, drawn over the picture (no depth test, like
// a diagram on a photo), so the green F_P, the blue F_S and the orange x read on the wooden bench, the yellow ruler,
// the hand and the light blue wall alike. The outline is a slightly larger arrow drawn first; it is not exported.
// Each arrow has its own two materials, so a letter tapped in the formula can light its arrows alone: the outline
// turns from white to a warm yellow glow (glow(k), 0 … 1).
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';

const UP = new THREE.Vector3(0, 1, 0);
const WHITE = new THREE.Color('#ffffff');
const GLOW = new THREE.Color('#ffd43b');

const flat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });

/**
 * A bold outlined arrow with the kit arrow's interface: set(from, dir, length), hide(), root, glow(k).
 * `radius` is the shaft's; the outline is `pad` wider all round.
 * @param {string} name
 * @param {THREE.ColorRepresentation} color
 * @param {{ radius?: number, head?: number, headRadius?: number, pad?: number, order?: number }} [options]
 */
export function outlinedArrow(
  name,
  color,
  { radius = 0.0045, head = radius * 5.6, headRadius = radius * 2.5, pad = radius * 0.62, order = 10 } = {},
) {
  const coreMat = flat(color);
  const lineMat = flat('#ffffff');
  const core = createArrow({ name, radius, head, headRadius, material: coreMat, segments: 14 });
  const outline = createArrow({
    name: `${name}Outline`,
    radius: radius + pad,
    head: head + pad * 2.6,
    headRadius: headRadius + pad * 1.9,
    material: lineMat,
    segments: 14,
  });
  outline.root.userData.noExport = true;
  // the outline first, the colour over it
  for (const m of outline.root.children) m.renderOrder = order;
  for (const m of core.root.children) m.renderOrder = order + 1;
  core.root.add(outline.root);
  const back = new THREE.Vector3(0, -pad, 0);
  return {
    root: core.root,
    material: coreMat,
    set(/** @type {THREE.Vector3} */ from, /** @type {THREE.Vector3} */ dir, /** @type {number} */ length) {
      core.set(from, dir, length);
      if (length > 1e-9) outline.set(back, UP, length + pad * 2.2);
      else outline.hide();
    },
    hide: () => core.hide(),
    /** 0: a white outline … 1: a yellow glow round the arrow. */
    glow(/** @type {number} */ k) {
      lineMat.color.copy(WHITE).lerp(GLOW, k);
    },
  };
}
