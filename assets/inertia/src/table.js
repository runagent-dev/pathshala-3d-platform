// The coin-and-card trick on a table, in metres (the same left-facing view as the bus: +x is the way the card
// is flicked): a drinking glass, a card lying on its rim, a ৫ টাকা coin on the card, and a finger that flicks
// the card. setState(s) places the card, the coin and the finger from ./motion.js (sampleAt('coin', t)).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { textMesh } from '@shared/student/materials.js';
import { TABLE } from './motion.js';
import { tableTexture, wallTexture } from './textures.js';

export function createTable({ t }) {
  const { glass: G, card: C, coin: K } = TABLE;
  const root = new THREE.Group();
  root.name = 'CoinAndCard';

  // a wooden table top (the card, the coin and the glass stand out on its warm brown), against a plastered wall
  const woodMap = tableTexture();
  woodMap.repeat.set(1.4 / 0.5, 0.8 / 0.5);
  const wood = new THREE.MeshStandardMaterial({ name: 'TableTop', map: woodMap, roughness: 0.6 });
  const board = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.03, 0.8, 2, 0.006), wood);
  board.name = 'Table';
  board.position.set(0.18, -0.015, 0.2);
  board.receiveShadow = true;
  root.add(board);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.2),
    new THREE.MeshStandardMaterial({ name: 'Wall', map: wallTexture(), roughness: 0.95 }),
  );
  wall.name = 'Wall';
  wall.rotation.y = Math.PI; // it faces the camera (which looks along +z)
  wall.position.set(0.18, 0.5, 0.62);
  wall.userData.noExport = true;
  root.add(wall);

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
  const rimMat = new THREE.MeshStandardMaterial({ name: 'GlassRim', color: 0x8fb4c8, roughness: 0.2, transparent: true, opacity: 0.75 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(G.r - G.wall / 2, G.wall / 2 + 0.0004, 8, 48).rotateX(Math.PI / 2), rimMat);
  rim.position.y = G.h;
  rim.name = 'GlassRim';
  root.add(rim);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r0 - G.wall, r0, G.base, 40), rimMat);
  base.position.y = G.base / 2;
  base.name = 'GlassBase';
  root.add(base);

  // the card (a stiff index card) and the coin (৫ টাকা, steel)
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(C.w, C.th, C.d),
    new THREE.MeshStandardMaterial({ name: 'Card', color: 0xf6e3a3, roughness: 0.85 }),
  );
  card.name = 'Card';
  root.add(card);
  const coin = new THREE.Group();
  coin.name = 'Coin';
  const steel = new THREE.MeshStandardMaterial({ name: 'CoinSteel', color: 0xcfd3d8, roughness: 0.32, metalness: 0.85 });
  coin.add(new THREE.Mesh(new THREE.CylinderGeometry(K.r, K.r, K.th, 40), steel));
  const five = textMesh(t.num('5'), K.r * 0.95, { color: '#6c737b', weight: 700 });
  five.rotation.x = -Math.PI / 2;
  five.rotation.z = Math.PI; // read from the camera's side
  five.position.y = K.th / 2 + 0.0002;
  coin.add(five);
  root.add(coin);

  // the hand that flicks the card, coming in from the right of the picture: a fist with the forefinger out, and a
  // white shirt cuff (so it reads as a hand against the wooden table)
  const skin = new THREE.MeshStandardMaterial({ name: 'Skin', color: 0xa86f47, roughness: 0.6 });
  const hand = new THREE.Group();
  hand.name = 'Hand';
  const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.036, 4, 12).rotateZ(Math.PI / 2), skin);
  finger.position.x = -0.0265; // its tip at the group's origin
  const nail = new THREE.Mesh(
    new THREE.SphereGeometry(0.0075, 12, 8),
    new THREE.MeshStandardMaterial({ name: 'Nail', color: 0xe6bfa2, roughness: 0.35 }),
  );
  nail.scale.set(1.3, 0.45, 0.9);
  nail.position.set(-0.009, 0.0068, 0);
  const fist = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.045, 0.07, 3, 0.02), skin);
  fist.position.set(-0.085, 0.004, 0.012);
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.03, 4, 10).rotateZ(Math.PI / 2), skin);
  thumb.position.set(-0.06, -0.006, -0.026);
  const cuff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.036, 0.06, 20).rotateZ(Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Cuff', color: 0xf4f6f8, roughness: 0.8 }),
  );
  cuff.position.set(-0.15, 0.006, 0.014);
  hand.add(finger, nail, fist, thumb, cuff);
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
