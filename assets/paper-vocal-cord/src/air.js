// The air round the paper, in millimetres.
// - The sound: a slice of the spreading sound in the upright plane through the slot that faces the camera, a fan from
//   the slot up and to the side, above the paper (never over the flaps). Only air particles, fine and many, evenly
//   spread at rest: each swings to and fro along the line from the slot in its own place (ξ = −a·sin ω(t − r/v)), so
//   they bunch into darker teal shells (সংকোচন) and thin out into lighter ones (প্রসারণ), and the shells travel out.
//   Air at rest is not drawn (it would read as dirt on the sky): the particles show only where the wave is.
//   One particle is drawn bigger in green, with a mark at its resting place, to show it only swings.
// - The breath: a few fine translucent streaks flowing in through the open back of the fold to the slot, waiting at
//   the shut slot and slipping through when it opens.
import * as THREE from 'three';
import { SHEET, SLOT_Y } from './paper.js';
import { airAt } from './reading.js';

/** The fan: radii (mm), its angles in its plane from the axis (rad, + toward `up`), the slab's thickness, the spacing. */
export const FAN = { r0: 3, r1: 58, from: THREE.MathUtils.degToRad(24), to: THREE.MathUtils.degToRad(108), depth: 0.5, step: 0.8 };
/** Where the sound leaves: in the slot, a little above its middle. */
export const SOUND_Y = SLOT_Y + 3;
export const ORIGIN = new THREE.Vector3(0.6, SOUND_Y, 0);
export const TEAL = { dark: new THREE.Color('#06535d'), mid: new THREE.Color('#2a8f9c'), light: new THREE.Color('#9fdbe2') };
export const GREEN = '#2b8a3e';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A small round particle: a crisp disc with a slightly soft rim, drawn once (64 px). */
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 31);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.72, 'rgba(255,255,255,1)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.beginPath();
  g.arc(32, 32, 31, 0, Math.PI * 2);
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
 * `axis`: the fan's zero direction (unit), from the slot; `up`: the other direction of its plane (unit, at right
 * angles to axis).
 */
