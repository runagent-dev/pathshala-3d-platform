// The workshop and the apparatus (metres; y up, the bench top at y = 0, the spring's top hook at TOP): a warm brick
// wall with a deep blue pegboard of tools behind a heavy lab stand on an oak bench. A polished steel spring hangs
// from the stand's arm; a hanger with a pointer hooks on its lower loop and brass slotted weights of 1 N each stack on
// the hanger; a wooden metre rule beside it reads the spring's length L from the top hook (0 cm). The spring is built
// once as a tube along a helix; setLength moves its vertices down along the coil (no new geometry while it moves).
import * as THREE from 'three';
import { FONT } from '@shared/student/materials.js';

export const TOP = 0.68; // m: the spring's top hook (the rule's 0)
export const RULER = { x: -0.09, width: 0.034, z: -0.006, cm: 52 }; // its left edge, width, face, length
export const COIL = { radius: 0.016, wire: 0.0019, turns: 34 };
const END = 0.018; // m from each end of the spring (where it hooks) to its coils
const LOOP = 0.0075; // the end loops' radius
export const HANGER = { rod: 0.086, plate: 0.0045, radius: 0.023 }; // its rod below the hook, its plate
export const WEIGHT = { h: 0.0105, r: 0.02, slot: 0.0034 }; // each 1 N slotted weight
export const TRAY = new THREE.Vector3(0.21, 0, 0.06); // the spare weights on the bench (bottom of the stack)
const STAND_X = 0.12;
export const DIM_X = RULER.x - 0.011; // the line that marks L₀ (dark) and x (red), just left of the rule

const tex = (canvas, { repeat = null, aniso = 8 } = {}) => {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
};
const canvas2d = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')) };
};
// a fixed pseudo-random sequence, so every load draws the same wall
let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** Old red brick in a running bond with pale mortar, each brick a little different. */
function brickTexture() {
  seed = 7;
  const { c, ctx } = canvas2d(1024, 1024);
  ctx.fillStyle = '#d9c3a5';
  ctx.fillRect(0, 0, 1024, 1024);
  const bw = 128;
  const bh = 46;
  const m = 7;
  const hues = ['#b4492c', '#a83f27', '#c25a35', '#9c3a24', '#b85134', '#c96a3f', '#8f3520'];
  for (let row = 0; row * bh < 1024 + bh; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col * bw < 1024 + bw; col++) {
      const x = col * bw + off + m / 2;
      const y = row * bh + m / 2;
      ctx.fillStyle = hues[Math.floor(rnd() * hues.length)];
      ctx.fillRect(x, y, bw - m, bh - m);
      // soot and wear
      const g = ctx.createLinearGradient(x, y, x, y + bh);
      g.addColorStop(0, 'rgba(255, 220, 190, 0.12)');
      g.addColorStop(1, 'rgba(40, 10, 0, 0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, bw - m, bh - m);
      for (let k = 0; k < 26; k++) {
        ctx.fillStyle = rnd() < 0.5 ? 'rgba(60, 15, 5, 0.22)' : 'rgba(255, 210, 170, 0.16)';
        ctx.fillRect(x + rnd() * (bw - m - 4), y + rnd() * (bh - m - 3), 1 + rnd() * 4, 1 + rnd() * 2);
      }
    }
  }
  return tex(c, { repeat: [3, 2] });
}

