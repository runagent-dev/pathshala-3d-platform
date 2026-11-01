// Camera framing: the closest camera pose, looking from a given direction, that shows a whole box inside the part of
// the stage left free (margins in pixels on each side: the corner buttons on top, the graph card on one side), for
// any aspect.
import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * box: THREE.Box3 to show; dir: unit vector from the target toward the camera; camera: its fov is used;
 * width/height: the stage in pixels; margin: { top, bottom, left, right } in pixels. Returns { position, target }.
 */
export function fitPose({ box, dir, camera, width, height, margin }) {
  const look = dir.clone().normalize().negate();
  const right = new THREE.Vector3().crossVectors(look, WORLD_UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, look).normalize();
  const centre = box.getCenter(new THREE.Vector3());
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanH = tanV * (width / Math.max(1, height));
  // the free part of the frame in NDC (at least a little of it, however big the margins)
  const free = (a, b, size) => {
    let lo = -1 + (2 * a) / size;
    let hi = 1 - (2 * b) / size;
    if (hi - lo < 0.3) {
      const mid = (lo + hi) / 2;
      lo = mid - 0.15;
      hi = mid + 0.15;
    }
    return [lo, hi];
  };
  const [xl, xh] = free(margin.left, margin.right, width);
  const [yl, yh] = free(margin.bottom, margin.top, height);
  const corners = [];
  const p = new THREE.Vector3();
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        p.set(x, y, z).sub(centre);
        corners.push({ x: p.dot(right), y: p.dot(up), z: p.dot(look) });
      }
  // the camera sits `d` back from centre + right·h + up·v; for a given d, find shifts h, v that fit every corner
  const shiftFor = (d) => {
    let hLo = Number.NEGATIVE_INFINITY;
    let hHi = Number.POSITIVE_INFINITY;
    let vLo = Number.NEGATIVE_INFINITY;
    let vHi = Number.POSITIVE_INFINITY;
    for (const c of corners) {
      const depth = d + c.z;
      if (depth <= 1e-3) return null;
      hLo = Math.max(hLo, c.x - xh * depth * tanH);
      hHi = Math.min(hHi, c.x - xl * depth * tanH);
      vLo = Math.max(vLo, c.y - yh * depth * tanV);
      vHi = Math.min(vHi, c.y - yl * depth * tanV);
    }
    return hLo <= hHi && vLo <= vHi ? { h: (hLo + hHi) / 2, v: (vLo + vHi) / 2 } : null;
  };
  let near = 0;
  let far = 1;
  while (shiftFor(far) == null && far < 1e5) far *= 2;
  for (let i = 0; i < 40; i++) {
    const mid = (near + far) / 2;
    if (shiftFor(mid) == null) near = mid;
    else far = mid;
  }
  const sh = shiftFor(far) ?? { h: 0, v: 0 };
  const target = centre.clone().addScaledVector(right, sh.h).addScaledVector(up, sh.v);
  return { target, position: target.clone().addScaledVector(look, -far) };
}
