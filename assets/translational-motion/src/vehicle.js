// Detailed unbranded family car, metres. The teaching geometry in motion.js stays authoritative.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { CAR } from './motion.js';

const R = CAR.wheelR,
  FRONT = CAR.rearAxle + CAR.wheelbase,
  ARCH = R + 0.06;
const cache = new Map();
function rounded(w, h, d, r = 0.015) {
  const key = [w, h, d, r].join('|');
  if (!cache.has(key)) cache.set(key, mergeVertices(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2) * 0.95)));
  return cache.get(key);
}
function sideProfile() {
  const s = new THREE.Shape(),
    bottom = 0.3,
    a = Math.asin((R - bottom) / ARCH);
  s.moveTo(0.07, bottom);
  s.absarc(CAR.rearAxle, R, ARCH, Math.PI + a, -a, true);
  s.absarc(FRONT, R, ARCH, Math.PI + a, -a, true);
  s.lineTo(3.93, bottom);
  s.quadraticCurveTo(4, bottom, 4, 0.37);
  s.lineTo(4, 0.66);
  s.quadraticCurveTo(3.99, 0.79, 3.84, 0.81);
  s.lineTo(3.12, 0.92);
  s.lineTo(0.5, 0.95);
  s.lineTo(0.14, 0.94);
  s.quadraticCurveTo(0, 0.93, 0, 0.8);
  s.lineTo(0, 0.37);
  s.quadraticCurveTo(0, bottom, 0.07, bottom);
  return s;
}
function shellGeometry() {
  const g = new THREE.ExtrudeGeometry(sideProfile(), {
    depth: CAR.width - 0.1,
    steps: 12,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelOffset: -0.05,
    bevelSegments: 6,
    curveSegments: 24,
  });
  g.translate(0, 0, -(CAR.width - 0.1) / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      top = THREE.MathUtils.smoothstep(y, 0.76, 0.97);
    const side = 1 - 0.035 * top - 0.025 * (1 - THREE.MathUtils.smoothstep(y, 0.3, 0.54));
    const crown = 0.034 * top * (1 - Math.min(1, (z / (CAR.width / 2)) ** 2));
    p.setXYZ(i, x, y + crown, z * side);
  }
  g.computeVertexNormals();
  return mergeVertices(g);
}
function tyreGeometry() {
  const profile = [
    [0.2, -0.086],
    [0.24, -0.099],
    [0.279, -0.103],
    [0.303, -0.094],
    [R - 0.004, -0.071],
    [R, -0.044],
    [R, 0.044],
    [R - 0.004, 0.071],
    [0.303, 0.094],
    [0.279, 0.103],
    [0.24, 0.099],
    [0.2, 0.086],
  ];
  const curve = new THREE.SplineCurve(profile.map((p) => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.LatheGeometry(curve.getPoints(30), 96),
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      radius = Math.hypot(x, z);
    if (radius < R - 0.008) continue;
    const angle = Math.atan2(z, x),
      channel = Math.exp(-(((Math.abs(y) - 0.025) / 0.006) ** 2));
    const diagonal = Math.max(0, Math.cos(angle * 44 + Math.abs(y) * 230)) ** 12;
    const r = Math.min(R, radius) - 0.0019 * channel - 0.0013 * diagonal;
    p.setXYZ(i, (x / radius) * r, y, (z / radius) * r);
  }
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}
function patch(fn, nu, nv, out) {
  const p = [],
    ix = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) p.push(...fn(i / nu, j / nv));
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j,
        b = a + nv + 1;
      ix.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  const n = g.attributes.normal,
    k = Math.floor(n.count / 2);
  if (n.getX(k) * out[0] + n.getY(k) * out[1] + n.getZ(k) * out[2] < 0) {
    for (let i = 0; i < ix.length; i += 3) [ix[i], ix[i + 2]] = [ix[i + 2], ix[i]];
    g.setIndex(ix);
    g.computeVertexNormals();
  }
  return g;
}
const bodySide = (y) =>
  (CAR.width / 2) * (1 - 0.035 * THREE.MathUtils.smoothstep(y, 0.76, 0.97) - 0.025 * (1 - THREE.MathUtils.smoothstep(y, 0.3, 0.54)));
const windowWidth = (y) => 0.83 - (y - 0.94) * 0.357;

