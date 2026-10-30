// A 500-litre rooftop water tank, procedural three.js, in metres: a ribbed plastic cylinder with a domed top and a
// screw lid, cut open at the front (so the water shows), with a level scale on the cut (a tick every 100 L), the water
// inside rising with the litres in it, and while the pump runs, a stream falling from the inlet onto a rippling
// surface. It stands on a low stand of two plastered brick piers and a slab. The group's origin is on the stand's foot;
// the tank's floor is at `FLOOR` above it.
import * as THREE from 'three';
import { FULL } from './power.js';

export const TANK = { R: 0.43, FLOOR: 0.25, BODY: 0.9 }; // m: radius, the stand's height, the straight part's height
const WATER_R = TANK.R - 0.012;
const CUT = THREE.MathUtils.degToRad(52); // half the opening of the cutaway, round the front (+z)
export const WATER_FULL = FULL / 1000 / (Math.PI * WATER_R * WATER_R); // m of water when FULL kg are in

/** Falling water: soft streaks that scroll down the stream. */
function streamTexture() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(190,228,255,0.75)';
  ctx.fillRect(0, 0, 32, 128);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + (i % 3) * 0.2})`;
    ctx.fillRect((i * 7) % 30, (i * 37) % 128, 2, 18 + (i % 4) * 6);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** The water's surface: light rings that turn while it is stirred. */
function rippleTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, '#bfe6ff');
  g.addColorStop(1, '#3d9be0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  for (let r = 10; r < 64; r += 11) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(64 + (r % 3), 64, r, 0.2 * r, 0.2 * r + 4.4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.center.set(0.5, 0.5);
  return tex;
}

/** Plaster with a little grain. */
function plasterTexture(color) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 64, 64);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(rnd() * 64, rnd() * 64, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** @param {{ name?: string, accent?: string }} [opts] accent: the level strip's colour (the pump's colour) */
export function createTank({ name = 'RoofTank', accent = '#1f6fd0' } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const { R, FLOOR, BODY } = TANK;

  // the stand: two piers and a slab, plastered
  const plaster = new THREE.MeshStandardMaterial({ map: plasterTexture('#d8d2c6'), roughness: 0.92 });
  for (const x of [-0.3, 0.3]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.24, FLOOR - 0.08, 0.7), plaster);
    pier.position.set(x, (FLOOR - 0.08) / 2, 0);
    root.add(pier);
  }
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 1.0), plaster);
  slab.position.y = FLOOR - 0.04;
  root.add(slab);

  // the shell: ribs every 15 cm, a shoulder and a dome, a lid
  const pts = [new THREE.Vector2(0.001, 0), new THREE.Vector2(R - 0.02, 0), new THREE.Vector2(R, 0.025)];
  const ribs = 6;
  for (let i = 0; i < ribs; i++) {
    const y0 = 0.05 + (i * (BODY - 0.08)) / ribs;
    const step = (BODY - 0.08) / ribs;
    pts.push(
      new THREE.Vector2(R, y0),
      new THREE.Vector2(R + 0.014, y0 + step * 0.3),
      new THREE.Vector2(R + 0.014, y0 + step * 0.6),
      new THREE.Vector2(R, y0 + step * 0.9),
    );
  }
  pts.push(new THREE.Vector2(R, BODY));
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(0.13 + (R - 0.13) * Math.cos(a), BODY + 0.13 * Math.sin(a)));
  }
  pts.push(new THREE.Vector2(0.13, BODY + 0.14));
  // cut open at the front (like a textbook cutaway), so the water inside shows against the light plastic
  const shellMat = new THREE.MeshStandardMaterial({ color: '#efe8d6', roughness: 0.55, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.LatheGeometry(pts, 56, CUT, Math.PI * 2 - 2 * CUT), shellMat);
  shell.position.y = FLOOR;
  root.add(shell);
  // the cut's edges: two thin strips down the sides of the opening
  const edgeMat = new THREE.MeshStandardMaterial({ color: '#cfc5ad', roughness: 0.6 });
  for (const a of [CUT, -CUT]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.012, BODY, 0.03), edgeMat);
    edge.position.set(Math.sin(a) * (R + 0.003), FLOOR + BODY / 2, Math.cos(a) * (R + 0.003));
    edge.rotation.y = a;
    root.add(edge);
  }
  const lidMat = new THREE.MeshStandardMaterial({ color: '#2d3136', roughness: 0.45 });
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.145, 0.05, 32), lidMat);
  lid.position.y = FLOOR + BODY + 0.16;
  root.add(lid);
  for (let i = 0; i < 16; i++) {
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.04, 0.012), lidMat);
    const a = (i / 16) * Math.PI * 2;
    grip.position.set(Math.cos(a) * 0.147, lid.position.y, Math.sin(a) * 0.147);
    root.add(grip);
  }

  // the level scale on the cut's left edge (in the pump's colour): a tick every 100 L, a longer one at 500 L
  const stripMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5 });
  const sx = -Math.sin(CUT) * (R + 0.012);
  const sz = Math.cos(CUT) * (R + 0.012);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, WATER_FULL + 0.02, 0.012), stripMat);
  strip.position.set(sx, FLOOR + (WATER_FULL + 0.02) / 2, sz);
  strip.rotation.y = -CUT;
  root.add(strip);
  const tickMat = new THREE.MeshStandardMaterial({ color: '#1d2329', roughness: 0.6 });
  for (let k = 1; k <= 5; k++) {
    const len = k === 5 ? 0.12 : k % 2 === 0 ? 0.085 : 0.06;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(len, 0.01, 0.008), tickMat);
    tick.position.set(sx + (len / 2) * Math.cos(CUT), FLOOR + (WATER_FULL * k) / 5, sz + (len / 2) * Math.sin(CUT) + 0.008);
    tick.rotation.y = -CUT;
    root.add(tick);
  }

  // the water
  const waterMat = new THREE.MeshStandardMaterial({ color: '#1572d3', emissive: '#08407e', emissiveIntensity: 0.3, roughness: 0.15 });
  const waterGeo = new THREE.CylinderGeometry(WATER_R, WATER_R, 1, 48, 1, true);
  waterGeo.translate(0, 0.5, 0);
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = FLOOR + 0.004;
  water.renderOrder = 1;
  root.add(water);
  const ripples = rippleTexture();
  const surfMat = new THREE.MeshStandardMaterial({ map: ripples, roughness: 0.12 });
  const surface = new THREE.Mesh(new THREE.CircleGeometry(WATER_R, 48), surfMat);
  surface.rotation.x = -Math.PI / 2;
  surface.renderOrder = 2;
  root.add(surface);

  // the stream from the inlet (under the lid's edge) onto the surface
  const INLET = new THREE.Vector3(0, FLOOR + BODY + 0.1, -0.12); // where the delivery pipe enters (through the dome, behind the cut)
  const flow = streamTexture();
  flow.repeat.set(1, 2);
  const streamMat = new THREE.MeshStandardMaterial({ map: flow, transparent: true, opacity: 0.9, roughness: 0.2, depthWrite: false });
  const streamGeo = new THREE.CylinderGeometry(0.018, 0.024, 1, 12, 1, true);
  streamGeo.translate(0, -0.5, 0);
  const stream = new THREE.Mesh(streamGeo, streamMat);
  stream.position.copy(INLET);
  stream.renderOrder = 2;
  stream.visible = false;
  root.add(stream);

  let level = -1;
  /** kg of water in the tank (0 … FULL, may go a little past for a tank on its way to full). */
  function setMass(kg) {
    const h = Math.max(0.0015, (Math.max(0, kg) / FULL) * WATER_FULL);
    if (Math.abs(h - level) < 1e-5) return;
    level = h;
    water.scale.y = h;
    water.visible = kg > 0.5;
    surface.position.y = FLOOR + 0.004 + h;
    surface.visible = kg > 0.5;
    stream.scale.y = Math.max(0.02, INLET.y - surface.position.y);
  }
  setMass(0);

  return {
    root,
    shell,
    inlet: INLET,
    setMass,
    /** The world point at the top of the water (for labels). */
    surfaceAt: (out) => surface.getWorldPosition(out),
    /** Running or not: the stream falls and the surface turns; `dt` seconds of motion. */
    pour(on, dt = 0) {
      stream.visible = on;
      if (on) {
        flow.offset.y = (flow.offset.y + dt * 2.6) % 1;
        ripples.rotation = (ripples.rotation + dt * 1.5) % (Math.PI * 2);
      }
    },
  };
}
