// Procedural 3D screw gauge, in millimetres. The screw axis is +x; the scales face the viewer (+z).
// The anvil face is at x = 0 and the spindle face at x = gap. One turn of the thimble moves it 1 mm
// (the pitch); its circular scale has 100 parts. Instanced ticks so the reading marks can be coloured.
import * as THREE from 'three';
import { textMesh, INK } from '@shared/student/materials.js';
import { PITCH, DIVISIONS, RANGE, read } from './reading.js';

export const DIM = {
  axisR: 3.2, // anvil and spindle
  sleeveR: 4.8,
  thimbleR: 8, // like a real 0–25 mm gauge: ~17 mm across, so the 100 parts are not too fine
  zeroX: 43, // the linear scale's 0, where the thimble edge sits when the gap is 0
  sleeveEnd: 71,
  thimbleLen: 30,
  ratchetLen: 10,
  frameZ: 4, // half the frame's thickness
};

export const HIGHLIGHT = {
  lin: new THREE.Color('#1c6fd9'), // the linear-scale mark that is read (L)
  cir: new THREE.Color('#d9480f'), // the circular-scale division on the datum line (C)
};

const X_AXIS = new THREE.Euler(0, 0, -Math.PI / 2); // cylinders are built along y; this lays them along x

function cylinderX(r0, r1, len, mat, segs = 64) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, segs), mat);
  m.rotation.copy(X_AXIS); // after the rotation, the bottom (r0) points to −x and the top (r1) to +x
  return m;
}

