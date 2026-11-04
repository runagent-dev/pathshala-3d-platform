// Camera framing: the closest camera pose, looking from a given direction, that shows a set of points inside the
// stage with margins in pixels (room for the corner buttons on top and the panel's tab on the right), for any aspect.
// The target may move sideways and up or down, so a scene seen from one side (its near end bigger) still fills the
// frame instead of leaving a wide margin at its far end.
import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * points: THREE.Vector3[] to show (or box: a THREE.Box3, its corners); dir: unit vector from the target toward the
 * camera; camera: its fov is used; width/height: the stage in pixels; margin: { top, bottom, left, right } in pixels
 * (or side for both). Returns { position, target }.
 */
export function fitPose({ points, box, dir, camera, width, height, margin = { top: 56, bottom: 16, side: 12 } }) {
  const pts = points ?? [];
  if (!points && box)
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z));
  const look = dir.clone().normalize().negate();
  const right = new THREE.Vector3().crossVectors(look, WORLD_UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, look).normalize();
  const centre = new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanH = tanV * (width / Math.max(1, height));
  const ml = margin.left ?? margin.side ?? 12;
  const mr = margin.right ?? margin.side ?? 12;
  const top = Math.max(0.3, 1 - (2 * margin.top) / height); // usable part of the frame, in NDC
  const bottom = Math.max(0.3, 1 - (2 * margin.bottom) / height);
  const left = Math.max(0.3, 1 - (2 * ml) / width);
  const rightK = Math.max(0.3, 1 - (2 * mr) / width);
  const p = new THREE.Vector3();
  const corners = pts.map((q) => {
    p.copy(q).sub(centre);
    return { x: p.dot(right), y: p.dot(up), z: p.dot(look) };
  });
  // the camera sits `d` back from (centre + right·sx + up·sy); for a given d, find shifts that fit every point
  const shiftFor = (d) => {
    let ylo = Number.NEGATIVE_INFINITY;
    let yhi = Number.POSITIVE_INFINITY;
    let xlo = Number.NEGATIVE_INFINITY;
    let xhi = Number.POSITIVE_INFINITY;
    for (const c of corners) {
      const depth = d + c.z;
      if (depth <= 1e-3) return null;
      ylo = Math.max(ylo, c.y - top * depth * tanV);
      yhi = Math.min(yhi, c.y + bottom * depth * tanV);
      xlo = Math.max(xlo, c.x - rightK * depth * tanH);
      xhi = Math.min(xhi, c.x + left * depth * tanH);
    }
    return ylo <= yhi && xlo <= xhi ? { x: (xlo + xhi) / 2, y: (ylo + yhi) / 2 } : null;
  };
  let near = 0;
  let far = 1;
  while (shiftFor(far) == null && far < 1e5) far *= 2;
  for (let i = 0; i < 40; i++) {
    const mid = (near + far) / 2;
    if (shiftFor(mid) == null) near = mid;
    else far = mid;
  }
  const sh = shiftFor(far) ?? { x: 0, y: 0 };
  const target = centre.clone().addScaledVector(up, sh.y).addScaledVector(right, sh.x);
  return { target, position: target.clone().addScaledVector(look, -far) };
}
