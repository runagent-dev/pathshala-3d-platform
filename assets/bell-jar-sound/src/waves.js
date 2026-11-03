// What the eye can't see, drawn: the air in the jar as many small particles (a stand-in for the molecules, each
// jiggling about its place) and the bell's sound as rings that leave the gong at every strike and spread through the
// jar and out into the room (each ring a compression, darker teal, followed by a lighter rarefaction, as the chapter's
// sister figures shade a sound wave). With less air there are fewer particles, and the rings are fainter; with none,
// the hammer still strikes but no ring leaves the gong. The rings are slowed down very much (real sound crosses the
// jar in under a millisecond): the panel says so. Both are helpers (userData.noExport), not part of the GLB.
import * as THREE from 'three';
import { BELL, GONG, JAR, PLATE_Y } from './apparatus.js';

/** How many air particles a full jar shows. */
export const PARTICLES = 380;
/** The rings: how fast they spread on the screen (m/s, slowed), how far they go (m), how many at once. */
export const RING = { speed: 0.26, reach: 0.34, count: 10 };

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Is a point inside the jar's air (not in the glass, the bell or the gong)? */
function inJar(x, y, z) {
  const rr = Math.hypot(x, z);
  const yTop = PLATE_Y + JAR.h - 0.08;
  if (y < PLATE_Y + 0.008 || rr > JAR.r - 0.012) return false;
  if (y > yTop) {
    // the dome: a quarter ellipse
    const k = (y - yTop) / 0.05;
    if (k >= 1) return false;
    const rMax = JAR.neckR + (JAR.r - 0.012 - JAR.neckR) * Math.sqrt(1 - k * k);
    if (rr > rMax - 0.006) return false;
  }
  // the bell (its board and coils) and the gong, with a little room
  if (Math.abs(x) < BELL.w / 2 + 0.008 && y > BELL.y0 - 0.006 && y < BELL.y1 + 0.008 && z > -0.035 && z < 0.016) return false;
  if (Math.hypot(x - GONG.x, y - GONG.y) < GONG.r + 0.006 && z > -0.03 && z < GONG.z + GONG.depth + 0.006) return false;
  if (Math.hypot(x, z + 0.018) < 0.006 && y > BELL.y1) return false; // the hanging rod
  return true;
}

/** The air particles: an instanced mesh; `update(f, time)` shows the share f of them, jiggling. */
export function createAir() {
  const r = rng(29);
  const base = [];
  while (base.length < PARTICLES) {
    const x = (r() * 2 - 1) * JAR.r;
    const z = (r() * 2 - 1) * JAR.r;
    const y = PLATE_Y + r() * JAR.h;
    if (inJar(x, y, z)) base.push({ x, y, z, p: r() * 6.283, q: r() * 6.283, w: 1.6 + r() * 2.2, s: 0.8 + r() * 0.5 });
  }
  const geo = new THREE.IcosahedronGeometry(0.0022, 1);
  const mat = new THREE.MeshStandardMaterial({ name: 'AirParticle', color: '#f1f3f5', emissive: '#8fa3b8', emissiveIntensity: 0.35, roughness: 0.5 });
  const mesh = new THREE.InstancedMesh(geo, mat, PARTICLES);
  mesh.name = 'AirParticles';
  mesh.userData.noExport = true;
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  const m4 = new THREE.Matrix4();
  const amp = 0.0035;
  return {
    mesh,
    /** f: the share of air left (0–1); time in s. The particles kept are spread through the jar (a random order). */
    update(f, time) {
      const n = Math.round(PARTICLES * Math.max(0, Math.min(1, f)));
      mesh.count = n;
      for (let i = 0; i < n; i++) {
        const b = base[i];
        const a = time * b.w;
        const x = b.x + amp * Math.sin(a + b.p);
        const y = b.y + amp * Math.sin(a * 1.3 + b.q);
        const z = b.z + amp * Math.cos(a * 0.9 + b.p + b.q);
        m4.makeScale(b.s, b.s, b.s);
        m4.setPosition(inJar(x, y, z) ? x : b.x, inJar(x, y, z) ? y : b.y, inJar(x, y, z) ? z : b.z);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** A ring's picture: a dark teal compression with a light rarefaction behind it (inside), soft at the edges. */
function ringTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const R = S / 2;
  const grad = g.createRadialGradient(R, R, 0, R, R, R);
  grad.addColorStop(0, 'rgba(153,233,242,0)');
  grad.addColorStop(0.84, 'rgba(153,233,242,0)');
  grad.addColorStop(0.9, 'rgba(153,233,242,0.45)'); // the rarefaction behind it: light
  grad.addColorStop(0.95, 'rgba(12,133,153,1)'); // the compression: dark teal
  grad.addColorStop(0.975, 'rgba(8,100,116,1)');
  grad.addColorStop(1, 'rgba(12,133,153,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * The sound rings round the gong, always facing the camera. `strike(time, f)` starts one with the strength of the air
 * left; `update(time, f, camera)` grows them and fades them (the air left now sets how strong they are).
 */
export function createRings() {
  const root = new THREE.Group();
  root.name = 'SoundRings';
  root.userData.noExport = true;
  const tex = ringTexture();
  const geo = new THREE.PlaneGeometry(2, 2);
  const rings = [];
  for (let i = 0; i < RING.count; i++) {
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
    const m = new THREE.Mesh(geo, mat);
    m.renderOrder = 6;
    m.visible = false;
    m.position.set(GONG.x, GONG.y, GONG.z + 0.01);
    root.add(m);
    rings.push({ mesh: m, born: Number.NEGATIVE_INFINITY, strength: 0 });
  }
  let next = 0;
  return {
    root,
    strike(time, f) {
      if (f <= 0.01) return;
      const r = rings[next];
      next = (next + 1) % rings.length;
      r.born = time;
      r.strength = f;
    },
    /** How many rings show now. */
    visibleCount() {
      return rings.filter((r) => r.mesh.visible).length;
    },
    clear() {
      for (const r of rings) {
        r.born = Number.NEGATIVE_INFINITY;
        r.mesh.visible = false;
      }
    },
    update(time, f, camera) {
      for (const r of rings) {
        const age = time - r.born;
        const rad = 0.03 + age * RING.speed;
        if (age < 0 || rad > RING.reach || f <= 0.01) {
          r.mesh.visible = false;
          continue;
        }
        r.mesh.visible = true;
        r.mesh.quaternion.copy(camera.quaternion);
        r.mesh.scale.setScalar(rad);
        // weaker with less air (now and when it left), weaker as it spreads
        const s = Math.min(r.strength, f);
        r.mesh.material.opacity = 0.8 * s * (1 - rad / RING.reach) ** 0.8;
      }
    },
  };
}
