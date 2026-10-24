// A lab stand clamped to the carrom board's left rail that holds a cricket ball over the board, in metres. The ball
// rests on a small trapdoor at the end of the arm: when the door swings down, the ball is let go and falls freely
// (drop); a plunger on the arm can instead push it off sideways (throw). The floor is y = 0; the board's surface is
// BOARD.surface.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BALL, BOARD } from './motion.js';

export const POLE_X = -(BOARD.half + BOARD.frame / 2); // the stand's rod, on the middle of the left rail
const HINGE_X = BALL.x - 0.045; // the trapdoor's hinge, at the arm's end
const PLUNGER_REST = BALL.x - BALL.r - 0.001; // the plunger's tip just touches the ball

/** The ball's red leather and its cream seam (a raised band round it). */
export function createBall() {
  const root = new THREE.Group();
  root.name = 'CricketBall';
  const leather = new THREE.MeshPhysicalMaterial({ name: 'Leather', color: 0xa3161a, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.35 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL.r, 36, 24), leather);
  root.add(ball);
  const seamMat = new THREE.MeshStandardMaterial({ name: 'Seam', color: 0xf1e7cf, roughness: 0.6 });
  const seam = new THREE.Mesh(new THREE.TorusGeometry(BALL.r * 0.995, 0.0022, 6, 72), seamMat);
  seam.rotation.y = Math.PI / 2.6;
  root.add(seam);
  for (const off of [-0.0042, 0.0042]) {
    // two rows of stitching beside the seam
    const r = Math.sqrt(BALL.r ** 2 - off ** 2);
    const row = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0009, 4, 72), seamMat);
    row.rotation.y = Math.PI / 2.6;
    row.translateZ(off);
    root.add(row);
  }
  return { root, geometry: ball.geometry };
}

export function createStand({ materials: M }) {
  const root = new THREE.Group();
  root.name = 'Stand';
  const ballY = BOARD.surface + BALL.height; // centre of the ball in the holder
  const iron = new THREE.MeshPhysicalMaterial({ name: 'PaintedIron', color: 0x34404d, roughness: 0.5, clearcoat: 0.3 });

  // a clamp on the rail: a block on top, a jaw down the outside, the screw under the rail
  const railTop = BOARD.surface + 0.022;
  const clamp = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.024, 0.07, 3, 0.005), iron);
  clamp.position.set(POLE_X, railTop + 0.012, 0);
  root.add(clamp);
  const jaw = new THREE.Mesh(new RoundedBoxGeometry(0.014, railTop + 0.024, 0.07, 2, 0.004), iron);
  jaw.position.set(POLE_X - 0.052, (railTop + 0.024) / 2, 0);
  root.add(jaw);
  const poleH = ballY + 0.08 - railTop;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, poleH, 20), M.chrome);
  pole.position.set(POLE_X, railTop + poleH / 2, 0);
  root.add(pole);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 10), M.chrome);
  cap.position.set(POLE_X, railTop + poleH, 0);
  root.add(cap);

  // the boss head and the arm, at the height of the ball's centre
  const boss = new THREE.Mesh(new RoundedBoxGeometry(0.034, 0.034, 0.03, 2, 0.004), iron);
  boss.position.set(POLE_X, ballY, 0);
  root.add(boss);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 10), M.steel);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(POLE_X, ballY, 0.028);
  root.add(screw);
  const armEnd = PLUNGER_REST - 0.03;
  const armLen = armEnd - POLE_X;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, armLen, 16), M.chrome);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(POLE_X + armLen / 2, ballY, 0);
  root.add(arm);

  // the plunger's sleeve at the end of the arm, and the rod that slides out of it (+x)
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.026, 20), iron);
  sleeve.rotation.z = Math.PI / 2;
  sleeve.position.set(armEnd + 0.008, ballY, 0);
  root.add(sleeve);
  const plunger = new THREE.Group();
  plunger.position.set(PLUNGER_REST, ballY, 0);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.03, 12), M.steel);
  rod.rotation.z = Math.PI / 2;
  rod.position.x = -0.015;
  const tip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.004, 20),
    new THREE.MeshStandardMaterial({ name: 'Rubber', color: 0x22262b, roughness: 0.8 }),
  );
  tip.rotation.z = Math.PI / 2;
  tip.position.x = -0.002;
  plunger.add(rod, tip);
  root.add(plunger);

  // a bracket down from the sleeve to the trapdoor's hinge; the door is a plate the ball sits on
  const doorY = ballY - BALL.r - 0.003;
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.008, ballY - doorY + 0.004, 0.05), iron);
  bracket.position.set(HINGE_X - 0.004, (ballY + doorY) / 2 - 0.004, 0);
  root.add(bracket);
  const hingePin = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.056, 12), M.steel);
  hingePin.rotation.x = Math.PI / 2;
  hingePin.position.set(HINGE_X, doorY, 0);
  root.add(hingePin);
  const door = new THREE.Group(); // pivots on the hinge; rotation.z < 0 swings it down
  door.position.set(HINGE_X, doorY, 0);
  const plateMat = M.satin.clone();
  plateMat.name = 'DoorPlate';
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.085, 0.005, 0.07, 2, 0.0015), plateMat);
  plate.position.set(0.0425, -0.0025, 0);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0022, 6, 28), iron);
  seat.rotation.x = Math.PI / 2;
  seat.position.set(BALL.x - HINGE_X, 0.0005, 0);
  door.add(plate, seat);
  root.add(door);

  // a big invisible target round the ball and the holder, so a finger finds it
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(BALL.x - 0.02, ballY, 0);
  hit.userData.noExport = true;
  root.add(hit);

  return {
    root,
    hit,
    ballHome: new THREE.Vector3(BALL.x, ballY, BALL.z),
    /** 0 = closed (the ball rests on it), 1 = hanging down (the ball is let go). */
    setDoor(k) {
      door.rotation.z = (-Math.PI / 2) * Math.min(1, Math.max(0, k));
    },
    /** How far the plunger's rod is pushed out, 0…1 (1 = 3 cm). */
    setPlunger(k) {
      plunger.position.x = PLUNGER_REST + 0.03 * Math.min(1, Math.max(0, k));
    },
    /** Where the plunger meets the ball (for the push arrow). */
    plungerTip: new THREE.Vector3(PLUNGER_REST, ballY, 0),
  };
}
