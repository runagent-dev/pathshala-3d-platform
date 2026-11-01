// The force arrows: bold, in flat colour inside a white outline, drawn over the picture (no depth test, like a diagram
// on a photo), so the orange T, the violet W and the black resultant read on the blue-grey wall, the wooden bench and
// the steel ball alike. The outline is a slightly larger white arrow drawn first; it is not exported to the GLB.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';

const UP = new THREE.Vector3(0, 1, 0);
const FLAT = new Map();
/** A flat, unlit material that draws over everything; shared per colour unless `own` (an arrow that fades alone). */
function flat(color, own = false) {
  const make = () => new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
  if (own) return make();
  if (!FLAT.has(color)) FLAT.set(color, make());
  return FLAT.get(color);
}

/**
 * A bold outlined arrow with the kit arrow's interface: set(from, dir, length), hide(), tip, root, setOpacity(a) (only
 * with `own`: the arrow has its own materials). `radius` is the shaft's; the outline is `pad` wider all round.
 * @param {string} name
 * @param {THREE.ColorRepresentation} color
 * @param {{ radius?: number, head?: number, headRadius?: number, pad?: number, own?: boolean, order?: number }} [options]
 */
export function outlinedArrow(
  name,
  color,
  { radius = 0.0055, head = radius * 5.6, headRadius = radius * 2.5, pad = radius * 0.62, own = false, order = 10 } = {},
) {
  const coreMat = flat(color, own);
  const lineMat = flat('#ffffff', own);
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
    tip: core.tip,
    set(from, dir, length) {
      core.set(from, dir, length);
      if (length > 1e-9) outline.set(back, UP, length + pad * 2.2);
      else outline.hide();
    },
    hide: () => core.hide(),
    setOpacity(a) {
      if (!own) return;
      coreMat.opacity = a;
      lineMat.opacity = a;
    },
  };
}
