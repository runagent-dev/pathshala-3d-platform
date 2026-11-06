// The air, drawn as small particles (one InstancedMesh): a steady crowd over the drink in the glass, and the same crowd
// in the space inside the mouth (the same pressure). When the student sucks, most of the mouth's particles go back
// into the throat and fade, so the mouth's crowd thins out; the crowd over the drink stays. Nothing moves while idle.
import * as THREE from 'three';
import { CAVITY, DRINK_Y, GLASS, STRAW } from './glass.js';

export const AIR_COLORS = { outside: '#3bc9db', mouth: '#8f6cf7' };
const R = 0.0016; // a particle's radius (m)
// The same crowd everywhere, as the eye sees it: the glass is seen through its whole depth and the mouth only through
// its thin section, so the glass's particles are spaced a little wider in space to look as close together on the screen.
const SPACING = 0.0125;
const SPACING_MOUTH = 0.0085;

const innerR = (y) => GLASS.rBot - GLASS.wall + ((GLASS.rTop - GLASS.rBot) * y) / GLASS.h;

/** @param {THREE.Object3D} mouth the mouth's section (its matrixWorld places the space inside it) */
export function createAir(mouth) {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const jitter = () => (rnd() - 0.5) * SPACING * 0.6;
  /** @type {{ p: THREE.Vector3, exit?: THREE.Vector3, leave: boolean, delay: number, mouth: boolean }[]} */
  const list = [];

  // over the drink, inside the glass and just above its rim; never inside the straw
  const y0 = DRINK_Y + 0.0045;
  const y1 = GLASS.h + 0.006;
  for (let y = y0; y <= y1; y += SPACING)
    for (let x = -GLASS.rTop; x <= GLASS.rTop; x += SPACING)
      for (let z = -GLASS.rTop; z <= GLASS.rTop; z += SPACING) {
        const p = new THREE.Vector3(x + jitter(), y + jitter() * 0.5, z + jitter());
        if (p.y < y0) p.y = y0;
        if (Math.hypot(p.x, p.z) > innerR(Math.min(p.y, GLASS.h)) - 0.0028) continue;
        if (Math.hypot(p.x - STRAW.x, p.z - STRAW.z) < STRAW.r + 0.0028) continue;
        list.push({ p, leave: false, delay: 0, mouth: false });
      }
  const outsideCount = list.length;

  // inside the mouth: the same spacing, in the mouth's own frame, then to the world
  mouth.updateMatrixWorld(true);
  const exit = new THREE.Vector3(CAVITY.x[0] - 0.006, 0, (CAVITY.z[0] + CAVITY.z[1]) / 2).applyMatrix4(mouth.matrixWorld);
  let i = 0;
  for (let x = CAVITY.x[0] + 0.003; x <= CAVITY.x[1]; x += SPACING_MOUTH)
    for (let y = CAVITY.y[0]; y <= CAVITY.y[1] + 1e-6; y += SPACING_MOUTH)
      for (let z = CAVITY.z[0]; z <= CAVITY.z[1] + 1e-6; z += SPACING_MOUTH) {
        const p = new THREE.Vector3(x + jitter(), y + jitter() * 0.5, z + jitter() * 0.4).applyMatrix4(mouth.matrixWorld);
        // two in three go back into the throat when the student sucks
        list.push({ p, exit, leave: i++ % 3 !== 1, delay: rnd() * 0.45, mouth: true });
      }

  const mat = new THREE.MeshStandardMaterial({ name: 'Air', color: '#ffffff', roughness: 0.35, metalness: 0 });
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(R, 1), mat, list.length);
  mesh.name = 'AirParticles';
  mesh.userData.noExport = true;
  mesh.frustumCulled = false;
  const outside = new THREE.Color(AIR_COLORS.outside);
  const inMouth = new THREE.Color(AIR_COLORS.mouth);
  list.forEach((it, j) => mesh.setColorAt(j, it.mouth ? inMouth : outside));

  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const S = new THREE.Vector3();
  const P = new THREE.Vector3();
  let last = -1;
  /** How far the mouth's air has gone (0: the same crowd as outside, 1: thinned out). */
  function setThin(k) {
    if (k === last) return;
    last = k;
    list.forEach((it, j) => {
      let s = 1;
      P.copy(it.p);
      if (it.leave) {
        const q = Math.max(0, Math.min(1, (k - it.delay) / 0.55));
        const e = q * q * (3 - 2 * q);
        P.lerp(it.exit, e);
        s = 1 - e;
      }
      M.compose(P, Q, S.setScalar(Math.max(1e-4, s)));
      mesh.setMatrixAt(j, M);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  setThin(0);
  const mouthTotal = list.length - outsideCount;
  return {
    mesh,
    setThin,
    /** How many particles: over the drink, in the mouth, and in the mouth after sucking. */
    counts: { outside: outsideCount, mouth: mouthTotal, mouthAfter: list.filter((it) => it.mouth && !it.leave).length },
  };
}
