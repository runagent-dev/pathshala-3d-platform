// The pulls: thick arrows in flat colour inside a white outline, drawn over the scenery (no depth test), so a violet
// pull stays clear over the ochre wall, the iron, the blue sea and the orange cut faces of the Earth alike. One
// material per colour, shared by every arrow of that colour. (The idea of hanging-weight-pull's arrows: figures
// never import from each other.)
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
 * A bold arrow: `r` is the shaft's radius (the head is 5.2 r long and 2.7 r wide); the white outline is 0.6 r wider
 * all round. set(from, dir, length) and hide() as the kit's arrow. `order`: arrows with a higher order are drawn
 * over those with a lower one (the faint arrows of the moment before go under the new ones).
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
  outline.root.userData.noExport = true;
  // the outline first, the colour over it (both drawn after the scene: no depth test)
  for (const m of outline.root.children) m.renderOrder = order;
  for (const m of core.root.children) m.renderOrder = order + 1;
  core.root.add(outline.root);
  const from = new THREE.Vector3(0, -pad, 0);
  return {
    ...core,
    set(at, dir, length) {
      core.set(at, dir, length);
      if (length > 1e-9) outline.set(from, UPV, length + pad * 2.2);
      else outline.hide();
    },
  };
}