export function buildVehicle({ materials: _M, colors, ghost = null }) {
  const root = new THREE.Group();
  root.name = ghost ? 'StartOutline' : 'Car';
  const model = new THREE.Group();
  model.name = 'DetailedCar';
  model.position.x = -CAR.rearAxle;
  root.add(model);
  const paint =
    ghost ||
    new THREE.MeshPhysicalMaterial({
      name: 'PearlWhitePaint',
      color: colors.body,
      metalness: 0.18,
      roughness: 0.28,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
    });
  const trim = ghost || new THREE.MeshStandardMaterial({ name: 'SatinBlackTrim', color: '#18252e', roughness: 0.54, metalness: 0.15 });
  const rubber = ghost || new THREE.MeshStandardMaterial({ name: 'TyreRubber', color: '#20252a', roughness: 0.91 });
  const glass =
    ghost ||
    new THREE.MeshPhysicalMaterial({
      name: 'TintedGlass',
      color: '#344f61',
      metalness: 0.12,
      roughness: 0.1,
      clearcoat: 1,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
  const silver = ghost || new THREE.MeshStandardMaterial({ name: 'MachinedAlloy', color: '#c9d2db', metalness: 0.85, roughness: 0.28 });
  const red = ghost || new THREE.MeshPhysicalMaterial({ name: 'RedAccent', color: '#d92d34', roughness: 0.33, clearcoat: 0.65 });
  /** @param {THREE.BufferGeometry} geo @param {THREE.Material} material @param {string} name @param {THREE.Object3D} [parent] */
  const add = (geo, material, name, parent = model) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  const box = (name, material, size, pos, r = 0.012, parent = model) => {
    const o = add(rounded(size[0], size[1], size[2], r), material, name, parent);
    o.position.set(pos[0], pos[1], pos[2]);
    return o;
  };
  function line(name, points, r, material, parent = model) {
    if (['RearDoorGap', 'FrontDoorGap', 'Beltline', 'FuelDoor'].includes(name))
      points = points.map(([x, y, z]) => [x, y, Math.sign(z) * (bodySide(y) + 0.002)]);
    return add(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), 32, r, 8, false),
      material,
      name,
      parent,
    );
  }
  add(shellGeometry(), paint, 'SculptedBody');
  // The roof crown meets the book's marked roof point exactly at x=1.8, y=1.475.
  const roofAt = (u, v) => {
    const x = 1.14 + u * 1.32,
      z = (v - 0.5) * 1.32;
    return [x, 1.435 + 0.04 * Math.sin(Math.PI * u) - 0.042 * (z / 0.66) ** 2, z];
  };
  add(patch(roofAt, 26, 22, [0, 1, 0]), paint, 'CurvedRoof');
  for (const side of [-1, 1]) {
    line(
      'RoofEdge',
      Array.from({ length: 16 }, (_, i) => roofAt(i / 15, side > 0 ? 1 : 0)),
      0.016,
      paint,
    );
    const a = [3.105, 0.95, side * 0.79],
      b = [2.44, 1.405, side * 0.65],
      c = [1.16, 1.405, side * 0.65],
      d = [0.64, 0.95, side * 0.79];
    line('PillarA', [a, [2.8, 1.16, side * 0.72], b], 0.038, paint);
    line('PillarC', [d, [0.89, 1.18, side * 0.72], c], 0.045, paint);
    line(
      'PillarB',
      [
        [2.01, 0.95, side * 0.83],
        [2.0, 1.2, side * 0.74],
        [1.99, 1.415, side * 0.66],
      ],
      0.031,
      trim,
    );
  }
  const windscreen = (front) =>
    patch(
      (u, v) => {
        const lower = front ? 3.105 : 0.64,
          upper = front ? 2.44 : 1.16,
          w = 0.79 + (0.65 - 0.79) * v;
        const z = (u - 0.5) * 2 * w,
          bow = (1 - (2 * u - 1) ** 2) * 0.022;
        return [lower + (upper - lower) * v + (front ? 1 : -1) * bow, 0.95 + 0.455 * v + 0.015 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v), z];
      },
      24,
      18,
      front ? [1, 1, 0] : [-1, 1, 0],
    );
  add(windscreen(true), glass, 'CurvedWindscreen');
  add(windscreen(false), glass, 'RearWindscreen');
  // Join the crowned roof to the windscreen header across its full width.
  for (const front of [false, true]) {
    add(
      patch(
        (u, v) => {
          const roof = roofAt(front ? 1 : 0, u);
          const z = (u - 0.5) * 1.3;
          const glassX = (front ? 2.44 : 1.16) + (front ? 1 : -1) * (1 - (2 * u - 1) ** 2) * 0.022;
          return [THREE.MathUtils.lerp(roof[0], glassX, v), THREE.MathUtils.lerp(roof[1], 1.405, v), THREE.MathUtils.lerp(roof[2], z, v)];
        },
        22,
        3,
        [front ? 1 : -1, 1, 0],
      ),
      paint,
      'WindscreenHeader',
    );
  }
  for (const side of [-1, 1])
    for (const points of [
      [
        [0.76, 0.975],
        [1.18, 1.385],
        [1.92, 1.405],
        [1.94, 0.975],
      ],
      [
        [2.065, 0.975],
        [2.045, 1.405],
        [2.4, 1.385],
        [2.98, 0.975],
      ],
    ]) {
      const shape = new THREE.Shape();
      points.forEach((p, i) => (i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1])));
      shape.closePath();
      const g = new THREE.ShapeGeometry(shape),
        p = g.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, side * windowWidth(p.getY(i)));
      if (side < 0) {
        const ix = g.index;
        for (let i = 0; i < ix.count; i += 3) {
          const a = ix.getX(i);
          ix.setX(i, ix.getX(i + 2));
          ix.setX(i + 2, a);
        }
      }
      g.computeVertexNormals();
      add(g, glass, 'SideWindow');
      const outline = [...points, points[0]].map(([x, y]) => [x, y, side * (windowWidth(y) + 0.003)]);
      line('WindowSeal', outline, 0.011, trim);
    }
  for (const x of [CAR.rearAxle, FRONT]) {
    const well = add(new THREE.CylinderGeometry(ARCH - 0.01, ARCH - 0.01, CAR.width - 0.07, 56, 1, false, -Math.PI / 2, Math.PI), trim, 'WheelWell');
    well.rotation.x = Math.PI / 2;
    well.position.set(x, R, 0);
  }
  if (!ghost) {
    // Shaped seats, head restraints, dashboard and steering wheel are visible through the glazing.
    const cloth = new THREE.MeshStandardMaterial({ name: 'SeatFabric', color: '#253443', roughness: 0.94 });
    for (const side of [-1, 1]) {
      box('FrontSeatCushion', cloth, [0.46, 0.14, 0.47], [2.02, 0.56, side * 0.36], 0.055);
      const back = box('FrontSeatBack', cloth, [0.12, 0.48, 0.45], [1.84, 0.84, side * 0.36], 0.045);
      back.rotation.z = -0.13;
      box('HeadRestraint', cloth, [0.13, 0.16, 0.25], [1.79, 1.14, side * 0.36], 0.035);
    }
    box('RearBench', cloth, [0.35, 0.4, 1.18], [1.12, 0.76, 0], 0.045);
    box('Dashboard', trim, [0.39, 0.14, 1.31], [2.73, 0.89, 0], 0.035);
    const steering = add(new THREE.TorusGeometry(0.135, 0.018, 10, 40), trim, 'SteeringWheel');
    steering.rotation.y = Math.PI / 2;
    steering.rotation.z = 0.25;
    steering.position.set(2.57, 0.99, 0.35);
    for (const a of [0, 2.1, 4.2])
      line(
        'SteeringSpoke',
        [
          [2.57, 0.99, 0.35],
          [2.57, 0.99 + Math.cos(a) * 0.12, 0.35 + Math.sin(a) * 0.12],
        ],
        0.008,
        silver,
      );
    const seam = new THREE.MeshStandardMaterial({ name: 'PanelGap', color: '#6b747a', roughness: 0.75 });
    for (const side of [-1, 1]) {
      const z = side * 0.866;
      line(
        'RearDoorGap',
        [
          [1.01, 0.94, z],
          [1.95, 0.94, z],
          [1.96, 0.43, z],
          [1.22, 0.43, z],
          [1.11, 0.59, z],
          [1.01, 0.94, z],
        ],
        0.004,
        seam,
      );
      line(
        'FrontDoorGap',
        [
          [2.03, 0.94, z],
          [2.91, 0.94, z],
          [2.86, 0.73, z],
          [2.73, 0.43, z],
          [2.03, 0.43, z],
          [2.03, 0.94, z],
        ],
        0.004,
        seam,
      );
      line(
        'Beltline',
        [
          [0.24, 0.77, z],
          [1.1, 0.79, z],
          [2.6, 0.79, z],
          [3.75, 0.73, z],
        ],
        0.004,
        silver,
      );
      box('SideSkirt', trim, [1.44, 0.055, 0.035], [1.97, 0.345, side * 0.825], 0.013);
      box('RedSillAccent', red, [1.43, 0.018, 0.04], [1.97, 0.374, side * 0.84], 0.007);
      for (const x of [1.68, 2.61]) {
        box('HandleRecess', trim, [0.18, 0.035, 0.009], [x, 0.87, side * (bodySide(0.87) + 0.002)], 0.015);
        box('DoorHandle', silver, [0.145, 0.021, 0.023], [x, 0.875, side * (bodySide(0.875) + 0.014)], 0.009);
      }
      line(
        'MirrorStalk',
        [
          [2.84, 0.98, side * 0.79],
          [2.89, 1.015, side * 0.88],
        ],
        0.018,
        trim,
      );
      box('MirrorHousing', paint, [0.17, 0.105, 0.195], [2.89, 1.035, side * 0.91], 0.038);
      box('MirrorGlass', silver, [0.006, 0.068, 0.14], [2.802, 1.035, side * 0.915], 0.012);
      box(
        'MirrorIndicator',
        new THREE.MeshStandardMaterial({ name: 'MirrorIndicator', color: '#ffd197', roughness: 0.4 }),
        [0.009, 0.012, 0.13],
        [2.979, 1.01, side * 0.91],
        0.004,
      );
    }
    // Projector lamp clusters with individual lenses and LED running lights.
    const lamp = new THREE.MeshPhysicalMaterial({ name: 'LampLens', color: '#e9f7ff', metalness: 0.25, roughness: 0.1, clearcoat: 1 });
    const led = new THREE.MeshStandardMaterial({
      name: 'DaytimeRunningLight',
      color: '#fff8dd',
      emissive: '#fff3cb',
      emissiveIntensity: 0.4,
      roughness: 0.25,
    });
    const tail = new THREE.MeshPhysicalMaterial({
      name: 'TailLampLens',
      color: '#c91430',
      emissive: '#8a1423',
      emissiveIntensity: 0.2,
      roughness: 0.18,
      clearcoat: 1,
    });
    for (const side of [-1, 1]) {
      box('HeadlampHousing', trim, [0.045, 0.14, 0.39], [3.977, 0.705, side * 0.58], 0.028);
      for (const dz of [-0.082, 0.082]) {
        const lens = add(new THREE.CylinderGeometry(0.036, 0.039, 0.018, 32), lamp, 'ProjectorLens');
        lens.rotation.z = -Math.PI / 2;
        lens.position.set(4.004, 0.713, side * 0.58 + dz);
        const bezel = add(new THREE.TorusGeometry(0.04, 0.005, 8, 32), silver, 'ProjectorBezel');
        bezel.rotation.y = Math.PI / 2;
        bezel.position.set(4.015, 0.713, side * 0.58 + dz);
      }
      box('LEDLightBar', led, [0.01, 0.015, 0.31], [4.007, 0.657, side * 0.58], 0.005);
      box('RearLamp', tail, [0.035, 0.12, 0.31], [0.012, 0.785, side * 0.61], 0.022);
      box('RearLED', led, [0.009, 0.012, 0.24], [-0.008, 0.802, side * 0.61], 0.004);
    }
    box('FrontAirIntake', trim, [0.038, 0.18, 0.81], [3.995, 0.505, 0], 0.035);
    for (let i = 0; i < 11; i++) box('GrilleFin', silver, [0.016, 0.012, 0.045], [4.016, 0.555 - (i % 2) * 0.06, -0.34 + i * 0.068], 0.003);
    box('FrontSplitter', trim, [0.07, 0.055, 1.5], [3.97, 0.33, 0], 0.018);
    box('RedFrontAccent', red, [0.035, 0.016, 1.29], [4.005, 0.365, 0], 0.006);
    box('RearDiffuser', trim, [0.065, 0.065, 1.4], [0.025, 0.34, 0], 0.018);
    const plate = new THREE.MeshStandardMaterial({ name: 'BlankNumberPlate', color: '#f4f2e8', roughness: 0.65 });
    box('FrontNumberPlate', plate, [0.014, 0.1, 0.34], [4.022, 0.45, 0], 0.005);
    box('RearNumberPlate', plate, [0.014, 0.1, 0.34], [-0.012, 0.59, 0], 0.005);
    for (const side of [-1, 1]) {
      line(
        'HoodCrease',
        [
          [3.1, 0.945, side * 0.57],
          [3.47, 0.905, side * 0.5],
          [3.85, 0.843, side * 0.44],
        ],
        0.0035,
        silver,
      );
      line(
        'Wiper',
        [
          [3.02, 0.999, side * 0.22],
          [2.84, 1.12, side * 0.4],
        ],
        0.006,
        trim,
      );
      const tip = add(new THREE.TorusGeometry(0.025, 0.006, 8, 24), silver, 'ExhaustTip');
      tip.rotation.y = Math.PI / 2;
      tip.position.set(0, 0.315, side * 0.54);
    }
    // A subtle fuel door and rear deck lip finish the body panels.
    line(
      'FuelDoor',
      [
        [0.39, 0.8, 0.866],
        [0.52, 0.8, 0.866],
        [0.52, 0.92, 0.85],
        [0.39, 0.92, 0.85],
        [0.39, 0.8, 0.866],
      ],
      0.003,
      seam,
    );
    box('RearDeckLip', paint, [0.1, 0.026, 1.3], [0.3, 0.967, 0], 0.012);
  }
  const tyre = tyreGeometry(),
    wheels = {};
  /** @type {Array<[string, number, number]>} */
  const axleLayout = [
    ['rl', CAR.rearAxle, -1],
    ['rr', CAR.rearAxle, 1],
    ['fl', FRONT, -1],
    ['fr', FRONT, 1],
  ];
  for (const [key, x, side] of axleLayout) {
    const hub = new THREE.Group();
    hub.name = `Wheel_${key}`;
    hub.position.set(x, R, (side * CAR.track) / 2);
    model.add(hub);
    const spin = new THREE.Group();
    spin.name = `WheelSpin_${key}`;
    hub.add(spin);
    add(tyre, rubber, 'TreadedTyre', spin);
    const barrel = add(new THREE.CylinderGeometry(0.202, 0.202, 0.17, 48, 1, true), silver, 'AlloyBarrel', spin);
    barrel.rotation.x = Math.PI / 2;
    const rim = add(new THREE.TorusGeometry(0.201, 0.01, 10, 64), silver, 'RimLip', spin);
    rim.position.z = side * 0.092;
    if (!ghost) {
      const disc = add(
        new THREE.CylinderGeometry(0.171, 0.171, 0.012, 48),
        new THREE.MeshStandardMaterial({ name: 'BrakeSteel', color: '#87949e', metalness: 0.8, roughness: 0.42 }),
        'BrakeDisc',
        spin,
      );
      disc.rotation.x = Math.PI / 2;
      disc.position.z = side * 0.043;
      for (let i = 0; i < 5; i++)
        for (const split of [-1, 1]) {
          const a = (i / 5) * Math.PI * 2 + split * 0.075;
          const spoke = add(rounded(0.145, 0.021, 0.026, 0.008), silver, 'SplitAlloySpoke', spin);
          spoke.position.set(Math.cos(a) * 0.121, Math.sin(a) * 0.121, side * 0.087);
          spoke.rotation.z = a + split * 0.14;
        }
      const cap = add(new THREE.CylinderGeometry(0.047, 0.047, 0.023, 32), silver, 'HubCap', spin);
      cap.rotation.x = Math.PI / 2;
      cap.position.z = side * 0.095;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2,
          bolt = add(new THREE.CylinderGeometry(0.007, 0.007, 0.012, 6), trim, 'WheelBolt', spin);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(Math.cos(a) * 0.03, Math.sin(a) * 0.03, side * 0.112);
      }
      box('BrakeCaliper', red, [0.051, 0.12, 0.04], [0.12, 0.012, side * 0.046], 0.018, hub);
    }
    wheels[key] = { hub, spin, side };
  }
  return { root, model, wheels };
}
