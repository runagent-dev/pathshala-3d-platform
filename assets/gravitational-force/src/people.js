// The small people standing on the Earth, each holding an apple: simple rounded shapes, H tall (drawn many times
// bigger than real, the figure says so). Local +y is up (away from the Earth's centre), the feet are at y = 0 and
// the person faces +z (the viewer in the front view). A person at sea stands in a small wooden boat (নৌকা).
import * as THREE from 'three';
import { bakeParts } from './draw.js';

// one material for every person's clothes, skin and hair, and one for every boat (vertex colours: one draw call per
// person and per boat, instead of one per part)
let clothM = null;
const clothMaterial = () => (clothM ??= new THREE.MeshStandardMaterial({ name: 'People', vertexColors: true, roughness: 0.8, metalness: 0 }));
let boatM = null;
const boatMaterial = () => (boatM ??= new THREE.MeshStandardMaterial({ name: 'Boat', vertexColors: true, roughness: 0.74, metalness: 0 }));
const part = (geometry, color) => ({ mesh: new THREE.Mesh(geometry), color });

/** Shared materials for the apples (also used by the apples on the table); the stem and leaf share the people's. */
export function appleMaterials() {
  return {
    skin: new THREE.MeshPhysicalMaterial({ name: 'Apple', color: '#c92a2a', roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
    detail: clothMaterial(),
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
  const stem = part(new THREE.CylinderGeometry(r * 0.05, r * 0.07, r * 0.42, 6), '#5a3d23');
  stem.mesh.position.set(r * 0.03, r * 0.95, 0);
  stem.mesh.rotation.z = -0.25;
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(r * 0.28, r * 0.2, r * 0.6, 0);
  leafShape.quadraticCurveTo(r * 0.28, -r * 0.18, 0, 0);
  // the leaf: a flat shape with a face on each side (so it needs no double-sided material)
  const face = new THREE.ShapeGeometry(leafShape, 6);
  const back = face.clone();
  back.index.array.reverse(); // the other winding: it faces the other way
  const n = back.attributes.normal.array;
  for (let i = 0; i < n.length; i++) n[i] = -n[i];
  const leaf = part(face, '#2f9e44');
  const leafBack = part(back, '#2b8a3e');
  for (const l of [leaf, leafBack]) {
    l.mesh.position.set(r * 0.08, r * 1.02, 0);
    l.mesh.rotation.set(0.3, 0.4, 0.35);
  }
  const detail = new THREE.Mesh(bakeParts([stem, leaf, leafBack]), M.detail);
  detail.name = 'AppleStemLeaf';
  root.add(body, detail);
  return root;
}

/**
 * A small wooden boat, `len` long, floating: its keel a little below y = 0 (the sea), its deck `deck` above it
 * (painted like a Bangladeshi নৌকা: a red and blue band).
 */
function createBoat(len) {
  const h = len * 0.2;
  const side = new THREE.Shape();
  side.moveTo(-len / 2, h * 0.55);
  side.quadraticCurveTo(-len * 0.38, -h * 0.45, 0, -h * 0.45);
  side.quadraticCurveTo(len * 0.38, -h * 0.45, len / 2, h * 0.55);
  side.lineTo(len * 0.42, h * 0.3);
  side.lineTo(-len * 0.42, h * 0.3);
  side.closePath();
  const depth = len * 0.34;
  const hull = part(
    new THREE.ExtrudeGeometry(side, {
      depth,
      bevelEnabled: true,
      bevelSize: len * 0.02,
      bevelThickness: len * 0.02,
      bevelSegments: 2,
      curveSegments: 10,
    }),
    '#8a5a33',
  );
  hull.mesh.position.z = -depth / 2;
  const band = part(new THREE.BoxGeometry(len * 0.62, h * 0.16, depth + len * 0.05), '#c2255c');
  band.mesh.position.y = h * 0.12;
  const band2 = part(new THREE.BoxGeometry(len * 0.5, h * 0.12, depth + len * 0.055), '#1c7ed6');
  band2.mesh.position.y = -h * 0.08;
  const g = new THREE.Mesh(bakeParts([hull, band, band2]), boatMaterial());
  g.name = 'Boat';
  g.position.y = h * 0.2; // the keel a little under the water; the deck (the inside of the hull) at h * 0.5
  g.userData.deck = h * 0.5;
  return g;
}

/**
 * One person, H tall, in the given clothes, holding an apple out to one side (+x: the viewer's right in the front
 * view). The body is one mesh (vertex colours); the apple and the boat are apart (the apple falls, the boat comes
 * and goes).
 *   clothes: { top, legs, skin, hair, hood? }   (hood: a parka's fur-trimmed hood, for the poles)
 */
export function createPerson({ H, clothes, apple: appleM, name = 'Person' }) {
  const root = new THREE.Group();
  root.name = name;
  const body = new THREE.Group(); // lifted onto the boat's deck at sea
  body.name = `${name}Body`;
  root.add(body);
  const C = { top: clothes.top, legs: clothes.legs, skin: clothes.skin ?? '#b27b50', hair: clothes.hair ?? '#1f1f22', shoe: '#2b2f36' };
  const parts = [];
  const add = (geometry, color) => {
    const p = part(geometry, color);
    parts.push(p);
    return p.mesh;
  };
  const capsule = (r, len, color) => add(new THREE.CapsuleGeometry(r, len, 4, 10), color);

  // legs and shoes (sturdy, cartoon proportions: they must read at a few dozen pixels on a phone)
  for (const sx of [-1, 1]) {
    capsule(H * 0.066, H * 0.27, C.legs).position.set(sx * H * 0.075, H * 0.2, 0);
    add(new THREE.BoxGeometry(H * 0.13, H * 0.06, H * 0.18), C.shoe).position.set(sx * H * 0.078, H * 0.03, H * 0.025);
  }
  // body
  const torso = capsule(H * 0.15, H * 0.15, C.top);
  torso.scale.z = 0.66;
  torso.position.y = H * 0.53;
  // arms: one down by the side, the other held out with the apple
  const armL = capsule(H * 0.052, H * 0.22, C.top);
  armL.position.set(-H * 0.185, H * 0.5, 0);
  armL.rotation.z = -0.16;
  add(new THREE.SphereGeometry(H * 0.055, 10, 8), C.skin).position.set(-H * 0.21, H * 0.35, 0);
  const shoulder = new THREE.Vector3(H * 0.17, H * 0.63, 0);
  const handAt = new THREE.Vector3(H * 0.42, H * 0.78, H * 0.06); // held up and out: a long fall to watch
  const armR = capsule(H * 0.052, shoulder.distanceTo(handAt) - H * 0.05, C.top);
  armR.position.copy(shoulder).add(handAt).multiplyScalar(0.5);
  armR.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), handAt.clone().sub(shoulder).normalize());
  add(new THREE.SphereGeometry(H * 0.055, 10, 8), C.skin).position.copy(handAt);
  // head and hair (or a parka's hood)
  const HEAD_Y = H * 0.84;
  add(new THREE.SphereGeometry(H * 0.13, 20, 16), C.skin).position.y = HEAD_Y;
  if (clothes.hood) {
    const hood = add(new THREE.SphereGeometry(H * 0.158, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), C.top);
    hood.position.y = HEAD_Y;
    hood.rotation.x = -0.5;
    add(new THREE.TorusGeometry(H * 0.13, H * 0.032, 8, 24), '#e9e3d6').position.set(0, HEAD_Y + H * 0.01, H * 0.08);
  } else {
    const hair = add(new THREE.SphereGeometry(H * 0.137, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), C.hair);
    hair.position.y = HEAD_Y + H * 0.01;
    hair.rotation.x = -0.25;
  }
  // eyes: two dots, so the person clearly faces the viewer
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(H * 0.018, 6, 5), C.hair).position.set(sx * H * 0.045, HEAD_Y + H * 0.01, H * 0.12);
  const figure = new THREE.Mesh(bakeParts(parts), clothMaterial());
  figure.name = `${name}Figure`;
  for (const p of parts) p.mesh.geometry.dispose();
  body.add(figure);

  // the apple, resting in the right hand (it is moved in world space when it falls)
  const appleR = H * 0.16; // drawn as big as the head, so its fall reads on a phone
  const apple = createApple(appleR, appleM);
  const appleRest = handAt.clone().add(new THREE.Vector3(H * 0.02, appleR * 0.85, H * 0.03));
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
