// The track, procedural three.js, in metres (1 m on the axis = 1 unit): a long raised road deck the car drives on,
// its front edge a white ruler band, the number line from −7 m to 10 m with a tick every metre (bigger at the
// numbers, a small one at each half metre) and an arrowhead past 10 (the numbers themselves are drawn on the
// figure's 2D overlay, so they keep a readable size on a phone). Under the band, on the deck's pale front face,
// three lanes for the parts of x drawn tip to tail as outlined flat arrows: x₀ (red), ut (blue) and ½at² (green),
// as the owner's reference stacks them under its axis, with a faint line down from 0 where they all start.
import * as THREE from 'three';
import { AXIS } from './motion.js';

export const DECK = { x0: -9.8, x1: 12.2, z: 1.7, band: 0.62, bottom: -2.78 };
/** The lanes' heights (centres) on the front face, top to bottom: x₀, ut, ½at². */
export const LANES = { x0: -1.0, ut: -1.63, half: -2.26 };
/** Where the numbers of the axis go (the overlay projects these). */
export const TICK_LABEL_Y = -0.43;
export const FACE_Z = DECK.z + 0.04; // the band's and the arrows' front

const SHAFT = 0.085; // half height of an arrow's shaft
const HEAD_L = 0.34;
const HEAD_H = 0.21; // half height of the head
const OUT = 0.04; // the dark outline

function mergedBoxes(boxes, material) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, material, boxes.length);
  const m = new THREE.Matrix4();
  boxes.forEach(([x, y, z, w, h, d], i) => {
    m.makeScale(w, h, d).setPosition(x, y, z);
    mesh.setMatrixAt(i, m);
  });
  return mesh;
}

/** A soft light grain for the asphalt (one small canvas texture). */
function asphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5b626b';
  ctx.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 2600; i++) {
    const v = 80 + Math.floor(rnd() * 50);
    ctx.fillStyle = `rgba(${v},${v + 4},${v + 10},${0.35 + rnd() * 0.3})`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 1.6, 1 + rnd() * 1.6);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 1.3);
  tex.anisotropy = 8;
  return tex;
}

/** A flat arrow on the face: a shaft and a head in the quantity's colour over a dark outline; a dot when it is 0. */
function flatArrow(color, outline) {
  const root = new THREE.Group();
  const fill = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 });
  const edge = new THREE.MeshStandardMaterial({ color: outline, roughness: 0.6 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const tri = (l, h, d) => {
    const s = new THREE.Shape();
    s.moveTo(0, -h);
    s.lineTo(l, 0);
    s.lineTo(0, h);
    s.lineTo(0, -h);
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(-l, 0, 0); // the tip at x = 0
    return g;
  };
  const shaftO = new THREE.Mesh(box, edge);
  const shaftF = new THREE.Mesh(box, fill);
  const headO = new THREE.Mesh(tri(HEAD_L + OUT * 2.2, HEAD_H + OUT * 1.6, 0.03), edge);
  const headF = new THREE.Mesh(tri(HEAD_L, HEAD_H, 0.03), fill);
  headO.position.set(OUT * 1.7, 0, 0.0);
  headF.position.z = 0.03;
  const dotO = new THREE.Mesh(new THREE.CircleGeometry(0.11 + OUT, 24), edge);
  const dotF = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), fill);
  dotO.position.z = 0.031;
  dotF.position.z = 0.062;
  const head = new THREE.Group();
  head.add(headO, headF);
  root.add(shaftO, shaftF, head, dotO, dotF);
  return {
    root,
    /** From x = a to x = b at height y on the face. */
    set(a, b, y) {
      const len = Math.abs(b - a);
      const dir = Math.sign(b - a) || 1;
      const zero = len < 0.03;
      dotO.visible = dotF.visible = zero;
      shaftO.visible = shaftF.visible = head.visible = !zero;
      dotO.position.set(a, y, dotO.position.z);
      dotF.position.set(a, y, dotF.position.z);
      if (zero) return;
      const k = Math.min(1, len / (HEAD_L * 1.4)); // a short arrow gets a smaller head
      const hl = HEAD_L * k;
      head.scale.set(dir * k, Math.max(0.6, k), 1); // a negative x scale points it left
      head.position.set(b, y, 0);
      const sl = Math.max(0.001, len - hl);
      const mid = a + (dir * sl) / 2;
      shaftF.scale.set(sl, SHAFT * 2, 0.03);
      shaftF.position.set(mid, y, 0.045);
      shaftO.scale.set(sl + OUT * 2, SHAFT * 2 + OUT * 2, 0.03);
      shaftO.position.set(mid - dir * OUT * 0.5, y, 0.015);
    },
  };
}

