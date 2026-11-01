// A Dhaka city bus and the street it drives on, procedural three.js in metres.
//
// Bus coordinates: x forward from the middle of the bus, y up from the road, z to the bus's right. The doors of a
// Bangladeshi bus are on its left (we drive on the left), so the camera looks at the left side, from −z, and the
// bus drives toward the left of the picture. The left wall is cut away between CUT[0] and CUT[1] (a "cut-away"
// drawing), so the passenger can be seen whole, standing in the aisle or on the step of the rear door (behind the
// rear wheel, so that after he steps off only the back of the bus passes him). Green and cream paint with a red
// stripe, white roof, seats along the far side.
//
// Inside: a floor of worn wooden planks, powder-blue laminate lining with a dark kick band, a cream ceiling with
// two strip lights. The parts that never move relative to the bus are merged into one mesh per material, and the
// wheels are instanced, so the whole bus is a couple of dozen draw calls.
//
// The street (createStreet) stays where it is: dark asphalt, a white edge line, a kerb painted in black and yellow
// stripes as Dhaka kerbs are, plain footpaths on both sides, and behind the bus only lamp posts under a blue sky, so
// one can see the bus move against the ground. It is merged by material too.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BUS } from './motion.js';
import { mergeStatic } from './merge.js';
import { asphaltTexture, liningTexture, plankTexture } from './textures.js';

export const BUS_SIZE = { front: 5, rear: -5, half: 1.2, roof: 2.9 };
const W = BUS_SIZE.half;
const T = 0.05; // wall thickness
const SKIRT = 0.3; // bottom of the body
const SILL = 1.62; // windows from here …
const WIN_TOP = 2.45; // … to here
const EAVE = 2.72; // the roof starts here (inside: the ceiling)
const WHEEL_R = 0.48;
const ARCH_R = 0.57;
export const AXLES = [-2.65, 3.6];
export const DOOR = [BUS.door - 0.5, BUS.door + 0.5]; // the rear door, behind the rear wheel
export const CUT = [-4.8, BUS.stand + 1.7]; // the near (left) wall is cut away between these x
const HOUSING_TOP = WHEEL_R + ARCH_R + 0.05; // the wheel housings rise inside the bus up to here
const ARCH_IN = [AXLES[0] - ARCH_R - 0.04, AXLES[0] + ARCH_R + 0.04]; // the rear housing, inside the cut-away
const PILLARS = [-4.86, -3.0, -1.9, -0.8, 1.35, 2.5, 3.65, 4.86]; // window pillars (none behind the passenger's head)

const mat = (name, color, roughness = 0.6, metalness = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness, metalness, ...extra });

/** A box from (x0, y0, z0) to (x1, y1, z1). */
function box(x0, x1, y0, y1, z0, z1, material, r = 0) {
  const geo = r > 0 ? new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 2, r) : new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  const m = new THREE.Mesh(geo, material);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return m;
}

function extrude(shape, depth) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 14 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Arch-cut bottom edge from x0 to x1 (left to right), going round the wheels in between. */
function bottomEdge(x0, x1) {
  const pts = [[x0, SKIRT]];
  for (const ax of AXLES) {
    if (ax - ARCH_R <= x0 || ax + ARCH_R >= x1) continue;
    pts.push([ax - Math.sqrt(ARCH_R ** 2 - (SKIRT - WHEEL_R) ** 2), SKIRT]);
    // the arch, as points (so the outline stays a simple polygon)
    const a0 = Math.PI - Math.asin((SKIRT - WHEEL_R) / ARCH_R);
    const a1 = Math.asin((SKIRT - WHEEL_R) / ARCH_R);
    for (let k = 1; k < 16; k++) {
      const a = a0 + ((a1 - a0) * k) / 16;
      pts.push([ax + ARCH_R * Math.cos(a), WHEEL_R + ARCH_R * Math.sin(a)]);
    }
    pts.push([ax + Math.sqrt(ARCH_R ** 2 - (SKIRT - WHEEL_R) ** 2), SKIRT]);
  }
  pts.push([x1, SKIRT]);
  return pts;
}

function polygon(points) {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (const p of points.slice(1)) s.lineTo(p[0], p[1]);
  return s;
}

