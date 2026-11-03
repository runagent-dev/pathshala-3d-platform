// The apparatus, in metres (the bench top is y = 0), procedural three.js and real lab sizes: a retort stand (a heavy
// enamelled base, a chrome rod, a boss head and a horizontal arm), an open-coil steel spring hanging on the arm by its
// top loop (30 turns of 2.2 mm wire, 22 mm across, a 100 mm body unloaded; its coils open as it stretches and bunch,
// never quite touching, as it is squeezed: the wire is rebuilt in place every frame, never scaled, so it keeps its
// round section), a hanger with a
// hook, a base plate and a pointer, carrying 1, 2 or 4 slotted brass masses of 250 g, and a metre rule in cm behind
// the mass. The teak bench under it all.
import * as THREE from 'three';

/** The spring. */
export const SPRING = {
  R: 0.011, // coil radius (to the wire's centre)
  r: 0.0011, // the wire's radius
  turns: 30,
  perTurn: 20,
  sides: 8,
};
SPRING.solid = SPRING.turns * 2 * SPRING.r; // the body's length with the coils touching
SPRING.L0 = 0.1; // the body's length unloaded
/** The stand, the rule and the spring are turned this much about the spring's axis (the bench is not). */
export const YAW = THREE.MathUtils.degToRad(25);
/** The arm the spring hangs on (its centre line, y). */
export const ARM_Y = 0.42;
const ARM_R = 0.0042;
const HOOK_R = 0.0012; // the hanger's hook wire
/** One slotted mass. */
export const DISC = { R: 0.032, h: 0.011, gap: 0.0006, kg: 0.25 };
/** Below the hanger's hook: the rod, then the base plate the discs sit on. */
export const HANGER = { rodTop: -0.028, plateTop: -0.078, plateH: 0.004, plateR: 0.027 };
/** The metre rule behind the mass (left, a little back). */
export const RULE = { x: -0.072, z: -0.026, w: 0.032, top: ARM_Y - 0.012, length: 0.4 };
const ROD = { x: -0.104, z: -0.034, r: 0.0062 };

// ── the spring's wire ───────────────────────────────────────────────────────

/** The heights along the spring for the arm's centre at ARM_Y: where the body starts. */
const TOP_LOOP_C = ARM_Y + SPRING.r + ARM_R - SPRING.R; // the top loop's centre (it sits on the arm)
const BODY_TOP = TOP_LOOP_C - SPRING.R - 2 * SPRING.r;
/** From the hanger's origin (its hook's contact) up to the body's lower end. */
const BELOW_BODY = 2 * SPRING.r + 2 * SPRING.R + SPRING.r + HOOK_R;

/** The hanger's origin (y) for a body length Lb. */
export const hangerY = (Lb) => BODY_TOP - Lb - BELOW_BODY;

/** Fills `pts` (Vector3s) with the wire's centre line for a body length Lb; returns how many were used. */
function centreLine(pts, Lb) {
  const { R, r, turns, perTurn } = SPRING;
  let n = 0;
  const put = (x, y, z) => pts[n++].set(x, y, z);
  // the top loop, in the y–z plane round the arm (a full turn from its lowest point, ends offset so it never cuts itself)
  const LOOP = 28;
  for (let i = 0; i <= LOOP; i++) {
    const psi = (i / LOOP) * Math.PI * 2;
    put(-r * 1.05 + (2.1 * r * i) / LOOP, TOP_LOOP_C - R * Math.cos(psi), R * Math.sin(psi));
  }
  // down into the first coil: a short bend from the loop's foot (heading +z) to the coil (heading +z)
  bend(put, [r * 1.05, TOP_LOOP_C - R, 0], [R, BODY_TOP, 0], [0, 0, 1], [0, 0, 1], R * 0.6, 6);
  // the body: a helix
  const steps = turns * perTurn;
  for (let i = 1; i <= steps; i++) {
    const th = (i / steps) * turns * Math.PI * 2;
    put(R * Math.cos(th), BODY_TOP - (Lb * i) / steps, R * Math.sin(th));
  }
  // out of the last coil into the bottom loop (in the x–y plane), heading +x at its top
  const yE = BODY_TOP - Lb;
  const cy = yE - 2 * r - R;
  bend(put, [R, yE, 0], [0, cy + R, r * 1.05], [0, 0, 1], [1, 0, 0], R * 0.6, 6);
  for (let i = 1; i <= LOOP; i++) {
    const psi = (i / LOOP) * Math.PI * 2;
    put(R * Math.sin(psi), cy + R * Math.cos(psi), r * 1.05 - (2.1 * r * i) / LOOP);
  }
  return n;
}
const B0 = new THREE.Vector3();
const B1 = new THREE.Vector3();
const B2 = new THREE.Vector3();
const B3 = new THREE.Vector3();
/** A cubic bend from a (tangent ta) to b (tangent tb), `n` points after a, b included. */
function bend(put, a, b, ta, tb, d, n) {
  B0.fromArray(a);
  B3.fromArray(b);
  B1.fromArray(ta).multiplyScalar(d).add(B0);
  B2.fromArray(tb).multiplyScalar(-d).add(B3);
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const v = 1 - u;
    put(
      v * v * v * B0.x + 3 * v * v * u * B1.x + 3 * v * u * u * B2.x + u * u * u * B3.x,
      v * v * v * B0.y + 3 * v * v * u * B1.y + 3 * v * u * u * B2.y + u * u * u * B3.y,
      v * v * v * B0.z + 3 * v * v * u * B1.z + 3 * v * u * u * B2.z + u * u * u * B3.z,
    );
  }
}

