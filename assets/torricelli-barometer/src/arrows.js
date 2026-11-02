// The arrows are the point of the picture: thick flat colour in a white outline with a thin dark edge, drawn over the
// glass and the scenery so they read on the dark chalkboard, the silver mercury and the bright sky alike. A straight
// arrow (the kit's createArrow, three layers).
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

/**
 * A dimension line (a height on the picture): a thin vertical bar with a small head at each end and a tick across
 * each end, drawn over the scene. `set(x, y0, y1, z)` places it; `ticks` (m) is how wide the end ticks are.
 */
export function dimensionLine(name, color, r, { ticks = 0.018, order = 26, dashed = false } = {}) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  const mat = flat(color);
  const halo = flat('#ffffff');
  halo.opacity = 0.85;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8).translate(0, 0.5, 0), mat);
  const barHalo = new THREE.Mesh(new THREE.CylinderGeometry(r * 2.1, r * 2.1, 1, 8).translate(0, 0.5, 0), halo);
  const hl = r * 7;
  const hr = r * 3;
  const headUp = new THREE.Mesh(new THREE.ConeGeometry(hr, hl, 12).translate(0, -hl / 2, 0), mat);
  const headDown = new THREE.Mesh(new THREE.ConeGeometry(hr, hl, 12).translate(0, -hl / 2, 0), mat);
  headDown.rotation.x = Math.PI;
  const tick0 = new THREE.Mesh(new THREE.BoxGeometry(ticks, r * 1.6, r * 1.6), mat);
  const tick1 = tick0.clone();
  barHalo.renderOrder = order;
  for (const m of [bar, headUp, headDown, tick0, tick1]) m.renderOrder = order + 1;
  root.add(barHalo, bar, headUp, headDown, tick0, tick1);
  let dashes = null;
  if (dashed) {
    // a dotted look: the bar drawn as short pieces (the book's figure 5.10 marks 76 cm with a dotted line)
    bar.visible = false;
    barHalo.visible = false;
    dashes = new THREE.InstancedMesh(new THREE.CylinderGeometry(r, r, 1, 6), mat, 120);
    dashes.renderOrder = order + 1;
    root.add(dashes);
  }
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const S = new THREE.Vector3();
  const P = new THREE.Vector3();
  return {
    root,
    set(x, y0, y1, z = 0) {
      const len = Math.abs(y1 - y0);
      root.visible = len > 1e-4;
      if (!root.visible) return;
      const lo = Math.min(y0, y1);
      root.position.set(x, lo, z);
      bar.scale.y = len;
      barHalo.scale.y = len;
      headUp.position.y = len;
      headDown.position.y = 0;
      tick0.position.y = 0;
      tick1.position.y = len;
      if (dashes) {
        const dash = Math.max(r * 4, len / 60);
        const n = Math.min(120, Math.floor(len / (dash * 1.9)));
        for (let i = 0; i < n; i++) {
          P.set(0, (i + 0.5) * (len / n), 0);
          S.set(1, dash, 1);
          M.compose(P, Q, S);
          dashes.setMatrixAt(i, M);
        }
        dashes.count = n;
        dashes.instanceMatrix.needsUpdate = true;
      }
    },
    hide() {
      root.visible = false;
    },
  };
}
