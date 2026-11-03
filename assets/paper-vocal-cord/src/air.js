// The air round the paper, in millimetres.
// - The sound: a slice of the spreading sound in a level plane through the upper part of the slot, a half-disc in front
//   of it (the paper is behind the slot, so the slice never covers the paper or the flaps). Two layers:
//   · a smooth surface whose colour follows how squeezed the air is: darker teal where it is squeezed (সংকোচন), lighter
//     where it is thinned (প্রসারণ), so the compressions read as clear curved bands centred on the slot, travelling out;
//   · many small particles over it, each swinging to and fro along the line from the slot in its own place
//     (ξ = −a·sin ω(t − r/v)), so they bunch in the dark bands and spread in the light ones.
//   One particle is drawn bigger in green, with a mark at its resting place, to show it only swings.
// - The breath: pale streaks flowing in through the open back of the fold, squeezing between the two flaps when they
//   open, and a short jet out of the slot that fades.
import * as THREE from 'three';
import { SHEET, SLOT_Y } from './paper.js';
import { airAt } from './reading.js';

export const FAN = { r0: 3.5, r1: 64, spread: THREE.MathUtils.degToRad(80), depth: 0.7, step: 1.9 };
/**
 * Where the drawn slice of the sound starts: just in front of the crease, in the upper part of the slot (a level slice
 * there is never hidden behind the flaps when the camera looks into the fold from above).
 */
