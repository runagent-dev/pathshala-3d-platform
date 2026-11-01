// A bold vector arrow in one draw call, inside a white rim in one more: a round shaft and a cone head in a single
// geometry whose vertices are moved in place when the length changes (nothing is rebuilt), and a slightly larger
// copy drawn from the inside (back faces) as the rim, so the arrow stands out over the asphalt and
// the bodies alike (a copy of the sister figure momentum's). Sizes in metres.
//
//   const a = createBoldArrow({ color: '#1c6fd9', name: 'VelocityArrow' });
//   lane.add(a.root);
//   a.set(from, dir, length);   // from a point along a direction, `length` long, head included (0 hides it)
//   a.tip                       // where the head ends, after set()
//   a.setOpacity(0.5); a.thicken(1.6); a.hide();
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const UP = new THREE.Vector3(0, 1, 0);

/** A shaft (unit length, along +y) and a head (its own length) in one geometry, ready to be stretched. */
function shape(r, head, headR, seg) {
  const shaft = new THREE.CylinderGeometry(r, r, 1, seg).translate(0, 0.5, 0);
  const cone = new THREE.ConeGeometry(headR, head, seg + 8).translate(0, head / 2, 0);
  const n = shaft.attributes.position.count;
  const geo = mergeGeometries([shaft, cone]);
  shaft.dispose();
  cone.dispose();
  geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
  return { geo, n, base: Float32Array.from(geo.attributes.position.array), head, headR };
}

/** Stretch a shape to `length` (head included): the head keeps its size, a short arrow gets a smaller head. */
function stretch(s, length) {
  const h = Math.min(s.head, length * 0.6);
  const body = length - h;
  const k = h / s.head;
  const a = s.geo.attributes.position.array;
  const b = s.base;
  for (let i = 0; i < a.length; i += 3) {
    if (i < s.n * 3) {
      a[i] = b[i];
      a[i + 1] = b[i + 1] * body;
      a[i + 2] = b[i + 2];
    } else {
      a[i] = b[i] * k;
      a[i + 1] = body + b[i + 1] * k;
      a[i + 2] = b[i + 2] * k;
    }
  }
  s.geo.attributes.position.needsUpdate = true;
  if (!s.geo.boundingSphere) s.geo.boundingSphere = new THREE.Sphere();
  s.geo.boundingSphere.center.set(0, length / 2, 0);
  s.geo.boundingSphere.radius = length / 2 + s.headR;
}

/**
 * @param {{ color: THREE.ColorRepresentation, name?: string, radius?: number, head?: number, headRadius?: number,
 *           rim?: number, rimColor?: THREE.ColorRepresentation, segments?: number }} options
 */
export function createBoldArrow({
  color,
  name = 'Arrow',
  radius = 0.075,
  head = 0.45,
  headRadius = 0.2,
  rim = 0.032,
  rimColor = '#ffffff',
  segments = 16,
}) {
  const material = new THREE.MeshStandardMaterial({
    name: `${name}Material`,
    color,
    roughness: 0.45,
    emissive: color,
    emissiveIntensity: 0.32, // the colour reads true in the sun and in the shade
  });
  const rimMaterial = new THREE.MeshBasicMaterial({
    name: `${name}Rim`,
    color: rimColor,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  const core = shape(radius, head, headRadius, segments);
  const outer = shape(radius + rim, head + rim * 2.6, headRadius + rim * 1.9, segments);
  const root = new THREE.Mesh(core.geo, material);
  root.name = name;
  const rimMesh = new THREE.Mesh(outer.geo, rimMaterial);
  rimMesh.name = `${name}Rim`;
  rimMesh.position.y = -rim;
  rimMesh.renderOrder = -1;
  rimMesh.userData.noExport = true;
  root.add(rimMesh);
  root.visible = false;
  const tip = new THREE.Vector3();
  const d = new THREE.Vector3();
  let placed = false;
  let alpha = 1;
  let shown = -1; // the length the geometry has now

  function set(from, dir, length) {
    tip.copy(from);
    d.copy(dir);
    const n = d.length();
    placed = length > 1e-9 && n > 1e-12;
    root.visible = placed && alpha > 0.01;
    if (!placed) return;
    d.divideScalar(n);
    root.position.copy(from);
    root.quaternion.setFromUnitVectors(UP, d);
    if (Math.abs(length - shown) > 1e-6) {
      stretch(core, length);
      stretch(outer, length + rim * 2.2);
      shown = length;
    }
    tip.addScaledVector(d, length);
  }

  return {
    root,
    material,
    tip,
    set,
    /** Fade the arrow and its rim (0…1); below 0.01 it is hidden. */
    setOpacity(a) {
      alpha = a;
      material.opacity = a;
      rimMaterial.opacity = a;
      if (material.transparent !== a < 1) {
        material.transparent = a < 1;
        material.depthWrite = a >= 1;
        material.needsUpdate = true;
      }
      root.visible = placed && a > 0.01;
    },
    /** k times as thick (never longer). */
    thicken(k) {
      root.scale.set(k, 1, k);
    },
    hide() {
      placed = false;
      root.visible = false;
    },
  };
}
