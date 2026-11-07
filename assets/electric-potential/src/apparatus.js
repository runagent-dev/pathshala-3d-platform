// The apparatus, procedural, in metres (the bench top is y = 0; sphere A's centre is at x = 0, height H):
// - sphere A: a polished steel sphere (R = 5 cm) on a clear acrylic rod (an insulating stand) on a heavy iron base,
//   carrying the charge q, drawn as red marks with a white "+" on its surface (one per nC: colour is never the only cue);
// - the test charge q₀: a small red bead with a white "+" that faces the camera, on a thin acrylic rod on a black carriage
//   that slides along a low aluminium rail toward A (the line of চিত্র ১০.১৪);
// - the field lines round A (the book's picture): short gold lines with small arrowheads, pointing out;
// - the equipotential shells: faint violet bubbles (bright at their rims, clear in the middle) at 10, 20 and 30 cm;
// - for 10.6.1: sphere B (the same, uncharged) at 30 cm, a bare copper wire joining the tops, a crow (the book's example; a
//   small model, the grey-necked house crow) that lands on the wire, and an earthing cable from B to a copper earth
//   terminal on the bench and over its edge to the ground;
// - electrons: small blue beads with a white "−" that ride along the wire and the cable.
// Parts of later steps are made here at load (hidden), so the stage's warm-up compiles them before the first tap.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { D_AB, R_SPHERE, SHELLS } from './reading.js';

export const H = 0.135; // the centres' height above the bench (m)
export const R = R_SPHERE;
export const Q0_R = 0.027; // the test charge's bead (m): drawn big enough to see on a phone
export const B_X = D_AB; // sphere B's centre (m)
export const RAIL = { x0: 0.08, x1: 0.345, z: 0, h: 0.008, w: 0.02 };
const CARRIAGE = { w: 0.034, h: 0.016, d: 0.03 };
export const COLORS = { pos: '#e03131', neg: '#1971c2', field: '#ffd43b', shell: '#9775fa' };
const MARK_SLOTS = 10; // + marks per sphere: one per nC of the full charge q

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** Points spread evenly over a sphere (a Fibonacci spiral), between heights y0 and y1 of the unit sphere. */
function spread(n, y0, y1, turn = 0) {
  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = y1 - ((i + 0.5) / n) * (y1 - y0);
    const rr = Math.sqrt(1 - y * y);
    const a = i * golden + turn;
    out.push(V3(Math.cos(a) * rr, y, Math.sin(a) * rr));
  }
  return out;
}

/** A polyline with points evenly spaced by length: getPoint(u, out) for u in 0…1. */
export function polyPath(points) {
  const lens = [0];
  for (let i = 1; i < points.length; i++) lens.push(lens[i - 1] + points[i].distanceTo(points[i - 1]));
  const total = lens[lens.length - 1];
  return {
    length: total,
    getPoint(u, out) {
      const d = Math.min(1, Math.max(0, u)) * total;
      let i = 1;
      while (i < lens.length - 1 && lens[i] < d) i++;
      const seg = lens[i] - lens[i - 1] || 1;
      return out.copy(points[i - 1]).lerp(points[i], (d - lens[i - 1]) / seg);
    },
  };
}

/** A white sign ("+" or "−") as one small flat mesh, lying in the xy plane, facing +z. */
function signGeometry(plus, size, bar) {
  const parts = [new THREE.PlaneGeometry(size, bar)];
  if (plus) parts.push(new THREE.PlaneGeometry(bar, size));
  if (parts.length === 1) return parts[0];
  const pos = [];
  const idx = [];
  let base = 0;
  for (const g of parts) {
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i), p.getZ(i));
    const ix = g.getIndex();
    for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + base);
    base += p.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setIndex(idx);
  out.computeVertexNormals();
  return out;
}

/** The earth sign on the terminal's plate (a 128 px canvas). */
function earthTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c9864f';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#3b2412';
  ctx.fillRect(60, 14, 8, 44);
  ctx.fillRect(22, 58, 84, 8);
  ctx.fillRect(36, 76, 56, 8);
  ctx.fillRect(50, 94, 28, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The earthing cable's green-and-yellow stripes (a 64 × 8 canvas, repeated along the tube). */
function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 8;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8c547';
  ctx.fillRect(0, 0, 64, 8);
  ctx.fillStyle = '#2f8f46';
  ctx.fillRect(0, 0, 32, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 1);
  return tex;
}

