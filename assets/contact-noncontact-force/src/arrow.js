// The force arrow: a bold round shaft and a cone head in the colour of the force's kind (স্পর্শ বল orange, অস্পর্শ বল
// violet, the test's grey "এই বল"), in flat colour inside a white outline, drawn over the scene (no depth test), so it
// never melts into what is behind it: an orange pull beside the yellow hook block, the push on the brown carton, a
// violet weight over the football. set(from, dir, length) places it with its tail at `from`; the head keeps its size
// and the shaft stretches. Sizes are in the scene's metres, so each example makes its own (a 5 cm nail needs a thinner
// arrow than a crane). It reports its two ends for the labels. Not exported to the GLB.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
/** The outline is shared by every arrow: white, unlit, drawn first. */
const OUTLINE = new THREE.MeshBasicMaterial({
  name: 'ArrowOutline',
  color: '#ffffff',
  transparent: true,
  depthTest: false,
  depthWrite: false,
  toneMapped: false,
  fog: false,
});

export function createArrow({ color, radius = 0.03, head = 0.16, headRadius = 0.075, name = 'ForceArrow' }) {
  const material = new THREE.MeshBasicMaterial({
    name: `${name}Material`,
    color,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const pad = radius * 0.65; // the white rim round the shaft (and a little more round the head)
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 14).translate(0, 0.5, 0), material);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 20).translate(0, head / 2, 0), material);
  const shaftRim = new THREE.Mesh(new THREE.CylinderGeometry(radius + pad, radius + pad, 1, 14).translate(0, 0.5, 0), OUTLINE);
  const headLen = head + pad * 2.6;
  const tipRim = new THREE.Mesh(new THREE.ConeGeometry(headRadius + pad * 1.8, headLen, 20).translate(0, headLen / 2, 0), OUTLINE);
  shaftRim.renderOrder = tipRim.renderOrder = 30;
  shaft.renderOrder = tip.renderOrder = 31;
  root.add(shaftRim, tipRim, shaft, tip);
  root.visible = false;
  const d = new THREE.Vector3();
  const tail = new THREE.Vector3();
  const end = new THREE.Vector3();

  return {
    root,
    /** Tail at `from`, pointing along `dir`, `length` long (head included). */
    set(from, dir, length) {
      d.copy(dir).normalize();
      tail.copy(from);
      end.copy(from).addScaledVector(d, length);
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, d);
      const body = Math.max(0.0001, length - head);
      const k = Math.min(1, length / head);
      const long = length > head;
      shaft.scale.set(1, long ? body : 0.0001, 1);
      tip.position.y = long ? body : 0;
      tip.scale.setScalar(k);
      // the rim: from just behind the tail to just past the tip
      shaftRim.position.y = -pad;
      shaftRim.scale.set(1, long ? body + pad : 0.0001, 1);
      tipRim.position.y = (long ? body : 0) - pad * 1.3 * k;
      tipRim.scale.setScalar(k);
    },
    /** Its colour: the kind of force in the শেখো view, a plain grey "this force" in a test question. */
    setColor(c) {
      material.color.set(c);
    },
    /** 0 (hidden) … 1 (solid). */
    setOpacity(a) {
      material.opacity = a;
      root.visible = a > 0.01;
    },
    /** The tail and the tip, world space, for the labels. */
    ends(outTail, outTip) {
      root.parent?.updateWorldMatrix(true, false);
      const m = root.parent?.matrixWorld;
      outTail.copy(tail);
      outTip.copy(end);
      if (m) {
        outTail.applyMatrix4(m);
        outTip.applyMatrix4(m);
      }
    },
  };
}
