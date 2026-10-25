// The force arrow: a round shaft and a cone head, in the colour of force. set(from, dir, length) places it with
// its tail at `from`; the head keeps its size and the shaft stretches. Sizes are in the scene's metres, so each
// example makes its own (a 6 cm nail needs a thinner arrow than a crane). Not exported to the GLB.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

export function createArrow({ color, radius = 0.03, head = 0.16, headRadius = 0.075, name = 'ForceArrow', onTop = false }) {
  const material = new THREE.MeshStandardMaterial({
    name: `${name}Material`,
    color,
    roughness: 0.45,
    metalness: 0,
    emissive: new THREE.Color(color).multiplyScalar(0.25),
    transparent: true,
    opacity: 1,
    depthTest: !onTop, // a weight arrow from the middle of a ball is drawn over the ball
  });
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 16).translate(0, 0.5, 0), material);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(headRadius, head, 24).translate(0, head / 2, 0), material);
  shaft.renderOrder = tip.renderOrder = onTop ? 10 : 3;
  root.add(shaft, tip);
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
      shaft.scale.set(1, length > head ? body : 0.0001, 1);
      tip.position.y = length > head ? body : 0;
      tip.scale.setScalar(k);
    },
    /** 0 (hidden) … 1 (solid). */
    setOpacity(a) {
      material.opacity = a;
      material.depthWrite = a >= 0.99;
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
