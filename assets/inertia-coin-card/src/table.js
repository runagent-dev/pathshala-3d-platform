// The coin-and-card trick on a table, in metres (the same left-facing view as the bus: +x is the way the card
// is flicked): a drinking glass, a card lying on its rim, a ৫ টাকা coin on the card, and a finger that flicks
// the card. setState(s) places the card, the coin and the finger from ./motion.js (sampleAt('coin', t)).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { textMesh } from '@shared/student/materials.js';
import { TABLE, simulate } from './motion.js';
import { cardTexture } from './textures.js';

/** The tabletop, m: x from x0 to x1 (the card flies towards +x), z from z0 (the camera's side) to z1; corner radius, thickness. */
export const SLAB = { x0: -0.13, x1: 0.15, z0: -0.06, z1: 0.17, r: 0.04, th: 0.022 };

/** Where the event has the card come down to table height, and how fast it moves along x then (m, m/s). */
const LAND = (() => {
  const T = simulate('coin');
  const i = T.cardY.findIndex((y, k) => k > 0 && T.cardX[k] > 0.05 && y <= TABLE.card.th / 2 + 1e-4);
  return { x: T.cardX[i], v: Math.max(0.5, T.cardV[i]) };
})();

/** A rounded rectangle in the (x, y) plane, y standing for z after the slab's turn. */
function roundedRect(x0, x1, y0, y1, r) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r);
  s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1);
  s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

/** Points round a rounded rectangle grown by `grow` m (the same count and order for any grow). */
function outline({ x0, x1, z0, z1, r }, grow, per = 6) {
  const pts = [];
  const corners = [
    [x1 - r, z0 + r, -Math.PI / 2],
    [x1 - r, z1 - r, 0],
    [x0 + r, z1 - r, Math.PI / 2],
    [x0 + r, z0 + r, Math.PI],
  ];
  for (const [cx, cz, a0] of corners) {
    for (let k = 0; k <= per; k++) {
      const a = a0 + (k / per) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * (r + grow), cz + Math.sin(a) * (r + grow)]);
    }
  }
  return pts;
}

