// The CNG auto-rickshaw (সিএনজি) of Bangladesh's streets, built from simple shapes in real metres: green body with
// the rounded nose over the single front wheel, dark rexine roof, the metal grill doors, a driver at the
// handlebar, and the two rear wheels. Origin on the ground under the middle, +x forward, +y up, +z its right side.
// roll(m) turns the wheels for the road covered; steer(rad) turns the front wheel.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const CNG = { length: 2.64, width: 1.3, height: 1.71, wheel: 0.215, front: 0.98, rear: -0.98, track: 0.58 };

/** A diamond grill (the CNG's metal mesh doors) as a texture with see-through holes. */
function grillTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(64, 64);
  ctx.moveTo(64, 0);
  ctx.lineTo(0, 64);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** A soft round shadow under the vehicle (a texture, so it works without real shadows too). */
export function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  g.addColorStop(0, 'rgba(20, 28, 36, 0.5)');
  g.addColorStop(0.55, 'rgba(20, 28, 36, 0.22)');
  g.addColorStop(1, 'rgba(20, 28, 36, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const mat = (name, color, roughness = 0.6, metalness = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness, metalness, ...extra });

export function createCNG({ name = 'CNG' } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const M = {
    body: mat('CNGGreen', '#2f8f46', 0.38, 0.1),
    dark: mat('Rexine', '#253b2c', 0.7), // the dark green rexine roof
    trim: mat('Trim', '#d8dde2', 0.35, 0.6),
    tyre: mat('Tyre', '#24272b', 0.85),
    hub: mat('Hub', '#b9c0c8', 0.3, 0.8),
    seat: mat('Seat', '#5a3a2a', 0.8),
    glass: mat('Glass', '#bcd6e6', 0.08, 0, { transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
    lamp: mat('Lamp', '#fff6d6', 0.2, 0, { emissive: new THREE.Color('#fff2c0'), emissiveIntensity: 0.4 }),
    // a cut-out texture (colour and alpha in one map, so a GLB keeps the holes)
    grill: mat('Grill', '#2b3a30', 0.5, 0.4, { map: grillTexture(), alphaTest: 0.4, side: THREE.DoubleSide }),
    shirt: mat('Shirt', '#8fb3d9', 0.85),
    skin: mat('Skin', '#9a6a45', 0.7),
    hair: mat('Hair', '#1d1d20', 0.8),
    plate: mat('Plate', '#f4f4f0', 0.6),
    tail: mat('TailLamp', '#c92a2a', 0.4, 0, { emissive: new THREE.Color('#7a1010'), emissiveIntensity: 0.4 }),
    blink: mat('Indicator', '#f59f00', 0.4),
  };
  M.grill.map.repeat.set(26, 8);

  // the body: a side outline (lower tub along the whole length, the rounded nose rising to the windscreen),
  // extruded across and narrowed towards the nose
  const outline = new THREE.Shape();
  outline.moveTo(-1.3, 0.3);
  outline.lineTo(0.95, 0.3);
  outline.quadraticCurveTo(1.29, 0.3, 1.32, 0.52);
  outline.quadraticCurveTo(1.37, 0.68, 1.3, 0.82);
  outline.quadraticCurveTo(1.22, 1.0, 1.02, 1.04);
  outline.lineTo(0.8, 1.05);
  outline.lineTo(0.69, 0.89);
  outline.lineTo(-1.16, 0.89);
  outline.quadraticCurveTo(-1.33, 0.89, -1.33, 0.72);
  outline.lineTo(-1.3, 0.3);
  const W = 1.18;
  const bodyGeo = new THREE.ExtrudeGeometry(outline, {
    depth: W,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
    curveSegments: 6,
  });
  bodyGeo.translate(0, 0, -W / 2);
  {
    const p = bodyGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const k = x > 0.55 ? 1 - 0.26 * Math.min(1, (x - 0.55) / 0.8) : 1;
      p.setZ(i, p.getZ(i) * k);
    }
    bodyGeo.computeVertexNormals();
  }
  const body = new THREE.Mesh(bodyGeo, M.body);
  body.name = 'Body';
  root.add(body);
  // a bright strip along each side, the cage's frame along the top of the tub, lamps front and back
  for (const z of [-1, 1]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.045, 0.02), M.trim);
    strip.position.set(-0.3, 0.58, z * 0.645);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.98, 6), M.dark);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(-0.3, 0.9, z * 0.615);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.14), M.tail);
    tail.position.set(-1.345, 0.74, z * 0.42);
    const blink = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.09), M.blink);
    blink.position.set(1.25, 0.93, z * 0.33);
    root.add(strip, rail, tail, blink);
  }

  // roof (dark rexine, a little wider than the body) and the back panel
  const roof = new THREE.Mesh(new RoundedBoxGeometry(2.42, 0.13, 1.34, 2, 0.05), M.dark);
  roof.position.set(-0.13, 1.645, 0);
  roof.name = 'Roof';
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 1.26), M.dark);
  back.position.set(-1.3, 1.22, 0);
  back.name = 'Back';
  root.add(roof, back);

  // pillars: at the windscreen, in the middle, at the back
  const pillar = (x0, y0, x1, y1, z) => {
    const a = new THREE.Vector3(x0, y0, z);
    const b = new THREE.Vector3(x1, y1, z);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, a.distanceTo(b), 6), M.dark);
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    root.add(m);
  };
  for (const z of [-1, 1]) {
    pillar(1.02, 1.04, 0.92, 1.59, z * 0.48);
    pillar(-0.3, 0.88, -0.3, 1.59, z * 0.61);
    pillar(-1.27, 0.88, -1.27, 1.59, z * 0.61);
  }

  // windscreen
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.58), M.glass);
  screen.position.set(0.97, 1.32, 0);
  screen.rotation.set(0, Math.PI / 2, 0);
  screen.rotateX(-0.17);
  screen.name = 'Windscreen';
  root.add(screen);

  // the grill doors on both sides, from the back to the driver
  for (const z of [-1, 1]) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.66), M.grill);
    g.position.set(-0.32, 1.22, z * 0.615);
    g.name = 'GrillDoor';
    root.add(g);
  }

  // seats and the driver at the handlebar
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 1.08), M.seat);
  bench.position.set(-0.95, 0.98, 0);
  const benchBack = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 1.08), M.seat);
  benchBack.position.set(-1.2, 1.2, 0);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.42), M.seat);
  seat.position.set(0.18, 0.98, 0);
  root.add(bench, benchBack, seat);
  const torso = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.42, 0.36, 2, 0.08), M.shirt);
  torso.position.set(0.2, 1.24, 0);
  torso.rotation.z = -0.12;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), M.skin);
  head.position.set(0.25, 1.52, 0);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.104, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.1), M.hair);
  hair.position.copy(head.position);
  hair.rotation.z = 0.25;
  root.add(torso, head, hair);
  for (const z of [-1, 1]) {
    const a = new THREE.Vector3(0.24, 1.36, z * 0.17);
    const b = new THREE.Vector3(0.62, 1.12, z * 0.27);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, a.distanceTo(b), 6), M.shirt);
    arm.position.addVectors(a, b).multiplyScalar(0.5);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    root.add(arm);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 6), M.trim);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0.66, 1.1, 0);
  root.add(bar);

  // headlamp on the nose, bumpers, the number plate at the back
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 16), M.trim);
  lamp.rotation.z = Math.PI / 2;
  lamp.position.set(1.35, 0.7, 0);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), M.lamp);
  lens.rotation.y = Math.PI / 2;
  lens.position.set(1.376, 0.7, 0);
  const bumperF = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.07, 0.9, 1, 0.03), M.trim);
  bumperF.position.set(1.33, 0.36, 0);
  const bumperR = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.07, 1.24, 1, 0.03), M.trim);
  bumperR.position.set(-1.38, 0.38, 0);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.3), M.plate);
  plate.position.set(-1.36, 0.6, 0);
  root.add(lamp, lens, bumperF, bumperR, plate);

  // wheels: one in front (it steers), two behind; each spins about its axle
  const wheelGeo = new THREE.CylinderGeometry(CNG.wheel, CNG.wheel, 0.13, 20);
  wheelGeo.rotateX(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.14, 12);
  hubGeo.rotateX(Math.PI / 2);
  const makeWheel = (x, z) => {
    const w = new THREE.Group();
    w.position.set(x, CNG.wheel, z);
    const tyre = new THREE.Mesh(wheelGeo, M.tyre);
    const hub = new THREE.Mesh(hubGeo, M.hub);
    // a mark on the hub, so the turning shows
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.145), M.tyre);
    w.add(tyre, hub, mark);
    return w;
  };
  const steerer = new THREE.Group();
  steerer.position.set(CNG.front, 0, 0);
  const frontWheel = makeWheel(0, 0);
  steerer.add(frontWheel);
  const rearWheels = [makeWheel(CNG.rear, -CNG.track), makeWheel(CNG.rear, CNG.track)];
  root.add(steerer, ...rearWheels);
  const wheels = [frontWheel, ...rearWheels];

  root.traverse((m) => {
    if (m instanceof THREE.Mesh && !m.material.transparent) m.castShadow = true;
  });

  return {
    root,
    materials: M,
    /** Turn the wheels for the distance covered (m). */
    roll(x) {
      const a = -x / CNG.wheel;
      for (const w of wheels) w.rotation.z = a;
    },
    /** Turn the front wheel (rad, + to the left). */
    steer(rad) {
      steerer.rotation.y = rad;
    },
  };
}
