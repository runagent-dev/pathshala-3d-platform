// A ceiling fan (ফ্যানের পাখা), in metres, seen from below as a student lying in bed sees it: the canopy at the
// ceiling, the down-rod, the motor body that turns with three thin painted metal blades, and a coloured sticker
// under the tip of one blade: the particle whose circular path we follow.
// The fan hangs from +y; it turns anticlockwise as seen from below.
import * as THREE from 'three';
import { COLORS, dashedPath, particleGlow } from './parts.js';
import { TAU } from './motion.js';

const TIP = 0.68; // m from the axis to the sticker
const BLADE_Y = -0.056; // the blades' plane
const PATH_Y = -0.071; // the path, just below the blades (nearer the student)
const FAN_SPAN = 0.74;

function lathe(points, segments = 64) {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}

function bladeGeometry() {
  // a long rounded blade, wider at the tip, in its own plane (x along the blade, y across)
  const L = 0.56;
  const w0 = 0.042;
  const w1 = 0.06;
  const s = new THREE.Shape();
  s.moveTo(0, -w0);
  s.lineTo(L - 0.05, -w1);
  s.quadraticCurveTo(L, -w1, L, -w1 + 0.05);
  s.lineTo(L, w1 - 0.05);
  s.quadraticCurveTo(L, w1, L - 0.05, w1);
  s.lineTo(0, w0);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.0016,
    bevelEnabled: true,
    bevelThickness: 0.0006,
    bevelSize: 0.0008,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.translate(0, 0, -0.0008);
  return geo;
}

