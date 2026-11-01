// The F, s and d arrows: thick, in flat colour inside an outline, drawn over the scenery (no depth test), so the
// orange F never melts into the red bricks or the crate, and the blue s and grey d stay crisp on the white tape.
// F has a white outline (it stands over the teal wall, the sky and the bricks); s and d a dark one (they lie on the
// white tape). One material per colour is shared by every arrow of that colour.
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
 * A bold arrow: `r` is the shaft's radius (the head `head` long and `headR` wide; by default 5.2 r and 2.7 r); the
 * outline is `pad` wider all round. set(from, dir, length) and hide() as the kit's arrow.
 */
export function boldArrow(name, color, r, { head = r * 5.2, headR = r * 2.7, outline = '#ffffff', pad = r * 0.6, segments = 16, order = 20 } = {}) {
  const core = createArrow({ name, radius: r, head, headRadius: headR, material: flat(color), segments });
  const edge = createArrow({
    name: `${name}Outline`,
    radius: r + pad,
    head: head + pad * 2.8,
    headRadius: headR + pad * 2,
    material: flat(outline),
    segments,
  });
  // the outline first, the colour over it (both drawn after the scene: no depth test)
  for (const m of edge.root.children) m.renderOrder = order;
  for (const m of core.root.children) m.renderOrder = order + 1;
  core.root.add(edge.root);
  core.root.traverse((m) => {
    if (m instanceof THREE.Mesh) m.castShadow = m.receiveShadow = false;
  });
  const from = new THREE.Vector3(0, -pad, 0);
  return {
    ...core,
    set(at, dir, length) {
      core.set(at, dir, length);
      if (length > 1e-9) edge.set(from, UPV, length + pad * 2.2);
      else edge.hide();
    },
  };
}
