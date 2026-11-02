// The world in metres: a pink-painted table whose top is an open frame (the book's চিত্র ৬.০৯), a block of ice laid
// across it, a thin wire over the block with a weight on each side, and the things the story shows: a thin film of
// water under the wire and a faint refrozen seam above it. A plain muted wall and a soft floor, nothing else.
// Everything is procedural and modest in triangles.
import * as THREE from 'three';
import { ICE, WIRE_R } from './reading.js';

export const GROUND = -0.58; // the floor, below the table's top (y = 0)
export const TABLE = { x: 0.92, z: 0.7, rail: 0.25, beam: 0.08, thick: 0.04 };
export const HANG = { slant: 0.12, drop: 0.3, out: 0.05 }; // the wire's bends: down, and out past the block's face
export const WEIGHT = { r: 0.042, h: 0.075 };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The wall behind everything: a muted slate blue, a little lighter toward the floor (screen space). */
export function wallTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#3f5a78');
    s.addColorStop(0.55, '#5f7c99');
    s.addColorStop(1, '#8da4b8');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/** The painted table: an open frame on four legs. The ice lies across the two long rails over the opening. */
function createTable() {
  const g = new THREE.Group();
  g.name = 'Table';
  const top = std('#d48a78', { roughness: 0.55 });
  const leg = std('#bf7260', { roughness: 0.6 });
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const xr = TABLE.x / 2 - TABLE.rail / 2;
  for (const sx of [-1, 1]) box(TABLE.rail, TABLE.thick, TABLE.z, top, sx * xr, -TABLE.thick / 2, 0);
  const bx = TABLE.x - 2 * TABLE.rail;
  for (const sz of [-1, 1]) box(bx, TABLE.thick, TABLE.beam, top, 0, -TABLE.thick / 2, sz * (TABLE.z / 2 - TABLE.beam / 2));
  const lh = -GROUND - TABLE.thick;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) box(0.05, lh, 0.05, leg, sx * (TABLE.x / 2 - 0.04), -TABLE.thick - lh / 2, sz * (TABLE.z / 2 - 0.04));
  return g;
}

/** A frosty, uneven see-through-ness for the ice (an alpha map): clearer in places, milky in others, a few fine cracks. */
function frostMap() {
  let seed = 7;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#9a9a9a';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 14 + rnd() * 40;
      const k = g.createRadialGradient(x, y, 0, x, y, r);
      const v = rnd() < 0.5 ? '255,255,255' : '40,40,40';
      k.addColorStop(0, `rgba(${v},0.22)`);
      k.addColorStop(1, `rgba(${v},0)`);
      g.fillStyle = k;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      let x = rnd() * w;
      let y = rnd() * h;
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += (rnd() - 0.5) * 60;
        y += (rnd() - 0.5) * 60;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** The block of ice: pale see-through blue with bright edges (it casts no shadow of its own), and its two effects. */
export function createIce() {
  const root = new THREE.Group();
  root.name = 'Ice';
  root.position.y = ICE.y / 2;
  const geo = new THREE.BoxGeometry(ICE.x, ICE.y, ICE.z);
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#bfe0fa',
    transparent: true,
    opacity: 0.85,
    alphaMap: frostMap(),
    roughness: 0.1,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.3,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const block = new THREE.Mesh(geo, mat);
  block.renderOrder = 5;
  root.add(block);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, toneMapped: false }),
  );
  edges.renderOrder = 6;
  root.add(edges);
  // the faint refrozen seam above the wire: from the wire up to the top, across the whole depth
  const seamMat = new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false });
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.006, 1, ICE.z - 0.004), seamMat);
  seam.renderOrder = 4;
  seam.visible = false;
  root.add(seam);
  // the film of water just under the wire (a bright blue sheet; the pressure melts the ice there)
  const filmMat = new THREE.MeshBasicMaterial({ color: '#2d9cff', transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false });
  const film = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.007, ICE.z - 0.004), filmMat);
  film.renderOrder = 4;
  film.visible = false;
  root.add(film);
  return { root, block, seam, seamMat, film, filmMat };
}

/** The wire over the block with a weight at each end. One group: it moves up and down as a whole. */
export function createRig() {
  const root = new THREE.Group();
  root.name = 'WireAndWeights';
  const wireMat = std('#39414b', { roughness: 0.35, metalness: 0.7, transparent: true });
  const iron = std('#4a4f57', { roughness: 0.4, metalness: 0.65, transparent: true });
  const lid = std('#8a9099', { roughness: 0.35, metalness: 0.75, transparent: true });
  const mats = [wireMat, iron, lid];
  const up = new THREE.Vector3(0, 1, 0);
  const seg = (a, b) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(WIRE_R, WIRE_R, d.length(), 10), wireMat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(up, d.normalize());
    root.add(m);
    return m;
  };
  const ball = new THREE.SphereGeometry(WIRE_R * 1.05, 10, 8);
  const joint = (p) => {
    const m = new THREE.Mesh(ball, wireMat);
    m.position.copy(p);
    root.add(m);
  };
  const hz = ICE.z / 2 + 0.0015;
  const pickables = [];
  pickables.push(seg(new THREE.Vector3(0, 0, -hz), new THREE.Vector3(0, 0, hz)));
  const zf = hz + HANG.out;
  for (const sz of [-1, 1]) {
    const a = new THREE.Vector3(0, 0, sz * hz);
    const b = new THREE.Vector3(0, -HANG.slant, sz * zf);
    const c = new THREE.Vector3(0, -HANG.drop, sz * zf);
    pickables.push(seg(a, b), seg(b, c));
    joint(a);
    joint(b);
    // the weight: a short iron cylinder with a lighter lid and a ring to hang it by
    const w = new THREE.Group();
    w.position.set(0, -HANG.drop - 0.012 - WEIGHT.h / 2, sz * zf);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(WEIGHT.r, WEIGHT.r * 1.03, WEIGHT.h, 28), iron);
    body.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(WEIGHT.r * 0.96, WEIGHT.r * 0.96, 0.006, 28), lid);
    cap.position.y = WEIGHT.h / 2 + 0.002;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0035, 8, 16), lid);
    ring.position.y = WEIGHT.h / 2 + 0.012;
    w.add(body, cap, ring);
    root.add(w);
    pickables.push(body);
    seg(c, new THREE.Vector3(0, -HANG.drop - 0.012, sz * zf));
  }
  /** Fade the whole rig in or out (0 … 1). */
  function setAlpha(a) {
    for (const m of mats) {
      m.opacity = a;
      m.depthWrite = a > 0.98;
    }
    root.visible = a > 0.01;
  }
  /** Local points the labels hang on (relative to the rig's group). */
  const pointOf = {
    wire: new THREE.Vector3(0, -HANG.slant * 0.55, hz + HANG.out * 0.55),
    weight: new THREE.Vector3(0, -HANG.drop - 0.012 - WEIGHT.h * 0.35, zf + WEIGHT.r * 0.8),
  };
  return { root, pickables, setAlpha, pointOf };
}

export function createWorld() {
  const root = new THREE.Group();
  root.name = 'World';
  const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 48).rotateX(-Math.PI / 2), std('#a8998a', { roughness: 0.9 }));
  floor.position.y = GROUND;
  floor.receiveShadow = true;
  root.add(floor);
  const table = createTable();
  root.add(table);
  return { root, table, floor };
}