export function createGauge({ materials: M, text = {} }) {
  const root = new THREE.Group();
  root.name = 'ScrewGauge';
  const num = text.digits || ((x) => String(x));
  const mm = text.mm || 'mm';

  // ── fixed parts ─────────────────────────────────────────────────────────────
  const fixed = new THREE.Group();
  fixed.name = 'Fixed';
  root.add(fixed);

  const enamel = new THREE.MeshPhysicalMaterial({ name: 'Enamel', color: 0x3a4552, roughness: 0.55, clearcoat: 0.45, clearcoatRoughness: 0.35 });
  const s = new THREE.Shape();
  s.moveTo(-17, 6);
  s.lineTo(-6.5, 6);
  s.lineTo(-6.5, -17);
  s.quadraticCurveTo(-6.5, -29, 6, -29);
  s.lineTo(18, -29);
  s.quadraticCurveTo(30, -29, 30, -17);
  s.lineTo(30, 6);
  s.lineTo(41, 6);
  s.lineTo(41, -19);
  s.quadraticCurveTo(41, -42, 18, -42);
  s.lineTo(6, -42);
  s.quadraticCurveTo(-17, -42, -17, -19);
  s.closePath();
  const frameGeo = new THREE.ExtrudeGeometry(s, {
    depth: DIM.frameZ * 2 - 1.2,
    bevelEnabled: true,
    bevelThickness: 0.6,
    bevelSize: 0.6,
    bevelSegments: 3,
    curveSegments: 24,
  });
  const frame = new THREE.Mesh(frameGeo, enamel);
  frame.position.z = -DIM.frameZ + 0.6;
  frame.name = 'Frame';
  fixed.add(frame);
  // range and least count, printed on the frame like a real one
  const t1 = textMesh(`${num('0')}–${num(String(RANGE))} ${mm}`, 3, { color: '#e9edf2', weight: 600 });
  t1.position.set(12, -35.2, DIM.frameZ + 0.02);
  const t2 = textMesh(`${num('0.01')} ${mm}`, 2.6, { color: '#e9edf2', weight: 500 });
  t2.position.set(12, -38.8, DIM.frameZ + 0.02);
  fixed.add(t1, t2);

  const anvil = cylinderX(DIM.axisR, DIM.axisR, 11, M.satin);
  anvil.position.x = -5.5;
  anvil.name = 'Anvil';
  fixed.add(anvil);
  // the boss on the right arm that the spindle runs through
  const boss = cylinderX(5.4, 5.4, 11, M.satin);
  boss.position.x = 35.5;
  fixed.add(boss);
  // lock lever on top of the right arm
  const lock = new THREE.Group();
  lock.position.set(34, 6.2, 0);
  const lockStem = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 3.4, 20), M.chrome);
  lockStem.position.y = 1.7;
  const lockKnob = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 2.2, 28), M.knurl);
  lockKnob.position.y = 4.2;
  lock.add(lockStem, lockKnob);
  fixed.add(lock);

  const sleeve = cylinderX(DIM.sleeveR, DIM.sleeveR, DIM.sleeveEnd - 41, M.satin);
  sleeve.position.x = (41 + DIM.sleeveEnd) / 2;
  sleeve.name = 'Sleeve';
  fixed.add(sleeve);

  // Linear scale on the sleeve: the datum line, a mark every millimetre above it, numbers every 5 mm.
  const R = DIM.sleeveR + 0.03;
  const darkInk = M.ink.clone(); // the shared ink is white: instanced marks colour it per mark
  darkInk.color.copy(INK);
  const datum = new THREE.Mesh(new THREE.BoxGeometry(DIM.sleeveEnd - 41.5, 0.13, 0.06), darkInk);
  datum.position.set((41.5 + DIM.sleeveEnd) / 2, 0, R);
  datum.name = 'Datum';
  fixed.add(datum);
  const linCount = RANGE + 1;
  const linTicks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 1, 0.06), M.ink.clone(), linCount);
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  for (let k = 0; k < linCount; k++) {
    const h = k % 5 === 0 ? 1.9 : 1.25;
    const beta = Math.asin(h / 2 / R); // follow the round sleeve
    tmpQ.setFromEuler(tmpE.set(-beta, 0, 0));
    tmpM.compose(new THREE.Vector3(DIM.zeroX + k, R * Math.sin(beta), R * Math.cos(beta)), tmpQ, new THREE.Vector3(1, h, 1));
    linTicks.setMatrixAt(k, tmpM);
    linTicks.setColorAt(k, INK);
  }
  linTicks.instanceColor.needsUpdate = true;
  fixed.add(linTicks);
  for (let k = 0; k <= RANGE; k += 5) {
    const label = textMesh(num(String(k)), 1.7, { weight: 600 });
    const beta = Math.asin(3.1 / R);
    label.position.set(DIM.zeroX + k, R * Math.sin(beta), R * Math.cos(beta) + 0.01);
    label.rotation.x = -beta;
    fixed.add(label);
  }

  // ── moving parts: spindle, thimble with the circular scale, ratchet ─────────
  const moving = new THREE.Group();
  moving.name = 'Moving';
  root.add(moving);
  const spindle = cylinderX(DIM.axisR, DIM.axisR, 48, M.chrome);
  spindle.position.x = 24;
  spindle.name = 'Spindle';
  moving.add(spindle);

  const thimble = new THREE.Group(); // rotates about x
  thimble.position.x = DIM.zeroX;
  thimble.name = 'Thimble';
  moving.add(thimble);
  const TR = DIM.thimbleR;
  const bevel = cylinderX(DIM.sleeveR + 0.35, TR, 1.4, M.satin);
  bevel.position.x = 0.7;
  const body = cylinderX(TR, TR, 19, M.satin);
  body.position.x = 1.4 + 9.5;
  const grip = cylinderX(TR + 0.25, TR + 0.25, 8.4, M.knurl);
  grip.position.x = 20.4 + 4.2;
  const back = cylinderX(TR, 5.4, 1.2, M.satin);
  back.position.x = 29.4;
  thimble.add(bevel, body, grip, back);

  // Circular scale: 100 parts; longer marks every 5, numbers every 10. Division k sits k × 3.6° below the
  // datum when the thimble is at 0, so turning the thimble by one part brings the next one up to the line.
  const cirTicks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.11, 0.06), M.ink.clone(), DIVISIONS);
  const rr = TR + 0.03;
  for (let k = 0; k < DIVISIONS; k++) {
    const len = k % 10 === 0 ? 2.6 : k % 5 === 0 ? 2.1 : 1.45;
    const phi = (k / DIVISIONS) * Math.PI * 2;
    tmpQ.setFromEuler(tmpE.set(phi, 0, 0));
    tmpM.compose(new THREE.Vector3(1.4 + len / 2, -rr * Math.sin(phi), rr * Math.cos(phi)), tmpQ, new THREE.Vector3(len, 1, 1));
    cirTicks.setMatrixAt(k, tmpM);
    cirTicks.setColorAt(k, INK);
  }
  cirTicks.instanceColor.needsUpdate = true;
  thimble.add(cirTicks);
  for (let k = 0; k < DIVISIONS; k += 10) {
    const phi = (k / DIVISIONS) * Math.PI * 2;
    const label = textMesh(num(String(k)), 1.7, { weight: 600 });
    label.position.set(5.2, -(rr + 0.01) * Math.sin(phi), (rr + 0.01) * Math.cos(phi));
    label.rotation.x = phi;
    thimble.add(label);
  }

  const ratchet = new THREE.Group(); // turns with the thimble; clicks when the spindle meets the object
  ratchet.position.x = DIM.zeroX + DIM.thimbleLen;
  const rNeck = cylinderX(4, 4, 1.6, M.satin);
  rNeck.position.x = 0.8;
  const rKnob = cylinderX(5, 5, 7, M.knurl);
  rKnob.position.x = 1.6 + 3.5;
  const rCap = cylinderX(5, 4.2, 1, M.chrome);
  rCap.position.x = 9.1;
  ratchet.add(rNeck, rKnob, rCap);
  moving.add(ratchet);

  // ── state ───────────────────────────────────────────────────────────────────
  const state = { gap: 0, lin: -1, cir: -1, slip: 0 };

  function setGap(g) {
    state.gap = g;
    moving.position.x = g;
    const turn = (g / PITCH) * Math.PI * 2;
    thimble.rotation.x = -turn;
    ratchet.rotation.x = -turn - state.slip;
  }

  /** The ratchet slips: it turns on its own while the screw stays put (pressing on the object). */
  function slip(angle) {
    state.slip += angle;
    ratchet.rotation.x = thimble.rotation.x - state.slip;
  }

  function mark(mesh, index, color) {
    if (index < 0) return;
    mesh.setColorAt(index, color);
    mesh.instanceColor.needsUpdate = true;
  }

  /** Colour the marks that are read (L on the sleeve, C on the thimble), or clear them. */
  function highlight(on) {
    mark(linTicks, state.lin, INK);
    mark(cirTicks, state.cir, INK);
    state.lin = state.cir = -1;
    if (!on) return;
    const r = read(state.gap);
    state.lin = Math.min(RANGE, Math.round(r.L / PITCH));
    state.cir = r.C;
    mark(linTicks, state.lin, HIGHLIGHT.lin);
    mark(cirTicks, state.cir, HIGHLIGHT.cir);
  }

  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    root,
    fixed,
    moving,
    thimble,
    ratchet,
    lock,
    state,
    setGap,
    slip,
    highlight,
    pickMoving: [thimble, ratchet, spindle],
    points: {
      /** Where the reading is taken: the thimble edge on the datum line. */
      reading: () => root.localToWorld(v(DIM.zeroX + state.gap + 2.6, 0.4, DIM.thimbleR)),
      /** A point on the front of the moving part, x mm from the thimble's edge, on a surface of radius r. */
      movingFront: (x, y, r = DIM.thimbleR) => root.localToWorld(v(DIM.zeroX + state.gap + x, y, Math.sqrt(Math.max(0, r * r - y * y)))),
    },
  };
}
