// Bold arrows pointing straight down (the force on each shoe, the pressure under each sole): flat colour inside a
// white outline, drawn over the scenery. All the arrows of one colour are four instanced meshes (the shafts and the
// heads, the outline's shafts and heads), so thirteen pressure arrows cost four draw calls, and moving, stretching or
// pulsing them only rewrites a few matrices. Sizes in metres.
//
//   const set = createDownArrows({ color: '#e03131', count: 13, radius: 0.0034, name: 'Pressure' });
//   scene.add(set.root);
//   set.place(i, x, y, z, length);   // from (x, y, z) straight down, `length` long, head included (0 hides it)
//   set.arrows[i].tip                // where its head ends; .from, .visible
//   set.thick(k); set.pulse(k); set.commit();
import * as THREE from 'three';

const flat = (color, name) =>
  new THREE.MeshBasicMaterial({ name, color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });

/**
 * @param {{ color: THREE.ColorRepresentation, count: number, radius: number, padK?: number, name?: string }} options
 *   padK: the white outline's width as a part of the shaft's radius.
 */
export function createDownArrows({ color, count, radius, padK = 0.65, name = 'Arrows' }) {
  const r = radius;
  const head = r * 5;
  const headR = r * 2.7;
  const pad = r * padK;
  const outline = { r: r + pad, head: head + pad * 2.8, headR: headR + pad * 2 };
  // a unit shaft from y = 0 down to y = −1, and a unit head with its base at y = 0 and its point at y = −1
  const shaftGeo = new THREE.CylinderGeometry(1, 1, 1, 16).translate(0, -0.5, 0);
  const headGeo = new THREE.ConeGeometry(1, 1, 24).rotateX(Math.PI).translate(0, -0.5, 0);
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  const make = (geo, mat, order, part) => {
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.name = `${name}${part}`;
    m.renderOrder = order;
    m.frustumCulled = false; // small, always near the shoes
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(m);
    return m;
  };
  const coreMat = flat(color, `${name}Core`);
  const rimMat = flat('#ffffff', `${name}Outline`);
  const rimShaft = make(shaftGeo, rimMat, 20, 'OutlineShafts');
  const rimHead = make(headGeo, rimMat, 20, 'OutlineHeads');
  const coreShaft = make(shaftGeo, coreMat, 21, 'Shafts');
  const coreHead = make(headGeo, coreMat, 21, 'Heads');

  const arrows = Array.from({ length: count }, () => ({ from: new THREE.Vector3(), tip: new THREE.Vector3(), length: 0, visible: false }));
  let thickK = 1;
  let pulseK = 1;
  const m4 = new THREE.Matrix4();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

  /** Shaft and head of one arrow (or its outline) from y0 down, `len` long, a short one with a smaller head. */
  function write(i, a, size, y0, len) {
    const h = Math.min(size.head, len * 0.6);
    const body = len - h;
    const k = h / size.head;
    const tk = thickK * pulseK;
    const meshes = size === outline ? [rimShaft, rimHead] : [coreShaft, coreHead];
    m4.makeScale(size.r * tk, Math.max(body, 1e-6) * pulseK, size.r * tk).setPosition(a.from.x, y0, a.from.z);
    meshes[0].setMatrixAt(i, m4);
    m4.makeScale(size.headR * k * tk, h * pulseK, size.headR * k * tk).setPosition(a.from.x, y0 - body * pulseK, a.from.z);
    meshes[1].setMatrixAt(i, m4);
  }

  function commit() {
    arrows.forEach((a, i) => {
      if (!a.visible) {
        for (const m of [rimShaft, rimHead, coreShaft, coreHead]) m.setMatrixAt(i, ZERO);
        return;
      }
      write(i, a, { r, head, headR }, a.from.y, a.length);
      write(i, a, outline, a.from.y + pad * pulseK, a.length + pad * 2.2);
    });
    for (const m of [rimShaft, rimHead, coreShaft, coreHead]) m.instanceMatrix.needsUpdate = true;
  }

  return {
    root,
    arrows,
    /** Arrow i from (x, y, z) straight down, `length` long (head included); 0 hides it. Call commit() after. */
    place(i, x, y, z, length) {
      const a = arrows[i];
      a.from.set(x, y, z);
      a.length = length;
      a.visible = length > 1e-9;
      a.tip.set(x, y - length, z);
    },
    hide(i) {
      arrows[i].visible = false;
    },
    /** k times as thick (so the arrows keep a bold width on the screen when the camera is far). */
    thick(k) {
      thickK = k;
    },
    /** k times as big, from their tails (a symbol's arrows pulse when its button is tapped). */
    pulse(k) {
      pulseK = k;
    },
    commit,
  };
}