export const SOUND_Y = SHEET.H / 2 - 3;
export const ORIGIN = new THREE.Vector3(0.6, SOUND_Y, 0);
export const TEAL = { dark: new THREE.Color('#05454e'), mid: new THREE.Color('#2a95a2'), light: new THREE.Color('#c8f1f5') };
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
  r.addColorStop(0.82, 'rgba(170,170,170,1)');
  r.addColorStop(1, 'rgba(170,170,170,0)');
  g.fillStyle = r;
  g.beginPath();
  g.arc(32, 32, 30, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const smooth = (a, b, x) => {
  const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
/** How strongly the drawn wave shows at a distance r (mm): weaker further out, gently (the sound spreads). */
const fallOf = (r) => Math.min(1, 1.6 / Math.sqrt(0.05 * r + 1));

/**
 * `axis`: the half-disc's middle direction (unit), from the slot; `up`: the other direction of its plane (unit, at
 * right angles to axis). The figure lays the half-disc level, in front of the slot.
 */
export function createAir(axis = new THREE.Vector3(1, 0, 0), up = new THREE.Vector3(0, 0, 1)) {
  const across = new THREE.Vector3().crossVectors(axis, up).normalize();
  const root = new THREE.Group();
  root.name = 'Air';
  root.userData.noExport = true;
  const rand = rng(29);
  const dot = dotTexture();
  const at = { shift: 0, squeeze: 0 };
  const c = new THREE.Color();
  const shade = (q, out) => {
    if (q >= 0) out.copy(TEAL.mid).lerp(TEAL.dark, Math.min(1, q));
    else out.copy(TEAL.mid).lerp(TEAL.light, Math.min(1, -q));
    return out;
  };

  // ── the bands: a smooth half-disc, one ring of vertices every 0.4 mm ─────────────────────────────────────────────
  const NR = Math.round((FAN.r1 - FAN.r0) / 0.4);
  const NT = 40;
  const bPos = new Float32Array((NR + 1) * (NT + 1) * 3);
  const bCol = new Float32Array((NR + 1) * (NT + 1) * 4);
  const edgeFade = new Float32Array(NT + 1);
  const ringR = new Float32Array(NR + 1);
  const index = [];
  for (let j = 0; j <= NR; j++) {
    const r = FAN.r0 + (j / NR) * (FAN.r1 - FAN.r0);
    ringR[j] = r;
    for (let i = 0; i <= NT; i++) {
      const th = -FAN.spread + (i / NT) * 2 * FAN.spread;
      const k = (j * (NT + 1) + i) * 3;
      const cs = Math.cos(th);
      const sn = Math.sin(th);
      bPos[k] = ORIGIN.x + r * (axis.x * cs + up.x * sn);
      bPos[k + 1] = ORIGIN.y + r * (axis.y * cs + up.y * sn);
      bPos[k + 2] = ORIGIN.z + r * (axis.z * cs + up.z * sn);
      if (j < NR && i < NT) {
        const a = j * (NT + 1) + i;
        const b = a + NT + 1;
        index.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  for (let i = 0; i <= NT; i++) edgeFade[i] = smooth(0, 0.22, Math.min(i, NT - i) / NT);
  const bandGeo = new THREE.BufferGeometry();
  bandGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  bandGeo.setAttribute('color', new THREE.BufferAttribute(bCol, 4));
  bandGeo.setIndex(index);
  const bandMat = new THREE.MeshBasicMaterial({
    name: 'SoundBands',
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const bands = new THREE.Mesh(bandGeo, bandMat);
  bands.name = 'SoundBands';
  bands.renderOrder = 1;
  root.add(bands);

  // ── the particles: a jittered even pattern over the half-disc, two thin layers ───────────────────────────────────
  const spots = [];
  const step = FAN.step;
  for (let r = FAN.r0 + 1.5; r <= FAN.r1; r += step) {
    const m = Math.max(1, Math.round((2 * FAN.spread * r) / step));
    for (let j = 0; j < m; j++)
      for (const layer of [-1, 1]) {
        const th = -FAN.spread + ((j + 0.5 + (layer > 0 ? 0.5 : 0) + (rand() - 0.5) * 0.9) / m) * 2 * FAN.spread;
        spots.push([
          r + (rand() - 0.5) * step * 0.9 + (layer > 0 ? step / 2 : 0),
          Math.min(FAN.spread * 0.97, Math.max(-FAN.spread * 0.97, th)),
          layer * FAN.depth,
        ]);
      }
  }
  const n = spots.length;
  const rest = new Float32Array(n * 3);
  const dirs = new Float32Array(n * 3); // the way the sound goes at each particle
  const radius = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [r, th, z] = spots[i];
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    dirs[i * 3] = axis.x * cs + up.x * sn;
    dirs[i * 3 + 1] = axis.y * cs + up.y * sn;
    dirs[i * 3 + 2] = axis.z * cs + up.z * sn;
    radius[i] = r;
    rest[i * 3] = ORIGIN.x + r * dirs[i * 3] + z * across.x;
    rest[i * 3 + 1] = ORIGIN.y + r * dirs[i * 3 + 1] + z * across.y;
    rest[i * 3 + 2] = ORIGIN.z + r * dirs[i * 3 + 2] + z * across.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(rest.slice(), 3));
  // colour and opacity: the particles show only where the wave is (at rest they would read as dirt on the sky)
  const colors = new Float32Array(n * 4);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  const mid = ORIGIN.clone().addScaledVector(axis, FAN.r1 / 2);
  geo.boundingSphere = new THREE.Sphere(mid, FAN.r1);
  bandGeo.boundingSphere = new THREE.Sphere(mid.clone(), FAN.r1);
  const mat = new THREE.PointsMaterial({
    name: 'AirParticles',
    size: 0.75,
    sizeAttenuation: true,
    vertexColors: true,
    map: dot,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const points = new THREE.Points(geo, mat);
  points.name = 'AirParticles';
  points.renderOrder = 2;
  root.add(points);

  // the one particle we follow: on the axis, a green bead and a thin mark across the way it swings, where it rests
  const followR = 12;
  const bead = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 24, 16),
    new THREE.MeshStandardMaterial({ name: 'Bead', color: GREEN, roughness: 0.35, emissive: GREEN, emissiveIntensity: 0.3 }),
  );
  bead.name = 'OneParticle';
  bead.renderOrder = 3;
  const beadRest = ORIGIN.clone().addScaledVector(axis, followR).addScaledVector(across, -1.2);
  bead.position.copy(beadRest);
  const mark = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 6, 8), new THREE.MeshBasicMaterial({ color: GREEN, toneMapped: false }));
  mark.position.copy(ORIGIN).addScaledVector(axis, followR).addScaledVector(across, -0.3);
  mark.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
  root.add(bead, mark);

  // ── the breath ──────────────────────────────────────────────────────────────
  const sn = 120;
  const lanes = [];
  for (let i = 0; i < sn; i++)
    lanes.push({ y: SLOT_Y + (rand() * 2 - 1) * 8, z: rand() * 2 - 1, q: rand(), sp: 0.75 + rand() * 0.5, out: rand() * 2 - 1 });
  const sPos = new Float32Array(sn * 3);
  const sCol = new Float32Array(sn * 4);
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sgeo.setAttribute('color', new THREE.BufferAttribute(sCol, 4));
  sgeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(-15, SLOT_Y, 0), 50);
  const smat = new THREE.PointsMaterial({
    name: 'Breath',
    size: 1.1,
    map: dot,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const breath = new THREE.Points(sgeo, smat);
  breath.name = 'Breath';
  breath.renderOrder = 4;
  breath.visible = false;
  root.add(breath);
  const BREATH_COLOR = new THREE.Color('#f4fbff');

  /**
   * Draws the sound at time t (s, slowed) for a wave { speed, omega, lambda } and a source whose vibration at an
   * earlier time τ was `on(τ)` (0 … 1).
   */
  function update(t, wave, on) {
    // the bands: one colour per ring
    for (let j = 0; j <= NR; j++) {
      const r = ringR[j];
      const { squeeze } = airAt(r, t, wave, on, at);
      const env = on(t - r / wave.speed);
      const fall = fallOf(r);
      shade(squeeze * Math.min(1, fall * 1.6), c);
      const a = 0.62 * env * smooth(FAN.r1, FAN.r1 * 0.72, r) * smooth(FAN.r0, FAN.r0 + 2.5, r);
      for (let i = 0; i <= NT; i++) {
        const k = (j * (NT + 1) + i) * 4;
        bCol[k] = c.r;
        bCol[k + 1] = c.g;
        bCol[k + 2] = c.b;
        bCol[k + 3] = a * edgeFade[i];
      }
    }
    bandGeo.attributes.color.needsUpdate = true;
    // the particles
    const pos = geo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      const r = radius[i];
      const { shift, squeeze } = airAt(r, t, wave, on, at);
      const fall = fallOf(r);
      const d = shift * fall;
      pos[i * 3] = rest[i * 3] + d * dirs[i * 3];
      pos[i * 3 + 1] = rest[i * 3 + 1] + d * dirs[i * 3 + 1];
      pos[i * 3 + 2] = rest[i * 3 + 2] + d * dirs[i * 3 + 2];
      // the particles stay a darker teal than the band under them, so they read on both shades
      shade(0.35 + 0.65 * squeeze * fall, c);
      colors[i * 4] = c.r;
      colors[i * 4 + 1] = c.g;
      colors[i * 4 + 2] = c.b;
      colors[i * 4 + 3] = Math.min(1, on(t - r / wave.speed) * 1.4);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    const b = airAt(followR, t, wave, on, at);
    bead.position.copy(beadRest).addScaledVector(axis, b.shift * fallOf(followR));
  }

  /**
   * The breath: `dt` (s), `flow` 0 … 1 (blowing), `open` 0 … 1 (how open the slot is now).
   * The streaks come down the inside of the fold, wait at the shut slot and rush through when it opens, then fade.
   */
  function updateBreath(dt, flow, open) {
    breath.visible = flow > 0.01;
    if (!breath.visible) return;
    for (let i = 0; i < sn; i++) {
      const p = lanes[i];
      const near = p.q > 0.6 && p.q < 0.72;
      p.q += dt * p.sp * (near ? 0.1 + 1.9 * open : 0.5);
      if (p.q >= 1) p.q -= 1;
      let x;
      let y;
      let z;
      let a;
      if (p.q < 0.72) {
        // from the open back of the fold (−x) toward the crease, narrowing with the V to the slot
        const k = p.q / 0.72;
        x = -40 + k * 39.5;
        y = SLOT_Y + (p.y - SLOT_Y) * (1 - 0.2 * k);
        z = p.z * Math.max(0, -x) * 0.45; // inside the V (its half-width is 0.58·|x|), narrowing to the slot
        a = Math.min(1, k * 4) * 0.75;
      } else {
        // the jet out of the slot, spreading a little and fading
        const k = (p.q - 0.72) / 0.28;
        x = 0.8 + k * 20;
        y = SLOT_Y + (p.y - SLOT_Y) * 0.8;
        z = p.out * k * 4;
        a = (1 - k) * 0.8 * (0.3 + 0.7 * open);
      }
      sPos[i * 3] = x;
      sPos[i * 3 + 1] = y;
      sPos[i * 3 + 2] = z;
      sCol[i * 4] = BREATH_COLOR.r;
      sCol[i * 4 + 1] = BREATH_COLOR.g;
      sCol[i * 4 + 2] = BREATH_COLOR.b;
      sCol[i * 4 + 3] = a * flow;
    }
    sgeo.attributes.position.needsUpdate = true;
    sgeo.attributes.color.needsUpdate = true;
  }

  return { root, points, bands, bead, beadRest, mark, breath, update, updateBreath, followR, axis };
}
