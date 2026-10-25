// The small people standing on the Earth, each holding an apple: simple rounded shapes, H tall (drawn many times
// bigger than real, the figure says so). Local +y is up (away from the Earth's centre), the feet are at y = 0 and
// the person faces +z (the viewer in the front view). A person at sea stands in a small wooden boat (নৌকা).
import * as THREE from 'three';

const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });

/** Shared materials for the apples (also used by the apples on the table). */
export function appleMaterials() {
  return {
    skin: new THREE.MeshPhysicalMaterial({ name: 'Apple', color: '#c92a2a', roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
    stem: mat('AppleStem', '#5a3d23', 0.9),
    leaf: mat('AppleLeaf', '#2f9e44', 0.6),
  };
}

/** An apple of radius r: a slightly squat round body with a dimple, a stem and one leaf; its centre at the origin. */
export function createApple(r, M) {
  const root = new THREE.Group();
  root.name = 'Apple';
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI; // from the bottom (0) to the top (π)
    const rr = Math.sin(a) * (1 + 0.06 * Math.sin(a * 2)) * r;
    const y = -Math.cos(a) * r * 0.92 - (i > 20 ? (i - 20) * 0.05 * r : 0) + (i < 3 ? (3 - i) * 0.04 * r : 0);
    pts.push(new THREE.Vector2(Math.max(0.0001, rr), y));
  }
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.skin);
  body.name = 'AppleBody';
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.05, r * 0.07, r * 0.42, 6), M.stem);
  stem.position.set(r * 0.03, r * 0.95, 0);
  stem.rotation.z = -0.25;
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(r * 0.28, r * 0.2, r * 0.6, 0);
  leafShape.quadraticCurveTo(r * 0.28, -r * 0.18, 0, 0);
  const leaf = new THREE.Mesh(new THREE.ShapeGeometry(leafShape, 6), M.leaf);
  leaf.material.side = THREE.DoubleSide;
  leaf.position.set(r * 0.08, r * 1.02, 0);
  leaf.rotation.set(0.3, 0.4, 0.35);
  root.add(body, stem, leaf);
  return root;
}

/**
 * A small wooden boat, `len` long, floating: its keel a little below y = 0 (the sea), its deck `deck` above it
 * (painted like a Bangladeshi নৌকা: a red and blue band).
 */
function createBoat(len) {
  const g = new THREE.Group();
  g.name = 'Boat';
  const h = len * 0.2;
  const side = new THREE.Shape();
  side.moveTo(-len / 2, h * 0.55);
  side.quadraticCurveTo(-len * 0.38, -h * 0.45, 0, -h * 0.45);
  side.quadraticCurveTo(len * 0.38, -h * 0.45, len / 2, h * 0.55);
  side.lineTo(len * 0.42, h * 0.3);
  side.lineTo(-len * 0.42, h * 0.3);
  side.closePath();
  const depth = len * 0.34;
  const hull = new THREE.Mesh(
    new THREE.ExtrudeGeometry(side, {
      depth,
      bevelEnabled: true,
      bevelSize: len * 0.02,
      bevelThickness: len * 0.02,
      bevelSegments: 2,
      curveSegments: 10,
    }),
    mat('BoatWood', '#8a5a33', 0.75),
  );
  hull.position.z = -depth / 2;
  const band = new THREE.Mesh(new THREE.BoxGeometry(len * 0.62, h * 0.16, depth + len * 0.05), mat('BoatBand', '#c2255c', 0.7));
  band.position.y = h * 0.12;
  const band2 = new THREE.Mesh(new THREE.BoxGeometry(len * 0.5, h * 0.12, depth + len * 0.055), mat('BoatBand2', '#1c7ed6', 0.7));
  band2.position.y = -h * 0.08;
  g.add(hull, band, band2);
  g.position.y = h * 0.2; // the keel a little under the water; the deck (the inside of the hull) at h * 0.5
  g.userData.deck = h * 0.5;
  return g;
}

/**
 * One person, H tall, in the given clothes, holding an apple out to one side (+x: the viewer's right in the front
 * view).
 *   clothes: { top, legs, skin, hair, hood? }   (hood: a parka's fur-trimmed hood, for the poles)
 */
