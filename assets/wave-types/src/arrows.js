// Arrows that read on any background: thick flat colour in a white outline with a thin dark edge, drawn over the
// scene (no depth test). `boldArrow` is one arrow (the wave's direction); `doubleArrow` is two from a middle point
// (the marked particle's swing, both ways).
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';

const EDGE = '#1d2733';
const flat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
const UP = new THREE.Vector3(0, 1, 0);
const OUT_FROM = new THREE.Vector3();

/** One bold arrow: `r` is the shaft's radius (m). `set(from, dir, length)` as the kit's arrow. */
export function boldArrow(name, color, r, { order = 30 } = {}) {
  const head = r * 4.2;
  const headR = r * 2.5;
  const core = createArrow({ name, radius: r, head, headRadius: headR, material: flat(color) });
  const pad = r * 0.75;
  const white = createArrow({
    name: `${name}Outline`,
    radius: r + pad,
    head: head + pad * 2.6,
    headRadius: headR + pad * 1.9,
    material: flat('#ffffff'),
  });
  const edge = r * 0.45;
  const dark = createArrow({
    name: `${name}Edge`,
    radius: r + pad + edge,
    head: head + (pad + edge) * 2.6,
    headRadius: headR + (pad + edge) * 1.9,
    material: flat(EDGE),
  });
  for (const [a, k] of [
    [dark, 0],
    [white, 1],
    [core, 2],
  ])
    for (const m of [...a.root.children]) m.renderOrder = order + k;
  core.root.add(white.root, dark.root);
  core.root.userData.noExport = true;
  return {
    root: core.root,
    tip: core.tip,
    set(from, dir, length) {
      core.root.visible = true;
      core.set(from, dir, length);
      if (length > 1e-9) {
        OUT_FROM.set(0, -pad * 0.8, 0);
        white.set(OUT_FROM, UP, length + pad * 1.9);
        OUT_FROM.set(0, -(pad + edge) * 0.8, 0);
        dark.set(OUT_FROM, UP, length + (pad + edge) * 1.9);
      }
    },
    hide() {
      core.root.visible = false;
    },
    get visible() {
      return core.root.visible;
    },
  };
}

/** Two bold arrows pointing out from a middle point, `half` long each, along `dir`. */
export function doubleArrow(name, color, r, opts) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  const a = boldArrow(`${name}A`, color, r, opts);
  const b = boldArrow(`${name}B`, color, r, opts);
  root.add(a.root, b.root);
  const back = new THREE.Vector3();
  const gap = r * 0.6;
  const p = new THREE.Vector3();
  return {
    root,
    a,
    b,
    set(mid, dir, half) {
      root.visible = true;
      back.copy(dir).negate();
      a.set(p.copy(mid).addScaledVector(dir, gap), dir, half);
      b.set(p.copy(mid).addScaledVector(back, gap), back, half);
    },
    hide() {
      root.visible = false;
    },
    get visible() {
      return root.visible;
    },
  };
}
