// A commuter train car, procedural three.js, in metres: 16 m long, a driver's cab at each end, white with a
// green band, two bogies on broad-gauge wheels (1.676 m, as on Bangladesh's railways). The nose is at x = 0 (the
// train's position is where its nose is), the tail at x = −16; the wheels stand on the rails' top at y = 0.
// createTrain({ ghost }) also makes the "ghost": the same car in the colour of the average velocity, see-through,
// for the train that runs the whole time at V.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TRAIN_LENGTH } from './motion.js';

const L = TRAIN_LENGTH;
const W = 2.9; // body width
const FLOOR = 1.12; // bottom of the body above the rails
const ROOF = 3.85;
const BEVEL = 0.1;
export const GAUGE = 1.676;
const WHEEL_R = 0.46;
const BOGIES = [-3.1, -12.9];

/** The car's side outline (x along the track, y up), with a raked windscreen at both ends. */
function sideShape() {
  const s = new THREE.Shape();
  const f = -BEVEL; // the bevel adds BEVEL all round: the nose ends at x = 0
  const r = -L + BEVEL;
  s.moveTo(r, FLOOR + BEVEL);
  s.lineTo(f, FLOOR + BEVEL);
  s.lineTo(f, 1.95);
  s.quadraticCurveTo(f - 0.02, 2.3, f - 0.38, 2.78);
  s.lineTo(f - 1.0, 3.5);
  s.quadraticCurveTo(f - 1.3, ROOF - BEVEL, f - 1.85, ROOF - BEVEL);
  s.lineTo(r + 1.85, ROOF - BEVEL);
  s.quadraticCurveTo(r + 1.3, ROOF - BEVEL, r + 1.0, 3.5);
  s.lineTo(r + 0.38, 2.78);
  s.quadraticCurveTo(r + 0.02, 2.3, r, 1.95);
  s.lineTo(r, FLOOR + BEVEL);
  return s;
}

