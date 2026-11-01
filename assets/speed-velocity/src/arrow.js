// A 3D arrow (round shaft and cone head) for the vector quantities: বেগ on the stone, সরণ on the road. It has a
// white outline (a slightly bigger shell drawn inside out), so it stands out over the earth, the fields and the
// water. set(from, dir, length) places it; the head keeps its size, the shaft stretches.
// Geometries are shared by every arrow of the same size; materials by every arrow of the same colour and opacity.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const GEOS = new Map();
/** A unit-length shaft (0 → 1 along y) and a head (0 → head along y), shared per size. */
function geometries(radius, head, headRadius, segments) {
  const key = `${radius}|${head}|${headRadius}|${segments}`;
  if (!GEOS.has(key))
    GEOS.set(key, {
      shaft: new THREE.CylinderGeometry(radius, radius, 1, segments).translate(0, 0.5, 0),
      tip: new THREE.ConeGeometry(headRadius, head, segments).translate(0, head / 2, 0),
    });
  return GEOS.get(key);
}

/**
 * @param {{ color: THREE.ColorRepresentation, radius?: number, head?: number, headRadius?: number,
 *           opacity?: number, name?: string, outline?: THREE.ColorRepresentation | null }} options
 */
export function createArrow({ color, radius = 0.03, head = 0.17, headRadius = 0.08, opacity = 1, name = 'Arrow', outline = '#ffffff' }) {
  const faded = opacity < 1;
  const material = new THREE.MeshStandardMaterial({
    name: `${name}Material`,
    color,
    roughness: 0.45,
    metalness: 0,
    emissive: new THREE.Color(color).multiplyScalar(0.22),
    transparent: faded,
    opacity,
    depthWrite: !faded,
  });
  const root = new THREE.Group();
  root.name = name;
  const segments = 16;
  const g = geometries(radius, head, headRadius, segments);
  const shaft = new THREE.Mesh(g.shaft, material);
  shaft.name = `${name}Shaft`;
  const tip = new THREE.Mesh(g.tip, material);
  tip.name = `${name}Head`;
  root.add(shaft, tip);

  // the outline: the same shapes a little bigger, only their inside faces drawn, so a rim shows round the arrow
  let rim = null;
  if (outline) {
    const pad = Math.max(0.006, radius * 0.55);
    const rimMat = new THREE.MeshBasicMaterial({
      color: outline,
      side: THREE.BackSide,
      toneMapped: false,
      transparent: faded,
      opacity,
      depthWrite: !faded,
    });
    const rg = geometries(radius + pad, head + pad * 2.4, headRadius + pad * 1.7, segments);
    rim = { mat: rimMat, pad, head: head + pad * 2.4, shaft: new THREE.Mesh(rg.shaft, rimMat), tip: new THREE.Mesh(rg.tip, rimMat) };
    rim.shaft.userData.noExport = rim.tip.userData.noExport = true;
    rim.shaft.name = `${name}OutlineShaft`;
    rim.tip.name = `${name}OutlineHead`;
    root.add(rim.shaft, rim.tip);
  }
  const d = new THREE.Vector3();

  return {
    root,
    material,
    head,
    /** From a point, along a direction (any length), `length` long (head included). */
    set(from, dir, length) {
      d.copy(dir).normalize();
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, d);
      const body = Math.max(0.001, length - head);
      const k = Math.min(1, length / head); // very short arrows: a smaller head
      shaft.scale.set(1, body * (length > head ? 1 : 0.001), 1);
      tip.position.y = length > head ? body : 0;
      tip.scale.setScalar(k);
      if (rim) {
        // the rim's head starts a little lower and ends a little beyond the tip
        const start = (length > head ? body : 0) - rim.pad * 1.2 * k;
        rim.shaft.position.y = -rim.pad * 0.6;
        rim.shaft.scale.set(1, Math.max(0.001, start + rim.pad * 0.6 + rim.pad), 1);
        rim.tip.position.y = start;
        rim.tip.scale.setScalar(k);
      }
      root.visible = length > 0.001;
    },
    setOpacity(a) {
      material.opacity = a;
      if (rim) rim.mat.opacity = a;
      root.visible = a > 0.01;
    },
    /** A new colour for the arrow (its outline stays). */
    setColor(c) {
      material.color.set(c);
      material.emissive.set(c).multiplyScalar(0.22);
    },
  };
}
