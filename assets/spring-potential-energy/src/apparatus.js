// The apparatus (metres): a navy wall block with a steel plate, a magenta coil spring screwed to it, a steel end cap
// with a wooden handle bar, and a yellow centimetre ruler on the bench with its 0 under the spring's free end at rest.
// Vivid colours on purpose: they stand out on the wooden bench and the sky-blue wall. The spring is a real helix of
// wire: setEnd(x) moves its coils so they spread out when it is pulled and bunch up when it is pushed in (the number
// of turns stays the same). The tube is built once; a new length only rewrites its vertices in place.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { REST_LENGTH } from './spring-maths.js';

export const AXIS = { y: 0.1, z: 0 }; // the spring's axis above the bench
export const COIL = { radius: 0.022, wire: 0.0029, turns: 13 };
export const X0 = REST_LENGTH; // the free end at rest: the x = 0 line
export const HUB = 0.012; // the coil starts this far from the wall's face
export const CAP = 0.008; // the end cap's thickness
export const BAR = { offset: 0.038, radius: 0.0105, length: 0.1 }; // the handle bar: its centre this far past the cap
export const RULER = { z: 0, width: 0.042, from: -12, to: 12 }; // cm either side of 0, right under the spring

const RULER_PX = { w: 1024, h: 128, margin: 32 }; // the ruler's face: 40 px per cm
const RULER_CM = (RULER_PX.w - 2 * RULER_PX.margin) / (RULER.to - RULER.from);

/** A ruler's face as a canvas texture: cm ticks, mm ticks, numbers every 5 cm (no signs: the dashed line is 0). */
function rulerTexture(num, unit) {
  const cm = RULER_CM;
  const c = document.createElement('canvas');
  c.width = RULER_PX.w;
  c.height = RULER_PX.h;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, '#ffe066');
  g.addColorStop(1, '#fcc419');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#1b1f3b';
  ctx.fillStyle = '#1b1f3b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (let mm = RULER.from * 10; mm <= RULER.to * 10; mm++) {
    const x = RULER_PX.margin + ((mm - RULER.from * 10) / 10) * cm;
    const whole = mm % 10 === 0;
    const five = mm % 50 === 0;
    ctx.lineWidth = whole ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, five ? 52 : whole ? 40 : mm % 5 === 0 ? 27 : 19);
    ctx.stroke();
    if (whole && five) {
      ctx.font = '700 48px "Noto Sans Bengali", sans-serif';
      ctx.fillText(num(Math.abs(mm / 10)), x, 106);
    }
  }
  ctx.font = '600 26px "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(unit, RULER_PX.margin + 0.25 * cm, 112);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** The wall's face: navy with the diagonal hatching that marks a fixed wall in physics drawings. */
function wallTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  ctx.fillStyle = '#28337f';
  ctx.fillRect(0, 0, 128, 256);
  ctx.strokeStyle = 'rgba(165, 216, 255, 0.4)';
  ctx.lineWidth = 3;
  for (let d = -256; d < 256; d += 22) {
    ctx.beginPath();
    ctx.moveTo(d, 256);
    ctx.lineTo(d + 256, 0);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
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

/**
 * The spring's wire: a tube round the helix, built once (rings × sides vertices, indexed); write() moves every vertex
 * for the helix's current ends, in place. The ring's frame: the tangent T, N = T × the axis (never parallel to T),
 * B = N × T; it turns smoothly along the wire, so the round tube shows no twist.
 */
function createWire(helix) {
  const rings = COIL.turns * 26 + 1;
  const sides = 10;
  const pos = new Float32Array(rings * sides * 3);
  const nor = new Float32Array(rings * sides * 3);
  const index = new Uint16Array((rings - 1) * sides * 6);
  let n = 0;
  for (let i = 0; i < rings - 1; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j;
      const b = i * sides + ((j + 1) % sides);
      const c = a + sides;
      const d = b + sides;
      index.set([a, c, b, b, c, d], n);
      n += 6;
    }
  const geometry = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const norAttr = new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', posAttr);
  geometry.setAttribute('normal', norAttr);
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  // the spring at its longest fits in this: no bounds to recompute per length
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0.22, AXIS.y, AXIS.z), 0.24);
  geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-0.01, AXIS.y - 0.03, -0.03), new THREE.Vector3(0.45, AXIS.y + 0.03, 0.03));
  const cos = Float32Array.from({ length: sides }, (_, j) => Math.cos((j / sides) * Math.PI * 2));
  const sin = Float32Array.from({ length: sides }, (_, j) => Math.sin((j / sides) * Math.PI * 2));
  const P = new THREE.Vector3();
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const Bn = new THREE.Vector3();
  const X = new THREE.Vector3(1, 0, 0);
  const eps = 1e-4;
  function write() {
    for (let i = 0; i < rings; i++) {
      const u = i / (rings - 1);
      helix.getPoint(u, P);
      helix.getPoint(Math.min(1, u + eps), B);
      helix.getPoint(Math.max(0, u - eps), A);
      T.subVectors(B, A).normalize();
      N.crossVectors(T, X).normalize();
      Bn.crossVectors(N, T);
      for (let j = 0; j < sides; j++) {
        const k = (i * sides + j) * 3;
        const nx = cos[j] * N.x + sin[j] * Bn.x;
        const ny = cos[j] * N.y + sin[j] * Bn.y;
        const nz = cos[j] * N.z + sin[j] * Bn.z;
        nor[k] = nx;
        nor[k + 1] = ny;
        nor[k + 2] = nz;
        pos[k] = P.x + COIL.wire * nx;
        pos[k + 1] = P.y + COIL.wire * ny;
        pos[k + 2] = P.z + COIL.wire * nz;
      }
    }
    posAttr.needsUpdate = true;
    norAttr.needsUpdate = true;
  }
  return { geometry, write };
}

