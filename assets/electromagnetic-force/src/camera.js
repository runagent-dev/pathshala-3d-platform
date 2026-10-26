// Camera framing for the electromagnetic-force figure: the nearest camera, looking along a given direction, that
// shows every point of a view inside the picture (a margin from its edges) and clear of some boxes on the screen
// (the corner buttons, a note). A point may carry a box in screen pixels round it (room for a label beside it). The
// picture may also slide sideways and down a little (sx, sy px), so the content can step out of the buttons' way
// instead of the camera going back. Pure: no DOM, no scene changes.
import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * @param {{ points: Array<THREE.Vector3 | { p: THREE.Vector3, box: number[] | null }>, dir: THREE.Vector3,
 *           fov: number, aspect: number, width: number, height: number,
 *           keepOff?: Array<{ left: number, top: number, right: number, bottom: number }>, margin?: number,
 *           slide?: { x: number, y: number } }} options
 *   dir: from the target towards the camera (unit); fov: vertical, degrees; keepOff: canvas-pixel boxes.
 * @returns {{ position: THREE.Vector3, target: THREE.Vector3, distance: number }}
 */
export function fitPose({ points, dir, fov, aspect, width, height, keepOff = [], margin = 14, slide = { x: 96, y: 64 } }) {
  const pts = points.map((c) => (c.isVector3 ? { p: c, box: null } : c));
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
  const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const { p } of pts) {
    lo.min(p);
    hi.max(p);
  }
  const target = lo.clone().add(hi).multiplyScalar(0.5);
  const back = dir.clone().normalize();
  const right = new THREE.Vector3().crossVectors(WORLD_UP, back).normalize();
  const up = new THREE.Vector3().crossVectors(back, right);
  const local = pts.map(({ p, box }) => {
    const q = p.clone().sub(target);
    return { x: q.dot(right), y: q.dot(up), z: q.dot(back), box };
  });
  const W = width;
  const H = Math.max(height, 120);
  const tv = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const th = tv * aspect;
  const clear = (px, py) => {
    if (px < margin || px > W - margin || py < margin || py > H - margin) return false;
    return !keepOff.some((r) => px > r.left && px < r.right && py > r.top && py < r.bottom);
  };
  const fits = (d, sx, sy) =>
    local.every(({ x, y, z, box }) => {
      const depth = d - z;
      if (depth < 20) return false;
      const px = W / 2 + (x / (depth * th)) * (W / 2) + sx;
      const py = H / 2 - (y / (depth * tv)) * (H / 2) + sy;
      if (!box) return clear(px, py);
      return clear(px + box[0], py + box[1]) && clear(px + box[2], py + box[1]) && clear(px + box[0], py + box[3]) && clear(px + box[2], py + box[3]);
    });
  let best = null;
  for (let sy = 0; sy <= slide.y; sy += 8)
    for (let sx = -slide.x; sx <= slide.x; sx += 12) {
      let a = 20;
      let b = 8000;
      if (!fits(b, sx, sy)) continue;
      for (let i = 0; i < 26; i++) {
        const mid = (a + b) / 2;
        if (fits(mid, sx, sy)) b = mid;
        else a = mid;
      }
      // a nearer camera wins; of two about as near, the one moved less
      const cost = b * (1 + (Math.abs(sx) + sy) * 0.0004);
      if (!best || cost < best.cost) best = { d: b, sx, sy, cost };
    }
  const d = (best?.d ?? 900) * 1.02;
  const t2 = target.addScaledVector(up, ((best?.sy ?? 0) / (H / 2)) * d * tv).addScaledVector(right, (-(best?.sx ?? 0) / (W / 2)) * d * th);
  return { target: t2, position: t2.clone().addScaledVector(back, d), distance: d };
}
