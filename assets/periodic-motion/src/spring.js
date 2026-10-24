// A mass hanging on a spring (স্প্রিংয়ে ঝুলিয়ে রাখা বস্তু), in metres, on a laboratory stand: base, rod, arm,
// the spring and a brass mass with a short pointer whose tip (the particle) moves up and down a straight line.
// The table is y = 0; the motion is along y.
import * as THREE from 'three';
import { COLORS, dashedPath, particleGlow } from './parts.js';
import { EXAMPLES, springAt, springPhaseDown } from './motion.js';

const AMP = EXAMPLES.spring.amp;
const TOP = 0.452; // where the spring hangs from
const X = 0.03; // the spring's axis
const MEAN = 0.2; // spring length with the mass at the middle of its swing
const MASS_H = 0.046;
const MASS_R = 0.022;
const TIP_X = X + 0.062; // the pointer's tip
const TURNS = 15;
const COIL_R = 0.0125;

class Helix extends THREE.Curve {
  getPoint(u, target = new THREE.Vector3()) {
    const a = u * TURNS * Math.PI * 2;
    return target.set(Math.cos(a) * COIL_R, -u * MEAN, Math.sin(a) * COIL_R); // built at the middle length, stretched by setPhase
  }
}

export function createSpring(M) {
  const root = new THREE.Group();
  root.name = 'SpringStand';
  const dark = new THREE.MeshPhysicalMaterial({ name: 'StandPaint', color: 0x2d3238, roughness: 0.5, clearcoat: 0.3 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.016, 0.13), dark);
  base.position.set(-0.03, 0.008, 0);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.5, 20), M.chrome);
  rod.position.set(-0.1, 0.016 + 0.25, 0);
  const boss = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.026), dark);
  boss.position.set(-0.1, 0.47, 0);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 12), M.chrome);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(-0.1, 0.47, 0.024);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.15, 16), M.chrome);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(-0.035, 0.47, 0);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0018, 8, 24), M.chrome);
  hook.position.set(X, TOP + 0.009, 0);
  root.add(base, rod, boss, screw, arm, hook);

  // the spring: a helix at its middle length, stretched (a little) to the spring's length every frame
  const spring = new THREE.Mesh(new THREE.TubeGeometry(new Helix(), TURNS * 22, 0.0016, 6, false), M.steel);
  spring.name = 'Spring';
  spring.position.set(X, TOP, 0);
  root.add(spring);

  // the mass: a brass cylinder with a hook, and the pointer with its coloured tip
  const mass = new THREE.Group();
  mass.name = 'Mass';
  root.add(mass);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(MASS_R, MASS_R, MASS_H, 40), M.brass);
  body.position.y = -MASS_H / 2;
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0016, 8, 20), M.brass);
  eye.position.y = 0.005;
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, TIP_X - X - MASS_R, 10), M.chrome);
  needle.rotation.z = Math.PI / 2;
  needle.position.set(MASS_R + (TIP_X - X - MASS_R) / 2, -MASS_H / 2, 0);
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.0085, 24, 16),
    new THREE.MeshStandardMaterial({ color: COLORS.particle, roughness: 0.35, emissive: COLORS.particle, emissiveIntensity: 0.3 }),
  );
  tip.name = 'Particle';
  tip.position.set(TIP_X - X, -MASS_H / 2, 0);
  tip.add(particleGlow(0.05));
  mass.add(body, eye, needle, tip);

  // the tip's path: a short straight line (top to bottom of the swing)
  const tipY = (y) => TOP - MEAN - MASS_H / 2 + y; // pointer height for a height y above the middle
  const line = new THREE.LineCurve3(new THREE.Vector3(TIP_X, tipY(AMP), 0.0), new THREE.Vector3(TIP_X, tipY(-AMP), 0.0));
  const path = dashedPath(line, { radius: 0.0022, dash: 0.0125, segments: 8 });
  root.add(path);

  const samples = [];
  for (let i = 0; i <= 120; i++) {
    const y = AMP - (i / 120) * 2 * AMP;
    samples.push({ p: new THREE.Vector3(TIP_X, tipY(y), 0), y });
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
    markPose(phase) {
      const { y, vy } = springAt(phase, AMP);
      return { pos: new THREE.Vector3(TIP_X, tipY(y), 0.003), across: new THREE.Vector3(1, 0, 0), vel: new THREE.Vector3(0, vy, 0) };
    },
    normal: new THREE.Vector3(0, 0, 1),
    particle: () => tip.getWorldPosition(new THREE.Vector3()),
    markLength: 0.04,
    arrowThickness: 0.0028,
    velocityScale: 0.22,
    views: {
      front: new THREE.Vector3(0, 0.1, 1).normalize(),
      '3d': new THREE.Vector3(0.62, 0.34, 0.7).normalize(),
    },
    bounds: new THREE.Box3(new THREE.Vector3(-0.14, 0, -0.065), new THREE.Vector3(0.105, 0.485, 0.065)),
    ground: 0,
  };
}
