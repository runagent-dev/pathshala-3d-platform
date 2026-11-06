// The coin-and-card trick on a table, in metres (the same left-facing view as the bus: +x is the way the card
// is flicked): a drinking glass, a card lying on its rim, a ৫ টাকা coin on the card, and a finger that flicks
// the card. setState(s) places the card, the coin and the finger from ./motion.js (sampleAt('coin', t)).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { textMesh } from '@shared/student/materials.js';
import { TABLE } from './motion.js';
import { cardTexture } from './textures.js';

export function createTable({ t }) {
  const { glass: G, card: C, coin: K } = TABLE;
  const root = new THREE.Group();
  root.name = 'CoinAndCard';

  // a plain table top in a light sand colour, no grain: the white card, the steel coin, the clear glass (its darker
  // rim) and the hand all stand out on it, and it stands out on the deep-blue backdrop (textures.js, set in app.js)
  const top = new THREE.MeshStandardMaterial({ name: 'TableTop', color: 0xbca27a, roughness: 0.85, metalness: 0 });
  const board = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.03, 0.8, 2, 0.006), top);
  board.name = 'Table';
  board.position.set(0.18, -0.015, 0.2);
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
  // a soft contact shadow under the glass (one ring, darkest at the foot, fading out; no texture): the clear glass
  // casts no shadow of its own
  const shade = new THREE.RingGeometry(0, r0 * 1.6, 32, 4).rotateX(-Math.PI / 2);
  const pos = shade.attributes.position;
  const rgba = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    rgba[i * 4 + 3] = r <= r0 * 1.02 ? 0.3 : Math.max(0, 0.3 * (1 - (r - r0) / (r0 * 0.6)) ** 2);
  }
  shade.setAttribute('color', new THREE.BufferAttribute(rgba, 4));
  const contact = new THREE.Mesh(
    shade,
    new THREE.MeshBasicMaterial({ name: 'ContactShadow', vertexColors: true, transparent: true, depthWrite: false }),
  );
  contact.position.y = 0.0004;
  contact.name = 'ContactShadow';
  contact.userData.noExport = true;
  root.add(contact);

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
      card.position.set(s.cardX, s.cardY, 0);
      card.rotation.z = -s.cardTilt; // its front edge dips as it falls
      coin.position.set(s.coinX, s.coinY, 0);
      hand.position.set(s.finger, TABLE.glass.h + C.th / 2, 0);
    },
  };
}