/** Texture coordinates from two of a geometry's own axes: u = (a − a0) / su, v = (b − b0) / sv. */
function planarUV(geo, a, b, su, sv, a0 = 0, b0 = 0) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const get = { x: (i) => pos.getX(i), y: (i) => pos.getY(i), z: (i) => pos.getZ(i) };
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (get[a](i) - a0) / su;
    uv[i * 2 + 1] = (get[b](i) - b0) / sv;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function tyreGeometry() {
  const half = 0.13;
  const pts = [
    [0.27, -half * 0.9],
    [0.36, -half],
    [0.43, -half * 0.95],
    [WHEEL_R - 0.004, -half * 0.7],
    [WHEEL_R, -half * 0.3],
    [WHEEL_R, half * 0.3],
    [WHEEL_R - 0.004, half * 0.7],
    [0.43, half * 0.95],
    [0.36, half],
    [0.27, half * 0.9],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 28);
  g.rotateX(Math.PI / 2);
  return g;
}

export function createBus({ materials: M }) {
  const root = new THREE.Group(); // moves along x
  root.name = 'Bus';
  const green = mat('BusGreen', 0x1f7a4d, 0.42, 0.1);
  const cream = mat('BusCream', 0xf1e6c8, 0.5);
  const stripe = mat('BusStripe', 0xc0392b, 0.45);
  const white = mat('BusRoof', 0xf4f4f1, 0.55);
  const inside = mat('BusInside', 0xffffff, 0.75, 0, { map: liningTexture() });
  const housing = mat('WheelHousing', 0x8fa9bc, 0.7);
  const ceiling = mat('Ceiling', 0xf3ead6, 0.85);
  const floorMat = mat('Floor', 0xffffff, 0.85, 0, { map: plankTexture() });
  const cutFace = mat('CutEdge', 0xdcd8cf, 0.7);
  const dark = mat('Trim', 0x2d3238, 0.6, 0.1);
  const glass = new THREE.MeshPhysicalMaterial({
    name: 'Glass',
    color: 0xc9dde8,
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const tinted = new THREE.MeshPhysicalMaterial({ name: 'Windscreen', color: 0x51606c, roughness: 0.1, metalness: 0.1, clearcoat: 1 });
  const seatMat = mat('Seat', 0x9c4a3a, 0.7);
  const seatFrame = mat('SeatFrame', 0x5b6168, 0.5, 0.4);
  const rail = M.chrome.clone();
  rail.name = 'Rail';
  rail.roughness = 0.22;
  const add = (m, name) => {
    m.name = name;
    root.add(m);
    return m;
  };

  // ── the far (right) wall, seen from inside through the cut ──
  const farZ = W - T / 2;
  const lowerFar = extrude(polygon([...bottomEdge(-5, 5), [5, SILL], [-5, SILL]]), T);
  add(new THREE.Mesh(lowerFar, green), 'WallRightLower').position.z = farZ;
  // the inside lining (cream) above the floor
  add(box(-5 + T, 5 - T, BUS.floor, SILL, W - T - 0.012, W - T, inside), 'LiningRight');
  add(box(-5, 5, SILL - 0.07, SILL, W - 0.002, W + 0.004, stripe), 'StripeRight');
  add(box(-5, 5, WIN_TOP, EAVE, farZ - T / 2, farZ + T / 2, cream), 'UpperRight');
  for (const x of PILLARS) add(box(x - 0.06, x + 0.06, SILL, WIN_TOP, farZ - T / 2, farZ + T / 2, cream), 'PillarRight');
  add(box(-5, 5, SILL, WIN_TOP, farZ - 0.006, farZ + 0.006, glass), 'WindowsRight');

  // ── the near (left) wall: whole in front and behind, cut away round the door ──
  const nearZ = -W + T / 2;
  const nearOutline = [
    ...bottomEdge(-5, 5),
    [5, SILL],
    [CUT[1], SILL],
    [CUT[1], BUS.floor],
    // over the rear wheel the wall rises to the housing's top; behind it, the door down to its step
    [ARCH_IN[1], BUS.floor],
    [ARCH_IN[1], HOUSING_TOP],
    [ARCH_IN[0], HOUSING_TOP],
    [ARCH_IN[0], BUS.floor],
    [DOOR[1], BUS.floor],
    [DOOR[1], BUS.step],
    [DOOR[0], BUS.step],
    [DOOR[0], BUS.floor],
    [CUT[0], BUS.floor],
    [CUT[0], SILL],
    [-5, SILL],
  ];
  const lowerNear = extrude(polygon(nearOutline), T);
  add(new THREE.Mesh(lowerNear, green), 'WallLeftLower').position.z = nearZ;
  for (const [x0, x1] of [
    [-5, CUT[0]],
    [CUT[1], 5],
  ]) {
    add(box(x0, x1, SILL - 0.07, SILL, -W - 0.004, -W + 0.002, stripe), 'StripeLeft');
    add(box(x0, x1, WIN_TOP, EAVE, nearZ - T / 2, nearZ + T / 2, cream), 'UpperLeft');
    add(box(x0, x1, SILL, WIN_TOP, nearZ - 0.006, nearZ + 0.006, glass), 'WindowsLeft');
    add(box(x0 + T, x1 - T, BUS.floor, SILL, -W + T, -W + T + 0.012, inside), 'LiningLeft');
    for (const x of PILLARS) if (x > x0 && x < x1) add(box(x - 0.06, x + 0.06, SILL, WIN_TOP, nearZ - T / 2, nearZ + T / 2, cream), 'PillarLeft');
  }
  // the cut faces: where the wall was sawn through
  for (const x of CUT) add(box(x - 0.02, x + 0.02, BUS.floor, EAVE, -W, -W + T, cutFace), 'CutFace');
  for (const [x0, x1] of [
    [CUT[0], DOOR[0]],
    [DOOR[1], ARCH_IN[0]],
    [ARCH_IN[1], CUT[1]],
  ])
    add(box(x0, x1, BUS.floor - 0.02, BUS.floor + 0.012, -W, -W + T, cutFace), 'CutSill');
  add(box(CUT[0], CUT[1], EAVE - 0.03, EAVE, -W, -W + T, cutFace), 'CutHead');

  // ── front and back ──
  add(box(5 - T, 5, SKIRT, 1.25, -W, W, green), 'FrontLower');
  add(box(5 - T, 5, 1.25, 2.5, -W, W, tinted), 'Windscreen');
  add(box(5 - T, 5, 2.5, EAVE, -W, W, cream), 'FrontUpper');
  add(box(4.98, 5.02, 2.52, 2.68, -0.75, 0.75, dark), 'RouteBoard');
  add(box(4.96, 5.1, SKIRT - 0.02, 0.58, -W + 0.02, W - 0.02, dark, 0.03), 'BumperFront');
  add(box(-5, -5 + T, SKIRT, 1.75, -W, W, green), 'BackLower');
  add(box(-5, -5 + T, 1.75, 2.45, -W, W, tinted), 'BackWindow');
  add(box(-5, -5 + T, 2.45, EAVE, -W, W, cream), 'BackUpper');
  add(box(-5.1, -4.96, SKIRT - 0.02, 0.58, -W + 0.02, W - 0.02, dark, 0.03), 'BumperBack');
  const lamp = mat('Headlamp', 0xfdfcf4, 0.2, 0, { emissive: 0xfff6d8, emissiveIntensity: 0.3 });
  const tail = mat('TailLamp', 0xc92a2a, 0.3, 0, { emissive: 0x8a1010, emissiveIntensity: 0.3 });
  for (const z of [-0.85, 0.85]) {
    add(box(4.99, 5.04, 0.72, 0.9, z - 0.17, z + 0.17, lamp, 0.03), 'Headlamp');
    add(box(-5.04, -4.99, 0.8, 1.1, z - 0.1, z + 0.1, tail, 0.02), 'TailLamp');
  }

  // ── roof, floor, the door step, seats, rails ──
  add(box(-5.02, 5.02, EAVE, BUS_SIZE.roof, -W - 0.02, W + 0.02, white, 0.06), 'Roof');
  add(box(-5 + T, 5 - T, EAVE - 0.012, EAVE, -W + T, W - T, ceiling), 'CeilingPanel');
  const floorT = 0.13;
  add(box(-5 + T, DOOR[0], BUS.floor - floorT, BUS.floor, -W + T, W - T, floorMat), 'Floor');
  add(box(DOOR[1], 5 - T, BUS.floor - floorT, BUS.floor, -W + T, W - T, floorMat), 'Floor');
  const wellZ = -0.84; // the step well reaches in to here
  add(box(DOOR[0], DOOR[1], BUS.floor - floorT, BUS.floor, wellZ, W - T, floorMat), 'Floor');
  add(box(DOOR[0] + 0.02, DOOR[1] - 0.02, BUS.step - 0.08, BUS.step, -W, wellZ, floorMat), 'DoorStep');
  add(box(DOOR[0] + 0.02, DOOR[1] - 0.02, BUS.step, BUS.floor - floorT, wellZ - 0.02, wellZ, dark), 'StepRiser');
  add(box(DOOR[0] + 0.02, DOOR[1] - 0.02, BUS.step - 0.012, BUS.step + 0.004, -W, -W + 0.06, mat('StepEdge', 0xe0b000, 0.5)), 'StepEdge');
  // the chassis under the floor (so one cannot see through the bus), and the wheel housings that rise above it
  add(box(-4.9, 4.9, SKIRT + 0.05, BUS.floor - floorT, -W + 0.12, W - 0.12, dark), 'Chassis');
  for (const ax of AXLES)
    for (const [z0, z1] of [
      [-W + T, -W + 0.5],
      [W - 0.5, W - T],
    ])
      add(box(ax - ARCH_R - 0.04, ax + ARCH_R + 0.04, BUS.floor - 0.02, HOUSING_TOP, z0, z1, housing, 0.04), 'WheelHousing');
  // two strip lights along the ceiling
  const stripLight = mat('StripLight', 0xfffbef, 0.4, 0, { emissive: 0xfff4d6, emissiveIntensity: 0.55 });
  for (const z of [-0.62, 0.62]) add(box(-4.5, 4.5, EAVE - 0.035, EAVE - 0.012, z - 0.045, z + 0.045, stripLight, 0.01), 'StripLight');

  // seats facing forward along the far side (none opposite the door: room to stand), and some behind the near wall
  const seatGeo = mergeGeometries([
    new RoundedBoxGeometry(0.42, 0.1, 0.78, 2, 0.03).translate(0, 0.45, 0),
    new RoundedBoxGeometry(0.08, 0.5, 0.78, 2, 0.03).translate(-0.2, 0.74, 0),
  ]);
  const legGeo = new THREE.BoxGeometry(0.04, 0.42, 0.04).translate(0, 0.2, 0);
  const barGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.7, 10).rotateX(Math.PI / 2).translate(-0.2, 1.03, 0);
  const seats = [];
  for (const x of [-4.45, -1.75, 1.35, 2.08, 2.8, 4.45]) seats.push([x, 0.76]);
  for (const x of [2.45, 4.45]) seats.push([x, -0.76]);
  for (const [x, z] of seats) {
    const g = new THREE.Group();
    g.name = 'Seat';
    g.position.set(x, BUS.floor, z);
    g.add(new THREE.Mesh(seatGeo, seatMat), new THREE.Mesh(legGeo, seatFrame), new THREE.Mesh(barGeo, rail));
    root.add(g);
  }
  // the overhead rail over the aisle, held by brackets
  const railGeo = new THREE.CylinderGeometry(0.018, 0.018, 9.6, 12).rotateZ(Math.PI / 2);
  for (const z of [-0.3, 0.3]) {
    const r = add(new THREE.Mesh(railGeo, rail), 'OverheadRail');
    r.position.set(0, EAVE - 0.14, z);
    for (const x of [-4, -1.2, 2.9])
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), rail), 'RailBracket').position.set(x, EAVE - 0.07, z);
  }

  // ── wheels (they turn as the bus moves) ──
  const tyreGeo = tyreGeometry();
  const rubber = mat('Tyre', 0x25282c, 0.85);
  const rimMat = mat('Rim', 0xc8ccd2, 0.3, 0.8);
  const rimGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.22, 24).rotateX(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.24, 16).rotateX(Math.PI / 2);
  const nutGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.25, 6).rotateX(Math.PI / 2);
  // one wheel's dark parts (the hub and its six nuts) as one geometry; each part is one InstancedMesh of four wheels
  const darkGeo = mergeGeometries([
    hubGeo,
    ...Array.from({ length: 6 }, (_, k) => nutGeo.clone().translate(Math.cos((k * Math.PI) / 3) * 0.17, Math.sin((k * Math.PI) / 3) * 0.17, 0)),
  ]);
  const spots = [];
  for (const ax of AXLES) for (const side of [-1, 1]) spots.push(new THREE.Vector3(ax, WHEEL_R, side * (W - 0.2)));
  const wheelParts = [
    [tyreGeo, rubber, 'Tyre'],
    [rimGeo, rimMat, 'Rim'],
    [darkGeo, dark, 'Hub'],
  ].map(([geo, material, name]) => {
    const m = new THREE.InstancedMesh(geo, material, spots.length);
    m.name = `Wheels${name}`;
    root.add(m);
    return m;
  });
  const wheelDummy = new THREE.Object3D();
  function turnWheels(angle) {
    spots.forEach((p, i) => {
      wheelDummy.position.copy(p);
      wheelDummy.rotation.set(0, 0, angle);
      wheelDummy.updateMatrix();
      for (const m of wheelParts) m.setMatrixAt(i, wheelDummy.matrix);
    });
    for (const m of wheelParts) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    }
  }
  turnWheels(0);

  // a big invisible box round the bus: a tap on it plays the event
  const hit = box(-5.1, 5.1, 0, BUS_SIZE.roof, -W - 0.1, W + 0.1, new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  hit.name = 'BusHit';
  root.add(hit);

  // everything that never moves relative to the bus: one mesh per material (the wheels are instanced already)
  // (the matte body parts in plain colours share one painted mesh; glass, chrome, lamps and textured parts keep
  // their own materials)
  const paint = new THREE.MeshStandardMaterial({ name: 'BusPaint', vertexColors: true, roughness: 0.55, metalness: 0.05 });
  const own = new Set([inside, floorMat, glass, tinted, rail, lamp, tail, stripLight, seatFrame, dark]);
  mergeStatic(root, { skip: (o) => o === hit, prefix: 'Bus', paint, paints: (mt) => !own.has(mt) && !mt.map });
  // the floor's planks and the lining's panels are laid out in the bus's own metres (one texture size everywhere)
  for (const m of root.children) {
    if (m.material === floorMat) planarUV(m.geometry, 'x', 'z', 1, 1);
    if (m.material === inside) planarUV(m.geometry, 'x', 'y', 1.2, SILL - BUS.floor, 0, BUS.floor);
  }

  let turned = 0;
  return {
    root,
    hit,
    /** Put the bus at x (m along the road); the wheels turn to match. */
    setX(x) {
      root.position.x = x;
      if (x !== turned) {
        turned = x;
        turnWheels(-x / WHEEL_R);
      }
    },
  };
}

