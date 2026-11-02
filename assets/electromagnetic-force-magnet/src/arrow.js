// A force arrow (round shaft and cone head) in flat colour inside a white outline, drawn over everything like an
// arrow on a printed diagram, so it stays visible where it passes into the desk and never melts into what is behind
// it (a purple arrow over the blue table, a blue one over the wood). set(from, dir, length) places it (and says
// whether anything changed, so the caller can ask for a new frame); the head keeps its size, the shaft stretches;
// setThickness(k) makes the shaft and the head k times as thick and the head k times as long (for a small picture).
// A helper, never exported to the GLB.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const WHITE = new THREE.MeshBasicMaterial({
  name: 'ArrowOutline',
  color: 0xffffff,
  toneMapped: false,
  depthTest: false,
  depthWrite: false,
  fog: false,
});

/** A shaft and a head of one material; place(length, from, thick) stretches the shaft and keeps the head's size. */
function arrowPart({ radius, head, headRadius, material, order }) {
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 16).translate(0, 0.5, 0), material);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 24).translate(0, head / 2, 0), material);
  shaft.renderOrder = tip.renderOrder = order;
  return {
    meshes: [shaft, tip],
    place(length, from, thick) {
      const h = head * thick;
      const body = Math.max(0.001, length - h);
      const k = Math.max(Math.min(1, length / h), 0.001); // very short arrows: a smaller head
      shaft.position.y = from;
      shaft.scale.set(1, length > h ? body : 0.001, 1);
      tip.position.y = from + (length > h ? body : 0);
      tip.scale.set(k, k * thick, k); // the root is `thick` times as wide: the head as long too
    },
  };
}

/**
 * @param {{ color: THREE.ColorRepresentation, radius?: number, head?: number, headRadius?: number, name?: string }} options
 */
export function createArrow({ color, radius = 1.2, head = 6, headRadius = 3.4, name = 'Arrow' }) {
  const material = new THREE.MeshBasicMaterial({
    name: `${name}Material`,
    color,
    toneMapped: false,
    depthTest: false,
    depthWrite: false,
    fog: false,
  });
  const pad = Math.max(0.55, radius * 0.5); // the outline's width all round (mm)
  const core = arrowPart({ radius, head, headRadius, material, order: 11 });
  const rim = arrowPart({ radius: radius + pad, head: head + pad * 2.6, headRadius: headRadius + pad * 1.8, material: WHITE, order: 10 });
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  root.renderOrder = 10;
  root.visible = false;
  root.add(...rim.meshes, ...core.meshes);
  const d = new THREE.Vector3();
  const end = new THREE.Vector3();
  const last = { from: new THREE.Vector3(Infinity, 0, 0), dir: new THREE.Vector3(), length: -1 };
  let thick = 1;

  return {
    root,
    material,
    /** The point the arrow ends at (world), after the last set(). */
    tip: () => end,
    /** Shaft and head k times as thick, the head k times as long (from the next set()). True if it changed. */
    setThickness(k) {
      if (Math.abs(k - thick) < 1e-3) return false;
      thick = k;
      root.scale.set(k, 1, k);
      last.length = -1; // set() draws it again
      return true;
    },
    /** From a point, along a direction (any length), `length` long (head included); 0 hides it. True if it changed. */
    set(from, dir, length) {
      d.copy(dir).normalize();
      const visible = length > 0.01;
      if (!visible && !root.visible) return false;
      if (visible && root.visible && last.from.distanceToSquared(from) < 1e-6 && last.dir.equals(d) && Math.abs(last.length - length) < 1e-3)
        return false;
      last.from.copy(from);
      last.dir.copy(d);
      last.length = length;
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, d);
      end.copy(from).addScaledVector(d, length);
      core.place(length, 0, thick);
      // the outline: a little longer at both ends (y is not scaled by the thickness: its pad is, by hand)
      rim.place(length + pad * thick * 2.2, -pad * thick, thick);
      root.visible = visible;
      return true;
    },
  };
}
