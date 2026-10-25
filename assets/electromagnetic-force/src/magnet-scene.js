// The magnet scene, in millimetres: a coil of copper wire on a plastic tube (no iron inside), a cell and a knife
// switch behind it, and a bar magnet (N red, S blue) on a little cart that can roll along the desk towards the
// coil or away from it, up to a block at the end. Wound and fed as drawn (the current goes in at the coil's left
// end and round it as a right-handed screw turns), the coil's right end is a north pole while the current flows.
// Two arrows above show the force on each (equal and opposite). The app moves things; this file builds them.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { boxProjectUV, textMesh } from '@shared/student/materials.js';
import { deskWood } from './desk.js';
import { MAG } from './physics.js';

/** The coil lies along x; the magnet's left end touches its right end at gap 0. */
export const COIL = { x0: -95, x1: -95 + MAG.coil, y: 19.5, r: 14.2, tube: 12.4, flange: 19.5 };
export const BAR = { len: MAG.bar, h: 16, d: 12 };
export const ARROW_Y = 70; // the force arrows run above everything else
/** The middle of the bar magnet for a gap between it and the coil. */
export const magnetX = (gap) => COIL.x1 + gap + BAR.len / 2;
export const COIL_X = (COIL.x0 + COIL.x1) / 2;

/** A helix along +x, turning as a right-handed screw (y → z → −y → −z as it goes): the coil's winding. */
class Helix extends THREE.Curve {
  constructor(x0, x1, r, turns) {
    super();
    Object.assign(this, { x0, x1, r, turns });
  }
  getPoint(u, out = new THREE.Vector3()) {
    const a = u * this.turns * Math.PI * 2;
    return out.set(this.x0 + (this.x1 - this.x0) * u, COIL.y + this.r * Math.cos(a), this.r * Math.sin(a));
  }
}

function wire(points, material, name) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 1.4, 8, false), material);
  m.name = name;
  return m;
}

