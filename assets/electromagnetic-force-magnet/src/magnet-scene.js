// The magnet scene, in millimetres: a coil of copper wire on a plastic tube with no iron inside, with a 1.5 V cell and a
// knife switch lying on the desk in front of it (so the row is short and a phone shows it big), and a bar magnet (N red,
// S grey) on a little cart that can roll towards the coil or away from it, up to a block at the end. The current goes
// from the cell's + end through the switch into the coil's RIGHT end and round it back to its left end, then to the
// cell's − end; the winding turns so that, seen from the magnet, the current goes anticlockwise: the coil's right end
// (facing the magnet) is a north pole while the current flows (right-hand grip rule).
// While the switch is closed, small chevrons run along the wires: the current. The app moves things; this file
// builds them and says where they are.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { boxProjectUV, textMesh } from '@shared/student/materials.js';
import { benchMaterials } from './desk.js';
import { mergeStatic } from './merge.js';
import { MAG } from './physics.js';
import { FLOOR_Y } from './room.js';

/** The coil lies along x; the magnet's left end touches its right end at gap 0. */
export const COIL = { x0: -95, x1: -95 + MAG.coil, y: 19.5, r: 14.2, tube: 12.4, flange: 19.5 };
export const BAR = { len: MAG.bar, h: 16, d: 12 };
/** The force arrows run just above the coil and the magnet, at their facing ends. */
export const ARROW = { y: 46, z: 5 };
/** The middle of the bar magnet for a gap between it and the coil. */
export const magnetX = (gap) => COIL.x1 + gap + BAR.len / 2;
const COIL_X = (COIL.x0 + COIL.x1) / 2;
const FRONT = 52; // z of the cell and the switch, in front of the coil
const CELL = { x: -88, r: 10, len: 50 }; // a 1.5 V cell in front of the coil's left half, + at its right end
const SWITCH_X = -43; // the knife switch in front of the coil's right half (hinge on its left)
const CHEVRON_GAP = 15; // mm between the current's chevrons along the wires
const CURRENT_SPEED = 24; // mm/s they move (only a picture of the current: the real drift is far slower)

/**
 * A helix along +x (u = 0 at its left end): the coil's winding. Going from its right end to its left (the way the
 * current goes), it turns y → z → −y → −z: anticlockwise about +x, so the right end is the north pole.
 */
class Helix extends THREE.Curve {
  constructor(x0, x1, r, turns) {
    super();
    Object.assign(this, { x0, x1, r, turns });
  }
  getPoint(u, out = new THREE.Vector3()) {
    const a = -u * this.turns * Math.PI * 2;
    return out.set(this.x0 + (this.x1 - this.x0) * u, COIL.y + this.r * Math.cos(a), this.r * Math.sin(a));
  }
}

const curveOf = (points) => new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));

