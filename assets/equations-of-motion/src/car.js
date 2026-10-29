// The car of the book's worked example (page 45, উদাহরণ), procedural three.js, in metres: a bright red five-door
// hatchback, 4.3 m long and 1.78 m wide (an ordinary small car), a glossy body with wheel arches, a dark windscreen,
// side and rear glass, black bumpers, a grille, headlights and tail lights, mirrors and four wheels with silver
// five-spoke rims. The body's centre is at x = 0, the nose at x = +NOSE; the tyres stand on the road at y = 0.
// car.spin(distance, speed) turns the wheels for the distance gone; when they turn too fast for the eye (the run is
// played faster than real time) the spokes fade into a grey blur disc, as on a photograph.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const NOSE = 2.17; // m from the centre to the front bumper
const W = 1.78; // overall width
const B = 0.05; // the body's rounded edges
const WHEEL_R = 0.32;
const AXLES = [1.32, -1.32];
const ARCH_R = 0.4;

/** The body's side outline (x forward, y up), drawn B inside the real outline: the bevel adds it back. */
function bodyShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.08, 0.3);
  s.lineTo(AXLES[1] - ARCH_R, 0.3);
  s.absarc(AXLES[1], 0.3, ARCH_R, Math.PI, 0, true); // rear wheel arch
  s.lineTo(AXLES[0] - ARCH_R, 0.3);
  s.absarc(AXLES[0], 0.3, ARCH_R, Math.PI, 0, true); // front wheel arch
  s.lineTo(2.02, 0.3);
  s.quadraticCurveTo(2.12, 0.32, 2.12, 0.45);
  s.lineTo(2.1, 0.64);
  s.quadraticCurveTo(2.08, 0.77, 1.94, 0.8); // the nose
  s.lineTo(0.95, 0.94); // the bonnet
  s.lineTo(0.82, 0.97);
  s.lineTo(-0.12, 1.4); // the windscreen
  s.quadraticCurveTo(-0.25, 1.43, -0.45, 1.43);
  s.lineTo(-1.3, 1.41); // the roof
  s.quadraticCurveTo(-1.5, 1.4, -1.62, 1.33);
  s.lineTo(-1.98, 1.08); // the rear window
  s.lineTo(-2.06, 0.98);
  s.quadraticCurveTo(-2.1, 0.8, -2.1, 0.6);
  s.lineTo(-2.1, 0.42);
  s.quadraticCurveTo(-2.1, 0.3, -2.08, 0.3);
  return s;
}

/** A thin slab of glass lying on the body's slope from p to q (outer face just proud of the paint), w wide. */
function slab(p, q, w, material) {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const len = Math.hypot(dx, dy);
  const nx = dy / len; // the outward normal (to the left of p → q, seen from +z)
  const ny = -dx / len;
  const ex = (dx / len) * 0.03; // stop a little short of both ends
  const ey = (dy / len) * 0.03;
  const out = B + 0.012;
  const s = new THREE.Shape();
  s.moveTo(p[0] + ex, p[1] + ey);
  s.lineTo(q[0] - ex, q[1] - ey);
  s.lineTo(q[0] - ex + nx * out, q[1] - ey + ny * out);
  s.lineTo(p[0] + ex + nx * out, p[1] + ey + ny * out);
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
  g.translate(0, 0, -w / 2);
  return new THREE.Mesh(g, material);
}

