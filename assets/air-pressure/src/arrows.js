// Many bold arrows in one go: a flat colour with a dark outline, so they read on the sky, the bricks and the tin alike.
// Each set is four instanced meshes (shafts, heads, and the outline of each), so forty-five arrows cost four draw
// calls. `xray: true` draws them over everything (the arrows inside the box, seen through the tin): then the outline
// is a bigger copy drawn first; otherwise it is the inside of a bigger copy (back faces), which only shows round the
// edges and is hidden by the box like the arrow itself.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * @param {{ count: number, color: string, outline?: string, radius: number, head?: number, headRadius?: number,
 *           pad?: number, xray?: boolean, opacity?: number, name?: string }} o
 */
export function createArrowSet({
  count,
  color,
  outline = '#141a24',
  radius,
  head = radius * 4.6,
  headRadius = radius * 2.5,
  pad = radius * 0.55,
  xray = false,
  opacity = 1,
  name = 'Arrows',
}) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  const common = { transparent: true, depthWrite: !xray, depthTest: !xray, toneMapped: false, fog: false };
  const core = new THREE.MeshBasicMaterial({ color, opacity, ...common });
  const rim = new THREE.MeshBasicMaterial({ color: outline, opacity, side: xray ? THREE.FrontSide : THREE.BackSide, ...common });
  const shaftGeo = new THREE.CylinderGeometry(radius, radius, 1, 14).translate(0, 0.5, 0);
  const headGeo = new THREE.ConeGeometry(headRadius, head, 20).translate(0, head / 2, 0);
  const shaftRim = new THREE.CylinderGeometry(radius + pad, radius + pad, 1, 14).translate(0, 0.5, 0);
  const headRim = new THREE.ConeGeometry(headRadius + pad * 1.6, head + pad * 2.6, 20).translate(0, (head + pad * 2.6) / 2, 0);
  const make = (geo, mat, order) => {
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    m.renderOrder = order;
    root.add(m);
    return m;
  };
  const base = xray ? 30 : 0;
  const parts = {
    shaftRim: make(shaftRim, rim, base + 1),
    headRim: make(headRim, rim, base + 1),
    shaft: make(shaftGeo, core, base + 2),
    head: make(headGeo, core, base + 2),
  };
  const q = new THREE.Quaternion();
  const m4 = new THREE.Matrix4();
  const sc = new THREE.Vector3();
  const at = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const tips = Array.from({ length: count }, () => new THREE.Vector3());
  const tails = Array.from({ length: count }, () => new THREE.Vector3());
  const shown = new Array(count).fill(false);
  let thick = 1;

  /** Arrow i from `from` along `dir` (unit), `length` long with its head (0 hides it). */
  function set(i, from, dir, length) {
    if (!(length > 1e-6)) return hide(i);
    q.setFromUnitVectors(UP, dir);
    const h = Math.min(head, length * 0.6);
    const k = h / head; // a short arrow gets a smaller head
    const shaft = Math.max(1e-6, length - h);
    m4.compose(from, q, sc.set(thick, shaft, thick));
    parts.shaft.setMatrixAt(i, m4);
    at.copy(from).addScaledVector(dir, -pad);
    m4.compose(at, q, sc.set(thick, shaft + pad, thick));
    parts.shaftRim.setMatrixAt(i, m4);
    at.copy(from).addScaledVector(dir, shaft);
    m4.compose(at, q, sc.set(k * thick, k, k * thick));
    parts.head.setMatrixAt(i, m4);
    at.addScaledVector(dir, -pad * 1.3 * k);
    parts.headRim.setMatrixAt(i, m4.compose(at, q, sc.set(k * thick, k, k * thick)));
    tails[i].copy(from);
    tips[i].copy(from).addScaledVector(dir, length);
    shown[i] = true;
    dirty();
  }
  function hide(i) {
    for (const p of Object.values(parts)) p.setMatrixAt(i, zero);
    shown[i] = false;
    dirty();
  }
  function dirty() {
    for (const p of Object.values(parts)) p.instanceMatrix.needsUpdate = true;
  }
  function hideAll() {
    for (let i = 0; i < count; i++) hide(i);
  }
  hideAll();
  return {
    root,
    set,
    hide,
    hideAll,
    tips,
    tails,
    shown,
    count,
    /** Make every arrow thicker (≥ 1) without making it longer: set it before `set`. */
    setThickness(k) {
      thick = k;
    },
    setOpacity(a) {
      core.opacity = a;
      rim.opacity = a;
    },
  };
}