export function createMagnetScene({ colors }) {
  const root = new THREE.Group();
  root.name = 'MagnetScene';
  const materials = benchMaterials();

  // ── the desk: its top takes the shadows; an apron and four legs down to the floor ──
  const wood = materials.wood;
  const desk = new THREE.Mesh(boxProjectUV(new THREE.BoxGeometry(560, 24, 320)), wood);
  desk.name = 'Desk';
  desk.position.set(0, -12, -40);
  desk.receiveShadow = true;
  root.add(desk);
  const frame = new THREE.Group();
  const legLen = -24 - FLOOR_Y;
  for (const x of [-255, 255])
    for (const z of [-180, 100]) {
      const leg = new THREE.Mesh(boxProjectUV(new THREE.BoxGeometry(34, legLen, 34)), wood);
      leg.position.set(x, -24 - legLen / 2, z);
      frame.add(leg);
    }
  for (const z of [-182, 102]) {
    const apron = new THREE.Mesh(boxProjectUV(new THREE.BoxGeometry(476, 60, 18)), wood);
    apron.position.set(0, -54, z);
    frame.add(apron);
  }
  root.add(mergeStatic(frame));

  // ── the coil ──
  const coil = new THREE.Group();
  coil.name = 'Coil';
  const white = new THREE.MeshStandardMaterial({ name: 'Plastic', color: 0xf3f3ef, roughness: 0.45 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(COIL.tube, COIL.tube, MAG.coil, 32, 1, true).rotateZ(Math.PI / 2), white);
  tube.position.set(COIL_X, COIL.y, 0);
  const flangeGeo = new THREE.CylinderGeometry(COIL.flange, COIL.flange, 3, 40).rotateZ(Math.PI / 2);
  const flangeL = new THREE.Mesh(flangeGeo, white.clone());
  const flangeR = new THREE.Mesh(flangeGeo, white.clone());
  flangeL.position.set(COIL.x0 + 1.5, COIL.y, 0);
  flangeR.position.set(COIL.x1 - 1.5, COIL.y, 0);
  const turns = 22;
  const helix = new Helix(COIL.x0 + 4, COIL.x1 - 4, COIL.r, turns);
  const winding = new THREE.Mesh(new THREE.TubeGeometry(helix, turns * 20, 1.3, 6, false), materials.copper);
  winding.name = 'Winding';
  coil.add(tube, flangeL, flangeR, winding);
  root.add(coil);

  // ── the cell, + at its right end ──
  const cell = new THREE.Group();
  cell.name = 'Cell';
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(CELL.r, CELL.r, CELL.len, 32).rotateZ(Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'CellBody', color: 0x26282c, roughness: 0.4, metalness: 0.2 }),
  );
  const band = new THREE.Mesh(new THREE.CylinderGeometry(CELL.r + 0.2, CELL.r + 0.2, 18, 32).rotateZ(Math.PI / 2), materials.brass);
  band.position.x = CELL.len / 2 - 9;
  const nub = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 3, 20).rotateZ(Math.PI / 2), materials.steel);
  nub.position.x = CELL.len / 2 + 1.5;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 1.2, 32).rotateZ(Math.PI / 2), materials.steel);
  cap.position.x = -CELL.len / 2 - 0.6;
  const plus = textMesh('+', 9, { color: '#1d2733', weight: 700 });
  plus.position.set(CELL.len / 2 - 9, 0, CELL.r + 0.4);
  const minus = textMesh('−', 9, { color: '#ffffff', weight: 700 });
  minus.position.set(-10, 0, CELL.r + 0.3);
  cell.add(body, band, nub, cap, plus, minus);
  cell.position.set(CELL.x, CELL.r, FRONT);
  root.add(mergeStatic(cell, { keep: [plus, minus] }));

  // ── the knife switch between the cell and the coil ──
  const sw = new THREE.Group();
  sw.name = 'Switch';
  const base = new THREE.Mesh(new RoundedBoxGeometry(28, 6, 20, 2, 1.5), new THREE.MeshStandardMaterial({ color: 0x2f3237, roughness: 0.5 }));
  base.position.y = 3;
  const postGeo = new THREE.CylinderGeometry(2.2, 2.2, 9, 16);
  const hinge = new THREE.Mesh(postGeo, materials.brass);
  hinge.position.set(-9, 10, 0);
  const contact = new THREE.Mesh(postGeo, materials.brass);
  contact.position.set(9, 10, 0);
  const blade = new THREE.Group(); // turns about the hinge post
  blade.position.set(-9, 14, 0);
  const bladeBar = new THREE.Mesh(new THREE.BoxGeometry(21, 1.6, 4), materials.brass);
  bladeBar.position.x = 10.5;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 10, 16), new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.45 }));
  handle.position.set(19, 4.5, 0);
  blade.add(bladeBar, handle);
  sw.add(base, hinge, contact, blade);
  sw.position.set(SWITCH_X, 0, FRONT);
  root.add(mergeStatic(sw, { keep: [blade] }));
  /** The blade down on its contact (closed: the current flows) or up (open). k: 0 open … 1 closed. */
  const setBlade = (k) => {
    blade.rotation.z = (1 - k) * 1.0;
  };
  setBlade(0);
  const switchHit = new THREE.Mesh(new THREE.BoxGeometry(40, 46, 40), new THREE.MeshBasicMaterial({ visible: false }));
  switchHit.position.set(SWITCH_X, 16, FRONT);
  switchHit.userData = { part: 'switch', noExport: true };
  root.add(switchHit);

  // ── the wires: + of the cell → switch → the coil's right end; round the coil; its left end → − of the cell ──
  const red = new THREE.MeshStandardMaterial({ name: 'WireRed', color: 0xc92a2a, roughness: 0.5 });
  const black = new THREE.MeshStandardMaterial({ name: 'WireBlack', color: 0x2b2d31, roughness: 0.5 });
  const start = helix.getPoint(0); // the left end (top of the tube)
  const end = helix.getPoint(1); // the right end
  const plusEnd = CELL.x + CELL.len / 2 + 3;
  const minusEnd = CELL.x - CELL.len / 2 - 1.2;
  const wires = [
    [
      curveOf([
        [plusEnd, CELL.r, FRONT],
        [plusEnd + 3, CELL.r + 3, FRONT + 2],
        [SWITCH_X - 12, 15, FRONT + 1],
        [SWITCH_X - 9, 14.5, FRONT],
      ]),
      red,
    ],
    [
      curveOf([
        [SWITCH_X + 9, 14.5, FRONT],
        [SWITCH_X + 13, 20, FRONT - 6],
        [end.x + 1, 8, 24],
        [end.x + 2, end.y + 3, 10],
        [end.x, end.y, end.z],
      ]),
      red,
    ],
    [
      curveOf([
        [start.x, start.y, start.z],
        [start.x - 2, start.y + 3, 10],
        [COIL.x0 - 5, 10, 22],
        [minusEnd - 8, 4, FRONT - 6],
        [minusEnd, CELL.r, FRONT],
      ]),
      black,
    ],
  ];
  const wiring = new THREE.Group();
  wiring.name = 'Wires';
  wires.forEach(([curve, material], i) => {
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, i ? 40 : 24, 1.4, 8, false), material);
    m.name = 'Wire';
    wiring.add(m);
  });
  root.add(mergeStatic(wiring));

  // the current: chevrons that run along the wires, from + round to −, while the switch is closed
  const lengths = wires.map(([c]) => c.getLength());
  const total = lengths.reduce((a, b) => a + b, 0);
  const chevronMat = new THREE.MeshStandardMaterial({
    name: 'Current',
    color: 0xf59f00,
    emissive: new THREE.Color(0xf59f00).multiplyScalar(0.35),
    roughness: 0.4,
  });
  // one instanced mesh, a cone each
  const n = Math.round(total / CHEVRON_GAP);
  const chevrons = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 5, 12), chevronMat, n);
  chevrons.name = 'Current';
  chevrons.userData.noExport = true;
  chevrons.frustumCulled = false;
  chevrons.visible = false;
  root.add(chevrons);
  const UP = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3();
  const at = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const m4 = new THREE.Matrix4();
  /** Show the current (on) at time t (s): every chevron a little further along the wires. */
  function setCurrent(on, t = 0) {
    chevrons.visible = on;
    if (!on) return;
    for (let i = 0; i < n; i++) {
      let s = ((((i * total) / n + t * CURRENT_SPEED) % total) + total) % total;
      let w = 0;
      while (s > lengths[w] && w < lengths.length - 1) s -= lengths[w++];
      const u = Math.min(1, s / lengths[w]);
      wires[w][0].getPointAt(u, at);
      wires[w][0].getTangentAt(u, tangent);
      chevrons.setMatrixAt(i, m4.compose(at, q.setFromUnitVectors(UP, tangent), one));
    }
    chevrons.instanceMatrix.needsUpdate = true;
  }

  // the coil's ends turn red (N, facing the magnet) and grey (S) while the current flows; the app names them
  const north = new THREE.Color(colors.north);
  const south = new THREE.Color(colors.south);
  /** The coil as a magnet (current on): coloured ends; off: plain white plastic. */
  function setCoilOn(on) {
    flangeL.material.color.set(on ? south : 0xf3f3ef);
    flangeR.material.color.set(on ? north : 0xf3f3ef);
  }

  // ── the bar magnet on its cart ──
  const cart = new THREE.Group();
  cart.name = 'Cart';
  const deck = new THREE.Mesh(boxProjectUV(new RoundedBoxGeometry(84, 4, 24, 2, 1)), wood.clone());
  deck.position.y = 9.5;
  const rubber = new THREE.MeshStandardMaterial({ name: 'Rubber', color: 0x26282c, roughness: 0.7 });
  const wheelGeo = new THREE.CylinderGeometry(5, 5, 3.5, 20).rotateX(Math.PI / 2);
  const wheels = new THREE.Group();
  wheels.name = 'Wheels';
  for (const [x, z] of [
    [-31, 13.5],
    [31, 13.5],
    [-31, -13.5],
    [31, -13.5],
  ]) {
    const w = new THREE.Mesh(wheelGeo.clone(), rubber);
    w.position.set(x, 5, z);
    wheels.add(w);
  }
  wheelGeo.dispose();
  cart.add(deck, mergeStatic(wheels));
  const magnet = new THREE.Group(); // turns round for a flip; N at its own +x end
  magnet.name = 'BarMagnet';
  magnet.position.y = 19.5;
  const halfGeo = new RoundedBoxGeometry(BAR.len / 2, BAR.h, BAR.d, 2, 1.2);
  const nHalf = new THREE.Mesh(halfGeo, new THREE.MeshStandardMaterial({ name: 'NorthPaint', color: colors.north, roughness: 0.35, metalness: 0.1 }));
  const sHalf = new THREE.Mesh(halfGeo, new THREE.MeshStandardMaterial({ name: 'SouthPaint', color: colors.south, roughness: 0.35, metalness: 0.1 }));
  nHalf.position.x = BAR.len / 4;
  sHalf.position.x = -BAR.len / 4;
  magnet.add(nHalf, sHalf);
  // the letters on the long sides (the one that faces the viewer), as printed on a school magnet
  for (const [letter, x] of [
    ['N', BAR.len / 4 + 4],
    ['S', -BAR.len / 4 - 4],
  ]) {
    const front = textMesh(letter, 11, { color: '#ffffff', weight: 700 });
    front.position.set(x, 0, BAR.d / 2 + 0.15);
    const backSide = textMesh(letter, 11, { color: '#ffffff', weight: 700 });
    backSide.rotation.y = Math.PI;
    backSide.position.set(x, 0, -BAR.d / 2 - 0.15);
    magnet.add(front, backSide);
  }
  cart.add(magnet);
  const magnetHit = new THREE.Mesh(new THREE.BoxGeometry(104, 48, 44), new THREE.MeshBasicMaterial({ visible: false }));
  magnetHit.position.y = 16;
  magnetHit.userData = { part: 'magnet', noExport: true };
  cart.add(magnetHit);
  root.add(cart);

  // the block that stops the cart at the end of the track
  const stopper = new THREE.Mesh(boxProjectUV(new THREE.BoxGeometry(12, 22, 40)), wood);
  stopper.name = 'EndBlock';
  stopper.position.set(magnetX(MAG.gapMax) + BAR.len / 2 + 4 + 6, 11, 0);
  root.add(stopper);

  return {
    root,
    coil,
    cart,
    magnet,
    setBlade,
    setCoilOn,
    setCurrent,
    hits: [magnetHit, switchHit],
    meshes: { coil, cell, sw, cart },
    /** What the camera must show (x from … to, in mm). */
    extent: { left: Math.min(minusEnd - 10, COIL.x0 - 10), right: stopper.position.x + 8, front: FRONT + 14 },
    points: {
      cell: new THREE.Vector3(CELL.x, 2 * CELL.r, FRONT),
      switch: new THREE.Vector3(SWITCH_X, 16, FRONT),
      south: new THREE.Vector3(COIL.x0 + 1.5, 1, COIL.flange * 0.6),
      north: new THREE.Vector3(COIL.x1 - 1.5, 1, COIL.flange * 0.6),
    },
  };
}
