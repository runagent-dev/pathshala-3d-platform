// The drawing over the models: the pull arrows (মহাকর্ষ বল, violet inside a white outline), dashed lines (to the
// Earth's centre, between two bodies, each dash in a contrasting rim where it crosses varied colours), dots and
// rings. Arrows are solid 3D objects (their colour exported with the models); dashed lines, dots, rings and the
// arrows' outlines are the "ink" of the drawing, flat-coloured, never exported (userData.noExport).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const UP = new THREE.Vector3(0, 1, 0);

/** The violet of মহাকর্ষ বল, the same as in the other three fundamental-force figures (forces.json). */
export const PULL = '#7048e8';
export const INK_GREY = '#5c6672';

/** A flat-coloured material drawn on top of the models (a drawing over the picture). */
export function ink(color, { top = true, opacity = 1 } = {}) {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false, depthTest: !top, depthWrite: false, transparent: true, opacity });
}

const FLAT = new Map();
/** A flat colour drawn over everything (one material per colour, shared by every arrow of that colour). */
function flat(color) {
  if (!FLAT.has(color))
    FLAT.set(color, new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
  return FLAT.get(color);
}

/**
 * A bold arrow (round shaft, cone head) in flat colour inside a white outline, drawn over the picture (no depth
 * test), so a violet pull never melts into a blue ocean, a dark sky or a brown table. set(from, dir, length) places
 * it; the head keeps its size, the shaft stretches; a very short arrow keeps a small head, so a pull never looks like
 * nothing at all. The coloured part is exported with the models; the outline is a drawing (userData.noExport).
 */
export function createArrow({ radius, head, headRadius, color = PULL, name = 'Pull', order = 20 }) {
  const material = flat(color);
  const root = new THREE.Group();
  root.name = name;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 14).translate(0, 0.5, 0), material);
  shaft.name = `${name}Shaft`;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 22).translate(0, head / 2, 0), material);
  tip.name = `${name}Head`;
  // the white outline: a little wider all round, starting a little before and ending a little after
  const pad = radius * 0.7;
  const white = flat('#ffffff');
  const oShaft = new THREE.Mesh(new THREE.CylinderGeometry(radius + pad, radius + pad, 1, 14).translate(0, 0.5, 0), white);
  const oh = head + pad * 2.6;
  const oTip = new THREE.Mesh(new THREE.ConeGeometry(headRadius + pad * 1.9, oh, 22).translate(0, oh / 2 - pad * 0.8, 0), white);
  for (const m of [oShaft, oTip]) {
    m.userData.noExport = true;
    m.renderOrder = order;
  }
  for (const m of [shaft, tip]) m.renderOrder = order + 1;
  root.add(oShaft, oTip, shaft, tip);
  const d = new THREE.Vector3();
  return {
    root,
    material,
    /** From a point, along a direction (any length), `length` long (head included). */
    set(from, dir, length) {
      d.copy(dir).normalize();
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, d);
      const k = Math.min(1, Math.max(0.35, length / head));
      const body = Math.max(0, length - head * k);
      shaft.scale.set(1, Math.max(0.0001, body), 1);
      shaft.visible = body > 0.0001;
      tip.position.y = body;
      tip.scale.setScalar(k);
      oShaft.position.y = -pad;
      oShaft.scale.set(1, body + pad, 1);
      oTip.position.y = body;
      oTip.scale.setScalar(k);
    },
  };
}

/**
 * A dashed line from a to b, made of short round dashes (seen from any side, unlike 1-pixel GL lines).
 * set(a, b) moves it; dashes keep their length, so a longer line has more of them (up to `max`).
 */
export function createDashes({ radius, dash, gap, color = INK_GREY, rim = null, max = 60, top = true, opacity = 1, name = 'Dashes' }) {
  const geo = new THREE.CylinderGeometry(radius, radius, 1, 6);
  const mesh = new THREE.InstancedMesh(geo, ink(color, { top, opacity }), max);
  mesh.name = name;
  mesh.userData.noExport = true;
  mesh.frustumCulled = false;
  mesh.renderOrder = 15;
  mesh.count = 0;
  // an outline round every dash (a contrasting colour), sharing the dashes' places: a dark line stays clear over
  // white ice, a light one over a pale sea
  let rimMesh = null;
  if (rim) {
    const pad = radius * 0.9;
    rimMesh = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(radius + pad, radius + pad, 1 + (2 * pad) / dash, 6),
      ink(rim, { top, opacity }),
      max,
    );
    rimMesh.instanceMatrix = mesh.instanceMatrix;
    rimMesh.userData.noExport = true;
    rimMesh.frustumCulled = false;
    rimMesh.renderOrder = 14;
    rimMesh.count = 0;
    mesh.add(rimMesh); // shown and hidden with the dashes (the matrices are in the parent's frame: identity)
  }
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3(1, dash, 1);
  const dir = new THREE.Vector3();
  return {
    mesh,
    set(a, b) {
      dir.subVectors(b, a);
      const len = dir.length();
      dir.divideScalar(len || 1);
      q.setFromUnitVectors(UP, dir);
      const n = Math.min(max, Math.floor((len + gap) / (dash + gap)));
      // centred: the same space is left at both ends
      const used = n * dash + (n - 1) * gap;
      const start = (len - used) / 2 + dash / 2;
      for (let i = 0; i < n; i++) {
        p.copy(a).addScaledVector(dir, start + i * (dash + gap));
        mesh.setMatrixAt(i, m.compose(p, q, s));
      }
      mesh.count = Math.max(0, n);
      if (rimMesh) rimMesh.count = mesh.count;
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** A round dot (with a white rim so it reads on any colour), drawn on top. */
export function createDot(size, color) {
  const g = new THREE.Group();
  g.userData.noExport = true;
  const rim = new THREE.Mesh(new THREE.SphereGeometry(size * 1.45, 18, 12), ink('#ffffff'));
  const dot = new THREE.Mesh(new THREE.SphereGeometry(size, 18, 12), ink(color));
  rim.renderOrder = 16;
  dot.renderOrder = 17;
  g.add(rim, dot);
  return g;
}

/** A thin ring lying in the x–z plane (an orbit's path), drawn faintly and hidden by the bodies in front of it. */
export function createRing(radius, tube, color = INK_GREY, opacity = 0.35) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 6, 160), ink(color, { top: false, opacity }));
  ring.rotation.x = Math.PI / 2;
  ring.userData.noExport = true;
  ring.renderOrder = 3;
  return ring;
}

const tint = new THREE.Color();
/**
 * Many still parts in one geometry, each in its own colour (vertex colours): meshes without a material, already
 * placed (position, rotation, scale) in a common frame. One draw call instead of one per part.
 */
export function bakeParts(parts) {
  const indexed = parts.every(({ mesh }) => mesh.geometry.index); // keep indices when every part has them
  const geos = parts.map(({ mesh, color }) => {
    mesh.updateMatrix();
    let g = mesh.geometry.clone().applyMatrix4(mesh.matrix);
    if (g.index && !indexed) g = g.toNonIndexed();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    tint.set(color);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i += 3) {
      col[i] = tint.r;
      col[i + 1] = tint.g;
      col[i + 2] = tint.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  });
  const merged = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  return merged;
}
