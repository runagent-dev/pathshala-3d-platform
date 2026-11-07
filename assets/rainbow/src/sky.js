// The sky after the rain: a calm deep-blue backdrop, a plain round patch of light sand to stand on, the observer's eye
// on a slim stand (no face), the sun behind it, a light curtain of falling drops in front, and the band of colours.
// Nothing else. World units are "sky units": the drops of the bow stand ARC units from the eye, the sun is drawn
// much closer than it is (not to scale; the panel says so). The eye looks along +z; the sun is behind it (−z).
import * as THREE from 'three';
import { ANGLE, COLOURS, halfArcDeg, toRad } from './reading.js';

export const BG = ['#0b2a5b', '#123d7a'];
export const EYE = new THREE.Vector3(0, 1.35, 0); // the eye, on its stand
export const EYE_R = 0.62;
export const ARC = 10; // how far the drops of the bow are from the eye
export const SUN_D = 6.5; // how far the sun is drawn from the eye
export const GROUND_R = 4.2;
/** The two drops the figure follows: the red one on the outer edge of the bow, the violet one on the inner, either side of the top. */
export const KEY_PHI = 20;
/** The radii of the angles drawn at the eye (red outside, violet inside). */
export const ARC_R = { red: 2.8, violet: 2.2 };

/** The backdrop: a vertical gradient, light at the bottom (a power-of-two canvas, made once). */
export function backdrop() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, BG[0]);
  g.addColorStop(1, BG[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── directions for a sun `sunDeg` above the horizon ──────────────────────────────────────────────────────────────
/** Sunlight's direction of travel (= from the eye toward the point opposite the sun). */
export function along(sunDeg, out = new THREE.Vector3()) {
  const a = toRad(sunDeg);
  return out.set(0, -Math.sin(a), Math.cos(a));
}
/** Up in the plane of the sun and the eye, square to the sunlight. */
export function upOf(sunDeg, out = new THREE.Vector3()) {
  const a = toRad(sunDeg);
  return out.set(0, Math.cos(a), Math.sin(a));
}
/** A point of the bow: angle theta from the point opposite the sun, turned phi round it (0: the top), at distance d. */
export function bowPoint(sunDeg, theta, phi, d = ARC, out = new THREE.Vector3()) {
  const a = toRad(sunDeg);
  const th = toRad(theta);
  const ph = toRad(phi);
  const c = Math.cos(th);
  const s = Math.sin(th);
  // a = (0, −sin α, cos α), u = (0, cos α, sin α), x̂
  const ux = s * Math.sin(ph);
  const uu = s * Math.cos(ph);
  return out.set(EYE.x + d * ux, EYE.y + d * (-c * Math.sin(a) + uu * Math.cos(a)), EYE.z + d * (c * Math.cos(a) + uu * Math.sin(a)));
}
/** One of the two drops the figure follows ('red' or 'violet'). */
export function keyDrop(which, sunDeg, out = new THREE.Vector3()) {
  return which === 'red' ? bowPoint(sunDeg, ANGLE.red, KEY_PHI, ARC, out) : bowPoint(sunDeg, ANGLE.violet, -KEY_PHI, ARC, out);
}
export function sunPoint(sunDeg, out = new THREE.Vector3()) {
  const a = toRad(sunDeg);
  return out.set(EYE.x, EYE.y + SUN_D * Math.sin(a), EYE.z - SUN_D * Math.cos(a));
}

// ── the ground ─────────────────────────────────────────────────────────────────────────────────────────────────
/** A small round patch of light sand to stand on: the observer's place, not a landscape. */
export function createGround() {
  const root = new THREE.Group();
  root.name = 'Ground';
  root.userData.noExport = true;
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(GROUND_R, GROUND_R, 0.12, 64),
    new THREE.MeshStandardMaterial({ name: 'Sand', color: '#b3a284', roughness: 0.92, metalness: 0 }),
  );
  top.position.set(0, -0.06, 0.6);
  top.receiveShadow = true;
  const edge = new THREE.Mesh(
    new THREE.CylinderGeometry(GROUND_R + 0.02, GROUND_R - 0.1, 0.3, 64, 1, true),
    new THREE.MeshStandardMaterial({ name: 'SandEdge', color: '#8a7a60', roughness: 0.95 }),
  );
  edge.position.set(0, -0.27, 0.6);
  root.add(top, edge);
  return { root, top, edge };
}

// ── the eye on a slim stand ────────────────────────────────────────────────────────────────────────────────────
/**
 * The observer: a big eye (no face): the white, a brown iris and a black pupil, an upper and a lower lid making the
 * almond opening, turned to look at a point (`lookAt`), on a slim dark stand.
 */
export function createEye() {
  const root = new THREE.Group();
  root.name = 'Eye';
  const look = new THREE.Group(); // turns to look at the bow
  look.position.copy(EYE);
  const R = EYE_R;
  const white = new THREE.Mesh(
    new THREE.SphereGeometry(R, 40, 24),
    new THREE.MeshStandardMaterial({ name: 'EyeWhite', color: '#f6f3ec', roughness: 0.3 }),
  );
  white.castShadow = true;
  // the iris and the pupil: caps round the +y pole, turned to face +z (the way the eye looks)
  const iris = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.004, 32, 8, 0, Math.PI * 2, 0, 0.6),
    new THREE.MeshStandardMaterial({ name: 'Iris', color: '#6b4220', roughness: 0.45 }),
  );
  iris.rotation.x = Math.PI / 2;
  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.008, 24, 4, 0, Math.PI * 2, 0, 0.27),
    new THREE.MeshStandardMaterial({ name: 'Pupil', color: '#0b0b0b', roughness: 0.2 }),
  );
  pupil.rotation.x = Math.PI / 2;
  const lidMat = new THREE.MeshStandardMaterial({ name: 'Lid', color: '#c68b66', roughness: 0.7, side: THREE.DoubleSide });
  const upper = new THREE.Mesh(new THREE.SphereGeometry(R * 1.07, 40, 12, 0, Math.PI * 2, 0, 1.2), lidMat);
  upper.rotation.x = -0.42; // over the top and the back, open in front
  const lower = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 40, 10, 0, Math.PI * 2, Math.PI - 0.95, 0.95), lidMat);
  lower.rotation.x = 0.42;
  upper.castShadow = true;
  look.add(white, iris, pupil, upper, lower);
  const stemH = EYE.y - R * 0.95;
  const stand = new THREE.MeshStandardMaterial({ name: 'Stand', color: '#39424e', roughness: 0.5, metalness: 0.4 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, stemH, 16), stand);
  stem.position.set(EYE.x, stemH / 2, EYE.z);
  stem.castShadow = true;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.06, 32), stand);
  base.position.set(EYE.x, 0.03, EYE.z);
  base.castShadow = true;
  root.add(look, stem, base);
  /** The eye looks at a world point (the top of the bow). */
  const lookAt = (p) => look.lookAt(p);
  return { root, body: white, lookAt };
}