/**
 * The street, which stays put: dark asphalt, the white edge line and the centre dashes, a black-and-yellow kerb, a
 * red-brick footpath on the near side (where he lands) and another on the far side, and behind the bus a row of
 * two-storey shops, trees and lamp posts. Static parts are merged by material; repeats are instanced.
 */
export function createStreet() {
  const root = new THREE.Group();
  root.name = 'Street';
  root.userData.noExport = true;
  const X0 = -30;
  const X1 = 45;
  const len = X1 - X0;
  const mid = (X0 + X1) / 2;
  const ROAD = [-2.75, 7.0]; // z: the road between the near kerb and the far footpath
  const asphaltMap = asphaltTexture();
  asphaltMap.repeat.set(len / 4, (ROAD[1] - ROAD[0]) / 4);
  const asphalt = mat('Asphalt', 0xffffff, 0.95, 0, { map: asphaltMap });
  const paveNear = mat('Footpath', 0xb9ab98, 0.9, 0);
  const paveFar = mat('FootpathFar', 0xb9ab98, 0.9, 0);
  const lineMat = mat('RoadLine', 0xf4f4f0, 0.6);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(len, ROAD[1] - ROAD[0]).rotateX(-Math.PI / 2), asphalt);
  road.name = 'Road';
  road.position.set(mid, 0, (ROAD[0] + ROAD[1]) / 2);
  road.receiveShadow = true;
  root.add(road);
  const pave = new THREE.Mesh(new THREE.BoxGeometry(len, 0.15, 3).translate(0, 0.075, 0), paveNear);
  pave.name = 'Footpath';
  pave.position.set(mid, 0, ROAD[0] - 1.5);
  pave.receiveShadow = true;
  root.add(pave);
  const paveF = new THREE.Mesh(new THREE.BoxGeometry(len, 0.15, 2.4).translate(0, 0.075, 0), paveFar);
  paveF.name = 'FootpathFar';
  paveF.position.set(mid, 0, ROAD[1] + 1.2);
  root.add(paveF);
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.1).rotateX(-Math.PI / 2), lineMat);
  edge.position.set(mid, 0.003, -2.3);
  root.add(edge);
  const m = new THREE.Matrix4();
  // the centre line: dashes, far side of the bus (seen under it)
  const dashGeo = new THREE.PlaneGeometry(1.5, 0.12).rotateX(-Math.PI / 2);
  const dashes = new THREE.InstancedMesh(dashGeo, lineMat, Math.ceil(len / 4));
  for (let i = 0; i < dashes.count; i++) dashes.setMatrixAt(i, m.makeTranslation(X0 + i * 4, 0.003, 2.6));
  root.add(dashes);
  // the kerbs: stones painted black and yellow in turn, on both footpaths
  const stone = new THREE.BoxGeometry(0.5, 0.17, 0.2);
  const per = len * 2;
  const kerb = new THREE.InstancedMesh(stone, new THREE.MeshStandardMaterial({ name: 'Kerb', color: 0xffffff, roughness: 0.7 }), per * 2);
  const yellow = new THREE.Color(0xf2c230);
  const black = new THREE.Color(0x2a2a2a);
  for (let i = 0; i < per; i++) {
    for (const [k, z] of [
      [i, ROAD[0] + 0.1],
      [per + i, ROAD[1] + 0.1],
    ]) {
      kerb.setMatrixAt(k, m.makeTranslation(X0 + i * 0.5 + 0.25, 0.085, z));
      kerb.setColorAt(k, i % 2 ? black : yellow);
    }
  }
  root.add(kerb);

  // the road beside the bus, where a passenger steps down: tar seams across it, patches and drain covers, so one
  // sees the ground stream past while the bus moves
  const seamMat = mat('TarSeam', 0x2f3236, 0.95);
  const seams = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.035, 1.25).rotateX(-Math.PI / 2), seamMat, Math.ceil(len / 1.6));
  for (let i = 0; i < seams.count; i++) seams.setMatrixAt(i, m.makeTranslation(X0 + i * 1.6 + 0.5 * ((i * 7) % 3), 0.004, -1.9));
  root.add(seams);
  const patchMat = mat('Patch', 0x45494e, 0.95);
  const patches = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), patchMat, Math.ceil(len / 2.7));
  const sc = new THREE.Matrix4();
  for (let i = 0; i < patches.count; i++) {
    const w = 0.5 + ((i * 37) % 5) * 0.12;
    const d = 0.25 + ((i * 53) % 4) * 0.08;
    m.makeTranslation(X0 + i * 2.7 + ((i * 11) % 7) * 0.15, 0.003, -1.55 - ((i * 29) % 5) * 0.16);
    patches.setMatrixAt(i, m.multiply(sc.makeScale(w, 1, d)));
  }
  root.add(patches);
  const drainMat = mat('DrainCover', 0x7a7f86, 0.55, 0.5);
  const drainRim = mat('DrainRim', 0x2c2f33, 0.6, 0.3);
  const coverGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.012, 24);
  const rimGeo = new THREE.TorusGeometry(0.28, 0.025, 6, 24).rotateX(Math.PI / 2);
  for (let px = X0 + 3.6; px < X1; px += 5.5) {
    const cover = new THREE.Mesh(coverGeo, drainMat);
    cover.position.set(px, 0.006, -2.15);
    const rim = new THREE.Mesh(rimGeo, drainRim);
    rim.position.set(px, 0.008, -2.15);
    root.add(cover, rim);
  }

  // behind the bus (seen through its windows): only lamp posts, far apart, so the street clearly slides by (the shops,
  // trees and goods were taken out: one clear bus on a plain street)
  const pole = mat('LampPost', 0x3f4852, 0.5, 0.4);
  const lampHead = mat('LampHead', 0xe9e4d4, 0.4, 0, { emissive: 0xfff2c8, emissiveIntensity: 0.25 });
  const postGeo = new THREE.CylinderGeometry(0.07, 0.09, 6, 10);
  const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8).rotateX(Math.PI / 2);
  const headGeo = new THREE.BoxGeometry(0.22, 0.08, 0.4);
  for (let px = X0 + 1.5; px < X1; px += 6) {
    const post = new THREE.Mesh(postGeo, pole);
    post.position.set(px, 3, ROAD[1] + 0.5);
    const arm = new THREE.Mesh(armGeo, pole);
    arm.position.set(px, 5.9, ROAD[1]);
    const head = new THREE.Mesh(headGeo, lampHead);
    head.position.set(px, 5.85, ROAD[1] - 0.55);
    root.add(post, arm, head);
  }
  // the matte parts in plain colours (plaster, signboards, awnings, goods, frames, trees) share one painted mesh
  const paint = new THREE.MeshStandardMaterial({ name: 'StreetPaint', vertexColors: true, roughness: 0.85 });
  const glossy = new Set([pole, lampHead, drainMat, drainRim, lineMat]);
  mergeStatic(root, {
    skip: (o) => o === road || o === pave || o === paveF,
    prefix: 'Street',
    paint,
    paints: (mt) => !glossy.has(mt) && !mt.map,
  });
  return { root };
}
