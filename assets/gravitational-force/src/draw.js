// The drawing over the models: the pull arrows (মহাকর্ষ বল, violet), dashed lines (to the Earth's centre, between
// two bodies), dots and rings. Arrows are solid 3D objects (exported with the models); dashed lines, dots and rings
// are the "ink" of the drawing, flat-coloured and drawn on top, never exported (userData.noExport).
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/** The violet of মহাকর্ষ বল, the same as in the other three fundamental-force figures (forces.json). */
export const PULL = '#7048e8';
export const INK_GREY = '#5c6672';

/** A flat-coloured material drawn on top of the models (a drawing over the picture). */
export function ink(color, { top = true, opacity = 1 } = {}) {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false, depthTest: !top, depthWrite: false, transparent: true, opacity });
}

/**
 * A 3D arrow (round shaft, cone head). set(from, dir, length) places it; the head keeps its size, the shaft
 * stretches; a very short arrow keeps a small head, so a pull never looks like nothing at all.
 *   top: drawn over everything (for the pulls on the people, which reach into the ground)
 */
export function createArrow({ radius, head, headRadius, color = PULL, top = false, name = 'Pull' }) {
  const material = new THREE.MeshStandardMaterial({
    name: `${name}Material`,
    color,
    roughness: 0.5,
    metalness: 0,
    emissive: new THREE.Color(color).multiplyScalar(0.28),
    depthTest: !top,
    depthWrite: !top,
    transparent: top,
  });
  const root = new THREE.Group();
  root.name = name;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 14).translate(0, 0.5, 0), material);
  shaft.name = `${name}Shaft`;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 22).translate(0, head / 2, 0), material);
  tip.name = `${name}Head`;
  root.add(shaft, tip);
  if (top) for (const m of [shaft, tip]) m.renderOrder = 20;
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
    },
  };
}

/**
 * A dashed line from a to b, made of short round dashes (seen from any side, unlike 1-pixel GL lines).
 * set(a, b) moves it; dashes keep their length, so a longer line has more of them (up to `max`).
 */
export function createDashes({ radius, dash, gap, color = INK_GREY, max = 60, top = true, opacity = 1, name = 'Dashes' }) {
  const geo = new THREE.CylinderGeometry(radius, radius, 1, 6);
  const mesh = new THREE.InstancedMesh(geo, ink(color, { top, opacity }), max);
  mesh.name = name;
  mesh.userData.noExport = true;
  mesh.frustumCulled = false;
  mesh.renderOrder = 15;
  mesh.count = 0;
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
