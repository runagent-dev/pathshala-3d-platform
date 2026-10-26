// Camera framing for the side view of the street. The front view uses a long lens (a narrow field of view, far
// back), so the two lanes are drawn at almost the same scale and two equal arrows look equal. Seen from `elev`
// above the road, a point (y, z) lands at the screen height u = y cos(elev) − z sin(elev).
import * as THREE from 'three';

/** Screen height (in metres at the lanes) of a point at height y and depth z, seen from `elev` above. */
export const screenU = (y, z, elev) => y * Math.cos(elev) - z * Math.sin(elev);

/**
 * The front view's distance and height: the strip of screen heights [uMin, uMax] must fit between `margin.top`
 * pixels (the corner buttons, and room for the label over the highest arrow) and `margin.bottom` pixels (room for
 * the labels under the lowest body), with at least `minSpan` metres of road across, `margin.side` pixels in from
 * each side.
 * Returns { d, uc, span }: camera distance, the screen height of the view's centre, the metres of road across.
 */
export function frontFit({ camera, width, height, uMin, uMax, minSpan, margin = { top: 72, bottom: 44, side: 8 } }) {
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const aspect = width / Math.max(1, height);
  const usableH = Math.max(0.3, 1 - (margin.top + margin.bottom) / height);
  const usableW = Math.max(0.5, 1 - (2 * margin.side) / width);
  const H = Math.max((uMax - uMin) / usableH, minSpan / usableW / aspect) * 1.03; // the long lens is not quite flat
  const top = (margin.top / height) * H;
  const bottom = (margin.bottom / height) * H;
  const uc = (uMax + uMin) / 2 + (top - bottom) / 2;
  return { d: H / (2 * tanV), uc, span: H * aspect * usableW };
}

/** Camera position and target for the front view centred on road x = xc. */
export function frontPose(fit, xc, elev) {
  const target = new THREE.Vector3(xc, fit.uc * Math.cos(elev), -fit.uc * Math.sin(elev));
  const position = target.clone().add(new THREE.Vector3(0, Math.sin(elev), Math.cos(elev)).multiplyScalar(fit.d));
  return { position, target };
}

/** A 3/4 view of a sphere of `radius` round `centre`, from direction `dir`, for the camera's fov and aspect. */
export function spherePose({ camera, width, height, centre, radius, dir }) {
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (width / Math.max(1, height)));
  const d = radius / Math.sin(Math.min(vfov, hfov) / 2);
  return { target: centre.clone(), position: centre.clone().addScaledVector(dir.clone().normalize(), d) };
}
