// The world in metres: a slate counter with one gas ring, and on it a pot of water you can see into (a glass body with
// steel base and rim, so the water, the bubbles and the thermometer show), a thermometer standing in the water with
// 100° C marked, and, for the pressure cooker, a steel lid with a weight on it. A muted wall and nothing else.
// Everything procedural, a handful of draw calls; the bubbles are one instanced mesh moved only while the water boils.
import * as THREE from 'three';
import { T_MAX, T_MIN, T_REF, mercuryLevel } from './reading.js';

export const POT = { r: 0.115, h: 0.18, water: 0.09, y: 0.03 }; // m; y: the pot's base above the counter
export const THERM = { x: 0.06, z: 0.05, y0: 0.014, span: 0.225, len: 0.26 }; // pot coordinates; span: T_MIN … T_MAX

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });

function gradient(stops) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const k = g.createLinearGradient(0, 0, 0, 256);
  for (const [at, col] of stops) k.addColorStop(at, col);
  g.fillStyle = k;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The wall behind the stove: a muted warm grey, a little lighter toward the counter (screen space). */
export const wallTexture = () =>
  gradient([
    [0, '#7b6c75'],
    [0.55, '#a3939a'],
    [1, '#cdbcab'],
  ]);

/** The counter, its cupboard, and the cooktop with one gas ring (its flame shows while the water is heated). */
function createStove() {
  const root = new THREE.Group();
  root.name = 'Stove';
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };
  box(1.1, 0.04, 0.62, std('#46505b', { roughness: 0.45 }), 0, -0.02, 0);
  box(1.06, 0.56, 0.58, std('#7d604b', { roughness: 0.7 }), 0, -0.32, -0.01);
  box(0.36, 0.012, 0.36, std('#1d2025', { roughness: 0.3, metalness: 0.3 }), 0, 0.006, 0);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.085, 0.011, 10, 40).rotateX(Math.PI / 2),
    std('#2a2d33', { roughness: 0.4, metalness: 0.5, emissive: '#000000' }),
  );
  ring.position.y = 0.017;
  root.add(ring);
  // the flame: small blue cones round the ring
  const n = 24;
  const flame = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.0075, 0.026, 8).translate(0, 0.013, 0),
    new THREE.MeshBasicMaterial({ color: '#58aaff', toneMapped: false }),
    n,
  );
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    flame.setMatrixAt(i, m.makeTranslation(Math.cos(a) * 0.085, 0.022, Math.sin(a) * 0.085));
  }
  flame.visible = false;
  flame.frustumCulled = false;
  root.add(flame);
  return { root, ring, flame };
}

/** The thermometer: a glass tube with a bulb, a red thread that rises, a pale backing with a tick every 10° and a darker long tick at 100° C. */
function createThermometer() {
  const g = new THREE.Group();
  g.name = 'Thermometer';
  g.position.set(THERM.x, 0, THERM.z);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#f2f6f8', transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, THERM.len, 14), glass);
  tube.position.y = THERM.y0 + THERM.len / 2;
  tube.renderOrder = 6;
  g.add(tube);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.03, THERM.len, 0.003), std('#f4f1e8', { roughness: 0.6 }));
  back.position.set(-0.007, THERM.y0 + THERM.len / 2, -0.007);
  g.add(back);
  const red = std('#d62828', { roughness: 0.3 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 14, 10), red);
  bulb.position.y = THERM.y0;
  g.add(bulb);
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0026, 1, 10).translate(0, 0.5, 0), red);
  thread.position.y = THERM.y0;
  g.add(thread);
  const ticks = [];
  for (let T = T_MIN; T <= T_MAX + 0.1; T += 10) ticks.push(T);
  const tickMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.009, 0.0016, 0.002), std('#3b3f45'), ticks.length);
  const m = new THREE.Matrix4();
  ticks.forEach((T, i) => tickMesh.setMatrixAt(i, m.makeTranslation(-0.013, THERM.y0 + mercuryLevel(T) * THERM.span, -0.0045)));
  g.add(tickMesh);
  const ref = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.0028, 0.002), std('#c92a2a'));
  ref.position.set(-0.0075, THERM.y0 + mercuryLevel(T_REF) * THERM.span, -0.0045);
  g.add(ref);
  /** The red thread's top, in pot coordinates, for a level (0 … 1). */
  const top = (level) => THERM.y0 + level * THERM.span;
  return {
    root: g,
    pickables: [tube, back],
    setLevel(level) {
      thread.scale.y = Math.max(0.0001, level * THERM.span);
    },
    top,
    refY: top(mercuryLevel(T_REF)),
  };
}

