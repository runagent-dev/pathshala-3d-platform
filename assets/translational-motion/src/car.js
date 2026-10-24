// A small family car, procedural three.js in metres, in the car coordinates of ./motion.js (x forward from the
// rear bumper, y up from the road, z to the car's right). The body is the side profile with the wheel arches cut
// out, extruded across the width with rounded edges; a glass cabin with a painted roof and pillars; four wheels
// that turn (and the front ones steer); painted points (stickers) on the body and one on the front right tyre.
// createCar({ ghost }) builds the same shapes in one see-through material: the outline of where the car started.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { CAR, DOT_KEYS, DOT_NORMALS, DOTS, WHEEL_DOT } from './motion.js';

// Rounded boxes, made once per size and with shared vertices (a quarter of the vertices: a smaller GLB).
const boxes = new Map();
function rbox(w, h, d, segments, radius) {
  const key = [w, h, d, segments, radius].join('|');
  if (!boxes.has(key)) boxes.set(key, mergeVertices(new RoundedBoxGeometry(w, h, d, segments, radius)));
  return boxes.get(key);
}

const R = CAR.wheelR;
const ARCH = R + 0.06; // the arch clears the tyre
const FRONT_AXLE = CAR.rearAxle + CAR.wheelbase;
export const DOT_R = 0.11; // m, radius of a painted point
export const WHEEL_DOT_R = 0.055;

function bodyProfile() {
  const s = new THREE.Shape();
  const bottom = 0.3;
  const a = Math.asin((R - bottom) / ARCH); // where the arch meets the sill
  s.moveTo(0.07, bottom);
  s.absarc(CAR.rearAxle, R, ARCH, Math.PI + a, -a, true);
  s.absarc(FRONT_AXLE, R, ARCH, Math.PI + a, -a, true);
  s.lineTo(3.93, bottom);
  s.quadraticCurveTo(4.0, bottom, 4.0, 0.37);
  s.lineTo(4.0, 0.66);
  s.quadraticCurveTo(3.99, 0.79, 3.84, 0.81);
  s.lineTo(3.12, 0.92);
  s.lineTo(0.5, 0.95);
  s.lineTo(0.14, 0.94);
  s.quadraticCurveTo(0.0, 0.93, 0.0, 0.8);
  s.lineTo(0.0, 0.37);
  s.quadraticCurveTo(0.0, bottom, 0.07, bottom);
  return s;
}

function cabinProfile() {
  const s = new THREE.Shape();
  s.moveTo(0.6, 0.92);
  s.lineTo(1.1, 1.38);
  s.quadraticCurveTo(1.17, 1.44, 1.3, 1.44);
  s.lineTo(2.3, 1.44);
  s.quadraticCurveTo(2.42, 1.44, 2.49, 1.38);
  s.lineTo(3.14, 0.92);
  s.lineTo(0.6, 0.92);
  return s;
}

/** Extrudes a side profile across `width` (centred on z = 0) with rounded edges of radius r. */
function extrudeWide(shape, width, r) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width - 2 * r,
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelOffset: -r, // the outline stays where it is drawn; the caps shrink instead
    bevelSegments: 3,
    curveSegments: 12,
  });
  geo.translate(0, 0, -(width - 2 * r) / 2);
  return mergeVertices(geo);
}

/** A thin bar from a to b (x, y in the side profile) at side z, as a pillar of the cabin. */
function bar(a, b, z, thick, deep) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const geo = rbox(len, thick, deep, 2, Math.min(thick, deep) * 0.45);
  const m = new THREE.Mesh(geo);
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z);
  m.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return m;
}

function tyreGeometry() {
  // the tyre's cross-section (radius, across the tread) turned round the axle
  const half = 0.1;
  const pts = [
    [0.2, -half * 0.86],
    [0.27, -half],
    [0.302, -half * 0.94],
    [R - 0.004, -half * 0.7],
    [R, -half * 0.35],
    [R, half * 0.35],
    [R - 0.004, half * 0.7],
    [0.302, half * 0.94],
    [0.27, half],
    [0.2, half * 0.86],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, 28);
  geo.rotateX(Math.PI / 2); // axle along z
  return geo;
}