/** A deep blue pegboard with rows of holes and painted outlines where the tools hang. */
function pegboardTexture(num) {
  const { c, ctx } = canvas2d(1024, 1280);
  const g = ctx.createLinearGradient(0, 0, 1024, 1280);
  g.addColorStop(0, '#24467f');
  g.addColorStop(1, '#183463');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1280);
  ctx.fillStyle = '#0d1d3a';
  for (let y = 24; y < 1280; y += 40)
    for (let x = 24; x < 1024; x += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  // tools at the edges (the middle stays calm behind the spring): a spanner, pliers, a hammer, a set square
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const tool = (fn) => {
    ctx.save();
    fn();
    ctx.restore();
  };
  tool(() => {
    // spanner, top left
    ctx.translate(120, 250);
    ctx.rotate(-0.25);
    ctx.fillStyle = '#c9ced6';
    ctx.fillRect(-12, -150, 24, 300);
    ctx.beginPath();
    ctx.arc(0, -165, 36, 0, Math.PI * 2);
    ctx.arc(0, 165, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#183463';
    ctx.fillRect(-12, -215, 24, 46);
    ctx.beginPath();
    ctx.arc(0, 165, 14, 0, Math.PI * 2);
    ctx.fill();
  });
  tool(() => {
    // hammer, bottom left
    ctx.translate(140, 980);
    ctx.rotate(0.12);
    ctx.fillStyle = '#d08a3c';
    ctx.fillRect(-14, -40, 28, 260);
    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect(-70, -90, 140, 56);
    ctx.fillStyle = '#7a838e';
    ctx.fillRect(40, -90, 30, 56);
  });
  tool(() => {
    // pliers, top right
    ctx.translate(900, 280);
    ctx.rotate(0.2);
    ctx.strokeStyle = '#e03131';
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(-40, 180);
    ctx.quadraticCurveTo(-10, 40, 0, -20);
    ctx.moveTo(40, 180);
    ctx.quadraticCurveTo(10, 40, 0, -20);
    ctx.stroke();
    ctx.strokeStyle = '#aab2bc';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-6, -20);
    ctx.lineTo(-14, -130);
    ctx.moveTo(6, -20);
    ctx.lineTo(14, -130);
    ctx.stroke();
  });
  tool(() => {
    // a yellow set square, bottom right
    ctx.translate(840, 940);
    ctx.fillStyle = '#f2b51f';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(150, 0);
    ctx.lineTo(0, 210);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1d3d73';
    ctx.beginPath();
    ctx.moveTo(26, 26);
    ctx.lineTo(90, 26);
    ctx.lineTo(26, 116);
    ctx.closePath();
    ctx.fill();
  });
  // a small stencilled label on the board
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = `700 34px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(num('5.5'), 990, 1250);
  return tex(c);
}

/** Warm oak planks along the bench. */
function oakTexture() {
  seed = 11;
  const { c, ctx } = canvas2d(1024, 256);
  const planks = ['#b8783e', '#c4864a', '#ad6e37', '#bf7f44'];
  for (let p = 0; p < 4; p++) {
    ctx.fillStyle = planks[p];
    ctx.fillRect(0, p * 64, 1024, 64);
    for (let k = 0; k < 40; k++) {
      ctx.strokeStyle = `rgba(${rnd() < 0.5 ? '90, 45, 15' : '235, 180, 120'}, ${0.12 + rnd() * 0.18})`;
      ctx.lineWidth = 1 + rnd() * 2;
      const y = p * 64 + rnd() * 64;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 1024; x += 64) ctx.lineTo(x, y + Math.sin(x / 90 + k) * 3 * rnd());
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(60, 25, 5, 0.55)';
    ctx.fillRect(0, p * 64, 1024, 2);
  }
  return tex(c, { repeat: [1.5, 1] });
}

/** The metre rule's face: cm marks on its left edge (toward the spring), a number at every cm, bold every 5. */
function rulerTexture(num) {
  const pxcm = 64;
  const { c, ctx } = canvas2d(160, RULER.cm * pxcm + 32);
  const g = ctx.createLinearGradient(0, 0, 160, 0);
  g.addColorStop(0, '#fbe3a4');
  g.addColorStop(1, '#f1c96c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#1b1f2a';
  ctx.textBaseline = 'middle';
  for (let mm = 0; mm <= RULER.cm * 10; mm += 5) {
    const y = 16 + (mm / 10) * pxcm;
    const whole = mm % 10 === 0;
    const five = mm % 50 === 0;
    const w = five ? 70 : whole ? 50 : 26;
    ctx.fillRect(160 - w, y - (whole ? 2 : 1.25), w, whole ? 4 : 2.5);
    if (whole) {
      const v = mm / 10;
      ctx.font = five ? `800 50px ${FONT}` : `600 30px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(num(v), five ? 84 : 104, y + 2);
    }
  }
  ctx.font = `700 28px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('cm', 8, 16 + 2.5 * pxcm);
  return tex(c);
}

/** The top of a 1 N weight: brushed brass with "১ N" stamped on it. */
function weightTexture(num) {
  const { c, ctx } = canvas2d(256, 256);
  const g = ctx.createRadialGradient(110, 100, 10, 128, 128, 140);
  g.addColorStop(0, '#f6d78a');
  g.addColorStop(1, '#c99a3c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(120, 80, 20, 0.25)';
  for (let r = 20; r < 128; r += 6) {
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#6b4510';
  ctx.font = `800 64px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${num(1)} N`, 128, 196);
  return tex(c);
}

/** The scene's materials: the polished spring, brass, iron, the rule. */
function makeMaterials(num) {
  return {
    spring: new THREE.MeshStandardMaterial({ name: 'SpringSteel', color: '#dfe5ec', metalness: 1, roughness: 0.2 }),
    chrome: new THREE.MeshStandardMaterial({ name: 'Chrome', color: '#e9edf2', metalness: 1, roughness: 0.14 }),
    darkSteel: new THREE.MeshStandardMaterial({ name: 'DarkSteel', color: '#5d6672', metalness: 0.9, roughness: 0.35 }),
    iron: new THREE.MeshStandardMaterial({ name: 'CastIron', color: '#1f6f8b', metalness: 0.35, roughness: 0.42 }),
    brass: new THREE.MeshStandardMaterial({ name: 'Brass', color: '#d9a441', metalness: 1, roughness: 0.3 }),
    brassTop: new THREE.MeshStandardMaterial({ name: 'BrassTop', map: weightTexture(num), metalness: 0.75, roughness: 0.32 }),
    ruler: new THREE.MeshStandardMaterial({ name: 'Rule', map: rulerTexture(num), roughness: 0.6 }),
    rulerEdge: new THREE.MeshStandardMaterial({ name: 'RuleEdge', color: '#c99a4a', roughness: 0.7 }),
    pointer: new THREE.MeshStandardMaterial({ name: 'Pointer', color: '#15181e', metalness: 0.4, roughness: 0.4 }),
    pointerTip: new THREE.MeshBasicMaterial({ name: 'PointerTip', color: '#ffd43b', toneMapped: false }),
    wood: new THREE.MeshStandardMaterial({ name: 'Oak', map: oakTexture(), roughness: 0.62 }),
    woodEdge: new THREE.MeshStandardMaterial({ name: 'OakEdge', color: '#8a521f', roughness: 0.7 }),
  };
}

/** The room: the brick wall, the pegboard behind the stand, the bench. Not exported. */
export function createWorkshop(num) {
  const root = new THREE.Group();
  root.name = 'Workshop';
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 2.6),
    new THREE.MeshStandardMaterial({ name: 'Brick', map: brickTexture(), roughness: 0.9 }),
  );
  wall.position.set(0, 1.0, -0.42);
  wall.receiveShadow = true;
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.98, 0.012), [
    new THREE.MeshStandardMaterial({ color: '#13284d', roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: '#13284d', roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: '#13284d', roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: '#13284d', roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ name: 'Pegboard', map: pegboardTexture(num), roughness: 0.55 }),
    new THREE.MeshStandardMaterial({ color: '#13284d', roughness: 0.6 }),
  ]);
  board.position.set(0.0, 0.5, -0.33);
  board.receiveShadow = true;
  const mats = makeMaterials(num);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.7), [
    mats.woodEdge,
    mats.woodEdge,
    mats.wood,
    mats.woodEdge,
    mats.wood,
    mats.woodEdge,
  ]);
  top.position.set(0, -0.02, -0.06);
  top.receiveShadow = true;
  root.add(wall, board, top);
  for (const m of [wall, board, top]) m.userData.noExport = true;
  return { root };
}

/** The stand: a heavy painted base, a chrome pillar, a boss and the arm with the hook the spring hangs on. */
function createStand(m) {
  const g = new THREE.Group();
  g.name = 'Stand';
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.028, 0.17), m.iron);
  base.position.set(STAND_X - 0.06, 0.014, -0.02);
  const bevel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.006, 0.15), m.iron);
  bevel.position.set(STAND_X - 0.06, 0.031, -0.02);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, TOP + 0.12, 20), m.chrome);
  pillar.position.set(STAND_X, (TOP + 0.12) / 2 + 0.03, -0.02);
  const boss = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.034, 0.03), m.iron);
  boss.position.set(STAND_X, TOP + 0.015, -0.02);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 10), m.darkSteel);
  screw.rotation.z = Math.PI / 2;
  screw.position.set(STAND_X + 0.026, TOP + 0.024, -0.02);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 16), m.darkSteel);
  knob.rotation.z = Math.PI / 2;
  knob.position.set(STAND_X + 0.042, TOP + 0.024, -0.02);
  const armFrom = RULER.x - 0.012;
  const armLen = STAND_X - armFrom;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, armLen, 16), m.chrome);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(armFrom + armLen / 2, TOP + 0.016, 0);
  // the hook under the arm: a short stem and a ring the spring's top loop catches on
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.012, 10), m.darkSteel);
  stem.position.set(0, TOP + 0.009, 0);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.0045, 0.0018, 8, 20), m.darkSteel);
  hook.rotation.y = Math.PI / 2;
  hook.position.set(0, TOP + 0.0035, 0);
  // the rule hangs from a clamp on the arm
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(RULER.width + 0.008, 0.02, 0.018), m.iron);
  clamp.position.set(RULER.x + RULER.width / 2, TOP + 0.016, RULER.z);
  g.add(base, bevel, pillar, boss, screw, knob, arm, stem, hook, clamp);
  return g;
}

/** The metre rule: its top (0 cm) level with the spring's top hook. */
function createRuler(m) {
  const len = RULER.cm / 100 + 0.016;
  const geo = new THREE.BoxGeometry(RULER.width, len, 0.006);
  const rule = new THREE.Mesh(geo, [m.rulerEdge, m.rulerEdge, m.rulerEdge, m.rulerEdge, m.ruler, m.rulerEdge]);
  // the texture starts 16 px (0.25 cm) above 0: put the face's top there
  rule.position.set(RULER.x + RULER.width / 2, TOP + 0.0025 - len / 2, RULER.z);
  rule.name = 'MetreRule';
  return rule;
}

/**
 * The spring: a helix of wire, its ends drawn to the middle and bent into a loop at each end. Built once at its
 * length L₀; setLength(L, uneven) moves each vertex down by its place along the coil (uneven: 0…1, how much of the
 * stretch is a little irregular, as in a spring pulled too far).
 */
function createSpring(m, L0m) {
  const g = new THREE.Group();
  g.name = 'Spring';
  const body0 = L0m - 2 * END;
  const perTurn = 22;
  const radial = 8;
  const M = COIL.turns * perTurn;
  const pos = [];
  const nor = [];
  const us = [];
  const idx = [];
  const c = new THREE.Vector3();
  const tng = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();
  const v = new THREE.Vector3();
  // the radius: from the axis to the full coil over the first and last half turn
  const rAt = (u) => {
    const e = 0.5 / COIL.turns;
    const k = Math.min(1, u / e, (1 - u) / e);
    return COIL.radius * (k * k * (3 - 2 * k));
  };
  for (let i = 0; i <= M; i++) {
    const u = i / M;
    const th = 2 * Math.PI * COIL.turns * u;
    const r = rAt(u);
    c.set(r * Math.cos(th), -END - u * body0, r * Math.sin(th));
    // tangent from a small step along the coil
    const u2 = Math.min(1, u + 1e-4);
    const u1 = Math.max(0, u - 1e-4);
    const r2 = rAt(u2);
    const r1 = rAt(u1);
    const t2 = 2 * Math.PI * COIL.turns * u2;
    const t1 = 2 * Math.PI * COIL.turns * u1;
    tng.set(r2 * Math.cos(t2) - r1 * Math.cos(t1), -(u2 - u1) * body0, r2 * Math.sin(t2) - r1 * Math.sin(t1)).normalize();
    n.set(Math.cos(th), 0, Math.sin(th));
    n.addScaledVector(tng, -n.dot(tng)).normalize();
    b.crossVectors(tng, n).normalize();
    for (let j = 0; j <= radial; j++) {
      const ph = (j / radial) * Math.PI * 2;
      v.copy(n).multiplyScalar(Math.cos(ph)).addScaledVector(b, Math.sin(ph));
      pos.push(c.x + COIL.wire * v.x, c.y + COIL.wire * v.y, c.z + COIL.wire * v.z);
      nor.push(v.x, v.y, v.z);
      us.push(u);
    }
  }
  for (let i = 0; i < M; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const d = a + radial + 1;
      idx.push(a, d, a + 1, d, d + 1, a + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setIndex(idx);
  const posAttr = new THREE.Float32BufferAttribute(pos, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const rest = Float32Array.from(pos);
  const coil = new THREE.Mesh(geo, m.spring);
  coil.name = 'Coils';
  coil.castShadow = true;
  coil.frustumCulled = false;
  // the end loops (facing the camera) and the short wires that join them to the coils
  const loopGeo = new THREE.TorusGeometry(LOOP, COIL.wire, 8, 24);
  const top = new THREE.Mesh(loopGeo, m.spring);
  top.position.set(0, -LOOP, 0);
  const bottom = new THREE.Mesh(loopGeo, m.spring);
  bottom.name = 'LowerLoop';
  g.add(coil, top, bottom);
  for (const o of [top, bottom]) o.castShadow = true;

  let length = L0m;
  function setLength(L, uneven = 0) {
    length = L;
    const extra = L - L0m;
    const arr = /** @type {Float32Array} */ (posAttr.array);
    for (let k = 0; k < us.length; k++) {
      const u = us[k];
      // a spring pulled too far: some turns opened a little more than others (still in order down the coil)
      const w = u + uneven * 0.035 * Math.sin(u * Math.PI * 6) * Math.sin(u * Math.PI);
      arr[k * 3 + 1] = rest[k * 3 + 1] - w * extra;
    }
    posAttr.needsUpdate = true;
    bottom.position.set(0, -L + LOOP, 0);
  }
  setLength(L0m);
  return {
    root: g,
    coil,
    setLength,
    get length() {
      return length;
    },
  };
}

/** The hanger: a hook through the spring's lower loop, a rod, the plate the weights sit on, and the pointer. */
function createHanger(m) {
  const g = new THREE.Group();
  g.name = 'Hanger';
  // the hook (its inside bottom at the group's origin: the spring's end) in the plane across the loop
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0017, 8, 20), m.chrome);
  hook.rotation.y = Math.PI / 2; // a ring through the loop, like a chain's link
  hook.position.set(0, 0.0036 - 0.006, 0);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0026, HANGER.rod, 12), m.chrome);
  rod.position.set(0, -0.012 - HANGER.rod / 2, 0);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(HANGER.radius, HANGER.radius, HANGER.plate, 32), m.chrome);
  plate.position.set(0, -0.012 - HANGER.rod - HANGER.plate / 2, 0);
  // the pointer: a dark needle from the hook's eye to the rule, a bright tip on the rule's marks
  const edge = RULER.x + RULER.width; // the rule's marked edge
  const reach = -edge - 0.004;
  const needle = new THREE.Mesh(new THREE.BoxGeometry(reach, 0.0016, 0.0022), m.pointer);
  needle.position.set(-0.002 - reach / 2, 0, RULER.z + 0.006);
  const tipShape = new THREE.Shape();
  tipShape.moveTo(0, 0);
  tipShape.lineTo(0.009, 0.0036);
  tipShape.lineTo(0.009, -0.0036);
  tipShape.closePath();
  const tip = new THREE.Mesh(new THREE.ShapeGeometry(tipShape), m.pointerTip);
  tip.position.set(edge - 0.006, 0, RULER.z + 0.0042);
  const tipEdge = new THREE.Mesh(new THREE.ShapeGeometry(tipShape), m.pointer);
  tipEdge.scale.set(1.3, 1.65, 1);
  tipEdge.position.set(edge - 0.0072, 0, RULER.z + 0.0038);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.006, 12), m.chrome);
  collar.position.set(0, -0.012, 0);
  g.add(hook, rod, plate, needle, tipEdge, tip, collar);
  for (const o of [hook, rod, plate, needle]) o.castShadow = true;
  return { root: g, meshes: [hook, rod, plate, needle, collar], plateBottom: -0.012 - HANGER.rod - HANGER.plate };
}

/** One brass slotted weight (its bottom at the origin): a disc with a slot to the middle so it slides on the rod. */
function weightGeometry() {
  const s = new THREE.Shape();
  const a = Math.asin(WEIGHT.slot / WEIGHT.r);
  s.absarc(0, 0, WEIGHT.r, a, Math.PI * 2 - a, false);
  s.lineTo(0.0042 * Math.cos(-a), -WEIGHT.slot);
  s.absarc(0, 0, 0.0042, -Math.PI / 2, -Math.PI * 1.5, true);
  s.lineTo(WEIGHT.r * Math.cos(a), WEIGHT.slot);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: WEIGHT.h,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0008,
    bevelSegments: 2,
    curveSegments: 28,
  });
  geo.rotateX(-Math.PI / 2); // the shape lies flat, extruded upward
  geo.translate(0, 0.0008, 0);
  geo.computeVertexNormals();
  return geo;
}

/** n weights (with their stamped tops): they move as single objects between the tray and the hanger. */
function createWeights(m, n) {
  const geo = weightGeometry();
  const topGeo = new THREE.CircleGeometry(WEIGHT.r * 0.97, 40);
  topGeo.rotateX(-Math.PI / 2);
  const list = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    g.name = `Weight1N_${i + 1}`;
    const body = new THREE.Mesh(geo, m.brass);
    body.castShadow = true;
    body.receiveShadow = true;
    const face = new THREE.Mesh(topGeo, m.brassTop);
    face.position.y = WEIGHT.h + 0.0017;
    face.rotation.y = Math.PI; // the stamp at the back, clear of the slot
    body.rotation.y = -Math.PI / 2; // the slot toward the student: it slides on from the front
    g.add(body, face);
    list.push({ root: g, body, face });
  }
  return list;
}

/** Everything the student uses: stand, rule, spring, hanger, weights. */
export function createApparatus(num, L0m) {
  const m = makeMaterials(num);
  const root = new THREE.Group();
  root.name = 'Elasticity';
  const stand = createStand(m);
  const ruler = createRuler(m);
  const spring = createSpring(m, L0m);
  spring.root.position.set(0, TOP, 0);
  const hanger = createHanger(m);
  const weights = createWeights(m, 6);
  // a small wooden block on the bench for the spare weights
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.07), m.wood);
  block.position.set(TRAY.x, 0.008, TRAY.z);
  block.castShadow = true;
  root.add(stand, ruler, spring.root, hanger.root, block, ...weights.map((w) => w.root));
  for (const o of [...stand.children, ruler]) {
    o.castShadow = true;
    o.receiveShadow = true;
  }
  return { root, stand, ruler, spring, hanger, weights, materials: m, trayTop: TRAY.y + 0.016 };
}