/** The shells' look: faint in the middle, brighter toward the rim (a bubble), never hiding what is inside. */
function shellMaterial(color) {
  return new THREE.ShaderMaterial({
    name: 'Equipotential',
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float opacity;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float a = (0.022 + 0.46 * pow(f, 3.0)) * opacity;
        gl_FragColor = vec4(color, a);
      }`,
  });
}

export function createApparatus() {
  const root = new THREE.Group();
  root.name = 'ElectricPotential';

  const mats = {
    steel: new THREE.MeshStandardMaterial({ name: 'SphereSteel', color: '#d6dce3', metalness: 1, roughness: 0.2 }),
    iron: new THREE.MeshStandardMaterial({ name: 'BaseIron', color: '#2b3038', metalness: 0.45, roughness: 0.42 }),
    collar: new THREE.MeshStandardMaterial({ name: 'Collar', color: '#b9c0c8', metalness: 1, roughness: 0.3 }),
    acrylic: new THREE.MeshPhysicalMaterial({
      name: 'AcrylicRod',
      color: '#cfe9ff',
      roughness: 0.05,
      transparent: true,
      opacity: 0.45,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
    rail: new THREE.MeshStandardMaterial({ name: 'RailAluminium', color: '#aeb6bf', metalness: 0.85, roughness: 0.35 }),
    carriage: new THREE.MeshStandardMaterial({ name: 'Carriage', color: '#22262c', metalness: 0.2, roughness: 0.55 }),
    bead: new THREE.MeshStandardMaterial({ name: 'TestCharge', color: COLORS.pos, metalness: 0.3, roughness: 0.32 }),
    mark: new THREE.MeshStandardMaterial({ name: 'PlusMark', color: COLORS.pos, metalness: 0.2, roughness: 0.45 }),
    sign: new THREE.MeshBasicMaterial({ name: 'Sign', color: '#ffffff', toneMapped: false }),
    copper: new THREE.MeshStandardMaterial({ name: 'Copper', color: '#c46f3a', metalness: 1, roughness: 0.3 }),
    cable: new THREE.MeshStandardMaterial({ name: 'EarthCable', map: stripeTexture(), roughness: 0.55 }),
    plate: new THREE.MeshStandardMaterial({ name: 'EarthPlate', map: earthTexture(), metalness: 0.6, roughness: 0.4 }),
    field: new THREE.MeshStandardMaterial({ name: 'FieldLine', color: COLORS.field, emissive: '#7a5c00', roughness: 0.6 }),
    electron: new THREE.MeshStandardMaterial({ name: 'Electron', color: COLORS.neg, emissive: '#0b3a6e', roughness: 0.35 }),
    hit: new THREE.MeshBasicMaterial({ visible: false }),
  };

  // ── a sphere on its insulating stand ──
  const sphereGeo = new THREE.SphereGeometry(R, 64, 40);
  const baseGeo = new THREE.CylinderGeometry(0.04, 0.044, 0.014, 40);
  const collarGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.01, 20);
  const rodGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 1, 16);
  const cupGeo = new THREE.CylinderGeometry(0.012, 0.008, 0.008, 24);
  function sphereOnStand(name, x, own) {
    const g = new THREE.Group();
    g.name = name;
    const m = own ? Object.fromEntries(['steel', 'iron', 'collar', 'acrylic'].map((k) => [k, mats[k].clone()])) : mats;
    if (own) for (const k of ['steel', 'iron', 'collar']) m[k].transparent = true; // B fades in (always transparent: no recompile)
    const base = new THREE.Mesh(baseGeo, m.iron);
    base.position.y = 0.007;
    const collar = new THREE.Mesh(collarGeo, m.collar);
    collar.position.y = 0.019;
    const rodTop = H - R + 0.002;
    const rod = new THREE.Mesh(rodGeo, m.acrylic);
    rod.scale.y = rodTop - 0.02;
    rod.position.y = 0.02 + (rodTop - 0.02) / 2;
    const cup = new THREE.Mesh(cupGeo, m.collar);
    cup.position.y = H - R + 0.002;
    const sphere = new THREE.Mesh(sphereGeo, m.steel);
    sphere.name = `${name}Sphere`;
    sphere.position.y = H;
    for (const p of [base, sphere]) p.castShadow = true;
    g.add(base, collar, rod, cup, sphere);
    g.position.x = x;
    return { group: g, sphere, mats: own ? Object.values(m) : [] };
  }
  const A = sphereOnStand('SphereA', 0, false);
  const B = sphereOnStand('SphereB', B_X, true);
  B.group.visible = false;
  root.add(A.group, B.group);

  // ── the + marks: on each sphere's surface, facing out ──
  const discGeo = new THREE.CircleGeometry(0.0105, 20);
  const plusGeo = signGeometry(true, 0.0136, 0.0034);
  // the first slots face the guided camera: a sphere with five marks shows them
  const toViewer = V3(-0.36, 0.31, 0.88);
  const facing = (a, b) => b.dot(toViewer) - a.dot(toViewer);
  const slotsA = spread(MARK_SLOTS, -0.55, 0.62, 0.3).sort(facing);
  const slotsB = spread(MARK_SLOTS, -0.55, 0.62, 1.4).sort(facing);
  const markMat = mats.mark;
  const signMat = mats.sign;
  function marks(name, slots, cx) {
    const disc = new THREE.InstancedMesh(discGeo, markMat, slots.length);
    const plus = new THREE.InstancedMesh(plusGeo, signMat, slots.length);
    disc.name = `${name}Marks`;
    plus.name = `${name}Signs`;
    const o = new THREE.Object3D();
    slots.forEach((n, i) => {
      const at = V3(cx, H, 0).addScaledVector(n, R + 0.0007);
      o.position.copy(at);
      o.lookAt(at.clone().add(n));
      o.updateMatrix();
      disc.setMatrixAt(i, o.matrix);
      o.position.copy(V3(cx, H, 0).addScaledVector(n, R + 0.0014));
      o.updateMatrix();
      plus.setMatrixAt(i, o.matrix);
    });
    disc.count = 0;
    plus.count = 0;
    // these start empty: a bounding sphere worked out now would be empty for good, and three would cull them
    disc.frustumCulled = false;
    plus.frustumCulled = false;
    return { disc, plus, set: (n) => (disc.count = plus.count = Math.max(0, Math.min(slots.length, n))) };
  }
  const marksA = marks('A', slotsA, 0);
  const marksB = marks('B', slotsB, B_X);
  root.add(marksA.disc, marksA.plus, marksB.disc, marksB.plus);

  // ── the rail and the test charge q₀ on its carriage ──
  const railLen = RAIL.x1 - RAIL.x0;
  const rail = new THREE.Mesh(new THREE.BoxGeometry(railLen, RAIL.h, RAIL.w), mats.rail);
  rail.name = 'Rail';
  rail.position.set((RAIL.x0 + RAIL.x1) / 2, RAIL.h / 2, RAIL.z);
  rail.receiveShadow = true;
  const railMats = [mats.rail.clone()];
  rail.material = railMats[0];
  railMats[0].transparent = true;
  const q0 = new THREE.Group();
  q0.name = 'TestCharge';
  const q0Mats = [mats.carriage, mats.acrylic, mats.bead].map((m) => m.clone());
  for (const m of q0Mats) m.transparent = true;
  const [carMat, rodMat, beadMat] = q0Mats;
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(CARRIAGE.w, CARRIAGE.h, CARRIAGE.d), carMat);
  carriage.position.y = RAIL.h + CARRIAGE.h / 2;
  carriage.castShadow = true;
  const q0RodTop = H - Q0_R + 0.002;
  const q0Rod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 1, 12), rodMat);
  q0Rod.scale.y = q0RodTop - (RAIL.h + CARRIAGE.h);
  q0Rod.position.y = RAIL.h + CARRIAGE.h + q0Rod.scale.y / 2;
  const bead = new THREE.Mesh(new THREE.SphereGeometry(Q0_R, 32, 20), beadMat);
  bead.name = 'TestChargeBead';
  bead.position.y = H;
  bead.castShadow = true;
  // its "+", turned to the camera every frame (faceCamera)
  const q0Sign = new THREE.Mesh(signGeometry(true, Q0_R * 1.15, Q0_R * 0.3), mats.sign);
  q0Sign.renderOrder = 3;
  // a finger's target round the carriage, the rod and the bead
  const q0Hit = new THREE.Mesh(new THREE.BoxGeometry(0.06, H + 0.03, 0.06), mats.hit);
  q0Hit.position.y = (H + 0.03) / 2;
  q0Hit.userData.noExport = true;
  q0.add(carriage, q0Rod, bead, q0Hit);
  root.add(rail, q0, q0Sign);

  // ── the field lines round A: short gold lines with arrowheads, pointing out (not along the rail's line) ──
  // (and none straight at the camera, where a line would hide the + marks and read as a dot)
  const dirs = spread(18, -0.5, 0.95, 0.9).filter((d) => d.x < 0.9 && d.dot(V3(-0.36, 0.31, 0.88)) < 0.72);
  const lineGeo = new THREE.CylinderGeometry(0.0015, 0.0015, 1, 6);
  lineGeo.translate(0, 0.5, 0);
  const headGeo = new THREE.ConeGeometry(0.0056, 0.015, 10);
  const lines = new THREE.InstancedMesh(lineGeo, mats.field, dirs.length);
  const heads = new THREE.InstancedMesh(headGeo, mats.field, dirs.length);
  lines.name = 'FieldLines';
  heads.name = 'FieldArrowheads';
  {
    const o = new THREE.Object3D();
    const up = V3(0, 1, 0);
    const r0 = R + 0.006;
    const len = 0.075;
    dirs.forEach((d, i) => {
      o.quaternion.setFromUnitVectors(up, d);
      o.position.set(0, H, 0).addScaledVector(d, r0);
      o.scale.set(1, len, 1);
      o.updateMatrix();
      lines.setMatrixAt(i, o.matrix);
      o.position.set(0, H, 0).addScaledVector(d, r0 + len * 0.62);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      heads.setMatrixAt(i, o.matrix);
    });
  }
  const field = new THREE.Group();
  field.name = 'Field';
  field.add(lines, heads);
  root.add(field);

  // ── the equipotential shells (cut at the bench) ──
  const shellMats = SHELLS.map(() => shellMaterial(COLORS.shell)); // one each: the 300 V shell outlasts the others
  const shells = SHELLS.map((cm, i) => {
    const r = cm / 100;
    const theta = Math.acos(Math.max(-1, -H / r));
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 56, 28, 0, Math.PI * 2, 0, theta), shellMats[i]);
    m.name = `Equipotential${cm}`;
    m.position.y = H;
    m.renderOrder = 5;
    m.userData.noExport = true;
    m.visible = false;
    root.add(m);
    return m;
  });

  // ── the wire from A's top to B's top (drawn on by its draw range) ──
  const wireCurve = new THREE.QuadraticBezierCurve3(V3(0.004, H + R - 0.002, 0), V3(B_X / 2, H + R + 0.095, 0), V3(B_X - 0.004, H + R - 0.002, 0));
  const WIRE_SEG = 64;
  const WIRE_RAD = 8;
  const wireGeo = new THREE.TubeGeometry(wireCurve, WIRE_SEG, 0.0022, WIRE_RAD, false);
  const wire = new THREE.Mesh(wireGeo, mats.copper);
  wire.name = 'Wire';
  wire.castShadow = true;
  wire.visible = false;
  root.add(wire);

  // ── the crow on the wire (forward is +x before it is turned; a small model, its feet at the group's origin) ──
  const crow = new THREE.Group();
  crow.name = 'Crow';
  {
    const part = (geo, pos, scale = [1, 1, 1], tilt = 0) => {
      const quat = new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), tilt);
      return geo.applyMatrix4(new THREE.Matrix4().compose(V3(pos[0], pos[1], pos[2]), quat, V3(scale[0], scale[1], scale[2])));
    };
    const ball = () => new THREE.SphereGeometry(1, 16, 12);
    const black = mergeGeometries([
      part(ball(), [0, 0.034, 0], [0.031, 0.02, 0.019], 0.38), // the body
      part(ball(), [0.036, 0.061, 0], [0.0135, 0.0125, 0.012]), // the head
      part(ball(), [-0.047, 0.018, 0], [0.032, 0.0035, 0.01], 0.45), // the tail
      part(ball(), [-0.007, 0.036, 0.0185], [0.029, 0.0125, 0.004], 0.42), // the wings
      part(ball(), [-0.007, 0.036, -0.0185], [0.029, 0.0125, 0.004], 0.42),
      part(new THREE.ConeGeometry(0.0052, 0.024, 10).rotateZ(-Math.PI / 2), [0.056, 0.059, 0]), // the beak
      part(new THREE.CylinderGeometry(0.0017, 0.0017, 0.018, 6), [0.002, 0.01, 0.007]), // the legs
      part(new THREE.CylinderGeometry(0.0017, 0.0017, 0.018, 6), [0.002, 0.01, -0.007]),
    ]);
    const grey = part(ball(), [0.023, 0.05, 0], [0.0165, 0.0165, 0.0155], 0.5); // the house crow's grey neck
    const blackMesh = new THREE.Mesh(
      black,
      new THREE.MeshStandardMaterial({ name: 'CrowBlack', color: '#14161b', roughness: 0.38, metalness: 0.15 }),
    );
    const greyMesh = new THREE.Mesh(grey, new THREE.MeshStandardMaterial({ name: 'CrowGrey', color: '#6d7178', roughness: 0.7 }));
    blackMesh.castShadow = true;
    crow.add(blackMesh, greyMesh);
  }
  crow.rotation.y = -1.0; // facing the viewer and a little to the right
  crow.visible = false;
  crow.userData.noExport = true;
  root.add(crow);
  const crowAt = wireCurve.getPoint(0.5);

  // ── the earth: a copper terminal plate on the bench with the earth sign, and a cable from B over the bench's edge ──
  const TERM = V3(0.41, 0, 0.09);
  const terminal = new THREE.Group();
  terminal.name = 'EarthTerminal';
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.005, 0.044), [
    mats.copper,
    mats.copper,
    mats.plate,
    mats.copper,
    mats.copper,
    mats.copper,
  ]);
  plate.position.set(TERM.x, 0.0025, TERM.z);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.014, 12), mats.copper);
  post.position.set(TERM.x - 0.014, 0.012, TERM.z - 0.014);
  terminal.add(plate, post);
  terminal.visible = false;
  root.add(terminal);
  const cablePts = [
    V3(B_X + R - 0.001, H, 0),
    V3(B_X + R + 0.03, H - 0.03, 0.012),
    V3(TERM.x - 0.012, 0.06, TERM.z - 0.03),
    V3(TERM.x - 0.014, 0.02, TERM.z - 0.014),
    V3(TERM.x + 0.004, 0.012, TERM.z + 0.02),
    V3(TERM.x + 0.01, 0.006, 0.168),
    V3(TERM.x + 0.012, -0.012, 0.176),
    V3(TERM.x + 0.014, -0.16, 0.18),
  ];
  const cableCurve = new THREE.CatmullRomCurve3(cablePts, false, 'centripetal');
  const CABLE_SEG = 96;
  const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, CABLE_SEG, 0.0028, 8, false), mats.cable);
  cable.name = 'EarthCable';
  cable.visible = false;
  root.add(cable);

  // draw a tube on, from its start (k = 0 … 1)
  function drawOn(mesh, seg, rad, k, reverse = false) {
    const n = Math.round(Math.min(1, Math.max(0, k)) * seg);
    const per = rad * 6;
    mesh.visible = n > 0;
    if (reverse) mesh.geometry.setDrawRange((seg - n) * per, n * per);
    else mesh.geometry.setDrawRange(0, n * per);
  }

  // ── the electrons' paths (sampled from the curves, a little out from the wire and the spheres) ──
  const S = (curve, n, from = 0, to = 1) => {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(curve.getPoint(from + ((to - from) * i) / n));
    return out;
  };
  const wireBack = S(wireCurve, 40).reverse(); // B's top → A's top
  const lift = (pts, dy) => pts.map((p) => p.clone().setY(p.y + dy));
  const overB = [];
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2);
    overB.push(V3(B_X + (R + 0.006) * Math.cos(a), H + (R + 0.006) * Math.sin(a), 0));
  }
  const cableUp = S(cableCurve, 60).reverse(); // the ground → B's side
  const paths = {
    join: polyPath([V3(B_X, H + R + 0.006, 0), ...lift(wireBack, 0.001), V3(0, H + R + 0.006, 0)]),
    toB: polyPath(cableUp),
    toA: polyPath([...cableUp, ...overB, ...lift(wireBack, 0.001), V3(0, H + R + 0.006, 0)]),
  };

  // ── electrons ──
  const MAX_E = 10;
  const eBeads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0085, 16, 12), mats.electron, MAX_E);
  const eSigns = new THREE.InstancedMesh(signGeometry(false, 0.0105, 0.0026), mats.sign, MAX_E);
  eBeads.name = 'Electrons';
  eSigns.name = 'ElectronSigns';
  eSigns.renderOrder = 4;
  eBeads.count = 0;
  eSigns.count = 0;
  eBeads.userData.noExport = true;
  eSigns.userData.noExport = true;
  eBeads.frustumCulled = false;
  eSigns.frustumCulled = false;
  root.add(eBeads, eSigns);
  const tmpO = new THREE.Object3D();
  const toCam = new THREE.Vector3();
  /** Places the first `count` of these electrons (Vector3s), each "−" turned to the camera. */
  function setElectrons(points, count, camera) {
    const n = Math.min(MAX_E, count);
    for (let i = 0; i < n; i++) {
      tmpO.position.copy(points[i]);
      tmpO.quaternion.identity();
      tmpO.scale.set(1, 1, 1);
      tmpO.updateMatrix();
      eBeads.setMatrixAt(i, tmpO.matrix);
      toCam.copy(camera.position).sub(points[i]).normalize();
      tmpO.position.copy(points[i]).addScaledVector(toCam, 0.0088);
      tmpO.quaternion.copy(camera.quaternion);
      tmpO.updateMatrix();
      eSigns.setMatrixAt(i, tmpO.matrix);
    }
    eBeads.count = n;
    eSigns.count = n;
    eBeads.instanceMatrix.needsUpdate = true;
    eSigns.instanceMatrix.needsUpdate = true;
  }

  /** Sets the opacity of a list of materials (all made transparent at load, so nothing recompiles). */
  function fade(list, k) {
    for (const m of list) m.opacity = (m.userData.base ?? (m.userData.base = m.opacity)) * k;
  }

  return {
    root,
    A,
    B,
    marksA,
    marksB,
    rail,
    q0,
    q0Sign,
    q0Hit,
    bead,
    field,
    fieldMats: [mats.field],
    shells,
    shellMats,
    wire,
    crow,
    crowAt,
    cable,
    terminal,
    term: TERM,
    paths,
    wireCurve,
    eBeads,
    eSigns,
    setElectrons,
    /** k: 0 … 1 of each tube drawn on. */
    setWire: (k) => drawOn(wire, WIRE_SEG, WIRE_RAD, k),
    setCable: (k) => drawOn(cable, CABLE_SEG, 8, k),
    /** The crow flies in from above and to the right (0: away, hidden; 1: on the wire). */
    setCrow(k) {
      crow.visible = k > 0.01;
      const u = 1 - k;
      crow.position.set(crowAt.x + 0.2 * u, crowAt.y + 0.28 * u, crowAt.z + 0.06 * u);
    },
    /** The test charge with its carriage, rod and rail, faded (0 … 1). */
    setQ0Fade(k) {
      fade([...q0Mats, ...railMats], k);
      q0.visible = rail.visible = q0Sign.visible = k > 0.01;
    },
    setBFade(k) {
      fade(B.mats, k);
      B.group.visible = k > 0.01;
    },
    /** Moves the test charge to r cm from A's centre. */
    setR(rCm) {
      q0.position.x = rCm / 100;
    },
    /** Turns the test charge's "+" to the camera. */
    faceCamera(camera) {
      q0Sign.position.set(q0.position.x, H, 0);
      toCam.copy(camera.position).sub(q0Sign.position).normalize();
      q0Sign.position.addScaledVector(toCam, Q0_R + 0.0008);
      q0Sign.quaternion.copy(camera.quaternion);
    },
    hitMeshes: [q0Hit],
  };
}
