// The sky after the rain: a calm deep-blue backdrop, a plain round patch of light sand to stand on, the observer's eye
// on a slim stand (no face), the sun behind it, a light curtain of falling drops in front, and the band of colours.
// Nothing else. World units are "sky units": the drops of the bow stand ARC units from the eye, the sun is drawn
// much closer than it is (not to scale; the panel says so). The eye looks along +z; the sun is behind it (−z).
import * as THREE from 'three';
import { COLOURS, halfArcDeg, toRad } from './reading.js';

export const BG = ['#0b2a5b', '#123d7a'];
export const EYE = new THREE.Vector3(0, 1.05, 0); // the eye, on its stand
export const ARC = 10; // how far the drops of the bow are from the eye
export const SUN_D = 5.5; // how far the sun is drawn from the eye
export const GROUND_R = 11.5;

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
export function sunPoint(sunDeg, out = new THREE.Vector3()) {
  const a = toRad(sunDeg);
  return out.set(EYE.x, EYE.y + SUN_D * Math.sin(a), EYE.z - SUN_D * Math.cos(a));
}

// ── the ground ─────────────────────────────────────────────────────────────────────────────────────────────────
export function createGround() {
  const root = new THREE.Group();
  root.name = 'Ground';
  root.userData.noExport = true;
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(GROUND_R, GROUND_R, 0.12, 96),
    new THREE.MeshStandardMaterial({ name: 'Sand', color: '#b3a284', roughness: 0.92, metalness: 0 }),
  );
  top.position.set(0, -0.06, 4.5);
  top.receiveShadow = true;
  const edge = new THREE.Mesh(
    new THREE.CylinderGeometry(GROUND_R + 0.02, GROUND_R - 0.15, 0.4, 96, 1, true),
    new THREE.MeshStandardMaterial({ name: 'SandEdge', color: '#8a7a60', roughness: 0.95 }),
  );
  edge.position.set(0, -0.32, 4.5);
  root.add(top, edge);
  return { root };
}

// ── the eye on a slim stand ────────────────────────────────────────────────────────────────────────────────────
/** The observer: an eye (white, an iris and a pupil, an upper lid) looking toward +z, on a slim dark stand. */
export function createEye() {
  const root = new THREE.Group();
  root.name = 'Eye';
  const look = new THREE.Group(); // turns to look up at the bow
  look.position.copy(EYE);
  const R = 0.42;
  const white = new THREE.Mesh(
    new THREE.SphereGeometry(R, 40, 24),
    new THREE.MeshStandardMaterial({ name: 'EyeWhite', color: '#f4f1ea', roughness: 0.35 }),
  );
  white.castShadow = true;
  const irisMat = new THREE.MeshStandardMaterial({ name: 'Iris', color: '#5a3a1e', roughness: 0.5 });
  const iris = new THREE.Mesh(new THREE.SphereGeometry(R * 1.002, 32, 8, 0, Math.PI * 2, 0, 0.62), irisMat);
  iris.rotation.x = Math.PI / 2; // its cap faces +z
  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.004, 24, 4, 0, Math.PI * 2, 0, 0.3),
    new THREE.MeshStandardMaterial({ name: 'Pupil', color: '#0d0d0d', roughness: 0.3 }),
  );
  pupil.rotation.x = Math.PI / 2;
  const lidMat = new THREE.MeshStandardMaterial({ name: 'Lid', color: '#c98f6b', roughness: 0.7, side: THREE.DoubleSide });
  const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.08, 40, 12, 0, Math.PI * 2, 0, 1.05), lidMat);
  lid.rotation.x = -0.35; // the upper lid, a little open toward the front
  lid.castShadow = true;
  look.add(white, iris, pupil, lid);
  look.rotation.x = -0.32; // looking up toward the bow
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, EYE.y - R * 0.9, 16),
    new THREE.MeshStandardMaterial({ name: 'Stand', color: '#39424e', roughness: 0.5, metalness: 0.4 }),
  );
  stem.position.set(EYE.x, (EYE.y - R * 0.9) / 2, EYE.z);
  stem.castShadow = true;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.05, 32), stem.material);
  base.position.set(EYE.x, 0.025, EYE.z);
  base.castShadow = true;
  root.add(look, stem, base);
  return { root, body: white };
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
/** A light curtain of rain in front of the eye: one instanced mesh, placed once (its own fixed sequence, so every load is the same). */
export function createRain(count = 420) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const geo = new THREE.SphereGeometry(0.045, 8, 6);
  geo.scale(1, 1.9, 1);
  const mat = new THREE.MeshStandardMaterial({ name: 'Rain', color: '#cfe6ff', roughness: 0.15, metalness: 0, transparent: true, opacity: 0.55 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.name = 'Rain';
  mesh.userData.noExport = true;
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    // a slab of rain 6 … 13 in front, wider than the bow
    const z = 5 + rnd() * 8;
    const x = (rnd() * 2 - 1) * 10;
    const y = 0.3 + rnd() * 8.5;
    p.set(x, y, z);
    m.makeTranslation(p.x, p.y, p.z);
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
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
