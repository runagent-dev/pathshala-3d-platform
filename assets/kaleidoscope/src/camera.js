// Camera framing: the closest camera pose, looking from a given direction, that shows a whole box inside the stage with
// margins in pixels on each side (room for the corner buttons, the labels and the small view of the mirror).
import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);
// reused on every call (it runs every frame while the camera flies): nothing is allocated
const look = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3();
const centre = new THREE.Vector3();
const p = new THREE.Vector3();
const corners = Array.from({ length: 8 }, () => ({ x: 0, y: 0, z: 0 }));
const pose = { target: new THREE.Vector3(), position: new THREE.Vector3() };
const usable = { top: 1, bottom: 1, left: 1, right: 1 };
let tanV = 1;
let tanH = 1;
let shiftX = 0;
let shiftY = 0;
/** For a distance d back: the shift of the view that fits every corner, or false when none does. */
function fits(d) {
  let loX = Number.NEGATIVE_INFINITY;
  let hiX = Number.POSITIVE_INFINITY;
  let loY = Number.NEGATIVE_INFINITY;
  let hiY = Number.POSITIVE_INFINITY;
  for (const c of corners) {
    const depth = d + c.z;
    if (depth <= 1e-3) return false;
    loX = Math.max(loX, c.x - usable.right * depth * tanH);
    hiX = Math.min(hiX, c.x + usable.left * depth * tanH);
    loY = Math.max(loY, c.y - usable.top * depth * tanV);
    hiY = Math.min(hiY, c.y + usable.bottom * depth * tanV);
  }
  if (loX > hiX || loY > hiY) return false;
  shiftX = (loX + hiX) / 2;
  shiftY = loY * 0.35 + hiY * 0.65; // spare height goes to the sky: the floor stays low in the view
  return true;
}

/**
 * box: what to show; dir: unit vector from the target toward the camera; camera: its fov is used; width, height: the stage
 * in pixels; margin: { top, bottom, left, right } in pixels. Returns { position, target } (the same object every call).
 */
export function fitPose({ box, dir, camera, width, height, margin }) {
  look.copy(dir).normalize().negate();
  right.crossVectors(look, WORLD_UP).normalize();
  up.crossVectors(right, look).normalize();
  box.getCenter(centre);
  tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  tanH = tanV * (width / Math.max(1, height));
  usable.top = Math.max(0.1, 1 - (2 * margin.top) / height);
  usable.bottom = Math.max(0.1, 1 - (2 * margin.bottom) / height);
  usable.left = Math.max(0.1, 1 - (2 * margin.left) / width);
  usable.right = Math.max(0.1, 1 - (2 * margin.right) / width);
  let k = 0;
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        p.set(x, y, z).sub(centre);
        const c = corners[k++];
        c.x = p.dot(right);
        c.y = p.dot(up);
        c.z = p.dot(look);
      }
  let near = 0;
  let far = 1;
  while (!fits(far) && far < 1e5) far *= 2;
  for (let i = 0; i < 40; i++) {
    const mid = (near + far) / 2;
    if (fits(mid)) far = mid;
    else near = mid;
  }
  fits(far);
  pose.target.copy(centre).addScaledVector(right, shiftX).addScaledVector(up, shiftY);
  pose.position.copy(pose.target).addScaledVector(look, -far);
  return pose;
}