// ── the sun (drawn near, not to scale) ─────────────────────────────────────────────────────────────────────────
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,240,170,0.95)');
  r.addColorStop(0.3, 'rgba(255,214,90,0.55)');
  r.addColorStop(0.65, 'rgba(255,190,60,0.14)');
  r.addColorStop(1, 'rgba(255,190,60,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function createSun() {
  const root = new THREE.Group();
  root.name = 'Sun';
  const disc = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 32, 16),
    new THREE.MeshBasicMaterial({ name: 'SunDisc', color: '#ffdf5e', toneMapped: false }),
  );
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, toneMapped: false }));
  glow.scale.setScalar(3.4);
  glow.userData.noExport = true;
  root.add(glow, disc);
  return { root, disc };
}

// ── the falling drops ──────────────────────────────────────────────────────────────────────────────────────────
/**
 * A light curtain of rain in front of the eye: short pale streaks (one draw of line segments, no triangles), denser
 * round the distance of the bow; placed once, with its own fixed sequence, so every load is the same.
 */
export function createRain(count = 520) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    // most of the drops near the bow's distance, a few nearer and further
    const d = i < count * 0.7 ? ARC + (rnd() + rnd() - 1) * 2.2 : 5 + rnd() * 9;
    const ang = (rnd() * 2 - 1) * 0.95; // radians either side of straight ahead
    const x = Math.sin(ang) * d;
    const z = Math.cos(ang) * d;
    const y = 0.4 + rnd() * 8.4;
    const len = 0.16 + rnd() * 0.16;
    pos.set([x, y, z, x - 0.02, y - len, z], i * 6);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ name: 'Rain', color: '#bcd8f2', transparent: true, opacity: 0.4, depthWrite: false });
  const mesh = new THREE.LineSegments(geo, mat);
  mesh.name = 'Rain';
  mesh.userData.noExport = true;
  mesh.frustumCulled = false;
  return { mesh };
}

// ── the band of colours ────────────────────────────────────────────────────────────────────────────────────────
const SEG = 120; // along the arc
/** The bow: a ribbon of the seven colours at their own angles, faded at both edges; only the part above the horizon (eye level). */
export function createBand(angles) {
  // rows, outside to inside: a faded edge, the seven colours, a faded edge
  const rows = [
    { theta: angles.red + 0.35, color: COLOURS[0].css, a: 0 },
    ...COLOURS.map((c) => ({ theta: angles[c.id], color: c.css, a: 1 })),
    { theta: angles.violet - 0.35, color: COLOURS[COLOURS.length - 1].css, a: 0 },
  ];
  const n = rows.length;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * (SEG + 1) * 3);
  const col = new Float32Array(n * (SEG + 1) * 4);
  const c = new THREE.Color();
  for (let r = 0; r < n; r++) {
    c.set(rows[r].color).convertSRGBToLinear();
    for (let i = 0; i <= SEG; i++) {
      const k = (r * (SEG + 1) + i) * 4;
      col[k] = c.r;
      col[k + 1] = c.g;
      col[k + 2] = c.b;
      col[k + 3] = rows[r].a;
    }
  }
  const index = [];
  for (let r = 0; r < n - 1; r++)
    for (let i = 0; i < SEG; i++) {
      const a = r * (SEG + 1) + i;
      const b = a + SEG + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  geo.setIndex(index);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4));
  const mat = new THREE.MeshBasicMaterial({
    name: 'Rainbow',
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'Rainbow';
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  const p = new THREE.Vector3();
  let shownFor = Number.NaN;
  /** Lays the ribbon for a sun `sunDeg` high: every row from one end above the horizon to the other. */
  function setSun(sunDeg) {
    if (sunDeg === shownFor) return;
    shownFor = sunDeg;
    for (let r = 0; r < n; r++) {
      const half = halfArcDeg(sunDeg, rows[r].theta);
      for (let i = 0; i <= SEG; i++) {
        const phi = -half + (2 * half * i) / SEG;
        bowPoint(sunDeg, rows[r].theta, phi, ARC, p);
        const k = (r * (SEG + 1) + i) * 3;
        pos[k] = p.x;
        pos[k + 1] = Math.max(EYE.y, p.y);
        pos[k + 2] = p.z;
      }
    }
    geo.attributes.position.needsUpdate = true;
  }
  return { mesh, setSun, rows };
}