/** The pot, the water, the bubbles and the cooker's lid. */
function createPot() {
  const root = new THREE.Group();
  root.name = 'Pot';
  root.position.y = POT.y;
  const steel = std('#aab2bb', { roughness: 0.3, metalness: 0.85 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#d6eaf6',
    transparent: true,
    opacity: 0.2,
    roughness: 0.05,
    clearcoat: 1,
    envMapIntensity: 1.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(POT.r, POT.r, POT.h, 48, 1, true), glass);
  wall.position.y = POT.h / 2;
  wall.renderOrder = 7;
  root.add(wall);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(POT.r + 0.004, POT.r + 0.004, 0.018, 48), steel);
  base.position.y = 0.009;
  base.castShadow = true;
  root.add(base);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(POT.r, 0.004, 8, 48).rotateX(Math.PI / 2), steel);
  rim.position.y = POT.h;
  root.add(rim);
  for (const s of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.018), std('#23262b', { roughness: 0.6 }));
    handle.position.set(s * (POT.r + 0.024), POT.h - 0.02, 0);
    handle.castShadow = true;
    root.add(handle);
  }
  // the water
  const waterMat = new THREE.MeshStandardMaterial({ color: '#4c9fdb', transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(POT.r - 0.002, POT.r - 0.002, POT.water, 48), waterMat);
  water.position.y = 0.018 + POT.water / 2;
  water.renderOrder = 5;
  root.add(water);
  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(POT.r - 0.002, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#a9d6f5', transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }),
  );
  surface.position.y = 0.018 + POT.water + 0.0005;
  surface.renderOrder = 6;
  root.add(surface);
  // bubbles: one instanced mesh, moved only while the water boils
  const N = 44;
  const bubbles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshBasicMaterial({ color: '#f2fbff', transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }),
    N,
  );
  bubbles.frustumCulled = false;
  bubbles.renderOrder = 8;
  root.add(bubbles);
  let seed = 5;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const spec = Array.from({ length: N }, (_, i) => {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (POT.r - 0.02);
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, ph: rnd(), sp: 0.35 + rnd() * 0.5, size: 0.0035 + rnd() * 0.0035, rank: i / N };
  });
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const lo = 0.022;
  const hi = 0.018 + POT.water;
  /** Place the bubbles at time t (s); `intensity` (0 … 1) is how many show. */
  function setBubbles(t, intensity) {
    for (let i = 0; i < N; i++) {
      const b = spec[i];
      const on = b.rank < intensity ? 1 : 0;
      const u = (t * b.sp + b.ph) % 1;
      p.set(b.x + Math.sin(t * 3 + i) * 0.003, lo + u * (hi - lo), b.z);
      const s = b.size * on * (0.5 + 0.5 * Math.min(1, u * 4));
      bubbles.setMatrixAt(i, m.compose(p, q, sc.set(s, s, s)));
    }
    bubbles.instanceMatrix.needsUpdate = true;
  }
  setBubbles(0, 0);
  // the pressure cooker's lid: steel, a black handle, a weight on a stem, and a seal where the thermometer passes
  const lid = new THREE.Group();
  lid.name = 'Lid';
  lid.position.y = POT.h;
  const lidBody = new THREE.Mesh(new THREE.CylinderGeometry(POT.r * 0.55, POT.r + 0.008, 0.024, 48), steel);
  lidBody.position.y = 0.012;
  lidBody.castShadow = true;
  lid.add(lidBody);
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.014, 0.02), std('#23262b', { roughness: 0.6 }));
  knob.position.set(-0.01, 0.031, -0.03);
  lid.add(knob);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.02, 10), steel);
  stem.position.set(-0.05, 0.034, 0.03);
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.014, 20), std('#2b2e34', { roughness: 0.4, metalness: 0.6 }));
  weight.position.set(-0.05, 0.051, 0.03);
  lid.add(stem, weight);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.012, 0.012, 14), std('#15171a', { roughness: 0.9 }));
  seal.position.set(THERM.x, 0.028, THERM.z);
  lid.add(seal);
  lid.visible = false;
  root.add(lid);
  const therm = createThermometer();
  root.add(therm.root);
  return { root, lid, water, waterMat, surface, setBubbles, therm };
}

export function createWorld() {
  const root = new THREE.Group();
  root.name = 'World';
  const stove = createStove();
  const pot = createPot();
  root.add(stove.root, pot.root);
  return { root, stove, pot };
}
