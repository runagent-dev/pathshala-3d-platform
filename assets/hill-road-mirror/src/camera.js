// Camera framing: the closest camera pose, looking from a given direction, that shows a set of points inside the
// stage with margins in pixels (room for the corner buttons on top and the hint line below), for any aspect.
import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);
// reused on every call (it runs every frame while the camera follows the split): nothing is allocated
const look = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3();
const centre = new THREE.Vector3();
const p = new THREE.Vector3();
const corners = Array.from({ length: 24 }, () => ({ x: 0, y: 0, z: 0 }));
let used = 0;
const pose = { target: new THREE.Vector3(), position: new THREE.Vector3() };
let top = 1;
let bottom = 1;
let side = 1;
let tanV = 1;
let tanH = 1;
/** The camera sits `d` back from (centre + up·shift); for a given d, a vertical shift that fits every corner. */
function shiftFor(d) {
  let lo = Number.NEGATIVE_INFINITY;
  let hi = Number.POSITIVE_INFINITY;
  for (let i = 0; i < used; i++) {
    const c = corners[i];
    const depth = d + c.z;
    if (depth <= 1e-3 || Math.abs(c.x) > side * depth * tanH) return null;
    lo = Math.max(lo, c.y - top * depth * tanV);
    hi = Math.min(hi, c.y + bottom * depth * tanV);
  }
  return lo <= hi ? (lo + hi) / 2 : null;
}

/**
 * points: the Vector3s to show (at most 24); dir: unit vector from the target toward the camera; camera: its fov is
 * used; width/height: the stage in pixels; margin: { top, bottom, side } in pixels. Returns { position, target } (the
 * same object every call: copy what you keep).
 */
export function fitPose({ points, dir, camera, width, height, margin = { top: 56, bottom: 16, side: 12 } }) {
  look.copy(dir).normalize().negate();
  right.crossVectors(look, WORLD_UP).normalize();
  up.crossVectors(right, look).normalize();
  centre.set(0, 0, 0);
  for (const q of points) centre.add(q);
  centre.divideScalar(points.length);
  tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  tanH = tanV * (width / Math.max(1, height));
  top = Math.max(0.3, 1 - (2 * margin.top) / height); // usable part of the frame, in NDC
  bottom = Math.max(0.3, 1 - (2 * margin.bottom) / height);
  side = Math.max(0.3, 1 - (2 * margin.side) / width);
  used = points.length;
  for (let i = 0; i < used; i++) {
    p.copy(points[i]).sub(centre);
    const c = corners[i];
    c.x = p.dot(right);
    c.y = p.dot(up);
    c.z = p.dot(look);
  }
  let near = 0;
  let far = 1;
  while (shiftFor(far) == null && far < 1e5) far *= 2;
  for (let i = 0; i < 40; i++) {
    const mid = (near + far) / 2;
    if (shiftFor(mid) == null) near = mid;
    else far = mid;
  }
  pose.target.copy(centre).addScaledVector(up, shiftFor(far) ?? 0);
  pose.position.copy(pose.target).addScaledVector(look, -far);
  return pose;
}
