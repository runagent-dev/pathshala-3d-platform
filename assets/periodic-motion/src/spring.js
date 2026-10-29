// A mass hanging on a spring (স্প্রিংয়ে ঝুলিয়ে রাখা বস্তু), in metres, on a laboratory stand: base, rod, arm, the
// spring and a 500 g brass mass with a coloured dot on it (the particle), moving up and down a straight line.
// The spring (natural length 8 cm) hangs 16 cm longer with the mass on it and swings 7.5 cm each way.
// The table is y = 0; the motion is along y.
import * as THREE from 'three';
import { EXAMPLES, springAt, springPhaseDown } from './motion.js';
import { COLORS, dashedPath, particleGlow } from './parts.js';

const AMP = EXAMPLES.spring.amp;
const TOP = 0.398; // where the spring hangs from
const X = 0.025; // the spring's axis
const MEAN = 0.08 + 0.159; // natural length + the stretch mg / k: the length at the middle of the swing
const MASS_H = 0.04;
const MASS_R = 0.022;
const DOT = 0.52; // the dot's angle round the mass, from the student's right towards the student (rad)
const DOT_X = X + Math.cos(DOT) * MASS_R; // the dot's path: a vertical line just right of the spring
const DOT_Z = Math.sin(DOT) * MASS_R;
const TURNS = 16;
const COIL_R = 0.0115;

class Helix extends THREE.Curve {
  getPoint(u, target = new THREE.Vector3()) {
    const a = u * TURNS * Math.PI * 2;
    return target.set(Math.cos(a) * COIL_R, -u * MEAN, Math.sin(a) * COIL_R); // built at the middle length, stretched by setPhase
  }
}

export function createSpring(M) {
  const root = new THREE.Group();
  root.name = 'SpringStand';
  const dark = new THREE.MeshPhysicalMaterial({ name: 'StandPaint', color: 0x0c919b, roughness: 0.5, clearcoat: 0.3 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.014, 0.11), dark);
  base.position.set(-0.03, 0.007, 0);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0058, 0.0058, 0.43, 20), M.chrome);
  rod.position.set(-0.08, 0.014 + 0.215, 0);
  const boss = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.026, 0.024), dark);
  boss.position.set(-0.08, 0.412, 0);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.028, 12), M.chrome);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(-0.08, 0.412, 0.022);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.0048, 0.0048, 0.12, 16), M.chrome);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(-0.025, 0.412, 0);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.0075, 0.0017, 8, 24), M.chrome);
  hook.position.set(X, TOP + 0.0085, 0);
  root.add(base, rod, boss, screw, arm, hook);

  // the spring: a helix at its middle length, stretched to the spring's length every frame
  const spring = new THREE.Mesh(new THREE.TubeGeometry(new Helix(), TURNS * 22, 0.0015, 6, false), M.steel);
  spring.name = 'Spring';
  spring.position.set(X, TOP, 0);
  root.add(spring);

  // the mass: a brass cylinder with an eye on top, and the coloured dot on its side
  const mass = new THREE.Group();
  mass.name = 'Mass';
  root.add(mass);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(MASS_R, MASS_R, MASS_H, 40), M.brass);
  body.position.y = -MASS_H / 2 - 0.004;
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.0055, 0.0016, 8, 20), M.brass);
  eye.position.y = 0.0015;
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.0052, 24, 16),
    new THREE.MeshStandardMaterial({ color: COLORS.particle, roughness: 0.35, emissive: COLORS.particle, emissiveIntensity: 0.3 }),
  );
  dot.name = 'Particle';
  dot.position.set(DOT_X - X, -MASS_H / 2 - 0.004, DOT_Z);
  dot.add(particleGlow(0.045));
  mass.add(body, eye, dot);

  // the dot's path: a straight line from the top of the swing to the bottom
  const dotY = (y) => TOP - MEAN - MASS_H / 2 - 0.004 + y; // the dot's height for a height y above the middle
  const PATH_Z = DOT_Z + 0.004;
  const line = new THREE.LineCurve3(new THREE.Vector3(DOT_X, dotY(AMP), PATH_Z), new THREE.Vector3(DOT_X, dotY(-AMP), PATH_Z));
  const path = dashedPath(line, { radius: 0.0019, dash: 0.0125, segments: 8 });
  root.add(path);

  const samples = [];
  for (let i = 0; i <= 120; i++) {
    const y = AMP - (i / 120) * 2 * AMP;
    samples.push({ p: new THREE.Vector3(DOT_X, dotY(y), PATH_Z), y });
  }

  return {
    id: 'spring',
    root,
    model: root,
    setPhase(phase) {
      const { y } = springAt(phase, AMP);
      const len = MEAN - y;
      spring.scale.set(1, len / MEAN, 1);
      mass.position.set(X, TOP - len, 0);
    },
    samples,
    // a mark on the line is passed twice a period (down and up); the one on the way down is counted
    phaseOfSample: (s) => springPhaseDown(s.y, AMP),
    /** Where the particle is at a phase, the direction across its path, and its velocity (m per period). */
    markPose(phase) {
      const { y, vy } = springAt(phase, AMP);
      return { pos: new THREE.Vector3(DOT_X, dotY(y), PATH_Z + 0.001), across: new THREE.Vector3(1, 0, 0), vel: new THREE.Vector3(0, vy, 0) };
    },
    normal: new THREE.Vector3(0, 0, 1),
    particle: () => dot.getWorldPosition(new THREE.Vector3()),
    markLength: 0.034,
    arrowThickness: 0.0026,
    velocityScale: 0.17,
    views: {
      front: new THREE.Vector3(0, 0.08, 1).normalize(),
      '3d': new THREE.Vector3(0.62, 0.34, 0.7).normalize(),
    },
    bounds: new THREE.Box3(new THREE.Vector3(-0.115, 0, -0.055), new THREE.Vector3(0.07, 0.425, 0.055)),
    ground: 0,
  };
}
