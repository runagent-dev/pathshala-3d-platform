// Detailed car and teaching markers. Coordinates and wheel dynamics match motion.js.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DOT_KEYS, DOT_NORMALS, DOTS, WHEEL_DOT } from './motion.js';
import { buildVehicle } from './vehicle.js';
export const DOT_R = 0.15;
export const WHEEL_DOT_R = 0.09;

/** @param {{ materials: any, colors: Record<string,string>, ghost?: THREE.Material }} opts */
export function createCar({ materials: M, colors, ghost = null }) {
  const { root, model, wheels } = buildVehicle({ materials: M, colors, ghost });
  // ── painted points (stickers): a coloured disc with a white rim ─────────────
  const dots = {};
  const white = new THREE.MeshBasicMaterial({ name: 'PointRim', color: 0xffffff, toneMapped: false });
  const sticker = (radius, color, name, onTop = false) => {
    const g = new THREE.Group();
    g.name = name;
    const ring = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.28, 32), onTop ? white.clone() : white);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 32),
      new THREE.MeshBasicMaterial({ name, color, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    );
    disc.position.z = 0.002;
    if (onTop) {
      ring.material.depthTest = disc.material.depthTest = false;
      ring.renderOrder = 6;
      disc.renderOrder = 7;
    }
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
    // The point on the front right tyre sits on the tread's edge (so it really touches the road). A flat disc there
    // would hang off the tyre, so its marker turns to face the camera (faceCamera) and is drawn over the road,
    // like its trail.
    const w = sticker(WHEEL_DOT_R, colors.wheel, 'Point_wheel', true);
    w.position.set(WHEEL_DOT.rho * Math.sin(WHEEL_DOT.start), WHEEL_DOT.rho * Math.cos(WHEEL_DOT.start), WHEEL_DOT.out);
    wheels.fr.spin.add(w);
    dots.wheel = w;
  }
  const q = new THREE.Quaternion();

  return {
    root,
    model,
    dots,
    /** Turn each wheel by its angle (radians, the way it rolls forward) and steer the front ones. */
    setWheels(turns, steering) {
      for (const key of Object.keys(wheels)) wheels[key].spin.rotation.z = -turns[key];
      wheels.fl.hub.rotation.y = steering.left;
      wheels.fr.hub.rotation.y = steering.right;
    },
    /** Turns the tyre point's marker to face the camera (before each frame). */
    faceCamera(camera) {
      const w = dots.wheel;
      if (!w?.visible) return;
      w.parent.getWorldQuaternion(q).invert();
      w.quaternion.copy(q).multiply(camera.quaternion);
    },
  };
}

/**
 * A faint copy of the car where it started: its body's outer shapes in one mesh and each wheel in one, all with
 * `material`, made from the car's own merged geometries (nothing is built twice).
 */
export function createGhost(car, material) {
  const root = new THREE.Group();
  root.name = 'StartOutline';
  const model = new THREE.Group();
  model.position.copy(car.model.position);
  root.add(model);
  const outer = ['PearlWhitePaint', 'TintedGlass', 'SatinBlackTrim', 'RedAccent'];
  const body = car.model.children.filter((m) => m instanceof THREE.Mesh && outer.includes(m.material.name) && m.visible);
  model.add(new THREE.Mesh(mergeGeometries(body.map((m) => m.geometry)), material));
  const hubs = {};
  const wheelGeo = new Map();
  for (const key of ['rl', 'rr', 'fl', 'fr']) {
    const src = car.model.getObjectByName(`Wheel_${key}`);
    const spin = src.getObjectByName(`WheelSpin_${key}`);
    const side = Math.sign(src.position.z);
    if (!wheelGeo.has(side)) {
      const parts = spin.children.filter((m) => m instanceof THREE.Mesh && ['TyreRubber', 'MachinedAlloy'].includes(m.material.name));
      wheelGeo.set(side, mergeGeometries(parts.map((m) => m.geometry)));
    }
    const hub = new THREE.Group();
    hub.position.copy(src.position);
    hub.add(new THREE.Mesh(wheelGeo.get(side), material));
    model.add(hub);
    hubs[key] = hub;
  }
  return {
    root,
    /** Steers the front wheels (as the car's at the start). */
    setSteering(steering) {
      hubs.fl.rotation.y = steering.left;
      hubs.fr.rotation.y = steering.right;
    },
  };
}