/** The wire: a tube round the centre line, built once; `setLength(Lb)` moves its vertices in place. */
function createWire(material) {
  const { sides } = SPRING;
  const MAX = 29 + 6 + SPRING.turns * SPRING.perTurn + 6 + 28 + 4;
  const pts = Array.from({ length: MAX }, () => new THREE.Vector3());
  const count = centreLine(pts, SPRING.L0);
  const ring = sides + 1;
  const pos = new Float32Array(count * ring * 3);
  const nor = new Float32Array(count * ring * 3);
  const index = [];
  for (let i = 0; i < count - 1; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * ring + j;
      const b = (i + 1) * ring + j;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setIndex(index);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = 'SpringWire';
  mesh.frustumCulled = false;
  const T = new THREE.Vector3();
  const Nn = new THREE.Vector3();
  const Bn = new THREE.Vector3();
  const prevT = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  function setLength(Lb) {
    centreLine(pts, Lb);
    const r = SPRING.r;
    for (let i = 0; i < count; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(count - 1, i + 1)];
      T.subVectors(b, a).normalize();
      if (i === 0) {
        Nn.set(0, 1, 0).addScaledVector(T, -T.y).normalize();
      } else {
        // parallel transport: keep the last normal, take away its part along the new tangent
        tmp.copy(Nn).addScaledVector(T, -Nn.dot(T));
        if (tmp.lengthSq() < 1e-8) tmp.crossVectors(prevT, T).cross(T);
        Nn.copy(tmp).normalize();
      }
      prevT.copy(T);
      Bn.crossVectors(T, Nn);
      const p = pts[i];
      for (let j = 0; j <= sides; j++) {
        const ph = (j / sides) * Math.PI * 2;
        const c = Math.cos(ph);
        const s = Math.sin(ph);
        const nx = c * Nn.x + s * Bn.x;
        const ny = c * Nn.y + s * Bn.y;
        const nz = c * Nn.z + s * Bn.z;
        const k = (i * ring + j) * 3;
        nor[k] = nx;
        nor[k + 1] = ny;
        nor[k + 2] = nz;
        pos[k] = p.x + r * nx;
        pos[k + 1] = p.y + r * ny;
        pos[k + 2] = p.z + r * nz;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.normal.needsUpdate = true;
  }
  setLength(SPRING.L0);
  geo.computeBoundingSphere();
  return { mesh, setLength };
}

// ── the slotted mass and the hanger ─────────────────────────────────────────

function discGeometry() {
  const { R, h } = DISC;
  const w = 0.0066; // the slot
  const x0 = Math.sqrt(R * R - (w / 2) ** 2);
  const a = Math.asin(w / 2 / R);
  const shape = new THREE.Shape();
  shape.moveTo(x0, w / 2);
  shape.absarc(0, 0, R, a, Math.PI * 2 - a, false);
  shape.lineTo(0, -w / 2);
  shape.absarc(0, 0, w / 2, -Math.PI / 2, Math.PI / 2, true);
  shape.closePath();
  const bev = 0.0007;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h - 2 * bev,
    bevelEnabled: true,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 2,
    curveSegments: 40,
  });
  geo.translate(0, 0, bev);
  geo.rotateX(-Math.PI / 2); // the disc lies flat, its bottom at y = 0
  geo.computeVertexNormals();
  return geo;
}

