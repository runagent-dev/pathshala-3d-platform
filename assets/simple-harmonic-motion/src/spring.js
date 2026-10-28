// The second example, in metres: a mass hanging from a spring (স্প্রিং থেকে দুলিয়ে দেওয়া বস্তু) on a laboratory
// stand. The spring is fixed at TOP; setOffset(x) moves the mass x metres above (x > 0) or below its equilibrium
// point, and the spring stretches to follow. The mass is two 1 kg brass slotted masses on a hanger (2 kg in all,
// matching SPRING.m in motion.js). The ground (table) is y = 0.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SPRING, springStretch } from './motion.js';

export const TOP = 0.82; // m: where the spring hangs from the arm
const ROD_X = -0.2;
const COIL_R = 0.018;
const TURNS = 20;
const BUILT = 0.5; // the coil is built this long, then scaled to the spring's real length
export const EQUILIBRIUM = TOP - SPRING.rest - springStretch(); // y of the hanger's hook when at rest

/** A helix going down from y = 0 to y = −length. */
class Helix extends THREE.Curve {
  constructor(length) {
    super();
    this.length = length;
  }
  getPoint(u, out = new THREE.Vector3()) {
    const a = u * TURNS * Math.PI * 2;
    return out.set(COIL_R * Math.cos(a), -u * this.length, COIL_R * Math.sin(a));
  }
}

export function createSpringStand({ materials: M }) {
  const root = new THREE.Group();
  root.name = 'SpringStand';
  const paint = new THREE.MeshPhysicalMaterial({ name: 'StandBase', color: 0x143c60, roughness: 0.3, clearcoat: 0.55 });
  const rodPaint = new THREE.MeshPhysicalMaterial({ name: 'StandCoralEnamel', color: 0xef6248, roughness: 0.28, metalness: 0.15, clearcoat: 0.55 });
  const collarPaint = new THREE.MeshStandardMaterial({ name: 'ClampBlue', color: 0x225d86, roughness: 0.32 });
  const massBrass = new THREE.MeshPhysicalMaterial({ name: 'SatinBrassMass', color: 0xe7ad4b, roughness: 0.28, metalness: 0.65, clearcoat: 0.25 });
  const springSteel = new THREE.MeshStandardMaterial({ name: 'SpringSteel', color: 0xe9f3ff, roughness: 0.23, metalness: 0.65 });

  // ── the stand: a heavy base, an upright rod, a boss and an arm ──
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.026, 0.22, 2, 0.006), paint);
  base.position.set(-0.07, 0.013, 0);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, TOP + 0.08, 20), rodPaint);
  rod.position.set(ROD_X, (TOP + 0.08) / 2 + 0.02, 0);
  const boss = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.045, 0.045, 2, 0.008), collarPaint);
  boss.position.set(ROD_X, TOP + 0.02, 0);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.23, 16), rodPaint);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(ROD_X + 0.115, TOP + 0.02, 0);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0025, 8, 20), M.steel);
  hook.position.set(0, TOP + 0.007, 0);
  root.add(base, rod, boss, arm, hook);

  // ── the spring: a coil (scaled to length) ──
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new Helix(BUILT), TURNS * 14, 0.0019, 6, false), springSteel);
  coil.name = 'Spring';
  coil.position.y = TOP;
  root.add(coil);

  // ── the mass: a hanger with two slotted masses ──
  const mass = new THREE.Group();
  mass.name = 'Mass';
  root.add(mass);
  const hangerHook = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0022, 8, 20, Math.PI * 1.5), M.steel);
  hangerHook.position.y = -0.004;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.06, 10), M.steel);
  stem.position.y = -0.04;
  mass.add(hangerHook, stem);
  for (let i = 0; i < 2; i++) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.0155, 48), massBrass);
    disc.position.y = -0.03 - 0.0085 - i * 0.0165;
    mass.add(disc);
  }
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.005, 48), M.steel);
  plate.position.y = -0.068;
  mass.add(plate);

  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = -0.04;
  hit.userData.noExport = true;
  mass.add(hit);

  function setOffset(x) {
    const y = EQUILIBRIUM + x;
    mass.position.y = y;
    coil.scale.y = (TOP - y) / BUILT;
  }
  setOffset(0);

  return {
    root,
    hits: [hit],
    setOffset,
    /** The point x metres above the equilibrium point, `side` metres to the side of the mass (on the path). */
    pointAt(x, side = 0, out = new THREE.Vector3()) {
      return out.set(side, EQUILIBRIUM + x - 0.045, 0);
    },
    grip(out = new THREE.Vector3()) {
      return out.set(0.02, mass.position.y - 0.045, 0.05);
    },
    /**
     * The points the camera keeps in view: from the arm at the top to the mass at its lowest, with room for the
     * labels either side; the base of the stand and the top of the rod run off the edges.
     */
    fit: [
      new THREE.Vector3(0, TOP + 0.035, 0),
      new THREE.Vector3(0, EQUILIBRIUM - SPRING.maxA - 0.11, 0),
      new THREE.Vector3(-0.42, EQUILIBRIUM, 0),
      new THREE.Vector3(0.38, EQUILIBRIUM, 0),
    ],
  };
}