export function createFan(M) {
  const root = new THREE.Group();
  root.name = 'CeilingFan';
  const paint = new THREE.MeshPhysicalMaterial({ name: 'FanPaint', color: 0xf0eee5, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const bladePaint = new THREE.MeshPhysicalMaterial({
    name: 'BladePaint',
    color: 0xfaf7ed,
    metalness: 0.15,
    roughness: 0.42,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
    side: THREE.DoubleSide,
  });
  const iron = new THREE.MeshPhysicalMaterial({ name: 'BladeIron', color: 0x8c939b, metalness: 0.9, roughness: 0.35 });

  // fixed parts: canopy at the ceiling and the down-rod
  const canopy = new THREE.Mesh(
    lathe([
      [0, 0.47],
      [0.08, 0.47],
      [0.078, 0.445],
      [0.06, 0.415],
      [0.02, 0.402],
      [0, 0.4],
    ]),
    paint,
  );
  canopy.name = 'Canopy';
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.36, 20), paint);
  rod.position.y = 0.23;
  rod.name = 'DownRod';
  root.add(canopy, rod);

  // the turning part: motor body, trim, cap, blade irons, blades
  const rotor = new THREE.Group();
  rotor.name = 'Rotor';
  root.add(rotor);
  const body = new THREE.Mesh(
    lathe([
      [0, 0.07],
      [0.028, 0.07],
      [0.05, 0.064],
      [0.088, 0.05],
      [0.112, 0.028],
      [0.12, 0.0],
      [0.118, -0.026],
      [0.108, -0.042],
      [0.086, -0.05],
      [0, -0.05],
    ]),
    paint,
  );
  body.name = 'MotorBody';
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.117, 0.0045, 10, 64), M.brass);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = -0.03;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.042, 32, 12, 0, TAU, Math.PI / 2, Math.PI / 2), M.brass);
  cap.scale.y = 0.45;
  cap.position.y = -0.05;
  cap.name = 'BottomCap';
  rotor.add(body, trim, cap);

  const bladeGeo = bladeGeometry();
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = (i * TAU) / 3;
    rotor.add(arm);
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.007, 0.032), iron);
    bracket.position.set(0.15, -0.049, 0);
    arm.add(bracket);
    const blade = new THREE.Mesh(bladeGeo, bladePaint);
    blade.name = `Blade${i + 1}`;
    blade.rotation.x = -Math.PI / 2 + THREE.MathUtils.degToRad(11); // lies flat, pitched 11°
    blade.position.set(0.17, BLADE_Y, 0);
    arm.add(blade);
  }

  // the sticker under the tip of the first blade: a little round tag, its face toward the floor
  const sticker = new THREE.Group();
  sticker.name = 'Sticker';
  const tag = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.012, 40),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
  );
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.032, 40),
    new THREE.MeshStandardMaterial({ color: COLORS.particle, roughness: 0.35, emissive: COLORS.particle, emissiveIntensity: 0.35 }),
  );
  face.rotation.x = Math.PI / 2;
  face.position.y = -0.0062;
  sticker.add(tag, face);
  sticker.position.set(TIP, BLADE_Y - 0.0085, 0);
  const glow = particleGlow(0.2);
  glow.position.y = -0.012;
  sticker.add(glow);
  rotor.add(sticker);

  // the path of the sticker: a circle a little below the blades (drawn, not exported)
  const circle = new THREE.EllipseCurve(0, 0, TIP, TIP, 0, TAU, false, 0);
  const curve = new THREE.CatmullRomCurve3(
    circle
      .getSpacedPoints(160)
      .slice(0, -1)
      .map((p) => new THREE.Vector3(p.x, PATH_Y, -p.y)),
    true,
  );
  const path = dashedPath(curve, { radius: 0.0055, dash: 0.07, closed: true, segments: 320 });
  root.add(path);

  // angle of the sticker: anticlockwise seen from below = negative turn about +y
  const angleAt = (phase) => -TAU * phase;
  const local = new THREE.Vector3();
  const pointAt = (phase, y = PATH_Y) => {
    const a = angleAt(phase);
    return local.set(Math.cos(a) * TIP, y, -Math.sin(a) * TIP).clone();
  };

  const samples = [];
  for (let i = 0; i < 240; i++) samples.push({ p: pointAt(i / 240), phase: i / 240 });

  return {
    id: 'fan',
    root,
    model: root,
    /** The fan at a phase of its turn. */
    setPhase(phase) {
      rotor.rotation.y = angleAt(phase);
    },
    samples,
    phaseOfSample: (s) => s.phase,
    /** The mark at a phase: where it is, the direction across the path, and the velocity (m per period). */
    markPose(phase) {
      const a = angleAt(phase);
      const pos = new THREE.Vector3(Math.cos(a) * TIP, PATH_Y - 0.002, -Math.sin(a) * TIP);
      const across = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
      // d/dphase of (cos a, −sin a) with a = −2π phase
      const vel = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)).multiplyScalar(TAU * TIP);
      return { pos, across, vel };
    },
    normal: new THREE.Vector3(0, -1, 0), // the path's plane faces the floor (the student)
    particle: () => sticker.getWorldPosition(new THREE.Vector3()),
    markLength: 0.15,
    arrowThickness: 0.0095,
    velocityScale: 0.07, // m of arrow per (m per period)
    views: {
      front: new THREE.Vector3(0, -0.96, 0.28).normalize(),
      '3d': new THREE.Vector3(0.5, -0.62, 0.6).normalize(),
    },
    bounds: new THREE.Box3(new THREE.Vector3(-FAN_SPAN, -0.09, -FAN_SPAN), new THREE.Vector3(FAN_SPAN, 0.47, FAN_SPAN)),
    // the blades' circle and the canopy: tighter than the box
    framePoints: [
      ...Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * TAU;
        return new THREE.Vector3(Math.cos(a) * FAN_SPAN, -0.06, Math.sin(a) * FAN_SPAN);
      }),
      ...[0, 1, 2, 3].map((i) => new THREE.Vector3(Math.cos((i * TAU) / 4) * 0.08, 0.47, Math.sin((i * TAU) / 4) * 0.08)),
    ],
    ground: null,
  };
}
