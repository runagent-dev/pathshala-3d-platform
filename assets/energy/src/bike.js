// A hybrid bicycle, procedural, in metres: diamond frame, spoked wheels, flat handlebar, cranks and chain, rim
// brakes whose pads glow while braking. Local +x is forward, y up, the ground at y = 0, the near side is +z.
import * as THREE from 'three';
import { bake } from './bake.js';

export const BIKE = {
  wheel: 0.34, // m: wheel radius with the tyre (700c)
  rear: new THREE.Vector3(-0.5, 0.34, 0),
  front: new THREE.Vector3(0.52, 0.34, 0),
  bb: new THREE.Vector3(-0.09, 0.27, 0), // the bottom bracket: the cranks turn about it
  crank: 0.17,
  saddle: new THREE.Vector3(-0.31, 0.95, 0), // the top of the saddle, where the rider sits
  grip: new THREE.Vector3(0.33, 1.0, 0.27), // the near grip (the far one at −z)
  pedalZ: 0.115,
  ratio: 1.4, // the wheel turns 1.4 times for each turn of the cranks (a low gear for climbing)
};

const UP = new THREE.Vector3(0, 1, 0);

export function createBike({ frame = '#d7362b' } = {}) {
  const root = new THREE.Group();
  root.name = 'Bicycle';
  const M = {
    frame: new THREE.MeshStandardMaterial({ name: 'Frame', color: frame, roughness: 0.32, metalness: 0.35 }),
    rubber: new THREE.MeshStandardMaterial({ name: 'Tyre', color: '#1d1d1f', roughness: 0.85 }),
    alloy: new THREE.MeshStandardMaterial({ name: 'Alloy', color: '#b9bec4', roughness: 0.3, metalness: 0.85 }),
    dark: new THREE.MeshStandardMaterial({ name: 'BlackParts', color: '#2a2b2e', roughness: 0.5, metalness: 0.4 }),
    saddle: new THREE.MeshStandardMaterial({ name: 'Saddle', color: '#26211e', roughness: 0.6 }),
    grip: new THREE.MeshStandardMaterial({ name: 'Grips', color: '#3a3330', roughness: 0.8 }),
    pad: new THREE.MeshStandardMaterial({ name: 'BrakePads', color: '#3b3634', roughness: 0.7, emissive: '#ff5a1f', emissiveIntensity: 0 }),
    spoke: new THREE.LineBasicMaterial({ name: 'Spokes', color: '#9aa1a8' }),
  };

  const tube = (a, b, r, m = M.frame, parent = root) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 14), m);
    mesh.position.addVectors(a, b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(UP, d.normalize());
    parent.add(mesh);
    return mesh;
  };
  const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);

  // ── wheels: tyre, rim, hub and 32 spokes; they turn about their axles ────────────────────────────────────────────
  const treadGeo = new THREE.BoxGeometry(0.008, 0.004, 0.02);
  function wheel(at, name) {
    const g = new THREE.Group();
    g.name = name;
    g.position.copy(at);
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(BIKE.wheel - 0.016, 0.016, 12, 64), M.rubber);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(BIKE.wheel - 0.036, 0.009, 8, 64), M.alloy);
    rim.scale.z = 1.4;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 14), M.alloy);
    hub.rotation.x = Math.PI / 2;
    // tread: small blocks round the tyre so the turning shows
    const tread = new THREE.Group();
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2;
      const b = new THREE.Mesh(treadGeo, M.rubber);
      b.position.set(Math.cos(a) * (BIKE.wheel - 0.002), Math.sin(a) * (BIKE.wheel - 0.002), 0);
      b.rotation.z = a + Math.PI / 2;
      tread.add(b);
    }
    const pts = [];
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2;
      const side = k % 2 ? 1 : -1;
      const off = a + side * 0.2; // tangent lacing, as real wheels have
      pts.push(Math.cos(off) * 0.02, Math.sin(off) * 0.02, side * 0.035, Math.cos(a) * (BIKE.wheel - 0.04), Math.sin(a) * (BIKE.wheel - 0.04), 0);
    }
    const spokes = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)), M.spoke);
    g.add(tyre, rim, hub, tread, spokes);
    root.add(g);
    return g;
  }
  const rearWheel = wheel(BIKE.rear, 'RearWheel');
  const frontWheel = wheel(BIKE.front, 'FrontWheel');

  // ── the frame ────────────────────────────────────────────────────────────────────────────────────────────────────
  const seatTop = v(-0.245, 0.77);
  const headTop = v(0.33, 0.8);
  const headLow = v(0.37, 0.66);
  tube(BIKE.bb, seatTop, 0.017);
  tube(seatTop.clone().add(v(0.02, -0.02)), headTop.clone().add(v(-0.01, -0.02)), 0.016);
  tube(BIKE.bb, headLow.clone().add(v(-0.01, 0.01)), 0.021);
  tube(headLow, headTop.clone().add(v(-0.005, 0.03)), 0.023);
  for (const side of [-1, 1]) {
    const axle = BIKE.rear.clone().setZ(side * 0.065);
    tube(BIKE.bb.clone().setZ(side * 0.03), axle, 0.0105);
    tube(seatTop.clone().add(v(0.0, -0.03, side * 0.025)), axle, 0.009);
    // fork blades: straight from the crown to the front axle, raked forward
    tube(headLow.clone().add(v(0.0, -0.02, side * 0.035)), BIKE.front.clone().setZ(side * 0.05), 0.012);
  }
  const bbShell = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.075, 16), M.frame);
  bbShell.rotation.x = Math.PI / 2;
  bbShell.position.copy(BIKE.bb);
  root.add(bbShell);
  const crown = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.1), M.frame);
  crown.position.copy(headLow).add(v(0, -0.015));
  root.add(crown);

  // seat post and saddle
  tube(seatTop, BIKE.saddle.clone().add(v(0.01, -0.035)), 0.0135, M.alloy);
  const saddleShape = new THREE.Shape();
  saddleShape.moveTo(-0.12, -0.075);
  saddleShape.quadraticCurveTo(-0.15, 0, -0.12, 0.075);
  saddleShape.quadraticCurveTo(-0.02, 0.07, 0.06, 0.025);
  saddleShape.lineTo(0.13, 0.016);
  saddleShape.quadraticCurveTo(0.15, 0, 0.13, -0.016);
  saddleShape.lineTo(0.06, -0.025);
  saddleShape.quadraticCurveTo(-0.02, -0.07, -0.12, -0.075);
  const saddleGeo = new THREE.ExtrudeGeometry(saddleShape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 3,
    curveSegments: 10,
  });
  saddleGeo.rotateX(-Math.PI / 2);
  const saddle = new THREE.Mesh(saddleGeo, M.saddle);
  saddle.position.copy(BIKE.saddle).add(v(0.01, -0.034));
  saddle.name = 'Saddle';
  root.add(saddle);

  // stem, riser bar and grips
  const stemTop = v(0.36, 0.93);
  tube(headTop.clone().add(v(-0.005, 0.03)), v(0.325, 0.89), 0.016, M.dark);
  tube(v(0.325, 0.89), stemTop, 0.015, M.dark);
  const barPts = [
    v(BIKE.grip.x, BIKE.grip.y, -0.3),
    v(0.345, 0.965, -0.16),
    v(0.36, 0.935, -0.05),
    v(0.36, 0.935, 0.05),
    v(0.345, 0.965, 0.16),
    v(BIKE.grip.x, BIKE.grip.y, 0.3),
  ];
  root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(barPts), 30, 0.011, 10), M.dark));
  for (const side of [-1, 1]) {
    tube(v(BIKE.grip.x, BIKE.grip.y, side * 0.2), v(BIKE.grip.x, BIKE.grip.y, side * 0.31), 0.017, M.grip);
    // brake lever, reaching forward under the bar
    tube(v(BIKE.grip.x + 0.01, BIKE.grip.y - 0.005, side * 0.18), v(BIKE.grip.x + 0.1, BIKE.grip.y - 0.03, side * 0.24), 0.006, M.alloy);
  }

  // rim brakes: callipers over each wheel, and the pads that rub the rim (they glow when hot)
  const pads = [];
  for (const [at, up] of [
    [BIKE.front, v(-0.05, 1).normalize()],
    [BIKE.rear, v(0.42, 1).normalize()],
  ]) {
    const top = at.clone().addScaledVector(up, BIKE.wheel - 0.03);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 6, 16, Math.PI), M.alloy);
    arch.position.copy(at).addScaledVector(up, BIKE.wheel + 0.018);
    arch.rotation.y = Math.PI / 2;
    arch.rotation.x = -Math.atan2(up.x, up.y);
    root.add(arch);
    for (const side of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.012), M.pad);
      pad.position.copy(top).setZ(side * 0.024);
      pad.rotation.z = -Math.atan2(up.x, up.y);
      root.add(pad);
      pads.push(pad);
    }
  }

  // ── drive: chainring, rear cog, chain, cranks and pedals ─────────────────────────────────────────────────────────
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.006, 6, 40), M.alloy);
  ring.position.copy(BIKE.bb).setZ(0.065);
  const cog = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.02, 20), M.dark);
  cog.rotation.x = Math.PI / 2;
  cog.position.copy(BIKE.rear).setZ(0.055);
  root.add(ring, cog);
  const chainPts = [];
  {
    const r1 = 0.098;
    const r2 = 0.044;
    const a = BIKE.bb;
    const b = BIKE.rear;
    for (let k = 0; k <= 16; k++) {
      const th = Math.PI / 2 - (k / 16) * Math.PI; // round the front of the chainring
      chainPts.push(v(a.x + r1 * Math.cos(th), a.y + r1 * Math.sin(th), 0.062));
    }
    for (let k = 0; k <= 12; k++) {
      const th = -Math.PI / 2 - (k / 12) * Math.PI; // round the back of the cog
      chainPts.push(v(b.x + r2 * Math.cos(th), b.y + r2 * Math.sin(th), 0.058));
    }
  }
  const chain = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(chainPts, true), 120, 0.0045, 6, true), M.dark);
  chain.name = 'Chain';
  root.add(chain);
  const cranks = [];
  for (const side of [1, -1]) {
    const arm = new THREE.Group();
    arm.position.copy(BIKE.bb).setZ(side * 0.08);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(BIKE.crank, 0.022, 0.014), M.alloy);
    bar.position.x = BIKE.crank / 2;
    arm.add(bar);
    const pedal = new THREE.Group();
    pedal.position.set(BIKE.crank, 0, side * (BIKE.pedalZ - 0.08));
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 0.075), M.dark);
    pedal.add(body);
    arm.add(pedal);
    root.add(arm);
    cranks.push({ side, arm, pedal });
  }

  // a big invisible box: a tap anywhere on the bicycle and rider acts
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.9, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 0.9, 0);
  hit.userData.noExport = true;
  hit.name = 'BikeHitBox';
  root.add(hit);

  // the frame, wheels, saddle and drive cast the shadow on the road (not the small grips and pads)
  const casts = new Set([M.frame, M.rubber, M.alloy, M.dark, M.saddle]);
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o !== hit) o.castShadow = casts.has(/** @type {THREE.Material} */ (o.material));
  });
  // the parts that never move against the frame, and each wheel's parts, drawn as one mesh per material
  bake(root, { skip: [rearWheel, frontWheel, hit, ...cranks.map((c) => c.arm)] });
  bake(rearWheel);
  bake(frontWheel);

  const pedalAt = [new THREE.Vector3(), new THREE.Vector3()];
  let crankAngle = 0;
  return {
    root,
    hit,
    pads,
    /** Turn the wheels by an angle (radians, forward is negative about +z). */
    roll(angle) {
      rearWheel.rotation.z = angle;
      frontWheel.rotation.z = angle;
    },
    /** Set the cranks: angle of the near crank (radians, 0 = pointing forward). The pedals stay level. */
    setCrank(angle) {
      crankAngle = angle;
      for (const c of cranks) {
        const a = angle + (c.side > 0 ? 0 : Math.PI);
        c.arm.rotation.z = a;
        c.pedal.rotation.z = -a;
      }
    },
    get crank() {
      return crankAngle;
    },
    /** Where each pedal's spindle is, in the bicycle's own space: [near, far]. */
    pedals() {
      for (const [i, c] of cranks.entries()) {
        const a = crankAngle + (c.side > 0 ? 0 : Math.PI);
        pedalAt[i].set(BIKE.bb.x + BIKE.crank * Math.cos(a), BIKE.bb.y + BIKE.crank * Math.sin(a), c.side * BIKE.pedalZ);
      }
      return pedalAt;
    },
    /** How hot the brake pads look, 0 … 1. */
    setHeat(k) {
      M.pad.emissiveIntensity = 1.6 * k;
    },
    materials: M,
  };
}
