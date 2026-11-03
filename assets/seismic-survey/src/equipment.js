// What stands on the ground (metres, drawn far bigger than life so a phone shows them: the panel says so): the grid
// of geophones (a case on a steel spike pushed into the ground, a cable takeout on top, a band that lights when an
// echo arrives), their cables to the recording truck, the shot hole on the front edge with its charge and firing
// line, the blast's flash and dust, and the probes of the "ত্রিমাত্রিক ছবি" step (from each geophone down to the
// boundaries it mapped). Instanced where things repeat.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { boundaryY, DEPTHS, FRONT, GEOPHONES, ROWS, SOURCE } from './reading.js';

/** The geophone's size (m in the scene): drawn about 150 times bigger than life. */
export const PHONE = { r: 19, h: 50, spike: 46 };
const TRUNK_X = -798; // the main cable runs along the left of the grid, past the truck
/** The recording truck, along the left edge near the front (its model is 330 × 124, drawn 1.45 times that). */
export const TRUCK = { x: -905, z: 205, len: 330, wid: 124, scale: 1.45 };
/** How high the geophone's case stands on its spike (m in the scene), so the spike shows. */
const LIFT = 15;

function tube(points, r, seg = 4) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, Math.max(8, points.length * 6), r, seg, false);
}

export function createEquipment() {
  const root = new THREE.Group();
  root.name = 'equipment';
  const disposables = [];
  const keep = (x) => {
    disposables.push(x);
    return x;
  };
  const M = {
    caseM: keep(new THREE.MeshStandardMaterial({ color: '#f2b705', roughness: 0.45, metalness: 0.05, name: 'geophone-case' })),
    dark: keep(new THREE.MeshStandardMaterial({ color: '#23262b', roughness: 0.55, metalness: 0.1, name: 'rubber' })),
    steel: keep(new THREE.MeshStandardMaterial({ color: '#b9c0c8', roughness: 0.32, metalness: 0.85, name: 'steel' })),
    band: keep(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, metalness: 0, name: 'geophone-light' })),
    cable: keep(new THREE.MeshStandardMaterial({ color: '#2f3a44', roughness: 0.6, name: 'cable' })),
    fire: keep(new THREE.MeshStandardMaterial({ color: '#c92a2a', roughness: 0.55, name: 'firing-line' })),
    body: keep(new THREE.MeshStandardMaterial({ color: '#eef1f4', roughness: 0.5, metalness: 0.15, name: 'truck-body' })),
    cab: keep(new THREE.MeshStandardMaterial({ color: '#1f6fb2', roughness: 0.4, metalness: 0.3, name: 'truck-cab' })),
    glass: keep(new THREE.MeshStandardMaterial({ color: '#1d2a36', roughness: 0.12, metalness: 0.6, name: 'glass' })),
    tyre: keep(new THREE.MeshStandardMaterial({ color: '#1b1c1f', roughness: 0.85, name: 'tyre' })),
    hub: keep(new THREE.MeshStandardMaterial({ color: '#9aa2ab', roughness: 0.35, metalness: 0.8, name: 'hub' })),
    charge: keep(new THREE.MeshStandardMaterial({ color: '#e8590c', roughness: 0.5, emissive: '#000000', name: 'charge' })),
    hole: keep(new THREE.MeshStandardMaterial({ color: '#2b2118', roughness: 1, name: 'hole' })),
    wood: keep(new THREE.MeshStandardMaterial({ color: '#b07b45', roughness: 0.8, name: 'stake' })),
    flag: keep(new THREE.MeshStandardMaterial({ color: '#ff6b00', roughness: 0.6, side: THREE.DoubleSide, name: 'flag' })),
  };

  // ── the geophones ───────────────────────────────────────────────────────────────────────────────────────
  const n = GEOPHONES.length;
  const parts = [];
  function instanced(geo, mat, name, shadow = true) {
    const m = new THREE.InstancedMesh(keep(geo), mat, n);
    m.name = name;
    m.castShadow = shadow;
    const mx = new THREE.Matrix4();
    for (const g of GEOPHONES) m.setMatrixAt(g.i, mx.makeTranslation(g.x, LIFT, g.z));
    m.instanceMatrix.needsUpdate = true;
    root.add(m);
    parts.push(m);
    return m;
  }
  const { r, h, spike } = PHONE;
  // the case: a slightly tapered cylinder with a rounded shoulder, a dark cap with the cable takeout, a base flange
  const casePts = [
    new THREE.Vector2(0, 2),
    new THREE.Vector2(r * 1.15, 2),
    new THREE.Vector2(r * 1.15, 5),
    new THREE.Vector2(r, 6),
    new THREE.Vector2(r * 0.97, h - 6),
    new THREE.Vector2(r * 0.9, h - 2),
    new THREE.Vector2(0, h - 2),
  ];
  instanced(new THREE.LatheGeometry(casePts, 28), M.caseM, 'geophone-case');
  const capGeo = new THREE.CylinderGeometry(r * 0.78, r * 0.86, 7, 24);
  capGeo.translate(0, h + 1.2, 0);
  const takeout = new THREE.CylinderGeometry(2.6, 3.2, 12, 10);
  takeout.rotateZ(Math.PI / 2);
  takeout.translate(r * 0.7, h - 1, 0);
  instanced(mergeGeometries([capGeo, takeout]), M.dark, 'geophone-cap');
  const spikeGeo = new THREE.ConeGeometry(3.4, spike, 12);
  spikeGeo.rotateX(Math.PI);
  spikeGeo.translate(0, -spike / 2 + 2, 0); // from under the case down into the ground
  instanced(spikeGeo, M.steel, 'geophone-spike', false);
  const bandGeo = new THREE.CylinderGeometry(r * 1.0, r * 1.0, 6, 28, 1, true);
  bandGeo.translate(0, h * 0.55, 0);
  const band = instanced(bandGeo, M.band, 'geophone-light', false);
  const BAND_IDLE = new THREE.Color('#3b3f45');
  for (const g of GEOPHONES) band.setColorAt(g.i, BAND_IDLE);
  band.instanceColor.needsUpdate = true;
  const tmpC = new THREE.Color();
  /** Light geophone i in colour hex with strength k (0 … 1). */
  function light(i, hex, k) {
    tmpC.copy(BAND_IDLE);
    if (k > 0) tmpC.lerp(new THREE.Color(hex), Math.min(1, k)).multiplyScalar(1 + 0.6 * k);
    band.setColorAt(i, tmpC);
    band.instanceColor.needsUpdate = true;
  }

  // ── cables: each row to the trunk on the left edge, the trunk to the truck ─────────────────────────────────
  const cableGeos = [];
  const wob = (x, z, k) => Math.sin(x * 0.013 + z * 0.007 + k) * 9;
  for (const z of ROWS) {
    const pts = [];
    for (let x = 760; x >= TRUNK_X; x -= 75) pts.push(new THREE.Vector3(x, 2.5, z + wob(x, z, 1) - 14));
    pts.push(new THREE.Vector3(TRUNK_X, 2.5, z - 30));
    cableGeos.push(tube(pts, 3.2));
  }
  const trunk = [];
  for (let z = ROWS[0] - 20; z >= ROWS.at(-1) - 40; z -= 80) trunk.push(new THREE.Vector3(TRUNK_X + wob(z, 0, 2) * 0.4, 2.5, z));
  cableGeos.push(tube(trunk, 4.2));
  const halfW = (TRUCK.wid / 2) * TRUCK.scale;
  cableGeos.push(
    tube(
      [
        new THREE.Vector3(TRUNK_X, 2.5, TRUCK.z - 40),
        new THREE.Vector3(TRUNK_X - 8, 3, TRUCK.z - 50),
        new THREE.Vector3(TRUCK.x + halfW - 2, 30, TRUCK.z - 60),
      ],
      4.2,
    ),
  );
  const cables = new THREE.Mesh(keep(mergeGeometries(cableGeos)), M.cable);
  cables.name = 'cables';
  cables.receiveShadow = true;
  root.add(cables);
  for (const g of cableGeos) g.dispose();

  // ── the shot hole on the front edge: the hole (cut in half by the face), the charge, a stake with a flag, the
  // firing line to the truck ───────────────────────────────────────────────────────────────────────────────
  const shot = new THREE.Group();
  shot.name = 'shot-hole';
  const holeGeo = keep(new THREE.CylinderGeometry(7, 7, 34, 16, 1, true, -Math.PI / 2, Math.PI));
  holeGeo.rotateY(Math.PI);
  const hole = new THREE.Mesh(holeGeo, M.hole);
  hole.material.side = THREE.DoubleSide;
  hole.position.set(SOURCE.x, -17, FRONT + 0.3);
  const holeTop = new THREE.Mesh(keep(new THREE.CircleGeometry(7.5, 16, 0, Math.PI)), M.hole);
  holeTop.rotation.x = -Math.PI / 2;
  holeTop.position.set(SOURCE.x, 0.6, FRONT);
  const charge = new THREE.Mesh(keep(new THREE.CylinderGeometry(5.2, 5.2, 16, 16)), M.charge);
  charge.position.set(SOURCE.x, SOURCE.y - 4, FRONT - 1);
  const stakeGeo = keep(new THREE.BoxGeometry(5, 80, 5));
  stakeGeo.translate(0, 40, 0);
  const stake = new THREE.Mesh(stakeGeo, M.wood);
  stake.position.set(SOURCE.x + 26, 0, FRONT - 22);
  stake.castShadow = true;
  const flagGeo = keep(new THREE.PlaneGeometry(38, 22));
  flagGeo.translate(19, 0, 0);
  const flag = new THREE.Mesh(flagGeo, M.flag);
  flag.position.set(SOURCE.x + 28.5, 68, FRONT - 22);
  flag.rotation.y = -0.5;
  flag.castShadow = true;
  const front = TRUCK.z + (TRUCK.len / 2) * TRUCK.scale;
  const firePts = [
    new THREE.Vector3(SOURCE.x, 1.5, FRONT - 6),
    new THREE.Vector3(SOURCE.x - 25, 2, FRONT - 50),
    new THREE.Vector3(SOURCE.x - 55, 2, FRONT - 120),
    new THREE.Vector3(TRUCK.x + 20, 2, front + 40),
    new THREE.Vector3(TRUCK.x + 30, 22, front - 8),
  ];
  const fire = new THREE.Mesh(keep(tube(firePts, 2.2)), M.fire);
  fire.name = 'firing-line';
  shot.add(hole, holeTop, charge, stake, flag, fire);
  root.add(shot);

  // ── the recording truck (where the geophones' signals are recorded) ─────────────────────────────────────
  const truck = new THREE.Group();
  truck.name = 'recording-truck';
  const L = TRUCK.len;
  const W = TRUCK.wid;
  const wheelR = 24;
  const chassis = new THREE.Mesh(keep(new THREE.BoxGeometry(L * 0.96, 10, W * 0.7)), M.dark);
  chassis.position.set(0, wheelR + 4, 0);
  const box = new THREE.Mesh(keep(new RoundedBoxGeometry(L * 0.62, 110, W, 3, 6)), M.body);
  box.position.set(-L * 0.17, wheelR + 10 + 55, 0);
  const stripe = new THREE.Mesh(keep(new THREE.BoxGeometry(L * 0.62 + 0.6, 7, W + 0.6)), M.cab);
  stripe.position.set(-L * 0.17, wheelR + 36, 0);
  const cab = new THREE.Mesh(keep(new RoundedBoxGeometry(L * 0.26, 86, W * 0.94, 3, 10)), M.cab);
  cab.position.set(L * 0.33, wheelR + 10 + 43, 0);
  const wind = new THREE.Mesh(keep(new THREE.BoxGeometry(3, 34, W * 0.8)), M.glass);
  wind.position.set(L * 0.33 + L * 0.13 - 0.5, wheelR + 10 + 62, 0);
  wind.rotation.z = -0.18;
  const sideWin = new THREE.Mesh(keep(new THREE.BoxGeometry(L * 0.12, 28, W * 0.95)), M.glass);
  sideWin.position.set(L * 0.35, wheelR + 10 + 62, 0);
  const door = new THREE.Mesh(keep(new THREE.BoxGeometry(L * 0.14, 80, 1.5)), M.dark);
  door.position.set(-L * 0.35, wheelR + 10 + 48, W / 2 + 0.4);
  door.material = M.glass;
  const bumper = new THREE.Mesh(keep(new THREE.BoxGeometry(6, 10, W * 0.96)), M.hub);
  bumper.position.set(L * 0.47, wheelR + 2, 0);
  truck.add(chassis, box, stripe, cab, wind, sideWin, door, bumper);
  const tyreGeo = keep(new THREE.CylinderGeometry(wheelR, wheelR, 20, 24));
  tyreGeo.rotateX(Math.PI / 2);
  const hubGeo = keep(new THREE.CylinderGeometry(wheelR * 0.5, wheelR * 0.5, 21, 16));
  hubGeo.rotateX(Math.PI / 2);
  for (const x of [L * 0.33, -L * 0.2, -L * 0.36])
    for (const s of [-1, 1]) {
      const tyre = new THREE.Mesh(tyreGeo, M.tyre);
      tyre.position.set(x, wheelR, s * (W / 2 - 6));
      const hub = new THREE.Mesh(hubGeo, M.hub);
      hub.position.copy(tyre.position);
      truck.add(tyre, hub);
    }
  truck.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  truck.position.set(TRUCK.x, 0, TRUCK.z);
  truck.rotation.y = -Math.PI / 2; // the cab toward the front
  truck.scale.setScalar(TRUCK.scale);
  root.add(truck);

  // ── the blast: a flash at the charge, dust thrown up from the hole ───────────────────────────────────────
  const fx = new THREE.Group();
  fx.name = 'blast';
  fx.userData.noExport = true;
  const flashMat = keep(new THREE.MeshBasicMaterial({ color: '#ffd43b', transparent: true, opacity: 0, depthWrite: false }));
  const flash = new THREE.Mesh(keep(new THREE.SphereGeometry(1, 20, 14)), flashMat);
  flash.position.set(SOURCE.x, SOURCE.y, FRONT + 3);
  flash.renderOrder = 8;
  const dustMat = keep(new THREE.MeshStandardMaterial({ color: '#b49470', roughness: 1, transparent: true, opacity: 0, depthWrite: false }));
  const DUST = 9;
  const dust = new THREE.InstancedMesh(keep(new THREE.IcosahedronGeometry(1, 1)), dustMat, DUST);
  dust.renderOrder = 7;
  const dustDirs = Array.from({ length: DUST }, (_, i) => {
    const a = (i / DUST) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * 0.5, 1 + (i % 3) * 0.3, Math.sin(a) * 0.5);
  });
  fx.add(flash, dust);
  root.add(fx);
  const mx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sv = new THREE.Vector3();
  const pv = new THREE.Vector3();
  /** The blast at time s (seconds of the slowed animation since the firing): flash, then dust settling. */
  function blast(s) {
    const on = s >= 0 && s < 3;
    fx.visible = on;
    if (!on) {
      M.charge.emissive.set('#000000');
      charge.visible = s < 0;
      return;
    }
    charge.visible = s < 0.1;
    const fk = Math.max(0, 1 - s / 0.5);
    flash.scale.setScalar(10 + 40 * Math.min(1, s / 0.25));
    flashMat.opacity = 0.9 * fk;
    const dk = Math.min(1, s / 1.2);
    dustMat.opacity = 0.75 * Math.max(0, 1 - s / 2.8);
    for (let i = 0; i < DUST; i++) {
      const d = dustDirs[i];
      pv.set(SOURCE.x + d.x * 60 * dk, d.y * 70 * dk + 6, FRONT - 14 + d.z * 40 * dk);
      sv.setScalar(10 + 22 * dk);
      dust.setMatrixAt(i, mx.compose(pv, q, sv));
    }
    dust.instanceMatrix.needsUpdate = true;
  }
  blast(-1);

  // ── the probes of the 3D picture: a thin line from each geophone down, a dot on each boundary it mapped ──
  const probes = new THREE.Group();
  probes.name = 'probes';
  probes.userData.noExport = true;
  const lineMat = keep(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.75, depthWrite: false }));
  const lineGeo = keep(new THREE.CylinderGeometry(2.2, 2.2, 1, 6));
  lineGeo.translate(0, -0.5, 0);
  const sticks = new THREE.InstancedMesh(lineGeo, lineMat, n);
  sticks.renderOrder = 7;
  const dotGeo = keep(new THREE.SphereGeometry(9, 14, 10));
  const dotMat = keep(new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, n * DEPTHS.length);
  dots.renderOrder = 7;
  const ECHO = ['#2b8a3e', '#7048e8', '#d9480f'];
  for (const g of GEOPHONES) for (let k = 0; k < DEPTHS.length; k++) dots.setColorAt(g.i * DEPTHS.length + k, new THREE.Color(ECHO[k]));
  probes.add(sticks, dots);
  probes.visible = false;
  root.add(probes);
  const zero = new THREE.Vector3(0, 0, 0);
  /** Probes grown to fraction k (0 … 1): row by row, each to the deepest boundary, the dots as they are reached. */
  function setProbes(k) {
    probes.visible = k > 0;
    if (!probes.visible) return;
    for (const g of GEOPHONES) {
      const kg = Math.min(1, Math.max(0, k * 1.6 - g.row * 0.15));
      const deep = -boundaryY(2, g.x, g.z);
      const len = deep * kg;
      sticks.setMatrixAt(g.i, mx.compose(pv.set(g.x, 0, g.z), q, sv.set(1, Math.max(0.001, len), 1)));
      for (let b = 0; b < DEPTHS.length; b++) {
        const yb = boundaryY(b, g.x, g.z);
        const on = -yb <= len + 1;
        dots.setMatrixAt(g.i * DEPTHS.length + b, mx.compose(pv.set(g.x, yb, g.z), q, on ? sv.set(1, 1, 1) : zero));
      }
    }
    sticks.instanceMatrix.needsUpdate = true;
    dots.instanceMatrix.needsUpdate = true;
  }

  return {
    root,
    shot,
    charge,
    truck,
    light,
    blast,
    setProbes,
    /** The top of geophone i (for labels and the action's ring). */
    phoneTop: (i, target = new THREE.Vector3()) => target.set(GEOPHONES[i].x, PHONE.h + LIFT + 6, GEOPHONES[i].z),
    dispose() {
      for (const d of disposables) d.dispose?.();
    },
  };
}
