// The launcher (metres): a smooth steel plate as wide as the floor, with two low rails that keep the book straight,
// a wooden paddle behind the book and two stretched rubber cords that pull the paddle forward when it is let go.
// The paddle always starts from the same notch and stops at the plate's end, so every push is the same: when it
// lets go, the whole book is on the floor (its front edge at x = 0, where the tape starts) moving at the same speed,
// and from then on only the floor acts on it. The plate's top is the floor's top (y = 0).
import * as THREE from 'three';
import { BOOK, PUSH } from './motion.js';

// where the book waits (its back edge at the paddle, its front at −stroke) and where the paddle stops
const REST_BACK = -PUSH.stroke - BOOK.length;
const STOP_BACK = REST_BACK + PUSH.stroke; // = −BOOK.length: the book's back edge as it is let go
export const PLATE = { x0: REST_BACK - 0.11, x1: STOP_BACK, width: 0.7, thick: 0.03 };
const RAIL_Z = BOOK.width / 2 + 0.012; // the rails just clear the book
const CORD_Z = 0.29; // out near the plate's edges, so the posts never stand between the viewer and the book
const POST_X = PLATE.x1 + 0.045; // the cords' posts stand just past the plate, either side of the book's path
const PADDLE = { depth: 0.022, height: 0.05, width: 2 * CORD_Z + 0.03 };

/**
 * @param {{ materials: ReturnType<typeof import('@shared/student/materials.js').createMaterials> }} options
 */
export function createLauncher({ materials: M }) {
  const root = new THREE.Group();
  root.name = 'Launcher';
  const steel = M.satin.clone();
  steel.name = 'LauncherPlate';
  steel.color.set(0xdfe3e8);
  steel.roughness = 0.32;
  const side = new THREE.MeshStandardMaterial({ name: 'LauncherSide', color: 0x8e98a4, roughness: 0.5, metalness: 0.6 });
  const L = PLATE.x1 - PLATE.x0;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(L, PLATE.thick, PLATE.width), [side, side, steel, side, side, side]);
  plate.position.set((PLATE.x0 + PLATE.x1) / 2, -PLATE.thick / 2, 0);
  root.add(plate);

  // the rails: low square bars on both sides of the book, the whole length of the plate
  const railMat = new THREE.MeshStandardMaterial({ name: 'LauncherRail', color: 0x6c7682, roughness: 0.35, metalness: 0.8 });
  for (const z of [-RAIL_Z, RAIL_Z]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(L - 0.02, 0.008, 0.008), railMat);
    rail.position.set((PLATE.x0 + PLATE.x1) / 2 + 0.01, 0.004, z);
    root.add(rail);
  }

  // the stops: two small steel blocks at the plate's end, where the paddle ends its stroke
  for (const z of [-RAIL_Z, RAIL_Z]) {
    const stop = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.02, 0.016), railMat);
    stop.position.set(STOP_BACK - 0.007, 0.01, z);
    root.add(stop);
  }

  // the posts the cords are tied to
  const postMat = new THREE.MeshStandardMaterial({ name: 'LauncherPost', color: 0x495057, roughness: 0.4, metalness: 0.7 });
  for (const z of [-CORD_Z, CORD_Z]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.07, 16), postMat);
    post.position.set(POST_X, 0.035, z);
    root.add(post);
  }

  // the paddle: a wooden bar across the rails; its lower face pushes the book's back edge
  const paddle = new THREE.Group();
  paddle.name = 'Paddle';
  const bar = new THREE.Mesh(new THREE.BoxGeometry(PADDLE.depth, PADDLE.height, PADDLE.width), M.wood);
  bar.position.set(-PADDLE.depth / 2, PADDLE.height / 2 + 0.0015, 0);
  paddle.add(bar);
  root.add(paddle);

  // the rubber cords: from the paddle's ends to the posts (stretched at rest, short after the push)
  const cordMat = new THREE.MeshStandardMaterial({ name: 'LauncherCord', color: 0xc9772e, roughness: 0.6 });
  const cords = [-CORD_Z, CORD_Z].map(() => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10).rotateZ(Math.PI / 2).translate(0.5, 0, 0), cordMat);
    root.add(m);
    return m;
  });
  const cordY = 0.04;

  /** The paddle's front face at x (its pushing edge); the cords follow (thinner when stretched). */
  function setPaddle(x) {
    paddle.position.x = x;
    const from = x - PADDLE.depth / 2;
    const len = Math.max(0.01, POST_X - from);
    const r = 0.0034 * Math.sqrt(0.24 / Math.max(0.12, len)); // the same rubber, spread over a longer cord
    cords.forEach((c, i) => {
      c.position.set(from, cordY, i ? CORD_Z : -CORD_Z);
      c.scale.set(len, r, r);
    });
  }
  setPaddle(REST_BACK);

  // a big invisible box over the plate and the posts: a finger anywhere on the launcher pushes
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(POST_X - PLATE.x0 + 0.06, 0.14, PLATE.width + 0.06),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.position.set((PLATE.x0 + POST_X) / 2, 0.06, 0);
  hit.userData.noExport = true;
  root.add(hit);

  return { root, hit, paddle, setPaddle, restBack: REST_BACK, stopBack: STOP_BACK };
}
