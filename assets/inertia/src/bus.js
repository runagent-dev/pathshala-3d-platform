// A Dhaka city bus and the street it drives on, procedural three.js in metres.
//
// Bus coordinates: x forward from the middle of the bus, y up from the road, z to the bus's right. The doors of a
// Bangladeshi bus are on its left (we drive on the left), so the camera looks at the left side, from −z, and the
// bus drives toward the left of the picture. The left wall is cut away between CUT[0] and CUT[1] (a "cut-away"
// drawing), so the passenger can be seen whole, standing in the aisle or on the step of the rear door (behind the
// rear wheel, so that after he steps off only the back of the bus passes him). Green and cream paint with a red
// stripe, white roof, seats along the far side.
//
// The street (createStreet) stays where it is: asphalt, a white edge line, a kerb painted in black and yellow
// stripes as Dhaka kerbs are, a pavement, and calm shapes behind the bus (shops, trees, lamp posts), so one can
// see the bus move against the ground.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BUS } from './motion.js';

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
  const inside = mat('BusInside', 0xefe7d6, 0.8);
  const ceiling = mat('Ceiling', 0xeef0f1, 0.85);
  const floorMat = mat('Floor', 0xa7a29a, 0.9);
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
      add(box(ax - ARCH_R - 0.04, ax + ARCH_R + 0.04, BUS.floor - 0.02, HOUSING_TOP, z0, z1, inside, 0.04), 'WheelHousing');

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
  const wheels = [];
  for (const ax of AXLES)
    for (const side of [-1, 1]) {
      const w = new THREE.Group();
      w.name = 'Wheel';
      w.position.set(ax, WHEEL_R, side * (W - 0.2));
      w.add(new THREE.Mesh(tyreGeo, rubber), new THREE.Mesh(rimGeo, rimMat), new THREE.Mesh(hubGeo, dark));
      for (let k = 0; k < 6; k++) {
        const nut = new THREE.Mesh(nutGeo, dark);
        nut.position.set(Math.cos((k * Math.PI) / 3) * 0.17, Math.sin((k * Math.PI) / 3) * 0.17, 0);
        w.add(nut);
      }
      root.add(w);
      wheels.push(w);
    }

  // a big invisible box round the bus: a tap on it plays the event
  const hit = box(-5.1, 5.1, 0, BUS_SIZE.roof, -W - 0.1, W + 0.1, new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  hit.name = 'BusHit';
  root.add(hit);

  return {
    root,
    hit,
    /** Put the bus at x (m along the road); the wheels turn to match. */
    setX(x) {
      root.position.x = x;
      for (const w of wheels) w.rotation.z = -x / WHEEL_R;
    },
  };
}