/** Plain parts in two tones of steel, one geometry with vertex colours. */
function steelParts(parts) {
  return mergeGeometries(
    parts.map(([g, color, x, y, z]) => {
      const geo = g.toNonIndexed().translate(x, y, z);
      g.dispose();
      const c = new THREE.Color(color);
      const rgb = new Float32Array(geo.attributes.position.count * 3);
      for (let i = 0; i < rgb.length; i += 3) c.toArray(rgb, i);
      geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
      geo.deleteAttribute('uv');
      return geo;
    }),
  );
}

export function createApparatus({ num = String, unit = 'cm', springColor = '#e0317a' } = {}) {
  const root = new THREE.Group();
  root.name = 'SpringApparatus';
  const M = {
    board: new THREE.MeshStandardMaterial({ name: 'Wall', color: '#28337f', roughness: 0.6 }),
    wallFace: new THREE.MeshStandardMaterial({ name: 'WallFace', map: wallTexture(), roughness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ name: 'Steel', vertexColors: true, metalness: 0.95, roughness: 0.32 }),
    spring: new THREE.MeshPhysicalMaterial({
      name: 'Spring',
      color: springColor,
      metalness: 0.35,
      roughness: 0.28,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    }),
    handle: new THREE.MeshStandardMaterial({ name: 'Handle', color: '#a0612f', roughness: 0.42 }),
    ruler: new THREE.MeshStandardMaterial({ name: 'Ruler', map: rulerTexture(num, unit), roughness: 0.5 }),
  };
  const mesh = (geometry, material, name, parent = root, { cast = true, receive = false } = {}) => {
    const m = new THREE.Mesh(geometry, material);
    m.name = name;
    m.castShadow = cast;
    m.receiveShadow = receive;
    parent.add(m);
    return m;
  };

  // the wall, a solid block upright at the bench's left (picture (a) of the owner's reference: the spring fixed to a
  // wall), hatched on the face the spring is screwed to
  const board = mesh(new THREE.BoxGeometry(0.03, 0.42, 0.3), [M.wallFace, M.board, M.board, M.board, M.board, M.board], 'Wall');
  board.position.set(-0.015, 0.21, -0.06);
  // its steel plate, four screws and the hub the coil starts from: one mesh
  const rz = (g) => g.rotateZ(Math.PI / 2);
  const screw = () => new THREE.SphereGeometry(0.0042, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2);
  mesh(
    steelParts([
      [rz(new THREE.CylinderGeometry(0.036, 0.036, 0.004, 40)), '#d7dde4', 0.002, AXIS.y, AXIS.z],
      [rz(new THREE.CylinderGeometry(0.013, 0.015, HUB, 28)), '#d7dde4', HUB / 2 + 0.002, AXIS.y, AXIS.z],
      ...[
        [0.024, 0.024],
        [0.024, -0.024],
        [-0.024, 0.024],
        [-0.024, -0.024],
      ].map(([dy, dz]) => [screw(), '#9aa3ad', 0.004, AXIS.y + dy, AXIS.z + dz]),
    ]),
    M.steel,
    'WallPlate',
  );

  // the ruler on the bench, 0 under the free end at rest; one material: its edges show a plain yellow corner of the
  // face's picture (the margin before the first tick)
  const span = (RULER.to - RULER.from + (2 * RULER_PX.margin) / RULER_CM) / 100;
  const rulerGeo = new THREE.BoxGeometry(span, 0.003, RULER.width);
  {
    const uv = rulerGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) if (i < 8 || i >= 12) uv.setXY(i, 6 / RULER_PX.w, 0.06);
    rulerGeo.clearGroups();
  }
  const ruler = mesh(rulerGeo, M.ruler, 'Ruler', root, { cast: false, receive: true });
  // the top face's u runs along +x and the canvas's top row lies at the back edge: ticks by the spring, numbers in front
  ruler.position.set(X0 + (RULER.from + RULER.to) / 200, 0.0015, RULER.z);

  // the spring (its vertices follow the end), the end cap and the handle (they move together)
  const helix = new Helix();
  const wire = createWire(helix);
  const spring = mesh(wire.geometry, M.spring, 'Spring');
  const end = new THREE.Group();
  end.name = 'SpringEnd';
  root.add(end);
  const capGeo = steelParts([
    [rz(new THREE.CylinderGeometry(COIL.radius + 0.004, COIL.radius + 0.004, CAP, 36)), '#d7dde4', 0, AXIS.y, AXIS.z],
    [rz(new THREE.CylinderGeometry(0.0055, 0.0055, BAR.offset, 16)), '#d7dde4', BAR.offset / 2, AXIS.y, AXIS.z],
  ]);
  const cap = mesh(capGeo, M.steel, 'EndCap', end);
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
    wire.write();
    end.position.x = x;
  }
  setEnd(X0);

  const box = new THREE.Box3();
  const box2 = new THREE.Box3();
  return {
    root,
    hit,
    spring,
    setEnd,
    /** The handle bar's centre now (scene frame). */
    barCentre: (out = new THREE.Vector3()) => out.set(endX + BAR.offset, AXIS.y, AXIS.z),
    /** The end cap and the handle as a box (the action's ring), without the hit box. */
    endBox: () => box.setFromObject(cap).union(box2.setFromObject(bar)),
    materials: M,
  };
}