export function createTrack({ colors }) {
  const root = new THREE.Group();
  root.name = 'Track';
  const L = DECK.x1 - DECK.x0;
  const cx = (DECK.x0 + DECK.x1) / 2;

  // the deck: asphalt on top, a pale face in front, a darker plinth at the ground
  const asphalt = new THREE.MeshStandardMaterial({ name: 'Asphalt', map: asphaltTexture(), roughness: 0.9, metalness: 0 });
  const face = new THREE.MeshStandardMaterial({ name: 'Face', color: 0xf7f9fc, roughness: 0.85 });
  const side = new THREE.MeshStandardMaterial({ name: 'Concrete', color: 0xaebccb, roughness: 0.9 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(L, 0.14, DECK.z * 2), [side, side, asphalt, side, side, side]);
  deck.position.set(cx, -0.07, 0);
  deck.name = 'Road';
  deck.receiveShadow = true;
  deck.castShadow = true;
  const body = new THREE.Mesh(new THREE.BoxGeometry(L, -DECK.bottom - 0.14, DECK.z * 2 - 0.02), [side, side, side, side, face, side]);
  body.position.set(cx, (DECK.bottom - 0.14) / 2, 0);
  body.name = 'Deck';
  body.receiveShadow = true;
  body.castShadow = true;
  root.add(deck, body);

  // white lines along the road's edges, and a low kerb at the back
  const paint = new THREE.MeshStandardMaterial({ name: 'RoadPaint', color: 0xf3f5f7, roughness: 0.6 });
  const lines = mergedBoxes(
    [
      [cx, 0.004, DECK.z - 0.22, L - 0.4, 0.008, 0.1],
      [cx, 0.004, -DECK.z + 0.25, L - 0.4, 0.008, 0.1],
    ],
    paint,
  );
  lines.receiveShadow = true;
  const kerb = new THREE.Mesh(new THREE.BoxGeometry(L, 0.16, 0.18), side);
  kerb.position.set(cx, 0.08, -DECK.z + 0.09);
  kerb.castShadow = true;
  kerb.receiveShadow = true;
  root.add(lines, kerb);

  // the ruler band at the front edge: white, the axis line with its arrowhead, the ticks
  const white = new THREE.MeshStandardMaterial({ name: 'Ruler', color: 0xfcfcfa, roughness: 0.55 });
  const band = new THREE.Mesh(new THREE.BoxGeometry(L, DECK.band, 0.06), white);
  band.position.set(cx, -DECK.band / 2 + 0.005, DECK.z + 0.01);
  band.receiveShadow = true;
  band.name = 'NumberLine';
  root.add(band);
  const ink = new THREE.MeshStandardMaterial({ name: 'Ink', color: 0x1d2530, roughness: 0.5 });
  const ticks = [];
  const zF = FACE_Z + 0.003;
  ticks.push([(DECK.x0 + 0.3 + AXIS.max + 0.75) / 2, -0.05, zF, AXIS.max + 0.75 - DECK.x0 - 0.3, 0.035, 0.008]); // the axis line
  for (let i = AXIS.min; i <= AXIS.max; i++) {
    ticks.push([i, -0.05 - 0.12, zF, i === 0 ? 0.05 : 0.034, 0.24, 0.008]);
    if (i < AXIS.max) ticks.push([i + 0.5, -0.05 - 0.06, zF, 0.024, 0.12, 0.008]);
  }
  for (let i = AXIS.min - 2; i < AXIS.min; i++) ticks.push([i + 0.5, -0.05 - 0.06, zF, 0.024, 0.12, 0.008]);
  root.add(mergedBoxes(ticks, ink));
  // the arrowhead past 10
  const hs = new THREE.Shape();
  hs.moveTo(0, -0.11);
  hs.lineTo(0.3, 0);
  hs.lineTo(0, 0.11);
  hs.lineTo(0, -0.11);
  const headMesh = new THREE.Mesh(new THREE.ShapeGeometry(hs), ink);
  headMesh.position.set(AXIS.max + 0.72, -0.05, zF + 0.001);
  root.add(headMesh);

  // thin lines between the three lanes, and a darker plinth along the bottom
  const rule = new THREE.MeshStandardMaterial({ name: 'LaneLine', color: 0xd5dde6, roughness: 0.8 });
  const laneTop = (LANES.x0 + LANES.ut) / 2;
  const laneMid = (LANES.ut + LANES.half) / 2;
  root.add(
    mergedBoxes(
      [
        [cx, laneTop, DECK.z + 0.002, L - 0.02, 0.025, 0.004],
        [cx, laneMid, DECK.z + 0.002, L - 0.02, 0.025, 0.004],
      ],
      rule,
    ),
  );
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(L + 0.06, 0.2, DECK.z * 2 + 0.06),
    new THREE.MeshStandardMaterial({ name: 'Plinth', color: 0x8193a8, roughness: 0.85 }),
  );
  plinth.position.set(cx, DECK.bottom + 0.1, 0);
  plinth.receiveShadow = true;
  root.add(plinth);

  // a faint line down the face from 0, where the three parts start
  const faint = new THREE.MeshStandardMaterial({ name: 'Origin', color: 0x9aa8b6, roughness: 0.7 });
  const origin = new THREE.Mesh(new THREE.BoxGeometry(0.03, -DECK.bottom - DECK.band - 0.1, 0.006), faint);
  origin.position.set(0, (DECK.bottom + 0.05 - DECK.band) / 2, DECK.z + 0.003);
  root.add(origin);

  // the three arrows
  const arrows = {
    x0: flatArrow(colors.x0, '#3a0d0d'),
    ut: flatArrow(colors.u, '#0b2346'),
    half: flatArrow(colors.a, '#0f2c15'),
  };
  for (const [k, a] of Object.entries(arrows)) {
    a.root.name = `Arrow ${k}`;
    a.root.position.z = DECK.z;
    root.add(a.root);
  }

  // the car's position on the axis: a dark blue dot on the band's top edge, as the reference's
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 24, 16),
    new THREE.MeshStandardMaterial({ name: 'Dot', color: 0x1f3fd1, roughness: 0.35, emissive: 0x0a1a60, emissiveIntensity: 0.25 }),
  );
  dot.name = 'PositionDot';
  root.add(dot);

  return {
    root,
    dot,
    /** The three parts drawn tip to tail from 0: x₀, then ut, then ½at² ending at x. */
    setParts({ x0, ut, half }) {
      arrows.x0.set(0, x0, LANES.x0);
      arrows.ut.set(x0, x0 + ut, LANES.ut);
      arrows.half.set(x0 + ut, x0 + ut + half, LANES.half);
    },
    setDot(x) {
      dot.position.set(x, -0.02, FACE_Z + 0.02);
    },
  };
}