/** One wheel: tyre, silver rim with five spokes (they turn), hub, and the blur disc for high speed. */
function wheel(side, mats) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.21, 40, 1), mats.tyre);
  tyre.rotation.x = Math.PI / 2;
  const wall = new THREE.Mesh(new THREE.TorusGeometry(WHEEL_R - 0.035, 0.035, 8, 40), mats.tyre);
  wall.position.z = side * 0.105;
  const spin = new THREE.Group();
  spin.name = 'Spokes';
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.2, 32), mats.rimDark);
  rim.rotation.x = Math.PI / 2;
  rim.position.z = side * 0.012;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.016, 8, 40), mats.rim);
  lip.position.z = side * 0.112;
  const spokeGeo = new THREE.BoxGeometry(0.055, 0.19, 0.03);
  spokeGeo.translate(0, 0.095, 0);
  for (let i = 0; i < 5; i++) {
    const sp = new THREE.Mesh(spokeGeo, mats.spoke);
    sp.rotation.z = (i / 5) * Math.PI * 2;
    sp.position.z = side * 0.108;
    spin.add(sp);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 20), mats.rim);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = side * 0.115;
  spin.add(hub);
  const blur = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), mats.blur);
  blur.position.z = side * 0.126;
  if (side < 0) blur.rotation.y = Math.PI;
  blur.userData.noExport = true;
  g.add(tyre, wall, rim, lip, spin, blur);
  return { group: g, spin };
}

/** A soft dark patch under the car, so it stands on the road. */
function contactShadow() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 32, 4, 64, 32, 62);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.32)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 64);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.006;
  m.renderOrder = -1;
  m.name = 'Shadow';
  return m;
}

