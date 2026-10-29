// The apparatus (metres): a wooden bench, a painted wall board with a steel plate, a coil spring screwed to it, a
// steel end cap with a wooden handle bar, and a centimetre ruler on the bench with its 0 under the spring's free end
// at rest. The spring is a real helix of wire: setEnd(x) rebuilds it so its coils spread out when it is pulled and
// bunch up when it is pushed in (the number of turns stays the same).
import * as THREE from 'three';
import { REST_LENGTH } from './spring-maths.js';

export const AXIS = { y: 0.1, z: 0 }; // the spring's axis above the bench
export const COIL = { radius: 0.022, wire: 0.0029, turns: 13 };
export const X0 = REST_LENGTH; // the free end at rest: the x = 0 line
export const HUB = 0.012; // the coil starts this far from the wall's face
export const CAP = 0.008; // the end cap's thickness
export const BAR = { offset: 0.038, radius: 0.0105, length: 0.1 }; // the handle bar: its centre this far past the cap
export const RULER = { z: 0, width: 0.042, from: -12, to: 12 }; // cm either side of 0, right under the spring

/** A ruler's face as a canvas texture: cm ticks, mm ticks, numbers every 5 cm (no signs: the dashed line is 0). */
function rulerTexture(num, unit) {
  const cm = 60; // px per cm
  const span = RULER.to - RULER.from;
  const c = document.createElement('canvas');
  c.width = cm * span + 40;
  c.height = 160;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#eef1f4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#3d3a2e';
  ctx.fillStyle = '#2b2a24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (let mm = RULER.from * 10; mm <= RULER.to * 10; mm++) {
    const x = 20 + ((mm - RULER.from * 10) / 10) * cm;
    const whole = mm % 10 === 0;
    const five = mm % 50 === 0;
    ctx.lineWidth = whole ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, five ? 66 : whole ? 50 : mm % 5 === 0 ? 34 : 24);
    ctx.stroke();
    if (whole && five) {
      ctx.font = '700 62px "Noto Sans Bengali", sans-serif';
      ctx.fillText(num(Math.abs(mm / 10)), x, 132);
    }
  }
  ctx.font = '600 34px "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(unit, 20 + 0.25 * cm, 140);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Wood grain for the bench: warm planks drawn once on a canvas. */
function benchTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c9864a';
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 90; i++) {
    const y = (i * 37) % 256;
    ctx.strokeStyle = `rgba(${110 + (i % 5) * 8}, ${58 + (i % 3) * 6}, 24, ${0.08 + (i % 4) * 0.03})`;
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) ctx.lineTo(x, y + Math.sin(x / 60 + i) * 3);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(90, 45, 15, 0.35)';
  for (const y of [0, 128]) ctx.fillRect(0, y, 512, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

/** A helix from x = a to x = b round the axis: `turns` turns, with short straight ends into the hub and the cap. */
class Helix extends THREE.Curve {
  constructor() {
    super();
    this.a = HUB;
    this.b = X0 - CAP / 2;
  }
  getPoint(u, out = new THREE.Vector3()) {
    const { radius, turns } = COIL;
    const lead = 0.04; // the first and last 4% of the wire run into the hub and the cap
    if (u < lead) {
      const k = u / lead;
      return out.set(this.a - 0.004 * (1 - k), AXIS.y + radius * k, AXIS.z);
    }
    if (u > 1 - lead) {
      const k = (1 - u) / lead;
      return out.set(this.b + 0.004 * (1 - k), AXIS.y + radius * k, AXIS.z);
    }
    const v = (u - lead) / (1 - 2 * lead);
    const angle = v * turns * Math.PI * 2;
    return out.set(this.a + (this.b - this.a) * v, AXIS.y + radius * Math.cos(angle), AXIS.z + radius * Math.sin(angle));
  }
}

export function createApparatus({ num = String, unit = 'cm', springColor = '#e0317a' } = {}) {
  const root = new THREE.Group();
  root.name = 'SpringApparatus';
  const M = {
    bench: new THREE.MeshStandardMaterial({ name: 'Bench', map: benchTexture(), roughness: 0.6, metalness: 0 }),
    benchEdge: new THREE.MeshStandardMaterial({ name: 'BenchEdge', color: '#8a4f24', roughness: 0.65 }),
    board: new THREE.MeshStandardMaterial({ name: 'WallBoard', color: '#ffc21a', roughness: 0.55 }),
    steel: new THREE.MeshPhysicalMaterial({ name: 'Steel', color: '#d7dde4', metalness: 0.95, roughness: 0.32 }),
    screw: new THREE.MeshPhysicalMaterial({ name: 'Screw', color: '#9aa3ad', metalness: 1, roughness: 0.35 }),
    spring: new THREE.MeshPhysicalMaterial({
      name: 'Spring',
      color: springColor,
      metalness: 0.35,
      roughness: 0.28,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    }),
    handle: new THREE.MeshPhysicalMaterial({ name: 'Handle', color: '#a0612f', roughness: 0.42, clearcoat: 0.5 }),
    ruler: new THREE.MeshStandardMaterial({ name: 'Ruler', map: rulerTexture(num, unit), roughness: 0.5 }),
    rulerSide: new THREE.MeshStandardMaterial({ name: 'RulerSide', color: '#d5dbe1', roughness: 0.5 }),
  };
  const mesh = (geometry, material, name, parent = root) => {
    const m = new THREE.Mesh(geometry, material);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // the bench
  const bench = mesh(new THREE.BoxGeometry(1.6, 0.04, 0.5), [M.benchEdge, M.benchEdge, M.bench, M.benchEdge, M.benchEdge, M.benchEdge], 'Bench');
  bench.position.set(0.35, -0.02, -0.12);
  // the wall board, clamped upright at the bench's left
  const board = mesh(new THREE.BoxGeometry(0.03, 0.3, 0.34), M.board, 'WallBoard');
  board.position.set(-0.015, 0.15, -0.08);
  const plate = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.004, 40).rotateZ(Math.PI / 2), M.steel, 'WallPlate');
  plate.position.set(0.002, AXIS.y, AXIS.z);
  for (const [dy, dz] of [
    [0.024, 0.024],
    [0.024, -0.024],
    [-0.024, 0.024],
    [-0.024, -0.024],
  ]) {
    const s = mesh(new THREE.SphereGeometry(0.0042, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2), M.screw, 'Screw');
    s.position.set(0.004, AXIS.y + dy, AXIS.z + dz);
  }
  const hub = mesh(new THREE.CylinderGeometry(0.013, 0.015, HUB, 28).rotateZ(Math.PI / 2), M.steel, 'Hub');
  hub.position.set(HUB / 2 + 0.002, AXIS.y, AXIS.z);

  // the ruler on the bench, 0 under the free end at rest
  const span = (RULER.to - RULER.from + 40 / 60) / 100; // the texture's 20 px margins are 1/3 cm each
  const ruler = mesh(
    new THREE.BoxGeometry(span, 0.003, RULER.width),
    [M.rulerSide, M.rulerSide, M.ruler, M.rulerSide, M.rulerSide, M.rulerSide],
    'Ruler',
  );
  // the top face's u runs along +x and the canvas's top row lies at the back edge: ticks by the spring, numbers in front
  ruler.position.set(X0 + (RULER.from + RULER.to) / 200, 0.0015, RULER.z);

  // the spring (rebuilt as it changes length), the end cap and the handle (they move together)
  const helix = new Helix();
  const spring = mesh(new THREE.BufferGeometry(), M.spring, 'Spring');
  const end = new THREE.Group();
  end.name = 'SpringEnd';
  root.add(end);
  const cap = mesh(new THREE.CylinderGeometry(COIL.radius + 0.004, COIL.radius + 0.004, CAP, 36).rotateZ(Math.PI / 2), M.steel, 'EndCap', end);
  cap.position.set(0, AXIS.y, AXIS.z);
  const rod = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, BAR.offset, 16).rotateZ(Math.PI / 2), M.steel, 'HandleRod', end);
  rod.position.set(BAR.offset / 2, AXIS.y, AXIS.z);
  const bar = mesh(new THREE.CapsuleGeometry(BAR.radius, BAR.length - 2 * BAR.radius, 6, 24).rotateX(Math.PI / 2), M.handle, 'HandleBar', end);
  bar.position.set(BAR.offset, AXIS.y, AXIS.z);
  // a big invisible box round the handle and the hand: the part a finger drags
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.2, 0.2), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0.06, AXIS.y + 0.02, AXIS.z);
  hit.userData.noExport = true;
  end.add(hit);

  let endX = -1;
  /** The free end (the cap's centre) at x metres from the wall's face. */
  function setEnd(x) {
    if (Math.abs(x - endX) < 1e-7) return;
    endX = x;
    helix.b = x - CAP / 2;
    const old = spring.geometry;
    spring.geometry = new THREE.TubeGeometry(helix, COIL.turns * 26, COIL.wire, 10, false);
    old.dispose();
    end.position.x = x;
  }
  setEnd(X0);

  const box = new THREE.Box3();
  return {
    root,
    hit,
    setEnd,
    /** The handle bar's centre now (scene frame). */
    barCentre: (out = new THREE.Vector3()) => out.set(endX + BAR.offset, AXIS.y, AXIS.z),
    /** The end cap and the handle as a box (the action's ring), without the hit box. */
    endBox: () => box.setFromObject(cap).union(new THREE.Box3().setFromObject(bar)),
    materials: M,
  };
}
