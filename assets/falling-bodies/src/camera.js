// Camera framing (after linear-motion's, with a margin of its own on each side): the closest camera pose, looking
// from a given direction, that shows a whole box inside the stage with margins in pixels (room for the corner
// buttons and for labels beside the scene), for any aspect.
import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * box: THREE.Box3 to show; dir: unit vector from the target toward the camera; camera: its fov is used;
 * width/height: the stage in pixels; margin: { top, bottom, left, right } in pixels. Returns { position, target }.
 */
export function fitPose({ box, dir, camera, width, height, margin = {} }) {
  const { top = 56, bottom = 16, left = 12, right = 12 } = margin;
  const look = dir.clone().normalize().negate();
  const across = new THREE.Vector3().crossVectors(look, WORLD_UP).normalize();
  const up = new THREE.Vector3().crossVectors(across, look).normalize();
  const centre = box.getCenter(new THREE.Vector3());
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanH = tanV * (width / Math.max(1, height));
  // the usable part of the frame on each side of its middle, in NDC
  const ndc = (m, size) => Math.max(0.2, 1 - (2 * m) / size);
  const [t, b, l, r] = [ndc(top, height), ndc(bottom, height), ndc(left, width), ndc(right, width)];
  const corners = [];
  const p = new THREE.Vector3();
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        p.set(x, y, z).sub(centre);
        corners.push({ x: p.dot(across), y: p.dot(up), z: p.dot(look) });
      }
  // The camera sits `d` back from (centre + across·sx + up·sy); for a given d, find shifts that fit every corner.
  const shiftsFor = (d) => {
    let xlo = Number.NEGATIVE_INFINITY;
    let xhi = Number.POSITIVE_INFINITY;
    let ylo = Number.NEGATIVE_INFINITY;
    let yhi = Number.POSITIVE_INFINITY;
    for (const c of corners) {
      const depth = d + c.z;
      if (depth <= 1e-3) return null;
      xlo = Math.max(xlo, c.x - r * depth * tanH);
      xhi = Math.min(xhi, c.x + l * depth * tanH);
      ylo = Math.max(ylo, c.y - t * depth * tanV);
      yhi = Math.min(yhi, c.y + b * depth * tanV);
    }
    return xlo <= xhi && ylo <= yhi ? { sx: (xlo + xhi) / 2, sy: (ylo + yhi) / 2 } : null;
  };
  let near = 0;
  let far = 1;
  while (shiftsFor(far) == null && far < 1e5) far *= 2;
  for (let i = 0; i < 40; i++) {
    const mid = (near + far) / 2;
    if (shiftsFor(mid) == null) near = mid;
    else far = mid;
  }
  const s = shiftsFor(far) ?? { sx: 0, sy: 0 };
  const target = centre.clone().addScaledVector(across, s.sx).addScaledVector(up, s.sy);
  return { target, position: target.clone().addScaledVector(look, -far) };
}
