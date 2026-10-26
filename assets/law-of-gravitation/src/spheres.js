// The two masses (চিত্র ৩.০৭, drawn as real objects): two solid iron spheres m₁ and m₂ (1,000 kg is a ball 62 cm
// across; 2,000 kg is twice the iron, 1.26 times as wide), each resting on a wooden ring stand on a long bench. The
// bench's front carries a metre scale whose zero is under m₁'s centre; a small pointer under each stand marks its
// centre on the scale, so r (centre to centre) reads off it. In metres; m₁'s centre is at x = 0, m₂'s at x = r.
import * as THREE from 'three';
import { sphereRadius } from './physics.js';

export const BENCH = { x0: -0.62, x1: 2.62, top: 0.2, depth: 0.44 }; // m
const STAND = { r0: 0.15, r1: 0.17, h: 0.08, seat: 0.11, tube: 0.018 };
const SEAT_Y = BENCH.top + STAND.h; // the ring the sphere rests on

/** The height of a sphere's centre resting on its ring stand. */
export const centreY = (R) => SEAT_Y + Math.sqrt(Math.max(0, R * R - STAND.seat * STAND.seat));

/** The bench's metre scale: ticks every 10 cm, longer every 50 cm, numbers every 50 cm (Bangla digits via N). */
function scaleTexture(N, unit, aniso) {
  const len = BENCH.x1 - BENCH.x0;
  const pxPerM = 1400;
  const W = Math.round(len * pxPerM);
  const H = Math.round(BENCH.top * pxPerM);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f7f3e8';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#d9cfb4';
  g.fillRect(0, H - 6, W, 6);
  g.fillStyle = '#20262e';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `600 ${Math.round(H * 0.5)}px "Noto Sans Bengali", Arial, sans-serif`;
  for (let i = Math.ceil(BENCH.x0 * 10); i <= Math.floor(BENCH.x1 * 10); i++) {
    const x = (i / 10 - BENCH.x0) * pxPerM;
    const half = i % 5 === 0;
    const whole = i % 10 === 0;
    const len = whole ? 0.36 : half ? 0.28 : 0.15;
    g.fillRect(x - (whole ? 4 : 3), 0, whole ? 8 : 6, H * len);
    if (half && i >= 0 && i <= 20) g.fillText(N(String(i / 10)), x, H * 0.86);
  }
  g.textAlign = 'left';
  g.font = `600 ${Math.round(H * 0.42)}px "Noto Sans Bengali", Arial, sans-serif`;
  g.fillText(unit, (2.24 - BENCH.x0) * pxPerM, H * 0.84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

/**
 * @param {{ materials: any, N: (s: string) => string, unit: string }} options
 */
export function createSpheres({ materials: M, N, unit }) {
  const root = new THREE.Group();
  root.name = 'TwoMasses';

  // the bench: light wood with the scale on its front face
  const bench = new THREE.Group();
  bench.name = 'Bench';
  const len = BENCH.x1 - BENCH.x0;
  const top = new THREE.Mesh(new THREE.BoxGeometry(len, BENCH.top, BENCH.depth), M.wood);
  top.position.set((BENCH.x0 + BENCH.x1) / 2, BENCH.top / 2, 0);
  top.name = 'BenchTop';
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(len, BENCH.top),
    new THREE.MeshStandardMaterial({ name: 'Scale', map: scaleTexture(N, unit, M.aniso), roughness: 0.7, metalness: 0 }),
  );
  face.position.set((BENCH.x0 + BENCH.x1) / 2, BENCH.top / 2, BENCH.depth / 2 + 0.001);
  face.name = 'MetreScale';
  bench.add(top, face);
  root.add(bench);

  const iron = new THREE.MeshPhysicalMaterial({
    name: 'Iron',
    color: 0x7a8089,
    metalness: 0.9,
    roughness: 0.36,
    clearcoat: 0.25,
    clearcoatRoughness: 0.4,
  });
  const pointerMat = new THREE.MeshStandardMaterial({ name: 'Pointer', color: 0x1d2733, roughness: 0.5 });
  const sphereGeo = new THREE.SphereGeometry(1, 64, 40);
  const standGeo = new THREE.CylinderGeometry(STAND.r0, STAND.r1, STAND.h, 40);
  const seatGeo = new THREE.TorusGeometry(STAND.seat, STAND.tube, 12, 40);
  const pointerGeo = new THREE.ConeGeometry(0.022, 0.04, 3);

  /** One mass: a group at its centre's x on the bench (the stand, the ring, the sphere, the pointer). */
  function mass(name) {
    const group = new THREE.Group();
    group.name = name;
    const stand = new THREE.Mesh(standGeo, M.wood);
    stand.position.y = BENCH.top + STAND.h / 2;
    stand.name = `${name}Stand`;
    const seat = new THREE.Mesh(seatGeo, M.wood);
    seat.rotation.x = Math.PI / 2;
    seat.position.y = SEAT_Y;
    seat.name = `${name}Ring`;
    const ball = new THREE.Mesh(sphereGeo, iron);
    ball.name = `${name}Sphere`;
    // the pointer under the stand, at its centre, on the bench's front edge: it marks the centre on the scale
    const pointer = new THREE.Mesh(pointerGeo, pointerMat);
    pointer.rotation.x = Math.PI; // pointing down
    pointer.position.set(0, BENCH.top + 0.02, BENCH.depth / 2 - 0.006);
    pointer.name = `${name}Pointer`;
    group.add(stand, seat, ball, pointer);
    return { group, ball, R: 0 };
  }
  const m1 = mass('Mass1');
  const m2 = mass('Mass2');
  root.add(m1.group, m2.group);

  const tmp = new THREE.Vector3();
  function setMass(which, kg) {
    const R = sphereRadius(kg);
    which.R = R;
    which.ball.scale.setScalar(R);
    which.ball.position.y = centreY(R);
  }

  return {
    root,
    balls: [m1.ball, m2.ball],
    /** Masses in kg (the spheres grow as cube roots: twice the iron). */
    setMasses(kg1, kg2) {
      setMass(m1, kg1);
      setMass(m2, kg2);
    },
    /** m₂'s centre r m from m₁'s. */
    setR(r) {
      m2.group.position.x = r;
    },
    radius: (i) => (i === 0 ? m1 : m2).R,
    /** Sphere i's centre (world). */
    centre(i, out = tmp) {
      const it = i === 0 ? m1 : m2;
      return out.set(it.group.position.x, centreY(it.R), 0);
    },
    /** Sphere i's top (world). */
    top(i, out = tmp) {
      const it = i === 0 ? m1 : m2;
      return out.set(it.group.position.x, centreY(it.R) + it.R, 0);
    },
    /** A point on the bench's front edge, at x (world): where the scale reads x. */
    scalePoint(x, out = tmp) {
      return out.set(x, BENCH.top * 0.62, BENCH.depth / 2);
    },
  };
}