/** The livery on the sides (windows, doors, the green band) as a texture laid on the side outline. */
function liveryTexture() {
  const PX = 128; // px per metre
  const c = document.createElement('canvas');
  c.width = L * PX;
  c.height = Math.round((ROOF - FLOOR) * PX);
  const ctx = c.getContext('2d');
  const X = (x) => (x + L) * PX; // car x (m) → canvas px
  const Y = (y) => (ROOF - y) * PX; // height (m) → canvas px (down)
  const rect = (x0, y0, x1, y1, r) => {
    ctx.beginPath();
    ctx.roundRect(X(x0), Y(y1), (x1 - x0) * PX, (y1 - y0) * PX, r * PX);
  };
  // the band along the car, under the windows, and a thin line over it
  ctx.fillStyle = '#1f7a4d';
  ctx.fillRect(0, Y(1.78), c.width, 0.34 * PX);
  ctx.fillStyle = '#e8590c';
  ctx.fillRect(0, Y(1.9), c.width, 0.06 * PX);
  // doors: grey panels with a window
  for (const d of [-3.35, -12.65]) {
    rect(d - 0.66, 1.2, d + 0.66, 3.32, 0.08);
    ctx.fillStyle = '#d5dade';
    ctx.fill();
    ctx.strokeStyle = '#59626c';
    ctx.lineWidth = 0.035 * PX;
    ctx.stroke();
    ctx.fillStyle = '#59626c';
    ctx.fillRect(X(d) - 1, Y(3.25), 2, 2.0 * PX);
    for (const k of [-1, 1]) {
      rect(d + k * 0.33 - 0.22, 2.35, d + k * 0.33 + 0.22, 3.12, 0.06);
      ctx.fillStyle = '#25303c';
      ctx.fill();
    }
  }
  // passenger windows between the doors, and a small window in each cab
  ctx.fillStyle = '#25303c';
  for (let i = 0; i < 4; i++) {
    const x0 = -11.75 + i * 1.95;
    rect(x0, 2.32, x0 + 1.65, 3.18, 0.12);
    ctx.fill();
  }
  for (const x0 of [-2.3, -14.65]) {
    rect(x0, 2.42, x0 + 0.95, 3.12, 0.1);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** The dark glass on a raked end (front: the nose at x = 0; else the tail), just outside the rounded body. */
function windscreenGeometry(front) {
  const a = [-0.5, 2.81]; // along the rake of sideShape(), from just above the lamps to under the roof
  const b = [-1.07, 3.47];
  const n = [b[1] - a[1], -(b[0] - a[0])];
  const k = (BEVEL + 0.012) / Math.hypot(n[0], n[1]); // the bevel puts the surface BEVEL further out
  const hw = (W - 0.6) / 2;
  const x = (p) => (front ? p[0] + n[0] * k : -L - (p[0] + n[0] * k));
  const y = (p) => p[1] + n[1] * k;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([x(a), y(a), -hw, x(a), y(a), hw, x(b), y(b), hw, x(b), y(b), -hw], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
}

/**
 * A train car. Returns { root, hit } where hit is a big invisible box round the car for touches.
 * ghost: one see-through material in `color` for every part.
 */
export function createTrain({ ghost = false, color = '#c2255c' } = {}) {
  const root = new THREE.Group();
  root.name = ghost ? 'TrainAtAverageVelocity' : 'Train';

  const ghostMat = ghost
    ? new THREE.MeshStandardMaterial({ name: 'Ghost', color, roughness: 0.6, metalness: 0, transparent: true, opacity: 0.32, depthWrite: true })
    : null;
  const mat = (m) => ghostMat || m;
  const body = mat(
    new THREE.MeshPhysicalMaterial({ name: 'Paint', color: 0xf2f3f1, roughness: 0.38, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.25 }),
  );
  const dark = mat(new THREE.MeshStandardMaterial({ name: 'Underframe', color: 0x3b4148, roughness: 0.7, metalness: 0.2 }));
  const steel = mat(new THREE.MeshStandardMaterial({ name: 'Wheel', color: 0x7d858d, roughness: 0.35, metalness: 0.85 }));
  const roofGrey = mat(new THREE.MeshStandardMaterial({ name: 'Roof', color: 0xb9bfc5, roughness: 0.6, metalness: 0.1 }));

  // body: the outline extruded across the car, rounded at the edges
  const shape = sideShape();
  const depth = W - 2 * BEVEL;
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 2,
    curveSegments: 6,
  });
  bodyGeo.translate(0, 0, -depth / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, body);
  bodyMesh.name = 'Body';
  root.add(bodyMesh);

  if (!ghost) {
    // the livery on both sides, laid exactly on the side outline
    const decalGeo = new THREE.ShapeGeometry(shape, 6);
    const pos = decalGeo.attributes.position;
    const uv = decalGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + L) / L, (pos.getY(i) - FLOOR) / (ROOF - FLOOR));
    const livery = new THREE.MeshStandardMaterial({
      name: 'Livery',
      map: liveryTexture(),
      transparent: true,
      roughness: 0.3,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const near = new THREE.Mesh(decalGeo, livery);
    near.position.z = W / 2 + 0.004;
    // the car is the same at both ends: turned half round about its middle, the livery fits the other side
    const far = new THREE.Mesh(decalGeo, livery);
    far.rotation.y = Math.PI;
    far.position.set(-L, 0, -W / 2 - 0.004);
    near.name = far.name = 'Livery';
    root.add(near, far);

    const glass = new THREE.MeshPhysicalMaterial({ name: 'Glass', color: 0x1c2631, roughness: 0.12, metalness: 0.3, side: THREE.DoubleSide });
    for (const front of [true, false]) {
      const w = new THREE.Mesh(windscreenGeometry(front), glass);
      w.name = 'Windscreen';
      root.add(w);
    }

    // lamps: white at the front, red at the back
    const lampGeo = new THREE.CircleGeometry(0.11, 16);
    const white = new THREE.MeshBasicMaterial({ name: 'Headlamp', color: 0xfffbe8 });
    const red = new THREE.MeshBasicMaterial({ name: 'TailLamp', color: 0xd9363e });
    for (const z of [-0.95, 0.95]) {
      const h = new THREE.Mesh(lampGeo, white);
      h.position.set(0.006, 1.62, z);
      h.rotation.y = Math.PI / 2;
      const tl = new THREE.Mesh(lampGeo, red);
      tl.position.set(-L - 0.006, 1.62, z);
      tl.rotation.y = -Math.PI / 2;
      root.add(h, tl);
    }
  }

  // underframe skirt, roof units and the pantograph
  const skirt = new THREE.Mesh(new RoundedBoxGeometry(L - 1.4, 0.42, W - 0.35, 2, 0.06), dark);
  skirt.position.set(-L / 2, FLOOR - 0.12, 0);
  root.add(skirt);
  for (const x of [-4.2, -11.8]) {
    const unit = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.3, 1.7, 2, 0.1), roofGrey);
    unit.position.set(x, ROOF + 0.1, 0);
    root.add(unit);
  }
  const panto = new THREE.Group();
  const bar = (len, x, y, rot) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), dark);
    m.position.set(x, y, 0);
    m.rotation.z = rot;
    return m;
  };
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.9), dark);
  base.position.y = 0.07;
  panto.add(base, bar(1.25, -0.42, 0.42, 0.62), bar(1.1, -0.38, 0.88, -0.7));
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 1.7), steel);
  head.position.set(-0.02, 1.08, 0);
  panto.add(head);
  panto.position.set(-8, ROOF, 0);
  root.add(panto);

  // bogies: a frame and four wheels each, on the rails (wheels at the rails' centre lines)
  const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.14, 22);
  wheelGeo.rotateX(Math.PI / 2);
  const frameGeo = new THREE.BoxGeometry(2.9, 0.26, 0.12);
  const beamGeo = new THREE.BoxGeometry(0.5, 0.3, GAUGE + 0.5);
  const railZ = GAUGE / 2 + 0.036;
  for (const bx of BOGIES) {
    for (const side of [-1, 1]) {
      const frame = new THREE.Mesh(frameGeo, dark);
      frame.position.set(bx, 0.62, side * (railZ + 0.17));
      root.add(frame);
      for (const dx of [-1.1, 1.1]) {
        const w = new THREE.Mesh(wheelGeo, steel);
        w.position.set(bx + dx, WHEEL_R, side * railZ);
        root.add(w);
      }
    }
    const beam = new THREE.Mesh(beamGeo, dark);
    beam.position.set(bx, 0.85, 0);
    root.add(beam);
  }

  // a big invisible box round the car: a finger anywhere on it takes the train
  const hit = new THREE.Mesh(new THREE.BoxGeometry(L + 3, ROOF + 2.5, W + 2.5), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(-L / 2 + 0.5, ROOF / 2 + 0.4, 0);
  hit.userData.noExport = true;
  hit.name = 'TouchArea';
  root.add(hit);

  if (!ghost)
    root.traverse((m) => {
      if (m instanceof THREE.Mesh && m !== hit && !(m.material instanceof THREE.MeshBasicMaterial)) m.castShadow = true;
    });

  return { root, hit, height: ROOF + 0.25, length: L };
}