export function createAir(axis = new THREE.Vector3(1, 0, 0), up = new THREE.Vector3(0, 1, 0)) {
  const across = new THREE.Vector3().crossVectors(axis, up).normalize();
  const root = new THREE.Group();
  root.name = 'Air';
  root.userData.noExport = true;
  const rand = rng(29);
  const at = { shift: 0, squeeze: 0 };
  const c = new THREE.Color();
  const shade = (q, out) => {
    if (q >= 0) out.copy(TEAL.mid).lerp(TEAL.dark, Math.min(1, q));
    else out.copy(TEAL.mid).lerp(TEAL.light, Math.min(1, -q));
    return out;
  };
  const dirOf = (th, out) => out.copy(axis).multiplyScalar(Math.cos(th)).addScaledVector(up, Math.sin(th));

  // ── the particles: a jittered even pattern over the fan, two thin layers ──────────────────────────────────────────
  const spots = [];
  const { step, from, to } = FAN;
  for (let r = FAN.r0 + 0.5; r <= FAN.r1; r += step / 2) {
    const m = Math.max(1, Math.round(((to - from) * r) / step));
    const layer = Math.round((r - FAN.r0) / (step / 2)) % 2 ? 1 : -1;
    for (let j = 0; j < m; j++) {
      const th = from + ((j + 0.5 + (layer > 0 ? 0.5 : 0) + (rand() - 0.5) * 0.7) / m) * (to - from);
      spots.push([r + (rand() - 0.5) * step * 0.45, Math.min(to, Math.max(from, th)), layer * FAN.depth * (0.4 + 0.6 * rand())]);
    }
  }
  const n = spots.length;
  const rest = new Float32Array(n * 3);
  const dirs = new Float32Array(n * 3); // the way the sound goes at each particle
  const radius = new Float32Array(n);
  const fade = new Float32Array(n); // softer toward the fan's edges, so it has no hard rim
  const D = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const [r, th, z] = spots[i];
    dirOf(th, D);
    dirs.set([D.x, D.y, D.z], i * 3);
    radius[i] = r;
    rest[i * 3] = ORIGIN.x + r * D.x + z * across.x;
    rest[i * 3 + 1] = ORIGIN.y + r * D.y + z * across.y;
    rest[i * 3 + 2] = ORIGIN.z + r * D.z + z * across.z;
    const edge = Math.min(th - from, to - th) / (to - from);
    fade[i] = smooth(0, 0.16, edge) * smooth(FAN.r1, FAN.r1 * 0.7, r) * smooth(FAN.r0, FAN.r0 + 2, r);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(rest.slice(), 3));
  const colors = new Float32Array(n * 4);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  const mid = ORIGIN.clone().addScaledVector(dirOf((from + to) / 2, D), FAN.r1 / 2);
  geo.boundingSphere = new THREE.Sphere(mid, FAN.r1);
  const mat = new THREE.PointsMaterial({
    name: 'AirParticles',
    size: 1.05,
    sizeAttenuation: true,
    vertexColors: true,
    map: dotTexture(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const points = new THREE.Points(geo, mat);
  points.name = 'AirParticles';
  points.renderOrder = 2;
  root.add(points);

  // the one particle we follow: a green bead (on a low ray of the fan, a little in front of it) and a thin mark across
  // the way it swings, where it rests
  const followAt = THREE.MathUtils.degToRad(30); // a low ray: on screen it swings mostly sideways, along its ray
  const followR = 13;
  const followDir = dirOf(followAt, new THREE.Vector3());
  const bead = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 24, 16),
    new THREE.MeshStandardMaterial({ name: 'Bead', color: GREEN, roughness: 0.35, emissive: GREEN, emissiveIntensity: 0.25 }),
  );
  bead.name = 'OneParticle';
  bead.renderOrder = 3;
  const beadRest = ORIGIN.clone().addScaledVector(followDir, followR).addScaledVector(across, 1);
  bead.position.copy(beadRest);
  const mark = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 4.2, 8), new THREE.MeshBasicMaterial({ color: GREEN, toneMapped: false }));
  mark.position.copy(beadRest);
  const side = new THREE.Vector3().crossVectors(across, followDir).normalize();
  mark.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), side);
  root.add(bead, mark);

  // ── the breath: a few fine streaks (line segments, faded at the tail) ────────────────────────────────────────────
  const sn = 18;
  const lanes = [];
  for (let i = 0; i < sn; i++)
    lanes.push({ y: SLOT_Y + (rand() * 2 - 1) * 5, z: rand() * 2 - 1, q: rand(), sp: 0.8 + rand() * 0.4, len: 3 + rand() * 3, out: rand() * 2 - 1 });
  const sPos = new Float32Array(sn * 2 * 3);
  const sCol = new Float32Array(sn * 2 * 4);
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sgeo.setAttribute('color', new THREE.BufferAttribute(sCol, 4));
  sgeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(-15, SLOT_Y, 0), 40);
  const smat = new THREE.LineBasicMaterial({ name: 'Breath', vertexColors: true, transparent: true, depthWrite: false, toneMapped: false });
  const breath = new THREE.LineSegments(sgeo, smat);
  breath.name = 'Breath';
  breath.renderOrder = 4;
  breath.visible = false;
  root.add(breath);
  const BREATH_COLOR = new THREE.Color('#ffffff');
  const tanA = Math.tan(SHEET.alpha);
  /**
   * Where a streak is at progress q (0 … 1): from behind and above the open back of the fold, down into it and on to
   * the crease (the paper hides that part, as it would), then out through the slit toward the student.
   */
  function breathAt(p, q, out) {
    if (q < 0.75) {
      const k = q / 0.75;
      const x = -32 + k * 31.4;
      const y = SLOT_Y + (p.y - SLOT_Y) * (1 - 0.6 * k) + 16 * (1 - k) ** 2;
      out.set(x, y, p.z * Math.max(0, -x) * tanA * 0.5);
    } else {
      const k = (q - 0.75) / 0.25;
      out.set(-0.6 + k * 8, SLOT_Y + (p.y - SLOT_Y) * 0.4, p.out * k * 3);
    }
    return out;
  }
  const H0 = new THREE.Vector3();
  const T0 = new THREE.Vector3();

  /**
   * Draws the sound at time t (s, slowed) for a wave { speed, omega, lambda } and a source whose vibration at an
   * earlier time τ was `on(τ)` (0 … 1).
   */
  function update(t, wave, on) {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      const r = radius[i];
      const { shift, squeeze } = airAt(r, t, wave, on, at);
      const fall = fallOf(r);
      const d = shift * fall;
      pos[i * 3] = rest[i * 3] + d * dirs[i * 3];
      pos[i * 3 + 1] = rest[i * 3 + 1] + d * dirs[i * 3 + 1];
      pos[i * 3 + 2] = rest[i * 3 + 2] + d * dirs[i * 3 + 2];
      const q = squeeze * Math.min(1, fall * 1.4);
      shade(q, c);
      colors[i * 4] = c.r;
      colors[i * 4 + 1] = c.g;
      colors[i * 4 + 2] = c.b;
      colors[i * 4 + 3] = Math.min(1, on(t - r / wave.speed) * 1.4) * fade[i] * (0.58 + 0.42 * q);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    const b = airAt(followR, t, wave, on, at);
    bead.position.copy(beadRest).addScaledVector(followDir, b.shift * fallOf(followR));
  }

  /**
   * The breath: `dt` (s), `flow` 0 … 1 (blowing), `open` 0 … 1 (how open the slot is now).
   * The streaks come in through the back of the fold, wait at the shut slot and slip through when it opens, then fade.
   */
  function updateBreath(dt, flow, open) {
    breath.visible = flow > 0.01;
    if (!breath.visible) return;
    for (let i = 0; i < sn; i++) {
      const p = lanes[i];
      const near = p.q > 0.62 && p.q < 0.75;
      p.q += dt * p.sp * (near ? 0.08 + 1.6 * open : 0.32);
      if (p.q >= 1) p.q -= 1;
      breathAt(p, p.q, H0);
      breathAt(p, Math.max(0, p.q - p.len / 45), T0);
      const a = (p.q < 0.75 ? Math.min(1, p.q * 6) * 0.55 : (1 - (p.q - 0.75) / 0.25) * 0.5 * (0.3 + 0.7 * open)) * flow;
      sPos.set([T0.x, T0.y, T0.z, H0.x, H0.y, H0.z], i * 6);
      sCol.set([BREATH_COLOR.r, BREATH_COLOR.g, BREATH_COLOR.b, 0, BREATH_COLOR.r, BREATH_COLOR.g, BREATH_COLOR.b, a], i * 8);
    }
    sgeo.attributes.position.needsUpdate = true;
    sgeo.attributes.color.needsUpdate = true;
  }

  return { root, points, bead, beadRest, mark, breath, update, updateBreath, followR, followDir, axis };
}
