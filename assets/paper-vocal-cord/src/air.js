// The air in front of the paper, in millimetres: many small particles in a fan that opens from the slot (a slab
// ±7 mm deep, thickening away from the paper, ±46° up and down about its axis). The sound spreads from the slot
// every way forward; the figure shows the slice that faces the camera, so its bands read without foreshortening. When the flaps vibrate each particle swings to
// and fro along the way the sound goes, in its own place (a longitudinal wave, ξ = −a·sin ω(t − r/v)); where they
// bunch the air is squeezed (সংকোচন, darker teal), where they spread it is thinned (প্রসারণ, lighter teal). One
// particle is drawn bigger in green with a mark at its resting place, to show it only swings in place.
import * as THREE from 'three';
import { airAt } from './reading.js';

export const FAN = { r0: 9, r1: 150, spread: THREE.MathUtils.degToRad(46), depth: 2.2 };
export const ORIGIN = new THREE.Vector3(1.2, 0, 0);
export const TEAL = { dark: new THREE.Color('#06535e'), mid: new THREE.Color('#2fa3b0'), light: new THREE.Color('#bfeef2') };
export const GREEN = '#2b8a3e';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A soft round dot (for the particles), drawn once. */
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const r = g.createRadialGradient(28, 26, 2, 32, 32, 30);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.55, 'rgba(235,235,235,1)');
  r.addColorStop(0.82, 'rgba(160,160,160,1)');
  r.addColorStop(1, 'rgba(160,160,160,0)');
  g.fillStyle = r;
  g.beginPath();
  g.arc(32, 32, 30, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** `axis`: the fan's middle direction (unit, horizontal), from the slot. */
export function createAir(axis = new THREE.Vector3(1, 0, 0)) {
  const across = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0)).normalize();
  const root = new THREE.Group();
  root.name = 'Air';
  root.userData.noExport = true;
  const rand = rng(29);
  // a jittered even pattern over the fan (rows of particles about 2.4 mm apart), two thin layers: the bunching of a
  // compression reads clearly against it
  const spots = [];
  const step = 2.4;
  for (let r = FAN.r0; r <= FAN.r1; r += step) {
    const m = Math.max(1, Math.round((2 * FAN.spread * r) / step));
    for (let j = 0; j < m; j++)
      for (const layer of [-1, 1]) {
        const th = -FAN.spread + ((j + 0.5 + (layer > 0 ? 0.5 : 0) + (rand() - 0.5) * 0.5) / m) * 2 * FAN.spread;
        spots.push([
          r + (rand() - 0.5) * step * 0.5 + (layer > 0 ? step / 2 : 0),
          Math.min(FAN.spread, Math.max(-FAN.spread, th)),
          layer * FAN.depth * (0.5 + 0.3 * rand()),
        ]);
      }
  }
  const n = spots.length;
  const rest = new Float32Array(n * 3);
  const dirs = new Float32Array(n * 3); // the way the sound goes at each particle
  const radius = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [r, th, z] = spots[i];
    const c = Math.cos(th);
    dirs[i * 3] = axis.x * c;
    dirs[i * 3 + 1] = Math.sin(th);
    dirs[i * 3 + 2] = axis.z * c;
    radius[i] = r;
    rest[i * 3] = ORIGIN.x + r * dirs[i * 3] + z * across.x;
    rest[i * 3 + 1] = ORIGIN.y + r * dirs[i * 3 + 1];
    rest[i * 3 + 2] = ORIGIN.z + r * dirs[i * 3 + 2] + z * across.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(rest.slice(), 3));
  const colors = new Float32Array(n * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.boundingSphere = new THREE.Sphere(ORIGIN.clone().addScaledVector(axis, FAN.r1 / 2), FAN.r1);
  const dot = dotTexture();
  const mat = new THREE.PointsMaterial({
    name: 'AirParticles',
    size: 2.2,
    sizeAttenuation: true,
    vertexColors: true,
    map: dot,
    alphaTest: 0.35,
    toneMapped: false,
  });
  const points = new THREE.Points(geo, mat);
  points.name = 'AirParticles';
  root.add(points);

  // the one particle we follow: on the axis, a green bead and a thin mark where it rests
  const followR = 34;
  const bead = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 20, 14),
    new THREE.MeshStandardMaterial({ name: 'Bead', color: GREEN, roughness: 0.35, emissive: GREEN, emissiveIntensity: 0.25 }),
  );
  bead.name = 'OneParticle';
  const beadRest = ORIGIN.clone().addScaledVector(axis, followR).addScaledVector(across, -3);
  bead.position.copy(beadRest);
  const mark = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 9, 8),
    new THREE.MeshBasicMaterial({ color: GREEN, toneMapped: false, transparent: true, opacity: 0.8 }),
  );
  mark.position.copy(beadRest);
  root.add(bead, mark);

  const c = new THREE.Color();
  const at = { shift: 0, squeeze: 0 };
  /**
   * Draws the air at time t (s, slowed) for a wave { speed, omega, lambda } and a source whose vibration at an
   * earlier time τ was `on(τ)` (0 … 1).
   */
  function update(t, wave, on) {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      const r = radius[i];
      const { shift, squeeze } = airAt(r, t, wave, on, at);
      const fall = Math.min(1, 1.6 / Math.sqrt(0.08 * r + 1)); // weaker further out, gently
      const d = shift * fall;
      pos[i * 3] = rest[i * 3] + d * dirs[i * 3];
      pos[i * 3 + 1] = rest[i * 3 + 1] + d * dirs[i * 3 + 1];
      pos[i * 3 + 2] = rest[i * 3 + 2] + d * dirs[i * 3 + 2];
      const q = squeeze * fall;
      if (q >= 0) c.copy(TEAL.mid).lerp(TEAL.dark, Math.min(1, q * 1.1));
      else c.copy(TEAL.mid).lerp(TEAL.light, Math.min(1, -q * 1.1));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    const b = airAt(followR, t, wave, on, at);
    const fall = Math.min(1, 1.6 / Math.sqrt(0.08 * followR + 1));
    bead.position.copy(beadRest).addScaledVector(axis, b.shift * fall);
  }

  return { root, points, bead, beadRest, mark, update, followR, axis };
}