/** The street: road, edge line, black-and-yellow kerb, pavement and calm shapes behind the bus. Stays put. */
export function createStreet() {
  const root = new THREE.Group();
  root.name = 'Street';
  root.userData.noExport = true;
  const X0 = -30;
  const X1 = 45;
  const len = X1 - X0;
  const mid = (X0 + X1) / 2;
  const asphalt = mat('Asphalt', 0xb4b6b8, 0.95);
  const paveMat = mat('Pavement', 0xdedbd4, 0.9);
  const lineMat = mat('RoadLine', 0xfafafa, 0.6);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(len, 12).rotateX(-Math.PI / 2), asphalt);
  road.position.set(mid, 0, 2.6);
  road.receiveShadow = true;
  root.add(road);
  const pave = new THREE.Mesh(new THREE.BoxGeometry(len, 0.15, 3).translate(0, 0.075, 0), paveMat);
  pave.position.set(mid, 0, -2.75 - 1.5);
  pave.receiveShadow = true;
  root.add(pave);
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.1).rotateX(-Math.PI / 2), lineMat);
  edge.position.set(mid, 0.003, -2.3);
  root.add(edge);
  // the centre line: dashes, far side of the bus (seen under it)
  const dashGeo = new THREE.PlaneGeometry(1.5, 0.12).rotateX(-Math.PI / 2);
  const dashes = new THREE.InstancedMesh(dashGeo, lineMat, Math.ceil(len / 4));
  const m = new THREE.Matrix4();
  for (let i = 0; i < dashes.count; i++) dashes.setMatrixAt(i, m.makeTranslation(X0 + i * 4, 0.003, 2.6));
  root.add(dashes);
  // the kerb: stones painted black and yellow in turn
  const stone = new THREE.BoxGeometry(0.5, 0.17, 0.2);
  const kerb = new THREE.InstancedMesh(stone, new THREE.MeshStandardMaterial({ name: 'Kerb', color: 0xffffff, roughness: 0.7 }), len * 2);
  const yellow = new THREE.Color(0xf2c230);
  const black = new THREE.Color(0x2a2a2a);
  for (let i = 0; i < kerb.count; i++) {
    kerb.setMatrixAt(i, m.makeTranslation(X0 + i * 0.5 + 0.25, 0.085, -2.65));
    kerb.setColorAt(i, i % 2 ? black : yellow);
  }
  root.add(kerb);
  // pavement joints (fine lines every metre), so the pavement moves visibly too
  const joint = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.02, 3).rotateX(-Math.PI / 2), mat('Joint', 0xc4c0b7, 0.9), len);
  for (let i = 0; i < joint.count; i++) joint.setMatrixAt(i, m.makeTranslation(X0 + i, 0.152, -4.25));
  root.add(joint);

  // the road beside the bus, where a passenger steps down: tar seams across it, darker patches and drain covers,
  // so one sees the ground stream past while the bus moves
  const seamMat = mat('TarSeam', 0x6f7276, 0.95);
  const seams = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.035, 1.25).rotateX(-Math.PI / 2), seamMat, Math.ceil(len / 1.6));
  for (let i = 0; i < seams.count; i++) seams.setMatrixAt(i, m.makeTranslation(X0 + i * 1.6 + 0.5 * ((i * 7) % 3), 0.004, -1.9));
  root.add(seams);
  const patchMat = mat('Patch', 0x9a9da1, 0.95);
  const patches = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), patchMat, Math.ceil(len / 2.7));
  const sc = new THREE.Matrix4();
  for (let i = 0; i < patches.count; i++) {
    const w = 0.5 + ((i * 37) % 5) * 0.12;
    const d = 0.25 + ((i * 53) % 4) * 0.08;
    m.makeTranslation(X0 + i * 2.7 + ((i * 11) % 7) * 0.15, 0.003, -1.55 - ((i * 29) % 5) * 0.16);
    patches.setMatrixAt(i, m.multiply(sc.makeScale(w, 1, d)));
  }
  root.add(patches);
  const drainMat = mat('DrainCover', 0x55595e, 0.6, 0.4);
  const drainRim = mat('DrainRim', 0x3e4246, 0.6, 0.3);
  for (let px = X0 + 3.6; px < X1; px += 5.5) {
    const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.012, 24), drainMat);
    cover.position.set(px, 0.006, -2.15);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 24).rotateX(Math.PI / 2), drainRim);
    rim.position.set(px, 0.008, -2.15);
    root.add(cover, rim);
  }

  // behind the bus (seen through its windows): shop fronts with bright signboards, trees and dark lamp posts close
  // together, so the street clearly slides by
  const palette = [0xe9dcc9, 0xd9e4dc, 0xe6d5d2, 0xdcdfe8, 0xeee3c4];
  const signColors = [0xb23a48, 0x2f8f83, 0xd9a21b, 0x7a4fa3, 0x3f7f3a];
  const shopGeo = new THREE.BoxGeometry(1, 1, 1);
  const shopMats = palette.map((c, i) => mat(`Shop${i}`, c, 0.9));
  const signMats = signColors.map((c, i) => mat(`ShopSign${i}`, c, 0.6));
  const winMat = mat('ShopWindow', 0x7f8b96, 0.4);
  let x = X0;
  let k = 0;
  while (x < X1) {
    const w = 3.2 + ((k * 37) % 5) * 0.5;
    const h = 3.6 + ((k * 53) % 4) * 0.9;
    const shop = new THREE.Mesh(shopGeo, shopMats[k % palette.length]);
    shop.scale.set(w - 0.2, h, 3);
    shop.position.set(x + w / 2, h / 2, 10.5);
    const front = new THREE.Mesh(shopGeo, winMat);
    front.scale.set(w - 1.0, 1.25, 0.05);
    front.position.set(x + w / 2, 0.85, 8.98);
    const sign = new THREE.Mesh(shopGeo, signMats[(k * 3) % signMats.length]);
    sign.scale.set(w - 0.6, 0.55, 0.06);
    sign.position.set(x + w / 2, 1.85, 8.97);
    root.add(shop, front, sign);
    x += w;
    k++;
  }
  const trunk = mat('Trunk', 0x6b4f35, 0.9);
  const leaves = mat('Leaves', 0x6fae5f, 0.95);
  const pole = mat('LampPost', 0x4f5862, 0.5, 0.4);
  for (let px = X0 + 3; px < X1; px += 9) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 2.6, 10), trunk);
    tr.position.set(px, 1.3, 7.2);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12), leaves);
    crown.position.set(px, 3.6, 7.2);
    crown.scale.set(1, 0.85, 1);
    root.add(tr, crown);
  }
  for (let px = X0 + 1.5; px < X1; px += 4.5) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 6, 10), pole);
    post.position.set(px, 3, 6.2);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8).rotateX(Math.PI / 2), pole);
    arm.position.set(px, 5.9, 5.7);
    root.add(post, arm);
  }
  return { root };
}