/** A soft shadow under the slab at height y: dark (alpha) under it, fading out over `spread` m beyond its edge. */
function slabShadow(slab, y, spread, alpha) {
  const inner = outline(slab, -0.02);
  const outer = outline(slab, spread);
  const cx = (slab.x0 + slab.x1) / 2;
  const cz = (slab.z0 + slab.z1) / 2;
  const P = [];
  const A = [];
  const put = ([x, z], a) => {
    P.push(x, y, z);
    A.push(0, 0, 0, a);
  };
  for (let i = 0; i < inner.length; i++) {
    const j = (i + 1) % inner.length;
    put([cx, cz], alpha);
    put(inner[j], alpha);
    put(inner[i], alpha);
    put(inner[i], alpha);
    put(inner[j], alpha);
    put(outer[i], 0);
    put(outer[i], 0);
    put(inner[j], alpha);
    put(outer[j], 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(A, 4));
  return g;
}

export function createTable({ t }) {
  const { glass: G, card: C, coin: K } = TABLE;
  const root = new THREE.Group();
  root.name = 'CoinAndCard';

  // a small tabletop that sits in the deep-blue backdrop (textures.js, set in app.js): a rounded slab, light sand on
  // top and a darker band round its edge (vertex colours, one draw), with a soft shadow under it. The white card,
  // the steel coin, the clear glass (its darker rim) and the hand all stand out on the sand, and the slab on the blue.
  const slab = new THREE.ExtrudeGeometry(roundedRect(SLAB.x0, SLAB.x1, SLAB.z0, SLAB.z1, SLAB.r), {
    depth: SLAB.th - 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 8,
  })
    .rotateX(Math.PI / 2) // the shape's (x, y) becomes (x, z); it extrudes downwards
    .translate(0, -0.004, 0); // its top (with the bevel) at y = 0
  slab.clearGroups();
  const sand = new THREE.Color(0xbca27a);
  const band = new THREE.Color(0x8a724f);
  const n = slab.attributes.normal;
  const tint = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) {
    const c = n.getY(i) > 0.9 ? sand : band;
    c.toArray(tint, i * 3);
  }
  slab.setAttribute('color', new THREE.BufferAttribute(tint, 3));
  const board = new THREE.Mesh(slab, new THREE.MeshStandardMaterial({ name: 'TableTop', vertexColors: true, roughness: 0.85, metalness: 0 }));
  board.name = 'Table';
  board.receiveShadow = true;
  root.add(board);

  // the glass: one turned outline (outside, rim, inside, thick base), see-through
  const r0 = G.r - 0.004;
  const profile = [
    [0, 0],
    [r0, 0],
    [G.r, G.h],
    [G.r - G.wall, G.h],
    [r0 - G.wall, G.base],
    [0, G.base],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const glassMat = new THREE.MeshPhysicalMaterial({
    name: 'Glass',
    color: 0xb8d8ea,
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const cup = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), glassMat);
  cup.name = 'Glass';
  cup.renderOrder = 3;
  root.add(cup);
  // the rim and the base in a darker blue-grey, so the clear glass shows its edges on the pale table and on the blue
  const rimMat = new THREE.MeshStandardMaterial({ name: 'GlassRim', color: 0x58798e, roughness: 0.2, transparent: true, opacity: 0.85 });
  // (one mesh, one draw)
  const rim = mergeGeometries([
    new THREE.TorusGeometry(G.r - G.wall / 2, G.wall / 2 + 0.0004, 8, 48).rotateX(Math.PI / 2).translate(0, G.h, 0),
    new THREE.CylinderGeometry(r0 - G.wall, r0, G.base, 40).translate(0, G.base / 2, 0),
  ]);
  const edges = new THREE.Mesh(rim, rimMat);
  edges.name = 'GlassRim';
  root.add(edges);
  // the soft shadows, one mesh (black, the alpha fading out; no texture): a contact shadow at the glass's foot (the
  // clear glass casts none of its own) and a wide one under the tabletop, seen against the blue
  const foot = new THREE.RingGeometry(0, r0 * 1.6, 32, 4).rotateX(-Math.PI / 2).translate(0, 0.0004, 0);
  foot.deleteAttribute('normal');
  foot.deleteAttribute('uv');
  const pos = foot.attributes.position;
  const footAlpha = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    footAlpha[i * 4 + 3] = r <= r0 * 1.02 ? 0.3 : Math.max(0, 0.3 * (1 - (r - r0) / (r0 * 0.6)) ** 2);
  }
  foot.setAttribute('color', new THREE.BufferAttribute(footAlpha, 4));
  const shade = new THREE.Mesh(
    mergeGeometries([foot.toNonIndexed(), slabShadow(SLAB, -0.07, 0.07, 0.4)]),
    new THREE.MeshBasicMaterial({ name: 'SoftShadow', vertexColors: true, transparent: true, depthWrite: false }),
  );
  shade.name = 'SoftShadow';
  shade.userData.noExport = true;
  root.add(shade);

  // the card (a stiff ruled index card: printed white top, plain off-white edges) and the coin (৫ টাকা, steel: a raised rim,
  // a reeded edge and the figure 5 standing up from the face)
  const edge = new THREE.MeshStandardMaterial({ name: 'CardEdge', color: 0xe4e2da, roughness: 0.9 });
  const face = new THREE.MeshStandardMaterial({ name: 'Card', map: cardTexture(), roughness: 0.85 });
  const card = new THREE.Mesh(new THREE.BoxGeometry(C.w, C.th, C.d), [edge, edge, face, edge, edge, edge]);
  card.name = 'Card';
  root.add(card);
  const coin = new THREE.Group();
  coin.name = 'Coin';
  const steel = new THREE.MeshStandardMaterial({ name: 'CoinSteel', color: 0xcfd3d8, roughness: 0.32, metalness: 0.85 });
  const ribs = 60; // the reeded edge: a ring of shallow grooves
  const ring = [];
  for (let i = 0; i <= ribs * 2; i++) {
    const a = (i / (ribs * 2)) * Math.PI * 2;
    ring.push(new THREE.Vector2(Math.cos(a), Math.sin(a)).multiplyScalar(i % 2 ? K.r * 0.985 : K.r));
  }
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(new THREE.Shape(ring), { depth: K.th * 0.8, bevelEnabled: false, curveSegments: 1 })
      .rotateX(-Math.PI / 2)
      .translate(0, -K.th * 0.4, 0),
    steel,
  );
  const lip = new THREE.Mesh(new THREE.TorusGeometry(K.r * 0.9, K.th * 0.16, 6, 48).rotateX(Math.PI / 2), steel);
  lip.position.y = K.th * 0.4;
  coin.add(body, lip);
  const five = textMesh(t.num('5'), K.r * 0.95, { color: '#6c737b', weight: 700 });
  five.rotation.x = -Math.PI / 2;
  five.rotation.z = Math.PI; // read from the camera's side
  five.position.y = K.th * 0.4 + 0.0002;
  coin.add(five);
  root.add(coin);

  // the hand that flicks the card, coming in from the right of the picture: the forefinger out (three phalanges, a
  // nail, knuckle creases), the other three fingers curled under the palm, the thumb along the side, a wrist and a
  // white shirt cuff (darker than the sand table, so it reads as a hand on it)
  const skin = new THREE.MeshStandardMaterial({ name: 'Skin', color: 0xa86f47, roughness: 0.6 });
  const crease = new THREE.MeshStandardMaterial({ name: 'Crease', color: 0x8a5634, roughness: 0.7 });
  const hand = new THREE.Group();
  hand.name = 'Hand';
  const along = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 12).rotateZ(Math.PI / 2);
  const phal = [
    [0.0078, 0.014, -0.011],
    [0.0083, 0.016, -0.032],
    [0.0088, 0.02, -0.056],
  ]; // radius, length, centre x (the tip is at the group's origin)
  for (const [r, len, x] of phal) {
    const p = new THREE.Mesh(along(r, len), skin);
    p.position.x = x;
    hand.add(p);
  }
  for (const x of [-0.021, -0.043]) {
    const c = new THREE.Mesh(new THREE.TorusGeometry(0.0083, 0.0007, 4, 16, Math.PI).rotateY(Math.PI / 2), crease);
    c.position.x = x;
    hand.add(c);
  }
  const nail = new THREE.Mesh(
    new THREE.SphereGeometry(0.0075, 12, 8),
    new THREE.MeshStandardMaterial({ name: 'Nail', color: 0xe6bfa2, roughness: 0.35 }),
  );
  nail.scale.set(1.2, 0.4, 0.85);
  nail.position.set(-0.008, 0.0062, 0);
  const palm = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.034, 0.075, 3, 0.014), skin);
  palm.position.set(-0.104, 0.008, 0.016);
  hand.add(nail, palm);
  for (let i = 0; i < 3; i++) {
    // the curled fingers: a knuckle row under the palm's front edge
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.012, 4, 10), skin);
    f.rotation.x = Math.PI / 2;
    f.position.set(-0.07, -0.006, 0.014 + i * 0.019);
    f.rotation.z = 0.3;
    hand.add(f);
  }
  const thumb = new THREE.Mesh(along(0.0092, 0.034), skin);
  thumb.position.set(-0.078, -0.004, -0.024);
  thumb.rotation.y = 0.35;
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.05, 20).rotateZ(Math.PI / 2), skin);
  wrist.position.set(-0.16, 0.008, 0.016);
  const cuff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.036, 0.06, 20).rotateZ(Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Cuff', color: 0xf4f6f8, roughness: 0.8 }),
  );
  cuff.position.set(-0.205, 0.008, 0.016);
  const button = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.002, 12).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Button', color: 0xdfe3e6, roughness: 0.4 }),
  );
  button.position.set(-0.2, 0.012, -0.019);
  hand.add(thumb, wrist, cuff, button);
  root.add(hand);

  // a big invisible box round the glass and the card: a tap there flicks the card
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.16), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(-0.02, 0.09, 0);
  hit.userData.noExport = true;
  hit.name = 'TableHit';
  root.add(hit);

  return {
    root,
    hit,
    coin,
    card,
    glass: cup,
    /** Place the card, the coin and the finger (a sample of the coin event). */
    setState(s) {
      // past the tabletop's edge there is nothing under the card: where the event has it land on the (old, wide)
      // table, it keeps falling instead, and goes once it is well below the slab (the motion itself is unchanged)
      let y = s.cardY;
      if (s.cardX > LAND.x && s.cardX - C.w / 2 > SLAB.x1) y -= 4.9 * ((s.cardX - LAND.x) / LAND.v) ** 2;
      card.visible = y > -0.15;
      card.position.set(s.cardX, y, 0);
      card.rotation.z = -s.cardTilt; // its front edge dips as it falls
      coin.position.set(s.coinX, s.coinY, 0);
      hand.position.set(s.finger, TABLE.glass.h + C.th / 2, 0);
    },
  };
}
