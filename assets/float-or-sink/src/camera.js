// Camera framing (as in the pressure figure): the closest camera pose, looking from a given direction, that shows a
// whole box inside the stage with margins in pixels (room for the corner buttons on top), for any aspect.
import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * box: THREE.Box3 to show; dir: unit vector from the target toward the camera; camera: its fov is used;
 * width/height: the stage in pixels; margin: { top, bottom, side } in pixels. Returns { position, target }.
 */
export function fitPose({ box, dir, camera, width, height, margin = { top: 56, bottom: 16, side: 12 } }) {
  const look = dir.clone().normalize().negate();
  const right = new THREE.Vector3().crossVectors(look, WORLD_UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, look).normalize();
  const centre = box.getCenter(new THREE.Vector3());
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanH = tanV * (width / Math.max(1, height));
  const top = Math.max(0.3, 1 - (2 * margin.top) / height); // usable part of the frame, in NDC
  const bottom = Math.max(0.3, 1 - (2 * margin.bottom) / height);
  const side = Math.max(0.3, 1 - (2 * margin.side) / width);
  const corners = [];
  const p = new THREE.Vector3();
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        p.set(x, y, z).sub(centre);
        corners.push({ x: p.dot(right), y: p.dot(up), z: p.dot(look) });
      }
  // The camera sits `d` back from (centre + up·shift); for a given d, find a vertical shift that fits every corner.
  const shiftFor = (d) => {
    let lo = Number.NEGATIVE_INFINITY;
    let hi = Number.POSITIVE_INFINITY;
    for (const c of corners) {
      const depth = d + c.z;
      if (depth <= 1e-3 || Math.abs(c.x) > side * depth * tanH) return null;
      lo = Math.max(lo, c.y - top * depth * tanV);
      hi = Math.min(hi, c.y + bottom * depth * tanV);
    }
    return lo <= hi ? (lo + hi) / 2 : null;
  };
  let near = 0;
  let far = 1;
  while (shiftFor(far) == null && far < 1e5) far *= 2;
  for (let i = 0; i < 40; i++) {
    const mid = (near + far) / 2;
    if (shiftFor(mid) == null) near = mid;
    else far = mid;
  }
  const target = centre.clone().addScaledVector(up, shiftFor(far) ?? 0);
  return { target, position: target.clone().addScaledVector(look, -far) };
}