export function createMagnetScene({ materials, colors }) {
  const root = new THREE.Group();
  root.name = 'MagnetScene';

  // ── the desk ──
  const wood = deskWood(materials);
  const desk = new THREE.Mesh(boxProjectUV(new THREE.BoxGeometry(560, 24, 320)), wood);
  desk.name = 'Desk';
  desk.position.set(30, -12, -40);
  desk.receiveShadow = true;
  root.add(desk);

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

  // ── the cell (+ at its left end) and the knife switch, behind the coil ──
  const cellBody = new THREE.MeshStandardMaterial({ name: 'CellBody', color: 0x26282c, roughness: 0.4, metalness: 0.2 });
  const cell = new THREE.Group();
  cell.name = 'Cell';
  const body = new THREE.Mesh(new THREE.CylinderGeometry(16.5, 16.5, 58, 32).rotateZ(Math.PI / 2), cellBody);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(16.7, 16.7, 22, 32).rotateZ(Math.PI / 2), materials.brass);
  band.position.x = -18;
  const nub = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 4, 20).rotateZ(Math.PI / 2), materials.steel);
  nub.position.x = -31;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 1.5, 32).rotateZ(Math.PI / 2), materials.steel);
  cap.position.x = 29.5;
  const plus = textMesh('+', 12, { color: '#1d2733', weight: 700 });
  plus.position.set(-18, 0, 16.9);
  const minus = textMesh('−', 12, { color: '#ffffff', weight: 700 });
  minus.position.set(18, 0, 16.7);
  cell.add(body, band, nub, cap, plus, minus);
  cell.position.set(-84, 16.5, -66);
  root.add(cell);

  const sw = new THREE.Group();
  sw.name = 'Switch';
  const base = new THREE.Mesh(new RoundedBoxGeometry(44, 6, 22, 2, 1.5), new THREE.MeshStandardMaterial({ color: 0x2f3237, roughness: 0.5 }));
  base.position.y = 3;
  const postGeo = new THREE.CylinderGeometry(2.4, 2.4, 9, 16);
  const hinge = new THREE.Mesh(postGeo, materials.brass);
  hinge.position.set(-15, 10, 0);
  const contact = new THREE.Mesh(postGeo, materials.brass);
  contact.position.set(15, 10, 0);
  const blade = new THREE.Group(); // turns about the hinge post
  blade.position.set(-15, 14, 0);
  const bladeBar = new THREE.Mesh(new THREE.BoxGeometry(32, 1.6, 4), materials.brass);
  bladeBar.position.x = 16;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 11, 16), new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.45 }));
  handle.position.set(30, 5, 0);
  blade.add(bladeBar, handle);
  sw.add(base, hinge, contact, blade);
  sw.position.set(-20, 0, -66);
  root.add(sw);
  /** The blade down on its contact (closed: the current flows) or up (open). k: 0 open … 1 closed. */
  const setBlade = (k) => {
    blade.rotation.z = (1 - k) * 0.95;
  };
  setBlade(0);
  const switchHit = new THREE.Mesh(new THREE.BoxGeometry(70, 50, 56), new THREE.MeshBasicMaterial({ visible: false }));
  switchHit.position.set(-20, 18, -60);
  switchHit.userData = { part: 'switch', noExport: true };
  root.add(switchHit);

  // wires: + of the cell to the coil's left end; the coil's right end to the switch; the switch to − of the cell
  const red = new THREE.MeshStandardMaterial({ name: 'WireRed', color: 0xc92a2a, roughness: 0.5 });
  const black = new THREE.MeshStandardMaterial({ name: 'WireBlack', color: 0x2b2d31, roughness: 0.5 });
  const start = helix.getPoint(0);
  const end = helix.getPoint(1);
  root.add(
    wire(
      [
        [start.x, start.y, start.z],
        [start.x - 3, start.y + 5, -8],
        [-104, 22, -24],
        [-122, 10, -44],
        [-120, 14, -62],
        [-117, 16.5, -66],
      ],
      red,
      'WirePlus',
    ),
    wire(
      [
        [end.x, end.y, end.z],
        [end.x + 3, end.y + 5, -8],
        [-14, 24, -30],
        [-2, 16, -54],
        [-5, 14.5, -66],
      ],
      black,
      'WireSwitch',
    ),
    wire(
      [
        [-35, 14.5, -66],
        [-42, 10, -60],
        [-50, 12, -58],
        [-54, 16, -64],
        [-55, 16.5, -66],
      ],
      black,
      'WireMinus',
    ),
  );

  // the coil's ends turn red (N, facing the magnet) and blue (S) while the current flows; the app names them
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
  const deckWood = wood.clone();
  const deck = new THREE.Mesh(boxProjectUV(new RoundedBoxGeometry(84, 4, 24, 2, 1)), deckWood);
  deck.position.y = 9.5;
  const rubber = new THREE.MeshStandardMaterial({ name: 'Rubber', color: 0x26282c, roughness: 0.7 });
  const wheelGeo = new THREE.CylinderGeometry(5, 5, 3.5, 20).rotateX(Math.PI / 2);
  cart.add(deck);
  for (const [x, z] of [
    [-31, 13.5],
    [31, 13.5],
    [-31, -13.5],
    [31, -13.5],
  ]) {
    const w = new THREE.Mesh(wheelGeo, rubber);
    w.position.set(x, 5, z);
    cart.add(w);
  }
  const magnet = new THREE.Group(); // turns round for a flip; N at its own +x end
  magnet.name = 'BarMagnet';
  magnet.position.y = 19.5;
  const halfGeo = new RoundedBoxGeometry(BAR.len / 2, BAR.h, BAR.d, 2, 1.2);
  const nHalf = new THREE.Mesh(halfGeo, new THREE.MeshStandardMaterial({ name: 'NorthPaint', color: colors.north, roughness: 0.35, metalness: 0.1 }));
  const sHalf = new THREE.Mesh(halfGeo, new THREE.MeshStandardMaterial({ name: 'SouthPaint', color: colors.south, roughness: 0.35, metalness: 0.1 }));
  nHalf.position.x = BAR.len / 4;
  sHalf.position.x = -BAR.len / 4;
  magnet.add(nHalf, sHalf);
  for (const [letter, x] of [
    ['N', BAR.len / 4 + 6],
    ['S', -BAR.len / 4 - 6],
  ]) {
    const top = textMesh(letter, 9, { color: '#ffffff', weight: 700 });
    top.rotation.x = -Math.PI / 2;
    top.position.set(x, BAR.h / 2 + 0.15, 0);
    const front = textMesh(letter, 9, { color: '#ffffff', weight: 700 });
    front.position.set(x, 0, BAR.d / 2 + 0.15);
    const backSide = textMesh(letter, 9, { color: '#ffffff', weight: 700 });
    backSide.rotation.y = Math.PI;
    backSide.position.set(x, 0, -BAR.d / 2 - 0.15);
    magnet.add(top, front, backSide);
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
    hits: [magnetHit, switchHit],
    meshes: { coil, cell, sw, cart },
    points: {
      coil: () => new THREE.Vector3(COIL_X, COIL.y + COIL.flange, 0),
      south: new THREE.Vector3(COIL.x0 + 1.5, 1, COIL.flange * 0.6),
      north: new THREE.Vector3(COIL.x1 - 1.5, 1, COIL.flange * 0.6),
      cell: () => cell.localToWorld(new THREE.Vector3(0, 16.5, 0)),
      switch: () => sw.localToWorld(new THREE.Vector3(10, 16, 0)),
      magnet: () => cart.localToWorld(new THREE.Vector3(0, 19.5 + BAR.h / 2, 0)),
    },
  };
}
