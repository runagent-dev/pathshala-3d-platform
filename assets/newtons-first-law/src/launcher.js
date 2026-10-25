// The launcher (metres): a smooth steel plate as wide as the floor, two low rails that keep the book straight, and a
// wooden paddle pushed by a coil spring. Before every push the spring is squeezed to the same red notch and held
// there by two red latch pins, so every push is the same: the pins drop, the spring drives the paddle 0.3 m to the
// stops at the plate's end, and the book leaves with its whole length already on the floor (its front edge at x = 0,
// where the tape starts). From then on only the floor acts on it. The plate's top is the floor's top (y = 0).
import * as THREE from 'three';
import { BOOK, PUSH } from './motion.js';

// where the book waits (its back edge at the paddle, its front at −stroke) and where the paddle stops
const REST_BACK = -PUSH.stroke - BOOK.length;
const STOP_BACK = REST_BACK + PUSH.stroke; // = −BOOK.length: the book's back edge as it is let go
export const PLATE = { x0: REST_BACK - 0.15, x1: STOP_BACK, width: 0.5, thick: 0.03 };
const RAIL_Z = BOOK.width / 2 + 0.012; // the rails just clear the book
const PIN_Z = RAIL_Z + 0.035; // the latch pins, beside the rails
const PADDLE = { depth: 0.022, height: 0.05, width: 2 * PIN_Z + 0.04 };
const BLOCK = { x0: PLATE.x0 + 0.004, depth: 0.036, height: 0.062, width: 0.2 }; // the spring's back block
const SPRING = { radius: 0.022, wire: 0.0032, turns: 11, y: 0.03 };
const RED = 0xd6336c;

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
    const rail = new THREE.Mesh(new THREE.BoxGeometry(L - 0.06, 0.008, 0.008), railMat);
    rail.position.set((PLATE.x0 + PLATE.x1) / 2 + 0.03, 0.004, z);
    root.add(rail);
  }

  // the stops at the plate's end, where the paddle ends its stroke
  for (const z of [-PIN_Z, PIN_Z]) {
    const stop = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.026, 0.02), railMat);
    stop.position.set(STOP_BACK + 0.008, 0.013, z);
    root.add(stop);
  }

  // the red notch the paddle is always pulled back to (painted across the plate under the paddle's face)
  const red = new THREE.MeshStandardMaterial({ name: 'LauncherRed', color: RED, roughness: 0.45 });
  const notch = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.001, PADDLE.width + 0.04), red);
  notch.position.set(REST_BACK - 0.004, 0.0006, 0);
  root.add(notch);

  // the latch pins that hold the paddle at the notch; they drop into the plate to let it go
  const pins = [-PIN_Z, PIN_Z].map((z) => {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.034, 14), red);
    pin.position.set(REST_BACK + 0.008, 0.017, z);
    root.add(pin);
    return pin;
  });

  // the spring's back block (wood), bolted to the plate
  const block = new THREE.Mesh(new THREE.BoxGeometry(BLOCK.depth, BLOCK.height, BLOCK.width), M.wood);
  block.position.set(BLOCK.x0 + BLOCK.depth / 2, BLOCK.height / 2, 0);
  root.add(block);

  // the paddle: a wooden bar across the rails; its face pushes the book's back edge
  const paddle = new THREE.Group();
  paddle.name = 'Paddle';
  const bar = new THREE.Mesh(new THREE.BoxGeometry(PADDLE.depth, PADDLE.height, PADDLE.width), M.wood);
  bar.position.set(-PADDLE.depth / 2, PADDLE.height / 2 + 0.0015, 0);
  paddle.add(bar);
  root.add(paddle);

  // the coil spring between the block and the paddle: rebuilt as it stretches, so its coils open up
  const springMat = new THREE.MeshStandardMaterial({ name: 'LauncherSpring', color: 0xb8c0ca, metalness: 0.9, roughness: 0.3 });
  const spring = new THREE.Mesh(new THREE.BufferGeometry(), springMat);
  spring.name = 'Spring';
  root.add(spring);
  let springLength = -1;
  function buildSpring(len) {
    if (Math.abs(len - springLength) < 0.002) return;
    springLength = len;
    const pts = [];
    const n = SPRING.turns * 18;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * SPRING.turns * Math.PI * 2;
      pts.push(new THREE.Vector3((i / n) * len, Math.sin(a) * SPRING.radius, Math.cos(a) * SPRING.radius));
    }
    spring.geometry.dispose();
    spring.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, SPRING.wire, 6, false);
  }
  const springStart = BLOCK.x0 + BLOCK.depth;

  /** The paddle's front face at x (its pushing edge); the spring follows. */
  function setPaddle(x) {
    paddle.position.x = x;
    buildSpring(Math.max(0.02, x - PADDLE.depth - springStart));
    spring.position.set(springStart, SPRING.y, 0);
  }
  setPaddle(REST_BACK);

  /** The latch pins up (true: holding the paddle) or down in the plate. */
  function setLatch(up) {
    for (const p of pins) p.position.y = up ? 0.017 : -0.02;
  }

  // a big invisible box over the plate: a finger anywhere on the launcher pushes
  const hit = new THREE.Mesh(new THREE.BoxGeometry(L + 0.08, 0.14, PLATE.width + 0.06), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set((PLATE.x0 + PLATE.x1) / 2 + 0.02, 0.06, 0);
  hit.userData.noExport = true;
  root.add(hit);

  return { root, hit, setPaddle, setLatch, restBack: REST_BACK, stopBack: STOP_BACK };
}