function createHanger(mats) {
  const root = new THREE.Group();
  root.name = 'MassHanger';
  // the hook through the spring's bottom loop (its wire runs along z through the loop), then the neck into the rod
  const hookCurve = new THREE.CatmullRomCurve3(
    [
      [0, HANGER.rodTop, 0],
      [0, -0.019, 0.0028],
      [0, -0.0105, 0.0062],
      [0, -0.003, 0.005],
      [0, 0, 0],
      [0, -0.003, -0.005],
      [0, -0.0095, -0.0062],
      [0, -0.0135, -0.0042],
    ].map((p) => new THREE.Vector3(...p)),
  );
  const hook = new THREE.Mesh(new THREE.TubeGeometry(hookCurve, 40, HOOK_R, 8, false), mats.wire);
  hook.name = 'Hook';
  const rodLen = HANGER.rodTop - HANGER.plateTop;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0024, 0.0024, rodLen, 16), mats.hangerSteel);
  rod.position.y = (HANGER.rodTop + HANGER.plateTop) / 2;
  rod.name = 'HangerRod';
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(HANGER.plateR, HANGER.plateR, HANGER.plateH, 40), mats.hangerSteel);
  plate.position.y = HANGER.plateTop - HANGER.plateH / 2;
  plate.name = 'BasePlate';
  // the pointer: a thin black blade from the plate toward the rule, pointed at its tip
  const blade = new THREE.Shape();
  const len = Math.hypot(RULE.x + RULE.w / 2, RULE.z) - HANGER.plateR + 0.004;
  blade.moveTo(0, -0.0012);
  blade.lineTo(len - 0.004, -0.0012);
  blade.lineTo(len, 0);
  blade.lineTo(len - 0.004, 0.0012);
  blade.lineTo(0, 0.0012);
  blade.closePath();
  const pg = new THREE.ExtrudeGeometry(blade, { depth: 0.0008, bevelEnabled: false });
  pg.rotateX(-Math.PI / 2);
  const pointer = new THREE.Mesh(pg, mats.pointer);
  const ang = -Math.atan2(RULE.z, RULE.x + RULE.w / 2); // +x turned toward the rule's near edge
  pointer.rotation.y = ang;
  const dir = new THREE.Vector3(RULE.x + RULE.w / 2, 0, RULE.z).normalize();
  pointer.position.set(dir.x * (HANGER.plateR - 0.004), HANGER.plateTop - HANGER.plateH / 2, dir.z * (HANGER.plateR - 0.004));
  pointer.name = 'Pointer';
  root.add(hook, rod, plate, pointer);
  // the slotted masses: up to four, the slots turned in turn so they don't slide off
  const geo = discGeometry();
  const discs = [];
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Mesh(geo, mats.brass);
    d.position.y = HANGER.plateTop + i * (DISC.h + DISC.gap);
    d.rotation.y = 0.6 + i * Math.PI * 0.85;
    d.name = `SlottedMass${i + 1}`;
    discs.push(d);
    root.add(d);
  }
  // a big invisible box to grab (the discs and the plate, with room round them)
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.11), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = HANGER.plateTop + 0.02;
  hit.userData.noExport = true;
  hit.name = 'Grab';
  root.add(hit);
  function setCount(n) {
    discs.forEach((d, i) => {
      d.visible = i < n;
    });
  }
  /** The visible mass's box (world), for the action's ring. */
  const box = new THREE.Box3();
  function body() {
    box.makeEmpty();
    for (const d of discs) if (d.visible) box.expandByObject(d);
    return box;
  }
  return { root, hit, discs, setCount, body, pointerY: HANGER.plateTop - HANGER.plateH / 2 };
}

// ── the stand, the rule, the bench ──────────────────────────────────────────

