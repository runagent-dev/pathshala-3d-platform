// A ceiling fan (বৈদ্যুতিক পাখা) as seen lying on a bed and looking up, in centimetres: a 56-inch (1400 mm sweep)
// fan with three blades, a brown motor, a down-rod and the canopy on the ceiling. The blades turn anticlockwise
// seen from below, as ceiling fans in Bangladesh do.
// Built in the plane of the blades: +z points down (towards the viewer below), angle 0 (+y) is "up" on the screen.
import * as THREE from 'three';
import { pointAt } from './reading.js';

export const FAN = { r: 70, tip: 72, ceiling: 42 };

/** A lathe around the z axis from radius, z, radius, z, … */
function lathe(rz, segments = 64) {
  const points = [];
  for (let i = 0; i < rz.length; i += 2) points.push(new THREE.Vector2(rz[i], rz[i + 1]));
  const g = new THREE.LatheGeometry(points, segments);
  g.rotateX(Math.PI / 2); // the lathe's height (y) becomes z
  return g;
}

/** One blade's outline: narrow at the root, wider towards the rounded tip. */
function bladeShape() {
  const s = new THREE.Shape();
  const root = 17;
  const end = FAN.tip - 5.5; // where the round tip starts
  s.moveTo(-3.6, root);
  s.lineTo(-5.6, end);
  s.quadraticCurveTo(-5.8, FAN.tip, 0, FAN.tip);
  s.quadraticCurveTo(5.8, FAN.tip, 5.6, end);
  s.lineTo(3.6, root);
  s.quadraticCurveTo(0, root - 1.2, -3.6, root);
  return s;
}

export function createFan({ materials: M }) {
  const root = new THREE.Group();
  root.name = 'CeilingFan';
  // the plane of the blades: local x = world x, local y = world z, local z = world −y (down)
  const plane = new THREE.Group();
  plane.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0)),
  );
  root.add(plane);

  const body = new THREE.MeshPhysicalMaterial({ name: 'FanBody', color: 0x6e4631, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.3 });
  const paint = new THREE.MeshPhysicalMaterial({
    name: 'Blade',
    color: 0xe7dfcd,
    roughness: 0.42,
    clearcoat: 0.3,
    side: THREE.DoubleSide,
  });

  // ── what does not turn: canopy, down-rod, the motor's top cover ──
  const canopy = new THREE.Mesh(lathe([0.9, -35.5, 3.6, -36.6, 5.8, -39, 6.4, -41.4, 6.4, -FAN.ceiling]), body);
  canopy.name = 'Canopy';
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 27, 20).rotateX(Math.PI / 2), body);
  rod.name = 'DownRod';
  rod.position.z = -22.5;
  const top = new THREE.Mesh(lathe([1.3, -9.6, 4.6, -9.2, 8.6, -7.4, 10.7, -5, 11.3, -3.1]), body);
  top.name = 'MotorTop';
  const ring = new THREE.Mesh(new THREE.TorusGeometry(11.35, 0.5, 12, 72), M.chrome);
  ring.position.z = -2.75;
  plane.add(canopy, rod, top, ring);

  // ── what turns: the motor's shell, three blade irons and three blades ──
  const spin = new THREE.Group();
  spin.name = 'Rotor';
  plane.add(spin);
  const shell = new THREE.Mesh(lathe([11.35, -2.4, 11.6, -0.8, 11.3, 1.6, 10.1, 3.6, 7.6, 5, 4, 5.7, 0, 5.9]), body);
  shell.name = 'MotorShell';
  const cap = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), M.chrome);
  cap.name = 'Cap';
  cap.scale.z = 0.45;
  cap.position.z = 5.6;
  spin.add(shell, cap);

  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape(), { depth: 0.35, bevelEnabled: false, curveSegments: 10 });
  bladeGeo.translate(0, 0, -0.175);
  const ironGeo = new THREE.BoxGeometry(3.2, 15, 0.6);
  const blades = [];
  for (let k = 0; k < 3; k++) {
    const arm = new THREE.Group();
    arm.rotation.z = THREE.MathUtils.degToRad(k * 120);
    const blade = new THREE.Mesh(bladeGeo, paint);
    blade.name = `Blade${k + 1}`;
    blade.position.z = 1;
    blade.rotation.y = THREE.MathUtils.degToRad(-10); // the pitch that pushes the air down
    const iron = new THREE.Mesh(ironGeo, M.satin);
    iron.name = `BladeIron${k + 1}`;
    iron.position.set(0, 17.5, 0.35);
    arm.add(blade, iron);
    spin.add(arm);
    blades.push(blade);
  }

  // a generous invisible target around the blades, so a finger finds the fan on a phone
  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(FAN.tip + 6, FAN.tip + 6, 14, 48).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.userData.noExport = true;
  hit.position.z = 1;
  spin.add(hit);

  // light from the room below, on the side of the fan we look at (not exported). No ceiling shadow: seen from
  // below it would hide behind the fan anyway
  const lamp = new THREE.DirectionalLight(0xffffff, 1.4);
  lamp.position.set(90, -420, 170);
  lamp.target.position.set(0, FAN.ceiling, 0);
  lamp.userData.noExport = true;
  lamp.target.userData.noExport = true;
  root.add(lamp, lamp.target);

  // a point of a part, in the world (written into `out`, so labels that follow it every frame allocate nothing)
  const local =
    (obj, x, y, z) =>
    (out = new THREE.Vector3()) =>
      obj.localToWorld(out.set(x, y, z));
  const tip2 = pointAt(FAN.r, 120);
  return {
    id: 'fan',
    root,
    plane,
    spin,
    r: FAN.r,
    lift: 3, // the path is drawn just below the blades
    fit: { radius: FAN.tip + 4, depth: 10 },
    views: { front: new THREE.Vector3(0, -0.96, 0.28).normalize(), '3d': new THREE.Vector3(0.58, -0.5, 0.64).normalize() },
    grab: [hit],
    lights: [lamp],
    shadowReceiver: null,
    setAngle(deg) {
      spin.rotation.z = THREE.MathUtils.degToRad(deg);
    },
    /** Points the test asks about: the centre, the tip of the marked blade, its middle, another blade's tip. */
    tags: {
      center: local(plane, 0, 0, 3),
      tip: local(spin, 0, FAN.r, 1.5),
      mid: local(spin, 0, 38, 1.5),
      other: local(spin, tip2.x, tip2.y, 1.5),
    },
    exportRoot: root,
  };
}