export function createCar({ color = '#d7262b' } = {}) {
  const root = new THREE.Group();
  root.name = 'Car';
  const mats = {
    paint: new THREE.MeshPhysicalMaterial({ name: 'Paint', color, roughness: 0.32, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 }),
    glass: new THREE.MeshPhysicalMaterial({
      name: 'Glass',
      color: 0x0f1720,
      roughness: 0.08,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 0.45,
    }),
    trim: new THREE.MeshStandardMaterial({ name: 'Trim', color: 0x1f2226, roughness: 0.6, metalness: 0.1 }),
    tyre: new THREE.MeshStandardMaterial({ name: 'Tyre', color: 0x1b1d20, roughness: 0.88, metalness: 0 }),
    rim: new THREE.MeshStandardMaterial({ name: 'Rim', color: 0xd5dade, roughness: 0.25, metalness: 0.9 }),
    rimDark: new THREE.MeshStandardMaterial({ name: 'RimInside', color: 0x3a3f45, roughness: 0.5, metalness: 0.6 }),
    spoke: new THREE.MeshStandardMaterial({ name: 'Spoke', color: 0xd5dade, roughness: 0.25, metalness: 0.9, transparent: true }),
    blur: new THREE.MeshStandardMaterial({
      name: 'WheelBlur',
      color: 0xb9bfc5,
      roughness: 0.4,
      metalness: 0.6,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
    head: new THREE.MeshStandardMaterial({
      name: 'Headlight',
      color: 0xf4f6f8,
      emissive: 0xfff4d6,
      emissiveIntensity: 0.55,
      roughness: 0.15,
      metalness: 0.2,
    }),
    tail: new THREE.MeshStandardMaterial({ name: 'Taillight', color: 0xb3121b, emissive: 0xc8101a, emissiveIntensity: 0.45, roughness: 0.25 }),
    amber: new THREE.MeshStandardMaterial({ name: 'Indicator', color: 0xf59f00, emissive: 0xf08c00, emissiveIntensity: 0.3, roughness: 0.3 }),
    plate: new THREE.MeshStandardMaterial({ name: 'Plate', color: 0xf8f9fa, roughness: 0.5 }),
  };

  // the body: the outline extruded across the car's width, every edge rounded
  const depth = W - 2 * B;
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape(), {
    depth,
    bevelEnabled: true,
    bevelThickness: B,
    bevelSize: B,
    bevelSegments: 4,
    curveSegments: 18,
  });
  bodyGeo.translate(0, 0, -depth / 2);
  const body = new THREE.Mesh(bodyGeo, mats.paint);
  body.name = 'Body';
  root.add(body);

  // glass: windscreen and rear window on the slopes (the pillars stay red at their sides), side windows on the flanks
  const wind = slab([0.82, 0.97], [-0.12, 1.4], W - 0.34, mats.glass);
  wind.name = 'Windscreen';
  const rear = slab([-1.62, 1.33], [-1.98, 1.08], W - 0.4, mats.glass);
  rear.name = 'RearWindow';
  root.add(wind, rear);
  const sideShape = new THREE.Shape();
  sideShape.moveTo(0.7, 1.02);
  sideShape.lineTo(-0.06, 1.355);
  sideShape.quadraticCurveTo(-0.2, 1.38, -0.4, 1.38);
  sideShape.lineTo(-1.26, 1.365);
  sideShape.quadraticCurveTo(-1.42, 1.355, -1.52, 1.29);
  sideShape.lineTo(-1.74, 1.02);
  sideShape.lineTo(0.7, 1.02);
  const sideGeo = new THREE.ExtrudeGeometry(sideShape, { depth: 0.012, bevelEnabled: false });
  for (const side of [1, -1]) {
    const glass = new THREE.Mesh(sideGeo, mats.glass);
    glass.position.z = side > 0 ? W / 2 - 0.004 : -W / 2 - 0.008;
    glass.name = 'SideWindows';
    // the pillar between the doors' windows
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.36, 0.01), mats.trim);
    pillar.position.set(-0.55, 1.2, side * (W / 2 + 0.01));
    // mirror on its stalk
    const mirror = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.11, 0.14, 2, 0.03), mats.paint);
    mirror.position.set(0.6, 1.06, side * (W / 2 + 0.07));
    const handle1 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 0.02), mats.trim);
    handle1.position.set(0.12, 0.93, side * (W / 2 + 0.005));
    const handle2 = handle1.clone();
    handle2.position.x = -0.92;
    // a black sill between the arches, and the side indicator
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.09, 0.03), mats.trim);
    sill.position.set(0, 0.33, side * (W / 2 - 0.005));
    const blink = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.012), mats.amber);
    blink.position.set(1.66, 0.78, side * (W / 2 + 0.003));
    root.add(glass, pillar, mirror, handle1, handle2, sill, blink);
  }

  // the front: headlights, grille, bumper, number plate
  for (const side of [1, -1]) {
    const lamp = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.1, 0.36, 2, 0.035), mats.head);
    lamp.position.set(2.06, 0.71, side * 0.56);
    lamp.rotation.z = -0.25;
    const tail = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.15, 0.3, 2, 0.03), mats.tail);
    tail.position.set(-2.13, 0.86, side * 0.62);
    root.add(lamp, tail);
  }
  const grille = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.13, 0.74, 2, 0.025), mats.trim);
  grille.position.set(2.135, 0.6, 0);
  const bumperF = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.12, 1.66, 2, 0.04), mats.trim);
  bumperF.position.set(2.12, 0.37, 0);
  const bumperR = bumperF.clone();
  bumperR.position.x = -2.12;
  const plateF = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.1, 0.44), mats.plate);
  plateF.position.set(2.185, 0.4, 0);
  const plateR = plateF.clone();
  plateR.position.set(-2.185, 0.62, 0);
  root.add(grille, bumperF, bumperR, plateF, plateR);

  // the wheels
  const spins = [];
  for (const x of AXLES)
    for (const side of [1, -1]) {
      const w = wheel(side, mats);
      w.group.position.set(x, WHEEL_R, side * (W / 2 - 0.13));
      root.add(w.group);
      spins.push(w.spin);
    }
  root.add(contactShadow());

  for (const m of root.children) m.castShadow = true;
  return {
    root,
    /** Turn the wheels for `distance` m gone; `revsPerSecond` as seen on screen fades the spokes into a blur. */
    spin(distance, revsPerSecond = 0) {
      const angle = -distance / WHEEL_R;
      for (const s of spins) s.rotation.z = angle;
      const blur = THREE.MathUtils.smoothstep(revsPerSecond, 4, 12);
      mats.blur.opacity = blur * 0.92;
      mats.spoke.opacity = 1 - blur * 0.85;
    },
  };
}
