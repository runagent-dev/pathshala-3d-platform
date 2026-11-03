// Camera framing (from assets/torricelli-water-barometer, extended to a list of points): the closest camera pose,
// looking from a given direction, that shows a whole box (or every point of a list) inside the
// stage with margins in pixels (room for the corner buttons on top and the hint line below), for any aspect.
import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * box: THREE.Box3 to show (or points: a list of Vector3); bias: where spare height goes (0.5 shared above and
 * below, 1 all above: the subject sits low with sky over it); dir: unit vector from the target toward the camera; camera: its fov is used;
 * width/height: the stage in pixels; margin: { top, bottom, side } in pixels. Returns { position, target }.
 */
export function fitPose({ box, points = null, bias = 0.5, dir, camera, width, height, margin = { top: 56, bottom: 16, side: 12 } }) {
  const look = dir.clone().normalize().negate();
  const right = new THREE.Vector3().crossVectors(look, WORLD_UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, look).normalize();
  // the points to show: the box's eight corners, or a list of points (then the camera can come close to a near part)
  const pts = points ?? [];
  if (!points)
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z));
  const centre = new THREE.Vector3();
  for (const q of pts) centre.add(q);
  centre.divideScalar(Math.max(1, pts.length));
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanH = tanV * (width / Math.max(1, height));
  const top = Math.max(0.3, 1 - (2 * margin.top) / height); // usable part of the frame, in NDC
  const bottom = Math.max(0.3, 1 - (2 * margin.bottom) / height);
  const side = Math.max(0.3, 1 - (2 * margin.side) / width);
  const corners = [];
  const p = new THREE.Vector3();
  for (const q of pts) {
    p.copy(q).sub(centre);
    corners.push({ x: p.dot(right), y: p.dot(up), z: p.dot(look) });
  }
  // The camera sits `d` back from (centre + right·sx + up·sy); for a given d, find shifts that fit every corner.
  const shiftFor = (d) => {
    let lo = Number.NEGATIVE_INFINITY;
    let hi = Number.POSITIVE_INFINITY;
    let loX = Number.NEGATIVE_INFINITY;
    let hiX = Number.POSITIVE_INFINITY;
    for (const c of corners) {
      const depth = d + c.z;
      if (depth <= 1e-3) return null;
      lo = Math.max(lo, c.y - top * depth * tanV);
      hi = Math.min(hi, c.y + bottom * depth * tanV);
      loX = Math.max(loX, c.x - side * depth * tanH);
      hiX = Math.min(hiX, c.x + side * depth * tanH);
    }
    return lo <= hi && loX <= hiX ? { y: lo + (hi - lo) * bias, x: (loX + hiX) / 2 } : null;
  };
  let near = 0;
  let far = 1;
  while (shiftFor(far) == null && far < 1e5) far *= 2;
  for (let i = 0; i < 40; i++) {
    const mid = (near + far) / 2;
    if (shiftFor(mid) == null) near = mid;
    else far = mid;
  }
  const shift = shiftFor(far) ?? { x: 0, y: 0 };
  const target = centre.clone().addScaledVector(up, shift.y).addScaledVector(right, shift.x);
  return { target, position: target.clone().addScaledVector(look, -far) };
}
