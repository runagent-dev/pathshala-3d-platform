// The water in the tank: a fine grid (about 3 mm between points, 16 to a wavelength) whose heights are the sum of the
// two dippers' ripples (src/reading.js), updated in place each frame, with smooth normals from the exact slope of each
// ripple (no recomputed normals) and a colour that follows the height (crests a light aqua, troughs a deep blue),
// so strong and still places read at a glance even on a small phone. Heights are drawn EXAG times taller than real
// ripples (about 1 mm), as the panel says.
import * as THREE from 'three';
import { K, OMEGA, TANK, amplitudeAt, amplitudeSlope, envelope, sources } from './reading.js';

export const EXAG = 6;
const NX = 200;
const NZ = 148;
const EDGE = 0.025; // the last 2.5 cm run onto the foam beaches and die out

const DEEP = new THREE.Color('#0f4a6e');
const MID = new THREE.Color('#2a7fae');
const CREST = new THREE.Color('#a9e1f2');

export function createWater() {
  const geo = new THREE.PlaneGeometry(TANK.w, TANK.d, NX, NZ);
  geo.rotateX(-Math.PI / 2);
  const pos = /** @type {THREE.BufferAttribute} */ (geo.attributes.position);
  const nor = /** @type {THREE.BufferAttribute} */ (geo.attributes.normal);
  const n = pos.count;
  const colors = new Float32Array(n * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const xs = new Float32Array(n);
  const zs = new Float32Array(n);
  const fade = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    xs[i] = pos.getX(i);
    zs[i] = pos.getZ(i);
    const dEdge = Math.min(TANK.w / 2 - Math.abs(xs[i]), TANK.d / 2 - Math.abs(zs[i]));
    const k = Math.max(0, Math.min(1, dEdge / EDGE));
    fade[i] = k * k * (3 - 2 * k);
  }
  const mat = new THREE.MeshPhysicalMaterial({
    name: 'Water',
    vertexColors: true,
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 0.9,
    transparent: true,
    opacity: 0.76,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'Water';
  mesh.receiveShadow = true;

  const tmp = new THREE.Color();
  const colourRef = EXAG * amplitudeAt(0.25) * 1.3; // the height that shows as the full crest colour

  /**
   * Draws the surface at time t (real seconds) for sources that touched at on[i] and left at off[i] (null: none /
   * still dipping), gap between them (m), gain (0…1: a quick calming fade).
   */
  function update(t, on, off, gap, gain = 1) {
    const src = sources(gap);
    const active = [0, 1].filter((i) => on[i] != null && t > on[i]);
    for (let i = 0; i < n; i++) {
      let h = 0;
      let gx = 0;
      let gz = 0;
      if (gain > 0 && fade[i] > 0)
        for (const j of active) {
          const dx = xs[i] - src[j].x;
          const dz = zs[i] - src[j].z;
          const r = Math.sqrt(dx * dx + dz * dz) + 1e-6;
          const e = envelope(r, t, on[j], off[j]);
          if (!e) continue;
          const ph = OMEGA * t - K * r;
          const s = Math.sin(ph);
          const a = amplitudeAt(r);
          h += e * a * s;
          const dhdr = e * (amplitudeSlope(r) * s - K * a * Math.cos(ph));
          gx += (dhdr * dx) / r;
          gz += (dhdr * dz) / r;
        }
      const f = EXAG * gain * fade[i];
      h *= f;
      gx *= f;
      gz *= f;
      pos.setY(i, h);
      const inv = 1 / Math.sqrt(gx * gx + 1 + gz * gz);
      nor.setXYZ(i, -gx * inv, inv, -gz * inv);
      const c = Math.max(-1, Math.min(1, h / colourRef));
      if (c >= 0) tmp.copy(MID).lerp(CREST, c);
      else tmp.copy(MID).lerp(DEEP, -c);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }

  /** The drawn height at (x, z) (same sum as update, for the floating balls). */
  function heightAt(x, z, t, on, off, gap, gain = 1) {
    const src = sources(gap);
    let h = 0;
    for (const j of [0, 1]) {
      if (on[j] == null) continue;
      const r = Math.hypot(x - src[j].x, z - src[j].z);
      const e = envelope(r, t, on[j], off[j]);
      if (e) h += e * amplitudeAt(r) * Math.sin(OMEGA * t - K * r);
    }
    return h * EXAG * gain;
  }

  update(0, [null, null], [null, null], 0.15, 0);
  geo.computeBoundingBox();
  geo.boundingBox.min.y = -0.02;
  geo.boundingBox.max.y = 0.02;
  geo.computeBoundingSphere();
  return { mesh, update, heightAt };
}