export function createPerson({ H, clothes, apple: appleM, name = 'Person' }) {
  const root = new THREE.Group();
  root.name = name;
  const body = new THREE.Group(); // lifted onto the boat's deck at sea
  body.name = `${name}Body`;
  root.add(body);
  const M = {
    top: mat(`${name}Top`, clothes.top),
    legs: mat(`${name}Legs`, clothes.legs),
    skin: mat(`${name}Skin`, clothes.skin ?? '#b27b50', 0.7),
    hair: mat(`${name}Hair`, clothes.hair ?? '#1f1f22', 0.85),
    shoe: mat(`${name}Shoes`, '#2b2f36', 0.6),
  };
  const capsule = (r, len, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), m);

  // legs and shoes (sturdy, cartoon proportions: they must read at a few dozen pixels on a phone)
  for (const sx of [-1, 1]) {
    const leg = capsule(H * 0.066, H * 0.27, M.legs);
    leg.position.set(sx * H * 0.075, H * 0.2, 0);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(H * 0.13, H * 0.06, H * 0.18), M.shoe);
    shoe.position.set(sx * H * 0.078, H * 0.03, H * 0.025);
    body.add(leg, shoe);
  }
  // body
  const torso = capsule(H * 0.15, H * 0.15, M.top);
  torso.scale.z = 0.66;
  torso.position.y = H * 0.53;
  body.add(torso);
  // arms: one down by the side, the other held out with the apple
  const armL = capsule(H * 0.052, H * 0.22, M.top);
  armL.position.set(-H * 0.185, H * 0.5, 0);
  armL.rotation.z = -0.16;
  const handL = new THREE.Mesh(new THREE.SphereGeometry(H * 0.055, 10, 8), M.skin);
  handL.position.set(-H * 0.21, H * 0.35, 0);
  const shoulder = new THREE.Vector3(H * 0.17, H * 0.63, 0);
  const handAt = new THREE.Vector3(H * 0.43, H * 0.56, H * 0.06);
  const armR = capsule(H * 0.052, shoulder.distanceTo(handAt) - H * 0.05, M.top);
  armR.position.copy(shoulder).add(handAt).multiplyScalar(0.5);
  armR.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), handAt.clone().sub(shoulder).normalize());
  const handR = new THREE.Mesh(new THREE.SphereGeometry(H * 0.055, 10, 8), M.skin);
  handR.position.copy(handAt);
  body.add(armL, handL, armR, handR);
  // head and hair (or a parka's hood)
  const HEAD_Y = H * 0.84;
  const head = new THREE.Mesh(new THREE.SphereGeometry(H * 0.13, 20, 16), M.skin);
  head.position.y = HEAD_Y;
  body.add(head);
  if (clothes.hood) {
    const hood = new THREE.Mesh(new THREE.SphereGeometry(H * 0.158, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), M.top);
    hood.position.y = HEAD_Y;
    hood.rotation.x = -0.5;
    const fur = new THREE.Mesh(new THREE.TorusGeometry(H * 0.13, H * 0.032, 8, 24), mat(`${name}Fur`, '#e9e3d6', 0.95));
    fur.position.set(0, HEAD_Y + H * 0.01, H * 0.08);
    body.add(hood, fur);
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(H * 0.137, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), M.hair);
    hair.position.y = HEAD_Y + H * 0.01;
    hair.rotation.x = -0.25;
    body.add(hair);
  }
  // eyes: two dots, so the person clearly faces the viewer
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(H * 0.018, 6, 5), M.hair);
    eye.position.set(sx * H * 0.045, HEAD_Y + H * 0.01, H * 0.12);
    body.add(eye);
  }

  // the apple, resting in the right hand (it is moved in world space when it falls)
  const appleR = H * 0.095;
  const apple = createApple(appleR, appleM);
  const appleRest = handAt.clone().add(new THREE.Vector3(H * 0.01, appleR * 0.9, H * 0.02));
  apple.position.copy(appleRest);
  body.add(apple);

  const boat = createBoat(H * 1.3);
  boat.visible = false;
  root.add(boat);

  // a generous invisible target, so a finger finds the person on a phone
  const hit = new THREE.Mesh(new THREE.BoxGeometry(H * 0.9, H * 1.15, H * 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = H * 0.5;
  hit.userData.noExport = true;
  root.add(hit);

  return {
    root,
    body,
    apple,
    appleR,
    hit,
    H,
    /** The apple's place in the hand, in the person's body frame. */
    appleRest,
    setBoat(on) {
      boat.visible = on;
      body.position.y = on ? boat.userData.deck : 0;
    },
    /** How far above the ground (or the sea) the person's feet are: on the boat's deck at sea. */
    get lift() {
      return boat.visible ? boat.userData.deck : 0;
    },
  };
}