function ruleTexture(num) {
  const W = 128;
  const H = 2048;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  g.fillStyle = '#f4ead2';
  g.fillRect(0, 0, W, H);
  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'rgba(120,90,40,0.10)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(120,90,40,0.12)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  const cm = 40; // the rule's length
  const pxCm = H / cm;
  g.fillStyle = '#1b1f24';
  for (let i = 0; i <= cm * 2; i++) {
    const y = i * (pxCm / 2);
    const whole = i % 2 === 0;
    const five = i % 10 === 0;
    const len = five ? 56 : whole ? 38 : 22;
    g.fillRect(W - len, y - (five ? 2 : 1.2), len, five ? 4 : 2.4);
  }
  g.font = '700 40px "Noto Sans Bengali", sans-serif';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  for (let i = 5; i < cm; i += 5) g.fillText(num(String(i)), 8, i * pxCm);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function benchTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  let s = 11;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  g.fillStyle = '#a8662f';
  g.fillRect(0, 0, 512, 256);
  for (let p = 0; p < 4; p++) {
    g.fillStyle = `hsl(${24 + rnd() * 5}, ${46 + rnd() * 10}%, ${34 + rnd() * 8}%)`;
    g.fillRect(0, p * 64, 512, 64);
    for (let i = 0; i < 16; i++) {
      const y = p * 64 + rnd() * 64;
      g.strokeStyle = `rgba(60,28,8,${0.12 + rnd() * 0.2})`;
      g.lineWidth = 0.6 + rnd() * 1.4;
      g.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const yy = y + Math.sin(x * 0.012 + i) * 2;
        x ? g.lineTo(x, yy) : g.moveTo(x, yy);
      }
      g.stroke();
    }
    g.fillStyle = 'rgba(30,12,2,0.55)';
    g.fillRect(0, p * 64, 512, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  t.anisotropy = 8;
  return t;
}

/** The backdrop: a soft blue-grey at the top to a pale blue low down (screen space). */
export function backdropTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const s = g.createLinearGradient(0, 0, 0, 256);
  s.addColorStop(0, '#7f9bc0');
  s.addColorStop(0.6, '#b4c6dc');
  s.addColorStop(1, '#d7e2ef');
  g.fillStyle = s;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function apparatusMaterials(M) {
  return {
    wire: new THREE.MeshPhysicalMaterial({ name: 'SpringSteel', color: 0xc9ced6, metalness: 1, roughness: 0.3, clearcoat: 0.3 }),
    hangerSteel: M.steel,
    chrome: M.chrome,
    brass: new THREE.MeshPhysicalMaterial({ name: 'Brass', color: 0xd3a245, metalness: 1, roughness: 0.32, clearcoat: 0.2 }),
    pointer: new THREE.MeshStandardMaterial({ name: 'PointerBlack', color: 0x15181c, roughness: 0.5 }),
    enamel: new THREE.MeshStandardMaterial({ name: 'StandEnamel', color: 0x2f4f7a, roughness: 0.42, metalness: 0.15 }),
    iron: new THREE.MeshStandardMaterial({ name: 'BossIron', color: 0x3a3f46, roughness: 0.5, metalness: 0.6 }),
  };
}

/** Everything; `set({ Lb, discs })` stretches the spring and moves the hanger. */
export function createApparatus(M, num) {
  const mats = apparatusMaterials(M);
  const root = new THREE.Group();
  root.name = 'SpringMassApparatus';
  const moving = new THREE.Group();
  moving.name = 'SpringAndMass';
  const wire = createWire(mats.wire);
  const hanger = createHanger(mats);
  moving.add(wire.mesh, hanger.root);

  // the stand
  const stand = new THREE.Group();
  stand.name = 'RetortStand';
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.11, 1, 1, 1), mats.enamel);
  base.position.set(ROD.x + 0.03, 0.01, ROD.z - 0.01);
  const baseEdge = new THREE.Mesh(new THREE.BoxGeometry(0.166, 0.005, 0.116), mats.iron);
  baseEdge.position.set(base.position.x, 0.003, base.position.z);
  const rodTop = ARM_Y + 0.07;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(ROD.r, ROD.r, rodTop - 0.02, 24), mats.chrome);
  rod.position.set(ROD.x, 0.02 + (rodTop - 0.02) / 2, ROD.z);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.012, 24), mats.iron);
  foot.position.set(ROD.x, 0.026, ROD.z);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(ROD.r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.chrome);
  cap.position.set(ROD.x, rodTop, ROD.z);
  // the boss head: a block round the rod with two thumbscrews, the arm out of it toward the spring
  const boss = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.03, 0.026), mats.iron);
  boss.position.set(ROD.x, ARM_Y, ROD.z);
  const screwGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.016, 12).rotateX(Math.PI / 2);
  const screw = new THREE.Mesh(screwGeo, mats.chrome);
  screw.position.set(ROD.x, ARM_Y + 0.007, ROD.z - 0.02);
  const knobGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 20).rotateX(Math.PI / 2);
  const knob = new THREE.Mesh(knobGeo, mats.iron);
  knob.position.set(ROD.x, ARM_Y + 0.007, ROD.z - 0.029);
  const armDir = new THREE.Vector3(0.03 - ROD.x, 0, -ROD.z);
  const armLen = armDir.length();
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(ARM_R, ARM_R, armLen, 20).rotateZ(Math.PI / 2), mats.chrome);
  arm.position.set(ROD.x + armDir.x / 2, ARM_Y, ROD.z + armDir.z / 2);
  arm.rotation.y = -Math.atan2(armDir.z, armDir.x);
  const armEnd = new THREE.Mesh(new THREE.SphereGeometry(ARM_R * 1.25, 16, 12), mats.chrome);
  armEnd.position.set(0.03, ARM_Y, 0);
  // a second clamp low on the rod holding the rule
  const clamp2 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.022), mats.iron);
  const ruleBottom = RULE.top - RULE.length;
  clamp2.position.set(ROD.x, ruleBottom + 0.06, ROD.z);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(RULE.x - ROD.x, 0.008, 0.006), mats.iron);
  bar.position.set((RULE.x + ROD.x) / 2, ruleBottom + 0.06, RULE.z - 0.006);
  const bar2 = bar.clone();
  bar2.position.y = RULE.top - 0.05;
  const clamp3 = clamp2.clone();
  clamp3.position.y = RULE.top - 0.05;
  stand.add(baseEdge, base, foot, rod, cap, boss, screw, knob, arm, armEnd, clamp2, bar, clamp3, bar2);

  // the rule
  const ruleMat = new THREE.MeshStandardMaterial({ name: 'RuleFace', map: ruleTexture(num), roughness: 0.6 });
  const ruleSide = new THREE.MeshStandardMaterial({ name: 'RuleEdge', color: 0xd8c9a6, roughness: 0.7 });
  const rule = new THREE.Mesh(new THREE.BoxGeometry(RULE.w, RULE.length, 0.005), [ruleSide, ruleSide, ruleSide, ruleSide, ruleMat, ruleSide]);
  rule.position.set(RULE.x, RULE.top - RULE.length / 2, RULE.z);
  rule.name = 'MetreRule';

  // the bench
  const benchMat = new THREE.MeshStandardMaterial({ name: 'Teak', map: benchTexture(), roughness: 0.55 });
  const benchEdge = new THREE.MeshStandardMaterial({ name: 'TeakEdge', color: 0x6a3514, roughness: 0.7 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.8), [benchEdge, benchEdge, benchMat, benchEdge, benchEdge, benchEdge]);
  bench.position.set(-0.1, -0.02, -0.2); // its front edge 0.2 m in front of the spring
  bench.name = 'Bench';
  bench.receiveShadow = true;

  const turned = new THREE.Group();
  turned.name = 'Turned';
  turned.rotation.y = YAW;
  turned.add(stand, rule, moving);
  root.add(turned, bench);
  root.updateMatrixWorld(true);
  for (const m of [base, rod, boss, arm, rule, wire.mesh, ...hanger.discs, hanger.root.children[1], hanger.root.children[2]]) m.castShadow = true;
  rule.receiveShadow = true;
  base.receiveShadow = true;

  function set({ Lb, discs }) {
    wire.setLength(Lb);
    hanger.root.position.y = hangerY(Lb);
    hanger.setCount(discs);
    hanger.root.updateMatrixWorld(true); // the arrow, the labels and the ring read its place at once
  }
  set({ Lb: SPRING.L0 + 0.1, discs: 2 });
  return {
    root,
    stand,
    rule,
    bench,
    hanger,
    wire,
    set,
    /** The pointer's height (world y) for the hanger at its current place. */
    pointerY: () => hanger.root.position.y + hanger.pointerY,
    /** The discs' middle (world). */
    massCentre: (out) => {
      const b = hanger.body();
      return b.getCenter(out);
    },
    shadowCasters: [stand, rule, moving],
  };
}
