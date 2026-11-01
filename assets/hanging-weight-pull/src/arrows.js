// The force and acceleration arrows of the well and of the book's examples: thick, in flat colour inside a white
// outline, drawn over the scenery (no depth test), so an orange T never melts into an orange wall and a teal a stays
// clear over the water. One material per colour is shared by every arrow of that colour.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';

const UPV = new THREE.Vector3(0, 1, 0);
const FLAT = new Map();
/** A flat, unlit material that draws over everything (shared per colour). */
function flat(color) {
  if (!FLAT.has(color))
    FLAT.set(color, new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
  return FLAT.get(color);
}

/**
 * A bold arrow: `r` is the shaft's radius (the head is 5.2 r long and 2.7 r wide); the white outline is 0.6 r wider all
 * round. set(from, dir, length) as the kit's arrow; scale(thick, pulse) makes it thicker (not longer) by `thick`
 * and everything larger by `pulse`.
 */
export function boldArrow(name, color, r = 0.03, { segments = 16, order = 20 } = {}) {
  const core = createArrow({ name, radius: r, head: r * 5.2, headRadius: r * 2.7, material: flat(color), segments });
  const pad = r * 0.6;
  const outline = createArrow({
    name: `${name}Outline`,
    radius: r + pad,
    head: r * 5.2 + pad * 2.8,
    headRadius: r * 2.7 + pad * 2,
    material: flat('#ffffff'),
    segments,
  });
  // the outline first, the colour over it (both drawn after the scene: no depth test)
  for (const m of outline.root.children) m.renderOrder = order;
  for (const m of core.root.children) m.renderOrder = order + 1;
  core.root.add(outline.root);
  const from = new THREE.Vector3(0, -pad, 0);
  return {
    ...core,
    scale(thick = 1, pulse = 1) {
      core.root.scale.set(thick * pulse, pulse, thick * pulse);
    },
    set(at, dir, length) {
      core.set(at, dir, length);
      if (length > 1e-9) outline.set(from, UPV, length + pad * 2.2);
      else outline.hide();
    },
  };
}
