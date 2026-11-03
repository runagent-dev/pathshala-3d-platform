// Arrows over the picture: thick flat colour in a white outline with a thin dark edge, so they read on the paper,
// the skin and the warm backdrop alike (after torricelli-water-barometer). The blown air's arrow, and the λ bracket.
// The kit's createArrow, three layers.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';

const EDGE = '#10213a';
const flat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });

const UP = new THREE.Vector3(0, 1, 0);
const OUT_FROM = new THREE.Vector3();

/**
 * A bold arrow: `r` is the shaft's radius (m). `set(from, dir, length)` as the kit's arrow; `scale(k)` thickens it
 * (the figure keeps arrows a few pixels thick however far the camera is); `setOpacity(a)` fades all three layers.
 */
export function boldArrow(name, color, r, { order = 30 } = {}) {
  const core = createArrow({ name, radius: r, head: r * 4.6, headRadius: r * 2.6, material: flat(color) });
  const pad = r * 0.7;
  const white = createArrow({
    name: `${name}Outline`,
    radius: r + pad,
    head: r * 4.6 + pad * 2.6,
    headRadius: r * 2.6 + pad * 1.9,
    material: flat('#ffffff'),
  });
  const edge = r * 0.42;
  const dark = createArrow({
    name: `${name}Edge`,
    radius: r + pad + edge,
    head: r * 4.6 + (pad + edge) * 2.6,
    headRadius: r * 2.6 + (pad + edge) * 1.9,
    material: flat(EDGE),
  });
  // draw order (no depth test): the dark edge first, the white outline over it, the colour on top
  for (const [a, k] of [
    [dark, 0],
    [white, 1],
    [core, 2],
  ])
    for (const m of [...a.root.children]) m.renderOrder = order + k;
  core.root.add(white.root, dark.root);
  core.root.userData.noExport = true;
  let k = 1;
  return {
    root: core.root,
    tip: core.tip,
    get visible() {
      return core.root.visible;
    },
    scale(s = 1) {
      k = s;
      core.root.scale.set(s, 1, s);
    },
    set(from, dir, length) {
      core.set(from, dir, length);
      if (length > 1e-9) {
        // the outlines start a little behind the tail and end a little past the tip, in the arrow's own frame
        OUT_FROM.set(0, -pad * 0.8, 0);
        white.set(OUT_FROM, UP, length + pad * 1.9);
        OUT_FROM.set(0, -(pad + edge) * 0.8, 0);
        dark.set(OUT_FROM, UP, length + (pad + edge) * 1.9);
      } else {
        white.hide();
        dark.hide();
      }
      core.root.scale.set(k, 1, k);
    },
    setOpacity(a) {
      for (const x of [core, white, dark]) x.setOpacity(a);
    },
    hide() {
      core.hide();
    },
  };
}

const Q = new THREE.Quaternion();
const D = new THREE.Vector3();

/**
 * A length on the picture (λ): a bar from a to b with an arrow head at each end, drawn over the scene in a white
 * halo. `set(a, b)`, `hide()`; `r` is the bar's radius.
 */
export function bracket(name, color, r, { order = 26 } = {}) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  const mat = flat(color);
  const halo = flat('#ffffff');
  halo.opacity = 0.9;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8).translate(0, 0.5, 0), mat);
  const barHalo = new THREE.Mesh(new THREE.CylinderGeometry(r * 2.2, r * 2.2, 1, 8).translate(0, 0.5, 0), halo);
  const hl = r * 6;
  const hr = r * 2.8;
  const head0 = new THREE.Mesh(new THREE.ConeGeometry(hr, hl, 12).translate(0, -hl / 2, 0), mat);
  const head1 = head0.clone();
  head0.rotation.x = Math.PI;
  barHalo.renderOrder = order;
  for (const m of [bar, head0, head1]) m.renderOrder = order + 1;
  const inner = new THREE.Group();
  inner.add(barHalo, bar, head0, head1);
  root.add(inner);
  return {
    root,
    /** From a to b. */
    set(a, b) {
      D.subVectors(b, a);
      const len = D.length();
      root.visible = len > 1e-6;
      if (!root.visible) return;
      root.position.copy(a);
      Q.setFromUnitVectors(UP, D.normalize());
      inner.quaternion.copy(Q);
      bar.scale.y = len;
      barHalo.scale.y = len;
      head1.position.y = len;
      head0.position.y = 0;
    },
    hide() {
      root.visible = false;
    },
  };
}
