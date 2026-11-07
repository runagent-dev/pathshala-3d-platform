// The arrows of the forces: thick flat colour in a white outline with a thin dark edge, drawn over the glass and the
// water so they read on the water, the pale table and the deep-blue backdrop alike (the look of
// torricelli-barometer-straw's arrows). Two meshes per arrow: the colour, and the outline (dark edge and white band in
// one geometry, the dark one first in the index so the white draws over it). The shaft stretches and the head keeps its
// size: `set` rewrites the vertices in place from the unit shapes (no allocation per frame).
import * as THREE from 'three';

const EDGE = new THREE.Color('#10213a');
const WHITE = new THREE.Color('#ffffff');
const UP = new THREE.Vector3(0, 1, 0);

/** A shaft (y 0…1, flagged 0) and a head (y 0…head, flagged 1) in one geometry, with radius r. */
function shape(r, head, headR, color) {
  const shaft = new THREE.CylinderGeometry(r, r, 1, 12, 1, false).translate(0, 0.5, 0);
  const cone = new THREE.ConeGeometry(headR, head, 16, 1, false).translate(0, head / 2, 0);
  const pos = [];
  const part = [];
  const col = [];
  for (const [g, flag] of [
    [shaft, 0],
    [cone, 1],
  ]) {
    const ng = g.toNonIndexed();
    const p = ng.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      pos.push(p[i], p[i + 1], p[i + 2]);
      part.push(flag);
      col.push(color.r, color.g, color.b);
    }
  }
  return { pos, part, col, head };
}

/**
 * A bold arrow; r is the shaft's radius (cm). `set(from, dir, length)`, `setOpacity(a)`, `root` (its visibility).
 * The outline starts a little behind the tail and ends a little past the tip.
 */
export function boldArrow(name, color, r, { order = 30 } = {}) {
  const head = r * 4.6;
  const headR = r * 2.6;
  const pad = r * 0.7;
  const edge = r * 0.42;
  const core = shape(r, head, headR, new THREE.Color(color));
  const dark = shape(r + pad + edge, head + (pad + edge) * 2.6, headR + (pad + edge) * 1.9, EDGE);
  const white = shape(r + pad, head + pad * 2.6, headR + pad * 1.9, WHITE);
  const back = [(pad + edge) * 0.8, pad * 0.8]; // how far each outline starts behind the tail
  const flat = (vertexColors) =>
    new THREE.MeshBasicMaterial({
      color: vertexColors ? '#ffffff' : color,
      vertexColors,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
  /** One mesh from shapes drawn in order; returns the mesh and a function laying it out for a length. */
  function build(list, vertexColors, nm) {
    const n = list.reduce((a, s) => a + s.pos.length, 0);
    const position = new THREE.BufferAttribute(new Float32Array(n), 3);
    position.setUsage(THREE.DynamicDrawUsage);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', position);
    if (vertexColors)
      geo.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(
          list.flatMap((s) => s.col),
          3,
        ),
      );
    const mesh = new THREE.Mesh(geo, flat(vertexColors));
    mesh.name = nm;
    mesh.frustumCulled = false;
    mesh.renderOrder = order + (vertexColors ? 0 : 1);
    return {
      mesh,
      /** Writes the vertices for a body of `len` (the outlines start `behind` below 0). */
      layout(len, behind = []) {
        const a = position.array;
        let o = 0;
        list.forEach((s, k) => {
          const extra = behind[k] ?? 0;
          const total = len + extra * 2.4; // the outline reaches a little past the tip too
          const shaftLen = Math.max(0, total - s.head);
          const hk = total < s.head ? total / s.head : 1;
          for (let i = 0; i < s.pos.length; i += 3) {
            const x = s.pos[i];
            const y = s.pos[i + 1];
            const z = s.pos[i + 2];
            if (s.part[i / 3] === 0) {
              a[o++] = x;
              a[o++] = y * shaftLen - extra;
              a[o++] = z;
            } else {
              a[o++] = x * hk;
              a[o++] = y * hk + shaftLen - extra;
              a[o++] = z * hk;
            }
          }
        });
        position.needsUpdate = true;
      },
    };
  }
  const fill = build([core], false, name);
  const line = build([dark, white], true, `${name}Outline`);
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  root.add(line.mesh, fill.mesh);
  let lastLen = -1;
  return {
    root,
    set(from, dir, length) {
      root.visible = length > 1e-6;
      if (!root.visible) return;
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, dir);
      if (Math.abs(length - lastLen) > 1e-6) {
        lastLen = length;
        fill.layout(length);
        line.layout(length, back);
      }
    },
    setOpacity(a) {
      fill.mesh.material.opacity = a;
      line.mesh.material.opacity = a;
    },
  };
}