/**
 * @param {{ materials: any, colors: Record<string, string>, ghost?: THREE.Material }} opts
 *   colors: { body, front, door, roof, back, wheel } (CSS colours of the painted points); ghost: build the
 *   outline of the start position in this one material, without points or lights.
 */
export function createCar({ materials: M, colors, ghost = null }) {
  const root = new THREE.Group(); // origin: the middle of the rear axle on the road (what ./motion.js moves)
  root.name = ghost ? 'StartOutline' : 'Car';
  const model = new THREE.Group(); // car coordinates: the rear bumper at x = 0
  model.position.x = -CAR.rearAxle;
  root.add(model);

  const paint =
    ghost ||
    new THREE.MeshPhysicalMaterial({
      name: 'Paint',
      color: colors.body,
      metalness: 0.35,
      roughness: 0.38,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    });
  const glass = ghost || new THREE.MeshPhysicalMaterial({ name: 'Glass', color: 0x27313d, metalness: 0.1, roughness: 0.12, clearcoat: 1 });
  const trim = ghost || new THREE.MeshStandardMaterial({ name: 'Trim', color: 0x2b3038, roughness: 0.6, metalness: 0.1 });
  const rubber = ghost || new THREE.MeshStandardMaterial({ name: 'Tyre', color: 0x24272c, roughness: 0.86, metalness: 0 });
  const rimMat = ghost || M.chrome.clone();
  if (!ghost) {
    rimMat.name = 'Rim';
    rimMat.color.set(0xc9ced6);
    rimMat.roughness = 0.25;
  }
  const add = (geo, mat, name, parent = model) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    parent.add(m);
    return m;
  };

  // ── body, cabin, roof ───────────────────────────────────────────────────────
  add(extrudeWide(bodyProfile(), CAR.width, 0.07), paint, 'Body');
  add(extrudeWide(cabinProfile(), 1.5, 0.05), glass, 'Cabin');
  const roof = add(rbox(1.2, 0.05, 1.52, 2, 0.022), paint, 'Roof');
  roof.position.set(1.8, 1.448, 0);
  for (const z of [-0.745, 0.745]) {
    for (const [a, b, name] of [
      [[0.62, 0.93], [1.16, 1.43], 'PillarC'],
      [[3.1, 0.93], [2.44, 1.43], 'PillarA'],
      [[2.02, 0.93], [1.97, 1.43], 'PillarB'],
    ]) {
      const p = bar(a, b, z, 0.075, 0.03);
      p.material = paint;
      p.name = name;
      model.add(p);
    }
  }
  // the dark wells behind the wheel arches (so one cannot see through the car)
  for (const x of [CAR.rearAxle, FRONT_AXLE]) {
    const well = add(new THREE.CylinderGeometry(ARCH - 0.01, ARCH - 0.01, CAR.width - 0.06, 24, 1, false, -Math.PI / 2, Math.PI), trim, 'WheelWell');
    well.rotation.x = Math.PI / 2;
    well.position.set(x, R, 0);
  }

  if (!ghost) {
    // lights, grille, bumper lips, mirrors, door seams and handles
    const lamp = new THREE.MeshStandardMaterial({ name: 'Headlamp', color: 0xfdfcf4, emissive: 0xfff6d8, emissiveIntensity: 0.35, roughness: 0.2 });
    const tail = new THREE.MeshStandardMaterial({ name: 'TailLamp', color: 0xc92a2a, emissive: 0x8a1010, emissiveIntensity: 0.35, roughness: 0.3 });
    for (const z of [-0.6, 0.6]) {
      add(rbox(0.06, 0.11, 0.34, 2, 0.025), lamp, 'Headlamp').position.set(3.985, 0.69, z);
      add(rbox(0.05, 0.12, 0.3, 2, 0.02), tail, 'TailLamp').position.set(0.012, 0.8, z);
      const mirror = add(rbox(0.14, 0.11, 0.16, 2, 0.03), paint, 'Mirror');
      mirror.position.set(2.98, 1.0, Math.sign(z) * 0.9);
    }
    add(rbox(0.04, 0.12, 0.7, 2, 0.02), trim, 'Grille').position.set(3.99, 0.55, 0);
    add(rbox(0.06, 0.07, 1.5, 2, 0.025), trim, 'BumperLipFront').position.set(3.985, 0.34, 0);
    add(rbox(0.06, 0.07, 1.5, 2, 0.025), trim, 'BumperLipRear').position.set(0.015, 0.34, 0);
    const seam = new THREE.MeshBasicMaterial({ name: 'Seam', color: 0x59626e });
    for (const z of [-0.861, 0.861]) {
      for (const x of [1.22, 2.0, 2.86]) add(new THREE.BoxGeometry(0.012, 0.6, 0.004), seam, 'DoorSeam').position.set(x, 0.63, z);
      for (const x of [1.72, 2.5]) add(rbox(0.16, 0.035, 0.03, 2, 0.012), trim, 'Handle').position.set(x, 0.86, Math.sign(z) * 0.868);
    }
  }

  // ── wheels: hub group (steers) → spin group (turns) → tyre, rim, spokes ─────
  const tyreGeo = tyreGeometry();
  const rimGeo = new THREE.CylinderGeometry(0.205, 0.205, 0.16, 28);
  rimGeo.rotateX(Math.PI / 2);
  const spokeGeo = rbox(0.17, 0.045, 0.03, 1, 0.012);
  const capGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16);
  capGeo.rotateX(Math.PI / 2);
  const wheels = {};
  for (const [key, x, side] of [
    ['rl', CAR.rearAxle, -1],
    ['rr', CAR.rearAxle, 1],
    ['fl', FRONT_AXLE, -1],
    ['fr', FRONT_AXLE, 1],
  ]) {
    const hub = new THREE.Group();
    hub.name = `Wheel_${key}`;
    hub.position.set(x, R, (side * CAR.track) / 2);
    model.add(hub);
    const spin = new THREE.Group();
    spin.name = `WheelSpin_${key}`;
    hub.add(spin);
    add(tyreGeo, rubber, 'Tyre', spin);
    add(rimGeo, rimMat, 'Rim', spin);
    if (!ghost) {
      // five spokes on the outer face, so one can see the wheel turn
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const sp = add(spokeGeo, trim, 'Spoke', spin);
        sp.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, side * 0.083);
        sp.rotation.z = a;
      }
      add(capGeo, trim, 'HubCap', spin).position.z = side * 0.085;
    }
    wheels[key] = { hub, spin, side };
  }

  // ── painted points (stickers): a coloured disc with a white rim ─────────────
  const dots = {};
  const sticker = (radius, color, name) => {
    const g = new THREE.Group();
    g.name = name;
    const ring = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.28, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 32),
      new THREE.MeshBasicMaterial({ color, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    );
    disc.position.z = 0.002;
    g.add(ring, disc);
    return g;
  };
  if (!ghost) {
    for (const key of DOT_KEYS) {
      const g = sticker(DOT_R, colors[key], `Point_${key}`);
      const [x, y, z] = DOTS[key];
      const n = DOT_NORMALS[key];
      g.position.set(x + n[0] * 0.004, y + n[1] * 0.004, z + n[2] * 0.004);
      if (n[1]) g.rotation.x = -Math.PI / 2; // a disc faces +z: the side ones as they are, the roof one turned up
      model.add(g);
      dots[key] = g;
    }
    // the point on the front right tyre's outer face, at the bottom (touching the road) when the wheel has not turned
    const w = sticker(WHEEL_DOT_R, colors.wheel, 'Point_wheel');
    w.position.set(WHEEL_DOT.rho * Math.sin(WHEEL_DOT.start), WHEEL_DOT.rho * Math.cos(WHEEL_DOT.start), WHEEL_DOT.out + 0.002);
    wheels.fr.spin.add(w);
    dots.wheel = w;
  }

  const meshes = [];
  root.traverse((m) => m instanceof THREE.Mesh && meshes.push(m));

  return {
    root,
    model,
    wheels,
    dots,
    meshes,
    /** Turn each wheel by its angle (radians, the way it rolls forward) and steer the front ones. */
    setWheels(turns, steering) {
      for (const key of Object.keys(wheels)) wheels[key].spin.rotation.z = -turns[key];
      wheels.fl.hub.rotation.y = steering.left;
      wheels.fr.hub.rotation.y = steering.right;
    },
  };
}
